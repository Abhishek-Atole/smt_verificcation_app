import ReactDOM from 'react-dom/client';
import './index.css';

function App() {
  const users = [
    {
      initials: 'EK',
      name: 'Elias Kaelin',
      email: 'elias.kaelin@logicvera.io',
      role: 'Lead Architect',
      roleClass: 'role-tertiary',
      lastAccess: '2023-10-24 09:12:04',
      status: 'ACTIVE',
    },
    {
      initials: 'SM',
      name: 'Sarah Moss',
      email: 's.moss@logicvera.io',
      role: 'Logic Verifier',
      roleClass: 'role-primary',
      lastAccess: '2023-10-23 14:45:12',
      status: 'ACTIVE',
    },
  ];

  const navItems = [
    { label: 'Dashboard', icon: 'dashboard' },
    { label: 'Verification', icon: 'fact_check' },
    { label: 'Inventory', icon: 'inventory_2' },
    { label: 'Logs', icon: 'history_edu' },
    { label: 'Users', icon: 'group', active: true },
    { label: 'Settings', icon: 'settings' },
  ];

  return (
    <div className="logic-vera-app">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">terminal</div>
          <div>
            <h1>LogicVera</h1>
            <span>SMT Industrial</span>
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
          <button type="button" className="sidebar-action">
            <span className="nav-icon">light_mode</span>
            <span>Theme</span>
          </button>
          <button type="button" className="sidebar-action">
            <span className="nav-icon">logout</span>
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      <main className="content-shell">
        <header className="topbar">
          <div className="search-wrap">
            <span className="nav-icon search-icon">search</span>
            <input aria-label="Search system entities" placeholder="Search system entities..." type="text" />
          </div>

          <nav className="top-links" aria-label="Primary">
            <a href="#">Verification</a>
            <a href="#">Analysis</a>
            <a className="active" href="#">
              Admin
            </a>
          </nav>

          <div className="topbar-actions">
            <button type="button" className="icon-button" aria-label="Notifications">
              notifications
            </button>
            <button type="button" className="icon-button" aria-label="Help">
              help
            </button>
            <div className="avatar" aria-hidden="true">
              AV
            </div>
          </div>
        </header>

        <div className="page-body">
          <div className="page-header">
            <div>
              <h2>User Management</h2>
              <p>Manage system access, permissions, and security protocols.</p>
            </div>
            <button type="button" className="primary-button">
              <span className="nav-icon">person_add</span>
              New User
            </button>
          </div>

          <section className="stats-grid" aria-label="User summary metrics">
            <article className="stat-card">
              <span className="stat-label">Total Seats</span>
              <div className="stat-value">128</div>
              <div className="stat-caption positive">
                <span>trending_up</span>
                <span>12% vs last month</span>
              </div>
            </article>

            <article className="stat-card">
              <span className="stat-label">Active Now</span>
              <div className="stat-value accent">42</div>
              <div className="stat-caption muted">
                <span className="status-dot live" />
                <span>Live Monitoring</span>
              </div>
            </article>

            <article className="stat-card integrity-card">
              <div className="integrity-content">
                <span className="stat-label">System Integrity</span>
                <div className="stat-value">99.98%</div>
                <div className="progress-track" aria-hidden="true">
                  <div className="progress-fill" />
                </div>
              </div>
              <div className="integrity-mark" aria-hidden="true">
                verified_user
              </div>
            </article>
          </section>

          <section className="users-panel" aria-label="Users table">
            <div className="panel-toolbar">
              <div className="toolbar-left">
                <button type="button" className="filter-button">
                  <span className="nav-icon">filter_alt</span>
                  Filters
                </button>
                <span>Showing 1-10 of 128 users</span>
              </div>
              <div className="toolbar-right" aria-label="Pagination controls">
                <button type="button" className="icon-button compact" aria-label="Previous page">
                  chevron_left
                </button>
                <button type="button" className="icon-button compact" aria-label="Next page">
                  chevron_right
                </button>
              </div>
            </div>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>User Identifier</th>
                    <th>Role / Permissions</th>
                    <th>Last Access</th>
                    <th>Status</th>
                    <th className="actions-column">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.email}>
                      <td>
                        <div className="user-cell">
                          <div className={`user-avatar ${user.roleClass}`}>{user.initials}</div>
                          <div>
                            <div className="user-name">{user.name}</div>
                            <div className="user-email">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`role-pill ${user.roleClass}`}>{user.role}</span>
                      </td>
                      <td className="mono">{user.lastAccess}</td>
                      <td>
                        <span className="status-pill">
                          <span className="status-dot" />
                          {user.status}
                        </span>
                      </td>
                      <td className="actions-column">
                        <button type="button" className="icon-button compact" aria-label={`Edit ${user.name}`}>
                          edit
                        </button>
                        <button type="button" className="icon-button compact danger" aria-label={`Delete ${user.name}`}>
                          delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <footer className="statusbar">
          <div className="statusbar-left">
            <span className="strong">LogicVera v2.4.1-stable</span>
            <span className="divider" />
            <span className="connected">API: Connected</span>
          </div>
          <div className="statusbar-right">
            <span>Environment: Prod</span>
            <span>12:45:02 UTC</span>
          </div>
        </footer>
      </main>

      <div className="modal-overlay" role="presentation">
        <div className="modal-shell" role="dialog" aria-modal="true" aria-labelledby="add-user-title">
          <div className="modal-header">
            <div>
              <h3 id="add-user-title">Add New System User</h3>
              <p>Define account credentials and computational permissions.</p>
            </div>
            <button type="button" className="icon-button" aria-label="Close dialog">
              close
            </button>
          </div>

          <div className="modal-body">
            <form className="form-grid" onSubmit={(event) => event.preventDefault()}>
              <div className="field-grid">
                <label className="field">
                  <span>First Name</span>
                  <input type="text" defaultValue="Arthur" />
                </label>
                <label className="field">
                  <span>Last Name</span>
                  <input type="text" placeholder="e.g. Dent" />
                </label>
              </div>

              <label className="field field-error">
                <div className="field-header">
                  <span>Corporate Email</span>
                  <strong>REQUIRED FIELD</strong>
                </div>
                <div className="field-with-icon">
                  <input type="email" defaultValue="arthur.v@" />
                  <span className="inline-status">error</span>
                </div>
                <small>Please enter a valid logicvera.io domain address.</small>
              </label>

              <label className="field">
                <span>Initial Access Token</span>
                <div className="field-with-icon">
                  <input id="password-field" type="password" defaultValue="S3cureP@ssw0rd!" />
                  <button
                    type="button"
                    className="inline-action"
                    onClick={() => {
                      const passwordField = document.getElementById('password-field') as HTMLInputElement | null;
                      if (!passwordField) return;
                      passwordField.type = passwordField.type === 'password' ? 'text' : 'password';
                    }}
                  >
                    visibility
                  </button>
                </div>
                <div className="strength-meter" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                  <span className="empty" />
                </div>
                <small className="muted-text">Strength: High Complexity</small>
              </label>

              <div className="field">
                <span>Access Tier Selection</span>
                <div className="role-grid">
                  <label className="role-card selected">
                    <input checked readOnly name="role" type="radio" />
                    <span className="role-icon">terminal</span>
                    <span className="role-title">Developer</span>
                    <span className="role-copy">Full verification suite access.</span>
                    <span className="role-check">
                      <span />
                    </span>
                  </label>

                  <label className="role-card">
                    <input name="role" type="radio" />
                    <span className="role-icon muted">shield</span>
                    <span className="role-title">Security Admin</span>
                    <span className="role-copy">Manage protocols and logs.</span>
                    <span className="role-check" />
                  </label>
                </div>
              </div>
            </form>
          </div>

          <div className="modal-footer">
            <button type="button" className="text-button">
              Discard Draft
            </button>
            <button type="button" className="primary-button">
              Initialize Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(<App />);

