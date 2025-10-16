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
        console.log('🚀 Google Cloud Skills Boost Calculator initialized');
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

        // URL input validation
        document.getElementById('profileUrl').addEventListener('input', (e) => {
            this.validateProfileUrl(e.target);
        });

        // Note: Analytics event listeners are bound in analytics.js module
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
     * Validate profile URL format
     */
    validateProfileUrl(input) {
        const url = input.value.trim();
        const isValid = this.isValidProfileUrl(url);
        
        if (url && !isValid) {
            input.setCustomValidity('Please enter a valid Google Cloud Skills Boost profile URL');
        } else {
            input.setCustomValidity('');
        }
    }

    /**
     * Check if URL is a valid profile URL
     */
    isValidProfileUrl(url) {
        if (!url) return false;
        
        const pattern = /^https?:\/\/(www\.)?cloudskillsboost\.google\/public_profiles\/[a-zA-Z0-9\-_]+/i;
        return pattern.test(url);
    }

    /**
     * Main function to calculate points
     */
    async calculatePoints() {
        const profileUrl = document.getElementById('profileUrl').value.trim();

        if (!profileUrl) {
            this.showError('Please enter a profile URL');
            return;
        }

        if (!this.isValidProfileUrl(profileUrl)) {
            this.showError('Please enter a valid Google Cloud Skills Boost profile URL');
            return;
        }

        try {
            this.showLoading();
            this.updateLoadingStatus('Verifying enrollment...');

            const response = await fetch(`${this.apiBaseUrl}/calculate-points`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ profileUrl })
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

        } catch (error) {
            console.error('Error calculating points:', error);
            this.showError(error.message || 'An error occurred while calculating points');
        }
    }

    /**
     * Display calculation results
     */
    displayResults(results) {
        this.hideLoading();
        this.hideError();

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
    const calculator = new SkillsBoostCalculator();
    // Make calculator instance globally accessible for debugging
    window.calculator = calculator;
});