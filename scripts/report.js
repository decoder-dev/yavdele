import { aggregateStats } from './report-lib.js';

const period = process.argv[2] || 'day';
const stats = aggregateStats({ period });

console.log(`Период: ${period}`);
console.log(`Старт показан: ${stats.show_start}`);
console.log(`Нажали «интересует»: ${stats.start_yes}`);
console.log(`Переход в беседу: ${stats.to_chat}`);
console.log(`Конверсия Start→Yes: ${stats.conv_start_yes}%`);
console.log(`Конверсия Yes→Chat: ${stats.conv_yes_chat}%`);


