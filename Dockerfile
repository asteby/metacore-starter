FROM node:22-alpine AS base

WORKDIR /app
RUN npm install -g pnpm
COPY package.json pnpm-lock.yaml* ./

FROM base AS dev
RUN pnpm install
COPY . .
EXPOSE 5173
CMD ["pnpm", "run", "dev", "--host"]

FROM base AS builder
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

FROM node:22-alpine AS prod
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/public ./public
EXPOSE 5173
CMD ["npx", "vite", "preview", "--host", "--port", "5173"]
