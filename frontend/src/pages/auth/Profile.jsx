import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../api";
import { BRANCHES } from "../../utils";
import Button from "../../components/Button";
import Card from "../../components/Card";
import Page from "../../components/Page";

export default function Profile() {
  const nav = useNavigate();
  const [form, setForm] = useState({ college: "", branch: "CSE", year: 3, cgpa: "", consentShare: false });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.saveProfile({ ...form, year: Number(form.year), cgpa: Number(form.cgpa) });
      nav("/home");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const input = "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:border-primary";
  return (
    <Page narrow title="Tell us about you" subtitle="We use this to check which internships you are eligible for.">
      <Card>
        <form onSubmit={submit} className="space-y-3">
          <label className="block text-sm font-medium">College name<input aria-label="College name" className={`${input} mt-1`} placeholder="Your college" value={form.college} onChange={(e) => setForm({ ...form, college: e.target.value })} required /></label>
          <div className="flex gap-3">
            <label className="block flex-1 text-sm font-medium">Branch<select aria-label="Branch" className={`${input} mt-1`} value={form.branch} onChange={(e) => setForm({ ...form, branch: e.target.value })}>
              {BRANCHES.map((b) => <option key={b}>{b}</option>)}
            </select></label>
            <label className="block flex-1 text-sm font-medium">Year<select aria-label="Year" className={`${input} mt-1`} value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })}>
              {[1, 2, 3, 4].map((y) => <option key={y} value={y}>Year {y}</option>)}
            </select></label>
          </div>
          <label className="block text-sm font-medium">CGPA (out of 10)<input aria-label="CGPA" className={`${input} mt-1`} type="number" step="0.01" min="0" max="10" placeholder="e.g. 7.4" value={form.cgpa} onChange={(e) => setForm({ ...form, cgpa: e.target.value })} required /></label>
          <label className="flex items-start gap-2 text-sm text-muted">
            <input type="checkbox" className="mt-1" checked={form.consentShare} onChange={(e) => setForm({ ...form, consentShare: e.target.checked })} />
            <span><b className="text-ink">Share my scores with my college placement cell</b><span className="mt-1 block">If you agree, placement staff can see your assessment scores and use them to support hiring. You can opt out by updating your consent later.</span></span>
          </label>
          {error && <p className="text-sm text-build">{error}</p>}
          <Button className="w-full" disabled={loading}>{loading ? "Saving..." : "Save and continue"}</Button>
        </form>
      </Card>
    </Page>
  );
}
