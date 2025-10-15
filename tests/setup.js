/**
 * Jest setup file for global test configuration
 */

// Set test timeout
jest.setTimeout(10000);

// Mock console.log/error for cleaner test output
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

beforeEach(() => {
    // Silence console outputs during tests unless there's an error
    console.log = jest.fn();
    console.error = jest.fn();
});

afterEach(() => {
    // Restore console methods
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
});

// Global test utilities
global.testUtils = {
    createMockProfile: (overrides = {}) => ({
        userInfo: {
            name: 'Test User',
            location: 'Test Location',
            joinDate: '2024-01-01'
        },
        badges: [
            {
                title: 'Test Badge',
                isCompleted: true,
                earnedDate: '2025-01-01'
            }
        ],
        games: [
            {
                title: 'Test Game',
                isCompleted: true,
                completedDate: '2025-01-01'
            }
        ],
        stats: {
            totalBadges: 1,
            totalGames: 1,
            completedBadges: 1,
            completedGames: 1
        },
        ...overrides
    }),

    createMockEnrollmentData: (participants = []) => ({
        lastUpdated: new Date().toISOString(),
        participants: [
            'https://www.cloudskillsboost.google/public_profiles/test-user-1',
            ...participants
        ]
    })
};