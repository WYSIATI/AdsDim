# AdsDim

**标记广告，从不隐藏帖子 · Dim the ads, let real posts shine — never hides posts.**

AdsDim 是一个开源的 MV3 Chrome 扩展，在 x.com 时间线上**标记**广告（硬广、软广、疑似），但**绝不隐藏或删除任何帖子**。你看到的信息流永远是完整的 —— AdsDim 只是让真实内容更亮眼、让广告安静下来。

AdsDim is an open-source MV3 Chrome extension that **marks** ads on the x.com timeline — hard ads, soft ads, and possible ads — while **never hiding or deleting a single post**. Your feed stays complete; genuine posts just shine brighter while ads quiet down.

## 特性 · Features

- 🏷️ **只标记，不隐藏** — 每条帖子都还在，广告只是被打上 `硬广 / 软广 / 疑似` 徽章并淡出。
  **Mark, never hide** — every post stays; ads get a `Ad / Sponsored / Possible` pill and recede visually.
- 🔍 **本地检测** — 官方推广标识（多语言:Ad / Promoted / 广告 / 推广 / プロモーション / Anzeige / Publicidad / Publicité…)+ 软广启发式(#ad、优惠码、返利链接、加微信……)。
  **Local detection** — X's promoted badge (localized) plus soft-ad heuristics (#ad, discount codes, affiliate links, contact-to-buy patterns).
- 🎨 **三种视觉方案 × 两档对比度** — 默认 **玻璃聚焦 Glass + 强烈 Strong**:
  **Three schemes × two contrast levels** — default **Glass + Strong**:
  - **玻璃聚焦 Glass Focus** — 真实内容浮起为磨砂玻璃卡片，广告降饱和退入背景。Genuine posts float as frosted-glass cards while ads recede, desaturated.
  - **光晕通道 Glow Lane** — 真实内容获得渐变光环与左侧光晕，广告转为灰调。Genuine posts earn a gradient ring and left glow; ads fade toward gray.
  - **剧场模式 Theater** — 广告如剧场熄灯般变暗，真实内容保持全亮。Ads dim like house lights going down; genuine posts stay at full brightness.
- 🖱️ **悬停即恢复** — 鼠标移到被弱化的广告上,立即恢复完全可见(纯 CSS)。
  **Hover to reveal** — hovering any dimmed ad restores full visibility (CSS only).
- 🌗 **自动深浅色主题**、零布局位移、兼容 X 虚拟滚动。
  **Auto dark/light theme**, zero layout shift, virtualized-timeline safe.

## 隐私 · Privacy

**默认零网络请求。** 所有检测都在你的浏览器本地完成;不采集、不上传、不追踪任何数据。设置仅存储在浏览器的扩展同步存储中。

**Zero network calls by default.** All detection runs locally in your browser; nothing is collected, uploaded, or tracked. Settings live only in the browser's extension sync storage.

## 开发 · Development

```bash
npm install
npm run dev        # launch with WXT (Chrome)
npm run build      # production build
npm test           # unit + integration tests (Vitest)
npm run lint       # ESLint
npm run compile    # TypeScript typecheck
```

设计稿见 `design/`(`preview-v2-inverted.html` 是渲染器的 CSS 来源)。
Design mockups live in `design/` (`preview-v2-inverted.html` is the CSS source of truth for the renderer).

## License

[Apache-2.0](./LICENSE) © 2026 Chester Lee
