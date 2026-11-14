import { useState } from "react";
import { api } from "../../api";
import useFetch from "../../hooks/useFetch";
import Button from "../../components/Button";
import Card from "../../components/Card";
import { Badge } from "../../components/Chip";
import Page, { Loading, ErrorBox } from "../../components/Page";

export default function Sessions() {
  const { data, loading, error, reload } = useFetch(() => api.getSessions(), []);
  const [form, setForm] = useState({ title: "", perSkill: 5, timeLimitMinutes: 25 });
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const create = async (e) => {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    try {
      const r = await api.createSession({
        title: form.title,
        perSkill: Number(form.perSkill),
        timeLimitMinutes: Number(form.timeLimitMinutes),
      });
      setMsg(`Session created. Give students this code: ${r.session.code}`);
      setForm({ ...form, title: "" });
      reload();
    } catch (err) {
      setMsg(err.message);
    } finally {
      setBusy(false);
    }
  };

  const close = async (id) => {
    await api.closeSession(id);
    reload();
  };

  const input = "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-primary";
  return (
    <Page title="Supervised test sessions" subtitle="Run the assessment in your lab. Scores from a session get a Verified badge.">
      <Card className="mb-6">
        <h2 className="mb-3 font-bold">Create a session</h2>
        <form onSubmit={create} className="grid gap-3 sm:grid-cols-4">
          <input className={`${input} sm:col-span-2`} placeholder="Session title (e.g. CSE Year 3 lab test)" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          <input className={input} type="number" min="1" max="10" value={form.perSkill} onChange={(e) => setForm({ ...form, perSkill: e.target.value })} title="Questions per skill" />
          <input className={input} type="number" min="5" max="120" value={form.timeLimitMinutes} onChange={(e) => setForm({ ...form, timeLimitMinutes: e.target.value })} title="Time limit in minutes" />
          <Button disabled={busy} className="sm:col-span-4">{busy ? "Creating..." : "Create session"}</Button>
        </form>
        {msg && <p className="mt-3 text-sm font-medium text-brand">{msg}</p>}
      </Card>

      {loading && <Loading />}
      {error && <ErrorBox message={error} onRetry={reload} />}
      <div className="space-y-3">
        {data?.sessions.map((s) => (
          <Card key={s.sessionId} className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-bold">{s.title}</p>
              <p className="text-sm text-muted">{s.perSkill} questions per skill - {s.timeLimitMinutes} min - {s.attemptsTaken} attempts</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="rounded-lg bg-bg px-3 py-2 font-mono text-lg font-bold tracking-widest">{s.code}</span>
              <Badge tone={s.status === "active" ? "green" : "gray"}>{s.status}</Badge>
              {s.status === "active" && <Button variant="secondary" onClick={() => close(s.sessionId)}>Close</Button>}
            </div>
          </Card>
        ))}
      </div>
    </Page>
  );
}
