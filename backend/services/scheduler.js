const cron = require('node-cron');
const ScrapingJob = require('./scrapingJob');

class Scheduler {
  start() {
    // Daily scraping at 2 AM
    cron.schedule('0 2 * * *', async () => {
      try {
        console.log('Starting daily price check...');
        await ScrapingJob.runDailyCheck();
      } catch (err) {
        console.error('Daily check failed', err);
      }
    });

    // Health check every 6 hours
    cron.schedule('0 */6 * * *', async () => {
      await this.healthCheck();
    });
  }

  async healthCheck() {
    // TODO: Verify browser context, database connection, etc.
    return true;
  }
}

module.exports = new Scheduler();

