# SUVIDHA Kiosk — Technical Documentation

> **SUVIDHA** — Smart Unified Verified Integrated Digital Hub for Accessible Services  
> A unified self-service kiosk platform for Electricity, Gas, Water, and Municipal civic services.

---

## Table of Contents

1. [Project Maturity & Development Status](#1-project-maturity--development-status)
2. [System Architecture](#2-system-architecture)
3. [Department-wise Features](#3-department-wise-features-in-kiosk-touch-interface)
4. [UI/UX Suitability for Touch-Based Kiosk Interface](#4-uiux-suitability-for-touch-based-kiosk-interface)
5. [Deployment & Practical Feasibility](#5-deployment--practical-feasibility)
6. [Accessibility & Inclusion Details](#6-accessibility--inclusion-details)
7. [Security Architecture & Design](#7-security-architecture--design)

---

## 1. Project Maturity & Development Status

| Attribute | Details |
|-----------|---------|
| **Current Stage** | ✅ **Fully Functional System** |
| **Frontend** | Next.js 15 (React 19), TypeScript, Tailwind CSS |
| **Backend API** | Express.js, TypeScript, Prisma ORM |
| **Database** | PostgreSQL (via Prisma) |
| **Payment Gateway** | Dodo Payments (live integration with UPI, Card, Net Banking, Wallet) |
| **Deployment** | Vercel (Frontend + API serverless functions) |
| **Monorepo** | Turborepo with shared `@suvidha/database` package |

### Tech Stack Overview

```
┌─────────────────────────────────────────────────────┐
│                   SUVIDHA Kiosk                     │
├────────────────────┬────────────────────────────────┤
│   Frontend (web)   │         Backend (api)          │
│  Next.js 15 + TS   │     Express.js + Prisma        │
│  Tailwind CSS      │     PostgreSQL (Neon)           │
│  React 19          │     JWT Auth + OTP              │
│  i18next           │     Dodo Payments               │
│  Web Speech API    │     Zod Validation              │
├────────────────────┴────────────────────────────────┤
│              Shared: @suvidha/database              │
│              Prisma Schema + Client                 │
└─────────────────────────────────────────────────────┘
```

---

## 2. System Architecture

### High-Level Architecture Diagram

```
                    ┌───────────────┐
                    │   Citizen     │
                    │  (Kiosk/Web)  │
                    └───────┬───────┘
                            │ HTTPS
                    ┌───────▼───────┐
                    │  Next.js App  │
                    │  (SSR + CSR)  │
                    │  Vercel Edge  │
                    └───────┬───────┘
                            │ REST API
                    ┌───────▼───────┐
                    │  Express API  │
                    │  (Serverless) │
                    ├───────────────┤
                    │  Middleware   │
                    │  • Auth (JWT) │
                    │  • Rate Limit │
                    │  • Sanitize   │
                    │  • CORS       │
                    │  • Helmet     │
                    └───────┬───────┘
                            │
              ┌─────────────┼─────────────┐
              │             │             │
      ┌───────▼──┐   ┌─────▼────┐  ┌─────▼─────┐
      │PostgreSQL│   │  Dodo    │  │ Cloudinary│
      │ (Neon)   │   │ Payments │  │ (Uploads) │
      └──────────┘   └──────────┘  └───────────┘
```

### Monorepo Structure

```
suvidha-mohornav/
├── apps/
│   ├── web/                    # Next.js 15 Frontend
│   │   ├── src/app/            # App Router pages
│   │   ├── src/components/     # Reusable UI components
│   │   ├── src/lib/            # Hooks, context, i18n, utils
│   │   └── public/             # Static assets
│   └── api/                    # Express.js Backend
│       ├── src/modules/        # Feature modules (14 total)
│       ├── src/middleware/      # Auth, error, logger, sanitize
│       └── src/index.ts        # Entry point
├── packages/
│   └── database/               # Shared Prisma schema + client
│       └── prisma/schema.prisma
└── turbo.json                  # Turborepo configuration
```

---

## 3. Department-wise Features in Kiosk Touch Interface

### ⚡ Electricity Department

| Feature | Description | API Endpoint |
|---------|-------------|--------------|
| **Meter Reading Submission** | Citizens submit meter readings with optional photo upload for verification | `POST /api/electricity/readings` |
| **Bill Calculation (Dry Run)** | Estimate bill before actual submission using slab-based tariff logic | `POST /api/electricity/calculate-bill` |
| **Tariff Viewing** | View active tariff slabs grouped by load type (Domestic/Commercial/Industrial) | `GET /api/electricity/tariffs` |
| **Consumption History** | 6-month consumption and billing history per connection | `GET /api/electricity/consumption/:id` |
| **Bill Payment** | Online payment via Dodo Payments (UPI, Card, Net Banking) | `POST /api/payments/create-order` |
| **New Connection Application** | Apply for new electricity connection with document upload | `POST /api/service-requests` |
| **Grievance Filing** | File complaints about power outage, meter issues, voltage fluctuation | `POST /api/grievances` |

**Tariff Engine**: Slab-based calculation per `TariffService` — supports multiple load types (Domestic, Commercial, Industrial), per-unit rate slabs, fixed charges, and surcharges.

---

### 🔥 Gas Department

| Feature | Description | API Endpoint |
|---------|-------------|--------------|
| **Cylinder Refill Booking** | Book gas cylinder with anti-double-booking check and subsidy calculation | `POST /api/gas/book` |
| **Booking History** | View all past cylinder bookings with delivery status tracking | `GET /api/gas/bookings` |
| **Piped Gas Meter Reading** | Submit piped gas meter readings for AGCL tariff-based billing | `POST /api/gas/readings` |
| **Bill Estimation** | Estimate bill based on AGCL tariff (₹17.42/SCM base + 14.5% VAT) | `POST /api/gas/calculate-bill` |
| **Gas Connections** | View and manage gas connections | `GET /api/gas/connections` |
| **Grievance Filing** | Report gas leakage, cylinder delivery issues, pressure problems | `POST /api/grievances` |

**Tariff Details**: Based on Assam Gas Company Limited (AGCL) tariffs — Base rate ₹17.42/SCM (Apr 2025), marketing margin ₹0.20/SCM, 14.5% VAT, minimum billing for 5 SCM.

---

### 💧 Water Department

| Feature | Description | API Endpoint |
|---------|-------------|--------------|
| **Meter Reading Submission** | Submit water meter readings with photo upload and auto-bill generation | `POST /api/water/readings` |
| **Bill Calculation** | Estimate bill based on load type (Domestic/Commercial/Industrial) | `POST /api/water/calculate-bill` |
| **Consumption History** | 6-month water consumption and billing history | `GET /api/water/consumption/:id` |
| **Water Connections** | View and manage water connections | `GET /api/water/connections` |
| **Bill Payment** | Online payment via integrated payment gateway | `POST /api/payments/create-order` |
| **Grievance Filing** | Report water quality issues, pipe leakage, no supply | `POST /api/grievances` |

**Tariff Engine**: `WaterTariffService` — load-type-based tariff calculation supporting domestic, commercial, and industrial rates.

---

### 🏛️ Municipal Corporation

| Feature | Description | API Endpoint |
|---------|-------------|--------------|
| **Property Tax Viewing** | View registered properties and tax records per financial year | `GET /api/municipal/properties` |
| **Property Tax Payment** | Pay tax with receipt generation and partial payment support | `POST /api/municipal/tax/pay` |
| **Civic Complaints** | File complaints: streetlight, road repair, drainage, sanitation, garbage | `POST /api/municipal/complaints` |
| **Complaint Tracking** | Track status with filters by category and status | `GET /api/municipal/complaints` |
| **Waste Collection Schedule** | View waste collection schedule by pincode/ward | `GET /api/municipal/waste-schedule` |
| **Missed Collection Reporting** | Report missed waste collection (dry/wet/both) | `POST /api/municipal/waste/report` |

**Complaint Categories**: STREETLIGHT, ROAD_REPAIR, DRAINAGE, SANITATION, WATER_SUPPLY, GARBAGE, OTHER — with priority levels (LOW, MEDIUM, HIGH, URGENT).

---

### 🛡️ SIGM (Single-Interaction Guarantee Mode) — *Novel Feature*

| Feature | Description | API Endpoint |
|---------|-------------|--------------|
| **Pre-submission Check** | Verify all prerequisites before submitting any request | `POST /api/sigm/check` |
| **Citizen Acknowledgment** | Record citizen's informed consent of guarantee status | `POST /api/sigm/acknowledge` |
| **Lock Prevention** | Check if a similar request is already locked/pending | `POST /api/sigm/check-lock` |
| **Submission Recording** | Record actual submission with audit trail | `POST /api/sigm/record-submission` |
| **History** | Paginated history of all SIGM checks for a user | `GET /api/sigm/history` |
| **Admin Analytics** | Dashboard analytics: guarantee rates, service breakdown, trends | `GET /api/sigm/analytics` |

**Purpose**: SIGM ensures citizens don't waste multiple kiosk visits. Before any submission, the system checks if all prerequisites are met and guarantees the outcome — saving repeat visits and building trust.

---

### 🔗 Cross-Department Features

| Feature | Description |
|---------|-------------|
| **Unified Grievance System** | File grievances for any department with timeline tracking and photo evidence |
| **Centralized Billing** | View and pay bills for all services from a single dashboard |
| **Smart Assistant** | NLP-powered intent parser that routes users to the correct service page via 1–2 words |
| **Voice Navigation** | Hands-free navigation using Web Speech API (Hindi + English + Assamese) |
| **Notification System** | Bilingual (Hindi + English) push notifications for payment confirmations, grievance updates |
| **Admin Dashboard** | Unified admin panel for service requests, meter reading verification, analytics |

---

## 4. UI/UX Suitability for Touch-Based Kiosk Interface

### ✅ Yes — the UI is specifically designed for touch-based kiosk usage.

### Design Considerations for Kiosk & Touch Interaction

| Constraint | How SUVIDHA Addresses It |
|-----------|--------------------------|
| **Large Touch Targets** | All buttons follow `min-h-16 min-w-16` (64×64px) — exceeds the 48px WCAG minimum. Kiosk buttons (`kiosk-button` class) use `px-8 py-5` padding and `text-lg` minimum font. |
| **No Keyboard Required** | Quick phrase cards for common actions (e.g., "Pay my electricity bill"), plus voice input via mic button — no typing needed. |
| **Font Scaling** | CSS variable `--accessibility-font-scale` applied on `<body>` with range: Normal (1.0×), Large (1.3×), Extra Large (1.6×), Senior (2.0×). |
| **High Contrast Mode** | Dedicated `.high-contrast` CSS class that sets foreground to pure black, background to white, and adds 3px borders to all cards and buttons. |
| **Visible Focus Rings** | All interactive elements show 4px focus rings (`focus:ring-4`) — `focus:outline-none` was deliberately removed so keyboard/switch users can navigate. |
| **Bilingual UI** | Full i18n with `i18next` — English, Hindi, and Assamese. All labels, buttons, headings, and error messages are translated. |
| **Kiosk Mode Detection** | `isKiosK` context variable triggers full-width layouts, larger fonts, and simplified navigation for kiosk deployments. |
| **Timeout/Session Management** | JWT tokens expire in 15 minutes with auto-refresh — ensures kiosk sessions don't persist for the next user. |
| **Error Recovery** | All forms have clear error states, try-again buttons, and fallback navigation. The Smart Assistant has a "Choose from Menu" fallback when confidence is low. |
| **No Hover-Only Interactions** | All hover effects have corresponding `active:` states for touch. No functionality depends on hover alone. |

### Touch-Specific CSS Utilities

```css
.kiosk-button {
  min-h-16 min-w-16 px-8 py-5 text-lg font-semibold
  rounded-2xl transition-all duration-200 ease-out
  active:scale-95  /* Touch feedback */
  focus:ring-4     /* Keyboard/switch accessibility */
  cursor-pointer;
}

.kiosk-card {
  rounded-2xl p-6 lg:p-8  /* Generous padding for touch */
  border-2                  /* Clear boundaries */
  shadow-md                 /* Depth perception */
}
```

---

## 5. Deployment & Practical Feasibility

### Target Deployment Environment

| Attribute | Value |
|-----------|-------|
| **Deployment Model** | **Cloud (Vercel)** with capability for Hybrid |
| **Frontend Hosting** | Vercel Edge Network (global CDN, SSR) |
| **API Hosting** | Vercel Serverless Functions (auto-scaling) |
| **Database** | Neon PostgreSQL (serverless Postgres, auto-scaling) |
| **File Storage** | Cloudinary (meter reading photos, complaint evidence) |
| **Payment Processing** | Dodo Payments (PCI-DSS compliant gateway) |

### Infrastructure Requirements

| Component | Specification |
|-----------|---------------|
| **Kiosk Hardware** | Any device with a modern browser (Chrome 90+, Edge 90+). Recommended: 15" touchscreen, 4GB RAM |
| **Network** | Standard broadband (5 Mbps+). The app is lightweight — API calls are small JSON payloads (<10KB avg) |
| **Server** | Zero server management — Vercel serverless auto-scales from 0 to thousands of concurrent users |
| **Database** | Neon PostgreSQL free tier supports up to 10,000 active hours/month; paid plans for production |
| **SSL** | Auto-provisioned by Vercel (Let's Encrypt) |

### Internet Dependency: **Medium**

| Scenario | Behavior |
|----------|----------|
| **Full Connectivity** | All features work — payments, real-time bill calculation, data sync |
| **Intermittent** | Client-side form state persists; submissions queue and retry on reconnect |
| **Offline** | Static pages load from Next.js cache; Smart Assistant NLP runs fully client-side (`intent-parser.ts` has no server dependency) |

### Offline Mode Support: **Partial**

| Works Offline | Requires Internet |
|--------------|-------------------|
| Page navigation & routing | Bill payments (Dodo API) |
| Smart Assistant NLP | Meter reading submission |
| Accessibility settings | Grievance filing |
| Language switching | Authentication (OTP) |
| Voice recognition (browser-native) | Database queries |

> **Future Enhancement**: Service Worker caching + IndexedDB offline queue can enable full offline → sync functionality.

---

## 6. Accessibility & Inclusion Details

### Support for Visually Impaired Users ✅

| Feature | Implementation |
|---------|---------------|
| **Screen Reader Support** | All interactive elements have `aria-label` attributes. Toast notifications use `aria-live="polite"`. Service cards have `role` and `aria-describedby`. |
| **Skip Navigation** | `<a href="#main-content">Skip to main content</a>` link in root layout |
| **Semantic HTML** | Proper `<nav>`, `<main>`, `<header>`, `<footer>`, `<h1>` hierarchy on every page |
| **Focus Management** | Visible 4px focus rings on all buttons. Tab order follows visual layout. |
| **Text-to-Speech** | `useTTS` hook announces intent results, page transitions, and form confirmations aloud |
| **High Contrast Mode** | One-tap high contrast toggle — black text, white background, 3px borders |

### Support for Senior Citizens ✅

| Feature | Implementation |
|---------|---------------|
| **Senior Mode** | One-tap "Senior Mode" button that simultaneously enables: 2× font size, high contrast, and text-to-speech |
| **Font Scaling** | Range from 1.0× to 2.0× via CSS variable `--accessibility-font-scale` |
| **Large Touch Targets** | All buttons minimum 64×64px with generous padding |
| **Simple Navigation** | Quick phrase cards eliminate need for typing; voice input for hands-free use |
| **Clear Visual Feedback** | `active:scale-95` on all buttons provides tactile feedback for touch |

### Regional Language Support ✅

| Language | Code | Coverage |
|----------|------|----------|
| **English** | `en` | Full UI + notifications + assistant |
| **Hindi** | `hi` | Full UI + notifications + assistant |
| **Assamese** | `as` | UI labels + voice input |

- Language selector visible in header on every page
- `<html lang>` attribute dynamically updated via `DynamicHtmlLang` component
- All notification messages (payments, grievances) sent in both English and Hindi
- Voice recognition supports `en-IN`, `hi-IN`, `as-IN` locales

### Voice-Based Navigation ✅

| Feature | Implementation |
|---------|---------------|
| **Voice Input** | `useVoiceRecognition` hook wraps Web Speech API — supports English, Hindi, Assamese |
| **NLP Intent Parsing** | `intent-parser.ts` — 400+ lines of keyword matching for 50+ phrases across 4 departments |
| **Confidence Scoring** | Multi-factor confidence: keyword relevance, partial matches, token coverage |
| **TTS Output** | `useTTS` hook reads out parsed intents and confirmations aloud |
| **Visual Feedback** | Pulsing "Listening..." indicator with live transcript, mic button with on/off state |
| **Browser-Native** | Zero external APIs — uses built-in `SpeechRecognition` and `speechSynthesis` |

### UI Compliance Standards

#### WCAG AA Compliance ✅

| Criterion | Status | Details |
|-----------|--------|---------|
| **1.1.1 Non-text Content** | ✅ | All icons have `aria-label` or `aria-hidden="true"` with visible text |
| **1.3.1 Info and Relationships** | ✅ | Semantic HTML5 elements (`<nav>`, `<main>`, `<header>`) |
| **1.4.3 Contrast (Minimum)** | ✅ | Muted text `--muted-foreground` set to `#4a5f73` (4.5:1 ratio on white) |
| **1.4.4 Resize Text** | ✅ | Font scale up to 200% without layout breakage |
| **2.1.1 Keyboard** | ✅ | All functionality accessible via keyboard; focus rings visible |
| **2.4.1 Bypass Blocks** | ✅ | "Skip to main content" link in root layout |
| **2.4.2 Page Titled** | ✅ | Every page has descriptive `<title>` |
| **3.1.1 Language of Page** | ✅ | `<html lang>` dynamically updated via `DynamicHtmlLang` component |
| **4.1.2 Name, Role, Value** | ✅ | ARIA attributes on all custom controls |

#### Government UI Guidelines ✅

| Guideline | Implementation |
|-----------|---------------|
| **GIGW (Guidelines for Indian Government Websites)** | Bilingual content, accessibility toolbar, skip navigation, contact information in footer |
| **National Informatics Centre (NIC) Standards** | High contrast mode, font size controls, no JavaScript-only interactions |
| **STQC Compliance Ready** | Accessibility toolbar exposes all required accessibility controls as specified by the Standardisation Testing and Quality Certification directorate |

---

## 7. Security Architecture & Design

### Overall Security Architecture

SUVIDHA implements a **defense-in-depth** security model with security integrated **by design**, not as an afterthought. Every layer of the stack has security controls:

```
┌─────────────────────────────────────────────────────────────┐
│ Layer 1: Network Security                                   │
│ • HTTPS/TLS via Vercel (auto-provisioned)                   │
│ • CORS whitelist (only allowed origins)                     │
│ • Helmet.js HTTP security headers                           │
│ • Rate limiting (100 req/15min per IP)                      │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│ Layer 2: Input Validation & Sanitization                    │
│ • Zod schema validation on ALL endpoints                    │
│ • HTML tag stripping middleware (XSS prevention)            │
│ • x-kiosk-id header format validation                      │
│ • Request body size limit (10MB)                            │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│ Layer 3: Authentication & Authorization                     │
│ • OTP-based authentication (no passwords)                   │
│ • JWT access tokens (15-min expiry)                         │
│ • Refresh token rotation (7-day expiry)                     │
│ • Session tracking with kiosk ID                            │
│ • Role-based access control (CITIZEN / STAFF / ADMIN)       │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│ Layer 4: Data Security                                      │
│ • bcrypt password hashing (where applicable)                │
│ • Prisma ORM (parameterized queries — SQL injection proof)  │
│ • Ownership verification on all data access                 │
│ • No internal timestamps exposed in public endpoints        │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│ Layer 5: Payment Security                                   │
│ • Dodo Payments (PCI-DSS compliant)                         │
│ • Webhook signature verification (standardwebhooks)         │
│ • No payment card data touches our servers                  │
│ • Idempotent payment recording (prevents double-charge)     │
└─────────────────────────────────────────────────────────────┘
```

### Security Integration: By Design

Security is not bolted on; it's woven into every module:

| Security Pattern | Where Applied | Example |
|------------------|---------------|---------|
| **Validation-First** | Every API endpoint | `z.object({ phone: z.string().regex(/^[6-9]\d{9}$/) })` — invalid input is rejected before any business logic runs |
| **Ownership Check** | All data queries | `where: { id: connectionId, userId: req.user!.id }` — users can only access their own data |
| **Middleware Pipeline** | `index.ts` | `Helmet → CORS → Rate Limit → Body Parse → Sanitize → Validate Kiosk ID → Auth → Route` |
| **Secure Defaults** | Auth config | Tokens expire in 15 minutes by default; refresh tokens rotate |
| **Input Sanitization** | Global middleware | `sanitize.ts` strips HTML tags from all string fields recursively |

### Threat Modelling

| Threat | STRIDE Category | Mitigation |
|--------|----------------|------------|
| **Unauthorized access to another user's bills/connections** | Elevation of Privilege | Every database query includes `userId: req.user!.id` ownership check |
| **SQL Injection** | Tampering | Prisma ORM uses parameterized queries exclusively |
| **XSS via user input** | Tampering | `sanitizeInput` middleware strips HTML tags; React auto-escapes JSX output |
| **Brute-force OTP attacks** | Spoofing | Rate limiting (100 req/15min per IP); OTP expires in 5 minutes |
| **Session hijacking on kiosk** | Spoofing | 15-minute JWT expiry; session tracked per `x-kiosk-id`; explicit logout endpoint |
| **CSRF attacks** | Tampering | CORS whitelist; JWT in Authorization header (not cookies) |
| **Double payment** | Repudiation | Idempotent payment recording — checks for existing `transactionId` before creating |
| **Information disclosure via /health** | Information Disclosure | Removed internal timestamp from health endpoint |
| **Kiosk ID spoofing** | Spoofing | `validateKioskId` middleware enforces format: `^[a-zA-Z0-9_-]{1,64}$` |
| **DDoS** | Denial of Service | Vercel Edge DDoS protection + rate limiting middleware |
| **Payment data exposure** | Information Disclosure | All payment processing happens on Dodo's PCI-DSS infrastructure; we never store card details |

### API Security Headers (via Helmet.js)

```
Content-Security-Policy: default-src 'self'
X-Content-Type-Options: nosniff
X-Frame-Options: SAMEORIGIN
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000
Referrer-Policy: no-referrer
```

---

## Appendix A: API Endpoint Summary

| Module | Endpoints | Auth Required |
|--------|-----------|---------------|
| Auth | 4 (`send-otp`, `login`, `register`, `refresh`, `logout`) | No (public) |
| Electricity | 4 (`readings`, `calculate-bill`, `tariffs`, `consumption`) | Yes |
| Gas | 5 (`book`, `bookings`, `connections`, `readings`, `calculate-bill`) | Yes |
| Water | 4 (`connections`, `readings`, `calculate-bill`, `consumption`) | Yes |
| Municipal | 6 (`properties`, `tax`, `tax/pay`, `complaints`, `waste-schedule`, `waste/report`) | Yes |
| Grievances | 4 (`list`, `detail`, `create`, `update`, `categories`) | Yes |
| Payments | 4 (`create-order`, `confirm`, `verify`, `webhook`) | Yes (except webhook) |
| SIGM | 6 (`check`, `acknowledge`, `check-lock`, `record-submission`, `history`, `analytics`) | Yes |
| Billing | 2 (`list`, `detail`) | Yes |
| Connections | 2 (`list`, `detail`) | Yes |
| Notifications | 1 (`list`) | Yes |
| Admin | 6 (`dashboard`, `users`, `activities`, `meter-readings`, `payments`, `service-usage`) | Yes (ADMIN/STAFF) |
| Upload | 1 (`upload`) | Yes |
| **Total** | **~50 endpoints** | |

---

## Appendix B: Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| **OTP-only auth (no passwords)** | Kiosk users are citizens who may not remember passwords. Phone-based OTP is familiar and eliminates password management. |
| **Client-side NLP for Smart Assistant** | `intent-parser.ts` runs entirely in the browser — zero API latency, works offline, no cloud NLP costs. |
| **Web Speech API for voice** | Browser-native — no Whisper/Google Speech API keys needed. Works on any modern kiosk browser. |
| **15-minute JWT expiry** | Prevents the next person at a kiosk from inheriting the previous user's session. |
| **SIGM module** | Guarantees that a citizen's task will be completed in a single kiosk visit — eliminating the "come back tomorrow" problem that plagues government offices. |
| **Bilingual notifications** | Every notification is stored with both `title`/`titleHi` and `message`/`messageHi` — ensuring accessibility regardless of language preference. |
| **Prisma ORM** | Type-safe database queries, auto-generated types, built-in SQL injection protection — critical for a public-facing government service. |

---

*Document generated for SUVIDHA Kiosk — C-DAC Smart City Initiative*  
*Last Updated: March 2026*
