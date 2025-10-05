const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const { isValidEbayUrl } = require('../middleware/validation');
const Product = require('../models/Product');
const User = require('../models/User');
const PriceHistory = require('../models/PriceHistory');
const ScrapingJob = require('../services/scrapingJob');
const { suggestReprice } = require('../services/priceAnalysis');

router.use(requireAuth);

// List products for user
router.get('/', async (req, res) => {
  const products = await Product.find({ userId: req.user._id }).lean();
  res.json(products);
});

// Create product
router.post('/', async (req, res) => {
  try {
    const { name, category, myListingUrl, myCurrentPrice, profitMargin } = req.body || {};
    if (!name) return res.status(400).json({ error: 'Name required' });
    const product = await Product.create({
      userId: req.user._id,
      name,
      category,
      myListingUrl,
      myCurrentPrice,
      profitMargin
    });
    res.status(201).json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update product (manual price update workflow)
router.patch('/:id', async (req, res) => {
  try {
    const { name, category, myListingUrl, myCurrentPrice, profitMargin } = req.body || {};
    const product = await Product.findOne({ _id: req.params.id, userId: req.user._id });
    if (!product) return res.status(404).json({ error: 'Product not found' });
    if (name !== undefined) product.name = name;
    if (category !== undefined) product.category = category;
    if (myListingUrl !== undefined) product.myListingUrl = myListingUrl;
    if (myCurrentPrice !== undefined) product.myCurrentPrice = Number(myCurrentPrice);
    if (profitMargin !== undefined) product.profitMargin = Number(profitMargin);
    await product.save();
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add competitor
router.post('/:id/competitors', async (req, res) => {
  try {
    const { url, name } = req.body || {};
    if (!isValidEbayUrl(url) && !/^mock:\/\//.test(url)) return res.status(400).json({ error: 'Invalid URL (must be eBay or mock://)' });
    const product = await Product.findOne({ _id: req.params.id, userId: req.user._id });
    if (!product) return res.status(404).json({ error: 'Product not found' });

    product.competitors.push({ url, name });
    await product.save();
    res.status(201).json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update competitor (url/name)
router.patch('/:id/competitors/:competitorId', async (req, res) => {
  try {
    const { url, name, isActive } = req.body || {};
    const product = await Product.findOne({ _id: req.params.id, userId: req.user._id });
    if (!product) return res.status(404).json({ error: 'Product not found' });
    const comp = product.competitors.id(req.params.competitorId);
    if (!comp) return res.status(404).json({ error: 'Competitor not found' });
    if (url !== undefined) {
      if (!isValidEbayUrl(url) && !/^mock:\/\//.test(url)) {
        return res.status(400).json({ error: 'Invalid URL (must be eBay or mock://)' });
      }
      comp.url = url;
    }
    if (name !== undefined) comp.name = name;
    if (isActive !== undefined) comp.isActive = !!isActive;
    await product.save();
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete competitor
router.delete('/:id/competitors/:competitorId', async (req, res) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, userId: req.user._id });
    if (!product) return res.status(404).json({ error: 'Product not found' });
    const before = product.competitors.length;
    product.competitors = product.competitors.filter((c) => String(c._id) !== req.params.competitorId);
    if (product.competitors.length === before) return res.status(404).json({ error: 'Competitor not found' });
    await product.save();
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Manual "check now" for product
router.post('/:id/check-now', async (req, res) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, userId: req.user._id });
    if (!product) return res.status(404).json({ error: 'Product not found' });
    const user = await User.findById(req.user._id);
    const result = await ScrapingJob.runProductCheck(product, user);
    res.json({ ok: true, result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Manual "check now" for all user's products
router.post('/check-now', async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const products = await Product.find({ userId: req.user._id, 'competitors.0': { $exists: true } }).lean(false);
    let totalCompetitors = 0;
    let alertsLikely = 0;
    const threshold = user?.alertPreferences?.thresholdPercent ?? 5;
    for (const p of products) {
      const results = await ScrapingJob.runProductCheck(p, user);
      totalCompetitors += results.length;
      alertsLikely += results.filter(r => r.oldPrice != null && r.newPrice != null && Math.abs(r.percentChange) >= threshold).length;
    }
    res.json({ ok: true, productsChecked: products.length, competitorsChecked: totalCompetitors, alertsTriggered: alertsLikely });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get simple repricing suggestion
router.get('/:id/suggestion', async (req, res) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, userId: req.user._id }).lean();
    if (!product) return res.status(404).json({ error: 'Product not found' });
    const suggestion = suggestReprice(product, product.competitors || []);
    res.json(suggestion);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get price history (default 30 days)
router.get('/:id/history', async (req, res) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, userId: req.user._id }).lean();
    if (!product) return res.status(404).json({ error: 'Product not found' });
    const days = Math.max(1, Math.min(180, Number(req.query.days || 30)));
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const competitorId = req.query.competitorId;
    const query = { productId: product._id, checkedAt: { $gte: since } };
    if (competitorId) query.competitorId = competitorId;
    const history = await PriceHistory.find(query)
      .sort({ checkedAt: -1 })
      .limit(2000)
      .lean();
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Competitor-specific history
router.get('/:id/competitors/:competitorId/history', async (req, res) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, userId: req.user._id }).lean();
    if (!product) return res.status(404).json({ error: 'Product not found' });
    const days = Math.max(1, Math.min(180, Number(req.query.days || 30)));
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const history = await PriceHistory.find({
      productId: product._id,
      competitorId: req.params.competitorId,
      checkedAt: { $gte: since }
    })
      .sort({ checkedAt: -1 })
      .limit(2000)
      .lean();
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
