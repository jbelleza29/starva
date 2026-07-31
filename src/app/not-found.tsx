import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-24 text-center">
      <h1 className="text-3xl font-semibold tracking-tight">Page not found</h1>
      <p className="mt-2 text-sm text-neutral-500">
        That page doesn&apos;t exist — the activity may have been removed.
      </p>
      <Link
        href="/"
        className="mt-6 inline-block rounded-full bg-orange-500 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-600"
      >
        Back to dashboard
      </Link>
    </main>
  );
}
