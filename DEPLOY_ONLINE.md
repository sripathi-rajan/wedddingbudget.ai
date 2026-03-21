# 🌐 Shaadi.AI — Complete Online Hosting Guide
## Deploy FREE in 30 minutes — No credit card needed

---

## 🏗️ Architecture After Deployment

```
Your Users (browser)
        ↓
  ┌─────────────────────────────┐
  │  Vercel (FREE)              │
  │  shaadi-ai.vercel.app       │  ← React frontend
  │  Serves HTML/JS/CSS         │
  └─────────────┬───────────────┘
                │ API calls
  ┌─────────────▼───────────────┐
  │  Render (FREE)              │
  │  shaadi-ai.onrender.com     │  ← FastAPI backend
  │  Budget engine + ML + PSO   │
  └─────────────────────────────┘
```

---

## STEP 1 — Put Code on GitHub (5 min)

### 1a. Create GitHub account
→ Go to https://github.com and sign up (free)

### 1b. Create a new repository
1. Click the **+** button (top right) → **New repository**
2. Name it: `shaadi-ai`
3. Keep it **Public**
4. Click **Create repository**

### 1c. Upload your code

**Option A — Upload via browser (easiest, no Git needed):**
1. Open your `shaadi-ai` folder on your laptop
2. Go to your new GitHub repo page
3. Click **uploading an existing file**
4. Drag ALL files from your `shaadi-ai` folder into the browser
5. Scroll down → Click **Commit changes**

**Option B — Via terminal (Git):**
```bash
cd shaadi-ai
git init
git add .
git commit -m "Initial weddingbudget.ai commit"
git remote add origin https://github.com/sripathi-rajan/weddingbudget.ai.git
git push -u origin main
```

---

## STEP 2 — Deploy Backend on Render (10 min)

Render hosts your FastAPI + ML backend for FREE.

### 2a. Create Render account
→ Go to https://render.com → **Get Started for Free**
→ Sign up with your GitHub account (easier — links automatically)

### 2b. Create a new Web Service
1. Click **+ New** → **Web Service**
2. Click **Connect a repository**
3. Select your `shaadi-ai` repo
4. Configure it:

| Setting | Value |
|---------|-------|
| **Name** | shaadi-ai-backend |
| **Region** | Singapore (closest to India) |
| **Branch** | main |
| **Root Directory** | `backend` |
| **Runtime** | Python 3 |
| **Build Command** | `pip install -r requirements.txt && python ml/train.py` |
| **Start Command** | `uvicorn main:app --host 0.0.0.0 --port $PORT` |
| **Plan** | **Free** |

5. Click **Create Web Service**
6. Wait ~3-5 minutes for first deploy
7. You'll get a URL like: `https://shaadi-ai-backend.onrender.com`
8. **Save this URL** — you need it in Step 3

### 2c. Test your backend
Open: `https://shaadi-ai-backend.onrender.com/docs`
You should see the FastAPI Swagger UI ✅

> ⚠️ Free Render instances "sleep" after 15 min of inactivity.
> First request after sleep takes ~30 seconds to wake up.
> This is fine for demos — just open the backend URL once before presenting.

---

## STEP 3 — Deploy Frontend on Vercel (10 min)

Vercel hosts your React app for FREE with global CDN.

### 3a. Create Vercel account
→ Go to https://vercel.com → **Sign Up**
→ Sign up with GitHub account

### 3b. Import your project
1. Click **+ New Project**
2. Import your `shaadi-ai` repository
3. Configure:

| Setting | Value |
|---------|-------|
| **Framework Preset** | Vite |
| **Root Directory** | `frontend` |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |

4. Click **Environment Variables** → Add:

| Key | Value |
|-----|-------|
| `VITE_API_URL` | `https://shaadi-ai-backend.onrender.com/api` |

   (Replace with your actual Render URL from Step 2)

5. Click **Deploy**
6. Wait ~2 minutes
7. You'll get a URL like: `https://shaadi-ai.vercel.app`

### 3c. Test your full app
Open: `https://shaadi-ai.vercel.app`
Fill in a few tabs → Go to Budget tab → Click **Generate My Budget** ✅

---

## STEP 4 — Custom Domain (Optional, FREE)

If you want `www.shaadi-ai.in` instead of `shaadi-ai.vercel.app`:

1. Buy domain at GoDaddy / Namecheap (~₹500/year for `.in`)
2. In Vercel → Project Settings → **Domains**
3. Add your domain → Follow DNS instructions

---

## STEP 5 — Share with Users

Your app is now live at two URLs:

- **Frontend (share this):** `https://shaadi-ai.vercel.app`
- **Backend API:** `https://shaadi-ai-backend.onrender.com`
- **API Docs:** `https://shaadi-ai-backend.onrender.com/docs`

Share the frontend URL with anyone — works on mobile, tablet, laptop.

---

## ⚡ Quick Updates (after initial deploy)

Every time you change code and push to GitHub:
```bash
git add .
git commit -m "Update: improved PSO optimizer"
git push
```
→ Vercel auto-redeploys frontend in ~1 min
→ Render auto-redeploys backend in ~3 min

---

## 🔧 Troubleshooting

| Problem | Fix |
|---------|-----|
| Render says "Build failed" | Check Build Command — must be exactly: `pip install -r requirements.txt && python ml/train.py` |
| Render URL gives 502 | Wait 2 min after deploy, then try again |
| Frontend loads but budget doesn't work | Check `VITE_API_URL` env var in Vercel — must end with `/api` |
| "CORS error" in browser console | Backend main.py already has `allow_origins=["*"]` — re-deploy backend |
| Render sleeps too much | Upgrade to Render Starter ($7/mo) for always-on |

---

## 💰 Cost Summary

| Service | Free Tier Limits | Cost |
|---------|-----------------|------|
| **Vercel** | Unlimited deploys, 100GB bandwidth/mo | **FREE** |
| **Render** | 750 hrs/mo compute, sleeps after 15 min | **FREE** |
| **GitHub** | Unlimited public repos | **FREE** |
| **Total** | | **₹0/month** |

---

## 🚀 For Hackathon Demo Day

1. Open `https://shaadi-ai-backend.onrender.com/health` **5 min before demo** to wake the server
2. Share `https://shaadi-ai.vercel.app` with judges on their phones
3. Show the live URL — judges can interact on their own devices!

---
Built with ❤️ for hackathon — Shaadi.AI
