// FAQ теперь грузится из YAML через faq_loader
import { getFaqEntry } from './faq_loader.js';

// Генерация клавиатуры продолжения для конкретного ответа FAQ
export function buildFaqFollowupKeyboard({ Keyboard }, chatInviteUrl, options) {
  const kb = Keyboard.builder();
  for (const opt of options) {
    if (opt === 'to_chat') {
      kb.linkButton({ label: 'Перейти в беседу', url: chatInviteUrl, payload: { cmd: 'to_chat' } });
    } else if (opt === 'mentor') {
      kb.linkButton({ label: 'Связаться с наставником', url: chatInviteUrl, payload: { cmd: 'mentor' } });
    } else if (opt === 'other_q') {
      kb.textButton({ label: 'Другой вопрос', payload: { cmd: 'other_q' }, color: Keyboard.SECONDARY_COLOR });
    }
  }
  kb.row().textButton({ label: 'Запустить бота заново', payload: { cmd: 'restart' }, color: Keyboard.SECONDARY_COLOR });
  return kb.oneTime(false);
}



