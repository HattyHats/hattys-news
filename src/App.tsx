/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Radio, ShieldAlert, BellRing, Zap, Calendar, Clock, Gauge } from 'lucide-react';

import { AppMode, Article, FearGreedData, FeedConfig } from './types';
import { CRYPTO_FEEDS, WORLD_FEEDS, CRYPTO_CATEGORIES, WORLD_CATEGORIES, DEFAULT_DASHBOARD_SETTINGS } from './config/feeds';
import { ASSET_DEFINITIONS } from './config/assets';
import { getEditorialPhoto } from './config/photos';
import { cleanWireTitle, cleanWireSnippet, getPublisherRoot } from './utils/textCleaner';
import { classifyArticle } from './utils/classifier';
import { computeArticleClusters } from './utils/clustering';
import { loadCachedArticlesForMode, saveArticlesCache } from './utils/storage';
import { getUpcomingCatalysts, formatExactCountdown } from './utils/formatters';

// Modular Components
import { Header } from './components/layout/Header';
import { MorningBrief } from './components/layout/MorningBrief';
import { FilterTabs } from './components/layout/FilterTabs';
import { ArticleCard } from './components/cards/ArticleCard';
import { AffizyAdUnit } from './components/ads/AffizyAdUnit';
import { BackToTop } from './components/common/BackToTop';
import { LiveTicker } from './components/tickers/LiveTicker';
import { StockTickerTape } from './components/tickers/StockTickerTape';
import { CommoditiesTicker } from './components/tickers/CommoditiesTicker';
import { DoomsdayModal } from './components/modals/DoomsdayModal';
import { CatalystCalendarModal } from './components/modals/CatalystCalendarModal';
import { NotificationModal } from './components/modals/NotificationModal';
import { DashboardSettingsModal } from './components/modals/DashboardSettingsModal';
import { FearGreedModal } from './components/modals/FearGreedModal';
import { PwaInstallModal } from './components/modals/PwaInstallModal';
import { PerspectiveModal } from './components/modals/PerspectiveModal';

export default function App() {
  const [mode, setMode] = useState<AppMode>('crypto');
  const initialCached = useMemo(() => loadCachedArticlesForMode('crypto'), []);
  const [articles, setArticles] = useState<Article[]>(initialCached);
  const articlesRef = useRef(articles);
  articlesRef.current = articles;
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState<boolean>(initialCached.length === 0);
  const [isDark, setIsDark] = useState(true);

  // Modals & Navigation
  const [fearGreed, setFearGreed] = useState<FearGreedData | null>(null);
  const [showFearGreed, setShowFearGreed] = useState(false);
  const [showDoomsday, setShowDoomsday] = useState(false);
  const [showCatalysts, setShowCatalysts] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showDashboardModal, setShowDashboardModal] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [refreshToast, setRefreshToast] = useState<{ message: string; active: boolean } | null>(null);
  const fetchSeqRef = useRef(0);

  // Perspective Comparator Modal State (New Feature)
  const [perspectiveModalOpen, setPerspectiveModalOpen] = useState(false);
  const [perspectivePrimary, setPerspectivePrimary] = useState<Article | null>(null);
  const [perspectiveRelated, setPerspectiveRelated] = useState<Article[]>([]);

  // Notifications State
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hattys_notifications_enabled') === '1' && typeof Notification !== 'undefined' && Notification.permission === 'granted';
    } catch {
      return false;
    }
  });
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | 'unsupported'>(() => {
    return typeof Notification !== 'undefined' ? Notification.permission : 'unsupported';
  });
  const [notificationSuccessToast, setNotificationSuccessToast] = useState<string | null>(null);

  // Responsive Device Breakpoint for Display Ads (>= 1024px is desktop)
  const [isDesktop, setIsDesktop] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1024;
    }
    return true;
  });

  useEffect(() => {
    const handleResize = () => {
      const desktop = window.innerWidth >= 1024;
      setIsDesktop(prev => (prev !== desktop ? desktop : prev));
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 60-Second Morning Brief state (persisted)
  const [showBrief, setShowBrief] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hattys_brief_collapsed') !== '1';
    } catch {
      return true;
    }
  });

  const toggleBrief = () => {
    setShowBrief(prev => {
      const next = !prev;
      try {
        localStorage.setItem('hattys_brief_collapsed', next ? '0' : '1');
      } catch {}
      return next;
    });
  };

  // Saved / Read-Later Queue (persisted in localStorage)
  const [savedArticles, setSavedArticles] = useState<Article[]>(() => {
    try {
      const raw = localStorage.getItem('hattys_saved_articles_v1');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return parsed.map((a: any) => ({ ...a, date: new Date(a.date) }));
        }
      }
    } catch {}
    return [];
  });

  const savedIds = useMemo(() => new Set(savedArticles.map(a => a.id)), [savedArticles]);

  const toggleSaveArticle = useCallback((article: Article) => {
    setSavedArticles(prev => {
      const exists = prev.some(item => item.id === article.id);
      const updated = exists ? prev.filter(item => item.id !== article.id) : [article, ...prev];
      try {
        localStorage.setItem('hattys_saved_articles_v1', JSON.stringify(updated.slice(0, 100)));
      } catch {}
      return updated;
    });
  }, []);

  // Track Last Visit Timestamp per Mode for "NEW" Story Badges
  const [lastVisitTime, setLastVisitTime] = useState<number>(() => Date.now() - 3 * 3600 * 1000);

  useEffect(() => {
    try {
      const visitKey = `hattys_last_visit_${mode}`;
      const prev = localStorage.getItem(visitKey);
      const now = Date.now();
      if (prev) {
        const parsed = parseInt(prev, 10);
        const threshold = now - parsed < 5 * 60 * 1000 ? now - 2 * 3600 * 1000 : parsed;
        setLastVisitTime(threshold);
      } else {
        setLastVisitTime(now - 3 * 3600 * 1000);
      }
      localStorage.setItem(visitKey, String(now));
    } catch {}
  }, [mode]);

  // PWA Standalone App State
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const standalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
      if (standalone && typeof document !== 'undefined') {
        document.body.classList.add('pwa-installed');
      }
      return standalone;
    }
    return false;
  });
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const userAgent = window.navigator.userAgent.toLowerCase();
      setIsIOS(/iphone|ipad|ipod/.test(userAgent));

      const handleBeforeInstallPrompt = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e);
      };

      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    }
  }, []);

  // Personalized Dashboard & Feed Settings State
  const [dashboardSettings, setDashboardSettings] = useState(DEFAULT_DASHBOARD_SETTINGS);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('hattys_dashboard_settings');
      if (raw) {
        const parsed = JSON.parse(raw);
        setDashboardSettings({
          ...DEFAULT_DASHBOARD_SETTINGS,
          ...parsed,
          cryptoCategories: Array.isArray(parsed.cryptoCategories) ? parsed.cryptoCategories : DEFAULT_DASHBOARD_SETTINGS.cryptoCategories,
          cryptoHidden: Array.isArray(parsed.cryptoHidden) ? parsed.cryptoHidden : [],
          worldCategories: Array.isArray(parsed.worldCategories) ? parsed.worldCategories : DEFAULT_DASHBOARD_SETTINGS.worldCategories,
          worldHidden: Array.isArray(parsed.worldHidden) ? parsed.worldHidden : [],
        });
      }
    } catch {}
  }, []);

  const updateDashboardSettings = useCallback((newSettings: typeof DEFAULT_DASHBOARD_SETTINGS) => {
    setDashboardSettings(newSettings);
    try {
      localStorage.setItem('hattys_dashboard_settings', JSON.stringify(newSettings));
    } catch {}
  }, []);

  // Unified Real-Time Market Quotes (Single Central Source of Truth)
  const [marketQuotes, setMarketQuotes] = useState<Record<string, { price: number; change24h: number; formatted: string }>>({
    BTC: { price: 91420.50, change24h: 2.15, formatted: '$91,420.50' },
    ETH: { price: 3340.20, change24h: 1.84, formatted: '$3,340.20' },
    SOL: { price: 102.26, change24h: 0.09, formatted: '$102.26' },
    XRP: { price: 1.3020, change24h: 1.01, formatted: '$1.3020' },
    DOGE: { price: 0.0778, change24h: -0.87, formatted: '$0.0778' },
    BNB: { price: 684.20, change24h: -1.58, formatted: '$684.20' },
    ADA: { price: 0.4210, change24h: 0.85, formatted: '$0.4210' },
    AVAX: { price: 24.80, change24h: 1.42, formatted: '$24.80' },
    LINK: { price: 14.65, change24h: 2.10, formatted: '$14.65' },
    SUI: { price: 2.18, change24h: 3.40, formatted: '$2.18' },
    OIL_CRUDE: { price: 103.27, change24h: 3.82, formatted: '$103.27' },
    OIL_BRENT: { price: 111.70, change24h: 2.80, formatted: '$111.70' },
    GOLD: { price: 4007.90, change24h: -1.29, formatted: '$4,007.90' },
    SILVER: { price: 53.95, change24h: -1.92, formatted: '$53.95' },
    NAT_GAS: { price: 3.05, change24h: -3.36, formatted: '$3.05' },
    COPPER: { price: 6.51, change24h: 1.72, formatted: '$6.51' },
    URANIUM: { price: 82.50, change24h: 1.23, formatted: '$82.50' },
    NVDA: { price: 210.96, change24h: -0.59, formatted: '$210.96' },
    AAPL: { price: 347.73, change24h: -0.14, formatted: '$347.73' },
    MSFT: { price: 468.50, change24h: 0.74, formatted: '$468.50' },
    AMZN: { price: 229.40, change24h: 1.12, formatted: '$229.40' },
    GOOGL: { price: 198.60, change24h: 0.53, formatted: '$198.60' },
    TSLA: { price: 372.22, change24h: -0.63, formatted: '$372.22' },
    META: { price: 618.30, change24h: 0.91, formatted: '$618.30' },
    SPY: { price: 759.97, change24h: -0.52, formatted: '$759.97' },
    QQQ: { price: 704.40, change24h: -0.01, formatted: '$704.40' },
    DIA: { price: 521.37, change24h: -1.24, formatted: '$521.37' },
  });

  const handlePriceTick = useCallback((sym: string, price: number, change: number, formatted: string) => {
    setMarketQuotes(prev => {
      const cur = prev[sym];
      if (cur && cur.price === price && cur.change24h === change) return prev;
      return {
        ...prev,
        [sym]: { price, change24h: change, formatted }
      };
    });
  }, []);

  // Single centralized market quote sync from /api/market
  useEffect(() => {
    let isMounted = true;
    const syncQuotes = async (force = false) => {
      try {
        const bust = force ? `?_t=${Date.now()}&nocache=1` : '';
        const res = await fetch(`/api/market${bust}`, {
          cache: force ? 'no-store' : 'default'
        });
        if (!res.ok) return;
        const data = await res.json();
        if (!data || !isMounted) return;

        setMarketQuotes(prev => {
          const next = { ...prev };
          if (data.crypto) {
            for (const [k, v] of Object.entries(data.crypto as Record<string, any>)) {
              if (v?.price) next[k] = { price: v.price, change24h: v.change24h ?? 0, formatted: v.formatted };
            }
          }
          if (data.commodities) {
            for (const [k, v] of Object.entries(data.commodities as Record<string, any>)) {
              if (v?.price) next[k] = { price: v.price, change24h: v.change24h ?? 0, formatted: v.formatted };
            }
          }
          if (data.stocks) {
            for (const [k, v] of Object.entries(data.stocks as Record<string, any>)) {
              if (v?.price) next[k] = { price: v.price, change24h: v.change24h ?? 0, formatted: v.formatted };
            }
          }
          return next;
        });
      } catch {}
    };

    syncQuotes();
    const interval = setInterval(() => syncQuotes(false), 30000);
    const handleRefresh = () => syncQuotes(true);
    window.addEventListener('refresh-market-data', handleRefresh);

    return () => {
      isMounted = false;
      clearInterval(interval);
      window.removeEventListener('refresh-market-data', handleRefresh);
    };
  }, []);

  // Monitor scroll for Back-to-Top Floating Button
  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 350);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch individual feed with fast 5s timeout
  const fetchFeed = async (feed: FeedConfig, targetMode: AppMode, forceRefresh = false): Promise<Article[]> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    try {
      const cacheBust = forceRefresh ? `&_t=${Date.now()}&nocache=1` : '';
      const response = await fetch(`/api/news?url=${encodeURIComponent(feed.u)}${cacheBust}`, {
        signal: controller.signal,
        cache: forceRefresh ? 'no-store' : 'default'
      });
      clearTimeout(timeoutId);

      if (!response.ok) return [];
      const data = await response.json();
      if (!data.items || !Array.isArray(data.items)) return [];

      return data.items.map((i: any, idx: number) => {
        let img = '';
        if (i.enclosure?.url) {
          img = i.enclosure.url;
        } else if (i['media:content']) {
          const media = i['media:content'];
          img = Array.isArray(media) ? (media[0]?.$?.url || media[0]?.url) : (media?.$?.url || media?.url);
        } else if (i['media:thumbnail']) {
          img = i['media:thumbnail']?.$?.url || i['media:thumbnail']?.url;
        } else {
          const content = i.contentEncoded || i.content || i.description || '';
          const match = content.match(/<img[^>]+src=["']([^"']+)["']/i);
          if (match && match[1]) {
            const candidate = match[1].trim();
            if (!candidate.includes('feedburner') && !candidate.includes('pixel') && !candidate.includes('spacer') && !candidate.endsWith('.gif')) {
              img = candidate;
            }
          }
        }

        if (img && img.startsWith('http://')) {
          img = img.replace(/^http:\/\//i, 'https://');
        }

        const rawTitle = i.title ? i.title.trim() : (targetMode === 'world' ? 'World Wire Update' : 'Crypto Market Update');
        const title = cleanWireTitle(rawTitle);
        const snippet = cleanWireSnippet(i.contentSnippet || i.description || '', title);
        const { primary, matched } = classifyArticle(title, snippet, feed.defaultCat, targetMode);

        if (!img) {
          img = getEditorialPhoto(primary, title, targetMode);
        }

        const normId = title.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 36) || String(idx);

        return {
          id: `${targetMode}-${feed.n}-${normId}`,
          title,
          link: i.link || '#',
          img,
          date: new Date(i.pubDate || i.isoDate || Date.now()),
          src: feed.n,
          primaryCat: primary,
          matchedCategories: matched,
          snippet,
          mode: targetMode
        };
      });
    } catch {
      return [];
    }
  };

  // Progressive Early-Flush Feed Aggregator (Ultra-Fast 300ms First Paint)
  const loadNews = useCallback(async (force = false) => {
    const reqId = ++fetchSeqRef.current;
    const targetMode = mode;
    if (articlesRef.current.length === 0) setLoading(true);
    const activeFeeds = targetMode === 'world' ? WORLD_FEEDS : CRYPTO_FEEDS;
    
    try {
      const accumulated: Article[] = [];
      const seen = new Set<string>();
      let hasFlushedEarly = false;

      const feedPromises = activeFeeds.map(async (f) => {
        try {
          const feedArticles = await fetchFeed(f, targetMode, force);
          if (reqId !== fetchSeqRef.current) return;

          for (const a of feedArticles) {
            const normKey = a.title.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 45);
            if (!seen.has(normKey)) {
              seen.add(normKey);
              accumulated.push(a);
            }
          }

          // Progressive Early Flush: As soon as the fastest feeds return 16+ dispatches, display immediately!
          if (!hasFlushedEarly && accumulated.length >= 16) {
            hasFlushedEarly = true;
            const earlySorted = [...accumulated].sort((a, b) => b.date.getTime() - a.date.getTime());
            setArticles(earlySorted);
            setLoading(false); // Skeletons clear in ~300ms!
          }
        } catch {}
      });

      await Promise.allSettled(feedPromises);
      if (reqId !== fetchSeqRef.current) return;

      if (accumulated.length > 0) {
        accumulated.sort((a, b) => b.date.getTime() - a.date.getTime());
        setArticles(accumulated);
        saveArticlesCache(targetMode, accumulated);
      }
    } catch (err) {
      console.error('Failed to aggregate feeds', err);
    } finally {
      if (reqId === fetchSeqRef.current) {
        setLoading(false);
      }
    }
  }, [mode]);

  const fetchFearGreed = async () => {
    try {
      const res = await fetch(`https://api.alternative.me/fng/?limit=2&t=${Date.now()}`);
      const data = await res.json();
      if (data.data && data.data.length > 0) {
        const current = data.data[0];
        if (data.data[1]) {
          current.previous_value = data.data[1].value;
        }
        setFearGreed(current);
      }
    } catch (e) {
      console.error('Failed to fetch Fear & Greed Index', e);
    }
  };

  const handleManualRefresh = async () => {
    if (loading) return;

    // Smoothly scroll back to the beginning of the page
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    if (document.documentElement) document.documentElement.scrollTop = 0;
    if (document.body) document.body.scrollTop = 0;

    // Reset pagination limit so user sees top stories immediately
    setDisplayLimit(24);
    if (filter === 'saved') {
      setFilter('all');
    }

    setRefreshToast({ message: `Fetching latest ${mode === 'world' ? 'world wire' : 'crypto'} dispatches...`, active: true });
    try {
      if (mode === 'world') {
        window.dispatchEvent(new CustomEvent('refresh-market-data'));
      } else {
        fetchFearGreed();
      }
      await loadNews(true);
      setRefreshToast({ message: `Feed updated with latest ${mode === 'world' ? 'global' : 'crypto'} dispatches`, active: false });
      setTimeout(() => {
        setRefreshToast(null);
      }, 2500);
    } catch {
      setRefreshToast({ message: 'Sync failed. Re-trying...', active: false });
      setTimeout(() => setRefreshToast(null), 2500);
    }
  };

  // Native Notification triggers
  const triggerNativeNotification = useCallback(async (title: string, body: string, url: string, tag: string) => {
    try {
      if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.ready;
        if (reg && reg.showNotification) {
          await reg.showNotification(title, {
            body,
            icon: '/favicon.svg',
            badge: '/favicon-32x32.png',
            tag: tag || 'hattys-breaking-alert',
            data: { url: url || '/' },
            vibrate: [200, 100, 200]
          } as any);
          return true;
        }
      }
      if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        const notif = new Notification(title, {
          body,
          icon: '/favicon.svg',
          tag: tag || 'hattys-breaking-alert',
          data: { url: url || '/' }
        });
        notif.onclick = () => {
          window.focus();
          if (url && url !== '#') window.open(url, '_blank');
        };
        return true;
      }
    } catch (e) {
      console.error('Notification dispatch failed', e);
    }
    return false;
  }, []);

  const requestNotificationPermission = async () => {
    if (typeof Notification === 'undefined') {
      alert('Web Notifications are not supported in this browser.');
      return;
    }

    try {
      const perm = await Notification.requestPermission();
      setNotificationPermission(perm);
      if (perm === 'granted') {
        setNotificationsEnabled(true);
        localStorage.setItem('hattys_notifications_enabled', '1');
        setNotificationSuccessToast('🔔 Breaking news alerts activated! You will receive notifications for major stories.');
        triggerNativeNotification(
          "🚨 HATTY'S NEWS // ALERTS ACTIVE",
          "You will now receive instant notifications when top breaking news dispatches drop.",
          window.location.href,
          'hattys-activated'
        );
        setTimeout(() => setNotificationSuccessToast(null), 4000);
      } else if (perm === 'denied') {
        setNotificationsEnabled(false);
        localStorage.setItem('hattys_notifications_enabled', '0');
      }
    } catch (e) {
      console.error('Permission request failed', e);
    }
  };

  const toggleNotifications = async () => {
    if (!notificationsEnabled) {
      await requestNotificationPermission();
    } else {
      setNotificationsEnabled(false);
      localStorage.setItem('hattys_notifications_enabled', '0');
      setNotificationSuccessToast('🔕 Breaking news alerts turned off.');
      setTimeout(() => setNotificationSuccessToast(null), 3000);
    }
  };

  const handleTestNotification = async () => {
    if (notificationPermission !== 'granted') {
      await requestNotificationPermission();
      return;
    }
    const sample = articles[0];
    const testTitle = sample ? `🚨 BREAKING [${sample.src}]` : "🚨 HATTY'S NEWS // TEST ALERT";
    const testBody = sample ? sample.title : "This is a test breaking notification from Hatty's News Terminal.";
    const testUrl = sample ? sample.link : window.location.href;

    await triggerNativeNotification(testTitle, testBody, testUrl, 'test-alert-' + Date.now());
    setNotificationSuccessToast('Test alert dispatched to your device!');
    setTimeout(() => setNotificationSuccessToast(null), 3000);
  };

  // Monitor breaking articles for notifications
  useEffect(() => {
    if (!notificationsEnabled || articles.length === 0) return;
    try {
      const topStory = articles[0];
      if (!topStory) return;
      const lastNotified = localStorage.getItem('hattys_last_notified_story_id');
      if (!lastNotified) {
        localStorage.setItem('hattys_last_notified_story_id', topStory.id);
        return;
      }
      if (lastNotified !== topStory.id && (Date.now() - topStory.date.getTime() < 4 * 3600 * 1000)) {
        localStorage.setItem('hattys_last_notified_story_id', topStory.id);
        triggerNativeNotification(
          `🚨 BREAKING [${topStory.src}]: ${topStory.primaryCat.toUpperCase()}`,
          topStory.title,
          topStory.link,
          `breaking-${topStory.id}`
        );
      }
    } catch {}
  }, [articles, notificationsEnabled, triggerNativeNotification]);

  // Periodic background check for alerts
  useEffect(() => {
    if (!notificationsEnabled) return;
    const interval = setInterval(() => {
      loadNews(true);
    }, 90000);
    return () => clearInterval(interval);
  }, [notificationsEnabled, loadNews]);

  // Mode Switch & Refresh Effect
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    if (document.documentElement) document.documentElement.scrollTop = 0;
    if (document.body) document.body.scrollTop = 0;

    const restored = loadCachedArticlesForMode(mode);
    if (restored.length > 0) {
      setArticles(restored);
      setLoading(false);
    }
    loadNews(true);

    if (mode === 'crypto') {
      fetchFearGreed();
    } else {
      window.dispatchEvent(new CustomEvent('refresh-market-data'));
    }
  }, [mode, loadNews]);

  // Theme Sync
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#030303');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#f8fafc');
    }
  }, [isDark]);

  // Mode Switch Handler
  const handleModeSwitch = (newMode: AppMode) => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    if (document.documentElement) document.documentElement.scrollTop = 0;
    if (document.body) document.body.scrollTop = 0;

    if (newMode === mode) {
      handleManualRefresh();
      return;
    }

    // Instantly load cached articles for the target mode, preventing cross-mode bleed
    const restored = loadCachedArticlesForMode(newMode);
    setArticles(restored);
    setLoading(restored.length === 0);
    setMode(newMode);
    setFilter('all');
    setQuery('');
    setDisplayLimit(24);

    requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    });
  };

  // Active categories list
  const activeCategories = useMemo(() => {
    const base = mode === 'world' ? WORLD_CATEGORIES : CRYPTO_CATEGORIES;
    const order = mode === 'world' ? dashboardSettings.worldCategories : dashboardSettings.cryptoCategories;
    const hidden = new Set(mode === 'world' ? dashboardSettings.worldHidden : dashboardSettings.cryptoHidden);

    const sorted = [...base].sort((a, b) => {
      if (a.id === 'all') return -1;
      if (b.id === 'all') return 1;
      const idxA = order.indexOf(a.id);
      const idxB = order.indexOf(b.id);
      if (idxA === -1 && idxB === -1) return 0;
      if (idxA === -1) return 1;
      if (idxB === -1) return -1;
      return idxA - idxB;
    });

    return sorted.filter(c => c.id === 'all' || !hidden.has(c.id));
  }, [mode, dashboardSettings]);

  useEffect(() => {
    const hidden = new Set(mode === 'world' ? dashboardSettings.worldHidden : dashboardSettings.cryptoHidden);
    if (filter !== 'all' && filter !== 'saved' && filter !== 'new' && hidden.has(filter)) {
      setFilter('all');
    }
  }, [mode, dashboardSettings, filter]);

  // Strict topic-isolated articles for current mode (guarantees Crypto only in crypto, World only in world)
  const currentModeArticles = useMemo(() => {
    return articles.filter(a => !a.mode || a.mode === mode);
  }, [articles, mode]);

  // Multi-Source Story Clustering Map (scoped strictly to current mode)
  const articleClusters = useMemo(() => computeArticleClusters(currentModeArticles), [currentModeArticles]);

  // Count of new stories since last visit (scoped to current mode)
  const newArticlesCount = useMemo(() => {
    return currentModeArticles.filter(a => a.date.getTime() > lastVisitTime).length;
  }, [currentModeArticles, lastVisitTime]);

  // Feature 5: Nearest Macro Catalyst live countdown
  const nearestCatalyst = useMemo(() => {
    const list = getUpcomingCatalysts();
    return list[0] || null;
  }, []);

  const [currentTimeMs, setCurrentTimeMs] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTimeMs(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const nearestCountdown = useMemo(() => {
    if (!nearestCatalyst) return null;
    return formatExactCountdown(nearestCatalyst.date, currentTimeMs);
  }, [nearestCatalyst, currentTimeMs]);

  // Feature 3: Live Breaking News Speedometer (Wire Velocity Index)
  const wireVelocity = useMemo(() => {
    const oneHourAgo = currentTimeMs - 3600 * 1000;
    const countRecent = currentModeArticles.filter(a => a.date.getTime() >= oneHourAgo).length;

    let count = countRecent;
    if (count === 0 && currentModeArticles.length >= 5) {
      const sample = currentModeArticles.slice(0, 10);
      const newestTime = sample[0]?.date.getTime() || currentTimeMs;
      const oldestTime = sample[sample.length - 1]?.date.getTime() || (currentTimeMs - 3600 * 1000);
      const spanHours = Math.max(0.5, (newestTime - oldestTime) / (3600 * 1000));
      count = Math.max(4, Math.round(sample.length / spanHours));
    } else if (count === 0) {
      count = 6;
    }

    let status: 'SURGE' | 'HIGH' | 'STEADY' = 'STEADY';
    if (count >= 18) status = 'SURGE';
    else if (count >= 8) status = 'HIGH';

    return { count, status };
  }, [currentModeArticles, currentTimeMs]);

  // 60-Second Morning Brief Stories (scoped to current mode)
  const morningBriefStories = useMemo(() => {
    if (currentModeArticles.length === 0) return [];
    const now = Date.now();
    const scored = currentModeArticles.slice(0, 80).map(a => {
      const relatedCount = articleClusters.get(a.id)?.length || 0;
      const hoursOld = Math.max(0, (now - a.date.getTime()) / (3600 * 1000));
      const recencyScore = Math.max(0, 24 - hoursOld);
      const score = relatedCount * 10 + recencyScore;
      return { article: a, related: articleClusters.get(a.id) || [], score };
    });
    scored.sort((x, y) => y.score - x.score);

    const picked: { article: Article; related: Article[] }[] = [];
    const usedIds = new Set<string>();
    const usedPubRoots = new Set<string>();

    for (const item of scored) {
      if (usedIds.has(item.article.id)) continue;
      const clusterOverlap = item.related.some(r => usedIds.has(r.id));
      if (clusterOverlap) continue;
      const pubRoot = getPublisherRoot(item.article.src);
      if (usedPubRoots.has(pubRoot) && picked.length < 4 && scored.length > 10) continue;

      usedIds.add(item.article.id);
      item.related.forEach(r => usedIds.add(r.id));
      usedPubRoots.add(pubRoot);
      picked.push({ article: item.article, related: item.related });
      if (picked.length >= 5) break;
    }

    return picked;
  }, [currentModeArticles, articleClusters]);

  // Category counts (scoped strictly to current mode)
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: currentModeArticles.length };
    const base = mode === 'world' ? WORLD_CATEGORIES : CRYPTO_CATEGORIES;
    base.forEach(cat => {
      if (cat.id === 'all') return;
      counts[cat.id] = currentModeArticles.filter(a => 
        a.matchedCategories.includes(cat.id) || a.primaryCat === cat.id
      ).length;
    });
    return counts;
  }, [currentModeArticles, mode]);

  // Filtered articles (strictly topic-isolated)
  const filtered = useMemo(() => {
    const baseList = filter === 'saved' ? savedArticles : currentModeArticles;
    const q = query.trim().toLowerCase();
    const cleanQ = q.replace(/^\$/, '').trim();
    const matchedAssetDef = cleanQ
      ? ASSET_DEFINITIONS.find(
          d =>
            d.symbol.toLowerCase() === cleanQ ||
            d.id.toLowerCase() === cleanQ ||
            d.name.toLowerCase() === cleanQ
        )
      : undefined;

    return baseList.filter(a => {
      if (filter === 'saved' && a.mode && a.mode !== mode) {
        return false;
      }
      const matchCat =
        filter === 'all' ||
        filter === 'saved' ||
        (filter === 'new' ? a.date.getTime() > lastVisitTime : (a.matchedCategories.includes(filter) || a.primaryCat === filter));
      if (!matchCat) return false;
      if (!q) return true;

      const textMatch =
        a.title.toLowerCase().includes(q) ||
        a.src.toLowerCase().includes(q) ||
        Boolean(a.snippet && a.snippet.toLowerCase().includes(q));
      const assetMatch = matchedAssetDef
        ? matchedAssetDef.regex.test(`${a.title} ${a.snippet || ''}`)
        : false;
      return textMatch || assetMatch;
    });
  }, [currentModeArticles, savedArticles, filter, query, lastVisitTime, mode]);

  // Progressive Page Render Limit (Pagination to prevent DOM bloat & paint lag)
  const [displayLimit, setDisplayLimit] = useState(24);

  useEffect(() => {
    setDisplayLimit(24);
  }, [mode, filter, query]);

  const visibleArticles = useMemo(() => {
    return filtered.slice(0, displayLimit);
  }, [filtered, displayLimit]);

  // Copy share link helper
  const handleCopyLink = (id: string, link: string) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(link).catch(() => {});
      } else {
        const el = document.createElement('textarea');
        el.value = link;
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
      }
    } catch {}
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Open Perspective Comparator Modal
  const handleOpenPerspective = useCallback((primary: Article, related: Article[]) => {
    setPerspectivePrimary(primary);
    setPerspectiveRelated(related);
    setPerspectiveModalOpen(true);
  }, []);

  // LiveCoinWatch bottom widget loader
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://www.livecoinwatch.com/static/lcw-widget.js';
    script.defer = true;
    document.body.appendChild(script);
    return () => {
      try {
        document.body.removeChild(script);
      } catch {}
    };
  }, []);

  return (
    <div className="min-h-screen text-[var(--ink)]">
      {/* Sentiment & Threat Modals */}
      <FearGreedModal
        isOpen={showFearGreed}
        onClose={() => setShowFearGreed(false)}
        fearGreed={fearGreed}
        isDark={isDark}
      />

      <DoomsdayModal 
        isOpen={showDoomsday} 
        onClose={() => setShowDoomsday(false)} 
        isDark={isDark} 
      />

      <CatalystCalendarModal
        isOpen={showCatalysts}
        onClose={() => setShowCatalysts(false)}
        activeMode={mode}
      />

      <NotificationModal
        isOpen={showNotificationModal}
        onClose={() => setShowNotificationModal(false)}
        isEnabled={notificationsEnabled}
        permission={notificationPermission}
        onToggle={toggleNotifications}
        onTest={handleTestNotification}
      />

      <DashboardSettingsModal
        isOpen={showDashboardModal}
        onClose={() => setShowDashboardModal(false)}
        mode={mode}
        settings={dashboardSettings}
        onUpdateSettings={updateDashboardSettings}
        categoryCounts={categoryCounts}
      />

      <PwaInstallModal
        isOpen={showInstallModal}
        onClose={() => setShowInstallModal(false)}
        isIOS={isIOS}
        deferredPrompt={deferredPrompt}
        onInstalled={() => setIsInstalled(true)}
      />

      {/* Perspective Comparator Modal (Side-by-Side Coverage Analysis) */}
      <PerspectiveModal
        isOpen={perspectiveModalOpen}
        onClose={() => setPerspectiveModalOpen(false)}
        primaryArticle={perspectivePrimary}
        relatedArticles={perspectiveRelated}
        mode={mode}
        isDark={isDark}
      />

      {/* Unified Sticky Header & Live Ticker Bar */}
      <div 
        id="sticky-top-bar" 
        className="sticky top-0 z-80 bg-[var(--surface-solid)] border-b border-[var(--border)] shadow-md"
      >
        <Header
          mode={mode}
          query={query}
          loading={loading}
          isDark={isDark}
          isInstalled={isInstalled}
          notificationsEnabled={notificationsEnabled}
          fearGreed={fearGreed}
          onSetQuery={setQuery}
          onSetFilter={setFilter}
          onModeSwitch={handleModeSwitch}
          onToggleDark={() => setIsDark(!isDark)}
          onManualRefresh={handleManualRefresh}
          onInstallClick={() => setShowInstallModal(true)}
          onOpenFearGreed={() => setShowFearGreed(true)}
          onOpenDoomsday={() => setShowDoomsday(true)}
          onOpenCatalysts={() => setShowCatalysts(true)}
          onOpenDashboard={() => setShowDashboardModal(true)}
          onOpenNotifications={() => setShowNotificationModal(true)}
        />

        {/* Dedicated Top Ticker Strip (Stays Stuck with Header on Scroll) */}
        <div id="top-sub-bar" className="relative z-10 py-1 px-3 sm:px-4 bg-[var(--bg2)] border-b border-[var(--border)]">
          <div className="max-w-[1440px] mx-auto flex items-center justify-between gap-2">
            <div className="flex-1 min-w-0 overflow-hidden">
              {mode === 'crypto' ? (
                <LiveTicker onPriceTick={handlePriceTick} />
              ) : (
                <CommoditiesTicker marketQuotes={marketQuotes} />
              )}
            </div>

            {/* Feature 5: Prominent Macro Catalyst Countdown Ticker Pill (Desktop Only - hidden on mobile/phones to conserve screen space) */}
            {nearestCatalyst && nearestCountdown && (
              <button
                type="button"
                onClick={() => setShowCatalysts(true)}
                className="hidden lg:inline-flex shrink-0 items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--surface-solid)] border border-[var(--border)] hover:border-[var(--accent)] text-xs font-mono transition-all cursor-pointer shadow-sm group text-left touch-manipulation my-0.5 active:scale-95"
                title="View full Macro Catalyst Calendar and exact ticking countdowns"
              >
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                  <span className={`text-[10px] font-black uppercase tracking-wider ${mode === 'world' ? 'text-blue-500 dark:text-blue-400' : 'text-[var(--accent)]'}`}>
                    NEXT CATALYST:
                  </span>
                </span>
                <span className="font-bold text-[var(--ink)] truncate max-w-[160px] xl:max-w-[220px]">
                  {nearestCatalyst.title.split('(')[0].trim()}
                </span>
                <span className="px-1.5 py-0.5 rounded bg-black/10 dark:bg-white/10 font-bold text-xs text-amber-500 dark:text-amber-400 font-mono tracking-wider">
                  {nearestCountdown.formatted}
                </span>
                <span className="text-[10px] text-[var(--ink-muted)] group-hover:text-[var(--accent)] hidden xl:inline">
                  [VIEW CALENDAR →]
                </span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Stream Area */}
      <main className="max-w-[1440px] mx-auto my-6 px-4">
        {/* Navigation Category Filters */}
        <FilterTabs
          categories={activeCategories}
          categoryCounts={categoryCounts}
          activeFilter={filter}
          newArticlesCount={newArticlesCount}
          savedArticles={savedArticles}
          showBrief={showBrief}
          mode={mode}
          onSetFilter={setFilter}
          onOpenDashboard={() => setShowDashboardModal(true)}
          onToggleBrief={toggleBrief}
        />

        {/* 60-Second Morning Brief */}
        <MorningBrief
          showBrief={showBrief}
          morningBriefStories={morningBriefStories}
          mode={mode}
          isDark={isDark}
          filter={filter}
          query={query}
          savedIds={savedIds}
          onToggleBrief={toggleBrief}
          onOpenCatalysts={() => setShowCatalysts(true)}
          onToggleSave={toggleSaveArticle}
          onOpenPerspective={handleOpenPerspective}
        />

        {/* Status subheader */}
        <div className="flex items-center justify-between text-xs font-mono text-[var(--ink-muted)] mb-4 px-1 flex-wrap gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span>SHOWING: <strong className="text-[var(--ink)]">{filtered.length}</strong> {filter === 'saved' ? 'SAVED DISPATCHES' : mode === 'world' ? 'GLOBAL DISPATCHES' : 'CRYPTO DISPATCHES'}</span>

            {/* Feature 3: Live Wire Velocity Speedometer Pill */}
            <div 
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md border text-[10px] sm:text-[11px] font-mono font-bold transition-all cursor-default ${
                wireVelocity.status === 'SURGE'
                  ? 'bg-red-500/10 text-red-500 border-red-500/30 shadow-[0_0_12px_rgba(239,68,68,0.2)]'
                  : wireVelocity.status === 'HIGH'
                    ? 'bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border-emerald-500/30'
                    : 'bg-[var(--surface-solid)] text-[var(--ink-muted)] border-[var(--border)]'
              }`}
              title={`Breaking Wire Velocity: ${wireVelocity.count} dispatches per hour based on incoming wire feed cadence`}
            >
              <Zap className={`w-3 h-3 ${wireVelocity.status === 'SURGE' ? 'fill-red-500 animate-bounce' : 'fill-current'}`} />
              <span className="hidden sm:inline">SPEEDOMETER:</span>
              <span className="text-[var(--ink)] font-black">{wireVelocity.count}/HR</span>
              <span className={`text-[9px] px-1 py-0.2 rounded font-black tracking-wider uppercase ${
                wireVelocity.status === 'SURGE'
                  ? 'bg-red-500 text-white animate-pulse'
                  : wireVelocity.status === 'HIGH'
                    ? 'bg-emerald-500 text-black'
                    : 'bg-black/10 dark:bg-white/10 text-[var(--ink-muted)]'
              }`}>
                {wireVelocity.status}
              </span>
            </div>

            {refreshToast && (
              <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono border ${
                refreshToast.active 
                  ? 'bg-amber-500/10 text-amber-500 border-amber-500/30 animate-pulse' 
                  : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${refreshToast.active ? 'bg-amber-500 animate-ping' : 'bg-emerald-400'}`} />
                {refreshToast.message}
              </span>
            )}
            {filter !== 'all' && (
              <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${
                mode === 'world' ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' : 'bg-red-500/10 text-red-500 border-red-500/20'
              }`}>
                FILTER: {filter}
              </span>
            )}
            {query && (
              <span className="px-2 py-0.5 rounded bg-[var(--surface-solid)] border border-[var(--border)] text-[var(--ink)] text-[10px]">
                SEARCH: "{query}"
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Radio className={`w-3.5 h-3.5 animate-pulse ${mode === 'world' ? 'text-blue-400' : 'text-[var(--red)]'}`} />
            <span>{mode === 'world' ? 'VERIFIED NON-PARTISAN WIRE SERVICES' : 'ENCRYPTED RSS FEED PROTOCOL'}</span>
          </div>
        </div>

        {/* Top Sponsored Ad Unit (Affizy Responsive: Desktop = 970x250 Billboard [Zone 1021], Mobile/Tablet = 480x320 [Zone 1007]) */}
        {isDesktop ? (
          <AffizyAdUnit zoneId="1021" bannerSize="970x250" maxWidth="max-w-[1020px]" />
        ) : (
          <AffizyAdUnit zoneId="1007" bannerSize="480x320" maxWidth="max-w-[540px]" />
        )}

        {/* Loading Skeleton state */}
        {loading && articles.length === 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="card h-[360px] skeleton-shimmer">
                <div className="w-full h-[180px] bg-white/5" />
                <div className="p-4 space-y-3">
                  <div className="w-24 h-3 bg-white/10 rounded" />
                  <div className="w-full h-4 bg-white/10 rounded" />
                  <div className="w-3/4 h-4 bg-white/10 rounded" />
                  <div className="w-28 h-7 bg-white/10 rounded mt-6" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center p-16 border border-dashed border-[var(--border)] rounded-2xl bg-[var(--surface)] my-8">
            <ShieldAlert className="w-12 h-12 text-[var(--accent)] mx-auto mb-3 opacity-80" />
            <h2 className="font-display text-[var(--accent)] text-3xl">
              {filter === 'saved' ? 'NO SAVED STORIES YET' : 'NO MATCHING DISPATCHES'}
            </h2>
            <p className="text-[var(--ink-muted)] max-w-md mx-auto my-3 text-sm">
              {filter === 'saved'
                ? 'Tap the bookmark icon on any dispatch to save it to your personal Read-Later queue.'
                : 'No reports match your current category or search criteria. Try choosing another filter or resetting your search.'}
            </p>
            <div className="flex gap-3 justify-center mt-5">
              <button 
                onClick={() => { setFilter('all'); setQuery(''); }} 
                className="rbtn cursor-pointer"
              >
                RESET FILTER
              </button>
              <button 
                onClick={() => handleManualRefresh()} 
                className="fp cursor-pointer"
              >
                RE-SYNC FEEDS
              </button>
            </div>
          </div>
        ) : (
          /* Article Grid */
          <>
            <div id="grid" className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 ${dashboardSettings.cardDensity === 'compact' ? 'gap-3.5' : 'gap-5'}`}>
              {visibleArticles.map((a, idx) => {
                const isNew = a.date.getTime() > lastVisitTime;
                const isSaved = savedIds.has(a.id);
                const relatedSources = articleClusters.get(a.id) || [];

                return (
                  <React.Fragment key={a.id || idx}>
                    <ArticleCard
                      article={a}
                      mode={mode}
                      idx={idx}
                      isDark={isDark}
                      isSaved={isSaved}
                      isNew={isNew}
                      copiedId={copiedId}
                      dashboardSettings={dashboardSettings}
                      marketQuotes={marketQuotes}
                      relatedSources={relatedSources}
                      searchQuery={query}
                      onToggleSave={toggleSaveArticle}
                      onCopyLink={handleCopyLink}
                      onSetQuery={setQuery}
                      onOpenPerspective={handleOpenPerspective}
                    />

                    {/* In-Feed Sponsored Unit (Affizy Zone 1015 - 300x250) - Displayed after 8 articles (idx === 7) - EXACT PLACEMENT INTACT */}
                    {idx === 7 && (
                      <div className="col-span-full my-6 flex flex-col items-center justify-center w-full">
                        <div className="text-[10px] font-mono text-[var(--ink-muted)] mb-1 uppercase tracking-wider flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                          <span>SPONSORED WIRE</span>
                        </div>
                        <AffizyAdUnit zoneId="1015" bannerSize="300x250" maxWidth="max-w-[360px]" />
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>

            {/* Load More Dispatches Button */}
            {filtered.length > displayLimit && (
              <div className="flex justify-center my-8">
                <button
                  onClick={() => setDisplayLimit(prev => prev + 24)}
                  className="rbtn px-8 py-3 text-xs font-mono tracking-wider cursor-pointer shadow-lg hover:shadow-red-500/15 flex items-center gap-2"
                >
                  <span>LOAD MORE DISPATCHES ({filtered.length - displayLimit} REMAINING)</span>
                  <span className="font-sans text-xs">▼</span>
                </button>
              </div>
            )}

            {/* Fallback In-Feed Sponsored Unit: If fewer than 8 articles match current filter/search */}
            {filtered.length > 0 && filtered.length < 8 && (
              <div className="my-6 flex flex-col items-center justify-center w-full">
                <div className="text-[10px] font-mono text-[var(--ink-muted)] mb-1 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                  <span>SPONSORED WIRE</span>
                </div>
                <AffizyAdUnit zoneId="1015" bannerSize="300x250" maxWidth="max-w-[360px]" />
              </div>
            )}
          </>
        )}
      </main>

      {/* Floating Back-to-Top Button */}
      <BackToTop show={showBackToTop} />

      {/* Notification Toast */}
      <AnimatePresence>
        {notificationSuccessToast && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-16 left-1/2 -translate-x-1/2 z-50 pointer-events-none max-w-md px-4 w-full"
          >
            <div className="px-4 py-2.5 rounded-xl border border-emerald-500/40 bg-[var(--surface-solid)]/95 text-emerald-500 dark:text-emerald-400 font-mono text-xs shadow-2xl backdrop-blur-md flex items-center gap-2 text-center justify-center">
              <BellRing className="w-4 h-4 shrink-0 text-emerald-500" />
              <span>{notificationSuccessToast}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Fixed Ticker Strip: LiveCoinWatch in Crypto Mode, Global Stock Tape in World Mode */}
      <div 
        id="tickers" 
        className={`fixed bottom-0 left-0 right-0 z-90 border-t border-[var(--border)] shadow-2xl pb-[env(safe-area-inset-bottom,0px)] transition-colors duration-300 ${
          isDark || mode === 'crypto' ? 'bg-[#060608]' : 'bg-[#ffffff]'
        }`}
      >
        {/* Crypto Mode: LiveCoinWatch Crypto Marquee */}
        <div className={mode === 'crypto' ? 'block' : 'hidden'}>
          <div 
            className="livecoinwatch-widget-5" 
            lcw-base="USD" 
            lcw-color-tx="#abb8c3" 
            lcw-marquee-1="coins" 
            lcw-marquee-2="movers" 
            lcw-marquee-items="15"
          ></div>
        </div>

        {/* World News Mode: Global Stock Market & Indices Ticker */}
        <div className={mode === 'world' ? 'block' : 'hidden'}>
          <StockTickerTape isDark={isDark} marketQuotes={marketQuotes} />
        </div>
      </div>
    </div>
  );
}
