import React from 'react';
import {
  BarChart3,
  Mail,
  Users,
  User,
  X,
  Sun,
  Moon,
  Menu
} from 'lucide-react';
import { Logo } from './assets/logo';
import { Link, useLocation } from 'react-router-dom';

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  toggleTheme: () => void;
  isDarkMode: boolean;
  sidePanelWidth?: number;
}

const Sidebar = ({ isCollapsed, setIsCollapsed, toggleTheme, isDarkMode, sidePanelWidth = 400 }: SidebarProps) => {
  const { pathname } = useLocation();

  const navItems = [
    { name: 'Dashboard', icon: BarChart3, path: '/' },
    { name: 'Mails', icon: Mail, path: '/mail' },
    { name: 'Lists', icon: Users, path: '/list' },
  ];

  const isActiveRoute = (path: string) => pathname === path;

  // Determine if we should show a compact layout
  const isCompact = sidePanelWidth < 500;

  return (
    <>
      {/* Mobile overlay for collapsed sidebar */}
      {!isCollapsed && isCompact && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setIsCollapsed(true)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        ${isCollapsed && isCompact ? 'hidden' : 'flex'}
        ${isCompact ? 'fixed inset-y-0 left-0 z-40' : 'relative'}
        ${isCompact ? 'w-72' : isCollapsed ? 'w-16' : 'w-64'}
        bg-white dark:bg-gray-800 
        border-r border-gray-200 dark:border-gray-700 
        transition-all duration-300 ease-in-out
        flex-col flex-shrink-0
      `}>
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 min-h-[73px]">
          {!isCollapsed ? (
            <>
              <div className="flex items-center gap-3">
                <Logo />
                <h1 className="text-lg font-bold text-gray-900 dark:text-white truncate">
                  Ingenium
                </h1>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={toggleTheme}
                  className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  title={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
                >
                  {isDarkMode ? (
                    <Sun className="w-4 h-4 text-gray-700 dark:text-gray-300" />
                  ) : (
                    <Moon className="w-4 h-4 text-gray-700 dark:text-gray-300" />
                  )}
                </button>
                {isCompact && (
                  <button
                    onClick={() => setIsCollapsed(true)}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    title="Close sidebar"
                  >
                    <X className="w-4 h-4 text-gray-500" />
                  </button>
                )}
                {!isCompact && (
                  <button
                    onClick={() => setIsCollapsed(true)}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    title="Collapse sidebar"
                  >
                    <Menu className="w-4 h-4 text-gray-500" />
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center w-full">
              <button
                onClick={() => setIsCollapsed(false)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title="Expand sidebar"
              >
                <Menu className="w-5 h-5 text-gray-500" />
              </button>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.name}
              to={item.path}
              onClick={() => {
                if (isCompact) {
                  setIsCollapsed(true);
                }
              }}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors duration-150
                ${isCollapsed ? 'justify-center' : ''}
                ${isActiveRoute(item.path)
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }
              `}
              title={isCollapsed ? item.name : undefined}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!isCollapsed && (
                <span className="text-sm font-medium">{item.name}</span>
              )}
            </Link>
          ))}
        </nav>

        {/* Profile */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <Link
            to="/prospectslist"
            className={`
              flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors duration-150
              ${isCollapsed ? 'justify-center' : ''}
              text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700
            `}
            onClick={() => {
              if (isCompact) {
                setIsCollapsed(true);
              }
            }}
            title={isCollapsed ? "Prospects List" : undefined}
          >
            <User className="w-5 h-5 flex-shrink-0" />
            {!isCollapsed && (
              <span className="text-sm font-medium">Prospects List</span>
            )}
          </Link>
        </div>
      </aside>

      {/* Overlay toggle button for collapsed sidebar on compact screens */}
      {isCollapsed && isCompact && (
        <button
          onClick={() => setIsCollapsed(false)}
          className="fixed top-4 left-4 z-20 p-3 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          title="Open sidebar"
        >
          <Menu className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        </button>
      )}
    </>
  );
};

export default Sidebar;