/**
 * Enrollment Checker Module
 * Verifies if a given profile URL belongs to an enrolled participant
 */

const fs = require('fs');
const path = require('path');

class EnrollmentChecker {
    constructor() {
        this.enrollmentListPath = path.join(__dirname, '../../config/enrolledParticipants.json');
        this.enrollmentList = this.loadEnrollmentList();
    }

    /**
     * Load the enrollment list from configuration file
     * @returns {Array} List of enrolled participants
     */
    loadEnrollmentList() {
        try {
            if (fs.existsSync(this.enrollmentListPath)) {
                const data = fs.readFileSync(this.enrollmentListPath, 'utf8');
                const parsed = JSON.parse(data);
                return parsed.participants || [];
            } else {
                console.warn('Enrollment list file not found, using empty list');
                return [];
            }
        } catch (error) {
            console.error('Error loading enrollment list:', error);
            return [];
        }
    }

    /**
     * Extract profile ID from Google Cloud Skills Boost URL
     * @param {string} profileUrl - The full profile URL
     * @returns {string|null} The extracted profile ID or null if invalid
     */
    extractProfileId(profileUrl) {
        try {
            // Google Cloud Skills Boost profile URL patterns:
            // https://www.cloudskillsboost.google/public_profiles/{profile_id}
            // https://cloudskillsboost.google/public_profiles/{profile_id}
            
            const urlPattern = /(?:https?:\/\/)?(?:www\.)?cloudskillsboost\.google\/public_profiles\/([a-zA-Z0-9\-_]+)/i;
            const match = profileUrl.match(urlPattern);
            
            return match ? match[1] : null;
        } catch (error) {
            console.error('Error extracting profile ID:', error);
            return null;
        }
    }

    /**
     * Normalize profile URL to a standard format
     * @param {string} profileUrl - The input URL
     * @returns {string|null} Normalized URL or null if invalid
     */
    normalizeProfileUrl(profileUrl) {
        const profileId = this.extractProfileId(profileUrl);
        if (!profileId) {
            return null;
        }
        return `https://www.cloudskillsboost.google/public_profiles/${profileId}`;
    }

    /**
     * Check if a profile URL is in the enrollment list
     * @param {string} profileUrl - The profile URL to check
     * @returns {Promise<boolean>} True if enrolled, false otherwise
     */
    async checkEnrollment(profileUrl) {
        try {
            // Validate and normalize the URL
            const normalizedUrl = this.normalizeProfileUrl(profileUrl);
            if (!normalizedUrl) {
                console.log('Invalid profile URL format:', profileUrl);
                return false;
            }

            const profileId = this.extractProfileId(normalizedUrl);
            
            // Check against enrollment list
            const isEnrolled = this.enrollmentList.some(participant => {
                // Handle new structured format
                if (typeof participant === 'object' && participant.profileId) {
                    return participant.profileId === profileId;
                } else if (typeof participant === 'object' && participant.profileUrl) {
                    const participantId = this.extractProfileId(participant.profileUrl);
                    return participantId === profileId;
                } else if (typeof participant === 'string') {
                    // Handle legacy string format
                    const participantId = this.extractProfileId(participant);
                    return participantId === profileId || participant === normalizedUrl;
                }
                return false;
            });

            console.log(`Enrollment check for ${profileId}: ${isEnrolled ? 'ENROLLED' : 'NOT ENROLLED'}`);
            return isEnrolled;

        } catch (error) {
            console.error('Error checking enrollment:', error);
            return false;
        }
    }

    /**
     * Add a participant to the enrollment list
     * @param {string|object} participant - Profile URL or participant object
     * @returns {boolean} Success status
     */
    addParticipant(participant) {
        try {
            if (!participant) {
                return false;
            }

            // Normalize participant data
            let normalizedParticipant;
            if (typeof participant === 'string') {
                const normalizedUrl = this.normalizeProfileUrl(participant);
                if (!normalizedUrl) {
                    return false;
                }
                normalizedParticipant = normalizedUrl;
            } else {
                normalizedParticipant = participant;
            }

            // Check if already exists
            const exists = this.enrollmentList.some(existing => {
                if (typeof existing === 'string' && typeof normalizedParticipant === 'string') {
                    return existing === normalizedParticipant;
                }
                // Add more comparison logic as needed
                return false;
            });

            if (!exists) {
                this.enrollmentList.push(normalizedParticipant);
                this.saveEnrollmentList();
                return true;
            }

            return false; // Already exists
        } catch (error) {
            console.error('Error adding participant:', error);
            return false;
        }
    }

    /**
     * Save the current enrollment list to file
     * @returns {boolean} Success status
     */
    saveEnrollmentList() {
        try {
            const data = {
                lastUpdated: new Date().toISOString(),
                participants: this.enrollmentList
            };

            // Ensure directory exists
            const dir = path.dirname(this.enrollmentListPath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }

            fs.writeFileSync(this.enrollmentListPath, JSON.stringify(data, null, 2));
            return true;
        } catch (error) {
            console.error('Error saving enrollment list:', error);
            return false;
        }
    }

    /**
     * Get the current enrollment list
     * @returns {Array} List of enrolled participants
     */
    getEnrollmentList() {
        return [...this.enrollmentList]; // Return a copy
    }

    /**
     * Get participant details by profile URL
     * @param {string} profileUrl - The profile URL to search for
     * @returns {object|null} Participant object or null if not found
     */
    getParticipantByUrl(profileUrl) {
        try {
            const normalizedUrl = this.normalizeProfileUrl(profileUrl);
            if (!normalizedUrl) {
                return null;
            }

            const profileId = this.extractProfileId(normalizedUrl);
            
            return this.enrollmentList.find(participant => {
                if (typeof participant === 'object' && participant.profileId) {
                    return participant.profileId === profileId;
                } else if (typeof participant === 'object' && participant.profileUrl) {
                    const participantId = this.extractProfileId(participant.profileUrl);
                    return participantId === profileId;
                } else if (typeof participant === 'string') {
                    const participantId = this.extractProfileId(participant);
                    return participantId === profileId;
                }
                return false;
            }) || null;

        } catch (error) {
            console.error('Error getting participant by URL:', error);
            return null;
        }
    }

    /**
     * Get participant details by email address
     * @param {string} email - The email address to search for
     * @returns {object|null} Participant object or null if not found
     */
    getParticipantByEmail(email) {
        try {
            if (!email) {
                return null;
            }

            const normalizedEmail = email.trim().toLowerCase();
            
            return this.enrollmentList.find(participant => {
                if (typeof participant === 'object' && participant.email) {
                    return participant.email.toLowerCase() === normalizedEmail;
                }
                return false;
            }) || null;

        } catch (error) {
            console.error('Error getting participant by email:', error);
            return null;
        }
    }

    /**
     * Check if an email is enrolled
     * @param {string} email - The email address to check
     * @returns {Promise<boolean>} True if enrolled, false otherwise
     */
    async checkEnrollmentByEmail(email) {
        try {
            if (!email) {
                return false;
            }

            const participant = this.getParticipantByEmail(email);
            return participant !== null;

        } catch (error) {
            console.error('Error checking enrollment by email:', error);
            return false;
        }
    }

    /**
     * Get enrollment statistics
     * @returns {object} Statistics about enrollment
     */
    getStats() {
        return {
            totalParticipants: this.enrollmentList.length,
            lastUpdated: new Date().toISOString()
        };
    }

    /**
     * Load enrolled participants with full metadata
     * @returns {object} Participants data with metadata
     */
    loadEnrolledParticipants() {
        try {
            if (fs.existsSync(this.enrollmentListPath)) {
                const data = fs.readFileSync(this.enrollmentListPath, 'utf8');
                return JSON.parse(data);
            } else {
                return {
                    lastUpdated: new Date().toISOString(),
                    totalParticipants: 0,
                    batch: '',
                    program: '',
                    participants: []
                };
            }
        } catch (error) {
            console.error('Error loading enrolled participants:', error);
            return {
                lastUpdated: new Date().toISOString(),
                totalParticipants: 0,
                batch: '',
                program: '',
                participants: []
            };
        }
    }

    /**
     * Check if a profile URL is enrolled (alias for checkEnrollment for compatibility)
     * @param {string} profileUrl - The profile URL to check
     * @returns {Promise<boolean>} True if enrolled, false otherwise
     */
    async isEnrolled(profileUrl) {
        return await this.checkEnrollment(profileUrl);
    }
}

// Create singleton instance
const enrollmentChecker = new EnrollmentChecker();

module.exports = {
    checkEnrollment: (profileUrl) => enrollmentChecker.checkEnrollment(profileUrl),
    isEnrolled: (profileUrl) => enrollmentChecker.isEnrolled(profileUrl),
    checkEnrollmentByEmail: (email) => enrollmentChecker.checkEnrollmentByEmail(email),
    addParticipant: (participant) => enrollmentChecker.addParticipant(participant),
    getEnrollmentList: () => enrollmentChecker.getEnrollmentList(),
    getParticipantByUrl: (profileUrl) => enrollmentChecker.getParticipantByUrl(profileUrl),
    getParticipantByEmail: (email) => enrollmentChecker.getParticipantByEmail(email),
    getStats: () => enrollmentChecker.getStats(),
    loadEnrolledParticipants: () => enrollmentChecker.loadEnrolledParticipants(),
    normalizeProfileUrl: (url) => enrollmentChecker.normalizeProfileUrl(url),
    extractProfileId: (url) => enrollmentChecker.extractProfileId(url)
};