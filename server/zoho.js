/**
 * Zoho Desk API proxy. Keeps refresh_token and client_secret server-side.
 * Requires: ZOHO_REFRESH_TOKEN, ZOHO_CLIENT_ID, ZOHO_CLIENT_SECRET, ZOHO_ORG_ID, ZOHO_DEPARTMENT_ID, ZOHO_CONTACT_ID (optional)
 */

const ZOHO_ACCOUNTS = 'https://accounts.zoho.com';
const ZOHO_DESK = 'https://desk.zoho.com';

let cachedToken = null;
let tokenExpiry = 0;
const TOKEN_BUFFER_MS = 5 * 60 * 1000; // refresh 5 min before expiry

async function getAccessToken() {
  if (cachedToken && Date.now() < tokenExpiry - TOKEN_BUFFER_MS) {
    console.log('[Zoho Token] Using cached token (expires in', Math.round((tokenExpiry - Date.now()) / 60000), 'min)');
    return cachedToken;
  }
  console.log('[Zoho Token] Fetching new access token');
  const refreshToken = process.env.ZOHO_REFRESH_TOKEN;
  const clientId = process.env.ZOHO_CLIENT_ID;
  const clientSecret = process.env.ZOHO_CLIENT_SECRET;
  if (!refreshToken || !clientId || !clientSecret) {
    const missing = [];
    if (!refreshToken) missing.push('ZOHO_REFRESH_TOKEN');
    if (!clientId) missing.push('ZOHO_CLIENT_ID');
    if (!clientSecret) missing.push('ZOHO_CLIENT_SECRET');
    throw new Error('Missing: ' + missing.join(', '));
  }
  const scope = 'Desk.tickets.CREATE Desk.tickets.READ Desk.tickets.UPDATE';
  const url = `${ZOHO_ACCOUNTS}/oauth/v2/token?refresh_token=${encodeURIComponent(refreshToken)}&client_id=${encodeURIComponent(clientId)}&client_secret=${encodeURIComponent(clientSecret)}&scope=${encodeURIComponent(scope)}&grant_type=refresh_token`;
  const res = await fetch(url, { method: 'POST' });
  const data = await res.json();
  if (data.error) {
    console.error('[Zoho Token] Error response', { status: res.status, error: data.error, description: data.description });
    throw new Error(data.error + (data.description ? ': ' + data.description : ''));
  }
  cachedToken = data.access_token;
  tokenExpiry = Date.now() + (data.expires_in_sec || 3600) * 1000;
  console.log('[Zoho Token] Success (expires in', data.expires_in_sec || 3600, 'sec)');
  return cachedToken;
}

function getOrgId() {
  const id = process.env.ZOHO_ORG_ID;
  if (!id) throw new Error('Missing ZOHO_ORG_ID');
  return id;
}

function getDepartmentId() {
  return process.env.ZOHO_DEPARTMENT_ID || null;
}

function getContactId() {
  return process.env.ZOHO_CONTACT_ID || null;
}

async function createTicket(accessToken, subject, description) {
  const orgId = getOrgId();
  const departmentId = getDepartmentId();
  const contactId = getContactId();
  const body = { subject, description };
  if (departmentId) body.departmentId = departmentId;
  if (contactId) body.contactId = contactId;

  console.log('[Zoho CreateTicket] Request', { orgId, departmentId: departmentId || '(not set)', contactId: contactId || '(not set)', subject: subject?.slice(0, 50) });
  const res = await fetch(`${ZOHO_DESK}/api/v1/tickets`, {
    method: 'POST',
    headers: {
      'Authorization': `Zoho-oauthtoken ${accessToken}`,
      'orgId': orgId,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (!res.ok) {
    console.error(
      '[Zoho CreateTicket] Error response\n',
      JSON.stringify(data, null, 2)
    );
  
    const msg =
      data?.message ||
      data?.error ||
      res.statusText;
  
    throw new Error(msg);
  }
  const id = data.id ?? data.data?.id ?? data.ticket?.id ?? data.response?.id ?? data.result?.id;
  if (!id) {
    console.error('[Zoho CreateTicket] No ticket id in response', data);
    throw new Error('No ticket id in response: ' + JSON.stringify(data).slice(0, 200));
  }
  console.log('[Zoho CreateTicket] Success', { ticketId: id });
  return String(id);
}

async function addAttachmentToTicket(accessToken, ticketId, fileBuffer, filename) {
  const orgId = getOrgId();
  const form = new FormData();
  const blob = new Blob([fileBuffer], { type: 'application/octet-stream' });
  form.append('file', blob, filename || 'file');

  const url = `${ZOHO_DESK}/api/v1/tickets/${ticketId}/attachments`;
  console.log('[Zoho Attachment] Uploading', { filename: filename || 'file', ticketId, orgId });
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Zoho-oauthtoken ${accessToken}`,
      'orgId': orgId,
    },
    body: form,
  });

  if (!res.ok) {
    const text = await res.text();
    let errMsg = res.statusText;
    try {
      const j = JSON.parse(text);
      if (j.message) errMsg = j.message;
      else if (j.error) errMsg = j.error;
    } catch (_) {}
    console.error('[Zoho Attachment] Error', { status: res.status, filename: filename || 'file', body: text.slice(0, 300) });
    throw new Error(errMsg);
  }
  console.log('[Zoho Attachment] Success', filename || 'file');
  return res;
}

module.exports = { getAccessToken, createTicket, addAttachmentToTicket };
