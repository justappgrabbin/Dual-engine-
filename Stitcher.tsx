import { useState } from "react";
import { 
  X, Check, AlertTriangle, FileText, Split, ArrowRight, 
  ChevronRight, ChevronDown, Layers, FileJson, FileCode,
  Settings, Sliders, Terminal, Activity
} from "lucide-react";
import { cn } from "@/lib/utils";

// Types for the Stitcher
interface Conflict {
  path: string;
  type: 'content' | 'binary' | 'missing';
  resolution: 'a' | 'b' | 'merge' | 'keep-both';
  contentA?: string;
  contentB?: string;
}

interface StitcherProps {
  filesA: Record<string, string>;
  filesB: Record<string, string>;
  labelA: string;
  labelB: string;
  onClose: () => void;
  onComplete: (mergedFiles: Record<string, string>) => void;
}

export default function Stitcher({ 
  filesA, filesB, labelA, labelB, onClose, onComplete 
}: StitcherProps) {
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [activeConflict, setActiveConflict] = useState<number>(0);
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  
  // "Causal Inference" Toggles
  const [mergeStrategy, setMergeStrategy] = useState<'smart' | 'manual' | 'append'>('smart');
  const [strictMode, setStrictMode] = useState(false);
  const [preserveHistory, setPreserveHistory] = useState(true);

  // Initialize conflicts on mount
  useState(() => {
    const newConflicts: Conflict[] = [];
    const allPaths = new Set([...Object.keys(filesA), ...Object.keys(filesB)]);

    allPaths.forEach(path => {
      const inA = path in filesA;
      const inB = path in filesB;

      if (inA && inB && filesA[path] !== filesB[path]) {
        newConflicts.push({
          path,
          type: 'content',
          resolution: 'merge', // Default to smart merge
          contentA: filesA[path],
          contentB: filesB[path]
        });
      }
    });

    setConflicts(newConflicts);
    setIsAnalyzing(false);
  });

  const resolveConflict = (index: number, resolution: Conflict['resolution']) => {
    const updated = [...conflicts];
    updated[index].resolution = resolution;
    setConflicts(updated);
  };

  const handleFinalize = () => {
    const merged: Record<string, string> = { ...filesA, ...filesB };

    conflicts.forEach(c => {
      let content = '';
      if (c.resolution === 'a') {
        merged[c.path] = filesA[c.path];
      } else if (c.resolution === 'b') {
        merged[c.path] = filesB[c.path];
      } else if (c.resolution === 'keep-both') {
        merged[c.path] = filesA[c.path];
        merged[`${c.path}.conflict`] = filesB[c.path];
      } else if (c.resolution === 'merge') {
        // Simple append merge for MVP
        const header = preserveHistory ? `// <<< ${labelA} (Timestamp: ${Date.now()})\n` : '';
        const footer = preserveHistory ? `\n// >>> ${labelB}\n` : '';
        const separator = `\n// === CAUSAL MERGE ===\n`;
        merged[c.path] = `${header}${filesA[c.path]}${separator}${filesB[c.path]}${footer}`;
      }
    });

    onComplete(merged);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-6xl h-[85vh] bg-[#0d1117] border border-[--accent]/30 rounded-xl shadow-2xl flex flex-col overflow-hidden">
        
        {/* Header with System Status */}
        <div className="h-14 border-b border-white/10 bg-[--surface] flex items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <Activity className="h-5 w-5 text-[--evolution]" />
            <h2 className="text-lg font-bold text-white tracking-wide">
              Causal <span className="text-[--evolution]">Inference Engine</span>
            </h2>
            <div className="h-5 w-px bg-white/10 mx-2" />
            <div className="flex items-center gap-2 text-xs font-mono bg-black/30 px-3 py-1 rounded border border-white/5">
              <span className="text-emerald-400">●</span>
              <span className="text-[--text-dim]">RUNTIME:</span>
              <span className="text-white">BROWSER_V8</span>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X className="h-5 w-5 text-[--text-dim]" />
          </button>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* Settings / Toggles Panel (Left) */}
          <div className="w-64 bg-[#050505] border-r border-white/5 flex flex-col">
            <div className="p-4 border-b border-white/5 bg-[--surface]/20">
              <h3 className="text-xs font-bold uppercase tracking-widest text-[--text-dim] flex items-center gap-2">
                <Sliders className="h-3 w-3" /> Inference Logic
              </h3>
            </div>
            
            <div className="p-4 space-y-6">
              {/* Strategy Toggle */}
              <div className="space-y-3">
                <label className="text-[10px] uppercase font-bold text-[--text-dim]">Merge Strategy</label>
                <div className="flex flex-col gap-1">
                  {['smart', 'manual', 'append'].map((s) => (
                    <button
                      key={s}
                      onClick={() => setMergeStrategy(s as any)}
                      className={cn(
                        "text-xs text-left px-3 py-2 rounded border transition-all",
                        mergeStrategy === s 
                          ? "bg-[--accent]/20 border-[--accent] text-white" 
                          : "border-white/10 text-gray-500 hover:bg-white/5"
                      )}
                    >
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Switches */}
              <div className="space-y-3">
                <label className="text-[10px] uppercase font-bold text-[--text-dim]">Parameters</label>
                
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className={cn("w-8 h-4 rounded-full relative transition-colors", strictMode ? "bg-[--design]" : "bg-white/10")}>
                    <div className={cn("absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all", strictMode ? "left-4.5" : "left-0.5")} />
                  </div>
                  <span className="text-xs text-gray-400 group-hover:text-white">Strict Mode</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className={cn("w-8 h-4 rounded-full relative transition-colors", preserveHistory ? "bg-[--evolution]" : "bg-white/10")}>
                    <div className={cn("absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all", preserveHistory ? "left-4.5" : "left-0.5")} />
                  </div>
                  <span className="text-xs text-gray-400 group-hover:text-white">Preserve History</span>
                </label>
              </div>

              {/* Mini CLI Output */}
              <div className="mt-4 p-3 bg-black rounded border border-white/10 font-mono text-[10px] text-green-400 h-32 overflow-hidden opacity-70">
                <div className="border-b border-white/10 pb-1 mb-2 text-gray-500 flex items-center gap-1">
                  <Terminal className="h-3 w-3" /> KERNEL.LOG
                </div>
                <p>Initializing Inference...</p>
                <p>{'>'} Analyzing {Object.keys(filesA).length + Object.keys(filesB).length} files</p>
                <p>{'>'} Detected {conflicts.length} causal conflicts</p>
                <p>{'>'} Strategy: {mergeStrategy.toUpperCase()}</p>
                {strictMode && <p>{'>'} STRICT_MODE: ACTIVE</p>}
              </div>
            </div>
          </div>

          {/* Conflict Manager (Middle) */}
          <div className="w-64 bg-[#0a0a0a] border-r border-white/5 flex flex-col">
            <div className="p-4 border-b border-white/5 bg-[--surface]/50">
              <h3 className="text-xs font-bold uppercase tracking-widest text-[--text-dim] flex items-center gap-2">
                <AlertTriangle className="h-3 w-3 text-amber-400" />
                Conflicts ({conflicts.length})
              </h3>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {conflicts.map((c, i) => (
                <button
                  key={c.path}
                  onClick={() => setActiveConflict(i)}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded text-xs font-mono truncate transition-colors flex items-center gap-2",
                    activeConflict === i 
                      ? "bg-[--accent]/10 text-[--accent] border border-[--accent]/20" 
                      : "text-[--text-dim] hover:bg-white/5"
                  )}
                >
                  <FileIcon path={c.path} />
                  {c.path}
                </button>
              ))}
              {conflicts.length === 0 && (
                <div className="p-8 text-center text-[--text-dim] text-sm italic">
                  No conflicts detected. 
                  <br/>Ready to stitch.
                </div>
              )}
            </div>
          </div>

          {/* Diff View (Right) */}
          <div className="flex-1 flex flex-col bg-[#0d1117]">
            {conflicts.length > 0 ? (
              <>
                <div className="h-10 border-b border-white/5 flex items-center px-4 justify-between bg-[--surface]/20">
                  <span className="text-xs font-mono text-[--text-dim]">{conflicts[activeConflict]?.path}</span>
                  <div className="flex items-center gap-2">
                    <ResolutionBadge resolution={conflicts[activeConflict]?.resolution} />
                  </div>
                </div>
                
                <div className="flex-1 flex overflow-hidden">
                  {/* Side A */}
                  <div className="flex-1 border-r border-white/5 flex flex-col">
                    <div className="h-8 bg-[--surface]/10 px-3 flex items-center text-[10px] uppercase font-bold text-[--design] tracking-wider border-b border-white/5">
                      {labelA}
                    </div>
                    <textarea 
                      readOnly 
                      value={conflicts[activeConflict]?.contentA || ''} 
                      className="flex-1 bg-transparent p-4 font-mono text-xs text-gray-400 focus:outline-none resize-none leading-relaxed"
                    />
                  </div>
                  
                  {/* Side B */}
                  <div className="flex-1 flex flex-col">
                    <div className="h-8 bg-[--surface]/10 px-3 flex items-center text-[10px] uppercase font-bold text-[--being] tracking-wider border-b border-white/5">
                      {labelB}
                    </div>
                    <textarea 
                      readOnly 
                      value={conflicts[activeConflict]?.contentB || ''} 
                      className="flex-1 bg-transparent p-4 font-mono text-xs text-gray-400 focus:outline-none resize-none leading-relaxed"
                    />
                  </div>
                </div>

                {/* Controls */}
                <div className="h-16 border-t border-white/10 bg-[--surface] flex items-center justify-center gap-4 px-6">
                  <ResolveButton 
                    label="Use A" 
                    active={conflicts[activeConflict]?.resolution === 'a'} 
                    onClick={() => resolveConflict(activeConflict, 'a')}
                    color="border-[--design]"
                  />
                  <ResolveButton 
                    label="Use B" 
                    active={conflicts[activeConflict]?.resolution === 'b'} 
                    onClick={() => resolveConflict(activeConflict, 'b')}
                    color="border-[--being]"
                  />
                  <ResolveButton 
                    label="Merge Both" 
                    active={conflicts[activeConflict]?.resolution === 'merge'} 
                    onClick={() => resolveConflict(activeConflict, 'merge')}
                    color="border-[--evolution]"
                  />
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center flex-col gap-4 text-[--text-dim]">
                <Check className="h-16 w-16 text-emerald-500 opacity-20" />
                <p>Systems aligned.</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="h-16 border-t border-white/10 bg-[--surface] flex items-center justify-end px-6 gap-4">
          <div className="mr-auto text-[10px] text-gray-600 font-mono flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"/>
            KERNEL_ACTIVE
          </div>
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm text-[--text-dim] hover:text-white hover:bg-white/5 transition-colors">
            Cancel
          </button>
          <button 
            onClick={handleFinalize}
            className="px-6 py-2 rounded-lg bg-[--accent] text-black font-bold text-sm hover:bg-white transition-colors shadow-[0_0_15px_var(--accent-glow)] flex items-center gap-2"
          >
            <Layers className="h-4 w-4" />
            Process Stitch
          </button>
        </div>
      </div>
    </div>
  );
}

function FileIcon({ path }: { path: string }) {
  if (path.endsWith('json')) return <FileJson className="h-3 w-3 text-yellow-400" />;
  if (path.endsWith('js') || path.endsWith('ts')) return <FileCode className="h-3 w-3 text-blue-400" />;
  return <FileText className="h-3 w-3 text-gray-400" />;
}

function ResolutionBadge({ resolution }: { resolution: string }) {
  const colors = {
    'a': 'bg-[--design]/20 text-[--design]',
    'b': 'bg-[--being]/20 text-[--being]',
    'merge': 'bg-[--evolution]/20 text-[--evolution]',
    'keep-both': 'bg-[--movement]/20 text-[--movement]',
  };
  return (
    <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold uppercase", colors[resolution as keyof typeof colors])}>
      Res: {resolution}
    </span>
  );
}

function ResolveButton({ label, active, onClick, color }: any) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-4 py-2 rounded border transition-all text-xs font-bold uppercase tracking-wider",
        active 
          ? `${color} bg-white/10 text-white shadow-[0_0_10px_rgba(255,255,255,0.1)]` 
          : "border-white/10 text-[--text-dim] hover:border-white/30 hover:bg-white/5"
      )}
    >
      {label}
    </button>
  );
}
