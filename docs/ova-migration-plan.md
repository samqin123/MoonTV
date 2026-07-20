# Vision TV → OVA.ai 风格改造方案

> 将 Vision TV 从「简约玻璃拟态 + 绿色品牌」改造为「暗色科技风 + 霓虹蓝紫 + 滚动驱动动画」

---

## 改造总览

| 维度   | 当前 Vision TV      | 目标 OVA.ai 风                                |
| ------ | ------------------- | --------------------------------------------- |
| 色调   | 绿色品牌 + 灰阶     | 蓝紫霓虹 `#5263FF` + 青色高亮 `#4DC6FC`       |
| 背景   | 明暗双主题          | 强制暗色模式                                  |
| 字体   | Inter               | Montserrat（标题）+ Roboto（正文）            |
| 动画   | 克制 200-300ms 过渡 | 滚动触发动画 + 悬浮药丸 + 无限轮播 + 发光效果 |
| 侧边栏 | 玻璃拟态白色/深灰   | 深色 + 霓虹发光边框                           |
| 卡片   | 简单缩放悬停        | 发光悬停 + 滑入指示器                         |

---

## 步骤 1：色彩体系替换 ✅ 已完成

### 涉及文件

- `tailwind.config.ts` — 主色调定义
- `src/components/Sidebar.tsx` — 绿色 → 蓝紫色
- `src/components/MobileHeader.tsx` — 绿色 → 蓝紫色
- `src/components/VideoCard.tsx` — 评分徽章、悬停色
- `src/components/ScrollableRow.tsx` — 滚动按钮
- `src/app/globals.css` — 滚动条、渐变背景

### 改什么

**tailwind.config.ts** — 替换 `primary` 色板：

```ts
// 当前：天蓝色系
colors: {
  primary: {
    50: '#f0f9ff',
    // ...
    900: '#0c4a6e',
  },
}

// 改为：蓝紫色系（OVA 风格）
colors: {
  neon: {
    DEFAULT: '#5263FF',    // 主色调：蓝紫色
    light: '#7B85FF',      // 浅蓝紫
    dark: '#3A47CC',       // 深蓝紫
  },
  cyan: {
    DEFAULT: '#4DC6FC',    // 高亮青色
    dark: '#2BA8E0',
  },
  surface: {
    DEFAULT: '#313136',    // 炭灰背景
    dark: '#1a1a1f',       // 深底色
    light: '#3d3d44',      // 浅底色
  },
}
```

**全局替换绿色类名**（所有组件）：

| 当前 Tailwind 类             | 替换为                  |
| ---------------------------- | ----------------------- |
| `text-green-600`             | `text-neon`             |
| `text-green-400` (dark)      | `text-cyan`             |
| `bg-green-500`               | `bg-neon`               |
| `bg-green-500/20`            | `bg-neon/20`            |
| `hover:text-green-600`       | `hover:text-cyan`       |
| `group-hover:text-green-400` | `group-hover:text-cyan` |

---

## 步骤 2：强制暗色模式 + 背景改造 ✅ 已完成

### 涉及文件

- `src/components/ThemeProvider.tsx` — 强制暗色
- `src/components/ThemeToggle.tsx` — 可移除或改为 accent 切换
- `src/app/globals.css` — 背景渐变替换
- `src/app/layout.tsx` — 默认 dark class

### 改什么

**layout.tsx** — 给 `<html>` 强制 `dark` class：

```tsx
// 当前: <html lang="zh-CN" suppressHydrationWarning>
// 改为:
<html lang="zh-CN" className="dark" suppressHydrationWarning>
```

**globals.css** — 替换亮色渐变为暗色：

```css
/* 删除这段亮色渐变 */
/* html:not(.dark) body {
  background: linear-gradient(180deg, #e6f3fb 0%, ...);
} */

/* 替换为：暗色微渐变 */
html.dark body {
  background: linear-gradient(
    180deg,
    #0d0d12 0%,
    #13131a 30%,
    #0f0f16 60%,
    #0a0a10 100%
  );
  background-attachment: fixed;
}
```

**滚动条** — 改为霓虹风：

```css
::-webkit-scrollbar-track {
  background: rgba(49, 49, 54, 0.5); /* surface 色 */
}
::-webkit-scrollbar-thumb {
  background: rgba(82, 99, 255, 0.3); /* neon 色 */
  border-radius: 4px;
}
::-webkit-scrollbar-thumb:hover {
  background: rgba(82, 99, 255, 0.6);
}
```

---

## 步骤 3：字体替换 ✅ 已完成

### 涉及文件

- `tailwind.config.ts` — fontFamily 配置
- `src/app/layout.tsx` — Google Fonts 引入

### 改什么

**layout.tsx `<head>`** — 加载 Google Fonts：

```tsx
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
<link
  href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800;900&family=Roboto:wght@300;400;500;700&display=swap"
  rel="stylesheet"
/>
```

**tailwind.config.ts** — 替换字体：

```ts
fontFamily: {
  heading: ['Montserrat', 'sans-serif'],   // 标题
  primary: ['Roboto', 'sans-serif'],       // 正文（替代 Inter）
},
```

**组件中使用**：

- 板块标题 `<h2>`：加 `font-heading font-bold tracking-tight`
- 导航/正文：保持 `font-primary`

---

## 步骤 4：侧边栏霓虹风改造 ✅ 已完成

### 涉及文件

- `src/components/Sidebar.tsx`

### 改什么

**背景**：从白色半透明改为暗色 + 霓虹边框：

```tsx
// 当前
className =
  '... bg-white/40 backdrop-blur-xl ... dark:bg-gray-900/70 dark:border-gray-700/50';

// 改为
className = '... bg-[#13131a]/90 backdrop-blur-xl border-r border-neon/20 ...';
```

**Logo 文字**：

```tsx
// 当前: text-green-600
// 改为: text-neon
```

**导航项活跃态**：

```tsx
// 当前: data-[active=true]:bg-green-500/20 data-[active=true]:text-green-700
// 改为: data-[active=true]:bg-neon/15 data-[active=true]:text-neon
```

**导航项悬停**：

```tsx
// 当前: hover:bg-gray-100/30 hover:text-green-600
// 改为: hover:bg-neon/10 hover:text-cyan
```

**侧边栏增加霓虹发光线**（在 aside 内添加）：

```tsx
{
  /* 右侧霓虹发光线 */
}
<div className='absolute top-0 right-0 w-[1px] h-full bg-gradient-to-b from-transparent via-neon/40 to-transparent' />;
```

---

## 步骤 5：卡片霓虹悬停效果 ✅ 已完成

### 涉及文件

- `src/components/VideoCard.tsx`

### 改什么

**整体卡片悬停**：从简单缩放改为发光 + 微抬升：

```tsx
// 当前
className =
  'group relative w-full rounded-lg bg-transparent cursor-pointer transition-all duration-300 ease-in-out hover:scale-[1.05] hover:z-[500]';

// 改为
className =
  'group relative w-full rounded-lg bg-transparent cursor-pointer transition-all duration-500 ease-in-out hover:scale-[1.03] hover:z-[500] hover:drop-shadow-[0_0_12px_rgba(82,99,255,0.4)]';
```

**海报容器**：添加霓虹边框发光：

```tsx
// 当前
<div className='relative aspect-[2/3] overflow-hidden rounded-lg'>

// 改为
<div className='relative aspect-[2/3] overflow-hidden rounded-lg ring-1 ring-white/5 group-hover:ring-neon/50 transition-all duration-500'>
```

**播放按钮**：改为霓虹色填充：

```tsx
// 当前
className = 'text-white fill-transparent ... hover:fill-green-500 ...';

// 改为
className = 'text-white fill-transparent ... hover:fill-neon ...';
```

**评分徽章**：改为霓虹风格：

```tsx
// 当前: bg-pink-500
// 改为: bg-neon shadow-[0_0_10px_rgba(82,99,255,0.5)]

// 集数徽章
// 当前: bg-green-500
// 改为: bg-neon/90
```

**标题悬停色**：

```tsx
// 当前: group-hover:text-green-600 dark:group-hover:text-green-400
// 改为: group-hover:text-cyan
```

**来源标签悬停**：

```tsx
// 当前: group-hover:border-green-500/60 group-hover:text-green-600
// 改为: group-hover:border-neon/60 group-hover:text-cyan
```

---

## 步骤 6：滚动按钮霓虹风 ✅ 已完成

### 涉及文件

- `src/components/ScrollableRow.tsx`

### 改什么

**左右滚动按钮**：

```tsx
// 当前
className =
  'w-12 h-12 bg-white/95 rounded-full shadow-lg ... dark:bg-gray-800/90 dark:hover:bg-gray-700 dark:border-gray-600';

// 改为
className =
  'w-12 h-12 bg-surface/90 rounded-full shadow-lg border border-neon/20 text-neon hover:bg-neon/20 hover:border-neon/50 hover:shadow-[0_0_15px_rgba(82,99,255,0.3)] transition-all duration-300';
```

**箭头图标**：

```tsx
// 当前: text-gray-600 dark:text-gray-300
// 改为: text-neon/80
```

---

## 步骤 7：添加滚动触发动画（Scroll-triggered） ✅ 已完成

### 涉及文件

- `tailwind.config.ts` — 添加新动画
- `src/app/globals.css` — 添加动画关键帧
- 新建 `src/hooks/useScrollReveal.ts` — 滚动触发 Hook

### 改什么

**tailwind.config.ts** — 添加动画：

```ts
keyframes: {
  // ... 保留现有的 fadeIn, slideUp 等
  revealUp: {
    '0%': { transform: 'translateY(40px)', opacity: '0' },
    '100%': { transform: 'translateY(0)', opacity: '1' },
  },
  revealLeft: {
    '0%': { transform: 'translateX(-30px)', opacity: '0' },
    '100%': { transform: 'translateX(0)', opacity: '1' },
  },
  glowPulse: {
    '0%, 100%': { boxShadow: '0 0 5px rgba(82,99,255,0.3)' },
    '50%': { boxShadow: '0 0 20px rgba(82,99,255,0.6), 0 0 40px rgba(82,99,255,0.2)' },
  },
  float: {
    '0%, 100%': { transform: 'translateY(0px)' },
    '50%': { transform: 'translateY(-8px)' },
  },
},
animation: {
  // ... 保留现有的
  'reveal-up': 'revealUp 0.6s ease-out forwards',
  'reveal-left': 'revealLeft 0.6s ease-out forwards',
  'glow-pulse': 'glowPulse 3s ease-in-out infinite',
  'float': 'float 4s ease-in-out infinite',
},
```

**新建 `src/hooks/useScrollReveal.ts`**：

```ts
'use client';
import { useEffect, useRef, useState } from 'react';

export function useScrollReveal<T extends HTMLElement>(threshold = 0.15) {
  const ref = useRef<T>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(el); // 只触发一次
        }
      },
      { threshold }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, isVisible };
}
```

**在板块标题和内容区使用**：

```tsx
// 在首页组件中
const { ref: movieRef, isVisible: movieVisible } = useScrollReveal<HTMLDivElement>();

// 标题
<h2 className={`font-heading text-2xl font-bold text-white ${
  movieVisible ? 'animate-reveal-left' : 'opacity-0'
}`}>
  热门电影
</h2>

// 海报行
<div ref={movieRef} className={`flex gap-6 ${
  movieVisible ? 'animate-reveal-up' : 'opacity-0'
}`}>
  {/* 海报卡片 */}
</div>
```

---

## 步骤 8：继续观看区域 → 浮动药丸（Pills）效果 ✅ 已完成

### 涉及文件

- `src/components/ContinueWatching.tsx`

### 改什么

在 "继续观看" 卡片上方添加**悬浮标签药丸**，营造 OVA.ai Hero 区域的浮动感：

```tsx
{
  /* 浮动药丸标签 */
}
<div className='flex gap-3 mb-4 px-4 sm:px-6 overflow-hidden'>
  {['继续观看', '最新更新', '热门推荐', '高分佳作'].map((tag, i) => (
    <span
      key={tag}
      className='flex items-center gap-1 px-3 py-1.5 bg-neon/10 border border-neon/30
                 rounded-full text-sm text-neon whitespace-nowrap
                 animate-float'
      style={{ animationDelay: `${i * 0.5}s` }}
    >
      <Plus size={14} />
      {tag}
    </span>
  ))}
</div>;
```

这会给页面添加 OVA 风格的**浮动关键词标签**效果。

---

## 步骤 9：Hero 区域霓虹渐变 ✅ 已完成

### 涉及文件

- `src/app/page.tsx`（首页）
- `src/app/globals.css`

### 改什么

在首页顶部（Tab 栏下方）添加一个**霓虹渐变装饰条**：

```tsx
{
  /* 霓虹渐变分割线 */
}
<div className='h-[1px] bg-gradient-to-r from-transparent via-neon/60 to-transparent mb-6' />;
```

**globals.css** — 添加页面顶部环境光效果：

```css
/* 顶部霓虹环境光 */
main::before {
  content: '';
  position: fixed;
  top: -200px;
  left: 50%;
  transform: translateX(-50%);
  width: 600px;
  height: 400px;
  background: radial-gradient(
    ellipse,
    rgba(82, 99, 255, 0.08) 0%,
    transparent 70%
  );
  pointer-events: none;
  z-index: 0;
}
```

---

## 步骤 10：移动端适配 ✅ 已完成

### 涉及文件

- `src/components/MobileHeader.tsx`
- `src/components/MobileBottomNav.tsx`

### 改什么

**MobileHeader**：暗色 + 霓虹 Logo：

```tsx
// 当前: bg-white/70 backdrop-blur-xl border-gray-200/50 dark:bg-gray-900/70
// 改为: bg-[#0d0d12]/80 backdrop-blur-xl border-b border-neon/20

// Logo: text-green-600 → text-neon
```

**MobileBottomNav**（如有）：活跃项改为霓虹色：

```tsx
// 当前: text-green-600 / bg-green-500/20
// 改为: text-neon / bg-neon/15
```

---

## 改造优先级与顺序

```
步骤 1  色彩替换          ████████░░  ✅ 已完成
步骤 2  强制暗色          ███████░░░  ✅ 已完成
步骤 3  字体替换          ██████░░░░  ✅ 已完成（Orbitron + DM Sans）
步骤 4  侧边栏霓虹风      ██████░░░░  ✅ 已完成
步骤 5  卡片悬停发光       █████░░░░░  ✅ 已完成
步骤 6  滚动按钮          ████░░░░░░  ✅ 已完成
步骤 7  滚动触发动画       ██████░░░░  ✅ 已完成（useScrollReveal Hook）
步骤 8  浮动药丸          ████░░░░░░  ✅ 已完成
步骤 9  Hero 霓虹渐变     ███░░░░░░░  ✅ 已完成
步骤 10  移动端适配        ████░░░░░░  ✅ 已完成
```

**所有 10 个步骤已完成。** 字体选用了 Orbitron（标题，科幻几何风）+ DM Sans（正文，现代简洁），比原方案的 Montserrat/Roboto 更贴合赛博朋克霓虹风格。
