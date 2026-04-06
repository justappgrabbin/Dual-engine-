#!/usr/bin/env python
"""
Main training script for Human Design GNN.
Usage: python ml/train.py
"""
import argparse
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).parent))

from training.trainer import train


def main():
    parser = argparse.ArgumentParser(description="Train Human Design GNN")
    parser.add_argument("--epochs", type=int, default=50, help="Number of epochs")
    parser.add_argument("--batch-size", type=int, default=16, help="Batch size")
    parser.add_argument("--lr", type=float, default=0.001, help="Learning rate")
    parser.add_argument("--train-samples", type=int, default=800, help="Training samples")
    parser.add_argument("--val-samples", type=int, default=200, help="Validation samples")
    parser.add_argument("--save-path", type=str, default="ml/checkpoints", help="Save path")
    
    args = parser.parse_args()
    
    print("=" * 50)
    print("Human Design Graph Neural Network Training")
    print("=" * 50)
    print(f"Epochs: {args.epochs}")
    print(f"Batch size: {args.batch_size}")
    print(f"Learning rate: {args.lr}")
    print(f"Training samples: {args.train_samples}")
    print(f"Validation samples: {args.val_samples}")
    print("=" * 50)
    
    model, history = train(
        num_epochs=args.epochs,
        batch_size=args.batch_size,
        learning_rate=args.lr,
        num_train_samples=args.train_samples,
        num_val_samples=args.val_samples,
        save_path=args.save_path,
    )
    
    return model


if __name__ == "__main__":
    main()
