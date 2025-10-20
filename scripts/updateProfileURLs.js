const fs = require('fs');
const path = require('path');

/**
 * Script to handle profile URL changes
 * Matches by email or name when profile ID changes
 */

// File paths
const csvPath = path.join(__dirname, '..', 'config', "Participants' Data.csv");
const participantsPath = path.join(__dirname, '..', 'config', 'enrolledParticipants.json');

console.log('📄 Reading CSV file...');
const csvContent = fs.readFileSync(csvPath, 'utf-8');
const lines = csvContent.split('\n').filter(line => line.trim() !== '');

// Parse CSV - create maps by email and name
const csvByEmail = new Map();
const csvByName = new Map();

for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const parts = line.split(',');
    if (parts.length < 3) continue;
    
    const userName = parts[0].trim();
    const userEmail = parts[1].trim().toLowerCase();
    const profileUrl = parts[2].trim();
    
    const profileIdMatch = profileUrl.match(/public_profiles\/([a-f0-9-]+)/);
    if (profileIdMatch) {
        const profileId = profileIdMatch[1];
        const data = {
            name: userName,
            email: userEmail,
            url: profileUrl,
            profileId: profileId
        };
        
        csvByEmail.set(userEmail, data);
        csvByName.set(userName.toLowerCase(), data);
    }
}

console.log(`✅ Parsed ${csvByEmail.size} participants from CSV`);

// Read enrolledParticipants.json
console.log('\n📄 Reading enrolledParticipants.json...');
const participantsData = JSON.parse(fs.readFileSync(participantsPath, 'utf-8'));

// Update participant data
let updatedCount = 0;
let profileUrlChanges = 0;
const updates = [];

console.log('\n🔄 Checking for profile URL changes...');
for (const participant of participantsData.participants) {
    // Try to find by email first, then by name
    let csvData = null;
    
    if (participant.email) {
        csvData = csvByEmail.get(participant.email.toLowerCase());
    }
    
    if (!csvData && participant.name) {
        csvData = csvByName.get(participant.name.toLowerCase());
    }
    
    if (csvData) {
        const changes = [];
        let changed = false;
        
        // Check if profile URL or ID changed
        if (participant.profileId !== csvData.profileId) {
            changes.push(`Profile ID: ${participant.profileId} → ${csvData.profileId}`);
            changes.push(`Profile URL: ${participant.profileUrl} → ${csvData.url}`);
            participant.profileId = csvData.profileId;
            participant.profileUrl = csvData.url;
            profileUrlChanges++;
            changed = true;
        }
        
        // Update name if different
        if (participant.name !== csvData.name) {
            changes.push(`Name: ${participant.name} → ${csvData.name}`);
            participant.name = csvData.name;
            changed = true;
        }
        
        // Update email if different
        if (!participant.email || participant.email.toLowerCase() !== csvData.email) {
            changes.push(`Email: ${participant.email || 'none'} → ${csvData.email}`);
            participant.email = csvData.email;
            changed = true;
        }
        
        if (changed) {
            updatedCount++;
            updates.push({
                name: csvData.name,
                changes: changes
            });
            console.log(`  ✓ Updated: ${csvData.name}`);
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
console.log(`🔗 Profile URLs changed: ${profileUrlChanges}`);
console.log(`📧 Total in CSV: ${csvByEmail.size}`);
console.log(`👥 Total in JSON: ${participantsData.participants.length}`);

if (profileUrlChanges > 0) {
    console.log('\n⚠️  IMPORTANT: Profile URLs were changed!');
    console.log('Some participants have new profile IDs.');
}

console.log('\n✨ Update completed successfully!');
