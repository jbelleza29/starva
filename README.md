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

## Architecture

```
src/
  app/
    api/graphql/route.ts   Apollo Server exposed as a Next.js route handler
    ApolloWrapper.tsx      Client-side ApolloProvider
    page.tsx               Dashboard (loading / empty / error states)
  graphql/                 GraphQL type defs + resolvers
  lib/                     Mongoose models, data access, sample data, formatters
  components/dashboard/    Reusable, presentational KPI + chart components
```

Data access is centralized in `src/lib/activities.ts`: it reads from MongoDB when
`MONGODB_URI` is set and otherwise returns the deterministic sample dataset, so
the GraphQL layer is identical in both modes.

## Scripts

```bash
npm run dev     # start the dev server
npm run build   # production build
npm run lint    # eslint
```

## Roadmap

- Strava OAuth + background sync into MongoDB Atlas
- Storybook stories + Chromatic visual regression in CI
- More visualizations (activity-type breakdown, calendar heatmap, distance histogram)
- Unit tests for the data/aggregation layer
