import React, { useState, useMemo, useEffect } from "react";
import { 
  Calendar, 
  Check, Share2, Info, MoreHorizontal, FileText, Search,
  ShieldAlert, BookOpen, Scale, AlertTriangle, Cpu, Layers, Pencil,
  Sparkles, Bookmark, CornerDownLeft, Trash2, ArrowUpRight, Square
} from "lucide-react";
import { AlertItem, ChatMessage } from "../types";
import { ChatSources } from "./ChatSources";
import { POLICY_RISK_MODULE_ID, API_URL } from "../constants";
import { supabase } from "../lib/supabase";

interface IntelligencePaneProps {
  clientId: string;
  industry: string;
  userId: string;
  selectedAlert: AlertItem | null;
  onSelectAlert: (alert: AlertItem) => void;
}

export default function IntelligencePane({ 
  clientId,
  industry,
  userId,
  selectedAlert, 
  onSelectAlert
}: IntelligencePaneProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [isBookmarked, setIsBookmarked] = useState<Record<string, boolean>>({});
  const [bookmarkedAlerts, setBookmarkedAlerts] = useState<AlertItem[]>([]);
  const [hiddenIds, setHiddenIds] = useState<Record<string, boolean>>({});
  const [lastHiddenAlert, setLastHiddenAlert] = useState<AlertItem | null>(null);
  const [dailyHighlight, setDailyHighlight] = useState<string | null>(null);
  const [externalSimilarArticles, setExternalSimilarArticles] = useState<{ title: string; url: string; signal_id?: string }[]>([]);
  const [isFetchingSimilar, setIsFetchingSimilar] = useState(false);

  const fetchBookmarks = async () => {
    if (!clientId || !userId) return;
    try {
      const { data, error } = await supabase
        .from("bookmarks")
        .select("policy_signal_id")
        .eq("client_id", clientId)
        .eq("user_id", userId);

      if (error) throw error;
      
      const ids: Record<string, boolean> = {};
      data.forEach(b => {
        ids[b.policy_signal_id] = true;
      });
      setIsBookmarked(ids);

      // Fetch bookmarked data join
      const { data: joinedData, error: joinError } = await supabase
        .from("bookmarks")
        .select(`
          created_at,
          policy_signals!inner (*)
        `)
        .eq("client_id", clientId)
        .eq("user_id", userId)
        .eq("policy_signals.module_id", "777a2b2e-8bb2-44ef-a4f2-1c0c1e03b960")
        .order("created_at", { ascending: false });

      if (joinError) throw joinError;

      const alerts = (joinedData as any[]).map(item => {
        const d = item.policy_signals;
        return {
          ...d,
          bookmark_created_at: item.created_at,
          business_impact: typeof d.business_impact === 'string' 
            ? JSON.parse(d.business_impact) 
            : (d.business_impact || [])
        };
      }) as AlertItem[];
      setBookmarkedAlerts(alerts);
    } catch (err) {
      console.error("Error fetching bookmarks:", err);
    }
  };

  const fetchHiddenArticles = async () => {
    if (!clientId || !userId) return;
    try {
      const { data, error } = await supabase
        .from("hidden_articles")
        .select("policy_signal_id")
        .eq("client_id", clientId)
        .eq("user_id", userId);

      if (error) throw error;

      const ids: Record<string, boolean> = {};
      data.forEach(h => {
        ids[h.policy_signal_id] = true;
      });
      setHiddenIds(ids);
    } catch (err) {
      console.error("Error fetching hidden articles:", err);
    }
  };

  const fetchDailyHighlight = async () => {
    if (!clientId) return;
    try {
      const { data, error } = await supabase
        .from("daily_highlights")
        .select("*")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false })
        .limit(1);

      if (error) {
        throw error;
      } else if (data && data.length > 0) {
        const text = data[0].highlight_text || data[0].highlight || null;
        setDailyHighlight(text);
      } else {
        setDailyHighlight(null);
      }
    } catch (err) {
      console.error("Error fetching daily highlight:", err);
      setDailyHighlight(null);
    }
  };

  const fetchSimilarArticles = async (signalId: string) => {
    if (!signalId) {
      setExternalSimilarArticles([]);
      return;
    }
    setIsFetchingSimilar(true);
    try {
      const url = `${API_URL}/similar/${encodeURIComponent(signalId)}`;
      console.log(`Calling /similar URL: ${url}`);
      console.log(`Calling /similar Signal ID: ${signalId}`);
      const response = await fetch(url);
      
      if (response.status === 404) {
        const current = alerts.find(a => a.id === signalId);
        if (current) {
          const localSimilar = alerts
            .filter(a => a.id !== signalId && (a.category === current.category || a.industry === current.industry))
            .slice(0, 3)
            .map(a => ({
              title: a.signal_title,
              url: a.source_article_url,
              signal_id: a.id
            }));
          setExternalSimilarArticles(localSimilar);
        } else {
          setExternalSimilarArticles([]);
        }
        return;
      }

      if (!response.ok) {
        console.warn(`Fetch similar articles failed for ID: ${signalId}. Status: ${response.status} ${response.statusText}`);
        throw new Error(`API response not ok (${response.status})`);
      }
      
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        console.warn(`Invalid content type: ${contentType} for ID: ${signalId}`);
        throw new Error("Response not JSON");
      }

      const data = await response.json();
      if (data && data.similar) {
        setExternalSimilarArticles(data.similar);
      } else {
        const current = alerts.find(a => a.id === signalId);
        if (current) {
          const localSimilar = alerts
            .filter(a => a.id !== signalId && (a.category === current.category || a.industry === current.industry))
            .slice(0, 3)
            .map(a => ({
              title: a.signal_title,
              url: a.source_article_url,
              signal_id: a.id
            }));
          setExternalSimilarArticles(localSimilar);
        } else {
          setExternalSimilarArticles([]);
        }
      }
    } catch (error) {
      console.warn("Soft handling: Error fetching similar articles, falling back to local matches:", error);
      const current = alerts.find(a => a.id === signalId);
      if (current) {
        const localSimilar = alerts
          .filter(a => a.id !== signalId && (a.category === current.category || a.industry === current.industry))
          .slice(0, 3)
          .map(a => ({
            title: a.signal_title,
            url: a.source_article_url,
            signal_id: a.id
          }));
        setExternalSimilarArticles(localSimilar);
      } else {
        setExternalSimilarArticles([]);
      }
    } finally {
      setIsFetchingSimilar(false);
    }
  };

  useEffect(() => {
    if (selectedAlert?.id) {
      fetchSimilarArticles(selectedAlert.id);
    } else {
      setExternalSimilarArticles([]);
    }
  }, [selectedAlert?.id]);

  useEffect(() => {
    fetchBookmarks();
    fetchDailyHighlight();
    fetchHiddenArticles();
  }, [clientId, userId]);

  useEffect(() => {
    async function loadData() {
      if (!clientId) return;
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from("policy_signals")
          .select("*")
          .eq("client_id", clientId)
          .eq("module_id", "777a2b2e-8bb2-44ef-a4f2-1c0c1e03b960")
          .order("source_published_date", { ascending: false });

        if (error) {
           setErrorMsg("Unable to load policy signals");
           throw error;
        }

        if (data && data.length > 0) {
          const parsedData = data.map(d => ({
            ...d,
            business_impact: typeof d.business_impact === 'string' 
              ? JSON.parse(d.business_impact) 
              : (d.business_impact || [])
          })) as AlertItem[];
          
          setAlerts(parsedData);
        } else {
          setAlerts([]);
        }
      } catch (err) {
        console.error(err);
        setErrorMsg("Unable to load policy signals");
      } finally {
         setIsLoading(false);
      }
    }
    loadData();
  }, [clientId]);

  const dashboardAlerts = useMemo(() => {
    return alerts.filter(a => !hiddenIds[a.id]);
  }, [alerts, hiddenIds]);

  useEffect(() => {
    if (dashboardAlerts.length > 0) {
      if (!selectedAlert || !dashboardAlerts.some(a => a.id === selectedAlert.id)) {
        onSelectAlert(dashboardAlerts[0]);
      }
    }
  }, [dashboardAlerts]);
  const [isMarkedRead, setIsMarkedRead] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState<"insights" | "ask_marketgenie" | "bookmarks">("insights");

  // Left Pane Chat States
  const [leftChatHistory, setLeftChatHistory] = useState<{ 
    id: string; 
    role: string; 
    text: string; 
    detailedText?: string;
    timestamp: Date;
    matchedAlerts?: AlertItem[];
  }[]>([]);
  const [leftChatInput, setLeftChatInput] = useState("");
  const [leftChatLoading, setLeftChatLoading] = useState(false);
  const [isChatExpanded, setIsChatExpanded] = useState(false);
  const [isChatFocused, setIsChatFocused] = useState(false);

  const chatScrollRef = React.useRef<HTMLDivElement>(null);
  const detailsViewportRef = React.useRef<HTMLDivElement>(null);
  const abortControllerRef = React.useRef<AbortController | null>(null);

  const formatDateHuman = (dateStr: string): string => {
    if (!dateStr) return "N/A";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return "N/A";
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      }).format(d);
    } catch (e) {
      return "N/A";
    }
  };

  React.useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [leftChatHistory, isChatExpanded]);

  React.useEffect(() => {
    if (detailsViewportRef.current) {
      detailsViewportRef.current.scrollTop = 0;
    }
  }, [selectedAlert]);

  const bookmarkedCount = bookmarkedAlerts.length;

  const dateDetected = selectedAlert?.source_published_date ? formatDateHuman(selectedAlert.source_published_date) : "";

  const sourceType = selectedAlert?.source_type || selectedAlert?.source || "Regulatory Consultation";

  const country = selectedAlert?.country || "";

  const businessImpactList = selectedAlert?.business_impact || [];

  const [startDateStr, setStartDateStr] = useState("");
  const [endDateStr, setEndDateStr] = useState("");
  const [defaultStartDate, setDefaultStartDate] = useState("");
  const [defaultEndDate, setDefaultEndDate] = useState("");
  const [isEditingDates, setIsEditingDates] = useState(false);

  useEffect(() => {
    if (dashboardAlerts.length > 0) {
      const dates = dashboardAlerts.map(a => new Date(a.source_published_date).getTime()).filter(t => !isNaN(t));
      if (dates.length > 0) {
        const minDate = new Date(Math.min(...dates));
        const maxDate = new Date(Math.max(...dates));
        
        const formatDate = (d: Date) => {
          const year = d.getFullYear();
          const month = String(d.getMonth() + 1).padStart(2, "0");
          const day = String(d.getDate()).padStart(2, "0");
          return `${year}-${month}-${day}`;
        };
        
        const minStr = formatDate(minDate);
        const maxStr = formatDate(maxDate);
        
        setStartDateStr(minStr);
        setEndDateStr(maxStr);
        setDefaultStartDate(minStr);
        setDefaultEndDate(maxStr);
      }
    }
  }, [dashboardAlerts]);

  const todayStr = useMemo(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }, []);

  const formattedDateRange = useMemo(() => {
    const formatDate = (dateStr: string) => {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      
      // Prevent timezone shifting
      const utcDate = new Date(d.getTime() + d.getTimezoneOffset() * 60000);
      return utcDate.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    };
    return `${formatDate(startDateStr)} – ${formatDate(endDateStr)}`;
  }, [startDateStr, endDateStr]);

  // Filter alerts based on search and selected timeline day
  const filteredAlerts = useMemo(() => {
    return dashboardAlerts.filter((alert) => {
      const matchSearch = 
        alert.signal_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        alert.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (alert.summary && alert.summary.toLowerCase().includes(searchQuery.toLowerCase()));
      
      let matchDate = true;
      if (startDateStr && endDateStr && alert.source_published_date) {
        const pubDateStr = alert.source_published_date.split('T')[0];
        matchDate = pubDateStr >= startDateStr && pubDateStr <= endDateStr;
      }
      
      return matchSearch && matchDate;
    });
  }, [searchQuery, dashboardAlerts, startDateStr, endDateStr]);

  // Helper to format date with UPPERCASE month: '18 JULY 2026' and ordinal suffix
  const formatAlertGroupDate = (alert: AlertItem): string => {
    if (!alert.source_published_date) return "Unknown Date";
    const d = new Date(alert.source_published_date);
    
    // Prevent timezone shifting
    const utcDate = new Date(d.getTime() + d.getTimezoneOffset() * 60000);
    const dayNum = utcDate.getDate();
    const month = utcDate.toLocaleDateString("en-US", { month: "long" }).toUpperCase();
    const year = utcDate.getFullYear();
    
    const getOrdinalSuffix = (day: number) => {
      if (day > 3 && day < 21) return "TH";
      switch (day % 10) {
        case 1: return "ST";
        case 2: return "ND";
        case 3: return "RD";
        default: return "TH";
      }
    };
    
    return `${dayNum}${getOrdinalSuffix(dayNum)} ${month} ${year}`;
  };

  const { groupedAlerts, orderedGroupDates } = useMemo(() => {
    const groups: Record<string, AlertItem[]> = {};
    const dates: string[] = [];

    // Filtered already sorted since API returns order('source_published_date', { ascending: false })
    filteredAlerts.forEach((alert) => {
      const dateKey = formatAlertGroupDate(alert);
      if (!groups[dateKey]) {
        groups[dateKey] = [];
        dates.push(dateKey);
      }
      groups[dateKey].push(alert);
    });

    return { groupedAlerts: groups, orderedGroupDates: dates };
  }, [filteredAlerts]);

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
      case "green": return "bg-green-50 border border-green-200 text-green-800";
      case "gray": return "bg-gray-50 border border-gray-200 text-gray-800";
      default:
        return "bg-zinc-100 border border-zinc-200 text-zinc-650";
    }
  };

  const getAlertImpactScore = (alert: AlertItem): number => {
    const impact = (alert.impact_level || "").toLowerCase();
    if (impact === "critical") return 4;
    if (impact === "high") return 3;
    if (impact === "medium") return 2;
    if (impact === "low") return 1;
    return 2;
  };

  const getImpactLabel = (alert: AlertItem): string => {
    return alert.impact_level || "Medium";
  };

  const resolveTagColor = (alert: AlertItem) => {
    const score = getAlertImpactScore(alert);
    if (score >= 4) return "rose";
    if (score === 3) return "amber";
    return "blue";
  };

  const getCategoryTagColor = (category: string) => {
    switch ((category || "").trim()) {
      case "Compliance Requirement": return "purple";
      case "Licensing Change": return "green";
      case "AML & KYC Compliance": return "indigo";
      case "Sanctions & Embargo": return "rose";
      case "Capital Requirements": return "blue";
      case "Payments System": return "cyan";
      case "Regulatory Risk": return "rose";
      case "Regulatory Consultation": return "emerald";
      case "Regulatory Enforcement": return "indigo";
      case "Stablecoin & Crypto Regulation": return "purple";
      case "Consumer Financial Protection": return "teal";
      case "Federal Taxation": return "amber";
      case "Trade & Tariffs": return "yellow";
      case "Cross-Border Regulation": return "blue";
      case "Corporate & Business Laws": return "slate";
      case "Data Privacy & Protection": return "cyan";
      case "Litigation & Legal Risk": return "red";
      case "Cyber & Tech Risk": return "fuchsia";
      case "Infrastructure Reform": return "lime";
      case "Healthcare Regulation": return "emerald";
      case "Life Insurance": return "green";
      case "Environmental & Climate Regulation": return "green";
      case "Labor & Employment Law": return "blue";
      case "Government Policy Announcement": return "indigo";
      case "Executive Order": return "violet";
      case "Legislative Development": return "blue";
      case "Central Bank Directive": return "purple";
      case "Other Regulatory Risk": return "gray";
      case "Regulatory Change": return "orange"
      default: return "blue";
    }
  };

  const getUnifiedImpactBarClass = (alert: AlertItem, barIndex: number): string => {
    const score = getAlertImpactScore(alert);
    
    if (score === 0) {
      return "bg-zinc-100 border border-zinc-200";
    }

    const isFilled = barIndex < score;

    if (isFilled) {
      if (score === 4) {
        return "bg-rose-500 border border-rose-500";
      }
      if (score === 3) {
        return "bg-orange-500 border border-orange-500";
      }
      if (score === 2) {
        return "bg-amber-400 border border-amber-400";
      }
      if (score === 1) {
        return "bg-emerald-400 border border-emerald-400";
      }
    }

    return "bg-zinc-100 border border-zinc-200";
  };

  const toggleMarkRead = (id: string) => {
    setIsMarkedRead(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const getAlertIcon = (id: string, category: string) => {
    const cls = "w-[15px] h-[15px] flex-shrink-0";
    const cat = category.toLowerCase();
    const lowId = id.toLowerCase();
    
    if (cat.includes("prudential") || cat.includes("resolution") || lowId.includes("cps-190") || lowId.includes("cps-900")) 
      return <ShieldAlert className={`${cls} text-rose-500`} />;
    if (cat.includes("cyber") || cat.includes("tech") || lowId.includes("cyber")) 
      return <Cpu className={`${cls} text-amber-500`} />;
    if (cat.includes("tax") || lowId.includes("ato-tax")) 
      return <Scale className={`${cls} text-amber-500`} />;
    if (cat.includes("market") || cat.includes("infrastructure") || lowId.includes("financial")) 
      return <Layers className={`${cls} text-amber-500`} />;
    if (cat.includes("payment") || lowId.includes("payment")) 
      return <FileText className={`${cls} text-amber-500`} />;
    if (cat.includes("superannuation") || cat.includes("governance") || lowId.includes("sps")) 
      return <BookOpen className={`${cls} text-rose-500`} />;
      
    return <FileText className={`${cls} text-blue-500`} />;
  };

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const triggerToast = (msg: string, isHideAction = false) => {
    if (!isHideAction) setLastHiddenAlert(null);
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => {
        if (prev === msg) {
          setLastHiddenAlert(null);
          return null;
        }
        return prev;
      });
    }, 3000);
  };

  const [chatSuggestions, setChatSuggestions] = useState<string[]>([]);

  useEffect(() => {
    async function loadSuggestions() {
      const defaultSuggestions = [
        "What are the latest regulatory changes?",
        "Which regulations require immediate action?",
        "What compliance deadlines are approaching?"
      ];

      if (!clientId) {
        setChatSuggestions(defaultSuggestions);
        return;
      }
      try {
        const { data, error } = await supabase
          .from("policy_signals")
          .select("signal_title, category, summary")
          .eq("client_id", clientId)
          .eq("module_id", "777a2b2e-8bb2-44ef-a4f2-1c0c1e03b960")
          .order("date_detected", { ascending: false })
          .limit(10);

        if (error) throw error;

        if (data && data.length > 0) {
          const suggestions = data.map((signal) => {
            const cat = (signal.category || "").toLowerCase();
            const title = signal.signal_title || "this regulation";
            if (cat.includes("enforcement")) return `What are the compliance requirements following ${title}?`;
            if (cat.includes("taxation") || cat.includes("tariff")) return `How does ${title} impact business costs?`;
            if (cat.includes("licensing") || cat.includes("licensing change")) return `What steps are needed to comply with ${title}?`;
            if (cat.includes("aml") || cat.includes("kyc")) return `What AML obligations arise from ${title}?`;
            if (cat.includes("sanctions")) return `What sanctions risks does ${title} create?`;
            if (cat.includes("data privacy")) return `What data protection actions are required under ${title}?`;
            return `What is the business impact of ${title}?`;
          });
          setChatSuggestions(Array.from(new Set(suggestions)));
        } else {
          setChatSuggestions(defaultSuggestions);
        }
      } catch (err) {
        console.error("Error fetching chat suggestions:", err);
        setChatSuggestions(defaultSuggestions);
      }
    }
    loadSuggestions();
  }, [clientId]);

  const handleLeftChatSend = async (text: string) => {
    if (!text.trim() || leftChatLoading) return;

    abortControllerRef.current = new AbortController();

    const userMessage: ChatMessage = {
      id: typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : Math.random().toString(36).substring(2),
      role: "user",
      text: text,
      timestamp: new Date()
    };

    setLeftChatHistory(prev => [...prev, userMessage]);
    setLeftChatInput("");
    setLeftChatLoading(true);

    try {
      console.log(`Sending /ask - Client ID: ${clientId}`);
      console.log(`Sending /ask - Industry: ${industry}`);

      const response = await fetch(`${API_URL}/ask`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: text,
          clientId: clientId,
          industry: industry,
          moduleId: POLICY_RISK_MODULE_ID
        }),
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) throw new Error("API request failed");
      
      const data = await response.json();
      
      const assistantMessage: ChatMessage = {
        id: typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : Math.random().toString(36).substring(2),
        role: "model",
        text: data.answer || "I couldn't find an answer to that question.",
        sources: data.sources || [],
        timestamp: new Date()
      };

      setLeftChatHistory(prev => [...prev, assistantMessage]);
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log('Request was aborted');
        return;
      }
      console.error(err);
      const errorMessage: ChatMessage = {
        id: typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : Math.random().toString(36).substring(2),
        role: "model",
        text: "Sorry, I encountered an error while processing your request. Please try again later.",
        timestamp: new Date()
      };
      setLeftChatHistory(prev => [...prev, errorMessage]);
    } finally {
      setLeftChatLoading(false);
    }
  };

  const handleLeftKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (leftChatLoading) {
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
          setLeftChatLoading(false);
        }
      } else if (leftChatInput.trim()) {
        handleLeftChatSend(leftChatInput);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      if (leftChatLoading) {
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
          setLeftChatLoading(false);
        }
      }
      setLeftChatInput("");
      setIsChatExpanded(false);
      (e.currentTarget as HTMLElement).blur();
    }
  };

  return (
    <div id="intelligence-dashboard" className="flex-1 h-full flex bg-white divide-x divide-zinc-200 overflow-hidden">
      
      {/* LEFT COLUMN: Roadmap and policy feed (60% width) */}
      <div id="roadmap-column" className="w-[60%] h-full flex flex-col bg-white flex-shrink-0 animate-fade-in">
        
        {/* Header section */}
        <div id="roadmap-header" className="h-[53px] px-4 border-b border-zinc-100 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-4">
            <h2 id="roadmap-heading-title" className="text-[19px] font-semibold tracking-tight text-zinc-900 select-none">
              Policy & Risk Monitor
            </h2>
          </div>
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
                className="text-[11px] border border-zinc-200 bg-[#fbfbfb] rounded px-1.5 py-0.5 text-zinc-700 outline-none focus:border-zinc-300"
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
                className="text-[11px] border border-zinc-200 bg-[#fbfbfb] rounded px-1.5 py-0.5 text-zinc-700 outline-none focus:border-zinc-300"
              />
              <button 
                onClick={() => {
                  if (!startDateStr) setStartDateStr(defaultStartDate);
                  if (!endDateStr) setEndDateStr(defaultEndDate);
                  setIsEditingDates(false);
                }}
                className="p-1 bg-[#18181b] hover:bg-black text-white rounded transition-colors"
                title="Confirm changes"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div 
              onClick={() => setIsEditingDates(true)}
              className="flex items-center gap-1.5 cursor-pointer hover:bg-zinc-100 px-2 py-1 rounded transition-colors"
              title="Click to edit date range"
            >
              <span className="text-xs text-zinc-500 font-medium select-none">
                {formattedDateRange}
              </span>
              <Pencil className="w-3 h-3 text-zinc-400 select-none" />
            </div>
          )}
        </div>

        {/* Alerts list workspace */}
        <div id="alerts-scrollbar-area" className="flex-1 overflow-y-auto p-4 flex flex-col gap-5 bg-white">
          {isLoading ? (
            <div className="flex-1 flex items-center justify-center text-sm text-zinc-400">
               <div className="w-5 h-5 border-2 border-[#7c3aed] border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : errorMsg ? (
            <div className="flex-1 flex items-center justify-center text-sm text-rose-500 font-medium tracking-tight">
              {errorMsg}
            </div>
          ) : (
            <>
              {dashboardAlerts.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-sm text-zinc-500 font-medium tracking-tight">
                  No data available
                </div>
              ) : filteredAlerts.length === 0 ? (
                <div className="p-8 text-center text-zinc-400 text-xs">
                  No matching alerts for your filter parameters.
                </div>
              ) : (
                orderedGroupDates.map((dateGroup, gIdx) => {
                  const alertsInGroup = groupedAlerts[dateGroup] || [];
                  const is11thJuly = dateGroup.toUpperCase().includes("11TH JULY 2026") || dateGroup.toUpperCase().includes("11 JULY 2026");
                  
                  return (
                    <div key={dateGroup} className="flex flex-col gap-2">
                      {/* Short Synopsis for 11th July 2026 (rendered ABOVE the date header) */}
                      {is11thJuly && (
                        <div className="mb-5 p-5 border border-zinc-200 bg-white rounded-[8px] flex flex-col gap-3 shadow-[0_1px_3px_rgba(0,0,0,0.01)] animate-fade-in pr-3">
                          <div>
                            <h4 className="text-[15px] font-medium tracking-tight text-zinc-800 font-sans">
                              What changed vs previous period
                            </h4>
                            <p className="text-[12.5px] text-zinc-500 leading-normal font-sans font-normal mt-0.5">
                              Comparing this week to last week — this is what you'd put in a client update, everything else is context.
                            </p>
                          </div>

                          <div className="flex flex-col divide-y divide-zinc-100">
                            {/* Row 1: Trade & tariffs */}
                            <div className="flex items-center justify-between py-1.5 gap-4">
                              <div className="w-[180px] shrink-0">
                                <span className="text-[13px] font-medium text-zinc-800 font-sans">Trade & tariffs</span>
                              </div>
                              <div className="flex-1 flex items-center gap-2 flex-wrap">
                                <span className={`inline-flex items-center text-[10.5px] font-semibold py-0.5 px-2 rounded-[3px] select-none ${getTagStyles("slate")}`}>
                                  Monitor
                                </span>
                                <span className="text-zinc-400 text-xs shrink-0">&rarr;</span>
                                <span className={`inline-flex items-center text-[10.5px] font-bold py-0.5 px-2 rounded-[3px] select-none ${getTagStyles("rose")}`}>
                                  Act now
                                </span>
                                <span className="text-[11.5px] text-zinc-500 font-normal font-sans shrink-0 leading-tight">
                                  +5 signals moved it
                                </span>
                              </div>
                              <div className="w-[80px] shrink-0 flex justify-end">
                                <svg className="w-16 h-6 stroke-red-500 fill-none" viewBox="0 0 100 30" style={{ strokeWidth: 2, strokeLinecap: 'round' }}>
                                  <path d="M 5,22 Q 35,19 65,10 T 95,4" />
                                </svg>
                              </div>
                            </div>

                            {/* Row 2: Data & privacy */}
                            <div className="flex items-center justify-between py-1.5 gap-4">
                              <div className="w-[180px] shrink-0">
                                <span className="text-[13px] font-medium text-zinc-800 font-sans">Data & privacy</span>
                              </div>
                              <div className="flex-1 flex items-center gap-2 flex-wrap">
                                <span className={`inline-flex items-center text-[10.5px] font-semibold py-0.5 px-2 rounded-[3px] select-none ${getTagStyles("amber")}`}>
                                  Watch closely
                                </span>
                                <span className="text-zinc-400 text-xs shrink-0">&rarr;</span>
                                <span className={`inline-flex items-center text-[10.5px] font-bold py-0.5 px-2 rounded-[3px] select-none ${getTagStyles("blue")}`}>
                                  Monitor
                                </span>
                                <span className="text-[11.5px] text-zinc-500 font-normal font-sans shrink-0 leading-tight">
                                  +2 signals moved it
                                </span>
                              </div>
                              <div className="w-[80px] shrink-0 flex justify-end">
                                <svg className="w-16 h-6 stroke-blue-500 fill-none" viewBox="0 0 100 30" style={{ strokeWidth: 2, strokeLinecap: 'round' }}>
                                  <path d="M 5,4 Q 35,8 65,17 T 95,23" />
                                </svg>
                              </div>
                            </div>

                            {/* Row 3: Ingredient bans & safety */}
                            <div className="flex items-center justify-between py-1.5 gap-4">
                              <div className="w-[180px] shrink-0">
                                <span className="text-[13px] font-medium text-zinc-800 font-sans">Ingredient bans & safety</span>
                              </div>
                              <div className="flex-1">
                                <span className="text-[12px] text-zinc-600 font-normal font-sans leading-tight">
                                  +3 new signals, posture unchanged (Watch closely)
                                </span>
                              </div>
                              <div className="w-[80px] shrink-0 flex justify-end">
                                <svg className="w-16 h-6 stroke-zinc-400 fill-none" viewBox="0 0 100 30" style={{ strokeWidth: 1.5, strokeLinecap: 'round' }}>
                                  <path d="M 5,15 Q 25,14 45,16 T 75,14 T 95,15" />
                                </svg>
                              </div>
                            </div>

                            {/* Row 4: Labeling & disclosure */}
                            <div className="flex items-center justify-between py-1.5 gap-4">
                              <div className="w-[180px] shrink-0">
                                <span className="text-[13px] font-medium text-zinc-800 font-sans">Labeling & disclosure</span>
                              </div>
                              <div className="flex-1">
                                <span className="text-[12px] text-zinc-600 font-normal font-sans leading-tight">
                                  +2 new signals, posture unchanged (Monitor)
                                </span>
                              </div>
                              <div className="w-[80px] shrink-0 flex justify-end">
                                <svg className="w-16 h-6 stroke-zinc-400 fill-none" viewBox="0 0 100 30" style={{ strokeWidth: 1.5, strokeLinecap: 'round' }}>
                                  <path d="M 5,15 Q 25,14 45,16 T 75,14 T 95,15" />
                                </svg>
                              </div>
                            </div>

                            {/* Row 5: ESG & sustainability */}
                            <div className="flex items-center justify-between py-1.5 gap-4">
                              <div className="w-[180px] shrink-0">
                                <span className="text-[13px] font-medium text-zinc-800 font-sans">ESG & sustainability</span>
                              </div>
                              <div className="flex-1">
                                <span className="text-[12px] text-zinc-500 font-normal font-sans leading-tight">
                                  +1 new signal, posture unchanged (Deprioritize)
                                </span>
                              </div>
                              <div className="w-[80px] shrink-0 flex justify-end">
                                <svg className="w-16 h-6 stroke-zinc-300 fill-none" viewBox="0 0 100 30" style={{ strokeWidth: 1.5, strokeLinecap: 'round' }}>
                                  <path d="M 5,16 Q 25,15 45,17 T 75,15 T 95,16" />
                                </svg>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Date Header */}
                      <h3 className="text-[10px] font-bold text-zinc-600 tracking-wider mb-1.5 select-none uppercase">
                        {dateGroup}
                      </h3>

                      {/* Highlights (Only block under first date group) */}
                      {gIdx === 0 && dailyHighlight && (
                        <div className="mb-4 pl-4 border-l-2 border-violet-500/80 flex flex-col gap-1.5 animate-fade-in pr-1">
                          <div className="flex items-center gap-1.5 text-zinc-900">
                            <Sparkles className="w-4 h-4 text-violet-600 animate-pulse" />
                            <h4 className="text-[13.5px] font-bold tracking-tight text-zinc-900">
                              Your highlights for the day
                            </h4>
                          </div>
                          <p className="text-[13px] text-zinc-700 leading-relaxed font-normal">
                            {dailyHighlight}
                          </p>
                        </div>
                      )}

                      {/* List of cards in this date group */}
                  <div className="flex flex-col gap-2">
                    {alertsInGroup.map((alert) => {
                      const isSelected = selectedAlert?.id === alert.id;
                      const impactScore = getAlertImpactScore(alert);

                      // Modern clean styles based on existing tags but refined
                      let bgClass = "";
                      let borderClass = "";
                      let textClass = "";

                      const resolvedColor = resolveTagColor(alert);

                      switch (resolvedColor) {
                        case "rose":
                          bgClass = "bg-[#fff5f5]/60 hover:bg-[#fff5f5]";
                          borderClass = isSelected ? "border-[#ef4444] ring-2 ring-[#ef4444]/25 shadow-sm" : "border-[#fde8e8]";
                          textClass = "text-zinc-900";
                          break;
                        case "amber":
                          bgClass = "bg-[#fffbeb]/60 hover:bg-[#fffbeb]";
                          borderClass = isSelected ? "border-[#f59e0b] ring-2 ring-[#f59e0b]/25 shadow-sm" : "border-[#fef3c7]";
                          textClass = "text-zinc-900";
                          break;
                        case "blue":
                          bgClass = "bg-[#f0f9ff]/60 hover:bg-[#f0f9ff]";
                          borderClass = isSelected ? "border-[#3b82f6] ring-2 ring-[#3b82f6]/25 shadow-sm" : "border-[#e0f2fe]";
                          textClass = "text-zinc-900";
                          break;
                        default:
                          bgClass = "bg-white hover:bg-zinc-50";
                          borderClass = isSelected ? "border-zinc-400 ring-2 ring-zinc-400/25 shadow-sm" : "border-zinc-200";
                          textClass = "text-zinc-950";
                      }
                      
                      const tagBadgeClass = getTagStyles(getCategoryTagColor(alert.category));

                      return (
                        <div
                          key={alert.id}
                          id={`alert-card-${alert.id}`}
                          onClick={() => {
                            onSelectAlert(alert);
                            setActiveTab("insights");
                          }}
                          className={`px-3 py-2 border rounded-[4px] cursor-pointer transition-all flex items-start gap-2.5 justify-between ${bgClass} ${borderClass} ${textClass}`}
                        >
                          {/* Left contents block */}
                          <div className="flex-1 flex flex-col items-start select-none">
                            <p className="text-[12.5px] font-medium leading-tight text-zinc-900">
                              {alert.signal_title}
                            </p>
                            <div className={`mt-1 rounded-[3px] py-0.5 px-2 text-[9px] font-semibold tracking-tight inline-block font-sans ${tagBadgeClass}`}>
                              {alert.category}
                            </div>
                          </div>

                          {/* Right impact indicator block */}
                          <div className="flex flex-col items-end flex-shrink-0 min-w-[65px] select-none pt-0.5">
                            <span className="text-[8.5px] font-bold tracking-wider text-zinc-400 mb-0.5 uppercase">
                              IMPACT
                            </span>
                            <div className="flex gap-1 items-center">
                              {Array.from({ length: 4 }).map((_, i) => {
                                const colorCls = getUnifiedImpactBarClass(alert, i);
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

                </div>
              );
            })
          )}
        </>
      )}
    </div>

        {/* Chat area removed */}

      </div>

      {/* RIGHT COLUMN: Selected Alert details view (Pane 2 - 40% width) */}
      <div id="alert-content-pane" className="w-[40%] h-full flex flex-col bg-white overflow-hidden relative">
        
        {/* Header of Content Detail */}
        <div id="content-header" className="h-[53px] px-4 border-b border-zinc-100 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <Sparkles className="w-3.5 h-3.5 text-violet-600" />
            <span className="text-[12px] text-zinc-600 font-semibold tracking-tight">
              AI powered Insights by MarketGenie
            </span>
          </div>
          
        </div>

        {/* Tab switcher: contents */}
        <div id="content-tabbar" className="px-5 border-b border-zinc-100 flex items-center justify-between h-10 select-text flex-shrink-0 animate-fade-in">
          <div className="flex items-center gap-4 h-full">
            <button
              onClick={() => setActiveTab("insights")}
              className={`flex items-center gap-1.5 text-xs h-full px-1 border-b-2 transition-colors duration-150 ${
                activeTab === "insights"
                  ? "border-[#7c3aed] text-zinc-900 font-semibold"
                  : "border-transparent text-zinc-500 hover:text-zinc-800"
              }`}
            >
              <span>≡ Insights</span>
            </button>
            <button
              onClick={() => setActiveTab("ask_marketgenie")}
              className={`flex items-center gap-1.5 text-xs h-full px-1 border-b-2 transition-colors duration-150 ${
                activeTab === "ask_marketgenie"
                  ? "border-[#7c3aed] text-zinc-900 font-semibold"
                  : "border-transparent text-zinc-500 hover:text-zinc-800"
              }`}
            >
              <span>Sparkles Ask MarketGenie</span>
            </button>
            <button
              onClick={() => setActiveTab("bookmarks")}
              className={`flex items-center gap-1.5 text-xs h-full px-1 border-b-2 transition-colors duration-150 ${
                activeTab === "bookmarks"
                  ? "border-[#7c3aed] text-zinc-900 font-semibold"
                  : "border-transparent text-zinc-500 hover:text-zinc-800"
              }`}
            >
              <Bookmark className="w-3 h-3 text-current fill-current opacity-70 shrink-0" />
              <span>Bookmark ({bookmarkedCount})</span>
            </button>
          </div>
        </div>

        {/* Dynamic switcher content */}
        {activeTab === "insights" && !selectedAlert && (
          <div className="flex-1 flex items-center justify-center text-sm text-zinc-500 font-medium tracking-tight">
            No signal selected
          </div>
        )}
        {activeTab === "insights" && selectedAlert && (
          /* Document Content Viewport representing mockup design choices */
          <div key={selectedAlert.id} id="details-viewport" ref={detailsViewportRef} className="animate-fade-in flex-1 overflow-y-auto p-6 md:p-8 flex flex-col gap-5 bg-white">
            
            <div className="flex flex-col gap-2">
              <h1 className="text-xl sm:text-[22px] font-semibold leading-tight tracking-tight text-[#111827] font-sans">
                {selectedAlert.signal_title}
              </h1>
              
              {/* Category Pill styled like left column, and Bookmark/Export as icons on the right */}
              <div className="flex items-center justify-between gap-4 mt-1 select-text">
                <span className={`rounded-[3px] py-0.5 px-2 text-[9px] font-semibold tracking-tight inline-block font-sans ${getTagStyles(getCategoryTagColor(selectedAlert.category))}`}>
                  {selectedAlert.category}
                </span>

                <div className="flex items-center gap-1.5 shrink-0 select-none">
                  <button
                    id="not-interested-button"
                    onClick={async () => {
                      if (!selectedAlert || !clientId || !userId) return;
                      try {
                        const { error } = await supabase
                          .from("hidden_articles")
                          .insert([
                            {
                              client_id: clientId,
                              user_id: userId,
                              policy_signal_id: selectedAlert.id
                            }
                          ]);
                        if (error) throw error;

                        setHiddenIds(prev => ({ ...prev, [selectedAlert.id]: true }));
                        setLastHiddenAlert(selectedAlert);
                        triggerToast(`Hidden: ${selectedAlert.signal_title}`, true);
                      } catch (err) {
                        console.error("Error hiding article:", err);
                        triggerToast("Failed to hide article");
                      }
                    }}
                    className="w-[22px] h-[22px] bg-[#fafafa] border border-zinc-200 text-zinc-400 hover:text-red-500 hover:bg-red-50/50 rounded-[3px] flex items-center justify-center transition-colors"
                    title="Not Interested"
                  >
                    <Square className="w-3 h-3" />
                  </button>

                  <button
                    id="bookmark-doc-button"
                    onClick={async () => {
                      if (!selectedAlert || !clientId || !userId) return;
                      const isCurrentlyBookmarked = isBookmarked[selectedAlert.id];
                      
                      try {
                        if (isCurrentlyBookmarked) {
                          // DELETE
                          const { error } = await supabase
                            .from("bookmarks")
                            .delete()
                            .eq("client_id", clientId)
                            .eq("user_id", userId)
                            .eq("policy_signal_id", selectedAlert.id);
                          if (error) throw error;
                          triggerToast(`Removed bookmark for ${selectedAlert.signal_title}`);
                        } else {
                          // INSERT
                          const { error } = await supabase
                            .from("bookmarks")
                            .insert([
                              {
                                client_id: clientId,
                                user_id: userId,
                                policy_signal_id: selectedAlert.id
                              }
                            ]);
                          if (error) throw error;
                          triggerToast(`Saved bookmark for ${selectedAlert.signal_title}`);
                        }
                        // Refresh bookmarks
                        await fetchBookmarks();
                      } catch (err) {
                        console.error("Error toggling bookmark:", err);
                        triggerToast("Failed to update bookmark");
                      }
                    }}
                    className={`w-[22px] h-[22px] border rounded-[3px] flex items-center justify-center transition-colors duration-150 ${
                      isBookmarked[selectedAlert.id]
                        ? "bg-amber-50/60 border-amber-200/80 text-amber-500 hover:bg-amber-100/35"
                        : "bg-[#fafafa] border-zinc-200 text-zinc-400 hover:text-zinc-650 hover:bg-zinc-100/50"
                    }`}
                    title={isBookmarked[selectedAlert.id] ? "Remove Bookmark" : "Bookmark"}
                  >
                    <Bookmark className={`w-3 h-3 ${isBookmarked[selectedAlert.id] ? "text-amber-500 fill-amber-500" : ""}`} />
                  </button>

                  <button
                    id="export-doc-button"
                    onClick={() => triggerToast(`Exported report for ${selectedAlert.signal_title} to PDF/CSV draft.`)}
                    className="w-[22px] h-[22px] bg-[#fafafa] border border-zinc-200 text-zinc-400 hover:text-zinc-650 hover:bg-zinc-100/50 rounded-[3px] flex items-center justify-center transition-colors"
                    title="Export"
                  >
                    <Share2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>

            {/* Meta values and Impact bar row inside a thin border box */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border border-zinc-200 rounded-[6px] p-4 bg-zinc-50/30 mt-2 select-text">
              <div className="flex flex-col gap-1 text-[12.5px] text-zinc-655">
                <div>
                  <span className="font-semibold text-zinc-800 font-sans">Source Published Date:</span>{" "}
                  <span className="text-zinc-600 font-sans">{dateDetected}</span>
                </div>
                <div>
                  <span className="font-semibold text-zinc-800 font-sans">Source Type:</span>{" "}
                  <span className="text-zinc-600 font-sans">{sourceType}</span>
                </div>
                <div>
                  <span className="font-semibold text-zinc-800 font-sans">Country:</span>{" "}
                  <span className="text-zinc-600 font-sans">{country}</span>
                </div>
              </div>

              <div className="flex flex-col items-end gap-1.5 min-w-[100px]">
                <span className="text-[10px] font-bold tracking-widest text-zinc-400">IMPACT</span>
                <div className="flex items-center gap-1">
                  {Array.from({ length: 4 }).map((_, i) => {
                    const colorCls = getUnifiedImpactBarClass(selectedAlert, i);
                    return (
                      <div
                        key={i}
                        className={`w-3.5 h-1.5 rounded-[1.5px] transition-all ${colorCls}`}
                      />
                    );
                  })}
                </div>
                <span className="text-[12.5px] font-bold text-zinc-700 tracking-tight font-sans">
                  {getImpactLabel(selectedAlert)}
                </span>
              </div>
            </div>

            {/* Document Content Paragraphs: full-width narrative and source box underneath */}
            <div className="flex flex-col gap-4 text-[13px] leading-relaxed text-zinc-705 font-sans mt-2 select-text">
              <p className="text-left">{selectedAlert.summary}</p>
              
              {/* 1 in a small box under the main text representing sources, visible link on hover */}
              <div className="flex items-center gap-1.5 select-text text-[11px] text-zinc-400 mt-1">
                <span className="font-normal text-zinc-400">Source:</span>
                {selectedAlert.source_article_url ? (
                  <a 
                    href={selectedAlert.source_article_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center w-[18px] h-[18px] bg-zinc-100 hover:bg-zinc-200/80 border border-zinc-200 rounded text-[10.5px] font-bold text-zinc-500 hover:text-zinc-750 cursor-pointer transition-colors animate-fade-in select-none"
                    title={selectedAlert.id === "cross-border-taxation" ? "Singapore Monetary Authority (MAS) Regulatory Consultation Platform" : `${selectedAlert.category} Primary Circular`}
                  >
                    1
                  </a>
                ) : (
                  <span 
                    className="inline-flex items-center justify-center w-[18px] h-[18px] bg-zinc-100 hover:bg-zinc-200/80 border border-zinc-200 rounded text-[10.5px] font-bold text-zinc-500 hover:text-zinc-750 cursor-help transition-colors animate-fade-in select-none"
                    title={selectedAlert.id === "cross-border-taxation" ? "Singapore Monetary Authority (MAS) Regulatory Consultation Platform" : `${selectedAlert.category} Primary Circular`}
                  >
                    1
                  </span>
                )}
              </div>
            </div>

            {/* Business Impact bullet segment (styled inside a lilac card, selectable and refined) */}
            <div className="flex flex-col gap-2 mt-4 select-text">
              <h3 className="text-[13.5px] font-bold tracking-tight text-zinc-900 font-sans select-text">
                Business Impact
              </h3>
              <div className="bg-[#f5f3ff]/60 border border-violet-100 p-4 rounded-[4px] flex flex-col gap-3">
                {businessImpactList.map((bullet, idx) => (
                  <div key={idx} className="flex gap-2.5 items-start">
                    <span className="text-[#7c3aed] text-xs mt-1 shrink-0 select-none">•</span>
                    <p className="text-[12px] leading-relaxed text-zinc-700 font-normal select-text">
                      {bullet}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Similar Policy & Risk Movements link segment with note-like icon in front of links */}
            <div className="flex flex-col gap-2 mt-4 select-text">
              <h3 className="text-[13.5px] font-bold tracking-tight text-zinc-900 font-sans select-text">
                Similar Policy & Risk Movements
              </h3>
              <div className="flex flex-col gap-2 ml-1">
                {isFetchingSimilar ? (
                  <div className="text-[12px] text-zinc-500 animate-pulse py-1">
                    Fetching similar movements...
                  </div>
                ) : externalSimilarArticles.length > 0 ? (
                  externalSimilarArticles.map((article, idx) => (
                    <div className="flex items-start gap-2 py-0.5" key={idx}>
                      <FileText className="w-3.5 h-3.5 text-zinc-400 mt-[2px] shrink-0 select-none" />
                      <button
                        onClick={() => {
                          if (article.signal_id) {
                            const alertToSelect = alerts.find(a => a.id === article.signal_id);
                            if (alertToSelect) {
                              onSelectAlert(alertToSelect);
                            }
                          }
                        }}
                        className="text-left text-[12px] text-zinc-700 hover:text-[#7c3aed] transition-colors leading-normal hover:underline select-text font-normal cursor-pointer"
                      >
                        {article.title}
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="text-[12px] text-zinc-400 py-1">
                    No similar movements found
                  </div>
                )}
              </div>
            </div>

            {/* Action buttons styled exactly like the provided reference image: White card, rounded border, left-aligned, sentence-case, purple icons */}
            <div className="flex flex-col gap-2 w-full mt-5 select-none font-sans font-normal text-[13px]">
              <button
                onClick={() => {
                  const query = "Show similar regulatory risks";
                  setLeftChatInput(query);
                  setActiveTab("ask_marketgenie");
                  handleLeftChatSend(query);
                }}
                className="w-full h-12 border border-zinc-200 bg-white hover:bg-[#fafafa] rounded-[4px] flex items-center gap-3.5 px-4 text-zinc-800 hover:text-zinc-950 transition-colors cursor-pointer text-left font-sans shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
              >
                <Sparkles className="w-4 h-4 text-[#7c3aed] fill-[#7c3aed]/10 shrink-0" />
                <span>Show similar regulatory risks</span>
              </button>

              <button
                onClick={() => {
                  const query = "Show other regulatory consultations";
                  setLeftChatInput(query);
                  setActiveTab("ask_marketgenie");
                  handleLeftChatSend(query);
                }}
                className="w-full h-12 border border-zinc-200 bg-white hover:bg-[#fafafa] rounded-[4px] flex items-center gap-3.5 px-4 text-zinc-800 hover:text-zinc-950 transition-colors cursor-pointer text-left font-sans shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
              >
                <BookOpen className="w-4 h-4 text-[#7c3aed] shrink-0" />
                <span>Show other regulatory consultations</span>
              </button>
            </div>

          </div>
        )}
        {activeTab === "ask_marketgenie" && (
          <div className="flex-1 flex flex-col p-4 bg-white animate-fade-in h-0">
             <div className="flex-1 flex flex-col overflow-hidden mb-2 animate-fade-in min-h-0">
                    {leftChatHistory.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-center p-4">
                        <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mb-3">
                          <Sparkles className="w-8 h-8 text-zinc-400" />
                        </div>
                        <p className="text-sm text-zinc-500 font-medium">No active conversation</p>
                        <p className="text-xs text-zinc-400 mt-1">Ask anything to get started</p>
                      </div>
                    ) : (
                      <div ref={chatScrollRef} className="flex-1 overflow-y-auto flex flex-col gap-3 pr-0.5 scroll-smooth">
                        {leftChatHistory.map((msg) => {
                          const isUser = msg.role === "user";
                          return (
                            <div
                              key={msg.id}
                              className={`flex flex-col max-w-[90%] ${
                                isUser ? "self-end items-end" : "self-start items-start"
                              }`}
                            >
                              <div
                                className={`px-3 py-2 text-[12px] leading-relaxed rounded-[4px] border ${
                                  isUser
                                    ? "bg-zinc-800 text-white border-zinc-950 font-sans"
                                    : "bg-zinc-50/60 text-zinc-800 border-zinc-200 font-sans"
                                }`}
                              >
                                <div className="whitespace-pre-wrap font-normal animate-fade-in">
                                  {msg.text}
                                </div>
                                <ChatSources sources={'sources' in msg ? (msg as any).sources || [] : []} />
                                {msg.detailedText && (
                                  <div className="mt-2 text-[12px] font-normal leading-relaxed text-zinc-700 animate-fade-in">
                                    {msg.detailedText}{" "}
                                    <ArrowUpRight className="inline-block w-3 h-3 text-zinc-500 align-middle" />
                                  </div>
                                )}
                                {!isUser && msg.matchedAlerts && msg.matchedAlerts.length > 0 && (
                                  <div className="flex flex-col gap-3 mt-3">
                                    {msg.matchedAlerts.map((alert) => (
                                      <div
                                        key={alert.id}
                                        className="flex flex-col gap-1"
                                      >
                                        <h3 className="text-[12px] font-semibold text-zinc-900 leading-snug">
                                          {alert.signal_title}
                                        </h3>
                                        <p className="text-[11px] text-zinc-600 font-normal leading-relaxed line-clamp-2">
                                          {alert.summary}
                                        </p>
                                        <button 
                                          onClick={(e) => {
                                            e.preventDefault();
                                            onSelectAlert(alert);
                                            setActiveTab("insights");
                                          }}
                                          className="text-[11px] text-[#7c3aed] flex items-center gap-1 font-medium hover:underline self-start"
                                        >
                                          View Insight &rarr;
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                        {leftChatLoading && (
                          <div className="self-start text-[11px] text-zinc-400 font-normal animate-pulse font-sans">
                            Searching regulation records...
                          </div>
                        )}
                      </div>
                    )}
                  </div>
 
              {/* Form input bar */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (leftChatLoading) {
                    if (abortControllerRef.current) {
                      abortControllerRef.current.abort();
                      setLeftChatLoading(false);
                    }
                  } else if (leftChatInput.trim()) {
                    handleLeftChatSend(leftChatInput);
                  }
                }}
                className="relative flex-shrink-0 mt-2"
              >
                {/* Suggestions near input when focused */}
                {isChatFocused && leftChatInput.trim() === "" && !leftChatLoading && (
                  <div className="absolute bottom-full left-0 right-0 z-50 max-h-[200px] overflow-y-auto animate-fade-in p-2 pb-2 mb-1">
                    <div className="flex flex-wrap gap-2">
                    {chatSuggestions.map((suggestion, idx) => {
                      return (
                        <button
                          key={idx}
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault(); // Prevent input blur so we keep focus or handle focus state cleanly
                            setLeftChatInput(suggestion);
                          }}
                          className="bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-700 text-[11.5px] px-3 py-1.5 rounded-full shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition-all cursor-pointer text-left flex items-center gap-1.5"
                        >
                          <Sparkles className="w-3 h-3 text-[#7c3aed]/70 shrink-0" />
                          <span className="truncate">{suggestion}</span>
                        </button>
                      );
                    })}
                    </div>
                  </div>
                )}
                <input
                  type="text"
                  placeholder="Ask more about policy, regulations and risk intelligence"
                  value={leftChatInput}
                  onChange={(e) => setLeftChatInput(e.target.value)}
                  onFocus={() => { setIsChatFocused(true); }}
                  onBlur={() => setTimeout(() => setIsChatFocused(false), 200)}
                  onKeyDown={handleLeftKeyDown}
                  className="w-full bg-[#fcfbf9]/40 text-[13px] pl-3.5 pr-26 py-3 border border-zinc-200 rounded-[6px] focus:outline-none focus:border-[#7c3aed] focus:ring-2 focus:ring-[#7c3aed]/20 placeholder:text-zinc-400 font-sans transition-all duration-150"
                />
                 <div className="absolute right-2 top-2.5 flex items-center gap-0.5">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setLeftChatInput("");
                    }}
                    className="h-7 px-2 flex items-center justify-center text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100 rounded-[4px] transition-colors cursor-pointer text-[11px] font-medium"
                    title="Close"
                  >
                    esc
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setLeftChatHistory([]);
                      setLeftChatInput("");
                    }}
                    className="w-7 h-7 flex items-center justify-center text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-full transition-colors cursor-pointer"
                    title="Clear chat"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button
                    type="submit"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (leftChatLoading) {
                        if (abortControllerRef.current) {
                          abortControllerRef.current.abort();
                          setLeftChatLoading(false);
                        }
                      } else if (leftChatInput.trim()) {
                        handleLeftChatSend(leftChatInput);
                      }
                    }}
                    className="w-7 h-7 bg-zinc-900 border border-zinc-900 text-white flex items-center justify-center rounded-full hover:bg-black transition-colors cursor-pointer ml-1"
                    title={leftChatLoading ? "Stop generating" : "Send"}
                  >
                    {leftChatLoading ? <Square className="w-3 h-3 fill-white" /> : <CornerDownLeft className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </form>
          </div>
        )}
        {activeTab === "bookmarks" && (
          /* Bookmarked list viewport */
          <div id="bookmarks-viewport" className="flex-1 overflow-y-auto p-6 md:p-8 flex flex-col gap-4 bg-[#fafafa]">
            <h3 className="text-[13.5px] font-semibold tracking-tight text-zinc-800 select-none">
              Your Saved Bookmarks ({bookmarkedAlerts.length})
            </h3>
            {bookmarkedAlerts.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-zinc-400 text-xs py-12 select-none">
                <Bookmark className="w-8 h-8 text-zinc-300 mb-2" />
                <span>No bookmarks saved in this workspace yet.</span>
                <span className="text-zinc-500 mt-1">Press "Bookmark" on any insight to save it here.</span>
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                {bookmarkedAlerts.map((alert) => {
                  const isCurrent = alert.id === selectedAlert?.id;
                  return (
                    <div
                      key={alert.id}
                      onClick={() => {
                        onSelectAlert(alert);
                        setActiveTab("insights");
                      }}
                      className={`p-4 border rounded-[4px] cursor-pointer transition-all ${
                        isCurrent 
                          ? "bg-amber-50/40 border-amber-300 shadow-sm"
                          : "bg-white border-zinc-200 hover:border-zinc-300 hover:shadow-sm"
                      }`}
                    >
                      <div className="flex justify-between items-start gap-3">
                        <span className="text-[13px] font-semibold text-zinc-900 leading-snug">
                          {alert.signal_title}
                        </span>
                        <span className="text-[9.5px] bg-zinc-100 px-1.5 py-0.5 rounded text-zinc-500 font-medium whitespace-nowrap">
                          {alert.category}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-zinc-100 text-[11px] text-zinc-400">
                        <span className="text-zinc-500 font-medium">
                          Bookmarked on {alert.bookmark_created_at ? formatDateHuman(alert.bookmark_created_at) : "N/A"}
                        </span>
                        <span className="text-[#7c3aed] font-medium hover:underline flex items-center gap-0.5">
                          Read Insight &rarr;
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Gorgeous bottom toast notifier */}
        {toastMessage && (
          <div 
            id="app-toast-alert" 
            className="absolute bottom-5 right-5 bg-zinc-900 text-white text-xs py-2 px-4 rounded shadow-lg transition-all duration-300 transform translate-y-0 flex items-center gap-3 border border-zinc-800 animate-in fade-in slide-in-from-bottom-2"
          >
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-[#7c3aed] animate-ping" />
              <span>{toastMessage}</span>
            </div>
            {lastHiddenAlert && (
              <button
                onClick={async () => {
                  if (!clientId || !userId || !lastHiddenAlert) return;
                  try {
                    const { error } = await supabase
                      .from("hidden_articles")
                      .delete()
                      .eq("client_id", clientId)
                      .eq("user_id", userId)
                      .eq("policy_signal_id", lastHiddenAlert.id);
                    if (error) throw error;

                    setHiddenIds(prev => {
                      const next = { ...prev };
                      delete next[lastHiddenAlert.id];
                      return next;
                    });
                    setLastHiddenAlert(null);
                    setToastMessage(null);
                  } catch (err) {
                    console.error("Error undoing hide:", err);
                  }
                }}
                className="text-violet-400 hover:text-violet-300 underline font-medium text-[11px] ml-1 cursor-pointer"
              >
                Undo
              </button>
            )}
          </div>
        )}

      </div>

    </div>
  );
}
