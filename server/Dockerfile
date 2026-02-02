# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy shared library
COPY shared-lib ./shared-lib

# Build shared library first
WORKDIR /app/shared-lib
RUN npm ci && npm run build

# Copy server files maintaining directory structure
WORKDIR /app/server
COPY server/package*.json ./
COPY server/tsconfig*.json ./
COPY server/nx.json ./
COPY server/apps ./apps

# Install dependencies (this will link to ../shared-lib)
RUN npm ci

# Build the application
RUN npx nx build server --prod

# Production stage
FROM node:20-alpine AS production

WORKDIR /app/server

# Copy package files
COPY server/package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy built application from builder
COPY --from=builder /app/server/dist ./dist
COPY --from=builder /app/server/node_modules ./node_modules
COPY --from=builder /app/shared-lib ../shared-lib

# Expose the port
EXPOSE 3000

# Start the application
CMD ["node", "dist/apps/server/main.js"]
