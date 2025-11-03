// Загрузка FAQ из YAML с авто‑перезагрузкой
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

const filePath = path.join(process.cwd(), 'data', 'faq.yaml');
let cache = {};

function load() {
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    const doc = yaml.load(raw) || {};
    cache = doc;
  } catch {
    // если файла нет или ошибка — оставляем предыдущий кеш
  }
}

load();

try {
  fs.watch(filePath, { persistent: false }, () => {
    load();
  });
} catch {}

export function getFaqEntry(key) {
  return cache[key];
}


