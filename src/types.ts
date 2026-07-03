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
  detailedText?: string;
  matchedAlerts?: AlertItem[];
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

