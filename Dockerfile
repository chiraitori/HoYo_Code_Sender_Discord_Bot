# Build stage
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Runtime stage
FROM node:18-alpine

# Create non-root user
RUN addgroup -S botuser && adduser -S botuser -G botuser

# Set working directory
WORKDIR /app

# Copy built files from builder stage
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/commands ./commands
COPY --from=builder /app/models ./models
COPY --from=builder /app/utils ./utils
COPY --from=builder /app/lang ./lang
COPY --from=builder /app/public ./public
COPY --from=builder /app/index.js ./

# Set environment variables
ENV NODE_ENV=production

# Change ownership to non-root user
RUN chown -R botuser:botuser /app

# Switch to non-root user
USER botuser

# Expose port
EXPOSE 3000

# Start the bot
CMD ["node", "index.js"]