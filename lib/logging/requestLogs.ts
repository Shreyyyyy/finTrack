export interface ShortcutLogEntry {
  id: string;
  timestamp: string;
  method: string;
  url: string;
  apiKeyUsed: string;
  amount?: number;
  category?: string;
  paymentMethod?: string;
  note?: string;
  statusCode: number;
  success: boolean;
  message?: string;
  error?: string;
  trace: {
    supabaseConfigured: boolean;
    rpcAttempted: boolean;
    rpcError?: string | null;
    apiKeysQueryError?: string | null;
    profilesQueryError?: string | null;
    resolvedUserId?: string | null;
    insertError?: string | null;
  };
}

// Global in-memory ring buffer (persists across requests within worker lifecycle)
const MAX_LOGS = 60;
declare global {
  // eslint-disable-next-line no-var
  var __shortcut_logs: ShortcutLogEntry[] | undefined;
}

if (!globalThis.__shortcut_logs) {
  globalThis.__shortcut_logs = [];
}

export function addShortcutLog(entry: ShortcutLogEntry) {
  if (!globalThis.__shortcut_logs) {
    globalThis.__shortcut_logs = [];
  }
  globalThis.__shortcut_logs.unshift(entry);
  if (globalThis.__shortcut_logs.length > MAX_LOGS) {
    globalThis.__shortcut_logs = globalThis.__shortcut_logs.slice(0, MAX_LOGS);
  }
}

export function getShortcutLogs(): ShortcutLogEntry[] {
  return globalThis.__shortcut_logs || [];
}

export function clearShortcutLogs() {
  globalThis.__shortcut_logs = [];
}
