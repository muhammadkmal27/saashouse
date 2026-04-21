# Stage 1: Build the binary
FROM rust:1.80-slim-bookworm AS builder

# Install build dependencies
RUN apt-get update && apt-get install -y \
    pkg-config \
    libssl-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy all files
COPY . .

# Build the application
# We use SQLX_OFFLINE=true because the .sqlx folder is already present
ENV SQLX_OFFLINE=true
RUN cargo build --release --bin backend

# Stage 2: Final runtime image
FROM debian:bookworm-slim

WORKDIR /app

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    ca-certificates \
    libssl-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy the binary from builder
COPY --from=builder /app/target/release/backend /app/backend

# Copy assets and uploads directories if they exist
COPY --from=builder /app/assets /app/assets
COPY --from=builder /app/uploads /app/uploads

# Expose the API port
EXPOSE 8080

# Run the binary
CMD ["./backend"]
