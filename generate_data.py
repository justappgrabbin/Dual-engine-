"""Generate synthetic training data for the collapse engine."""
import json, random, argparse
from pathlib import Path

PLANETS = ["Sun","Earth","Moon","Mercury","Venus","Mars","Jupiter","Saturn","Uranus","Neptune","Pluto","NNode","SNode","Chiron"]
ASPECTS = ["conjunction","opposition","square","trine","sextile","quincunx"]
NODES = ["body","mind","heart"]
DOMAINS = ["spleen","ajna","solar"]

def random_state():
    return {
        "resonance": [round(random.uniform(0.1, 0.9), 3) for _ in range(9)],
        "decay_rate": [round(random.uniform(0.8, 1.2), 3) for _ in range(9)],
        "alignment": round(random.uniform(0, 1.5), 3),
        "needs": {"energy": round(random.random(), 3), "attention": round(random.random(), 3), "resonance": round(random.random(), 3)},
        "node_bias": {"body": round(random.random(), 3), "mind": round(random.random(), 3), "heart": round(random.random(), 3)},
        "hb_coherence": round(random.random(), 3)
    }

def random_events(n=None):
    n = n or random.randint(1, 8)
    return [{"planet": random.choice(PLANETS), "gate": random.randint(1,64),
             "aspect": random.choice(ASPECTS), "strength": round(random.random(), 3)} for _ in range(n)]

def random_labels(state):
    res = state["resonance"]
    return {
        "resonance_next": [round(min(1, max(0, r + random.uniform(-0.05, 0.05))), 3) for r in res],
        "collapse_next": [1 if random.random() > 0.85 else 0 for _ in range(9)],
        "node_next": random.choice(NODES),
        "micro_winners": {d: {"gate": random.randint(1,64), "line": random.randint(1,6)} for d in DOMAINS}
    }

def generate(n, output_path):
    Path(output_path).parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, 'w') as f:
        for _ in range(n):
            state = random_state()
            sample = {"t": random.randint(1700000000, 1800000000),
                      "state": state, "events": random_events(), "labels": random_labels(state)}
            f.write(json.dumps(sample) + '\n')
    print(f"Generated {n} samples → {output_path}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--n_train", type=int, default=1000)
    parser.add_argument("--n_val", type=int, default=200)
    parser.add_argument("--output_dir", type=str, default="./data")
    args = parser.parse_args()
    generate(args.n_train, f"{args.output_dir}/train.jsonl")
    generate(args.n_val, f"{args.output_dir}/val.jsonl")
