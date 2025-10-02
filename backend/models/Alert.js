const mongoose = require('mongoose');

const AlertSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    competitorId: { type: mongoose.Schema.Types.ObjectId },
    alertType: { type: String, enum: ['price_drop', 'price_increase'], required: true },
    oldPrice: { type: Number },
    newPrice: { type: Number },
    percentChange: { type: Number },
    sentAt: { type: Date, default: Date.now },
    isRead: { type: Boolean, default: false }
  },
  { minimize: false }
);

module.exports = mongoose.model('Alert', AlertSchema);

