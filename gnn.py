"""
Human Design Graph Neural Network
GraphSAGE-based GNN with FiLM modulation for heart/mind readouts
Per PDF specification
"""
import torch
import torch.nn as nn
import torch.nn.functional as F
from typing import Dict, Tuple

from .graph import build_edge_index, build_awareness_masks


class GraphSAGELayer(nn.Module):
    """
    GraphSAGE convolution layer.
    Aggregates neighbor features and combines with self features.
    """
    def __init__(self, in_dim: int, out_dim: int, aggr: str = "mean"):
        super().__init__()
        self.in_dim = in_dim
        self.out_dim = out_dim
        self.aggr = aggr
        
        # Linear transformations
        self.lin_self = nn.Linear(in_dim, out_dim, bias=False)
        self.lin_neigh = nn.Linear(in_dim, out_dim, bias=False)
        self.bias = nn.Parameter(torch.zeros(out_dim))
        
        self.reset_parameters()
    
    def reset_parameters(self):
        nn.init.xavier_uniform_(self.lin_self.weight)
        nn.init.xavier_uniform_(self.lin_neigh.weight)
        nn.init.zeros_(self.bias)
    
    def forward(self, x: torch.Tensor, edge_index: torch.Tensor) -> torch.Tensor:
        """
        Args:
            x: Node features [N, in_dim]
            edge_index: Edge indices [2, E]
        Returns:
            Updated node features [N, out_dim]
        """
        num_nodes = x.size(0)
        row, col = edge_index  # row = source, col = target
        
        # Aggregate neighbor features
        if self.aggr == "mean":
            # Count neighbors for each node
            deg = torch.zeros(num_nodes, device=x.device)
            deg.scatter_add_(0, col, torch.ones_like(col, dtype=torch.float))
            deg = deg.clamp(min=1)  # Avoid division by zero
            
            # Sum neighbor features
            neigh_sum = torch.zeros(num_nodes, self.in_dim, device=x.device)
            neigh_sum.scatter_add_(0, col.unsqueeze(-1).expand(-1, self.in_dim), x[row])
            
            # Mean aggregation
            neigh_agg = neigh_sum / deg.unsqueeze(-1)
        else:
            # Max aggregation
            neigh_agg = torch.zeros(num_nodes, self.in_dim, device=x.device)
            for i in range(num_nodes):
                mask = col == i
                if mask.any():
                    neigh_agg[i] = x[row[mask]].max(dim=0)[0]
        
        # Combine self and neighbor
        out = self.lin_self(x) + self.lin_neigh(neigh_agg) + self.bias
        return out


class FiLMLayer(nn.Module):
    """
    Feature-wise Linear Modulation (FiLM) layer.
    Computes gamma and beta from conditioning input, applies to features.
    
    Per PDF: γ, β = MLP(one_hot(body_sun_gate) ⊕ one_hot(body_sun_line))
    """
    def __init__(self, cond_dim: int, feature_dim: int, hidden_dim: int = 32):
        super().__init__()
        self.mlp = nn.Sequential(
            nn.Linear(cond_dim, hidden_dim),
            nn.ReLU(),
            nn.Linear(hidden_dim, feature_dim * 2)  # Output gamma and beta
        )
        self.feature_dim = feature_dim
    
    def forward(self, features: torch.Tensor, conditioning: torch.Tensor) -> torch.Tensor:
        """
        Args:
            features: [N, feature_dim] or [feature_dim]
            conditioning: [cond_dim] - Sun encoding
        Returns:
            Modulated features
        """
        params = self.mlp(conditioning)
        gamma = params[:self.feature_dim]
        beta = params[self.feature_dim:]
        
        # Apply modulation: gamma * features + beta
        return gamma * features + beta


class AwarenessHead(nn.Module):
    """
    Pooling head for a specific awareness center.
    Uses attention pooling over the subset of gates.
    """
    def __init__(self, hidden_dim: int, num_gates: int):
        super().__init__()
        self.attention = nn.Sequential(
            nn.Linear(hidden_dim, hidden_dim // 2),
            nn.Tanh(),
            nn.Linear(hidden_dim // 2, 1)
        )
        self.output = nn.Linear(hidden_dim, 1)
        self.num_gates = num_gates
    
    def forward(self, node_features: torch.Tensor, mask: torch.Tensor) -> torch.Tensor:
        """
        Args:
            node_features: [64, hidden_dim]
            mask: [64] - binary mask for which gates belong to this awareness
        Returns:
            Awareness score [1]
        """
        # Use masked attention without conditional branching (ONNX-compatible)
        # Expand mask to match feature dims
        mask_expanded = mask.unsqueeze(-1)  # [64, 1]
        
        # Mask features (set non-relevant to zero)
        masked_features = node_features * mask_expanded  # [64, hidden_dim]
        
        # Attention scores for all nodes
        attn_scores = self.attention(masked_features)  # [64, 1]
        
        # Apply mask to attention (set non-relevant to -inf for softmax)
        attn_scores = attn_scores + (1 - mask_expanded) * (-1e9)
        attn_weights = F.softmax(attn_scores, dim=0)  # [64, 1]
        
        # Weighted sum
        pooled = (attn_weights * masked_features).sum(dim=0)  # [hidden_dim]
        
        # Output score
        score = torch.sigmoid(self.output(pooled))
        return score


class HumanDesignGNN(nn.Module):
    """
    Complete Human Design Graph Neural Network.
    
    Architecture (per PDF):
    1. Node init: concat features -> hidden_dim
    2. Message passing: 2-3 GraphSAGE layers
    3. Readouts:
       - Per-codon logits (64 activation scores)
       - Awareness heads (spleen, ajna, solar_plexus)
       - Heart & Mind with FiLM modulation from body Sun
    """
    def __init__(
        self,
        input_dim: int = 34,
        hidden_dim: int = 64,
        num_layers: int = 3,
        sun_encoding_dim: int = 70,
        dropout: float = 0.1
    ):
        super().__init__()
        
        self.input_dim = input_dim
        self.hidden_dim = hidden_dim
        self.num_layers = num_layers
        
        # Input projection
        self.input_proj = nn.Linear(input_dim, hidden_dim)
        
        # GraphSAGE layers
        self.conv_layers = nn.ModuleList([
            GraphSAGELayer(hidden_dim, hidden_dim) for _ in range(num_layers)
        ])
        
        # Layer normalization
        self.layer_norms = nn.ModuleList([
            nn.LayerNorm(hidden_dim) for _ in range(num_layers)
        ])
        
        self.dropout = nn.Dropout(dropout)
        
        # Per-codon output head
        self.codon_head = nn.Linear(hidden_dim, 1)
        
        # Awareness heads
        self.spleen_head = AwarenessHead(hidden_dim, 6)
        self.ajna_head = AwarenessHead(hidden_dim, 6)
        self.solar_head = AwarenessHead(hidden_dim, 7)
        
        # Heart/Mind heads with FiLM modulation
        self.heart_base = AwarenessHead(hidden_dim, 4)
        self.mind_base = AwarenessHead(hidden_dim, 6)
        
        self.heart_film = FiLMLayer(sun_encoding_dim, 1, hidden_dim=32)
        self.mind_film = FiLMLayer(sun_encoding_dim, 1, hidden_dim=32)
        
        # Store edge index and masks as buffers
        self.register_buffer("edge_index", build_edge_index())
        
        masks = build_awareness_masks()
        self.register_buffer("spleen_mask", masks["spleen"])
        self.register_buffer("ajna_mask", masks["ajna"])
        self.register_buffer("solar_mask", masks["solar_plexus"])
        self.register_buffer("heart_mask", masks["heart"])
        self.register_buffer("mind_mask", masks["mind"])
    
    def forward(
        self,
        node_features: torch.Tensor,
        sun_encoding: torch.Tensor
    ) -> Dict[str, torch.Tensor]:
        """
        Forward pass through the GNN.
        
        Args:
            node_features: [64, input_dim] - Node feature matrix
            sun_encoding: [70] - Body Sun encoding for FiLM
        
        Returns:
            Dict with:
            - codons: [64] - Per-gate activation logits
            - spleen, ajna, solar_plexus: [1] - Awareness scores
            - heart, mind: [1] - FiLM-modulated scores
        """
        # Input projection
        x = self.input_proj(node_features)  # [64, hidden_dim]
        x = F.relu(x)
        
        # Message passing
        for i in range(self.num_layers):
            x_new = self.conv_layers[i](x, self.edge_index)
            x_new = self.layer_norms[i](x_new)
            x_new = F.relu(x_new)
            x_new = self.dropout(x_new)
            x = x + x_new  # Residual connection
        
        # Per-codon logits
        codons = torch.sigmoid(self.codon_head(x).squeeze(-1))  # [64]
        
        # Awareness scores
        spleen = self.spleen_head(x, self.spleen_mask)
        ajna = self.ajna_head(x, self.ajna_mask)
        solar = self.solar_head(x, self.solar_mask)
        
        # Heart/Mind with FiLM modulation
        heart_base = self.heart_base(x, self.heart_mask)
        mind_base = self.mind_base(x, self.mind_mask)
        
        heart = torch.sigmoid(self.heart_film(heart_base, sun_encoding))
        mind = torch.sigmoid(self.mind_film(mind_base, sun_encoding))
        
        return {
            "codons": codons,
            "spleen": spleen,
            "ajna": ajna,
            "solar_plexus": solar,
            "heart": heart,
            "mind": mind,
        }
    
    def get_film_params(self, sun_encoding: torch.Tensor) -> Dict[str, Tuple[torch.Tensor, torch.Tensor]]:
        """Get gamma/beta parameters for debugging/display"""
        heart_params = self.heart_film.mlp(sun_encoding)
        mind_params = self.mind_film.mlp(sun_encoding)
        
        return {
            "heart": (heart_params[:1], heart_params[1:]),
            "mind": (mind_params[:1], mind_params[1:]),
        }


def count_parameters(model: nn.Module) -> int:
    """Count trainable parameters"""
    return sum(p.numel() for p in model.parameters() if p.requires_grad)


if __name__ == "__main__":
    # Test the model
    model = HumanDesignGNN()
    print(f"Model parameters: {count_parameters(model):,}")
    
    # Create dummy inputs
    node_features = torch.randn(64, 34)
    sun_encoding = torch.zeros(70)
    sun_encoding[12] = 1.0  # Gate 13
    sun_encoding[64 + 3] = 1.0  # Line 4
    
    # Forward pass
    outputs = model(node_features, sun_encoding)
    
    print("\nOutput shapes:")
    for key, val in outputs.items():
        print(f"  {key}: {val.shape}")
    
    print("\nSample outputs:")
    print(f"  Codons (first 10): {outputs['codons'][:10].tolist()}")
    print(f"  Spleen: {outputs['spleen'].item():.4f}")
    print(f"  Ajna: {outputs['ajna'].item():.4f}")
    print(f"  Solar Plexus: {outputs['solar_plexus'].item():.4f}")
    print(f"  Heart: {outputs['heart'].item():.4f}")
    print(f"  Mind: {outputs['mind'].item():.4f}")
