import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { feeApi, academicApi } from '../lib/api';
import { Plus, Search, Filter, X, Eye, Pencil, Trash2 } from 'lucide-react';

export default function FeesPage() {
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    amount: '',
    dueDate: '',
    academicTermId: '',
    targetClassId: '',
    targetSection: '',
    isOptional: false,
    isRecurring: true,
  });

  const queryClient = useQueryClient();

  // Fetch fee structures
  const { data: feesData, isLoading } = useQuery({
    queryKey: ['fees', { search }],
    queryFn: () => feeApi.getAll({ search }),
  });

  // Fetch academic terms for the dropdown
  const { data: termsData } = useQuery({
    queryKey: ['terms'],
    queryFn: () => academicApi.getTerms(),
  });

  // Fetch classes for assignment
  const { data: classesData } = useQuery({
    queryKey: ['classes'],
    queryFn: () => academicApi.getClasses(),
  });

  const fees = feesData?.data?.data || [];
  const terms = termsData?.data?.data || [];
  const classes = classesData?.data?.data || [];

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const { targetClassId, academicTermId, ...feeData } = data;
      const res = await feeApi.create({
        ...feeData,
        academicTermId: academicTermId === 'ENTIRE_YEAR' ? undefined : academicTermId,
      });

      // Auto-assign to class if selected
      if (targetClassId && res.data?.data?.id) {
        await feeApi.assign(res.data.data.id, targetClassId === 'ALL' ? {} : { classId: targetClassId });
      }
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fees'] });
      setShowModal(false);
      setFormData({
        name: '',
        description: '',
        amount: '',
        dueDate: '',
        academicTermId: '',
        targetClassId: '',
        targetSection: '',
        isOptional: false,
        isRecurring: true,
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      ...formData,
      amount: parseFloat(formData.amount),
      dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : undefined,
      targetSection: formData.targetSection === '' ? undefined : formData.targetSection,
    });
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fee Structures</h1>
          <p className="text-gray-500">Manage school fees, tuition, and other charges</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn btn-primary"
        >
          <Plus className="w-5 h-5 mr-2" />
          Create Fee
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search fee structures (e.g., Tuition, Transport)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <button className="btn btn-outline">
            <Filter className="w-5 h-5 mr-2" />
            Filters
          </button>
        </div>
      </div>

      {/* Fees table */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Loading fee structures...</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Amount (UGX)</th>
                <th>Academic Term</th>
                <th>Due Date</th>
                <th>Type</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {fees.length > 0 ? (
                fees.map((fee: any) => (
                  <tr key={fee.id}>
                    <td className="font-medium">
                      {fee.name}
                      {fee.description && (
                        <p className="text-xs text-gray-500 font-normal truncate max-w-xs">{fee.description}</p>
                      )}
                    </td>
                    <td className="font-semibold text-gray-900">
                      {fee.amount.toLocaleString()}
                    </td>
                    <td>{fee.academicTerm?.name || 'Entire Year'}</td>
                    <td>{fee.dueDate ? new Date(fee.dueDate).toLocaleDateString() : '-'}</td>
                    <td>
                      <span className={`badge ${fee.isOptional ? 'badge-warning' : 'badge-primary'
                        }`}>
                        {fee.isOptional ? 'Optional' : 'Mandatory'}
                      </span>
                    </td>
                    <td className="flex items-center gap-2">
                      <button className="p-1.5 hover:bg-blue-50 text-blue-600 rounded" title="View / Assign">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 hover:bg-yellow-50 text-yellow-600 rounded" title="Edit">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 hover:bg-red-50 text-red-600 rounded" title="Delete">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    No fee structures found. Click "Create Fee" to add one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Create Fee Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 shrink-0">
              <h2 className="text-xl font-bold">Create Fee Structure</h2>
              <button type="button" onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-6 space-y-4">

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fee Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Term 1 Tuition 2024"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    rows={2}
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none"
                  ></textarea>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Amount (UGX) *</label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="1"
                      placeholder="e.g. 500000"
                      value={formData.amount}
                      onChange={e => setFormData({ ...formData, amount: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                    <input
                      type="date"
                      value={formData.dueDate}
                      onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Academic Term (Optional)</label>
                    <select
                      value={formData.academicTermId}
                      onChange={e => setFormData({ ...formData, academicTermId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="">Select Term</option>
                      {terms.map((term: any) => (
                        <option key={term.id} value={term.id}>{term.name}</option>
                      ))}
                      <option value="ENTIRE_YEAR">Entire Year (All Terms)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Assign to Class *</label>
                    <select
                      required
                      value={formData.targetClassId}
                      onChange={e => setFormData({ ...formData, targetClassId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="">Select Class</option>
                      <option value="ALL">All Classes (Entire School)</option>
                      {classes.map((cls: any) => (
                        <option key={cls.id} value={cls.id}>{cls.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Target Section (Optional)</label>
                  <select
                    value={formData.targetSection}
                    onChange={e => setFormData({ ...formData, targetSection: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">Apply to All Sections</option>
                    <option value="DAY">Day Scholar Only</option>
                    <option value="BOARDING">Boarding Only</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">If selected, this fee will only be applied to students in the specified section.</p>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <input
                    type="checkbox"
                    id="isOptional"
                    checked={formData.isOptional}
                    onChange={e => setFormData({ ...formData, isOptional: e.target.checked })}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <div>
                    <label htmlFor="isOptional" className="text-sm font-medium text-gray-900 block">Optional Fee</label>
                    <p className="text-xs text-gray-500">Uncheck for mandatory fees (like tuition) applied to all assigned students.</p>
                  </div>
                </div>

              </div>

              <div className="flex gap-3 p-6 border-t border-gray-100 bg-gray-50 rounded-b-xl shrink-0">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 btn btn-outline bg-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="flex-1 btn btn-primary"
                >
                  {createMutation.isPending ? 'Creating...' : 'Create Fee Structure'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
