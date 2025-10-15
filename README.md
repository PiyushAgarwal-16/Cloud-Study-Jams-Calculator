# 🌟 Google Cloud Skills Boost Calculator

A comprehensive web application for analyzing Google Cloud Skills Boost profiles and calculating points based on completed badges and games. This tool helps track learning progress and provides detailed insights into skill development.

## ✨ Features

- **Profile Verification**: Validates against a predefined list of enrolled participants
- **Automated Fetching**: Retrieves profile data from public Google Cloud Skills Boost URLs
- **Smart Parsing**: Identifies completed skill badges and games with intelligent categorization
- **Points Calculation**: Calculates points based on configurable scoring rules
- **Progress Tracking**: Visual progress indicators and completion percentages
- **Detailed Breakdown**: Shows points breakdown by badges, games, and bonuses
- **Responsive Design**: Modern, mobile-friendly user interface
- **Export Functionality**: Export results to JSON for record-keeping

## 🚀 Quick Start

### Prerequisites

- Node.js (version 14 or higher)
- npm (comes with Node.js)

### Installation

1. **Clone or download the project**
   ```bash
   cd "Google Cloud Skills Boost Calculator"
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure the application**
   ```bash
   # Copy environment template
   copy .env.example .env
   
   # Edit enrollment list (add your participants)
   # Edit config/enrolledParticipants.json
   
   # Customize scoring rules (optional)
   # Edit config/scoringConfig.json
   ```

4. **Start the application**
   ```bash
   # Development mode with auto-restart
   npm run dev
   
   # Or production mode
   npm start
   ```

5. **Open your browser**
   Navigate to `http://localhost:3000`

## 📁 Project Structure

```
├── server/                 # Backend Node.js application
│   ├── modules/           # Core business logic modules
│   │   ├── enrollmentChecker.js    # Participant verification
│   │   ├── profileFetcher.js       # Profile data fetching
│   │   ├── profileParser.js        # Data parsing & normalization
│   │   └── pointsCalculator.js     # Points calculation engine
│   └── server.js          # Express.js server setup
├── public/                # Frontend web application
│   ├── index.html         # Main HTML page
│   ├── app.js            # Frontend JavaScript
│   └── style.css         # Styling and responsive design
├── config/               # Configuration files
│   ├── enrolledParticipants.json   # List of enrolled users
│   └── scoringConfig.json          # Points calculation rules
├── tests/                # Unit and integration tests
└── package.json          # Dependencies and scripts
```

## 🔧 Configuration

### Enrollment List (`config/enrolledParticipants.json`)

Add participant profile URLs to verify enrollment:

```json
{
  "participants": [
    "https://www.cloudskillsboost.google/public_profiles/user-id-1",
    {
      "name": "Student Name",
      "profileUrl": "https://www.cloudskillsboost.google/public_profiles/user-id-2",
      "enrollmentDate": "2025-01-01T00:00:00.000Z"
    }
  ]
}
```

### Scoring Configuration (`config/scoringConfig.json`)

Customize points calculation:

```json
{
  "badges": {
    "cloud-storage": { "points": 100, "multiplier": 1.0 },
    "kubernetes": { "points": 150, "multiplier": 1.2 }
  },
  "difficulty": {
    "beginner": 1.0,
    "intermediate": 1.2,
    "advanced": 1.5
  },
  "bonuses": {
    "completion_streak": {
      "5_streak": 50,
      "10_streak": 150
    }
  }
}
```

## 🎯 Usage

1. **Enter Profile URL**: Input a public Google Cloud Skills Boost profile URL
2. **Verification**: System checks if the profile is enrolled
3. **Data Fetching**: Retrieves and parses profile information
4. **Points Calculation**: Calculates points based on completed items
5. **Results Display**: Shows detailed breakdown and progress

### Profile URL Format
```
https://www.cloudskillsboost.google/public_profiles/YOUR-PROFILE-ID
```

## 🧪 Testing

Run the comprehensive test suite:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm test -- --coverage
```

### Test Coverage

- **Enrollment Checker**: Profile URL validation and enrollment verification
- **Profile Parser**: Data parsing and normalization logic
- **Points Calculator**: Scoring algorithm and bonus calculations
- **API Integration**: End-to-end API functionality

## 🏗️ Architecture

### Backend Components

1. **Enrollment Checker**
   - Validates profile URLs format
   - Checks against enrollment list
   - Supports multiple URL formats

2. **Profile Fetcher**
   - Fetches public profile data
   - Handles network errors gracefully
   - Implements request timeouts

3. **Profile Parser**
   - Parses HTML content intelligently
   - Normalizes badge and game data
   - Categorizes items automatically

4. **Points Calculator**
   - Configurable scoring rules
   - Difficulty-based multipliers
   - Bonus point calculations

### Frontend Features

- **Responsive Design**: Works on all device sizes
- **Progressive Enhancement**: Graceful fallbacks
- **Real-time Feedback**: Loading states and error handling
- **Accessibility**: Keyboard navigation and screen reader support

## 🔌 API Endpoints

### Main Endpoints

- `GET /` - Serve main application
- `POST /api/calculate-points` - Calculate points for a profile
- `GET /api/scoring-config` - Get scoring configuration
- `GET /api/enrollment-list` - Get enrollment list (admin)
- `GET /health` - Health check endpoint

### Example API Usage

```javascript
// Calculate points
const response = await fetch('/api/calculate-points', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    profileUrl: 'https://www.cloudskillsboost.google/public_profiles/example'
  })
});

const result = await response.json();
console.log('Total Points:', result.totalPoints);
```

## 🛠️ Development

### Available Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with auto-reload
- `npm test` - Run test suite
- `npm run test:watch` - Run tests in watch mode

### Adding New Features

1. **New Badge Categories**: Update `config/scoringConfig.json`
2. **Custom Scoring Rules**: Modify `pointsCalculator.js`
3. **UI Enhancements**: Edit files in `public/` directory
4. **API Extensions**: Add routes in `server/server.js`

## 🔒 Security Considerations

- Input validation on all user-provided data
- Protection against XSS attacks
- Rate limiting on API endpoints (recommended)
- Sanitization of HTML content

## 🚨 Troubleshooting

### Common Issues

**Profile not found**
- Verify the profile URL is public
- Check if the URL format is correct
- Ensure the profile ID is valid

**Enrollment verification fails**
- Add the profile URL to `enrolledParticipants.json`
- Check URL format consistency
- Verify the configuration file syntax

**Points calculation errors**
- Review scoring configuration
- Check for missing badge/game categories
- Verify completed items data

### Debug Mode

Set `NODE_ENV=development` for detailed error logging.

## 📊 Performance

- **Caching**: Profile data caching (configurable TTL)
- **Rate Limiting**: API request throttling
- **Optimization**: Efficient DOM manipulation
- **Responsive**: Optimized for various screen sizes

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Google Cloud Skills Boost platform
- Open source community
- Contributors and testers

---

**Note**: This tool is designed for educational and tracking purposes. Make sure to respect Google Cloud Skills Boost's terms of service when using this application.