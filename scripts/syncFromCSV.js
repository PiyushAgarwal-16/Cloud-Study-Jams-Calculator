/**
 * Fix Participant Discrepancies - Proper CSV Parser
 * Uses CSV as the source of truth for enrolled participants
 */

const fs = require('fs');
const path = require('path');

// File paths
const csvPath = path.join(__dirname, '../config/Participants\' Data.csv');
const jsonPath = path.join(__dirname, '../config/enrolledParticipants.json');

console.log('🔍 FIXING PARTICIPANT DATA FROM CSV');
console.log('═══════════════════════════════════════════════════════════\n');

// Read CSV file
const csvContent = fs.readFileSync(csvPath, 'utf8');
const csvLines = csvContent.trim().split('\n');

// Remove header
csvLines.shift();

console.log(`📄 CSV File: ${csvLines.length} participants found\n`);

// Parse CSV data - handle commas inside the data correctly
const csvParticipants = [];

csvLines.forEach((line, index) => {
    const trimmedLine = line.trim();
    if (!trimmedLine) return;
    
    // Split by comma, but the URL should be the last part
    const parts = trimmedLine.split(',');
    
    if (parts.length < 3) {
        console.warn(`⚠️  Line ${index + 2} has insufficient fields: ${trimmedLine.substring(0, 50)}...`);
        return;
    }
    
    // Extract profile URL (last part)
    const profileUrl = parts[parts.length - 1].trim();
    
    // Extract email (second to last)
    const email = parts[parts.length - 2].trim().toLowerCase();
    
    // Name is everything before the email
    const name = parts.slice(0, parts.length - 2).join(',').trim();
    
    // Extract profile ID from URL
    const profileIdMatch = profileUrl.match(/\/([a-f0-9\-]+)\s*$/i);
    
    if (!profileIdMatch) {
        console.warn(`⚠️  Could not extract profile ID from URL in line ${index + 2}`);
        return;
    }
    
    const profileId = profileIdMatch[1];
    
    csvParticipants.push({
        name,
        email,
        profileUrl,
        profileId
    });
});

console.log(`✅ Successfully parsed: ${csvParticipants.length} participants from CSV\n`);

if (csvParticipants.length === 0) {
    console.error('❌ ERROR: No participants parsed from CSV. Please check the file format.');
    process.exit(1);
}

// Read JSON file
const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
const jsonParticipants = jsonData.participants || [];

console.log(`📊 JSON File: ${jsonParticipants.length} participants currently stored\n`);

// Create backup
const backupPath = jsonPath.replace('.json', `.backup.${Date.now()}.json`);
fs.writeFileSync(backupPath, JSON.stringify(jsonData, null, 2));
console.log(`💾 Backup created: ${path.basename(backupPath)}\n`);

console.log('🔧 REBUILDING PARTICIPANT LIST FROM CSV');
console.log('─────────────────────────────────────────────────────────────\n');

// Build corrected participants list using CSV as source of truth
const correctedParticipants = csvParticipants.map((csvPart, index) => {
    // Try to find existing JSON entry to preserve id and enrollment date
    const existingJson = jsonParticipants.find(jp => {
        const jpEmail = jp.email?.toLowerCase();
        const jpProfileId = jp.profileId;
        
        return jpEmail === csvPart.email || jpProfileId === csvPart.profileId;
    });
    
    const participant = {
        id: existingJson?.id || `participant-${String(index + 1).padStart(3, '0')}`,
        profileId: csvPart.profileId,
        profileUrl: csvPart.profileUrl,
        enrollmentDate: existingJson?.enrollmentDate || "2025-10-15T00:00:00.000Z",
        status: "enrolled",
        name: csvPart.name,
        batch: "Cloud Study Jams 2025",
        email: csvPart.email
    };
    
    // Log if this is a new participant
    if (!existingJson) {
        console.log(`➕ NEW: ${csvPart.name} (${csvPart.email})`);
    } else if (existingJson.profileId !== csvPart.profileId) {
        console.log(`🔄 UPDATED PROFILE ID: ${csvPart.name}`);
        console.log(`   Old: ${existingJson.profileId}`);
        console.log(`   New: ${csvPart.profileId}`);
    }
    
    return participant;
});

// Update JSON data
jsonData.participants = correctedParticipants;
jsonData.totalParticipants = correctedParticipants.length;
jsonData.lastUpdated = new Date().toISOString();

// Write updated JSON
fs.writeFileSync(jsonPath, JSON.stringify(jsonData, null, 2));

console.log('\n✅ UPDATES COMPLETE');
console.log('═══════════════════════════════════════════════════════════\n');

// Final summary
console.log('📊 FINAL SUMMARY');
console.log('─────────────────────────────────────────────────────────────');
console.log(`CSV Participants:        ${csvParticipants.length}`);
console.log(`Previous JSON Count:     ${jsonParticipants.length}`);
console.log(`New JSON Count:          ${correctedParticipants.length}`);
console.log(`\nBackup saved to:         ${path.basename(backupPath)}`);
console.log(`Updated file:            enrolledParticipants.json`);
console.log('═══════════════════════════════════════════════════════════\n');

console.log('✨ All participant data synchronized with CSV!\n');
