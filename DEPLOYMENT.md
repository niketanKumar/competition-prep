# 🚀 HomeoPrep — Free Hosting & Deployment Guide

This guide explains how to host your HomeoPrep Progressive Web App (PWA) online for **FREE** using Vercel or Netlify, so that both you (Admin) and your friend (Student) can access it anywhere from phones, tablets, or computers and install it as an app on your home screens.

---

## Option 1: Deploy on Vercel (Recommended — 2 Minutes)

Vercel is free, blazing fast, and provides automatic HTTPS which is required for PWA installation and Push Notifications.

### Step-by-Step Instructions:

1. **Create a GitHub Repository**:
   - Go to [GitHub.com](https://github.com) and click **New Repository**.
   - Name it `aiapget-prep`.
   - Run these commands in Terminal from your project directory (`/Users/niketan/Project/aiapget-prep`):
     ```bash
     cd /Users/niketan/Project/aiapget-prep
     git init
     git add .
     git commit -m "Initial HomeoPrep PWA release"
     git branch -M main
     git remote add origin https://github.com/YOUR_GITHUB_USERNAME/aiapget-prep.git
     git push -u origin main
     ```

2. **Deploy on Vercel**:
   - Go to [Vercel.com](https://vercel.com) and sign in with GitHub.
   - Click **Add New... → Project**.
   - Import the `aiapget-prep` repository.
   - Framework Preset: Select **Other** (since it's pure HTML/JS).
   - Click **Deploy**.

3. **Done!**
   - Vercel will give you a live URL like `https://aiapget-prep.vercel.app`.

---

## Option 2: Deploy on Netlify (Alternative — No Command Line Needed)

1. Go to [Netlify.com](https://netlify.com) and sign up for a free account.
2. Go to **Sites → Add new site → Deploy manually**.
3. Open your Mac Finder at `/Users/niketan/Project/aiapget-prep`.
4. Drag and drop the `aiapget-prep` folder directly onto the Netlify webpage!
5. Netlify will deploy your site in 5 seconds and give you a live URL.

---

## 📱 How to Install the App on Mobile (PWA Setup)

Once your app is deployed to a live URL (`https://...`):

### On iPhone / iPad (Safari):
1. Open the live URL in **Safari**.
2. Tap the **Share button** (the square with an arrow pointing up).
3. Scroll down and tap **"Add to Home Screen"**.
4. Tap **Add**. The HomeoPrep icon will appear on your iPhone home screen just like a native app!

### On Android (Chrome / Brave):
1. Open the live URL in **Chrome** or **Brave**.
2. Tap the **three dots (⋮)** menu in the top right.
3. Tap **"Install app"** or **"Add to Home screen"**.
4. Confirm. The app will be installed on your phone.

---

## 🗄️ Setting Up Supabase for Device Sync (Optional)

To automatically sync progress, scores, and test history between your phone and your friend's phone:

1. Go to [Supabase.com](https://supabase.com) and create a free project.
2. Go to **SQL Editor** in Supabase and paste the contents of `schema.sql` (found in your project folder). Click **Run**.
3. Go to **Project Settings → API** and copy:
   - **Project URL**
   - **anon public key**
4. Open HomeoPrep → **Settings → Supabase Backend** → paste the URL and Key. Click **Save & Reconnect**.

---

## 🔑 Adding Gemini AI Key for Explanations & PDF Extraction

1. Get a free API key from [Google AI Studio](https://aistudio.google.com).
2. Open HomeoPrep → **Settings → AI Configuration** → paste your API key. Click **Add Key**.
3. You can now use AI explanation generation and Document PDF Extraction!
