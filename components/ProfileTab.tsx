import React, { useState } from 'react';
import { UserProfile, Player, ScoutingEvent, PlayerStatus } from '../types';
import { draftScoutBio } from '../services/geminiService';
import { 
  BadgeCheck, Share2, Award, MapPin, Users, Calendar, 
  Briefcase, Star, QrCode, TrendingUp, Clock, ChevronRight, 
  ShieldCheck, Copy, CheckCircle2, LayoutTemplate, Zap, Edit2, Save, X, Plus, Trash2, Loader2, Sparkles, GraduationCap, Map, Eye
} from 'lucide-react';

interface ProfileTabProps {
  user: UserProfile;
  players: Player[];
  events: ScoutingEvent[];
  onUpdateUser?: (updatedUser: UserProfile) => void;
}

const ProfileTab: React.FC<ProfileTabProps> = ({ user, players, events, onUpdateUser }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'credentials'>('overview');
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  // Edit Form State
  const [formData, setFormData] = useState<UserProfile>(user);

  // --- DERIVED METRICS ---
  const signedPlayers = players.filter(p => p.status === PlayerStatus.PLACED).length;
  const totalPlayers = players.length;
  
  // Event Metrics
  const hostedEvents = events.filter(e => e.role === 'HOST' || e.isMine).length; // Backward compat for isMine
  const attendedEvents = events.filter(e => e.role === 'ATTENDEE' || (!e.isMine && e.role !== 'HOST')).length;
  const totalEvents = hostedEvents + attendedEvents;
  
  // Future Events for Agenda
  const upcomingEvents = events
    .filter(e => new Date(e.date) >= new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 3);

  // --- MOMENTUM FEED (Derived from Players & Events) ---
  const getMomentumItems = () => {
      const items = [];
      players.forEach(p => {
          items.push({
              id: p.id,
              type: 'PLAYER',
              title: `Identified ${p.name}`,
              subtitle: p.evaluation?.scholarshipTier || 'Evaluation Pending',
              date: new Date(p.submittedAt),
              icon: Users,
              color: 'text-blue-400',
              bg: 'bg-blue-500/10 border-blue-500/20'
          });
      });
      events.forEach(e => {
          if (new Date(e.date) < new Date()) { // Only past events in momentum
            const isHost = e.role === 'HOST' || e.isMine;
            items.push({
                id: e.id,
                type: 'EVENT',
                title: isHost ? `Hosted ${e.title}` : `Attended ${e.title}`,
                subtitle: `${e.type} • ${isHost ? e.registeredCount + ' Registered' : 'Scouting'}`,
                date: new Date(e.date),
                icon: isHost ? Calendar : Eye,
                color: isHost ? 'text-orange-400' : 'text-green-400',
                bg: isHost ? 'bg-orange-500/10 border-orange-500/20' : 'bg-green-500/10 border-green-500/20'
            });
          }
      });
      return items.sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 5);
  };

  const momentum = getMomentumItems();

  const handleShare = () => {
    navigator.clipboard.writeText(`https://warubi.com/scout/${user.scoutId}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // --- EDIT HANDLERS ---
  const handleInputChange = (field: keyof UserProfile, value: string) => {
      setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addExperience = () => {
      const newExp = { id: Date.now().toString(), role: '', org: '', duration: '' };
      setFormData(prev => ({
          ...prev,
          experience: [...(prev.experience || []), newExp]
      }));
  };

  const updateExperience = (id: string, field: string, value: string) => {
      setFormData(prev => ({
          ...prev,
          experience: prev.experience?.map(e => e.id === id ? { ...e, [field]: value } : e)
      }));
  };

  const removeExperience = (id: string) => {
      setFormData(prev => ({
          ...prev,
          experience: prev.experience?.filter(e => e.id !== id)
      }));
  };

  const addCertification = () => {
      setFormData(prev => ({
          ...prev,
          certifications: [...(prev.certifications || []), ""]
      }));
  };

  const updateCertification = (index: number, value: string) => {
      const newCerts = [...(formData.certifications || [])];
      newCerts[index] = value;
      setFormData(prev => ({ ...prev, certifications: newCerts }));
  };

  const removeCertification = (index: number) => {
      const newCerts = [...(formData.certifications || [])];
      newCerts.splice(index, 1);
      setFormData(prev => ({ ...prev, certifications: newCerts }));
  };

  const handleSave = () => {
      if (onUpdateUser) onUpdateUser(formData);
      setIsEditing(false);
  };

  const handleAiDraftBio = async () => {
      setAiLoading(true);
      try {
          const draft = await draftScoutBio(formData);
          setFormData(prev => ({ ...prev, bio: draft }));
      } catch (e) {
          alert("Could not generate bio. Please try again.");
      } finally {
          setAiLoading(false);
      }
  };

  return (
    <div className="max-w-6xl mx-auto pb-12 animate-fade-in">
      
      {/* HEADER & ACTIONS */}
      <div className="mb-8 flex flex-col md:flex-row justify-between items-end gap-4 border-b border-scout-700/50 pb-6">
        <div>
            <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-scout-accent/10 text-scout-accent border border-scout-accent/20">
                    Professional Profile
                </span>
                <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                    <ShieldCheck size={12} /> ID: {user.scoutId?.toUpperCase()}
                </span>
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight">Scout Identity</h1>
            <p className="text-gray-400 text-sm mt-1 max-w-xl">
                Your verified digital credential within the WARUBI network.
            </p>
        </div>
        <div className="flex gap-3">
             {!isEditing ? (
                 <>
                    <button 
                        onClick={() => setIsEditing(true)}
                        className="px-4 py-2 rounded-lg bg-scout-800 hover:bg-scout-700 border border-scout-600 text-gray-300 text-sm font-medium transition-colors flex items-center gap-2"
                    >
                        <Edit2 size={16} /> Edit Profile
                    </button>
                    <button 
                        onClick={handleShare}
                        className="px-4 py-2 rounded-lg bg-white text-scout-900 hover:bg-gray-100 font-bold text-sm transition-colors flex items-center gap-2 shadow-lg shadow-white/5"
                    >
                        {copied ? <CheckCircle2 size={16} className="text-green-600"/> : <Share2 size={16} />} 
                        {copied ? 'Link Copied' : 'Share Profile'}
                    </button>
                 </>
             ) : (
                 <>
                    <button 
                        onClick={() => { setIsEditing(false); setFormData(user); }}
                        className="px-4 py-2 rounded-lg bg-transparent hover:bg-scout-800 text-gray-400 text-sm font-medium transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handleSave}
                        className="px-6 py-2 rounded-lg bg-scout-accent hover:bg-emerald-600 text-white font-bold text-sm transition-colors flex items-center gap-2 shadow-lg"
                    >
                        <Save size={16} /> Save Changes
                    </button>
                 </>
             )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8 items-start">
        
        {/* LEFT COLUMN: THE DIGITAL CREDENTIAL (Always visible) */}
        <div className="lg:col-span-1 space-y-6 sticky top-6">
            
            {/* The ID Card */}
            <div className="relative group perspective-1000">
                <div className="absolute inset-0 bg-scout-accent/20 rounded-2xl blur-xl group-hover:bg-scout-accent/30 transition-colors duration-500"></div>
                <div className="relative bg-[#0f1218] border border-scout-700/80 rounded-2xl overflow-hidden shadow-2xl p-0">
                    <div className="h-24 bg-gradient-to-r from-scout-800 via-scout-700 to-scout-900 relative overflow-hidden">
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
                        <div className="absolute top-4 left-4">
                            <h3 className="text-xs font-black tracking-[0.2em] text-white/40 uppercase">WARUBI SPORTS</h3>
                        </div>
                        <div className="absolute top-4 right-4">
                            <div className="flex items-center gap-1.5 bg-black/30 backdrop-blur px-2 py-1 rounded border border-white/10">
                                <div className="w-1.5 h-1.5 rounded-full bg-scout-accent animate-pulse"></div>
                                <span className="text-[9px] font-bold text-scout-accent uppercase">Active</span>
                            </div>
                        </div>
                    </div>

                    <div className="px-6 pb-6 -mt-10 relative">
                        <div className="flex justify-between items-end mb-4">
                             <div className="w-20 h-20 rounded-xl bg-scout-800 border-2 border-scout-900 shadow-xl flex items-center justify-center text-2xl font-bold text-white relative z-10 overflow-hidden">
                                {user.name.charAt(0)}
                                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent"></div>
                            </div>
                            <div className="mb-1">
                                <QrCode size={40} className="text-white opacity-80" />
                            </div>
                        </div>
                       
                        <div className="space-y-1 mb-6">
                            <h2 className="text-2xl font-bold text-white leading-none">{isEditing ? formData.name : user.name}</h2>
                            <div className="flex items-center gap-2 text-sm text-scout-accent font-medium">
                                <BadgeCheck size={16} /> Verified Scout
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-xs mb-6 border-t border-scout-800 pt-4">
                            <div>
                                <span className="block text-gray-500 uppercase font-bold text-[9px] mb-0.5">Role</span>
                                <span className="text-gray-200 font-medium">{isEditing ? formData.role : user.role}</span>
                            </div>
                            <div>
                                <span className="block text-gray-500 uppercase font-bold text-[9px] mb-0.5">Region</span>
                                <span className="text-gray-200 font-medium">{isEditing ? formData.region : user.region}</span>
                            </div>
                            {(isEditing ? formData.affiliation : user.affiliation) && (
                                <div className="col-span-2">
                                    <span className="block text-gray-500 uppercase font-bold text-[9px] mb-0.5">Affiliation</span>
                                    <span className="text-gray-200 font-medium">{isEditing ? formData.affiliation : user.affiliation}</span>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center justify-between text-[9px] text-gray-600 font-mono border-t border-scout-800 pt-3">
                            <span>ISS: {new Date().getFullYear()}</span>
                            <span>EXP: {new Date().getFullYear() + 1}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Credentials / Badges */}
            <div className="bg-scout-900 border border-scout-700 rounded-xl p-5">
                <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                    <Award size={16} className="text-scout-highlight"/> Professional Credentials
                </h3>
                
                {/* Licenses List */}
                <div className="space-y-3 mb-4">
                    {user.certifications && user.certifications.length > 0 ? (
                        user.certifications.map((cert, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <div className="bg-scout-800 p-1.5 rounded border border-scout-600 text-scout-accent">
                                    <ShieldCheck size={14} />
                                </div>
                                <span className="text-xs text-gray-300 font-medium">{cert}</span>
                            </div>
                        ))
                    ) : (
                        <div className="text-xs text-gray-500 italic px-2">No licenses verified yet.</div>
                    )}
                </div>

                <div className="border-t border-scout-800 pt-3 flex gap-4">
                    <div className="flex items-center gap-2">
                        <div className="bg-blue-900/20 p-1.5 rounded text-blue-400">
                            <Users size={14} />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs font-bold text-white">{signedPlayers}</span>
                            <span className="text-[9px] text-gray-500 uppercase">Placed</span>
                        </div>
                    </div>
                    {/* Badge: Event Host */}
                    {hostedEvents > 0 && (
                        <div className="flex items-center gap-2">
                            <div className="bg-orange-900/20 p-1.5 rounded text-orange-400">
                                <Calendar size={14} />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xs font-bold text-white">{hostedEvents}</span>
                                <span className="text-[9px] text-gray-500 uppercase">Hosted</span>
                            </div>
                        </div>
                    )}
                    {/* Badge: Active Scout (Attendee) */}
                    {attendedEvents > 0 && (
                        <div className="flex items-center gap-2">
                            <div className="bg-green-900/20 p-1.5 rounded text-green-400">
                                <Eye size={14} />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xs font-bold text-white">{attendedEvents}</span>
                                <span className="text-[9px] text-gray-500 uppercase">Scouted</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>

        {/* RIGHT COLUMN: CONTENT */}
        <div className="lg:col-span-2 space-y-8">
            
            {/* VIEW MODE */}
            {!isEditing ? (
                <>
                    {/* Performance Stats */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-scout-800/50 p-5 rounded-xl border border-scout-700 backdrop-blur-sm">
                            <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                                <Users size={14} /> Pipeline
                            </div>
                            <div className="text-3xl font-black text-white tracking-tight">{totalPlayers}</div>
                            <div className="text-[10px] text-green-400 font-medium mt-1">Top 15% Regionally</div>
                        </div>
                        <div className="bg-scout-800/50 p-5 rounded-xl border border-scout-700 backdrop-blur-sm relative overflow-hidden">
                            {signedPlayers > 0 && <div className="absolute top-0 right-0 w-16 h-16 bg-scout-accent/10 rounded-full blur-xl"></div>}
                            <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                                <Award size={14} /> Placements
                            </div>
                            <div className={`text-3xl font-black tracking-tight ${signedPlayers > 0 ? 'text-scout-accent' : 'text-gray-500'}`}>{signedPlayers}</div>
                            <div className="text-[10px] text-gray-500 font-medium mt-1">
                                {signedPlayers > 0 ? 'Commission Eligible' : '0 Pending'}
                            </div>
                        </div>
                        <div className="bg-scout-800/50 p-5 rounded-xl border border-scout-700 backdrop-blur-sm">
                            <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                                <Calendar size={14} /> Events
                            </div>
                            <div className="text-3xl font-black text-white tracking-tight">{totalEvents}</div>
                            <div className="text-[10px] text-gray-500 font-medium mt-1">
                                {hostedEvents} Hosted • {attendedEvents} Attended
                            </div>
                        </div>
                    </div>

                    {/* Bio Section */}
                    <div className="bg-scout-800 rounded-xl border border-scout-700 p-6">
                        <h3 className="text-lg font-bold text-white mb-4">About Me</h3>
                        <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
                            {user.bio || `Professional ${user.role} based in ${user.region}. Dedicated to identifying and developing top-tier talent for the Warubi network.`}
                        </p>
                    </div>

                    {/* Experience Grid */}
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="bg-scout-800 rounded-xl border border-scout-700 p-6">
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                <Briefcase size={16} /> Experience
                            </h3>
                            {user.experience && user.experience.length > 0 ? (
                                <div className="space-y-4">
                                    {user.experience.map((exp, i) => (
                                        <div key={i} className="flex gap-3 relative">
                                            {/* Timeline dot/line */}
                                            <div className="flex flex-col items-center">
                                                <div className="w-2 h-2 rounded-full bg-scout-accent"></div>
                                                {i !== user.experience!.length - 1 && <div className="w-0.5 flex-1 bg-scout-700 mt-1"></div>}
                                            </div>
                                            <div className="pb-1">
                                                <h4 className="text-white font-bold text-sm leading-none">{exp.role}</h4>
                                                <p className="text-gray-400 text-xs mt-1">{exp.org}</p>
                                                <span className="text-[10px] text-scout-highlight/80 font-mono mt-1 block">{exp.duration}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-xs text-gray-500 italic">No experience listed. Add details in edit mode.</p>
                            )}
                        </div>

                        {/* Upcoming Agenda - NEW FEATURE */}
                        <div className="bg-scout-800 rounded-xl border border-scout-700 p-6">
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                <Clock size={16} /> Upcoming Agenda
                            </h3>
                            {upcomingEvents.length > 0 ? (
                                <div className="space-y-3">
                                    {upcomingEvents.map((evt, i) => (
                                        <div key={i} className="flex items-center gap-4 bg-scout-900/50 p-2 rounded border border-scout-700 hover:border-scout-500 transition-colors">
                                            <div className="bg-scout-800 rounded px-3 py-1 text-center min-w-[50px] border border-scout-600">
                                                <div className="text-[10px] text-scout-accent font-bold uppercase">{new Date(evt.date).toLocaleString('default', { month: 'short' })}</div>
                                                <div className="text-lg font-bold text-white leading-none">{new Date(evt.date).getDate() + 1}</div>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="text-sm font-bold text-white truncate">{evt.title}</h4>
                                                <div className="flex items-center gap-2 text-[10px] text-gray-400 mt-0.5">
                                                    <span className="flex items-center gap-1"><MapPin size={10}/> {evt.location}</span>
                                                    <span className={`px-1.5 rounded text-gray-300 ${evt.role === 'HOST' ? 'bg-orange-900/30 text-orange-400' : 'bg-green-900/30 text-green-400'}`}>
                                                        {evt.role === 'HOST' ? 'Hosting' : 'Attending'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    <div className="text-center mt-3">
                                        <button className="text-xs text-scout-accent hover:underline flex items-center justify-center gap-1">
                                            View Full Calendar <ChevronRight size={10}/>
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-6 text-gray-500">
                                    <Calendar size={24} className="mx-auto mb-2 opacity-50"/>
                                    <p className="text-xs">No upcoming events.</p>
                                    <p className="text-[10px]">Add events to your calendar to stay active.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Momentum Feed */}
                    <div className="bg-scout-900 border border-scout-700 rounded-xl p-6 relative">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <TrendingUp size={20} className="text-scout-highlight" /> Recent Momentum
                            </h3>
                            <span className="text-xs text-gray-500">Last 30 Days</span>
                        </div>
                        <div className="relative pl-4 space-y-0">
                            <div className="absolute top-2 bottom-6 left-[27px] w-0.5 bg-scout-800"></div>
                            {momentum.length > 0 ? momentum.map((item, idx) => (
                                <div key={`${item.type}-${item.id}`} className="relative flex gap-4 pb-8 last:pb-0 group">
                                    <div className={`w-8 h-8 rounded-full border-2 border-scout-900 shrink-0 flex items-center justify-center relative z-10 ${item.bg} ${item.color}`}>
                                        <item.icon size={14} />
                                    </div>
                                    <div className="flex-1 pt-1">
                                        <div className="flex justify-between items-start">
                                            <h4 className="text-sm font-bold text-white group-hover:text-scout-accent transition-colors">{item.title}</h4>
                                            <span className="text-[10px] text-gray-500 font-mono">{item.date.toLocaleDateString()}</span>
                                        </div>
                                        <p className="text-xs text-gray-400 mt-0.5">{item.subtitle}</p>
                                    </div>
                                </div>
                            )) : (
                                <div className="text-center py-8 text-gray-500">
                                    <Clock size={32} className="mx-auto mb-2 opacity-50"/>
                                    <p className="text-sm">No recent activity.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </>
            ) : (
                /* EDIT MODE FORM */
                <div className="bg-scout-800 border border-scout-700 rounded-xl p-6 space-y-8 animate-fade-in">
                    
                    {/* Basic Info */}
                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Full Name</label>
                            <input 
                                className="w-full bg-scout-900 border border-scout-600 rounded p-3 text-white focus:outline-none focus:border-scout-accent"
                                value={formData.name}
                                onChange={(e) => handleInputChange('name', e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Role / Title</label>
                            <input 
                                className="w-full bg-scout-900 border border-scout-600 rounded p-3 text-white focus:outline-none focus:border-scout-accent"
                                value={formData.role}
                                onChange={(e) => handleInputChange('role', e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Region</label>
                            <input 
                                className="w-full bg-scout-900 border border-scout-600 rounded p-3 text-white focus:outline-none focus:border-scout-accent"
                                value={formData.region}
                                onChange={(e) => handleInputChange('region', e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Affiliation</label>
                            <input 
                                className="w-full bg-scout-900 border border-scout-600 rounded p-3 text-white focus:outline-none focus:border-scout-accent"
                                value={formData.affiliation || ''}
                                onChange={(e) => handleInputChange('affiliation', e.target.value)}
                                placeholder="Club, Agency, or Independent"
                            />
                        </div>
                    </div>

                    {/* Bio with AI */}
                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <label className="block text-xs font-bold text-gray-500 uppercase">Professional Bio</label>
                            <button 
                                onClick={handleAiDraftBio}
                                disabled={aiLoading}
                                className="text-xs bg-scout-accent/10 text-scout-accent hover:bg-scout-accent hover:text-white px-2 py-1 rounded transition-colors flex items-center gap-1 font-bold border border-scout-accent/30"
                            >
                                {aiLoading ? <Loader2 size={12} className="animate-spin"/> : <Sparkles size={12} />}
                                Auto-Draft Bio with AI
                            </button>
                        </div>
                        <textarea 
                            className="w-full bg-scout-900 border border-scout-600 rounded p-3 text-white focus:outline-none focus:border-scout-accent h-32 resize-none"
                            value={formData.bio || ''}
                            onChange={(e) => handleInputChange('bio', e.target.value)}
                            placeholder="Tell us about your scouting philosophy and background..."
                        />
                    </div>

                    {/* Experience Editor */}
                    <div>
                        <div className="flex justify-between items-center mb-3">
                            <label className="block text-xs font-bold text-gray-500 uppercase">Experience Timeline</label>
                            <button onClick={addExperience} className="text-xs text-scout-accent hover:underline flex items-center gap-1">
                                <Plus size={12} /> Add Role
                            </button>
                        </div>
                        <div className="space-y-3">
                            {(formData.experience || []).map((exp, i) => (
                                <div key={exp.id} className="grid grid-cols-12 gap-2 items-start bg-scout-900 p-2 rounded border border-scout-700">
                                    <div className="col-span-4">
                                        <input 
                                            placeholder="Role (e.g. Head Scout)"
                                            className="w-full bg-transparent text-sm text-white placeholder-gray-600 focus:outline-none"
                                            value={exp.role}
                                            onChange={(e) => updateExperience(exp.id, 'role', e.target.value)}
                                        />
                                    </div>
                                    <div className="col-span-4">
                                        <input 
                                            placeholder="Organization"
                                            className="w-full bg-transparent text-sm text-gray-300 placeholder-gray-600 focus:outline-none border-l border-scout-700 pl-2"
                                            value={exp.org}
                                            onChange={(e) => updateExperience(exp.id, 'org', e.target.value)}
                                        />
                                    </div>
                                    <div className="col-span-3">
                                        <input 
                                            placeholder="Years (e.g. 2019-2022)"
                                            className="w-full bg-transparent text-sm text-gray-400 placeholder-gray-600 focus:outline-none border-l border-scout-700 pl-2"
                                            value={exp.duration}
                                            onChange={(e) => updateExperience(exp.id, 'duration', e.target.value)}
                                        />
                                    </div>
                                    <div className="col-span-1 flex justify-end">
                                        <button onClick={() => removeExperience(exp.id)} className="text-gray-600 hover:text-red-400">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {(!formData.experience || formData.experience.length === 0) && (
                                <div className="text-center p-4 border border-dashed border-scout-700 rounded text-xs text-gray-500">
                                    No experience listed. Add your history to build trust.
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Certifications Editor */}
                    <div>
                        <div className="flex justify-between items-center mb-3">
                            <label className="block text-xs font-bold text-gray-500 uppercase">Certifications & Licenses</label>
                            <button onClick={addCertification} className="text-xs text-scout-accent hover:underline flex items-center gap-1">
                                <Plus size={12} /> Add Cert
                            </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {(formData.certifications || []).map((cert, i) => (
                                <div key={i} className="flex items-center bg-scout-900 border border-scout-600 rounded px-2 py-1">
                                    <input 
                                        className="bg-transparent text-sm text-white focus:outline-none w-32"
                                        value={cert}
                                        placeholder="License Name"
                                        onChange={(e) => updateCertification(i, e.target.value)}
                                    />
                                    <button onClick={() => removeCertification(i)} className="ml-2 text-gray-500 hover:text-red-400">
                                        <X size={12} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
            )}

        </div>

      </div>
    </div>
  );
};

export default ProfileTab;