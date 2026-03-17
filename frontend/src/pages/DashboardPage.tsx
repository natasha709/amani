import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../lib/api';
import {
  Users,
  GraduationCap,
  PiggyBank,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  PieChart as PieChartIcon,
  Calendar,
  Wallet,
  ArrowRight,
  Plus,
  Bell,
  ChevronRight,
  LayoutDashboard
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';

export default function DashboardPage() {
  const { user } = useAuth();

  // Data Queries
  const { data: summaryData } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: () => dashboardApi.getSummary(),
  });

  const { data: financesData } = useQuery({
    queryKey: ['dashboard-finances'],
    queryFn: () => dashboardApi.getFinances({ period: 'month' }),
  });

  const { data: activityData } = useQuery({
    queryKey: ['dashboard-activity'],
    queryFn: () => dashboardApi.getActivity(),
  });

  const { data: academicsData } = useQuery({
    queryKey: ['dashboard-academics'],
    queryFn: () => dashboardApi.getAcademics(),
  });

  const { data: saccoData } = useQuery({
    queryKey: ['dashboard-sacco'],
    queryFn: () => dashboardApi.getSacco(),
  });

  const summary = summaryData?.data?.data;
  const finances = financesData?.data?.data;
  const activity = activityData?.data?.data;
  const academics = academicsData?.data?.data;
  const sacco = saccoData?.data?.data;

  // Chart Color Palette
  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  // Prepared Chart Data
  const enrollmentData = academics?.classEnrollment?.map((c: any) => ({
    name: c.className,
    value: c.enrollment
  })) || [];

  const revenueData = [
    { name: 'Target', value: finances?.expectedRevenue || 0 },
    { name: 'Collected', value: finances?.receivedRevenue || 0 },
    { name: 'Balance', value: finances?.outstandingBalance || 0 }
  ];

  const MetricCard = ({ title, value, icon: Icon, color, change, delay = 0 }: any) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="group relative overflow-hidden card p-6 bg-white border border-gray-100 transition-all hover:shadow-2xl hover:border-indigo-100"
    >
      <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full bg-${color}-500/5 group-hover:scale-110 transition-transform`} />
      <div className="flex items-start justify-between relative z-10">
        <div className={`p-3 rounded-2xl bg-${color}-50 text-${color}-600`}>
          <Icon className="w-6 h-6" />
        </div>
        {change && (
          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${change.startsWith('+') ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
            {change.startsWith('+') ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {change}
          </div>
        )}
      </div>
      <div className="mt-4 relative z-10">
        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest leading-none mb-2">{title}</p>
        <h3 className="text-3xl font-black text-gray-900 tracking-tighter">
          {typeof value === 'number' && value > 1000 ? value.toLocaleString() : value}
        </h3>
      </div>
    </motion.div>
  );

  return (
    <div className="space-y-10 pb-20 animate-fadeIn">
      {/* Premium Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <div className="flex items-center gap-2 mb-2">
            <LayoutDashboard className="w-5 h-5 text-indigo-600" />
            <span className="text-xs font-black text-indigo-600 uppercase tracking-[0.2em]">Management Hub</span>
          </div>
          <h1 className="text-5xl font-black text-gray-950 tracking-tighter uppercase leading-none mb-3">
            School Overview
          </h1>
          <p className="text-gray-500 font-medium text-lg leading-relaxed max-w-xl">
            Welcome back, <span className="text-indigo-600 font-bold">{user?.firstName}</span>. System health is normal with regular engagement levels.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-4 bg-gray-50 p-4 rounded-[2rem] border border-gray-100"
        >
          <div className="p-3 bg-white rounded-2xl shadow-sm">
            <Calendar className="w-5 h-5 text-gray-400" />
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Current Academic Term</p>
            <p className="font-bold text-gray-900 leading-none">{summary?.currentTerm || 'Set in Settings'}</p>
          </div>
        </motion.div>
      </div>

      {/* Metric Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard title="Total Students" value={summary?.activeStudents || 0} icon={Users} color="indigo" change="+4.2%" delay={0.1} />
        <MetricCard title="Staff Members" value={summary?.totalStaff || 0} icon={GraduationCap} color="violet" delay={0.2} />
        <MetricCard title="Revenue (UGX)" value={finances?.collected ? `${(finances.collected / 1000000).toFixed(1)}M` : '0'} icon={Wallet} color="emerald" change="+12.5%" delay={0.3} />
        <MetricCard title="SACCO Balance" value={sacco?.totalSavings ? `${(sacco.totalSavings / 1000000).toFixed(1)}M` : '0'} icon={PiggyBank} color="amber" delay={0.4} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Main Analytics: Revenue vs Expected */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="lg:col-span-8 card bg-white border border-gray-100 p-8 hover:shadow-2xl transition-all"
        >
          <div className="flex items-center justify-between mb-10">
            <div>
              <h3 className="text-2xl font-black text-gray-950 tracking-tighter uppercase italic leading-none">Financial Performance</h3>
              <p className="text-gray-400 text-sm font-bold uppercase tracking-widest mt-2">{periodLabel(financesData?.data?.data?.period || 'Month')}ly collection analytics</p>
            </div>
            <div className="flex gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gray-50 border border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                Target: UGX {formatAmount(finances?.expectedRevenue)}
              </div>
            </div>
          </div>

          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 700 }} />
                <YAxis hide />
                <Tooltip
                  content={({ active, payload }: any) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-gray-950 text-white p-4 rounded-2xl shadow-2xl border-none">
                          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">{payload[0].payload.name}</p>
                          <p className="text-lg font-black tracking-tighter">UGX {payload[0].value.toLocaleString()}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#6366f1"
                  strokeWidth={4}
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-3 gap-6 mt-10 pt-10 border-t border-gray-50">
            <div className="text-center">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 italic">Total Expected</p>
              <p className="text-xl font-black text-gray-900 leading-none">UGX {formatAmount(finances?.expectedRevenue)}</p>
            </div>
            <div className="text-center border-x border-gray-50">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 italic">Processed</p>
              <p className="text-xl font-black text-indigo-600 leading-none">UGX {formatAmount(finances?.receivedRevenue)}</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 italic">Pending</p>
              <p className="text-xl font-black text-rose-600 leading-none">UGX {formatAmount(finances?.outstandingBalance)}</p>
            </div>
          </div>
        </motion.div>

        {/* Enrollment Distribution */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
          className="lg:col-span-4 card bg-gray-950 p-8 text-white relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl" />
          <div className="flex items-center justify-between mb-8 relative z-10">
            <div>
              <h3 className="text-xl font-black text-white tracking-tighter uppercase italic leading-none">Enrollment</h3>
              <p className="text-indigo-400 text-[10px] font-black uppercase tracking-widest mt-1">Class Distribution</p>
            </div>
            <PieChartIcon className="w-5 h-5 text-indigo-400" />
          </div>

          <div className="h-64 relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={enrollmentData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {enrollmentData.map((_entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-4 mt-8 relative z-10 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
            {enrollmentData.map((item: any, index: number) => (
              <div key={item.name} className="flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <span className="text-sm font-bold text-gray-400 group-hover:text-white transition-colors">{item.name}</span>
                </div>
                <span className="text-sm font-black text-white">{item.value} Students</span>
              </div>
            ))}
          </div>

          <button className="w-full mt-10 py-4 bg-white/10 hover:bg-white/20 border border-white/10 rounded-2xl flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest transition-all">
            Full Academic Audit <ChevronRight className="w-4 h-4" />
          </button>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Transactions Feed */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="card bg-white border border-gray-100 p-8"
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-black text-gray-950 tracking-tighter uppercase italic">Recent Ledger</h3>
              <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mt-1">Verified Payment Stream</p>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>

          <div className="space-y-4">
            {activity?.recentPayments?.map((payment: any) => (
              <div key={payment.id} className="flex items-center justify-between p-4 bg-gray-50/50 rounded-2xl group hover:bg-white hover:shadow-xl hover:shadow-indigo-500/5 hover:-translate-y-0.5 transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-gray-100 flex items-center justify-center font-black text-emerald-500">
                    {payment.student.firstName[0]}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors uppercase italic">{payment.student.firstName} {payment.student.lastName}</p>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-0.5 italic">{payment.student.studentNo}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-black text-gray-900">UGX {payment.amount.toLocaleString()}</p>
                  <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">{format(new Date(payment.paymentDate), 'MMM dd, yyyy')}</p>
                </div>
              </div>
            ))}
            {!activity?.recentPayments?.length && (
              <div className="py-20 text-center text-gray-300 italic">No historical data available.</div>
            )}
          </div>

          <button className="w-full mt-6 py-4 bg-indigo-50 text-indigo-600 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-indigo-100 transition-all flex items-center justify-center gap-2 border border-indigo-100">
            Financial Hub <ArrowRight className="w-4 h-4" />
          </button>
        </motion.div>

        {/* Boardroom Announcements */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="card bg-white border border-gray-100 p-8"
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-black text-gray-950 tracking-tighter uppercase italic text-indigo-600">Boardroom Updates</h3>
              <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mt-1">Official School Broadcasts</p>
            </div>
            <div className="p-3 bg-red-50 text-red-600 rounded-2xl animate-pulse">
              <Bell className="w-5 h-5" />
            </div>
          </div>

          <div className="space-y-6">
            {activity?.announcements?.map((ann: any, index: number) => (
              <div key={index} className="relative pl-6 before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-indigo-100 before:rounded-full group hover:before:bg-indigo-600 transition-all">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-black text-gray-900 text-sm italic group-hover:text-indigo-600 transition-colors">{ann.title}</h4>
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic">{format(new Date(ann.publishedAt), 'MMM dd')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border ${ann.type === 'EMERGENCY' ? 'bg-red-50 text-red-600 border-red-100' :
                    'bg-indigo-50 text-indigo-600 border-indigo-100'
                    }`}>
                    {ann.type}
                  </span>
                  <p className="text-[10px] font-bold text-gray-400 italic">Global Distribution</p>
                </div>
              </div>
            ))}
            {!activity?.announcements?.length && (
              <div className="py-20 text-center text-gray-300 italic">Silence on the airwaves. No broadcasts found.</div>
            )}
          </div>

          <div className="mt-auto pt-10">
            <div className="card bg-gray-50 p-6 border-dashed border-2 border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center border border-gray-100">
                  <Plus className="w-4 h-4 text-indigo-600" />
                </div>
                <div>
                  <h5 className="text-[10px] font-black text-gray-950 uppercase tracking-widest leading-none mb-1">Action Required</h5>
                  <p className="text-xs font-bold text-gray-400 italic">Broadcast an update to all staff and students.</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );

  // Helper Functions
  function formatAmount(amt: any) {
    if (!amt) return '0';
    return amt >= 1000000 ? `${(amt / 1000000).toFixed(1)}M` : amt.toLocaleString();
  }

  function periodLabel(p: string) {
    return p.charAt(0).toUpperCase() + p.slice(1);
  }
}

