# Nupjuk-Campus

## Docker

```sh
cp .env.docker.example .env
docker compose up --build
```

- Frontend: http://localhost:5173
- Backend: http://localhost:3000
- Postgres: localhost:5432

Set `JWT_SECRET`, `EMAIL_USER`, and `EMAIL_PASS` in `.env` for staging.

Seed data is enabled by default in Docker (`RUN_SEED=true`). Demo login:

- Email: `student@kaist.ac.kr`
- Password: `password123`
