/**
 * Collects environment context (browser, OS, page info, session metadata)
 * for inclusion in support tickets.
 */

export type EnvironmentInfo = {
  userAgent: string;
  browser?: string;
  os?: string;
  language?: string;
  timezone?: string;
  screenWidth?: number;
  screenHeight?: number;
  viewportWidth?: number;
  viewportHeight?: number;
  currentUrl?: string;
  referrer?: string;
  sessionId: string;
  appVersion?: string;
  timestamp: string;
};

const SESSION_KEY = 'logger_session_id';

function getOrCreateSessionId(): string {
  try {
    if (typeof sessionStorage === 'undefined') {
      return Date.now().toString(36) + Math.random().toString(36).slice(2);
    }
    let id = sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id = Date.now().toString(36) + Math.random().toString(36).slice(2);
      sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return Date.now().toString(36) + Math.random().toString(36).slice(2);
  }
}

function parseBrowser(ua: string): string | undefined {
  try {
    if (!ua) return undefined;
    const u = ua.toLowerCase();
    if (u.includes('edg/')) return 'Edge';
    if (u.includes('chrome') && !u.includes('chromium')) return 'Chrome';
    if (u.includes('firefox') || u.includes('fxios')) return 'Firefox';
    if (u.includes('safari') && !u.includes('chrome')) return 'Safari';
    if (u.includes('opera') || u.includes('opr/')) return 'Opera';
    return undefined;
  } catch {
    return undefined;
  }
}

function parseOS(ua: string): string | undefined {
  try {
    if (!ua) return undefined;
    const u = ua.toLowerCase();
    if (u.includes('win')) return 'Windows';
    if (u.includes('mac')) return 'macOS';
    if (u.includes('linux')) return 'Linux';
    if (u.includes('android')) return 'Android';
    if (u.includes('iphone') || u.includes('ipad')) return 'iOS';
    return undefined;
  } catch {
    return undefined;
  }
}

/**
 * Returns environment context for support tickets.
 * Never throws; returns best-effort partial data on failure.
 */
export function getEnvironmentInfo(appVersion?: string): EnvironmentInfo {
  const base: EnvironmentInfo = {
    userAgent: '',
    sessionId: getOrCreateSessionId(),
    timestamp: new Date().toISOString(),
  };

  try {
    if (typeof navigator !== 'undefined') {
      base.userAgent = navigator.userAgent ?? '';
      base.language = navigator.language ?? undefined;
      base.browser = parseBrowser(base.userAgent);
      base.os = parseOS(base.userAgent);
    }
  } catch {
    // best-effort partial
  }

  try {
    base.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    // best-effort partial
  }

  try {
    if (typeof screen !== 'undefined') {
      base.screenWidth = screen.width;
      base.screenHeight = screen.height;
    }
  } catch {
    // best-effort partial
  }

  try {
    if (typeof window !== 'undefined') {
      base.viewportWidth = window.innerWidth;
      base.viewportHeight = window.innerHeight;
    }
  } catch {
    // best-effort partial
  }

  try {
    if (typeof location !== 'undefined') {
      base.currentUrl = location.href;
    }
  } catch {
    // best-effort partial
  }

  try {
    if (typeof document !== 'undefined') {
      base.referrer = document.referrer || undefined;
    }
  } catch {
    // best-effort partial
  }

  if (appVersion !== undefined) {
    base.appVersion = appVersion;
  }

  return base;
}
