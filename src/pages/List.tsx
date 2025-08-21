import React, { useState } from 'react';
import { ArrowLeft, Users, BarChart3, Mail, Megaphone, User, Menu, Sun, Moon, Plus, Filter, MoreVertical, Edit, Trash2 } from 'lucide-react';
// import Sidebar from './Sidebar';
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

interface ListMember {
  id: string;
  avatar: string;
  fullName: string;
  linkedin: string;
  company: string;
  position: string;
  email: string;
}

interface ContactList {
  id: string;
  name: string;
  memberCount: number;
  members: ListMember[];
}

interface SidePanelContext {
  isInSidePanel: boolean;
  currentTab: chrome.tabs.Tab | null;
}

interface ListsProps {
  toggleTheme: () => void;
  isDarkMode: boolean;
  sidePanelContext: SidePanelContext;
}

const Lists = ({ toggleTheme, isDarkMode, sidePanelContext }: ListsProps) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [selectedList, setSelectedList] = useState<ContactList | null>(null);
  const [showListDetail, setShowListDetail] = useState(false);

  // Sample data - this will be replaced with backend API calls in the future
  const [contactLists, setContactLists] = useState<ContactList[]>([
    {
      id: 'prospects-q1',
      name: 'Q1 Prospects',
      memberCount: 125,
      members: [
        {
          id: '1',
          avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=64&h=64&fit=crop&crop=face',
          fullName: 'John Doe',
          linkedin: 'https://www.linkedin.com/in/johndoe',
          company: 'Innovate Corp',
          position: 'Marketing Manager',
          email: 'john.doe@innovate.com'
        },
        {
          id: '2',
          avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=64&h=64&fit=crop&crop=face',
          fullName: 'Jane Smith',
          linkedin: 'https://www.linkedin.com/in/janesmith',
          company: 'Tech Solutions Ltd.',
          position: 'Sales Director',
          email: 'jane.smith@techsolutions.com'
        },
        {
          id: '3',
          avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=64&h=64&fit=crop&crop=face',
          fullName: 'Alex Jones',
          linkedin: 'https://www.linkedin.com/in/alexjones',
          company: 'Future Systems',
          position: 'CEO',
          email: 'alex.jones@futuresystems.com'
        }
      ]
    },
    {
      id: 'conference-attendees',
      name: 'Conference Attendees',
      memberCount: 88,
      members: [
        {
          id: '4',
          avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=64&h=64&fit=crop&crop=face',
          fullName: 'Emily White',
          linkedin: 'https://www.linkedin.com/in/emilywhite',
          company: 'Data Insights',
          position: 'Data Analyst',
          email: 'emily.white@datainsights.co'
        },
        {
          id: '5',
          avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=64&h=64&fit=crop&crop=face',
          fullName: 'Michael Brown',
          linkedin: 'https://www.linkedin.com/in/michaelbrown',
          company: 'CloudNet',
          position: 'Solutions Architect',
          email: 'michael.brown@cloudnet.io'
        }
      ]
    },
    {
      id: 'newsletter-subscribers',
      name: 'Newsletter Subscribers',
      memberCount: 312,
      members: [
        {
          id: '6',
          avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=64&h=64&fit=crop&crop=face',
          fullName: 'Sarah Miller',
          linkedin: 'https://www.linkedin.com/in/sarahmiller',
          company: 'MarketPro',
          position: 'Content Strategist',
          email: 's.miller@marketpro.agency'
        },
        {
          id: '7',
          avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=64&h=64&fit=crop&crop=face',
          fullName: 'David Wilson',
          linkedin: 'https://www.linkedin.com/in/davidwilson',
          company: 'Connect Hub',
          position: 'Community Manager',
          email: 'david.w@connecthub.com'
        }
      ]
    },
    {
      id: 'webinar-leads',
      name: 'Webinar Leads',
      memberCount: 56,
      members: [
        {
          id: '8',
          avatar: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=64&h=64&fit=crop&crop=face',
          fullName: 'Olivia Taylor',
          linkedin: 'https://www.linkedin.com/in/oliviataylor',
          company: 'LeadGenify',
          position: 'Growth Hacker',
          email: 'olivia@leadgenify.com'
        }
      ]
    }
  ]);

  const handleListClick = (list: ContactList) => {
    setSelectedList(list);
    setShowListDetail(true);
  };

  const handleBackToLists = () => {
    setShowListDetail(false);
    setSelectedList(null);
  };

  return (
    <div className={`min-h-screen flex w-full ${isDarkMode ? 'dark' : ''}`}>
      {/* <Sidebar
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        toggleTheme={toggleTheme}
        isDarkMode={isDarkMode}
      /> */}

      <div className="flex-1 flex flex-col lg:ml-0">
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-4 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* <button
                onClick={() => setIsSidebarCollapsed(false)}
                className="lg:hidden p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <Menu className="w-5 h-5 text-gray-500" />
              </button> */}
              {showListDetail && selectedList && (
                <button
                  onClick={handleBackToLists}
                  className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 flex-shrink-0"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-500" />
                </button>
              )}
              <div>
                <h1 className="text-xl sm:text-2xl md:text-4xl font-bold text-gray-900 dark:text-white truncate">
                  {showListDetail && selectedList ? selectedList.name : 'Lists'}
                </h1>
                {/* Side Panel Context Info */}
                {sidePanelContext.isInSidePanel && (
                  <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                    Side Panel Mode
                  </div>
                )}
              </div>
            </div>

            {/* Action buttons for list detail view */}
            {showListDetail && (
              <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-3">
                <Button className="bg-purple-600 hover:bg-purple-700 text-white font-semibold h-8 px-2 sm:h-9 sm:px-3 md:h-10 md:px-4 rounded-lg flex items-center shadow-md hover:shadow-lg transition-shadow duration-300 text-xs sm:text-sm">
                  <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Add Member</span>
                  <span className="sm:hidden">Add</span>
                </Button>
                <button className="text-gray-500 hover:text-gray-700 p-1.5 sm:p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200">
                  <Filter className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
                <button className="text-gray-500 hover:text-gray-700 p-1.5 sm:p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200">
                  <MoreVertical className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-4 lg:p-8 bg-gray-50 dark:bg-gray-900 overflow-y-auto" style={{ height: 'calc(100vh - 64px)' }}>
          {!showListDetail ? (
            // Lists Overview
            <div className="space-y-6">
              {contactLists.map((list) => (
                <Card
                  key={list.id}
                  className="cursor-pointer hover:shadow-lg transition-shadow duration-300 bg-white dark:bg-gray-800"
                  onClick={() => handleListClick(list)}
                >
                  <CardContent className="p-6">
                    <div className="flex justify-between items-center">
                      <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300">
                        {list.name}
                      </h3>
                      <span className="text-gray-500 dark:text-gray-400 text-sm flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {list.memberCount} People
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            // List Detail View
            selectedList && (
              <div className="space-y-6">
                <div className="bg-white dark:bg-gray-800 p-3 sm:p-6 rounded-xl shadow-xl">
                  {/* Mobile/Tablet responsive table */}
                  <div className="overflow-x-auto">
                    <div className="min-w-full">
                      {/* Desktop Table View */}
                      <div className="hidden lg:block">
                        <table className="w-full text-left">
                          <thead>
                            <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
                              <th className="py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider"></th>
                              <th className="py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Name</th>
                              <th className="py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">LinkedIn</th>
                              <th className="py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Position</th>
                              <th className="py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Company</th>
                              <th className="py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Email</th>
                              <th className="py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedList.members.map((member, index) => (
                              <tr key={member.id} className={`${index !== selectedList.members.length - 1 ? 'border-b border-gray-200 dark:border-gray-700' : ''} hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150`}>
                                <td className="py-3 px-4 whitespace-nowrap">
                                  <img
                                    src={member.avatar}
                                    alt={`${member.fullName} avatar`}
                                    className="w-10 h-10 rounded-full object-cover"
                                  />
                                </td>
                                <td className="py-3 px-4 whitespace-nowrap">
                                  <span className="font-medium text-sm text-gray-800 dark:text-gray-200">
                                    {member.fullName}
                                  </span>
                                </td>
                                <td className="py-3 px-4 whitespace-nowrap">
                                  <a
                                    href={member.linkedin}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline text-sm flex items-center"
                                  >
                                    <svg className="w-4 h-4 mr-1.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="#0077B5">
                                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0z" />
                                    </svg>
                                    Profile
                                  </a>
                                </td>
                                <td className="py-3 px-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                                  {member.position}
                                </td>
                                <td className="py-3 px-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                                  {member.company}
                                </td>
                                <td className="py-3 px-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                                  {member.email}
                                </td>
                                <td className="py-3 px-4 whitespace-nowrap text-right">
                                  <button className="text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 p-1 rounded-full transition-colors duration-200 mr-1">
                                    <Edit className="w-4 h-4" />
                                  </button>
                                  <button className="text-gray-400 hover:text-red-600 dark:hover:text-red-400 p-1 rounded-full transition-colors duration-200">
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Mobile/Tablet Card View */}
                      <div className="lg:hidden space-y-4">
                        {selectedList.members.map((member) => (
                          <div key={member.id} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                            <div className="flex items-start space-x-3">
                              <img
                                src={member.avatar}
                                alt={`${member.fullName} avatar`}
                                className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-2">
                                  <h4 className="font-medium text-gray-800 dark:text-gray-200 truncate">
                                    {member.fullName}
                                  </h4>
                                  <div className="flex items-center space-x-2 flex-shrink-0">
                                    <button className="text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 p-1 rounded-full transition-colors duration-200">
                                      <Edit className="w-4 h-4" />
                                    </button>
                                    <button className="text-gray-400 hover:text-red-600 dark:hover:text-red-400 p-1 rounded-full transition-colors duration-200">
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                                <div className="space-y-1 text-sm">
                                  <p className="text-gray-600 dark:text-gray-400">
                                    <span className="font-medium">Position:</span> {member.position}
                                  </p>
                                  <p className="text-gray-600 dark:text-gray-400">
                                    <span className="font-medium">Company:</span> {member.company}
                                  </p>
                                  <p className="text-gray-600 dark:text-gray-400">
                                    <span className="font-medium">Email:</span> {member.email}
                                  </p>
                                  <a
                                    href={member.linkedin}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline text-sm flex items-center"
                                  >
                                    <svg className="w-4 h-4 mr-1.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="#0077B5">
                                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0z" />
                                    </svg>
                                    Profile
                                  </a>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Responsive Pagination */}
                  <div className="pt-4 flex flex-col sm:flex-row justify-between items-center text-sm text-gray-600 dark:text-gray-400 space-y-3 sm:space-y-0">
                    <span className="text-center sm:text-left">
                      Showing 1 to {selectedList.members.length} of {selectedList.memberCount} entries
                    </span>
                    <div className="flex flex-wrap justify-center items-center space-x-1">
                      <button className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 text-xs sm:text-sm">&lt;</button>
                      <button className="p-2 rounded-md bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 font-medium transition-colors duration-200 text-xs sm:text-sm">1</button>
                      <button className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 text-xs sm:text-sm">2</button>
                      <button className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 text-xs sm:text-sm">3</button>
                      <span className="p-2 text-xs sm:text-sm">...</span>
                      <button className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 text-xs sm:text-sm">12</button>
                      <button className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 text-xs sm:text-sm">&gt;</button>
                    </div>
                  </div>
                </div>
              </div>
            )
          )}
        </main>
      </div>
    </div>
  );
};

export default Lists;