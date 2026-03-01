# Voting System Frontend

Premium Next.js App Router frontend for the multi-tenant token-only voting platform.

## Stack

- Next.js (App Router) + TypeScript
- Tailwind CSS v4
- Radix UI primitives + custom premium component layer
- next-themes (light/dark/system)
- TanStack Query + Table
- React Hook Form + Zod
- Recharts
- Framer Motion
- sonner toasts

## Structure

- `src/app/(system)`: System Admin UX
- `src/app/(org)`: Organization Admin UX
- `src/app/(public)`: Voter UX
- `src/components/*`: shells, forms, charts, tables, feedback
- `src/lib/*`: API client, auth, guards, schemas, constants
- `docs/*`: routes/UI/theming/permissions contract docs

## Setup

```bash
npm install
copy .env.example .env.local
npm run dev
```

App runs at `http://localhost:3000`.

## Environment Variables

- `NEXT_PUBLIC_API_URL` (default `http://localhost:8000/api/v1`)
- `NEXT_PUBLIC_DEFAULT_ORG_ID` (optional helper)

## Running Locally

1. Start backend on port 8000.
2. Start frontend with `npm run dev`.
3. Open:
- System: `/system/login`
- Org: `/org/login`
- Voter: `/vote`

## End-to-End Demo Flow

1. System admin creates org and org admin.
2. Org admin creates election, posts, and candidates.
3. Org admin generates token batch and exports CSV/print.
4. Voter logs in with token and submits ballot.
5. Org admin closes election and publishes results.
6. Public results available at `/e/{slug}/results` when allowed.

## Build

```bash
npm run build
npm run start
```
