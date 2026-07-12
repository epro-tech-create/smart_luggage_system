import { Gauge, LineChart, Package, Plus, Truck } from 'lucide-react';
import { ProcessPanel, RecentTable, RevenuePanel } from '../components/common/ProcessWidgets.jsx';
import { Stat } from '../components/common/Stats.jsx';

export function Dashboard({ rows, stats, onNavigate, now }) {
  const dashboardRows = rows;
  const total = stats?.totalLuggage || 279 + rows.length;
  const pendingPickup = dashboardRows.filter((row) => row.status === 'Pending Pickup').length + 44;
  const revenueNumber = dashboardRows.reduce((sum, row) => sum + Number(row.amount || 0), 1900000);
  const revenue = stats?.revenue ? `TSh ${Number(stats.revenue).toLocaleString()}` : `TSh ${(revenueNumber / 1000000).toFixed(1)}M`;

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
