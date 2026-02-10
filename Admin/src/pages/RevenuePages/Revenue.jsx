import React from 'react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { Users, GraduationCap, BookOpen, DollarSign } from 'lucide-react';

const Revenue = () => {
  const stats = [
    { name: 'Total Users', value: '2,543', icon: Users, change: '+12.5%', color: 'text-blue-400' },
    { name: 'Total Instructors', value: '127', icon: GraduationCap, change: '+8.2%', color: 'text-green-400' },
    { name: 'Active Courses', value: '89', icon: BookOpen, change: '+4.7%', color: 'text-purple-400' },
    { name: 'Revenue', value: '$124,592', icon: DollarSign, change: '+15.3%', color: 'text-yellow-400' },
  ];

  return (
    <AdminLayout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Revenue Dashboard</h1>
          <p className="text-gray-400 mt-2">Welcome to GreedHunter Academy Admin Panel</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.name} className="bg-[#1a1a1a] rounded-lg p-6 border border-gray-800">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-lg bg-gray-800 ${stat.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-green-400 text-sm font-medium">{stat.change}</span>
                </div>
                <h3 className="text-gray-400 text-sm font-medium">{stat.name}</h3>
                <p className="text-2xl font-bold text-white mt-2">{stat.value}</p>
              </div>
            );
          })}
        </div>

        {/* Recent Activity */}
        <div className="mt-8 bg-[#1a1a1a] rounded-lg border border-gray-800 p-6">
          <h2 className="text-xl font-bold text-white mb-4">Recent Activity</h2>
          <div className="space-y-4">
            {[
              { action: 'New user registered', name: 'John Doe', time: '2 minutes ago' },
              { action: 'Course published', name: 'Advanced React Patterns', time: '15 minutes ago' },
              { action: 'Instructor approved', name: 'Sarah Wilson', time: '1 hour ago' },
              { action: 'Payment received', name: '$599.00', time: '2 hours ago' },
            ].map((activity, index) => (
              <div key={index} className="flex items-center justify-between py-3 border-b border-gray-800 last:border-0">
                <div>
                  <p className="text-gray-300">{activity.action}</p>
                  <p className="text-sm text-gray-500">{activity.name}</p>
                </div>
                <span className="text-sm text-gray-500">{activity.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Revenue;