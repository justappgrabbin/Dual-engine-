"""
TransformerCollapseNet: Neural Collapse Engine with Free/Open Source Transformers
"""

import torch
import torch.nn as nn
from transformers import AutoModel, AutoConfig
from typing import Dict, List, Tuple, Optional
import math


class PositionalEncoding(nn.Module):
    def __init__(self, d_model: int, max_len: int = 5000):
        super().__init__()
        pe = torch.zeros(max_len, d_model)
        position = torch.arange(0, max_len, dtype=torch.float).unsqueeze(1)
        div_term = torch.exp(torch.arange(0, d_model, 2).float() * (-math.log(10000.0) / d_model))
        pe[:, 0::2] = torch.sin(position * div_term)
        pe[:, 1::2] = torch.cos(position * div_term)
        pe = pe.unsqueeze(0)
        self.register_buffer('pe', pe)

    def forward(self, x):
        return x + self.pe[:, :x.size(1), :]


class EventEncoder(nn.Module):
    def __init__(self, n_planets=14, n_gates=64, n_aspects=6, d_model=256, dropout=0.1):
        super().__init__()
        self.d_model = d_model
        self.planet_emb = nn.Embedding(n_planets, d_model // 4)
        self.gate_emb = nn.Embedding(n_gates + 1, d_model // 2)
        self.aspect_emb = nn.Embedding(n_aspects, d_model // 8)
        self.strength_proj = nn.Linear(1, d_model // 8)
        self.fusion = nn.Sequential(
            nn.Linear(d_model, d_model),
            nn.LayerNorm(d_model),
            nn.GELU(),
            nn.Dropout(dropout)
        )
        self.pos_encoder = PositionalEncoding(d_model)

    def forward(self, planets, gates, aspects, strengths):
        p = self.planet_emb(planets)
        g = self.gate_emb(gates)
        a = self.aspect_emb(aspects)
        s = self.strength_proj(strengths)
        x = torch.cat([p, g, a, s], dim=-1)
        x = self.fusion(x)
        x = self.pos_encoder(x)
        return x


class StateEncoder(nn.Module):
    def __init__(self, n_centers=9, d_model=256, dropout=0.1):
        super().__init__()
        input_dim = n_centers * 2 + 1 + 3 + 3 + 1  # 26
        self.encoder = nn.Sequential(
            nn.Linear(input_dim, d_model),
            nn.LayerNorm(d_model),
            nn.GELU(),
            nn.Dropout(dropout),
            nn.Linear(d_model, d_model),
            nn.LayerNorm(d_model),
            nn.GELU()
        )

    def forward(self, state):
        return self.encoder(state)


class TransformerCollapseNet(nn.Module):
    def __init__(self, model_name="distilbert-base-uncased", d_model=768, n_layers=6,
                 n_heads=12, dropout=0.1, n_centers=9, use_pretrained=True):
        super().__init__()
        self.d_model = d_model
        self.n_centers = n_centers

        self.event_encoder = EventEncoder(14, 64, 6, d_model, dropout)
        self.state_encoder = StateEncoder(n_centers, d_model, dropout)

        if use_pretrained and model_name:
            self.config = AutoConfig.from_pretrained(model_name)
            self.transformer = AutoModel.from_pretrained(model_name, add_pooling_layer=False)
            self.input_adapter = nn.Linear(d_model, self.config.hidden_size)
            d_transformer = self.config.hidden_size
        else:
            encoder_layer = nn.TransformerEncoderLayer(
                d_model=d_model, nhead=n_heads, dim_feedforward=d_model*4,
                dropout=dropout, activation='gelu', batch_first=True)
            self.transformer = nn.TransformerEncoder(encoder_layer, num_layers=n_layers)
            d_transformer = d_model
            self.input_adapter = nn.Identity()

        self.state_gate = nn.Sequential(nn.Linear(d_transformer + d_model, d_transformer), nn.Sigmoid())

        def head(out):
            return nn.Sequential(
                nn.Linear(d_transformer, d_transformer // 2),
                nn.LayerNorm(d_transformer // 2),
                nn.GELU(), nn.Dropout(dropout),
                nn.Linear(d_transformer // 2, out)
            )

        self.resonance_head = head(n_centers)
        self.collapse_head = head(n_centers)
        self.node_head = head(3)
        self.micro_head = nn.Sequential(
            nn.Linear(d_transformer, d_transformer),
            nn.LayerNorm(d_transformer),
            nn.GELU(), nn.Dropout(dropout),
            nn.Linear(d_transformer, 3 * 64)
        )
        self._init_weights()

    def _init_weights(self):
        for head in [self.resonance_head, self.collapse_head, self.node_head, self.micro_head]:
            for m in head.modules():
                if isinstance(m, nn.Linear):
                    nn.init.xavier_uniform_(m.weight, gain=0.1)
                    if m.bias is not None:
                        nn.init.zeros_(m.bias)

    def forward(self, events, state, attention_mask=None):
        batch_size = state.size(0)
        event_emb = self.event_encoder(events['planets'], events['gates'], events['aspects'], events['strengths'])
        event_emb = self.input_adapter(event_emb)
        state_emb = self.state_encoder(state)

        if hasattr(self.transformer, 'encoder'):
            transformer_out = self.transformer(inputs_embeds=event_emb, attention_mask=attention_mask).last_hidden_state
        else:
            transformer_out = self.transformer(event_emb)

        if attention_mask is not None:
            mask_expanded = attention_mask.unsqueeze(-1).float()
            pooled = (transformer_out * mask_expanded).sum(dim=1) / mask_expanded.sum(dim=1).clamp(min=1)
        else:
            pooled = transformer_out.mean(dim=1)

        gate = self.state_gate(torch.cat([pooled, state_emb], dim=-1))
        combined = gate * pooled + (1 - gate) * self.input_adapter(state_emb)

        return {
            'resonance': self.resonance_head(combined),
            'collapse_logits': self.collapse_head(combined),
            'node_logits': self.node_head(combined),
            'micro_logits': self.micro_head(combined).view(batch_size, 3, 64)
        }

    def predict_with_rules(self, events, state, rule_baseline, attention_mask=None, residual_weight=0.3):
        neural_out = self.forward(events, state, attention_mask)
        return {
            'resonance': (1 - residual_weight) * rule_baseline['resonance'] + residual_weight * neural_out['resonance'],
            'collapse_logits': rule_baseline.get('collapse_logits', torch.zeros_like(neural_out['collapse_logits'])) + residual_weight * neural_out['collapse_logits'],
            'node_logits': rule_baseline.get('node_logits', torch.zeros_like(neural_out['node_logits'])) + neural_out['node_logits'],
            'micro_logits': neural_out['micro_logits'],
        }


class CollapseLoss(nn.Module):
    def __init__(self, resonance_weight=1.0, collapse_weight=0.5, node_weight=0.5, micro_weight=0.3):
        super().__init__()
        self.weights = {'resonance': resonance_weight, 'collapse': collapse_weight, 'node': node_weight, 'micro': micro_weight}
        self.mse = nn.MSELoss()
        self.bce = nn.BCEWithLogitsLoss()
        self.ce = nn.CrossEntropyLoss()

    def forward(self, predictions, targets):
        losses = {
            'resonance': self.mse(predictions['resonance'], targets['resonance_next']),
            'collapse': self.bce(predictions['collapse_logits'], targets['collapse_next'].float()),
            'node': self.ce(predictions['node_logits'], targets['node_next']),
        }
        micro_loss = sum(self.ce(predictions['micro_logits'][:, i, :], targets[f'micro_{d}'])
                        for i, d in enumerate(['spleen', 'ajna', 'solar'])) / 3.0
        losses['micro'] = micro_loss
        total = sum(self.weights[k] * losses[k] for k in losses)
        return total, {k: v.item() for k, v in losses.items()}


def create_model(size="small", use_pretrained=True, **kwargs):
    configs = {
        "tiny":  {"model_name": "prajjwal1/bert-tiny" if use_pretrained else None, "d_model": 128, "n_layers": 2, "n_heads": 2},
        "small": {"model_name": "distilbert-base-uncased" if use_pretrained else None, "d_model": 768, "n_layers": 6, "n_heads": 12},
        "base":  {"model_name": "roberta-base" if use_pretrained else None, "d_model": 768, "n_layers": 12, "n_heads": 12},
        "large": {"model_name": "roberta-large" if use_pretrained else None, "d_model": 1024, "n_layers": 24, "n_heads": 16},
    }
    if size not in configs:
        raise ValueError(f"Size must be one of {list(configs.keys())}")
    config = {**configs[size], **kwargs}
    return TransformerCollapseNet(**config)
