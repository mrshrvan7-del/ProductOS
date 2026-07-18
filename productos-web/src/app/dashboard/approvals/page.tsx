"use client";

import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useStore } from "@/store/useStore";
import { 
  CheckSquare, 
  ThumbsUp, 
  ThumbsDown, 
  Clock, 
  CheckCircle2, 
  XCircle,
  HelpCircle,
  FileText,
  UserCheck
} from "lucide-react";

export default function ApprovalsQueue() {
  const queryClient = useQueryClient();
  const { currentProject, currentUserId, currentUser, backendUrl } = useStore();

  // 1. Fetch ALL approvals for decisions in the current project
  // We can fetch decisions and aggregate their approvals, or fetch them directly.
  // Let's query decisions to display the approvals.
  const { data: decisions, isLoading: isDecisionsLoading } = useQuery({
    queryKey: ["decisions", currentProject?.id, currentUserId],
    queryFn: async () => {
      const res = await fetch(`${backendUrl}/decisions/?project_id=${currentProject?.id}`, {
        headers: { Authorization: `Bearer ${currentUserId}` }
      });
      return res.json();
    },
    enabled: !!currentProject?.id
  });

  // 2. Fetch pending approvals for the CURRENT user
  const { data: myPendingApprovals, isLoading: isMyApprovalsLoading } = useQuery({
    queryKey: ["myPendingApprovals", currentUserId],
    queryFn: async () => {
      const res = await fetch(`${backendUrl}/approvals/pending`, {
        headers: { Authorization: `Bearer ${currentUserId}` }
      });
      return res.json();
    },
    enabled: !!currentUserId
  });

  // 3. Resolve Approval Mutation
  const resolveApprovalMutation = useMutation({
    mutationFn: async ({ approvalId, status }: { approvalId: number, status: string }) => {
      const res = await fetch(`${backendUrl}/approvals/resolve/${approvalId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${currentUserId}`
        },
        body: JSON.stringify({ status })
      });
      if (!res.ok) throw new Error("Failed to update approval");
      return res.json();
    },
    onSuccess: () => {
      // Invalidate and refetch decisions and pending approvals
      queryClient.invalidateQueries({ queryKey: ["decisions", currentProject?.id] });
      queryClient.invalidateQueries({ queryKey: ["myPendingApprovals", currentUserId] });
      queryClient.invalidateQueries({ queryKey: ["stakeholders", currentProject?.id] });
    }
  });

  const handleResolve = (approvalId: number, status: string) => {
    resolveApprovalMutation.mutate({ approvalId, status });
  };

  // Compile all approvals from all decisions in the project
  const projectApprovals: any[] = [];
  if (decisions) {
    decisions.forEach((dec: any) => {
      if (dec.approvals) {
        dec.approvals.forEach((app: any) => {
          projectApprovals.push({
            ...app,
            decisionTitle: dec.title,
            decisionDescription: dec.description,
            decidedBy: dec.decided_by
          });
        });
      }
    });
  }

  // Filter pending vs resolved approvals
  const pendingApprovalsList = projectApprovals.filter(app => app.status === "pending");
  const resolvedApprovalsList = projectApprovals.filter(app => app.status !== "pending");

  const statusIcons: Record<string, any> = {
    approved: <CheckCircle2 className="h-4.5 w-4.5 text-emerald-400" />,
    rejected: <XCircle className="h-4.5 w-4.5 text-rose-400" />,
    pending: <Clock className="h-4.5 w-4.5 text-amber-400" />
  };

  const statusBadgeClasses: Record<string, string> = {
    approved: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    rejected: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    pending: "bg-amber-500/10 text-amber-400 border-amber-500/20"
  };

  const isUserStakeholder = currentUser?.role === "stakeholder" || currentUser?.role === "pm";

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header and Context */}
      <div className="border-b border-white/5 pb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
            <CheckSquare className="h-6 w-6 text-indigo-400" /> Approvals & Sign-offs
          </h1>
          <p className="text-xs text-[#64748B]">Process governance approvals across Legal, Security, and Engineering leads.</p>
        </div>
      </div>

      {/* Demo Warning / Tip */}
      <div className="p-4 rounded-xl border border-indigo-500/15 bg-indigo-500/5 text-xs text-indigo-300 flex items-start gap-3">
        <UserCheck className="h-5 w-5 text-indigo-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-white">Mock Demonstration Mode:</span>
          <p className="mt-1 leading-relaxed opacity-90">
            For presentation convenience, you can switch personas in the bottom left dropdown menu. As an administrator, you are also permitted to sign off approvals on behalf of any stakeholder directly.
          </p>
        </div>
      </div>

      {/* Pending Approvals Section */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          Pending Sign-offs ({pendingApprovalsList.length})
        </h2>
        
        {isDecisionsLoading ? (
          <div className="text-center py-10 text-[#64748B] text-xs">Loading pending queue...</div>
        ) : pendingApprovalsList.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {pendingApprovalsList.map((app) => {
              // Check if user is allowed to approve (always true in mock bypass, but we show custom labeling)
              const isAssignedToMe = app.stakeholder?.user_id === currentUserId;
              
              return (
                <div key={app.id} className="p-6 rounded-2xl glass-card border border-white/5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-white/5 pb-3">
                    <div>
                      <span className="text-[10px] text-indigo-400 uppercase font-black tracking-wider block">Decision Under Review</span>
                      <h3 className="font-extrabold text-sm text-white mt-1">{app.decisionTitle}</h3>
                    </div>
                    <span className="text-[10px] text-[#64748B]">Requested Dec 2026</span>
                  </div>

                  <p className="text-xs text-[#94A3B8] leading-relaxed max-w-4xl">{app.decisionDescription}</p>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3 border-t border-white/5 text-[10px] text-[#64748B]">
                    <div className="flex items-center gap-4">
                      <span>Owner: <span className="text-white font-semibold">{app.decidedBy}</span></span>
                      <span>Reviewer: <span className="text-cyan-400 font-semibold">{app.stakeholder?.name} ({app.stakeholder?.role})</span></span>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2">
                      {isAssignedToMe && (
                        <span className="mr-2 text-[10px] text-emerald-400 font-bold bg-emerald-400/10 px-2 py-0.5 rounded border border-emerald-400/20">
                          Assigned to You
                        </span>
                      )}
                      
                      <button
                        onClick={() => handleResolve(app.id, "approved")}
                        disabled={resolveApprovalMutation.isPending}
                        className="px-3.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/25 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold transition-all flex items-center gap-1 hover:scale-[1.02]"
                      >
                        <ThumbsUp className="h-3.5 w-3.5" /> Approve
                      </button>
                      
                      <button
                        onClick={() => handleResolve(app.id, "rejected")}
                        disabled={resolveApprovalMutation.isPending}
                        className="px-3.5 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/25 border border-rose-500/20 text-rose-400 text-[10px] font-bold transition-all flex items-center gap-1 hover:scale-[1.02]"
                      >
                        <ThumbsDown className="h-3.5 w-3.5" /> Reject
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 text-[#64748B] text-xs bg-[#121622]/20 border border-white/5 rounded-2xl">
            Clean slate! No pending approvals found in this project.
          </div>
        )}
      </div>

      {/* Resolved Approvals History */}
      <div className="space-y-4 pt-4">
        <h2 className="text-sm font-bold text-white">Sign-off History ({resolvedApprovalsList.length})</h2>
        {resolvedApprovalsList.length > 0 ? (
          <div className="grid grid-cols-1 gap-3">
            {resolvedApprovalsList.map((app) => (
              <div key={app.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-[#121622]/30 border border-white/5 gap-3 hover:border-white/10 transition-all">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="shrink-0">
                    {statusIcons[app.status] || <HelpCircle className="h-5 w-5 text-gray-400" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">{app.decisionTitle}</p>
                    <p className="text-[10px] text-[#64748B] mt-0.5">
                      Reviewed by <span className="text-white font-medium">{app.stakeholder?.name} ({app.stakeholder?.role})</span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className={`text-[9px] px-2 py-0.5 rounded border font-black uppercase ${statusBadgeClasses[app.status]}`}>
                    {app.status}
                  </span>
                  <span className="text-[10px] text-[#64748B]">
                    {app.resolved_at ? new Date(app.resolved_at).toLocaleDateString() : ""}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-[#64748B] text-xs border border-dashed border-white/5 rounded-xl">
            No history recorded.
          </div>
        )}
      </div>
    </div>
  );
}
