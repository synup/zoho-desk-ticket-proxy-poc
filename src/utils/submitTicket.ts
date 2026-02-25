/**
 * Ticket submission: uploads images/video and logs to Zoho Desk via backend proxy.
 * Logs (console, network, error, environment) are bundled as a JSON file and attached to the ticket.
 */

import type { LogEntry } from './consoleLogger';
import type { NetworkLog } from './networkLogger';
import type { EnvironmentInfo } from './environmentLogger';
import type { ErrorLog } from './errorLogger';
import { getConsoleLogs } from './consoleLogger';
import { getNetworkLogs } from './networkLogger';
import { getErrorLogs } from './errorLogger';
import { getEnvironmentInfo } from './environmentLogger';

const API_BASE = import.meta.env.VITE_ZOHO_API_BASE ?? '';

export type TicketPayload = {
  title: string;
  description: string;
  images: File[];
  video: File | null;
};

export type SubmitResult = {
  success: boolean;
  message: string;
  ticketId?: string;
  title?: string;
  description?: string;
  imageCount?: number;
  hasVideo?: boolean;
  consoleLogCount?: number;
  networkLogCount?: number;
};

type LogsPayload = {
  consoleLogs: LogEntry[];
  networkLogs: NetworkLog[];
  errorLogs: ErrorLog[];
  environment: EnvironmentInfo;
};

function buildLogsFile(payload: LogsPayload): File {
  const json = JSON.stringify(payload, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  return new File([blob], `support-logs-${Date.now()}.json`, { type: 'application/json' });
}

async function submitToZohoDesk(
  subject: string,
  description: string,
  files: File[]
): Promise<{ ticketId: string }> {
  const url = `${API_BASE}/api/zoho/tickets`;
  console.log('[SubmitTicket] Request', { url, method: 'POST', subject: subject.slice(0, 50), fileCount: files.length, fileNames: files.map((f) => f.name) });

  const form = new FormData();
  form.append('subject', subject);
  form.append('description', description);
  files.forEach((f) => form.append('files', f, f.name));

  const res = await fetch(url, {
    method: 'POST',
    body: form,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error('[SubmitTicket] Error response', { status: res.status, statusText: res.statusText, body: data });
    throw new Error(data.error || res.statusText || 'Failed to create ticket');
  }
  const ticketId = data.ticketId;
  if (!ticketId) {
    console.error('[SubmitTicket] No ticketId in success response', data);
    throw new Error('No ticket ID in response');
  }
  console.log('[SubmitTicket] Success', { ticketId });
  return { ticketId };
}

export async function submitTicket(payload: TicketPayload): Promise<SubmitResult> {
  console.log('[SubmitTicket] Start', { title: payload.title?.slice(0, 50), imageCount: payload.images.length, hasVideo: !!payload.video });

  const imageFiles = payload.images.filter((f) => f.type.startsWith('image/'));
  const videoFile = payload.video && payload.video.type.startsWith('video/') ? payload.video : null;

  const consoleLogs = getConsoleLogs();
  const networkLogs = getNetworkLogs();
  const errorLogs = getErrorLogs();
  const environment = getEnvironmentInfo('demo-app');

  console.log('[SubmitTicket] Logs gathered', { consoleLogs: consoleLogs.length, networkLogs: networkLogs.length, errorLogs: errorLogs.length });

  const logsFile = buildLogsFile({
    consoleLogs,
    networkLogs,
    errorLogs,
    environment,
  });

  const files: File[] = [...imageFiles];
  if (videoFile) files.push(videoFile);
  files.push(logsFile);
  console.log('[SubmitTicket] Files to upload', files.map((f) => ({ name: f.name, size: f.size })));

  let ticketId: string;
  try {
    const result = await submitToZohoDesk(
      payload.title.trim(),
      payload.description.trim(),
      files
    );
    ticketId = result.ticketId;
  } catch (e) {
    console.error('[SubmitTicket] Failed', e instanceof Error ? e.message : e);
    throw e;
  }

  return {
    success: true,
    message: 'Ticket submitted successfully',
    ticketId,
    title: payload.title,
    description: payload.description,
    imageCount: imageFiles.length,
    hasVideo: !!videoFile,
    consoleLogCount: consoleLogs.length,
    networkLogCount: networkLogs.length,
  };
}
