import { describe, expect, it } from 'vitest';
import { containsKeyword, keywordSignal } from '../../src/detector/heuristics/keyword-signal';

describe('containsKeyword', () => {
  it.each([
    ['check out #ad today', '#ad', true],
    ['#advice for you', '#ad', false],
    ['this is sponsored content', 'sponsored', true],
    ['unsponsored review', 'sponsored', false],
    ['#sponsored collab', 'sponsored', false],
    ['#sponsored collab', '#sponsored', true],
    ['我的优惠码在这里', '优惠码', true],
    ['USE CODE now', 'use code', true],
  ])('%j contains %j -> %s', (haystack, keyword, expected) => {
    expect(containsKeyword(haystack.toLowerCase(), keyword)).toBe(expected);
  });
});

describe('keywordSignal', () => {
  it.each([
    // [description, text, expectedScore]
    ['no keywords', 'just a normal post about cats', 0],
    ['single strong keyword', 'honest review #ad', 0.8],
    ['single weak keyword', 'full review, link in bio', 0.4],
    ['strong + weak', '#ad gifted by the brand', 1],
    ['two strong keywords capped at 1', '#ad #sponsored', 1],
    ['zh strong keyword', '用我的优惠码 STYLE2024', 0.8],
    ['zh hashtag disclosure', '#广告 新品上市', 0.8],
    ['weak zh collab tag', '#合作 内容', 0.4],
    ['plain 广告 mention is not a keyword', '新广告法实施了', 0],
    [
      'bare sponsored is only a weak hint',
      'The conference was sponsored by Acme, great talks',
      0.4,
    ],
    ['hashtag sponsored is strong, not double counted', 'great collab #sponsored', 0.8],
    ['paid partnership disclosure is strong', 'Paid partnership with Acme Skincare', 0.8],
    ['casual wechat mention is not a keyword', '刚跟朋友吃饭，他微信上说这家店不错', 0],
  ])('%s -> score %d', (_description, text, expectedScore) => {
    expect(keywordSignal(text).score).toBeCloseTo(expectedScore, 5);
  });

  it.each([
    // [description, text, expectedScore] — 2026-07 weak-keyword expansion.
    ['link in comments', 'full breakdown, link in comments', 0.4],
    ['link below', 'grab the guide, link below', 0.4],
    ['check my pinned', 'check my pinned for details', 0.4],
    ['sale ends', 'sale ends tonight at midnight', 0.4],
    ['limited stock', 'limited stock available, be quick', 0.4],
    ['last chance', 'last chance to save on the bundle', 0.4],
    ['lifetime deal', 'lifetime deal on the app right now', 0.4],
    ['enroll now', 'enroll now to lock in the rate', 0.4],
    ['free webinar', 'free webinar this thursday', 0.4],
    ['seats limited', 'register early, seats limited', 0.4],
    ['my course', 'my course launches monday', 0.4],
    ['presale', 'presale opens tomorrow at noon', 0.4],
    ['airdrop', 'airdrop season is coming back', 0.4],
    ['zh sign-up', '报名通道已开启', 0.4],
    ['zh bootcamp', '训练营第三期开始招生', 0.4],
    ['zh paid circle', '知识星球今天更新了', 0.4],
    ['zh fomo tagline', '手慢无！最后几件', 0.4],
    ['join my telegram', 'join my telegram for alpha', 0.4],
    ['join my discord', 'join my discord for the drop', 0.4],
    // Round-2 vocabulary packs: scam-adjacent zh, diet, adult, app, betting.
    ['zh work-from-home money', '在家赚钱的方法分享给大家', 0.4],
    ['zh essay ghostwriting', '专业代写论文，质量保证', 0.4],
    ['zh exam proxy', '代考服务，包过', 0.4],
    ['zh document forging', '代办证件，当天可取', 0.4],
    ['zh low-interest loan', '低息贷款，无需抵押', 0.4],
    ['zh instant loan payout', '快速下款，当天到账', 0.4],
    ['zh order brushing', '刷单兼职了解一下', 0.4],
    ['lose weight fast', 'lose weight fast with this one trick', 0.4],
    ['fat burner', 'this fat burner actually works', 0.4],
    ['zh three-day results', '三天见效，不满意退款', 0.4],
    ['zh slimming', '产后瘦身经验分享', 0.4],
    ['check my of', 'new drop tonight, check my of', 0.4],
    ['download now', 'download now and get 100 coins', 0.4],
    ['sure odds', 'sure odds daily, never lose', 0.4],
    ['fixed matches', 'fixed matches available this weekend', 0.4],
    // False-positive guards for the round-2 packs.
    ['check my office is not check my of', 'check my office hours on the door', 0],
    ['downloads now is not download now', 'downloads now exceed a billion', 0],
    ['sure to shift is not sure odds', 'the odds are sure to shift after this', 0],
    ['gym check-in has no slimming keyword', '今天去健身房打卡了', 0],
    // False-positive guards for the expansion.
    ['coursework is not my course', 'my coursework is due friday', 0],
    ['airdropped supplies are not airdrop', 'the airdropped supplies finally landed', 0],
    ['presales figures are not presale', 'presales are up this quarter', 0],
    ['wholesale ends is not sale ends', 'buying wholesale ends up cheaper', 0],
    ['linked below is not link below', 'the study is linked below the fold', 0],
    ['last chances is not last chance', 'his last chances are slim', 0],
  ])('%s -> score %d', (_description, text, expectedScore) => {
    expect(keywordSignal(text).score).toBeCloseTo(expectedScore, 5);
  });

  it('reports which keywords matched', () => {
    const result = keywordSignal('review time #ad, item was gifted');
    expect(result.id).toBe('keyword');
    expect(result.matches).toContain('#ad');
    expect(result.matches).toContain('gifted');
  });

  it.each([
    ['#ad here we go', true],
    ['#sponsored collab', true],
    ['#广告 新品', true],
    ['#推广 内容', true],
    ['paid partnership with acme', true],
    ['use code SAVE20', false],
    ['用我的优惠码下单', false],
    ['just a normal post', false],
  ])('%j disclosure -> %s', (text, expected) => {
    expect(keywordSignal(text).disclosure).toBe(expected);
  });

  it('honours user-defined extra keywords as strong signals', () => {
    const result = keywordSignal('限时团购开始啦', ['团购']);
    expect(result.score).toBeCloseTo(0.8, 5);
    expect(result.matches).toContain('团购');
  });

  it('ignores empty extra keywords', () => {
    expect(keywordSignal('anything', ['', '  ']).score).toBe(0);
  });
});
