import { Clock, TrendingUp, Search, Radar, MessageSquare, ShieldAlert, Compass, Bookmark, Settings, HelpCircle, Layers, LogOut, Sprout } from "lucide-react";
import { SIDEBAR_ITEMS, BOTTOM_SIDEBAR_ITEMS } from "../data";

interface LeftMenubarProps {
  activeTab: string;
  onTabChange: (id: string) => void;
  onLogout: () => void;
  userInitials?: string;
  userName?: string;
}

export default function LeftMenubar({ activeTab, onTabChange, onLogout, userInitials, userName }: LeftMenubarProps) {
  // Compute initials: if provided explicitly use it, or derive from userName, or default to "HW" (Hannah Wells)
  const displayInitials = (() => {
    if (userInitials) return userInitials.toUpperCase();
    if (userName) {
      const parts = userName.trim().split(/\s+/);
      if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      }
      return parts[0]?.slice(0, 2).toUpperCase() || "HW";
    }
    return "HW";
  })();

  const tooltipName = userName || (displayInitials === "HW" ? "Hannah Wells" : "User Profile");
  // Map string icon names to actual Lucide component instances
  const renderIcon = (iconName: string, isActive: boolean, itemId?: string) => {
    let iconColor = isActive ? "text-[#2d39d2]" : "text-zinc-500 hover:text-zinc-800";

    if (itemId === 'decision_intelligence' && !isActive) {
      iconColor = "text-zinc-800 hover:text-zinc-950";
    }

    const iconClass = `w-[15px] h-[15px] transition-colors ${iconColor}`;

    switch (iconName) {
      case "Clock":
        return <Clock className={iconClass} />;
      case "TrendingUp":
        return <TrendingUp className={iconClass} />;
      case "Search":
        return <Search className={iconClass} />;
      case "Radar":
        return <Radar className={iconClass} />;
      case "MessageSquare":
        return <MessageSquare className={iconClass} />;
      case "ShieldAlert":
        return <ShieldAlert className={iconClass} />;
      case "Compass":
        return <Compass className={iconClass} />;
      case "Bookmark":
        return <Bookmark className={iconClass} />;
      case "Layers":
        return <Layers className={iconClass} />;
      case "Settings":
        return <Settings className={iconClass} />;
      case "HelpCircle":
        return <HelpCircle className={iconClass} />;
      case "Sprout":
        return <Sprout className={iconClass} />;
      default:
        return <Clock className={iconClass} />;
    }
  };

  return (
    <aside 
      id="left-menubar-rail" 
      className="w-[56px] h-full bg-[#fbfbfb] border-r border-zinc-200 flex flex-col justify-between py-2 items-center select-none"
    >
      {/* Top Section with User Avatar: User Initials Badge (e.g. HW) */}
      <div className="flex flex-col items-center gap-1.5 w-full">
        <div id="user-avatar-container" onClick={() => onTabChange("landing_page")} className="relative group cursor-pointer mb-1.5 flex items-center justify-center">
          <div className="w-7 h-7 bg-zinc-900 text-white rounded-full flex items-center justify-center text-[10.5px] font-bold tracking-tight border border-zinc-800 hover:bg-black transition-colors">
            {displayInitials}
          </div>
          <span className="absolute bottom-0 right-0 w-2 h-2 bg-green-500 border border-white rounded-full"></span>
          
          {/* Custom tooltip for User Avatar */}
          <div className="absolute left-[44px] top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 translate-x-1 group-hover:translate-x-2 transition-all duration-150 bg-zinc-900 border border-zinc-800 text-[#f8fafc] text-[10.5px] font-normal px-2.5 py-1 rounded-[4px] shadow-[0_2px_8px_rgba(0,0,0,0.15)] whitespace-nowrap z-50 pointer-events-none">
            {tooltipName}
          </div>
        </div>

        {/* Middleware icons list */}
        <div className="flex flex-col gap-[2px] w-full items-center">
          {SIDEBAR_ITEMS.map((item) => {
            const isActive = activeTab === item.id;
            const isNonClickable = [
              "find_opportunities",
              "competitive_radar",
              "voice_of_customer",
              "sustainability_intelligence",
            ].includes(item.id);

            return (
              <button
                key={item.id}
                id={`sidebar-item-${item.id}`}
                onClick={() => {
                  if (!isNonClickable) {
                    onTabChange(item.id);
                  }
                }}
                style={{
                  backgroundColor: isActive ? "#eef1fe" : undefined,
                  color: isActive ? "#2d39d2" : undefined,
                  cursor: isNonClickable ? "default" : "pointer"
                }}
                className={`group/item relative w-8.5 h-8.5 flex items-center justify-center transition-all rounded-[4px] ${
                  isActive
                    ? "bg-[#eef1fe] text-[#2d39d2]"
                    : "hover:bg-zinc-100 text-zinc-500"
                } ${isNonClickable ? "cursor-default" : "cursor-pointer"}`}
              >
                {renderIcon(item.icon, isActive, item.id)}
                {/* Blob indicator for selected item */}
                {isActive && (
                  <span className="absolute top-[4px] right-[4px] w-1.5 h-1.5 bg-[#2d39d2] rounded-full"></span>
                )}

                {/* Micro tooltip on hover */}
                <div className="absolute left-[44px] top-1/2 -translate-y-1/2 opacity-0 group-hover/item:opacity-100 translate-x-1 group-hover/item:translate-x-2 transition-all duration-150 bg-zinc-900 border border-zinc-800 text-[#f8fafc] text-[10.5px] font-normal px-2.5 py-1 rounded-[4px] shadow-[0_2px_8px_rgba(0,0,0,0.15)] whitespace-nowrap z-50 pointer-events-none">
                  {item.label}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom Section with Settings and Support */}
      <div className="flex flex-col gap-[2px] w-full items-center">
        {BOTTOM_SIDEBAR_ITEMS.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              id={`sidebar-item-${item.id}`}
              onClick={() => onTabChange(item.id)}
              style={{
                backgroundColor: isActive ? "#eef1fe" : undefined,
                color: isActive ? "#2d39d2" : undefined
              }}
              className={`group/item relative w-8.5 h-8.5 flex items-center justify-center transition-all rounded-[4px] ${
                isActive
                  ? "bg-[#eef1fe] text-[#2d39d2]"
                  : "hover:bg-zinc-100 text-zinc-500"
              }`}
            >
              {renderIcon(item.icon, isActive, item.id)}
              
              {/* Micro tooltip on hover */}
              <div className="absolute left-[44px] top-1/2 -translate-y-1/2 opacity-0 group-hover/item:opacity-100 translate-x-1 group-hover/item:translate-x-2 transition-all duration-150 bg-zinc-900 border border-zinc-800 text-[#f8fafc] text-[10.5px] font-normal px-2.5 py-1 rounded-[4px] shadow-[0_2px_8px_rgba(0,0,0,0.15)] whitespace-nowrap z-50 pointer-events-none">
                {item.label}
              </div>
            </button>
          );
        })}
        
        <div className="w-full h-px bg-zinc-200 my-1"></div>

        <button
          onClick={onLogout}
          className="group/item relative w-8.5 h-8.5 flex items-center justify-center transition-all rounded-[4px] hover:bg-zinc-100 text-zinc-500"
        >
          <LogOut className="w-[15px] h-[15px]" />
          
          <div className="absolute left-[44px] top-1/2 -translate-y-1/2 opacity-0 group-hover/item:opacity-100 translate-x-1 group-hover/item:translate-x-2 transition-all duration-150 bg-zinc-900 border border-zinc-800 text-[#f8fafc] text-[10.5px] font-normal px-2.5 py-1 rounded-[4px] shadow-[0_2px_8px_rgba(0,0,0,0.15)] whitespace-nowrap z-50 pointer-events-none">
            Logout
          </div>
        </button>
      </div>
    </aside>
  );
}
