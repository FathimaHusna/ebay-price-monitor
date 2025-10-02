const mongoose = require('mongoose');
const logger = require('../utils/logger');

async function connectToDatabase(uri) {
  mongoose.set('strictQuery', false);
  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10000
  });
  logger.info('Connected to MongoDB');
}

module.exports = { connectToDatabase };

