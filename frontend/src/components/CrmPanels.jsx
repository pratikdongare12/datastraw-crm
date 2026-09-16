import { useEffect, useState } from 'react';

const emptyCustomer = { name: '', email: '', company: '', phone: '', tier: 'standard' };
const emptyOrder = { customerId: '', description: '', amount: '', status: 'processing' };
const emptyMember = { name: '', email: '', role: 'Support specialist', status: 'online' };

function PanelHeader({ eyebrow, title, count, children }) {
  return <div className="panel-heading"><div><p className="eyebrow">{eyebrow}</p><h2>{title} <span>{count}</span></h2></div>{children}</div>;
}

function InlineForm({ fields, value, onChange, onSubmit, submitLabel }) {
  return <form className="inline-form" onSubmit={(event) => { event.preventDefault(); onSubmit(); }}>
    {fields.map((field) => field.type === 'select' ? <select key={field.name} name={field.name} value={value[field.name]} onChange={onChange} required={field.required !== false}>{field.options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select> : <input key={field.name} name={field.name} type={field.type || 'text'} value={value[field.name]} onChange={onChange} placeholder={field.placeholder} required={field.required !== false} />)}
    <button className="primary-button" type="submit">{submitLabel}</button>
  </form>;
}

function CustomerPanel({ apiUrl }) {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState(emptyCustomer);
  const load = () => fetch(`${apiUrl}/customers?search=${encodeURIComponent(search)}`).then((response) => response.json()).then(setCustomers);
  useEffect(() => { load(); }, [search]);
  const update = (event) => setForm({ ...form, [event.target.name]: event.target.value });
  async function create() { const response = await fetch(`${apiUrl}/customers`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) }); if (!response.ok) throw new Error('Unable to create customer'); setForm(emptyCustomer); load(); }
  return <section className="workspace-panel"><PanelHeader eyebrow="Relationship directory" title="Customers" count={customers.length} /><div className="panel-toolbar"><div className="search-wrap"><span>⌕</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search customers..." /></div></div><InlineForm value={form} onChange={update} onSubmit={create} submitLabel="Add customer" fields={[{ name: 'name', placeholder: 'Full name' }, { name: 'email', type: 'email', placeholder: 'Email' }, { name: 'company', placeholder: 'Company', required: false }, { name: 'phone', placeholder: 'Phone', required: false }, { name: 'tier', type: 'select', options: [{ value: 'standard', label: 'Standard' }, { value: 'priority', label: 'Priority' }, { value: 'enterprise', label: 'Enterprise' }] }]} /><div className="record-list">{customers.map((customer) => <article className="record-row" key={customer.id}><span className="record-avatar">{customer.name.slice(0, 2).toUpperCase()}</span><div><strong>{customer.name}</strong><small>{customer.company || 'Independent'} · {customer.email}</small></div><span className={`status-pill ${customer.tier}`}>{customer.tier}</span><span className="record-stat">{customer.ticketCount} tickets</span></article>)}{customers.length === 0 && <p className="empty-state">No customers yet.</p>}</div></section>;
}

function OrderPanel({ apiUrl }) {
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [form, setForm] = useState(emptyOrder);
  const load = () => Promise.all([fetch(`${apiUrl}/orders`).then((response) => response.json()), fetch(`${apiUrl}/customers`).then((response) => response.json())]).then(([nextOrders, nextCustomers]) => { setOrders(nextOrders); setCustomers(nextCustomers); if (!form.customerId && nextCustomers[0]) setForm((current) => ({ ...current, customerId: String(nextCustomers[0].id) })); });
  useEffect(() => { load(); }, []);
  const update = (event) => setForm({ ...form, [event.target.name]: event.target.value });
  async function create() { const response = await fetch(`${apiUrl}/orders`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) }); if (!response.ok) throw new Error('Unable to create order'); setForm({ ...emptyOrder, customerId: form.customerId }); load(); }
  const fields = [{ name: 'customerId', type: 'select', options: customers.map((customer) => ({ value: String(customer.id), label: customer.name })) }, { name: 'description', placeholder: 'Order description' }, { name: 'amount', type: 'number', placeholder: 'Amount' }, { name: 'status', type: 'select', options: [{ value: 'pending', label: 'Pending' }, { value: 'processing', label: 'Processing' }, { value: 'shipped', label: 'Shipped' }, { value: 'delivered', label: 'Delivered' }, { value: 'refunded', label: 'Refunded' }] }];
  return <section className="workspace-panel"><PanelHeader eyebrow="Revenue context" title="Orders" count={orders.length} /><InlineForm value={form} onChange={update} onSubmit={create} submitLabel="Add order" fields={fields} /><div className="record-list">{orders.map((order) => <article className="record-row" key={order.id}><div className="order-icon">$</div><div><strong>{order.orderNumber} · {order.customerName}</strong><small>{order.description}</small></div><span className={`status-pill ${order.status}`}>{order.status}</span><strong className="amount">${Number(order.amount).toFixed(2)}</strong></article>)}{orders.length === 0 && <p className="empty-state">No orders yet.</p>}</div></section>;
}

function TeamPanel({ apiUrl }) {
  const [members, setMembers] = useState([]);
  const [activities, setActivities] = useState([]);
  const [form, setForm] = useState(emptyMember);
  const [message, setMessage] = useState('');
  const load = () => Promise.all([fetch(`${apiUrl}/team`).then((response) => response.json()), fetch(`${apiUrl}/activities`).then((response) => response.json())]).then(([nextMembers, nextActivities]) => { setMembers(nextMembers); setActivities(nextActivities); });
  useEffect(() => { load(); }, []);
  const update = (event) => setForm({ ...form, [event.target.name]: event.target.value });
  async function addMember() { const response = await fetch(`${apiUrl}/team`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) }); if (!response.ok) throw new Error('Unable to add team member'); setForm(emptyMember); load(); }
  async function postActivity(event) { event.preventDefault(); if (!message.trim()) return; await fetch(`${apiUrl}/activities`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ memberId: members[0]?.id, message }) }); setMessage(''); load(); }
  return <section className="workspace-panel"><PanelHeader eyebrow="People & presence" title="Team collaboration" count={members.length} /><InlineForm value={form} onChange={update} onSubmit={addMember} submitLabel="Add teammate" fields={[{ name: 'name', placeholder: 'Name' }, { name: 'email', type: 'email', placeholder: 'Email' }, { name: 'role', placeholder: 'Role' }, { name: 'status', type: 'select', options: [{ value: 'online', label: 'Online' }, { value: 'away', label: 'Away' }, { value: 'offline', label: 'Offline' }] }]} /><div className="team-grid">{members.map((member) => <article className="team-card" key={member.id}><span className={`presence ${member.status}`} /><span className="record-avatar">{member.name.slice(0, 2).toUpperCase()}</span><strong>{member.name}</strong><small>{member.role}</small><small>{member.email}</small></article>)}</div><div className="activity-board"><p className="eyebrow">Shared activity</p><form className="activity-compose" onSubmit={postActivity}><input value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Share an update with the team..." /><button className="secondary-button">Post</button></form>{activities.map((activity) => <div className="activity-item" key={activity.id}><span className="avatar small">{activity.memberName.slice(0, 2).toUpperCase()}</span><p><strong>{activity.memberName}</strong> {activity.message}<small>{new Date(`${activity.createdAt}Z`).toLocaleString()}</small></p></div>)}</div></section>;
}

export default function CrmPanels({ apiUrl, view }) {
  if (view === 'customers') return <CustomerPanel apiUrl={apiUrl} />;
  if (view === 'orders') return <OrderPanel apiUrl={apiUrl} />;
  return <TeamPanel apiUrl={apiUrl} />;
}
