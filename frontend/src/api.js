// Every backend call lives here. Pages never call fetch directly.
const BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";
export const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";

const mocks = import.meta.glob("./mock/*.json", { eager: true, import: "default" });

export const getToken = () => localStorage.getItem("token");
export const getUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
};
export const setSession = ({ token, user }) => {
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(user));
};
export const clearSession = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
};

// ---- mock-only behaviour (used when VITE_USE_MOCK=true) ----
const ACTIVE_ATTEMPT_KEY = "internshipfit:mock:active-attempt";
const TERMINATED_SCORE_KEY = "internshipfit:mock:terminated-score";
const readStored = (key) => { try { return JSON.parse(localStorage.getItem(key) || "null"); } catch { return null; } };
const shuffled = (items) => { const copy = [...items]; for (let i = copy.length - 1; i > 0; i -= 1) { const j = Math.floor(Math.random() * (i + 1)); [copy[i], copy[j]] = [copy[j], copy[i]]; } return copy; };
const mockHandlers = {
  forgotPassword: () => ({ message: "If an account exists for that email, a reset link has been sent." }),
  resetPassword: () => ({ message: "Password reset is available when the API server is configured." }),
  resume: (b) => ({ fileName: b.fileName, skills: [] }),
  review: (b) => ({ attemptId: b.attemptId, reviewed: true }),
  login: (b) => {
    const role = (b?.email || "").startsWith("placement") ? "placement" : "student";
    return {
      token: "mock-token",
      user: { id: 1, name: role === "placement" ? "Placement Officer" : "Ananya", email: b?.email || "", role },
    };
  },
  verifyEmail: (b) => ({ token: "mock-token", user: { id: 2, name: "Student", email: b.email, role: "student" } }),
  resendCode: () => ({ message: "A new code has been sent." }),
  signup: (b) => ({
    token: "mock-token",
    user: { id: 2, name: b.name, email: b.email, role: b.role || "student" },
  }),
  questions: (_body, path) => {
    const saved = readStored(ACTIVE_ATTEMPT_KEY);
    if (saved) return { ...saved.questions, resumed: true, violationsUsed: saved.violationsUsed || 0 };
    const d = structuredClone(mocks["./mock/questions.json"]);
    d.startedAt = new Date().toISOString();
    const params = new URLSearchParams(path.split("?")[1] || "");
    d.mode = params.get("mode") || "practice";
    d.questions = shuffled(d.questions).map((q) => {
      const entries = shuffled(Object.values(q.options));
      return { ...q, options: Object.fromEntries(entries.map((value, i) => ["ABCD"[i], value])) };
    });
    localStorage.setItem(ACTIVE_ATTEMPT_KEY, JSON.stringify({ questions: d, violationsUsed: 0 }));
    return d;
  },
  violation: (b) => {
    const saved = readStored(ACTIVE_ATTEMPT_KEY) || { questions: { attemptId: b.attemptId }, violationsUsed: 0 };
    if (saved.lastViolationAt && Date.now() - saved.lastViolationAt < 2000) {
      return { attemptId: b.attemptId, violationsUsed: saved.violationsUsed || 0, violationsLeft: Math.max(0, 3 - (saved.violationsUsed || 0)), terminated: false, message: `Warning ${saved.violationsUsed || 0} of 3: leaving the test is not allowed.`, result: null };
    }
    const n = (saved.violationsUsed || 0) + 1;
    saved.violationsUsed = n;
    saved.lastViolationAt = Date.now();
    const terminated = n >= 3;
    if (terminated) saved.questions.status = "terminated";
    localStorage.setItem(ACTIVE_ATTEMPT_KEY, JSON.stringify(saved));
    const result = terminated
      ? { overall: 40, skillScores: [{ skill: "programming", score: 40 }], takenAt: new Date().toISOString() }
      : null;
    if (terminated) localStorage.setItem(TERMINATED_SCORE_KEY, JSON.stringify({ attemptId: b.attemptId, mode: saved.questions.mode || "practice", status: "terminated", violationsUsed: n, ...result }));
    return {
      attemptId: b.attemptId,
      violationsUsed: n,
      violationsLeft: Math.max(0, 3 - n),
      terminated,
      message: terminated
        ? "Assessment ended: you used all 3 chances."
        : `Warning ${n} of 3: leaving the test is not allowed.`,
      result,
    };
  },
  submit: () => {
    localStorage.removeItem(ACTIVE_ATTEMPT_KEY);
    return structuredClone(mocks["./mock/submit.json"]);
  },
  scores: () => {
    const terminated = readStored(TERMINATED_SCORE_KEY);
    const scores = structuredClone(mocks["./mock/scores.json"]);
    if (!terminated) return scores;
    scores.latest = terminated;
    scores.history = [...(scores.history || []).filter((x) => x.attemptId !== terminated.attemptId), terminated];
    return scores;
  },
};

async function request(method, path, body, mock) {
  if (USE_MOCK && mock) {
    await new Promise((r) => setTimeout(r, 200));
    if (mockHandlers[mock]) return mockHandlers[mock](body, path);
    const data = mocks[`./mock/${mock}.json`];
    if (!data) throw new Error(`Missing mock file: ${mock}.json`);
    return structuredClone(data);
  }
  let res;
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error("Cannot reach the server. Check your connection and the API address.");
  }
  const data = await res.json().catch(() => ({}));
  if (res.status === 401 && getToken()) {
    clearSession();
    window.location.href = "/login";
  }
  if (!res.ok) { const e = new Error(data?.error?.message || "Something went wrong"); e.code = data?.error?.code; throw e; }
  return data;
}

const qs = (obj = {}) => {
  const p = new URLSearchParams();
  Object.entries(obj).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") p.append(k, v);
  });
  const s = p.toString();
  return s ? `?${s}` : "";
};

export const api = {
  // auth + profile
  login: (b) => request("POST", "/api/auth/login", b, "login"),
  signup: (b) => request("POST", "/api/auth/signup", b, "signup"),
  verifyEmail: (b) => request("POST", "/api/auth/verify-email", b, "verifyEmail"),
  resendCode: (email) => request("POST", "/api/auth/resend-code", { email }, "resendCode"),
  requestPasswordReset: (email) => request("POST", "/api/auth/forgot-password", { email }, "forgotPassword"),
  resetPassword: (token, password) => request("POST", "/api/auth/reset-password", { token, password }, "resetPassword"),
  uploadResume: (b) => request("PUT", "/api/students/me/resume", b, "resume"),
  resolveReview: (attemptId) => request("POST", "/api/placement/attempts/review", { attemptId }, "review"),
  saveProfile: (b) => request("PUT", "/api/students/me/profile", b, "profile"),
  // assessment
  getQuestions: (p) => request("GET", `/api/assessment/questions${qs(p)}`, null, "questions"),
  sendViolation: (b) => request("POST", "/api/assessment/violation", b, "violation"),
  submitAttempt: (b) => request("POST", "/api/assessment/submit", b, "submit"),
  // student
  getScores: () => request("GET", "/api/students/me/scores", null, "scores"),
  getGaps: () => request("GET", "/api/students/me/gaps", null, "gaps"),
  getMatches: () => request("GET", "/api/students/me/matches", null, "matches"),
  getHome: () => request("GET", "/api/students/me/home", null, "home"),
  getDrives: () => request("GET", "/api/drives", null, "drives"),
  respondDrive: (id, interested = true) => request("POST", `/api/drives/${id}/respond`, { interested }, "driveRespond"),
  // placement
  getCohort: (p) => request("GET", `/api/placement/cohort${qs(p)}`, null, "cohort"),
  getCohortGaps: () => request("GET", "/api/placement/cohort/gaps", null, "cohortGaps"),
  getStudent: (id) => request("GET", `/api/placement/students/${id}`, null, "student"),
  shortlist: (b) => request("POST", "/api/placement/shortlist", b, "shortlist"),
  getSessions: () => request("GET", "/api/placement/sessions", null, "sessions"),
  createSession: (b) => request("POST", "/api/placement/sessions", b, "sessionCreated"),
  closeSession: (id) => request("POST", `/api/placement/sessions/${id}/close`, null, "sessionClosed"),
  getPlacementDrives: () => request("GET", "/api/placement/drives", null, "placementDrives"),
  createDrive: (b) => request("POST", "/api/placement/drives", b, "driveCreated"),
};
