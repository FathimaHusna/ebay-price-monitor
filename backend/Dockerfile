FROM node:18-alpine
WORKDIR /app
COPY package.json package-lock.json* npm-shrinkwrap.json* ./
RUN npm ci --omit=dev || npm install --omit=dev
COPY . .
ENV NODE_ENV=production
EXPOSE 3001
CMD ["node", "app.js"]

