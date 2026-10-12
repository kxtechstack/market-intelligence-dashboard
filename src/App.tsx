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
import MyBookmarksPane from "./components/MyBookmarksPane";
import SettingsPane from "./components/SettingsPane";
import SupportPane from "./components/SupportPane";
import SetPasswordPane from "./components/SetPasswordPane";
import WorkspaceConfigPane from "./components/WorkspaceConfigPane";
import { AlertItem, ChatMessage } from "./types";
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
  Bookmark 
} from "lucide-react";

interface TopMenuBarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isLoggedIn?: boolean;
}

function TopMenuBar({ activeTab, onTabChange, isLoggedIn }: TopMenuBarProps) {
  const [openDropdown, setOpenDropdown] = useState<"resources" | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    try {
      return localStorage.getItem("app_dark_mode") === "true";
    } catch {
      return false;
    }
  });
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [showDocsModal, setShowDocsModal] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [moduleCounts, setModuleCounts] = useState<Record<string, number>>({
    policy_risk_monitor: 6310,
    market_dynamics: 10272,
    foreward_outlook: 5680,
    decision_intelligence: 180,
    find_opportunities: 1420,
    competitive_radar: 840,
    voice_of_customer: 2150,
    my_bookmarks: 0,
  });

  useEffect(() => {
    async function loadCounts() {
      try {
        const [policyRes, marketRes, trendRes, bookmarksRes] = await Promise.all([
          supabase.from("policy_signals").select("id", { count: "exact", head: true }),
          supabase.from("market_dynamics_signals").select("id", { count: "exact", head: true }),
          supabase.from("trend_signals").select("id", { count: "exact", head: true }),
          supabase.from("bookmarks").select("id", { count: "exact", head: true }),
        ]);

        setModuleCounts((prev) => ({
          ...prev,
          policy_risk_monitor: policyRes.count ?? prev.policy_risk_monitor,
          market_dynamics: marketRes.count ?? prev.market_dynamics,
          foreward_outlook: trendRes.count ?? prev.foreward_outlook,
          my_bookmarks: bookmarksRes.count ?? prev.my_bookmarks,
        }));
      } catch (err) {
        console.error("Failed to load module counts", err);
      }
    }
    loadCounts();
  }, []);

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
      defaultCount: 180,
      unit: "reports",
    },
    {
      id: "market_dynamics",
      label: "Market Dynamics",
      desc: "Real-time industry movements, trends & competitive forces",
      icon: TrendingUp,
      countKey: "market_dynamics",
      defaultCount: 10272,
      unit: "signals",
    },
    {
      id: "policy_risk_monitor",
      label: "Policy & Risk Monitor",
      desc: "Prudential regulatory consultations & compliance intelligence",
      icon: ShieldAlert,
      countKey: "policy_risk_monitor",
      defaultCount: 6310,
      unit: "signals",
    },
    {
      id: "foreward_outlook",
      label: "Forward Outlook",
      desc: "Horizon-scanning signals and scenario forecasting",
      icon: Compass,
      countKey: "foreward_outlook",
      defaultCount: 5680,
      unit: "signals",
    },
    {
      id: "find_opportunities",
      label: "Find Opportunities",
      desc: "Market disruption scans and growth vectors",
      icon: Search,
      countKey: "find_opportunities",
      defaultCount: 1420,
      unit: "signals",
    },
    {
      id: "competitive_radar",
      label: "Competitive Radar",
      desc: "Peer group telemetry and strategic shifts",
      icon: Radar,
      countKey: "competitive_radar",
      defaultCount: 840,
      unit: "signals",
    },
    {
      id: "voice_of_customer",
      label: "Voice of Customer",
      desc: "Customer sentiment, pain points and feedback trends",
      icon: MessageSquare,
      countKey: "voice_of_customer",
      defaultCount: 2150,
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
        onClick={() => onTabChange("decision_intelligence")} 
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
            style={{ color: "#171717", fontWeight: 500, fontStyle: "normal", fontSize: "14px" }}
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
          onClick={() => onTabChange("support")}
          style={{ color: "#171717", fontWeight: 500, fontStyle: "normal", fontSize: "14px" }}
          className={`px-2.5 py-1.5 rounded-[6px] transition-colors cursor-pointer ${
            activeTab === "support"
              ? "bg-[#f5f3ff]"
              : "hover:bg-zinc-100/70"
          }`}
        >
          Support
        </button>

        {/* Search */}
        <button
          onClick={() => setShowSearchModal(true)}
          style={{ color: "#171717", fontWeight: 500, fontStyle: "normal", fontSize: "14px" }}
          className="flex items-center gap-1.5 px-2.5 py-1.5 hover:bg-zinc-100/70 rounded-[6px] transition-colors cursor-pointer"
          title="Search modules (⌘K)"
        >
          <Search className="w-3.5 h-3.5 text-[#171717]" />
          <span>Search</span>
          <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono text-zinc-400 bg-zinc-100 rounded border border-zinc-200/80">
            ⌘K
          </span>
        </button>

        {/* Credit Usage 180/10000 */}
        <div 
          onClick={() => setShowPricingModal(true)}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] bg-zinc-100/80 border border-zinc-200/80 text-[12px] font-medium text-zinc-600 shadow-2xs cursor-pointer hover:bg-zinc-100 transition-colors"
          title="Click to view subscription quota details"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
          <span>Credit Usage</span>
          <span className="font-semibold text-zinc-900">180/10000</span>
        </div>

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
          <div className="w-full max-w-xl bg-white rounded-[8px] border border-zinc-200 shadow-2xl overflow-hidden animate-in fade-in duration-150 flex flex-col">
            {/* Search Input Bar */}
            <div className="flex items-center px-3.5 border-b border-zinc-200 py-3 bg-white">
              <Search className="w-4 h-4 text-zinc-400 mr-2.5 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search modules, workspaces and signals..."
                autoFocus
                className="w-full text-[13.5px] bg-transparent outline-none text-zinc-900 placeholder:text-zinc-400"
              />
              <button 
                onClick={() => setShowSearchModal(false)} 
                className="p-1 text-zinc-400 hover:text-zinc-700 rounded cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modules List with Counts */}
            <div className="p-2 max-h-[380px] overflow-y-auto">
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
                              ? "bg-violet-100/70 border-violet-200 text-[#7c3aed]"
                              : "bg-zinc-100 border-zinc-200/80 text-zinc-600 group-hover:text-zinc-900 group-hover:border-zinc-300"
                          }`}>
                            <IconComponent className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-zinc-900 text-[13px]">{m.label}</span>
                              {isActive && (
                                <span className="text-[10px] font-medium bg-[#f5f3ff] text-[#7c3aed] px-1.5 py-0.5 rounded border border-violet-200/60">
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
                          <ArrowUpRight className="w-3.5 h-3.5 text-zinc-400 group-hover:text-[#7c3aed] transition-colors" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-3.5 py-2 bg-zinc-50 border-t border-zinc-100 flex items-center justify-between text-[11px] text-zinc-400">
              <span>Select a module to switch workspace</span>
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
                  <span className="font-semibold text-zinc-900">180 / 10,000 used</span>
                </div>
                <div className="w-full h-2 bg-zinc-200 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: "1.8%" }}></div>
                </div>
                <div className="flex justify-between text-[11px] text-zinc-400 mt-2">
                  <span>9,820 credits remaining</span>
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
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  const VALID_TABS = [
    "policy_risk_monitor", "market_dynamics", "foreward_outlook", 
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
    return "decision_intelligence";
  });

  useEffect(() => {
    try {
      localStorage.setItem("app_active_tab", activeTab);
    } catch (e) {
      console.error("Failed to save activeTab to localStorage", e);
    }
  }, [activeTab]);

  const [navigatedItemId, setNavigatedItemId] = useState<string | null>(null);

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
  const [isRecoveryFlow, setIsRecoveryFlow] = useState(() => window.location.hash.includes('access_token'));

  useEffect(() => {
    const initializeAuth = async () => {
      setAuthLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session && !isRecoveryFlow) {
          const userEmail = session.user.email;
          if (userEmail) {
            // Look up client_id and id in admin.client_users
            const { data: userData, error: userError } = await supabase
              .schema('admin')
              .from('client_users')
              .select('id, client_id')
              .eq('email', userEmail.toLowerCase())
              .single();

            if (userError || !userData?.client_id) {
              console.error("Session restore: client lookup failed", userError);
              await supabase.auth.signOut();
            } else {
              // Fetch client industry from admin.clients
              const { data: clientData, error: clientError } = await supabase
                .schema('admin')
                .from('clients')
                .select('industry')
                .eq('id', userData.client_id)
                .single();

              setUserId(userData.id);
              setClientId(userData.client_id);
              setIndustry(clientData?.industry || "Retail");
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
        .select('id, client_id')
        .eq('email', email.toLowerCase())
        .single();

      if (userError) {
        console.error("Client lookup error:", userError);
        throw new Error("User associated client not found. Please contact support.");
      }

      if (!userData?.client_id) {
        throw new Error("No client assigned to this account.");
      }

      // 3. Fetch client industry from admin.clients
      const { data: clientData, error: clientError } = await supabase
        .schema('admin')
        .from('clients')
        .select('industry')
        .eq('id', userData.client_id)
        .single();

      if (clientError) {
        console.error("Client industry fetch error:", clientError);
      }

      setUserId(userData.id);
      setClientId(userData.client_id);
      setIndustry(clientData?.industry || "Retail");
      setActiveTab("decision_intelligence");
      setIsLoggedIn(true);
    } catch (err: any) {
      setLoginError(err.message || "An unexpected error occurred during login.");
      setIsLoggedIn(false);
    } finally {
      setIsAuthenticating(false);
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
    setActiveTab("decision_intelligence");
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
          />
        </div>

        {/* Transient / Light Panes */}
        {activeTab === "latest" && <LatestPane onReturn={handleReturn} />}
        {activeTab === "find_opportunities" && <FindOpportunitiesPane onReturn={handleReturn} />}
        {activeTab === "competitive_radar" && <CompetitiveRadarPane onReturn={handleReturn} />}
        {activeTab === "voice_of_customer" && <VoiceOfCustomerPane onReturn={handleReturn} />}
        
        <div className={activeTab === "decision_intelligence" ? "flex-1 flex flex-col overflow-hidden" : "hidden"}>
          <DecisionIntelligencePane 
            onReturn={handleReturn}
            onTabChange={(tabId, signalId) => {
              setActiveTab(tabId);
              if (signalId) {
                setNavigatedItemId(signalId);
              }
            }}
            clientId={clientId || ""}
            industry={industry || ""}
            userId={userId || ""}
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
        {!["policy_risk_monitor", "market_dynamics", "foreward_outlook", "latest", "find_opportunities", "competitive_radar", "voice_of_customer", "decision_intelligence", "my_bookmarks", "support", "settings"].includes(activeTab) && (
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
      />

      <div className="flex-1 w-full flex overflow-hidden">
        {!isLoggedIn ? (
          <div className="w-full h-full flex items-center justify-center bg-zinc-50 select-text">
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-sm bg-white p-8 border border-zinc-200 rounded-[4px] shadow-sm flex flex-col items-center"
            >
              <div className="w-10 h-10 bg-zinc-900 rounded-[4px] flex items-center justify-center mb-6">
                <ShieldAlert className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl font-semibold tracking-tight text-zinc-900 mb-6">Welcome Back</h2>
              
              <form 
                onSubmit={handleLogin}
                className="w-full flex flex-col gap-4"
              >
                {loginError && (
                  <div className="w-full p-3 bg-rose-50 border border-rose-100 rounded-[4px] text-rose-600 text-[12px] leading-relaxed">
                    {loginError}
                  </div>
                )}
                
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-medium text-zinc-700">Email</label>
                  <input 
                    type="email" 
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    disabled={isAuthenticating}
                    className="w-full h-10 px-3 text-[13px] border border-zinc-200 rounded-[4px] focus:outline-none focus:border-[#7c3aed] focus:ring-1 focus:ring-[#7c3aed]/20 transition-all disabled:opacity-50"
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
                    className="w-full h-10 px-3 text-[13px] border border-zinc-200 rounded-[4px] focus:outline-none focus:border-[#7c3aed] focus:ring-1 focus:ring-[#7c3aed]/20 transition-all disabled:opacity-50"
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
                  ) : "Login"}
                </button>
              </form>
            </motion.div>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 3 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            id="app-container"
            className="w-full h-full flex overflow-hidden bg-zinc-100 select-text"
          >
            {/* 1. Left Vertical Sidebar Rail */}
            <LeftMenubar activeTab={activeTab} onTabChange={setActiveTab} onLogout={handleLogout} />

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
