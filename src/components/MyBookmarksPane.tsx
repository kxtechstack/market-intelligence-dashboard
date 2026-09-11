import React, { useState, useEffect, useMemo, useRef } from "react";
import { Bookmark, Loader2, Search, ArrowUpDown, Shield, BarChart2, Telescope, ExternalLink, Share2, ChevronDown, Check, Filter, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { supabase } from "../lib/supabase";

interface MyBookmarksPaneProps {
  clientId: string;
  userId: string;
  onNavigate: (module: string, id: string) => void;
}

const getImpactStyles = (imp: string) => {
  const normalizedImp = (imp || "").toLowerCase();
  
  if (normalizedImp === "critical") return "bg-red-50 text-red-600 border border-red-100";
  if (normalizedImp === "high") return "bg-orange-50 text-orange-600 border border-orange-100";
  if (normalizedImp === "medium") return "bg-yellow-50 text-yellow-600 border border-yellow-100";
  if (normalizedImp === "low") return "bg-emerald-50 text-emerald-600 border border-emerald-100";

  return "bg-zinc-50 text-zinc-500 border border-zinc-100";
};

export default function MyBookmarksPane({ clientId, userId, onNavigate }: MyBookmarksPaneProps) {
  const [loading, setLoading] = useState(true);
  const [bookmarks, setBookmarks] = useState<any>({
    policyRisk: [],
    marketDynamics: [],
    forwardOutlook: []
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"recent" | "oldest" | "impact">("recent");
  const [activeFilter, setActiveFilter] = useState<"all" | "policy_risk" | "market_dynamics" | "forward_outlook">("all");
  const [impactFilters, setImpactFilters] = useState<string[]>([]);
  const [selectedBookmark, setSelectedBookmark] = useState<any>(null);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);
  const sidePanelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(event.target as Node)) {
        setIsSortOpen(false);
      }
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false);
      }
      if (sidePanelRef.current && !sidePanelRef.current.contains(event.target as Node)) {
        setSelectedBookmark(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const resetFilters = () => {
    setSearchQuery("");
    setImpactFilters([]);
    setActiveFilter("all");
    setSortBy("recent");
  };

  const fetchBookmarks = async (silent = false) => {
    if (!clientId || !userId) return;
    if (!silent) setLoading(true);
    
    try {
      const { data: bData, error } = await supabase
        .from("bookmarks")
        .select(`
          created_at,
          policy_signal_id,
          market_insight_id,
          trend_cluster_id,
          policy_signals (*),
          market_insights:market_insights_live (*),
          trend_clusters (*)
        `)
        .eq("client_id", clientId)
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const policyRisk: any[] = [];
      const marketDynamics: any[] = [];
      let forwardOutlook: any[] = [];

      const trendClusterIds: string[] = [];

      (bData || []).forEach((b: any) => {
        const commonData = {
          bookmark_created_at: b.created_at,
          _bookmarkId: b.policy_signal_id || b.market_insight_id || b.trend_cluster_id
        };
        if (b.policy_signal_id && b.policy_signals) {
          policyRisk.push({ ...b.policy_signals, ...commonData, _bookmarkType: "policy_risk" });
        } else if (b.market_insight_id && b.market_insights) {
          marketDynamics.push({ ...b.market_insights, ...commonData, _bookmarkType: "market_dynamics" });
        } else if (b.trend_cluster_id && b.trend_clusters) {
          trendClusterIds.push(b.trend_cluster_id);
          forwardOutlook.push({ ...b.trend_clusters, ...commonData, _bookmarkType: "forward_outlook" });
        }
      });

      // Enhance forward outlook items with snapshot data for accurate impact_level and summary
      if (trendClusterIds.length > 0) {
        try {
          const { data: snapshotData, error: snapshotError } = await supabase
            .from("trend_snapshots_latest")
            .select("*")
            .in("trend_id", trendClusterIds);
            
          if (!snapshotError && snapshotData) {
            forwardOutlook = forwardOutlook.map(item => {
              const snap = snapshotData.find(s => s.trend_id === item._bookmarkId);
              if (snap) {
                return { ...item, ...snap };
              }
              return item;
            });
          }
        } catch (snapErr) {
          console.error("Error fetching trend snapshots:", snapErr);
        }
      }

      setBookmarks({
        policyRisk,
        marketDynamics,
        forwardOutlook
      });

    } catch (err) {
      console.error("Error fetching bookmarks:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookmarks();
    
    // Listen for bookmark updates from other components
    const handleUpdate = () => {
      fetchBookmarks(true);
    };
    window.addEventListener("bookmarks-updated", handleUpdate);
    return () => window.removeEventListener("bookmarks-updated", handleUpdate);
  }, [clientId, userId]);

  const handleUnbookmark = async (type: string, id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Optimistic UI update
    setBookmarks((prev: any) => {
      const next = { ...prev };
      if (type === "policy_risk") {
        next.policyRisk = next.policyRisk.filter((item: any) => item._bookmarkId !== id);
      } else if (type === "market_dynamics") {
        next.marketDynamics = next.marketDynamics.filter((item: any) => item._bookmarkId !== id);
      } else if (type === "forward_outlook") {
        next.forwardOutlook = next.forwardOutlook.filter((item: any) => item._bookmarkId !== id);
      }
      return next;
    });

    try {
      let col = "";
      if (type === "policy_risk") col = "policy_signal_id";
      if (type === "market_dynamics") col = "market_insight_id";
      if (type === "forward_outlook") col = "trend_cluster_id";

      const { error } = await supabase
        .from("bookmarks")
        .delete()
        .eq("client_id", clientId)
        .eq("user_id", userId)
        .eq(col, id);

      if (error) throw error;
      
      // Notify other components
      window.dispatchEvent(new CustomEvent("bookmarks-updated"));
    } catch (err) {
      console.error("Error unbookmarking:", err);
      // Revert on error
      fetchBookmarks();
    }
  };

  const allFilteredSortedBookmarks = useMemo(() => {
    let list: any[] = [];
    if (activeFilter === "all" || activeFilter === "policy_risk") {
      list = [...list, ...bookmarks.policyRisk.map((b: any) => ({ ...b, _moduleKey: "policy_risk_monitor" }))];
    }
    if (activeFilter === "all" || activeFilter === "market_dynamics") {
      list = [...list, ...bookmarks.marketDynamics.map((b: any) => ({ ...b, _moduleKey: "market_dynamics" }))];
    }
    if (activeFilter === "all" || activeFilter === "forward_outlook") {
      list = [...list, ...bookmarks.forwardOutlook.map((b: any) => ({ ...b, _moduleKey: "foreward_outlook" }))];
    }

    // Filter by search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(item => {
        const title = (item.signal_title || item.title || item.trend_name || item.name || "").toLowerCase();
        const summary = (item.summary || item.description || "").toLowerCase();
        return title.includes(q) || summary.includes(q);
      });
    }

    // Filter by impact
    if (impactFilters.length > 0) {
      list = list.filter(item => {
        const imp = (item.write_up?.impact || item.impact_level || item.relevance_level_live || "Medium").toLowerCase();
        return impactFilters.includes(imp.charAt(0).toUpperCase() + imp.slice(1));
      });
    }

    // Sort
    list.sort((a, b) => {
      if (sortBy === "recent") {
        return new Date(b.bookmark_created_at).getTime() - new Date(a.bookmark_created_at).getTime();
      }
      if (sortBy === "oldest") {
        return new Date(a.bookmark_created_at).getTime() - new Date(b.bookmark_created_at).getTime();
      }
      if (sortBy === "impact") {
        const getImpactValue = (imp: string) => {
          const val = (imp || "").toLowerCase();
          if (val === "critical") return 4;
          if (val === "high") return 3;
          if (val === "medium") return 2;
          if (val === "low") return 1;
          return 0;
        };
        const impA = getImpactValue(a.write_up?.impact || a.impact_level || a.relevance_level_live);
        const impB = getImpactValue(b.write_up?.impact || b.impact_level || b.relevance_level_live);
        if (impA !== impB) return impB - impA;
        // Fallback to recent
        return new Date(b.bookmark_created_at).getTime() - new Date(a.bookmark_created_at).getTime();
      }
      return 0;
    });

    return list;
  }, [bookmarks, activeFilter, searchQuery, sortBy, impactFilters]);

  const toggleImpactFilter = (impact: string) => {
    setImpactFilters(prev => 
      prev.includes(impact) ? prev.filter(i => i !== impact) : [...prev, impact]
    );
  };

  const BookmarkCard = ({ item, type, onClick, onUnbookmark, showModuleIcon }: any) => {
    let title = "";
    let category = "";
    let term = "";
    let impact = "";
    let summary = "";
    let moduleIcon = null;
    let fullModuleName = "";
    
    if (type === "policy_risk") {
      title = item.signal_title;
      category = item.category || "Signal";
      term = "Policy";
      impact = item.impact_level || "Medium";
      summary = item.summary || item.description || "";
      moduleIcon = <Shield className="w-3 h-3 text-zinc-400" />;
      fullModuleName = "POLICY & RISK MONITOR";
    } else if (type === "market_dynamics") {
      title = item.title || item.signal_name || item.id;
      category = item.category || item.sector || "Market";
      term = item.ring || item.term || "Dynamics";
      impact = item.relevance_level_live || item.impact_level || "Medium";
      summary = item.summary || item.title || "";
      moduleIcon = <BarChart2 className="w-3 h-3 text-zinc-400" />;
      fullModuleName = "MARKET DYNAMICS";
    } else if (type === "forward_outlook") {
      title = item.title || item.trend_name || item.cluster_name || item.name || item.id;
      category = item.category || item.sector || "Trend";
      term = item.horizon || item.term || item.ring || "Outlook";
      if (term === "near_term") term = "Near-Term";
      if (term === "mid_term") term = "Mid-Term";
      if (term === "long_term") term = "Long-Term";
      impact = item.write_up?.impact || item.impact_level || "Medium";
      summary = item.write_up?.summary || item.summary || item.description || "";
      moduleIcon = <Telescope className="w-3 h-3 text-zinc-400" />;
      fullModuleName = "FORWARD OUTLOOK";
    }

    const savedDate = item.bookmark_created_at ? new Date(item.bookmark_created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "N/A";

    return (
      <div 
        onClick={() => setSelectedBookmark({ ...item, _type: type, _title: title, _category: category, _impact: impact, _summary: summary, _fullModuleName: fullModuleName, _savedDate: savedDate, _moduleIcon: moduleIcon })}
        className="bg-white border border-zinc-200 rounded-[4px] p-4 flex flex-col hover:border-zinc-300 hover:shadow-sm transition-all cursor-pointer font-sans relative group"
      >
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-1.5">
            {showModuleIcon && moduleIcon}
            <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-400">
              {category} • {fullModuleName}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-[3px] ${getImpactStyles(impact)}`}>
              {impact}
            </span>
            <button 
              onClick={onUnbookmark}
              className="shrink-0 text-violet-600 hover:text-violet-700 transition-colors"
              title="Remove bookmark"
            >
              <Bookmark className="w-3.5 h-3.5 fill-violet-600" />
            </button>
          </div>
        </div>
        <h3 className="text-xs font-bold text-zinc-800 pr-6 group-hover:text-violet-600 transition-colors">{title}</h3>
        {summary && (
          <p className="text-[11px] text-zinc-500 line-clamp-1 mt-1 leading-normal">
            {summary}
          </p>
        )}
        
        {/* Footer Row */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-zinc-100">
          <span className="text-[10.5px] text-zinc-400 font-medium">
            Saved {savedDate}
          </span>
          <div className="flex items-center gap-3">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onClick();
              }}
              className="flex items-center gap-1 text-[10.5px] text-zinc-500 hover:text-violet-600 font-medium transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
              Open
            </button>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                // Mock share
                if (navigator.share) {
                  navigator.share({ title, text: summary, url: window.location.href });
                }
              }}
              className="flex items-center gap-1 text-[10.5px] text-zinc-500 hover:text-violet-600 font-medium transition-colors"
            >
              <Share2 className="w-3 h-3" />
              Share
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex-1 h-full bg-[#fafafa] flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 text-violet-500 animate-spin" />
      </div>
    );
  }

  const totalCount = bookmarks.policyRisk.length + bookmarks.marketDynamics.length + bookmarks.forwardOutlook.length;

  return (
    <div className="flex-1 h-full bg-[#fafafa] overflow-y-auto p-6 md:p-8 select-none">
      <div className="max-w-4xl mx-auto flex flex-col gap-6">
        {/* Header Section */}
        <div className="flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-[6px] bg-white border border-zinc-200 flex items-center justify-center shadow-sm">
                <Bookmark className="w-4.5 h-4.5 text-violet-600 fill-violet-600" />
              </div>
              <div>
                <h1 className="text-xl sm:text-[22px] font-semibold leading-tight tracking-tight text-[#111827] font-sans">My Bookmarks</h1>
                <p className="text-[13px] text-zinc-500 font-medium mt-0.5">
                  Saved insights across all modules
                </p>
              </div>
            </div>
          </div>

          {/* Search, Filter, and Sort row */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input 
                type="text" 
                placeholder="Search bookmarks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-zinc-200 rounded-[6px] py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500/50 transition-all placeholder:text-zinc-400"
              />
            </div>

            {/* Impact Dropdown */}
            <div className="relative" ref={filterRef}>
              <button 
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className={`shrink-0 flex items-center gap-2 px-4 py-2.5 bg-white border rounded-[6px] text-[13px] font-medium transition-all shadow-sm ${
                  impactFilters.length > 0 ? "border-violet-200 text-violet-700 bg-violet-50/30" : "border-zinc-200 text-zinc-700 hover:bg-zinc-50"
                }`}
              >
                <span>Impact</span>
                {impactFilters.length > 0 && (
                  <span className="flex items-center justify-center w-5 h-5 bg-zinc-900 text-white text-[10px] font-bold rounded-full">
                    {impactFilters.length}
                  </span>
                )}
                <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 transition-transform ${isFilterOpen ? "rotate-180" : ""}`} />
              </button>

              {isFilterOpen && (
                <div className="absolute left-0 mt-1.5 w-48 bg-white border border-zinc-200 rounded-[6px] shadow-lg py-1 z-50">
                  <div className="flex flex-col py-1">
                    {["Critical", "High", "Medium", "Low"].map((imp) => (
                      <button
                        key={imp}
                        onClick={() => toggleImpactFilter(imp)}
                        className="w-full flex items-center gap-3 px-3 py-2 text-[13px] text-zinc-700 hover:bg-zinc-50 transition-colors text-left"
                      >
                        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                          impactFilters.includes(imp) ? "bg-zinc-900 border-zinc-900" : "border-zinc-300 bg-white"
                        }`}>
                          {impactFilters.includes(imp) && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <span className={impactFilters.includes(imp) ? "font-semibold text-zinc-900" : ""}>{imp}</span>
                      </button>
                    ))}
                  </div>
                  {impactFilters.length > 0 && (
                    <div className="px-3 py-2 border-t border-zinc-100 flex justify-end">
                      <button 
                        onClick={() => setImpactFilters([])}
                        className="text-[11px] text-zinc-500 font-bold hover:text-zinc-800 transition-colors"
                      >
                        Clear
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Sort Dropdown */}
            <div className="relative" ref={sortRef}>
              <button 
                onClick={() => setIsSortOpen(!isSortOpen)}
                className="shrink-0 flex items-center gap-2 px-4 py-2.5 bg-white border border-zinc-200 rounded-[6px] text-[13px] font-medium text-zinc-700 hover:bg-zinc-50 transition-colors shadow-sm"
              >
                <ArrowUpDown className="w-4 h-4 text-zinc-400" />
                <span className="whitespace-nowrap">
                  Sort: {sortBy === "recent" ? "Recently saved" : sortBy === "oldest" ? "Oldest first" : "Impact level"}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 transition-transform ${isSortOpen ? "rotate-180" : ""}`} />
              </button>

              {isSortOpen && (
                <div className="absolute right-0 mt-1.5 w-52 bg-white border border-zinc-200 rounded-[6px] shadow-lg py-1 z-50">
                  <div className="px-3 py-2 border-b border-zinc-100">
                    <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Sort Order</span>
                  </div>
                  {[
                    { id: "recent", label: "Recently saved" },
                    { id: "oldest", label: "Oldest first" },
                    { id: "impact", label: "Impact level (high to low)" }
                  ].map((option) => (
                    <button
                      key={option.id}
                      onClick={() => {
                        setSortBy(option.id as any);
                        setIsSortOpen(false);
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 text-[13px] text-zinc-700 hover:bg-zinc-50 transition-colors text-left"
                    >
                      <span>{option.label}</span>
                      {sortBy === option.id && <Check className="w-3.5 h-3.5 text-violet-600" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Reset Button */}
            {(searchQuery || impactFilters.length > 0 || activeFilter !== "all" || sortBy !== "recent") && (
              <button 
                onClick={resetFilters}
                className="text-[12px] font-bold text-zinc-400 hover:text-violet-600 transition-colors whitespace-nowrap ml-1"
              >
                Reset filters
              </button>
            )}
          </div>

          {/* Module Filter Pills */}
          <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar">
            <button 
              onClick={() => setActiveFilter("all")}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-full border text-[13px] font-medium transition-all whitespace-nowrap ${
                activeFilter === "all" 
                  ? "bg-zinc-900 border-zinc-900 text-white shadow-md shadow-zinc-200" 
                  : "bg-white border-zinc-200 text-zinc-600 hover:border-zinc-300"
              }`}
            >
              All ({totalCount})
            </button>
            <button 
              onClick={() => setActiveFilter("policy_risk")}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-full border text-[13px] font-medium transition-all whitespace-nowrap ${
                activeFilter === "policy_risk" 
                  ? "bg-zinc-900 border-zinc-900 text-white shadow-md shadow-zinc-200" 
                  : "bg-white border-zinc-200 text-zinc-600 hover:border-zinc-300"
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              Policy & Risk ({bookmarks.policyRisk.length})
            </button>
            <button 
              onClick={() => setActiveFilter("market_dynamics")}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-full border text-[13px] font-medium transition-all whitespace-nowrap ${
                activeFilter === "market_dynamics" 
                  ? "bg-zinc-900 border-zinc-900 text-white shadow-md shadow-zinc-200" 
                  : "bg-white border-zinc-200 text-zinc-600 hover:border-zinc-300"
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5" />
              Market Dynamics ({bookmarks.marketDynamics.length})
            </button>
            <button 
              onClick={() => setActiveFilter("forward_outlook")}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-full border text-[13px] font-medium transition-all whitespace-nowrap ${
                activeFilter === "forward_outlook" 
                  ? "bg-zinc-900 border-zinc-900 text-white shadow-md shadow-zinc-200" 
                  : "bg-white border-zinc-200 text-zinc-600 hover:border-zinc-300"
              }`}
            >
              <Telescope className="w-3.5 h-3.5" />
              Forward Outlook ({bookmarks.forwardOutlook.length})
            </button>
          </div>
        </div>

        {allFilteredSortedBookmarks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center font-sans bg-white border border-dashed border-zinc-200 rounded-xl">
            <Bookmark className="w-8 h-8 text-zinc-200 mb-2" />
            <p className="text-xs text-zinc-400 font-medium">
              {searchQuery || impactFilters.length > 0 ? "No bookmarks match your filters." : "No bookmarked items found."}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5 pb-20">
            {allFilteredSortedBookmarks.map((item, idx) => (
              <BookmarkCard 
                key={item._bookmarkId || idx} 
                item={item} 
                type={item._bookmarkType} 
                showModuleIcon={activeFilter === "all"}
                onClick={() => onNavigate(item._moduleKey || (item._bookmarkType === "policy_risk" ? "policy_risk_monitor" : item._bookmarkType === "market_dynamics" ? "market_dynamics" : "foreward_outlook"), item._bookmarkId)}
                onUnbookmark={(e: React.MouseEvent) => handleUnbookmark(item._bookmarkType, item._bookmarkId, e)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Side Panel Overlay */}
      <AnimatePresence>
        {selectedBookmark && (
          <>
            {/* Background Backdrop (optional but helps for clicking outside if panel is narrow) */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/5 z-[99]"
            />
            
            <motion.div
              ref={sidePanelRef}
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed top-0 right-0 h-full w-[420px] bg-white shadow-2xl z-[100] flex flex-col border-l border-zinc-200"
            >
              {/* Header - Top Actions */}
              <div className="p-6 flex items-center justify-end gap-3">
                <button 
                  onClick={(e) => {
                    handleUnbookmark(selectedBookmark._type, selectedBookmark._bookmarkId, e as any);
                    setSelectedBookmark(null);
                  }}
                  className="p-2 hover:bg-zinc-100 rounded-full transition-colors text-violet-600"
                  title="Remove bookmark"
                >
                  <Bookmark className="w-5 h-5 fill-violet-600" />
                </button>
                <button 
                  onClick={() => setSelectedBookmark(null)}
                  className="p-2 hover:bg-zinc-100 rounded-full transition-colors text-zinc-400 hover:text-zinc-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-hidden px-8 pb-8 font-sans">
                <div className="flex flex-col gap-6 h-full">
                  {/* Category • Module & Impact */}
                  <div className="flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-1.5">
                      {selectedBookmark._moduleIcon}
                      <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-400">
                        {selectedBookmark._category} • {selectedBookmark._fullModuleName}
                      </span>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-[3px] ${getImpactStyles(selectedBookmark._impact)}`}>
                      {selectedBookmark._impact}
                    </span>
                  </div>

                  {/* Title */}
                  <h2 className="text-xl font-bold text-zinc-900 leading-tight shrink-0 line-clamp-2">
                    {selectedBookmark._title}
                  </h2>

                  {/* Metadata Box - Standardized */}
                  <div className="bg-white border border-zinc-200 rounded-[6px] p-4 flex flex-col gap-2.5 shadow-sm shrink-0">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Saved</span>
                      <span className="text-[11px] font-bold text-zinc-700">{selectedBookmark._savedDate}</span>
                    </div>
                  </div>

                  {/* Description - Clamped to prevent scroll */}
                  <div className="flex flex-col gap-4">
                    <p className="text-[13px] text-zinc-600 leading-relaxed line-clamp-8">
                      {selectedBookmark._summary}
                    </p>

                    {/* Business Impact Preview - Standardized */}
                    {(selectedBookmark.business_impact || selectedBookmark.write_up?.business_impact) && (
                      <div className="bg-violet-50/50 border border-violet-100/50 rounded-[8px] p-5 flex flex-col gap-3 shrink-0">
                        <h3 className="text-[10px] font-bold text-violet-600 uppercase tracking-widest">Business Impact</h3>
                        <div className="flex flex-col gap-2">
                          {(() => {
                            const impacts = selectedBookmark.business_impact || selectedBookmark.write_up?.business_impact || [];
                            if (impacts.length === 0) return null;
                            return (
                              <>
                                <div className="flex gap-2.5">
                                  <div className="w-1.5 h-1.5 rounded-full bg-violet-400 mt-1.5 shrink-0" />
                                  <p className="text-[12px] text-zinc-700 leading-snug font-medium italic line-clamp-2">
                                    {impacts[0]}
                                  </p>
                                </div>
                                {impacts.length > 1 && (
                                  <span className="text-[11px] font-bold text-violet-400 ml-4">
                                    +{impacts.length - 1} more in full insight
                                  </span>
                                )}
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="p-6 border-t border-zinc-100 flex justify-start bg-white">
                <button 
                  onClick={() => {
                    onNavigate(selectedBookmark._moduleKey || (selectedBookmark._type === "policy_risk" ? "policy_risk_monitor" : selectedBookmark._type === "market_dynamics" ? "market_dynamics" : "foreward_outlook"), selectedBookmark._bookmarkId);
                    setSelectedBookmark(null);
                  }}
                  className="flex items-center gap-2 px-6 py-2.5 bg-zinc-900 text-white rounded-[6px] text-[13px] font-bold hover:bg-zinc-800 transition-all shadow-sm w-fit"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open full insight
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
