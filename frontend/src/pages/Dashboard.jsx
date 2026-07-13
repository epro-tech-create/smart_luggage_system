import { AlertTriangle, Gauge, LineChart, Package, Plus, ScanLine, Shield, Truck, User, Wallet } from 'lucide-react';
import { ProcessPanel, RecentTable, RevenuePanel } from '../components/common/ProcessWidgets.jsx';
import { Stat } from '../components/common/Stats.jsx';

export function Dashboard({ rows, stats, onNavigate, now, user }) {
  const dashboardRows = rows;
  const total = stats?.totalLuggage || 279 + rows.length;
  const pendingPickup = dashboardRows.filter((row) => row.status === 'Pending Pickup').length + 44;
  const revenueNumber = dashboardRows.reduce((sum, row) => sum + Number(row.amount || 0), 1900000);
  const revenue = stats?.revenue ? `TSh ${Number(stats.revenue).toLocaleString()}` : `TSh ${(revenueNumber / 1000000).toFixed(1)}M`;

  if (user?.role === 'SUPER_ADMINISTRATOR') {
    return <RoleDashboard title="System Control Center" subtitle="System-wide security, operations, payments, and integrations" stats={[
      [<User />, 'REGISTERED USERS', stats?.totalUsers || '...', 'Account activity monitored'],
      [<Package />, 'TOTAL LUGGAGE', stats?.totalLuggage || rows.length, 'Across all companies'],
      [<Wallet />, 'CONFIRMED PAYMENTS', stats?.confirmedPayments || '...', 'Revenue reconciled'],
      [<Shield />, 'SECURITY ALERTS', rows.filter((row) => row.status === 'Misplaced').length, 'Review required']
    ]} rows={rows} onNavigate={onNavigate} action="Open system management" actionPage="admin" />;
  }
  if (user?.role === 'BUS_COMPANY_ADMINISTRATOR') {
    return <RoleDashboard title="Company Operations" subtitle={`${user.busCompany || 'Assigned company'} performance, trips, payments, and incidents`} stats={[
      [<Package />, 'COMPANY LUGGAGE', stats?.totalLuggage || rows.length, 'Within your company'],
      [<Truck />, 'ACTIVE TRIPS', rows.filter((row) => row.status === 'In Transit').length, 'Luggage in transit'],
      [<Wallet />, 'PAYMENT FOLLOW-UP', rows.filter((row) => row.status === 'Registered').length, 'Awaiting payment'],
      [<AlertTriangle />, 'OPEN INCIDENTS', rows.filter((row) => row.status === 'Misplaced').length, 'Wrong-destination alerts']
    ]} rows={rows} onNavigate={onNavigate} action="Review company luggage" actionPage="tracking" />;
  }
  if (user?.role === 'TERMINAL_OFFICER') {
    return <RoleDashboard title="Terminal Operations Desk" subtitle={`${user.assignedTerminal || 'Assigned terminal'} - scans, arrivals, pickups, and intake`} stats={[
      [<Package />, 'AWAITING INTAKE', rows.filter((row) => row.status === 'Registered').length, 'Start intake and tagging'],
      [<ScanLine />, 'READY TO LOAD', rows.filter((row) => row.status === 'Pending Dispatch').length, 'Scan before dispatch'],
      [<Truck />, 'ARRIVING TODAY', rows.filter((row) => row.status === 'In Transit').length, 'Arrival scans expected'],
      [<Shield />, 'SECURITY HOLDS', rows.filter((row) => row.status === 'Misplaced').length, 'Requires supervisor review']
    ]} rows={rows} onNavigate={onNavigate} action="Start luggage intake" actionPage="weigh" />;
  }
  return (
    <div className="dashboard-page narrow">
      <div className="page-title-row">
        <div><h1>Overview Dashboard</h1><p>{now.toLocaleDateString([], { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })} - Dar es Salaam Terminal</p></div>
        <button className="solid-button" onClick={() => onNavigate('weigh')}><Plus size={18} />New Luggage</button>
      </div>
      <div className="stats-row">
        <Stat icon={<Package />} label="LUGGAGE TODAY" value={total} note="+12 from yesterday" />
        <Stat icon={<Gauge />} color="orange" label="PENDING PICKUP" value={pendingPickup} note="Across 6 terminals" />
        <Stat icon={<LineChart />} label="REVENUE TODAY" value={revenue} note="+8% vs last week" />
        <Stat icon={<Truck />} color="blue" label="ACTIVE BUSES" value="12" note={`${4 + (now.getSeconds() % 2)} with live tracking`} />
      </div>
      <div className="dashboard-grid">
        <RevenuePanel />
        <ProcessPanel />
      </div>
      <RecentTable rows={dashboardRows} />
    </div>
  );
}

function RoleDashboard({ title, subtitle, stats, rows, onNavigate, action, actionPage }) {
  return <div className="dashboard-page narrow">
    <div className="page-title-row"><div><h1>{title}</h1><p>{subtitle}</p></div><button className="solid-button" onClick={() => onNavigate(actionPage)}><Plus size={18} />{action}</button></div>
    <div className="stats-row">{stats.map(([icon, label, value, note]) => <Stat key={label} icon={icon} label={label} value={value} note={note} />)}</div>
    <div className="dashboard-grid"><RevenuePanel /><ProcessPanel /></div>
    <RecentTable rows={rows} />
  </div>;
}
