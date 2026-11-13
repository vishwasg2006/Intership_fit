# Local setup

## Windows 10/11

1. Install the current Node.js LTS release from [nodejs.org](https://nodejs.org/) and PostgreSQL 15 or newer from [postgresql.org](https://www.postgresql.org/download/windows/). Keep `psql` selected in the PostgreSQL installer.
2. Open PowerShell and create the database once:

   ```powershell
   psql -U postgres -c "CREATE DATABASE internshipfit;"
   ```

3. In the project folder, install dependencies:

   ```powershell
   npm run setup
   ```

4. Copy the environment examples and edit `backend/.env` with your PostgreSQL password and a private JWT secret:

   ```powershell
   Copy-Item backend/.env.example backend/.env
   Copy-Item frontend/.env.example frontend/.env
   ```

5. Reset tables and load the supplied CSV data and demo accounts:

   ```powershell
   npm run db:reset
   ```

   The command prints the active supervised session code. Demo accounts use `Demo@123`.
6. Start the app:

   ```powershell
   npm run dev
   ```

   Open http://localhost:5173. The API is at http://localhost:5000. To open it from another laptop or phone on the same Wi-Fi, use `http://<your-ip>:5173` (LAN origins are allowed automatically).
7. With the app running, check the API flow:

   ```powershell
   npm run smoke
   ```

## macOS

1. Install the current Node.js LTS release and PostgreSQL 15 or newer. Homebrew example:

   ```sh
   brew install node postgresql@16
   brew services start postgresql@16
   ```

2. Create the database (use the PostgreSQL account configured on your machine):

   ```sh
   createdb internshipfit
   ```

3. From the project folder, install dependencies:

   ```sh
   npm run setup
   ```

4. Copy the environment examples and edit `backend/.env` with the correct database URL and a private JWT secret:

   ```sh
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   ```

5. Load the supplied CSVs and demo accounts, then start the app:

   ```sh
   npm run db:reset
   npm run dev
   ```

   The reset command prints the active supervised session code. Open http://localhost:5173; the API is at http://localhost:5000.
6. In another terminal, with the app running:

   ```sh
   npm run smoke
   ```

## Linux

Install Node.js LTS and PostgreSQL 15+, then `sudo -u postgres createdb internshipfit`, and follow the macOS steps 3 to 6 (set the `postgres` password in `DATABASE_URL`).

## Optional settings in `backend/.env`

- `PLACEMENT_INVITE_CODE` (default `PLACE-2026`): placement officers type this on sign-up. Leave empty to disable placement sign-up (demo placement account still works).
- `LLM_PROVIDER=gemini` and `LLM_API_KEY=<your Gemini key>`: the "why it fits" sentence is written by Gemini. Without a key, or if Gemini fails, the app uses its built-in sentence. Scores and matching are always computed without the LLM.
- `FRONTEND_ORIGIN`: extra allowed frontend URLs, comma separated.

## Troubleshooting

- **Server exits with "JWT_SECRET is missing":** copy `backend/.env.example` to `backend/.env`.

- **Port in use:** stop the process using port 5000 or 5173, then rerun `npm run dev`. The backend port can be changed with `PORT` in `backend/.env`; update `VITE_API_BASE` to match.
- **Wrong database password:** update `DATABASE_URL` in `backend/.env` and retry `npm run db:reset`.
- **`psql` not found:** add PostgreSQL's `bin` directory to `PATH`, reopen the terminal, or use the PostgreSQL SQL Shell to run `CREATE DATABASE internshipfit;`.
- **No questions for a skill:** check that `data/question_bank.csv` contains all four skill tags: `aptitude`, `programming`, `web`, and `dbms`.
