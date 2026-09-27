# FlowPilot Deployment Guide 🚀

This document outlines the step-by-step procedure to deploy **FlowPilot** to production using **GitHub** and **Vercel** (recommended), **Railway**, or **Docker**.

---

## 1. Production Environment Variables & Credentials

When deploying to Vercel, Railway, or any cloud host, configure the following Environment Variables in the project settings:

| Variable Name | Description | Example / Recommended Value |
|---|---|---|
| `MONGODB_URI` | MongoDB Atlas cluster connection string | `mongodb+srv://<user>:<password>@cluster0.mongodb.net/flowpilot?retryWrites=true&w=majority` |
| `AUTH_SECRET` | 32+ character secret for JWT sessions | `c48f8a129037c87c938ea5f71e89b21f3a9e88d074b9319e83dc74a3f126ef89` |
| `NEXTAUTH_URL` | Canonical public URL of your app | `https://your-app-name.vercel.app` (or custom domain) |
| `AI_API_KEY` | Google Gemini API Key | `your_gemini_api_key_here` |
| `AI_MODEL` | Gemini Model Identifier | `gemini-2.5-flash` |
| `GOOGLE_CLIENT_ID` | (Optional) Google OAuth Client ID | *(Leave empty if using email/password login)* |
| `GOOGLE_CLIENT_SECRET` | (Optional) Google OAuth Secret | *(Leave empty if using email/password login)* |

> **Default Seed Credentials (after running seed):**
> * **Email:** `demo@flowpilot.com`
> * **Password:** `password123`

---

## 2. Option A: Deploy to Vercel (Recommended)

Next.js is built by Vercel; deployment takes under 3 minutes.

### Step 1: Push Code to GitHub
```bash
git add .
git commit -m "feat: FlowPilot full stack ready for production deployment"
# If you haven't linked a remote yet:
# git remote add origin https://github.com/<your-username>/flowpilot.git
# git branch -M main
git push -u origin main
```

### Step 2: Import Project in Vercel
1. Go to [https://vercel.com/new](https://vercel.com/new) and log in with GitHub.
2. Select your `flowpilot` repository and click **Import**.
3. In the **Environment Variables** section, add the 5 variables from the table above:
   * `MONGODB_URI`
   * `AUTH_SECRET`
   * `NEXTAUTH_URL`
   * `AI_API_KEY`
   * `AI_MODEL`
4. Click **Deploy**. Vercel will automatically build and assign a free HTTPS URL (e.g. `https://flowpilot-xxx.vercel.app`).

---

## 3. Setting Up Free MongoDB Atlas (If not already created)

1. Sign up for free at [https://www.mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas).
2. Create a free **M0 Sandbox** cluster (choose AWS or GCP nearest to your users).
3. Under **Database Access**, create a user (e.g., `flowpilot_admin`) with a secure password.
4. Under **Network Access**, add IP Address `0.0.0.0/0` (Allow access from anywhere, required for serverless Vercel functions).
5. Click **Connect** → **Drivers** → **Node.js** and copy the connection string:
   ```
   mongodb+srv://<username>:<password>@cluster0.mongodb.net/flowpilot?retryWrites=true&w=majority
   ```

---

## 4. Seeding the Production Database

To populate your remote database with initial team members, opportunities, and tasks:

```bash
# In your local terminal, run with your production MONGODB_URI:
MONGODB_URI="mongodb+srv://<user>:<password>@cluster0.mongodb.net/flowpilot?retryWrites=true&w=majority" npm run db:seed
```

This will automatically create:
- **Demo User:** `demo@flowpilot.com` / `password123`
- **Organization:** Apex Digital Solutions
- **3 Team Members:** Aarav (Content), Priya (Growth), Rohan (Tech)
- **Active Opportunities & Workflows:** Sponsorship, Lead, Content Tutorial

---

## 5. Option B: Deploy to Railway / Render

### Railway:
1. Go to [https://railway.app/new](https://railway.app/new) and choose **Deploy from GitHub repo**.
2. Add a **MongoDB** plugin directly inside the Railway project (it automatically sets `MONGODB_URI`).
3. Under the Service Settings → **Variables**, set:
   * `AUTH_SECRET`
   * `AI_API_KEY`
   * `AI_MODEL`
   * `NEXTAUTH_URL` (your `https://*.up.railway.app` URL)
4. Railway will automatically build and start `npm run start`.
