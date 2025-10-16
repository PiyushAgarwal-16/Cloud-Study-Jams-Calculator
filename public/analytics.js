/**
 * Analytics Module - Adds analytics functionality to SkillsBoostCalculator
 */

// Extend the SkillsBoostCalculator class with analytics methods
(function() {
    const originalInit = SkillsBoostCalculator.prototype.init;
    
    SkillsBoostCalculator.prototype.init = function() {
        originalInit.call(this);
        this.bindAnalyticsEvents();
    };

    SkillsBoostCalculator.prototype.bindAnalyticsEvents = function() {
        // Test mode toggle
        const testModeToggle = document.getElementById('testModeToggle');
        if (testModeToggle) {
            testModeToggle.addEventListener('change', (e) => {
                const isTestMode = e.target.checked;
                const descText = document.getElementById('analyticsParticipantCount');
                if (descText) {
                    descText.textContent = isTestMode 
                        ? 'Fetch and analyze completion data for 30 test participants'
                        : 'Fetch and analyze completion data for all 196 enrolled participants';
                }
            });
        }

        // Analytics button
        const fetchBtn = document.getElementById('fetchAnalyticsBtn');
        if (fetchBtn) {
            fetchBtn.addEventListener('click', () => {
                this.fetchAnalytics();
            });
        }

        // Export analytics buttons
        const exportJSONBtn = document.getElementById('exportAnalyticsBtn');
        if (exportJSONBtn) {
            exportJSONBtn.addEventListener('click', () => {
                this.exportAnalytics('json');
            });
        }

        const exportCSVBtn = document.getElementById('exportAnalyticsCSVBtn');
        if (exportCSVBtn) {
            exportCSVBtn.addEventListener('click', () => {
                this.exportAnalytics('csv');
            });
        }
    };

    /**
     * Fetch analytics for all participants
     */
    SkillsBoostCalculator.prototype.fetchAnalytics = async function() {
        const btn = document.getElementById('fetchAnalyticsBtn');
        const btnText = btn.querySelector('.btn-text');
        const spinner = btn.querySelector('.spinner');
        const loadingSection = document.getElementById('analyticsLoading');
        const resultsSection = document.getElementById('analyticsResults');
        const progressText = document.getElementById('analyticsProgress');
        const testModeToggle = document.getElementById('testModeToggle');
        const isTestMode = testModeToggle ? testModeToggle.checked : false;

        try {
            // Show loading state
            btn.disabled = true;
            btnText.style.display = 'none';
            spinner.style.display = 'inline-block';
            loadingSection.style.display = 'block';
            resultsSection.style.display = 'none';

            // Fetch all participants with test mode parameter
            const apiUrl = `${this.apiBaseUrl}/participants${isTestMode ? '?test=true' : ''}`;
            const participantsResponse = await fetch(apiUrl);
            if (!participantsResponse.ok) {
                throw new Error('Failed to fetch participants list');
            }

            const participantsData = await participantsResponse.json();
            const participants = participantsData.participants || [];
            const total = participants.length;

            // Fetch data for each participant
            const analyticsData = [];
            let completed = 0;

            for (const participant of participants) {
                try {
                    progressText.textContent = `Fetching participant data... (${completed}/${total})`;
                    
                    const response = await fetch(`${this.apiBaseUrl}/calculate-points`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ profileUrl: participant.profileUrl })
                    });

                    if (response.ok) {
                        const result = await response.json();
                        analyticsData.push({
                            name: result.userName || participant.name || 'Unknown',
                            profileId: participant.profileId,
                            badges: result.breakdown.badges.count || 0,
                            games: result.breakdown.games.count || 0,
                            totalItems: (result.breakdown.badges.count || 0) + (result.breakdown.games.count || 0),
                            points: result.totalPoints || 0,
                            progress: result.progress.overall.percentage || 0
                        });
                    }
                } catch (error) {
                    console.error(`Error fetching data for ${participant.name}:`, error);
                }
                
                completed++;
            }

            // Store analytics data
            this.analyticsData = analyticsData;

            // Display results
            this.displayAnalytics(analyticsData, total);

            // Hide loading, show results
            loadingSection.style.display = 'none';
            resultsSection.style.display = 'block';

        } catch (error) {
            console.error('Error fetching analytics:', error);
            alert('Failed to fetch analytics data. Please try again.');
            loadingSection.style.display = 'none';
        } finally {
            btn.disabled = false;
            btnText.style.display = 'inline';
            spinner.style.display = 'none';
        }
    };

    /**
     * Display analytics results
     */
    SkillsBoostCalculator.prototype.displayAnalytics = function(data, total) {
        // Calculate statistics
        const fullyCompleted = data.filter(p => p.totalItems >= 20).length;
        const avgBadges = (data.reduce((sum, p) => sum + p.badges, 0) / data.length).toFixed(1);
        const avgGames = (data.reduce((sum, p) => sum + p.games, 0) / data.length).toFixed(2);
        const overallProgress = (data.reduce((sum, p) => sum + p.progress, 0) / data.length).toFixed(1);
        const totalPoints = data.reduce((sum, p) => sum + p.points, 0);

        // Update summary stats
        document.getElementById('totalParticipants').textContent = total;
        document.getElementById('fullyCompleted').textContent = fullyCompleted;
        document.getElementById('avgBadges').textContent = avgBadges;
        document.getElementById('avgGames').textContent = avgGames;
        document.getElementById('overallProgress').textContent = overallProgress + '%';
        document.getElementById('totalPoints').textContent = totalPoints.toLocaleString();

        // Calculate distribution with participant names
        const complete100 = data.filter(p => p.totalItems === 20);
        const complete75 = data.filter(p => p.totalItems >= 15 && p.totalItems < 20);
        const complete50 = data.filter(p => p.totalItems >= 10 && p.totalItems < 15);
        const complete25 = data.filter(p => p.totalItems >= 5 && p.totalItems < 10);
        const complete0 = data.filter(p => p.totalItems < 5);

        // Update distribution with names
        this.updateDistribution('complete100', complete100, total);
        this.updateDistribution('complete75', complete75, total);
        this.updateDistribution('complete50', complete50, total);
        this.updateDistribution('complete25', complete25, total);
        this.updateDistribution('complete0', complete0, total);

        // Update leaderboard
        this.updateLeaderboard(data);
    };

    /**
     * Update distribution bar with participant names
     */
    SkillsBoostCalculator.prototype.updateDistribution = function(id, participantsArray, total) {
        const count = participantsArray.length;
        const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : 0;
        
        // Update count display
        document.getElementById(`${id}Count`).textContent = `${count} participants`;
        document.getElementById(`${id}Fill`).style.width = percentage + '%';
        
        // Store participants data for this category
        const barElement = document.getElementById(`${id}Fill`).parentElement;
        barElement.dataset.participants = JSON.stringify(participantsArray);
        barElement.style.cursor = count > 0 ? 'pointer' : 'default';
        
        // Add click event to show participants
        barElement.onclick = () => {
            if (count > 0) {
                this.showDistributionDetails(id, participantsArray);
            }
        };
    };

    /**
     * Show distribution details in a modal/popup
     */
    SkillsBoostCalculator.prototype.showDistributionDetails = function(categoryId, participants) {
        const categoryNames = {
            'complete100': '100% Complete (20/20 items)',
            'complete75': '75-99% Complete (15-19 items)',
            'complete50': '50-74% Complete (10-14 items)',
            'complete25': '25-49% Complete (5-9 items)',
            'complete0': '0-24% Complete (0-4 items)'
        };

        const categoryName = categoryNames[categoryId] || 'Participants';
        
        // Sort participants by name
        const sortedParticipants = [...participants].sort((a, b) => a.name.localeCompare(b.name));
        
        // Create modal HTML
        const modalHTML = `
            <div class="distribution-modal-overlay" onclick="this.remove()">
                <div class="distribution-modal" onclick="event.stopPropagation()">
                    <div class="distribution-modal-header">
                        <h3>${categoryName}</h3>
                        <button class="distribution-modal-close" onclick="this.closest('.distribution-modal-overlay').remove()">×</button>
                    </div>
                    <div class="distribution-modal-body">
                        <p class="distribution-modal-count">${participants.length} participant${participants.length !== 1 ? 's' : ''}</p>
                        <div class="distribution-participants-list">
                            ${sortedParticipants.map(p => `
                                <div class="distribution-participant-item">
                                    <div class="distribution-participant-name">${this.escapeHtml(p.name)}</div>
                                    <div class="distribution-participant-stats">
                                        🏆 ${p.badges} badges | 🎮 ${p.games} games | 📊 ${p.totalItems}/20 items
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Add modal to page
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    };

    /**
     * Update leaderboard with top 10 performers
     */
    SkillsBoostCalculator.prototype.updateLeaderboard = function(data) {
        // Sort by total items completed, then by points
        const sorted = [...data].sort((a, b) => {
            if (b.totalItems !== a.totalItems) {
                return b.totalItems - a.totalItems;
            }
            return b.points - a.points;
        });

        const top10 = sorted.slice(0, 10);
        const leaderboardList = document.getElementById('leaderboardList');
        leaderboardList.innerHTML = '';

        top10.forEach((participant, index) => {
            const rank = index + 1;
            let rankClass = '';
            if (rank === 1) rankClass = 'gold';
            else if (rank === 2) rankClass = 'silver';
            else if (rank === 3) rankClass = 'bronze';

            const item = document.createElement('div');
            item.className = 'leaderboard-item';
            item.innerHTML = `
                <div class="leaderboard-rank ${rankClass}">#${rank}</div>
                <div class="leaderboard-info">
                    <div class="leaderboard-name">${this.escapeHtml(participant.name)}</div>
                    <div class="leaderboard-stats">
                        🏆 ${participant.badges} badges | 🎮 ${participant.games} games | ⭐ ${participant.points.toLocaleString()} points
                    </div>
                </div>
                <div class="leaderboard-progress">${participant.totalItems}/20</div>
            `;
            leaderboardList.appendChild(item);
        });
    };

    /**
     * Export analytics data
     */
    SkillsBoostCalculator.prototype.exportAnalytics = function(format) {
        if (!this.analyticsData || this.analyticsData.length === 0) {
            alert('No analytics data to export. Please fetch data first.');
            return;
        }

        if (format === 'json') {
            this.exportAsJSON();
        } else if (format === 'csv') {
            this.exportAsCSV();
        }
    };

    /**
     * Export analytics as JSON
     */
    SkillsBoostCalculator.prototype.exportAsJSON = function() {
        const exportData = {
            generatedAt: new Date().toISOString(),
            totalParticipants: this.analyticsData.length,
            participants: this.analyticsData
        };

        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `analytics-${new Date().toISOString().split('T')[0]}.json`;
        link.click();

        URL.revokeObjectURL(link.href);
    };

    /**
     * Export analytics as CSV
     */
    SkillsBoostCalculator.prototype.exportAsCSV = function() {
        const headers = ['Name', 'Profile ID', 'Badges Completed', 'Games Completed', 'Total Items', 'Points', 'Progress %'];
        const rows = this.analyticsData.map(p => [
            p.name,
            p.profileId,
            p.badges,
            p.games,
            p.totalItems,
            p.points,
            p.progress
        ]);

        let csv = headers.join(',') + '\n';
        rows.forEach(row => {
            csv += row.map(cell => `"${cell}"`).join(',') + '\n';
        });

        const dataBlob = new Blob([csv], { type: 'text/csv' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `analytics-${new Date().toISOString().split('T')[0]}.csv`;
        link.click();

        URL.revokeObjectURL(link.href);
    };
})();
