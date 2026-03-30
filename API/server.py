"""FastAPI server for Transformer Collapse Engine."""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Dict, Optional
import torch
from pathlib import Path
from models.transformer_collapse import create_model
from training.dataset import CollapseDataset

app = FastAPI(title="Collapse Engine API", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

class Event(BaseModel):
    planet: str = "Sun"
    gate: int = Field(ge=1, le=64, default=1)
    aspect: str = "conjunction"
    strength: float = Field(ge=0, le=1, default=0.5)

class State(BaseModel):
    resonance: List[float] = Field(default_factory=lambda: [0.4]*9)
    decay_rate: List[float] = Field(default_factory=lambda: [1.0]*9)
    alignment: float = 0.5
    needs: Dict[str, float] = Field(default_factory=lambda: {"energy":0.5,"attention":0.5,"resonance":0.5})
    node_bias: Dict[str, float] = Field(default_factory=lambda: {"body":0.33,"mind":0.33,"heart":0.33})
    hb_coherence: float = 0.0

class CollapseRequest(BaseModel):
    events: List[Event] = Field(default_factory=list)
    state: State = Field(default_factory=State)

model_instance = None
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

@app.on_event("startup")
async def startup():
    global model_instance
    ckpt = Path("./checkpoints/best_model.pt")
    if ckpt.exists():
        model_instance = create_model("small", use_pretrained=False).to(device)
        checkpoint = torch.load(ckpt, map_location=device)
        model_instance.load_state_dict(checkpoint['model_state_dict'])
        model_instance.eval()
        print("Model loaded.")
    else:
        print("No checkpoint found — run train.py first.")

@app.get("/health")
def health():
    return {"ok": True, "model_loaded": model_instance is not None}

@app.post("/predict")
def predict(req: CollapseRequest):
    if model_instance is None:
        raise HTTPException(503, "Model not loaded. Run train.py first.")

    max_ev = 8
    events_list = req.events[:max_ev]
    n = len(events_list)

    planets = torch.zeros(1, max_ev, dtype=torch.long)
    gates = torch.zeros(1, max_ev, dtype=torch.long)
    aspects = torch.zeros(1, max_ev, dtype=torch.long)
    strengths = torch.zeros(1, max_ev, 1)
    mask = torch.zeros(1, max_ev)

    for i, ev in enumerate(events_list):
        planets[0,i] = CollapseDataset.PLANET2IDX.get(ev.planet, 0)
        gates[0,i] = ev.gate
        aspects[0,i] = CollapseDataset.ASPECT2IDX.get(ev.aspect, 0)
        strengths[0,i,0] = ev.strength
        mask[0,i] = 1.0

    s = req.state
    state_vec = (s.resonance[:9] + s.decay_rate[:9] +
                 [s.alignment] +
                 [s.needs.get(k,0.5) for k in ['energy','attention','resonance']] +
                 [s.node_bias.get(k,0.33) for k in ['body','mind','heart']] +
                 [s.hb_coherence])
    state_t = torch.tensor([state_vec], dtype=torch.float32).to(device)

    events_t = {k: v.to(device) for k,v in {'planets':planets,'gates':gates,'aspects':aspects,'strengths':strengths,'attention_mask':mask}.items()}

    with torch.no_grad():
        out = model_instance(events_t, state_t, mask.to(device))

    node_map = {0:"body",1:"mind",2:"heart"}
    node_probs = torch.softmax(out['node_logits'], dim=-1).squeeze().tolist()
    node_pred = node_map[int(torch.argmax(out['node_logits']))]
    micro = out['micro_logits'].squeeze()
    micro_winners = {}
    for i, d in enumerate(['spleen','ajna','solar']):
        probs = torch.softmax(micro[i], dim=0)
        gate_idx = int(probs.argmax())
        micro_winners[d] = {"gate": gate_idx+1, "confidence": round(float(probs.max()), 3)}

    return {
        "resonance": [round(float(x),3) for x in out['resonance'].squeeze()],
        "collapse_probs": [round(float(x),3) for x in torch.sigmoid(out['collapse_logits']).squeeze()],
        "node_prediction": node_pred,
        "node_probs": {"body": round(node_probs[0],3), "mind": round(node_probs[1],3), "heart": round(node_probs[2],3)},
        "micro_winners": micro_winners
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
