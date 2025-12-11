import React, { useState, useEffect } from 'react';
import { ITP_REFERENCE_PLAYERS } from '../constants';
import { askScoutAI } from '../services/geminiService';
import { MessageSquare, Send, BookOpen, Loader2, Map, Users, BarChart3, ChevronRight, ShieldAlert, CheckCircle2, Search, PlayCircle, Lightbulb, Zap, GraduationCap } from 'lucide-react';
import { UserProfile } from '../types';

interface KnowledgeTabProps {
    user?: UserProfile;
}

const KnowledgeTab: React.FC<KnowledgeTabProps> = ({ user }) => {
    const [activeSection, setActiveSection] = useState<'playbook' | 'standards' | 'scripts'>('playbook');
    const [aiQuestion, setAiQuestion] = useState('');
    const [aiAnswer, setAiAnswer] = useState<string | null>(null);
    const [aiLoading, setAiLoading] = useState(false);
    const [chatHistory, setChatHistory] = useState<{role: 'user' | 'ai', text: string}[]>([]);

    // --- PERSONALIZED TRIGGERS ---
    const getTriggers = () => {
        const role = user?.role || 'General';
        
        // 1. Interview Flow (Identify Potential)
        const interviewTrigger = {
            id: 'interview',
            icon: <Users size={18} className="text-blue-400" />,
            title: "Unlock My Network",
            subtitle: "Interview me to find hidden leads.",
            prompt: `Act as a senior head scout interviewing me. Your goal is to help me realize I already know players who fit Warubi. Ask me 3 short, probing questions about my daily environment (${role}) to uncover hidden talent I might be overlooking. Do not give advice yet, just ask the questions.`
        };

        // 2. Learning Flow (Program Knowledge)
        const learningTrigger = {
            id: 'learn',
            icon: <GraduationCap size={18} className="text-yellow-400" />,
            title: "Master the Programs",
            subtitle: "Teach me the ITP requirements.",
            prompt: "Act as a teacher. explain the 'International Talent Program' (ITP) to me in 3 simple bullet points. Then, give me a one-question quiz to see if I understood the difference between a 'Tier 1' and 'Tier 3' player."
        };

        // 3. Practical Flow (Find Fast) - Dynamic based on Role
        let practicalTrigger;
        if (role.includes('College')) {
            practicalTrigger = {
                id: 'action',
                icon: <Zap size={18} className="text-green-400" />,
                title: "The 'Pass List' Strategy",
                subtitle: "Turn rejected recruits into leads.",
                prompt: "I am a College Coach. Give me a specific strategy on how to use my list of players I 'Passed' on (who weren't quite good enough for my roster) and convert them into Warubi leads. Draft a text message I can send to them."
            };
        } else if (role.includes('Club')) {
            practicalTrigger = {
                id: 'action',
                icon: <Zap size={18} className="text-green-400" />,
                title: "Training Ground Check",
                subtitle: "Spotting talent at practice.",
                prompt: "I am a Club Coach. Give me a checklist of 3 specific things to look for at my training session tonight that indicate a player might be ready for the Warubi International Pathway (e.g., mentality, physical traits)."
            };
        } else {
            practicalTrigger = {
                id: 'action',
                icon: <Zap size={18} className="text-green-400" />,
                title: "Instant Scout Action",
                subtitle: "How to find a player today.",
                prompt: "Give me 3 unconventional ways to find a soccer player lead in the next 24 hours without leaving my house. Focus on digital tools and leveraging contacts."
            };
        }

        return [interviewTrigger, learningTrigger, practicalTrigger];
    };

    const triggers = getTriggers();

    const handleTriggerClick = async (triggerPrompt: string) => {
        setAiLoading(true);
        // Add user intent silently or visibly? Let's add it visibly for context
        const userMsg = { role: 'user' as const, text: "Let's start this session." };
        setChatHistory([userMsg]);
        
        try {
            const res = await askScoutAI(triggerPrompt);
            setChatHistory(prev => [...prev, { role: 'ai', text: res }]);
            setAiAnswer(res); // Keep current state for backward compat if needed
        } catch (e) {
            setAiAnswer("Network error. Try again.");
        } finally {
            setAiLoading(false);
        }
    };

    // --- PLAYBOOK STATE ---
    const [activeStage, setActiveStage] = useState(0);
    const STAGES = [
        {
            id: 'identify',
            title: '1. Identification',
            goal: 'Find hidden talent',
            icon: <Search size={20} />,
            tactics: [
                'Attend local "B-level" tournaments (hidden gems are often there).',
                'Ask high school coaches: "Who is your hardest worker?"',
                'Look for specific traits: Speed, height, or exceptional technique.',
            ],
            redFlags: [
                'Player argues with referees.',
                'Parents are coaching from the sidelines.',
                'Player walks when the ball is not near them.'
            ]
        },
        {
            id: 'engage',
            title: '2. Engagement',
            goal: 'Build trust & interest',
            icon: <MessageSquare size={20} />,
            tactics: [
                'Approach the PARENT first if the player is under 18.',
                'Focus on the player\'s potential, not just the program cost.',
                'Use the "First Contact" script to keep it professional.'
            ],
            redFlags: [
                'Player is unresponsive to messages.',
                'Family seems only interested in "full rides" immediately.'
            ]
        },
        {
            id: 'evaluate',
            title: '3. Evaluation',
            goal: 'Validate the talent',
            icon: <BarChart3 size={20} />,
            tactics: [
                'Compare them to the "Reference Profiles" (see Standards tab).',
                'Request full match footage, not just highlights.',
                'Check their academic standing (GPA is crucial for college).'
            ],
            redFlags: [
                'GPA below 2.5.',
                'Edited highlight reel hides mistakes.',
                'Struggles against higher-level opposition.'
            ]
        },
        {
            id: 'close',
            title: '4. The Offer',
            goal: 'Commitment',
            icon: <CheckCircle2 size={20} />,
            tactics: [
                'Frame the offer as an exclusive opportunity.',
                'Set a clear deadline for their decision.',
                'Walk them through the scholarship timeline.'
            ],
            redFlags: [
                'Hesitation due to "waiting for other offers".',
                'Lack of enthusiasm about the pathway.'
            ]
        }
    ];

    // --- STANDARDS STATE ---
    const [selectedRefPlayer, setSelectedRefPlayer] = useState(ITP_REFERENCE_PLAYERS[0]);
    const [comparisonResult, setComparisonResult] = useState<string | null>(null);

    const runComparison = () => {
        // Mock simple logic for educational purposes
        setComparisonResult(
            `Analysis: ${selectedRefPlayer.name} sets the standard for a ${selectedRefPlayer.evaluation?.scholarshipTier} player. ` +
            `To match this, your prospect needs to demonstrate similar ${selectedRefPlayer.evaluation?.strengths[0]} and ${selectedRefPlayer.evaluation?.strengths[1]}. ` +
            `If your prospect is technically weaker, they must be physically superior to compete.`
        );
    };

    // --- SCRIPTS STATE ---
    const [activeScript, setActiveScript] = useState<string | null>(null);
    const SCRIPTS = [
        {
            id: 'price',
            title: 'Objection: "It is too expensive"',
            content: "I understand finances are a big factor. However, we aren't just selling a trip; we are investing in a career pathway. One college scholarship offer can be worth $200,000+. This program is the bridge to that return on investment. Let's look at the payment plans."
        },
        {
            id: 'mls',
            title: 'Objection: "We are waiting for MLS"',
            content: "That's a great goal. But did you know 95% of MLS draftees come from College Soccer now? The college route doesn't close the pro door; it keeps it open while getting a degree. Warubi creates the options so you aren't left with nothing if MLS doesn't call."
        },
        {
            id: 'time',
            title: 'Objection: "Not ready yet"',
            content: "Totally fair. But scouting cycles happen 1-2 years in advance. If we wait until you feel 'ready', the roster spots for your grad year might be gone. Let's do a free assessment now just to see where you stand."
        }
    ];

    // --- AI HANDLER ---
    const handleAskAI = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!aiQuestion.trim()) return;
        
        const newMsg = { role: 'user' as const, text: aiQuestion };
        setChatHistory(prev => [...prev, newMsg]);
        setAiQuestion('');
        setAiLoading(true);

        try {
            // Append context if history exists
            const context = chatHistory.map(m => `${m.role}: ${m.text}`).join('\n');
            const res = await askScoutAI(aiQuestion + (context ? `\n\nContext:\n${context}` : ''));
            
            setChatHistory(prev => [...prev, { role: 'ai', text: res }]);
            setAiAnswer(res);
        } catch (e) {
            setAiAnswer("Network error. Try again.");
        } finally {
            setAiLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-140px)] gap-6 animate-fade-in">
            
            {/* Top Navigation */}
            <div className="flex gap-4 border-b border-scout-700 pb-4">
                <button 
                    onClick={() => setActiveSection('playbook')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all ${activeSection === 'playbook' ? 'bg-scout-accent text-white' : 'text-gray-400 hover:bg-scout-800'}`}
                >
                    <Map size={18} /> The Playbook
                </button>
                <button 
                    onClick={() => setActiveSection('standards')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all ${activeSection === 'standards' ? 'bg-scout-accent text-white' : 'text-gray-400 hover:bg-scout-800'}`}
                >
                    <BarChart3 size={18} /> Standards Tool
                </button>
                <button 
                    onClick={() => setActiveSection('scripts')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all ${activeSection === 'scripts' ? 'bg-scout-accent text-white' : 'text-gray-400 hover:bg-scout-800'}`}
                >
                    <BookOpen size={18} /> Script Vault
                </button>
            </div>

            <div className="flex gap-6 h-full overflow-hidden">
                
                {/* LEFT: Main Content Area */}
                <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                    
                    {/* SECTION: PLAYBOOK */}
                    {activeSection === 'playbook' && (
                        <div className="space-y-6">
                            <div className="bg-scout-800 p-6 rounded-xl border border-scout-700">
                                <h2 className="text-2xl font-bold text-white mb-2">The Recruiting Roadmap</h2>
                                <p className="text-gray-400 mb-6">Master these 4 stages to become a top producer.</p>
                                
                                {/* Timeline Stepper */}
                                <div className="flex justify-between relative mb-8">
                                    <div className="absolute top-1/2 left-0 w-full h-1 bg-scout-700 -z-10 transform -translate-y-1/2"></div>
                                    {STAGES.map((stage, idx) => (
                                        <button 
                                            key={stage.id}
                                            onClick={() => setActiveStage(idx)}
                                            className={`flex flex-col items-center gap-2 group ${activeStage === idx ? 'scale-110' : 'opacity-70 hover:opacity-100'}`}
                                        >
                                            <div className={`w-12 h-12 rounded-full flex items-center justify-center border-4 transition-colors ${activeStage === idx ? 'bg-scout-accent border-scout-900 text-white' : 'bg-scout-900 border-scout-700 text-gray-500'}`}>
                                                {stage.icon}
                                            </div>
                                            <span className={`text-xs font-bold uppercase ${activeStage === idx ? 'text-scout-accent' : 'text-gray-500'}`}>{stage.title}</span>
                                        </button>
                                    ))}
                                </div>

                                {/* Stage Details */}
                                <div className="bg-scout-900/50 rounded-xl p-6 border border-scout-700 animate-fade-in">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="text-xl font-bold text-white">{STAGES[activeStage].title}</h3>
                                            <p className="text-scout-highlight text-sm font-medium">Goal: {STAGES[activeStage].goal}</p>
                                        </div>
                                        <span className="text-4xl opacity-10 font-black">{activeStage + 1}</span>
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-6">
                                        <div>
                                            <h4 className="text-sm font-bold text-green-400 mb-3 flex items-center gap-2"><CheckCircle2 size={16}/> Winning Tactics</h4>
                                            <ul className="space-y-2">
                                                {STAGES[activeStage].tactics.map((t, i) => (
                                                    <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                                                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-1.5 shrink-0"></span>
                                                        {t}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold text-red-400 mb-3 flex items-center gap-2"><ShieldAlert size={16}/> Red Flags</h4>
                                            <ul className="space-y-2">
                                                {STAGES[activeStage].redFlags.map((t, i) => (
                                                    <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                                                        <span className="w-1.5 h-1.5 bg-red-500 rounded-full mt-1.5 shrink-0"></span>
                                                        {t}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* SECTION: STANDARDS TOOL */}
                    {activeSection === 'standards' && (
                        <div className="space-y-6">
                            <div className="bg-scout-800 p-6 rounded-xl border border-scout-700">
                                <h2 className="text-2xl font-bold text-white mb-2">Talent Comparator</h2>
                                <p className="text-gray-400 mb-6">Select a reference player to understand the "Gold Standard" for each tier.</p>

                                <div className="grid md:grid-cols-2 gap-8">
                                    {/* Reference Card */}
                                    <div className="space-y-4">
                                        <label className="text-xs font-bold text-gray-500 uppercase">Select Reference Benchmark</label>
                                        <div className="grid gap-3">
                                            {ITP_REFERENCE_PLAYERS.map(p => (
                                                <button 
                                                    key={p.id}
                                                    onClick={() => { setSelectedRefPlayer(p); setComparisonResult(null); }}
                                                    className={`text-left p-3 rounded-lg border transition-all ${selectedRefPlayer.id === p.id ? 'bg-scout-700 border-scout-accent ring-1 ring-scout-accent' : 'bg-scout-900 border-scout-700 hover:bg-scout-800'}`}
                                                >
                                                    <div className="flex justify-between">
                                                        <span className="font-bold text-white">{p.name}</span>
                                                        <span className="text-xs bg-scout-accent text-scout-900 px-1.5 rounded font-bold">{p.evaluation?.score}</span>
                                                    </div>
                                                    <div className="text-xs text-gray-400 mt-1">
                                                        {p.evaluation?.scholarshipTier} • {p.position}
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Comparison Output */}
                                    <div className="bg-scout-900 rounded-xl p-6 border border-scout-700 flex flex-col justify-center">
                                        <div className="text-center mb-6">
                                            <div className="w-16 h-16 bg-scout-800 rounded-full flex items-center justify-center mx-auto mb-2 text-gray-400 border border-scout-700">
                                                <Users size={32} />
                                            </div>
                                            <h3 className="font-bold text-white">Gap Analysis</h3>
                                            <p className="text-xs text-gray-500">Your Prospect vs. {selectedRefPlayer.name}</p>
                                        </div>

                                        {!comparisonResult ? (
                                            <button 
                                                onClick={runComparison}
                                                className="w-full bg-scout-accent hover:bg-emerald-600 text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                                            >
                                                <PlayCircle size={18} /> Analyze Gap
                                            </button>
                                        ) : (
                                            <div className="animate-fade-in">
                                                <div className="p-4 bg-scout-800 rounded-lg border-l-4 border-scout-accent text-sm text-gray-300 italic leading-relaxed">
                                                    "{comparisonResult}"
                                                </div>
                                                <button 
                                                    onClick={() => setComparisonResult(null)}
                                                    className="w-full mt-4 text-xs text-gray-500 hover:text-white"
                                                >
                                                    Reset Analysis
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* SECTION: SCRIPT VAULT */}
                    {activeSection === 'scripts' && (
                        <div className="space-y-6">
                             <div className="bg-scout-800 p-6 rounded-xl border border-scout-700">
                                <h2 className="text-2xl font-bold text-white mb-2">The Script Vault</h2>
                                <p className="text-gray-400 mb-6">Proven answers to the toughest questions parents and coaches ask.</p>

                                <div className="space-y-3">
                                    {SCRIPTS.map(script => (
                                        <div key={script.id} className="border border-scout-700 rounded-lg overflow-hidden bg-scout-900">
                                            <button 
                                                onClick={() => setActiveScript(activeScript === script.id ? null : script.id)}
                                                className="w-full flex items-center justify-between p-4 text-left hover:bg-scout-800 transition-colors"
                                            >
                                                <span className="font-bold text-gray-200">{script.title}</span>
                                                <ChevronRight size={18} className={`text-gray-500 transition-transform ${activeScript === script.id ? 'rotate-90' : ''}`} />
                                            </button>
                                            
                                            {activeScript === script.id && (
                                                <div className="p-4 pt-0 bg-scout-800/50 animate-fade-in">
                                                    <div className="p-3 bg-scout-900 rounded border border-scout-700 text-sm text-gray-300 leading-relaxed font-mono">
                                                        "{script.content}"
                                                    </div>
                                                    <div className="flex justify-end mt-2">
                                                        <button 
                                                            onClick={() => navigator.clipboard.writeText(script.content)}
                                                            className="text-xs text-scout-accent hover:text-white flex items-center gap-1"
                                                        >
                                                            Copy to Clipboard
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                </div>

                {/* RIGHT: AI Assistant (Always Visible) */}
                <div className="w-1/3 min-w-[320px] flex flex-col bg-scout-800 border border-scout-700 rounded-xl overflow-hidden">
                    <div className="p-4 border-b border-scout-700 bg-scout-800/80 backdrop-blur">
                        <h3 className="font-bold text-white flex items-center gap-2">
                            <MessageSquare size={18} className="text-scout-highlight" /> 
                            Ask ScoutAI
                        </h3>
                        <p className="text-xs text-gray-400 mt-1">Your 24/7 expert mentor.</p>
                    </div>
                    
                    <div className="flex-1 p-4 overflow-y-auto bg-scout-900/30 custom-scrollbar flex flex-col gap-4">
                        {chatHistory.length > 0 ? (
                            chatHistory.map((msg, i) => (
                                <div key={i} className={`p-3 rounded-lg border text-sm animate-fade-in ${msg.role === 'ai' ? 'bg-scout-700/50 border-scout-600 text-gray-200' : 'bg-scout-800/80 border-scout-700 text-gray-300 ml-8'}`}>
                                    <span className={`text-[10px] font-bold block mb-1 ${msg.role === 'ai' ? 'text-scout-highlight' : 'text-gray-500'}`}>
                                        {msg.role === 'ai' ? 'ScoutAI' : 'You'}
                                    </span>
                                    {msg.text}
                                </div>
                            ))
                        ) : (
                            <div className="h-full flex flex-col justify-center items-center text-gray-600 text-center">
                                <Lightbulb size={32} className="opacity-50 mb-3 text-scout-highlight" />
                                <p className="text-sm font-medium text-gray-400 mb-6">Start a focused session:</p>
                                
                                <div className="w-full space-y-3">
                                    {triggers.map(trigger => (
                                        <button 
                                            key={trigger.id}
                                            onClick={() => handleTriggerClick(trigger.prompt)}
                                            className="w-full p-3 rounded-lg bg-scout-800 border border-scout-700 hover:border-scout-accent hover:bg-scout-700 transition-all text-left group"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 rounded bg-scout-900 group-hover:bg-scout-800">
                                                    {trigger.icon}
                                                </div>
                                                <div>
                                                    <div className="text-xs font-bold text-white">{trigger.title}</div>
                                                    <div className="text-[10px] text-gray-500">{trigger.subtitle}</div>
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                        {aiLoading && (
                             <div className="p-3 rounded-lg bg-scout-700/50 border border-scout-600 text-gray-200 w-fit">
                                <Loader2 size={16} className="animate-spin text-scout-accent" />
                             </div>
                        )}
                    </div>

                    <div className="p-4 bg-scout-800 border-t border-scout-700">
                        <form onSubmit={handleAskAI} className="relative">
                            <input
                                type="text"
                                placeholder="Type a message..."
                                className="w-full bg-scout-900 text-white text-sm rounded-lg pl-4 pr-10 py-3 focus:outline-none focus:ring-1 focus:ring-scout-accent border border-scout-700"
                                value={aiQuestion}
                                onChange={(e) => setAiQuestion(e.target.value)}
                            />
                            <button 
                                type="submit" 
                                disabled={aiLoading || !aiQuestion}
                                className="absolute right-2 top-2 p-1.5 text-scout-accent hover:text-white disabled:opacity-50 transition-colors"
                            >
                                {aiLoading ? <Loader2 size={18} className="animate-spin"/> : <Send size={18} />}
                            </button>
                        </form>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default KnowledgeTab;