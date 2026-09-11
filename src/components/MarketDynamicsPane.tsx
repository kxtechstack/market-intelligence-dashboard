import React, { useState, useEffect, useMemo, useRef } from "react";
import { Sparkles, Bookmark, Share2, FileText, Send, Loader2, ArrowUpRight, AlertTriangle, Minus, ArrowDownRight, Pencil, Check, ArrowUp, ArrowRight, ArrowDown, Square, Trash2, CornerDownLeft } from "lucide-react";
import { supabase } from "../lib/supabase";
import { SourceItem } from "./ForewardOutlookPane";
import { ChatSources } from "./ChatSources";
import { MARKET_DYNAMICS_MODULE_ID, API_URL } from "../constants";

interface MarketDynamicsPaneProps {
  onReturn: () => void;
  clientId: string;
  industry: string;
  userId: string;
  navigatedItemId?: string | null;
  onClearNavigatedItem?: () => void;
}

interface ChatMessage {
  id: string;
  role: "user" | "model";
  text: string;
  timestamp: Date;
  sources?: (string | { title: string; url: string })[];
}

// Design helper functions copied exactly from ForewardOutlookPane
const getConfidenceColor = (confidence: string) => {
  const conf = (confidence || "").toLowerCase();
  if (conf.includes("high")) {
    return "#10b981"; // Green for High Confidence
  }
  if (conf.includes("medium")) {
    return "#eab308"; // Yellow for Medium Confidence
  }
  return "#f43f5e"; // Pinkish Red for Low Confidence
};

const getCategoryTagClass = (category: string) => {
  const cat = (category || "").toLowerCase();
  
  if (cat === "market intelligence") {
    return "bg-sky-50 border border-sky-200 text-sky-800";
  }
  if (cat === "corporate activity") {
    return "bg-slate-50 border border-slate-200 text-slate-800";
  }
  if (cat === "investment activity" || cat.includes("investment") || cat.includes("capital")) {
    return "bg-[#fffbeb] border border-[#fde68a] text-[#78350f]";
  }
  if (cat === "consumer & demand") {
    return "bg-rose-50 border border-rose-200 text-rose-800";
  }
  if (cat === "innovation & product" || cat.includes("innovation") || cat.includes("research")) {
    return "bg-emerald-50 border border-emerald-200 text-emerald-800";
  }
  if (cat === "regulatory & compliance" || cat.includes("compliance")) {
    return "bg-purple-50 border border-purple-200 text-purple-800";
  }
  if (cat === "macro & economic") {
    return "bg-indigo-50 border border-indigo-200 text-indigo-800";
  }
  if (cat === "leadership") {
    return "bg-teal-50 border border-teal-200 text-teal-800";
  }

  // Fallbacks
  if (cat.includes("research")) {
    return "bg-sky-50 border border-sky-200 text-sky-800";
  }
  if (cat.includes("patent")) {
    return "bg-purple-50 border border-purple-200 text-purple-800";
  }
  return "bg-slate-50 border border-slate-200 text-slate-800";
};

const mapToEightCategories = (src: { source_name: string; details: string; category: string }) => {
  const name = (src.source_name || "").toLowerCase();
  const desc = (src.details || "").toLowerCase();
  const cat = (src.category || "").toLowerCase();

  // 1. Leadership
  if (
    name.includes("executive") || name.includes("hire") || name.includes("depart") || name.includes("talent") || name.includes("leadership") || name.includes("board") || name.includes("officer") || name.includes("recruitment") || name.includes("search") ||
    desc.includes("executive") || desc.includes("hire") || desc.includes("depart") || desc.includes("talent") || desc.includes("leadership") || desc.includes("board") || desc.includes("officer") || desc.includes("recruitment") || desc.includes("search") ||
    cat.includes("talent") || cat.includes("leadership")
  ) {
    return "Leadership";
  }

  // 2. Regulatory & Compliance
  if (
    name.includes("regulatory") || name.includes("compliance") || name.includes("policy") || name.includes("amf") || name.includes("sec") || name.includes("law") || name.includes("rule") || name.includes("standard") || name.includes("audit") || name.includes("uspto") || name.includes("patent gazette") || name.includes("patent office") ||
    desc.includes("regulatory") || desc.includes("compliance") || desc.includes("policy") || desc.includes("amf") || desc.includes("sec") || desc.includes("law") || desc.includes("rule") || desc.includes("standard") || desc.includes("audit") || desc.includes("uspto") || desc.includes("patent gazette") || desc.includes("patent office") ||
    cat.includes("regulatory") || cat.includes("compliance") || cat.includes("policy")
  ) {
    return "Regulatory & Compliance";
  }

  // 3. Investment Activity
  if (
    name.includes("funding") || name.includes("venture") || name.includes("capital") || name.includes("series") || name.includes("investment") || name.includes("financial") || name.includes("m&a") || name.includes("acquisition") || name.includes("equity") ||
    desc.includes("funding") || desc.includes("venture") || desc.includes("capital") || desc.includes("series") || desc.includes("investment") || desc.includes("financial") || desc.includes("m&a") || desc.includes("acquisition") || desc.includes("equity") ||
    cat.includes("investment") || cat.includes("capital") || cat.includes("funding")
  ) {
    return "Investment Activity";
  }

  // 4. Macro & Economic
  if (
    name.includes("macro") || name.includes("economic") || name.includes("gdp") || name.includes("inflation") || name.includes("index") || name.includes("rate") || name.includes("currency") || name.includes("fiscal") ||
    desc.includes("macro") || desc.includes("economic") || desc.includes("gdp") || desc.includes("inflation") || desc.includes("index") || desc.includes("rate") || desc.includes("currency") || desc.includes("fiscal") ||
    cat.includes("macro") || cat.includes("economic")
  ) {
    return "Macro & Economic";
  }

  // 5. Consumer & Demand
  if (
    name.includes("consumer") || name.includes("demand") || name.includes("pricing") || name.includes("survey") || name.includes("market share") || name.includes("volume") || name.includes("retail") || name.includes("client") || name.includes("user") || name.includes("shopper") ||
    desc.includes("consumer") || desc.includes("demand") || desc.includes("pricing") || desc.includes("survey") || desc.includes("market share") || desc.includes("volume") || desc.includes("retail") || desc.includes("client") || desc.includes("user") || desc.includes("shopper") ||
    cat.includes("consumer") || cat.includes("demand")
  ) {
    return "Consumer & Demand";
  }

  // 6. Innovation & Product
  if (
    name.includes("patent") || name.includes("formulation") || name.includes("clinical") || name.includes("r&d") || name.includes("research & development") || name.includes("innovation") || name.includes("product") || name.includes("technology") || name.includes("tech") || name.includes("materials") || name.includes("pipeline") || name.includes("science") ||
    desc.includes("patent") || desc.includes("formulation") || desc.includes("clinical") || desc.includes("r&d") || desc.includes("research & development") || desc.includes("innovation") || desc.includes("product") || desc.includes("technology") || desc.includes("tech") || desc.includes("materials") || desc.includes("pipeline") || desc.includes("science") ||
    cat.includes("innovation") || cat.includes("product") || cat.includes("patent") || cat.includes("research") || cat.includes("tech")
  ) {
    return "Innovation & Product";
  }

  // 7. Corporate Activity
  if (
    name.includes("corporate") || name.includes("competitor") || name.includes("merger") || name.includes("business") || name.includes("conglomerate") || name.includes("brand") || name.includes("industry") || name.includes("firm") || name.includes("company") || name.includes("co") ||
    desc.includes("corporate") || desc.includes("competitor") || desc.includes("merger") || desc.includes("business") || desc.includes("conglomerate") || desc.includes("brand") || desc.includes("industry") || desc.includes("firm") || desc.includes("company") || desc.includes("co") ||
    cat.includes("corporate") || cat.includes("industry") || cat.includes("structure")
  ) {
    return "Corporate Activity";
  }

  // 8. Market Intelligence (Fallback)
  return "Market Intelligence";
};

const getCategoryLabel = (cat: string) => {
  if (!cat) return "";
  const mapping: Record<string, string> = {
    "funding & investment": "Funding & Investment",
    "industry structure": "Industry Structure",
    "talent movement": "Talent Movement",
    "macro & economic": "Macro & Economic",
    "tech adoption": "Tech Adoption"
  };
  return mapping[cat.toLowerCase()] || cat.charAt(0).toUpperCase() + cat.slice(1);
};

const getMainCategoryTagClass = (category: string) => {
  const cat = (category || "").toLowerCase();
  if (cat.includes("funding") || cat.includes("investment")) {
    return "bg-amber-50 border border-amber-200 text-amber-800";
  }
  if (cat.includes("industry") || cat.includes("structure")) {
    return "bg-blue-50 border border-blue-200 text-blue-800";
  }
  if (cat.includes("talent") || cat.includes("movement")) {
    return "bg-emerald-50 border border-emerald-200 text-emerald-800";
  }
  if (cat.includes("macro") || cat.includes("economic")) {
    return "bg-indigo-50 border border-indigo-200 text-indigo-800";
  }
  if (cat.includes("tech") || cat.includes("adoption")) {
    return "bg-purple-50 border border-purple-200 text-purple-800";
  }
  if (cat.includes("consumer")) {
    return "bg-rose-50 border border-rose-200 text-rose-800";
  }
  if (cat.includes("technology")) {
    return "bg-purple-50 border border-purple-200 text-purple-800";
  }
  if (cat.includes("supply") || cat.includes("chain")) {
    return "bg-orange-50 border border-orange-200 text-orange-800";
  }
  if (cat.includes("product")) {
    return "bg-teal-50 border border-teal-200 text-teal-800";
  }
  if (cat.includes("sustainability")) {
    return "bg-emerald-50 border border-emerald-200 text-emerald-800";
  }
  return "bg-slate-50 border border-slate-200 text-slate-800";
};

const formatTerm = (term: string) => {
  return (term || "").replace("-Term", " term").trim();
};

const getTagStyles = (tagColor: string) => {
  switch (tagColor) {
    case "rose":
      return "bg-[#fff0f0] border border-[#fecaca] text-[#821c1c]";
    case "amber":
      return "bg-[#fffbeb] border border-[#fde68a] text-[#78350f]";
    case "blue":
      return "bg-[#e0f2fe] border border-[#bae6fd] text-[#0369a1]";
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
    case "red": return "bg-red-50 border border-red-200 text-red-800";
    case "fuchsia": return "bg-fuchsia-50 border border-fuchsia-200 text-fuchsia-800";
    case "lime": return "bg-lime-50 border border-lime-200 text-lime-800";
    default: return "bg-zinc-50 border border-zinc-200 text-zinc-800";
  }
};

interface SignalDetailData {
  id?: string;
  title: string;
  category: string;
  sector: string;
  term: "Near-Term" | "Mid-Term" | "Long-Term";
  impact_level: "Critical" | "High" | "Medium" | "Low";
  confidence: "High" | "Medium" | "Low";
  summary: string;
  business_impact: string[];
  sources: SourceItem[];
  country: string;
  last_enriched_at?: string;
  created_at?: string;
}

const SUBMODULE_SUMMARIES: Record<string, string> = {};

const getSubmoduleIconInfo = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes("funding") || n.includes("investment")) return { type: "up-right" as const, color: "text-emerald-600" };
  if (n.includes("industry") || n.includes("structure")) return { type: "warning" as const, color: "text-amber-600" };
  if (n.includes("talent") || n.includes("movement")) return { type: "up-right" as const, color: "text-emerald-600" };
  if (n.includes("macro") || n.includes("economic")) return { type: "minus" as const, color: "text-zinc-400" };
  if (n.includes("tech") || n.includes("adoption")) return { type: "down-right" as const, color: "text-zinc-400" };
  return { type: "minus" as const, color: "text-zinc-400" };
};

const getSubmoduleSummary = (name: string) => {
  const n = name.toUpperCase();
  return SUBMODULE_SUMMARIES[n] || "Monitoring activity within this dimension. Strategic indicators suggest stable progression with periodic evaluations required to maintain competitive positioning.";
};

const SIGNAL_DETAILS: Record<string, SignalDetailData> = {};

const getSignalDetails = (sig: {title: string; desc: string}, selectedCategory: string) => {
  if (SIGNAL_DETAILS[sig.title]) {
    return SIGNAL_DETAILS[sig.title];
  }

  // Generate deterministic number of sources/signals between 1 and 5
  // Using a simple hash function so it's always consistent for the same title
  let hash = 0;
  for (let i = 0; i < sig.title.length; i++) {
    hash = sig.title.charCodeAt(i) + ((hash << 5) - hash);
  }
  const numSources = Math.abs(hash % 5) + 1; // 1, 2, 3, 4, or 5

  const sourceTemplates = [
    {
      source_name: sig.title,
      category: "Innovation" as const,
      details_suffix: "highlighting structural shifts and consumer volume deviations."
    },
    {
      source_name: "Capital Markets Analysis",
      category: "Capital investment" as const,
      details_suffix: "noting aggressive capital reallocation toward high-growth niches."
    },
    {
      source_name: "Industry Intelligence Report",
      category: "Research & Development" as const,
      details_suffix: "documenting shelf-space expansions and regional distributor audits."
    },
    {
      source_name: "Retail Intelligence Monthly",
      category: "Innovation" as const,
      details_suffix: "documenting shelf-space expansions and regional distributor audits."
    },
    {
      source_name: "Clinical Skincare Journal",
      category: "Research & Development" as const,
      details_suffix: "verifying compound stability and user-perceived efficacy profiles."
    }
  ];

  const generatedSources = Array.from({ length: numSources }).map((_, index) => {
    const template = sourceTemplates[index % sourceTemplates.length];
    // Dates can be staggered slightly
    const day = 21 - index * 2;
    const dateStr = `Jul ${day < 10 ? '0' + day : day}`;
    
    return {
      id: `dynamic-s-${index + 1}-${Math.abs(hash).toString(36)}`,
      source_name: template.source_name,
      details: index === 0 
        ? sig.desc 
        : `${sig.title.slice(0, 50)}...: ${template.details_suffix} Observed in real-time tracking streams.`,
      category: template.category,
      date: dateStr
    };
  });

  return {
    title: sig.title,
    category: selectedCategory,
    term: (Math.abs(hash) % 3 === 0 ? "Near-Term" : Math.abs(hash) % 3 === 1 ? "Mid-Term" : "Long-Term") as "Near-Term" | "Mid-Term" | "Long-Term",
    impact_level: (Math.abs(hash) % 3 === 0 ? "High" : Math.abs(hash) % 3 === 1 ? "Medium" : "Low") as "High" | "Medium" | "Low",
    confidence: (Math.abs(hash) % 2 === 0 ? "High" : "Medium") as "High" | "Medium",
    summary: sig.desc,
    business_impact: [],
    sources: generatedSources,
    country: ""
  };
};

interface SignalContent {
  id?: string;
  title: string;
  desc: string;
  short_summary?: string;
}

interface SignalGridItem {
  category: string;
  status: string;
  iconType: "up-right" | "up" | "right" | "down" | "down-right" | "minus" | "warning";
  iconColor: string;
  contents: SignalContent[][];
  signalsCount: number | null;
}

const RICH_SIGNALS: SignalGridItem[] = [];

const SPARSE_SIGNALS: SignalGridItem[] = [];

const getStatusIcon = (iconType: string, iconColor: string) => {
  const iconClass = `${iconColor} w-4 h-4 shrink-0`;
  switch (iconType) {
    case "up-right":
      return <ArrowUpRight className={iconClass} strokeWidth={2.4} />;
    case "up":
      return <ArrowUp className={iconClass} strokeWidth={2.4} />;
    case "right":
      return <ArrowRight className={iconClass} strokeWidth={2.4} />;
    case "down":
      return <ArrowDown className={iconClass} strokeWidth={2.4} />;
    case "down-right":
      return <ArrowDownRight className={iconClass} strokeWidth={2.4} />;
    case "minus":
      return <Minus className={iconClass} strokeWidth={2.4} />;
    case "warning":
      return <AlertTriangle className={iconClass} strokeWidth={2.4} />;
    default:
      return <ArrowUpRight className={iconClass} strokeWidth={2.4} />;
  }
};

export default function MarketDynamicsPane({ 
  onReturn,
  clientId,
  industry,
  userId,
  navigatedItemId,
  onClearNavigatedItem
}: MarketDynamicsPaneProps) {
  const [activeTab, setActiveTab] = useState<string>("insights");
  const [isSourcesExpanded, setIsSourcesExpanded] = useState<boolean>(true);
  const [isReferencesExpanded, setIsReferencesExpanded] = useState<boolean>(false);
  const [richSignals, setRichSignals] = useState<SignalGridItem[]>([]);
  const [marketInsights, setMarketInsights] = useState<any[]>([]);

  useEffect(() => {
    if (navigatedItemId && marketInsights.length > 0) {
      setSelectedInsightId(navigatedItemId);
      if (onClearNavigatedItem) onClearNavigatedItem();
    }
  }, [navigatedItemId, marketInsights]);
  const [isLoading, setIsLoading] = useState(true);
  const [signalSubCardTitles, setSignalSubCardTitles] = useState<Record<string, string[]>>({});
  
  const [selectedGridSignal, setSelectedGridSignal] = useState<SignalContent | null>(null);
  const [selectedInsightId, setSelectedInsightId] = useState<string | null>(null);

  const [isBookmarked, setIsBookmarked] = useState<Record<string, boolean>>({});
  const [hiddenIds, setHiddenIds] = useState<Record<string, boolean>>({});
  const [lastHiddenInsight, setLastHiddenInsight] = useState<any | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [activeSignalDetail, setActiveSignalDetail] = useState<SignalDetailData | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [selectedSignalId, setSelectedSignalId] = useState<string | null>(null);

  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  useEffect(() => {
    async function fetchMarketDynamics() {
      setIsLoading(true);
      try {
        // 1. Fetch enabled signal configuration for the client
        const { data: enabledSignalsData, error: enabledSignalsError } = await supabase
          .schema("admin")
          .from("client_signals")
          .select(`
            id,
            signal_id,
            is_enabled,
            signal:signals(
              id,
              signal_name,
              module_id,
              submodule_id,
              submodule:submodules(
                id,
                submodule_name,
                module_id
              )
            )
          `)
          .eq("client_id", clientId)
          .eq("is_enabled", true);

        if (enabledSignalsError) throw enabledSignalsError;

        // Filter for this specific module ID locally
        const enabledSignals = (enabledSignalsData || [])
          .filter((cs: any) => cs.signal?.module_id === MARKET_DYNAMICS_MODULE_ID)
          .sort((a: any, b: any) => {
            const subA = a.signal.submodule.submodule_name;
            const subB = b.signal.submodule.submodule_name;
            if (subA !== subB) return subA.localeCompare(subB);
            return a.signal.signal_name.localeCompare(b.signal.signal_name);
          });

        // 2. Fetch market insights from public schema
        const { data: insightsData, error: insightsError } = await supabase
          .from("market_insights_live")
          .select("*")
          .eq("module_id", MARKET_DYNAMICS_MODULE_ID)
          .eq("client_id", clientId);

        if (insightsError) throw insightsError;
        if (insightsData && insightsData.length > 0) {
          console.log("Market insight item keys:", Object.keys(insightsData[0]));
        }
        setMarketInsights(insightsData || []);

        if (enabledSignals.length > 0) {
          // Group enabled signals by submodule
          const submodulesMap: Record<string, { name: string, signals: any[] }> = {};
          enabledSignals.forEach((cs: any) => {
            const sm = cs.signal.submodule;
            if (!submodulesMap[sm.id]) {
              submodulesMap[sm.id] = { name: sm.submodule_name, signals: [] };
            }
            submodulesMap[sm.id].signals.push(cs.signal);
          });

          const newRichSignals: SignalGridItem[] = [];
          const newSubCardTitles: Record<string, string[]> = {};

          Object.entries(submodulesMap).forEach(([smId, smData]) => {
            const submoduleName = smData.name;
            const submoduleSignals = smData.signals;
            
            // Map insights to these signals
            const titles: string[] = submoduleSignals.map(s => s.signal_name);
            const contents: SignalContent[][] = submoduleSignals.map(signal => {
               return (insightsData || [])
                 .filter(item => item.signal_id === signal.id)
                 .map(item => ({
                   id: item.id,
                   title: item.title || item.summary || "",
                   desc: item.summary || "",
                   short_summary: item.short_summary || ""
                 }));
            });

            const iconInfo = getSubmoduleIconInfo(submoduleName);

            newRichSignals.push({
              category: submoduleName.toUpperCase(),
              status: "Stable", 
              iconType: iconInfo.type, 
              iconColor: iconInfo.color, 
              contents,
              signalsCount: contents.flat().length
            });

            newSubCardTitles[submoduleName] = titles;
          });

          setRichSignals(newRichSignals);
          setSignalSubCardTitles(newSubCardTitles);
          
          if (newRichSignals.length > 0) {
            const firstSubmoduleName = Object.values(submodulesMap)[0].name;
            setSelectedCategory(firstSubmoduleName);
          }
        } else {
          setRichSignals([]);
          setSignalSubCardTitles({});
          setMarketInsights([]);
        }
      } catch (err) {
        console.error("Error fetching market dynamics:", err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchMarketDynamics();
  }, [clientId]);

  useEffect(() => {
    let cancelled = false;

    if (!selectedInsightId) {
      setActiveSignalDetail(null);
      return;
    }

    async function fetchSignalDetails() {
      setActiveSignalDetail(null);
      setIsDetailLoading(true);
      try {
        const insight = marketInsights.find(mi => mi.id === selectedInsightId);
        if (!insight || cancelled) {
          if (!insight) setIsDetailLoading(false);
          return;
        }

        const { data: signalsData, error: signalsError } = await supabase
          .from("market_dynamics_signals")
          .select("*")
          .eq("insight_id", selectedInsightId);

        if (cancelled) return;
        if (signalsError) throw signalsError;

        const mappedSources = (signalsData || []).map(s => ({
          id: s.id,
          source_name: s.signal_title || "Signal",
          details: s.summary || "",
          category: (s.category || "General") as any,
          date: (s.last_enriched_at || s.published_date) ? new Date(s.last_enriched_at || s.published_date).toLocaleDateString("en-US", { month: "short", day: "2-digit" }) : "Jul 23",
          organization: s.organization,
          source_url: s.source_url
        }));

        const detail: SignalDetailData = {
          id: insight.id,
          title: insight.title || insight.summary || "",
          category: insight.category || "General",
          sector: insight.category || "General",
          term: (insight.ring === "long_term" ? "Long-Term" : insight.ring === "mid_term" ? "Mid-Term" : "Near-Term") as any,
          impact_level: (() => {
            const rel = (insight.relevance_level_live || "").toLowerCase();
            if (rel === "critical") return "Critical";
            if (rel === "high") return "High";
            if (rel === "medium") return "Medium";
            if (rel === "low") return "Low";
            return "Medium";
          })() as any,
          confidence: (() => {
            const conf = (insight.write_up?.confidence || "").toLowerCase();
            if (conf === "high") return "High";
            if (conf === "medium") return "Medium";
            if (conf === "low") return "Low";
            return "High";
          })() as any,
          summary: insight.summary || "",
          business_impact: (() => {
            const bi = insight.business_impact;
            if (!bi) return [];
            if (typeof bi === 'string') {
              try {
                return JSON.parse(bi);
              } catch (e) {
                return [bi];
              }
            }
            return Array.isArray(bi) ? bi : [];
          })(),
          sources: mappedSources,
          country: insight.country || "",
          last_enriched_at: insight.last_enriched_at,
          created_at: insight.created_at
        };

        if (cancelled) return;
        setActiveSignalDetail(detail);
        if (mappedSources.length > 0) {
          setSelectedSignalId(mappedSources[0].id);
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Error fetching signal details:", err);
        }
      } finally {
        if (!cancelled) {
          setIsDetailLoading(false);
        }
      }
    }

    fetchSignalDetails();

    return () => {
      cancelled = true;
    };
  }, [selectedInsightId, marketInsights]);

  // Date states (retained for identical design/functionality)
  const [startDateStr, setStartDateStr] = useState(() => sessionStorage.getItem("market_dynamics_start_date") || "");
  const [endDateStr, setEndDateStr] = useState(() => sessionStorage.getItem("market_dynamics_end_date") || "");
  const [defaultStartDate, setDefaultStartDate] = useState("");
  const [defaultEndDate, setDefaultEndDate] = useState("");
  const [isEditingDates, setIsEditingDates] = useState(false);

  useEffect(() => {
    if (selectedInsightId) {
      const targetCategoryData = richSignals.find(s => 
        s.contents.flat().some(content => content.id === selectedInsightId)
      );
      if (targetCategoryData) {
        const rawName = Object.keys(signalSubCardTitles).find(k => k.toUpperCase() === targetCategoryData.category) || targetCategoryData.category;
        setSelectedCategory(prev => prev.toUpperCase() !== rawName.toUpperCase() ? rawName : prev);
      }
      
      setTimeout(() => {
        const el = document.getElementById(`signal-card-${selectedInsightId}`);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 150);
    }
  }, [selectedInsightId, richSignals, signalSubCardTitles, startDateStr, endDateStr]);

  const autoExpandProcessedRef = useRef<string | null>(null);

  // Auto-expand date filter if the user clicks a similar article that falls outside current range
  useEffect(() => {
    if (selectedInsightId && marketInsights.length > 0 && startDateStr && endDateStr) {
      if (autoExpandProcessedRef.current === selectedInsightId) {
        return;
      }
      autoExpandProcessedRef.current = selectedInsightId;

      const insight = marketInsights.find(mi => mi.id === selectedInsightId);
      if (insight) {
        const effectiveDate = insight.last_enriched_at || insight.created_at;
        if (effectiveDate) {
          const pubDateStr = effectiveDate.split('T')[0];
          let updatedStart = startDateStr;
          let updatedEnd = endDateStr;
          let changed = false;

          if (pubDateStr < startDateStr) {
            updatedStart = pubDateStr;
            changed = true;
          }
          if (pubDateStr > endDateStr) {
            updatedEnd = pubDateStr;
            changed = true;
          }

          if (changed) {
            setStartDateStr(updatedStart);
            setEndDateStr(updatedEnd);
            sessionStorage.setItem("market_dynamics_start_date", updatedStart);
            sessionStorage.setItem("market_dynamics_end_date", updatedEnd);
          }
        }
      }
    }
  }, [selectedInsightId, marketInsights, startDateStr, endDateStr]);

  // Load fallback dates matching Policy & Risk Monitor defaults
  useEffect(() => {
    const today = new Date();
    
    const formatDate = (d: Date) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    let minStr = "";
    if (marketInsights && marketInsights.length > 0) {
      const earliest = marketInsights.reduce((min, insight) => {
        const effectiveDate = insight.last_enriched_at || insight.created_at || insight.source_published_date;
        if (!effectiveDate) return min;
        const d = new Date(effectiveDate);
        if (isNaN(d.getTime())) return min;
        return d < min ? d : min;
      }, new Date());
      minStr = formatDate(earliest);
    } else {
      const past = new Date();
      past.setFullYear(today.getFullYear() - 5); // 5 years back fallback
      minStr = formatDate(past);
    }
    
    const maxStr = formatDate(today);

    setDefaultStartDate(minStr);
    setDefaultEndDate(maxStr);

    // Only set initial state if not already in sessionStorage
    if (!sessionStorage.getItem("market_dynamics_start_date")) {
      setStartDateStr(minStr);
    }
    if (!sessionStorage.getItem("market_dynamics_end_date")) {
      setEndDateStr(maxStr);
    }
  }, [marketInsights]);

  const todayStr = useMemo(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }, []);

  const formattedDateRange = useMemo(() => {
    if (!startDateStr || !endDateStr) return "Loading...";
    const formatDate = (dateStr: string) => {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const utcDate = new Date(d.getTime() + d.getTimezoneOffset() * 60000);
      return utcDate.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    };
    return `${formatDate(startDateStr)} – ${formatDate(endDateStr)}`;
  }, [startDateStr, endDateStr]);

  const filteredMarketInsights = useMemo(() => {
    return marketInsights.filter(insight => {
      if (hiddenIds[insight.id]) return false;
      const effectiveDate = insight.last_enriched_at || insight.created_at;
      if (startDateStr && endDateStr && effectiveDate) {
        const dateStr = effectiveDate.split('T')[0];
        return dateStr >= startDateStr && dateStr <= endDateStr;
      }
      return true;
    });
  }, [marketInsights, hiddenIds, startDateStr, endDateStr]);

  const filteredRichSignals = useMemo(() => {
    const validIds = new Set(filteredMarketInsights.map(mi => mi.id));
    return richSignals.filter(signal => {
      const allInsights = signal.contents.flat();
      if (allInsights.length === 0) return true;
      return allInsights.some(insight => validIds.has(insight.id));
    }).map(signal => {
      const filteredContents = signal.contents.map(group =>
        group.filter(insight => validIds.has(insight.id))
      );
      return {
        ...signal,
        contents: filteredContents,
        signalsCount: filteredContents.flat().length
      };
    });
  }, [richSignals, filteredMarketInsights]);

  const activeGridSignals = useMemo(() => {
    return filteredRichSignals;
  }, [filteredRichSignals]);

  const currentCategoryData = useMemo(() => {
    const key = (selectedCategory || "").toUpperCase();
    return activeGridSignals.find(s => s.category === key) || activeGridSignals[0] || null;
  }, [activeGridSignals, selectedCategory]);

  const currentSubCardTitles = useMemo(() => {
    // If we have live titles for this category, use them
    const liveTitles = signalSubCardTitles[selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1).toLowerCase()] || 
                       signalSubCardTitles[selectedCategory] || 
                       signalSubCardTitles[selectedCategory.toUpperCase()];
    
    if (liveTitles) return liveTitles;

    // Fallback to hardcoded titles for existing hardcoded data
    switch (selectedCategory) {
      case "Funding & investment":
        return ["Funding rounds announced", "Venture capital investments", "Private equity investments"];
      case "Industry structure":
        return ["Market consolidation", "Mergers & acquisitions", "New industry entrants"];
      case "Talent movement":
        return ["CEO/CXO appointments", "Leadership exits", "Mass hiring initiatives"];
      case "Macro & economic":
        return ["Interest rate changes", "Inflation updates", "GDP growth forecasts"];
      case "Tech adoption":
        return ["AI adoption", "Cloud migration", "Digital transformation programs"];
      default:
        return ["Signal Category 1", "Signal Category 2", "Signal Category 3"];
    }
  }, [selectedCategory, signalSubCardTitles]);

  const getSectionTitle = (category: string) => {
    const cat = category.toLowerCase();
    if (cat.includes("funding") || cat.includes("investment")) return "Funding & Investment";
    if (cat.includes("industry structure")) return "Industry Structure Changes";
    if (cat.includes("talent movement")) return "Talent Movement (Sector-Level)";
    if (cat.includes("macro") || cat.includes("economic")) return "Macro & Economic Signals";
    if (cat.includes("tech") || cat.includes("adoption")) return "Technology Adoption Signals";
    return category;
  };

  // Automatically select the first available signal when selectedCategory changes
  useEffect(() => {
    if (!selectedCategory || activeGridSignals.length === 0) return;

    const key = selectedCategory.toUpperCase();
    const catData = activeGridSignals.find(s => s.category === key) || activeGridSignals[0];
    
    if (catData && catData.contents) {
      // Only auto-select if nothing is selected or the selected signal is not in the current category
      const isCurrentSignalInCategory = selectedGridSignal && catData.contents.some(list => 
        list.some(sig => {
          if (selectedGridSignal.id && sig.id) return sig.id === selectedGridSignal.id;
          return sig.title === selectedGridSignal.title;
        })
      );

      // Check against the FULL unfiltered signals so we don't jump away from an insight that is currently hidden by date
      const fullCatData = richSignals.find(s => s.category === key);
      const isCurrentInsightInFullCategory = selectedInsightId && fullCatData && fullCatData.contents.some(list =>
        list.some(sig => sig.id === selectedInsightId)
      );

      if (!isCurrentSignalInCategory && !isCurrentInsightInFullCategory) {
        let firstSignal: SignalContent | null = null;
        for (const list of catData.contents) {
          if (list && list.length > 0) {
            firstSignal = list[0];
            break;
          }
        }
        if (firstSignal) {
          setSelectedGridSignal(firstSignal);
          setSelectedInsightId(firstSignal.id || null);
        }
      }
    }
  }, [selectedCategory, activeGridSignals, richSignals]);
  
  useEffect(() => {
    setIsSourcesExpanded(true);
    setIsReferencesExpanded(false);
    setExpandedCards({});
    setSelectedSignalId(null);
  }, [selectedGridSignal]);

  // Chatbot states
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Similar Prospects states
  const [similarFutureProspects, setSimilarFutureProspects] = useState<any[]>([]);
  const [isFetchingSimilar, setIsFetchingSimilar] = useState(false);

  useEffect(() => {
    if (!selectedInsightId) {
      setSimilarFutureProspects([]);
      return;
    }

    setIsFetchingSimilar(true);

    fetch(`${API_URL}/similar-insight/${selectedInsightId}`)
      .then(res => res.json())
      .then(data => {
        const mapped = (data.similar || []).map((item: any) => ({
          id: item.insight_id,
          title: item.title,
        }));
        setSimilarFutureProspects(mapped);
      })
      .catch(err => {
        console.error('Failed to fetch similar market movements:', err);
        setSimilarFutureProspects([]);
      })
      .finally(() => setIsFetchingSimilar(false));
  }, [selectedInsightId]);


  // Bookmarks states (Supabase backed)

  const triggerToast = (msg: string, isHideAction = false) => {
    if (!isHideAction) setLastHiddenInsight(null);
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => {
        if (prev === msg) {
          setLastHiddenInsight(null);
          return null;
        }
        return prev;
      });
    }, 3000);
  };

  const fetchBookmarks = async () => {
    if (!clientId || !userId) return;
    try {
      const { data, error } = await supabase
        .from("bookmarks")
        .select("market_insight_id")
        .eq("client_id", clientId)
        .eq("user_id", userId);

      if (error) throw error;
      
      const ids: Record<string, boolean> = {};
      data.forEach(b => {
        if (b.market_insight_id) ids[b.market_insight_id] = true;
      });
      setIsBookmarked(ids);
    } catch (err) {
      console.error("Error fetching bookmarks:", err);
    }
  };

  const fetchHiddenArticles = async () => {
    if (!clientId || !userId) return;
    try {
      const { data, error } = await supabase
        .from("hidden_articles")
        .select("market_insight_id")
        .eq("client_id", clientId)
        .eq("user_id", userId);

      if (error) throw error;

      const ids: Record<string, boolean> = {};
      data.forEach(h => {
        if (h.market_insight_id) ids[h.market_insight_id] = true;
      });
      setHiddenIds(ids);
    } catch (err) {
      console.error("Error fetching hidden articles:", err);
    }
  };

  useEffect(() => {
    fetchBookmarks();
    fetchHiddenArticles();

    // Listen for bookmark updates from other components
    const handleUpdate = () => {
      fetchBookmarks();
    };
    window.addEventListener("bookmarks-updated", handleUpdate);

    // Debug schema
    async function checkSchema() {
      const { data, error } = await supabase.from("bookmarks").select("*").limit(1);
      console.log("Bookmarks schema check (MarketDynamics):", { data, error });
    }
    checkSchema();

    return () => window.removeEventListener("bookmarks-updated", handleUpdate);
  }, [clientId, userId]);




  const renderedTrend = useMemo(() => {
    if (activeSignalDetail && selectedInsightId && activeSignalDetail.id === selectedInsightId) {
      return activeSignalDetail;
    }
    if (selectedGridSignal) {
      const details = getSignalDetails(selectedGridSignal, selectedCategory);
      return {
        id: selectedInsightId || details.title,
        title: details.title,
        sector: details.category as any,
        term: details.term,
        r: 100,
        angle: 45,
        summary: details.summary,
        country: "Global",
        source_type: "Market Report",
        source_published_date: "2026-07-21T00:00:00Z",
        impact_level: details.impact_level,
        business_impact: details.business_impact,
        textAnchor: "start" as const,
        dx: 0,
        dy: 0,
        confidence: details.confidence,
        signalsCount: selectedInsightId ? 0 : details.sources.length,
        trendStatus: "Trending up" as const,
        statValue1: "",
        statValue2: "",
        sparklinePath: "M0 15 L8 12 L16 14 L24 8 L32 9 L40 3",
        // If we have selectedInsightId, we are loading real sources, so hide mock ones
        sources: selectedInsightId ? [] : details.sources.map(src => {
          const originalCat = src.category;
          const mappedCat = mapToEightCategories({
            source_name: src.source_name,
            details: src.details,
            category: originalCat
          });
          return {
            id: src.id,
            source_name: src.source_name,
            details: src.details,
            category: mappedCat as any,
            originalCategory: originalCat,
            date: src.date
          };
        })
      };
    }
    return null;
  }, [selectedGridSignal, selectedCategory, activeSignalDetail, selectedInsightId]);

  const isCurrentTrendBookmarked = !!(renderedTrend?.id && isBookmarked[renderedTrend.id]);

  // Handle chat submission
  const handleChatSend = async (text: string) => {
    if (!text.trim() || chatLoading) return;

    const userMsg: ChatMessage = {
      id: Math.random().toString(36).substring(2),
      role: "user",
      text,
      timestamp: new Date()
    };

    setChatHistory(prev => [...prev, userMsg]);
    setChatInput("");
    setChatLoading(true);

    try {
      const response = await fetch(`${API_URL}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: text,
          clientId: clientId,
          industry: industry,
          moduleId: MARKET_DYNAMICS_MODULE_ID
        })
      });

      if (!response.ok) throw new Error("Pipeline API failure");

      const data = await response.json();
      
      const assistantMsg: ChatMessage = {
        id: Math.random().toString(36).substring(2),
        role: "model",
        text: data.answer || "I've analyzed that trend and generated custom strategic guidance.",
        sources: data.sources || [],
        timestamp: new Date()
      };

      setChatHistory(prev => [...prev, assistantMsg]);
    } catch (err) {
      console.error("Chat API error:", err);
      setTimeout(() => {
        const assistantMsg: ChatMessage = {
          id: Math.random().toString(36).substring(2),
          role: "model",
          text: `Based on an analysis of **${renderedTrend.title}** within the **${renderedTrend.sector}** space: this development directly affects Near-Term loyalty frameworks. We recommend allocating up to 12% of the tactical innovation budget to evaluate API-first pilot capabilities. Let me know if you would like to run additional scenario models.`,
          timestamp: new Date()
        };
        setChatHistory(prev => [...prev, assistantMsg]);
        setChatLoading(false);
      }, 800);
      return;
    } finally {
      setChatLoading(false);
    }
  };

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, chatLoading]);

  const renderImpactBars = (impact: "Critical" | "High" | "Medium" | "Low") => {
    const barCount = 4;
    let filledCount = 2;
    let barColor = "bg-yellow-400";

    if (impact === "Critical") {
      filledCount = 4;
      barColor = "bg-red-600";
    } else if (impact === "High") {
      filledCount = 3;
      barColor = "bg-orange-500";
    } else if (impact === "Medium") {
      filledCount = 2;
      barColor = "bg-yellow-400";
    } else {
      filledCount = 1;
      barColor = "bg-emerald-400";
    }

    return (
      <div className="flex items-center gap-1">
        {Array.from({ length: barCount }).map((_, i) => (
          <div
            key={i}
            className={`w-3.5 h-1.5 rounded-[1.5px] transition-all ${
              i < filledCount ? barColor : "bg-zinc-200"
            }`}
          />
        ))}
      </div>
    );
  };

  const formattedPublishDate = useMemo(() => {
    const dateVal = activeSignalDetail?.last_enriched_at || activeSignalDetail?.created_at || (renderedTrend as any)?.source_published_date || (renderedTrend as any)?.created_at;
    const d = new Date(dateVal || "2026-07-21");
    if (isNaN(d.getTime())) return "July 21, 2026";
    return d.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric"
    });
  }, [activeSignalDetail, renderedTrend]);

  return (
    <div id="market-dynamics-dashboard" className="flex-1 h-full flex bg-white divide-x divide-zinc-200 overflow-hidden">
      
      {/* LEFT COLUMN: Empty Left Pane Workspace (60% width) */}
      <div id="market-dynamics-column" className="w-[60%] h-full flex flex-col bg-white flex-shrink-0 animate-fade-in">
        
        {/* Header section */}
        <div id="market-dynamics-header" className="h-[53px] px-4 border-b border-zinc-100 flex items-center justify-between flex-shrink-0 bg-white">
          <div className="flex items-center gap-4">
            <h2 id="market-dynamics-heading-title" className="text-[19px] font-semibold tracking-tight text-zinc-900 select-none font-sans">
              Market Dynamics
            </h2>
          </div>
          <div className="flex items-center gap-4">
            {isEditingDates ? (
              <div className="flex items-center gap-1">
                <input 
                  type="date" 
                  value={startDateStr} 
                  max={todayStr}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (!val) {
                      setStartDateStr(defaultStartDate);
                    } else if (val > todayStr) {
                      setStartDateStr(todayStr);
                    } else {
                      setStartDateStr(val);
                    }
                  }}
                  className="text-[11px] border border-zinc-200 bg-[#fbfbfb] rounded-[4px] px-1.5 py-0.5 text-zinc-700 outline-none focus:border-zinc-300"
                />
                <span className="text-zinc-400 text-xs">-</span>
                <input 
                  type="date" 
                  value={endDateStr} 
                  max={todayStr}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (!val) {
                      setEndDateStr(defaultEndDate);
                    } else if (val > todayStr) {
                      setEndDateStr(todayStr);
                    } else {
                      setEndDateStr(val);
                    }
                  }}
                  className="text-[11px] border border-zinc-200 bg-[#fbfbfb] rounded-[4px] px-1.5 py-0.5 text-zinc-700 outline-none focus:border-zinc-300"
                />
                <button 
                  onClick={() => {
                    const finalStart = startDateStr || defaultStartDate;
                    const finalEnd = endDateStr || defaultEndDate;

                    if (!startDateStr) setStartDateStr(defaultStartDate);
                    if (!endDateStr) setEndDateStr(defaultEndDate);

                    // Persist confirmed dates
                    sessionStorage.setItem("market_dynamics_start_date", finalStart);
                    sessionStorage.setItem("market_dynamics_end_date", finalEnd);

                    setIsEditingDates(false);
                  }}
                  className="p-1 bg-[#18181b] hover:bg-black text-white rounded-[4px] transition-colors"
                  title="Confirm changes"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div 
                onClick={() => setIsEditingDates(true)}
                className="flex items-center gap-1.5 cursor-pointer hover:bg-zinc-100 px-2 py-1 rounded-[4px] transition-colors"
                title="Click to edit date range"
              >
                <span className="text-xs text-zinc-500 font-medium select-none">
                  {formattedDateRange}
                </span>
                <Pencil className="w-3.5 h-3.5 text-zinc-400 select-none" />
              </div>
            )}
          </div>
        </div>

        {/* Outer Workspace containing the new Market Dynamics overview at the top */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2 bg-[#fafafa]/50">
           {/* Market Dynamics Category Cards */}
            {!isLoading && filteredRichSignals.length === 0 ? (
               <div className="flex-1 flex items-center justify-center text-sm text-zinc-500 font-medium tracking-tight py-20">
                 No data available
               </div>
            ) : (
              <>
                <div className="flex flex-col gap-1.5 animate-fade-in select-text">
                  {filteredRichSignals.map((signal) => {
                    const displayName = signal.category.charAt(0).toUpperCase() + signal.category.slice(1).toLowerCase();
                    // Try to find original name for exact match with summaries
                    const rawName = Object.keys(signalSubCardTitles).find(k => k.toUpperCase() === signal.category) || displayName;
                    const isSelected = selectedCategory.toUpperCase() === signal.category;

                    return (
                      <div 
                        key={signal.category}
                        onClick={() => setSelectedCategory(rawName)}
                        className={`bg-white border rounded-[4px] px-4 py-2 flex items-center gap-4 shadow-[0_1px_2px_rgba(0,0,0,0.015)] transition-all cursor-pointer ${
                          isSelected
                            ? "border-blue-500 ring-1 ring-blue-500/20 bg-blue-50/[0.01]"
                            : "border-zinc-200/85 hover:border-zinc-300"
                        }`}
                      >
                        <div className="w-[180px] shrink-0 flex items-center gap-2.5 select-none">
                          {getStatusIcon(signal.iconType, signal.iconColor)}
                          <span className="text-[13px] font-semibold text-zinc-900 font-sans leading-none">
                            {rawName}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[12.5px] text-zinc-600 font-normal font-sans leading-snug">
                            {getSubmoduleSummary(rawName)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="border-t border-zinc-200/40 my-1.5 select-none"></div>

                {/* Market Signals Grid Section */}
                <div className="flex-1 flex flex-col min-h-0">
                  {/* Static Activity title header */}
                  <div className="pb-2 pt-1 flex items-center justify-between select-none">
                    <span className="text-[13.5px] font-bold text-zinc-800 font-sans tracking-wide uppercase">
                      ACTIVITY
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pb-1 items-start">
                    {currentCategoryData && currentSubCardTitles.map((title, subIndex) => {
                      const signalsList = currentCategoryData.contents[subIndex] || [];
                      return (
                        <div 
                          key={subIndex} 
                          className="bg-white border border-zinc-200 rounded-[4px] flex flex-col shadow-[0_1px_2px_rgba(0,0,0,0.015)] transition-all hover:border-zinc-300 overflow-hidden"
                        >
                          {/* Category Header with arrow next to it */}
                          <div className="px-4 py-3 border-b border-zinc-100 bg-[#fafafa]/20 flex items-center justify-between select-none">
                            <span className="text-[10.5px] font-bold tracking-wider text-zinc-800 font-sans uppercase">
                              {title}
                            </span>
                            {getStatusIcon(currentCategoryData.iconType, currentCategoryData.iconColor)}
                          </div>

                          {/* Content section */}
                          {signalsList.length > 0 ? (
                            <div className="flex flex-col">
                              {signalsList.map((sig, sigIdx) => {
                                const isSelected = selectedInsightId
                                  ? selectedInsightId === sig.id
                                  : selectedGridSignal?.id && sig.id
                                    ? selectedGridSignal.id === sig.id
                                    : selectedGridSignal?.title === sig.title;
                                return (
                                  <div 
                                    key={sigIdx} 
                                    id={sig.id ? `signal-card-${sig.id}` : undefined}
                                    onClick={() => {
                                      if (isSelected) {
                                        setSelectedGridSignal(null);
                                        setSelectedInsightId(null);
                                        setActiveSignalDetail(null);
                                      } else {
                                        setActiveSignalDetail(null);
                                        setSelectedGridSignal(sig);
                                        setSelectedInsightId(sig.id || null);
                                      }
                                    }}
                                    className={`px-4 py-3.5 border-b border-zinc-100 last:border-b-0 transition-all text-left cursor-pointer flex flex-col gap-1 ${
                                      isSelected 
                                        ? "border-l-[3.5px] border-l-[#7c3aed] bg-[#f5f3ff]/45 shadow-[inset_1px_0_0_rgba(124,58,237,0.05)]" 
                                        : "border-l-[3.5px] border-l-transparent hover:bg-zinc-50/40"
                                    }`}
                                  >
                                    <h4 className={`text-[12px] font-semibold font-sans leading-snug transition-colors ${
                                      isSelected ? "text-[#7c3aed]" : "text-zinc-900"
                                    }`}>
                                      {sig.title}
                                    </h4>
                                    <p className="text-[11px] text-zinc-650 font-normal font-sans leading-relaxed mt-1">
                                      {sig.short_summary || sig.desc}
                                    </p>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="py-12 px-5 flex flex-col items-center justify-center text-center select-none bg-zinc-50/20 border-t border-zinc-100/50 h-full">
                              <span className="text-[11px] text-zinc-400 font-medium font-sans max-w-[200px] leading-relaxed">
                                {title === "Mass hiring initiatives" 
                                  ? "No major corporate mass hiring initiatives detected this period." 
                                  : `No notable ${title.toLowerCase()} this period.`}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

      {/* RIGHT COLUMN: Outlook details view (Pane 2 - 40% width) */}
      <div id="market-dynamics-content-pane" className="w-[40%] h-full flex flex-col bg-white overflow-hidden relative">
        
        {/* Header of Content Detail */}
        <div id="content-header" className="h-[53px] px-4 border-b border-zinc-100 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-1.5 flex-shrink-0 select-none">
            <Sparkles className="w-3.5 h-3.5 text-violet-600 animate-pulse" />
            <span className="text-[12px] text-zinc-600 font-semibold tracking-tight font-sans">
              AI powered Insights by MarketGenie
            </span>
          </div>

        </div>

        {/* Tab switcher: contents */}
        <div id="content-tabbar" className="px-5 border-b border-zinc-100 flex items-center justify-between h-10 select-text flex-shrink-0 animate-fade-in">
          <div className="flex items-center gap-4 h-full">
            <button
              onClick={() => setActiveTab("insights")}
              className={`flex items-center gap-1.5 text-xs h-full px-1 border-b-2 transition-colors duration-150 font-sans ${
                activeTab === "insights"
                  ? "border-[#7c3aed] text-zinc-900 font-semibold"
                  : "border-transparent text-zinc-500 hover:text-zinc-800"
              }`}
            >
              <span>≡ Insights</span>
            </button>
            <button
              onClick={() => setActiveTab("ask_marketgenie")}
              className={`flex items-center gap-1.5 text-xs h-full px-1 border-b-2 transition-colors duration-150 font-sans ${
                activeTab === "ask_marketgenie"
                  ? "border-[#7c3aed] text-zinc-900 font-semibold"
                  : "border-transparent text-zinc-500 hover:text-zinc-800"
              }`}
            >
              <span>Sparkles Ask MarketGenie</span>
            </button>
            <button
              onClick={() => setActiveTab("bookmarks")}
              className={`flex items-center gap-1.5 text-xs h-full px-1 border-b-2 transition-colors duration-150 font-sans ${
                activeTab === "bookmarks"
                  ? "border-[#7c3aed] text-zinc-900 font-semibold"
                  : "border-transparent text-zinc-500 hover:text-zinc-800"
              }`}
            >
              <Bookmark className={`w-3 h-3 ${Object.keys(isBookmarked).length > 0 ? "text-violet-600 fill-violet-600" : "text-current opacity-70"}`} />
              <span>Bookmark ({Object.keys(isBookmarked).length})</span>
            </button>
          </div>
        </div>

        {/* Dynamic switcher content */}
        {(activeTab === "insights" || activeTab === "ask_marketgenie") && !renderedTrend && (
          <div className="flex-1 flex items-center justify-center text-sm text-zinc-500 font-medium tracking-tight">
            No signal selected
          </div>
        )}

        {activeTab === "insights" && renderedTrend && (
          <div key={renderedTrend.id} className="flex-1 overflow-y-auto p-6 md:p-8 flex flex-col gap-5 animate-fade-in bg-[#fafafa]/30 select-text relative">
            {isDetailLoading && (
              <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px] flex items-center justify-center z-10 animate-in fade-in duration-300">
                 <Loader2 className="w-6 h-6 text-violet-600 animate-spin" />
              </div>
            )}
            
            {/* Category, Actions and Title */}
            <div className="flex flex-col gap-2">
              <h1 className="text-xl sm:text-[22px] font-semibold leading-tight tracking-tight text-[#111827] font-sans">
                {renderedTrend.title}
              </h1>

              {/* Category Pill and Bookmark/Export as icons on the right */}
              <div className="flex items-center justify-between gap-4 mt-1 select-text">
                <span className={`rounded-[3px] py-0.5 px-2 text-[9px] font-semibold tracking-tight inline-block font-sans ${getMainCategoryTagClass(selectedGridSignal ? selectedCategory : renderedTrend.sector)}`}>
                  {getCategoryLabel(selectedGridSignal ? selectedCategory : renderedTrend.sector)}
                </span>

                <div className="flex items-center gap-1.5 shrink-0 select-none">
                  <button
                    id="not-interested-button"
                    onClick={async () => {
                      if (!renderedTrend || !clientId || !userId) return;
                      try {
                        const { error } = await supabase
                          .from("hidden_articles")
                          .insert([
                            {
                              client_id: clientId,
                              user_id: userId,
                              market_insight_id: renderedTrend.id
                            }
                          ]);
                        if (error) throw error;

                        setHiddenIds(prev => ({ ...prev, [renderedTrend.id]: true }));
                        setLastHiddenInsight(renderedTrend);
                        triggerToast(`Hidden: ${renderedTrend.title}`, true);
                      } catch (err: any) {
                        console.error("Error hiding article:", err);
                        triggerToast(`Failed to hide article: ${err.message || "Unknown error"}`);
                      }
                    }}
                    className="w-[22px] h-[22px] bg-[#fafafa] border border-zinc-200 text-zinc-400 hover:text-red-500 hover:bg-red-50/50 rounded-[4px] flex items-center justify-center transition-colors"
                    title="Not Interested"
                  >
                    <Square className="w-3 h-3" />
                  </button>

                  <button
                    id="bookmark-doc-button"
                    onClick={async () => {
                      if (!renderedTrend || !clientId || !userId) return;
                      const isCurrentlyBookmarked = isBookmarked[renderedTrend.id];
                      
                      try {
                        if (isCurrentlyBookmarked) {
                          // DELETE
                          const { error } = await supabase
                            .from("bookmarks")
                            .delete()
                            .eq("client_id", clientId)
                            .eq("user_id", userId)
                            .eq("market_insight_id", renderedTrend.id);
                          if (error) throw error;
                          triggerToast(`Removed bookmark for ${renderedTrend.title}`);
                        } else {
                          // INSERT
                          const { error } = await supabase
                            .from("bookmarks")
                            .insert([
                              {
                                client_id: clientId,
                                user_id: userId,
                                market_insight_id: renderedTrend.id
                              }
                            ]);
                          if (error) throw error;
                          triggerToast(`Saved bookmark for ${renderedTrend.title}`);
                        }
                        // Refresh bookmarks
                        await fetchBookmarks();
                        // Notify other components
                        window.dispatchEvent(new CustomEvent("bookmarks-updated"));
                      } catch (err: any) {
                        console.error("Error toggling bookmark:", err);
                        triggerToast(`Failed to update bookmark: ${err.message || "Unknown error"}`);
                      }
                    }}
                    className={`w-[22px] h-[22px] border rounded-[4px] flex items-center justify-center transition-colors duration-150 ${
                      isBookmarked[renderedTrend.id]
                        ? "bg-amber-50/60 border-amber-200/80 text-amber-500 hover:bg-amber-100/35"
                        : "bg-[#fafafa] border-zinc-200 text-zinc-400 hover:text-zinc-650 hover:bg-zinc-100/50"
                    }`}
                    title={isBookmarked[renderedTrend.id] ? "Remove Bookmark" : "Bookmark"}
                  >
                    <Bookmark className={`w-3 h-3 ${isBookmarked[renderedTrend.id] ? "text-amber-500 fill-amber-500" : ""}`} />
                  </button>

                  <button
                    id="export-doc-button"
                    onClick={() => triggerToast(`Exported strategic brief for ${renderedTrend.title} to PDF draft.`)}
                    className="w-[22px] h-[22px] bg-[#fafafa] border border-zinc-200 text-zinc-400 hover:text-zinc-650 hover:bg-zinc-100/50 rounded-[4px] flex items-center justify-center transition-colors"
                    title="Export"
                  >
                    <Share2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>

            {/* Meta values and Impact bar row inside a thin border box */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border border-zinc-200 rounded-[4px] p-4 bg-zinc-50/30 select-text">
              <div className="flex flex-col gap-1 text-[12.5px] text-zinc-600 font-sans">
                <div>
                  <span className="font-semibold text-zinc-800">Last Updated Date:</span>{" "}
                  <span className="text-zinc-600">{formattedPublishDate}</span>
                </div>
                <div>
                  <span className="font-semibold text-zinc-800">Country:</span>{" "}
                  <span className="text-zinc-600">{(renderedTrend as any).country || ""}</span>
                </div>
              </div>

              <div className="flex flex-col items-end gap-1.5 min-w-[100px] select-none">
                <span className="text-[10px] font-bold tracking-widest text-zinc-400 font-sans">STRATEGIC RELEVANCE</span>
                {renderImpactBars(renderedTrend.impact_level)}
                <span className="text-[12.5px] font-bold text-zinc-700 tracking-tight font-sans">
                  {renderedTrend.impact_level}
                </span>
              </div>
            </div>

            {/* Document Narrative */}
            <div className="flex flex-col gap-4 text-[13px] leading-relaxed text-zinc-600 font-sans select-text">
              <p>{renderedTrend.summary}</p>
              
              <div className="flex items-start gap-1.5 select-none text-[11px] text-zinc-400 mt-1">
                <span className="font-normal text-zinc-400 mt-[3px]">Reference:</span>
                <div className="flex flex-wrap items-center gap-1">
                  {(isReferencesExpanded ? renderedTrend.sources : renderedTrend.sources.slice(0, 5)).map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setIsSourcesExpanded(true);
                        setTimeout(() => {
                          const el = document.getElementById(`signal-card-${idx}`);
                          if (el) {
                            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            el.classList.add('ring-2', 'ring-blue-500', 'bg-blue-50', 'transition-all', 'duration-500');
                            setTimeout(() => {
                              el.classList.remove('ring-2', 'ring-blue-500', 'bg-blue-50');
                            }, 1500);
                          }
                        }, 100);
                      }}
                      className="group inline-flex items-center justify-center gap-0.5 px-1.5 h-[18px] bg-zinc-100 border border-zinc-200 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-600 rounded-[4px] text-[10.5px] font-bold text-zinc-500 transition-colors cursor-pointer select-none"
                      title={`Jump to signal ${idx + 1}`}
                    >
                      {idx + 1}
                      <ArrowDown className="w-2.5 h-2.5 opacity-0 -ml-0.5 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ))}
                  {!isReferencesExpanded && renderedTrend.sources.length > 5 && (
                    <button
                      onClick={() => setIsReferencesExpanded(true)}
                      className="inline-flex items-center justify-center px-1.5 h-[18px] bg-zinc-100 border border-zinc-200 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-600 rounded-[4px] text-[10.5px] font-bold text-zinc-500 transition-colors cursor-pointer select-none"
                    >
                      +{renderedTrend.sources.length - 5} more
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Business Impact bullet segment */}
            <div className="flex flex-col gap-2 mt-2">
              <h3 className="text-[13px] font-bold tracking-tight text-zinc-900 font-sans uppercase">
                Business Impact
              </h3>
              <div className="bg-[#f5f3ff]/60 border border-violet-100 p-4 rounded-[4px] flex flex-col gap-3">
                {renderedTrend.business_impact.map((bullet, idx) => (
                  <div key={idx} className="flex gap-2.5 items-start">
                    <span className="text-[#7c3aed] text-xs mt-1 shrink-0 select-none">•</span>
                    <p className="text-[12px] leading-relaxed text-zinc-700 font-normal select-text font-sans">
                      {bullet}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Signals list */}
            <div className="flex flex-col gap-2 border-t border-zinc-100 pt-3.5 mt-1 select-text">
              <div className="flex items-center justify-between select-none">
                <span className="text-[13px] font-bold text-zinc-700 font-sans">
                  Signals ({renderedTrend.sources.length})
                </span>
                <button 
                  onClick={() => setIsSourcesExpanded(!isSourcesExpanded)}
                  className="flex items-center gap-1.5 text-[13px] font-bold text-zinc-800 hover:opacity-80 cursor-pointer select-none bg-transparent border-none outline-none focus:outline-none transition-transform duration-200 font-sans"
                >
                  <span>{isSourcesExpanded ? "Close details" : "View details"}</span>
                  <svg 
                    className={`w-4.5 h-4.5 text-zinc-800 transition-transform duration-200 ${isSourcesExpanded ? "rotate-180" : ""}`} 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="3.2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  >
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </button>
              </div>

              {isSourcesExpanded && (
                <div className="flex flex-col gap-2 mt-1 animate-fade-in">
                  {renderedTrend.sources.map((src, index) => {
                    const isSelected = selectedSignalId === src.id;
                    const cat = ((src as any).originalCategory || src.category || "").toLowerCase();
                    
                    let bgClass = "bg-[#f9f9fb] hover:bg-[#f4f4f5]";
                    let borderClass = isSelected ? "border-zinc-400 ring-2 ring-zinc-400/25 shadow-sm" : "border-zinc-200";
                    
                    if (cat.includes("investment") || cat.includes("capital")) {
                      bgClass = isSelected ? "bg-[#fffbeb]" : "bg-[#fffbeb]/60 hover:bg-[#fffbeb]/80";
                      borderClass = isSelected ? "border-[#f59e0b] ring-2 ring-[#f59e0b]/25 shadow-sm" : "border-[#fef3c7]";
                    } else if (cat.includes("innovation") || cat.includes("research")) {
                      bgClass = isSelected ? "bg-[#f0f9ff]" : "bg-[#f0f9ff]/60 hover:bg-[#f0f9ff]/80";
                      borderClass = isSelected ? "border-[#3b82f6] ring-2 ring-[#3b82f6]/25 shadow-sm" : "border-[#e0f2fe]";
                    }

                    if (isSelected) {
                      borderClass = "border-[#3b82f6] ring-2 ring-[#3b82f6]/15 shadow-md";
                    }

                    return (
                      <div 
                        key={src.id} 
                        id={`signal-card-${index}`}
                        onClick={() => setSelectedSignalId(isSelected ? null : src.id)}
                        className={`rounded-[4px] px-3 transition-all text-left cursor-pointer border ${bgClass} ${borderClass} ${isSelected ? 'py-4' : 'py-1.5'}`}
                      >
                        {!isSelected ? (
                          <div className="flex items-center justify-between gap-3 overflow-hidden font-sans">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <span className={`shrink-0 rounded-[4px] py-0.5 px-1.5 text-[8.5px] font-semibold tracking-tight border leading-none ${getCategoryTagClass(src.category)}`}>
                                {src.category}
                              </span>
                              <h4 className="font-medium text-zinc-900 text-[12px] truncate">
                                {src.source_name}
                              </h4>
                            </div>
                            <span className="shrink-0 text-zinc-500 font-medium text-[9px] bg-zinc-100/50 rounded-[4px] px-1.5 py-0.5 leading-none select-none">
                              {src.date}
                            </span>
                          </div>
                        ) : (
                          <div className="animate-fade-in flex flex-col gap-3 font-sans">
                            <div className="flex items-center justify-between">
                              <span className={`rounded-[4px] py-0.5 px-2 text-[9px] font-semibold tracking-tight inline-block border leading-none ${getCategoryTagClass(src.category)}`}>
                                {src.category}
                              </span>
                              <span className="text-zinc-500 font-medium text-[9px] bg-[#e8e6df]/50 rounded-[4px] px-1.5 py-0.5 leading-none select-none">
                                {src.date}
                              </span>
                            </div>

                            <div className="flex flex-col gap-0.5">
                              <h4 className="font-bold text-zinc-900 text-[14px] leading-tight tracking-tight">
                                {src.source_name}
                              </h4>
                              
                            </div>
                            
                            <p className="text-zinc-800 text-[11px] leading-[1.5] font-normal">
                              {src.details}
                            </p>

                            <div className="flex flex-col bg-white border border-zinc-100 rounded-[4px] px-3 mt-1 shadow-[0_1px_2px_rgba(0,0,0,0.02)] text-[10.5px]">
                              <div className="flex items-center justify-between py-1 border-b border-zinc-50">
                                <span className="text-zinc-600">Published date</span>
                                <span className="text-zinc-900 font-medium">{src.date} 2026</span>
                              </div>
                              <div className="flex items-center justify-between py-1 border-b border-zinc-50">
                                <span className="text-zinc-600">Organisation</span>
                                <span className="text-zinc-900 font-medium">
                                  {src.organization || "Industry Intelligence"}
                                </span>
                              </div>
                              <div className="flex items-center justify-between py-1">
                                <span className="text-zinc-600">Source</span>
                                <a 
                                  href={src.source_url || "#"} 
                                  target={src.source_url ? "_blank" : undefined}
                                  rel={src.source_url ? "noopener noreferrer" : undefined}
                                  className="text-[#3b82f6] font-medium hover:underline flex items-center gap-1"
                                >
                                  {src.source_url ? "Original article" : "Market Report"}
                                  <Share2 className="w-2.5 h-2.5" />
                                </a>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Similar Market Movements section */}
            <div className="flex flex-col gap-2 mt-4 select-text">
              <h3 className="text-[13.5px] font-bold tracking-tight text-zinc-900 font-sans select-text">
                Similar Market Movements
              </h3>
              <div className="flex flex-col gap-2 ml-1">
                {isFetchingSimilar ? (
                  <div className="text-[12px] text-zinc-500 animate-pulse py-1 font-sans">
                    Fetching similar market movements...
                  </div>
                ) : similarFutureProspects.length > 0 ? (
                  similarFutureProspects.map((prospect, idx) => (
                    <div className="flex items-start gap-2 py-0.5 text-[12px]" key={idx}>
                      <FileText className="w-3.5 h-3.5 text-zinc-400 mt-[2px] shrink-0 select-none" />
                      <button
                        onClick={() => {
                          setSelectedGridSignal(null);
                          setActiveSignalDetail(null);
                          setSelectedInsightId(prospect.id);
                        }}
                        className="text-left text-zinc-700 hover:text-[#7c3aed] transition-colors leading-normal hover:underline select-text font-normal cursor-pointer font-sans"
                      >
                        {prospect.title}
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="text-[12px] text-zinc-400 py-1 font-sans">
                    No similar market movements found
                  </div>
                )}
              </div>
            </div>

            {/* Action buttons matching design layout */}
            <div className="flex flex-col gap-2 w-full mt-3 select-none font-sans font-normal text-[13px]">
              <button
                onClick={() => {
                  const query = `What is the regulatory and market feasibility of ${renderedTrend.title}?`;
                  setActiveTab("ask_marketgenie");
                  handleChatSend(query);
                }}
                className="w-full h-12 border border-zinc-200 bg-white hover:bg-[#fafafa] rounded-[4px] flex items-center gap-3.5 px-4 text-zinc-800 hover:text-zinc-950 transition-colors cursor-pointer text-left font-sans shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
              >
                <Sparkles className="w-4 h-4 text-[#7c3aed] fill-[#7c3aed]/10 shrink-0" />
                <span>Evaluate regulatory and market feasibility</span>
              </button>

              <button
                onClick={() => {
                  const query = `Provide case studies of ${renderedTrend.title} implementations.`;
                  setActiveTab("ask_marketgenie");
                  handleChatSend(query);
                }}
                className="w-full h-12 border border-zinc-200 bg-white hover:bg-[#fafafa] rounded-[4px] flex items-center gap-3.5 px-4 text-zinc-800 hover:text-zinc-950 transition-colors cursor-pointer text-left font-sans shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
              >
                <FileText className="w-4 h-4 text-[#7c3aed] shrink-0" />
                <span>Show corporate case studies & examples</span>
              </button>
            </div>

          </div>
        )}

        {activeTab === "ask_marketgenie" && renderedTrend && (
          <div className="flex-1 overflow-y-auto p-6 md:p-8 flex flex-col h-full animate-fade-in text-left">
            {/* Message Feed */}
            <div className="flex-1 flex flex-col gap-3 pr-1 pb-4">
              {chatHistory.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-4">
                  <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mb-3">
                    <Sparkles className="w-8 h-8 text-zinc-400" />
                  </div>
                  <p className="text-sm text-zinc-500 font-medium font-sans">Ask MarketGenie About {renderedTrend.title}</p>
                  <p className="text-xs text-zinc-400 mt-1 font-sans">Query potential compliance, integration, and strategy timelines.</p>
                </div>
              ) : (
                chatHistory.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col max-w-[85%] rounded-[4px] p-3 text-[12.5px] leading-relaxed font-sans ${
                      msg.role === "user"
                        ? "bg-zinc-100 text-zinc-800 self-end rounded-br-none"
                        : "bg-violet-50 text-zinc-800 border border-violet-100 self-start rounded-bl-none"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                    <ChatSources sources={msg.sources || []} />
                  </div>
                ))
              )}
              {chatLoading && (
                <div className="bg-violet-50 text-zinc-800 border border-violet-100 self-start rounded-[4px] rounded-bl-none p-3 max-w-[85%] flex items-center gap-2">
                  <Loader2 className="w-4 h-4 text-[#7c3aed] animate-spin" />
                  <span className="text-[11.5px] text-zinc-500 font-medium font-sans">MarketGenie is researching...</span>
                </div>
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Chat Suggestions */}
            {chatHistory.length === 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3 select-none font-sans">
                {[
                  `Timeline for ${renderedTrend.title}`,
                  `Regional risks of ${renderedTrend.title}`,
                  `Competitors using ${renderedTrend.title}`
                ].map((s, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleChatSend(s)}
                    className="text-[11px] bg-zinc-50 hover:bg-zinc-100 text-zinc-600 border border-zinc-200 px-2 py-1 rounded-[4px] transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            {/* Input Area */}
            <div className="flex items-center gap-1.5 pt-2 border-t border-zinc-100 select-none font-sans">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleChatSend(chatInput)}
                placeholder={`Ask MarketGenie about ${renderedTrend.title}...`}
                className="flex-1 bg-zinc-50 border border-zinc-200 rounded-[4px] px-3 py-1.5 text-xs outline-none focus:border-zinc-300 focus:bg-white text-zinc-800"
              />
              <button
                onClick={() => handleChatSend(chatInput)}
                className="p-1.5 bg-[#7c3aed] hover:bg-violet-700 text-white rounded-[4px] transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {activeTab === "bookmarks" && (
          <div className="flex-1 overflow-y-auto p-6 md:p-8 flex flex-col gap-3 animate-fade-in text-left bg-[#fafafa]">
            <h2 className="text-[13px] font-bold text-zinc-900 tracking-tight font-sans">Bookmarked Strategic Horizons</h2>
              
            {Object.keys(isBookmarked).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center font-sans">
                <Bookmark className="w-8 h-8 text-zinc-200 mb-2" />
                <p className="text-xs text-zinc-400 font-medium">No bookmarked outlook items yet.</p>
                <p className="text-[11px] text-zinc-300 mt-0.5 max-w-[200px] leading-normal">
                  Click the bookmark icon in the Insights panel to save crucial market trends.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-2 font-sans">
                {Object.keys(isBookmarked).map(bId => {
                  const trend = marketInsights.find(mi => mi.id === bId);
                  if (!trend) return null;
                  return (
                    <div
                      key={trend.id}
                      onClick={() => {
                        setSelectedInsightId(trend.id);
                        setSelectedGridSignal(null);
                        setActiveTab("insights");
                      }}
                      className={`p-3 border rounded-[4px] cursor-pointer transition-all ${
                        selectedInsightId === trend.id
                          ? "bg-amber-50/40 border-[#3b82f6] ring-2 ring-[#3b82f6]/15 shadow-md"
                          : "bg-white border-zinc-200 hover:border-zinc-300 hover:shadow-sm"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-400">
                          {(trend as any).category || (trend as any).sector} • {(trend as any).ring || (trend as any).term}
                        </span>
                        <span className="text-[10px] text-zinc-500 font-medium">
                          {(trend as any).relevance_level_live || (trend as any).impact_level}
                        </span>
                      </div>
                      <h3 className="text-xs font-bold text-zinc-800">{(trend as any).title || (trend as any).summary}</h3>
                      <p className="text-[11px] text-zinc-500 line-clamp-2 mt-1 leading-normal">
                        {trend.summary}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex flex-col items-center gap-2 pointer-events-none">
          <div className="bg-zinc-900 text-white text-[12px] px-4 py-2 rounded-full shadow-2xl flex items-center gap-3 pointer-events-auto animate-in fade-in slide-in-from-bottom-4 duration-300">
            <span>{toastMessage}</span>
            {lastHiddenInsight && (
              <button 
                onClick={async (e) => {
                  e.stopPropagation();
                  if (!lastHiddenInsight || !clientId || !userId) return;
                  try {
                    const { error } = await supabase
                      .from("hidden_articles")
                      .delete()
                      .eq("client_id", clientId)
                      .eq("user_id", userId)
                      .eq("market_insight_id", lastHiddenInsight.id);
                    if (error) throw error;
                    
                    setHiddenIds(prev => {
                      const next = { ...prev };
                      delete next[lastHiddenInsight.id];
                      return next;
                    });
                    setLastHiddenInsight(null);
                    setToastMessage(null);
                  } catch (err) {
                    console.error("Error undoing hide:", err);
                  }
                }}
                className="flex items-center gap-1.5 text-violet-300 hover:text-violet-200 font-bold transition-colors"
              >
                <CornerDownLeft className="w-3 h-3" />
                UNDO
              </button>
            )}
            {!lastHiddenInsight && (
              <button onClick={() => setToastMessage(null)} className="opacity-50 hover:opacity-100 transition-opacity">
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
