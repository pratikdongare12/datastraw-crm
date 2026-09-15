import { useEffect, useState } from 'react';
import TicketDetail from './components/TicketDetail';
import TicketForm from './components/TicketForm';
import TicketList from './components/TicketList';
import './styles.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export default function App() {
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');

  async function loadTickets() {
    setIsLoading(true);
    try {
      const query = new URLSearchParams({ ...(search && { search }), ...(status && { status }) });
      const response = await fetch(`${API_URL}/tickets?${query}`);
      if (!response.ok) throw new Error('Unable to load tickets');
      setTickets(await response.json());
      setError('');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    const timer = setTimeout(loadTickets, 180);
    return () => clearTimeout(timer);
  }, [search, status]);

  async function saveTicket(ticket) {
    const response = await fetch(`${API_URL}/tickets`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(ticket) });
    if (!response.ok) throw new Error((await response.json()).error || 'Unable to create ticket');
    const created = await response.json();
    setTickets((current) => [created, ...current]);
    setSelectedTicket(created);
    setIsFormOpen(false);
  }

  async function updateTicket(id, updates) {
    const response = await fetch(`${API_URL}/tickets/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updates) });
    if (!response.ok) throw new Error((await response.json()).error || 'Unable to update ticket');
    const updated = await response.json();
    setTickets((current) => current.map((ticket) => ticket.ticketId === id ? updated : ticket));
    setSelectedTicket(updated);
  }

  async function removeTicket(id) {
    const response = await fetch(`${API_URL}/tickets/${id}`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Unable to delete ticket');
    setTickets((current) => current.filter((ticket) => ticket.ticketId !== id));
    setSelectedTicket(null);
  }

  const openCount = tickets.filter((ticket) => ticket.status === 'open').length;
  const activeCount = tickets.filter((ticket) => ticket.status === 'in_progress').length;
  const resolvedCount = tickets.filter((ticket) => ticket.status === 'resolved').length;

  return <main className="app-shell">
    <header className="topbar"><div className="brand"><span className="brand-mark">DS</span><span>DataStraw <strong>CRM</strong></span></div><div className="topbar-meta"><span className="status-dot" /> Operations desk <span className="avatar">AM</span></div></header>
    <section className="workspace">
      <div className="page-heading"><div><p className="eyebrow">Customer support / workspace</p><h1>Ticket overview</h1><p className="subtitle">Keep every customer conversation moving forward.</p></div><button className="primary-button" onClick={() => setIsFormOpen(true)}>+ New ticket</button></div>
      <div className="stats-row"><div><span>Open tickets</span><strong>{openCount}</strong><small>Needs attention</small></div><div><span>In progress</span><strong>{activeCount}</strong><small>Being handled</small></div><div><span>Resolved</span><strong>{resolvedCount}</strong><small>Closed this cycle</small></div><div className="stats-note"><span>Response health</span><strong>94.8%</strong><small><b>+6.2%</b> from last week</small></div></div>
      {error && <div className="error-banner">{error} <button onClick={loadTickets}>Retry</button></div>}
      <div className="content-grid"><TicketList tickets={tickets} selectedTicket={selectedTicket} onSelect={setSelectedTicket} isLoading={isLoading} search={search} onSearch={setSearch} status={status} onStatusChange={setStatus} /><TicketDetail ticket={selectedTicket} onUpdate={updateTicket} onDelete={removeTicket} /></div>
    </section>
    {isFormOpen && <TicketForm onSubmit={saveTicket} onClose={() => setIsFormOpen(false)} />}
  </main>;
}
