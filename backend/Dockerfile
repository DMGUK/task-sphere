FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/
COPY tsconfig.json ./

RUN npm ci

COPY src ./src

RUN npx prisma generate && npx tsc

RUN mkdir -p uploads/avatars

EXPOSE 4000

CMD npx prisma migrate deploy && node dist/server.js
