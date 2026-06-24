# AGENTS.md — PrintShere MVP

Guide for AI agents and contributors working in this repo.

## What this is

A P2P 3D printing marketplace MVP. Customers upload an STL/OBJ, see makers on a map with prices, and place orders. Makers register workshops, manage materials in a dashboard, and receive orders.

**Deploy target:** Vercel. **Region focus:** Prague (map defaults), but addresses are global.

## Quick start

```bash
cp .env.example .env.local   # fill DATABASE_URL + AUTH_SECRET
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

Open http://localhost:3000

### Test accounts (password: `test123456`)

| Email | Role |
|-------|------|
| anna@example.com | customer |
| elena@workshop.cz | maker |
| admin@printlocal.cz | admin |

## Project structure

```
src/
├── app/                    # Next.js App Router pages + API routes
│   ├── page.tsx            # Home: model panel + map panel
│   ├── dashboard/          # Maker workshop settings
│   ├── become-maker/       # Simple maker registration
│   ├── orders/             # Order list (role-based)
│   └── api/
│       ├── auth/           # login, signup, logout, me, signup/maker
│       ├── makers/         # Public maker list for map
│       ├── maker/          # Maker-only: profile, filaments
│       ├── orders/
│       └── delivery/zasilkovna/quote/  # stub
├── components/
│   ├── auth/               # AuthProvider, forms, header auth
│   ├── maker/              # Maker dashboard UI
│   ├── map/                # Leaflet map, filters, popup
│   ├── model/              # Dropzone, Three.js viewer, price footer
│   ├── orders/
│   └── layout/
├── lib/                    # Server utilities, mappers, geocoding
├── store/                  # Zustand: model-store, map-store
├── types/                  # Shared TypeScript interfaces
└── hooks/                  # useMakers, useOrders

prisma/
├── schema.prisma
├── seed.ts
└── migrations/
```

## Key flows

### Customer order

1. Upload model → `model-store` parses weight/dimensions
2. Map loads makers from `GET /api/makers` (includes `filaments`)
3. Pin price = weight × `pricePerGramCzk`; filters by material/rating/distance
4. Popup: pickup or Zásilkovna → `POST /api/orders`
5. Validates `minOrderPriceCzk` server-side

### Maker onboarding

1. `/become-maker` — name, email, password, workshop name, address
2. `POST /api/auth/signup/maker` geocodes address → creates `Maker` + `User`
3. Redirect to `/dashboard` — configure price, min order, printer types, filaments (+)

### Maker filaments

- Added via `POST /api/maker/filaments` `{ printerType, material, color }`
- UI: material dropdown → color dropdown (dashboard `+` button)
- Display on map: `getFilamentDisplayLabels()` in `src/lib/makers/map-maker.ts`

## Tech decisions (do not undo without reason)

| Topic | Choice |
|-------|--------|
| Map | Leaflet + CartoDB, not Mapbox |
| Tailwind | v3 (not v4) |
| Maker materials | `MakerFilament` table, not string arrays on Maker |
| Delivery fee | Per order (pickup / Zásilkovna), not per maker |
| Env for Prisma | `.env.local` via `dotenv-cli` in npm scripts |
| 3D viewer | Dynamic import, no SSR |

## API reference (main endpoints)

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| GET | `/api/makers` | — | Map pins |
| POST | `/api/orders` | optional | Links customer if logged in |
| GET/PATCH | `/api/maker/profile` | maker | Workshop settings |
| POST | `/api/maker/filaments` | maker | Add material+color |
| DELETE | `/api/maker/filaments/[id]` | maker | Remove filament |
| POST | `/api/auth/signup/maker` | — | Creates maker account |

## Not yet implemented

- Real Packeta/Zásilkovna API (stub pricing only)
- STL file storage (S3/Blob) — only metadata in orders today
- Maker order status updates from UI
- Production deploy config

## Cursor rules

Detailed conventions live in `.cursor/rules/`:

- `project-overview.mdc` — always applied
- `api-conventions.mdc` — when editing API routes
- `database.mdc` — when editing Prisma files
