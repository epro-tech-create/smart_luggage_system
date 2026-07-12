import {
  BarChart3,
  Box,
  Check,
  KeyRound,
  LocateFixed,
  Package,
  SquareCheckBig,
  Wallet,
  Weight
} from 'lucide-react';
import { StatusBadge } from './StatusBadge.jsx';

export function Stepper({ step }) {
  const steps = ['Weigh Luggage', 'Confirm Cost', 'Register', 'Payment'];
  return (
    <div className="stepper">
      {steps.map((label, index) => (
        <div className={`step ${step > index + 1 ? 'done' : ''} ${step === index + 1 ? 'active' : ''}`} key={label}>
          {step > index + 1 ? <Check size={16} /> : index + 1}<strong>{label}</strong>
        </div>
      ))}
    </div>
  );
}

export function CostRows({ weight, totalDue, compact }) {
  return (
    <div className={`cost-rows ${compact ? 'compact' : ''}`}>
      <p><span>{compact ? `${weight.toFixed(1)} kg x TSh 600/kg` : `Weight charge (${weight.toFixed(1)} kg x TSh 600)`}</span><strong>TSh {Math.round(weight * 600).toLocaleString()}</strong></p>
      <p><span>Insurance {compact ? '(1%)' : 'fee'}</span><strong>TSh {Math.round(weight * 6).toLocaleString()}</strong></p>
      <p><span>{compact ? 'Terminal fee' : 'Terminal handling fee'}</span><strong>TSh 500</strong></p>
      <div><strong>Total {compact ? 'Due' : 'Amount Due'}</strong><b>TSh {totalDue.toLocaleString()}</b></div>
    </div>
  );
}

export function RevenuePanel({ title = 'Weekly Revenue', compact }) {
  const curve = 'M 0 78 C 70 65, 122 58, 160 60 C 218 63, 248 105, 300 98 C 356 91, 390 52, 450 45 C 540 34, 600 25, 675 14 C 728 6, 770 24, 810 55';
  const area = `${curve} L 810 210 L 0 210 Z`;
  return (
    <div className="card chart-panel">
      <h2>{title}<small>TSh (millions)</small></h2>
      <svg viewBox="0 0 900 250" role="img" aria-label={title}>
        <g className="grid-lines">
          {[30, 80, 130, 180, 230].map((y) => <line x1="40" x2="860" y1={y} y2={y} key={y} />)}
          {[40, 175, 310, 445, 580, 715, 850].map((x) => <line y1="30" y2="230" x1={x} x2={x} key={x} />)}
        </g>
        <path className="chart-fill" d={area} transform="translate(40 20)" />
        <path className="chart-line" d={curve} transform="translate(40 20)" />
        {compact && [0, 135, 270, 405, 540, 675, 810].map((x, index) => <circle className="chart-dot" cx={x + 40} cy={[98, 80, 115, 65, 48, 34, 75][index]} r="6" key={x} />)}
        <g className="chart-labels">
          <text x="28" y="235">0</text><text x="20" y="185">0.65</text><text x="28" y="135">1.3</text><text x="18" y="85">1.95</text><text x="28" y="35">2.6</text>
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => <text x={40 + i * 135} y="250" key={day}>{day}</text>)}
        </g>
      </svg>
    </div>
  );
}

export function ProcessPanel() {
  const items = [
    ['Weigh Luggage', 'Start here', Weight],
    ['Confirm Cost', 'Customer reviews', SquareCheckBig],
    ['Register Luggage', 'Assign RFID tag', Box],
    ['Make Payment', 'Mobile money', Wallet],
    ['Live Tracking', 'RFID + GPS', LocateFixed],
    ['Pickup PIN', 'Release luggage', KeyRound]
  ];
  return (
    <div className="card process-panel">
      <h2>Process Flow</h2>
      {items.map(([name, hint, Icon]) => <p key={name}><Icon size={18} /><strong>{name}</strong><span>{hint}</span></p>)}
    </div>
  );
}

export function RecentTable({ rows }) {
  return (
    <div className="card recent-table">
      <div className="table-title"><h2>Recent Registrations</h2><button>View all</button></div>
      <table>
        <thead><tr><th>TRACKING ID</th><th>PASSENGER</th><th>ROUTE</th><th>WEIGHT</th><th>BUS</th><th>STATUS</th><th>AMOUNT</th><th>TIME</th></tr></thead>
        <tbody>{rows.map((row) => <tr key={row.id}><td>{row.id}</td><td><strong>{row.passenger}</strong></td><td>{row.route}</td><td><b>{row.weight} kg</b></td><td>{row.bus}</td><td><StatusBadge status={row.status} /></td><td><b>TSh {Number(row.amount).toLocaleString()}</b></td><td>{row.time}</td></tr>)}</tbody>
      </table>
    </div>
  );
}

export function EventsFeed({ livePulse }) {
  const liveTime = new Date().toLocaleTimeString([], { hour12: false });
  const events = [
    `${liveTime} RF-A1B2 (TZ-2024-00891 - Amina Juma) - confirmed on DX-4521`,
    '12:40:18 RF-C3D4 (TZ-2024-00885 - Hassan Ally) - confirmed on DX-4521',
    `${livePulse % 2 ? '12:40:25' : liveTime} RF-E5F6 (TZ-2024-00878 - Mary Kilua) - NOT responding on DX-4521`,
    '12:41:03 RF-K1L2 (TZ-2024-00895 - Neema Swai) - confirmed on KK-2208'
  ];
  return <div className="card feed-panel"><h3><BarChart3 size={17} />RFID Events Feed <span /></h3>{events.map((event, index) => <p className={index === 2 ? 'danger-text' : ''} key={event}>{event}</p>)}</div>;
}

export function ManifestPanel() {
  return (
    <div className="card manifest-panel">
      <h3><Package size={17} />Bus SC-7730 - RFID Manifest <span>2 bags</span></h3>
      {['RF-Q7R8|TZ-2024-00893|Fatuma Hassan Said|On Bus', 'RF-S9T0|TZ-2024-00887|Ali Mohamed Juma|On Bus'].map((line) => {
        const [rfid, id, name, status] = line.split('|');
        return <div key={rfid}><strong>{rfid}</strong><b>{status}</b><p>{id}</p><p>{name}</p><small>{'Arusha -> Moshi'}</small></div>;
      })}
    </div>
  );
}
