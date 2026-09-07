# Debate Room

Debate Room is a full-stack web application for hosting structured debates and collecting votes from participants. Hosts can create and control debate sessions, while voters can join from a session code or QR code and vote when voting is open.

![Debate Room landing page](docs/images/landing-page.png)

## Features

- Host registration and login
- Protected host dashboard and debate sessions
- Create, update, start, pause, resume, and cancel sessions
- Configurable debate formats, phases, teams, and voting settings
- Public voter access through a session code
- Pre-debate, post-debate, and abstain voting support in the session model
- Live session timer and automatic phase progression
- Vote results for completed voting phases
- Responsive React frontend with a Node.js/Express API

## Tech Stack

- React 19, TypeScript, Vite
- Node.js, Express 5
- MongoDB and Mongoose
- JWT authentication
- Axios

## Project Structure

```text
.
├── back-end/    Express API, authentication, sessions, votes, and MongoDB models
├── front-end/   React application, routes, pages, components, and styles
├── docs/        Project screenshots and documentation assets
└── package.json Root development and build scripts
```

## Requirements

- Node.js 18 or newer
- npm 9 or newer
- MongoDB running locally or a MongoDB Atlas connection string

## Getting Started

1. Install all dependencies from the project root:

   ```bash
   npm run install:all
   npm install
   ```

2. Create the backend environment file:

   ```bash
   copy back-end\.env.example back-end\.env
   ```

   On macOS/Linux, use `cp back-end/.env.example back-end/.env` instead.

3. Set `MONGO_URI` and `JWT_SECRET` in `back-end/.env`.

4. Start both applications from the root:

   ```bash
   npm run dev
   ```

   The frontend runs at `http://localhost:5174` and the API runs at `http://localhost:3000`. Vite proxies `/api` requests to the backend during development.

## Available Scripts

| Command                 | Description                              |
| ----------------------- | ---------------------------------------- |
| `npm run dev`           | Start the frontend and backend together  |
| `npm run install:all`   | Install dependencies in both app folders |
| `npm run build`         | Create a production frontend build       |
| `npm run lint`          | Run the frontend ESLint checks           |
| `npm run start:backend` | Start the backend without nodemon        |
| `npm run preview`       | Preview the production frontend build    |

You can also run each app independently with `npm run dev --prefix front-end` or `npm run dev --prefix back-end`.

## API Overview

The API is served under `/api`.

- `POST /api/auth/register` - Register a host
- `POST /api/auth/login` - Log in a host
- `PATCH /api/auth/forgetPassword` - Update a password
- `POST /api/sessions` - Create a session (authenticated)
- `GET /api/sessions` - List the authenticated host's sessions
- `GET /api/sessions/code/:code` - Find a session by public code
- `POST /api/sessions/:id/votes` - Submit a vote
- `GET /api/sessions/:id/votes/results` - Read vote results

## Current Improvement Roadmap

- Add automated backend and frontend tests for authentication, session lifecycle, and one-vote-only behavior.
- Add request validation with clear limits for session codes, names, dates, and voting payloads.
- Enforce authorization consistently so a host can only control their own sessions.
- Add the planned admin role, analytics, audit logs, and host management tools.
- Add rate limiting, security headers, restricted CORS, and stronger production error handling.
- Complete synchronized client timers with a server-authoritative clock and reconnect handling.
- Add CSV export and improve the QR-code joining flow.
- Add CI checks for linting, builds, and tests before merging changes.

## Screenshots

The landing page screenshot is stored at `docs/images/landing-page.png`. Add future screenshots to the same folder and reference them with Markdown image links.

## License

This project is currently not published under an open-source license.
