import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  AlertTriangle,
  BarChart3,
  Bell,
  Box,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Download,
  Fingerprint,
  Gauge,
  Grid2X2,
  Home,
  KeyRound,
  LineChart,
  LogOut,
  LockKeyhole,
  LocateFixed,
  MessageCircle,
  Minus,
  Package,
  PackageCheck,
  Plus,
  QrCode,
  RefreshCw,
  ScanLine,
  Search,
  Settings,
  Shield,
  Signal,
  SquareCheckBig,
  Trash2,
  Truck,
  User,
  UserPlus,
  Wallet,
  Weight,
  Zap
} from 'lucide-react';
import './styles.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081/api';
const AUTH_STORAGE_KEY = 'safiri_auth';
const terminals = ['DSM', 'Arusha', 'Mwanza', 'Dodoma', 'Moshi', 'Mbeya', 'Tanga'];
const paymentProviders = [
  { name: 'M-Pesa', brand: 'Vodacom', color: 'green' },
  { name: 'Tigo Pesa', brand: 'Tigo', color: 'blue' },
  { name: 'Airtel Money', brand: 'Airtel', color: 'red' }, 
  { name: 'Halopesa', brand: 'Halotel', color: 'orange' }
];

const demoRows = [
  { id: 'TZ-2024-00891', passenger: 'Amina Juma Bakari', route: 'DSM -> Arusha', weight: 23.5, bus: 'DX-4521', status: 'In Transit', amount: 14100, time: '08:42', rfid: 'RF-A1B2', pin: '4821' },
  { id: 'TZ-2024-00892', passenger: 'John Mollel', route: 'DSM -> Mwanza', weight: 18.2, bus: 'KK-2210', status: 'At Station', amount: 10920, time: '09:15', rfid: 'RF-C3D4', pin: '1730' },
  { id: 'TZ-2024-00893', passenger: 'Fatuma Hassan Said', route: 'Arusha -> Moshi', weight: 31.0, bus: 'SC-7730', status: 'Pending Pickup', amount: 18600, time: '09:58', rfid: 'RF-Q7R8', pin: '4821' },
  { id: 'TZ-2024-00894', passenger: 'David Kimaro', route: 'DSM -> Dodoma', weight: 12.7, bus: 'DX-4519', status: 'Delivered', amount: 7620, time: '10:22', rfid: 'RF-J2K9', pin: '9044' },
  { id: 'TZ-2024-00895', passenger: 'Neema Swai', route: 'Mwanza -> DSM', weight: 27.3, bus: 'KK-2208', status: 'In Transit', amount: 16380, time: '11:05', rfid: 'RF-K1L2', pin: '2298' }
];

const navItems = [
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

async function apiRequest(path, options = {}) {
  const stored = readStoredAuth();
  const token = options.authToken || stored?.token;
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    },
    ...options
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message || 'Backend request failed');
  }
  return response.json();
}

function readStoredAuth() {
  try {
    return JSON.parse(window.localStorage.getItem(AUTH_STORAGE_KEY) || 'null');
  } catch {
    return null;
  }
}

function saveStoredAuth(auth) {
  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth));
}

function App() {
  const [currentUser, setCurrentUser] = useState(() => readStoredAuth());
  const [authMode, setAuthMode] = useState('login');
  const [authError, setAuthError] = useState('');
  const [authForm, setAuthForm] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    password: ''
  });
  const [screen, setScreen] = useState('dashboard');
  const [rows, setRows] = useState(demoRows);
  const [apiRows, setApiRows] = useState([]);
  const [apiStats, setApiStats] = useState(null);
  const [apiOnline, setApiOnline] = useState(false);
  const [adminOverview, setAdminOverview] = useState(null);
  const [selectedTrackingCode, setSelectedTrackingCode] = useState('');
  const [weight, setWeight] = useState(15);
  const [category, setCategory] = useState('Bag');
  const [confirmed, setConfirmed] = useState(false);
  const [provider, setProvider] = useState('M-Pesa');
  const [phone, setPhone] = useState('');
  const [search, setSearch] = useState('');
  const [manualCode, setManualCode] = useState('');
  const [pin, setPin] = useState('');
  const [notificationFilter, setNotificationFilter] = useState('All');
  const [toast, setToast] = useState('');
  const [now, setNow] = useState(new Date());
  const [livePulse, setLivePulse] = useState(0);
  const [form, setForm] = useState({
    passenger: '',
    phone: '',
    nationalId: '',
    description: '',
    origin: '',
    destination: '',
    bus: '',
    departure: '',
    declaredValue: '',
    fragile: false
  });

  useEffect(() => {
    if (!currentUser?.token) return;
    async function loadBackendData() {
      try {
        const [stats, luggage] = await Promise.all([
          apiRequest('/dashboard'),
          apiRequest('/luggage')
        ]);
        setApiStats(stats);
        setApiRows(luggage);
        setApiOnline(true);
        if (luggage.length && !selectedTrackingCode) {
          setSelectedTrackingCode(luggage[0].trackingCode);
        }
      } catch {
        setApiOnline(false);
        setApiStats(null);
      }
    }
    loadBackendData();
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser?.token) return;
    apiRequest('/auth/me')
      .then((user) => {
        const auth = { ...user, token: user.token || currentUser.token };
        setCurrentUser(auth);
        saveStoredAuth(auth);
      })
      .catch(() => logout());
  }, []);

  useEffect(() => {
    if (currentUser?.role !== 'ADMIN') {
      setAdminOverview(null);
      if (screen === 'admin') setScreen('dashboard');
      return;
    }
    apiRequest('/admin/overview')
      .then(setAdminOverview)
      .catch(() => setAdminOverview(null));
  }, [currentUser, screen]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(new Date());
      setLivePulse((value) => value + 1);
      setRows((currentRows) => currentRows.map((row, index) => {
        if (index !== 1) return row;
        return {
          ...row,
          status: row.status === 'At Station' ? 'In Transit' : 'At Station',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
      }));
    }, 6000);
    return () => window.clearInterval(timer);
  }, []);

  async function refreshBackendData() {
    const [stats, luggage] = await Promise.all([
      apiRequest('/dashboard'),
      apiRequest('/luggage')
    ]);
    setApiStats(stats);
    setApiRows(luggage);
    setApiOnline(true);
    return luggage;
  }

  async function submitAuth(event) {
    event.preventDefault();
    setAuthError('');
    try {
      const path = authMode === 'login' ? '/auth/login' : '/auth/register';
      const payload = authMode === 'login'
        ? { email: authForm.email, password: authForm.password }
        : authForm;
      const auth = await apiRequest(path, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      setCurrentUser(auth);
      saveStoredAuth(auth);
      setToast(`Welcome, ${auth.fullName}`);
      setScreen(auth.role === 'ADMIN' ? 'admin' : 'dashboard');
    } catch (error) {
      setAuthError(error.message);
    }
  }

  function logout() {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    setCurrentUser(null);
    setScreen('dashboard');
    setApiRows([]);
    setApiStats(null);
    setApiOnline(false);
  }

  const backendRows = useMemo(() => mapApiRows(apiRows), [apiRows]);
  const appRows = backendRows.length ? backendRows : rows;
  const totalDue = useMemo(() => Math.round(weight * 600 + weight * 6 + 500), [weight]);
  const activeRow = appRows.find((row) => row.trackingCode === selectedTrackingCode)
    || appRows.find((row) => row.status === 'Pending Pickup' || row.status === 'Arrived')
    || appRows[0]
    || demoRows[2];
  const paymentRow = appRows.find((row) => row.trackingCode === selectedTrackingCode)
    || appRows.find((row) => row.status === 'Registered' || row.status === 'Pending Payment')
    || appRows[0]
    || demoRows[0];
  const visibleRows = useMemo(() => {
    if (!search.trim()) return appRows;
    const term = search.toLowerCase();
    return appRows.filter((row) => `${row.id} ${row.passenger} ${row.rfid}`.toLowerCase().includes(term));
  }, [appRows, search]);

  function navigate(next) {
    if (next === 'admin' && currentUser?.role !== 'ADMIN') {
      setToast('Admin access required.');
      return;
    }
    setScreen(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function registerLuggage(event) {
    event.preventDefault();
    const passenger = form.passenger || 'New Passenger';
    try {
      const created = await apiRequest('/luggage', {
        method: 'POST',
        body: JSON.stringify({
          senderName: passenger,
          senderPhone: form.phone || '+255700000000',
          receiverName: passenger,
          receiverPhone: form.phone || '+255700000000',
          originTerminal: form.origin || 'DSM',
          destinationTerminal: form.destination || 'Arusha',
          weightKg: weight,
          busNumber: form.bus || 'DX-4521'
        })
      });
      setSelectedTrackingCode(created.trackingCode);
      await refreshBackendData();
      setToast(`${created.trackingCode} registered and RFID assigned`);
      setForm({ passenger: '', phone: '', nationalId: '', description: '', origin: '', destination: '', bus: '', departure: '', declaredValue: '', fragile: false });
      navigate('payment');
    } catch (error) {
      const id = `TZ-2024-${String(900 + rows.length).padStart(5, '0')}`;
      const next = {
        id,
        trackingCode: id,
        passenger,
        route: `${form.origin || 'DSM'} -> ${form.destination || 'Arusha'}`,
        weight,
        bus: form.bus || 'DX-4521',
        status: 'Pending Payment',
        amount: totalDue,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        rfid: `RF-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
        pin: '4821',
        receiverPhone: form.phone || '+255700000000'
      };
      setRows([next, ...rows]);
      setSelectedTrackingCode(id);
      setToast(apiOnline ? error.message : `${id} registered locally. Start backend to save it.`);
      navigate('payment');
    }
  }

  async function confirmPayment() {
    try {
      const code = paymentRow.trackingCode || paymentRow.id;
      await apiRequest(`/luggage/${code}/payment`, {
        method: 'POST',
        body: JSON.stringify({
          provider,
          phoneNumber: phone || paymentRow.receiverPhone || '+255700000000'
        })
      });
      await apiRequest(`/luggage/${code}/dispatch`, { method: 'POST' });
      setSelectedTrackingCode(code);
      await refreshBackendData();
      setToast(`${provider} payment confirmed and luggage dispatched`);
      navigate('tracking');
    } catch (error) {
      setRows(rows.map((row) => (row.id === paymentRow.id ? { ...row, status: 'In Transit' } : row)));
      setToast(apiOnline ? error.message : `${provider} payment prompt sent${phone ? ` to ${phone}` : ''}`);
      navigate('tracking');
    }
  }

  async function verifyCode() {
    try {
      const matched = await apiRequest(`/verify/${manualCode}`);
      setSelectedTrackingCode(matched.trackingCode);
      setToast(`Verified ${matched.trackingCode}. Destination: ${matched.destinationTerminal}.`);
      await refreshBackendData();
    } catch {
      const matched = appRows.find((row) => row.id === manualCode || row.rfid === manualCode);
      setToast(matched ? `Luggage Arrived at Destination! ${matched.id} now requires pickup PIN.` : 'No matching RFID or tracking ID found');
    }
  }

  function addPinDigit(digit) {
    if (pin.length < 4) setPin(`${pin}${digit}`);
  }

  function deletePinDigit() {
    setPin(pin.slice(0, -1));
  }

  useEffect(() => {
    if (pin.length === 4) {
      async function verifyPickup() {
        try {
          const code = activeRow.trackingCode || activeRow.id;
          await apiRequest(`/luggage/${code}/verify-pickup`, {
            method: 'POST',
            body: JSON.stringify({
              pickupPin: pin,
              receiverPhone: activeRow.receiverPhone || '+255700000000'
            })
          });
          await refreshBackendData();
          setToast('Pickup PIN accepted. Luggage released.');
        } catch {
          setToast(pin === activeRow.pin ? 'Pickup PIN accepted. Luggage released.' : 'Incorrect PIN. Please retry.');
          if (pin === activeRow.pin) {
            setRows(rows.map((row) => row.id === activeRow.id ? { ...row, status: 'Delivered' } : row));
          }
        }
      }
      verifyPickup();
    }
  }, [pin]);

  if (!currentUser) {
    return (
      <AuthScreen
        mode={authMode}
        setMode={setAuthMode}
        form={authForm}
        setForm={setAuthForm}
        error={authError}
        onSubmit={submitAuth}
      />
    );
  }

  return (
    <div className="app-shell">
      <Sidebar active={screen} onNavigate={navigate} unreadCount={appRows.filter((row) => row.status === 'Pending Pickup' || row.status === 'Arrived').length + 2} user={currentUser} onLogout={logout} />
      <div className="main-column">
        <PageHeader screen={screen} search={search} setSearch={setSearch} now={now} apiOnline={apiOnline} user={currentUser} onLogout={logout} />
        <main className="content-area">
          {screen === 'dashboard' && <Dashboard rows={visibleRows} stats={apiStats} apiRows={apiRows} onNavigate={navigate} now={now} />}
          {screen === 'weigh' && <WeighScreen weight={weight} setWeight={setWeight} category={category} setCategory={setCategory} totalDue={totalDue} onNavigate={navigate} />}
          {screen === 'confirm' && <ConfirmScreen weight={weight} category={category} totalDue={totalDue} confirmed={confirmed} setConfirmed={setConfirmed} onNavigate={navigate} />}
          {screen === 'register' && <RegisterScreen form={form} setForm={setForm} weight={weight} category={category} totalDue={totalDue} onSubmit={registerLuggage} onNavigate={navigate} />}
          {screen === 'payment' && <PaymentScreen row={paymentRow} provider={provider} setProvider={setProvider} phone={phone} setPhone={setPhone} totalDue={totalDue} onPay={confirmPayment} />}
          {screen === 'tracking' && <TrackingScreen livePulse={livePulse} />}
          {screen === 'verify' && <VerifyScreen manualCode={manualCode} setManualCode={setManualCode} onVerify={verifyCode} />}
          {screen === 'pickup' && <PickupScreen row={activeRow} pin={pin} setPin={setPin} addPinDigit={addPinDigit} deletePinDigit={deletePinDigit} />}
          {screen === 'notifications' && <NotificationsScreen filter={notificationFilter} setFilter={setNotificationFilter} />}
          {screen === 'account' && <AccountScreen user={currentUser} rows={appRows} />}
          {screen === 'admin' && <AdminScreen overview={adminOverview} />}
          {screen === 'reports' && <ReportsScreen />}
        </main>
      </div>
      {toast && <button className="toast" onClick={() => setToast('')}><CheckCircle2 size={20} />{toast}</button>}
    </div>
  );
}

function TopBar() {
  return (
    <header className="figma-topbar">
      <div className="figma-left"><span className="figma-mark">F</span><span className="ai-pill">AI</span></div>
      <div className="top-title">Smart Luggage Tracking System <ChevronDown size={14} /></div>
      <div className="top-actions"><MessageCircle size={22} /><CircleHelp size={18} /><button>Share</button></div>
    </header>
  );
}

function AuthScreen({ mode, setMode, form, setForm, error, onSubmit }) {
  const isRegister = mode === 'register';
  return ( 
    <main className="auth-page">
      <section className="auth-panel">
        <div className="auth-brand">
          <div className="brand-icon"><Package size={26} /></div>
          <div><strong>SafiriBag</strong><span>Smart Luggage Tracking System</span></div>
        </div>
        <div className="auth-copy">
          <h1>{isRegister ? 'Create your luggage account' : 'Login to continue'}</h1>
          <p>Secure access keeps each user linked to their own luggage records, while admins can manage the full terminal system.</p>
        </div>
        <form className="auth-card" onSubmit={onSubmit}>
          <div className="auth-tabs">
            <button type="button" className={!isRegister ? 'active' : ''} onClick={() => setMode('login')}><LockKeyhole size={16} />Login</button>
            <button type="button" className={isRegister ? 'active' : ''} onClick={() => setMode('register')}><UserPlus size={16} />Register</button>
          </div>
          {isRegister && <FormInput label="Full Name" value={form.fullName} placeholder="e.g. Amina Juma Bakari" onChange={(v) => setForm({ ...form, fullName: v })} />}
          <FormInput label="Email Address" type="email" value={form.email} placeholder="you@example.com" onChange={(v) => setForm({ ...form, email: v })} />
          {isRegister && <FormInput label="Phone Number" value={form.phoneNumber} placeholder="+255 7XX XXX XXX" onChange={(v) => setForm({ ...form, phoneNumber: v })} />}
          <FormInput label="Password" type="password" value={form.password} placeholder="Minimum 6 characters" onChange={(v) => setForm({ ...form, password: v })} />
          {error && <p className="auth-error">{error}</p>}
          <button className="solid-button full">{isRegister ? 'Create Account' : 'Login'}</button>
          <div className="demo-logins">
            <span>Demo admin: admin@safiribag.co.tz / admin123</span>
            <span>Demo user: user@safiribag.co.tz / user123</span>
          </div>
        </form>
      </section>
    </main>
  );
}

function Sidebar({ active, onNavigate, unreadCount, user, onLogout }) {
  let printedManagement = false;
  const visibleItems = navItems.filter((item) => item.key !== 'admin' || user?.role === 'ADMIN');
  return (
    <aside className="sidebar">
      <div className="brand-row">
        <div className="brand-icon"><Package size={23} /></div>
        <div><strong>SafiriBag</strong><span>Terminal System - TZ</span></div>
      </div>
      <nav>
        <p className="nav-group">OPERATIONS</p>
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const groupLabel = item.group && !printedManagement;
          if (groupLabel) printedManagement = true;
          return (
            <React.Fragment key={item.key}> 
              {groupLabel && <p className="nav-group management">MANAGEMENT</p>}
              <button className={`nav-item ${active === item.key ? 'active' : ''}`} onClick={() => onNavigate(item.key)}>
                <Icon size={19} />
                <span>{item.label}</span>
                {item.count && <b>{unreadCount}</b>}
              </button>
            </React.Fragment>
          );
        })}
      </nav>
      <div className="profile-card">
        <div className="avatar">{initials(user?.fullName)}</div>
        <div><strong>{user?.fullName}</strong><span>{user?.role === 'ADMIN' ? 'Administrator' : 'User Account'}</span></div>
        <button className="logout-icon" onClick={onLogout} title="Logout"><LogOut size={18} /></button>
      </div>
    </aside>
  );
}

function PageHeader({ screen, search, setSearch, now, apiOnline, user, onLogout }) {
  const labels = {
    dashboard: 'Overview',
    weigh: 'Weigh Luggage',
    confirm: 'Confirm Cost',
    register: 'Register Luggage',
    payment: 'Make Payment',
    tracking: 'Live Tracking',
    verify: 'Verification', 
    pickup: 'Pickup PIN',
    notifications: 'Notifications',
    account: 'My Luggage',
    admin: 'Admin',
    reports: 'Reports'
  };
  return (
    <section className="page-header">
      <div className="breadcrumb">SafiriBag <ChevronRight size={16} /> <strong>{labels[screen]}</strong></div>
      <div className="header-tools">
        <label className="search-box"><Search size={18} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search luggage ID..." /></label>
        <span className={`api-chip ${apiOnline ? 'online' : ''}`}>{apiOnline ? 'API Live' : 'Demo Mode'}</span>
        <span className="clock-chip">{now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        <button className="bell-button"><Bell size={21} /><span /></button>
        <div className="top-avatar">{initials(user?.fullName)}</div>
        <strong>{user?.fullName?.split(' ')[0]}</strong>
        <button className="mini-logout" onClick={onLogout}><LogOut size={17} /></button>
      </div>
      <div className="terminal-strip"><span /><span /><span /></div>
    </section>
  );
}

function Dashboard({ rows, stats, apiRows, onNavigate, now }) {
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

function WeighScreen({ weight, setWeight, category, setCategory, totalDue, onNavigate }) {
  return (
    <div className="workflow-page">
      <Stepper step={1} />
      <div className="center-title"><h1>Step 1 - Weigh Luggage</h1><p>Place luggage on the digital scale. Confirm weight before proceeding.</p></div>
      <div className="weigh-grid">
        <div>
          <ScaleDisplay weight={weight} />
          <div className="card control-card">
            <p className="section-label">ADJUST WEIGHT</p>
            <div className="weight-control">
              <button onClick={() => setWeight(Math.max(1, weight - 1))}><Minus size={18} /></button>
              <input type="range" min="1" max="45" value={weight} onChange={(event) => setWeight(Number(event.target.value))} />
              <button onClick={() => setWeight(weight + 1)}><Plus size={18} /></button>
            </div>
            <div className="chip-row">{[5, 10, 15, 20, 25, 30, 35, 40].map((value) => <button className={weight === value ? 'selected' : ''} key={value} onClick={() => setWeight(value)}>{value}</button>)}</div>
          </div>
          <div className="card control-card">
            <p className="section-label">LUGGAGE CATEGORY</p>
            <div className="chip-row category-row">{['Bag', 'Box', 'Suitcase', 'Fragile', 'Oversized'].map((name) => <button className={category === name ? 'selected' : ''} key={name} onClick={() => setCategory(name)}>{name}</button>)}</div>
          </div>
        </div>
        <PricingPreview weight={weight} totalDue={totalDue} onNavigate={onNavigate} />
      </div>
    </div>
  );
}

function ConfirmScreen({ weight, category, totalDue, confirmed, setConfirmed, onNavigate }) {
  return (
    <div className="workflow-page">
      <Stepper step={2} />
      <div className="center-title"><h1>Step 2 - Confirm Your Luggage Cost</h1><p>Please review the charges below. Check the box to confirm and proceed.</p></div>
      <div className="confirm-card card">
        <div className="confirm-top"><span>YOUR LUGGAGE WEIGHT</span><strong>{weight.toFixed(1)} <small>kg</small></strong><p>{category}</p></div>
        <CostRows weight={weight} totalDue={totalDue} />
        <label className="confirm-check"><input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} />I confirm the above weight and charges are correct and agree to proceed with registration.</label>
      </div>
      <div className="workflow-actions">
        <button className="ghost-button" onClick={() => onNavigate('weigh')}><RefreshCw size={17} />Dispute / Reweigh</button>
        <button className="solid-button" disabled={!confirmed} onClick={() => onNavigate('register')}>Confirmed - Register <ChevronRight size={18} /></button>
      </div>
    </div>
  );
}

function RegisterScreen({ form, setForm, weight, category, totalDue, onSubmit, onNavigate }) {
  return (
    <div className="workflow-page">
      <Stepper step={3} />
      <div className="center-title leftish"><h1>Step 3 - Register Luggage</h1><p>Cost confirmed: <strong>TSh {totalDue.toLocaleString()}</strong> - {weight.toFixed(1)} kg - {category}</p></div>
      <form className="register-form card" onSubmit={onSubmit}>
        <FormInput label="Passenger Full Name" value={form.passenger} placeholder="e.g. Amina Juma Bakari" onChange={(v) => setForm({ ...form, passenger: v })} />
        <FormInput label="Phone Number" value={form.phone} placeholder="+255 7XX XXX XXX" onChange={(v) => setForm({ ...form, phone: v })} />
        <FormInput label="National ID / Passport" value={form.nationalId} placeholder="19XXXXXXXXX" onChange={(v) => setForm({ ...form, nationalId: v })} />
        <FormInput label="Luggage Description" value={form.description} placeholder="e.g. Brown leather suitcase" onChange={(v) => setForm({ ...form, description: v })} />
        <SelectInput label="Origin Terminal" value={form.origin} placeholder="Select origin" onChange={(v) => setForm({ ...form, origin: v })} />
        <SelectInput label="Destination Terminal" value={form.destination} placeholder="Select destination" onChange={(v) => setForm({ ...form, destination: v })} />
        <FormInput label="Bus Number" value={form.bus} placeholder="e.g. DX-4521" onChange={(v) => setForm({ ...form, bus: v })} />
        <FormInput label="Departure Time" type="time" value={form.departure} onChange={(v) => setForm({ ...form, departure: v })} />
        <FormInput label="Declared Value (TSh)" value={form.declaredValue} placeholder="e.g. 250,000" onChange={(v) => setForm({ ...form, declaredValue: v })} />
        <label className="toggle-row"><button type="button" className={`toggle ${form.fragile ? 'on' : ''}`} onClick={() => setForm({ ...form, fragile: !form.fragile })}><span /></button>Fragile / Handle with Care</label>
        <div className="form-footer">
          <button type="button" className="ghost-button" onClick={() => onNavigate('confirm')}>Back</button>
          <button className="solid-button">Register & Assign RFID <Signal size={17} /></button>
        </div>
      </form>
    </div>
  );
}

function PaymentScreen({ row, provider, setProvider, phone, setPhone, totalDue, onPay }) {
  const active = row || demoRows[0];
  return (
    <div className="workflow-page payment-page">
      <Stepper step={4} />
      <div className="center-title payment-title"><h1>Step 4 - Make Payment</h1><p>Pay via mobile money to activate RFID tracking for your luggage.</p></div>
      <div className="payment-summary">
        <SummaryLine label="Passenger" value={active.passenger} />
        <SummaryLine label="Route" value={active.route} />
        <SummaryLine label="Weight" value={`${active.weight || 15}.0 kg - Bag`} />
        <SummaryLine label="RFID Tag" value={`${active.rfid || 'RF-Z7A8'} (pending activation)`} />
        <div className="summary-total"><strong>Total Amount</strong><b>TSh {Number(active.amount || totalDue).toLocaleString()}</b></div>
      </div>
      <div className="card provider-card">
        <h3>Select Payment Provider</h3>
        <div className="provider-grid">
          {paymentProviders.map((item) => <button className={provider === item.name ? 'active' : ''} key={item.name} onClick={() => setProvider(item.name)}><span className={item.color}><Wallet size={20} /></span><strong>{item.name}</strong><small>{item.brand}</small></button>)}
        </div>
        <FormInput label="Mobile Number" value={phone} placeholder="+255 7XX XXX XXX" onChange={setPhone} />
        <p>You will receive an SMS prompt to confirm</p>
        <button className="solid-button full" onClick={onPay}>Pay TSh {Number(active.amount || totalDue).toLocaleString()} <Zap size={18} /></button>
      </div>
    </div>
  );
}

function TrackingScreen({ livePulse }) {
  const alertCount = 3 + (livePulse % 2);
  return (
    <div className="tracking-page">
      <div className="page-title-row">
        <div><h1>Live Luggage Tracking</h1><p>RFID sensors detect luggage on each bus - GPS locates buses in real-time</p></div>
        <div className="tracking-pills"><span className="warn"><AlertTriangle size={17} />{alertCount} alerts</span><span className="live-dot">Live - RFID Active</span></div>
      </div>
      <div className="tracking-layout">
        <FleetList />
        <RouteMap livePulse={livePulse} />
        <div className="side-stack"><ManifestPanel /><EventsFeed livePulse={livePulse} /></div>
      </div>
    </div>
  );
}

function VerifyScreen({ manualCode, setManualCode, onVerify }) {
  return (
    <div className="verification-page">
      <div className="floating-alert"><CheckCircle2 size={22} /><span><strong>Luggage Arrived at Destination!</strong>TZ-2024-00887 - Ali Mohamed Juma - now at Moshi Terminal. PIN required for pickup.</span></div>
      <div className="center-title verification-title"><h1>QR / RFID Verification</h1><p>Scan tag or enter ID to verify</p></div>
      <div className="verify-grid">
        <div className="card scanner-card">
          <h3>Scanner</h3>
          <div className="scanner-box"><QrCode size={52} /><p>Point scanner at QR code or RFID tag</p></div>
          <button className="solid-button full" onClick={onVerify}><QrCode size={18} />Start Scan</button>
        </div>
        <div>
          <div className="card manual-card">
            <h3>Manual Entry</h3>
            <FormInput label="Tracking ID or RFID Tag" value={manualCode} placeholder="TZ-2024-XXXXX or RF-XXXX" onChange={setManualCode} />
            <button className="outline-green full" onClick={onVerify}>Verify</button>
          </div>
          <div className="card recent-card">
            <h3>Recent Verifications</h3>
            {['TZ-2024-00888   RF-B2C3   11:42   Verified', 'TZ-2024-00875   RF-D4E5   11:38   Verified', 'TZ-2024-00861   RF-????   11:30   Failed'].map((text) => <p key={text}>{text}</p>)}
          </div>
        </div>
      </div>
    </div>
  );
}

function PickupScreen({ row, pin, setPin, addPinDigit, deletePinDigit }) {
  return (
    <div className="pickup-page">
      <div className="center-title"><h1>Pickup PIN Confirmation</h1><p>Enter 4-digit PIN to release luggage</p></div>
      <div className="pickup-luggage card">
        <div className="pickup-main"><span><Package size={24} /></span><div><h3>{row.id}</h3><p>{row.passenger}</p></div><StatusBadge status={row.status} /></div>
        <div className="pickup-details"><Detail label="Route" value={row.route} /><Detail label="RFID Tag" value={row.rfid} link /></div>
      </div>
      <div className="pin-pad card">
        <div className="pin-dots">{[0, 1, 2, 3].map((dot) => <span className={pin.length > dot ? 'filled' : ''} key={dot} />)}</div>
        <div className="key-grid">{[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => <button key={digit} onClick={() => addPinDigit(digit)}>{digit}</button>)}<i /><button onClick={() => addPinDigit(0)}>0</button><button className="delete-key" onClick={deletePinDigit}><Trash2 size={20} /></button></div>
        <p>Hint: {row.pin}</p>
        {pin.length === 4 && <button className="ghost-button full" onClick={() => setPin('')}>Clear PIN</button>}
      </div>
    </div>
  );
}

function NotificationsScreen({ filter, setFilter }) {
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

function AccountScreen({ user, rows }) {
  const ownedRows = rows.filter((row) => !row.ownerEmail || row.ownerEmail === user.email);
  return (
    <div className="account-page narrow">
      <div className="page-title-row"><div><h1>My Luggage</h1><p>{user.email} - {user.role === 'ADMIN' ? 'admin account' : 'personal account'}</p></div></div>
      <div className="stats-row">
        <Stat icon={<Package />} label="MY ITEMS" value={ownedRows.length} note="Linked to this login" />
        <Stat icon={<Truck />} color="blue" label="IN TRANSIT" value={ownedRows.filter((row) => row.status === 'In Transit').length} note="Currently moving" />
        <Stat icon={<KeyRound />} label="PICKUPS" value={ownedRows.filter((row) => row.status === 'Pending Pickup').length} note="PIN required" />
      </div>
      <RecentTable rows={ownedRows.length ? ownedRows : rows.slice(0, 3)} />
    </div>
  );
}

function AdminScreen({ overview }) {
  return (
    <div className="admin-page">
      <div className="page-title-row"><div><h1>Admin Dashboard</h1><p>System management - Dar es Salaam Terminal</p></div></div>
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

function ReportsScreen() {
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

function Stepper({ step }) {
  const steps = ['Weigh Luggage', 'Confirm Cost', 'Register', 'Payment'];
  return <div className="stepper">{steps.map((label, index) => <div className={`step ${step > index + 1 ? 'done' : ''} ${step === index + 1 ? 'active' : ''}`} key={label}>{step > index + 1 ? <Check size={16} /> : index + 1}<strong>{label}</strong></div>)}</div>;
}

function ScaleDisplay({ weight }) {
  return <div className="scale-display"><span>GROSS WEIGHT - DIGITAL SCALE</span><strong>{weight.toFixed(1).padStart(5, '0')}</strong><b>kg</b><div className="bars">{Array.from({ length: 10 }).map((_, index) => <i key={index} style={{ height: 10 + index * 5 }} />)}</div></div>;
}

function PricingPreview({ weight, totalDue, onNavigate }) {
  return <div className="card pricing-card"><h2>Pricing Preview <span>Operator View</span></h2><CostRows weight={weight} totalDue={totalDue} compact /><button className="solid-button full" onClick={() => onNavigate('confirm')}>Show Cost to Customer <ChevronRight size={18} /></button><p>Customer confirms cost on next screen</p></div>;
}

function CostRows({ weight, totalDue, compact }) {
  return <div className={`cost-rows ${compact ? 'compact' : ''}`}><p><span>{compact ? `${weight.toFixed(1)} kg x TSh 600/kg` : `Weight charge (${weight.toFixed(1)} kg x TSh 600)`}</span><strong>TSh {Math.round(weight * 600).toLocaleString()}</strong></p><p><span>Insurance {compact ? '(1%)' : 'fee'}</span><strong>TSh {Math.round(weight * 6).toLocaleString()}</strong></p><p><span>{compact ? 'Terminal fee' : 'Terminal handling fee'}</span><strong>TSh 500</strong></p><div><strong>Total {compact ? 'Due' : 'Amount Due'}</strong><b>TSh {totalDue.toLocaleString()}</b></div></div>;
}

function RevenuePanel({ title = 'Weekly Revenue', compact }) {
  const curve = 'M 0 78 C 70 65, 122 58, 160 60 C 218 63, 248 105, 300 98 C 356 91, 390 52, 450 45 C 540 34, 600 25, 675 14 C 728 6, 770 24, 810 55';
  const area = `${curve} L 810 210 L 0 210 Z`;
  return <div className="card chart-panel"><h2>{title}<small>TSh (millions)</small></h2><svg viewBox="0 0 900 250" role="img" aria-label={title}><g className="grid-lines">{[30, 80, 130, 180, 230].map((y) => <line x1="40" x2="860" y1={y} y2={y} key={y} />)}{[40, 175, 310, 445, 580, 715, 850].map((x) => <line y1="30" y2="230" x1={x} x2={x} key={x} />)}</g><path className="chart-fill" d={area} transform="translate(40 20)" /><path className="chart-line" d={curve} transform="translate(40 20)" />{compact && [0, 135, 270, 405, 540, 675, 810].map((x, index) => <circle className="chart-dot" cx={x + 40} cy={[98, 80, 115, 65, 48, 34, 75][index]} r="6" key={x} />)}<g className="chart-labels"><text x="28" y="235">0</text><text x="20" y="185">0.65</text><text x="28" y="135">1.3</text><text x="18" y="85">1.95</text><text x="28" y="35">2.6</text>{['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => <text x={40 + i * 135} y="250" key={day}>{day}</text>)}</g></svg></div>;
}

function ProcessPanel() {
  return <div className="card process-panel"><h2>Process Flow</h2>{[['Weigh Luggage', 'Start here', Weight], ['Confirm Cost', 'Customer reviews', SquareCheckBig], ['Register Luggage', 'Assign RFID tag', Box], ['Make Payment', 'Mobile money', Wallet], ['Live Tracking', 'RFID + GPS', LocateFixed], ['Pickup PIN', 'Release luggage', KeyRound]].map(([name, hint, Icon]) => <p key={name}><Icon size={18} /><strong>{name}</strong><span>{hint}</span></p>)}</div>;
}

function RecentTable({ rows }) {
  return <div className="card recent-table"><div className="table-title"><h2>Recent Registrations</h2><button>View all</button></div><table><thead><tr><th>TRACKING ID</th><th>PASSENGER</th><th>ROUTE</th><th>WEIGHT</th><th>BUS</th><th>STATUS</th><th>AMOUNT</th><th>TIME</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id}><td>{row.id}</td><td><strong>{row.passenger}</strong></td><td>{row.route}</td><td><b>{row.weight} kg</b></td><td>{row.bus}</td><td><StatusBadge status={row.status} /></td><td><b>TSh {Number(row.amount).toLocaleString()}</b></td><td>{row.time}</td></tr>)}</tbody></table></div>;
}

function FleetList() {
  return <div><p className="section-label">ACTIVE FLEET</p>{[['DX-4521', 'DSM -> Arusha', 5, 'On Schedule'], ['KK-2208', 'Mwanza -> DSM', 3, 'On Schedule'], ['SC-7730', 'Arusha -> Moshi', 2, 'Delayed'], ['DX-4522', 'DSM -> Mbeya', 3, 'On Schedule']].map((bus, index) => <div className={`fleet-card ${index === 2 ? 'selected' : ''}`} key={bus[0]}><strong>{bus[0]}<span>1A</span></strong><p>{bus[1]}</p><i><b style={{ width: `${70 - index * 12}%` }} /></i><small><Package size={13} />{bus[2]}<em>{bus[3]}</em></small></div>)}</div>;
}

function RouteMap({ livePulse }) {
  const cities = [['Mwanza', 32, 18], ['Dodoma', 58, 56], ['DSM', 88, 62], ['Moshi', 80, 26], ['Tanga', 88, 42], ['Mbeya', 38, 84], ['Iringa', 58, 72]];
  return <div className="map-card card"><div className="map-head"><strong>Tanzania GPS Route Map</strong><span><i />Route <b />Bus <em />Arrived <u />Selected</span></div><div className="map-canvas">{cities.map(([name, x, y]) => <span className="city" style={{ left: `${x}%`, top: `${y}%` }} key={name}>{name}</span>)}<span className="route-sweep" /><span className="bus-dot first" style={{ transform: `translate(${livePulse % 2 ? 18 : 0}px, ${livePulse % 2 ? -12 : 0}px)` }}>DX</span><span className="bus-dot second" style={{ transform: `translate(${livePulse % 2 ? -10 : 6}px, ${livePulse % 2 ? 8 : -4}px)` }}>KK</span><span className="bus-dot selected">SC-7730</span></div><div className="map-footer"><strong>SC-7730</strong><span>{'Arusha -> Moshi'}</span><code>Moshi outskirts</code><b>Delayed</b></div></div>;
}

function ManifestPanel() {
  return <div className="card manifest-panel"><h3><Signal size={17} />Bus SC-7730 - RFID Manifest <span>2 bags</span></h3>{['RF-Q7R8|TZ-2024-00893|Fatuma Hassan Said|On Bus', 'RF-S9T0|TZ-2024-00887|Ali Mohamed Juma|On Bus'].map((line) => { const [rfid, id, name, status] = line.split('|'); return <div key={rfid}><strong>{rfid}</strong><b>{status}</b><p>{id}</p><p>{name}</p><small>{'Arusha -> Moshi'}</small></div>; })}</div>;
}

function EventsFeed({ livePulse }) {
  const liveTime = new Date().toLocaleTimeString([], { hour12: false });
  const events = [
    `${liveTime} RF-A1B2 (TZ-2024-00891 - Amina Juma) - confirmed on DX-4521`,
    '12:40:18 RF-C3D4 (TZ-2024-00885 - Hassan Ally) - confirmed on DX-4521',
    `${livePulse % 2 ? '12:40:25' : liveTime} RF-E5F6 (TZ-2024-00878 - Mary Kilua) - NOT responding on DX-4521`,
    '12:41:03 RF-K1L2 (TZ-2024-00895 - Neema Swai) - confirmed on KK-2208'
  ];
  return <div className="card feed-panel"><h3><BarChart3 size={17} />RFID Events Feed <span /></h3>{events.map((event, index) => <p className={index === 2 ? 'danger-text' : ''} key={event}>{event}</p>)}</div>;
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

function Stat({ icon, label, value, note, color = 'green' }) {
  return <div className="stat-box card"><span className={`stat-icon ${color}`}>{icon}</span><div><p>{label}</p><strong>{value}</strong><small>{note}</small></div></div>;
}

function FormInput({ label, value, onChange, placeholder, type = 'text' }) {
  return <label className="form-field"><span>{label}</span><input type={type} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} /></label>;
}

function SelectInput({ label, value, onChange, placeholder }) {
  return <label className="form-field"><span>{label}</span><select value={value} onChange={(event) => onChange(event.target.value)}><option value="">{placeholder}</option>{terminals.map((terminal) => <option key={terminal}>{terminal}</option>)}</select></label>;
}

function SummaryLine({ label, value }) {
  return <p><span>{label}</span><strong>{value}</strong></p>;
}

function Detail({ label, value, link }) {
  return <p><span>{label}</span><strong className={link ? 'link' : ''}>{value}</strong></p>;
}

function StatusBadge({ status }) {
  return <span className={`status-badge ${status.toLowerCase().replaceAll(' ', '-')}`}>{status}</span>;
}

function HealthRow({ name, offline, ping }) {
  return <p className="health-row"><i className={offline ? 'offline' : ''} />{name}<span>{ping}</span><b className={offline ? 'offline-text' : ''}>{offline ? 'Offline' : 'Online'}</b></p>;
}

function StaffRow({ item }) {
  const [name, role, initials, status] = item.split('|');
  return <p className="staff-row"><span>{initials}</span><strong>{name}<small>{role}</small></strong><b className={status === 'On Break' ? 'break' : ''}>{status}</b></p>;
}

function mapApiRows(apiRows) {
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

function formatStatus(status) {
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

function initials(name = 'User') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'U';
}

createRoot(document.getElementById('root')).render(<App />);
