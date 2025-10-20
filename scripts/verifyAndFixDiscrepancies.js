/**
 * Verify and Fix Discrepancies Script
 * Compares CSV file with enrolledParticipants.json and fixes any issues
 * CSV is the source of truth for enrolled participants
 */

const fs = require('fs');
const path = require('path');

// File paths
const csvPath = path.join(__dirname, '../config/Participants\' Data.csv');
const jsonPath = path.join(__dirname, '../config/enrolledParticipants.json');

console.log('🔍 VERIFYING PARTICIPANT DATA');
console.log('═══════════════════════════════════════════════════════════\n');

// Read CSV file
const csvContent = fs.readFileSync(csvPath, 'utf8');
const csvLines = csvContent.split('\n').filter(line => line.trim() && !line.startsWith('User Name'));

console.log(`📄 CSV File: ${csvLines.length} participants found\n`);

// Parse CSV data
const csvParticipants = csvLines.map((line, index) => {
    const match = line.match(/^([^,]+),([^,]+),(.+)$/);
    if (!match) {
        console.warn(`⚠️  Line ${index + 2} has invalid format: ${line}`);
        return null;
    }
    
    const [, name, email, profileUrl] = match;
    const profileIdMatch = profileUrl.match(/\/([a-f0-9\-]+)\s*$/i);
    
    if (!profileIdMatch) {
        console.warn(`⚠️  Could not extract profile ID from: ${profileUrl}`);
        return null;
    }
    
    return {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        profileUrl: profileUrl.trim(),
        profileId: profileIdMatch[1].trim()
    };
}).filter(p => p !== null);

console.log(`✅ Successfully parsed: ${csvParticipants.length} participants\n`);

// Read JSON file
const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
const jsonParticipants = jsonData.participants || [];

console.log(`📊 JSON File: ${jsonParticipants.length} participants found\n`);

// Create lookup maps
const csvByEmail = new Map();
const csvByProfileId = new Map();
const csvByName = new Map();

csvParticipants.forEach(p => {
    csvByEmail.set(p.email, p);
    csvByProfileId.set(p.profileId, p);
    const normalizedName = p.name.toLowerCase().trim();
    csvByName.set(normalizedName, p);
});

// Check for discrepancies
const discrepancies = [];
const missing = [];
const extra = [];
const updates = [];

console.log('🔎 CHECKING FOR DISCREPANCIES');
console.log('─────────────────────────────────────────────────────────────\n');

// Check JSON participants against CSV
jsonParticipants.forEach((jsonPart, index) => {
    const jsonEmail = jsonPart.email?.toLowerCase();
    const jsonProfileId = jsonPart.profileId;
    const jsonName = jsonPart.name;
    
    // Try to find match in CSV
    let csvMatch = null;
    let matchType = null;
    
    if (jsonEmail && csvByEmail.has(jsonEmail)) {
        csvMatch = csvByEmail.get(jsonEmail);
        matchType = 'email';
    } else if (csvByProfileId.has(jsonProfileId)) {
        csvMatch = csvByProfileId.get(jsonProfileId);
        matchType = 'profileId';
    } else if (jsonName) {
        const normalizedJsonName = jsonName.toLowerCase().trim();
        if (csvByName.has(normalizedJsonName)) {
            csvMatch = csvByName.get(normalizedJsonName);
            matchType = 'name';
        }
    }
    
    if (!csvMatch) {
        // Participant in JSON but not in CSV
        extra.push({
            index: index + 1,
            id: jsonPart.id,
            name: jsonName,
            email: jsonEmail,
            profileId: jsonProfileId
        });
    } else {
        // Check for discrepancies
        const issues = [];
        
        if (csvMatch.profileId !== jsonProfileId) {
            issues.push({
                field: 'profileId',
                jsonValue: jsonProfileId,
                csvValue: csvMatch.profileId
            });
        }
        
        if (csvMatch.profileUrl !== jsonPart.profileUrl) {
            issues.push({
                field: 'profileUrl',
                jsonValue: jsonPart.profileUrl,
                csvValue: csvMatch.profileUrl
            });
        }
        
        if (csvMatch.name !== jsonName) {
            issues.push({
                field: 'name',
                jsonValue: jsonName,
                csvValue: csvMatch.name
            });
        }
        
        if (csvMatch.email !== jsonEmail) {
            issues.push({
                field: 'email',
                jsonValue: jsonEmail,
                csvValue: csvMatch.email
            });
        }
        
        if (issues.length > 0) {
            discrepancies.push({
                index: index + 1,
                id: jsonPart.id,
                matchedBy: matchType,
                issues: issues,
                csvData: csvMatch,
                jsonData: jsonPart
            });
        }
    }
});

// Check for participants in CSV but not in JSON
csvParticipants.forEach(csvPart => {
    const found = jsonParticipants.some(jsonPart => {
        const jsonEmail = jsonPart.email?.toLowerCase();
        const jsonProfileId = jsonPart.profileId;
        const jsonName = jsonPart.name?.toLowerCase().trim();
        const csvNameNorm = csvPart.name.toLowerCase().trim();
        
        return jsonEmail === csvPart.email || 
               jsonProfileId === csvPart.profileId || 
               jsonName === csvNameNorm;
    });
    
    if (!found) {
        missing.push(csvPart);
    }
});

// Display results
console.log('📋 DISCREPANCY REPORT');
console.log('═══════════════════════════════════════════════════════════\n');

if (discrepancies.length > 0) {
    console.log(`⚠️  Found ${discrepancies.length} participants with discrepancies:\n`);
    discrepancies.forEach(disc => {
        console.log(`Participant #${disc.index} (${disc.id}) - Matched by: ${disc.matchedBy}`);
        console.log(`  JSON: ${disc.jsonData.name} (${disc.jsonData.email})`);
        console.log(`  CSV:  ${disc.csvData.name} (${disc.csvData.email})`);
        disc.issues.forEach(issue => {
            console.log(`  ❌ ${issue.field}:`);
            console.log(`     JSON: ${issue.jsonValue}`);
            console.log(`     CSV:  ${issue.csvValue} ✅`);
        });
        console.log('');
    });
} else {
    console.log('✅ No discrepancies found in existing participants\n');
}

if (missing.length > 0) {
    console.log(`❌ Found ${missing.length} participants in CSV but NOT in JSON:\n`);
    missing.forEach((p, i) => {
        console.log(`  ${i + 1}. ${p.name} (${p.email})`);
        console.log(`     Profile ID: ${p.profileId}`);
    });
    console.log('');
} else {
    console.log('✅ All CSV participants are present in JSON\n');
}

if (extra.length > 0) {
    console.log(`❌ Found ${extra.length} participants in JSON but NOT in CSV:\n`);
    extra.forEach((p, i) => {
        console.log(`  ${i + 1}. ${p.name} (${p.email})`);
        console.log(`     Profile ID: ${p.profileId}`);
    });
    console.log('');
} else {
    console.log('✅ No extra participants in JSON\n');
}

// Fix discrepancies
if (discrepancies.length > 0 || missing.length > 0 || extra.length > 0) {
    console.log('🔧 FIXING DISCREPANCIES');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    // Create backup
    const backupPath = jsonPath.replace('.json', `.backup.${Date.now()}.json`);
    fs.writeFileSync(backupPath, JSON.stringify(jsonData, null, 2));
    console.log(`💾 Backup created: ${path.basename(backupPath)}\n`);
    
    // Build corrected participants list using CSV as source of truth
    const correctedParticipants = csvParticipants.map((csvPart, index) => {
        // Try to find existing JSON entry to preserve id
        const existingJson = jsonParticipants.find(jp => {
            const jpEmail = jp.email?.toLowerCase();
            const jpProfileId = jp.profileId;
            const jpName = jp.name?.toLowerCase().trim();
            const csvNameNorm = csvPart.name.toLowerCase().trim();
            
            return jpEmail === csvPart.email || 
                   jpProfileId === csvPart.profileId || 
                   jpName === csvNameNorm;
        });
        
        return {
            id: existingJson?.id || `participant-${String(index + 1).padStart(3, '0')}`,
            profileId: csvPart.profileId,
            profileUrl: csvPart.profileUrl,
            enrollmentDate: existingJson?.enrollmentDate || "2025-10-15T00:00:00.000Z",
            status: "enrolled",
            name: csvPart.name,
            batch: "Cloud Study Jams 2025",
            email: csvPart.email
        };
    });
    
    // Update JSON data
    jsonData.participants = correctedParticipants;
    jsonData.totalParticipants = correctedParticipants.length;
    jsonData.lastUpdated = new Date().toISOString();
    
    // Write updated JSON
    fs.writeFileSync(jsonPath, JSON.stringify(jsonData, null, 2));
    
    console.log('✅ FIXES APPLIED');
    console.log('─────────────────────────────────────────────────────────────');
    console.log(`📝 Corrected ${discrepancies.length} discrepancies`);
    console.log(`➕ Added ${missing.length} missing participants`);
    console.log(`➖ Removed ${extra.length} extra participants`);
    console.log(`📊 Total participants: ${correctedParticipants.length}`);
    console.log('');
} else {
    console.log('✅ NO FIXES NEEDED - Data is consistent!\n');
}

console.log('═══════════════════════════════════════════════════════════');
console.log('✨ VERIFICATION COMPLETE');
console.log('═══════════════════════════════════════════════════════════\n');

// Summary
console.log('📊 SUMMARY');
console.log('─────────────────────────────────────────────────────────────');
console.log(`CSV Participants:        ${csvParticipants.length}`);
console.log(`JSON Participants:       ${jsonParticipants.length}`);
console.log(`Discrepancies Found:     ${discrepancies.length}`);
console.log(`Missing from JSON:       ${missing.length}`);
console.log(`Extra in JSON:           ${extra.length}`);
console.log(`Final Count:             ${csvParticipants.length}`);
console.log('═══════════════════════════════════════════════════════════\n');
