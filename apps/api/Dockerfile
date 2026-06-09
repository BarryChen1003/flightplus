FROM node:20-alpine

WORKDIR /app

# Copy monorepo root config (needed for tsconfig extends)
COPY package.json package-lock.json tsconfig.base.json ./

# Copy API package files
COPY apps/api/package.json apps/api/package-lock.json ./
COPY apps/api/src ./apps/api/src
COPY apps/api/tsconfig.json ./apps/api/

# Build API
WORKDIR /app
RUN npm ci && npm run build --prefix apps/api

# Runtime environment
ENV NODE_ENV=production
ENV PORT=3001

WORKDIR /app/apps/api
EXPOSE 3001
CMD ["node", "dist/index.js"]