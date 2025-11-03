import { Keyboard } from 'vk-io';

// Клавиатуры (кнопки) для разных этапов диалога
export const keyboards = {
  start() {
    return Keyboard.builder()
      .textButton({ label: 'Интересует / Продолжить', payload: { cmd: 'start_yes' }, color: Keyboard.POSITIVE_COLOR })
      .textButton({ label: 'Не интересует / Прекратить', payload: { cmd: 'start_no' }, color: Keyboard.NEGATIVE_COLOR })
      .row()
      .textButton({ label: 'Другой вопрос', payload: { cmd: 'other_q' }, color: Keyboard.PRIMARY_COLOR })
      .oneTime(false);
  },

  interestedMenu(chatInviteUrl) {
    return Keyboard.builder()
      .textButton({ label: 'Задать вопрос боту', payload: { cmd: 'faq' }, color: Keyboard.PRIMARY_COLOR })
      .linkButton({ label: 'Перейти в беседу кандидатов', url: chatInviteUrl, payload: { cmd: 'to_chat' } })
      .row()
      .textButton({ label: 'Другой вопрос', payload: { cmd: 'other_q' }, color: Keyboard.SECONDARY_COLOR })
      .oneTime(false);
  },

  notInterestedMenu(chatInviteUrl) {
    return Keyboard.builder()
      .textButton({ label: 'Ответы на вопросы', payload: { cmd: 'faq' }, color: Keyboard.PRIMARY_COLOR })
      .linkButton({ label: 'Связать с наставником', url: chatInviteUrl, payload: { cmd: 'mentor' } })
      .row()
      .textButton({ label: 'Прекратить', payload: { cmd: 'stop' }, color: Keyboard.NEGATIVE_COLOR })
      .oneTime(false);
  },

  faqCategories() {
    return Keyboard.builder()
      .textButton({ label: 'Что я получу?', payload: { cmd: 'faq_benefits' }, color: Keyboard.PRIMARY_COLOR })
      .textButton({ label: 'Кого берём?', payload: { cmd: 'faq_who' }, color: Keyboard.PRIMARY_COLOR })
      .row()
      .textButton({ label: 'Как записаться?', payload: { cmd: 'faq_how' }, color: Keyboard.PRIMARY_COLOR })
      .textButton({ label: 'Сроки и поток', payload: { cmd: 'faq_time' }, color: Keyboard.PRIMARY_COLOR })
      .row()
      .textButton({ label: 'Другое (нет в списке)', payload: { cmd: 'faq_other' }, color: Keyboard.SECONDARY_COLOR })
      .row()
      .textButton({ label: 'Запустить бота заново', payload: { cmd: 'restart' }, color: Keyboard.SECONDARY_COLOR })
      .oneTime(false);
  },

  toChat(chatInviteUrl) {
    return Keyboard.builder()
      .linkButton({ label: 'Перейти в беседу кандидатов', url: chatInviteUrl, payload: { cmd: 'to_chat' } })
      .row()
      .textButton({ label: 'Запустить бота заново', payload: { cmd: 'restart' }, color: Keyboard.SECONDARY_COLOR })
      .oneTime(false);
  }
};



