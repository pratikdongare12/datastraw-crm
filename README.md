# DataStraw CRM

A customer support ticket workspace with an Express API, SQLite database, and React client.

## Development Approach

- **Vibecoding and AI assistance:** AI development tools were used to accelerate boilerplate generation, refine database queries, and debug implementation and deployment issues. The resulting code was reviewed and validated through local builds and API tests.
- **End-to-end ownership:** The application was designed and implemented across the SQLite schema, Express REST API, React frontend, and production deployment configuration for Render and Vercel.
- **Operational focus:** Search uses a short debounce before making asynchronous API requests, keeping search-as-you-type responsive while avoiding a request on every keystroke.

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

## Deploy

Deploy the backend to Render using `render.yaml` or set the service root directory to `backend`, build command to `npm install`, and start command to `npm start`.

Deploy `frontend` to Vercel. Set `VITE_API_URL` to the deployed backend URL followed by `/api`, for example `https://your-api.onrender.com/api`. Set the backend `FRONTEND_ORIGIN` variable to the deployed Vercel URL.

## Submission

- **Deployed application:** Add the public Vercel URL here.
- **GitHub repository:** Add the repository URL here.
- **Demo video:** Add the YouTube URL here after recording.

### Demo video outline

1. **0:00-0:30:** Introduce the support CRM and the Node/Express, SQLite, and React stack.
2. **0:30-1:30:** Create a ticket with customer name, email, subject, description, and priority.
3. **1:30-2:15:** Demonstrate search-as-you-type and Open/In Progress/Closed filtering.
4. **2:15-3:00:** Open ticket details, update status, and add a support note.
5. **3:00-4:00:** Walk through the SQLite schema, REST routes, React `fetch` calls, and Render/Vercel deployment files.
