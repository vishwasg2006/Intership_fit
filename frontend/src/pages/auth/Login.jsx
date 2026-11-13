import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { api, setSession, USE_MOCK } from "../../api";
import Button from "../../components/Button";
import Card from "../../components/Card";

export default function Login() {
  const nav = useNavigate();
  const [params] = useSearchParams();
  const [mode, setMode] = useState(params.get("tab") === "signup" ? "signup" : "login");
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "student", inviteCode: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res =
        mode === "login"
          ? await api.login({ email: form.email, password: form.password })
          : await api.signup(form);
      setSession(res);
      if (res.user.role === "placement") nav("/dashboard");
      else nav(mode === "signup" ? "/profile" : "/home");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const input = "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:border-primary";
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <Link to="/" className="text-sm font-bold text-brand">← InternshipFit</Link>
        <h1 className="mt-4 text-2xl font-bold text-brand">{mode === "login" ? "Welcome back" : "Create your account"}</h1>
        <p className="mb-5 text-sm text-muted">Know your fit. Fix your gaps. Get matched.</p>

        <div className="mb-4 flex gap-2">
          {["login", "signup"].map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`flex-1 rounded-lg py-2 text-sm font-bold ${mode === m ? "bg-primary text-white" : "bg-bg text-muted"}`}
            >
              {m === "login" ? "Log in" : "Sign up"}
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="space-y-3">
          {mode === "signup" && (
            <>
              <label className="block text-sm font-medium">Full name<input aria-label="Full name" className={`${input} mt-1`} placeholder="e.g. Ananya Rao" value={form.name} onChange={set("name")} required /></label>
              <label className="block text-sm font-medium">I am a<select aria-label="Role" className={`${input} mt-1`} value={form.role} onChange={set("role")}>
                <option value="student">Student</option>
                <option value="placement">Placement officer</option>
              </select></label>
              {form.role === "placement" && <label className="block text-sm font-medium">Placement invite code<input aria-label="Placement invite code" className={`${input} mt-1`} placeholder="Ask your placement cell admin" value={form.inviteCode} onChange={set("inviteCode")} required /></label>}
            </>
          )}
          <label className="block text-sm font-medium">Email address<input aria-label="Email address" className={`${input} mt-1`} type="email" placeholder="you@example.com" value={form.email} onChange={set("email")} required /></label>
          <label className="block text-sm font-medium">Password<input aria-label="Password" className={`${input} mt-1`} type="password" placeholder="At least 8 characters" value={form.password} onChange={set("password")} required minLength={8} /></label>
          {error && <p className="text-sm text-build">{error}</p>}
          <Button className="w-full" disabled={loading}>
            {loading ? "Please wait..." : mode === "login" ? "Log in" : "Create account"}
          </Button>
        </form>

        <p className="mt-4 text-xs text-muted">
          {USE_MOCK
            ? "Demo mode: any email works. An email starting with 'placement' opens the placement view."
            : "Demo logins: strong@demo.test, medium@demo.test, weak@demo.test, placement@demo.test (password Demo@123)"}
        </p>
      </Card>
    </div>
  );
}
