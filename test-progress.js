/**
 * Quick test to verify progress calculation
 */

const pointsCalculator = require('./server/modules/pointsCalculator');

// Simulate a profile with all badges and games completed
const testProfile = {
    badges: Array(19).fill(null).map((_, i) => ({
        originalTitle: `Badge ${i + 1}`,
        normalizedTitle: `badge ${i + 1}`,
        category: 'general',
        difficulty: 'beginner',
        isCompleted: true,
        earnedDate: '2025-01-10T00:00:00.000Z'
    })),
    games: [{
        originalTitle: 'Test Game',
        normalizedTitle: 'test game',
        category: 'general',
        difficulty: 'beginner',
        isCompleted: true,
        completedDate: '2025-01-10T00:00:00.000Z'
    }]
};

console.log('\n🧪 Testing Progress Calculation...\n');

const result = pointsCalculator.calculatePoints(testProfile);

console.log('Progress Results:');
console.log('================');
console.log(`Badges: ${result.progress.badges.completed}/${result.progress.badges.total} (${result.progress.badges.percentage}%)`);
console.log(`Games: ${result.progress.games.completed}/${result.progress.games.total} (${result.progress.games.percentage}%)`);
console.log(`Overall: ${result.progress.overall.completed}/${result.progress.overall.total} (${result.progress.overall.percentage}%)`);
console.log('================\n');

if (result.filtering.filteredBadges.length > 0) {
    console.log('⚠️  Filtered Out Badges:');
    result.filtering.filteredBadges.forEach(fb => {
        console.log(`   - ${fb.title}: ${fb.reason}`);
    });
    console.log('');
}

if (result.filtering.filteredGames.length > 0) {
    console.log('⚠️  Filtered Out Games:');
    result.filtering.filteredGames.forEach(fg => {
        console.log(`   - ${fg.title}: ${fg.reason}`);
    });
    console.log('');
}

// Test expected values
const expectedOverall = 100; // Since we have all items completed
const actualOverall = result.progress.overall.percentage;

if (actualOverall === expectedOverall) {
    console.log('✅ TEST PASSED: Progress calculation is correct!');
} else {
    console.log(`❌ TEST FAILED: Expected ${expectedOverall}% but got ${actualOverall}%`);
}
