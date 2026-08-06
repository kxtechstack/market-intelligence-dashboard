import React from "react";
import { Search } from "lucide-react";

interface Source {
  title: string;
  url: string;
}

interface ChatSourcesProps {
  sources: (string | Source)[];
}

export function ChatSources({ sources }: ChatSourcesProps) {
  if (!sources || sources.length === 0) return null;

  return (
    <div className="mt-3 pt-3 border-t border-zinc-200/60">
      <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
        <Search className="w-3 h-3" />
        Sources & References
      </div>
      <div className="flex flex-col gap-1.5">
        {sources.map((source, sIdx) => {
          const isObj = typeof source === 'object' && source !== null;
          const url = isObj ? (source as any).url : (typeof source === 'string' && source.startsWith('http') ? source : null);
          const displayTitle = isObj ? (source as any).title : (typeof source === 'string' ? source : "");

          return (
            <div key={sIdx} className="flex items-start gap-1.5 group">
              <div className="w-1 h-1 rounded-full bg-zinc-300 mt-1.5 shrink-0" />
              {url ? (
                <a 
                  href={url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-[11px] text-[#7c3aed] hover:underline break-all leading-normal text-left transition-colors"
                >
                  {displayTitle}
                </a>
              ) : (
                <span className="text-[11px] text-zinc-600 leading-normal italic text-left">
                  {displayTitle}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
