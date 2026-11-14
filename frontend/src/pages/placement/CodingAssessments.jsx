import { useState } from "react";
import { api } from "../../api";
import useFetch from "../../hooks/useFetch";
import Button from "../../components/Button";
import Card from "../../components/Card";
import { Badge } from "../../components/Chip";
import Page, { Loading, ErrorBox } from "../../components/Page";

const initial = {
  title: "",
  description: "",
  difficulty: "easy",
  functionName: "solve",
  timeLimitMinutes: 45,
  starterCode: "function solve(input) {\n  // Write your solution here\n}\n",
  testCases: '[\n  { "input": [5], "expected": 5 },\n  { "input": [0], "expected": 0 }\n]',
};

export default function CodingAssessments() {
  const { data, loading, error, reload } = useFetch(() => api.getPlacementCodingAssessments(), []);
  const [form, setForm] = useState(initial);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const input = "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-primary";

  const create = async (event) => {
    event.preventDefault(); setBusy(true); setMessage("");
    try {
      const testCases = JSON.parse(form.testCases);
      if (!Array.isArray(testCases)) throw new Error("Test cases must be a JSON array.");
      const result = await api.createCodingAssessment({ ...form, testCases, timeLimitMinutes: Number(form.timeLimitMinutes) });
      setMessage(`Created “${result.assessment.title}”. Students can now find it on the Coding page.`);
      setForm(initial); reload();
    } catch (e) { setMessage(e instanceof SyntaxError ? "Test cases are not valid JSON. Check the braces, commas, and quotation marks." : e.message); }
    finally { setBusy(false); }
  };
  const close = async (id) => { setBusy(true); setMessage(""); try { await api.closeCodingAssessment(id); reload(); } catch (e) { setMessage(e.message); } finally { setBusy(false); } };

  return <Page title="Coding assessments" subtitle="Create JavaScript function challenges and publish them to students.">
    <Card className="mb-6">
      <h2 className="mb-1 text-lg font-bold">Create a coding assessment</h2>
      <p className="mb-4 text-sm text-muted">Students write the named function and run it against the sample cases. Use JSON values for each input and expected output.</p>
      <form onSubmit={create} className="grid gap-3 md:grid-cols-2">
        <label className="text-sm font-medium">Assessment title<input className={`${input} mt-1`} maxLength={120} required value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="e.g. Array fundamentals" /></label>
        <label className="text-sm font-medium">Difficulty<select className={`${input} mt-1`} value={form.difficulty} onChange={e=>setForm({...form,difficulty:e.target.value})}><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option></select></label>
        <label className="text-sm font-medium md:col-span-2">Instructions<textarea className={`${input} mt-1 min-h-20`} maxLength={6000} required value={form.description} onChange={e=>setForm({...form,description:e.target.value})} placeholder="Describe the problem, input, and expected return value." /></label>
        <label className="text-sm font-medium">Function name<input className={`${input} mt-1 font-mono`} required pattern="[A-Za-z_$][A-Za-z0-9_$]{0,63}" value={form.functionName} onChange={e=>setForm({...form,functionName:e.target.value})} /></label>
        <label className="text-sm font-medium">Time limit (minutes)<input className={`${input} mt-1`} type="number" min="5" max="180" required value={form.timeLimitMinutes} onChange={e=>setForm({...form,timeLimitMinutes:e.target.value})} /></label>
        <label className="text-sm font-medium">Starter code<textarea className={`${input} mt-1 min-h-36 font-mono`} maxLength={20000} value={form.starterCode} onChange={e=>setForm({...form,starterCode:e.target.value})} /></label>
        <label className="text-sm font-medium">Test cases (JSON)<textarea className={`${input} mt-1 min-h-36 font-mono`} required value={form.testCases} onChange={e=>setForm({...form,testCases:e.target.value})} /></label>
        <p className="text-xs text-muted md:col-span-2">Format: <code>{'{ "input": [argument1, argument2], "expected": returnValue }'}</code>. Add between 1 and 20 cases. Inputs are passed as function arguments.</p>
        <Button className="md:col-span-2" disabled={busy}>{busy ? "Saving…" : "Create and publish"}</Button>
      </form>
      {message && <p className="mt-3 text-sm text-brand" role="status">{message}</p>}
    </Card>
    <h2 className="mb-3 text-lg font-bold">Published assessments</h2>
    {loading && <Loading />}{error && <ErrorBox message={error} onRetry={reload} />}
    <div className="space-y-3">{(data?.assessments||[]).map(a=><Card key={a.assessmentId} className="flex flex-wrap items-center justify-between gap-4"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="font-bold">{a.title}</h3><Badge tone={a.status==="active"?"green":"gray"}>{a.status}</Badge><Badge tone="gray">{a.difficulty}</Badge></div><p className="mt-1 text-sm text-muted">Function {a.functionName} · {a.testCases?.length||0} cases · {a.timeLimitMinutes} minutes</p><p className="mt-1 max-w-2xl truncate text-sm text-muted">{a.description}</p></div>{a.status==="active"&&<Button variant="secondary" disabled={busy} onClick={()=>close(a.assessmentId)}>Close assessment</Button>}</Card>)}</div>
    {!loading && !error && !data?.assessments?.length && <Card><p className="text-sm text-muted">No coding assessments yet. Create one above.</p></Card>}
  </Page>;
}
