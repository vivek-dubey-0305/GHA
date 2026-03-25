import { useState, useCallback, useEffect } from 'react';
import UserSidebar from './UserSidebar';
import { Menu } from 'lucide-react';

export function UserLayout({ children }) {
  const [collapsed, setCollapsed] = useState(() => window.innerWidth < 1024);

  const toggleSidebar = useCallback(() => {
    setCollapsed(prev => !prev);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setCollapsed(true);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="flex h-screen bg-[#0f0f0f] overflow-hidden">
      <UserSidebar collapsed={collapsed} onToggle={toggleSidebar} />

      {/* Main content area */}
      <main
        className={`flex-1 overflow-auto transition-all duration-300 ease-in-out ${
          collapsed ? 'lg:ml-20 ml-0' : 'ml-0 lg:ml-64'
        }`}
      >
        {/* Mobile header bar */}
        <div className="lg:hidden sticky top-0 z-30 bg-[#0a0a0a] border-b border-gray-800 px-3 py-3 sm:px-4 flex items-center gap-3">
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-md bg-white flex items-center justify-center">
              <span className="text-black font-bold text-xs">GH</span>
            </div>
            <span className="text-white font-semibold text-sm truncate">Student Portal</span>
          </div>
        </div>

        {children}
      </main>
    </div>
  );
}

export default UserLayout;
