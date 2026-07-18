"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useStore } from "@/store/useStore";
import { 
  AlertTriangle, 
  Plus, 
  X, 
  Check, 
  HelpCircle, 
  GitCommit, 
  ShieldAlert, 
  User, 
  Link2,
  Sparkles,
  ArrowRight,
  TrendingDown
} from "lucide-react";

export default function RisksAndDependencies() {
  const queryClient = useQueryClient();
  const { currentProject, currentUserId, backendUrl } = useStore();
  
  // States
  const [isRiskModalOpen, setIsRiskModalOpen] = useState(false);
  const [isDepModalOpen, setIsDepModalOpen] = useState(false);
  
  // Risk Form States
  const [riskTitle, setRiskTitle] = useState("");
  const [riskSeverity, setRiskSeverity] = useState("high");
  const [riskOwner, setRiskOwner] = useState("");
  const [riskMitigation, setRiskMitigation] = useState("");
  
  // Dependency Form States
  const [depFromTeam, setDepFromTeam] = useState("");
  const [depToTeam, setDepToTeam] = useState("");
  const [depDescription, setDepDescription] = useState("");
  const [depStatus, setDepStatus] = useState("active");

  // 1. Fetch Risks
  const { data: risks, isLoading: isRisksLoading } = useQuery({
    queryKey: ["risks", currentProject?.id, currentUserId],
    queryFn: async () => {
      const res = await fetch(`${backendUrl}/risks/?project_id=${currentProject?.id}`, {
        headers: { Authorization: `Bearer ${currentUserId}` }
      });
      return res.json();
    },
    enabled: !!currentProject?.id
  });

  // 2. Fetch Dependencies
  const { data: dependencies, isLoading: isDepsLoading } = useQuery({
    queryKey: ["dependencies", currentProject?.id, currentUserId],
    queryFn: async () => {
      const res = await fetch(`${backendUrl}/dependencies/?project_id=${currentProject?.id}`, {
        headers: { Authorization: `Bearer ${currentUserId}` }
      });
      return res.json();
    },
    enabled: !!currentProject?.id
  });

  // 3. Create Risk Mutation
  const createRiskMutation = useMutation({
    mutationFn: async (newRisk: any) => {
      const res = await fetch(`${backendUrl}/risks/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${currentUserId}`
        },
        body: JSON.stringify(newRisk)
      });
      if (!res.ok) throw new Error("Failed to save risk");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["risks", currentProject?.id] });
      queryClient.invalidateQueries({ queryKey: ["decisions", currentProject?.id] });
      // Reset Form
      setRiskTitle("");
      setRiskSeverity("high");
      setRiskOwner("");
      setRiskMitigation("");
      setIsRiskModalOpen(false);
    }
  });

  // 4. Update Risk Mutation (Mitigate)
  const updateRiskMutation = useMutation({
    mutationFn: async ({ riskId, updateData }: { riskId: number, updateData: any }) => {
      const res = await fetch(`${backendUrl}/risks/${riskId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${currentUserId}`
        },
        body: JSON.stringify(updateData)
      });
      if (!res.ok) throw new Error("Failed to update risk");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["risks", currentProject?.id] });
    }
  });

  // 5. Create Dependency Mutation
  const createDepMutation = useMutation({
    mutationFn: async (newDep: any) => {
      const res = await fetch(`${backendUrl}/dependencies/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${currentUserId}`
        },
        body: JSON.stringify(newDep)
      });
      if (!res.ok) throw new Error("Failed to save dependency");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dependencies", currentProject?.id] });
      // Reset Form
      setDepFromTeam("");
      setDepToTeam("");
      setDepDescription("");
      setDepStatus("active");
      setIsDepModalOpen(false);
    }
  });

  // 6. Update Dependency Mutation
  const updateDepMutation = useMutation({
    mutationFn: async ({ depId, updateData }: { depId: number, updateData: any }) => {
      const res = await fetch(`${backendUrl}/dependencies/${depId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${currentUserId}`
        },
        body: JSON.stringify(updateData)
      });
      if (!res.ok) throw new Error("Failed to update dependency");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dependencies", currentProject?.id] });
    }
  });

  const handleRiskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!riskTitle || !riskOwner || !currentProject) return;
    createRiskMutation.mutate({
      project_id: currentProject.id,
      title: riskTitle,
      severity: riskSeverity,
      owner: riskOwner,
      status: "open",
      mitigation: riskMitigation
    });
  };

  const handleDepSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!depFromTeam || !depToTeam || !depDescription || !currentProject) return;
    createDepMutation.mutate({
      project_id: currentProject.id,
      from_team: depFromTeam,
      to_team: depToTeam,
      description: depDescription,
      status: depStatus
    });
  };

  // Heatmap helper calculations
  const openRisks = risks ? risks.filter((r: any) => r.status === "open") : [];
  const criticalCount = openRisks.filter((r: any) => r.severity === "critical").length;
  const highCount = openRisks.filter((r: any) => r.severity === "high").length;
  const mediumCount = openRisks.filter((r: any) => r.severity === "medium").length;
  const lowCount = openRisks.filter((r: any) => r.severity === "low").length;

  // Dependency Flow node positioning
  const nodePositions: Record<string, { x: number; y: number }> = {
    "Legal": { x: 80, y: 70 },
    "Security": { x: 260, y: 70 },
    "Engineering": { x: 440, y: 70 },
    "Compliance": { x: 260, y: 190 }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* CSS custom animations for SVG flowchart */}
      <style jsx global>{`
        @keyframes marching-ants {
          to {
            stroke-dashoffset: -20;
          }
        }
        .animate-dash-active {
          stroke-dasharray: 6, 4;
          animation: marching-ants 0.8s linear infinite;
        }
        .animate-dash-blocked {
          stroke-dasharray: 6, 4;
          animation: marching-ants 1.5s linear infinite;
        }
      `}</style>

      {/* Page Header */}
      <div className="border-b border-white/5 pb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-indigo-400" /> Risks & Dependencies
          </h1>
          <p className="text-xs text-[#64748B]">Manage cross-team blockers, visualize pathways, and track mitigation plans.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setIsRiskModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold text-xs transition-all flex items-center gap-1.5"
          >
            <Plus className="h-4 w-4 text-indigo-400" /> Log Risk
          </button>
          <button
            onClick={() => setIsDepModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 text-white font-bold text-xs hover:from-indigo-600 hover:to-cyan-600 transition-all flex items-center gap-1.5 shadow-md shadow-indigo-500/10"
          >
            <Plus className="h-4 w-4" /> Add Dependency
          </button>
        </div>
      </div>

      {/* Top Grid: Heatmap & Visual Dependency Flow */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Risk Heatmap Quadrant */}
        <div className="p-6 rounded-2xl glass-card space-y-6 flex flex-col justify-between">
          <div>
            <h3 className="font-extrabold text-sm text-white">Risk Exposure Matrix</h3>
            <p className="text-xs text-[#64748B]">Overview of open delivery risks grouped by severity.</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4 my-2">
            {/* Critical */}
            <div className="p-4 rounded-xl bg-rose-500/5 border border-rose-500/10 flex flex-col justify-between h-24">
              <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider">Critical</span>
              <div className="flex justify-between items-end">
                <span className="text-3xl font-black text-white">{criticalCount}</span>
                <span className="text-[9px] font-bold text-rose-500 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/10">-20% Health</span>
              </div>
            </div>
            
            {/* High */}
            <div className="p-4 rounded-xl bg-orange-500/5 border border-orange-500/10 flex flex-col justify-between h-24">
              <span className="text-[10px] font-bold text-orange-400 uppercase tracking-wider">High</span>
              <div className="flex justify-between items-end">
                <span className="text-3xl font-black text-white">{highCount}</span>
                <span className="text-[9px] font-bold text-orange-500 bg-orange-500/10 px-1.5 py-0.5 rounded border border-orange-500/10">-10% Health</span>
              </div>
            </div>
            
            {/* Medium */}
            <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/10 flex flex-col justify-between h-24">
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">Medium</span>
              <div className="flex justify-between items-end">
                <span className="text-3xl font-black text-white">{mediumCount}</span>
                <span className="text-[9px] font-bold text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/10">-5% Health</span>
              </div>
            </div>
            
            {/* Low */}
            <div className="p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/10 flex flex-col justify-between h-24">
              <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Low / Mitigated</span>
              <div className="flex justify-between items-end">
                <span className="text-3xl font-black text-white">{lowCount}</span>
                <span className="text-[9px] font-bold text-indigo-500 bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/10">0% Health</span>
              </div>
            </div>
          </div>
          
          <div className="text-[10px] text-[#64748B] text-center border-t border-white/5 pt-4">
            Confidence recalculates automatically when risks are mitigated.
          </div>
        </div>

        {/* Right 2 Columns: SVG Dependency Engine */}
        <div className="lg:col-span-2 p-6 rounded-2xl glass-card space-y-6 flex flex-col justify-between">
          <div>
            <h3 className="font-extrabold text-sm text-white">Cross-Team Dependency Flow</h3>
            <p className="text-xs text-[#64748B]">Real-time visual map of compliance, legal, and operational paths.</p>
          </div>

          <div className="relative w-full bg-[#0C0E17]/40 border border-white/5 rounded-2xl p-6 flex justify-center items-center min-h-[260px] overflow-hidden">
            <svg viewBox="0 0 520 260" className="w-full max-w-[520px] h-auto overflow-visible select-none">
              <defs>
                <marker id="arrow-active" viewBox="0 0 10 10" refX="18" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 1 L 10 5 L 0 9 z" fill="#38BDF8" />
                </marker>
                <marker id="arrow-blocked" viewBox="0 0 10 10" refX="18" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 1 L 10 5 L 0 9 z" fill="#F87171" />
                </marker>
                <marker id="arrow-resolved" viewBox="0 0 10 10" refX="18" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 1 L 10 5 L 0 9 z" fill="#34D399" />
                </marker>
              </defs>

              {/* Dynamic Dependency Lines */}
              {dependencies && dependencies.map((dep: any) => {
                const from = nodePositions[dep.from_team];
                const to = nodePositions[dep.to_team];
                
                if (!from || !to) return null;

                const isBlocked = dep.status === "blocked";
                const isResolved = dep.status === "resolved";
                
                // Color configuration
                let strokeColor = "#38BDF8"; // active/default cyan
                let markerId = "arrow-active";
                let dashClass = "animate-dash-active";
                
                if (isBlocked) {
                  strokeColor = "#F87171"; // red
                  markerId = "arrow-blocked";
                  dashClass = "animate-dash-blocked";
                } else if (isResolved) {
                  strokeColor = "#34D399"; // green
                  markerId = "arrow-resolved";
                  dashClass = "";
                }

                // Curved paths for distinct look
                let pathD = `M ${from.x} ${from.y} L ${to.x} ${to.y}`;
                if (dep.from_team === "Legal" && dep.to_team === "Security") {
                  pathD = `M ${from.x} ${from.y} C ${from.x + 80} ${from.y - 20}, ${to.x - 80} ${to.y - 20}, ${to.x} ${to.y}`;
                } else if (dep.from_team === "Security" && dep.to_team === "Legal") {
                  pathD = `M ${from.x} ${from.y} C ${from.x - 80} ${from.y + 20}, ${to.x + 80} ${to.y + 20}, ${to.x} ${to.y}`;
                } else if (dep.from_team === "Security" && dep.to_team === "Compliance") {
                  pathD = `M ${from.x} ${from.y} L ${to.x} ${to.y}`;
                }

                return (
                  <g key={dep.id} className="group/path">
                    <path
                      d={pathD}
                      fill="none"
                      stroke={strokeColor}
                      strokeWidth={2}
                      markerEnd={`url(#${markerId})`}
                      className={dashClass}
                    />
                    {/* Hover tooltip anchor */}
                    <title>{`${dep.from_team} depends on ${dep.to_team}: ${dep.description} (${dep.status})`}</title>
                  </g>
                );
              })}

              {/* SVG Nodes */}
              {Object.entries(nodePositions).map(([team, pos]) => {
                // Find if this team has any blocked dependencies
                const hasBlocker = dependencies?.some((d: any) => 
                  d.status === "blocked" && (d.from_team === team || d.to_team === team)
                );
                
                let ringColor = "border-white/10";
                let glowColor = "rgba(255, 255, 255, 0.05)";
                let bgBadge = "bg-white/5";
                
                if (hasBlocker) {
                  ringColor = "stroke-rose-500/40";
                  glowColor = "rgba(239, 68, 68, 0.15)";
                  bgBadge = "bg-rose-500/10";
                }

                return (
                  <g key={team} className="group/node cursor-pointer">
                    {/* Glowing shadow circle */}
                    <circle cx={pos.x} cy={pos.y} r="25" fill={glowColor} className="transition-all duration-300 group-hover/node:r-[30]" />
                    
                    {/* Core node circle */}
                    <circle cx={pos.x} cy={pos.y} r="20" fill="#121622" stroke={hasBlocker ? "#EF4444" : "#6366F1"} strokeWidth="2.5" />
                    
                    {/* Text Label */}
                    <text x={pos.x} y={pos.y + 35} textAnchor="middle" fill="#FFFFFF" fontSize="10" fontWeight="bold">
                      {team}
                    </text>
                    
                    {/* Small inner indicator dot */}
                    <circle cx={pos.x} cy={pos.y} r="4" fill={hasBlocker ? "#EF4444" : "#06B6D4"} />
                  </g>
                );
              })}
            </svg>
          </div>
          
          <div className="flex gap-4 items-center justify-center text-[10px] text-[#64748B]">
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-cyan-400" /> Active Dependency</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-rose-500" /> Blocked Delivery Path</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-400" /> Resolved Path</span>
          </div>
        </div>
      </div>

      {/* Bottom Sections: Risks List & Dependencies List */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        
        {/* Open Risks List */}
        <div className="p-6 rounded-2xl glass-card space-y-6">
          <div className="border-b border-white/5 pb-4">
            <h3 className="font-extrabold text-sm text-white">Project Risks ({openRisks.length})</h3>
            <p className="text-xs text-[#64748B]">Detailed log of registered risks and planned mitigations.</p>
          </div>

          <div className="space-y-4">
            {isRisksLoading ? (
              <div className="text-center py-10 text-xs text-[#64748B]">Loading risks...</div>
            ) : risks && risks.length > 0 ? (
              risks.map((risk: any) => {
                const isClosed = risk.status === "closed";
                const isCrit = risk.severity === "critical";
                const isHigh = risk.severity === "high";
                
                let severityBadge = "text-indigo-400 bg-indigo-500/10 border-indigo-500/20";
                if (isCrit) severityBadge = "text-rose-400 bg-rose-500/10 border-rose-500/20";
                else if (isHigh) severityBadge = "text-orange-400 bg-orange-500/10 border-orange-500/20";
                
                return (
                  <div key={risk.id} className={`p-4 rounded-xl bg-[#121622]/40 border ${isClosed ? "border-white/5 opacity-55" : "border-white/5 hover:border-white/10"} transition-all space-y-3`}>
                    <div className="flex justify-between items-start gap-2">
                      <div className="min-w-0">
                        <h4 className={`font-bold text-xs text-white truncate ${isClosed ? "line-through text-[#64748B]" : ""}`}>
                          {risk.title}
                        </h4>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <span className={`text-[9px] px-2 py-0.5 rounded font-black uppercase border ${severityBadge}`}>
                          {risk.severity}
                        </span>
                        <span className={`text-[9px] px-2 py-0.5 rounded font-black uppercase border ${
                          isClosed 
                            ? "bg-slate-500/10 text-[#64748B] border-white/5" 
                            : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                        }`}>
                          {risk.status}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-[#94A3B8]">{risk.mitigation || "No mitigation details recorded."}</p>

                    <div className="flex justify-between items-center text-[10px] text-[#64748B] pt-2 border-t border-white/5">
                      <span className="flex items-center gap-1"><User className="h-3.5 w-3.5" /> Owner: {risk.owner}</span>
                      
                      {!isClosed && (
                        <button
                          onClick={() => updateRiskMutation.mutate({ riskId: risk.id, updateData: { status: "closed" } })}
                          className="px-2 py-1 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-bold hover:bg-indigo-500/25 transition-all"
                        >
                          Mitigate & Close
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-10 text-xs text-[#64748B]">No risks logged.</div>
            )}
          </div>
        </div>

        {/* Cross-team Dependencies List */}
        <div className="p-6 rounded-2xl glass-card space-y-6">
          <div className="border-b border-white/5 pb-4">
            <h3 className="font-extrabold text-sm text-white">Cross-Team Connections ({dependencies?.length || 0})</h3>
            <p className="text-xs text-[#64748B]">Dependencies and blocker status between organizational teams.</p>
          </div>

          <div className="space-y-4">
            {isDepsLoading ? (
              <div className="text-center py-10 text-xs text-[#64748B]">Loading dependencies...</div>
            ) : dependencies && dependencies.length > 0 ? (
              dependencies.map((dep: any) => {
                const isBlocked = dep.status === "blocked";
                const isResolved = dep.status === "resolved";
                
                return (
                  <div key={dep.id} className="p-4 rounded-xl bg-[#121622]/40 border border-white/5 hover:border-white/10 transition-all space-y-3">
                    <div className="flex justify-between items-center gap-3">
                      <div className="flex items-center gap-2 font-bold text-xs text-white">
                        <span className="text-cyan-400">{dep.from_team}</span>
                        <ArrowRight className="h-3 w-3 text-[#64748B]" />
                        <span className="text-indigo-400">{dep.to_team}</span>
                      </div>
                      <span className={`text-[9px] px-2 py-0.5 rounded font-black uppercase border ${
                        isBlocked 
                          ? "bg-rose-500/10 text-rose-400 border-rose-500/20" 
                          : isResolved 
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : "bg-cyan-500/10 text-cyan-400 border-cyan-500/20"
                      }`}>
                        {dep.status}
                      </span>
                    </div>

                    <p className="text-xs text-[#94A3B8]">{dep.description}</p>

                    <div className="flex justify-end items-center gap-2 pt-2 border-t border-white/5 text-[10px]">
                      {isBlocked && (
                        <button
                          onClick={() => updateDepMutation.mutate({ depId: dep.id, updateData: { status: "active" } })}
                          className="px-2.5 py-1 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-bold hover:bg-indigo-500/25 transition-all"
                        >
                          Mark Active (Unblock)
                        </button>
                      )}
                      {!isResolved && (
                        <button
                          onClick={() => updateDepMutation.mutate({ depId: dep.id, updateData: { status: "resolved" } })}
                          className="px-2.5 py-1 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold hover:bg-emerald-500/25 transition-all"
                        >
                          Resolve Path
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-10 text-xs text-[#64748B]">No dependencies tracked.</div>
            )}
          </div>
        </div>

      </div>

      {/* Log Risk Modal */}
      {isRiskModalOpen && (
        <div className="fixed inset-0 bg-[#090B11]/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-[#0C0E17] border border-white/10 rounded-2xl max-w-md w-full p-6 space-y-6 glow-indigo">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-indigo-400" />
                <h3 className="font-extrabold text-base text-white">Log Delivery Risk</h3>
              </div>
              <button onClick={() => setIsRiskModalOpen(false)} className="text-[#64748B] hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleRiskSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-[#64748B] block">Risk Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Apple developer account verification queue lag"
                  value={riskTitle}
                  onChange={(e) => setRiskTitle(e.target.value)}
                  className="w-full bg-[#121622]/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500/50"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-[#64748B] block">Severity</label>
                <select
                  value={riskSeverity}
                  onChange={(e) => setRiskSeverity(e.target.value)}
                  className="w-full bg-[#121622]/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500/50"
                >
                  <option value="low">Low (No deduction)</option>
                  <option value="medium">Medium (-5% health)</option>
                  <option value="high">High (-10% health)</option>
                  <option value="critical">Critical (-20% health)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-[#64748B] block">Owner (Responsible Individual)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Sarah Jenkins"
                  value={riskOwner}
                  onChange={(e) => setRiskOwner(e.target.value)}
                  className="w-full bg-[#121622]/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500/50"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-[#64748B] block">Mitigation Strategy</label>
                <textarea
                  rows={3}
                  placeholder="Provide concrete action steps to address or bypass this risk..."
                  value={riskMitigation}
                  onChange={(e) => setRiskMitigation(e.target.value)}
                  className="w-full bg-[#121622]/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500/50"
                />
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setIsRiskModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-white/10 text-white text-xs hover:bg-white/5 transition-all font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createRiskMutation.isPending}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600 text-white font-bold text-xs transition-all shadow-md"
                >
                  {createRiskMutation.isPending ? "Logging..." : "Log Risk"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Dependency Modal */}
      {isDepModalOpen && (
        <div className="fixed inset-0 bg-[#090B11]/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-[#0C0E17] border border-white/10 rounded-2xl max-w-md w-full p-6 space-y-6 glow-cyan">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <div className="flex items-center gap-2">
                <Link2 className="h-5 w-5 text-indigo-400" />
                <h3 className="font-extrabold text-base text-white">Create Cross-Team Dependency</h3>
              </div>
              <button onClick={() => setIsDepModalOpen(false)} className="text-[#64748B] hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleDepSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-[#64748B] block">Dependent Team</label>
                  <select
                    value={depFromTeam}
                    onChange={(e) => setDepFromTeam(e.target.value)}
                    required
                    className="w-full bg-[#121622]/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500/50"
                  >
                    <option value="">Select Team</option>
                    <option value="Engineering">Engineering</option>
                    <option value="Security">Security</option>
                    <option value="Legal">Legal</option>
                    <option value="Compliance">Compliance</option>
                  </select>
                </div>
                
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-[#64748B] block">Blocking / Provider Team</label>
                  <select
                    value={depToTeam}
                    onChange={(e) => setDepToTeam(e.target.value)}
                    required
                    className="w-full bg-[#121622]/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500/50"
                  >
                    <option value="">Select Team</option>
                    <option value="Engineering">Engineering</option>
                    <option value="Security">Security</option>
                    <option value="Legal">Legal</option>
                    <option value="Compliance">Compliance</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-[#64748B] block">Status</label>
                <select
                  value={depStatus}
                  onChange={(e) => setDepStatus(e.target.value)}
                  className="w-full bg-[#121622]/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500/50"
                >
                  <option value="active">Active (Pending resolution)</option>
                  <option value="blocked">Blocked (-15% health)</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-[#64748B] block">Dependency Description</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Detail exactly what requires verification/deliverable between the teams..."
                  value={depDescription}
                  onChange={(e) => setDepDescription(e.target.value)}
                  className="w-full bg-[#121622]/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500/50"
                />
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setIsDepModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-white/10 text-white text-xs hover:bg-white/5 transition-all font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createDepMutation.isPending}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600 text-white font-bold text-xs transition-all shadow-md"
                >
                  {createDepMutation.isPending ? "Adding..." : "Add Connection"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
