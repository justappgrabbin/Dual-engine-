"""
Quantum Field Feature Engineering
Converts stellar placements into graph perturbations
"""

import torch
import numpy as np
from typing import List, Dict, Tuple
from .core import Placement, Stream, get_channel_edges, AWARENESS_SYSTEMS, HEART_GATES

class QuantumFieldEncoder:
    """
    Encodes placements as perturbations in the 64-gate quantum field.
    
    Like virtual particles: placements 'borrow' activation energy from the void,
    which propagates through channels and must conserve coherence.
    """
    
    PLANETS = ['Sun', 'Earth', 'Moon', 'Mercury', 'Venus', 'Mars', 
               'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto', 
               'North Node', 'South Node']
    
    def __init__(self, embedding_dim: int = 64):
        self.embedding_dim = embedding_dim
        self.num_planets = len(self.PLANETS)
        self.planet_to_idx = {p: i for i, p in enumerate(self.PLANETS)}
        
    def encode_placements(self, placements: List[Placement]) -> torch.Tensor:
        """Convert placements to node features [64, feature_dim]"""
        node_features = torch.zeros(64, self.embedding_dim)
        
        body_placements = {i: [] for i in range(1, 65)}
        design_placements = {i: [] for i in range(1, 65)}
        
        for p in placements:
            if p.stream == Stream.BODY:
                body_placements[p.gate].append(p)
            else:
                design_placements[p.gate].append(p)
        
        for gate in range(1, 65):
            gate_idx = gate - 1
            features = []
            
            body_feat = self._encode_gate_placements(body_placements[gate])
            features.append(body_feat)
            
            design_feat = self._encode_gate_placements(design_placements[gate])
            features.append(design_feat)
            
            node_features[gate_idx] = torch.cat(features)
            
        return node_features
    
    def _encode_gate_placements(self, placements: List[Placement]) -> torch.Tensor:
        """Encode all placements at a single gate"""
        if not placements:
            return torch.zeros(self.embedding_dim // 2)
        
        planet_vec = torch.zeros(self.num_planets)
        line_vec = torch.zeros(6)
        
        for p in placements:
            if p.planet in self.planet_to_idx:
                planet_idx = self.planet_to_idx[p.planet]
                planet_vec[planet_idx] = 1.0
                line_vec[p.line - 1] += 1.0
        
        if line_vec.sum() > 0:
            line_vec = line_vec / line_vec.sum()
        
        gate_features = torch.cat([planet_vec, line_vec])
        
        pad_size = (self.embedding_dim // 2) - gate_features.shape[0]
        if pad_size > 0:
            gate_features = torch.cat([gate_features, torch.zeros(pad_size)])
        
        return gate_features[:self.embedding_dim // 2]
    
    def encode_sun_context(self, sun_placement: Placement) -> torch.Tensor:
        """Encode the body Sun position for FiLM modulation."""
        gate_vec = torch.zeros(64)
        gate_vec[sun_placement.gate - 1] = 1.0
        
        line_vec = torch.zeros(6)
        line_vec[sun_placement.line - 1] = 1.0
        
        degree_val = torch.tensor([sun_placement.degree / 360.0 if sun_placement.degree else 0.0])
        
        sun_context = torch.cat([
            gate_vec, 
            line_vec, 
            degree_val,
            torch.zeros(9)
        ])
        
        return sun_context
    
    def get_awareness_masks(self) -> Dict[str, torch.Tensor]:
        """Create boolean masks for the awareness systems."""
        masks = {}
        for name, gates in AWARENESS_SYSTEMS.items():
            mask = torch.zeros(64, dtype=torch.bool)
            for gate in gates:
                mask[gate - 1] = True
            masks[name] = mask
        
        heart_mask = torch.zeros(64, dtype=torch.bool)
        for gate in HEART_GATES:
            heart_mask[gate - 1] = True
        masks['heart'] = heart_mask
        
        mind_mask = torch.zeros(64, dtype=torch.bool)
        for gate in AWARENESS_SYSTEMS["ajna"]:
            mind_mask[gate - 1] = True
        masks['mind'] = mind_mask
        
        return masks
    
    def get_edge_index(self) -> torch.Tensor:
        """Get the channel graph as PyTorch Geometric edge_index."""
        edges = get_channel_edges()
        edge_list = [(g1 - 1, g2 - 1) for g1, g2 in edges]
        edge_index = torch.tensor(edge_list, dtype=torch.long).t()
        return edge_index
    
    def compute_definition(self, placements: List[Placement]) -> Dict[str, torch.Tensor]:
        """Compute definition flags for each gate."""
        activated_gates = set()
        for p in placements:
            activated_gates.add(p.gate)
        
        gate_defined = torch.zeros(64, dtype=torch.float32)
        for gate in activated_gates:
            gate_defined[gate - 1] = 1.0
        
        edges = get_channel_edges()
        channel_defined = torch.zeros(64, dtype=torch.float32)
        
        for g1, g2 in edges:
            if g1 in activated_gates and g2 in activated_gates:
                channel_defined[g1 - 1] = 1.0
                channel_defined[g2 - 1] = 1.0
        
        return {
            'gate_defined': gate_defined,
            'channel_defined': channel_defined
        }


def create_intention_perturbation(question: str, base_placements: List[Placement]) -> torch.Tensor:
    """Convert a question/intention into a field perturbation."""
    perturbation = torch.randn(64) * 0.1
    
    encoder = QuantumFieldEncoder()
    base_features = encoder.encode_placements(base_placements)
    
    activation_boost = (base_features.sum(dim=1) > 0).float() * 0.3
    perturbation += activation_boost
    
    return perturbation
