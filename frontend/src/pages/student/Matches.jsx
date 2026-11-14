import { api } from "../../api";
import useFetch from "../../hooks/useFetch";
import { formatDate, formatStipend, skillLabel } from "../../utils";
import Card from "../../components/Card";
import Chip, { Badge } from "../../components/Chip";
import ScoreRing from "../../components/ScoreRing";
import Page, { Loading, ErrorBox } from "../../components/Page";

function MatchCard({ m }) {
  return (
    <Card>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold">{m.title}</h2>
          <p className="text-muted">{m.company}</p>
          <p className="mt-1 text-sm text-muted">
            {m.location} - {m.mode} - {formatStipend(m.stipendInrMonth)} - Apply by {formatDate(m.deadline)}
          </p>
        </div>
        <ScoreRing value={m.matchScore} />
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <Chip status={m.readiness} />
        {m.eligibility.eligible ? <Badge tone="green">Eligible</Badge> : <Badge tone="red">Not eligible</Badge>}
      </div>
      {!m.eligibility.eligible && (
        <ul className="mt-2 list-disc pl-5 text-sm text-build">
          {m.eligibility.reasons.map((r, i) => <li key={i}>{r}</li>)}
        </ul>
      )}

      <p className="mt-3 text-sm"><b>Why it fits:</b> {m.whyFits}</p>
      <div className="mt-2 text-sm">
        <b>What's missing:</b>{" "}
        {m.missingSkills.length === 0 ? (
          <span className="text-ready">Nothing, you meet every skill requirement.</span>
        ) : (
          <ul className="mt-1 list-disc pl-5 text-muted">
            {m.missingSkills.map((s) => (
              <li key={s.skill}>{skillLabel(s.skill)}: you have {s.have}%, role needs {s.need}%</li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <span className="text-xs text-muted">
          Source: <a className="underline" href={m.applyUrl} target="_blank" rel="noreferrer">{m.source}</a>
        </span>
        <a
          href={m.applyUrl} target="_blank" rel="noreferrer"
          className="rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-white hover:opacity-90"
        >
          Apply
        </a>
      </div>
    </Card>
  );
}

export default function Matches() {
  const { data, loading, error, reload } = useFetch(() => api.getMatches(), []);
  if (loading) return <Loading />;
  if (error) return <Page title="Matches"><ErrorBox message={error} onRetry={reload} /></Page>;
  return (
    <Page title="Your top internship matches" subtitle="Every match explains why it fits and what is missing.">
<<<<<<< HEAD
      {data.matches.length === 0 && <Card><p className="text-muted">No matches yet. Take the assessment, or raise your skill scores, to get internship matches.</p></Card>}
=======
      {data.matches.length === 0 && <Card><p className="text-muted">Take the assessment to get matches.</p></Card>}
>>>>>>> 63ceeb9ba9da1e14cfe0a1b454d0f7c314c52a69
      <div className="space-y-4">{data.matches.map((m) => <MatchCard key={m.internshipId} m={m} />)}</div>
    </Page>
  );
}
