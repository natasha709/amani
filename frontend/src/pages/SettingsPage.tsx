import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { schoolApi, academicApi, authApi } from '../lib/api';
import {
  Settings as SettingsIcon,
  School,
  Calendar,
  Save,
  Globe,
  Mail,
  Phone,
  MapPin,
  Shield,
  Plus,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';

type Tab = 'school' | 'terms' | 'profile';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('school');
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Queries
  const { data: schoolData } = useQuery({
    queryKey: ['school', user?.schoolId],
    queryFn: () => schoolApi.getById(user?.schoolId!),
    enabled: !!user?.schoolId,
  });

  const { data: termsData } = useQuery({
    queryKey: ['academic-terms'],
    queryFn: () => academicApi.getTerms(),
  });

  const school = schoolData?.data?.data;
  const terms = termsData?.data?.data || [];

  // Mutations
  const updateSchoolMutation = useMutation({
    mutationFn: (data: any) => schoolApi.update(user?.schoolId!, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['school'] }),
  });

  const updateProfileMutation = useMutation({
    mutationFn: authApi.updateProfile,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['auth-me'] }),
  });

  const setTermCurrentMutation = useMutation({
    mutationFn: (data: any) => academicApi.createTerm({ ...data, isCurrent: true }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['academic-terms'] }),
  });

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <div className="flex items-center gap-2 mb-2">
            <SettingsIcon className="w-5 h-5 text-indigo-600" />
            <span className="text-xs font-black text-indigo-600 uppercase tracking-[0.2em]">Configuration</span>
          </div>
          <h1 className="text-4xl font-black text-gray-950 tracking-tighter uppercase leading-none">Settings</h1>
          <p className="text-gray-500 font-medium mt-2">Adjust school identity and personal preferences</p>
        </motion.div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1.5 rounded-2xl w-fit">
        {(['school', 'terms', 'profile'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-8 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${activeTab === tab
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-400 hover:text-gray-900'
              }`}
          >
            {tab === 'school' ? <School className="w-4 h-4" /> :
              tab === 'terms' ? <Calendar className="w-4 h-4" /> :
                <Shield className="w-4 h-4" />}
            {tab.charAt(0).toUpperCase() + tab.slice(1).replace('-', ' ')}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Content Area */}
        <div className="lg:col-span-8">
          {activeTab === 'school' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="card p-10 bg-white border border-gray-100"
            >
              <h3 className="text-2xl font-black text-gray-950 tracking-tighter uppercase italic mb-8 flex items-center gap-3">
                <Globe className="w-6 h-6 text-indigo-600" /> School Identity
              </h3>

              <form onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                updateSchoolMutation.mutate(Object.fromEntries(fd));
              }} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Official School Name</label>
                    <input name="name" defaultValue={school?.name} className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl font-bold focus:ring-4 focus:ring-indigo-100 transition-all outline-none" required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Registration Number</label>
                    <input name="registrationNo" defaultValue={school?.registrationNo} className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl font-bold focus:ring-4 focus:ring-indigo-100 transition-all outline-none" placeholder="e.g. EMIS-12345" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 text-indigo-600 italic">Physical Location</label>
                  <div className="relative">
                    <MapPin className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
                    <input name="address" defaultValue={school?.address} className="w-full pl-14 pr-6 py-4 bg-gray-50 border-none rounded-2xl font-bold focus:ring-4 focus:ring-indigo-100 transition-all outline-none" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Support Email</label>
                    <div className="relative">
                      <Mail className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
                      <input name="email" type="email" defaultValue={school?.email} className="w-full pl-14 pr-6 py-4 bg-gray-50 border-none rounded-2xl font-bold focus:ring-4 focus:ring-indigo-100 transition-all outline-none" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Official Contact</label>
                    <div className="relative">
                      <Phone className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
                      <input name="phone" defaultValue={school?.phone} className="w-full pl-14 pr-6 py-4 bg-gray-50 border-none rounded-2xl font-bold focus:ring-4 focus:ring-indigo-100 transition-all outline-none" />
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-gray-50">
                  <button type="submit" disabled={updateSchoolMutation.isPending} className="btn bg-indigo-600 text-white rounded-[1.5rem] px-8 py-4 font-black uppercase text-xs tracking-[0.2em] shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center gap-3">
                    {updateSchoolMutation.isPending ? 'Saving...' : <><Save className="w-4 h-4" /> Save Core Details</>}
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {activeTab === 'terms' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-6"
            >
              <div className="card p-10 bg-white border border-gray-100">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-2xl font-black text-gray-950 tracking-tighter uppercase italic leading-none">Academic Terms</h3>
                  <button className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl hover:bg-indigo-100 transition-all">
                    <Plus className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  {terms.map((term: any) => (
                    <div key={term.id} className={`flex items-center justify-between p-6 rounded-[2rem] border-2 transition-all ${term.isCurrent ? 'bg-indigo-600 text-white border-indigo-600 shadow-xl shadow-indigo-100' : 'bg-gray-50 border-gray-50 hover:border-indigo-100'}`}>
                      <div className="flex items-center gap-6">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black ${term.isCurrent ? 'bg-white/10 text-white' : 'bg-white text-indigo-600 shadow-sm'}`}>
                          {term.name.match(/\d+/)?.[0] || 'T'}
                        </div>
                        <div>
                          <h4 className="font-black text-lg tracking-tight leading-none mb-1">{term.name}</h4>
                          <p className={`text-[10px] font-black uppercase tracking-widest ${term.isCurrent ? 'text-indigo-200' : 'text-gray-400'}`}>
                            {new Date(term.startDate).toLocaleDateString()} — {new Date(term.endDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      {term.isCurrent ? (
                        <div className="flex items-center gap-2 px-4 py-2 bg-white/20 rounded-full font-black text-[10px] uppercase tracking-widest">
                          <CheckCircle2 className="w-4 h-4" /> Currently Active
                        </div>
                      ) : (
                        <button
                          onClick={() => setTermCurrentMutation.mutate(term)}
                          className="px-4 py-2 hover:bg-white rounded-full font-black text-[10px] uppercase tracking-widest text-gray-400 hover:text-indigo-600 transition-all"
                        >
                          Make Active
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'profile' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="card p-10 bg-white border border-gray-100"
            >
              <h3 className="text-2xl font-black text-gray-950 tracking-tighter uppercase italic mb-8 flex items-center gap-3">
                <Shield className="w-6 h-6 text-indigo-600" /> Account Security
              </h3>

              <form onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                updateProfileMutation.mutate(Object.fromEntries(fd));
              }} className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">First Name</label>
                    <input name="firstName" defaultValue={user?.firstName} className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl font-bold focus:ring-4 focus:ring-indigo-100 outline-none" required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Last Name</label>
                    <input name="lastName" defaultValue={user?.lastName} className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl font-bold focus:ring-4 focus:ring-indigo-100 outline-none" required />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Email / Username</label>
                  <input type="email" defaultValue={user?.email} className="w-full px-6 py-4 bg-gray-200 border-none rounded-2xl font-bold text-gray-500 cursor-not-allowed outline-none font-mono" readOnly />
                </div>

                <div className="pt-6 border-t border-gray-50">
                  <button type="submit" disabled={updateProfileMutation.isPending} className="btn bg-gray-950 text-white rounded-[1.5rem] px-8 py-4 font-black uppercase text-xs tracking-[0.2em] shadow-xl hover:bg-indigo-600 transition-all flex items-center gap-3">
                    {updateProfileMutation.isPending ? 'Syncing...' : <><Save className="w-4 h-4" /> Update Profile</>}
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </div>

        {/* Right Sidebar Info */}
        <div className="lg:col-span-4 space-y-6">
          <div className="card bg-gray-950 p-8 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl -mr-16 -mt-16" />
            <h4 className="text-indigo-400 text-[10px] font-black uppercase tracking-widest mb-2 italic">System Intelligence</h4>
            <p className="text-xl font-bold leading-tight">Version 2.4.0 (Stable)</p>
            <div className="mt-8 space-y-4">
              <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                <span>Database Engine</span>
                <span className="text-white">Prisma/Postgres</span>
              </div>
              <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                <span>Security Layer</span>
                <span className="text-white">JWT EdDSA</span>
              </div>
              <div className="w-full h-px bg-white/5" />
              <p className="text-[10px] font-medium text-gray-500 italic mt-4">Automated cloud backups are active and verified every 24 hours.</p>
            </div>
          </div>

          <div className="card p-8 bg-indigo-50 border-2 border-dashed border-indigo-100">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-white rounded-2xl shadow-sm">
                <AlertCircle className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h5 className="font-black text-gray-900 text-sm tracking-tight mb-1">Branding Tip</h5>
                <p className="text-xs text-gray-500 leading-relaxed font-medium">Keep your school name consistent across all reports and report cards by updating the identity panel.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

