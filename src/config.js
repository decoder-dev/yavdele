import dotenv from 'dotenv';

dotenv.config();

export const config = {
  vkGroupToken: process.env.VK_GROUP_TOKEN || '',
  groupId: Number(process.env.VK_GROUP_ID || 0),
  chatInviteUrl: process.env.CHAT_INVITE_URL || 'https://vk.com/im?sel=c1',
  logLevel: process.env.LOG_LEVEL || 'info',
  port: Number(process.env.PORT || 3000)
};

export function assertConfig() {
  const missing = [];
  if (!config.vkGroupToken) missing.push('VK_GROUP_TOKEN');
  if (!config.groupId) missing.push('VK_GROUP_ID');
  if (!config.chatInviteUrl) missing.push('CHAT_INVITE_URL');
  if (missing.length) {
    throw new Error(`Missing required env vars: ${missing.join(', ')}`);
  }
}


