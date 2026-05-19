import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';

interface Stat {
  label: string;
  value: number | string;
  icon: string;
}

interface User {
  id: string;
  email: string;
  role: string;
  createdAt: string;
}

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'system' | 'settings'>('overview');
  const [users, setUsers] = useState<User[]>([
    { id: '1', email: 'admin@smt.com', role: 'admin', createdAt: '2026-01-01' },
    { id: '2', email: 'supervisor@smt.com', role: 'supervisor', createdAt: '2026-01-05' },
  ]);

  const stats: Stat[] = [
    { label: 'Total Users', value: 42, icon: '👥' },
    { label: 'Active Sessions', value: 8, icon: '🔄' },
    { label: 'BOMs', value: 156, icon: '📦' },
    { label: 'Scans Today', value: 234, icon: '🔍' },
    { label: 'System Health', value: '99.9%', icon: '✅' },
    { label: 'API Endpoints', value: 42, icon: '🔌' },
  ];

  const recentActivities = [
    { action: 'User created', user: 'alice@smt.com', time: '2 mins ago', type: 'success' },
    { action: 'BOM updated', user: 'bob@smt.com', time: '5 mins ago', type: 'info' },
    { action: 'Scan completed', user: 'charlie@smt.com', time: '12 mins ago', type: 'success' },
    { action: 'Session ended', user: 'david@smt.com', time: '25 mins ago', type: 'info' },
  ];

  return (
    <div className="admin-app">
      <header className="admin-header">
        <div className="header-content">
          <h1>SMT Verification Admin</h1>
          <p>System Administration & Monitoring Dashboard</p>
        </div>
        <div className="header-info">
          <span>👤 Administrator</span>
          <span>🟢 Connected</span>
        </div>
      </header>

      <nav className="admin-nav">
        <button 
          className={`nav-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          📊 Overview
        </button>
        <button 
          className={`nav-btn ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          👥 Users
        </button>
        <button 
          className={`nav-btn ${activeTab === 'system' ? 'active' : ''}`}
          onClick={() => setActiveTab('system')}
        >
          ⚙️ System
        </button>
        <button 
          className={`nav-btn ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          🔧 Settings
        </button>
      </nav>

      <main className="admin-main">
        {activeTab === 'overview' && (
          <div className="tab-content">
            <h2>System Overview</h2>
            
            <section className="stats-grid">
              {stats.map((stat) => (
                <div key={stat.label} className="stat-card">
                  <div className="stat-icon">{stat.icon}</div>
                  <div className="stat-info">
                    <div className="stat-value">{stat.value}</div>
                    <div className="stat-label">{stat.label}</div>
                  </div>
                </div>
              ))}
            </section>

            <section className="recent-activity">
              <h3>Recent Activity</h3>
              <table className="activity-table">
                <thead>
                  <tr>
                    <th>Action</th>
                    <th>User</th>
                    <th>Time</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentActivities.map((activity, idx) => (
                    <tr key={idx}>
                      <td>{activity.action}</td>
                      <td>{activity.user}</td>
                      <td>{activity.time}</td>
                      <td><span className={`badge ${activity.type}`}>{activity.type}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="tab-content">
            <div className="section-header">
              <h2>User Management</h2>
              <button className="btn-primary">+ Add User</button>
            </div>
            
            <table className="users-table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="email-cell">{user.email}</td>
                    <td><span className="role-badge">{user.role}</span></td>
                    <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                    <td className="actions">
                      <button className="btn-small">Edit</button>
                      <button className="btn-small danger">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'system' && (
          <div className="tab-content">
            <h2>System Configuration</h2>
            
            <section className="system-info">
              <div className="info-group">
                <h3>Server Status</h3>
                <div className="info-item">
                  <span className="label">API Server:</span>
                  <span className="status-indicator ok">✅ Running</span>
                  <span className="url">http://localhost:3000</span>
                </div>
                <div className="info-item">
                  <span className="label">Database:</span>
                  <span className="status-indicator ok">✅ Connected</span>
                  <span className="url">PostgreSQL 16</span>
                </div>
                <div className="info-item">
                  <span className="label">Socket.IO:</span>
                  <span className="status-indicator ok">✅ Active</span>
                  <span className="url">ws://localhost:3000</span>
                </div>
              </div>

              <div className="info-group">
                <h3>System Metrics</h3>
                <div className="info-item">
                  <span className="label">Uptime:</span>
                  <span>45 days, 12 hours</span>
                </div>
                <div className="info-item">
                  <span className="label">API Requests/Hour:</span>
                  <span>1,234</span>
                </div>
                <div className="info-item">
                  <span className="label">Database Connections:</span>
                  <span>8 / 25</span>
                </div>
                <div className="info-item">
                  <span className="label">Disk Usage:</span>
                  <span>45.2 GB / 500 GB</span>
                </div>
              </div>

              <div className="info-group">
                <h3>Integration Tests</h3>
                <div className="test-results">
                  <div className="test-item">
                    <span className="test-name">Health Routes</span>
                    <span className="test-count">4/4</span>
                    <span className="test-status pass">✅ Pass</span>
                  </div>
                  <div className="test-item">
                    <span className="test-name">User Routes</span>
                    <span className="test-count">24/24</span>
                    <span className="test-status pass">✅ Pass</span>
                  </div>
                  <div className="test-item">
                    <span className="test-name">BOM Routes</span>
                    <span className="test-count">21/21</span>
                    <span className="test-status pass">✅ Pass</span>
                  </div>
                  <div className="test-item">
                    <span className="test-name">Session Routes</span>
                    <span className="test-count">19/19</span>
                    <span className="test-status pass">✅ Pass</span>
                  </div>
                  <div className="test-item">
                    <span className="test-name">Scan Routes</span>
                    <span className="test-count">17/17</span>
                    <span className="test-status pass">✅ Pass</span>
                  </div>
                  <div className="test-item">
                    <span className="test-name">Audit Routes</span>
                    <span className="test-count">17/17</span>
                    <span className="test-status pass">✅ Pass</span>
                  </div>
                  <div className="test-item">
                    <span className="test-name">Metrics Routes</span>
                    <span className="test-count">19/19</span>
                    <span className="test-status pass">✅ Pass</span>
                  </div>
                  <div className="test-item">
                    <span className="test-name">E2E Workflows</span>
                    <span className="test-count">10/10</span>
                    <span className="test-status pass">✅ Pass</span>
                  </div>
                  <div className="test-summary">
                    <strong>Total: 131/131 Tests Passing ✅</strong>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="tab-content">
            <h2>System Settings</h2>
            
            <section className="settings-group">
              <h3>General Settings</h3>
              <div className="setting-item">
                <label>System Name</label>
                <input type="text" defaultValue="SMT Verification" />
              </div>
              <div className="setting-item">
                <label>Max Concurrent Scans</label>
                <input type="number" defaultValue="20" />
              </div>
              <div className="setting-item">
                <label>Session Timeout (minutes)</label>
                <input type="number" defaultValue="30" />
              </div>
            </section>

            <section className="settings-group">
              <h3>Security Settings</h3>
              <div className="setting-item">
                <label>
                  <input type="checkbox" defaultChecked /> Require 2FA for admin users
                </label>
              </div>
              <div className="setting-item">
                <label>
                  <input type="checkbox" defaultChecked /> Audit all API calls
                </label>
              </div>
              <div className="setting-item">
                <label>
                  <input type="checkbox" /> Enable IP whitelist
                </label>
              </div>
            </section>

            <section className="settings-group">
              <h3>Notifications</h3>
              <div className="setting-item">
                <label>
                  <input type="checkbox" defaultChecked /> Email alerts
                </label>
              </div>
              <div className="setting-item">
                <label>
                  <input type="checkbox" defaultChecked /> Slack notifications
                </label>
              </div>
            </section>

            <div className="settings-footer">
              <button className="btn-primary">Save Settings</button>
              <button className="btn-secondary">Reset to Default</button>
            </div>
          </div>
        )}
      </main>

      <footer className="admin-footer">
        <p>SMT Verification System v1.0.0 | API: http://localhost:3000 | Admin Desktop</p>
      </footer>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(<AdminDashboard />);
