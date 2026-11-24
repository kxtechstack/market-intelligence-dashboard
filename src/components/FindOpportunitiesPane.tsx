import React, { useMemo, useRef, useState } from "react";
import {
  Activity,
  ArrowLeft,
  ArrowUpRight,
  Bookmark,
  Briefcase,
  Building,
  Building2,
  Car,
  Check,
  Code2,
  Cog,
  Compass,
  Cpu,
  Dna,
  Filter,
  FlaskConical,
  HardHat,
  HeartPulse,
  Landmark,
  Minus,
  Mountain,
  Package,
  Pill,
  Plane,
  Plus,
  Radio,
  Search,
  Shield,
  ShieldCheck,
  Ship,
  ShoppingBag,
  ShoppingCart,
  Sprout,
  TrainFront,
  Truck,
  Wind,
  X,
  Zap,
} from "lucide-react";

interface FindOpportunitiesPaneProps {
  onReturn?: () => void;
}

interface OpportunityItem {
  id: string;
  date: string; // YYYY-MM-DD
  company: string;
  industry: string;
  category: string;
  headline: string;
}

interface SignalEntry {
  date: string;
  tag: string;
  title: string;
  description: string;
}

interface SimilarCompany {
  name: string;
  industry: string;
  reason: string;
}

interface CompanyProfile {
  name: string;
  overview: string;
  opportunity: {
    tag: string;
    detectedDate: string;
    headline: string;
    summary: string;
  };
  about: {
    hq: string;
    revenue: string;
    employees: string;
    ceo: string;
    website: string;
    founded: string;
    industry: string;
    companyType: string;
  };
  signals: SignalEntry[];
}

const OPPORTUNITY_CATEGORIES = [
  "Leadership & Hiring",
  "Investments & Funding",
  "M&A Activity",
  "Product Launches",
  "Geographic Expansion",
  "Partnerships & Alliances",
  "Contracts & Business Wins",
  "Technology Adoption",
  "Facility Expansion",
  "Procurement & Tenders",
  "Strategic Initiatives",
  "Business Performance",
];

function getIndustryIcon(industry: string) {
  const cls = "w-3.5 h-3.5 text-zinc-500";
  switch (industry) {
    case "Mining":
    case "Metals & Mining":
      return <Mountain className={cls} />;
    case "Software":
      return <Code2 className={cls} />;
    case "Healthcare":
      return <HeartPulse className={cls} />;
    case "Energy & Utilities":
      return <Zap className={cls} />;
    case "Retail & E-Commerce":
      return <ShoppingBag className={cls} />;
    case "Supply Chain":
      return <Truck className={cls} />;
    case "Industrial Automation":
    case "Semiconductors":
      return <Cpu className={cls} />;
    case "Financial Services":
    case "Banking":
      return <Landmark className={cls} />;
    case "Chemicals & Materials":
      return <FlaskConical className={cls} />;
    case "Telecommunications":
      return <Radio className={cls} />;
    case "Maritime & Freight":
      return <Ship className={cls} />;
    case "Aerospace & Defense":
      return <Plane className={cls} />;
    case "Biotechnology":
      return <Dna className={cls} />;
    case "Heavy Machinery":
      return <Cog className={cls} />;
    case "Engineering & Construction":
      return <HardHat className={cls} />;
    case "Automotive & EV":
      return <Car className={cls} />;
    case "Asset Management":
      return <Briefcase className={cls} />;
    case "Agriculture":
      return <Sprout className={cls} />;
    case "Forestry & Packaging":
      return <Package className={cls} />;
    case "Transportation":
      return <TrainFront className={cls} />;
    case "Cybersecurity":
      return <ShieldCheck className={cls} />;
    case "Insurance":
      return <Shield className={cls} />;
    case "Travel & Hospitality":
      return <Building className={cls} />;
    case "Pharmaceuticals":
      return <Pill className={cls} />;
    case "Clean Energy":
      return <Wind className={cls} />;
    case "Civil Engineering":
      return <Compass className={cls} />;
    case "Consumer Goods":
      return <ShoppingCart className={cls} />;
    case "MedTech":
      return <Activity className={cls} />;
    default:
      return <Building2 className={cls} />;
  }
}

const NIMBUS_PAY_SIGNALS: SignalEntry[] = [
  {
    date: "9 Nov 2026",
    tag: "Fundraising",
    title: "Closes USD 28M Series B led by a regional fund",
    description:
      "Nimbus Pay announced a USD 28M Series B, bringing total funding to about USD 41M. The company says the money will go into GCC expansion, product development and a larger commercial team. Fresh capital at this stage usually unlocks budget for new vendors, data providers and partners within the next one to three months. It is the strongest buying trigger in this feed, so reach out soon and refer to the round.",
  },
  {
    date: "2 Nov 2026",
    tag: "Key hire",
    title: "Hires VP Partnerships from a global payments firm",
    description:
      "The new VP spent several years building bank and network partnerships at a global payments company. The hire suggests Nimbus Pay is moving from direct sales to a partner-led channel. A new leader typically reviews existing tools and relationships in the first 90 days. This is a good moment to introduce your offer as a way to speed up partner onboarding.",
  },
  {
    date: "21 Oct 2026",
    tag: "Expansion",
    title: "Applies for a UAE payments licence",
    description:
      "A regulatory filing shows an application for a payments licence in the UAE, which would be the company's second market after Saudi Arabia. Licensing usually comes with compliance, risk and local banking needs. Expect hiring of a UAE team and vendor selection to start before the licence is granted, so early conversations can shape those choices.",
  },
  {
    date: "8 Oct 2026",
    tag: "Partnership",
    title: "Integrates with a national payment network",
    description:
      "Nimbus Pay completed an integration with a national payment network, giving merchants direct access to local rails. The company publicly invited ecosystem partners to build on its platform. Partners that add value for merchants, such as analytics, fraud tools or accounting, are likely to get a hearing. Mention the integration to show you follow their roadmap.",
  },
  {
    date: "24 Sep 2026",
    tag: "Product",
    title: "Launches merchant lending in Saudi Arabia",
    description:
      "The new lending product lets merchants borrow against their payment volumes. This creates a fresh revenue line, but it also brings credit risk, collections and regulatory reporting needs the company did not have before. Vendors in risk scoring, data and compliance have a clear opening. The launch is also the reason behind the Series B round.",
  },
  {
    date: "12 Aug 2026",
    tag: "Key hire",
    title: "Appoints Head of Risk",
    description:
      "The first dedicated risk leader joined ahead of the lending launch. The appointment shows risk management is now a funded priority, and new heads usually define their tooling and vendor shortlist early. Approach this person with specifics on how you reduce risk or speed up credit decisions, rather than a general introduction.",
  },
  {
    date: "30 Jul 2026",
    tag: "Expansion",
    title: "Opens Dubai office",
    description:
      "A small Dubai office opened with local hiring under way for sales and operations. It was the first step toward the UAE licence application that followed in October. Teams in a new market often lack local contacts and data, which makes market intelligence, introductions and local partners especially valuable at this point.",
  },
  {
    date: "15 Jul 2026",
    tag: "Partnership",
    title: "Signs a bank partnership for settlement",
    description:
      "A regional bank will handle settlement for Nimbus Pay merchants. Bank partnerships bring stricter security and audit requirements, and they signal that the company is becoming a more established player. It also suggests that more bank relationships may follow, which could open the door to joint opportunities.",
  },
  {
    date: "2 Jun 2026",
    tag: "Product",
    title: "Releases a point-of-sale SDK",
    description:
      "The SDK targets developers and software vendors who want to embed payments in their own apps. It points to a platform strategy that depends on developer adoption and documentation. Companies that sell developer tooling, support or merchant onboarding services may find a natural fit, and the release gives you a concrete product to refer to.",
  },
  {
    date: "19 May 2026",
    tag: "Key hire",
    title: "Hires CTO from a regional bank",
    description:
      "The new CTO comes from a regional bank with deep experience in core systems and security. The hire hints at a platform rebuild or a move to bank-grade infrastructure, probably in preparation for the lending launch. Technology buyers often review cloud, security and data vendors in their first year, so this is useful context for any technical pitch.",
  },
  {
    date: "11 May 2026",
    tag: "Product",
    title: "Upgrades merchant settlement reporting dashboard",
    description:
      "Nimbus Pay introduced real-time reconciliation and settlement reporting exports for multi-branch retail merchants across Riyadh and Jeddah.",
  },
  {
    date: "28 Apr 2026",
    tag: "Partnership",
    title: "Connects with regional e-commerce checkout platforms",
    description:
      "Added plug-and-play checkout integrations for SMB online storefronts to capture higher digital card acceptance volumes.",
  },
  {
    date: "19 Apr 2026",
    tag: "Expansion",
    title: "Expands merchant onboarding team in Jeddah",
    description:
      "Added commercial field representatives covering hospitality and F&B merchants across the western province.",
  },
  {
    date: "3 Apr 2026",
    tag: "Key hire",
    title: "Recruits Compliance Lead for GCC licensing",
    description:
      "Brought on an experienced regional fintech compliance officer to oversee regulatory audits and cross-border expansion readiness.",
  },
  {
    date: "22 Mar 2026",
    tag: "Product",
    title: "Introduces instant digital wallet payouts",
    description:
      "Enabled instant payout transfers for eligible SMB merchants connected to domestic wallet rails.",
  },
];

const SIMILAR_COMPANIES: SimilarCompany[] = [
  {
    name: "Tamara Labs",
    industry: "Fintech",
    reason: "Same sector, region and stage",
  },
  {
    name: "Zayn Remit",
    industry: "Fintech",
    reason: "Same sector, payments focus",
  },
  {
    name: "Qarn Finance",
    industry: "Neo Banking",
    reason: "Same sector and region",
  },
  {
    name: "Wasl Credit",
    industry: "Fintech",
    reason: "Same sector, lending focus",
  },
  {
    name: "Mizan Pay",
    industry: "Fintech",
    reason: "Same sector, merchant acquiring",
  },
  {
    name: "Dirham Flow",
    industry: "Payments",
    reason: "Same sector and region",
  },
  {
    name: "Noor Capital Tech",
    industry: "Fintech",
    reason: "Same sector, B2B lending",
  },
  {
    name: "Alif Treasury",
    industry: "Banking Tech",
    reason: "Same region and stage",
  },
  {
    name: "Riyadh Clear",
    industry: "Payments",
    reason: "Same sector, settlement focus",
  },
  {
    name: "Safa Ledger",
    industry: "Fintech",
    reason: "Same sector, SMB focus",
  },
  {
    name: "Kanz Wallet",
    industry: "Neo Banking",
    reason: "Same sector and region",
  },
  {
    name: "Buraq Settlement",
    industry: "Fintech",
    reason: "Same sector, cross-border focus",
  },
];

const NIMBUS_PAY_PROFILE: CompanyProfile = {
  name: "Nimbus Pay",
  overview:
    "Nimbus Pay is a Riyadh-based payments company that provides card acceptance, digital wallets and settlement services to small and mid-sized merchants. Since 2019 it has grown across Saudi Arabia, and in 2026 it added merchant lending on top of its payments platform. Its customers are retailers, restaurants and online sellers, and it works with local banks and national payment networks. The company is now expanding into the UAE and the wider GCC.",
  opportunity: {
    tag: "Fundraising",
    detectedDate: "Detected 9 Nov 2026",
    headline: "Closes USD 28M Series B to scale merchant lending across the GCC",
    summary:
      "Nimbus Pay has raised a Series B led by a regional fund, following its lending launch in Saudi Arabia in September. The new capital is earmarked for GCC expansion and hiring. Companies in this phase typically review vendors, data providers and partners within 90 days. It fits your Fintech, GCC and funding-signal mandate.",
  },
  about: {
    hq: "Riyadh, KSA",
    revenue: "USD 18–25M",
    employees: "180–220",
    ceo: "[CEO NAME]",
    website: "nimbuspay.example",
    founded: "2019",
    industry: "Fintech · Payments",
    companyType: "Private",
  },
  signals: NIMBUS_PAY_SIGNALS,
};

const COMPANY_PROFILES: Record<string, CompanyProfile> = {
  "Tamara Labs": {
    name: "Tamara Labs",
    overview:
      "Tamara Labs builds merchant checkout financing, installment infrastructure and commercial settlement tools for enterprise and mid-market retailers across Saudi Arabia and the UAE. Founded in 2020, the platform serves omnichannel commerce brands and integrates directly with regional acquiring banks.",
    opportunity: {
      tag: "Expansion",
      detectedDate: "Detected 6 Nov 2026",
      headline: "Expands B2B merchant checkout suite into Bahrain and Kuwait",
      summary:
        "Tamara Labs has broadened its merchant checkout financing stack to cover regional distributors in Bahrain and Kuwait. Geographic rollouts at this scale typically trigger procurement for local KYC, credit bureau integrations and compliance tooling.",
    },
    about: {
      hq: "Riyadh, KSA",
      revenue: "USD 30–45M",
      employees: "250–300",
      ceo: "Tariq Al-Harbi",
      website: "tamaralabs.example",
      founded: "2020",
      industry: "Fintech · Checkout",
      companyType: "Private",
    },
    signals: [
      {
        date: "6 Nov 2026",
        tag: "Expansion",
        title: "Launches cross-border B2B checkout across Bahrain and Kuwait",
        description:
          "Tamara Labs opened onboarding for regional wholesale merchants with automated multi-currency settlement and local bank payout rails.",
      },
      {
        date: "18 Oct 2026",
        tag: "Key hire",
        title: "Appoints VP of Enterprise Risk & Underwriting",
        description:
          "Hired a senior risk executive from a regional consumer bank to oversee merchant credit limits and automated fraud scoring.",
      },
      {
        date: "29 Sep 2026",
        tag: "Partnership",
        title: "Signs acquiring integration with Gulf Commerce Bank",
        description:
          "Partnered with Gulf Commerce Bank to shorten T+1 merchant payouts for high-volume retail chains.",
      },
      {
        date: "11 Aug 2026",
        tag: "Product",
        title: "Releases embedded invoice split API for ERP platforms",
        description:
          "Launched developer-ready REST endpoints allowing regional ERP providers to embed installment schedules directly inside checkout.",
      },
      {
        date: "22 Jul 2026",
        tag: "Fundraising",
        title: "Secures USD 35M credit warehouse facility",
        description:
          "Closed a dedicated working capital warehouse facility to back higher merchant ticket sizes ahead of peak retail quarter.",
      },
    ],
  },
  "Zayn Remit": {
    name: "Zayn Remit",
    overview:
      "Zayn Remit is a Dubai-based cross-border payments and FX settlement platform serving SME importers, logistics firms and marketplace payouts across MENA and South Asia. Its API connects domestic payment schemes with automated treasury hedging.",
    opportunity: {
      tag: "Product",
      detectedDate: "Detected 4 Nov 2026",
      headline: "Rolls out real-time corporate FX corridor between UAE and Saudi Arabia",
      summary:
        "Zayn Remit launched an instant AED-SAR corporate treasury rail aimed at mid-sized suppliers. The product push signals active investment in liquidity routing, AML screening and commercial sales coverage.",
    },
    about: {
      hq: "Dubai, UAE",
      revenue: "USD 12–18M",
      employees: "90–120",
      ceo: "Nadia Al-Mansoor",
      website: "zaynremit.example",
      founded: "2021",
      industry: "Fintech · Cross-border",
      companyType: "Private",
    },
    signals: [
      {
        date: "4 Nov 2026",
        tag: "Product",
        title: "Introduces instant AED-SAR supplier settlement corridor",
        description:
          "SME importers can now settle cross-border trade invoices in under 15 minutes with locked FX spreads.",
      },
      {
        date: "14 Oct 2026",
        tag: "Partnership",
        title: "Integrates with regional trade finance portal",
        description:
          "Added one-click disbursement rails for verified logistics and customs clearing houses in Jebel Ali.",
      },
      {
        date: "25 Sep 2026",
        tag: "Key hire",
        title: "Hires Head of Financial Crime Compliance",
        description:
          "Expanded compliance leadership to support higher corporate remittance volumes under UAE central bank oversight.",
      },
      {
        date: "3 Aug 2026",
        tag: "Expansion",
        title: "Opens Riyadh commercial desk",
        description:
          "Established an on-the-ground sales team in Riyadh to sign Saudi wholesale distributors.",
      },
    ],
  },
  "Qarn Finance": {
    name: "Qarn Finance",
    overview:
      "Qarn Finance operates a digital business banking platform tailored to growth-stage startups and mid-sized enterprises in the GCC. It combines multi-user corporate cards, automated expense controls and treasury yield accounts.",
    opportunity: {
      tag: "Key hire",
      detectedDate: "Detected 1 Nov 2026",
      headline: "Brings in Chief Product Officer to launch SME working capital cards",
      summary:
        "Qarn Finance appointed a former digital banking product head as CPO ahead of its corporate credit card launch. Leadership transitions at this stage often prompt fresh evaluations of card issuing processors and analytics vendors.",
    },
    about: {
      hq: "Manama, Bahrain",
      revenue: "USD 8–12M",
      employees: "60–80",
      ceo: "Faisal Al-Khalifa",
      website: "qarnfinance.example",
      founded: "2022",
      industry: "Neo Banking",
      companyType: "Private",
    },
    signals: [
      {
        date: "1 Nov 2026",
        tag: "Key hire",
        title: "Appoints Chief Product Officer from regional neobank",
        description:
          "Tasked with rolling out charge cards and automated cash-flow forecasting tools for GCC SMEs.",
      },
      {
        date: "9 Oct 2026",
        tag: "Product",
        title: "Launches multi-entity treasury sweep accounts",
        description:
          "Finance teams can now consolidate idle balances across operating subsidiaries from one unified dashboard.",
      },
      {
        date: "19 Sep 2026",
        tag: "Partnership",
        title: "Connects with cloud accounting suites across MENA",
        description:
          "Released bi-directional ledger sync for automated VAT categorization and month-end close.",
      },
      {
        date: "5 Aug 2026",
        tag: "Fundraising",
        title: "Closes USD 14M Series A extension",
        description:
          "Existing institutional backers increased their stake to support regulatory licensing across additional GCC hubs.",
      },
    ],
  },
  "Wasl Credit": {
    name: "Wasl Credit",
    overview:
      "Wasl Credit provides revenue-based financing and invoice factoring to digital merchants, F&B operators and B2B suppliers across Kuwait and Saudi Arabia. Its underwriting engine scores real-time POS and bank statement cash flows.",
    opportunity: {
      tag: "Fundraising",
      detectedDate: "Detected 28 Oct 2026",
      headline: "Raises USD 16M Series A to expand merchant cash-flow lending",
      summary:
        "Wasl Credit secured fresh equity financing to scale automated SME underwriting into Riyadh and Dammam. Teams scaling credit books typically seek alternative data feeds, open-banking aggregators and collections software.",
    },
    about: {
      hq: "Kuwait City, Kuwait",
      revenue: "USD 15–20M",
      employees: "130–160",
      ceo: "Omar Al-Sabah",
      website: "waslcredit.example",
      founded: "2020",
      industry: "Fintech · Lending",
      companyType: "Private",
    },
    signals: [
      {
        date: "28 Oct 2026",
        tag: "Fundraising",
        title: "Closes USD 16M Series A round",
        description:
          "Proceeds will fund automated credit-scoring expansion and commercial onboarding teams across KSA.",
      },
      {
        date: "7 Oct 2026",
        tag: "Product",
        title: "Upgrades instant POS revenue-advance portal",
        description:
          "Merchants can receive automated working capital offers within two hours of connecting POS terminal feeds.",
      },
      {
        date: "16 Sep 2026",
        tag: "Partnership",
        title: "Partners with national hospitality POS aggregator",
        description:
          "Embedded working capital offers inside restaurant management software covering over 3,500 outlets.",
      },
      {
        date: "29 Jul 2026",
        tag: "Key hire",
        title: "Hires Head of Data Science",
        description:
          "Recruited a credit-modeling lead to expand alternative cash-flow underwriting signals.",
      },
    ],
  },
  "Mizan Pay": {
    name: "Mizan Pay",
    overview:
      "Mizan Pay delivers merchant acquiring, QR terminal software and split-settlement infrastructure for multi-vendor marketplaces in Saudi Arabia.",
    opportunity: {
      tag: "Partnership",
      detectedDate: "Detected 25 Oct 2026",
      headline: "Integrates marketplace escrow rails with major logistics carriers",
      summary:
        "Mizan Pay expanded its escrow payout APIs to synchronize cash-on-delivery reconciliation with regional courier networks.",
    },
    about: {
      hq: "Jeddah, KSA",
      revenue: "USD 10–14M",
      employees: "75–100",
      ceo: "Salman Al-Ghamdi",
      website: "mizanpay.example",
      founded: "2021",
      industry: "Fintech · Acquiring",
      companyType: "Private",
    },
    signals: [
      {
        date: "25 Oct 2026",
        tag: "Partnership",
        title: "Launches courier cash-on-delivery reconciliation",
        description:
          "Automates daily payout matching for multi-vendor retail platforms across western and central KSA.",
      },
      {
        date: "3 Oct 2026",
        tag: "Product",
        title: "Releases SoftPOS Android tap-to-pay app",
        description:
          "Enables delivery drivers and field sales reps to accept contactless cards directly on standard Android devices.",
      },
      {
        date: "14 Aug 2026",
        tag: "Key hire",
        title: "Appoints Director of Merchant Growth",
        description:
          "Added commercial leadership focused on enterprise franchise networks.",
      },
    ],
  },
  "Dirham Flow": {
    name: "Dirham Flow",
    overview:
      "Dirham Flow provides automated accounts payable, supplier disbursements and real-time liquidity visibility for mid-market enterprises across the UAE.",
    opportunity: {
      tag: "Product",
      detectedDate: "Detected 20 Oct 2026",
      headline: "Launches automated multi-bank payment orchestration hub",
      summary:
        "Dirham Flow introduced direct host-to-host connectivity for UAE corporate treasuries, creating alignment for ERP and risk partners.",
    },
    about: {
      hq: "Abu Dhabi, UAE",
      revenue: "USD 9–15M",
      employees: "65–90",
      ceo: "Rashed Al-Dhaheri",
      website: "dirhamflow.example",
      founded: "2021",
      industry: "Payments",
      companyType: "Private",
    },
    signals: [
      {
        date: "20 Oct 2026",
        tag: "Product",
        title: "Ships host-to-host corporate bank orchestration",
        description:
          "Consolidates vendor payment approvals and real-time balance feeds across six tier-one UAE banks.",
      },
      {
        date: "27 Sep 2026",
        tag: "Expansion",
        title: "Expands ADGM engineering hub",
        description:
          "Added 20 platform engineers focused on ISO 20022 messaging and real-time reconciliation.",
      },
      {
        date: "10 Aug 2026",
        tag: "Partnership",
        title: "Integrates with regional e-invoicing workflows",
        description:
          "Connected automated VAT validation checks prior to vendor batch releases.",
      },
    ],
  },
  "Noor Capital Tech": {
    name: "Noor Capital Tech",
    overview:
      "Noor Capital Tech specializes in Shari'a-compliant B2B supply chain financing and receivables discounting for healthcare and industrial suppliers.",
    opportunity: {
      tag: "Fundraising",
      detectedDate: "Detected 17 Oct 2026",
      headline: "Secures USD 20M sukuk-backed lending facility",
      summary:
        "Noor Capital Tech expanded its balance sheet capacity to finance hospital and manufacturing supplier invoices across Saudi Arabia.",
    },
    about: {
      hq: "Riyadh, KSA",
      revenue: "USD 14–19M",
      employees: "95–125",
      ceo: "Majed Al-Qahtani",
      website: "noorcaptech.example",
      founded: "2020",
      industry: "Fintech · B2B Lending",
      companyType: "Private",
    },
    signals: [
      {
        date: "17 Oct 2026",
        tag: "Fundraising",
        title: "Closes USD 20M supply-chain liquidity facility",
        description:
          "Expands instant invoice discounting volume for tier-two medical and industrial vendors.",
      },
      {
        date: "22 Sep 2026",
        tag: "Partnership",
        title: "Partners with national procurement exchange",
        description:
          "Embedded early-payment financing options directly inside digital purchase order workflows.",
      },
      {
        date: "6 Aug 2026",
        tag: "Key hire",
        title: "Hires Chief Credit Officer",
        description:
          "Brings deep corporate banking underwriting expertise to oversee larger enterprise tickets.",
      },
    ],
  },
  "Alif Treasury": {
    name: "Alif Treasury",
    overview:
      "Alif Treasury builds cash management, FX risk analytics and liquidity forecasting software for CFO teams at high-growth GCC companies.",
    opportunity: {
      tag: "Expansion",
      detectedDate: "Detected 12 Oct 2026",
      headline: "Opens Doha enterprise advisory office",
      summary:
        "Alif Treasury expanded commercial coverage into Qatar following strong adoption among regional holding groups.",
    },
    about: {
      hq: "Dubai, UAE",
      revenue: "USD 7–11M",
      employees: "50–70",
      ceo: "Karim Haddad",
      website: "aliftreasury.example",
      founded: "2022",
      industry: "Banking Tech",
      companyType: "Private",
    },
    signals: [
      {
        date: "12 Oct 2026",
        tag: "Expansion",
        title: "Establishes commercial presence in Doha",
        description:
          "Supporting treasury digitization projects across Qatari family conglomerates and logistics groups.",
      },
      {
        date: "18 Sep 2026",
        tag: "Product",
        title: "Adds automated FX exposure sensitivity alerts",
        description:
          "Enables finance directors to simulate multi-currency payable shifts across GCC and USD pegs.",
      },
      {
        date: "2 Aug 2026",
        tag: "Key hire",
        title: "Names Head of Enterprise Sales",
        description:
          "Recruited senior SaaS sales leadership to expand large-enterprise recurring contracts.",
      },
    ],
  },
  "Riyadh Clear": {
    name: "Riyadh Clear",
    overview:
      "Riyadh Clear provides high-throughput clearing, automated chargeback dispute management and settlement reconciliation for payment facilitators.",
    opportunity: {
      tag: "Product",
      detectedDate: "Detected 9 Oct 2026",
      headline: "Launches automated merchant dispute & chargeback engine",
      summary:
        "Riyadh Clear rolled out machine-assisted representment tooling for Saudi acquirers and marketplaces.",
    },
    about: {
      hq: "Riyadh, KSA",
      revenue: "USD 11–16M",
      employees: "80–105",
      ceo: "Bandar Al-Otaibi",
      website: "riyadhclear.example",
      founded: "2020",
      industry: "Payments",
      companyType: "Private",
    },
    signals: [
      {
        date: "9 Oct 2026",
        tag: "Product",
        title: "Releases automated chargeback representment suite",
        description:
          "Cuts dispute response turnaround times by gathering order and delivery proofs automatically.",
      },
      {
        date: "15 Sep 2026",
        tag: "Partnership",
        title: "Connects with three domestic acquiring processors",
        description:
          "Broadens automated T+0 settlement visibility across local debit schemes.",
      },
      {
        date: "1 Aug 2026",
        tag: "Key hire",
        title: "Appoints VP of Platform Engineering",
        description:
          "Strengthening core settlement reliability ahead of holiday transaction peaks.",
      },
    ],
  },
  "Safa Ledger": {
    name: "Safa Ledger",
    overview:
      "Safa Ledger combines automated bookkeeping, payroll disbursements and compliance filings for small businesses across Saudi Arabia and Oman.",
    opportunity: {
      tag: "Partnership",
      detectedDate: "Detected 5 Oct 2026",
      headline: "Partners with national SME bank to bundle payroll & payouts",
      summary:
        "Safa Ledger signed a distribution partnership embedding its salary-file automation into retail SME business accounts.",
    },
    about: {
      hq: "Riyadh, KSA",
      revenue: "USD 6–10M",
      employees: "55–75",
      ceo: "Lama Al-Zahrani",
      website: "safaledger.example",
      founded: "2021",
      industry: "Fintech · SMB",
      companyType: "Private",
    },
    signals: [
      {
        date: "5 Oct 2026",
        tag: "Partnership",
        title: "Bundles wage-protection disbursements with SME bank",
        description:
          "Gives over 25,000 small businesses one-click monthly payroll validation and bank transfer execution.",
      },
      {
        date: "11 Sep 2026",
        tag: "Product",
        title: "Adds automated corporate VAT audit trails",
        description:
          "Links card receipts directly to invoice line items for instant tax inspection readiness.",
      },
      {
        date: "29 Jul 2026",
        tag: "Expansion",
        title: "Enters Oman SME accounting market",
        description:
          "Localized payroll rules and Arabic/English invoice templates for Muscat merchants.",
      },
    ],
  },
  "Kanz Wallet": {
    name: "Kanz Wallet",
    overview:
      "Kanz Wallet offers consumer and gig-economy stored-value wallets, instant peer transfers and merchant QR acceptance across Bahrain and UAE.",
    opportunity: {
      tag: "Key hire",
      detectedDate: "Detected 1 Oct 2026",
      headline: "Hires Chief Commercial Officer to grow merchant QR network",
      summary:
        "Kanz Wallet brought on a retail payments veteran to double physical store QR acceptance across high-footfall malls.",
    },
    about: {
      hq: "Manama, Bahrain",
      revenue: "USD 9–13M",
      employees: "70–95",
      ceo: "Yusuf Al-Doseri",
      website: "kanzwallet.example",
      founded: "2021",
      industry: "Neo Banking",
      companyType: "Private",
    },
    signals: [
      {
        date: "1 Oct 2026",
        tag: "Key hire",
        title: "Appoints Chief Commercial Officer",
        description:
          "Leading nationwide retail QR merchant acquisition and loyalty partner programs.",
      },
      {
        date: "12 Sep 2026",
        tag: "Product",
        title: "Launches instant gig-worker payout cards",
        description:
          "Fleet drivers can access same-day earnings directly inside the Kanz mobile wallet.",
      },
      {
        date: "24 Jul 2026",
        tag: "Partnership",
        title: "Joins regional telecom loyalty coalition",
        description:
          "Allows wallet holders to redeem telco points directly at partner checkout counters.",
      },
    ],
  },
  "Buraq Settlement": {
    name: "Buraq Settlement",
    overview:
      "Buraq Settlement builds wholesale cross-border clearing and correspondent liquidity infrastructure for licensed money service businesses in MENA.",
    opportunity: {
      tag: "Expansion",
      detectedDate: "Detected 27 Sep 2026",
      headline: "Receives in-principle clearing approval in DIFC",
      summary:
        "Buraq Settlement passed a key regulatory milestone in Dubai to expand institutional B2B settlement corridors.",
    },
    about: {
      hq: "Dubai, UAE",
      revenue: "USD 14–21M",
      employees: "85–115",
      ceo: "Zaid Al-Sharif",
      website: "buraqsettlement.example",
      founded: "2019",
      industry: "Fintech · Settlement",
      companyType: "Private",
    },
    signals: [
      {
        date: "27 Sep 2026",
        tag: "Expansion",
        title: "Secures DIFC in-principle institutional clearing license",
        description:
          "Unlocks direct settlement onboarding for regional fintechs and licensed exchange houses.",
      },
      {
        date: "4 Sep 2026",
        tag: "Product",
        title: "Releases 24/7 weekend liquidity netting API",
        description:
          "Reduces prefunding capital requirements for cross-border payment apps operating over regional weekends.",
      },
      {
        date: "19 Jul 2026",
        tag: "Key hire",
        title: "Hires Head of Institutional Treasury",
        description:
          "Deepens bank correspondent coverage across Europe, GCC and South Asia.",
      },
    ],
  },
};

const INITIAL_OPPORTUNITIES: OpportunityItem[] = [
  // Nov 12, 2026 (5 opportunities)
  {
    id: "opp-1",
    date: "2026-11-12",
    company: "ABC Holdings",
    industry: "Mining",
    category: "Leadership & Hiring",
    headline: "New CTO Appointed",
  },
  {
    id: "opp-2",
    date: "2026-11-12",
    company: "IBM Tech",
    industry: "Software",
    category: "Facility Expansion",
    headline: "New Data Center Buildout",
  },
  {
    id: "opp-3",
    date: "2026-11-12",
    company: "Meridian Health Systems",
    industry: "Healthcare",
    category: "Technology Adoption",
    headline: "Enterprise Cloud EHR Rollout",
  },
  {
    id: "opp-4",
    date: "2026-11-12",
    company: "Nordic Grid Energy",
    industry: "Energy & Utilities",
    category: "Procurement & Tenders",
    headline: "Grid Modernization RFP Issued",
  },
  {
    id: "opp-5",
    date: "2026-11-12",
    company: "Cascade Retail Group",
    industry: "Retail & E-Commerce",
    category: "Strategic Initiatives",
    headline: "Omnichannel Fulfillment Program",
  },

  // Nov 11, 2026 (6 opportunities)
  {
    id: "opp-6",
    date: "2026-11-11",
    company: "Vanguard Logistics",
    industry: "Supply Chain",
    category: "Geographic Expansion",
    headline: "Southeast Asia Hub Opening",
  },
  {
    id: "opp-7",
    date: "2026-11-11",
    company: "Kestrel Robotics",
    industry: "Industrial Automation",
    category: "Investments & Funding",
    headline: "$120M Series C Growth Round",
  },
  {
    id: "opp-8",
    date: "2026-11-11",
    company: "Solstice Financial",
    industry: "Financial Services",
    category: "M&A Activity",
    headline: "Acquires CorePay Settlement Unit",
  },
  {
    id: "opp-9",
    date: "2026-11-11",
    company: "Veridian Chemicals",
    industry: "Chemicals & Materials",
    category: "Facility Expansion",
    headline: "Rotterdam Plant Capacity Doubling",
  },
  {
    id: "opp-10",
    date: "2026-11-11",
    company: "Crestline Telecom",
    industry: "Telecommunications",
    category: "Contracts & Business Wins",
    headline: "5G Core Upgrade Award",
  },
  {
    id: "opp-11",
    date: "2026-11-11",
    company: "Harborview Shipping",
    industry: "Maritime & Freight",
    category: "Technology Adoption",
    headline: "Fleet Telemetry Platform Deployment",
  },

  // Nov 10, 2026 (3 opportunities)
  {
    id: "opp-12",
    date: "2026-11-10",
    company: "Helios Semiconductors",
    industry: "Semiconductors",
    category: "Partnerships & Alliances",
    headline: "Joint Silicon Foundry Alliance",
  },
  {
    id: "opp-13",
    date: "2026-11-10",
    company: "Cobalt Defense Corp",
    industry: "Aerospace & Defense",
    category: "Contracts & Business Wins",
    headline: "$85M Fleet Telemetry Contract",
  },
  {
    id: "opp-14",
    date: "2026-11-10",
    company: "Aurelia BioSciences",
    industry: "Biotechnology",
    category: "Product Launches",
    headline: "Next-Gen Diagnostics Suite Launch",
  },

  // Nov 9, 2026 (4 opportunities)
  {
    id: "opp-15",
    date: "2026-11-09",
    company: "Pinnacle Manufacturing",
    industry: "Heavy Machinery",
    category: "Business Performance",
    headline: "Q3 Order Backlog Up 28%",
  },
  {
    id: "opp-16",
    date: "2026-11-09",
    company: "Oakridge Construction",
    industry: "Engineering & Construction",
    category: "Procurement & Tenders",
    headline: "Transit Corridor Contractor Bid",
  },
  {
    id: "opp-17",
    date: "2026-11-09",
    company: "Zephyr Mobility",
    industry: "Automotive & EV",
    category: "Geographic Expansion",
    headline: "Munich Commercial Sales Office",
  },
  {
    id: "opp-18",
    date: "2026-11-09",
    company: "Sterling Wealth Partners",
    industry: "Asset Management",
    category: "Leadership & Hiring",
    headline: "Appoints Head of Digital Platforms",
  },

  // Nov 6, 2026 (6 opportunities)
  {
    id: "opp-19",
    date: "2026-11-06",
    company: "Atlas Steelworks",
    industry: "Metals & Mining",
    category: "Strategic Initiatives",
    headline: "Low-Carbon Smelting Transformation",
  },
  {
    id: "opp-20",
    date: "2026-11-06",
    company: "Bluewater AgriTech",
    industry: "Agriculture",
    category: "Investments & Funding",
    headline: "$45M Precision Farming Raise",
  },
  {
    id: "opp-21",
    date: "2026-11-06",
    company: "Luminary Media Cloud",
    industry: "Software",
    category: "Product Launches",
    headline: "Enterprise AI Compliance Module",
  },
  {
    id: "opp-22",
    date: "2026-11-06",
    company: "Boreal Pulp & Paper",
    industry: "Forestry & Packaging",
    category: "Facility Expansion",
    headline: "Bio-Packaging Mill Expansion",
  },
  {
    id: "opp-23",
    date: "2026-11-06",
    company: "Horizon Rail Freight",
    industry: "Transportation",
    category: "M&A Activity",
    headline: "Merges With Midwest Intermodal",
  },
  {
    id: "opp-24",
    date: "2026-11-06",
    company: "Trident Cyber Defense",
    industry: "Cybersecurity",
    category: "Partnerships & Alliances",
    headline: "Cloud Zero-Trust Channel Pact",
  },

  // Nov 4, 2026 (4 opportunities)
  {
    id: "opp-25",
    date: "2026-11-04",
    company: "Clearview Insurance",
    industry: "Insurance",
    category: "Technology Adoption",
    headline: "Automated Claims Underwriting Engine",
  },
  {
    id: "opp-26",
    date: "2026-11-04",
    company: "Monarch Hospitality",
    industry: "Travel & Hospitality",
    category: "Geographic Expansion",
    headline: "12 New Properties in Japan",
  },
  {
    id: "opp-27",
    date: "2026-11-04",
    company: "Keystone Pharma",
    industry: "Pharmaceuticals",
    category: "Leadership & Hiring",
    headline: "New VP of Global Supply Chain",
  },
  {
    id: "opp-28",
    date: "2026-11-04",
    company: "Vertex Power Systems",
    industry: "Clean Energy",
    category: "Contracts & Business Wins",
    headline: "400MW Storage Supply Agreement",
  },

  // Nov 2, 2026 (3 opportunities)
  {
    id: "opp-29",
    date: "2026-11-02",
    company: "Granite Infrastructure",
    industry: "Civil Engineering",
    category: "Procurement & Tenders",
    headline: "Port Electrification Equipment Tender",
  },
  {
    id: "opp-30",
    date: "2026-11-02",
    company: "Apex Microelectronics",
    industry: "Semiconductors",
    category: "Business Performance",
    headline: "Record Industrial Chip Revenue",
  },
  {
    id: "opp-31",
    date: "2026-11-02",
    company: "Silverline Bancorp",
    industry: "Banking",
    category: "Strategic Initiatives",
    headline: "Treasury API Modernization Plan",
  },

  // Oct 29, 2026 (5 opportunities)
  {
    id: "opp-32",
    date: "2026-10-29",
    company: "Delta Cold Storage",
    industry: "Supply Chain",
    category: "Facility Expansion",
    headline: "Automated Cold Hub in Dallas",
  },
  {
    id: "opp-33",
    date: "2026-10-29",
    company: "Orion Aerospace",
    industry: "Aerospace & Defense",
    category: "Partnerships & Alliances",
    headline: "Avionics Co-Development Venture",
  },
  {
    id: "opp-34",
    date: "2026-10-29",
    company: "Summit Food Brands",
    industry: "Consumer Goods",
    category: "M&A Activity",
    headline: "Acquires Artisanal Beverage Line",
  },
  {
    id: "opp-35",
    date: "2026-10-29",
    company: "Nimbus Cloud Systems",
    industry: "Software",
    category: "Investments & Funding",
    headline: "$95M Infrastructure Debt Facility",
  },
  {
    id: "opp-36",
    date: "2026-10-29",
    company: "Redwood Medical Devices",
    industry: "MedTech",
    category: "Product Launches",
    headline: "FDA Clearance for Surgical Sensor",
  },
];

function getSignalTagClass(tag: string) {
  switch (tag) {
    case "Fundraising":
      return "bg-emerald-50 border border-emerald-200 text-emerald-800";
    case "Key hire":
      return "bg-indigo-50 border border-indigo-200 text-indigo-800";
    case "Expansion":
      return "bg-amber-50 border border-amber-200 text-amber-800";
    case "Partnership":
      return "bg-zinc-100 border border-zinc-200 text-zinc-700";
    case "Product":
      return "bg-violet-50 border border-violet-200 text-violet-800";
    default:
      return "bg-zinc-100 border border-zinc-200 text-zinc-700";
  }
}

export default function FindOpportunitiesPane({ onReturn }: FindOpportunitiesPaneProps) {
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>("All time");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>("All");
  const [selectedOpportunity, setSelectedOpportunity] = useState<OpportunityItem | null>(null);
  const [companyHistory, setCompanyHistory] = useState<string[]>([]);
  const [viewedIds, setViewedIds] = useState<Set<string>>(() => new Set());
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(() => new Set());
  const [showAllSignals, setShowAllSignals] = useState(false);
  const [showAllSimilar, setShowAllSimilar] = useState(false);
  const [restorePromptItem, setRestorePromptItem] = useState<OpportunityItem | null>(null);
  const [expandedDates, setExpandedDates] = useState<Record<string, boolean>>({});
  const detailsViewportRef = useRef<HTMLDivElement | null>(null);

  const latestOpportunityDate = useMemo(() => {
    return INITIAL_OPPORTUNITIES.reduce((max, item) => (item.date > max ? item.date : max), "");
  }, []);

  const getDefaultStatusTag = (dateStr: string): "New" | "Unread" => {
    const refDateStr = latestOpportunityDate || new Date().toISOString().split("T")[0];
    const [ry, rm, rd] = refDateStr.split("-").map(Number);
    const [iy, im, id] = dateStr.split("-").map(Number);
    if (!ry || !rm || !rd || !iy || !im || !id) return "Unread";
    const refUtc = Date.UTC(ry, rm - 1, rd);
    const itemUtc = Date.UTC(iy, im - 1, id);
    const diffDays = Math.floor((refUtc - itemUtc) / (1000 * 60 * 60 * 24));
    return diffDays < 2 ? "New" : "Unread";
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

  const filteredOpportunities = useMemo(() => {
    let cutoffDateStr: string | null = null;
    if (selectedTimeframe !== "All time") {
      const match = selectedTimeframe.match(/\d+/);
      if (match) {
        const days = parseInt(match[0], 10);
        if (!isNaN(days) && days > 0) {
          const d = new Date();
          d.setUTCDate(d.getUTCDate() - days);
          cutoffDateStr = d.toISOString().split("T")[0];
        }
      }
    }

    const q = searchQuery.trim().toLowerCase();

    return INITIAL_OPPORTUNITIES.filter((item) => {
      if (cutoffDateStr && item.date < cutoffDateStr) return false;
      if (selectedCategoryFilter !== "All" && item.category !== selectedCategoryFilter) return false;
      if (q) {
        const hay = `${item.company} ${item.industry} ${item.category} ${item.headline}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [searchQuery, selectedTimeframe, selectedCategoryFilter]);

  const formatDateHeader = (dateStr: string) => {
    const parts = dateStr.split("-");
    if (parts.length !== 3) return dateStr;
    const d = new Date(Date.UTC(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2])));
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      timeZone: "UTC",
    });
  };

  const { groupedOpportunities, orderedDates } = useMemo(() => {
    const groups: Record<string, OpportunityItem[]> = {};
    const dates: string[] = [];

    filteredOpportunities.forEach((item) => {
      const label = formatDateHeader(item.date);
      if (!groups[label]) {
        groups[label] = [];
        dates.push(label);
      }
      groups[label].push(item);
    });

    return { groupedOpportunities: groups, orderedDates: dates };
  }, [filteredOpportunities]);

  const toggleDateGroup = (dateGroup: string) => {
    setExpandedDates((prev) => {
      const current = prev[dateGroup] !== undefined ? prev[dateGroup] : true;
      return { ...prev, [dateGroup]: !current };
    });
  };

  const handleRowClick = (item: OpportunityItem) => {
    setSelectedOpportunity(item);
    setCompanyHistory([]);
    setShowAllSignals(false);
    setShowAllSimilar(false);
    setViewedIds((prev) => {
      if (prev.has(item.id)) return prev;
      const next = new Set(prev);
      next.add(item.id);
      return next;
    });
  };

  const handleClosePane = () => {
    setSelectedOpportunity(null);
    setCompanyHistory([]);
  };

  const handleViewSimilarCompany = (companyName: string) => {
    setCompanyHistory((prev) => [...prev, companyName]);
    setShowAllSignals(false);
    setShowAllSimilar(false);
    detailsViewportRef.current?.scrollTo({ top: 0 });
  };

  const handleBackCompany = () => {
    setCompanyHistory((prev) => prev.slice(0, -1));
    setShowAllSignals(false);
    setShowAllSimilar(false);
    detailsViewportRef.current?.scrollTo({ top: 0 });
  };

  const handleConfirmRestore = () => {
    if (!restorePromptItem) return;
    const idToRestore = restorePromptItem.id;
    setViewedIds((prev) => {
      const next = new Set(prev);
      next.delete(idToRestore);
      return next;
    });
    if (selectedOpportunity?.id === idToRestore) {
      handleClosePane();
    }
    setRestorePromptItem(null);
  };

  const toggleBookmark = (id: string) => {
    setBookmarkedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const activeSimilarCompanyName =
    companyHistory.length > 0 ? companyHistory[companyHistory.length - 1] : null;

  const currentProfile: CompanyProfile = activeSimilarCompanyName
    ? COMPANY_PROFILES[activeSimilarCompanyName] || NIMBUS_PAY_PROFILE
    : NIMBUS_PAY_PROFILE;

  const activeBookmarkKey = activeSimilarCompanyName
    ? `company:${activeSimilarCompanyName}`
    : selectedOpportunity?.id || "nimbus";

  const currentSimilarCompanies = useMemo(() => {
    if (!activeSimilarCompanyName) return SIMILAR_COMPANIES;
    const pool: SimilarCompany[] = [
      {
        name: "Nimbus Pay",
        industry: "Fintech",
        reason: "Same sector, region and lending focus",
      },
      ...SIMILAR_COMPANIES,
    ];
    return pool.filter((c) => c.name !== currentProfile.name);
  }, [activeSimilarCompanyName, currentProfile.name]);

  const visibleSignals = showAllSignals
    ? currentProfile.signals
    : currentProfile.signals.slice(0, 10);

  const visibleSimilarCompanies = showAllSimilar
    ? currentSimilarCompanies
    : currentSimilarCompanies.slice(0, 4);

  return (
    <div id="find-opportunities-dashboard" className="flex-1 h-full flex bg-white overflow-hidden relative justify-center font-sans">
      {/* Main Column */}
      <div id="find-opportunities-column" className="w-full max-w-[1178px] mx-auto h-full flex flex-col bg-white flex-shrink-0 animate-fade-in border-x border-zinc-200">
        
        {/* Header section */}
        <div id="find-opportunities-header" className="h-[53px] px-4 border-b border-zinc-100 flex items-center justify-between flex-shrink-0 bg-white">
          <div className="flex items-center gap-4">
            <h2 
              id="find-opportunities-heading-title" 
              style={{ fontFamily: "'Source Serif 4', Georgia, Cambria, 'Times New Roman', Times, serif" }}
              className="text-[19px] font-semibold tracking-tight text-zinc-900 select-none font-serif-source"
            >
              Find Opportunities
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
                placeholder="Search Find Opportunities..."
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
                  {OPPORTUNITY_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Opportunity Cards List */}
        <div
          className={`relative flex-1 overflow-y-auto py-3 flex flex-col gap-4 bg-white transition-all duration-300 ${
            selectedOpportunity ? "blur-sm" : ""
          }`}
        >
          {selectedOpportunity && (
            <div
              className="absolute inset-0 z-50 bg-transparent cursor-pointer"
              onClick={handleClosePane}
            />
          )}

          {filteredOpportunities.length === 0 ? (
            <div className="p-8 text-center text-zinc-400 text-xs">
              No matching opportunities for your filter parameters.
            </div>
          ) : (
            <div className="flex flex-col gap-4 w-full animate-in fade-in duration-200">
              {orderedDates.map((dateLabel) => {
                const itemsInGroup = groupedOpportunities[dateLabel] || [];
                const isExpanded = expandedDates[dateLabel] !== undefined ? !!expandedDates[dateLabel] : true;

                return (
                  <div key={dateLabel} className="flex flex-col w-full">
                    {/* Date Header with slight yellowish background */}
                    <div
                      onClick={() => toggleDateGroup(dateLabel)}
                      className="flex items-center justify-between py-1.5 px-4 cursor-pointer bg-[#fefce8]/80 hover:bg-[#fef9c3]/50 transition-colors select-none group/date w-full"
                    >
                      <div className="flex items-center gap-2">
                        <h3 className="text-[10px] font-bold text-zinc-600 tracking-wider uppercase group-hover/date:text-zinc-900 transition-colors">
                          {dateLabel}
                        </h3>
                        <span className="text-[9.5px] font-medium text-zinc-500 bg-amber-100/60 px-1.5 py-0.5 rounded">
                          {itemsInGroup.length} {itemsInGroup.length === 1 ? "Opportunity" : "Opportunities"}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleDateGroup(dateLabel);
                        }}
                        className="p-1 text-zinc-400 group-hover/date:text-zinc-700 hover:bg-amber-200/40 transition-colors flex items-center justify-center rounded cursor-pointer"
                        title={isExpanded ? "Collapse" : "Expand"}
                      >
                        {isExpanded ? (
                          <Minus className="w-3.5 h-3.5 text-zinc-500" />
                        ) : (
                          <Plus className="w-3.5 h-3.5 text-zinc-500" />
                        )}
                      </button>
                    </div>

                    {/* 5-Column Borderless Rows (no vertical lines, no table header) */}
                    {isExpanded && (
                      <div className="w-full flex flex-col border-y border-zinc-200/80 divide-y divide-zinc-200/80">
                        {itemsInGroup.map((item) => {
                          const isViewed = viewedIds.has(item.id);
                          const isSelected = selectedOpportunity?.id === item.id;

                          return (
                            <div
                              key={item.id}
                              onClick={() => handleRowClick(item)}
                              className={`w-full px-4 py-1.5 cursor-pointer transition-colors grid grid-cols-[20px_1.2fr_1fr_1.35fr_1.6fr_64px] items-center gap-3 border-l-[3.5px] ${
                                isSelected
                                  ? "border-l-[#2d39d2] bg-[#eef1fe]/30"
                                  : "border-l-transparent bg-white hover:bg-zinc-50/70"
                              }`}
                            >
                              {/* Column 0: Industry Icon */}
                              <div className="flex items-center justify-center select-none" title={item.industry}>
                                {getIndustryIcon(item.industry)}
                              </div>

                              {/* Column 1: Company (same font weight as Column 4) */}
                              <div className="text-[12.5px] font-medium text-zinc-900 truncate select-none">
                                {item.company}
                              </div>

                              {/* Column 2: Industry */}
                              <div className="text-[12px] text-zinc-600 truncate select-none">
                                {item.industry}
                              </div>

                              {/* Column 3: Category */}
                              <div className="text-[12px] text-zinc-700 truncate select-none">
                                {item.category}
                              </div>

                              {/* Column 4: Headline */}
                              <div className="text-[12.5px] font-medium text-zinc-800 truncate select-none">
                                {item.headline}
                              </div>

                              {/* Column 5: Status ("New" for previous 2 days, "Unread" before that; tick box once opened) */}
                              <div className="flex items-center justify-end select-none">
                                {isViewed ? (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setRestorePromptItem(item);
                                    }}
                                    className="inline-flex items-center justify-center w-5 h-5 rounded-[3px] hover:bg-zinc-100 transition-colors cursor-pointer"
                                    title="Restore status"
                                  >
                                    <span className="inline-flex items-center justify-center w-4 h-4 rounded-[3px] border border-zinc-700 bg-white text-zinc-900">
                                      <Check className="w-3 h-3 stroke-[2.5]" />
                                    </span>
                                  </button>
                                ) : (() => {
                                  const statusTag = getDefaultStatusTag(item.date);
                                  return (
                                    <span
                                      className={`inline-flex items-center px-1.5 py-0.5 rounded-[3px] text-[9.5px] font-semibold border ${
                                        statusTag === "New"
                                          ? "bg-[#eef1fe] text-[#2d39d2] border-[#c7d2fe]"
                                          : "bg-zinc-100 text-zinc-600 border-zinc-200"
                                      }`}
                                    >
                                      {statusTag}
                                    </span>
                                  );
                                })()}
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
        </div>
      </div>

      {/* RIGHT COLUMN: Expanded Pane (48% width = 20% wider than 40% pane on other pages) */}
      {selectedOpportunity && (
        <div
          id="opportunity-content-pane"
          className="absolute top-0 right-0 w-[48%] h-full flex flex-col bg-white overflow-hidden shadow-2xl z-[100] animate-in slide-in-from-right duration-300 font-sans border-l border-zinc-200"
        >
          {/* Top header with optional top-left Back button and Close button */}
          <div className="px-5 border-b border-zinc-100 flex items-center justify-between h-11 flex-shrink-0">
            <div>
              {companyHistory.length > 0 && (
                <button
                  type="button"
                  onClick={handleBackCompany}
                  className="inline-flex items-center gap-1.5 px-2 py-1 rounded hover:bg-zinc-100 text-[12px] font-medium text-zinc-600 hover:text-zinc-900 transition-colors cursor-pointer font-sans"
                  title="Back"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={handleClosePane}
              className="w-6 h-6 flex items-center justify-center rounded hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 transition-colors cursor-pointer"
              title="Close details"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Details Viewport */}
          <div
            ref={detailsViewportRef}
            key={`${selectedOpportunity.id}-${currentProfile.name}`}
            id="opportunity-details-viewport"
            className="flex-1 overflow-y-auto overflow-x-hidden py-4 md:py-5 flex flex-col gap-4 animate-fade-in bg-[#fafafa]/30 select-text relative font-sans"
          >
            {/* Company Overview Block */}
            <div className="px-6 md:px-8 flex flex-col gap-2">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-6 h-6 rounded-[4px] border border-zinc-200 bg-zinc-50 flex items-center justify-center shrink-0">
                    <Landmark className="w-3.5 h-3.5 text-zinc-700" />
                  </div>
                  <h1 className="text-xl sm:text-[22px] font-semibold leading-tight tracking-tight text-[#111827] font-sans truncate">
                    {currentProfile.name}
                  </h1>
                </div>

                <button
                  type="button"
                  onClick={() => toggleBookmark(activeBookmarkKey)}
                  className={`w-[24px] h-[24px] border rounded-[4px] flex items-center justify-center transition-colors shrink-0 cursor-pointer ${
                    bookmarkedIds.has(activeBookmarkKey)
                      ? "bg-amber-50/60 border-amber-200/80 text-amber-500 hover:bg-amber-100/35"
                      : "bg-[#fafafa] border-zinc-200 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100/50"
                  }`}
                  title="Bookmark"
                >
                  <Bookmark
                    className={`w-3.5 h-3.5 ${
                      bookmarkedIds.has(activeBookmarkKey) ? "text-amber-500 fill-amber-500" : ""
                    }`}
                  />
                </button>
              </div>

              <p
                className="text-[13px] leading-[1.45] text-zinc-800 font-[350] font-sans text-left"
                style={{ fontWeight: 350 }}
              >
                {currentProfile.overview}
              </p>
            </div>

            <div className="border-t border-zinc-200/80 w-full" />

            {/* About the opportunity */}
            <div className="px-6 md:px-8 flex flex-col gap-1.5">
              <div className="flex items-center">
                <h2 className="text-[13px] font-semibold tracking-tight text-zinc-900 font-sans">
                  About the opportunity
                </h2>
              </div>

              <div className="flex items-center gap-2">
                <span className={`rounded-[3px] py-0.5 px-2 text-[9px] font-semibold tracking-tight inline-block font-sans ${getSignalTagClass(currentProfile.opportunity.tag)}`}>
                  {currentProfile.opportunity.tag}
                </span>
                <span className="text-[11.5px] text-zinc-500 font-sans">
                  {currentProfile.opportunity.detectedDate}
                </span>
              </div>

              <h3 className="text-[16px] font-semibold leading-tight tracking-tight text-[#111827] font-sans">
                {currentProfile.opportunity.headline}
              </h3>

              <p
                className="text-[13px] leading-[1.45] text-zinc-800 font-[350] font-sans"
                style={{ fontWeight: 350 }}
              >
                {currentProfile.opportunity.summary}
              </p>
            </div>

            <div className="border-t border-zinc-200/80 w-full" />

            {/* About the company */}
            <div className="px-6 md:px-8 flex flex-col gap-2">
              <div className="flex items-center">
                <h2 className="text-[13px] font-semibold tracking-tight text-zinc-900 font-sans">
                  About the company
                </h2>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-y-2.5 gap-x-4 border border-zinc-200 rounded-[4px] p-3 bg-zinc-50/30">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[11px] leading-tight text-zinc-500 font-normal font-sans">HQ</span>
                  <span className="text-[12.5px] leading-tight font-semibold text-zinc-900 font-sans">{currentProfile.about.hq}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[11px] leading-tight text-zinc-500 font-normal font-sans">Revenue (est.)</span>
                  <span className="text-[12.5px] leading-tight font-semibold text-zinc-900 font-sans">{currentProfile.about.revenue}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[11px] leading-tight text-zinc-500 font-normal font-sans">Employees</span>
                  <span className="text-[12.5px] leading-tight font-semibold text-zinc-900 font-sans">{currentProfile.about.employees}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[11px] leading-tight text-zinc-500 font-normal font-sans">CEO</span>
                  <span className="text-[12.5px] leading-tight font-semibold text-zinc-900 font-sans">{currentProfile.about.ceo}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[11px] leading-tight text-zinc-500 font-normal font-sans">Website</span>
                  <span className="text-[12.5px] leading-tight font-semibold text-zinc-900 font-sans">{currentProfile.about.website}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[11px] leading-tight text-zinc-500 font-normal font-sans">Founded</span>
                  <span className="text-[12.5px] leading-tight font-semibold text-zinc-900 font-sans">{currentProfile.about.founded}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[11px] leading-tight text-zinc-500 font-normal font-sans">Industry</span>
                  <span className="text-[12.5px] leading-tight font-semibold text-zinc-900 font-sans">{currentProfile.about.industry}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[11px] leading-tight text-zinc-500 font-normal font-sans">Company type</span>
                  <span className="text-[12.5px] leading-tight font-semibold text-zinc-900 font-sans">{currentProfile.about.companyType}</span>
                </div>
              </div>
            </div>

            <div className="border-t border-zinc-200/80 w-full" />

            {/* Latest signals */}
            <div className="px-6 md:px-8 flex flex-col gap-2">
              <div className="flex flex-wrap items-baseline gap-2">
                <h2 className="text-[13px] font-semibold tracking-tight text-zinc-900 font-sans">
                  Latest signals
                </h2>
                <span className="text-[11.5px] text-zinc-500 font-sans">
                  {currentProfile.signals.length} signals in the last 6 months. Context for your outreach.
                </span>
              </div>

              <div className="flex flex-col border-y border-zinc-200/80 divide-y divide-zinc-200/80 bg-white">
                {visibleSignals.map((sig, idx) => (
                  <div
                    key={idx}
                    className="py-2 px-2 flex flex-col gap-1 hover:bg-zinc-50/60 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[11.5px] leading-none text-zinc-500 font-sans">
                          {sig.date}
                        </span>
                        <span
                          className={`rounded-[3px] py-0.5 px-2 text-[9px] font-semibold tracking-tight inline-block font-sans ${getSignalTagClass(
                            sig.tag
                          )}`}
                        >
                          {sig.tag}
                        </span>
                      </div>
                      <button
                        type="button"
                        className="w-5 h-5 rounded-[4px] border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-500 hover:text-zinc-900 flex items-center justify-center shrink-0 cursor-pointer"
                        title="Open signal source"
                      >
                        <ArrowUpRight className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="w-full flex flex-col gap-0.5">
                      <h4 className="text-[13px] font-semibold text-zinc-900 leading-tight font-sans">
                        {sig.title}
                      </h4>
                      <p
                        className="text-[11.5px] leading-[1.4] text-zinc-700 font-[350] font-sans"
                        style={{ fontWeight: 350 }}
                      >
                        {sig.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-0.5">
                <span className="text-[11.5px] text-zinc-500 font-sans">
                  Showing {visibleSignals.length} of {currentProfile.signals.length} signals
                </span>
                {currentProfile.signals.length > 10 && (
                  <button
                    type="button"
                    onClick={() => setShowAllSignals((prev) => !prev)}
                    className="px-3 py-1 text-[11.5px] font-medium text-zinc-700 bg-white border border-zinc-200 rounded-[4px] hover:bg-zinc-50 transition-colors cursor-pointer font-sans"
                  >
                    {showAllSignals ? "Show fewer" : `Show all ${currentProfile.signals.length}`}
                  </button>
                )}
              </div>
            </div>

            <div className="border-t border-zinc-200/80 w-full" />

            {/* Similar companies */}
            <div className="px-6 md:px-8 flex flex-col gap-2 pb-1">
              <div className="flex flex-wrap items-baseline gap-2">
                <h2 className="text-[13px] font-semibold tracking-tight text-zinc-900 font-sans">
                  Similar companies
                </h2>
                <span className="text-[11.5px] text-zinc-500 font-sans">
                  Same space, but no clear signal right now. Worth watching.
                </span>
              </div>

              <div className="flex flex-col bg-white border-b border-zinc-200/80">
                <div className="py-2 px-1 grid grid-cols-[1.15fr_0.9fr_1.6fr_auto] items-center gap-3 border-b border-zinc-200/80">
                  <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider font-sans">
                    Company
                  </span>
                  <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider font-sans">
                    Industry
                  </span>
                  <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider font-sans">
                    Reason
                  </span>
                  <span className="sr-only">Action</span>
                </div>

                <div className="divide-y divide-zinc-200/80">
                  {visibleSimilarCompanies.map((comp) => (
                    <div
                      key={comp.name}
                      className="py-2.5 px-1 grid grid-cols-[1.15fr_0.9fr_1.6fr_auto] items-center gap-3 hover:bg-zinc-50/60 transition-colors"
                    >
                      <div className="text-[12.5px] font-semibold text-zinc-900 truncate font-sans">
                        {comp.name}
                      </div>

                      <div className="text-[12px] text-zinc-700 truncate font-sans">
                        {comp.industry}
                      </div>

                      <div className="text-[12px] text-zinc-600 truncate font-sans">
                        {comp.reason}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleViewSimilarCompany(comp.name)}
                        className="text-[11.5px] font-medium text-zinc-700 hover:text-zinc-900 inline-flex items-center gap-1 whitespace-nowrap cursor-pointer font-sans"
                      >
                        View company →
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[11.5px] text-zinc-500 font-sans">
                  Showing {visibleSimilarCompanies.length} of {currentSimilarCompanies.length} similar companies
                </span>
                <button
                  type="button"
                  onClick={() => setShowAllSimilar((prev) => !prev)}
                  className="px-3 py-1 text-[11.5px] font-medium text-zinc-700 bg-white border border-zinc-200 rounded-[4px] hover:bg-zinc-50 transition-colors cursor-pointer font-sans"
                >
                  {showAllSimilar ? "Show less" : "Show more"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Restore Status Confirmation Modal */}
      {restorePromptItem && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-2xs z-50 flex items-center justify-center p-4"
          onClick={() => setRestorePromptItem(null)}
        >
          <div
            className="w-full max-w-sm bg-white rounded-[8px] border border-zinc-200 shadow-xl p-5 animate-in fade-in duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3 mb-3">
              <h3 className="text-[14.5px] font-semibold text-zinc-900">Restore Status</h3>
              <button
                type="button"
                onClick={() => setRestorePromptItem(null)}
                className="p-1 text-zinc-400 hover:text-zinc-700 rounded cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[12.5px] text-zinc-600 leading-relaxed mb-5">
              Do you want to restore the status of{" "}
              <span className="font-medium text-zinc-900">{restorePromptItem.headline}</span> to{" "}
              <span className="font-semibold text-zinc-900">
                "{getDefaultStatusTag(restorePromptItem.date)}"
              </span>
              ?
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setRestorePromptItem(null)}
                className="px-3 py-1.5 text-[12px] font-medium text-zinc-600 bg-white border border-zinc-200 rounded-[4px] hover:bg-zinc-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRestore}
                className="px-3 py-1.5 text-[12px] font-medium bg-zinc-900 text-white rounded-[4px] hover:bg-black transition-colors cursor-pointer"
              >
                Restore to {getDefaultStatusTag(restorePromptItem.date)}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
