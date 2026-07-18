"use client";

import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useStore } from "@/store/useStore";
import { 
  ClipboardList, 
  Sparkles, 
  Copy, 
  Check, 
  Download, 
  Trash2, 
  Edit3, 
  Eye, 
  FileText 
} from "lucide-react";

export default function ReportsPage() {
  const { currentProject, currentUserId, backendUrl } = useStore();
  const [reportMarkdown, setReportMarkdown] = useState("");
  const [copied, setCopied] = useState(false);

  // Report Generation Mutation
  const reportMutation = useMutation({
    mutationFn: async (payload: { project_id: number }) => {
      const res = await fetch(`${backendUrl}/reports/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${currentUserId}`
        },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error("Report generation failed");
      return res.json();
    },
    onSuccess: (data) => {
      setReportMarkdown(data.report_markdown || "");
    },
    onError: () => {
      alert("Error generating the status report. Ensure the backend is active.");
    }
  });

  const handleGenerate = () => {
    if (!currentProject) return;
    reportMutation.mutate({ project_id: currentProject.id });
  };

  const handleCopy = () => {
    if (!reportMarkdown) return;
    navigator.clipboard.writeText(reportMarkdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!reportMarkdown || !currentProject) return;
    const blob = new Blob([reportMarkdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Status_Report_${currentProject.name.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Simple Markdown-to-HTML parser for rendering the preview beautifully
  const parseMarkdownToHtml = (markdown: string) => {
    if (!markdown) return <p className="text-slate-400 italic">No content generated. Click "Generate Weekly Status Report" above.</p>;

    const lines = markdown.split("\n");
    return lines.map((line, idx) => {
      // Headers
      if (line.startsWith("# ")) {
        return <h1 key={idx} className="text-xl font-bold text-[#091E42] border-b border-slate-200 pb-2 mt-6 mb-3">{line.replace("# ", "")}</h1>;
      }
      if (line.startsWith("## ")) {
        return <h2 key={idx} className="text-base font-bold text-[#091E42] mt-5 mb-2.5">{line.replace("## ", "")}</h2>;
      }
      if (line.startsWith("### ")) {
        return <h3 key={idx} className="text-sm font-bold text-[#42526E] mt-4 mb-2">{line.replace("### ", "")}</h3>;
      }
      // Horizontal Rules
      if (line.trim() === "---") {
        return <hr key={idx} className="border-slate-200 my-4" />;
      }
      // Bullet lists
      if (line.startsWith("- ") || line.startsWith("* ")) {
        const text = line.substring(2);
        // Look for bold text within item
        const boldParts = text.split(/\*\*(.*?)\*\*/g);
        const parsedText = boldParts.map((part, pIdx) => {
          if (pIdx % 2 === 1) return <strong key={pIdx} className="font-bold text-[#091E42]">{part}</strong>;
          return part;
        });
        return <li key={idx} className="list-disc ml-5 mb-1.5 text-xs text-[#172B4D]">{parsedText}</li>;
      }
      // Bold text replacements in standard lines
      if (line.includes("**")) {
        const boldParts = line.split(/\*\*(.*?)\*\*/g);
        const parsedText = boldParts.map((part, pIdx) => {
          if (pIdx % 2 === 1) return <strong key={pIdx} className="font-bold text-[#091E42]">{part}</strong>;
          return part;
        });
        return <p key={idx} className="text-xs text-[#172B4D] mb-2 leading-relaxed">{parsedText}</p>;
      }
      // Empty lines
      if (line.trim() === "") {
        return <div key={idx} className="h-2.5" />;
      }
      // Fallback standard paragraphs
      return <p key={idx} className="text-xs text-[#172B4D] mb-2 leading-relaxed">{line}</p>;
    });
  };

  return (
    <div className="space-y-6 text-[#172B4D] animate-fade-in">
      {/* Page Header (Jira / Confluence styling) */}
      <div className="border-b border-slate-200 pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#091E42] flex items-center gap-2 tracking-tight">
            <ClipboardList className="h-5 w-5 text-[#0052CC]" /> AI Status Reports
          </h1>
          <p className="text-xs text-[#5E6C84] mt-1">Compile live decisions, active risks, and blockers into structured Markdown reports.</p>
        </div>

        <button
          onClick={handleGenerate}
          disabled={reportMutation.isPending || !currentProject}
          className="w-full sm:w-auto px-5 py-2.5 rounded bg-[#0052CC] hover:bg-[#0065FF] text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm"
        >
          <Sparkles className="h-4 w-4" />
          {reportMutation.isPending ? "Generating Report..." : "Generate Weekly Status"}
        </button>
      </div>

      {/* REPORT WORKSPACE */}
      {(reportMutation.isPending || reportMarkdown) && (
        <div className="space-y-4">
          
          {/* Action Toolbar */}
          <div className="bg-[#F4F5F7] border border-slate-200 rounded-lg px-4 py-2 flex justify-between items-center gap-4 shadow-sm">
            <span className="text-[10px] font-bold uppercase text-[#5E6C84] tracking-wider flex items-center gap-1">
              <Edit3 className="h-3.5 w-3.5" /> Workspace Document
            </span>
            <div className="flex gap-2">
              <button
                onClick={handleCopy}
                disabled={!reportMarkdown}
                className="px-3 py-1.5 rounded bg-white hover:bg-slate-50 border border-slate-300 text-xs text-[#42526E] font-semibold flex items-center gap-1 transition-colors"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "Copied!" : "Copy"}
              </button>
              <button
                onClick={handleDownload}
                disabled={!reportMarkdown}
                className="px-3 py-1.5 rounded bg-white hover:bg-slate-50 border border-slate-300 text-xs text-[#42526E] font-semibold flex items-center gap-1 transition-colors"
              >
                <Download className="h-3.5 w-3.5" /> Export
              </button>
              <button
                onClick={() => setReportMarkdown("")}
                className="px-3 py-1.5 rounded bg-white hover:bg-rose-50 border border-slate-300 text-xs text-rose-600 font-semibold flex items-center gap-1 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" /> Clear
              </button>
            </div>
          </div>

          {/* Dual Panel Editor: Left Editor, Right Live HTML Preview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch">
            
            {/* Left Side: Monospace Raw Editor */}
            <div className="bg-white border border-slate-200 rounded-lg p-5 flex flex-col shadow-sm">
              <span className="text-[9px] font-bold uppercase text-[#7A869A] tracking-wider mb-2 flex items-center gap-1">
                <Edit3 className="h-3 w-3" /> Raw Markdown Editor
              </span>
              {reportMutation.isPending ? (
                <div className="py-20 flex-1 flex flex-col items-center justify-center gap-2">
                  <div className="h-7 w-7 rounded-full border-2 border-slate-300 border-t-[#0052CC] animate-spin" />
                  <span className="text-xs text-[#5E6C84]">Aggregating active project variables...</span>
                </div>
              ) : (
                <textarea
                  value={reportMarkdown}
                  onChange={(e) => setReportMarkdown(e.target.value)}
                  rows={20}
                  className="w-full flex-1 bg-slate-50 border border-slate-300 rounded p-4 text-xs font-mono text-[#091E42] focus:outline-none focus:border-[#0052CC] focus:bg-white leading-relaxed resize-y"
                />
              )}
            </div>

            {/* Right Side: Rendered HTML Preview */}
            <div className="bg-white border border-slate-200 rounded-lg p-5 flex flex-col shadow-sm">
              <span className="text-[9px] font-bold uppercase text-[#7A869A] tracking-wider mb-2 flex items-center gap-1">
                <Eye className="h-3 w-3" /> Live Reader Preview
              </span>
              <div className="border border-slate-100 rounded-lg p-5 flex-1 overflow-y-auto max-h-[420px] bg-[#FAFBFC] prose prose-slate max-w-none">
                {reportMutation.isPending ? (
                  <div className="py-20 flex flex-col items-center justify-center gap-2">
                    <div className="h-7 w-7 rounded-full border-2 border-slate-300 border-t-[#0052CC] animate-spin" />
                    <span className="text-xs text-[#5E6C84]">Building executive preview layout...</span>
                  </div>
                ) : (
                  parseMarkdownToHtml(reportMarkdown)
                )}
              </div>
            </div>

          </div>

        </div>
      )}
    </div>
  );
}
