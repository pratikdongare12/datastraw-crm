# DataStraw CRM

DataStraw CRM is a small, end-to-end customer support workspace for tickets, customers, orders, and team collaboration.

## Submission Links

- Frontend: `Not deployed yet - add the public Vercel URL here.`
- Backend/API: `Not deployed yet - add the public Render URL here.`
- API health check: `<backend-url>/api/health`
- GitHub: https://github.com/pratikdongare12/datastraw-crm
- Demo video: `Not recorded yet - add the YouTube or equivalent URL here.`

The deployment URL fields are intentionally explicit because this repository does not contain published Vercel, Render, or video URLs. Replace them before submission.

## Features

- Create, search, filter, update, and delete support tickets.
- Search by ticket ID, customer, email, subject, and description.
- Add persistent internal support notes to tickets.
- Manage customers with company, phone, service tier, and ticket counts.
- Track customer orders with status, amount, and customer context.
- Manage team members with online, away, and offline presence.
- Post shared team activity updates.
- Validate request types and email addresses at the API boundary.
- Prevent stale search responses with abortable frontend requests.

## Architecture

```text
React/Vercel
    |
    v
Express/Render
    |
    v
SQLite on a Render persistent disk
```

The application is intentionally a small monolith for the assignment. It does not use authentication, AI features, microservices, or a complex service layer. SQLite is appropriate for this demonstration because the Render configuration provisions persistent storage. For a larger production workload, the database boundary could later move to PostgreSQL without changing the frontend API contract.

```text
frontend/src/
├── App.jsx
├── components/
│   ├── TicketFormManaged.jsx
│   ├── TicketList.jsx
│   ├── TicketDetailManaged.jsx
│   └── CrmPanels.jsx
└── styles.css

backend/
├── routes/
│   ├── tickets.js
│   └── crm.js
├── models/
│   ├── ticketModel.js
│   └── crmModel.js
├── test/
│   └── tickets.test.js
├── db.js
└── index.js
```

## Ticket Statuses

The database and API use these canonical values:

- `open` - displayed as **Open**
- `in_progress` - displayed as **In progress**
- `resolved` - displayed as **Closed** in the UI

The UI label **Closed** intentionally maps to the API/database value `resolved`; the stored status is not renamed.

## Support Notes

Notes are stored in the `notes` table with a foreign key to `tickets.id`. `GET /api/tickets/:id` includes the ticket's notes, so they remain visible after a page refresh. SQLite foreign keys are enabled and the relationship uses `ON DELETE CASCADE`, so deleting a ticket also deletes its notes.

## API Endpoints

### System and tickets

- `GET /api/health`
- `GET /api/tickets?status=open&search=customer`
- `GET /api/tickets/:id`
- `POST /api/tickets`
- `PUT /api/tickets/:id`
- `PATCH /api/tickets/:id`
- `DELETE /api/tickets/:id`

Ticket updates accept fields such as `{ status, priority, description, notes }`.

### CRM resources

- `GET /api/summary`
- `GET/POST /api/customers`
- `GET/POST /api/orders`
- `GET/POST /api/team`
- `GET/POST /api/activities`

## Environment Variables

Backend variables:

```env
PORT=4000
FRONTEND_ORIGIN=http://localhost:5173
DB_PATH=./tickets.db
```

Frontend variable:

```env
VITE_API_URL=http://localhost:4000/api
```

For production, configure `VITE_API_URL` in Vercel with the deployed backend URL followed by `/api`, for example `https://your-api.onrender.com/api`. Configure `FRONTEND_ORIGIN` in Render with the deployed Vercel origin. The committed `render.yaml` configures `DB_PATH` to a Render persistent disk.

## Local Setup

```powershell
npm install --prefix backend
npm install --prefix frontend
npm test --prefix backend
npm run build --prefix frontend
```

Start the services in separate terminals:

```powershell
npm run dev:backend
npm run dev:frontend
```

Open `http://localhost:5173` and verify the API at `http://localhost:4000/api/health`.

## Deployment

### Backend on Render

The root `render.yaml` uses `backend` as the service directory, runs `npm install`, starts with `npm start`, and provisions a 1 GB persistent disk mounted at `/opt/render/project/src/backend/data`. Set `FRONTEND_ORIGIN` to the Vercel URL in the Render service environment.

### Frontend on Vercel

Set the project root to `frontend`, use the existing `vercel.json`, and configure `VITE_API_URL` in Vercel to the Render API URL plus `/api`. The frontend build command is `npm run build` and output directory is `dist`.

## Pre-submission Checklist

- [ ] Create a ticket.
- [ ] Search by customer, email, subject, and description.
- [ ] Filter by Open, In Progress, and Closed.
- [ ] Open ticket details.
- [ ] Update the ticket status.
- [ ] Add a support note.
- [ ] Refresh the page and confirm the note remains.
- [ ] Delete the ticket.
- [ ] Confirm `/api/health` returns `{ "status": "ok" }`.
- [ ] Confirm the production frontend can reach the production backend.
- [ ] Run `npm test --prefix backend`.
- [ ] Run `npm run build --prefix frontend`.

## Development Notes

The backend uses Express, `better-sqlite3`, and normalized SQLite tables for tickets, notes, customers, orders, team members, and activities. The frontend uses React and Vite with focused components rather than a custom hook abstraction layer.
