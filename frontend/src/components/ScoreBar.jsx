import { skillLabel } from "../utils";

export default function ScoreBar({ label, value, target }) {
  return (
    <div className="mb-3">
      <div className="mb-1 flex justify-between text-sm">
        <span className="font-medium">{skillLabel(label)}</span>
        <span className="text-muted">
          {value}%{target ? ` / target ${target}%` : ""}
        </span>
      </div>
      <div className="relative h-2 rounded-full bg-slate-200">
        <div className="h-2 rounded-full bg-primary" style={{ width: `${Math.min(value, 100)}%` }} />
        {target ? (
          <div className="absolute -top-1 h-4 w-0.5 bg-brand" style={{ left: `${Math.min(target, 100)}%` }} />
        ) : null}
      </div>
    </div>
  );
}
