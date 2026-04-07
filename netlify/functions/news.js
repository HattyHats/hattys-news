// netlify/functions/news.js
const fetch = (...args) =>
  import('node-fetch').then(({ default: fetch }) => fetch(...args));

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS'
  };

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const params = event.queryStringParameters || {};
    const country = (params.country || 'us').toLowerCase();
    const category = (params.category || 'general').toLowerCase();

    // For now, we just use Google News + a couple global sources per country.
    // You can expand this later with your FEEDS map.
    const feeds = buildFeeds(country, category);

    const articles = [];
    const seen = new Set();

    for (const feed of feeds) {
      try {
        const url = `https://rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feed.u)}`;
        const res = await fetch(url, { timeout: 10000 });
        if (!res.ok) continue;
        const data = await res.json();
        if (data.status !== 'ok' || !Array.isArray(data.items)) continue;

        for (const item of data.items) {
          const title = (item.title || '').trim();
          const link = item.link || '#';
          if (!title || link === '#') continue;
          const key = title.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 60);
          if (!key || seen.has(key)) continue;
          seen.add(key);

          articles.push({
            title,
            url: link,
            img:
              (item.thumbnail && /^https?:\/\//.test(item.thumbnail)) ? item.thumbnail :
              (item.enclosure && item.enclosure.link && /^https?:\/\//.test(item.enclosure.link)) ? item.enclosure.link :
              '',
            desc: stripHtml(item.description || '').slice(0, 240),
            date: item.pubDate || '',
            src: feed.n,
            cat: feed.c || 'general'
          });
        }
      } catch (e) {
        // ignore broken feed and move on
      }
    }

    // Sort by date newest-first if possible
    articles.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ country, category, count: articles.length, articles })
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message || 'Server error' })
    };
  }
};

function stripHtml(html) {
  return String(html || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function countryName(code) {
  const map = {
    us: 'United States',
    gb: 'United Kingdom',
    ca: 'Canada',
    au: 'Australia',
    nz: 'New Zealand',
    ie: 'Ireland',
    in: 'India',
    sg: 'Singapore',
    ph: 'Philippines',
    pk: 'Pakistan',
    ua: 'Ukraine',
    kr: 'South Korea',
    de: 'Germany',
    fr: 'France',
    jp: 'Japan',
    ae: 'United Arab Emirates',
    za: 'South Africa',
    ng: 'Nigeria',
    ke: 'Kenya',
    il: 'Israel',
    tr: 'Turkey',
    bd: 'Bangladesh',
    th: 'Thailand',
    my: 'Malaysia',
    id: 'Indonesia',
    pl: 'Poland',
    br: 'Brazil',
    it: 'Italy',
    es: 'Spain',
    nl: 'Netherlands',
    se: 'Sweden',
    no: 'Norway',
    sa: 'Saudi Arabia',
    co: 'Colombia',
    cn: 'China',
    ru: 'Russia',
    mx: 'Mexico',
    ar: 'Argentina',
    eg: 'Egypt',
    ir: 'Iran',
    mm: 'Myanmar',
    gh: 'Ghana',
    et: 'Ethiopia'
  };
  return map[code] || code;
}

function buildFeeds(country, category) {
  const name = countryName(country);
  const countryQuery = `${name}`;
  const catQuery = category && category !== 'general'
    ? `${name} ${category}`
    : name;

  const feeds = [
    {
      n: 'Google News – Country',
      u: `https://news.google.com/rss/search?q=${encodeURIComponent(countryQuery)}&hl=en&gl=${country.toUpperCase()}&ceid=${country.toUpperCase()}:en`,
      c: 'general'
    },
    {
      n: 'Google News – Topic',
      u: `https://news.google.com/rss/search?q=${encodeURIComponent(catQuery)}&hl=en&gl=${country.toUpperCase()}&ceid=${country.toUpperCase()}:en`,
      c: category || 'general'
    },
    {
      n: 'Reuters World',
      u: 'https://www.reutersagency.com/feed/?best-topics=world&post_type=best',
      c: 'world'
    },
    {
      n: 'AP Top News',
      u: 'https://apnews.com/hub/ap-top-news?output=xml',
      c: 'general'
    },
    {
      n: 'BBC World',
      u: 'http://feeds.bbci.co.uk/news/world/rss.xml',
      c: 'world'
    },
    {
      n: 'Al Jazeera – All',
      u: 'https://www.aljazeera.com/xml/rss/all.xml',
      c: 'world'
    }
  ];

  // You can add country-specific extras here later if you want.
  return feeds;
}
