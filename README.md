# Transformer Collapse Engine

Neural collapse prediction for the YOU-N-I-VERSE consciousness field network.

## Quick Start
```bash
bash quickstart.sh
```

## Manual
```bash
pip install -r Requirements.txt
python generate_data.py --n_train 1000 --n_val 200
python train.py --train_path data/train.jsonl --val_path data/val.jsonl --epochs 10
uvicorn api.server:app --host 0.0.0.0 --port 8000
```

## API
- `GET /health` — status
- `POST /predict` — collapse prediction from events + state

## Architecture
DistilBERT backbone → multi-task heads → resonance, collapse, node (body/mind/heart), micro-collapse gates
