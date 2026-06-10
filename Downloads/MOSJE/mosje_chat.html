import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, Bot, User, Trash2, Download, Upload, 
  Menu, X, Sparkles, Link as LinkIcon, Info, 
  MessageSquare, History, PlusCircle, Volume2, Loader2, UserCheck
} from 'lucide-react';

// --- Configuration & Constants ---
const apiKey = ""; // API key is provided by the execution environment

const SYSTEM_PROMPT = `You are "MoSJE AI", an official, futuristic, and highly intelligent virtual assistant for the Ministry of Social Justice & Empowerment (MoSJE), Government of India. 
Your primary purpose is to assist users with accurate, detailed, and helpful information regarding MoSJE schemes and initiatives.

You must be an expert on the following schemes:
- e-ANUDAAN (NGO GIA Proposal System)
- Nasha Mukt Bharat Abhiyaan (NMBA)
- Pradhan Mantri Anushuchit Jaati Abhyuday Yojana (PM-AJAY)
- Ageing with Dignity (Senior Citizens Welfare)
- National Overseas Scholarship Scheme
- Smile- Beggary Portal
- National Portal For Transgender Persons
- Post Matric Scholarship for SC students (National Scholarship Portal)
- Pradhan Mantri Dakshta Aur Kushalta Sampann Hitgrahi Yojana (PM DAKSH)
- National Helpdesk for Prevention of Atrocities (POA)
- Development Action Plan for Scheduled Castes
- Drug Abuse Monitoring System (DAMS)
- National Action for Mechanised Sanitation Ecosystem (NAMASTE)
- National Helpline for Senior Citizens (NHSC)
- Training for Augmenting Productivity and Services (TAPAS)
- PM-SURAJ

Guidelines:
1. Always be professional, polite, and empathetic.
2. Provide structured answers (use bullet points, bold text for key terms).
3. If asked about something unrelated to MoSJE or social justice, politely decline and redirect the user to MoSJE-related topics.
4. Keep your responses concise but informative. If a user asks for eligibility or benefits, list them clearly.
5. You have access to Google Search. Use it to verify the latest guidelines and portal links.`;

const SUGGESTED_QUESTIONS = [
  "What is the eligibility for PM-DAKSH?",
  "How to apply for NGO funding via e-ANUDAAN?",
  "Tell me about the Nasha Mukt Bharat Abhiyaan.",
  "What are the benefits under PM-AJAY?",
  "Details on the SMILE scheme for Transgender persons?"
];

// --- Utility Functions ---
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const fetchWithRetry = async (url, options, maxRetries = 5) => {
  let retries = 0;
  while (retries < maxRetries) {
    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      retries++;
      if (retries >= maxRetries) throw error;
      const backoffTime = Math.pow(2, retries - 1) * 1000;
      await delay(backoffTime);
    }
  }
};

// --- Audio Utility Functions for PCM to WAV ---
const writeString = (view, offset, string) => {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
};

const createWavFile = (pcmData, sampleRate) => {
  const buffer = new ArrayBuffer(44 + pcmData.length);
  const view = new DataView(buffer);
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + pcmData.length, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(view, 36, 'data');
  view.setUint32(40, pcmData.length, true);
  
  const pcm16 = new Int16Array(buffer, 44);
  const pcmData16 = new Int16Array(pcmData.buffer, pcmData.byteOffset, pcmData.byteLength / 2);
  for (let i = 0; i < pcmData16.length; i++) {
    pcm16[i] = pcmData16[i];
  }
  return new Blob([buffer], { type: 'audio/wav' });
};

// Simple text formatter for bold, italics, and basic line breaks
const formatText = (text) => {
  if (!text) return null;
  
  // Split by double newlines for paragraphs
  const paragraphs = text.split(/\n\n+/);
  
  return paragraphs.map((paragraph, pIdx) => {
    // Split by single newlines for line breaks within a paragraph
    const lines = paragraph.split('\n');
    
    return (
      <p key={pIdx} className="mb-4 text-sm md:text-base leading-relaxed text-slate-200">
        {lines.map((line, lIdx) => {
          // Parse bold (**text**)
          const parts = line.split(/(\*\*.*?\*\*)/g);
          
          return (
            <React.Fragment key={lIdx}>
              {parts.map((part, i) => {
                if (part.startsWith('**') && part.endsWith('**')) {
                  return <strong key={i} className="text-cyan-300 font-semibold">{part.slice(2, -2)}</strong>;
                }
                // Parse italics (*text*)
                const italicParts = part.split(/(\*.*?\*)/g);
                return italicParts.map((ip, j) => {
                  if (ip.startsWith('*') && ip.endsWith('*')) {
                    return <em key={j} className="text-slate-300 italic">{ip.slice(1, -1)}</em>;
                  }
                  return <span key={j}>{ip}</span>;
                });
              })}
              {lIdx < lines.length - 1 && <br />}
            </React.Fragment>
          );
        })}
      </p>
    );
  });
};

// --- Main Component ---
export default function MoSJEChatbot() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [error, setError] = useState(null);
  
  // New State for LLM Features
  const [audioLoading, setAudioLoading] = useState(null);
  const [matcherOpen, setMatcherOpen] = useState(false);
  const [matcherProfile, setMatcherProfile] = useState({ age: '', category: '', income: '', other: '' });
  const [matcherResults, setMatcherResults] = useState(null);
  const [matcherLoading, setMatcherLoading] = useState(false);
  
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Auto-scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Load from local storage on mount (simple persistence alongside manual export/import)
  useEffect(() => {
    const saved = localStorage.getItem('mosje_chat_history');
    if (saved) {
      try {
        setMessages(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse local history");
      }
    }
  }, []);

  // Save to local storage on changes
  useEffect(() => {
    localStorage.setItem('mosje_chat_history', JSON.stringify(messages));
  }, [messages]);

  const handleSend = async (textToProcess = input) => {
    const trimmedText = textToProcess.trim();
    if (!trimmedText || isLoading) return;

    const newUserMsg = { role: 'user', text: trimmedText, timestamp: new Date().toISOString() };
    const updatedMessages = [...messages, newUserMsg];
    setMessages(updatedMessages);
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      // Format history for Gemini API
      const formattedHistory = updatedMessages.map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.text }]
      }));

      const payload = {
        contents: formattedHistory,
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        tools: [{ google_search: {} }] // Enable Grounding
      };

      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
      
      const result = await fetchWithRetry(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const candidate = result.candidates?.[0];
      const responseText = candidate?.content?.parts?.[0]?.text || "I'm sorry, I couldn't generate a response at this time.";
      
      // Extract grounding metadata (References)
      let sources = [];
      const attributions = candidate?.groundingMetadata?.groundingAttributions;
      if (attributions) {
        // Filter out duplicate URIs
        const uniqueSources = new Map();
        attributions.forEach(a => {
          if (a.web?.uri && a.web?.title) {
            uniqueSources.set(a.web.uri, a.web.title);
          }
        });
        sources = Array.from(uniqueSources, ([uri, title]) => ({ uri, title }));
      }

      const newModelMsg = { 
        role: 'model', 
        text: responseText, 
        sources: sources,
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, newModelMsg]);

    } catch (err) {
      console.error(err);
      setError("Communication array disconnected. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(messages, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `mosje_chat_session_${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const handleImport = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedMessages = JSON.parse(e.target.result);
        if (Array.isArray(importedMessages)) {
          setMessages(importedMessages);
          setIsSidebarOpen(false); // Close sidebar on mobile after import
        } else {
          alert("Invalid file format.");
        }
      } catch (err) {
        alert("Error parsing JSON file.");
      }
    };
    reader.readAsText(file);
    // Reset file input
    event.target.value = null;
  };

  const clearChat = () => {
    if(window.confirm("Are you sure you want to clear the current chat?")) {
      setMessages([]);
      localStorage.removeItem('mosje_chat_history');
    }
  };

  // --- New Gemini LLM Feature: Text-to-Speech ---
  const handleTTS = async (text, msgIndex) => {
    if (audioLoading) return;
    setAudioLoading(msgIndex);
    try {
      // Clean markdown from text for better speech
      const cleanText = text.replace(/\*\*/g, '').replace(/\*/g, '').replace(/#/g, '');
      const payload = {
        contents: [{ parts: [{ text: cleanText }] }],
        generationConfig: {
          responseModalities: ["AUDIO"],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: "Aoede" } } }
        },
        model: "gemini-2.5-flash-preview-tts"
      };
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${apiKey}`;
      const response = await fetchWithRetry(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      
      if (!response.candidates?.[0]?.content?.parts?.[0]?.inlineData) throw new Error("No audio data returned");
      
      const inlineData = response.candidates[0].content.parts[0].inlineData;
      const base64Audio = inlineData.data;
      const mimeType = inlineData.mimeType;
      
      const binaryString = atob(base64Audio);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
      }
      
      const rateMatch = mimeType.match(/rate=(\d+)/);
      const sampleRate = rateMatch ? parseInt(rateMatch[1], 10) : 24000;
      
      const wavBlob = createWavFile(bytes, sampleRate);
      const audioUrl = URL.createObjectURL(wavBlob);
      const audio = new Audio(audioUrl);
      audio.play();
    } catch (err) {
      console.error("TTS Error:", err);
      alert("Could not generate audio. Please try again.");
    } finally {
      setAudioLoading(null);
    }
  };

  // --- New Gemini LLM Feature: Eligibility Matcher ---
  const runSchemeMatcher = async () => {
    if (!matcherProfile.age || !matcherProfile.category) return;
    setMatcherLoading(true);
    setMatcherResults(null);
    try {
      const prompt = `Based on this citizen profile, list the top MoSJE schemes they might be eligible for. 
      Profile: Age ${matcherProfile.age}, Category: ${matcherProfile.category}, Income: ${matcherProfile.income}, Other: ${matcherProfile.other}.
      Provide a concise, bulleted list with scheme names in bold and a 1-sentence reason for the match. Do not invent schemes.`;

      const payload = {
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        systemInstruction: { parts: [{ text: "You are an expert MoSJE eligibility analyzer. Only suggest valid MoSJE schemes." }] }
      };
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
      
      const result = await fetchWithRetry(url, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(payload) 
      });
      
      setMatcherResults(result.candidates[0].content.parts[0].text);
    } catch (e) {
      console.error(e);
      setMatcherResults("Failed to analyze eligibility. Please try again later.");
    }
    setMatcherLoading(false);
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 font-sans overflow-hidden selection:bg-cyan-500/30">
      
      {/* Background Effects */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-900/20 blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-cyan-900/20 blur-[120px]"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsIDI1NSwgMjU1LCAwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-50"></div>
      </div>

      {/* --- Sidebar --- */}
      <div className={`fixed inset-y-0 left-0 z-40 w-72 bg-slate-900/80 backdrop-blur-xl border-r border-slate-800 transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 flex flex-col`}>
        
        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.5)]">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">MoSJE AI</span>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden p-2 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <button 
            onClick={clearChat}
            className="w-full flex items-center gap-3 px-4 py-3 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 rounded-xl border border-cyan-500/30 transition-all duration-200 group"
          >
            <PlusCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span className="font-medium">New Session</span>
          </button>

          <div className="pt-4">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 px-2 flex items-center gap-2">
              <History className="w-4 h-4" /> Session Management
            </h3>
            <div className="space-y-2">
              <button 
                onClick={handleExport}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-slate-300 hover:text-white hover:bg-slate-800/80 rounded-lg transition-colors text-sm"
              >
                <Download className="w-4 h-4" /> Export Chat (JSON)
              </button>
              
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-slate-300 hover:text-white hover:bg-slate-800/80 rounded-lg transition-colors text-sm"
              >
                <Upload className="w-4 h-4" /> Import Chat (JSON)
              </button>
              <input 
                type="file" 
                accept=".json" 
                ref={fileInputRef} 
                onChange={handleImport} 
                className="hidden" 
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 px-2 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" /> AI Tools
            </h3>
            <button 
              onClick={() => { setIsSidebarOpen(false); setMatcherOpen(true); }}
              className="w-full flex items-center gap-3 px-4 py-3 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 rounded-xl border border-purple-500/30 transition-all duration-200"
            >
              <UserCheck className="w-5 h-5" />
              <span className="font-medium text-sm">✨ Scheme Matcher</span>
            </button>
          </div>
        </div>

        <div className="p-4 border-t border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <Info className="w-4 h-4" />
            <p>Official Assistant for Govt. Schemes.<br/>Data generated via AI.</p>
          </div>
        </div>
      </div>

      {/* Overlay for mobile sidebar */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* --- Main Chat Area --- */}
      <div className="flex-1 flex flex-col relative z-10 h-full">
        
        {/* Header */}
        <header className="h-16 flex items-center justify-between px-4 sm:px-6 bg-slate-900/60 backdrop-blur-md border-b border-slate-800 sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-2 -ml-2 text-slate-400 hover:text-white">
              <Menu className="w-6 h-6" />
            </button>
            <div>
              <h1 className="font-semibold text-slate-100 hidden sm:block">Ministry of Social Justice & Empowerment</h1>
              <p className="text-xs text-cyan-400 font-medium">Citizen Information Portal</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse"></div>
            <span className="text-xs text-slate-400 font-medium hidden sm:inline">System Online</span>
          </div>
        </header>

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 scroll-smooth">
          <div className="max-w-4xl mx-auto space-y-6">
            
            {/* Empty State / Suggestions */}
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 animate-in fade-in duration-700 slide-in-from-bottom-8">
                <div className="w-20 h-20 mb-6 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 flex items-center justify-center shadow-[0_0_30px_rgba(6,182,212,0.15)]">
                  <Bot className="w-10 h-10 text-cyan-400" />
                </div>
                <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 tracking-tight">How can I assist you today?</h2>
                <p className="text-slate-400 max-w-lg mb-10 text-sm sm:text-base">
                  Ask me anything about MoSJE schemes including PM-DAKSH, SMILE, PM-AJAY, NMBA, and more.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-2xl text-left">
                  {SUGGESTED_QUESTIONS.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => handleSend(q)}
                      className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-800/80 transition-all duration-300 flex items-start gap-3 group"
                    >
                      <MessageSquare className="w-5 h-5 text-cyan-500 mt-0.5 opacity-70 group-hover:opacity-100" />
                      <span className="text-sm text-slate-300 group-hover:text-white transition-colors">{q}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Chat Messages */}
            {messages.map((msg, index) => (
              <div key={index} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2`}>
                
                {msg.role === 'model' && (
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-cyan-600 to-blue-700 flex items-center justify-center flex-shrink-0 shadow-[0_0_10px_rgba(6,182,212,0.3)] border border-cyan-400/30">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                )}

                <div className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 sm:p-5 relative ${
                  msg.role === 'user' 
                    ? 'bg-gradient-to-br from-blue-600/90 to-cyan-700/90 text-white rounded-tr-sm shadow-lg' 
                    : 'bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-tl-sm text-slate-200 shadow-xl'
                }`}>
                  
                  {/* Message Content */}
                  <div className="prose prose-invert max-w-none">
                    {msg.role === 'user' ? (
                      <p className="text-sm md:text-base leading-relaxed m-0">{msg.text}</p>
                    ) : (
                      formatText(msg.text)
                    )}
                  </div>

                  {/* AI Actions */}
                  {msg.role === 'model' && (
                    <div className="mt-4 flex items-center gap-2">
                      <button
                        onClick={() => handleTTS(msg.text, index)}
                        disabled={audioLoading === index}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-cyan-300 transition-colors border border-slate-700 hover:border-cyan-500/50 disabled:opacity-50"
                      >
                        {audioLoading === index ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Volume2 className="w-3.5 h-3.5" />}
                        ✨ Listen
                      </button>
                    </div>
                  )}

                  {/* Sources/References Block */}
                  {msg.role === 'model' && msg.sources && msg.sources.length > 0 && (
                    <div className="mt-5 pt-4 border-t border-slate-700/50">
                      <div className="flex items-center gap-2 mb-2 text-cyan-400/80">
                        <LinkIcon className="w-4 h-4" />
                        <span className="text-xs font-semibold uppercase tracking-wider">Verified Sources</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {msg.sources.map((source, idx) => (
                          <a 
                            key={idx} 
                            href={source.uri} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-950/50 border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-800 transition-all text-xs text-slate-300 hover:text-cyan-300 max-w-full truncate"
                            title={source.title}
                          >
                            <span className="truncate max-w-[200px]">{source.title || new URL(source.uri).hostname}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {msg.role === 'user' && (
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-slate-800 flex items-center justify-center flex-shrink-0 border border-slate-700">
                    <User className="w-5 h-5 text-slate-400" />
                  </div>
                )}
              </div>
            ))}

            {/* Error Message */}
            {error && (
              <div className="flex justify-center my-4">
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                  <Info className="w-4 h-4" />
                  {error}
                </div>
              </div>
            )}

            {/* Loading Indicator */}
            {isLoading && (
              <div className="flex gap-4 justify-start animate-in fade-in">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-cyan-600 to-blue-700 flex items-center justify-center flex-shrink-0 shadow-[0_0_15px_rgba(6,182,212,0.4)] border border-cyan-400/30">
                  <Bot className="w-5 h-5 text-white animate-pulse" />
                </div>
                <div className="bg-slate-900/80 backdrop-blur-md border border-cyan-500/30 rounded-2xl rounded-tl-sm p-5 flex items-center gap-2 shadow-[0_0_15px_rgba(6,182,212,0.1)]">
                  <div className="flex space-x-1.5">
                    <div className="w-2 h-2 rounded-full bg-cyan-500 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 rounded-full bg-cyan-500 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 rounded-full bg-cyan-500 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                  <span className="text-sm text-cyan-400 ml-2 font-medium">Accessing MoSJE Database...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} className="h-4" />
          </div>
        </div>

        {/* Input Area */}
        <div className="p-4 sm:p-6 bg-gradient-to-t from-slate-950 via-slate-950 to-transparent pt-10">
          <div className="max-w-4xl mx-auto relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-2xl blur opacity-20 group-focus-within:opacity-40 transition duration-500"></div>
            <div className="relative flex items-end gap-2 bg-slate-900 border border-slate-700 rounded-2xl p-2 focus-within:border-cyan-500/50 focus-within:ring-1 focus-within:ring-cyan-500/50 transition-all shadow-xl">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Ask about PM-DAKSH, e-ANUDAAN, or other schemes..."
                className="flex-1 max-h-32 min-h-[44px] bg-transparent text-white placeholder-slate-500 border-none focus:ring-0 resize-none py-3 px-4 text-sm sm:text-base scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent"
                rows="1"
              />
              <button
                onClick={() => handleSend()}
                disabled={isLoading || !input.trim()}
                className="p-3 mb-1 mr-1 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 disabled:text-slate-500 text-white transition-colors flex-shrink-0 flex items-center justify-center shadow-lg disabled:shadow-none"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
            <div className="text-center mt-3 text-xs text-slate-500">
              Information is generated by AI and grounded via Google Search. Verify critical details on <a href="https://socialjustice.gov.in/" target="_blank" rel="noreferrer" className="text-cyan-500/80 hover:text-cyan-400 hover:underline">socialjustice.gov.in</a>.
            </div>
          </div>
        </div>

      </div>

      {/* --- AI Scheme Matcher Modal --- */}
      {matcherOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-800/50">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-400" />
                <h2 className="font-semibold text-white">✨ AI Scheme Matcher</h2>
              </div>
              <button onClick={() => setMatcherOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              {!matcherResults && !matcherLoading ? (
                <div className="space-y-4">
                  <p className="text-sm text-slate-300 mb-4">Enter your details below, and our AI will analyze MoSJE schemes to find the best matches for your profile.</p>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Age</label>
                      <input type="number" placeholder="e.g. 65" value={matcherProfile.age} onChange={(e) => setMatcherProfile({...matcherProfile, age: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-purple-500 focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Social Category</label>
                      <select value={matcherProfile.category} onChange={(e) => setMatcherProfile({...matcherProfile, category: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-purple-500 focus:outline-none">
                        <option value="">Select...</option>
                        <option value="SC">Scheduled Caste (SC)</option>
                        <option value="OBC">Other Backward Class (OBC)</option>
                        <option value="Transgender">Transgender Person</option>
                        <option value="Senior Citizen">Senior Citizen</option>
                        <option value="General/Other">General / Other</option>
                      </select>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Annual Income (₹)</label>
                    <input type="text" placeholder="e.g. 2,00,000" value={matcherProfile.income} onChange={(e) => setMatcherProfile({...matcherProfile, income: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-purple-500 focus:outline-none" />
                  </div>
                  
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Other Details (Optional)</label>
                    <input type="text" placeholder="e.g. Student, NGO worker, Unemployed" value={matcherProfile.other} onChange={(e) => setMatcherProfile({...matcherProfile, other: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-purple-500 focus:outline-none" />
                  </div>

                  <button 
                    onClick={runSchemeMatcher}
                    disabled={!matcherProfile.age || !matcherProfile.category}
                    className="w-full mt-4 py-3 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-medium shadow-lg disabled:opacity-50 transition-all flex justify-center items-center gap-2"
                  >
                    <Sparkles className="w-4 h-4" /> Find Eligible Schemes
                  </button>
                </div>
              ) : matcherLoading ? (
                <div className="py-12 flex flex-col items-center justify-center text-center">
                  <div className="w-12 h-12 rounded-full border-4 border-slate-800 border-t-purple-500 animate-spin mb-4"></div>
                  <p className="text-purple-400 font-medium animate-pulse">Analyzing MoSJE databases...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/30 prose prose-invert max-w-none text-sm">
                    {formatText(matcherResults)}
                  </div>
                  <button 
                    onClick={() => { setMatcherResults(null); setMatcherProfile({ age: '', category: '', income: '', other: '' }); }}
                    className="w-full py-2.5 rounded-lg border border-slate-700 hover:bg-slate-800 text-white transition-all text-sm font-medium"
                  >
                    Check Another Profile
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}