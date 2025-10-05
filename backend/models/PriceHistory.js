const mongoose = require('mongoose');

const PriceHistorySchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', index: true },
    competitorId: { type: mongoose.Schema.Types.ObjectId },
    price: { type: Number, required: true },
    priceChange: { type: Number },
    percentChange: { type: Number },
    // Keep only 30 days of history via TTL index
    checkedAt: { type: Date, default: Date.now, expires: 60 * 60 * 24 * 30 },
    scrapingStatus: { type: String, enum: ['success', 'failed', 'blocked'], default: 'success' }
  },
  { minimize: false }
);

module.exports = mongoose.model('PriceHistory', PriceHistorySchema);
