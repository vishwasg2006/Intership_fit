import { useMemo, useState } from "react";
import { api } from "../../api";
import useFetch from "../../hooks/useFetch";
import Page, { ErrorBox, Loading } from "../../components/Page";
import Card from "../../components/Card";
import Button from "../../components/Button";

const builtIns = [
  { id: "sum-array", level: "Easy", title: "Sum an array", description: "Write sumArray(numbers) and return the sum of all numbers.", functionName: "sumArray", starterCode: "function sumArray(numbers) {\n  // your code\n}", tests: [{input:[[1,2,3]],expected:6},{input:[[]],expected:0}] },
  { id: "first-unique", level: "Medium", title: "First non-repeating character", description: "Write firstUnique(text) and return the first character that appears once, or null.", functionName: "firstUnique", starterCode: "function firstUnique(text) {\n  // your code\n}", tests: [{input:["swiss"],expected:"w"},{input:["aabb"],expected:null}] },
  { id: "merge-ranges", level: "Hard", title: "Merge overlapping intervals", description: "Write mergeIntervals(intervals) and return sorted, merged [start, end] ranges.", functionName: "mergeIntervals", starterCode: "function mergeIntervals(intervals) {\n  // your code\n}", tests: [{input:[[[1,3],[2,6],[8,10]]],expected:[[1,6],[8,10]]},{input:[[[1,4],[4,5]]],expected:[[1,5]]}] },
];
const historyKey = "internshipfit:coding-history";
const stable = (value) => Array.isArray(value) ? `[${value.map(stable).join(",")}]` : value && typeof value === "object" ? `{${Object.keys(value).sort().map(k=>`${JSON.stringify(k)}:${stable(value[k])}`).join(",")}}` : JSON.stringify(value);

export default function Coding() {
  const { data, loading, error, reload } = useFetch(() => api.getCodingAssessments(), []);
  const custom = data?.assessments || [];
  const all = useMemo(() => [...builtIns.map(x=>({...x,source:"built-in"})), ...custom.map(x=>({...x,id:`custom-${x.assessmentId}`,level:x.difficulty,title:x.title,tests:x.testCases,source:"placement"}))], [custom]);
  const [selectedId, setSelectedId] = useState(builtIns[0].id);
  const [code, setCode] = useState(builtIns[0].starterCode);
  const [result, setResult] = useState("");
  const [history, setHistory] = useState(() => { try { return JSON.parse(localStorage.getItem(historyKey) || "[]"); } catch { return []; } });
  const challenge = all.find(x=>x.id===selectedId) || all[0];
  const select = (item) => { setSelectedId(item.id); setCode(item.starterCode || `function ${item.functionName}(input) {\n  // your code\n}\n`); setResult(""); };
  const run = () => {
    try {
      const fn = new Function(`${code}\n; return ${challenge.functionName};`)();
      if (typeof fn !== "function") throw new Error(`Define a function named ${challenge.functionName}.`);
      const passed = (challenge.tests || []).every(t=>stable(fn(...t.input))===stable(t.expected));
      const item={title:challenge.title,level:challenge.level,passed,at:new Date().toISOString()};
      const next=[item,...history].slice(0,50); setHistory(next); localStorage.setItem(historyKey,JSON.stringify(next));
      setResult(passed?"All sample tests passed.":"Some sample tests failed. Check your function and try again.");
    } catch(e) { setResult(`Could not run: ${e.message}`); }
  };

  return <Page title="Coding assessment" subtitle="Choose a challenge, write the named JavaScript function, and run its sample tests.">
    {loading && <Loading />}{error && <ErrorBox message={error} onRetry={reload} />}
    {custom.length>0 && <Card className="mb-4"><h2 className="mb-2 font-bold">Placement coding assessments</h2><div className="flex flex-wrap gap-2">{custom.map(a=>{const id=`custom-${a.assessmentId}`;return <Button key={id} variant={selectedId===id?"primary":"secondary"} onClick={()=>select({...a,id,level:a.difficulty,title:a.title,starterCode:a.starterCode,tests:a.testCases,functionName:a.functionName})}>{a.title} · {a.difficulty}</Button>;})}</div></Card>}
    <div className="mb-4 flex flex-wrap gap-2">{builtIns.map(c=><Button key={c.id} variant={selectedId===c.id?"primary":"secondary"} onClick={()=>select(c)}>{c.level}: {c.title}</Button>)}</div>
    {challenge && <Card><div className="flex flex-wrap items-center justify-between gap-2"><p className="text-xs font-bold uppercase text-primary">{challenge.source==="placement"?"Placement assessment":"Practice"} · {challenge.level}</p>{challenge.timeLimitMinutes&&<p className="text-xs text-muted">Suggested limit: {challenge.timeLimitMinutes} minutes</p>}</div><h2 className="mt-1 font-bold">{challenge.title}</h2><p className="my-3 whitespace-pre-wrap text-sm text-muted">{challenge.description}</p><p className="mb-2 text-xs text-muted">Implement <code>{challenge.functionName}(...args)</code>. Sample cases are visible to students.</p><textarea aria-label="Your code" spellCheck="false" className="min-h-64 w-full rounded-lg border border-slate-300 bg-slate-950 p-4 font-mono text-sm text-white" value={code} onChange={e=>setCode(e.target.value)} /><div className="mt-3 flex flex-wrap items-center gap-3"><Button onClick={run}>Run sample tests</Button>{result&&<p role="status" className="text-sm text-muted">{result}</p>}</div></Card>}
    <Card className="mt-4"><h2 className="mb-3 font-bold">Coding history (this browser)</h2>{history.length?<ul className="space-y-2 text-sm">{history.map((h,i)=><li key={`${h.at}-${i}`} className="flex justify-between border-t border-slate-100 py-2"><span>{h.title} · {new Date(h.at).toLocaleString()}</span><b className={h.passed?"text-ready":"text-build"}>{h.passed?"Passed":"Try again"}</b></li>)}</ul>:<p className="text-sm text-muted">Run a solution to start your history.</p>}</Card>
  </Page>;
}
