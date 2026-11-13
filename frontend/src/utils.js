export const SKILL_LABELS = { aptitude: "Aptitude", programming: "Programming", web: "Web", dbms: "DBMS" };
export const skillLabel = (s) => SKILL_LABELS[s] || s;

export function formatStipend(v) {
  if (v === null || v === undefined || v === "") return "Stipend not stated";
  if (Number(v) === 0) return "Unpaid";
  return `\u20B9${Number(v).toLocaleString("en-IN")}/month`;
}

export function formatDate(d) {
  if (!d) return "-";
  const date = new Date(d);
  if (isNaN(date)) return d;
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export const BRANCHES = ["CSE", "ISE", "AIML", "ECE", "EEE", "Mech", "Civil", "Diploma-CS", "ITI-COPA"];
