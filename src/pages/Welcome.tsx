import React, { useState, useEffect, useMemo } from 'react';
import {
    Rocket,
    Loader2,
    Users,
    Download,
    AlertTriangle,
    X,
    Save,
    Plus,
    ChevronRight,
    CheckSquare,
    Square
} from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
// import Sidebar from './Sidebar';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';

// Enhanced interfaces for LinkedIn data
interface ProfileData {
    name: string;
    headline: string;
    location: string;
    about: string;
    experience: ExperienceItem[];
    education: EducationItem[];
    skills: string[];
    connections: string;
    email?: string;
    phone?: string;
    website?: string;
    profileUrl: string;
    imageUrl?: string;
    currentCompany?: string;
    currentPosition?: string;
}

interface ExperienceItem {
    title: string;
    company: string;
    duration: string;
    location?: string;
    description?: string;
}

interface EducationItem {
    school: string;
    degree: string;
    duration: string;
    description?: string;
}

interface SearchResult {
    name: string;
    url: string;
    headline: string;
    location: string;
    imageUrl?: string;
    mutualConnections?: string;
}

interface BulkScrapingProgress {
    currentPage: number;
    maxPages: number;
    profilesFound: number;
    totalProfiles: number;
}

interface SidePanelContext {
    isInSidePanel: boolean;
    currentTab: chrome.tabs.Tab | null;
}

interface WelcomeProps {
    toggleTheme: () => void;
    isDarkMode: boolean;
    sidePanelContext: SidePanelContext;
}

// Unified interface for displayed prospects
interface DisplayedProspect {
    id: string;
    name: string;
    headline: string;
    location: string;
    imageUrl?: string;
    profileUrl: string;
}

const Welcome = ({ toggleTheme, isDarkMode, sidePanelContext }: WelcomeProps) => {
    const navigate = useNavigate();
    const [sidebarCollapsed, setSidebarCollapsed] = useState(true);

    // LinkedIn extraction states
    const [extractedData, setExtractedData] = useState<ProfileData | SearchResult[] | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    // Bulk scraping states
    const [bulkScraping, setBulkScraping] = useState(false);
    const [bulkProgress, setBulkProgress] = useState<BulkScrapingProgress | null>(null);
    const [maxPages, setMaxPages] = useState(3);
    const [showBulkModal, setShowBulkModal] = useState(false);

    // State for selected prospects
    const [selectedProspects, setSelectedProspects] = useState<string[]>([]);

    useEffect(() => {
        // Listen for messages from background script
        const messageListener = (message: any) => {
            switch (message.action) {
                case 'BULK_SCRAPING_PROGRESS':
                    setBulkProgress(message.data);
                    break;

                case 'BULK_SCRAPING_COMPLETE':
                    setBulkScraping(false);
                    setBulkProgress(null);
                    setExtractedData(message.data.profiles);
                    setSelectedProspects([]);
                    break;

                case 'BULK_SCRAPING_STOPPED':
                    setBulkScraping(false);
                    setBulkProgress(null);
                    setExtractedData(message.data.profiles);
                    setSelectedProspects([]);
                    break;

                default:
                    break;
            }
        };

        if (typeof chrome !== 'undefined' && chrome.runtime) {
            chrome.runtime.onMessage.addListener(messageListener);
            return () => {
                chrome.runtime.onMessage.removeListener(messageListener);
            };
        }
    }, []);

    // Convert extracted data to display format
    const displayedProspects: DisplayedProspect[] = useMemo(() => {
        if (!extractedData) return [];

        if (Array.isArray(extractedData)) {
            return extractedData.map((result: SearchResult) => ({
                id: result.url,
                name: result.name,
                headline: result.headline,
                location: result.location,
                imageUrl: result.imageUrl,
                profileUrl: result.url
            }));
        } else {
            return [{
                id: extractedData.profileUrl,
                name: extractedData.name,
                headline: extractedData.headline || extractedData.currentPosition || '',
                location: extractedData.location,
                imageUrl: extractedData.imageUrl,
                profileUrl: extractedData.profileUrl
            }];
        }
    }, [extractedData]);

    // Single extraction from current page
    const handleSingleExtraction = async () => {
        setLoading(true);
        setError(null);
        setSelectedProspects([]);

        try {
            const response = await new Promise<any>((resolve, reject) => {
                const timeout = setTimeout(() => {
                    reject(new Error('Request timeout'));
                }, 10000);

                chrome.runtime.sendMessage(
                    { action: "REQUEST_EXTRACTION" },
                    (response) => {
                        clearTimeout(timeout);

                        if (chrome.runtime.lastError) {
                            reject(new Error(chrome.runtime.lastError.message));
                            return;
                        }

                        if (!response) {
                            reject(new Error('No response received'));
                            return;
                        }

                        resolve(response);
                    }
                );
            });

            if (response?.success) {
                if (response.data?.profile) {
                    setExtractedData(response.data.profile);
                } else if (response.data?.searchResults) {
                    setExtractedData(response.data.searchResults);
                } else if (response.data?.error) {
                    setError(response.data.error);
                } else {
                    setError('No data found on current page');
                }
            } else {
                setError(response?.error || 'Failed to extract data');
            }
        } catch (err: any) {
            setError(`Communication error: ${err.message}`);
            console.error('Extraction error:', err);
        } finally {
            setLoading(false);
        }
    };

    // Start bulk scraping
    const handleBulkScraping = async () => {
        setBulkScraping(true);
        setBulkProgress(null);
        setError(null);
        setShowBulkModal(false);
        setSelectedProspects([]);

        try {
            const response = await new Promise<any>((resolve, reject) => {
                const timeout = setTimeout(() => {
                    reject(new Error('Request timeout'));
                }, 10000);

                chrome.runtime.sendMessage({
                    action: "REQUEST_BULK_SCRAPING",
                    maxPages: maxPages
                }, (response) => {
                    clearTimeout(timeout);

                    if (chrome.runtime.lastError) {
                        reject(new Error(chrome.runtime.lastError.message));
                        return;
                    }

                    if (!response) {
                        reject(new Error('No response received'));
                        return;
                    }

                    resolve(response);
                });
            });

            if (!response.success) {
                setError(response.error || 'Failed to start bulk scraping');
                setBulkScraping(false);
            }
        } catch (err: any) {
            setError(`Failed to start bulk scraping: ${err.message}`);
            setBulkScraping(false);
            console.error('Bulk scraping error:', err);
        }
    };

    // Stop bulk scraping
    const handleStopBulkScraping = async () => {
        try {
            await new Promise<any>((resolve) => {
                chrome.runtime.sendMessage({ action: "STOP_BULK_SCRAPING" }, resolve);
            });
        } catch (err) {
            console.error('Stop scraping error:', err);
        }
    };

    // Export ONLY SELECTED results to CSV
    const exportToCSV = () => {
        if (selectedProspects.length === 0) {
            alert('Please select prospects to export');
            return;
        }
        
        // Filter only selected prospects
        const selectedData = displayedProspects.filter(prospect => 
            selectedProspects.includes(prospect.id)
        );
        
        if (selectedData.length === 0) {
            alert('No selected prospects to export');
            return;
        }
        
        const csvContent = convertToCSV(selectedData);
        
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `linkedin_prospects_selected_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        window.URL.revokeObjectURL(url);
    };

    // Convert data to CSV format
    const convertToCSV = (data: DisplayedProspect[]) => {
        if (data.length === 0) return '';
        
        const headers = ['Name', 'Headline', 'Location', 'Profile URL'];
        const csvRows = [
            headers.join(','),
            ...data.map(prospect => 
                `"${prospect.name.replace(/"/g, '""')}","${prospect.headline.replace(/"/g, '""')}","${prospect.location.replace(/"/g, '""')}","${prospect.profileUrl}"`
            )
        ];
        
        return csvRows.join('\n');
    };

    const handleProspectSelect = (prospectId: string) => {
        setSelectedProspects(prev => {
            return prev.includes(prospectId)
                ? prev.filter(id => id !== prospectId)
                : [...prev, prospectId];
        });
    };

    const handleSelectAll = () => {
        setSelectedProspects(displayedProspects.map(p => p.id));
    };

    const handleUnselectAll = () => {
        setSelectedProspects([]);
    };

    const handleSaveToList = () => {
        if (selectedProspects.length === 0) {
            alert('Please select prospects to save to list');
            return;
        }
        console.log('Save selected prospects to list:', selectedProspects);
        // Implement your save logic here
    };

    const handleAddToCampaign = () => {
        if (selectedProspects.length === 0) {
            alert('Please select prospects to add to campaign');
            return;
        }
        console.log('Add selected prospects to campaign:', selectedProspects);
        // Implement your campaign logic here
    };

    return (
        <div className="flex bg-background" style={{ width: '100%', height: '100%' }}>
            {/* <Sidebar
                isCollapsed={sidebarCollapsed}
                setIsCollapsed={setSidebarCollapsed}
                toggleTheme={toggleTheme}
                isDarkMode={isDarkMode}
            /> */}

            <main className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-900 transition-colors duration-300 text-gray-800 dark:text-gray-200" style={{ overflow: 'hidden' }}>
                <div className="flex-1 p-4 sm:p-6 lg:p-8" style={{ overflowY: 'auto', overflowX: 'hidden' }}>
                    {/* Mobile menu button */}
                    {/* <button
                        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                        className="lg:hidden p-2 mb-4 rounded-md hover:bg-accent"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button> */}

                    {/* Header */}
                    <div className="mb-8 sm:mb-12">
                        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-2">
                            LinkedIn Prospect Finder
                        </h1>
                        <p className="text-lg sm:text-xl text-muted-foreground">
                            Extract LinkedIn profiles with a single click
                        </p>
                        {/* Side Panel Context Info */}
                        {sidePanelContext.isInSidePanel && (
                            <div className="mt-2 text-sm text-blue-600 dark:text-blue-400">
                                Side Panel Mode - Current tab: {sidePanelContext.currentTab?.url?.includes('linkedin.com') ? 'LinkedIn' : 'Other'}
                            </div>
                        )}
                    </div>

                    {/* LinkedIn Extractor Section */}
                    <Card className="mb-8 bg-white dark:bg-gray-800">
                        <CardHeader>
                            <CardTitle className="text-2xl flex items-center gap-2">
                                <Users className="w-6 h-6" />
                                LinkedIn Prospects
                            </CardTitle>
                            <p className="text-muted-foreground">
                                {displayedProspects.length > 0 ? 
                                    `Showing ${displayedProspects.length} extracted prospects` : 
                                    "Extract profiles from LinkedIn"}
                            </p>
                        </CardHeader>
                        <CardContent>
                            {/* Error Display */}
                            {error && (
                                <div className="bg-red-100 dark:bg-red-900/20 border border-red-400 text-red-700 dark:text-red-300 px-4 py-3 rounded mb-6 flex items-start gap-2">
                                    <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                                    <span>{error}</span>
                                </div>
                            )}

                            {/* Bulk Scraping Progress */}
                            {(bulkScraping || bulkProgress) && (
                                <div className="bg-blue-100 dark:bg-blue-900/20 border border-blue-400 text-blue-700 dark:text-blue-300 px-4 py-3 rounded mb-6">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="font-medium">Bulk Scraping in Progress</span>
                                        <Button
                                            onClick={handleStopBulkScraping}
                                            variant="outline"
                                            size="sm"
                                            className="text-red-600 border-red-300 hover:bg-red-50"
                                        >
                                            <X className="w-4 h-4 mr-1" />
                                            Stop
                                        </Button>
                                    </div>
                                    {bulkProgress && (
                                        <div>
                                            <p>Page {bulkProgress.currentPage} of {bulkProgress.maxPages}</p>
                                            <p>Profiles found: {bulkProgress.totalProfiles}</p>
                                            <div className="w-full bg-blue-200 rounded-full h-2 mt-2">
                                                <div
                                                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                                    style={{
                                                        width: `${(bulkProgress.currentPage / bulkProgress.maxPages) * 100}%`
                                                    }}
                                                ></div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Extraction Buttons */}
                            <div className="flex flex-col sm:flex-row gap-4 mb-6">
                                <Button
                                    onClick={handleSingleExtraction}
                                    disabled={loading || bulkScraping}
                                    className="bg-green-600 hover:bg-green-700 text-white flex-1"
                                    size="lg"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Extracting...
                                        </>
                                    ) : (
                                        <>
                                            <Rocket className="mr-2 h-4 w-4" />
                                            Extract Current Page
                                        </>
                                    )}
                                </Button>

                                <Button
                                    onClick={() => setShowBulkModal(true)}
                                    disabled={loading || bulkScraping}
                                    className="bg-blue-600 hover:bg-blue-700 text-white flex-1"
                                    size="lg"
                                >
                                    <Users className="mr-2 h-4 w-4" />
                                    Bulk Scrape Search
                                </Button>
                            </div>

                            {/* Selection and Action Buttons - Only show when there are prospects */}
                            {displayedProspects.length > 0 && (
                                <div className="border-t pt-6 mb-6">
                                    {/* Selection Actions */}
                                    <div className="flex flex-wrap gap-4 mb-4 items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <Button
                                                variant="ghost"
                                                onClick={handleSelectAll}
                                                className="flex items-center gap-2 px-3"
                                                disabled={displayedProspects.length === 0}
                                            >
                                                <CheckSquare className="w-5 h-5 text-blue-600" />
                                                <span className="font-medium">Select All</span>
                                            </Button>
                                            
                                            <Button
                                                variant="ghost"
                                                onClick={handleUnselectAll}
                                                className="flex items-center gap-2 px-3"
                                                disabled={selectedProspects.length === 0}
                                            >
                                                <Square className="w-5 h-5 text-gray-400" />
                                                <span className="font-medium">Unselect All</span>
                                            </Button>
                                            
                                            <span className="text-sm text-gray-500">
                                                {selectedProspects.length} of {displayedProspects.length} selected
                                            </span>
                                        </div>
                                    </div>
                                    
                                    {/* Action Buttons */}
                                    <div className="flex flex-wrap gap-3">
                                        <Button
                                            variant="outline"
                                            onClick={handleSaveToList}
                                            className="flex items-center gap-2"
                                            disabled={selectedProspects.length === 0}
                                        >
                                            <Save className="w-4 h-4" />
                                            Save to List
                                        </Button>
                                        <Button
                                            variant="outline"
                                            onClick={handleAddToCampaign}
                                            className="flex items-center gap-2"
                                            disabled={selectedProspects.length === 0}
                                        >
                                            <Plus className="w-4 h-4" />
                                            Add to Campaign
                                        </Button>
                                        <Button
                                            onClick={exportToCSV}
                                            variant="outline"
                                            className="flex items-center gap-2"
                                            disabled={selectedProspects.length === 0}
                                        >
                                            <Download className="mr-2 h-4 w-4" />
                                            Export CSV
                                        </Button>
                                    </div>
                                </div>
                            )}
                            
                            {/* Prospects List */}
                            {displayedProspects.length > 0 && (
                                <div className="space-y-4">
                                    {displayedProspects.map(prospect => (
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
                                                        className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                                                    />

                                                    {/* Avatar */}
                                                    <Avatar className="w-16 h-16 border-2 border-blue-200">
                                                        <AvatarImage src={prospect.imageUrl} alt={prospect.name} />
                                                        <AvatarFallback className="text-lg bg-blue-200 text-blue-800">
                                                            {prospect.name.split(' ').map(n => n[0]).join('')}
                                                        </AvatarFallback>
                                                    </Avatar>

                                                    {/* Prospect Info */}
                                                    <div>
                                                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
                                                            {prospect.name}
                                                        </h3>
                                                        <p className="text-purple-600 dark:text-purple-400 text-lg mb-1">
                                                            {prospect.headline}
                                                        </p>
                                                        <p className="text-purple-600 dark:text-purple-400">
                                                            {prospect.location}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* View Details Button */}
                                                <Button
                                                    variant="ghost"
                                                    className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 p-2"
                                                >
                                                    <ChevronRight className="w-6 h-6" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Bulk Scraping Modal */}
                    {showBulkModal && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
                                <h3 className="text-xl font-semibold mb-4">Bulk Scraping Settings</h3>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium mb-2">
                                        Maximum pages to scrape (1-10):
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="10"
                                        value={maxPages}
                                        onChange={(e) => setMaxPages(Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))}
                                        className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                                    />
                                </div>
                                <div className="flex gap-3">
                                    <Button
                                        onClick={handleBulkScraping}
                                        className="bg-blue-600 hover:bg-blue-700 text-white flex-1"
                                    >
                                        Start Scraping
                                    </Button>
                                    <Button
                                        onClick={() => setShowBulkModal(false)}
                                        variant="outline"
                                        className="flex-1"
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default Welcome;