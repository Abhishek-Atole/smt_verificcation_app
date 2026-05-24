import { useMemo, useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';

const sampleLog = `2026-05-21 20:57:35  smt-test-db  The files belonging to this database system will be owned by user "postgres".
2026-05-21 20:57:35  smt-test-db  This user must also own the server process.
2026-05-21 20:57:35  smt-test-db  The database cluster will be initialized with locale "en_US.utf8".
2026-05-21 20:57:35  smt-test-db  The default database encoding has accordingly been set to "UTF8".
2026-05-21 20:57:35  smt-test-db  The default text search configuration will be set to "english".
2026-05-21 20:57:35  smt-test-db  Data page checksums are disabled.
2026-05-21 20:57:35  smt-test-db  fixing permissions on existing directory /var/lib/postgresql/data ... ok
2026-05-21 20:57:35  smt-test-db  creating subdirectories ... ok
2026-05-21 20:57:35  smt-test-db  selecting dynamic shared memory implementation ... posix
2026-05-21 20:57:35  smt-test-db  selecting default max_connections ... 100
2026-05-21 20:57:35  smt-test-db  selecting default shared_buffers ... 128MB
2026-05-21 20:57:35  smt-test-db  selecting default time zone ... Etc/UTC
2026-05-21 20:57:35  smt-test-db  creating configuration files ... ok`;

function tryParseRegex(input: string): RegExp | null {
  // support form /pattern/flags
  const m = input.match(/^\/(.*)\/([a-z]*)$/i);
  if (!m) return null;
  try {
    return new RegExp(m[1], m[2]);
  } catch (e) {
    void e;
    return null;
  }
}

export default function LogViewer() {
  const [query, setQuery] = useState('');
  const [remoteLines, setRemoteLines] = useState<string[]>([]);

  const lines = useMemo(() => sampleLog.split('\n').filter(Boolean), []);

  // Socket-based streaming for live logs (fallback to polling if socket fails)
  useEffect(() => {
    let mounted = true;
    let socket: Socket | null = null;

    const startSocket = async () => {
      try {
        // Ensure we include cookies and use CSRF protection: read CSRF cookie and POST to obtain short-lived socket token
        const getCookie = (name: string) => {
          const m = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
          return m ? decodeURIComponent(m[2]) : undefined;
        };

        // Optionally prime CSRF cookie by touching health endpoint (GET sets CSRF cookie/header)
        try { await fetch('http://localhost:3000/api/v1/health', { credentials: 'include' }); } catch (error) { void error; }

        const csrf = getCookie('_csrf') || '';
        const tokenRes = await fetch('http://localhost:3000/internal/socket-token', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'x-csrf-token': csrf,
          },
        });

        if (!tokenRes.ok) throw new Error('no-token');
        const tokenJson = await tokenRes.json();
        const token = tokenJson?.data?.token;
        if (!token) throw new Error('no-token');

        socket = io('http://localhost:3000', { auth: { token } });
        socket.on('connect', () => {
          // connected
        });

        socket.on('log', (obj: any) => {
          const raw = obj.raw ? obj.raw : JSON.stringify(obj);
          if (!mounted) return;
          setRemoteLines((prev) => [raw, ...prev].slice(0, 1000));
        });

        socket.on('connect_error', () => {
          // ignore — fallback to polling will still work
        });
      } catch (e) {
        // socket not available; ignore
      }
    };

    startSocket();

    return () => {
      mounted = false;
      try { socket?.close(); } catch (error) { void error; }
    };
  }, []);

  const allLines = useMemo(() => [...remoteLines, ...lines], [remoteLines, lines]);

  const filtered = useMemo(() => {
    if (!query) return allLines;
    const rx = tryParseRegex(query);
    if (rx) {
      return allLines.filter((l) => rx.test(l));
    }
    const q = query.toLowerCase();
    return allLines.filter((l) => l.toLowerCase().includes(q));
  }, [query, allLines]);

  return (
    <section className="logs-panel" aria-label="System logs">
      <div className="panel-toolbar">
        <div className="toolbar-left">
          <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              aria-label="Log search"
              placeholder={'Search logs (use /pattern/ to run regex)'}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{ padding: '6px 8px', minWidth: 320 }}
            />
          </label>
        </div>
        <div className="toolbar-right">
          <span className="small muted-text">{filtered.length} of {allLines.length} lines</span>
        </div>
      </div>

      <div className="log-view">
        {filtered.map((line, i) => (
          <div key={i} className="log-line mono">
            {line}
          </div>
        ))}
      </div>
    </section>
  );
}
