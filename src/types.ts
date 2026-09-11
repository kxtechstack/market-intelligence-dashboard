export interface AlertItem {
  id: string;
  client_id: string;
  industry: string;
  source_article_url: string;
  source: string;
  source_type?: string;
  source_published_date: string;
  signal_title: string;
  category: string;
  impact_level: string;
  country: string;
  summary: string;
  business_impact: string[];
  date_detected: string;
  job_id: string;
  created_at: string;
  bookmark_created_at?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
  isCustomResponse?: boolean;
  sources?: (string | { title: string; url: string })[];
  heading?: string;
  detailedText?: string;
  matchedAlerts?: AlertItem[];
  listItems?: Array<{
    id: string;
    title: string;
    category?: string;
    date?: string;
    summary: string;
    impact?: string;
    module?: string;
    parentLabel?: string;
  }>;
  linkInfo?: {
    tabId: string;
    tabLabel: string;
  };
  chartBase64?: string | null;
  chartMeta?: { chartType?: string } | null;
  report?: DecisionReportPayload | InferenceReportPayload | FrameworkReportPayload | null;
  reportSources?: ReportSource[];
}

export interface SidebarItem {
  id: string;
  icon: string;
  label: string;
  badge?: string;
}

export interface Bookmark {
  id: string;
  client_id: string;
  policy_signal_id: string;
  created_at: string;
}

export interface DailyHighlight {
  id: string;
  client_id: string;
  highlight_text: string;
  date_created: string;
  created_at: string;
}

export interface ReportSource {
  index: number;
  type: 'client' | 'sec';
  title: string;
  url: string | null;
  module?: string | null;
  qdrant_point_id?: string | null;
  ticker?: string;
  fiscal_year?: number;
  item_code?: string;
}

export interface DecisionReportPayload {
  title: string;
  outlook: string | string[];
  key_movement_analysis?: {
    columns: string[];
    rows: { cells: string[] }[];
  };
  driving_factors?: string[];
  what_to_watch?: string | string[];
  decision_implication?: string;
  bottom_line?: string;
  confidence_evidence?: { label: string; value: string }[];
  bodyText?: string;
}

export interface InferenceReportPayload {
  title: string;
  outlook?: string | string[];
  key_movement_analysis?: {
    columns: string[];
    rows: { cells: string[] }[];
  };
  driving_factors?: string[];
  what_to_watch?: string | string[];
  bottom_line?: string;
  bodyText?: string;
}

export interface FrameworkReportPayload {
  title: string;
  bodyText: string;
}

