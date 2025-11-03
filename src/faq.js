export const faq = {
  benefits: {
    text: 'Ты получишь: 1) наставника и поддержку, 2) практику на реальных задачах, 3) сообщество и нетворкинг, 4) быстрый рост благодаря обратной связи. Хочешь попробовать?',
    options: ['to_chat', 'mentor', 'other_q']
  },
  who: {
    text: 'Мы берём мотивированных новичков и тех, кто уже пробует себя. Главное — желание и готовность действовать. Подойдёшь?',
    options: ['to_chat', 'other_q']
  },
  how: {
    text: 'Шаги: 1) зайди в беседу, 2) выбери наставника, 3) получи стартовые материалы. Готов перейти?',
    options: ['to_chat', 'mentor']
  },
  time: {
    text: 'Набор открыт сейчас, группы формируются по мере готовности кандидатов. Лучше зайти в беседу сегодня — места у наставников ограничены.',
    options: ['to_chat', 'other_q']
  }
};

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


