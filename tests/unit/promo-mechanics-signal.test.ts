import { describe, expect, it } from 'vitest';
import { promoMechanicsSignal } from '../../src/detector/heuristics/promo-mechanics-signal';

describe('promoMechanicsSignal giveaway mechanics', () => {
  it.each([
    ['en giveaway with entry steps', '$300 Giveaway! To enter: Follow @brand and Repost', 1],
    ['en giveaway with winners', 'Big giveaway — 3 winners picked Friday', 1],
    ['zh repost-follow draw', '转发+关注,抽奖送新款耳机一台!', 1],
    ['zh draw then participate', '抽奖啦，参与方式见评论', 1],
  ])('%s -> %d', (_description, text, expected) => {
    expect(promoMechanicsSignal(text).score).toBe(expected);
  });

  it.each([
    [
      'musing about a giveaway',
      'Thinking about doing a giveaway next month, what should the prize be?',
    ],
    ['plain post', 'lovely sunset over the bay tonight'],
    ['zh draw mention without mechanics', '上次抽奖的奖品今天到了'],
  ])('%s -> 0', (_description, text) => {
    const result = promoMechanicsSignal(text);
    expect(result.score).toBe(0);
    expect(result.matches).toEqual([]);
  });

  it('is disclosure-grade when it fires', () => {
    const result = promoMechanicsSignal('Giveaway time! RT and follow @us — 2 winners');
    expect(result.id).toBe('promo-mechanics');
    expect(result.disclosure).toBe(true);
  });

  it('carries no disclosure flag when silent', () => {
    expect(promoMechanicsSignal('nothing to see here').disclosure).toBe(false);
  });
});

describe('promoMechanicsSignal crypto airdrop mechanics', () => {
  it.each([
    ['airdrop + claim', '$ZETA airdrop is live — claim yours now', 1],
    ['airdrop + connect wallet', 'Huge airdrop! Connect wallet to check in', 1],
    ['eligibility before airdrop', 'You may be eligible for the $LUNC airdrop', 1],
    ['airdrop + snapshot', 'Airdrop confirmed, snapshot taken at block 1900', 1],
    ['airdrop + holders', 'airdrop for all early holders', 1],
    ['airdrop + drop your wallet', 'Airdrop weekend! Drop your wallet below', 1],
  ])('%s -> %d', (_description, text, expected) => {
    expect(promoMechanicsSignal(text).score).toBe(expected);
  });

  it.each([
    ['apple airdrop transfer', 'sent it via AirDrop, check your phone'],
    ['apple airdrop bug report', 'AirDrop not working since the update'],
    ['apple airdrop bug + photo snapshot', 'AirDrop not working, my snapshot never arrives'],
    ['bare airdrop mention', 'the airdrop meta feels dead this cycle'],
  ])('%s -> 0', (_description, text) => {
    expect(promoMechanicsSignal(text).score).toBe(0);
  });
});

describe('promoMechanicsSignal token-launch mechanics', () => {
  it.each([
    ['presale + cashtag', '$MOON presale is filling fast', [], 1],
    ['whitelist spots + join', 'Whitelist spots open — join the Discord now', [], 1],
    ['mint live + url', 'Mint is now live!', ['https://mint.example.io'], 1],
    ['stealth launch + join', 'Stealth launch tonight, join fast', [], 1],
    ['presale + inline url', 'presale open https://buy.example.io', [], 1],
  ])('%s -> %d', (_description, text, urls, expected) => {
    expect(promoMechanicsSignal(text, urls as readonly string[]).score).toBe(expected);
  });

  it.each([
    ['concert presale guard', 'presale tickets for the concert go live Friday, join the queue'],
    ['presale without companion', 'the presale sold out in minutes apparently'],
    ['mint live without companion', 'Mint is now live'],
    ['whitelist without spots', 'no whitelist here, open access for everyone'],
  ])('%s -> 0', (_description, text) => {
    expect(promoMechanicsSignal(text).score).toBe(0);
  });
});

describe('promoMechanicsSignal trade-signal solicitations', () => {
  it.each([
    ['join my signals', 'Join my signals channel for daily calls', 1],
    ['join my vip', 'join my VIP before the next pump', 1],
    ['copy my trades', 'Copy my trades and relax', 1],
    ['zh paid lead-trading', '专业带单，稳定盈利', 1],
    ['zh apprentice recruiting', '收徒，教你玩转合约', 1],
  ])('%s -> %d', (_description, text, expected) => {
    expect(promoMechanicsSignal(text).score).toBe(expected);
  });

  it.each([
    ['join my stream', 'join my stream tonight at 8'],
    ['trading journal', 'I log every trade in my journal for taxes'],
  ])('%s -> 0', (_description, text) => {
    expect(promoMechanicsSignal(text).score).toBe(0);
  });
});

describe('promoMechanicsSignal engagement-bait entry mechanics', () => {
  it.each([
    ['RT to win', 'RT to win a free PS5', 1],
    ['repost to win', 'Repost to win the merch bundle', 1],
    ['like & follow + prize', 'Like & follow for a chance at the prize', 1],
    ['comment to win', 'Comment your handle below to win', 1],
    ['first N people', 'First 50 people get the bonus', 1],
    ['tag N friends', 'Tag 3 friends to enter', 1],
    ['drop your wallet', 'Drop your wallet address 👇', 1],
  ])('%s -> %d', (_description, text, expected) => {
    expect(promoMechanicsSignal(text).score).toBe(expected);
  });

  it.each([
    ['rt without stakes', 'RT if you agree with this take'],
    ['like and follow the rules', 'like and follow the rules of the venue please'],
    ['comment + winter word', 'comment if you want tips to winterize your car'],
    ['first few people', 'the first few people arrived early'],
    ['tag friends without count', 'tag your friends in the photo'],
    ['dropped my wallet', 'I dropped my wallet somewhere near the park'],
  ])('%s -> 0', (_description, text) => {
    expect(promoMechanicsSignal(text).score).toBe(0);
  });
});

describe('promoMechanicsSignal Chinese crypto and gambling mechanics', () => {
  it.each([
    ['zh airdrop claim', '空投来了，完成任务即可领取', 1],
    ['zh airdrop wallet', '空投预告：提交钱包地址', 1],
    ['zh airdrop eligibility', '空投查询资格已开放', 1],
    ['zh like-follow-draw', '点赞+关注，抽10位送周边', 1],
    ['zh comment-section draw', '评论区随机抽3人', 1],
    ['zh buying usdt', '长期收U，量大价优', 1],
    ['zh selling usdt', '出U，支持支付宝', 1],
    ['zh gambling platform promo', '博彩平台注册即送彩金', 1],
    ['zh gambling slang promo', '菠菜首存优惠，上分快', 1],
    ['casino bonus', 'this casino has the best welcome bonus', 1],
    ['casino code', 'casino promo code inside, do not miss it', 1],
  ])('%s -> %d', (_description, text, expected) => {
    expect(promoMechanicsSignal(text).score).toBe(expected);
  });

  it.each([
    ['relief airdrop news', '直升机空投救援物资到灾区'],
    ['zh like-follow without draw', '点赞关注走一波，谢谢大家'],
    ['zh comment section chat', '评论区讨论一下这场比赛'],
    ['usb drive sale', '低价出U盘一个，九成新'],
    ['spinach dinner', '晚饭炒了个菠菜，很下饭'],
    ['gambling industry news', '澳门博彩业收入创新高'],
    ['casino movie scene', 'the casino scene in that movie was great'],
  ])('%s -> 0', (_description, text) => {
    expect(promoMechanicsSignal(text).score).toBe(0);
  });
});
