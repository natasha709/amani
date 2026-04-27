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
  CreditCard,
  Activity,
  Clock,
  CheckCircle2,
  AlertCircle,
  Trophy,
  Target,
  BarChart3,
  LineChart,
  Zap
} from 'lucide-react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Bar,
  Line,
  ComposedChart,
  Legend
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';
import { useState } from 'react';
import { Skeleton } from '../components/Skeleton';

export default function DashboardPage() {
  const { user } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month');

  // Data Queries
  const { data: summaryData, isLoading: summaryLoading } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: () => dashboardApi.getSummary(),
    staleTime: 5 * 60 * 1000,
  });

  const { data: financesData, isLoading: financesLoading } = useQuery({
    queryKey: ['dashboard-finances', selectedPeriod],
    queryFn: () => dashboardApi.getFinances({ period: selectedPeriod }),
    staleTime: 2 * 60 * 1000,
  });

  const { data: activityData, isLoading: activityLoading } = useQuery({
    queryKey: ['dashboard-activity'],
    queryFn: () => dashboardApi.getActivity(),
    staleTime: 60 * 1000,
  });

  const { data: academicsData } = useQuery({
    queryKey: ['dashboard-academics'],
    queryFn: () => dashboardApi.getAcademics(),
    staleTime: 5 * 60 * 1000,
  });

  const { data: saccoData, isLoading: saccoLoading } = useQuery({
    queryKey: ['dashboard-sacco'],
    queryFn: () => dashboardApi.getSacco(),
    staleTime: 5 * 60 * 1000,
  });

  const summary = summaryData?.data?.data;
  const finances = financesData?.data?.data;
  const activity = activityData?.data?.data;
  const academics = academicsData?.data?.data;
  const sacco = saccoData?.data?.data;

  // Color Palette
  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
  const financialColors = {
    collected: '#10b981',
    target: '#6366f1',
    pending: '#f59e0b'
  };

  // Computed metrics
  const collectionRate = finances?.expectedRevenue ? Math.round((finances.receivedRevenue / finances.expectedRevenue) * 100) : 0;

  // Chart data
  const enrollmentData = academics?.classEnrollment?.map((c: any, idx: number) => ({
    name: c.className,
    value: c.enrollment,
    fill: COLORS[idx % COLORS.length]
  })) || [];

  const monthlyTrend = finances?.monthlyTrend || [
    { month: 'Jan', collected: 4.5, target: 5.0 },
    { month: 'Feb', collected: 5.2, target: 5.0 },
    { month: 'Mar', collected: 4.8, target: 5.0 },
    { month: 'Apr', collected: 6.1, target: 5.0 },
    { month: 'May', collected: 5.9, target: 5.0 },
    { month: 'Jun', collected: 5.5, target: 5.0 },
  ];

  // Compact Metric Card Component
  type ColorKey = 'indigo' | 'emerald' | 'violet' | 'amber' | 'rose' | 'blue';

  interface MetricCardProps {
    title: string;
    value: string | number;
    icon: React.ComponentType<{ className?: string }>;
    color?: ColorKey;
    change?: string;
    subtitle?: string;
    delay?: number;
    loading?: boolean;
  }

  const colorMap: Record<ColorKey, { bg: string; text: string; ring: string }> = {
    indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600', ring: 'ring-indigo-500/20' },
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', ring: 'ring-emerald-500/20' },
    violet: { bg: 'bg-violet-50', text: 'text-violet-600', ring: 'ring-violet-500/20' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-600', ring: 'ring-amber-500/20' },
    rose: { bg: 'bg-rose-50', text: 'text-rose-600', ring: 'ring-rose-500/20' },
    blue: { bg: 'bg-blue-50', text: 'text-blue-600', ring: 'ring-blue-500/20' },
  };

  const MetricCard = ({ title, value, icon: Icon, color = 'indigo', change, subtitle, delay = 0, loading }: MetricCardProps) => {
    const colors = colorMap[color];

    if (loading) {
      return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }} className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
              {change && <div className="h-5 w-12 bg-gray-200 rounded animate-pulse" />}
            </div>
            <div className="h-8 w-24 bg-gray-200 rounded animate-pulse" />
          </div>
        </motion.div>
      );
    }

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -2 }}
        transition={{ delay }}
        className={`group relative overflow-hidden rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md hover:border-gray-300 transition-all duration-200 ring-1 ${colors.ring}`}
      >
        <div className="flex items-start justify-between">
          <div className={`p-2 rounded-lg ${colors.bg} ${colors.text}`}>
            <Icon className="w-5 h-5" />
          </div>
          {change && (
            <div className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold ${
              change.startsWith('+') ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
            }`}>
              {change.startsWith('+') ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              {change}
            </div>
          )}
        </div>
        
        <div className="mt-3">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">{title}</p>
          <h3 className="text-2xl font-bold text-gray-900 tracking-tight">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </h3>
          {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
        </div>
      </motion.div>
    );
  };

  const PeriodSelector = () => (
    <div className="inline-flex items-center p-1 bg-gray-100 rounded-lg">
      {(['week', 'month', 'year'] as const).map((period) => (
        <button
          key={period}
          onClick={() => setSelectedPeriod(period)}
          className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wide rounded-md transition-colors ${
            selectedPeriod === period
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          {period}
        </button>
      ))}
    </div>
  );

  // Helper function
  function formatAmount(amt: any) {
    if (!amt) return '0';
    return amt >= 1000000 ? `${(amt / 1000000).toFixed(1)}M` : amt.toLocaleString();
  }

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Dashboard</span>
            <div className="flex items-center gap-2 px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-bold">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              Live
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
            School Overview
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Welcome back, <span className="text-indigo-600 font-semibold">{user?.firstName}</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg">
            <Calendar className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-900">{summary?.currentTerm || 'No term set'}</span>
          </div>
          <PeriodSelector />
        </div>
      </div>

      {/* Metric Cards - 2x2 grid on mobile, 4 on desktop */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          title="Students"
          value={summary?.activeStudents || 0}
          icon={Users}
          color="indigo"
          change="+4.2%"
          delay={0.1}
          loading={summaryLoading}
        />
        <MetricCard
          title="Staff"
          value={summary?.totalStaff || 0}
          icon={GraduationCap}
          color="violet"
          delay={0.2}
          loading={summaryLoading}
        />
        <MetricCard
          title="Revenue"
          value={finances?.received ? formatAmount(finances.received) : '0'}
          icon={Wallet}
          color="emerald"
          change="+12.5%"
          subtitle="This period"
          delay={0.3}
          loading={financesLoading}
        />
        <MetricCard
          title="SACCO"
          value={sacco?.totalSavings ? formatAmount(sacco.totalSavings) : '0'}
          icon={PiggyBank}
          color="amber"
          delay={0.4}
          loading={saccoLoading}
        />
      </div>

      {/* Financial Performance Chart - Clean & Professional */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Financial Performance</h3>
              <p className="text-sm text-gray-500 mt-0.5">{selectedPeriod}ly collection trends</p>
            </div>
            <div className="p-2 bg-gray-50 rounded-lg">
              <LineChart className="w-5 h-5 text-gray-600" />
            </div>
          </div>

          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={monthlyTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis 
                  dataKey="month" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#6b7280', fontSize: 12, fontWeight: 500 }}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                  tickFormatter={(value) => `${value / 1000000}M`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '12px',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
                  }}
                  formatter={(value: number) => [`UGX ${value.toLocaleString()}`, '']}
                  labelFormatter={(label) => `${label}`}
                />
                <Legend wrapperStyle={{ paddingTop: '12px' }} iconType="circle" />
                <Bar 
                  dataKey="collected" 
                  name="Collected" 
                  fill={financialColors.collected}
                  radius={[4, 4, 0, 0]}
                  barSize={20}
                />
                <Line
                  type="monotone"
                  dataKey="target"
                  name="Target"
                  stroke={financialColors.target}
                  strokeWidth={2}
                  dot={{ fill: financialColors.target, strokeWidth: 2, r: 3 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-100">
            <div className="text-center">
              <p className="text-xs font-medium text-gray-500 mb-1">Target</p>
                <p className="text-lg font-bold text-gray-900">UGX {finances?.expectedRevenue ? formatAmount(finances.expectedRevenue) : '0'}</p>
            </div>
            <div className="text-center border-x border-gray-100">
              <p className="text-xs font-medium text-gray-500 mb-1">Collected</p>
                <p className="text-lg font-bold text-emerald-600">UGX {finances?.receivedRevenue ? formatAmount(finances.receivedRevenue) : '0'}</p>
            </div>
            <div className="text-center">
              <p className="text-xs font-medium text-gray-500 mb-1">Pending</p>
              <p className="text-lg font-bold text-amber-600">UGX {finances?.outstandingBalance ? formatAmount(finances.outstandingBalance) : '0'}</p>
            </div>
          </div>
        </motion.div>

        {/* Collection Progress - Side Panel */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl p-6 text-white"
        >
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-5 h-5" />
            <h3 className="font-semibold">Collection Progress</h3>
          </div>
          
          <div className="flex items-end gap-3 mb-4">
            <span className="text-5xl font-bold tracking-tight">{collectionRate}%</span>
            <span className="text-sm opacity-80 mb-1">of target</span>
          </div>

          <div className="relative h-32 mb-4">
            <svg className="w-32 h-32 absolute inset-0" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="8" />
              <motion.circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="white"
                strokeWidth="8"
                strokeLinecap="round"
                initial={{ strokeDasharray: `0, ${2 * Math.PI * 40}` }}
                animate={{ strokeDasharray: [`${(collectionRate / 100) * 2 * Math.PI * 40}, ${2 * Math.PI * 40}`] }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                transform="rotate(-90 50 50)"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <Trophy className="w-10 h-10 opacity-90" />
            </div>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="opacity-80">Collected</span>
              <span className="font-semibold">UGX {finances?.receivedRevenue ? formatAmount(finances.receivedRevenue) : '0'}</span>
            </div>
            <div className="flex justify-between">
              <span className="opacity-80">Target</span>
              <span className="font-semibold">UGX {finances?.expectedRevenue ? formatAmount(finances.expectedRevenue) : '0'}</span>
            </div>
            <div className="flex justify-between">
              <span className="opacity-80">Remaining</span>
              <span className="font-semibold">UGX {finances?.outstandingBalance ? formatAmount(finances.outstandingBalance) : '0'}</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Second Row: Enrollment & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Enrollment Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-white rounded-xl border border-gray-200 p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Enrollment by Class</h3>
              <p className="text-sm text-gray-500">Class distribution overview</p>
            </div>
            <div className="p-2 bg-indigo-50 rounded-lg">
              <PieChartIcon className="w-5 h-5 text-indigo-600" />
            </div>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={enrollmentData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {enrollmentData.map((_entry: any, index: number) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    padding: '8px 12px'
                  }}
                  formatter={(value: number) => [value, 'Students']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {enrollmentData.length > 0 && (
            <div className="grid grid-cols-2 gap-2 mt-4">
              {enrollmentData.slice(0, 4).map((item: any, idx: number) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                  <span className="text-xs text-gray-600">{item.name}: {item.value}</span>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Recent Payments */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-white rounded-xl border border-gray-200 p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Recent Transactions</h3>
              <p className="text-sm text-gray-500">Latest payment activity</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-xs font-medium text-emerald-600">Live</span>
            </div>
          </div>

          <div className="space-y-3">
            <AnimatePresence>
              {activity?.recentPayments?.slice(0, 4).map((payment: any, index: number) => (
                <motion.div
                  key={payment.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.9 + index * 0.05 }}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-white hover:shadow-sm hover:border hover:border-gray-200 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center font-semibold text-emerald-700 text-sm">
                      {payment.student.firstName[0]}{payment.student.lastName[0]}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {payment.student.firstName} {payment.student.lastName}
                      </p>
                      <p className="text-xs text-gray-500">{format(new Date(payment.paymentDate), 'MMM dd')}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900">UGX {payment.amount.toLocaleString()}</p>
                    <p className="text-xs text-emerald-600 font-medium">Completed</p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {!activity?.recentPayments?.length && !activityLoading && (
              <div className="py-8 text-center text-gray-400 text-sm">No transactions yet</div>
            )}

            {activityLoading && (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-14 w-full rounded-lg" />
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Quick Actions Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
        className="flex flex-wrap gap-3"
      >
        {[
          { icon: Users, label: 'Add Student', color: 'emerald' },
          { icon: Wallet, label: 'Payment', color: 'blue' },
          { icon: GraduationCap, label: 'Add Staff', color: 'violet' },
          { icon: Bell, label: 'Announcement', color: 'amber' },
        ].map((action) => (
          <button
            key={action.label}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-lg hover:border-gray-300 hover:shadow-sm transition-all group"
          >
            <action.icon className={`w-4 h-4 text-${action.color}-600`} />
            <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">{action.label}</span>
          </button>
        ))}
      </motion.div>
    </div>
  );
}
