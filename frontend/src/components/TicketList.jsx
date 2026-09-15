const statusLabels = { open: 'Open', in_progress: 'In progress', resolved: 'Closed' };

export default function TicketList({ tickets, selectedTicket, onSelect, isLoading, search, onSearch, status, onStatusChange }) {
  return <section className="ticket-panel">
    <div className="panel-heading"><div><p className="eyebrow">Inbox</p><h2>All tickets <span>{tickets.length}</span></h2></div><select className="filter-button" value={status} onChange={(event) => onStatusChange(event.target.value)}><option value="">All statuses</option><option value="open">Open</option><option value="in_progress">In progress</option><option value="resolved">Closed</option></select></div>
    <div className="search-wrap"><span>⌕</span><input value={search} onChange={(event) => onSearch(event.target.value)} placeholder="Search tickets, customers, email..." aria-label="Search tickets" /></div>
    <div className="ticket-list">{isLoading && <p className="empty-state">Loading tickets...</p>}{!isLoading && tickets.length === 0 && <p className="empty-state">No matching tickets.</p>}{tickets.map((ticket) => <button className={`ticket-row ${selectedTicket?.ticketId === ticket.ticketId ? 'selected' : ''}`} key={ticket.ticketId} onClick={() => onSelect(ticket)}><span className={`priority-mark ${ticket.priority}`} /><span className="ticket-row-content"><strong>{ticket.subject}</strong><small>{ticket.customerName} · {ticket.ticketId}</small></span><span className={`status-pill ${ticket.status}`}>{statusLabels[ticket.status]}</span></button>)}</div>
  </section>;
}
