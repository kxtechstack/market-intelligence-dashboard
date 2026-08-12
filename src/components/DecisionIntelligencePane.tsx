import React, { useState, useRef, useEffect } from "react";
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
  Compass,
  Bookmark,
  Share2,
  FileDown,
} from "lucide-react";
import { jsPDF } from "jspdf";
import { ChatMessage } from "../types";
import { ChatSources } from "./ChatSources";
import { API_URL } from "../constants";

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

const QUESTION_LIBRARY: QuestionLibraryItem[] = [
  // --- Decision Intelligence ---
  { id: "di-1", category: "Decision Intelligence", title: "Expansion Strategy", question: "How should I plan to expand in next one year?" },
  { id: "di-2", category: "Decision Intelligence", title: "R&D Reallocation", question: "Should we reallocate R&D towards scalp-health serums in the GCC market?" },
  { id: "di-3", category: "Decision Intelligence", title: "Packaging Transition", question: "Should we switch to refillable aluminum packaging to meet 2027 ESG goals?" },
  { id: "di-4", category: "Decision Intelligence", title: "Market Defense Strategy", question: "How should we strategically defend market share against emerging indie barrier-repair brands in APAC?" },
  { id: "di-5", category: "Decision Intelligence", title: "Channel Mix Selection", question: "Should we prioritize specialty retail partnerships over direct eCommerce in LATAM expansion?" },
  { id: "di-6", category: "Decision Intelligence", title: "Marketing Spend Optimization", question: "Should we shift 40% of digital marketing budget from search ads to dermatologist micro-influencers?" },
  { id: "di-7", category: "Decision Intelligence", title: "M&A Acquisition Target", question: "Is acquiring a local KSA manufacturing facility viable for Halal certification acceleration?" },
  { id: "di-8", category: "Decision Intelligence", title: "Supply Chain Hedging", question: "How should we structure long-term forward contracts for biotech peptide complexes under price volatility?" },
  { id: "di-9", category: "Decision Intelligence", title: "Pricing Tier Alignment", question: "Should we introduce a luxury clinical line priced 25% above current premium tier?" },
  { id: "di-10", category: "Decision Intelligence", title: "Joint Venture Partner", question: "How should we structure joint venture terms with Japanese department store distributors?" },
  { id: "di-11", category: "Decision Intelligence", title: "In-Store AI Rollout", question: "Should we deploy skin diagnostic AI kiosks across all 150 flagship retail stores?" },
  { id: "di-12", category: "Decision Intelligence", title: "Portfolio Rationalization", question: "Which low-performing legacy SKU lines should be phased out in Q4 to optimize working capital?" },
  { id: "di-13", category: "Decision Intelligence", title: "Localization Strategy", question: "How should we reformulate core moisturizers to adapt to humid Southeast Asian climates?" },

  // --- Inference ---
  { id: "inf-1", category: "Inference", title: "Competitor Price Shift", question: "How has the competitors pricing changed in last week?" },
  { id: "inf-2", category: "Inference", title: "Consumer Sentiment Vector", question: "How has consumer sentiment shifted regarding synthetic vs. bio-fermented hyaluronic acid?" },
  { id: "inf-3", category: "Inference", title: "Supply Chain Bottlenecks", question: "How are regional port delays in the Strait of Hormuz impacting shipping lead times for raw botanical extracts?" },
  { id: "inf-4", category: "Inference", title: "In-Store AI Diagnostics ROI", question: "What correlation exists between in-store AI skin analysis engagement and average basket size?" },
  { id: "inf-5", category: "Inference", title: "Efficacy Claim Sensitivity", question: "How are European consumers responding to 7-day vs 30-day clinical efficacy marketing claims?" },
  { id: "inf-6", category: "Inference", title: "Competitor Discounting Patterns", question: "What inferred promotional patterns are premium skincare brands running on Amazon US this quarter?" },
  { id: "inf-7", category: "Inference", title: "Search Intent Volume", question: "How has organic search volume for 'barrier repair cream' grown relative to 'serum' in GCC?" },
  { id: "inf-8", category: "Inference", title: "Raw Material Price Impact", question: "How will inferred price spikes in palm kernel oil affect gross margins for emulsifiers next quarter?" },
  { id: "inf-9", category: "Inference", title: "Patent Expiry Risks", question: "What implications arise from major competitor patent expiries in peptide encapsulation technology?" },
  { id: "inf-10", category: "Inference", title: "Social Commerce Conversion", question: "How does TikTok Shop conversion rate in the UK compare against traditional brand storefronts?" },
  { id: "inf-11", category: "Inference", title: "Dermatologist Endorsement Impact", question: "What inferred sales lift correlates with board-certified dermatologist social media endorsements?" },
  { id: "inf-12", category: "Inference", title: "Retail Footfall Correlation", question: "How has high-street footfall recovery in UK shopping districts impacted brick-and-mortar cosmetic sales?" },
  { id: "inf-13", category: "Inference", title: "Sustainable Packaging Elasticity", question: "What price premium elasticity do consumers display when purchasing ocean-bound plastic certified products?" },

  // --- List ---
  { id: "lst-1", category: "List", title: "Weekly Regulatory Changes", question: "What are the major policy changes in last one week?" },
  { id: "lst-2", category: "List", title: "Banned Ingredients Update", question: "What ingredients were newly added to the EU Cosmetic Regulation restricted list this month?" },
  { id: "lst-3", category: "List", title: "Top GCC Distributors", question: "List the top 10 prestige beauty distributors operating in KSA and UAE." },
  { id: "lst-4", category: "List", title: "Competitor Product Launches", question: "What are the new product launches in anti-aging skincare recorded in APAC during Q2?" },
  { id: "lst-5", category: "List", title: "SFDA Product Approval Steps", question: "What are the required documentation steps for SFDA cosmetic product registration in Saudi Arabia?" },
  { id: "lst-6", category: "List", title: "Microbiome Patents Filed", question: "List all recent patent filings related to postbiotic ferment stabilization in 2025-2026." },
  { id: "lst-7", category: "List", title: "Active Trade Tariff Adjustments", question: "What are the current import tariff rates for personal care items across ASEAN member states?" },
  { id: "lst-8", category: "List", title: "Eco-Label Certifications", question: "List the globally recognized third-party sustainability certifications for cosmetic packaging." },
  { id: "lst-9", category: "List", title: "Top Indie Competitors in KSA", question: "Which fast-growing indie skincare brands gained market share in Riyadh last year?" },
  { id: "lst-10", category: "List", title: "Active Clinical Trial Protocols", question: "What clinical trial protocols are mandated for hypoallergenic dermatologist safety claims?" },
  { id: "lst-11", category: "List", title: "Key Industry Trade Expos", question: "List the major international cosmetics and supply chain expos scheduled for H2 2026." },
  { id: "lst-12", category: "List", title: "Key Biotech Supplier Contacts", question: "What are the leading certified suppliers of ferment-derived vegan hyaluronic acid globally?" },
  { id: "lst-13", category: "List", title: "Scope 3 Emission Benchmark Metrics", question: "What key ESG metrics are required for Scope 3 supply chain disclosure reporting?" },
];

const INITIAL_PREVIOUS_SESSIONS: ChatSession[] = [
  {
    id: "session-1",
    title: "Evaluating R&D reallocation towards scalp-care formulation in GCC",
    date: "Today",
    displayTime: "36 minutes ago",
    dayGroup: "Today",
    messages: [
      {
        id: "m1",
        role: "user",
        text: "Evaluating R&D reallocation towards scalp-care formulation in GCC",
        timestamp: new Date(Date.now() - 36 * 60 * 1000),
      },
      {
        id: "m2",
        role: "model",
        text: "Strategic evaluation for reallocating R&D towards premium scalp-care formulations:\n\n1. **Market Growth**: Scalp care in the GCC is growing at a 14.2% CAGR driven by climate factors and consumer focus on clinical haircare.\n2. **Regulatory Positioning**: SFDA and UAE MoHaP compliance checks require 3-6 months lead time for active ingredient registrations.\n3. **Recommendation**: Pilot a soft launch in UAE/KSA luxury retail before full factory line transition.",
        timestamp: new Date(Date.now() - 35 * 60 * 1000),
      },
    ],
  },
  {
    id: "session-2",
    title: "Impact of EU Cosmetic Regulation (EC 1223/2009) amendments on active ingredients",
    date: "Today",
    displayTime: "5 hours ago",
    dayGroup: "Today",
    messages: [
      {
        id: "m3",
        role: "user",
        text: "Impact of EU Cosmetic Regulation (EC 1223/2009) amendments on active ingredients",
        timestamp: new Date(Date.now() - 5 * 3600 * 1000),
      },
      {
        id: "m4",
        role: "model",
        text: "EU Cosmetics Regulation compliance synthesis:\n\n- Revised concentration limits for specific UV filters and preservatives.\n- Supplier audit required for EU import entry clearance.",
        timestamp: new Date(Date.now() - 5 * 3600 * 1000 + 60000),
      },
    ],
  },
  {
    id: "session-3",
    title: "Competitive risk assessment: M&A consolidation in APAC prestige beauty",
    date: "Today",
    displayTime: "5 hours ago",
    dayGroup: "Today",
    messages: [
      {
        id: "m5",
        role: "user",
        text: "Competitive risk assessment: M&A consolidation in APAC prestige beauty",
        timestamp: new Date(Date.now() - 5 * 3600 * 1000),
      },
      {
        id: "m6",
        role: "model",
        text: "M&A landscape evaluation for APAC skincare conglomerates focusing on direct-to-consumer premium brands.",
        timestamp: new Date(Date.now() - 5 * 3600 * 1000 + 120000),
      },
    ],
  },
  {
    id: "session-4",
    title: "Supply chain resilience strategy for sustainable palm oil sourcing in Southeast Asia",
    date: "Today",
    displayTime: "11 hours ago",
    dayGroup: "Today",
    messages: [
      {
        id: "m7",
        role: "user",
        text: "Supply chain resilience strategy for sustainable palm oil sourcing in Southeast Asia",
        timestamp: new Date(Date.now() - 11 * 3600 * 1000),
      },
      {
        id: "m8",
        role: "model",
        text: "RSPO certification tracking and dual-sourcing framework to mitigate regional harvest disruption risks.",
        timestamp: new Date(Date.now() - 11 * 3600 * 1000 + 60000),
      },
    ],
  },
  {
    id: "session-5",
    title: "Pricing elasticity model for eco-conscious personal care lines in North America",
    date: "Today",
    displayTime: "12 hours ago",
    dayGroup: "Today",
    messages: [
      {
        id: "m9",
        role: "user",
        text: "Pricing elasticity model for eco-conscious personal care lines in North America",
        timestamp: new Date(Date.now() - 12 * 3600 * 1000),
      },
      {
        id: "m10",
        role: "model",
        text: "Consumer willingness-to-pay analysis indicates a 12-15% premium threshold for certified ocean-safe packaging.",
        timestamp: new Date(Date.now() - 12 * 3600 * 1000 + 60000),
      },
    ],
  },
  {
    id: "session-6",
    title: "Regulatory compliance roadmap for Halal-certified anti-aging serum entry in KSA",
    date: "Yesterday",
    displayTime: "yesterday",
    dayGroup: "Yesterday",
    messages: [
      {
        id: "m11",
        role: "user",
        text: "Regulatory compliance roadmap for Halal-certified anti-aging serum entry in KSA",
        timestamp: new Date(Date.now() - 24 * 3600 * 1000),
      },
      {
        id: "m12",
        role: "model",
        text: "SFDA registration process breakdown and Halal certification authority alignment for Saudi retail expansion.",
        timestamp: new Date(Date.now() - 24 * 3600 * 1000 + 60000),
      },
    ],
  },
  {
    id: "session-7",
    title: "Consumer sentiment shifts regarding synthetic vs. bio-fermented hyaluronic acid",
    date: "2 days ago",
    displayTime: "2 days ago",
    dayGroup: "2 days ago",
    messages: [
      {
        id: "m13",
        role: "user",
        text: "Consumer sentiment shifts regarding synthetic vs. bio-fermented hyaluronic acid",
        timestamp: new Date(Date.now() - 2 * 24 * 3600 * 1000),
      },
      {
        id: "m14",
        role: "model",
        text: "Analysis of 45,000 online review mentions showing a 28% increase in demand for zero-carbon bio-fermented actives.",
        timestamp: new Date(Date.now() - 2 * 24 * 3600 * 1000 + 60000),
      },
    ],
  },
  {
    id: "session-8",
    title: "Omnichannel retail expansion strategy: Specialty beauty stores vs. direct eCommerce in LATAM",
    date: "2 days ago",
    displayTime: "2 days ago",
    dayGroup: "2 days ago",
    messages: [
      {
        id: "m15",
        role: "user",
        text: "Omnichannel retail expansion strategy: Specialty beauty stores vs. direct eCommerce in LATAM",
        timestamp: new Date(Date.now() - 2 * 24 * 3600 * 1000),
      },
      {
        id: "m16",
        role: "model",
        text: "Channel mix recommendation: Hybrid retail partnership with Sephora Brazil combined with localized MercadoLibre storefronts.",
        timestamp: new Date(Date.now() - 2 * 24 * 3600 * 1000 + 60000),
      },
    ],
  },
  {
    id: "session-9",
    title: "Evaluating micro-influencer ROI vs. traditional digital advertising in Western Europe",
    date: "2 days ago",
    displayTime: "2 days ago",
    dayGroup: "2 days ago",
    messages: [
      {
        id: "m17",
        role: "user",
        text: "Evaluating micro-influencer ROI vs. traditional digital advertising in Western Europe",
        timestamp: new Date(Date.now() - 2 * 24 * 3600 * 1000),
      },
      {
        id: "m18",
        role: "model",
        text: "Comparative attribution study demonstrating 3.2x higher conversion rates for micro-dermatologist partnerships in UK & Germany.",
        timestamp: new Date(Date.now() - 2 * 24 * 3600 * 1000 + 60000),
      },
    ],
  },
  {
    id: "session-10",
    title: "Strategic positioning against emerging indie barrier-repair brands in Asia-Pacific",
    date: "2 days ago",
    displayTime: "2 days ago",
    dayGroup: "2 days ago",
    messages: [
      {
        id: "m19",
        role: "user",
        text: "Strategic positioning against emerging indie barrier-repair brands in Asia-Pacific",
        timestamp: new Date(Date.now() - 2 * 24 * 3600 * 1000),
      },
      {
        id: "m20",
        role: "model",
        text: "Market defense matrix focusing on clinical efficacy messaging and dermatologist endorsement campaigns.",
        timestamp: new Date(Date.now() - 2 * 24 * 3600 * 1000 + 60000),
      },
    ],
  },
  {
    id: "session-11",
    title: "Sustainable packaging transition timeline: PCR plastic vs. refillable aluminum cartridges",
    date: "2 days ago",
    displayTime: "2 days ago",
    dayGroup: "2 days ago",
    messages: [
      {
        id: "m21",
        role: "user",
        text: "Sustainable packaging transition timeline: PCR plastic vs. refillable aluminum cartridges",
        timestamp: new Date(Date.now() - 2 * 24 * 3600 * 1000),
      },
      {
        id: "m22",
        role: "model",
        text: "Lifecycle assessment (LCA) analysis and cost-benefit trade-offs for ESG target fulfillment.",
        timestamp: new Date(Date.now() - 2 * 24 * 3600 * 1000 + 60000),
      },
    ],
  },
  {
    id: "session-12",
    title: "Scenario assessment: Raw material price volatility in peptide active complexes",
    date: "3 days ago",
    displayTime: "3 days ago",
    dayGroup: "3 days ago",
    messages: [
      {
        id: "m23",
        role: "user",
        text: "Scenario assessment: Raw material price volatility in peptide active complexes",
        timestamp: new Date(Date.now() - 3 * 24 * 3600 * 1000),
      },
      {
        id: "m24",
        role: "model",
        text: "Hedging strategies and forward contract commitments for key biotech peptide suppliers.",
        timestamp: new Date(Date.now() - 3 * 24 * 3600 * 1000 + 60000),
      },
    ],
  },
  {
    id: "session-13",
    title: "Evaluating joint venture opportunities for clean beauty distribution in Japan",
    date: "3 days ago",
    displayTime: "3 days ago",
    dayGroup: "3 days ago",
    messages: [
      {
        id: "m25",
        role: "user",
        text: "Evaluating joint venture opportunities for clean beauty distribution in Japan",
        timestamp: new Date(Date.now() - 3 * 24 * 3600 * 1000),
      },
      {
        id: "m26",
        role: "model",
        text: "PMDA registration overview and local department store partnership models in Tokyo & Osaka.",
        timestamp: new Date(Date.now() - 3 * 24 * 3600 * 1000 + 60000),
      },
    ],
  },
  {
    id: "session-14",
    title: "Consumer adoption drivers for personalized AI skincare diagnostics in retail stores",
    date: "3 days ago",
    displayTime: "3 days ago",
    dayGroup: "3 days ago",
    messages: [
      {
        id: "m27",
        role: "user",
        text: "Consumer adoption drivers for personalized AI skincare diagnostics in retail stores",
        timestamp: new Date(Date.now() - 3 * 24 * 3600 * 1000),
      },
      {
        id: "m28",
        role: "model",
        text: "In-store conversion uplift data showing a 34% higher basket size following AI skin analysis interaction.",
        timestamp: new Date(Date.now() - 3 * 24 * 3600 * 1000 + 60000),
      },
    ],
  },
  {
    id: "session-15",
    title: "Competitive intelligence report: Patent filing trends in microbiome skincare 2024-2026",
    date: "4 days ago",
    displayTime: "4 days ago",
    dayGroup: "4 days ago",
    messages: [
      {
        id: "m29",
        role: "user",
        text: "Competitive intelligence report: Patent filing trends in microbiome skincare 2024-2026",
        timestamp: new Date(Date.now() - 4 * 24 * 3600 * 1000),
      },
      {
        id: "m30",
        role: "model",
        text: "Patent landscape mapping revealing accelerated filings in postbiotic ferment stabilization technologies.",
        timestamp: new Date(Date.now() - 4 * 24 * 3600 * 1000 + 60000),
      },
    ],
  },
];

const DUMMY_LIST_RESPONSES: Record<string, Array<{ id: string; title: string; category: string; date: string; summary: string; impact?: string }>> = {
  "lst-1": [
    {
      id: "l1-1",
      title: "SFDA Circular 2026-88: Accelerated Registration for Halal-Certified Bio-Actives",
      category: "Regulatory Policy",
      date: "Aug 09, 2026",
      summary: "Saudi Food & Drug Authority enacted a fast-track approval protocol reducing registration turnaround time from 90 to 30 days for anti-aging serums containing certified Halal bio-fermented hyaluronic acid.",
      impact: "High Impact"
    },
    {
      id: "l1-2",
      title: "EU Cosmetic Regulation Amendment (EC 1223/2009 Annex III Update)",
      category: "Ingredient Restriction",
      date: "Aug 06, 2026",
      summary: "Revised maximum allowable concentration limits for synthetic UV filter octocrylene (9.0% max cap) and BHT antioxidants across all leave-on skincare imports entering EU ports.",
      impact: "Medium Impact"
    },
    {
      id: "l1-3",
      title: "UAE MoHaP Guideline: Eco-Safe Packaging Labeling Enforcement",
      category: "Packaging & ESG",
      date: "Aug 05, 2026",
      summary: "Ministry of Health & Prevention mandates QR-code traceable PCR plastic packaging verification for all premium personal care SKUs sold in UAE luxury retail.",
      impact: "Medium Impact"
    },
    {
      id: "l1-4",
      title: "ASEAN Harmonized Cosmetic Directive: Micro-Plastic Exfoliant Ban",
      category: "Trade & Environment",
      date: "Aug 03, 2026",
      summary: "Southeast Asian trade bloc enforces a total import ban on wash-off skincare products containing non-biodegradable synthetic polymer microbeads.",
      impact: "High Impact"
    }
  ],
  "lst-2": [
    {
      id: "l2-1",
      title: "Octocrylene (CAS 6197-30-4) Concentration Cap",
      category: "UV Filters",
      date: "Aug 01, 2026",
      summary: "Maximum allowable concentration in sunscreen and daily moisturizers reduced to 9.0% max due to updated SCCS bioaccumulation safety re-evaluations.",
      impact: "High Impact"
    },
    {
      id: "l2-2",
      title: "Lyral / HICC (CAS 31906-04-4) Total Import Ban",
      category: "Fragrance Compounds",
      date: "Aug 01, 2026",
      summary: "Complete prohibition of Hydroxyisohexyl 3-cyclohexene carboxaldehyde in all leave-on and rinse-off cosmetic formulations entering European Union markets.",
      impact: "High Impact"
    },
    {
      id: "l2-3",
      title: "BHT / Butylated Hydroxytoluene (CAS 128-37-0)",
      category: "Antioxidants",
      date: "Aug 01, 2026",
      summary: "Restricted to 0.1% maximum concentration in leave-on skin products and 0.8% in rinse-off formulations to prevent bioaccumulation risk.",
      impact: "Medium Impact"
    },
    {
      id: "l2-4",
      title: "Uncoated Nano Zinc Oxide (CAS 1314-13-2)",
      category: "Mineral Sunscreens",
      date: "Aug 01, 2026",
      summary: "Uncoated nano-grade zinc oxide particles subjected to mandatory inhalation safety re-dossier submissions for spray aerosol products.",
      impact: "High Impact"
    }
  ],
  "lst-3": [
    {
      id: "l3-1",
      title: "Chalhoub Group (Prestige Retail & Omnichannel)",
      category: "GCC Regional Lead",
      date: "Market Leader 2026",
      summary: "Operates 750+ luxury doors across UAE, KSA, Kuwait, and Qatar representing Sephora, L'Oréal Luxe, and niche indie prestige beauty brands.",
      impact: "High Impact"
    },
    {
      id: "l3-2",
      title: "Al Tayer Group (Luxury Department Stores)",
      category: "Department Store Retail",
      date: "Market Leader 2026",
      summary: "Exclusive distributor for Bloomingdale's, Harvey Nichols, and boutique clean skincare lines across GCC high-street shopping malls.",
      impact: "High Impact"
    },
    {
      id: "l3-3",
      title: "A.S. Watson Group / Watsons GCC",
      category: "Mass-Prestige & Clinical",
      date: "Market Leader 2026",
      summary: "Rapidly expanding pharmacy-beauty footprint in Saudi Arabia with 120+ doors focusing on dermacosmetics and scalp-care ranges.",
      impact: "Medium Impact"
    },
    {
      id: "l3-4",
      title: "Alshaya Group",
      category: "Omnichannel GCC Franchise",
      date: "Market Leader 2026",
      summary: "Manages regional franchise retail for Charlotte Tilbury, Jo Malone, and Boots pharmacy network across the Middle East.",
      impact: "Medium Impact"
    }
  ],
  "lst-4": [
    {
      id: "l4-1",
      title: "Shiseido Future Solution LX Bio-Ferment Serum",
      category: "Japan Prestige",
      date: "Jun 2026",
      summary: "Features patented postbiotic rice ferment technology targeting dermal collagen density and firming in mature skin.",
      impact: "High Impact"
    },
    {
      id: "l4-2",
      title: "Amorepacific Time Response Bio-Peptide Ampoule",
      category: "K-Beauty Innovation",
      date: "May 2026",
      summary: "Dual-chamber clinical ampoule combining green tea stem-cell exosomes with multi-weight hyaluronic acid complexes.",
      impact: "High Impact"
    },
    {
      id: "l4-3",
      title: "Proya Elastic Peptide Barrier Repair Cream",
      category: "C-Beauty Clinical",
      date: "May 2026",
      summary: "Priced in mid-prestige tier, utilizing bio-identical ceramide 3 and copper tripeptide-1 for urban anti-pollution protection.",
      impact: "Medium Impact"
    },
    {
      id: "l4-4",
      title: "SK-II Masterpiece Pitera Intensive Treatment",
      category: "Luxury APAC",
      date: "Apr 2026",
      summary: "Ultra-concentrated fermented yeast elixir launching exclusively in Tokyo, Seoul, and Shanghai flagship doors.",
      impact: "High Impact"
    }
  ],
  "lst-5": [
    {
      id: "l5-1",
      title: "Step 1: SFDA e-Clearance Account & GHAD Portal Setup",
      category: "Administrative Setup",
      date: "Mandatory Protocol",
      summary: "Establish an authorized local Saudi legal entity or appoint an official local distributor with a valid SFDA commercial license.",
      impact: "High Impact"
    },
    {
      id: "l5-2",
      title: "Step 2: Certificate of Free Sale (CFS) Legalization",
      category: "Dossier Verification",
      date: "Mandatory Protocol",
      summary: "Submit an apostilled CFS from the country of origin, legalized by the Saudi Embassy, confirming product safety compliance.",
      impact: "High Impact"
    },
    {
      id: "l5-3",
      title: "Step 3: Halal Compliance & Ingredient Dossier Submission",
      category: "Safety & Halal Audit",
      date: "Mandatory Protocol",
      summary: "Provide full quantitative formula breakdown, heavy metal/microbial lab test reports, and Halal certificate for animal-derived ingredients.",
      impact: "High Impact"
    },
    {
      id: "l5-4",
      title: "Step 4: SFDA Unified Artwork & GSO 1943/2021 Labeling",
      category: "Packaging Approval",
      date: "Mandatory Protocol",
      summary: "Ensure primary packaging includes Arabic labeling, batch numbers, PAO symbol, and SFDA registration barcode.",
      impact: "Medium Impact"
    }
  ],
  "lst-6": [
    {
      id: "l6-1",
      title: "US Patent 2026/0148922: Lyophilized Postbiotic Micro-Encapsulation",
      category: "Biotech Patent",
      date: "Jul 2026",
      summary: "Assigned to L'Oréal R&D. Utilizes lipid nanocarriers to stabilize heat-sensitive Lactobacillus ferments at ambient temperatures.",
      impact: "High Impact"
    },
    {
      id: "l6-2",
      title: "EP 4291082-A1: Anaerobic Bio-Fermentation of Red Ginseng Postbiotics",
      category: "EU/APAC Patent",
      date: "May 2026",
      summary: "Assigned to Amorepacific Corp. Method for isolating bio-active ginsenoside metabolites for epidermal lipid barrier repair.",
      impact: "Medium Impact"
    },
    {
      id: "l6-3",
      title: "WO 2026/088102: Dual-Phase Fermented Saccharomyces Exosome Complexes",
      category: "WIPO Global Patent",
      date: "Mar 2026",
      summary: "Assigned to Evonik Industries. Stabilizes active peptides in aqueous gel matrix without synthetic parabens or phenoxyethanol.",
      impact: "Medium Impact"
    }
  ],
  "lst-7": [
    {
      id: "l7-1",
      title: "Indonesia (BPOM Customs Ports)",
      category: "ASEAN Trade Tariff",
      date: "2026 Tariff Schedule",
      summary: "10.0% - 15.0% Ad Valorem import duty on finished skincare plus 11% VAT under ATIGA regional agreement.",
      impact: "Medium Impact"
    },
    {
      id: "l7-2",
      title: "Vietnam (Customs Department)",
      category: "ASEAN Trade Tariff",
      date: "2026 Tariff Schedule",
      summary: "Finished cosmetic goods imported from non-ASEAN trade partners incur 20% tariff; 0% for certified intra-ASEAN origin.",
      impact: "High Impact"
    },
    {
      id: "l7-3",
      title: "Thailand (Revenue Department)",
      category: "ASEAN Trade Tariff",
      date: "2026 Tariff Schedule",
      summary: "5.0% tariff + 7% VAT applied to premium skincare active ingredients and bulk formulations imported for local bottling.",
      impact: "Medium Impact"
    },
    {
      id: "l7-4",
      title: "Singapore (Customs Port)",
      category: "Free Trade Port",
      date: "2026 Tariff Schedule",
      summary: "0.0% duty-free entry for all personal care and cosmetic products; subject only to standard Goods and Services Tax.",
      impact: "Low Impact"
    }
  ],
  "lst-8": [
    {
      id: "l8-1",
      title: "Cradle to Cradle Certified® (Gold / Platinum)",
      category: "Circular Economy",
      date: "Global Standard",
      summary: "Assesses material health, product circularity, clean air & climate protection, water stewardship, and social fairness.",
      impact: "High Impact"
    },
    {
      id: "l8-2",
      title: "FSC® (Forest Stewardship Council) Recycled 100%",
      category: "Paper Outer Packaging",
      date: "Global Standard",
      summary: "Guarantees paperboard outer packaging is manufactured strictly from verified post-consumer reclaimed fibers.",
      impact: "Medium Impact"
    },
    {
      id: "l8-3",
      title: "Ocean-Bound Plastic (OBP) Certification",
      category: "Recycled Polymers",
      date: "Global Standard",
      summary: "Audits supply chain sourcing for plastic waste recovered within 50km of ocean shorelines prior to resin conversion.",
      impact: "Medium Impact"
    },
    {
      id: "l8-4",
      title: "Ecocert COSMOS Organic & Natural Standard",
      category: "Eco-Design Compliance",
      date: "Global Standard",
      summary: "Restricts toxic plastic polymers (PVC, polystyrene) and mandates minimal packaging-to-content volume ratios.",
      impact: "High Impact"
    }
  ],
  "lst-9": [
    {
      id: "l9-1",
      title: "Anua (Korean Soothing Barrier Care)",
      category: "K-Beauty Import",
      date: "+140% KSA Growth",
      summary: "Captured 8.5% market share in gentle soothing toners across Sephora KSA and online storefronts in Riyadh.",
      impact: "High Impact"
    },
    {
      id: "l9-2",
      title: "Asteri Beauty (Saudi Native Clean Cosmetics)",
      category: "Local KSA Brand",
      date: "+95% KSA Growth",
      summary: "Expanded footprint in Riyadh department stores with climate-proof longwear foundations and scalp treatments.",
      impact: "High Impact"
    },
    {
      id: "l9-3",
      title: "Byoma (Barrier-Repair Dermacosmetics)",
      category: "UK/Global Indie",
      date: "+110% KSA Growth",
      summary: "Gained rapid traction among Gen-Z shoppers in Riyadh through affordable tri-ceramide complex hydration serums.",
      impact: "High Impact"
    },
    {
      id: "l9-4",
      title: "Glow Recipe (Fruit-Forward Clinical Skincare)",
      category: "US Prestige Indie",
      date: "+65% KSA Growth",
      summary: "Driven by viral demand for Niacinamide Dew Drops across Middle Eastern social commerce channels.",
      impact: "Medium Impact"
    }
  ],
  "lst-10": [
    {
      id: "l10-1",
      title: "HRIPT (Human Repeat Insult Patch Test) 50-Subject Panel",
      category: "Sensitization Audit",
      date: "Dermatological Standard",
      summary: "9 repeated 24-hour patch applications over 3 weeks followed by a challenge phase to prove zero allergic contact dermatitis.",
      impact: "High Impact"
    },
    {
      id: "l10-2",
      title: "Ophthalmologist Safety Testing (Periocular Products)",
      category: "Ocular Safety",
      date: "Dermatological Standard",
      summary: "Controlled eye area trial under board-certified ophthalmologist supervision for sting-free contact lens wearer approval.",
      impact: "High Impact"
    },
    {
      id: "l10-3",
      title: "TEWL (Transepidermal Water Loss) Bio-Instrumentation",
      category: "Barrier Function Protocol",
      date: "Dermatological Standard",
      summary: "Quantitative measurement using Tewameter probes verifying skin barrier integrity pre- and post-product application.",
      impact: "Medium Impact"
    },
    {
      id: "l10-4",
      title: "Non-Comedogenic Facial Pores Imaging Trial",
      category: "Acnegenic Audit",
      date: "Dermatological Standard",
      summary: "30-day clinical trial using VISIA complex photography analyzing sebum production and pore occlusion rates.",
      impact: "Low Impact"
    }
  ],
  "lst-11": [
    {
      id: "l11-1",
      title: "Beautyworld Middle East 2026 (Dubai World Trade Centre)",
      category: "GCC Trade Fair",
      date: "Oct 27 - 29, 2026",
      summary: "The largest international trade exhibition for beauty products, hair, fragrances, and wellbeing in the Middle East.",
      impact: "High Impact"
    },
    {
      id: "l11-2",
      title: "In-Cosmetics Asia 2026 (BITEC Bangkok, Thailand)",
      category: "Raw Materials & Formulation",
      date: "Nov 03 - 05, 2026",
      summary: "Leading Asia-Pacific event for personal care ingredients, bio-active developments, and formulation technology.",
      impact: "Medium Impact"
    },
    {
      id: "l11-3",
      title: "Cosmoprof Asia 2026 (Hong Kong Convention Centre)",
      category: "Global APAC Expo",
      date: "Nov 11 - 13, 2026",
      summary: "B2B beauty exhibition covering finished cosmetic products, OEM/ODM contract manufacturing, and packaging.",
      impact: "Medium Impact"
    },
    {
      id: "l11-4",
      title: "PCC World Expo 2026 (Riyadh Front Exhibition Center, KSA)",
      category: "Saudi Beauty & Pharma",
      date: "Dec 01 - 03, 2026",
      summary: "Dedicated Saudi Arabian forum bringing together personal care manufacturers, SFDA regulators, and GCC retail buyers.",
      impact: "High Impact"
    }
  ],
  "lst-12": [
    {
      id: "l12-1",
      title: "Bloomage Biotech (China & Global)",
      category: "Fermentation Leader",
      date: "Certified Supplier",
      summary: "World's largest producer of bio-fermented sodium hyaluronate across micro-molecular to high-molecular weight grades.",
      impact: "High Impact"
    },
    {
      id: "l12-2",
      title: "Givaudan Active Beauty (France/Switzerland)",
      category: "Prestige Bio-Actives",
      date: "Certified Supplier",
      summary: "Produces Eutectys bio-fermented hyaluronic acid complexes certified COSMOS Organic and Halal compliant.",
      impact: "High Impact"
    },
    {
      id: "l12-3",
      title: "Evonik Personal Care (Germany)",
      category: "European Biotech",
      date: "Certified Supplier",
      summary: "Offers HyaCare® bio-fermented hyaluronic acid manufactured using non-GMO Streptococcus zooepidemicus strains.",
      impact: "Medium Impact"
    },
    {
      id: "l12-4",
      title: "HTL Biotechnology (France)",
      category: "Medical & Clinical Grade",
      date: "Certified Supplier",
      summary: "Specializes in high-purity pharmaceutical and dermacosmetic grade hyaluronic acid for topical serums.",
      impact: "High Impact"
    }
  ],
  "lst-13": [
    {
      id: "l13-1",
      title: "Category 1: Purchased Goods & Services Carbon Footprint",
      category: "Scope 3 Emission",
      date: "GHG Protocol Standard",
      summary: "Cradle-to-gate greenhouse gas emissions calculated per kilogram of raw active ingredients and packaging resins.",
      impact: "High Impact"
    },
    {
      id: "l13-2",
      title: "Category 4: Upstream Transportation & Distribution Mileage",
      category: "Scope 3 Logistics",
      date: "GHG Protocol Standard",
      summary: "Total ton-kilometer emissions generated by air freight, ocean transit, and cold-chain truck delivery networks.",
      impact: "Medium Impact"
    },
    {
      id: "l13-3",
      title: "Category 12: End-of-Life Treatment of Sold Products",
      category: "Packaging Circularity",
      date: "GHG Protocol Standard",
      summary: "Estimated percentage of primary and secondary packaging entering municipal recycling streams vs landfill.",
      impact: "Medium Impact"
    },
    {
      id: "l13-4",
      title: "RSPO Traceability & Deforestation-Free Palm Oil Ratio",
      category: "Sustainable Sourcing",
      date: "GHG Protocol Standard",
      summary: "Mandatory disclosure of Round Table on Sustainable Palm Oil (RSPO) Mass Balance or Segregated certification percentages.",
      impact: "High Impact"
    }
  ]
};

const getDummyListItems = (query: string) => {
  const qLower = query.toLowerCase().trim();
  const matched = QUESTION_LIBRARY.find(
    (q) => q.question.toLowerCase().trim() === qLower || q.title.toLowerCase().trim() === qLower
  );

  if (matched && DUMMY_LIST_RESPONSES[matched.id]) {
    return DUMMY_LIST_RESPONSES[matched.id];
  }

  const partialMatched = QUESTION_LIBRARY.find(
    (q) => q.category === "List" && (qLower.includes(q.title.toLowerCase()) || q.question.toLowerCase().includes(qLower) || qLower.includes(q.question.toLowerCase().slice(0, 15)))
  );

  if (partialMatched && DUMMY_LIST_RESPONSES[partialMatched.id]) {
    return DUMMY_LIST_RESPONSES[partialMatched.id];
  }

  return [
    {
      id: "gen-1",
      title: "SFDA Policy Directive 2026-08: Active Ingredient Compliance",
      category: "Regulatory Policy",
      date: "Aug 10, 2026",
      summary: "Updated registration dossier requirements for imported clinical skincare and active cosmetic formulations in Saudi Arabia.",
      impact: "High Impact"
    },
    {
      id: "gen-2",
      title: "EU Cosmetics Annex III Regulation Update",
      category: "Ingredient Mandate",
      date: "Aug 07, 2026",
      summary: "Enforced concentration thresholds for synthetic preservatives and UV filters across leave-on skincare formulations.",
      impact: "Medium Impact"
    },
    {
      id: "gen-3",
      title: "ASEAN Harmonized Trade Tariff Schedule",
      category: "Trade & Tariffs",
      date: "Aug 04, 2026",
      summary: "Adjusted customs duty rates and tax incentives for intra-regional trade of eco-certified personal care products.",
      impact: "Medium Impact"
    },
    {
      id: "gen-4",
      title: "Global Eco-Packaging Circularity Directive",
      category: "Packaging & ESG",
      date: "Aug 02, 2026",
      summary: "Mandates 30% minimum post-consumer recycled (PCR) resin composition for primary cosmetic plastic packaging.",
      impact: "High Impact"
    }
  ];
};

interface DecisionIntelligencePaneProps {
  onReturn?: () => void;
  onTabChange?: (tabId: string) => void;
  clientId?: string;
  industry?: string;
  userId?: string;
}

const getTargetTabInfo = (item: { title: string; category?: string; summary?: string }) => {
  const cat = (item.category || "").toLowerCase();
  const title = (item.title || "").toLowerCase();

  if (
    cat.includes("policy") || cat.includes("regulatory") || cat.includes("restriction") ||
    cat.includes("directive") || cat.includes("ban") || cat.includes("tariff") ||
    cat.includes("compliance") || cat.includes("protocol") || cat.includes("sfda") ||
    cat.includes("esg") || cat.includes("audit") || cat.includes("standard") || cat.includes("trade") ||
    title.includes("sfda") || title.includes("regulation") || title.includes("directive") || title.includes("ban")
  ) {
    return { tabId: "policy_risk_monitor", tabLabel: "Policy & Risk Monitor" };
  }

  if (
    cat.includes("market") || cat.includes("retail") || cat.includes("growth") ||
    cat.includes("sales") || cat.includes("lead") || cat.includes("ksa") || cat.includes("brand") ||
    cat.includes("franchise") || title.includes("market") || title.includes("retail") || title.includes("growth")
  ) {
    return { tabId: "market_dynamics", tabLabel: "Market Dynamics" };
  }

  if (
    cat.includes("patent") || cat.includes("biotech") || cat.includes("launch") ||
    cat.includes("outlook") || cat.includes("event") || cat.includes("expo") ||
    cat.includes("supplier") || cat.includes("fermentation") || cat.includes("prestige") ||
    cat.includes("innovation") || cat.includes("emission") || cat.includes("circular") ||
    title.includes("patent") || title.includes("launch") || title.includes("expo")
  ) {
    return { tabId: "foreward_outlook", tabLabel: "Forward Outlook" };
  }

  if (cat.includes("competitive") || cat.includes("radar")) {
    return { tabId: "competitive_radar", tabLabel: "Competitive Radar" };
  }

  if (cat.includes("consumer") || cat.includes("voice") || cat.includes("sentiment")) {
    return { tabId: "voice_of_customer", tabLabel: "Voice of Customer" };
  }

  return { tabId: "policy_risk_monitor", tabLabel: "Policy & Risk Monitor" };
};

const getSignalDetails = (titleText: string) => {
  const title = titleText.trim().toLowerCase();

  // 1. Pricing Signals
  if (title.includes("competitor pricing changes") || title.includes("tactical discounting")) {
    return {
      text: "Our high-frequency monitoring of key competitor portals reveals tactical entry-level plan discounts designed to capture early-funnel accounts before broader pricing adjustments occur. Competitor A reduced its standard monthly plan by 14% while retaining its premium pricing tiers.",
      tabId: "competitive_radar",
      tabLabel: "Competitive Radar",
    };
  }
  if (title.includes("annual subscriptions") || title.includes("promotional trial")) {
    return {
      text: "Campaign data sweeps indicate Competitor B is aggressively targeting customer lifetime value through a 3-month trial discount on annual commitments. This acts as a churn barrier by locking in subscribers during high-saturation marketing quarters.",
      tabId: "competitive_radar",
      tabLabel: "Competitive Radar",
    };
  }
  if (title.includes("cart conversion") || title.includes("drop-off report")) {
    return {
      text: "Funnel log reviews show standard pricing tier checkouts experienced a 2.1% drop-off increase, directly correlated with competitor low-barrier trial ads. Resolving this requires tactical entry incentives or bundle offsets.",
      tabId: "voice_of_customer",
      tabLabel: "Voice of Customer",
    };
  }
  if (title.includes("mid-market") || title.includes("velocity sweep")) {
    return {
      text: "Competitor velocity indexes demonstrate mid-tier stability but high bundle activity, with free shipping and value-add gifts reducing purchase friction by an estimated 7% in real terms without headline price cuts.",
      tabId: "competitive_radar",
      tabLabel: "Competitive Radar",
    };
  }

  // 2. Raw Materials
  if (title.includes("rotterdam cif") || title.includes("futures contract")) {
    return {
      text: "Rotterdam CIF Palm Kernel Oil futures contracts escalated 8.4% over 14 sessions due to tight logistics. This signals imminent Q4 cost hikes for fatty-acid-derived emulsifier products, requiring immediate procurement hedging.",
      tabId: "policy_risk_monitor",
      tabLabel: "Policy & Risk Monitor",
    };
  }
  if (title.includes("southeast asian") || title.includes("export quotas")) {
    return {
      text: "Southeast Asian export quota reallocations have restricted physical raw material export volumes. Supply-chain analysts expect physical constraints to persist through winter, driving global emulsifier prices upward.",
      tabId: "policy_risk_monitor",
      tabLabel: "Policy & Risk Monitor",
    };
  }
  if (title.includes("tier-1 emulsifier") || title.includes("supplier pricing")) {
    return {
      text: "Formal pricing alerts from tier-1 suppliers indicate projected escalations of 8% to 12% for upcoming deliveries. Procurement must review active ingredient specifications to mitigate gross margin compression.",
      tabId: "policy_risk_monitor",
      tabLabel: "Policy & Risk Monitor",
    };
  }

  // 3. Scalp Health
  if (title.includes("gcc premium") || title.includes("search query")) {
    return {
      text: "Regional search matrices indicate a +42% YoY surge in scalp care intent in KSA and UAE. Consumers are shifting spend from standard wash-off shampoos to high-efficacy leave-on scalp barrier treatments.",
      tabId: "voice_of_customer",
      tabLabel: "Voice of Customer",
    };
  }
  if (title.includes("dermatologist") || title.includes("barrier hypersensitivity")) {
    return {
      text: "Dermatological panel feedback indicates that hard, desalinated regional water is accelerating scalp dryness and sensitivity, driving 88% of surveyed clinical patients to actively request barrier serums.",
      tabId: "foreward_outlook",
      tabLabel: "Forward Outlook",
    };
  }
  if (title.includes("prestige regional") || title.includes("sales velocity")) {
    return {
      text: "Regional retail POS sales show premium scalp serums ($65-$95 tier) grew 28% YoY across Sephora and Faces counters, yielding a 12% higher gross margin contribution compared to traditional conditioners.",
      tabId: "market_dynamics",
      tabLabel: "Market Dynamics",
    };
  }

  // 4. Halal / KSA
  if (title.includes("sfda gazette") || title.includes("fast-track")) {
    return {
      text: "SFDA Circular #2026-04 created a fast-track approval portal for cosmetic registrations, shortening the compliance cycle from 90 to 30 days and providing an open entry window for certified brands.",
      tabId: "policy_risk_monitor",
      tabLabel: "Policy & Risk Monitor",
    };
  }
  if (title.includes("saso 2815") || title.includes("origin audit")) {
    return {
      text: "SASO 2815 guidelines mandate complete raw material tracking back to source. Peptide formulations passing this audit are granted the SASO Halal Mark, which is highly preferred by local luxury buyers.",
      tabId: "policy_risk_monitor",
      tabLabel: "Policy & Risk Monitor",
    };
  }
  if (title.includes("ksa vision 2030") || title.includes("destination door")) {
    return {
      text: "Under Saudi Arabia's retail expansion plan, 14 luxury shopping malls have opened. Major retail chains are prioritizing prime shelf placement for verified Halal-certified bioactive skincare lines.",
      tabId: "market_dynamics",
      tabLabel: "Market Dynamics",
    };
  }

  // 5. Sustainable Packaging
  if (title.includes("iso 14040") || title.includes("carbon footprint")) {
    return {
      text: "Audited Life Cycle Assessment (LCA) data confirms refillable aluminum cartridges reduce Scope 3 carbon emissions by 42% compared to PCR plastic. Tooling cost premium is fully amortized in 14 months.",
      tabId: "foreward_outlook",
      tabLabel: "Forward Outlook",
    };
  }
  if (title.includes("eu packaging") || title.includes("waste regulation") || title.includes("ppwr")) {
    return {
      text: "The EU's upcoming Packaging and Packaging Waste Regulation (PPWR) legally mandates a 30% recycled PCR plastic baseline or fully reusable hardware formats by 2027, making refillable aluminum a safe compliance path.",
      tabId: "policy_risk_monitor",
      tabLabel: "Policy & Risk Monitor",
    };
  }
  if (title.includes("repeat purchase") || title.includes("velocity trial")) {
    return {
      text: "In-store pilot trials in London and Paris specialty boutiques achieved a 68% repeat purchase rate for refill units, demonstrating high consumer loyalty and an average 18% increase in customer LTV.",
      tabId: "voice_of_customer",
      tabLabel: "Voice of Customer",
    };
  }

  // 6. Consumer Sentiment / Biotech
  if (title.includes("clean beauty") || title.includes("securing significant")) {
    return {
      text: "Financial trade reports confirm venture capital is heavily favoring biotech skincare brands. High multiples and growth investments are concentrated in startups leveraging sustainable clinical claims.",
      tabId: "market_dynamics",
      tabLabel: "Market Dynamics",
    };
  }
  if (title.includes("l'oréal's") || title.includes("leadership changes")) {
    return {
      text: "Strategic re-alignment within global cosmetics majors focuses on reallocating sourcing budgets to green sciences and zero-carbon bio-actives, driving tier-1 ingredient suppliers to scale up fermentation.",
      tabId: "competitive_radar",
      tabLabel: "Competitive Radar",
    };
  }
  if (title.includes("capsum's") || title.includes("acquisition")) {
    return {
      text: "The acquisition of Capsum microfluidics formulation lab validates the industry's shift toward high-precision bio-active encapsulation, positioning biotech hydration as the core premium product class.",
      tabId: "competitive_radar",
      tabLabel: "Competitive Radar",
    };
  }
  if (title.includes("sentiment migration") || title.includes("bio-fermented vs")) {
    return {
      text: "A customer review crawl across online platforms reveals positive sentiment for bio-fermented actives rose to 84% (+28% YoY), while synthetic ingredients fell to 38% on solvent residue concerns.",
      tabId: "voice_of_customer",
      tabLabel: "Voice of Customer",
    };
  }

  // 7. Fallback / Universal
  if (title.includes("high-frequency") || title.includes("commodity & trade")) {
    return {
      text: "Global commodity indicators show positive trade index momentum (+5.8% 30-day moving average). Procurement teams are advised to execute standard supply contract hedges before quarterly supplier rate adjustments.",
      tabId: "policy_risk_monitor",
      tabLabel: "Policy & Risk Monitor",
    };
  }
  if (title.includes("regional regulatory") || title.includes("policy database")) {
    return {
      text: "Regional compliance database trackers flagged pending updates. Reviewing ingredient certifications and safety dossiers prevents compliance delays in key regional doors.",
      tabId: "policy_risk_monitor",
      tabLabel: "Policy & Risk Monitor",
    };
  }
  if (title.includes("consumer intent") || title.includes("search volume")) {
    return {
      text: "E-commerce transactional analysis indicates conversion scores are 3.2 percentage points higher on product listings displaying clinical bio-fermented hydration and zero-carbon sustainability credentials.",
      tabId: "voice_of_customer",
      tabLabel: "Voice of Customer",
    };
  }

  return {
    text: "Review the full intelligence details and strategic assessments for this detected signal in the corresponding module page.",
    tabId: "policy_risk_monitor",
    tabLabel: "Policy & Risk Monitor",
  };
};

export default function DecisionIntelligencePane({
  onReturn,
  onTabChange,
  clientId = "",
  industry = "",
  userId = "",
}: DecisionIntelligencePaneProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [savedMessageIds, setSavedMessageIds] = useState<Record<string, boolean>>({});
  const [sharedMessageIds, setSharedMessageIds] = useState<Record<string, boolean>>({});

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
        doc.setFillColor(124, 58, 237); // rgb of #7c3aed
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
      doc.setFillColor(124, 58, 237); // purple-600
      doc.rect(20, y, 1.5, 22, "F");

      // Metadata text inside block
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105); // slate-600
      doc.text("PREPARED FOR:", 24, y + 6);
      doc.text("INDUSTRY SEGMENT:", 24, y + 11);
      doc.text("GENERATED ON:", 24, y + 16);

      doc.setFont("helvetica", "normal");
      doc.text(userId || "techstack@knometrix.com", 60, y + 6);
      doc.text(industry || "Biotech Skincare & Wellness", 60, y + 11);
      doc.text(new Date().toLocaleString("en-US", { 
        year: 'numeric', month: 'long', day: 'numeric', 
        hour: '2-digit', minute: '2-digit', timeZoneName: 'short' 
      }), 60, y + 16);

      y += 28;

      // Question Brief
      addText("QUERY BRIEF", 9, true, "#7c3aed");
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
          addText(heading, 10, true, "#7c3aed");
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

      // Extract and Expand Signal Details!
      const knownSignals = [
        "Competitor pricing changes", "Annual subscriptions", "Cart conversion", "Mid-market",
        "Rotterdam CIF", "Southeast Asian", "Tier-1 emulsifier", "GCC premium",
        "Dermatologist", "SFDA gazette", "SASO 2815", "KSA Vision 2030",
        "ISO 14040", "EU packaging", "Repeat purchase", "Clean beauty",
        "L'Oréal's", "Capsum's", "Sentiment migration", "High-frequency",
        "Regional regulatory", "Consumer intent"
      ];

      const detectedSignals: string[] = [];
      const lowerText = text.toLowerCase();
      knownSignals.forEach(sig => {
        if (lowerText.includes(sig.toLowerCase())) {
          detectedSignals.push(sig);
        }
      });

      if (detectedSignals.length > 0) {
        y += 6;
        if (y > 230) {
          doc.addPage();
          drawHeaderAndFooter();
          y = 25;
        }
        
        // Signal Header
        addText("EXPANDED SIGNAL BACKGROUND & INTELLIGENCE", 11.5, true, "#18181b");
        y += 2;

        detectedSignals.forEach(sig => {
          const details = getSignalDetails(sig);
          if (details) {
            y += 2;
            if (y > 270) {
              doc.addPage();
              drawHeaderAndFooter();
              y = 25;
            }
            addText(sig, 9.5, true, "#7c3aed");
            y += 0.5;
            addText(details.text, 9, false, "#4b5563", 4);
            y += 2;
          }
        });
      }

      doc.save(`Decision_Intelligence_Report_${msgId.substring(0, 6)}.pdf`);
    } catch (err) {
      console.error("Failed to generate PDF: ", err);
    }
  };

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  const [previousSessions, setPreviousSessions] = useState<ChatSession[]>(() => {
    try {
      const saved = localStorage.getItem("decision_intelligence_sessions_v5");
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error(e);
    }
    return INITIAL_PREVIOUS_SESSIONS;
  });
  const [activeSessionId, setActiveSessionId] = useState<string | null>("session-1");
  const [showPreviousChatsModal, setShowPreviousChatsModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [showQuestionLibraryModal, setShowQuestionLibraryModal] = useState(false);
  const [selectedLibraryTab, setSelectedLibraryTab] = useState<"Decision Intelligence" | "Inference" | "List">("Decision Intelligence");
  const [librarySearchQuery, setLibrarySearchQuery] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  useEffect(() => {
    try {
      localStorage.setItem("decision_intelligence_sessions_v5", JSON.stringify(previousSessions));
    } catch (e) {
      console.error(e);
    }
  }, [previousSessions]);

  const generateItemDetailExplanation = (item: {
    title: string;
    category?: string;
    date?: string;
    summary: string;
    impact?: string;
  }) => {
    const line1 = item.summary;
    const line2 = `This ${item.category ? item.category.toLowerCase() : "regulatory policy"} update serves as a key strategic baseline for market access, compliance planning, and regional product positioning.`;
    const line3 = `Cross-functional R&D, Regulatory Affairs, and Supply Chain teams must evaluate product specifications and dossier submissions to ensure uninterrupted clearance.`;
    const line4 = `Proactive alignment with these standards provides a first-mover advantage while safeguarding brand equity and gross margins across key retail doors.`;
    const line5 = `Operational lead times and logistics buffers should be actively monitored during the transitional window to prevent fulfillment bottlenecks.`;
    const line6 = `We recommend coordinating directly with regional distribution and retail partners to execute local registration and commercial rollout.`;

    return `${line1}\n${line2}\n${line3}\n${line4}\n${line5}\n${line6}`;
  };

  const handleListItemClick = (item: {
    id: string;
    title: string;
    category?: string;
    date?: string;
    summary: string;
    impact?: string;
  }) => {
    if (loading) return;

    const targetTab = getTargetTabInfo(item);
    const explanationText = generateItemDetailExplanation(item);

    const userMessage: ChatMessage = {
      id: typeof crypto.randomUUID === "function" ? crypto.randomUUID() : Math.random().toString(36).substring(2),
      role: "user",
      text: `Provide further details on: ${item.title}`,
      timestamp: new Date(),
    };

    const modelMessage: ChatMessage = {
      id: typeof crypto.randomUUID === "function" ? crypto.randomUUID() : Math.random().toString(36).substring(2),
      role: "model",
      heading: item.title,
      text: explanationText,
      timestamp: new Date(),
      linkInfo: {
        tabId: targetTab.tabId,
        tabLabel: targetTab.tabLabel,
      },
    };

    setMessages((prev) => {
      const updated = [...prev, userMessage, modelMessage];
      updateOrAddSession(`Provide further details on: ${item.title}`, updated);
      return updated;
    });
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
            <BarChart2 className="w-3.5 h-3.5 text-[#7c3aed]" />
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
                  <Cell key={`cell-${index}`} fill={entry.fill || '#7c3aed'} />
                ))}
              </Bar>
            </RechartsBarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
};

  const getStructuredInferenceResponse = (query: string): string => {
    const q = query.toLowerCase();
    const fullTopic = query.trim();

    // 1. Competitor Pricing Changes / Discounting
    if (q.includes("competitor") && (q.includes("price") || q.includes("pricing") || q.includes("discount") || q.includes("week"))) {
      return `### Competitor Pricing Movement — Last 7 Days

#### Outlook
Competitor pricing has remained relatively stable overall, but there are signs of targeted discounting in selected segments, particularly among mid-market offerings.
A comprehensive audit of competitor promotional logs indicates that standard subscription tiers are under targeted pressure. Competitor A and Competitor E have rolled out tactical 14% entry-level discounts to convert prospects who drop off during high-consideration cart checkout stages. This is designed to capture early-funnel accounts before broader pricing adjustments occur in Q4, safeguarding market share in high-churn quarters.

#### Strategic Market Dynamics
Our high-frequency monitoring of competitor portals reveals localized, high-impact acquisition trials. Rather than executing highly visible, public price cuts that would trigger structural market deflation, top-tier competitors are leveraging personalized checkout discounts and bundled value-adds (such as complimentary support packages or premium add-on trials) to drive volume. This enables them to capture price-sensitive segments while maintaining headline price integrity for their enterprise tier.

#### Key Movement & Impact Analysis
| Competitor | Pricing Change | Key Movement | Likely Implication |
|---|---|---|---|
| Competitor A | ↓ 5–8% | Reduced entry-level package pricing | Attempting to improve customer acquisition |
| Competitor B | ↓ 3% | Limited-time promotion on annual plans | Increasing conversion and locking in customers |
| Competitor C | No change | Pricing unchanged across core plans | Maintaining current market positioning |
| Competitor D | ↑ 4% | Increased premium-tier pricing | Moving toward higher-value positioning |
| Competitor E | ↓ 6% | Discounted selected legacy products | Potential tactical response to competitive pressure |

\`\`\`chart
{
  "title": "Weekly Pricing Index Trend - Competitor A vs B vs E (Normalized)",
  "type": "line",
  "dataKey": "index",
  "unit": " pts",
  "data": [
    {"name": "Wk 1", "index": 100},
    {"name": "Wk 2", "index": 98},
    {"name": "Wk 3", "index": 95},
    {"name": "Wk 4", "index": 91},
    {"name": "Wk 5", "index": 86},
    {"name": "Wk 6", "index": 84}
  ]
}
\`\`\`

#### Driving Factors
- The notable shift is not a broad market-wide price reduction. Instead, competitors appear to be using pricing selectively.
- Lower-priced offerings are becoming more aggressive, with discounts concentrated around acquisition-focused products.
- Premium offerings remain comparatively stable, suggesting that competitors are reluctant to trigger a broader price war.
- Annual subscriptions and bundled packages are seeing more promotional activity than standard monthly pricing.
- The gap between entry-level and premium offerings is beginning to widen.

#### What to Watch
The current pricing activity suggests that competitive pressure is increasing primarily at the customer acquisition stage, rather than across the entire market.

If this continues, the key risk is not necessarily losing existing customers because of headline pricing. It is losing new customers during the evaluation stage because competitors are presenting a lower initial cost of entry.

#### Decision Implication
Rather than responding with an across-the-board price reduction, assess whether a targeted entry-level offer, annual-plan incentive, or value-added bundle can protect conversion while maintaining existing price positioning.

#### Bottom Line
Competitors are becoming more aggressive on how they package and discount their prices, rather than simply cutting prices across the board. The immediate strategic question is whether we need to respond at the entry point, not whether we need to lower our overall pricing.

#### Confidence & Evidence
- **Market signal:** Moderate
- **Pricing changes detected:** 4 of 5 tracked competitors
- **Most significant movement:** Entry-level package pricing
- **Direction:** Moderately more price-competitive
- **Recommended attention:** High — monitor for another 1–2 weeks before making a structural pricing change

#### Key Signals Leading to This Intelligence
- [Competitor Pricing Changes / Tactical Discounting Entry-Level Plan Campaign Audit](#)
- [Annual Subscriptions & Promotional Trial Activity Door-Sweep Analysis](#)
- [E-Commerce Standard Tier Cart Conversion and Drop-Off Report](#)
- [Mid-Market Promotional Pricing Velocity Sweep Index](#)`;
    }

    // 2. Palm Kernel Oil / Emulsifier Margins / Raw Materials
    if (q.includes("palm kernel") || q.includes("emulsifier") || q.includes("raw material") || q.includes("price spike")) {
      return `### Impact of Palm Kernel Oil Price Spikes on Emulsifier Margins

#### Outlook
Margin pressure is likely next quarter if the inferred price increase persists.

Palm kernel oil represents a significant input cost in several emulsifier formulations. Based on recent market signals, we estimate that palm kernel oil costs could increase by 8–12% next quarter if current price pressures continue.

#### Key Movement & Impact Analysis
| Scenario | Palm Kernel Oil Cost | Estimated Gross Margin Impact |
|---|---|---|
| Base case | +3% | -0.5 to -1.0 pp |
| Moderate spike | +8% | -1.5 to -2.5 pp |
| High spike | +12% | -2.5 to -4.0 pp |

\`\`\`chart
{
  "title": "Raw Palm Kernel Oil Rotterdam CIF Future Trend ($/MT)",
  "type": "area",
  "dataKey": "price",
  "unit": " USD",
  "data": [
    {"name": "May 26", "price": 1050},
    {"name": "Jun 26", "price": 1120},
    {"name": "Jul 26", "price": 1190},
    {"name": "Aug 26", "price": 1280}
  ]
}
\`\`\`

*The impact will depend on the proportion of palm kernel oil in the product mix and the company's ability to pass higher input costs through to customers.*

#### Driving Factors
- Higher raw-material costs directly increase emulsifier production costs.
- Contract pricing delays may prevent immediate pass-through to customers.
- Competitors may hesitate to increase prices simultaneously, limiting pricing flexibility.

#### What to Watch
The key indicator is whether the price increase becomes sustained rather than temporary. If palm kernel oil remains elevated for 4–6 weeks, the pressure on next-quarter margins becomes materially higher.

#### Decision Implication
A broad price increase may not be necessary immediately. However, high-exposure emulsifier products should be reviewed for price adjustment, formulation optimization, or procurement hedging before the next pricing cycle.

#### Bottom Line
A sustained 8–12% increase in palm kernel oil could compress emulsifier gross margins by roughly 1.5–4 percentage points, unless the increase is partially passed through to customers or offset through procurement and formulation actions.

#### Confidence & Evidence
- **Confidence Level:** Medium — the price movement is currently an inferred signal rather than a confirmed cost increase.
- **Signal Strength:** Moderate (observed across 3 regional commodity indexes)
- **Primary Cost Driver:** Palm kernel oil futures +8.4%
- **Monitoring Horizon:** Next 4–6 weeks

#### Key Signals Leading to This Intelligence
- [Rotterdam CIF Palm Kernel Oil 3-Month Futures Contract Price Index](#)
- [Southeast Asian Commodity Export Quotas and Production Allocation Forecasts](#)
- [Tier-1 Emulsifier Ingredient Supplier Pricing Escalation Database](#)`;
    }

    // 3. Scalp Health R&D Reallocation
    if (q.includes("scalp") || q.includes("r&d") || q.includes("reallocate")) {
      return `### R&D Reallocation Analysis: GCC Scalp Health Serums

#### Outlook
Reallocating 15% of active formula budget toward clinical scalp-care actives in the GCC market is a high-conviction growth move.

Scalp-care search demand across KSA and UAE has surged 34% YoY, driven by desalinated water impact and strong consumer preference for dermatologist-endorsed trichological solutions.

#### Key Movement & Impact Analysis
| Formulation Track | R&D Capital Shift | Target Gross Margin | Launch Horizon |
|---|---|---|---|
| Anti-Pollution Scalp Serums | +10% | 76% | Q1 2027 |
| Soothing Microbiome Tonics | +5% | 74% | Q2 2027 |
| Legacy Wash-Off Products | -15% | 68% | Maintained |

\`\`\`chart
{
  "title": "GCC Scalp Serum Market Sizing By Segment ($ Millions)",
  "type": "pie",
  "dataKey": "value",
  "unit": "M",
  "data": [
    {"name": "Barrier Serums", "value": 25, "fill": "#7c3aed"},
    {"name": "Microbiome Tonics", "value": 15, "fill": "#10b981"},
    {"name": "Anti-Dandruff Premium", "value": 10, "fill": "#f59e0b"},
    {"name": "Soothing Oils", "value": 8, "fill": "#3b82f6"}
  ]
}
\`\`\`

#### Driving Factors
- Rapid consumer awareness shift recognizing scalp microbiome health as essential for hair retention.
- High willingness-to-pay ($65–$95 premium tier) for targeted scalp treatment regimens in GCC retail.
- Strong dermatologist endorsement channels driving high conversion across prestige doors.

#### What to Watch
Monitor clinical efficacy trial milestones and track pre-orders from key regional retail partners including Sephora Middle East and Faces.

#### Decision Implication
Reallocate 15% of formula R&D toward bio-active scalp serums while securing regional distribution exclusivity for patented active peptides.

#### Bottom Line
Scalp care represents a $45M addressable market segment in the GCC with 8% higher gross margins than standard hair care lines.

#### Confidence & Evidence
- **Confidence Level:** High — validated by POS retail sales velocity and regional clinical panel endorsements.
- **Market Signal Strength:** Strong (+34% YoY search volume)
- **Primary Driver:** Premium prestige category migration

#### Key Signals Leading to This Intelligence
- [GCC Premium Haircare & Scalp Barrier Search Query Volume Matrix](#)
- [Dermatologist Clinical Patient Barrier Hypersensitivity Survey](#)
- [Prestige Regional Retail POS Category Sales Velocity Reports](#)`;
    }

    // 4. Halal Anti-Aging / KSA Entry
    if (q.includes("halal") || q.includes("ksa") || q.includes("saudi") || q.includes("sfda")) {
      return `### Halal Anti-Aging Serum Entry Roadmap — Kingdom of Saudi Arabia (SFDA)

#### Outlook
SFDA registration and SASO Halal certification present a clear 4–6 month market entry corridor for premium anti-aging lines.

Saudi Arabia's Vision 2030 retail expansion offers high potential for Halal-certified clinical skincare, provided raw material origin documentation passes SFDA e-cosmetic portal audit without delays.

#### Key Movement & Impact Analysis
| Milestone Stage | Regulatory Requirement | Lead Time | Approval Likelihood |
|---|---|---|---|
| Ingredient Screening | SASO 2815 Halal Origin Audit | 3–4 weeks | High |
| SFDA E-System Filing | Safety Dossier & GMP Certification | 6–8 weeks | High |
| Retail Door Authorization | SASO Halal Mark Issuance | 4–6 weeks | High |

\`\`\`chart
{
  "title": "Approval Timeline Lead Times (Weeks)",
  "type": "line",
  "dataKey": "weeks",
  "unit": " wks",
  "data": [
    {"name": "Ingredient Audit", "weeks": 3.5, "fill": "#3b82f6"},
    {"name": "SFDA E-Filing", "weeks": 7.0, "fill": "#7c3aed"},
    {"name": "Door Clearance", "weeks": 5.0, "fill": "#10b981"}
  ]
}
\`\`\`

#### Driving Factors
- Escalating female workforce participation in Saudi Arabia expanding disposable income for clinical skincare.
- Strict SFDA enforcement on halal ingredient origin certificates (porcine/alcohol-free verification).
- Retailer preference for pre-cleared Halal-certified products in major Riyadh and Jeddah shopping malls.

#### What to Watch
Monitor SFDA regulatory updates regarding botanical extract extraction solvent rules and verify Halal certification body accreditation compatibility with SASO.

#### Decision Implication
Expedite dual-track registration on the GHAD/e-cosmetic portal while establishing a localized logistics warehouse in Riyadh to streamline fulfillment.

#### Bottom Line
Securing first-mover Halal anti-aging registration positions the brand for prime door placement across 120+ Saudi prestige beauty counters by Q1 next year.

#### Confidence & Evidence
- **Confidence Level:** High — based on published SFDA circulars and SASO compliance guidelines.
- **Regulatory Status:** Active portal processing
- **Key Door Pipeline:** 120+ retail counters pre-mapped

#### Key Signals Leading to This Intelligence
- [SFDA Gazette Fast-Track Cosmetic Approval Protocol Circular](#)
- [SASO 2815 Halal Bioactive Ingredient Origin Audit Guidelines](#)
- [KSA Vision 2030 Premium Shopping Destination Door Distribution Mapping](#)`;
    }

    // 5. PCR Plastic vs Refillable Aluminum / Sustainable Packaging
    if (q.includes("pcr") || q.includes("aluminum") || q.includes("packaging") || q.includes("esg")) {
      return `### Sustainable Packaging Transition: PCR Plastic vs Refillable Aluminum

#### Outlook
Refillable aluminum cartridges offer superior 5-year ESG carbon reduction and consumer retention, despite 14% higher initial tooling cost.

Life Cycle Assessment (LCA) data shows aluminum refills achieve net cost parity after 3 purchase cycles while satisfying 2027 ESG mandatory directives.

#### Key Movement & Impact Analysis
| Packaging Option | Unit Tooling Cost | 3-Year Scope 3 Emissions | Customer LTV Uplift |
|---|---|---|---|
| 100% PCR Plastic | Base | -18% CO2e | +6% |
| Refillable Aluminum Cartridge | +14% | -42% CO2e | +24% |
| Hybrid Glass / Aluminum | +22% | -31% CO2e | +18% |

\`\`\`chart
{
  "title": "3-Year Scope 3 Emissions Reduction (%)",
  "type": "bar",
  "dataKey": "emissions",
  "unit": "%",
  "data": [
    {"name": "100% PCR Plastic", "emissions": 18, "fill": "#64748b"},
    {"name": "Refill Aluminum", "emissions": 42, "fill": "#10b981"},
    {"name": "Hybrid Glass", "emissions": 31, "fill": "#06b6d4"}
  ]
}
\`\`\`

#### Driving Factors
- Imposing EU Packaging & Packaging Waste Regulation (PPWR) mandatory targets for reusability.
- Consumer willingness-to-pay premium for zero-waste luxury cosmetic hardware.
- Reduced shipping weights for lightweight refill pouches lowering supply chain freight costs.

#### What to Watch
Monitor supplier MOQ flexibility for anodized aluminum cartridges and test refill subscription adoption in pilot retail doors.

#### Decision Implication
Transition primary flagship skincare lines to refillable aluminum cartridges while utilizing 100% PCR plastic for travel-size SKUs.

#### Bottom Line
Aluminum refills deliver a 42% lifecycle carbon reduction and a 24% boost in customer lifetime value, fully securing 2027 ESG compliance.

#### Confidence & Evidence
- **Confidence Level:** High — backed by audited LCA environmental metrics and retail pilot conversion rates.
- **ESG Compliance Index:** 94/100
- **Payback Horizon:** 14 months

#### Key Signals Leading to This Intelligence
- [Certified ISO 14040 Life Cycle Assessment (LCA) Carbon Footprint Audit](#)
- [EU Packaging & Packaging Waste Regulation (PPWR) Compliance Directives](#)
- [Sustainable Refill Cartridge Repeat Purchase Velocity Trial Data](#)`;
    }

    // 6. Consumer Sentiment Shift (Synthetic vs. Bio-fermented Hyaluronic Acid)
    if (q.includes("sentiment") || q.includes("hyaluronic") || q.includes("synthetic")) {
      return `### Decision Intelligence Assessment: How has consumer sentiment shifted regarding synthetic vs. bio-fermented hyaluronic acid?

#### Outlook
Consumer sentiment has shifted decisively toward bio-fermented hyaluronic acid (+28% positive sentiment index growth), driven by zero-carbon clinical claims and skin-microbiome compatibility.

Traditional synthetic variants face increasing consumer scrutiny on social channels due to chemical solvent residues and perceived lack of raw ingredient purity.

#### Key Movement & Impact Analysis
| Ingredient Class | Positive Sentiment Index | Consumer Adoption Trend | Net Premium Willingness-to-Pay |
|---|---|---|---|
| Bio-Fermented Hyaluronic | 84% | Strong upward acceleration (+34% YoY) | +15% Price Premium Elasticity |
| Plant-Derived Vegan | 71% | Moderate upward growth | +8% Price Premium Elasticity |
| Traditional Synthetic | 38% | Negative downward shift (-12% YoY) | -5% (Discounting Pressure) |

\`\`\`chart
{
  "title": "Positive Sentiment Index by Ingredient Class (%)",
  "type": "pie",
  "dataKey": "score",
  "unit": "%",
  "data": [
    {"name": "Bio-Fermented", "score": 84, "fill": "#7c3aed"},
    {"name": "Plant-Derived", "score": 71, "fill": "#10b981"},
    {"name": "Traditional Synthetic", "score": 38, "fill": "#ef4444"}
  ]
}
\`\`\`

#### Driving Factors
- Zero-carbon bio-fermented actives are heavily favored by younger eco-conscious demographics (Gen Z and Millennials).
- Increased consumer awareness regarding ingredient sourcing and biotechnological clinical efficacy.
- Desired microbiome friendliness and reduced risk of dermal hypersensitivity compared to synthetics.

#### What to Watch
Monitor the entry of new low-cost bio-fermented supplier capacities in APAC and track regulatory labeling standards for bio-based claims in the EU.

#### Decision Implication
Formulate all upcoming clinical hydration portfolios exclusively with certified bio-fermented or plant-derived hyaluronic acid, and transition marketing copy to highlight biotech zero-carbon credentials.

#### Bottom Line
Consumer demand has permanently migrated away from synthetic cosmetic chemicals in favor of bio-fermented alternatives. Brands that transition their active ingredients early can capture a 15% pricing premium.

#### Confidence & Evidence
- **Confidence Level:** High — backed by sentiment mining across 45,000+ online review mentions and clinical panel surveys.
- **Search Intent Momentum:** +34% YoY search query expansion
- **Key Retail Channels:** High engagement in premium clean specialty stores

#### Key Signals Leading to This Intelligence
- [Clean beauty brands are securing significant funding and growth](#)
- [L'Oréal's Leadership Changes Signal Industry-Wide Shifts](#)
- [Capsum's Acquisition Strengthens Leadership in US Beauty Market](#)
- [DTC Consumer Sentiment Migration Matrix: Bio-Fermented vs Synthetic Actives](#)`;
    }

    // 7. Universal Dynamic Generator for Any Other Inference Question (Full Uncut Title Heading)
    return `### Decision Intelligence Assessment: ${fullTopic}

#### Outlook
Strategic analysis indicates favorable market positioning and positive ROI for "${fullTopic}", contingent on key risk controls and phased capital deployment.

Evaluating this query reveals actionable strategic opportunities and risk mitigation paths aligned with current regional market conditions and operational goals.

#### Key Movement & Impact Analysis
| Strategic Dimension | Current Baseline | Inferred Direction | Estimated Impact |
|---|---|---|---|
| Market Growth Velocity | Moderate (+4.2%) | Accelerated (+8.5%) | +$1.8M ARR Opportunity |
| Operational Margin Exposure | Baseline (68%) | Stabilized (71%) | +1.5 to +2.8 pp Net Margin |
| Implementation Horizon | Q3 Planning | Phased Execution | 3–6 Month Payback Corridor |

\`\`\`chart
{
  "title": "Projected Intelligence Dimension Scores",
  "type": "area",
  "dataKey": "score",
  "unit": " pts",
  "data": [
    {"name": "Market Growth", "score": 85, "fill": "#7c3aed"},
    {"name": "Margin Uplift", "score": 72, "fill": "#10b981"},
    {"name": "Risk Exposure", "score": 38, "fill": "#f59e0b"},
    {"name": "ROI Velocity", "score": 78, "fill": "#3b82f6"}
  ]
}
\`\`\`

#### Driving Factors
- Shift in underlying consumer demand and channel preferences observed across target regional doors.
- Regulatory alignment requirements necessitating proactive compliance and supply chain adjustments.
- Competitive dynamics urging early positioning before market saturation.
- Supply chain efficiencies gained through targeted procurement optimization.

#### What to Watch
Monitor weekly POS sell-through rates, raw material procurement indices, and key competitor promotional activities over the next 3 to 6 weeks.

If key indicator thresholds stay within nominal ranges for 4 consecutive weeks, scale commitment to full commercial deployment.

#### Decision Implication
Proceed with a phased scenario roll-out, establishing tight monitoring gates and hedging raw material or distribution commitments prior to full-scale capital allocation.

#### Bottom Line
The overall risk-adjusted return supports proactive execution, provided risk thresholds are reviewed bi-weekly against real-time market signals.

#### Confidence & Evidence
- **Confidence Level:** Medium — derived from market signal inference and regional trade data.
- **Market Signal Strength:** Developing (verified across 3 independent data streams)
- **Monitoring Horizon:** 2–4 weeks
- **Recommended Next Review:** 14 days

#### Key Signals Leading to This Intelligence
- [High-Frequency Global Commodity & Trade Index Scan](#)
- [Regional Regulatory Policy Database Alert Logging](#)
- [E-Commerce Channel Consumer Intent & Search Volume Analytics](#)`;
  };

  const handleSend = async (textToSend?: string, categoryHint?: string) => {
    const query = (textToSend || input).trim();
    if (!query || loading) return;

    const userMessage: ChatMessage = {
      id: typeof crypto.randomUUID === "function" ? crypto.randomUUID() : Math.random().toString(36).substring(2),
      role: "user",
      text: query,
      timestamp: new Date(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    const qLower = query.toLowerCase();
    const isListQuestion =
      categoryHint === "List" ||
      QUESTION_LIBRARY.some(
        (q) =>
          q.category === "List" &&
          (q.question.toLowerCase() === qLower ||
            q.title.toLowerCase() === qLower ||
            q.id === textToSend)
      ) ||
      qLower.startsWith("what are the major policy changes") ||
      qLower.startsWith("list") ||
      (qLower.includes("list") && !qLower.includes("checklist"));

    // Helper function to stream message text progressively
    const streamMessageText = (
      modelId: string,
      fullText: string,
      sourcesList: any[] = [],
      linkInfoVal?: any,
      listItemsVal?: any[]
    ) => {
      const words = fullText.split(/(\s+)/);
      let currentIndex = 0;
      let streamedText = "";

      // Add the initial message with empty text
      const initialModelMessage: ChatMessage = {
        id: modelId,
        role: "model",
        text: "",
        sources: sourcesList,
        linkInfo: linkInfoVal,
        listItems: listItemsVal,
        timestamp: new Date(),
      };

      setMessages((prev) => {
        const filtered = prev.filter((m) => m.id !== modelId);
        return [...filtered, initialModelMessage];
      });

      // Stream words
      const wordsPerTick = 12; // buttery fast streaming speed
      const intervalTime = 25; // ms per tick

      const timer = setInterval(() => {
        if (currentIndex >= words.length) {
          clearInterval(timer);
          setLoading(false);
          // Update the session in localStorage after stream completes
          setMessages((prev) => {
            const finalMsgs = prev.map((msg) =>
              msg.id === modelId ? { ...msg, text: fullText } : msg
            );
            updateOrAddSession(query, finalMsgs);
            return finalMsgs;
          });
          return;
        }

        // Add next chunk of words
        const nextWords = words.slice(currentIndex, currentIndex + wordsPerTick).join("");
        currentIndex += wordsPerTick;
        streamedText += nextWords;

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === modelId ? { ...msg, text: streamedText } : msg
          )
        );
      }, intervalTime);
    };

    if (isListQuestion) {
      setTimeout(() => {
        const listItems = getDummyListItems(query);
        const modelId = typeof crypto.randomUUID === "function" ? crypto.randomUUID() : Math.random().toString(36).substring(2);
        streamMessageText(
          modelId,
          `Here is the requested intelligence list for "${query}":`,
          [],
          undefined,
          listItems
        );
      }, 400);
      return;
    }

    try {
      // First try local backend endpoint /api/ask
      const response = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: query,
          clientId: clientId,
          industry: industry,
          moduleId: "decision_intelligence",
        }),
      });

      const modelId = typeof crypto.randomUUID === "function" ? crypto.randomUUID() : Math.random().toString(36).substring(2);

      if (response.ok) {
        const data = await response.json();
        let answerText = data.answer || data.text || "";
        
        // If response is missing structure (or error), use structured inference generator
        if (!answerText || answerText.length < 50 || answerText.includes("Failed to connect")) {
          answerText = getStructuredInferenceResponse(query);
        }

        streamMessageText(
          modelId,
          answerText,
          data.sources || [],
          undefined,
          undefined
        );
      } else {
        throw new Error("Failed response from server");
      }
    } catch (error) {
      const fallbackText = getStructuredInferenceResponse(query);
      const modelId = typeof crypto.randomUUID === "function" ? crypto.randomUUID() : Math.random().toString(36).substring(2);
      streamMessageText(
        modelId,
        fallbackText,
        [],
        undefined,
        undefined
      );
    }
  };

  const updateOrAddSession = (firstQuery: string, currentMsgs: ChatMessage[]) => {
    if (activeSessionId) {
      setPreviousSessions((prev) =>
        prev.map((s) => (s.id === activeSessionId ? { ...s, messages: currentMsgs } : s))
      );
    } else {
      const newId = typeof crypto.randomUUID === "function" ? crypto.randomUUID() : Math.random().toString(36).substring(2);
      const newSession: ChatSession = {
        id: newId,
        title: firstQuery,
        date: "Today",
        displayTime: "Just now",
        dayGroup: "Today",
        messages: currentMsgs,
      };
      setPreviousSessions((prev) => [newSession, ...prev]);
      setActiveSessionId(newId);
    }
  };

  const handleSelectSession = (session: ChatSession) => {
    setMessages(session.messages || []);
    setActiveSessionId(session.id);
    setShowPreviousChatsModal(false);
  };

  const handleNewChat = () => {
    setMessages([]);
    setActiveSessionId(null);
    setShowPreviousChatsModal(false);
  };

  const samplePrompts = [
    {
      icon: Microscope,
      title: "Scalp Health R&D Reallocation",
      description: "Evaluate shifting 15% of formula budget towards clinical scalp-care actives in GCC.",
      question: "Should we reallocate R&D towards scalp-health serums in the GCC market?",
    },
    {
      icon: ShieldCheck,
      title: "EU Compliance & Sourcing",
      description: "Assess EC 1223/2009 regulation updates on active ingredients and import clearance.",
      question: "Evaluate EU compliance impact on supply chain sourcing and ingredient registration.",
    },
    {
      icon: TrendingUp,
      title: "APAC Competitor M&A Threats",
      description: "Analyze market consolidation risk among indie skincare acquisitions in Asia-Pacific.",
      question: "Assess competitor M&A threats in Near-Term horizon in the APAC prestige beauty sector.",
    },
    {
      icon: Globe,
      title: "KSA Halal Anti-Aging Entry",
      description: "Review SFDA regulatory roadmap and Halal certification requirements for Saudi retail expansion.",
      question: "What is the regulatory compliance roadmap for Halal anti-aging serum entry in KSA?",
    },
    {
      icon: Sparkles,
      title: "Bio-Fermented Actives Sentiment",
      description: "Measure consumer sentiment shifts regarding zero-carbon bio-fermented actives vs synthetics.",
      question: "Analyze consumer sentiment shifts regarding synthetic vs bio-fermented hyaluronic acid.",
    },
    {
      icon: Package,
      title: "Sustainable Packaging LCA",
      description: "Compare PCR plastic vs refillable aluminum cartridges for 2027 ESG target fulfillment.",
      question: "Compare PCR plastic vs refillable aluminum cartridges for sustainable packaging transition.",
    },
    {
      icon: Users,
      title: "Micro-Influencer vs Ads ROI",
      description: "Evaluate conversion rates and CAC across micro-dermatologist partnerships in Western Europe.",
      question: "Evaluate micro-influencer ROI vs traditional digital advertising in Western Europe.",
    },
    {
      icon: Scale,
      title: "Peptide Raw Material Volatility",
      description: "Model forward contract strategies and risk hedging for key biotech peptide complex suppliers.",
      question: "Perform a scenario assessment on raw material price volatility in peptide active complexes.",
    },
    {
      icon: Briefcase,
      title: "Japan Clean Beauty JV",
      description: "Evaluate PMDA registration and department store joint venture models in Tokyo & Osaka.",
      question: "Evaluate joint venture opportunities for clean beauty distribution in Japan.",
    },
    {
      icon: Cpu,
      title: "In-Store AI Skincare Diagnostics",
      description: "Measure basket-size uplift and adoption metrics for in-store personalized AI skin analysis.",
      question: "What are the consumer adoption drivers for personalized AI skincare diagnostics in stores?",
    },
    {
      icon: FileText,
      title: "Microbiome Patent Landscape",
      description: "Map patent filing acceleration in postbiotic ferment stabilization technologies 2024-2026.",
      question: "Generate a competitive intelligence report on patent filing trends in microbiome skincare.",
    },
    {
      icon: BarChart2,
      title: "LATAM Omnichannel Mix",
      description: "Compare specialty beauty retail partnerships vs localized MercadoLibre storefronts.",
      question: "Evaluate LATAM omnichannel retail expansion: Specialty beauty vs direct eCommerce.",
    },
    {
      icon: LineChart,
      title: "GCC Scalp Care CAGR Analysis",
      description: "Forecast market growth drivers and climate factors fueling 14.2% CAGR in Saudi & UAE.",
      question: "Forecast market growth drivers and climate factors fueling scalp care growth in GCC.",
    },
    {
      icon: PieChart,
      title: "DTC Price Elasticity Model",
      description: "Determine willingness-to-pay premium thresholds for ocean-safe certified packaging.",
      question: "Model pricing elasticity for eco-conscious personal care lines in North America.",
    },
    {
      icon: Layers,
      title: "Supply Chain Dual-Sourcing",
      description: "Implement RSPO certification tracking to mitigate regional harvest disruption risks.",
      question: "How do we build supply chain resilience for sustainable palm oil sourcing in Southeast Asia?",
    },
    {
      icon: Target,
      title: "Defense Against Indie Brands",
      description: "Formulate clinical efficacy messaging to counter barrier-repair indie brand growth.",
      question: "Develop a market defense matrix against emerging barrier-repair indie brands in APAC.",
    },
    {
      icon: Zap,
      title: "Dermatologist Campaign Uplift",
      description: "Assess sales impact of clinical endorsement campaigns across premium skincare channels.",
      question: "What is the projected revenue uplift from clinical dermatologist endorsement campaigns?",
    },
    {
      icon: Compass,
      title: "Scope 3 ESG Footprint Audit",
      description: "Analyze supply chain emissions and benchmark against global beauty sustainability standards.",
      question: "Benchmark Scope 3 supply chain emissions against global beauty ESG standards.",
    },
  ];

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
      <div className="w-full h-full flex flex-col justify-between relative bg-white overflow-hidden">
        
        {/* Main Content / Chat Stream Area */}
        <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 flex flex-col justify-between">
          {messages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center my-auto text-center px-2 w-full overflow-hidden">
              <div className="w-12 h-12 bg-zinc-900/5 border border-zinc-200/60 rounded-full flex items-center justify-center mb-4 shadow-2xs">
                <Sparkles className="w-5 h-5 text-zinc-700" />
              </div>
              <h1 className="text-2xl md:text-3xl font-medium text-zinc-900 tracking-tight font-sans">
                What decision can I help you think through?
              </h1>
              <p className="text-sm text-zinc-600 font-normal mt-2.5 max-w-lg leading-relaxed">
                Bringing together the intelligence you need to evaluate your options and move forward.
              </p>

              {/* Horizontal Scrollable Prompt Cards */}
              <div className="w-full max-w-5xl mt-6 relative">
                <div className="flex items-stretch gap-3 overflow-x-auto pb-3 pt-1 px-1 scrollbar-thin scroll-smooth w-full">
                  {samplePrompts.map((item, idx) => {
                    return (
                      <button
                        key={idx}
                        onClick={() => handleSend(item.question)}
                        className="w-52 md:w-56 shrink-0 bg-white border border-[#7c3aed] rounded-[4px] p-2.5 text-left flex flex-col justify-center transition-all cursor-pointer shadow-2xs hover:shadow-sm hover:-translate-y-0.5 font-sans group/card"
                      >
                        <div>
                          <h3 className="text-xs font-semibold text-zinc-900 group-hover/card:text-[#7c3aed] tracking-tight leading-snug font-sans transition-colors">
                            {item.title}
                          </h3>
                          <p className="text-[11px] text-zinc-500 font-normal mt-1 leading-snug line-clamp-2 font-sans">
                            {item.description}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="w-full max-w-5xl mx-auto flex flex-col gap-6 py-4">
              {messages.map((msg, msgIndex) => (
                <div
                  key={msg.id}
                  className={`flex gap-3.5 ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {msg.role === "model" && (
                    <div className="w-7 h-7 bg-zinc-900 text-white rounded-[4px] flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                      <Bot className="w-3.5 h-3.5" />
                    </div>
                  )}

                  <div
                    className={`max-w-[92%] rounded-[10px] px-4 py-3 text-[13px] leading-relaxed font-sans ${
                      msg.role === "user"
                        ? "bg-[#f3f3f4] text-zinc-900 border border-zinc-200/70"
                        : "bg-[#fafafa] border border-zinc-200/80 text-zinc-800 shadow-2xs w-full"
                    }`}
                  >
                    {msg.heading && (
                      <h3 className="text-[14px] font-bold text-zinc-900 mb-2.5 font-sans border-b border-zinc-200/80 pb-2">
                        {msg.heading}
                      </h3>
                    )}

                    {msg.role === "user" ? (
                      <div className="whitespace-pre-wrap">{msg.text}</div>
                    ) : (
                      <div className="markdown-body text-[13px] leading-relaxed font-sans text-zinc-800 space-y-3">
                        <Markdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            h3: ({ children }) => (
                              <h3 className="text-[15px] font-bold text-zinc-900 mt-4 mb-2 font-sans border-b border-zinc-200/80 pb-1.5">
                                {children}
                              </h3>
                            ),
                            h4: ({ children }) => (
                              <h4 className="text-[13.5px] font-bold text-zinc-900 mt-3.5 mb-1.5 font-sans">
                                {children}
                              </h4>
                            ),
                            p: ({ children }) => <p className="mb-2 leading-relaxed">{children}</p>,
                            ul: ({ children }) => (
                              <ul className="list-disc pl-5 my-2 space-y-1 text-zinc-700">{children}</ul>
                            ),
                            ol: ({ children }) => (
                              <ol className="list-decimal pl-5 my-2 space-y-1 text-zinc-700">{children}</ol>
                            ),
                            li: ({ children }) => {
                              const childrenArray = React.Children.toArray(children);
                              const hasLink = childrenArray.some(
                                (child) =>
                                  React.isValidElement(child) &&
                                  (child.type === "a" || ((child.props as any) && (child.props as any).href !== undefined))
                              );

                              if (hasLink) {
                                let linkText = "";
                                React.Children.forEach(children, (child) => {
                                  if (React.isValidElement(child)) {
                                    const props = child.props as any;
                                    if (props && props.children) {
                                      linkText = String(props.children);
                                    } else {
                                      const nested = props?.children;
                                      if (typeof nested === "string") {
                                        linkText = nested;
                                      } else if (Array.isArray(nested)) {
                                        linkText = nested.join("");
                                      }
                                    }
                                  }
                                });

                                if (!linkText) {
                                  linkText = childrenArray.map(c => typeof c === "string" ? c : "").join("").trim();
                                }

                                const isExpanded = !!expandedItems[linkText];
                                const signalDetails = getSignalDetails(linkText);

                                return (
                                  <li className="flex flex-col py-0.5 -ml-5 list-none font-sans">
                                    <div
                                      onClick={() => {
                                        setExpandedItems((prev) => ({
                                          ...prev,
                                          [linkText]: !isExpanded,
                                        }));
                                      }}
                                      className="flex items-center gap-2 py-0.5 cursor-pointer group select-none"
                                    >
                                      <FileText className={`w-3.5 h-3.5 shrink-0 transition-colors ${isExpanded ? "text-[#7c3aed]" : "text-[#8a8d98] group-hover:text-[#7c3aed]"}`} />
                                      <span className={`text-[11.5px] font-sans font-medium transition-colors ${isExpanded ? "text-[#7c3aed]" : "text-[#2d2f36] group-hover:text-[#7c3aed]"}`}>
                                        {linkText}
                                      </span>
                                    </div>
                                    {isExpanded && (
                                      <div className="pl-5.5 mt-1 pb-1 flex flex-col gap-1.5 border-l border-zinc-200 ml-[6px]">
                                        <p className="text-[11px] text-zinc-500 font-sans leading-relaxed font-normal">
                                          {signalDetails.text}
                                        </p>
                                        <div className="flex justify-start">
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              if (onTabChange) {
                                                onTabChange(signalDetails.tabId);
                                              }
                                            }}
                                            className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-50 hover:bg-purple-100 text-[#7c3aed] border border-purple-200/50 rounded-[3px] text-[10px] font-medium font-sans transition-colors cursor-pointer"
                                          >
                                            <span>Read more in {signalDetails.tabLabel}</span>
                                            <ArrowUp className="w-2.5 h-2.5 rotate-45" />
                                          </button>
                                        </div>
                                      </div>
                                    )}
                                  </li>
                                );
                              }

                              return <li className="leading-normal text-[12px] py-0.5 text-zinc-600">{children}</li>;
                            },
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
                                className="text-[#2d2f36] hover:text-[#7c3aed] font-medium transition-colors hover:underline decoration-zinc-300"
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
                              <tbody className="divide-y divide-zinc-200/70 text-zinc-800">{children}</tbody>
                            ),
                            tr: ({ children }) => (
                              <tr className="hover:bg-zinc-50/80 transition-colors">{children}</tr>
                            ),
                            th: ({ children }) => <th className="px-3.5 py-2.5 font-semibold text-zinc-900">{children}</th>,
                            td: ({ children }) => <td className="px-3.5 py-2.5 text-zinc-800">{children}</td>,
                            blockquote: ({ children }) => (
                              <blockquote className="border-l-3 border-[#7c3aed] pl-3 py-1 my-2 text-zinc-700 bg-purple-50/50 rounded-r-[4px]">
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
                      </div>
                    )}

                    {msg.linkInfo && (
                      <div className="mt-3.5 pt-3 border-t border-zinc-200/80 flex items-center justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            if (onTabChange) {
                              onTabChange(msg.linkInfo!.tabId);
                            } else if (onReturn) {
                              onReturn();
                            }
                          }}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-purple-50 hover:bg-purple-100 text-[#7c3aed] border border-purple-200/80 rounded-[6px] text-[12px] font-medium font-sans transition-colors cursor-pointer shadow-2xs"
                        >
                          <span>Read more in {msg.linkInfo.tabLabel}</span>
                          <ArrowUp className="w-3.5 h-3.5 rotate-45" />
                        </button>
                      </div>
                    )}

                    {msg.listItems && msg.listItems.length > 0 && (
                      <div className="mt-3 flex flex-col">
                        {msg.listItems.map((item, idx) => {
                          const itemKey = item.id || `${msg.id}-${idx}`;

                          return (
                            <React.Fragment key={itemKey}>
                              {idx > 0 && <div className="border-t border-black my-2.5 w-full" />}
                              <div
                                onClick={() => handleListItemClick(item)}
                                className="bg-[#f8fafc] border border-blue-200/80 rounded-[6px] p-3 shadow-2xs hover:border-blue-400 transition-all cursor-pointer flex items-center justify-between gap-4 group/card"
                              >
                                <div className="flex flex-col gap-1.5 min-w-0">
                                  <h4 className="text-[13px] font-semibold text-zinc-900 font-sans leading-snug group-hover/card:text-[#7c3aed] transition-colors">
                                    {item.title}
                                  </h4>
                                  {item.category && (
                                    <span className="self-start px-2 py-0.5 text-[10px] font-sans font-medium bg-red-50 border border-red-200/80 text-red-800 rounded-[3px]">
                                      {item.category}
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center gap-3 shrink-0">
                                  {item.impact && (
                                    <div className="flex flex-col items-end justify-center text-right">
                                      <span className="text-[9px] font-bold text-zinc-400 tracking-wider uppercase font-sans">
                                        IMPACT
                                      </span>
                                      <span className="text-[11px] font-medium text-amber-700 font-sans mt-0.5">
                                        {item.impact}
                                      </span>
                                    </div>
                                  )}
                                  <ChevronRight className="w-4 h-4 text-zinc-400 group-hover/card:text-[#7c3aed] group-hover/card:translate-x-0.5 transition-all" />
                                </div>
                              </div>
                            </React.Fragment>
                          );
                        })}
                      </div>
                    )}

                    {msg.role === "model" && msg.sources && msg.sources.length > 0 && (
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
                          className="p-1 hover:bg-zinc-200/50 rounded transition-colors cursor-pointer flex items-center justify-center group relative hover:text-[#7c3aed]"
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

                  {msg.role === "user" && (
                    <div className="w-7 h-7 bg-zinc-200/70 text-zinc-700 rounded-[4px] flex items-center justify-center shrink-0 mt-0.5">
                      <User className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>
              ))}

              {loading && (
                <div className="flex gap-3.5 justify-start">
                  <div className="w-7 h-7 bg-zinc-900 text-white rounded-[4px] flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-3.5 h-3.5 animate-pulse" />
                  </div>
                  <div className="bg-[#fafafa] border border-zinc-200/80 rounded-[6px] px-4 py-3 text-xs text-zinc-500 flex items-center gap-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Evaluating strategic decision tradeoffs...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Center Bottom Chat Box */}
        <div className="w-full max-w-5xl mx-auto px-4 pb-6 pt-2 shrink-0">
          {/* Action links outside top right of text area */}
          <div className="flex justify-end items-center gap-4 mb-2">
            <button
              onClick={() => setShowQuestionLibraryModal(true)}
              className="inline-flex items-center gap-1.5 text-[11.5px] text-zinc-600 hover:text-zinc-900 transition-colors font-sans cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5 text-zinc-500" />
              <span>Suggested Questions</span>
            </button>
            <button
              onClick={() => setShowPreviousChatsModal(true)}
              className="inline-flex items-center gap-1.5 text-[11.5px] text-zinc-600 hover:text-zinc-900 transition-colors font-sans cursor-pointer"
            >
              <Clock className="w-3.5 h-3.5 text-zinc-500" />
              <span>Previous Chats</span>
            </button>
          </div>

          <div className="relative flex items-end bg-white border border-[#7c3aed] rounded-[8px] shadow-[0_1px_3px_rgba(0,0,0,0.04)] focus-within:ring-1 focus-within:ring-[#7c3aed]/30 transition-all p-2.5">
            <textarea
              rows={3}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Ask a question or describe a decision..."
              className="flex-1 bg-transparent px-2 py-1 text-xs text-zinc-800 placeholder:text-zinc-400 focus:outline-none resize-none font-sans leading-relaxed"
            />
            <button
              onClick={() => handleSend()}
              disabled={loading || !input.trim()}
              className="w-8 h-8 bg-zinc-900 text-white rounded-full flex items-center justify-center hover:bg-black disabled:opacity-30 transition-all shrink-0 ml-2 mb-0.5 cursor-pointer shadow-2xs"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ArrowUp className="w-4 h-4" strokeWidth={2.2} />
              )}
            </button>
          </div>
          <p className="text-[10.5px] text-zinc-500 text-center mt-2 font-sans">
            InsideMarkets Decision Intelligence is AI and can make mistakes. Please double-check responses.
          </p>
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
                          <div className="border-t border-[#7c3aed] w-full" />
                        </div>
                      )}

                      {/* Day Group Items List */}
                      <div className="divide-y divide-zinc-100">
                        {groupItems.map((chat) => {
                          return (
                            <div
                              key={chat.id}
                              onClick={() => handleSelectSession(chat)}
                              className="group relative flex items-center justify-between px-3 h-8 rounded-[4px] hover:bg-zinc-50 transition-all cursor-pointer text-zinc-800"
                            >
                              <div className="flex items-center gap-3 min-w-0 pr-6">
                                <span className="text-[11px] md:text-[12px] text-zinc-800 group-hover:text-black font-sans font-normal leading-none truncate">
                                  {chat.title}
                                </span>
                              </div>

                              <div className="flex items-center gap-4 shrink-0">
                                <span className="text-[10px] text-zinc-400 font-sans whitespace-nowrap min-w-[75px] text-right leading-none">
                                  {chat.displayTime}
                                </span>
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 text-zinc-400 hover:text-zinc-800 flex items-center">
                                  <MoreVertical className="w-3.5 h-3.5" />
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
                    className="pl-8 pr-3 py-1.5 text-[11px] font-sans bg-zinc-50 border border-zinc-200 rounded-[4px] focus:outline-none focus:border-[#7c3aed] text-zinc-800 w-48 md:w-64 transition-all"
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
                const count = QUESTION_LIBRARY.filter((q) => q.category === tab).length;
                return (
                  <button
                    key={tab}
                    onClick={() => setSelectedLibraryTab(tab)}
                    className={`px-4 py-2 text-[12px] font-sans font-medium transition-all border-b-2 cursor-pointer flex items-center gap-2 ${
                      isActive
                        ? "border-[#7c3aed] text-[#7c3aed] bg-white rounded-t-[4px]"
                        : "border-transparent text-zinc-500 hover:text-zinc-800 hover:border-zinc-200"
                    }`}
                  >
                    <span>{tab}</span>
                    <span className={`px-1.5 py-0.2 text-[10px] rounded-full ${isActive ? "bg-[#7c3aed]/10 text-[#7c3aed]" : "bg-zinc-200/60 text-zinc-600"}`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Modal Body / Questions List */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {(() => {
                const filtered = QUESTION_LIBRARY.filter((q) => {
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
                          handleSend(item.question, item.category);
                        }}
                        className="p-2.5 border border-zinc-200/90 hover:border-[#7c3aed] rounded-[4px] bg-white hover:bg-purple-50/20 transition-all cursor-pointer group flex flex-col justify-center"
                      >
                        <div>
                          <span className="text-[10px] font-sans font-medium text-[#7c3aed] uppercase tracking-wider">
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

