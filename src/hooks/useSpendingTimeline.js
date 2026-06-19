import { useMemo } from 'react';

function addMonths(date, months) {
  const d = new Date(date.getFullYear(), date.getMonth() + months, 1);
  return d;
}

function endOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

function toKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function getWindow(range, periodOffset) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (range === 'week') {
    const day = today.getDay();
    const diffToMon = day === 0 ? -6 : 1 - day;
    const monday = new Date(today);
    monday.setDate(today.getDate() + diffToMon + periodOffset * 7);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return { start: monday, end: sunday };
  }

  if (range === 'month') {
    const ref = addMonths(today, periodOffset);
    return { start: ref, end: endOfMonth(ref) };
  }

  if (range === '2month') {
    const start = addMonths(today, periodOffset - 1);
    const end = endOfMonth(addMonths(today, periodOffset));
    return { start, end };
  }

  // '3month'
  const start = addMonths(today, periodOffset - 2);
  const end = endOfMonth(addMonths(today, periodOffset));
  return { start, end };
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function getPeriodLabel(range, start, end) {
  if (range === 'week') {
    return `${start.getDate()} ${MONTHS[start.getMonth()]} – ${end.getDate()} ${MONTHS[end.getMonth()]}`;
  }
  if (range === 'month') {
    return `${MONTHS[start.getMonth()]} ${start.getFullYear()}`;
  }
  if (start.getFullYear() === end.getFullYear()) {
    return `${MONTHS[start.getMonth()]} – ${MONTHS[end.getMonth()]} ${end.getFullYear()}`;
  }
  return `${MONTHS[start.getMonth()]} ${start.getFullYear()} – ${MONTHS[end.getMonth()]} ${end.getFullYear()}`;
}

function generateDayBuckets(start, end) {
  const buckets = [];
  const cur = new Date(start);
  while (cur <= end) {
    buckets.push({
      key: toKey(cur),
      label: `${cur.getDate()} ${MONTHS[cur.getMonth()]}`,
      weekEnd: null,
      spend: 0,
      cumulative: 0,
    });
    cur.setDate(cur.getDate() + 1);
  }
  return buckets;
}

function generateWeekBuckets(start, end) {
  const buckets = [];
  const cur = new Date(start);
  let weekNum = 1;
  while (cur <= end) {
    const weekStart = new Date(cur);
    const weekEnd = new Date(cur);
    weekEnd.setDate(cur.getDate() + 6);
    if (weekEnd > end) weekEnd.setTime(end.getTime());
    buckets.push({
      key: toKey(weekStart),
      label: `W${weekNum}`,
      weekEnd: toKey(weekEnd),
      spend: 0,
      cumulative: 0,
    });
    cur.setDate(cur.getDate() + 7);
    weekNum++;
  }
  return buckets;
}

export function useSpendingTimeline(transactions, { range = 'month', granularity = 'day', periodOffset = 0 } = {}) {
  return useMemo(() => {
    const { start, end } = getWindow(range, periodOffset);
    const startKey = toKey(start);
    const endKey = toKey(end);

    const filtered = transactions.filter(
      (t) => t.amount < 0 && t.date >= startKey && t.date <= endKey
    );

    let buckets = granularity === 'day'
      ? generateDayBuckets(start, end)
      : generateWeekBuckets(start, end);

    filtered.forEach((t) => {
      let idx;
      if (granularity === 'day') {
        idx = buckets.findIndex((b) => b.key === t.date);
      } else {
        idx = buckets.findIndex((b) => t.date >= b.key && t.date <= b.weekEnd);
      }
      if (idx !== -1) buckets[idx].spend += Math.abs(t.amount);
    });

    let running = 0;
    buckets = buckets.map((b) => {
      running += b.spend;
      return { ...b, cumulative: running };
    });

    const totalSpend = running;
    const periodLabel = getPeriodLabel(range, start, end);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayKey = toKey(today);

    const canGoBack = transactions.some((t) => t.amount < 0 && t.date < startKey);
    const canGoForward = endKey < todayKey;

    return { buckets, totalSpend, periodLabel, canGoBack, canGoForward };
  }, [transactions, range, granularity, periodOffset]);
}
