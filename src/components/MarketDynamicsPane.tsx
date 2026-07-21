import React, { useState, useEffect, useMemo, useRef } from "react";
import { Sparkles, Bookmark, Share2, FileText, Send, Loader2, ArrowUpRight, AlertTriangle, Minus, ArrowDownRight } from "lucide-react";
import { RADAR_TRENDS, TrendItem, SourceItem } from "./ForewardOutlookPane";

interface MarketDynamicsPaneProps {
  onReturn: () => void;
  clientId: string;
  userId: string;
}

interface ChatMessage {
  id: string;
  role: "user" | "model";
  text: string;
  timestamp: Date;
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
  if (cat.includes("research")) {
    return "bg-sky-50 border border-sky-200 text-sky-800";
  }
  if (cat.includes("innovation")) {
    return "bg-emerald-50 border border-emerald-200 text-emerald-800";
  }
  if (cat.includes("investment") || cat.includes("capital")) {
    return "bg-[#fffbeb] border border-[#fde68a] text-[#78350f]";
  }
  if (cat.includes("patent")) {
    return "bg-purple-50 border border-purple-200 text-purple-800";
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

export default function MarketDynamicsPane({ 
  onReturn,
  clientId,
  userId
}: MarketDynamicsPaneProps) {
  const [activeTab, setActiveTab] = useState<string>("insights");
  const [selectedTrendId, setSelectedTrendId] = useState<string>("embedded-fintech");
  const [isSourcesExpanded, setIsSourcesExpanded] = useState<boolean>(true);
  const [selectedSignalId, setSelectedSignalId] = useState<string | null>(() => {
    const initialTrend = RADAR_TRENDS.find(t => t.id === "embedded-fintech") || RADAR_TRENDS[0];
    return initialTrend?.sources?.[0]?.id || null;
  });
  
  useEffect(() => {
    setIsSourcesExpanded(true);
    const trend = RADAR_TRENDS.find(t => t.id === selectedTrendId) || RADAR_TRENDS[0];
    if (trend && trend.sources && trend.sources.length > 0) {
      setSelectedSignalId(trend.sources[0].id);
    } else {
      setSelectedSignalId(null);
    }
  }, [selectedTrendId]);

  // Chatbot states
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Similar Prospects states
  const [similarFutureProspects, setSimilarFutureProspects] = useState<any[]>([]);
  const [isFetchingSimilar, setIsFetchingSimilar] = useState(false);

  useEffect(() => {
    if (!selectedTrendId) return;
    
    setIsFetchingSimilar(true);
    const timer = setTimeout(() => {
      const current = RADAR_TRENDS.find(t => t.id === selectedTrendId);
      if (current) {
        const localSimilar = RADAR_TRENDS
          .filter(t => t.id !== selectedTrendId && t.sector === current.sector)
          .slice(0, 3)
          .map(t => ({
            id: t.id,
            title: t.title,
            sector: t.sector
          }));
        setSimilarFutureProspects(localSimilar);
      } else {
        setSimilarFutureProspects([]);
      }
      setIsFetchingSimilar(false);
    }, 400);

    return () => clearTimeout(timer);
  }, [selectedTrendId]);

  // Bookmarks states (persisted locally specifically for Market Dynamics)
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(`bookmarks_market_${clientId}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(`bookmarks_market_${clientId}`, JSON.stringify(bookmarkedIds));
    } catch (err) {
      console.error("Failed to save bookmarks:", err);
    }
  }, [bookmarkedIds, clientId]);

  const toggleBookmark = (id: string) => {
    setBookmarkedIds(prev => 
      prev.includes(id) ? prev.filter(bId => bId !== id) : [...prev, id]
    );
  };

  const isCurrentTrendBookmarked = bookmarkedIds.includes(selectedTrendId);

  // Selected Trend Item
  const selectedTrend = useMemo(() => {
    return RADAR_TRENDS.find(t => t.id === selectedTrendId) || RADAR_TRENDS[0];
  }, [selectedTrendId]);

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
      const industryText = selectedTrend ? `${selectedTrend.sector} Retail Strategy` : "";
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: text,
          clientId: clientId,
          industry: industryText
        })
      });

      if (!response.ok) throw new Error("Pipeline API failure");

      const data = await response.json();
      
      const assistantMsg: ChatMessage = {
        id: Math.random().toString(36).substring(2),
        role: "model",
        text: data.answer || "I've analyzed that trend and generated custom strategic guidance.",
        timestamp: new Date()
      };

      setChatHistory(prev => [...prev, assistantMsg]);
    } catch (err) {
      console.error("Chat API error:", err);
      setTimeout(() => {
        const assistantMsg: ChatMessage = {
          id: Math.random().toString(36).substring(2),
          role: "model",
          text: `Based on an analysis of **${selectedTrend.title}** within the **${selectedTrend.sector}** space: this development directly affects Near-Term loyalty frameworks. We recommend allocating up to 12% of the tactical innovation budget to evaluate API-first pilot capabilities. Let me know if you would like to run additional scenario models.`,
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

  const renderImpactBars = (impact: "High" | "Medium" | "Low") => {
    const barCount = 4;
    let filledCount = 2;
    let barColor = "bg-amber-500";

    if (impact === "High") {
      filledCount = 4;
      barColor = "bg-violet-600";
    } else if (impact === "Medium") {
      filledCount = 3;
      barColor = "bg-violet-400";
    } else {
      filledCount = 1;
      barColor = "bg-zinc-300";
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
    const d = new Date(selectedTrend.source_published_date);
    if (isNaN(d.getTime())) return "July 2026";
    return d.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric"
    });
  }, [selectedTrend]);

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
          <button 
            onClick={onReturn}
            className="py-1 px-2.5 border border-zinc-200 bg-[#fbfbfb] text-zinc-600 text-[11px] font-normal rounded-[4px] hover:bg-zinc-50 transition-colors"
          >
            Go to monitor
          </button>
        </div>

        {/* Outer Workspace containing the new Market Dynamics overview at the top */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2 bg-[#fafafa]/50">
          
          {/* Market Dynamics Category Cards */}
          <div className="flex flex-col gap-1.5 animate-fade-in select-text">
            
            {/* Card 1: Funding & investment */}
            <div className="bg-white border border-zinc-200/85 rounded-[6px] px-4 py-2 flex items-center gap-4 shadow-[0_1px_2px_rgba(0,0,0,0.015)] transition-colors hover:border-zinc-300">
              <div className="w-[180px] shrink-0 flex items-center gap-2.5 select-none">
                <ArrowUpRight className="w-4 h-4 text-emerald-600 shrink-0" strokeWidth={2.4} />
                <span className="text-[13px] font-semibold text-zinc-900 font-sans leading-none">
                  Funding & investment
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12.5px] text-zinc-600 font-normal font-sans leading-snug">
                  Accelerating: third consecutive week of growth, concentrated in two sectors
                </p>
              </div>
            </div>

            {/* Card 2: Industry structure */}
            <div className="bg-white border border-zinc-200/85 rounded-[6px] px-4 py-2 flex items-center gap-4 shadow-[0_1px_2px_rgba(0,0,0,0.015)] transition-colors hover:border-zinc-300">
              <div className="w-[180px] shrink-0 flex items-center gap-2.5 select-none">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" strokeWidth={2.4} />
                <span className="text-[13px] font-semibold text-zinc-900 font-sans leading-none">
                  Industry structure
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12.5px] text-zinc-600 font-normal font-sans leading-snug">
                  Emerging: early consolidation signals, worth monitoring not yet acting on
                </p>
              </div>
            </div>

            {/* Card 3: Talent movement */}
            <div className="bg-white border border-zinc-200/85 rounded-[6px] px-4 py-2 flex items-center gap-4 shadow-[0_1px_2px_rgba(0,0,0,0.015)] transition-colors hover:border-zinc-300">
              <div className="w-[180px] shrink-0 flex items-center gap-2.5 select-none">
                <ArrowUpRight className="w-4 h-4 text-emerald-600 shrink-0" strokeWidth={2.4} />
                <span className="text-[13px] font-semibold text-zinc-900 font-sans leading-none">
                  Talent movement
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12.5px] text-zinc-600 font-normal font-sans leading-snug">
                  Accelerating: turnover concentrated at two firms, both also flagged under structure
                </p>
              </div>
            </div>

            {/* Card 4: Macro & economic */}
            <div className="bg-white border border-zinc-200/85 rounded-[6px] px-4 py-2 flex items-center gap-4 shadow-[0_1px_2px_rgba(0,0,0,0.015)] transition-colors hover:border-zinc-300">
              <div className="w-[180px] shrink-0 flex items-center gap-2.5 select-none">
                <Minus className="w-4 h-4 text-zinc-400 shrink-0" strokeWidth={2.4} />
                <span className="text-[13px] font-semibold text-zinc-900 font-sans leading-none">
                  Macro & economic
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12.5px] text-zinc-600 font-normal font-sans leading-snug">
                  Stable: no material change, low near-term relevance to client positioning
                </p>
              </div>
            </div>

            {/* Card 5: Tech adoption */}
            <div className="bg-white border border-zinc-200/85 rounded-[6px] px-4 py-2 flex items-center gap-4 shadow-[0_1px_2px_rgba(0,0,0,0.015)] transition-colors hover:border-zinc-300">
              <div className="w-[180px] shrink-0 flex items-center gap-2.5 select-none">
                <ArrowDownRight className="w-4 h-4 text-zinc-400 shrink-0" strokeWidth={2.4} />
                <span className="text-[13px] font-semibold text-zinc-900 font-sans leading-none">
                  Tech adoption
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12.5px] text-zinc-600 font-normal font-sans leading-snug">
                  Cooling: adoption announcements slowed after a strong prior quarter
                </p>
              </div>
            </div>

          </div>

          <div className="border-t border-zinc-200/40 my-1 select-none"></div>

          {/* Remaining Workspace explanation/placeholder or elegant helper, but more compact */}
          <div className="flex-1 flex items-center justify-center py-6 select-none">
            <div className="text-center max-w-sm flex flex-col items-center">
              <Sparkles className="w-6 h-6 text-zinc-300 mb-2" />
              <h3 className="text-xs font-semibold text-zinc-600 font-sans">Market Dynamics Workspace</h3>
              <p className="text-[11px] text-zinc-400 mt-1 leading-normal font-sans">
                The main interactive workspace is inactive. Use the details pane on the right to navigate and explore AI-powered strategic trends.
              </p>
            </div>
          </div>
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

          {/* Clean minimal dropdown selector to switch trends since left pane is empty */}
          <div className="flex items-center gap-1.5 shrink-0 select-none">
            <select
              value={selectedTrendId}
              onChange={(e) => setSelectedTrendId(e.target.value)}
              className="text-[11px] border border-zinc-200 bg-[#fafafa] hover:bg-[#f4f4f5] rounded px-2 py-1 text-zinc-700 outline-none focus:border-zinc-300 cursor-pointer max-w-[140px] truncate font-sans font-medium transition-colors"
            >
              {RADAR_TRENDS.map((trend) => (
                <option key={trend.id} value={trend.id}>
                  {trend.title}
                </option>
              ))}
            </select>
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
              <Bookmark className={`w-3 h-3 ${bookmarkedIds.length > 0 ? "text-violet-600 fill-violet-600" : "text-current opacity-70"}`} />
              <span>Bookmark ({bookmarkedIds.length})</span>
            </button>
          </div>
        </div>

        {/* Dynamic switcher content */}
        {activeTab === "insights" && selectedTrend && (
          <div key={selectedTrend.id} className="flex-1 overflow-y-auto p-6 md:p-8 flex flex-col gap-5 animate-fade-in bg-[#fafafa]/30 select-text">
            
            {/* Category, Actions and Title */}
            <div className="flex flex-col gap-2">
              <h1 className="text-xl sm:text-[22px] font-semibold leading-tight tracking-tight text-[#111827] font-sans">
                {selectedTrend.title}
                
                <span className="relative group inline-flex items-center select-none cursor-pointer ml-2">
                  <span className="flex items-center justify-center h-4 w-6 select-none">
                    <svg className="w-5.5 h-2" viewBox="0 0 40 20">
                      <path 
                        d={selectedTrend.sparklinePath} 
                        fill="none" 
                        stroke={getConfidenceColor(selectedTrend.confidence)} 
                        strokeWidth="3.6" 
                        strokeLinecap="round" 
                      />
                    </svg>
                  </span>

                  <span className="absolute top-full left-0 mt-1.5 hidden group-hover:flex flex-col gap-0.5 bg-white border border-[#031d24] rounded-[5px] py-1 px-2.5 shadow-lg z-50 min-w-[185px]">
                    <span className="font-bold text-zinc-900 text-[11px] font-sans leading-none whitespace-nowrap">
                      {selectedTrend.confidence} Confidence
                    </span>
                    <span className="flex items-center gap-1.5 text-[9.5px] text-zinc-500 font-sans leading-none mt-1 whitespace-nowrap">
                      <span className="text-zinc-900 font-semibold">
                        {selectedTrend.signalsCount} signals
                      </span>
                      <span className="flex items-center shrink-0">
                        <svg className="w-8 h-3" viewBox="0 0 40 20">
                          <path 
                            d={selectedTrend.sparklinePath} 
                            fill="none" 
                            stroke={getConfidenceColor(selectedTrend.confidence)} 
                            strokeWidth="3.2" 
                            strokeLinecap="round" 
                          />
                        </svg>
                      </span>
                      <span className="text-zinc-500">
                        +{Math.max(1, Math.floor(selectedTrend.signalsCount / 8)) || 2} in last week
                      </span>
                    </span>
                  </span>
                </span>
              </h1>

              <div className="flex items-center justify-end gap-4 mt-1 select-text">
                <div className="flex items-center gap-1.5 shrink-0 select-none">
                  <button
                    onClick={() => toggleBookmark(selectedTrend.id)}
                    className={`w-[22px] h-[22px] border rounded-[3px] flex items-center justify-center transition-colors duration-150 ${
                      isCurrentTrendBookmarked
                        ? "bg-amber-50/60 border-amber-200/80 text-amber-500 hover:bg-amber-100/35"
                        : "bg-[#fafafa] border-zinc-200 text-zinc-400 hover:text-zinc-650 hover:bg-zinc-100/50"
                    }`}
                    title={isCurrentTrendBookmarked ? "Remove Bookmark" : "Bookmark"}
                  >
                    <Bookmark className={`w-3 h-3 ${isCurrentTrendBookmarked ? "text-amber-500 fill-amber-500" : ""}`} />
                  </button>

                  <button
                    onClick={() => alert(`Exported strategic brief for ${selectedTrend.title} to PDF draft.`)}
                    className="w-[22px] h-[22px] bg-[#fafafa] border border-zinc-200 text-zinc-400 hover:text-zinc-650 hover:bg-zinc-100/50 rounded-[3px] flex items-center justify-center transition-colors"
                    title="Export"
                  >
                    <Share2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>

            {/* Meta values and Impact bar row inside a thin border box */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border border-zinc-200 rounded-[6px] p-4 bg-zinc-50/30 select-text">
              <div className="flex flex-col gap-1 text-[12.5px] text-zinc-600 font-sans">
                <div>
                  <span className="font-semibold text-zinc-800">Last Updated Date:</span>{" "}
                  <span className="text-zinc-600">{formattedPublishDate}</span>
                </div>
                <div>
                  <span className="font-semibold text-zinc-800">Category:</span>{" "}
                  <span className="text-zinc-600">{selectedTrend.sector}</span>
                </div>
                <div>
                  <span className="font-semibold text-zinc-800">Impact Horizon:</span>{" "}
                  <span className="text-zinc-600">{formatTerm(selectedTrend.term)}</span>
                </div>
              </div>

              <div className="flex flex-col items-end gap-1.5 min-w-[100px] select-none">
                <span className="text-[10px] font-bold tracking-widest text-zinc-400 font-sans">IMPACT</span>
                {renderImpactBars(selectedTrend.impact_level)}
                <span className="text-[12.5px] font-bold text-zinc-700 tracking-tight font-sans">
                  {selectedTrend.impact_level} Impact
                </span>
              </div>
            </div>

            {/* Document Narrative */}
            <div className="flex flex-col gap-4 text-[13px] leading-relaxed text-zinc-600 font-sans select-text">
              <p>{selectedTrend.summary}</p>
              
              <div className="flex items-center gap-1.5 select-none text-[11px] text-zinc-400 mt-1">
                <span className="font-normal text-zinc-400">Reference:</span>
                <span className="inline-flex items-center justify-center w-[18px] h-[18px] bg-zinc-100 border border-zinc-200 rounded text-[10.5px] font-bold text-zinc-500 cursor-help select-none" title="MarketGenie Horizon Analysis">
                  1
                </span>
              </div>
            </div>

            {/* Business Impact bullet segment */}
            <div className="flex flex-col gap-2 mt-2">
              <h3 className="text-[13px] font-bold tracking-tight text-zinc-900 font-sans uppercase">
                Business Impact
              </h3>
              <div className="bg-[#f5f3ff]/60 border border-violet-100 p-4 rounded-[4px] flex flex-col gap-3">
                {selectedTrend.business_impact.map((bullet, idx) => (
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
                  Signals ({selectedTrend.sources.length})
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
                  {selectedTrend.sources.map(src => {
                    const isSelected = selectedSignalId === src.id;
                    const cat = (src.category || "").toLowerCase();
                    
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
                        onClick={() => setSelectedSignalId(isSelected ? null : src.id)}
                        className={`rounded-[4px] px-3 transition-all text-left cursor-pointer border ${bgClass} ${borderClass} ${isSelected ? 'py-4' : 'py-1.5'}`}
                      >
                        {!isSelected ? (
                          <div className="flex items-center justify-between gap-3 overflow-hidden font-sans">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <span className={`shrink-0 rounded-[3px] py-0.5 px-1.5 text-[8.5px] font-semibold tracking-tight border leading-none ${getCategoryTagClass(src.category)}`}>
                                {src.category}
                              </span>
                              <h4 className="font-medium text-zinc-900 text-[12px] truncate">
                                {src.source_name}
                              </h4>
                            </div>
                            <span className="shrink-0 text-zinc-500 font-medium text-[9px] bg-zinc-100/50 rounded-[3px] px-1.5 py-0.5 leading-none select-none">
                              {src.date}
                            </span>
                          </div>
                        ) : (
                          <div className="animate-fade-in flex flex-col gap-3 font-sans">
                            <div className="flex items-center justify-between">
                              <span className={`rounded-[3px] py-0.5 px-2 text-[9px] font-semibold tracking-tight inline-block border leading-none ${getCategoryTagClass(src.category)}`}>
                                {src.category}
                              </span>
                              <span className="text-zinc-500 font-medium text-[9px] bg-[#e8e6df]/50 rounded-[3px] px-1.5 py-0.5 leading-none select-none">
                                {src.date}
                              </span>
                            </div>

                            <div className="flex flex-col gap-0.5">
                              <h4 className="font-bold text-zinc-900 text-[14px] leading-tight tracking-tight">
                                {src.source_name}
                              </h4>
                              {src.category === "Patent" && (
                                <span className="text-zinc-500 text-[10.5px] font-normal">
                                  Undisclosed fintech infra co
                                </span>
                              )}
                            </div>
                            
                            <p className="text-zinc-800 text-[11px] leading-[1.5] font-normal">
                              {src.category === "Patent" ? (
                                <><span className="font-bold text-zinc-900">Patent US1085A: </span>{src.details}</>
                              ) : (
                                src.details
                              )}
                            </p>

                            <div className="flex flex-col bg-white border border-zinc-100 rounded-[4px] px-3 mt-1 shadow-[0_1px_2px_rgba(0,0,0,0.02)] text-[10.5px]">
                              <div className="flex items-center justify-between py-1 border-b border-zinc-50">
                                <span className="text-zinc-600">Published date</span>
                                <span className="text-zinc-900 font-medium">{src.date} 2026</span>
                              </div>
                              <div className="flex items-center justify-between py-1 border-b border-zinc-50">
                                <span className="text-zinc-600">Organisation</span>
                                <span className="text-zinc-900 font-medium">
                                  {src.category === "Patent" ? "Undisclosed fintech infra co" : "Industry Intelligence"}
                                </span>
                              </div>
                              <div className="flex items-center justify-between py-1">
                                <span className="text-zinc-600">Source</span>
                                <a href="#" className="text-[#3b82f6] font-medium hover:underline flex items-center gap-1">
                                  {src.category === "Patent" ? "USPTO filing" : "Market Report"}
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

            {/* Similar Future Prospects section */}
            <div className="flex flex-col gap-2 mt-4 select-text">
              <h3 className="text-[13.5px] font-bold tracking-tight text-zinc-900 font-sans select-text">
                Similar Future Prospects
              </h3>
              <div className="flex flex-col gap-2 ml-1">
                {isFetchingSimilar ? (
                  <div className="text-[12px] text-zinc-500 animate-pulse py-1 font-sans">
                    Fetching similar prospects...
                  </div>
                ) : similarFutureProspects.length > 0 ? (
                  similarFutureProspects.map((prospect, idx) => (
                    <div className="flex items-start gap-2 py-0.5 text-[12px]" key={idx}>
                      <FileText className="w-3.5 h-3.5 text-zinc-400 mt-[2px] shrink-0 select-none" />
                      <button
                        onClick={() => setSelectedTrendId(prospect.id)}
                        className="text-left text-zinc-700 hover:text-[#7c3aed] transition-colors leading-normal hover:underline select-text font-normal cursor-pointer font-sans"
                      >
                        {prospect.title}
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="text-[12px] text-zinc-400 py-1 font-sans">
                    No similar prospects found
                  </div>
                )}
              </div>
            </div>

            {/* Action buttons matching design layout */}
            <div className="flex flex-col gap-2 w-full mt-3 select-none font-sans font-normal text-[13px]">
              <button
                onClick={() => {
                  const query = `What is the regulatory and market feasibility of ${selectedTrend.title}?`;
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
                  const query = `Provide case studies of ${selectedTrend.title} implementations.`;
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

        {activeTab === "ask_marketgenie" && (
          <div className="flex-1 overflow-y-auto p-6 md:p-8 flex flex-col h-full animate-fade-in text-left">
            {/* Message Feed */}
            <div className="flex-1 flex flex-col gap-3 pr-1 pb-4">
              {chatHistory.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-4">
                  <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mb-3">
                    <Sparkles className="w-8 h-8 text-zinc-400" />
                  </div>
                  <p className="text-sm text-zinc-500 font-medium font-sans">Ask MarketGenie About {selectedTrend.title}</p>
                  <p className="text-xs text-zinc-400 mt-1 font-sans">Query potential compliance, integration, and strategy timelines.</p>
                </div>
              ) : (
                chatHistory.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col max-w-[85%] rounded-[8px] p-3 text-[12.5px] leading-relaxed font-sans ${
                      msg.role === "user"
                        ? "bg-zinc-100 text-zinc-800 self-end rounded-br-none"
                        : "bg-violet-50 text-zinc-800 border border-violet-100 self-start rounded-bl-none"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                  </div>
                ))
              )}
              {chatLoading && (
                <div className="bg-violet-50 text-zinc-800 border border-violet-100 self-start rounded-[8px] rounded-bl-none p-3 max-w-[85%] flex items-center gap-2">
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
                  `Timeline for ${selectedTrend.title}`,
                  `Regional risks of ${selectedTrend.title}`,
                  `Competitors using ${selectedTrend.title}`
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
                placeholder={`Ask MarketGenie about ${selectedTrend.title}...`}
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
              
            {bookmarkedIds.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center font-sans">
                <Bookmark className="w-8 h-8 text-zinc-200 mb-2" />
                <p className="text-xs text-zinc-400 font-medium">No bookmarked outlook items yet.</p>
                <p className="text-[11px] text-zinc-300 mt-0.5 max-w-[200px] leading-normal">
                  Click the bookmark icon in the Insights panel to save crucial market trends.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-2 font-sans">
                {bookmarkedIds.map(bId => {
                  const trend = RADAR_TRENDS.find(t => t.id === bId);
                  if (!trend) return null;
                  return (
                    <div
                      key={trend.id}
                      onClick={() => {
                        setSelectedTrendId(trend.id);
                        setActiveTab("insights");
                      }}
                      className={`p-3 border rounded-[4px] cursor-pointer transition-all ${
                        selectedTrendId === trend.id
                          ? "bg-amber-50/40 border-[#3b82f6] ring-2 ring-[#3b82f6]/15 shadow-md"
                          : "bg-white border-zinc-200 hover:border-zinc-300 hover:shadow-sm"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-400">
                          {trend.sector} • {trend.term}
                        </span>
                        <span className="text-[10px] text-zinc-500 font-medium">
                          {trend.impact_level} Impact
                        </span>
                      </div>
                      <h3 className="text-xs font-bold text-zinc-800">{trend.title}</h3>
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

    </div>
  );
}
