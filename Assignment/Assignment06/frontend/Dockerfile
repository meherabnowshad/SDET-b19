FROM node:20-alpine

WORKDIR /app

# Install all deps (devDeps needed for `next build` — do NOT set NODE_ENV yet)
COPY package*.json ./
RUN npm ci

# Build the Next.js app (API URL baked in at build time)
COPY . .
ARG NEXT_PUBLIC_API_URL=http://localhost:5001/api
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
RUN npm run build

# Slim the runtime image + set runtime env
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
RUN npm prune --omit=dev

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

CMD ["npm", "start"]
