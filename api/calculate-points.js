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
        const { profileUrl } = req.body;

        if (!profileUrl) {
            return res.status(400).json({ error: 'Profile URL is required' });
        }

        // Initialize enrollment checker
        const enrollmentChecker = new EnrollmentChecker();

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
        const participant = await enrollmentChecker.getParticipantByUrl(profileUrl);

        // Fetch and parse profile
        console.log('Fetching profile:', profileUrl);
        const profileData = await profileFetcher.fetchProfile(profileUrl);
        
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
