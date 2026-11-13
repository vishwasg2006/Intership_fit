export default function ScoreRing({ value, size = 64 }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  const color = value >= 80 ? "var(--color-ready)" : value >= 55 ? "var(--color-almost)" : "var(--color-build)";
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" role="img" aria-label={`Score ${value} out of 100`}>
      <circle cx="32" cy="32" r={r} fill="none" stroke="var(--color-border)" strokeWidth="6" />
      <circle
        cx="32" cy="32" r={r} fill="none" stroke={color} strokeWidth="6" strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={c * (1 - value / 100)} transform="rotate(-90 32 32)"
      />
      <text x="32" y="37" textAnchor="middle" fontSize="16" fontWeight="700" fill="var(--color-ink)">{value}</text>
    </svg>
  );
}
