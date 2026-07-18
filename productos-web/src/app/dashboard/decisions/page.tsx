"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useStore } from "@/store/useStore";
import { 
  FileText, 
  Plus, 
  X, 
  Check, 
  Clock, 
  Search,
  Sparkles,
  HelpCircle
} from "lucide-react";

export default function DecisionLog() {
  const queryClient = useQueryClient();
  const { currentProject, currentUserId, currentUser, backendUrl } = useStore();
  
  // States
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [linkedGoal, setLinkedGoal] = useState("");
  const [selectedStakeholders, setSelectedStakeholders] = useState<number[]>([]);

  // 1. Fetch Decisions
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

  // 2. Fetch Stakeholders to populate the "Request Approval From" options
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

  // 3. Create Decision Mutation
  const createDecisionMutation = useMutation({
    mutationFn: async (newDecision: any) => {
      const res = await fetch(`${backendUrl}/decisions/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${currentUserId}`
        },
        body: JSON.stringify(newDecision)
      });
      if (!res.ok) throw new Error("Failed to save decision");
      return res.json();
    },
    onSuccess: () => {
      // Invalidate and refetch decisions & stakeholders status
      queryClient.invalidateQueries({ queryKey: ["decisions", currentProject?.id] });
      queryClient.invalidateQueries({ queryKey: ["stakeholders", currentProject?.id] });
      // Reset form
      setTitle("");
      setDescription("");
      setLinkedGoal("");
      setSelectedStakeholders([]);
      setIsModalOpen(false);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !currentProject) return;

    createDecisionMutation.mutate({
      project_id: currentProject.id,
      title,
      description,
      decided_by: currentUser?.name || "Sarah Jenkins",
      linked_goal: linkedGoal || null,
      source: "manual",
      stakeholder_ids: selectedStakeholders
    });
  };

  const toggleStakeholderSelection = (id: number) => {
    setSelectedStakeholders((prev) => 
      prev.includes(id) ? prev.filter((shId) => shId !== id) : [...prev, id]
    );
  };

  // Filtering
  const filteredDecisions = decisions?.filter((dec: any) => {
    const query = search.toLowerCase();
    return (
      dec.title.toLowerCase().includes(query) ||
      dec.description.toLowerCase().includes(query) ||
      (dec.linked_goal && dec.linked_goal.toLowerCase().includes(query))
    );
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header and Add Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/5 pb-5">
        <div>
          <h1 className="text-xl font-extrabold text-white">Decision Journal</h1>
          <p className="text-xs text-[#64748B]">Document and trace structural decisions with compliance checks.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 text-white font-bold text-xs hover:from-indigo-600 hover:to-cyan-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/15"
        >
          <Plus className="h-4 w-4" /> Log New Decision
        </button>
      </div>

      {/* Filter and Search controls */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-[#64748B]" />
          <input
            type="text"
            placeholder="Search decisions, goals, descriptions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#121622]/40 border border-white/5 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-[#64748B] focus:outline-none focus:border-indigo-500/50 transition-colors"
          />
        </div>
      </div>

      {/* Decision Feed */}
      <div className="space-y-6 relative">
        {/* Timeline Bar (only on desktop and when items exist) */}
        {filteredDecisions && filteredDecisions.length > 0 && (
          <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-white/5 pointer-events-none hidden md:block" />
        )}

        {isDecisionsLoading ? (
          <div className="text-center py-20 text-[#64748B] text-xs">Loading decision entries...</div>
        ) : filteredDecisions && filteredDecisions.length > 0 ? (
          filteredDecisions.map((dec: any) => {
            const approvalsCount = dec.approvals?.length || 0;
            const approvedCount = dec.approvals?.filter((a: any) => a.status === "approved").length || 0;
            const isFullyApproved = approvalsCount > 0 && approvedCount === approvalsCount;
            
            return (
              <div key={dec.id} className="relative md:pl-16 flex flex-col md:flex-row gap-4 group">
                {/* Timeline Dot (desktop only) */}
                <div className="absolute left-4.5 top-6 h-3.5 w-3.5 rounded-full bg-[#121622] border-2 border-[#1E293B] group-hover:border-indigo-500 transition-all z-10 hidden md:block shadow-inner" />

                {/* Main Card */}
                <div className="flex-1 p-6 rounded-2xl glass-card relative overflow-hidden">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-4">
                    <div>
                      <h3 className="font-extrabold text-sm text-white group-hover:text-indigo-400 transition-colors">
                        {dec.title}
                      </h3>
                      <div className="flex items-center gap-2.5 mt-1.5 flex-wrap">
                        <span className="text-[10px] text-[#64748B]">
                          Logged on {new Date(dec.created_at).toLocaleDateString()}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-white/5 text-[#94A3B8] border border-white/5 font-semibold capitalize">
                          Source: {dec.source.replace("_", " ")}
                        </span>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div>
                      {approvalsCount > 0 ? (
                        <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold border flex items-center gap-1.5 ${
                          isFullyApproved 
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                            : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                        }`}>
                          {isFullyApproved ? (
                            <>
                              <Check className="h-3 w-3" /> Fully Signed Off
                            </>
                          ) : (
                            <>
                              <Clock className="h-3 w-3" /> Sign-offs Pending ({approvedCount}/{approvalsCount})
                            </>
                          )}
                        </span>
                      ) : (
                        <span className="text-[10px] px-2.5 py-1 rounded-full bg-slate-500/10 text-[#94A3B8] border border-white/5 font-bold">
                          No Sign-off required
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-[#94A3B8] leading-relaxed mb-4 max-w-4xl whitespace-pre-wrap">
                    {dec.description}
                  </p>

                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-4 border-t border-white/5 text-[10px] text-[#64748B]">
                    <div className="flex items-center gap-4 flex-wrap">
                      <span>Decided by: <span className="text-white font-medium">{dec.decided_by}</span></span>
                      {dec.linked_goal && (
                        <span>Linked Objective: <span className="text-cyan-400 font-medium">{dec.linked_goal}</span></span>
                      )}
                    </div>

                    {/* Sign-offs detail */}
                    {approvalsCount > 0 && (
                      <div className="flex gap-2 items-center">
                        <span className="font-semibold text-white/50">Requested:</span>
                        <div className="flex gap-1.5">
                          {dec.approvals.map((app: any) => {
                            const name = app.stakeholder?.name || `SH ${app.stakeholder_id}`;
                            const isAppr = app.status === "approved";
                            return (
                              <span
                                key={app.id}
                                className={`px-2 py-0.5 rounded text-[9px] font-bold border transition-colors ${
                                  isAppr 
                                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                                    : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                }`}
                                title={`${name}: ${app.status}`}
                              >
                                {name.split(" ")[0]} ({app.status.toUpperCase()})
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-20 text-[#64748B] text-xs bg-[#121622]/20 border border-white/5 rounded-2xl">
            No decisions match your search terms.
          </div>
        )}
      </div>

      {/* Slide-over / Modal for Logging Decision */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-[#090B11]/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-[#0C0E17] border border-white/10 rounded-2xl max-w-lg w-full p-6 space-y-6 max-h-[90vh] overflow-y-auto glow-indigo">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-indigo-400" />
                <h3 className="font-extrabold text-base text-white">Log Decision</h3>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-[#64748B] hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-[#64748B] tracking-wider block">Decision Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Migrate database from DynamoDB to Postgres"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-[#121622]/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500/50"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-[#64748B] tracking-wider block">Decision Context / Rationale</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Provide context, options evaluated, and why this specific path was chosen..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-[#121622]/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500/50"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-[#64748B] tracking-wider block">Linked Objective / Goal (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g., Phase 1 regional compliance metrics"
                  value={linkedGoal}
                  onChange={(e) => setLinkedGoal(e.target.value)}
                  className="w-full bg-[#121622]/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500/50"
                />
              </div>

              {/* Request Sign-off */}
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold text-[#64748B] tracking-wider block">
                  Request Sign-off / Approvals
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {stakeholders && stakeholders.length > 0 ? (
                    stakeholders.map((sh: any) => (
                      <button
                        type="button"
                        key={sh.id}
                        onClick={() => toggleStakeholderSelection(sh.id)}
                        className={`flex items-center justify-between p-3.5 rounded-xl border text-left transition-all ${
                          selectedStakeholders.includes(sh.id)
                            ? "bg-indigo-500/10 border-indigo-500/30 text-white"
                            : "bg-[#121622]/30 border-white/5 text-[#94A3B8] hover:border-white/10"
                        }`}
                      >
                        <div>
                          <p className="text-xs font-bold">{sh.name}</p>
                          <p className="text-[9px] opacity-75">{sh.role}</p>
                        </div>
                        <div className={`h-4.5 w-4.5 rounded-md border flex items-center justify-center transition-colors ${
                          selectedStakeholders.includes(sh.id)
                            ? "bg-indigo-500 border-indigo-500 text-white"
                            : "border-white/20"
                        }`}>
                          {selectedStakeholders.includes(sh.id) && <Check className="h-3 w-3" />}
                        </div>
                      </button>
                    ))
                  ) : (
                    <p className="text-xs text-[#64748B] italic">No stakeholders configured for this project.</p>
                  )}
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-white/10 text-white text-xs hover:bg-white/5 transition-all font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createDecisionMutation.isPending}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600 text-white font-bold text-xs shadow-md shadow-indigo-500/10 transition-all flex items-center gap-1.5 disabled:opacity-50"
                >
                  {createDecisionMutation.isPending ? "Saving..." : "Save and Request approvals"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
