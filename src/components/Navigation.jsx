import React from 'react';
import { 
  Timer, 
  History, 
  BarChart3, 
  Settings, 
  Flame,
  CalendarCheck
} from 'lucide-react';

export function Navigation({ activeTab, setActiveTab, activeTaskCount = 0, isTimerRunning = false }) {
  const navItems = [
    { id: 'tracker', label: 'Tracker', icon: Timer, count: activeTaskCount },
    { id: 'checkin', label: 'Check-in', icon: CalendarCheck },
    { id: 'history', label: 'Riwayat', icon: History },
    { id: 'reports', label: 'Laporan', icon: BarChart3 },
    { id: 'settings', label: 'Pengaturan', icon: Settings },
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="desktop-sidebar desktop-only">
        <div className="brand-header">
          <div className="brand-icon">
            <Flame size={18} />
          </div>
          <div>
            <div className="brand-title">HabitPulse</div>
          </div>
        </div>

        <nav className="nav-menu">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`nav-link ${isActive ? 'active' : ''}`}
              >
                <Icon size={17} />
                <span>{item.label}</span>
                {item.id === 'tracker' && isTimerRunning && (
                  <span className="pulse-dot" style={{ marginLeft: 'auto' }} />
                )}
                {item.id === 'tracker' && !isTimerRunning && item.count > 0 && (
                  <span className="nav-badge-count">{item.count}</span>
                )}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Android Ergonomic Bottom Dock */}
      <nav className="mobile-bottom-nav mobile-only">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`mobile-nav-item ${isActive ? 'active' : ''}`}
            >
              <div style={{ position: 'relative' }}>
                <Icon size={19} />
                {item.id === 'tracker' && isTimerRunning && (
                  <span 
                    className="pulse-dot" 
                    style={{ position: 'absolute', top: -1, right: -3, width: 5, height: 5 }} 
                  />
                )}
              </div>
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
