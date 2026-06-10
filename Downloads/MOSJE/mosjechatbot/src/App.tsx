import React, { useState, useEffect, useRef } from "react";
import { 
  Bot, 
  User, 
  Send, 
  Trash2, 
  Search, 
  Compass, 
  FileDown, 
  FileUp, 
  Plus, 
  ExternalLink, 
  PhoneCall, 
  ShieldCheck, 
  BookOpen, 
  ChevronRight, 
  Activity, 
  Briefcase, 
  Users, 
  LifeBuoy, 
  GraduationCap, 
  Info, 
  X, 
  Clock, 
  Maximize2 
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import Markdown from "react-markdown";
import { MOSJE_SCHEMES, SchemeInfo } from "./data/schemes";

// Interfaces for State Management
interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  citedSchemeIds?: string[];
  followUpQuestions?: string[];
}

interface ChatSession {
  id: string;
  title: string;
  createdAt: string;
  messages: Message[];
}

export default function App() {
  // Chat History & Session States
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string>("");
  const [inputText, setInputText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Browsing/Scheme Directory States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [focusedScheme, setFocusedScheme] = useState<SchemeInfo | null>(null);

  // Layout states
  const [showHistoryPanel, setShowHistoryPanel] = useState(true);
  const [systemTime, setSystemTime] = useState("");
  
  // Ref for auto-scrolling
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load chat sessions from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem("mosje_chatbot_sessions");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.length > 0) {
          setSessions(parsed);
          setActiveSessionId(parsed[0].id);
        } else {
          initDefaultSession();
        }
      } catch (e) {
        initDefaultSession();
      }
    } else {
      initDefaultSession();
    }
  }, []);

  // Save chat sessions to local storage whenever they change
  useEffect(() => {
    if (sessions.length > 0) {
      localStorage.setItem("mosje_chatbot_sessions", JSON.stringify(sessions));
    }
  }, [sessions]);

  // Update futuristic live clock (India Standard Time Reference / UTC 2026-06-10 08:03:33 UTC)
  useEffect(() => {
    const formatTime = () => {
      const now = new Date();
      // Format as DD MMM YYYY | HH:MM:SS IST/UTC
      return now.toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
        hour12: false,
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
      }) + " IST";
    };
    setSystemTime(formatTime());
    const interval = setInterval(() => {
      setSystemTime(formatTime());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [sessions, activeSessionId, isGenerating]);

  // Initialize a default chat session if blank
  const initDefaultSession = () => {
    const defaultId = "session_" + Date.now();
    const defaultSession: ChatSession = {
      id: defaultId,
      title: "New Consultation",
      createdAt: new Date().toISOString(),
      messages: [
        {
          id: "welcome_msg",
          role: "assistant",
          content: "Welcome to **MoSJE Digital Seva AI**. I am your futuristic, secure assistant of the **Ministry of Social Justice and Empowerment, Government of India**.\n\nI can answer details about *any* scheme under our jurisdiction, calculate eligibility, and guide you directly to official direct portal registries. Select one of the quick scheme cards below, click a query chips, or enter your question below to begin.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          citedSchemeIds: [],
          followUpQuestions: [
            "What is PM-SURAJ and how can I benefit from it?",
            "How do I apply for a Transgender Certificate online?",
            "What are the benefits in post-matric scholarship for Scheduled Caste students?"
          ]
        }
      ]
    };
    setSessions([defaultSession]);
    setActiveSessionId(defaultId);
  };

  // Switch Active Session
  const activeSession = sessions.find(s => s.id === activeSessionId) || sessions[0] || null;

  // Create a brand new session
  const handleNewChat = () => {
    const newId = "session_" + Date.now();
    const newSession: ChatSession = {
      id: newId,
      title: "New Consultation " + (sessions.length + 1),
      createdAt: new Date().toISOString(),
      messages: [
        {
          id: "welcome_" + Date.now(),
          role: "assistant",
          content: "How may I assist you today on official MoSJE welfare schemes, educational loans, grants, or sanitation entrepreneurship models?",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          citedSchemeIds: [],
          followUpQuestions: [
            "What benefits are offered under the NAMASTE scheme?",
            "Who can apply for the National Overseas Scholarship for SC?",
            "What are e-ANUDAAN requirements for NGOs?"
          ]
        }
      ]
    };
    setSessions([newSession, ...sessions]);
    setActiveSessionId(newId);
  };

  // Delete a specific session
  const handleDeleteSession = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = sessions.filter(s => s.id !== sessionId);
    setSessions(updated);
    if (activeSessionId === sessionId) {
      if (updated.length > 0) {
        setActiveSessionId(updated[0].id);
      } else {
        localStorage.removeItem("mosje_chatbot_sessions");
        initDefaultSession();
      }
    }
  };

  // Clear all chats
  const handleClearAllChats = () => {
    if (confirm("Are you sure you want to delete all chat history from local memory?")) {
      localStorage.removeItem("mosje_chatbot_sessions");
      initDefaultSession();
    }
  };

  // Export current session to local JSON file
  const handleExportSession = () => {
    if (!activeSession) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(activeSession, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `mosje-chat-session-${activeSession.id}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Import chat session from local JSON file
  const handleImportSession = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed && parsed.id && parsed.title && Array.isArray(parsed.messages)) {
          // Generate a unique ID to prevent overlap
          const importedId = "imported_" + Date.now();
          const importedSession: ChatSession = {
            ...parsed,
            id: importedId,
            title: `[Imported] ${parsed.title}`
          };
          setSessions(prev => [importedSession, ...prev]);
          setActiveSessionId(importedId);
          alert("Chat session imported successfully!");
        } else {
          alert("Invalid file format. Please upload a valid exported MoSJE chat session JSON file.");
        }
      } catch (err) {
        alert("Error parsing file. Ensure it is a valid JSON document.");
      }
    };
    reader.readAsText(file);
    // Reset file input value
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Submit User Message
  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText?.trim() || inputText.trim();
    if (!textToSend || isGenerating || !activeSession) return;

    // Reset input field if it's the standard send
    if (!customText) {
      setInputText("");
    }

    const userMessage: Message = {
      id: "msg_" + Date.now(),
      role: "user",
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    // Update session state with User Message
    const updatedMessages = [...activeSession.messages, userMessage];
    
    // Auto-update list title of a new conversation based on the first query
    let newTitle = activeSession.title;
    if (activeSession.title === "New Consultation" || activeSession.title.startsWith("New Consultation ")) {
      newTitle = textToSend.split(" ").slice(0, 4).join(" ") + "...";
    }

    const updatedSession = {
      ...activeSession,
      title: newTitle,
      messages: updatedMessages
    };

    setSessions(prev => prev.map(s => s.id === activeSessionId ? updatedSession : s));
    setIsGenerating(true);

    try {
      // Call server API proxy that talks to @google/genai using gemini-3.1-flash-lite
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          // Map to backend schema
          messages: updatedMessages.map(m => ({ role: m.role, content: m.content }))
        })
      });

      if (!response.ok) {
        throw new Error("Local server reported communication failure with Government AI Core.");
      }

      const botPayload = await response.json();

      const aiMessage: Message = {
        id: "msg_ai_" + Date.now(),
        role: "assistant",
        content: botPayload.answer || "I could not resolve your inquiry. Please refine your query.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        citedSchemeIds: botPayload.citedSchemeIds || [],
        followUpQuestions: botPayload.additionalFollowUpQuestions || []
      };

      const finalSession = {
        ...updatedSession,
        messages: [...updatedMessages, aiMessage]
      };

      setSessions(prev => prev.map(s => s.id === activeSessionId ? finalSession : s));

    } catch (err: any) {
      console.error(err);
      const errorMessage: Message = {
        id: "msg_err_" + Date.now(),
        role: "assistant",
        content: `⚠️ **AI Gateway Offline / Setup Needed**\n\nI was unable to secure a cognitive handshake. ${err.message}\n\n*If you are the developer or operator, please configure the **GEMINI_API_KEY** in the **Settings > Secrets** panel of AI Studio.*`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        citedSchemeIds: []
      };
      setSessions(prev => prev.map(s => s.id === activeSessionId ? {
        ...updatedSession,
        messages: [...updatedMessages, errorMessage]
      } : s));
    } finally {
      setIsGenerating(false);
    }
  };

  // Get active Category schemes counter
  const getCategoryCount = (catName: string) => {
    if (catName === "All") return MOSJE_SCHEMES.length;
    return MOSJE_SCHEMES.filter(s => s.category === catName).length;
  };

  // Filter schemes based on search input and selected category tab
  const filteredSchemes = MOSJE_SCHEMES.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          s.hindiName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          s.shortCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          s.objective.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || s.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ["All", "SC", "Scholarships", "Sanitation", "Senior Citizens", "NGO", "Transgender/Beggary", "Helpline", "De-addiction"];

  return (
    <div className="h-screen bg-[#0A0C10] text-[#8E9CAE] font-sans flex flex-col selection:bg-amber-500/30 selection:text-amber-200 overflow-hidden">
      
      {/* Sleek top header following Bento Grid system standard */}
      <header className="h-16 border-b border-slate-800 bg-[#0D1117]/90 backdrop-blur-md flex items-center justify-between px-6 shrink-0 z-30 shadow-lg">
        <div className="flex items-center gap-3">
          {/* Ashoka Emblem and flag colors Vector */}
          <div className="p-1 rounded bg-slate-900 border border-slate-800 flex items-center justify-center">
            <div className="w-8 h-10 flex flex-col justify-between items-center text-amber-500 font-serif leading-none select-none">
              <span className="text-[10px] font-bold text-slate-400">GOVT</span>
              <span className="text-sm font-extrabold -my-1 text-center font-sans tracking-widest text-[#FF9933]">🇮🇳</span>
              <span className="text-[8px] font-semibold text-[#128807]">INDIA</span>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[9px] uppercase font-mono tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded leading-none font-bold">MoSJE</span>
              <span className="text-xs text-slate-500 font-medium hidden sm:inline">Ministry of Social Justice & Empowerment</span>
            </div>
            <h1 className="text-sm sm:text-base font-bold font-sans tracking-tight text-white">
              Sashakt Sahayak <span className="text-slate-400 font-normal">| Cognitive Helpdesk</span>
            </h1>
          </div>
        </div>

        {/* Live Systems Core Panel with Bento theme */}
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="hidden lg:flex flex-col text-right">
            <span className="text-slate-600 text-[9px] tracking-wider uppercase font-bold">Secure Cloud Node</span>
            <span className="text-slate-400 font-semibold flex items-center gap-1.5 justify-end mt-0.5">
              <Clock className="w-3.5 h-3.5 text-slate-500 animate-spin-slow" /> {systemTime}
            </span>
          </div>
          <div className="flex flex-col text-right">
            <span className="text-slate-600 text-[9px] tracking-wider uppercase font-bold">Gateway Security</span>
            <span className="text-emerald-500 font-semibold flex items-center gap-1.5 justify-end mt-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              v3.1 FLASH LITE
            </span>
          </div>
        </div>
      </header>

      {/* Main interactive full-screen dashboard workspace */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* Toggle Panel Button for Sidebar */}
        <button 
          onClick={() => setShowHistoryPanel(!showHistoryPanel)}
          className="absolute left-4 top-4 z-40 bg-slate-900 border border-slate-800 p-2.5 rounded-lg text-slate-400 hover:text-white shadow-lg md:hidden flex items-center"
        >
          <Compass className="w-4 h-4 mr-1.5 text-emerald-500" />
          <span className="text-xs font-bold uppercase tracking-wider font-mono">Session Terminal</span>
        </button>

        {/* LEFT PANEL: Chat History & Action Center (Context Layer) */}
        <aside className={`
          ${showHistoryPanel ? "flex" : "hidden"} 
          md:flex flex-col w-64 border-r border-[#1B222C]/40 bg-[#0D1117] flex-none z-20 shrink-0
          absolute md:static top-0 bottom-0 left-0 right-0 max-h-full
        `}>
          <div className="p-5 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-emerald-500" />
              <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 font-mono">Session History</h2>
            </div>
            {/* Mobile close sidebar panel */}
            <button 
              onClick={() => setShowHistoryPanel(false)}
              className="md:hidden text-slate-450 hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* New Chat Action */}
          <div className="p-5 border-b border-slate-800/80">
            <button
              onClick={handleNewChat}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-emerald-600 hover:from-orange-400 hover:to-emerald-500 text-white font-sans font-bold text-xs py-3 px-4 rounded-xl shadow-lg hover:shadow-orange-500/10 transition-all cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4" />
              New Consultation
            </button>
          </div>

          {/* Chat Sessions list */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2.5 custom-scrollbar">
            <div className="text-[10px] font-bold uppercase text-slate-500 tracking-wider mb-2 px-2">Recent Sessions</div>
            {sessions.map((sess) => {
              const isActive = sess.id === activeSessionId;
              return (
                <div
                  key={sess.id}
                  onClick={() => {
                    setActiveSessionId(sess.id);
                    if (window.innerWidth < 768) {
                      setShowHistoryPanel(false);
                    }
                  }}
                  className={`
                    group relative p-3 rounded-xl flex items-center justify-between gap-2.5 cursor-pointer transition-all border-l-2
                    ${isActive 
                      ? "bg-blue-900/10 border-blue-500 text-blue-100 shadow-sm" 
                      : "border-transparent hover:bg-slate-850/50 text-slate-400 hover:text-slate-200"
                    }
                  `}
                >
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-semibold truncate ${isActive ? "text-blue-105" : "text-slate-300"}`}>{sess.title}</p>
                    <p className="text-[9px] font-mono text-slate-500 mt-1">
                      {new Date(sess.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    </p>
                  </div>
                  <button
                    onClick={(e) => handleDeleteSession(sess.id, e)}
                    className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 p-1 rounded-md hover:bg-slate-800 transition-all"
                    title="Delete Chat"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Export & Import Action Center footer */}
          <div className="p-4 border-t border-slate-800 bg-[#090D12] space-y-3 shrink-0">
            <div className="text-[10px] font-bold uppercase text-slate-500 tracking-wider px-1">Recent Sessions Actions</div>
            <div className="flex gap-2 text-xs font-bold uppercase tracking-tighter">
              <button
                onClick={handleExportSession}
                className="flex-1 bg-slate-800 hover:bg-slate-700 p-2 text-[10px] uppercase font-bold tracking-tighter flex items-center justify-center gap-2 transition-all cursor-pointer text-slate-300 hover:text-white rounded-md"
                title="Export session to local backup"
              >
                <FileDown className="w-3.5 h-3.5 text-amber-500" />
                Export
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 border border-slate-750 hover:bg-slate-800 p-2 text-[10px] uppercase font-bold tracking-tighter flex items-center justify-center gap-2 transition-all cursor-pointer text-slate-350 hover:text-white rounded-md"
                title="Import session JSON backup"
              >
                <FileUp className="w-3.5 h-3.5 text-emerald-400" />
                Import
              </button>
            </div>
            
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleImportSession} 
              accept=".json" 
              className="hidden" 
            />

            <button
              onClick={handleClearAllChats}
              className="w-full flex items-center justify-center gap-2 bg-[#090D12] hover:bg-red-950/20 border border-slate-800 hover:border-red-900/60 text-slate-500 hover:text-red-400 rounded-lg py-2 text-[10px] uppercase font-bold tracking-wider transition-all font-mono"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Reset Cache
            </button>
          </div>
        </aside>

        {/* MIDDLE COLUMN: Interactive Chat Engine */}
        <main className="flex-1 flex flex-col bg-[#0A0C10] shadow-2xl relative overflow-hidden">
          {/* Header */}
          <header className="h-16 border-b border-slate-800 flex items-center justify-between px-8 bg-[#0D1117]/80 backdrop-blur-md shrink-0">
            <div className="flex items-center gap-4">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <div className="text-sm font-medium text-slate-300">
                MOSJE Intelligent Query System <span className="text-slate-500 text-xs ml-2 font-normal">v3.1 Flash Lite</span>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="text-[10px] px-2.5 py-1 rounded border border-slate-700 text-slate-555 font-bold tracking-wider font-mono">GOI CLOUD SECURED</div>
            </div>
          </header>

            {/* MESSAGE FEED SCROLLER */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
                   {/* Show original Welcome Board state if conversation is brand new/empty */}
              {activeSession && activeSession.messages.length <= 1 && (
                <div className="mt-2 mb-6">
                  
                  {/* Digital Gateway Hero Banner */}
                  <div className="relative p-6 rounded-2xl overflow-hidden bg-[#0D1117] border border-slate-800 shadow-2xl bg-gradient-to-br from-[#0D1117] via-[#161B22] to-[#0D1117]">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/5 rounded-full filter blur-3xl pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/5 rounded-full filter blur-3xl pointer-events-none" />
                    
                    <div className="relative z-10 flex flex-col items-center text-center space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-550/10 flex items-center justify-center border border-emerald-500/20 text-emerald-400 shadow-md">
                        <Bot className="w-6 h-6 animate-pulse" />
                      </div>
                      <h3 className="text-lg font-bold tracking-tight text-white font-sans">Sashakt Sahayak Portal</h3>
                      <p className="text-xs text-slate-400 max-w-xl leading-relaxed">
                        Authorized real-time cognitive assistant of MoSJE. Type your queries or select a scheme directory card on the right to inquire about application steps, direct-benefit credentials, and support helpline info.
                      </p>
                      
                      {/* Indian Emblem motto */}
                      <p className="text-[9px] font-mono text-amber-500/60 tracking-widest uppercase font-bold">
                        Satyameva Jayate • सत्यमेव जयते
                      </p>
                    </div>
                  </div>

                  {/* Standard Suggested Questions List */}
                  <div className="mt-6 space-y-2.5">
                    <p className="text-[10px] font-mono text-slate-500 uppercase tracking-wider font-bold">Frequently Consulted Inquiries</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <button 
                        onClick={() => handleSendMessage("What is the PM-SURAJ national credit support portal and what is the maximum loan limit?")}
                        className="p-3 bg-[#0D1117] hover:bg-[#161B22] border border-slate-800 hover:border-amber-550/30 text-left rounded-xl text-xs leading-relaxed transition-all cursor-pointer flex items-center gap-2.5 text-slate-300"
                      >
                        <ChevronRight className="w-3.5 h-3.5 text-amber-500 flex-none" />
                        What is PM-SURAJ and loan limits?
                      </button>
                      <button 
                        onClick={() => handleSendMessage("What does the NAMASTE scheme provide for sanitation workers?")}
                        className="p-3 bg-[#0D1117] hover:bg-[#161B22] border border-slate-800 hover:border-emerald-550/30 text-left rounded-xl text-xs leading-relaxed transition-all cursor-pointer flex items-center gap-2.5 text-slate-300"
                      >
                        <ChevronRight className="w-3.5 h-3.5 text-emerald-400 flex-none" />
                        NAMASTE benefits for sanitation workers
                      </button>
                      <button 
                        onClick={() => handleSendMessage("How can an NGO submit and track proposals on the e-ANUDAAN system?")}
                        className="p-3 bg-[#0D1117] hover:bg-[#161B22] border border-slate-800 hover:border-blue-550/30 text-left rounded-xl text-xs leading-relaxed transition-all cursor-pointer flex items-center gap-2.5 text-slate-300"
                      >
                        <ChevronRight className="w-3.5 h-3.5 text-blue-400 flex-none" />
                        e-ANUDAAN NGO proposal workflow
                      </button>
                      <button 
                        onClick={() => handleSendMessage("What is the National Overseas Scholarship for SC students and how to qualify?")}
                        className="p-3 bg-[#0D1117] hover:bg-[#161B22] border border-slate-800 hover:border-indigo-555/30 text-left rounded-xl text-xs leading-relaxed transition-all cursor-pointer flex items-center gap-2.5 text-slate-300"
                      >
                        <ChevronRight className="w-3.5 h-3.5 text-indigo-400 flex-none" />
                        National Overseas Scholarship eligibility
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Chat Thread */}
              {activeSession && activeSession.messages.map((msg) => {
                const isUser = msg.role === "user";
                return (
                  <div
                    key={msg.id}
                    className={`flex gap-3 max-w-full ${isUser ? "justify-end" : "justify-start"}`}
                  >
                    {/* Bot Avatar Icon */}
                    {!isUser && (
                      <div className="w-8 h-8 rounded-lg bg-[#0D1117] flex items-center justify-center border border-slate-800 text-amber-500 flex-shrink-0">
                        <Bot className="w-4 h-4 text-[#FF9933]" />
                      </div>
                    )}

                    <div className="flex flex-col gap-1.5 max-w-[85%] sm:max-w-[75%]">
                      {/* Name tag and timestamp */}
                      <div className={`flex items-center gap-1.5 text-[9px] font-mono text-slate-500 ${isUser ? "justify-end" : "justify-start"}`}>
                        <span className={isUser ? "text-slate-400" : "text-amber-500 font-bold"}>
                          {isUser ? "Citizen Terminus" : "Sashakt AI Operator"}
                        </span>
                        <span>•</span>
                        <span>{msg.timestamp}</span>
                      </div>

                      {/* Bubble content */}
                      <div className={`
                        p-4 rounded-xl text-xs sm:text-[13px] leading-relaxed
                        ${isUser 
                          ? "bg-slate-800 text-slate-100 rounded-tr-none border border-slate-700/60 shadow-md"
                          : "bg-[#0D1117] text-slate-200 border border-slate-800 rounded-tl-none shadow-lg backdrop-blur-sm"
                        }
                      `}>
                        {isUser ? (
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                        ) : (
                          <div className="markdown-body space-y-2 prose prose-invert max-w-none text-slate-300">
                            <Markdown>{msg.content}</Markdown>
                          </div>
                        )}
                      </div>

                      {/* CITATION REFERENCES SYSTEM UNDER EACH RESPONSE - REQUIREMENT #4 */}
                      {!isUser && msg.citedSchemeIds && msg.citedSchemeIds.length > 0 && (
                        <div className="mt-2.5 space-y-2">
                          <div className="flex items-center gap-1.5 ml-1 select-none">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">Official Portal References</span>
                          </div>
                          
                          <div className="grid grid-cols-1 gap-2.5 mt-1">
                            {msg.citedSchemeIds.map((cid) => {
                               const scheme = MOSJE_SCHEMES.find(s => s.id === cid);
                               if (!scheme) return null;
                               return (
                                 <div 
                                   key={scheme.id}
                                   className="bg-[#12161D] border border-slate-800 rounded-xl p-3.5 hover:border-emerald-500/30 transition-all shadow-md"
                                 >
                                   <div className="flex items-start justify-between gap-2">
                                     <div className="flex items-center gap-1.5">
                                       <span className="text-[9px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1 rounded font-bold uppercase leading-none py-0.5">
                                         {scheme.shortCode}
                                       </span>
                                       <h4 className="text-xs font-bold text-white leading-tight">{scheme.name}</h4>
                                     </div>
                                     <span className="text-[8px] uppercase font-mono text-emerald-500 font-extrabold tracking-widest whitespace-nowrap bg-emerald-500/5 px-1.5 py-0.5 rounded border border-emerald-500/15">GOI DIRECTIVE</span>
                                   </div>
                                   <p className="text-[11px] text-slate-400 mt-2 line-clamp-2 leading-relaxed">{scheme.objective}</p>
                                   
                                   {/* Action reference details */}
                                   <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] font-mono border-t border-slate-805/80 pt-2.5 text-slate-500">
                                     {scheme.helpline && (
                                       <span className="flex items-center gap-1">
                                         <PhoneCall className="w-3 h-3 text-amber-500 flex-shrink-0" />
                                         <span>Helpline: <strong className="text-slate-300 font-bold">{scheme.helpline}</strong></span>
                                       </span>
                                     )}
                                     {scheme.officialUrl && (
                                       <a
                                         href={scheme.officialUrl}
                                         target="_blank"
                                         rel="noopener noreferrer"
                                         referrerPolicy="no-referrer"
                                         className="flex items-center gap-1 text-sky-400 hover:text-[#52c1ff] hover:underline cursor-pointer"
                                       >
                                         <ExternalLink className="w-3 h-3 flex-shrink-0" />
                                         <span>Registry Link: <strong className="font-bold">Official Site</strong></span>
                                       </a>
                                     )}
                                   </div>
                                 </div>
                               );
                            })}
                          </div>
                        </div>
                      )}

                      {/* COMPONENT INTERACTIVE FOLLOW UP QUESTIONS CHIPS - REQUIREMENT #3 */}
                      {!isUser && msg.followUpQuestions && msg.followUpQuestions.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2.5 ml-1 select-none">
                          {msg.followUpQuestions.map((q, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleSendMessage(q)}
                              className="text-[11px] bg-[#0E1218] hover:bg-[#161B22] border border-slate-800 hover:border-amber-500/30 text-slate-300 hover:text-white rounded-full px-3.5 py-1 transition-all text-left truncate max-w-full cursor-pointer font-medium"
                            >
                              ✨ {q}
                            </button>
                          ))}
                        </div>
                      )}

                    </div>

                    {/* User Avatar tag */}
                    {isUser && (
                      <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center border border-slate-700 text-white flex-shrink-0">
                        <User className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Bot response generating spinner */}
              {isGenerating && (
                <div className="flex gap-3 max-w-full justify-start">
                  <div className="w-8 h-8 rounded-lg bg-[#0D1117] flex items-center justify-center border border-slate-800 text-amber-500 flex-shrink-0">
                    <Bot className="w-4 h-4 text-[#FF9933] animate-bounce" />
                  </div>
                  <div className="flex flex-col gap-1 max-w-[75%]">
                    <div className="text-[9px] font-mono text-slate-500">
                      Sashakt Core • Conducting handshake...
                    </div>
                    <div className="bg-[#0D1117] border border-slate-800 text-slate-400 p-4 rounded-xl rounded-tl-none flex items-center gap-3">
                      <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-xs font-mono tracking-widest text-[#FF9933] uppercase font-bold">Formulating secure response...</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Ref to scroller */}
              <div ref={messagesEndRef} />
            </div>

            {/* CHAT INPUT PANEL CONSOLE */}
            <div className="p-4 border-t border-slate-800 bg-[#0D1117] shrink-0">
              
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="relative flex items-center"
              >
                <div className="flex-1 relative flex items-center bg-slate-900 rounded-xl border border-slate-800 focus-within:border-amber-500/80 transition-all shadow-md pl-3 pr-2">
                  <Compass className="w-4 h-4 text-slate-500 flex-shrink-0" />
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Ask about grants on e-ANUDAAN, loans via PM-SURAJ, scholarships, elderline, manual scavenging..."
                    className="w-full bg-transparent text-xs sm:text-[13px] text-slate-200 py-3.5 px-3 focus:outline-none placeholder:text-slate-500"
                    disabled={isGenerating}
                  />
                  
                  {inputText && (
                    <button
                      type="button"
                      onClick={() => setInputText("")}
                      className="text-slate-500 hover:text-slate-300 p-1.5"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isGenerating || !inputText.trim()}
                    className={`
                      p-2 rounded-lg text-white font-semibold transition-all flex items-center justify-center
                      ${isGenerating || !inputText.trim()
                        ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                        : "bg-gradient-to-r from-amber-600 to-[#128807] hover:from-amber-500 hover:to-emerald-500 cursor-pointer shadow-md hover:scale-105"
                      }
                    `}
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </form>

              {/* Status footer inside console */}
              <div className="mt-2.5 flex flex-wrap items-center justify-between text-[10px] font-mono text-slate-500 px-1">
                <span>🔒 Secure End-to-End Handshake Compliant</span>
                <span>Powered by @google/genai & gemini-3.1-flash-lite</span>
              </div>
            </div>

          </main>

          {/* RIGHT COLUMN: MoSJE Official Schemes Directory Board */}
          <section className="w-full md:w-80 lg:w-[360px] flex flex-col overflow-hidden bg-[#0D1117] border-l border-[#1B222C]/40 z-10 shrink-0">
            
            {/* Header with quick search */}
            <div className="p-5 border-b border-slate-800 space-y-3 shrink-0">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-emerald-500" />
                <h2 className="text-xs font-bold uppercase tracking-widest text-[#FF9933] font-mono">Ministry Schemes</h2>
              </div>
              
              {/* Search Bar */}
              <div className="relative flex items-center bg-[#161B22] border border-slate-850 focus-within:border-emerald-500/30 rounded-xl text-xs leading-none">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3.5 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter 16 schemes..."
                  className="w-full bg-transparent text-xs py-3 pl-9 pr-4 focus:outline-none text-slate-200 placeholder:text-slate-505 font-medium"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery("")} className="absolute right-3.5 p-0.5 text-slate-500 hover:text-slate-205">
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Category selection scroll bar */}
            <div className="px-4 py-2 border-b border-slate-800 bg-[#0D1117]/80 shrink-0 flex items-center overflow-x-auto gap-1 text-[11px] font-medium scrollbar-none select-none">
              {categories.map((cat) => {
                const isActive = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`
                      px-2.5 py-1 rounded-full whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5
                      ${isActive 
                        ? "bg-[#161B22] text-amber-500 border border-amber-500/20 shadow-sm font-semibold" 
                        : "text-slate-400 hover:text-slate-205 hover:bg-[#161B22]/40"
                      }
                    `}
                  >
                    <span>{cat}</span>
                    <span className="text-[9px] font-mono bg-[#0D1117] px-1 rounded text-slate-500">
                      {getCategoryCount(cat)}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* SCHEME CARDS GRID LIST */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar bg-[#0A0C10]">
              
              <div className="flex items-center justify-between text-[9px] font-mono text-slate-500 mb-1 select-none">
                <span>FOUND {filteredSchemes.length} REGISTERED SCHEMES</span>
                <span>INQUIRY GUIDE</span>
              </div>

              <AnimatePresence>
                {filteredSchemes.map((scheme) => (
                  <motion.div
                    key={scheme.id}
                    layoutId={`scheme_card_${scheme.id}`}
                    onClick={() => setFocusedScheme(scheme)}
                    className="
                      bg-[#161B22]/60 hover:bg-[#161B22] border border-slate-800/80 hover:border-emerald-500/20 p-3.5 rounded-xl cursor-pointer transition-all hover:shadow-lg group shadow-sm relative overflow-hidden flex flex-col justify-between
                    "
                    whileHover={{ scale: 1.01 }}
                  >
                    <div className="flex items-start justify-between gap-1 select-none">
                      {/* Short code banner */}
                      <span className="text-[9px] font-mono uppercase bg-[#0D1117] text-slate-400 border border-slate-800 px-1.5 py-0.5 rounded font-bold tracking-wider group-hover:text-amber-400">
                        {scheme.shortCode}
                      </span>
                      {/* Category Flag badge */}
                      <span className="text-[8px] uppercase tracking-wider font-bold text-slate-500 font-mono bg-[#0D1117] px-1.5 py-0.5 rounded border border-slate-800">
                        {scheme.category}
                      </span>
                    </div>

                    <div className="mt-2.5">
                      <h4 className="text-xs font-bold text-white leading-tight group-hover:text-emerald-400 transition-colors">{scheme.name}</h4>
                      <p className="text-[9px] italic text-slate-550 mt-1 font-sans">{scheme.hindiName}</p>
                      <p className="text-[11px] text-slate-400 mt-2 line-clamp-2 leading-relaxed">{scheme.objective}</p>
                    </div>

                    {/* Reference Questions Box - Click to auto query */}
                    <div className="mt-3.5 pt-2.5 border-t border-slate-850/80">
                      <p className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1 select-none">
                        <span>💡 Suggested Inquiries</span>
                      </p>
                      <div className="mt-1.5 space-y-1">
                        {scheme.referenceQuestions.slice(0, 1).map((q, qidx) => (
                          <div
                            key={qidx}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSendMessage(q);
                            }}
                            className="bg-[#0D1117] hover:bg-[#161B22] hover:text-amber-400 hover:border-amber-500/20 text-slate-400 text-[11px] leading-snug py-1.5 px-2.5 rounded border border-slate-800 hover:scale-[1.01] transition-all flex items-center justify-between gap-1 cursor-pointer"
                          >
                            <span className="truncate">{q}</span>
                            <ChevronRight className="w-3 h-3 text-slate-500 shrink-0" />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-3.5 flex items-center justify-end text-[10px] font-bold font-mono text-amber-500 group-hover:underline">
                      <span>View Specifications →</span>
                    </div>
                  </motion.div>
                ))}

                {filteredSchemes.length === 0 && (
                  <div className="text-center py-12 px-4 rounded-xl border border-dashed border-slate-800 text-slate-600 font-sans">
                    <Compass className="w-8 h-8 text-slate-600 mx-auto mb-2 animate-spin-slow" />
                    <p className="text-xs font-semibold">No schemes match your inquiry.</p>
                    <p className="text-[10px] mt-1 text-slate-600 font-mono">MOD_FILTER_EMPTY</p>
                  </div>
                )}
              </AnimatePresence>
            </div>

          </section>

        </div>

      {/* COMPREHENSIVE FOCUSED SCHEME DETAIL DRAWER / MODAL CONTAINER */}
      <AnimatePresence>
        {focusedScheme && (
          <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-sm">
            
            {/* Modal Backdrop closer click */}
            <div className="absolute inset-0 cursor-zoom-out" onClick={() => setFocusedScheme(null)} />

             <motion.div 
              className="relative w-full max-w-xl bg-[#0D1117] h-full border-l border-slate-800 shadow-2xl flex flex-col justify-between"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 180 }}
            >
              {/* Header */}
              <div className="p-5 border-b border-slate-800 bg-[#0A0C10] flex items-center justify-between">
                <div className="flex items-center gap-2 select-none">
                  <span className="text-xs font-mono uppercase bg-[#161B22] text-amber-500 border border-slate-800 px-2.5 py-0.5 rounded font-bold tracking-widest leading-none">
                    {focusedScheme.shortCode}
                  </span>
                  <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-slate-500 bg-[#161B22] px-2 py-0.5 rounded border border-slate-800 leading-none">
                    {focusedScheme.category}
                  </span>
                </div>
                <button
                  onClick={() => setFocusedScheme(null)}
                  className="p-1.5 rounded-lg bg-[#161B22] hover:bg-slate-800 border border-slate-805 text-slate-400 hover:text-white transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Specification Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-gradient-to-b from-[#0A0C10] to-[#0D1117]">
                
                {/* Titles */}
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white tracking-tight leading-tight">{focusedScheme.name}</h3>
                  <p className="text-xs sm:text-sm italic text-amber-505 mt-1 font-sans">{focusedScheme.hindiName}</p>
                </div>

                {/* Section: Objective */}
                <div className="space-y-1.5 p-4 rounded-xl bg-[#161B22]/50 border border-slate-850">
                  <h4 className="text-[9px] font-mono font-bold text-[#FF9933] uppercase tracking-wider">1. Official Scheme Objective</h4>
                  <p className="text-xs sm:text-[13px] text-slate-300 leading-relaxed font-sans">{focusedScheme.objective}</p>
                </div>

                {/* Section: Benefits */}
                <div className="space-y-1.5 p-4 rounded-xl bg-[#161B22]/50 border border-slate-850">
                  <h4 className="text-[9px] font-mono font-bold text-emerald-400 uppercase tracking-wider">2. Services & Benefits Offered</h4>
                  <p className="text-xs sm:text-[13px] text-slate-300 leading-relaxed font-sans">{focusedScheme.benefits}</p>
                </div>

                {/* Section: Eligibility */}
                <div className="space-y-1.5 p-4 rounded-xl bg-[#161B22]/50 border border-slate-850">
                  <h4 className="text-[9px] font-mono font-bold text-sky-400 uppercase tracking-wider">3. Qualified Target Group & Eligibility</h4>
                  <p className="text-xs sm:text-[13px] text-slate-300 leading-relaxed font-sans">{focusedScheme.eligibility}</p>
                </div>

                {/* Section: Direct Scheme Queries Chips */}
                <div className="space-y-2">
                  <h4 className="text-[9px] font-mono font-bold text-slate-505 uppercase tracking-wider">4. Consultative Common Questions</h4>
                  <div className="grid grid-cols-1 gap-2">
                    {focusedScheme.referenceQuestions.map((q, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          setFocusedScheme(null);
                          handleSendMessage(q);
                        }}
                        className="p-3 bg-[#161B22] hover:bg-slate-800 border border-slate-805 hover:border-amber-500/20 text-left rounded-xl text-xs leading-relaxed text-slate-300 hover:text-white transition-all cursor-pointer flex items-center justify-between gap-2"
                      >
                        <span>{q}</span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>

              </div>

              {/* Action Registry Footer Footer links */}
              <div className="p-5 border-t border-slate-800 bg-[#0A0C10] space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-mono text-xs">
                  
                  {/* Web registration launch */}
                  <div>
                    <span className="text-slate-505 text-[8px] block uppercase tracking-wider font-bold">Registry Action Portal</span>
                    <a
                      href={focusedScheme.officialUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      referrerPolicy="no-referrer"
                      className="inline-flex items-center gap-1 text-sky-400 hover:text-[#52c1ff] font-bold mt-1 text-xs cursor-pointer"
                    >
                      <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
                      Visit Registry Webpage
                    </a>
                  </div>

                  {/* Telephone Helpline */}
                  <div>
                    <span className="text-slate-505 text-[8px] block uppercase tracking-wider font-bold">Toll-Free Helpdesk Contacts</span>
                    <span className="inline-flex items-center gap-1 text-slate-300 font-bold mt-1 text-xs whitespace-nowrap">
                      <PhoneCall className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                      {focusedScheme.helpline}
                    </span>
                  </div>

                </div>

                <button
                  onClick={() => {
                    const q = `Provide me a systematic breakdown of the requirements, application procedure, and guidelines for the ${focusedScheme.shortCode} scheme.`;
                    setFocusedScheme(null);
                    handleSendMessage(q);
                  }}
                  className="w-full py-3 bg-gradient-to-r from-orange-500 to-emerald-600 hover:from-orange-400 hover:to-emerald-500 text-white font-sans font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <Bot className="w-4 h-4" />
                  Initiate Systematic AI Inquiry
                </button>
              </div>

            </motion.div>

          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
