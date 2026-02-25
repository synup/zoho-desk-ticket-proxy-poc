/**
 * Captures console logs (log, warn, error, info) for inclusion in support tickets.
 */
export type LogEntry = {
  level: 'log' | 'warn' | 'error' | 'info';
  args: unknown[];
  timestamp: string;
};

const logs: LogEntry[] = [];
const MAX_LOGS = 100;

const originalConsole = {
  log: console.log.bind(console),
  warn: console.warn.bind(console),
  error: console.error.bind(console),
  info: console.info.bind(console),
};

function capture(level: LogEntry['level']) {
  return (...args: unknown[]) => {
    originalConsole[level](...args);
    logs.push({
      level,
      args: args.map((a) =>
        typeof a === 'object' && a !== null ? JSON.stringify(a, null, 2) : String(a)
      ),
      timestamp: new Date().toISOString(),
    });
    if (logs.length > MAX_LOGS) logs.shift();
  };
}

let installed = false;

export function installConsoleLogger() {
  if (installed) return;
  installed = true;
  console.log = capture('log');
  console.warn = capture('warn');
  console.error = capture('error');
  console.info = capture('info');
}

export function getConsoleLogs(): LogEntry[] {
  return [...logs];
}

export function clearConsoleLogs() {
  logs.length = 0;
}
