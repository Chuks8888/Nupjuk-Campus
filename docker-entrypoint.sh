#!/bin/sh
set -e

if [ "${RUN_MIGRATIONS:-true}" = "true" ]; then
  npx prisma migrate deploy
fi

if [ "${RUN_SEED:-false}" = "true" ]; then
  npm run db:seed
fi

exec "$@"
