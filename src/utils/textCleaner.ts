export const STOP_WORDS = new Set([
  'that', 'with', 'from', 'this', 'have', 'will', 'after', 'over', 'more', 'into',
  'says', 'amid', 'what', 'when', 'where', 'news', 'report', 'update', 'live', 'today',
  'year', 'week', 'month', 'time', 'first', 'new', 'could', 'would', 'should', 'about',
  'their', 'there', 'they', 'been', 'were', 'which', 'while', 'under', 'between', 'before',
  'market', 'markets', 'world', 'global', 'crypto', 'price', 'prices', 'watch', 'breaking',
  'analysis', 'heres', 'why', 'how', 'most', 'some', 'other', 'than', 'then', 'only', 'also'
]);

const NAMED_HTML_ENTITIES: Record<string, string> = {
  nbsp: ' ',
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  rsquo: '’',
  lsquo: '‘',
  rdquo: '”',
  ldquo: '“',
  mdash: '—',
  ndash: '–',
  hellip: '…',
  bull: '•',
  middot: '·',
  euro: '€',
  pound: '£',
  copy: '©',
  reg: '®',
  trade: '™',
};

export function decodeHtmlEntities(input: string): string {
  if (!input) return '';
  return input
    .replace(/&#x([0-9a-f]+);/gi, (match, hex) => {
      const code = parseInt(hex, 16);
      return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : match;
    })
    .replace(/&#(\d+);/g, (match, dec) => {
      const code = parseInt(dec, 10);
      return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : match;
    })
    .replace(/&([a-z]+);/gi, (match, name) => {
      const lower = name.toLowerCase();
      return lower in NAMED_HTML_ENTITIES ? NAMED_HTML_ENTITIES[lower] : match;
    });
}

export function safeParseDate(value: unknown, fallbackMs = Date.now()): Date {
  if (value instanceof Date) {
    return isNaN(value.getTime()) ? new Date(fallbackMs) : value;
  }
  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value);
    if (!isNaN(parsed.getTime())) {
      return parsed;
    }
  }
  return new Date(fallbackMs);
}

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
  return decodeHtmlEntities(rawTitle)
    .replace(/\s*\|\s*NHK WORLD-JAPAN News\s*-\s*NHKニュース$/i, '')
    .replace(/\s+-\s+(Reuters|Associated Press|AP News|PBS|PBS NewsHour|NHK WORLD-JAPAN|NHK World|NHKニュース|BBC News|Al Jazeera|The Guardian|DW|France 24|NPR|UPI\.com|CBC\.ca|ABC News)$/i, '')
    .replace(/^NEWSLETTER:\s*/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function cleanWireSnippet(rawSnippet: string, cleanedTitle: string): string {
  const stripped = (rawSnippet || '').replace(/<[^>]*>/g, ' ');
  const decoded = decodeHtmlEntities(stripped)
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

export function extractReadableBody(rawHtml: string, cleanedTitle: string): { fullText: string; readingMinutes: number } {
  if (!rawHtml) return { fullText: '', readingMinutes: 1 };

  const withoutScripts = rawHtml
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<figure[\s\S]*?<\/figure>/gi, ' ')
    .replace(/<blockquote[^>]*>/gi, '\n\n“')
    .replace(/<\/blockquote>/gi, '”\n\n')
    .replace(/<li[^>]*>/gi, '\n\n• ')
    .replace(/<\/(?:p|div|h[1-6]|li|tr|section|article)>/gi, '\n\n')
    .replace(/<br\s*\/?>/gi, '\n\n')
    .replace(/<[^>]*>/g, ' ');

  const decoded = decodeHtmlEntities(withoutScripts)
    .replace(/[ \t\r]+/g, ' ')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  const normTitle = cleanedTitle.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 35);

  const rawParagraphs = decoded
    .split(/\n{2,}/)
    .map(p => p.replace(/\s+/g, ' ').trim())
    .filter(p => {
      if (p.length < 25) return false;
      if (/^the post .+ appeared first on/i.test(p)) return false;
      if (/^(read more|continue reading|subscribe|sign up for|advertisement)/i.test(p)) return false;
      if (normTitle) {
        const normP = p.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (normP === normTitle || (normP.length < normTitle.length + 12 && normP.startsWith(normTitle))) {
          return false;
        }
      }
      return true;
    });

  // Deduplicate adjacent identical paragraphs
  const deduped: string[] = [];
  for (const p of rawParagraphs) {
    if (deduped[deduped.length - 1] !== p) {
      deduped.push(p);
    }
  }

  let fullText = deduped.join('\n\n').slice(0, 3500).trim();
  if (fullText.length === 3500) {
    const lastPeriod = fullText.lastIndexOf('.');
    if (lastPeriod > 2800) {
      fullText = fullText.slice(0, lastPeriod + 1);
    } else {
      fullText = fullText + '…';
    }
  }

  const wordCount = fullText ? fullText.split(/\s+/).length : 0;
  const readingMinutes = Math.max(1, Math.round(wordCount / 200));
  return { fullText, readingMinutes };
}

export function extractHeadlineKeywords(title: string): string[] {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length >= 4 && !STOP_WORDS.has(w));
}
