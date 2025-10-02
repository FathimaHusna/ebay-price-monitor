const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { loadEnv } = require('./config/environment');
const { connectToDatabase } = require('./config/database');
const logger = require('./utils/logger');
const { attachUser } = require('./middleware/auth');

// Load environment
const env = loadEnv();

// Initialize express
const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));
app.use(attachUser);

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/alerts', require('./routes/alerts'));
app.use('/api/dashboard', require('./routes/dashboard'));

app.get('/healthz', (_req, res) => {
  res.json({ status: 'ok' });
});
app.get('/api/healthz', (_req, res) => {
  res.json({ status: 'ok' });
});

const port = env.PORT || 3001;

async function start() {
  try {
    await connectToDatabase(env.MONGODB_URI);
    app.listen(port, () => {
      logger.info(`API listening on :${port}`);
    });
    // Start scheduler
    const scheduler = require('./services/scheduler');
    scheduler.start();
  } catch (err) {
    logger.error(`Startup error: ${err.message}`);
    process.exit(1);
  }
}

start();
