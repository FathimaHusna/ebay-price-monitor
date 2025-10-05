const cron = require('node-cron');
const ScrapingJob = require('./scrapingJob');
const alertService = require('./alerts');

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

    // Daily digest at 8:15 AM
    cron.schedule('15 8 * * *', async () => {
      try {
        await alertService.sendDailyDigests();
      } catch (err) {
        console.error('Daily digest failed', err);
      }
    });
  }

  async healthCheck() {
    // TODO: Verify browser context, database connection, etc.
    return true;
  }
}

module.exports = new Scheduler();
