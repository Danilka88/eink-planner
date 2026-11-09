# Ritual — 电子墨水屏习惯计划器

面向 6 英寸电子墨水屏平板的单页本地应用。大号图块无需滚动，一次点按完成，
逾期项保持可见直到关闭。无需联网、无需账号、无分析统计：数据保存在设备的
浏览器里。

**在线演示：** https://danilka88.github.io/eink-planner/

![面板](design/screens/eink-536-day.png)

## 功能

- **每日面板。** 1–4 列，图块铺满屏幕，1–2 米外可读。
- **习惯在时间窗口内。** `06:30` 出现，`09:30` 后变成「已逾期 · 截止 09:30」
  并保留到标记为止（可关闭此行为）。
- **一次点按** 即完成：图块反色，5–60 分钟后消失。
- **重复：** 每天、按星期、每月某日、单次日期。
- **历史与归档。** 按天记录所有标记，可撤销与恢复；关闭的习惯保留历史。
- **复制** 习惯只需一次点按。
- **逾期** 可回溯到前几天的记录，并补记完成。
- **8 种语言**，浅色/深色/自动主题，JSON 导出与导入。
- **离线：** service worker、PWA 清单、零网络请求。

## 快速开始

```bash
git clone https://github.com/Danilka88/eink-planner.git
cd eink-planner
python3 -m http.server 8080
```

打开 `http://127.0.0.1:8080`。

> 双击打开 `index.html` 不可用：应用使用 ES 模块，浏览器在 `file://` 下会阻止。

### 安装到平板

1. 通过 **https**（或 `localhost`）打开站点——离线缓存只在其中可用。
2. 浏览器菜单 →「添加到主屏幕」。
3. 打开飞行模式再点图标：无需网络即可使用。

普通 `http://192.168.x.x` 没有离线模式——这是浏览器限制，不是应用缺陷。
设置 → 关于 会显示当前状态。

## 操作

| 操作 | 作用 |
|---|---|
| 点按图块 | 标记 / 取消标记 |
| 长按 | 打开习惯编辑器 |
| 长按逾期图块 | 记录跳过 |
| 「全部」→「习惯」 | 开关、复制、编辑、添加 |
| 「全部」→「历史」 | 按天：取消、标记、跳过、恢复 |
| 「全部」→「归档」 | 恢复习惯或彻底删除 |
| 「刷新」 | 整屏闪烁（清理残影） |
| 「设置」 | 主题、语言、时间格式、计时、演示、导入导出 |

## 结构

```
index.html            标记、SEO、模板、CSP
styles.css            1 位主题、网格、e-ink 规则
js/app.js             DOM、事件、渲染、编辑器、设置
js/core/schedule.js   时间窗口、重复、逾期（纯函数）
js/core/state.js      模型、迁移、localStorage
js/core/i18n.js       8 种语言、Intl 复数、日期、12/24 小时
js/core/dict/*.js     界面词典
js/core/icons.js      Phosphor Bold 图标精灵
sw.js                 离线缓存
tests/                单元测试（node --test）
docs/                 架构、数据模型、i18n、部署
```

## 测试

```bash
npm test
```

22 个测试：时间窗口、迁移、8 种语言的复数、时间格式。见 `docs/TESTING.md`。

## 隐私

没有任何网络请求：CSP 中的 `connect-src 'self'` 在浏览器层面阻止，应用本身
也不发起。数据保存在 `localStorage`，不离开设备。见 `PRIVACY.md`。

## 许可

代码 — MIT（`LICENSE`）。图标 — Phosphor Icons，MIT（`THIRD-PARTY.md`）。

## 其他语言

[Русский](README.md) · [English](README.en.md) · [Español](README.es.md) ·
[Português](README.pt.md) · [Français](README.fr.md) · [हिन्दी](README.hi.md) ·
[العربية](README.ar.md)
