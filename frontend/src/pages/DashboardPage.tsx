import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../lib/api';
import { Users, GraduationCap, CreditCard, PiggyBank, TrendingUp, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

export default function DashboardPage() {
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

  const summary = summaryData?.data?.data;
  const finances = financesData?.data?.data;
  const activity = activityData?.data?.data;

  // Sample chart data
  const chartData = [
    { name: 'Week 1', collections: 4500000 },
    { name: 'Week 2', collections: 3200000 },
    { name: 'Week 3', collections: 5800000 },
    { name: 'Week 4', collections: 4100000 },
  ];

  const stats = [
    { 
      name: 'Total Students', 
      value: summary?.activeStudents || 0, 
      icon: Users, 
      color: 'bg-blue-500',
      change: '+12%',
    },
    { 
      name: 'Classes', 
      value: summary?.totalClasses || 0, 
      icon: GraduationCap, 
      color: 'bg-purple-500',
      change: '+3',
    },
    { 
      name: 'Collected (UGX)', 
      value: finances?.collected ? `${(finances.collected / 1000000).toFixed(1)}M` : '0', 
      icon: CreditCard, 
      color: 'bg-green-500',
      change: '+18%',
    },
    { 
      name: 'Outstanding (UGX)', 
      value: finances?.outstandingBalance ? `${(finances.outstandingBalance / 1000000).toFixed(1)}M` : '0', 
      icon: TrendingUp, 
      color: 'bg-orange-500',
      change: '-5%',
    },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500">Welcome back! Here's your school overview.</p>
        </div>
        <div className="text-sm text-gray-500">
          Current Term: <span className="font-medium text-gray-900">{summary?.currentTerm || 'Not set'}</span>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.name} className="card p-6">
            <div className="flex items-center justify-between">
              <div className={`p-3 rounded-lg ${stat.color}`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <span className={`flex items-center text-sm font-medium ${stat.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                {stat.change.startsWith('+') ? (
                  <ArrowUpRight className="w-4 h-4 mr-1" />
                ) : (
                  <ArrowDownRight className="w-4 h-4 mr-1" />
                )}
                {stat.change}
              </span>
            </div>
            <div className="mt-4">
              <p className="text-sm text-gray-500">{stat.name}</p>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Collections This Month</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip 
                  formatter={(value: number) => `UGX ${(value / 1000000).toFixed(1)}M`}
                />
                <Bar dataKey="collections" fill="#3d9267" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Fee Collection Trend</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="collections" 
                  stroke="#3d9267" 
                  strokeWidth={2}
                  dot={{ fill: '#3d9267' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900">Recent Payments</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {activity?.recentPayments?.length > 0 ? (
              activity.recentPayments.map((payment: any) => (
                <div key={payment.id} className="px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {payment.student.firstName} {payment.student.lastName}
                      </p>
                      <p className="text-sm text-gray-500">{payment.student.studentNo}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">UGX {payment.amount.toLocaleString()}</p>
                    <p className="text-sm text-gray-500">{new Date(payment.paymentDate).toLocaleDateString()}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-6 py-8 text-center text-gray-500">
                No recent payments
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900">Recent Announcements</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {activity?.announcements?.length > 0 ? (
              activity.announcements.map((announcement: any, index: number) => (
                <div key={index} className="px-6 py-4">
                  <p className="font-medium text-gray-900">{announcement.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`badge ${
                      announcement.type === 'URGENT' ? 'badge-error' : 
                      announcement.type === 'FINANCIAL' ? 'badge-warning' : 'badge-info'
                    }`}>
                      {announcement.type}
                    </span>
                    <span className="text-sm text-gray-500">
                      {new Date(announcement.publishedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-6 py-8 text-center text-gray-500">
                No announcements
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
