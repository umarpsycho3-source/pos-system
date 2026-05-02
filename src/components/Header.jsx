import React, { useState, useEffect } from 'react';
import { Bell, Search, User } from 'lucide-react';
import './Header.css';

export default function Header({ title }) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="header">
      <div className="header-title">
        <h1>{title}</h1>
      </div>
      
      <div className="header-actions">
        <div className="search-bar glass-panel">
          <Search size={18} className="text-secondary" />
          <input type="text" placeholder="Search..." className="search-input" />
        </div>

        <div className="time-display glass-panel">
          {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
        
        <button className="btn-icon">
          <Bell size={20} />
        </button>
        
        <div className="user-profile glass-panel">
          <div className="avatar">
            <User size={18} />
          </div>
          <div className="user-info">
            <span className="user-name">Sarah Connor</span>
            <span className="user-role">Manager</span>
          </div>
        </div>
      </div>
    </header>
  );
}
