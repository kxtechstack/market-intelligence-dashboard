import React, { useState, useMemo, useEffect } from "react";
import { Filter, Search, ChevronDown, ChevronUp, ArrowUp, ArrowDown, ArrowRight, X, Bookmark, Share2, Square, CornerDownRight } from "lucide-react";
import { supabase } from "../lib/supabase";

interface CompetitiveRadarPaneProps {
  onReturn?: () => void;
  onSwitchToDecisionIntelligence?: (query: string, tab: string, label: string, returnLabel: string) => void;
  clientId?: string;
}

export interface StrategicShiftSignal {
  sub_category?: string;
  competitor?: string;
  title?: string;
  date?: string;
  summary?: string;
  source_kind?: string;
  source_domain?: string;
  url?: string;
  key_facts?: string[];
}

export interface CompetitorStrategicShift {
  rank: number;
  category: string;
  title: string;
  summary: string;
  business_impact: string[] | null;
  importance: string;
  competitors: Array<{ competitor: string } | string> | null;
  signal_count: number;
  latest_date: string | null;
  written_at: string | null;
  signals: StrategicShiftSignal[] | null;
}

interface ChangeItem {
  id: string;
  category: string;
  competitor: string;
  title: string;
  description: string;
  date: string;
  signals: number;
}

export interface CompetitorActivityTypeTotal {
  category: string;
  total_30d: number;
  trend: "up" | "down" | "same" | string;
  sort_order: number;
}

export interface CompetitorActivityLiveRow {
  competitor_id: string;
  category: string;
  count_30d: number;
  badge_level?: "low" | "medium" | "high" | "none" | string;
}

export interface LiveCompetitorChange {
  id: string;
  competitor_id: string;
  organization: string;
  category: string;
  signal_name: string;
  signal_title: string;
  summary: string;
  business_impact: string[] | null;
  importance: string;
  signal_count: number;
  last_signal_at: string | null;
  event_date: string | null;
}

export interface LiveCompetitorSignal {
  id: string;
  change_id: string;
  signal_title: string;
  summary: string;
  category: string;
  signal_name: string;
  event_date: string | null;
  published_date: string | null;
  url: string | null;
  source_domain: string | null;
  source_kind: string | null;
  key_facts: string[] | null;
}

export interface CachedCompetitiveRadarData {
  changes: LiveCompetitorChange[];
  signals?: LiveCompetitorSignal[];
  totals: CompetitorActivityTypeTotal[];
  cells: CompetitorActivityLiveRow[];
  strategicShifts?: CompetitorStrategicShift[];
}

const PAGE_CACHE_KEY_PREFIX = "competitive_intelligence_";
const memoryCache = new Map<string, CachedCompetitiveRadarData>();

function getStorageKey(cid: string): string {
  return `${PAGE_CACHE_KEY_PREFIX}${cid}`;
}

function getCachedData(clientId: string | null): CachedCompetitiveRadarData | null {
  if (!clientId) return null;
  if (memoryCache.has(clientId)) {
    return memoryCache.get(clientId)!;
  }
  try {
    if (typeof window !== "undefined" && window.sessionStorage) {
      const raw = window.sessionStorage.getItem(getStorageKey(clientId));
      if (raw) {
        const parsed = JSON.parse(raw) as CachedCompetitiveRadarData;
        memoryCache.set(clientId, parsed);
        return parsed;
      }
    }
  } catch {
    // ignore sessionStorage errors
  }
  return null;
}

function saveCachedData(clientId: string | null, data: CachedCompetitiveRadarData): void {
  if (!clientId) return;
  memoryCache.set(clientId, data);
  try {
    if (typeof window !== "undefined" && window.sessionStorage) {
      window.sessionStorage.setItem(getStorageKey(clientId), JSON.stringify(data));
    }
  } catch {
    // ignore sessionStorage quota errors
  }
}




const getCategoryTagClass = (category: string) => {
  const cat = (category || "").toLowerCase();
  if (cat.includes("investment") || cat.includes("capital") || cat.includes("m&a")) {
    return "bg-[#fffbeb] border border-[#fde68a] text-[#78350f]";
  }
  if (cat.includes("innovation") || cat.includes("product") || cat.includes("technology") || cat.includes("launch")) {
    return "bg-emerald-50 border border-emerald-200 text-emerald-800";
  }
  if (cat.includes("pricing") || cat.includes("promotion")) {
    return "bg-amber-50 border border-amber-200 text-amber-800";
  }
  if (cat.includes("bundl") || cat.includes("packag")) {
    return "bg-blue-50 border border-blue-200 text-blue-800";
  }
  if (cat.includes("market") || cat.includes("campaign")) {
    return "bg-purple-50 border border-purple-200 text-purple-800";
  }
  if (cat.includes("brand") || cat.includes("position")) {
    return "bg-indigo-50 border border-indigo-200 text-indigo-800";
  }
  if (cat.includes("partner") || cat.includes("alliance")) {
    return "bg-teal-50 border border-teal-200 text-teal-800";
  }
  if (cat.includes("leadership") || cat.includes("org")) {
    return "bg-rose-50 border border-rose-200 text-rose-800";
  }
  if (cat.includes("regulatory") || cat.includes("compliance")) {
    return "bg-purple-50 border border-purple-200 text-purple-800";
  }
  return "bg-slate-50 border border-slate-200 text-slate-800";
};

const getCompetitorTagClass = (competitor: string) => {
  const comp = (competitor || "").toLowerCase();
  if (comp.includes("ibm")) {
    return "bg-blue-50 border border-blue-200 text-blue-800";
  }
  if (comp.includes("accenture")) {
    return "bg-purple-50 border border-purple-200 text-purple-800";
  }
  if (comp.includes("infosys")) {
    return "bg-emerald-50 border border-emerald-200 text-emerald-800";
  }
  if (comp.includes("microsoft")) {
    return "bg-amber-50 border border-amber-200 text-amber-800";
  }
  if (comp.includes("shiseido")) {
    return "bg-rose-50 border border-rose-200 text-rose-800";
  }
  if (comp.includes("estée") || comp.includes("estee")) {
    return "bg-indigo-50 border border-indigo-200 text-indigo-800";
  }
  if (comp.includes("ysl") || comp.includes("yves")) {
    return "bg-amber-50 border border-amber-200 text-amber-800";
  }
  if (comp.includes("lancôme") || comp.includes("lancome")) {
    return "bg-violet-50 border border-violet-200 text-violet-800";
  }
  return "bg-indigo-50 border border-indigo-200 text-indigo-800";
};

function formatCardDate(dateVal: string | null | undefined): string {
  if (!dateVal) return "";
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return String(dateVal);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      timeZone: "UTC",
    });
  } catch {
    return String(dateVal);
  }
}

function formatSignalDateShort(dateVal: string | null | undefined): string {
  if (!dateVal) return "";
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return String(dateVal);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    });
  } catch {
    return String(dateVal);
  }
}

function getFirstSentence(text: string | null | undefined): string {
  if (!text) return "";
  const trimmed = text.trim();
  const match = trimmed.match(/^.*?[.!?](?:\s|$)/);
  if (match) {
    return match[0].trim();
  }
  return trimmed;
}

function getSourceKindLabel(kind: string | null | undefined): string {
  if (!kind) return "Source";
  const k = kind.toLowerCase();
  if (k === "news") return "News";
  if (k === "press") return "Press release";
  if (k === "blog") return "Blog";
  if (k === "own_site") return "Company website";
  if (k === "product") return "Product page";
  return kind.charAt(0).toUpperCase() + kind.slice(1);
}

function getImportanceData(importance: string | null | undefined): { filledCount: number; label: string; barColor: string } {
  const imp = (importance || "Medium").trim().toLowerCase();
  if (imp === "critical") {
    return { filledCount: 4, label: "Critical", barColor: "bg-red-600" };
  }
  if (imp === "high") {
    return { filledCount: 3, label: "High", barColor: "bg-orange-500" };
  }
  if (imp === "medium") {
    return { filledCount: 2, label: "Medium", barColor: "bg-yellow-400" };
  }
  return { filledCount: 1, label: "Low", barColor: "bg-emerald-400" };
}

const getSignalBadgeClass = (signals: number) => {
  if (signals >= 8) {
    return "bg-[#fff1f2] text-[#be123c] border border-[#fecdd3]";
  }
  if (signals >= 5) {
    return "bg-[#fff7ed] text-[#c2410c] border border-[#fed7aa]";
  }
  if (signals >= 3) {
    return "bg-[#fefce8] text-[#a16207] border border-[#fef08a]";
  }
  return "bg-[#f0fdf4] text-[#15803d] border border-[#bbf7d0]";
};

function getCompetitorNames(competitors: Array<{ competitor: string } | string> | null | undefined): string[] {
  if (!Array.isArray(competitors)) return [];
  return competitors
    .map((c) => (typeof c === "string" ? c : c?.competitor))
    .filter((name): name is string => Boolean(name && name.trim()));
}

function formatSignalMonthDay(dateVal: string | null | undefined): string {
  if (!dateVal) return "";
  const trimmed = dateVal.trim();
  if (/^[A-Za-z]{3}\s+\d{1,2}$/.test(trimmed)) {
    return trimmed;
  }
  try {
    const d = new Date(trimmed);
    if (isNaN(d.getTime())) return trimmed;
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    });
  } catch {
    return trimmed;
  }
}

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

const formatSignalDate = (dateStr: string) => {
  if (!dateStr) return "";
  return dateStr.replace(/,\s*\d{4}/, "").trim();
};

export default function CompetitiveRadarPane({ onReturn, onSwitchToDecisionIntelligence, clientId }: CompetitiveRadarPaneProps) {
  const [activeTab, setActiveTab] = useState<string>("Overview");
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>("All time");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>("All");

  const effectiveClientId = clientId || null;

  // Retrieve any previously remembered data for this client from memory or sessionStorage
  const initialCache = useMemo(() => getCachedData(effectiveClientId), [effectiveClientId]);
  const hasCachedData = Boolean(
    initialCache && (initialCache.changes?.length > 0 || initialCache.totals?.length > 0 || (initialCache.strategicShifts && initialCache.strategicShifts.length > 0))
  );

  // Selected item for expanded right-side pane (Section 1 strategic shifts)
  const [selectedItem, setSelectedItem] = useState<CompetitorStrategicShift | null>(null);
  // Selected live competitor change (Section 3 competitor activity)
  const [selectedLiveCard, setSelectedLiveCard] = useState<LiveCompetitorChange | null>(null);
  
  const [strategicShifts, setStrategicShifts] = useState<CompetitorStrategicShift[]>(() => initialCache?.strategicShifts || []);
  const [liveChanges, setLiveChanges] = useState<LiveCompetitorChange[]>(() => initialCache?.changes || []);
  const [activityTypeTotals, setActivityTypeTotals] = useState<CompetitorActivityTypeTotal[]>(() => initialCache?.totals || []);
  const [activityLiveCells, setActivityLiveCells] = useState<CompetitorActivityLiveRow[]>(() => initialCache?.cells || []);

  // Card signals loaded on-demand for opened card (remembered per card id in memory)
  const [cardSignals, setCardSignals] = useState<LiveCompetitorSignal[]>([]);
  const [isCardSignalsLoading, setIsCardSignalsLoading] = useState<boolean>(false);
  const cardSignalsCache = React.useRef<Map<string, LiveCompetitorSignal[]>>(new Map());
  
  // Show skeleton only the very first time, when nothing is remembered yet
  const [isActivityLoading, setIsActivityLoading] = useState<boolean>(() => !hasCachedData && Boolean(effectiveClientId));
  const [isMatrixLoading, setIsMatrixLoading] = useState<boolean>(() => !hasCachedData && Boolean(effectiveClientId));
  const [activityError, setActivityError] = useState<string | null>(null);

  const liveDataRef = React.useRef<CachedCompetitiveRadarData>({
    changes: initialCache?.changes || [],
    totals: initialCache?.totals || [],
    cells: initialCache?.cells || [],
    strategicShifts: initialCache?.strategicShifts || [],
  });

  const [isBookmarked, setIsBookmarked] = useState<boolean>(false);
  const [isSourcesExpanded, setIsSourcesExpanded] = useState<boolean>(true);
  const [activeDetailTab, setActiveDetailTab] = useState<string>("insights");
  const [selectedSignalId, setSelectedSignalId] = useState<string | null>(null);
  const [expandedQuotesSignalIds, setExpandedQuotesSignalIds] = useState<Record<string, boolean>>({});

  // Close pane on Escape key
  const closeDrawer = () => {
    setSelectedLiveCard(null);
    setSelectedItem(null);
    setSelectedSignalId(null);
    setExpandedQuotesSignalIds({});
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeDrawer();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Load signals ONLY for the opened card (remembered per card id in memory)
  useEffect(() => {
    let isMounted = true;
    if (!selectedLiveCard?.id) {
      setCardSignals([]);
      setIsCardSignalsLoading(false);
      return;
    }

    const cached = cardSignalsCache.current.get(selectedLiveCard.id);
    if (cached) {
      setCardSignals(cached);
      setIsCardSignalsLoading(false);
      return;
    }

    setIsCardSignalsLoading(true);
    supabase
      .from("competitor_signals_live")
      .select("id, change_id, signal_title, summary, category, signal_name, event_date, published_date, url, source_domain, source_kind, key_facts")
      .eq("change_id", selectedLiveCard.id)
      .order("event_date", { ascending: false })
      .then((res) => {
        if (res.error) {
          console.error("Error loading card signals:", res.error);
        }
        if (isMounted) {
          const data = res.data || [];
          cardSignalsCache.current.set(selectedLiveCard.id, data);
          setCardSignals(data);
          setIsCardSignalsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [selectedLiveCard?.id]);

  // Initial page load: competitor_activity_type_totals, competitor_activity_live, competitor_strategic_shifts
  // (always last 30 days / not filtered by timeframe)
  useEffect(() => {
    let isMounted = true;
    if (!effectiveClientId) {
      setActivityTypeTotals([]);
      setActivityLiveCells([]);
      setStrategicShifts([]);
      setIsMatrixLoading(false);
      return;
    }

    const cached = getCachedData(effectiveClientId);
    if (cached) {
      setActivityTypeTotals(cached.totals || []);
      setActivityLiveCells(cached.cells || []);
      setStrategicShifts(cached.strategicShifts || []);
      setIsMatrixLoading(false);
      liveDataRef.current = { ...cached };
    } else {
      setIsMatrixLoading(true);
    }

    const persistLatest = () => {
      if (effectiveClientId) {
        saveCachedData(effectiveClientId, liveDataRef.current);
      }
    };

    // a) competitor_activity_type_totals (table rows + Total column)
    const pTotals = supabase
      .from("competitor_activity_type_totals")
      .select("category, total_30d, trend, sort_order")
      .eq("client_id", effectiveClientId)
      .order("sort_order")
      .then((res) => {
        if (res.error) throw res.error;
        if (isMounted) {
          const data = res.data || [];
          setActivityTypeTotals(data);
          setIsMatrixLoading(false);
          liveDataRef.current.totals = data;
          persistLatest();
        }
      });

    // b) competitor_activity_live (table blocks + competitor names)
    const pCells = (async () => {
      let liveRes: any = await supabase
        .from("competitor_activity_live")
        .select("competitor_id, competitor, category, count_30d, badge_level")
        .eq("client_id", effectiveClientId)
        .neq("category", "All");

      if (liveRes.error && (liveRes.error.code === "42703" || liveRes.error.message?.includes("badge_level"))) {
        liveRes = await supabase
          .from("competitor_activity_live")
          .select("competitor_id, competitor, category, count_30d")
          .eq("client_id", effectiveClientId)
          .neq("category", "All");
      }

      if (liveRes.error) throw liveRes.error;
      if (isMounted) {
        const data = liveRes.data || [];
        setActivityLiveCells(data);
        liveDataRef.current.cells = data;
        persistLatest();
      }
    })();

    // c) Strategic shifts (top section)
    const pShifts = supabase
      .from("competitor_strategic_shifts")
      .select("rank, category, title, summary, business_impact, importance, competitors, signal_count, latest_date, written_at, signals")
      .eq("client_id", effectiveClientId)
      .order("rank")
      .then((res) => {
        if (res.error) throw res.error;
        if (isMounted) {
          const data = (res.data as CompetitorStrategicShift[]) || [];
          setStrategicShifts(data);
          liveDataRef.current.strategicShifts = data;
          persistLatest();
        }
      });

    Promise.allSettled([pTotals, pCells, pShifts]).then(() => {
      if (isMounted) {
        setIsMatrixLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [effectiveClientId]);

  // Load competitor activity cards (competitor_changes_live)
  // Re-runs whenever effectiveClientId or selectedTimeframe changes
  useEffect(() => {
    let isMounted = true;
    if (!effectiveClientId) {
      setLiveChanges([]);
      setIsActivityLoading(false);
      return;
    }

    const cached = getCachedData(effectiveClientId);
    if (selectedTimeframe === "All time" && cached?.changes?.length) {
      setLiveChanges(cached.changes);
      setIsActivityLoading(false);
    } else {
      setIsActivityLoading(true);
    }
    setActivityError(null);

    let query = supabase
      .from("competitor_changes_live")
      .select("id, competitor_id, organization, category, signal_name, signal_title, summary, business_impact, importance, signal_count, last_signal_at, event_date")
      .eq("client_id", effectiveClientId)
      .order("last_signal_at", { ascending: false, nullsFirst: false })
      .order("event_date", { ascending: false });

    if (selectedTimeframe !== "All time") {
      const match = selectedTimeframe.match(/\d+/);
      if (match) {
        const days = parseInt(match[0], 10);
        if (!isNaN(days) && days > 0) {
          const d = new Date();
          d.setUTCDate(d.getUTCDate() - days);
          const dateStr = d.toISOString().split("T")[0];
          query = query.gte("last_signal_at", dateStr);
        }
      }
    }

    query.then((res) => {
      if (res.error) {
        console.error("Error loading competitor changes:", res.error);
        if (isMounted && (!cached?.changes || cached.changes.length === 0)) {
          setActivityError("Could not load competitor activity.");
        }
      }
      if (isMounted && res.data) {
        setLiveChanges(res.data);
        setIsActivityLoading(false);
        if (selectedTimeframe === "All time") {
          liveDataRef.current.changes = res.data;
          if (effectiveClientId) {
            saveCachedData(effectiveClientId, liveDataRef.current);
          }
        }
      } else if (isMounted) {
        setIsActivityLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [effectiveClientId, selectedTimeframe]);

  // Competitors for the matrix columns: distinct competitors from "WHO IS MOVING WHERE" data (activityLiveCells)
  // in returned order, plus any remaining competitors from live changes or strategic shifts (sorted A-Z)
  const tableCompetitors = useMemo(() => {
    const list: string[] = [];
    const seen = new Set<string>();

    activityLiveCells.forEach((cell) => {
      const org = (cell as any).competitor?.trim();
      if (org && !seen.has(org.toLowerCase())) {
        seen.add(org.toLowerCase());
        list.push(org);
      }
    });

    const extra: string[] = [];
    liveChanges.forEach((card) => {
      const org = card.organization?.trim();
      if (org && !seen.has(org.toLowerCase())) {
        seen.add(org.toLowerCase());
        extra.push(org);
      }
    });
    strategicShifts.forEach((shift) => {
      getCompetitorNames(shift.competitors).forEach((comp) => {
        const org = comp?.trim();
        if (org && !seen.has(org.toLowerCase())) {
          seen.add(org.toLowerCase());
          extra.push(org);
        }
      });
    });
    extra.sort((a, b) => a.localeCompare(b));

    return [...list, ...extra];
  }, [activityLiveCells, liveChanges, strategicShifts]);

  // Competitor tabs: "Overview" + tableCompetitors (so tabs and table columns are ALWAYS in the exact same order)
  const competitorTabs = useMemo(() => {
    return ["Overview", ...tableCompetitors];
  }, [tableCompetitors]);

  // Reset tab to Overview if active tab is no longer in competitorTabs
  useEffect(() => {
    if (activeTab !== "Overview" && !competitorTabs.includes(activeTab)) {
      setActiveTab("Overview");
    }
  }, [activeTab, competitorTabs]);

  // Mapping from competitor name to competitor_id
  const competitorNameToId = useMemo(() => {
    const map = new Map<string, string>();
    liveChanges.forEach((card) => {
      if (card.organization && card.competitor_id) {
        map.set(card.organization.trim().toLowerCase(), card.competitor_id);
      }
    });
    activityLiveCells.forEach((cell) => {
      const org = (cell as any).competitor;
      if (org && cell.competitor_id) {
        map.set(org.trim().toLowerCase(), cell.competitor_id);
      }
    });
    return map;
  }, [liveChanges, activityLiveCells]);

  // Matrix cells map: `${category.toLowerCase()}::${competitor_id}` -> CompetitorActivityLiveRow
  const activityCellMap = useMemo(() => {
    const map = new Map<string, CompetitorActivityLiveRow>();
    activityLiveCells.forEach((row) => {
      if (row.category && row.competitor_id) {
        map.set(`${row.category.toLowerCase()}::${row.competitor_id}`, row);
      }
    });
    return map;
  }, [activityLiveCells]);

  // Helper to sort categories: first categories in competitor_activity_type_totals, in sort_order, then any other category that has cards, A-Z
  const sortCategoriesWithTotals = (categories: string[]) => {
    const categoryOrderMap = new Map<string, number>();
    activityTypeTotals.forEach((t, idx) => {
      if (t.category && t.category.trim()) {
        categoryOrderMap.set(t.category.trim().toLowerCase(), t.sort_order ?? idx);
      }
    });

    return [...categories].sort((a, b) => {
      const rankA = categoryOrderMap.get(a.trim().toLowerCase());
      const rankB = categoryOrderMap.get(b.trim().toLowerCase());

      if (rankA !== undefined && rankB !== undefined) {
        if (rankA !== rankB) return rankA - rankB;
        return a.localeCompare(b);
      }
      if (rankA !== undefined) return -1;
      if (rankB !== undefined) return 1;

      return a.localeCompare(b);
    });
  };

  // Filter panel "All Categories" dropdown options: unique card.category values in group order
  const liveCardCategories = useMemo(() => {
    const catSet = new Set<string>();
    liveChanges.forEach((card) => {
      if (card.category && card.category.trim()) {
        catSet.add(card.category.trim());
      }
    });
    return sortCategoriesWithTotals(Array.from(catSet));
  }, [liveChanges, activityTypeTotals]);

  // Accordion state: by default, all categories are expanded
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [category]: !(prev[category] ?? true),
    }));
  };

  const hasActiveFilters = Boolean(
    searchQuery.trim() !== "" ||
    selectedCategoryFilter !== "All" ||
    selectedTimeframe !== "All time"
  );

  const resetFilters = () => {
    setSearchQuery("");
    setSelectedTimeframe("All time");
    setSelectedCategoryFilter("All");
  };

  // Filter Section 1 strategic shifts
  const filteredShifts = useMemo(() => {
    return strategicShifts.filter((shift) => {
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = (shift.title || "").toLowerCase().includes(query);
        const matchesDesc = (shift.summary || "").toLowerCase().includes(query);
        const matchesComp = getCompetitorNames(shift.competitors).some((c) =>
          c.toLowerCase().includes(query)
        );
        if (!matchesTitle && !matchesDesc && !matchesComp) {
          return false;
        }
      }
      return true;
    });
  }, [strategicShifts, searchQuery]);

  // Filter Section 3 live cards (show all cards returned, whatever their date)
  const filteredLiveChanges = useMemo(() => {
    return liveChanges.filter((item) => {
      if (activeTab !== "Overview" && item.organization.toLowerCase() !== activeTab.toLowerCase()) {
        return false;
      }
      if (selectedCategoryFilter !== "All" && item.category !== selectedCategoryFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = (item.signal_title || "").toLowerCase().includes(q);
        const matchSummary = (item.summary || "").toLowerCase().includes(q);
        const matchOrg = (item.organization || "").toLowerCase().includes(q);
        const matchCat = (item.category || "").toLowerCase().includes(q);
        if (!matchTitle && !matchSummary && !matchOrg && !matchCat) {
          return false;
        }
      }
      return true;
    });
  }, [liveChanges, activeTab, selectedCategoryFilter, searchQuery]);

  // Group filtered cards by card.category
  const liveChangesByCategory = useMemo(() => {
    const map = new Map<string, LiveCompetitorChange[]>();
    filteredLiveChanges.forEach((item) => {
      const cat = item.category || "General Updates";
      const list = map.get(cat) || [];
      list.push(item);
      map.set(cat, list);
    });
    return map;
  }, [filteredLiveChanges]);

  // Order categories: first the categories in competitor_activity_type_totals, in sort_order, then any other category that has cards, A-Z
  const orderedCategories = useMemo(() => {
    const categoriesPresent = Array.from(liveChangesByCategory.keys());
    return sortCategoriesWithTotals(categoriesPresent);
  }, [liveChangesByCategory, activityTypeTotals]);

  // Similar Market Movements: up to 3 OTHER cards from the same data with the same card.category (newest first)
  const similarLiveCards = useMemo(() => {
    if (!selectedLiveCard) return [];
    return liveChanges
      .filter((c) => c.category === selectedLiveCard.category && c.id !== selectedLiveCard.id)
      .slice(0, 3);
  }, [selectedLiveCard, liveChanges]);

  // Signals behind currently selected card (loaded on demand for selectedLiveCard)
  const activeCardSignals = cardSignals;


  return (
    <div
      id="competitive-radar-dashboard"
      className="flex-1 h-full flex bg-white divide-x divide-zinc-200 overflow-hidden relative"
    >
      {/* Boxed Column Container - Matching Market Dynamics Container Width & Borders */}
      <div
        id="competitive-radar-column"
        className="h-full flex flex-col bg-white flex-shrink-0 animate-fade-in w-full max-w-[1178px] mx-auto flex-1 border-x border-zinc-200"
      >
        {/* Header section */}
        <div
          id="competitive-radar-header"
          className="h-[53px] px-4 border-b border-zinc-100 flex items-center justify-between flex-shrink-0 bg-white"
        >
          <div className="flex items-center gap-4">
            <h2
              id="competitive-radar-heading-title"
              style={{ fontFamily: "'Source Serif 4', Georgia, Cambria, 'Times New Roman', Times, serif" }}
              className="text-[19px] font-semibold tracking-tight text-zinc-900 select-none font-serif-source"
            >
              Competitive Intelligence
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
                onClick={resetFilters}
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
                  onClick={resetFilters}
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
                placeholder="Search Competitive Intelligence..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs bg-transparent text-zinc-800 outline-none placeholder:text-zinc-400"
              />
              {searchQuery && (
                <button
                  type="button"
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

              {/* Category Filter Dropdown */}
              <div className="flex items-center gap-2 select-none">
                <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider font-sans">
                  Category
                </span>
                <select
                  value={selectedCategoryFilter}
                  onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                  className="text-[10px] border border-zinc-200 bg-white rounded-[4px] px-2 py-1 text-zinc-700 outline-none focus:border-zinc-300 cursor-pointer"
                >
                  <option value="All">All Categories</option>
                  {liveCardCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Competitor Navigation Tabs Bar */}
        <div className="px-4 pt-2 pb-2 border-b border-zinc-100 bg-white flex-shrink-0 z-10 flex flex-col gap-1.5">
          <div className="overflow-x-auto max-w-full pb-0.5 scrollbar-none">
            <div className="inline-flex items-center p-0.5 bg-zinc-100 rounded-[8px] border border-zinc-200">
              {competitorTabs.map((tab) => {
                const isSelected = activeTab === tab;
                return (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-1.5 text-[12px] font-medium rounded-[6px] whitespace-nowrap transition-all cursor-pointer ${
                      isSelected
                        ? "bg-white text-zinc-900 shadow-sm font-semibold"
                        : "text-zinc-500 hover:text-zinc-800"
                    }`}
                  >
                    {tab}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Main scrollable body, blurred when item is selected */}
        <div
          className={`relative flex-1 overflow-y-auto px-0 py-0 flex flex-col w-full pb-8 transition-all duration-300 ${
            (selectedLiveCard || selectedItem) ? "blur-sm" : ""
          }`}
        >
          {/* Overlay to catch clicks and close pane */}
          {(selectedLiveCard || selectedItem) && (
            <div
              className="absolute inset-0 z-50 bg-transparent cursor-pointer"
              onClick={closeDrawer}
              title="Click outside to close"
            />
          )}

          {/* SECTION 1: STRATEGIC SHIFTS */}
          {activeTab === "Overview" && filteredShifts.length > 0 && (
            <section className="w-full flex flex-col">
              <div className="px-4 pt-2.5 pb-1">
                <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest font-sans">
                  Strategic Shifts
                </span>
              </div>

              <div className="w-full px-4 py-1.5 bg-[#fbfbfd] border-y border-zinc-200/80 border-l-[3.5px] border-l-[#2d39d2] flex items-center justify-between">
                <h3 className="text-[13px] font-semibold text-[#2d39d2] tracking-tight font-sans">
                  High-level changes across competitors
                </h3>
                <span className="text-[11.5px] font-normal text-zinc-500">
                  {filteredShifts.length} {filteredShifts.length === 1 ? "item" : "items"}
                </span>
              </div>

              <div className="w-full flex flex-col divide-y divide-zinc-200/80 border-b border-zinc-200/80 bg-white">
                {filteredShifts.map((shift) => {
                  const isSelected = selectedItem?.rank === shift.rank;
                  return (
                    <div
                      key={shift.rank || shift.title}
                      onClick={() => setSelectedItem(shift)}
                      className={`px-4 py-1.5 transition-colors flex items-start justify-between gap-4 cursor-pointer group ${
                        isSelected
                          ? "bg-[#eef1fe]/40 border-l-[3.5px] border-l-[#2d39d2]"
                          : "hover:bg-zinc-50/70"
                      }`}
                    >
                      <div className="space-y-1 flex-1">
                        <h4 className="text-[13px] font-semibold text-zinc-900 group-hover:text-black leading-snug">
                          {shift.title}
                        </h4>
                        <p className="text-[12px] text-zinc-600 font-[350] leading-normal">
                          {getFirstSentence(shift.summary)}
                        </p>

                        <div className="flex items-center gap-1.5 pt-0.5 flex-wrap">
                          {getCompetitorNames(shift.competitors).map((comp) => (
                            <button
                              key={comp}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveTab(comp);
                              }}
                              className={`inline-flex items-center px-2 py-0.5 rounded-[4px] text-[10px] font-medium transition-colors cursor-pointer ${getCompetitorTagClass(
                                comp
                              )}`}
                            >
                              {comp}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="text-right shrink-0 flex flex-col items-end gap-1 pt-0.5">
                        <span className="text-[11px] text-zinc-500 font-normal">
                          {formatCardDate(shift.latest_date)}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-[4px] text-[10px] font-medium shrink-0 whitespace-nowrap ${getSignalBadgeClass(
                            shift.signal_count
                          )}`}
                        >
                          {shift.signal_count} {shift.signal_count === 1 ? "signal" : "signals"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* SECTION 2: WHO IS MOVING WHERE */}
          {activeTab === "Overview" && selectedCategoryFilter === "All" && (
            <section className="w-full flex flex-col">
              <div className="px-4 pt-3 pb-1">
                <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest font-sans">
                  Who is moving where · last 30 days
                </span>
              </div>

              {isMatrixLoading ? (
                <div className="w-full overflow-x-auto border-y border-zinc-200/80 bg-white">
                  <table className="w-full text-left border-collapse animate-pulse">
                    <thead>
                      <tr className="border-b border-zinc-200/80 bg-zinc-50/60 text-[11px] font-medium text-zinc-600">
                        <th className="py-1.5 px-4 font-medium">Change type</th>
                        {tableCompetitors.length > 0 ? (
                          tableCompetitors.map((comp) => (
                            <th key={comp} className="py-1.5 px-3 text-center font-medium">
                              {comp}
                            </th>
                          ))
                        ) : (
                          [1, 2, 3, 4].map((colIdx) => (
                            <th key={colIdx} className="py-1.5 px-3 text-center font-medium">
                              <div className="h-3 w-16 mx-auto bg-zinc-200/70 rounded" />
                            </th>
                          ))
                        )}
                        <th className="py-1.5 px-4 text-right font-medium">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 text-[12px]">
                      {[1, 2, 3, 4, 5].map((idx) => (
                        <tr key={idx}>
                          <td className="py-2.5 px-4">
                            <div className="h-3 w-32 bg-zinc-200/70 rounded" />
                          </td>
                          {(tableCompetitors.length > 0 ? tableCompetitors : [1, 2, 3, 4]).map((c, cIdx) => (
                            <td key={cIdx} className="py-2.5 px-3 text-center">
                              <div className="h-4 w-5 mx-auto bg-zinc-100 rounded" />
                            </td>
                          ))}
                          <td className="py-2.5 px-4 text-right">
                            <div className="h-3 w-6 ml-auto bg-zinc-200/70 rounded" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : activityTypeTotals.length === 0 ? (
                <div className="w-full py-8 text-center text-[12.5px] text-zinc-500 border-y border-zinc-200/80 bg-white font-sans">
                  No competitor activity yet.
                </div>
              ) : (
                <div className="w-full overflow-x-auto border-y border-zinc-200/80 bg-white">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-zinc-200/80 bg-zinc-50/60 text-[11px] font-medium text-zinc-600">
                        <th className="py-1.5 px-4 font-medium">Change type</th>
                        {tableCompetitors.map((comp) => (
                          <th key={comp} className="py-1.5 px-3 text-center font-medium">
                            {comp}
                          </th>
                        ))}
                        <th className="py-1.5 px-4 text-right font-medium">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 text-[12px]">
                      {activityTypeTotals.map((row) => (
                        <tr
                          key={row.category}
                          onClick={() => {
                            setExpandedCategories((prev) => ({
                              ...prev,
                              [row.category]: true,
                            }));
                            const el = document.getElementById(`category-${row.category}`);
                            if (el) {
                              el.scrollIntoView({ behavior: "smooth", block: "center" });
                            }
                          }}
                          className="hover:bg-zinc-50/60 transition-colors cursor-pointer"
                        >
                          <td className="py-1.5 px-4 font-normal text-zinc-900">
                            {row.category}
                          </td>
                          {tableCompetitors.map((comp) => {
                            const compId = competitorNameToId.get(comp.toLowerCase());
                            const cellRow = compId ? activityCellMap.get(`${row.category.toLowerCase()}::${compId}`) : undefined;
                            const badgeLevel = (cellRow?.badge_level || (cellRow?.count_30d ? (cellRow.count_30d >= 3 ? "high" : cellRow.count_30d >= 2 ? "medium" : "low") : "none")).toLowerCase().trim();

                            if (!cellRow || badgeLevel === "none" || cellRow.count_30d <= 0) {
                              return (
                                <td key={comp} className="py-1.5 px-3 text-center">
                                  <span className="text-zinc-400">–</span>
                                </td>
                              );
                            }

                            let badgeColorClass = "bg-[#ecfdf5] border-[#a7f3d0] text-[#047857]"; // low
                            if (badgeLevel === "medium") {
                              badgeColorClass = "bg-[#fff7ed] border-[#fed7aa] text-[#c2410c]";
                            } else if (badgeLevel === "high") {
                              badgeColorClass = "bg-[#fef2f2] border-[#fecaca] text-[#b91c1c]";
                            }

                            return (
                              <td key={comp} className="py-1.5 px-3 text-center">
                                <span
                                  className={`inline-block min-w-[20px] text-center px-1.5 py-0.5 rounded-[3px] text-[10.5px] font-medium border ${badgeColorClass}`}
                                >
                                  {cellRow.count_30d}
                                </span>
                              </td>
                            );
                          })}
                          <td className="py-1.5 px-4 text-right font-medium text-zinc-900">
                            <div className="inline-flex items-center justify-end gap-1.5">
                              <span>{row.total_30d}</span>
                              {row.trend === "up" && (
                                <span title="More signals compared to last 30 days" className="inline-flex items-center">
                                  <ArrowUp
                                    className="w-3 h-3 text-emerald-600 shrink-0"
                                    strokeWidth={2.4}
                                  />
                                </span>
                              )}
                              {row.trend === "down" && (
                                <span title="Fewer signals compared to last 30 days" className="inline-flex items-center">
                                  <ArrowDown
                                    className="w-3 h-3 text-rose-600 shrink-0"
                                    strokeWidth={2.4}
                                  />
                                </span>
                              )}
                              {(row.trend === "same" || row.trend === "straight") && (
                                <span title="Same signals compared to last 30 days" className="inline-flex items-center">
                                  <ArrowRight
                                    className="w-3 h-3 text-zinc-400 shrink-0"
                                    strokeWidth={2.4}
                                  />
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}

          {/* SECTION 3: COMPETITOR ACTIVITY */}
          <section className="w-full flex flex-col">
            <div className="px-4 pt-3 pb-1">
              <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest font-sans">
                Competitor Activity
              </span>
            </div>

            {/* Loading state */}
            {isActivityLoading && (
              <div className="w-full py-8 flex flex-col items-center justify-center gap-2 text-zinc-500 border-y border-zinc-200/80 bg-white">
                <div className="w-5 h-5 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin" />
                <span className="text-[12px] font-medium text-zinc-500 font-sans">Loading...</span>
              </div>
            )}

            {/* Error state */}
            {!isActivityLoading && activityError && (
              <div className="w-full py-6 text-center text-[12.5px] text-zinc-500 border-y border-zinc-200/80 bg-white font-sans">
                Could not load competitor activity.
              </div>
            )}

            {/* Empty state */}
            {!isActivityLoading && !activityError && orderedCategories.length === 0 && (
              <div className="w-full py-8 text-center text-[12.5px] text-zinc-500 border-y border-zinc-200/80 bg-white font-sans">
                No competitor activity yet.
              </div>
            )}

            {/* Groups list */}
            {!isActivityLoading && !activityError && orderedCategories.length > 0 && (
              <div className="w-full flex flex-col border-y border-zinc-200/80 bg-white divide-y divide-zinc-200/80">
                {orderedCategories.map((category) => {
                  const items = liveChangesByCategory.get(category) || [];
                  const isExpanded = expandedCategories[category] ?? true;

                  if (items.length === 0) return null;

                  return (
                    <div key={category} id={"category-" + category} className="w-full flex flex-col">
                      <div
                        onClick={() => toggleCategory(category)}
                        className="px-4 py-1.5 flex items-center justify-between cursor-pointer hover:bg-zinc-50/70 transition-colors select-none"
                      >
                        <h4 className="text-[13px] font-semibold text-[#2d39d2] font-sans">
                          {category}
                        </h4>
                        <div className="flex items-center gap-2 text-[11.5px] text-zinc-500">
                          <span className="text-[10.5px] font-light text-zinc-500 bg-zinc-50 px-2 py-0.5 rounded border border-zinc-200/60 font-sans">
                            {items.length} {items.length === 1 ? "item" : "items"}
                          </span>
                          {isExpanded ? (
                            <ChevronUp className="w-3.5 h-3.5 text-zinc-400" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
                          )}
                        </div>
                      </div>

                      {isExpanded && items.length > 0 && (
                        <div className="divide-y divide-zinc-100 border-t border-zinc-100 bg-white">
                          {items.map((card) => {
                            const isSelected = selectedLiveCard?.id === card.id;
                            const signalsCount = card.signal_count || 0;
                            const dateStr = formatCardDate(card.last_signal_at || card.event_date);
                            const firstLine = getFirstSentence(card.summary);

                            return (
                              <div
                                key={card.id}
                                onClick={() => {
                                  setSelectedLiveCard(card);
                                  setSelectedSignalId(null);
                                  setSelectedItem(null);
                                  setExpandedQuotesSignalIds({});
                                }}
                                className={"px-4 py-1.5 transition-colors flex items-start justify-between gap-4 pl-6 cursor-pointer group " + (
                                  isSelected
                                    ? "bg-[#eef1fe]/40 border-l-[3.5px] border-l-[#2d39d2]"
                                    : "hover:bg-zinc-50/70"
                                )}
                              >
                                <div className="space-y-1 flex-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span
                                      className={"inline-flex items-center px-1.5 py-0.5 rounded-[3px] text-[10px] font-medium shrink-0 " + getCompetitorTagClass(
                                        card.organization
                                      )}
                                    >
                                      {card.organization}
                                    </span>
                                    <span className="text-[12.5px] font-semibold text-zinc-900 group-hover:text-black font-sans">
                                      {card.signal_title}
                                    </span>
                                  </div>
                                  <p className="text-[11.5px] text-zinc-600 font-[350] leading-normal font-sans">
                                    {firstLine}
                                  </p>
                                </div>

                                <div className="text-right shrink-0 flex flex-col items-end gap-1 pt-0.5 font-sans">
                                  <span className="text-[11px] text-zinc-500 font-normal">
                                    {dateStr}
                                  </span>
                                  <span
                                    className={"px-2 py-0.5 rounded-[4px] text-[10px] font-medium shrink-0 whitespace-nowrap " + getSignalBadgeClass(
                                      signalsCount
                                    )}
                                  >
                                    {signalsCount} {signalsCount === 1 ? "signal" : "signals"}
                                  </span>
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
          </section>

        </div>
      </div>

      {/* RIGHT COLUMN: Slide-over details pane for Live Competitor Card */}
      {selectedLiveCard && (
        <>
          <div
            className="fixed inset-0 bg-black/20 z-[90] animate-in fade-in duration-200"
            onClick={closeDrawer}
          />
          <div
            id="competitive-radar-content-pane"
            className="absolute top-0 right-0 w-[40%] h-full flex flex-col bg-white overflow-hidden shadow-2xl z-[100] animate-in slide-in-from-right duration-300 border-l border-zinc-200"
          >
            {/* Header with Close button */}
            <div
              id="content-tabbar"
              className="px-5 border-b border-zinc-100 flex flex-col pt-1 pb-1 select-text flex-shrink-0 animate-fade-in bg-white"
            >
              <button
                onClick={closeDrawer}
                className="w-6 h-6 flex items-center justify-center rounded hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 transition-colors cursor-pointer self-end"
                title="Close details"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Dynamic content */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 flex flex-col gap-5 animate-fade-in bg-[#fafafa]/30 select-text relative">
              
              {/* Category, Actions and Title */}
              <div className="flex flex-col gap-2">
                <h1 className="text-xl sm:text-[22px] font-semibold leading-tight tracking-tight text-[#111827] font-sans">
                  {selectedLiveCard.signal_title}
                </h1>

                {/* Chips under title: category and organization */}
                <div className="flex items-center justify-between gap-4 mt-1 select-text">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="rounded-[3px] py-0.5 px-2 text-[9px] font-semibold tracking-tight inline-block font-sans bg-purple-50/80 border border-purple-200 text-[#2d39d2]">
                      {selectedLiveCard.category}
                    </span>
                    <span
                      className={"rounded-[3px] py-0.5 px-2 text-[9px] font-semibold tracking-tight inline-block font-sans " + getCompetitorTagClass(
                        selectedLiveCard.organization
                      )}
                    >
                      {selectedLiveCard.organization}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 select-none">
                    <button
                      id="not-interested-button"
                      onClick={closeDrawer}
                      className="w-[22px] h-[22px] bg-[#fafafa] border border-zinc-200 text-zinc-400 hover:text-red-500 hover:bg-red-50/50 rounded-[4px] flex items-center justify-center transition-colors cursor-pointer"
                      title="Not Interested"
                    >
                      <Square className="w-3 h-3" />
                    </button>

                    <button
                      onClick={() => setIsBookmarked((prev) => !prev)}
                      className={"w-[22px] h-[22px] border rounded-[4px] flex items-center justify-center transition-colors duration-150 cursor-pointer " + (
                        isBookmarked
                          ? "bg-amber-50/60 border-amber-200/80 text-amber-500 hover:bg-amber-100/35"
                          : "bg-[#fafafa] border-zinc-200 text-zinc-400 hover:text-zinc-650 hover:bg-zinc-100/50"
                      )}
                      title={isBookmarked ? "Remove Bookmark" : "Bookmark"}
                    >
                      <Bookmark className={"w-3 h-3 " + (isBookmarked ? "text-amber-500 fill-amber-500" : "")} />
                    </button>

                    <button
                      onClick={() => {
                        if (navigator.clipboard) {
                          navigator.clipboard.writeText(selectedLiveCard.signal_title + " - " + selectedLiveCard.summary);
                        }
                      }}
                      className="w-[22px] h-[22px] bg-[#fafafa] border border-zinc-200 text-zinc-400 hover:text-zinc-650 hover:bg-zinc-100/50 rounded-[4px] flex items-center justify-center transition-colors cursor-pointer"
                      title="Export"
                    >
                      <Share2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Meta values and Impact bar row */}
              {(() => {
                const importanceData = getImportanceData(selectedLiveCard.importance);
                return (
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border border-zinc-200 rounded-[4px] p-4 bg-zinc-50/30 select-text">
                    <div className="flex flex-col gap-1 text-[12.5px] text-zinc-600 font-sans">
                      <div>
                        <span className="font-semibold text-zinc-800">Last Updated Date:</span>{" "}
                        <span className="text-zinc-600">
                          {formatCardDate(selectedLiveCard.last_signal_at || selectedLiveCard.event_date)}
                        </span>
                      </div>
                      <div>
                        <span className="font-semibold text-zinc-800">Competitors:</span>{" "}
                        <span className="text-zinc-600">{selectedLiveCard.organization}</span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1.5 min-w-[100px] select-none">
                      <span className="text-[9px] font-bold tracking-widest text-zinc-500 font-sans">STRATEGIC RELEVANCE</span>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 4 }).map((_, i) => (
                          <div
                            key={i}
                            className={"w-3.5 h-1.5 rounded-[1.5px] transition-all " + (
                              i < importanceData.filledCount ? importanceData.barColor : "bg-zinc-200"
                            )}
                          />
                        ))}
                      </div>
                      <span className="text-[12.5px] font-bold text-zinc-700 tracking-tight font-sans">
                        {importanceData.label}
                      </span>
                    </div>
                  </div>
                );
              })()}

              {/* Summary paragraph (full text, exactly as stored - do not add sentences) */}
              <div className="flex flex-col gap-4 text-[13px] leading-relaxed text-zinc-600 font-sans select-text">
                <p className="font-[350] text-zinc-800 leading-relaxed font-sans" style={{ fontWeight: 350 }}>
                  {selectedLiveCard.summary}
                </p>

                {/* Reference: 1 2 3 ... numbered buttons, each opening signal.url in a new tab */}
                {activeCardSignals.length > 0 && (
                  <div className="flex items-start gap-1.5 select-none text-[11px] text-zinc-600 mt-1">
                    <span className="font-normal text-zinc-600 mt-[3px]">Reference:</span>
                    <div className="flex flex-wrap items-center gap-1">
                      {activeCardSignals.map((sig, idx) => (
                        <a
                          key={sig.id || idx}
                          href={sig.url || "#"}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => {
                            if (!sig.url) e.preventDefault();
                          }}
                          className="group inline-flex items-center justify-center px-1.5 h-[17px] bg-zinc-100 border border-zinc-200 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-600 rounded-[3px] text-[10px] font-semibold text-zinc-700 transition-colors cursor-pointer select-none"
                          title={"Open reference " + (idx + 1)}
                        >
                          {idx + 1}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Business Impact list (hidden if empty) */}
              {Array.isArray(selectedLiveCard.business_impact) && selectedLiveCard.business_impact.length > 0 && (
                <div className="flex flex-col gap-2 mt-2">
                  <h3 className="text-[13px] font-semibold tracking-tight text-zinc-800 font-sans">
                    Business Impact
                  </h3>
                  <div className="bg-[#eef1fe]/60 border border-violet-100 p-4 rounded-[4px] flex flex-col gap-3">
                    {selectedLiveCard.business_impact.map((bullet, idx) => (
                      <div key={idx} className="flex gap-2.5 items-start">
                        <span className="text-[#2d39d2] text-xs mt-1 shrink-0 select-none">•</span>
                        <p
                          className="text-[13px] leading-relaxed text-zinc-800 font-[350] select-text font-sans"
                          style={{ fontWeight: 350 }}
                        >
                          {bullet}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Signals list */}
              <div className="flex flex-col gap-2 border-t border-zinc-100 pt-3.5 mt-1 select-text">
                <div className="flex items-center justify-between select-none">
                  <span className="text-[13px] font-semibold tracking-tight text-zinc-800 font-sans">
                    Signals ({activeCardSignals.length > 0 ? activeCardSignals.length : (isCardSignalsLoading ? "..." : (selectedLiveCard.signal_count || 0))})
                  </span>
                  <button 
                    type="button"
                    onClick={() => setIsSourcesExpanded(!isSourcesExpanded)}
                    className="flex items-center gap-1 text-[11.5px] font-medium text-zinc-500 hover:text-zinc-800 cursor-pointer select-none bg-transparent border-none outline-none focus:outline-none transition-colors duration-150 font-sans"
                  >
                    <span>{isSourcesExpanded ? "Close details" : "View details"}</span>
                    <svg 
                      className={"w-3.5 h-3.5 text-current transition-transform duration-200 " + (isSourcesExpanded ? "rotate-180" : "")} 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2.2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                    >
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  </button>
                </div>

                {isSourcesExpanded && (
                  <div className="flex flex-col gap-2 mt-1 animate-fade-in">
                    {isCardSignalsLoading && activeCardSignals.length === 0 ? (
                      <div className="py-4 text-center text-xs text-zinc-400 font-sans">
                        Loading signals...
                      </div>
                    ) : activeCardSignals.length === 0 ? (
                      <div className="py-3 text-center text-xs text-zinc-400 font-sans">
                        No signals recorded.
                      </div>
                    ) : (
                      activeCardSignals.map((sig, index) => {
                      const isSelected = selectedSignalId === sig.id;
                      const cLower = (sig.category || "").toLowerCase();
                      let bgClass = "bg-[#f9f9fb] hover:bg-[#f4f4f5]";
                      let borderClass = isSelected ? "border-zinc-400 ring-2 ring-zinc-400/25 shadow-sm" : "border-zinc-200";

                      if (cLower.includes("investment") || cLower.includes("capital") || cLower.includes("m&a")) {
                        bgClass = isSelected ? "bg-[#fffbeb]" : "bg-[#fffbeb]/60 hover:bg-[#fffbeb]/80";
                        borderClass = isSelected ? "border-[#f59e0b] ring-2 ring-[#f59e0b]/25 shadow-sm" : "border-[#fef3c7]";
                      } else if (cLower.includes("innovation") || cLower.includes("product") || cLower.includes("technology") || cLower.includes("launch")) {
                        bgClass = isSelected ? "bg-[#f0f9ff]" : "bg-[#f0f9ff]/60 hover:bg-[#f0f9ff]/80";
                        borderClass = isSelected ? "border-[#3b82f6] ring-2 ring-[#3b82f6]/25 shadow-sm" : "border-[#e0f2fe]";
                      } else if (cLower.includes("pricing") || cLower.includes("promotion")) {
                        bgClass = isSelected ? "bg-amber-50" : "bg-amber-50/50 hover:bg-amber-50/80";
                        borderClass = isSelected ? "border-amber-400 ring-2 ring-amber-400/25 shadow-sm" : "border-amber-200";
                      } else if (cLower.includes("regulatory") || cLower.includes("compliance") || cLower.includes("legal")) {
                        bgClass = isSelected ? "bg-purple-50" : "bg-purple-50/50 hover:bg-purple-50/80";
                        borderClass = isSelected ? "border-purple-400 ring-2 ring-purple-400/25 shadow-sm" : "border-purple-200";
                      } else if (cLower.includes("partner") || cLower.includes("alliance")) {
                        bgClass = isSelected ? "bg-teal-50" : "bg-teal-50/50 hover:bg-teal-50/80";
                        borderClass = isSelected ? "border-teal-400 ring-2 ring-teal-400/25 shadow-sm" : "border-teal-200";
                      } else if (cLower.includes("leadership") || cLower.includes("org")) {
                        bgClass = isSelected ? "bg-rose-50" : "bg-rose-50/50 hover:bg-rose-50/80";
                        borderClass = isSelected ? "border-rose-400 ring-2 ring-rose-400/25 shadow-sm" : "border-rose-200";
                      }

                      return (
                        <div 
                          key={sig.id || index}
                          id={"signal-card-" + (sig.id || index)}
                          onClick={() => setSelectedSignalId(isSelected ? null : sig.id)}
                          className={"rounded-[4px] px-3 transition-all text-left cursor-pointer border " + bgClass + " " + borderClass + " " + (isSelected ? "py-4" : "py-1.5")}
                        >
                          {!isSelected ? (
                            <div className="flex items-center justify-between gap-3 overflow-hidden font-sans">
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <span className={"shrink-0 rounded-[4px] py-0.5 px-1.5 text-[8.5px] font-semibold tracking-tight border leading-none " + getCategoryTagClass(sig.signal_name || sig.category)}>
                                  {sig.signal_name || sig.category}
                                </span>
                                <h4 className="font-medium text-zinc-900 text-[13px] truncate">
                                  {selectedLiveCard.organization} · {sig.signal_title}
                                </h4>
                              </div>
                              <span className="shrink-0 text-zinc-500 font-medium text-[9px] bg-zinc-100/50 rounded-[4px] px-1.5 py-0.5 leading-none select-none">
                                {formatSignalDateShort(sig.event_date || sig.published_date)}
                              </span>
                            </div>
                          ) : (
                            <div className="animate-fade-in flex flex-col gap-3 font-sans">
                              <div className="flex items-center justify-between">
                                <span className={"rounded-[4px] py-0.5 px-2 text-[9px] font-semibold tracking-tight inline-block border leading-none " + getCategoryTagClass(sig.signal_name || sig.category)}>
                                  {sig.signal_name || sig.category}
                                </span>
                                <span className="text-zinc-500 font-medium text-[9px] bg-[#e8e6df]/50 rounded-[4px] px-1.5 py-0.5 leading-none select-none">
                                  {formatSignalDateShort(sig.event_date || sig.published_date)}
                                </span>
                              </div>

                              <div className="flex flex-col gap-0.5">
                                <h4 className="font-bold text-zinc-900 text-[14px] leading-tight tracking-tight">
                                  {selectedLiveCard.organization} · {sig.signal_title}
                                </h4>
                              </div>
                              
                              {sig.summary && (
                                <p className="text-zinc-800 text-[12px] leading-relaxed font-light">
                                  {sig.summary}
                                </p>
                              )}

                              <div className="text-[11px] text-zinc-600">
                                <span className="font-semibold text-zinc-700">Source: </span>
                                <a
                                  href={sig.url || "#"}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => {
                                    if (!sig.url) e.preventDefault();
                                    e.stopPropagation();
                                  }}
                                  className="text-[#3b82f6] font-medium hover:underline inline-flex items-center gap-1"
                                >
                                  <span>{getSourceKindLabel(sig.source_kind)} · {sig.source_domain || "source"}</span>
                                  <Share2 className="w-2.5 h-2.5" />
                                </a>
                              </div>

                              {Array.isArray(sig.key_facts) && sig.key_facts.length > 0 && (
                                <div className="flex flex-col gap-1.5 mt-0.5">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const signalKey = sig.id || String(index);
                                      setExpandedQuotesSignalIds((prev) => ({
                                        ...prev,
                                        [signalKey]: !prev[signalKey],
                                      }));
                                    }}
                                    className="inline-flex items-center gap-1.5 text-[11px] font-medium text-zinc-500 hover:text-zinc-800 transition-colors cursor-pointer select-none self-start"
                                  >
                                    <span>Quotes from the source ({sig.key_facts.length})</span>
                                    {expandedQuotesSignalIds[sig.id || String(index)] ? (
                                      <ChevronUp className="w-3 h-3 text-zinc-400" />
                                    ) : (
                                      <ChevronDown className="w-3 h-3 text-zinc-400" />
                                    )}
                                  </button>

                                  {expandedQuotesSignalIds[sig.id || String(index)] && (
                                    <div className="flex flex-col gap-1.5 border-l-2 border-zinc-300 pl-3 py-1 my-0.5 bg-zinc-50/50 rounded-r">
                                      {sig.key_facts.map((fact, fIdx) => (
                                        <p key={fIdx} className="text-[11.5px] italic text-zinc-600 leading-snug">
                                          &ldquo;{fact}&rdquo;
                                        </p>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                  </div>
                )}
              </div>

              {/* Similar Market Movements section (up to 3 OTHER cards from same data with same category; hidden if none) */}
              {similarLiveCards.length > 0 && (
                <div className="flex flex-col gap-1.5 mt-4 select-text">
                  <h3 className="text-[12.5px] font-medium tracking-tight text-zinc-900 font-sans select-text">
                    Similar Market Movements
                  </h3>
                  <div className="flex flex-col gap-1.5 ml-1">
                    {similarLiveCards.map((prospect) => (
                      <div className="flex items-start gap-2 py-0.5 text-[12px]" key={prospect.id}>
                        <CornerDownRight className="w-3 h-3 text-zinc-400 mt-[3px] shrink-0 select-none" />
                        <button
                          onClick={() => {
                            setSelectedLiveCard(prospect);
                            setSelectedSignalId(null);
                            setExpandedQuotesSignalIds({});
                          }}
                          className="text-left text-zinc-700 hover:text-[#2d39d2] transition-colors leading-normal hover:underline select-text font-normal cursor-pointer font-sans text-[12px]"
                        >
                          {prospect.signal_title}
                        </button>
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
                        const query = "What is the regulatory and market feasibility of " + selectedLiveCard.signal_title + "?";
                        if (onSwitchToDecisionIntelligence) {
                          onSwitchToDecisionIntelligence(query, "market_dynamics", "Competitive Intelligence", "Competitive Intelligence");
                        }
                      }}
                      className="text-left text-zinc-700 hover:text-[#2d39d2] transition-colors leading-normal hover:underline select-text font-normal cursor-pointer font-sans text-[12px]"
                    >
                      Evaluate regulatory and market feasibility
                    </button>
                  </div>
                  <div className="flex items-start gap-2 py-0.5 text-[12px]">
                    <CornerDownRight className="w-3 h-3 text-zinc-400 mt-[3px] shrink-0 select-none" />
                    <button
                      onClick={() => {
                        const query = "Provide case studies of " + selectedLiveCard.signal_title + " implementations.";
                        if (onSwitchToDecisionIntelligence) {
                          onSwitchToDecisionIntelligence(query, "market_dynamics", "Competitive Intelligence", "Competitive Intelligence");
                        }
                      }}
                      className="text-left text-zinc-700 hover:text-[#2d39d2] transition-colors leading-normal hover:underline select-text font-normal cursor-pointer font-sans text-[12px]"
                    >
                      Show corporate case studies & examples
                    </button>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </>
      )}

      {/* RIGHT COLUMN: Slide-over details pane for Section 1 Strategic Shift */}

      {selectedItem && (
        <>
          <div
            className="fixed inset-0 bg-black/20 z-[90] animate-in fade-in duration-200"
            onClick={() => setSelectedItem(null)}
          />
          <div
            id="competitive-radar-content-pane"
            className="absolute top-0 right-0 w-[40%] h-full flex flex-col bg-white overflow-hidden shadow-2xl z-[100] animate-in slide-in-from-right duration-300 border-l border-zinc-200"
          >
          {/* Tab switcher with Close button in the same line */}
          <div
            id="content-tabbar"
            className="px-5 border-b border-zinc-100 flex flex-col pt-1 pb-1 select-text flex-shrink-0 animate-fade-in bg-white"
          >
            <div className="hidden items-center gap-4 h-9">
              <button
                onClick={() => setActiveDetailTab("insights")}
                className={`flex items-center gap-1.5 text-xs h-full px-1 border-b-2 transition-colors duration-150 font-sans ${
                  activeDetailTab === "insights"
                    ? "border-[#2d39d2] text-zinc-900 font-semibold"
                    : "border-transparent text-zinc-500 hover:text-zinc-800"
                }`}
              >
                <span>≡ Insights</span>
              </button>
            </div>

            <button
              onClick={() => setSelectedItem(null)}
              className="w-6 h-6 flex items-center justify-center rounded hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 transition-colors cursor-pointer self-end"
              title="Close details"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Dynamic switcher content */}
          {activeDetailTab === "insights" && (
            <div className="flex-1 overflow-y-auto p-6 md:p-8 flex flex-col gap-5 animate-fade-in bg-[#fafafa]/30 select-text relative">
              
              {/* Category, Actions and Title */}
              <div className="flex flex-col gap-2">
                <h1 className="text-xl sm:text-[22px] font-semibold leading-tight tracking-tight text-[#111827] font-sans">
                  {selectedItem.title}
                </h1>

                {/* Category Pill and Competitor chips */}
                <div className="flex items-center justify-between gap-4 mt-1 select-text">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {selectedItem.category && (
                      <span className="rounded-[3px] py-0.5 px-2 text-[9px] font-semibold tracking-tight inline-block font-sans bg-purple-50/80 border border-purple-200 text-[#2d39d2]">
                        {selectedItem.category}
                      </span>
                    )}
                    {getCompetitorNames(selectedItem.competitors).map((comp) => (
                      <span
                        key={comp}
                        className={`rounded-[3px] py-0.5 px-2 text-[9px] font-semibold tracking-tight inline-block font-sans ${getCompetitorTagClass(
                          comp
                        )}`}
                      >
                        {comp}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 select-none">
                    <button
                      id="not-interested-button"
                      onClick={() => {
                        setSelectedItem(null);
                      }}
                      className="w-[22px] h-[22px] bg-[#fafafa] border border-zinc-200 text-zinc-400 hover:text-red-500 hover:bg-red-50/50 rounded-[4px] flex items-center justify-center transition-colors cursor-pointer"
                      title="Not Interested"
                    >
                      <Square className="w-3 h-3" />
                    </button>

                    <button
                      onClick={() => setIsBookmarked((prev) => !prev)}
                      className={`w-[22px] h-[22px] border rounded-[4px] flex items-center justify-center transition-colors duration-150 cursor-pointer ${
                        isBookmarked
                          ? "bg-amber-50/60 border-amber-200/80 text-amber-500 hover:bg-amber-100/35"
                          : "bg-[#fafafa] border-zinc-200 text-zinc-400 hover:text-zinc-650 hover:bg-zinc-100/50"
                      }`}
                      title={isBookmarked ? "Remove Bookmark" : "Bookmark"}
                    >
                      <Bookmark className={`w-3 h-3 ${isBookmarked ? "text-amber-500 fill-amber-500" : ""}`} />
                    </button>

                    <button
                      onClick={() => {
                        if (navigator.clipboard) {
                          navigator.clipboard.writeText(`${selectedItem.title} - ${selectedItem.summary}`);
                        }
                      }}
                      className="w-[22px] h-[22px] bg-[#fafafa] border border-zinc-200 text-zinc-400 hover:text-zinc-650 hover:bg-zinc-100/50 rounded-[4px] flex items-center justify-center transition-colors cursor-pointer"
                      title="Export"
                    >
                      <Share2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Meta values and Impact bar row inside a thin border box */}
              {(() => {
                const importanceData = getImportanceData(selectedItem.importance);
                const competitorNames = getCompetitorNames(selectedItem.competitors);
                return (
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border border-zinc-200 rounded-[4px] p-4 bg-zinc-50/30 select-text">
                    <div className="flex flex-col gap-1 text-[12.5px] text-zinc-600 font-sans">
                      <div>
                        <span className="font-semibold text-zinc-800">Last Updated Date:</span>{" "}
                        <span className="text-zinc-600">
                          {formatCardDate(selectedItem.written_at || selectedItem.latest_date)}
                        </span>
                      </div>
                      <div>
                        <span className="font-semibold text-zinc-800">Competitors:</span>{" "}
                        <span className="text-zinc-600">
                          {competitorNames.length > 0 ? competitorNames.join(", ") : "—"}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1.5 min-w-[100px] select-none">
                      <span className="text-[9px] font-bold tracking-widest text-zinc-500 font-sans">
                        STRATEGIC RELEVANCE
                      </span>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 4 }).map((_, i) => (
                          <div
                            key={i}
                            className={`w-3.5 h-1.5 rounded-[1.5px] transition-all ${
                              i < importanceData.filledCount
                                ? importanceData.barColor
                                : "bg-zinc-200"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-[12.5px] font-bold text-zinc-700 tracking-tight font-sans">
                        {importanceData.label}
                      </span>
                    </div>
                  </div>
                );
              })()}

              {/* Summary paragraph = summary */}
              <div className="flex flex-col gap-4 text-[13px] leading-relaxed text-zinc-600 font-sans select-text">
                <p className="font-[350] text-zinc-800 leading-relaxed font-sans" style={{ fontWeight: 350 }}>
                  {selectedItem.summary}
                </p>

                {/* Reference numbers = 1..signals.length (click n -> scroll to signal n) */}
                {Array.isArray(selectedItem.signals) && selectedItem.signals.length > 0 && (
                  <div className="flex items-start gap-1.5 select-none text-[11px] text-zinc-600 mt-1">
                    <span className="font-normal text-zinc-600 mt-[3px]">Reference:</span>
                    <div className="flex flex-wrap items-center gap-1">
                      {selectedItem.signals.map((_, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setIsSourcesExpanded(true);
                            const sigKey = `shift-sig-${idx}`;
                            setSelectedSignalId(sigKey);
                            setTimeout(() => {
                              const el = document.getElementById(`signal-shift-card-${idx}`);
                              if (el) {
                                el.scrollIntoView({ behavior: "smooth", block: "center" });
                                el.classList.add("ring-2", "ring-blue-500", "bg-blue-50", "transition-all", "duration-500");
                                setTimeout(() => {
                                  el.classList.remove("ring-2", "ring-blue-500", "bg-blue-50");
                                }, 1500);
                              }
                            }, 100);
                          }}
                          className="group inline-flex items-center justify-center px-1.5 h-[17px] bg-zinc-100 border border-zinc-200 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-600 rounded-[3px] text-[10px] font-semibold text-zinc-700 transition-colors cursor-pointer select-none"
                          title={`Jump to signal ${idx + 1}`}
                        >
                          {idx + 1}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Business Impact: one bullet per item of business_impact */}
              {Array.isArray(selectedItem.business_impact) && selectedItem.business_impact.length > 0 && (
                <div className="flex flex-col gap-2 mt-2">
                  <h3 className="text-[13px] font-semibold tracking-tight text-zinc-800 font-sans">
                    Business Impact
                  </h3>
                  <div className="bg-[#eef1fe]/60 border border-violet-100 p-4 rounded-[4px] flex flex-col gap-3">
                    {selectedItem.business_impact.map((bullet, idx) => (
                      <div key={idx} className="flex gap-2.5 items-start">
                        <span className="text-[#2d39d2] text-xs mt-1 shrink-0 select-none">•</span>
                        <p
                          className="text-[13px] leading-relaxed text-zinc-800 font-[350] select-text font-sans"
                          style={{ fontWeight: 350 }}
                        >
                          {bullet}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Signals ({signal_count}) */}
              {Array.isArray(selectedItem.signals) && selectedItem.signals.length > 0 && (
                <div className="flex flex-col gap-2 border-t border-zinc-100 pt-3.5 mt-1 select-text">
                  <div className="flex items-center justify-between select-none">
                    <span className="text-[13px] font-semibold tracking-tight text-zinc-800 font-sans">
                      Signals ({selectedItem.signals.length})
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsSourcesExpanded(!isSourcesExpanded)}
                      className="flex items-center gap-1 text-[11.5px] font-medium text-zinc-500 hover:text-zinc-800 cursor-pointer select-none bg-transparent border-none outline-none focus:outline-none transition-colors duration-150 font-sans"
                    >
                      <span>{isSourcesExpanded ? "Close details" : "View details"}</span>
                      <svg
                        className={`w-3.5 h-3.5 text-current transition-transform duration-200 ${
                          isSourcesExpanded ? "rotate-180" : ""
                        }`}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="6 9 12 15 18 9"></polyline>
                      </svg>
                    </button>
                  </div>

                  {isSourcesExpanded && (
                    <div className="flex flex-col gap-2 mt-1 animate-fade-in">
                      {selectedItem.signals.map((sig, index) => {
                        const sigKey = `shift-sig-${index}`;
                        const isSelected = selectedSignalId === sigKey;
                        const cLower = ((sig.sub_category || "")).toLowerCase();
                        let bgClass = "bg-[#f9f9fb] hover:bg-[#f4f4f5]";
                        let borderClass = isSelected
                          ? "border-zinc-400 ring-2 ring-zinc-400/25 shadow-sm"
                          : "border-zinc-200";

                        if (cLower.includes("investment") || cLower.includes("capital") || cLower.includes("m&a")) {
                          bgClass = isSelected ? "bg-[#fffbeb]" : "bg-[#fffbeb]/60 hover:bg-[#fffbeb]/80";
                          borderClass = isSelected ? "border-[#f59e0b] ring-2 ring-[#f59e0b]/25 shadow-sm" : "border-[#fef3c7]";
                        } else if (cLower.includes("innovation") || cLower.includes("product") || cLower.includes("technology") || cLower.includes("launch")) {
                          bgClass = isSelected ? "bg-[#f0f9ff]" : "bg-[#f0f9ff]/60 hover:bg-[#f0f9ff]/80";
                          borderClass = isSelected ? "border-[#3b82f6] ring-2 ring-[#3b82f6]/25 shadow-sm" : "border-[#e0f2fe]";
                        } else if (cLower.includes("pricing") || cLower.includes("promotion")) {
                          bgClass = isSelected ? "bg-amber-50" : "bg-amber-50/50 hover:bg-amber-50/80";
                          borderClass = isSelected ? "border-amber-400 ring-2 ring-amber-400/25 shadow-sm" : "border-amber-200";
                        } else if (cLower.includes("regulatory") || cLower.includes("compliance") || cLower.includes("legal")) {
                          bgClass = isSelected ? "bg-purple-50" : "bg-purple-50/50 hover:bg-purple-50/80";
                          borderClass = isSelected ? "border-purple-400 ring-2 ring-purple-400/25 shadow-sm" : "border-purple-200";
                        } else if (cLower.includes("partner") || cLower.includes("alliance")) {
                          bgClass = isSelected ? "bg-teal-50" : "bg-teal-50/50 hover:bg-teal-50/80";
                          borderClass = isSelected ? "border-teal-400 ring-2 ring-teal-400/25 shadow-sm" : "border-teal-200";
                        } else if (cLower.includes("leadership") || cLower.includes("org")) {
                          bgClass = isSelected ? "bg-rose-50" : "bg-rose-50/50 hover:bg-rose-50/80";
                          borderClass = isSelected ? "border-rose-400 ring-2 ring-rose-400/25 shadow-sm" : "border-rose-200";
                        }

                        const signalTitle = sig.competitor && sig.title
                          ? `${sig.competitor} · ${sig.title}`
                          : sig.title || sig.competitor || "Signal";

                        return (
                          <div
                            key={index}
                            id={`signal-shift-card-${index}`}
                            onClick={() => setSelectedSignalId(isSelected ? null : sigKey)}
                            className={`rounded-[4px] px-3 transition-all text-left cursor-pointer border ${bgClass} ${borderClass} ${
                              isSelected ? "py-4" : "py-1.5"
                            }`}
                          >
                            {!isSelected ? (
                              <div className="flex items-center justify-between gap-3 overflow-hidden font-sans">
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  {sig.sub_category && (
                                    <span
                                      className={`shrink-0 rounded-[4px] py-0.5 px-1.5 text-[8.5px] font-semibold tracking-tight border leading-none ${getCategoryTagClass(
                                        sig.sub_category
                                      )}`}
                                    >
                                      {sig.sub_category}
                                    </span>
                                  )}
                                  <h4 className="font-medium text-zinc-900 text-[13px] truncate">
                                    {signalTitle}
                                  </h4>
                                </div>
                                <span className="shrink-0 text-zinc-500 font-medium text-[9px] bg-zinc-100/50 rounded-[4px] px-1.5 py-0.5 leading-none select-none">
                                  {formatSignalMonthDay(sig.date)}
                                </span>
                              </div>
                            ) : (
                              <div className="animate-fade-in flex flex-col gap-3 font-sans">
                                <div className="flex items-center justify-between">
                                  {sig.sub_category && (
                                    <span
                                      className={`rounded-[4px] py-0.5 px-2 text-[9px] font-semibold tracking-tight inline-block border leading-none ${getCategoryTagClass(
                                        sig.sub_category
                                      )}`}
                                    >
                                      {sig.sub_category}
                                    </span>
                                  )}
                                  <span className="text-zinc-500 font-medium text-[9px] bg-[#e8e6df]/50 rounded-[4px] px-1.5 py-0.5 leading-none select-none">
                                    {formatSignalMonthDay(sig.date)}
                                  </span>
                                </div>

                                <div className="flex flex-col gap-0.5">
                                  <h4 className="font-bold text-zinc-900 text-[14px] leading-tight tracking-tight">
                                    {signalTitle}
                                  </h4>
                                </div>

                                {sig.summary && (
                                  <p className="text-zinc-800 text-[12px] leading-relaxed font-light">
                                    {sig.summary}
                                  </p>
                                )}

                                <div className="text-[11px] text-zinc-600">
                                  <span className="font-semibold text-zinc-700">Source: </span>
                                  <a
                                    href={sig.url || "#"}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => {
                                      if (!sig.url) e.preventDefault();
                                      e.stopPropagation();
                                    }}
                                    className="text-[#3b82f6] font-medium hover:underline inline-flex items-center gap-1"
                                  >
                                    <span>
                                      {getSourceKindLabel(sig.source_kind)} · {sig.source_domain || "source"}
                                    </span>
                                    <Share2 className="w-2.5 h-2.5" />
                                  </a>
                                </div>

                                {Array.isArray(sig.key_facts) && sig.key_facts.length > 0 && (
                                  <div className="flex flex-col gap-1.5 mt-0.5">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        const qKey = `shift-${index}`;
                                        setExpandedQuotesSignalIds((prev) => ({
                                          ...prev,
                                          [qKey]: !prev[qKey],
                                        }));
                                      }}
                                      className="inline-flex items-center gap-1.5 text-[11px] font-medium text-zinc-500 hover:text-zinc-800 transition-colors cursor-pointer select-none self-start"
                                    >
                                      <span>Quotes from the source ({sig.key_facts.length})</span>
                                      {expandedQuotesSignalIds[`shift-${index}`] ? (
                                        <ChevronUp className="w-3 h-3 text-zinc-400" />
                                      ) : (
                                        <ChevronDown className="w-3 h-3 text-zinc-400" />
                                      )}
                                    </button>

                                    {expandedQuotesSignalIds[`shift-${index}`] && (
                                      <div className="flex flex-col gap-1.5 border-l-2 border-zinc-300 pl-3 py-1 my-0.5 bg-zinc-50/50 rounded-r">
                                        {sig.key_facts.map((fact, fIdx) => (
                                          <p key={fIdx} className="text-[11.5px] italic text-zinc-600 leading-snug">
                                            &ldquo;{fact}&rdquo;
                                          </p>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Similar Market Movements section */}
              {strategicShifts.filter((c) => c.rank !== selectedItem.rank).length > 0 && (
                <div className="flex flex-col gap-1.5 mt-4 select-text">
                  <h3 className="text-[12.5px] font-medium tracking-tight text-zinc-900 font-sans select-text">
                    Similar Market Movements
                  </h3>
                  <div className="flex flex-col gap-1.5 ml-1">
                    {strategicShifts
                      .filter((c) => c.rank !== selectedItem.rank)
                      .slice(0, 3)
                      .map((prospect, idx) => (
                        <div className="flex items-start gap-2 py-0.5 text-[12px]" key={idx}>
                          <CornerDownRight className="w-3 h-3 text-zinc-400 mt-[3px] shrink-0 select-none" />
                          <button
                            onClick={() => {
                              setSelectedItem(prospect);
                              setSelectedSignalId(null);
                            }}
                            className="text-left text-zinc-700 hover:text-[#2d39d2] transition-colors leading-normal hover:underline select-text font-normal cursor-pointer font-sans text-[12px]"
                          >
                            {prospect.title}
                          </button>
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
                        const query = `What is the regulatory and market feasibility of ${selectedItem.title}?`;
                        if (onSwitchToDecisionIntelligence) {
                          onSwitchToDecisionIntelligence(query, "market_dynamics", "Competitive Intelligence", "Competitive Intelligence");
                        }
                      }}
                      className="text-left text-zinc-700 hover:text-[#2d39d2] transition-colors leading-normal hover:underline select-text font-normal cursor-pointer font-sans text-[12px]"
                    >
                      Evaluate regulatory and market feasibility
                    </button>
                  </div>
                  <div className="flex items-start gap-2 py-0.5 text-[12px]">
                    <CornerDownRight className="w-3 h-3 text-zinc-400 mt-[3px] shrink-0 select-none" />
                    <button
                      onClick={() => {
                        const query = `Provide case studies of ${selectedItem.title} implementations.`;
                        if (onSwitchToDecisionIntelligence) {
                          onSwitchToDecisionIntelligence(query, "market_dynamics", "Competitive Intelligence", "Competitive Intelligence");
                        }
                      }}
                      className="text-left text-zinc-700 hover:text-[#2d39d2] transition-colors leading-normal hover:underline select-text font-normal cursor-pointer font-sans text-[12px]"
                    >
                      Show corporate case studies & examples
                    </button>
                  </div>
                </div>
              </div>

            </div>
          )}
        </div>
        </>
      )}

    </div>
  );
}
