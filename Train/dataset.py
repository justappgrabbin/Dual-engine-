"""
CollapseDataset: Training data loader for transformer collapse engine.
"""

import torch
from torch.utils.data import Dataset, DataLoader
import json
import numpy as np
from pathlib import Path
from typing import Dict, List, Optional, Tuple


class CollapseDataset(Dataset):
    PLANETS = ["Sun","Earth","Moon","Mercury","Venus","Mars","Jupiter","Saturn","Uranus","Neptune","Pluto","NNode","SNode","Chiron"]
    ASPECTS = ["conjunction","opposition","square","trine","sextile","quincunx"]
    NODES = {"body": 0, "mind": 1, "heart": 2}
    PLANET2IDX = {p: i for i, p in enumerate(PLANETS)}
    ASPECT2IDX = {a: i for i, a in enumerate(ASPECTS)}

    def __init__(self, data_path: str, seq_len: int = 16, max_events: int = 8):
        super().__init__()
        self.seq_len = seq_len
        self.max_events = max_events
        self.samples = []
        with open(data_path) as f:
            for line in f:
                line = line.strip()
                if line:
                    self.samples.append(json.loads(line))
        print(f"Loaded {len(self.samples)} samples from {data_path}")

    def _encode_state(self, state):
        resonance = state.get("resonance", [0.4] * 9)
        decay = state.get("decay_rate", [1.0] * 9)
        alignment = [state.get("alignment", 0.5)]
        needs = state.get("needs", {})
        needs_vec = [needs.get("energy", 0.5), needs.get("attention", 0.5), needs.get("resonance", 0.5)]
        bias = state.get("node_bias", {})
        bias_vec = [bias.get("body", 0.33), bias.get("mind", 0.33), bias.get("heart", 0.33)]
        hb = [state.get("hb_coherence", 0.0)]
        vec = resonance + decay + alignment + needs_vec + bias_vec + hb
        return torch.tensor(vec, dtype=torch.float32)

    def _encode_events(self, events):
        events = events[:self.max_events]
        n_events = len(events)
        planets = torch.zeros(self.max_events, dtype=torch.long)
        gates = torch.zeros(self.max_events, dtype=torch.long)
        aspects = torch.zeros(self.max_events, dtype=torch.long)
        strengths = torch.zeros(self.max_events, 1, dtype=torch.float32)
        for i, ev in enumerate(events):
            planets[i] = self.PLANET2IDX.get(ev.get("planet", "Sun"), 0)
            gates[i] = ev.get("gate", 1)
            aspects[i] = self.ASPECT2IDX.get(ev.get("aspect", "conjunction"), 0)
            strengths[i, 0] = ev.get("strength", 0.5)
        mask = torch.zeros(self.max_events, dtype=torch.float32)
        mask[:n_events] = 1.0
        return {'planets': planets, 'gates': gates, 'aspects': aspects, 'strengths': strengths}, mask

    def _encode_labels(self, labels):
        encoded = {
            'resonance_next': torch.tensor(labels.get("resonance_next", [0.0]*9), dtype=torch.float32),
            'collapse_next': torch.tensor(labels.get("collapse_next", [0]*9), dtype=torch.float32),
            'node_next': torch.tensor(self.NODES.get(labels.get("node_next", "body"), 0), dtype=torch.long),
        }
        micro = labels.get("micro_winners", {})
        for domain in ['spleen', 'ajna', 'solar']:
            gate = micro.get(domain, {}).get("gate", 1)
            encoded[f'micro_{domain}'] = torch.tensor(gate - 1, dtype=torch.long)
        return encoded

    def __len__(self):
        return len(self.samples)

    def __getitem__(self, idx):
        sample = self.samples[idx]
        events, mask = self._encode_events(sample.get("events", []))
        events['attention_mask'] = mask
        state = self._encode_state(sample.get("state", {}))
        labels = self._encode_labels(sample.get("labels", {}))
        return events, labels, state


def collate_fn(batch):
    events_list, labels_list, state_list = zip(*batch)
    batch_events = {k: torch.stack([e[k] for e in events_list]) for k in events_list[0]}
    batch_labels = {k: torch.stack([l[k] for l in labels_list]) for k in labels_list[0]}
    return batch_events, batch_labels, torch.stack(state_list)


def create_dataloaders(train_path, val_path=None, batch_size=32, num_workers=0, **kwargs):
    train_ds = CollapseDataset(train_path, **kwargs)
    train_loader = DataLoader(train_ds, batch_size=batch_size, shuffle=True, num_workers=num_workers, collate_fn=collate_fn)
    val_loader = None
    if val_path:
        val_ds = CollapseDataset(val_path, **kwargs)
        val_loader = DataLoader(val_ds, batch_size=batch_size, shuffle=False, num_workers=num_workers, collate_fn=collate_fn)
    return train_loader, val_loader
