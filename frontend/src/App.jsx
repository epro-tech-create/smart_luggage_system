import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { apiRequest, clearStoredAuth, readStoredAuth, saveStoredAuth } from './api/client.js';
import { demoRows, mapApiRows } from './models/luggageModels.jsx';
import { Sidebar } from './components/layout/Sidebar.jsx';
import { PageHeader } from './components/layout/PageHeader.jsx';
import { AuthScreen } from './components/auth/AuthScreen.jsx';
import { Dashboard } from './pages/Dashboard.jsx';
import { WeighScreen, ConfirmScreen, RegisterScreen, PaymentScreen } from './pages/WorkflowPages.jsx';
import { TrackingScreen, VerifyScreen, PickupScreen } from './pages/TrackingPages.jsx';
import { AccountScreen, AdminScreen, NotificationsScreen, ReportsScreen } from './pages/AdminPages.jsx';

const emptyRegistrationForm = {
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
};

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => readStoredAuth());
  const [authMode, setAuthMode] = useState('login');
  const [authError, setAuthError] = useState('');
  const [authForm, setAuthForm] = useState({ fullName: '', email: '', phoneNumber: '', password: '', selectedRole: 'CUSTOMER' });
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
  const [form, setForm] = useState(emptyRegistrationForm);

  useEffect(() => {
    if (!currentUser?.token) return;
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
    if (currentUser?.role !== 'SUPER_ADMINISTRATOR') {
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

  async function loadBackendData() {
    try {
      const [stats, luggage] = await Promise.all([apiRequest('/dashboard'), apiRequest('/luggage')]);
      setApiStats(stats);
      setApiRows(luggage);
      setApiOnline(true);
      if (luggage.length && !selectedTrackingCode) setSelectedTrackingCode(luggage[0].trackingCode);
      return luggage;
    } catch {
      setApiOnline(false);
      setApiStats(null);
      return [];
    }
  }

  async function refreshBackendData() {
    const [stats, luggage] = await Promise.all([apiRequest('/dashboard'), apiRequest('/luggage')]);
    setApiStats(stats);
    setApiRows(luggage);
    setApiOnline(true);
    return luggage;
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

  async function submitAuth(event) {
    event.preventDefault();
    setAuthError('');
    try {
      const path = authMode === 'login' ? '/auth/login' : '/auth/register';
      const payload = authMode === 'login'
        ? { email: authForm.email, password: authForm.password, selectedRole: authForm.selectedRole }
        : authForm;
      const auth = await apiRequest(path, { method: 'POST', body: JSON.stringify(payload) });
      setCurrentUser(auth);
      saveStoredAuth(auth);
      setToast(`Welcome, ${auth.fullName}`);
      setScreen('dashboard');
    } catch (error) {
      setAuthError(error.message);
    }
  }

  function logout() {
    clearStoredAuth();
    setCurrentUser(null);
    setScreen('dashboard');
    setApiRows([]);
    setApiStats(null);
    setApiOnline(false);
  }

  function navigate(next) {
    const permitted = new Set({
      SUPER_ADMINISTRATOR: ['dashboard', 'admin', 'reports', 'notifications'],
      BUS_COMPANY_ADMINISTRATOR: ['dashboard', 'tracking', 'verify', 'reports', 'notifications'],
      TERMINAL_OFFICER: ['dashboard', 'weigh', 'register', 'verify', 'pickup', 'notifications'],
      CUSTOMER: ['dashboard', 'register', 'payment', 'tracking', 'account', 'notifications']
    }[currentUser?.role] || []);
    if (!permitted.has(next)) {
      setToast('This page is not available for your role.');
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
      setForm(emptyRegistrationForm);
      setToast(`${created.trackingCode} registered and RFID assigned`);
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
        body: JSON.stringify({ provider, phoneNumber: phone || paymentRow.receiverPhone || '+255700000000' })
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
    if (pin.length !== 4) return;
    async function verifyPickup() {
      try {
        const code = activeRow.trackingCode || activeRow.id;
        await apiRequest(`/luggage/${code}/verify-pickup`, {
          method: 'POST',
          body: JSON.stringify({ pickupPin: pin, receiverPhone: activeRow.receiverPhone || '+255700000000' })
        });
        await refreshBackendData();
        setToast('Pickup PIN accepted. Luggage released.');
      } catch {
        setToast(pin === activeRow.pin ? 'Pickup PIN accepted. Luggage released.' : 'Incorrect PIN. Please retry.');
        if (pin === activeRow.pin) setRows(rows.map((row) => row.id === activeRow.id ? { ...row, status: 'Delivered' } : row));
      }
    }
    verifyPickup();
  }, [pin]);

  if (!currentUser) {
    return <AuthScreen mode={authMode} setMode={setAuthMode} form={authForm} setForm={setAuthForm} error={authError} onSubmit={submitAuth} />;
  }

  return (
    <div className="app-shell">
      <Sidebar active={screen} onNavigate={navigate} unreadCount={appRows.filter((row) => row.status === 'Pending Pickup' || row.status === 'Arrived').length + 2} user={currentUser} onLogout={logout} />
      <div className="main-column">
        <PageHeader screen={screen} search={search} setSearch={setSearch} now={now} apiOnline={apiOnline} user={currentUser} onLogout={logout} />
        <main className="content-area">
          {screen === 'dashboard' && <Dashboard rows={visibleRows} stats={apiStats} onNavigate={navigate} now={now} user={currentUser} />}
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
