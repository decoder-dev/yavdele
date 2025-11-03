// Простейшая админ-панель через ЛС сообщества
// Команды:
// stats day | stats week
// set chat <url>
// push <user_id> <текст>

import { config, saveRuntimeConfig } from './config.js';
import { track } from './analytics.js';

function isAdmin(userId) {
  return config.adminIds.includes(Number(userId));
}

export async function handleAdminCommand(ctx, vk) {
  const userId = ctx.senderId;
  if (!isAdmin(userId)) return false;

  const text = (ctx.text || '').trim();
  const [cmd, arg1, ...rest] = text.split(/\s+/);

  if (cmd === 'stats') {
    const period = (arg1 || 'day').toLowerCase();
    const { aggregateStats } = await import('../scripts/report-lib.js');
    const stats = aggregateStats({ period });
    await ctx.send({
      message: `Статистика (${period}):\n- Старт показан: ${stats.show_start}\n- Нажали «интересует»: ${stats.start_yes}\n- Переход в беседу: ${stats.to_chat}\nКонверсия Start→Yes: ${stats.conv_start_yes}%\nКонверсия Yes→Chat: ${stats.conv_yes_chat}%`
    });
    track('admin_stats', { admin_id: userId, period });
    return true;
  }

  if (cmd === 'set' && arg1 === 'chat') {
    const url = rest.join(' ').trim();
    if (!url.startsWith('http')) {
      await ctx.send('Укажите корректный URL.');
      return true;
    }
    saveRuntimeConfig({ chatInviteUrl: url });
    // Обновим runtime config в памяти
    config.chatInviteUrl = url;
    await ctx.send('CHAT_INVITE_URL обновлён.');
    track('admin_set_chat', { admin_id: userId });
    return true;
  }

  if (cmd === 'push') {
    const targetId = Number(arg1);
    const message = rest.join(' ').trim();
    if (!targetId || !message) {
      await ctx.send('Использование: push <user_id> <текст>');
      return true;
    }
    try {
      await vk.api.messages.send({ user_id: targetId, random_id: Date.now(), message });
      await ctx.send('Отправлено.');
      track('admin_push', { admin_id: userId, target_id: targetId });
    } catch (e) {
      await ctx.send('Не удалось отправить.');
    }
    return true;
  }

  await ctx.send('Команды: stats day|week, set chat <url>, push <user_id> <текст>');
  return true;
}


