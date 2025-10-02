const nodemailer = require('nodemailer');
const { loadEnv } = require('../config/environment');
const Alert = require('../models/Alert');

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
}

module.exports = new AlertService();
