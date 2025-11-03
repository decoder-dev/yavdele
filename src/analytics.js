import fs from 'fs';
import path from 'path';

const dataDir = path.join(process.cwd(), 'data');
const logFile = path.join(dataDir, 'analytics.jsonl');

function ensureDir() {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
}

export function track(event, payload = {}) {
  try {
    ensureDir();
    const rec = { ts: new Date().toISOString(), event, ...payload };
    fs.appendFileSync(logFile, JSON.stringify(rec) + '\n', 'utf8');
  } catch {
    // ignore analytics failures
  }
}


