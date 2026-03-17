import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { saccoApi } from '../lib/api';
import {
  Wallet,
  Users,
  Coins,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  Search,
  ChevronRight,
  TrendingUp,
  Landmark,
  X,
  History,
  FileText
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

type Tab = 'overview' | 'members' | 'loans';

export default function SaccoPage() {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [showTxModal, setShowTxModal] = useState(false);
  const [showLoanModal, setShowLoanModal] = useState(false);
  const [selectedMemberTx, setSelectedMemberTx] = useState<any>(null);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch Sacco Summary & Members
  const { data: membersData } = useQuery({
    queryKey: ['sacco-members'],
    queryFn: () => saccoApi.getMembers(),
  });

  // Fetch Loans
  const { data: loansData } = useQuery({
    queryKey: ['sacco-loans'],
    queryFn: () => saccoApi.getLoans(),
  });

  // Fetch Eligible Staff for Registration
  const { data: staffData } = useQuery({
    queryKey: ['eligible-staff'],
    queryFn: () => saccoApi.getEligibleStaff(),
    enabled: showMemberModal
  });

  const members = membersData?.data?.data || [];
  const loans = loansData?.data?.data || [];
  const summary = membersData?.data?.summary || {
    totalMembers: 0,
    totalSavings: 0,
    totalLoansDisbursed: 0,
    outstandingLoans: 0
  };
  const eligibleStaff = staffData?.data?.data || [];

  const registerMutation = useMutation({
    mutationFn: saccoApi.registerMember,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sacco-members'] });
      queryClient.invalidateQueries({ queryKey: ['eligible-staff'] });
      setShowMemberModal(false);
    }
  });

  const loanMutation = useMutation({
    mutationFn: saccoApi.applyLoan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sacco-loans'] });
      setShowLoanModal(false);
    }
  });

  const approveLoanMutation = useMutation({
    mutationFn: (id: string) => saccoApi.approveLoan(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sacco-loans'] });
      queryClient.invalidateQueries({ queryKey: ['sacco-members'] });
    }
  });

  const txMutation = useMutation({
    mutationFn: saccoApi.createTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sacco-members'] });
      setShowTxModal(false);
      setSelectedMemberTx(null);
    }
  });

  const StatCard = ({ title, value, icon: Icon, color, subValue }: any) => (
    <div className="card p-6 bg-white border border-gray-100 hover:shadow-xl transition-all group overflow-hidden relative">
      <div className={`absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 bg-${color}-500/5 rounded-full group-hover:scale-110 transition-transform`} />
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">{title}</p>
          <h3 className="text-2xl font-black text-gray-900 leading-none">
            {typeof value === 'number' ? `UGX ${value.toLocaleString()}` : value}
          </h3>
          {subValue && (
            <p className="text-xs font-bold text-gray-400 mt-2 flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-green-500" />
              {subValue}
            </p>
          )}
        </div>
        <div className={`p-3 bg-${color}-50 rounded-2xl text-${color}-600`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black text-gray-950 tracking-tighter uppercase">Staff SACCO</h1>
          <p className="text-gray-500 font-medium">Financial wellness & school development circle</p>
        </div>
        <div className="flex gap-3">
          {(user?.role === 'SCHOOL_OWNER' || user?.role === 'ADMIN') && (
            <button
              onClick={() => setShowMemberModal(true)}
              className="btn bg-gray-950 text-white hover:bg-black border-none px-6 rounded-2xl shadow-lg"
            >
              <Plus className="w-4 h-4 mr-2" /> New Member
            </button>
          )}
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex gap-1 bg-gray-100 p-1.5 rounded-2xl w-fit">
        {(['overview', 'members', 'loans'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-8 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === tab
              ? 'bg-white text-gray-950 shadow-sm'
              : 'text-gray-400 hover:text-gray-900'
              }`}
          >
            {tab.charAt(0) + tab.slice(1)}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Main Key Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard title="Total Savings" value={summary.totalSavings} icon={Wallet} color="indigo" subValue="+12% from last month" />
            <StatCard title="Outstanding Loans" value={summary.outstandingLoans} icon={Coins} color="orange" subValue="Recovering on schedule" />
            <StatCard title="Sacco Members" value={summary.totalMembers} icon={Users} color="emerald" subValue="82% Staff participation" />
            <StatCard title="Total Disbursed" value={summary.totalLoansDisbursed} icon={Landmark} color="blue" subValue="Since inception" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Quick Actions Card */}
            <div className="lg:col-span-1 space-y-6">
              <div className="card p-8 bg-gray-950 text-white relative overflow-hidden">
                <div className="absolute -bottom-8 -right-8 w-40 h-40 bg-white/5 rounded-full blur-2xl" />
                <h3 className="text-2xl font-black mb-1">Financial Power</h3>
                <p className="text-gray-400 text-sm mb-8 italic">Enhancing staff resilience and growth through collective savings.</p>

                <div className="space-y-3 relative z-10">
                  <button onClick={() => { setActiveTab('members'); setShowTxModal(true); }} className="w-full py-4 bg-white text-gray-950 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-gray-100 transition-all flex items-center justify-center gap-2">
                    <ArrowUpRight className="w-4 h-4" /> Deposit Funds
                  </button>
                  <button onClick={() => setActiveTab('loans')} className="w-full py-4 bg-gray-800 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-gray-700 transition-all flex items-center justify-center gap-2 border border-gray-700">
                    <Coins className="w-4 h-4" /> Apply for Loan
                  </button>
                </div>
              </div>

              <div className="card p-6 border-dashed border-2 border-primary-100 bg-primary-50/10">
                <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2 italic">
                  <TrendingUp className="w-4 h-4 text-primary-500" /> SACCO News
                </h4>
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary-400 mt-1.5" />
                    <p className="text-sm text-gray-600">Annual dividend payout planned for next month.</p>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary-400 mt-1.5" />
                    <p className="text-sm text-gray-600">New emergency loan facility starts at 5% interest.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Transactions List */}
            <div className="lg:col-span-2 card bg-white border border-gray-100 p-8">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 uppercase">Membership List</h3>
                  <p className="text-sm text-gray-400 font-medium">Top contributors & active members</p>
                </div>
                <button onClick={() => setActiveTab('members')} className="text-sm font-black text-indigo-600 flex items-center gap-1 hover:gap-2 transition-all">
                  Full Register <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                {members.slice(0, 5).map((member: any) => (
                  <div key={member.id} className="flex items-center justify-between p-4 bg-gray-50/50 rounded-2xl border border-transparent hover:border-gray-100 hover:bg-white transition-all group">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center font-black text-gray-400 border border-gray-100">
                        {member.user.firstName[0]}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">{member.user.firstName} {member.user.lastName}</p>
                        <p className="text-xs text-gray-400 font-bold uppercase">{member.memberNo}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-gray-900">UGX {member.totalSavings.toLocaleString()}</p>
                      <p className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Total Savings</p>
                    </div>
                  </div>
                ))}

                {members.length === 0 && (
                  <div className="py-20 text-center text-gray-300 italic">
                    No members registered yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'members' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="relative w-96">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search members by name or NO..."
                className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-2xl font-medium focus:ring-4 focus:ring-indigo-50 border-none shadow-sm"
              />
            </div>
          </div>

          <div className="card overflow-hidden bg-white border border-gray-100 shadow-xl">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="px-8 py-5 text-xs font-black text-gray-400 uppercase tracking-widest">Member Info</th>
                  <th className="px-8 py-5 text-xs font-black text-gray-400 uppercase tracking-widest text-right">Savings</th>
                  <th className="px-8 py-5 text-xs font-black text-gray-400 uppercase tracking-widest text-right">Outstanding Loan</th>
                  <th className="px-8 py-5 text-xs font-black text-gray-400 uppercase tracking-widest text-right">Joined</th>
                  <th className="px-8 py-5 text-xs font-black text-gray-400 uppercase tracking-widest text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {members.map((member: any) => (
                  <tr key={member.id} className="hover:bg-indigo-50/20 transition-colors">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center font-bold text-indigo-600">
                          {member.user.firstName[0]}
                        </div>
                        <div>
                          <p className="font-black text-gray-900">{member.user.firstName} {member.user.lastName}</p>
                          <p className="text-xs text-gray-400 font-bold uppercase">{member.memberNo}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right font-black text-gray-900 italic">UGX {member.totalSavings.toLocaleString()}</td>
                    <td className="px-8 py-5 text-right">
                      <span className={`font-black ${member.outstandingLoan > 0 ? 'text-orange-600' : 'text-gray-400'}`}>
                        UGX {member.outstandingLoan.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right text-sm text-gray-500 font-medium">
                      {new Date(member.joinedAt).toLocaleDateString()}
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => { setSelectedMemberTx(member); setShowTxModal(true); }}
                          className="p-2.5 text-indigo-600 bg-indigo-50 rounded-xl hover:bg-indigo-100 transition-all font-black"
                          title="Record Deposit"
                        >
                          <ArrowUpRight className="w-4 h-4" />
                        </button>
                        <button
                          className="p-2.5 text-gray-400 hover:text-gray-900 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all"
                          title="Withdrawal"
                        >
                          <ArrowDownLeft className="w-4 h-4" />
                        </button>
                        <button
                          className="p-2.5 text-gray-400 hover:text-gray-900 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all"
                          title="View History"
                        >
                          <History className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'loans' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-gray-900 uppercase">Loan Applications</h3>
            <button
              onClick={() => setShowLoanModal(true)}
              className="btn btn-primary bg-indigo-600 border-none"
            >
              <Coins className="w-4 h-4 mr-2" /> Apply for Loan
            </button>
          </div>

          <div className="card overflow-hidden bg-white border border-gray-100 shadow-xl">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="px-8 py-5 text-xs font-black text-gray-400 uppercase tracking-widest">Applicant</th>
                  <th className="px-8 py-5 text-xs font-black text-gray-400 uppercase tracking-widest text-right">Amount</th>
                  <th className="px-8 py-5 text-xs font-black text-gray-400 uppercase tracking-widest">Purpose</th>
                  <th className="px-8 py-5 text-xs font-black text-gray-400 uppercase tracking-widest text-center">Status</th>
                  <th className="px-8 py-5 text-xs font-black text-gray-400 uppercase tracking-widest text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loans.map((loan: any) => (
                  <tr key={loan.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-8 py-5">
                      <p className="font-black text-gray-900">{loan.member.user.firstName} {loan.member.user.lastName}</p>
                      <p className="text-xs text-gray-400 font-bold uppercase">{loan.applicationNo}</p>
                    </td>
                    <td className="px-8 py-5 text-right font-black text-gray-900">UGX {loan.amount.toLocaleString()}</td>
                    <td className="px-8 py-5 text-sm text-gray-600">{loan.purpose}</td>
                    <td className="px-8 py-5 text-center">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${loan.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                        loan.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                        {loan.status}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex justify-center gap-2">
                        {loan.status === 'PENDING' && (user?.role === 'SCHOOL_OWNER' || user?.role === 'ADMIN') && (
                          <button
                            onClick={() => approveLoanMutation.mutate(loan.id)}
                            className="px-4 py-2 bg-green-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-green-700 transition-all"
                          >
                            Approve
                          </button>
                        )}
                        <button className="p-2 text-gray-400 hover:text-gray-900">
                          <FileText className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {loans.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-20 text-center text-gray-300 italic">No loan applications found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}

      {/* Member Registration Modal */}
      {showMemberModal && (
        <div className="fixed inset-0 bg-gray-950/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md p-10 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-50 rounded-full -mr-10 -mt-10 opacity-50" />

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-black text-gray-950 tracking-tighter uppercase">New Member</h2>
                  <p className="text-gray-400 font-bold text-xs uppercase tracking-widest mt-1">Sacco Enrollment</p>
                </div>
                <button onClick={() => setShowMemberModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <form onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                registerMutation.mutate({
                  userId: fd.get('userId'),
                  memberType: fd.get('memberType')
                });
              }} className="space-y-6">
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3 italic">1. Select Staff Member</label>
                  <select name="userId" required className="w-full px-5 py-4 bg-gray-50 border-none rounded-[1.25rem] font-bold text-gray-950 focus:ring-4 focus:ring-indigo-100 transition-all outline-none">
                    <option value="">Staff to enroll...</option>
                    {eligibleStaff.map((staff: any) => (
                      <option key={staff.id} value={staff.id}>{staff.firstName} {staff.lastName} ({staff.role})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3 italic">2. Membership Tier</label>
                  <select name="memberType" required className="w-full px-5 py-4 bg-gray-50 border-none rounded-[1.25rem] font-bold text-gray-950 focus:ring-4 focus:ring-indigo-100 transition-all outline-none">
                    <option value="TEACHER">Regular Teacher</option>
                    <option value="ADMIN">Administrator</option>
                    <option value="FOUNDER">School Founder</option>
                  </select>
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    className="w-full py-5 bg-indigo-600 text-white rounded-[1.25rem] font-black uppercase text-sm tracking-[0.2em] shadow-xl shadow-indigo-200 hover:bg-indigo-700 hover:-translate-y-1 transition-all flex items-center justify-center gap-2"
                    disabled={registerMutation.isPending}
                  >
                    {registerMutation.isPending ? 'Verifying...' : 'Enroll Member'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Loan Application Modal */}
      {showLoanModal && (
        <div className="fixed inset-0 bg-gray-950/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md p-10 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full -mr-10 -mt-10 opacity-50" />

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-black text-gray-950 tracking-tighter uppercase">Loan Application</h2>
                  <p className="text-gray-400 font-bold text-xs uppercase tracking-widest mt-1">Financial Assistance Request</p>
                </div>
                <button onClick={() => setShowLoanModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <form onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                loanMutation.mutate({
                  memberId: fd.get('memberId'),
                  amount: parseFloat(fd.get('amount') as string),
                  purpose: fd.get('purpose'),
                  durationMonths: parseInt(fd.get('duration') as string)
                });
              }} className="space-y-6">
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3 italic">Select Member</label>
                  <select name="memberId" required className="w-full px-5 py-4 bg-gray-50 border-none rounded-[1.25rem] font-bold text-gray-950 focus:ring-4 focus:ring-indigo-100 transition-all outline-none">
                    <option value="">Choose applicant...</option>
                    {members.map((m: any) => (
                      <option key={m.id} value={m.id}>{m.user.firstName} {m.user.lastName}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3 italic">Amount (UGX)</label>
                    <input
                      name="amount"
                      type="number"
                      required
                      className="w-full px-5 py-4 bg-gray-50 border-none rounded-[1.25rem] font-black text-gray-950 focus:ring-4 focus:ring-indigo-100 transition-all outline-none"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3 italic">Period (Months)</label>
                    <select name="duration" required className="w-full px-5 py-4 bg-gray-50 border-none rounded-[1.25rem] font-bold text-gray-950 focus:ring-4 focus:ring-indigo-100 transition-all outline-none">
                      <option value="3">3 Months</option>
                      <option value="6">6 Months</option>
                      <option value="12">12 Months</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3 italic">Purpose of Loan</label>
                  <textarea
                    name="purpose"
                    required
                    rows={2}
                    className="w-full px-5 py-4 bg-gray-50 border-none rounded-[1.25rem] font-bold text-gray-950 focus:ring-4 focus:ring-indigo-100 transition-all outline-none resize-none"
                    placeholder="e.g. Hospital bill, School fees, Development"
                  ></textarea>
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    className="w-full py-5 bg-indigo-600 text-white rounded-[1.25rem] font-black uppercase text-sm tracking-[0.2em] shadow-xl shadow-indigo-200 hover:bg-indigo-700 hover:-translate-y-1 transition-all flex items-center justify-center gap-2"
                    disabled={loanMutation.isPending}
                  >
                    {loanMutation.isPending ? 'Submitting...' : 'Submit Application'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      {showTxModal && selectedMemberTx && (
        <div className="fixed inset-0 bg-gray-950/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md p-10 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-32 h-32 bg-emerald-50 rounded-full -ml-10 -mt-10 opacity-50" />

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-black text-gray-950 tracking-tighter uppercase">Record Deposit</h2>
                  <p className="text-gray-400 font-bold text-xs uppercase tracking-widest mt-1">For {selectedMemberTx.user.firstName} {selectedMemberTx.user.lastName}</p>
                </div>
                <button onClick={() => setShowTxModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <form onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                txMutation.mutate({
                  memberId: selectedMemberTx.id,
                  type: 'DEPOSIT',
                  amount: parseFloat(fd.get('amount') as string),
                  description: fd.get('description'),
                  reference: fd.get('reference') || ''
                });
              }} className="space-y-6">
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3 italic">Deposit Amount (UGX)</label>
                  <input
                    name="amount"
                    type="number"
                    required
                    className="w-full px-5 py-4 bg-gray-50 border-none rounded-[1.25rem] font-black text-2xl text-emerald-600 focus:ring-4 focus:ring-emerald-100 transition-all outline-none"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3 italic">Reference (Optional)</label>
                  <input
                    name="reference"
                    className="w-full px-5 py-4 bg-gray-50 border-none rounded-[1.25rem] font-bold text-gray-950 focus:ring-4 focus:ring-emerald-100 transition-all outline-none"
                    placeholder="Receipt or Phone ID"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3 italic">Description</label>
                  <textarea
                    name="description"
                    required
                    rows={2}
                    className="w-full px-5 py-4 bg-gray-50 border-none rounded-[1.25rem] font-bold text-gray-950 focus:ring-4 focus:ring-emerald-100 transition-all outline-none resize-none"
                    placeholder="e.g. Monthly contribution for March"
                  ></textarea>
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    className="w-full py-5 bg-emerald-600 text-white rounded-[1.25rem] font-black uppercase text-sm tracking-[0.2em] shadow-xl shadow-emerald-200 hover:bg-emerald-700 hover:-translate-y-1 transition-all flex items-center justify-center gap-2"
                    disabled={txMutation.isPending}
                  >
                    {txMutation.isPending ? 'Processing...' : 'Complete Deposit'}
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

