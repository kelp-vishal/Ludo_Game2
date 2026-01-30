# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy shared library
COPY shared-lib ./shared-lib

# Build shared library first
WORKDIR /app/shared-lib
RUN npm ci && npm run build

# Copy client files maintaining directory structure
WORKDIR /app/client
COPY client/package*.json ./
COPY client/tsconfig*.json ./
COPY client/nx.json ./
COPY client/project.json ./
COPY client/eslint.config.mjs ./
COPY client/src ./src
COPY client/public ./public
COPY client/styles ./styles

# Install dependencies (this will link to ../shared-lib)
RUN npm ci

# Build the application for production
RUN npx nx build --prod

# Production stage with nginx
FROM nginx:alpine AS production

# Copy built files from builder
COPY --from=builder /app/client/dist/client /usr/share/nginx/html

# Copy nginx configuration
COPY client/nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
