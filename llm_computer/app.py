from fastapi import FastAPI
from fastapi.responses import HTMLResponse
from pydantic import BaseModel
from brain import LLMComputer

app=FastAPI(title="TRIDENT LLM Computer")
brain=LLMComputer()

class Chat(BaseModel):
    message:str
    head:str|None=None

@app.get("/health")
def health():
    return {"ok":True,"device":brain.device,"trained_checkpoint":brain.trained}

@app.post("/chat")
def chat(req:Chat):
    return {"response":brain.generate(req.message, req.head)}

@app.get("/",response_class=HTMLResponse)
def home():
    return """<!doctype html><html><meta name="viewport" content="width=device-width">
<title>TRIDENT Computer</title><style>
body{font-family:system-ui;background:#10091d;color:#f5efff;max-width:760px;margin:auto;padding:24px}
textarea,button{width:100%;box-sizing:border-box;padding:14px;margin:8px 0;border-radius:12px}
textarea{min-height:120px;background:#1c1230;color:white;border:1px solid #6843a5}
button{background:#8b5cf6;color:white;border:0;font-weight:700}pre{white-space:pre-wrap}
</style><h1>TRIDENT LLM Computer</h1><p id=s></p><textarea id=q placeholder="Talk to the LLM..."></textarea>
<button onclick=go()>Send</button><pre id=a></pre><script>
fetch('/health').then(r=>r.json()).then(x=>s.textContent=x.trained_checkpoint?'LLM online · '+x.device:'Runtime online · trained weights needed');
async function go(){a.textContent='thinking…';let r=await fetch('/chat',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({message:q.value})});a.textContent=(await r.json()).response}
</script></html>"""
