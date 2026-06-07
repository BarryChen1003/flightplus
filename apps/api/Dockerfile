FROM node:20-alpine

WORKDIR /app

# Copy monorepo root config for workspace resolution
COPY package.json package-lock.json tsconfig.base.json ./

# Copy API package files and build
COPY apps/api/package.json apps/api/package-lock.json apps/api/
WORKDIR /app/apps/api
RUN npm ci && npm run build

# Copy API source
WORKDIR /app
COPY apps/api/src apps/api/src
COPY apps/api/tsconfig.json apps/api/

# Runtime environment
ENV NODE_ENV=production
ENV PORT=3001

WORKDIR /app/apps/api
EXPOSE 3001
CMD ["node", "dist/index.js"]