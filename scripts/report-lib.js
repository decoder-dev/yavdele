import fs from 'fs';
import path from 'path';

const logFile = path.join(process.cwd(), 'data', 'analytics.jsonl');

function readRecords() {
  if (!fs.existsSync(logFile)) return [];
  const lines = fs.readFileSync(logFile, 'utf8').split(/\r?\n/).filter(Boolean);
  return lines.map((l) => {
    try { return JSON.parse(l); } catch { return null; }
  }).filter(Boolean);
}

function inPeriod(ts, period) {
  const d = new Date(ts).getTime();
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  if (period === 'day') return d >= now - day;
  if (period === 'week') return d >= now - 7 * day;
  return true;
}

export function aggregateStats({ period = 'day' } = {}) {
  const recs = readRecords().filter((r) => inPeriod(r.ts, period));
  const count = (ev) => recs.filter((r) => r.event === ev).length;
  const show_start = count('show_start');
  const start_yes = count('start_yes');
  const to_chat = count('to_chat');
  const conv_start_yes = show_start ? Math.round((start_yes / show_start) * 100) : 0;
  const conv_yes_chat = start_yes ? Math.round((to_chat / start_yes) * 100) : 0;
  return { show_start, start_yes, to_chat, conv_start_yes, conv_yes_chat };
}


