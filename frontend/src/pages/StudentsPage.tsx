import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { studentApi } from '../lib/api';
import { Plus, Search, Filter, MoreVertical } from 'lucide-react';

export default function StudentsPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['students', { search, page }],
    queryFn: () => studentApi.getAll({ search, page }),
  });

  const students = data?.data?.data;
  const pagination = data?.data?.pagination;

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Students</h1>
          <p className="text-gray-500">Manage student records and admissions</p>
        </div>
        <button className="btn btn-primary">
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
          <button className="btn btn-outline">
            <Filter className="w-5 h-5 mr-2" />
            Filters
          </button>
        </div>
      </div>

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
                  <td>{student.class?.name || 'Not assigned'}</td>
                  <td>
                    {student.parent ? (
                      `${student.parent.firstName} ${student.parent.lastName}`
                    ) : (
                      '-'
                    )}
                  </td>
                  <td>
                    <span className={`badge ${
                      student.status === 'ACTIVE' ? 'badge-success' : 'badge-warning'
                    }`}>
                      {student.status}
                    </span>
                  </td>
                  <td>
                    <button className="p-1 hover:bg-gray-100 rounded">
                      <MoreVertical className="w-5 h-5 text-gray-500" />
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
    </div>
  );
}
