FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production

# Install backend deps first (better layer caching)
COPY backend/package*.json ./
RUN npm ci --omit=dev

# Copy backend source (docs/ for Swagger included; .env excluded via .dockerignore)
COPY backend/ ./

# Ensure uploads dir exists (app also mkdirs at runtime)
RUN mkdir -p /app/uploads

ENV PORT=5001
EXPOSE 5001

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:5001/ || exit 1

CMD ["node", "server.js"]
