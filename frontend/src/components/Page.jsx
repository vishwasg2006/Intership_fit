import Button from "./Button";

export default function Page({ title, subtitle, right, narrow, children }) {
  return (
    <main className={`mx-auto px-6 py-8 ${narrow ? "max-w-xl" : "max-w-5xl"}`}>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{title}</h1>
          {subtitle && <p className="mt-1 text-muted">{subtitle}</p>}
        </div>
        {right}
      </div>
      {children}
    </main>
  );
}

export function Loading({ text = "Loading..." }) {
  return <div className="space-y-3 py-5" role="status" aria-live="polite" aria-label={text}>
    <span className="sr-only">{text}</span>
    <div className="h-9 w-1/3 animate-pulse rounded-lg bg-slate-200" />
    <div className="grid gap-3 sm:grid-cols-3"><div className="h-24 animate-pulse rounded-xl border border-slate-200 bg-white"/><div className="h-24 animate-pulse rounded-xl border border-slate-200 bg-white"/><div className="h-24 animate-pulse rounded-xl border border-slate-200 bg-white"/></div>
    <div className="h-40 animate-pulse rounded-xl border border-slate-200 bg-white"/>
  </div>;
}

export function ErrorBox({ message, onRetry }) {
  return (
    <div className="rounded-xl border border-build bg-build-soft p-4 text-sm text-build">
      <p className="mb-2 font-medium">{message}</p>
      {onRetry && <Button variant="secondary" onClick={onRetry}>Try again</Button>}
    </div>
  );
}
