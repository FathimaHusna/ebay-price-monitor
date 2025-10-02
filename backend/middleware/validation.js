function isValidEbayUrl(url) {
  try {
    const u = new URL(url);
    return /ebay\./i.test(u.hostname);
  } catch (_) {
    return false;
  }
}

module.exports = { isValidEbayUrl };

