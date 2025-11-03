import fs from 'fs';
import path from 'path';

const dataDir = path.join(process.cwd(), 'data');
const stateFile = path.join(dataDir, 'user-state.json');

function ensureDir() {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
}

export class PersistentState {
  constructor() {
    ensureDir();
    this.map = new Map();
    this._load();
  }

  _load() {
    try {
      if (fs.existsSync(stateFile)) {
        const raw = fs.readFileSync(stateFile, 'utf8');
        const obj = JSON.parse(raw || '{}');
        for (const [k, v] of Object.entries(obj)) this.map.set(Number(k), v);
      }
    } catch {
      // ignore corrupted file, start fresh
      this.map = new Map();
    }
  }

  _save() {
    const obj = Object.fromEntries([...this.map.entries()].map(([k, v]) => [String(k), v]));
    fs.writeFileSync(stateFile, JSON.stringify(obj, null, 2), 'utf8');
  }

  get(userId) {
    return this.map.get(userId);
  }

  set(userId, value) {
    this.map.set(userId, value);
    this._save();
  }

  delete(userId) {
    this.map.delete(userId);
    this._save();
  }
}


