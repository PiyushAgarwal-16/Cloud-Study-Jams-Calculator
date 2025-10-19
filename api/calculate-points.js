/**
 * Vercel Serverless Function: Calculate Points
 * API endpoint for calculating points from Google Cloud Skills Boost profiles
 */

const EnrollmentChecker = require('../server/modules/enrollmentChecker');
const profileFetcher = require('../server/modules/profileFetcher');
const profileParser = require('../server/modules/profileParser');
const pointsCalculator = require('../server/modules/pointsCalculator');

module.exports = async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { email, profileUrl } = req.body;

        // Initialize enrollment checker
        const enrollmentChecker = new EnrollmentChecker();

        let actualProfileUrl = profileUrl;
        let participant = null;

        // If email is provided, look up the profile URL
        if (email) {
            // Validate email format
            const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailPattern.test(email)) {
                return res.status(400).json({ error: 'Invalid email format' });
            }

            // Check enrollment by email
            const isEnrolled = await enrollmentChecker.checkEnrollmentByEmail(email);
            if (!isEnrolled) {
                return res.status(403).json({ 
                    error: 'Email not found in enrolled participants list. Please check your email address or contact the program administrator.',
                    enrolled: false 
                });
            }

            // Get participant info by email
            participant = await enrollmentChecker.getParticipantByEmail(email);
            if (!participant || !participant.profileUrl) {
                return res.status(404).json({ 
                    error: 'Profile URL not found for this email. Please contact the program administrator.',
                    enrolled: false 
                });
            }

            actualProfileUrl = participant.profileUrl;
        } else if (profileUrl) {
            // Legacy support: direct profile URL
            // Validate URL format
            const urlPattern = /^https?:\/\/(www\.)?cloudskillsboost\.google\/public_profiles\/[a-zA-Z0-9\-_]+/i;
            if (!urlPattern.test(profileUrl)) {
                return res.status(400).json({ error: 'Invalid profile URL format' });
            }

            // Check enrollment
            const isEnrolled = await enrollmentChecker.isEnrolled(profileUrl);
            if (!isEnrolled) {
                return res.status(403).json({ 
                    error: 'Profile not found in enrolled participants list. Please contact the program administrator.',
                    enrolled: false 
                });
            }

            // Get participant info
            participant = await enrollmentChecker.getParticipantByUrl(profileUrl);
        } else {
            return res.status(400).json({ error: 'Email or Profile URL is required' });
        }

        // Fetch and parse profile
        console.log('Fetching profile:', actualProfileUrl);
        const profileData = await profileFetcher.fetchProfile(actualProfileUrl);
        
        console.log('Parsing profile data');
        const parsedProfile = await profileParser.parseProfile(profileData);

        // Calculate points
        console.log('Calculating points');
        const result = pointsCalculator.calculatePoints(parsedProfile);

        // Return results
        res.status(200).json({
            success: true,
            enrolled: true,
            participant: {
                name: participant.name || 'Unknown',
                email: participant.email || null,
                batch: participant.batch || 'Unknown',
                enrollmentDate: participant.enrollmentDate || null
            },
            ...result
        });

    } catch (error) {
        console.error('Error calculating points:', error);
        res.status(500).json({ 
            error: 'Failed to calculate points. Please try again later.',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};
