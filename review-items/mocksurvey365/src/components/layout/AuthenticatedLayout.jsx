import React, { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { logout as apiLogout } from "../../service/api";
import { Menu, X } from "lucide-react";
import Sidebar from "./Sidebar";
import TrialNotification from "../TrialNotification";
import NotificationBell from "../NotificationBell";

const AuthenticatedLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: "📊", show: true },
    { name: "Survey Builder", href: "/mocksurvey365", icon: "🏗️", show: true },
    { name: "F-Tag Management", href: "/ftag-management", icon: "🏷️", show: true },
    { name: "Resource Center", href: "/resource-center", icon: "📚", show: true },
    { name: "Reports", href: "/reports", icon: "📈", show: true },
  ];

  const adminNavigation = [
    { name: "User Management", href: "/admin/users", icon: "👥", show: true },
    { name: "System Settings", href: "/admin/settings", icon: "⚙️", show: true },
    { name: "Analytics", href: "/admin/analytics", icon: "📊", show: true },
  ];

  const handleLogout = () => {
    logout(); // This will update the context
    apiLogout(); // This will handle the redirect and storage cleanup
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  const toggleSidebarCollapse = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Mobile menu overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Mobile Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out lg:hidden ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <Sidebar
          navigation={navigation}
          adminNavigation={adminNavigation}
          user={user}
          handleLogout={handleLogout}
          onClose={closeSidebar}
          isMobile={true}
          collapsed={false}
          onToggleCollapse={toggleSidebarCollapse}
        />
      </div>

      {/* Desktop Sidebar */}
      <div className={`hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:block transition-all duration-300 ease-in-out ${
        sidebarCollapsed ? 'lg:w-16' : 'lg:w-64'
      }`}>
        <Sidebar
          navigation={navigation}
          adminNavigation={adminNavigation}
          user={user}
          handleLogout={handleLogout}
          isMobile={false}
          collapsed={sidebarCollapsed}
          onToggleCollapse={toggleSidebarCollapse}
        />
      </div>

      {/* Main Content */}
      <div className={`flex flex-col transition-all duration-300 ease-in-out ${
        sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'
      }`}>
        {/* Mobile Header */}
        <div className="lg:hidden bg-white border-b border-gray-200 sticky top-0 z-20">
          <div className="flex items-center justify-between px-4 py-3">
            <button
              type="button"
              className="text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
              onClick={() => setSidebarOpen(true)}
            >
              <span className="sr-only">Open sidebar</span>
              <Menu className="h-6 w-6" />
            </button>
            <div className="flex items-center">
              <img 
                src="/logo.png" 
                alt="Survey365" 
                className="h-8 w-auto"
              />
            </div>
            <div className="flex items-center gap-2">
              <NotificationBell />
            </div>
          </div>
        </div>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
        
          {children}
        </main>
      </div>
    </div>
  );
};

export default AuthenticatedLayout;
