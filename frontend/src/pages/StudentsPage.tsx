import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { studentApi, academicApi } from '../lib/api';
import { countryCodes } from '../lib/countryCodes';
import { Plus, Search, Filter, X, Eye, Pencil, Trash2 } from 'lucide-react';

// Edit Student Form Component
function EditStudentForm({ student, classes, onSubmit, onCancel, isLoading }: {
  student: any;
  classes: any[];
  onSubmit: (data: any) => void;
  onCancel: () => void;
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState({
    firstName: student.firstName || '',
    lastName: student.lastName || '',
    gender: student.gender || 'MALE',
    classId: student.classId || '',
    phone: student.phone || '',
    address: student.address || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const dataToSend = Object.fromEntries(
      Object.entries(formData).filter(([_, value]) => value !== '')
    );
    onSubmit(dataToSend);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
          <input
            type="text"
            required
            value={formData.firstName}
            onChange={e => setFormData({...formData, firstName: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
          <input
            type="text"
            required
            value={formData.lastName}
            onChange={e => setFormData({...formData, lastName: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Gender *</label>
          <select
            required
            value={formData.gender}
            onChange={e => setFormData({...formData, gender: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
            <option value="OTHER">Other</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
          <select
            value={formData.classId}
            onChange={e => setFormData({...formData, classId: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="">Select Class</option>
            {classes.map((cls: any) => (
              <option key={cls.id} value={cls.id}>{cls.name}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
          <input
            type="tel"
            value={formData.phone}
            onChange={e => setFormData({...formData, phone: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
          <input
            type="text"
            value={formData.address}
            onChange={e => setFormData({...formData, address: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>
      </div>
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 btn btn-outline"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 btn btn-primary"
        >
          {isLoading ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
}

export default function StudentsPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    gender: '',
    classId: '',
    status: '',
  });
  const [viewStudent, setViewStudent] = useState<any>(null);
  const [editStudent, setEditStudent] = useState<any>(null);
  const [deleteStudent, setDeleteStudent] = useState<any>(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    gender: 'MALE' as 'MALE' | 'FEMALE' | 'OTHER',
    classId: '',
    parentFirstName: '',
    parentLastName: '',
    phone: '',
    countryCode: '+256',
    address: '',
  });

  const queryClient = useQueryClient();

  // Fetch classes
  const { data: classesData } = useQuery({
    queryKey: ['classes'],
    queryFn: () => academicApi.getClasses(),
  });

  const classes = classesData?.data?.data || [];

  const { data, isLoading } = useQuery({
    queryKey: ['students', { search, page, ...filters }],
    queryFn: () => studentApi.getAll({ search, page, ...filters }),
  });

  const createMutation = useMutation({
    mutationFn: studentApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      setShowModal(false);
      setFormData({ firstName: '', lastName: '', gender: 'MALE', classId: '', parentFirstName: '', parentLastName: '', phone: '', countryCode: '+256', address: '' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => studentApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      setEditStudent(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => studentApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      setDeleteStudent(null);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate phone number
    const phoneRegex = /^\d{9}$/;
    const phoneDigits = formData.phone.replace(/\s/g, '');
    if (!phoneRegex.test(phoneDigits)) {
      alert('Please enter a valid 9-digit phone number (e.g., 772123456)');
      return;
    }

    // Filter out empty values and combine phone with country code
    const dataToSend = Object.fromEntries(
      Object.entries({ ...formData, phone: formData.countryCode + formData.phone }).filter(([_, value]) => value !== '')
    );
    // Remove countryCode from dataToSend as it's already combined
    delete dataToSend.countryCode;

    createMutation.mutate(dataToSend);
  };

  const students = data?.data?.data;
  const pagination = data?.data?.pagination;

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Students</h1>
          <p className="text-gray-500">Manage student records and admissions</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn btn-primary"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Student
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or student number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`btn btn-outline ${showFilters ? 'btn-primary' : ''}`}
          >
            <Filter className="w-5 h-5 mr-2" />
            Filters
          </button>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="card p-4">
          <h3 className="font-medium text-gray-900 mb-3">Filter Students</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
              <select
                value={filters.gender}
                onChange={(e) => setFilters({...filters, gender: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">All</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
              <select
                value={filters.classId}
                onChange={(e) => setFilters({...filters, classId: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">All Classes</option>
                {classes.map((cls: any) => (
                  <option key={cls.id} value={cls.id}>{cls.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({...filters, status: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">All</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
          </div>
          <div className="mt-3 flex justify-end">
            <button
              onClick={() => setFilters({ gender: '', classId: '', status: '' })}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Clear Filters
            </button>
          </div>
        </div>
      )}

      {/* Students table */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Loading students...</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Student No.</th>
                <th>Name</th>
                <th>Gender</th>
                <th>Class</th>
                <th>Parent</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {students?.map((student: any) => (
                <tr key={student.id}>
                  <td className="font-medium">{student.studentNo}</td>
                  <td>
                    {student.firstName} {student.lastName}
                  </td>
                  <td>{student.gender}</td>
                  <td>{student.class?.name || 'Not assigned'}</td>
                  <td>
                    {student.parent ? (
                      `${student.parent.firstName} ${student.parent.lastName}`
                    ) : (
                      '-'
                    )}
                  </td>
                  <td>
                    <span className={`badge ${student.status === 'ACTIVE' ? 'badge-success' : 'badge-warning'
                      }`}>
                      {student.status}
                    </span>
                  </td>
                  <td className="flex items-center gap-2">
                    <button 
                      onClick={() => setViewStudent(student)}
                      className="p-1.5 hover:bg-blue-50 text-blue-600 rounded" 
                      title="View"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => setEditStudent(student)}
                      className="p-1.5 hover:bg-yellow-50 text-yellow-600 rounded" 
                      title="Edit"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => setDeleteStudent(student)}
                      className="p-1.5 hover:bg-red-50 text-red-600 rounded" 
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {pagination && (
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={pagination.page === 1}
                className="btn btn-outline btn-sm"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={pagination.page === pagination.pages}
                className="btn btn-outline btn-sm"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Student Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 shrink-0">
              <h2 className="text-xl font-bold">Add New Student</h2>
              <button type="button" onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.firstName}
                      onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.lastName}
                      onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Gender *</label>
                    <select
                      required
                      value={formData.gender}
                      onChange={e => setFormData({ ...formData, gender: e.target.value as 'MALE' | 'FEMALE' | 'OTHER' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
                    <select
                      value={formData.classId}
                      onChange={e => setFormData({ ...formData, classId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="">Select Class</option>
                      {classes.map((cls: any) => (
                        <option key={cls.id} value={cls.id}>{cls.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Parent First Name</label>
                    <input
                      type="text"
                      value={formData.parentFirstName}
                      onChange={e => setFormData({ ...formData, parentFirstName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Parent Last Name</label>
                    <input
                      type="text"
                      value={formData.parentLastName}
                      onChange={e => setFormData({ ...formData, parentLastName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={e => setFormData({ ...formData, address: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                    <div className="flex w-full">
                      <select
                        value={formData.countryCode}
                        onChange={e => setFormData({ ...formData, countryCode: e.target.value })}
                        className="w-[110px] sm:w-[130px] px-3 py-2 border border-gray-300 border-r-0 rounded-l-lg bg-gray-50 text-gray-700"
                      >
                        {countryCodes.sort((a, b) => a.country.localeCompare(b.country)).map((c) => (
                          <option key={`${c.code}-${c.country}`} value={c.code}>
                            {c.code} ({c.country})
                          </option>
                        ))}
                      </select>
                      <input
                        type="tel"
                        required
                        placeholder="772123456"
                        value={formData.phone}
                        onChange={e => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '').slice(0, 9) })}
                        className="flex-1 min-w-0 px-3 py-2 border border-gray-300 rounded-r-lg"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Enter 9 digits (e.g., 772123456)</p>
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
                  {createMutation.isPending ? 'Adding...' : 'Add Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Student Modal */}
      {viewStudent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Student Details</h2>
              <button onClick={() => setViewStudent(null)} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Student No.</p>
                  <p className="font-medium">{viewStudent.studentNo}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <span className={`badge ${viewStudent.status === 'ACTIVE' ? 'badge-success' : 'badge-warning'}`}>
                    {viewStudent.status}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">First Name</p>
                  <p className="font-medium">{viewStudent.firstName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Last Name</p>
                  <p className="font-medium">{viewStudent.lastName}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Gender</p>
                  <p className="font-medium">{viewStudent.gender}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Class</p>
                  <p className="font-medium">{viewStudent.class?.name || 'Not assigned'}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="font-medium">{viewStudent.phone || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Address</p>
                  <p className="font-medium">{viewStudent.address || '-'}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500">Parent/Guardian</p>
                <p className="font-medium">
                  {viewStudent.parent 
                    ? `${viewStudent.parent.firstName} ${viewStudent.parent.lastName}` 
                    : '-'}
                </p>
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button onClick={() => setViewStudent(null)} className="btn btn-outline">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Student Modal */}
      {editStudent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-auto">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 my-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Edit Student</h2>
              <button onClick={() => setEditStudent(null)} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            <EditStudentForm 
              student={editStudent} 
              classes={classes}
              onSubmit={(data) => updateMutation.mutate({ id: editStudent.id, data })}
              onCancel={() => setEditStudent(null)}
              isLoading={updateMutation.isPending}
            />
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteStudent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Delete Student</h2>
              <button onClick={() => setDeleteStudent(null)} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete student <strong>{deleteStudent.firstName} {deleteStudent.lastName}</strong>?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteStudent(null)}
                className="flex-1 btn btn-outline"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteMutation.mutate(deleteStudent.id)}
                disabled={deleteMutation.isPending}
                className="flex-1 btn bg-red-600 text-white hover:bg-red-700"
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
