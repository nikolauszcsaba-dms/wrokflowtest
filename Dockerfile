FROM node:24-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY server/package.json server/
COPY client/package.json client/
RUN npm ci
COPY server server
COPY client client
RUN npm run build

FROM node:24-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY server/package.json server/
COPY client/package.json client/
RUN npm ci --omit=dev --workspace server

FROM mongo:8.0
COPY --from=build /usr/local/bin/node /usr/local/bin/node
WORKDIR /app
COPY --from=deps /app/node_modules node_modules
COPY --from=build /app/server/package.json server/package.json
COPY --from=build /app/server/dist server/dist
COPY --from=build /app/client/dist client/dist
COPY docker/start.sh /start.sh
RUN sed -i 's/\r$//' /start.sh

ENV NODE_ENV=production \
    PORT=8080 \
    CLIENT_DIR=/app/client/dist \
    MONGO_URI=mongodb://127.0.0.1:27017/app

EXPOSE 8080
ENTRYPOINT ["sh", "/start.sh"]
