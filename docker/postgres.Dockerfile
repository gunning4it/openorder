# SPDX-License-Identifier: AGPL-3.0-or-later
# SPDX-FileCopyrightText: 2025 OpenOrder Contributors
#
# Custom PostgreSQL image with updated gosu to fix CVE-2025-58183, CVE-2025-61726,
# CVE-2025-61728, CVE-2025-61729, CVE-2025-61730, CVE-2025-68121

# Use official postgres as base
FROM postgres:18-alpine3.23 AS base

# Build stage: Compile gosu with latest Go
FROM golang:1.25-alpine AS gosu-builder

# Install build dependencies
RUN apk add --no-cache git

# Clone and build gosu with latest Go stdlib
RUN git clone --depth 1 --branch 1.19 https://github.com/tianon/gosu.git /gosu && \
    cd /gosu && \
    go build -v -ldflags="-s -w" -o /usr/local/bin/gosu && \
    chmod +x /usr/local/bin/gosu

# Final stage: Use postgres base with updated gosu
FROM postgres:18-alpine3.23

# Copy updated gosu binary
COPY --from=gosu-builder /usr/local/bin/gosu /usr/local/bin/gosu

# Verify gosu works and show version
RUN gosu --version

# Keep original postgres entrypoint and configuration
# No changes to postgres functionality, only gosu update
