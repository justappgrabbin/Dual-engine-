
from flask import Flask, render_template, request, jsonify
from datetime import datetime
import os

app = Flask(__name__)
GENERATED_FOLDER = 'generated_app'
os.makedirs(GENERATED_FOLDER, exist_ok=True)

CYNTHIA_MEMORY = []

@app.route('/')
def dashboard():
    return render_template('dashboard.html', memory=CYNTHIA_MEMORY)

@app.route('/generate_code', methods=['POST'])
def generate_code():
    data = request.get_json() or {}
    idea = data.get('input', '')

    # === Prompt Expansion: Claude-style (hardcoded for now)
    claude_style_prompt = f"""You are Cynthia, a brilliant AI architect. The user says: "{idea}".
Generate the simplest working code snippet to fulfill that request.
Only output code — no commentary. Keep it clean and real."""

    # === Simulated logic
    if "flask" in idea.lower():
        code = "from flask import Flask\napp = Flask(__name__)\n@app.route('/')\ndef home(): return 'Hello!'"
        filename = "app.py"
        message = "I generated a Flask app for you."
    elif "html" in idea.lower():
        code = "<html><body><h1>Hello from Cynthia!</h1></body></html>"
        filename = "index.html"
        message = "Here's your simple webpage."
    else:
        code = f"# Claude-style response for: {idea}\n# TODO: expand this"
        filename = "snippet.txt"
        message = "I saved your idea as a code snippet."

    with open(os.path.join(GENERATED_FOLDER, filename), 'w') as f:
        f.write(code)

    CYNTHIA_MEMORY.append({
        "input": idea,
        "response": message,
        "filename": filename,
        "timestamp": datetime.now().isoformat()
    })
    return jsonify({"message": message, "filename": filename})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8080)
