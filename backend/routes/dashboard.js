const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const Product = require('../models/Product');
const Alert = require('../models/Alert');

router.use(requireAuth);

router.get('/', async (req, res) => {
  const [products, unreadCount] = await Promise.all([
    Product.find({ userId: req.user._id }).lean(),
    Alert.countDocuments({ userId: req.user._id, isRead: false })
  ]);

  const data = products.map((p) => ({
    _id: p._id,
    name: p.name,
    category: p.category,
    myCurrentPrice: p.myCurrentPrice,
    competitors: (p.competitors || []).map((c) => ({
      _id: c._id,
      name: c.name,
      url: c.url,
      currentPrice: c.currentPrice,
      lastChecked: c.lastChecked
    }))
  }));

  res.json({ products: data, alertsUnread: unreadCount });
});

module.exports = router;

