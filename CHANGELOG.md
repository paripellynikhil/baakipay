# Changelog — BaakiPay

All notable milestones and post-MVP production upgrades for **BaakiPay** (*Every rupee, right on time.*), built inside **Codebenders IDE (Nexen)**.

## [v1.1.0] — 2026-11-22 (Production Upgrades, UX Polish & Full Test Suite)

### Added
- **Commercial Landing Page (`LandingPage.tsx`):** Full public homepage with Hero, `01 / 02 / 03` How It Works, Features, 3-Tier Pricing with `✓` / `•` bullets & expandable Plan Terms, About & Privacy Promise, unified dot-grid background with Marigold Gold hairline dividers, and Deep Royal Indigo footer (auto-skipped for returning logged-in shopkeepers).
- **Voice-to-Bill (`LineItemsEditor.tsx`, `voiceLineParser.ts`, `useVoiceLine.ts`):** In-field Marigold Gold microphone button using the Web Speech API across `en-IN`, `te-IN`, and `hi-IN` that parses spoken phrases with unit/currency words (e.g., *"kandipappu 5 kgs 300"*) directly into Name, Qty, and Unit Price.
- **Searchable Customer Combobox & Inline `+ Add New Customer` (`CustomerSelect.tsx`, `NewCustomerForm.tsx`):** Single searchable dropdown inside `+ Add Bill` with `+ Add New Customer` pinned at the top and instant save without leaving the invoice drawer.
- **2-Column Future Cash Redesign & Safe Cash Buffer (`ForecastPage.tsx`, `ForecastChart.tsx`, `SafeBufferControl.tsx`):** Upgraded emerald/coral SVG area chart with dashed gold What-If curve, hover tooltips, customizable Minimum Safe Cash Buffer (Reserve Fund), and a dedicated right-side Cash Status widget with plain, human-friendly shortfall guidance in EN, TE, and HI.
- **Clickable Open Invoice Pills & 1-Tap Customer Monthly Statement PDF (`CustomerCard.tsx`, `CustomerStatementModal.tsx`):** Brand-colored `INV-XXX ↗` pills that re-open any open bill's Proof/PDF modal anytime, plus a 1-page printable Customer Monthly Statement.
- **Settings Power Tools (`ShopBusinessCard.tsx`, `PricingCompareModal.tsx`, `exportCsv.ts`):** Shareable Digital Shop Card (UPI QR + Google Maps link + Save Card PDF), 1-Click Full Shop Data Backup (CSV), branded Compare Plans modal, and live Trial Countdown (`"X days left"`) pill in Settings and Sidebar.
- **Contextual `?` InfoTips (`InfoTip.tsx`):** Plain-language EN/TE/HI helper popovers on key calculations and smart features across Home, Customers, Future Cash, and Business Health.
- **Safe Demo WhatsApp Routing (`whatsappUrl.ts`):** Automatically routes synthetic demo numbers (`90000000XX`) to `https://wa.me/?text=...` so reviewers can test safely via *"Message Yourself"* while real customer numbers open direct chats.
- **Production API Security & Feature Test Suite (`server/test/apiSecurity.test.js`, `client/src/lib/features.test.ts`):** Expanded automated Vitest coverage from **14 → 41 passing tests** (23 backend + 18 frontend), covering `/api/health`, JSON `404`, `401` auth guards, `BR-008` `403` free-plan 10-bill limit, `BR-006` UPI SMS parsing, Voice-to-Bill, Safe Demo WhatsApp, and trilingual reminder templates.

### Changed & Fixed
- Replaced `EN | తె | हि` header buttons with a compact **Language Dropdown** (`LanguageDropdown.tsx`).
- Added duplicate-account alert (`409` / `ACCOUNT_EXISTS`) with 1-click **Go to Login** on Sign-Up (`DuplicateAccountAlert.tsx`).
- Extended the subtle `"Powered by BaakiPay"` watermark/footer (and WhatsApp attribution) to both Free Starter and 14-Day Trial plans (hidden only on Paid Pro).
- Synced active tabs and Business Health view to URL hash (`#home`, `#customers`, `#future`, `#future/health`, `#bills`, `#settings`) so browser refresh preserves the current screen.
- Fixed nested `<form>` bug on inline New Customer save, fixed `@media print` CSS so both Invoice PDF and Business Health PDF print cleanly on 1 page, eliminated What-If toggle scroll jumps, added delete confirmation on My Bills, and updated app logo & favicon to finalized brand PNGs (`baakipay-logo.png`, `favicon.png`).

---

## [v1.0.0] — 2026-11-21 (Initial 6-Milestone PRD Build & Live Deployment)

### Added
- **Milestone 1 — Core Backend & Database:** Express API, JWT auth, sandbox OTP (`123456`), immutable SHA-256 `record_hash`, 4-table Neon Serverless PostgreSQL schema (`shops`, `customers`, `invoices`, `expenses`), and idempotent synthetic demo seed (`lakshmi@baakipay.in`).
- **Milestone 2 — App Shell, Auth & i18n:** Responsive React + TypeScript + Tailwind shell in Royal Indigo (`#1E1B4B`) & Marigold Gold (`#F59E0B`), full English/Telugu/Hindi translations, shop-scoped offline caching (`baakipay_${shopId}_*`), and onboarding flow.
- **Milestone 3 — Customers, 2-Tap Billing, UPI QR & WhatsApp Reminders:** Sequential `INV-XXX` invoicing with 80% credit alerts, `BR-008` 10-invoice free-plan limit, `qrcode.react` UPI QR modal, and 3-tone × 3-language WhatsApp reminders with 24-hour cooldown.
- **Milestone 4 — Got Money, Safe 3-Step UPI SMS Match & My Bills:** Full/partial payment transactions (preserving immutable `record_hash`), `BR-006` pasted UPI SMS parser with multi-name disambiguation and mandatory 1-tap confirmation, and recurring shop expense tracking.
- **Milestone 5 — Cash Forecast Engine, What-If Simulator & Home Dashboard:** 7/30/60/90-day daily cash forecast with `effectivePlan` gating, 3 What-If stress toggles, Home KPI cards, Top 3 Reminder Queue, and 11 backend Vitest engine tests.
- **Milestone 6 — Business Health Analytics, Settings & Render Production Deploy:** 6-month Business Health analytics with localized Smart Tips, printable Business Health Summary PDF (with SHA-256 verification hash and non-audited disclaimer), Settings profile management, open invoice badges, and live HTTPS deployment at `https://baakipay.onrender.com`.
