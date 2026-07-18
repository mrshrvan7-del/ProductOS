"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useStore } from "@/store/useStore";
import { 
  Brain, 
  LayoutDashboard, 
  FileText, 
  CheckSquare, 
  AlertTriangle, 
  Users, 
  Search,
  Sparkles,
  ChevronDown,
  ClipboardList
} from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { 
    currentUserId, 
    currentProject, 
    currentUser, 
    mockUsers, 
    setUserId, 
    setProject, 
    setCurrentUser, 
    setMockUsers,
    backendUrl 
  } = useStore();

  // 1. Fetch current user and mock users
  const { data: userData } = useQuery({
    queryKey: ["currentUser", currentUserId],
    queryFn: async () => {
      const res = await fetch(`${backendUrl}/auth/me`, {
        headers: { Authorization: `Bearer ${currentUserId}` }
      });
      return res.json();
    },
    enabled: !!currentUserId
  });

  const { data: mockUsersData } = useQuery({
    queryKey: ["mockUsers"],
    queryFn: async () => {
      const res = await fetch(`${backendUrl}/auth/mock-users`);
      return res.json();
    }
  });

  // 2. Fetch Projects
  const { data: projectsData } = useQuery({
    queryKey: ["projects", currentUserId],
    queryFn: async () => {
      const res = await fetch(`${backendUrl}/projects/`, {
        headers: { Authorization: `Bearer ${currentUserId}` }
      });
      return res.json();
    },
    enabled: !!currentUserId
  });

  // Keep Zustand store in sync with queries
  useEffect(() => {
    if (userData && !userData.detail) {
      setCurrentUser(userData);
    }
  }, [userData, setCurrentUser]);

  useEffect(() => {
    if (mockUsersData) {
      setMockUsers(mockUsersData);
    }
  }, [mockUsersData, setMockUsers]);

  useEffect(() => {
    if (projectsData && projectsData.length > 0 && !currentProject) {
      // Auto select the first project if none is selected
      setProject(projectsData[0]);
    }
  }, [projectsData, currentProject, setProject]);

  const navigation = [
    { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
    { name: "Decision Log", href: "/dashboard/decisions", icon: FileText },
    { name: "Approvals & Sign-offs", href: "/dashboard/approvals", icon: CheckSquare },
    { name: "Risks & Dependencies", href: "/dashboard/risks", icon: AlertTriangle },
    { name: "Meeting Intel", href: "/dashboard/meetings", icon: Sparkles },
    { name: "Ask ProductOS", href: "/dashboard/search", icon: Search },
    { name: "Status Reports", href: "/dashboard/reports", icon: ClipboardList },
  ];

  return (
    <div className="flex h-screen bg-[#090B11] text-[#F1F5F9] overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 glass-panel flex flex-col justify-between shrink-0">
        <div>
          {/* Sidebar Header Logo */}
          <div className="p-6 flex items-center gap-3 border-b border-white/5">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-tr from-indigo-500 to-cyan-500 flex items-center justify-center shadow-md shadow-indigo-500/10">
              <Brain className="h-5.5 w-5.5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-sm tracking-tight text-white flex items-center gap-1">
                Product<span className="text-gradient">OS</span>
              </h1>
              <p className="text-[10px] text-cyan-400 font-medium tracking-wide">DECISION INTEL</p>
            </div>
          </div>

          {/* Project Selector */}
          <div className="p-4 border-b border-white/5">
            <label className="text-[10px] uppercase font-bold text-[#64748B] block mb-1.5 px-2">Active Project</label>
            <div className="relative group">
              <select
                value={currentProject?.id || ""}
                onChange={(e) => {
                  const proj = projectsData?.find((p: any) => p.id === parseInt(e.target.value));
                  if (proj) setProject(proj);
                }}
                className="w-full bg-[#121622]/80 border border-white/10 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-indigo-500/50 appearance-none cursor-pointer pr-8"
              >
                {projectsData && projectsData.length > 0 ? (
                  projectsData.map((p: any) => (
                    <option key={p.id} value={p.id} className="bg-[#121622] text-white">
                      {p.name}
                    </option>
                  ))
                ) : (
                  <option value="" className="text-gray-400">Loading project...</option>
                )}
              </select>
              <div className="absolute right-3 top-2.5 pointer-events-none text-gray-400 group-hover:text-white transition-colors">
                <ChevronDown className="h-4 w-4" />
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? "bg-gradient-to-r from-indigo-500/15 to-cyan-500/5 text-white border-l-2 border-indigo-500 pl-2.5 shadow-sm"
                      : "text-[#94A3B8] hover:text-white hover:bg-white/5"
                  }`}
                >
                  <Icon className={`h-4.5 w-4.5 ${isActive ? "text-indigo-400" : "text-[#64748B]"}`} />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User / Persona Switcher at Bottom */}
        <div className="p-4 border-t border-white/5 bg-[#0C0E17]/40">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider flex items-center gap-1">
              <Sparkles className="h-3 w-3" /> Persona Demo Switcher
            </span>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold">MOCK</span>
          </div>
          <p className="text-[10px] text-[#64748B] mb-2 leading-tight">Switch users to test PM vs Stakeholder approval flows:</p>
          <div className="relative">
            <select
              value={currentUserId}
              onChange={(e) => setUserId(e.target.value)}
              className="w-full bg-[#121622]/80 border border-white/10 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-indigo-500/50 appearance-none cursor-pointer pr-8"
            >
              {mockUsers.map((mu) => (
                <option key={mu.id} value={mu.id} className="bg-[#121622] text-white">
                  {mu.name} ({mu.role.toUpperCase()})
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-2.5 pointer-events-none text-gray-400">
              <ChevronDown className="h-4 w-4" />
            </div>
          </div>
          {currentUser && (
            <div className="mt-3 flex items-center gap-2.5 px-1 py-1">
              <div className="h-7 w-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-xs font-bold text-white uppercase shadow-inner">
                {currentUser.name[0]}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-white truncate leading-tight">{currentUser.name}</p>
                <p className="text-[10px] text-[#64748B] truncate leading-none capitalize">{currentUser.role} Account</p>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header Bar */}
        <header className="h-16 border-b border-white/5 flex items-center justify-between px-8 bg-[#090B11]/50 backdrop-blur-sm z-30 shrink-0">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              {currentProject ? currentProject.name : "Select a Project"}
            </h2>
            <p className="text-xs text-[#64748B] truncate max-w-xl">
              {currentProject?.goal || "Configure your project setup."}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs font-semibold text-[#94A3B8] flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/5">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              API Connected
            </span>
          </div>
        </header>

        {/* Content Wrapper */}
        <main className="flex-1 overflow-y-auto p-8 relative">
          {children}
        </main>
      </div>
    </div>
  );
}
