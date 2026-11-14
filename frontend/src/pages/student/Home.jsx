import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api";
import useFetch from "../../hooks/useFetch";
import { formatDate } from "../../utils";
import Card from "../../components/Card";
import Chip from "../../components/Chip";
import Button from "../../components/Button";
import Page, { Loading, ErrorBox } from "../../components/Page";

const MAX_RESUME_BYTES = 4 * 1024 * 1024;

export default function Home() {
  const { data, loading, error, reload } = useFetch(() => api.getHome(), []);
  const [busyId, setBusyId] = useState(null);
  const [driveErr, setDriveErr] = useState("");
  const [resumeBusy, setResumeBusy] = useState(false);
  const [resumeMessage, setResumeMessage] = useState("");
  const uploadResume = async (event) => {
    const file = event.target.files?.[0]; if (!file) return;
    if (!/\.(pdf|doc|docx)$/i.test(file.name)) { setResumeMessage("Choose a PDF or Word document."); event.target.value = ""; return; }
    if (file.size > MAX_RESUME_BYTES) { setResumeMessage("This file is too large. Choose a resume that is 4 MB or smaller."); event.target.value = ""; return; }
    setResumeBusy(true); setResumeMessage("");
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      let binary = ""; for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
      const result = await api.uploadResume({ fileName: file.name, contentType: file.type, data: btoa(binary) });
      setResumeMessage(`Resume saved. Skills found: ${result.skills.length ? result.skills.join(", ") : "none detected yet"}.`);
    } catch (e) { setResumeMessage(e.message || "Could not save resume."); }
    finally { setResumeBusy(false); event.target.value = ""; }
  };
  const respond = async (d) => {
    setBusyId(d.driveId); setDriveErr("");
    try { await api.respondDrive(d.driveId, !d.responded); reload(); } catch (e) { setDriveErr(e.message); } finally { setBusyId(null); }
  };
  if (loading) return <Loading />;
  if (error) return <Page title="Home"><ErrorBox message={error} onRetry={reload} /></Page>;

  const tested = data.latestOverall !== null && data.latestOverall !== undefined;
  return (
    <Page
      title={`Hi, ${data.name}!`}
      subtitle="Here is where you stand today."
      right={<Link to="/assessment"><Button>{tested ? "Retake assessment" : "Take assessment"}</Button></Link>}
    >
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-sm text-muted">Latest score</p>
          <p className="mt-1 text-3xl font-bold text-brand">{tested ? `${data.latestOverall}%` : "-"}</p>
        </Card>
        <Card>
          <p className="text-sm text-muted">Readiness</p>
          <div className="mt-2">{tested ? <Chip status={data.readiness} /> : <span className="text-muted">Not tested yet</span>}</div>
        </Card>
        <Card>
          <p className="text-sm text-muted">Internship matches</p>
          {tested && data.matchCount > 0
            ? <p className="mt-1 text-3xl font-bold text-primary">{data.matchCount}</p>
            : <><p className="mt-1 text-3xl font-bold text-muted">{tested ? "0" : "-"}</p><p className="mt-1 text-xs text-muted">{tested ? "No matches yet. Improve your skill scores to unlock internships." : "Take the assessment to see matches."}</p></>}
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <h2 className="mb-2 font-bold">Resume and skills</h2>
          <p className="mb-3 text-sm text-muted">Upload a PDF or Word resume to extract skills for future recommendations.</p>
          <label className="inline-flex cursor-pointer items-center rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white">{resumeBusy ? "Reading resume…" : "Upload resume"}<input aria-label="Upload resume" className="sr-only" type="file" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" disabled={resumeBusy} onChange={uploadResume} /></label>
          {resumeMessage && <p className="mt-3 text-sm text-muted" role="status">{resumeMessage}</p>}
        </Card>
        <Card>
          <h2 className="mb-2 font-bold">Your next step</h2>
          {tested ? (
            <>
              <p className="mb-3 text-sm text-muted">See which skills to improve first, with free resources.</p>
              <Link to="/gaps"><Button variant="secondary">Open gap report</Button></Link>
            </>
          ) : (
            <>
              <p className="mb-3 text-sm text-muted">Take the skill assessment to get your scores, gap report and matches.</p>
              <Link to="/assessment"><Button>Start now</Button></Link>
            </>
          )}
        </Card>
        <Card>
          <h2 className="mb-2 font-bold">Upcoming campus drives</h2>
          {data.upcomingDrives?.length ? (
            <ul className="space-y-2 text-sm">
              {data.upcomingDrives.map((d) => (
                <li key={d.driveId} className="flex items-center justify-between gap-2">
                  <span>{d.company} - {d.role}<span className="block text-xs text-muted">{formatDate(d.date)}</span></span>
                  {d.eligible === false
                    ? <span className="text-xs text-muted">Not eligible</span>
                    : <Button variant={d.responded ? "ghost" : undefined} disabled={busyId === d.driveId} onClick={() => respond(d)}>{d.responded ? "Interested ✓" : "I'm interested"}</Button>}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">No upcoming drives.</p>
          )}
          {driveErr && <p className="mt-2 text-sm text-build">{driveErr}</p>}
        </Card>
      </div>
      {tested && <Card className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div><p className="text-sm font-bold">Your progress, at a glance</p><p className="mt-1 text-sm text-muted">{data.latestOverall >= 80 ? "You have reached ready-now territory. Keep your skills fresh." : data.latestOverall >= 55 ? "You are building momentum. Focus on your largest skill gap next." : "Every practice session gives you a clearer next step."}</p></div>
        <Link to="/results"><Button variant="ghost">View progress</Button></Link>
      </Card>}
    </Page>
  );
}
