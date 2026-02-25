/**
 * Captures network request/response data for inclusion in support tickets.
 */
export type NetworkLog = {
  url: string;
  method: string;
  status?: number;
  statusText?: string;
  requestTime: string;
  duration?: number;
  requestBody?: unknown;
  responsePreview?: string;
};

const networkLogs: NetworkLog[] = [];
const MAX_LOGS = 50;

export function addNetworkLog(log: NetworkLog) {
  networkLogs.push(log);
  if (networkLogs.length > MAX_LOGS) networkLogs.shift();
}

export function getNetworkLogs(): NetworkLog[] {
  return [...networkLogs];
}

export function clearNetworkLogs() {
  networkLogs.length = 0;
}

let installed = false;

/**
 * Installs a global fetch interceptor that automatically logs all requests and
 * responses. Call once at app startup. Idempotent—safe to call multiple times.
 */
export function installNetworkLogger(): void {
  if (installed || typeof window === 'undefined') return;
  installed = true;

  const originalFetch = window.fetch;

  window.fetch = function (
    input: RequestInfo | URL,
    init?: RequestInit
  ): Promise<Response> {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    const method = (init?.method ?? 'GET').toUpperCase();
    const requestTime = new Date().toISOString();
    const start = Date.now();

    let requestBody: unknown;
    if (init?.body !== undefined && init?.body !== null) {
      if (typeof init.body === 'string') {
        try {
          requestBody = JSON.parse(init.body);
        } catch {
          requestBody = init.body;
        }
      } else {
        requestBody = '[non-serializable]';
      }
    }

    return originalFetch.call(window, input, init).then(
      (response) => {
        const duration = Date.now() - start;
        const cloned = response.clone();

        cloned
          .text()
          .then((text) => {
            const preview = text.length > 200 ? text.slice(0, 200) + '...' : text;
            addNetworkLog({
              url,
              method,
              status: response.status,
              statusText: response.statusText,
              requestTime,
              duration,
              requestBody,
              responsePreview: preview,
            });
          })
          .catch(() => {
            addNetworkLog({
              url,
              method,
              status: response.status,
              statusText: response.statusText,
              requestTime,
              duration,
              requestBody,
              responsePreview: '[failed to read body]',
            });
          });

        return response;
      },
      (error) => {
        const duration = Date.now() - start;
        addNetworkLog({
          url,
          method,
          requestTime,
          duration,
          requestBody,
          responsePreview: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
    );
  };
}
