import React, { useState } from "react";
import { motion } from "motion/react";
import { supabase } from "./lib/supabase";
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
import SetPasswordPane from "./components/SetPasswordPane";
import { AlertItem, ChatMessage } from "./types";
import { ShieldAlert, Loader2 } from "lucide-react";

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [clientId, setClientId] = useState<string | null>(null);
  const [industry, setIndustry] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("policy_risk_monitor");
  const [isRecoveryFlow, setIsRecoveryFlow] = useState(() => window.location.hash.includes('access_token'));
  const [selectedAlert, setSelectedAlert] = useState<AlertItem | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsAuthenticating(true);

    try {
      // 1. Authenticate with Supabase
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      // 2. Look up client_id and id in admin.client_users
      const { data: userData, error: userError } = await supabase
        .schema('admin')
        .from('client_users')
        .select('id, client_id')
        .eq('email', email.toLowerCase())
        .single();

      if (userError) {
        console.error("Client lookup error:", userError);
        throw new Error("User associated client not found. Please contact support.");
      }

      if (!userData?.client_id) {
        throw new Error("No client assigned to this account.");
      }

      // 3. Fetch client industry from admin.clients
      const { data: clientData, error: clientError } = await supabase
        .schema('admin')
        .from('clients')
        .select('industry')
        .eq('id', userData.client_id)
        .single();

      if (clientError) {
        console.error("Client industry fetch error:", clientError);
      }

      setUserId(userData.id);
      setClientId(userData.client_id);
      setIndustry(clientData?.industry || "Retail");
      setIsLoggedIn(true);
    } catch (err: any) {
      setLoginError(err.message || "An unexpected error occurred during login.");
      setIsLoggedIn(false);
    } finally {
      setIsAuthenticating(false);
    }
  };

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
            clientId={clientId || ""}
            industry={industry || ""}
            userId={userId || ""}
            selectedAlert={selectedAlert}
            onSelectAlert={(alert) => setSelectedAlert(alert)}
          />
        );

      case "latest":
        return <LatestPane onReturn={handleReturn} />;

      case "market_dynamics":
        return (
          <MarketDynamicsPane 
            onReturn={handleReturn} 
            clientId={clientId || ""}
            industry={industry || ""}
            userId={userId || ""}
          />
        );

      case "find_opportunities":
        return <FindOpportunitiesPane onReturn={handleReturn} />;

      case "competitive_radar":
        return <CompetitiveRadarPane onReturn={handleReturn} />;

      case "voice_of_customer":
        return <VoiceOfCustomerPane onReturn={handleReturn} />;

      case "foreward_outlook":
        return (
          <ForewardOutlookPane 
            onReturn={handleReturn} 
            clientId={clientId || ""}
            industry={industry || ""}
            userId={userId || ""}
          />
        );

      case "decision_intelligence":
        return (
          <DecisionIntelligencePane 
            onReturn={handleReturn}
            onTabChange={setActiveTab}
            clientId={clientId || ""}
            industry={industry || ""}
            userId={userId || ""}
          />
        );

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
  if (isRecoveryFlow) {
    return <SetPasswordPane onDone={() => setIsRecoveryFlow(false)} />;
  }

  return (
    <>
      {!isLoggedIn ? (
        <div className="w-screen h-screen flex items-center justify-center bg-zinc-50 select-text">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-sm bg-white p-8 border border-zinc-200 rounded-[4px] shadow-sm flex flex-col items-center"
          >
            <div className="w-10 h-10 bg-zinc-900 rounded-[4px] flex items-center justify-center mb-6">
              <ShieldAlert className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-semibold tracking-tight text-zinc-900 mb-6">Welcome Back</h2>
            
            <form 
              onSubmit={handleLogin}
              className="w-full flex flex-col gap-4"
            >
              {loginError && (
                <div className="w-full p-3 bg-rose-50 border border-rose-100 rounded-[4px] text-rose-600 text-[12px] leading-relaxed">
                  {loginError}
                </div>
              )}
              
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-medium text-zinc-700">Email</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  disabled={isAuthenticating}
                  className="w-full h-10 px-3 text-[13px] border border-zinc-200 rounded-[4px] focus:outline-none focus:border-[#7c3aed] focus:ring-1 focus:ring-[#7c3aed]/20 transition-all disabled:opacity-50"
                  placeholder="name@company.com"
                />
              </div>
              
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-medium text-zinc-700">Password</label>
                <input 
                  type="password" 
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  disabled={isAuthenticating}
                  className="w-full h-10 px-3 text-[13px] border border-zinc-200 rounded-[4px] focus:outline-none focus:border-[#7c3aed] focus:ring-1 focus:ring-[#7c3aed]/20 transition-all disabled:opacity-50"
                  placeholder="••••••••"
                />
              </div>

              <button 
                type="submit"
                disabled={isAuthenticating}
                className="w-full h-10 mt-2 bg-zinc-900 hover:bg-black text-white text-[13px] font-medium rounded-[4px] transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isAuthenticating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Authenticating...
                  </>
                ) : "Login"}
              </button>
            </form>
          </motion.div>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 3 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          id="app-container"
          className="w-screen h-screen flex overflow-hidden bg-zinc-100 select-text"
        >
          {/* 1. Left Vertical Sidebar Rail */}
          <LeftMenubar activeTab={activeTab} onTabChange={setActiveTab} onLogout={() => setIsLoggedIn(false)} />

          {/* 2. Content Region: Document Intelligence and Integrated AI Chat in 2-Pane Split */}
          <div id="central-split-viewport" className="flex-1 h-full flex overflow-hidden">
            
            {/* Render selected workspace views */}
            {renderWorkspaceContent()}

          </div>
        </motion.div>
      )}
    </>
  );
}
