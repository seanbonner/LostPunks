// Emits the data bundle as /punks.json for the client to fetch.
export const data = {
  permalink: "/punks.json",
  eleventyExcludeFromCollections: true,
};

export function render(data) {
  const { builtAt, holders, wallets, burnedIds } = data.punks;
  const labels = data.labels || {};
  return JSON.stringify({ builtAt, holders, wallets, burnedIds, labels });
}
