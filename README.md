# TawhidMatch AI — Backend

MVP backend foundation: Auth + User Profile module, built with Express, TypeScript, Prisma, PostgreSQL, and Zod.

## Folder Structure

```
src/
├── modules/
│   ├── auth/          # register, login, logout, /me
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── auth.route.ts
│   │   └── auth.schema.ts
│   └── users/          # get/update own profile
│       ├── users.controller.ts
│       ├── users.service.ts
│       ├── users.route.ts
│       └── users.schema.ts
├── middleware/
│   ├── auth.middleware.ts     # requireAuth, requireAdmin
│   ├── validate.middleware.ts # Zod request validation
│   └── error.middleware.ts    # centralized error handler
├── config/
│   └── env.ts           # validated environment variables
├── database/
│   └── prisma.ts        # Prisma client singleton
├── utils/
│   ├── ApiError.ts
│   ├── ApiResponse.ts
│   └── jwt.ts
├── app.ts                # Express app + route mounting
└── server.ts             # entry point
```

Every module follows the same pattern: **route → controller → service**. Controllers only
handle req/res; all business logic lives in services. This is the pattern you'll repeat
for `resumes`, `jobs`, `applications`, `interviews`, and `ai` in later phases.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy environment file and fill in real values:
   ```bash
   cp .env.example .env
   ```
   You need a running PostgreSQL instance. Update `DATABASE_URL` accordingly.
   Generate a strong random string for `JWT_SECRET` (e.g. `openssl rand -base64 32`).

3. Generate Prisma client and run the first migration:
   ```bash
   npx prisma migrate dev --name init
   ```

4. Start the dev server:
   ```bash
   npm run dev
   ```
   Server runs at `http://localhost:5000`. Check `GET /health`.

## API Endpoints (current)

| Method | Route              | Auth        | Description               |
|--------|---------------------|-------------|----------------------------|
| POST   | /api/auth/register  | Public      | Create account             |
| POST   | /api/auth/login     | Public      | Login, returns JWT         |
| POST   | /api/auth/logout    | Public      | Client discards token      |
| GET    | /api/auth/me        | Bearer JWT  | Current user (auth module) |
| GET    | /api/users/me        | Bearer JWT  | Current user + profile     |
| PATCH  | /api/users/me         | Bearer JWT  | Update profile fields      |

All protected routes expect:
```
Authorization: Bearer <token>
```

## Response Format

Success:
```json
{ "success": true, "message": "...", "data": { ... } }
```

Error:
```json
{ "success": false, "message": "...", "code": "SOME_ERROR_CODE" }
```

## What's Next (do not build ahead of this order)

1. Test this auth flow fully with Postman/Thunder Client/curl.
2. Add `resumes` module (Phase 5 in the project doc): upload, validate, extract text.
3. Add `jobs` module (Phase 3): admin CRUD + search/filter/pagination.
4. Add `applications` module (Phase 4).
5. Only after MVP is deployed: AI modules, Redis, queues, tests, logging.

## Quick Test (curl)

```bash
# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Tawhidul Islam","email":"tawhid@example.com","password":"password123"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"tawhid@example.com","password":"password123"}'

# Get current user (replace TOKEN)
curl http://localhost:5000/api/users/me \
  -H "Authorization: Bearer TOKEN"
```
