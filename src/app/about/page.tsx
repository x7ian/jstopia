import Link from 'next/link'

export default function AboutPage() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-6 py-14 text-[color:var(--text)]">
      <section className="glass-strong rounded-[2rem] px-6 py-10 text-center sm:px-10">
        <p className="text-xs uppercase tracking-[0.4em] text-[color:var(--muted)]">About</p>
        <h1 className="mt-3 text-4xl font-semibold text-[color:var(--text)] sm:text-5xl">JavaScriptopia</h1>
        <p className="mt-3 text-sm text-[color:var(--muted)] sm:text-base">
          Start with the Prologue chapter to learn the core ideas and tools.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link className="btn-primary rounded-full px-6 py-2 text-xs font-semibold uppercase tracking-[0.35em]" href="/topic/prologue-welcome">
            Enter Prologue
          </Link>
          <Link className="btn-secondary rounded-full px-6 py-2 text-xs font-semibold uppercase tracking-[0.35em]" href="/journey">
            Back to Journey
          </Link>
        </div>
      </section>
    </div>
  )
}
