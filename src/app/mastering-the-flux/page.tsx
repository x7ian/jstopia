const ranks = [
  {
    title: 'Initiate',
    description: 'First steps in the Academy. You can declare variables and read simple code.',
  },
  {
    title: 'Campfire Cadet',
    description: 'You can explain let/const basics and avoid common beginner mistakes.',
  },
  {
    title: 'Scope Ranger',
    description: 'You predict what variables are visible where (global/function/block) and write safer code.',
  },
  {
    title: 'Stack Adept',
    description: 'You understand functions, call order, and can debug with traces and mental execution.',
  },
  {
    title: 'Async Apprentice',
    description: 'You understand Promises and async/await at a practical level and can reason about timing.',
  },
  {
    title: 'Runtime Navigator',
    description: 'You can work confidently with Browser APIs (DOM/events/fetch) and know what the runtime provides.',
  },
  {
    title: 'Flux Architect',
    description: 'You build clean, practical solutions, connect concepts, and apply patterns with confidence.',
  },
  {
    title: 'Loop Sage',
    description: 'You master execution order and async behavior deeply. You can explain why code runs in a specific order and debug complex timing bugs.',
  },
]

export default function MasteringTheFluxPage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-10 px-6 py-14 text-[color:var(--text)]">
      <section className="glass-strong rounded-[2rem] px-6 py-10 text-center sm:px-10">
        <p className="text-xs uppercase tracking-[0.4em] text-[color:var(--muted)]">
          The Mastery Journey
        </p>
        <h1 className="mt-3 text-4xl font-semibold text-[color:var(--text)] sm:text-5xl">
          Mastering the Flux
        </h1>
        <p className="mt-4 text-sm text-[color:var(--muted)] sm:text-base">
          Flux is the flow of control, data, and events that moves through your code. The Loop is the scheduler
          that decides when work happens. The Runtime is the environment that provides the tools and APIs that
          make it all possible.
        </p>
        <div className="mt-4 h-4" aria-hidden />
      </section>

      <section className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-2xl font-semibold text-[color:var(--text)]">Flux Master Ranks</h2>
          <span className="text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]">
            The mastery journey
          </span>
        </div>
        <div className="grid gap-4">
          {ranks.map((rank, index) => (
            <div
              key={rank.title}
              className="glass group relative overflow-hidden rounded-2xl p-5 transition hover:-translate-y-1"
            >
              <div className="absolute left-5 top-0 h-full w-px bg-[color:var(--border)]" />
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[color:var(--border)] bg-[color:var(--panel-strong)] text-sm font-semibold text-[color:var(--text)]">
                  {index + 1}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[color:var(--text)]">{rank.title}</h3>
                  <p className="mt-1 text-[color:var(--muted)]">{rank.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
