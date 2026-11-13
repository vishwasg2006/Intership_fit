# InternshipFit

InternshipFit helps students understand their internship readiness, find skill gaps, and see transparent matches. Placement teams can review a consent-based cohort, run supervised assessments, and post campus drives.

## Run locally

Follow [docs/SETUP.md](docs/SETUP.md). The app uses React and Vite in `frontend`, with an Express API and PostgreSQL in `backend`.

## Architecture

The frontend keeps all API calls in `frontend/src/api.js` and supports starter mock fixtures with `VITE_USE_MOCK=true`. The backend uses Express, PostgreSQL, SQL migrations, and JWT authentication. Seed listings and questions are loaded from `data/`.

Demo accounts: `strong@demo.test`, `medium@demo.test`, `weak@demo.test`, and `placement@demo.test`. The shared password is `Demo@123`. Placement sign-up needs the invite code from `backend/.env` (`PLACEMENT_INVITE_CODE`, default `PLACE-2026`).

## Credits

Gemini (Google) writes the short "why it fits" sentence only; scores, eligibility and ranking are deterministic. Open-source libraries: React, React DOM, Vite, `@vitejs/plugin-react`, Tailwind CSS, `@tailwindcss/vite`, React Router, Recharts, lucide-react, Express, pg, bcrypt, jsonwebtoken, cors, dotenv, csv-parse, concurrently.

Data sources: supplied internship listings sourced from Internshala and the AICTE portal. Only factual listing fields are stored, and each match links back to its source. Supplied question-bank and learning-resource files are used as provided.
