const Product = require('../models/Product');
const PriceHistory = require('../models/PriceHistory');
const User = require('../models/User');
const scraper = require('./scraper');
const alerts = require('./alerts');
const { loadEnv } = require('../config/environment');
const { percentChange } = require('../utils/helpers');

const env = loadEnv();

async function checkCompetitor(user, product, competitor) {
  const { price, status } = await scraper.scrapePrice(competitor.url);
  const oldPrice = competitor.currentPrice ?? null;
  const newPrice = price ?? null;
  const pct = oldPrice != null && newPrice != null ? percentChange(oldPrice, newPrice) : 0;

  // Record history
  await PriceHistory.create({
    productId: product._id,
    competitorId: competitor._id,
    price: newPrice ?? 0,
    priceChange: oldPrice != null && newPrice != null ? newPrice - oldPrice : 0,
    percentChange: pct,
    scrapingStatus: status === 'success' ? 'success' : 'failed'
  });

  // Update competitor on product
  competitor.currentPrice = newPrice;
  competitor.lastChecked = new Date();

  // Alert threshold logic
  const threshold = user?.alertPreferences?.thresholdPercent ?? env.ALERT_THRESHOLD_DEFAULT;
  const frequency = user?.alertPreferences?.frequency ?? env.ALERT_FREQUENCY_DEFAULT;
  if (oldPrice != null && newPrice != null && Math.abs(pct) >= threshold) {
    if (frequency === 'immediate') {
      await alerts.sendPriceAlert(user, product, competitor, oldPrice, newPrice, pct);
    }
  }

  return { competitorId: competitor._id, status, oldPrice, newPrice, percentChange: pct };
}

async function runProductCheck(product, user) {
  const results = [];
  for (const competitor of product.competitors.filter((c) => c.isActive)) {
    const r = await checkCompetitor(user, product, competitor);
    results.push(r);
    // rate limit
    await new Promise((r) => setTimeout(r, 1500 + Math.floor(Math.random() * 1500)));
  }
  await product.save();
  return results;
}

async function runDailyCheck() {
  const products = await Product.find({ 'competitors.0': { $exists: true } }).lean(false);
  for (const product of products) {
    const user = await User.findById(product.userId);
    if (!user) continue;
    await runProductCheck(product, user);
  }
}

module.exports = { runDailyCheck, runProductCheck };

