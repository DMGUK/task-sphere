# TaskSphere

A full-stack task management application with Kanban board, calendar, and notes — built with Angular 20 and Express/TypeScript.

**Live:** [tasksphere.site](https://tasksphere.site)

---

## Features

- **Authentication** — Register, login, email verification, forgot/reset password
- **Tasks** — Create, edit, delete, filter by status/priority, search with debounce
- **Kanban Board** — Drag-and-drop tasks between Todo / In Progress / Done columns
- **Calendar** — Monthly view with task chips on due dates; create tasks from any day
- **Notes** — Colour-coded note cards with create/edit dialog
- **Profile** — Update display name and upload avatar

---

## Tech Stack

**Frontend**
- Angular 20 (standalone components, `inject()`)
- Angular Material + Angular CDK (drag-drop)
- SCSS + Tailwind CSS
- RxJS, HTTP interceptors, route guards

**Backend**
- Express.js + TypeScript
- Prisma ORM + MySQL 8
- JWT authentication (7-day tokens) + bcrypt
- Resend SDK for transactional email
- Multer for avatar uploads

**Testing**
- Frontend: Jest + jest-preset-angular — **94 tests**
- Backend: Jest + Supertest (real test DB) — **68 tests**

**Deployment**
- Frontend: Vercel
- Backend + Database: Railway (Docker + managed MySQL)

---

## Getting Started

### Prerequisites

- Node.js 20+
- Docker Desktop (for local MySQL + Mailpit)

### Local development

```bash
# Clone the repo
git clone git@github.com:DMGUK/task-sphere.git
cd task-sphere

# Start MySQL and Mailpit
docker compose up -d

# Backend
cd backend
cp .env.example .env       # fill in values
npm install
npm run dev                # runs on http://localhost:4000

# Frontend (new terminal)
cd frontend
npm install
npm start                  # runs on http://localhost:4200
```

### Environment variables (backend `.env`)

```env
DATABASE_URL="mysql://root:password@localhost:3306/tasksphere"
JWT_SECRET="your-secret-key"
RESEND_API_KEY="re_..."
EMAIL_FROM="TaskSphere <noreply@yourdomain.com>"
FRONTEND_URL="http://localhost:4200"
NODE_ENV="development"
```

---

## Running Tests

```bash
# Backend integration tests (requires Docker MySQL running)
cd backend && npm test

# Frontend unit tests
cd frontend && npm test
```

---

## Project Structure

```
tasksphere/
├── frontend/                  # Angular 20 SPA
│   ├── src/app/
│   │   ├── core/              # auth guard, interceptors, services
│   │   ├── features/
│   │   │   ├── auth/          # login, register, verify, reset password
│   │   │   ├── tasks/         # list view, kanban board, edit dialog
│   │   │   ├── calendar/      # monthly calendar
│   │   │   ├── notes/         # notes grid + dialog
│   │   │   └── profile/       # avatar upload, display name
│   │   ├── layout/            # main layout with sidebar nav
│   │   └── shared/            # pipes, utilities
│   └── src/__mocks__/         # Angular CDK mock for Jest
│
└── backend/                   # Express/TypeScript API
    ├── src/
    │   ├── controllers/       # auth, tasks, notes, users
    │   ├── middleware/        # JWT auth, avatar upload (multer)
    │   ├── routes/            # API route definitions
    │   ├── services/          # email service (Resend)
    │   └── __tests__/         # integration tests
    └── prisma/
        ├── schema.prisma
        └── migrations/
```

---

## API Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register + send verification email |
| POST | `/api/auth/login` | Login, returns JWT |
| GET | `/api/auth/verify-email` | Verify email token |
| POST | `/api/auth/forgot-password` | Send password reset email |
| POST | `/api/auth/reset-password` | Reset password with token |
| GET | `/api/tasks` | Get all tasks for authenticated user |
| POST | `/api/tasks` | Create task |
| PATCH | `/api/tasks/:id` | Update task |
| DELETE | `/api/tasks/:id` | Delete task |
| GET | `/api/notes` | Get all notes |
| POST | `/api/notes` | Create note |
| PATCH | `/api/notes/:id` | Update note |
| DELETE | `/api/notes/:id` | Delete note |
| GET | `/api/users/me` | Get current user profile |
| PATCH | `/api/users/me` | Update display name |
| POST | `/api/users/me/avatar` | Upload avatar |

All routes except `/api/auth/*` require `Authorization: Bearer <token>`.

---

## License

MIT
