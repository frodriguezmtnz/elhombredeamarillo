FROM node:22-alpine AS builder
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY sandbox/the-road/package.json ./sandbox/the-road/
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build:road && pnpm build && node scripts/copy-road.mjs

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY nginx-security-headers.conf /etc/nginx/snippets/security-headers.conf
EXPOSE 3000
