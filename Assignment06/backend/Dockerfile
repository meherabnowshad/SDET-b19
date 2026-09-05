FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production

# Install prod deps first (better layer caching)
COPY package*.json ./
RUN npm ci --omit=dev

# Copy app source (docs/ for Swagger included; .env excluded via .dockerignore)
COPY . .

# Ensure uploads dir exists (app also mkdirs at runtime; volume mounted in compose)
RUN mkdir -p /app/uploads

ENV PORT=5001
EXPOSE 5001

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:5001/ || exit 1

CMD ["node", "server.js"]
