import React, { useState } from 'react';
import { ScoutingEvent, UserProfile, EventStatus } from '../types';
import { generateEventPlan } from '../services/geminiService';
import { 
  Calendar, MapPin, Sparkles, Plus, Copy, CheckCircle, 
  Share2, Users, FileText, CheckSquare, Loader2, ArrowRight,
  ClipboardList, X, ExternalLink, ShieldCheck, Lock, AlertCircle, Eye,
  HelpCircle, Clock
} from 'lucide-react';

interface EventHubProps {
  events: ScoutingEvent[];
  user: UserProfile;
  onAddEvent: (event: ScoutingEvent) => void;
  onUpdateEvent: (event: ScoutingEvent) => void;
}

// Mock Data for "Inspiration" / Overview
const MOCK_OPPORTUNITIES: ScoutingEvent[] = [
    {
        id: 'global-1',
        isMine: false,
        status: 'Published',
        title: 'Dallas Cup 2024',
        date: '2024-04-14',
        location: 'Dallas, TX',
        type: 'Tournament',
        fee: 'N/A',
        registeredCount: 400
    },
    {
        id: 'global-2',
        isMine: false,
        status: 'Published',
        title: 'Surf Cup Summer',
        date: '2024-07-25',
        location: 'San Diego, CA',
        type: 'Tournament',
        fee: 'N/A',
        registeredCount: 600
    },
    {
        id: 'global-3',
        isMine: false,
        status: 'Published',
        title: 'WARUBI Germany Showcase',
        date: '2024-08-10',
        location: 'Frankfurt, DE',
        type: 'Showcase',
        fee: '€150',
        registeredCount: 85
    }
];

const EventHub: React.FC<EventHubProps> = ({ events, user, onAddEvent, onUpdateEvent }) => {
  const [view, setView] = useState<'list' | 'create' | 'detail'>('list');
  const [selectedEvent, setSelectedEvent] = useState<ScoutingEvent | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState('');
  const [showGuide, setShowGuide] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    location: '',
    date: '',
    type: 'ID Day',
    fee: 'Free'
  });

  const handleCreate = async () => {
    if (!formData.title || !formData.date || !formData.location) return;
    setLoading(true);

    const newId = Date.now().toString();
    const baseEvent: ScoutingEvent = {
        id: newId,
        isMine: true,
        status: 'Draft', // Start as Draft
        title: formData.title,
        location: formData.location,
        date: formData.date,
        type: formData.type as any,
        fee: formData.fee,
        registeredCount: 0,
        marketingCopy: '',
        agenda: [],
        checklist: []
    };

    try {
        const plan = await generateEventPlan(formData.title, formData.location, formData.date, formData.type, formData.fee);
        const finalEvent = { ...baseEvent, ...plan };
        
        onAddEvent(finalEvent);
        setSelectedEvent(finalEvent);
        setView('detail');
        setFormData({ title: '', location: '', date: '', type: 'ID Day', fee: 'Free' });
    } catch (e) {
        onAddEvent(baseEvent);
        setSelectedEvent(baseEvent);
        setView('detail');
    } finally {
        setLoading(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
      navigator.clipboard.writeText(text);
      setCopied(id);
      setTimeout(() => setCopied(''), 2000);
  };

  // Workflow Actions
  const submitForApproval = () => {
      if (!selectedEvent) return;
      const updated = { ...selectedEvent, status: 'Pending Approval' as EventStatus };
      onUpdateEvent(updated);
      setSelectedEvent(updated);
  };

  // Demo function to simulate HQ approving
  const simulateHQApproval = () => {
    if (!selectedEvent) return;
    const updated = { ...selectedEvent, status: 'Approved' as EventStatus };
    onUpdateEvent(updated);
    setSelectedEvent(updated);
  };

  const publishEvent = () => {
      if (!selectedEvent) return;
      const updated = { ...selectedEvent, status: 'Published' as EventStatus };
      onUpdateEvent(updated);
      setSelectedEvent(updated);
  };

  const StatusPill = ({ status }: { status: EventStatus }) => {
      const styles = {
          'Draft': 'bg-gray-700 text-gray-300 border-gray-600',
          'Pending Approval': 'bg-yellow-500/20 text-yellow-500 border-yellow-500/50',
          'Approved': 'bg-blue-500/20 text-blue-400 border-blue-500/50',
          'Published': 'bg-green-500/20 text-green-400 border-green-500/50',
          'Completed': 'bg-gray-800 text-gray-500 border-gray-700',
          'Rejected': 'bg-red-500/20 text-red-400 border-red-500/50',
      };
      return (
          <span className={`px-2 py-1 rounded text-[10px] uppercase font-bold tracking-wider border ${styles[status] || styles['Draft']}`}>
              {status}
          </span>
      );
  };

  // --- SUB-COMPONENTS ---

  const HostGuideModal = () => (
     <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
        <div className="bg-scout-800 w-full max-w-2xl rounded-2xl border border-scout-700 shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
            <div className="p-4 border-b border-scout-700 flex justify-between items-center bg-scout-900">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <HelpCircle size={20} className="text-scout-accent"/> Host Guide & FAQ
                </h2>
                <button onClick={() => setShowGuide(false)} className="text-gray-400 hover:text-white">
                    <X size={24} />
                </button>
            </div>
            <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">
                <section>
                    <h3 className="text-lg font-bold text-white mb-2">Why Host an Event?</h3>
                    <p className="text-gray-400 text-sm">
                        Events are the most effective way to identify new talent and build your reputation as a scout. 
                        Hosted ID days allow you to see players in person, verify their data, and build relationships with families.
                    </p>
                </section>

                <div className="grid md:grid-cols-2 gap-6">
                    <section className="bg-scout-900 p-4 rounded-lg border border-scout-700">
                        <h3 className="font-bold text-white mb-2 flex items-center gap-2"><CheckCircle size={16} className="text-green-500"/> Good Proposals</h3>
                        <ul className="list-disc list-inside text-sm text-gray-400 space-y-1">
                            <li>Confirmed venue availability</li>
                            <li>Clear target age group</li>
                            <li>Realistic participant estimates</li>
                            <li>Detailed budget breakdown</li>
                        </ul>
                    </section>
                     <section className="bg-scout-900 p-4 rounded-lg border border-scout-700">
                        <h3 className="font-bold text-white mb-2 flex items-center gap-2"><Clock size={16} className="text-orange-500"/> Timeline Rules</h3>
                        <ul className="list-disc list-inside text-sm text-gray-400 space-y-1">
                            <li>Minimum <strong>4 weeks</strong> notice required</li>
                            <li>Allow 1 week for HQ approval</li>
                            <li>Marketing launch 3 weeks prior</li>
                        </ul>
                    </section>
                </div>

                <section>
                     <h3 className="font-bold text-white mb-2">Branding & Standards</h3>
                     <p className="text-gray-400 text-sm mb-2">
                        All events must maintain the professional standard of FC Köln and WARUBI Sports.
                     </p>
                     <ul className="list-disc list-inside text-sm text-gray-400 space-y-1">
                        <li>Use only approved marketing assets generated by the platform.</li>
                        <li>Coaches must wear official gear.</li>
                        <li>Data collection via the official app is mandatory.</li>
                    </ul>
                </section>

                <div className="bg-scout-900/50 p-4 rounded-lg border border-scout-700 mt-4">
                    <p className="text-sm text-gray-400">
                        <strong>Need Support?</strong> Contact the events team at <a href="mailto:events@warubi-sports.com" className="text-scout-accent hover:underline">events@warubi-sports.com</a>
                    </p>
                </div>
            </div>
            <div className="p-4 border-t border-scout-700 bg-scout-900 flex justify-end">
                <button 
                    onClick={() => setShowGuide(false)}
                    className="bg-white hover:bg-gray-100 text-scout-900 font-bold py-2 px-6 rounded-lg transition-colors"
                >
                    Got it
                </button>
            </div>
        </div>
     </div>
  );

  const DetailView = ({ event }: { event: ScoutingEvent }) => {
      const isMine = event.isMine;

      return (
        <div className="h-full flex flex-col animate-fade-in">
            <div className="flex items-center gap-2 mb-4">
                <button onClick={() => setView('list')} className="text-gray-400 hover:text-white flex items-center gap-1 text-sm">
                    <X size={16} /> Back to Overview
                </button>
                <span className="text-gray-600">/</span>
                <span className="text-gray-300 font-medium">{event.title}</span>
            </div>

            <div className="bg-scout-800 border border-scout-700 rounded-xl overflow-hidden flex flex-col md:flex-row shadow-2xl">
                
                {/* LEFT: Event Overview & Actions */}
                <div className="md:w-1/3 p-6 border-b md:border-b-0 md:border-r border-scout-700 bg-scout-800/50 flex flex-col justify-between">
                    <div>
                        <div className="mb-6">
                            <StatusPill status={event.status} />
                            <h2 className="text-2xl font-bold text-white mt-2 mb-1">{event.title}</h2>
                            <div className="space-y-2 text-sm text-gray-400 mt-4">
                                <div className="flex items-center gap-2"><Calendar size={14}/> {event.date}</div>
                                <div className="flex items-center gap-2"><MapPin size={14}/> {event.location}</div>
                                <div className="flex items-center gap-2"><Sparkles size={14}/> {event.type} • {event.fee}</div>
                            </div>
                        </div>

                        {/* WORKFLOW ACTIONS */}
                        {isMine ? (
                            <div className="space-y-4">
                                {/* DRAFT -> SUBMIT */}
                                {event.status === 'Draft' && (
                                    <div className="bg-scout-900/50 p-4 rounded-lg border border-scout-700">
                                        <h4 className="text-white font-bold text-sm mb-2">Step 1: Planning</h4>
                                        <p className="text-xs text-gray-400 mb-4">Review the AI generated plan. When ready, submit to Warubi HQ for approval.</p>
                                        <button 
                                            onClick={submitForApproval}
                                            className="w-full bg-scout-700 hover:bg-scout-600 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-all border border-scout-600"
                                        >
                                            <ShieldCheck size={18} /> Submit for Approval
                                        </button>
                                    </div>
                                )}

                                {/* PENDING -> APPROVED (Simulated) */}
                                {event.status === 'Pending Approval' && (
                                    <div className="bg-yellow-500/10 p-4 rounded-lg border border-yellow-500/30">
                                        <h4 className="text-yellow-500 font-bold text-sm mb-2 flex items-center gap-2"><Loader2 size={14} className="animate-spin"/> Under Review</h4>
                                        <p className="text-xs text-yellow-200/70 mb-4">HQ is reviewing your proposal. You will be notified once approved.</p>
                                        
                                        {/* DEMO BUTTON */}
                                        <button 
                                            onClick={simulateHQApproval}
                                            className="w-full bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 font-bold py-2 rounded text-xs transition-all border border-yellow-500/50 uppercase tracking-wider"
                                        >
                                            (Demo: HQ Approve)
                                        </button>
                                    </div>
                                )}

                                {/* APPROVED -> PUBLISHED */}
                                {event.status === 'Approved' && (
                                    <div className="bg-blue-500/10 p-4 rounded-lg border border-blue-500/30">
                                        <h4 className="text-blue-400 font-bold text-sm mb-2 flex items-center gap-2"><CheckCircle size={14}/> Approved!</h4>
                                        <p className="text-xs text-blue-200/70 mb-4">Your event is approved. Publish it to go live and accept registrations.</p>
                                        <button 
                                            onClick={publishEvent}
                                            className="w-full bg-scout-accent hover:bg-emerald-600 text-white font-bold py-3 rounded-lg shadow-lg flex items-center justify-center gap-2 transition-all"
                                        >
                                            <Share2 size={18} /> Publish Event
                                        </button>
                                    </div>
                                )}

                                {/* PUBLISHED */}
                                {event.status === 'Published' && (
                                    <div className="bg-scout-900 p-4 rounded-lg border border-scout-700">
                                        <label className="text-xs text-gray-500 font-bold uppercase mb-2 block">Registration Link</label>
                                        <div className="flex gap-2">
                                            <input 
                                                readOnly 
                                                value={`warubi.com/e/${event.id}`} 
                                                className="bg-scout-800 text-scout-accent text-sm px-2 rounded border border-scout-600 w-full"
                                            />
                                            <button 
                                                onClick={() => copyToClipboard(`https://warubi-sports.com/register?event=${event.id}`, 'link')}
                                                className="p-2 bg-scout-700 hover:bg-scout-600 rounded text-white"
                                            >
                                                {copied === 'link' ? <CheckCircle size={16}/> : <Copy size={16}/>}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            // View Only Actions for Global Events
                            <div className="bg-scout-900/50 p-4 rounded-lg border border-scout-700">
                                <p className="text-xs text-gray-400 mb-4">Interested in attending this event?</p>
                                <button className="w-full bg-scout-700 hover:bg-scout-600 text-white font-bold py-2 rounded-lg transition-all border border-scout-600 text-sm">
                                    Mark Attendance
                                </button>
                            </div>
                        )}
                    </div>

                    {isMine && (
                        <div className="grid grid-cols-2 gap-3 mt-6">
                            <div className="bg-scout-900 p-3 rounded border border-scout-700 text-center">
                                    <span className="block text-2xl font-bold text-white">{event.registeredCount}</span>
                                    <span className="text-[10px] text-gray-500 uppercase">Registered</span>
                            </div>
                            <div className="bg-scout-900 p-3 rounded border border-scout-700 text-center flex flex-col items-center justify-center">
                                    <Users size={20} className="text-gray-500 mb-1"/>
                                    <span className="text-[10px] text-gray-500 uppercase">View List</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* RIGHT: The Event Kit (Only visible for My Events, or public info for others) */}
                <div className="md:w-2/3 p-6 bg-scout-900 flex flex-col gap-6 overflow-y-auto max-h-[80vh] custom-scrollbar">
                    {isMine ? (
                        <>
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                    <ClipboardList className="text-scout-highlight" size={20} /> Event Kit
                                </h3>
                                {(event.status === 'Draft' || event.status === 'Pending Approval') && <span className="text-xs text-scout-highlight animate-pulse">Draft Preview</span>}
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between items-end">
                                    <label className="text-sm font-semibold text-gray-300 flex items-center gap-2"><FileText size={14}/> Marketing Blurb</label>
                                    {event.status === 'Published' && (
                                        <button 
                                            onClick={() => copyToClipboard(event.marketingCopy || '', 'marketing')}
                                            className="text-xs text-scout-accent hover:text-white flex items-center gap-1"
                                        >
                                            {copied === 'marketing' ? <CheckCircle size={12}/> : <Copy size={12}/>} Copy Text
                                        </button>
                                    )}
                                </div>
                                <textarea 
                                    readOnly 
                                    value={event.marketingCopy} 
                                    className="w-full h-32 bg-scout-800 border border-scout-700 rounded-lg p-3 text-sm text-gray-300 resize-none focus:outline-none"
                                />
                            </div>

                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <label className="text-sm font-semibold text-gray-300 flex items-center gap-2 mb-3"><Calendar size={14}/> Agenda</label>
                                    <ul className="space-y-2">
                                        {(event.agenda || []).map((item, i) => (
                                            <li key={i} className="flex items-start gap-2 text-sm text-gray-400">
                                                <span className="text-scout-accent font-mono text-xs mt-0.5">{item.split(' - ')[0]}</span>
                                                <span>{item.split(' - ')[1] || item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                
                                <div>
                                    <label className="text-sm font-semibold text-gray-300 flex items-center gap-2"><CheckSquare size={14}/> Scout Checklist</label>
                                    <ul className="space-y-2">
                                        {(event.checklist || []).map((item, i) => (
                                            <li key={i} className="flex items-center gap-2 text-sm text-gray-400 group cursor-pointer hover:text-white transition-colors">
                                                <div className="w-4 h-4 rounded border border-scout-600 group-hover:border-scout-accent flex items-center justify-center"></div>
                                                <span>{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </>
                    ) : (
                        // View for Global Events
                        <div className="flex flex-col items-center justify-center h-full text-center p-8 opacity-60">
                            <Lock size={48} className="text-gray-600 mb-4" />
                            <h3 className="text-xl font-bold text-gray-400">Restricted Access</h3>
                            <p className="text-sm text-gray-500 max-w-sm mt-2">You are viewing a global event. Marketing kits and admin tools are only available for the event host.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
      );
  };

  const EventCard: React.FC<{ event: ScoutingEvent }> = ({ event }) => (
    <div onClick={() => { setSelectedEvent(event); setView('detail'); }} className="bg-scout-800 rounded-xl p-5 border border-scout-700 hover:border-scout-500 hover:bg-scout-800/80 cursor-pointer transition-all shadow-lg group relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-scout-accent/5 rounded-bl-full -z-10 group-hover:bg-scout-accent/10 transition-colors"></div>
        
        <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 rounded-lg bg-scout-900 border border-scout-700 flex flex-col items-center justify-center text-center">
                <span className="text-[10px] text-red-500 font-bold uppercase">{new Date(event.date).toLocaleString('default', { month: 'short' })}</span>
                <span className="text-lg font-bold text-white leading-none">{new Date(event.date).getDate() + 1}</span>
            </div>
            <StatusPill status={event.status} />
        </div>

        <h3 className="text-lg font-bold text-white mb-1 group-hover:text-scout-accent transition-colors">{event.title}</h3>
        <p className="text-sm text-gray-400 flex items-center gap-1 mb-4"><MapPin size={12}/> {event.location}</p>

        <div className="border-t border-scout-700 pt-3 flex justify-between items-center text-xs text-gray-500">
            <span>{event.type}</span>
            <span className="flex items-center gap-1">
                {event.isMine ? <Users size={12}/> : <Eye size={12} />}
                {event.registeredCount} {event.isMine ? 'Registered' : 'Attending'}
            </span>
        </div>
    </div>
  );

  return (
    <div className="h-full relative">
        {showGuide && <HostGuideModal />}

        {view === 'list' && (
            <div className="space-y-8 animate-fade-in pb-8">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold text-white">Events Dashboard</h2>
                        <p className="text-gray-400">Manage your ID days or find upcoming opportunities.</p>
                    </div>
                    <div className="flex gap-3">
                        <button 
                            onClick={() => setShowGuide(true)}
                            className="text-gray-400 hover:text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors border border-transparent hover:border-scout-700 hover:bg-scout-800"
                        >
                            <HelpCircle size={18} /> How to Host
                        </button>
                        <button 
                            onClick={() => setView('create')}
                            className="bg-scout-accent hover:bg-emerald-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 shadow-lg"
                        >
                            <Plus size={18} /> Host New Event
                        </button>
                    </div>
                </div>

                {/* My Events Section */}
                <div className="space-y-4">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <Users className="text-scout-highlight" size={20} /> My Hosted Events
                    </h3>
                    
                    {events.length === 0 ? (
                        <div className="text-center py-10 border-2 border-dashed border-scout-700 rounded-2xl bg-scout-800/30">
                            <p className="text-gray-400 mb-4">You aren't hosting any events yet.</p>
                            <button onClick={() => setView('create')} className="text-scout-accent hover:underline font-bold text-sm">Create your first ID Day</button>
                        </div>
                    ) : (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {events.map(evt => (
                                <EventCard key={evt.id} event={evt} />
                            ))}
                        </div>
                    )}
                </div>

                {/* Global Opportunities Section */}
                <div className="space-y-4 pt-4 border-t border-scout-700">
                     <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <ExternalLink className="text-blue-400" size={20} /> Upcoming Opportunities
                        <span className="text-xs font-normal text-gray-500 ml-2 bg-scout-800 px-2 py-1 rounded">Curated by Warubi HQ</span>
                    </h3>
                    
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-80 hover:opacity-100 transition-opacity">
                         {MOCK_OPPORTUNITIES.map(evt => (
                             <EventCard key={evt.id} event={evt} />
                         ))}
                    </div>
                </div>
            </div>
        )}

        {view === 'create' && (
             <div className="max-w-2xl mx-auto animate-fade-in">
                 <button onClick={() => setView('list')} className="mb-6 text-gray-400 hover:text-white flex items-center gap-1 text-sm">
                    <X size={16} /> Cancel
                </button>

                <div className="bg-scout-800 rounded-2xl border border-scout-700 p-8 shadow-2xl">
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-scout-accent/20 rounded-full flex items-center justify-center mx-auto mb-4 text-scout-accent border border-scout-accent/30">
                            <Sparkles size={32} />
                        </div>
                        <h2 className="text-2xl font-bold text-white">Create New Event</h2>
                        <p className="text-gray-400 mt-2">Enter basic details. AI will generate your plan, then submit to HQ for approval.</p>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Event Name</label>
                            <input 
                                className="w-full bg-scout-900 border border-scout-600 rounded-lg p-3 text-white focus:border-scout-accent outline-none"
                                placeholder="e.g. Summer Talent ID Day"
                                value={formData.title}
                                onChange={e => setFormData({...formData, title: e.target.value})}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Date</label>
                                <input 
                                    type="date"
                                    className="w-full bg-scout-900 border border-scout-600 rounded-lg p-3 text-white focus:border-scout-accent outline-none"
                                    value={formData.date}
                                    onChange={e => setFormData({...formData, date: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Location</label>
                                <input 
                                    className="w-full bg-scout-900 border border-scout-600 rounded-lg p-3 text-white focus:border-scout-accent outline-none"
                                    placeholder="City or Venue"
                                    value={formData.location}
                                    onChange={e => setFormData({...formData, location: e.target.value})}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                             <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Event Type</label>
                                <select 
                                    className="w-full bg-scout-900 border border-scout-600 rounded-lg p-3 text-white focus:border-scout-accent outline-none"
                                    value={formData.type}
                                    onChange={e => setFormData({...formData, type: e.target.value})}
                                >
                                    <option>ID Day</option>
                                    <option>Showcase</option>
                                    <option>Camp</option>
                                    <option>Clinic</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Player Fee</label>
                                <input 
                                    className="w-full bg-scout-900 border border-scout-600 rounded-lg p-3 text-white focus:border-scout-accent outline-none"
                                    placeholder="$50 or Free"
                                    value={formData.fee}
                                    onChange={e => setFormData({...formData, fee: e.target.value})}
                                />
                            </div>
                        </div>
                        
                        <div className="bg-scout-900/50 p-3 rounded border border-scout-700 flex items-start gap-2 text-xs text-gray-400 mt-2">
                             <AlertCircle size={16} className="shrink-0 mt-0.5" />
                             <p>All events must be approved by Warubi HQ to ensure quality standards. You will receive an email once your proposal is reviewed.</p>
                        </div>

                        <button 
                            onClick={handleCreate}
                            disabled={loading || !formData.title}
                            className="w-full mt-4 bg-scout-accent hover:bg-emerald-600 disabled:opacity-50 text-white font-bold py-4 rounded-lg shadow-lg flex items-center justify-center gap-2 transition-all"
                        >
                            {loading ? <Loader2 className="animate-spin" /> : <>Generate Plan & Preview <ArrowRight size={18}/></>}
                        </button>
                    </div>
                </div>
             </div>
        )}

        {view === 'detail' && selectedEvent && <DetailView event={selectedEvent} />}
    </div>
  );
};

export default EventHub;