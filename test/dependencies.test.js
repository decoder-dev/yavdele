import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Keyboard } from 'vk-io';
import * as Sentry from '@sentry/node';
import { keyboards } from '../src/keyboards.js';
import { getFaqEntry } from '../src/faq_loader.js';
import { buildFaqFollowupKeyboard } from '../src/faq.js';
import { monitoringOptions } from '../src/monitoring.js';

test('VK buttons and YAML FAQ still produce valid message keyboards', () => {
  const start = JSON.parse(keyboards.start().toString());
  assert.equal(JSON.parse(start.buttons[0][0].action.payload).cmd, 'start_yes');
  const faq = getFaqEntry('benefits');
  assert.ok(faq.text.length > 0);
  const followup = JSON.parse(buildFaqFollowupKeyboard({ Keyboard }, 'https://vk.com/im?sel=c1', ['to_chat', 'other_q']).toString());
  assert.equal(followup.buttons[0][0].action.link, 'https://vk.com/im?sel=c1');
  for (const make of Object.values(keyboards)) {
    const keyboard = JSON.parse(make('https://vk.com/im?sel=c1').toString());
    assert.ok(keyboard.buttons.length > 0);
  }
});

test('Sentry captures errors through an in-memory transport with the privacy baseline', async () => {
  const envelopes = [];
  const options = monitoringOptions('https://public@example.invalid/1');
  assert.equal(options.dataCollection.userInfo, false);
  assert.equal(options.dataCollection.cookies, false);
  assert.deepEqual(options.dataCollection.httpBodies, []);
  Sentry.init({ ...options, defaultIntegrations: false,
    transport: () => ({ send: async (envelope) => { envelopes.push(envelope); return { statusCode: 200 }; }, flush: async () => true }),
  });
  Sentry.captureException(new Error('dependency regression fixture'));
  await Sentry.flush(2000);
  assert.equal(envelopes.length, 1);
  assert.equal(envelopes[0][1][0][1].exception.values[0].value, 'dependency regression fixture');
  await Sentry.close();
});
