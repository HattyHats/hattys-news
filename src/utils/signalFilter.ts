import { Article } from '../types';

export interface SignalAnalysis {
  isClickbait: boolean;
  isHardSignal: boolean;
  reason?: string;
}

const SPONSORED_OR_PR_REGEX = /\b(sponsored|press release|paid post|partner content|advertorial)\b|\[(sponsored|pr|ad)\]/i;

const PRICE_PREDICTION_FLUFF_REGEX =
  /\b(price prediction|price predictions|could hit \$|could reach \$|could surge to|could soar to|will it hit \$|can it reach \$|100x|1000x|10,000x|to the moon|millionaire maker|make you a millionaire|ready to explode|set to explode|about to explode)\b/i;

const HYPE_LISTICLE_REGEX =
  /\b(top \d+ cryptos? to buy|best \d+ altcoins?|best \d+ meme coins?|coins? to watch this week|must[- ]buy|you won['’]t believe|shocking truth|secretly buying|analysts? say .* could|experts? predict|here['’]s why .* could|why .* might rally \d{2,}%)\b/i;

const HARD_SIGNAL_REGEX =
  /\b(sec|cftc|doj|treasury|fed|federal reserve|fomc|cpi|inflation|gdp|interest rate|etf inflow|etf outflow|spot etf|blackrock|fidelity|hack|hacked|exploit|exploited|drained|bankruptcy|insolvency|indictment|lawsuit|subpoena|court|verdict|sanctions|ceasefire|treaty|summit|parliament|election|central bank|acquisition|merger|quarterly earnings|tariff|tariffs|nuclear|earthquake)\b/i;

const WIRE_DESK_SOURCES = new Set([
  'reuters',
  'associated press',
  'bbc world',
  'npr politics',
  'pbs newshour',
  'dw news',
  'france 24',
  'al jazeera',
  'un news',
  'nhk world',
  'nasa',
  'the block',
  'blockworks',
  'coindesk',
]);

export function analyzeSignalQuality(article: Pick<Article, 'title' | 'snippet' | 'src'>): SignalAnalysis {
  const title = article.title || '';
  const combined = `${title} ${article.snippet || ''}`;
  const srcLower = (article.src || '').toLowerCase();

  if (SPONSORED_OR_PR_REGEX.test(combined)) {
    return { isClickbait: true, isHardSignal: false, reason: 'Sponsored / PR' };
  }

  const isHardWire = HARD_SIGNAL_REGEX.test(combined) || WIRE_DESK_SOURCES.has(srcLower);

  if (PRICE_PREDICTION_FLUFF_REGEX.test(title) || /[!?]{2,}/.test(title)) {
    return { isClickbait: true, isHardSignal: false, reason: 'Speculative price hype' };
  }

  if (HYPE_LISTICLE_REGEX.test(title) && !HARD_SIGNAL_REGEX.test(title)) {
    return { isClickbait: true, isHardSignal: false, reason: 'Opinion / Clickbait' };
  }

  return {
    isClickbait: false,
    isHardSignal: isHardWire,
  };
}
