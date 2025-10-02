const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const Alert = require('../models/Alert');
const alertService = require('../services/alerts');

router.use(requireAuth);

router.get('/', async (req, res) => {
  const alerts = await Alert.find({ userId: req.user._id }).sort({ sentAt: -1 }).limit(200).lean();
  res.json(alerts);
});

router.post('/:id/read', async (req, res) => {
  const updated = await Alert.findOneAndUpdate({ _id: req.params.id, userId: req.user._id }, { isRead: true }, { new: true });
  if (!updated) return res.status(404).json({ error: 'Alert not found' });
  res.json(updated);
});

// Send test email to the authenticated user's address
router.post('/test', async (req, res) => {
  try {
    await alertService.sendTest(req.user.email);
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
