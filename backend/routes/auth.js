const router = require('express').Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { signToken } = require('../middleware/auth');
const { requireAuth } = require('../middleware/auth');

router.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ error: 'Email already in use' });
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ email, passwordHash });
    const token = signToken(user);
    res.json({ token, user: { _id: user._id, email: user.email } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
    user.lastLogin = new Date();
    await user.save();
    const token = signToken(user);
    res.json({ token, user: { _id: user._id, email: user.email, alertPreferences: user.alertPreferences } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/me', async (req, res) => {
  // For simplicity this route is public; frontend should pass token to access profile endpoints elsewhere
  res.json({ ok: true });
});

// Get/update alert preferences
router.get('/preferences', requireAuth, async (req, res) => {
  const user = await User.findById(req.user._id).lean();
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user.alertPreferences || {});
});

router.put('/preferences', requireAuth, async (req, res) => {
  const { thresholdPercent, frequency, emailEnabled } = req.body || {};
  const user = await User.findById(req.user._id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  if (thresholdPercent != null) user.alertPreferences.thresholdPercent = Number(thresholdPercent);
  if (frequency != null) user.alertPreferences.frequency = frequency;
  if (emailEnabled != null) user.alertPreferences.emailEnabled = !!emailEnabled;
  await user.save();
  res.json(user.alertPreferences);
});

module.exports = router;
