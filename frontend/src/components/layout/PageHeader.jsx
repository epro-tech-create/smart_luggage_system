import { Bell, ChevronRight, LogOut, Search } from 'lucide-react';
import { initials } from '../../models/luggageModels.jsx';

export function PageHeader({ screen, search, setSearch, now, apiOnline, user, unreadCount, onNavigate, onLogout }) {
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
  const profileTarget = user?.role === 'CUSTOMER' ? 'account' : user?.role === 'SUPER_ADMINISTRATOR' ? 'admin' : 'dashboard';

  return (
    <section className="page-header">
      <div className="breadcrumb">SafiriBag <ChevronRight size={16} /> <strong>{labels[screen]}</strong></div>
      <div className="header-tools">
        <label className="search-box"><Search size={18} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search luggage ID..." /></label>
        <span className={`api-chip ${apiOnline ? 'online' : ''}`}>{apiOnline ? 'API Live' : 'Demo Mode'}</span>
        <span className="clock-chip">{now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        <button className="bell-button" onClick={() => onNavigate('notifications')} title="Open notifications"><Bell size={21} />{unreadCount > 0 && <span>{unreadCount}</span>}</button>
        <button className="header-user-button" onClick={() => onNavigate(profileTarget)} title="Open account details">
          <span className="top-avatar">{initials(user?.fullName)}</span>
          <strong>{user?.fullName?.split(' ')[0]}</strong>
        </button>
        <button className="mini-logout" onClick={onLogout}><LogOut size={17} /></button>
      </div>
      <div className="terminal-strip"><span /><span /><span /></div>
    </section>
  );
}
