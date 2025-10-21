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
            userName: parsedData.profileInfo?.name || participant?.name || 'Unknown User',
            totalPoints: result.totalPoints,
            completedBadges: result.completedBadges,
            completedGames: result.completedGames,
            progress: result.progress,
            breakdown: result.breakdown,
            detailedBadges: parsedData.badges || [],
            detailedGames: parsedData.games || [],
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

// API endpoint to get participants list (for analytics)
app.get('/api/participants', async (req, res) => {
    try {
        // Check if test mode is requested
        const isTestMode = req.query.test === 'true';
        
        // Determine which file to load
        const fs = require('fs');
        const filename = isTestMode ? 'testParticipants.json' : 'enrolledParticipants.json';
        const filePath = path.join(__dirname, '../config', filename);
        
        console.log(isTestMode ? '🧪 TEST MODE: Loading 30 participants' : '📊 Loading all 196 participants');
        
        // Read and parse the file directly
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        const participants = data.participants || [];
        
        // Transform to consistent format
        const formattedParticipants = participants.map(p => {
            if (typeof p === 'object' && p.profileId) {
                return {
                    name: p.name || 'Unknown',
                    profileId: p.profileId,
                    profileUrl: p.profileUrl || `https://www.cloudskillsboost.google/public_profiles/${p.profileId}`
                };
            }
            return null;
        }).filter(p => p !== null);
        
        res.json({
            success: true,
            testMode: isTestMode,
            totalParticipants: formattedParticipants.length,
            participants: formattedParticipants
        });
    } catch (error) {
        console.error('Error loading participants:', error);
        res.status(500).json({ 
            error: 'Failed to load participants',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
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

// API endpoint to check profile accessibility (public/private)
// Does NOT check enrollment - just accessibility
app.post('/api/check-profile', async (req, res) => {
    try {
        const { profileUrl } = req.body;

        // Validate input
        if (!profileUrl) {
            return res.status(400).json({ 
                success: false,
                error: 'Profile URL is required' 
            });
        }

        // Validate URL format
        if (!profileUrl.includes('cloudskillsboost.google') || !profileUrl.includes('public_profiles')) {
            return res.status(400).json({
                success: false,
                error: 'Invalid profile URL format'
            });
        }

        console.log(`🔍 Checking accessibility for: ${profileUrl}`);

        // Fetch profile data (without enrollment check)
        const profileData = await profileFetcher.fetchProfile(profileUrl);
        
        // Profile fetcher will throw error if private or inaccessible
        // If we get here, profile is accessible
        console.log('  ✅ Profile is ACCESSIBLE (public)');
        
        return res.json({
            success: true,
            status: 'accessible',
            accessible: true,
            message: 'Profile is publicly accessible',
            profileUrl
        });

    } catch (error) {
        console.error('❌ Error checking profile:', error.message);

        // Check if it's a private profile error
        const errorMsg = error.message.toLowerCase();
        if (errorMsg.includes('private') || 
            errorMsg.includes('not public') || 
            errorMsg.includes('access denied') ||
            errorMsg.includes('sorry, access denied to this resource') ||
            errorMsg.includes('please sign in to access this content') ||
            errorMsg.includes('redirected to homepage')) {
            console.log('  🔒 Profile is PRIVATE');
            return res.json({
                success: true,
                status: 'private',
                accessible: false,
                message: 'Profile is set to private',
                profileUrl: req.body.profileUrl
            });
        }

        // Other errors
        return res.json({
            success: true,
            status: 'error',
            accessible: false,
            message: error.message || 'Unable to access profile',
            profileUrl: req.body.profileUrl
        });
    }
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