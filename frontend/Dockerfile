FROM node:18-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci || npm install
COPY . .
RUN npm run build

# Static file server is Nginx via docker-compose mounting ./frontend/dist
# This image can be used standalone with an http server if desired.

