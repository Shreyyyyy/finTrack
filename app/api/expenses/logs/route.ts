import { NextRequest, NextResponse } from 'next/server';
import { getShortcutLogs, clearShortcutLogs } from '@/lib/logging/requestLogs';
import { createClientServer } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/client';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const format = searchParams.get('format');
  const action = searchParams.get('action');

  if (action === 'clear') {
    clearShortcutLogs();
    return NextResponse.json({ success: true, message: 'Logs cleared.' });
  }

  // Live Database Diagnostics
  const dbDiagnostics = {
    configured: isSupabaseConfigured(),
    serviceRoleKeySet: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    profilesAccessible: false,
    profilesCount: 0,
    profilesError: null as string | null,
    apiKeysAccessible: false,
    apiKeysCount: 0,
    apiKeysError: null as string | null,
    rpcFunctionExists: false,
    rpcError: null as string | null,
  };

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClientServer();

      // Test 1: Query profiles
      const { data: profs, error: pErr, count: pCount } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true });
      if (!pErr) {
        dbDiagnostics.profilesAccessible = true;
        dbDiagnostics.profilesCount = pCount ?? (profs ? 1 : 0);
      } else {
        dbDiagnostics.profilesError = `${pErr.code}: ${pErr.message}`;
      }

      // Test 2: Query api_keys
      const { data: keys, error: kErr, count: kCount } = await supabase
        .from('api_keys')
        .select('id', { count: 'exact', head: true });
      if (!kErr) {
        dbDiagnostics.apiKeysAccessible = true;
        dbDiagnostics.apiKeysCount = kCount ?? (keys ? 1 : 0);
      } else {
        dbDiagnostics.apiKeysError = `${kErr.code}: ${kErr.message}`;
      }

      // Test 3: Test RPC log_quick_expense with test key
      const { data: rpcData, error: rpcErr } = await supabase.rpc('log_quick_expense', {
        p_api_key: 'test_probe_key',
        p_amount: 1,
        p_category: 'Other',
        p_payment: 'UPI',
        p_note: 'probe',
      });

      if (rpcErr) {
        dbDiagnostics.rpcError = `${rpcErr.code}: ${rpcErr.message}`;
        dbDiagnostics.rpcFunctionExists = rpcErr.code !== '42883' && !rpcErr.message.includes('does not exist');
      } else {
        dbDiagnostics.rpcFunctionExists = true;
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      dbDiagnostics.rpcError = msg;
    }
  }

  const logs = getShortcutLogs();

  if (format === 'json') {
    return NextResponse.json({
      diagnostics: dbDiagnostics,
      total_logs: logs.length,
      logs,
    });
  }

  // HTML visual log viewer for instant readability in any mobile/desktop browser
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>finTrack • Live Shortcut Logs & Diagnostics</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #090d16;
      --card: #111827;
      --border: #1f293d;
      --text: #f1f5f9;
      --muted: #94a3b8;
      --emerald: #10b981;
      --rose: #f43f5e;
      --amber: #f59e0b;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;
      background: var(--bg);
      color: var(--text);
      padding: 20px;
      line-height: 1.5;
    }
    .container { max-width: 900px; margin: 0 auto; }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 12px;
      margin-bottom: 24px;
      padding-bottom: 16px;
      border-bottom: 1px solid var(--border);
    }
    h1 { font-size: 20px; font-weight: 800; }
    .btn-group { display: flex; gap: 8px; }
    button, .link-btn {
      background: #1e293b;
      color: #fff;
      border: 1px solid var(--border);
      padding: 8px 14px;
      border-radius: 10px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    button:hover, .link-btn:hover { background: #334155; }
    .btn-primary { background: #059669; border-color: #059669; }
    .btn-primary:hover { background: #10b981; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 14px; margin-bottom: 24px; }
    .card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 16px;
    }
    .card-title { font-size: 12px; font-weight: 700; text-transform: uppercase; color: var(--muted); margin-bottom: 6px; }
    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 700;
    }
    .status-ok { background: rgba(16, 185, 129, 0.15); color: #34d399; }
    .status-err { background: rgba(244, 63, 94, 0.15); color: #fb7185; }
    .status-warn { background: rgba(245, 158, 11, 0.15); color: #fbbf24; }
    .log-list { display: flex; flex-direction: column; gap: 12px; }
    .log-item {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 14px 16px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .log-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 8px;
    }
    .pill {
      font-size: 11px;
      font-weight: 800;
      padding: 2px 8px;
      border-radius: 6px;
      font-family: 'JetBrains Mono', monospace;
    }
    .pill-200 { background: rgba(16, 185, 129, 0.2); color: #34d399; }
    .pill-401 { background: rgba(244, 63, 94, 0.2); color: #fb7185; }
    .pill-500 { background: rgba(239, 68, 68, 0.2); color: #f87171; }
    .time { font-size: 12px; color: var(--muted); font-family: 'JetBrains Mono', monospace; }
    .mono { font-family: 'JetBrains Mono', monospace; font-size: 12px; }
    .code-box {
      background: #0b0f19;
      border: 1px solid #1a2234;
      border-radius: 8px;
      padding: 10px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 11px;
      overflow-x: auto;
      white-space: pre-wrap;
      word-break: break-all;
    }
    .empty-state {
      text-align: center;
      padding: 40px;
      color: var(--muted);
      border: 1px dashed var(--border);
      border-radius: 16px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div>
        <h1>🔍 finTrack Live Request Logs & Diagnostics</h1>
        <p style="font-size: 12px; color: var(--muted); margin-top: 2px;">
          Inspect iPhone Shortcut requests, database permissions, and execution traces.
        </p>
      </div>
      <div class="btn-group">
        <button onclick="window.location.reload()">🔄 Refresh</button>
        <button onclick="sendTestRequest()" class="btn-primary">⚡ Send Test Request</button>
        <a href="/dashboard" class="link-btn">← App Dashboard</a>
      </div>
    </div>

    <!-- Live Diagnostics Cards -->
    <div class="grid">
      <div class="card">
        <div class="card-title">1. Supabase Connection</div>
        <div>
          ${dbDiagnostics.configured 
            ? '<span class="status-badge status-ok">✓ Connected to Supabase</span>' 
            : '<span class="status-badge status-err">✕ Supabase Not Configured</span>'}
        </div>
        <p style="font-size: 11px; color: var(--muted); margin-top: 8px;">
          Service Role: ${dbDiagnostics.serviceRoleKeySet ? '<strong style="color:#34d399">Configured</strong>' : '<span style="color:#fbbf24">Anon Key Mode</span>'}
        </p>
      </div>

      <div class="card">
        <div class="card-title">2. API Keys Table Access</div>
        <div>
          ${dbDiagnostics.apiKeysAccessible 
            ? '<span class="status-badge status-ok">✓ Accessible (' + dbDiagnostics.apiKeysCount + ' keys)</span>' 
            : '<span class="status-badge status-warn">⚠ Blocked by RLS</span>'}
        </div>
        <div style="font-size: 11px; color: #fb7185; margin-top: 6px; font-family: monospace;">
          ${dbDiagnostics.apiKeysError || 'No error: queries succeed ✓'}
        </div>
      </div>

      <div class="card">
        <div class="card-title">3. RPC log_quick_expense</div>
        <div>
          ${dbDiagnostics.rpcFunctionExists 
            ? '<span class="status-badge status-ok">✓ Function Installed</span>' 
            : '<span class="status-badge status-err">✕ Function Missing in Supabase</span>'}
        </div>
        <div style="font-size: 11px; color: ${dbDiagnostics.rpcFunctionExists ? 'var(--muted)' : '#fb7185'}; margin-top: 6px; font-family: monospace;">
          ${dbDiagnostics.rpcError ? dbDiagnostics.rpcError : 'Ready for shortcuts ✓'}
        </div>
      </div>
    </div>

    ${!dbDiagnostics.rpcFunctionExists ? `
    <div style="background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.3); padding: 14px; border-radius: 12px; margin-bottom: 20px; font-size: 13px;">
      <strong style="color: #fbbf24;">⚡ Action Required in Supabase:</strong>
      <p style="margin-top: 4px; color: #e2e8f0;">
        The database function <code>log_quick_expense</code> has not been executed in your Supabase SQL Editor yet. That is why requests from your iPhone return 401 Unauthorized.
      </p>
    </div>` : ''}

    <div style="margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center;">
      <h2 style="font-size: 16px; font-weight: 700;">Recent Incoming Requests (${logs.length})</h2>
      <button onclick="clearLogs()" style="font-size: 11px; padding: 4px 8px;">Clear Logs</button>
    </div>

    ${logs.length === 0 ? `
    <div class="empty-state">
      <p>No shortcut requests recorded yet.</p>
      <p style="font-size: 12px; margin-top: 4px;">Trigger your iPhone Shortcut or tap "Send Test Request" above to see logs appear live!</p>
    </div>
    ` : `
    <div class="log-list">
      ${logs.map((l) => `
      <div class="log-item">
        <div class="log-head">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span class="pill ${l.statusCode === 200 ? 'pill-200' : l.statusCode === 401 ? 'pill-401' : 'pill-500'}">
              ${l.statusCode} ${l.success ? 'SUCCESS' : 'FAILED'}
            </span>
            <span class="mono" style="font-weight: 700;">${l.method} /api/expenses/quick</span>
          </div>
          <span class="time">${l.timestamp}</span>
        </div>

        <div style="display: flex; gap: 16px; flex-wrap: wrap; font-size: 12px;">
          <div><span style="color: var(--muted)">Amount:</span> <strong>₹${l.amount ?? 0}</strong></div>
          <div><span style="color: var(--muted)">Category:</span> <strong>${l.category ?? 'None'}</strong></div>
          <div><span style="color: var(--muted)">API Key:</span> <code class="mono" style="color:#38bdf8">${l.apiKeyUsed ? l.apiKeyUsed.substring(0, 16) + '...' : 'None'}</code></div>
        </div>

        ${l.error ? `
        <div style="color: #fb7185; font-size: 12px; font-weight: 600;">
          Error: ${l.error}
        </div>` : ''}

        ${l.message ? `
        <div style="color: #34d399; font-size: 12px; font-weight: 600;">
          ${l.message}
        </div>` : ''}

        <details style="font-size: 11px; color: var(--muted); margin-top: 4px;">
          <summary style="cursor: pointer; font-weight: 600;">View Trace Diagnostics</summary>
          <div class="code-box" style="margin-top: 6px;">
RPC Attempted: ${l.trace.rpcAttempted}
RPC Error: ${l.trace.rpcError || 'None'}
api_keys Query Error: ${l.trace.apiKeysQueryError || 'None'}
profiles Query Error: ${l.trace.profilesQueryError || 'None'}
Resolved User ID: ${l.trace.resolvedUserId || 'Failed to resolve'}
Insert Error: ${l.trace.insertError || 'None'}
          </div>
        </details>
      </div>
      `).join('')}
    </div>
    `}
  </div>

  <script>
    async function sendTestRequest() {
      const btn = event.target;
      btn.innerText = 'Sending...';
      try {
        const res = await fetch('/api/expenses/quick', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': 'fintrack_sec_ch8rzaxr3xwi1lq8'
          },
          body: JSON.stringify({ amount: 99, category: 'Food', note: 'Browser Log Test' })
        });
        const data = await res.json();
        alert('Response (' + res.status + '):\\n' + JSON.stringify(data, null, 2));
        window.location.reload();
      } catch (err) {
        alert('Test failed: ' + err.message);
      } finally {
        btn.innerText = '⚡ Send Test Request';
      }
    }

    async function clearLogs() {
      if (!confirm('Clear all logs?')) return;
      await fetch('/api/expenses/logs?action=clear');
      window.location.reload();
    }
  </script>
</body>
</html>`;

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  });
}
