import { useEffect, useState } from "react";
import { api } from "../../api";
import useFetch from "../../hooks/useFetch";
import { formatDate } from "../../utils";
import Button from "../Button";
import Chip, { Badge } from "../Chip";
import ScoreBar from "../ScoreBar";
import { Loading, ErrorBox } from "../Page";

export default function StudentDrawer({ studentId, onClose }) {
  const { data, loading, error, reload } = useFetch(() => api.getStudent(studentId), [studentId]);
  const [short, setShort] = useState(null);
  const [busy, setBusy] = useState(false);
  const [shortlistError, setShortlistError] = useState("");
  const [reviewing, setReviewing] = useState(null);
  const [reviewMessage, setReviewMessage] = useState("");

  useEffect(() => {
    const onKey = (event) => { if (event.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const isShort = short === null ? data?.shortlisted : short;
  const toggle = async () => {
    setBusy(true);
    setShortlistError("");
    try {
      await api.shortlist({ studentId, shortlisted: !isShort });
      setShort(!isShort);
    } catch (error) {
      setShortlistError(error.message || "Could not update the shortlist.");
    } finally {
      setBusy(false);
    }
  };
  const review = async (attemptId) => { setReviewing(attemptId); setReviewMessage(""); try { await api.resolveReview(attemptId); setReviewMessage("Manual review recorded."); reload(); } catch (e) { setReviewMessage(e.message); } finally { setReviewing(null); } };

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-ink/40" onClick={onClose} role="presentation">
      <aside className="h-full w-full max-w-md overflow-y-auto bg-surface p-6 shadow-xl" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="student-drawer-title" tabIndex={-1}>
        <button className="mb-4 text-sm text-muted underline" onClick={onClose} aria-label="Close student details">Close</button>
        {loading && <Loading />}
        {error && <ErrorBox message={error} onRetry={reload} />}
        {data && (
          <>
            <h2 id="student-drawer-title" className="text-xl font-bold">{data.name}</h2>
            <p className="mb-3 text-sm text-muted">{data.branch} - Year {data.year} - CGPA {data.cgpa}</p>
            <div className="mb-4 flex items-center gap-3">
              <span className="text-3xl font-bold text-brand">{data.overall}%</span>
              <Chip status={data.readiness} />
            </div>

            <h3 className="mb-2 font-bold">Skill scores</h3>
            {data.skillScores.map((s) => <ScoreBar key={s.skill} label={s.skill} value={s.score} />)}

            <h3 className="mb-2 mt-5 font-bold">Top matches</h3>
            <ul className="space-y-2 text-sm">
              {data.topMatches.map((m) => (
                <li key={m.internshipId} className="flex items-center justify-between rounded-lg bg-bg px-3 py-2">
                  <span>{m.title} - {m.company}</span>
                  <span className="flex items-center gap-2"><b>{m.matchScore}%</b><Chip status={m.readiness} /></span>
                </li>
              ))}
            </ul>

            <h3 className="mb-2 mt-5 font-bold">Assessment attempts</h3>
            <ul className="space-y-2 text-sm">
              {data.attempts.map((a) => (
                <li key={a.attemptId} className="rounded-lg border border-slate-200 p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <b>{a.overall}%</b>
                    <Badge tone={a.mode === "supervised" ? "green" : "gray"}>{a.mode}</Badge>
                    <Badge tone={a.status === "terminated" ? "red" : "gray"}>{a.status}</Badge>
                    {a.integrityStatus === "review" && <Badge tone="amber">Review</Badge>}
                  </div>
                  <p className="mt-1 text-xs text-muted">
                    {formatDate(a.takenAt)} - violations: {a.violationsUsed}
                  </p>
                  {a.integrityReasons?.length > 0 && (
                    <p className="mt-1 text-xs text-almost">Flags: {a.integrityReasons.join(", ")}</p>
                  )}
                  {a.integrityStatus === "review" && <Button className="mt-2" variant="secondary" loading={reviewing === a.attemptId} onClick={() => review(a.attemptId)}>Mark review complete</Button>}
                </li>
              ))}
            </ul>
            {reviewMessage && <p className="mt-2 text-sm text-muted" role="status">{reviewMessage}</p>}

            {shortlistError && <p className="mt-4 text-sm text-build" role="alert">{shortlistError}</p>}
            <Button className="mt-6 w-full" variant={isShort ? "secondary" : "primary"} loading={busy} onClick={toggle}>
              {isShort ? "Remove from shortlist" : "Shortlist student"}
            </Button>
          </>
        )}
      </aside>
    </div>
  );
}
