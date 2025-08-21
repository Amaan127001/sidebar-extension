import React, { useState, useEffect } from 'react';
import {
    Reply,
    Forward,
    Archive,
    Trash2,
    MoreVertical,
    Search,
    Download,
    FileText,
    Image as ImageIcon,
    Menu,
    ArrowLeft,
    Plus
} from 'lucide-react';
// import Sidebar from './Sidebar';
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import EmojiPicker from './components/EmojiPicker';
import AttachmentUpload from './components/AttachmentUpload';

interface Attachment {
    id: string;
    name: string;
    size: string;
    type: 'pdf' | 'image' | 'document';
    file?: File;
}

interface Email {
    id: string;
    sender: string;
    senderEmail: string;
    subject: string;
    preview: string;
    time: string;
    avatar: string;
    isSelected?: boolean;
    content?: string;
    attachments?: Attachment[];
}

interface MailData {
    emails: Email[];
    selectedEmail: Email | null;
}

interface SidePanelContext {
    isInSidePanel: boolean;
    currentTab: chrome.tabs.Tab | null;
}

interface MailProps {
    toggleTheme: () => void;
    isDarkMode: boolean;
    sidePanelContext: SidePanelContext;
}

const Mail = ({ toggleTheme, isDarkMode, sidePanelContext }: MailProps) => {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [replyText, setReplyText] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [replyAttachments, setReplyAttachments] = useState<Attachment[]>([]);
    const [showEmailContent, setShowEmailContent] = useState(false);
    const [mailData, setMailData] = useState<MailData>({
        emails: [
            {
                id: '1',
                sender: 'Sarah Miller',
                senderEmail: 'sarah.miller@example.com',
                subject: 'Meeting reminder for tomorrow...',
                preview: 'Meeting reminder for tomorrow...',
                time: '10:30 AM',
                avatar: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=40&h=40&fit=crop&crop=face',
            },
            {
                id: '6',
                sender: 'David Wilson',
                senderEmail: 'david.wilson@example.com',
                subject: 'Feedback on the proposal...',
                preview: 'Feedback on the proposal...',
                time: 'Oct 25',
                avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=40&h=40&fit=crop&crop=face',
            }
        ],
        selectedEmail: null
    });

    // Set selected email on component mount
    useEffect(() => {
        const selectedEmail = mailData.emails.find(email => email.isSelected);
        if (selectedEmail) {
            setMailData(prev => ({ ...prev, selectedEmail }));
        }
    }, []);

    const fetchMailData = async () => {
        setIsLoading(true);
        setError(null);
        try {
            console.log('Fetching mail data...', { searchQuery, sidePanelContext });
            // TODO: Replace with actual API call
            await new Promise(resolve => setTimeout(resolve, 1000));
            console.log('Mail data fetched successfully');
        } catch (err) {
            console.error('Error fetching mail data:', err);
            setError('Failed to fetch mail data');
        } finally {
            setIsLoading(false);
        }
    };

    const handleEmailSelect = (email: Email) => {
        setMailData(prev => ({
            ...prev,
            emails: prev.emails.map(e => ({ ...e, isSelected: e.id === email.id })),
            selectedEmail: email
        }));
        setShowEmailContent(true);
    };

    const handleBackToList = () => {
        setShowEmailContent(false);
    };

    const handleSendReply = () => {
        if (!replyText.trim()) return;

        console.log('Sending reply:', {
            text: replyText,
            attachments: replyAttachments,
            context: sidePanelContext
        });

        // TODO: Implement actual send functionality
        setReplyText('');
        setReplyAttachments([]);
    };

    const handleEmailAction = (action: string) => {
        console.log(`Email action: ${action}`, mailData.selectedEmail);
        // TODO: Implement actual email actions
    };

    const handleEmojiSelect = (emoji: string) => {
        setReplyText(prev => prev + emoji);
    };

    const handleAttachmentAdd = (files: FileList) => {
        const newAttachments: Attachment[] = Array.from(files).map(file => {
            const getFileType = (fileName: string): 'pdf' | 'image' | 'document' => {
                const ext = fileName.split('.').pop()?.toLowerCase();
                if (ext === 'pdf') return 'pdf';
                if (['jpg', 'jpeg', 'png', 'gif'].includes(ext || '')) return 'image';
                return 'document';
            };

            const formatFileSize = (bytes: number) => {
                if (bytes === 0) return '0 Bytes';
                const k = 1024;
                const sizes = ['Bytes', 'KB', 'MB', 'GB'];
                const i = Math.floor(Math.log(bytes) / Math.log(k));
                return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
            };

            return {
                id: `reply_${Date.now()}_${Math.random()}`,
                name: file.name,
                size: formatFileSize(file.size),
                type: getFileType(file.name),
                file
            };
        });

        setReplyAttachments(prev => [...prev, ...newAttachments]);
    };

    const handleAttachmentRemove = (id: string) => {
        setReplyAttachments(prev => prev.filter(att => att.id !== id));
    };

    const handleDownloadAttachment = (attachment: Attachment) => {
        console.log('Downloading attachment:', attachment.name);
        // TODO: Implement actual download functionality
    };

    const handleDeleteEmailAttachment = (emailId: string, attachmentId: string) => {
        setMailData(prev => ({
            ...prev,
            emails: prev.emails.map(email => {
                if (email.id === emailId) {
                    return {
                        ...email,
                        attachments: email.attachments?.filter(att => att.id !== attachmentId)
                    };
                }
                return email;
            }),
            selectedEmail: prev.selectedEmail?.id === emailId ? {
                ...prev.selectedEmail,
                attachments: prev.selectedEmail.attachments?.filter(att => att.id !== attachmentId)
            } : prev.selectedEmail
        }));
    };

    const filteredEmails = mailData.emails.filter(email =>
        email.sender.toLowerCase().includes(searchQuery.toLowerCase()) ||
        email.subject.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex transition-colors duration-300">
            {/* <Sidebar
                isCollapsed={sidebarCollapsed}
                setIsCollapsed={setSidebarCollapsed}
                toggleTheme={toggleTheme}
                isDarkMode={isDarkMode}
            /> */}

            <div className="flex-1 flex flex-col h-screen overflow-hidden">
                {/* Header */}
                <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 sm:px-6 py-4 flex-shrink-0">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4 min-w-0">
                            {/* <button
                                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                                className="lg:hidden p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 flex-shrink-0"
                            >
                                <Menu className="w-5 h-5 text-gray-500" />
                            </button> */}
                            {showEmailContent && (
                                <button
                                    onClick={handleBackToList}
                                    className="lg:hidden p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 flex-shrink-0"
                                >
                                    <ArrowLeft className="w-5 h-5 text-gray-500" />
                                </button>
                            )}
                            <div>
                                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white truncate">
                                    {showEmailContent && mailData.selectedEmail ? mailData.selectedEmail.subject : showEmailContent && !mailData.selectedEmail ? 'New Email' : 'Mails'}
                                </h1>
                                {/* Side Panel Context Info */}
                                {sidePanelContext.isInSidePanel && (
                                    <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                                        Side Panel Mode
                                    </div>
                                )}
                            </div>
                            {isLoading && (
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                    <span className="text-sm text-gray-500">Loading...</span>
                                </div>
                            )}
                        </div>

                        {/* New Email Button - Only show when no email is selected */}
                        {!showEmailContent && (
                            <Button
                                // onClick={handleNewEmail}
                                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                            >
                                <Plus className="w-4 h-4" />
                                New Email
                            </Button>
                        )}
                    </div>
                </header>

                {/* Error Display */}
                {error && (
                    <div className="mx-6 mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex-shrink-0">
                        <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
                        <button
                            onClick={fetchMailData}
                            className="mt-2 text-red-600 dark:text-red-400 text-sm underline hover:no-underline"
                        >
                            Try again
                        </button>
                    </div>
                )}

                {/* Main Content */}
                <main className="flex-1 flex overflow-hidden min-h-0">
                    {/* Email List */}
                    <div className={`w-full lg:w-1/3 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-y-auto ${showEmailContent ? 'hidden lg:block' : 'block'
                        }`}>
                        {/* Search */}
                        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <input
                                    type="text"
                                    placeholder="Search mail..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                                />
                            </div>
                        </div>

                        {/* Email List */}
                        <div className="divide-y divide-gray-200 dark:divide-gray-700">
                            {filteredEmails.map((email) => (
                                <div
                                    key={email.id}
                                    onClick={() => handleEmailSelect(email)}
                                    className={`p-4 cursor-pointer transition-colors ${email.isSelected
                                            ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500'
                                            : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                                        }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center min-w-0 flex-1">
                                            <img
                                                src={email.avatar}
                                                alt={`Profile of ${email.sender}`}
                                                className="h-10 w-10 rounded-full mr-3 flex-shrink-0"
                                            />
                                            <div className="min-w-0 flex-1">
                                                <h3 className={`font-semibold truncate ${email.isSelected ? 'text-blue-700 dark:text-blue-300' : 'text-gray-800 dark:text-gray-200'
                                                    }`}>
                                                    {email.sender}
                                                </h3>
                                                <p className={`text-sm truncate ${email.isSelected ? 'text-gray-600 dark:text-gray-400' : 'text-gray-500 dark:text-gray-400'
                                                    }`}>
                                                    {email.preview}
                                                </p>
                                            </div>
                                        </div>
                                        <span className="text-xs text-gray-400 dark:text-gray-500 ml-2 flex-shrink-0">
                                            {email.time}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Email Content */}
                    <div className={`flex-1 flex-col bg-gray-50 dark:bg-gray-900 ${showEmailContent ? 'flex' : 'hidden lg:flex'
                        } min-h-0`}>
                        {mailData.selectedEmail ? (
                            <>
                                {/* Email Header */}
                                <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                                    <div className="flex items-center justify-between mb-4">
                                        <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">
                                            {mailData.selectedEmail.subject}
                                        </h2>
                                        <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-200">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleEmailAction('reply')}
                                            >
                                                <Reply className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleEmailAction('forward')}
                                            >
                                                <Forward className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleEmailAction('archive')}
                                            >
                                                <Archive className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleEmailAction('delete')}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleEmailAction('more')}
                                            >
                                                <MoreVertical className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="text-sm text-gray-500 dark:text-gray-400">
                                        From: {mailData.selectedEmail.sender} &lt;{mailData.selectedEmail.senderEmail}&gt;
                                    </div>
                                </div>

                                {/* Email Content */}
                                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                    {/* Original Message */}
                                    <div className="flex">
                                        <img
                                            src={mailData.selectedEmail.avatar}
                                            alt={`Profile of ${mailData.selectedEmail.sender}`}
                                            className="h-10 w-10 rounded-full mr-4 mt-1 flex-shrink-0"
                                        />
                                        <div className="flex-1 bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="font-semibold text-gray-800 dark:text-gray-200">
                                                    {mailData.selectedEmail.sender}
                                                </span>
                                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                                    {mailData.selectedEmail.time}
                                                </span>
                                            </div>
                                            <div className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
                                                {mailData.selectedEmail.content}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Your Reply */}
                                    <div className="flex">
                                        <img
                                            src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face"
                                            alt="Your profile"
                                            className="h-10 w-10 rounded-full mr-4 mt-1 flex-shrink-0"
                                        />
                                        <div className="flex-1 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg shadow">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="font-semibold text-blue-700 dark:text-blue-300">You</span>
                                                <span className="text-xs text-gray-500 dark:text-gray-400">Today, 9:15 AM</span>
                                            </div>
                                            <div className="text-gray-700 dark:text-gray-300 mb-4">
                                                Hi John,<br /><br />
                                                Thanks for the reminder. I&apos;ve updated my tasks in the tracker.<br /><br />
                                                Best,<br />
                                                [Your Name]
                                            </div>

                                            {/* Action Buttons within the message */}
                                            <div className="flex flex-wrap justify-center items-center gap-2 sm:gap-3 pt-2 border-t border-blue-200 dark:border-blue-700">
                                                <Button
                                                    className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs sm:text-sm"
                                                    size="sm"
                                                >
                                                    ✓ Approve
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    className="border-blue-500 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-xs sm:text-sm"
                                                    size="sm"
                                                >
                                                    ✏️ Edit
                                                </Button>
                                                <Button
                                                    className="bg-purple-500 hover:bg-purple-600 text-white text-xs sm:text-sm"
                                                    size="sm"
                                                >
                                                    🔄 Regenerate
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-xs sm:text-sm"
                                                    size="sm"
                                                >
                                                    ⏭️ Skip
                                                </Button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Attachments */}
                                    {mailData.selectedEmail.attachments && mailData.selectedEmail.attachments.length > 0 && (
                                        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                                            <h4 className="text-md font-semibold text-gray-700 dark:text-gray-300 mb-3">
                                                Attachments ({mailData.selectedEmail.attachments.length})
                                            </h4>
                                            <div className="space-y-2">
                                                {mailData.selectedEmail.attachments.map((attachment) => (
                                                    <div
                                                        key={attachment.id}
                                                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-md"
                                                    >
                                                        <div className="flex items-center">
                                                            {attachment.type === 'pdf' || attachment.type === 'document' ? (
                                                                <FileText className="text-red-500 mr-3 w-5 h-5" />
                                                            ) : (
                                                                <ImageIcon className="text-blue-500 mr-3 w-5 h-5" />
                                                            )}
                                                            <div>
                                                                <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                                                                    {attachment.name}
                                                                </p>
                                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                                    {attachment.size}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center space-x-2">
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => handleDownloadAttachment(attachment)}
                                                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                                            >
                                                                <Download className="w-4 h-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => handleDeleteEmailAttachment(mailData.selectedEmail!.id, attachment.id)}
                                                                className="text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Reply Section */}
                                <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 dark:text-gray-200">
                                    <Textarea
                                        value={replyText}
                                        onChange={(e) => setReplyText(e.target.value)}
                                        placeholder={`Reply to ${mailData.selectedEmail.sender}...`}
                                        className="mb-3 min-h-[100px] resize-none bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                                    />

                                    <div className="flex justify-between items-center mt-3 text-gray-500 dark:text-gray-200">
                                        <div className="flex items-center space-x-2">
                                            <AttachmentUpload
                                                attachments={replyAttachments}
                                                onAttachmentAdd={handleAttachmentAdd}
                                                onAttachmentRemove={handleAttachmentRemove}
                                            />
                                            <EmojiPicker onEmojiSelect={handleEmojiSelect} />
                                        </div>
                                        <Button
                                            onClick={handleSendReply}
                                            disabled={!replyText.trim()}
                                            className='bg-blue-600 hover:bg-blue-700 text-white'
                                        >
                                            <img src="https://img.icons8.com/?size=20&id=86032&format=png&color=ffffff" alt="send" />
                                        </Button>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex items-center justify-center">
                                <p className="text-gray-500 dark:text-gray-400">Select an email to view its content</p>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Mail;