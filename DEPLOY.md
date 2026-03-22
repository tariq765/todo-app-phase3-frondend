# Deploy Frontend to Vercel

## Option 1: Using Vercel CLI (Recommended)

### Step 1: Install Vercel CLI
```bash
npm install -g vercel
```

### Step 2: Login to Vercel
```bash
vercel login
```

### Step 3: Deploy
```bash
cd frontend
vercel
```

### Step 4: Deploy to Production
```bash
vercel --prod
```

---

## Option 2: Using Vercel Web Interface

### Step 1: Push to GitHub
1. Make sure your code is pushed to GitHub:
   ```bash
   git add .
   git commit -m "Ready for Vercel deployment"
   git push origin main
   ```

### Step 2: Connect to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Sign in with your GitHub account
3. Click "Add New Project"
4. Import your GitHub repository
5. Select the `frontend` folder as root directory

### Step 3: Configure Environment Variables
In Vercel dashboard, add these environment variables:
- `NEXT_PUBLIC_API_URL` = Your backend URL (e.g., `https://your-backend.herokuapp.com`)

### Step 4: Deploy
Click "Deploy" and Vercel will build and deploy your app!

---

## Post-Deployment

### Update Backend URL
After deploying, update your `.env.production`:
```env
NEXT_PUBLIC_API_URL=https://your-vercel-app.vercel.app
```

### Custom Domain (Optional)
1. Go to Vercel Dashboard
2. Select your project
3. Go to "Settings" > "Domains"
4. Add your custom domain

---

## Troubleshooting

### Build Fails
Make sure you have a `next.config.js` file:
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
}

module.exports = nextConfig
```

### API Calls Fail
- Check CORS settings in backend
- Update `NEXT_PUBLIC_API_URL` in Vercel environment variables
- Make sure backend is deployed and accessible

---

## Quick Deploy Command
```bash
cd frontend && vercel --prod
```
