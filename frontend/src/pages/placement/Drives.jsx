import { useState } from "react";
import { api } from "../../api";
import useFetch from "../../hooks/useFetch";
import { BRANCHES, formatDate } from "../../utils";
import Button from "../../components/Button";
import Card from "../../components/Card";
import Page, { Loading, ErrorBox } from "../../components/Page";

const EMPTY = { company: "", role: "", date: "", deadline: "", minCgpa: "", minScore: "", branches: [] };

export default function Drives() {
  const { data, loading, error, reload } = useFetch(() => api.getPlacementDrives(), []);
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const toggleBranch = (b) =>
    setForm({ ...form, branches: form.branches.includes(b) ? form.branches.filter((x) => x !== b) : [...form.branches, b] });

  const create = async (e) => {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    try {
      await api.createDrive({
        ...form,
        minCgpa: form.minCgpa === "" ? 0 : Number(form.minCgpa),
        minScore: form.minScore === "" ? 0 : Number(form.minScore),
      });
      setForm(EMPTY);
      setMsg("Drive posted. Students see it on their home page and can mark interest if eligible.");
      reload();
    } catch (err) {
      setMsg(err.message);
    } finally {
      setBusy(false);
    }
  };

  const input = "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-primary";
  return (
    <Page title="Campus hiring drives" subtitle="Post a drive with eligibility rules, and track responses.">
      <Card className="mb-6">
        <h2 className="mb-3 font-bold">Post a drive</h2>
        <form onSubmit={create} className="grid gap-3 sm:grid-cols-2">
          <input className={input} placeholder="Company" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} required />
          <input className={input} placeholder="Role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} required />
          <label className="text-xs text-muted">Drive date<input className={input} type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required /></label>
          <label className="text-xs text-muted">Apply by<input className={input} type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} required /></label>
          <input className={input} type="number" step="0.1" min="0" max="10" placeholder="Minimum CGPA" value={form.minCgpa} onChange={(e) => setForm({ ...form, minCgpa: e.target.value })} />
          <input className={input} type="number" min="0" max="100" placeholder="Minimum overall score" value={form.minScore} onChange={(e) => setForm({ ...form, minScore: e.target.value })} />
          <div className="flex flex-wrap gap-2 sm:col-span-2">
            {BRANCHES.map((b) => (
              <button
                type="button" key={b} onClick={() => toggleBranch(b)}
                className={`rounded-full px-3 py-1 text-xs font-bold ${form.branches.includes(b) ? "bg-primary text-white" : "bg-bg text-muted"}`}
              >
                {b}
              </button>
            ))}
          </div>
          <Button disabled={busy} className="sm:col-span-2">{busy ? "Posting..." : "Post drive"}</Button>
        </form>
        {msg && <p className="mt-3 text-sm font-medium text-brand">{msg}</p>}
      </Card>

      {loading && <Loading />}
      {error && <ErrorBox message={error} onRetry={reload} />}
      <div className="space-y-3">
        {data?.drives.map((d) => (
          <Card key={d.driveId} className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-bold">{d.company} - {d.role}</p>
              <p className="text-sm text-muted">
                {formatDate(d.date)} (apply by {formatDate(d.deadline)}) - min CGPA {d.minCgpa}, min score {d.minScore}
                {d.branches?.length ? ` - ${d.branches.join(", ")}` : ""}
              </p>
            </div>
            <span className="rounded-lg bg-bg px-3 py-2 text-sm font-bold">{d.responses} responses</span>
          </Card>
        ))}
      </div>
    </Page>
  );
}
