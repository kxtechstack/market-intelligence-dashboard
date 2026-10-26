import React, { useState } from "react";
import { TrendItem } from "./ForewardOutlookPane";

interface BubbleMapSectionProps {
  trends: TrendItem[];
  onSelectTrend: (trend: TrendItem) => void;
  selectedTrendId: string | null;
  searchQuery?: string;
  activeSectorFilter?: string | null;
}

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

export const BubbleMapSection: React.FC<BubbleMapSectionProps> = ({ 
  trends, 
  onSelectTrend, 
  selectedTrendId, 
  searchQuery,
  activeSectorFilter = null
}) => {
  const [selectedClusterForTable, setSelectedClusterForTable] = useState<{ key: string; name: string; term: string; color: string; trends: TrendItem[] } | null>(null);

  const sectorColors: Record<string, string> = {
    "Consumer": "#2563eb",     // Royal Blue
    "Technology": "#4f46e5",   // Indigo / Deep Blue
    "Supply chain": "#0284c7", // Sky Blue
    "Product": "#3b82f6",      // Bright Blue
    "Sustainability": "#0ea5e9" // Cyan / Light Blue
  };

  const clusterMap: Record<string, { key: string; name: string; term: string; color: string; trends: TrendItem[]; count: number; growth: string }> = {};

  trends.forEach((t, i) => {
    const sec = t.sector || "Consumer";
    const term = t.term || "Near-Term";
    const key = `${sec}___${term}`;
    if (!clusterMap[key]) {
      clusterMap[key] = {
        key,
        name: sec,
        term,
        color: sectorColors[sec] || "#3b82f6",
        trends: [],
        count: 0,
        growth: `+${(i + 3) * 3}%`
      };
    }
    clusterMap[key].trends.push(t);
    clusterMap[key].count++;
  });

  const clusterItems = Object.values(clusterMap);

  // Active cluster defaults to selected if still in filtered clusterItems, otherwise first matching sector or first available cluster so table is loaded on the side
  const activeCluster = 
    (selectedClusterForTable && clusterItems.find(c => c.key === selectedClusterForTable.key)) || 
    (activeSectorFilter ? clusterItems.find(c => c.name === activeSectorFilter) : null) || 
    clusterItems[0] || 
    null;

  // Active trend or first trend synopsis in selected cluster (dynamic content)
  const activeTrendInCluster = activeCluster?.trends.find(t => t.id === selectedTrendId);
  const dynamicSynopsis = activeTrendInCluster?.summary || activeCluster?.trends[0]?.summary || "";

  return (
    <div className="w-full flex flex-col gap-3 p-0 select-none my-1 relative">
      {/* Outer Bubble Map Container - Right side border wraps outside this table so table appears inside bubble map area */}
      <div 
        className="w-full border border-zinc-100 rounded-[4px] p-4 relative flex flex-col lg:flex-row gap-4 items-stretch shadow-none overflow-hidden"
        style={{
          background: "radial-gradient(circle at center, rgba(45, 57, 210, 0.05) 0%, rgba(110, 121, 237, 0.02) 45%, rgba(129, 140, 248, 0.005) 80%, #ffffff 100%), radial-gradient(#efeff2 1px, transparent 1px)",
          backgroundSize: "100% 100%, 16px 16px"
        }}
      >
        {/* Left: Bubble Map Chart Grid Area */}
        <div className="flex-1 min-w-0 relative min-h-[480px] flex flex-col justify-between">
          {/* Clean Proper Y Axis Label */}
          <div className="absolute left-0 top-16 bottom-16 flex flex-col justify-between items-center text-[10px] font-mono font-bold tracking-widest text-zinc-600 select-none py-2">
            <span>HIGH</span>
            <span>LOW</span>
          </div>

          {/* 3 Columns for X Axis (Near-Term, Mid-Term, Long-Term) */}
          <div className="ml-10 grid grid-cols-3 gap-2 h-[410px] relative border-b border-zinc-100">
            <div className="border-r border-zinc-100 flex flex-col items-center justify-center relative bg-white/10"></div>
            <div className="border-r border-zinc-100 flex flex-col items-center justify-center relative bg-white/5"></div>
            <div className="flex flex-col items-center justify-center relative bg-transparent"></div>

            {/* Clusters / Trends Overlay */}
            {clusterItems.length === 0 ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-400 text-xs font-sans">
                <span>{searchQuery ? `No trends found matching "${searchQuery}"` : "No trends available"}</span>
              </div>
            ) : (
              <div className="absolute inset-0 grid grid-cols-3 p-2">
                {["Near-Term", "Mid-Term", "Long-Term"].map((termCol) => {
                  const colClusters = clusterItems.filter(c => c.term === termCol);

                  return (
                    <div key={termCol} className="relative flex flex-col items-center justify-start gap-3 h-full p-2 overflow-y-auto scrollbar-thin">
                      {colClusters.map(cluster => {
                        const matchesSectorFilter = activeSectorFilter === null || cluster.name === activeSectorFilter;
                        const isSelectedCluster = activeCluster?.key === cluster.key;
                        const isFaded = !matchesSectorFilter;

                        const diameter = Math.min(56, Math.max(30, 26 + cluster.count * 2));
                        const mostActiveTrend = cluster.trends.length > 0
                          ? cluster.trends.reduce((prev, curr) => ((curr.signalsCount || 0) > (prev?.signalsCount || 0) ? curr : prev), cluster.trends[0])
                          : null;

                        return (
                          <div
                            key={cluster.key}
                            className={`transition-all duration-250 flex flex-col items-center w-full py-0.5 ${
                              isFaded ? "opacity-30 scale-95" : "opacity-100 scale-100"
                            }`}
                          >
                            {/* Cluster Bubble - Clicking loads table on the right side */}
                            <div
                              onClick={() => { 
                                setSelectedClusterForTable(cluster); 
                              }}
                              className={`group flex flex-col items-center cursor-pointer transition-transform duration-250 hover:scale-105 my-0.5 p-1 rounded-[4px] ${isSelectedCluster ? "ring-2 ring-blue-500 bg-blue-50/50" : ""}`}
                            >
                              <div 
                                className="rounded-full flex items-center justify-center text-white font-normal text-xs shadow-none transition-all"
                                style={{ 
                                  width: `${diameter}px`, 
                                  height: `${diameter}px`, 
                                  backgroundColor: cluster.color 
                                }}
                              >
                                {cluster.count}
                              </div>
                              <span className="mt-1 text-[11px] font-sans font-medium text-zinc-700 tracking-tight text-center max-w-[130px] truncate">
                                {cluster.name}
                              </span>
                              {mostActiveTrend && (
                                <span className="mt-0.5 text-[9.5px] font-sans text-zinc-500 tracking-tight text-center max-w-[150px] leading-tight">
                                  Most Active : {mostActiveTrend.title} <span className="text-emerald-600 font-medium whitespace-nowrap">(▲ {mostActiveTrend.signalsCount || 0} signals)</span>
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* X Axis Labels */}
          <div className="ml-10 grid grid-cols-3 text-center pt-2">
            <span className="text-[10px] font-mono font-bold tracking-widest text-zinc-600">NEAR-TERM</span>
            <span className="text-[10px] font-mono font-bold tracking-widest text-zinc-600">MID-TERM</span>
            <span className="text-[10px] font-mono font-bold tracking-widest text-zinc-600">LONG-TERM</span>
          </div>
          <div className="ml-10 text-left text-[10px] text-zinc-500 font-sans font-medium mt-1">
            Left to right shows time to mainstream, bottom to top shows business impact, and bubble size shows signal count.
          </div>
        </div>

        {/* Right: Table inside the bubble map area, exactly same height as the bubble map */}
        <div className="w-full lg:w-[280px] flex flex-col shrink-0 self-stretch">
          {activeCluster ? (() => {
            const sortedTrends = [...activeCluster.trends].sort((a, b) => (b.signalsCount || 0) - (a.signalsCount || 0));

            return (
              <div className="border border-zinc-200/80 rounded-[4px] bg-white flex flex-col shadow-none text-xs font-sans h-full overflow-hidden">
                {/* Header row 1: Trend Category (slight different shade) */}
                <div className="px-3 py-1.5 bg-zinc-50 border-b border-zinc-100 font-semibold text-zinc-900 text-xs shrink-0">
                  Trend Category : {activeCluster.name}
                </div>
                {/* Header row 2: Impact / Term (slight different shade) */}
                <div className="px-3 py-1.5 bg-zinc-50 border-b border-zinc-100 font-semibold text-zinc-900 text-xs shrink-0">
                  Impact : {activeCluster.term}
                </div>
                {/* Synopsis row - Dynamic content */}
                <div className="px-3 py-2 border-b border-zinc-100 text-zinc-600 font-light leading-relaxed text-[11px] shrink-0 max-h-[85px] overflow-y-auto scrollbar-thin bg-white">
                  {dynamicSynopsis || "Strategic horizon developments and behavioral shifts anticipated for this segment."}
                </div>
                {/* Trend rows - Arranged by number of signals (descending), compact height/padding, scrollable within space */}
                <div className="flex flex-col flex-1 overflow-y-auto scrollbar-thin divide-y divide-zinc-50">
                  {sortedTrends.map((trend, idx) => (
                    <div
                      key={trend.id || idx}
                      onClick={() => {
                        onSelectTrend(trend);
                      }}
                      className={`px-3 py-1.5 text-zinc-900 font-medium hover:bg-zinc-50 cursor-pointer transition-colors flex items-center justify-between gap-2 shrink-0 relative ${
                        selectedTrendId === trend.id ? "bg-blue-50/60" : "bg-white"
                      }`}
                    >
                      <span className="truncate text-xs font-normal text-zinc-800">{trend.title}</span>
                      
                      {/* Confidence color graph matching expanded pane */}
                      <span className="relative group/conf inline-flex items-center select-none cursor-pointer ml-2 shrink-0">
                        {/* Tiny sparkline SVG */}
                        <span className="flex items-center justify-center h-4 w-6 select-none" title={`${trend.confidence || "High"} Confidence (${trend.signalsCount || 0} signals)`}>
                          <svg className="w-5.5 h-2" viewBox="0 0 40 20">
                            <path 
                              d={trend.sparklinePath || "M0 14 L8 10 L16 12 L24 6 L32 8 L40 2"} 
                              fill="none" 
                              stroke={getConfidenceColor(trend.confidence)} 
                              strokeWidth="3.6" 
                              strokeLinecap="round" 
                            />
                          </svg>
                        </span>

                        {/* Hover box (the confidence and signals card matching expanded pane) */}
                        <span className="absolute right-7 top-1/2 -translate-y-1/2 hidden group-hover/conf:flex flex-col gap-0.5 bg-white border border-[#031d24] rounded-[5px] py-1 px-2.5 shadow-lg z-50 min-w-[170px] pointer-events-none">
                          <span className="font-bold text-zinc-900 text-[11px] font-sans leading-none whitespace-nowrap">
                            {trend.confidence || "High"} Confidence
                          </span>
                          <span className="flex items-center gap-1.5 text-[9.5px] text-zinc-500 font-sans leading-none mt-1 whitespace-nowrap">
                            <span className="text-zinc-900 font-semibold">
                              {trend.signalsCount || 0} signals
                            </span>
                            {/* Brand sparkline SVG matching confidence color */}
                            <span className="flex items-center shrink-0">
                              <svg className="w-8 h-3" viewBox="0 0 40 20">
                                <path 
                                  d={trend.sparklinePath || "M0 14 L8 10 L16 12 L24 6 L32 8 L40 2"} 
                                  fill="none" 
                                  stroke={getConfidenceColor(trend.confidence)} 
                                  strokeWidth="3.2" 
                                  strokeLinecap="round" 
                                />
                              </svg>
                            </span>
                            <span className="text-zinc-500">
                              +{trend.newInLastWeek ?? 0} in last week
                            </span>
                          </span>
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })() : (
            <div className="border border-zinc-200/80 rounded-[4px] bg-white flex flex-col items-center justify-center p-6 text-center text-xs text-zinc-400 h-full font-sans">
              <span>{searchQuery ? `No trends matching "${searchQuery}"` : "No trends to display"}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
