function suggestReprice(product, competitors) {
  if (!competitors?.length) return { strategy: 'no_action', suggestionPrice: product.myCurrentPrice };
  const active = competitors.filter((c) => c.currentPrice != null);
  if (!active.length) return { strategy: 'no_action', suggestionPrice: product.myCurrentPrice };
  const lowest = active.reduce((min, c) => (min.currentPrice < c.currentPrice ? min : c));
  const suggestion = lowest.currentPrice; // simple: match lowest competitor
  const minAllowed = product.myCurrentPrice != null && product.profitMargin != null
    ? Math.max(0, product.myCurrentPrice - product.profitMargin)
    : undefined;
  const safeSuggestion = minAllowed != null ? Math.max(minAllowed, suggestion) : suggestion;
  return { strategy: 'match_lowest', suggestionPrice: safeSuggestion, lowestCompetitorId: lowest._id };
}

module.exports = { suggestReprice };

