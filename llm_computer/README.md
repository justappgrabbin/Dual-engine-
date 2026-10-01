# TRIDENT LLM Computer

This folder turns the repository's TRIDENT transformer into a persistent local AI-computer runtime.

## Windows
Double-click `start_windows.bat`. First launch creates a private Python environment and installs dependencies. The UI opens at `http://127.0.0.1:8765`.

## What is local
- TRIDENT model process
- persistent JSONL conversation memory in `state/`
- FastAPI chat/health API
- phone-friendly local web UI
- CPU or CUDA selection automatically

## Model weights
The repository contains the TRIDENT architecture, but this build does not assume random weights are a useful language model. Put a trained checkpoint at `trident.pt` in the repository root, or set `TRIDENT_CHECKPOINT`.

The runtime deliberately reports "trained weights needed" until a checkpoint is present.

## Dedicated-computer mode
After verifying the launcher works, add a shortcut to `start_windows.bat` to Windows Startup. The machine can then boot directly into the LLM service.

## Network
The service binds to `0.0.0.0:8765` so another device on your LAN can reach it. Keep it behind your trusted LAN/firewall until authentication is added.
