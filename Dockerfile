# Stage 1: Backend
FROM node:20-alpine

# Install nginx to serve the static frontend
RUN apk add --no-cache nginx

# Copy nginx config
COPY nginx.conf /etc/nginx/nginx.conf

# Copy static frontend (ticket-widget.js)
COPY public/ /usr/share/nginx/html/

# Setup backend
WORKDIR /app/server
COPY server/package*.json ./
RUN npm install --omit=dev
COPY server/ .

# Default CMD is backend; frontend container overrides to nginx
EXPOSE 80 3001
CMD ["node", "index.js"]
