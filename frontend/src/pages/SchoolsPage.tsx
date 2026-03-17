import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { schoolApi } from '../lib/api';
import { 
  Plus, 
  Search, 
  X, 
  MapPin, 
  Mail, 
  Phone, 
  Building2,
  Loader2,
  Eye,
  Pencil,
  Trash2
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function SchoolsPage() {
  const [showModal, setShowModal] = useState(false);
  const [viewSchool, setViewSchool] = useState<any>(null);
  const [editSchool, setEditSchool] = useState<any>(null);
  const [deleteSchool, setDeleteSchool] = useState<any>(null);
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();

  const { data: schoolsData, isLoading } = useQuery({
    queryKey: ['schools'],
    queryFn: () => schoolApi.getAll(),
  });

  const schools = (schoolsData?.data?.data || []).filter((s: any) => 
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.registrationNo && s.registrationNo.toLowerCase().includes(search.toLowerCase())) ||
    (s.address && s.address.toLowerCase().includes(search.toLowerCase()))
  );

  const createMutation = useMutation({
    mutationFn: schoolApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schools'] });
      setShowModal(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => schoolApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schools'] });
      setEditSchool(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => schoolApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schools'] });
      setDeleteSchool(null);
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const data = Object.fromEntries(fd);
    createMutation.mutate(data);
  };

  const handleEditSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const data = Object.fromEntries(fd);
    updateMutation.mutate({ id: editSchool.id, data });
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <div className="flex items-center gap-2 mb-2">
            <Building2 className="w-5 h-5 text-indigo-600" />
            <span className="text-xs font-black text-indigo-600 uppercase tracking-[0.2em]">Institutional Registry</span>
          </div>
          <h1 className="text-4xl font-black text-gray-950 tracking-tighter uppercase leading-none">School Management</h1>
          <p className="text-gray-500 font-medium mt-2">Register and manage educational institutions in the system</p>
        </motion.div>

        <button
          onClick={() => setShowModal(true)}
          className="btn bg-gray-950 text-white hover:bg-black border-none px-6 py-4 rounded-2xl shadow-xl flex items-center gap-2 font-black uppercase text-xs tracking-widest transition-all"
        >
          <Plus className="w-4 h-4" /> Register New School
        </button>
      </div>

      {/* Search */}
      <div className="card p-4 bg-white border border-gray-100 shadow-sm relative z-10">
        <div className="relative">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search schools by name, registration ID or location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-16 pr-6 py-4 bg-gray-50 border-none rounded-2xl font-bold focus:ring-4 focus:ring-indigo-100 transition-all outline-none"
          />
        </div>
      </div>

      {/* Schools List - Table Format */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
        </div>
      ) : (
        <div className="card bg-white border border-gray-100 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Institution</th>
                  <th className="px-6 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Reg Number</th>
                  <th className="px-6 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Address</th>
                  <th className="px-6 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Contact</th>
                  <th className="px-6 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Status</th>
                  <th className="px-8 py-5 text-right text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-sm">
                {schools.map((s: any) => (
                  <tr key={s.id} className="hover:bg-indigo-50/30 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 font-black text-lg italic shadow-sm shrink-0">
                          {s.name[0]}
                        </div>
                        <div>
                          <p className="font-black text-gray-950 uppercase italic tracking-tight">{s.name}</p>
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{s.id.slice(0, 8)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="font-bold text-gray-600 font-mono">
                        {s.registrationNo || '—'}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2 text-gray-500 font-medium">
                        <MapPin className="w-4 h-4 text-gray-300" />
                        <span className="truncate max-w-[150px]">{s.address || '—'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-[11px] text-gray-500 font-bold uppercase tracking-tight">
                          <Mail className="w-3.5 h-3.5 text-gray-300" />
                          {s.email || '—'}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-gray-500 font-bold uppercase tracking-tight">
                          <Phone className="w-3.5 h-3.5 text-gray-300" />
                          {s.phone || '—'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100">
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                        Active
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex items-center justify-end gap-2 text-right">
                        <button 
                          onClick={() => setViewSchool(s)}
                          className="p-1.5 hover:bg-blue-50 text-blue-600 rounded" 
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => setEditSchool(s)}
                          className="p-1.5 hover:bg-yellow-50 text-yellow-600 rounded" 
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button 
                          className="p-1.5 hover:bg-red-50 text-red-600 rounded" 
                          title="Delete"
                          onClick={() => setDeleteSchool(s)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {schools.length === 0 && (
            <div className="py-20 text-center italic font-medium text-gray-400">
              No institutions found matching your search criteria.
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteSchool && (
        <div className="fixed inset-0 bg-gray-950/60 backdrop-blur-sm flex items-center justify-center z-[110] p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md p-8 relative overflow-hidden"
          >
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trash2 className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-black text-gray-950 uppercase tracking-tight">Delete Institution?</h3>
              <p className="text-gray-500 font-medium">
                Are you sure you want to delete <span className="font-bold text-gray-950">{deleteSchool.name}</span>?
              </p>
              <div className="flex gap-4 pt-6">
                <button 
                  onClick={() => setDeleteSchool(null)}
                  className="flex-1 py-4 bg-gray-100 text-gray-600 rounded-xl font-bold uppercase text-xs tracking-widest hover:bg-gray-200 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => deleteMutation.mutate(deleteSchool.id)}
                  disabled={deleteMutation.isPending}
                  className="flex-1 py-4 bg-red-600 text-white rounded-xl font-bold uppercase text-xs tracking-widest hover:bg-red-700 transition-all shadow-lg shadow-red-200 flex items-center justify-center gap-2"
                >
                  {deleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Delete'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* View School Modal */}
      {viewSchool && (
        <div className="fixed inset-0 bg-gray-950/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-xl p-10 relative overflow-hidden"
          >
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-black text-gray-950 tracking-tighter uppercase">{viewSchool.name}</h2>
                <p className="text-gray-400 font-bold text-xs uppercase tracking-widest mt-1">School Details</p>
              </div>
              <button onClick={() => setViewSchool(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic">Registration No</label>
                  <p className="font-bold text-gray-950">{viewSchool.registrationNo || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic">Email</label>
                  <p className="font-bold text-gray-950">{viewSchool.email || 'N/A'}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic">Phone</label>
                  <p className="font-bold text-gray-950">{viewSchool.phone || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic">Location</label>
                  <p className="font-bold text-gray-950">{viewSchool.address || 'N/A'}</p>
                </div>
              </div>
            </div>

            <div className="mt-10 pt-8 border-t border-gray-100 italic font-medium text-gray-400 text-sm">
              Registered on {new Date(viewSchool.createdAt).toLocaleDateString()}
            </div>
          </motion.div>
        </div>
      )}

      {/* Edit School Modal */}
      {editSchool && (
        <div className="fixed inset-0 bg-gray-950/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl p-10 relative overflow-hidden"
          >
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-black text-gray-950 tracking-tighter uppercase">Edit Institution</h2>
                <p className="text-gray-400 font-bold text-xs uppercase tracking-widest mt-1">Update Record</p>
              </div>
              <button onClick={() => setEditSchool(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic ml-1">School Name *</label>
                  <input name="name" defaultValue={editSchool.name} required className="w-full px-5 py-4 bg-gray-50 border-none rounded-[1.25rem] font-bold" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic ml-1">Registration ID</label>
                  <input name="registrationNo" defaultValue={editSchool.registrationNo} className="w-full px-5 py-4 bg-gray-50 border-none rounded-[1.25rem] font-bold" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic ml-1">Physical Address</label>
                <input name="address" defaultValue={editSchool.address} className="w-full px-5 py-4 bg-gray-50 border-none rounded-[1.25rem] font-bold" />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic ml-1">Email</label>
                  <input name="email" defaultValue={editSchool.email} className="w-full px-5 py-4 bg-gray-50 border-none rounded-[1.25rem] font-bold" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic ml-1">Phone</label>
                  <input name="phone" defaultValue={editSchool.phone} className="w-full px-5 py-4 bg-gray-50 border-none rounded-[1.25rem] font-bold" />
                </div>
              </div>
              <button type="submit" disabled={updateMutation.isPending} className="w-full py-5 bg-indigo-600 text-white rounded-[1.25rem] font-black uppercase text-sm tracking-[0.2em] shadow-xl group-hover:bg-indigo-700 transition-all flex items-center justify-center gap-2">
                {updateMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Save Changes"}
              </button>
            </form>
          </motion.div>
        </div>
      )}

      {/* Add School Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-950/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl p-10 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-50 rounded-full -mr-10 -mt-10 opacity-50" />
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-3xl font-black text-gray-950 tracking-tighter uppercase">New Institution</h2>
                  <p className="text-gray-400 font-bold text-xs uppercase tracking-widest mt-1">School Registration Portal</p>
                </div>
                <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <X className="w-6 h-6 text-gray-400" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 italic">School Name *</label>
                    <input name="name" required className="w-full px-5 py-4 bg-gray-50 border-none rounded-[1.25rem] font-bold text-gray-950 focus:ring-4 focus:ring-indigo-100 transition-all outline-none" placeholder="e.g. Amani High School" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 italic">Registration ID</label>
                    <input name="registrationNo" className="w-full px-5 py-4 bg-gray-50 border-none rounded-[1.25rem] font-bold text-gray-950 focus:ring-4 focus:ring-indigo-100 transition-all outline-none" placeholder="e.g. EMIS-12345" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 italic">Physical Address</label>
                  <input name="address" className="w-full px-5 py-4 bg-gray-50 border-none rounded-[1.25rem] font-bold text-gray-950 focus:ring-4 focus:ring-indigo-100 transition-all outline-none" placeholder="e.g. Plot 45, Kampala Road" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 italic">Official Email</label>
                    <input name="email" type="email" className="w-full px-5 py-4 bg-gray-50 border-none rounded-[1.25rem] font-bold text-gray-950 focus:ring-4 focus:ring-indigo-100 transition-all outline-none" placeholder="office@amani.edu.ug" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 italic">Contact Phone</label>
                    <input name="phone" className="w-full px-5 py-4 bg-gray-50 border-none rounded-[1.25rem] font-bold text-gray-950 focus:ring-4 focus:ring-indigo-100 transition-all outline-none" placeholder="+256..." />
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    className="w-full py-5 bg-indigo-600 text-white rounded-[1.25rem] font-black uppercase text-sm tracking-[0.2em] shadow-xl shadow-indigo-200 hover:bg-indigo-700 hover:-translate-y-1 transition-all flex items-center justify-center gap-2"
                    disabled={createMutation.isPending}
                  >
                    {createMutation.isPending ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>Initialize Institution Record</>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
