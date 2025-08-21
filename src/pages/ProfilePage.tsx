import React, { useState, useEffect } from 'react';
import {
  User,
  Edit,
  LogOut,
  ChevronRight,
  Trash2,
  Info,
  HelpCircle,
  Mail,
  Phone,
  Linkedin,
  Globe,
  MapPin,
  Building,
  Users,
  ArrowLeft,
  Twitter
} from 'lucide-react';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
// import Sidebar from './Sidebar';
import { useNavigate } from 'react-router-dom';
// import { googleLogout } from '@react-oauth/google';

// Types for backend compatibility
interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  profileType: string;
  profileDetails: Record<string, any>;
  profileCompleted: boolean;
  title?: string;
  company?: string;
  location?: string;
  phone?: string;
  linkedin?: string;
  website?: string;
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

interface OrganizationUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'Admin' | 'Member';
}

interface SidePanelContext {
  isInSidePanel: boolean;
  currentTab: chrome.tabs.Tab | null;
}

interface ProfileProps {
  toggleTheme: () => void;
  isDarkMode: boolean;
  sidePanelContext: SidePanelContext;
}

const ProfilePage = ({ toggleTheme, isDarkMode, sidePanelContext }: ProfileProps) => {
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [activeTab, setActiveTab] = useState('details');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  // Default data - will be replaced with dynamic data if available
  const defaultProfile: UserProfile = {
    id: '1',
    name: 'John Doe',
    email: 'john.doe@example.com',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    profileType: 'organization',
    profileDetails: {},
    profileCompleted: true,
    title: 'VP of Marketing',
    company: 'Acme Corp',
    location: 'San Francisco Bay Area',
    phone: '+1 (555) 123-4567',
    linkedin: 'linkedin.com/in/johndoe',
    website: 'acmecorp.com',
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
  };

  // State for user profile - dynamically loaded
  const [userProfile, setUserProfile] = useState<UserProfile>(defaultProfile);

  // Load selected prospect data if available
  useEffect(() => {
    const selectedProspect = localStorage.getItem('selectedProspect');
    if (selectedProspect) {
      try {
        const prospectData = JSON.parse(selectedProspect);
        setUserProfile(prospectData);
      } catch (error) {
        console.error('Error parsing selected prospect data:', error);
        // Keep default profile if parsing fails
      }
    }
  }, []);

  const [organizationUsers] = useState<OrganizationUser[]>([
    {
      id: '2',
      name: 'Jane Smith',
      email: 'jane.smith@example.com',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b2e3c2d2?w=150&h=150&fit=crop&crop=face',
      role: 'Admin'
    },
    {
      id: '3',
      name: 'Robert Johnson',
      email: 'robert.johnson@example.com',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
      role: 'Member'
    },
    {
      id: '4',
      name: 'Emily Davis',
      email: 'emily.davis@example.com',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
      role: 'Member'
    }
  ]);

  const handleGoBack = () => {
    navigate(-1); // Uncomment when using with React Router
    console.log('Go back clicked');
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
        <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
          {/* Header with Back Button */}
          <header className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <button
                onClick={handleGoBack}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
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
                  <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {userProfile.name} - {userProfile.title}
                  </h1>
                  {/* Side Panel Context Info */}
                  {sidePanelContext.isInSidePanel && (
                    <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                      Side Panel Mode
                    </div>
                  )}
                </div>
              </div>
            </div>
          </header>

          {/* Profile Header Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
            <div className="flex flex-col items-center text-center">
              {/* Avatar */}
              <div className="relative mb-4">
                <Avatar className="w-32 h-32 border-4 border-orange-200">
                  <AvatarImage src={userProfile.avatar} alt={userProfile.name} />
                  <AvatarFallback className="text-3xl bg-orange-200">
                    {userProfile.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
              </div>

              {/* Name and Title */}
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                {userProfile.name}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-lg mb-1">
                {userProfile.title}
              </p>
              <p className="text-gray-500 dark:text-gray-500 mb-2">
                {userProfile.company}
              </p>
              <p className="text-gray-500 dark:text-gray-500 mb-6">
                {userProfile.location}
              </p>
            </div>

            {/* Enriched Data Section */}
            <div className="border-t dark:border-gray-700 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Enriched Data
              </h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                  <Mail className="w-5 h-5 text-gray-500" />
                  <span>{userProfile.email}</span>
                </div>
                {userProfile.phone && (
                  <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                    <Phone className="w-5 h-5 text-gray-500" />
                    <span>{userProfile.phone}</span>
                  </div>
                )}
                {userProfile.linkedin && (
                  <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                    <Linkedin className="w-5 h-5 text-gray-500" />
                    <span>{userProfile.linkedin}</span>
                  </div>
                )}
                {userProfile.website && (
                  <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                    <Globe className="w-5 h-5 text-gray-500" />
                    <span>{userProfile.website}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex space-x-8 border-b border-gray-200 dark:border-gray-700 mb-6">
            <button
              onClick={() => setActiveTab('details')}
              className={`pb-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'details'
                  ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
            >
              Details
            </button>
            <button
              onClick={() => setActiveTab('activity')}
              className={`pb-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'activity'
                  ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
            >
              Activity & Notes
            </button>
            <button
              onClick={() => setActiveTab('insights')}
              className={`pb-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'insights'
                  ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
            >
              Company Insights
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'details' && (
            <div className="space-y-6">
              {/* Company Info */}
              {userProfile.companyInfo && (
                <Card className="bg-white dark:bg-gray-800 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white">
                      Company Info
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {userProfile.companyInfo.industry && (
                        <div>
                          <label className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 block">
                            Industry
                          </label>
                          <p className="text-gray-900 dark:text-white">
                            {userProfile.companyInfo.industry}
                          </p>
                        </div>
                      )}
                      {userProfile.companyInfo.employeeCount && (
                        <div>
                          <label className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 block">
                            Employee Count
                          </label>
                          <p className="text-gray-900 dark:text-white">
                            {userProfile.companyInfo.employeeCount}
                          </p>
                        </div>
                      )}
                      {userProfile.companyInfo.headquarters && (
                        <div>
                          <label className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 block">
                            HQ Location
                          </label>
                          <p className="text-gray-900 dark:text-white">
                            {userProfile.companyInfo.headquarters}
                          </p>
                        </div>
                      )}
                    </div>
                    {userProfile.companyInfo.description && (
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 block">
                          Company Description
                        </label>
                        <p className="text-gray-900 dark:text-white leading-relaxed">
                          {userProfile.companyInfo.description}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Social Links */}
              {userProfile.socialLinks && (
                <Card className="bg-white dark:bg-gray-800 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white">
                      Social Links
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {userProfile.socialLinks.twitter && (
                        <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                          <Twitter className="w-5 h-5 text-gray-500" />
                          <span>{userProfile.socialLinks.twitter}</span>
                        </div>
                      )}
                      {userProfile.socialLinks.linkedin && (
                        <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                          <Linkedin className="w-5 h-5 text-gray-500" />
                          <span>{userProfile.socialLinks.linkedin}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {activeTab === 'activity' && (
            <Card className="bg-white dark:bg-gray-800 shadow-sm">
              <CardContent className="p-8 text-center">
                <p className="text-gray-500 dark:text-gray-400">Activity & Notes content coming soon...</p>
              </CardContent>
            </Card>
          )}

          {activeTab === 'insights' && (
            <Card className="bg-white dark:bg-gray-800 shadow-sm">
              <CardContent className="p-8 text-center">
                <p className="text-gray-500 dark:text-gray-400">Company Insights content coming soon...</p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default ProfilePage;