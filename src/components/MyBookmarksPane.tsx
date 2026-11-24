import React, { useState, useEffect, useMemo, useRef } from "react";
import { Bookmark, Loader2, Search, ArrowUpDown, Shield, BarChart2, Telescope, ExternalLink, Share2, ChevronDown, Check, Filter, X, Plus, FileText, Pencil, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { supabase } from "../lib/supabase";
import NoteModal from "./NoteModal";

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

const getBookmarkNoteKey = (b: any) => {
  if (!b) return "";
  const id = b.id || b._bookmarkId || b.policy_signal_id || b.market_insight_id || b.trend_cluster_id;
  const type = b._type || b._bookmarkType;
  
  let primaryKey = `note_${id}`;
  if (type === "policy_risk") primaryKey = `note_policy_risk_${id}`;
  else if (type === "market_dynamics") primaryKey = `note_market_dynamics_${id}`;
  else if (type === "forward_outlook") primaryKey = `note_forward_outlook_${id}`;

  if (localStorage.getItem(primaryKey)) return primaryKey;

  if (b._bookmarkId && b._bookmarkId !== id) {
    let altKey = `note_${b._bookmarkId}`;
    if (type === "policy_risk") altKey = `note_policy_risk_${b._bookmarkId}`;
    else if (type === "market_dynamics") altKey = `note_market_dynamics_${b._bookmarkId}`;
    else if (type === "forward_outlook") altKey = `note_forward_outlook_${b._bookmarkId}`;
    if (localStorage.getItem(altKey)) return altKey;
  }

  return primaryKey;
};

const getFirstLineOfNote = (html: string) => {
  if (!html) return "Untitled Note";
  const text = html
    .replace(/<br\s*[\/]?>/gi, "\n")
    .replace(/<\/(p|div|li|h1|h2|h3|h4|h5|h6)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
  const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
  return lines[0] || "Untitled Note";
};

const BookmarkCard = React.memo(({ item, type, onSelect, onUnbookmark, onDeleteNote }: any) => {
  let title = "";
  let category = "";
  let term = "";
  let impact = "";
  let summary = "";
  let fullModuleName = "";
  
  if (type === "general_note") {
    title = getFirstLineOfNote(item.content);
    category = "General Notes";
    fullModuleName = "GENERAL NOTES";
    summary = item.content;
  } else if (type === "policy_risk") {
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
      onClick={() => onSelect({ item, type, title, category, impact, summary, fullModuleName, savedDate })}
      className={`w-full px-6 md:px-8 py-2.5 flex items-center justify-between gap-4 cursor-pointer transition-colors ${
        type === "general_note" 
          ? "bg-amber-50/40 hover:bg-amber-50/70 border-l-2 border-l-amber-400/70" 
          : "bg-white hover:bg-zinc-50"
      }`}
    >
      <div className="flex-1 flex flex-col gap-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-600">
            {type === "general_note" ? "General Notes" : `${category} • ${fullModuleName}`}
          </span>
        </div>
        <h3 className="text-[12.5px] font-normal text-zinc-800 truncate hover:text-violet-600 transition-colors">{title}</h3>
        <span className="text-[11px] text-zinc-400 font-medium">Saved {savedDate}</span>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        {type === "general_note" ? (
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onDeleteNote(item.id, e);
            }}
            className="p-1.5 text-zinc-600 hover:text-red-600 hover:bg-zinc-100 rounded-[4px] transition-colors cursor-pointer"
            title="Delete note"
          >
            <Trash2 className="w-4 h-4 text-zinc-600 hover:text-red-600" />
          </button>
        ) : (
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onUnbookmark(type, item._bookmarkId || item.id, title, e);
            }}
            className="p-1.5 text-violet-600 hover:bg-violet-50 rounded-[4px] transition-colors cursor-pointer"
            title="Remove bookmark"
          >
            <Bookmark className="w-4 h-4 fill-violet-600" />
          </button>
        )}
      </div>
    </div>
  );
});

export default function MyBookmarksPane({ clientId, userId, onNavigate }: MyBookmarksPaneProps) {
  const [loading, setLoading] = useState(true);
  const [bookmarks, setBookmarks] = useState<any>({
    policyRisk: [],
    marketDynamics: [],
    forwardOutlook: []
  });
  const [generalNotes, setGeneralNotes] = useState<Array<any>>([]);
  const [editingGeneralNote, setEditingGeneralNote] = useState<any>(null);
  const [bookmarkToRemove, setBookmarkToRemove] = useState<{ type: string; id: string; title?: string } | null>(null);
  const [noteToDelete, setNoteToDelete] = useState<{ id: string; title?: string } | null>(null);
  const [bookmarkNoteToDeleteKey, setBookmarkNoteToDeleteKey] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"recent" | "oldest" | "impact">("recent");
  const [activeFilter, setActiveFilter] = useState<"all" | "policy_risk" | "market_dynamics" | "forward_outlook">("all");
  const [selectedBookmark, setSelectedBookmark] = useState<any>(null);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isAddNoteOpen, setIsAddNoteOpen] = useState(false);
  const [isEditBookmarkNoteOpen, setIsEditBookmarkNoteOpen] = useState(false);
  const [noteUpdateCounter, setNoteUpdateCounter] = useState(0);
  const sortRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);
  const sidePanelRef = useRef<HTMLDivElement>(null);

  const loadGeneralNotes = () => {
    try {
      const stored = localStorage.getItem("user_general_notes");
      if (stored) {
        setGeneralNotes(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Error loading general notes:", e);
    }
  };

  useEffect(() => {
    loadGeneralNotes();
  }, [noteUpdateCounter]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (sortRef.current && !sortRef.current.contains(target)) {
        setIsSortOpen(false);
      }
      if (filterRef.current && !filterRef.current.contains(target)) {
        setIsFilterOpen(false);
      }
      if (sidePanelRef.current && !sidePanelRef.current.contains(target)) {
        // Do not close side panel if click target is inside a modal or fixed backdrop
        const isModalClick = (target as HTMLElement)?.closest?.('.fixed, [role="dialog"]');
        if (!isModalClick) {
          setSelectedBookmark(null);
        }
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

  const handleUnbookmark = async (type: string, id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    
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

  const handleDeleteGeneralNote = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const nextNotes = generalNotes.filter(g => g.id !== id);
    setGeneralNotes(nextNotes);
    localStorage.setItem("user_general_notes", JSON.stringify(nextNotes));
    if (selectedBookmark && (selectedBookmark.id === id || selectedBookmark._bookmarkId === id)) {
      setSelectedBookmark(null);
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
    if (activeFilter === "all") {
      list = [...list, ...generalNotes.map((g: any) => ({
        ...g,
        _bookmarkId: g.id,
        _bookmarkType: "general_note",
        bookmark_created_at: g.updated_at || g.created_at
      }))];
    }

    // Filter by search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(item => {
        if (item._bookmarkType === "general_note") {
          const title = getFirstLineOfNote(item.content).toLowerCase();
          const rawContent = (item.content || "").toLowerCase();
          return title.includes(q) || rawContent.includes(q);
        }
        const title = (item.signal_title || item.title || item.trend_name || item.name || "").toLowerCase();
        const summary = (item.summary || item.description || "").toLowerCase();
        return title.includes(q) || summary.includes(q);
      });
    }

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
  }, [bookmarks, generalNotes, activeFilter, searchQuery, sortBy]);

  if (loading) {
    return (
      <div className="flex-1 h-full bg-[#fafafa] flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 text-violet-500 animate-spin" />
      </div>
    );
  }

  const totalCount = bookmarks.policyRisk.length + bookmarks.marketDynamics.length + bookmarks.forwardOutlook.length + generalNotes.length;

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
              My Notes & Bookmarks
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
                placeholder="Search bookmarks & notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-zinc-200 rounded-[4px] py-2 pl-10 pr-4 text-[13px] focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500/50 transition-all placeholder:text-zinc-400"
              />
            </div>

            {/* Sort Dropdown */}
            <div className="relative" ref={sortRef}>
              <button 
                onClick={() => setIsSortOpen(!isSortOpen)}
                className="shrink-0 flex items-center gap-2 px-3.5 py-2 bg-white border border-zinc-200 rounded-[6px] text-[12px] font-medium text-zinc-700 hover:bg-zinc-50 transition-colors shadow-2xs cursor-pointer"
              >
                <ArrowUpDown className="w-3.5 h-3.5 text-zinc-400" />
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

            {/* Add Note transparent button next to Sort button */}
            <button
              onClick={() => {
                setEditingGeneralNote(null);
                setIsAddNoteOpen(true);
              }}
              className="shrink-0 flex items-center gap-1.5 px-3.5 py-2 bg-transparent hover:bg-zinc-100 text-zinc-700 hover:text-zinc-900 border border-zinc-300 hover:border-zinc-400 text-[12px] font-medium rounded-[6px] transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-zinc-500" />
              <span className="whitespace-nowrap">Add Note</span>
            </button>

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
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            <button 
              onClick={() => setActiveFilter("all")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-[4px] border text-[10px] font-medium transition-all whitespace-nowrap cursor-pointer ${
                activeFilter === "all" 
                  ? "bg-zinc-900 border-zinc-900 text-white shadow-sm shadow-zinc-200" 
                  : "bg-white border-zinc-200 text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50"
              }`}
            >
              All ({totalCount})
            </button>
            <button 
              onClick={() => setActiveFilter("policy_risk")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-[4px] border text-[10px] font-medium transition-all whitespace-nowrap cursor-pointer ${
                activeFilter === "policy_risk" 
                  ? "bg-zinc-900 border-zinc-900 text-white shadow-sm shadow-zinc-200" 
                  : "bg-white border-zinc-200 text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50"
              }`}
            >
              <Shield className="w-3 h-3" />
              Policy & Risk ({bookmarks.policyRisk.length})
            </button>
            <button 
              onClick={() => setActiveFilter("market_dynamics")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-[4px] border text-[10px] font-medium transition-all whitespace-nowrap cursor-pointer ${
                activeFilter === "market_dynamics" 
                  ? "bg-zinc-900 border-zinc-900 text-white shadow-sm shadow-zinc-200" 
                  : "bg-white border-zinc-200 text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50"
              }`}
            >
              <BarChart2 className="w-3 h-3" />
              Market Dynamics ({bookmarks.marketDynamics.length})
            </button>
            <button 
              onClick={() => setActiveFilter("forward_outlook")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-[4px] border text-[10px] font-medium transition-all whitespace-nowrap cursor-pointer ${
                activeFilter === "forward_outlook" 
                  ? "bg-zinc-900 border-zinc-900 text-white shadow-sm shadow-zinc-200" 
                  : "bg-white border-zinc-200 text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50"
              }`}
            >
              <Telescope className="w-3 h-3" />
              Forward Outlook ({bookmarks.forwardOutlook.length})
            </button>
          </div>

          {allFilteredSortedBookmarks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center font-sans bg-white border border-dashed border-zinc-200 rounded-xl">
              <Bookmark className="w-8 h-8 text-zinc-200 mb-2" />
              <p className="text-xs text-zinc-400 font-medium">
                {searchQuery || activeFilter !== "all" ? "No bookmarks match your filters." : "No bookmarked items or notes found."}
              </p>
            </div>
          ) : (
            <div className="w-auto flex flex-col border-y border-zinc-200 divide-y divide-zinc-200 bg-white mb-20 -mx-6 md:-mx-8">
              {allFilteredSortedBookmarks.map((item, idx) => (
                <BookmarkCard 
                  key={item._bookmarkId || item.id || idx} 
                  item={item} 
                  type={item._bookmarkType} 
                  onSelect={({ item: selectedItem, type: selectedType, title: selTitle, category: selCat, impact: selImp, summary: selSum, fullModuleName: selFull, savedDate: selDate }: any) => {
                    setIsEditBookmarkNoteOpen(false);
                    setSelectedBookmark({ ...selectedItem, _type: selectedType, _title: selTitle, _category: selCat, _impact: selImp, _summary: selSum, _fullModuleName: selFull, _savedDate: selDate });
                  }}
                  onUnbookmark={(t: string, id: string, title: string) => {
                    setBookmarkToRemove({ type: t, id, title });
                  }}
                  onDeleteNote={(id: string) => setNoteToDelete({ id })}
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
            {/* Background Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/25 backdrop-blur-sm z-[99] transition-all"
            />
            
            <motion.div
              ref={sidePanelRef}
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed top-0 right-0 h-full w-[540px] max-w-[92vw] bg-white shadow-2xl z-[100] flex flex-col border-l border-zinc-200 select-text"
            >
              {/* Header - Top Actions & Saved Date */}
              <div className="px-6 pt-3.5 pb-2.5 flex items-center justify-between gap-2 border-b border-zinc-100 select-text">
                <span className="text-[11px] font-normal text-zinc-700 select-text">
                  Saved {selectedBookmark._savedDate}
                </span>
                <div className="flex items-center gap-2 select-none">
                  {selectedBookmark._type === "general_note" ? (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setNoteToDelete({
                          id: selectedBookmark.id || selectedBookmark._bookmarkId,
                          title: selectedBookmark._title
                        });
                      }}
                      className="p-1.5 hover:bg-zinc-100 rounded-full transition-colors text-zinc-600 hover:text-red-600 cursor-pointer"
                      title="Delete note"
                    >
                      <Trash2 className="w-4 h-4 text-zinc-600 hover:text-red-600" />
                    </button>
                  ) : (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setBookmarkToRemove({
                          type: selectedBookmark._type,
                          id: selectedBookmark._bookmarkId || selectedBookmark.id,
                          title: selectedBookmark._title
                        });
                      }}
                      className="p-1.5 hover:bg-zinc-100 rounded-full transition-colors text-black cursor-pointer"
                      title="Remove bookmark"
                    >
                      <Bookmark className="w-4 h-4 fill-black" />
                    </button>
                  )}
                  <button 
                    onClick={() => setSelectedBookmark(null)}
                    className="p-1.5 hover:bg-zinc-100 rounded-full transition-colors text-black cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Content - Scrollable & Selectable */}
              {selectedBookmark._type === "general_note" ? (
                <div className="flex-1 overflow-y-auto px-6 py-5 font-sans flex flex-col gap-4 select-text">
                  <div className="flex items-center gap-1.5 select-text">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-600 select-text">
                      General Notes
                    </span>
                  </div>

                  <h2 className="text-[15px] font-bold text-zinc-950 leading-snug select-text">
                    {selectedBookmark._title}
                  </h2>

                  <div className="bg-amber-50/50 border border-amber-200/80 rounded-[6px] p-4 flex flex-col gap-2.5 select-text mt-1">
                    <div className="flex items-center justify-between select-none border-b border-amber-200/60 pb-2">
                      <div className="flex items-center gap-1.5 text-[#2e5f7f] font-semibold text-[11px] uppercase tracking-wider">
                        <FileText className="w-3.5 h-3.5" />
                        <span>Note Content</span>
                      </div>
                      <button
                        onClick={() => {
                          setEditingGeneralNote(selectedBookmark);
                          setIsAddNoteOpen(true);
                        }}
                        className="text-[11px] font-medium text-[#2e5f7f] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Pencil className="w-3 h-3" />
                        <span>Edit Note</span>
                      </button>
                    </div>

                    <div
                      className="note-wysiwyg-content text-[13px] text-zinc-800 leading-relaxed font-sans pt-1 select-text"
                      dangerouslySetInnerHTML={{ __html: selectedBookmark.content }}
                    />
                  </div>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto px-6 py-5 font-sans flex flex-col gap-4 select-text">
                  {/* Category • Module */}
                  <div className="flex items-center gap-1.5 select-text">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-600 select-text">
                      {selectedBookmark._category} • {selectedBookmark._fullModuleName}
                    </span>
                  </div>

                  {/* Title - crisp size */}
                  <h2 className="text-[15px] font-bold text-zinc-950 leading-snug select-text">
                    {selectedBookmark._title}
                  </h2>

                  {/* Description - selectable */}
                  <div className="flex flex-col gap-3 pt-1 select-text">
                    <p className="text-[13px] font-light text-zinc-900 leading-relaxed select-text">
                      {selectedBookmark._summary}
                    </p>

                    {/* Business Impact */}
                    {(selectedBookmark.business_impact || selectedBookmark.write_up?.business_impact) && (
                      <div className="bg-zinc-50 border border-zinc-200 rounded-[4px] p-3.5 flex flex-col gap-2 select-text">
                        <h3 className="text-[10px] font-bold text-zinc-800 uppercase tracking-widest select-text">Business Impact</h3>
                        <div className="flex flex-col gap-1.5 select-text">
                          {(() => {
                            const impacts = selectedBookmark.business_impact || selectedBookmark.write_up?.business_impact || [];
                            if (impacts.length === 0) return null;
                            return (
                              <>
                                <div className="flex gap-2 select-text">
                                  <div className="w-1.5 h-1.5 rounded-full bg-zinc-800 mt-1.5 shrink-0 select-none" />
                                  <p className="text-[11.5px] text-zinc-900 leading-snug font-medium select-text">
                                    {impacts[0]}
                                  </p>
                                </div>
                                {impacts.length > 1 && (
                                  <span className="text-[10px] font-bold text-zinc-700 ml-3.5 select-text">
                                    +{impacts.length - 1} more in full insight
                                  </span>
                                )}
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    )}

                    {/* Notes Section in Expanded Pane (Under Business Impact) */}
                    {(() => {
                      const noteKey = getBookmarkNoteKey(selectedBookmark);
                      const savedNote = noteKey ? localStorage.getItem(noteKey) : null;
                      const hasNote = Boolean(savedNote && savedNote.trim());
                      return (
                        <div className="bg-amber-50/50 border border-amber-200/80 rounded-[6px] p-3.5 flex flex-col gap-2 select-text mt-1">
                          <div className="flex items-center justify-between select-none">
                            <div className="flex items-center gap-1.5 text-[#2e5f7f] font-semibold text-[11px] uppercase tracking-wider">
                              <FileText className="w-3.5 h-3.5" />
                              <span>My Note</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setIsEditBookmarkNoteOpen(true)}
                                className="text-[11px] font-medium text-[#2e5f7f] hover:underline flex items-center gap-1 cursor-pointer"
                              >
                                <Pencil className="w-3 h-3" />
                                <span>{hasNote ? "Edit Note" : "Add Note"}</span>
                              </button>
                              {hasNote && (
                                <button
                                  onClick={() => setBookmarkNoteToDeleteKey(noteKey)}
                                  className="text-[11px] font-medium text-red-600 hover:underline flex items-center gap-1 cursor-pointer ml-1"
                                  title="Delete Note"
                                >
                                  <Trash2 className="w-3 h-3 text-red-600" />
                                  <span>Delete Note</span>
                                </button>
                              )}
                            </div>
                          </div>

                          {hasNote ? (
                            <div
                              className="note-wysiwyg-content text-[12.5px] text-zinc-800 leading-relaxed font-sans pt-1 select-text"
                              dangerouslySetInnerHTML={{ __html: savedNote! }}
                            />
                          ) : (
                            <p className="text-[12px] italic text-zinc-400 font-sans select-text">
                              No note added yet for this bookmark. Click &quot;Add Note&quot; to write one.
                            </p>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}

              {/* Footer Actions */}
              {selectedBookmark._type !== "general_note" && (
                <div className="px-6 py-4 border-t border-zinc-200 flex justify-start bg-white select-none">
                  <button 
                    onClick={() => {
                      onNavigate(selectedBookmark._moduleKey || (selectedBookmark._type === "policy_risk" ? "policy_risk_monitor" : selectedBookmark._type === "market_dynamics" ? "market_dynamics" : "foreward_outlook"), selectedBookmark._bookmarkId);
                      setSelectedBookmark(null);
                    }}
                    className="flex items-center gap-2 px-5 py-2 bg-black text-white rounded-[4px] text-[12px] font-bold hover:bg-zinc-800 transition-all shadow-sm w-fit cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Open full insight
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Remove Bookmark Confirmation Modal */}
      <AnimatePresence>
        {bookmarkToRemove && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-[150] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-lg shadow-xl border border-zinc-200 max-w-sm w-full p-5 flex flex-col gap-4 font-sans select-none"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 bg-red-50 text-red-600 rounded-full shrink-0">
                  <Bookmark className="w-5 h-5 fill-red-600 text-red-600" />
                </div>
                <div className="flex flex-col gap-1">
                  <h3 className="text-[14px] font-bold text-zinc-900">Remove Bookmark?</h3>
                  <p className="text-[12px] text-zinc-600 leading-relaxed">
                    Are you sure you want to remove this bookmark?
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100">
                <button
                  onClick={() => setBookmarkToRemove(null)}
                  className="px-3.5 py-1.5 text-[12px] font-medium text-zinc-700 hover:bg-zinc-100 rounded-[4px] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (bookmarkToRemove) {
                      handleUnbookmark(bookmarkToRemove.type, bookmarkToRemove.id);
                      setBookmarkToRemove(null);
                      if (selectedBookmark && (selectedBookmark._bookmarkId === bookmarkToRemove.id || selectedBookmark.id === bookmarkToRemove.id)) {
                        setSelectedBookmark(null);
                      }
                    }
                  }}
                  className="px-3.5 py-1.5 text-[12px] font-medium text-white bg-red-600 hover:bg-red-700 rounded-[4px] transition-colors cursor-pointer shadow-2xs"
                >
                  Remove
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete General Note Confirmation Modal */}
      <AnimatePresence>
        {noteToDelete && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-[160] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-lg shadow-xl border border-zinc-200 max-w-sm w-full p-5 flex flex-col gap-4 font-sans select-none"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 bg-red-50 text-red-600 rounded-full shrink-0">
                  <Trash2 className="w-5 h-5 text-red-600" />
                </div>
                <div className="flex flex-col gap-1">
                  <h3 className="text-[14px] font-bold text-zinc-900">Delete Note?</h3>
                  <p className="text-[12px] text-zinc-600 leading-relaxed">
                    Are you sure you want to delete this note? This action cannot be undone.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100">
                <button
                  onClick={() => setNoteToDelete(null)}
                  className="px-3.5 py-1.5 text-[12px] font-medium text-zinc-700 hover:bg-zinc-100 rounded-[4px] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (noteToDelete) {
                      handleDeleteGeneralNote(noteToDelete.id);
                      setNoteToDelete(null);
                    }
                  }}
                  className="px-3.5 py-1.5 text-[12px] font-medium text-white bg-red-600 hover:bg-red-700 rounded-[4px] transition-colors cursor-pointer shadow-2xs"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Bookmark Note Confirmation Modal */}
      <AnimatePresence>
        {bookmarkNoteToDeleteKey && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-[160] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-lg shadow-xl border border-zinc-200 max-w-sm w-full p-5 flex flex-col gap-4 font-sans select-none"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 bg-red-50 text-red-600 rounded-full shrink-0">
                  <Trash2 className="w-5 h-5 text-red-600" />
                </div>
                <div className="flex flex-col gap-1">
                  <h3 className="text-[14px] font-bold text-zinc-900">Delete Note?</h3>
                  <p className="text-[12px] text-zinc-600 leading-relaxed">
                    Are you sure you want to delete the note added to this bookmark?
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100">
                <button
                  onClick={() => setBookmarkNoteToDeleteKey(null)}
                  className="px-3.5 py-1.5 text-[12px] font-medium text-zinc-700 hover:bg-zinc-100 rounded-[4px] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (bookmarkNoteToDeleteKey) {
                      localStorage.removeItem(bookmarkNoteToDeleteKey);
                      setNoteUpdateCounter(prev => prev + 1);
                      setBookmarkNoteToDeleteKey(null);
                    }
                  }}
                  className="px-3.5 py-1.5 text-[12px] font-medium text-white bg-red-600 hover:bg-red-700 rounded-[4px] transition-colors cursor-pointer shadow-2xs"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add / Edit General Note WYSIWYG Modal */}
      <NoteModal
        isOpen={isAddNoteOpen}
        onClose={() => {
          setIsAddNoteOpen(false);
          setEditingGeneralNote(null);
        }}
        title={editingGeneralNote ? "Edit General Note" : "Add a Note"}
        initialContent={editingGeneralNote ? editingGeneralNote.content : ""}
        onSave={async (contentHtml) => {
          if (contentHtml && contentHtml.trim()) {
            if (editingGeneralNote) {
              const updated = generalNotes.map(n => n.id === editingGeneralNote.id ? { ...n, content: contentHtml, updated_at: new Date().toISOString() } : n);
              setGeneralNotes(updated);
              localStorage.setItem("user_general_notes", JSON.stringify(updated));
              if (selectedBookmark && (selectedBookmark.id === editingGeneralNote.id || selectedBookmark._bookmarkId === editingGeneralNote.id)) {
                const updatedDate = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
                setSelectedBookmark({
                  ...selectedBookmark,
                  content: contentHtml,
                  _title: getFirstLineOfNote(contentHtml),
                  _savedDate: updatedDate
                });
              }
            } else {
              const newNote = {
                id: `gen_note_${Date.now()}`,
                content: contentHtml,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              };
              const updated = [newNote, ...generalNotes];
              setGeneralNotes(updated);
              localStorage.setItem("user_general_notes", JSON.stringify(updated));
            }
          }
          setEditingGeneralNote(null);
          setIsAddNoteOpen(false);
        }}
      />

      {/* Edit Note Modal for Selected Bookmark */}
      {selectedBookmark && selectedBookmark._type !== "general_note" && (
        <NoteModal
          isOpen={isEditBookmarkNoteOpen}
          onClose={() => setIsEditBookmarkNoteOpen(false)}
          title={selectedBookmark._title}
          initialContent={getBookmarkNoteKey(selectedBookmark) ? (localStorage.getItem(getBookmarkNoteKey(selectedBookmark)) || "") : ""}
          onSave={async (contentHtml) => {
            const key = getBookmarkNoteKey(selectedBookmark);
            if (key) {
              if (contentHtml && contentHtml.trim()) {
                localStorage.setItem(key, contentHtml);
              } else {
                localStorage.removeItem(key);
              }
              setNoteUpdateCounter(prev => prev + 1);
            }
          }}
        />
      )}
    </div>
  );
}
