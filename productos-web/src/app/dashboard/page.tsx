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
  Plus
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

  // 3. Fetch Pending Approvals for current user
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

  // Calculations
  const totalDecisions = decisions ? decisions.length : 0;
  const totalStakeholders = stakeholders ? stakeholders.length : 0;
  const pendingUserApprovals = pendingApprovals ? pendingApprovals.length : 0;
  
  // Calculate total pending approvals in the project across all decisions
  let totalProjectPendingApprovals = 0;
  if (decisions) {
    decisions.forEach((dec: any) => {
      if (dec.approvals) {
        totalProjectPendingApprovals += dec.approvals.filter((a: any) => a.status === "pending").length;
      }
    });
  }

  // Health metric helper
  const healthPercent = totalDecisions > 0 
    ? Math.round(((totalDecisions - (totalProjectPendingApprovals * 0.5)) / totalDecisions) * 100)
    : 100;

  const stats = [
    { name: "Decisions Logged", value: totalDecisions, icon: FileText, color: "text-indigo-400", bg: "bg-indigo-500/10", border: "border-indigo-500/10" },
    { name: "Active Stakeholders", value: totalStakeholders, icon: Users, color: "text-cyan-400", bg: "bg-cyan-500/10", border: "border-cyan-500/10" },
    { name: "Global Pending Sign-offs", value: totalProjectPendingApprovals, icon: CheckSquare, color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/10" },
    { name: "Delivery Confidence", value: `${Math.max(10, Math.min(100, healthPercent))}%`, icon: TrendingUp, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/10" },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-white/5 bg-gradient-to-br from-[#1A1F36] to-[#0D101E] p-8 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 h-64 w-64 rounded-full bg-indigo-500/10 blur-[80px]" />
        <div className="relative z-10 max-w-3xl">
          <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2">
            Welcome back to ProductOS
          </h1>
          <p className="text-sm text-[#94A3B8] mb-6 leading-relaxed">
            This workspace acts as the governance and intelligence layer for your project launch. Review structural decisions, process sign-offs, and track risk exposure across teams.
          </p>
          <div className="flex gap-4">
            <Link
              href="/dashboard/decisions"
              className="px-4 py-2.5 rounded-xl bg-indigo-500 text-white font-semibold text-xs hover:bg-indigo-600 transition-all flex items-center gap-2 shadow-md shadow-indigo-500/10"
            >
              <Plus className="h-4 w-4" /> Log a Decision
            </Link>
            <Link
              href="/dashboard/approvals"
              className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white font-semibold text-xs hover:bg-white/10 transition-all flex items-center gap-2"
            >
              Pending Sign-offs ({pendingUserApprovals})
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {stats.map((stat, idx) => {
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
                <span className="text-2xl font-black text-white">{stat.value}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Dynamic Main Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Recent Decisions */}
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
              View Decision Log <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="space-y-4">
            {decisions && decisions.length > 0 ? (
              decisions.slice(0, 3).map((dec: any) => {
                const totalAppr = dec.approvals?.length || 0;
                const approvedAppr = dec.approvals?.filter((a: any) => a.status === "approved").length || 0;
                const isApproved = totalAppr > 0 && approvedAppr === totalAppr;
                const isPending = totalAppr > 0 && approvedAppr < totalAppr;
                
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
                        {dec.linked_goal && (
                          <span className="text-[#64748B] truncate">Goal: <span className="text-cyan-400 font-medium">{dec.linked_goal}</span></span>
                        )}
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

        {/* Right Column: Stakeholder Status */}
        <div className="p-6 rounded-2xl glass-card space-y-6">
          <div className="border-b border-white/5 pb-4">
            <h3 className="font-extrabold text-sm text-white">Project Stakeholders</h3>
            <p className="text-xs text-[#64748B]">Sign-off status across governance roles.</p>
          </div>

          <div className="space-y-4">
            {stakeholders && stakeholders.length > 0 ? (
              stakeholders.map((sh: any) => {
                const statusColors: Record<string, string> = {
                  approved: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
                  pending: "bg-amber-500/10 text-amber-400 border-amber-500/20",
                  rejected: "bg-rose-500/10 text-rose-400 border-rose-500/20"
                };
                return (
                  <div key={sh.id} className="flex items-center justify-between p-3.5 rounded-xl bg-[#121622]/40 border border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="h-7 w-7 rounded-full bg-gradient-to-br from-cyan-500 to-indigo-500 flex items-center justify-center text-[10px] font-bold text-white uppercase shadow-sm">
                        {sh.name[0]}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white">{sh.name}</p>
                        <p className="text-[10px] text-[#64748B]">{sh.role}</p>
                      </div>
                    </div>
                    <span className={`text-[9px] px-2 py-0.5 rounded-full border font-bold capitalize ${statusColors[sh.approval_status] || "text-[#94A3B8]"}`}>
                      {sh.approval_status}
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-10 text-[#64748B] text-xs">
                No stakeholders configured.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
