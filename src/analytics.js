import fs from 'fs';
import path from 'path';
import { config } from './config.js';

const dataDir = path.join(process.cwd(), 'data');
const logFile = path.join(dataDir, 'analytics.jsonl');

function ensureDir() {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
}

// Простейшая аналитика: пишем события построчно в JSONL-файл
export function track(event, payload = {}) {
  try {
    ensureDir();
    const rec = { ts: new Date().toISOString(), event, ...payload };
    try {
      const stat = fs.existsSync(logFile) ? fs.statSync(logFile) : null;
      if (stat && stat.size > config.maxLogSizeBytes) {
        const rotated = logFile.replace(/\.jsonl$/, `.jsonl.${Date.now()}`);
        fs.renameSync(logFile, rotated);
      }
    } catch {}
    fs.appendFileSync(logFile, JSON.stringify(rec) + '\n', 'utf8');
  } catch {
    // ignore analytics failures
  }
}



