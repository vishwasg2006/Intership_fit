import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api";
import useFetch from "../../hooks/useFetch";
import { formatDate } from "../../utils";
import Card from "../../components/Card";
import Chip from "../../components/Chip";
import Button from "../../components/Button";
import Page, { Loading, ErrorBox } from "../../components/Page";

export default function Home() {
  const { data, loading, error, reload } = useFetch(() => api.getHome(), []);
  const [busyId, setBusyId] = useState(null);
  const [driveErr, setDriveErr] = useState("");
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
          <p className="mt-1 text-3xl font-bold text-primary">{data.matchCount ?? 0}</p>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
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
