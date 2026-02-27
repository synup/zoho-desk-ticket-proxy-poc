/**
 * Zoho Desk API proxy. Keeps refresh_token and client_secret server-side.
 * Requires: ZOHO_REFRESH_TOKEN, ZOHO_CLIENT_ID, ZOHO_CLIENT_SECRET, ZOHO_ORG_ID, ZOHO_DEPARTMENT_ID, ZOHO_CONTACT_ID (optional)
 */

const { ApiError, ExternalServiceError } = require('./errors');

const ZOHO_ACCOUNTS = 'https://accounts.zoho.com';
const ZOHO_DESK = 'https://desk.zoho.com';

let cachedToken = null;
let tokenExpiry = 0;
const TOKEN_BUFFER_MS = 5 * 60 * 1000; // refresh 5 min before expiry

async function getAccessToken() {
  if (cachedToken && Date.now() < tokenExpiry - TOKEN_BUFFER_MS) {
    console.log(
      '[Zoho Token] Using cached token (expires in',
      Math.round((tokenExpiry - Date.now()) / 60000),
      'min)'
    );
    return cachedToken;
  }

  console.log('[Zoho Token] Fetching new access token');
  const refreshToken = process.env.ZOHO_REFRESH_TOKEN;
  const clientId = process.env.ZOHO_CLIENT_ID;
  const clientSecret = process.env.ZOHO_CLIENT_SECRET;

  const missing = [];
  if (!refreshToken) missing.push('ZOHO_REFRESH_TOKEN');
  if (!clientId) missing.push('ZOHO_CLIENT_ID');
  if (!clientSecret) missing.push('ZOHO_CLIENT_SECRET');

  if (missing.length > 0) {
    console.error('[Zoho Token] Missing required env vars:', missing.join(', '));
    throw new ApiError(
      500,
      'ZOHO_CONFIG_MISSING',
      'Zoho API credentials are not configured correctly.',
      { missing }
    );
  }

  const scope =
    'Desk.tickets.CREATE Desk.tickets.READ Desk.tickets.UPDATE Desk.contacts.READ Desk.contacts.CREATE';
  const url = `${ZOHO_ACCOUNTS}/oauth/v2/token?refresh_token=${encodeURIComponent(
    refreshToken
  )}&client_id=${encodeURIComponent(clientId)}&client_secret=${encodeURIComponent(
    clientSecret
  )}&scope=${encodeURIComponent(scope)}&grant_type=refresh_token`;

  const res = await fetch(url, { method: 'POST' });
  const data = await res.json();

  if (data.error) {
    console.error('[Zoho Token] Error response', {
      status: res.status,
      error: data.error,
      description: data.description,
    });
    throw new ExternalServiceError('ZOHO_TOKEN_ERROR', 'Unable to obtain Zoho access token.', {
      status: res.status,
      response: data,
    });
  }

  cachedToken = data.access_token;
  tokenExpiry = Date.now() + (data.expires_in_sec || 3600) * 1000;
  console.log('[Zoho Token] Success (expires in', data.expires_in_sec || 3600, 'sec)');
  return cachedToken;
}

function getOrgId() {
  const id = process.env.ZOHO_ORG_ID;
  if (!id) {
    console.error('[Zoho Config] Missing ZOHO_ORG_ID');
    throw new ApiError(
      500,
      'ZOHO_ORG_MISSING',
      'Zoho organization configuration is missing.',
      { env: 'ZOHO_ORG_ID' }
    );
  }
  return id;
}

function getDepartmentId() {
  return process.env.ZOHO_DEPARTMENT_ID || null;
}

async function getOrCreateContact(accessToken, customer) {
  if (!customer?.email) return null;

  const email = String(customer.email).trim().toLowerCase();
  if (!email) return null;

  const orgId = process.env.ZOHO_ORG_ID;
  if (!orgId) return null;

  try {
    const query = encodeURIComponent(`email:"${email.replace(/"/g, '\\"')}"`);
    const searchRes = await fetch(
      `https://desk.zoho.com/api/v1/contacts/search?query=${query}`,
      {
        headers: {
          Authorization: `Zoho-oauthtoken ${accessToken}`,
          orgId,
        },
      }
    );

    const searchData = await searchRes.json();

    if (searchData?.data?.length > 0) {
      console.log('[Zoho Contact] Found existing contact:', email);
      return String(searchData.data[0].id);
    }
  } catch (e) {
    console.error('[Zoho Contact] Search failed:', e.message);
  }

  try {
    const name = customer.name ? String(customer.name).trim() : 'Unknown';
    const body = { email, lastName: name };

    const createRes = await fetch('https://desk.zoho.com/api/v1/contacts', {
      method: 'POST',
      headers: {
        Authorization: `Zoho-oauthtoken ${accessToken}`,
        orgId,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const raw = await createRes.text();
    console.log('[Zoho Contact] Create raw response:', {
      status: createRes.status,
      ok: createRes.ok,
      body: raw.slice(0, 500),
    });

    let createData = {};
    try {
      createData = raw ? JSON.parse(raw) : {};
    } catch (e) {
      console.error('[Zoho Contact] Create JSON parse failed:', e.message);
    }

    const contactId =
      createData?.id ?? createData?.response?.id ?? createData?.data?.id;

    if (contactId && createRes.ok) {
      console.log('[Zoho Contact] Created new contact:', email, 'id:', contactId);
      return String(contactId);
    }

    if (!createRes.ok) {
      console.error(
        '[Zoho Contact] Create failed:',
        createData?.message || createData?.error || createRes.statusText
      );
    }
  } catch (e) {
    console.error('[Zoho Contact] Creation failed:', e.message);
  }

  return null;
}

async function createTicket(accessToken, subject, description, customerContactId) {
  const orgId = getOrgId();
  const body = { subject, description };

  if (process.env.ZOHO_DEPARTMENT_ID) {
    body.departmentId = process.env.ZOHO_DEPARTMENT_ID;
  }

  if (customerContactId) {
    body.contactId = customerContactId;
  } else if (process.env.ZOHO_CONTACT_ID) {
    body.contactId = process.env.ZOHO_CONTACT_ID;
  }

  const contactId = body.contactId || null;
  console.log('[Zoho CreateTicket] Request', {
    orgId,
    departmentId: body.departmentId || '(not set)',
    contactId: contactId || '(not set)',
    subject: subject?.slice(0, 50),
  });

  const res = await fetch(`${ZOHO_DESK}/api/v1/tickets`, {
    method: 'POST',
    headers: {
      Authorization: `Zoho-oauthtoken ${accessToken}`,
      orgId,
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

    throw new ExternalServiceError(
      'ZOHO_CREATE_TICKET_FAILED',
      'Failed to create support ticket.',
      { status: res.status, response: data }
    );
  }

  const id =
    data.id ??
    data.data?.id ??
    data.ticket?.id ??
    data.response?.id ??
    data.result?.id;

  if (!id) {
    console.error('[Zoho CreateTicket] No ticket id in response', data);
    throw new ExternalServiceError(
      'ZOHO_TICKET_ID_MISSING',
      'Ticket created but no id was returned by Zoho.',
      { response: data }
    );
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
  console.log('[Zoho Attachment] Uploading', {
    filename: filename || 'file',
    ticketId,
    orgId,
  });

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Zoho-oauthtoken ${accessToken}`,
      orgId,
    },
    body: form,
  });

  if (!res.ok) {
    const text = await res.text();
    let parsed;
    try {
      parsed = text ? JSON.parse(text) : null;
    } catch (_) {
      parsed = null;
    }

    console.error('[Zoho Attachment] Error', {
      status: res.status,
      filename: filename || 'file',
      body: text.slice(0, 300),
    });

    throw new ExternalServiceError(
      'ZOHO_ATTACHMENT_FAILED',
      'Failed to upload attachment to Zoho.',
      { status: res.status, response: parsed || text }
    );
  }

  console.log('[Zoho Attachment] Success', filename || 'file');
  return res;
}

module.exports = {
  getAccessToken,
  createTicket,
  addAttachmentToTicket,
  getOrCreateContact,
};

