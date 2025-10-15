# 🌟 Cloud Study Jams Calculator# 🌟 Google Cloud Skills Boost Calculator



A comprehensive web application for analyzing Google Cloud Skills Boost profiles and calculating progress based on completed badges and games. Built for **GDG On Campus Poornima University** to track participants' learning progress in Cloud Study Jams programs.A comprehensive web application for analyzing Google Cloud Skills Boost profiles and calculating points based on completed badges and games. This tool helps track learning progress and provides detailed insights into skill development.



**Created by:** [Piyush Agarwal](https://www.linkedin.com/in/your-linkedin-profile)## ✨ Features



---- **Profile Verification**: Validates against a predefined list of enrolled participants

- **Automated Fetching**: Retrieves profile data from public Google Cloud Skills Boost URLs

## ✨ Features- **Smart Parsing**: Identifies completed skill badges and games with intelligent categorization

- **Points Calculation**: Calculates points based on configurable scoring rules

- **Profile Verification**: Validates participants against enrolled list (196 participants)- **Progress Tracking**: Visual progress indicators and completion percentages

- **Automated Fetching**: Retrieves profile data from public Google Cloud Skills Boost URLs- **Detailed Breakdown**: Shows points breakdown by badges, games, and bonuses

- **Smart Badge Recognition**: Identifies and filters only program-specific badges (19 badges)- **Responsive Design**: Modern, mobile-friendly user interface

- **Game Tracking**: Tracks completion of arcade games (1 game)- **Export Functionality**: Export results to JSON for record-keeping

- **Accurate Progress**: Shows progress as completed/total (e.g., 7/19 badges)

- **Points Calculation**: Calculates points based on configurable scoring rules with multipliers## 🚀 Quick Start

- **Progress Tracking**: Visual progress indicators with accurate percentages

- **Clean Interface**: Modern, mobile-friendly design with streamlined results display### Prerequisites

- **Alternate Name Matching**: Handles badge title variations across profiles

- **Double-Counting Prevention**: Ensures games aren't counted as both badges and games- Node.js (version 14 or higher)

- npm (comes with Node.js)

## 🎯 Program Requirements

### Installation

This calculator tracks completion of:

- **19 Skill Badges** (required for program completion)1. **Clone or download the project**

- **1 Arcade Game** (Level 3: Generative AI)   ```bash

- **Overall Progress**: Displayed as completed items out of 20 total   cd "Google Cloud Skills Boost Calculator"

   ```

## 🚀 Quick Start

2. **Install dependencies**

### Prerequisites   ```bash

   npm install

- Node.js (version 18 or higher)   ```

- npm (comes with Node.js)

3. **Configure the application**

### Local Development   ```bash

   # Copy environment template

1. **Clone the repository**   copy .env.example .env

   ```bash   

   git clone https://github.com/PiyushAgarwal-16/Cloud-Study-Jams-Calculator.git   # Edit enrollment list (add your participants)

   cd Cloud-Study-Jams-Calculator   # Edit config/enrolledParticipants.json

   ```   

   # Customize scoring rules (optional)

2. **Install dependencies**   # Edit config/scoringConfig.json

   ```bash   ```

   npm install

   ```4. **Start the application**

   ```bash

3. **Start the development server**   # Development mode with auto-restart

   ```bash   npm run dev

   npm run dev   

   ```   # Or production mode

   npm start

4. **Open your browser**   ```

   ```

   http://localhost:30015. **Open your browser**

   ```   Navigate to `http://localhost:3000`



5. **Test the calculator**## 📁 Project Structure

   - Enter a Google Cloud Skills Boost public profile URL

   - Click "Calculate Points"```

   - View badges, games, and progress├── server/                 # Backend Node.js application

│   ├── modules/           # Core business logic modules

## 🌐 Deployment│   │   ├── enrollmentChecker.js    # Participant verification

│   │   ├── profileFetcher.js       # Profile data fetching

### Deploy to Vercel (Recommended)│   │   ├── profileParser.js        # Data parsing & normalization

│   │   └── pointsCalculator.js     # Points calculation engine

This project is configured for **one-click deployment** to Vercel with serverless functions:│   └── server.js          # Express.js server setup

├── public/                # Frontend web application

#### Quick Deploy│   ├── index.html         # Main HTML page

│   ├── app.js            # Frontend JavaScript

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/PiyushAgarwal-16/Cloud-Study-Jams-Calculator)│   └── style.css         # Styling and responsive design

├── config/               # Configuration files

#### Manual Deployment│   ├── enrolledParticipants.json   # List of enrolled users

│   └── scoringConfig.json          # Points calculation rules

1. **Push to GitHub** ✅ (already done)├── tests/                # Unit and integration tests

└── package.json          # Dependencies and scripts

2. **Deploy on Vercel**```

   - Go to [vercel.com/new](https://vercel.com/new)

   - Click "Import Project"## 🔧 Configuration

   - Select: `PiyushAgarwal-16/Cloud-Study-Jams-Calculator`

   - Click "Deploy"### Enrollment List (`config/enrolledParticipants.json`)

   - Wait 1-2 minutes

   - Your app is live! 🎉Add participant profile URLs to verify enrollment:



3. **Features on Vercel**```json

   - ✅ Serverless API functions{

   - ✅ Global CDN for fast access  "participants": [

   - ✅ Automatic HTTPS/SSL    "https://www.cloudskillsboost.google/public_profiles/user-id-1",

   - ✅ Auto-deploy on git push    {

   - ✅ Free tier available      "name": "Student Name",

      "profileUrl": "https://www.cloudskillsboost.google/public_profiles/user-id-2",

**📖 Detailed Guide:** See [VERCEL_DEPLOYMENT.md](VERCEL_DEPLOYMENT.md) for complete instructions      "enrollmentDate": "2025-01-01T00:00:00.000Z"

    }

### Alternative Deployment Options  ]

}

- **Heroku**: Use Procfile with `web: node server/server.js````

- **Railway**: Auto-detects and deploys Node.js apps

- **DigitalOcean App Platform**: Connect GitHub and deploy### Scoring Configuration (`config/scoringConfig.json`)

- **AWS EC2/Lightsail**: Traditional server with PM2

- **Google Cloud Run**: Containerized deploymentCustomize points calculation:



## 📁 Project Structure```json

{

```  "badges": {

Cloud-Study-Jams-Calculator/    "cloud-storage": { "points": 100, "multiplier": 1.0 },

├── api/                            # Vercel Serverless Functions    "kubernetes": { "points": 150, "multiplier": 1.2 }

│   ├── calculate-points.js         # POST /api/calculate-points  },

│   └── participants.js             # GET /api/participants  "difficulty": {

│    "beginner": 1.0,

├── server/                         # Backend Node.js Application    "intermediate": 1.2,

│   ├── modules/                    # Core Business Logic    "advanced": 1.5

│   │   ├── enrollmentChecker.js    # Participant verification (196 enrolled)  },

│   │   ├── profileFetcher.js       # Profile fetching with Cheerio/Axios  "bonuses": {

│   │   ├── profileParser.js        # HTML parsing & data extraction    "completion_streak": {

│   │   └── pointsCalculator.js     # Points calculation with filtering      "5_streak": 50,

│   └── server.js                   # Express server (local development)      "10_streak": 150

│    }

├── public/                         # Frontend Static Files  }

│   ├── index.html                  # Main HTML interface}

│   ├── app.js                     # Frontend JavaScript logic```

│   └── style.css                  # Styling and responsive design

│## 🎯 Usage

├── config/                         # Configuration Files

│   ├── enrolledParticipants.json   # 196 enrolled participants1. **Enter Profile URL**: Input a public Google Cloud Skills Boost profile URL

│   ├── allowedSkillBadges.json     # 20 program items (19 badges + 1 game)2. **Verification**: System checks if the profile is enrolled

│   └── scoringConfig.json          # Points calculation rules3. **Data Fetching**: Retrieves and parses profile information

│4. **Points Calculation**: Calculates points based on completed items

├── vercel.json                     # Vercel deployment config5. **Results Display**: Shows detailed breakdown and progress

├── .vercelignore                   # Files excluded from deployment

├── package.json                    # Dependencies and scripts### Profile URL Format

└── README.md                       # This file```

```https://www.cloudskillsboost.google/public_profiles/YOUR-PROFILE-ID

```

## 🔧 Configuration Files

## 🧪 Testing

### 1. Enrollment List (`config/enrolledParticipants.json`)

Run the comprehensive test suite:

Contains **196 enrolled participants** with their profile information:

```bash

```json# Run all tests

{npm test

  "totalParticipants": 196,

  "lastUpdated": "2025-10-06T00:00:00.000Z",# Run tests in watch mode

  "participants": [npm run test:watch

    {

      "profileId": "094570fc-5267-4f2b-864b-1a7e30af7dd8",# Run tests with coverage

      "profileUrl": "https://www.cloudskillsboost.google/public_profiles/094570fc-5267-4f2b-864b-1a7e30af7dd8",npm test -- --coverage

      "name": "Student Name",```

      "batch": "2024-2025",

      "enrollmentDate": "2025-10-01T00:00:00.000Z",### Test Coverage

      "status": "enrolled"

    }- **Enrollment Checker**: Profile URL validation and enrollment verification

  ]- **Profile Parser**: Data parsing and normalization logic

}- **Points Calculator**: Scoring algorithm and bonus calculations

```- **API Integration**: End-to-end API functionality



### 2. Allowed Badges (`config/allowedSkillBadges.json`)## 🏗️ Architecture



Defines **20 program-specific items** to track (19 badges + 1 game):### Backend Components



```json1. **Enrollment Checker**

{   - Validates profile URLs format

  "metadata": {   - Checks against enrollment list

    "totalCount": 20,   - Supports multiple URL formats

    "badgeCount": 19,

    "gameCount": 1,2. **Profile Fetcher**

    "programName": "Cloud Study Jams 2024-2025"   - Fetches public profile data

  },   - Handles network errors gracefully

  "allowedSkillBadges": [   - Implements request timeouts

    {

      "name": "Get Started with Cloud Storage",3. **Profile Parser**

      "url": "/course_templates/725",   - Parses HTML content intelligently

      "category": "introductory",   - Normalizes badge and game data

      "difficulty": "introductory",   - Categorizes items automatically

      "alternateNames": []

    },4. **Points Calculator**

    {   - Configurable scoring rules

      "name": "Cloud Functions: 3 Ways",   - Difficulty-based multipliers

      "url": "/course_templates/696",   - Bonus point calculations

      "category": "intermediate",

      "difficulty": "intermediate",### Frontend Features

      "alternateNames": ["Cloud Run Functions: 3 Ways"]

    },- **Responsive Design**: Works on all device sizes

    {- **Progressive Enhancement**: Graceful fallbacks

      "name": "Gen AI Arcade Game: Level 3",- **Real-time Feedback**: Loading states and error handling

      "url": "/games/32800",- **Accessibility**: Keyboard navigation and screen reader support

      "category": "arcade-game",

      "difficulty": "introductory",## 🔌 API Endpoints

      "type": "game",

      "gameId": "32800",### Main Endpoints

      "alternateNames": ["Level 3: Generative AI"]

    }- `GET /` - Serve main application

  ]- `POST /api/calculate-points` - Calculate points for a profile

}- `GET /api/scoring-config` - Get scoring configuration

```- `GET /api/enrollment-list` - Get enrollment list (admin)

- `GET /health` - Health check endpoint

**Key Features:**

- ✅ Filters to only count program-specific badges/games### Example API Usage

- ✅ Supports alternate names for title variations

- ✅ Prevents double-counting games as badges```javascript

// Calculate points

### 3. Scoring Configuration (`config/scoringConfig.json`)const response = await fetch('/api/calculate-points', {

  method: 'POST',

Customizable points calculation rules:  headers: { 'Content-Type': 'application/json' },

  body: JSON.stringify({

```json    profileUrl: 'https://www.cloudskillsboost.google/public_profiles/example'

{  })

  "version": "2.0",});

  "basePoints": {

    "badge": 100,const result = await response.json();

    "game": 40console.log('Total Points:', result.totalPoints);

  },```

  "categoryMultipliers": {

    "badges": {## 🛠️ Development

      "introductory": 1.2,

      "intermediate": 1.5,### Available Scripts

      "advanced": 2.0

    }- `npm start` - Start production server

  },- `npm run dev` - Start development server with auto-reload

  "difficultyMultipliers": {- `npm test` - Run test suite

    "introductory": 1.0,- `npm run test:watch` - Run tests in watch mode

    "intermediate": 1.1,

    "advanced": 1.2,### Adding New Features

    "expert": 1.5

  }1. **New Badge Categories**: Update `config/scoringConfig.json`

}2. **Custom Scoring Rules**: Modify `pointsCalculator.js`

```3. **UI Enhancements**: Edit files in `public/` directory

4. **API Extensions**: Add routes in `server/server.js`

## 🎨 User Interface

## 🔒 Security Considerations

### Results Display

- Input validation on all user-provided data

- **Completed Badges**: Shows X/19 progress- Protection against XSS attacks

- **Completed Games**: Shows X/1 progress  - Rate limiting on API endpoints (recommended)

- **Overall Progress**: Combined percentage (X/20)- Sanitization of HTML content

- **Progress Bars**: Visual indicators for badges and games

- **Badges Tab**: List of all completed badges with categories## 🚨 Troubleshooting

- **Games Tab**: List of completed arcade games

### Common Issues

### Simplified Design

**Profile not found**

- ❌ Total points removed from main results- Verify the profile URL is public

- ❌ Individual badge points removed- Check if the URL format is correct

- ❌ Points breakdown section removed- Ensure the profile ID is valid

- ❌ Participant information section removed

- ❌ Bonus points section removed**Enrollment verification fails**

- ❌ Export results button removed- Add the profile URL to `enrolledParticipants.json`

- Check URL format consistency

## 🔍 How It Works- Verify the configuration file syntax



### 1. **Enrollment Verification****Points calculation errors**

   - User enters Google Cloud Skills Boost profile URL- Review scoring configuration

   - System checks if profile is in enrolled participants list (196 profiles)- Check for missing badge/game categories

   - Returns error if not enrolled- Verify completed items data



### 2. **Profile Fetching**### Debug Mode

   - Fetches public profile HTML using Axios

   - Extracts badge and game data using Cheerio (jQuery-like parser)Set `NODE_ENV=development` for detailed error logging.

   - Handles both badges and arcade games from profile

## 📊 Performance

### 3. **Badge/Game Classification**

   - Distinguishes between badges and games using URL patterns- **Caching**: Profile data caching (configurable TTL)

   - Games have `/games/` in URL, badges have `/course_templates/`- **Rate Limiting**: API request throttling

   - Prevents double-counting of games- **Optimization**: Efficient DOM manipulation

- **Responsive**: Optimized for various screen sizes

### 4. **Filtering**

   - Compares completed items against allowed list (20 items)## 🤝 Contributing

   - Matches by title (including alternate names)

   - Only counts program-specific items1. Fork the repository

2. Create a feature branch

### 5. **Points Calculation**3. Make your changes

   - Applies base points (badges: 100, games: 40)4. Add tests for new functionality

   - Multiplies by category multiplier (1.2x - 2.0x)5. Ensure all tests pass

   - Multiplies by difficulty multiplier (1.0x - 1.5x)6. Submit a pull request

   - Rounds to final point value

## 📄 License

### 6. **Progress Tracking**

   - Badges: completed/19This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

   - Games: completed/1

   - Overall: completed/20 with percentage## 🙏 Acknowledgments



## 🛠️ Technology Stack- Google Cloud Skills Boost platform

- Open source community

### Backend- Contributors and testers

- **Node.js** - JavaScript runtime

- **Express.js** - Web framework---

- **Axios** - HTTP client for profile fetching

- **Cheerio** - HTML parsing (jQuery-like)**Note**: This tool is designed for educational and tracking purposes. Make sure to respect Google Cloud Skills Boost's terms of service when using this application.
- **CORS** - Cross-origin resource sharing

### Frontend
- **Vanilla JavaScript** - No frameworks, lightweight
- **HTML5** - Semantic markup
- **CSS3** - Modern styling with flexbox/grid
- **Fetch API** - Async HTTP requests

### Deployment
- **Vercel** - Serverless functions and hosting
- **GitHub** - Version control and CI/CD

## 📊 API Endpoints

### Local Development (port 3001)

```bash
POST http://localhost:3001/api/calculate-points
GET  http://localhost:3001/api/participants
```

### Vercel Production

```bash
POST https://your-app.vercel.app/api/calculate-points
GET  https://your-app.vercel.app/api/participants
```

### Calculate Points Endpoint

**Request:**
```json
POST /api/calculate-points
Content-Type: application/json

{
  "profileUrl": "https://www.cloudskillsboost.google/public_profiles/094570fc-5267-4f2b-864b-1a7e30af7dd8"
}
```

**Response:**
```json
{
  "success": true,
  "enrolled": true,
  "participant": {
    "name": "Student Name",
    "batch": "2024-2025"
  },
  "totalPoints": 3714,
  "completedBadges": [...],
  "completedGames": [...],
  "breakdown": {
    "badges": { "count": 19, "points": 2666, "items": [...] },
    "games": { "count": 1, "points": 48, "items": [...] }
  },
  "progress": {
    "badges": { "completed": 19, "total": 19, "percentage": 100 },
    "games": { "completed": 1, "total": 1, "percentage": 100 },
    "overall": { "completed": 20, "total": 20, "percentage": 100 }
  }
}
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch
```

## 📝 Scripts

```json
{
  "start": "node server/server.js",           // Production server
  "dev": "nodemon server/server.js",          // Development with auto-reload
  "test": "jest",                             // Run tests
  "vercel-build": "echo 'Build complete'"     // Vercel build command
}
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👨‍💻 Author

**Piyush Agarwal**
- LinkedIn: [Connect with me](https://www.linkedin.com/in/your-linkedin-profile)
- GitHub: [@PiyushAgarwal-16](https://github.com/PiyushAgarwal-16)

## 🏫 Organization

**GDG On Campus Poornima University**
- Website: [GDG Poornima University](https://gdg.community.dev/gdg-on-campus-poornima-university-jaipur-india/)
- Program: Cloud Study Jams 2024-2025

## 🙏 Acknowledgments

- Google Cloud Skills Boost platform
- GDG On Campus Poornima University
- All 196 enrolled participants
- Contributors and testers

## 📞 Support

For issues, questions, or suggestions:
- **GitHub Issues**: [Create an issue](https://github.com/PiyushAgarwal-16/Cloud-Study-Jams-Calculator/issues)
- **Email**: Contact through LinkedIn profile
- **Documentation**: See [VERCEL_DEPLOYMENT.md](VERCEL_DEPLOYMENT.md) for deployment help

---

**⭐ Star this repository if you find it helpful!**

Made with ❤️ by Piyush Agarwal for GDG On Campus Poornima University
