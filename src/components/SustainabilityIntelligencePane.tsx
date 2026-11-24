import React, { useState, useMemo, useRef, useEffect } from "react";
import { 
  Search, 
  Bookmark, 
  ExternalLink, 
  ChevronDown, 
  Check, 
  X, 
  Plus, 
  Minus,
  Pencil, 
  Trash2, 
  ArrowUpDown, 
  Calendar, 
  Shield, 
  FileText,
  Sparkles,
  AlertTriangle,
  Leaf,
  Filter,
  Info,
  CornerDownRight,
  ArrowUpRight
} from "lucide-react";
import NoteModal from "./NoteModal";

interface SustainabilityIntelligencePaneProps {
  onReturn?: () => void;
  clientId?: string;
  industry?: string;
  userId?: string;
  onSwitchToDecisionIntelligence?: (query: string, tab: string, label: string, returnLabel: string) => void;
}

export interface SustainabilitySignal {
  id: string;
  signal_title: string;
  category: string;
  summary: string;
  impact_level: "Critical" | "High" | "Medium" | "Low";
  source_published_date: string;
  source: string;
  source_article_url?: string;
  source_type?: string;
  country?: string;
  business_impact: string[];
  similar_movements?: { id: string; title: string }[];
}

const TAGS = [
  "All",
  "Climate & Emissions",
  "Energy Transition",
  "Water Management",
  "Waste Management",
  "Biodiversity & Nature",
  "Sustainable Supply Chains",
  "Workforce Sustainability",
  "Social Impact",
  "Sustainable Innovation",
  "Green Investments",
  "ESG Governance"
];

const INITIAL_SIGNALS: SustainabilitySignal[] = [
  {
    id: "sust-101",
    signal_title: "SEC Finalizes Mandatory Scope 1 & Scope 2 Greenhouse Gas Emission Disclosure Mandates",
    category: "Climate & Emissions",
    summary: "The Securities and Exchange Commission has enacted finalized rules mandating standardized disclosures for direct Scope 1 and Scope 2 emissions for large accelerated filers, requiring third-party verification and auditable climate risk reporting.",
    impact_level: "Critical",
    source_published_date: "2026-11-12",
    source: "Federal Register / SEC Notice",
    source_article_url: "https://sec.gov",
    source_type: "Regulatory Mandate",
    country: "United States",
    business_impact: [
      "Accelerated requirement for third-party greenhouse gas telemetry verification across core operational facilities.",
      "Potential compliance risk exposure for non-standardized Scope 1 emissions accounting.",
      "Increased reporting overhead for cross-border enterprise filers."
    ],
    similar_movements: [
      { id: "sust-102", title: "California SB 253 Climate Corporate Data Accountability Act Enforcement" },
      { id: "sust-103", title: "Corporate Sustainability Reporting Directive (CSRD) Scope 2 Verification Rules" }
    ]
  },
  {
    id: "sust-102",
    signal_title: "EU Taxonomy Expansion Enforces 30% Capex Allocation Toward Clean Energy Grid Storage",
    category: "Energy Transition",
    summary: "New European Union climate taxonomy guidelines require industrial conglomerates to allocate a minimum of 30% capital expenditure toward renewable power purchase agreements (PPAs) and grid-connected battery storage infrastructure by 2028.",
    impact_level: "High",
    source_published_date: "2026-11-12",
    source: "European Commission Energy Directive",
    source_article_url: "https://europa.eu",
    source_type: "EU Framework Directive",
    country: "European Union",
    business_impact: [
      "Necessitates structural shifts in corporate power procurement contracts toward long-term PPAs.",
      "Capital expenditure re-alignment to meet EU green finance taxonomy thresholds.",
      "Enhanced eligibility for sustainability-linked corporate debt issuance."
    ],
    similar_movements: [
      { id: "sust-104", title: "UK Electricity Market Reform Directive for Commercial Battery Storage" }
    ]
  },
  {
    id: "sust-103",
    signal_title: "Global Water Stewardship Standard Adopted Across High-Stress Industrial Manufacturing Basins",
    category: "Water Management",
    summary: "International water governance boards have issued unified stewardship criteria targeting zero liquid discharge (ZLD) in manufacturing facilities operating in water-stressed geographic basins.",
    impact_level: "Medium",
    source_published_date: "2026-11-12",
    source: "Alliance for Water Stewardship",
    source_article_url: "https://a4ws.org",
    source_type: "International Standard",
    country: "Global",
    business_impact: [
      "Mandates localized water footprint audits for supply chain manufacturing partners.",
      "Operational adjustments for facilities in designated high-stress hydrological zones."
    ],
    similar_movements: [
      { id: "sust-105", title: "EPA Industrial Wastewater Recycling Performance Benchmarks" }
    ]
  },
  {
    id: "sust-104",
    signal_title: "Extended Producer Responsibility (EPR) Directive Imposes Mandatory 80% Recycled Packaging Content",
    category: "Waste Management",
    summary: "New extended producer responsibility legislation shifts end-of-life disposal liability onto consumer packaged goods brands, requiring 80% post-consumer recycled content in secondary packaging by 2027.",
    impact_level: "High",
    source_published_date: "2026-11-11",
    source: "Environmental Protection Agency Notice",
    source_article_url: "https://epa.gov",
    source_type: "Statutory Directive",
    country: "United States",
    business_impact: [
      "Direct cost impact on product packaging bill of materials (BOM).",
      "Requires rapid qualification of bio-based and post-consumer recycled resin suppliers."
    ],
    similar_movements: [
      { id: "sust-106", title: "EU Single-Use Plastics & Packaging Waste Regulation (PPWR)" }
    ]
  },
  {
    id: "sust-105",
    signal_title: "Taskforce on Nature-related Financial Disclosures (TNFD) Releases Corporate Reporting Benchmarks",
    category: "Biodiversity & Nature",
    summary: "TNFD framework guidelines establish standardized metrics for corporate impact on critical ecosystems, deforestation-free supply chains, and biodiversity preservation.",
    impact_level: "Medium",
    source_published_date: "2026-11-11",
    source: "TNFD Secretariat Framework",
    source_article_url: "https://tnfd.global",
    source_type: "Disclosure Standard",
    country: "Global",
    business_impact: [
      "Requires satellite and geospatial auditing of primary commodity sourcing locations.",
      "Increased investor scrutiny on raw material deforestation footprint."
    ],
    similar_movements: [
      { id: "sust-107", title: "EU Deforestation Regulation (EUDR) Traceability Mandates" }
    ]
  },
  {
    id: "sust-106",
    signal_title: "Scope 3 Supply Chain Decarbonization Mandate Enacted for Global Retail & Manufacturing Sectors",
    category: "Sustainable Supply Chains",
    summary: "International retail coalitions have adopted binding Scope 3 reduction milestones, requiring tier-1 and tier-2 suppliers to publish verified carbon reduction targets or face vendor delisting.",
    impact_level: "Critical",
    source_published_date: "2026-11-11",
    source: "Global Retail Sustainability Alliance",
    source_article_url: "https://grsa.org",
    source_type: "Industry Compact",
    country: "Global",
    business_impact: [
      "Mandatory vendor code of conduct updates with binding carbon intensity limits.",
      "Vendor audit risk for non-compliant contract manufacturing partners."
    ],
    similar_movements: [
      { id: "sust-108", title: "SBTi Corporate Net-Zero Supply Chain Standard" }
    ]
  },
  {
    id: "sust-107",
    signal_title: "Equitable Workforce Telemetry Standard Enforces Health, Safety & Fair Labor Governance",
    category: "Workforce Sustainability",
    summary: "Prudential labor governance guidelines enforce auditable worker health, safety, and living wage compliance telemetry across international manufacturing hubs.",
    impact_level: "Medium",
    source_published_date: "2026-11-10",
    source: "International Labour Organization",
    source_article_url: "https://ilo.org",
    source_type: "Governance Standard",
    country: "Global",
    business_impact: [
      "Enhanced social compliance reporting across global manufacturing sites.",
      "Improved workforce retention and risk mitigation for international labor audits."
    ],
    similar_movements: [
      { id: "sust-109", title: "German Supply Chain Due Diligence Act (LkSG) Social Compliance" }
    ]
  },
  {
    id: "sust-108",
    signal_title: "Just Transition Community Investment Charter Mandates Local Infrastructure Reinvestment",
    category: "Social Impact",
    summary: "State and regional energy transition boards mandate that 15% of project capital for green infrastructure be deployed into affected local community development and workforce retraining programs.",
    impact_level: "Medium",
    source_published_date: "2026-11-10",
    source: "Department of Energy Policy Notice",
    source_article_url: "https://energy.gov",
    source_type: "Policy Directive",
    country: "United States",
    business_impact: [
      "Incorporation of community benefit agreements (CBAs) into capital project planning.",
      "Strengthened stakeholder alignment for clean technology site permitting."
    ]
  },
  {
    id: "sust-109",
    signal_title: "Patent Office Enacts Fast-Track Review Program for Carbon Capture & Cleantech Innovations",
    category: "Sustainable Innovation",
    summary: "Patent authorities have introduced prioritized examination protocols for novel carbon capture, hydrogen electrolysis, and circular material technological patents to accelerate commercial adoption.",
    impact_level: "High",
    source_published_date: "2026-11-09",
    source: "USPTO Climate Innovation Guidance",
    source_article_url: "https://uspto.gov",
    source_type: "Administrative Rule",
    country: "United States",
    business_impact: [
      "Accelerated intellectual property protection timeline for R&D sustainability innovations.",
      "Shortened time-to-market for proprietary clean technology solutions."
    ]
  },
  {
    id: "sust-110",
    signal_title: "Green Bond Framework Standard Drives $1.2 Trillion Capital Flow to Sustainable Capital Projects",
    category: "Green Investments",
    summary: "Institutional debt markets report record capital allocation into ESG-aligned green bonds, with strict coupon penalty mechanisms tied to verified sustainability KPI achievement.",
    impact_level: "High",
    source_published_date: "2026-11-09",
    source: "Climate Bonds Initiative",
    source_article_url: "https://climatebonds.net",
    source_type: "Capital Markets Standard",
    country: "Global",
    business_impact: [
      "Lower cost of capital for enterprise sustainability projects backed by certified green bonds.",
      "Strict covenant penalty risks if ESG targets are missed."
    ]
  },
  {
    id: "sust-111",
    signal_title: "Global Corporate Governance Code Integrates Board-Level Climate Competency Requirements",
    category: "ESG Governance",
    summary: "Major stock exchanges have updated listing requirements, mandating documented climate risk expertise at the board director level and explicit tying of executive compensation to ESG targets.",
    impact_level: "Critical",
    source_published_date: "2026-11-08",
    source: "International Governance Network",
    source_article_url: "https://icgn.org",
    source_type: "Listing Standard",
    country: "Global",
    business_impact: [
      "Requires board committee restructuring to establish dedicated sustainability oversight.",
      "Executive bonus compensation restructuring to include auditable carbon targets."
    ]
  }
];

export default function SustainabilityIntelligencePane({
  clientId,
  userId,
  onReturn,
  onSwitchToDecisionIntelligence
}: SustainabilityIntelligencePaneProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>(["All"]);
  const [impactFilter, setImpactFilter] = useState<"All" | "Critical" | "High" | "Medium" | "Low">("All");
  const [selectedSignal, setSelectedSignal] = useState<SustainabilitySignal | null>(null);
  
  // Filter panel state
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>("All time");

  // Bookmarks & Notes state
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [hiddenIds, setHiddenIds] = useState<Record<string, boolean>>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Load saved notes & bookmarks from localStorage
  useEffect(() => {
    try {
      const savedNotesStr = localStorage.getItem("sustainability_notes");
      if (savedNotesStr) setNotes(JSON.parse(savedNotesStr));
      
      const savedBookmarksStr = localStorage.getItem("sustainability_bookmarks");
      if (savedBookmarksStr) setBookmarkedIds(new Set(JSON.parse(savedBookmarksStr)));
    } catch (e) {
      console.warn("Error reading sustainability state from localStorage", e);
    }
  }, []);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(prev => (prev === msg ? null : prev));
    }, 2500);
  };

  const handleSaveNote = (htmlContent: string) => {
    if (!selectedSignal) return;
    const updatedNotes = { ...notes, [selectedSignal.id]: htmlContent };
    setNotes(updatedNotes);
    try {
      localStorage.setItem("sustainability_notes", JSON.stringify(updatedNotes));
    } catch (e) {
      console.warn("Error saving notes", e);
    }
    
    // Toggle bookmark on save if not already set
    if (!bookmarkedIds.has(selectedSignal.id)) {
      const nextSet = new Set(bookmarkedIds);
      nextSet.add(selectedSignal.id);
      setBookmarkedIds(nextSet);
      try {
        localStorage.setItem("sustainability_bookmarks", JSON.stringify(Array.from(nextSet)));
      } catch (e) {
        console.warn("Error saving bookmarks", e);
      }
    }
    triggerToast(`Note saved for ${selectedSignal.signal_title}`);
  };

  const handleCategoryToggle = (cat: string) => {
    if (cat === "All") {
      setSelectedCategories(["All"]);
    } else {
      setSelectedCategories(prev => {
        const withoutAll = prev.filter(c => c !== "All");
        if (withoutAll.includes(cat)) {
          const next = withoutAll.filter(c => c !== cat);
          return next.length === 0 ? ["All"] : next;
        } else {
          return [...withoutAll, cat];
        }
      });
    }
  };

  // Filter signals
  const filteredSignals = useMemo(() => {
    let cutoffDateStr: string | null = null;
    if (selectedTimeframe !== "All time") {
      const match = selectedTimeframe.match(/\d+/);
      if (match) {
        const days = parseInt(match[0], 10);
        if (!isNaN(days) && days > 0) {
          const d = new Date();
          d.setUTCDate(d.getUTCDate() - days);
          cutoffDateStr = d.toISOString().split("T")[0];
        }
      }
    }

    return INITIAL_SIGNALS.filter(sig => {
      if (hiddenIds[sig.id]) return false;

      // Tag filter
      const matchCategory = 
        selectedCategories.includes("All") || 
        selectedCategories.some(c => c.toLowerCase() === sig.category.toLowerCase());

      // Search filter
      const q = searchQuery.trim().toLowerCase();
      const matchSearch = 
        !q || 
        sig.signal_title.toLowerCase().includes(q) ||
        sig.summary.toLowerCase().includes(q) ||
        sig.category.toLowerCase().includes(q);

      // Impact filter
      const matchImpact = impactFilter === "All" || sig.impact_level === impactFilter;

      // Timeframe filter
      const matchDate = !cutoffDateStr || sig.source_published_date >= cutoffDateStr;

      return matchCategory && matchSearch && matchImpact && matchDate;
    });
  }, [searchQuery, selectedCategories, impactFilter, selectedTimeframe, hiddenIds]);

  const formatDateToHeader = (dateStr?: string) => {
    if (!dateStr) return "RECENT SIGNALS";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "RECENT SIGNALS";
    const today = new Date();
    const diffDays = Math.floor((today.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
    const formatted = d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }).toUpperCase();
    if (diffDays === 0) return `TODAY • ${formatted}`;
    if (diffDays === 1) return `YESTERDAY • ${formatted}`;
    return formatted;
  };

  const { groupedSignals, orderedGroupDates } = useMemo(() => {
    const groups: Record<string, SustainabilitySignal[]> = {};
    const dates: string[] = [];

    filteredSignals.forEach(sig => {
      const dateKey = formatDateToHeader(sig.source_published_date);
      if (!groups[dateKey]) {
        groups[dateKey] = [];
        dates.push(dateKey);
      }
      groups[dateKey].push(sig);
    });

    return { groupedSignals: groups, orderedGroupDates: dates };
  }, [filteredSignals]);

  const [expandedDates, setExpandedDates] = useState<Record<string, boolean>>({});

  const toggleDateGroup = (dateGroup: string, gIdx: number) => {
    setExpandedDates(prev => {
      const current = prev[dateGroup] !== undefined ? prev[dateGroup] : gIdx === 0;
      return { ...prev, [dateGroup]: !current };
    });
  };

  const getAlertImpactScore = (impact: string): number => {
    const imp = (impact || "").toLowerCase();
    if (imp === "critical") return 4;
    if (imp === "high") return 3;
    if (imp === "medium") return 2;
    if (imp === "low") return 1;
    return 0;
  };

  const getUnifiedImpactBarClass = (sig: SustainabilitySignal, index: number) => {
    const score = getAlertImpactScore(sig.impact_level);
    if (index >= score) return "bg-zinc-200/80";

    switch (sig.impact_level) {
      case "Critical": return "bg-rose-500";
      case "High": return "bg-amber-500";
      case "Medium": return "bg-blue-500";
      case "Low": return "bg-emerald-500";
      default: return "bg-zinc-400";
    }
  };

  const getCategoryTagColor = (category: string) => {
    switch ((category || "").trim()) {
      case "Climate & Emissions": return "emerald";
      case "Energy Transition": return "amber";
      case "Water Management": return "cyan";
      case "Waste Management": return "orange";
      case "Biodiversity & Nature": return "green";
      case "Sustainable Supply Chains": return "blue";
      case "Workforce Sustainability": return "indigo";
      case "Social Impact": return "violet";
      case "Sustainable Innovation": return "purple";
      case "Green Investments": return "teal";
      case "ESG Governance": return "slate";
      default: return "blue";
    }
  };

  const getTagStyles = (tagColor: string) => {
    switch (tagColor) {
      case "rose": return "bg-[#fff0f0] border border-[#fecaca] text-[#821c1c]";
      case "amber": return "bg-[#fffbeb] border border-[#fde68a] text-[#78350f]";
      case "blue": return "bg-[#e0f2fe] border border-[#bae6fd] text-[#0369a1]";
      case "emerald": return "bg-emerald-50 border border-emerald-200 text-emerald-800";
      case "violet": return "bg-violet-50 border border-violet-200 text-violet-800";
      case "indigo": return "bg-indigo-50 border border-indigo-200 text-indigo-800";
      case "cyan": return "bg-cyan-50 border border-cyan-200 text-cyan-800";
      case "sky": return "bg-sky-50 border border-sky-200 text-sky-800";
      case "orange": return "bg-orange-50 border border-orange-200 text-orange-800";
      case "purple": return "bg-purple-50 border border-purple-200 text-purple-800";
      case "teal": return "bg-teal-50 border border-teal-200 text-teal-800";
      case "yellow": return "bg-yellow-50 border border-yellow-200 text-yellow-800";
      case "slate": return "bg-slate-50 border border-slate-200 text-slate-800";
      case "green": return "bg-green-50 border border-green-200 text-green-800";
      default: return "bg-zinc-100 border border-zinc-200 text-zinc-650";
    }
  };

  const hasActiveFilters = 
    searchQuery.trim() !== "" || 
    impactFilter !== "All" || 
    selectedTimeframe !== "All time" || 
    (selectedCategories.length > 0 && !(selectedCategories.length === 1 && selectedCategories[0] === "All"));

  return (
    <div id="sustainability-intelligence-dashboard" className="flex-1 h-full flex bg-white overflow-hidden relative justify-center">
      
      {/* Toast notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[200] bg-zinc-900 text-white px-4 py-2.5 rounded-[6px] text-xs font-sans shadow-xl border border-zinc-800 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Roadmap & Intelligence Column (matching Policy & Risk Monitor) */}
      <div id="sustainability-roadmap-column" className="w-full max-w-[1178px] mx-auto h-full flex flex-col bg-white flex-shrink-0 animate-fade-in border-x border-zinc-200">
        
        {/* Header section */}
        <div id="sustainability-header" className="h-[53px] px-4 border-b border-zinc-100 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-4">
            <h2 
              id="sustainability-heading-title" 
              style={{ fontFamily: "'Source Serif 4', Georgia, Cambria, 'Times New Roman', Times, serif" }}
              className="text-[19px] font-semibold tracking-tight text-zinc-900 select-none font-serif-source"
            >
              Sustainability Intelligence
            </h2>
          </div>
          <div className="flex flex-col items-end">
            <button 
              type="button"
              onClick={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
              className={`p-1.5 rounded-[6px] border transition-colors cursor-pointer flex items-center justify-center relative ${
                isFilterPanelOpen 
                  ? "bg-zinc-900 text-white border-zinc-900" 
                  : "bg-zinc-50 text-zinc-700 border-zinc-200 hover:bg-zinc-100"
              }`}
              title="Toggle filters"
            >
              <Filter className="w-[13px] h-[13px]" />
              {hasActiveFilters && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-indigo-600 rounded-full"></span>
              )}
            </button>
            {hasActiveFilters && !isFilterPanelOpen && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setImpactFilter("All");
                  setSelectedTimeframe("All time");
                  setSelectedCategories(["All"]);
                }}
                className="text-[9.5px] text-zinc-500 hover:text-zinc-900 underline mt-0.5 cursor-pointer whitespace-nowrap"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>

        {/* Collapsible Filter Panel */}
        {isFilterPanelOpen && (
          <div className="px-4 py-3 bg-zinc-50/90 border-b border-zinc-100 flex flex-col gap-3 animate-in fade-in duration-200 flex-shrink-0">
            {hasActiveFilters && (
              <div className="flex items-center justify-between pb-1 border-b border-zinc-200/60">
                <span className="text-[10px] text-zinc-500 font-medium">Active filters applied</span>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setImpactFilter("All");
                    setSelectedTimeframe("All time");
                    setSelectedCategories(["All"]);
                  }}
                  className="text-[10px] text-zinc-600 hover:text-zinc-900 font-medium underline cursor-pointer"
                >
                  Clear filters
                </button>
              </div>
            )}
            {/* Search Area */}
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-[6px] border border-zinc-200">
              <Search className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" />
              <input
                type="text"
                placeholder="Search Sustainability Intelligence..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs bg-transparent text-zinc-800 outline-none placeholder:text-zinc-400"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery("")}
                  className="text-zinc-400 hover:text-zinc-600 text-xs cursor-pointer"
                >
                  ×
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              {/* Timeframe Buttons */}
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider font-sans">
                  Timeframe
                </span>
                <div className="flex items-center gap-1">
                  {["All time", "Last 14 days", "Last 30 days", "Last 60 days", "Last 90 days"].map((tf) => (
                    <button
                      key={tf}
                      type="button"
                      onClick={() => setSelectedTimeframe(tf)}
                      className={`px-2 py-0.5 text-[10px] font-medium rounded-[4px] border transition-all cursor-pointer ${
                        selectedTimeframe === tf
                          ? "bg-zinc-800 text-white border-zinc-800 shadow-xs font-semibold"
                          : "bg-white text-zinc-500 border-zinc-200 hover:text-zinc-800 hover:bg-zinc-100"
                      }`}
                    >
                      {tf}
                    </button>
                  ))}
                </div>
              </div>

              {/* Slider Filters (Impact) */}
              <div className="flex items-center gap-2 select-none">
                <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider font-sans">
                  Impact
                </span>

                <button
                  type="button"
                  onClick={() => setImpactFilter("All")}
                  className={`px-2 py-0.5 text-[10px] font-medium rounded-[4px] border transition-all cursor-pointer ${
                    impactFilter === "All"
                      ? "bg-zinc-800 text-white border-zinc-800 shadow-xs font-semibold"
                      : "bg-white text-zinc-500 border-zinc-200 hover:text-zinc-800 hover:bg-zinc-100"
                  }`}
                  title="Show all impact levels"
                >
                  All
                </button>

                <div className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-[6px] border border-zinc-200">
                  <button
                    type="button"
                    onClick={() => setImpactFilter(prev => prev === "Critical" ? "All" : "Critical")}
                    className={`text-[9.5px] font-semibold tracking-tight cursor-pointer transition-colors ${
                      impactFilter === "Critical" ? "text-rose-600 font-bold" : "text-zinc-400 hover:text-zinc-600"
                    }`}
                    title="Filter by Critical impact"
                  >
                    Critical
                  </button>

                  <div className="relative flex items-center w-20">
                    <input
                      type="range"
                      min={0}
                      max={3}
                      step={1}
                      value={
                        impactFilter === "Critical" ? 0 :
                        impactFilter === "High" ? 1 :
                        impactFilter === "Medium" ? 2 :
                        impactFilter === "Low" ? 3 : 0
                      }
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        const map: ("Critical" | "High" | "Medium" | "Low")[] = ["Critical", "High", "Medium", "Low"];
                        setImpactFilter(map[val]);
                      }}
                      className={`w-full h-1 bg-zinc-200 rounded-lg appearance-none cursor-pointer focus:outline-none ${
                        impactFilter === "Critical" ? "accent-rose-500" :
                        impactFilter === "High" ? "accent-amber-500" :
                        impactFilter === "Medium" ? "accent-blue-500" :
                        impactFilter === "Low" ? "accent-emerald-500" :
                        "accent-zinc-400"
                      }`}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => setImpactFilter(prev => prev === "Low" ? "All" : "Low")}
                    className={`text-[9.5px] font-semibold tracking-tight cursor-pointer transition-colors ${
                      impactFilter === "Low" ? "text-emerald-600 font-bold" : "text-zinc-400 hover:text-zinc-600"
                    }`}
                    title="Filter by Low impact"
                  >
                    Low
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Category Filter Tags */}
        <div className="px-4 pt-2 pb-2 border-b border-zinc-100 bg-white flex-shrink-0 z-10 flex flex-col gap-1.5">
          <div className="overflow-x-auto max-w-full pb-0.5 scrollbar-none">
            <div className="inline-flex items-center p-0.5 bg-zinc-100 rounded-[8px] border border-zinc-200">
              {TAGS.map((cat) => {
                const isSelected = selectedCategories.includes(cat);
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => handleCategoryToggle(cat)}
                    className={`px-4 py-1.5 text-[12px] font-medium rounded-[6px] whitespace-nowrap transition-all cursor-pointer ${
                      isSelected
                        ? "bg-white text-zinc-900 shadow-sm font-semibold"
                        : "text-zinc-500 hover:text-zinc-800"
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Signals list workspace */}
        <div 
          id="sustainability-signals-area" 
          className={`relative flex-1 overflow-y-auto px-0 py-3 flex flex-col gap-4 transition-all duration-300 ${selectedSignal ? "blur-sm" : ""}`}
        >
          {selectedSignal && (
            <div
              className="absolute inset-0 z-50 bg-transparent cursor-pointer"
              onClick={() => setSelectedSignal(null)}
            />
          )}

          {filteredSignals.length === 0 ? (
            <div className="p-8 text-center text-zinc-400 text-xs font-sans">
              No matching sustainability signals for your filter parameters.
            </div>
          ) : (
            <div className="flex flex-col gap-4 animate-in fade-in duration-300 w-full">
              {orderedGroupDates.map((dateGroup, gIdx) => {
                const signalsInGroup = groupedSignals[dateGroup] || [];
                const isExpanded = expandedDates[dateGroup] !== undefined ? !!expandedDates[dateGroup] : gIdx === 0;

                return (
                  <div key={dateGroup} className="flex flex-col w-full font-sans">
                    {/* Date Header for Signals */}
                    <div 
                      onClick={() => toggleDateGroup(dateGroup, gIdx)}
                      className="flex items-center justify-between py-1.5 px-4 cursor-pointer hover:bg-zinc-100/70 transition-colors select-none group/date w-full"
                    >
                      <div className="flex items-center gap-2">
                        <h3 className="text-[10px] font-bold text-zinc-600 tracking-wider uppercase group-hover/date:text-zinc-900 transition-colors">
                          {dateGroup}
                        </h3>
                        <span className="text-[9.5px] font-medium text-zinc-400 bg-zinc-100 px-1.5 py-0.5 rounded">
                          {signalsInGroup.length} {signalsInGroup.length === 1 ? "signal" : "signals"}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleDateGroup(dateGroup, gIdx);
                        }}
                        className="p-1 text-zinc-400 group-hover/date:text-zinc-700 hover:bg-zinc-200/60 transition-colors flex items-center justify-center rounded cursor-pointer"
                        title={isExpanded ? "Collapse" : "Expand"}
                      >
                        {isExpanded ? (
                          <Minus className="w-3.5 h-3.5 text-zinc-500" />
                        ) : (
                          <Plus className="w-3.5 h-3.5 text-zinc-500" />
                        )}
                      </button>
                    </div>

                    {/* List of cards in this date group */}
                    {isExpanded && (
                      <div className="w-full flex flex-col border-y border-zinc-200/80 divide-y divide-zinc-200/80 animate-in fade-in duration-150">
                        {signalsInGroup.map((sig) => {
                          const isSelected = selectedSignal?.id === sig.id;
                          const tagBadgeClass = getTagStyles(getCategoryTagColor(sig.category));
                          const selectedBorderClass = isSelected
                            ? "border-l-[3.5px] border-l-[#2d39d2]"
                            : "border-l-[3.5px] border-l-transparent";

                          return (
                            <div
                              key={sig.id}
                              id={`sustainability-card-${sig.id}`}
                              onClick={() => setSelectedSignal(sig)}
                              className={`w-full px-4 py-2 cursor-pointer transition-all flex items-start gap-3 justify-between hover:bg-zinc-50/70 ${selectedBorderClass} text-zinc-900 bg-white`}
                            >
                              {/* Left contents block */}
                              <div className="flex-1 flex flex-col items-start select-none">
                                <p className="text-[13px] font-semibold leading-snug text-zinc-900 font-sans">
                                  {sig.signal_title}
                                </p>
                                <div className={`mt-1 rounded-[3px] py-0.5 px-2 text-[9px] font-semibold tracking-tight inline-block font-sans ${tagBadgeClass}`}>
                                  {sig.category}
                                </div>
                              </div>

                              {/* Right impact indicator block */}
                              <div className="flex flex-col items-end flex-shrink-0 min-w-[65px] select-none pt-0.5">
                                <span className="text-[8.5px] font-bold tracking-wider text-zinc-400 mb-0.5 uppercase font-sans">
                                  IMPACT
                                </span>
                                <div className="flex gap-1 items-center">
                                  {Array.from({ length: 4 }).map((_, i) => {
                                    const colorCls = getUnifiedImpactBarClass(sig, i);
                                    return (
                                      <div
                                        key={i}
                                        className={`w-3 h-1 rounded-[0.5px] ${colorCls}`}
                                      />
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: Expanded Pane for Selected Signal (matching Policy & Risk Monitor) */}
      {selectedSignal && (
        <div 
          id="sustainability-content-pane" 
          className="absolute top-0 right-0 w-[40%] h-full flex flex-col bg-white overflow-hidden shadow-2xl z-[100] animate-in slide-in-from-right duration-300 font-sans"
        >
          {/* Top header with Close button */}
          <div className="px-5 border-b border-zinc-100 flex items-center justify-end h-11 flex-shrink-0">
            <button
              onClick={() => setSelectedSignal(null)}
              className="w-6 h-6 flex items-center justify-center rounded hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 transition-colors cursor-pointer"
              title="Close details"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Details Viewport */}
          <div 
            id="sustainability-details-viewport" 
            className="flex-1 overflow-y-auto p-6 md:p-8 flex flex-col gap-5 animate-fade-in bg-[#fafafa]/30 select-text relative font-sans"
          >
            <div className="flex flex-col gap-2">
              <h1 className="text-xl sm:text-[22px] font-semibold leading-tight tracking-tight text-[#111827] font-sans">
                {selectedSignal.signal_title}
              </h1>
              
              {/* Category Pill and Action Icons */}
              <div className="flex items-center justify-between gap-4 mt-1 select-text">
                <span className={`rounded-[3px] py-0.5 px-2 text-[9px] font-semibold tracking-tight inline-block font-sans ${getTagStyles(getCategoryTagColor(selectedSignal.category))}`}>
                  {selectedSignal.category}
                </span>

                <div className="flex items-center gap-1.5 shrink-0 select-none">
                  <div className="relative group/btn flex items-center justify-center">
                    <button
                      onClick={() => setIsNoteModalOpen(true)}
                      className={`w-[22px] h-[22px] border rounded-[4px] flex items-center justify-center transition-colors duration-150 cursor-pointer ${
                        bookmarkedIds.has(selectedSignal.id)
                          ? "bg-amber-50/60 border-amber-200/80 text-amber-500 hover:bg-amber-100/35"
                          : "bg-[#fafafa] border-zinc-200 text-zinc-400 hover:text-zinc-650 hover:bg-zinc-100/50"
                      }`}
                    >
                      <Bookmark className={`w-3 h-3 ${bookmarkedIds.has(selectedSignal.id) ? "text-amber-500 fill-amber-500" : ""}`} />
                    </button>
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover/btn:flex items-center bg-zinc-900 border border-zinc-800 text-white text-[10.5px] font-sans font-normal px-2 py-0.5 rounded shadow-md whitespace-nowrap z-50 pointer-events-none">
                      Notes & Bookmarks
                    </div>
                  </div>

                  <div className="relative group/btn flex items-center justify-center">
                    <button
                      onClick={() => {
                        setHiddenIds(prev => ({ ...prev, [selectedSignal.id]: true }));
                        triggerToast(`Hidden: ${selectedSignal.signal_title}`);
                        setSelectedSignal(null);
                      }}
                      className="w-[22px] h-[22px] bg-[#fafafa] border border-zinc-200 text-zinc-400 hover:text-red-500 hover:bg-red-50/50 rounded-[4px] flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover/btn:flex items-center bg-zinc-900 border border-zinc-800 text-white text-[10.5px] font-sans font-normal px-2 py-0.5 rounded shadow-md whitespace-nowrap z-50 pointer-events-none">
                      Not Relevant
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Meta values and Impact bar row */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border border-zinc-200 rounded-[4px] p-4 bg-zinc-50/30 select-text font-sans">
              <div className="flex flex-col gap-1 text-[12.5px] text-zinc-600 font-sans">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-zinc-800 font-sans">Reported on:</span>{" "}
                  <span className="text-zinc-600 font-sans">{selectedSignal.source_published_date}</span>
                  <div
                    className="relative group/info inline-flex items-center cursor-help ml-0.5"
                    title={`Source Type: ${selectedSignal.source_type || "Sustainability Framework"}`}
                  >
                    <Info className="w-3.5 h-3.5 text-zinc-400 hover:text-zinc-600 transition-colors" />
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover/info:flex items-center bg-zinc-900 border border-zinc-800 text-white text-[11px] font-sans font-normal px-2 py-0.5 rounded shadow-md whitespace-nowrap z-50 pointer-events-none">
                      {`Source Type: ${selectedSignal.source_type || "Sustainability Framework"}`}
                    </div>
                  </div>
                </div>
                <div>
                  <span className="font-semibold text-zinc-800 font-sans">Region:</span>{" "}
                  <span className="text-zinc-600 font-sans">{selectedSignal.country || "Global"}</span>
                </div>
              </div>

              <div className="flex flex-col items-end gap-1.5 min-w-[100px] select-none">
                <span className="text-[9px] font-bold tracking-widest text-zinc-500 font-sans">IMPACT</span>
                <div className="flex items-center gap-1">
                  {Array.from({ length: 4 }).map((_, i) => {
                    const colorCls = getUnifiedImpactBarClass(selectedSignal, i);
                    return (
                      <div
                        key={i}
                        className={`w-3.5 h-1.5 rounded-[1.5px] transition-all ${colorCls}`}
                      />
                    );
                  })}
                </div>
                <span className="text-[12.5px] font-bold text-zinc-700 tracking-tight font-sans">
                  {selectedSignal.impact_level}
                </span>
              </div>
            </div>

            {/* Narrative summary and citation */}
            <div className="flex flex-col gap-4 text-[13px] leading-relaxed text-zinc-600 font-sans select-text">
              <p className="font-[350] text-zinc-800 leading-relaxed text-left" style={{ fontWeight: 350 }}>
                {selectedSignal.summary}
              </p>
              
              <div className="flex items-start gap-1.5 select-none text-[11px] text-zinc-600 mt-1">
                <span className="font-normal text-zinc-600 mt-[3px]">Reference:</span>
                {selectedSignal.source_article_url ? (
                  <a 
                    href={selectedSignal.source_article_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group inline-flex items-center justify-center px-1.5 h-[17px] bg-zinc-100 border border-zinc-200 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-600 rounded-[3px] text-[10px] font-semibold text-zinc-700 transition-colors cursor-pointer select-none"
                    title={selectedSignal.source || "Primary Source"}
                  >
                    1
                  </a>
                ) : (
                  <span 
                    className="group inline-flex items-center justify-center px-1.5 h-[17px] bg-zinc-100 border border-zinc-200 rounded-[3px] text-[10px] font-semibold text-zinc-700 select-none"
                    title={selectedSignal.source || "Primary Source"}
                  >
                    1
                  </span>
                )}
              </div>
            </div>

            {/* Business Impact bullet section */}
            <div className="flex flex-col gap-2 mt-2">
              <h3 className="text-[13px] font-semibold tracking-tight text-zinc-800 font-sans">
                Business Impact
              </h3>
              <div className="bg-[#eef1fe]/60 border border-violet-100 p-4 rounded-[4px] flex flex-col gap-3">
                {selectedSignal.business_impact.map((bullet, idx) => (
                  <div key={idx} className="flex gap-2.5 items-start">
                    <span className="text-[#2d39d2] text-xs mt-1 shrink-0 select-none">•</span>
                    <p className="text-[13px] leading-relaxed text-zinc-800 font-[350] select-text font-sans" style={{ fontWeight: 350 }}>
                      {bullet}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Similar Sustainability Movements */}
            {selectedSignal.similar_movements && selectedSignal.similar_movements.length > 0 && (
              <div className="flex flex-col gap-1.5 mt-4 select-text">
                <h3 className="text-[12.5px] font-medium tracking-tight text-zinc-900 font-sans select-text">
                  Similar Sustainability Movements
                </h3>
                <div className="flex flex-col gap-1.5 ml-1">
                  {selectedSignal.similar_movements.map((item, idx) => (
                    <div className="flex items-start gap-2 py-0.5 text-[12px]" key={idx}>
                      <CornerDownRight className="w-3 h-3 text-zinc-400 mt-[3px] shrink-0 select-none" />
                      <span className="text-left text-zinc-700 font-normal font-sans text-[12px]">
                        {item.title}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Explore Decision Intelligence section */}
            <div className="flex flex-col gap-1.5 mt-4 select-text">
              <h3 className="text-[12.5px] font-medium tracking-tight text-zinc-900 font-sans select-text">
                Explore Decision Intelligence
              </h3>
              <div className="flex flex-col gap-1.5 ml-1">
                <div className="flex items-start gap-2 py-0.5 text-[12px]">
                  <CornerDownRight className="w-3 h-3 text-zinc-400 mt-[3px] shrink-0 select-none" />
                  <button
                    onClick={() => {
                      const query = `What are the sustainability compliance implications and ESG risks of ${selectedSignal.signal_title}?`;
                      if (onSwitchToDecisionIntelligence) {
                        onSwitchToDecisionIntelligence(query, "sustainability_intelligence", "Sustainability Intelligence", "Sustainability Intelligence");
                      }
                    }}
                    className="text-left text-zinc-700 hover:text-[#2d39d2] transition-colors leading-normal hover:underline select-text font-normal cursor-pointer font-sans text-[12px]"
                  >
                    Evaluate sustainability compliance and ESG risks
                  </button>
                </div>
                <div className="flex items-start gap-2 py-0.5 text-[12px]">
                  <CornerDownRight className="w-3 h-3 text-zinc-400 mt-[3px] shrink-0 select-none" />
                  <button
                    onClick={() => {
                      const query = `Provide industry precedents and sustainability standards for ${selectedSignal.signal_title}.`;
                      if (onSwitchToDecisionIntelligence) {
                        onSwitchToDecisionIntelligence(query, "sustainability_intelligence", "Sustainability Intelligence", "Sustainability Intelligence");
                      }
                    }}
                    className="text-left text-zinc-700 hover:text-[#2d39d2] transition-colors leading-normal hover:underline select-text font-normal cursor-pointer font-sans text-[12px]"
                  >
                    Show sustainability standards & industry precedents
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Note modal for saving notes/bookmarks */}
      {selectedSignal && (
        <NoteModal
          isOpen={isNoteModalOpen}
          onClose={() => setIsNoteModalOpen(false)}
          title={selectedSignal.signal_title}
          initialContent={notes[selectedSignal.id] || ""}
          onSave={handleSaveNote}
        />
      )}

    </div>
  );
}
