"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useStore } from "@/store/useStore";
import { 
  Sparkles, 
  Trash2, 
  Check, 
  AlertTriangle, 
  FileText, 
  CheckSquare, 
  HelpCircle,
  Video,
  ListCollapse,
  ArrowRight,
  ClipboardList
} from "lucide-react";

export default function MeetingIntelligence() {
  const queryClient = useQueryClient();
  const { currentProject, currentUserId, backendUrl } = useStore();
  
  // App States
  const [transcript, setTranscript] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState<"input" | "review" | "success">("input");
  
  // Extracted States (for editing/review)
  const [summary, setSummary] = useState("");
  const [decisions, setDecisions] = useState<any[]>([]);
  const [actionItems, setActionItems] = useState<any[]>([]);
  const [risks, setRisks] = useState<any[]>([]);
  
  // Persist Results State
  const [persistResults, setPersistResults] = useState<any>(null);

  // Fetch Project Stakeholders (for linking approvals)
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

  // 1. Extract outcomes mutation
  const extractMutation = useMutation({
    mutationFn: async (payload: { project_id: number; transcript: string }) => {
      const res = await fetch(`${backendUrl}/meetings/extract`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${currentUserId}`
        },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error("Failed to process transcript");
      return res.json();
    },
    onMutate: () => {
      setIsProcessing(true);
    },
    onSuccess: (data) => {
      setIsProcessing(false);
      setSummary(data.summary || "");
      // Map extracted decisions, actions, and risks adding local active/checked states
      setDecisions(
        (data.decisions || []).map((d: any, idx: number) => ({
          id: idx,
          checked: true,
          title: d.title,
          description: d.description,
          decided_by: d.decided_by,
          linked_goal: d.linked_goal || "",
          selectedStakeholderIds: [] // to request approvals
        }))
      );
      setActionItems(
        (data.action_items || []).map((a: any, idx: number) => ({
          id: idx,
          checked: true,
          description: a.description,
          owner: a.owner,
          due_date: a.due_date || ""
        }))
      );
      setRisks(
        (data.risks || []).map((r: any, idx: number) => ({
          id: idx,
          checked: true,
          title: r.title,
          severity: r.severity || "medium",
          owner: r.owner || "",
          mitigation: r.mitigation || ""
        }))
      );
      setStep("review");
    },
    onError: (err) => {
      setIsProcessing(false);
      alert("Error processing transcript. Please verify the backend is running.");
    }
  });

  // 2. Persist outcomes mutation
  const persistMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch(`${backendUrl}/meetings/persist`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${currentUserId}`
        },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error("Failed to save outcomes");
      return res.json();
    },
    onSuccess: (data) => {
      // Invalidate queries so dashboards update
      queryClient.invalidateQueries({ queryKey: ["decisions", currentProject?.id] });
      queryClient.invalidateQueries({ queryKey: ["risks", currentProject?.id] });
      queryClient.invalidateQueries({ queryKey: ["dependencies", currentProject?.id] });
      queryClient.invalidateQueries({ queryKey: ["stakeholders", currentProject?.id] });
      
      setPersistResults(data);
      setStep("success");
    }
  });

  const handleExtract = () => {
    if (!transcript || !currentProject) return;
    extractMutation.mutate({
      project_id: currentProject.id,
      transcript
    });
  };

  const handlePersist = () => {
    if (!currentProject) return;
    
    // Filter out unchecked items and map to backend formats
    const payload = {
      project_id: currentProject.id,
      summary,
      decisions: decisions
        .filter((d) => d.checked)
        .map((d) => ({
          title: d.title,
          description: d.description,
          decided_by: d.decided_by,
          linked_goal: d.linked_goal || null,
          stakeholder_ids: d.selectedStakeholderIds
        })),
      action_items: actionItems
        .filter((a) => a.checked)
        .map((a) => ({
          description: a.description,
          owner: a.owner,
          due_date: a.due_date || null
        })),
      risks: risks
        .filter((r) => r.checked)
        .map((r) => ({
          title: r.title,
          severity: r.severity,
          owner: r.owner,
          mitigation: r.mitigation || null
        }))
    };

    persistMutation.mutate(payload);
  };

  const loadSampleTranscript = () => {
    setTranscript(`Sarah Jenkins (PM): Thanks everyone for hopping on the Payments alignment call. Dave, what's the latest from Engineering on the Stripe integration?
Dave Miller (Eng): We evaluated custom PCI compliance options, but it's going to cost us at least $50k and add 6 weeks of audit. Instead, I suggest we proceed with Stripe Elements. It keeps input fields hosted on Stripe's side and skips the full PCI audit scope.
Sarah Jenkins (PM): Okay, let's lock that decision in. We will use Stripe Elements for the regional checkout inputs. Elena, is that fine legally?
Elena Rostova (Legal): Legally yes, but we have to draft a new privacy disclaimer for our EU users before launch.
Sarah Jenkins (PM): Got it. Elena, please draft that EU privacy disclaimer by July 28. Marcus, what security verification steps do we need?
Marcus Vance (Security): I'll need to run webhooks penetration tests and audit the tokenization flow. Let's make sure webhook endpoints are fully locked down. I can complete the webhook security check by July 25.
Sarah Jenkins (PM): Perfect. Marcus, you own webhook verification. Elena, you own the EU disclaimer.
Dave Miller (Eng): One risk is regulatory bank approvals. Germany and France entity clearing can be slow.
Elena Rostova (Legal): I'll handle that. We can speed up entity checks by submitting fallback filing requests using our local subsidiary details.
Sarah Jenkins (PM): Excellent alignment. Let's wrap up.`);
  };

  const handleStakeholderCheckboxToggle = (decisionId: number, shId: number) => {
    setDecisions((prev) =>
      prev.map((d) => {
        if (d.id === decisionId) {
          const exists = d.selectedStakeholderIds.includes(shId);
          return {
            ...d,
            selectedStakeholderIds: exists
              ? d.selectedStakeholderIds.filter((id: number) => id !== shId)
              : [...d.selectedStakeholderIds, shId]
          };
        }
        return d;
      })
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="border-b border-white/5 pb-5">
        <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
          <Video className="h-6 w-6 text-indigo-400" /> AI Meeting Intelligence
        </h1>
        <p className="text-xs text-[#64748B]">Ingest raw meeting transcripts to automatically extract Decisions, Actions, and Risks.</p>
      </div>

      {/* STEP 1: TRANSCRIPT INPUT */}
      {step === "input" && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl glass-card space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-white uppercase tracking-wider">Paste raw transcript text</label>
              <button
                onClick={loadSampleTranscript}
                className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 transition-colors"
              >
                <Sparkles className="h-4.5 w-4.5" /> Load Sample Payments Transcript
              </button>
            </div>
            
            <textarea
              rows={12}
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="Paste raw transcript from Zoom, Google Meet, Microsoft Teams, or custom notes..."
              className="w-full bg-[#121622]/40 border border-white/10 rounded-2xl p-4 text-xs text-white focus:outline-none focus:border-indigo-500/50 placeholder-[#64748B] font-mono leading-relaxed"
            />

            <div className="flex justify-end gap-4">
              <button
                onClick={handleExtract}
                disabled={isProcessing || !transcript}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 text-white font-bold text-xs hover:from-indigo-600 hover:to-cyan-600 transition-all shadow-lg shadow-indigo-500/10 flex items-center gap-2 disabled:opacity-50 hover:scale-[1.02]"
              >
                {isProcessing ? "AI Ingestion Engine Running..." : "Process with LLM Engine"}
                <ArrowRight className="h-4.5 w-4.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: REVIEW PANEL */}
      {step === "review" && (
        <div className="space-y-6">
          {/* Executive Summary Widget */}
          <div className="p-6 rounded-2xl glass-card bg-indigo-500/5 border border-indigo-500/10 space-y-2">
            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block">Executive Summary</span>
            <textarea
              rows={2}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="w-full bg-[#121622]/40 border border-white/5 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500/30"
            />
          </div>

          {/* Double Column Grid: Left Decisions, Right Actions & Risks */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Left Column: Decisions */}
            <div className="space-y-6">
              <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                <FileText className="h-4.5 w-4.5 text-indigo-400" /> Extracted Decisions ({decisions.filter(d=>d.checked).length})
              </h3>
              
              {decisions.length === 0 ? (
                <div className="p-4 rounded-xl bg-[#121622]/30 border border-white/5 text-xs text-[#64748B] text-center">No decisions detected in transcript.</div>
              ) : (
                decisions.map((dec) => (
                  <div key={dec.id} className={`p-5 rounded-2xl glass-card border ${dec.checked ? "border-indigo-500/20 bg-[#121622]/20" : "border-white/5 opacity-55"} space-y-4`}>
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1 space-y-3">
                        <div className="space-y-1">
                          <span className="text-[9px] uppercase font-bold text-[#64748B]">Title</span>
                          <input
                            type="text"
                            value={dec.title}
                            onChange={(e) => setDecisions(prev => prev.map(item => item.id === dec.id ? {...item, title: e.target.value} : item))}
                            className="w-full bg-[#121622]/80 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-indigo-500/50"
                          />
                        </div>
                        
                        <div className="space-y-1">
                          <span className="text-[9px] uppercase font-bold text-[#64748B]">Context</span>
                          <textarea
                            rows={3}
                            value={dec.description}
                            onChange={(e) => setDecisions(prev => prev.map(item => item.id === dec.id ? {...item, description: e.target.value} : item))}
                            className="w-full bg-[#121622]/80 border border-white/10 rounded-xl px-3 py-2 text-xs text-[#94A3B8] focus:outline-none focus:border-indigo-500/50"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <span className="text-[9px] uppercase font-bold text-[#64748B]">Decided By</span>
                            <input
                              type="text"
                              value={dec.decided_by}
                              onChange={(e) => setDecisions(prev => prev.map(item => item.id === dec.id ? {...item, decided_by: e.target.value} : item))}
                              className="w-full bg-[#121622]/80 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                            />
                          </div>
                          <div className="space-y-1">
                            <span className="text-[9px] uppercase font-bold text-[#64748B]">Linked Goal</span>
                            <input
                              type="text"
                              value={dec.linked_goal}
                              onChange={(e) => setDecisions(prev => prev.map(item => item.id === dec.id ? {...item, linked_goal: e.target.value} : item))}
                              className="w-full bg-[#121622]/80 border border-white/10 rounded-xl px-3 py-2 text-xs text-cyan-400 focus:outline-none"
                            />
                          </div>
                        </div>

                        {/* Link stakeholders for sign-off */}
                        <div className="space-y-2 pt-2 border-t border-white/5">
                          <span className="text-[9px] uppercase font-bold text-[#64748B] block">Request Stakeholder Sign-off</span>
                          <div className="flex flex-wrap gap-2">
                            {stakeholders && stakeholders.map((sh: any) => {
                              const isSelected = dec.selectedStakeholderIds.includes(sh.id);
                              return (
                                <button
                                  type="button"
                                  key={sh.id}
                                  onClick={() => handleStakeholderCheckboxToggle(dec.id, sh.id)}
                                  className={`px-2.5 py-1 rounded text-[9px] font-bold border transition-colors ${
                                    isSelected 
                                      ? "bg-indigo-500/10 text-white border-indigo-500/30" 
                                      : "bg-white/5 text-[#94A3B8] border-white/5 hover:border-white/10"
                                  }`}
                                >
                                  {sh.name} ({sh.role.split(" ")[0]})
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Checkbox selector */}
                      <button
                        type="button"
                        onClick={() => setDecisions(prev => prev.map(item => item.id === dec.id ? {...item, checked: !item.checked} : item))}
                        className={`h-6 w-6 rounded-lg border flex items-center justify-center transition-colors shrink-0 ${
                          dec.checked ? "bg-indigo-500 border-indigo-500 text-white" : "border-white/20 hover:border-white/30"
                        }`}
                      >
                        {dec.checked && <Check className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Right Column: Actions & Risks */}
            <div className="space-y-6">
              
              {/* Action Items */}
              <div className="space-y-4">
                <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                  <CheckSquare className="h-4.5 w-4.5 text-cyan-400" /> Extracted Action Items ({actionItems.filter(a=>a.checked).length})
                </h3>

                {actionItems.length === 0 ? (
                  <div className="p-4 rounded-xl bg-[#121622]/30 border border-white/5 text-xs text-[#64748B] text-center">No action items detected.</div>
                ) : (
                  actionItems.map((act) => (
                    <div key={act.id} className={`p-4 rounded-xl glass-card border ${act.checked ? "border-cyan-500/20 bg-[#121622]/20" : "border-white/5 opacity-55"} flex gap-4 items-start justify-between`}>
                      <div className="flex-1 space-y-3 min-w-0">
                        <div className="space-y-1">
                          <span className="text-[9px] uppercase font-bold text-[#64748B]">Task Description</span>
                          <input
                            type="text"
                            value={act.description}
                            onChange={(e) => setActionItems(prev => prev.map(item => item.id === act.id ? {...item, description: e.target.value} : item))}
                            className="w-full bg-[#121622]/80 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <span className="text-[9px] uppercase font-bold text-[#64748B]">Assignee</span>
                            <input
                              type="text"
                              value={act.owner}
                              onChange={(e) => setActionItems(prev => prev.map(item => item.id === act.id ? {...item, owner: e.target.value} : item))}
                              className="w-full bg-[#121622]/80 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                            />
                          </div>
                          <div className="space-y-1">
                            <span className="text-[9px] uppercase font-bold text-[#64748B]">Due Date</span>
                            <input
                              type="text"
                              placeholder="YYYY-MM-DD"
                              value={act.due_date}
                              onChange={(e) => setActionItems(prev => prev.map(item => item.id === act.id ? {...item, due_date: e.target.value} : item))}
                              className="w-full bg-[#121622]/80 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                            />
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActionItems(prev => prev.map(item => item.id === act.id ? {...item, checked: !item.checked} : item))}
                        className={`h-5 w-5 rounded-md border flex items-center justify-center transition-colors shrink-0 mt-6 ${
                          act.checked ? "bg-cyan-500 border-cyan-500 text-white" : "border-white/20"
                        }`}
                      >
                        {act.checked && <Check className="h-3 w-3" />}
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Risks */}
              <div className="space-y-4">
                <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                  <AlertTriangle className="h-4.5 w-4.5 text-rose-400" /> Extracted Delivery Risks ({risks.filter(r=>r.checked).length})
                </h3>

                {risks.length === 0 ? (
                  <div className="p-4 rounded-xl bg-[#121622]/30 border border-white/5 text-xs text-[#64748B] text-center">No risks detected.</div>
                ) : (
                  risks.map((risk) => (
                    <div key={risk.id} className={`p-4 rounded-xl glass-card border ${risk.checked ? "border-rose-500/20 bg-[#121622]/20" : "border-white/5 opacity-55"} flex gap-4 items-start justify-between`}>
                      <div className="flex-1 space-y-3 min-w-0">
                        <div className="space-y-1">
                          <span className="text-[9px] uppercase font-bold text-[#64748B]">Risk Title</span>
                          <input
                            type="text"
                            value={risk.title}
                            onChange={(e) => setRisks(prev => prev.map(item => item.id === risk.id ? {...item, title: e.target.value} : item))}
                            className="w-full bg-[#121622]/80 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <span className="text-[9px] uppercase font-bold text-[#64748B]">Owner</span>
                            <input
                              type="text"
                              value={risk.owner}
                              onChange={(e) => setRisks(prev => prev.map(item => item.id === risk.id ? {...item, owner: e.target.value} : item))}
                              className="w-full bg-[#121622]/80 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                            />
                          </div>
                          <div className="space-y-1">
                            <span className="text-[9px] uppercase font-bold text-[#64748B]">Severity</span>
                            <select
                              value={risk.severity}
                              onChange={(e) => setRisks(prev => prev.map(item => item.id === risk.id ? {...item, severity: e.target.value} : item))}
                              className="w-full bg-[#121622]/80 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
                            >
                              <option value="low">Low</option>
                              <option value="medium">Medium</option>
                              <option value="high">High</option>
                              <option value="critical">Critical</option>
                            </select>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[9px] uppercase font-bold text-[#64748B]">Mitigation Plan</span>
                          <textarea
                            rows={2}
                            value={risk.mitigation}
                            onChange={(e) => setRisks(prev => prev.map(item => item.id === risk.id ? {...item, mitigation: e.target.value} : item))}
                            className="w-full bg-[#121622]/80 border border-white/10 rounded-xl px-3 py-2 text-xs text-[#94A3B8] focus:outline-none"
                          />
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setRisks(prev => prev.map(item => item.id === risk.id ? {...item, checked: !item.checked} : item))}
                        className={`h-5 w-5 rounded-md border flex items-center justify-center transition-colors shrink-0 mt-6 ${
                          risk.checked ? "bg-rose-500 border-rose-500 text-white" : "border-white/20"
                        }`}
                      >
                        {risk.checked && <Check className="h-3 w-3" />}
                      </button>
                    </div>
                  ))
                )}
              </div>

            </div>

          </div>

          {/* Action Footer */}
          <div className="flex gap-4 justify-end pt-6 border-t border-white/5">
            <button
              onClick={() => setStep("input")}
              className="px-5 py-2.5 rounded-xl border border-white/10 text-white text-xs font-semibold hover:bg-white/5 transition-all"
            >
              Back to Transcript
            </button>
            <button
              onClick={handlePersist}
              disabled={persistMutation.isPending}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600 text-white font-bold text-xs transition-all shadow-md flex items-center gap-1.5"
            >
              {persistMutation.isPending ? "Persisting to database..." : "Save Checked Outcomes"}
            </button>
          </div>

        </div>
      )}

      {/* STEP 3: SUCCESS STATE */}
      {step === "success" && persistResults && (
        <div className="max-w-md mx-auto p-8 rounded-3xl glass-card text-center space-y-6 animate-fade-in my-10">
          <div className="h-16 w-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/5">
            <Check className="h-8 w-8" />
          </div>
          
          <div>
            <h2 className="text-lg font-black text-white">Outcomes Ingested Successfully!</h2>
            <p className="text-xs text-[#64748B] mt-2">The meeting has been processed and persistent items are active.</p>
          </div>

          <div className="p-4 rounded-2xl bg-[#121622]/40 border border-white/5 space-y-2.5 text-left text-xs">
            <div className="flex justify-between">
              <span className="text-[#64748B]">Decisions Logged:</span>
              <span className="font-bold text-indigo-400">{persistResults.decisions_created}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#64748B]">Action Items Assigned:</span>
              <span className="font-bold text-cyan-400">{persistResults.action_items_created}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#64748B]">Risks Tracked:</span>
              <span className="font-bold text-rose-400">{persistResults.risks_created}</span>
            </div>
          </div>

          <div className="flex gap-3 justify-center pt-2">
            <button
              onClick={() => {
                setTranscript("");
                setStep("input");
              }}
              className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white font-semibold text-xs hover:bg-white/10 transition-all"
            >
              Process Another Transcript
            </button>
            <Link
              href="/dashboard"
              className="px-4 py-2.5 rounded-xl bg-indigo-500 text-white font-semibold text-xs hover:bg-indigo-600 transition-all flex items-center gap-1.5"
            >
              Go to Dashboard <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
