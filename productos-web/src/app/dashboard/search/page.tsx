"use client";

import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useStore } from "@/store/useStore";
import { 
  Search, 
  Sparkles, 
  HelpCircle, 
  ArrowRight, 
  FileText, 
  AlertTriangle, 
  Video,
  ChevronRight,
  ShieldCheck,
  CheckCircle,
  Clock
} from "lucide-react";

export default function RAGSearchPage() {
  const { currentProject, currentUserId, backendUrl } = useStore();
  const [query, setQuery] = useState("");
  const [searchResult, setSearchResult] = useState<any>(null);
  const [activeCitation, setActiveCitation] = useState<any>(null);

  // Search Mutation
  const searchMutation = useMutation({
    mutationFn: async (payload: { project_id: number; query: string }) => {
      const res = await fetch(`${backendUrl}/search/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${currentUserId}`
        },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error("Search query failed");
      return res.json();
    },
    onSuccess: (data) => {
      setSearchResult(data);
      setActiveCitation(null);
    },
    onError: () => {
      alert("Error querying the search engine. Ensure the backend is active.");
    }
  });

  const handleSearch = (searchQuery: string) => {
    if (!searchQuery || !currentProject) return;
    searchMutation.mutate({
      project_id: currentProject.id,
      query: searchQuery
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch(query);
    }
  };

  const runSampleQuery = (q: string) => {
    setQuery(q);
    handleSearch(q);
  };

  // Helper to format/render citations inside text dynamically (Jira-style flat links)
  const renderFormattedAnswer = (text: string, citations: any[]) => {
    if (!text) return null;
    
    const parts = text.split(/(\[decision_\d+\]|\[risk_\d+\]|\[meeting_\d+\])/g);
    
    return parts.map((part, idx) => {
      const match = part.match(/\[(decision|risk|meeting)_(\d+)\]/);
      if (match) {
        const type = match[1];
        const id = parseInt(match[2]);
        const citation = citations.find(c => c.id === id && c.type === type);
        
        return (
          <button
            key={idx}
            onClick={() => setActiveCitation(citation || { id, type, title: `${type.toUpperCase()}-${id}` })}
            className="inline-flex items-center gap-1 px-1.5 py-0.5 mx-0.5 rounded bg-[#DEEBFF] hover:bg-[#B3D4FF] text-[#0747A6] border border-[#B3D4FF] font-semibold text-[10px] select-none transition-colors"
          >
            {type === "decision" && <FileText className="h-3 w-3 text-[#0747A6]" />}
            {type === "risk" && <AlertTriangle className="h-3 w-3 text-[#BF2600]" />}
            {type === "meeting" && <Video className="h-3 w-3 text-[#42526E]" />}
            {type.toUpperCase()}-{id}
          </button>
        );
      }
      return <span key={idx}>{part}</span>;
    });
  };

  const sampleQueries = [
    "Why did we choose Stripe Elements?",
    "What is the mitigation plan for German entity clearing?",
    "Who is responsible for the webhooks security checks?"
  ];

  return (
    <div className="space-y-6 text-[#172B4D] animate-fade-in">
      {/* Page Header (Jira Flat Blue/Slate style) */}
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-xl font-bold text-[#091E42] flex items-center gap-2 tracking-tight">
          <Search className="h-5 w-5 text-[#0052CC]" /> Ask ProductOS Memory
        </h1>
        <p className="text-xs text-[#5E6C84] mt-1">Search operational guidelines, project decisions, and compliance standards.</p>
      </div>

      {/* Query Bar (Confluence Search Box Style) */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4 shadow-sm">
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Search decisions, mitigations, or meeting notes (e.g. 'Why did we skip custom PCI audit?')..."
            className="w-full bg-slate-50 border border-slate-300 rounded-md pl-11 pr-4 py-3 text-xs text-[#091E42] focus:outline-none focus:border-[#0052CC] focus:bg-white placeholder-[#7A869A] transition-colors"
          />
          <Search className="absolute left-4 top-3.5 h-4.5 w-4.5 text-[#5E6C84]" />
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex flex-wrap gap-1.5 items-center">
            <span className="text-[10px] font-bold uppercase text-[#7A869A] tracking-wider mr-1">Popular:</span>
            {sampleQueries.map((q, idx) => (
              <button
                key={idx}
                onClick={() => runSampleQuery(q)}
                className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-[10px] text-[#42526E] font-medium transition-colors"
              >
                {q}
              </button>
            ))}
          </div>

          <button
            onClick={() => handleSearch(query)}
            disabled={searchMutation.isPending || !query}
            className="w-full sm:w-auto px-5 py-2.5 rounded bg-[#0052CC] hover:bg-[#0065FF] text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shrink-0"
          >
            {searchMutation.isPending ? "Searching..." : "Query Brain"}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* SEARCH RESULTS */}
      {(searchMutation.isPending || searchResult) && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
          
          {/* Left Column: AI Answer and Citations List (Double Column) */}
          <div className="lg:col-span-2 space-y-5">
            
            {/* AI Synthesized Answer Card (Flat Grey/Blue background, Confluence page look) */}
            <div className="bg-[#F4F5F7] border border-slate-200 rounded-lg p-5 space-y-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <span className="text-xs font-bold text-[#091E42] flex items-center gap-1.5 uppercase tracking-wider">
                  <Sparkles className="h-4 w-4 text-[#0052CC]" /> Grounded AI Summary
                </span>
                <span className="text-[10px] text-[#5E6C84] bg-white border border-slate-200 px-2 py-0.5 rounded font-bold">Verified Context</span>
              </div>

              {searchMutation.isPending ? (
                <div className="py-12 flex flex-col items-center justify-center gap-2">
                  <div className="h-7 w-7 rounded-full border-2 border-slate-300 border-t-[#0052CC] animate-spin" />
                  <span className="text-xs text-[#5E6C84]">Scanning knowledge graph records...</span>
                </div>
              ) : (
                <div className="text-xs leading-relaxed text-[#172B4D] space-y-3 font-medium">
                  <p>{renderFormattedAnswer(searchResult.answer, searchResult.citations)}</p>
                </div>
              )}
            </div>

            {/* Citations List (Looks like Jira subtask lists) */}
            {searchResult && !searchMutation.isPending && (
              <div className="space-y-2">
                <h3 className="text-[10px] font-bold uppercase text-[#5E6C84] tracking-wider">Source references ({searchResult.citations.length})</h3>
                <div className="bg-white border border-slate-200 rounded-lg divide-y divide-slate-150 overflow-hidden shadow-sm">
                  {searchResult.citations.map((cit: any, idx: number) => (
                    <button
                      key={idx}
                      onClick={() => setActiveCitation(cit)}
                      className="w-full p-3.5 hover:bg-[#F4F5F7] text-left transition-colors flex items-center justify-between gap-4 group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="shrink-0">
                          {cit.type === "decision" && (
                            <span className="bg-[#DEEBFF] text-[#0747A6] text-[9px] font-bold px-1.5 py-0.5 rounded uppercase">
                              DEC
                            </span>
                          )}
                          {cit.type === "risk" && (
                            <span className="bg-[#FFEBE6] text-[#BF2600] text-[9px] font-bold px-1.5 py-0.5 rounded uppercase">
                              RISK
                            </span>
                          )}
                          {cit.type === "meeting" && (
                            <span className="bg-[#EAE6FF] text-[#403294] text-[9px] font-bold px-1.5 py-0.5 rounded uppercase">
                              MEET
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-semibold text-[#091E42] truncate group-hover:text-[#0052CC] transition-colors">{cit.title}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-[#7A869A] shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Active Citation Detail Panel */}
          <div className="space-y-4">
            <h3 className="text-[10px] font-bold uppercase text-[#5E6C84] tracking-wider">Source Inspector</h3>
            
            {activeCitation ? (
              <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4 shadow-sm animate-fade-in">
                <div>
                  <span className="bg-slate-100 text-[#42526E] border border-slate-200 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">
                    {activeCitation.type.toUpperCase()}-{activeCitation.id}
                  </span>
                  <h4 className="text-sm font-bold text-[#091E42] mt-2 leading-tight">{activeCitation.title}</h4>
                </div>

                <div className="border-t border-slate-100 pt-3 space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-[#5E6C84]">Governance Status:</span>
                    <span className="bg-[#E3FCEF] text-[#006644] text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-0.5">
                      <ShieldCheck className="h-3 w-3" /> Fully Signed Off
                    </span>
                  </div>
                  {activeCitation.type === "decision" && (
                    <div className="flex justify-between items-center">
                      <span className="text-[#5E6C84]">Type:</span>
                      <span className="font-semibold text-[#172B4D]">Decision Audit SOP</span>
                    </div>
                  )}
                </div>

                <div className="border-t border-slate-100 pt-3">
                  <p className="text-xs text-[#5E6C84] leading-relaxed">
                    This reference has been validated and persisted in the organization's Knowledge Graph. It provides direct accountability and governance for historical audits.
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-white border border-dashed border-slate-300 rounded-lg text-center text-xs text-[#7A869A] flex flex-col items-center justify-center gap-2 py-14 p-5 shadow-sm">
                <HelpCircle className="h-6 w-6 text-[#7A869A]" />
                <span>Select a citation tag or source item to view detailed audit logs.</span>
              </div>
            )}

          </div>

        </div>
      )}
    </div>
  );
}
