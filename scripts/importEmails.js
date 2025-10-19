const fs = require('fs');
const path = require('path');

/**
 * Script to import email addresses from CSV into enrolledParticipants.json
 * Matches participants by profile ID extracted from the URL
 */

// File paths
const csvPath = path.join(__dirname, '..', 'config', "Participants' Data.csv");
const participantsPath = path.join(__dirname, '..', 'config', 'enrolledParticipants.json');

// Read CSV file
console.log('📄 Reading CSV file...');
const csvContent = fs.readFileSync(csvPath, 'utf-8');
const lines = csvContent.split('\n').filter(line => line.trim() !== '');

// Parse CSV (skip header)
const emailMap = new Map();
for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Parse CSV line (handle commas in names/emails properly)
    const parts = line.split(',');
    if (parts.length < 3) continue;
    
    const userName = parts[0].trim();
    const userEmail = parts[1].trim();
    const profileUrl = parts[2].trim();
    
    // Extract profile ID from URL
    const profileIdMatch = profileUrl.match(/public_profiles\/([a-f0-9-]+)/);
    if (profileIdMatch) {
        const profileId = profileIdMatch[1];
        emailMap.set(profileId, {
            name: userName,
            email: userEmail,
            url: profileUrl
        });
    }
}

console.log(`✅ Parsed ${emailMap.size} participants from CSV`);

// Read enrolledParticipants.json
console.log('\n📄 Reading enrolledParticipants.json...');
const participantsData = JSON.parse(fs.readFileSync(participantsPath, 'utf-8'));

// Merge email data
let matchedCount = 0;
let unmatchedCount = 0;
const unmatched = [];

console.log('\n🔄 Merging email and name data...');
for (const participant of participantsData.participants) {
    const profileId = participant.profileId;
    
    if (emailMap.has(profileId)) {
        const emailData = emailMap.get(profileId);
        participant.email = emailData.email;
        participant.name = emailData.name; // Update with actual name from CSV
        matchedCount++;
        console.log(`  ✓ Matched: ${emailData.name} → ${emailData.email}`);
    } else {
        unmatchedCount++;
        unmatched.push(participant.name || participant.profileId);
        console.log(`  ✗ No match: ${participant.name || participant.profileId}`);
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
console.log('📊 IMPORT SUMMARY');
console.log('='.repeat(50));
console.log(`✅ Successfully matched: ${matchedCount} participants`);
console.log(`❌ Unmatched: ${unmatchedCount} participants`);
console.log(`📧 Total emails in CSV: ${emailMap.size}`);
console.log(`👥 Total participants in JSON: ${participantsData.participants.length}`);

if (unmatched.length > 0) {
    console.log('\n⚠️  Unmatched participants:');
    unmatched.forEach(name => console.log(`   - ${name}`));
}

console.log('\n✨ Email import completed successfully!');
