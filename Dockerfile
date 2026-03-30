# ============================================================
# Dockerfile — Playwright in Docker Container
# ============================================================
# Use the official Playwright Docker image — it has all
# browsers and system dependencies pre-installed.
#
# PHASE 7 — Topic 33: Docker setup for Playwright
# ============================================================

# Use Playwright's official base image
# This image includes Node.js, all browsers, and system deps
FROM mcr.microsoft.com/playwright:v1.44.0-jammy

# Set working directory inside container
WORKDIR /app

# Copy package files first (Docker layer caching optimization)
# Only re-runs npm install if package.json/lock changes
COPY package*.json ./

# Install Node dependencies (browsers already installed in base image)
RUN npm ci

# Copy all project files
COPY . .

# Set environment variable defaults
ENV NODE_ENV=test
ENV CI=true

# Default command: run all tests
CMD ["npx", "playwright", "test"]
