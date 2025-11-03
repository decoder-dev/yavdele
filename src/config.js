import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

// Конфигурация приложения (читается из .env)
export const config = {
  vkGroupToken: process.env.VK_GROUP_TOKEN || '',
  groupId: Number(process.env.VK_GROUP_ID || 0),
  chatInviteUrl: process.env.CHAT_INVITE_URL || 'https://vk.com/im?sel=c1',
  logLevel: process.env.LOG_LEVEL || 'info',
  port: Number(process.env.PORT || 3000),
  adminIds: (process.env.ADMIN_IDS || '').split(',').map((s) => Number(s.trim())).filter(Boolean),
  maxLogSizeBytes: Number(process.env.MAX_LOG_SIZE_BYTES || 5 * 1024 * 1024),
  sentryDsn: process.env.SENTRY_DSN || ''
};

// Проверка обязательных переменных окружения
export function assertConfig() {
  const missing = [];
  if (!config.vkGroupToken) missing.push('VK_GROUP_TOKEN');
  if (!config.groupId) missing.push('VK_GROUP_ID');
  if (!config.chatInviteUrl) missing.push('CHAT_INVITE_URL');
  if (missing.length) {
    throw new Error(`Missing required env vars: ${missing.join(', ')}`);
  }
}

// Загрузка runtime-перезаписей (например, смена CHAT_INVITE_URL из админ-панели)
const runtimeFile = path.join(process.cwd(), 'data', 'runtime-config.json');
try {
  if (fs.existsSync(runtimeFile)) {
    const raw = JSON.parse(fs.readFileSync(runtimeFile, 'utf8'));
    if (raw.chatInviteUrl) config.chatInviteUrl = raw.chatInviteUrl;
  }
} catch {}

export function saveRuntimeConfig(partial) {
  try {
    const current = fs.existsSync(runtimeFile) ? JSON.parse(fs.readFileSync(runtimeFile, 'utf8')) : {};
    const next = { ...current, ...partial };
    fs.mkdirSync(path.dirname(runtimeFile), { recursive: true });
    fs.writeFileSync(runtimeFile, JSON.stringify(next, null, 2), 'utf8');
  } catch {}
}



