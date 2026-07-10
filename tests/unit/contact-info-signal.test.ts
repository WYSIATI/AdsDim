import { describe, expect, it } from 'vitest';
import { contactInfoSignal } from '../../src/detector/heuristics/contact-info-signal';

describe('contactInfoSignal', () => {
  it.each([
    ['wechat zh', '想要的姐妹加微信详聊', 0.6],
    ['wechat en', 'add me on WeChat for details', 0.6],
    ['vx contact', '需要的加vx: abc123', 0.6],
    ['dm me', 'DM me for the price list', 0.6],
    ['zh dm', '感兴趣请私信', 0.6],
    ['whatsapp', 'WhatsApp us to order', 0.6],
    ['two patterns saturate', '加微信或私信我', 1],
    ['plain post', 'what a lovely sunset', 0],
  ])('%s -> score %d', (_description, text, expectedScore) => {
    expect(contactInfoSignal(text).score).toBeCloseTo(expectedScore, 5);
  });

  it('does not match dm inside words', () => {
    expect(contactInfoSignal('the admin dashboard was updated').score).toBe(0);
  });

  it('reports matches', () => {
    const result = contactInfoSignal('加微信聊');
    expect(result.id).toBe('contact-info');
    expect(result.matches).toEqual(['微信']);
  });
});
