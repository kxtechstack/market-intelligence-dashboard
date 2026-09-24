import React from "react";
import { ExternalLink, BarChart2, ArrowUpRight } from "lucide-react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { DecisionReportPayload, InferenceReportPayload, ReportSource } from "../types";

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
  report: DecisionReportPayload | InferenceReportPayload;
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
    rep: DecisionReportPayload | InferenceReportPayload
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
        <>
          {filtered.map((item, idx) => (
            <p key={idx} className="text-[13px] leading-relaxed text-zinc-800 mb-2">
              {item}
            </p>
          ))}
        </>
      );
    }
    return null;
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
            const tabLabel = !isSec && source.module && source.signal_id ? MODULE_TAB_LABEL[source.module] : undefined;

            const pillClass = isSec
              ? "shrink-0 w-[112px] flex items-center justify-center rounded-[3px] py-0.5 text-[9.5px] uppercase tracking-wider font-medium font-sans bg-amber-50 border border-amber-200/80 text-amber-800"
              : "shrink-0 w-[112px] flex items-center justify-center rounded-[3px] py-0.5 text-[9.5px] uppercase tracking-wider font-medium font-sans bg-blue-50 border border-blue-200/80 text-blue-800";

            const pillLabel = isSec
              ? "10-K"
              : (source.module && MODULE_FALLBACK[source.module]) || source.module || "Client";

            const secSuffixParts: string[] = [];
            if (isSec) {
              if (source.fiscal_year) {
                secSuffixParts.push(`FY${source.fiscal_year}`);
              }
              if (source.item_code) {
                secSuffixParts.push(source.item_code);
              }
            }

            const rowInnerClass =
              "flex items-start gap-4 py-1.5 pl-2 " +
              (idx > 0 ? "border-t border-zinc-100 " : "") +
              (hasUrl ? "group hover:bg-zinc-50/70 rounded-[3px] transition-colors" : "");

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
                    <ArrowUpRight 
                      className="w-3.5 h-3.5 text-zinc-400 group-hover:text-[#7c3aed] shrink-0 mt-0.5 transition-colors" 
                    />
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

  // 1. Fallback path: If report.bodyText is a non-empty string, render it
  // as markdown -- this is the framework report shape (SWOT, PESTLE, Five
  // Forces, Risk Analysis) which comes back from the LLM as text with
  // **bold headers** and - bullet lists.
  if (report.bodyText && report.bodyText.trim()) {
    const hasChartInFallback = Boolean(chart && chart.trim());
    return (
      <div className="w-full">
        <MarketGenieMarkdown content={report.bodyText} />

        {hasChartInFallback && (
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

        {renderSourcesSection()}
      </div>
    );
  }

  // Structured report view
  const hasKeyMovement = Boolean(
    report.key_movement_analysis &&
      report.key_movement_analysis.columns &&
      report.key_movement_analysis.columns.length > 0 &&
      report.key_movement_analysis.rows &&
      report.key_movement_analysis.rows.length > 0
  );

  const hasDrivingFactors = Boolean(
    report.driving_factors && report.driving_factors.length > 0
  );

  const hasChart = Boolean(chart && chart.trim());

  const decisionImplication =
    isDecision(report) && report.decision_implication && report.decision_implication.trim()
      ? report.decision_implication
      : null;

  const confidenceEvidence =
    isDecision(report) &&
    report.confidence_evidence &&
    report.confidence_evidence.length > 0
      ? report.confidence_evidence
      : null;

  return (
    <div className="w-full">
      {/* 2. Title */}
      {report.title && report.title.trim() && (
        <h3 className="text-[15px] font-bold text-zinc-900 mb-3 font-sans">
          {report.title}
        </h3>
      )}

      {/* 3. Outlook */}
      {Boolean(
        report.outlook &&
          (typeof report.outlook === "string"
            ? report.outlook.trim()
            : report.outlook.length > 0)
      ) && (
        <div>
          <h4 className="text-[13.5px] font-bold text-zinc-900 mt-4 mb-2 font-sans">
            Outlook
          </h4>
          {renderTextOrArray(report.outlook)}
        </div>
      )}

      {/* 4. Key Movement & Impact Analysis */}
      {hasKeyMovement && report.key_movement_analysis && (
        <div>
          <h4 className="text-[13.5px] font-bold text-zinc-900 mt-4 mb-2 font-sans">
            Key Movement & Impact Analysis
          </h4>
          <div className="my-3 overflow-x-auto rounded-[6px] border border-zinc-200 shadow-2xs">
            <table className="w-full text-left text-[12px] border-collapse bg-white">
              <thead className="bg-zinc-100/90 border-b border-zinc-200 text-zinc-900 font-semibold uppercase text-[10px] tracking-wider">
                <tr>
                  {report.key_movement_analysis.columns.map((col, idx) => (
                    <th key={idx} className="px-3.5 py-2.5 font-semibold text-zinc-900">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200/70 text-zinc-800">
                {report.key_movement_analysis.rows.map((row, rIdx) => (
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
        </div>
      )}

      {/* 5. Chart */}
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

      {/* 6. Driving Factors */}
      {hasDrivingFactors && report.driving_factors && (
        <div>
          <h4 className="text-[13.5px] font-bold text-zinc-900 mt-4 mb-2 font-sans">
            Driving Factors
          </h4>
          <ul className="list-disc pl-5 my-2 space-y-1 text-[13px] text-zinc-700">
            {report.driving_factors.map((factor, idx) => (
              <li key={idx}>{factor}</li>
            ))}
          </ul>
        </div>
      )}

      {/* 7. What to Watch */}
      {Boolean(
        report.what_to_watch &&
          (typeof report.what_to_watch === "string"
            ? report.what_to_watch.trim()
            : report.what_to_watch.length > 0)
      ) && (
        <div>
          <h4 className="text-[13.5px] font-bold text-zinc-900 mt-4 mb-2 font-sans">
            What to Watch
          </h4>
          {renderTextOrArray(report.what_to_watch)}
        </div>
      )}

      {/* 8. Decision Implication */}
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

      {/* 9. Bottom Line */}
      {report.bottom_line && report.bottom_line.trim() && (
        <div>
          <h4 className="text-[13.5px] font-bold text-zinc-900 mt-4 mb-2 border-t border-zinc-200/60 pt-3 font-sans">
            Bottom Line
          </h4>
          <p className="text-[13px] leading-relaxed text-zinc-800 font-medium">
            {report.bottom_line}
          </p>
        </div>
      )}

      {/* 10. Confidence & Evidence */}
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

      {/* 11. Sources */}
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

