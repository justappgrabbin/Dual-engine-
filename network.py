"""
Quantum Graph Neural Network
The neural substrate implementing virtual particle mechanics
"""

import torch
import torch.nn as nn
import torch.nn.functional as F
from typing import Dict, Tuple

class GraphSAGEConv(nn.Module):
    """GraphSAGE convolution without torch_geometric dependency"""
    
    def __init__(self, in_channels: int, out_channels: int):
        super().__init__()
        self.in_channels = in_channels
        self.out_channels = out_channels
        self.lin_self = nn.Linear(in_channels, out_channels)
        self.lin_neigh = nn.Linear(in_channels, out_channels)
        
    def forward(self, x: torch.Tensor, edge_index: torch.Tensor) -> torch.Tensor:
        row, col = edge_index[0], edge_index[1]
        
        deg = torch.zeros(x.size(0), device=x.device)
        deg.scatter_add_(0, row, torch.ones_like(row, dtype=torch.float))
        deg = deg.clamp(min=1)
        
        agg = torch.zeros_like(x)
        agg.index_add_(0, row, x[col])
        agg = agg / deg.unsqueeze(1)
        
        out = self.lin_self(x) + self.lin_neigh(agg)
        return out


class SunFiLM(nn.Module):
    """Feature-wise Linear Modulation by the body Sun."""
    
    def __init__(self, feature_dim: int, sun_dim: int, hidden: int = 64):
        super().__init__()
        self.mlp = nn.Sequential(
            nn.Linear(sun_dim, hidden),
            nn.ReLU(),
            nn.Dropout(0.1),
            nn.Linear(hidden, feature_dim * 2)
        )
        
    def forward(self, x: torch.Tensor, sun_vec: torch.Tensor) -> torch.Tensor:
        params = self.mlp(sun_vec)
        gamma, beta = params.chunk(2, dim=-1)
        return gamma * x + beta


class AwarenessPooling(nn.Module):
    """Attention-based pooling for awareness readouts."""
    
    def __init__(self, hidden_dim: int):
        super().__init__()
        self.attention = nn.Linear(hidden_dim, 1)
        
    def forward(self, node_features: torch.Tensor, mask: torch.Tensor) -> torch.Tensor:
        masked_features = node_features[mask]
        
        if masked_features.shape[0] == 0:
            return torch.zeros(node_features.shape[1], device=node_features.device)
        
        attn_logits = self.attention(masked_features)
        attn_weights = torch.softmax(attn_logits, dim=0)
        
        pooled = (masked_features * attn_weights).sum(dim=0)
        return pooled


class QuantumHDNet(nn.Module):
    """The Quantum Human Design Neural Network."""
    
    def __init__(
        self, 
        input_dim: int = 64,
        hidden_dim: int = 128,
        sun_dim: int = 80,
        num_layers: int = 3
    ):
        super().__init__()
        
        self.input_dim = input_dim
        self.hidden_dim = hidden_dim
        
        self.input_proj = nn.Linear(input_dim, hidden_dim)
        
        self.convs = nn.ModuleList()
        for _ in range(num_layers):
            self.convs.append(GraphSAGEConv(hidden_dim, hidden_dim))
        
        self.norms = nn.ModuleList([
            nn.LayerNorm(hidden_dim) for _ in range(num_layers)
        ])
        
        self.film = SunFiLM(hidden_dim, sun_dim)
        
        self.codon_head = nn.Sequential(
            nn.Linear(hidden_dim, hidden_dim // 2),
            nn.ReLU(),
            nn.Linear(hidden_dim // 2, 1)
        )
        
        self.spleen_pool = AwarenessPooling(hidden_dim)
        self.ajna_pool = AwarenessPooling(hidden_dim)
        self.solar_pool = AwarenessPooling(hidden_dim)
        self.heart_pool = AwarenessPooling(hidden_dim)
        self.mind_pool = AwarenessPooling(hidden_dim)
        
        self.awareness_heads = nn.ModuleDict({
            'spleen': nn.Linear(hidden_dim, 1),
            'ajna': nn.Linear(hidden_dim, 1),
            'solar': nn.Linear(hidden_dim, 1),
            'heart': nn.Linear(hidden_dim, 1),
            'mind': nn.Linear(hidden_dim, 1)
        })
        
    def forward(
        self, 
        x: torch.Tensor,
        edge_index: torch.Tensor,
        sun_context: torch.Tensor,
        masks: Dict[str, torch.Tensor]
    ) -> Tuple[torch.Tensor, Dict[str, torch.Tensor], Dict[str, torch.Tensor], torch.Tensor]:
        
        h = self.input_proj(x)
        h = torch.relu(h)
        
        for conv, norm in zip(self.convs, self.norms):
            h_new = conv(h, edge_index)
            h_new = norm(h_new)
            h = torch.relu(h_new) + h
        
        h_observed = self.film(h, sun_context)
        
        codon_logits = self.codon_head(h_observed).squeeze(-1)
        codon_scores = torch.sigmoid(codon_logits)
        
        spleen_vec = self.spleen_pool(h_observed, masks['spleen'])
        ajna_vec = self.ajna_pool(h_observed, masks['ajna'])
        solar_vec = self.solar_pool(h_observed, masks['solar'])
        heart_vec = self.heart_pool(h_observed, masks['heart'])
        mind_vec = self.mind_pool(h_observed, masks['mind'])
        
        awareness = {
            'spleen': torch.sigmoid(self.awareness_heads['spleen'](spleen_vec)),
            'ajna': torch.sigmoid(self.awareness_heads['ajna'](ajna_vec)),
            'solar': torch.sigmoid(self.awareness_heads['solar'](solar_vec)),
            'heart': torch.sigmoid(self.awareness_heads['heart'](heart_vec)),
            'mind': torch.sigmoid(self.awareness_heads['mind'](mind_vec))
        }
        
        awareness_vectors = {
            'spleen_vec': spleen_vec,
            'ajna_vec': ajna_vec,
            'solar_vec': solar_vec,
            'heart_vec': heart_vec,
            'mind_vec': mind_vec
        }
        
        return codon_scores, awareness, awareness_vectors, h_observed


class QuantumFieldLoss(nn.Module):
    """Loss function that enforces quantum coherence."""
    
    def __init__(self):
        super().__init__()
        
    def forward(
        self,
        codon_scores: torch.Tensor,
        awareness: Dict[str, torch.Tensor],
        target_activations: torch.Tensor = None,
        coherence_weight: float = 0.1
    ) -> Tuple[torch.Tensor, Dict[str, torch.Tensor]]:
        
        losses = {}
        
        if target_activations is not None:
            losses['activation'] = F.binary_cross_entropy(
                codon_scores, target_activations
            )
        
        awareness_sum = sum(v.squeeze() if v.dim() > 0 else v for v in awareness.values())
        losses['coherence'] = coherence_weight * (awareness_sum - 1.5).pow(2)
        
        eps = 1e-8
        codon_entropy = -((codon_scores * torch.log(codon_scores + eps) + 
                          (1 - codon_scores) * torch.log(1 - codon_scores + eps)).mean())
        losses['entropy'] = -0.01 * codon_entropy
        
        total = sum(losses.values())
        return total, losses


def create_model(input_dim: int = 64, hidden_dim: int = 128) -> QuantumHDNet:
    """Factory function to create a quantum HD network"""
    return QuantumHDNet(
        input_dim=input_dim,
        hidden_dim=hidden_dim,
        sun_dim=80,
        num_layers=3
    )
