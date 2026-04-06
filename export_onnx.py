#!/usr/bin/env python
"""
Export trained Human Design GNN to ONNX format for Node.js inference.
Usage: python ml/export_onnx.py
"""
import torch
import onnx
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).parent))

from model import HumanDesignGNN


class ONNXWrapper(torch.nn.Module):
    """
    Wrapper to make the model ONNX-exportable.
    Flattens dict output to tuple.
    """
    def __init__(self, model: HumanDesignGNN):
        super().__init__()
        self.model = model
    
    def forward(self, node_features: torch.Tensor, sun_encoding: torch.Tensor):
        outputs = self.model(node_features, sun_encoding)
        return (
            outputs["codons"],
            outputs["spleen"],
            outputs["ajna"],
            outputs["solar_plexus"],
            outputs["heart"],
            outputs["mind"],
        )


def export_onnx(
    checkpoint_path: str = "ml/checkpoints/best_model.pt",
    output_path: str = "ml/model.onnx",
):
    """Export trained model to ONNX format."""
    print(f"Loading checkpoint from {checkpoint_path}")
    
    # Create model
    model = HumanDesignGNN(
        input_dim=34,
        hidden_dim=64,
        num_layers=3,
        sun_encoding_dim=70,
        dropout=0.0,  # Disable dropout for inference
    )
    
    # Load weights if checkpoint exists
    if Path(checkpoint_path).exists():
        checkpoint = torch.load(checkpoint_path, map_location="cpu")
        model.load_state_dict(checkpoint["model_state_dict"])
        print(f"Loaded weights from epoch {checkpoint['epoch']}")
    else:
        print("No checkpoint found, exporting untrained model")
    
    model.eval()
    
    # Wrap for ONNX export
    wrapper = ONNXWrapper(model)
    wrapper.eval()
    
    # Create dummy inputs
    node_features = torch.randn(64, 34)
    sun_encoding = torch.zeros(70)
    sun_encoding[12] = 1.0  # Gate 13
    sun_encoding[64 + 3] = 1.0  # Line 4
    
    # Export using JIT tracing (more compatible)
    print(f"Exporting to {output_path}")
    
    # Use legacy dynamo=False mode for compatibility
    torch.onnx.export(
        wrapper,
        (node_features, sun_encoding),
        output_path,
        input_names=["node_features", "sun_encoding"],
        output_names=["codons", "spleen", "ajna", "solar_plexus", "heart", "mind"],
        opset_version=14,
        do_constant_folding=True,
        dynamo=False,  # Use legacy JIT tracing
    )
    
    # Verify the model
    print("Verifying ONNX model...")
    onnx_model = onnx.load(output_path)
    onnx.checker.check_model(onnx_model)
    
    print(f"ONNX model saved to {output_path}")
    print(f"Model size: {Path(output_path).stat().st_size / 1024:.1f} KB")
    
    # Test inference with ONNX Runtime
    import onnxruntime as ort
    
    session = ort.InferenceSession(output_path)
    
    outputs = session.run(
        None,
        {
            "node_features": node_features.numpy(),
            "sun_encoding": sun_encoding.numpy(),
        }
    )
    
    print("\nONNX inference test:")
    print(f"  Codons shape: {outputs[0].shape}")
    print(f"  Spleen: {outputs[1][0]:.4f}")
    print(f"  Ajna: {outputs[2][0]:.4f}")
    print(f"  Solar Plexus: {outputs[3][0]:.4f}")
    print(f"  Heart: {outputs[4][0]:.4f}")
    print(f"  Mind: {outputs[5][0]:.4f}")
    
    return output_path


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--checkpoint", default="ml/checkpoints/best_model.pt")
    parser.add_argument("--output", default="ml/model.onnx")
    args = parser.parse_args()
    
    export_onnx(args.checkpoint, args.output)
