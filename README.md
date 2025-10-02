A simple, focused eBay price monitoring system. Tracks manually added competitor listing URLs, checks prices daily, stores 30-day history, and sends alert emails when price changes exceed user-defined thresholds.

Key components
- Backend: Node.js/Express + MongoDB + Playwright + node-cron + Nodemailer
- Frontend: React (minimal scaffold) + Axios
- Infra: PM2, Nginx reverse proxy, Let’s Encrypt (via Certbot), Docker Compose (optional)

Quick start (dev)
1) Backend
   - Copy backend/.env.example to backend/.env and edit values
   - From backend/: npm install; npm run dev

2) Frontend (basic Vite scaffold)
   - From frontend/: npm install; npm run dev
   - Open http://localhost:3000

3) MongoDB
   - Ensure MongoDB 6.0+ is running locally (default mongodb://localhost:27017/ebay_monitor)
   - Or via Docker: docker run -d --rm --name mongo6 -p 27017:27017 mongo:6

4) End-to-end checks (mock URLs)
   - In backend, you can install Playwright/Chromium if scraping live pages: `npm install playwright && npx playwright install chromium`
   - For sandboxed/local testing, use mock://listing?price=NNN competitor URLs to exercise the pipeline without external network.

Environment variables (backend/.env)
- PORT: API port (default 3001)
- MONGODB_URI: Mongo connection string
- JWT_SECRET: Token signing secret
- SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, FROM_EMAIL: Email settings
- ALERT_THRESHOLD_DEFAULT: Default alert threshold percent (e.g. 5)
- ALERT_FREQUENCY_DEFAULT: immediate | daily

Main directories
- backend/: Express app, models, routes, services, scheduler
- frontend/: React scaffold with minimal components/pages
- nginx.conf: Reverse proxy config to split / and /api
- docker-compose.yml: Optional local stack with MongoDB

Docker Compose
- Build frontend assets: `cd frontend && npm install && npm run build`
- Start stack: `docker compose up -d --build`
- Open http://localhost/

Notes
- Scraper uses Playwright. In production, install Chromium with `npx playwright install chromium` and persist browser data in ./browser-data.
- Scheduler runs a daily job at 2 AM server time to scrape prices.
- Alert emails are sent on threshold-breaching changes (immediate). Daily digest is a future enhancement.
 - Nginx config in nginx.conf expects built frontend in ./frontend/dist and backend reachable at http://backend:3001 inside Compose.
