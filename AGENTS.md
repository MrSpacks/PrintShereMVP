# AGENTS.md — PrintShare

Guide for AI agents and contributors working in this repo.

## What this is

A P2P 3D printing marketplace for Prague (live at https://3dprintshare.xyz). Customers upload an STL/OBJ, see local makers on a map with an instant price, and send an order. The maker reviews the model, proposes terms, prints, and hands the part over (pickup or the maker's own delivery). Customer and maker talk in a per-order chat; after receipt the customer leaves a review.

**Current product mode — "connection":** the platform connects people; payment and handover are agreed between them. Stripe payments, platform fee, disputes and moderation are already in the code but switched off by `NEXT_PUBLIC_*` flags (`src/lib/product/product-mode.ts`).

**Deploy target:** Vercel. **Region focus:** Prague (map defaults), but addresses are global. **UI languages:** Czech (default) and English.

## Quick start

```bash
cp .env.example .env.local   # DATABASE_URL = Neon dev (see ENV_SETUP.md)
npm install
npm run db:deploy            # apply migrations to dev Neon
# optional: RESEND_API_KEY in .env.local to actually send emails
npm run db:seed              # dev DB only
npm run dev
```

**Branches:** `dev` → Vercel Preview (staging), `main` → Vercel Production. See [ENV_SETUP.md](./ENV_SETUP.md).

Open http://localhost:3000

### Test accounts (password: `test123456`)

| Email | Role |
|-------|------|
| anna@example.com | customer |
| elena@workshop.cz | maker |
| mr.spacks@seznam.cz | admin |
| moderator@printlocal.cz | moderator |

## Project structure

```
src/
├── app/                        # Next.js App Router pages + API routes
│   ├── page.tsx                # Home: model panel + map panel
│   ├── login, signup, forgot-password, reset-password
│   ├── become-maker/           # Maker registration (or add a workshop to an existing account)
│   ├── dashboard/              # Maker: workshops, prices, printers, filaments
│   ├── orders/, orders/[id]    # Order list + detail with chat, actions, review
│   ├── profile/, users/[id]    # Own profile, linked sign-in methods, public profiles
│   ├── admin/, moderation/     # Staff (moderation hidden unless enabled)
│   ├── legal/, how-it-works/, support/
│   └── api/
│       ├── auth/               # login, signup(+maker), logout, me, oauth/[provider], accounts, password/{forgot,reset}
│       ├── makers/             # Public maker list for the map
│       ├── maker/              # Maker-only: profile, workshops, printers, filaments
│       ├── orders/             # create/list, [id] (PATCH actions), messages, read, file upload, review, dispute
│       ├── messages/inbox      # Unread chat inbox
│       ├── delivery/zasilkovna # quote (estimate stub) + pickup points
│       ├── admin/, moderation/ # Staff endpoints
│       └── cron/purge-order-files  # Daily: delete model files 30 days after completion
├── components/                 # UI by area (auth, map, model, orders, maker, admin, layout…)
├── lib/
│   ├── auth/                   # session JWT, password, password-reset tokens, OAuth
│   ├── email/                  # Resend sender + bilingual email template
│   ├── notifications/          # order-emails (server) + browser notifications (client)
│   ├── orders/                 # workflow (status machine), pricing, file storage, retention
│   ├── product/product-mode.ts # Feature flags (payments, moderation, fees…)
│   └── legal/                  # Operator constants + legal document texts (CS/EN)
├── i18n/messages/{cs,en}.ts    # All UI strings
├── store/                      # Zustand: model-store, map-store
└── types/

prisma/
├── schema.prisma
├── seed.ts                     # dev DB only
└── migrations/
```

## Key flows

### Order lifecycle (`src/lib/orders/order-workflow.ts`)

```
pending ──propose_terms (maker)──▶ awaiting_customer ──accept_terms (customer)──▶ paid*
paid ──start_printing (maker)──▶ printing ──mark_shipped (maker)──▶ shipped
shipped ──confirm_receipt (customer)──▶ delivered ──review (customer)──▶ completed
cancel: allowed only before payment (pending / awaiting_customer / awaiting_payment)
```
\* In connection mode `accept_terms` jumps straight to `paid`; with payments on it goes to `awaiting_payment` → `pay`.

### Customer order

1. Upload model → `model-store` parses weight/dimensions (file goes to Vercel Blob)
2. Map loads makers from `GET /api/makers`; pin price = weight × price per gram (FDM / resin)
3. Filters: material, rating, distance; delivery = pickup or maker's own delivery (fixed price)
4. `POST /api/orders` — validates min order price and the maker's occasional-income limit (no IČO → 50 000 Kč/year)

### Maker onboarding

1. `/become-maker` — account + workshop name/address (geocoded); a user can own several workshops
2. `/dashboard` — prices, min order, delivery, printers, filaments (material + color)

### Email notifications (`src/lib/notifications/order-emails.ts`)

Sent via Resend (`RESEND_API_KEY`; without it emails are only logged), in CZ + EN, in the background with `after()`:
- new order → maker
- each status action → the other party (cancel by admin → both)
- chat message → recipient, only for the first unread message (no spam)

### Password reset

`/forgot-password` → email with a 1-hour link → `/reset-password?token=…`. Token is a JWT signed with `AUTH_SECRET` containing a fingerprint of the current password hash, so it works only once. No DB table.

## Tech decisions (do not undo without reason)

| Topic | Choice |
|-------|--------|
| Map | Leaflet + CartoDB, not Mapbox |
| Tailwind | v3 (not v4) |
| Maker materials | `MakerFilament` table, not string arrays on Maker |
| Delivery | Per order: pickup or maker's own delivery at a fixed price |
| Product mode | Connection mode by default; payments/moderation via env flags, code kept |
| Email | Resend over plain `fetch` (no SDK); failures never break the request |
| Env for Prisma | `.env.local` via `dotenv-cli` in npm scripts |
| **Database** | Separate Neon projects: `PrintShare-DEV` (local + Preview) and `PrintShare` (Production). `build` runs `migrate deploy` |
| 3D viewer | Dynamic import, no SSR |

## API reference (main endpoints)

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| GET | `/api/makers` | — | Map pins |
| POST | `/api/orders` | user | Creates order, emails the maker |
| PATCH | `/api/orders/[id]` | party | `{ action }` or term edits; emails the other party |
| GET/POST | `/api/orders/[id]/messages` | party | Chat; POST emails the recipient |
| POST | `/api/orders/[id]/review` | customer | Review → order `completed` |
| GET/PATCH | `/api/maker/profile` | maker | Workshop settings |
| POST/DELETE | `/api/maker/filaments[/id]` | maker | Materials + colors |
| POST | `/api/auth/signup/maker` | — | Creates maker account |
| POST | `/api/auth/password/forgot` | — | Always 200; sends reset email |
| POST | `/api/auth/password/reset` | — | `{ token, password }` |

## Not yet implemented / known gaps

- Email verification on signup
- Real Packeta/Zásilkovna API — quote is an estimate stub
- Orders stay `delivered` if the customer never leaves a review (no auto-complete)
- Old sessions stay valid after a password reset (JWT, up to 7 days)
- Payments (Stripe) and disputes exist but are off; not production-tested

## Cursor rules

Detailed conventions live in `.cursor/rules/`:

- `project-overview.mdc` — always applied
- `api-conventions.mdc` — when editing API routes
- `database.mdc` — when editing Prisma files
