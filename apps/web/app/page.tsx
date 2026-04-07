const setupItems = [
  {
    label: "Framework",
    value: "Next.js 16.2.2 with the App Router",
  },
  {
    label: "Styling",
    value: "Tailwind CSS 4 with global theme tokens",
  },
  {
    label: "Tooling",
    value: "TypeScript, ESLint 9, and Turbopack-ready scripts",
  },
] as const;

const nextSteps = [
  "Connect shared UI and types packages as they come online.",
  "Add app routes for triage dashboards, queues, and auth flows.",
  "Introduce data fetching and tests once the first user journeys are defined.",
] as const;

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden px-6 py-16 sm:px-10 lg:px-12">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.16),_transparent_34%),radial-gradient(circle_at_bottom_right,_rgba(245,158,11,0.12),_transparent_28%),linear-gradient(180deg,_#f8fafc_0%,_#eef2ff_42%,_#f8fafc_100%)]" />
      <section className="mx-auto flex min-h-[calc(100vh-8rem)] w-full max-w-6xl flex-col justify-center gap-8">
        <div className="max-w-3xl space-y-6">
          <p className="inline-flex w-fit rounded-full border border-sky-200 bg-white/75 px-3 py-1 text-sm font-medium tracking-[0.2em] text-sky-700 uppercase shadow-sm backdrop-blur">
            Silver Engine / Web App
          </p>
          <div className="space-y-4">
            <h1 className="max-w-4xl text-5xl font-semibold tracking-tight text-slate-950 sm:text-6xl lg:text-7xl">
              Next.js is wired in and ready for the first real flows.
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-slate-600 sm:text-xl">
              This workspace now runs on the latest official Next.js starter,
              adapted for the monorepo so we can grow the dashboard, auth, and
              shared package integrations from a solid base.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <a
              href="https://nextjs.org/docs"
              className="inline-flex h-12 items-center justify-center rounded-full bg-slate-950 px-6 text-sm font-semibold text-white transition hover:bg-slate-800"
              target="_blank"
              rel="noreferrer"
            >
              Read Next.js docs
            </a>
            <a
              href="https://tailwindcss.com/docs/installation/framework-guides/nextjs"
              className="inline-flex h-12 items-center justify-center rounded-full border border-slate-300 bg-white/80 px-6 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-white"
              target="_blank"
              rel="noreferrer"
            >
              Review Tailwind 4 setup
            </a>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.3fr_0.9fr]">
          <section className="rounded-[2rem] border border-white/70 bg-white/75 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur sm:p-8">
            <p className="text-sm font-semibold tracking-[0.18em] text-slate-400 uppercase">
              Included setup
            </p>
            <dl className="mt-6 grid gap-4 sm:grid-cols-3">
              {setupItems.map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4"
                >
                  <dt className="text-sm font-semibold text-slate-500">
                    {item.label}
                  </dt>
                  <dd className="mt-3 text-base leading-7 text-slate-900">
                    {item.value}
                  </dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="rounded-[2rem] border border-slate-200 bg-slate-950 p-6 text-slate-50 shadow-[0_24px_80px_rgba(15,23,42,0.18)] sm:p-8">
            <p className="text-sm font-semibold tracking-[0.18em] text-sky-200 uppercase">
              Suggested next moves
            </p>
            <ul className="mt-6 space-y-4 text-base leading-7 text-slate-200">
              {nextSteps.map((step) => (
                <li key={step} className="flex gap-3">
                  <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-amber-300" />
                  <span>{step}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </section>
    </main>
  );
}
