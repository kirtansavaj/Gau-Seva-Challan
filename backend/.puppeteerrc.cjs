const { join } = require('path');

/**
 * @type {import("puppeteer").Configuration}
 */
module.exports = {
  // Store Puppeteer's Chrome binary inside the project directory so Render keeps it in deployment
  cacheDirectory: join(__dirname, '.cache', 'puppeteer'),
};
