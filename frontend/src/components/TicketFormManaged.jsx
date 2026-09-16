import { useState } from 'react';

export default function TicketFormManaged({ onSubmit, onClose }) {
  const [form, setForm] = useState({ customerName: '', customerEmail: '', subject: '', description: '', priority: 'medium' });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const update = (event) => setForm({ ...form, [event.target.name]: event.target.value });
  async function submit(event) {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await onSubmit(form);
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setIsSubmitting(false);
    }
  }
  return <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && !isSubmitting && onClose()}><form className="modal" onSubmit={submit} aria-busy={isSubmitting}><div className="modal-header"><div><p className="eyebrow">Create record</p><h2>New ticket</h2></div><button type="button" className="close-button" onClick={onClose} disabled={isSubmitting}>x</button></div>{error && <p className="form-error">{error}</p>}<label>Customer name<input name="customerName" value={form.customerName} onChange={update} placeholder="Customer name or company" required disabled={isSubmitting} /></label><label>Customer email<input type="email" name="customerEmail" value={form.customerEmail} onChange={update} placeholder="name@company.com" required disabled={isSubmitting} /></label><label>Issue title<input name="subject" value={form.subject} onChange={update} placeholder="What does the customer need?" required disabled={isSubmitting} /></label><label>Priority<select name="priority" value={form.priority} onChange={update} disabled={isSubmitting}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></label><label>Description<textarea name="description" value={form.description} onChange={update} placeholder="Add context for the team..." rows="4" disabled={isSubmitting} /></label><div className="modal-actions"><button type="button" className="secondary-button" onClick={onClose} disabled={isSubmitting}>Cancel</button><button className="primary-button" disabled={isSubmitting}>{isSubmitting ? 'Creating...' : 'Create ticket'}</button></div></form></div>;
}
