import React from "react";
import { ExternalLink, BarChart2, ArrowUpRight } from "lucide-react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { DecisionReportPayload, InferenceReportPayload, ReportSource, ReportBlock, FrameworkReportPayload } from "../types";

const MODULE_FALLBACK: Record<string, string> = {
  '777a2b2e-8bb2-44ef-a4f2-1c0c1e03b960': 'Policy & Risk',
  '55c5ee19-bfca-468b-81b3-b89ca4f303c8': 'Market Dynamics',
  '2eb989fd-0ea0-4320-b73a-f7eb8b970473': 'Forward Outlook',
};

const MODULE_TAB_LABEL: Record<string, string> = {
  "Policy & Risk": "Policy & Risk Monitor",
  "Market Dynamics": "Market Dynamics",
  "Forward Outlook": "Forward Outlook",
};

interface ReportViewProps {
  report: DecisionReportPayload | InferenceReportPayload | FrameworkReportPayload;
  sources?: ReportSource[];
  chart?: string | null;
  chartMeta?: { chartType?: string } | null;
  onSourceClick?: (source: ReportSource) => void;
}

export default function ReportView({
  report,
  sources,
  chart,
  chartMeta,
  onSourceClick,
}: ReportViewProps) {
  const isDecision = (
    rep: DecisionReportPayload | InferenceReportPayload | FrameworkReportPayload
  ): rep is DecisionReportPayload => {
    return "decision_implication" in rep || "confidence_evidence" in rep;
  };

  const renderTextOrArray = (content?: string | string[]) => {
    if (!content) return null;
    if (typeof content === "string") {
      if (!content.trim()) return null;
      return <p className="text-[13px] leading-relaxed text-zinc-800 mb-2">{content}</p>;
    }
    if (Array.isArray(content)) {
      const filtered = content.filter((item) => Boolean(item && item.trim()));
      if (filtered.length === 0) return null;
      return (
        <div className="mb-2">
          {filtered.map((item, idx) => (
            <p key={idx} className="text-[13px] leading-relaxed text-zinc-800 mb-2">
              {item}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const renderBlock = (block: ReportBlock, index: number) => {
    switch (block.type) {
      case "heading":
        return (
          <h4 key={index} className="text-[13.5px] font-bold text-zinc-900 mt-4 mb-2 font-sans">
            {block.text}
          </h4>
        );
      case "paragraph":
        return (
          <p key={index} className="text-[13px] leading-relaxed text-zinc-800 mb-2">
            {block.text}
          </p>
        );
      case "bullets":
        return (
          <ul key={index} className="list-disc pl-5 my-2 space-y-1 text-[13px] text-zinc-700">
            {block.items.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        );
      case "numbered_list":
        return (
          <ol key={index} className="list-decimal pl-5 my-2 space-y-1 text-[13px] text-zinc-700">
            {block.items.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ol>
        );
      case "table":
        return (
          <div key={index} className="my-3 overflow-x-auto rounded-[6px] border border-zinc-200 shadow-2xs">
            <table className="w-full text-left text-[12px] border-collapse bg-white">
              <thead className="bg-zinc-100/90 border-b border-zinc-200 text-zinc-900 font-semibold uppercase text-[10px] tracking-wider">
                <tr>
                  {block.columns.map((col, idx) => (
                    <th key={idx} className="px-3.5 py-2.5 font-semibold text-zinc-900">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200/70 text-zinc-800">
                {block.rows.map((row, rIdx) => (
                  <tr key={rIdx}>
                    {row.cells.map((cell, cIdx) => (
                      <td key={cIdx} className="px-3.5 py-2.5 text-zinc-800">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      case "callout":
        const intentClass =
          block.intent === "warning"
            ? "bg-amber-50 border-amber-200 text-amber-800"
            : block.intent === "success"
            ? "bg-emerald-50 border-emerald-200 text-emerald-800"
            : "bg-blue-50 border-blue-200 text-blue-800";
        return (
          <div key={index} className={`my-3 p-3 rounded-[6px] border text-[12.5px] leading-relaxed ${intentClass}`}>
            {block.text}
          </div>
        );
      default:
        return null;
    }
  };

  const hasSources = Boolean(sources && sources.length > 0);

  const renderSourcesSection = () => {
    if (!hasSources || !sources) return null;
    return (
      <div className="mt-4 pt-3 border-t border-zinc-200/60 font-sans">
        <h4 className="text-[13.5px] font-bold text-zinc-900 mb-2 font-sans">
          Key Signals Leading to This Intelligence
        </h4>
        <div className="flex flex-col">
          {sources.map((source, idx) => {
            const hasUrl = Boolean(source.url && source.url.trim());
            const isSec = source.type === "sec";
            const isCustomSource = source.type === "custom_source";

            if (isCustomSource) {
              const docLabel =
                (source.source_type || "file").toUpperCase() === "PDF"
                  ? "PDF"
                  : (source.source_type || "FILE").toUpperCase();

              const rowInner = (
                <div
                  className={
                    "flex items-start gap-4 py-1.5 pl-2 " +
                    (idx > 0 ? "border-t border-zinc-100 " : "") +
                    (hasUrl ? "group hover:bg-zinc-50/70 rounded-[3px] transition-colors" : "")
                  }
                >
                  <span className="shrink-0 w-[112px] flex items-center justify-center rounded-[3px] py-0.5 text-[9.5px] uppercase tracking-wider font-medium font-sans bg-violet-50 border border-violet-200/80 text-violet-800">
                    {docLabel}
                  </span>
                  <div className="flex-1 min-w-0">
                    <span className="text-[11.5px] text-zinc-700 leading-normal group-hover:text-zinc-900 transition-colors">
                      {source.source_name || source.title || "Uploaded document"}
                    </span>
                  </div>
                  {hasUrl && (
                    <ExternalLink className="w-3 h-3 text-zinc-400 group-hover:text-zinc-600 shrink-0 mt-0.5 transition-colors" />
                  )}
                </div>
              );

              if (hasUrl && source.url) {
                return (
                  <a
                    key={source.index ?? idx}
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-left no-underline"
                  >
                    {rowInner}
                  </a>
                );
              }
              return <div key={source.index ?? idx}>{rowInner}</div>;
            }

            const tabLabel =
              !isSec && source.module && source.signal_id
                ? MODULE_TAB_LABEL[source.module]
                : undefined;

            const pillClass = isSec
              ? "shrink-0 w-[112px] flex items-center justify-center rounded-[3px] py-0.5 text-[9.5px] uppercase tracking-wider font-medium font-sans bg-amber-50 border border-amber-200/80 text-amber-800"
              : "shrink-0 w-[112px] flex items-center justify-center rounded-[3px] py-0.5 text-[9.5px] uppercase tracking-wider font-medium font-sans bg-blue-50 border border-blue-200/80 text-blue-800";

            const pillLabel = isSec
              ? "10-K"
              : (source.module && MODULE_FALLBACK[source.module]) ||
                source.module ||
                "Client";

            const secSuffixParts: string[] = [];
            if (isSec) {
              if (source.fiscal_year) secSuffixParts.push(`FY${source.fiscal_year}`);
              if (source.item_code) secSuffixParts.push(source.item_code);
            }

            const rowInnerClass =
              "flex items-start gap-4 py-1.5 pl-2 " +
              (idx > 0 ? "border-t border-zinc-100 " : "") +
              (hasUrl
                ? "group hover:bg-zinc-50/70 rounded-[3px] transition-colors"
                : "");

            const contentNode = (
              <div className={rowInnerClass}>
                <span className={pillClass}>{pillLabel}</span>
                <div className="flex-1 min-w-0">
                  <span className="text-[11.5px] text-zinc-700 leading-normal group-hover:text-zinc-900 transition-colors">
                    {source.title}
                  </span>
                  {secSuffixParts.length > 0 && (
                    <span className="text-[11px] text-zinc-500 font-normal">
                      {" "}· {secSuffixParts.join(" · ")}
                    </span>
                  )}
                </div>
                {tabLabel && onSourceClick ? (
                  <span title={`Open in ${tabLabel}`}>
                    <ArrowUpRight className="w-3.5 h-3.5 text-zinc-400 group-hover:text-[#7c3aed] shrink-0 mt-0.5 transition-colors" />
                  </span>
                ) : hasUrl ? (
                  <ExternalLink className="w-3 h-3 text-zinc-400 group-hover:text-zinc-600 shrink-0 mt-0.5 transition-colors" />
                ) : null}
              </div>
            );

            if (tabLabel && onSourceClick) {
              return (
                <div
                  key={source.index ?? idx}
                  onClick={() => onSourceClick(source)}
                  className="cursor-pointer group hover:bg-zinc-50/70 rounded-[3px] transition-colors"
                >
                  {contentNode}
                </div>
              );
            }

            if (hasUrl && source.url) {
              return (
                <a
                  key={source.index ?? idx}
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-left no-underline"
                >
                  {contentNode}
                </a>
              );
            }

            return <div key={source.index ?? idx}>{contentNode}</div>;
          })}
        </div>
      </div>
    );
  };

  const hasChart = Boolean(chart && chart.trim());

  const decisionImplication =
    isDecision(report) && (report as any).decision_implication && (report as any).decision_implication.trim()
      ? (report as any).decision_implication
      : null;

  const confidenceEvidence =
    isDecision(report) &&
    (report as any).confidence_evidence &&
    (report as any).confidence_evidence.length > 0
      ? (report as any).confidence_evidence
      : null;

  // Internal conversion of sections to blocks for Phase 2 readiness
  const blocks: ReportBlock[] = [];
  if (report.sections) {
    report.sections.forEach((s) => {
      if (s.heading) blocks.push({ type: "heading", text: s.heading });
      if (s.points && s.points.length > 0) blocks.push({ type: "bullets", items: s.points });
    });
  }
  if (report.blocks) {
    blocks.push(...report.blocks);
  }

  const hasKeyMovement = Boolean(
    (report as any).key_movement_analysis &&
      (report as any).key_movement_analysis.columns &&
      (report as any).key_movement_analysis.columns.length > 0 &&
      (report as any).key_movement_analysis.rows &&
      (report as any).key_movement_analysis.rows.length > 0
  );

  const hasDrivingFactors = Boolean(
    (report as any).driving_factors && (report as any).driving_factors.length > 0
  );

  return (
    <div className="w-full">
      {/* 1. Title */}
      {report.title && report.title.trim() && (
        <h3 className="text-[15px] font-bold text-zinc-900 mb-3 font-sans">
          {report.title}
        </h3>
      )}

      {/* 2. Body Text (Legacy Markdown Fallback - Prioritized First) */}
      {report.bodyText && report.bodyText.trim() && (
        <MarketGenieMarkdown content={report.bodyText} />
      )}

      {/* 3. Structured Blocks (Phase 1 sections converted to blocks + Phase 2 native blocks) */}
      {blocks.map((block, i) => renderBlock(block, i))}

      {/* 4. Outlook (Legacy) */}
      {Boolean(
        (report as any).outlook &&
          (typeof (report as any).outlook === "string"
            ? (report as any).outlook.trim()
            : (report as any).outlook.length > 0)
      ) && (
        <div>
          <h4 className="text-[13.5px] font-bold text-zinc-900 mt-4 mb-2 font-sans">
            Outlook
          </h4>
          {renderTextOrArray((report as any).outlook)}
        </div>
      )}

      {/* 5. Analysis (Legacy) */}
      {Boolean(
        (report as any).analysis &&
          ((typeof (report as any).analysis === "string" && (report as any).analysis.trim()) ||
           (Array.isArray((report as any).analysis) && (report as any).analysis.length > 0))
      ) && (
        <div>
          <h4 className="text-[13.5px] font-bold text-zinc-900 mt-4 mb-2 font-sans">
            Analysis
          </h4>
          {renderTextOrArray((report as any).analysis)}
        </div>
      )}

      {/* 6. Key Movement & Impact Analysis (Legacy Table) */}
      {hasKeyMovement && (report as any).key_movement_analysis && (
        <div>
          <h4 className="text-[13.5px] font-bold text-zinc-900 mt-4 mb-2 font-sans">
            Key Movement & Impact Analysis
          </h4>
          <div className="my-3 overflow-x-auto rounded-[6px] border border-zinc-200 shadow-2xs">
            <table className="w-full text-left text-[12px] border-collapse bg-white">
              <thead className="bg-zinc-100/90 border-b border-zinc-200 text-zinc-900 font-semibold uppercase text-[10px] tracking-wider">
                <tr>
                  {(report as any).key_movement_analysis.columns.map((col: string, idx: number) => (
                    <th key={idx} className="px-3.5 py-2.5 font-semibold text-zinc-900">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200/70 text-zinc-800">
                {(report as any).key_movement_analysis.rows.map((row: any, rIdx: number) => (
                  <tr key={rIdx}>
                    {row.cells.map((cell: string, cIdx: number) => (
                      <td key={cIdx} className="px-3.5 py-2.5 text-zinc-800">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 7. Chart (Positioned after primary content) */}
      {hasChart && (
        <div className="mt-4 pt-3 border-t border-zinc-200/60">
          <div className="text-[11.5px] font-semibold text-zinc-700 mb-2 flex items-center gap-1.5">
            <BarChart2 className="w-3.5 h-3.5 text-[#7c3aed]" />
            <span>
              {chartMeta?.chartType
                ? chartMeta.chartType.charAt(0).toUpperCase() +
                  chartMeta.chartType.slice(1) +
                  " Chart"
                : "Chart"}
            </span>
          </div>
          <img
            src={"data:image/png;base64," + chart}
            alt="Data visualization"
            className="w-full max-w-md rounded-[4px] border border-zinc-200 bg-white"
          />
        </div>
      )}

      {/* 8. Key Facts (Legacy) */}
      {Boolean((report as any).key_facts && Array.isArray((report as any).key_facts) && (report as any).key_facts.length > 0) && (
        <div>
          <h4 className="text-[13.5px] font-bold text-zinc-900 mt-4 mb-2 font-sans">
            Key Facts
          </h4>
          <ul className="list-disc pl-5 my-2 space-y-1 text-[13px] text-zinc-700">
            {(report as any).key_facts.map((fact: string, idx: number) => (
              <li key={idx}>{fact}</li>
            ))}
          </ul>
        </div>
      )}

      {/* 9. Driving Factors (Legacy) */}
      {hasDrivingFactors && (report as any).driving_factors && (
        <div>
          <h4 className="text-[13.5px] font-bold text-zinc-900 mt-4 mb-2 font-sans">
            Driving Factors
          </h4>
          <ul className="list-disc pl-5 my-2 space-y-1 text-[13px] text-zinc-700">
            {(report as any).driving_factors.map((factor: string, idx: number) => (
              <li key={idx}>{factor}</li>
            ))}
          </ul>
        </div>
      )}

      {/* 10. What to Watch (Legacy) */}
      {Boolean(
        (report as any).what_to_watch &&
          (typeof (report as any).what_to_watch === "string"
            ? (report as any).what_to_watch.trim()
            : (report as any).what_to_watch.length > 0)
      ) && (
        <div>
          <h4 className="text-[13.5px] font-bold text-zinc-900 mt-4 mb-2 font-sans">
            What to Watch
          </h4>
          {renderTextOrArray((report as any).what_to_watch)}
        </div>
      )}

      {/* 11. Decision Implication (Legacy) */}
      {decisionImplication && (
        <div>
          <h4 className="text-[13.5px] font-bold text-zinc-900 mt-4 mb-2 font-sans">
            Decision Implication
          </h4>
          <p className="text-[13px] leading-relaxed text-zinc-800">
            {decisionImplication}
          </p>
        </div>
      )}

      {/* 12. Bottom Line */}
      {Boolean((report as any).bottom_line && (report as any).bottom_line.trim()) && (
        <div>
          <h4 className="text-[13.5px] font-bold text-zinc-900 mt-4 mb-2 border-t border-zinc-200/60 pt-3 font-sans">
            Bottom Line
          </h4>
          <p className="text-[13px] leading-relaxed text-zinc-800 font-medium">
            {(report as any).bottom_line}
          </p>
        </div>
      )}

      {/* 13. Confidence & Evidence (Legacy) */}
      {confidenceEvidence && (
        <div>
          <h4 className="text-[13.5px] font-bold text-zinc-900 mt-4 mb-2 font-sans">
            Confidence & Evidence
          </h4>
          <ul className="list-none pl-0 my-2 space-y-1.5">
            {confidenceEvidence.map((item, idx) => (
              <li key={idx} className="text-[12.5px] text-zinc-700">
                <span className="font-semibold text-zinc-900">{item.label}:</span>{" "}
                {item.value}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 14. Sources */}
      {renderSourcesSection()}
    </div>
  );
}

interface MarketGenieMarkdownProps {
  content: string;
  className?: string;
}

export function MarketGenieMarkdown({ content, className = "" }: MarketGenieMarkdownProps) {
  if (!content) return null;

  return (
    <div className={`markdown-body text-[12.5px] leading-relaxed font-sans text-zinc-800 space-y-2.5 ${className}`}>
      <Markdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-[15px] font-bold text-zinc-900 mt-4 mb-2 font-sans border-b border-zinc-200/80 pb-1.5 first:mt-0">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-[14px] font-bold text-zinc-900 mt-3.5 mb-1.5 font-sans border-b border-zinc-200/60 pb-1 first:mt-0">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-[13.5px] font-bold text-zinc-900 mt-3 mb-1 font-sans first:mt-0">
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-[13px] font-bold text-zinc-900 mt-2.5 mb-1 font-sans first:mt-0">
              {children}
            </h4>
          ),
          h5: ({ children }) => (
            <h5 className="text-[12.5px] font-bold text-zinc-900 mt-2 mb-1 font-sans first:mt-0">
              {children}
            </h5>
          ),
          h6: ({ children }) => (
            <h6 className="text-[12px] font-bold text-zinc-900 mt-2 mb-1 font-sans first:mt-0">
              {children}
            </h6>
          ),
          p: ({ children }) => (
            <p className="mb-2 last:mb-0 leading-relaxed text-zinc-800">{children}</p>
          ),
          ul: ({ children }) => (
            <ul className="list-disc pl-5 my-2 space-y-1 text-zinc-700 [&_ul]:list-[circle] [&_ul]:my-1 [&_ul]:pl-4">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal pl-5 my-2 space-y-1 text-zinc-700 [&_ol]:list-[lower-alpha] [&_ol]:my-1 [&_ol]:pl-4">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="leading-normal text-[12.5px] py-0.5 text-zinc-700">
              {children}
            </li>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-zinc-900">{children}</strong>
          ),
          em: ({ children }) => (
            <em className="italic text-zinc-600">{children}</em>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-[#7c3aed]/50 pl-3 my-2 text-zinc-600 italic">
              {children}
            </blockquote>
          ),
          code: ({ children }) => (
            <code className="px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-800 text-[11.5px] font-mono">
              {children}
            </code>
          ),
          pre: ({ children }) => (
            <pre className="p-2.5 rounded bg-zinc-100 text-zinc-800 text-[11.5px] font-mono overflow-x-auto my-2">
              {children}
            </pre>
          ),
          table: ({ children }) => (
            <div className="my-2.5 overflow-x-auto rounded border border-zinc-200">
              <table className="w-full text-left text-[11.5px] border-collapse bg-white">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-zinc-100 border-b border-zinc-200 font-semibold text-zinc-900">
              {children}
            </thead>
          ),
          th: ({ children }) => (
            <th className="px-2.5 py-1.5 font-semibold text-zinc-900 border-b border-zinc-200">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-2.5 py-1.5 text-zinc-800 border-b border-zinc-100">
              {children}
            </td>
          ),
          hr: () => <hr className="my-2.5 border-zinc-200/80" />,
        }}
      >
        {content}
      </Markdown>
    </div>
  );
}
