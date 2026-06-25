import React, { useState, useRef, useEffect } from "react";
import { 
  RotateCcw, Maximize2, X, Plus, ArrowUp, Sparkles, 
  FileText, Lightbulb, Zap, Loader2, MessageSquare, Compass
} from "lucide-react";
import { ChatMessage } from "../types";

interface AIChatPaneProps {
  chatHistory: ChatMessage[];
  setChatHistory: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  activeAlertTitle?: string;
}

export default function AIChatPane({ chatHistory, setChatHistory, activeAlertTitle }: AIChatPaneProps) {
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom upon new message receipt
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatHistory, loading]);

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim() || loading) return;

    setErrorStatus(null);
    const userMessage: ChatMessage = {
      id: typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : Math.random().toString(36).substring(2),
      role: "user",
      text: textToSend,
      timestamp: new Date()
    };

    // Append user message local state immediately
    setChatHistory(prev => [...prev, userMessage]);
    setInputText("");
    setLoading(true);

    try {
      // Build history payloads for the Express server (matching server schema)
      const formattedHistory = chatHistory.map(msg => ({
        role: msg.role,
        text: msg.text
      }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: textToSend,
          history: formattedHistory
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to retrieve analysis.");
      }

      const data = await res.json();
      const assistantMessage: ChatMessage = {
        id: typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : Math.random().toString(36).substring(2),
        role: "model",
        text: data.text,
        timestamp: new Date()
      };

      setChatHistory(prev => [...prev, assistantMessage]);
    } catch (err: any) {
      console.error("Chat error:", err);
      setErrorStatus(err.message || "Something went wrong. Check connection.");
    } finally {
      setLoading(false);
    }
  };

  const handleNewChat = () => {
    setChatHistory([]);
    setInputText("");
    setErrorStatus(null);
    setLoading(false);
  };

  const handleSuggestionClick = (suggestionText: string) => {
    let prompt = suggestionText;
    if (activeAlertTitle) {
      prompt = `${suggestionText} regarding "${activeAlertTitle}"`;
    }
    handleSend(prompt);
  };

  return (
    <div id="ai-chat-pane" className="w-full h-full bg-white flex flex-col">
      
      {/* Upper header section */}
      <div id="chat-header" className="p-4 py-3 border-b border-zinc-100 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-[#7c3aed]" />
          <h2 id="chat-heading-title" className="text-[14.5px] font-medium tracking-tight text-zinc-900">
            Al Chat
          </h2>
        </div>
        
        <div className="flex items-center gap-1.5">
          <button
            id="new-chat-trigger"
            onClick={handleNewChat}
            className="bg-[#18181b] hover:bg-black text-white text-[11px] font-normal px-2.5 py-1.5 rounded-[4px] flex items-center gap-1 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Chat</span>
          </button>
          
          <button
            id="reset-chat-trigger"
            onClick={handleNewChat}
            title="Reset history"
            className="p-1 px-1.5 border border-zinc-200 text-zinc-500 rounded-[4px] hover:bg-zinc-50"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <button
            id="maximize-chat-trigger"
            title="Full screen workspace views"
            onClick={() => handleSuggestionClick("Give me a strategic compliance overview")}
            className="p-1 px-1.5 border border-zinc-200 text-zinc-500 rounded-[4px] hover:bg-zinc-50 md:block hidden"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>

          <button
            id="close-chat-trigger"
            title="Minimize"
            onClick={handleNewChat}
            className="p-1 px-1.5 border border-zinc-200 text-zinc-500 rounded-[4px] hover:bg-zinc-50"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main chat viewport */}
      <div id="chat-viewport-scroller" ref={scrollRef} className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 bg-zinc-50/40">
        
        {chatHistory.length === 0 ? (
          // Welcome screen styled exactly as requested
          <div id="welcome-chat-view" className="flex-1 flex flex-col items-center justify-center py-8 text-center px-4 self-center max-w-sm my-auto">
            
            {/* Graceview abstract purple/violet block icon */}
            <div id="graceview-logo-emblem" className="w-[42px] h-[42px] bg-gradient-to-tr from-[#7c3aed] to-[#a78bfa] rounded-[4px] flex items-center justify-center shadow-sm mb-5">
              <Sparkles className="w-[18px] h-[18px] text-white" />
            </div>

            <h3 className="text-[15.5px] font-medium text-zinc-800 tracking-tight leading-tight mb-1">
              Welcome to Graceview Chat
            </h3>
            
            <p className="text-[12px] text-zinc-500 font-normal leading-relaxed mb-4">
              Graceview can help answer questions or complete tasks.
            </p>

            <p className="text-[11px] text-zinc-400 font-normal leading-relaxed bg-white border border-zinc-200/60 p-2.5 rounded-[4px] w-full mb-8 shadow-[0_1px_2px_rgba(0,0,0,0.01)]">
              Hover over a citation to preview the context, or click to navigate to it.
            </p>

            {/* Suggesive Prompt Cards */}
            <div className="flex flex-col gap-2 w-full">
              <button
                onClick={() => handleSuggestionClick("Summarise key issues and objectives")}
                className="p-3 bg-white border border-zinc-200 hover:border-zinc-300 text-left rounded-[4px] transition-all flex items-start gap-2.5 group shadow-[0_1px_2px_rgba(0,0,0,0.015)]"
              >
                <Lightbulb className="w-[15px] h-[15px] text-amber-500 mt-0.5 flex-shrink-0" />
                <div className="flex flex-col gap-0.5">
                  <span className="text-[12px] font-medium text-zinc-700 leading-none group-hover:text-black">
                    Summarise key issues or ideas
                  </span>
                  <span className="text-[10px] text-zinc-400 font-normal line-clamp-1">
                    Extract core provisions, impacts or triggers.
                  </span>
                </div>
              </button>

              <button
                onClick={() => handleSuggestionClick("Help me write an executive summary report")}
                className="p-3 bg-white border border-zinc-200 hover:border-zinc-300 text-left rounded-[4px] transition-all flex items-start gap-2.5 group shadow-[0_1px_2px_rgba(0,0,0,0.015)]"
              >
                <FileText className="w-[15px] h-[15px] text-indigo-500 mt-0.5 flex-shrink-0" />
                <div className="flex flex-col gap-0.5">
                  <span className="text-[12px] font-medium text-zinc-700 leading-none group-hover:text-black">
                    Help me write an article
                  </span>
                  <span className="text-[10px] text-zinc-400 font-normal line-clamp-1">
                    Structure a policy digest for your colleagues.
                  </span>
                </div>
              </button>

              <button
                onClick={() => handleSuggestionClick("Detail the timeline steps and compliance actions")}
                className="p-3 bg-white border border-zinc-200 hover:border-zinc-300 text-left rounded-[4px] transition-all flex items-start gap-2.5 group shadow-[0_1px_2px_rgba(0,0,0,0.015)]"
              >
                <Compass className="w-[15px] h-[15px] text-emerald-500 mt-0.5 flex-shrink-0" />
                <div className="flex flex-col gap-0.5">
                  <span className="text-[12px] font-medium text-zinc-700 leading-none group-hover:text-black">
                    Detail compliance timeline steps
                  </span>
                  <span className="text-[10px] text-zinc-400 font-normal line-clamp-1">
                    Trace execution steps across days 1-7.
                  </span>
                </div>
              </button>
            </div>

          </div>
        ) : (
          // Message lists
          <div className="flex flex-col gap-4">
            {chatHistory.map((msg) => {
              const isUser = msg.role === "user";
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col max-w-[85%] ${
                    isUser ? "self-end items-end" : "self-start items-start"
                  }`}
                >
                  <div
                    className={`p-3 text-[12.5px] leading-relaxed rounded-[4px] border ${
                      isUser
                        ? "bg-[#18181b] text-white border-zinc-900"
                        : "bg-white text-zinc-800 border-zinc-200"
                    }`}
                  >
                    {/* Render helper text line-by-line to preserve structure */}
                    <div className="whitespace-pre-wrap font-normal">
                      {msg.text}
                    </div>
                  </div>
                  <span className="text-[9px] text-zinc-400 mt-1 px-1">
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              );
            })}

            {/* Analyzing Indicator */}
            {loading && (
              <div className="self-start flex items-center gap-2 bg-white border border-zinc-200 p-3 rounded-[4px] text-[12px] text-zinc-500">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#7c3aed]" />
                <span>Graceview is analyzing policies ...</span>
              </div>
            )}

            {/* Error messaging bar */}
            {errorStatus && (
              <div className="p-3 bg-rose-50 border border-rose-100 rounded-[4px] text-[12px] text-rose-800">
                <p className="font-medium">Error Occurred</p>
                <p className="mt-0.5 opacity-90">{errorStatus}</p>
              </div>
            )}
          </div>
        )}

      </div>

      {/* Input textbox bar */}
      <div id="chat-input-toolbar-block" className="p-3 border-t border-zinc-100 flex-shrink-0 bg-white">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend(inputText);
          }}
          className="relative w-full"
        >
          <input
            id="chat-message-text-input"
            type="text"
            placeholder={activeAlertTitle ? `Ask about "${activeAlertTitle}"...` : "Write message..."}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={loading}
            className="w-full bg-[#fbfbfb] text-[13px] pl-3.5 pr-10 py-2 border border-zinc-200 rounded-[4px] focus:outline-none focus:border-zinc-300 placeholder:text-zinc-400 disabled:opacity-50"
          />
          <button
            id="submit-message-button"
            type="submit"
            disabled={!inputText.trim() || loading}
            title="Send inquiry"
            className="absolute right-1.5 top-[5px] w-7 h-7 bg-[#18181b] hover:bg-black text-white flex items-center justify-center rounded-[4px] disabled:opacity-30 disabled:hover:bg-[#18181b] transition-all"
          >
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
        </form>
        
        <p className="text-center text-[10px] text-zinc-400 font-normal mt-2 select-none leading-none">
          AI can make mistakes. Check important info.
        </p>
      </div>

    </div>
  );
}
