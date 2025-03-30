import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

const Layout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <div className={`fixed inset-y-0 left-0 z-30 w-64 transform transition-transform duration-300 ease-in-out ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } md:relative md:translate-x-0 ${sidebarOpen ? 'md:w-64' : 'md:w-20'}`}>
        <Sidebar collapsed={!sidebarOpen} />
      </div>
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header toggleSidebar={toggleSidebar} sidebarOpen={sidebarOpen} />
        <main className={`flex-1 overflow-y-auto p-4 transition-all duration-300 ${
          sidebarOpen ? 'md:ml-0' : 'md:ml-0'
        }`}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
