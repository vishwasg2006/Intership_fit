import { Link, useLocation } from "react-router-dom";
import { api } from "../../api";
import useFetch from "../../hooks/useFetch";
import { formatDate, skillLabel } from "../../utils";
import Card from "../../components/Card";
import Chip, { Badge } from "../../components/Chip";
import Button from "../../components/Button";
import ScoreBar from "../../components/ScoreBar";
import ScoreRing from "../../components/ScoreRing";
import Page, { Loading, ErrorBox } from "../../components/Page";

const readinessOf = (n) => (n >= 80 ? "ready_now" : n >= 55 ? "almost_there" : "build_first");

export default function Results() {
  const { state } = useLocation();
  const { data, loading, error, reload } = useFetch(() => api.getScores(), []);
  if (loading) return <Loading />;
  if (error) return <Page title="Results"><ErrorBox message={error} onRetry={reload} /></Page>;
  if (!data?.latest)
    return (
      <Page title="Results">
        <Card>
          <p className="mb-3 text-muted">You have not taken the assessment yet.</p>
          <Link to="/assessment"><Button>Take assessment</Button></Link>
        </Card>
      </Page>
    );

  const { latest, history = [] } = data;
  const first = history.length > 1 ? history[0] : null;
  const before = (skill) => first?.skillScores.find((s) => s.skill === skill)?.score;

  return (
    <Page title="Your results" subtitle={`Taken on ${formatDate(latest.takenAt)}`}>
      {(state?.terminated || latest.status === "terminated") && (
        <div className="mb-4 rounded-xl border border-build bg-build-soft p-4 text-sm text-build">
          Your last assessment was ended automatically because all 3 chances were used. Unanswered questions count as zero.
        </div>
      )}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="text-center">
          <p className="text-sm text-muted">Overall score</p>
          <div className="my-3 flex justify-center"><ScoreRing value={latest.overall} size={96} /></div>
          <Chip status={readinessOf(latest.overall)} />
          <div className="mt-3">
            <Badge tone={latest.mode === "supervised" && latest.status !== "terminated" ? "green" : "gray"}>
              {latest.mode === "supervised" && latest.status !== "terminated" ? "Verified" : "Self-reported"}
            </Badge>
          </div>
          <p className="mt-3 text-sm text-muted">{latest.overall >= 80 ? "You are ready to apply to matching roles." : latest.overall >= 55 ? "You are close. A focused plan can help you move up." : "Build your foundations, then check your progress again."}</p>
        </Card>
        <Card className="md:col-span-2">
          <h2 className="mb-3 font-bold">Skill scores</h2>
          {latest.skillScores.map((s) => (
            <ScoreBar key={s.skill} label={s.skill} value={s.score} />
          ))}
        </Card>
      </div>

      {first && (
        <Card className="mt-4">
          <h2 className="mb-3 font-bold">Your progress (first test vs latest)</h2>
          <table className="w-full text-sm">
            <thead className="text-left text-muted">
              <tr><th className="py-1">Skill</th><th>Before</th><th>Now</th><th>Change</th></tr>
            </thead>
            <tbody>
              {latest.skillScores.map((s) => {
                const b = before(s.skill);
                const diff = b === undefined ? null : s.score - b;
                return (
                  <tr key={s.skill} className="border-t border-slate-100">
                    <td className="py-2">{skillLabel(s.skill)}</td>
                    <td>{b ?? "-"}%</td>
                    <td>{s.score}%</td>
                    <td className={diff > 0 ? "font-bold text-ready" : diff < 0 ? "font-bold text-build" : "text-muted"}>
                      {diff === null ? "-" : diff > 0 ? `+${diff}` : diff}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}

      <div className="mt-6 flex gap-3">
        <Link to="/gaps"><Button>View gap report</Button></Link>
        <Link to="/matches"><Button variant="secondary">See my matches</Button></Link>
      </div>
    </Page>
  );
}
