const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const Product = require('../models/Product');
const Alert = require('../models/Alert');
const PriceHistory = require('../models/PriceHistory');

router.use(requireAuth);

router.get('/', async (req, res) => {
  const [products, unreadCount] = await Promise.all([
    Product.find({ userId: req.user._id }).lean(),
    Alert.countDocuments({ userId: req.user._id, isRead: false })
  ]);

  // Build competitorId set to fetch latest history for change indicators
  const competitorIds = [];
  for (const p of products) {
    for (const c of p.competitors || []) competitorIds.push(c._id);
  }

  const changeMap = new Map();
  if (competitorIds.length) {
    const histories = await PriceHistory.find({ competitorId: { $in: competitorIds } })
      .sort({ checkedAt: -1 })
      .lean();
    for (const h of histories) {
      const key = String(h.competitorId);
      if (!changeMap.has(key)) changeMap.set(key, h);
    }
  }

  const data = products.map((p) => ({
    _id: p._id,
    name: p.name,
    category: p.category,
    myCurrentPrice: p.myCurrentPrice,
    competitors: (p.competitors || []).map((c) => {
      const last = changeMap.get(String(c._id));
      const pct = last?.percentChange ?? 0;
      const direction = pct > 0 ? 'up' : pct < 0 ? 'down' : 'none';
      return {
        _id: c._id,
        name: c.name,
        url: c.url,
        currentPrice: c.currentPrice,
        lastChecked: c.lastChecked,
        lastChangePercent: pct,
        direction
      };
    })
  }));

  res.json({ products: data, alertsUnread: unreadCount });
});

module.exports = router;
