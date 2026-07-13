import {
  BarChart3,
  Bell,
  Box,
  Grid2X2,
  Home,
  KeyRound,
  LocateFixed,
  QrCode,
  SquareCheckBig,
  User,
  Wallet,
  Weight
} from 'lucide-react';

export const terminals = ['DSM', 'Arusha', 'Mwanza', 'Dodoma', 'Moshi', 'Mbeya', 'Tanga'];

export const paymentProviders = [
  { name: 'M-Pesa', brand: 'Vodacom', color: 'green' },
  { name: 'Tigo Pesa', brand: 'Tigo', color: 'blue' },
  { name: 'Airtel Money', brand: 'Airtel', color: 'red' },
  { name: 'Halopesa', brand: 'Halotel', color: 'orange' }
];

export const demoRows = [
  { id: 'TZ-2024-00891', passenger: 'Amina Juma Bakari', route: 'DSM -> Arusha', weight: 23.5, bus: 'DX-4521', status: 'In Transit', amount: 14100, time: '08:42', rfid: 'RF-A1B2', pin: '4821' },
  { id: 'TZ-2024-00892', passenger: 'John Mollel', route: 'DSM -> Mwanza', weight: 18.2, bus: 'KK-2210', status: 'At Station', amount: 10920, time: '09:15', rfid: 'RF-C3D4', pin: '1730' },
  { id: 'TZ-2024-00893', passenger: 'Fatuma Hassan Said', route: 'Arusha -> Moshi', weight: 31.0, bus: 'SC-7730', status: 'Pending Pickup', amount: 18600, time: '09:58', rfid: 'RF-Q7R8', pin: '4821' },
  { id: 'TZ-2024-00894', passenger: 'David Kimaro', route: 'DSM -> Dodoma', weight: 12.7, bus: 'DX-4519', status: 'Delivered', amount: 7620, time: '10:22', rfid: 'RF-J2K9', pin: '9044' },
  { id: 'TZ-2024-00895', passenger: 'Neema Swai', route: 'Mwanza -> DSM', weight: 27.3, bus: 'KK-2208', status: 'In Transit', amount: 16380, time: '11:05', rfid: 'RF-K1L2', pin: '2298' }
];

export const navItems = [
  { key: 'dashboard', label: 'Dashboard', icon: Home },
  { key: 'weigh', label: '1. Weigh Luggage', icon: Weight },
  { key: 'confirm', label: '2. Confirm Cost', icon: SquareCheckBig },
  { key: 'register', label: '3. Register Luggage', icon: Box },
  { key: 'payment', label: '4. Make Payment', icon: Wallet },
  { key: 'tracking', label: 'Live Tracking', icon: LocateFixed },
  { key: 'verify', label: 'QR / RFID Verify', icon: QrCode },
  { key: 'pickup', label: 'Pickup PIN', icon: KeyRound },
  { key: 'notifications', label: 'Notifications', icon: Bell, count: 3 },
  { key: 'account', label: 'My Luggage', icon: User },
  { key: 'admin', label: 'Admin Dashboard', icon: Grid2X2, group: 'MANAGEMENT' },
  { key: 'reports', label: 'Reports', icon: BarChart3 }
];

export const roleLabels = {
  SUPER_ADMINISTRATOR: 'Super Administrator',
  BUS_COMPANY_ADMINISTRATOR: 'Bus Company Administrator',
  TERMINAL_OFFICER: 'Terminal Officer',
  CUSTOMER: 'Customer / Passenger'
};

export const navByRole = {
  SUPER_ADMINISTRATOR: [
    { key: 'dashboard', label: 'System Dashboard', icon: Home },
    { key: 'admin', label: 'Users & System', icon: Grid2X2 },
    { key: 'reports', label: 'Global Reports', icon: BarChart3 },
    { key: 'notifications', label: 'Security Alerts', icon: Bell, count: 3 }
  ],
  BUS_COMPANY_ADMINISTRATOR: [
    { key: 'dashboard', label: 'Operations Dashboard', icon: Home },
    { key: 'tracking', label: 'Company Luggage', icon: LocateFixed },
    { key: 'verify', label: 'Scan & Exceptions', icon: QrCode },
    { key: 'reports', label: 'Company Reports', icon: BarChart3 },
    { key: 'notifications', label: 'Incidents', icon: Bell, count: 3 }
  ],
  TERMINAL_OFFICER: [
    { key: 'dashboard', label: 'Terminal Desk', icon: Home },
    { key: 'weigh', label: 'Weigh Luggage', icon: Weight },
    { key: 'register', label: 'Intake & Tagging', icon: Box },
    { key: 'verify', label: 'QR / RFID Scan', icon: QrCode },
    { key: 'pickup', label: 'Pickup Verification', icon: KeyRound },
    { key: 'notifications', label: 'Assigned Incidents', icon: Bell, count: 3 }
  ],
  CUSTOMER: [
    { key: 'dashboard', label: 'My Dashboard', icon: Home },
    { key: 'register', label: 'Register Luggage', icon: Box },
    { key: 'payment', label: 'Payments', icon: Wallet },
    { key: 'tracking', label: 'Track Luggage', icon: LocateFixed },
    { key: 'account', label: 'My Account', icon: User },
    { key: 'notifications', label: 'Notifications', icon: Bell, count: 3 }
  ]
};

export function mapApiRows(apiRows) {
  return apiRows.map((row) => ({
    id: row.trackingCode,
    trackingCode: row.trackingCode,
    passenger: row.senderName,
    route: `${row.originTerminal} -> ${row.destinationTerminal}`,
    weight: row.weightKg,
    bus: row.busNumber || 'Not assigned',
    status: formatStatus(row.status),
    amount: row.cost,
    time: new Date(row.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    rfid: row.rfidTag,
    pin: row.pickupPin,
    receiverPhone: row.receiverPhone,
    ownerEmail: row.ownerEmail,
    currentTerminal: row.currentTerminal,
    originTerminal: row.originTerminal,
    destinationTerminal: row.destinationTerminal,
    timeline: row.timeline || []
  }));
}

export function formatStatus(status) {
  const labels = {
    REGISTERED: 'Registered',
    PAID: 'Pending Dispatch',
    IN_TRANSIT: 'In Transit',
    WRONG_DESTINATION_ALERT: 'Misplaced',
    ARRIVED: 'Pending Pickup',
    VERIFIED_PICKUP: 'Delivered',
    CANCELLED: 'Cancelled'
  };
  return labels[status] || status.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
}

export function initials(name = 'User') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'U';
}
