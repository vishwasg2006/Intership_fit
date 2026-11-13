import { useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { api } from "../../api";
import useFetch from "../../hooks/useFetch";
import { BRANCHES, SKILL_LABELS, skillLabel } from "../../utils";
import Card from "../../components/Card";
import Chip, { Badge } from "../../components/Chip";
import Page, { Loading, ErrorBox } from "../../components/Page";
import StudentDrawer from "../../components/placement/StudentDrawer";

export default function Dashboard() {
  const [filters, setFilters] = useState({ branch: "", skill: "", minScore: "", verifiedOnly: false });
  const [selected, setSelected] = useState(null);

  const cohort = useFetch(
    () => api.getCohort({ ...filters, verifiedOnly: filters.verifiedOnly ? "true" : "" }),
    [filters]
  );
  const gaps = useFetch(() => api.getCohortGaps(), []);

  const set = (k) => (e) => setFilters({ ...filters, [k]: e.target.value });
  const input = "rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-primary";
  const summary = cohort.data?.summary;

  return (
    <Page title="Placement dashboard" subtitle="Live skill data for your students (only students who agreed to share).">
      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        {[
          ["Students tested", summary?.tested],
          ["Average score", summary ? `${summary.avgScore}%` : undefined],
          ["Ready now", summary?.readyNow],
          ["Need review", summary?.reviewCount],
        ].map(([label, value]) => (
          <Card key={label}>
            <p className="text-sm text-muted">{label}</p>
            <p className="mt-1 text-3xl font-bold text-brand">{value ?? "-"}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="mb-4 flex flex-wrap items-end gap-2">
            <label className="text-xs font-semibold text-muted">Branch<select aria-label="Branch" className={`${input} mt-1 block`} value={filters.branch} onChange={set("branch")}>
              <option value="">All branches</option>
              {BRANCHES.map((b) => <option key={b}>{b}</option>)}
            </select></label>
            <label className="text-xs font-semibold text-muted">Score type<select aria-label="Skill score filter" className={`${input} mt-1 block`} value={filters.skill} onChange={set("skill")}>
              <option value="">Overall score</option>
              {Object.entries(SKILL_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select></label>
            <label className="text-xs font-semibold text-muted">Minimum score<input aria-label="Minimum score" className={`${input} mt-1 block w-28`} type="number" min="0" max="100" placeholder="0 to 100" value={filters.minScore} onChange={set("minScore")} /></label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={filters.verifiedOnly} onChange={(e) => setFilters({ ...filters, verifiedOnly: e.target.checked })} />
              Verified only
            </label>
          </div>

          {cohort.loading && <Loading />}
          {cohort.error && <ErrorBox message={cohort.error} onRetry={cohort.reload} />}
          {cohort.data && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 bg-white text-muted">
                  <tr><th className="py-2">#</th><th>Name</th><th>Branch</th><th>Score</th><th>Readiness</th><th>Type</th><th></th></tr>
                </thead>
                <tbody>
                  {cohort.data.students.map((s) => (
                    <tr key={s.studentId} className="border-t border-slate-100 hover:bg-bg">
                      <td className="py-2">{s.rank}</td>
                      <td className="font-medium"><button className="rounded text-left text-ink underline decoration-transparent underline-offset-2 hover:decoration-current" onClick={() => setSelected(s.studentId)} aria-label={`Open details for ${s.name}`}>{s.name}</button></td>
                      <td>{s.branch} - Y{s.year}</td>
                      <td className="font-bold">{s.overall}%</td>
                      <td><Chip status={s.readiness} /></td>
                      <td>
                        <Badge tone={s.scoreType === "verified" ? "green" : "gray"}>
                          {s.scoreType === "verified" ? "Verified" : "Self-reported"}
                        </Badge>
                      </td>
                      <td>{s.integrityStatus === "review" && <Badge tone="amber">Review</Badge>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {cohort.data.students.length === 0 && <p className="py-6 text-center text-muted">No students match these filters.</p>}
            </div>
          )}
        </Card>

        <Card>
          <h2 className="mb-1 font-bold">Cohort skill gaps</h2>
          <p className="mb-3 text-xs text-muted">Average score per skill. Plan your training where bars are short.</p>
          {gaps.loading && <Loading />}
          {gaps.error && <ErrorBox message={gaps.error} onRetry={gaps.reload} />}
          {gaps.data && (
            <>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={gaps.data.skills.map((s) => ({ ...s, name: skillLabel(s.skill) }))}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="avgScore" name="Average score" fill="var(--color-primary)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <ul className="mt-2 space-y-1 text-xs text-muted">
                {gaps.data.skills.map((s) => (
                  <li key={s.skill}>{skillLabel(s.skill)}: {s.belowTargetPct}% of students below target</li>
                ))}
              </ul>
            </>
          )}
        </Card>
      </div>

      {selected && <StudentDrawer studentId={selected} onClose={() => setSelected(null)} />}
    </Page>
  );
}
