"""
Training pipeline for Human Design GNN.
Uses rule-based label generation for self-supervised learning.
"""
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader
import numpy as np
import random
from typing import List, Dict, Tuple, Optional
from pathlib import Path
import json

import sys
sys.path.insert(0, str(Path(__file__).parent.parent))

from model import (
    HumanDesignGNN,
    Placement,
    build_node_features,
    build_sun_encoding,
    find_body_sun,
    PLANETS,
    AWARENESS_SETS,
    HEART_GATES,
    MIND_GATES,
    CHANNEL_EDGES,
)


def generate_random_placements(num_placements: int = 26) -> List[Placement]:
    """
    Generate random placements for training data.
    Standard HD chart has 26 placements (13 planets x 2 streams).
    """
    placements = []
    for planet in PLANETS:
        for stream in ["body", "design"]:
            gate = random.randint(1, 64)
            line = random.randint(1, 6)
            placements.append(Placement(planet, stream, gate, line))
    return placements


def compute_rule_based_labels(placements: List[Placement]) -> Dict[str, torch.Tensor]:
    """
    Generate training labels using Human Design rules.
    This is the "rule-first, learn-later" approach from the PDF.
    """
    activated_gates = set()
    gate_weights = {}
    
    # Planet weights (Sun most important)
    planet_weights = {
        "Sun": 0.5, "Earth": 0.4, "Moon": 0.35,
        "Mercury": 0.3, "Venus": 0.3, "Mars": 0.25,
        "Jupiter": 0.2, "Saturn": 0.2, "Uranus": 0.15,
        "Neptune": 0.15, "Pluto": 0.15,
        "North Node": 0.1, "South Node": 0.1,
    }
    
    for p in placements:
        activated_gates.add(p.gate)
        weight = planet_weights.get(p.planet, 0.2)
        if p.stream == "body":
            weight *= 1.2  # Body stream slightly more weighted
        
        if p.gate in gate_weights:
            gate_weights[p.gate] = min(1.0, gate_weights[p.gate] + weight)
        else:
            gate_weights[p.gate] = weight
    
    # Channel bonus
    defined_channels = []
    for a, b in CHANNEL_EDGES:
        if a in activated_gates and b in activated_gates:
            defined_channels.append((a, b))
            gate_weights[a] = min(1.0, gate_weights.get(a, 0) + 0.15)
            gate_weights[b] = min(1.0, gate_weights.get(b, 0) + 0.15)
    
    # Build codon labels
    codons = torch.zeros(64)
    for gate, weight in gate_weights.items():
        codons[gate - 1] = weight
    
    # Awareness scores
    def calc_awareness(gate_set):
        activated = [g for g in gate_set if g in activated_gates]
        if not activated:
            return 0.0
        total = sum(gate_weights.get(g, 0) for g in activated)
        return min(1.0, total / len(gate_set) * 1.5)
    
    spleen = torch.tensor([calc_awareness(AWARENESS_SETS["spleen"])])
    ajna = torch.tensor([calc_awareness(AWARENESS_SETS["ajna"])])
    solar = torch.tensor([calc_awareness(AWARENESS_SETS["solar_plexus"])])
    
    # Heart/Mind (will be modulated by FiLM during training)
    heart_activated = [g for g in HEART_GATES if g in activated_gates]
    mind_activated = [g for g in MIND_GATES if g in activated_gates]
    
    heart_base = sum(gate_weights.get(g, 0) for g in heart_activated) / len(HEART_GATES) if heart_activated else 0.0
    mind_base = sum(gate_weights.get(g, 0) for g in mind_activated) / len(MIND_GATES) if mind_activated else 0.0
    
    # Apply FiLM-like modulation based on Sun
    sun_gate, sun_line = find_body_sun(placements)
    seed = (sun_gate * 7 + sun_line * 13) % 97
    gamma = 1.0 + ((seed % 11) - 5) / 50.0
    beta = ((seed % 7) - 3) / 20.0
    
    heart = torch.tensor([min(1.0, max(0.0, gamma * heart_base + beta))])
    mind = torch.tensor([min(1.0, max(0.0, gamma * mind_base + beta))])
    
    return {
        "codons": codons,
        "spleen": spleen,
        "ajna": ajna,
        "solar_plexus": solar,
        "heart": heart,
        "mind": mind,
    }


class HDChartDataset(Dataset):
    """Dataset of Human Design chart samples with rule-based labels."""
    
    def __init__(self, num_samples: int = 1000):
        self.samples = []
        for _ in range(num_samples):
            placements = generate_random_placements()
            node_features = build_node_features(placements)
            sun_gate, sun_line = find_body_sun(placements)
            sun_encoding = build_sun_encoding(sun_gate, sun_line)
            labels = compute_rule_based_labels(placements)
            
            self.samples.append({
                "node_features": node_features,
                "sun_encoding": sun_encoding,
                "labels": labels,
            })
    
    def __len__(self):
        return len(self.samples)
    
    def __getitem__(self, idx):
        return self.samples[idx]


def train_epoch(
    model: HumanDesignGNN,
    dataloader: DataLoader,
    optimizer: optim.Optimizer,
    device: torch.device,
) -> Dict[str, float]:
    """Train for one epoch."""
    model.train()
    total_loss = 0.0
    codon_loss_total = 0.0
    awareness_loss_total = 0.0
    modulator_loss_total = 0.0
    
    for batch in dataloader:
        optimizer.zero_grad()
        
        node_features = batch["node_features"].to(device)
        sun_encoding = batch["sun_encoding"].to(device)
        labels = {k: v.to(device) for k, v in batch["labels"].items()}
        
        # Forward pass (process each sample in batch)
        batch_size = node_features.shape[0]
        batch_loss = 0.0
        
        for i in range(batch_size):
            outputs = model(node_features[i], sun_encoding[i])
            
            # Codon loss (MSE)
            codon_loss = nn.functional.mse_loss(outputs["codons"], labels["codons"][i])
            
            # Awareness loss
            awareness_loss = (
                nn.functional.mse_loss(outputs["spleen"], labels["spleen"][i]) +
                nn.functional.mse_loss(outputs["ajna"], labels["ajna"][i]) +
                nn.functional.mse_loss(outputs["solar_plexus"], labels["solar_plexus"][i])
            ) / 3
            
            # Modulator loss
            modulator_loss = (
                nn.functional.mse_loss(outputs["heart"], labels["heart"][i]) +
                nn.functional.mse_loss(outputs["mind"], labels["mind"][i])
            ) / 2
            
            # Combined loss
            loss = codon_loss + awareness_loss + modulator_loss
            batch_loss += loss
            
            codon_loss_total += codon_loss.item()
            awareness_loss_total += awareness_loss.item()
            modulator_loss_total += modulator_loss.item()
        
        batch_loss = batch_loss / batch_size
        batch_loss.backward()
        
        # Gradient clipping
        torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
        
        optimizer.step()
        total_loss += batch_loss.item()
    
    num_batches = len(dataloader)
    num_samples = len(dataloader.dataset)
    
    return {
        "total_loss": total_loss / num_batches,
        "codon_loss": codon_loss_total / num_samples,
        "awareness_loss": awareness_loss_total / num_samples,
        "modulator_loss": modulator_loss_total / num_samples,
    }


def evaluate(
    model: HumanDesignGNN,
    dataloader: DataLoader,
    device: torch.device,
) -> Dict[str, float]:
    """Evaluate model on validation set."""
    model.eval()
    total_loss = 0.0
    
    with torch.no_grad():
        for batch in dataloader:
            node_features = batch["node_features"].to(device)
            sun_encoding = batch["sun_encoding"].to(device)
            labels = {k: v.to(device) for k, v in batch["labels"].items()}
            
            batch_size = node_features.shape[0]
            batch_loss = 0.0
            
            for i in range(batch_size):
                outputs = model(node_features[i], sun_encoding[i])
                
                loss = (
                    nn.functional.mse_loss(outputs["codons"], labels["codons"][i]) +
                    nn.functional.mse_loss(outputs["spleen"], labels["spleen"][i]) +
                    nn.functional.mse_loss(outputs["ajna"], labels["ajna"][i]) +
                    nn.functional.mse_loss(outputs["solar_plexus"], labels["solar_plexus"][i]) +
                    nn.functional.mse_loss(outputs["heart"], labels["heart"][i]) +
                    nn.functional.mse_loss(outputs["mind"], labels["mind"][i])
                )
                batch_loss += loss
            
            total_loss += (batch_loss / batch_size).item()
    
    return {"val_loss": total_loss / len(dataloader)}


def train(
    num_epochs: int = 50,
    batch_size: int = 16,
    learning_rate: float = 0.001,
    num_train_samples: int = 800,
    num_val_samples: int = 200,
    save_path: str = "ml/checkpoints",
):
    """Full training loop."""
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Training on: {device}")
    
    # Create datasets
    print("Generating training data...")
    train_dataset = HDChartDataset(num_train_samples)
    val_dataset = HDChartDataset(num_val_samples)
    
    train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True)
    val_loader = DataLoader(val_dataset, batch_size=batch_size)
    
    # Create model
    model = HumanDesignGNN(
        input_dim=34,
        hidden_dim=64,
        num_layers=3,
        sun_encoding_dim=70,
        dropout=0.1,
    ).to(device)
    
    print(f"Model parameters: {sum(p.numel() for p in model.parameters()):,}")
    
    # Optimizer
    optimizer = optim.AdamW(model.parameters(), lr=learning_rate, weight_decay=0.01)
    scheduler = optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=num_epochs)
    
    # Training loop
    best_val_loss = float("inf")
    Path(save_path).mkdir(parents=True, exist_ok=True)
    
    history = []
    
    for epoch in range(num_epochs):
        train_metrics = train_epoch(model, train_loader, optimizer, device)
        val_metrics = evaluate(model, val_loader, device)
        scheduler.step()
        
        metrics = {**train_metrics, **val_metrics, "epoch": epoch + 1, "lr": scheduler.get_last_lr()[0]}
        history.append(metrics)
        
        if (epoch + 1) % 5 == 0 or epoch == 0:
            print(f"Epoch {epoch + 1}/{num_epochs} | "
                  f"Train: {train_metrics['total_loss']:.4f} | "
                  f"Val: {val_metrics['val_loss']:.4f} | "
                  f"LR: {scheduler.get_last_lr()[0]:.6f}")
        
        # Save best model
        if val_metrics["val_loss"] < best_val_loss:
            best_val_loss = val_metrics["val_loss"]
            torch.save({
                "epoch": epoch + 1,
                "model_state_dict": model.state_dict(),
                "optimizer_state_dict": optimizer.state_dict(),
                "val_loss": best_val_loss,
            }, f"{save_path}/best_model.pt")
    
    # Save final model
    torch.save({
        "epoch": num_epochs,
        "model_state_dict": model.state_dict(),
        "optimizer_state_dict": optimizer.state_dict(),
        "val_loss": val_metrics["val_loss"],
    }, f"{save_path}/final_model.pt")
    
    # Save training history
    with open(f"{save_path}/history.json", "w") as f:
        json.dump(history, f, indent=2)
    
    print(f"\nTraining complete! Best val loss: {best_val_loss:.4f}")
    print(f"Model saved to {save_path}/")
    
    return model, history


if __name__ == "__main__":
    train(num_epochs=50, batch_size=16, learning_rate=0.001)
