# InternshipFit frontend

React + Vite + Tailwind CSS v4 + React Router + Recharts.

## Run
```
npm install
cp .env.example .env      # on Windows: copy .env.example .env
npm run dev
```
Open http://localhost:5173

## Mock mode vs real backend
- `VITE_USE_MOCK=true`  -> everything works from src/mock/*.json (no backend needed).
  Login: any email/password. An email starting with "placement" opens the placement view.
  In the assessment page, mock mode shows a small panel to simulate violations (3 strikes ends the test).
- `VITE_USE_MOCK=false` -> calls VITE_API_BASE (the backend). Restart `npm run dev` after changing .env.

## Folders
- src/api.js: every backend call lives here (no fetch inside pages).
- pages/auth, pages/student, pages/assessment, pages/placement, components/, hooks/, utils.js

## Credits (open source)
React, Vite, Tailwind CSS, React Router, Recharts, Inter font (Google Fonts).
