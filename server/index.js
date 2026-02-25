require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { getAccessToken, createTicket, addAttachmentToTicket } = require('./zoho');

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.json());

app.post('/api/zoho/token', async (req, res) => {
  try {
    const token = await getAccessToken();
    res.json({ access_token: token });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/zoho/tickets', upload.any(), async (req, res) => {
  const { subject, description } = req.body || {};
  const files = req.files || [];
  console.log('[API /api/zoho/tickets] Request received', { subject: subject?.slice(0, 50), descriptionLength: description?.length ?? 0, fileCount: files.length, fileNames: files.map((f) => f.originalname) });

  try {
    if (!subject) {
      console.log('[API /api/zoho/tickets] Validation failed: subject is required');
      return res.status(400).json({ error: 'subject is required' });
    }
    console.log('[API /api/zoho/tickets] Step 1: Getting access token');
    const accessToken = await getAccessToken();
    console.log('[API /api/zoho/tickets] Step 2: Creating ticket in Zoho Desk');
    const ticketId = await createTicket(accessToken, subject || '', description || '');
    console.log('[API /api/zoho/tickets] Ticket created', { ticketId });
    for (let i = 0; i < files.length; i++) {
      console.log('[API /api/zoho/tickets] Step 3: Adding attachment', i + 1, 'of', files.length, '-', files[i].originalname);
      await addAttachmentToTicket(accessToken, ticketId, files[i].buffer, files[i].originalname);
    }
    console.log('[API /api/zoho/tickets] Success', { ticketId });
    res.json({ ticketId, message: 'Ticket created successfully' });
  } catch (e) {
    console.error('[API /api/zoho/tickets] Error', e.message);
    res.status(500).json({ error: e.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Zoho proxy running on http://localhost:${PORT}`));
