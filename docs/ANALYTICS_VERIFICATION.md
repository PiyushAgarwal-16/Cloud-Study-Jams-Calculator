# Analytics Verification Guide

## How to Verify Analytics Results

After running the analytics (clicking "Fetch Latest Data"), follow these steps:

### Step 1: Open Browser Console
1. Press `F12` or `Right-click → Inspect`
2. Go to the **Console** tab

### Step 2: Run Verification Commands

#### Check Total Participants Fetched
```javascript
console.log('Total participants:', window.calculator.analyticsData.length);
```

#### Check Fully Completed (20/20)
```javascript
const fullComplete = window.calculator.analyticsData.filter(p => p.totalItems >= 20);
console.log('Fully Completed (20/20):', fullComplete.length);
```

#### List All 20/20 Completers
```javascript
window.calculator.analyticsData
  .filter(p => p.totalItems >= 20)
  .forEach(p => console.log(`${p.name}: ${p.badges} badges + ${p.games} games = ${p.totalItems}`));
```

#### Check for Failed Profiles
```javascript
const failed = window.calculator.analyticsData.filter(p => p.status === 'error');
console.log('Failed profiles:', failed.length);
if (failed.length > 0) {
  failed.forEach(p => console.log(`  - ${p.name} (${p.profileId}): ${p.error}`));
}
```

#### Export Summary to Console
```javascript
const data = window.calculator.analyticsData;
console.table({
  'Total Participants': data.length,
  'Fully Completed (20/20)': data.filter(p => p.totalItems >= 20).length,
  '75-99% (15-19 items)': data.filter(p => p.totalItems >= 15 && p.totalItems < 20).length,
  '50-74% (10-14 items)': data.filter(p => p.totalItems >= 10 && p.totalItems < 15).length,
  '25-49% (5-9 items)': data.filter(p => p.totalItems >= 5 && p.totalItems < 10).length,
  '0-24% (0-4 items)': data.filter(p => p.totalItems < 5).length,
  'Failed Fetches': data.filter(p => p.status === 'error').length
});
```

### Step 3: Compare with Google Sheet

According to your Google Sheet:
- **Expected: 34 participants with 20/20 completion**

If the analytics shows a different number:

1. **Check Failed Profiles**: Run the failed profiles command above
2. **Check Individual Counts**: Some profiles might have 19 badges + 0 games (19 total) instead of 19 badges + 1 game (20 total)
3. **Timeout Issues**: One profile timed out in the logs - it will be added with 0 counts

### Step 4: Detailed Breakdown by Score

```javascript
const data = window.calculator.analyticsData;

// Group by total items
const breakdown = {};
for (let i = 0; i <= 20; i++) {
  breakdown[i] = data.filter(p => p.totalItems === i).length;
}

console.table(breakdown);
```

### Step 5: Find Specific Profiles

Find profiles with exactly 19 items (might be missing the game):
```javascript
window.calculator.analyticsData
  .filter(p => p.totalItems === 19)
  .forEach(p => console.log(`${p.name}: ${p.badges} badges + ${p.games} games`));
```

Find profiles with 24 badges (bonus badges beyond required 19):
```javascript
window.calculator.analyticsData
  .filter(p => p.badges > 20)
  .forEach(p => console.log(`${p.name}: ${p.badges} badges (bonus: ${p.badges - 19})`));
```

## Note About PowerShell

❌ **Don't run JavaScript commands in PowerShell/Terminal**
✅ **Run them in Browser Console (F12 → Console tab)**

PowerShell is for server commands, Browser Console is for JavaScript.
