# Stage 1: Build frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app
COPY package*.json ./
COPY tsconfig*.json ./
COPY index.html ./
COPY src/ ./src/
COPY public/ ./public/
RUN npm install && npm run build

# Stage 2: Combined image — nginx (frontend) + node (backend)
FROM node:20-alpine

# Install nginx
RUN apk add --no-cache nginx

# Copy built frontend assets
COPY --from=frontend-builder /app/dist /usr/share/nginx/html

# Copy nginx config
COPY nginx.conf /etc/nginx/nginx.conf

# Setup backend
WORKDIR /app/server
COPY server/package*.json ./
RUN npm install --omit=dev
COPY server/ .

# Default CMD is backend (node); frontend container overrides to nginx
EXPOSE 80 3001
CMD ["node", "index.js"]
