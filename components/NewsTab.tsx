import React from 'react';
import { Globe, TrendingUp, UserCheck, Calendar, ArrowRight, ExternalLink, Award, Newspaper, Flame, Trophy } from 'lucide-react';

const NEWS_ITEMS = [
    {
        id: 1,
        type: 'Transfer News',
        title: '3 Warubi Players Sign Pro Contracts in Germany',
        summary: 'Following the successful Munich Showcase, three players from the 2005 age group have signed development contracts with Regionalliga clubs. "This validates our tiering system," says Head of Scouting.',
        source: 'FC Köln ITP',
        date: '2 hours ago',
        categoryColor: 'text-green-400',
        borderColor: 'border-green-500/30'
    },
    {
        id: 2,
        type: 'Network Milestone',
        title: 'Athletes USA surpasses 5,000 Scholarships Awarded',
        summary: 'Our partner network Athletes USA has reached a historic milestone, securing over $200M in scholarship funding for student-athletes globally in 2024 alone.',
        source: 'Athletes USA',
        date: '1 day ago',
        categoryColor: 'text-blue-400',
        borderColor: 'border-blue-500/30'
    },
    {
        id: 3,
        type: 'Platform Update',
        title: 'New AI Scouting Tools Now Live',
        summary: 'The new "Scout DNA" personalization engine is now active for all users. Log in to see your custom strategy and hidden gold mines.',
        source: 'WARUBI Tech',
        date: '2 days ago',
        categoryColor: 'text-scout-accent',
        borderColor: 'border-scout-accent/30'
    },
    {
        id: 4,
        type: 'Event Recap',
        title: 'Highlights: Florida Winter ID Camp',
        summary: 'Over 150 players attended our sold-out event in Miami. Top scouts from 12 D1 universities were present. Check out the top rated players in the database now.',
        source: 'Warubi Events',
        date: '3 days ago',
        categoryColor: 'text-orange-400',
        borderColor: 'border-orange-500/30'
    }
];

const TICKER_ITEMS = [
    "BREAKING: FC Köln U19s to scout at Dallas Cup 2025",
    "REMINDER: Q2 Scouting Reports due next Friday",
    "NEW PARTNERSHIP: Warubi x Nike Football announced for Berlin Event",
    "STATS: 42 new placements confirmed this week across the network"
];

const NewsTab: React.FC = () => {
  return (
    <div className="h-[calc(100vh-140px)] flex flex-col gap-6 animate-fade-in">
        
        {/* Ticker Bar */}
        <div className="bg-scout-800 rounded-lg border border-scout-700 overflow-hidden flex items-center shadow-lg shrink-0">
            <div className="bg-red-600 text-white px-4 py-2 font-bold text-xs uppercase tracking-wider shrink-0 flex items-center gap-2">
                <Flame size={14} className="animate-pulse" /> Network Live
            </div>
            <div className="flex-1 overflow-hidden relative h-8">
                 <div className="absolute whitespace-nowrap animate-marquee flex items-center h-full text-xs font-medium text-gray-300">
                    {TICKER_ITEMS.map((item, i) => (
                        <span key={i} className="mx-8 flex items-center gap-2">
                             • {item}
                        </span>
                    ))}
                     {/* Duplicate for seamless loop */}
                     {TICKER_ITEMS.map((item, i) => (
                        <span key={`dup-${i}`} className="mx-8 flex items-center gap-2">
                             • {item}
                        </span>
                    ))}
                 </div>
            </div>
        </div>

        <div className="flex gap-6 h-full overflow-hidden">
            {/* Main Feed */}
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-6">
                
                {/* Hero Card */}
                <div className="bg-gradient-to-br from-scout-800 to-scout-900 rounded-2xl border border-scout-600 p-8 shadow-2xl relative overflow-hidden group">
                     <div className="absolute top-0 right-0 w-64 h-64 bg-scout-accent/10 rounded-full blur-3xl group-hover:bg-scout-accent/20 transition-colors"></div>
                     
                     <div className="relative z-10">
                        <span className="inline-block px-3 py-1 rounded-full bg-scout-accent/20 text-scout-accent border border-scout-accent/30 text-xs font-bold uppercase tracking-wider mb-4">
                            Featured Story
                        </span>
                        <h2 className="text-3xl font-bold text-white mb-4 leading-tight max-w-2xl">
                            From "Unknown" to Bundesliga Academy: The Journey of Warubi Scout Lead #492
                        </h2>
                        <p className="text-gray-300 text-sm mb-6 max-w-xl leading-relaxed">
                            How a simple phone video uploaded by a scout in Ohio led to a trial invitation and contract offer in Cologne. Read the full case study on how sticking to the "Tier 1" criteria pays off.
                        </p>
                        <button className="flex items-center gap-2 text-white font-bold hover:text-scout-accent transition-colors">
                            Read Full Story <ArrowRight size={18} />
                        </button>
                     </div>
                </div>

                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <Newspaper size={20} className="text-gray-400"/> Latest Updates
                </h3>

                <div className="grid gap-4">
                    {NEWS_ITEMS.map(item => (
                        <div key={item.id} className="bg-scout-800 p-5 rounded-xl border border-scout-700 hover:border-scout-500 transition-all hover:bg-scout-800/80 group">
                            <div className="flex justify-between items-start mb-2">
                                <span className={`text-[10px] font-bold uppercase tracking-wider ${item.categoryColor}`}>
                                    {item.type}
                                </span>
                                <span className="text-xs text-gray-500">{item.date}</span>
                            </div>
                            <h4 className="text-lg font-bold text-white mb-2 group-hover:text-scout-highlight transition-colors">
                                {item.title}
                            </h4>
                            <p className="text-sm text-gray-400 mb-4 line-clamp-2">
                                {item.summary}
                            </p>
                            <div className="flex items-center justify-between pt-4 border-t border-scout-700/50">
                                <span className="text-xs font-bold text-gray-500 flex items-center gap-1">
                                    Source: <span className="text-gray-300">{item.source}</span>
                                </span>
                                <button className="text-xs text-scout-accent hover:underline flex items-center gap-1">
                                    Read More <ExternalLink size={10} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Right Sidebar: Global Stats */}
            <div className="w-80 shrink-0 space-y-6">
                
                {/* Global Reach Card */}
                <div className="bg-scout-800 rounded-xl border border-scout-700 p-6">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <Globe size={16} /> Global Impact
                    </h3>
                    
                    <div className="space-y-6">
                        <div>
                            <div className="flex justify-between items-end mb-1">
                                <span className="text-2xl font-black text-white">1,240</span>
                                <span className="text-xs text-green-400 font-bold flex items-center gap-1">
                                    <TrendingUp size={12} /> +12%
                                </span>
                            </div>
                            <p className="text-xs text-gray-500">Total Placements (YTD)</p>
                            <div className="w-full bg-scout-900 h-1.5 rounded-full mt-2">
                                <div className="bg-scout-accent h-1.5 rounded-full w-[70%]"></div>
                            </div>
                        </div>

                         <div>
                            <div className="flex justify-between items-end mb-1">
                                <span className="text-2xl font-black text-white">$52M</span>
                                <span className="text-xs text-green-400 font-bold flex items-center gap-1">
                                    <TrendingUp size={12} /> +5%
                                </span>
                            </div>
                            <p className="text-xs text-gray-500">Scholarship Value Created</p>
                             <div className="w-full bg-scout-900 h-1.5 rounded-full mt-2">
                                <div className="bg-blue-500 h-1.5 rounded-full w-[85%]"></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Top Scouts Leaderboard */}
                <div className="bg-scout-800 rounded-xl border border-scout-700 p-6">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <Trophy size={16} /> Top Scouts (This Month)
                    </h3>
                    <div className="space-y-4">
                        {[
                            { name: 'Sarah Jenkins', region: 'California', leads: 12, rank: 1 },
                            { name: 'David Mueller', region: 'Germany', leads: 9, rank: 2 },
                            { name: 'James O.', region: 'Nigeria', leads: 8, rank: 3 },
                        ].map((scout) => (
                            <div key={scout.rank} className="flex items-center gap-3">
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                    scout.rank === 1 ? 'bg-yellow-500 text-yellow-900' :
                                    scout.rank === 2 ? 'bg-gray-400 text-gray-900' :
                                    'bg-orange-700 text-orange-200'
                                }`}>
                                    {scout.rank}
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-bold text-white">{scout.name}</p>
                                    <p className="text-[10px] text-gray-500">{scout.region}</p>
                                </div>
                                <div className="text-xs font-bold text-scout-accent">{scout.leads} Leads</div>
                            </div>
                        ))}
                    </div>
                    <button className="w-full mt-4 py-2 border border-scout-600 rounded text-xs text-gray-400 hover:text-white hover:bg-scout-700 transition-colors">
                        View Full Leaderboard
                    </button>
                </div>

                {/* Quick Link */}
                <div className="bg-gradient-to-r from-blue-900/50 to-blue-800/50 rounded-xl border border-blue-500/30 p-5">
                    <h4 className="font-bold text-white text-sm mb-2">Join the WhatsApp Community</h4>
                    <p className="text-xs text-blue-200 mb-3">Connect with 500+ scouts instantly.</p>
                    <button className="w-full bg-white text-blue-900 font-bold text-xs py-2 rounded hover:bg-blue-50 transition-colors">
                        Join Group
                    </button>
                </div>

            </div>
        </div>
    </div>
  );
};

export default NewsTab;