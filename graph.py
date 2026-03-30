"""
Human Design Graph Structure
64 nodes (gates/codons) with channel edges per the PDF specification
"""
import torch
import numpy as np
from dataclasses import dataclass
from typing import List, Set, Tuple, Dict, Optional

AWARENESS_SETS = {
    "spleen": {57, 44, 50, 32, 28, 18},
    "ajna": {47, 24, 4, 17, 11, 43},
    "solar_plexus": {55, 49, 37, 22, 30, 36, 6},
}

HEART_GATES = {21, 51, 26, 40}
MIND_GATES = {47, 24, 4, 17, 11, 43}

CHANNEL_EDGES = [
    (1, 8), (2, 14), (3, 60), (4, 63), (5, 15), (6, 59), (7, 31),
    (9, 52), (10, 20), (10, 34), (10, 57), (11, 56), (12, 22), (13, 33),
    (16, 48), (17, 62), (18, 58), (19, 49), (20, 34), (20, 57), (21, 45),
    (23, 43), (24, 61), (25, 51), (26, 44), (27, 50), (28, 38), (29, 46),
    (30, 41), (32, 54), (34, 57), (35, 36), (37, 40), (39, 55), (42, 53),
    (47, 64)
]

PLANETS = [
    "Sun", "Earth", "Moon", "Mercury", "Venus", "Mars",
    "Jupiter", "Saturn", "Uranus", "Neptune", "Pluto",
    "North Node", "South Node"
]

CENTERS = ["Head", "Ajna", "Throat", "G", "Heart", "Spleen", "Solar Plexus", "Sacral", "Root"]

GATE_TO_CENTER = {
    1: "G", 2: "G", 3: "Sacral", 4: "Ajna", 5: "Sacral", 6: "Solar Plexus", 7: "G", 8: "Throat",
    9: "Sacral", 10: "G", 11: "Ajna", 12: "Throat", 13: "G", 14: "Sacral", 15: "G", 16: "Throat",
    17: "Ajna", 18: "Spleen", 19: "Root", 20: "Throat", 21: "Heart", 22: "Solar Plexus",
    23: "Throat", 24: "Ajna", 25: "G", 26: "Heart", 27: "Sacral", 28: "Spleen", 29: "Sacral",
    30: "Solar Plexus", 31: "Throat", 32: "Spleen", 33: "Throat", 34: "Sacral", 35: "Throat",
    36: "Solar Plexus", 37: "Solar Plexus", 38: "Root", 39: "Root", 40: "Heart", 41: "Root",
    42: "Sacral", 43: "Ajna", 44: "Spleen", 45: "Throat", 46: "G", 47: "Ajna", 48: "Spleen",
    49: "Solar Plexus", 50: "Spleen", 51: "Heart", 52: "Root", 53: "Root", 54: "Root",
    55: "Solar Plexus", 56: "Throat", 57: "Spleen", 58: "Root", 59: "Sacral", 60: "Root",
    61: "Head", 62: "Throat", 63: "Head", 64: "Head"
}


@dataclass
class Placement:
    planet: str
    stream: str  # "body" or "design"
    gate: int
    line: int


def build_edge_index() -> torch.Tensor:
    """Build edge index tensor for the 64-gate channel graph (bidirectional)"""
    edges = []
    for a, b in CHANNEL_EDGES:
        edges.append([a - 1, b - 1])  # 0-indexed
        edges.append([b - 1, a - 1])  # bidirectional
    return torch.tensor(edges, dtype=torch.long).t().contiguous()


def build_adjacency_matrix() -> torch.Tensor:
    """Build adjacency matrix for the 64-gate graph"""
    adj = torch.zeros(64, 64)
    for a, b in CHANNEL_EDGES:
        adj[a - 1, b - 1] = 1
        adj[b - 1, a - 1] = 1
    return adj


def build_awareness_masks() -> Dict[str, torch.Tensor]:
    """Build masks for awareness pooling (which gates belong to each awareness center)"""
    masks = {}
    for name, gates in AWARENESS_SETS.items():
        mask = torch.zeros(64)
        for g in gates:
            mask[g - 1] = 1
        masks[name] = mask
    
    heart_mask = torch.zeros(64)
    for g in HEART_GATES:
        heart_mask[g - 1] = 1
    masks["heart"] = heart_mask
    
    mind_mask = torch.zeros(64)
    for g in MIND_GATES:
        mind_mask[g - 1] = 1
    masks["mind"] = mind_mask
    
    return masks


def build_node_features(placements: List[Placement]) -> torch.Tensor:
    """
    Build node feature matrix for 64 gates based on placements.
    
    Features per node (per PDF specification):
    - Planet one-hots body: 13 dims (one per planet)
    - Planet one-hots design: 13 dims
    - Line embedding: 6 dims (one-hot)
    - Definition flags: 2 dims (defined_by_placement, defined_by_channel)
    
    Total: 13 + 13 + 6 + 2 = 34 dims per node
    """
    num_planets = len(PLANETS)
    planet_to_idx = {p: i for i, p in enumerate(PLANETS)}
    
    # Initialize feature matrix: 64 nodes x 34 features
    features = torch.zeros(64, 34)
    
    # Track which gates are activated
    activated_gates = set()
    
    for p in placements:
        gate_idx = p.gate - 1  # 0-indexed
        planet_idx = planet_to_idx.get(p.planet, 0)
        
        activated_gates.add(p.gate)
        
        if p.stream == "body":
            # Body planet one-hot: dims 0-12
            features[gate_idx, planet_idx] = 1.0
        else:
            # Design planet one-hot: dims 13-25
            features[gate_idx, num_planets + planet_idx] = 1.0
        
        # Line one-hot: dims 26-31
        line_idx = 26 + (p.line - 1)
        features[gate_idx, line_idx] = 1.0
        
        # Definition flag (defined by placement): dim 32
        features[gate_idx, 32] = 1.0
    
    # Check channel definitions
    for a, b in CHANNEL_EDGES:
        if a in activated_gates and b in activated_gates:
            # Both ends activated = channel defined
            features[a - 1, 33] = 1.0  # defined_by_channel
            features[b - 1, 33] = 1.0
    
    return features


def build_sun_encoding(sun_gate: int, sun_line: int) -> torch.Tensor:
    """
    Build encoding for body Sun position (for FiLM modulation).
    One-hot gate (64 dims) + one-hot line (6 dims) = 70 dims
    """
    encoding = torch.zeros(70)
    encoding[sun_gate - 1] = 1.0  # Gate one-hot
    encoding[64 + sun_line - 1] = 1.0  # Line one-hot
    return encoding


def find_body_sun(placements: List[Placement]) -> Tuple[int, int]:
    """Find the body Sun placement, return (gate, line)"""
    for p in placements:
        if p.planet == "Sun" and p.stream == "body":
            return p.gate, p.line
    return 1, 1  # Default


if __name__ == "__main__":
    # Test
    edge_index = build_edge_index()
    print(f"Edge index shape: {edge_index.shape}")
    print(f"Number of edges: {edge_index.shape[1]}")
    
    masks = build_awareness_masks()
    for name, mask in masks.items():
        print(f"{name} mask: {mask.sum().item()} gates")
    
    # Test with sample placements
    test_placements = [
        Placement("Sun", "body", 13, 4),
        Placement("Earth", "body", 7, 4),
        Placement("Moon", "body", 29, 5),
    ]
    
    features = build_node_features(test_placements)
    print(f"Node features shape: {features.shape}")
    print(f"Activated gates: {(features[:, 32] == 1).sum().item()}")
