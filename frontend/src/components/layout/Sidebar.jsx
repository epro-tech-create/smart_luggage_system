import React from 'react';
import { LogOut, Package } from 'lucide-react';
import { initials, navItems } from '../../models/luggageModels.jsx';

export function Sidebar({ active, onNavigate, unreadCount, user, onLogout }) {
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
