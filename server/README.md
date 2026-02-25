# Zoho Desk API proxy

This server keeps your Zoho `client_secret` and `refresh_token` off the frontend and handles token refresh and ticket creation.

## Setup

1. Copy `server/.env.example` to `server/.env`.
2. Fill in your Zoho values:
  - **ZOHO_REFRESH_TOKEN**, **ZOHO_CLIENT_ID**, **ZOHO_CLIENT_SECRET** – from your OAuth app.
  - **ZOHO_ORG_ID** – from Zoho Desk (Organization ID in settings).
  - **ZOHO_DEPARTMENT_ID** / **ZOHO_CONTACT_ID** – optional; set if your Desk requires them for new tickets.

## Run

```bash
cd server
npm install
npm start
```

Runs on port 3001 by default. Use `PORT=3002 npm start` to change.

## Endpoints

- **POST /api/zoho/token** – Returns `{ access_token }` (refreshed as needed, ~60 min validity).
- **POST /api/zoho/tickets** – Creates a ticket and attaches files.
  - Body: `multipart/form-data` with `subject`, `description`, and `files` (multiple).
  - Response: `{ ticketId, message }`.

## Dev with Vite

Start this server, then run `npm run dev` in the project root. Vite proxies `/api` to `http://localhost:3001`.