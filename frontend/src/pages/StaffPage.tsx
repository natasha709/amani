import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { staffApi, schoolApi } from '../lib/api';
import { 
  Users, 
  Search, 
  X, 
  Mail, 
  Phone, 
  UserPlus,
  Loader2,
  Trash2,
  Pencil,
  Building2,
  Eye
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';

export default function StaffPage() {
  const [showModal, setShowModal] = useState(false);
  const [viewStaff, setViewStaff] = useState<any>(null);
  const [editStaff, setEditStaff] = useState<any>(null);
  const [deleteStaff, setDeleteStaff] = useState<any>(null);
  const [search, setSearch] = useState('');
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: staffData, isLoading } = useQuery({
    queryKey: ['staff', user?.schoolId],
    queryFn: () => staffApi.getAll(user?.schoolId!),
    enabled: !!user?.schoolId,
  });

  const { data: schoolsData } = useQuery({
    queryKey: ['schools'],
    queryFn: () => schoolApi.getAll(),
  });

  const schools = schoolsData?.data?.data || [];

  const staff = (staffData?.data?.data || []).filter((s: any) => 
    s.firstName.toLowerCase().includes(search.toLowerCase()) ||
    s.lastName.toLowerCase().includes(search.toLowerCase()) ||
    s.email.toLowerCase().includes(search.toLowerCase())
  );

  const createMutation = useMutation({
    mutationFn: staffApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      setShowModal(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => staffApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      setEditStaff(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => staffApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      setDeleteStaff(null);
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const data = Object.fromEntries(fd);
    
    // Generate an automatic random password (mix of letters and numbers)
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const autoPassword = Array.from({ length: 10 }, () => charset[Math.floor(Math.random() * charset.length)]).join('');

    createMutation.mutate({
      ...data,
      password: autoPassword,
      schoolId: data.schoolId || user?.schoolId,
    });
  };

  const handleEditSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const data = Object.fromEntries(fd);
    updateMutation.mutate({
      id: editStaff.id,
      data: {
        ...data,
        schoolId: data.schoolId || user?.schoolId,
      }
    });
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
            <Users className="w-5 h-5 text-indigo-600" />
            <span className="text-xs font-black text-indigo-600 uppercase tracking-[0.2em]">Workforce</span>
          </div>
          <h1 className="text-4xl font-black text-gray-950 tracking-tighter uppercase leading-none">Staff Management</h1>
          <p className="text-gray-500 font-medium mt-2">Manage teachers, administrators and school personnel</p>
        </motion.div>

        <button
          onClick={() => setShowModal(true)}
          className="btn bg-gray-950 text-white hover:bg-black border-none px-6 py-4 rounded-2xl shadow-xl flex items-center gap-2 font-black uppercase text-xs tracking-widest transition-all"
        >
          <UserPlus className="w-4 h-4" /> Add Personnel
        </button>
      </div>

      {/* Search and Filter */}
      <div className="card p-4 bg-white border border-gray-100 shadow-sm relative z-10">
        <div className="relative">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search staff by name, email or role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-16 pr-6 py-4 bg-gray-50 border-none rounded-2xl font-bold focus:ring-4 focus:ring-indigo-100 transition-all outline-none"
          />
        </div>
      </div>

      {/* Staff List - Table Format */}
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
                  <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Personnel</th>
                  <th className="px-6 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Role</th>
                  <th className="px-6 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Contact Information</th>
                  <th className="px-6 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">School Assignment</th>
                  <th className="px-8 py-5 text-right text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-sm">
                {staff.map((member: any) => (
                  <tr key={member.id} className="hover:bg-indigo-50/30 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 font-black text-lg italic shadow-sm shrink-0">
                          {member.firstName[0]}{member.lastName[0]}
                        </div>
                        <div>
                          <p className="font-black text-gray-950 uppercase italic tracking-tight">{member.firstName} {member.lastName}</p>
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">ID: {member.id.slice(0, 8)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                        member.role === 'ADMIN' ? 'bg-rose-100 text-rose-700' :
                        member.role === 'SCHOOL_OWNER' ? 'bg-gray-950 text-white' :
                        'bg-indigo-100 text-indigo-700'
                      }`}>
                        {member.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-[11px] text-gray-500 font-bold uppercase tracking-tight">
                          <Mail className="w-3.5 h-3.5 text-gray-300" />
                          {member.email}
                        </div>
                        {member.phone && (
                          <div className="flex items-center gap-2 text-[11px] text-gray-500 font-bold uppercase tracking-tight">
                            <Phone className="w-3.5 h-3.5 text-gray-300" />
                            {member.phone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2 text-gray-500 font-medium">
                        <Building2 className="w-4 h-4 text-gray-300" />
                        <span className="font-bold text-[11px] uppercase tracking-wider text-gray-600">
                          {member.schoolName || 'Unknown School'}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => setViewStaff(member)}
                          className="p-1.5 hover:bg-blue-50 text-blue-600 rounded" 
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => setEditStaff(member)}
                          className="p-1.5 hover:bg-yellow-50 text-yellow-600 rounded" 
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => setDeleteStaff(member)}
                          className="p-1.5 hover:bg-red-50 text-red-600 rounded" 
                          title="Deactivate"
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
          {staff.length === 0 && (
            <div className="py-20 text-center italic font-medium text-gray-400">
              No personnel found matching your search.
            </div>
          )}
        </div>
      )}

      {/* View Staff Modal */}
      {viewStaff && (
        <div className="fixed inset-0 bg-gray-950/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg p-10 relative overflow-hidden"
          >
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-black text-gray-950 tracking-tighter uppercase">{viewStaff.firstName} {viewStaff.lastName}</h2>
                <p className="text-gray-400 font-bold text-xs uppercase tracking-widest mt-1">Personnel Profile</p>
              </div>
              <button onClick={() => setViewStaff(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>
            
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic">Position</label>
                  <p className="font-bold text-gray-950">{viewStaff.role.replace('_', ' ')}</p>
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic">Email</label>
                  <p className="font-bold text-gray-950">{viewStaff.email}</p>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic">Assigned School</label>
                <p className="font-bold text-gray-950">{viewStaff.schoolName || 'N/A'}</p>
              </div>
            </div>

            <div className="mt-10 pt-8 border-t border-gray-100 italic font-medium text-gray-400 text-sm">
              Joined on {new Date(viewStaff.createdAt).toLocaleDateString()}
            </div>
          </motion.div>
        </div>
      )}

      {/* Edit Staff Modal */}
      {editStaff && (
        <div className="fixed inset-0 bg-gray-950/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-xl p-10 relative overflow-hidden"
          >
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-black text-gray-950 tracking-tighter uppercase">Edit Personnel</h2>
                <p className="text-gray-400 font-bold text-xs uppercase tracking-widest mt-1">Update Record</p>
              </div>
              <button onClick={() => setEditStaff(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <input name="firstName" defaultValue={editStaff.firstName} required className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl font-bold" placeholder="First Name" />
                <input name="lastName" defaultValue={editStaff.lastName} required className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl font-bold" placeholder="Last Name" />
              </div>
              <input name="email" type="email" defaultValue={editStaff.email} required className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl font-bold" placeholder="Email" />
              <div className="grid grid-cols-2 gap-4">
                <select name="role" defaultValue={editStaff.role} required className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl font-bold">
                  <option value="TEACHER">Teacher</option>
                  <option value="ADMIN">Administrative Staff</option>
                </select>
                <select name="schoolId" defaultValue={editStaff.schoolId} required className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl font-bold">
                  {schools.map((s: any) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <button type="submit" disabled={updateMutation.isPending} className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase text-sm tracking-[0.2em] shadow-xl hover:bg-indigo-700 transition-all">
                {updateMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Save Changes"}
              </button>
            </form>
          </motion.div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteStaff && (
        <div className="fixed inset-0 bg-gray-950/60 backdrop-blur-sm flex items-center justify-center z-[110] p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md p-8 text-center"
          >
            <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <Trash2 className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-black text-gray-950 uppercase tracking-tight">Deactivate Staff?</h3>
            <p className="text-gray-500 font-medium my-4">
              Are you sure you want to deactivate <span className="font-bold text-gray-950">{deleteStaff.firstName} {deleteStaff.lastName}</span>? They will no longer be able to access the system.
            </p>
            <div className="flex gap-4 mt-8">
              <button 
                onClick={() => setDeleteStaff(null)}
                className="flex-1 py-4 bg-gray-100 text-gray-600 rounded-xl font-bold uppercase text-xs hover:bg-gray-200 transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={() => deleteMutation.mutate(deleteStaff.id)}
                disabled={deleteMutation.isPending}
                className="flex-1 py-4 bg-red-600 text-white rounded-xl font-bold uppercase text-xs hover:bg-red-700 transition-all flex items-center justify-center gap-2"
              >
                {deleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Add Staff Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-950/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-xl p-10 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-50 rounded-full -mr-10 -mt-10 opacity-50" />
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-3xl font-black text-gray-950 tracking-tighter uppercase">New Personnel</h2>
                  <p className="text-gray-400 font-bold text-xs uppercase tracking-widest mt-1">Staff Registration</p>
                </div>
                <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <X className="w-6 h-6 text-gray-400" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 italic">First Name</label>
                    <input name="firstName" required className="w-full px-5 py-4 bg-gray-50 border-none rounded-[1.25rem] font-bold text-gray-950 focus:ring-4 focus:ring-indigo-100 transition-all outline-none" placeholder="e.g. John" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 italic">Last Name</label>
                    <input name="lastName" required className="w-full px-5 py-4 bg-gray-50 border-none rounded-[1.25rem] font-bold text-gray-950 focus:ring-4 focus:ring-indigo-100 transition-all outline-none" placeholder="e.g. Doe" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 italic">Email Address</label>
                  <input name="email" type="email" required className="w-full px-5 py-4 bg-gray-50 border-none rounded-[1.25rem] font-bold text-gray-950 focus:ring-4 focus:ring-indigo-100 transition-all outline-none" placeholder="staff@amani.edu.ug" />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 italic">Assigned School</label>
                  <select name="schoolId" defaultValue={user?.schoolId} required className="w-full px-5 py-4 bg-gray-50 border-none rounded-[1.25rem] font-bold text-gray-950 focus:ring-4 focus:ring-indigo-100 transition-all outline-none">
                    <option value="">Select a school...</option>
                    {schools.map((s: any) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 italic">System Role</label>
                  <select name="role" required className="w-full px-5 py-4 bg-gray-50 border-none rounded-[1.25rem] font-bold text-gray-950 focus:ring-4 focus:ring-indigo-100 transition-all outline-none">
                    <option value="TEACHER">Teacher</option>
                    <option value="ADMIN">Administrative Staff</option>
                  </select>
                </div>

                <div>
                  <button
                    type="submit"
                    className="w-full py-5 bg-indigo-600 text-white rounded-[1.25rem] font-black uppercase text-sm tracking-[0.2em] shadow-xl shadow-indigo-200 hover:bg-indigo-700 hover:-translate-y-1 transition-all flex items-center justify-center gap-2"
                    disabled={createMutation.isPending}
                  >
                    {createMutation.isPending ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>Register Staff Member</>
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
