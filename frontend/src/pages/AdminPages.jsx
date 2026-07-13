import { useState } from 'react';
import {
  AlertTriangle,
  BarChart3,
  Download,
  KeyRound,
  Mail,
  Package,
  Phone,
  Save,
  Settings,
  Shield,
  Truck,
  User,
  Wallet,
  Weight,
  Zap
} from 'lucide-react';
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

export function AdminScreen({ overview }) {
  return (
    <div className="admin-page">
      <div className="page-title-row"><div><h1>Super Administrator Dashboard</h1><p>System-wide users, payments, devices, and security oversight</p></div></div>
      <div className="stats-row">
        <Stat icon={<User />} color="blue" label="TOTAL USERS" value={overview?.totalUsers || '...'} />
        <Stat icon={<Package />} label="TOTAL LUGGAGE" value={overview?.totalLuggage || '...'} />
        <Stat icon={<Wallet />} label="REVENUE" value={overview?.revenue ? `TSh ${Number(overview.revenue).toLocaleString()}` : '...'} />
        <Stat icon={<Zap />} color="lime" label="SYSTEM UPTIME" value="99.7%" />
      </div>
      <div className="admin-grid">
        <div className="card list-panel"><h2><Shield size={21} />System Health</h2>{['GPS Tracking Module', 'RFID Scanner - Gate 1', 'RFID Scanner - Gate 3', 'M-Pesa Gateway', 'Tigo Pesa Gateway', 'Database Server', 'Notification Service'].map((item, index) => <HealthRow key={item} name={item} offline={index === 2} ping={['42ms', '18ms', '-', '210ms', '195ms', '5ms', '12ms'][index]} />)}</div>
        <div className="card list-panel"><h2><User size={21} />Staff on Duty</h2>{['Zawadi Msongo|Terminal Manager|ZM|On Duty', 'Patrick Mmari|Weighing Operator|PM|On Duty', 'Leah Kimweri|Payment Officer|LK|On Duty', 'Oscar Mwita|RFID Technician|OM|On Break', 'Rose Nkya|Customer Service|RN|On Duty'].map((item) => <StaffRow key={item} item={item} />)}</div>
      </div>
    </div>
  );
}

export function ReportsScreen() {
  return (
    <div className="reports-page">
      <div className="page-title-row"><div><h1>Analytics & Reports</h1><p>Performance overview - Dar es Salaam Terminal</p></div><div className="report-tabs"><button>Today</button><button className="active">This Week</button><button>This Month</button><button><Download size={16} />Export</button></div></div>
      <div className="stats-row"><Stat icon={<Package />} label="" value="2,003" note="Total Luggage" /><Stat icon={<Wallet />} label="" value="TSh 12.1M" note="Total Revenue" /><Stat icon={<Weight />} color="blue" label="" value="18.4 kg" note="Avg Weight" /><Stat icon={<Truck />} color="lime" label="" value="94.2%" note="On-Time" /></div>
      <div className="reports-grid">
        <RevenuePanel title="Daily Revenue (TSh millions)" compact />
        <RouteBars />
        <PaymentDonut />
        <RoutePerformance />
      </div>
    </div>
  );
}

function HealthRow({ name, offline, ping }) {
  return <p className="health-row"><i className={offline ? 'offline' : ''} />{name}<span>{ping}</span><b className={offline ? 'offline-text' : ''}>{offline ? 'Offline' : 'Online'}</b></p>;
}

function StaffRow({ item }) {
  const [name, role, initials, status] = item.split('|');
  return <p className="staff-row"><span>{initials}</span><strong>{name}<small>{role}</small></strong><b className={status === 'On Break' ? 'break' : ''}>{status}</b></p>;
}

function RouteBars() {
  const routes = [['DSM->Arusha', 142], ['DSM->Mwanza', 98], ['DSM->Dodoma', 87], ['Arusha->Moshi', 64], ['DSM->Tanga', 53], ['Mwanza->DSM', 76]];
  return <div className="card route-bars"><h2>Luggage by Route</h2>{routes.map(([route, value]) => <p key={route}><span>{route}</span><b style={{ width: `${value / 1.6}%` }} /></p>)}</div>;
}

function PaymentDonut() {
  return <div className="card payment-donut"><h2>Payment Methods</h2><div className="donut-layout"><div className="donut" /><div>{[['M-Pesa', '48%', 'green'], ['Tigo Pesa', '27%', 'blue'], ['Airtel Money', '16%', 'red'], ['Halopesa', '9%', 'orange']].map(([name, value, color]) => <p key={name}><i className={color} />{name}<b>{value}</b></p>)}</div></div></div>;
}

function RoutePerformance() {
  return <div className="card route-performance"><h2>Route Performance</h2><table><thead><tr><th>ROUTE</th><th>BAGS</th><th>REVENUE</th><th>ON-TIME</th></tr></thead><tbody>{[['DSM -> Arusha', 142, 'TSh 3.2M', '96%'], ['DSM -> Mwanza', 98, 'TSh 2.1M', '91%'], ['DSM -> Dodoma', 87, 'TSh 1.6M', '98%'], ['Mwanza -> DSM', 76, 'TSh 1.7M', '89%'], ['Arusha -> Moshi', 64, 'TSh 0.9M', '95%']].map((row) => <tr key={row[0]}>{row.map((cell) => <td key={cell}>{cell}</td>)}</tr>)}</tbody></table></div>;
}
