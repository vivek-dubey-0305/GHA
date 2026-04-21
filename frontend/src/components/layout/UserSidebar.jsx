// import { useState, useCallback } from 'react';
// import { Link, useLocation, useNavigate } from 'react-router-dom';
// import { useDispatch, useSelector } from 'react-redux';
// import { logout, selectUser } from '../../redux/slices/auth.slice';
// import {
//   LayoutDashboard,
//   BookOpen,
//   LogOut,
//   ChevronDown,
//   ChevronLeft,
//   Menu,
//   User,
//   Settings,
//   Bell,
//   Home,
// } from 'lucide-react';

// const navigationGroups = [
//   {
//     label: 'Main',
//     items: [
//       { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
//       { name: 'Home', href: '/', icon: Home },
//     ],
//   },
//   {
//     label: 'Learning',
//     items: [
//       { name: 'My Courses', href: '/dashboard/courses', icon: BookOpen },
//     ],
//   },
//   {
//     label: 'Account',
//     items: [
//       { name: 'Profile', href: '/dashboard/profile', icon: User },
//       { name: 'Notifications', href: '/dashboard/notifications', icon: Bell },
//       { name: 'Settings', href: '/dashboard/settings', icon: Settings },
//     ],
//   },
// ];

// export default function UserSidebar({ collapsed, onToggle }) {
//   const location = useLocation();
//   const navigate = useNavigate();
//   const dispatch = useDispatch();
//   const user = useSelector(selectUser);
//   const [expandedGroups, setExpandedGroups] = useState(
//     Object.fromEntries(navigationGroups.map(g => [g.label, true]))
//   );

//   const toggleGroup = useCallback((label) => {
//     setExpandedGroups(prev => ({ ...prev, [label]: !prev[label] }));
//   }, []);

//   const handleLogout = () => {
//     dispatch(logout()).then(() => navigate('/login'));
//   };

//   return (
//     <>
//       {/* Mobile overlay */}
//       {!collapsed && (
//         <div
//           className="fixed inset-0 bg-black/50 z-40 lg:hidden"
//           onClick={onToggle}
//         />
//       )}

//       <aside
//         className={`
//           fixed top-0 left-0 z-50 h-screen bg-[#0a0a0a] border-r border-gray-800
//           flex flex-col transition-all duration-300 ease-in-out
//           ${collapsed ? '-translate-x-full lg:translate-x-0 lg:w-20' : 'translate-x-0 w-64'}
//         `}
//       >
//         {/* Header */}
//         <div className="flex items-center justify-between p-4 border-b border-gray-800 min-h-[65px]">
//           {!collapsed && (
//             <div className="flex items-center gap-3 min-w-0">
//               <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center flex-shrink-0">
//                 <span className="text-black font-bold text-sm">GH</span>
//               </div>
//               <div className="min-w-0">
//                 <h1 className="text-white font-bold text-sm truncate">GreedHunter</h1>
//                 <p className="text-gray-500 text-xs truncate">Student</p>
//               </div>
//             </div>
//           )}
//           <button
//             onClick={onToggle}
//             className={`p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors ${collapsed ? 'mx-auto' : ''}`}
//           >
//             {collapsed ? <Menu className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
//           </button>
//         </div>

//         {/* User quick info */}
//         {!collapsed && user && (
//           <div className="px-4 py-3 border-b border-gray-800/50">
//             <div className="flex items-center gap-3">
//               {user.profilePicture?.secure_url ? (
//                 <img
//                   src={user.profilePicture.secure_url}
//                   alt=""
//                   className="w-8 h-8 rounded-full object-cover border border-gray-700"
//                 />
//               ) : (
//                 <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center border border-gray-700">
//                   <User className="w-4 h-4 text-gray-400" />
//                 </div>
//               )}
//               <div className="min-w-0 flex-1">
//                 <p className="text-white text-sm font-medium truncate">
//                   {user.firstName} {user.lastName}
//                 </p>
//                 <p className="text-gray-500 text-xs truncate">{user.email}</p>
//               </div>
//             </div>
//           </div>
//         )}

//         {/* Navigation */}
//         <nav className="flex-1 overflow-y-auto py-3 px-2 scrollbar-thin">
//           {navigationGroups.map((group) => (
//             <div key={group.label} className="mb-1">
//               {/* Group header - collapsible */}
//               {!collapsed && (
//                 <button
//                   onClick={() => toggleGroup(group.label)}
//                   className="flex items-center justify-between w-full px-3 py-2 text-xs font-semibold uppercase tracking-wider text-gray-500 hover:text-gray-400 transition-colors"
//                 >
//                   <span>{group.label}</span>
//                   <ChevronDown
//                     className={`w-3 h-3 transition-transform duration-200 ${expandedGroups[group.label] ? '' : '-rotate-90'}`}
//                   />
//                 </button>
//               )}

//               {/* Group items */}
//               {(collapsed || expandedGroups[group.label]) && (
//                 <ul className="space-y-0.5">
//                   {group.items.map((item) => {
//                     const Icon = item.icon;
//                     const isActive = location.pathname === item.href;
//                     return (
//                       <li key={item.name}>
//                         <Link
//                           to={item.href}
//                           title={collapsed ? item.name : undefined}
//                           className={`
//                             flex items-center gap-3 rounded-lg transition-all duration-150
//                             ${collapsed ? 'justify-center px-2 py-3 mx-1' : 'px-3 py-2.5'}
//                             ${isActive
//                               ? 'bg-white text-black font-medium shadow-sm'
//                               : 'text-gray-400 hover:bg-gray-800/70 hover:text-white'
//                             }
//                           `}
//                         >
//                           <Icon className={`w-[18px] h-[18px] flex-shrink-0 ${isActive ? 'text-black' : ''}`} />
//                           {!collapsed && <span className="text-sm">{item.name}</span>}
//                         </Link>
//                       </li>
//                     );
//                   })}
//                 </ul>
//               )}
//             </div>
//           ))}
//         </nav>

//         {/* Logout */}
//         <div className="p-3 border-t border-gray-800">
//           <button
//             onClick={handleLogout}
//             title={collapsed ? 'Logout' : undefined}
//             className={`
//               flex items-center gap-3 w-full rounded-lg text-gray-400 hover:bg-red-500/10 hover:text-red-400 transition-colors
//               ${collapsed ? 'justify-center px-2 py-3' : 'px-3 py-2.5'}
//             `}
//           >
//             <LogOut className="w-[18px] h-[18px] flex-shrink-0" />
//             {!collapsed && <span className="text-sm">Logout</span>}
//           </button>
//         </div>
//       </aside>
//     </>
//   );
// }


/**
 * components/layout/UserSidebar.jsx
 * Full sidebar with all dashboard navigation groups.
 */
import { useState, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout, selectUser } from "../../redux/slices/auth.slice";
import { selectAnnouncementsUnread, selectNotificationsUnread } from "../../redux/slices/communication.slice";
import { ChevronDown, ChevronLeft, Menu, User, LogOut } from "lucide-react";
import { DASHBOARD_NAV_GROUPS } from "../../constants/dashboard.constants";
import "./user-sidebar.css";

export default function UserSidebar({ collapsed, onToggle }) {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const notificationsUnread = useSelector(selectNotificationsUnread);
  const announcementsUnread = useSelector(selectAnnouncementsUnread);

  const [expandedGroups, setExpandedGroups] = useState(
    Object.fromEntries(DASHBOARD_NAV_GROUPS.map((g) => [g.label, true]))
  );

  const toggleGroup = useCallback((label) => {
    setExpandedGroups((prev) => ({ ...prev, [label]: !prev[label] }));
  }, []);

  const handleLogout = () => {
    dispatch(logout()).then(() => navigate("/login"));
  };

  return (
    <>
      {/* Mobile overlay */}
      {!collapsed && (
        <div className="gha-user-sidebar__overlay fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={onToggle} />
      )}

      <aside
        className={`
          gha-user-sidebar fixed top-0 left-0 z-50 h-screen bg-[#0a0a0a] border-r border-gray-800/80
          flex flex-col transition-all duration-300 ease-in-out
          ${collapsed ? "-translate-x-full lg:translate-x-0 lg:w-18" : "translate-x-0 w-64"}
        `}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800 min-h-16">
          {!collapsed && (
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-yellow-400 flex items-center justify-center shrink-0">
                <span className="text-black font-black text-xs">GH</span>
              </div>
              <div className="min-w-0">
                <p className="text-white font-bold text-sm truncate">GreedHunter</p>
                <p className="text-gray-500 text-[10px]">Student Portal</p>
              </div>
            </div>
          )}
          <button
            onClick={onToggle}
            className={`gha-user-sidebar__toggle p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors
              ${collapsed ? "mx-auto" : ""}`}
          >
            {collapsed ? <Menu className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* ── User info ── */}
        {!collapsed && user && (
          <div className="gha-user-sidebar__profile px-4 py-3 border-b border-gray-800/50">
            <div className="flex items-center gap-2.5">
              {user.profilePicture?.secure_url ? (
                <img src={user.profilePicture.secure_url} alt="" className="w-8 h-8 rounded-full object-cover border border-gray-700" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center">
                  <User className="w-4 h-4 text-gray-500" />
                </div>
              )}
              <div className="min-w-0">
                <p className="text-white text-sm font-medium truncate">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-gray-500 text-xs truncate">{user.email}</p>
              </div>
            </div>
          </div>
        )}

        {/* ── Navigation ── */}
        <nav className="gha-user-sidebar__nav flex-1 overflow-y-auto py-2 px-2 space-y-0.5">
          {DASHBOARD_NAV_GROUPS.map((group) => (
            <div key={group.label} className="mb-1">
              {/* Group label */}
              {!collapsed && (
                <button
                  onClick={() => toggleGroup(group.label)}
                  className="gha-user-sidebar__group-toggle flex items-center justify-between w-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest
                    text-gray-600 hover:text-gray-400 transition-colors"
                >
                  <span>{group.label}</span>
                  <ChevronDown
                    className={`w-3 h-3 transition-transform duration-200 ${expandedGroups[group.label] ? "" : "-rotate-90"}`}
                  />
                </button>
              )}

              {/* Items */}
              {(collapsed || expandedGroups[group.label]) && (
                <ul className="space-y-0.5">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isHomeItem = item.href === "/";
                    const isActive = isHomeItem
                      ? location.pathname === "/"
                      : item.href === "/dashboard"
                        ? location.pathname === "/dashboard"
                        : location.pathname.startsWith(item.href);
                    const unreadCount = item.name === "Notifications"
                      ? notificationsUnread
                      : item.name === "Announcements"
                        ? announcementsUnread
                        : 0;

                    return (
                      <li key={item.name}>
                        <Link
                          to={item.href}
                          title={collapsed ? item.name : undefined}
                          className={`
                            gha-user-sidebar__item flex items-center gap-3 rounded-lg transition-all duration-150
                            ${isHomeItem ? "gha-user-sidebar__item--home" : ""}
                            ${collapsed ? "justify-center px-2 py-2.5 mx-1" : "px-3 py-2"}
                            ${isActive
                              ? isHomeItem
                                ? "gha-user-sidebar__item--active gha-user-sidebar__item--home-active bg-cyan-300 text-[#062b33] font-semibold"
                                : "gha-user-sidebar__item--active bg-yellow-400 text-black font-semibold"
                              : "gha-user-sidebar__item--idle text-gray-400 hover:bg-gray-800/60 hover:text-white"
                            }
                          `}
                        >
                          <Icon className={`w-4 h-4 shrink-0 ${isActive && !isHomeItem ? "text-black" : ""}`} />
                          {!collapsed && <span className="text-sm">{item.name}</span>}
                          {!collapsed && unreadCount > 0 && (
                            <span
                              className={`ml-auto min-w-4.5 h-4.5 px-1.5 rounded-full text-[10px] font-semibold flex items-center justify-center
                                gha-user-sidebar__badge ${isActive ? "bg-black text-yellow-300" : "bg-yellow-400/20 text-yellow-300 border border-yellow-400/40"}`}
                            >
                              {unreadCount > 99 ? "99+" : unreadCount}
                            </span>
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          ))}
        </nav>

        {/* ── Logout ── */}
        <div className="p-3 border-t border-gray-800">
          <button
            onClick={handleLogout}
            title={collapsed ? "Logout" : undefined}
            className={`
              gha-user-sidebar__logout flex items-center gap-3 w-full rounded-lg text-gray-400 hover:bg-red-500/10 hover:text-red-400
              transition-colors py-2.5 ${collapsed ? "justify-center px-2" : "px-3"}
            `}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!collapsed && <span className="text-sm">Logout</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
