import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI } from '@google/genai';

// --- DEFINICJE TRYBÓW ---

type ModeType = 'skript' | 'discord' | 'web' | 'plugin' | 'hosting';

const MODES: { id: ModeType; label: string; color: string; subOptions: string[] }[] = [
  { 
    id: 'skript', 
    label: 'SKRIPT MC', 
    color: 'qd-violet',
    subOptions: ['Podstawowy', 'GUI Manager', 'Ekonomia', 'System Walki', 'Chat Format', 'MiniGame']
  },
  { 
    id: 'discord', 
    label: 'BOT DISCORD', 
    color: 'blue-500',
    subOptions: ['Python (discord.py)', 'JS (discord.js)', 'Python (Nextcord)', 'TypeScript', 'Slash Commands', 'Muzyczny']
  },
  { 
    id: 'web', 
    label: 'STRONA WWW', 
    color: 'pink-500',
    subOptions: ['HTML/CSS (One File)', 'Tailwind CSS', 'React + Vite', 'Portfolio', 'Landing Page', 'Panel Admina']
  },
  { 
    id: 'plugin', 
    label: 'PLUGIN MC', 
    color: 'orange-500',
    subOptions: ['Paper API', 'Spigot', 'BungeeCord', 'Velocity', 'Baza Danych (MySQL)', 'NMS (Packets)']
  },
  {
    id: 'hosting',
    label: 'SYSTEM / HOSTING',
    color: 'green-500',
    subOptions: ['Pterodactyl Theme', 'Bash Install Script', 'Docker Compose', 'Nginx Config', 'Linux Security', 'MySQL Backup']
  }
];

// --- SYSTEM PROMPT ---
const SYSTEM_INSTRUCTION = `
Jesteś QD-STUDIO-AI. Potężnym, wielozadaniowym generatorem kodu.

### ZASADA NAJWAŻNIEJSZA - KOMPLETNOŚĆ (ZERO SKRÓTÓW):
Masz pisać **PEŁNE, DZIAŁAJĄCE APLIKACJE**. 
ZABRANIAM używania komentarzy typu: "// reszta kodu tutaj", "// powtórz dla innych komend", "// dodaj logikę".
Użytkownik ma skopiować kod, wkleić i uruchomić.

### INSTRUKCJE DLA AKTUALNEGO ZADANIA:

1. **BOT DISCORD:**
   - **INTENTY:** Zawsze definiuj \`intents.message_content = True\` (Python) lub \`GatewayIntentBits.MessageContent\` (JS).
   - **CZYSTY KOD:** Kod ma być konkretny.

2. **SKRIPT (Minecraft):**
   - **METADATA GUI:** Używaj WYŁĄCZNIE \`set metadata tag "id" of player to chest inventory\`.

3. **STRONA WWW:**
   - **JEDEN PLIK:** Cały CSS w <style>, JS w <script>.
   - **DESIGN:** Nowoczesny, responsywny, Ciemny Motyw (QD Style).

4. **SYSTEM / HOSTING:**
   - **BASH:** \`#!/bin/bash\` na początku, \`set -e\`.
   - **DOCKER:** compose 3.8+.

### OBRAZY (VISION):
Analizuj przesłane obrazy (błędy, designy, schematy) i generuj odpowiedni kod.

### STYL ODPOWIEDZI:
- **JĘZYK:** Polski.
- **KOD:** Czysty, profesjonalny, gotowy do użycia.
`;

// --- UI COMPONENTS ---

interface CodeBlockProps {
  code: string;
  language?: string;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ code, language = 'skript' }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-6 rounded-none border-l-2 border-white/20 bg-[#080808] relative group shadow-lg overflow-hidden">
      <div className="absolute -top-3 right-0 text-[10px] font-mono text-gray-500 bg-[#080808] px-2 border border-gray-800 uppercase z-10">
        {language}
      </div>
      <div className="p-4 overflow-x-auto code-font text-xs md:text-sm text-gray-300 leading-6 font-mono custom-scrollbar">
        <pre className="whitespace-pre-wrap">{code}</pre>
      </div>
      <button 
        onClick={handleCopy}
        className={`absolute bottom-2 right-2 text-[9px] font-bold px-3 py-1 uppercase tracking-widest transition-all z-20 ${
          copied 
            ? 'text-green-500 bg-green-500/10' 
            : 'text-gray-500 hover:text-white bg-white/5 hover:bg-white/10'
        }`}
      >
        {copied ? 'SKOPIOWANO' : 'KOPIUJ'}
      </button>
    </div>
  );
};

interface MessageItemProps {
  role: string;
  content: string;
  image?: string;
}

const MessageItem: React.FC<MessageItemProps> = ({ role, content, image }) => {
  const parts = content.split(/```/);
  
  return (
    <div className={`flex w-full ${role === 'user' ? 'justify-end' : 'justify-start'} mb-8 animate-fade-in`}>
      <div className={`relative max-w-[95%] md:max-w-[85%] p-6 border transition-all duration-300 shadow-xl ${
        role === 'user' 
          ? 'bg-white/5 border-white/10 text-right rounded-bl-xl' 
          : 'bg-black border-l-4 border-l-qd-violet border-y-0 border-r-0 pl-6 rounded-br-xl'
      }`}>
        
        <div className={`flex items-center gap-3 mb-2 ${role === 'user' ? 'justify-end' : 'justify-start'}`}>
          <span className={`text-[10px] font-mono tracking-[0.2em] uppercase ${
            role === 'user' ? 'text-gray-400' : 'text-qd-violet'
          }`}>
            {role === 'user' ? 'OPERATOR' : 'QD STUDIO AI'}
          </span>
        </div>

        {image && (
            <div className="mb-4 flex justify-end">
                <img src={image} alt="User upload" className="max-h-48 rounded border border-white/20" />
            </div>
        )}
        
        <div className="text-gray-300 leading-relaxed text-sm font-light">
          {parts.map((part, i) => {
            if (i % 2 === 1) {
              const lines = part.split('\n');
              const lang = lines[0].trim() || 'code';
              const code = lines.slice(1).join('\n');
              return <CodeBlock key={i} language={lang} code={code} />;
            }
            return <div key={i} className="whitespace-pre-wrap mb-4 last:mb-0">{part}</div>;
          })}
        </div>
      </div>
    </div>
  );
};

// --- API KEY MODAL ---
interface ApiKeyModalProps {
    onSave: (key: string) => void;
}

const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ onSave }) => {
    const [key, setKey] = useState('');

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
            <div className="w-full max-w-md bg-[#0a0a0a] border border-qd-violet/50 shadow-[0_0_50px_rgba(188,19,254,0.2)] p-8 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-qd-blue to-qd-pink"></div>
                <h2 className="text-xl font-bold text-white mb-2 tracking-widest">SYSTEM SECURITY</h2>
                <p className="text-gray-400 text-xs mb-6 font-mono">
                    Wymagana autoryzacja. Wprowadź klucz API Gemini.
                    <br/><span className="text-gray-600">Klucz zapisywany jest lokalnie w przeglądarce.</span>
                </p>
                
                <input 
                    type="password" 
                    value={key}
                    onChange={(e) => setKey(e.target.value)}
                    placeholder="Wklej klucz API tutaj..."
                    className="w-full bg-black border border-white/10 text-white p-3 text-sm font-mono focus:border-qd-violet outline-none transition-colors mb-4"
                />
                
                <button 
                    onClick={() => key.trim() && onSave(key)}
                    className="w-full bg-qd-violet/10 border border-qd-violet text-qd-violet hover:bg-qd-violet hover:text-white py-3 text-xs font-bold tracking-[0.2em] transition-all uppercase"
                >
                    AKTYWUJ SYSTEM
                </button>
                
                <div className="mt-4 text-center">
                    <a href="https://aistudio.google.com/app/apikey" target="_blank" className="text-[10px] text-gray-500 hover:text-gray-300 underline underline-offset-2">
                        Pobierz klucz API (Google AI Studio)
                    </a>
                </div>
            </div>
        </div>
    );
};

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

// --- MAIN APP ---

const App = () => {
  const [messages, setMessages] = useState<{role: string, content: string, image?: string}[]>([
    { role: 'model', content: "SYSTEM QD STUDIO AI [ONLINE].\nWybierz kategorię i technologię." }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  const [apiKey, setApiKey] = useState<string>('');
  const [showKeyModal, setShowKeyModal] = useState(false);

  const [activeModeId, setActiveModeId] = useState<ModeType>('skript');
  const [activeSubOption, setActiveSubOption] = useState<string>(MODES[0].subOptions[0]);

  const scrollEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Bezpieczne pobieranie klucza - brak process.env
    const envKey = (window as any).ENV?.API_KEY;
    const storedKey = localStorage.getItem('QD_GENAI_API_KEY');

    if (envKey && envKey.length > 5) {
        setApiKey(envKey);
    } else if (storedKey) {
        setApiKey(storedKey);
    } else {
        setShowKeyModal(true);
    }
  }, []);

  const handleSaveKey = (key: string) => {
      localStorage.setItem('QD_GENAI_API_KEY', key);
      setApiKey(key);
      setShowKeyModal(false);
  };

  const clearKey = () => {
      localStorage.removeItem('QD_GENAI_API_KEY');
      setApiKey('');
      setShowKeyModal(true);
  }

  useEffect(() => {
    const mode = MODES.find(m => m.id === activeModeId);
    if (mode) {
      setActiveSubOption(mode.subOptions[0]);
    }
  }, [activeModeId]);

  useEffect(() => {
    scrollEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        setSelectedImage(file);
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const generateResponse = async (promptText: string) => {
    if (!promptText.trim() && !selectedImage) return;

    const userMsg = { 
        role: 'user', 
        content: promptText, 
        image: previewUrl || undefined 
    };
    const newMessages = [...messages, userMsg];
    
    setMessages(newMessages);
    setIsLoading(true);
    setInput('');
    const imageToSend = selectedImage;
    removeImage();

    try {
      if (!apiKey) throw new Error("BRAK KLUCZA API.");

      const ai = new GoogleGenAI({ apiKey });
      
      const history = newMessages.slice(0, -1).map(m => ({
        role: m.role,
        parts: [{ text: m.content }]
      }));

      const activeMode = MODES.find(m => m.id === activeModeId)!;
      
      const finalPromptText = `
      KONFIGURACJA ZADANIA:
      - TRYB GŁÓWNY: ${activeMode.label}
      - TECHNOLOGIA/TYP: ${activeSubOption}
      
      TREŚĆ ZADANIA UŻYTKOWNIKA: 
      ${promptText}
      `;

      let contentsParts: any[] = [{ text: finalPromptText }];

      if (imageToSend) {
        const base64Data = await fileToBase64(imageToSend);
        const base64String = base64Data.split(',')[1];
        
        contentsParts.unshift({
            inlineData: {
                mimeType: imageToSend.type,
                data: base64String
            }
        });
      }

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: [...history, { role: 'user', parts: contentsParts }],
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          temperature: 0.3, 
        }
      });

      const text = response.text;
      setMessages(prev => [...prev, { role: 'model', content: text }]);

    } catch (err: any) {
      setMessages(prev => [...prev, { role: 'model', content: `BŁĄD: ${err.message}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = () => {
    generateResponse(input);
  };

  const handleNewChat = () => {
    setMessages([
        { role: 'model', content: "SESJA ZRESETOWANA.\nGotowość do nowego zadania." }
    ]);
    setInput('');
    removeImage();
    setIsLoading(false);
  };

  const activeModeData = MODES.find(m => m.id === activeModeId)!;

  return (
    <div className="flex h-screen w-full bg-[#050505] text-white font-sans overflow-hidden relative selection:bg-white/20">
      
      {showKeyModal && <ApiKeyModal onSave={handleSaveKey} />}

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(20,20,20,1),_#000000)] pointer-events-none"></div>
      
      {/* SIDEBAR */}
      <div className="w-64 hidden md:flex flex-col border-r border-white/5 bg-black/90 z-20">
        <div className="p-6 border-b border-white/5">
          <h1 className="text-2xl font-bold tracking-tighter text-white">
            QD STUDIO <span className="text-qd-violet">AI</span>
          </h1>
          <div className="text-[8px] font-mono text-gray-500 mt-1 tracking-[0.2em] uppercase">V 3.1 VISION</div>
        </div>
        
        <div className="p-4">
            <button 
                onClick={handleNewChat}
                className="w-full py-3 border border-dashed border-white/20 hover:border-qd-violet hover:text-qd-violet hover:bg-qd-violet/5 transition-all text-[10px] font-bold tracking-[0.2em] flex items-center justify-center gap-2 text-gray-400"
            >
                <span className="text-lg leading-none">+</span> NOWA SESJA
            </button>
        </div>

        <div className="p-6 text-gray-500 text-xs font-light leading-relaxed space-y-4">
            <div>
              <strong className="text-white block mb-1">AKTUALNY SILNIK:</strong>
              <span className={`text-${activeModeData.color} font-mono`}>{activeModeData.label}</span>
            </div>
            <div>
              <strong className="text-white block mb-1">TECHNOLOGIA:</strong>
              <span className="font-mono text-gray-400">{activeSubOption}</span>
            </div>
        </div>

        <div className="mt-auto p-6">
            <button onClick={clearKey} className="text-[9px] text-gray-600 hover:text-white transition-colors uppercase font-mono mb-2 w-full text-left">
                [ ZMIEŃ KLUCZ API ]
            </button>
            <div className="text-[9px] text-red-500/50 font-mono text-center border-t border-white/5 pt-2">
                QD-STUDIO-AI
            </div>
        </div>
      </div>

      {/* MAIN CHAT */}
      <div className="flex-1 flex flex-col relative z-10">
        
        <div className="absolute top-4 right-4 z-50">
            <button 
                onClick={handleNewChat}
                className="bg-black/80 backdrop-blur-md border border-white/10 hover:border-red-500/50 hover:text-red-500 text-gray-500 px-4 py-2 text-[9px] font-bold tracking-widest uppercase transition-all shadow-lg"
            >
                [ RESET SESJI ]
            </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-12 custom-scrollbar scroll-smooth">
          <div className="max-w-5xl mx-auto pb-80 pt-10">
            {messages.map((m, i) => (
              <MessageItem key={i} role={m.role} content={m.content} image={m.image} />
            ))}
            
            {isLoading && (
              <div className="flex justify-start w-full pl-0">
                 <div className="flex items-center gap-3 px-6 py-4 bg-white/5 border border-white/10 rounded-r-xl">
                    <div className="w-1.5 h-1.5 bg-white animate-pulse"></div>
                    <span className="text-[10px] font-mono text-gray-400 tracking-widest">
                        ANALIZA DANYCH ({activeModeData.label})...
                    </span>
                 </div>
              </div>
            )}
            <div ref={scrollEndRef} />
          </div>
        </div>

        {/* CONTROLS */}
        <div className="absolute bottom-0 left-0 right-0 z-30 bg-gradient-to-t from-black via-black to-transparent pt-10 pb-6 px-4 md:px-12">
          <div className="max-w-5xl mx-auto flex flex-col gap-3">
            
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                {MODES.map(mode => {
                    const isActive = activeModeId === mode.id;
                    return (
                        <button 
                            key={mode.id}
                            onClick={() => setActiveModeId(mode.id)}
                            className={`
                                py-3 px-2 border text-[10px] md:text-xs font-bold tracking-widest uppercase transition-all duration-200
                                flex items-center justify-center gap-2 relative overflow-hidden group
                                ${isActive 
                                    ? `border-${mode.color} text-white bg-${mode.color}/10 shadow-[0_0_15px_rgba(0,0,0,0.5)]` 
                                    : 'bg-black/80 border-white/10 text-gray-500 hover:border-white/30 hover:text-gray-300'
                                }
                            `}
                        >   
                            {isActive && <div className={`absolute inset-0 bg-${mode.color} opacity-10`}></div>}
                            <div className={`w-1.5 h-1.5 rounded-full transition-colors ${isActive ? `bg-${mode.color}` : 'bg-gray-700'}`}></div>
                            <span className="relative z-10">{mode.label}</span>
                        </button>
                    )
                })}
            </div>

            <div className="flex flex-wrap gap-2 items-center bg-black/60 border border-white/5 p-2 backdrop-blur-sm">
                <span className="text-[9px] text-gray-500 font-mono uppercase mr-2 tracking-widest px-2">
                    TECHNOLOGIA:
                </span>
                {activeModeData.subOptions.map((opt) => (
                    <button
                        key={opt}
                        onClick={() => setActiveSubOption(opt)}
                        className={`
                            px-3 py-1 text-[10px] font-mono border transition-all uppercase tracking-wider rounded-sm
                            ${activeSubOption === opt 
                                ? `border-${activeModeData.color} text-white bg-${activeModeData.color}/20` 
                                : 'border-white/10 text-gray-500 hover:text-gray-300 hover:bg-white/5'
                            }
                        `}
                    >
                        {opt}
                    </button>
                ))}
            </div>

            <div className="relative bg-black border border-white/10 focus-within:border-white/30 transition-colors shadow-2xl group mt-1 flex flex-col">
                
                {previewUrl && (
                    <div className="absolute -top-16 left-0 p-2 z-10">
                        <div className="relative group/img">
                            <img src={previewUrl} alt="Preview" className="h-14 w-auto rounded border border-white/20" />
                            <button 
                                onClick={removeImage}
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold"
                            >
                                &times;
                            </button>
                        </div>
                    </div>
                )}

                <textarea 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
                  placeholder={`Opisz zadanie (${activeModeData.label.toLowerCase()}) lub wklej obraz błędu/designu...`}
                  className="w-full bg-transparent border-none outline-none text-gray-200 text-sm font-mono min-h-[50px] max-h-[150px] resize-none p-4 pl-12 custom-scrollbar placeholder-gray-700 relative z-10"
                />

                <input 
                    type="file" 
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    accept="image/*"
                    className="hidden"
                />

                <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-3 left-3 text-gray-500 hover:text-white transition-colors z-20"
                    title="Dodaj obraz"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m18.375 12.739-7.693 7.693a4.5 4.5 0 0 1-6.364-6.364l10.94-10.94A3 3 0 1 1 19.5 7.372L8.552 18.32m.009-.01-.01.01m5.699-9.941-7.81 7.81a1.5 1.5 0 0 0 2.112 2.13" />
                    </svg>
                </button>

                <button 
                  onClick={handleSend}
                  disabled={isLoading || (!input.trim() && !selectedImage)}
                  className={`
                    absolute bottom-3 right-3 text-[9px] font-bold uppercase tracking-widest 
                    disabled:opacity-0 transition-all border px-4 py-2 z-20
                    text-${activeModeData.color} border-${activeModeData.color}/30 hover:bg-${activeModeData.color}/10
                  `}
                >
                  WYŚLIJ
                </button>
            </div>
            
            <div className="flex justify-between px-1 opacity-30">
               <span className="text-[9px] font-mono text-gray-500">QD STUDIO AI // SECURE CONNECTION</span>
               <span className="text-[9px] font-mono text-gray-500">MODE: {activeModeData.label} :: {activeSubOption}</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);