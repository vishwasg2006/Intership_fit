import { useState } from "react";
import Page from "../../components/Page";
import Card from "../../components/Card";
import Button from "../../components/Button";

const challenges = [
  { level: "Easy", title: "Sum an array", prompt: "Write sumArray(numbers) and return the sum of all numbers.", starter: "function sumArray(numbers) {\n  // your code\n}", test: (fn) => fn([1, 2, 3]) === 6 && fn([]) === 0 },
  { level: "Medium", title: "First non-repeating character", prompt: "Write firstUnique(text) and return the first character that appears once, or null.", starter: "function firstUnique(text) {\n  // your code\n}", test: (fn) => fn("swiss") === "w" && fn("aabb") === null },
  { level: "Hard", title: "Merge overlapping intervals", prompt: "Write mergeIntervals(intervals) and return sorted, merged [start, end] ranges.", starter: "function mergeIntervals(intervals) {\n  // your code\n}", test: (fn) => JSON.stringify(fn([[1,3],[2,6],[8,10]])) === JSON.stringify([[1,6],[8,10]]) && JSON.stringify(fn([[1,4],[4,5]])) === JSON.stringify([[1,5]]) },
];
const key = "internshipfit:coding-history";
export default function Coding() {
  const [index, setIndex] = useState(0); const [code, setCode] = useState(challenges[0].starter); const [result, setResult] = useState(""); const [history, setHistory] = useState(() => { try { return JSON.parse(localStorage.getItem(key) || "[]"); } catch { return []; } });
  const challenge = challenges[index];
  const choose = (i) => { setIndex(i); setCode(challenges[i].starter); setResult(""); };
  const run = () => { let passed = false; try { const fn = new Function(`${code}; return ${challenge.title === "Sum an array" ? "sumArray" : challenge.title === "First non-repeating character" ? "firstUnique" : "mergeIntervals"};`)(); passed = challenge.test(fn); } catch (e) { setResult(`Could not run: ${e.message}`); return; }
    const item = { level: challenge.level, title: challenge.title, passed, at: new Date().toISOString() }; const next = [item, ...history].slice(0, 50); setHistory(next); localStorage.setItem(key, JSON.stringify(next)); setResult(passed ? "All sample tests passed." : "Some sample tests failed. Review your function and try again.");
  };
  return <Page title="Coding assessment" subtitle="Write a solution and run it against sample tests."><div className="mb-4 flex gap-2">{challenges.map((c,i)=><Button key={c.level} variant={index===i?"primary":"secondary"} onClick={()=>choose(i)}>{c.level}</Button>)}</div><Card><p className="text-xs font-bold uppercase text-primary">{challenge.level}</p><h2 className="mt-1 font-bold">{challenge.title}</h2><p className="my-3 text-sm text-muted">{challenge.prompt}</p><textarea aria-label="Your code" spellCheck="false" className="min-h-64 w-full rounded-lg border border-slate-300 bg-slate-950 p-4 font-mono text-sm text-white" value={code} onChange={e=>setCode(e.target.value)} /><div className="mt-3 flex items-center gap-3"><Button onClick={run}>Run sample tests</Button>{result && <p role="status" className="text-sm text-muted">{result}</p>}</div></Card><Card className="mt-4"><h2 className="mb-3 font-bold">Coding history</h2>{history.length ? <ul className="space-y-2 text-sm">{history.map((h,i)=><li key={`${h.at}-${i}`} className="flex justify-between border-t border-slate-100 py-2"><span>{h.title} · {new Date(h.at).toLocaleString()}</span><b className={h.passed?"text-ready":"text-build"}>{h.passed?"Passed":"Try again"}</b></li>)}</ul> : <p className="text-sm text-muted">Submit a solution to start your history.</p>}</Card></Page>;
}
