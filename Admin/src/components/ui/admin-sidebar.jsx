import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { logout } from '../../redux/slices/auth.slice';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  Layers,
  FileText,
  ClipboardList,
  Send,
  Award,
  UserCheck,
  Star,
  TrendingUp,
  Video,
  Package,
  Paperclip,
  DollarSign,
  LogOut,
} from 'lucide-react';

const navigationGroups = [
  {
    label: 'Main',
    items: [
      { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    ],
  },
  {
    label: 'User Management',
    items: [
      { name: 'Users', href: '/admin/users', icon: Users },
      { name: 'Instructors', href: '/admin/instructors', icon: GraduationCap },
    ],
  },
  {
    label: 'Content',
    items: [
      { name: 'Courses', href: '/admin/courses', icon: BookOpen },
      { name: 'Modules', href: '/admin/modules', icon: Layers },
      { name: 'Lessons', href: '/admin/lessons', icon: FileText },
    ],
  },
  {
    label: 'Academic',
    items: [
      { name: 'Assignments', href: '/admin/assignments', icon: ClipboardList },
      { name: 'Submissions', href: '/admin/submissions', icon: Send },
      { name: 'Certificates', href: '/admin/certificates', icon: Award },
    ],
  },
  {
    label: 'Engagement',
    items: [
      { name: 'Enrollments', href: '/admin/enrollments', icon: UserCheck },
      { name: 'Reviews', href: '/admin/reviews', icon: Star },
      { name: 'Progress', href: '/admin/progress', icon: TrendingUp },
    ],
  },
  {
    label: 'Media',
    items: [
      { name: 'Live Classes', href: '/admin/live-classes', icon: Video },
      { name: 'Video Packages', href: '/admin/video-packages', icon: Package },
      { name: 'Materials', href: '/admin/materials', icon: Paperclip },
    ],
  },
  {
    label: 'Finance',
    items: [
      { name: 'Payments', href: '/admin/payments', icon: DollarSign },
      { name: 'Wallets', href: '/admin/wallets', icon: DollarSign },
      { name: 'Payouts', href: '/admin/payouts', icon: DollarSign },
    ],
  },
];

export function AdminSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleLogout = () => {
    dispatch(logout());
    navigate('/admin/login');
  };

  return (
    <div className="w-64 bg-[#0f0f0f] border-r border-gray-800 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-800">
        <h1 className="text-xl font-bold text-white">GreedHunter</h1>
        <p className="text-sm text-gray-400">Admin Panel</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4">
        {navigationGroups.map((group) => (
          <div key={group.label} className="mb-4">
            <h3 className="px-4 mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
              {group.label}
            </h3>
            <ul className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;
                return (
                  <li key={item.name}>
                    <Link
                      to={item.href}
                      className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                        isActive
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                      }`}
                    >
                      <Icon className="w-5 h-5 mr-3" />
                      {item.name}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-gray-800">
        <button
          onClick={handleLogout}
          className="flex items-center w-full px-4 py-3 text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg transition-colors"
        >
          <LogOut className="w-5 h-5 mr-3" />
          Logout
        </button>
      </div>
    </div>
  );
}

export default AdminSidebar;