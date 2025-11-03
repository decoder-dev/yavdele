// Фильтры модерации: простая проверка токсичных слов с мягким ответом
import fs from 'fs';
import path from 'path';

const dictPath = path.join(process.cwd(), 'data', 'moderation.json');
let toxicWords = ['дурак', 'идиот', 'тупой']; // базовый список

try {
  if (fs.existsSync(dictPath)) {
    const raw = JSON.parse(fs.readFileSync(dictPath, 'utf8'));
    if (Array.isArray(raw.words)) toxicWords = raw.words.map((w) => String(w).toLowerCase());
  }
} catch {}

export function isToxic(text) {
  if (!text) return false;
  const t = text.toLowerCase();
  return toxicWords.some((w) => t.includes(w));
}


