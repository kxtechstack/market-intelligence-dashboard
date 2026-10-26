import React, { useState, useEffect, useRef } from "react";
import { motion } from "motion/react";
import { supabase } from "./lib/supabase";
import LeftMenubar from "./components/LeftMenubar";
import IntelligencePane from "./components/IntelligencePane";
import LatestPane from "./components/LatestPane";
import MarketDynamicsPane from "./components/MarketDynamicsPane";
import FindOpportunitiesPane from "./components/FindOpportunitiesPane";
import CompetitiveRadarPane from "./components/CompetitiveRadarPane";
import VoiceOfCustomerPane from "./components/VoiceOfCustomerPane";
import ForewardOutlookPane from "./components/ForewardOutlookPane";
import DecisionIntelligencePane from "./components/DecisionIntelligencePane";
import LandingPane from "./components/LandingPane";
import MyBookmarksPane from "./components/MyBookmarksPane";
import SettingsPane from "./components/SettingsPane";
import SupportPane from "./components/SupportPane";
import SetPasswordPane from "./components/SetPasswordPane";
import WorkspaceConfigPane from "./components/WorkspaceConfigPane";
import LoginShowcase from "./components/LoginShowcase";
import { AlertItem, ChatMessage } from "./types";
import { API_URL } from "./constants";
import { 
  ShieldAlert, 
  Loader2, 
  ChevronDown, 
  Moon, 
  Sun, 
  Search, 
  X, 
  ArrowUpRight,
  Layers,
  TrendingUp,
  Compass,
  Radar,
  MessageSquare,
  Bookmark,
  Check,
  ArrowRight
} from "lucide-react";

interface TopMenuBarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isLoggedIn?: boolean;
  userName?: string;
  companyName?: string;
  clientId?: string | null;
  userId?: string | null;
  creditUsage?: { used: number; total: number; remaining: number } | null;
  fetchCreditUsage?: () => void;
  onNavigateSignal?: (module: string, signalId: string) => void;
  onLogout: () => void;
}

function TopMenuBar({
  activeTab,
  onTabChange,
  isLoggedIn,
  userName = "Hannah Wells",
  companyName = "Lumière Beauty Group",
  clientId,
  userId,
  creditUsage: propCreditUsage,
  fetchCreditUsage,
  onNavigateSignal,
  onLogout,
}: TopMenuBarProps) {
  const [openDropdown, setOpenDropdown] = useState<"resources" | "user" | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    try {
      return localStorage.getItem("app_dark_mode") === "true";
    } catch {
      return false;
    }
  });
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [signalSearchResults, setSignalSearchResults] = useState<{
    id: string;
    title: string;
    summary: string;
    module: string;
    moduleLabel: string;
    date?: string;
  }[]>([]);
  const [isSearchingSignals, setIsSearchingSignals] = useState(false);

  useEffect(() => {
    if (!searchQuery.trim() || !clientId) {
      setSignalSearchResults([]);
      return;
    }
    const q = searchQuery.trim();
    let isMounted = true;

    async function searchSignals() {
      setIsSearchingSignals(true);
      try {
        const [policyRes, marketRes, trendRes] = await Promise.all([
          supabase.from("policy_signals")
            .select("id, signal_title, summary, category, source_published_date")
            .eq("client_id", clientId)
            .or(`signal_title.ilike.%${q}%,summary.ilike.%${q}%`)
            .limit(10),
          supabase.from("market_insights_live")
            .select("id, title, summary, category, created_at")
            .eq("client_id", clientId)
            .or(`title.ilike.%${q}%,summary.ilike.%${q}%`)
            .limit(10),
          supabase.from("trend_signals")
            .select("id, title, summary, category, created_at")
            .eq("client_id", clientId)
            .or(`title.ilike.%${q}%,summary.ilike.%${q}%`)
            .limit(10),
        ]);

        if (!isMounted) return;

        const results: any[] = [];
        (policyRes.data || []).forEach(item => {
          results.push({
            id: item.id,
            title: item.signal_title || item.summary || "Policy Signal",
            summary: item.summary || "",
            module: "policy_risk_monitor",
            moduleLabel: "Policy & Risk Monitor",
            date: item.source_published_date
          });
        });
        (marketRes.data || []).forEach(item => {
          results.push({
            id: item.id,
            title: item.title || item.summary || "Market Insight",
            summary: item.summary || "",
            module: "market_dynamics",
            moduleLabel: "Market Dynamics",
            date: item.created_at
          });
        });
        (trendRes.data || []).forEach(item => {
          results.push({
            id: item.id,
            title: item.title || item.summary || "Forward Outlook Signal",
            summary: item.summary || "",
            module: "foreward_outlook",
            moduleLabel: "Forward Outlook",
            date: item.created_at
          });
        });

        setSignalSearchResults(results);
      } catch (err) {
        console.error("Global signal search error:", err);
        if (isMounted) setSignalSearchResults([]);
      } finally {
        if (isMounted) setIsSearchingSignals(false);
      }
    }

    const timer = setTimeout(searchSignals, 250);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [searchQuery, clientId]);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [showDocsModal, setShowDocsModal] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [internalCreditUsage, setInternalCreditUsage] = useState<{ used: number; total: number; remaining: number } | null>(null);
  const creditUsage = propCreditUsage !== undefined ? propCreditUsage : internalCreditUsage;

  useEffect(() => {
    if (fetchCreditUsage) {
      fetchCreditUsage();
    } else if (clientId && userId) {
      let isMounted = true;
      async function fetchUsage() {
        try {
          const res = await fetch(`${API_URL}/credit-usage/${clientId}?userId=${userId}`).catch(() => null);
          if (res && res.ok) {
            const data = await res.json().catch(() => null);
            if (isMounted && data && typeof data.used === "number" && typeof data.total === "number") {
              setInternalCreditUsage({
                used: data.used,
                total: data.total,
                remaining: typeof data.remaining === "number" ? data.remaining : (data.total - data.used),
              });
              return;
            }
          }
          if (isMounted) {
            setInternalCreditUsage({ used: 0, total: 10000, remaining: 10000 });
          }
        } catch {
          if (isMounted) {
            setInternalCreditUsage({ used: 0, total: 10000, remaining: 10000 });
          }
        }
      }
      fetchUsage();
      return () => {
        isMounted = false;
      };
    }
  }, [clientId, userId, fetchCreditUsage]);

  const [moduleCounts, setModuleCounts] = useState<Record<string, number>>({
    policy_risk_monitor: 0,
    market_dynamics: 0,
    foreward_outlook: 0,
    decision_intelligence: 0,
    find_opportunities: 0,
    competitive_radar: 0,
    voice_of_customer: 0,
    my_bookmarks: 0,
  });

  useEffect(() => {
    if (!clientId) return;
    async function loadCounts() {
      try {
        const [policyRes, marketRes, trendRes, bookmarksRes, diConvRes] = await Promise.all([
          supabase.from("policy_signals").select("id", { count: "exact", head: true }).eq("client_id", clientId),
          supabase.from("market_dynamics_signals").select("id", { count: "exact", head: true }).eq("client_id", clientId),
          supabase.from("trend_signals").select("id", { count: "exact", head: true }).eq("client_id", clientId),
          userId
            ? supabase.from("bookmarks").select("id", { count: "exact", head: true }).eq("user_id", userId)
            : Promise.resolve({ count: 0 }),
          userId
            ? supabase.from("di_conversations").select("id", { count: "exact", head: true }).eq("client_id", clientId).eq("user_id", userId)
            : Promise.resolve({ count: 0 }),
        ]);

        setModuleCounts({
          policy_risk_monitor: policyRes.count ?? 0,
          market_dynamics: marketRes.count ?? 0,
          foreward_outlook: trendRes.count ?? 0,
          decision_intelligence: diConvRes.count ?? 0,
          my_bookmarks: bookmarksRes.count ?? 0,
          find_opportunities: 0,
          competitive_radar: 0,
          voice_of_customer: 0,
        });
      } catch (err) {
        console.error("Failed to load module counts", err);
      }
    }
    loadCounts();
  }, [clientId, userId]);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    try {
      localStorage.setItem("app_dark_mode", String(isDarkMode));
    } catch {}
  }, [isDarkMode]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setShowSearchModal((prev) => !prev);
      }
      if (e.key === "Escape") {
        setShowSearchModal(false);
        setShowPricingModal(false);
        setShowDocsModal(false);
        setOpenDropdown(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleToggleColor = () => {
    setIsDarkMode((prev) => !prev);
  };

  const moduleList = [
    {
      id: "decision_intelligence",
      label: "Decision Intelligence",
      desc: "Automated executive synthesis & strategic implications",
      icon: Layers,
      countKey: "decision_intelligence",
      defaultCount: 0,
      unit: "reports",
    },
    {
      id: "market_dynamics",
      label: "Market Dynamics",
      desc: "Real-time industry movements, trends & competitive forces",
      icon: TrendingUp,
      countKey: "market_dynamics",
      defaultCount: 0,
      unit: "signals",
    },
    {
      id: "policy_risk_monitor",
      label: "Policy & Risk Monitor",
      desc: "Prudential regulatory consultations & compliance intelligence",
      icon: ShieldAlert,
      countKey: "policy_risk_monitor",
      defaultCount: 0,
      unit: "signals",
    },
    {
      id: "foreward_outlook",
      label: "Forward Outlook",
      desc: "Horizon-scanning signals and scenario forecasting",
      icon: Compass,
      countKey: "foreward_outlook",
      defaultCount: 0,
      unit: "signals",
    },
    {
      id: "find_opportunities",
      label: "Find Opportunities",
      desc: "Market disruption scans and growth vectors",
      icon: Search,
      countKey: "find_opportunities",
      defaultCount: 0,
      unit: "signals",
    },
    {
      id: "competitive_radar",
      label: "Competitive Radar",
      desc: "Peer group telemetry and strategic shifts",
      icon: Radar,
      countKey: "competitive_radar",
      defaultCount: 0,
      unit: "signals",
    },
    {
      id: "voice_of_customer",
      label: "Voice of Customer",
      desc: "Customer sentiment, pain points and feedback trends",
      icon: MessageSquare,
      countKey: "voice_of_customer",
      defaultCount: 0,
      unit: "signals",
    },
    {
      id: "my_bookmarks",
      label: "My Bookmarks",
      desc: "Saved intelligence signals and bookmarked reports",
      icon: Bookmark,
      countKey: "my_bookmarks",
      defaultCount: 0,
      unit: "saved",
    },
  ];

  const resourceList = [
    { label: "Documentation & API", desc: "Developer integration guides, schemas & endpoints", action: () => setShowDocsModal(true) },
    { label: "Regulatory Frameworks", desc: "Basel, SEC, and EU prudential monitoring taxonomy", action: () => onTabChange("policy_risk_monitor") },
    { label: "Market Intelligence Guide", desc: "Methodology and signal ingestion standards", action: () => onTabChange("market_dynamics") },
    { label: "Contact Support Desk", desc: "Direct priority assistance and query resolution", action: () => onTabChange("support") },
  ];

  const filteredModules = moduleList.filter((m) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return m.label.toLowerCase().includes(q) || m.desc.toLowerCase().includes(q);
  });

  return (
    <header className="w-full h-12 bg-white border-b border-zinc-200/90 px-4 md:px-5 flex items-center justify-between z-40 shrink-0 font-sans relative">
      {/* 1. Left: Logo on the top left */}
      <div 
        onClick={() => onTabChange(isLoggedIn ? "landing_page" : "login")} 
        className="flex items-center gap-2.5 cursor-pointer group select-none"
        title="REUI Dashboard"
      >
        <div className="w-7 h-7 rounded-[7px] border border-zinc-200 bg-white shadow-2xs flex items-center justify-center text-zinc-900 group-hover:border-zinc-300 transition-colors">
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 5v8a6 6 0 0 0 12 0V5" />
          </svg>
        </div>
        <span className="font-bold text-[13.5px] tracking-[0.16em] text-zinc-900 font-sans">
          REUI
        </span>
      </div>

      {/* 2. Right: Only resources, support, search and then credit usage plus toggle color */}
      <div ref={dropdownRef} className="flex items-center gap-1.5 md:gap-2">
        {/* Resources */}
        <div className="relative">
          <button
            onClick={() => setOpenDropdown(openDropdown === "resources" ? null : "resources")}
            style={{ color: "#171717", fontWeight: 400, fontStyle: "normal", fontSize: "13px" }}
            className={`px-2.5 py-1.5 rounded-[6px] flex items-center gap-1 transition-colors cursor-pointer ${
              openDropdown === "resources"
                ? "bg-zinc-100"
                : "hover:bg-zinc-100/70"
            }`}
          >
            <span>Resources</span>
            <ChevronDown className={`w-3.5 h-3.5 text-[#171717]/80 transition-transform duration-150 ${openDropdown === "resources" ? "rotate-180" : ""}`} />
          </button>

          {openDropdown === "resources" && (
            <div className="absolute right-0 mt-1.5 w-68 bg-white border border-zinc-200 rounded-[6px] shadow-lg py-1.5 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
              <div className="px-3 py-1 text-[10.5px] font-semibold text-zinc-400 uppercase tracking-wider">
                Developer & Research
              </div>
              {resourceList.map((res, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    res.action();
                    setOpenDropdown(null);
                  }}
                  className="w-full text-left px-3 py-2 text-[12.5px] hover:bg-zinc-50 flex flex-col transition-colors text-zinc-700 cursor-pointer"
                >
                  <span className="font-medium text-zinc-900">{res.label}</span>
                  <span className="text-[11px] text-zinc-400 font-normal truncate">{res.desc}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Support */}
        <button
          onClick={() => onTabChange(activeTab === "support" ? (isLoggedIn ? "decision_intelligence" : "login") : "support")}
          style={{ 
            backgroundColor: activeTab === "support" ? "#eef1fe" : "transparent",
            color: activeTab === "support" ? "#2d39d2" : "#171717", 
            fontWeight: activeTab === "support" ? 500 : 400, 
            fontStyle: "normal", 
            fontSize: "13px" 
          }}
          className={`px-2.5 py-1.5 rounded-[6px] transition-colors cursor-pointer ${
            activeTab === "support"
              ? "bg-[#eef1fe] text-[#2d39d2] ring-1 ring-[#2d39d2]/20 shadow-2xs"
              : "hover:bg-zinc-100/70 text-zinc-700"
          }`}
        >
          Support
        </button>

        {/* Search & Credit usage: only visible when logged in */}
        {isLoggedIn && (
          <>
            {/* Search */}
            <button
              onClick={() => setShowSearchModal(true)}
              style={{ color: "#171717", fontWeight: 400, fontStyle: "normal", fontSize: "13px" }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 hover:bg-zinc-100/70 rounded-[6px] transition-colors cursor-pointer"
              title="Search modules (⌘K)"
            >
              <Search className="w-3.5 h-3.5 text-[#171717]" />
              <span>Search</span>
              <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono text-zinc-400 bg-zinc-100 rounded border border-zinc-200/80">
                ⌘K
              </span>
            </button>

            {/* Credit Usage */}
            <div 
              onClick={() => setShowPricingModal(true)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] bg-zinc-100/80 border border-zinc-200/80 text-[12px] font-medium text-zinc-600 shadow-2xs cursor-pointer hover:bg-zinc-100 transition-colors"
              title="Click to view subscription quota details"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
              <span>Credit Usage</span>
              <span className="font-semibold text-zinc-900">
                {creditUsage ? `${creditUsage.used}/${creditUsage.total}` : '—'}
              </span>
            </div>
          </>
        )}

        {/* Divider */}
        <div className="h-4 w-px bg-zinc-200 mx-0.5" />

        {/* Toggle color icon */}
        <button
          onClick={handleToggleColor}
          className="p-1.5 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-[6px] transition-colors cursor-pointer"
          title={isDarkMode ? "Switch to light mode" : "Switch to dark mode (invert black to white)"}
        >
          {isDarkMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* User name in other serif font and Company name under it with dropdown */}
        <div className="relative">
          <div 
            onClick={() => setOpenDropdown(openDropdown === "user" ? null : "user")}
            className="flex items-center gap-1.5 pl-1.5 border-l border-zinc-200/90 ml-1 py-0.5 leading-tight select-none cursor-pointer group"
          >
            <div className="flex flex-col items-start justify-center">
              <span 
                style={{ fontFamily: '"Source Serif 4", Georgia, Cambria, "Times New Roman", Times, serif' }}
                className="text-[13px] font-medium text-zinc-900 leading-snug tracking-tight group-hover:text-[#2d39d2] transition-colors"
              >
                {userName}
              </span>
              <span className="text-[10.5px] text-zinc-500 font-normal leading-snug">
                {companyName}
              </span>
            </div>
            <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 transition-transform duration-150 ${openDropdown === "user" ? "rotate-180" : ""}`} />
          </div>

          {openDropdown === "user" && (
            <div className="absolute right-0 mt-1.5 w-52 bg-white border border-zinc-200 rounded-[6px] shadow-lg py-1.5 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
              <button
                onClick={() => {
                  onTabChange("settings");
                  setOpenDropdown(null);
                }}
                className="w-full text-left px-3 py-2 text-[12.5px] hover:bg-zinc-50 flex items-center gap-2 transition-colors text-zinc-700 cursor-pointer font-medium"
              >
                <span>Workspace Configuration</span>
              </button>
              <button
                onClick={() => {
                  onLogout();
                  setOpenDropdown(null);
                }}
                className="w-full text-left px-3 py-2 text-[12.5px] hover:bg-red-50 flex items-center gap-2 transition-colors text-red-600 cursor-pointer font-medium border-t border-zinc-100 mt-1 pt-2"
              >
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Search Modules Modal with Counts */}
      {showSearchModal && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-2xs z-50 flex items-start justify-center pt-20 px-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowSearchModal(false);
            }
          }}
        >
          <div className="w-full max-w-2xl bg-white rounded-[8px] border border-zinc-200 shadow-2xl overflow-hidden animate-in fade-in duration-150 flex flex-col">
            {/* Search Input Bar */}
            <div className="flex items-center px-4 border-b border-zinc-200 py-3.5 bg-white">
              <Search className="w-4.5 h-4.5 text-zinc-400 mr-3 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search top-level signals and content across all modules..."
                autoFocus
                className="w-full text-[15px] bg-transparent outline-none text-zinc-900 placeholder:text-zinc-400 font-sans"
              />
              <button 
                onClick={() => setShowSearchModal(false)} 
                className="p-1 text-zinc-400 hover:text-zinc-700 rounded cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Results List */}
            <div className="p-2 max-h-[500px] overflow-y-auto">
              {searchQuery.trim() !== "" ? (
                <>
                  <div className="flex items-center justify-between px-2.5 py-1.5 mb-1">
                    <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                      Signals & Content Results
                    </span>
                    <span className="text-[11px] font-medium text-zinc-400">
                      {isSearchingSignals ? "Searching..." : `${signalSearchResults.length} ${signalSearchResults.length === 1 ? "signal" : "signals"}`}
                    </span>
                  </div>

                  {isSearchingSignals ? (
                    <div className="py-12 flex items-center justify-center">
                      <Loader2 className="w-5 h-5 text-zinc-400 animate-spin" />
                    </div>
                  ) : signalSearchResults.length === 0 ? (
                    <div className="py-12 text-center text-[13px] text-zinc-400">
                      No signals found matching &ldquo;{searchQuery}&rdquo; across modules
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {signalSearchResults.map((sig) => (
                        <button
                          key={sig.id}
                          onClick={() => {
                            onTabChange(sig.module);
                            if (onNavigateSignal) {
                              onNavigateSignal(sig.module, sig.id);
                            }
                            setShowSearchModal(false);
                            setSearchQuery("");
                          }}
                          className="w-full text-left px-3 py-3 hover:bg-zinc-50 rounded-[6px] flex flex-col gap-1 transition-colors cursor-pointer group border border-transparent hover:border-zinc-200/80"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-semibold text-zinc-900 text-[13.5px] leading-snug">
                              {sig.title}
                            </span>
                            <span className="text-[10px] font-medium bg-violet-50 text-[#2d39d2] px-2 py-0.5 rounded border border-violet-200/60 shrink-0 font-sans">
                              {sig.moduleLabel}
                            </span>
                          </div>
                          {sig.summary && (
                            <p className="text-[12px] text-zinc-500 font-light line-clamp-2 leading-relaxed">
                              {sig.summary}
                            </p>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between px-2.5 py-1.5 mb-1">
                    <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                      Modules & Workspaces
                    </span>
                    <span className="text-[11px] font-medium text-zinc-400">
                      {filteredModules.length} {filteredModules.length === 1 ? "module" : "modules"}
                    </span>
                  </div>

                  {filteredModules.length === 0 ? (
                    <div className="py-8 text-center text-[12.5px] text-zinc-400">
                      No modules found matching &ldquo;{searchQuery}&rdquo;
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {filteredModules.map((m) => {
                        const IconComponent = m.icon;
                        const countVal = moduleCounts[m.countKey] ?? m.defaultCount;
                        const isActive = activeTab === m.id;

                        return (
                          <button
                            key={m.id}
                            onClick={() => {
                              onTabChange(m.id);
                              setShowSearchModal(false);
                              setSearchQuery("");
                            }}
                            className={`w-full text-left px-3 py-2.5 hover:bg-zinc-50 rounded-[6px] flex items-center justify-between text-[12.5px] transition-colors cursor-pointer group ${
                              isActive ? "bg-violet-50/50" : ""
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className={`w-8 h-8 rounded-[6px] flex items-center justify-center shrink-0 border ${
                                isActive
                                  ? "bg-violet-100/70 border-violet-200 text-[#2d39d2]"
                                  : "bg-zinc-100 border-zinc-200/80 text-zinc-600 group-hover:text-zinc-900 group-hover:border-zinc-300"
                              }`}>
                                <IconComponent className="w-4 h-4" />
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-zinc-900 text-[13px]">{m.label}</span>
                                  {isActive && (
                                    <span className="text-[10px] font-medium bg-[#eef1fe] text-[#2d39d2] px-1.5 py-0.5 rounded border border-violet-200/60">
                                      Current
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11.5px] text-zinc-400 font-normal truncate max-w-sm">
                                  {m.desc}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0 ml-3">
                              <span className="px-2 py-0.5 text-[11px] font-semibold bg-zinc-100 text-zinc-700 rounded-[4px] border border-zinc-200/90 group-hover:bg-zinc-200/70 transition-colors">
                                {countVal.toLocaleString()} {m.unit}
                              </span>
                              <ArrowUpRight className="w-3.5 h-3.5 text-zinc-400 group-hover:text-[#2d39d2] transition-colors" />
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-3.5 py-2 bg-zinc-50 border-t border-zinc-100 flex items-center justify-between text-[11px] text-zinc-400">
              <span>Type keywords to search top-level signals across all modules</span>
              <span>Press <kbd className="font-mono bg-white px-1.5 py-0.5 rounded border border-zinc-200 text-zinc-600">ESC</kbd> to exit</span>
            </div>
          </div>
        </div>
      )}

      {/* Pricing / Plan Quota Modal */}
      {showPricingModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-2xs z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-[8px] border border-zinc-200 shadow-xl p-5 animate-in fade-in duration-150">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3 mb-4">
              <div>
                <h3 className="text-[15px] font-semibold text-zinc-900">Subscription & Credits</h3>
                <p className="text-[12px] text-zinc-500">Graceview Market Intelligence Enterprise Tier</p>
              </div>
              <button onClick={() => setShowPricingModal(false)} className="p-1 text-zinc-400 hover:text-zinc-700 rounded cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="bg-zinc-50 border border-zinc-200/80 rounded-[6px] p-3.5">
                <div className="flex justify-between items-center text-[12.5px] mb-2">
                  <span className="font-medium text-zinc-700">Credit Consumption</span>
                  <span className="font-semibold text-zinc-900">
                    {typeof creditUsage?.used === "number" ? creditUsage.used.toLocaleString() : (creditUsage?.used ?? '—')} / {(creditUsage?.total ?? 10000).toLocaleString()} used
                  </span>
                </div>
                <div className="w-full h-2 bg-zinc-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 rounded-full" 
                    style={{ width: `${creditUsage && creditUsage.total > 0 ? Math.min(100, (creditUsage.used / creditUsage.total) * 100) : 0}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-[11px] text-zinc-400 mt-2">
                  <span>{typeof creditUsage?.remaining === "number" ? creditUsage.remaining.toLocaleString() : (creditUsage?.remaining ?? '—')} credits remaining</span>
                  <span>Cycle resets monthly</span>
                </div>
              </div>
              <div className="text-[12px] text-zinc-600 space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  <span>Unlimited regulatory scanning and live consultation feeds</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  <span>Full access to MarketGenie strategic inference & report synthesis</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  <span>Custom signals and SEC document retrieval</span>
                </div>
              </div>
            </div>
            <div className="mt-5 pt-3 border-t border-zinc-100 flex justify-end">
              <button
                onClick={() => setShowPricingModal(false)}
                className="px-3.5 py-1.5 text-[12.5px] font-medium bg-zinc-900 text-white rounded-[4px] hover:bg-black transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Docs Modal */}
      {showDocsModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-2xs z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-[8px] border border-zinc-200 shadow-xl p-5 animate-in fade-in duration-150">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3 mb-4">
              <div>
                <h3 className="text-[15px] font-semibold text-zinc-900">System Documentation</h3>
                <p className="text-[12px] text-zinc-500">Guides, regulatory models and technical references</p>
              </div>
              <button onClick={() => setShowDocsModal(false)} className="p-1 text-zinc-400 hover:text-zinc-700 rounded cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3 text-[12.5px] text-zinc-700">
              <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-[6px]">
                <h4 className="font-semibold text-zinc-900 mb-1">Decision Intelligence v2</h4>
                <p className="text-[11.5px] text-zinc-500 leading-relaxed">
                  Real-time contextual chat with persistent memory and automated executive report synthesis.
                </p>
              </div>
              <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-[6px]">
                <h4 className="font-semibold text-zinc-900 mb-1">Signal Enrichment Engine</h4>
                <p className="text-[11.5px] text-zinc-500 leading-relaxed">
                  Ingests global policy notices, SEC 10-K filings, and corporate strategic movements with vector verification.
                </p>
              </div>
            </div>
            <div className="mt-5 pt-3 border-t border-zinc-100 flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowDocsModal(false);
                  onTabChange("support");
                }}
                className="px-3 py-1.5 text-[12px] font-medium text-zinc-700 hover:bg-zinc-100 rounded-[4px] transition-colors cursor-pointer"
              >
                Need Help?
              </button>
              <button
                onClick={() => setShowDocsModal(false)}
                className="px-3.5 py-1.5 text-[12.5px] font-medium bg-zinc-900 text-white rounded-[4px] hover:bg-black transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [clientId, setClientId] = useState<string | null>(null);
  const [industry, setIndustry] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>("Hannah Wells");
  const [companyName, setCompanyName] = useState<string>("Lumière Beauty Group");
  const [userInitials, setUserInitials] = useState<string>("HW");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isRecoveryFlow, setIsRecoveryFlow] = useState(() => window.location.hash.includes('access_token'));
  const [creditUsage, setCreditUsage] = useState<{ used: number; total: number; remaining: number } | null>(null);

  const fetchCreditUsage = async () => {
    if (!clientId || !userId) return;
    try {
      const res = await fetch(`${API_URL}/credit-usage/${clientId}?userId=${userId}`).catch(() => null);
      if (res && res.ok) {
        const data = await res.json().catch(() => null);
        if (data && typeof data.used === "number" && typeof data.total === "number") {
          setCreditUsage({
            used: data.used,
            total: data.total,
            remaining: typeof data.remaining === "number" ? data.remaining : (data.total - data.used),
          });
          return;
        }
      }
      setCreditUsage((prev) => prev || { used: 0, total: 10000, remaining: 10000 });
    } catch {
      setCreditUsage((prev) => prev || { used: 0, total: 10000, remaining: 10000 });
    }
  };

  useEffect(() => {
    if (clientId && userId) {
      fetchCreditUsage();
    }
  }, [clientId, userId]);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotStatus, setForgotStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [forgotMessage, setForgotMessage] = useState<string>("");
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [demoFirstName, setDemoFirstName] = useState("");
  const [demoLastName, setDemoLastName] = useState("");
  const [demoEmail, setDemoEmail] = useState("");
  const [demoPhone, setDemoPhone] = useState("");
  const [demoCompany, setDemoCompany] = useState("");
  const [demoCompanySize, setDemoCompanySize] = useState("");
  const [demoCountry, setDemoCountry] = useState("");
  const [demoIsAgency, setDemoIsAgency] = useState<"yes" | "no">("no");
  const [demoNotes, setDemoNotes] = useState("");
  const [demoAgree, setDemoAgree] = useState(false);
  const [demoSubmitted, setDemoSubmitted] = useState(false);
  const [showSupportContactModal, setShowSupportContactModal] = useState(false);

  const VALID_TABS = [
    "landing_page", "policy_risk_monitor", "market_dynamics", "foreward_outlook", 
    "latest", "find_opportunities", "competitive_radar", 
    "voice_of_customer", "decision_intelligence", "my_bookmarks", 
    "support", "settings"
  ];

  const [activeTab, setActiveTab] = useState<string>(() => {
    try {
      const saved = localStorage.getItem("app_active_tab");
      if (saved && VALID_TABS.includes(saved)) {
        return saved;
      }
    } catch (e) {
      console.error("Failed to read activeTab from localStorage", e);
    }
    return "landing_page";
  });

  useEffect(() => {
    if (activeTab !== "decision_intelligence") {
        setInitialQuery({query: "", timestamp: 0});
        setDiReturnConfig(null);
    }
    try {
      localStorage.setItem("app_active_tab", activeTab);
    } catch (e) {
      console.error("Failed to save activeTab to localStorage", e);
    }
  }, [activeTab]);

  useEffect(() => {
    const tabToPageName: Record<string, string> = {
      landing_page: "Home",
      policy_risk_monitor: "Policy & Risk Monitor",
      market_dynamics: "Market Dynamics",
      foreward_outlook: "Forward Outlook",
      latest: "Latest Intelligence",
      find_opportunities: "Find Opportunities",
      competitive_radar: "Competitive Radar",
      voice_of_customer: "Voice of Customer",
      decision_intelligence: "Decision Intelligence",
      my_bookmarks: "My Bookmarks",
      support: "Support",
      settings: "Settings",
      login: "Login",
      workspace_config: "Workspace Configuration"
    };

    let pageName = tabToPageName[activeTab] || "Workspace";
    if (isRecoveryFlow) pageName = "Set Password";
    if (!isLoggedIn && activeTab !== "support") pageName = "Login";

    document.title = `InsideMarkets AI | ${pageName} | ${companyName}`;
  }, [activeTab, companyName, isLoggedIn, isRecoveryFlow]);

  const [navigatedItemId, setNavigatedItemId] = useState<string | null>(null);
  const [initialQuery, setInitialQuery] = useState<{query: string, timestamp: number}>({query: "", timestamp: 0});
  const [diReturnConfig, setDiReturnConfig] = useState<{tab: string, label: string} | null>(null);

  // Clear date filters on refresh (mount)
  useEffect(() => {
    sessionStorage.removeItem("policy_risk_start_date");
    sessionStorage.removeItem("policy_risk_end_date");
    sessionStorage.removeItem("market_dynamics_start_date");
    sessionStorage.removeItem("market_dynamics_end_date");
    sessionStorage.removeItem("foreward_outlook_start_date");
    sessionStorage.removeItem("foreward_outlook_end_date");
  }, []);

  const handleNavigateFromBookmarks = (module: string, id: string) => {
    setActiveTab(module);
    setNavigatedItemId(id);
  };

  useEffect(() => {
    const initializeAuth = async () => {
      setAuthLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session && !isRecoveryFlow) {
          const userEmail = session.user.email;
          if (userEmail) {
            // Look up client_id, id, and user name in admin.client_users
            const { data: userData, error: userError } = await supabase
              .schema('admin')
              .from('client_users')
              .select('id, client_id, first_name, last_name')
              .eq('email', userEmail.toLowerCase())
              .single();

            if (userError || !userData?.client_id) {
              console.error("Session restore: client lookup failed", userError);
              await supabase.auth.signOut();
            } else {
              // Fetch client industry and company_name from admin.clients
              const { data: clientData, error: clientError } = await supabase
                .schema('admin')
                .from('clients')
                .select('industry, company_name')
                .eq('id', userData.client_id)
                .single();

              setUserId(userData.id);
              setClientId(userData.client_id);
              setIndustry(clientData?.industry || "Retail");
              if (clientData?.company_name) {
                setCompanyName(clientData.company_name);
              }
              
              if (userData.first_name || userData.last_name) {
                const fullName = `${userData.first_name || ""} ${userData.last_name || ""}`.trim();
                setUserName(fullName || "Hannah Wells");
                const firstInitial = userData.first_name ? userData.first_name[0] : "";
                const lastInitial = userData.last_name ? userData.last_name[0] : "";
                setUserInitials((firstInitial + lastInitial).toUpperCase() || "HW");
              } else {
                setUserName("Hannah Wells");
                setUserInitials("HW");
              }
              setIsLoggedIn(true);
            }
          }
        }
      } catch (err) {
        console.error("Auth initialization error:", err);
      } finally {
        setAuthLoading(false);
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "PASSWORD_RECOVERY" || event === "USER_UPDATED") {
        setIsRecoveryFlow(true);
      } else if (event === "SIGNED_OUT") {
        setIsLoggedIn(false);
        setUserId(null);
        setClientId(null);
        setIndustry(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [isRecoveryFlow]);
  const [selectedAlert, setSelectedAlert] = useState<AlertItem | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsAuthenticating(true);

    sessionStorage.removeItem("policy_risk_start_date");
    sessionStorage.removeItem("policy_risk_end_date");
    sessionStorage.removeItem("market_dynamics_start_date");
    sessionStorage.removeItem("market_dynamics_end_date");
    sessionStorage.removeItem("foreward_outlook_start_date");
    sessionStorage.removeItem("foreward_outlook_end_date");

    try {
      // 1. Authenticate with Supabase
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      // 2. Look up client_id and id in admin.client_users
      const { data: userData, error: userError } = await supabase
        .schema('admin')
        .from('client_users')
        .select('id, client_id, first_name, last_name')
        .eq('email', email.toLowerCase())
        .single();

      if (userError) {
        console.error("Client lookup error:", userError);
        throw new Error("User associated client not found. Please contact support.");
      }

      if (!userData?.client_id) {
        throw new Error("No client assigned to this account.");
      }

      // 3. Fetch client industry and company_name from admin.clients
      const { data: clientData, error: clientError } = await supabase
        .schema('admin')
        .from('clients')
        .select('industry, company_name')
        .eq('id', userData.client_id)
        .single();

      if (clientError) {
        console.error("Client industry fetch error:", clientError);
      }

      setUserId(userData.id);
      setClientId(userData.client_id);
      setIndustry(clientData?.industry || "Retail");
      if (clientData?.company_name) {
        setCompanyName(clientData.company_name);
      }
      
      if (userData.first_name || userData.last_name) {
        const fullName = `${userData.first_name || ""} ${userData.last_name || ""}`.trim();
        setUserName(fullName || "Hannah Wells");
        const firstInitial = userData.first_name ? userData.first_name[0] : "";
        const lastInitial = userData.last_name ? userData.last_name[0] : "";
        setUserInitials((firstInitial + lastInitial).toUpperCase() || "HW");
      } else {
        setUserName("Hannah Wells");
        setUserInitials("HW");
      }

      setActiveTab("landing_page");
      setIsLoggedIn(true);
    } catch (err: any) {
      setLoginError(err.message || "An unexpected error occurred during login.");
      setIsLoggedIn(false);
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) return;
    setForgotStatus("loading");
    setForgotMessage("");

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail.trim(), {
        redirectTo: `${window.location.origin}/#access_token=recovery`,
      });

      if (error) throw error;
      setForgotStatus("success");
      setForgotMessage("Password reset email sent! Check your inbox for the recovery link.");
    } catch (err: any) {
      setForgotStatus("error");
      setForgotMessage(err.message || "Failed to send reset email. Please try again.");
    }
  };

  // Function to push programmatic queries to AI Chat from buttons in other workspaces
  const handleSendToChat = (prompt: string) => {
    const userMessage: ChatMessage = {
      id: typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : Math.random().toString(36).substring(2),
      role: "user",
      text: prompt,
      timestamp: new Date()
    };

    setChatHistory(prev => [...prev, userMessage]);

    // Send the prompt securely to our express server API
    setLoadingResponse(prompt);
  };

  const setLoadingResponse = async (textToSend: string) => {
    try {
      // Build history payload
      const formattedHistory = chatHistory.map(msg => ({
        role: msg.role,
        text: msg.text
      }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: textToSend,
          history: formattedHistory
        })
      });

      if (res.ok) {
        const data = await res.json();
        const assistantMessage: ChatMessage = {
          id: typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : Math.random().toString(36).substring(2),
          role: "model",
          text: data.text,
          timestamp: new Date()
        };
        setChatHistory(prev => [...prev, assistantMessage]);
      } else {
        const err = await res.json();
        throw new Error(err.error || "Failed");
      }
    } catch (e: any) {
      const errMsg: ChatMessage = {
        id: typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : Math.random().toString(36).substring(2),
        role: "model",
        text: `Graceview Analyst Error: Could not resolve regulatory query on "${selectedAlert?.signal_title || "Unknown"}".\n\nDetail: ${e.message || "Endpoint error - Check Settings > Secrets inside AI Studio to ensure GEMINI_API_KEY is configured."}`,
        timestamp: new Date()
      };
      setChatHistory(prev => [...prev, errMsg]);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error("Logout error:", err);
    }
    sessionStorage.removeItem("policy_risk_start_date");
    sessionStorage.removeItem("policy_risk_end_date");
    sessionStorage.removeItem("market_dynamics_start_date");
    sessionStorage.removeItem("market_dynamics_end_date");
    sessionStorage.removeItem("foreward_outlook_start_date");
    sessionStorage.removeItem("foreward_outlook_end_date");
    localStorage.removeItem("app_active_tab");
    setIsLoggedIn(false);
    setActiveTab("landing_page");
    setUserId(null);
    setClientId(null);
    setIndustry(null);
    setEmail("");
    setPassword("");
  };

  // Switch between workspaces based on active tab
  const renderWorkspaceContent = () => {
    const handleReturn = () => setActiveTab("policy_risk_monitor");

    return (
      <div className="flex-1 h-full relative overflow-hidden flex flex-col">
        {/* Persistent Analytical Panes */}
        <div className={activeTab === "policy_risk_monitor" ? "flex-1 flex flex-col overflow-hidden" : "hidden"}>
          <IntelligencePane
            clientId={clientId || ""}
            industry={industry || ""}
            userId={userId || ""}
            selectedAlert={selectedAlert}
            onSelectAlert={(alert) => setSelectedAlert(alert)}
            navigatedItemId={navigatedItemId}
            onClearNavigatedItem={() => setNavigatedItemId(null)}
            onSwitchToDecisionIntelligence={(query, tab, label, returnLabel) => {
                setInitialQuery({query, timestamp: Date.now()});
                setDiReturnConfig({tab, label: returnLabel});
                setActiveTab("decision_intelligence");
            }}
          />
        </div>

        <div className={activeTab === "market_dynamics" ? "flex-1 flex flex-col overflow-hidden" : "hidden"}>
          <MarketDynamicsPane 
            onReturn={handleReturn} 
            clientId={clientId || ""}
            industry={industry || ""}
            userId={userId || ""}
            navigatedItemId={navigatedItemId}
            onClearNavigatedItem={() => setNavigatedItemId(null)}
            onSetInitialQuery={(query) => setInitialQuery({query, timestamp: Date.now()})}
            onSwitchToDecisionIntelligence={(query, tab, label, returnLabel) => {
                setInitialQuery({query, timestamp: Date.now()});
                setDiReturnConfig({tab, label: returnLabel});
                setActiveTab("decision_intelligence");
            }}
          />
        </div>

        <div className={activeTab === "foreward_outlook" ? "flex-1 flex flex-col overflow-hidden" : "hidden"}>
          <ForewardOutlookPane 
            onReturn={handleReturn} 
            clientId={clientId || ""}
            industry={industry || ""}
            userId={userId || ""}
            navigatedItemId={navigatedItemId}
            onClearNavigatedItem={() => setNavigatedItemId(null)}
            onSwitchToDecisionIntelligence={(query, tab, label, returnLabel) => {
                setInitialQuery({query, timestamp: Date.now()});
                setDiReturnConfig({tab, label: returnLabel});
                setActiveTab("decision_intelligence");
            }}
          />
        </div>

        {/* Transient / Light Panes */}
        {activeTab === "latest" && <LatestPane onReturn={handleReturn} />}
        {activeTab === "find_opportunities" && <FindOpportunitiesPane onReturn={handleReturn} />}
        {activeTab === "competitive_radar" && <CompetitiveRadarPane onReturn={handleReturn} />}
        {activeTab === "voice_of_customer" && <VoiceOfCustomerPane onReturn={handleReturn} />}
        
        <div className={activeTab === "landing_page" ? "flex-1 flex flex-col overflow-hidden" : "hidden"}>
          <LandingPane 
            onReturn={() => {
              setActiveTab("landing_page");
            }}
            onTabChange={(tabId, signalId) => {
              setActiveTab(tabId);
              if (signalId) {
                setNavigatedItemId(signalId);
              }
            }}
            clientId={clientId || ""}
            industry={industry || ""}
            userId={userId || ""}
            fetchCreditUsage={fetchCreditUsage}
          />
        </div>

        <div className={activeTab === "decision_intelligence" ? "flex-1 flex flex-col overflow-hidden" : "hidden"}>
          <DecisionIntelligencePane 
            onReturn={() => {
              if (diReturnConfig) {
                setActiveTab(diReturnConfig.tab);
                setDiReturnConfig(null);
              } else {
                setActiveTab("decision_intelligence");
              }
            }}
            onTabChange={(tabId, signalId) => {
              setActiveTab(tabId);
              if (signalId) {
                setNavigatedItemId(signalId);
              }
            }}
            clientId={clientId || ""}
            industry={industry || ""}
            userId={userId || ""}
            initialQuery={initialQuery}
            returnLabel={diReturnConfig?.label}
            fetchCreditUsage={fetchCreditUsage}
          />
        </div>

        <div className={activeTab === "my_bookmarks" ? "flex-1 flex flex-col overflow-hidden" : "hidden"}>
          <MyBookmarksPane clientId={clientId || ""} userId={userId || ""} onNavigate={handleNavigateFromBookmarks} />
        </div>

        {activeTab === "support" && <SupportPane onReturn={handleReturn} />}

        <div className={activeTab === "settings" ? "flex-1 flex flex-col overflow-hidden" : "hidden"}>
          <WorkspaceConfigPane onReturn={handleReturn} clientId={clientId || ""} />
        </div>

        {/* Fallback for unrecognized tabs */}
        {!["landing_page", "policy_risk_monitor", "market_dynamics", "foreward_outlook", "latest", "find_opportunities", "competitive_radar", "voice_of_customer", "decision_intelligence", "my_bookmarks", "support", "settings"].includes(activeTab) && (
          <div className="flex-1 h-full bg-zinc-50 flex items-center justify-center p-8 select-none">
            <div className="max-w-md w-full bg-white border border-zinc-200 p-6 rounded-[4px] shadow-[0_1px_3px_rgba(0,0,0,0.01)] text-center flex flex-col items-center">
              <h3 className="text-base font-medium text-zinc-900 mb-1">
                Workspace
              </h3>
              <p className="text-[12.5px] text-zinc-500 leading-relaxed mb-6">
                This workspace view compiles custom policy definitions for your requested workflow.
              </p>
              <button 
                onClick={handleReturn}
                className="py-1.5 px-4 border border-zinc-200 bg-[#fbfbfb] text-zinc-700 text-[11.5px] font-normal rounded-[4px] hover:bg-zinc-50"
              >
                Go to policy & risk monitor
              </button>
            </div>
          </div>
        )}

        {/* Global Footer on every page */}
        <footer className="shrink-0 w-full py-1.5 px-4 bg-white border-t border-zinc-100 text-center select-none z-30">
          <p className="text-[10.5px] text-zinc-400 font-sans tracking-normal">
            InsideMarkets is powered by AI and can make mistakes. Please double-check responses.
          </p>
        </footer>
      </div>
    );
  };
  if (isRecoveryFlow) {
    return <SetPasswordPane onDone={() => setIsRecoveryFlow(false)} />;
  }

  if (authLoading) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-zinc-50">
        <Loader2 className="w-6 h-6 text-zinc-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-screen h-screen flex flex-col overflow-hidden bg-zinc-100 select-text">
      {/* Top Menu Bar */}
      <TopMenuBar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isLoggedIn={isLoggedIn}
        userName={userName}
        companyName={companyName}
        clientId={clientId}
        userId={userId}
        creditUsage={creditUsage}
        fetchCreditUsage={fetchCreditUsage}
        onNavigateSignal={(module, signalId) => {
          setActiveTab(module);
          setNavigatedItemId(signalId);
        }}
        onLogout={handleLogout}
      />

      <div className="flex-1 w-full flex overflow-hidden">
        {!isLoggedIn ? (
          activeTab === "support" ? (
            <div className="w-full h-full flex flex-col overflow-hidden bg-zinc-50">
              <SupportPane onReturn={() => setActiveTab("login")} />
            </div>
          ) : (
          <div className="w-full h-full flex flex-col md:flex-row bg-[#fafafa] select-text overflow-hidden">
            {/* Left Pane: Visual Showcase matching reference image */}
            <div className="hidden md:flex md:w-1/2 lg:w-7/12 h-full bg-[#fbfbfb] border-r border-zinc-200 overflow-hidden relative items-center justify-center">
              <LoginShowcase />
            </div>

            {/* Right Pane: Login Form (No shadows, clean border styling) */}
            <div className="w-full md:w-1/2 lg:w-5/12 h-full flex items-center justify-center p-6 md:p-12 lg:p-16 bg-white overflow-y-auto">
              <motion.div 
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className="w-full max-w-sm flex flex-col"
              >
                <div className="mb-8">
                  <div className="w-9 h-9 bg-zinc-900 rounded-[4px] flex items-center justify-center mb-5">
                    <ShieldAlert className="w-4.5 h-4.5 text-white" />
                  </div>
                  <h2 className="text-2xl font-normal font-serif tracking-tight text-zinc-900">Sign in to your account</h2>
                  <p className="text-[13px] text-zinc-700 mt-1">Enter your work credentials to access the workspace</p>
                </div>
                
                <form 
                  onSubmit={handleLogin}
                  className="w-full flex flex-col gap-4"
                >
                  {loginError && (
                    <div className="w-full p-3 bg-rose-50 border border-rose-200 rounded-[4px] text-rose-600 text-[12px] leading-relaxed">
                      {loginError}
                    </div>
                  )}
                  
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[12px] font-medium text-zinc-700">Email address</label>
                    <input 
                      type="email" 
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                      disabled={isAuthenticating}
                      className="w-full h-10 px-3 text-[13px] border border-zinc-200 rounded-[4px] focus:outline-none focus:border-zinc-900 bg-white text-zinc-900 transition-colors disabled:opacity-50"
                      placeholder="name@company.com"
                    />
                  </div>
                  
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[12px] font-medium text-zinc-700">Password</label>
                    <input 
                      type="password" 
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                      disabled={isAuthenticating}
                      className="w-full h-10 px-3 text-[13px] border border-zinc-200 rounded-[4px] focus:outline-none focus:border-zinc-900 bg-white text-zinc-900 transition-colors disabled:opacity-50"
                      placeholder="••••••••"
                    />
                  </div>

                  <button 
                    type="submit"
                    disabled={isAuthenticating}
                    className="w-full h-10 mt-2 bg-zinc-900 hover:bg-black text-white text-[13px] font-medium rounded-[4px] transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {isAuthenticating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Authenticating...
                      </>
                    ) : "Sign in"}
                  </button>

                  {/* Forgot password positioned under sign in button */}
                  <div className="text-center pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setForgotEmail(email);
                        setForgotStatus("idle");
                        setForgotMessage("");
                        setShowForgotPassword(true);
                      }}
                      className="text-[12px] font-medium text-zinc-600 hover:text-zinc-900 transition-colors cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  </div>
                </form>

                <div className="mt-8 pt-6 border-t border-zinc-200/80 flex items-center justify-between text-[11px] text-zinc-600">
                  <span>Protected by enterprise-grade encryption</span>
                  <button
                    type="button"
                    onClick={() => setShowSupportContactModal(true)}
                    className="text-zinc-700 hover:text-zinc-950 font-medium transition-colors cursor-pointer"
                  >
                    Contact support
                  </button>
                </div>

                {/* Under all this: Request Demo */}
                <div className="mt-4 pt-2 text-center text-[12px] text-zinc-600">
                  <span>Do not have an account? </span>
                  <button
                    type="button"
                    onClick={() => {
                      setDemoSubmitted(false);
                      setShowDemoModal(true);
                    }}
                    className="font-medium text-zinc-900 hover:underline cursor-pointer"
                  >
                    Request Demo
                  </button>
                </div>
              </motion.div>
            </div>

            {/* Forgot Password Modal */}
            {showForgotPassword && (
              <div className="fixed inset-0 bg-black/40 backdrop-blur-2xs z-50 flex items-center justify-center p-4">
                <div className="w-full max-w-sm bg-white rounded-[6px] border border-zinc-200 p-6 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-[15px] font-semibold text-zinc-900">Reset your password</h3>
                    <button 
                      onClick={() => setShowForgotPassword(false)}
                      className="p-1 text-zinc-400 hover:text-zinc-700 rounded cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-[12px] text-zinc-500 mb-4 leading-relaxed">
                    Enter your email address and we'll send you a secure link to reset your password.
                  </p>

                  {forgotStatus === "success" ? (
                    <div className="space-y-4">
                      <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-[12px] rounded-[4px]">
                        {forgotMessage}
                      </div>
                      <button
                        onClick={() => setShowForgotPassword(false)}
                        className="w-full h-9 bg-zinc-900 hover:bg-black text-white text-[12.5px] font-medium rounded-[4px] transition-colors cursor-pointer"
                      >
                        Back to sign in
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleForgotPassword} className="space-y-3.5">
                      {forgotStatus === "error" && (
                        <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-600 text-[12px] rounded-[4px]">
                          {forgotMessage}
                        </div>
                      )}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[12px] font-medium text-zinc-700">Email address</label>
                        <input
                          type="email"
                          value={forgotEmail}
                          onChange={(e) => setForgotEmail(e.target.value)}
                          required
                          disabled={forgotStatus === "loading"}
                          className="w-full h-9 px-3 text-[13px] border border-zinc-200 rounded-[4px] focus:outline-none focus:border-zinc-900 bg-white"
                          placeholder="name@company.com"
                        />
                      </div>
                      <div className="flex items-center justify-end gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setShowForgotPassword(false)}
                          className="px-3 py-1.5 text-[12px] font-medium text-zinc-600 hover:bg-zinc-100 rounded-[4px] transition-colors cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={forgotStatus === "loading"}
                          className="px-3.5 py-1.5 text-[12px] font-medium bg-zinc-900 hover:bg-black text-white rounded-[4px] transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                        >
                          {forgotStatus === "loading" && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                          Send reset link
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            )}

            {/* Request Demo Modal (2-paned consultation design) */}
            {showDemoModal && (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 md:p-6 overflow-y-auto">
                <div className="w-full max-w-5xl bg-white rounded-xl shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-12 border border-zinc-200">
                  {/* Left Column: Dark Navy Overview */}
                  <div className="md:col-span-5 bg-[#091122] text-white p-6 md:p-8 flex flex-col justify-between">
                    <div>
                      {/* Top 6-dot icon */}
                      <div className="flex items-center gap-1 mb-4">
                        <div className="grid grid-cols-2 gap-1 w-3 h-4">
                          <span className="w-1 h-1 rounded-full bg-zinc-400"></span>
                          <span className="w-1 h-1 rounded-full bg-zinc-400"></span>
                          <span className="w-1 h-1 rounded-full bg-zinc-400"></span>
                          <span className="w-1 h-1 rounded-full bg-zinc-400"></span>
                          <span className="w-1 h-1 rounded-full bg-zinc-400"></span>
                          <span className="w-1 h-1 rounded-full bg-zinc-400"></span>
                        </div>
                      </div>

                      <h2 className="font-serif text-2xl md:text-[28px] font-normal leading-[1.25] text-white tracking-tight mb-3">
                        See InsideMarkets in action
                      </h2>

                      <p className="text-[13px] text-zinc-300 leading-relaxed">
                        Tell us which market, competitors or decisions you're tracking, and we'll show you how InsideMarkets turns scattered signals into sourced, decision-ready intelligence.
                      </p>

                      <div className="my-4.5 border-t border-zinc-800" />

                      <div className="text-[11px] font-bold tracking-[0.14em] text-zinc-400 uppercase mb-3.5">
                        WHAT CAN I EXPECT?
                      </div>

                      <div className="space-y-3 text-[12.5px] text-zinc-200">
                        <div className="flex items-start gap-2.5">
                          <div className="w-4 h-4 rounded bg-emerald-950/80 border border-emerald-500/50 flex items-center justify-center shrink-0 mt-0.5 text-emerald-400">
                            <Check className="w-2.5 h-2.5" />
                          </div>
                          <span className="leading-snug">A 30-minute live walkthrough of the platform</span>
                        </div>

                        <div className="flex items-start gap-2.5">
                          <div className="w-4 h-4 rounded bg-emerald-950/80 border border-emerald-500/50 flex items-center justify-center shrink-0 mt-0.5 text-emerald-400">
                            <Check className="w-2.5 h-2.5" />
                          </div>
                          <span className="leading-snug">Your market or competitors loaded as a working example</span>
                        </div>

                        <div className="flex items-start gap-2.5">
                          <div className="w-4 h-4 rounded bg-emerald-950/80 border border-emerald-500/50 flex items-center justify-center shrink-0 mt-0.5 text-emerald-400">
                            <Check className="w-2.5 h-2.5" />
                          </div>
                          <span className="leading-snug">Ask questions in plain language and see sourced answers</span>
                        </div>

                        <div className="flex items-start gap-2.5">
                          <div className="w-4 h-4 rounded bg-emerald-950/80 border border-emerald-500/50 flex items-center justify-center shrink-0 mt-0.5 text-emerald-400">
                            <Check className="w-2.5 h-2.5" />
                          </div>
                          <span className="leading-snug">Sample reports, dashboards and alerts for your sector</span>
                        </div>

                        <div className="flex items-start gap-2.5">
                          <div className="w-4 h-4 rounded bg-emerald-950/80 border border-emerald-500/50 flex items-center justify-center shrink-0 mt-0.5 text-emerald-400">
                            <Check className="w-2.5 h-2.5" />
                          </div>
                          <span className="leading-snug font-medium text-white">No commitment required</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 pt-3.5 border-t border-zinc-800 text-[12px] text-zinc-400">
                      Already a client?{" "}
                      <button 
                        type="button" 
                        onClick={() => setShowDemoModal(false)}
                        className="text-white underline hover:text-zinc-200 cursor-pointer font-medium"
                      >
                        Log in to your portal
                      </button>
                    </div>
                  </div>

                  {/* Right Column: Form Panel */}
                  <div className="md:col-span-7 bg-white p-6 md:p-8 relative">
                    <button 
                      onClick={() => setShowDemoModal(false)}
                      className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-700 p-1.5 rounded-md hover:bg-zinc-100 transition-colors cursor-pointer"
                      title="Close modal"
                    >
                      <X className="w-5 h-5" />
                    </button>

                    <h3 className="font-serif text-2xl md:text-[28px] font-normal text-zinc-900 mb-4">
                      Book a live demo
                    </h3>

                    {demoSubmitted ? (
                      <div className="py-10 flex flex-col items-center text-center">
                        <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 mb-4">
                          <Check className="w-6 h-6" />
                        </div>
                        <h4 className="font-serif text-2xl font-normal text-zinc-900 mb-2">Thank you!</h4>
                        <p className="text-[13px] text-zinc-600 max-w-md leading-relaxed mb-6">
                          Your demo request has been received. Our InsideMarkets specialist team will contact you shortly to schedule your personalized walkthrough.
                        </p>
                        <button
                          onClick={() => {
                            setDemoSubmitted(false);
                            setShowDemoModal(false);
                          }}
                          className="px-6 py-2.5 bg-black hover:bg-zinc-800 text-white text-[13px] font-medium rounded-[4px] transition-colors cursor-pointer"
                        >
                          Back to Login
                        </button>
                      </div>
                    ) : (
                      <form 
                        onSubmit={(e) => {
                          e.preventDefault();
                          setDemoSubmitted(true);
                        }} 
                        className="space-y-3"
                      >
                        {/* First Name & Last Name */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="flex flex-col gap-1">
                            <label className="text-[12px] font-medium text-zinc-800">
                              First Name <span className="text-rose-500">*</span>
                            </label>
                            <input
                              type="text"
                              required
                              value={demoFirstName}
                              onChange={(e) => setDemoFirstName(e.target.value)}
                              className="w-full h-8.5 px-3 text-[13px] border border-zinc-200 rounded-[4px] focus:outline-none focus:border-zinc-900 bg-white"
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-[12px] font-medium text-zinc-800">
                              Last Name <span className="text-rose-500">*</span>
                            </label>
                            <input
                              type="text"
                              required
                              value={demoLastName}
                              onChange={(e) => setDemoLastName(e.target.value)}
                              className="w-full h-8.5 px-3 text-[13px] border border-zinc-200 rounded-[4px] focus:outline-none focus:border-zinc-900 bg-white"
                            />
                          </div>
                        </div>

                        {/* Business Email & Phone Number */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="flex flex-col gap-1">
                            <label className="text-[12px] font-medium text-zinc-800">
                              Business Email <span className="text-rose-500">*</span>
                            </label>
                            <input
                              type="email"
                              required
                              value={demoEmail}
                              onChange={(e) => setDemoEmail(e.target.value)}
                              className="w-full h-8.5 px-3 text-[13px] border border-zinc-200 rounded-[4px] focus:outline-none focus:border-zinc-900 bg-white"
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-[12px] font-medium text-zinc-800">
                              Phone Number
                            </label>
                            <input
                              type="tel"
                              value={demoPhone}
                              onChange={(e) => setDemoPhone(e.target.value)}
                              className="w-full h-8.5 px-3 text-[13px] border border-zinc-200 rounded-[4px] focus:outline-none focus:border-zinc-900 bg-white"
                            />
                          </div>
                        </div>

                        {/* Company Name & Company Size */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="flex flex-col gap-1">
                            <label className="text-[12px] font-medium text-zinc-800">
                              Company Name
                            </label>
                            <input
                              type="text"
                              value={demoCompany}
                              onChange={(e) => setDemoCompany(e.target.value)}
                              className="w-full h-8.5 px-3 text-[13px] border border-zinc-200 rounded-[4px] focus:outline-none focus:border-zinc-900 bg-white"
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-[12px] font-medium text-zinc-800">
                              Company Size
                            </label>
                            <div className="relative">
                              <select
                                value={demoCompanySize}
                                onChange={(e) => setDemoCompanySize(e.target.value)}
                                className="w-full h-8.5 px-3 text-[13px] border border-zinc-200 rounded-[4px] focus:outline-none focus:border-zinc-900 bg-white appearance-none pr-8 text-zinc-800"
                              >
                                <option value="">Select One</option>
                                <option value="1-10">1 - 10 employees</option>
                                <option value="11-50">11 - 50 employees</option>
                                <option value="51-200">51 - 200 employees</option>
                                <option value="201-500">201 - 500 employees</option>
                                <option value="501-1000">501 - 1,000 employees</option>
                                <option value="1000+">1,000+ employees</option>
                              </select>
                              <ChevronDown className="w-4 h-4 text-zinc-400 absolute right-2.5 top-2.5 pointer-events-none" />
                            </div>
                          </div>
                        </div>

                        {/* Country & Agency Affiliation */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="flex flex-col gap-1">
                            <label className="text-[12px] font-medium text-zinc-800">
                              Country
                            </label>
                            <div className="relative">
                              <select
                                value={demoCountry}
                                onChange={(e) => setDemoCountry(e.target.value)}
                                className="w-full h-8.5 px-3 text-[13px] border border-zinc-200 rounded-[4px] focus:outline-none focus:border-zinc-900 bg-white appearance-none pr-8 text-zinc-800"
                              >
                                <option value="">Select One</option>
                                <option value="United States">United States</option>
                                <option value="United Kingdom">United Kingdom</option>
                                <option value="Singapore">Singapore</option>
                                <option value="Australia">Australia</option>
                                <option value="Canada">Canada</option>
                                <option value="Germany">Germany</option>
                                <option value="Switzerland">Switzerland</option>
                                <option value="France">France</option>
                                <option value="United Arab Emirates">United Arab Emirates</option>
                                <option value="Hong Kong">Hong Kong</option>
                                <option value="India">India</option>
                                <option value="Other">Other</option>
                              </select>
                              <ChevronDown className="w-4 h-4 text-zinc-400 absolute right-2.5 top-2.5 pointer-events-none" />
                            </div>
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-[12px] font-medium text-zinc-800 truncate" title="Do you work at a consulting or marketing agency?">
                              Agency Affiliation
                            </label>
                            <div className="flex items-center gap-5 h-8.5 text-[13px] text-zinc-800">
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="radio"
                                  name="demoAgency"
                                  checked={demoIsAgency === "yes"}
                                  onChange={() => setDemoIsAgency("yes")}
                                  className="text-zinc-900 focus:ring-zinc-900"
                                />
                                <span>Yes</span>
                              </label>
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="radio"
                                  name="demoAgency"
                                  checked={demoIsAgency === "no"}
                                  onChange={() => setDemoIsAgency("no")}
                                  className="text-zinc-900 focus:ring-zinc-900"
                                />
                                <span>No</span>
                              </label>
                            </div>
                          </div>
                        </div>

                        {/* Notes / Focus Areas */}
                        <div className="flex flex-col gap-1">
                          <label className="text-[12px] font-medium text-zinc-800">
                            Notes / Focus Areas
                          </label>
                          <textarea
                            rows={2}
                            value={demoNotes}
                            onChange={(e) => setDemoNotes(e.target.value)}
                            placeholder="Tell us what you'd like to see in your walkthrough..."
                            className="w-full p-2.5 text-[13px] border border-zinc-200 rounded-[4px] focus:outline-none focus:border-zinc-900 bg-white resize-none"
                          />
                        </div>

                        {/* Agreement Checkbox */}
                        <div className="flex items-start gap-2.5 pt-0.5">
                          <input
                            type="checkbox"
                            id="demoAgreeCheckbox"
                            checked={demoAgree}
                            onChange={(e) => setDemoAgree(e.target.checked)}
                            className="mt-0.5 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900 cursor-pointer"
                          />
                          <label htmlFor="demoAgreeCheckbox" className="text-[11.5px] text-zinc-600 leading-snug cursor-pointer select-none">
                            I agree to receive communications and intelligence updates from InsideMarkets. You can unsubscribe at any time.
                          </label>
                        </div>

                        {/* Submit Button */}
                        <button
                          type="submit"
                          className="w-full h-10 bg-black hover:bg-zinc-800 text-white text-[13px] font-medium rounded-[4px] transition-colors flex items-center justify-center gap-2 cursor-pointer mt-1"
                        >
                          <span>Request Demo</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Support Contact Modal */}
            {showSupportContactModal && (
              <div className="fixed inset-0 bg-black/40 backdrop-blur-2xs z-50 flex items-center justify-center p-4">
                <div className="w-full max-w-sm bg-white rounded-[6px] border border-zinc-200 p-6 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-[15px] font-semibold text-zinc-900">Contact Support</h3>
                    <button 
                      onClick={() => setShowSupportContactModal(false)}
                      className="p-1 text-zinc-400 hover:text-zinc-700 rounded cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-[12px] text-zinc-600 mb-4 leading-relaxed">
                    Need assistance accessing your workspace or managing your enterprise credentials?
                  </p>
                  <div className="space-y-2.5 text-[12.5px] bg-zinc-50 p-3.5 rounded-[4px] border border-zinc-200 mb-4">
                    <div>
                      <span className="text-zinc-500 text-[11px] block uppercase tracking-wider font-medium">Enterprise Desk</span>
                      <a href="mailto:support@knometrix.com" className="text-zinc-900 font-medium hover:underline">
                        support@knometrix.com
                      </a>
                    </div>
                    <div>
                      <span className="text-zinc-500 text-[11px] block uppercase tracking-wider font-medium">Availability</span>
                      <span className="text-zinc-700">24/7 Priority Support Coverage</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowSupportContactModal(false)}
                    className="w-full h-9 bg-zinc-900 hover:bg-black text-white text-[12.5px] font-medium rounded-[4px] transition-colors cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
          )
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 3 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            id="app-container"
            className="w-full h-full flex overflow-hidden bg-zinc-100 select-text"
          >
            {/* 1. Left Vertical Sidebar Rail */}
            <LeftMenubar
              activeTab={activeTab}
              onTabChange={setActiveTab}
              onLogout={handleLogout}
              userInitials={userInitials}
              userName={userName}
            />

            {/* 2. Content Region: Document Intelligence and Integrated AI Chat in 2-Pane Split */}
            <div id="central-split-viewport" className="flex-1 h-full flex overflow-hidden">
              {/* Render selected workspace views */}
              {renderWorkspaceContent()}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
