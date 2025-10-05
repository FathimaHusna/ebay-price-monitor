const nodemailer = require('nodemailer');
const { loadEnv } = require('../config/environment');
const Alert = require('../models/Alert');
const Product = require('../models/Product');
const User = require('../models/User');

class AlertService {
  constructor() {
    this.env = loadEnv();
    this.transporter = nodemailer.createTransport({
      host: this.env.SMTP_HOST,
      port: this.env.SMTP_PORT || 587,
      secure: false,
      auth: this.env.SMTP_USER
        ? {
            user: this.env.SMTP_USER,
            pass: this.env.SMTP_PASS
          }
        : undefined
    });
  }

  buildEmailTemplate(product, competitor, oldPrice, newPrice, percentChange) {
    const direction = newPrice > oldPrice ? 'increased' : 'decreased';
    return `
      <div>
        <h2>Price ${direction}: ${product.name}</h2>
        <p>${competitor.name || competitor.url}</p>
        <p>Old: $${oldPrice.toFixed(2)} → New: $${newPrice.toFixed(2)} (${percentChange.toFixed(2)}%)</p>
        <p><a href="${competitor.url}">View listing</a></p>
      </div>
    `;
  }

  async sendPriceAlert(user, product, competitor, oldPrice, newPrice, percentChange) {
    if (!user?.alertPreferences?.emailEnabled) return;
    const html = this.buildEmailTemplate(product, competitor, oldPrice, newPrice, percentChange);

    if (this.env.SMTP_HOST) {
      await this.transporter.sendMail({
        from: this.env.FROM_EMAIL,
        to: user.email,
        subject: `Price Alert: ${product.name}`,
        html
      });
    }

    await Alert.create({
      userId: user._id,
      productId: product._id,
      competitorId: competitor._id,
      alertType: newPrice > oldPrice ? 'price_increase' : 'price_drop',
      oldPrice,
      newPrice,
      percentChange,
      sentAt: new Date()
    });
  }

  async sendTest(toEmail) {
    if (!this.env.SMTP_HOST) {
      throw new Error('SMTP not configured');
    }
    try {
      await this.transporter.verify();
    } catch (e) {
      // continue even if verify not supported by server
    }
    await this.transporter.sendMail({
      from: this.env.FROM_EMAIL,
      to: toEmail,
      subject: 'eBay Monitor Test Email',
      html: '<p>This is a test email from eBay Price Monitor.</p>'
    });
    return true;
  }

  async sendDailyDigestForUser(user) {
    if (!user?.alertPreferences || user.alertPreferences.frequency !== 'daily') return false;
    if (!this.env.SMTP_HOST || !user.alertPreferences.emailEnabled) return false;

    const since = user.lastDigestAt || new Date(Date.now() - 24 * 60 * 60 * 1000);
    const alerts = await Alert.find({ userId: user._id, sentAt: { $gt: since } })
      .sort({ sentAt: -1 })
      .lean();
    if (!alerts.length) {
      // still advance digest cursor to avoid resending old ones forever
      user.lastDigestAt = new Date();
      await user.save();
      return false;
    }

    const productIds = [...new Set(alerts.map((a) => String(a.productId)).filter(Boolean))];
    const products = await Product.find({ _id: { $in: productIds } })
      .select({ name: 1 })
      .lean();
    const productMap = new Map(products.map((p) => [String(p._id), p]));

    const items = alerts
      .map((a) => {
        const prod = productMap.get(String(a.productId));
        const label = prod?.name || String(a.productId);
        const dir = a.alertType === 'price_increase' ? '▲' : '▼';
        return `<li><b>${label}</b>: ${dir} $${(a.oldPrice || 0).toFixed(2)} → $${(a.newPrice || 0).toFixed(
          2
        )} (${(a.percentChange || 0).toFixed(2)}%) <small>${new Date(a.sentAt).toLocaleString()}</small></li>`;
      })
      .join('');

    const html = `
      <div>
        <h2>Daily Price Digest</h2>
        <p>${alerts.length} price change(s) since ${since.toLocaleString()}.</p>
        <ul>${items}</ul>
      </div>`;

    await this.transporter.sendMail({
      from: this.env.FROM_EMAIL,
      to: user.email,
      subject: 'Daily Price Digest',
      html
    });

    user.lastDigestAt = new Date();
    await user.save();
    return true;
  }

  async sendDailyDigests() {
    const users = await User.find({ 'alertPreferences.frequency': 'daily' }).lean(false);
    for (const u of users) {
      try {
        await this.sendDailyDigestForUser(u);
      } catch (_) {
        // continue to next user
      }
    }
  }
}

module.exports = new AlertService();
