import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  BarChart3,
  Download,
  Edit3,
  KeyRound,
  Mail,
  Package,
  Phone,
  Save,
  Settings,
  Shield,
  Trash2,
  Truck,
  User,
  Wallet,
  Weight,
  Zap
} from 'lucide-react';
import { apiRequest } from '../api/client.js';
import { RecentTable, RevenuePanel } from '../components/common/ProcessWidgets.jsx';
import { Stat } from '../components/common/Stats.jsx';

export function NotificationsScreen({ filter, setFilter, notifications, onRead, onReadAll }) {
  const notes = notifications.map((note) => ({ ...note, icon: { Arrival: Truck, Payment: Wallet, Alert: AlertTriangle, System: Settings }[note.type] || Settings }));
  const shown = filter === 'All' ? notes : notes.filter((note) => note.type === filter);

  return (
    <div className="notifications-page">
      <div className="notifications-head"><div><h1>Notifications</h1><p>{notes.filter((note) => note.unread).length} unread</p></div><button onClick={onReadAll}>Mark all read</button></div>
      <div className="filter-row">{['All', 'Arrival', 'Payment', 'Alert', 'System'].map((item) => <button className={filter === item ? 'active' : ''} key={item} onClick={() => setFilter(item)}>{item}</button>)}</div>
      <div className="notification-list">
        {shown.map((note) => {
          const Icon = note.icon;
          return <button className={`notification-card ${!note.unread ? 'muted' : ''}`} key={note.id} onClick={() => onRead(note.id)}><span className={note.type.toLowerCase()}><Icon size={20} /></span><div><strong>{note.title}</strong>{note.unread && <b />}<p>{note.text}</p></div><small>{note.time}</small></button>;
        })}
        {!shown.length && <div className="card notification-empty"><Settings size={24} /><strong>No notifications</strong><p>New luggage events, payment updates, and alerts will appear here automatically.</p></div>}
      </div>
    </div>
  );
}

export function AccountScreen({ user, rows, onSave, saving }) {
  const [form, setForm] = useState({ fullName: user.fullName || '', email: user.email || '', phoneNumber: user.phoneNumber || '', password: '' });
  const [message, setMessage] = useState('');
  const ownedRows = rows.filter((row) => row.ownerEmail?.toLowerCase() === user.email?.toLowerCase());

  async function submitAccount(event) {
    event.preventDefault();
    setMessage('');
    try {
      await onSave({
        fullName: form.fullName,
        email: form.email,
        phoneNumber: form.phoneNumber,
        password: form.password || null
      });
      setForm((current) => ({ ...current, password: '' }));
      setMessage('Saved');
    } catch (error) {
      setMessage(error.message || 'Could not save changes');
    }
  }

  return (
    <div className="account-page narrow">
      <div className="page-title-row"><div><h1>My Account</h1><p>{user.email} - personal passenger account</p></div></div>
      <div className="stats-row">
        <Stat icon={<Package />} label="MY ITEMS" value={ownedRows.length} note="Linked to this login" />
        <Stat icon={<Truck />} color="blue" label="IN TRANSIT" value={ownedRows.filter((row) => row.status === 'In Transit').length} note="Currently moving" />
        <Stat icon={<KeyRound />} label="PICKUPS" value={ownedRows.filter((row) => row.status === 'Pending Pickup').length} note="PIN required" />
      </div>
      <div className="account-layout">
        <form className="card account-editor" onSubmit={submitAccount}>
          <h2><User size={20} />Credentials</h2>
          <label className="form-field"><span>Full name</span><input value={form.fullName} onChange={(event) => setForm({ ...form, fullName: event.target.value })} required /></label>
          <label className="form-field"><span>Email address</span><input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required /></label>
          <label className="form-field"><span>Phone number</span><input value={form.phoneNumber} onChange={(event) => setForm({ ...form, phoneNumber: event.target.value })} placeholder="+255 7XX XXX XXX" /></label>
          <label className="form-field"><span>New password</span><input type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder="Leave blank to keep current" minLength={6} /></label>
          <div className="account-contact-strip">
            <span><Mail size={16} />{user.email}</span>
            <span><Phone size={16} />{user.phoneNumber || 'No phone saved'}</span>
          </div>
          <div className="form-actions"><span>{message}</span><button className="solid-button" disabled={saving}><Save size={17} />{saving ? 'Saving...' : 'Save Changes'}</button></div>
        </form>
        <div className="account-records">
          {ownedRows.length ? <RecentTable rows={ownedRows} /> : <div className="card account-empty"><Package size={28} /><h2>No luggage linked yet</h2><p>When you register luggage from this account, only your own tracking records will appear here.</p></div>}
        </div>
      </div>
    </div>
  );
}

export function AdminScreen({ overview, mode = 'overview' }) {
  const emptyUser = { fullName: '', email: '', phoneNumber: '', role: 'CUSTOMER', busCompany: '', assignedTerminal: '', active: true, password: '' };
  const emptyLuggage = { senderName: '', senderPhone: '', receiverName: '', receiverPhone: '', originTerminal: '', destinationTerminal: '', currentTerminal: '', weightKg: 15, busNumber: '', ownerEmail: '', busCompany: 'Safiri Express', status: 'REGISTERED' };
  const [users, setUsers] = useState([]);
  const [luggage, setLuggage] = useState([]);
  const [userForm, setUserForm] = useState(emptyUser);
  const [luggageForm, setLuggageForm] = useState(emptyLuggage);
  const [editingUserId, setEditingUserId] = useState(null);
  const [editingTrackingCode, setEditingTrackingCode] = useState('');
  const [message, setMessage] = useState('');

  async function loadManagement() {
    const [nextUsers, nextLuggage] = await Promise.all([apiRequest('/admin/users'), apiRequest('/admin/luggage')]);
    setUsers(nextUsers);
    setLuggage(nextLuggage);
  }

  useEffect(() => {
    loadManagement().catch((error) => setMessage(error.message));
  }, []);

  async function saveUser(event) {
    event.preventDefault();
    const payload = { ...userForm, password: userForm.password || null };
    const path = editingUserId ? `/admin/users/${editingUserId}` : '/admin/users';
    await apiRequest(path, { method: editingUserId ? 'PUT' : 'POST', body: JSON.stringify(payload) });
    setUserForm(emptyUser);
    setEditingUserId(null);
    setMessage('User saved.');
    await loadManagement();
  }

  async function deleteUser(id) {
    await apiRequest(`/admin/users/${id}`, { method: 'DELETE' });
    setMessage('User removed.');
    await loadManagement();
  }

  async function saveLuggage(event) {
    event.preventDefault();
    if (editingTrackingCode) {
      await apiRequest(`/admin/luggage/${editingTrackingCode}`, { method: 'PUT', body: JSON.stringify({ ...luggageForm, weightKg: Number(luggageForm.weightKg) }) });
    } else {
      await apiRequest('/admin/luggage', {
        method: 'POST',
        body: JSON.stringify({
          senderName: luggageForm.senderName,
          senderPhone: luggageForm.senderPhone,
          receiverName: luggageForm.receiverName,
          receiverPhone: luggageForm.receiverPhone,
          originTerminal: luggageForm.originTerminal,
          destinationTerminal: luggageForm.destinationTerminal,
          weightKg: Number(luggageForm.weightKg),
          busNumber: luggageForm.busNumber
        })
      });
    }
    setLuggageForm(emptyLuggage);
    setEditingTrackingCode('');
    setMessage('Luggage saved.');
    await loadManagement();
  }

  async function deleteLuggage(trackingCode) {
    await apiRequest(`/admin/luggage/${trackingCode}`, { method: 'DELETE' });
    setMessage('Luggage removed.');
    await loadManagement();
  }

  return (
    <div className="admin-page">
      <div className="page-title-row"><div><h1>Super Administrator Dashboard</h1><p>Manage users, staff roles, company admins, customers, and luggage records</p></div></div>
      <div className="stats-row">
        <Stat icon={<User />} color="blue" label="TOTAL USERS" value={overview?.totalUsers || '...'} />
        <Stat icon={<Package />} label="TOTAL LUGGAGE" value={overview?.totalLuggage || '...'} />
        <Stat icon={<Wallet />} label="REVENUE" value={overview?.revenue ? `TSh ${Number(overview.revenue).toLocaleString()}` : '...'} />
        <Stat icon={<Zap />} color="lime" label="SYSTEM UPTIME" value="99.7%" />
      </div>
      {mode === 'overview' && <div className="admin-grid">
        <div className="card list-panel"><h2><Shield size={21} />System Health</h2>{['GPS Tracking Module', 'RFID Scanner - Gate 1', 'RFID Scanner - Gate 3', 'M-Pesa Gateway', 'Tigo Pesa Gateway', 'Database Server', 'Notification Service'].map((item, index) => <HealthRow key={item} name={item} offline={index === 2} ping={['42ms', '18ms', '-', '210ms', '195ms', '5ms', '12ms'][index]} />)}</div>
        <div className="card list-panel"><h2><User size={21} />System Users</h2><p className="admin-jump">Open the Users page to add, edit, deactivate, or remove customers, officers, and company administrators.</p></div>
      </div>}
      {mode === 'users' && <><div className="management-tabs"><span>{message}</span></div><div className="management-grid">
        <form className="card management-form" onSubmit={saveUser}>
          <h2><User size={19} />{editingUserId ? 'Edit User' : 'Add User'}</h2>
          <input placeholder="Full name" value={userForm.fullName} onChange={(e) => setUserForm({ ...userForm, fullName: e.target.value })} required />
          <input placeholder="Email" type="email" value={userForm.email} onChange={(e) => setUserForm({ ...userForm, email: e.target.value })} required />
          <input placeholder="Phone" value={userForm.phoneNumber || ''} onChange={(e) => setUserForm({ ...userForm, phoneNumber: e.target.value })} />
          <select value={userForm.role} onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}>{['SUPER_ADMINISTRATOR', 'BUS_COMPANY_ADMINISTRATOR', 'TERMINAL_OFFICER', 'CUSTOMER'].map((role) => <option key={role}>{role}</option>)}</select>
          <input placeholder="Bus company" value={userForm.busCompany || ''} onChange={(e) => setUserForm({ ...userForm, busCompany: e.target.value })} />
          <input placeholder="Assigned terminal" value={userForm.assignedTerminal || ''} onChange={(e) => setUserForm({ ...userForm, assignedTerminal: e.target.value })} />
          <input placeholder={editingUserId ? 'New password optional' : 'Password'} type="password" value={userForm.password || ''} onChange={(e) => setUserForm({ ...userForm, password: e.target.value })} />
          <label className="mini-check"><input type="checkbox" checked={userForm.active} onChange={(e) => setUserForm({ ...userForm, active: e.target.checked })} /> Active account</label>
          <button className="solid-button">{editingUserId ? 'Update User' : 'Add User'}</button>
        </form>
        <div className="card management-table"><h2><Shield size={19} />All Users</h2><table><thead><tr><th>Name</th><th>Role</th><th>Scope</th><th>Status</th><th /></tr></thead><tbody>{users.map((item) => <tr key={item.id}><td><strong>{item.fullName}</strong><small>{item.email}</small></td><td>{item.role}</td><td>{item.busCompany || item.assignedTerminal || 'System'}</td><td>{item.active ? 'Active' : 'Inactive'}</td><td><button onClick={() => { setEditingUserId(item.id); setUserForm({ ...item, password: '' }); }}><Edit3 size={16} /></button><button onClick={() => deleteUser(item.id)}><Trash2 size={16} /></button></td></tr>)}</tbody></table></div>
      </div></>}
      {mode === 'luggage' && <><div className="management-tabs"><span>{message}</span></div><div className="management-grid">
        <LuggageManagementForm form={luggageForm} setForm={setLuggageForm} editing={editingTrackingCode} onSubmit={saveLuggage} />
        <LuggageManagementTable rows={luggage} onEdit={(row) => { setEditingTrackingCode(row.trackingCode); setLuggageForm(responseToLuggageForm(row)); }} onDelete={deleteLuggage} />
      </div></>}
    </div>
  );
}

export function CompanyOrdersScreen({ rows, onRefresh }) {
  const [editingTrackingCode, setEditingTrackingCode] = useState('');
  const [form, setForm] = useState(null);
  const [message, setMessage] = useState('');

  async function saveOrder(event) {
    event.preventDefault();
    await apiRequest(`/luggage/${editingTrackingCode}`, { method: 'PUT', body: JSON.stringify({ ...form, weightKg: Number(form.weightKg) }) });
    setMessage('Order updated.');
    setEditingTrackingCode('');
    setForm(null);
    await onRefresh();
  }

  async function deleteOrder(trackingCode) {
    await apiRequest(`/luggage/${trackingCode}`, { method: 'DELETE' });
    setMessage('Order deleted.');
    await onRefresh();
  }

  return <div className="admin-page">
    <div className="page-title-row"><div><h1>Customer Orders</h1><p>View, edit, and remove luggage orders assigned to your bus company</p></div></div>
    <div className="management-tabs"><span>{message}</span></div>
    <div className="management-grid company-orders">
      {form && <LuggageManagementForm form={form} setForm={setForm} editing={editingTrackingCode} onSubmit={saveOrder} companyMode />}
      <LuggageManagementTable rows={rows} onEdit={(row) => { setEditingTrackingCode(row.trackingCode); setForm(responseToLuggageForm(row)); }} onDelete={deleteOrder} />
    </div>
  </div>;
}

export function ReportsScreen({ rows = [], stats }) {
  const [period, setPeriod] = useState('week');
  const filtered = filterRowsByPeriod(rows, period);
  const paidRows = filtered.filter((row) => ['Pending Dispatch', 'In Transit', 'Pending Pickup', 'Delivered'].includes(row.status));
  const totalRevenue = paidRows.reduce((sum, row) => sum + Number(row.amount || 0), 0);
  const avgWeight = filtered.length ? filtered.reduce((sum, row) => sum + Number(row.weight || 0), 0) / filtered.length : 0;
  const delivered = filtered.filter((row) => row.status === 'Delivered').length;
  const onTime = filtered.length ? Math.round((delivered / filtered.length) * 100) : 0;
  const routeTotals = aggregateRoutes(filtered);

  function exportPdf() {
    const win = window.open('', '_blank');
    const routeRows = routeTotals.map(([route, count]) => `<tr><td>${route}</td><td>${count}</td></tr>`).join('');
    win.document.write(`<html><head><title>SafiriBag Report</title><style>body{font-family:Inter,Arial;padding:32px;color:#102015}table{width:100%;border-collapse:collapse;margin-top:20px}td,th{border:1px solid #ddd;padding:10px;text-align:left}h1{margin:0 0 6px}</style></head><body><h1>SafiriBag ${period} Report</h1><p>Total luggage: ${filtered.length}</p><p>Total revenue: TSh ${totalRevenue.toLocaleString()}</p><p>Average weight: ${avgWeight.toFixed(1)} kg</p><p>On-time: ${onTime}%</p><table><thead><tr><th>Route</th><th>Bags</th></tr></thead><tbody>${routeRows}</tbody></table></body></html>`);
    win.document.close();
    win.focus();
    win.print();
  }

  return (
    <div className="reports-page">
      <div className="page-title-row"><div><h1>Analytics & Reports</h1><p>Performance overview - Dar es Salaam Terminal</p></div><div className="report-tabs"><button className={period === 'today' ? 'active' : ''} onClick={() => setPeriod('today')}>Today</button><button className={period === 'week' ? 'active' : ''} onClick={() => setPeriod('week')}>This Week</button><button className={period === 'month' ? 'active' : ''} onClick={() => setPeriod('month')}>This Month</button><button onClick={exportPdf}><Download size={16} />Export PDF</button></div></div>
      <div className="stats-row"><Stat icon={<Package />} label="" value={filtered.length} note="Total Luggage" /><Stat icon={<Wallet />} label="" value={`TSh ${totalRevenue.toLocaleString()}`} note="Total Revenue" /><Stat icon={<Weight />} color="blue" label="" value={`${avgWeight.toFixed(1)} kg`} note="Avg Weight" /><Stat icon={<Truck />} color="lime" label="" value={`${onTime}%`} note="On-Time" /></div>
      <div className="reports-grid">
        <DynamicRevenueChart rows={filtered} period={period} />
        <RouteBars routes={routeTotals} />
        <PaymentDonut paid={paidRows.length} total={filtered.length} />
        <RoutePerformance routes={routeTotals} revenue={totalRevenue} />
      </div>
    </div>
  );
}

function filterRowsByPeriod(rows, period) {
  const now = new Date();
  const start = new Date(now);
  if (period === 'today') start.setHours(0, 0, 0, 0);
  if (period === 'week') start.setDate(now.getDate() - 6);
  if (period === 'month') start.setMonth(now.getMonth() - 1);
  return rows.filter((row) => {
    if (!row.createdAt) return true;
    return new Date(row.createdAt) >= start;
  });
}

function aggregateRoutes(rows) {
  const totals = rows.reduce((map, row) => {
    const route = row.route || `${row.originTerminal} -> ${row.destinationTerminal}`;
    map.set(route, (map.get(route) || 0) + 1);
    return map;
  }, new Map());
  return [...totals.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
}

function DynamicRevenueChart({ rows, period }) {
  const labels = period === 'today' ? ['00', '04', '08', '12', '16', '20'] : period === 'month' ? ['W1', 'W2', 'W3', 'W4'] : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const paidStatuses = ['Pending Dispatch', 'In Transit', 'Pending Pickup', 'Delivered'];
  const values = labels.map((_, index) => rows.filter((row, rowIndex) => paidStatuses.includes(row.status) && rowIndex % labels.length === index).reduce((sum, row) => sum + Number(row.amount || 0), 0) / 1000000);
  const max = Math.max(...values, 1);
  const points = values.map((value, index) => `${60 + index * (760 / Math.max(labels.length - 1, 1))},${210 - (value / max) * 150}`);
  const line = points.join(' ');
  return <div className="card chart-panel"><h2>{period === 'today' ? 'Today Revenue' : period === 'month' ? 'Monthly Revenue' : 'Weekly Revenue'}<small>TSh (millions)</small></h2><svg viewBox="0 0 900 260"><g className="grid-lines">{[60, 110, 160, 210].map((y) => <line key={y} x1="60" x2="820" y1={y} y2={y} />)}</g><polyline className="chart-line" points={line} fill="none" />{points.map((point) => { const [x, y] = point.split(','); return <circle className="chart-dot" key={point} cx={x} cy={y} r="6" />; })}<g className="chart-labels">{labels.map((label, index) => <text key={label} x={54 + index * (760 / Math.max(labels.length - 1, 1))} y="245">{label}</text>)}</g></svg></div>;
}

function responseToLuggageForm(row) {
  return {
    senderName: row.senderName || row.passenger || '',
    senderPhone: row.senderPhone || '',
    receiverName: row.receiverName || row.passenger || '',
    receiverPhone: row.receiverPhone || '',
    originTerminal: row.originTerminal || row.route?.split(' -> ')[0] || '',
    destinationTerminal: row.destinationTerminal || row.route?.split(' -> ')[1] || '',
    currentTerminal: row.currentTerminal || row.originTerminal || '',
    weightKg: row.weightKg || row.weight || 15,
    busNumber: row.busNumber || row.bus || '',
    ownerEmail: row.ownerEmail || '',
    busCompany: row.busCompany || 'Safiri Express',
    status: statusToApi(row.status || 'REGISTERED')
  };
}

function statusToApi(status) {
  const map = {
    Registered: 'REGISTERED',
    'Pending Dispatch': 'PAID',
    'In Transit': 'IN_TRANSIT',
    Misplaced: 'WRONG_DESTINATION_ALERT',
    'Pending Pickup': 'ARRIVED',
    Delivered: 'VERIFIED_PICKUP',
    Cancelled: 'CANCELLED'
  };
  return map[status] || status;
}

function LuggageManagementForm({ form, setForm, editing, onSubmit, companyMode }) {
  return <form className="card management-form" onSubmit={onSubmit}>
    <h2><Package size={19} />{editing ? 'Edit Luggage' : 'Add Luggage'}</h2>
    <input placeholder="Sender name" value={form.senderName} onChange={(e) => setForm({ ...form, senderName: e.target.value })} required />
    <input placeholder="Sender phone" value={form.senderPhone} onChange={(e) => setForm({ ...form, senderPhone: e.target.value })} required />
    <input placeholder="Receiver name" value={form.receiverName} onChange={(e) => setForm({ ...form, receiverName: e.target.value })} required />
    <input placeholder="Receiver phone" value={form.receiverPhone} onChange={(e) => setForm({ ...form, receiverPhone: e.target.value })} required />
    <input placeholder="Origin terminal" value={form.originTerminal} onChange={(e) => setForm({ ...form, originTerminal: e.target.value })} required />
    <input placeholder="Destination terminal" value={form.destinationTerminal} onChange={(e) => setForm({ ...form, destinationTerminal: e.target.value })} required />
    <input placeholder="Current terminal" value={form.currentTerminal || ''} onChange={(e) => setForm({ ...form, currentTerminal: e.target.value })} />
    <input placeholder="Weight kg" type="number" min="1" step="0.1" value={form.weightKg} onChange={(e) => setForm({ ...form, weightKg: e.target.value })} required />
    <input placeholder="Bus number" value={form.busNumber || ''} onChange={(e) => setForm({ ...form, busNumber: e.target.value })} />
    {!companyMode && <input placeholder="Owner email" value={form.ownerEmail || ''} onChange={(e) => setForm({ ...form, ownerEmail: e.target.value })} />}
    {!companyMode && <input placeholder="Bus company" value={form.busCompany || ''} onChange={(e) => setForm({ ...form, busCompany: e.target.value })} />}
    <select value={form.status || 'REGISTERED'} onChange={(e) => setForm({ ...form, status: e.target.value })}>{['REGISTERED', 'PAID', 'IN_TRANSIT', 'WRONG_DESTINATION_ALERT', 'ARRIVED', 'VERIFIED_PICKUP', 'CANCELLED'].map((status) => <option key={status}>{status}</option>)}</select>
    <button className="solid-button">{editing ? 'Update Luggage' : 'Add Luggage'}</button>
  </form>;
}

function LuggageManagementTable({ rows, onEdit, onDelete }) {
  return <div className="card management-table"><h2><Truck size={19} />Luggage Orders</h2><table><thead><tr><th>Tracking</th><th>Passenger</th><th>Route</th><th>Status</th><th>Company</th><th /></tr></thead><tbody>{rows.map((row) => <tr key={row.trackingCode || row.id}><td><strong>{row.trackingCode || row.id}</strong><small>{row.rfidTag || row.rfid}</small></td><td>{row.senderName || row.passenger}</td><td>{row.originTerminal && row.destinationTerminal ? `${row.originTerminal} -> ${row.destinationTerminal}` : row.route}</td><td>{row.status}</td><td>{row.busCompany || 'Unassigned'}</td><td><button onClick={() => onEdit(row)}><Edit3 size={16} /></button><button onClick={() => onDelete(row.trackingCode || row.id)}><Trash2 size={16} /></button></td></tr>)}</tbody></table></div>;
}

function HealthRow({ name, offline, ping }) {
  return <p className="health-row"><i className={offline ? 'offline' : ''} />{name}<span>{ping}</span><b className={offline ? 'offline-text' : ''}>{offline ? 'Offline' : 'Online'}</b></p>;
}

function StaffRow({ item }) {
  const [name, role, initials, status] = item.split('|');
  return <p className="staff-row"><span>{initials}</span><strong>{name}<small>{role}</small></strong><b className={status === 'On Break' ? 'break' : ''}>{status}</b></p>;
}

function RouteBars({ routes }) {
  const max = Math.max(...routes.map(([, value]) => value), 1);
  return <div className="card route-bars"><h2>Luggage by Route</h2>{routes.length ? routes.map(([route, value]) => <p key={route}><span>{route}</span><b style={{ width: `${(value / max) * 100}%` }} /></p>) : <p><span>No routes yet</span><b style={{ width: '0%' }} /></p>}</div>;
}

function PaymentDonut({ paid, total }) {
  const paidPercent = total ? Math.round((paid / total) * 100) : 0;
  const pendingPercent = 100 - paidPercent;
  return <div className="card payment-donut"><h2>Payment Status</h2><div className="donut-layout"><div className="donut" style={{ background: `conic-gradient(var(--green) 0 ${paidPercent}%, #d7e6db ${paidPercent}% 100%)` }} /><div>{[['Paid / Moving', `${paidPercent}%`, 'green'], ['Pending', `${pendingPercent}%`, 'orange']].map(([name, value, color]) => <p key={name}><i className={color} />{name}<b>{value}</b></p>)}</div></div></div>;
}

function RoutePerformance({ routes, revenue }) {
  return <div className="card route-performance"><h2>Route Performance</h2><table><thead><tr><th>ROUTE</th><th>BAGS</th><th>REVENUE SHARE</th></tr></thead><tbody>{routes.length ? routes.map(([route, count]) => <tr key={route}><td>{route}</td><td>{count}</td><td>TSh {Math.round(revenue / Math.max(routes.length, 1)).toLocaleString()}</td></tr>) : <tr><td>No route data</td><td>0</td><td>TSh 0</td></tr>}</tbody></table></div>;
}
