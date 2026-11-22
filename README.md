# BaakiPay — *Every rupee, right on time.*

**Live Demo:** [https://baakipay.onrender.com](https://baakipay.onrender.com)  
*(Note: Hosted on Render's free tier — the first request after 15 minutes of inactivity may take 30–50 seconds to wake up.)*

**Demo Account (Synthetic Sample Data):**
- **Email:** `lakshmi@baakipay.in`
- **Password:** `BaakiPay@2026`
- **New Shop Sign-Up OTP (Sandbox):** `123456`

> **Built using [Codebenders IDE](https://www.codebenders.ai/) (Nexen)** for **ACE Builders Hackathon 2026** — Problem Statement 1: *Small Business Operations — The One-Person Back Office*.

## The Problem

India's general trade retail market is projected to grow from **$932B (FY25P) to $1,338B (FY30P)** (PwC India, *The Retail Reinvention Paradigm*, Feb 2025), yet **53% of neighborhood Kirana and packaged-goods shops still run with zero technology**, while **59–60% actively want better digital tools**.

At the same time:
- **36% of neighborhood shoppers rely on monthly credit (`baaki`)** (PwC India, Feb 2025).
- **44% of retailers depend on supplier credit, 55% on bank loans, and 64% self-fund** (PwC India, Feb 2025).
- India faces a **₹30 lakh crore MSME credit deficit**, with only **18% digital lending adoption** ([Deloitte India Economic Outlook, Oct 2025](https://www.deloitte.com/in/en/our-thinking/spotlight-on-indian-economy/india-economic-outlook-october-2025.html)), even as commercial credit reached **₹67.6 lakh crore (+16% YoY)** ([TransUnion CIBIL MSME Pulse, Dec 2025](https://www.transunioncibil.com/content/dam/transunion-cibil/corporate/documents/msme-report-apr.pdf)) and lenders shift toward cash-flow-based underwriting for new-to-credit MSMEs ([HDB / CRISIL Industry Report, June 2025](https://www.hdbfs.com/sites/default/files/investor-service/IndustryReportJune2025.pdf)).

A 1–5 person shop owner acts as cashier, buyer, accountant, and collector—losing cash flow to forgotten credit, awkward payment follow-ups, unverified UPI screenshots, and surprise rent/supplier shortfalls.

## What BaakiPay Does

BaakiPay is a **mobile-first, trilingual (English, తెలుగు, हिन्दी)** one-person back office built specifically for Indian neighborhood shops:

1. **Cash Forecast Engine, Safe Cash Buffer & What-If Simulator (Killer Feature)**
   - 2-column fintech layout pairing an interactive **7/30/60/90-day area chart** with a live **Cash Gap / Cash Safe Status Widget**.
   - Lets shopkeepers set a **Minimum Safe Cash Buffer (Reserve Fund)** and shows plain, human-friendly shortfall guidance in **English, Telugu, and Hindi**.
   - **3 Interactive What-If Toggles (Pro / 14-Day Trial):**
     - *Top customer pays 15 days late*
     - *Bad day: 5 customers pay 15 days late*
     - *Give ₹15,000 more credit (paid back in 35 days)*

2. **2-Tap Billing, Voice-to-Bill, UPI QR & 1-Page Print-Clean PDF**
   - Includes a **searchable Customer combobox** with inline **`+ Add New Customer`** and a multi-language **Voice-to-Bill mic** (`EN/తె/हि` — speak *"kandipappu 5 kgs 300"* to auto-fill item, quantity, and unit price).
   - Creates sequential, unique invoices (`INV-001`, `INV-002`, ...) with **80%+ credit-limit warnings**, an immutable **SHA-256 `record_hash`**, scannable **UPI QR** (`qrcode.react`), 1-page printable PDF, and itemized WhatsApp sharing.

3. **Clickable Open Invoice Badges & 1-Tap Customer Monthly Statement PDF**
   - Every customer card displays brand-colored, searchable **open invoice pills** (e.g., `INV-013 ↗`, `INV-022 ↗`)—tap any pill to re-open its Invoice Proof / PDF / WhatsApp modal anytime, or tap **Statement** for a 1-page printable customer ledger statement.

4. **Safe 3-Step Paste UPI SMS Auto-Match (Privacy-First)**
   - Never asks for Android/iOS SMS inbox permissions and never touches bank OTPs.
   - Parses `Rs.` / `INR` / `₹` amounts (ignoring UPI Ref IDs), `INV-XXX` codes, and sender names, disambiguates multi-name matches (*Rahul Sharma* vs. *Rahul Verma*), handles partial payments, and **always requires 1-tap owner confirmation**.

5. **Assisted WhatsApp Reminders & Safe Demo Mode**
   - Home Dashboard surfaces the **Top 3 overdue customers** not reminded in the last 24 hours, with **Gentle, Firm, and Urgent** templates in **English, Telugu, and Hindi**.
   - Synthetic demo numbers (`90000000XX`) safely open `wa.me/?text=...` so reviewers can preview in **"Message Yourself"** without ever messaging a real person.

6. **My Bills, Business Health PDF, Digital Shop Card, CSV Backup & InfoTips**
   - Tracks recurring shop bills with confirmation-guarded deletes and atomic PostgreSQL cash updates.
   - Generates a **6-month Business Health Analytics** view with localized Smart Tips and a printable **Business Health Summary PDF** (with SHA-256 verification hash and non-audited operational disclaimer).
   - Settings includes a **Shareable Digital Shop Card** (UPI QR + Google Maps link), **1-Click Full Shop Data Backup (CSV)**, live **Trial Countdown badge**, and a **Compare Plans** modal, plus `?` **InfoTip** helpers across the app.

7. **Commercial Landing Page, Hash Persistence & Privacy Promise**
   - Public visitors see the full **BaakiPay Landing Page** (How it works, Features, 3-Tier Pricing with Plan Terms, About & Privacy Promise); returning logged-in shopkeepers skip straight to their Dashboard and stay on their active screen across browser refreshes.
   - Caches shop-scoped data (`baakipay_${shopId}_*`) for patchy shop internet, clears all local cache on logout, and never collects bank account numbers, IFSC codes, or SMS inbox access.

## Business Viability & Pricing

| Tier | Price | Includes |
| --- | --- | --- |
| **14-Day Free Pro Trial** | ₹0 (14 days) | Full Pro features, no card required, subtle *"Powered by BaakiPay"* footer, zero auto-charge after 14 days |
| **Free Starter** | ₹0 forever | Up to 10 invoices/month, 7-day cash forecast, lifetime access to existing data, *"Powered by BaakiPay"* footer |
| **BaakiPay Pro** | **₹199/mo** or **₹1,999/yr** | Unlimited invoices, 30/60/90-day forecast, What-If Simulator, clean unbranded PDFs & WhatsApp |

At **₹1,999/year** (or **₹199/month**), BaakiPay costs roughly half of typical Indian small-business billing suites—which commonly charge **₹3,500–₹4,800/year** on annual plans—while adding predictive cash forecasting and What-If stress testing that free basic ledger apps do not provide ([Billing App Pricing Comparison, July 2026](https://vanijbill.com/blog/billing-app-pricing-compared/)).

## Tech Stack, Architecture & Automated Tests

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS, `qrcode.react`, Web Speech API, custom trilingual i18n (`EN | తె | हि`)
- **Backend:** Node.js, Express, JWT Authentication, `bcryptjs`, PostgreSQL (`pg`) with transactional row locks
- **Database & Hosting:** [Neon](https://neon.tech/) Serverless PostgreSQL (AWS Singapore) + [Render](https://render.com/) single-service HTTPS deployment
- **Automated Test Suite — 41 Passing Tests (Vitest):**
  - **Backend (23/23 passing across 2 files):** Forecast engine & What-If math (`forecastEngine.test.js`) + API integration & security tests covering `/api/health`, JSON `404`, `401` auth guards, `BR-008` `403` free-plan 10-bill limit, and `BR-006` UPI SMS parsing (`apiSecurity.test.js`)
  - **Frontend (18/18 passing across 2 files):** Analytics API & caching (`analyticsApi.test.ts`) + Voice-to-Bill parser, Safe Demo WhatsApp URL routing, and 3×3 trilingual reminder templates (`features.test.ts`)

## Local Development & Running Tests

```bash
# 1. Install dependencies and build client
npm run build

# 2. Configure environment variables
cp server/.env.example server/.env
# Set DATABASE_URL, JWT_SECRET, PORT=5001, OTP_PROVIDER=sandbox

# 3. Initialize schema & seed synthetic demo data
cd server
node db/seed.js

# 4. Run all 41 automated tests
cd server && npm test
cd ../client && npm test

# 5. Start the server
npm start
```

## Compliance & Data Disclaimer

- All seeded accounts, customers, phone numbers, invoices, and expenses are **100% synthetic sample data**.
- Built entirely inside **Codebenders IDE** using Nexen.
- Business Health Summary PDFs are self-generated operational records and include an explicit disclaimer that they are not bank-audited or CA-certified financial statements.