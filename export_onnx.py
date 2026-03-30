"""
Export TRIDENT to ONNX for browser deployment
Run AFTER train_syntia.py
"""
import torch
from model import Trident, TridentConfig

def export(model_path='trident_syntia.pt', out_path='trident_syntia.onnx'):
    cfg = TridentConfig()
    model = Trident(cfg)
    model.load_state_dict(torch.load(model_path, map_location='cpu'))
    model.eval()

    # Dummy input: batch=1, seq_len=63 (max_seq_len-1)
    dummy_input = torch.zeros(1, 63, dtype=torch.long)

    print(f"Exporting to {out_path}...")
    torch.onnx.export(
        model,
        (dummy_input,),
        out_path,
        input_names=['input_ids'],
        output_names=['logits'],
        dynamic_axes={
            'input_ids': {0: 'batch', 1: 'seq'},
            'logits': {0: 'batch', 1: 'seq'}
        },
        opset_version=14,
        do_constant_folding=True
    )

    import os
    size_mb = os.path.getsize(out_path) / (1024*1024)
    print(f"✓ Exported: {out_path}  ({size_mb:.1f} MB)")
    print(f"✓ Ready for browser deployment via onnxruntime-web")

if __name__ == '__main__':
    export()
