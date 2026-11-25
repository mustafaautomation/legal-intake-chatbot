import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-xl px-4 py-20">
      <p className="text-xs uppercase tracking-[0.18em] text-brass">Missing file</p>
      <h1 className="mt-3 font-serif text-4xl">That page is not on this desk.</h1>
      <p className="mt-3 text-sm leading-6 text-muted">The matter number may be wrong, or the intake file was never opened.</p>
      <Link href="/admin" className="mt-6 inline-block text-sm underline">
        Return to the pipeline
      </Link>
    </main>
  );
}
