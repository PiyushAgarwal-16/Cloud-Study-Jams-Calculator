/**
 * Unit tests for Enrollment Checker module
 */

const enrollmentChecker = require('../server/modules/enrollmentChecker');
const fs = require('fs');
const path = require('path');

// Mock fs module for testing
jest.mock('fs');

describe('Enrollment Checker', () => {
    beforeEach(() => {
        // Reset mocks
        jest.clearAllMocks();
    });

    describe('extractProfileId', () => {
        test('should extract profile ID from valid URLs', () => {
            const testCases = [
                {
                    url: 'https://www.cloudskillsboost.google/public_profiles/abc123',
                    expected: 'abc123'
                },
                {
                    url: 'https://cloudskillsboost.google/public_profiles/user-123',
                    expected: 'user-123'
                },
                {
                    url: 'http://www.cloudskillsboost.google/public_profiles/test_user',
                    expected: 'test_user'
                }
            ];

            testCases.forEach(({ url, expected }) => {
                expect(enrollmentChecker.extractProfileId(url)).toBe(expected);
            });
        });

        test('should return null for invalid URLs', () => {
            const invalidUrls = [
                'https://example.com/profile/123',
                'invalid-url',
                '',
                null,
                undefined
            ];

            invalidUrls.forEach(url => {
                expect(enrollmentChecker.extractProfileId(url)).toBeNull();
            });
        });
    });

    describe('normalizeProfileUrl', () => {
        test('should normalize valid profile URLs', () => {
            const testCases = [
                {
                    input: 'https://cloudskillsboost.google/public_profiles/abc123',
                    expected: 'https://www.cloudskillsboost.google/public_profiles/abc123'
                },
                {
                    input: 'http://www.cloudskillsboost.google/public_profiles/user-123',
                    expected: 'https://www.cloudskillsboost.google/public_profiles/user-123'
                }
            ];

            testCases.forEach(({ input, expected }) => {
                expect(enrollmentChecker.normalizeProfileUrl(input)).toBe(expected);
            });
        });

        test('should return null for invalid URLs', () => {
            const invalidUrls = [
                'https://example.com/profile/123',
                'invalid-url',
                ''
            ];

            invalidUrls.forEach(url => {
                expect(enrollmentChecker.normalizeProfileUrl(url)).toBeNull();
            });
        });
    });

    describe('checkEnrollment', () => {
        beforeEach(() => {
            // Clear the module cache to ensure fresh instance
            delete require.cache[require.resolve('../server/modules/enrollmentChecker')];
            
            // Mock enrollment list
            const mockEnrollmentData = {
                participants: [
                    'https://www.cloudskillsboost.google/public_profiles/enrolled-user-1',
                    {
                        name: 'Test User',
                        profileUrl: 'https://www.cloudskillsboost.google/public_profiles/enrolled-user-2'
                    },
                    {
                        name: 'Another User',
                        profileId: 'enrolled-user-3'
                    }
                ]
            };

            fs.existsSync.mockReturnValue(true);
            fs.readFileSync.mockReturnValue(JSON.stringify(mockEnrollmentData));
        });

        test('should return true for enrolled users', async () => {
            const enrolledUrls = [
                'https://www.cloudskillsboost.google/public_profiles/enrolled-user-1',
                'https://cloudskillsboost.google/public_profiles/enrolled-user-2',
                'http://www.cloudskillsboost.google/public_profiles/enrolled-user-3'
            ];

            for (const url of enrolledUrls) {
                const result = await enrollmentChecker.checkEnrollment(url);
                expect(result).toBe(true);
            }
        });

        test('should return false for non-enrolled users', async () => {
            const nonEnrolledUrls = [
                'https://www.cloudskillsboost.google/public_profiles/not-enrolled',
                'https://cloudskillsboost.google/public_profiles/random-user'
            ];

            for (const url of nonEnrolledUrls) {
                const result = await enrollmentChecker.checkEnrollment(url);
                expect(result).toBe(false);
            }
        });

        test('should return false for invalid URLs', async () => {
            const invalidUrls = [
                'invalid-url',
                'https://example.com/profile/123',
                ''
            ];

            for (const url of invalidUrls) {
                const result = await enrollmentChecker.checkEnrollment(url);
                expect(result).toBe(false);
            }
        });
    });
});

module.exports = {};