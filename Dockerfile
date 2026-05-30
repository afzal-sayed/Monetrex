# Stage 1: compile better-sqlite3 native binding
FROM node:22-slim AS build
WORKDIR /app
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*
COPY package*.json ./
RUN npm ci --omit=dev

# Stage 2: lean runtime image (no build tools)
FROM node:22-slim
WORKDIR /app
COPY --from=build /app/node_modules ./node_modules
COPY server/ ./server/
COPY package.json ./
ENV NODE_ENV=production
EXPOSE 3001
CMD ["node", "server/index.js"]
