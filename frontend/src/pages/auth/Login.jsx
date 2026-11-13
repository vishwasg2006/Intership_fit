import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { api, setSession, USE_MOCK } from "../../api";
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
            ? "Demo mode: any email works. An email starting with 'placement' opens the placement view."
            : "Demo logins: strong@demo.test, medium@demo.test, weak@demo.test, placement@demo.test (password Demo@123)"}
        </p>
      </Card>
    </div>
  );
}
