// "Why it fits" text. Scores and matching stay deterministic; the LLM only words the explanation.
// If there is no key, a timeout or any error, the caller keeps its deterministic sentence.
const cache = new Map();
const TIMEOUT_MS = 6000;
export const llmEnabled = () => (process.env.LLM_PROVIDER || "").toLowerCase() === "gemini" && !!process.env.LLM_API_KEY;

export async function explainFit(m, matched, bySkill) {
  if (!llmEnabled()) return m.whyFits;
  const key = JSON.stringify([m.internshipId, matched, m.missingSkills, m.matchScore]);
  if (cache.has(key)) return cache.get(key);
  const prompt = [
    "You write one short, encouraging, factual sentence (max 35 words) telling a student why an internship fits them.",
    "Use ONLY the facts below. Do not invent skills, numbers, companies or promises. Plain text only.",
    `Internship: ${m.title} at ${m.company}. Match score: ${m.matchScore}%.`,
    `Skills they already meet: ${matched.join(", ") || "none yet"}.`,
    `Skills still below requirement: ${m.missingSkills.map((s) => `${s.skill} (${s.have} of ${s.need})`).join(", ") || "none"}.`,
    `Their scores: ${Object.entries(bySkill).map(([k, v]) => `${k} ${v}`).join(", ")}.`,
  ].join("\n");
  try {
<<<<<<< HEAD
    const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": process.env.LLM_API_KEY },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.3, maxOutputTokens: 200, thinkingConfig: { thinkingBudget: 0 } } }),
=======
    const model = process.env.GEMINI_MODEL || "gemini-2.0-flash";
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": process.env.LLM_API_KEY },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.3, maxOutputTokens: 120 } }),
>>>>>>> 63ceeb9ba9da1e14cfe0a1b454d0f7c314c52a69
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) throw new Error(`Gemini ${res.status}`);
    const text = (await res.json())?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (!text) throw new Error("empty");
    cache.set(key, text);
    return text;
  } catch (e) {
    console.warn("LLM fallback:", e.message);
    return m.whyFits;
  }
}
