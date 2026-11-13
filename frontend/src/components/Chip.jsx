const MAP = {
  ready_now: { label: "Ready now", cls: "bg-ready-soft text-ready" },
  almost_there: { label: "Almost there", cls: "bg-almost-soft text-almost" },
  build_first: { label: "Build first", cls: "bg-build-soft text-build" },
};

export default function Chip({ status }) {
  const s = MAP[status] || MAP.build_first;
  return <span className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${s.cls}`}>{s.label}</span>;
}

// Small generic badge: tone = green | amber | red | gray
export function Badge({ tone = "gray", children }) {
  const tones = {
    green: "bg-ready-soft text-ready",
    amber: "bg-almost-soft text-almost",
    red: "bg-build-soft text-build",
    gray: "bg-slate-100 text-muted",
  };
  return <span className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${tones[tone]}`}>{children}</span>;
}
