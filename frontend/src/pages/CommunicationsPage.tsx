import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { communicationApi } from '../lib/api';
import {
  Bell,
  Mail,
  Send,
  Plus,
  X,
  Megaphone,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

type Tab = 'announcements' | 'messages';

export default function CommunicationsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('announcements');
  const [showModal, setShowModal] = useState(false);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch Announcements
  const { data: announcementsData } = useQuery({
    queryKey: ['announcements'],
    queryFn: () => communicationApi.getAnnouncements(),
  });

  const announcements = announcementsData?.data?.data || [];

  const createAnnouncementMutation = useMutation({
    mutationFn: communicationApi.createAnnouncement,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      setShowModal(false);
    }
  });

  const PriorityBadge = ({ priority }: { priority: string }) => {
    const styles: Record<string, string> = {
      HIGH: 'bg-red-50 text-red-600 border-red-100',
      NORMAL: 'bg-indigo-50 text-indigo-600 border-indigo-100',
      LOW: 'bg-gray-50 text-gray-500 border-gray-100',
    };
    return (
      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${styles[priority] || styles.NORMAL}`}>
        {priority}
      </span>
    );
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black text-gray-950 tracking-tighter uppercase">Boardroom</h1>
          <p className="text-gray-500 font-medium">School-wide announcements and internal correspondence</p>
        </div>
        <div className="flex gap-3">
          {(user?.role === 'SCHOOL_OWNER' || user?.role === 'ADMIN') && (
            <button
              onClick={() => setShowModal(true)}
              className="btn bg-indigo-600 text-white hover:bg-indigo-700 border-none px-6 rounded-2xl shadow-xl shadow-indigo-100 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4 mr-2" /> New Announcement
            </button>
          )}
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex gap-1 bg-gray-100 p-1.5 rounded-2xl w-fit">
        {(['announcements', 'messages'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-8 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${activeTab === tab
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-400 hover:text-gray-900'
              }`}
          >
            {tab === 'announcements' ? <Bell className="w-4 h-4" /> : <Mail className="w-4 h-4" />}
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {activeTab === 'announcements' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Feed */}
          <div className="lg:col-span-2 space-y-6">
            {announcements.map((ann: any) => (
              <div key={ann.id} className="card p-8 bg-white border border-gray-100 hover:border-indigo-100 transition-all group">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl ${ann.priority === 'HIGH' ? 'bg-red-50 text-red-600' : 'bg-indigo-50 text-indigo-600'}`}>
                      {ann.priority === 'HIGH' ? <AlertCircle className="w-5 h-5 transition-transform group-hover:scale-110" /> : <Megaphone className="w-5 h-5 transition-transform group-hover:scale-110" />}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 tracking-tight">{ann.title}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <PriorityBadge priority={ann.priority} />
                        <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest bg-gray-50 px-2 py-0.5 rounded-full">{ann.type}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{new Date(ann.publishedAt).toLocaleDateString()}</p>
                    <div className="flex items-center justify-end gap-1 mt-1 text-indigo-600">
                      <Clock className="w-3 h-3" />
                      <span className="text-[10px] font-black uppercase tracking-widest">3:45 PM</span>
                    </div>
                  </div>
                </div>

                <p className="text-gray-600 leading-relaxed mb-6 font-medium bg-gray-50/50 p-4 rounded-xl">
                  {ann.content}
                </p>

                <div className="flex items-center justify-between pt-6 border-t border-gray-50">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-[10px] font-black text-indigo-600">
                      {ann.author.firstName[0]}
                    </div>
                    <p className="text-xs font-bold text-gray-500 italic">Posted by {ann.author.firstName} {ann.author.lastName}</p>
                  </div>
                  <button className="text-xs font-black text-indigo-600 uppercase tracking-[0.1em] hover:text-indigo-800 transition-all flex items-center gap-2">
                    View Details <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}

            {announcements.length === 0 && (
              <div className="py-32 text-center text-gray-300 italic border-2 border-dashed border-gray-100 rounded-[2rem]">
                No announcements posted yet this term.
              </div>
            )}
          </div>

          {/* Stats & Filters Sidebar */}
          <div className="lg:col-span-1 space-y-8">
            <div className="card bg-gray-950 p-8 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full -mr-16 -mt-16 blur-2xl" />
              <h3 className="text-2xl font-black mb-2 tracking-tighter uppercase italic">Board Summary</h3>
              <div className="space-y-6 mt-8">
                <div className="flex justify-between items-center">
                  <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Total Updates</p>
                  <p className="text-xl font-black">{announcements.length}</p>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Critical Today</p>
                  <p className="text-xl font-black text-red-500">{announcements.filter((a: any) => a.priority === 'HIGH').length}</p>
                </div>
                <div className="w-full h-px bg-white/10" />
                <button className="w-full py-4 bg-white text-gray-950 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-indigo-50 transition-all flex items-center justify-center gap-2 shadow-lg shadow-white/5">
                  <CheckCircle2 className="w-4 h-4" /> Mark All as Read
                </button>
              </div>
            </div>

            <div className="card p-6 border border-gray-100">
              <h4 className="font-bold text-gray-900 mb-6 uppercase tracking-widest text-[10px] italic">Quick Filter</h4>
              <div className="space-y-2">
                {['General', 'Emergency', 'Admissions', 'Academics'].map(cat => (
                  <button key={cat} className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-indigo-50 transition-all group">
                    <span className="text-sm font-bold text-gray-500 group-hover:text-indigo-600 transition-all">{cat}</span>
                    <div className="w-6 h-6 rounded-lg bg-gray-50 flex items-center justify-center text-[10px] font-black text-gray-400 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-all">0</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'messages' && (
        <div className="card p-32 flex flex-col items-center justify-center bg-gray-50/50 border-2 border-dashed border-gray-200 text-center rounded-[3rem]">
          <Mail className="w-16 h-16 text-gray-200 mb-4" />
          <h3 className="text-2xl font-black text-gray-400 uppercase tracking-tighter">Internal Correspondence</h3>
          <p className="text-gray-400 font-medium max-w-sm mt-2">The staff messaging system is currently being optimized for school-wide secure delivery.</p>
          <button className="mt-8 btn bg-gray-300 text-white cursor-not-allowed border-none shadow-none">
            Coming Very Soon
          </button>
        </div>
      )}

      {/* New Announcement Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-950/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-lg p-12 relative overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-50 rounded-full -mr-16 -mt-16 opacity-50" />

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-10">
                <div>
                  <h2 className="text-2xl font-black text-gray-950 tracking-tighter uppercase">Disseminate News</h2>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic mt-1 text-indigo-500">Official Communication Center</p>
                </div>
                <button onClick={() => setShowModal(false)} className="p-3 hover:bg-gray-100 rounded-full transition-all active:scale-95">
                  <X className="w-6 h-6 text-gray-400 hover:text-gray-900" />
                </button>
              </div>

              <form onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                createAnnouncementMutation.mutate({
                  title: fd.get('title'),
                  content: fd.get('content'),
                  priority: fd.get('priority'),
                  type: fd.get('type')
                });
              }} className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 ml-1">Update Headline</label>
                  <input
                    name="title"
                    required
                    autoFocus
                    placeholder="e.g. End of Term Thanksgiving Ceremony"
                    className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl font-bold text-gray-950 focus:ring-4 focus:ring-indigo-100 transition-all outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 ml-1">Priority</label>
                    <select name="priority" className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl font-bold text-gray-950 focus:ring-4 focus:ring-indigo-100 transition-all outline-none">
                      <option value="NORMAL">Normal</option>
                      <option value="HIGH">Critical</option>
                      <option value="LOW">Low</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 ml-1">Category</label>
                    <select name="type" className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl font-bold text-gray-950 focus:ring-4 focus:ring-indigo-100 transition-all outline-none">
                      <option value="GENERAL">General</option>
                      <option value="ACADEMIC">Academic</option>
                      <option value="EMERGENCY">Emergency</option>
                      <option value="EVENT">Event</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 ml-1">Message Content</label>
                  <textarea
                    name="content"
                    required
                    rows={4}
                    className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl font-bold text-gray-950 focus:ring-4 focus:ring-indigo-100 transition-all outline-none resize-none"
                    placeholder="Detail your announcement here..."
                  ></textarea>
                </div>

                <div className="pt-6">
                  <button
                    type="submit"
                    className="w-full py-5 bg-indigo-600 text-white rounded-[1.5rem] font-black uppercase text-sm tracking-[0.3em] shadow-2xl shadow-indigo-200 hover:bg-indigo-700 hover:-translate-y-1 transition-all flex items-center justify-center gap-3"
                    disabled={createAnnouncementMutation.isPending}
                  >
                    {createAnnouncementMutation.isPending ? 'Propagating...' : (
                      <>
                        <Send className="w-4 h-4" /> Broadcast News
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

