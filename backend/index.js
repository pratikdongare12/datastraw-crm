import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import ticketsRouter from './routes/tickets.js';

const app = express();
const port = Number(process.env.PORT || 4000);

app.use(cors({ origin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173' }));
app.use(express.json());
app.get('/api/health', (_request, response) => response.json({ status: 'ok' }));
app.use('/api/tickets', ticketsRouter);
app.use((error, _request, response, _next) => {
    console.error(error);
    response.status(500).json({ error: 'Internal server error' });
});

app.listen(port, () => console.log(`DataStraw CRM API listening on http://localhost:${port}`));