import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { api, setSession, API_BASE, USE_MOCK } from "../../api";
import Button from "../../components/Button";
import Card from "../../components/Card";

export default function Login() {
  const nav = useNavigate();
  const [params] = useSearchParams();
  const [mode, setMode] = useState(params.get("tab") === "signup" ? "signup" : "login");
  const [forgot, setForgot] = useState(false);
  const [reset, setReset] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [notice, setNotice] = useState("");
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "student", inviteCode: "" });
  const [verify, setVerify] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const input = "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:border-primary";
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
      if (res.verificationRequired) { setVerify(res.email); setCode(""); setNotice(res.message); return; }
      finish(res);
    } catch (err) {
      if (err.code === "EMAIL_NOT_VERIFIED") { setVerify(form.email.trim().toLowerCase()); setCode(""); setNotice("Your email is not verified yet. Enter the 6-digit code we email you."); api.resendCode(form.email).catch(() => {}); }
      else setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    const h = window.location.hash;
    if (!h.startsWith("#oauth")) return;
    window.history.replaceState(null, "", window.location.pathname + window.location.search);
    try {
      if (h.startsWith("#oauth_error=")) { setError(decodeURIComponent(h.slice(13))); return; }
      const b64 = h.slice(7).replace(/-/g, "+").replace(/_/g, "/");
      const res = JSON.parse(decodeURIComponent(escape(atob(b64))));
      setSession(res);
      nav(res.user.role === "placement" ? "/dashboard" : res.isNew ? "/profile" : "/home", { replace: true });
    } catch { setError("Sign-in failed. Please try again."); }
  }, []);
  const social = (provider) => {
    if (USE_MOCK) { setError("Google and GitHub sign-in need the API server (VITE_USE_MOCK=false)."); return; }
    window.location.href = `${API_BASE}/api/auth/oauth/${provider}/start`;
  };
  const finish = (res) => {
    setSession(res);
    if (res.user.role === "placement") nav("/dashboard");
    else nav(mode === "signup" || verify ? "/profile" : "/home");
  };
  const submitCode = async (e) => {
    e.preventDefault(); setError(""); setLoading(true);
    try { finish(await api.verifyEmail({ email: verify, code: code.trim() })); }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };
  const resendCode = async () => {
    setError(""); setNotice("");
    try { const r = await api.resendCode(verify); setNotice(r.message); } catch (err) { setError(err.message); }
  };

  const requestReset = async (e) => {
    e.preventDefault(); setError(""); setNotice(""); setLoading(true);
    try { const r = await api.requestPasswordReset(form.email); setNotice(r.message); }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };
  const applyReset = async (e) => { e.preventDefault(); setError(""); setNotice(""); setLoading(true); try { const r = await api.resetPassword(reset, newPassword); setNotice(r.message); setReset(""); } catch (err) { setError(err.message); } finally { setLoading(false); } };
  if (params.get("reset")) {
    if (reset !== params.get("reset")) setReset(params.get("reset"));
    return <div className="flex min-h-screen items-center justify-center px-4"><Card className="w-full max-w-md"><h1 className="text-2xl font-bold text-brand">Choose a new password</h1><form onSubmit={applyReset} className="mt-5 space-y-3"><label className="block text-sm font-medium">New password<input className={`${input} mt-1`} type="password" minLength={8} required value={newPassword} onChange={e=>setNewPassword(e.target.value)} /></label>{error && <p className="text-sm text-build">{error}</p>}{notice && <p className="text-sm text-ready">{notice}</p>}<Button className="w-full" disabled={loading}>{loading ? "Updating..." : "Update password"}</Button><Link className="block text-center text-sm text-primary underline" to="/login">Back to login</Link></form></Card></div>;
  }

  if (verify) {
    return <div className="flex min-h-screen items-center justify-center px-4"><Card className="w-full max-w-md"><h1 className="text-2xl font-bold text-brand">Verify your email</h1><p className="mb-5 mt-1 text-sm text-muted">Enter the 6-digit code sent to {verify}. It expires in 15 minutes.</p><form onSubmit={submitCode} className="space-y-3"><input aria-label="Verification code" className={`${input} text-center text-2xl tracking-widest`} inputMode="numeric" maxLength={6} placeholder="••••••" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} required />{error && <p className="text-sm text-build">{error}</p>}{notice && <p className="text-sm text-ready">{notice}</p>}<Button className="w-full" disabled={loading || code.length !== 6}>{loading ? "Verifying..." : "Verify and continue"}</Button><button type="button" className="w-full text-sm text-primary underline" onClick={resendCode}>Resend code</button><button type="button" className="w-full text-sm text-muted underline" onClick={() => { setVerify(""); setError(""); setNotice(""); }}>Back</button></form></Card></div>;
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <Link to="/" className="text-sm font-bold text-brand">← InternshipFit</Link>
        <h1 className="mt-4 text-2xl font-bold text-brand">{forgot ? "Reset your password" : mode === "login" ? "Welcome back" : "Create your account"}</h1>
        <p className="mb-5 text-sm text-muted">Know your fit. Fix your gaps. Get matched.</p>

        {!forgot && <div className="mb-4 flex gap-2">
          {["login", "signup"].map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`flex-1 rounded-lg py-2 text-sm font-bold ${mode === m ? "bg-primary text-white" : "bg-bg text-muted"}`}
            >
              {m === "login" ? "Log in" : "Sign up"}
            </button>
          ))}
        </div>}


        {!forgot && <div className="mb-4">
          <div className="space-y-2">
            <button type="button" onClick={() => social("google")} className="flex w-full items-center justify-center gap-3 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 8 3l5.7-5.7C34 6.1 29.3 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.6-.4-3.9z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 8 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.6-.4-3.9z"/></svg>
              Continue with Google
            </button>
            <button type="button" onClick={() => social("github")} className="flex w-full items-center justify-center gap-3 rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800">
              <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>
              Continue with GitHub
            </button>
          </div>
          <div className="my-4 flex items-center gap-3 text-xs text-muted"><span className="h-px flex-1 bg-slate-200" />or use your email<span className="h-px flex-1 bg-slate-200" /></div>
        </div>}
        {forgot ? <form onSubmit={requestReset} className="space-y-3"><label className="block text-sm font-medium">Registered email<input aria-label="Email address" className={`${input} mt-1`} type="email" value={form.email} onChange={set("email")} required /></label>{error && <p className="text-sm text-build">{error}</p>}{notice && <p className="text-sm text-ready">{notice}</p>}<Button className="w-full" disabled={loading}>{loading ? "Sending..." : "Send reset link"}</Button><button type="button" className="w-full text-sm text-primary underline" onClick={() => { setForgot(false); setError(""); }}>Back to login</button></form> : <form onSubmit={submit} className="space-y-3">
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
          {mode === "login" && <button type="button" className="w-full text-sm text-primary underline" onClick={() => { setForgot(true); setNotice(""); setError(""); }}>Forgot password?</button>}
        </form>
        }

        <p className="mt-4 text-xs text-muted">
          {USE_MOCK
            ? "Demo mode accepts the listed demo accounts only; use the shared demo password."
            : "Demo logins: strong@demo.test, medium@demo.test, weak@demo.test, placement@demo.test (password Demo@123)"}
        </p>
      </Card>
    </div>
  );
}
