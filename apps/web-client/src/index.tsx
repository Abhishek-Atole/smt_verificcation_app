import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';

function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>SMT Verification System</h1>
        <p>Web Client</p>
      </header>

      <main className="app-main">
        <section className="dashboard">
          <h2>Dashboard</h2>
          <div className="status">
            <h3>System Status</h3>
            <p>✅ API Server: <span className="status-badge ok">Running on http://localhost:3000</span></p>
            <p>✅ Web Client: <span className="status-badge ok">Running on http://localhost:5173</span></p>
          </div>

          <div className="features">
            <h3>Features</h3>
            <ul>
              <li>📊 User Management</li>
              <li>📦 BOM (Bill of Materials) Management</li>
              <li>🔄 Session Management</li>
              <li>🔍 Scan Management with 7-stage Validation</li>
              <li>📝 Audit Logging</li>
              <li>📈 Metrics & Analytics</li>
              <li>🔐 Role-based Access Control (Admin, Supervisor, QA, Operator)</li>
              <li>⚡ Real-time Updates with Socket.IO</li>
            </ul>
          </div>

          <div className="test-section">
            <h3>Integration Tests</h3>
            <p>✅ 131/131 tests passing</p>
            <ul>
              <li>4 Health Check Tests</li>
              <li>24 User Management Tests</li>
              <li>21 BOM Management Tests</li>
              <li>19 Session Management Tests</li>
              <li>17 Scan Management Tests</li>
              <li>17 Audit Logging Tests</li>
              <li>19 Metrics Tests</li>
              <li>10 End-to-End Workflow Tests</li>
            </ul>
          </div>

          <div className="endpoints">
            <h3>Available API Endpoints</h3>
            <details>
              <summary>Health</summary>
              <ul>
                <li>GET /api/health</li>
              </ul>
            </details>
            <details>
              <summary>Users</summary>
              <ul>
                <li>POST /api/users - Create user</li>
                <li>GET /api/users - List users</li>
                <li>GET /api/users/:userId - Get user</li>
                <li>PATCH /api/users/:userId - Update user</li>
                <li>DELETE /api/users/:userId - Delete user</li>
              </ul>
            </details>
            <details>
              <summary>BOMs</summary>
              <ul>
                <li>POST /api/boms - Create BOM</li>
                <li>GET /api/boms - List BOMs</li>
                <li>GET /api/boms/:bomId - Get BOM</li>
                <li>PATCH /api/boms/:bomId - Update BOM</li>
                <li>DELETE /api/boms/:bomId - Delete BOM</li>
              </ul>
            </details>
            <details>
              <summary>Sessions</summary>
              <ul>
                <li>POST /api/sessions - Create session</li>
                <li>GET /api/sessions - List sessions</li>
                <li>GET /api/sessions/:sessionId - Get session</li>
                <li>PATCH /api/sessions/:sessionId - Update session</li>
                <li>DELETE /api/sessions/:sessionId - Delete session</li>
              </ul>
            </details>
            <details>
              <summary>Scans</summary>
              <ul>
                <li>POST /api/scans - Create scan</li>
                <li>GET /api/scans - List scans</li>
                <li>GET /api/scans/:scanId - Get scan</li>
                <li>PATCH /api/scans/:scanId - Update scan</li>
                <li>DELETE /api/scans/:scanId - Delete scan</li>
              </ul>
            </details>
            <details>
              <summary>Audit</summary>
              <ul>
                <li>GET /api/audit - List audit logs</li>
              </ul>
            </details>
            <details>
              <summary>Metrics</summary>
              <ul>
                <li>GET /api/metrics/dashboard - Dashboard metrics</li>
                <li>GET /api/metrics/scans - Scan metrics</li>
                <li>GET /api/metrics/efficiency - Efficiency metrics</li>
                <li>GET /api/metrics/trends - Trend metrics</li>
                <li>GET /api/metrics/boms - BOM metrics</li>
              </ul>
            </details>
          </div>
        </section>
      </main>

      <footer className="app-footer">
        <p>&copy; 2026 SMT Verification System. All rights reserved.</p>
      </footer>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(<App />);

