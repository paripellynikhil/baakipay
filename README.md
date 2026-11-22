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

1. **Cash Forecast Engine & What-If Simulator (Killer Feature)**
   - Projects daily running cash balances across **7, 30, 60, and 90 days** from cash in hand, expected customer collections, and upcoming shop bills.
   - Highlights the **lowest projected cash balance** and flags cash gaps before rent or supplier bills bounce.
   - **3 Interactive What-If Toggles (Pro / 14-Day Trial):**
     - *Top customer pays 15 days late*
     - *Bad day: 5 customers pay 15 days late*
     - *Give ₹15,000 more credit (paid back in 35 days)*

2. **2-Tap Billing, UPI QR & Print-Clean PDF**
   - Creates sequential, unique invoices (`INV-001`, `INV-002`, ...) with live totals, credit-limit warnings at **80%+**, and an immutable **SHA-256 `record_hash`** for tamper-evident proof.
   - Displays a scannable **UPI QR code** (`qrcode.react`), 1-page printable PDF invoice, and itemized WhatsApp sharing.

3. **Open Invoice Badges & Instant Tracking**
   - Every customer card shows their **open (unpaid/partial) invoice codes** (e.g., `INV-013`, `INV-022`) as pills—searchable right from the Customers search bar—and clears each badge automatically once fully paid.

4. **Safe 3-Step Paste UPI SMS Auto-Match (Privacy-First)**
   - Never asks for Android/iOS SMS inbox permissions and never touches bank OTPs.
   - Paste any UPI credit SMS (parses `Rs.` / `INR` / `₹` amounts, `INV-XXX` codes, and sender names), disambiguates multi-name matches (e.g., *Rahul Sharma* vs. *Rahul Verma*), handles partial payments, and **always requires 1-tap owner confirmation** before updating balances.

5. **Assisted WhatsApp Reminders with 24-Hour Cooldown**
   - Home Dashboard surfaces the **Top 3 overdue customers** not reminded in the last 24 hours.
   - Offers **Gentle, Firm, and Urgent** templates in **English, Telugu, and Hindi** with 1-tap Copy or Open WhatsApp.

6. **My Bills (Expenses) & Business Health Summary PDF**
   - Tracks recurring shop bills (Rent, Staff, Supplier, Electricity) and updates cash in hand atomically in PostgreSQL transactions.
   - Generates a **6-month Business Health Analytics** view (on-time rate, average days to collect, top overdue customers, localized Smart Tips) and a printable **Self-Generated Business Health Summary PDF** carrying a SHA-256 verification hash and a clear non-audited operational disclaimer.

7. **Offline-Resilient & Privacy-Safe**
   - Caches shop-scoped data (`baakipay_${shopId}_*`) for instant viewing on patchy shop internet, and clears all local cache on logout.
   - Never collects bank account numbers, IFSC codes, or SMS inbox access.

## Business Viability & Pricing

| Tier | Price | Includes |
| --- | --- | --- |
| **14-Day Free Pro Trial** | ₹0 (14 days) | Full Pro access on sign-up, no card required |
| **Free Starter** | ₹0 forever | Up to 10 invoices/month, 7-day cash forecast, full access to existing data, *"Powered by BaakiPay"* PDF footer |
| **BaakiPay Pro** | **₹199/mo** or **₹1,999/yr** | Unlimited invoices, 30/60/90-day forecast, What-If Simulator, unbranded PDFs |

At **₹1,999/year** (or **₹199/month**), BaakiPay costs roughly half of typical Indian small-business billing suites—which commonly charge **₹3,500–₹4,800/year** on annual plans—while adding predictive cash forecasting and What-If stress testing that free basic ledger apps do not provide ([Billing App Pricing Comparison, July 2026](https://vanijbill.com/blog/billing-app-pricing-compared/)).

## Tech Stack & Architecture

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS, `qrcode.react`, custom trilingual i18n (`EN | తె | हि`)
- **Backend:** Node.js, Express, JWT Authentication, `bcryptjs`, PostgreSQL (`pg`) with transactional row locks
- **Database:** [Neon](https://neon.tech/) Serverless PostgreSQL (AWS Singapore)
- **Hosting:** [Render](https://render.com/) single-service deployment (Express serves API + Vite production bundle)
- **Automated Tests:** Vitest (**14 passing tests** — 11 backend forecast engine tests + 3 frontend analytics tests)

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

# 4. Run automated tests
cd server && npm test
cd ../client && npm test

# 5. Start the server
npm start
```

## Compliance & Data Disclaimer

- All seeded accounts, customers, phone numbers, invoices, and expenses are **100% synthetic sample data**.
- Built entirely inside **Codebenders IDE** using Nexen.
- Business Health Summary PDFs are self-generated operational records and include an explicit disclaimer that they are not bank-audited or CA-certified financial statements.