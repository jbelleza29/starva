# Starva

A full-stack training analytics dashboard built on Strava activity data. The
charts and KPIs are built as a small, **typed, reusable dashboard component kit**
— presentational components driven entirely by props, with the charting library
wrapped behind our own API so it stays swappable.

It runs out of the box on a built-in sample dataset, so you can clone and start
it with **zero configuration** — no database or API keys required.

## Stack

- **Next.js** (App Router) + **React** + **TypeScript**
- **Apollo Server** mounted as a Next.js route handler (`/api/graphql`)
- **Apollo Client** for data fetching on the client
- **MongoDB** via **Mongoose** (optional — falls back to sample data)
- **Recharts** for the charting layer
- **Storybook** + **Chromatic** for component docs and visual regression testing in CI

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). With no environment
configured, the dashboard renders the bundled sample dataset.

To use real data, copy the env template and fill it in:

```bash
cp .env.local.example .env.local
```

| Variable        | Purpose                                                        |
| --------------- | -------------------------------------------------------------- |
| `MONGODB_URI`   | MongoDB connection string. Omit to use the sample dataset.     |
| `STRAVA_*`      | Strava API credentials, used to sync real activities (planned).|

### Seeding a database

With `MONGODB_URI` set, load the bundled sample activities into your cluster:

```bash
npm run seed
```

`src/lib/activities.ts` reads from MongoDB whenever `MONGODB_URI` is present and
falls back to the in-memory sample dataset otherwise, so the GraphQL layer behaves
identically either way.

## Architecture

```
src/
  app/
    api/graphql/route.ts   Apollo Server exposed as a Next.js route handler
    ApolloWrapper.tsx      Client-side ApolloProvider
    page.tsx               Dashboard (loading / empty / error states)
  graphql/                 GraphQL type defs + resolvers
  lib/                     Mongoose models, data access, sample data, formatters
  scripts/seed.ts          Seed the database from the sample dataset
  components/dashboard/    Reusable, presentational KPI + chart components
```

Data access is centralized in `src/lib/activities.ts`: it reads from MongoDB when
`MONGODB_URI` is set and otherwise returns the deterministic sample dataset, so
the GraphQL layer is identical in both modes.

## Storybook & visual testing

Components are presentational and prop-driven, which makes them easy to document
in Storybook and snapshot with Chromatic. CI runs lint, typecheck, build, and a
Chromatic publish on every push.

```bash
npm run storybook        # develop components in isolation
npm run build-storybook  # static build (what Chromatic/CI consume)
```

## Scripts

```bash
npm run dev        # start the dev server
npm run build      # production build
npm run lint       # eslint
npm run seed       # load sample activities into MongoDB (needs MONGODB_URI)
npm run storybook  # run Storybook locally
npm run chromatic  # publish Storybook to Chromatic (needs CHROMATIC_PROJECT_TOKEN)
```

## Roadmap

- Strava OAuth + background sync into MongoDB Atlas
- More visualizations (activity-type breakdown, calendar heatmap, distance histogram)
- Unit tests for the data/aggregation layer
