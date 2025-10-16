# Analytics Test Mode

## Overview
Test mode allows you to test the analytics feature with only 30 participants instead of all 196, making it faster to test and debug.

## How to Use

### Option 1: UI Toggle (Recommended)
1. Start the development server: `npm run dev`
2. Open http://localhost:3001
3. Scroll to the **Analytics** section
4. Toggle the **🧪 Test Mode (30)** switch in the top right
5. Click **"Fetch Latest Data"**
6. Analytics will process only 30 test participants

### Option 2: Direct API Testing
Test the endpoint directly:
```bash
# Get all 196 participants
curl http://localhost:3001/api/participants

# Get 30 test participants
curl http://localhost:3001/api/participants?test=true
```

## Test Data
- **File**: `config/testParticipants.json`
- **Participants**: 30 (selected from the first 30 in the main list)
- **Profile IDs**: Real profile IDs from enrolled participants

## What Gets Tested
✅ API endpoint for fetching participants list
✅ Batch processing of multiple participants
✅ Progress tracking (0/30, 1/30, ... 30/30)
✅ Statistics calculation
✅ Distribution analysis
✅ Leaderboard generation
✅ Export to JSON/CSV

## Benefits
- **Faster Testing**: ~30 seconds vs ~3 minutes for all participants
- **Lower Rate Limiting**: Fewer API calls to Google Cloud Skills Boost
- **Easier Debugging**: Smaller dataset to inspect
- **Same Features**: All analytics features work identically

## Switching Back to Production
Simply toggle off **Test Mode** in the UI, and the next fetch will use all 196 participants.

## Notes
- Test mode uses the same API logic as production
- Names are fetched from actual Google Cloud Skills Boost profiles
- All distribution and leaderboard features work the same way
- Export files will show correct participant count (30 vs 196)
