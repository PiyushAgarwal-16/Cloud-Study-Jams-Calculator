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
const PORT = process.env.PORT || 3000;

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
        const { profileUrl } = req.body;

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
        const participant = enrollmentChecker.getParticipantByUrl(profileUrl);

        // Fetch profile data
        const profileData = await profileFetcher.fetchProfile(profileUrl);
        
        // Parse badges and games from profile
        const parsedData = profileParser.parseProfile(profileData);
        
        // Calculate points based on completed items
        const result = pointsCalculator.calculatePoints(parsedData);

        res.json({
            success: true,
            participant: participant,
            profileUrl: profileUrl,
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

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Cloud Skills Boost Calculator running on port ${PORT}`);
    console.log(`📱 Frontend: http://localhost:${PORT}`);
    console.log(`🔧 API: http://localhost:${PORT}/api`);
});

module.exports = app;