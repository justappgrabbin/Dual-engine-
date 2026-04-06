import { useState } from "react";
import { 
  X, Play, Plus, Trash2, Code, Zap, AlertCircle, Check, 
  ChevronDown, ChevronRight, Terminal, Save, RotateCcw
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Rule {
  id: string;
  name: string;
  enabled: boolean;
  condition: string;
  action: string;
}

interface LogicLayerProps {
  blocks: any[];
  onClose: () => void;
  onApplyRules: (transformedBlocks: any[]) => void;
  addLog: (msg: string) => void;
}

const EXAMPLE_RULES = [
  { condition: 'block.type === "zip"', action: 'block.color = "#10B981"' },
  { condition: 'block.label.includes("Schema")', action: 'block.priority = "high"' },
  { condition: 'block.files && Object.keys(block.files).length > 5', action: 'block.label = "[LARGE] " + block.label' },
];

export default function LogicLayer({ blocks, onClose, onApplyRules, addLog }: LogicLayerProps) {
  const [rules, setRules] = useState<Rule[]>([
    { id: '1', name: 'Auto-Color ZIPs', enabled: true, condition: 'block.type === "zip"', action: 'block.color = "#FFD700"' }
  ]);
  const [customScript, setCustomScript] = useState(`// Custom Logic Script
// Available: blocks (array), block (current in loop)
// Return modified blocks array

blocks.forEach(block => {
  // Example: Add prefix to all labels
  // block.label = "[Processed] " + block.label;
  
  // Example: Change color based on type
  if (block.type === "doc") {
    block.color = "#3B82F6";
  }
});

return blocks;`);
  const [activeTab, setActiveTab] = useState<'rules' | 'script'>('rules');
  const [output, setOutput] = useState<string[]>([]);
  const [lastError, setLastError] = useState<string | null>(null);

  const addRule = () => {
    const newRule: Rule = {
      id: Math.random().toString(36).substr(2, 9),
      name: `Rule ${rules.length + 1}`,
      enabled: true,
      condition: 'block.type === "zip"',
      action: 'block.color = "#FFFFFF"'
    };
    setRules([...rules, newRule]);
  };

  const updateRule = (id: string, field: keyof Rule, value: any) => {
    setRules(rules.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const deleteRule = (id: string) => {
    setRules(rules.filter(r => r.id !== id));
  };

  const runRules = () => {
    setLastError(null);
    const logs: string[] = [];
    logs.push(`[LOGIC] Executing ${rules.filter(r => r.enabled).length} active rules...`);
    
    try {
      let transformed = JSON.parse(JSON.stringify(blocks)); // Deep clone
      
      rules.filter(r => r.enabled).forEach(rule => {
        logs.push(`[RULE] Evaluating: ${rule.name}`);
        let matched = 0;
        
        transformed = transformed.map((block: any) => {
          try {
            const conditionFn = new Function('block', `return ${rule.condition}`);
            if (conditionFn(block)) {
              matched++;
              const actionFn = new Function('block', `${rule.action}; return block;`);
              return actionFn(block);
            }
          } catch (e: any) {
            logs.push(`[ERROR] Rule "${rule.name}": ${e.message}`);
          }
          return block;
        });
        
        logs.push(`[RULE] "${rule.name}" matched ${matched} blocks`);
      });

      setOutput(logs);
      addLog(`Logic Layer: Applied ${rules.filter(r => r.enabled).length} rules`);
      onApplyRules(transformed);
      
    } catch (e: any) {
      setLastError(e.message);
      logs.push(`[FATAL] ${e.message}`);
      setOutput(logs);
    }
  };

  const runScript = () => {
    setLastError(null);
    const logs: string[] = [];
    logs.push(`[SCRIPT] Executing custom script...`);
    
    try {
      let transformed = JSON.parse(JSON.stringify(blocks));
      const scriptFn = new Function('blocks', customScript);
      const result = scriptFn(transformed);
      
      if (Array.isArray(result)) {
        logs.push(`[SCRIPT] Success! Processed ${result.length} blocks`);
        setOutput(logs);
        addLog(`Logic Layer: Custom script executed`);
        onApplyRules(result);
      } else {
        throw new Error('Script must return an array of blocks');
      }
      
    } catch (e: any) {
      setLastError(e.message);
      logs.push(`[ERROR] ${e.message}`);
      setOutput(logs);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-5xl h-[85vh] bg-[#0d1117] border border-[--accent]/30 rounded-xl shadow-2xl flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="h-14 border-b border-white/10 bg-[--surface] flex items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <Code className="h-5 w-5 text-[--movement]" />
            <h2 className="text-lg font-bold text-white tracking-wide">
              Advanced <span className="text-[--movement]">Logic Layer</span>
            </h2>
            <div className="h-5 w-px bg-white/10 mx-2" />
            <div className="flex items-center gap-2 text-xs font-mono bg-black/30 px-3 py-1 rounded border border-white/5">
              <span className="text-amber-400">{'λ'}</span>
              <span className="text-[--text-dim]">BLOCKS:</span>
              <span className="text-white">{blocks.length}</span>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X className="h-5 w-5 text-[--text-dim]" />
          </button>
        </div>

        {/* Tabs */}
        <div className="h-10 border-b border-white/5 bg-[--surface]/50 flex items-center px-6 gap-4">
          <button
            onClick={() => setActiveTab('rules')}
            className={cn(
              "text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded transition-colors",
              activeTab === 'rules' ? "bg-[--accent]/20 text-[--accent]" : "text-gray-500 hover:text-white"
            )}
          >
            If-Then Rules
          </button>
          <button
            onClick={() => setActiveTab('script')}
            className={cn(
              "text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded transition-colors",
              activeTab === 'script' ? "bg-[--accent]/20 text-[--accent]" : "text-gray-500 hover:text-white"
            )}
          >
            Custom Script
          </button>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* Editor Panel */}
          <div className="flex-1 flex flex-col border-r border-white/5">
            
            {activeTab === 'rules' ? (
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {rules.map((rule, i) => (
                  <div key={rule.id} className="p-4 bg-[#0a0a0a] rounded-lg border border-white/5 space-y-3">
                    <div className="flex items-center justify-between">
                      <input
                        type="text"
                        value={rule.name}
                        onChange={(e) => updateRule(rule.id, 'name', e.target.value)}
                        className="bg-transparent text-sm font-bold text-white focus:outline-none border-b border-transparent focus:border-[--accent]"
                      />
                      <div className="flex items-center gap-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <div className={cn("w-8 h-4 rounded-full relative transition-colors", rule.enabled ? "bg-[--evolution]" : "bg-white/10")}>
                            <div className={cn("absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all", rule.enabled ? "left-4.5" : "left-0.5")} />
                          </div>
                        </label>
                        <button onClick={() => updateRule(rule.id, 'enabled', !rule.enabled)} className="text-xs text-gray-500">
                          {rule.enabled ? 'ON' : 'OFF'}
                        </button>
                        <button onClick={() => deleteRule(rule.id)} className="p-1 hover:bg-red-500/20 rounded text-gray-500 hover:text-red-400">
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] uppercase text-gray-500 font-bold mb-1 block">IF (Condition)</label>
                        <input
                          type="text"
                          value={rule.condition}
                          onChange={(e) => updateRule(rule.id, 'condition', e.target.value)}
                          className="w-full bg-black/50 border border-white/10 rounded px-3 py-2 text-xs font-mono text-green-400 focus:outline-none focus:border-[--accent]"
                          placeholder='block.type === "zip"'
                        />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase text-gray-500 font-bold mb-1 block">THEN (Action)</label>
                        <input
                          type="text"
                          value={rule.action}
                          onChange={(e) => updateRule(rule.id, 'action', e.target.value)}
                          className="w-full bg-black/50 border border-white/10 rounded px-3 py-2 text-xs font-mono text-amber-400 focus:outline-none focus:border-[--accent]"
                          placeholder='block.color = "#FF0000"'
                        />
                      </div>
                    </div>
                  </div>
                ))}
                
                <button
                  onClick={addRule}
                  className="w-full p-4 border border-dashed border-white/20 rounded-lg text-gray-500 hover:text-white hover:border-[--accent] transition-colors flex items-center justify-center gap-2"
                >
                  <Plus className="h-4 w-4" /> Add Rule
                </button>

                {/* Examples */}
                <div className="mt-6 p-4 bg-[--surface]/30 rounded-lg border border-white/5">
                  <h4 className="text-[10px] uppercase font-bold text-gray-500 mb-3">Example Conditions & Actions</h4>
                  <div className="space-y-2 text-[10px] font-mono">
                    {EXAMPLE_RULES.map((ex, i) => (
                      <div key={i} className="flex gap-2">
                        <span className="text-green-400">IF</span>
                        <span className="text-gray-400">{ex.condition}</span>
                        <span className="text-amber-400">THEN</span>
                        <span className="text-gray-400">{ex.action}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col">
                <textarea
                  value={customScript}
                  onChange={(e) => setCustomScript(e.target.value)}
                  className="flex-1 bg-black/90 p-4 font-mono text-xs text-gray-300 focus:outline-none resize-none leading-relaxed"
                  spellCheck={false}
                />
              </div>
            )}
          </div>

          {/* Output Panel */}
          <div className="w-80 bg-[#050505] flex flex-col">
            <div className="h-10 border-b border-white/5 bg-[--surface]/30 px-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal className="h-3 w-3 text-gray-500" />
                <span className="text-xs font-bold text-gray-500 uppercase">Output</span>
              </div>
              {lastError && <AlertCircle className="h-4 w-4 text-red-400" />}
            </div>
            <div className="flex-1 p-4 overflow-y-auto font-mono text-[10px] space-y-1">
              {output.length === 0 ? (
                <p className="text-gray-600 italic">Run rules to see output...</p>
              ) : (
                output.map((line, i) => (
                  <div 
                    key={i} 
                    className={cn(
                      "border-l-2 pl-2",
                      line.includes('[ERROR]') || line.includes('[FATAL]') 
                        ? "border-red-500 text-red-400" 
                        : line.includes('[RULE]') 
                          ? "border-amber-500 text-amber-400"
                          : "border-gray-700 text-gray-400"
                    )}
                  >
                    {line}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="h-16 border-t border-white/10 bg-[--surface] flex items-center justify-between px-6">
          <div className="text-[10px] text-gray-600 font-mono">
            Available: block.id, block.type, block.label, block.color, block.content, block.files
          </div>
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm text-[--text-dim] hover:text-white hover:bg-white/5 transition-colors">
              Cancel
            </button>
            <button 
              onClick={activeTab === 'rules' ? runRules : runScript}
              className="px-6 py-2 rounded-lg bg-[--accent] text-black font-bold text-sm hover:bg-white transition-colors shadow-[0_0_15px_var(--accent-glow)] flex items-center gap-2"
            >
              <Play className="h-4 w-4" />
              Execute {activeTab === 'rules' ? 'Rules' : 'Script'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
