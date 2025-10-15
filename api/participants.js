/**
 * Vercel Serverless Function: Get Participants
 * API endpoint for retrieving enrolled participants list
 */

const EnrollmentChecker = require('../server/modules/enrollmentChecker');

module.exports = async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const enrollmentChecker = new EnrollmentChecker();
        const participants = await enrollmentChecker.loadEnrolledParticipants();
        
        res.status(200).json({
            success: true,
            totalParticipants: participants.totalParticipants || 0,
            participants: participants.participants || []
        });
    } catch (error) {
        console.error('Error loading participants:', error);
        res.status(500).json({ 
            error: 'Failed to load participants',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};
