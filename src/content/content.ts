// content.ts - Enhanced LinkedIn Profile Scraper

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
  company?: string;
  position?: string;
}

interface MessageResponse {
  success: boolean;
  data?: any;
  error?: string;
  message?: string;
  currentPage?: number;
  totalResults?: number;
}

class LinkedInScraper {
  private readonly selectors = {
    // Profile page selectors
    name: [
      'h1.text-heading-xlarge',
      '.pv-text-details__left-panel h1',
      '.profile-topcard-person-name',
      '.top-card-layout__title',
      'h1[data-anonymize="person-name"]'
    ],
    headline: [
      '.text-body-medium.break-words',
      '.top-card-layout__headline',
      '.pv-text-details__left-panel .text-body-medium',
      '.profile-topcard-headline',
      '[data-anonymize="headline"]'
    ],
    location: [
      '.text-body-small.inline.t-black--light.break-words',
      '.pv-text-details__left-panel .pb2',
      '.profile-topcard-location',
      '.top-card-layout__first-subline',
      '[data-anonymize="location"]'
    ],
    about: [
      '.pv-about-section .pv-about__summary-text',
      '.core-section-container__content .break-words',
      '.pv-about__summary-text .inline-show-more-text',
      '.about-section .pv-about__summary-text',
      '.pv-shared-text-with-see-more .inline-show-more-text'
    ],
    connections: [
      '.top-card-layout__first-subline a',
      '.pv-top-card--list-bullet li:first-child',
      '.profile-topcard-person-connections',
      'a[data-anonymize="connection-count"]'
    ],
    profileImage: [
      '.pv-top-card-profile-picture__image img',
      '.profile-photo-edit__preview img',
      '.top-card-layout__entity-image img',
      '.pv-top-card-profile-picture img',
      'img[data-anonymize="headshot-photo"]'
    ]
  };

  // Utility function to safely extract text with multiple fallbacks
  private safeText(selectors: string[], context: Document | Element = document): string {
    for (const selector of selectors) {
      try {
        const elements = context.querySelectorAll(selector);
        for (const element of elements) {
          const text = element.textContent?.trim();
          if (text && text.length > 0 && !text.includes('LinkedIn')) {
            return text;
          }
        }
      } catch (error) {
        console.warn(`Error with selector ${selector}:`, error);
      }
    }
    return '';
  }

  // Utility function to safely get attribute
  private safeAttribute(selector: string, attribute: string, context: Document | Element = document): string {
    try {
      const element = context.querySelector(selector);
      return element?.getAttribute(attribute)?.trim() || '';
    } catch (error) {
      console.warn(`Error getting attribute ${attribute} for selector ${selector}:`, error);
      return '';
    }
  }

  // Wait for element to appear with better timeout handling
  private waitForElement(selector: string, timeout = 5000): Promise<Element | null> {
    return new Promise((resolve) => {
      const element = document.querySelector(selector);
      if (element) {
        resolve(element);
        return;
      }

      const observer = new MutationObserver(() => {
        const element = document.querySelector(selector);
        if (element) {
          observer.disconnect();
          resolve(element);
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true
      });

      setTimeout(() => {
        observer.disconnect();
        resolve(null);
      }, timeout);
    });
  }

  // Check if page is fully loaded
  isPageLoaded(): boolean {
    const hasContent = document.querySelectorAll('.reusable-search__result-container, .entity-result, .pv-profile-section').length > 0;
    const noSpinners = document.querySelectorAll('.artdeco-spinner, .loading-state, [aria-label="Loading"]').length === 0;
    const readyState = document.readyState === 'complete';
    
    return hasContent && noSpinners && readyState;
  }

  // Extract profile details from individual profile page
  extractProfileDetails(): ProfileData {
    console.log('Extracting profile details...');
    
    const name = this.safeText(this.selectors.name);
    const headline = this.safeText(this.selectors.headline);
    const location = this.safeText(this.selectors.location);
    const about = this.safeText(this.selectors.about);
    const connections = this.safeText(this.selectors.connections);
    const imageUrl = this.safeAttribute(this.selectors.profileImage[0], 'src');
    
    console.log('Basic info extracted:', { name, headline, location });
    
    // Extract experience
    const experience = this.extractExperience();
    
    // Extract education
    const education = this.extractEducation();
    
    // Extract skills
    const skills = this.extractSkills();
    
    // Extract contact information
    const contactInfo = this.extractContactInfo();
    
    // Get current position and company from first experience
    const currentPosition = experience[0]?.title || '';
    const currentCompany = experience[0]?.company || '';

    const profileData: ProfileData = {
      name,
      headline,
      location,
      about,
      experience,
      education,
      skills,
      connections,
      profileUrl: window.location.href,
      imageUrl,
      currentCompany,
      currentPosition,
      ...contactInfo
    };

    console.log('Profile extraction complete. Experience count:', experience.length, 'Skills count:', skills.length);
    return profileData;
  }

  // Extract experience section with enhanced selectors
  private extractExperience(): ExperienceItem[] {
    const experiences: ExperienceItem[] = [];
    
    // Multiple strategies for finding experience section
    const experienceSectionSelectors = [
      '[data-section="experience"]',
      '.experience-section',
      '.pvs-list__outer-container',
      '#experience ~ .pvs-list__outer-container',
      '.scaffold-finite-scroll__content [data-view-name="profile-component-entity"]'
    ];
    
    let experienceSection: Element | null = null;
    
    for (const selector of experienceSectionSelectors) {
      experienceSection = document.querySelector(selector);
      if (experienceSection) break;
    }
    
    if (!experienceSection) {
      console.log('No experience section found');
      return experiences;
    }

    console.log('Experience section found');

    const experienceItemSelectors = [
      '.pv-entity__summary-info',
      '.pvs-list__paged-list-item',
      '.artdeco-list__item',
      '[data-view-name="profile-component-entity"]',
      '.pvs-entity'
    ];

    let experienceItems: NodeListOf<Element> | null = null;
    
    for (const selector of experienceItemSelectors) {
      experienceItems = experienceSection.querySelectorAll(selector);
      if (experienceItems.length > 0) break;
    }

    if (!experienceItems) {
      console.log('No experience items found');
      return experiences;
    }

    console.log(`Found ${experienceItems.length} experience items`);

    experienceItems.forEach((item, index) => {
      if (index >= 10) return; // Limit to 10 most recent experiences

      try {
        const titleSelectors = [
          '.pv-entity__summary-info h3',
          '.mr1.t-bold span[aria-hidden="true"]',
          '.pvs-entity__caption-wrapper .t-14 span[aria-hidden="true"]',
          '[data-field="experience-position-title"]',
          '.pvs-entity__caption-wrapper .visually-hidden'
        ];

        const companySelectors = [
          '.pv-entity__secondary-title',
          '.t-14.t-normal span[aria-hidden="true"]',
          '.pvs-entity__caption-wrapper .t-14.t-black--light span[aria-hidden="true"]',
          '[data-field="experience-company-name"]'
        ];

        const durationSelectors = [
          '.pv-entity__bullet-item-v2',
          '.t-14.t-normal.t-black--light span[aria-hidden="true"]',
          '.pvs-entity__caption-wrapper .t-14.t-black--light',
          '[data-field="experience-duration"]'
        ];

        const title = this.safeText(titleSelectors, item);
        const company = this.safeText(companySelectors, item);
        const duration = this.safeText(durationSelectors, item);

        if (title || company) {
          experiences.push({
            title,
            company,
            duration,
            location: this.safeText(['.pv-entity__location span:last-child', '.t-14.t-normal.t-black--light:last-child'], item)
          });
        }
      } catch (error) {
        console.warn(`Error extracting experience item ${index}:`, error);
      }
    });

    console.log(`Extracted ${experiences.length} experience items`);
    return experiences;
  }

  // Extract education section
  private extractEducation(): EducationItem[] {
    const education: EducationItem[] = [];
    
    const educationSectionSelectors = [
      '[data-section="education"]',
      '.education-section',
      '#education ~ .pvs-list__outer-container',
      '.scaffold-finite-scroll__content [data-view-name="profile-component-entity"]'
    ];
    
    let educationSection: Element | null = null;
    
    for (const selector of educationSectionSelectors) {
      educationSection = document.querySelector(selector);
      if (educationSection) break;
    }
    
    if (!educationSection) return education;

    const educationItems = educationSection.querySelectorAll(
      '.pv-entity__summary-info, .pvs-list__paged-list-item, .pvs-entity'
    );

    educationItems.forEach((item, index) => {
      if (index >= 5) return; // Limit to 5 education entries

      try {
        const school = this.safeText([
          '.pv-entity__school-name',
          '.mr1.t-bold span[aria-hidden="true"]',
          '[data-field="education-school-name"]'
        ], item);

        const degree = this.safeText([
          '.pv-entity__secondary-title .pv-entity__comma-item',
          '.t-14.t-normal span[aria-hidden="true"]',
          '[data-field="education-degree-name"]'
        ], item);

        const duration = this.safeText([
          '.pv-entity__dates span:last-child',
          '.t-14.t-normal.t-black--light span[aria-hidden="true"]',
          '[data-field="education-date-range"]'
        ], item);

        if (school) {
          education.push({
            school,
            degree,
            duration
          });
        }
      } catch (error) {
        console.warn(`Error extracting education item ${index}:`, error);
      }
    });

    return education;
  }

  // Extract skills with better detection
  private extractSkills(): string[] {
    const skills: string[] = [];
    
    const skillsSectionSelectors = [
      '[data-section="skills"]',
      '.skills-section',
      '#skills ~ .pvs-list__outer-container',
      '.scaffold-finite-scroll__content [data-view-name="profile-component-entity"]'
    ];
    
    let skillsSection: Element | null = null;
    
    for (const selector of skillsSectionSelectors) {
      skillsSection = document.querySelector(selector);
      if (skillsSection) break;
    }
    
    if (!skillsSection) return skills;

    const skillItemSelectors = [
      '.pv-skill-category-entity__name span',
      '.mr1.t-bold span[aria-hidden="true"]',
      '[data-field="skill-name"]',
      '.pvs-entity__caption-wrapper .visually-hidden'
    ];

    for (const selector of skillItemSelectors) {
      const skillItems = skillsSection.querySelectorAll(selector);
      
      skillItems.forEach((item, index) => {
        if (index >= 15) return; // Limit to top 15 skills
        
        const skill = item.textContent?.trim();
        if (skill && skill.length > 1 && !skills.includes(skill) && !skill.includes('LinkedIn')) {
          skills.push(skill);
        }
      });
      
      if (skills.length > 0) break;
    }

    return skills;
  }

  // Extract contact information with better patterns
  private extractContactInfo(): { email?: string; phone?: string; website?: string } {
    const contactInfo: { email?: string; phone?: string; website?: string } = {};

    // Enhanced email regex
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    const phoneRegex = /(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g;

    const textContent = document.body.textContent || '';
    
    const emailMatches = textContent.match(emailRegex);
    if (emailMatches?.length) {
      const personalEmails = emailMatches.filter(email => 
        !email.toLowerCase().includes('linkedin.com') && 
        !email.toLowerCase().includes('noreply') &&
        !email.toLowerCase().includes('support') &&
        !email.toLowerCase().includes('help')
      );
      if (personalEmails.length > 0) {
        contactInfo.email = personalEmails[0];
      }
    }

    const phoneMatches = textContent.match(phoneRegex);
    if (phoneMatches?.length) {
      contactInfo.phone = phoneMatches[0];
    }

    // Look for website links in contact section or profile
    const websiteLinks = document.querySelectorAll('a[href^="http"]:not([href*="linkedin.com"])');
    for (const link of websiteLinks) {
      const href = link.getAttribute('href');
      if (href && 
          !href.includes('twitter.com') &&
          !href.includes('facebook.com') &&
          !href.includes('instagram.com') &&
          (href.includes('.com') || href.includes('.org') || href.includes('.net'))) {
        contactInfo.website = href;
        break;
      }
    }

    return contactInfo;
  }

  // Extract search results with enhanced strategies
  extractSearchResults(): SearchResult[] {
    const results: SearchResult[] = [];
    
    console.log('Extracting search results...');
    
    // Multiple strategies for different LinkedIn layouts
    const searchStrategies = [
      // Strategy 1: Modern reusable search results
      () => {
        const containers = document.querySelectorAll('.reusable-search__result-container');
        console.log(`Strategy 1: Found ${containers.length} reusable search containers`);
        
        containers.forEach((container, index) => {
          try {
            const nameElement = container.querySelector('.entity-result__title-text a, .app-aware-link');
            const headlineElement = container.querySelector('.entity-result__primary-subtitle, .entity-result__summary');
            const locationElement = container.querySelector('.entity-result__secondary-subtitle');
            const imageElement = container.querySelector('.entity-result__image img, .presence-entity__image img');
            
            if (nameElement) {
              const href = nameElement.getAttribute('href');
              if (href?.includes('/in/')) {
                const name = nameElement.textContent?.trim();
                if (name && name.length > 1) {
                  const result: SearchResult = {
                    name,
                    url: href.startsWith('http') ? href : `https://www.linkedin.com${href}`,
                    headline: headlineElement?.textContent?.trim() || '',
                    location: locationElement?.textContent?.trim() || '',
                    imageUrl: imageElement?.getAttribute('src') || undefined
                  };
                  
                  if (!results.find(r => r.url === result.url)) {
                    results.push(result);
                  }
                }
              }
            }
          } catch (error) {
            console.warn(`Error processing reusable search result ${index}:`, error);
          }
        });
      },
      
      // Strategy 2: Entity results
      () => {
        const containers = document.querySelectorAll('.entity-result');
        console.log(`Strategy 2: Found ${containers.length} entity result containers`);
        
        containers.forEach((container, index) => {
          try {
            const nameElement = container.querySelector('.entity-result__title-text a');
            const headlineElement = container.querySelector('.entity-result__primary-subtitle');
            const locationElement = container.querySelector('.entity-result__secondary-subtitle');
            const imageElement = container.querySelector('img[data-anonymize="headshot-photo"]');
            
            if (nameElement) {
              const href = nameElement.getAttribute('href');
              if (href?.includes('/in/')) {
                const name = nameElement.textContent?.trim();
                if (name && name.length > 1) {
                  const result: SearchResult = {
                    name,
                    url: href.startsWith('http') ? href : `https://www.linkedin.com${href}`,
                    headline: headlineElement?.textContent?.trim() || '',
                    location: locationElement?.textContent?.trim() || '',
                    imageUrl: imageElement?.getAttribute('src') || undefined
                  };
                  
                  if (!results.find(r => r.url === result.url)) {
                    results.push(result);
                  }
                }
              }
            }
          } catch (error) {
            console.warn(`Error processing entity result ${index}:`, error);
          }
        });
      },
      
      // Strategy 3: Generic profile links with better filtering
      () => {
        const profileLinks = document.querySelectorAll('a[href*="/in/"]:not([href*="/company/"]):not([href*="/school/"])');
        console.log(`Strategy 3: Found ${profileLinks.length} profile links`);
        
        const processed = new Set<string>();
        
        profileLinks.forEach(link => {
          try {
            const href = link.getAttribute('href');
            if (href && !processed.has(href) && href.match(/\/in\/[^\/]+\/?(?:\?[^\/]*)?$/)) {
              processed.add(href);
              
              const name = link.textContent?.trim();
              if (name && 
                  name.length > 2 && 
                  !name.toLowerCase().includes('linkedin') && 
                  !name.toLowerCase().includes('view') && 
                  !name.toLowerCase().includes('connect') &&
                  !name.toLowerCase().includes('message') &&
                  !/^\d+$/.test(name)) { // Not just numbers
                
                const result: SearchResult = {
                  name,
                  url: href.startsWith('http') ? href : `https://www.linkedin.com${href}`,
                  headline: '',
                  location: ''
                };
                
                if (!results.find(r => r.url === result.url)) {
                  results.push(result);
                }
              }
            }
          } catch (error) {
            console.warn('Error processing profile link:', error);
          }
        });
      }
    ];

    // Execute strategies
    for (let i = 0; i < searchStrategies.length; i++) {
      const beforeCount = results.length;
      try {
        searchStrategies[i]();
        const afterCount = results.length;
        console.log(`Strategy ${i + 1} added ${afterCount - beforeCount} results`);
        
        if (results.length >= 25) break; // Stop if we have enough results
      } catch (error) {
        console.warn(`Strategy ${i + 1} failed:`, error);
      }
    }

    // Clean and deduplicate results
    const uniqueResults = results
      .filter((result, index, array) => array.findIndex(r => r.url === result.url) === index)
      .filter(result => result.name.length > 1 && result.url.includes('/in/'));
    
    console.log(`Total extracted results: ${results.length}, Unique results: ${uniqueResults.length}`);
    
    return uniqueResults;
  }

  // Enhanced navigation with MAXIMUM persistence - WILL NOT GIVE UP EASILY
  async navigateToNextPage(): Promise<boolean> {
    try {
      console.log('🧭 Starting PERSISTENT navigation to next page...');
      
      // First, scroll to ensure pagination area is visible
      console.log('📜 Scrolling to bottom to ensure pagination is visible...');
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      await this.delay(2000);
      
      // Enhanced strategies with more thorough searching
      const nextButtonStrategies = [
        // Strategy 1: Standard next button with comprehensive selectors
        (): HTMLButtonElement | null => {
          console.log('🔍 Strategy 1: Standard next button');
          const selectors = [
            'button[aria-label="Next"]:not([disabled]):not([aria-disabled="true"])',
            'button[aria-label="Next page"]:not([disabled]):not([aria-disabled="true"])', 
            '.artdeco-pagination__button--next:not([disabled]):not([aria-disabled="true"])',
            '.artdeco-pagination__button.artdeco-pagination__button--next:not([disabled])',
            'button[data-test-pagination-page-btn="next"]:not([disabled])',
            '.pv-search-results-base__next-button:not([disabled])',
            'button.artdeco-button[aria-label*="Next"]:not([disabled])',
            '.artdeco-pagination li:last-child button:not([disabled]):not([aria-disabled="true"])'
          ];
          
          for (const selector of selectors) {
            const buttons = document.querySelectorAll(selector);
            for (const button of buttons) {
              const btn = button as HTMLButtonElement;
              if (btn && 
                  btn.offsetParent !== null && 
                  btn.offsetWidth > 0 && 
                  btn.offsetHeight > 0 &&
                  !btn.disabled &&
                  btn.getAttribute('aria-disabled') !== 'true') {
                console.log(`✅ Found next button with selector: ${selector}`);
                return btn;
              }
            }
          }
          return null;
        },
        
        // Strategy 2: Pagination number buttons - MORE THOROUGH
        (): HTMLButtonElement | null => {
          console.log('🔍 Strategy 2: Pagination number buttons');
          
          // First try to find current page
          const currentPageSelectors = [
            'button[data-test-pagination-page-btn][aria-current="true"]',
            '.artdeco-pagination__button--active',
            'button[aria-current="true"]',
            '.artdeco-pagination .selected',
            '.artdeco-pagination .active'
          ];
          
          let currentPageButton: Element | null = null;
          let currentPageNum = 1;
          
          for (const selector of currentPageSelectors) {
            currentPageButton = document.querySelector(selector);
            if (currentPageButton) {
              currentPageNum = parseInt(currentPageButton.textContent?.trim() || '1');
              console.log(`📍 Found current page: ${currentPageNum} using ${selector}`);
              break;
            }
          }
          
          // If no current page button found, try URL
          if (!currentPageButton) {
            const urlMatch = window.location.href.match(/[&?]page=(\d+)/);
            if (urlMatch) {
              currentPageNum = parseInt(urlMatch[1]);
              console.log(`📍 Current page from URL: ${currentPageNum}`);
            }
          }
          
          // Now find next page button
          const paginationSelectors = [
            'button[data-test-pagination-page-btn]:not([disabled]):not([aria-disabled="true"])',
            '.artdeco-pagination button:not([disabled])',
            '.artdeco-pagination__button:not([disabled])'
          ];
          
          for (const selector of paginationSelectors) {
            const buttons = document.querySelectorAll(selector);
            for (const btn of buttons) {
              const pageText = btn.textContent?.trim();
              const pageNum = parseInt(pageText || '0');
              
              if (!isNaN(pageNum) && pageNum === currentPageNum + 1) {
                const button = btn as HTMLButtonElement;
                if (button.offsetParent !== null && !button.disabled) {
                  console.log(`✅ Found next page button: ${pageNum}`);
                  return button;
                }
              }
            }
          }
          
          return null;
        },
        
        // Strategy 3: Show more/Load more with comprehensive search
        (): HTMLButtonElement | null => {
          console.log('🔍 Strategy 3: Show more/Load more buttons');
          
          const showMoreSelectors = [
            '.scaffold-finite-scroll__load-button:not([disabled])',
            'button[data-test-finite-scroll-show-more]:not([disabled])',
            '.search-results__pagination-show-more:not([disabled])'
          ];
          
          for (const selector of showMoreSelectors) {
            const button = document.querySelector(selector) as HTMLButtonElement;
            if (button && 
                button.offsetParent !== null && 
                !button.disabled &&
                button.offsetWidth > 0 && 
                button.offsetHeight > 0) {
              console.log(`✅ Found show more button with: ${selector}`);
              return button;
            }
          }
          
          // Also look for buttons containing "more" text
          const allButtons = document.querySelectorAll('button:not([disabled])');
          for (const btn of allButtons) {
            const text = btn.textContent?.toLowerCase().trim() || '';
            if ((text.includes('see more') || text.includes('show more') || text.includes('load more')) &&
                (btn as HTMLElement).offsetParent !== null &&
                !(btn as HTMLButtonElement).disabled) {
              console.log(`✅ Found show more button by text: "${btn.textContent?.trim()}"`);
              return btn as HTMLButtonElement;
            }
          }
          
          return null;
        },
        
        // Strategy 4: Alternative pagination patterns
        (): HTMLButtonElement | null => {
          console.log('🔍 Strategy 4: Alternative pagination patterns');
          
          // Look for any button with "next" in text content
          const allButtons = document.querySelectorAll('button:not([disabled])');
          for (const btn of allButtons) {
            const text = btn.textContent?.toLowerCase().trim() || '';
            const ariaLabel = btn.getAttribute('aria-label')?.toLowerCase() || '';
            
            if ((text.includes('next') || ariaLabel.includes('next') || text === '>' || text === '→') &&
                (btn as HTMLElement).offsetParent !== null &&
                !(btn as HTMLButtonElement).disabled) {
              console.log(`✅ Found alternative next button: "${btn.textContent?.trim()}" / "${ariaLabel}"`);
              return btn as HTMLButtonElement;
            }
          }
          
          return null;
        },
        
        // Strategy 5: DESPERATE SEARCH - any clickable pagination element
        (): HTMLButtonElement | null => {
          console.log('🔍 Strategy 5: Desperate search for any pagination');
          
          const paginationContainers = document.querySelectorAll('.artdeco-pagination, .pagination, [class*="pagination"]');
          for (const container of paginationContainers) {
            const clickables = container.querySelectorAll('button:not([disabled]), a:not([disabled])');
            
            for (const clickable of clickables) {
              const element = clickable as HTMLElement;
              if (element.offsetParent !== null &&
                  element.offsetWidth > 0 &&
                  element.offsetHeight > 0 &&
                  !element.hasAttribute('disabled')) {
                
                const text = element.textContent?.trim() || '';
                const ariaLabel = element.getAttribute('aria-label') || '';
                
                // Skip if it's clearly a "previous" or current page indicator
                if (text.toLowerCase().includes('previous') || 
                    text.toLowerCase().includes('prev') ||
                    ariaLabel.toLowerCase().includes('previous') ||
                    element.getAttribute('aria-current') === 'true') {
                  continue;
                }
                
                console.log(`🆘 DESPERATE: Found potential pagination element: "${text}" / "${ariaLabel}"`);
                return element as HTMLButtonElement;
              }
            }
          }
          
          return null;
        }
      ];

      let nextButton: HTMLButtonElement | null = null;
      let strategyUsed = '';

      // Try each strategy with persistence
      for (let i = 0; i < nextButtonStrategies.length; i++) {
        console.log(`\n🔄 Trying navigation strategy ${i + 1}/${nextButtonStrategies.length}`);
        
        nextButton = nextButtonStrategies[i]();
        if (nextButton) {
          strategyUsed = `Strategy ${i + 1}`;
          break;
        } else {
          console.log(`❌ Strategy ${i + 1} failed to find button`);
        }
        
        // Wait between strategies to let page settle
        if (i < nextButtonStrategies.length - 1) {
          await this.delay(1000);
        }
      }

      if (!nextButton) {
        console.error('💥 NO NEXT BUTTON FOUND AFTER ALL STRATEGIES');
        this.logPaginationDebugInfo();
        
        // Last resort: try to manually construct next page URL
        const currentUrl = window.location.href;
        const currentPageMatch = currentUrl.match(/[&?]page=(\d+)/);
        
        if (currentPageMatch) {
          const currentPage = parseInt(currentPageMatch[1]);
          const nextPageUrl = currentUrl.replace(/([&?])page=\d+/, `$1page=${currentPage + 1}`);
          console.log(`🆘 LAST RESORT: Trying direct URL navigation to: ${nextPageUrl}`);
          
          window.location.href = nextPageUrl;
          await this.delay(5000); // Wait for navigation
          return true; // Assume success, will be verified by caller
        }
        
        return false;
      }

      console.log(`✅ Found next button using ${strategyUsed}:`, {
        element: nextButton,
        text: nextButton.textContent?.trim(),
        ariaLabel: nextButton.getAttribute('aria-label'),
        disabled: nextButton.disabled,
        visible: nextButton.offsetParent !== null
      });

      // Enhanced clicking with multiple methods and verification
      console.log('🖱️ Attempting to click next button...');
      
      // Scroll to button first
      nextButton.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
      await this.delay(1500);
      
      // Store current URL to verify navigation
      const currentUrl = window.location.href;
      const currentPageNum = this.getCurrentPage();
      
      // Try multiple click methods
      const clickMethods = [
        () => {
          console.log('🖱️ Method 1: Standard click');
          nextButton!.click();
        },
        () => {
          console.log('🖱️ Method 2: Programmatic click with focus');
          nextButton!.focus();
          nextButton!.click();
        },
        () => {
          console.log('🖱️ Method 3: MouseEvent dispatch');
          const clickEvent = new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            view: window,
            button: 0,
            buttons: 1
          });
          nextButton!.dispatchEvent(clickEvent);
        },
        () => {
          console.log('🖱️ Method 4: Multiple event dispatch');
          ['mousedown', 'mouseup', 'click'].forEach(eventType => {
            nextButton!.dispatchEvent(new MouseEvent(eventType, {
              bubbles: true,
              cancelable: true,
              view: window
            }));
          });
        }
      ];
      
      let clickSuccessful = false;
      
      for (let i = 0; i < clickMethods.length; i++) {
        try {
          clickMethods[i]();
          console.log(`✅ Click method ${i + 1} executed`);
          
          // Wait and check for navigation
          await this.delay(3000);
          
          const newUrl = window.location.href;
          const newPageNum = this.getCurrentPage();
          
          // Check if navigation occurred
          if (newUrl !== currentUrl || newPageNum > currentPageNum) {
            console.log(`✅ Navigation successful! URL changed or page number increased`);
            console.log(`📊 Old page: ${currentPageNum}, New page: ${newPageNum}`);
            clickSuccessful = true;
            break;
          } else {
            console.log(`⏳ No navigation detected yet with method ${i + 1}, trying next method...`);
          }
          
        } catch (error) {
          console.warn(`⚠️ Click method ${i + 1} failed:`, error);
        }
        
        // Don't wait between methods if this is the last one
        if (i < clickMethods.length - 1) {
          await this.delay(1000);
        }
      }
      
      if (!clickSuccessful) {
        console.warn('⚠️ All click methods tried, waiting longer for potential delayed navigation...');
        await this.delay(5000); // Longer wait for delayed navigation
        
        const finalUrl = window.location.href;
        const finalPageNum = this.getCurrentPage();
        
        if (finalUrl !== currentUrl || finalPageNum > currentPageNum) {
          console.log(`✅ Delayed navigation detected! Page changed from ${currentPageNum} to ${finalPageNum}`);
          clickSuccessful = true;
        }
      }
      
      if (clickSuccessful) {
        // Wait for new page to fully load
        console.log('⏳ Waiting for new page to fully load...');
        await this.waitForPageLoad();
        
        // Final verification
        const verificationPageNum = this.getCurrentPage();
        console.log(`🎯 Final verification: Page number is ${verificationPageNum}`);
        
        return true;
      } else {
        console.error('💥 All click attempts failed - no navigation detected');
        return false;
      }

    } catch (error) {
      console.error('💥 Critical navigation error:', error);
      return false;
    }
  }

  // Enhanced debugging with comprehensive pagination analysis
  private logPaginationDebugInfo(): void {
    console.log('\n🔧 === COMPREHENSIVE PAGINATION DEBUG INFO ===');
    
    // 1. Check pagination containers
    const paginationContainers = document.querySelectorAll('.artdeco-pagination, .pv-search-results-base__pagination, [class*="pagination"]');
    console.log(`📦 Found ${paginationContainers.length} pagination containers:`);
    
    paginationContainers.forEach((container, index) => {
      console.log(`Container ${index}:`, {
        className: container.className,
        visible: container.getBoundingClientRect().width > 0,
        innerHTML: container.innerHTML.substring(0, 200) + '...'
      });
    });
    
    // 2. Check all buttons in pagination areas
    const allPaginationButtons = document.querySelectorAll('.artdeco-pagination button, [class*="pagination"] button, button[data-test-pagination-page-btn]');
    console.log(`🔘 Found ${allPaginationButtons.length} pagination buttons:`);
    
    allPaginationButtons.forEach((btn, index) => {
      const button = btn as HTMLButtonElement;
      console.log(`Button ${index}:`, {
        text: button.textContent?.trim(),
        ariaLabel: button.getAttribute('aria-label'),
        disabled: button.disabled,
        ariaDisabled: button.getAttribute('aria-disabled'),
        visible: button.offsetParent !== null,
        className: button.className,
        dataAttributes: Array.from(button.attributes).filter(attr => attr.name.startsWith('data-')).map(attr => `${attr.name}="${attr.value}"`)
      });
    });
    
    // 3. Check current page indicators
    const currentPageIndicators = document.querySelectorAll('button[aria-current="true"], .artdeco-pagination__button--active, [class*="active"]');
    console.log(`📍 Found ${currentPageIndicators.length} current page indicators:`);
    
    currentPageIndicators.forEach((indicator, index) => {
      console.log(`Current page ${index}:`, {
        text: indicator.textContent?.trim(),
        className: indicator.className,
        ariaCurrent: indicator.getAttribute('aria-current')
      });
    });
    
    // 4. Check URL parameters
    const url = new URL(window.location.href);
    const pageParam = url.searchParams.get('page');
    const startParam = url.searchParams.get('start');
    console.log(`🔗 URL parameters:`, { page: pageParam, start: startParam, fullUrl: window.location.href });
    
    // 5. Check for infinite scroll elements
    const infiniteScrollElements = document.querySelectorAll('.scaffold-finite-scroll__load-button, button[data-test-finite-scroll-show-more], [class*="load-more"]');
    console.log(`♾️ Found ${infiniteScrollElements.length} infinite scroll elements:`);
    
    infiniteScrollElements.forEach((element, index) => {
      const el = element as HTMLElement;
      console.log(`Infinite scroll ${index}:`, {
        text: el.textContent?.trim(),
        disabled: el.hasAttribute('disabled'),
        visible: el.offsetParent !== null,
        className: el.className
      });
    });
    
    // 6. Check for end-of-results indicators
    const endIndicators = document.querySelectorAll('.search-results__no-more-results, .search-no-results, [data-test-no-more-results], .artdeco-empty-state');
    console.log(`🏁 Found ${endIndicators.length} end-of-results indicators:`);
    
    endIndicators.forEach((indicator, index) => {
      console.log(`End indicator ${index}:`, {
        text: indicator.textContent?.trim(),
        className: indicator.className,
        visible: indicator.getBoundingClientRect().width > 0
      });
    });
    
    // 7. Check search results count
    const searchResults = document.querySelectorAll('.reusable-search__result-container, .entity-result');
    console.log(`📊 Current page has ${searchResults.length} search results`);
    
    // 8. Check for loading states
    const loadingElements = document.querySelectorAll('.artdeco-spinner, .loading-state, [aria-label="Loading"]');
    console.log(`⏳ Found ${loadingElements.length} loading indicators (should be 0 for stable page)`);
    
    console.log('🔧 === END PAGINATION DEBUG INFO ===\n');
  }

  // Enhanced page load waiting with better detection
  private async waitForPageLoad(): Promise<void> {
    return new Promise((resolve) => {
      console.log('⏳ Starting enhanced page load detection...');
      let attempts = 0;
      const maxAttempts = 50; // 25 seconds maximum
      let lastResultCount = 0;
      let stableResultsCount = 0;
      
      const checkPageLoad = () => {
        attempts++;
        
        // Multiple indicators of page readiness
        const searchResults = document.querySelectorAll('.reusable-search__result-container, .entity-result');
        const loadingIndicators = document.querySelectorAll(
          '.artdeco-spinner, .loading-state, [aria-label="Loading"], .search-results-loader'
        );
        const readyState = document.readyState === 'complete';
        
        // Check for stable results (important for dynamic loading)
        const currentResultCount = searchResults.length;
        if (currentResultCount === lastResultCount && currentResultCount > 0) {
          stableResultsCount++;
        } else {
          stableResultsCount = 0;
          lastResultCount = currentResultCount;
        }
        
        const hasResults = searchResults.length > 0;
        const noSpinners = loadingIndicators.length === 0;
        const stableResults = stableResultsCount >= 3; // Results haven't changed for 3 checks
        
        const isLoaded = hasResults && noSpinners && readyState && stableResults;
        
        if (attempts % 10 === 0) { // Log every 5 seconds
          console.log(`📊 Page load check ${attempts}/${maxAttempts}: Results=${currentResultCount}, Spinners=${loadingIndicators.length}, Ready=${readyState}, Stable=${stableResults}`);
        }
        
        if (isLoaded) {
          console.log(`✅ Page loaded successfully after ${attempts * 500}ms with ${currentResultCount} results`);
          resolve();
          return;
        }
        
        if (attempts >= maxAttempts) {
          console.log(`⚠️ Page load timeout reached after ${attempts * 500}ms. Results: ${currentResultCount}, Spinners: ${loadingIndicators.length}`);
          resolve(); // Resolve anyway to continue
          return;
        }
        
        setTimeout(checkPageLoad, 500);
      };
      
      // Start checking after initial delay
      setTimeout(checkPageLoad, 1000);
    });
  }

  // Utility delay function
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Get current page number with multiple strategies
  getCurrentPage(): number {
    try {
      // Strategy 1: Active pagination button
      const activePageButton = document.querySelector('.artdeco-pagination__button--active, button[aria-current="true"][data-test-pagination-page-btn]');
      if (activePageButton) {
        const pageNum = parseInt(activePageButton.textContent?.trim() || '1');
        if (!isNaN(pageNum)) {
          return pageNum;
        }
      }

      // Strategy 2: URL parameter
      const urlMatch = window.location.href.match(/[&?]page=(\d+)/);
      if (urlMatch) {
        return parseInt(urlMatch[1]);
      }

      // Strategy 3: Search parameter
      const searchParams = new URLSearchParams(window.location.search);
      const pageParam = searchParams.get('page');
      if (pageParam) {
        return parseInt(pageParam);
      }

      return 1;
    } catch (error) {
      console.warn('Error getting current page:', error);
      return 1;
    }
  }

  // Enhanced end of results detection with multiple indicators
  isEndOfResults(): boolean {
    console.log('🔍 Checking if we have reached end of results...');
    
    // Multiple strategies to detect end of results
    const endStrategies = [
      // Strategy 1: Look for explicit end-of-results messages
      () => {
        const endMessages = [
          '.search-results__no-more-results',
          '.search-no-results', 
          '[data-test-no-more-results]',
          '.artdeco-empty-state',
          '.search-results-container__no-results',
          '.search-null-state'
        ];
        
        for (const selector of endMessages) {
          const element = document.querySelector(selector);
          if (element && (element as HTMLElement).offsetParent !== null) {
            console.log(`✅ End message found with selector: ${selector}`);
            return true;
          }
        }
        return false;
      },
      
      // Strategy 2: Check if ALL next buttons are disabled
      () => {
        const nextSelectors = [
          'button[aria-label="Next"]',
          'button[aria-label="Next page"]',
          '.artdeco-pagination__button--next'
        ];
        
        let foundNextButton = false;
        for (const selector of nextSelectors) {
          const buttons = document.querySelectorAll(selector);
          for (const button of buttons) {
            foundNextButton = true;
            const btn = button as HTMLButtonElement;
            if (!btn.disabled && btn.getAttribute('aria-disabled') !== 'true' && btn.offsetParent !== null) {
              console.log(`❌ Found active next button: ${selector}`);
              return false; // Found an active next button
            }
          }
        }
        
        if (foundNextButton) {
          console.log(`✅ All next buttons are disabled`);
          return true;
        }
        return false;
      },
      
      // Strategy 3: Check pagination structure
      () => {
        const currentPageButton = document.querySelector('button[data-test-pagination-page-btn][aria-current="true"]');
        if (!currentPageButton) return false;
        
        const allPageButtons = document.querySelectorAll('button[data-test-pagination-page-btn]:not([disabled])');
        const currentPageNum = parseInt(currentPageButton.textContent || '1');
        
        let hasHigherPageNumber = false;
        for (const btn of allPageButtons) {
          const pageNum = parseInt(btn.textContent || '0');
          if (pageNum > currentPageNum) {
            hasHigherPageNumber = true;
            break;
          }
        }
        
        if (!hasHigherPageNumber) {
          console.log(`✅ No higher page numbers available. Current page: ${currentPageNum}`);
          return true;
        }
        return false;
      },
      
      // Strategy 4: Check for "Show more" exhaustion
      () => {
        const showMoreButtons = document.querySelectorAll('.scaffold-finite-scroll__load-button, button[data-test-finite-scroll-show-more]');
        
        for (const btn of showMoreButtons) {
          const button = btn as HTMLButtonElement;
          if (!button.disabled && button.offsetParent !== null) {
            console.log(`❌ Found active show more button`);
            return false;
          }
        }
        
        if (showMoreButtons.length > 0) {
          console.log(`✅ All show more buttons are disabled`);
          return true;
        }
        return false;
      }
    ];
    
    // Run all strategies
    for (let i = 0; i < endStrategies.length; i++) {
      if (endStrategies[i]()) {
        console.log(`🏁 End of results detected by strategy ${i + 1}`);
        return true;
      }
    }
    
    console.log(`🔄 End of results NOT detected - more pages may be available`);
    return false;
  }

  // Check if we're on a profile page
  isProfilePage(): boolean {
    return window.location.href.includes('/in/') && 
           !window.location.href.includes('/search/') &&
           !window.location.href.includes('/company/');
  }

  // Check if we're on a search results page
  isSearchPage(): boolean {
    return window.location.href.includes('/search/results/people/') ||
           window.location.href.includes('/search/results/all/');
  }
}

// Initialize scraper
const scraper = new LinkedInScraper();

// Enhanced message listener with proper typing
chrome.runtime.onMessage.addListener((request: any, sender: chrome.runtime.MessageSender, sendResponse: (response: any) => void) => {
  console.log('Content script received message:', request);

  const handleMessage = async (): Promise<MessageResponse | any> => {
    try {
      switch (request.action) {
        case 'GET_PAGE_INFO':
          return {
            success: true,
            data: {
              isProfile: scraper.isProfilePage(),
              isSearch: scraper.isSearchPage(),
              currentPage: scraper.getCurrentPage(),
              url: window.location.href,
              isLoaded: scraper.isPageLoaded()
            }
          };

        case 'CHECK_PAGE_LOADED':
          return {
            success: true,
            data: { loaded: scraper.isPageLoaded() }
          };

        case 'CHECK_END_OF_RESULTS':
          return {
            success: true,
            data: { isEndOfResults: scraper.isEndOfResults() }
          };

        case 'GET_CURRENT_PAGE_NUMBER':
          return {
            success: true,
            data: { pageNumber: scraper.getCurrentPage() }
          };

        case 'EXTRACT_PROFILE':
          if (scraper.isProfilePage()) {
            const profileData = scraper.extractProfileDetails();
            return { success: true, data: profileData };
          } else {
            return { success: false, error: 'Not a profile page' };
          }

        case 'EXTRACT_SEARCH_RESULTS':
          if (scraper.isSearchPage()) {
            const searchResults = scraper.extractSearchResults();
            const currentPage = scraper.getCurrentPage();
            return { 
              success: true, 
              data: { 
                results: searchResults, 
                currentPage,
                totalResults: searchResults.length 
              } 
            };
          } else {
            return { success: false, error: 'Not a search results page' };
          }

        case 'NAVIGATE_NEXT_PAGE':
          console.log('Received NAVIGATE_NEXT_PAGE request');
          const navigationSuccess = await scraper.navigateToNextPage();
          return { 
            success: navigationSuccess, 
            message: navigationSuccess ? 'Navigation successful' : 'Navigation failed',
            currentPage: scraper.getCurrentPage() 
          };

        case 'SCRAPE_PROFILES':
          // Legacy support - same as EXTRACT_SEARCH_RESULTS
          if (scraper.isSearchPage()) {
            const profiles = scraper.extractSearchResults();
            return profiles;
          } else {
            return [];
          }

        default:
          console.warn('Unknown action:', request.action);
          return { success: false, error: 'Unknown action: ' + request.action };
      }
    } catch (error) {
      console.error(`Content script error for action ${request.action}:`, error);
      const errorMsg = error instanceof Error ? error.message : String(error);
      return { success: false, error: `Failed to ${request.action}: ${errorMsg}` };
    }
  };

  // Execute async handler
  handleMessage()
    .then(response => {
      console.log('Sending response:', response);
      if (sendResponse) {
        sendResponse(response);
      }
    })
    .catch(error => {
      console.error('Message handler error:', error);
      if (sendResponse) {
        sendResponse({ success: false, error: error.message });
      }
    });

  return true; // Keep the message channel open for async responses
});

// Auto-detect page type and send ready signal
setTimeout(() => {
  const pageType = scraper.isProfilePage() ? 'profile' : 
                   scraper.isSearchPage() ? 'search' : 'unknown';
  
  console.log(`Page detected as: ${pageType} on ${window.location.href}`);
  
  chrome.runtime.sendMessage({
    action: 'PAGE_READY',
    pageType,
    url: window.location.href,
    isLoaded: scraper.isPageLoaded()
  }).catch(error => {
    console.log('Could not send PAGE_READY message:', error);
  });
}, 1500);

// Add page change detection
let currentUrl = window.location.href;
const observer = new MutationObserver(() => {
  if (window.location.href !== currentUrl) {
    currentUrl = window.location.href;
    console.log('URL changed to:', currentUrl);
    
    // Wait a bit for the page to stabilize, then send ready signal
    setTimeout(() => {
      const pageType = scraper.isProfilePage() ? 'profile' : 
                       scraper.isSearchPage() ? 'search' : 'unknown';
      
      chrome.runtime.sendMessage({
        action: 'PAGE_READY',
        pageType,
        url: window.location.href,
        isLoaded: scraper.isPageLoaded()
      }).catch(error => {
        console.log('Could not send PAGE_READY message:', error);
      });
    }, 2000);
  }
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});
