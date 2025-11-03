import { VK, Keyboard } from 'vk-io';
import pino from 'pino';
import { config, assertConfig } from './config.js';
import { keyboards } from './keyboards.js';
import { buildFaqFollowupKeyboard } from './faq.js';
import { getFaqEntry } from './faq_loader.js';
import { PersistentState } from './storage.js';
import { track } from './analytics.js';
import { isToxic } from './moderation.js';
import { handleAdminCommand } from './admin.js';
import * as Sentry from '@sentry/node';
import express from 'express';

assertConfig();

const log = pino({ level: config.logLevel });

const vk = new VK({ token: config.vkGroupToken });

// Инициализация Sentry (если задан DSN)
if (config.sentryDsn) {
  Sentry.init({ dsn: config.sentryDsn });
}

// Хранилище состояния пользователей (с сохранением на диск)
const userState = new PersistentState();
const lastMessageAt = new Map();
const RATE_LIMIT_MS = Number(process.env.RATE_LIMIT_MS || 1000);

// Простейшая защита от флуда (ограничение частоты сообщений от одного пользователя)
function rateLimited(userId, windowMs = RATE_LIMIT_MS) {
  const now = Date.now();
  const last = lastMessageAt.get(userId) || 0;
  if (now - last < windowMs) return true;
  lastMessageAt.set(userId, now);
  return false;
}

// Текст приветствия (вынесен отдельно для переиспользования)
function startText() {
  return 'О, это ты! Похоже, тебя заинтересовали наши возможности в «Я в деле». Я помогу: ответить на вопросы и связать с наставником. Продолжим?';
}

// Отправка стартового сообщения с клавиатурой
function replyStart(ctx) {
  track('show_start', { user_id: ctx.senderId });
  return ctx.send({
    message: startText(),
    keyboard: keyboards.start()
  });
}

// Меню для заинтересованных пользователей
function sendInterestedMenu(ctx) {
  track('interested_menu', { user_id: ctx.senderId });
  return ctx.send({
    message: 'Отлично! Выбери, как удобнее: задать вопрос здесь или сразу перейти в беседу кандидатов, где тебя встретит наставник.',
    keyboard: keyboards.interestedMenu(config.chatInviteUrl)
  });
}

// Меню для пользователей, которые сомневаются/отказываются
function sendNotInterestedMenu(ctx) {
  track('not_interested_menu', { user_id: ctx.senderId });
  return ctx.send({
    message: 'Ты можешь упустить выгодную возможность — лучше узнать детали за 1–2 минуты и решить осознанно. Я могу ответить на вопросы или сразу связать тебя с наставником «Я в деле». Как поступим?',
    keyboard: keyboards.notInterestedMenu(config.chatInviteUrl)
  });
}

// Сообщение с приглашением в беседу кандидатов
function sendToChatInvite(ctx) {
  track('to_chat', { user_id: ctx.senderId });
  return ctx.send({
    message: 'Приглашаю в беседу «Я в деле · набор кандидатов · Мурманская область». Нажми, чтобы присоединиться.',
    keyboard: keyboards.toChat(config.chatInviteUrl)
  });
}

// Обработка выбранной категории FAQ
async function handleFaqCategory(ctx, category) {
  const entry = getFaqEntry(category);
  if (!entry) {
    return ctx.send({
      message: 'Похоже, лучше обсудить лично. Приглашаю в беседу кандидатов.',
      keyboard: keyboards.toChat(config.chatInviteUrl)
    });
  }
  track('faq_show', { user_id: ctx.senderId, category });
  return ctx.send({
    message: entry.text,
    keyboard: buildFaqFollowupKeyboard({ Keyboard }, config.chatInviteUrl, entry.options || [])
  });
}

// Основной обработчик входящих сообщений
vk.updates.on('message_new', async (context) => {
  try {
    const userId = context.senderId;
    if (rateLimited(userId)) return;

    const payload = context.messagePayload || {};
    const rawText = (context.text || '').trim();
    const text = rawText.toLowerCase();

    // typing indicator for UX
    try { await context.setActivity(); } catch { /* ignore */ }

    // Админ-команды
    if (!payload.cmd && await handleAdminCommand(context, vk)) return;

    // Модерация токсичности
    if (isToxic(text)) {
      await context.send({
        message: 'Давай общаться уважительно. Если есть вопросы — лучше обсудить их в беседе с наставником.',
        keyboard: keyboards.toChat(config.chatInviteUrl)
      });
      track('moderation_toxic', { user_id: userId });
      return;
    }

    // First contact or restart keywords
    if (!payload.cmd) {
      // Allow textual fallbacks
      if (['start', 'начать', 'привет', 'hi', 'hello'].includes(text)) {
        await replyStart(context);
        return;
      }

      // If user typed something else, show start with a gentle prompt or route by keywords
      if (text.includes('бесед')) {
        await sendToChatInvite(context);
        return;
      }
      if (text.includes('вопрос')) {
        await context.send({ message: 'Выберите тему вопроса:', keyboard: keyboards.faqCategories() });
        return;
      }
      await replyStart(context);
      return;
    }

    switch (payload.cmd) {
      case 'restart':
        userState.delete(userId);
        track('restart', { user_id: userId });
        await replyStart(context);
        break;

      case 'start_yes':
        userState.set(userId, { stage: 'interested' });
        track('start_yes', { user_id: userId });
        await sendInterestedMenu(context);
        break;

      case 'start_no':
        userState.set(userId, { stage: 'not_interested' });
        track('start_no', { user_id: userId });
        await sendNotInterestedMenu(context);
        break;

      case 'other_q':
        track('other_q', { user_id: userId });
        await context.send({
          message: 'Опиши кратко свой вопрос или выбери из популярных тем.',
          keyboard: keyboards.faqCategories()
        });
        break;

      case 'faq':
        track('faq', { user_id: userId });
        await context.send({ message: 'Выберите тему вопроса:', keyboard: keyboards.faqCategories() });
        break;

      case 'faq_benefits':
        await handleFaqCategory(context, 'benefits');
        break;

      case 'faq_who':
        await handleFaqCategory(context, 'who');
        break;

      case 'faq_how':
        await handleFaqCategory(context, 'how');
        break;

      case 'faq_time':
        await handleFaqCategory(context, 'time');
        break;

      case 'faq_other':
        // One attempt to auto-answer by keywords; else route to chat
        if (text) {
          if (text.includes('стоим') || text.includes('цена')) {
            await context.send({
              message: 'Участие бесплатно. Основной фокус — развитие и практика с наставником.',
              keyboard: Keyboard.builder()
                .linkButton({ label: 'Перейти в беседу', url: config.chatInviteUrl, payload: { cmd: 'to_chat' } })
                .row()
                .textButton({ label: 'Запустить бота заново', payload: { cmd: 'restart' }, color: Keyboard.SECONDARY_COLOR })
            });
            track('faq_auto_answer', { user_id: userId, topic: 'price' });
          } else {
            // Неизвестный вопрос — предлагаем беседу с наставником
            await sendToChatInvite(context);
          }
        } else {
          // Пользователь ещё не отправил текст — просим уточнить
          await context.send({ message: 'Напишите свой вопрос текстом — постараюсь ответить. Если не получится, приглашу в беседу.' });
        }
        break;

      case 'to_chat':
      case 'mentor':
        await sendToChatInvite(context);
        break;

      case 'stop':
        userState.set(userId, { stage: 'stopped' });
        track('stop', { user_id: userId });
        await context.send({
          message: 'Окей, останавливаюсь. Если передумаешь — нажми «Запустить бота заново».',
          keyboard: Keyboard.builder().textButton({ label: 'Запустить бота заново', payload: { cmd: 'restart' }, color: Keyboard.SECONDARY_COLOR })
        });
        break;

      default:
        log.warn({ payload }, 'Unknown payload');
        await replyStart(context);
        break;
    }
  } catch (err) {
    log.error({ err }, 'Failed to process message');
    try { Sentry.captureException?.(err); } catch {}
    try { await (context?.send?.({ message: 'Хмм… Кажется, временная ошибка. Давай ещё раз — нажми «Запустить бота заново»', keyboard: Keyboard.builder().textButton({ label: 'Запустить бота заново', payload: { cmd: 'restart' }, color: Keyboard.SECONDARY_COLOR }) })); } catch {}
  }
});

// Приветствие сразу после того, как пользователь разрешил сообщения (message_allow)
vk.updates.on('message_allow', async (context) => {
  try {
    track('message_allow', { user_id: context.userId });
    await vk.api.messages.send({
      user_id: context.userId,
      random_id: Date.now(),
      message: startText(),
      keyboard: keyboards.start().inline(false)
    });
  } catch (err) {
    log.warn({ err }, 'Failed to send message_allow welcome');
  }
});

async function main() {
  log.info('Starting VK bot with Long Poll...');
  await vk.updates.start();
  log.info('VK bot is running.');

  // Healthcheck HTTP-сервер
  const app = express();
  app.get('/health', (_req, res) => res.status(200).json({ ok: true }));
  app.listen(config.port, () => log.info({ port: config.port }, 'Healthcheck listening'));
}

main().catch((err) => {
  log.error({ err }, 'Fatal error');
  process.exit(1);
});


