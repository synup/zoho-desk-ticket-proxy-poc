# Use lightweight Node image
FROM node:20-alpine

# Create app directory
WORKDIR /app

# Copy package files first (for caching)
COPY server/package*.json ./

# Install only production dependencies
RUN npm install --omit=dev

# Copy server source code
COPY server/ .

# Expose server port
EXPOSE 3001

# Start the app
CMD ["node", "index.js"]
