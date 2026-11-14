import { pool } from "../src/db.js";
const base = process.env.API_BASE || "http://localhost:5000";
let failed = false;
const step = async (name, fn) => { try { await fn(); console.log(`PASS ${name}`); } catch (e) { failed = true; console.log(`FAIL ${name}: ${e.message}`); } };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const call = async (path, token, init = {}) => {
  const r = await fetch(`${base}${path}`, { ...init, headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(init.headers || {}) } });
  const data = await r.json().catch(() => ({}));
  return { status: r.status, data };
};
const ok = async (path, token, init) => { const r = await call(path, token, init); if (r.status >= 400) throw new Error(`${r.status} ${r.data?.error?.message || "Request failed"}`); return r.data; };
const expectStatus = async (path, token, init, status) => { const r = await call(path, token, init); if (r.status !== status) throw new Error(`expected ${status}, got ${r.status}`); return r.data; };
const post = (body) => ({ method: "POST", body: JSON.stringify(body) });
const assert = (cond, msg) => { if (!cond) throw new Error(msg); };

let studentToken, placementToken, newToken, attempt, sessionCode, driveId;
const stamp = Date.now();

await step("API health", async () => assert((await ok("/api/health")).status === "ok", "Health status was not ok"));
await step("student demo login", async () => { const d = await ok("/api/auth/login", null, post({ email: "medium@demo.test", password: "Demo@123" })); studentToken = d.token; assert(d.user.role === "student" && typeof d.user.id === "number", "Expected student role and numeric id"); });
await step("email without password cannot log in", async () => { await expectStatus("/api/auth/login", null, post({ email: "medium@demo.test" }), 401); });
await step("student score history", async () => { const d = await ok("/api/students/me/scores", studentToken); assert(Array.isArray(d.history) && d.latest, "Score response missing latest/history"); });
await step("student gaps and resources", async () => { const d = await ok("/api/students/me/gaps", studentToken); assert(Array.isArray(d.gaps) && Array.isArray(d.roadmap), "Invalid gap report"); });
await step("explainable internship matches", async () => { const d = await ok("/api/students/me/matches", studentToken); assert(Array.isArray(d.matches) && d.matches.length <= 3 && d.matches.every((m) => m.whyFits), "Invalid matches response"); });
await step("student home and drives", async () => { const h = await ok("/api/students/me/home", studentToken); assert(Array.isArray(h.upcomingDrives), "Invalid home"); const d = await ok("/api/drives", studentToken); assert(Array.isArray(d.drives), "Drives must be {drives:[]}"); });
await step("placement demo login", async () => { const d = await ok("/api/auth/login", null, post({ email: "placement@demo.test", password: "Demo@123" })); placementToken = d.token; assert(d.user.role === "placement", "Expected placement role"); });
await step("placement cohort, ranking and review flags", async () => {
  const d = await ok("/api/placement/cohort", placementToken);
  assert(Array.isArray(d.students) && Number.isInteger(d.summary.reviewCount), "Invalid cohort response");
  const types = d.students.map((s) => s.scoreType); const firstSelf = types.indexOf("self_reported");
  assert(firstSelf === -1 || !types.slice(firstSelf).includes("verified"), "Verified scores must rank before self-reported");
  assert(typeof d.students[0].studentId === "number", "studentId should be a number");
});
await step("supervised sessions", async () => { const d = await ok("/api/placement/sessions", placementToken); assert(Array.isArray(d.sessions), "Invalid sessions response"); });
await step("placement coding assessment create/list/close", async () => {
  const created = await ok("/api/placement/coding-assessments", placementToken, post({ title: `Coding Smoke ${stamp}`, description: "Return the input number.", difficulty: "easy", functionName: "solve", starterCode: "function solve(n) { return n; }", testCases: [{ input: [5], expected: 5 }], timeLimitMinutes: 15 }));
  const id = created.assessment.assessmentId;
  assert(created.assessment.status === "active" && created.assessment.testCases.length === 1, "Coding assessment was not saved");
  const studentList = await ok("/api/coding-assessments", studentToken); assert(studentList.assessments.some(a => a.assessmentId === id), "Student cannot see published coding assessment");
  await ok(`/api/placement/coding-assessments/${id}/close`, placementToken, { method: "POST" });
  const afterClose = await ok("/api/coding-assessments", studentToken); assert(!afterClose.assessments.some(a => a.assessmentId === id), "Closed assessment should no longer be visible to students");
  await expectStatus("/api/placement/coding-assessments", studentToken, {}, 403);
});
await step("student cannot open placement routes (403)", async () => expectStatus("/api/placement/cohort", studentToken, {}, 403));
await step("no token is rejected (401)", async () => expectStatus("/api/students/me/home", null, {}, 401));
await step("placement signup needs invite code (403)", async () => expectStatus("/api/auth/signup", null, post({ name: "X", email: `p${stamp}@t.test`, password: "Passw0rd!", role: "placement", inviteCode: "wrong" }), 403));
await step("weak password and bad email rejected (400)", async () => { await expectStatus("/api/auth/signup", null, post({ name: "X", email: `q${stamp}@t.test`, password: "short", role: "student" }), 400); await expectStatus("/api/auth/signup", null, post({ name: "X", email: "nope", password: "Passw0rd!", role: "student" }), 400); });
await step("new student signup + profile validation", async () => {
  const email = `smoke${stamp}@t.test`;
  const d = await ok("/api/auth/signup", null, post({ name: "Smoke Tester", email, password: "Passw0rd!", role: "student" }));
  assert(d.verificationRequired && !d.token, "Student signup must require email verification and not return a token");
  await expectStatus("/api/auth/login", null, post({ email, password: "Passw0rd!" }), 403);
  await expectStatus("/api/auth/verify-email", null, post({ email, code: "000000" }), 400);
  await pool.query("UPDATE users SET email_verified=true WHERE email=$1", [email]); // stands in for reading the emailed code
  newToken = (await ok("/api/auth/login", null, post({ email, password: "Passw0rd!" }))).token;
  await expectStatus("/api/students/me/profile", newToken, { method: "PUT", body: JSON.stringify({ college: "X", branch: "CSE", year: 3 }) }, 400);
  const p = await ok("/api/students/me/profile", newToken, { method: "PUT", body: JSON.stringify({ college: "Smoke College", branch: "CSE", year: 3, cgpa: 8, consentShare: true }) });
  assert(p.profile.consentShare === true, "Profile not saved");
});
await step("practice assessment: questions -> violation -> submit", async () => {
  attempt = await ok("/api/assessment/questions?perSkill=2&mode=practice", newToken);
  assert(attempt.questions.length === 8 && attempt.status === "in_progress", "Expected 8 questions");
  assert(!JSON.stringify(attempt).includes("correct"), "Answers must not be leaked to the client");
  const again = await ok("/api/assessment/questions?perSkill=2&mode=practice", newToken);
  assert(again.attemptId === attempt.attemptId && again.resumed, "Second start must resume the same attempt");
  const v = await ok("/api/assessment/violation", newToken, post({ attemptId: attempt.attemptId, type: "tab_switch" }));
  assert(v.violationsUsed === 1 && !v.terminated, "Violation not counted");
  const answers = attempt.questions.map((q) => ({ questionId: q.questionId, selected: "A" }));
  const res = await ok("/api/assessment/submit", newToken, post({ attemptId: attempt.attemptId, answers, perQuestionSeconds: answers.map((a) => ({ questionId: a.questionId, seconds: 8 })) }));
  assert(Number.isInteger(res.overall) && res.skillScores.length === 4, "Invalid submit result");
  const again2 = await ok("/api/assessment/submit", newToken, post({ attemptId: attempt.attemptId, answers: [] }));
  assert(again2.overall === res.overall, "Re-submit must return the stored result");
  await expectStatus("/api/assessment/violation", newToken, post({ attemptId: attempt.attemptId, type: "tab_switch" }), 409);
});
await step("3 violations terminate the attempt", async () => {
  const a = await ok("/api/assessment/questions?perSkill=1&mode=practice", newToken);
  let last;
  for (let i = 0; i < 3; i++) { if (i) await sleep(2200); last = await ok("/api/assessment/violation", newToken, post({ attemptId: a.attemptId, type: "fullscreen_exit" })); }
  assert(last.terminated && last.result && Number.isInteger(last.result.overall), "Attempt should be terminated with a result");
});
await step("supervised session: create, take, close", async () => {
  const s = await ok("/api/placement/sessions", placementToken, post({ title: `Smoke ${stamp}`, perSkill: 1, timeLimitMinutes: 10 }));
  sessionCode = s.session.code; assert(/^[A-Z0-9]{6}$/.test(sessionCode), "Bad session code");
  await expectStatus("/api/placement/sessions", placementToken, post({ title: "Too big", perSkill: 99, timeLimitMinutes: 10 }), 400);
  await expectStatus("/api/assessment/questions?mode=supervised&sessionCode=ZZZZZZ", newToken, {}, 403);
  const a = await ok(`/api/assessment/questions?mode=supervised&sessionCode=${sessionCode}`, newToken);
  assert(a.mode === "supervised" && a.questions.length === 4, "Supervised attempt should have 4 questions");
  const r = await ok("/api/assessment/submit", newToken, post({ attemptId: a.attemptId, answers: [], perQuestionSeconds: [] }));
  assert(r.mode === "supervised", "Wrong mode");
  await ok(`/api/placement/sessions/${s.session.sessionId}/close`, placementToken, { method: "POST" });
  await expectStatus(`/api/assessment/questions?mode=supervised&sessionCode=${sessionCode}`, newToken, {}, 403);
});
await step("placement shortlist + student detail", async () => {
  const c = await ok("/api/placement/cohort", placementToken); const me = c.students.find((s) => s.name === "Smoke Tester");
  assert(me, "New consenting student should be in the cohort");
  const sl = await ok("/api/placement/shortlist", placementToken, post({ studentId: me.studentId, shortlisted: true })); assert(sl.shortlisted === true, "Shortlist failed");
  const d = await ok(`/api/placement/students/${me.studentId}`, placementToken); assert(d.shortlisted && Array.isArray(d.attempts), "Invalid student detail");
});
await step("drives: validation, create, respond, count", async () => {
  await expectStatus("/api/placement/drives", placementToken, post({ company: "A", role: "B", date: "2030-01-10", deadline: "2030-01-20" }), 400);
  const date = new Date(Date.now() + 20 * 864e5).toISOString().slice(0, 10), deadline = new Date(Date.now() + 15 * 864e5).toISOString().slice(0, 10);
  const d = await ok("/api/placement/drives", placementToken, post({ company: `SmokeCo ${stamp}`, role: "Intern", date, deadline, minCgpa: 0, minScore: 0, branches: [] })); driveId = d.drive.driveId;
  const r = await ok(`/api/drives/${driveId}/respond`, newToken, post({ interested: true })); assert(r.responded, "Respond failed");
  const list = await ok("/api/placement/drives", placementToken); assert(list.drives.find((x) => x.driveId === driveId)?.responses === 1, "Responses should be 1");
});
await step("deleted account token is rejected cleanly", async () => {
  const uid = (await pool.query("SELECT id FROM users WHERE email=$1", [`smoke${stamp}@t.test`])).rows[0].id;
  for (const t of ["drive_responses", "shortlists", "attempts"]) await pool.query(`DELETE FROM ${t} WHERE ${t === "shortlists" ? "student_id" : "user_id"}=$1`, [uid]);
  await pool.query("DELETE FROM users WHERE id=$1", [uid]);
  await expectStatus("/api/students/me/home", newToken, {}, 401);
});
await pool.end();
if (failed) process.exitCode = 1;
else console.log("\nAll smoke checks passed.");
