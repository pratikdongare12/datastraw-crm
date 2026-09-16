import { useState } from 'react';

const statusLabels = { open: 'Open', in_progress: 'In progress', resolved: 'Closed' };

export default function TicketDetailManaged({ ticket, onUpdate, onDelete }) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(null);
  const [note, setNote] = useState('');
  const [operation, setOperation] = useState('');
  if (!ticket) return <section className="detail-panel blank-detail"><span className="detail-icon">↗</span><h2>Choose a ticket</h2><p>Select a ticket from the inbox to see its details.</p></section>;
  const values = draft || ticket;
  async function save(updates = values, operationName = 'save') {
    setOperation(operationName);
    try {
      await onUpdate(ticket.ticketId, updates);
      setIsEditing(false);
      setDraft(null);
      setNote('');
    } finally {
      setOperation('');
    }
  }
  async function remove() {
    setOperation('delete');
    try {
      await onDelete(ticket.ticketId);
    } finally {
      setOperation('');
    }
  }
  return <section className="detail-panel"><div className="detail-heading"><div><span className={`status-pill ${ticket.status}`}>{statusLabels[ticket.status]}</span><p className="ticket-id">{ticket.ticketId}</p></div><div className="detail-actions"><button className="icon-button" title="Edit ticket" disabled={Boolean(operation)} onClick={() => { setDraft({ ...ticket }); setIsEditing(true); }}>Edit</button><button className="icon-button danger" title="Delete ticket" disabled={Boolean(operation)} onClick={remove}>{operation === 'delete' ? 'Deleting...' : 'Delete'}</button></div></div>{isEditing ? <div className="edit-fields"><input value={values.subject} onChange={(event) => setDraft({ ...values, subject: event.target.value })} disabled={Boolean(operation)} /><textarea value={values.description} onChange={(event) => setDraft({ ...values, description: event.target.value })} rows="5" disabled={Boolean(operation)} /><div className="edit-row"><select value={values.status} onChange={(event) => setDraft({ ...values, status: event.target.value })} disabled={Boolean(operation)}><option value="open">Open</option><option value="in_progress">In progress</option><option value="resolved">Closed</option></select><select value={values.priority} onChange={(event) => setDraft({ ...values, priority: event.target.value })} disabled={Boolean(operation)}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></div><button className="primary-button" disabled={Boolean(operation)} onClick={() => save()}>{operation === 'save' ? 'Saving...' : 'Save changes'}</button></div> : <><h2 className="detail-title">{ticket.subject}</h2><p className="detail-description">{ticket.description || 'No description provided.'}</p><div className="detail-meta"><div><span>Customer</span><strong>{ticket.customerName}</strong><small>{ticket.customerEmail}</small></div><div><span>Priority</span><strong className={`priority-text ${ticket.priority}`}>{ticket.priority}</strong></div><div><span>Last updated</span><strong>{new Date(`${ticket.updatedAt}Z`).toLocaleDateString()}</strong></div></div><div className="activity"><p className="eyebrow">Notes & activity</p><div className="note-entry"><textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Add a note for the support team..." rows="3" disabled={Boolean(operation)} /><button className="secondary-button" disabled={!note.trim() || Boolean(operation)} onClick={() => save({ notes: note }, 'note')}>{operation === 'note' ? 'Adding...' : 'Add note'}</button></div>{ticket.notes?.map((item) => <div className="activity-item" key={item.id}><span className="avatar small">AM</span><p>{item.noteText}<small>{new Date(`${item.createdAt}Z`).toLocaleString()}</small></p></div>)}</div></>}</section>;
}
