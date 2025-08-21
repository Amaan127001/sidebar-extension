// background.ts - Enhanced LinkedIn Scraper Background Script with Side Panel

interface ExtractedData {
  profiles?: any[];
  profile?: any;
  searchResults?: any[];
  currentPage?: number;
  totalResults?: number;
  error?: string;
}

interface ScrapingSession {
  tabId: number;
  maxPages: number;
  currentPage: number;
  allProfiles: any[];
  isActive: boolean;
  startTime: number;
}

// Store active scraping sessions
const scrapingSessions = new Map<number, ScrapingSession>();

// Side Panel: Open side panel when extension icon is clicked
chrome.action.onClicked.addListener(async (tab) => {
  if (tab.id) {
    try {
      // Open the side panel for the current tab
      await chrome.sidePanel.open({ tabId: tab.id });
    } catch (error) {
      console.error('Failed to open side panel:', error);
      // Fallback: you could show a popup notification or handle the error
    }
  }
});

// Side Panel: Handle side panel availability based on URL
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    try {
      if (tab.url.includes('linkedin.com')) {
        // Enable side panel for LinkedIn pages
        await chrome.sidePanel.setOptions({
          tabId,
          enabled: true
        });
      } else {
        // Optionally disable for non-LinkedIn pages
        // await chrome.sidePanel.setOptions({
        //   tabId,
        //   enabled: false
        // });
      }
    } catch (error) {
      console.error('Error setting side panel options:', error);
    }
  }
});

// Utility function to inject content script if needed
async function ensureContentScriptInjected(tabId: number): Promise<boolean> {
  try {
    // Try to send a test message to see if content script is already injected
    const response = await chrome.tabs.sendMessage(tabId, { action: 'GET_PAGE_INFO' });
    return response?.success || false;
  } catch (error) {
    // Content script not injected, inject it now
    try {
      await chrome.scripting.executeScript({
        target: { tabId },
        files: ['content.js']
      });
      
      // Wait a bit for the script to initialize
      await new Promise(resolve => setTimeout(resolve, 1000));
      return true;
    } catch (injectionError) {
      console.error('Failed to inject content script:', injectionError);
      return false;
    }
  }
}

// Send message to content script with error handling and retries
async function sendMessageToTab(tabId: number, message: any, maxRetries: number = 3): Promise<any> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Sending message to tab ${tabId} (attempt ${attempt}/${maxRetries}):`, message.action);
      const response = await chrome.tabs.sendMessage(tabId, message);
      
      if (response) {
        console.log(`Received response:`, response);
        return response;
      } else {
        console.warn(`Empty response on attempt ${attempt}`);
      }
    } catch (error) {
      console.error(`Error sending message to tab (attempt ${attempt}):`, error);
      
      if (attempt === maxRetries) {
        return { success: false, error: 'Failed to communicate with content script after multiple attempts' };
      }
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
  
  return { success: false, error: 'Max retries exceeded' };
}

// Extract data from current page based on page type
async function extractCurrentPageData(tabId: number): Promise<ExtractedData> {
  try {
    // First, get page info to determine what type of page we're on
    const pageInfoResponse = await sendMessageToTab(tabId, { action: 'GET_PAGE_INFO' });
    
    if (!pageInfoResponse.success) {
      return { error: 'Failed to get page information' };
    }

    const { isProfile, isSearch } = pageInfoResponse.data;
    console.log(`Page type detected - Profile: ${isProfile}, Search: ${isSearch}`);

    if (isProfile) {
      // Extract individual profile data
      const profileResponse = await sendMessageToTab(tabId, { action: 'EXTRACT_PROFILE' });
      
      if (profileResponse.success) {
        return { profile: profileResponse.data };
      } else {
        return { error: profileResponse.error || 'Failed to extract profile data' };
      }
    } else if (isSearch) {
      // Extract search results
      const searchResponse = await sendMessageToTab(tabId, { action: 'EXTRACT_SEARCH_RESULTS' });
      
      if (searchResponse.success) {
        console.log(`Extracted ${searchResponse.data.results?.length || 0} search results`);
        return {
          searchResults: searchResponse.data.results,
          currentPage: searchResponse.data.currentPage,
          totalResults: searchResponse.data.totalResults
        };
      } else {
        return { error: searchResponse.error || 'Failed to extract search results' };
      }
    } else {
      return { error: 'Not a LinkedIn profile or search page' };
    }
  } catch (error) {
    console.error('Error in extractCurrentPageData:', error);
    return { error: 'Extraction failed' };
  }
}

// Wait for page to be ready after navigation with adaptive timing
async function waitForPageReady(tabId: number, maxWaitTime: number = 12000): Promise<boolean> {
  const startTime = Date.now();
  let consecutiveReadyChecks = 0;
  const requiredConsecutiveChecks = 2; // Page must be ready for 2 consecutive checks
  
  console.log(`⏳ Waiting for page to be ready (max ${maxWaitTime}ms)...`);
  
  while (Date.now() - startTime < maxWaitTime) {
    try {
      const response = await sendMessageToTab(tabId, { action: 'CHECK_PAGE_LOADED' }, 1);
      if (response.success && response.data?.loaded) {
        consecutiveReadyChecks++;
        console.log(`✅ Page ready check ${consecutiveReadyChecks}/${requiredConsecutiveChecks}`);
        
        if (consecutiveReadyChecks >= requiredConsecutiveChecks) {
          const elapsed = Date.now() - startTime;
          console.log(`✅ Page confirmed ready after ${elapsed}ms`);
          return true;
        }
      } else {
        consecutiveReadyChecks = 0; // Reset if not ready
        console.log('⏳ Page not ready, continuing to wait...');
      }
    } catch (error) {
      consecutiveReadyChecks = 0;
      console.log('⏳ Page readiness check failed, continuing to wait...');
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  const elapsed = Date.now() - startTime;
  console.warn(`⚠️ Page ready timeout reached after ${elapsed}ms`);
  return false;
}

// Start bulk scraping session
async function startBulkScraping(tabId: number, maxPages: number): Promise<void> {
  const session: ScrapingSession = {
    tabId,
    maxPages,
    currentPage: 1,
    allProfiles: [],
    isActive: true,
    startTime: Date.now()
  };

  scrapingSessions.set(tabId, session);
  console.log(`Starting bulk scraping session: ${maxPages} pages max`);

  try {
    await processBulkScraping(session);
  } catch (error) {
    console.error('Bulk scraping error:', error);
    session.isActive = false;
    
    // Notify side panel of completion with error
    chrome.runtime.sendMessage({
      action: "BULK_SCRAPING_COMPLETE",
      data: {
        profiles: session.allProfiles,
        totalPages: session.currentPage - 1,
        totalProfiles: session.allProfiles.length,
        error: 'Scraping interrupted: ' + (error as Error).message
      }
    });
  } finally {
    scrapingSessions.delete(tabId);
    console.log('Bulk scraping session ended');
  }
}

// Process bulk scraping across multiple pages with enhanced persistence
async function processBulkScraping(session: ScrapingSession): Promise<void> {
  console.log(`🚀 Starting PERSISTENT bulk scraping: ${session.maxPages} pages GUARANTEED`);
  
  let consecutiveFailures = 0;
  const maxConsecutiveFailures = 3;
  let retryAttempts = 0;
  const maxRetryAttempts = 2;
  
  while (session.isActive && session.currentPage <= session.maxPages) {
    try {
      console.log(`\n📄 === PROCESSING PAGE ${session.currentPage}/${session.maxPages} === (Attempt ${retryAttempts + 1})`);
      
      // Enhanced page readiness check with retries
      let pageReady = false;
      for (let readyAttempt = 1; readyAttempt <= 3; readyAttempt++) {
        console.log(`⏳ Checking page readiness (attempt ${readyAttempt}/3)...`);
        pageReady = await waitForPageReady(session.tabId, 8000); // Longer timeout
        
        if (pageReady) {
          console.log(`✅ Page ${session.currentPage} is ready`);
          break;
        } else if (readyAttempt < 3) {
          console.log(`⚠️ Page not ready, waiting 2s before retry...`);
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
      
      if (!pageReady) {
        console.warn(`⚠️ Page ${session.currentPage} not fully ready, but proceeding...`);
      }

      // Extract current page data with enhanced error handling
      let pageData: ExtractedData | null = null;
      let extractionAttempts = 0;
      
      while (!pageData && extractionAttempts < 3) {
        extractionAttempts++;
        console.log(`🔍 Extracting data from page ${session.currentPage} (attempt ${extractionAttempts}/3)`);
        
        pageData = await extractCurrentPageData(session.tabId);
        
        if (pageData.error) {
          console.error(`❌ Extraction error (attempt ${extractionAttempts}):`, pageData.error);
          
          if (extractionAttempts < 3) {
            console.log(`🔄 Retrying extraction in 3 seconds...`);
            await new Promise(resolve => setTimeout(resolve, 3000));
            pageData = null; // Reset for retry
          }
        }
      }
      
      // Handle extraction results
      if (pageData?.error) {
        console.error(`❌ Failed to extract data from page ${session.currentPage} after 3 attempts:`, pageData.error);
        
        // If it's the first page and we get persistent errors, stop completely
        if (session.currentPage === 1) {
          throw new Error(`Failed to extract data from first page after retries: ${pageData.error}`);
        }
        
        consecutiveFailures++;
        console.warn(`⚠️ Consecutive failures: ${consecutiveFailures}/${maxConsecutiveFailures}`);
        
        // If too many consecutive failures, stop
        if (consecutiveFailures >= maxConsecutiveFailures) {
          console.error(`💥 Too many consecutive failures (${consecutiveFailures}), stopping scraping`);
          break;
        }
        
        // Try to continue to next page anyway
        console.log(`🔄 Attempting to skip to next page despite extraction failure...`);
        
      } else if (pageData?.searchResults && pageData.searchResults.length > 0) {
        // Successful extraction
        consecutiveFailures = 0; // Reset failure counter
        retryAttempts = 0; // Reset retry counter
        
        // Filter out duplicates based on multiple URL patterns
        const newProfiles = pageData.searchResults.filter((newProfile: any) => {
          const newUrl = (newProfile.url || newProfile.profileUrl || newProfile.link || '').toLowerCase();
          const newUrlClean = newUrl.replace(/\?.*$/, '').replace(/\/$/, ''); // Remove query params and trailing slash
          
          return !session.allProfiles.find((existingProfile: any) => {
            const existingUrl = (existingProfile.url || existingProfile.profileUrl || existingProfile.link || '').toLowerCase();
            const existingUrlClean = existingUrl.replace(/\?.*$/, '').replace(/\/$/, '');
            return existingUrlClean === newUrlClean;
          });
        });
        
        session.allProfiles.push(...newProfiles);
        
        console.log(`✅ Page ${session.currentPage}: Found ${pageData.searchResults.length} profiles, ${newProfiles.length} new unique ones`);
        console.log(`📊 Total unique profiles collected: ${session.allProfiles.length}`);
        
        // Notify side panel of progress
        chrome.runtime.sendMessage({
          action: "BULK_SCRAPING_PROGRESS",
          data: {
            currentPage: session.currentPage,
            maxPages: session.maxPages,
            profilesFound: newProfiles.length,
            totalProfiles: session.allProfiles.length,
            pagesRemaining: session.maxPages - session.currentPage
          }
        });
        
        // If no new profiles found, but we had results, it might be end of unique data
        if (newProfiles.length === 0 && pageData.searchResults.length > 0) {
          console.warn(`⚠️ No new unique profiles found on page ${session.currentPage}, but continuing...`);
        }
        
      } else {
        console.log(`⚠️ No search results found on page ${session.currentPage}`);
        consecutiveFailures++;
      }

      // Check if we've reached the target pages
      if (session.currentPage >= session.maxPages) {
        console.log(`🎯 Reached target pages (${session.maxPages}), completing scraping`);
        break;
      }

      // ENHANCED NAVIGATION LOGIC - Multiple attempts with different strategies
      let navigationSuccess = false;
      let navigationAttempts = 0;
      const maxNavigationAttempts = 4;
      
      while (!navigationSuccess && navigationAttempts < maxNavigationAttempts && session.currentPage < session.maxPages) {
        navigationAttempts++;
        console.log(`🧭 Navigation attempt ${navigationAttempts}/${maxNavigationAttempts} from page ${session.currentPage} to ${session.currentPage + 1}`);
        
        // Try navigation
        const navigationResponse = await sendMessageToTab(session.tabId, { 
          action: 'NAVIGATE_NEXT_PAGE',
          attempt: navigationAttempts,
          currentPage: session.currentPage 
        }, 1); // Single retry for navigation message
        
        if (navigationResponse.success) {
          console.log(`✅ Navigation command accepted`);
          
          // Wait for navigation with progressive delays
          const waitTime = Math.min(3000 + (navigationAttempts * 1000), 8000);
          console.log(`⏳ Waiting ${waitTime}ms for page navigation to complete...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          
          // Verify navigation success by checking page number change
          let verificationAttempts = 0;
          const maxVerificationAttempts = 5;
          let newPageDetected = false;
          
          while (!newPageDetected && verificationAttempts < maxVerificationAttempts) {
            verificationAttempts++;
            console.log(`🔍 Verifying navigation success (attempt ${verificationAttempts}/${maxVerificationAttempts})`);
            
            const verifyResponse = await sendMessageToTab(session.tabId, { action: 'GET_CURRENT_PAGE_NUMBER' }, 1);
            const currentUrlResponse = await sendMessageToTab(session.tabId, { action: 'GET_PAGE_INFO' }, 1);
            
            if (verifyResponse.success && verifyResponse.data?.pageNumber) {
              const detectedPageNum = verifyResponse.data.pageNumber;
              console.log(`📍 Current page detected as: ${detectedPageNum} (expected: ${session.currentPage + 1})`);
              
              if (detectedPageNum > session.currentPage) {
                newPageDetected = true;
                navigationSuccess = true;
                session.currentPage = detectedPageNum;
                console.log(`✅ Successfully navigated to page ${session.currentPage}`);
                break;
              }
            }
            
            // Also check URL for page parameter changes
            if (currentUrlResponse.success && currentUrlResponse.data?.url) {
              const urlPageMatch = currentUrlResponse.data.url.match(/[&?]page=(\d+)/);
              if (urlPageMatch) {
                const urlPageNum = parseInt(urlPageMatch[1]);
                if (urlPageNum > session.currentPage - navigationAttempts + 1) {
                  newPageDetected = true;
                  navigationSuccess = true;
                  session.currentPage = urlPageNum;
                  console.log(`✅ URL-based navigation detected, now on page ${session.currentPage}`);
                  break;
                }
              }
            }
            
            if (verificationAttempts < maxVerificationAttempts) {
              console.log(`⏳ Waiting 2s before next verification...`);
              await new Promise(resolve => setTimeout(resolve, 2000));
            }
          }
          
          if (!newPageDetected) {
            console.warn(`⚠️ Navigation verification failed after ${maxVerificationAttempts} attempts`);
          }
          
        } else {
          console.error(`❌ Navigation command failed:`, navigationResponse.error);
          
          // Check if we've truly reached the end
          if (navigationAttempts >= 2) {
            console.log(`🔍 Checking if we've reached end of results...`);
            const endCheckResponse = await sendMessageToTab(session.tabId, { action: 'CHECK_END_OF_RESULTS' }, 1);
            
            if (endCheckResponse.success && endCheckResponse.data?.isEndOfResults) {
              console.log(`🏁 Confirmed: reached genuine end of search results`);
              break; // Break out of navigation attempts
            }
          }
        }
        
        // If navigation failed but we haven't reached max attempts, wait and retry
        if (!navigationSuccess && navigationAttempts < maxNavigationAttempts) {
          const retryWait = 2000 + (navigationAttempts * 1000);
          console.log(`🔄 Navigation failed, waiting ${retryWait}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, retryWait));
        }
      }
      
      // Handle navigation failure after all attempts
      if (!navigationSuccess) {
        console.error(`💥 Failed to navigate after ${maxNavigationAttempts} attempts`);
        
        // If we're close to the target pages, try one more time with longer waits
        if (session.maxPages - session.currentPage <= 2 && retryAttempts < maxRetryAttempts) {
          retryAttempts++;
          console.log(`🔄 FINAL RETRY ${retryAttempts}/${maxRetryAttempts} - This is critical for reaching ${session.maxPages} pages!`);
          await new Promise(resolve => setTimeout(resolve, 5000)); // Long wait
          continue; // Don't increment currentPage, retry the same page navigation
        }
        
        console.log(`🛑 Unable to continue navigation. Completed ${session.currentPage} pages out of requested ${session.maxPages}`);
        break;
      }
      
      // Reset retry attempts after successful navigation
      retryAttempts = 0;
      
    } catch (error) {
      console.error(`💥 Critical error processing page ${session.currentPage}:`, error);
      
      // If this is the first page, throw the error to stop completely
      if (session.currentPage === 1) {
        throw error;
      }
      
      // For other pages, try to recover
      consecutiveFailures++;
      if (consecutiveFailures >= maxConsecutiveFailures) {
        console.log(`💥 Too many critical errors, stopping at page ${session.currentPage}`);
        break;
      }
      
      console.log(`🔄 Attempting to recover and continue...`);
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }

  // Mark session as complete
  session.isActive = false;
  
  const duration = Math.round((Date.now() - session.startTime) / 1000);
  const pagesProcessed = session.currentPage;
  const successRate = Math.round((pagesProcessed / session.maxPages) * 100);
  
  console.log(`\n🎉 === BULK SCRAPING COMPLETED ===`);
  console.log(`📊 Total unique profiles: ${session.allProfiles.length}`);
  console.log(`📄 Pages processed: ${pagesProcessed}/${session.maxPages} (${successRate}% success rate)`);
  console.log(`⏱️ Duration: ${duration} seconds`);
  console.log(`⚡ Average time per page: ${Math.round(duration / pagesProcessed)}s`);
  
  // Notify side panel of completion with detailed stats
  chrome.runtime.sendMessage({
    action: "BULK_SCRAPING_COMPLETE",
    data: {
      profiles: session.allProfiles,
      totalPages: pagesProcessed,
      requestedPages: session.maxPages,
      totalProfiles: session.allProfiles.length,
      duration: duration,
      successRate: successRate,
      averageTimePerPage: Math.round(duration / pagesProcessed)
    }
  });
}

// Stop bulk scraping session
function stopBulkScraping(tabId: number): void {
  const session = scrapingSessions.get(tabId);
  if (session) {
    console.log(`Stopping bulk scraping session for tab ${tabId}`);
    session.isActive = false;
    scrapingSessions.delete(tabId);
    
    chrome.runtime.sendMessage({
      action: "BULK_SCRAPING_STOPPED",
      data: {
        profiles: session.allProfiles,
        totalPages: session.currentPage,
        totalProfiles: session.allProfiles.length
      }
    });
  }
}

// Enhanced message listener with proper async handling
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Background received message:', message);

  // Handle async operations properly
  const handleAsync = async () => {
    try {
      switch (message.action) {
        case "REQUEST_EXTRACTION":
          return await handleExtractionRequest();
          
        case "REQUEST_BULK_SCRAPING":
          return await handleBulkScrapingRequest(message.maxPages || 5);
          
        case "STOP_BULK_SCRAPING":
          return handleStopBulkScraping();
          
        case "GET_SCRAPING_STATUS":
          return handleGetScrapingStatus();

        case "PAGE_READY":
          // Content script notifying that page is ready
          console.log(`Page ready: ${message.pageType} - ${message.url}`);
          return { success: true };
          
        default:
          console.warn('Unknown action:', message.action);
          return { success: false, error: 'Unknown action' };
      }
    } catch (error) {
      console.error('Message handler error:', error);
      return { success: false, error: 'Internal error occurred' };
    }
  };

  // Execute async handler and send response
  handleAsync().then(response => {
    if (sendResponse) {
      sendResponse(response);
    }
  }).catch(error => {
    console.error('Async handler error:', error);
    if (sendResponse) {
      sendResponse({ success: false, error: error.message });
    }
  });

  return true; // Keep the message channel open for async responses
});

// Handle single extraction request
async function handleExtractionRequest(): Promise<any> {
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const activeTab = tabs[0];
    
    if (!activeTab.id || !activeTab.url?.includes("linkedin.com")) {
      return { success: false, error: "Please open LinkedIn first" };
    }

    // Ensure content script is injected
    const injected = await ensureContentScriptInjected(activeTab.id);
    if (!injected) {
      return { success: false, error: "Failed to initialize scraper" };
    }

    // Extract data from current page
    const extractedData = await extractCurrentPageData(activeTab.id);
    
    return { 
      success: !extractedData.error, 
      data: extractedData.error ? { error: extractedData.error } : extractedData
    };
    
  } catch (error) {
    console.error('Extraction request error:', error);
    return { success: false, error: "Extraction failed" };
  }
}

// Handle bulk scraping request
async function handleBulkScrapingRequest(maxPages: number): Promise<any> {
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const activeTab = tabs[0];
    
    if (!activeTab.id || !activeTab.url?.includes("linkedin.com")) {
      return { success: false, error: "Please open LinkedIn search results first" };
    }

    // Check if already scraping
    if (scrapingSessions.has(activeTab.id)) {
      return { success: false, error: "Scraping already in progress" };
    }

    // Ensure content script is injected
    const injected = await ensureContentScriptInjected(activeTab.id);
    if (!injected) {
      return { success: false, error: "Failed to initialize scraper" };
    }

    // Verify we're on a search page
    const pageInfoResponse = await sendMessageToTab(activeTab.id, { action: 'GET_PAGE_INFO' });
    if (!pageInfoResponse.success || !pageInfoResponse.data.isSearch) {
      return { success: false, error: "Please navigate to LinkedIn search results first" };
    }

    // Start bulk scraping in background
    startBulkScraping(activeTab.id, Math.min(maxPages, 10)); // Limit to max 10 pages
    
    return { success: true, message: "Bulk scraping started" };
    
  } catch (error) {
    console.error('Bulk scraping request error:', error);
    return { success: false, error: "Failed to start bulk scraping" };
  }
}

// Handle stop bulk scraping request
function handleStopBulkScraping(): any {
  try {
    return new Promise((resolve) => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const activeTab = tabs[0];
        if (activeTab.id && scrapingSessions.has(activeTab.id)) {
          stopBulkScraping(activeTab.id);
          resolve({ success: true, message: "Bulk scraping stopped" });
        } else {
          resolve({ success: false, error: "No active scraping session" });
        }
      });
    });
  } catch (error) {
    console.error('Stop scraping error:', error);
    return { success: false, error: "Failed to stop scraping" };
  }
}

// Handle get scraping status request
function handleGetScrapingStatus(): any {
  try {
    return new Promise((resolve) => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const activeTab = tabs[0];
        if (activeTab.id && scrapingSessions.has(activeTab.id)) {
          const session = scrapingSessions.get(activeTab.id)!;
          resolve({
            success: true,
            data: {
              isActive: session.isActive,
              currentPage: session.currentPage,
              maxPages: session.maxPages,
              profilesCollected: session.allProfiles.length
            }
          });
        } else {
          resolve({
            success: true,
            data: { isActive: false }
          });
        }
      });
    });
  } catch (error) {
    console.error('Get status error:', error);
    return { success: false, error: "Failed to get status" };
  }
}

// Clean up when tab is closed
chrome.tabs.onRemoved.addListener((tabId) => {
  if (scrapingSessions.has(tabId)) {
    console.log(`Cleaning up scraping session for closed tab ${tabId}`);
    scrapingSessions.delete(tabId);
  }
});