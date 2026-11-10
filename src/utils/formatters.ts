import { CatalystEvent } from '../types';

export function formatTimeAgo(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  if (diffMs < 0 || isNaN(diffMs)) return 'Just now';
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function formatCountdown(targetDate: Date, nowMs = Date.now()): string {
  const diff = targetDate.getTime() - nowMs;
  if (diff <= 0) return 'LIVE NOW';
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (days === 0) return `IN ${hours}h ${mins}m`;
  return `IN ${days}d ${hours}h`;
}

export function getUpcomingCatalysts(): CatalystEvent[] {
  const now = new Date();
  const d = (daysAhead: number, hourUtc = 13, minUtc = 30) => {
    const target = new Date(now.getTime() + daysAhead * 86400 * 1000);
    target.setUTCHours(hourUtc, minUtc, 0, 0);
    return target;
  };

  return [
    {
      id: 'cat-cpi',
      title: 'U.S. CPI Inflation Report (YoY & Core MoM)',
      category: 'macro',
      categoryLabel: 'MACRO / FED',
      date: d(2, 13, 30),
      impact: 'HIGH',
      impactNote: 'Primary inflation gauge driving Federal Reserve rate cut expectations, USD strength, and risk-asset volatility across stocks & Bitcoin.',
      consensus: 'Core CPI Est: 0.2% MoM'
    },
    {
      id: 'cat-etf-flows',
      title: 'SEC Digital Asset ETF Options & Institutional Flow Settlement',
      category: 'crypto',
      categoryLabel: 'CRYPTO & ETF',
      date: d(3, 20, 0),
      impact: 'HIGH',
      impactNote: 'Weekly institutional Spot BTC & ETH ETF net flow rebalancing and SEC regulatory filing review window.',
      consensus: 'Institutional Desk Rebalance'
    },
    {
      id: 'cat-jobless',
      title: 'U.S. Initial Jobless Claims & Labor Market Pulse',
      category: 'macro',
      categoryLabel: 'MACRO / FED',
      date: d(4, 13, 30),
      impact: 'MEDIUM',
      impactNote: 'High-frequency indicator of U.S. labor market cooling or resilience ahead of the next FOMC decision.',
      consensus: 'Est: 218K Claims'
    },
    {
      id: 'cat-unlocks',
      title: 'Major Layer-1 & DeFi Ecosystem Token Unlocks ($340M+)',
      category: 'crypto',
      categoryLabel: 'CRYPTO & ETF',
      date: d(5, 12, 0),
      impact: 'MEDIUM',
      impactNote: 'Scheduled cliff and linear vesting unlocks across major altcoin protocols; closely watched for spot liquidity absorption.',
      consensus: '$340M+ Combined Cliff'
    },
    {
      id: 'cat-fomc',
      title: 'Federal Reserve FOMC Minutes & Chair Powell Policy Remarks',
      category: 'macro',
      categoryLabel: 'MACRO / FED',
      date: d(7, 19, 0),
      impact: 'HIGH',
      impactNote: 'Detailed breakdown of Federal Open Market Committee rate trajectory, balance sheet QT pace, and liquidity outlook.',
      consensus: 'Hawkish / Neutral Watch'
    },
    {
      id: 'cat-nvda-ai',
      title: 'Big Tech & AI Semiconductor Earnings / Guidance Window',
      category: 'earnings',
      categoryLabel: 'TECH & EARNINGS',
      date: d(9, 21, 0),
      impact: 'HIGH',
      impactNote: 'Hyperscaler AI capex and data-center GPU demand guidance — key driver for NASDAQ 100, S&P 500, and AI-crypto tokens.',
      consensus: 'Post-Market Bell (4:00 PM EST)'
    },
    {
      id: 'cat-eth-upgrade',
      title: 'Ethereum Core Dev Call & Pectra / L2 Scaling Milestone',
      category: 'crypto',
      categoryLabel: 'CRYPTO & ETF',
      date: d(11, 14, 0),
      impact: 'MEDIUM',
      impactNote: 'Execution & consensus layer client specification freeze for blob throughput expansion and L2 fee reduction.',
      consensus: 'AllCoreDevs Execution'
    },
    {
      id: 'cat-g7-energy',
      title: 'G7 & OPEC+ Global Energy, Trade & Geopolitical Ministerial',
      category: 'geopolitics',
      categoryLabel: 'GEOPOLITICS',
      date: d(14, 10, 0),
      impact: 'HIGH',
      impactNote: 'Crude oil production quotas, global shipping corridor security, and strategic mineral supply chain policy.',
      consensus: 'Vienna / Brussels Wire'
    }
  ];
}
