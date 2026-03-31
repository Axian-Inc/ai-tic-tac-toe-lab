FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY server/index.js ./server/index.js

ENV PORT=5174
EXPOSE 5174

CMD ["node", "server/index.js"]
