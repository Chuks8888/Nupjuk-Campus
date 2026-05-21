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
