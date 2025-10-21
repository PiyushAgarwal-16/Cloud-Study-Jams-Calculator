/**
 * Profile Accessibility Checker
 * Uploads CSV and checks if all profiles are accessible
 */

class ProfileAccessibilityChecker {
    constructor() {
        this.participants = [];
        this.results = {
            accessible: [],
            private: [],
            error: [],
            total: 0
        };
        this.apiBaseUrl = window.location.origin;
        this.init();
    }

    init() {
        this.bindEvents();
    }

    bindEvents() {
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('csvFileInput');
        const checkBtn = document.getElementById('checkAccessibilityBtn');
        const clearBtn = document.getElementById('clearFileBtn');

        // Click to upload
        uploadArea.addEventListener('click', () => fileInput.click());

        // Drag and drop
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('drag-over');
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('drag-over');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('drag-over');
            const file = e.dataTransfer.files[0];
            if (file && file.name.endsWith('.csv')) {
                this.handleFileSelect(file);
            } else {
                alert('Please upload a CSV file');
            }
        });

        // File input change
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                this.handleFileSelect(file);
            }
        });

        // Clear file
        clearBtn.addEventListener('click', () => {
            this.clearFile();
        });

        // Check accessibility button
        checkBtn.addEventListener('click', () => {
            this.checkAllProfiles();
        });

        // Export buttons
        document.getElementById('exportJSONBtn').addEventListener('click', () => {
            this.exportResults('json');
        });

        document.getElementById('exportCSVBtn').addEventListener('click', () => {
            this.exportResults('csv');
        });

        document.getElementById('copyPrivateBtn').addEventListener('click', () => {
            this.copyNames('private');
        });

        document.getElementById('copyErrorBtn').addEventListener('click', () => {
            this.copyNames('error');
        });
    }

    handleFileSelect(file) {
        const fileInfo = document.getElementById('fileInfo');
        const fileName = fileInfo.querySelector('.file-name');
        const checkBtn = document.getElementById('checkAccessibilityBtn');

        fileName.textContent = `📄 ${file.name} (${this.formatFileSize(file.size)})`;
        fileInfo.style.display = 'flex';
        
        // Read and parse CSV
        const reader = new FileReader();
        reader.onload = (e) => {
            const csvContent = e.target.result;
            this.parseCSV(csvContent);
        };
        reader.readAsText(file);

        checkBtn.disabled = false;
    }

    parseCSV(csvContent) {
        const lines = csvContent.split('\n').filter(line => line.trim());
        
        // Skip header if present
        const startIndex = lines[0].toLowerCase().includes('name') ? 1 : 0;
        
        this.participants = [];
        
        for (let i = startIndex; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            // Parse CSV line (handle commas in quoted fields)
            const parts = this.parseCSVLine(line);
            
            if (parts.length >= 3) {
                const name = parts[0].trim();
                const email = parts[1].trim();
                const profileUrl = parts[2].trim();

                if (name && email && profileUrl) {
                    this.participants.push({ name, email, profileUrl });
                }
            }
        }

        console.log(`✅ Parsed ${this.participants.length} participants from CSV`);
        
        // Show preview
        if (this.participants.length > 0) {
            alert(`✅ CSV parsed successfully!\n\n${this.participants.length} participants found.\n\nClick "Check Profile Accessibility" to start verification.`);
        } else {
            alert('⚠️ No valid participants found in CSV. Please check the format.');
        }
    }

    parseCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];

            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(current);
                current = '';
            } else {
                current += char;
            }
        }

        result.push(current);
        return result.map(field => field.replace(/^"|"$/g, '').trim());
    }

    async checkAllProfiles() {
        if (this.participants.length === 0) {
            alert('No participants to check. Please upload a CSV file first.');
            return;
        }

        // Reset results
        this.results = {
            accessible: [],
            private: [],
            error: [],
            total: this.participants.length
        };

        // Show progress section
        const progressSection = document.getElementById('progressSection');
        const resultsSection = document.getElementById('resultsSection');
        const checkBtn = document.getElementById('checkAccessibilityBtn');
        const btnText = checkBtn.querySelector('.btn-text');
        const spinner = checkBtn.querySelector('.spinner');

        progressSection.style.display = 'block';
        resultsSection.style.display = 'none';
        checkBtn.disabled = true;
        btnText.style.display = 'none';
        spinner.style.display = 'inline-block';

        console.log(`🔍 Starting profile accessibility check for ${this.participants.length} participants...`);

        // Check each profile
        for (let i = 0; i < this.participants.length; i++) {
            const participant = this.participants[i];
            this.updateProgress(i + 1, this.participants.length);

            try {
                console.log(`[${i + 1}/${this.participants.length}] Checking ${participant.name}...`);
                
                const result = await this.checkProfileAccessibility(participant);
                
                if (result.status === 'accessible') {
                    this.results.accessible.push(result);
                    console.log(`  ✅ Accessible`);
                } else if (result.status === 'private') {
                    this.results.private.push(result);
                    console.log(`  🔒 Private`);
                } else {
                    this.results.error.push(result);
                    console.log(`  ❌ Error: ${result.error}`);
                }
            } catch (error) {
                console.error(`  ❌ Exception: ${error.message}`);
                this.results.error.push({
                    name: participant.name,
                    email: participant.email,
                    profileUrl: participant.profileUrl,
                    status: 'error',
                    error: error.message
                });
            }

            // Small delay to avoid rate limiting
            await this.sleep(200);
        }

        // Display results
        this.displayResults();

        // Hide progress, show results
        progressSection.style.display = 'none';
        resultsSection.style.display = 'block';
        checkBtn.disabled = false;
        btnText.style.display = 'inline';
        spinner.style.display = 'none';

        console.log('✅ Profile accessibility check complete!');
    }

    async checkProfileAccessibility(participant) {
        try {
            // Use dedicated API endpoint for checking profile accessibility
            const response = await fetch(`${this.apiBaseUrl}/api/check-profile`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ profileUrl: participant.profileUrl })
            });

            const data = await response.json();

            if (!data.success) {
                return {
                    name: participant.name,
                    email: participant.email,
                    profileUrl: participant.profileUrl,
                    status: 'error',
                    error: data.error || 'Unknown error'
                };
            }

            // Return result based on status
            return {
                name: participant.name,
                email: participant.email,
                profileUrl: participant.profileUrl,
                status: data.status,
                message: data.message,
                error: data.status === 'accessible' ? null : data.message
            };

        } catch (error) {
            return {
                name: participant.name,
                email: participant.email,
                profileUrl: participant.profileUrl,
                status: 'error',
                error: error.message || 'Network error'
            };
        }
    }

    updateProgress(current, total) {
        const progressBar = document.getElementById('progressBarFill');
        const progressText = document.getElementById('progressText');
        
        const percentage = (current / total) * 100;
        progressBar.style.width = `${percentage}%`;
        progressText.textContent = `${current} / ${total} profiles checked`;
    }

    displayResults() {
        // Update summary cards
        document.getElementById('accessibleCount').textContent = this.results.accessible.length;
        document.getElementById('privateCount').textContent = this.results.private.length;
        document.getElementById('errorCount').textContent = this.results.error.length;
        document.getElementById('totalCount').textContent = this.results.total;

        document.getElementById('accessibleCountDetail').textContent = this.results.accessible.length;
        document.getElementById('privateCountDetail').textContent = this.results.private.length;
        document.getElementById('errorCountDetail').textContent = this.results.error.length;

        // Display accessible profiles
        this.displayProfileList('accessibleList', this.results.accessible, 'accessible');
        
        // Display private profiles
        this.displayProfileList('privateList', this.results.private, 'private');
        
        // Display error profiles
        this.displayProfileList('errorList', this.results.error, 'error');

        // Show/hide sections based on content
        document.getElementById('accessibleSection').style.display = 
            this.results.accessible.length > 0 ? 'block' : 'none';
        document.getElementById('privateSection').style.display = 
            this.results.private.length > 0 ? 'block' : 'none';
        document.getElementById('errorSection').style.display = 
            this.results.error.length > 0 ? 'block' : 'none';
    }

    displayProfileList(containerId, profiles, type) {
        const container = document.getElementById(containerId);
        container.innerHTML = '';

        if (profiles.length === 0) {
            container.innerHTML = '<p class="no-results">No profiles in this category</p>';
            return;
        }

        profiles.forEach((profile, index) => {
            const profileCard = document.createElement('div');
            profileCard.className = 'profile-card';

            let statusBadge = '';
            let detailsHtml = '';

            if (type === 'accessible') {
                statusBadge = '<span class="badge badge-success">✅ Accessible</span>';
                detailsHtml = `
                    <div class="profile-details">
                        <span style="color: var(--success-color); font-weight: 500;">✓ ${profile.message || 'Profile is publicly accessible'}</span>
                    </div>
                `;
            } else if (type === 'private') {
                statusBadge = '<span class="badge badge-warning">🔒 Private</span>';
            } else {
                statusBadge = '<span class="badge badge-error">❌ Error</span>';
                detailsHtml = `
                    <div class="error-details">
                        <span class="error-label">Error:</span> ${this.escapeHtml(profile.error || 'Unknown error')}
                    </div>
                `;
            }

            profileCard.innerHTML = `
                <div class="profile-header">
                    <div class="profile-number">#${index + 1}</div>
                    <div class="profile-info">
                        <div class="profile-name">${this.escapeHtml(profile.name)}</div>
                        <div class="profile-email">${this.escapeHtml(profile.email)}</div>
                    </div>
                    ${statusBadge}
                </div>
                ${detailsHtml}
                <div class="profile-actions">
                    <a href="${profile.profileUrl}" target="_blank" class="link-button">
                        🔗 View Profile
                    </a>
                </div>
            `;

            container.appendChild(profileCard);
        });
    }

    exportResults(format) {
        if (format === 'json') {
            this.exportAsJSON();
        } else if (format === 'csv') {
            this.exportAsCSV();
        }
    }

    exportAsJSON() {
        const exportData = {
            generatedAt: new Date().toISOString(),
            summary: {
                total: this.results.total,
                accessible: this.results.accessible.length,
                private: this.results.private.length,
                error: this.results.error.length
            },
            results: {
                accessible: this.results.accessible,
                private: this.results.private,
                error: this.results.error
            }
        };

        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `profile-accessibility-${new Date().toISOString().split('T')[0]}.json`;
        link.click();

        URL.revokeObjectURL(link.href);
    }

    exportAsCSV() {
        const headers = ['Name', 'Email', 'Profile URL', 'Status', 'Message/Error'];
        let csv = headers.join(',') + '\n';

        const allProfiles = [
            ...this.results.accessible.map(p => ({ ...p, statusText: 'Accessible' })),
            ...this.results.private.map(p => ({ ...p, statusText: 'Private' })),
            ...this.results.error.map(p => ({ ...p, statusText: 'Error' }))
        ];

        allProfiles.forEach(profile => {
            const row = [
                `"${profile.name}"`,
                `"${profile.email}"`,
                `"${profile.profileUrl}"`,
                profile.statusText,
                `"${profile.message || profile.error || ''}"`
            ];
            csv += row.join(',') + '\n';
        });

        const dataBlob = new Blob([csv], { type: 'text/csv' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `profile-accessibility-${new Date().toISOString().split('T')[0]}.csv`;
        link.click();

        URL.revokeObjectURL(link.href);
    }

    copyNames(category) {
        const profiles = this.results[category];
        if (profiles.length === 0) {
            alert('No profiles in this category to copy.');
            return;
        }

        const names = profiles.map(p => p.name).join('\n');
        navigator.clipboard.writeText(names).then(() => {
            alert(`✅ Copied ${profiles.length} ${category} profile names to clipboard!`);
        }).catch(err => {
            console.error('Failed to copy:', err);
            alert('❌ Failed to copy to clipboard');
        });
    }

    clearFile() {
        const fileInput = document.getElementById('csvFileInput');
        const fileInfo = document.getElementById('fileInfo');
        const checkBtn = document.getElementById('checkAccessibilityBtn');
        const resultsSection = document.getElementById('resultsSection');

        fileInput.value = '';
        fileInfo.style.display = 'none';
        checkBtn.disabled = true;
        resultsSection.style.display = 'none';
        this.participants = [];
        this.results = { accessible: [], private: [], error: [], total: 0 };
    }

    formatFileSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / 1048576).toFixed(1) + ' MB';
    }

    escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Toggle section visibility
function toggleSection(sectionId) {
    const section = document.getElementById(sectionId);
    const button = event.target;
    
    if (section.style.display === 'none') {
        section.style.display = 'block';
        button.textContent = '▼';
    } else {
        section.style.display = 'none';
        button.textContent = '▶';
    }
}

// Initialize the checker
const checker = new ProfileAccessibilityChecker();
