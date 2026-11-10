export const STOP_WORDS = new Set([
  'that', 'with', 'from', 'this', 'have', 'will', 'after', 'over', 'more', 'into',
  'says', 'amid', 'what', 'when', 'where', 'news', 'report', 'update', 'live', 'today',
  'year', 'week', 'month', 'time', 'first', 'new', 'could', 'would', 'should', 'about',
  'their', 'there', 'they', 'been', 'were', 'which', 'while', 'under', 'between', 'before',
  'market', 'markets', 'world', 'global', 'crypto', 'price', 'prices', 'watch', 'breaking',
  'analysis', 'heres', 'why', 'how', 'most', 'some', 'other', 'than', 'then', 'only', 'also'
]);

export function getPublisherRoot(src: string): string {
  const s = (src || '').toLowerCase();
  if (s.startsWith('cointelegraph')) return 'cointelegraph';
  if (s.startsWith('coindesk')) return 'coindesk';
  if (s.startsWith('decrypt')) return 'decrypt';
  if (s.startsWith('the block') || s.startsWith('theblock')) return 'theblock';
  if (s.startsWith('bbc')) return 'bbc';
  if (s.startsWith('npr')) return 'npr';
  if (s.startsWith('upi')) return 'upi';
  if (s.startsWith('cna')) return 'cna';
  if (s.startsWith('reuters')) return 'reuters';
  if (s.includes('associated press') || s.startsWith('ap ')) return 'ap';
  return s;
}

export function cleanWireTitle(rawTitle: string): string {
  return rawTitle
    .replace(/\s+-\s+(Reuters|Associated Press|AP News|PBS|PBS NewsHour|NHK WORLD-JAPAN|NHK World|BBC News|Al Jazeera|The Guardian|DW|France 24|NPR|UPI\.com|CBC\.ca|ABC News)$/i, '')
    .replace(/^NEWSLETTER:\s*/i, '')
    .trim();
}

export function cleanWireSnippet(rawSnippet: string, cleanedTitle: string): string {
  const decoded = rawSnippet
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();

  if (!decoded) return '';
  const normSnippet = decoded.toLowerCase().replace(/[^a-z0-9]/g, '');
  const normTitle = cleanedTitle.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (normTitle && normSnippet.startsWith(normTitle.slice(0, Math.min(35, normTitle.length)))) {
    return '';
  }
  return decoded.slice(0, 150).trim();
}

export function extractHeadlineKeywords(title: string): string[] {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length >= 4 && !STOP_WORDS.has(w));
}
