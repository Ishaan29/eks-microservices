# STAGE 1: Builder (Install dependencies)
FROM python:3.11-slim as builder

WORKDIR /app

# Install build tools (gcc) required for some python packages
RUN apt-get update && apt-get install -y gcc && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

# Install dependencies to a local folder (/install)
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

# STAGE 2: Runtime (Secure & Small)
FROM python:3.11-slim

WORKDIR /app

# [Security] Create a non-root user 'appuser'
# Source Requirement: "Require non-root containers" 
RUN addgroup --system appgroup && adduser --system --group appuser

# Install curl for Healthcheck
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Copy installed python packages from the builder stage
COPY --from=builder /install /usr/local

# Copy application code
COPY . .

# Change ownership to the non-root user
RUN chown -R appuser:appgroup /app

# Switch to the non-root user
USER appuser

# [Reliability] Add Healthcheck
# Source Requirement: "HEALTHCHECK directives" 
HEALTHCHECK --interval=30s --timeout=5s \
  CMD curl -f http://localhost:8001/ || exit 1

# Expose the port
EXPOSE 8001

# Start the application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001"]