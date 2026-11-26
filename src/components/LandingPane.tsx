import React, { useState, useRef, useEffect, useMemo } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  ResponsiveContainer,
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Cell,
  LineChart as RechartsLineChart,
  Line,
  AreaChart as RechartsAreaChart,
  Area,
  PieChart as RechartsPieChart,
  Pie,
} from "recharts";
import {
  ArrowUp,
  ArrowRight,
  MessageCircle,
  Loader2,
  Sparkles,
  Bot,
  User,
  Clock,
  MessageSquare,
  Search,
  ChevronDown,
  ChevronRight,
  Plus,
  X,
  MoreVertical,
  Microscope,
  ShieldCheck,
  TrendingUp,
  Globe,
  Package,
  Users,
  Scale,
  Briefcase,
  Cpu,
  FileText,
  BarChart2,
  LineChart,
  PieChart,
  Layers,
  Target,
  Zap,
  CornerDownRight,
  Compass,
  Bookmark,
  Share2,
  FileDown,
  Trash2,
  ShieldAlert,
  ExternalLink,
  PlusCircle,
  MinusCircle,
} from "lucide-react";
import { jsPDF } from "jspdf";
import { ChatMessage } from "../types";
import { ChatSources } from "./ChatSources";
import ReportView from "./ReportView";
import { API_URL, MARKET_DYNAMICS_MODULE_ID, POLICY_RISK_MODULE_ID, FORWARD_OUTLOOK_MODULE_ID } from "../constants";
import { supabase } from "../lib/supabase";

interface ChatSession {
  id: string;
  title: string;
  date: string;
  displayTime: string;
  dayGroup: string;
  tag?: string;
  messages: ChatMessage[];
}

interface QuestionLibraryItem {
  id: string;
  category: "Decision Intelligence" | "Inference" | "List";
  title: string;
  question: string;
  description?: string;
}

const ICON_MAP: Record<string, any> = {
  Microscope, ShieldCheck, TrendingUp, Globe, Sparkles, Package,
  Users, Scale, Briefcase, Cpu, FileText, BarChart2, LineChart,
  PieChart, Layers, Target, Zap, Compass,
};

const CATEGORY_TO_TAB: Record<string, "Decision Intelligence" | "Inference" | "List"> = {
  "decision": "Decision Intelligence",
  "inference": "Inference",
  "list": "List",
};

const STAGED_LOADING_MESSAGES = [
  "Understanding your question…",
  "Searching the knowledge base…",
  "Pulling relevant data points…",
  "Cross-checking across sources…",
  "Analyzing patterns and gaps…",
  "Drafting the insight…",
];

interface HomePrompt {
  icon_name?: string | null;
  title: string;
  description?: string | null;
  question: string;
}

interface SubSignal {
  title: string;
  tag: string;
}

interface HighlightRow {
  moduleId: string;
  moduleName: string;
  tabId: string;
  itemId?: string;
  submoduleId?: string;
  label: string;
  body: string;
  so_what?: string;
  status?: string;
  delta?: number;
  delta_label?: string;
  icon?: string;
  color?: string;
  subSignals?: SubSignal[];
}

const getSnapshotChipClass = (color: string) => {
  switch (color) {
    case "green":
      return "bg-emerald-50 border border-emerald-200 text-emerald-700";
    case "amber":
      return "bg-amber-50 border border-amber-200 text-amber-700";
    case "red":
      return "bg-rose-50 border border-rose-200 text-rose-700";
    case "blue":
      return "bg-blue-50 border border-blue-200 text-blue-700";
    default:
      return "bg-zinc-50 border border-zinc-200 text-zinc-600";
  }
};

const getSourceBadge = (moduleName: string) => {
  if (moduleName.includes("Market")) {
    return {
      bg: "bg-purple-50/80 border-purple-200 text-[#2d39d2]",
      dot: "bg-[#2d39d2]",
      icon: TrendingUp,
    };
  }
  if (moduleName.includes("Policy") || moduleName.includes("Risk")) {
    return {
      bg: "bg-rose-50/80 border-rose-200 text-rose-700",
      dot: "bg-rose-500",
      icon: ShieldAlert,
    };
  }
  return {
    bg: "bg-blue-50/80 border-blue-200 text-blue-700",
    dot: "bg-blue-500",
    icon: Compass,
  };
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
  if (cat.includes("consumer") || cat.includes("demand")) {
    return "bg-rose-50 border border-rose-200 text-rose-800";
  }
  if (cat.includes("technology")) {
    return "bg-purple-50 border border-purple-200 text-purple-800";
  }
  if (cat.includes("supply") || cat.includes("chain")) {
    return "bg-orange-50 border border-orange-200 text-orange-800";
  }
  if (cat.includes("product") || cat.includes("innovation")) {
    return "bg-teal-50 border border-teal-200 text-teal-800";
  }
  if (cat.includes("sustainability") || cat.includes("environmental")) {
    return "bg-emerald-50 border border-emerald-200 text-emerald-800";
  }
  if (cat.includes("policy") || cat.includes("regulat") || cat.includes("risk") || cat.includes("legal") || cat.includes("compliance")) {
    return "bg-rose-50 border border-rose-200 text-rose-800";
  }
  if (cat.includes("outlook") || cat.includes("trend") || cat.includes("forward") || cat.includes("strategic")) {
    return "bg-blue-50 border border-blue-200 text-blue-800";
  }
  return "bg-slate-50 border border-slate-200 text-slate-800";
};

interface SignalUsedItem {
  id: string;
  insight_id?: string;
  title: string;
  tag: string;
}

interface CardSignal { id: string; title: string; tag: string | null; }
interface HighlightCard { id: string; title: string; tag: string | null; signals: CardSignal[]; }
interface ModuleCards { cards: HighlightCard[]; loose: CardSignal[]; total: number; }

interface DailyHighlightItem {
  module_id: string;
  highlight_text: string;
  signal_date?: string;
  created_at?: string;
  signals_used?: SignalUsedItem[];
}

interface DailyHighlightsData {
  highlights: DailyHighlightItem[];
  intro: string | null;
  conclusion: string | null;
  latestSignalDate?: string | null;
}

const BRIEFING_MODULES = [
  {
    id: MARKET_DYNAMICS_MODULE_ID,
    name: "Market Dynamics",
  },
  {
    id: POLICY_RISK_MODULE_ID,
    name: "Policy & Risk Monitor",
  },
  {
    id: FORWARD_OUTLOOK_MODULE_ID,
    name: "Forward Outlook",
  },
];


interface DecisionIntelligencePaneProps {
  onReturn?: () => void;
  onTabChange?: (tabId: string, signalId?: string) => void;
  clientId?: string;
  industry?: string;
  userId?: string;
  initialQuery?: {query: string, timestamp: number};
  returnLabel?: string;
  fetchCreditUsage?: () => void;
  onCreditUsageUpdate?: () => void;
}

const MODULE_TO_TAB: Record<string, { tabId: string; tabLabel: string }> = {
  "Policy & Risk": { tabId: "policy_risk_monitor", tabLabel: "Policy & Risk Monitor" },
  "Market Dynamics": { tabId: "market_dynamics", tabLabel: "Market Dynamics" },
  "Forward Outlook": { tabId: "foreward_outlook", tabLabel: "Forward Outlook" },
  "Competitive Radar": { tabId: "competitive_radar", tabLabel: "Competitive Radar" },
  "Voice of Customer": { tabId: "voice_of_customer", tabLabel: "Voice of Customer" },
};

const getTargetTabInfo = (item: { title?: string; category?: string; module?: string }) => {
  if (item.module && MODULE_TO_TAB[item.module]) {
    return MODULE_TO_TAB[item.module];
  }
  const cat = (item.category || "").toLowerCase();
  if (cat.includes("policy") || cat.includes("regulatory") || cat.includes("compliance")) {
    return { tabId: "policy_risk_monitor", tabLabel: "Policy & Risk Monitor" };
  }
  if (cat.includes("market") || cat.includes("industry structure")) {
    return { tabId: "market_dynamics", tabLabel: "Market Dynamics" };
  }
  if (cat.includes("technology") || cat.includes("product") || cat.includes("sustainability") || cat.includes("horizon")) {
    return { tabId: "foreward_outlook", tabLabel: "Forward Outlook" };
  }
  return { tabId: "policy_risk_monitor", tabLabel: "Policy & Risk Monitor" };
};

const convertReportToMarkdown = (report: any): string => {
  if (!report) return "";
  const parts: string[] = [];

  if (report.title && typeof report.title === "string" && report.title.trim()) {
    parts.push(`### ${report.title.trim()}`);
  }

  if (report.bodyText && typeof report.bodyText === "string" && report.bodyText.trim()) {
    parts.push(report.bodyText.trim());
  }

  if (report.outlook) {
    parts.push(`#### Outlook`);
    if (Array.isArray(report.outlook)) {
      parts.push(report.outlook.filter(Boolean).join("\n\n"));
    } else if (typeof report.outlook === "string") {
      parts.push(report.outlook);
    }
  }

  if (report.analysis) {
    parts.push(`#### Analysis`);
    if (Array.isArray(report.analysis)) {
      parts.push(report.analysis.filter(Boolean).join("\n\n"));
    } else if (typeof report.analysis === "string") {
      parts.push(report.analysis);
    }
  }

  if (report.sections && Array.isArray(report.sections)) {
    report.sections.forEach((sec: any) => {
      if (sec.heading) {
        parts.push(`#### ${sec.heading}`);
      }
      if (sec.points && Array.isArray(sec.points)) {
        sec.points.forEach((pt: string) => {
          if (pt) parts.push(`- ${pt}`);
        });
      }
    });
  }

  if (report.blocks && Array.isArray(report.blocks)) {
    report.blocks.forEach((blk: any) => {
      if (blk.type === "heading" && blk.text) {
        parts.push(`#### ${blk.text}`);
      } else if (blk.type === "paragraph" && blk.text) {
        parts.push(blk.text);
      } else if (blk.type === "bullets" && Array.isArray(blk.items)) {
        blk.items.forEach((it: string) => {
          if (it) parts.push(`- ${it}`);
        });
      }
    });
  }

  if (report.key_facts && Array.isArray(report.key_facts) && report.key_facts.length > 0) {
    parts.push(`#### Key Facts`);
    report.key_facts.forEach((fact: string) => {
      if (fact) parts.push(`- ${fact}`);
    });
  }

  if (report.driving_factors && Array.isArray(report.driving_factors) && report.driving_factors.length > 0) {
    parts.push(`#### Driving Factors`);
    report.driving_factors.forEach((f: string) => {
      if (f) parts.push(`- ${f}`);
    });
  }

  if (report.what_to_watch) {
    parts.push(`#### What to Watch`);
    if (Array.isArray(report.what_to_watch)) {
      report.what_to_watch.forEach((w: string) => {
        if (w) parts.push(`- ${w}`);
      });
    } else if (typeof report.what_to_watch === "string") {
      parts.push(report.what_to_watch);
    }
  }

  if (report.decision_implication && typeof report.decision_implication === "string" && report.decision_implication.trim()) {
    parts.push(`#### Decision Implication\n${report.decision_implication.trim()}`);
  }

  if (report.bottom_line && typeof report.bottom_line === "string" && report.bottom_line.trim()) {
    parts.push(`#### Bottom Line\n${report.bottom_line.trim()}`);
  }

  if (report.confidence_evidence && Array.isArray(report.confidence_evidence) && report.confidence_evidence.length > 0) {
    parts.push(`#### Confidence & Evidence`);
    report.confidence_evidence.forEach((ce: any) => {
      if (ce.label && ce.value) {
        parts.push(`- **${ce.label}:** ${ce.value}`);
      }
    });
  }

  return parts.join("\n\n");
};


export default function LandingPane({
  onReturn,
  onTabChange,
  clientId = "",
  industry = "",
  userId = "",
  initialQuery,
  returnLabel,
  fetchCreditUsage,
  onCreditUsageUpdate,
}: DecisionIntelligencePaneProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [savedMessageIds, setSavedMessageIds] = useState<Record<string, boolean>>({});
  const [sharedMessageIds, setSharedMessageIds] = useState<Record<string, boolean>>({});
  const [homeQuestions, setHomeQuestions] = useState<HomePrompt[]>([]);
  const [libraryQuestions, setLibraryQuestions] = useState<QuestionLibraryItem[]>([]);

  // Persist conversationId in localStorage so it survives unmount/remount
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(
    () => localStorage.getItem("dr_current_conversation_id")
  );

  useEffect(() => {
    localStorage.setItem("dr_current_conversation_id", currentConversationId || "");
  }, [currentConversationId]);

  const diFetch = async (path: string, options: RequestInit = {}) => {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error || !session || !session.access_token) {
      throw new Error("NO_SESSION");
    }
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${session.access_token}`,
      ...(options.headers as Record<string, string> || {}),
    };
    return fetch(`${API_URL}${path}`, {
      ...options,
      headers,
    });
  };

  useEffect(() => {
    if (initialQuery?.query) {
      handleSend(initialQuery.query);
    }
  }, [initialQuery]);

  const handleSaveMessage = (id: string) => {
    setSavedMessageIds((prev) => {
      const isSaved = !prev[id];
      return { ...prev, [id]: isSaved };
    });
  };

  const handleShareMessage = (id: string, text: string) => {
    try {
      navigator.clipboard.writeText(text);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
    setSharedMessageIds((prev) => ({ ...prev, [id]: true }));
    setTimeout(() => {
      setSharedMessageIds((prev) => ({ ...prev, [id]: false }));
    }, 2000);
  };

  const handleDownloadPDF = (msgId: string, text: string, msgIndex: number) => {
    try {
      const precedingUserMsg = messages.slice(0, msgIndex).reverse().find(m => m.role === "user");
      const questionText = precedingUserMsg?.text || "Decision Intelligence Inquiry";

      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const margin = 20;
      const printableWidth = 170; // 210 - 40
      let y = 25;

      const drawHeaderAndFooter = () => {
        // Draw top thin accent line (royal purple / indigo)
        doc.setFillColor(45, 57, 210); // rgb of #2d39d2
        doc.rect(0, 0, 210, 3, "F");

        // Header texts
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(113, 113, 122); // zinc-500 (#71717a)
        doc.text("DECISION INTELLIGENCE ADVISORY", 20, 12);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.text("CONFIDENTIAL REPORT", 190, 12, { align: "right" });

        // Divider line
        doc.setDrawColor(228, 228, 231); // zinc-200 (#e4e4e7)
        doc.setLineWidth(0.3);
        doc.line(20, 15, 190, 15);

        // Footer text
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7);
        doc.setTextColor(161, 161, 170); // zinc-400
        doc.text("Report generated dynamically via AI Studio Decision Portal. All rights reserved.", 20, 287);
        const pageCount = (doc as any).internal.getNumberOfPages();
        doc.text(`Page ${pageCount}`, 190, 287, { align: "right" });
      };

      // Initial header/footer
      drawHeaderAndFooter();

      const addText = (txt: string, fontSize = 10, isBold = false, color = "#3f3f46", indent = 0) => {
        doc.setFont("helvetica", isBold ? "bold" : "normal");
        doc.setFontSize(fontSize);
        
        const hex = color.replace("#", "");
        const r = parseInt(hex.substring(0, 2) || "3f", 16);
        const g = parseInt(hex.substring(2, 4) || "3f", 16);
        const b = parseInt(hex.substring(4, 6) || "46", 16);
        doc.setTextColor(r, g, b);

        const splitLines = doc.splitTextToSize(txt, printableWidth - indent);
        for (const line of splitLines) {
          if (y > 270) {
            doc.addPage();
            drawHeaderAndFooter();
            y = 25;
            doc.setFont("helvetica", isBold ? "bold" : "normal");
            doc.setFontSize(fontSize);
            doc.setTextColor(r, g, b);
          }
          doc.text(line, margin + indent, y);
          y += (fontSize * 0.352) * 1.45;
        }
      };

      // Report Header Title
      y = 25;
      addText("DECISION SYSTEM INTELLIGENCE BRIEF", 15, true, "#18181b");
      y += 2;

      // Metadata Box
      doc.setFillColor(248, 250, 252); // slate-50 (#f8fafc)
      doc.setDrawColor(226, 232, 240); // slate-200
      doc.setLineWidth(0.3);
      doc.rect(20, y, 170, 22, "FD");

      // Vertical indicator bar
      doc.setFillColor(45, 57, 210); // purple-600
      doc.rect(20, y, 1.5, 22, "F");

      // Metadata text inside block
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105); // slate-600
      doc.text("PREPARED FOR:", 24, y + 6);
      doc.text("INDUSTRY SEGMENT:", 24, y + 11);
      doc.text("GENERATED ON:", 24, y + 16);

      doc.setFont("helvetica", "normal");
      if (userId) doc.text(userId, 60, y + 6);
      if (industry) doc.text(industry, 60, y + 11);
      doc.text(new Date().toLocaleString("en-US", { 
        year: 'numeric', month: 'long', day: 'numeric', 
        hour: '2-digit', minute: '2-digit', timeZoneName: 'short' 
      }), 60, y + 16);

      y += 28;

      // Question Brief
      addText("QUERY BRIEF", 9, true, "#2d39d2");
      y += 1;
      addText(questionText, 10.5, false, "#18181b");
      y += 5;

      // Divider
      doc.setDrawColor(244, 244, 245); // zinc-100
      doc.line(20, y, 190, y);
      y += 5;

      // Strategic Evaluation Title
      addText("STRATEGIC EVALUATION & INFERENCE", 11.5, true, "#18181b");
      y += 2.5;

      // Parse and format markdown
      const lines = text.split("\n");
      for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim();
        if (!line) {
          y += 2.5;
          continue;
        }

        // Check if list item or markdown table
        if (line.startsWith("|")) {
          const cells = line.split("|").map(c => c.trim()).filter(c => c);
          if (cells.length > 0 && !line.includes("---")) {
            // Draw table row background
            if (y > 270) {
              doc.addPage();
              drawHeaderAndFooter();
              y = 25;
            }
            doc.setFillColor(250, 250, 250);
            doc.rect(20, y - 4, 170, 6, "F");
            
            // Format cells spacing
            let cellX = 22;
            doc.setFont("helvetica", i === 0 || i === 1 ? "bold" : "normal");
            doc.setFontSize(8);
            doc.setTextColor(24, 24, 27);
            
            // Draw cells
            cells.forEach((cell, cellIdx) => {
              const widthLimit = cellIdx === 0 ? 35 : cellIdx === 1 ? 35 : 45;
              const truncated = doc.splitTextToSize(cell, widthLimit)[0] || cell;
              doc.text(truncated, cellX, y);
              cellX += widthLimit + 4;
            });
            y += 5.5;
          }
          continue;
        }

        if (line.startsWith("###")) {
          const heading = line.replace(/^###\s+/, "");
          y += 3;
          addText(heading, 11, true, "#18181b");
          y += 1.5;
        } else if (line.startsWith("####")) {
          const heading = line.replace(/^####\s+/, "");
          y += 2;
          addText(heading, 10, true, "#2d39d2");
          y += 1;
        } else if (line.startsWith("-") || line.startsWith("*")) {
          const itemText = line.replace(/^[-*]\s+/, "");
          addText("• " + itemText, 9.5, false, "#3f3f46", 5);
        } else if (line.startsWith("1.") || line.startsWith("2.") || line.startsWith("3.") || line.startsWith("4.")) {
          addText(line, 9.5, false, "#3f3f46", 4);
        } else if (line.startsWith("```")) {
          while (i < lines.length - 1 && !lines[i + 1].trim().startsWith("```")) {
            i++;
          }
          i++; // skip closing ```
          addText("[Analytical Visualization Reference Index Included]", 9, true, "#71717a", 5);
          y += 1.5;
        } else {
          addText(line, 9.5, false, "#3f3f46");
        }
      }

      doc.save(`Decision_Intelligence_Report_${msgId.substring(0, 6)}.pdf`);
    } catch (err) {
      console.error("Failed to generate PDF: ", err);
    }
  };

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingStageIndex, setLoadingStageIndex] = useState(0);

  useEffect(() => {
    if (!loading) {
      setLoadingStageIndex(0);
      return;
    }

    setLoadingStageIndex(0);
    const interval = setInterval(() => {
      setLoadingStageIndex((prev) => {
        if (prev < STAGED_LOADING_MESSAGES.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 1600);

    return () => clearInterval(interval);
  }, [loading]);
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  const [previousSessions, setPreviousSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  /* Removed duplicate state definition */
  const [showPreviousChatsModal, setShowPreviousChatsModal] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [showQuestionLibraryModal, setShowQuestionLibraryModal] = useState(false);
  const [selectedLibraryTab, setSelectedLibraryTab] = useState<"Decision Intelligence" | "Inference" | "List">("Decision Intelligence");
  const [librarySearchQuery, setLibrarySearchQuery] = useState("");

  const [dailyHighlights, setDailyHighlights] = useState<DailyHighlightsData | null>(null);
  const [highlightsLoading, setHighlightsLoading] = useState(true);
  const [highlightsDate, setHighlightsDate] = useState<string>("");
  const [moduleCards, setModuleCards] = useState<Record<string, ModuleCards>>({});
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});
  const [showAllCards, setShowAllCards] = useState<Record<string, boolean>>({});

  const handleSignalClick = (moduleId: string, signal: { id: string }) => {
    if (!onTabChange) return;
    if (moduleId === MARKET_DYNAMICS_MODULE_ID) {
      onTabChange("market_dynamics", signal.id);
    } else if (moduleId === POLICY_RISK_MODULE_ID) {
      onTabChange("policy_risk_monitor", signal.id);
    } else if (moduleId === FORWARD_OUTLOOK_MODULE_ID) {
      onTabChange("foreward_outlook", signal.id);
    }
  };

  const formatSignalDate = (dateStr?: string) => {
    if (!dateStr || typeof dateStr !== "string") return null;
    const parts = dateStr.trim().split("-");
    if (parts.length !== 3) return dateStr;
    const [y, m, d] = parts;
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthName = months[parseInt(m, 10) - 1] || m;
    const dayNum = parseInt(d, 10);
    return `${isNaN(dayNum) ? d : dayNum} ${monthName} ${y}`;
  };

  const hasAnyHighlightsData = useMemo(() => {
    return Boolean(
      (dailyHighlights?.intro && dailyHighlights.intro.trim()) ||
      (dailyHighlights?.conclusion && dailyHighlights.conclusion.trim()) ||
      (dailyHighlights?.highlights && dailyHighlights.highlights.some((h) => h.highlight_text && h.highlight_text.trim()))
    );
  }, [dailyHighlights]);

  useEffect(() => {
    async function loadTodayHighlights() {
      if (!clientId) {
        setHighlightsLoading(false);
        setDailyHighlights(null);
        setModuleCards({});
        return;
      }
      setHighlightsLoading(true);

      try {
        const [res, cardsRes] = await Promise.all([
          fetch(`${API_URL}/daily-highlights/${clientId}`).catch(() => null),
          fetch(`${API_URL}/daily-highlight-cards/${clientId}`).catch(() => null),
        ]);

        if (res && res.ok) {
          const dailyRes = await res.json().catch(() => null);
          if (dailyRes) {
            setDailyHighlights({
              highlights: Array.isArray(dailyRes.highlights) ? dailyRes.highlights : [],
              intro: dailyRes.intro ?? null,
              conclusion: dailyRes.conclusion ?? null,
              latestSignalDate: dailyRes.latestSignalDate ?? null,
            });
            if (dailyRes.latestSignalDate) {
              setHighlightsDate(dailyRes.latestSignalDate);
            }
          } else {
            setDailyHighlights(null);
          }
        } else {
          setDailyHighlights(null);
        }

        if (cardsRes && cardsRes.ok) {
          const cardsJson = await cardsRes.json().catch(() => null);
          setModuleCards(cardsJson?.modules || {});
        } else {
          setModuleCards({});
        }
      } catch (err) {
        console.error("Failed to load today highlights:", err);
        setDailyHighlights(null);
        setModuleCards({});
      } finally {
        setHighlightsLoading(false);
      }
    }

    loadTodayHighlights();
  }, [clientId]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  useEffect(() => {
    (async () => {
      try {
        const [homeRes, libRes] = await Promise.all([
          diFetch(`/dynamic-rag/suggested-questions?surface=home`),
          diFetch(`/dynamic-rag/suggested-questions?surface=library`),
        ]);

        if (homeRes.ok) {
          const data = await homeRes.json();
          const qs = data.questions || data || [];
          if (Array.isArray(qs)) setHomeQuestions(qs);
        }

        if (libRes.ok) {
          const data = await libRes.json();
          const qs = data.questions || data || [];
          if (Array.isArray(qs)) {
            setLibraryQuestions(
              qs.map((q: any) => ({
                id: q.id || Math.random().toString(36).substring(2),
                category: CATEGORY_TO_TAB[q.category] ?? "Decision Intelligence",
                title: q.title || q.question,
                question: q.question,
                description: q.description ?? undefined,
              }))
            );
          }
        }
      } catch (e: any) {
        if (e.message === "NO_SESSION") {
          console.warn("[DI] No session for suggested questions");
        } else {
          console.warn("[DI] Unable to load suggested questions", e);
        }
      }
    })();
  }, []);

  const loadConversations = async () => {
    try {
      const res = await diFetch(`/dynamic-rag/conversations`);
      if (res.ok) {
        const data = await res.json();
        const conversations = data.conversations || data || [];
        const mapped: ChatSession[] = conversations.map((c: any) => ({
          id: c.id,
          title: c.title || "Untitled Chat",
          date: "",
          displayTime: relativeTime(c.updated_at),
          dayGroup: groupDay(c.updated_at),
          messages: [],
        }));
        setPreviousSessions(mapped);
      }
    } catch (e: any) {
      if (e.message === "NO_SESSION") {
        setMessages([{
          id: "no-session-err",
          role: "model",
          text: "Please log in again.",
          timestamp: new Date(),
        }]);
      } else {
        console.warn("[DI] Unable to load conversations", e);
      }
    }
  };

  useEffect(() => {
    loadConversations();
  }, []);

  function relativeTime(iso: string): string {
    if (!iso) return "";
    const diff = (Date.now() - new Date(iso).getTime()) / 1000;
    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
    if (diff < 172800) return "yesterday";
    return `${Math.floor(diff / 86400)} days ago`;
  }

  function groupDay(iso: string): string {
    if (!iso) return "";
    const d = new Date(iso);
    const today = new Date();
    const diff = Math.floor(
      (Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())
        - Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())) / 86400000
    );
    if (diff === 0) return "Today";
    if (diff === 1) return "Yesterday";
    return "Earlier";
  }

    const handleSourceOpen = (source: any) => {
    console.log("[DI open]", source.module, "|", source.title, "| signal_id:", source.signal_id);
    const tab = MODULE_TO_TAB[source.module || ""];
    if (!tab || !onTabChange) return;
    onTabChange(tab.tabId, source.signal_id || undefined);
  };

const DecisionChart: React.FC<{
  title?: string;
  type?: "bar" | "line" | "area" | "pie";
  data: Array<{ name: string; value?: number; change?: number; impact?: number; margin?: number; weeks?: number; emissions?: number; score?: number; fill?: string; [key: string]: any }>;
  dataKey?: string;
  unit?: string;
}> = ({ title, type = "bar", data, dataKey = "value", unit = "%" }) => {
  const isLine = type === "line";
  const isArea = type === "area";
  const isPie = type === "pie";

  return (
    <div className="my-3.5 p-3.5 bg-zinc-50/90 rounded-[8px] border border-zinc-200/80 shadow-2xs font-sans">
      {title && (
        <div className="text-[12px] font-semibold text-zinc-800 mb-2.5 flex items-center gap-1.5">
          {isLine ? (
            <LineChart className="w-3.5 h-3.5 text-[#3b82f6]" />
          ) : isPie ? (
            <PieChart className="w-3.5 h-3.5 text-[#10b981]" />
          ) : isArea ? (
            <Layers className="w-3.5 h-3.5 text-[#06b6d4]" />
          ) : (
            <BarChart2 className="w-3.5 h-3.5 text-[#2d39d2]" />
          )}
          <span>{title}</span>
        </div>
      )}
      <div className="h-[175px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          {isLine ? (
            <RechartsLineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#52525b' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#52525b' }} axisLine={false} tickLine={false} />
              <RechartsTooltip
                formatter={(val: any) => [`${val}${unit}`, 'Metric']}
                contentStyle={{ backgroundColor: '#18181b', borderRadius: '6px', border: 'none', color: '#fff', fontSize: '11px', padding: '6px 10px' }}
                itemStyle={{ color: '#fff' }}
              />
              <Line type="monotone" dataKey={dataKey} stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
            </RechartsLineChart>
          ) : isArea ? (
            <RechartsAreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#52525b' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#52525b' }} axisLine={false} tickLine={false} />
              <RechartsTooltip
                formatter={(val: any) => [`${val}${unit}`, 'Metric']}
                contentStyle={{ backgroundColor: '#18181b', borderRadius: '6px', border: 'none', color: '#fff', fontSize: '11px', padding: '6px 10px' }}
                itemStyle={{ color: '#fff' }}
              />
              <Area type="monotone" dataKey={dataKey} stroke="#06b6d4" fill="#ecfeff" strokeWidth={2} />
            </RechartsAreaChart>
          ) : isPie ? (
            <RechartsPieChart margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
              <RechartsTooltip
                formatter={(val: any) => [`${val}${unit}`, 'Metric']}
                contentStyle={{ backgroundColor: '#18181b', borderRadius: '6px', border: 'none', color: '#fff', fontSize: '11px', padding: '6px 10px' }}
                itemStyle={{ color: '#fff' }}
              />
              <Pie
                data={data}
                dataKey={dataKey}
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={60}
                fill="#10b981"
                label={{ fontSize: 9, fill: '#52525b' }}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill || '#10b981'} />
                ))}
              </Pie>
            </RechartsPieChart>
          ) : (
            <RechartsBarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#52525b' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#52525b' }} axisLine={false} tickLine={false} />
              <RechartsTooltip
                formatter={(val: any) => [`${val}${unit}`, 'Metric']}
                contentStyle={{ backgroundColor: '#18181b', borderRadius: '6px', border: 'none', color: '#fff', fontSize: '11px', padding: '6px 10px' }}
                itemStyle={{ color: '#fff' }}
              />
              <Bar dataKey={dataKey} radius={[4, 4, 0, 0]}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill || '#2d39d2'} />
                ))}
              </Bar>
            </RechartsBarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
};

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || loading) return;

    let session;
    try {
      const sessionRes = await supabase.auth.getSession();
      session = sessionRes.data.session;
    } catch {
      session = null;
    }

    if (!session || !session.access_token) {
      setMessages((prev) => [
        ...prev,
        {
          id: Math.random().toString(36).substring(2),
          role: "user",
          text: query,
          timestamp: new Date(),
        },
        {
          id: Math.random().toString(36).substring(2),
          role: "model",
          text: "Please log in again.",
          timestamp: new Date(),
        },
      ]);
      setInput("");
      return;
    }

    const userMessage: ChatMessage = {
      id: typeof crypto.randomUUID === "function" ? crypto.randomUUID() : Math.random().toString(36).substring(2),
      role: "user",
      text: query,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    const executeSend = async (convIdToUse?: string | null): Promise<{ res: Response; data: any }> => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 90000);

      try {
        const res = await diFetch(`/dynamic-rag/chat`, {
          method: "POST",
          body: JSON.stringify({
            question: query,
            conversationId: convIdToUse || undefined,
          }),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        const data = await res.json().catch(() => ({}));
        return { res, data };
      } catch (err: any) {
        clearTimeout(timeoutId);
        throw err;
      }
    };

    try {
      let { res, data } = await executeSend(currentConversationId);

      if ((!res.ok || data.ok === false) && data.error?.code === "CONVERSATION_NOT_FOUND") {
        setCurrentConversationId(null);
        localStorage.removeItem("dr_current_conversation_id");
        const retryResult = await executeSend(null);
        res = retryResult.res;
        data = retryResult.data;
      }

      if (!res.ok || data.ok === false) {
        const errorMsg = data.error?.message || "Sorry, I could not answer that. Please try again.";
        throw new Error(errorMsg);
      }

      if (data.conversation_id && !currentConversationId) {
        setCurrentConversationId(data.conversation_id);
        setActiveSessionId(data.conversation_id);
      }

      loadConversations();
      (fetchCreditUsage || onCreditUsageUpdate)?.();

      const modelId = typeof crypto.randomUUID === "function" ? crypto.randomUUID() : Math.random().toString(36).substring(2);
      const modelText = data.answer || "";
      const tokens = modelText.match(/\S+\s*/g) || (modelText ? [modelText] : []);
      let currentIndex = 0;
      let streamedText = "";

      const initialModelMessage: ChatMessage = {
        id: modelId,
        role: "model",
        text: "",
        isStreaming: tokens.length > 0,
        timestamp: new Date(),
      } as any;

      setMessages((prev) => [...prev.filter((m) => m.id !== modelId), initialModelMessage]);

      if (tokens.length === 0) {
        setLoading(false);
        loadConversations();
        return;
      }

      const intervalTime = tokens.length > 400 ? 12 : tokens.length > 200 ? 16 : 18;

      const timer = setInterval(() => {
        if (currentIndex >= tokens.length) {
          clearInterval(timer);
          setLoading(false);
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === modelId
                ? {
                    ...msg,
                    text: modelText,
                    isStreaming: false,
                  }
                : msg
            )
          );
          loadConversations();
          return;
        }

        const nextWord = tokens[currentIndex];
        currentIndex += 1;
        streamedText += nextWord;

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === modelId
              ? {
                  ...msg,
                  text: streamedText,
                  isStreaming: true,
                }
              : msg
          )
        );
      }, intervalTime);

    } catch (err: any) {
      console.error("[DI] handleSend failed", err);
      setLoading(false);

      const modelId = typeof crypto.randomUUID === "function" ? crypto.randomUUID() : Math.random().toString(36).substring(2);
      const errText =
        err.message === "NO_SESSION"
          ? "Please log in again."
          : err.name === "AbortError"
          ? "The request timed out. Please try again."
          : err.message || "Sorry, I could not answer that. Please try again.";
      setMessages((prev) => [
        ...prev,
        {
          id: modelId,
          role: "model",
          text: errText,
          timestamp: new Date(),
        },
      ]);
    }
  };

  const handleSelectSession = async (session: ChatSession) => {
    setShowPreviousChatsModal(false);
    setActiveSessionId(session.id);
    setCurrentConversationId(session.id);
    try {
      const res = await diFetch(`/dynamic-rag/conversations/${session.id}`);
      if (res.ok) {
        const data = await res.json();
        const msgs = data.messages || [];
        const hydrated: ChatMessage[] = msgs.map((m: any) => ({
          id: m.id || Math.random().toString(36).substring(2),
          role: m.role === "user" ? "user" : "model",
          text: m.content || m.text || "",
          timestamp: new Date(m.created_at || Date.now()),
        }));
        setMessages(hydrated);
        return;
      }
      setMessages([]);
    } catch (e: any) {
      if (e.message === "NO_SESSION") {
        setMessages([{
          id: "no-session-err",
          role: "model",
          text: "Please log in again.",
          timestamp: new Date(),
        }]);
      } else {
        console.warn("[DI] Unable to load conversation", e);
        setMessages([]);
      }
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    try {
      await diFetch(`/dynamic-rag/conversations/${sessionId}`, { method: 'DELETE' });
      setPreviousSessions(prev => prev.filter(s => s.id !== sessionId));
      if (activeSessionId === sessionId || currentConversationId === sessionId) {
        setMessages([]);
        setActiveSessionId(null);
        setCurrentConversationId(null);
      }
    } catch (err: any) {
      if (err.message === "NO_SESSION") {
        setMessages([{
          id: "no-session-err",
          role: "model",
          text: "Please log in again.",
          timestamp: new Date(),
        }]);
      } else {
        console.warn('[DI] delete session failed:', err);
      }
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    setActiveSessionId(null);
    setCurrentConversationId(null);
    setShowPreviousChatsModal(false);
  };

  // Group previous chats by dayGroup and insert line separators between days
  const filteredSessions = previousSessions.filter((s) => {
    const matchesQuery = s.title.toLowerCase().includes(searchQuery.toLowerCase());
    if (filterCategory === "All") return matchesQuery;
    return matchesQuery && s.dayGroup.toLowerCase() === filterCategory.toLowerCase();
  });

  // Unique day groups in order of occurrence
  const dayGroupsOrder = Array.from(new Set(filteredSessions.map((s) => s.dayGroup)));

  return (
    <div className="flex-1 h-full flex bg-white overflow-hidden select-text font-sans">
      {/* 100% Full Width Column */}
      <div className="w-full h-full flex flex-col relative bg-white overflow-hidden">
        

        {/* Main Content / Briefing Area */}
        <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 flex flex-col">
          {messages.length === 0 ? (
            <div className="w-full max-w-[1178px] mx-auto flex flex-col">
              {/* TOP PART: Unified Intelligence Briefing / Single Answer Format */}
              <div className="w-full flex flex-col mb-2 animate-fadeIn space-y-6 pb-6">
                {/* Highlights Header */}
                <div className="flex items-center justify-between">
                  <h2 className="text-[14.5px] font-normal text-black tracking-tight font-serif">
                    Latest Highlights & Intelligence Briefing
                  </h2>
                </div>

                {/* Unified Conversational Answer Card */}
                <div className="bg-white border border-zinc-200/90 rounded-[10px] p-5 md:p-6 shadow-2xs space-y-5 text-black font-normal leading-relaxed tracking-normal">
                  {highlightsLoading ? (
                    <div className="py-8 flex items-center justify-center gap-2 text-xs text-zinc-400">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-[#2d39d2]" />
                      <span>Loading highlights…</span>
                    </div>
                  ) : !hasAnyHighlightsData ? (
                    <p className="text-[13px] text-black font-normal leading-relaxed tracking-normal">
                      No highlights available yet. They appear after the next scheduled update.
                    </p>
                  ) : (
                    <>
                      {/* Introduction */}
                      {dailyHighlights?.intro && (
                        <div className="space-y-3">
                          {dailyHighlights.intro
                            .split(/\n\s*\n/)
                            .map((p) => p.trim())
                            .filter(Boolean)
                            .map((paragraph, pIdx) => (
                              <p
                                key={pIdx}
                                className="text-[13px] text-black font-normal leading-relaxed tracking-normal"
                              >
                                {paragraph}
                              </p>
                            ))}
                        </div>
                      )}

                      {/* Intelligence Summary by Module */}
                      <div className="space-y-8 pt-4">
                        {BRIEFING_MODULES.map((module) => {
                          const moduleHighlight = dailyHighlights?.highlights?.find(
                            (h) => h.module_id === module.id
                          );
                          const highlightText = moduleHighlight?.highlight_text || "";
                          const paragraphs = highlightText
                            ? highlightText.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean)
                            : [];

                          const cards = moduleCards[module.id]?.cards ?? [];
                          const loose = moduleCards[module.id]?.loose ?? [];
                          const totalItems = moduleCards[module.id]?.total ?? (cards.length + loose.length);
                          const isCardsExpanded = !!showAllCards[module.id];

                          const visibleCards = isCardsExpanded ? cards : cards.slice(0, 4);
                          const remainingSlots = isCardsExpanded ? loose.length : Math.max(0, 4 - cards.length);
                          const visibleLoose = isCardsExpanded ? loose : loose.slice(0, remainingSlots);

                          const hasHighlightText = paragraphs.length > 0;
                          const hasSignalRows = cards.length > 0 || loose.length > 0;

                          if (!hasHighlightText && !hasSignalRows) return null;

                          const badge = getSourceBadge(module.name);
                          const IconComp = badge.icon;

                          return (
                            <div key={module.id} className="space-y-3">
                              <h3 className="text-[11.5px] font-medium text-black uppercase tracking-widest font-sans">
                                {module.name} Highlights
                                {moduleHighlight?.signal_date && (
                                  <span className="text-zinc-500 font-normal normal-case tracking-normal ml-1.5">
                                    · {formatSignalDate(moduleHighlight.signal_date)}
                                  </span>
                                )}
                              </h3>
                              {hasHighlightText && (
                                <div className="text-[13px] text-black font-normal leading-relaxed tracking-normal space-y-3">
                                  {paragraphs.map((paragraph, pIdx) => (
                                    <p key={pIdx}>{paragraph}</p>
                                  ))}
                                </div>
                              )}

                              {hasSignalRows && (
                                <div className="border border-zinc-200/90 rounded-[8px] bg-white overflow-hidden shadow-2xs">
                                  <table className="w-full text-left border-collapse">
                                    <tbody className="divide-y divide-zinc-100 text-black">
                                      {visibleCards.map((card) => {
                                        const cardKey = `${module.id}-${card.id}`;
                                        const isOpen = !!expandedCards[cardKey];
                                        const toggle = () =>
                                          setExpandedCards((prev) => ({ ...prev, [cardKey]: !prev[cardKey] }));
                                        return (
                                          <React.Fragment key={cardKey}>
                                            <tr
                                              onClick={toggle}
                                              className="hover:bg-zinc-50/80 transition-colors cursor-pointer"
                                            >
                                              <td className="py-2.5 px-3.5 align-middle">
                                                <div className="text-[12px] text-black font-normal">{card.title}</div>
                                              </td>
                                              <td className="py-2.5 px-3.5 align-middle text-right whitespace-nowrap">
                                                <div className="flex items-center justify-end gap-2">
                                                  {card.tag && (
                                                    <span className="text-[9.5px] font-medium text-zinc-600">{card.tag}</span>
                                                  )}
                                                  <span
                                                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] border text-[9.5px] font-medium shrink-0 ${badge.bg}`}
                                                  >
                                                    <IconComp className="w-2.5 h-2.5 shrink-0" />
                                                    <span className="whitespace-nowrap">{module.name}</span>
                                                  </span>
                                                  <button
                                                    type="button"
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      toggle();
                                                    }}
                                                    className="p-0.5 text-zinc-400 hover:text-zinc-600 cursor-pointer"
                                                  >
                                                    {isOpen ? (
                                                      <MinusCircle className="w-4 h-4" />
                                                    ) : (
                                                      <PlusCircle className="w-4 h-4" />
                                                    )}
                                                  </button>
                                                </div>
                                              </td>
                                            </tr>
                                            {isOpen &&
                                              card.signals.map((sig) => (
                                                <tr
                                                  key={sig.id}
                                                  onClick={() => handleSignalClick(module.id, sig)}
                                                  className="bg-zinc-50/50 hover:bg-zinc-100/60 transition-colors cursor-pointer"
                                                >
                                                  <td className="py-2 px-3.5 pl-8 align-middle">
                                                    <div className="text-[11.5px] text-black font-normal">{sig.title}</div>
                                                  </td>
                                                  <td className="py-2 px-3.5 align-middle text-right whitespace-nowrap">
                                                    <div className="flex items-center justify-end gap-2">
                                                      {sig.tag && (
                                                        <span
                                                          className={`inline-flex items-center px-2 py-0.5 rounded-[4px] text-[9.5px] font-medium shrink-0 ${getMainCategoryTagClass(
                                                            sig.tag
                                                          )}`}
                                                        >
                                                          {sig.tag}
                                                        </span>
                                                      )}
                                                    </div>
                                                  </td>
                                                </tr>
                                              ))}
                                          </React.Fragment>
                                        );
                                      })}
                                      {visibleLoose.map((sig) => (
                                        <tr
                                          key={sig.id}
                                          onClick={() => handleSignalClick(module.id, sig)}
                                          className="hover:bg-zinc-50/80 transition-colors cursor-pointer"
                                        >
                                          <td className="py-2.5 px-3.5 align-middle">
                                            <div className="text-[12px] text-black font-normal">{sig.title}</div>
                                          </td>
                                          <td className="py-2.5 px-3.5 align-middle text-right whitespace-nowrap">
                                            <div className="flex items-center justify-end gap-2">
                                              {sig.tag && (
                                                <span className="text-[9.5px] font-medium text-zinc-600">{sig.tag}</span>
                                              )}
                                              <span
                                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] border text-[9.5px] font-medium shrink-0 ${badge.bg}`}
                                              >
                                                <IconComp className="w-2.5 h-2.5 shrink-0" />
                                                <span className="whitespace-nowrap">{module.name}</span>
                                              </span>
                                            </div>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                  {totalItems > 4 && (
                                    <div className="border-t border-zinc-100 px-3.5 py-2 bg-zinc-50/40">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setShowAllCards((prev) => ({
                                            ...prev,
                                            [module.id]: !prev[module.id],
                                          }))
                                        }
                                        className="text-[11.5px] font-medium text-zinc-600 hover:text-zinc-900 transition-colors cursor-pointer"
                                      >
                                        {isCardsExpanded ? "Show less" : "Show more"}
                                      </button>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Conclusion */}
                      {dailyHighlights?.conclusion && (
                        <div className="border-t border-zinc-200 pt-6 mt-6 space-y-3">
                          {dailyHighlights.conclusion
                            .split(/\n\s*\n/)
                            .map((p) => p.trim())
                            .filter(Boolean)
                            .map((paragraph, pIdx) => (
                              <p
                                key={pIdx}
                                className="text-[13px] text-black font-normal leading-relaxed tracking-normal"
                              >
                                {paragraph}
                              </p>
                            ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="w-full max-w-[1178px] mx-auto flex flex-col gap-6 py-4">
              {messages.map((msg, msgIndex) => (
                <div
                  key={msg.id}
                  className={`flex ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >

                  <div
                    className={`max-w-[92%] rounded-[10px] px-4 py-3 text-[13px] leading-relaxed tracking-normal ${
                      msg.role === "user"
                        ? "bg-[#f3f3f4] text-zinc-900 border border-zinc-200/70 font-sans"
                        : "bg-white border border-zinc-200/80 text-black shadow-2xs w-full font-normal"
                    }`}
                  >
                    {msg.heading && (
                      <h3 className="text-[14.5px] font-semibold text-zinc-900 mb-2.5 font-serif border-b border-zinc-200/80 pb-2">
                        {msg.heading}
                      </h3>
                    )}

                    {msg.role === "user" ? (
                      <div className="whitespace-pre-wrap">{msg.text}</div>
                    ) : !msg.isStreaming && msg.report ? (
                      <ReportView
                        report={msg.report as any}
                        sources={msg.reportSources}
                        chart={msg.chartBase64}
                        chartMeta={msg.chartMeta}
                        onSourceClick={handleSourceOpen}
                      />
                    ) : (
                      <div className="markdown-body text-[13px] leading-relaxed text-black space-y-2.5 font-normal tracking-normal">
                        <Markdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            h1: ({ children }) => (
                              <h1 className="text-[15.5px] font-semibold text-zinc-900 mt-4 mb-2 font-serif border-b border-zinc-200/80 pb-1.5">
                                {children}
                              </h1>
                            ),
                            h2: ({ children }) => (
                              <h2 className="text-[14.5px] font-semibold text-zinc-900 mt-3.5 mb-1.5 font-serif border-b border-zinc-200/60 pb-1">
                                {children}
                              </h2>
                            ),
                            h3: ({ children }) => (
                              <h3 className="text-[14px] font-semibold text-zinc-900 mt-4 mb-2 font-serif border-b border-zinc-200/80 pb-1.5">
                                {children}
                              </h3>
                            ),
                            h4: ({ children }) => (
                              <h4 className="text-[13.5px] font-semibold text-zinc-900 mt-3.5 mb-1.5 font-serif">
                                {children}
                              </h4>
                            ),
                            h5: ({ children }) => (
                              <h5 className="text-[13px] font-semibold text-zinc-900 mt-2.5 mb-1 font-serif">
                                {children}
                              </h5>
                            ),
                            h6: ({ children }) => (
                              <h6 className="text-[12.5px] font-semibold text-zinc-900 mt-2 mb-1 font-serif">
                                {children}
                              </h6>
                            ),
                            p: ({ children }) => <p className="mb-1.5 last:mb-0 text-[13px] leading-relaxed text-black font-normal tracking-normal">{children}</p>,
                            ul: ({ children }) => (
                              <ul className="list-disc pl-5 my-2 space-y-1 text-[13px] leading-relaxed text-black font-normal tracking-normal">{children}</ul>
                            ),
                            ol: ({ children }) => (
                              <ol className="list-decimal pl-5 my-2 space-y-1 text-[13px] leading-relaxed text-black font-normal tracking-normal">{children}</ol>
                            ),
                            li: ({ children }) => (
                              <li className="leading-relaxed text-[13px] py-0.5 text-black font-normal tracking-normal">{children}</li>
                            ),
                            a: ({ href, children }) => (
                              <a
                                href={href || "#"}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => {
                                  if (!href || href === "#") {
                                    e.preventDefault();
                                  }
                                }}
                                className="text-[#2d2f36] hover:text-[#2d39d2] font-medium transition-colors hover:underline decoration-zinc-300"
                              >
                                {children}
                              </a>
                            ),
                            strong: ({ children }) => <strong className="font-semibold text-zinc-900">{children}</strong>,
                            em: ({ children }) => <em className="italic text-zinc-600">{children}</em>,
                            table: ({ children }) => (
                              <div className="my-3 overflow-x-auto rounded-[6px] border border-zinc-200 shadow-2xs">
                                <table className="w-full text-left text-[12px] border-collapse bg-white">
                                  {children}
                                </table>
                              </div>
                            ),
                            thead: ({ children }) => (
                              <thead className="bg-zinc-100/90 border-b border-zinc-200 text-zinc-900 font-semibold uppercase text-[10px] tracking-wider">
                                {children}
                              </thead>
                            ),
                            tbody: ({ children }) => (
                              <tbody className="divide-y divide-zinc-200/70 text-black text-[13px] font-normal leading-relaxed tracking-normal">{children}</tbody>
                            ),
                            tr: ({ children }) => (
                              <tr className="hover:bg-zinc-50/80 transition-colors">{children}</tr>
                            ),
                            th: ({ children }) => <th className="px-3.5 py-2.5 font-semibold text-zinc-900">{children}</th>,
                            td: ({ children }) => <td className="px-3.5 py-2.5 text-black font-normal text-[13px] leading-relaxed tracking-normal">{children}</td>,
                            blockquote: ({ children }) => (
                              <blockquote className="border-l-3 border-[#2d39d2] pl-3 py-1 my-2 text-black bg-purple-50/50 rounded-r-[4px] text-[13px] font-normal leading-relaxed tracking-normal">
                                {children}
                              </blockquote>
                            ),
                            code: ({ inline, className, children, ...props }: any) => {
                              const match = /language-chart/.exec(className || "");
                              if (!inline && match) {
                                try {
                                  const parsed = JSON.parse(String(children).trim());
                                  return (
                                    <DecisionChart
                                      title={parsed.title}
                                      type={parsed.type}
                                      data={parsed.data}
                                      dataKey={parsed.dataKey || "value"}
                                      unit={parsed.unit || "%"}
                                    />
                                  );
                                } catch (e) {
                                  // fallback
                                }
                              }
                              return (
                                <code className={`${className || ""} bg-zinc-100 text-zinc-800 px-1.5 py-0.5 rounded text-[12px] font-mono`} {...props}>
                                  {children}
                                </code>
                              );
                            },
                          }}
                        >
                          {msg.text}
                        </Markdown>
                        {msg.isStreaming && (
                          <span className="inline-block w-1.5 h-3.5 bg-[#2d39d2] animate-pulse ml-0.5 align-middle rounded-[1px]" />
                        )}
                      </div>
                    )}

                    {msg.linkInfo && (
                      <div className="mt-3.5 pt-3 border-t border-zinc-200/80 flex items-center justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            if (onTabChange) {
                              (onTabChange as any)(msg.linkInfo!.tabId, (msg.linkInfo as any).signalId);
                            } else if (onReturn) {
                              onReturn();
                            }
                          }}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-purple-50 hover:bg-purple-100 text-[#2d39d2] border border-purple-200/80 rounded-[6px] text-[12px] font-medium font-sans transition-colors cursor-pointer shadow-2xs"
                        >
                          <span>Read more in {msg.linkInfo.tabLabel}</span>
                          <ArrowUp className="w-3.5 h-3.5 rotate-45" />
                        </button>
                      </div>
                    )}

                    {msg.listItems && msg.listItems.length > 0 && (
                      <div className="mt-3 flex flex-col border border-zinc-200/80 rounded-[6px] bg-white divide-y divide-zinc-200/80 overflow-hidden shadow-2xs">
                        {msg.listItems.map((item, idx) => {
                          const itemKey = item.id || `${msg.id}-${idx}`;

                          const categoryTag = item.category && item.category.trim() !== "" && item.category !== "General / Signal" ? item.category : null;
                          const impactTag = item.impact && item.impact.trim() !== "" && item.impact !== "Enabled" ? item.impact : null;

                          return (
                            <div
                              key={itemKey}
                              className="flex items-center justify-between gap-4 py-2 px-3.5 hover:bg-zinc-50/70 transition-colors group/row"
                            >
                              <span className="text-[13px] text-black font-normal leading-relaxed tracking-normal group-hover/row:text-zinc-950">
                                {item.title}
                              </span>

                              {(categoryTag || impactTag) && (
                                <div className="flex items-center gap-3 shrink-0">
                                  {categoryTag && (
                                    <span className="border border-zinc-200/90 bg-white px-2.5 py-0.5 rounded-[6px] text-[9.2px] text-zinc-800 font-light whitespace-nowrap">
                                      {categoryTag}
                                    </span>
                                  )}
                                  {impactTag && (
                                    <span className="bg-[#ecfdf5] text-[#065f46] px-2.5 py-0.5 rounded-[4px] text-[9.2px] font-light whitespace-nowrap">
                                      {impactTag}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {(msg as any).noDataSuggestions && (msg as any).noDataSuggestions.length > 0 && (
                      <div className="mt-3 flex flex-col gap-2">
                        {((msg as any).noDataSuggestions as string[]).map((suggestion, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleSend(suggestion)}
                            className="text-left w-full bg-white border border-[#2d39d2]/60 rounded-[4px] p-2.5 hover:border-[#2d39d2] hover:bg-purple-50/20 transition-all cursor-pointer group/card"
                          >
                            <p className="text-[12px] font-sans text-zinc-800 font-medium group-hover/card:text-[#2d39d2] leading-snug">
                              {suggestion}
                            </p>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Chart and sources are now rendered inside ReportView when a report is present.
                        The blocks below only run for non-report model messages (e.g. legacy rows
                        or the List item-detail flow), preserving backward compatibility. */}
                    {msg.role === "model" && !msg.report && msg.chartBase64 && (
                      <div className="mt-3 pt-3 border-t border-zinc-200/60">
                        <div className="text-[11.5px] font-semibold text-zinc-700 mb-2 flex items-center gap-1.5">
                          <BarChart2 className="w-3.5 h-3.5 text-[#2d39d2]" />
                          <span>
                            {msg.chartMeta?.chartType
                              ? `${msg.chartMeta.chartType.charAt(0).toUpperCase() + msg.chartMeta.chartType.slice(1)} Chart`
                              : "Chart"}
                          </span>
                        </div>
                        <img
                          src={`data:image/png;base64,${msg.chartBase64}`}
                          alt="Data visualization"
                          className="w-full max-w-lg rounded-[4px] border border-zinc-200 bg-white"
                        />
                      </div>
                    )}

                    {msg.role === "model" && !msg.report && msg.sources && msg.sources.length > 0 && (
                      <div className="mt-3 pt-2.5 border-t border-zinc-200/60">
                        <ChatSources sources={msg.sources} />
                      </div>
                    )}

                    {msg.role === "model" && (
                      <div className="mt-2.5 pt-2 border-t border-zinc-200/40 flex items-center justify-end gap-2 text-zinc-400">
                        {savedMessageIds[msg.id] && (
                          <span className="text-[10px] text-amber-700 font-sans font-medium mr-1 animate-pulse">
                            Saved to workspace
                          </span>
                        )}
                        {sharedMessageIds[msg.id] && (
                          <span className="text-[10px] text-emerald-600 font-sans font-medium mr-1">
                            Copied!
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => handleSaveMessage(msg.id)}
                          className={`p-1 hover:bg-zinc-200/50 rounded transition-colors cursor-pointer flex items-center justify-center group relative ${
                            savedMessageIds[msg.id] ? "text-amber-600" : "hover:text-zinc-700"
                          }`}
                          aria-label="Save answer"
                        >
                          <Bookmark className={`w-3.5 h-3.5 ${savedMessageIds[msg.id] ? "fill-amber-600" : ""}`} />
                          <span className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-zinc-900 text-white text-[9px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                            {savedMessageIds[msg.id] ? "Saved" : "Save answer"}
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleShareMessage(msg.id, msg.text)}
                          className={`p-1 hover:bg-zinc-200/50 rounded transition-colors cursor-pointer flex items-center justify-center group relative ${
                            sharedMessageIds[msg.id] ? "text-emerald-600" : "hover:text-zinc-700"
                          }`}
                          aria-label="Share answer"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                          <span className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-zinc-900 text-white text-[9px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                            {sharedMessageIds[msg.id] ? "Copied!" : "Share answer"}
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDownloadPDF(msg.id, msg.text, msgIndex)}
                          className="p-1 hover:bg-zinc-200/50 rounded transition-colors cursor-pointer flex items-center justify-center group relative hover:text-[#2d39d2]"
                          aria-label="Download report PDF"
                        >
                          <FileDown className="w-3.5 h-3.5" />
                          <span className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-zinc-900 text-white text-[9px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 font-sans">
                            Download PDF
                          </span>
                        </button>
                      </div>
                    )}
                  </div>


                </div>
              ))}

              {loading && !messages.some((m) => m.isStreaming) && (
                <div className="flex justify-start">

                  <div className="bg-white border border-zinc-200/80 rounded-[6px] px-4 py-3 text-xs text-zinc-600 flex items-center gap-2.5">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-400 shrink-0" />
                    <span 
                      key={loadingStageIndex}
                      className="text-shimmer font-medium tracking-normal transition-all duration-300"
                    >
                      {STAGED_LOADING_MESSAGES[loadingStageIndex]}
                    </span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
        {/* Sticky Bottom Bar with Reduced Size CTA & Disclaimer */}
        <div className="shrink-0 w-full bg-white/95 backdrop-blur-xs px-4 md:px-8 py-2.5 z-20">
          <div className="w-full max-w-[1178px] mx-auto flex flex-col">
            <div className="w-full flex justify-end">
              <div className="flex items-center gap-3.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-[#e0e5fc] flex items-center justify-center shrink-0">
                    <MessageCircle className="w-3.5 h-3.5 text-[#2d39d2] stroke-[2.2]" />
                  </div>
                  <div className="text-left">
                    <div className="text-[12.5px] font-semibold text-zinc-900 tracking-tight leading-tight font-sans">
                      Have a question about today’s briefing?
                    </div>
                    <div className="text-[10.5px] text-zinc-500 font-normal leading-tight font-sans">
                      Turn these signals into a decision.
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => onTabChange && onTabChange("decision_intelligence")}
                  className="inline-flex items-center gap-1.5 bg-[#2d39d2] hover:bg-[#242ea8] text-white text-[11.5px] font-medium px-3.5 py-1.5 rounded-[6px] shadow-2xs transition-all cursor-pointer font-sans shrink-0"
                >
                  <span>Ask Decision Intelligence</span>
                  <ArrowRight className="w-3.5 h-3.5 stroke-[2.2]" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Large Popup Overlay for Previous Chats */}
      {showPreviousChatsModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-50 flex items-center justify-center p-4 md:p-8 animate-fadeIn">
          <div className="bg-white border border-zinc-200/90 rounded-[4px] shadow-2xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden font-sans">
            
            {/* Modal Header */}
            <div className="px-6 py-3.5 border-b border-zinc-100 flex flex-wrap items-center justify-between gap-4 shrink-0 bg-white">
              <h2 className="text-xl md:text-2xl font-sans font-medium text-zinc-900 tracking-tight">
                Chats
              </h2>

              <div className="flex items-center flex-wrap gap-3">
                {/* Search input */}
                <div className="relative flex items-center">
                  <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search chats..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 pr-3 py-1.5 text-[11px] font-sans bg-zinc-50 border border-zinc-200 rounded-[4px] focus:outline-none focus:border-zinc-400 text-zinc-800 w-64 md:w-96 transition-all"
                  />
                </div>

                {/* Filter dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-sans bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded-[4px] text-zinc-700 transition-colors cursor-pointer"
                  >
                    <span>Filter by <strong className="font-semibold text-zinc-900">{filterCategory}</strong></span>
                    <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
                  </button>

                  {showFilterDropdown && (
                    <div className="absolute right-0 mt-1 w-36 bg-white border border-zinc-200 rounded-[4px] shadow-lg py-1 z-20">
                      {["All", "Today", "Yesterday", "2 days ago", "3 days ago"].map((cat) => (
                        <button
                          key={cat}
                          onClick={() => {
                            setFilterCategory(cat);
                            setShowFilterDropdown(false);
                          }}
                          className={`w-full text-left px-3 py-1.5 text-[11px] font-sans transition-colors cursor-pointer ${
                            filterCategory === cat
                              ? "bg-zinc-100 text-zinc-900 font-medium"
                              : "text-zinc-700 hover:bg-zinc-50"
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Close modal X button */}
                <button
                  onClick={() => setShowPreviousChatsModal(false)}
                  className="p-1.5 text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100 rounded-[4px] transition-colors ml-1 cursor-pointer"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>
            </div>

            {/* Modal Body / Chat Sessions List */}
            <div className="flex-1 overflow-y-auto px-6 py-2">
              {dayGroupsOrder.length === 0 ? (
                <div className="text-center py-12 text-zinc-400 text-[11px] font-sans">
                  No previous chats found matching "{searchQuery}".
                </div>
              ) : (
                dayGroupsOrder.map((groupName, gIdx) => {
                  const groupItems = filteredSessions.filter((s) => s.dayGroup === groupName);
                  return (
                    <div key={groupName}>
                      {/* Line separator between each day */}
                      {gIdx > 0 && (
                        <div className="py-1">
                          <div className="border-t border-[#2d39d2] w-full" />
                        </div>
                      )}

                      {/* Day Group Items List */}
                      <div className="divide-y divide-zinc-100">
                        {groupItems.map((chat) => {
                          return (
                            <div
                              key={chat.id}
                              className={`group relative flex items-center justify-between px-3 h-9 rounded-[4px] transition-all my-0.5 ${
                                pendingDeleteId === chat.id
                                  ? "bg-red-50/70 border border-red-200/80 shadow-xs"
                                  : "hover:bg-zinc-50 border border-transparent"
                              }`}
                            >
                              <button
                                onClick={() => handleSelectSession(chat)}
                                className="flex-1 text-left flex items-center min-w-0 pr-3 h-full cursor-pointer"
                              >
                                <span
                                  className={`text-[11px] md:text-[12px] font-sans truncate ${
                                    pendingDeleteId === chat.id
                                      ? "text-red-950 font-medium"
                                      : "text-zinc-800 group-hover:text-black font-normal"
                                  }`}
                                >
                                  {chat.title}
                                </span>
                              </button>

                              {pendingDeleteId === chat.id ? (
                                <div className="flex items-center gap-2 shrink-0 pl-2">
                                  <span className="text-[11px] font-medium text-red-700 font-sans hidden sm:inline">
                                    Delete chat?
                                  </span>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteSession(chat.id);
                                      setPendingDeleteId(null);
                                    }}
                                    className="px-2.5 py-1 text-[10px] font-semibold font-sans bg-red-600 text-white rounded-[4px] hover:bg-red-700 transition-colors shadow-xs cursor-pointer leading-none"
                                  >
                                    Delete
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setPendingDeleteId(null);
                                    }}
                                    className="px-2.5 py-1 text-[10px] font-medium font-sans bg-white text-zinc-700 border border-zinc-200 rounded-[4px] hover:bg-zinc-100 hover:text-zinc-900 transition-colors cursor-pointer leading-none"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2 shrink-0">
                                  <span className="text-[10px] text-zinc-400 font-sans whitespace-nowrap text-right">
                                    {chat.displayTime}
                                  </span>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setPendingDeleteId(chat.id);
                                    }}
                                    className="opacity-0 group-hover:opacity-100 p-1 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-[4px] transition-all cursor-pointer flex items-center justify-center"
                                    title="Delete chat"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

          </div>
        </div>
      )}

      {/* Large Popup Overlay for Question Library */}
      {showQuestionLibraryModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-50 flex items-center justify-center p-4 md:p-8 animate-fadeIn">
          <div className="bg-white border border-zinc-200/90 rounded-[4px] shadow-2xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden font-sans">
            
            {/* Modal Header */}
            <div className="px-6 py-3.5 border-b border-zinc-100 flex flex-wrap items-center justify-between gap-4 shrink-0 bg-white">
              <div>
                <h2 className="text-xl md:text-2xl font-sans font-medium text-zinc-900 tracking-tight">
                  Question Library
                </h2>
                <p className="text-[11px] text-zinc-500 font-sans mt-0.5">
                  Select a question to evaluate decision pathways, market inferences, or strategic lists.
                </p>
              </div>

              <div className="flex items-center gap-3">
                {/* Search input */}
                <div className="relative flex items-center">
                  <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search library..."
                    value={librarySearchQuery}
                    onChange={(e) => setLibrarySearchQuery(e.target.value)}
                    className="pl-8 pr-3 py-1.5 text-[11px] font-sans bg-zinc-50 border border-zinc-200 rounded-[4px] focus:outline-none focus:border-[#2d39d2] text-zinc-800 w-48 md:w-64 transition-all"
                  />
                </div>

                {/* Close X Button */}
                <button
                  onClick={() => setShowQuestionLibraryModal(false)}
                  className="p-1.5 text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100 rounded-[4px] transition-colors ml-1 cursor-pointer"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>
            </div>

            {/* 3 Categorized Tabs Header */}
            <div className="px-6 border-b border-zinc-100 bg-zinc-50/50 flex items-center gap-2 shrink-0 pt-2">
              {(["Decision Intelligence", "Inference", "List"] as const).map((tab) => {
                const isActive = selectedLibraryTab === tab;
                const count = libraryQuestions.filter((q) => q.category === tab).length;
                return (
                  <button
                    key={tab}
                    onClick={() => setSelectedLibraryTab(tab)}
                    className={`px-4 py-2 text-[12px] font-sans font-medium transition-all border-b-2 cursor-pointer flex items-center gap-2 ${
                      isActive
                        ? "border-[#2d39d2] text-[#2d39d2] bg-white rounded-t-[4px]"
                        : "border-transparent text-zinc-500 hover:text-zinc-800 hover:border-zinc-200"
                    }`}
                  >
                    <span>{tab}</span>
                    <span className={`px-1.5 py-0.2 text-[10px] rounded-full ${isActive ? "bg-[#2d39d2]/10 text-[#2d39d2]" : "bg-zinc-200/60 text-zinc-600"}`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Modal Body / Questions List */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {(() => {
                if (libraryQuestions.length === 0) {
                  return (
                    <div className="text-center py-12 text-zinc-400 text-[11px] font-sans">
                      Loading questions…
                    </div>
                  );
                }

                const filtered = libraryQuestions.filter((q) => {
                  const matchesTab = q.category === selectedLibraryTab;
                  const matchesSearch =
                    q.question.toLowerCase().includes(librarySearchQuery.toLowerCase()) ||
                    q.title.toLowerCase().includes(librarySearchQuery.toLowerCase());
                  return matchesTab && matchesSearch;
                });

                if (filtered.length === 0) {
                  return (
                    <div className="text-center py-12 text-zinc-400 text-[11px] font-sans">
                      No questions found matching "{librarySearchQuery}" in {selectedLibraryTab}.
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {filtered.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => {
                          setShowQuestionLibraryModal(false);
                          handleSend(item.question);
                        }}
                        className="p-2.5 border border-zinc-200/90 hover:border-[#2d39d2] rounded-[4px] bg-white hover:bg-purple-50/20 transition-all cursor-pointer group flex flex-col justify-center"
                      >
                        <div>
                          <span className="text-[10px] font-sans font-medium text-[#2d39d2] uppercase tracking-wider">
                            {item.title}
                          </span>
                          <p className="text-[12px] font-sans text-zinc-800 font-medium group-hover:text-black mt-0.5 leading-snug">
                            "{item.question}"
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

