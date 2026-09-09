# finTrack — Personal Expense Tracker

A lightning-fast, mobile-first, Apple Shortcut-compatible personal expense tracker web application built for daily iPhone usage.

**Core Philosophy:** Record an expense in less than 5 seconds.
**Cost:** $0/month (Runs completely on Supabase & Vercel free tiers).
**Guarantees:** Zero AI, zero OCR, zero paid APIs, zero third-party tracking.

---

## Tech Stack
- **Frontend:** Next.js (App Router), TypeScript, Tailwind CSS, Lucide Icons, next-themes
- **Charts:** Recharts (Donut, Bar, Area charts)
- **Excel:** SheetJS (`xlsx`) for multi-sheet professional workbooks
- **Backend & Database:** Next.js Route Handlers + Supabase PostgreSQL with Row Level Security (RLS)
- **Mobile Integration:** Apple Shortcuts HTTP webhook (`/api/expenses/quick`) + PWA installable manifest

---

## Quick Start (Local Run)

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run development server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000).

> **Out-of-the-Box Demo Mode:** The app runs with full persistence and realistic demo data (Food, Transport, UPI, salary ₹80,000, etc.) even before configuring Supabase credentials.

---

## Supabase Setup ($0/month Free Tier)

1. Create a free project at [supabase.com](https://supabase.com).
2. Go to **SQL Editor** in your Supabase dashboard and run the entire script found in:
   [`supabase/schema.sql`](./supabase/schema.sql)
3. In your Supabase Project Settings → **API**, copy your:
   - Project URL
   - Anonymous Key (`anon` / `public`)
4. Create `.env.local` in this repo:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
5. Restart your server. All your transactions, budgets, goals, and categories will now sync to Supabase PostgreSQL with Row Level Security.

---

## Google OAuth Setup (Multi-User Login)

To enable Google sign-in for you and your family/friends:

1. Go to the [Google Cloud Console](https://console.cloud.google.com/apis/credentials).
2. Create a project or select an existing one.
3. Configure the **OAuth Consent Screen** (User Type: *External*, fill App Name "finTrack" and your email).
4. Go to **Credentials → Create Credentials → OAuth Client ID**:
   - Application Type: **Web application**
   - Name: `finTrack Web Client`
   - **Authorized redirect URIs:**
     - Add: `https://<your-supabase-ref>.supabase.co/auth/v1/callback`
     - (And for local testing): `http://localhost:3000/auth/callback`
5. Copy your **Client ID** and **Client Secret**.
6. In your **Supabase Dashboard**:
   - Go to **Authentication → Providers → Google**.
   - Toggle **Enable Google provider** to ON.
   - Paste your **Client ID** and **Client Secret**.
   - Click **Save**.

Now anyone can click **Continue with Google** on the `/login` page, and Supabase will automatically create their profile with their Google name and avatar, completely isolating their expenses and budgets with Row Level Security.

---

## iPhone Back Tap & Apple Shortcut Setup

Record expenses without even opening Safari:

1. In finTrack, navigate to **Settings** (`/settings`) and copy your **Shortcut Webhook URL** and **API Key**.
2. Open the **Shortcuts** app on your iPhone and tap **+**:
   - Action 1: **Ask for Input** (Type: *Number*, Prompt: *"Amount ₹"*).
   - Action 2: **Choose from List** (Items: *Food*, *Transport*, *Shopping*, *Bills*, *Other*).
   - Action 3: **Get Contents of URL**:
     - URL: `https://your-domain.vercel.app/api/expenses/quick`
     - Method: `POST`
     - Headers: Key `x-api-key` → Value: `<Your API Key>`
     - Request Body: `JSON`
       - `amount` (Number): Provided Input
       - `category` (Text): Chosen Item
   - Action 4: **Show Notification**: *"Expense added ✓"*
3. Go to iPhone **Settings → Accessibility → Touch → Back Tap**.
4. Set **Double Tap** → Select your new shortcut!

Now, double-tapping the back of your iPhone prompts for the amount and category, and immediately records the expense in finTrack.

---

## Multi-Sheet Excel Export

Click **Export Excel** from the Dashboard, Transactions, or Settings page to download a formatted `.xlsx` workbook containing:
- **Sheet 1: Transactions** (Date, Merchant, Category, Payment Method, Amount, Note)
- **Sheet 2: Monthly Summary** (Income, Total Spend, Savings, Rate, Budget)
- **Sheet 3: Category Analysis** (Total, Share %, Budget, Variance)
- **Sheet 4: Payment Methods** (Breakdown by UPI, Card, Cash)
- **Sheet 5: Goals** (Targets, Balances, Deadlines)
- **Sheet 6: Dashboard** (High-level financial KPIs)

---

## Vercel Deployment

1. Push your code to a GitHub repository:
   ```bash
   git add .
   git commit -m "feat: complete finTrack personal expense tracker"
   git push origin main
   ```
2. Import your repository into [Vercel](https://vercel.com).
3. In the Vercel Project Settings → **Environment Variables**, add:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Click **Deploy**.
