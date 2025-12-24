# Stage 1: Build
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Stage 2: Production
FROM node:22-alpine AS production

WORKDIR /app

COPY package*.json ./
RUN npm install --only=production

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src ./src
COPY --from=builder /app/src/config/plan_config.json ./dist/config/plan_config.json

# Note: In real prod, .env should be injected, but for this setup we copy it if it exists or rely on docker-compose env vars.

EXPOSE 3000

CMD ["npm", "start"]
