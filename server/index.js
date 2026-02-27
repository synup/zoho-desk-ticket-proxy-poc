require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const {
  getAccessToken,
  createTicket,
  addAttachmentToTicket,
  getOrCreateContact,
} = require('./zoho');
const { ApiError, ValidationError } = require('./errors');

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.disable('x-powered-by');

app.use(cors());
app.use(express.json());

function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

app.post(
  '/api/zoho/token',
  asyncHandler(async (req, res) => {
    const token = await getAccessToken();
    res.json({ access_token: token });
  })
);

app.post(
  '/api/zoho/tickets',
  upload.any(),
  asyncHandler(async (req, res) => {
    const { subject, description } = req.body || {};
    const files = req.files || [];

    let customer = null;
    if (req.body?.customer) {
      try {
        customer = JSON.parse(req.body.customer);
      } catch (e) {
        throw new ValidationError(
          'INVALID_CUSTOMER',
          'The "customer" field must be valid JSON.',
          { raw: String(req.body.customer).slice(0, 200) }
        );
      }
    }

    console.log('[API /api/zoho/tickets] Request received', {
      subject: subject?.slice(0, 50),
      descriptionLength: description?.length ?? 0,
      fileCount: files.length,
      fileNames: files.map((f) => f.originalname),
    });
    console.log('[API /api/zoho/tickets] Parsed customer:', customer);

    if (!subject) {
      console.log(
        '[API /api/zoho/tickets] Validation failed: subject is required'
      );
      throw new ValidationError('SUBJECT_REQUIRED', 'subject is required');
    }

    console.log('[API /api/zoho/tickets] Step 1: Getting access token');
    const accessToken = await getAccessToken();

    let contactId = null;
    if (customer?.email) {
      contactId = await getOrCreateContact(accessToken, customer);
    }
    console.log('[API /api/zoho/tickets] Resolved contactId:', contactId);

    console.log(
      '[API /api/zoho/tickets] Step 2: Creating ticket in Zoho Desk'
    );
    const ticketId = await createTicket(
      accessToken,
      subject || '',
      description || '',
      contactId
    );
    console.log('[API /api/zoho/tickets] Ticket created', { ticketId });

    for (let i = 0; i < files.length; i++) {
      console.log(
        '[API /api/zoho/tickets] Step 3: Adding attachment',
        i + 1,
        'of',
        files.length,
        '-',
        files[i].originalname
      );
      await addAttachmentToTicket(
        accessToken,
        ticketId,
        files[i].buffer,
        files[i].originalname
      );
    }

    console.log('[API /api/zoho/tickets] Success', { ticketId });
    res.json({ ticketId, message: 'Ticket created successfully' });
  })
);

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use((req, res) => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: 'Route not found',
    },
  });
});

app.use((err, req, res, next) => {
  const isProd = process.env.NODE_ENV === 'production';

  if (!(err instanceof ApiError)) {
    console.error('[Unhandled Error]', err);
  } else {
    console.error('[Handled ApiError]', {
      code: err.code,
      message: err.message,
      details: err.details,
    });
  }

  const status = err.statusCode || 500;
  const code = err.code || 'INTERNAL_ERROR';

  const responseError = {
    code,
    message:
      status === 500 && isProd
        ? 'Internal server error'
        : err.message || 'Internal server error',
  };

  if (err.details && !isProd) {
    responseError.details = err.details;
  }

  res.status(status).json({ error: responseError });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () =>
  console.log(`Zoho proxy running on http://localhost:${PORT}`)
);

