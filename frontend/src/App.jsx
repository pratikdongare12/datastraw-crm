import { useEffect, useState } from 'react';
import TicketDetail from './components/TicketDetailManaged';
import TicketForm from './components/TicketFormManaged';
import TicketList from './components/TicketList';
import CrmPanels from './components/CrmPanels';
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
  const [view, setView] = useState('tickets');

  async function loadTickets(signal) {
    setIsLoading(true);
    try {
      const query = new URLSearchParams({ ...(search && { search }), ...(status && { status }) });
      const response = await fetch(`${API_URL}/tickets?${query}`, { signal });
      if (!response.ok) throw new Error('Unable to load tickets');
      setTickets(await response.json());
      setError('');
    } catch (requestError) {
      if (requestError.name !== 'AbortError') setError(requestError.message);
    } finally {
      if (!signal || !signal.aborted) setIsLoading(false);
    }
  }

  useEffect(() => {
    const controller = new AbortController();
    setIsLoading(true);
    const timer = setTimeout(() => loadTickets(controller.signal), 180);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [search, status]);

  useEffect(() => {
    if (selectedTicket && !tickets.some((ticket) => ticket.ticketId === selectedTicket.ticketId)) {
      setSelectedTicket(null);
    }
  }, [tickets, selectedTicket]);

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
      <div className="page-heading"><div><p className="eyebrow">Customer support / workspace</p><h1>{view === 'tickets' ? 'Ticket overview' : view === 'customers' ? 'Customer directory' : view === 'orders' ? 'Order context' : 'Team workspace'}</h1><p className="subtitle">Keep every customer conversation moving forward.</p></div>{view === 'tickets' && <button className="primary-button" onClick={() => setIsFormOpen(true)}>+ New ticket</button>}</div>
      <nav className="workspace-tabs" aria-label="CRM sections">{[['tickets', 'Tickets'], ['customers', 'Customers'], ['orders', 'Orders'], ['team', 'Team']].map(([key, label]) => <button key={key} className={view === key ? 'active' : ''} onClick={() => setView(key)}>{label}</button>)}</nav>
      {view === 'tickets' ? <><div className="stats-row"><div><span>Open tickets</span><strong>{openCount}</strong><small>Needs attention</small></div><div><span>In progress</span><strong>{activeCount}</strong><small>Being handled</small></div><div><span>Resolved</span><strong>{resolvedCount}</strong><small>Closed this cycle</small></div><div className="stats-note"><span>Response health</span><strong>94.8%</strong><small><b>+6.2%</b> from last week</small></div></div>{error && <div className="error-banner">{error} <button onClick={loadTickets}>Retry</button></div>}<div className="content-grid"><TicketList tickets={tickets} selectedTicket={selectedTicket} onSelect={setSelectedTicket} isLoading={isLoading} search={search} onSearch={setSearch} status={status} onStatusChange={setStatus} /><TicketDetail ticket={selectedTicket} onUpdate={updateTicket} onDelete={removeTicket} /></div></> : <CrmPanels apiUrl={API_URL} view={view} />}
    </section>
    {isFormOpen && <TicketForm onSubmit={saveTicket} onClose={() => setIsFormOpen(false)} />}
  </main>;
}
