import { useState } from "react";
import { motion } from "motion/react";
import LeftMenubar from "./components/LeftMenubar";
import IntelligencePane from "./components/IntelligencePane";
import LatestPane from "./components/LatestPane";
import MarketDynamicsPane from "./components/MarketDynamicsPane";
import FindOpportunitiesPane from "./components/FindOpportunitiesPane";
import CompetitiveRadarPane from "./components/CompetitiveRadarPane";
import VoiceOfCustomerPane from "./components/VoiceOfCustomerPane";
import ForewardOutlookPane from "./components/ForewardOutlookPane";
import DecisionIntelligencePane from "./components/DecisionIntelligencePane";
import MyBookmarksPane from "./components/MyBookmarksPane";
import SettingsPane from "./components/SettingsPane";
import SupportPane from "./components/SupportPane";
import { AlertItem, ChatMessage } from "./types";
import { ShieldAlert } from "lucide-react";

export default function App() {
  const [activeTab, setActiveTab] = useState<string>("policy_risk_monitor");
  const [selectedAlert, setSelectedAlert] = useState<AlertItem | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);

  // Function to push programmatic queries to AI Chat from buttons in other workspaces
  const handleSendToChat = (prompt: string) => {
    const userMessage: ChatMessage = {
      id: typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : Math.random().toString(36).substring(2),
      role: "user",
      text: prompt,
      timestamp: new Date()
    };

    setChatHistory(prev => [...prev, userMessage]);

    // Send the prompt securely to our express server API
    setLoadingResponse(prompt);
  };

  const setLoadingResponse = async (textToSend: string) => {
    try {
      // Build history payload
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

      if (res.ok) {
        const data = await res.json();
        const assistantMessage: ChatMessage = {
          id: typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : Math.random().toString(36).substring(2),
          role: "model",
          text: data.text,
          timestamp: new Date()
        };
        setChatHistory(prev => [...prev, assistantMessage]);
      } else {
        const err = await res.json();
        throw new Error(err.error || "Failed");
      }
    } catch (e: any) {
      const errMsg: ChatMessage = {
        id: typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : Math.random().toString(36).substring(2),
        role: "model",
        text: `Graceview Analyst Error: Could not resolve regulatory query on "${selectedAlert?.signal_title || "Unknown"}".\n\nDetail: ${e.message || "Endpoint error - Check Settings > Secrets inside AI Studio to ensure GEMINI_API_KEY is configured."}`,
        timestamp: new Date()
      };
      setChatHistory(prev => [...prev, errMsg]);
    }
  };

  // Switch between workspaces based on active tab
  const renderWorkspaceContent = () => {
    const handleReturn = () => setActiveTab("policy_risk_monitor");

    switch (activeTab) {
      case "policy_risk_monitor":
        return (
          <IntelligencePane
            selectedAlert={selectedAlert}
            onSelectAlert={(alert) => setSelectedAlert(alert)}
          />
        );

      case "latest":
        return <LatestPane onReturn={handleReturn} />;

      case "market_dynamics":
        return <MarketDynamicsPane onReturn={handleReturn} />;

      case "find_opportunities":
        return <FindOpportunitiesPane onReturn={handleReturn} />;

      case "competitive_radar":
        return <CompetitiveRadarPane onReturn={handleReturn} />;

      case "voice_of_customer":
        return <VoiceOfCustomerPane onReturn={handleReturn} />;

      case "foreward_outlook":
        return <ForewardOutlookPane onReturn={handleReturn} />;

      case "decision_intelligence":
        return <DecisionIntelligencePane onReturn={handleReturn} />;

      case "my_bookmarks":
        return <MyBookmarksPane onReturn={handleReturn} />;

      case "support":
        return <SupportPane onReturn={handleReturn} />;

      case "settings":
        return <SettingsPane onReturn={handleReturn} />;

      default:
        return (
          <div className="flex-1 h-full bg-zinc-50 flex items-center justify-center p-8 select-none">
            <div className="max-w-md w-full bg-white border border-zinc-200 p-6 rounded-[4px] shadow-[0_1px_3px_rgba(0,0,0,0.01)] text-center flex flex-col items-center">
              <h3 className="text-base font-medium text-zinc-900 mb-1">
                Workspace
              </h3>
              <p className="text-[12.5px] text-zinc-500 leading-relaxed mb-6">
                This workspace view compiles custom policy definitions for your requested workflow.
              </p>
              <button 
                onClick={handleReturn}
                className="py-1.5 px-4 border border-zinc-200 bg-[#fbfbfb] text-zinc-700 text-[11.5px] font-normal rounded-[4px] hover:bg-zinc-50"
              >
                Go to policy & risk monitor
              </button>
            </div>
          </div>
        );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 3 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      id="app-container"
      className="w-screen h-screen flex overflow-hidden bg-zinc-100 select-text"
    >
      {/* 1. Left Vertical Sidebar Rail */}
      <LeftMenubar activeTab={activeTab} onTabChange={setActiveTab} />

      {/* 2. Content Region: Document Intelligence and Integrated AI Chat in 2-Pane Split */}
      <div id="central-split-viewport" className="flex-1 h-full flex overflow-hidden">
        
        {/* Render selected workspace views */}
        {renderWorkspaceContent()}

      </div>
    </motion.div>
  );
}
