# ============================================
# Production Dockerfile for NestJS
# ============================================

FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package.json pnpm-lock.yaml ./
RUN npm install

# Copy source and build
COPY . .
RUN npm run build

# Production image
FROM node:20-alpine

WORKDIR /app

# Copy built files
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

# Create directories
RUN mkdir -p uploads logs

# Expose port
EXPOSE 3001

# Start application
CMD ["node", "dist/main.js"]
