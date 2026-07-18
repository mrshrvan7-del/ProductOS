"use client";

import React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useStore } from "@/store/useStore";
import { 
  FileText, 
  CheckSquare, 
  Users, 
  TrendingUp, 
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Plus,
  HelpCircle,
  Clock,
  Skull
} from "lucide-react";

export default function DashboardOverview() {
  const { currentProject, currentUserId, backendUrl } = useStore();

  // 1. Fetch Decisions
  const { data: decisions } = useQuery({
    queryKey: ["decisions", currentProject?.id, currentUserId],
    queryFn: async () => {
      const res = await fetch(`${backendUrl}/decisions/?project_id=${currentProject?.id}`, {
        headers: { Authorization: `Bearer ${currentUserId}` }
      });
      return res.json();
    },
    enabled: !!currentProject?.id
  });

  // 2. Fetch Stakeholders
  const { data: stakeholders } = useQuery({
    queryKey: ["stakeholders", currentProject?.id, currentUserId],
    queryFn: async () => {
      const res = await fetch(`${backendUrl}/approvals/project-stakeholders/${currentProject?.id}`, {
        headers: { Authorization: `Bearer ${currentUserId}` }
      });
      return res.json();
    },
    enabled: !!currentProject?.id
  });

  // 3. Fetch Risks
  const { data: risks } = useQuery({
    queryKey: ["risks", currentProject?.id, currentUserId],
    queryFn: async () => {
      const res = await fetch(`${backendUrl}/risks/?project_id=${currentProject?.id}`, {
        headers: { Authorization: `Bearer ${currentUserId}` }
      });
      return res.json();
    },
    enabled: !!currentProject?.id
  });

  // 4. Fetch Dependencies
  const { data: dependencies } = useQuery({
    queryKey: ["dependencies", currentProject?.id, currentUserId],
    queryFn: async () => {
      const res = await fetch(`${backendUrl}/dependencies/?project_id=${currentProject?.id}`, {
        headers: { Authorization: `Bearer ${currentUserId}` }
      });
      return res.json();
    },
    enabled: !!currentProject?.id
  });

  // 5. Fetch Pending Approvals for current user
  const { data: pendingApprovals } = useQuery({
    queryKey: ["pendingApprovals", currentUserId],
    queryFn: async () => {
      const res = await fetch(`${backendUrl}/approvals/pending`, {
        headers: { Authorization: `Bearer ${currentUserId}` }
      });
      return res.json();
    },
    enabled: !!currentUserId
  });

  // Calculations & Counts
  const totalDecisions = decisions ? decisions.length : 0;
  const totalStakeholders = stakeholders ? stakeholders.length : 0;
  const pendingUserApprovals = pendingApprovals ? pendingApprovals.length : 0;

  // Pending decisions (decisions that have at least one pending approval)
  let pendingDecisionsCount = 0;
  let totalProjectPendingApprovals = 0;
  if (decisions) {
    decisions.forEach((dec: any) => {
      if (dec.approvals && dec.approvals.length > 0) {
        const isPending = dec.approvals.some((a: any) => a.status === "pending");
        if (isPending) {
          pendingDecisionsCount++;
        }
        totalProjectPendingApprovals += dec.approvals.filter((a: any) => a.status === "pending").length;
      }
    });
  }

  // Open risks count by severity
  const openRisks = risks ? risks.filter((r: any) => r.status === "open") : [];
  const openRisksCount = openRisks.length;
  const criticalRisksCount = openRisks.filter((r: any) => r.severity === "critical").length;
  const highRisksCount = openRisks.filter((r: any) => r.severity === "high").length;
  const mediumRisksCount = openRisks.filter((r: any) => r.severity === "medium").length;

  // Blocked dependencies count
  const blockedDependencies = dependencies ? dependencies.filter((d: any) => d.status === "blocked") : [];
  const blockedDependenciesCount = blockedDependencies.length;

  // Delivery Confidence Engine Scoring Algorithm (from EDD v2.0)
  // Confidence = max(0, 100 - (5D + 5M + 10H + 20C + 15B))
  const penaltyD = pendingDecisionsCount * 5;
  const penaltyM = mediumRisksCount * 5;
  const penaltyH = highRisksCount * 10;
  const penaltyC = criticalRisksCount * 20;
  const penaltyB = blockedDependenciesCount * 15;
  
  const confidenceScore = Math.max(
    0,
    100 - penaltyD - penaltyM - penaltyH - penaltyC - penaltyB
  );

  // Confidence Bands
  let confidenceStatus = "Healthy";
  let confidenceColor = "text-emerald-400";
  let confidenceBg = "bg-emerald-500/10 border-emerald-500/20";
  let confidenceDot = "bg-emerald-500";

  if (confidenceScore <= 39) {
    confidenceStatus = "Critical Blocker";
    confidenceColor = "text-rose-400";
    confidenceBg = "bg-rose-500/10 border-rose-500/20";
    confidenceDot = "bg-rose-500";
  } else if (confidenceScore <= 59) {
    confidenceStatus = "At Risk";
    confidenceColor = "text-orange-400";
    confidenceBg = "bg-orange-500/10 border-orange-500/20";
    confidenceDot = "bg-orange-500";
  } else if (confidenceScore <= 79) {
    confidenceStatus = "Needs Attention";
    confidenceColor = "text-amber-400";
    confidenceBg = "bg-amber-500/10 border-amber-500/20";
    confidenceDot = "bg-amber-500";
  }

  const kpiStats = [
    { name: "Portfolio Health", value: `${confidenceScore}%`, subtext: confidenceStatus, icon: TrendingUp, color: confidenceColor, bg: confidenceBg, dot: confidenceDot },
    { name: "Blocked Paths", value: blockedDependenciesCount, subtext: "Blocked dependencies", icon: AlertTriangle, color: "text-rose-400", bg: "bg-rose-500/10 border-rose-500/20" },
    { name: "Open Risks", value: openRisksCount, subtext: `${highRisksCount + criticalRisksCount} critical/high`, icon: ShieldCheck, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
    { name: "Pending Sign-offs", value: totalProjectPendingApprovals, subtext: `${pendingDecisionsCount} decisions pending`, icon: CheckSquare, color: "text-indigo-400", bg: "bg-indigo-500/10 border-indigo-500/20" },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-white/5 bg-gradient-to-br from-[#1A1F36] to-[#0D101E] p-8 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 h-64 w-64 rounded-full bg-indigo-500/10 blur-[80px]" />
        <div className="relative z-10 max-w-3xl">
          <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2">
            Workspace Governance Overview
          </h1>
          <p className="text-sm text-[#94A3B8] mb-6 leading-relaxed">
            ProductOS monitors active initiatives, analyzes delivery blockers, and visualizes cross-team dependencies to calculate release readiness metrics in real time.
          </p>
          <div className="flex gap-4">
            <Link
              href="/dashboard/decisions"
              className="px-4 py-2.5 rounded-xl bg-indigo-500 text-white font-semibold text-xs hover:bg-indigo-600 transition-all flex items-center gap-2 shadow-md shadow-indigo-500/10"
            >
              <Plus className="h-4 w-4" /> Log a Decision
            </Link>
            <Link
              href="/dashboard/risks"
              className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white font-semibold text-xs hover:bg-white/10 transition-all flex items-center gap-2"
            >
              Manage Risks & Connections
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {kpiStats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="p-6 rounded-2xl glass-card relative overflow-hidden flex flex-col justify-between">
              <div className="flex justify-between items-start mb-4">
                <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider">{stat.name}</span>
                <div className={`p-2 rounded-xl ${stat.bg} ${stat.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-black text-white">{stat.value}</span>
                  {stat.dot && <span className={`h-2.5 w-2.5 rounded-full ${stat.dot} animate-pulse`} />}
                </div>
                <p className="text-[10px] text-[#64748B] font-semibold mt-1 uppercase tracking-wide">{stat.subtext}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Recent Decisions */}
        <div className="lg:col-span-2 p-6 rounded-2xl glass-card space-y-6">
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <div>
              <h3 className="font-extrabold text-sm text-white">Recent Decisions</h3>
              <p className="text-xs text-[#64748B]">Decisions registered inside the current workspace.</p>
            </div>
            <Link 
              href="/dashboard/decisions" 
              className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
            >
              View Decision Journal <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="space-y-4">
            {decisions && decisions.length > 0 ? (
              decisions.slice(0, 3).map((dec: any) => {
                const totalAppr = dec.approvals?.length || 0;
                const approvedAppr = dec.approvals?.filter((a: any) => a.status === "approved").length || 0;
                const isApproved = totalAppr > 0 && approvedAppr === totalAppr;
                
                return (
                  <div key={dec.id} className="p-4 rounded-xl bg-[#121622]/40 border border-white/5 hover:border-white/10 transition-all flex items-start gap-4">
                    <div className="p-2 rounded-lg bg-indigo-500/5 text-indigo-400 shrink-0">
                      <FileText className="h-4.5 w-4.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h4 className="font-bold text-xs text-white truncate">{dec.title}</h4>
                        <span className="text-[10px] text-[#64748B] shrink-0">
                          {new Date(dec.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs text-[#94A3B8] line-clamp-2 mb-2">{dec.description}</p>
                      <div className="flex items-center gap-4 text-[10px]">
                        <span className="text-[#64748B]">Decided by: <span className="text-white font-medium">{dec.decided_by}</span></span>
                        {totalAppr > 0 && (
                          <span className={`font-semibold flex items-center gap-1 ${isApproved ? "text-emerald-400" : "text-amber-400"}`}>
                            {isApproved ? "Approved" : `Approvals (${approvedAppr}/${totalAppr})`}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-10 text-[#64748B] text-xs">
                No decisions logged yet. Select or create a project to start.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Blocked Paths & Active Risks */}
        <div className="p-6 rounded-2xl glass-card space-y-6">
          <div className="border-b border-white/5 pb-4">
            <h3 className="font-extrabold text-sm text-white">Active Blockers & Risks</h3>
            <p className="text-xs text-[#64748B]">Operational issues blocking development pathways.</p>
          </div>

          <div className="space-y-4">
            {/* Display Blocked Dependencies */}
            {blockedDependencies.map((dep: any) => (
              <div key={`dep-${dep.id}`} className="p-3.5 rounded-xl bg-rose-500/5 border border-rose-500/10 space-y-1.5 animate-pulse">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-black text-rose-400 uppercase tracking-wide">Blocked Path</span>
                  <span className="text-[9px] text-[#64748B]">Dependency</span>
                </div>
                <h4 className="text-xs font-bold text-white flex items-center gap-2">
                  <span>{dep.from_team}</span>
                  <ArrowRight className="h-3 w-3 text-rose-500" />
                  <span>{dep.to_team}</span>
                </h4>
                <p className="text-[11px] text-[#94A3B8]">{dep.description}</p>
              </div>
            ))}

            {/* Display High / Critical Risks */}
            {openRisks.filter((r: any) => r.severity === "high" || r.severity === "critical").map((risk: any) => (
              <div key={`risk-${risk.id}`} className="p-3.5 rounded-xl bg-orange-500/5 border border-orange-500/10 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-black text-orange-400 uppercase tracking-wide">Active Risk</span>
                  <span className="text-[9px] text-orange-500 capitalize font-bold">{risk.severity}</span>
                </div>
                <h4 className="text-xs font-bold text-white truncate">{risk.title}</h4>
                <p className="text-[11px] text-[#94A3B8] line-clamp-2">{risk.mitigation}</p>
              </div>
            ))}

            {/* Default state */}
            {blockedDependenciesCount === 0 && openRisks.filter((r: any) => r.severity === "high" || r.severity === "critical").length === 0 && (
              <div className="text-center py-12 text-[#64748B] text-xs">
                No critical risks or blocked dependencies detected!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
