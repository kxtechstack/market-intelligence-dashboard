import React, { useState, useEffect, useMemo, useRef } from "react";
import { Sparkles, Bookmark, Share2, FileText, Send, Loader2, ArrowUpRight, AlertTriangle, Minus, ArrowDownRight, Pencil, Check, ArrowUp, ArrowRight, ArrowDown, Square, Trash2, CornerDownLeft } from "lucide-react";
import { supabase } from "../lib/supabase";
import { RADAR_TRENDS, TrendItem, SourceItem } from "./ForewardOutlookPane";
import { ChatSources } from "./ChatSources";
import { MARKET_DYNAMICS_MODULE_ID, API_URL } from "../constants";

interface MarketDynamicsPaneProps {
  onReturn: () => void;
  clientId: string;
  industry: string;
  userId: string;
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

const SUBMODULE_SUMMARIES: Record<string, string> = {
  "FUNDING & INVESTMENT ACTIVITY": "Accelerating: third consecutive week of growth, concentrated in two sectors. Transaction volumes remain elevated with substantial support from late-stage growth rounds.",
  "FUNDING & INVESTMENT": "Accelerating: third consecutive week of growth, concentrated in two sectors. Transaction volumes remain elevated with substantial support from late-stage growth rounds.",
  "INDUSTRY STRUCTURE": "Emerging: early consolidation signals, worth monitoring not yet acting on. Minor mergers and strategic repositioning indicate potential sector consolidation over the next fiscal cycle.",
  "TALENT MOVEMENT": "Accelerating: turnover concentrated at two firms, both also flagged under structure. Executive migrations are creating specialized clusters of expertise in risk and operational management.",
  "MACRO & ECONOMIC": "Stable: no material change, low near-term relevance to client positioning. Macro indicators and central bank policy adjustments are currently maintaining historical ranges without disruption.",
  "TECH ADOPTION": "Cooling: adoption announcements slowed after a strong prior quarter. Customers are shifting focus from rapid experimentation to optimizing and scaling existing tool deployments."
};

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

const SIGNAL_DETAILS: Record<string, SignalDetailData> = {
  "Scalp-serum brands are pulling most new category funding": {
    title: "Scalp-serum brands are pulling most new category funding",
    category: "Funding & investment",
    sector: "Funding & investment",
    term: "Near-Term",
    impact_level: "High",
    confidence: "High",
    summary: "The clinical scalp-care and hair-health segment is experiencing an unprecedented venture capital influx, capturing 3 out of 4 new funding rounds this quarter. Investors are actively moving away from traditional cosmetic styling formulations, prioritizing dermatologist-backed claims and efficacy-proven scalp health positioning. This shift highlights a broader consumer migration toward wellness-oriented personal care ecosystems where scalp care is treated with the same clinical rigor as skincare.",
    business_impact: [
      "R&D departments must reprioritize formulation pipelines toward clinical scalp and root health solutions.",
      "Marketing campaigns should emphasize dermatological backing and clinical claim validation to command premium pricing.",
      "M&A teams should actively monitor early-stage scalp-health indie brands for potential acquisition before valuations peak."
    ],
    sources: [
      {
        id: "ss-s1",
        source_name: "Cosmetic Venture Registry",
        details: "Analysis of early-stage beauty investments showing a 75% concentration in active scalp-health startups.",
        category: "Capital investment",
        date: "Jul 18"
      },
      {
        id: "ss-s2",
        source_name: "Dermatological Formulation Journal",
        details: "Clinical efficacy studies on peptide-infused scalp serums indicating superior hair retention metrics.",
        category: "Research & Development",
        date: "Jun 29"
      }
    ],
    country: "Global"
  },
  "Series B round closed for eco-friendly packaging pioneer": {
    title: "Series B round closed for eco-friendly packaging pioneer",
    category: "Funding & investment",
    sector: "Funding & investment",
    term: "Mid-Term",
    impact_level: "High",
    confidence: "High",
    summary: "A major packaging innovator secured a $15M Series B round to scale its bio-degradable polymer formulation facilities. This capital injection will allow for high-volume commercial production of zero-plastic, compostable cosmetic containers, directly addressing rising corporate demand for plastic-neutral packaging solutions ahead of upcoming European environmental compliance mandates.",
    business_impact: [
      "Secures long-term supply contracts with sustainable packaging suppliers before production capacity tightens.",
      "Accelerates transition of hero product lines to certified biodegradable containers to elevate brand ESG credentials.",
      "Helps meet upcoming regional plastic-use reduction targets ahead of regulatory deadlines."
    ],
    sources: [
      {
        id: "ep-s1",
        source_name: "GreenTech Venture Capital",
        details: "Official closing of $15M Series B funding round for EcoPack Solutions.",
        category: "Capital investment",
        date: "Jul 12"
      },
      {
        id: "ep-s2",
        source_name: "Sustainable Materials Gazette",
        details: "Comparative lifecycle assessment of bio-degradable polymer formulations showing 90% reduction in carbon footprint.",
        category: "Research & Development",
        date: "Jul 02"
      },
      {
        id: "ep-s4",
        source_name: "Retail Packaging Review",
        details: "Brand survey showing 82% of premium cosmetics executives are actively sourcing plastic alternative packaging.",
        category: "Innovation",
        date: "May 20"
      },
      {
        id: "ep-s5",
        source_name: "European ESG Compliance Audit",
        details: "New directives penalizing non-recyclable multi-layered flexible cosmetic tubes by late next fiscal year.",
        category: "Innovation",
        date: "Apr 11"
      }
    ],
    country: "Global"
  },
  "Private-label is closing the formulation gap": {
    title: "Private-label is closing the formulation gap",
    category: "Industry structure",
    sector: "Industry structure",
    term: "Near-Term",
    impact_level: "Medium",
    confidence: "Medium",
    summary: "Two major retail giants have successfully launched private-label, sulfate-free personal care lines at price points 40% below national brands. As advanced ingredient alternatives become commoditized, the formulation barrier to entry has significantly dropped. Brands can no longer rely solely on basic 'clean' ingredients as a defensive moat; true clinical efficacy, brand equity, and proprietary technologies are now required to maintain pricing power.",
    business_impact: [
      "Requires brands to invest in proprietary, patented ingredient complexes to distinguish themselves from private-label alternatives.",
      "Drives the need for personalized digital skincare diagnostics to create high-friction customer loyalty loops.",
      "Exerts downward pricing pressure on standard clean-beauty formulas lacking clinical backing."
    ],
    sources: [
      {
        id: "pl-s1",
        source_name: "Retail Intelligence Monthly",
        details: "Market share analysis of premium own-brand personal care launches in major chains.",
        category: "Innovation",
        date: "Jul 05"
      },
      {
        id: "pl-s2",
        source_name: "Formulation Outsourcing Registry",
        details: "Data showing 35% increase in private-label contract manufacturing volume for clinical-grade serums.",
        category: "Capital investment",
        date: "Jun 22"
      },
      {
        id: "pl-s3",
        source_name: "Consumer Pricing Index Survey",
        details: "Over 64% of respondents report willingness to purchase retailer-owned private label clinical skincare if ingredients match premium brands.",
        category: "Innovation",
        date: "Jun 10"
      }
    ],
    country: "Global"
  },
  "A competitor's Chief Innovation Officer departed after delayed launches": {
    title: "A competitor's Chief Innovation Officer departed after delayed launches",
    category: "Talent movement",
    sector: "Talent movement",
    term: "Near-Term",
    impact_level: "Medium",
    confidence: "High",
    summary: "The departure of a key competitor's Chief Innovation Officer follows consecutive quarters of delayed clean-beauty and clinical-grade launches. This leadership disruption creates a strategic window of opportunity in the premium claim space, as the competitor's product pipeline is projected to experience temporary integration delays and strategic realignment.",
    business_impact: [
      "Opportunity to aggressively capture market share in active clinical formulations during the competitor's transition.",
      "Consider headhunting key senior formulators from the competitor's departing team to strengthen internal R&D.",
      "Accelerate internal launch timelines for comparable peptide-based skincare products."
    ],
    sources: [
      {
        id: "tm-s1",
        source_name: "Beauty Industry Executive Search",
        details: "Strategic leadership transition and pipeline impact analysis for leading personal care conglomerates.",
        category: "Research & Development",
        date: "Jun 28"
      },
      {
        id: "tm-s2",
        source_name: "Corporate Pipeline Tracker",
        details: "In-depth competitor analysis highlighting delays in three major peptide formulation launches.",
        category: "Innovation",
        date: "Jun 15"
      }
    ],
    country: "Global"
  }
};

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

const RICH_SIGNALS: SignalGridItem[] = [
  {
    category: "FUNDING & INVESTMENT",
    status: "Emerging",
    iconType: "up-right",
    iconColor: "text-emerald-600",
    contents: [
      // Funding rounds announced
      [
        {
          title: "Scalp-serum brands are pulling most new category funding",
          desc: "3 of 4 rounds this quarter went to scalp-health positioning; reformulation weighted toward styling now lags the funding trend."
        },
        {
          title: "Series B round closed for eco-friendly packaging pioneer",
          desc: "Secured $15M to scale bio-degradable polymer formulation facilities across the region."
        },
        {
          title: "Pre-seed activity surges in personalized AI diagnostics",
          desc: "Five early-stage launches tracked in the skin-analysis and recommendation segment."
        },
        {
          title: "Micro-encapsulation tech firm secures strategic bridge funding",
          desc: "New $4.2M injection allows active ingredient stability studies to proceed ahead of schedule."
        }
      ],
      // Venture capital investments
      [
        {
          title: "Average round size up 35% year over year",
          desc: "Concentrated in dermatologist-backed formulations; clinical claims are commanding a premium."
        },
        {
          title: "Late-stage VC capital concentrating in clean chemistry",
          desc: "Investors favor established clinical brands over pre-revenue hype products in current macro environment."
        },
        {
          title: "Corporate VC arms launch targeted $50M biotechnology funds",
          desc: "Major legacy incumbents shift from direct R&D to active early-stage investment portfolios."
        },
        {
          title: "Venture debt facilities tapped to accelerate production lines",
          desc: "Two leading clean brands choose debt over equity dilution to finance facility expansion."
        }
      ],
      // Private equity investments
      [
        {
          title: "A regional fund closed its first beauty-tech vehicle",
          desc: "Expect more diagnostics-led entrants over the next two quarters."
        },
        {
          title: "PE buyout of heritage natural skincare brand finalized",
          desc: "Acquisition aims to optimize supply chain and expand digital distribution in APAC markets."
        },
        {
          title: "Secondary market PE activity rises in manufacturing sector",
          desc: "Sponsors consolidating formulation labs to achieve economies of scale and direct-to-brand synergy."
        },
        {
          title: "Minority PE stakes acquired in specialized logistics providers",
          desc: "Strategic investments focus on temperature-controlled fulfillment for active botanical serums."
        }
      ]
    ],
    signalsCount: 12
  },
  {
    category: "INDUSTRY STRUCTURE",
    status: "Emerging",
    iconType: "up-right",
    iconColor: "text-amber-600",
    contents: [
      // Market consolidation
      [
        {
          title: "Private-label is closing the formulation gap",
          desc: "Two retailers launched own-label sulfate-free lines at lower prices; the defensible edge now has to be efficacy, not formulation."
        },
        {
          title: "Independent lab networks merge to counter rising compliance costs",
          desc: "Consolidation of testing facilities expected to stabilize clinical trial pricing next half."
        },
        {
          title: "Contract manufacturing capacity tightening in organic segments",
          desc: "Two dominant players acquired local co-packers, limiting options for small independent brands."
        },
        {
          title: "Regional retail chains acquire exclusive brand licenses",
          desc: "Direct integration of brand properties into supermarket shelves signals high channel consolidation."
        }
      ],
      // Mergers & acquisitions
      [
        {
          title: "Two mid-tier labels reported in early merger talks",
          desc: "Single source, unconfirmed — track, don't act yet."
        },
        {
          title: "Premium wellness conglomerate acquires probiotic patent portfolio",
          desc: "Reinforces vertical integration strategy for microbiome-focused product rollouts."
        },
        {
          title: "Cross-border cosmetic distribution networks unify",
          desc: "Acquisitions in Southern Europe establish a streamlined entry point for North American clean brands."
        },
        {
          title: "Natural cosmetics brand acquired by pharmaceutical giant",
          desc: "Large-scale acquisition targets therapeutic consumer segments with clinical backing."
        }
      ],
      // New industry entrants
      [
        {
          title: "A regional label entered men's grooming",
          desc: "Targets a segment with flat incumbent share for two years — no longer uncontested."
        },
        {
          title: "Biomedical research spin-off launches proprietary skincare line",
          desc: "Utilizes patented cellular-regeneration peptide to target premium dermatologist-office channels."
        },
        {
          title: "Direct-to-consumer fragrance startup debuts waterless formulas",
          desc: "Eco-centric brand model aims to disrupt traditional retail counter experiences."
        },
        {
          title: "Indie hair-health developer launches custom styling kits",
          desc: "Bypasses major retailers via direct subscription model targeting gen-z consumers."
        }
      ]
    ],
    signalsCount: 12
  },
  {
    category: "TALENT MOVEMENT",
    status: "Stable",
    iconType: "up-right",
    iconColor: "text-emerald-600",
    contents: [
      // CEO/CXO appointments
      [
        {
          title: "A competitor's Chief Innovation Officer departed after delayed launches",
          desc: "Follows two quarters of delayed clean-beauty launches; a near-term opening in that claim space."
        },
        {
          title: "Industry veteran appointed CEO of rapid-growth wellness brand",
          desc: "Tasked with scaling retail partnerships and preparing the brand for European expansion."
        },
        {
          title: "Incumbent tech giant's Lead Architect hired as CTO of beauty platform",
          desc: "Indicates serious acceleration of custom skin-mapping AI and virtual try-on software."
        },
        {
          title: "Former luxury goods executive joins startup as Chief Brand Officer",
          desc: "Focuses on elevating visual packaging and editorial campaigns for the premium organic launch."
        }
      ],
      // Leadership exits
      [
        {
          title: "Senior formulators migrating to indie brand incubators",
          desc: "Talent drain from legacy players accelerates, shifting formulation power to nimble market entry vehicles."
        },
        {
          title: "VP of Global Marketing steps down amid campaign controversy",
          desc: "Temporary leadership transition could slow brand repositioning efforts in Western markets."
        },
        {
          title: "Chief Sustainability Officer resigns from heritage brand",
          desc: "Reflects internal friction over corporate plastic-neutral targets and sourcing compliance."
        },
        {
          title: "Head of Digital Products exits to join early-stage health tech",
          desc: "Leaves a leadership vacuum in the active personalized-routine platform team."
        }
      ],
      // Mass hiring initiatives
      []
    ],
    signalsCount: 8
  },
  {
    category: "MACRO & ECONOMIC",
    status: "Stable",
    iconType: "minus",
    iconColor: "text-zinc-400",
    contents: [
      // Interest rate changes
      [
        {
          title: "Macro indicators and central bank policy adjustments maintain ranges",
          desc: "Policy adjustments are currently maintaining historical ranges without disruption, indicating low near-term relevance."
        },
        {
          title: "Cost of capital increases pinch small formulation laboratories",
          desc: "Higher interest rates delay equipment upgrades and slow early-phase R&D pipelines for non-funded builders."
        },
        {
          title: "Credit tightening affects inventory financing for retail partners",
          desc: "Distributors reducing safety stock levels, shifting inventory burden back to manufacturing brands."
        },
        {
          title: "Central bank signal suggests stable borrowing rates for two quarters",
          desc: "Firms can proceed with medium-term planning under lower macroeconomic volatility."
        }
      ],
      // Inflation updates
      [
        {
          title: "Raw material cost inflation stabilizing across organic oils",
          desc: "Key natural extracts show price moderation after multi-quarter supply chain bottlenecks."
        },
        {
          title: "Packaging material costs rise due to recycled glass surcharges",
          desc: "Brands facing 8-12% increases in sustainable premium glass containers, squeezing gross margins."
        },
        {
          title: "Consumer spending index shows resilience in premium self-care",
          desc: "Lipstick effect persists as buyers trade down on luxury apparel but maintain high-end skincare routines."
        },
        {
          title: "Labor rate increases pressure manufacturing facility overheads",
          desc: "Rising minimum wages across production hubs force brands to investigate further automation."
        }
      ],
      // GDP growth forecasts
      [
        {
          title: "GDP growth projections revised upward in key consumer hubs",
          desc: "Rising regional employment expected to boost discretionary spending in wellness categories next fiscal."
        },
        {
          title: "Export market slowdown indicators hit shipping volumes",
          desc: "Slowing trade volumes suggest brand builders should prioritize domestic logistics over cross-border expansion."
        },
        {
          title: "Urban metropolitan consumer confidence index reaches 2-year peak",
          desc: "Positive economic sentiment drives higher foot traffic and trial rates at high-end experiential boutiques."
        },
        {
          title: "Developing markets forecast 5.2% expansion in personal wellness sector",
          desc: "Indicates strong target demographic growth in expanding Southeast Asian and Latin American cities."
        }
      ]
    ],
    signalsCount: 12
  },
  {
    category: "TECH ADOPTION",
    status: "Cooling",
    iconType: "down-right",
    iconColor: "text-zinc-400",
    contents: [
      // AI adoption
      [
        {
          title: "Adoption announcements slowed after a strong prior quarter",
          desc: "Customers are shifting focus from rapid experimentation to optimizing and scaling existing tool deployments."
        },
        {
          title: "Enterprise migration to customized small language models is gaining traction",
          desc: "Organizations prioritize data privacy and cost efficiency over generalized large models."
        },
        {
          title: "Generative AI skin-tone analysis integrated into retail apps",
          desc: "Major cosmetics brands deploy real-time color matching with 94% accuracy ratings."
        },
        {
          title: "AI-generated formulation suggestions enter bench testing",
          desc: "R&D teams use predictive neural nets to screen allergen profiles before raw synthesis."
        }
      ],
      // Cloud migration
      [
        {
          title: "ERP systems shift to cloud for multi-country inventory synch",
          desc: "Brands moving away from legacy on-prem servers to cut logistics response times from days to hours."
        },
        {
          title: "Customer data platform centralization accelerates",
          desc: "Unified cloud data warehouse enables micro-segmented regional promotions and real-time behavioral insights."
        },
        {
          title: "Serverless server endpoints chosen for flash holiday sales",
          desc: "Ensures zero-downtime scalability during high-traffic launch events and celebrity drops."
        },
        {
          title: "API-first microservices replace legacy monolithic backends",
          desc: "Decoupled structures improve mobile app load speeds and simplify multi-channel checkouts."
        }
      ],
      // Digital transformation programs
      [
        {
          title: "Decreased implementation activity in public Web3 database modules",
          desc: "Slower integration speeds observed as resources reallocate to analytics pipelines."
        },
        {
          title: "Smart factory upgrade completes at major formulation plant",
          desc: "IoT sensors on mixing vats improve batch-to-batch consistency by 40% and reduce chemical waste."
        },
        {
          title: "Legacy distribution networks convert to fully digital EDI portals",
          desc: "Automated replenishment workflows eliminate manual invoice entry and reduce shipping delays."
        },
        {
          title: "NFC smart tags trialed for luxury perfume authentication",
          desc: "Tap-to-verify chips combat counterfeit secondary markets and build direct customer engagement."
        }
      ]
    ],
    signalsCount: 12
  }
];

const SPARSE_SIGNALS: SignalGridItem[] = RICH_SIGNALS;

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
  userId
}: MarketDynamicsPaneProps) {
  const [activeTab, setActiveTab] = useState<string>("insights");
  const [selectedTrendId, setSelectedTrendId] = useState<string>("embedded-fintech");
  const [isSourcesExpanded, setIsSourcesExpanded] = useState<boolean>(true);
  const [richSignals, setRichSignals] = useState<SignalGridItem[]>([]);
  const [marketInsights, setMarketInsights] = useState<any[]>([]);
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
  const [startDateStr, setStartDateStr] = useState("");
  const [endDateStr, setEndDateStr] = useState("");
  const [defaultStartDate, setDefaultStartDate] = useState("");
  const [defaultEndDate, setDefaultEndDate] = useState("");
  const [isEditingDates, setIsEditingDates] = useState(false);

  // Load fallback dates matching Policy & Risk Monitor defaults
  useEffect(() => {
    const today = new Date();
    const past = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const formatDate = (d: Date) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };
    const minStr = formatDate(past);
    const maxStr = formatDate(today);
    setStartDateStr(minStr);
    setEndDateStr(maxStr);
    setDefaultStartDate(minStr);
    setDefaultEndDate(maxStr);
  }, []);

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
    return filteredRichSignals.length > 0 ? filteredRichSignals : RICH_SIGNALS;
  }, [filteredRichSignals]);

  const currentCategoryData = useMemo(() => {
    const key = selectedCategory.toUpperCase();
    return activeGridSignals.find(s => s.category === key) || activeGridSignals[0];
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

      if (!selectedGridSignal || !isCurrentSignalInCategory) {
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
  }, [selectedCategory, activeGridSignals]);
  
  useEffect(() => {
    setIsSourcesExpanded(true);
    setExpandedCards({});
    if (selectedGridSignal) {
      // For grid signals, we wait for fetchSignalDetails to set the real selectedSignalId
      // We can clear it here to avoid showing a mismatch
      setSelectedSignalId(null);
    } else {
      const trend = RADAR_TRENDS.find(t => t.id === selectedTrendId) || RADAR_TRENDS[0];
      if (trend && trend.sources && trend.sources.length > 0) {
        setSelectedSignalId(trend.sources[0].id);
      } else {
        setSelectedSignalId(null);
      }
    }
  }, [selectedTrendId, selectedGridSignal]);

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
    // Debug schema
    async function checkSchema() {
      const { data, error } = await supabase.from("bookmarks").select("*").limit(1);
      console.log("Bookmarks schema check (MarketDynamics):", { data, error });
    }
    checkSchema();
  }, [clientId, userId]);




  // Selected Trend Item
  const selectedTrend = useMemo(() => {
    return RADAR_TRENDS.find(t => t.id === selectedTrendId) || RADAR_TRENDS[0];
  }, [selectedTrendId]);

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
    if (!selectedTrend) return null as any;
    return {
      ...selectedTrend,
      sources: (selectedTrend.sources || []).map(src => {
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
  }, [selectedGridSignal, selectedTrend, selectedCategory, activeSignalDetail, selectedInsightId]);

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
    const dateVal = activeSignalDetail?.last_enriched_at || activeSignalDetail?.created_at || renderedTrend.source_published_date;
    const d = new Date(dateVal);
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
                    if (!startDateStr) setStartDateStr(defaultStartDate);
                    if (!endDateStr) setEndDateStr(defaultEndDate);
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
              {currentSubCardTitles.map((title, subIndex) => {
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
                          const isSelected = selectedGridSignal?.id && sig.id 
                            ? selectedGridSignal.id === sig.id 
                            : selectedGridSignal?.title === sig.title;
                          return (
                            <div 
                              key={sigIdx} 
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
        {/* Dynamic switcher content */}
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
              
              <div className="flex items-center gap-1.5 select-none text-[11px] text-zinc-400 mt-1">
                <span className="font-normal text-zinc-400">Reference:</span>
                <span className="inline-flex items-center justify-center w-[18px] h-[18px] bg-zinc-100 border border-zinc-200 rounded-[4px] text-[10.5px] font-bold text-zinc-500 cursor-help select-none" title="MarketGenie Horizon Analysis">
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
                  {renderedTrend.sources.map(src => {
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

        {activeTab === "ask_marketgenie" && (
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
                  const trend = marketInsights.find(mi => mi.id === bId) || RADAR_TRENDS.find(t => t.id === bId);
                  if (!trend) return null;
                  return (
                    <div
                      key={trend.id}
                      onClick={() => {
                        if ((trend as any).signal_id) {
                           setSelectedInsightId(trend.id);
                           setSelectedGridSignal(null);
                        } else {
                           setSelectedTrendId(trend.id);
                           setSelectedGridSignal(null);
                           setSelectedInsightId(null);
                           setActiveSignalDetail(null);
                        }
                        setActiveTab("insights");
                      }}
                      className={`p-3 border rounded-[4px] cursor-pointer transition-all ${
                        selectedTrendId === trend.id || selectedInsightId === trend.id
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
