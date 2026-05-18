# News API — Afrolink Backend Assessment

A production-ready RESTful API built with Node.js + TypeScript where
Authors publish content and Readers consume it, backed by a real-time
Analytics Engine that processes engagement data into daily reports.

---

## Technology Choices

| Layer | Choice | Reason |
|---|---|---|
| Runtime | Node.js + TypeScript | Type safety, compile-time error catching |
| Framework | Express | Lightweight, full control over middleware chain |
| Database | PostgreSQL | SQL required by spec, strong constraint support |
| ORM | Prisma | Type-safe queries, native upsert, clean schema |
| Password Hashing | Argon2 | Spec listed it first, winner of PHC, stronger than BCrypt |
| Auth | JWT (jsonwebtoken) | Stateless, contains sub + role claims as required |
| Validation | Zod | Centralized schemas, all errors collected in one pass |
| Job Queue | BullMQ + Redis | Production-grade queue with retries, backoff, scheduling |
| Rate Limiting | Redis (NX + EX) | O(1) deduplication without touching the database |

---

## Prerequisites

- Node.js v18+
- PostgreSQL running locally or via Docker
- Redis running locally or via Docker

Quick start with Docker:
```bash
docker run --name newsapi-pg -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=newsapi -p 5432:5432 -d postgres

docker run --name newsapi-redis -p 6379:6379 -d redis
```

---

## Setup & Run Locally

### 1. Clone the repository
```bash
git clone https://github.com/YOUR_USERNAME/afrolink_news.git
cd afrolink_news
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment variables
```bash
cp .env.example .env
# open .env and fill in your values
```

### 4. Run database migrations
```bash
npm run db:migrate
npm run db:generate
```

### 5. Start the development server
```bash
npm run dev
```

Server runs on `http://localhost:3000`

---

## Interactive API Documentation (Swagger)

The project includes full interactive API documentation powered by Swagger UI. Once the development server is running, you can access the following:

* **Swagger UI:** `http://localhost:3000/api-docs` (Allows you to inspect schemas, explore endpoints, and test authorized API requests directly from the browser)
* **Raw OpenAPI Specification:** `http://localhost:3000/api-docs.json` (Ideal for importing into Postman, Insomnia, or other API clients)

---

## Environment Variables

| Variable | Description | Example |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:password@localhost:5432/newsapi` |
| `JWT_SECRET` | Secret key for signing JWTs | `super-secret-key` |
| `JWT_EXPIRES_IN` | JWT expiration time | `24h` |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379` |
| `PORT` | Server port | `3000` |

---

## API Endpoints

### Auth
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/auth/register` | Public | Create account |
| POST | `/auth/login` | Public | Login + get JWT |

### Articles
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/articles` | Public | Paginated published feed |
| GET | `/articles/:id` | Public/Optional Auth | Read article + log view |
| POST | `/articles` | Author only | Create article |
| PUT | `/articles/:id` | Author only | Update own article |
| DELETE | `/articles/:id` | Author only | Soft delete own article |
| GET | `/articles/me` | Author only | My articles (draft + published) |

### Author
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/author/dashboard` | Author only | Engagement metrics + TotalViews |

---

## Query Parameters

### `GET /articles`
| Param | Type | Description |
|---|---|---|
| `category` | string | Exact category match |
| `author` | string | Partial author name match |
| `q` | string | Keyword search in title |
| `page` | number | Page number (default: 1) |
| `size` | number | Page size (default: 10) |

### `GET /articles/me`
| Param | Type | Description |
|---|---|---|
| `includeDeleted` | boolean | Show soft-deleted articles |
| `page` | number | Page number (default: 1) |
| `size` | number | Page size (default: 10) |

---

## Architecture Decisions

### Soft Delete
All article deletions set `deletedAt` to the current timestamp.
A global Prisma middleware intercepts every `findMany`, `findFirst`,
and `findUnique` on the Article model and injects `deletedAt: null`
automatically — so deleted articles are never exposed on
public-facing endpoints without any per-query boilerplate.

### Non-Blocking Read Tracking
`GET /articles/:id` returns the article immediately.
The `ReadLog` creation and analytics queue job are fired inside
`setImmediate()` — pushed to the next event loop iteration so
they never add latency to the main response cycle.

### Analytics Engine
Raw `ReadLog` entries are aggregated into `DailyAnalytics` via a
BullMQ worker that runs daily at `00:00 GMT`. The aggregation uses
a PostgreSQL `UPSERT` (`ON CONFLICT`) so re-runs are idempotent —
safe to trigger multiple times without double-counting.

### Read Deduplication (Bonus)
To prevent a single user from flooding `ReadLogs` by refreshing:
a Redis key `read:<userId>:<articleId>` is set with a 60-second TTL
using `SET NX EX`. If the key already exists, the ReadLog is skipped.
This is O(1) and never touches PostgreSQL.

---

## Bonus

### Unit Tests
```bash
npm test
```
All HTTP handlers are tested with Jest, with Prisma and Redis
mocked at the module level — no real database required.

### Read Rate Limiting
Implemented via Redis `SET NX EX 60` per `userId:articleId` pair.
A user refreshing the same article within 60 seconds generates
exactly one `ReadLog` entry regardless of refresh count.

---

## Commit Convention
This project follows conventional commits:
- `feat:` new feature
- `fix:` bug fix
- `chore:` setup, config, tooling
- `test:` unit tests