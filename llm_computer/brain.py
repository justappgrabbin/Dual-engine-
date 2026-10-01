from __future__ import annotations
import json, os, time
from pathlib import Path
import torch
from model import Trident

ROOT = Path(__file__).resolve().parent
STATE = ROOT / "state"
STATE.mkdir(exist_ok=True)
MEMORY = STATE / "memory.jsonl"
CHECKPOINT = Path(os.getenv("TRIDENT_CHECKPOINT", ROOT.parent / "trident.pt"))

class ByteCodec:
    BOS=256
    EOS=257
    def encode(self, text: str):
        data=list(text.encode("utf-8", errors="replace"))
        return [self.BOS]+data
    def decode(self, ids):
        data=bytes(i for i in ids if 0 <= i <= 255)
        return data.decode("utf-8", errors="replace")

class LLMComputer:
    def __init__(self):
        self.device="cuda" if torch.cuda.is_available() else "cpu"
        self.codec=ByteCodec()
        self.model=Trident().to(self.device)
        self.trained=False
        if CHECKPOINT.exists():
            raw=torch.load(CHECKPOINT, map_location=self.device)
            state=raw.get("model_state_dict", raw) if isinstance(raw, dict) else raw
            self.model.load_state_dict(state, strict=False)
            self.trained=True
        self.model.eval()

    def remember(self, role, content):
        with MEMORY.open("a", encoding="utf-8") as f:
            f.write(json.dumps({"time":time.time(),"role":role,"content":content},ensure_ascii=False)+"\n")

    def recent(self, n=12):
        if not MEMORY.exists(): return []
        lines=MEMORY.read_text(encoding="utf-8").splitlines()[-n:]
        return [json.loads(x) for x in lines if x.strip()]

    def prompt(self, message):
        history="\n".join(f"{x['role']}: {x['content']}" for x in self.recent())
        return f"{history}\nuser: {message}\nassistant:"

    def generate(self, message, head=None, max_new=96):
        self.remember("user", message)
        if not self.trained:
            answer=("TRIDENT computer is running, but no trained checkpoint was found. "
                    "Install or train weights before treating generated text as an LLM response.")
            self.remember("assistant", answer)
            return answer
        ids=torch.tensor([self.codec.encode(self.prompt(message))],dtype=torch.long,device=self.device)
        out=self.model.generate(ids,max_new=max_new,temp=0.75,top_k=40,head=head)
        answer=self.codec.decode(out[0, ids.shape[1]:].tolist()).strip()
        self.remember("assistant", answer)
        return answer
