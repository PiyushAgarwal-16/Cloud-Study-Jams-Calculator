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

        // Date filter buttons
        const applyDateFilterBtn = document.getElementById('applyDateFilterBtn');
        if (applyDateFilterBtn) {
            applyDateFilterBtn.addEventListener('click', () => {
                this.applyDateFilter();
            });
        }

        const clearDateFilterBtn = document.getElementById('clearDateFilterBtn');
        if (clearDateFilterBtn) {
            clearDateFilterBtn.addEventListener('click', () => {
                this.clearDateFilter();
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
            const failedProfiles = [];
            const privateProfiles = [];
            let completed = 0;
            
            console.log(`📊 Starting analytics fetch for ${total} participants...`);

            for (const participant of participants) {
                try {
                    progressText.textContent = `Fetching participant data... (${completed + 1}/${total})`;
                    console.log(`Fetching [${completed + 1}/${total}]: ${participant.name} (${participant.profileId})`);
                    
                    const response = await fetch(`${this.apiBaseUrl}/calculate-points`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ profileUrl: participant.profileUrl })
                    });

                    if (response.ok) {
                        const result = await response.json();
                        const itemCount = (result.breakdown.badges.count || 0) + (result.breakdown.games.count || 0);
                        console.log(`  ✅ ${result.userName}: ${result.breakdown.badges.count || 0} badges, ${result.breakdown.games.count || 0} games (${itemCount}/20)`);
                        analyticsData.push({
                            name: result.userName || participant.name || 'Unknown',
                            profileId: participant.profileId,
                            profileUrl: participant.profileUrl,
                            badges: result.breakdown.badges.count || 0,
                            games: result.breakdown.games.count || 0,
                            totalItems: itemCount,
                            points: result.totalPoints || 0,
                            progress: result.progress.overall.percentage || 0,
                            detailedBadges: result.detailedBadges || [],
                            detailedGames: result.detailedGames || [],
                            status: 'success'
                        });
                    } else {
                        // Add with zero counts if API returns error
                        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                        console.warn(`⚠️ Failed to fetch ${participant.name} (${participant.profileId}):`, errorData.error);
                        
                        // Check if error is due to private profile
                        const isPrivate = errorData.error && (
                            errorData.error.includes('PROFILE_PRIVATE') || 
                            errorData.error.includes('private') ||
                            errorData.error.includes('Private profile')
                        );
                        
                        analyticsData.push({
                            name: participant.name || 'Unknown',
                            profileId: participant.profileId,
                            profileUrl: participant.profileUrl,
                            badges: 0,
                            games: 0,
                            totalItems: 0,
                            points: 0,
                            progress: 0,
                            status: isPrivate ? 'private' : 'error',
                            error: errorData.error
                        });
                        
                        if (isPrivate) {
                            privateProfiles.push({
                                name: participant.name || 'Unknown',
                                profileId: participant.profileId,
                                profileUrl: participant.profileUrl
                            });
                        } else {
                            failedProfiles.push(participant.name || participant.profileId);
                        }
                    }
                } catch (error) {
                    console.error(`❌ Error fetching data for ${participant.name} (${participant.profileId}):`, error.message);
                    
                    // Check if error is due to private profile
                    const isPrivate = error.message && (
                        error.message.includes('PROFILE_PRIVATE') || 
                        error.message.includes('private') ||
                        error.message.includes('Private profile')
                    );
                    
                    // Add with zero counts if network error
                    analyticsData.push({
                        name: participant.name || 'Unknown',
                        profileId: participant.profileId,
                        profileUrl: participant.profileUrl,
                        badges: 0,
                        games: 0,
                        totalItems: 0,
                        points: 0,
                        progress: 0,
                        status: isPrivate ? 'private' : 'error',
                        error: error.message
                    });
                    
                    if (isPrivate) {
                        privateProfiles.push({
                            name: participant.name || 'Unknown',
                            profileId: participant.profileId,
                            profileUrl: participant.profileUrl
                        });
                    } else {
                        failedProfiles.push(participant.name || participant.profileId);
                    }
                }
                
                completed++;
            }

            // Store analytics data
            this.analyticsData = analyticsData;
            this.privateProfiles = privateProfiles; // Store private profiles separately
            
            // Store failed profiles with full details
            this.failedProfiles = analyticsData.filter(p => p.status === 'error').map(p => ({
                name: p.name,
                profileId: p.profileId,
                profileUrl: p.profileUrl,
                error: p.error || 'Unknown error'
            }));

            // Log summary
            console.log(`✅ Successfully fetched: ${analyticsData.filter(p => p.status === 'success').length}/${total}`);
            if (privateProfiles.length > 0) {
                console.warn(`🔒 Private profiles (${privateProfiles.length}):`, privateProfiles.map(p => p.name));
            }
            if (this.failedProfiles.length > 0) {
                console.warn(`⚠️ Failed profiles (${this.failedProfiles.length}):`, this.failedProfiles);
            }

            // Display results
            this.displayAnalytics(analyticsData, total);

            // Hide loading, show results
            loadingSection.style.display = 'none';
            resultsSection.style.display = 'block';

            // Show date filter section
            const dateFilterSection = document.getElementById('dateFilterSection');
            if (dateFilterSection) {
                dateFilterSection.style.display = 'block';
            }

            // Always show private profiles status (even if none)
            this.displayPrivateProfilesStatus(privateProfiles);

            // Show failed profiles status (even if none)
            this.displayFailedProfilesStatus(this.failedProfiles);

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
        document.getElementById('analyticsOverallProgress').textContent = overallProgress + '%';
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
     * Display status for private profiles (warning if any, success message if none)
     */
    SkillsBoostCalculator.prototype.displayPrivateProfilesStatus = function(privateProfiles) {
        const resultsSection = document.getElementById('analyticsResults');
        if (!resultsSection) return;

        // Remove any existing private profiles status
        const existingStatus = document.getElementById('privateProfilesStatus');
        if (existingStatus) {
            existingStatus.remove();
        }

        // Create status card
        const statusCard = document.createElement('div');
        statusCard.id = 'privateProfilesStatus';
        
        if (privateProfiles.length === 0) {
            // No private profiles - show success message
            statusCard.className = 'analytics-success-card';
            statusCard.innerHTML = `
                <div class="success-header">
                    <span class="success-icon">✅</span>
                    <h3>All Profiles Accessible</h3>
                </div>
                <div class="success-body">
                    <p>Great! All participant profiles are public and accessible for tracking.</p>
                </div>
            `;
        } else {
            // Private profiles detected - show warning
            statusCard.className = 'analytics-warning-card private-profiles-card';
            statusCard.innerHTML = `
                <div class="warning-header">
                    <span class="warning-icon">🔒</span>
                    <h3>Private Profiles Detected</h3>
                </div>
                <div class="warning-body">
                    <p><strong>${privateProfiles.length} participant${privateProfiles.length !== 1 ? 's have' : ' has'} made their profile${privateProfiles.length !== 1 ? 's' : ''} private.</strong></p>
                    <p>These profiles cannot be accessed and their progress cannot be tracked.</p>
                    
                    <div class="private-profiles-list">
                        <h4>Private Profiles (${privateProfiles.length}):</h4>
                        <ul class="private-profiles-items">
                            ${privateProfiles.map(p => `
                                <li class="private-profile-item">
                                    <span class="private-profile-name">${this.escapeHtml(p.name)}</span>
                                    <span class="private-profile-id">${p.profileId}</span>
                                    <a href="${p.profileUrl}" target="_blank" class="private-profile-link" title="Attempt to view profile">🔗</a>
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                    
                    <div class="warning-actions">
                        <button class="btn btn-secondary" onclick="this.closest('.analytics-warning-card').classList.toggle('collapsed')">
                            <span class="toggle-text">Collapse</span>
                        </button>
                        <button class="btn btn-outline" onclick="navigator.clipboard.writeText(${JSON.stringify(privateProfiles.map(p => p.name).join(', '))}).then(() => alert('Private profile names copied to clipboard!'))">
                            📋 Copy Names
                        </button>
                    </div>
                </div>
            `;
        }
        
        // Insert at the top of results section
        resultsSection.insertBefore(statusCard, resultsSection.firstChild);
    };

    /**
     * Display status for failed profile fetches (error if any, success message if none)
     */
    SkillsBoostCalculator.prototype.displayFailedProfilesStatus = function(failedProfiles) {
        const resultsSection = document.getElementById('analyticsResults');
        if (!resultsSection) return;

        // Remove any existing failed profiles status
        const existingStatus = document.getElementById('failedProfilesStatus');
        if (existingStatus) {
            existingStatus.remove();
        }

        // Create status card
        const statusCard = document.createElement('div');
        statusCard.id = 'failedProfilesStatus';
        
        if (failedProfiles.length === 0) {
            // No failed profiles - show success message
            statusCard.className = 'analytics-success-card';
            statusCard.innerHTML = `
                <div class="success-header">
                    <span class="success-icon">✅</span>
                    <h3>All Profiles Fetched Successfully</h3>
                </div>
                <div class="success-body">
                    <p>Excellent! All participant profiles were fetched without errors.</p>
                </div>
            `;
        } else {
            // Failed profiles detected - show error details
            statusCard.className = 'analytics-error-card failed-profiles-card';
            statusCard.innerHTML = `
                <div class="error-header">
                    <span class="error-icon">⚠️</span>
                    <h3>Profile Fetch Errors</h3>
                </div>
                <div class="error-body">
                    <p><strong>${failedProfiles.length} profile${failedProfiles.length !== 1 ? 's' : ''} could not be fetched due to errors.</strong></p>
                    <p>These profiles encountered technical issues and could not be analyzed.</p>
                    
                    <div class="failed-profiles-list">
                        <h4>Failed Profiles (${failedProfiles.length}):</h4>
                        <ul class="failed-profiles-items">
                            ${failedProfiles.map(p => `
                                <li class="failed-profile-item">
                                    <div class="failed-profile-header">
                                        <span class="failed-profile-name">${this.escapeHtml(p.name)}</span>
                                        <span class="failed-profile-id">${p.profileId}</span>
                                        <a href="${p.profileUrl}" target="_blank" class="failed-profile-link" title="Attempt to view profile">🔗</a>
                                    </div>
                                    <div class="failed-profile-error">
                                        <span class="error-label">Error:</span> ${this.escapeHtml(p.error)}
                                    </div>
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                    
                    <div class="error-actions">
                        <button class="btn btn-secondary" onclick="this.closest('.analytics-error-card').classList.toggle('collapsed')">
                            <span class="toggle-text">Collapse</span>
                        </button>
                        <button class="btn btn-outline" onclick="navigator.clipboard.writeText(${JSON.stringify(failedProfiles.map(p => `${p.name} (${p.profileId}): ${p.error}`).join('\\n'))}).then(() => alert('Failed profile details copied to clipboard!'))">
                            📋 Copy Details
                        </button>
                        <button class="btn btn-outline" onclick="navigator.clipboard.writeText(${JSON.stringify(failedProfiles.map(p => p.name).join(', '))}).then(() => alert('Failed profile names copied to clipboard!'))">
                            📋 Copy Names
                        </button>
                    </div>
                </div>
            `;
        }
        
        // Insert after private profiles status if it exists, otherwise at the top
        const privateProfilesStatus = document.getElementById('privateProfilesStatus');
        if (privateProfilesStatus && privateProfilesStatus.nextSibling) {
            resultsSection.insertBefore(statusCard, privateProfilesStatus.nextSibling);
        } else if (privateProfilesStatus) {
            privateProfilesStatus.parentNode.insertBefore(statusCard, privateProfilesStatus.nextSibling);
        } else {
            resultsSection.insertBefore(statusCard, resultsSection.firstChild);
        }
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
            privateProfiles: this.privateProfiles || [],
            privateProfilesCount: (this.privateProfiles || []).length,
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
        const headers = ['Name', 'Profile ID', 'Badges Completed', 'Games Completed', 'Total Items', 'Points', 'Progress %', 'Status'];
        const rows = this.analyticsData.map(p => [
            p.name,
            p.profileId,
            p.badges,
            p.games,
            p.totalItems,
            p.points,
            p.progress,
            p.status === 'private' ? 'PRIVATE PROFILE' : (p.status === 'error' ? 'ERROR' : 'OK')
        ]);

        let csv = headers.join(',') + '\n';
        rows.forEach(row => {
            csv += row.map(cell => `"${cell}"`).join(',') + '\n';
        });
        
        // Add private profiles section if any
        if (this.privateProfiles && this.privateProfiles.length > 0) {
            csv += '\n\n';
            csv += 'Private Profiles:\n';
            csv += 'Name,Profile ID,Profile URL\n';
            this.privateProfiles.forEach(p => {
                csv += `"${p.name}","${p.profileId}","${p.profileUrl}"\n`;
            });
        }

        const dataBlob = new Blob([csv], { type: 'text/csv' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `analytics-${new Date().toISOString().split('T')[0]}.csv`;
        link.click();

        URL.revokeObjectURL(link.href);
    };

    /**
     * Apply date filter to find participants with completions after selected date
     */
    SkillsBoostCalculator.prototype.applyDateFilter = function() {
        const dateInput = document.getElementById('completionDateFilter');
        const filterTypeSelect = document.getElementById('filterTypeSelect');
        const selectedDate = dateInput.value;
        const filterType = filterTypeSelect.value;

        if (!selectedDate) {
            alert('Please select a date to filter by');
            return;
        }

        if (!this.analyticsData || this.analyticsData.length === 0) {
            alert('Please fetch analytics data first');
            return;
        }

        const filterDate = new Date(selectedDate);
        filterDate.setHours(0, 0, 0, 0);

        console.log(`🔍 Filtering participants: ${filterType} after ${selectedDate}`);

        let filteredParticipants = [];

        switch (filterType) {
            case 'all':
                filteredParticipants = this.filterAllItems(filterDate);
                break;
            case 'badges':
                filteredParticipants = this.filterBadgesOnly(filterDate);
                break;
            case 'games':
                filteredParticipants = this.filterGamesOnly(filterDate);
                break;
            case 'allBadges':
                filteredParticipants = this.filterAllBadgesCompleted(filterDate);
                break;
            case 'allGames':
                filteredParticipants = this.filterAllGamesCompleted(filterDate);
                break;
            case '100percent':
                filteredParticipants = this.filter100PercentAfterDate(filterDate);
                break;
        }

        console.log(`Found ${filteredParticipants.length} participants matching criteria`);

        // Display filtered results
        this.displayDateFilterResults(filteredParticipants, selectedDate, filterType);
    };

    /**
     * Filter participants with any completions (badges or games) after date
     */
    SkillsBoostCalculator.prototype.filterAllItems = function(filterDate) {
        const filtered = [];

        this.analyticsData.forEach(participant => {
            if (participant.status !== 'success') return;

            const completionsAfterDate = [];
            const detailedBadges = participant.detailedBadges || [];
            const detailedGames = participant.detailedGames || [];

            // Check badges
            detailedBadges.forEach(badge => {
                if (badge.isCompleted && badge.earnedDate) {
                    const earnedDate = new Date(badge.earnedDate);
                    if (earnedDate > filterDate) {
                        completionsAfterDate.push({
                            type: 'badge',
                            title: badge.normalizedTitle || badge.originalTitle,
                            date: badge.earnedDate
                        });
                    }
                }
            });

            // Check games
            detailedGames.forEach(game => {
                if (game.isCompleted && game.completedDate) {
                    const completedDate = new Date(game.completedDate);
                    if (completedDate > filterDate) {
                        completionsAfterDate.push({
                            type: 'game',
                            title: game.normalizedTitle || game.originalTitle,
                            date: game.completedDate
                        });
                    }
                }
            });

            if (completionsAfterDate.length > 0) {
                filtered.push({
                    name: participant.name,
                    profileId: participant.profileId,
                    profileUrl: participant.profileUrl,
                    completions: completionsAfterDate,
                    totalCompletionsAfterDate: completionsAfterDate.length,
                    badgeCount: completionsAfterDate.filter(c => c.type === 'badge').length,
                    gameCount: completionsAfterDate.filter(c => c.type === 'game').length
                });
            }
        });

        return filtered;
    };

    /**
     * Filter participants with badge completions after date
     */
    SkillsBoostCalculator.prototype.filterBadgesOnly = function(filterDate) {
        const filtered = [];

        this.analyticsData.forEach(participant => {
            if (participant.status !== 'success') return;

            const badgesAfterDate = [];
            const detailedBadges = participant.detailedBadges || [];

            detailedBadges.forEach(badge => {
                if (badge.isCompleted && badge.earnedDate) {
                    const earnedDate = new Date(badge.earnedDate);
                    if (earnedDate > filterDate) {
                        badgesAfterDate.push({
                            type: 'badge',
                            title: badge.normalizedTitle || badge.originalTitle,
                            date: badge.earnedDate
                        });
                    }
                }
            });

            if (badgesAfterDate.length > 0) {
                filtered.push({
                    name: participant.name,
                    profileId: participant.profileId,
                    profileUrl: participant.profileUrl,
                    completions: badgesAfterDate,
                    totalCompletionsAfterDate: badgesAfterDate.length,
                    badgeCount: badgesAfterDate.length,
                    gameCount: 0
                });
            }
        });

        return filtered;
    };

    /**
     * Filter participants with game completions after date
     */
    SkillsBoostCalculator.prototype.filterGamesOnly = function(filterDate) {
        const filtered = [];

        this.analyticsData.forEach(participant => {
            if (participant.status !== 'success') return;

            const gamesAfterDate = [];
            const detailedGames = participant.detailedGames || [];

            detailedGames.forEach(game => {
                if (game.isCompleted && game.completedDate) {
                    const completedDate = new Date(game.completedDate);
                    if (completedDate > filterDate) {
                        gamesAfterDate.push({
                            type: 'game',
                            title: game.normalizedTitle || game.originalTitle,
                            date: game.completedDate
                        });
                    }
                }
            });

            if (gamesAfterDate.length > 0) {
                filtered.push({
                    name: participant.name,
                    profileId: participant.profileId,
                    profileUrl: participant.profileUrl,
                    completions: gamesAfterDate,
                    totalCompletionsAfterDate: gamesAfterDate.length,
                    badgeCount: 0,
                    gameCount: gamesAfterDate.length
                });
            }
        });

        return filtered;
    };

    /**
     * Filter participants who completed all 19 skill badges after date
     */
    SkillsBoostCalculator.prototype.filterAllBadgesCompleted = function(filterDate) {
        const filtered = [];

        this.analyticsData.forEach(participant => {
            if (participant.status !== 'success') return;

            const detailedBadges = participant.detailedBadges || [];
            const completedBadges = detailedBadges.filter(b => b.isCompleted);

            // Check if all 19 badges are completed
            if (completedBadges.length >= 19) {
                // Find the latest badge completion date
                const badgeDates = completedBadges
                    .filter(b => b.earnedDate)
                    .map(b => new Date(b.earnedDate))
                    .sort((a, b) => b - a);

                if (badgeDates.length > 0) {
                    const latestBadgeDate = badgeDates[0];
                    
                    // Check if the latest (19th) badge was completed after the filter date
                    if (latestBadgeDate > filterDate) {
                        // Find which badges were completed after the date
                        const badgesAfterDate = completedBadges.filter(badge => {
                            if (badge.earnedDate) {
                                const earnedDate = new Date(badge.earnedDate);
                                return earnedDate > filterDate;
                            }
                            return false;
                        }).map(badge => ({
                            type: 'badge',
                            title: badge.normalizedTitle || badge.originalTitle,
                            date: badge.earnedDate
                        }));

                        filtered.push({
                            name: participant.name,
                            profileId: participant.profileId,
                            profileUrl: participant.profileUrl,
                            completions: badgesAfterDate,
                            totalCompletionsAfterDate: badgesAfterDate.length,
                            badgeCount: badgesAfterDate.length,
                            gameCount: 0,
                            completedAllBadges: true,
                            latestCompletionDate: latestBadgeDate
                        });
                    }
                }
            }
        });

        return filtered;
    };

    /**
     * Filter participants who completed the game after date
     */
    SkillsBoostCalculator.prototype.filterAllGamesCompleted = function(filterDate) {
        const filtered = [];

        this.analyticsData.forEach(participant => {
            if (participant.status !== 'success') return;

            const detailedGames = participant.detailedGames || [];
            const completedGames = detailedGames.filter(g => g.isCompleted);

            // Check if the game is completed
            if (completedGames.length >= 1) {
                // Find the latest game completion date
                const gameDates = completedGames
                    .filter(g => g.completedDate)
                    .map(g => new Date(g.completedDate))
                    .sort((a, b) => b - a);

                if (gameDates.length > 0) {
                    const latestGameDate = gameDates[0];
                    
                    // Check if the game was completed after the filter date
                    if (latestGameDate > filterDate) {
                        // Find which games were completed after the date
                        const gamesAfterDate = completedGames.filter(game => {
                            if (game.completedDate) {
                                const completedDate = new Date(game.completedDate);
                                return completedDate > filterDate;
                            }
                            return false;
                        }).map(game => ({
                            type: 'game',
                            title: game.normalizedTitle || game.originalTitle,
                            date: game.completedDate
                        }));

                        filtered.push({
                            name: participant.name,
                            profileId: participant.profileId,
                            profileUrl: participant.profileUrl,
                            completions: gamesAfterDate,
                            totalCompletionsAfterDate: gamesAfterDate.length,
                            badgeCount: 0,
                            gameCount: gamesAfterDate.length,
                            completedAllGames: true,
                            latestCompletionDate: latestGameDate
                        });
                    }
                }
            }
        });

        return filtered;
    };

    /**
     * Filter participants who reached 100% completion (all 19 badges + 1 game) after the specified date
     * A participant is included if they completed the final item needed to reach 100% after the filter date
     */
    SkillsBoostCalculator.prototype.filter100PercentAfterDate = function(filterDate) {
        const filtered = [];

        this.analyticsData.forEach(participant => {
            if (participant.status !== 'success') return;

            const detailedBadges = participant.detailedBadges || [];
            const detailedGames = participant.detailedGames || [];
            
            const completedBadges = detailedBadges.filter(b => b.isCompleted);
            const completedGames = detailedGames.filter(g => g.isCompleted);

            // Check if participant has 100% completion (19 badges + 1 game = 20 items)
            if (completedBadges.length >= 19 && completedGames.length >= 1) {
                // Collect all completion dates
                const allCompletions = [];

                completedBadges.forEach(badge => {
                    if (badge.earnedDate) {
                        allCompletions.push({
                            type: 'badge',
                            title: badge.normalizedTitle || badge.originalTitle,
                            date: new Date(badge.earnedDate),
                            dateString: badge.earnedDate
                        });
                    }
                });

                completedGames.forEach(game => {
                    if (game.completedDate) {
                        allCompletions.push({
                            type: 'game',
                            title: game.normalizedTitle || game.originalTitle,
                            date: new Date(game.completedDate),
                            dateString: game.completedDate
                        });
                    }
                });

                // Sort by date to find when 100% was reached
                allCompletions.sort((a, b) => a.date - b.date);

                // The date when 100% was reached is when the 20th item was completed
                if (allCompletions.length >= 20) {
                    const completionDate = allCompletions[19].date; // 20th item (index 19)
                    const completionItem = allCompletions[19];

                    // Check if 100% was reached after the filter date
                    if (completionDate > filterDate) {
                        // Find all completions that happened after the filter date
                        const completionsAfterDate = allCompletions
                            .filter(c => c.date > filterDate)
                            .map(c => ({
                                type: c.type,
                                title: c.title,
                                date: c.dateString
                            }));

                        // Count items completed before and after the date
                        const itemsBeforeDate = allCompletions.filter(c => c.date <= filterDate).length;
                        const itemsAfterDate = completionsAfterDate.length;

                        filtered.push({
                            name: participant.name,
                            profileId: participant.profileId,
                            profileUrl: participant.profileUrl,
                            completions: completionsAfterDate,
                            totalCompletionsAfterDate: itemsAfterDate,
                            badgeCount: completionsAfterDate.filter(c => c.type === 'badge').length,
                            gameCount: completionsAfterDate.filter(c => c.type === 'game').length,
                            reached100Percent: true,
                            completionDate: completionDate,
                            completionDateString: completionItem.dateString,
                            finalItem: {
                                type: completionItem.type,
                                title: completionItem.title
                            },
                            itemsBeforeDate: itemsBeforeDate,
                            itemsAfterDate: itemsAfterDate
                        });
                    }
                }
            }
        });

        return filtered;
    };

    /**
     * Display date filter results
     */
    SkillsBoostCalculator.prototype.displayDateFilterResults = function(participants, filterDate, filterType) {
        const resultsContainer = document.getElementById('dateFilterResults');
        const titleElement = document.getElementById('dateFilterTitle');
        const summaryElement = document.getElementById('dateFilterSummary');
        const listElement = document.getElementById('dateFilterList');
        const clearBtn = document.getElementById('clearDateFilterBtn');

        if (!resultsContainer || !titleElement || !listElement) return;

        // Format date
        const formattedDate = new Date(filterDate).toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });

        // Get filter type description
        const filterDescriptions = {
            'all': 'with any completions (badges or game)',
            'badges': 'who completed skill badges',
            'games': 'who completed the game',
            'allBadges': 'who completed ALL 19 skill badges',
            'allGames': 'who completed the game',
            '100percent': 'who reached 100% completion (19 badges + 1 game)'
        };

        // Update title
        titleElement.textContent = `${participants.length} participant(s) ${filterDescriptions[filterType]} after ${formattedDate}`;

        // Calculate summary statistics
        const totalBadges = participants.reduce((sum, p) => sum + (p.badgeCount || 0), 0);
        const totalGames = participants.reduce((sum, p) => sum + (p.gameCount || 0), 0);
        const totalCompletions = participants.reduce((sum, p) => sum + p.totalCompletionsAfterDate, 0);

        // Display summary
        if (summaryElement) {
            let summaryHTML = `<p><strong>Summary:</strong></p>`;
            summaryHTML += `<p>📊 Total Participants: <strong>${participants.length}</strong></p>`;
            
            if (filterType === '100percent') {
                summaryHTML += `<p>🎯 All reached 100% completion after the cutoff date</p>`;
                summaryHTML += `<p>✅ Total Completions After Date: <strong>${totalCompletions}</strong></p>`;
                summaryHTML += `<p>🏆 Skill Badges After Date: <strong>${totalBadges}</strong></p>`;
                summaryHTML += `<p>🎮 Games After Date: <strong>${totalGames}</strong></p>`;
            } else {
                summaryHTML += `<p>✅ Total Completions: <strong>${totalCompletions}</strong></p>`;
                
                if (filterType === 'all' || filterType === 'badges' || filterType === 'allBadges') {
                    summaryHTML += `<p>🏆 Skill Badges: <strong>${totalBadges}</strong></p>`;
                }
                if (filterType === 'all' || filterType === 'games' || filterType === 'allGames') {
                    summaryHTML += `<p>🎮 Games: <strong>${totalGames}</strong></p>`;
                }
            }

            summaryElement.innerHTML = summaryHTML;
        }

        // Clear previous results
        listElement.innerHTML = '';

        if (participants.length === 0) {
            listElement.innerHTML = '<div class="date-filter-empty">No participants found matching the selected criteria.</div>';
        } else {
            // Sort by latest completion date (most recent first)
            participants.sort((a, b) => {
                // For 100% filter, use the specific completion date
                if (filterType === '100percent' && a.completionDate && b.completionDate) {
                    return new Date(b.completionDate) - new Date(a.completionDate);
                }
                
                const aDate = a.latestCompletionDate || new Date(Math.max(...a.completions.map(c => new Date(c.date))));
                const bDate = b.latestCompletionDate || new Date(Math.max(...b.completions.map(c => new Date(c.date))));
                return bDate - aDate;
            });

            participants.forEach(participant => {
                const itemDiv = document.createElement('div');
                itemDiv.className = 'date-filter-item';

                const badgeCount = participant.badgeCount || 0;
                const gameCount = participant.gameCount || 0;

                // Get the most recent completion date
                const dates = participant.completions.map(c => new Date(c.date));
                const latestDate = new Date(Math.max(...dates));
                const formattedLatestDate = latestDate.toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric',
                    year: 'numeric'
                });

                // Build details text based on filter type
                let detailsText = '';
                if (filterType === '100percent' && participant.reached100Percent) {
                    const completionDateFormatted = new Date(participant.completionDate).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric',
                        year: 'numeric'
                    });
                    detailsText = `🎯 Reached 100% on ${completionDateFormatted} • Final item: ${participant.finalItem.title} (${participant.finalItem.type}) • Had ${participant.itemsBeforeDate}/20 before cutoff`;
                } else if (filterType === 'allBadges' && participant.completedAllBadges) {
                    detailsText = `✅ Completed all 19 badges • ${badgeCount} after selected date • Latest: ${formattedLatestDate}`;
                } else if (filterType === 'allGames' && participant.completedAllGames) {
                    detailsText = `✅ Completed the game • Latest: ${formattedLatestDate}`;
                } else if (filterType === 'badges') {
                    detailsText = `${badgeCount} badge${badgeCount !== 1 ? 's' : ''} • Latest: ${formattedLatestDate}`;
                } else if (filterType === 'games') {
                    detailsText = `${gameCount} game${gameCount !== 1 ? 's' : ''} • Latest: ${formattedLatestDate}`;
                } else {
                    detailsText = `${badgeCount} badge${badgeCount !== 1 ? 's' : ''}, ${gameCount} game${gameCount !== 1 ? 's' : ''} • Latest: ${formattedLatestDate}`;
                }

                itemDiv.innerHTML = `
                    <div class="date-filter-item-info">
                        <div class="date-filter-item-name">
                            ${participant.name}
                            <a href="${participant.profileUrl}" target="_blank" class="profile-link" title="View profile">🔗</a>
                        </div>
                        <div class="date-filter-item-details">${detailsText}</div>
                    </div>
                    <div class="date-filter-item-badge">
                        ${participant.totalCompletionsAfterDate} new
                    </div>
                `;

                // Prevent profile link click from triggering modal
                const profileLink = itemDiv.querySelector('.profile-link');
                if (profileLink) {
                    profileLink.addEventListener('click', (e) => {
                        e.stopPropagation();
                    });
                }

                // Add click event to show details
                itemDiv.style.cursor = 'pointer';
                itemDiv.addEventListener('click', () => {
                    this.showParticipantCompletionDetails(participant, filterType);
                });

                listElement.appendChild(itemDiv);
            });
        }

        // Show results and clear button
        resultsContainer.style.display = 'block';
        if (clearBtn) {
            clearBtn.style.display = 'inline-block';
        }

        // Scroll to results
        resultsContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    };

    /**
     * Show detailed completion information for a participant
     */
    SkillsBoostCalculator.prototype.showParticipantCompletionDetails = function(participant, filterType) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.display = 'flex';

        // Sort completions by date (most recent first)
        const sortedCompletions = participant.completions.sort((a, b) => 
            new Date(b.date) - new Date(a.date)
        );

        const completionsList = sortedCompletions.map(completion => {
            const date = new Date(completion.date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
            const icon = completion.type === 'badge' ? '🏆' : '🎮';
            return `<li><strong>${icon} ${completion.title}</strong><br><small>Completed: ${date}</small></li>`;
        }).join('');

        // Build modal title based on filter type
        let modalTitle = `📅 ${participant.name}`;
        let subtitle = `Recent completions (${participant.totalCompletionsAfterDate} items)`;

        if (filterType === 'allBadges' && participant.completedAllBadges) {
            subtitle = `✅ Completed all 19 skill badges (${participant.totalCompletionsAfterDate} after selected date)`;
        } else if (filterType === 'allGames' && participant.completedAllGames) {
            subtitle = `✅ Completed the game`;
        } else if (filterType === 'badges') {
            subtitle = `🏆 Skill badges completed (${participant.totalCompletionsAfterDate} items)`;
        } else if (filterType === 'games') {
            subtitle = `🎮 Games completed (${participant.totalCompletionsAfterDate} items)`;
        }

        modal.innerHTML = `
            <div class="modal-content">
                <span class="modal-close">&times;</span>
                <h3>${modalTitle} <a href="${participant.profileUrl}" target="_blank" style="font-size: 0.8em; text-decoration: none;" title="View profile">🔗</a></h3>
                <p style="color: var(--gray-600); margin-bottom: 1rem;">
                    ${subtitle}
                </p>
                <ul style="list-style: none; padding: 0; max-height: 400px; overflow-y: auto;">
                    ${completionsList}
                </ul>
            </div>
        `;

        document.body.appendChild(modal);

        // Close modal handlers
        const closeBtn = modal.querySelector('.modal-close');
        closeBtn.onclick = () => {
            modal.style.display = 'none';
            document.body.removeChild(modal);
        };

        modal.onclick = (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
                document.body.removeChild(modal);
            }
        };
    };

    /**
     * Clear date filter
     */
    SkillsBoostCalculator.prototype.clearDateFilter = function() {
        const dateInput = document.getElementById('completionDateFilter');
        const resultsContainer = document.getElementById('dateFilterResults');
        const clearBtn = document.getElementById('clearDateFilterBtn');

        if (dateInput) {
            dateInput.value = '';
        }

        if (resultsContainer) {
            resultsContainer.style.display = 'none';
        }

        if (clearBtn) {
            clearBtn.style.display = 'none';
        }
    };
})();
