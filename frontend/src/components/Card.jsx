export default function Card({ className = "", ...props }) {
  return <div className={`rounded-xl border border-slate-200 bg-surface p-5 shadow-sm ${className}`} {...props} />;
}
