#!/bin/bash
echo "🚀 Collapse Engine — Quick Start"
echo "================================="
pip install -q -r Requirements.txt
echo "✓ Dependencies installed"
python generate_data.py --n_train 1000 --n_val 200 --output_dir ./data
echo "✓ Data generated"
python train.py --train_path data/train.jsonl --val_path data/val.jsonl --epochs 10 --model_size small
echo "✓ Training complete"
echo ""
echo "Start API:  uvicorn api.server:app --host 0.0.0.0 --port 8000"
