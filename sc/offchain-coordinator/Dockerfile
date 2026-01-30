FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy from builder
COPY --from=builder /app /app

# Create data directory for LevelDB
RUN mkdir -p /app/data

# Create circuits directory (for volume mount or built-in files)
RUN mkdir -p /app/circuits

# Optionally copy circuit files if they exist (for self-contained image)
# Uncomment these lines if you want circuits built into the image
# COPY circuits/ShariaVoteAggregator.wasm /app/circuits/
# COPY circuits/sharia_0000.zkey /app/circuits/
# COPY circuits/verification_key.json /app/circuits/

# Expose port
EXPOSE 3000

# Environment
ENV NODE_ENV=production
ENV PORT=3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the application
CMD ["node", "src/index.js"]
