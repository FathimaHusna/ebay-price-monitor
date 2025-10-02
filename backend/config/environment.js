const dotenv = require('dotenv');

function loadEnv() {
  dotenv.config();
  return {
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: process.env.PORT || 3001,
    MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/ebay_monitor',
    JWT_SECRET: process.env.JWT_SECRET || 'change_me',
    SMTP_HOST: process.env.SMTP_HOST || '',
    SMTP_PORT: Number(process.env.SMTP_PORT || 587),
    SMTP_USER: process.env.SMTP_USER || '',
    SMTP_PASS: process.env.SMTP_PASS || '',
    FROM_EMAIL: process.env.FROM_EMAIL || 'noreply@example.com',
    ALERT_THRESHOLD_DEFAULT: Number(process.env.ALERT_THRESHOLD_DEFAULT || 5),
    ALERT_FREQUENCY_DEFAULT: process.env.ALERT_FREQUENCY_DEFAULT || 'immediate'
  };
}

module.exports = { loadEnv };

