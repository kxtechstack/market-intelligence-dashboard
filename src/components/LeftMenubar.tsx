import { Clock, TrendingUp, Search, Radar, MessageSquare, ShieldAlert, Compass, Bookmark, Settings, HelpCircle, Layers, LogOut } from "lucide-react";
import { SIDEBAR_ITEMS, BOTTOM_SIDEBAR_ITEMS } from "../data";

interface LeftMenubarProps {
  activeTab: string;
  onTabChange: (id: string) => void;
  onLogout: () => void;
}

export default function LeftMenubar({ activeTab, onTabChange, onLogout }: LeftMenubarProps) {
  // Map string icon names to actual Lucide component instances
  const renderIcon = (iconName: string, isActive: boolean, itemId?: string) => {
    let iconColor = isActive ? "text-[#7c3aed]" : "text-zinc-500 hover:text-zinc-800";

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
      default:
        return <Clock className={iconClass} />;
    }
  };

  return (
    <aside 
      id="left-menubar-rail" 
      className="w-[56px] h-full bg-[#fbfbfb] border-r border-zinc-200 flex flex-col justify-between py-2 items-center select-none"
    >
      {/* Top Section with User Avatar replacement: KX Badge */}
      <div className="flex flex-col items-center gap-1.5 w-full">
        <div id="user-avatar-container" className="relative group cursor-pointer mb-1.5 flex items-center justify-center">
          <div className="w-7 h-7 bg-zinc-900 text-white rounded-full flex items-center justify-center text-[10.5px] font-bold tracking-tight border border-zinc-800 hover:bg-black transition-colors">
            KX
          </div>
          <span className="absolute bottom-0 right-0 w-2 h-2 bg-green-500 border border-white rounded-full"></span>
          
          {/* Custom tooltip for KX Badge */}
          <div className="absolute left-[44px] top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 translate-x-1 group-hover:translate-x-2 transition-all duration-150 bg-zinc-900 border border-zinc-800 text-[#f8fafc] text-[10.5px] font-normal px-2.5 py-1 rounded-[4px] shadow-[0_2px_8px_rgba(0,0,0,0.15)] whitespace-nowrap z-50 pointer-events-none">
            Knometrix Workspace
          </div>
        </div>

        {/* Middleware icons list */}
        <div className="flex flex-col gap-[2px] w-full items-center">
          {SIDEBAR_ITEMS.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`sidebar-item-${item.id}`}
                onClick={() => onTabChange(item.id)}
                className={`group/item relative w-8.5 h-8.5 flex items-center justify-center transition-all rounded-[4px] ${
                  isActive
                    ? "bg-[#f5f3ff] text-[#7c3aed]"
                    : "hover:bg-zinc-100 text-zinc-500"
                }`}
              >
                {renderIcon(item.icon, isActive, item.id)}
                {/* Blob indicator for selected item */}
                {isActive && (
                  <span className="absolute top-[4px] right-[4px] w-1.5 h-1.5 bg-[#7c3aed] rounded-full"></span>
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
              className={`group/item relative w-8.5 h-8.5 flex items-center justify-center transition-all rounded-[4px] ${
                isActive
                  ? "bg-[#f5f3ff] text-[#7c3aed]"
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
