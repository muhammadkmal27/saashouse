# Stage 1: Install dependencies and build the app
FROM node:20-alpine AS builder
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy all files
COPY . .

# Build the application
# We set NEXT_TELEMETRY_DISABLED to 1 to skip telemetry
ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

# Stage 2: Serve the application
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Copy build artifacts and dependencies
COPY --from=builder /app/next.config.ts ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Expose the frontend port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
