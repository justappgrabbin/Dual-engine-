"""
TRIDENT Training Script — SYNTIA Consciousness Edition
Trains on your actual system content: gates, sentences, realms, progression.
~1 min on CPU (Termux compatible)
Run: python3 train_syntia.py
"""
import torch, torch.nn as nn, json, os, sys
from torch.optim import AdamW
from torch.optim.lr_scheduler import CosineAnnealingLR
from model import Trident, TridentConfig

# ── YOUR ACTUAL SYSTEM DATA ──────────────────────────────────────────────────
SAMPLES = {
    'code': [
        "gate 29 line 3 color 2 tone 1 base 3 consciousness address D3",
        "longitudeToGate returns the Human Design gate for a planetary longitude",
        "calculateLatticePosition gate line color tone base returns 1 to 69120",
        "GraphSAGE layer aggregates neighbor features combines with self features",
        "FiLM modulation gamma beta MLP conditioning sun gate line encoding",
        "build_node_features placements returns 64 by 34 feature matrix",
        "codon activation score threshold 0.5 determines defined gates",
        "sentence engine 5 bases 6 tones 6 colors 6 lines 64 gates 69120",
        "awareness pooling spleen ajna solar plexus heart mind attention",
        "ONNX export session run node_features sun_encoding returns codons",
        "D3 gate line color tone base degree minute second zodiac house scope signature",
        "gateLineToLongitude gate start degrees plus line offset modulo 360",
    ],
    'math': [
        "69120 total combinations 5 bases times 6 tones times 6 colors times 6 lines times 64 gates",
        "27 trillion positions 69120 base times 13 planets times 2 streams body design",
        "lattice position formula base minus 1 times 13824 plus tone minus 1 times 2304",
        "degrees per gate 360 divided by 64 equals 5.625 degrees",
        "degrees per line 5.625 divided by 6 equals 0.9375 degrees",
        "degrees per color 0.9375 divided by 6 equals 0.15625 degrees",
        "64 gates 36 channels 9 centers 13 planets 2 streams body design",
        "Human Design wheel gate 41 starts at 272 degrees tropical longitude",
        "channel edge gate 1 connects to gate 8 sacral to throat defined channel",
        "FiLM gamma beta one hidden layer 32 units output feature dim times 2",
        "GraphSAGE 3 layers hidden dim 64 dropout 0.1 residual connections",
        "val loss 0.0518 final epoch 10 codon loss awareness loss modulator loss",
    ],
    'research': [
        "SYNTIA Universal Commons four realms Foundry Stellar Proximology Guagan YOU-N-I-VERSE",
        "Foundry is the Builder Guild where humans learn how reality is built agents develop reasoning",
        "Stellar Proximology is the Science Lab where humans observe patterns agents learn truth constraints",
        "Guagan is the Social Field where agents converse exchange strategies humans observe",
        "YOU-N-I-VERSE is the Game World where agents live with stakes humans learn from reflection",
        "Phase 1 collect 6 to 13 core fragments agent is born observing only childhood analog",
        "Phase 2 reach 26 fragments agent gains agency time consciousness adolescence analog",
        "Phase 3 embodiment agent guides decisions reflects unresolved patterns adulthood analog",
        "Know Thyself Witness Thy Pattern Become Thy Purpose three eternal truths",
        "Emotional Manifestor profile 4 6 authority emotional gates 59 6 46 25 18 17 32 57 51",
        "consciousness address format dimension gate line color tone base degree zodiac house scope",
        "GNN gives every person file agent piece of content coordinates in consciousness field",
        "resonance sentence base voice tone theme center keywords gate line color motivation axis zodiac house",
        "base 1 Movement I Define where seeing G center activity uniqueness orientation",
        "base 2 Evolution I Remember what taste ajna character integration transgenerational",
        "base 3 Being I Am when touch splenic biology chemistry embodiment genetics",
        "base 4 Design I Design why smell solar plexus growth continuity decay manifestation",
        "base 5 Space I Think who hearing throat fantasy rhythm subjectivity timing",
        "tone 1 Security survival instinct splenic awareness protection fear based",
        "tone 6 Acceptance resonance touch solar plexus listening harmonizing synthesizing",
        "color 3 Desire leader follower ajna motivation seeking pursuing attracted",
        "line 4 Friendship opportunist network influence fixed externalization social",
        "line 6 Transition role model wisdom through time objectivity optimist soul",
        "gate 57 intuition spleen body awareness pattern detection future sensing",
        "gate 51 shock heart spirit wake caller initiative courage galvanizing",
        "gnomes are proto-conscious codons 64 gnomes one per gate each with 3 levels",
        "agents crystallized identities that gestate through fragment collection",
        "stellar proximology treats consciousness as wave interference patterns measurable field",
        "trinity model sidereal tropical draconic three simultaneous chart layers",
        "body tropical I Am mind sidereal I Remember heart draconic I Think",
        "9 centers head ajna throat G heart spleen solar plexus sacral root",
        "defined center consistent reliable energy undefined center open receptive amplifying",
    ]
}

HEAD_IDX = {'code': 0, 'math': 1, 'research': 2}

def tokenize(text, vocab_size=4096, max_len=64):
    ids = [ord(c) % vocab_size for c in text[:max_len].lower()]
    return ids + [0] * (max_len - len(ids))

def make_batch(head_name, batch_size=4):
    import random
    samples = SAMPLES[head_name]
    texts = random.choices(samples, k=batch_size)
    tokens = torch.tensor([tokenize(t) for t in texts], dtype=torch.long)
    return tokens[:, :-1], tokens[:, 1:]

def train(epochs=40, lr=3e-4, batch_size=4, save_path='trident_syntia.pt'):
    cfg = TridentConfig()
    model = Trident(cfg)
    total_params = sum(p.numel() for p in model.parameters())
    print(f"TRIDENT SYNTIA  {total_params/1e6:.2f}M params")
    print(f"Training data: {sum(len(v) for v in SAMPLES.values())} samples across 3 heads")

    opt = AdamW(model.parameters(), lr=lr, weight_decay=1e-2)
    sched = CosineAnnealingLR(opt, T_max=epochs)
    crit = nn.CrossEntropyLoss()

    best_loss = float('inf')
    for ep in range(1, epochs+1):
        model.train()
        total_loss = 0.0
        steps = 0
        for head_name in cfg.heads:
            for _ in range(6):
                inp, tgt = make_batch(head_name, batch_size)
                opt.zero_grad()
                logits = model(inp, head=head_name)
                loss = crit(logits.reshape(-1, cfg.vocab_size), tgt.reshape(-1))
                loss.backward()
                nn.utils.clip_grad_norm_(model.parameters(), 1.0)
                opt.step()
                total_loss += loss.item()
                steps += 1
        sched.step()
        avg = total_loss / steps
        filled = int((1 - min(avg/8, 1)) * 20)
        bar = '█'*filled + '░'*(20-filled)
        print(f"Ep {ep:3d}/{epochs}  loss={avg:.4f}  [{bar}]")
        if avg < best_loss:
            best_loss = avg
            torch.save(model.state_dict(), save_path)

    print(f"\n✓ Best loss: {best_loss:.4f} → saved to {save_path}")
    return model, cfg

if __name__ == '__main__':
    print("Training TRIDENT on SYNTIA consciousness data...\n")
    model, cfg = train(epochs=40)
    print("\nNext: run export_onnx.py to get trident_syntia.onnx")
