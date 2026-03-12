# Stage 1: Build frontend
FROM node:22-alpine AS frontend
WORKDIR /app/frontend
RUN corepack enable && corepack prepare pnpm@latest --activate
COPY frontend/package.json frontend/pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY frontend/ ./
RUN pnpm build

# Stage 2: Build backend
FROM golang:1.23-alpine AS backend
WORKDIR /app/backend
COPY backend/go.mod backend/go.sum ./
RUN go mod download
COPY backend/ ./
COPY --from=frontend /app/frontend/dist ./dist
RUN CGO_ENABLED=1 GOOS=linux go build -o nice-pricing .

# Stage 3: Runtime
FROM alpine:3.21
RUN apk add --no-cache ca-certificates tzdata
WORKDIR /app
COPY --from=backend /app/backend/nice-pricing .
VOLUME ["/data"]
ENV DB_PATH=/data/pricing.db
ENV PORT=8080
EXPOSE 8080
CMD ["./nice-pricing"]
