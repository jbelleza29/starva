# Starva

A full-stack personal training analytics dashboard built on real Strava activity data.
Charts and KPIs are built as a typed, reusable dashboard component kit — presentational
components driven entirely by props, with the charting layer wrapped behind a stable API
so it stays swappable.

Runs out of the box on a deterministic sample dataset — `npm install && npm run dev` and
you have a working dashboard with no database or API keys required.

## Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Apollo Server v5** mounted as a Next.js route handler (`/api/graphql`)
- **Apollo Client v4** for client-side data fetching
- **GraphQL 16** — queries and mutations (goals CRUD)
- **MongoDB** via **Mongoose 9** — activities, goals, Strava tokens
- **Strava OAuth 2.0** — Authorization Code flow, server-side token storage
- **Recharts 3** + **Leaflet / react-leaflet** for charts and route maps
- **Storybook 10** + **Chromatic** — 27 component stories, visual regression in CI
- **Vitest** for unit tests
- **GitHub Actions** — lint → typecheck → build → Chromatic on every push

## Features

**Dashboard**
- KPI cards: total distance, moving time, activities, elevation gain
- Highlight cards: best week, longest activity, this week vs average
- Personal bests per activity type — each card links to the activity detail page
- Weekly distance trend chart with activity-type filter (isolated re-render on filter change)
- Activity type breakdown donut chart (by moving time)
- Full-year training consistency heatmap (GitHub-style, hover tooltips)
- Goals in progress section (live progress bars from MongoDB)

**Activity detail page** (`/activities/[id]`)
- Real GPS route rendered on an OpenStreetMap tile map via Leaflet
- Auto-fits to route bounds; falls back gracefully for indoor activities
- Pace, speed, elevation, heart rate stats

**Goals** (`/goals`)
- Create monthly training goals: choose activity type, distance or time metric, target
- Live progress bars driven by actual Strava data
- Delete goals; grouping by this month vs past months
- Goals in progress surface on the main dashboard

**About** (`/about`)
- Project background, full stack list, developer bio, GitHub + LinkedIn links

**Strava sync**
- OAuth connect flow — tokens stored server-side in MongoDB, never sent to browser
- Sync all activities from Strava, upsert into MongoDB (idempotent)
- Rate-limited: 2 free syncs, then 5-minute cooldown doubling on each subsequent sync
- Countdown timer under the sync button during cooldown

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). With no environment configured,
the dashboard renders the bundled sample dataset.

To connect real data, copy the env template:

```bash
cp .env.local.example .env.local
```

| Variable               | Purpose                                                             |
| ---------------------- | ------------------------------------------------------------------- |
| `MONGODB_URI`          | MongoDB connection string. Omit to use the sample dataset.          |
| `STRAVA_CLIENT_ID`     | From your Strava API application settings.                          |
| `STRAVA_CLIENT_SECRET` | From your Strava API application settings.                          |
| `STRAVA_REDIRECT_URI`  | Callback URL — `http://localhost:3000/api/strava/callback` for dev. |

### Seeding a database

With `MONGODB_URI` set, load the bundled sample activities into your cluster:

```bash
npm run seed
```

### Connecting Strava

1. Create an app at [strava.com/settings/api](https://www.strava.com/settings/api)
2. Set the Authorization Callback Domain to your host (e.g. `localhost`)
3. Add your credentials to `.env.local`
4. Click "Connect Strava" on the dashboard, then "Sync Strava"

## Architecture

```
src/
  app/
    layout.tsx                  Shared NavBar + ApolloWrapper
    page.tsx                    Dashboard — Client Component, Apollo useQuery
    about/page.tsx              About — Server Component, static
    goals/page.tsx              Goals — Client Component, Apollo useMutation
    activities/[id]/page.tsx    Activity detail — Server Component, direct DB fetch
    api/
      graphql/route.ts          Apollo Server route handler
      strava/connect/route.ts   Redirects to Strava OAuth
      strava/callback/route.ts  Exchanges code for tokens, stores in MongoDB
      strava/sync/route.ts      Fetches activities from Strava, upserts into MongoDB
  components/
    NavBar.tsx
    ActivityMap.tsx             next/dynamic wrapper (ssr: false)
    ActivityLeafletMap.tsx      Leaflet map with route polyline
    ActivityRouteMap.tsx        Lightweight SVG fallback
    dashboard/
      KpiCard.tsx               Supports href prop for link tiles
      TrendChart.tsx
      DonutChart.tsx
      HeatmapChart.tsx
      ActivityFilter.tsx        Reusable type dropdown
  graphql/
    typeDefs.ts                 Schema: Activity, Goal, WeeklyLoad, Mutation, ...
    resolvers.ts
  lib/
    activities.ts               Data access + all aggregations
    goals.ts                    Goal CRUD
    strava.ts                   OAuth + Strava API client
    activityIcons.ts            Shared icon/label helpers (no "use client")
    format.ts                   Pure formatters — distance, duration, pace, ...
    db.ts                       Mongoose connection with hot-reload caching
    models/
      Activity.ts
      Goal.ts
      StravaAccount.ts
  scripts/seed.ts               Seed MongoDB from the sample dataset
```

Two data-fetching patterns side by side:
- **Client Components** (`page.tsx`, `goals/page.tsx`) use Apollo Client `useQuery` / `useMutation`
- **Server Components** (`activities/[id]/page.tsx`) fetch directly from MongoDB — no Apollo needed

## Storybook & visual testing

27 stories across 9 components. CI publishes to Chromatic on every push.

```bash
npm run storybook        # develop components in isolation (localhost:6006)
npm run build-storybook  # static build (what Chromatic/CI consume)
```

## Scripts

```bash
npm run dev        # start the dev server
npm run build      # production build
npm run lint       # eslint
npm run test       # vitest unit tests (data layer + formatters)
npm run seed       # load sample activities into MongoDB
npm run storybook  # run Storybook locally
npm run chromatic  # publish to Chromatic (needs CHROMATIC_PROJECT_TOKEN)
```

## Architecture decisions

See [`docs/adr.md`](docs/adr.md) for the reasoning behind key choices: GraphQL as a
route handler, MongoDB over Postgres, the sample-data fallback, Recharts wrapped behind
a custom API, Storybook/Chromatic on a solo project, and server-side token storage.
