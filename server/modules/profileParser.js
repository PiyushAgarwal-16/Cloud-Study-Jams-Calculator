/**
 * Profile Parser Module
 * Parses and normalizes profile data from different sources
 */

class ProfileParser {
    constructor() {
        this.badgePatterns = this.initializeBadgePatterns();
        this.gamePatterns = this.initializeGamePatterns();
    }

    /**
     * Initialize badge name patterns for better matching
     */
    initializeBadgePatterns() {
        return {
            // Common badge name variations and their normalized forms
            'cloud-storage': [
                'cloud storage',
                'google cloud storage',
                'gcs',
                'storage'
            ],
            'compute-engine': [
                'compute engine',
                'google compute engine',
                'gce',
                'virtual machines'
            ],
            'kubernetes': [
                'kubernetes engine',
                'google kubernetes engine',
                'gke',
                'k8s',
                'kubernetes'
            ],
            'big-data': [
                'bigquery',
                'big query',
                'dataflow',
                'data flow',
                'big data'
            ],
            'machine-learning': [
                'machine learning',
                'ml',
                'ai platform',
                'vertex ai',
                'tensorflow'
            ]
        };
    }

    /**
     * Initialize game name patterns for better matching
     */
    initializeGamePatterns() {
        return {
            'cloud-quest': [
                'cloud quest',
                'quest',
                'google cloud quest'
            ],
            'arcade-game': [
                'arcade',
                'cloud arcade',
                'skill arcade'
            ],
            'challenge': [
                'challenge',
                'coding challenge',
                'cloud challenge'
            ]
        };
    }

    /**
     * Parse and normalize profile data
     * @param {object} rawProfileData - Raw profile data from fetcher
     * @returns {object} Parsed and normalized profile data
     */
    parseProfile(rawProfileData) {
        try {
            const parsed = {
                profileInfo: this.parseUserInfo(rawProfileData.userInfo || {}),
                badges: this.parseBadges(rawProfileData.badges || []),
                games: this.parseGames(rawProfileData.games || []),
                statistics: this.parseStatistics(rawProfileData.stats || {}),
                metadata: {
                    parsedAt: new Date().toISOString(),
                    sourceUrl: rawProfileData.profileUrl || '',
                    fetchedAt: rawProfileData.fetchedAt || ''
                }
            };

            // Add derived statistics
            parsed.derived = this.calculateDerivedStats(parsed);

            return parsed;

        } catch (error) {
            console.error('Error parsing profile:', error);
            throw new Error(`Profile parsing failed: ${error.message}`);
        }
    }

    /**
     * Parse and normalize user information
     * @param {object} userInfo - Raw user information
     * @returns {object} Normalized user information
     */
    parseUserInfo(userInfo) {
        return {
            name: this.cleanText(userInfo.name || 'Unknown User'),
            location: this.cleanText(userInfo.location || ''),
            joinDate: this.parseDate(userInfo.joinDate || ''),
            displayName: this.extractDisplayName(userInfo.name || '')
        };
    }

    /**
     * Parse and normalize badges array
     * @param {Array} badges - Raw badges array
     * @returns {Array} Normalized badges array
     */
    parseBadges(badges) {
        return badges.map(badge => this.normalizeBadge(badge))
                    .filter(badge => badge !== null)
                    .sort((a, b) => {
                        // Sort completed badges first, then by title
                        if (a.isCompleted !== b.isCompleted) {
                            return a.isCompleted ? -1 : 1;
                        }
                        return a.normalizedTitle.localeCompare(b.normalizedTitle);
                    });
    }

    /**
     * Parse and normalize games array
     * @param {Array} games - Raw games array
     * @returns {Array} Normalized games array
     */
    parseGames(games) {
        return games.map(game => this.normalizeGame(game))
                   .filter(game => game !== null)
                   .sort((a, b) => {
                       // Sort completed games first, then by title
                       if (a.isCompleted !== b.isCompleted) {
                           return a.isCompleted ? -1 : 1;
                       }
                       return a.normalizedTitle.localeCompare(b.normalizedTitle);
                   });
    }

    /**
     * Normalize individual badge data
     * @param {object} badge - Raw badge object
     * @returns {object|null} Normalized badge or null if invalid
     */
    normalizeBadge(badge) {
        try {
            if (!badge || !badge.title) {
                return null;
            }

            const normalizedTitle = this.normalizeTitle(badge.title);
            const category = this.categorizeBadge(normalizedTitle);

            return {
                originalTitle: badge.title,
                normalizedTitle: normalizedTitle,
                description: this.cleanText(badge.description || ''),
                category: category,
                isCompleted: Boolean(badge.isCompleted),
                earnedDate: this.parseDate(badge.earnedDate || ''),
                imageUrl: this.normalizeUrl(badge.imageUrl || ''),
                badgeUrl: this.normalizeUrl(badge.badgeUrl || ''),
                difficulty: this.assessDifficulty(badge.title, badge.description),
                tags: this.extractTags(badge.title, badge.description)
            };

        } catch (error) {
            console.error('Error normalizing badge:', error);
            return null;
        }
    }

    /**
     * Normalize individual game data
     * @param {object} game - Raw game object
     * @returns {object|null} Normalized game or null if invalid
     */
    normalizeGame(game) {
        try {
            if (!game || !game.title) {
                return null;
            }

            const normalizedTitle = this.normalizeTitle(game.title);
            const category = this.categorizeGame(normalizedTitle);

            return {
                originalTitle: game.title,
                normalizedTitle: normalizedTitle,
                description: this.cleanText(game.description || ''),
                category: category,
                isCompleted: Boolean(game.isCompleted),
                completedDate: this.parseDate(game.completedDate || ''),
                imageUrl: this.normalizeUrl(game.imageUrl || ''),
                gameUrl: this.normalizeUrl(game.gameUrl || ''),
                difficulty: this.assessDifficulty(game.title, game.description),
                estimatedPoints: game.points || 0,
                tags: this.extractTags(game.title, game.description)
            };

        } catch (error) {
            console.error('Error normalizing game:', error);
            return null;
        }
    }

    /**
     * Parse and normalize statistics
     * @param {object} stats - Raw statistics
     * @returns {object} Normalized statistics
     */
    parseStatistics(stats) {
        return {
            total: {
                badges: Number(stats.totalBadges || 0),
                games: Number(stats.totalGames || 0)
            },
            completed: {
                badges: Number(stats.completedBadges || 0),
                games: Number(stats.completedGames || 0)
            },
            completion: {
                badgePercentage: this.calculatePercentage(stats.completedBadges, stats.totalBadges),
                gamePercentage: this.calculatePercentage(stats.completedGames, stats.totalGames),
                overallPercentage: this.calculateOverallCompletion(stats)
            }
        };
    }

    /**
     * Calculate derived statistics
     * @param {object} parsed - Parsed profile data
     * @returns {object} Derived statistics
     */
    calculateDerivedStats(parsed) {
        const completedBadges = parsed.badges.filter(b => b.isCompleted);
        const completedGames = parsed.games.filter(g => g.isCompleted);

        return {
            categories: {
                badges: this.groupByCategory(parsed.badges),
                games: this.groupByCategory(parsed.games)
            },
            difficulty: {
                badges: this.groupByDifficulty(completedBadges),
                games: this.groupByDifficulty(completedGames)
            },
            recent: {
                badges: this.getRecentCompletions(completedBadges),
                games: this.getRecentCompletions(completedGames)
            },
            tags: this.getAllTags(parsed.badges, parsed.games)
        };
    }

    /**
     * Utility Methods
     */

    cleanText(text) {
        return text.trim()
                  .replace(/\s+/g, ' ')
                  .replace(/[^\w\s\-\.]/g, '')
                  .trim();
    }

    normalizeTitle(title) {
        return title.toLowerCase()
                   .trim()
                   .replace(/[^\w\s\-]/g, ' ')
                   .replace(/\s+/g, ' ')
                   .trim();
    }

    normalizeUrl(url) {
        if (!url) return '';
        
        try {
            // Handle relative URLs
            if (url.startsWith('/')) {
                return `https://www.cloudskillsboost.google${url}`;
            }
            
            // Return as-is if already absolute
            if (url.startsWith('http')) {
                return url;
            }
            
            return url;
        } catch (error) {
            return url;
        }
    }

    parseDate(dateString) {
        if (!dateString) return null;
        
        try {
            const date = new Date(dateString);
            return isNaN(date.getTime()) ? null : date.toISOString();
        } catch (error) {
            return null;
        }
    }

    extractDisplayName(fullName) {
        if (!fullName) return '';
        
        // Extract first name or return full name if short
        const parts = fullName.split(' ');
        return parts.length > 1 ? parts[0] : fullName;
    }

    categorizeBadge(normalizedTitle) {
        // Match against known patterns
        for (const [category, patterns] of Object.entries(this.badgePatterns)) {
            if (patterns.some(pattern => normalizedTitle.includes(pattern))) {
                return category;
            }
        }
        
        // Default categorization based on keywords
        if (normalizedTitle.includes('security')) return 'security';
        if (normalizedTitle.includes('network')) return 'networking';
        if (normalizedTitle.includes('data')) return 'data';
        if (normalizedTitle.includes('app')) return 'application';
        if (normalizedTitle.includes('dev')) return 'development';
        
        return 'general';
    }

    categorizeGame(normalizedTitle) {
        // Match against known patterns
        for (const [category, patterns] of Object.entries(this.gamePatterns)) {
            if (patterns.some(pattern => normalizedTitle.includes(pattern))) {
                return category;
            }
        }
        
        return 'general';
    }

    assessDifficulty(title, description) {
        const text = `${title} ${description}`.toLowerCase();
        
        if (text.includes('advanced') || text.includes('expert')) return 'advanced';
        if (text.includes('intermediate') || text.includes('professional')) return 'intermediate';
        if (text.includes('beginner') || text.includes('introduction') || text.includes('getting started')) return 'beginner';
        
        return 'intermediate'; // Default
    }

    extractTags(title, description) {
        const text = `${title} ${description}`.toLowerCase();
        const tags = [];
        
        // Technology tags
        const techKeywords = ['gcp', 'aws', 'azure', 'kubernetes', 'docker', 'terraform', 'python', 'java', 'go', 'nodejs'];
        techKeywords.forEach(tech => {
            if (text.includes(tech)) tags.push(tech);
        });
        
        // Service tags
        const serviceKeywords = ['compute', 'storage', 'database', 'networking', 'security', 'ml', 'ai', 'bigdata'];
        serviceKeywords.forEach(service => {
            if (text.includes(service)) tags.push(service);
        });
        
        return [...new Set(tags)]; // Remove duplicates
    }

    calculatePercentage(completed, total) {
        if (!total || total === 0) return 0;
        return Math.round((completed / total) * 100);
    }

    calculateOverallCompletion(stats) {
        const totalItems = (stats.totalBadges || 0) + (stats.totalGames || 0);
        const completedItems = (stats.completedBadges || 0) + (stats.completedGames || 0);
        
        return this.calculatePercentage(completedItems, totalItems);
    }

    groupByCategory(items) {
        return items.reduce((groups, item) => {
            const category = item.category || 'general';
            if (!groups[category]) groups[category] = [];
            groups[category].push(item);
            return groups;
        }, {});
    }

    groupByDifficulty(items) {
        return items.reduce((groups, item) => {
            const difficulty = item.difficulty || 'intermediate';
            if (!groups[difficulty]) groups[difficulty] = [];
            groups[difficulty].push(item);
            return groups;
        }, {});
    }

    getRecentCompletions(items, days = 30) {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - days);
        
        return items.filter(item => {
            const date = item.earnedDate || item.completedDate;
            return date && new Date(date) >= cutoff;
        }).slice(0, 10); // Limit to 10 most recent
    }

    getAllTags(badges, games) {
        const allTags = new Set();
        
        [...badges, ...games].forEach(item => {
            if (item.tags) {
                item.tags.forEach(tag => allTags.add(tag));
            }
        });
        
        return Array.from(allTags).sort();
    }
}

// Create singleton instance
const profileParser = new ProfileParser();

module.exports = {
    parseProfile: (rawProfileData) => profileParser.parseProfile(rawProfileData),
    normalizeBadge: (badge) => profileParser.normalizeBadge(badge),
    normalizeGame: (game) => profileParser.normalizeGame(game),
    cleanText: (text) => profileParser.cleanText(text),
    normalizeTitle: (title) => profileParser.normalizeTitle(title)
};