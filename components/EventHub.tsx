import React, { useState } from 'react';
import { ScoutingEvent, UserProfile, EventStatus } from '../types';
import { generateEventPlan } from '../services/geminiService';
import { 
  Calendar, MapPin, Sparkles, Plus, Copy, CheckCircle, 
  Share2, Users, FileText, CheckSquare, Loader2, ArrowRight,
  ClipboardList, X, ExternalLink, ShieldCheck, Lock, AlertCircle, Eye,
  HelpCircle, Clock, Check, Settings, QrCode
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
        role: 'ATTENDEE',
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
        role: 'ATTENDEE',
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
        role: 'ATTENDEE',
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
  const [attendingEvent, setAttendingEvent] = useState<ScoutingEvent | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState('');
  const [showGuide, setShowGuide] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    location: '',
    date: '',
    type: 'ID Day',
    fee: 'Free',
    isHosting: true
  });

  const handleCreate = async () => {
    if (!formData.title || !formData.date || !formData.location) return;
    setLoading(true);

    const newId = Date.now().toString();
    const baseEvent: ScoutingEvent = {
        id: newId,
        isMine: formData.isHosting,
        role: formData.isHosting ? 'HOST' : 'ATTENDEE',
        status: formData.isHosting ? 'Draft' : 'Published', // Attended events are usually active/past
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
        // Only generate AI plan if Hosting
        if (formData.isHosting) {
            const plan = await generateEventPlan(formData.title, formData.location, formData.date, formData.type, formData.fee);
            const finalEvent = { ...baseEvent, ...plan };
            onAddEvent(finalEvent);
            setSelectedEvent(finalEvent);
        } else {
            // Just add the attended event
            onAddEvent(baseEvent);
            setSelectedEvent(baseEvent);
        }
        
        setView('detail');
        setFormData({ title: '', location: '', date: '', type: 'ID Day', fee: 'Free', isHosting: true });
    } catch (e) {
        onAddEvent(baseEvent);
        setSelectedEvent(baseEvent);
        setView('detail');
    } finally {
        setLoading(false);
    }
  };

  const initiateAttendance = (eventToMark: ScoutingEvent) => {
      // Improved Duplicate Check: Check by ID OR (Title + Date) to prevent re-adding global events
      const isAlreadyAdded = events.some(e => 
          e.id === eventToMark.id || 
          (e.title === eventToMark.title && e.date === eventToMark.date)
      );

      if (isAlreadyAdded) {
          alert("You are already scheduled for this event.");
          return;
      }
      setAttendingEvent(eventToMark);
  };

  const confirmAttendance = () => {
      if (!attendingEvent) return;

      const newEvent: ScoutingEvent = {
          ...attendingEvent,
          id: `${attendingEvent.id}-${Date.now()}`, // Ensure unique ID for personal list
          isMine: false,
          role: 'ATTENDEE',
          status: 'Published' // Ensure it's active in your list
      };
      
      onAddEvent(newEvent);
      setAttendingEvent(null);
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

  const AttendancePrepModal = () => (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-scout-800 w-full max-w-md rounded-2xl border border-scout-700 shadow-2xl overflow-hidden flex flex-col">
              <div className="p-6 bg-gradient-to-br from-scout-900 to-scout-800 border-b border-scout-700 text-center">
                  <div className="w-12 h-12 bg-scout-accent/20 rounded-full flex items-center justify-center text-scout-accent mb-4 border border-scout-accent/30 mx-auto">
                      <CheckCircle size={24} />
                  </div>
                  <h3 className="text-xl font-bold text-white">Confirm Attendance</h3>
                  <p className="text-gray-400 text-sm mt-1">Make the most of {attendingEvent?.title}.</p>
              </div>

              <div className="p-6 space-y-4 bg-scout-800">
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Scout Action Checklist</h4>
                  
                  <div className="flex gap-4 items-start group">
                      <div className="mt-1 p-2 bg-scout-900 rounded-lg border border-scout-700 text-blue-400 group-hover:border-blue-500/50 transition-colors">
                          <ClipboardList size={18} />
                      </div>
                      <div>
                          <h4 className="font-bold text-white text-sm">Get the Roster</h4>
                          <p className="text-xs text-gray-400 leading-snug">Do you have the player list with jersey numbers and contact info?</p>
                      </div>
                  </div>

                  <div className="flex gap-4 items-start group">
                      <div className="mt-1 p-2 bg-scout-900 rounded-lg border border-scout-700 text-scout-highlight group-hover:border-scout-highlight/50 transition-colors">
                          <QrCode size={18} />
                      </div>
                      <div>
                          <h4 className="font-bold text-white text-sm">Prepare Assessment Tool</h4>
                          <p className="text-xs text-gray-400 leading-snug">Have your Warubi QR code ready for players to scan instantly.</p>
                      </div>
                  </div>

                  <div className="flex gap-4 items-start group">
                      <div className="mt-1 p-2 bg-scout-900 rounded-lg border border-scout-700 text-green-400 group-hover:border-green-500/50 transition-colors">
                          <Users size={18} />
                      </div>
                      <div>
                          <h4 className="font-bold text-white text-sm">Ask the Coach</h4>
                          <p className="text-xs text-gray-400 leading-snug">Identify top 2-3 players of each team by asking the coach directly.</p>
                      </div>
                  </div>
              </div>

              <div className="p-4 bg-scout-900 flex gap-3 border-t border-scout-700">
                  <button onClick={() => setAttendingEvent(null)} className="flex-1 py-3 text-gray-400 hover:text-white text-sm font-medium transition-colors">Cancel</button>
                  <button onClick={confirmAttendance} className="flex-[2] bg-scout-accent hover:bg-emerald-600 text-white font-bold py-3 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2">
                      Got it, Add to Schedule
                  </button>
              </div>
          </div>
      </div>
  );

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
     </div>
  );

  const DetailView = ({ event }: { event: ScoutingEvent }) => {
      const isMine = event.role === 'HOST' || event.isMine;
      // Check if attending (either it is in my list OR I am the host)
      const isAttending = isMine || events.some(e => e.id === event.id || (e.title === event.title && e.date === event.date));

      const toggleChecklist = (index: number) => {
          if (!event.checklist) return;
          const newChecklist = [...event.checklist];
          newChecklist[index].completed = !newChecklist[index].completed;
          onUpdateEvent({ ...event, checklist: newChecklist });
      };

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
                            <div className="flex justify-between items-start">
                                <StatusPill status={event.status} />
                                {!isMine && isAttending && (
                                    <span className="text-[10px] font-bold bg-green-900/30 text-green-400 px-2 py-1 rounded border border-green-500/30 flex items-center gap-1">
                                        <Check size={10}/> Attending
                                    </span>
                                )}
                            </div>
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
                            // View Only Actions for Global Events or Attended Events
                            <div className="bg-scout-900/50 p-4 rounded-lg border border-scout-700">
                                {!isAttending ? (
                                    <>
                                        <p className="text-xs text-gray-400 mb-4">Interested in scouting at this event?</p>
                                        <button 
                                            onClick={() => initiateAttendance(event)}
                                            className="w-full bg-scout-700 hover:bg-scout-600 text-white font-bold py-2 rounded-lg transition-all border border-scout-600 text-sm"
                                        >
                                            Mark Attendance
                                        </button>
                                    </>
                                ) : (
                                    <div className="text-center py-2">
                                        <div className="inline-block p-2 bg-green-500/10 rounded-full text-green-400 mb-2">
                                            <CheckCircle size={24} />
                                        </div>
                                        <p className="text-white font-bold text-sm">Attendance Logged</p>
                                        <p className="text-xs text-gray-500">This event is in your schedule.</p>
                                    </div>
                                )}
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
                                    <label className="text-sm font-semibold text-gray-300 flex items-center gap-2 mb-2"><CheckSquare size={14}/> Scout Checklist</label>
                                    <ul className="space-y-2">
                                        {(event.checklist || []).map((item, i) => (
                                            <li key={i} onClick={() => toggleChecklist(i)} className="flex items-center gap-2 text-sm group cursor-pointer hover:bg-scout-800 p-1.5 rounded transition-colors">
                                                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${item.completed ? 'bg-scout-accent border-scout-accent' : 'border-scout-600 group-hover:border-scout-accent'}`}>
                                                    {item.completed && <Check size={12} className="text-scout-900" />}
                                                </div>
                                                <span className={item.completed ? 'text-gray-600 line-through' : 'text-gray-300 group-hover:text-white'}>{item.task}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </>
                    ) : isAttending ? (
                        <div className="space-y-6">
                            <div className="bg-scout-800/50 p-4 rounded-lg border border-scout-700">
                                <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-2">
                                    <CheckCircle className="text-green-400" size={20} /> Scout Mission
                                </h3>
                                <p className="text-sm text-gray-400">
                                    You are registered for this event. Focus on these high-impact actions to maximize your scouting trip.
                                </p>
                            </div>

                            <div className="space-y-4">
                                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Action Checklist</h4>
                                
                                <div className="flex gap-4 items-start group bg-scout-800 p-4 rounded-xl border border-scout-700 hover:border-blue-500/50 transition-colors">
                                    <div className="mt-1 p-2 bg-scout-900 rounded-lg border border-scout-700 text-blue-400">
                                        <ClipboardList size={20} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-white text-base">Get the Roster</h4>
                                        <p className="text-sm text-gray-400 mt-1">Locate the tournament director tent or check the event app. Ensure you have jersey numbers.</p>
                                    </div>
                                </div>

                                <div className="flex gap-4 items-start group bg-scout-800 p-4 rounded-xl border border-scout-700 hover:border-scout-highlight/50 transition-colors">
                                    <div className="mt-1 p-2 bg-scout-900 rounded-lg border border-scout-700 text-scout-highlight">
                                        <QrCode size={20} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-white text-base">Prepare Assessment Tool</h4>
                                        <p className="text-sm text-gray-400 mt-1">Have your digital evaluation form ready. Use the QR code to let players self-register if allowed.</p>
                                    </div>
                                </div>

                                <div className="flex gap-4 items-start group bg-scout-800 p-4 rounded-xl border border-scout-700 hover:border-green-500/50 transition-colors">
                                    <div className="mt-1 p-2 bg-scout-900 rounded-lg border border-scout-700 text-green-400">
                                        <Users size={20} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-white text-base">Ask the Coach</h4>
                                        <p className="text-sm text-gray-400 mt-1">"Who is your most consistent player?" Identify top 2-3 players of each team by asking the coach directly.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        // View for Global Events (Restricted)
                        <div className="flex flex-col items-center justify-center h-full text-center p-8 opacity-60">
                            <Lock size={48} className="text-gray-600 mb-4" />
                            <h3 className="text-xl font-bold text-gray-400">Host Access Only</h3>
                            <p className="text-sm text-gray-500 max-w-sm mt-2">Marketing kits and admin tools are only available for the event host.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
      );
  };

  const EventCard: React.FC<{ event: ScoutingEvent }> = ({ event }) => {
    const isHost = event.role === 'HOST' || event.isMine;

    return (
        <div 
            onClick={() => { setSelectedEvent(event); setView('detail'); }} 
            className={`rounded-xl p-5 border transition-all shadow-lg cursor-pointer group relative overflow-hidden flex flex-col justify-between
            ${isHost 
                ? 'bg-gradient-to-br from-scout-800 to-[#1a2c38] border-scout-accent/60 hover:border-scout-accent hover:shadow-scout-accent/20 h-full min-h-[220px]' 
                : 'bg-scout-800 border-scout-700 hover:border-scout-500 hover:bg-scout-800/80 h-full min-h-[220px]'
            }`}
        >
            {/* Host Indicator Line */}
            {isHost && <div className="absolute top-0 left-0 w-full h-1.5 bg-scout-accent shadow-[0_0_15px_rgba(16,185,129,0.4)]"></div>}
            
            {/* Background Decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/5 to-transparent rounded-bl-full -z-10 pointer-events-none"></div>
            
            <div>
                <div className="flex justify-between items-start mb-4 relative z-10">
                    <div className={`w-12 h-12 rounded-lg border flex flex-col items-center justify-center text-center shadow-lg ${isHost ? 'bg-scout-900 border-scout-accent/30' : 'bg-scout-900 border-scout-700'}`}>
                        <span className={`text-[10px] font-bold uppercase ${isHost ? 'text-scout-accent' : 'text-red-500'}`}>
                            {new Date(event.date).toLocaleString('default', { month: 'short' })}
                        </span>
                        <span className="text-lg font-bold text-white leading-none">{new Date(event.date).getDate() + 1}</span>
                    </div>
                    {isHost ? (
                        <div className="flex flex-col items-end gap-1">
                            <StatusPill status={event.status} />
                            <span className="text-[9px] font-bold bg-scout-accent text-scout-900 px-2 py-0.5 rounded shadow-sm">HOSTING</span>
                        </div>
                    ) : (
                        <div className="flex flex-col items-end gap-1">
                            <StatusPill status={event.status} />
                            {/* <span className="text-[9px] font-bold bg-blue-900/30 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded">ATTENDING</span> */}
                        </div>
                    )}
                </div>

                <h3 className={`text-xl font-bold mb-1 leading-tight group-hover:text-scout-accent transition-colors ${isHost ? 'text-white' : 'text-gray-200'}`}>
                    {event.title}
                </h3>
                <p className="text-sm text-gray-400 flex items-center gap-1 mb-4"><MapPin size={12}/> {event.location}</p>
            </div>

            <div className={`border-t pt-3 flex justify-between items-center text-xs ${isHost ? 'border-scout-600/50' : 'border-scout-700'}`}>
                <span className="text-gray-400">{event.type}</span>
                {isHost ? (
                    <div className="flex items-center gap-2 text-scout-accent font-bold">
                        <Settings size={14} /> Manage Event
                    </div>
                ) : (
                    <span className="flex items-center gap-1 text-gray-500">
                        {event.role === 'HOST' ? <Users size={12}/> : <Eye size={12} />}
                        {event.role === 'HOST' ? `${event.registeredCount} Registered` : 'View Details'}
                    </span>
                )}
            </div>
        </div>
    );
  };

  return (
    <div className="h-full relative">
        {showGuide && <HostGuideModal />}
        {attendingEvent && <AttendancePrepModal />}

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
                            <Plus size={18} /> Add Event
                        </button>
                    </div>
                </div>

                {/* My Events Section */}
                <div className="space-y-4">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <Users className="text-scout-highlight" size={20} /> My Schedule
                    </h3>
                    
                    {events.length === 0 ? (
                        <div className="text-center py-10 border-2 border-dashed border-scout-700 rounded-2xl bg-scout-800/30">
                            <p className="text-gray-400 mb-4">Your schedule is empty.</p>
                            <button onClick={() => setView('create')} className="text-scout-accent hover:underline font-bold text-sm">Host an ID Day or Add Event</button>
                        </div>
                    ) : (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {/* Sort Hosted Events First */}
                            {[...events].sort((a, b) => {
                                const aHost = a.role === 'HOST' || a.isMine;
                                const bHost = b.role === 'HOST' || b.isMine;
                                if (aHost && !bHost) return -1;
                                if (!aHost && bHost) return 1;
                                return new Date(a.date).getTime() - new Date(b.date).getTime();
                            }).map(evt => (
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
                         {MOCK_OPPORTUNITIES.map(evt => {
                             // Check if already added
                             const isAdded = events.some(e => 
                                 e.id === evt.id || 
                                 (e.title === evt.title && e.date === evt.date)
                             );
                             
                             return (
                                 <div key={evt.id} className="relative group">
                                     {isAdded && (
                                         <div className="absolute inset-0 z-20 bg-scout-900/80 backdrop-blur-[1px] flex items-center justify-center rounded-xl border border-green-500/30">
                                             <div className="text-green-400 font-bold flex items-center gap-2 bg-scout-900 px-4 py-2 rounded-full border border-green-500/50 shadow-lg">
                                                 <CheckCircle size={18} /> Added to Schedule
                                             </div>
                                         </div>
                                     )}
                                     <EventCard event={evt} />
                                 </div>
                             );
                         })}
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
                        <h2 className="text-2xl font-bold text-white">Add Event</h2>
                        <p className="text-gray-400 mt-2">Create a new ID day or log an external event you attended.</p>
                    </div>

                    <div className="space-y-4">
                        {/* ROLE TOGGLE */}
                        <div className="bg-scout-900 p-1 rounded-lg border border-scout-700 flex mb-4">
                            <button 
                                onClick={() => setFormData(prev => ({ ...prev, isHosting: true }))}
                                className={`flex-1 py-2 rounded-md text-sm font-bold transition-all ${formData.isHosting ? 'bg-scout-accent text-scout-900' : 'text-gray-400 hover:text-white'}`}
                            >
                                I am Hosting
                            </button>
                            <button 
                                onClick={() => setFormData(prev => ({ ...prev, isHosting: false }))}
                                className={`flex-1 py-2 rounded-md text-sm font-bold transition-all ${!formData.isHosting ? 'bg-scout-700 text-white' : 'text-gray-400 hover:text-white'}`}
                            >
                                I am Attending
                            </button>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Event Name</label>
                            <input 
                                className="w-full bg-scout-900 border border-scout-600 rounded-lg p-3 text-white focus:border-scout-accent outline-none"
                                placeholder={formData.isHosting ? "e.g. Summer Talent ID Day" : "e.g. Surf Cup 2024"}
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
                                    <option>Tournament</option>
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
                        
                        {formData.isHosting && (
                            <div className="bg-scout-900/50 p-3 rounded border border-scout-700 flex items-start gap-2 text-xs text-gray-400 mt-2">
                                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                                <p>Hosting events requires HQ approval. The AI will generate a plan for you to submit.</p>
                            </div>
                        )}

                        <button 
                            onClick={handleCreate}
                            disabled={loading || !formData.title}
                            className="w-full mt-4 bg-scout-accent hover:bg-emerald-600 disabled:opacity-50 text-white font-bold py-4 rounded-lg shadow-lg flex items-center justify-center gap-2 transition-all"
                        >
                            {loading ? <Loader2 className="animate-spin" /> : (
                                formData.isHosting ? <>Generate Plan & Preview <ArrowRight size={18}/></> : <>Log Event to Schedule <CheckCircle size={18}/></>
                            )}
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