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

    // Filter by impact (removed)
    
    // Sort

    list.sort((a, b) => {
      if (sortBy === "recent") {
        return new Date(b.bookmark_created_at).getTime() - new Date(a.bookmark_created_at).getTime();
      }
      if (sortBy === "oldest") {
        return new Date(a.bookmark_created_at).getTime() - new Date(b.bookmark_created_at).getTime();
      }
      return 0;
    });

    return list;
  }, [bookmarks, activeFilter, searchQuery, sortBy]);



  const BookmarkCard = ({ item, type, onClick, onUnbookmark }: any) => {
    let title = "";
    let category = "";
    let term = "";
    let impact = "";
    let summary = "";
    let fullModuleName = "";
    
    if (type === "policy_risk") {
      title = item.signal_title;
      category = item.category || "Signal";
      term = "Policy";
      impact = item.impact_level || "Medium";
      summary = item.summary || item.description || "";
      fullModuleName = "POLICY & RISK MONITOR";
    } else if (type === "market_dynamics") {
      title = item.title || item.signal_name || item.id;
      category = item.category || item.sector || "Market";
      term = item.ring || item.term || "Dynamics";
      impact = item.relevance_level_live || item.impact_level || "Medium";
      summary = item.summary || item.title || "";
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
      fullModuleName = "FORWARD OUTLOOK";
    }

    const savedDate = item.bookmark_created_at ? new Date(item.bookmark_created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "N/A";

    return (
      <div 
        onClick={() => setSelectedBookmark({ ...item, _type: type, _title: title, _category: category, _impact: impact, _summary: summary, _fullModuleName: fullModuleName, _savedDate: savedDate })}
        className="w-full px-6 md:px-8 py-2 flex items-center justify-between gap-4 bg-white cursor-pointer"
      >
        <div className="flex-1 flex flex-col gap-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-600">
              {category} • {fullModuleName}
            </span>
          </div>
          <h3 className="text-[14px] font-normal text-zinc-800 truncate hover:text-violet-600">{title}</h3>
          <span className="text-[11px] text-zinc-400 font-medium">Saved {savedDate}</span>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button 
            onClick={onUnbookmark}
            className="p-1.5 text-violet-600 hover:bg-violet-50 rounded-[4px] transition-colors"
            title="Remove bookmark"
          >
            <Bookmark className="w-4 h-4 fill-violet-600" />
          </button>
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
    <div className="flex-1 h-full flex bg-white overflow-hidden relative justify-center select-none">
      <div className="w-full max-w-[1178px] mx-auto h-full flex flex-col bg-white flex-shrink-0 animate-fade-in border-x border-zinc-200 overflow-y-auto">
        {/* Header Section */}
        <div className="h-[53px] px-4 border-b border-zinc-100 flex items-center justify-between flex-shrink-0 bg-white">
          <div className="flex items-center gap-4">
            <h2 
              style={{ fontFamily: "'Source Serif 4', Georgia, Cambria, 'Times New Roman', Times, serif" }}
              className="text-[19px] font-semibold tracking-tight text-zinc-900 select-none font-serif-source"
            >
              My Bookmarks
            </h2>
          </div>
        </div>

        <div className="px-6 md:px-8 py-4 md:py-5 flex flex-col gap-4">
          <div className="flex flex-col gap-3">

          {/* Search, Filter, and Sort row */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input 
                type="text" 
                placeholder="Search bookmarks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-zinc-200 rounded-[4px] py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500/50 transition-all placeholder:text-zinc-400"
              />
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
                <div className="absolute right-0 mt-1.5 w-52 bg-white border border-zinc-200 rounded-[4px] shadow-lg py-1 z-50">
                  <div className="px-3 py-2 border-b border-zinc-100">
                    <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Sort Order</span>
                  </div>
                  {[
                    { id: "recent", label: "Recently saved" },
                    { id: "oldest", label: "Oldest first" }
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
            {(searchQuery || activeFilter !== "all" || sortBy !== "recent") && (
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
              className={`flex items-center gap-2 px-4 py-1.5 rounded-[4px] border text-[13px] font-medium transition-all whitespace-nowrap ${
                activeFilter === "all" 
                  ? "bg-zinc-900 border-zinc-900 text-white shadow-md shadow-zinc-200" 
                  : "bg-white border-zinc-200 text-zinc-600 hover:border-zinc-300"
              }`}
            >
              All ({totalCount})
            </button>
            <button 
              onClick={() => setActiveFilter("policy_risk")}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-[4px] border text-[13px] font-medium transition-all whitespace-nowrap ${
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
              className={`flex items-center gap-2 px-4 py-1.5 rounded-[4px] border text-[13px] font-medium transition-all whitespace-nowrap ${
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
              className={`flex items-center gap-2 px-4 py-1.5 rounded-[4px] border text-[13px] font-medium transition-all whitespace-nowrap ${
                activeFilter === "forward_outlook" 
                  ? "bg-zinc-900 border-zinc-900 text-white shadow-md shadow-zinc-200" 
                  : "bg-white border-zinc-200 text-zinc-600 hover:border-zinc-300"
              }`}
            >
              <Telescope className="w-3.5 h-3.5" />
              Forward Outlook ({bookmarks.forwardOutlook.length})
            </button>
          </div>

          {allFilteredSortedBookmarks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center font-sans bg-white border border-dashed border-zinc-200 rounded-xl">
              <Bookmark className="w-8 h-8 text-zinc-200 mb-2" />
              <p className="text-xs text-zinc-400 font-medium">
                {searchQuery || activeFilter !== "all" ? "No bookmarks match your filters." : "No bookmarked items found."}
              </p>
            </div>
          ) : (
            <div className="w-auto flex flex-col border-y border-zinc-200 divide-y divide-zinc-200 bg-white mb-20 -mx-6 md:-mx-8">
              {allFilteredSortedBookmarks.map((item, idx) => (
                <BookmarkCard 
                  key={item._bookmarkId || idx} 
                  item={item} 
                  type={item._bookmarkType} 
                  onClick={() => onNavigate(item._moduleKey || (item._bookmarkType === "policy_risk" ? "policy_risk_monitor" : item._bookmarkType === "market_dynamics" ? "market_dynamics" : "foreward_outlook"), item._bookmarkId)}
                  onUnbookmark={(e: React.MouseEvent) => handleUnbookmark(item._bookmarkType, item._bookmarkId, e)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
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
              {/* Header - Top Actions & Saved Date */}
              <div className="px-6 pt-3 pb-2 flex items-center justify-between gap-2">
                <span className="text-[11px] font-normal text-black">
                  Saved {selectedBookmark._savedDate}
                </span>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={(e) => {
                      handleUnbookmark(selectedBookmark._type, selectedBookmark._bookmarkId, e as any);
                      setSelectedBookmark(null);
                    }}
                    className="p-1.5 hover:bg-zinc-100 rounded-full transition-colors text-black"
                    title="Remove bookmark"
                  >
                    <Bookmark className="w-4 h-4 fill-black" />
                  </button>
                  <button 
                    onClick={() => setSelectedBookmark(null)}
                    className="p-1.5 hover:bg-zinc-100 rounded-full transition-colors text-black"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Content - Scrollable */}
              <div className="flex-1 overflow-y-auto px-6 pb-6 font-sans flex flex-col gap-3">
                {/* Category • Module */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-black">
                    {selectedBookmark._category} • {selectedBookmark._fullModuleName}
                  </span>
                </div>

                {/* Title */}
                <h2 className="text-lg font-bold text-black leading-tight">
                  {selectedBookmark._title}
                </h2>

                {/* Description - increased font size, lighter weight, full length, black color */}
                <div className="flex flex-col gap-3 pt-1">
                  <p className="text-[13px] font-light text-black leading-relaxed">
                    {selectedBookmark._summary}
                  </p>

                  {/* Business Impact */}
                  {(selectedBookmark.business_impact || selectedBookmark.write_up?.business_impact) && (
                    <div className="bg-zinc-50 border border-zinc-200 rounded-[4px] p-3 flex flex-col gap-2">
                      <h3 className="text-[10px] font-bold text-black uppercase tracking-widest">Business Impact</h3>
                      <div className="flex flex-col gap-1.5">
                        {(() => {
                          const impacts = selectedBookmark.business_impact || selectedBookmark.write_up?.business_impact || [];
                          if (impacts.length === 0) return null;
                          return (
                            <>
                              <div className="flex gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-black mt-1.5 shrink-0" />
                                <p className="text-[11px] text-black leading-snug font-medium">
                                  {impacts[0]}
                                </p>
                              </div>
                              {impacts.length > 1 && (
                                <span className="text-[10px] font-bold text-black ml-3.5">
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

              {/* Footer Actions */}
              <div className="px-6 py-4 border-t border-zinc-200 flex justify-start bg-white">
                <button 
                  onClick={() => {
                    onNavigate(selectedBookmark._moduleKey || (selectedBookmark._type === "policy_risk" ? "policy_risk_monitor" : selectedBookmark._type === "market_dynamics" ? "market_dynamics" : "foreward_outlook"), selectedBookmark._bookmarkId);
                    setSelectedBookmark(null);
                  }}
                  className="flex items-center gap-2 px-5 py-2 bg-black text-white rounded-[4px] text-[12px] font-bold hover:bg-zinc-800 transition-all shadow-sm w-fit"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
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
