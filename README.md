# Code Cloner — Render Ready

This is a Render-ready Node.js + Express project based on the UI you provided.

## Included

- Responsive Code Cloner frontend
- Login + Signup UI
- Real API endpoints for signup/login
- Password hashing with bcrypt
- JWT authentication
- Profile endpoint
- Saved-items API
- SQLite database
- Render persistent disk configuration
- `render.yaml` blueprint

## Run locally

```bash
npm install
npm start
```

Open:
http://localhost:10000

## Render deployment

### Option 1 — Blueprint
Push this folder to GitHub, then in Render choose **New → Blueprint** and select the repository.
Render will read `render.yaml`.

Set a strong secret for:
`JWT_SECRET`

### Option 2 — Manual Web Service

Build Command:
`npm install`

Start Command:
`npm start`

Add environment variable:
`JWT_SECRET=<a-long-random-secret>`

The included `render.yaml` mounts a 1 GB persistent disk at:
`/var/data`

The SQLite database is stored at:
`/var/data/codecloner.db`

## Important

The existing frontend's login modal is currently a visual demo. To make the form call these real APIs, replace the form submit handler in `public/index.html` with fetch calls to:

POST /api/auth/login
POST /api/auth/signup

The backend is ready; the next step is wiring the UI to these endpoints.

For a larger production website, PostgreSQL is recommended over SQLite.
