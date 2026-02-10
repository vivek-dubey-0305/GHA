import React from 'react';
import { AdminSidebar } from '../ui';


export function AdminLayout({ children }) {
  return (
    <div className="flex h-screen bg-[#0f0f0f] overflow-hidden">
      <AdminSidebar className="w-64 flex-shrink-0" />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
