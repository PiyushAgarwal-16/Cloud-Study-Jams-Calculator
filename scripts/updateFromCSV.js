const fs = require('fs');
const path = require('path');

/**
 * Script to update enrolledParticipants.json from CSV
 * Updates names, emails, and profile URLs based on CSV data
 */

// File paths
const csvPath = path.join(__dirname, '..', 'config', "Participants' Data.csv");
const participantsPath = path.join(__dirname, '..', 'config', 'enrolledParticipants.json');

console.log('📄 Reading CSV file...');
const csvContent = fs.readFileSync(csvPath, 'utf-8');
const lines = csvContent.split('\n').filter(line => line.trim() !== '');

// Parse CSV (skip header)
const csvData = new Map();
for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Parse CSV line
    const parts = line.split(',');
    if (parts.length < 3) continue;
    
    const userName = parts[0].trim();
    const userEmail = parts[1].trim();
    const profileUrl = parts[2].trim();
    
    // Extract profile ID from URL
    const profileIdMatch = profileUrl.match(/public_profiles\/([a-f0-9-]+)/);
    if (profileIdMatch) {
        const profileId = profileIdMatch[1];
        csvData.set(profileId, {
            name: userName,
            email: userEmail,
            url: profileUrl,
            profileId: profileId
        });
    }
}

console.log(`✅ Parsed ${csvData.size} participants from CSV`);

// Read enrolledParticipants.json
console.log('\n📄 Reading enrolledParticipants.json...');
const participantsData = JSON.parse(fs.readFileSync(participantsPath, 'utf-8'));

// Update participant data
let updatedCount = 0;
let newUrlsCount = 0;
const updates = [];

console.log('\n🔄 Updating participant data...');
for (const participant of participantsData.participants) {
    const profileId = participant.profileId;
    
    if (csvData.has(profileId)) {
        const csvEntry = csvData.get(profileId);
        let changed = false;
        const changes = [];
        
        // Check if profile URL changed
        if (participant.profileUrl !== csvEntry.url) {
            changes.push(`URL: ${participant.profileUrl} → ${csvEntry.url}`);
            participant.profileUrl = csvEntry.url;
            newUrlsCount++;
            changed = true;
        }
        
        // Update name if different
        if (participant.name !== csvEntry.name) {
            changes.push(`Name: ${participant.name} → ${csvEntry.name}`);
            participant.name = csvEntry.name;
            changed = true;
        }
        
        // Update email if different
        if (participant.email !== csvEntry.email) {
            changes.push(`Email: ${participant.email || 'none'} → ${csvEntry.email}`);
            participant.email = csvEntry.email;
            changed = true;
        }
        
        if (changed) {
            updatedCount++;
            updates.push({
                name: csvEntry.name,
                profileId: profileId,
                changes: changes
            });
            console.log(`  ✓ Updated: ${csvEntry.name} (${profileId})`);
            changes.forEach(change => console.log(`    - ${change}`));
        }
    }
}

// Update lastUpdated timestamp
participantsData.lastUpdated = new Date().toISOString();

// Write updated data back to file
console.log('\n💾 Writing updated data to enrolledParticipants.json...');
fs.writeFileSync(
    participantsPath, 
    JSON.stringify(participantsData, null, 2),
    'utf-8'
);

// Summary
console.log('\n' + '='.repeat(50));
console.log('📊 UPDATE SUMMARY');
console.log('='.repeat(50));
console.log(`✅ Participants updated: ${updatedCount}`);
console.log(`🔗 Profile URLs changed: ${newUrlsCount}`);
console.log(`📧 Total in CSV: ${csvData.size}`);
console.log(`👥 Total in JSON: ${participantsData.participants.length}`);

if (updates.length > 0) {
    console.log('\n📝 Changes made:');
    updates.forEach(update => {
        console.log(`\n  ${update.name} (${update.profileId}):`);
        update.changes.forEach(change => console.log(`    - ${change}`));
    });
}

console.log('\n✨ Update completed successfully!');
