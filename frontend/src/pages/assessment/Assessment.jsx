import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, USE_MOCK } from "../../api";
import useProctor from "./useProctor";
import { skillLabel } from "../../utils";
import Button from "../../components/Button";
import Card from "../../components/Card";
import Page from "../../components/Page";

const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
const exitFs = () => { if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {}); };

export default function Assessment() {
  const nav = useNavigate();
  // setup screen
  const [mode, setMode] = useState("practice");
  const [sessionCode, setSessionCode] = useState("");
  const [agree, setAgree] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");
  // test screen
  const [attempt, setAttempt] = useState(null);
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [violations, setViolations] = useState(0);
  const [banner, setBanner] = useState("");
  const [remaining, setRemaining] = useState(0);
  const [notFs, setNotFs] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const finished = useRef(false);
  const qStart = useRef(Date.now());
  const spent = useRef({}); // questionId -> ms
  const submitRef = useRef(null);

  // The server retains the same attempt and violation count. Keep the in-progress
  // answers and navigator position locally so a refresh does not lose the work.
  useEffect(() => {
    if (!attempt) return;
    try {
      localStorage.setItem(`internshipfit:attempt:${attempt.attemptId}`, JSON.stringify({ answers, idx, spent: spent.current }));
    } catch { /* Storage can be unavailable in private browsing; the server still resumes the attempt. */ }
  }, [attempt, answers, idx, violations]);

  const maxViolations = attempt?.maxViolations || 3;

  const flushTime = () => {
    if (!attempt) return;
    const q = attempt.questions[idx];
    if (q) spent.current[q.questionId] = (spent.current[q.questionId] || 0) + (Date.now() - qStart.current);
    qStart.current = Date.now();
  };

  const goTo = (n) => {
    flushTime();
    setIdx(n);
  };

  const submit = async () => {
    if (finished.current || !attempt) return;
    finished.current = true;
    flushTime();
    setSubmitting(true);
    try {
      await api.submitAttempt({
        attemptId: attempt.attemptId,
        answers: Object.entries(answers).map(([questionId, selected]) => ({ questionId, selected })),
        perQuestionSeconds: Object.entries(spent.current).map(([questionId, ms]) => ({
          questionId,
          seconds: Math.round(ms / 1000),
        })),
      });
      localStorage.removeItem(`internshipfit:attempt:${attempt.attemptId}`);
      exitFs();
      nav("/results");
    } catch (e) {
      finished.current = false;
      setSubmitting(false);
      setError(e.message);
    }
  };
  submitRef.current = submit;

  const handleViolation = async (type) => {
    if (finished.current || !attempt) return;
    try {
      const r = await api.sendViolation({ attemptId: attempt.attemptId, type });
      setViolations(r.violationsUsed);
      setBanner(r.message);
      if (r.terminated) {
        finished.current = true;
        localStorage.removeItem(`internshipfit:attempt:${attempt.attemptId}`);
        exitFs();
        nav("/results", { state: { terminated: true } });
      }
    } catch (e) {
      if (/ended/i.test(e.message)) {
        finished.current = true;
        nav("/results", { state: { terminated: true } });
      } else setBanner(e.message);
    }
  };

  useProctor(!!attempt, handleViolation);

  // fullscreen overlay
  useEffect(() => {
    if (!attempt) return;
    const onChange = () => setNotFs(!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, [attempt]);

  // countdown timer
  useEffect(() => {
    if (!attempt) return;
    const limit = attempt.timeLimitSeconds;
    const started = USE_MOCK ? Date.now() : new Date(attempt.startedAt).getTime();
    const tick = () => {
      const left = Math.max(0, limit - Math.floor((Date.now() - started) / 1000));
      setRemaining(left);
      if (left === 0) submitRef.current?.();
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [attempt]);

  const start = async () => {
    setStarting(true);
    setError("");
    try {
      await document.documentElement.requestFullscreen?.();
    } catch {
      /* fullscreen not available: continue anyway */
    }
    try {
      const data = await api.getQuestions({
        perSkill: 5,
        mode,
        sessionCode: mode === "supervised" ? sessionCode.trim().toUpperCase() : undefined,
      });
      if (data.status !== "in_progress") {
        nav("/results");
        return;
      }
      if (data.resumed) {
        try {
          const saved = JSON.parse(localStorage.getItem(`internshipfit:attempt:${data.attemptId}`) || "null");
          setAnswers(saved?.answers || {});
          setIdx(Math.min(saved?.idx || 0, data.questions.length - 1));
          spent.current = saved?.spent || {};
        } catch { setAnswers({}); setIdx(0); }
      } else {
        setAnswers({}); setIdx(0); spent.current = {};
      }
      finished.current = false;
      qStart.current = Date.now();
      setViolations(data.violationsUsed || 0);
      setAttempt(data);
    } catch (e) {
      setError(e.message);
      exitFs();
    } finally {
      setStarting(false);
    }
  };

  // ---------- setup / rules screen ----------
  if (!attempt) {
    const canStart = agree && (mode === "practice" || sessionCode.trim().length >= 4);
    return (
      <Page narrow title="Skill assessment" subtitle="Aptitude, programming, web and DBMS.">
        <Card>
          <div className="mb-4 flex gap-2">
            {[
              ["practice", "Practice (self-reported)"],
              ["supervised", "Supervised (Verified)"],
            ].map(([m, label]) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex-1 rounded-lg py-2 text-sm font-bold ${mode === m ? "bg-primary text-white" : "bg-bg text-muted"}`}
              >
                {label}
              </button>
            ))}
          </div>
          {mode === "supervised" && (
            <input
              className="mb-4 w-full rounded-lg border border-slate-300 px-3 py-2 uppercase outline-none focus:border-primary"
              placeholder="Session code from your placement officer"
              value={sessionCode}
              onChange={(e) => setSessionCode(e.target.value)}
            />
          )}

          <h2 className="mb-2 font-bold">Before you begin: assessment rules</h2>
          <ul className="mb-4 list-disc space-y-1 pl-5 text-sm text-muted">
            <li>The assessment runs in full screen. Do not leave the page.</li>
            <li>Switching tabs or windows, leaving full screen, copying, pasting or right-clicking counts as a violation.</li>
            <li>You have a maximum of <b>3 chances</b>. You get a warning for each violation, and on the 3rd your assessment ends automatically and your answers so far are submitted. Unanswered questions score zero.</li>
            <li>Timing and behaviour may be reviewed by your placement cell.</li>
            <li>Refreshing the page does not restart the test or reset your warnings.</li>
          </ul>
          <label className="mb-4 flex items-start gap-2 text-sm">
            <input type="checkbox" className="mt-1" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
            I have read and agree to these rules.
          </label>
          {error && <p className="mb-3 text-sm text-build">{error}</p>}
          <Button className="w-full" disabled={!canStart || starting} onClick={start}>
            {starting ? "Preparing your test..." : "Start assessment"}
          </Button>
        </Card>
      </Page>
    );
  }

  // ---------- test screen ----------
  const q = attempt.questions[idx];
  const total = attempt.questions.length;
  const answered = Object.keys(answers).length;
  const low = remaining <= 60;

  return (
    <div className="mx-auto max-w-3xl select-none px-6 py-6">
      {notFs && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-ink/90 p-6 text-center text-white">
          <p className="text-lg font-bold">You left full screen</p>
          <p className="max-w-md text-sm">This counted as a violation. Return to full screen to continue your test.</p>
          <Button onClick={() => document.documentElement.requestFullscreen?.().catch(() => {})}>Return to full screen</Button>
        </div>
      )}

      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm text-muted">Question {idx + 1} of {total} - answered {answered}</span>
        <span className={`rounded-lg px-3 py-1 text-sm font-bold ${low ? "bg-build-soft text-build" : "bg-bg text-ink"}`}>
          {fmt(remaining)}
        </span>
      </div>
      <div className="mb-4 h-2 rounded-full bg-slate-200">
        <div className="h-2 rounded-full bg-primary" style={{ width: `${((idx + 1) / total) * 100}%` }} />
      </div>

      <div className={`mb-4 rounded-xl border p-3 text-sm ${violations > 0 ? "border-almost bg-almost-soft text-almost" : "border-slate-200 bg-white text-muted"}`} aria-live="polite">
        <b>Violations: {violations} of {maxViolations}.</b>{banner && ` ${banner}`}
      </div>

      <Card>
        <p className="mb-1 text-xs font-bold uppercase text-brand">{skillLabel(q.skill)} - {q.difficulty}</p>
        <h2 className="mb-4 text-lg font-bold">{q.question}</h2>
        <div className="space-y-2">
          {Object.entries(q.options).map(([key, text]) => (
            <button
              key={key}
              onClick={() => setAnswers({ ...answers, [q.questionId]: key })}
              className={`flex w-full items-start gap-3 rounded-lg border px-4 py-3 text-left text-sm ${
                answers[q.questionId] === key ? "border-primary bg-cyan-50" : "border-slate-200 hover:bg-bg"
              }`}
            >
              <span className="font-bold text-primary">{key}</span>
              <span>{text}</span>
            </button>
          ))}
        </div>
      </Card>

      <nav className="my-4" aria-label="Question navigator">
        <p className="mb-2 text-xs font-semibold text-muted">Jump to a question</p>
        <div className="flex flex-wrap gap-2">
          {attempt.questions.map((question, questionIndex) => {
            const isAnswered = Boolean(answers[question.questionId]);
            const current = idx === questionIndex;
            return <button key={question.questionId} type="button" aria-current={current ? "step" : undefined} aria-label={`Question ${questionIndex + 1}${isAnswered ? ", answered" : ", unanswered"}`} onClick={() => goTo(questionIndex)} className={`h-9 w-9 rounded-lg border text-xs font-bold transition ${current ? "border-primary bg-primary text-white" : isAnswered ? "border-ready bg-ready-soft text-ready" : "border-slate-200 bg-white text-muted hover:bg-bg"}`}>{questionIndex + 1}</button>;
          })}
        </div>
      </nav>

      {error && <p className="mt-3 text-sm text-build">{error}</p>}
      <div className="mt-4 flex justify-between">
        <Button variant="secondary" disabled={idx === 0} onClick={() => goTo(idx - 1)}>Previous</Button>
        {idx < total - 1 ? (
          <Button onClick={() => goTo(idx + 1)}>Next</Button>
        ) : (
          <Button disabled={submitting} onClick={() => setShowConfirm(true)}>{submitting ? "Submitting..." : "Submit assessment"}</Button>
        )}
      </div>

      {showConfirm && <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/50 p-4" role="presentation"><section role="dialog" aria-modal="true" aria-labelledby="submit-title" aria-describedby="submit-copy" className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"><h2 id="submit-title" className="text-lg font-bold">Submit your assessment?</h2><p id="submit-copy" className="mt-2 text-sm text-muted">You answered {answered} of {total} questions. Unanswered questions score zero.</p>{error && <p className="mt-3 text-sm text-build">{error}</p>}<div className="mt-5 flex justify-end gap-2"><Button variant="secondary" disabled={submitting} onClick={() => setShowConfirm(false)}>Review answers</Button><Button disabled={submitting} onClick={submit}>{submitting ? "Submitting..." : "Submit now"}</Button></div></section></div>}

      {USE_MOCK && (
        <div className="mt-8 rounded-lg border border-dashed border-slate-300 p-3 text-xs text-muted">
          <p className="mb-2 font-bold">Test panel (mock mode only): simulate a violation</p>
          <div className="flex flex-wrap gap-2">
            {["tab_switch", "fullscreen_exit", "copy_attempt", "paste_attempt", "context_menu"].map((t) => (
              <button key={t} className="rounded bg-bg px-2 py-1 hover:bg-slate-200" onClick={() => handleViolation(t)}>{t}</button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
