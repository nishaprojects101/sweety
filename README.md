# 🩸 Sweety – Blood Glucose Tracker

Built by Nisha Rokaya for the Kenpath Junior Full Stack Developer assignment.

A small web app where a diabetes patient records up to 4 blood glucose readings a day
and views daily, month-to-date and monthly reports.

**Stack:** Node.js + Express API · PostgreSQL · React (Vite)

## Features

- Sign up / log in (passwords hashed with bcrypt, login via JWT). Each user only sees their own readings.
- Add, view, edit and delete readings (date, time slot, value in mg/dl).
- Validation with clear messages, in the UI and on the server:
  - value required · whole number 40–600 · one reading per slot per day · max 4 per day · no future dates
- Reports: **Daily**, **Month-to-date** and **Previous month**, each with highest, lowest, average (1 decimal) and count. Friendly empty state when there is no data. The daily report also lists each reading with its slot.
- Bonus done: pagination on `GET /readings`, `docker-compose.yml`, React Testing Library tests for the reading form.

## Project layout

```
server/   Express API, SQL schema, seed script, tests
client/   React app (Vite), component tests
docker-compose.yml   PostgreSQL (+ API)
```

## Setup

You need **Node.js 20+** and **PostgreSQL 14+** (or Docker).

### 1. Install

```bash
cd server && npm install
cd ../client && npm install
```

### 2. Database

**Option A – Docker (easiest):**

```bash
docker compose up -d db
```

**Option B – local PostgreSQL:**

```bash
psql -U postgres -c "CREATE USER sweety WITH PASSWORD 'sweety';"
psql -U postgres -c "CREATE DATABASE sweety OWNER sweety;"
```

### 3. Environment variables

```bash
cp server/.env.example server/.env      # then set JWT_SECRET
cp client/.env.example client/.env      # optional, only if the API is not on :4000
```

All variables are listed and explained in `server/.env.example` and `client/.env.example`.

### 4. Create tables and demo data

```bash
cd server
npm run migrate    # creates the tables (safe to run again)
npm run seed       # demo user + ~130 sample readings (safe to run again)
```

Demo login: **demo@sweety.test** / **demo1234**

The seed fills last month and the current month up to today, so all three reports have data.

### 5. Run

```bash
# terminal 1
cd server && npm run dev        # API on http://localhost:4000

# terminal 2
cd client && npm run dev        # app on http://localhost:5173
```

### 6. Tests

```bash
cd server && npm test           # validation, date ranges, report maths (no database needed)
cd client && npm test           # reading form (React Testing Library)
```

## API

All routes except `/auth/*` need `Authorization: Bearer <token>`.

| Method | Route | Purpose |
| --- | --- | --- |
| POST | `/auth/register` | `{ name, email, password }` → `{ token, user }` |
| POST | `/auth/login` | `{ email, password }` → `{ token, user }` |
| GET | `/auth/me` | current user |
| GET | `/readings?page=1&limit=20` | your readings, newest first. Optional `date`, `from`, `to` filters |
| POST | `/readings` | `{ date, slot, value }` |
| PUT | `/readings/:id` | edit a reading |
| DELETE | `/readings/:id` | delete a reading |
| GET | `/reports/daily?date=YYYY-MM-DD` | single day + list of readings |
| GET | `/reports/month-to-date?date=YYYY-MM-DD` | 1st of that month → that date |
| GET | `/reports/monthly?date=YYYY-MM-DD` | the whole month before that date's month |

Slots: `morning`, `after_breakfast`, `after_lunch`, `after_dinner`.
Errors come back as `{ error: "message", errors: [{ field, message }] }`.

## Notes

### Assumptions

- **"Monthly" report** means the whole *previous* month relative to the selected date (selected 15 Oct → 1–30 Sep), exactly as in the brief.
- **Future dates** are checked against the server's local date. Report dates in the future are rejected too.
- **Order of rules:** when a day already has 4 readings, the "max 4 per day" message is shown (even though every slot is then also taken). With fewer than 4, a repeated slot shows the "already have a … reading" message.
- **Editing** a reading follows the same rules, ignoring the reading being edited, so you can change only the value without a false "duplicate" error.
- **Average** is rounded to 1 decimal place; highest/lowest/count are whole numbers.
- **Dates** are handled as plain `YYYY-MM-DD` strings end to end, to avoid time-zone off-by-one bugs.
- **Passwords:** minimum 8 characters. I used `bcryptjs` (same bcrypt algorithm, pure JavaScript) so it installs without a native build step.
- The login token is kept in `localStorage` for simplicity.
- Time slots are fixed to the four from the brief; "time" is the slot, not a clock time.

### What I would improve with more time

- API-level integration tests against a throwaway test database (the rules are unit-tested, the routes were checked by hand against a real PostgreSQL).
- Store the token in an httpOnly cookie, add rate limiting on login, and password reset.
- Charts of readings over the month (Recharts), and colour-coding for low/high values.
- Store each user's time zone so "today" is correct for them rather than the server.
- Redis caching of report results, and the optional doctor role.
- Proper migrations tool (e.g. node-pg-migrate) instead of one idempotent `schema.sql`.
- Accessibility pass and more responsive polish.

### Docker

`docker compose up --build` starts PostgreSQL and the API (tables are created on start); run the client with `npm run dev`.
