/**
 * Google Cloud Skills Boost Calculator - Frontend JavaScript
 * Handles user interactions and API communication
 */

class SkillsBoostCalculator {
    constructor() {
        this.apiBaseUrl = window.location.origin + '/api';
        this.currentResults = null;
        this.init();
    }

    /**
     * Initialize the application
     */
    init() {
        this.bindEvents();
        this.setupTabSwitching();
        this.initCountdownTimer();
        console.log('🚀 Google Cloud Skills Boost Calculator initialized');
    }

    /**
     * Initialize and start the countdown timer
     */
    initCountdownTimer() {
        // Program ends on October 31, 2025 at 11:59:59 PM IST (India Standard Time)
        // IST is UTC+5:30
        const endDate = new Date('2025-10-31T23:59:59+05:30');
        
        const updateCountdown = () => {
            const now = new Date();
            const timeLeft = endDate - now;
            
            if (timeLeft <= 0) {
                // Program has ended
                document.getElementById('countdownTimer').innerHTML = 
                    '<div class="countdown-expired">⏰ Program Ended!</div>';
                clearInterval(this.countdownInterval);
                return;
            }
            
            // Calculate time units
            const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
            const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
            
            // Update DOM
            document.getElementById('days').textContent = String(days).padStart(2, '0');
            document.getElementById('hours').textContent = String(hours).padStart(2, '0');
            document.getElementById('minutes').textContent = String(minutes).padStart(2, '0');
            document.getElementById('seconds').textContent = String(seconds).padStart(2, '0');
        };
        
        // Update immediately and then every second
        updateCountdown();
        this.countdownInterval = setInterval(updateCountdown, 1000);
    }

    /**
     * Bind event listeners
     */
    bindEvents() {
        // Form submission
        document.getElementById('profileForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.calculatePoints();
        });

        // Retry button
        document.getElementById('retryBtn').addEventListener('click', () => {
            this.hideError();
            this.showInputSection();
        });

        // New calculation button
        document.getElementById('newCalculationBtn').addEventListener('click', () => {
            this.resetForm();
        });

        // Email input validation
        document.getElementById('userEmail').addEventListener('input', (e) => {
            this.validateEmail(e.target);
        });

        // Track Piyush Agarwal link clicks with Google Analytics
        const creatorLink = document.getElementById('creatorLink');
        if (creatorLink) {
            creatorLink.addEventListener('click', () => {
                if (typeof gtag !== 'undefined') {
                    gtag('event', 'click', {
                        event_category: 'outbound_link',
                        event_label: 'LinkedIn - Piyush Agarwal',
                        link_url: creatorLink.href,
                        link_domain: 'linkedin.com',
                        value: 1
                    });
                    console.log('📊 GA4 Event tracked: click (creator_link)');
                }
            });
        }
    }

    /**
     * Setup tab switching functionality
     */
    setupTabSwitching() {
        const tabButtons = document.querySelectorAll('.tab-btn');
        const tabPanels = document.querySelectorAll('.tab-panel');

        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const targetTab = button.dataset.tab;

                // Remove active class from all buttons and panels
                tabButtons.forEach(btn => btn.classList.remove('active'));
                tabPanels.forEach(panel => panel.classList.remove('active'));

                // Add active class to clicked button and corresponding panel
                button.classList.add('active');
                document.getElementById(targetTab + 'Tab').classList.add('active');
            });
        });
    }

    /**
     * Validate email format
     */
    validateEmail(input) {
        const email = input.value.trim();
        const isValid = this.isValidEmail(email);
        
        if (email && !isValid) {
            input.setCustomValidity('Please enter a valid email address');
        } else {
            input.setCustomValidity('');
        }
    }

    /**
     * Check if email is valid
     */
    isValidEmail(email) {
        if (!email) return false;
        
        const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return pattern.test(email);
    }

    /**
     * Main function to calculate points
     */
    async calculatePoints() {
        const userEmail = document.getElementById('userEmail').value.trim();

        if (!userEmail) {
            this.showError('Please enter your email address');
            return;
        }

        if (!this.isValidEmail(userEmail)) {
            this.showError('Please enter a valid email address');
            return;
        }

        // Track Calculate Points button click with Google Analytics
        if (typeof gtag !== 'undefined') {
            gtag('event', 'calculate_points', {
                event_category: 'engagement',
                event_label: 'Calculate Points Button',
                value: 1,
                user_email_domain: userEmail.split('@')[1] // Track email domain for analytics (privacy-safe)
            });
            console.log('📊 GA4 Event tracked: calculate_points');
        }

        try {
            this.showLoading();
            this.updateLoadingStatus('Looking up your profile...');

            const response = await fetch(`${this.apiBaseUrl}/calculate-points`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email: userEmail })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
            }

            this.updateLoadingStatus('Fetching profile data...');
            const results = await response.json();

            this.updateLoadingStatus('Calculating points...');
            
            // Simulate processing delay for better UX
            await new Promise(resolve => setTimeout(resolve, 1000));

            this.currentResults = results;
            this.displayResults(results);

            // Track successful calculation
            if (typeof gtag !== 'undefined') {
                gtag('event', 'calculation_success', {
                    event_category: 'engagement',
                    event_label: 'Points Calculated Successfully',
                    value: results.totalPoints || 0
                });
                console.log('📊 GA4 Event tracked: calculation_success');
            }

        } catch (error) {
            console.error('Error calculating points:', error);
            this.showError(error.message || 'An error occurred while calculating points');
            
            // Track calculation error
            if (typeof gtag !== 'undefined') {
                gtag('event', 'calculation_error', {
                    event_category: 'error',
                    event_label: error.message || 'Unknown error',
                    value: 0
                });
                console.log('📊 GA4 Event tracked: calculation_error');
            }
        }
    }

    /**
     * Display calculation results
     */
    displayResults(results) {
        this.hideLoading();
        this.hideError();

        // Update participant information
        if (results.participant) {
            document.getElementById('participantName').textContent = results.participant.name || 'Unknown';
            document.getElementById('participantBatch').textContent = results.participant.batch || 'Unknown';
            
            // Show email if available
            if (results.participant.email) {
                document.getElementById('participantEmail').textContent = results.participant.email;
                document.getElementById('participantEmailContainer').style.display = 'flex';
            } else {
                document.getElementById('participantEmailContainer').style.display = 'none';
            }
        }

        // Update summary
        document.getElementById('completedBadgesCount').textContent = results.completedBadges.length;
        document.getElementById('completedGamesCount').textContent = results.completedGames.length;
        document.getElementById('overallProgress').textContent = results.progress.overall.percentage + '%';

        // Update progress bars
        this.updateProgressBars(results.progress);

        // Update tab counts
        document.getElementById('badgeTabCount').textContent = results.breakdown.badges.count;
        document.getElementById('gameTabCount').textContent = results.breakdown.games.count;

        // Populate item lists
        this.populateBadgesList(results.breakdown.badges.items);
        this.populateGamesList(results.breakdown.games.items);

        this.showResults();
    }

    /**
     * Update progress bars
     */
    updateProgressBars(progress) {
        // Badge progress
        const badgePercentage = progress.badges.percentage;
        document.getElementById('badgeProgress').textContent = `${progress.badges.completed}/${progress.badges.total}`;
        document.getElementById('badgeProgressBar').style.width = badgePercentage + '%';

        // Game progress
        const gamePercentage = progress.games.percentage;
        document.getElementById('gameProgress').textContent = `${progress.games.completed}/${progress.games.total}`;
        document.getElementById('gameProgressBar').style.width = gamePercentage + '%';
    }

    /**
     * Populate badges list
     */
    populateBadgesList(badges) {
        const container = document.getElementById('badgesList');
        container.innerHTML = '';

        if (badges.length === 0) {
            container.innerHTML = '<p class="empty-state">No completed badges found</p>';
            return;
        }

        badges.forEach(badge => {
            const item = this.createItemElement(badge, 'badge');
            container.appendChild(item);
        });
    }

    /**
     * Populate games list
     */
    populateGamesList(games) {
        const container = document.getElementById('gamesList');
        container.innerHTML = '';

        if (games.length === 0) {
            container.innerHTML = '<p class="empty-state">No completed games found</p>';
            return;
        }

        games.forEach(game => {
            const item = this.createItemElement(game, 'game');
            container.appendChild(item);
        });
    }



    /**
     * Create item element for badges and games
     */
    createItemElement(item, type) {
        const element = document.createElement('div');
        element.className = 'item-card';

        const icon = type === 'badge' ? '🏆' : '🎮';
        const difficultyClass = `difficulty-${item.difficulty}`;
        const categoryClass = `category-${item.category}`;

        element.innerHTML = `
            <div class="item-header">
                <span class="item-icon">${icon}</span>
                <h4 class="item-title">${this.escapeHtml(item.title)}</h4>
            </div>
            <div class="item-details">
                <span class="item-category ${categoryClass}">${this.formatCategory(item.category)}</span>
                <span class="item-difficulty ${difficultyClass}">${this.formatDifficulty(item.difficulty)}</span>
            </div>
        `;

        return element;
    }



    /**
     * Format category name for display
     */
    formatCategory(category) {
        return category.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }

    /**
     * Format difficulty name for display
     */
    formatDifficulty(difficulty) {
        return difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
    }



    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * UI State Management Methods
     */

    showLoading() {
        this.hideAllSections();
        document.getElementById('loadingSection').style.display = 'block';
    }

    hideLoading() {
        document.getElementById('loadingSection').style.display = 'none';
    }

    updateLoadingStatus(message) {
        document.getElementById('loadingStatus').textContent = message;
    }

    showError(message) {
        this.hideAllSections();
        document.getElementById('errorMessage').textContent = message;
        document.getElementById('errorSection').style.display = 'block';
    }

    hideError() {
        document.getElementById('errorSection').style.display = 'none';
    }

    showResults() {
        this.hideAllSections();
        document.getElementById('resultsSection').style.display = 'block';
    }

    showInputSection() {
        this.hideAllSections();
        document.querySelector('.input-section').style.display = 'block';
    }

    hideAllSections() {
        const sections = ['loadingSection', 'errorSection', 'resultsSection'];
        sections.forEach(sectionId => {
            document.getElementById(sectionId).style.display = 'none';
        });
    }



    /**
     * Format date for display
     */
    formatDate(dateString) {
        if (!dateString) return 'N/A';
        
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch (error) {
            return 'Invalid Date';
        }
    }

    resetForm() {
        document.getElementById('profileForm').reset();
        this.currentResults = null;
        
        this.showInputSection();
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new SkillsBoostCalculator();
});