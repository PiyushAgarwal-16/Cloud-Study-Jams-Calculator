/**
 * Points Calculator Module
 * Calculates points based on completed badges and games using configurable scoring rules
 */

const fs = require('fs');
const path = require('path');

class PointsCalculator {
    constructor() {
        this.scoringConfigPath = path.join(__dirname, '../../config/scoringConfig.json');
        this.allowedBadgesPath = path.join(__dirname, '../../config/allowedSkillBadges.json');
        this.scoringConfig = this.loadScoringConfig();
        this.allowedBadges = this.loadAllowedBadges();
    }

    /**
     * Load scoring configuration from file
     * @returns {object} Scoring configuration
     */
    loadScoringConfig() {
        try {
            if (fs.existsSync(this.scoringConfigPath)) {
                const data = fs.readFileSync(this.scoringConfigPath, 'utf8');
                return JSON.parse(data);
            } else {
                console.log('Scoring config not found, using default configuration');
                return this.getDefaultScoringConfig();
            }
        } catch (error) {
            console.error('Error loading scoring config:', error);
            return this.getDefaultScoringConfig();
        }
    }

    /**
     * Load allowed skill badges configuration from file
     * @returns {object} Allowed badges configuration
     */
    loadAllowedBadges() {
        try {
            if (fs.existsSync(this.allowedBadgesPath)) {
                const data = fs.readFileSync(this.allowedBadgesPath, 'utf8');
                const parsed = JSON.parse(data);
                console.log('✅ Loaded allowed badges config:', {
                    totalBadges: parsed.allowedSkillBadges?.length || 0,
                    metadata: parsed.metadata
                });
                return parsed;
            } else {
                console.log('Allowed badges config not found, allowing all badges');
                return { allowedSkillBadges: [], metadata: { totalCount: 0, badgeCount: 0, gameCount: 0 } };
            }
        } catch (error) {
            console.error('Error loading allowed badges config:', error);
            return { allowedSkillBadges: [], metadata: { totalCount: 0, badgeCount: 0, gameCount: 0 } };
        }
    }

    /**
     * Get default scoring configuration
     * @returns {object} Default scoring rules
     */
    getDefaultScoringConfig() {
        return {
            badges: {
                // Base points for badge categories
                'cloud-storage': { points: 100, multiplier: 1.0 },
                'compute-engine': { points: 120, multiplier: 1.0 },
                'kubernetes': { points: 150, multiplier: 1.2 },
                'big-data': { points: 140, multiplier: 1.1 },
                'machine-learning': { points: 160, multiplier: 1.3 },
                'security': { points: 130, multiplier: 1.1 },
                'networking': { points: 110, multiplier: 1.0 },
                'data': { points: 125, multiplier: 1.0 },
                'application': { points: 115, multiplier: 1.0 },
                'development': { points: 105, multiplier: 1.0 },
                'general': { points: 100, multiplier: 1.0 }
            },
            games: {
                // Base points for game categories
                'cloud-quest': { points: 50, multiplier: 1.0 },
                'arcade-game': { points: 30, multiplier: 0.8 },
                'challenge': { points: 80, multiplier: 1.2 },
                'general': { points: 40, multiplier: 1.0 }
            },
            difficulty: {
                // Difficulty multipliers
                'beginner': 1.0,
                'intermediate': 1.2,
                'advanced': 1.5
            },
            bonuses: {
                // Bonus point conditions
                'completion_streak': {
                    // Bonus for completing multiple items in sequence
                    '5_streak': 50,
                    '10_streak': 150,
                    '20_streak': 400
                },
                'category_completion': {
                    // Bonus for completing all items in a category
                    'category_bonus': 200
                },
                'time_bonus': {
                    // Bonus for recent completions (within 30 days)
                    'recent_completion': 25
                }
            },
            specificItems: {
                // Specific badges/games with custom scoring
                badges: {
                    // Example specific badge overrides
                    'Google Cloud Digital Leader': { points: 200, multiplier: 1.5 },
                    'Google Cloud Architect': { points: 300, multiplier: 2.0 },
                    'Professional Cloud Developer': { points: 250, multiplier: 1.8 }
                },
                games: {
                    // Example specific game overrides
                    'Cloud Hero Challenge': { points: 100, multiplier: 1.5 }
                }
            },
            limits: {
                // Point calculation limits
                'max_badge_points': 500,
                'max_game_points': 200,
                'max_bonus_points': 1000
            }
        };
    }

    /**
     * Calculate total points for a profile
     * @param {object} parsedProfile - Parsed profile data
     * @returns {object} Points calculation result
     */
    calculatePoints(parsedProfile) {
        try {
            const result = {
                totalPoints: 0,
                breakdown: {
                    badges: { points: 0, count: 0, items: [] },
                    games: { points: 0, count: 0, items: [] },
                    bonuses: { points: 0, items: [] }
                },
                completedBadges: [],
                completedGames: [],
                progress: {},
                filtering: {
                    allowedBadgesTotal: this.allowedBadges?.allowedSkillBadges?.length || 0,
                    filteredBadges: [],
                    filteredGames: []
                },
                metadata: {
                    calculatedAt: new Date().toISOString(),
                    configVersion: this.scoringConfig.version || '1.0',
                    filteringEnabled: this.allowedBadges?.allowedSkillBadges?.length > 0
                }
            };

            // Calculate badge points
            this.calculateBadgePoints(parsedProfile.badges || [], result);

            // Calculate game points
            this.calculateGamePoints(parsedProfile.games || [], result);

            // Calculate bonus points
            this.calculateBonusPoints(parsedProfile, result);

            // Calculate progress metrics
            this.calculateProgress(parsedProfile, result);

            // Add detailed badge and game information for date filtering
            result.detailedBadges = (parsedProfile.badges || []).map(badge => ({
                originalTitle: badge.originalTitle,
                normalizedTitle: badge.normalizedTitle,
                isCompleted: badge.isCompleted,
                earnedDate: badge.earnedDate,
                badgeUrl: badge.badgeUrl
            }));

            result.detailedGames = (parsedProfile.games || []).map(game => ({
                originalTitle: game.originalTitle,
                normalizedTitle: game.normalizedTitle,
                isCompleted: game.isCompleted,
                completedDate: game.completedDate,
                gameUrl: game.gameUrl
            }));

            // Set total points
            result.totalPoints = 
                result.breakdown.badges.points + 
                result.breakdown.games.points + 
                result.breakdown.bonuses.points;

            return result;

        } catch (error) {
            console.error('Error calculating points:', error);
            throw new Error(`Points calculation failed: ${error.message}`);
        }
    }

    /**
     * Check if a badge is in the allowed list
     * @param {object} badge - Badge object to check
     * @returns {boolean} True if badge is allowed
     */
    isBadgeAllowed(badge) {
        // If no allowed badges configuration, allow all
        if (!this.allowedBadges || !this.allowedBadges.allowedSkillBadges || this.allowedBadges.allowedSkillBadges.length === 0) {
            return true;
        }

        // Check against allowed list by title match or URL/ID match
        return this.allowedBadges.allowedSkillBadges.some(allowedBadge => {
            // Match by normalized title (case insensitive)
            const normalizedAllowedTitle = allowedBadge.name.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
            const badgeTitle = badge.normalizedTitle || badge.originalTitle || badge.title || '';
            const normalizedBadgeTitle = badgeTitle.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
            
            // Check primary title match
            let titleMatch = normalizedAllowedTitle === normalizedBadgeTitle;
            
            // Check alternate names if available
            if (!titleMatch && allowedBadge.alternateNames) {
                titleMatch = allowedBadge.alternateNames.some(altName => {
                    const normalizedAltName = altName.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
                    return normalizedAltName === normalizedBadgeTitle;
                });
            }
            
            // Match by template ID if available in badge URL
            const badgeUrl = badge.badgeUrl || badge.url || '';
            const templateIdMatch = badgeUrl && allowedBadge.templateId && 
                badgeUrl.includes(`course_templates/${allowedBadge.templateId}`);
            
            return titleMatch || templateIdMatch;
        });
    }

    /**
     * Check if a game is in the allowed list
     * @param {object} game - Game object to check
     * @returns {boolean} True if game is allowed
     */
    isGameAllowed(game) {
        // If no allowed badges configuration, allow all
        if (!this.allowedBadges || !this.allowedBadges.allowedSkillBadges || this.allowedBadges.allowedSkillBadges.length === 0) {
            return true;
        }

        // Check against allowed list (games are also in the skill badges list)
        return this.allowedBadges.allowedSkillBadges.some(allowedItem => {
            // Match by normalized title (case insensitive)
            const normalizedAllowedTitle = allowedItem.name.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
            const gameTitle = game.normalizedTitle || game.originalTitle || game.title || '';
            const normalizedGameTitle = gameTitle.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
            
            // Check primary title match
            let titleMatch = normalizedAllowedTitle === normalizedGameTitle;
            
            // Check alternate names if available
            if (!titleMatch && allowedItem.alternateNames) {
                titleMatch = allowedItem.alternateNames.some(altName => {
                    const normalizedAltName = altName.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
                    return normalizedAltName === normalizedGameTitle;
                });
            }
            
            // Match by game ID if available
            const gameUrl = game.gameUrl || game.url || '';
            const gameIdMatch = gameUrl && allowedItem.gameId && 
                gameUrl.includes(`games/${allowedItem.gameId}`);
            
            return titleMatch || gameIdMatch;
        });
    }

    /**
     * Calculate points from badges
     * @param {Array} badges - Array of badge objects
     * @param {object} result - Result object to populate
     */
    calculateBadgePoints(badges, result) {
        const allCompletedBadges = badges.filter(badge => badge.isCompleted);
        const completedBadges = allCompletedBadges.filter(badge => this.isBadgeAllowed(badge));
        
        // Track filtered out badges for debugging
        const filteredOutBadges = allCompletedBadges.filter(badge => !this.isBadgeAllowed(badge));
        result.filtering.filteredBadges = filteredOutBadges.map(badge => ({
            title: badge.originalTitle,
            reason: 'Not in allowed skill badges list'
        }));
        
        completedBadges.forEach(badge => {
            const points = this.calculateItemPoints(badge, 'badge');
            const badgeResult = {
                title: badge.originalTitle,
                normalizedTitle: badge.normalizedTitle,
                category: badge.category,
                difficulty: badge.difficulty,
                points: points,
                basePoints: this.getBasePoints(badge, 'badge'),
                multiplier: this.getMultiplier(badge, 'badge')
            };

            result.breakdown.badges.items.push(badgeResult);
            result.breakdown.badges.points += points;
            result.completedBadges.push(badge);
        });

        result.breakdown.badges.count = completedBadges.length;
    }

    /**
     * Calculate points from games
     * @param {Array} games - Array of game objects
     * @param {object} result - Result object to populate
     */
    calculateGamePoints(games, result) {
        const allCompletedGames = games.filter(game => game.isCompleted);
        const completedGames = allCompletedGames.filter(game => this.isGameAllowed(game));
        
        // Track filtered out games for debugging
        const filteredOutGames = allCompletedGames.filter(game => !this.isGameAllowed(game));
        result.filtering.filteredGames = filteredOutGames.map(game => ({
            title: game.originalTitle,
            reason: 'Not in allowed skill badges list'
        }));
        
        completedGames.forEach(game => {
            const points = this.calculateItemPoints(game, 'game');
            const gameResult = {
                title: game.originalTitle,
                normalizedTitle: game.normalizedTitle,
                category: game.category,
                difficulty: game.difficulty,
                points: points,
                basePoints: this.getBasePoints(game, 'game'),
                multiplier: this.getMultiplier(game, 'game')
            };

            result.breakdown.games.items.push(gameResult);
            result.breakdown.games.points += points;
            result.completedGames.push(game);
        });

        result.breakdown.games.count = completedGames.length;
    }

    /**
     * Calculate points for an individual item (badge or game)
     * @param {object} item - Badge or game object
     * @param {string} type - 'badge' or 'game'
     * @returns {number} Calculated points
     */
    calculateItemPoints(item, type) {
        try {
            // Check for specific item override
            const specificPoints = this.getSpecificItemPoints(item, type);
            if (specificPoints !== null) {
                return specificPoints;
            }

            // Get base points and multipliers
            const basePoints = this.getBasePoints(item, type);
            const categoryMultiplier = this.getCategoryMultiplier(item, type);
            const difficultyMultiplier = this.getDifficultyMultiplier(item);

            // Calculate final points
            let points = Math.round(basePoints * categoryMultiplier * difficultyMultiplier);

            // Apply limits
            const maxPoints = type === 'badge' 
                ? this.scoringConfig.limits?.max_badge_points || 500
                : this.scoringConfig.limits?.max_game_points || 200;

            return Math.min(points, maxPoints);

        } catch (error) {
            console.error(`Error calculating points for ${type}:`, error);
            return 0;
        }
    }

    /**
     * Get specific item points if configured
     * @param {object} item - Item object
     * @param {string} type - 'badge' or 'game'
     * @returns {number|null} Specific points or null if not found
     */
    getSpecificItemPoints(item, type) {
        const specificItems = this.scoringConfig.specificItems?.[type + 's'] || {};
        const itemConfig = specificItems[item.originalTitle] || specificItems[item.normalizedTitle];
        
        if (itemConfig) {
            const basePoints = itemConfig.points || 0;
            const multiplier = itemConfig.multiplier || 1.0;
            return Math.round(basePoints * multiplier);
        }
        
        return null;
    }

    /**
     * Get base points for an item
     * @param {object} item - Item object
     * @param {string} type - 'badge' or 'game'
     * @returns {number} Base points
     */
    getBasePoints(item, type) {
        const categoryConfig = this.scoringConfig[type + 's'] || {};
        const itemConfig = categoryConfig[item.category] || categoryConfig['general'] || {};
        return itemConfig.points || 0;
    }

    /**
     * Get category multiplier for an item
     * @param {object} item - Item object
     * @param {string} type - 'badge' or 'game'
     * @returns {number} Category multiplier
     */
    getCategoryMultiplier(item, type) {
        const categoryConfig = this.scoringConfig[type + 's'] || {};
        const itemConfig = categoryConfig[item.category] || categoryConfig['general'] || {};
        return itemConfig.multiplier || 1.0;
    }

    /**
     * Get difficulty multiplier for an item
     * @param {object} item - Item object
     * @returns {number} Difficulty multiplier
     */
    getDifficultyMultiplier(item) {
        const difficultyConfig = this.scoringConfig.difficulty || {};
        return difficultyConfig[item.difficulty] || 1.0;
    }

    /**
     * Get combined multiplier for display
     * @param {object} item - Item object
     * @param {string} type - 'badge' or 'game'
     * @returns {number} Combined multiplier
     */
    getMultiplier(item, type) {
        return this.getCategoryMultiplier(item, type) * this.getDifficultyMultiplier(item);
    }

    /**
     * Calculate bonus points
     * @param {object} parsedProfile - Parsed profile data
     * @param {object} result - Result object to populate
     */
    calculateBonusPoints(parsedProfile, result) {
        const bonusConfig = this.scoringConfig.bonuses || {};
        let totalBonusPoints = 0;

        // Completion streak bonus
        const streakBonus = this.calculateStreakBonus(result, bonusConfig);
        if (streakBonus > 0) {
            result.breakdown.bonuses.items.push({
                type: 'completion_streak',
                description: 'Completion streak bonus',
                points: streakBonus
            });
            totalBonusPoints += streakBonus;
        }

        // Category completion bonus
        const categoryBonus = this.calculateCategoryBonus(parsedProfile, bonusConfig);
        if (categoryBonus > 0) {
            result.breakdown.bonuses.items.push({
                type: 'category_completion',
                description: 'Category completion bonus',
                points: categoryBonus
            });
            totalBonusPoints += categoryBonus;
        }

        // Recent completion bonus
        const timeBonus = this.calculateTimeBonus(parsedProfile, bonusConfig);
        if (timeBonus > 0) {
            result.breakdown.bonuses.items.push({
                type: 'time_bonus',
                description: 'Recent completion bonus',
                points: timeBonus
            });
            totalBonusPoints += timeBonus;
        }

        // Apply bonus limits
        const maxBonus = this.scoringConfig.limits?.max_bonus_points || 1000;
        result.breakdown.bonuses.points = Math.min(totalBonusPoints, maxBonus);
    }

    /**
     * Calculate completion streak bonus
     * @param {object} result - Current result
     * @param {object} bonusConfig - Bonus configuration
     * @returns {number} Streak bonus points
     */
    calculateStreakBonus(result, bonusConfig) {
        const totalCompletions = result.breakdown.badges.count + result.breakdown.games.count;
        const streakConfig = bonusConfig.completion_streak || {};

        if (totalCompletions >= 20) return streakConfig['20_streak'] || 0;
        if (totalCompletions >= 10) return streakConfig['10_streak'] || 0;
        if (totalCompletions >= 5) return streakConfig['5_streak'] || 0;

        return 0;
    }

    /**
     * Calculate category completion bonus
     * @param {object} parsedProfile - Parsed profile data
     * @param {object} bonusConfig - Bonus configuration
     * @returns {number} Category bonus points
     */
    calculateCategoryBonus(parsedProfile, bonusConfig) {
        // This is a simplified version - you might want to implement
        // more sophisticated category completion detection
        const categoryConfig = bonusConfig.category_completion || {};
        const categoryBonus = categoryConfig.category_bonus || 0;

        // Count completed categories (placeholder logic)
        const completedCategories = new Set();
        
        (parsedProfile.badges || []).forEach(badge => {
            if (badge.isCompleted) {
                completedCategories.add(badge.category);
            }
        });

        // Award bonus for each completed category (simplified)
        return completedCategories.size * (categoryBonus * 0.1); // 10% of full bonus per category
    }

    /**
     * Calculate time-based bonus
     * @param {object} parsedProfile - Parsed profile data
     * @param {object} bonusConfig - Bonus configuration
     * @returns {number} Time bonus points
     */
    calculateTimeBonus(parsedProfile, bonusConfig) {
        const timeConfig = bonusConfig.time_bonus || {};
        const recentBonus = timeConfig.recent_completion || 0;

        if (!recentBonus) return 0;

        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - 30); // 30 days

        let recentCompletions = 0;

        // Count recent badge completions
        (parsedProfile.badges || []).forEach(badge => {
            if (badge.isCompleted && badge.earnedDate) {
                const earnedDate = new Date(badge.earnedDate);
                if (earnedDate >= cutoffDate) {
                    recentCompletions++;
                }
            }
        });

        // Count recent game completions
        (parsedProfile.games || []).forEach(game => {
            if (game.isCompleted && game.completedDate) {
                const completedDate = new Date(game.completedDate);
                if (completedDate >= cutoffDate) {
                    recentCompletions++;
                }
            }
        });

        return recentCompletions * recentBonus;
    }

    /**
     * Calculate progress metrics
     * @param {object} parsedProfile - Parsed profile data
     * @param {object} result - Result object to populate
     */
    calculateProgress(parsedProfile, result) {
        // Get totals from allowed items list metadata
        const totalAllowedBadges = this.allowedBadges?.metadata?.badgeCount || 0;
        const totalAllowedGames = this.allowedBadges?.metadata?.gameCount || 0;
        
        // Get completed counts from filtered results
        const completedBadges = result.breakdown.badges.count || 0;
        const completedGames = result.breakdown.games.count || 0;
        
        // Calculate percentages
        const badgePercentage = totalAllowedBadges > 0 
            ? Math.round((completedBadges / totalAllowedBadges) * 100) 
            : 0;
        const gamePercentage = totalAllowedGames > 0 
            ? Math.round((completedGames / totalAllowedGames) * 100) 
            : 0;
        const overallPercentage = (totalAllowedBadges + totalAllowedGames) > 0
            ? Math.round(((completedBadges + completedGames) / (totalAllowedBadges + totalAllowedGames)) * 100)
            : 0;
        
        result.progress = {
            badges: {
                completed: completedBadges,
                total: totalAllowedBadges,
                percentage: badgePercentage
            },
            games: {
                completed: completedGames,
                total: totalAllowedGames,
                percentage: gamePercentage
            },
            overall: {
                completed: completedBadges + completedGames,
                total: totalAllowedBadges + totalAllowedGames,
                percentage: overallPercentage
            }
        };
    }

    /**
     * Get the current scoring configuration
     * @returns {object} Current scoring configuration
     */
    getScoringConfig() {
        return JSON.parse(JSON.stringify(this.scoringConfig)); // Return deep copy
    }

    /**
     * Update scoring configuration
     * @param {object} newConfig - New configuration
     * @returns {boolean} Success status
     */
    updateScoringConfig(newConfig) {
        try {
            this.scoringConfig = { ...this.scoringConfig, ...newConfig };
            
            // Save to file
            const dir = path.dirname(this.scoringConfigPath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }

            fs.writeFileSync(this.scoringConfigPath, JSON.stringify(this.scoringConfig, null, 2));
            return true;
        } catch (error) {
            console.error('Error updating scoring config:', error);
            return false;
        }
    }
}

// Create singleton instance
const pointsCalculator = new PointsCalculator();

module.exports = {
    calculatePoints: (parsedProfile) => pointsCalculator.calculatePoints(parsedProfile),
    getScoringConfig: () => pointsCalculator.getScoringConfig(),
    updateScoringConfig: (config) => pointsCalculator.updateScoringConfig(config)
};