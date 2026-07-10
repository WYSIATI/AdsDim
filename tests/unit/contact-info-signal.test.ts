import { describe, expect, it } from 'vitest';
import { contactInfoSignal } from '../../src/detector/heuristics/contact-info-signal';

describe('contactInfoSignal', () => {
  it.each([
    // Handle-format wechat contacts always count.
    ['vx handle', '需要的加vx: abc123', 0.6],
    ['wechat handle zh colon', '微信：glow_beauty88', 0.6],
    ['wechat handle en', 'WeChat: shopgirl2024', 0.6],
    // Bare wechat mentions need commerce co-occurrence.
    ['casual wechat mention', '想要的姐妹加微信详聊', 0],
    ['casual wechat chat', '刚跟朋友吃饭，他微信上说这家店不错', 0],
    ['wechat mention with commerce', '这款面霜好用，想买的加微信下单', 0.6],
    ['wechat en without commerce', 'add me on WeChat for details', 0],
    // DM mentions need commerce co-occurrence.
    ['dm with price', 'DM me for the price list', 0.6],
    ['dm without commerce en', 'DM me for collab ideas', 0],
    ['zh dm without commerce', '私信我聊聊今天的比赛', 0],
    ['zh dm with commerce', '想拿货的私信我', 0.6],
    // Dedicated channels stay unconditional.
    ['whatsapp', 'WhatsApp us to order', 0.6],
    ['telegram', 'join our telegram for deals', 0.6],
    // Multiple matches saturate.
    ['handle + dm commerce saturate', '微信: shop8888，私信下单', 1],
    ['plain post', 'what a lovely sunset', 0],
  ])('%s -> score %d', (_description, text, expectedScore) => {
    expect(contactInfoSignal(text).score).toBeCloseTo(expectedScore, 5);
  });

  it('does not match dm inside words', () => {
    expect(contactInfoSignal('the admin dashboard shows the price').score).toBe(0);
  });

  it('does not match a bare v inside words as a handle', () => {
    expect(contactInfoSignal('tv: abcd1234 is my favourite show').score).toBe(0);
  });

  it('reports matches', () => {
    const result = contactInfoSignal('微信: glow88 下单');
    expect(result.id).toBe('contact-info');
    expect(result.matches).toEqual(['微信: glow88']);
  });
});
