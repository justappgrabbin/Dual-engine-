import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Database, Layers, Zap, Bot, LayoutTemplate, FileText, Menu, X, Play, Download, Eye, Brain } from "lucide-react";
import { cn } from "@/lib/utils";

const SKETCHIDE_ID = "com.sketchide.app";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const navItems = [
    { href: "/", icon: LayoutTemplate, label: "Build" },
    { href: "/foundry", icon: Layers, label: "Foundry" },
    { href: "/seed", icon: Zap, label: "Seed" },
    { href: "/paper", icon: FileText, label: "Paper" },
    { href: "/registry", icon: Database, label: "Registry" },
    { href: "/agent", icon: Bot, label: "Agent" },
  ];

  return (
    <div className="min-h-screen bg-[--bg] text-white font-sans selection:bg-[--accent] selection:text-white flex flex-col">
      {/* Header with Hamburger Menu */}
      <header className="sticky top-0 z-50 border-b border-[--accent]/50 bg-[--surface]/95 backdrop-blur-md px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Hamburger Button */}
            <button 
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 -ml-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[--accent] to-pink-500 flex items-center justify-center shadow-[0_0_12px_var(--accent-glow)]">
                <Zap className="h-4 w-4 text-white fill-white" />
              </div>
              <div>
                <h1 className="text-sm font-bold tracking-wide text-gradient">SKETCH IDE</h1>
                <span className="text-[8px] font-mono text-emerald-500">{SKETCHIDE_ID}</span>
              </div>
            </div>
          </div>
          
          <div className="text-[10px] text-[--text-dim] font-mono">
            5D Physics
          </div>
        </div>
      </header>

      {/* Dropdown Menu */}
      {menuOpen && (
        <>
          <div className="fixed inset-0 bg-black/60 z-40" onClick={() => setMenuOpen(false)} />
          <div className="fixed top-[60px] left-0 right-0 z-50 bg-[--surface] border-b border-[--accent]/30 shadow-2xl animate-in slide-in-from-top duration-200">
            <nav className="p-4 grid grid-cols-3 gap-3">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href}>
                  <div 
                    onClick={() => setMenuOpen(false)}
                    className={cn(
                      "flex flex-col items-center justify-center p-4 rounded-xl transition-all cursor-pointer",
                      location === item.href
                        ? "bg-[--accent]/20 text-[--accent] shadow-[0_0_15px_var(--accent-glow)]"
                        : "bg-white/5 text-[--text-dim] hover:bg-white/10 hover:text-white"
                    )}
                  >
                    <item.icon className={cn("h-6 w-6 mb-2", location === item.href && "drop-shadow-[0_0_8px_var(--accent)]")} />
                    <span className="text-xs font-medium">{item.label}</span>
                  </div>
                </Link>
              ))}
            </nav>
          </div>
        </>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-auto pb-12">
        {children}
      </main>

      {/* Bottom Bar - Compact */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-[--accent]/30 bg-[--surface]/95 backdrop-blur-md safe-area-inset-bottom">
        <div className="flex items-center justify-around py-1">
          <MasterAction icon={Play} label="Run" />
          <MasterAction icon={Eye} label="Trace" />
          <MasterAction icon={Brain} label="Brain" />
          <MasterAction icon={Download} label="Export" />
        </div>
      </nav>
    </div>
  );
}

function MasterAction({ icon: Icon, label }: { icon: any, label: string }) {
  return (
    <button className="flex flex-col items-center justify-center py-1 px-3 rounded-lg transition-all active:scale-95">
      <Icon className="h-4 w-4 text-[--text-dim]" />
      <span className="text-[8px] text-[--text-dim]">{label}</span>
    </button>
  );
}
