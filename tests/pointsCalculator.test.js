/**
 * Unit tests for Points Calculator module
 */

const pointsCalculator = require('../server/modules/pointsCalculator');

describe('Points Calculator', () => {
    const sampleParsedProfile = {
        badges: [
            {
                originalTitle: 'Google Cloud Storage Badge',
                normalizedTitle: 'google cloud storage badge',
                category: 'cloud-storage',
                difficulty: 'beginner',
                isCompleted: true,
                earnedDate: '2025-01-10T00:00:00.000Z'
            },
            {
                originalTitle: 'Kubernetes Engine Badge',
                normalizedTitle: 'kubernetes engine badge', 
                category: 'kubernetes',
                difficulty: 'intermediate',
                isCompleted: true,
                earnedDate: '2025-01-15T00:00:00.000Z'
            },
            {
                originalTitle: 'Advanced ML Badge',
                normalizedTitle: 'advanced ml badge',
                category: 'machine-learning',
                difficulty: 'advanced',
                isCompleted: false
            }
        ],
        games: [
            {
                originalTitle: 'Cloud Quest Challenge',
                normalizedTitle: 'cloud quest challenge',
                category: 'cloud-quest',
                difficulty: 'intermediate',
                isCompleted: true,
                completedDate: '2025-01-20T00:00:00.000Z'
            },
            {
                originalTitle: 'Arcade Game',
                normalizedTitle: 'arcade game',
                category: 'arcade-game',
                difficulty: 'beginner',
                isCompleted: true,
                completedDate: '2025-01-25T00:00:00.000Z'
            }
        ],
        statistics: {
            total: { badges: 3, games: 2 },
            completed: { badges: 2, games: 2 },
            completion: {
                badgePercentage: 67,
                gamePercentage: 100,
                overallPercentage: 80
            }
        }
    };

    describe('calculatePoints', () => {
        test('should calculate total points correctly', () => {
            const result = pointsCalculator.calculatePoints(sampleParsedProfile);

            expect(result).toBeDefined();
            expect(result.totalPoints).toBeGreaterThan(0);
            expect(result.breakdown.badges.points).toBeGreaterThan(0);
            expect(result.breakdown.games.points).toBeGreaterThan(0);
            expect(result.breakdown.badges.count).toBe(2);
            expect(result.breakdown.games.count).toBe(2);
        });

        test('should include completed items in breakdown', () => {
            const result = pointsCalculator.calculatePoints(sampleParsedProfile);

            expect(result.breakdown.badges.items).toHaveLength(2);
            expect(result.breakdown.games.items).toHaveLength(2);
            expect(result.completedBadges).toHaveLength(2);
            expect(result.completedGames).toHaveLength(2);
        });

        test('should calculate progress correctly', () => {
            const result = pointsCalculator.calculatePoints(sampleParsedProfile);

            expect(result.progress.badges.completed).toBe(2);
            expect(result.progress.badges.total).toBe(3);
            expect(result.progress.games.completed).toBe(2);
            expect(result.progress.games.total).toBe(2);
        });

        test('should apply difficulty multipliers', () => {
            const beginnerProfile = {
                badges: [{
                    originalTitle: 'Beginner Badge',
                    category: 'general',
                    difficulty: 'beginner',
                    isCompleted: true
                }],
                games: [],
                statistics: { total: { badges: 1, games: 0 }, completed: { badges: 1, games: 0 } }
            };

            const advancedProfile = {
                badges: [{
                    originalTitle: 'Advanced Badge',
                    category: 'general',
                    difficulty: 'advanced',
                    isCompleted: true
                }],
                games: [],
                statistics: { total: { badges: 1, games: 0 }, completed: { badges: 1, games: 0 } }
            };

            const beginnerResult = pointsCalculator.calculatePoints(beginnerProfile);
            const advancedResult = pointsCalculator.calculatePoints(advancedProfile);

            expect(advancedResult.breakdown.badges.points).toBeGreaterThan(beginnerResult.breakdown.badges.points);
        });
    });

    describe('getScoringConfig', () => {
        test('should return scoring configuration', () => {
            const config = pointsCalculator.getScoringConfig();

            expect(config).toBeDefined();
            expect(config.badges).toBeDefined();
            expect(config.games).toBeDefined();
            expect(config.difficulty).toBeDefined();
            expect(config.bonuses).toBeDefined();
        });

        test('should include all required badge categories', () => {
            const config = pointsCalculator.getScoringConfig();
            
            const requiredCategories = [
                'cloud-storage',
                'compute-engine',
                'kubernetes',
                'machine-learning',
                'general'
            ];

            requiredCategories.forEach(category => {
                expect(config.badges[category]).toBeDefined();
                expect(config.badges[category].points).toBeGreaterThan(0);
            });
        });

        test('should include difficulty multipliers', () => {
            const config = pointsCalculator.getScoringConfig();
            
            expect(config.difficulty.beginner).toBe(1.0);
            expect(config.difficulty.intermediate).toBeGreaterThan(1.0);
            expect(config.difficulty.advanced).toBeGreaterThan(config.difficulty.intermediate);
        });
    });

    describe('edge cases', () => {
        test('should handle empty profile', () => {
            const emptyProfile = {
                badges: [],
                games: [],
                statistics: { total: { badges: 0, games: 0 }, completed: { badges: 0, games: 0 } }
            };

            const result = pointsCalculator.calculatePoints(emptyProfile);

            expect(result.totalPoints).toBe(0);
            expect(result.breakdown.badges.count).toBe(0);
            expect(result.breakdown.games.count).toBe(0);
        });

        test('should handle profile with only incomplete items', () => {
            const incompleteProfile = {
                badges: [{
                    originalTitle: 'Incomplete Badge',
                    category: 'general',
                    difficulty: 'beginner',
                    isCompleted: false
                }],
                games: [{
                    originalTitle: 'Incomplete Game',
                    category: 'general',
                    difficulty: 'beginner',
                    isCompleted: false
                }],
                statistics: { total: { badges: 1, games: 1 }, completed: { badges: 0, games: 0 } }
            };

            const result = pointsCalculator.calculatePoints(incompleteProfile);

            expect(result.totalPoints).toBe(0);
            expect(result.breakdown.badges.count).toBe(0);
            expect(result.breakdown.games.count).toBe(0);
        });

        test('should handle items with unknown categories', () => {
            const unknownProfile = {
                badges: [{
                    originalTitle: 'Unknown Badge',
                    category: 'unknown-category',
                    difficulty: 'beginner',
                    isCompleted: true
                }],
                games: [],
                statistics: { total: { badges: 1, games: 0 }, completed: { badges: 1, games: 0 } }
            };

            const result = pointsCalculator.calculatePoints(unknownProfile);

            // Should fall back to general category
            expect(result.totalPoints).toBeGreaterThan(0);
            expect(result.breakdown.badges.count).toBe(1);
        });
    });
});

module.exports = {};