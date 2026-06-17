# Nupjuk Campus

A web platform and Chrome extension unifying course communities, assignment scheduling, and team meetings for KAIST students.

## Core Features

- **KLMS Integration:** Chrome extension for active-session data parsing and synchronization.
- **Course Communities:** Dedicated bulletin boards for each class.
- **Schedule Management:** Integrated assignment and deadline tracking.
- **Team Coordination:** Meeting scheduler with a visual availability grid.
- **System Essentials:** Notifications, reminders, and secure user authentication.

## Repository Structure

- `frontend/nupjuk-campus-web/` - Frontend application (Vite/Node, served via Nginx).
- `src/` - Backend API server (Node PostgreSQL).
- `prisma/` - Backend Database (Prisma).
- `nupjuk-extension/` - Chrome extension for KLMS webpage data extraction.

## Docker Quick Start

```sh
cp .env.docker.example .env
docker compose up --build
```

- Frontend: http://localhost:5173
- Backend: http://localhost:3000
- Postgres: localhost:5432

Set `JWT_SECRET`, `EMAIL_USER`, and `EMAIL_PASS` in `.env` for staging and production.

Seed data is enabled by default in Docker (`RUN_SEED=true`). Demo login:

- Email: `student@kaist.ac.kr`
- Password: `password123`

## Chrome Extension Setup

The extension is required to synchronize KLMS data and operates within your already-authenticated browser session.

- Open Chrome (or Edge/Brave) and navigate to chrome://extensions/.
- Toggle on Developer mode in the top right corner.
- Click the Load unpacked button in the top left corner.
- Select the nupjuk-extension directory from this repository.
- Log into the Nupjuk Campus web service to link your account via a secure token exchange.
