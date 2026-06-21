export default function About() {
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-12">
      <h1 className="text-3xl font-semibold tracking-tight">About</h1>
      <p className="mt-2 text-sm text-neutral-500">The project and the person behind it.</p>

      <div className="mt-10 flex flex-col gap-8">
        <section className="rounded-xl border border-black/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-neutral-900">
          <h2 className="mb-3 text-base font-semibold">The project</h2>
          <p className="text-sm leading-7 text-neutral-600 dark:text-neutral-400">
            Starva is a full-stack personal training analytics dashboard built on real Strava
            activity data. It started as a portfolio piece to publicly prove skills in
            Next.js, GraphQL, MongoDB, and Storybook/Chromatic — the stack I use day-to-day.
            The design goal was a reusable, typed dashboard component kit: presentational
            components driven entirely by props, with charting wrapped behind a stable API
            so the engine stays swappable.
          </p>
          <p className="mt-3 text-sm leading-7 text-neutral-600 dark:text-neutral-400">
            The data is real — activities are synced from Strava via OAuth, stored in
            MongoDB Atlas, and served through an Apollo GraphQL API mounted as a Next.js
            route handler. Every push triggers a CI pipeline that runs lint, typecheck,
            build, and Chromatic visual regression tests.
          </p>
        </section>

        <section className="rounded-xl border border-black/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-neutral-900">
          <h2 className="mb-3 text-base font-semibold">Stack</h2>
          <ul className="grid grid-cols-2 gap-2 text-sm text-neutral-600 dark:text-neutral-400 sm:grid-cols-3">
            {[
              "Next.js 16 (App Router)",
              "Apollo Server v5",
              "Apollo Client v4",
              "GraphQL 16",
              "MongoDB + Mongoose",
              "Storybook 10",
              "Chromatic",
              "Recharts",
              "TypeScript",
              "Tailwind CSS v4",
              "Vitest",
              "GitHub Actions",
            ].map((item) => (
              <li key={item} className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-orange-400" />
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-xl border border-black/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-neutral-900">
          <h2 className="mb-3 text-base font-semibold">The developer</h2>
          <p className="text-sm leading-7 text-neutral-600 dark:text-neutral-400">
            Senior front-end engineer with 5+ years of production experience. I champion
            developer experience: I introduced Storybook and integrated Chromatic visual
            regression testing at Huckberry, co-led a design-system rebrand synced from
            Figma tokens, and have been the primary author and reviewer of component work
            across the stack.
          </p>
          <p className="mt-3 text-sm leading-7 text-neutral-600 dark:text-neutral-400">
            Starva is where I pushed into the full-stack gaps — Next.js backend patterns,
            GraphQL API design, MongoDB data modelling, and OAuth token lifecycle — to
            round out the picture.
          </p>
          <div className="mt-4 flex gap-3">
            <a
              href="https://github.com/jbelleza29"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-black/10 px-4 py-1.5 text-sm font-medium text-neutral-600 transition-colors hover:border-orange-400 hover:text-orange-500 dark:border-white/10 dark:text-neutral-400"
            >
              GitHub
            </a>
            <a
              href="https://www.linkedin.com/in/john-pritz-belleza-a651b6126/"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-black/10 px-4 py-1.5 text-sm font-medium text-neutral-600 transition-colors hover:border-orange-400 hover:text-orange-500 dark:border-white/10 dark:text-neutral-400"
            >
              LinkedIn
            </a>
          </div>
        </section>
      </div>
    </main>
  );
}
