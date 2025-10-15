/**
 * Unit tests for Profile Parser module
 */

const profileParser = require('../server/modules/profileParser');

describe('Profile Parser', () => {
    describe('cleanText', () => {
        test('should clean and normalize text', () => {
            const testCases = [
                {
                    input: '  Multiple   spaces  ',
                    expected: 'Multiple spaces'
                },
                {
                    input: 'Text with special chars @#$%',
                    expected: 'Text with special chars'
                },
                {
                    input: 'Normal text',
                    expected: 'Normal text'
                }
            ];

            testCases.forEach(({ input, expected }) => {
                expect(profileParser.cleanText(input)).toBe(expected);
            });
        });
    });

    describe('normalizeTitle', () => {
        test('should normalize titles correctly', () => {
            const testCases = [
                {
                    input: 'Google Cloud Storage Badge',
                    expected: 'google cloud storage badge'
                },
                {
                    input: '  Mixed-Case   Title!!! ',
                    expected: 'mixed-case title'
                },
                {
                    input: 'Kubernetes@Engine#2024',
                    expected: 'kubernetes engine 2024'
                }
            ];

            testCases.forEach(({ input, expected }) => {
                expect(profileParser.normalizeTitle(input)).toBe(expected);
            });
        });
    });

    describe('normalizeBadge', () => {
        test('should normalize valid badge objects', () => {
            const inputBadge = {
                title: 'Google Cloud Storage Fundamentals',
                description: 'Learn the basics of Google Cloud Storage',
                isCompleted: true,
                earnedDate: '2025-01-15',
                imageUrl: '/images/badge.png',
                badgeUrl: '/badges/storage'
            };

            const result = profileParser.normalizeBadge(inputBadge);

            expect(result).toBeDefined();
            expect(result.originalTitle).toBe(inputBadge.title);
            expect(result.normalizedTitle).toBe('google cloud storage fundamentals');
            expect(result.isCompleted).toBe(true);
            expect(result.category).toBe('cloud-storage');
            expect(result.difficulty).toBeDefined();
            expect(result.tags).toBeInstanceOf(Array);
        });

        test('should return null for invalid badge objects', () => {
            const invalidBadges = [
                null,
                undefined,
                {},
                { description: 'No title' }
            ];

            invalidBadges.forEach(badge => {
                expect(profileParser.normalizeBadge(badge)).toBeNull();
            });
        });
    });

    describe('normalizeGame', () => {
        test('should normalize valid game objects', () => {
            const inputGame = {
                title: 'Cloud Quest Challenge',
                description: 'Complete cloud quests to earn points',
                isCompleted: true,
                completedDate: '2025-01-20',
                points: 50
            };

            const result = profileParser.normalizeGame(inputGame);

            expect(result).toBeDefined();
            expect(result.originalTitle).toBe(inputGame.title);
            expect(result.normalizedTitle).toBe('cloud quest challenge');
            expect(result.isCompleted).toBe(true);
            expect(result.category).toBe('cloud-quest');
            expect(result.estimatedPoints).toBe(50);
        });

        test('should return null for invalid game objects', () => {
            const invalidGames = [
                null,
                undefined,
                {},
                { description: 'No title' }
            ];

            invalidGames.forEach(game => {
                expect(profileParser.normalizeGame(game)).toBeNull();
            });
        });
    });

    describe('parseProfile', () => {
        test('should parse complete profile data', () => {
            const rawProfileData = {
                userInfo: {
                    name: 'John Doe',
                    location: 'San Francisco, CA',
                    joinDate: '2024-01-01'
                },
                badges: [
                    {
                        title: 'Cloud Storage Badge',
                        isCompleted: true,
                        earnedDate: '2025-01-10'
                    },
                    {
                        title: 'Compute Engine Badge',
                        isCompleted: false
                    }
                ],
                games: [
                    {
                        title: 'Cloud Quest',
                        isCompleted: true,
                        completedDate: '2025-01-15'
                    }
                ],
                stats: {
                    totalBadges: 2,
                    totalGames: 1,
                    completedBadges: 1,
                    completedGames: 1
                }
            };

            const result = profileParser.parseProfile(rawProfileData);

            expect(result).toBeDefined();
            expect(result.profileInfo.name).toBe('John Doe');
            expect(result.badges).toHaveLength(2);
            expect(result.games).toHaveLength(1);
            expect(result.statistics.total.badges).toBe(2);
            expect(result.statistics.completed.badges).toBe(1);
            expect(result.derived).toBeDefined();
            expect(result.metadata).toBeDefined();
        });

        test('should handle empty profile data', () => {
            const emptyProfileData = {
                userInfo: {},
                badges: [],
                games: [],
                stats: {}
            };

            const result = profileParser.parseProfile(emptyProfileData);

            expect(result).toBeDefined();
            expect(result.badges).toHaveLength(0);
            expect(result.games).toHaveLength(0);
            expect(result.statistics.total.badges).toBe(0);
        });
    });
});

module.exports = {};