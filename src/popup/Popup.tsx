import React, { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../pages/Sidebar";

interface PopupProps {
  darkMode: boolean;
  toggleTheme: () => void;
}

export const Popup: React.FC<PopupProps> = ({ darkMode, toggleTheme }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true); // Start expanded for side panel
  const [sidePanelWidth, setSidePanelWidth] = useState(400);

  // Detect side panel width and adjust layout accordingly
  useEffect(() => {
    const detectSidePanelWidth = () => {
      const width = window.innerWidth;
      setSidePanelWidth(width);
      
      // Auto-collapse sidebar for very narrow side panels
      if (width < 1000) {
        setSidebarCollapsed(true);
      } else {
        setSidebarCollapsed(false); // Keep expanded for wider side panels
      }
    };

    // Initial detection
    detectSidePanelWidth();

    // Listen for resize events (when user resizes side panel)
    window.addEventListener('resize', detectSidePanelWidth);
    
    return () => {
      window.removeEventListener('resize', detectSidePanelWidth);
    };
  }, []);

  // Dynamic styles based on side panel width
  const getLayoutStyles = () => {
    return {
      width: '100%',
      height: '100vh',
      overflow: 'hidden',
      display: 'flex',
      maxWidth: '100vw'
    };
  };

  const getMainContentStyles = () => {
    return {
      flex: 1,
      overflow: 'hidden',
      height: '100vh',
      minWidth: 0 // Important for proper flex shrinking
    };
  };

  const getContentAreaStyles = () => {
    return {
      height: '100vh',
      overflowY: 'auto' as const,
      overflowX: 'hidden' as const
    };
  };

  return (
    <div 
      className={`flex bg-background side-panel-optimized ${
        sidePanelWidth < 500 ? 'compact-mode' : ''
      } ${darkMode ? 'dark' : ''}`} 
      style={getLayoutStyles()}
    >
      <Sidebar
        isCollapsed={sidebarCollapsed}
        setIsCollapsed={setSidebarCollapsed}
        toggleTheme={toggleTheme}
        isDarkMode={darkMode}
        sidePanelWidth={sidePanelWidth}
      />

      {/* Main content area - optimized for side panel */}
      <main className="flex-1 main-content" style={getMainContentStyles()}>
        <div 
          className="side-panel-content" 
          style={getContentAreaStyles()}
        >
          <Outlet />
        </div>
      </main>
    </div>
  );
};