/**
 * Captures global JavaScript errors and unhandled promise rejections
 * for inclusion in support tickets.
 */

export type ErrorLog = {
  message: string;
  stack?: string;
  source?: string;
  line?: number;
  column?: number;
  timestamp: string;
  type: 'runtime' | 'unhandledrejection';
};

const errorLogs: ErrorLog[] = [];
const MAX_LOGS = 50;

function pushErrorLog(log: ErrorLog): void {
  try {
    errorLogs.push(log);
    if (errorLogs.length > MAX_LOGS) {
      errorLogs.shift();
    }
  } catch {
    // Defensive: never throw
  }
}

let installed = false;

/**
 * Installs global error listeners. Call once at app startup.
 * Idempotent—safe to call multiple times.
 */
export function installErrorLogger(): void {
  if (installed || typeof window === 'undefined') return;
  installed = true;

  try {
    window.onerror = (
      message: string | Event,
      source?: string,
      lineno?: number,
      colno?: number,
      error?: Error
    ): boolean => {
      try {
        const msg = typeof message === 'string' ? message : String(message);
        pushErrorLog({
          message: msg,
          stack: error?.stack,
          source,
          line: lineno,
          column: colno,
          timestamp: new Date().toISOString(),
          type: 'runtime',
        });
      } catch {
        // Defensive: never throw
      }
      return false; // Allow default error handling to proceed
    };

    window.onunhandledrejection = (event: PromiseRejectionEvent): void => {
      try {
        const reason = event.reason;
        let message: string;
        let stack: string | undefined;

        if (reason instanceof Error) {
          message = reason.message;
          stack = reason.stack;
        } else if (typeof reason === 'string') {
          message = reason;
        } else {
          message = String(reason);
        }

        pushErrorLog({
          message,
          stack,
          timestamp: new Date().toISOString(),
          type: 'unhandledrejection',
        });
      } catch {
        // Defensive: never throw
      }
    };
  } catch {
    // Defensive: never throw
  }
}

export function getErrorLogs(): ErrorLog[] {
  try {
    return [...errorLogs];
  } catch {
    return [];
  }
}

export function clearErrorLogs(): void {
  try {
    errorLogs.length = 0;
  } catch {
    // Defensive: never throw
  }
}
