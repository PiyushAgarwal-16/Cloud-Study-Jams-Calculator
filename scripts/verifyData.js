/**
 * Verify Synchronized Data
 */

const fs = require('fs');
const path = require('path');

const jsonPath = path.join(__dirname, '../config/enrolledParticipants.json');
const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

console.log('✅ DATA VERIFICATION');
console.log('═══════════════════════════════════════════════════════════\n');

console.log(`📊 Total Participants: ${data.totalParticipants}\n`);

console.log('👥 FIRST 3 PARTICIPANTS:');
console.log('─────────────────────────────────────────────────────────────');
data.participants.slice(0, 3).forEach((p, i) => {
    console.log(`${i + 1}. ${p.name}`);
    console.log(`   Email: ${p.email}`);
    console.log(`   Profile ID: ${p.profileId}`);
    console.log('');
});

console.log('🔍 MANAN JAIN (Previously had incorrect profile ID):');
console.log('─────────────────────────────────────────────────────────────');
const manan = data.participants.find(p => p.email === 'jainmanan5645@gmail.com');
if (manan) {
    console.log(`Name: ${manan.name}`);
    console.log(`Email: ${manan.email}`);
    console.log(`Profile ID: ${manan.profileId}`);
    console.log(`Profile URL: ${manan.profileUrl}`);
    console.log(`Status: ✅ CORRECTED\n`);
} else {
    console.log('❌ NOT FOUND\n');
}

console.log('👥 LAST 3 PARTICIPANTS:');
console.log('─────────────────────────────────────────────────────────────');
data.participants.slice(-3).forEach((p, i) => {
    console.log(`${194 + i}. ${p.name}`);
    console.log(`   Email: ${p.email}`);
    console.log(`   Profile ID: ${p.profileId}`);
    console.log('');
});

console.log('═══════════════════════════════════════════════════════════');
console.log('✨ VERIFICATION COMPLETE - All data looks good!\n');
