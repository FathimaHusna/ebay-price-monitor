const mongoose = require('mongoose');

const PriceHistorySchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', index: true },
    competitorId: { type: mongoose.Schema.Types.ObjectId },
    price: { type: Number, required: true },
    priceChange: { type: Number },
    percentChange: { type: Number },
    checkedAt: { type: Date, default: Date.now },
    scrapingStatus: { type: String, enum: ['success', 'failed', 'blocked'], default: 'success' }
  },
  { minimize: false }
);

module.exports = mongoose.model('PriceHistory', PriceHistorySchema);

