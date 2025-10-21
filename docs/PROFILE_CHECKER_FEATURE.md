# Profile Accessibility Checker Feature

## Overview
The Profile Accessibility Checker is a standalone administrative tool that allows organizers to upload a CSV file containing participant information and verify that all Google Cloud Skills Boost profiles are accessible before importing them into the main system.

## Purpose
This feature addresses the need to proactively validate participant profiles to ensure:
- Profiles are publicly accessible (not private)
- Profile URLs are valid and working
- No errors occur during profile fetching
- Data integrity before importing large batches of participants

## Access
- **URL**: `http://localhost:3001/profile-checker.html`
- **Navigation**: Available from the main calculator page via the "🔍 Profile Checker" button in the header

## Features

### 1. CSV Upload
- **Drag & Drop**: Simply drag a CSV file onto the upload area
- **Click to Upload**: Click the upload area to select a file from your computer
- **File Preview**: Shows filename and size after upload
- **Format**: Expects CSV with columns:
  - Column A: Name
  - Column B: Email
  - Column C: Profile URL

### 2. Bulk Profile Checking
- **Sequential Validation**: Checks each profile one by one
- **Rate Limiting**: Includes 200ms delay between checks to avoid overwhelming the server
- **Real-time Progress**: Shows progress bar with current/total count
- **Status Categorization**: Automatically categorizes profiles as:
  - ✅ **Accessible**: Profile is public and working
  - 🔒 **Private**: Profile is set to private
  - ❌ **Error**: Profile has errors (invalid URL, network issues, etc.)

### 3. Results Display
- **Summary Cards**: Quick overview of accessible, private, error, and total counts
- **Detailed Lists**: Expandable sections for each category
- **Profile Cards**: Each profile shows:
  - Participant name and email
  - Status badge
  - For accessible profiles: badges, games, and points earned
  - For error profiles: specific error message
  - Link to view the profile directly

### 4. Export Options
- **Export as JSON**: Complete results with full data structure
- **Export as CSV**: Spreadsheet-compatible format
- **Copy Names**: Copy list of private or error profile names to clipboard

## Usage Workflow

### Step 1: Prepare CSV File
Create a CSV file with the following structure:
```csv
Name,Email,Profile URL
Piyush Agarwal,piyush@example.com,https://www.cloudskillsboost.google/public_profiles/xxx
Manan Jain,manan@example.com,https://www.cloudskillsboost.google/public_profiles/yyy
```

### Step 2: Upload CSV
1. Navigate to the Profile Checker page
2. Drag and drop your CSV file or click to upload
3. Wait for the file to be parsed
4. Review the participant count in the alert message

### Step 3: Check Accessibility
1. Click the "Check Profile Accessibility" button
2. Watch the progress bar as profiles are checked
3. Wait for all profiles to be validated (may take several minutes for large lists)

### Step 4: Review Results
1. Check the summary cards for quick statistics
2. Expand each category to see detailed lists
3. Review specific profiles that are private or have errors
4. Click "View Profile" links to manually verify problematic profiles

### Step 5: Take Action
Based on results:
- **For Private Profiles**: Contact participants to make their profiles public
- **For Errors**: Verify URLs are correct and profiles exist
- **For Accessible Profiles**: Proceed with confidence to import into main system

### Step 6: Export (Optional)
1. Export results as JSON or CSV for record-keeping
2. Use "Copy Names" to quickly get a list of problematic profiles
3. Share results with team members

## Technical Implementation

### Frontend (`profile-checker.html`)
- Clean, user-friendly interface
- Responsive design for mobile and desktop
- Drag-and-drop file upload
- Progress tracking
- Categorized results display

### JavaScript (`profile-checker.js`)
- `ProfileAccessibilityChecker` class handles all functionality
- CSV parsing with proper comma/quote handling
- Sequential profile checking with rate limiting
- Real-time progress updates
- Export functionality (JSON, CSV, clipboard)

### API Integration
- Uses existing `/api/calculate-points` endpoint
- Analyzes response to determine profile status:
  - HTTP 200 → Accessible
  - Error message contains "private" → Private
  - Other errors → Error status
- Extracts badge/game/points data for accessible profiles

### Styling (`style.css`)
- Gradient backgrounds for visual appeal
- Color-coded status badges
- Hover effects and transitions
- Responsive grid layout
- Consistent with main calculator design

## Private Profile Detection

The system identifies private profiles through multiple methods:

1. **Redirect Detection** (Primary method):
   - Private profiles redirect to `https://www.cloudskillsboost.google/`
   - System detects when final URL doesn't contain `public_profiles`
   - Most reliable indicator of a private profile

2. **Text Indicators**: Checks error messages for keywords like:
   - "private"
   - "PROFILE_PRIVATE"
   - "access denied"
   - "Sorry, access denied to this resource" (shown when signed in)
   - "Please sign in to access this content" (shown when not signed in)

3. **Content Analysis**: Profiles with restricted access return specific error patterns

4. **Status Categorization**: Automatically sorts results into appropriate categories

## Example Scenarios

### Scenario 1: All Profiles Accessible ✅
```
📊 Summary:
- Accessible: 196
- Private: 0
- Error: 0
- Total: 196

Result: Ready to import all participants!
```

### Scenario 2: Some Private Profiles 🔒
```
📊 Summary:
- Accessible: 190
- Private: 5
- Error: 1
- Total: 196

Action Required:
1. Contact 5 participants to make profiles public
2. Fix 1 error (check URL validity)
```

### Scenario 3: Bulk Errors ❌
```
📊 Summary:
- Accessible: 150
- Private: 10
- Error: 36
- Total: 196

Investigation Needed:
- Review error messages for patterns
- Verify CSV data accuracy
- Check for network/server issues
```

## Best Practices

1. **Regular Validation**: Check profiles before major milestones
2. **CSV Hygiene**: Ensure CSV data is clean and properly formatted
3. **Communication**: Use results to proactively contact participants
4. **Documentation**: Export results for record-keeping
5. **Batch Processing**: For very large lists (500+), consider splitting into smaller batches

## Troubleshooting

### Problem: "No valid participants found in CSV"
**Solution**: 
- Check CSV format (Name, Email, URL columns)
- Ensure no empty rows
- Verify commas are used as delimiters

### Problem: All profiles showing as "Error"
**Solution**:
- Check if server is running (`localhost:3001`)
- Verify internet connection
- Check if API endpoint is functioning

### Problem: Slow checking process
**Solution**:
- This is normal for large lists
- Rate limiting is intentional to prevent server overload
- Consider checking during off-peak hours

### Problem: Private profiles not detected correctly
**Solution**:
- Manually verify the profile URL
- Check if error message patterns have changed
- Review `checkProfileAccessibility()` method in `profile-checker.js`

## Future Enhancements

Potential improvements for this feature:
1. **Batch Import**: Directly import accessible profiles to main system
2. **Email Notifications**: Automatically email participants with private profiles
3. **Historical Tracking**: Compare results over time
4. **Advanced Filters**: Filter by batch, enrollment date, etc.
5. **Parallel Processing**: Check multiple profiles simultaneously (with rate limiting)
6. **Profile Preview**: Show profile details in modal before checking

## Files Involved

| File | Purpose |
|------|---------|
| `public/profile-checker.html` | Main HTML structure |
| `public/profile-checker.js` | JavaScript functionality |
| `public/style.css` | Styling (includes profile checker styles) |
| `public/index.html` | Updated with navigation link |
| `api/calculate-points.js` | Used for profile validation |

## Related Documentation

- [Private Profile Detection Logic](./PRIVATE_PROFILE_DETECTION_LOGIC.md)
- [Participant Data Sync](./PARTICIPANT_DATA_SYNC.md)
- [Failed Profiles Display](./FAILED_PROFILES_DISPLAY.md)

## Created By
Piyush Agarwal
Date: January 2025

---

**Note**: This tool is designed for administrative use by organizers and should not be exposed to regular participants. It provides valuable insights into data quality before importing large batches of participants.
