# attendance-api

NestJS backend for ARCHD Attendance.

## Stack
- NestJS 11
- Prisma ORM
- PostgreSQL
- JWT auth

## Getting started

```bash
npm install
cp .env.example .env
npm run db:migrate
npm run db:seed
npm run start:dev
```

API runs at `http://localhost:3001` by default.

## Scripts

```bash
npm run start:dev
npm run build
npm run test
npm run lint
npm run db:migrate
npm run db:seed
```

## API contract policy

When changing any endpoint, DTO, auth payload, or response fields:

1. Update docs in central docs repo location (`attendance-web/docs`).
2. Mark PR with `api-change` (and `breaking-change` when needed).
3. Add migration notes in PR description if web/mobile impact exists.

## Related repositories
- `attendance-web` (admin/teacher web)
- `attendance-app` (student mobile)
