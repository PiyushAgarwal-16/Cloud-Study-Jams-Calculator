# Deployment Guide for Vercel

## Quick Start

### Prerequisites
- A Vercel account (sign up at https://vercel.com)
- GitHub repository pushed to GitHub

## Deployment Options

### Option 1: Deploy via Vercel Dashboard (Recommended for First-Time)

1. **Push your code to GitHub:**
   ```bash
   git add .
   git commit -m "Prepare for Vercel deployment"
   git push origin main
   ```

2. **Deploy on Vercel:**
   - Go to https://vercel.com/new
   - Click "Import Project"
   - Select your GitHub repository: `Cloud-Study-Jams-Calculator`
   - Vercel will auto-detect the configuration from `vercel.json`
   - Click "Deploy"
   - Wait 1-2 minutes for deployment to complete

3. **Your app will be live at:**
   - `https://your-project-name.vercel.app`

### Option 2: Deploy via Vercel CLI

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel:**
   ```bash
   vercel login
   ```

3. **Deploy (Preview):**
   ```bash
   vercel
   ```

4. **Deploy to Production:**
   ```bash
   vercel --prod
   ```

## What Was Changed for Vercel

### Files Created:
1. ✅ `vercel.json` - Vercel configuration
2. ✅ `api/calculate-points.js` - Serverless function for calculating points
3. ✅ `api/participants.js` - Serverless function for getting participants
4. ✅ `.vercelignore` - Files to exclude from deployment
5. ✅ `VERCEL_DEPLOYMENT.md` - This deployment guide

### Files Modified:
1. ✅ `package.json` - Added `vercel-build` script and Node.js engine specification

### How It Works:
- **Frontend**: Static files from `public/` folder served directly
- **API Routes**: Serverless functions in `api/` folder handle backend logic
- **Endpoints**:
  - `POST /api/calculate-points` - Calculate points for a profile
  - `GET /api/participants` - Get enrolled participants list
- **Config Files**: JSON files in `config/` folder are bundled with serverless functions

## After Deployment

### Test Your Deployment

1. **Test Frontend:**
   - Visit: `https://your-app.vercel.app`
   - Should see the calculator interface

2. **Test API:**
   - Use the web interface to calculate points
   - Enter a valid profile URL from enrolled participants
   - Verify results display correctly

3. **Check Logs:**
   - Go to Vercel Dashboard → Your Project → Deployments
   - Click on latest deployment → "View Function Logs"
   - Monitor for any errors

## Environment Variables (If Needed)

If you need to add environment variables later:

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add variables like:
   - `NODE_ENV=production`
   - Any API keys or secrets

## Custom Domain (Optional)

1. Go to Vercel Dashboard → Your Project → Settings → Domains
2. Click "Add Domain"
3. Enter your custom domain (e.g., `calculator.yourdomain.com`)
4. Follow DNS configuration instructions
5. Wait for SSL certificate to be issued (automatic)

## Troubleshooting

### Common Issues:

1. **API Returns 500 Error:**
   - Check Vercel function logs for detailed error messages
   - Verify all dependencies are in `package.json`
   - Ensure config files are not in `.vercelignore`

2. **Profile Fetching Fails:**
   - Vercel functions have 10-second timeout (free tier)
   - Check if external API (cloudskillsboost.google) is accessible
   - Monitor function logs for network errors

3. **Enrollment Check Fails:**
   - Verify `config/enrolledParticipants.json` is included in deployment
   - Check file path resolution in serverless environment

4. **Frontend Not Loading:**
   - Verify `public/` folder structure is correct
   - Check browser console for errors
   - Ensure static assets are not in `.vercelignore`

## Update Deployment

To update your deployed app:

```bash
# Make your changes
git add .
git commit -m "Update description"
git push origin main
```

Vercel will automatically redeploy when you push to GitHub (if auto-deploy is enabled).

Or manually:
```bash
vercel --prod
```

## Monitoring

- **Analytics**: Enable in Vercel Dashboard → Your Project → Analytics
- **Logs**: Real-time logs available in Vercel Dashboard
- **Performance**: Monitor function execution times and cold starts

## Important Notes

1. **Serverless Architecture**: Each API call runs in an isolated function instance
2. **Cold Starts**: First request might be slower (~1-2 seconds)
3. **Read-Only Filesystem**: Config files are read-only (perfect for your use case)
4. **Automatic HTTPS**: Vercel provides free SSL certificates
5. **Global CDN**: Your app is served from edge locations worldwide

## Support

- Vercel Documentation: https://vercel.com/docs
- Vercel Community: https://github.com/vercel/vercel/discussions

## Project Structure on Vercel

```
Cloud-Study-Jams-Calculator/
├── api/                          # Serverless Functions
│   ├── calculate-points.js       # POST /api/calculate-points
│   └── participants.js           # GET /api/participants
├── public/                       # Static Frontend Files
│   ├── index.html
│   ├── app.js
│   └── style.css
├── server/                       # Backend Modules (used by API functions)
│   └── modules/
├── config/                       # Configuration Files (bundled with functions)
│   ├── enrolledParticipants.json
│   ├── allowedSkillBadges.json
│   └── scoringConfig.json
├── vercel.json                   # Vercel Configuration
└── package.json                  # Dependencies

```

## Next Steps

1. ✅ Files have been created and modified
2. 🔄 Commit and push to GitHub
3. 🚀 Deploy on Vercel
4. ✅ Test your live application
5. 🎉 Share the link!

---

**Ready to Deploy!** Follow Option 1 above to deploy via Vercel Dashboard.
