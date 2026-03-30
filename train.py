"""Train the Transformer Collapse Engine."""
import torch, argparse
from torch.optim import AdamW
from torch.optim.lr_scheduler import CosineAnnealingLR
from pathlib import Path
from tqdm import tqdm
from models.transformer_collapse import create_model, CollapseLoss
from training.dataset import create_dataloaders

def train(args):
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Device: {device}")
    Path(args.output_dir).mkdir(parents=True, exist_ok=True)

    train_loader, val_loader = create_dataloaders(
        args.train_path, args.val_path, batch_size=args.batch_size,
        max_events=8, seq_len=16)

    model = create_model(size=args.model_size, use_pretrained=args.use_pretrained).to(device)
    print(f"Params: {sum(p.numel() for p in model.parameters()):,}")

    criterion = CollapseLoss()
    optimizer = AdamW(model.parameters(), lr=args.lr, weight_decay=0.01)
    scheduler = CosineAnnealingLR(optimizer, T_max=args.epochs)

    best_val = float('inf')
    for epoch in range(1, args.epochs + 1):
        model.train()
        total = 0
        for events, labels, state in tqdm(train_loader, desc=f"Epoch {epoch}"):
            events = {k: v.to(device) for k, v in events.items()}
            labels = {k: v.to(device) for k, v in labels.items()}
            state = state.to(device)
            optimizer.zero_grad()
            out = model(events, state, events.get('attention_mask'))
            loss, _ = criterion(out, labels)
            loss.backward()
            torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
            optimizer.step()
            total += loss.item()
        scheduler.step()
        avg = total / len(train_loader)
        print(f"Epoch {epoch} | train_loss={avg:.4f}")

        if val_loader:
            model.eval()
            val_loss = 0
            with torch.no_grad():
                for events, labels, state in val_loader:
                    events = {k: v.to(device) for k, v in events.items()}
                    labels = {k: v.to(device) for k, v in labels.items()}
                    state = state.to(device)
                    out = model(events, state, events.get('attention_mask'))
                    loss, _ = criterion(out, labels)
                    val_loss += loss.item()
            val_avg = val_loss / len(val_loader)
            print(f"         | val_loss={val_avg:.4f}")
            if val_avg < best_val:
                best_val = val_avg
                torch.save({'model_state_dict': model.state_dict(), 'epoch': epoch}, f"{args.output_dir}/best_model.pt")
                print(f"         | ✓ saved best")

    torch.save({'model_state_dict': model.state_dict()}, f"{args.output_dir}/final_model.pt")
    print(f"\nDone. Model saved to {args.output_dir}/")

if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("--train_path", required=True)
    p.add_argument("--val_path", default=None)
    p.add_argument("--output_dir", default="./checkpoints")
    p.add_argument("--model_size", default="small", choices=["tiny","small","base","large"])
    p.add_argument("--use_pretrained", action="store_true")
    p.add_argument("--epochs", type=int, default=10)
    p.add_argument("--batch_size", type=int, default=32)
    p.add_argument("--lr", type=float, default=2e-4)
    args = p.parse_args()
    train(args)
