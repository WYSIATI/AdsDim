import { describe, expect, it } from 'vitest';
import { classifyContent } from '../../src/detector/classify-content';

const DEFAULT_OPTIONS = { sensitivity: 0.5, keywords: [] as readonly string[] };

const verdict = (text: string, urls: readonly string[] = []) =>
  classifyContent({ text, urls }, DEFAULT_OPTIONS);

describe('classifyContent false-positive regressions', () => {
  it.each([
    // [description, text, urls]
    ['asking for a promo code', '有人有优惠码吗？求一个', []],
    ['discussing a sponsored event', 'The conference was sponsored by Acme, great talks', []],
    ['casual wechat mention', '刚跟朋友吃饭，他微信上说这家店不错', []],
    ['dm about sports', '私信我聊聊今天的比赛', []],
    ['single strong-domain url alone', 'check this out', ['amzn.to/3xYz']],
    ['single affiliate-param url alone', 'interesting read', ['https://a.example/?tag=x-20']],
    ['single weak url alone', 'my links', ['linktr.ee/someone']],
    ['plain organic post', 'what a lovely sunset over the bay', []],
  ] as const)('%s -> organic', (_description, text, urls) => {
    expect(verdict(text, urls).tier).toBeNull();
  });
});

describe('classifyContent true positives still fire', () => {
  it.each([
    // [description, text, urls, expectedTier]
    ['disclosure + discount code', '#ad New skincare routine! use code SAVE20', [], 'soft'],
    ['zh soft ad with contact', '面霜真的好用，优惠码 GLOW20,私信我拿货', [], 'soft'],
    ['disclosure-only post (single-category exception)', '#ad great product', [], 'potential'],
    [
      'promo keyword + affiliate url',
      '用我的优惠码 STYLE2024 可以打八折',
      ['amzn.to/3xYz?tag=stylekol-20'],
      'soft',
    ],
    [
      'weak keyword + weak url corroborate',
      'Full review — link in bio',
      ['linktr.ee/me'],
      'potential',
    ],
  ] as const)('%s -> %s', (_description, text, urls, expectedTier) => {
    expect(verdict(text, urls).tier).toBe(expectedTier);
  });

  it('exposes only fired signals with their matches', () => {
    const result = verdict('#ad great product', ['amzn.to/3xYz']);
    expect(result.signals.map((signal) => signal.id)).toEqual(['keyword', 'url']);
    expect(result.signals[0]?.matches).toContain('#ad');
    expect(result.signals[1]?.matches).toContain('amzn.to/3xYz');
  });

  it('reports the raw score even when uncorroborated', () => {
    const single = verdict('有人有优惠码吗？求一个');
    expect(single.tier).toBeNull();
    expect(single.score).toBeGreaterThan(0);
  });

  it('honours user keywords and sensitivity', () => {
    const result = classifyContent(
      { text: '限时团购，私信下单', urls: [] },
      { sensitivity: 0.5, keywords: ['团购'] },
    );
    expect(result.tier).not.toBeNull();
  });
});

describe('live x.com search false-negative regressions (2026-07)', () => {
  it('marks a promo code with a digit interlude (优惠码5折:CODE)', () => {
    const v = verdict(
      'CTExcel UK英国电信中英套餐，套餐5折，结算付款的时候填这个优惠码5折：DEAL50OFF 在现有优惠再5折',
    );
    expect(v.tier).toBe('soft');
  });

  it('marks an invite-code referral post (邀请码 TRUSTBNB)', () => {
    const v = verdict('币安老用户回归福利来啦 现在绑定邀请码 TRUSTBNB ，即可享受手续费返佣');
    expect(v.tier).toBe('soft');
  });

  it('marks a promo post whose second signal is a register?code= link', () => {
    const v = verdict('性价比高的机场，奈云重生回归，6折优惠码，有需要的尽快使用哦～', [
      'https://dash.naiun.io/#/register?code=xyz123',
    ]);
    expect(v.tier).toBe('soft');
  });

  it('still ignores a question about promo codes (single category)', () => {
    expect(verdict('有人有优惠码吗？求一个，最好能叠加').tier).toBe(null);
  });
});

describe('English soft-ad coverage (2026-07 tuning)', () => {
  it('marks a concrete code offer without other signals (disclosure-grade)', () => {
    expect(verdict('Obsessed with this serum ✨ 20% off with code GLOW20').tier).toBe('potential');
  });

  it('marks an LTK affiliate link on its own (disclosure-grade domain)', () => {
    expect(verdict('Fall outfit details ⬇️', ['https://liketk.it/4aBcD']).tier).toBe('potential');
  });

  it('marks keyword + code corroboration as soft', () => {
    expect(verdict('#ad my honest review — use code SAVE20 at checkout').tier).toBe('soft');
  });

  it('ignores technical error codes', () => {
    expect(verdict('MongoDB keeps throwing error code E11000 duplicate key').tier).toBe(null);
  });

  it('ignores reported sales news (phrase without token, single category)', () => {
    expect(verdict('The whole store is 20% off this weekend apparently').tier).toBe(null);
  });

  it('still ignores discussing sponsorship (weak keywords, single category)', () => {
    expect(verdict('The stadium is sponsored by a bank, shop now has new merch too').tier).toBe(
      null,
    );
  });
});

describe('giveaway promotion detection (2026-07)', () => {
  it('marks a giveaway with entry mechanics', () => {
    const v = verdict(
      '🚀 $SPCX x YUBIT $300 Giveaway 🛰 6 winners · $50 Futures Position Coupon each 💰 To enter 👇 Follow @YUBIT_Exchange Repost',
    );
    expect(v.tier).toBe('soft');
  });

  it('marks a Chinese repost-to-win giveaway', () => {
    expect(verdict('转发+关注,抽奖送新款耳机一台!').tier).toBe('potential');
  });

  it('ignores merely mentioning a giveaway (no mechanics)', () => {
    expect(
      verdict('Thinking about doing a giveaway next month, what should the prize be?').tier,
    ).toBe(null);
  });
});

describe('weak-keyword expansion (2026-07)', () => {
  it('needs corroboration: course-launch stack + code phrase -> soft', () => {
    expect(verdict('Enroll now — my course is 20% off, link below').tier).toBe('soft');
  });

  it('needs corroboration: urgency keywords + bio-link url -> potential', () => {
    expect(verdict('Last chance! sale ends tonight', ['https://linktr.ee/shop']).tier).toBe(
      'potential',
    );
  });

  it.each([
    ['course mention alone', 'My course on woodworking got featured in the paper'],
    ['webinar chatter alone', 'Free webinar on tax law next week, seats limited'],
    ['telegram invite alone', 'join my telegram for alpha'],
    [
      'apple airdrop stays organic with airdrop as weak keyword',
      'sent it via AirDrop, check your phone',
    ],
  ] as const)('%s -> organic (uncorroborated or under threshold)', (_description, text) => {
    expect(verdict(text).tier).toBeNull();
  });
});

describe('crypto promo mechanics detection (2026-07)', () => {
  it.each([
    ['airdrop claim mechanics', 'Connect wallet to claim the $ZETA airdrop', 'potential'],
    ['token presale + join', '$PEPE2 presale is live, join now', 'potential'],
    ['engagement-bait entry stack', 'RT to win! Tag 3 friends and follow @us', 'potential'],
    ['zh usdt otc + wechat handle', '长期收U，微信: usdt888', 'potential'],
    ['zh gambling platform promo', '博彩平台注册即送彩金', 'potential'],
    [
      'trade signals + code corroboration',
      'Copy my trades — join my VIP, use code ALPHA20',
      'soft',
    ],
  ] as const)('%s -> %s', (_description, text, expectedTier) => {
    expect(verdict(text).tier).toBe(expectedTier);
  });

  it.each([
    ['apple airdrop transfer', 'sent it via AirDrop, check your phone'],
    ['apple airdrop bug report', 'AirDrop not working since the iOS update'],
    ['concert presale', 'presale tickets for the concert go on sale Friday'],
    ['spinach dinner', '晚饭炒了个菠菜，很下饭'],
    ['usb drive sale', '低价出U盘一个，九成新'],
  ] as const)('%s -> organic', (_description, text) => {
    expect(verdict(text).tier).toBeNull();
  });
});
