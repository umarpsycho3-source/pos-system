import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  Briefcase,
  BarChart3,
  Settings,
  LogOut,
} from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import './Sidebar.css';

const navItems = [
  { path: '/', name: 'POS Terminal', icon: ShoppingCart },
  { path: '/dashboard', name: 'Dashboard', icon: LayoutDashboard },
  { path: '/reports', name: 'Reports', icon: BarChart3 },
  { path: '/inventory', name: 'Inventory', icon: Package },
  { path: '/customers', name: 'Customers', icon: Users },
  { path: '/employees', name: 'Employees', icon: Briefcase },
  { path: '/settings', name: 'Settings', icon: Settings },
  { path: '/day-end', name: 'Day End', icon: LogOut },
];

export default function Sidebar() {
  const { shopName, logout } = useSettings();

  return (
    <div className="sidebar glass-panel">
      <div className="sidebar-header">
        <div className="logo">
          <div className="logo-icon">*</div>
          <h2>{shopName}</h2>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <item.icon className="nav-icon" size={20} />
            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button className="btn btn-glass w-full logout-btn" onClick={logout}>
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}
