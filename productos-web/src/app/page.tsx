import Link from "next/link";
import { ArrowRight, Brain, Zap, Shield, GitBranch } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-radial from-[#121829] via-[#090B11] to-[#090B11] relative overflow-hidden">
      {/* Background glowing design blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-cyan-500/10 blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="max-w-7xl mx-auto w-full px-6 py-6 flex items-center justify-between border-b border-white/5 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Brain className="h-6 w-6 text-white" />
          </div>
          <span className="font-bold text-xl tracking-tight text-white">
            Product<span className="text-gradient">OS</span>
          </span>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 text-white font-medium text-sm hover:from-indigo-600 hover:to-cyan-600 transition-all shadow-md shadow-indigo-500/20 hover:scale-[1.02] flex items-center gap-2"
          >
            Launch Workspace <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col justify-center max-w-5xl mx-auto px-6 py-20 text-center relative z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-indigo-400 mb-8 animate-fade-in mx-auto backdrop-blur-sm">
          <Zap className="h-3.5 w-3.5 text-cyan-400" /> Introducing Decision Intelligence
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white mb-6 leading-tight max-w-4xl mx-auto">
          The Operational Memory Layer for <span className="text-gradient">Product Teams</span>
        </h1>
        
        <p className="text-lg md:text-xl text-[#94A3B8] mb-12 max-w-2xl mx-auto leading-relaxed">
          Stop losing decision context to Slack threads and buried emails. ProductOS captures every decision, risk, and approval in a single, AI-powered system of record.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-24">
          <Link
            href="/dashboard"
            className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 text-white font-bold hover:from-indigo-600 hover:to-cyan-600 transition-all shadow-lg shadow-indigo-500/25 hover:scale-[1.02] flex items-center justify-center gap-2"
          >
            Enter Dashboard (Mock Auth) <ArrowRight className="h-5 w-5" />
          </Link>
          <a
            href="#features"
            className="w-full sm:w-auto px-8 py-4 rounded-xl bg-white/5 border border-white/10 text-white font-medium hover:bg-white/10 transition-all backdrop-blur-sm"
          >
            Learn More
          </a>
        </div>

        {/* Feature Grid */}
        <div id="features" className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          <div className="p-8 rounded-2xl glass-card relative overflow-hidden group">
            <div className="h-12 w-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-6 text-indigo-400">
              <Brain className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Decision Journal</h3>
            <p className="text-sm text-[#94A3B8] leading-relaxed">
              Structured logs connecting *why* decisions were made, who approved them, and which strategic objectives they support.
            </p>
          </div>

          <div className="p-8 rounded-2xl glass-card relative overflow-hidden group">
            <div className="h-12 w-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mb-6 text-cyan-400">
              <Shield className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Stakeholder Sign-offs</h3>
            <p className="text-sm text-[#94A3B8] leading-relaxed">
              Track approvals cleanly across Legal, Security, and Engineering. Send automated alerts and resolve conflicts fast.
            </p>
          </div>

          <div className="p-8 rounded-2xl glass-card relative overflow-hidden group">
            <div className="h-12 w-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-6 text-purple-400">
              <GitBranch className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Risk & Dependencies</h3>
            <p className="text-sm text-[#94A3B8] leading-relaxed">
              Map system dependencies and track delivery risks proactively before they hit your roadmap or extend your sprints.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 mt-20 text-center text-xs text-[#64748B] z-10 backdrop-blur-md">
        <p>© 2026 ProductOS. Built for portfolio presentation. All Mock Data stored locally.</p>
      </footer>
    </div>
  );
}
