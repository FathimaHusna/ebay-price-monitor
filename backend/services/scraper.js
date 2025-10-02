const path = require('path');
const logger = require('../utils/logger');

class EbayScraper {
  constructor() {
    this.browser = null;
    this.context = null;
  }

  async initialize() {
    if (this.context) return;
    try {
      const { chromium } = require('playwright');
      this.context = await chromium.launchPersistentContext(path.resolve(__dirname, '../../browser-data'), {
        headless: true,
        userAgent:
          'Mozilla/5.0 (X11; Linux aarch64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
        viewport: { width: 1280, height: 720 }
      });
      logger.info('Playwright context initialized');
    } catch (err) {
      logger.warn(`Playwright not available or failed to init: ${err.message}`);
    }
  }

  async dispose() {
    try {
      if (this.context) await this.context.close();
      this.context = null;
    } catch (_) {}
  }

  async scrapePrice(url) {
    // Mock protocol for offline/dev testing: mock://listing?price=123.45
    try {
      const u = new URL(url);
      if (u.protocol === 'mock:') {
        const priceParam = u.searchParams.get('price');
        const price = priceParam ? parseFloat(priceParam) : null;
        return { price: isNaN(price) ? null : price, status: price != null ? 'success' : 'failed' };
      }
    } catch (_) {
      // ignore URL parse errors; continue to real scrape
    }

    if (!this.context) {
      await this.initialize();
      if (!this.context) return { price: null, status: 'failed' };
    }
    const page = await this.context.newPage();
    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 45000 });
      await page.waitForTimeout(2000 + Math.floor(Math.random() * 1500));
      const price = await page.evaluate(() => {
        const selectors = [
          '.mainPrice .amount',
          '.u-flL.condText .amount',
          '.current-price .amount',
          '#mm-saleDscPrc',
          '#prcIsum',
          '.x-price-primary .ux-textspans'
        ];
        const getNum = (t) => {
          if (!t) return null;
          const n = parseFloat(String(t).replace(/[^0-9.]/g, ''));
          return isNaN(n) ? null : n;
        };
        for (const sel of selectors) {
          const el = document.querySelector(sel);
          if (el) {
            const val = el.textContent || el.getAttribute('content') || '';
            const num = getNum(val);
            if (num != null) return num;
          }
        }
        return null;
      });
      return { price: price ?? null, status: price != null ? 'success' : 'failed' };
    } catch (err) {
      return { price: null, status: 'failed', error: err.message };
    } finally {
      await page.close();
    }
  }
}

module.exports = new EbayScraper();
