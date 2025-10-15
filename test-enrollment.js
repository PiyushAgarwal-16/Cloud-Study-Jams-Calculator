/**
 * Test script to verify participant enrollment functionality
 */

const enrollmentChecker = require('./server/modules/enrollmentChecker');

async function testEnrollment() {
    console.log('🧪 Testing Participant Enrollment System');
    console.log('=' .repeat(50));

    // Test URLs from the imported CSV
    const testUrls = [
        'https://www.cloudskillsboost.google/public_profiles/08b1ccd5-2a59-48af-a182-64b52039549a', // Should be enrolled
        'https://www.cloudskillsboost.google/public_profiles/a0de40fa-6bae-4820-b61b-5f6624223e0f', // Should be enrolled
        'https://www.cloudskillsboost.google/public_profiles/non-existent-profile-id', // Should NOT be enrolled
    ];

    for (const url of testUrls) {
        console.log(`\n🔍 Testing: ${url}`);
        
        try {
            // Test enrollment check
            const isEnrolled = await enrollmentChecker.checkEnrollment(url);
            console.log(`   Enrolled: ${isEnrolled ? '✅ YES' : '❌ NO'}`);
            
            if (isEnrolled) {
                // Get participant details
                const participant = enrollmentChecker.getParticipantByUrl(url);
                if (participant) {
                    console.log(`   Participant ID: ${participant.id}`);
                    console.log(`   Name: ${participant.name}`);
                    console.log(`   Batch: ${participant.batch}`);
                    console.log(`   Status: ${participant.status}`);
                }
            }
            
        } catch (error) {
            console.log(`   Error: ${error.message}`);
        }
    }

    // Display enrollment statistics
    console.log('\n📊 Enrollment Statistics:');
    const stats = enrollmentChecker.getStats();
    console.log(`   Total Participants: ${stats.totalParticipants}`);
    console.log(`   Last Updated: ${stats.lastUpdated}`);

    console.log('\n✅ Enrollment testing completed!');
}

// Run the test
testEnrollment().catch(error => {
    console.error('❌ Test failed:', error);
    process.exit(1);
});