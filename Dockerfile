# Stage 1: Build
FROM node:20-alpine AS build

ENV NODE_ENV=build
ENV PNPM_HOME=/root/.local/share/pnpm
ENV PATH=$PATH:$PNPM_HOME

RUN apk add --no-cache curl openssl && \
    curl -fsSL "https://github.com/pnpm/pnpm/releases/latest/download/pnpm-linuxstatic-x64" -o /bin/pnpm && \
    chmod +x /bin/pnpm && \
    apk del curl

USER node
WORKDIR /home/node

COPY --chown=node:node package*.json pnpm-lock.yaml ./
RUN pnpm install

COPY --chown=node:node . .

RUN npx prisma generate && pnpm run build && pnpm prune --prod

# Stage 2: Production
FROM node:20-alpine

ENV NODE_ENV=production

USER node
WORKDIR /home/node

COPY --from=build --chown=node:node /home/node/package*.json ./
COPY --from=build --chown=node:node /home/node/node_modules ./node_modules
COPY --from=build --chown=node:node /home/node/dist ./dist
COPY --from=build --chown=node:node /home/node/prisma ./prisma

EXPOSE 5000

CMD ["sh", "-c", "npx prisma migrate deploy && npm run seed:prod && node dist/src/main.js"]
