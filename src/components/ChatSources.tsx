import React from "react";
import { Search, ExternalLink, FileText } from "lucide-react";

interface Source {
  title?: string;
  url?: string;
  type?: string;             // 'client' | 'sec' | 'custom_source'
  // custom-source fields:
  source_id?: string | null;
  source_name?: string | null;
  source_type?: string | null;   // 'pdf' | 'website' | 'text'
  content_id?: string | null;
  chunk_index?: number | null;
  // client-signal fields (for module pill rendering if ever needed here):
  module?: string | null;
  signal_id?: string | null;
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
          const isObj = typeof source === "object" && source !== null;
          const s = isObj ? (source as Source) : null;

          // ── Custom-source citation: single row per uploaded document.
          // Renders with a document icon + violet styling, links to the PDF.
          if (s && s.type === "custom_source") {
            const label = s.source_name || s.title || "Uploaded document";
            const docType = (s.source_type || "file").toUpperCase();
            const hasUrl = Boolean(s.url && s.url.trim());

            const inner = (
              <div className="flex items-center gap-1.5">
                <FileText className="w-3 h-3 text-violet-600 shrink-0" />
                <span className="text-[11px] text-violet-800 font-medium leading-normal truncate">
                  {label}
                </span>
                <span className="text-[9px] text-violet-500 font-medium uppercase tracking-wider shrink-0">
                  ({docType})
                </span>
                {hasUrl && (
                  <ExternalLink className="w-2.5 h-2.5 text-violet-400 shrink-0" />
                )}
              </div>
            );

            return (
              <div key={sIdx} className="flex items-start gap-1.5 group">
                <div className="w-1 h-1 rounded-full bg-violet-300 mt-1.5 shrink-0" />
                {hasUrl && s.url ? (
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-left hover:underline break-all leading-normal transition-colors"
                  >
                    {inner}
                  </a>
                ) : (
                  <span className="text-left">{inner}</span>
                )}
              </div>
            );
          }

          // ── Existing handling for plain string sources and {title, url} objects ──
          const url = isObj
            ? s?.url
            : typeof source === "string" && source.startsWith("http")
            ? source
            : null;
          const displayTitle = isObj
            ? s?.title || ""
            : typeof source === "string"
            ? source
            : "";

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