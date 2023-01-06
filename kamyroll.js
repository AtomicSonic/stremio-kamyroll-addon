const axios = require('axios');
const cache = require('memory-cache');

const baseUrl = 'https://kitsu.io/api/edge';

async function getKitsuId(imdbId, type, season, ep) {
    // Check if the result is already in the cache
    const cacheKey = `${imdbId}-${type}-${season}-${ep}`;
    const cachedResult = cache.get(cacheKey);
    if (cachedResult) {
        return cachedResult;
    }

    try {
        // Make an HTTP request to the Kitsu API to get the Kitsu ID and episode number for the specified IMDb ID, type, season, and episode
        const { data } = await axios.get(`${baseUrl}/${type}`, {
            params: {
                'filter[externalSite]': 'imdb',
                'filter[externalId]': imdbId
            }
        });

        const item = data.data[0];
        if (item) {
            // If the episode number is provided, return the Kitsu ID and episode number as-is
            if (ep) {
                const result = { kitsuId: item.id, ep };
                cache.put(cacheKey, result, 3600 * 1000); // cache the result for 1 hour
                return result;
            } else {
                // If the episode number is not provided, make an HTTP request to the Kitsu API to get the episode number
                const { data: episodes } = await axios.get(`${baseUrl}/episodes`, {
                    params: {
                        'filter[season]': season,
                        'filter[animeId]': item.id
                    }
                });
