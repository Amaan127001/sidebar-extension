import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { Popup } from './popup/Popup';
import Welcome from './pages/Welcome';
import Mail from './pages/Mail';
import ProfilePage from './pages/ProfilePage';
import './global.css';
import Lists from './pages/List';
import ProspectsList from './pages/ProspectsList';

const App = () => {
  const [darkMode, setDarkMode] = useState(() => {
    // For side panel, we can still use localStorage but handle errors gracefully
    try {
      const savedTheme = localStorage.getItem('theme');
      return savedTheme === 'dark';
    } catch (error) {
      console.warn('localStorage not available, defaulting to light theme');
      return false;
    }
  });

  const [isLoading, setIsLoading] = useState(true);
  const [sidePanelContext, setSidePanelContext] = useState({
    isInSidePanel: true, // Always true for side panel
    currentTab: null as chrome.tabs.Tab | null
  });

  // Theme effect - Apply dark/light mode to document
  useEffect(() => {
    const root = window.document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
      try {
        localStorage.setItem('theme', 'dark');
      } catch (error) {
        console.warn('Could not save theme to localStorage');
      }
    } else {
      root.classList.remove('dark');
      try {
        localStorage.setItem('theme', 'light');
      } catch (error) {
        console.warn('Could not save theme to localStorage');
      }
    }
  }, [darkMode]);

  // Toggle theme function
  const toggleTheme = () => {
    setDarkMode(prev => !prev);
  };

  // Initialize side panel context and extension
  useEffect(() => {
    const initializeSidePanel = async () => {
      try {
        // Mark as loaded to hide loading screen
        document.body.classList.add('app-loaded');
        document.body.classList.add('side-panel-mode');
        
        // Check if we're in Chrome extension environment
        if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id) {
          console.log('LinkedIn Extension initialized in Side Panel');
          
          // Set context for side panel
          setSidePanelContext(prev => ({ ...prev, isInSidePanel: true }));

          // Get current tab information
          try {
            const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
            const activeTab = tabs[0];
            
            setSidePanelContext(prev => ({ ...prev, currentTab: activeTab }));
            
            if (activeTab?.url?.includes('linkedin.com')) {
              console.log('LinkedIn page detected in active tab:', activeTab.url);
            } else {
              console.log('Active tab is not LinkedIn:', activeTab?.url);
            }
          } catch (error) {
            console.warn('Could not get active tab info:', error);
          }

          // Listen for tab changes to update context
          if (chrome.tabs && chrome.tabs.onActivated) {
            chrome.tabs.onActivated.addListener(async (activeInfo) => {
              try {
                const tab = await chrome.tabs.get(activeInfo.tabId);
                setSidePanelContext(prev => ({ ...prev, currentTab: tab }));
                console.log('Tab changed:', tab.url);
              } catch (error) {
                console.warn('Error handling tab change:', error);
              }
            });
          }

          // Listen for URL changes within the same tab
          if (chrome.tabs && chrome.tabs.onUpdated) {
            chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
              if (changeInfo.status === 'complete' && tab.active) {
                setSidePanelContext(prev => ({ ...prev, currentTab: tab }));
                console.log('Tab updated:', tab.url);
              }
            });
          }

          // Listen for messages from background script
          chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            console.log('Side panel received message:', message);
            
            // Handle scraping progress updates
            if (message.action === 'BULK_SCRAPING_PROGRESS' || 
                message.action === 'BULK_SCRAPING_COMPLETE' ||
                message.action === 'BULK_SCRAPING_STOPPED') {
              // Forward these messages to components that need them
              window.dispatchEvent(new CustomEvent('scrapingUpdate', { 
                detail: message 
              }));
            }
            
            sendResponse({ received: true });
          });

        } else {
          console.warn('Chrome extension APIs not available');
        }
      } catch (error) {
        console.error('Error initializing side panel:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeSidePanel();
  }, []);

  // Show loading state while initializing
  if (isLoading) {
    return (
      <div className="side-panel-loading flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="text-4xl mb-4">⚡</div>
          <div className="text-lg font-medium text-gray-700 dark:text-gray-300">
            Initializing LinkedIn Extractor...
          </div>
        </div>
      </div>
    );
  }

  return (
    <HashRouter>
      <div className="app-container h-screen overflow-hidden">
        <Routes>
          <Route
            path="/"
            element={
              <Popup
                darkMode={darkMode}
                toggleTheme={toggleTheme}
              />
            }
          >
            {/* Home/Welcome Route */}
            <Route
              index
              element={
                <Welcome
                  toggleTheme={toggleTheme}
                  isDarkMode={darkMode}
                  sidePanelContext={sidePanelContext}
                />
              }
            />

            {/* Mail Route */}
            <Route
              path="mail"
              element={
                <Mail
                  toggleTheme={toggleTheme}
                  isDarkMode={darkMode}
                  sidePanelContext={sidePanelContext}
                />
              }
            />

            {/* Profile Route */}
            <Route
              path="profile"
              element={
                <ProfilePage
                  toggleTheme={toggleTheme}
                  isDarkMode={darkMode}
                  sidePanelContext={sidePanelContext}
                />
              }
            />

            {/* Prospects List Route */}
            <Route
              path="prospectslist"
              element={
                <ProspectsList
                  toggleTheme={toggleTheme}
                  isDarkMode={darkMode}
                  sidePanelContext={sidePanelContext}
                />
              }
            />

            {/* Lists Route */}
            <Route
              path="list"
              element={
                <Lists
                  toggleTheme={toggleTheme}
                  isDarkMode={darkMode}
                  sidePanelContext={sidePanelContext}
                />
              }
            />
          </Route>
        </Routes>
      </div>
    </HashRouter>
  );
};

// Enhanced Error boundary component for side panel environment
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Side Panel Error Boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary p-8 text-center h-screen flex flex-col justify-center bg-gray-50 dark:bg-gray-900">
          <h2 className="text-2xl font-bold text-red-600 mb-4">
            Something went wrong
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Please try refreshing the side panel or reloading the page.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => this.setState({ hasError: false })}
              className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 block mx-auto transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={() => window.location.reload()}
              className="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 block mx-auto transition-colors"
            >
              Refresh Side Panel
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// App with Error Boundary
const AppWithErrorBoundary = () => (
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);

// Initialize React app
const root = ReactDOM.createRoot(document.getElementById('root')!);

root.render(
  <React.StrictMode>
    <AppWithErrorBoundary />
  </React.StrictMode>
);