import React, { useState, useEffect, useMemo, useRef } from "react";
import { Sparkles, Bookmark, Pencil, Check, Share2, FileText, Send, Loader2, HelpCircle, Compass, User, Cpu, Truck, Globe, Leaf, Square, Trash2, CornerDownLeft } from "lucide-react";
import { supabase } from "../lib/supabase";
import { ChatSources } from "./ChatSources";
import { FORWARD_OUTLOOK_MODULE_ID, API_URL } from "../constants";

interface ForewardOutlookPaneProps {
  onReturn: () => void;
  clientId: string;
  industry: string;
  userId: string;
}

export interface SourceItem {
  id: string;
  source_name: string;
  details: string;
  category: "Research & Development" | "Innovation" | "Capital investment" | "Patent";
  date: string;
  organization?: string;
  source_url?: string;
}

export interface TrendItem {
  id: string;
  title: string;
  sector: "Consumer" | "Technology" | "Supply chain" | "Product" | "Sustainability";
  term: "Near-Term" | "Mid-Term" | "Long-Term";
  r: number;
  angle: number;
  summary: string;
  country: string;
  source_type: string;
  source_published_date: string;
  impact_level: "Critical" | "High" | "Medium" | "Low";
  business_impact: string[];
  textAnchor: "start" | "end" | "middle";
  dx: number;
  dy: number;
  confidence: "High" | "Medium" | "Low";
  signalsCount: number;
  trendStatus: "Trending up" | "Stable" | "Emerging";
  statValue1: string;
  statValue2: string;
  sparklinePath: string;
  sources: SourceItem[];
}

interface ChatMessage {
  id: string;
  role: "user" | "model";
  text: string;
  timestamp: Date;
  sources?: (string | { title: string; url: string })[];
}

export const RADAR_TRENDS: TrendItem[] = [
  {
    id: "hyper-personalization",
    title: "Hyper-Personalization",
    sector: "Consumer",
    term: "Near-Term",
    r: 135,
    angle: 168,
    summary: "Leveraging real-time behavioral data, context tracking, and advanced machine learning models to deliver tailored product offerings, custom loyalty incentives, and adaptive user flows across all digital channels. Early adopters are observing a substantial 15% increase in customer lifetime value alongside significantly higher retention metrics. By constantly adjusting client incentives to live micro-intent signals, the ecosystem ensures a frictionless and deeply localized digital journey for every individual participant.",
    country: "Global",
    source_type: "Market Report",
    source_published_date: "2026-07-12T00:00:00Z",
    impact_level: "High",
    business_impact: [
      "Requires integration of real-time event streaming platforms into core customer portals.",
      "Requires strict user consent controls to maintain compliance with upcoming regional privacy acts.",
      "Boosts organic conversion rates by delivering high-relevancy incentives at the exact moment of decision."
    ],
    textAnchor: "end",
    dx: -22,
    dy: 4,
    confidence: "High",
    signalsCount: 15,
    trendStatus: "Trending up",
    statValue1: "15 systems integrated",
    statValue2: "$145M allocated",
    sparklinePath: "M0 14 L8 10 L16 12 L24 6 L32 8 L40 2",
    sources: [
      {
        id: "hp-s1",
        source_name: "Stanford AI Lab Research",
        details: "Behavioral sequence modeling for sub-second personalized incentives.",
        category: "Research & Development",
        date: "Jul 10"
      },
      {
        id: "hp-s2",
        source_name: "OmniChannel Retail Corp",
        details: "US Patent US9821B: Real-time contextual client recommendation routing.",
        category: "Patent",
        date: "Jun 29"
      },
      {
        id: "hp-s3",
        source_name: "Sequoia Growth Seed",
        details: "$14.2M Series A funding in PersonifyAI personalization toolkit.",
        category: "Capital investment",
        date: "Jun 14"
      },
      {
        id: "hp-s4",
        source_name: "Dynamic Flow Systems",
        details: "Production launch of adaptive checkout journeys across 450 endpoints.",
        category: "Innovation",
        date: "May 30"
      }
    ]
  },
  {
    id: "predictive-churn",
    title: "Predictive Churn",
    sector: "Consumer",
    term: "Mid-Term",
    r: 215,
    angle: 156,
    summary: "Deploying predictive AI models to analyze micro-interaction telemetry, transaction drop-offs, and engagement pauses to accurately flag high-risk friction points before subscriber churn materializes. These automated models trigger preemptive corrective actions such as highly personalized loyalty boosts or specialized support flows. This proactive stance enables brand managers to strategically deploy limited promotional budgets while maintaining stable consumer cohort behaviors.",
    country: "North America",
    source_type: "Industry Analysis",
    source_published_date: "2026-06-28T00:00:00Z",
    impact_level: "Medium",
    business_impact: [
      "Allows loyalty teams to preemptively allocate retention budget to high-value users.",
      "Reduces aggregate customer acquisition cost by stabilizing the existing subscriber base.",
      "Demands continuous retraining of model pipelines to reflect evolving seasonal behavior."
    ],
    textAnchor: "end",
    dx: -22,
    dy: -2,
    confidence: "Medium",
    signalsCount: 9,
    trendStatus: "Stable",
    statValue1: "9 active channels",
    statValue2: "$48M total value",
    sparklinePath: "M0 12 L10 14 L20 10 L30 11 L40 9",
    sources: [
      {
        id: "pc-s1",
        source_name: "Customer Science Journal",
        details: "Friction signatures and predictive metrics in non-contractual user spaces.",
        category: "Research & Development",
        date: "Jun 22"
      },
      {
        id: "pc-s2",
        source_name: "Telecom Retention Systems",
        details: "Patent application for automatic retention benefit routing engines.",
        category: "Patent",
        date: "Jun 11"
      },
      {
        id: "pc-s3",
        source_name: "RetainML Acquisition",
        details: "$42M private capital buyout of predictive retention SaaS provider.",
        category: "Capital investment",
        date: "May 28"
      }
    ]
  },
  {
    id: "dynamic-rewards",
    title: "Dynamic Rewards",
    sector: "Consumer",
    term: "Long-Term",
    r: 295,
    angle: 148,
    summary: "Employing algorithmic systems to dynamically adjust reward point values, redemption multipliers, and catalog thresholds in real-time based on current supply chain inventories, seasonal demand spikes, and individual user histories. This elastic pricing model optimizes outstanding points balance sheet liabilities for operators while offering highly relevant offload options to consumers. The dynamic engine creates a responsive incentive layer that shifts dynamically with marketplace velocity.",
    country: "Global",
    source_type: "Academic Research",
    source_published_date: "2026-05-15T00:00:00Z",
    impact_level: "High",
    business_impact: [
      "Optimizes liability and balances outstanding points sheets during peak financial quarters.",
      "Delivers localized redemption options dynamically to offload slow-moving physical inventories.",
      "Creates complex predictive models of point inflation that require actuarial validation."
    ],
    textAnchor: "end",
    dx: -22,
    dy: 4,
    confidence: "Low",
    signalsCount: 6,
    trendStatus: "Emerging",
    statValue1: "6 test markets",
    statValue2: "$18M dynamic pool",
    sparklinePath: "M0 16 L10 13 L20 15 L30 11 L40 8",
    sources: [
      {
        id: "dr-s1",
        source_name: "Actuarial Science Studies",
        details: "Dynamic point valuation algorithms and outstanding balance liability models.",
        category: "Research & Development",
        date: "Jun 18"
      },
      {
        id: "dr-s2",
        source_name: "Dynamic Loyalty Ledger",
        details: "US Patent US99121B: Real-time inventory-driven point conversion shifts.",
        category: "Patent",
        date: "May 25"
      },
      {
        id: "dr-s3",
        source_name: "Loyalty Ventures Seed",
        details: "$18M backing to deploy elastic point exchange protocols.",
        category: "Capital investment",
        date: "May 10"
      }
    ]
  },
  {
    id: "api-first",
    title: "API-First",
    sector: "Technology",
    term: "Near-Term",
    r: 125,
    angle: 118,
    summary: "Architecting loyalty and customer experience services as headless, API-first microservices to allow rapid integration across retail websites, mobile apps, and third-party partner portals. This decoupled modular architecture isolates high-traffic presentation layers from stable transactional backends, slashing the release cycles for localized rewards, accelerating merchant partner onboarding, and unlocking multi-channel digital touchpoints without breaking core platform consensus.",
    country: "European Union",
    source_type: "Tech Framework",
    source_published_date: "2026-07-10T00:00:00Z",
    impact_level: "High",
    business_impact: [
      "Enables headless commerce patterns that isolate frontend design from transaction backends.",
      "Slashes partner onboarding time from months to days through standardized developer sandboxes.",
      "Demands high-availability API gateways with edge rate-limiting and robust security definitions."
    ],
    textAnchor: "end",
    dx: -22,
    dy: 4,
    confidence: "High",
    signalsCount: 22,
    trendStatus: "Trending up",
    statValue1: "22 APIs published",
    statValue2: "$85M developer spend",
    sparklinePath: "M0 15 L8 12 L16 14 L24 8 L32 9 L40 3",
    sources: [
      {
        id: "af-s1",
        source_name: "Headless Architecture Alliance",
        details: "Decoupled customer state machines and standardized API schemas.",
        category: "Research & Development",
        date: "Jul 05"
      },
      {
        id: "af-s2",
        source_name: "OmniLink Connect",
        details: "Low-latency microservices bridging brick-and-mortar register transactions.",
        category: "Innovation",
        date: "Jun 20"
      },
      {
        id: "af-s3",
        source_name: "Integration Capital Group",
        details: "$50M Series B inside API integration and rate limiting gateways.",
        category: "Capital investment",
        date: "Jun 02"
      }
    ]
  },
  {
    id: "subscription-tiers",
    title: "Subscription Tiers",
    sector: "Technology",
    term: "Mid-Term",
    r: 205,
    angle: 132,
    summary: "Introducing premium, recurring membership structures that sit on top of standard loyalty point layers to provide guaranteed rewards, free priority logistics, and early access to highly anticipated product lines. This model fosters a predictable recurring revenue stream while establishing a highly dedicated tier of top-quartile customer advocates. By prioritizing immediate high-value benefits over long-term point accruals, brands elevate immediate engagement and drive significant wallet share.",
    country: "Global",
    source_type: "Whitepaper",
    source_published_date: "2026-06-14T00:00:00Z",
    impact_level: "Medium",
    business_impact: [
      "Establishes a highly predictable stream of recurring monthly membership revenue.",
      "Creates a strong premium self-segmentation among the top 10% of high-value consumers.",
      "Requires coordination of cross-functional inventory channels to fulfill guaranteed priority shipping."
    ],
    textAnchor: "end",
    dx: -22,
    dy: -2,
    confidence: "Medium",
    signalsCount: 11,
    trendStatus: "Stable",
    statValue1: "11 programs live",
    statValue2: "$110M monthly MRR",
    sparklinePath: "M0 13 L10 11 L20 14 L30 10 L40 7",
    sources: [
      {
        id: "st-s1",
        source_name: "McKinsey Premium Reports",
        details: "Consumer behavior shifting from points to direct premium benefits.",
        category: "Research & Development",
        date: "Jun 09"
      },
      {
        id: "st-s2",
        source_name: "Priority Logistics Corp",
        details: "Patent application for automated queue priority in regional hubs.",
        category: "Patent",
        date: "May 14"
      },
      {
        id: "st-s3",
        source_name: "SubHub Venture Partners",
        details: "$25M investment in subscription billing orchestrator.",
        category: "Capital investment",
        date: "May 02"
      }
    ]
  },
  {
    id: "blockchain-web3",
    title: "Blockchain / Web3",
    sector: "Technology",
    term: "Long-Term",
    r: 295,
    angle: 124,
    summary: "Minting tokenized loyalty and reward assets on energy-efficient ledger networks to provide verifiable, interoperable digital collectibles and co-branded partner items with absolute consumer ownership. This open architecture enables secure peer-to-peer exchanges and secondary market trading while maintaining perfect transaction transparency and ledger security. By transitioning loyalty points to decentralized digital assets, brands open up novel avenues for cross-brand collaborations and web3-native communities.",
    country: "Global",
    source_type: "Consensus Report",
    source_published_date: "2026-04-02T00:00:00Z",
    impact_level: "Low",
    business_impact: [
      "Explores new communities of digital-native collectors and Web3 ecosystems.",
      "Demands careful legal compliance review regarding custody, tax reporting, and secondary trading fees.",
      "Requires robust smart-contract auditing to protect loyalty points ledger security."
    ],
    textAnchor: "start",
    dx: 22,
    dy: 4,
    confidence: "Low",
    signalsCount: 4,
    trendStatus: "Emerging",
    statValue1: "4 pilot ledgers",
    statValue2: "$2.5M dev grants",
    sparklinePath: "M0 17 L10 16 L20 18 L30 15 L40 14",
    sources: [
      {
        id: "bw-s1",
        source_name: "Ethereum Climate Initiative",
        details: "Analysis of Proof of Stake carbon metrics for multi-brand points ledgers operating on decentralized networks. This research highlights the significant reduction in energy consumption achieved by modern blockchain protocols, making them a viable and sustainable foundation for enterprise-level loyalty programs.",
        category: "Research & Development",
        date: "May 11"
      },
      {
        id: "bw-s2",
        source_name: "Tokenized Rewards Inc",
        details: "New patent for cross-network sovereign points swapping logic using smart contract bridges. The technology allows users to seamlessly exchange loyalty assets between different brand ecosystems without a central intermediary, empowering consumers with true ownership and liquidity of their reward portfolios.",
        category: "Patent",
        date: "Apr 28"
      },
      {
        id: "bw-s3",
        source_name: "Polkadot Ecosystem Grants",
        details: "$2M strategic grant focused on building low-fee rewards bridges for interoperable digital assets. This funding supports developers in creating the necessary infrastructure for cross-chain loyalty redemption, fostering a more connected and efficient reward economy across various parachain networks.",
        category: "Capital investment",
        date: "Apr 15"
      }
    ]
  },
  {
    id: "realtime-points",
    title: "Real-time Points Engines",
    sector: "Supply chain",
    term: "Mid-Term",
    r: 215,
    angle: 96,
    summary: "Implementing globally distributed transactional point-of-sale systems to reconcile, verify, and synchronize loyalty point balances across physical and digital storefronts with sub-second latency. This real-time processing prevents duplicate redemption exploits, increases trust, and triggers immediate post-purchase interactive notifications. Powered by highly resilient database engines, this synchronized state layer supports a seamless and dependable omnichannel customer experience.",
    country: "Global",
    source_type: "Systems Architecture",
    source_published_date: "2026-07-05T00:00:00Z",
    impact_level: "High",
    business_impact: [
      "Prevents double-redemption exploits across mobile and physical retail channels.",
      "Improves customer trust by instantly displaying point gains in push notifications.",
      "Demands globally replicated low-latency database nodes like Google Cloud Spanner."
    ],
    textAnchor: "start",
    dx: 22,
    dy: 4,
    confidence: "High",
    signalsCount: 16,
    trendStatus: "Trending up",
    statValue1: "16 database instances",
    statValue2: "$38M node scale",
    sparklinePath: "M0 15 L10 12 L20 11 L30 6 L40 3",
    sources: [
      {
        id: "rt-s1",
        source_name: "MIT Distributed Systems",
        details: "Research on global single-instance state consensus algorithms optimized for distributed checkout registers. This study explores techniques for maintaining strict ACID compliance across thousands of geo-replicated edge nodes, ensuring that loyalty point balances are updated with absolute accuracy in real-time.",
        category: "Research & Development",
        date: "Jun 28"
      },
      {
        id: "rt-s2",
        source_name: "Spanner Sync Engine",
        details: "Technical deep-dive into millisecond-scale transactional locking protocols specifically designed for live ledger accounts. The implementation leverages atomic clocks for external consistency, allowing for high-throughput concurrent updates to millions of customer wallets without the risk of double-spending or stale data reads.",
        category: "Innovation",
        date: "Jun 14"
      },
      {
        id: "rt-s3",
        source_name: "POS Sync Systems Fund",
        details: "$30M Series C funding round to scale high-throughput register databases for global retail conglomerates. The investment aims to bridge the gap between physical storefronts and digital loyalty platforms by deploying localized edge compute nodes that can process complex reward logic at the speed of light.",
        category: "Capital investment",
        date: "May 22"
      }
    ]
  },
  {
    id: "coalition-networks",
    title: "Coalition Networks",
    sector: "Supply chain",
    term: "Long-Term",
    r: 285,
    angle: 83,
    summary: "Building robust, cross-industry reward alliances that let consumers accumulate high-value points at everyday locations—like transit networks, grocery chains, and local services—and redeem them within a shared partner catalogue. This multi-tenant network approach increases the perceived utility and velocity of program points while offering deep insights into cross-category consumer behavior. Complex underlying clearinghouses securely settle inter-partner balances behind the scenes to maintain financial equilibrium.",
    country: "Asia-Pacific",
    source_type: "Strategic Review",
    source_published_date: "2026-05-20T00:00:00Z",
    impact_level: "Medium",
    business_impact: [
      "Dramatically increases the utility and perceived value of loyalty program points.",
      "Requires complex financial clearinghouses to settle partner-to-partner balance transfers.",
      "Unlocks massive cross-partner user behavioral datasets for shared marketing campaigns."
    ],
    textAnchor: "end",
    dx: -22,
    dy: 4,
    confidence: "Medium",
    signalsCount: 12,
    trendStatus: "Stable",
    statValue1: "12 network nodes",
    statValue2: "$45M clearing pool",
    sparklinePath: "M0 13 L10 14 L20 12 L30 9 L40 7",
    sources: [
      {
        id: "cn-s1",
        source_name: "Harvard Business Case",
        details: "Inter-industry loyalty networks and consumer friction mitigation.",
        category: "Research & Development",
        date: "Jun 01"
      },
      {
        id: "cn-s2",
        source_name: "Unified Partner catalog",
        details: "Standardized partner payload schemas for shared rewards catalogs.",
        category: "Innovation",
        date: "May 18"
      },
      {
        id: "cn-s3",
        source_name: "Coalition Capital Group",
        details: "$45M Seed funding for regional multi-brand settlement clearinghouses.",
        category: "Capital investment",
        date: "May 05"
      }
    ]
  },
  {
    id: "embedded-fintech",
    title: "Embedded Fintech",
    sector: "Product",
    term: "Near-Term",
    r: 135,
    angle: 48,
    summary: "The platform seamlessly embeds bank-grade financial services directly into the customer loyalty mobile app, creating a unified and frictionless user experience. Customers can access co-branded digital payment cards, make secure transactions, and leverage embedded financial products without leaving the app. Integrated micro-credit checkout lines enable eligible users to finance purchases instantly at the point of sale, improving affordability while encouraging higher spending and repeat engagement. By combining loyalty, payments, and credit within a single digital ecosystem, the platform enhances customer convenience, strengthens brand loyalty, and unlocks new revenue opportunities for both retailers and financial institutions.",
    country: "Southeast Asia",
    source_type: "Fintech Analysis",
    source_published_date: "2026-07-11T00:00:00Z",
    impact_level: "High",
    business_impact: [
      "Increases average order size by providing instant, point-integrated buy-now-pay-later credit.",
      "Establishes a primary digital wallet presence, keeping transaction data in-house.",
      "Requires strict licensing, anti-money laundering compliance, and bank partnership overhead."
    ],
    textAnchor: "end",
    dx: -26,
    dy: 4,
    confidence: "High",
    signalsCount: 18,
    trendStatus: "Trending up",
    statValue1: "18 rounds tracked",
    statValue2: "$340M total deployed",
    sparklinePath: "M 0 16 Q 10 4 20 8 T 40 2",
    sources: [
      {
        id: "ef-s1",
        source_name: "Trukkr",
        details: "Series B funding round focused on accelerating freight matching expansion into the GCC market. The capital will be used to enhance real-time logistics tracking and integrate embedded payment solutions for regional carrier networks, driving significant digital transformation in local supply chains.",
        category: "Capital investment",
        date: "Jul 08"
      },
      {
        id: "ef-s2",
        source_name: "Waseel Logistics",
        details: "Series A investment for a Riyadh-based warehousing SaaS provider. This expansion phase aims to scale their cloud-managed storage infrastructure and implement AI-driven inventory forecasting tools, enabling smaller retailers to access enterprise-grade fulfillment capabilities within the Saudi market.",
        category: "Capital investment",
        date: "Jul 03"
      },
      {
        id: "ef-s3",
        source_name: "Fatura",
        details: "Bridge funding round aimed at strengthening last-mile delivery operations across the UAE. The funds are earmarked for developing proprietary route optimization algorithms and deploying a fleet of eco-friendly delivery vehicles to meet the surging demand for sub-hour fulfillment in urban centers.",
        category: "Capital investment",
        date: "Jun 27"
      },
      {
        id: "ef-s4",
        source_name: "Adaptive Credit Routing Engine",
        details: "US Patent US1085A covers real-time checkout credit splitter algorithms designed for high-volume consumer portals. This technology allows for dynamic evaluation of user creditworthiness at the exact moment of purchase, routing transactions through optimal lending partners to maximize approval rates and minimize merchant risk.",
        category: "Patent",
        date: "Jun 15"
      },
      {
        id: "ef-s5",
        source_name: "Fintech Integration Institute",
        details: "New guidelines for bank-grade API compliance specifically tailored for consumer-facing wallet integrations. These standards ensure robust data encryption, sub-second transaction latency, and seamless interoperability between traditional banking cores and modern loyalty application frameworks.",
        category: "Research & Development",
        date: "May 20"
      }
    ]
  },
  {
    id: "gamification",
    title: "Gamification",
    sector: "Product",
    term: "Mid-Term",
    r: 205,
    angle: 61,
    summary: "Integrating immersive mini-games, interactive streak trackers, and community leaderboard challenges directly into the shopping journey to turn transactional retail moments into engaging habitual experiences. Consumers are rewarded with micro-incentives, exclusive badges, and social recognitions that keep them returning to the app outside of standard purchasing cycles. This sustained engagement builds powerful psychological ties with the brand and creates prime opportunities for seasonal co-branded campaigns.",
    country: "Global",
    source_type: "Product Study",
    source_published_date: "2026-06-18T00:00:00Z",
    impact_level: "Medium",
    business_impact: [
      "Boosts daily active app usage metrics by shifting focus from transactional to habitual engagement.",
      "Allows brand partners to sponsor seasonal interactive gameplay challenges.",
      "Requires continuous content development and narrative updates to keep gameplay engaging."
    ],
    textAnchor: "start",
    dx: 22,
    dy: 4,
    confidence: "Medium",
    signalsCount: 10,
    trendStatus: "Stable",
    statValue1: "10 active modules",
    statValue2: "$12M funding capital",
    sparklinePath: "M0 14 L10 15 L20 11 L30 12 L40 8",
    sources: [
      {
        id: "gm-s1",
        source_name: "Game Mechanics Lab",
        details: "Experimental study on habit loops and user dopamine response triggers inside standard transactional retail portals. The research identifies specific gameplay elements, such as immediate visual feedback and variable reward schedules, that significantly enhance long-term user retention and platform stickiness.",
        category: "Research & Development",
        date: "Jun 11"
      },
      {
        id: "gm-s2",
        source_name: "QuestRewards System",
        details: "Implementation of a sophisticated streak tracking mechanism for gamified micro-incentives across a multi-tenant partner network. This system allows brands to define custom user missions and seasonal milestones that reward consistent engagement with exclusive digital badges and high-value point multipliers.",
        category: "Innovation",
        date: "Jun 02"
      },
      {
        id: "gm-s3",
        source_name: "EngageMedia Funding",
        details: "$12M Series A capital injection to fuel the development of next-generation casual mini-game engines for enterprise loyalty platforms. The investment will focus on creating a plug-and-play SDK that allows retailers to easily deploy immersive gameplay experiences without extensive custom coding.",
        category: "Capital investment",
        date: "May 18"
      }
    ]
  },
  {
    id: "sustainability-rewards",
    title: "Sustainability Rewards",
    sector: "Sustainability",
    term: "Near-Term",
    r: 140,
    angle: 16,
    summary: "Directly rewarding carbon-offset purchases, reusable packaging returns, and local low-emission delivery choices using high-value loyalty points to drive verified eco-conscious customer behavior. This programmatic alignment of customer actions with corporate ESG objectives builds authentic brand affinity and meets demanding regulatory disclosure frameworks. Integrated third-party audit channels automatically log and certify each sustainable action to guarantee environmental integrity.",
    country: "European Union",
    source_type: "ESG Framework",
    source_published_date: "2026-07-09T00:00:00Z",
    impact_level: "High",
    business_impact: [
      "Aligns corporate brand values with positive climate-conscious actions.",
      "Meets upcoming ESG reporting guidelines and carbon accounting legislation requirements.",
      "Requires integration with accredited third-party carbon and packaging verification databases."
    ],
    textAnchor: "end",
    dx: -22,
    dy: 4,
    confidence: "High",
    signalsCount: 15,
    trendStatus: "Trending up",
    statValue1: "15 accredited partners",
    statValue2: "$15M green fund",
    sparklinePath: "M0 15 L10 11 L20 12 L30 6 L40 2",
    sources: [
      {
        id: "sr-s1",
        source_name: "ESG Retail Advisory Council",
        details: "Comprehensive framework for measuring circular economic choices directly inside reward transaction tables. This initiative provides retailers with standardized metrics for tracking verified carbon-offset purchases and reusable packaging returns, aligning loyalty program outcomes with global ESG reporting goals.",
        category: "Research & Development",
        date: "Jul 02"
      },
      {
        id: "sr-s2",
        source_name: "Carbon Verification Systems",
        details: "Successful patent application for automated retail packaging recycling scanners that integrate directly with existing POS systems. The technology uses advanced computer vision to identify and certify the return of reusable containers, instantly crediting the user's loyalty account with sustainable reward points.",
        category: "Patent",
        date: "Jun 19"
      },
      {
        id: "sr-s3",
        source_name: "GreenTech Venture Fund",
        details: "$15M Series A backing into specialized EcoPoints software integrations for major European grocery chains. The funding round will accelerate the deployment of climate-aligned reward modules that incentivize low-emission delivery choices and verify local sourcing for every item in the shopping cart.",
        category: "Capital investment",
        date: "Jun 05"
      }
    ]
  },
  {
    id: "experiential-redemption",
    title: "Experiential Redemption",
    sector: "Sustainability",
    term: "Mid-Term",
    r: 225,
    angle: 26,
    summary: "Replacing legacy physical merchandise rewards with curated, low-carbon experiences such as private culinary masterclasses, virtual celebrity meetups, and exclusive ecotourism excursions. This shift dramatically reduces packaging waste and complex global shipping logistics while generating deeply memorable life milestones connected directly to the brand. These emotional loyalty moments foster lifelong brand advocacy that traditional physical catalog items simply cannot replicate.",
    country: "Global",
    source_type: "Consumer Survey",
    source_published_date: "2026-06-05T00:00:00Z",
    impact_level: "Medium",
    business_impact: [
      "Reduces physical fulfillment logistics, shipping emissions, and inventory storage overhead.",
      "Provides memorable life experiences that build deep emotional affinity with the brand.",
      "Requires curated partnership contracts with global experience providers and hosts."
    ],
    textAnchor: "start",
    dx: 22,
    dy: 4,
    confidence: "Medium",
    signalsCount: 8,
    trendStatus: "Stable",
    statValue1: "8 partner catalogs",
    statValue2: "$20M venture capital",
    sparklinePath: "M0 12 L10 13 L20 9 L30 11 L40 7",
    sources: [
      {
        id: "er-s1",
        source_name: "Millennial Experience Survey",
        details: "Value perception shift towards non-material rewards and active service portals.",
        category: "Research & Development",
        date: "May 29"
      },
      {
        id: "er-s2",
        source_name: "VIP Virtual Streams",
        details: "Scaled low-latency interactive virtual event systems for point-based entries.",
        category: "Innovation",
        date: "May 12"
      },
      {
        id: "er-s3",
        source_name: "Experia Partners Corp",
        details: "$20M Seed round to build localized digital experience databases.",
        category: "Capital investment",
        date: "Apr 26"
      }
    ]
  },
  {
    id: "superapp-loyalty",
    title: "Super-App Loyalty",
    sector: "Sustainability",
    term: "Long-Term",
    r: 295,
    angle: 8,
    summary: "Consolidating transit fares, local dining rewards, neighborhood volunteering credits, and utility payments into a single, cohesive city-scale digital wallet interface. This expansive ecosystem incentivizes pro-social civic decisions and daily sustainable actions, backed by collaborative public-private funding pools and dynamic municipal grants. The resulting highly utilized lifestyle companion app remains deeply embedded in the consumer's daily logistical routine.",
    country: "East Asia",
    source_type: "Future Foresight",
    source_published_date: "2026-05-11T00:00:00Z",
    impact_level: "High",
    business_impact: [
      "Positions the super-app as a vital daily platform for regional civilian logistics.",
      "Leverages shared public-private micro-grants to fund eco-action rewards.",
      "Demands rigorous security, cryptographic identities, and city-scale service integrations."
    ],
    textAnchor: "start",
    dx: 12,
    dy: 4,
    confidence: "High",
    signalsCount: 14,
    trendStatus: "Trending up",
    statValue1: "14 urban nodes",
    statValue2: "$95M sovereign fund",
    sparklinePath: "M0 16 L10 12 L20 14 L30 8 L40 3",
    sources: [
      {
        id: "sl-s1",
        source_name: "Future Cities Consortium",
        details: "Feasibility of localized points exchange systems across municipal transport lines.",
        category: "Research & Development",
        date: "Jul 01"
      },
      {
        id: "sl-s2",
        source_name: "SuperApp Integrator Core",
        details: "Sovereign decentralized credentials bridging multiple micro-services.",
        category: "Patent",
        date: "Jun 18"
      },
      {
        id: "sl-s3",
        source_name: "Sovereign Smart Cities",
        details: "$95M multi-state smart city infrastructure and unified ledger backer.",
        category: "Capital investment",
        date: "May 29"
      }
    ]
  }
];

const getNodeRadius = (trend: TrendItem, isSelected: boolean, isHovered: boolean) => {
  let baseRadius = 5.5;
  if (trend.confidence === "High") {
    baseRadius = 8.5;
  } else if (trend.confidence === "Medium") {
    baseRadius = 6;
  } else if (trend.confidence === "Low") {
    baseRadius = 4;
  }
  
  if (isSelected) {
    return baseRadius + 2;
  }
  if (isHovered) {
    return baseRadius + 1.2;
  }
  return baseRadius;
};

const getConfidenceTagClass = (confidence: string) => {
  const conf = (confidence || "").toLowerCase();
  if (conf.includes("high")) {
    return "bg-emerald-50 border border-emerald-200 text-emerald-800";
  }
  if (conf.includes("medium")) {
    return "bg-amber-50 border border-amber-200 text-amber-800";
  }
  return "bg-rose-50 border border-rose-200 text-rose-800";
};

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

const getSectorTagClass = (sector: string) => {
  const sec = (sector || "").toLowerCase();
  if (sec.includes("product")) {
    return "bg-cyan-50 border border-cyan-200 text-cyan-800";
  }
  if (sec.includes("tech")) {
    return "bg-violet-50 border border-violet-200 text-violet-800";
  }
  if (sec.includes("consumer")) {
    return "bg-teal-50 border border-teal-200 text-teal-800";
  }
  if (sec.includes("supply")) {
    return "bg-indigo-50 border border-indigo-200 text-indigo-800";
  }
  if (sec.includes("sustain")) {
    return "bg-emerald-50 border border-emerald-200 text-emerald-800";
  }
  return "bg-slate-50 border border-slate-200 text-slate-800";
};

const getTermTagClass = (term: string) => {
  const t = (term || "").toLowerCase();
  if (t.includes("near")) {
    return "bg-indigo-50 border border-indigo-200 text-indigo-800";
  }
  if (t.includes("mid")) {
    return "bg-amber-50 border border-amber-200 text-amber-800";
  }
  return "bg-slate-50 border border-slate-200 text-slate-800";
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

export default function ForewardOutlookPane({ 
  onReturn,
  clientId,
  industry,
  userId
}: ForewardOutlookPaneProps) {
  const [trends, setTrends] = useState<TrendItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSignalsLoading, setIsSignalsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("insights");
  const [selectedTrendId, setSelectedTrendId] = useState<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [isSourcesExpanded, setIsSourcesExpanded] = useState<boolean>(true);
  const [selectedSignalId, setSelectedSignalId] = useState<string | null>(null);

  const FORWARD_OUTLOOK_MODULE_ID = "2eb989fd-0ea0-4320-b73a-f7eb8b970473";

  useEffect(() => {
    async function fetchTrends() {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("trend_snapshots_latest")
          .select("*")
          .eq("module_id", FORWARD_OUTLOOK_MODULE_ID)
          .eq("client_id", clientId);

        if (error) throw error;

        if (data && data.length > 0) {
          console.log("Trend item keys:", Object.keys(data[0]));
          // Group trends by sector to distribute them within their respective segments
          const trendsBySector: Record<string, any[]> = {};
          data.forEach(item => {
            const sector = (item.sector || "Consumer").toLowerCase();
            if (!trendsBySector[sector]) trendsBySector[sector] = [];
            trendsBySector[sector].push(item);
          });

          const sectorRanges: Record<string, { start: number, end: number }> = {
            "consumer": { start: 144, end: 175 },
            "technology": { start: 108, end: 144 },
            "supply chain": { start: 72, end: 108 },
            "product": { start: 36, end: 72 },
            "sustainability": { start: 5, end: 36 }
          };

          const mappedTrends: TrendItem[] = [];
          
          Object.entries(trendsBySector).forEach(([sectorKey, sectorTrends]) => {
            const range = sectorRanges[sectorKey] || sectorRanges["consumer"];
            const segmentWidth = range.end - range.start;
            
            sectorTrends.forEach((item, index) => {
              // Calculate angle within the sector's wedge
              // Use a small buffer to avoid items being right on the divider lines
              const step = segmentWidth / (sectorTrends.length + 1);
              const angle = range.start + step * (index + 1);
              
              let r = 135; // default near
              if (item.ring === "mid_term") r = 215;
              if (item.ring === "long_term") r = 295;

              mappedTrends.push({
                id: item.trend_id,
                title: item.name,
                sector: item.sector || "Consumer",
                term: (item.ring === "near_term" ? "Near-Term" : item.ring === "mid_term" ? "Mid-Term" : "Long-Term") as any,
                r,
                angle,
                summary: item.write_up?.summary || "",
                country: "Global",
                source_type: "Market Intelligence",
                source_published_date: item.last_updated_at || item.created_at,
                impact_level: item.write_up?.impact || "Medium",
                business_impact: item.write_up?.business_impact || [],
                textAnchor: angle > 90 ? "end" : angle < 90 ? "start" : "middle",
                dx: angle > 100 ? -22 : angle < 80 ? 22 : 0,
                dy: angle > 80 && angle < 100 ? -15 : 4,
                confidence: item.dot_size > 7 ? "High" : item.dot_size > 4 ? "Medium" : "Low",
                signalsCount: item.dot_size || 0, // Fallback to dot_size until signals are fetched
                trendStatus: "Stable",
                statValue1: "",
                statValue2: "",
                sparklinePath: "M0 14 L10 15 L20 11 L30 12 L40 8",
                sources: [],
                similar_trends: item.similar_trends || [] // We'll store this for later use
              } as any);
            });
          });

          setTrends(mappedTrends);
          if (mappedTrends.length > 0) {
            setSelectedTrendId(mappedTrends[0].id);
          }
        } else {
          setTrends([]);
          setSelectedTrendId(null);
        }
      } catch (err) {
        console.error("Error fetching trends:", err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchTrends();
  }, [clientId]);

  useEffect(() => {
    if (!selectedTrendId) return;

    async function fetchSignals() {
      setIsSignalsLoading(true);
      try {
        const { data: membershipData, error: membershipError } = await supabase
          .from("trend_membership")
          .select("signal_id")
          .eq("trend_id", selectedTrendId);

        if (membershipError) throw membershipError;

        if (membershipData && membershipData.length > 0) {
          const signalIds = membershipData.map(m => m.signal_id);

          const { data: signalsData, error: signalsError } = await supabase
            .from("policy_signals")
            .select("*")
            .in("id", signalIds);

          if (signalsError) throw signalsError;

          if (signalsData) {
            const mappedSignals: SourceItem[] = signalsData.map(s => ({
              id: s.id,
              source_name: s.signal_title || "Signal",
              details: s.summary || "",
              category: s.signal_type as any || "Innovation",
              date: s.source_published_date ? new Date(s.source_published_date).toLocaleDateString("en-US", { month: "short", day: "2-digit" }) : "Jul 23",
              organization: s.organization,
              source_url: s.source_article_url
            }));

            setTrends(prev => prev.map(t => 
              t.id === selectedTrendId 
                ? { ...t, sources: mappedSignals, signalsCount: mappedSignals.length } 
                : t
            ));
          }
        } else {
          setTrends(prev => prev.map(t => 
            t.id === selectedTrendId 
              ? { ...t, sources: [], signalsCount: 0 } 
              : t
          ));
        }
      } catch (err) {
        console.error("Error fetching signals:", err);
      } finally {
        setIsSignalsLoading(false);
      }
    }

    fetchSignals();
  }, [selectedTrendId]);
  
  useEffect(() => {
    setIsSourcesExpanded(true);
    const trend = trends.find(t => t.id === selectedTrendId);
    if (trend && trend.sources && trend.sources.length > 0) {
      setSelectedSignalId(trend.sources[0].id);
    } else {
      setSelectedSignalId(null);
    }
  }, [selectedTrendId, trends]);
  
  // Date states (retained for identical design/functionality)
  const [startDateStr, setStartDateStr] = useState("");
  const [endDateStr, setEndDateStr] = useState("");
  const [defaultStartDate, setDefaultStartDate] = useState("");
  const [defaultEndDate, setDefaultEndDate] = useState("");
  const [isEditingDates, setIsEditingDates] = useState(false);

  // Chatbot states
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Similar Prospects states
  const [similarFutureProspects, setSimilarFutureProspects] = useState<any[]>([]);
  const [isFetchingSimilar, setIsFetchingSimilar] = useState(false);

  useEffect(() => {
    if (!selectedTrendId || trends.length === 0) return;
    
    setIsFetchingSimilar(true);
    const trend = trends.find(t => t.id === selectedTrendId);
    if (trend && (trend as any).similar_trends) {
      setSimilarFutureProspects((trend as any).similar_trends);
    } else {
      setSimilarFutureProspects([]);
    }
    setIsFetchingSimilar(false);
  }, [selectedTrendId, trends]);

  // Bookmarks states (Supabase backed)
  const [isBookmarked, setIsBookmarked] = useState<Record<string, boolean>>({});
  const [hiddenIds, setHiddenIds] = useState<Record<string, boolean>>({});
  const [lastHiddenTrend, setLastHiddenTrend] = useState<TrendItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string, isHideAction = false) => {
    if (!isHideAction) setLastHiddenTrend(null);
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => {
        if (prev === msg) {
          setLastHiddenTrend(null);
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
        .select("trend_cluster_id")
        .eq("client_id", clientId)
        .eq("user_id", userId);

      if (error) throw error;
      
      const ids: Record<string, boolean> = {};
      data.forEach(b => {
        if (b.trend_cluster_id) ids[b.trend_cluster_id] = true;
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
        .select("trend_cluster_id")
        .eq("client_id", clientId)
        .eq("user_id", userId);

      if (error) throw error;

      const ids: Record<string, boolean> = {};
      data.forEach(h => {
        if (h.trend_cluster_id) ids[h.trend_cluster_id] = true;
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
      console.log("Bookmarks schema check:", { data, error });
    }
    checkSchema();
  }, [clientId, userId]);

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

  // Selected Trend Item
  const filteredTrends = useMemo(() => {
    return trends.filter(t => {
      if (hiddenIds[t.id]) return false;
      if (startDateStr && endDateStr && t.source_published_date) {
        const dateStr = t.source_published_date.split('T')[0];
        return dateStr >= startDateStr && dateStr <= endDateStr;
      }
      return true;
    });
  }, [trends, hiddenIds, startDateStr, endDateStr]);

  const selectedTrend = useMemo(() => {
    return filteredTrends.find(t => t.id === selectedTrendId) || null;
  }, [selectedTrendId, filteredTrends]);

  // SVG Radar Coordinates Calculation helper
  const cx = 400;
  const cy = 350;
  const getCoords = (r: number, angle: number) => {
    const rad = (angle * Math.PI) / 180;
    const x = cx + r * Math.cos(rad);
    const y = cy - r * Math.sin(rad);
    return { x, y };
  };

  // Handle chat submission
  const handleChatSend = async (text: string) => {
    if (!text.trim() || chatLoading || !selectedTrend) return;

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
          moduleId: FORWARD_OUTLOOK_MODULE_ID
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
      // Fallback response
      setTimeout(() => {
        const assistantMsg: ChatMessage = {
          id: Math.random().toString(36).substring(2),
          role: "model",
          text: `Based on an analysis of **${selectedTrend?.title || "the selected trend"}** within the **${selectedTrend?.sector || "its"}** space: this development directly affects Near-Term loyalty frameworks. We recommend allocating up to 12% of the tactical innovation budget to evaluate API-first pilot capabilities. Let me know if you would like to run additional scenario models.`,
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

  // Scroll chat to bottom
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, chatLoading]);

  // Render unified impact indicator
  const renderImpactBars = (impact: string) => {
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
    if (!selectedTrend) return "";
    const d = new Date(selectedTrend.source_published_date);
    if (isNaN(d.getTime())) return "July 2026";
    return d.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric"
    });
  }, [selectedTrend]);

  return (
    <div id="outlook-dashboard" className="flex-1 h-full flex bg-white divide-x divide-zinc-200 overflow-hidden">
      
      {/* LEFT COLUMN: Radar and Left Pane Workspace (60% width) */}
      <div id="outlook-column" className="w-[60%] h-full flex flex-col bg-white flex-shrink-0 animate-fade-in">
        
        {/* Header section (retaining exact dates layout) */}
        <div id="outlook-header" className="h-[53px] px-4 border-b border-zinc-100 flex items-center justify-between flex-shrink-0 bg-white">
          <div className="flex items-center gap-4">
            <h2 id="outlook-heading-title" className="text-[19px] font-semibold tracking-tight text-zinc-900 select-none">
              Forward Outlook
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
              <Pencil className="w-3.5 h-3.5 text-zinc-400 select-none" />
            </div>
          )}
        </div>

        {/* Outer Workspace containing Only the Radar Chart on the left */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2 bg-[#fafafa]/50">
          
          {/* What changed vs previous period segment - matching Policy Monitor design */}
          <div className="mb-2 p-5 border border-zinc-200 bg-white rounded-[8px] flex flex-col gap-3 shadow-[0_1px_3px_rgba(0,0,0,0.01)] animate-fade-in pr-3">
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
          
          {/* TOP HALF: Trend Horizon Radar Chart */}
          <div id="radar-visualizer-section" className="py-1 px-2 flex flex-col items-center relative select-none">


            <svg 
              id="trend-radar-svg"
              width="100%" 
              height="auto" 
              viewBox="0 -15 800 395" 
              className="max-w-[860px] w-full filter drop-shadow-[0_4px_12px_rgba(124,58,237,0.03)]"
            >
              <defs>
                <radialGradient id="radar-grad" cx="400" cy="350" r="330" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.16" />
                  <stop offset="45%" stopColor="#c084fc" stopOpacity="0.08" />
                  <stop offset="80%" stopColor="#818cf8" stopOpacity="0.03" />
                  <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
                </radialGradient>
              </defs>

              {/* Main radar background semi-circle */}
              <path 
                d="M 70,350 A 330,330 0 0,1 730,350 Z" 
                fill="url(#radar-grad)" 
                stroke="#e4e4e7" 
                strokeWidth="1.2" 
              />

              {/* Rings dividers */}
              <path 
                d="M 150,350 A 250,250 0 0,1 650,350" 
                fill="none" 
                stroke="#e4e4e7" 
                strokeDasharray="4 4" 
                strokeWidth="1.2" 
              />
              <path 
                d="M 230,350 A 170,170 0 0,1 570,350" 
                fill="none" 
                stroke="#e4e4e7" 
                strokeDasharray="4 4" 
                strokeWidth="1.2" 
              />

              {/* Inner Cutout masking semi-circle */}
              <path 
                d="M 310,350 A 90,90 0 0,1 490,350 Z" 
                fill="#ffffff" 
                stroke="#e4e4e7" 
                strokeWidth="1.2" 
              />

              {/* Radiating dividers (angles 144, 108, 72, 36) */}
              {[144, 108, 72, 36].map((angle, i) => {
                const innerPt = getCoords(90, angle);
                const outerPt = getCoords(330, angle);
                return (
                  <line
                    key={i}
                    x1={innerPt.x}
                    y1={innerPt.y}
                    x2={outerPt.x}
                    y2={outerPt.y}
                    stroke="#ffffff"
                    strokeWidth="1.5"
                  />
                );
              })}

              {/* Baseline divider */}
              <line 
                x1="40" 
                y1="350" 
                x2="760" 
                y2="350" 
                stroke="#d4d4d8" 
                strokeWidth="1.5" 
              />

              {/* Sector Labels curved along the outer arch */}
              {[
                { label: "Consumer", angle: 162 },
                { label: "Technology", angle: 126 },
                { label: "Supply chain", angle: 90 },
                { label: "Product", angle: 54 },
                { label: "Sustainability", angle: 18 }
              ].map((sector, idx) => {
                const labelPt = getCoords(345, sector.angle);
                return (
                  <text
                    key={idx}
                    x={labelPt.x}
                    y={labelPt.y}
                    textAnchor="middle"
                    className="font-sans text-[11px] font-semibold text-zinc-600 fill-zinc-600 tracking-wider"
                    transform={`rotate(${90 - sector.angle}, ${labelPt.x}, ${labelPt.y})`}
                  >
                    {sector.label}
                  </text>
                );
              })}

              {/* Baseline horizon titles: Left and Right sides */}
              {/* Left Baseline */}
              <text x="100" y="370" textAnchor="middle" className="font-mono text-[9px] font-bold tracking-widest fill-zinc-600">LONG-TERM</text>
              <text x="190" y="370" textAnchor="middle" className="font-mono text-[9px] font-bold tracking-widest fill-zinc-600">MID-TERM</text>
              <text x="270" y="370" textAnchor="middle" className="font-mono text-[9px] font-bold tracking-widest fill-zinc-600">NEAR-TERM</text>

              {/* Right Baseline */}
              <text x="530" y="370" textAnchor="middle" className="font-mono text-[9px] font-bold tracking-widest fill-zinc-600">NEAR-TERM</text>
              <text x="610" y="370" textAnchor="middle" className="font-mono text-[9px] font-bold tracking-widest fill-zinc-600">MID-TERM</text>
              <text x="700" y="370" textAnchor="middle" className="font-mono text-[9px] font-bold tracking-widest fill-zinc-600">LONG-TERM</text>

              {/* Trend Nodes/Dots */}
              {isLoading ? (
                <g>
                  <text x="400" y="200" textAnchor="middle" className="text-zinc-400 text-sm animate-pulse">Syncing horizon data...</text>
                </g>
              ) : trends.length === 0 ? (
                <g>
                  <text x="400" y="200" textAnchor="middle" className="text-zinc-400 text-sm">No trends available for this client.</text>
                </g>
              ) : (
                filteredTrends.map((trend) => {
                  const pt = getCoords(trend.r, trend.angle);
                  const isSelected = selectedTrendId === trend.id;
                  const isHovered = hoveredNodeId === trend.id;
                  const nodeRadius = getNodeRadius(trend, isSelected, isHovered);

                  return (
                    <g 
                      key={trend.id} 
                      className="group"
                      onMouseEnter={() => setHoveredNodeId(trend.id)}
                      onMouseLeave={() => setHoveredNodeId(null)}
                    >
                      {isSelected && (
                        <circle
                          cx={pt.x}
                          cy={pt.y}
                          r={nodeRadius + 3.5}
                          fill="none"
                          stroke="#7c3aed"
                          strokeWidth="1.5"
                          className="transition-all duration-150"
                        />
                      )}
                      {/* Glowing hover circle (touch/click target) */}
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r="18"
                        fill="transparent"
                        className="cursor-pointer"
                        onClick={() => setSelectedTrendId(trend.id)}
                      />
                      {/* Solid node circle */}
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r={nodeRadius}
                        fill={isSelected || isHovered ? "#7c3aed" : "#18181b"}
                        className="cursor-pointer transition-all duration-150"
                        onClick={() => setSelectedTrendId(trend.id)}
                      />
                      {/* Text labels adjacent to node */}
                      <text
                        x={pt.x + trend.dx - 8}
                        y={pt.y + trend.dy}
                        textAnchor={trend.textAnchor}
                        onClick={() => setSelectedTrendId(trend.id)}
                        className={`font-sans text-[10px] cursor-pointer font-medium select-none tracking-tight transition-colors duration-150 ${
                          isSelected || isHovered
                            ? "fill-[#7c3aed] font-bold" 
                            : "fill-zinc-700 hover:fill-[#7c3aed]"
                        }`}
                      >
                        {trend.title}
                      </text>
                    </g>
                  );
                })
              )}
            </svg>
          </div>

        </div>
      </div>

      {/* RIGHT COLUMN: Outlook details view (Pane 2 - 40% width) */}
      <div id="outlook-content-pane" className="w-[40%] h-full flex flex-col bg-white overflow-hidden relative">
        
        {/* Header of Content Detail */}
        <div id="content-header" className="h-[53px] px-4 border-b border-zinc-100 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-1.5 flex-shrink-0 select-none">
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
              <Bookmark className={`w-3 h-3 ${Object.keys(isBookmarked).length > 0 ? "text-violet-600 fill-violet-600" : "text-current opacity-70"}`} />
              <span>Bookmark ({Object.keys(isBookmarked).length})</span>
            </button>
          </div>
        </div>

        {/* Dynamic switcher content */}
        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-[#fafafa]/30">
            <Loader2 className="w-6 h-6 text-zinc-400 animate-spin mb-3" />
            <p className="text-zinc-500 text-[12px]">Synchronizing live horizon analysis...</p>
          </div>
        ) : activeTab === "insights" && selectedTrend ? (
          <div key={selectedTrend.id} className="flex-1 overflow-y-auto p-6 md:p-8 flex flex-col gap-5 animate-fade-in bg-[#fafafa]/30 select-text">
            
            {/* Category, Actions and Title */}
            <div className="flex flex-col gap-2">
              <h1 className="text-xl sm:text-[22px] font-semibold leading-tight tracking-tight text-[#111827] font-sans">
                {selectedTrend.title}
                
                {/* Small graph with hover tooltip - integrated inline to avoid alignment shift */}
                <span className="relative group inline-flex items-center select-none cursor-pointer ml-2">
                  {/* Tiny sparkline SVG - borderless and smaller */}
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

                  {/* Hover box (the confidence and signals card) */}
                  <span className="absolute top-full left-0 mt-1.5 hidden group-hover:flex flex-col gap-0.5 bg-white border border-[#031d24] rounded-[5px] py-1 px-2.5 shadow-lg z-50 min-w-[185px]">
                    <span className="font-bold text-zinc-900 text-[11px] font-sans leading-none whitespace-nowrap">
                      {selectedTrend.confidence} Confidence
                    </span>
                    <span className="flex items-center gap-1.5 text-[9.5px] text-zinc-500 font-sans leading-none mt-1 whitespace-nowrap">
                      <span className="text-zinc-900 font-semibold">
                        {selectedTrend.signalsCount} signals
                      </span>
                      {/* Brand sparkline SVG matching confidence color */}
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
                      id="not-interested-button"
                      onClick={async () => {
                        if (!selectedTrend || !clientId || !userId) return;
                        try {
                          const { error } = await supabase
                            .from("hidden_articles")
                            .insert([
                              {
                                client_id: clientId,
                                user_id: userId,
                                trend_cluster_id: selectedTrend.id
                              }
                            ]);
                          if (error) throw error;

                          setHiddenIds(prev => ({ ...prev, [selectedTrend.id]: true }));
                          setLastHiddenTrend(selectedTrend);
                          triggerToast(`Hidden: ${selectedTrend.title}`, true);
                        } catch (err: any) {
                          console.error("Error hiding article:", err);
                          triggerToast(`Failed to hide article: ${err.message || "Unknown error"}`);
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
                        if (!selectedTrend || !clientId || !userId) return;
                        const isCurrentlyBookmarked = isBookmarked[selectedTrend.id];
                        
                        try {
                          if (isCurrentlyBookmarked) {
                            // DELETE
                            const { error } = await supabase
                              .from("bookmarks")
                              .delete()
                              .eq("client_id", clientId)
                              .eq("user_id", userId)
                              .eq("trend_cluster_id", selectedTrend.id);
                            if (error) throw error;
                            triggerToast(`Removed bookmark for ${selectedTrend.title}`);
                          } else {
                            // INSERT
                            const { error } = await supabase
                              .from("bookmarks")
                              .insert([
                                {
                                  client_id: clientId,
                                  user_id: userId,
                                  trend_cluster_id: selectedTrend.id
                                }
                              ]);
                            if (error) throw error;
                            triggerToast(`Saved bookmark for ${selectedTrend.title}`);
                          }
                          // Refresh bookmarks
                          await fetchBookmarks();
                        } catch (err: any) {
                          console.error("Error toggling bookmark:", err);
                          triggerToast(`Failed to update bookmark: ${err.message || "Unknown error"}`);
                        }
                      }}
                      className={`w-[22px] h-[22px] border rounded-[3px] flex items-center justify-center transition-colors duration-150 ${
                        isBookmarked[selectedTrend.id]
                          ? "bg-amber-50/60 border-amber-200/80 text-amber-500 hover:bg-amber-100/35"
                          : "bg-[#fafafa] border-zinc-200 text-zinc-400 hover:text-zinc-650 hover:bg-zinc-100/50"
                      }`}
                      title={isBookmarked[selectedTrend.id] ? "Remove Bookmark" : "Bookmark"}
                    >
                      <Bookmark className={`w-3 h-3 ${isBookmarked[selectedTrend.id] ? "text-amber-500 fill-amber-500" : ""}`} />
                    </button>

                    <button
                      id="export-doc-button"
                      onClick={() => triggerToast(`Exported strategic brief for ${selectedTrend.title} to PDF draft.`)}
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
                <div className="flex flex-col gap-1 text-[12.5px] text-zinc-600">
                  <div>
                    <span className="font-semibold text-zinc-800 font-sans">Last Updated Date:</span>{" "}
                    <span className="text-zinc-600 font-sans">{formattedPublishDate}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-zinc-800 font-sans">Category:</span>{" "}
                    <span className="text-zinc-600 font-sans">{selectedTrend.sector}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-zinc-800 font-sans">Impact Horizon:</span>{" "}
                    <span className="text-zinc-600 font-sans">{formatTerm(selectedTrend.term)}</span>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1.5 min-w-[100px] select-none">
                  <span className="text-[10px] font-bold tracking-widest text-zinc-400">IMPACT</span>
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
                      <p className="text-[12px] leading-relaxed text-zinc-700 font-normal select-text">
                        {bullet}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Signals list (moved from left bottom pane) */}
              <div className="flex flex-col gap-2 border-t border-zinc-100 pt-3.5 mt-1 select-text">
                <div className="flex items-center justify-between select-none">
                  <span className="text-[13px] font-bold text-zinc-700 font-sans">
                    Signals ({isSignalsLoading ? "..." : selectedTrend.sources.length})
                  </span>
                  <button 
                    onClick={() => setIsSourcesExpanded(!isSourcesExpanded)}
                    className="flex items-center gap-1.5 text-[13px] font-bold text-[#031d24] hover:opacity-80 cursor-pointer select-none bg-transparent border-none outline-none focus:outline-none transition-transform duration-200"
                  >
                    <span>{isSourcesExpanded ? "Close details" : "View details"}</span>
                    <svg 
                      className={`w-4.5 h-4.5 text-[#031d24] transition-transform duration-200 ${isSourcesExpanded ? "rotate-180" : ""}`} 
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

                {/* List of source tags/pills directly - NO dots, NO categorization as requested, COLLAPSIBLE */}
                {isSourcesExpanded && (
                  <div className="flex flex-col gap-2 mt-1 animate-fade-in">
                    {isSignalsLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-5 h-5 text-zinc-300 animate-spin" />
                      </div>
                    ) : selectedTrend.sources.length === 0 ? (
                      <div className="text-[12px] text-zinc-400 py-4 text-center">
                        No signals associated with this horizon trend.
                      </div>
                    ) : (
                      selectedTrend.sources.map(src => {
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

                      // If selected, use a consistent blueish border for all as seen in some monitor versions
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
                            <div className="flex items-center justify-between gap-3 overflow-hidden">
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
                            <div className="animate-fade-in flex flex-col gap-3">
                              <div className="flex items-center justify-between">
                                <span className={`rounded-[3px] py-0.5 px-2 text-[9px] font-semibold tracking-tight inline-block font-sans border leading-none ${getCategoryTagClass(src.category)}`}>
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

                              <div className="flex flex-col bg-white border border-zinc-100 rounded-[4px] px-3 mt-1 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                                <div className="flex items-center justify-between py-1 border-b border-zinc-50">
                                  <span className="text-zinc-600 text-[10.5px]">Published date</span>
                                  <span className="text-zinc-900 text-[10.5px] font-medium">{src.date} 2026</span>
                                </div>
                                <div className="flex items-center justify-between py-1 border-b border-zinc-50">
                                  <span className="text-zinc-600 text-[10.5px]">Organisation</span>
                                  <span className="text-zinc-900 text-[10.5px] font-medium">
                                    {src.organization || (src.category === "Patent" ? "Undisclosed fintech infra co" : "Industry Intelligence")}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between py-1">
                                  <span className="text-zinc-600 text-[10.5px]">Source</span>
                                  <a 
                                    href={src.source_url || "#"} 
                                    target={src.source_url ? "_blank" : undefined}
                                    rel={src.source_url ? "noopener noreferrer" : undefined}
                                    className="text-[#3b82f6] text-[10.5px] font-medium hover:underline flex items-center gap-1"
                                  >
                                    {src.source_url ? "Original article" : (src.category === "Patent" ? "USPTO filing" : "Market Report")}
                                    <Share2 className="w-2.5 h-2.5" />
                                  </a>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
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
                    <div className="text-[12px] text-zinc-500 animate-pulse py-1">
                      Fetching similar prospects...
                    </div>
                  ) : similarFutureProspects.length > 0 ? (
                    similarFutureProspects.map((prospect: any, idx) => (
                      <div className="flex items-start gap-2 py-0.5" key={idx}>
                        <FileText className="w-3.5 h-3.5 text-zinc-400 mt-[2px] shrink-0 select-none" />
                        <button
                          onClick={() => (prospect.trend_id || prospect.id) && setSelectedTrendId(prospect.trend_id || prospect.id)}
                          className="text-left text-[12px] text-zinc-700 hover:text-[#7c3aed] transition-colors leading-normal hover:underline select-text font-normal cursor-pointer"
                        >
                          {prospect.name || prospect.title}
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="text-[12px] text-zinc-400 py-1">
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
        ) : null}

        {activeTab === "ask_marketgenie" && (
          <div className="flex-1 overflow-y-auto p-6 md:p-8 flex flex-col h-full animate-fade-in text-left">
            {/* Message Feed */}
            <div className="flex-1 flex flex-col gap-3 pr-1 pb-4">
                {chatHistory.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center p-4">
                    <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mb-3">
                      <Sparkles className="w-8 h-8 text-zinc-400" />
                    </div>
                    <p className="text-sm text-zinc-500 font-medium">Ask MarketGenie About {selectedTrend?.title || "Trend"}</p>
                    <p className="text-xs text-zinc-400 mt-1">Query potential compliance, integration, and strategy timelines.</p>
                  </div>
                ) : (
                  chatHistory.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex flex-col max-w-[85%] rounded-[8px] p-3 text-[12.5px] leading-relaxed ${
                        msg.role === "user"
                          ? "bg-zinc-100 text-zinc-800 self-end rounded-br-none"
                          : "bg-violet-50 text-zinc-800 border border-violet-100 self-start rounded-bl-none"
                      }`}
                    >
                      <p className="font-sans whitespace-pre-wrap">{msg.text}</p>
                      <ChatSources sources={msg.sources || []} />
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
                <div className="flex flex-wrap gap-1.5 mb-3 select-none">
                  {[
                    `Timeline for ${selectedTrend?.title || "trend"}`,
                    `Regional risks of ${selectedTrend?.title || "trend"}`,
                    `Competitors using ${selectedTrend?.title || "trend"}`
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
              <div className="flex items-center gap-1.5 pt-2 border-t border-zinc-100 select-none">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleChatSend(chatInput)}
                  placeholder={`Ask MarketGenie about ${selectedTrend?.title || "this trend"}...`}
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
            <h2 className="text-[13px] font-bold text-zinc-900 tracking-tight">Bookmarked Strategic Horizons</h2>
              
              {Object.keys(isBookmarked).length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Bookmark className="w-8 h-8 text-zinc-200 mb-2" />
                  <p className="text-xs text-zinc-400 font-medium">No bookmarked outlook items yet.</p>
                  <p className="text-[11px] text-zinc-300 mt-0.5 max-w-[200px] leading-normal">
                    Click the bookmark icon in the Insights panel to save crucial market trends.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {Object.keys(isBookmarked).map(bId => {
                    const trend = trends.find(t => t.id === bId) || RADAR_TRENDS.find(t => t.id === bId);
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

      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex flex-col items-center gap-2 pointer-events-none">
          <div className="bg-zinc-900 text-white text-[12px] px-4 py-2 rounded-full shadow-2xl flex items-center gap-3 pointer-events-auto animate-in fade-in slide-in-from-bottom-4 duration-300">
            <span>{toastMessage}</span>
            {lastHiddenTrend && (
              <button 
                onClick={async (e) => {
                  e.stopPropagation();
                  if (!lastHiddenTrend || !clientId || !userId) return;
                  try {
                    const { error } = await supabase
                      .from("hidden_articles")
                      .delete()
                      .eq("client_id", clientId)
                      .eq("user_id", userId)
                      .eq("trend_cluster_id", lastHiddenTrend.id);
                    if (error) throw error;
                    
                    setHiddenIds(prev => {
                      const next = { ...prev };
                      delete next[lastHiddenTrend.id];
                      return next;
                    });
                    setLastHiddenTrend(null);
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
            {!lastHiddenTrend && (
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
