# Architecture Decision Record — Starva

Short notes on the non-obvious choices in this project and why I made them.
Each entry follows the same shape: what I chose, what I considered instead, and why.

---

## 1. GraphQL + Apollo Server mounted as a Next.js route handler

**Chosen:** Apollo Server v5 at `/api/graphql` via `@as-integrations/next`.

**Alternatives considered:**
- Separate Express or Fastify backend
- REST endpoints (plain Next route handlers)
- tRPC

**Why:**
Mounting Apollo inside Next means there's no separate server to deploy, keep
running, or version alongside the frontend. The GraphQL endpoint, the Strava
sync route, and the dashboard all live in one Next process — one `npm run dev`,
one deploy target.

REST would have worked for this data shape, but GraphQL lets the dashboard
query exactly what it needs in one round trip (summary + weekly load +
heatmap + highlights in a single request). That matters when everything
renders on the same page load.

tRPC was tempting for the type safety, but Apollo + codegen gives the same
guarantee and keeps the API independently queryable (useful for adding a
mobile client or exposing data to other tools later).

---

## 2. MongoDB over a relational database

**Chosen:** MongoDB Atlas (free M0 tier) via Mongoose.

**Alternatives considered:**
- PostgreSQL (Supabase free tier)
- SQLite for local-only

**Why:**
Strava activity data is document-shaped — each activity is a self-contained
object with optional fields (`averageHeartrate`, sport-specific metadata) that
would need nullable columns or a separate table in Postgres. MongoDB maps
directly to the Strava API response with no schema translation.

The free Atlas M0 tier also gives a real hosted DB for a portfolio project
without a credit card, which matters for `zero-setup clone-and-run` being
an honest claim.

The tradeoff I accepted: no joins, no transactions across collections. For
a read-heavy analytics dashboard with one collection, that's a fine tradeoff.

---

## 3. Sample-data fallback when no database is configured

**Chosen:** `connectToDatabase()` returns `null` when `MONGODB_URI` is unset;
all data access functions fall back to a deterministic in-memory dataset.

**Alternatives considered:**
- Require the env var, throw on startup if missing
- Ship a SQLite file as a bundled fallback

**Why:**
The single most frustrating thing about portfolio projects is cloning one
and spending 20 minutes figuring out what environment variables you need
before you can see anything. The sample-data fallback means `npm install &&
npm run dev` produces a working, data-filled dashboard immediately.

Deterministic (not random) sample data matters here — the weekly trend chart
and heatmap look intentional, not like noise, which makes the UI easier to
evaluate.

The fallback also makes the test suite straightforward: no database mocking
needed since tests automatically use sample data when `MONGODB_URI` is absent.

---

## 4. Recharts wrapped behind a custom component API

**Chosen:** `TrendChart` and `DonutChart` expose their own prop interfaces
(`TrendPoint[]`, `DonutChartDataItem[]`) rather than passing Recharts props through.

**Alternatives considered:**
- Expose Recharts components directly
- Use Visx (lower-level, more control)

**Why:**
Wrapping the charting library means call sites don't know or care which
library renders the chart. If I swap Recharts for Visx (the planned level-up),
only the internals of `TrendChart.tsx` and `DonutChart.tsx` change — the
dashboard page and the Storybook stories stay untouched.

It also makes the components trivial to document in Storybook: a story is
just `<TrendChart data={[...]} unit=" km" />` with no knowledge of Recharts
internals. That's the design that makes visual regression testing with
Chromatic actually useful — pure, prop-driven components with no side effects.

---

## 5. Storybook + Chromatic on a solo personal project

**Chosen:** Storybook 10 (Vite builder) with Chromatic visual regression
running in CI on every push.

**Alternatives considered:**
- Skip component documentation entirely (it's a personal project)
- Manual visual QA

**Why:**
This project exists partly to demonstrate the same tooling I introduced at
Huckberry — Storybook integration and Chromatic visual regression. Shipping
it here proves the skill in a publicly verifiable way.

The `@storybook/nextjs-vite` framework side-steps the Next.js/webpack
compatibility issues that earlier framework versions had, and Vite's build
speed makes the CI step fast enough to run on every push without friction.

The practical benefit even for a solo project: the 20 Storybook stories
give a component playground that's faster to iterate in than the full app,
and Chromatic catches unintended visual regressions when I refactor shared
components like `KpiCard`.

---

## 6. Strava OAuth tokens stored server-side in MongoDB

**Chosen:** Access and refresh tokens stored in a `StravaAccount` MongoDB
document; never sent to the browser.

**Alternatives considered:**
- Store tokens in an httpOnly cookie
- Store tokens in localStorage (rejected immediately)

**Why:**
Keeping tokens server-side means they're invisible to the browser entirely —
no XSS attack surface. The browser only learns whether the account is
connected via a `stravaConnected: Boolean` GraphQL field. A Strava token
leaking to a third party could expose an athlete's private location data,
so this felt like the right call even for a personal project.

The tradeoff: the dashboard can't function without a database (no fallback
for the connected state). That's acceptable — you can't have Strava data
without a connection anyway.
