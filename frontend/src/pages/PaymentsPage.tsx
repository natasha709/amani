import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { paymentApi, studentApi, academicApi } from '../lib/api';
import { Plus, Search, Filter, X, CreditCard, Receipt } from 'lucide-react';

export default function PaymentsPage() {
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState('');

  // Create payment form state
  const [formData, setFormData] = useState({
    studentId: '',
    feeStructureId: '',
    amount: '',
    paymentMethod: 'CASH',
    transactionRef: '',
    paymentChannel: '',
    notes: '',
  });

  const queryClient = useQueryClient();

  // Fetch payments
  const { data: paymentsData, isLoading } = useQuery({
    queryKey: ['payments', { search }],
    queryFn: () => paymentApi.getAll({ search }),
  });

  // Fetch active students for the searchable dropdown
  const { data: studentsData } = useQuery({
    queryKey: ['students', { limit: 1000 }],
    queryFn: () => studentApi.getAll({ limit: 1000 }),
  });

  // Fetch specific student's fee balances if a student is selected
  const { data: studentFeesData, isLoading: isLoadingStudentFees } = useQuery({
    queryKey: ['student-fees', formData.studentId],
    queryFn: () => studentApi.getFees(formData.studentId),
    enabled: !!formData.studentId,
  });

  // Fetch classes to filter students
  const { data: classesData } = useQuery({
    queryKey: ['classes-list'],
    queryFn: () => academicApi.getClasses(),
  });

  const payments = paymentsData?.data?.data || [];
  const classes = classesData?.data?.data || [];
  const students = (studentsData?.data?.data || []).filter((s: any) => !selectedClassId || s.classId === selectedClassId);
  const studentFeeBalances = studentFeesData?.data?.data?.feeBalances || [];

  const createMutation = useMutation({
    mutationFn: paymentApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-finances'] });
      setShowModal(false);
      setFormData({
        studentId: '',
        feeStructureId: '',
        amount: '',
        paymentMethod: 'CASH',
        transactionRef: '',
        paymentChannel: '',
        notes: '',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      ...formData,
      amount: parseFloat(formData.amount),
    });
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
          <p className="text-gray-500">Record and track fee collections</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn btn-primary"
        >
          <Plus className="w-5 h-5 mr-2" />
          Record Payment
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by receipt number, student name, or transaction ref..."
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

      {/* Payments table */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Loading payments...</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Receipt #</th>
                <th>Payment Date</th>
                <th>Student</th>
                <th>Amount (UGX)</th>
                <th>Method</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {payments.length > 0 ? (
                payments.map((payment: any) => (
                  <tr key={payment.id}>
                    <td className="font-medium text-blue-600">
                      {payment.receiptNo}
                    </td>
                    <td>{new Date(payment.paymentDate).toLocaleDateString()}</td>
                    <td>
                      <div>
                        {payment.student?.firstName} {payment.student?.lastName}
                        <div className="text-xs text-gray-500">{payment.student?.studentNo}</div>
                      </div>
                    </td>
                    <td className="font-semibold text-gray-900">
                      {payment.amount.toLocaleString()}
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        <CreditCard className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">
                          {payment.paymentMethod}
                          {payment.paymentChannel && ` - ${payment.paymentChannel}`}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className="flex flex-col gap-1 items-start">
                        <span className={`badge ${payment.feeBalance ? (
                          payment.feeBalance.balance === 0 ? 'badge-success' : 'badge-warning'
                        ) : (
                          payment.status === 'COMPLETED' ? 'badge-success' :
                            payment.status === 'PENDING' ? 'badge-warning' : 'badge-error'
                        )
                          }`}>
                          {payment.feeBalance ? (
                            payment.feeBalance.balance === 0 ? 'SETTLED' : 'PARTIAL'
                          ) : payment.status}
                        </span>
                        {payment.feeBalance && payment.feeBalance.balance > 0 && (
                          <span className="text-xs text-red-600 font-bold whitespace-nowrap">
                            {payment.feeBalance.balance.toLocaleString()} UGX STILL DUE
                          </span>
                        )}
                        {payment.feeStructure && (
                          <span className="text-xs text-gray-500 whitespace-nowrap">
                            {payment.feeStructure.name}
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <button className="btn btn-outline btn-sm" title="Download Receipt">
                        <Receipt className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    No payment records found. Click "Record Payment" to add one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Record Payment Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 shrink-0">
              <h2 className="text-xl font-bold">Record Payment</h2>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-6 space-y-4">

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Class</label>
                    <select
                      value={selectedClassId}
                      onChange={e => {
                        setSelectedClassId(e.target.value);
                        setFormData({ ...formData, studentId: '' });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="">All Classes</option>
                      {classes.map((cls: any) => (
                        <option key={cls.id} value={cls.id}>{cls.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Student *</label>
                    <select
                      required
                      value={formData.studentId}
                      onChange={e => setFormData({ ...formData, studentId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100"
                    >
                      <option value="">Select Student</option>
                      {students.map((stu: any) => (
                        <option key={stu.id} value={stu.id}>
                          {stu.studentNo} - {stu.firstName} {stu.lastName}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fee Structure (Optional)</label>
                  <select
                    value={formData.feeStructureId}
                    onChange={e => {
                      const selectedFeeId = e.target.value;
                      const selectedBalance = studentFeeBalances.find((fb: any) => fb.feeStructure.id === selectedFeeId);
                      setFormData({
                        ...formData,
                        feeStructureId: selectedFeeId,
                        // Auto-fill the amount with their exact pending balance
                        amount: selectedBalance ? selectedBalance.balance.toString() : formData.amount
                      });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    disabled={!formData.studentId || isLoadingStudentFees}
                  >
                    <option value="">
                      {!formData.studentId ? 'Please select a student first' :
                        isLoadingStudentFees ? 'Loading balances...' : 'Apply to general outstanding balance'}
                    </option>
                    {studentFeeBalances
                      .filter((fb: any) => fb.balance > 0)
                      .map((fb: any) => (
                        <option key={fb.feeStructure.id} value={fb.feeStructure.id}>
                          {fb.feeStructure.name} (Pending: {fb.balance.toLocaleString()} UGX)
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount Paid (UGX) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="e.g. 500000"
                    value={formData.amount}
                    onChange={e => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg font-bold text-lg"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method *</label>
                    <select
                      required
                      value={formData.paymentMethod}
                      onChange={e => setFormData({ ...formData, paymentMethod: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="CASH">Cash</option>
                      <option value="MOBILE_MONEY">Mobile Money</option>
                      <option value="BANK_TRANSFER">Bank Transfer</option>
                      <option value="CARD">Credit/Debit Card</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Reference No.</label>
                    <input
                      type="text"
                      placeholder="e.g. Bank slip or MoMo ID"
                      value={formData.transactionRef}
                      onChange={e => setFormData({ ...formData, transactionRef: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>

                {formData.paymentMethod === 'MOBILE_MONEY' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Provider Channel</label>
                    <select
                      value={formData.paymentChannel}
                      onChange={e => setFormData({ ...formData, paymentChannel: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="">Select network</option>
                      <option value="MTN_MOMO">MTN Mobile Money</option>
                      <option value="AIRTEL_MONEY">Airtel Money</option>
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Internal Notes</label>
                  <textarea
                    rows={2}
                    value={formData.notes}
                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="E.g. Paid by uncle, requested print receipt..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none"
                  ></textarea>
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
                  className="flex-1 btn btn-primary bg-green-600 hover:bg-green-700 border-none"
                >
                  {createMutation.isPending ? 'Processing...' : 'Record Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
