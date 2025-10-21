/**
 * Profile Fetcher Module
 * Fetches profile data from Google Cloud Skills Boost public profiles
 */

const axios = require('axios');
const cheerio = require('cheerio');

class ProfileFetcher {
    constructor() {
        // Configure axios with reasonable defaults
        this.httpClient = axios.create({
            timeout: 30000, // 30 second timeout
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
    }

    /**
     * Validate and normalize profile URL
     * @param {string} profileUrl - The profile URL to validate
     * @returns {string|null} Normalized URL or null if invalid
     */
    validateProfileUrl(profileUrl) {
        try {
            const urlPattern = /(?:https?:\/\/)?(?:www\.)?cloudskillsboost\.google\/public_profiles\/([a-zA-Z0-9\-_]+)/i;
            const match = profileUrl.match(urlPattern);
            
            if (match) {
                return `https://www.cloudskillsboost.google/public_profiles/${match[1]}`;
            }
            
            return null;
        } catch (error) {
            console.error('Error validating profile URL:', error);
            return null;
        }
    }

    /**
     * Fetch raw HTML content from profile URL
     * @param {string} profileUrl - The profile URL to fetch
     * @returns {Promise<string>} Raw HTML content
     */
    async fetchRawProfile(profileUrl) {
        try {
            const normalizedUrl = this.validateProfileUrl(profileUrl);
            if (!normalizedUrl) {
                throw new Error('Invalid profile URL format');
            }

            console.log(`Fetching profile: ${normalizedUrl}`);
            
            // Track if we were redirected
            let wasRedirected = false;
            let finalUrl = normalizedUrl;
            
            const response = await this.httpClient.get(normalizedUrl, {
                maxRedirects: 5,
                validateStatus: function (status) {
                    return status >= 200 && status < 400; // Accept redirects
                },
                // Track redirects using interceptors
                beforeRedirect: (options, { headers }) => {
                    wasRedirected = true;
                    finalUrl = options.href || options.url;
                }
            });
            
            // Also check the final URL from the request
            if (response.request && response.request.res && response.request.res.responseUrl) {
                finalUrl = response.request.res.responseUrl;
                if (finalUrl !== normalizedUrl) {
                    wasRedirected = true;
                }
            }
            
            // Check if we were redirected to the homepage (indicates private profile)
            if (wasRedirected) {
                if (finalUrl.includes('cloudskillsboost.google/') && !finalUrl.includes('public_profiles')) {
                    console.log(`  🔒 Profile redirected from ${normalizedUrl} to ${finalUrl} - PRIVATE`);
                    throw new Error('PROFILE_PRIVATE: Redirected to homepage');
                }
            }
            
            if (response.status !== 200) {
                throw new Error(`HTTP ${response.status}: Failed to fetch profile`);
            }

            if (!response.data) {
                throw new Error('Empty response received');
            }

            return response.data;

        } catch (error) {
            // Check if it's our private profile error
            if (error.message && error.message.includes('PROFILE_PRIVATE')) {
                throw error;
            }
            
            if (error.response) {
                // HTTP error response
                throw new Error(`HTTP ${error.response.status}: ${error.response.statusText}`);
            } else if (error.code === 'ENOTFOUND') {
                throw new Error('Network error: Could not connect to cloudskillsboost.google');
            } else if (error.code === 'ETIMEDOUT') {
                throw new Error('Request timeout: Profile took too long to load');
            } else {
                throw new Error(`Fetch error: ${error.message}`);
            }
        }
    }

    /**
     * Fetch and parse profile data
     * @param {string} profileUrl - The profile URL to fetch and parse
     * @returns {Promise<object>} Parsed profile data
     */
    async fetchProfile(profileUrl) {
        try {
            const htmlContent = await this.fetchRawProfile(profileUrl);
            const profileData = this.parseProfileHtml(htmlContent, profileUrl);
            
            // Add metadata
            profileData.fetchedAt = new Date().toISOString();
            profileData.profileUrl = this.validateProfileUrl(profileUrl);
            
            return profileData;

        } catch (error) {
            console.error('Error fetching profile:', error);
            throw error;
        }
    }

    /**
     * Parse HTML content to extract profile information
     * @param {string} htmlContent - Raw HTML content
     * @param {string} profileUrl - Original profile URL
     * @returns {object} Parsed profile data
     */
    parseProfileHtml(htmlContent, profileUrl) {
        try {
            const $ = cheerio.load(htmlContent);
            
            // Check if profile is private
            const isPrivate = this.checkIfPrivate($, htmlContent);
            if (isPrivate) {
                throw new Error('PROFILE_PRIVATE');
            }
            
            // Initialize result object
            const profileData = {
                profileUrl: profileUrl,
                userInfo: {
                    name: '',
                    location: '',
                    joinDate: ''
                },
                badges: [],
                games: [],
                stats: {
                    totalBadges: 0,
                    totalGames: 0,
                    completedBadges: 0,
                    completedGames: 0
                },
                rawHtml: htmlContent // Store for debugging if needed
            };

            // Extract user information
            this.extractUserInfo($, profileData);
            
            // Extract badges
            this.extractBadges($, profileData);
            
            // Extract games/quests
            this.extractGames($, profileData);
            
            // Calculate statistics
            this.calculateStats(profileData);

            return profileData;

        } catch (error) {
            console.error('Error parsing profile HTML:', error);
            throw error;
        }
    }

    /**
     * Check if profile is private
     * @param {object} $ - Cheerio instance
     * @param {string} htmlContent - Raw HTML content
     * @returns {boolean} True if profile is private
     */
    checkIfPrivate($, htmlContent) {
        // Check for common indicators of a private profile
        
        // 1. Check for private profile message
        const privateMessages = [
            'This profile is private',
            'profile is not public',
            'Profile not available',
            'This user has made their profile private',
            'private profile',
            'Sorry, access denied to this resource',
            'access denied',
            'Please sign in to access this content'
        ];
        
        const bodyText = $('body').text().toLowerCase();
        for (const message of privateMessages) {
            if (bodyText.includes(message.toLowerCase())) {
                return true;
            }
        }
        
        // 2. Check if there's a privacy indicator element
        const privateIndicators = [
            '.private-profile',
            '.profile-private',
            '[data-private="true"]',
            '.privacy-message'
        ];
        
        for (const selector of privateIndicators) {
            if ($(selector).length > 0) {
                return true;
            }
        }
        
        // 3. Check if profile has no badges and no games but shows profile structure
        // (could indicate private profile with hidden content)
        const hasBadgeSection = $('.profile-badge').length > 0 || $('[class*="badge"]').length > 0;
        const hasName = $('.profile-name, .user-name, h1').first().text().trim().length > 0;
        
        // If there's a name but absolutely no badge-related elements, might be private
        // However, this is a weak indicator, so we only use it in combination with other checks
        
        // 4. Check for redirect or error page
        const pageTitle = $('title').text().toLowerCase();
        if (pageTitle.includes('error') || pageTitle.includes('not found') || pageTitle.includes('private')) {
            return true;
        }
        
        return false;
    }

    /**
     * Extract user information from parsed HTML
     * @param {object} $ - Cheerio instance
     * @param {object} profileData - Profile data object to populate
     */
    extractUserInfo($, profileData) {
        try {
            // Extract user name - try multiple selectors
            const nameSelectors = [
                '.profile-name',
                '.user-name',
                'h1',
                '.profile-header h1',
                '[data-testid="profile-name"]'
            ];
            
            for (const selector of nameSelectors) {
                const name = $(selector).first().text().trim();
                if (name) {
                    profileData.userInfo.name = name;
                    break;
                }
            }

            // Extract location if available
            const locationSelectors = [
                '.profile-location',
                '.user-location',
                '[data-testid="profile-location"]'
            ];
            
            for (const selector of locationSelectors) {
                const location = $(selector).first().text().trim();
                if (location) {
                    profileData.userInfo.location = location;
                    break;
                }
            }

            // Extract join date if available
            const joinDateSelectors = [
                '.join-date',
                '.member-since',
                '[data-testid="join-date"]'
            ];
            
            for (const selector of joinDateSelectors) {
                const joinDate = $(selector).first().text().trim();
                if (joinDate) {
                    profileData.userInfo.joinDate = joinDate;
                    break;
                }
            }

        } catch (error) {
            console.error('Error extracting user info:', error);
        }
    }

    /**
     * Extract badges from parsed HTML
     * @param {object} $ - Cheerio instance
     * @param {object} profileData - Profile data object to populate
     */
    extractBadges($, profileData) {
        try {
            const badges = [];
            const gameModalIds = new Set(); // Track which modals are for games
            
            // First pass: identify game modals
            $('.profile-badge').each((index, element) => {
                const $badge = $(element);
                const modalId = $badge.find('ql-button').attr('modal');
                
                if (modalId) {
                    const $dialog = $(`#${modalId}`);
                    if ($dialog.length > 0) {
                        const dialogButton = $dialog.find('ql-button[href]');
                        const href = dialogButton.attr('href') || '';
                        
                        if (href.includes('/games/')) {
                            gameModalIds.add(modalId);
                        }
                    }
                }
            });
            
            // Second pass: extract only non-game badges
            $('.profile-badge').each((index, element) => {
                const $badge = $(element);
                const modalId = $badge.find('ql-button').attr('modal');
                
                // Skip if this is a game (will be extracted in extractGames)
                if (gameModalIds.has(modalId)) {
                    return; // Skip this badge, it's actually a game
                }
                
                // Extract badge title
                const title = $badge.find('.ql-title-medium').first().text().trim();
                
                // Extract earned date
                const earnedText = $badge.find('.ql-body-medium').first().text().trim();
                
                // Extract badge URL
                const badgeUrl = $badge.find('.badge-image').attr('href') || '';
                
                // Extract image URL
                const imageUrl = $badge.find('.badge-image img').attr('src') || '';
                
                if (title) {
                    const badge = {
                        title: title,
                        originalTitle: title,
                        description: '',
                        earnedDate: earnedText,
                        isCompleted: earnedText.toLowerCase().includes('earned'),
                        imageUrl: imageUrl,
                        badgeUrl: badgeUrl ? `https://www.cloudskillsboost.google${badgeUrl}` : '',
                        url: badgeUrl
                    };
                    
                    badges.push(badge);
                }
            });

            profileData.badges = badges;
            console.log(`✅ Found ${badges.length} badges`);

        } catch (error) {
            console.error('Error extracting badges:', error);
        }
    }

    /**
     * Extract individual badge information
     * @param {object} $ - Cheerio instance
     * @param {object} $element - Badge element
     * @returns {object} Badge information
     */
    extractBadgeInfo($, $element) {
        try {
            const badge = {
                title: '',
                description: '',
                earnedDate: '',
                isCompleted: false,
                imageUrl: '',
                badgeUrl: ''
            };

            // Extract title
            const titleSelectors = ['.badge-title', '.title', 'h3', 'h4', '.name'];
            for (const selector of titleSelectors) {
                const title = $element.find(selector).first().text().trim();
                if (title) {
                    badge.title = title;
                    break;
                }
            }

            // Extract description
            const descSelectors = ['.badge-description', '.description', '.desc', 'p'];
            for (const selector of descSelectors) {
                const desc = $element.find(selector).first().text().trim();
                if (desc) {
                    badge.description = desc;
                    break;
                }
            }

            // Check if completed (look for completion indicators)
            const completionIndicators = [
                '.completed',
                '.earned',
                '.badge-earned',
                '[data-completed="true"]'
            ];
            
            badge.isCompleted = completionIndicators.some(selector => 
                $element.find(selector).length > 0 || $element.is(selector)
            );

            // Extract image URL
            const img = $element.find('img').first();
            if (img.length) {
                badge.imageUrl = img.attr('src') || '';
            }

            // Extract badge URL
            const link = $element.find('a').first();
            if (link.length) {
                badge.badgeUrl = link.attr('href') || '';
            }

            return badge;

        } catch (error) {
            console.error('Error extracting badge info:', error);
            return null;
        }
    }

    /**
     * Extract games/quests from parsed HTML
     * @param {object} $ - Cheerio instance
     * @param {object} profileData - Profile data object to populate
     */
    extractGames($, profileData) {
        try {
            const games = [];
            
            // Games are identified by checking the modal dialogs
            // Each profile-badge has a modal attribute pointing to a dialog
            // The dialog contains the actual "Learn more" link which tells us if it's a game
            $('.profile-badge').each((index, element) => {
                const $badge = $(element);
                
                // Get the modal ID from the ql-button
                const modalId = $badge.find('ql-button').attr('modal');
                
                if (modalId) {
                    // Find the corresponding dialog
                    const $dialog = $(`#${modalId}`);
                    
                    if ($dialog.length > 0) {
                        // Check if the dialog's "Learn more" link contains /games/
                        const dialogButton = $dialog.find('ql-button[href]');
                        const href = dialogButton.attr('href') || '';
                        
                        if (href.includes('/games/')) {
                            // This is a game!
                            const title = $badge.find('.ql-title-medium').first().text().trim();
                            const earnedText = $badge.find('.ql-body-medium').first().text().trim();
                            const imageUrl = $badge.find('.badge-image img').attr('src') || '';
                            const badgeUrl = $badge.find('.badge-image').attr('href') || '';
                            
                            if (title) {
                                const game = {
                                    title: title,
                                    originalTitle: title,
                                    description: $dialog.find('p').first().text().trim(),
                                    completedDate: earnedText,
                                    isCompleted: earnedText.toLowerCase().includes('earned'),
                                    imageUrl: imageUrl,
                                    gameUrl: href ? `https://www.cloudskillsboost.google${href}` : '',
                                    url: href
                                };
                                
                                games.push(game);
                            }
                        }
                    }
                }
            });

            profileData.games = games;
            console.log(`✅ Found ${games.length} games`);

        } catch (error) {
            console.error('Error extracting games:', error);
        }
    }

    /**
     * Extract individual game information
     * @param {object} $ - Cheerio instance
     * @param {object} $element - Game element
     * @returns {object} Game information
     */
    extractGameInfo($, $element) {
        try {
            const game = {
                title: '',
                description: '',
                completedDate: '',
                isCompleted: false,
                imageUrl: '',
                gameUrl: '',
                points: 0
            };

            // Extract title
            const titleSelectors = ['.game-title', '.title', 'h3', 'h4', '.name'];
            for (const selector of titleSelectors) {
                const title = $element.find(selector).first().text().trim();
                if (title) {
                    game.title = title;
                    break;
                }
            }

            // Extract description
            const descSelectors = ['.game-description', '.description', '.desc', 'p'];
            for (const selector of descSelectors) {
                const desc = $element.find(selector).first().text().trim();
                if (desc) {
                    game.description = desc;
                    break;
                }
            }

            // Check if completed
            const completionIndicators = [
                '.completed',
                '.finished',
                '.game-completed',
                '[data-completed="true"]'
            ];
            
            game.isCompleted = completionIndicators.some(selector => 
                $element.find(selector).length > 0 || $element.is(selector)
            );

            // Extract image URL
            const img = $element.find('img').first();
            if (img.length) {
                game.imageUrl = img.attr('src') || '';
            }

            // Extract game URL
            const link = $element.find('a').first();
            if (link.length) {
                game.gameUrl = link.attr('href') || '';
            }

            return game;

        } catch (error) {
            console.error('Error extracting game info:', error);
            return null;
        }
    }

    /**
     * Calculate statistics from extracted data
     * @param {object} profileData - Profile data object
     */
    calculateStats(profileData) {
        try {
            profileData.stats = {
                totalBadges: profileData.badges.length,
                totalGames: profileData.games.length,
                completedBadges: profileData.badges.filter(badge => badge.isCompleted).length,
                completedGames: profileData.games.filter(game => game.isCompleted).length
            };
        } catch (error) {
            console.error('Error calculating stats:', error);
        }
    }
}

// Create singleton instance
const profileFetcher = new ProfileFetcher();

module.exports = {
    fetchProfile: (profileUrl) => profileFetcher.fetchProfile(profileUrl),
    validateProfileUrl: (profileUrl) => profileFetcher.validateProfileUrl(profileUrl),
    fetchRawProfile: (profileUrl) => profileFetcher.fetchRawProfile(profileUrl)
};