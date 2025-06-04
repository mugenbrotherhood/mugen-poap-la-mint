import React, { useState, useEffect } from 'react';
import QRGenerator from './QRGenerator';
import '../styles/qr-styles.css';

const OrganizerDashboard = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [eventConfig, setEventConfig] = useState({
    eventId: process.env.REACT_APP_DEFAULT_EVENT_ID || 'mugen-la-2025',
    baseUrl: 'https://mugen-poap-mint.vercel.app',
    refreshInterval: 30000
  });
  const [stats, setStats] = useState({
    totalScans: 0,
    totalMints: 0,
    totalRefreshes: 0,
    lastActivity: null,
    activeUsers: 0
  });
  const [fullscreenQR, setFullscreenQR] = useState(false);

  // Check if already authenticated
  useEffect(() => {
    const authStatus = localStorage.getItem('mugen-organizer-auth');
    if (authStatus === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  // Load statistics
  useEffect(() => {
    const loadStats = () => {
      const savedStats = JSON.parse(localStorage.getItem('mugen-qr-stats') || '{}');
      setStats({
        totalScans: savedStats.totalScans || 0,
        totalMints: savedStats.totalMints || 0,
        totalRefreshes: savedStats.totalRefreshes || 0,
        lastActivity: savedStats.lastActivity || null,
        activeUsers: savedStats.activeUsers || 0
      });
    };

    loadStats();
    
    // Update stats every 5 seconds
    const interval = setInterval(loadStats, 5000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  // Handle authentication
  const handleLogin = (e) => {
    e.preventDefault();
    const correctPassword = process.env.REACT_APP_ORGANIZER_PASSWORD || 'mugen2025';
    
    if (password === correctPassword) {
      setIsAuthenticated(true);
      setError('');
      localStorage.setItem('mugen-organizer-auth', 'true');
      
      // Log organizer login
      const stats = JSON.parse(localStorage.getItem('mugen-qr-stats') || '{}');
      stats.organizerLogins = (stats.organizerLogins || 0) + 1;
      stats.lastOrganizerLogin = new Date().toISOString();
      localStorage.setItem('mugen-qr-stats', JSON.stringify(stats));
    } else {
      setError('Invalid password. Please try again.');
      setPassword('');
    }
  };

  // Handle logout
  const handleLogout = () => {
    setIsAuthenticated(false);
    setPassword('');
    localStorage.removeItem('mugen-organizer-auth');
  };

  // Update event configuration
  const updateEventConfig = (key, value) => {
    setEventConfig(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Clear statistics
  const clearStats = () => {
    if (window.confirm('Are you sure you want to clear all statistics? This action cannot be undone.')) {
      localStorage.removeItem('mugen-qr-stats');
      setStats({
        totalScans: 0,
        totalMints: 0,
        totalRefreshes: 0,
        lastActivity: null,
        activeUsers: 0
      });
    }
  };

  // Format date/time
  const formatDateTime = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  };

  // Export statistics
  const exportStats = () => {
    const data = JSON.parse(localStorage.getItem('mugen-qr-stats') || '{}');
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `mugen-stats-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // If not authenticated, show login form
  if (!isAuthenticated) {
    return (
      <div className="qr-page">
        <div className="qr-container">
          <div className="auth-container">
            <h1 className="auth-title">Organizer Access</h1>
            <form onSubmit={handleLogin} className="auth-form">
              <input
                type="password"
                placeholder="Enter organizer password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="auth-input"
                autoFocus
              />
              {error && (
                <div style={{ color: 'var(--mugen-warning)', fontSize: '0.9rem' }}>
                  {error}
                </div>
              )}
              <button type="submit" className="auth-button">
                Access Dashboard
              </button>
            </form>
            <div style={{ marginTop: '20px', fontSize: '0.8rem', color: 'var(--mugen-text-secondary)' }}>
              Default password: mugen2025
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="qr-page">
      <div className="qr-container">
        <div className="organizer-dashboard">
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
            <div>
              <h1 className="qr-title">Organizer Dashboard</h1>
              <p className="qr-subtitle">Manage QR codes and monitor event activity</p>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                className="qr-button secondary"
                onClick={() => setFullscreenQR(true)}
              >
                📱 Fullscreen QR
              </button>
              <button 
                className="qr-button secondary" 
                onClick={handleLogout}
              >
                🚪 Logout
              </button>
            </div>
          </div>

          {/* Statistics Dashboard */}
          <div className="dashboard-grid">
            <div className="dashboard-card">
              <h3 className="card-title">📊 Event Statistics</h3>
              <div className="stats-grid">
                <div className="stat-item">
                  <div className="stat-value">{stats.totalScans}</div>
                  <div className="stat-label">Total Scans</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">{stats.totalMints}</div>
                  <div className="stat-label">POAPs Minted</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">{stats.totalRefreshes}</div>
                  <div className="stat-label">QR Refreshes</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">{stats.activeUsers}</div>
                  <div className="stat-label">Active Users</div>
                </div>
              </div>
              <div style={{ marginTop: '16px', fontSize: '0.9rem', color: 'var(--mugen-text-secondary)' }}>
                Last Activity: {formatDateTime(stats.lastActivity)}
              </div>
            </div>

            <div className="dashboard-card">
              <h3 className="card-title">⚙️ Event Configuration</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>
                    Event ID:
                  </label>
                  <input
                    type="text"
                    value={eventConfig.eventId}
                    onChange={(e) => updateEventConfig('eventId', e.target.value)}
                    className="auth-input"
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>
                    Refresh Interval:
                  </label>
                  <select
                    value={eventConfig.refreshInterval}
                    onChange={(e) => updateEventConfig('refreshInterval', parseInt(e.target.value))}
                    className="auth-input"
                    style={{ width: '100%' }}
                  >
                    <option value={15000}>15 seconds</option>
                    <option value={30000}>30 seconds</option>
                    <option value={60000}>1 minute</option>
                    <option value={120000}>2 minutes</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>
                    Base URL:
                  </label>
                  <input
                    type="url"
                    value={eventConfig.baseUrl}
                    onChange={(e) => updateEventConfig('baseUrl', e.target.value)}
                    className="auth-input"
                    style={{ width: '100%' }}
                  />
                </div>
              </div>
            </div>

            <div className="dashboard-card">
              <h3 className="card-title">🛠️ Management Tools</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <button 
                  className="qr-button"
                  onClick={exportStats}
                >
                  📊 Export Statistics
                </button>
                <button 
                  className="qr-button secondary"
                  onClick={clearStats}
                >
                  🗑️ Clear Statistics
                </button>
                <button 
                  className="qr-button secondary"
                  onClick={() => window.location.reload()}
                >
                  🔄 Refresh Dashboard
                </button>
              </div>
              <div style={{ 
                marginTop: '16px', 
                padding: '12px',
                background: 'var(--mugen-darker)',
                borderRadius: '8px',
                fontSize: '0.8rem',
                color: 'var(--mugen-text-secondary)'
              }}>
                Dashboard Version: 1.0.0<br/>
                Connected: ✅ Online
              </div>
            </div>
          </div>

          {/* QR Generator */}
          <div className="dashboard-card" style={{ marginTop: '24px' }}>
            <QRGenerator
              eventId={eventConfig.eventId}
              baseUrl={eventConfig.baseUrl}
              refreshInterval={eventConfig.refreshInterval}
              onScan={() => {
                // Update scan statistics
                const newStats = JSON.parse(localStorage.getItem('mugen-qr-stats') || '{}');
                newStats.totalScans = (newStats.totalScans || 0) + 1;
                newStats.lastActivity = new Date().toISOString();
                localStorage.setItem('mugen-qr-stats', JSON.stringify(newStats));
              }}
            />
          </div>
        </div>
      </div>

      {/* Fullscreen QR Modal */}
      {fullscreenQR && (
        <QRGenerator
          eventId={eventConfig.eventId}
          baseUrl={eventConfig.baseUrl}
          refreshInterval={eventConfig.refreshInterval}
          fullscreen={true}
          onExitFullscreen={() => setFullscreenQR(false)}
        />
      )}
    </div>
  );
};

export default OrganizerDashboard; 