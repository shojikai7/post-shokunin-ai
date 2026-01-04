# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies for canvas/sharp
RUN apk add --no-cache python3 make g++ cairo-dev pango-dev jpeg-dev giflib-dev

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Install runtime dependencies for canvas/sharp
RUN apk add --no-cache cairo pango libjpeg-turbo giflib

# Copy built files
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package*.json ./

# Set environment
ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

CMD ["node", "dist/index.js"]

