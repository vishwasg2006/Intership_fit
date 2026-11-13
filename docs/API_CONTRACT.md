# API contract

Health
- GET /api/health -> {status:"ok"}

Auth and profile
- POST /api/auth/verify-email  body {email, code (6 digits)} -> {token, user}. 400 CODE_INVALID, 429 TOO_MANY_ATTEMPTS.
- POST /api/auth/resend-code  body {email} -> {message}
- NOTE: student signup now returns 201 {verificationRequired:true, email, message} with NO token; login returns 403 EMAIL_NOT_VERIFIED until verified. Placement signup (invite code) still returns {token,user}.
- POST /api/auth/signup  body {name, email, password (min 8), role, inviteCode} -> {token, user:{id, name, email, role}}  (inviteCode is required only when role is "placement" and must equal PLACEMENT_INVITE_CODE from backend/.env, otherwise 403 INVITE_REQUIRED; ids are numbers everywhere)
- POST /api/auth/login   body {email, password} -> {token, user:{id, name, email, role}}
- PUT /api/students/me/profile  body {college, branch, year, cgpa, consentShare} -> {profile:{college, branch, year, cgpa, consentShare}}

Assessment and scores
- GET /api/assessment/questions?perSkill=5&mode=practice|supervised&sessionCode= -> {attemptId, mode, status, timeLimitSeconds, startedAt, maxViolations, violationsUsed, resumed, questions:[{questionId, skill, difficulty, question, options:{A,B,C,D}}]}  (sessionCode is required when mode=supervised)
- POST /api/assessment/violation  body {attemptId, type:"tab_switch"|"fullscreen_exit"|"copy_attempt"|"paste_attempt"|"context_menu"} -> {attemptId, violationsUsed, violationsLeft, terminated, message, result}  (message is a plain student-facing sentence such as "Warning 1 of 3: leaving the test is not allowed."; result is null unless terminated is true, then it is {overall, skillScores:[{skill, score}], takenAt}; an attempt that already ended returns 409 ATTEMPT_ENDED)
- POST /api/assessment/submit  body {attemptId, answers:[{questionId, selected}], perQuestionSeconds:[{questionId, seconds}]} -> {attemptId, mode, status, violationsUsed, overall, skillScores:[{skill, score}], takenAt}  (no integrity reasons in this response; submitting an already finished attempt returns its stored result)
- GET /api/students/me/scores -> {latest:{attemptId, mode, status, overall, skillScores:[{skill, score}], takenAt}, history:[{attemptId, mode, status, overall, skillScores, takenAt}]}  (history is oldest first; latest is the active score)

Gap report, matches, home
- GET /api/students/me/gaps -> {gaps:[{skill, score, target, gap, estimatedHours, resources:[{title, url}]}], roadmap:[{week, focus, tasks:[string]}]}
- GET /api/students/me/matches -> {matches:[{internshipId, title, company, location, mode, stipendInrMonth, deadline, applyUrl, source, matchScore, readiness, eligibility:{eligible, reasons:[string]}, whyFits, missingSkills:[{skill, have, need}]}]}
- GET /api/students/me/home -> {name, latestOverall, readiness, matchCount, upcomingDrives:[{driveId, company, role, date, deadline, eligible, responded}]}  (matchCount = number of matches returned, at most 3; readiness is based on the overall score)

Placement cell (role "placement" only; only students with consentShare = true are visible)
- GET /api/placement/cohort?branch=&skill=&minScore=&maxScore=&verifiedOnly=false&sort=overall|name -> {summary:{tested, avgScore, readyNow, verifiedCount, reviewCount}, students:[{studentId, rank, name, branch, year, overall, skillScores:[{skill, score}], readiness, scoreType:"verified"|"self_reported", integrityStatus:"ok"|"review"}]}  (if skill is given, minScore and maxScore filter on that skill's score, otherwise on the overall score; ranking puts verified scores first, then self-reported, each sorted by overall descending; integrityStatus is that of the active attempt)
- GET /api/placement/cohort/gaps -> {skills:[{skill, avgScore, belowTargetPct}]}  (belowTargetPct = percent of students whose active skill score is below TARGET_SCORE)
- GET /api/placement/students/:studentId -> {studentId, name, branch, year, cgpa, overall, readiness, skillScores:[{skill, score}], topMatches:[{internshipId, title, company, matchScore, readiness}], shortlisted, attempts:[{attemptId, mode, status, violationsUsed, overall, takenAt, integrityStatus, integrityReasons:[string]}]}
- POST /api/placement/shortlist  body {studentId, shortlisted} -> {studentId, shortlisted}
- POST /api/placement/sessions  body {title, perSkill, timeLimitMinutes} -> {session:{sessionId, code, title, perSkill, timeLimitMinutes, status:"active"}}  (code is 6 uppercase letters or digits)
- GET /api/placement/sessions -> {sessions:[{sessionId, code, title, perSkill, timeLimitMinutes, status, attemptsTaken}]}
- POST /api/placement/sessions/:sessionId/close -> {session:{sessionId, status:"closed"}}
- POST /api/placement/drives  body {company, role, date, deadline, minCgpa, minScore, branches:[string]} -> {drive:{driveId, company, role, date, deadline, minCgpa, minScore, branches}}
- GET /api/placement/drives -> {drives:[{driveId, company, role, date, deadline, minCgpa, minScore, branches, responses}]}  (responses = number of students who marked interest; create validates deadline <= date)
- GET /api/drives -> {drives:[{driveId, company, role, date, deadline, minCgpa, minScore, branches, eligible, reasons:[string], responded}]}  (upcoming drives, date today or later, for students)
- POST /api/drives/:driveId/respond  body {interested:true|false} -> {driveId, responded}  (403 NOT_ELIGIBLE if the student does not meet the drive rules)


Errors
- Every error is {error:{code, message}}. Codes used: VALIDATION_ERROR (400), UNAUTHORIZED (401), FORBIDDEN, INVITE_REQUIRED, SESSION_INVALID, NOT_ELIGIBLE (403), NOT_FOUND, ATTEMPT_NOT_FOUND, ATTEMPT_ENDED, EMAIL_EXISTS, NO_QUESTIONS (404/409), INTERNAL_ERROR (500).
- An in_progress attempt older than its time limit that was never submitted is marked "abandoned" and gets no score.
