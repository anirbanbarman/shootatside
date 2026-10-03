# ShootAtSide Backend

This backend is built for the photographer studio workflow used by the app in this repository.

## Quick start

1. Copy `.env.example` to `.env`
2. Make sure MongoDB is running locally
3. Install dependencies:

```bash
cd backend
npm install
npm run dev
```

The API will run on `http://localhost:4000` by default.

## Core resources

- Admin, client, team, and editor auth
- Project requests and workflow updates
- Editor applications and approvals
- Team registrations and member approvals
- Dashboard statistics

## Main endpoints

### Health
- `GET /api/health`

### Auth
- `POST /api/auth/admin/login`
- `POST /api/auth/client/login`
- `POST /api/auth/team/login`
- `POST /api/auth/editor/login`

### Editor applications
- `GET /api/editor/applications`
- `POST /api/editor/applications`
- `PATCH /api/editor/applications/:id/approve`
- `PATCH /api/editor/applications/:id/reject`

### Team registrations
- `GET /api/team/registrations`
- `POST /api/team/registrations`
- `PATCH /api/team/registrations/:id/approve`
- `PATCH /api/team/registrations/:id/reject`

### Projects
- `GET /api/projects`
- `POST /api/projects`
- `GET /api/projects/:id`
- `PATCH /api/projects/:id/quote`
- `PATCH /api/projects/:id/negotiation`
- `PATCH /api/projects/:id/accept-quote`
- `PATCH /api/projects/:id/accept-negotiation`
- `PATCH /api/projects/:id/reject-quote`
- `PATCH /api/projects/:id/reject-negotiation`
- `PATCH /api/projects/:id/pay-advance`
- `POST /api/projects/:id/team-interest`
- `PATCH /api/projects/:id/assign-team`
- `PATCH /api/projects/:id/assign-editor`

### Dashboard
- `GET /api/dashboard/stats`

### Seed data
- `POST /api/dev/seed`
