export default function About() {
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-12">
      <h1 className="text-3xl font-semibold tracking-tight">About</h1>
      <p className="mt-2 text-sm text-neutral-500">The project and the person behind it.</p>

      <div className="mt-10 flex flex-col gap-8">
        <section className="rounded-xl border border-black/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-neutral-900">
          <h2 className="mb-3 text-base font-semibold">The project</h2>
          <p className="text-sm leading-7 text-neutral-600 dark:text-neutral-400">
            Starva is a personal training analytics dashboard built on my real Strava data.
            I built it to fill in the gaps in my public portfolio — Next.js App Router,
            GraphQL, MongoDB, and a proper CI pipeline. The data is live: activities sync
            from Strava via OAuth, land in MongoDB Atlas, and get served through an Apollo
            GraphQL API that runs as a Next.js route handler.
          </p>
          <p className="mt-3 text-sm leading-7 text-neutral-600 dark:text-neutral-400">
            The components are built as a reusable kit — purely prop-driven, with the
            charting library wrapped behind a stable API so it stays swappable. Every push
            runs lint, typecheck, build, and Chromatic visual regression in CI.
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
          <h2 className="mb-3 text-base font-semibold">Who I am</h2>
          <p className="text-sm leading-7 text-neutral-600 dark:text-neutral-400">
            I&apos;m a front-end engineer based in Pickering, Ontario with 5+ years building
            production web apps. Most of that time has been at Huckberry, where I introduced
            Storybook, set up Chromatic visual regression, co-led a design-system rebrand
            tied to Figma tokens, and have been the main reviewer of component work across
            the front end.
          </p>
          <p className="mt-3 text-sm leading-7 text-neutral-600 dark:text-neutral-400">
            Starva is my way of proving out the back-end and infrastructure side of things
            in public — something a UI-focused role doesn&apos;t always give you room to do.
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
