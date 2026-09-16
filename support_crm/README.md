# DataStraw CRM

A customer support ticket workspace with an Express API, SQLite database, and React client.

## Features

- Create tickets with customer name, email, subject, description, priority, timestamp, and an auto-generated `TKT-###` ID.
- Search across ticket IDs, customer details, subjects, and descriptions.
- Filter by Open, In Progress, or Closed status.
- View and update ticket details, plus add persistent support notes.

## Run locally

1. Install backend dependencies: `cd backend && npm install`
2. Install frontend dependencies: `cd ../frontend && npm install`
3. Start the API in `backend`: `npm run dev`
4. Start the client in `frontend`: `npm run dev`
5. Open `http://localhost:5173`

The API stores tickets in `backend/tickets.db` and exposes these endpoints:

- `POST /api/tickets`
- `GET /api/tickets?status=Open&search=customer`
- `GET /api/tickets/:ticket_id`
- `PUT /api/tickets/:ticket_id` with `{ status, notes }`
- `DELETE /api/tickets/:ticket_id`
