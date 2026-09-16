import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import ticketsRouter from './routes/tickets.js';
import crmRouter from './routes/crm.js';

const app = express();
const port = Number(process.env.PORT || 4000);

app.use(cors({ origin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173' }));
app.use(express.json());
app.use((error, _request, response, next) => {
    if (error instanceof SyntaxError && error.status === 400 && 'body' in error) return response.status(400).json({ error: 'Request body must be valid JSON' });
    return next(error);
});
app.get('/api/health', (_request, response) => response.json({ status: 'ok' }));
app.use('/api/tickets', ticketsRouter);
app.use('/api', crmRouter);
app.use((error, _request, response, _next) => {
    console.error(error);
    response.status(500).json({ error: 'Internal server error' });
});

app.listen(port, () => console.log(`DataStraw CRM API listening on http://localhost:${port}`));