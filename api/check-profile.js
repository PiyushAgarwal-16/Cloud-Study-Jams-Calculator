/**
 * Profile Accessibility Check API
 * Checks if a Google Cloud Skills Boost profile is public or private
 * Does NOT check enrollment status - just accessibility
 */

const axios = require('axios');
const cheerio = require('cheerio');

module.exports = async (req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle OPTIONS request for CORS preflight
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({
            success: false,
            error: 'Method not allowed. Use POST.'
        });
    }

    try {
        const { profileUrl } = req.body;

        // Validate profile URL
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

        // Fetch the profile page
        const response = await axios.get(profileUrl, {
            timeout: 10000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });

        const html = response.data;
        const $ = cheerio.load(html);

        // Check for private profile indicators
        const pageText = $('body').text().toLowerCase();
        const privateIndicators = [
            'this profile is private',
            'profile is not public',
            'private profile',
            'profile visibility',
            'make profile public',
            'set your profile to public'
        ];

        const isPrivate = privateIndicators.some(indicator => 
            pageText.includes(indicator.toLowerCase())
        );

        if (isPrivate) {
            console.log('  🔒 Profile is PRIVATE');
            return res.status(200).json({
                success: true,
                status: 'private',
                accessible: false,
                message: 'Profile is set to private',
                profileUrl
            });
        }

        // Check if profile has actual content
        const hasContent = pageText.includes('public profile') || 
                          pageText.includes('badges') || 
                          pageText.includes('skill badge') ||
                          $('ql-display-name').length > 0 ||
                          $('.profile-badge').length > 0;

        if (!hasContent) {
            console.log('  ⚠️ Profile appears EMPTY or INVALID');
            return res.status(200).json({
                success: true,
                status: 'error',
                accessible: false,
                message: 'Profile appears to be empty or invalid',
                profileUrl
            });
        }

        // Profile is accessible (public)
        console.log('  ✅ Profile is ACCESSIBLE (public)');
        return res.status(200).json({
            success: true,
            status: 'accessible',
            accessible: true,
            message: 'Profile is publicly accessible',
            profileUrl
        });

    } catch (error) {
        console.error('❌ Error checking profile accessibility:', error.message);

        // Handle specific error cases
        if (error.response) {
            // HTTP error response
            return res.status(200).json({
                success: true,
                status: 'error',
                accessible: false,
                message: `HTTP ${error.response.status}: ${error.response.statusText}`,
                profileUrl: req.body.profileUrl
            });
        } else if (error.code === 'ECONNABORTED') {
            // Timeout
            return res.status(200).json({
                success: true,
                status: 'error',
                accessible: false,
                message: 'Request timeout - profile may be unavailable',
                profileUrl: req.body.profileUrl
            });
        } else {
            // Other errors
            return res.status(200).json({
                success: true,
                status: 'error',
                accessible: false,
                message: error.message || 'Network error',
                profileUrl: req.body.profileUrl
            });
        }
    }
};
