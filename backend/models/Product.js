const mongoose = require('mongoose');

const CompetitorSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    name: { type: String },
    currentPrice: { type: Number },
    lastChecked: { type: Date },
    isActive: { type: Boolean, default: true }
  },
  { _id: true }
);

const ProductSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    name: { type: String, required: true },
    category: { type: String },
    myListingUrl: { type: String },
    myCurrentPrice: { type: Number },
    profitMargin: { type: Number },
    competitors: { type: [CompetitorSchema], default: [] },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  },
  { minimize: false }
);

ProductSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Product', ProductSchema);

