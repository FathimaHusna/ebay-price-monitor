const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const { isValidEbayUrl } = require('../middleware/validation');
const scraper = require('../services/scraper');

// All diagnostics require auth to avoid abuse/SSRF
router.use(requireAuth);

// GET /api/diagnostics/scrape?url=...
router.get('/scrape', async (req, res) => {
  try {
    const url = String(req.query.url || '').trim();
    if (!url) return res.status(400).json({ error: 'Missing url' });

    // Allow mock:// for testing; otherwise require eBay domain
    const isMock = /^mock:\/\//i.test(url);
    if (!isMock && !isValidEbayUrl(url)) {
      return res.status(400).json({ error: 'URL must be an eBay listing or mock:// URL' });
    }

    const { price, status, error } = await scraper.scrapePrice(url);
    res.json({ url, status, price, error });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

