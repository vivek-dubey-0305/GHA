import { useState, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout, selectInstructor } from '../../redux/slices/auth.slice';
import {
  LayoutDashboard,
  BookOpen,
  Users,
  ClipboardList,
  Video,
  DollarSign,
  LogOut,
  ChevronDown,
  ChevronLeft,
  Menu,
  User,
  Star,
  Plus,
  BarChart3,
  Award,
  MessageCircle,
  Bell,
  Megaphone,
  Tag,
  Banknote,
  Receipt,
  Settings,
  Shield,
} from 'lucide-react';

const navigationGroups = [
  {
    label: 'Main',
    items: [
      { name: 'Dashboard', href: '/instructor/dashboard', icon: LayoutDashboard },
    ],
  },
  {
    label: 'Content',
    items: [
      { name: 'My Courses', href: '/instructor/courses', icon: BookOpen },
      { name: 'Create Course', href: '/instructor/courses/create', icon: Plus },
    ],
  },
  {
    label: 'Students',
    items: [
      { name: 'Enrolled Students', href: '/instructor/students', icon: Users },
      { name: 'Student Progress', href: '/instructor/student-progress', icon: BarChart3 },
      { name: 'Discussions & Q&A', href: '/instructor/discussions', icon: MessageCircle },
    ],
  },
  {
    label: 'Academic',
    items: [
      { name: 'Assignments', href: '/instructor/assignments', icon: ClipboardList },
      { name: 'Live Classes', href: '/instructor/live-classes', icon: Video },
      { name: 'Certificates', href: '/instructor/certificates', icon: Award },
    ],
  },
  {
    label: 'Analytics',
    items: [
      { name: 'Course Analytics', href: '/instructor/analytics', icon: BarChart3 },
    ],
  },
  {
    label: 'Marketing',
    items: [
      { name: 'Coupons', href: '/instructor/coupons', icon: Tag },
    ],
  },
  {
    label: 'Finance',
    items: [
      { name: 'Earnings', href: '/instructor/earnings', icon: DollarSign },
      { name: 'Payouts', href: '/instructor/payouts', icon: Banknote },
      { name: 'Transactions', href: '/instructor/transactions', icon: Receipt },
    ],
  },
  {
    label: 'Communication',
    items: [
      { name: 'Announcements', href: '/instructor/announcements', icon: Megaphone },
      { name: 'Notifications', href: '/instructor/notifications', icon: Bell },
    ],
  },
  {
    label: 'Account',
    items: [
      { name: 'Profile', href: '/instructor/profile', icon: User },
      { name: 'Reviews', href: '/instructor/reviews', icon: Star },
      { name: 'Payout Settings', href: '/instructor/payout-settings', icon: Settings },
      { name: 'Security', href: '/instructor/security', icon: Shield },
    ],
  },
];

export default function InstructorSidebar({ collapsed, onToggle }) {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const instructor = useSelector(selectInstructor);
  const [expandedGroups, setExpandedGroups] = useState(
    Object.fromEntries(navigationGroups.map(g => [g.label, true]))
  );

  const toggleGroup = useCallback((label) => {
    setExpandedGroups(prev => ({ ...prev, [label]: !prev[label] }));
  }, []);

  const handleLogout = () => {
    dispatch(logout()).then(() => navigate('/instructor/login'));
  };

  return (
    <>
      {/* Mobile overlay */}
      {!collapsed && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 z-50 h-screen bg-[#0a0a0a] border-r border-gray-800
          flex flex-col transition-all duration-300 ease-in-out
          ${collapsed ? '-translate-x-full lg:translate-x-0 lg:w-20' : 'translate-x-0 w-64'}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800 min-h-[65px]">
          {!collapsed && (
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center flex-shrink-0">
                <span className="text-black font-bold text-sm">GH</span>
              </div>
              <div className="min-w-0">
                <h1 className="text-white font-bold text-sm truncate">GreedHunter</h1>
                <p className="text-gray-500 text-xs truncate">Instructor</p>
              </div>
            </div>
          )}
          <button
            onClick={onToggle}
            className={`p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors ${collapsed ? 'mx-auto' : ''}`}
          >
            {collapsed ? <Menu className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
        </div>

        {/* Instructor quick info */}
        {!collapsed && instructor && (
          <div className="px-4 py-3 border-b border-gray-800/50">
            <div className="flex items-center gap-3">
              {instructor.profilePicture?.secure_url ? (
                <img
                  src={instructor.profilePicture.secure_url}
                  alt=""
                  className="w-8 h-8 rounded-full object-cover border border-gray-700"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center border border-gray-700">
                  <User className="w-4 h-4 text-gray-400" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-white text-sm font-medium truncate">
                  {instructor.firstName} {instructor.lastName}
                </p>
                <p className="text-gray-500 text-xs truncate">{instructor.specialization || 'Instructor'}</p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 scrollbar-thin">
          {navigationGroups.map((group) => (
            <div key={group.label} className="mb-1">
              {/* Group header - collapsible */}
              {!collapsed && (
                <button
                  onClick={() => toggleGroup(group.label)}
                  className="flex items-center justify-between w-full px-3 py-2 text-xs font-semibold uppercase tracking-wider text-gray-500 hover:text-gray-400 transition-colors"
                >
                  <span>{group.label}</span>
                  <ChevronDown
                    className={`w-3 h-3 transition-transform duration-200 ${expandedGroups[group.label] ? '' : '-rotate-90'}`}
                  />
                </button>
              )}

              {/* Group items */}
              {(collapsed || expandedGroups[group.label]) && (
                <ul className="space-y-0.5">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.href;
                    return (
                      <li key={item.name}>
                        <Link
                          to={item.href}
                          title={collapsed ? item.name : undefined}
                          className={`
                            flex items-center gap-3 rounded-lg transition-all duration-150
                            ${collapsed ? 'justify-center px-2 py-3 mx-1' : 'px-3 py-2.5'}
                            ${isActive
                              ? 'bg-white text-black font-medium shadow-sm'
                              : 'text-gray-400 hover:bg-gray-800/70 hover:text-white'
                            }
                          `}
                        >
                          <Icon className={`w-[18px] h-[18px] flex-shrink-0 ${isActive ? 'text-black' : ''}`} />
                          {!collapsed && <span className="text-sm">{item.name}</span>}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          ))}
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-gray-800">
          <button
            onClick={handleLogout}
            title={collapsed ? 'Logout' : undefined}
            className={`
              flex items-center gap-3 w-full rounded-lg text-gray-400 hover:bg-red-500/10 hover:text-red-400 transition-colors
              ${collapsed ? 'justify-center px-2 py-3' : 'px-3 py-2.5'}
            `}
          >
            <LogOut className="w-[18px] h-[18px] flex-shrink-0" />
            {!collapsed && <span className="text-sm">Logout</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
