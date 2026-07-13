import React from 'react';
import { LogOut, Package } from 'lucide-react';
import { initials, navByRole, roleLabels } from '../../models/luggageModels.jsx';

export function Sidebar({ active, onNavigate, unreadCount, user, onLogout }) {
  const visibleItems = navByRole[user?.role] || [];
  const profileTarget = user?.role === 'CUSTOMER' ? 'account' : user?.role === 'SUPER_ADMINISTRATOR' ? 'admin' : 'dashboard';
  return (
    <aside className="sidebar">
      <div className="brand-row">
        <div className="brand-icon"><Package size={23} /></div>
        <div><strong>SafiriBag</strong><span>Terminal System - TZ</span></div>
      </div>
      <nav>
        <p className="nav-group">{user?.role === 'CUSTOMER' ? 'MY LUGGAGE' : 'OPERATIONS'}</p>
        {visibleItems.map((item) => {
          const Icon = item.icon;
          return (
            <React.Fragment key={item.key}>
              <button className={`nav-item ${active === item.key ? 'active' : ''}`} onClick={() => onNavigate(item.key)}>
                <Icon size={19} />
                <span>{item.label}</span>
                {item.count && unreadCount > 0 && <b>{unreadCount}</b>}
              </button>
            </React.Fragment>
          );
        })}
      </nav>
      <div className="profile-card" onClick={() => onNavigate(profileTarget)} onKeyDown={(event) => { if (event.key === 'Enter') onNavigate(profileTarget); }} role="button" tabIndex={0} title="Open account details">
        <div className="avatar">{initials(user?.fullName)}</div>
        <div><strong>{user?.fullName}</strong><span>{roleLabels[user?.role] || 'Account'}</span></div>
        <button className="logout-icon" onClick={(event) => { event.stopPropagation(); onLogout(); }} title="Logout"><LogOut size={18} /></button>
      </div>
    </aside>
  );
}
