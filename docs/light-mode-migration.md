# Vision TV 亮色模式适配方案

> 当前网站为 OVA.ai 暗色霓虹风格（默认），本文档规划如何为亮色模式设计一套协调的配色与样式，使主题切换时视觉体验一致且美观。

---

## 改造总览

当前所有组件的样式都是硬编码暗色（如 `bg-[#0d0d12]`、`text-gray-200`），亮色模式下没有对应的样式。需要：

1. 恢复 ThemeProvider 的亮暗切换能力
2. 为每个组件添加 `dark:` 前缀实现双主题
3. 亮色模式保持简约通透风格，暗色模式保持霓虹科技风

---

## 步骤 1：恢复主题切换能力

### 涉及文件

- `src/app/layout.tsx` — 移除强制 `dark` class

### 改什么

```tsx
// 当前
<html lang='zh-CN' className='dark' suppressHydrationWarning>

// 改为
<html lang='zh-CN' suppressHydrationWarning>
```

```tsx
// 当前
<body className={`${dmSans.className} min-h-screen bg-black text-gray-200`}>

// 改为
<body className={`${dmSans.className} min-h-screen bg-white text-gray-900 dark:bg-black dark:text-gray-200`}>
```

---

## 步骤 2：globals.css 双主题背景与滚动条

### 涉及文件

- `src/app/globals.css`

### 改什么

**body 背景**：亮色用柔和渐变，暗色保持当前暗色渐变

```css
/* 亮色背景 - 柔和蓝白渐变 */
html:not(.dark) body {
  background: linear-gradient(
    180deg,
    #f0f4ff 0%,
    #f5f0ff 30%,
    #fff8f0 60%,
    #f0f4ff 100%
  );
  background-attachment: fixed;
  --foreground-rgb: 17, 24, 39;
}

/* 暗色背景 - 保持当前 */
html.dark body {
  background: linear-gradient(
    180deg,
    #0d0d12 0%,
    #13131a 30%,
    #0f0f16 60%,
    #0a0a10 100%
  );
  background-attachment: fixed;
  --foreground-rgb: 229, 231, 235;
}
```

**环境光**：亮色用淡蓝紫，暗色用霓虹

```css
/* 亮色环境光 */
html:not(.dark) main::before {
  background: radial-gradient(
    ellipse,
    rgba(82, 99, 255, 0.04) 0%,
    transparent 70%
  );
}

/* 暗色环境光 - 保持当前 */
html.dark main::before {
  background: radial-gradient(
    ellipse,
    rgba(82, 99, 255, 0.08) 0%,
    transparent 70%
  );
}
```

**滚动条**：

```css
/* 亮色滚动条 */
html:not(.dark) ::-webkit-scrollbar-track {
  background: rgba(229, 231, 235, 0.5);
}
html:not(.dark) ::-webkit-scrollbar-thumb {
  background: rgba(82, 99, 255, 0.2);
}
html:not(.dark) ::-webkit-scrollbar-thumb:hover {
  background: rgba(82, 99, 255, 0.4);
}

/* 暗色滚动条 - 保持当前 */
html.dark ::-webkit-scrollbar-track {
  background: rgba(49, 49, 54, 0.5);
}
html.dark ::-webkit-scrollbar-thumb {
  background: rgba(82, 99, 255, 0.3);
}
html.dark ::-webkit-scrollbar-thumb:hover {
  background: rgba(82, 99, 255, 0.6);
}
```

---

## 步骤 3：tailwind.config.ts 亮色色板

### 涉及文件

- `tailwind.config.ts`

### 改什么

在 `colors` 中增加亮色 surface 变体：

```ts
surface: {
  DEFAULT: '#313136',
  dark: '#1a1a1f',
  light: '#3d3d44',
  // 新增亮色专用
  bright: '#f8f9fc',       // 亮色侧边栏/卡片背景
  muted: '#eef0f5',        // 亮色次级背景
},
```

---

## 步骤 4：侧边栏双主题适配

### 涉及文件

- `src/components/Sidebar.tsx`

### 改什么

**背景**：

```tsx
// 当前
className = '... bg-[#0d0d12]/90 ... border-r border-neon/20 ...';

// 改为
className =
  '... bg-white/80 dark:bg-[#0d0d12]/90 ... border-r border-gray-200/50 dark:border-neon/20 ...';
```

**霓虹发光线**：亮色模式隐藏或改为柔和分隔线

```tsx
// 当前
<div className="absolute top-0 right-0 w-[1px] h-full bg-gradient-to-b from-transparent via-neon/40 to-transparent" />

// 改为
<div className="absolute top-0 right-0 w-[1px] h-full bg-gradient-to-b from-transparent via-gray-200 to-transparent dark:from-transparent dark:via-neon/40 dark:to-transparent" />
```

**Logo 文字**：

```tsx
// 当前: text-neon
// 改为: text-neon dark:text-neon（亮色模式下 neon 蓝紫色在白底上也好看）
```

**导航项文字**：

```tsx
// 当前: text-gray-300
// 改为: text-gray-700 dark:text-gray-300
```

**导航项悬停**：

```tsx
// 当前: hover:bg-neon/10 hover:text-cyan
// 改为: hover:bg-neon/10 hover:text-neon dark:hover:text-cyan
```

**导航项活跃态**：

```tsx
// 当前: data-[active=true]:bg-neon/15 data-[active=true]:text-neon
// 改为: data-[active=true]:bg-neon/10 data-[active=true]:text-neon
//（亮暗模式通用，neon 色在白底上同样清晰）
```

**导航图标**：

```tsx
// 当前: text-gray-500 group-hover:text-cyan data-[active=true]:text-neon
// 改为: text-gray-400 group-hover:text-neon data-[active=true]:text-neon
```

**折叠按钮**：

```tsx
// 当前: text-gray-400 hover:text-cyan hover:bg-neon/10
// 改为: text-gray-400 hover:text-neon hover:bg-neon/10
```

---

## 步骤 5：MobileHeader 双主题

### 涉及文件

- `src/components/MobileHeader.tsx`

### 改什么

```tsx
// 当前
className = '... bg-[#0d0d12]/80 ... border-b border-neon/20';

// 改为
className =
  '... bg-white/80 dark:bg-[#0d0d12]/80 ... border-b border-gray-200/50 dark:border-neon/20';
```

Logo 文字保持 `text-neon`（亮暗通用）。

---

## 步骤 6：MobileBottomNav 双主题

### 涉及文件

- `src/components/MobileBottomNav.tsx`

### 改什么

```tsx
// 当前
className = '... bg-[#0d0d12]/80 ... border-t border-neon/20';

// 改为
className =
  '... bg-white/90 dark:bg-[#0d0d12]/80 ... border-t border-gray-200/50 dark:border-neon/20';
```

**图标颜色**：

```tsx
// 当前: active ? 'text-neon' : 'text-gray-500'
// 改为: active ? 'text-neon' : 'text-gray-400 dark:text-gray-500'
```

**文字颜色**：

```tsx
// 当前: active ? 'text-neon' : 'text-gray-400'
// 改为: active ? 'text-neon' : 'text-gray-500 dark:text-gray-400'
```

---

## 步骤 7：首页板块标题双主题

### 涉及文件

- `src/app/page.tsx`
- `src/components/ContinueWatching.tsx`

### 改什么

**板块标题 h2**：

```tsx
// 当前: text-gray-200
// 改为: text-gray-800 dark:text-gray-200
```

**"查看更多" 链接**：

```tsx
// 当前: text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200
// 改为: text-gray-400 hover:text-neon dark:text-gray-500 dark:hover:text-gray-200
```

**霓虹分割线**：亮色模式减弱强度

```tsx
// 当前: via-neon/60
// 改为: via-neon/30 dark:via-neon/60
```

---

## 步骤 8：海报卡片双主题

### 涉及文件

- `src/components/VideoCard.tsx`

### 改什么

**卡片外框 ring**：

```tsx
// 当前: ring-1 ring-white/5 group-hover:ring-neon/50
// 改为: ring-1 ring-gray-200/50 dark:ring-white/5 group-hover:ring-neon/40 dark:group-hover:ring-neon/50
```

**标题文字**：

```tsx
// 当前: text-gray-100
// 改为: text-gray-800 dark:text-gray-100
```

**来源标签边框**：

```tsx
// 当前: border-gray-600/60
// 改为: border-gray-300 dark:border-gray-600/60
```

**进度条背景**：

```tsx
// 当前: bg-gray-200
// 改为: bg-gray-200 dark:bg-gray-700
```

---

## 步骤 9：滚动按钮双主题

### 涉及文件

- `src/components/ScrollableRow.tsx`

### 改什么

```tsx
// 当前
className =
  '... bg-surface/90 ... border border-neon/20 text-neon hover:bg-neon/20 ...';

// 改为
className =
  '... bg-white/95 dark:bg-surface/90 ... border border-gray-200 dark:border-neon/20 text-neon hover:bg-neon/10 dark:hover:bg-neon/20 ...';
```

**箭头图标**：保持 `text-neon/80`（亮暗通用）。

---

## 步骤 10：胶囊选择器双主题

### 涉及文件

- `src/components/CapsuleSwitch.tsx`
- `src/components/DoubanSelector.tsx`

### 改什么

**背景轨道**：

```tsx
// 当前: bg-surface/60
// 改为: bg-gray-200/60 dark:bg-surface/60
```

**滑动指示器**：

```tsx
// 当前: bg-neon/80 shadow-[0_0_8px_rgba(82,99,255,0.3)]
// 改为: bg-neon/80 shadow-sm dark:shadow-[0_0_8px_rgba(82,99,255,0.3)]
//（亮色模式下去掉发光效果，保持简洁）
```

**未选中文字**：

```tsx
// 当前: text-gray-400 hover:text-white
// 改为: text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white
```

**选中文字**：保持 `text-white`（neon 背景上的白色文字亮暗通用）。

---

## 步骤 11：豆瓣页双主题

### 涉及文件

- `src/app/douban/page.tsx`

### 改什么

**页面标题 h1**：

```tsx
// 当前: text-gray-200
// 改为: text-gray-800 dark:text-gray-200
```

**选择器容器**：

```tsx
// 当前: bg-surface-dark/60 border border-neon/10
// 改为: bg-white/60 dark:bg-surface-dark/60 border border-gray-200/30 dark:border-neon/10
```

**标签文字**（"分类"/"地区"/"类型"）：

```tsx
// 当前: text-gray-400
// 改为: text-gray-500 dark:text-gray-400
```

---

## 步骤 12：浮动药丸双主题

### 涉及文件

- `src/components/ContinueWatching.tsx`

### 改什么

```tsx
// 当前: bg-neon/10 border border-neon/30 text-neon
// 改为: bg-neon/5 border border-neon/20 text-neon dark:bg-neon/10 dark:border-neon/30
//（亮色模式下降低对比度，避免太跳）
```

---

## 步骤 13：公告弹窗双主题

### 涉及文件

- `src/app/page.tsx`

### 改什么

**弹窗背景**：

```tsx
// 当前: bg-[#1a1a1f] border border-neon/20
// 改为: bg-white dark:bg-[#1a1a1f] border border-gray-200 dark:border-neon/20
```

**标题**：

```tsx
// 当前: text-white
// 改为: text-gray-900 dark:text-white
```

**内容区**：

```tsx
// 当前: bg-neon/5 border border-neon/20
// 改为: bg-neon/5 border border-neon/20（通用）
```

**内容文字**：

```tsx
// 当前: text-gray-600 dark:text-gray-300
// 改为: text-gray-600 dark:text-gray-300（已通用）
```

---

## 亮色模式配色总览

| 用途       | 亮色模式                    | 暗色模式               |
| ---------- | --------------------------- | ---------------------- |
| 页面背景   | 蓝白柔渐变                  | 深黑微渐变             |
| 侧边栏背景 | `bg-white/80` 半透明白      | `bg-[#0d0d12]/90` 深色 |
| 侧边栏边框 | `border-gray-200/50`        | `border-neon/20` 霓虹  |
| 发光线     | 淡灰分隔线                  | 霓虹发光线             |
| 主文字     | `text-gray-800`             | `text-gray-200`        |
| 副文字     | `text-gray-500`             | `text-gray-400`        |
| 品牌色     | `text-neon` #5263FF（通用） | 同左                   |
| 悬停高亮   | `text-neon`                 | `text-cyan`            |
| 滚动条     | 浅灰轨道 + 淡紫滑块         | 深灰轨道 + 霓虹滑块    |
| 滚动按钮   | 白底 + neon 边框            | surface 底 + neon 边框 |
| 胶囊轨道   | `bg-gray-200/60`            | `bg-surface/60`        |
| 卡片外框   | `ring-gray-200/50`          | `ring-white/5`         |

---

## 实施顺序

```
步骤 1   恢复主题切换        ████████░░  基础能力 ✅
步骤 2   globals.css 双主题  ████████░░  背景/滚动条 ✅
步骤 3   tailwind 色板扩展   ████░░░░░░  配色基础 ✅
步骤 4   侧边栏双主题        ██████░░░░  导航体验 ✅
步骤 5   MobileHeader        ████░░░░░░  移动端 ✅
步骤 6   MobileBottomNav     ████░░░░░░  移动端 ✅
步骤 7   首页标题双主题       ████████░░  内容区 ✅
步骤 8   海报卡片双主题       ████████░░  交互质感 ✅
步骤 9   滚动按钮双主题       ████████░░  细节 ✅
步骤 10  胶囊选择器双主题     ████████░░  组件 ✅
步骤 11  豆瓣页双主题         ████████░░  页面级 ✅
步骤 12  浮动药丸双主题       ████████░░  装饰元素 ✅
步骤 13  公告弹窗双主题       ████████░░  弹窗 ✅
```

**建议**：先做 1→2 恢复切换能力，再做 4→6 导航组件，最后做 7→13 内容组件。

每步完成后 `pnpm dev` 预览，点击主题切换按钮验证亮暗效果。

---

## 实施进度

- [x] 步骤 7：首页标题双主题 — 已完成
- [x] 步骤 8：海报卡片双主题 — 已完成
- [x] 步骤 9：滚动按钮双主题 — 已完成
- [x] 步骤 10：胶囊选择器双主题 — 已完成
- [x] 步骤 11：豆瓣页双主题 — 已完成
- [x] 步骤 12：浮动药丸双主题 — 已完成
- [x] 步骤 13：公告弹窗双主题 — 已完成
