import { SidebarItem } from "./types";

export const SIDEBAR_ITEMS: SidebarItem[] = [
  { id: "latest", icon: "Clock", label: "Latest" },
  { id: "market_dynamics", icon: "TrendingUp", label: "Market Dynamics" },
  { id: "find_opportunities", icon: "Search", label: "Find Opportunities" },
  { id: "competitive_radar", icon: "Radar", label: "Competitive Radar" },
  { id: "voice_of_customer", icon: "MessageSquare", label: "Voice of Customer" },
  { id: "policy_risk_monitor", icon: "ShieldAlert", label: "Policy & Risk Monitor", badge: "Live" },
  { id: "foreward_outlook", icon: "Compass", label: "Foreward Outlook" },
  { id: "decision_intelligence", icon: "Layers", label: "Decision Intelligence" },
];

export const BOTTOM_SIDEBAR_ITEMS: SidebarItem[] = [
  { id: "my_bookmarks", icon: "Bookmark", label: "My Bookmarks" },
  { id: "settings", icon: "Settings", label: "Workspace configurations" },
];

