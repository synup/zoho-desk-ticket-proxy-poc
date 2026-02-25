# Zoho Desk Ticket Proxy – POC

Demo app that lets users report issues from the browser. A floating feedback bubble opens a modal to submit title, description, images, and optional video. The frontend collects support context (console, network, errors, environment), sends everything to a backend, and the backend creates a **Zoho Desk** ticket and attaches all files (including a support-logs JSON).

## What’s in this repo

- **Frontend** – React + TypeScript + Vite: feedback bubble, ticket modal, support data collection, success banner with ticket ID.
- **Backend** – Node/Express in `server/`: Zoho OAuth token refresh, ticket creation, file uploads to Zoho Desk. Keeps `client_secret` and `refresh_token` off the frontend.

## Quick start

### 1. Backend (Zoho proxy)

- Copy `server/.env.example` to `server/.env` and fill in your Zoho values (refresh token, client id/secret, org id, and optionally department/contact ids). See [server/README.md](server/README.md) for details.

**Option A – Run locally**
```bash
cd server
npm install
npm start
```

**Option B – Run with Docker**
```bash
docker build -t zoho-server .
docker run -p 3001:3001 --env-file server/.env zoho-server
```

Server runs on **port 3001** (override with `PORT` if needed).

### 2. Frontend

```bash
npm install
npm run dev
```

Vite proxies `/api` to `http://localhost:3001`, so the feedback form talks to the Zoho proxy without CORS setup.

## Project structure

| Path | Purpose |
|------|--------|
| `server/` | Zoho proxy: token refresh, create ticket, attach files |
| `src/components/` | FeedbackBubble, TicketModal, TicketSuccessBanner, DataSections |
| `src/utils/` | submitTicket, console/network/error/environment loggers |

## Tech stack

- **Frontend:** React 18, TypeScript, Vite.
- **Backend:** Node 20, Express, multer; Zoho Desk APIs (OAuth, tickets, attachments).

For more on the server API and env vars, see [server/README.md](server/README.md).
