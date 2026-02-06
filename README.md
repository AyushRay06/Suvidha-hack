# SUVIDHA Kiosk - Unified Civic Services

A self-service kiosk interface for Smart City civic utility services built for the C-DAC SUVIDHA Challenge.

## Tech Stack

- **Frontend**: Next.js 15, TypeScript, Tailwind CSS, Shadcn UI
- **Backend**: Node.js, Express, Prisma ORM
- **Database**: PostgreSQL
- **Architecture**: Turborepo Monorepo

## Project Structure

```
suvidha-kiosk/
├── apps/
│   ├── web/          # Next.js Kiosk + Admin Frontend
│   └── api/          # Express API Backend
├── packages/
│   ├── database/     # Prisma schema + migrations
│   └── types/        # Shared TypeScript types
├── turbo.json
└── package.json
```

## Quick Start

### Prerequisites

- Node.js >= 18
- PostgreSQL database
- npm

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp apps/api/.env.example apps/api/.env
# Edit apps/api/.env with your DATABASE_URL

# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Seed database with Assam Tariffs & Demo Data
npm run db:seed --prefix packages/database

# Start development servers
npm run dev
```

### Access

- **Kiosk Interface**: http://localhost:3000
- **API Server**: http://localhost:4000
- **API Health Check**: http://localhost:4000/health

## Features

### For Citizens
- 🔐 **Smart Authentication**: Simplified demo login & OTP support
- ⚡ **Assam Power (APDCL) Integration**: 
  - Real-time bill calculation with **April 2025 Tariff Rates**
  - Automatic **FPPPA Charge** calculation (₹0.69/unit)
  - Slab-based billing (0-120, 121-240, >240 units)
- 📉 **Unified Meter Reading**:
  - Instant bill estimation while typing
  - Seamless submission with photo verification
- 💳 Bill payments with mock payment gateway
- 📝 Grievance submission and tracking
- 🔔 Real-time notifications and alerts
- 🌐 Bilingual support (English/Assamese/Hindi)

### For Admins
- 📊 Dashboard with usage analytics
- 📋 Reports generation
- 🚨 System alert management
- 👥 User management

## API Endpoints

| Module | Endpoint | Description |
|--------|----------|-------------|
| Auth | `POST /api/auth/send-otp` | Send OTP to phone |
| Auth | `POST /api/auth/login` | Verify OTP and login |
| Auth | `POST /api/auth/register` | Register new user |
| Billing | `GET /api/billing/bills` | List user bills |
| Billing | `POST /api/billing/pay` | Process payment |
| Connections | `GET /api/connections` | List user connections |
| Grievances | `POST /api/grievances` | Submit grievance |
| Notifications | `GET /api/notifications` | User notifications |
| Admin | `GET /api/admin/dashboard` | Admin dashboard stats |

## Development

```bash
# Run all services
npm run dev

# Run only frontend
cd apps/web && npm run dev

# Run only backend
cd apps/api && npm run dev

# Open Prisma Studio
npm run db:studio
```

## Team

Built for C-DAC SUVIDHA Hackathon 2026.

## License

MIT
