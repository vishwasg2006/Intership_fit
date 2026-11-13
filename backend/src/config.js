export const TARGET_SCORE = 70;
export const MAX_VIOLATIONS = 3;
export const VIOLATION_DEBOUNCE_SECONDS = 2;
export const SECONDS_PER_QUESTION = 60;
export const SKILLS = ["aptitude", "programming", "web", "dbms"];
export const readiness = (score) => score >= 80 ? "ready_now" : score >= 55 ? "almost_there" : "build_first";
