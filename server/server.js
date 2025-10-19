/**
 * Main server file for Google Cloud Skills Boost Calculator
 * Provides API endpoints for profile verification and points calculation
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const enrollmentChecker = require('./modules/enrollmentChecker');
const profileFetcher = require('./modules/profileFetcher');
const profileParser = require('./modules/profileParser');
const pointsCalculator = require('./modules/pointsCalculator');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Routes

// Serve the main HTML page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// API endpoint to verify profile and calculate points
app.post('/api/calculate-points', async (req, res) => {
    try {
        const { email, profileUrl } = req.body;

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
            participant = enrollmentChecker.getParticipantByEmail(email);
            if (!participant || !participant.profileUrl) {
                return res.status(404).json({ 
                    error: 'Profile URL not found for this email. Please contact the program administrator.',
                    enrolled: false 
                });
            }

            actualProfileUrl = participant.profileUrl;
            console.log(`📧 Email lookup: ${email} → ${participant.name} → ${actualProfileUrl}`);
        } else if (profileUrl) {
            // Legacy support: direct profile URL
            // Validate input
            if (!profileUrl) {
                return res.status(400).json({ 
                    error: 'Profile URL is required' 
                });
            }

            // Check if profile is enrolled
            const isEnrolled = await enrollmentChecker.checkEnrollment(profileUrl);
            if (!isEnrolled) {
                return res.status(403).json({ 
                    error: 'Profile is not enrolled in the program' 
                });
            }

            // Get participant details
            participant = enrollmentChecker.getParticipantByUrl(profileUrl);
            actualProfileUrl = profileUrl;
        } else {
            return res.status(400).json({ 
                error: 'Email or Profile URL is required' 
            });
        }

        // Fetch profile data
        const profileData = await profileFetcher.fetchProfile(actualProfileUrl);
        
        // Parse badges and games from profile
        const parsedData = profileParser.parseProfile(profileData);
        
        // Calculate points based on completed items
        const result = pointsCalculator.calculatePoints(parsedData);

        res.json({
            success: true,
            participant: {
                name: participant?.name || 'Unknown',
                email: participant?.email || null,
                batch: participant?.batch || 'Unknown',
                enrollmentDate: participant?.enrollmentDate || null
            },
            profileUrl: actualProfileUrl,
            totalPoints: result.totalPoints,
            completedBadges: result.completedBadges,
            completedGames: result.completedGames,
            progress: result.progress,
            breakdown: result.breakdown,
            metadata: {
                calculatedAt: new Date().toISOString(),
                batch: participant?.batch || 'Unknown'
            }
        });

    } catch (error) {
        console.error('Error processing request:', error);
        res.status(500).json({ 
            error: 'Internal server error while processing profile',
            message: error.message 
        });
    }
});

// API endpoint to get enrollment list (admin only)
app.get('/api/enrollment-list', (req, res) => {
    try {
        const enrollmentList = enrollmentChecker.getEnrollmentList();
        res.json({
            success: true,
            count: enrollmentList.length,
            participants: enrollmentList
        });
    } catch (error) {
        console.error('Error fetching enrollment list:', error);
        res.status(500).json({ 
            error: 'Failed to fetch enrollment list' 
        });
    }
});

// API endpoint to get scoring configuration
app.get('/api/scoring-config', (req, res) => {
    try {
        const config = pointsCalculator.getScoringConfig();
        res.json({
            success: true,
            config: config
        });
    } catch (error) {
        console.error('Error fetching scoring config:', error);
        res.status(500).json({ 
            error: 'Failed to fetch scoring configuration' 
        });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        service: 'Cloud Skills Boost Calculator'
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ 
        error: 'Internal server error' 
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ 
        error: 'Endpoint not found' 
    });
});

// Error handling for unhandled promises
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
});

// Start server
const server = app.listen(PORT, () => {
    console.log(`🚀 Cloud Skills Boost Calculator running on port ${PORT}`);
    console.log(`📱 Frontend: http://localhost:${PORT}`);
    console.log(`🔧 API: http://localhost:${PORT}/api`);
});

server.on('error', (error) => {
    console.error('Server error:', error);
});

module.exports = app;