import { Link } from "react-router-dom";
import { api } from "../../api";
import useFetch from "../../hooks/useFetch";
import Card from "../../components/Card";
import Button from "../../components/Button";
import ScoreBar from "../../components/ScoreBar";
import Page, { Loading, ErrorBox } from "../../components/Page";
import { skillLabel } from "../../utils";

export default function Gaps() {
  const { data, loading, error, reload } = useFetch(() => api.getGaps(), []);
  if (loading) return <Loading />;
  if (error) return <Page title="Gap report"><ErrorBox message={error} onRetry={reload} /></Page>;

  const gaps = data.gaps || [];
  return (
    <Page title="Your skill-gap report" subtitle="The skills to improve first, with free resources.">
      {gaps.length === 0 && (
        <Card><p className="text-muted">No gaps found. Retake the assessment and apply to your matches.</p></Card>
      )}
      <div className="space-y-4">
        {gaps.map((g) => (
          <Card key={g.skill}>
            <ScoreBar label={g.skill} value={g.score} target={g.target} />
            <p className="mb-2 text-sm text-muted">
              Gap: <b className="text-ink">{g.gap} points</b> - about <b className="text-ink">{g.estimatedHours} hours</b> of practice
            </p>
            <ul className="space-y-1 text-sm">
              {g.resources?.map((r) => (
                <li key={r.url}>
                  <a className="font-medium text-blue-600 underline hover:text-blue-800" href={r.url} target="_blank" rel="noreferrer">🔗 {r.title}</a>
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>

      {data.roadmap?.length > 0 && (
        <>
          <h2 className="mb-3 mt-8 text-lg font-bold">Your roadmap</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {data.roadmap.map((w) => (
              <Card key={w.week}>
                <p className="text-xs font-bold uppercase text-brand">Week {w.week}</p>
                <p className="mb-2 font-bold">{w.focus}</p>
                <ul className="list-disc space-y-1 pl-4 text-sm text-muted">
                  {w.tasks.map((t, i) => <li key={i}>{t}</li>)}
                </ul>
              </Card>
            ))}
          </div>
        </>
      )}
      <div className="mt-6"><Link to="/matches"><Button>See my internship matches</Button></Link></div>
    </Page>
  );
}
