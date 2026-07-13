import { useState } from 'react';
import {
  AlertTriangle,
  BarChart3,
  Download,
  KeyRound,
  Package,
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

export function NotificationsScreen({ filter, setFilter }) {
  const [notes, setNotes] = useState([
    { type: 'Arrival', title: 'Luggage Arrived', text: 'TZ-2024-00891 arrived at Arusha Terminal - Amina Juma Bakari', time: '2 min ago', icon: Truck, unread: true },
    { type: 'Payment', title: 'Payment Confirmed', text: 'M-Pesa TSh 14,100 confirmed for Amina Juma Bakari', time: '5 min ago', icon: Wallet, unread: true },
    { type: 'Alert', title: 'Unclaimed Luggage', text: 'TZ-2024-00879 unclaimed for 4 hours at Dodoma Terminal', time: '18 min ago', icon: AlertTriangle, unread: true },
    { type: 'Alert', title: 'Misplaced Luggage', text: 'RF-M3N4 (TZ-2024-00876) detected on wrong bus KK-2208', time: '35 min ago', icon: AlertTriangle },
    { type: 'Arrival', title: 'Bus Departed', text: 'Bus DX-4521 departed DSM Terminal - 34 bags on board', time: '1 hr ago', icon: Truck },
    { type: 'Payment', title: 'Payment Failed', text: 'Tigo Pesa payment failed for Ibrahim Mushi - retry required', time: '1 hr ago', icon: Wallet },
    { type: 'System', title: 'RFID Scanner Offline', text: 'RFID scanner at Gate 3 offline - maintenance requested', time: '2 hrs ago', icon: Settings }
  ]);
  const shown = filter === 'All' ? notes : notes.filter((note) => note.type === filter);

  return (
    <div className="notifications-page">
      <div className="notifications-head"><div><h1>Notifications</h1><p>{notes.filter((note) => note.unread).length} unread</p></div><button onClick={() => setNotes(notes.map((note) => ({ ...note, unread: false })))}>Mark all read</button></div>
      <div className="filter-row">{['All', 'Arrival', 'Payment', 'Alert', 'System'].map((item) => <button className={filter === item ? 'active' : ''} key={item} onClick={() => setFilter(item)}>{item}</button>)}</div>
      <div className="notification-list">
        {shown.map((note) => {
          const Icon = note.icon;
          return <button className={`notification-card ${!note.unread ? 'muted' : ''}`} key={note.title} onClick={() => setNotes(notes.map((item) => item.title === note.title ? { ...item, unread: false } : item))}><span className={note.type.toLowerCase()}><Icon size={20} /></span><div><strong>{note.title}</strong>{note.unread && <b />}<p>{note.text}</p></div><small>{note.time}</small></button>;
        })}
      </div>
    </div>
  );
}

export function AccountScreen({ user, rows }) {
  const ownedRows = rows.filter((row) => !row.ownerEmail || row.ownerEmail === user.email);
  return (
    <div className="account-page narrow">
      <div className="page-title-row"><div><h1>My Luggage</h1><p>{user.email} - personal passenger account</p></div></div>
      <div className="stats-row">
        <Stat icon={<Package />} label="MY ITEMS" value={ownedRows.length} note="Linked to this login" />
        <Stat icon={<Truck />} color="blue" label="IN TRANSIT" value={ownedRows.filter((row) => row.status === 'In Transit').length} note="Currently moving" />
        <Stat icon={<KeyRound />} label="PICKUPS" value={ownedRows.filter((row) => row.status === 'Pending Pickup').length} note="PIN required" />
      </div>
      <RecentTable rows={ownedRows.length ? ownedRows : rows.slice(0, 3)} />
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
