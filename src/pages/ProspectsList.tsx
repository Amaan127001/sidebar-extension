import React, { useState, useEffect } from 'react';
import {
  Menu,
  Save,
  Plus,
  Download,
  ChevronRight
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
// import Sidebar from './Sidebar';
import { useNavigate } from 'react-router-dom';

// Types for backend compatibility
interface Prospect {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  title: string;
  company: string;
  location: string;
  phone?: string;
  linkedin?: string;
  website?: string;
  profileType: string;
  profileDetails: Record<string, any>;
  profileCompleted: boolean;
  companyInfo?: {
    industry?: string;
    employeeCount?: string;
    headquarters?: string;
    description?: string;
  };
  socialLinks?: {
    twitter?: string;
    linkedin?: string;
  };
}

interface SidePanelContext {
  isInSidePanel: boolean;
  currentTab: chrome.tabs.Tab | null;
}

interface ProspectsListProps {
  toggleTheme: () => void;
  isDarkMode: boolean;
  sidePanelContext: SidePanelContext;
}

const ProspectsList = ({ toggleTheme, isDarkMode, sidePanelContext }: ProspectsListProps) => {
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [selectedProspects, setSelectedProspects] = useState<string[]>([]);

  // Sample prospects data - will be replaced with backend data
  const [prospects] = useState<Prospect[]>([
    {
      id: '1',
      name: 'Ethan Carter',
      email: 'ethan.carter@acmecorp.com',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
      title: 'VP of Marketing',
      company: 'Acme Corp',
      location: 'San Francisco Bay Area',
      phone: '+1 (555) 123-4567',
      linkedin: 'linkedin.com/in/ethancarter',
      website: 'acmecorp.com',
      profileType: 'organization',
      profileDetails: {},
      profileCompleted: true,
      companyInfo: {
        industry: 'Marketing & Advertising',
        employeeCount: '500-1000',
        headquarters: 'San Francisco, CA',
        description: 'Acme Corp is a leading marketing agency specializing in digital strategy and brand development.'
      },
      socialLinks: {
        twitter: 'twitter.com/acmecorp',
        linkedin: 'linkedin.com/company/acmecorp'
      }
    },
    {
      id: '2',
      name: 'Sarah Johnson',
      email: 'sarah.johnson@techstart.com',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b2e3c2d2?w=150&h=150&fit=crop&crop=face',
      title: 'CTO',
      company: 'TechStart Inc',
      location: 'New York, NY',
      phone: '+1 (555) 234-5678',
      linkedin: 'linkedin.com/in/sarahjohnson',
      website: 'techstart.com',
      profileType: 'individual',
      profileDetails: {},
      profileCompleted: true,
      companyInfo: {
        industry: 'Technology',
        employeeCount: '50-100',
        headquarters: 'New York, NY',
        description: 'TechStart Inc is an innovative startup focused on AI solutions.'
      },
      socialLinks: {
        twitter: 'twitter.com/techstart',
        linkedin: 'linkedin.com/company/techstart'
      }
    },
    {
      id: '3',
      name: 'Michael Brown',
      email: 'michael.brown@innovate.com',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
      title: 'Head of Sales',
      company: 'Innovate Solutions',
      location: 'Austin, TX',
      phone: '+1 (555) 345-6789',
      linkedin: 'linkedin.com/in/michaelbrown',
      website: 'innovatesolutions.com',
      profileType: 'organization',
      profileDetails: {},
      profileCompleted: true,
      companyInfo: {
        industry: 'Software Solutions',
        employeeCount: '200-500',
        headquarters: 'Austin, TX',
        description: 'Innovate Solutions provides cutting-edge software solutions for businesses.'
      },
      socialLinks: {
        twitter: 'twitter.com/innovatesol',
        linkedin: 'linkedin.com/company/innovatesolutions'
      }
    },
    {
      id: '4',
      name: 'Emily Davis',
      email: 'emily.davis@creative.com',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
      title: 'Creative Director',
      company: 'Creative Agency',
      location: 'Los Angeles, CA',
      phone: '+1 (555) 456-7890',
      linkedin: 'linkedin.com/in/emilydavis',
      website: 'creativeagency.com',
      profileType: 'individual',
      profileDetails: {},
      profileCompleted: true,
      companyInfo: {
        industry: 'Design & Creative',
        employeeCount: '25-50',
        headquarters: 'Los Angeles, CA',
        description: 'Creative Agency specializes in brand design and creative campaigns.'
      },
      socialLinks: {
        twitter: 'twitter.com/creativeagency',
        linkedin: 'linkedin.com/company/creativeagency'
      }
    },
    {
      id: '5',
      name: 'James Wilson',
      email: 'james.wilson@growth.com',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
      title: 'Growth Manager',
      company: 'Growth Labs',
      location: 'Seattle, WA',
      phone: '+1 (555) 567-8901',
      linkedin: 'linkedin.com/in/jameswilson',
      website: 'growthlabs.com',
      profileType: 'organization',
      profileDetails: {},
      profileCompleted: true,
      companyInfo: {
        industry: 'Marketing Technology',
        employeeCount: '100-200',
        headquarters: 'Seattle, WA',
        description: 'Growth Labs helps companies scale their marketing efforts through data-driven strategies.'
      },
      socialLinks: {
        twitter: 'twitter.com/growthlabs',
        linkedin: 'linkedin.com/company/growthlabs'
      }
    }
  ]);

  const handleProspectSelect = (prospectId: string) => {
    setSelectedProspects(prev => 
      prev.includes(prospectId) 
        ? prev.filter(id => id !== prospectId)
        : [...prev, prospectId]
    );
  };

  const handleViewProfile = (prospect: Prospect) => {
    // Store the selected prospect data for the profile page
    localStorage.setItem('selectedProspect', JSON.stringify(prospect));
    navigate('/profile'); // Uncomment when using with React Router
    console.log('Navigate to profile for:', prospect.name, 'Context:', sidePanelContext);
  };

  const handleSaveToList = () => {
    console.log('Save selected prospects to list:', selectedProspects, 'Context:', sidePanelContext);
  };

  const handleAddToCampaign = () => {
    console.log('Add selected prospects to campaign:', selectedProspects, 'Context:', sidePanelContext);
  };

  const handleExport = () => {
    console.log('Export selected prospects:', selectedProspects, 'Context:', sidePanelContext);
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* <Sidebar
        isCollapsed={sidebarCollapsed}
        setIsCollapsed={setSidebarCollapsed}
        toggleTheme={toggleTheme}
        isDarkMode={isDarkMode}
      /> */}

      <main className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
          {/* Header */}
          <header className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              {/* <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="lg:hidden p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button> */}
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                  Live Search Results
                </h1>
                {/* Side Panel Context Info */}
                {sidePanelContext.isInSidePanel && (
                  <div className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                    Side Panel Mode - Current tab: {sidePanelContext.currentTab?.url?.includes('linkedin.com') ? 'LinkedIn' : 'Other'}
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* Results Count */}
          <div className="mb-6">
            <p className="text-lg text-purple-600 dark:text-purple-400">
              Showing {prospects.length} prospects
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-4 mb-8">
            <button
              onClick={handleSaveToList}
              className="flex flex-col items-center justify-center p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 min-w-[120px]"
            >
              <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-2">
                <Save className="w-6 h-6 text-gray-600 dark:text-gray-400" />
              </div>
              <span className="text-sm font-medium text-gray-900 dark:text-white text-center">
                Save to List
              </span>
            </button>

            <button
              onClick={handleAddToCampaign}
              className="flex flex-col items-center justify-center p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 min-w-[120px]"
            >
              <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-2">
                <Plus className="w-6 h-6 text-gray-600 dark:text-gray-400" />
              </div>
              <span className="text-sm font-medium text-gray-900 dark:text-white text-center">
                Add to Campaign
              </span>
            </button>

            <button
              onClick={handleExport}
              className="flex flex-col items-center justify-center p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 min-w-[120px]"
            >
              <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-2">
                <Download className="w-6 h-6 text-gray-600 dark:text-gray-400" />
              </div>
              <span className="text-sm font-medium text-gray-900 dark:text-white text-center">
                Export (.csv)
              </span>
            </button>
          </div>

          {/* Prospects List */}
          <div className="space-y-4">
            {prospects.map((prospect) => (
              <div
                key={prospect.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow duration-200"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {/* Checkbox */}
                    <input
                      type="checkbox"
                      checked={selectedProspects.includes(prospect.id)}
                      onChange={() => handleProspectSelect(prospect.id)}
                      className="w-5 h-5 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500 dark:focus:ring-purple-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                    />

                    {/* Avatar */}
                    <Avatar className="w-16 h-16 border-2 border-orange-200">
                      <AvatarImage src={prospect.avatar} alt={prospect.name} />
                      <AvatarFallback className="text-lg bg-orange-200">
                        {prospect.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>

                    {/* Prospect Info */}
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
                        {prospect.name}
                      </h3>
                      <p className="text-purple-600 dark:text-purple-400 text-lg mb-1">
                        {prospect.company}
                      </p>
                      <p className="text-purple-600 dark:text-purple-400">
                        {prospect.title}
                      </p>
                    </div>
                  </div>

                  {/* View Details Button */}
                  <Button
                    onClick={() => handleViewProfile(prospect)}
                    variant="ghost"
                    className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 p-2"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Load More Button */}
          <div className="flex justify-center mt-8">
            <Button
              variant="outline"
              className="px-8 py-2 text-purple-600 border-purple-600 hover:bg-purple-50 dark:text-purple-400 dark:border-purple-400 dark:hover:bg-purple-900/20"
            >
              Load More Prospects
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProspectsList;