import { useEffect, useMemo, useState } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { apiClient } from '@smt/api-types';

interface User {
  id: string;
  email: string;
  role: 'admin' | 'supervisor' | 'qa' | 'operator';
  createdAt: string;
}

interface Session {
  sessionId: string;
  status: 'active' | 'completed' | 'paused' | 'cancelled';
  totalScans: number;
  passCount: number;
  failCount: number;
  createdAt: string;
}

interface Health {
  status: 'ok' | 'degraded' | 'error';
  timestamp: string;
  database: 'connected' | 'disconnected';
  uptime: number;
}

const navItems = [
  { label: 'Dashboard', icon: 'dashboard', active: true },
  { label: 'Verification', icon: 'fact_check' },
  { label: 'Inventory', icon: 'inventory_2' },
  { label: 'Logs', icon: 'history_edu' },
  { label: 'Users', icon: 'group' },
  { label: 'Settings', icon: 'settings' },
];

function formatDateTime(value: string) {
  return new Date(value).toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function formatPercentage(passed: number, total: number) {
  if (!total) {
    return '0%';
  }

  return `${Math.round((passed / total) * 100)}%`;
}

function App() {
  const [query, setQuery] = useState('');
  const [health, setHealth] = useState<Health | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<string | null>(null);

  const loadDashboard = async (silentRefresh = false) => {
    try {
      if (silentRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError(null);
      await apiClient.ensureTestToken();

      const [healthRes, usersRes, sessionsRes] = await Promise.all([
        apiClient.getHealth(),
        apiClient.getUsers(25, 0),
        apiClient.getSessions(25, 0),
      ]);

      if (healthRes.data) {
        setHealth(healthRes.data as Health);
      }

      setUsers((usersRes.data ?? []) as User[]);
      setSessions((sessionsRes.data ?? []) as Session[]);
      setLastRefreshed(new Date().toISOString());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void loadDashboard();

    const timer = setInterval(() => {
      void loadDashboard(true);
    }, 30000);

    return () => clearInterval(timer);
  }, []);

  const normalizedQuery = query.trim().toLowerCase();

  const filteredUsers = useMemo(() => {
    if (!normalizedQuery) {
      return users;
    }

    return users.filter((user) => {
      return [user.email, user.role].some((field) => field.toLowerCase().includes(normalizedQuery));
    });
  }, [normalizedQuery, users]);

  const filteredSessions = useMemo(() => {
    const sortedSessions = [...sessions].sort((left, right) => {
      return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
    });

    if (!normalizedQuery) {
      return sortedSessions;
    }

    return sortedSessions.filter((session) => {
      return [session.sessionId, session.status].some((field) =>
        field.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [normalizedQuery, sessions]);

  const totalScans = sessions.reduce((sum, session) => sum + session.totalScans, 0);
  const passCount = sessions.reduce((sum, session) => sum + session.passCount, 0);
  const activeSessions = sessions.filter((session) => session.status === 'active').length;
  const completedSessions = sessions.filter((session) => session.status === 'completed').length;
  const databaseState = health?.database === 'connected' ? 'Connected' : 'Disconnected';
  const healthLabel = health?.status === 'ok' ? 'Operational' : health?.status === 'degraded' ? 'Degraded' : 'Offline';

  const handleLogout = async () => {
    try {
      await apiClient.logout();
      setHealth(null);
      setUsers([]);
      setSessions([]);
      setLastRefreshed(null);
      setError('Signed out of the console.');
    } catch (logoutError) {
      setError(logoutError instanceof Error ? logoutError.message : 'Failed to sign out');
    }
  };

  return (
    <div className="logic-vera-app">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">ops</div>
          <div>
            <h1>LogicVera</h1>
            <span>Operator Console</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <a key={item.label} className={item.active ? 'nav-item active' : 'nav-item'} href="#">
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </a>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button type="button" className="sidebar-action" onClick={() => void loadDashboard(true)}>
            <span className="nav-icon">refresh</span>
            <span>{refreshing ? 'Refreshing' : 'Refresh'}</span>
          </button>
          <button type="button" className="sidebar-action" onClick={() => void handleLogout()}>
            <span className="nav-icon">logout</span>
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      <main className="content-shell">
        <header className="topbar">
          <div className="search-wrap">
            <span className="nav-icon search-icon">search</span>
            <input
              aria-label="Search users and sessions"
              placeholder="Search users or sessions..."
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>

          <nav className="top-links" aria-label="Primary">
            <a className="active" href="#">
              Dashboard
            </a>
            <a href="#">Sessions</a>
            <a href="#">Users</a>
          </nav>

          <div className="topbar-actions">
            <button type="button" className="icon-button" aria-label="Refresh dashboard" onClick={() => void loadDashboard(true)}>
              refresh
            </button>
            <button type="button" className="icon-button" aria-label="Help">
              help
            </button>
            <div className="avatar" aria-hidden="true">
              LV
            </div>
          </div>
        </header>

        <div className="page-body">
          <div className="page-header">
            <div>
              <h2>Live Operations Dashboard</h2>
              <p>
                {health
                  ? `${healthLabel} • Database ${databaseState.toLowerCase()} • Last sync ${lastRefreshed ? formatDateTime(lastRefreshed) : 'pending'}`
                  : 'Connecting to the API and priming the operator session.'}
              </p>
            </div>
            <button type="button" className="primary-button" onClick={() => void loadDashboard(true)}>
              <span className="nav-icon">sync</span>
              {refreshing ? 'Refreshing' : 'Refresh Data'}
            </button>
          </div>

          {error && <div className="error-banner">{error}</div>}

          {loading ? (
            <section className="users-panel" aria-label="Loading dashboard">
              <div className="no-data">Loading live operator data...</div>
            </section>
          ) : (
            <>
              <section className="stats-grid" aria-label="Operational metrics">
                <article className="stat-card">
                  <span className="stat-label">API Health</span>
                  <div className="stat-value">{healthLabel}</div>
                  <div className="stat-caption muted">
                    <span className="status-dot live" />
                    <span>{databaseState}</span>
                  </div>
                </article>

                <article className="stat-card">
                  <span className="stat-label">Active Sessions</span>
                  <div className="stat-value accent">{activeSessions}</div>
                  <div className="stat-caption positive">
                    <span>check_circle</span>
                    <span>{completedSessions} completed</span>
                  </div>
                </article>

                <article className="stat-card integrity-card">
                  <div className="integrity-content">
                    <span className="stat-label">Pass Rate</span>
                    <div className="stat-value">{formatPercentage(passCount, totalScans)}</div>
                    <div className="progress-track" aria-hidden="true">
                      <div
                        className="progress-fill"
                        style={{ width: `${Math.min(100, totalScans ? Math.round((passCount / totalScans) * 100) : 0)}%` }}
                      />
                    </div>
                  </div>
                  <div className="integrity-mark" aria-hidden="true">
                    verified_user
                  </div>
                </article>

                <article className="stat-card">
                  <span className="stat-label">Known Users</span>
                  <div className="stat-value">{users.length}</div>
                  <div className="stat-caption muted">
                    <span>inventory_2</span>
                    <span>{filteredUsers.length} matching filter</span>
                  </div>
                </article>
              </section>

              <section className="users-panel" aria-label="Recent sessions">
                <div className="panel-toolbar">
                  <div className="toolbar-left">
                    <button type="button" className="filter-button" onClick={() => setQuery('')}>
                      <span className="nav-icon">filter_alt</span>
                      Clear Filter
                    </button>
                    <span>
                      Showing {filteredSessions.length} of {sessions.length} sessions
                    </span>
                  </div>
                  <div className="toolbar-right" aria-label="Session summary">
                    <span className="status-pill">
                      <span className="status-dot" />
                      {totalScans} scans
                    </span>
                  </div>
                </div>

                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Session</th>
                        <th>Status</th>
                        <th>Scans</th>
                        <th>Pass / Fail</th>
                        <th>Created</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSessions.length > 0 ? (
                        filteredSessions.map((session) => (
                          <tr key={session.sessionId}>
                            <td>
                              <div className="user-cell">
                                <div className="user-avatar role-primary">{session.sessionId.slice(0, 2)}</div>
                                <div>
                                  <div className="user-name">{session.sessionId}</div>
                                  <div className="user-email">Operator session</div>
                                </div>
                              </div>
                            </td>
                            <td>
                              <span
                                className={`badge ${
                                  session.status === 'active'
                                    ? 'success'
                                    : session.status === 'paused'
                                      ? 'warning'
                                      : session.status === 'cancelled'
                                        ? 'danger'
                                        : 'info'
                                }`}
                              >
                                {session.status}
                              </span>
                            </td>
                            <td className="mono">{session.totalScans}</td>
                            <td className="mono">
                              {session.passCount} / {session.failCount}
                            </td>
                            <td className="mono">{formatDateTime(session.createdAt)}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5}>
                            <div className="no-data">No sessions match the current filter</div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>

              <section className="users-panel" aria-label="User directory">
                <div className="panel-toolbar">
                  <div className="toolbar-left">
                    <span className="strong">User Directory</span>
                    <span>{filteredUsers.length} users</span>
                  </div>
                  <div className="toolbar-right" aria-label="Directory summary">
                    <span className="status-pill">
                      <span className="status-dot live" />
                      {health?.status ?? 'offline'}
                    </span>
                  </div>
                </div>

                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>User Identifier</th>
                        <th>Role / Permissions</th>
                        <th>Created</th>
                        <th>Status</th>
                        <th className="actions-column">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.length > 0 ? (
                        filteredUsers.map((user) => (
                          <tr key={user.id}>
                            <td>
                              <div className="user-cell">
                                <div className={`user-avatar ${user.role === 'admin' ? 'role-primary' : 'role-tertiary'}`}>
                                  {user.email.slice(0, 2).toUpperCase()}
                                </div>
                                <div>
                                  <div className="user-name">{user.email}</div>
                                  <div className="user-email">ID {user.id.slice(0, 8)}</div>
                                </div>
                              </div>
                            </td>
                            <td>
                              <span className={`role-pill ${user.role === 'admin' ? 'role-primary' : 'role-tertiary'}`}>
                                {user.role}
                              </span>
                            </td>
                            <td className="mono">{formatDateTime(user.createdAt)}</td>
                            <td>
                              <span className="status-pill">
                                <span className="status-dot" />
                                ACTIVE
                              </span>
                            </td>
                            <td className="actions-column">
                              <button type="button" className="icon-button compact" aria-label={`Edit ${user.email}`}>
                                edit
                              </button>
                              <button type="button" className="icon-button compact danger" aria-label={`Delete ${user.email}`}>
                                delete
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5}>
                            <div className="no-data">No users match the current filter</div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          )}
        </div>

        <footer className="statusbar">
          <div className="statusbar-left">
            <span className="strong">LogicVera v2.4.1-stable</span>
            <span className="divider" />
            <span className="connected">API: {health?.status === 'ok' ? 'Connected' : 'Disconnected'}</span>
          </div>
          <div className="statusbar-right">
            <span>Environment: Prod</span>
            <span>{lastRefreshed ? formatDateTime(lastRefreshed) : 'Waiting for data'}</span>
          </div>
        </footer>
      </main>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(<App />);

