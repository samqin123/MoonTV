// 此文件由 scripts/convert-changelog.js 自动生成
// 请勿手动编辑

export interface ChangelogEntry {
  version: string;
  date: string;
  added: string[];
  changed: string[];
  fixed: string[];
}

export const changelog: ChangelogEntry[] = [
  {
    version: "1.1.1",
    date: "2025-08-12",
    added: [
      // 无新增内容
    ],
    changed: [
    "修正 zwei 提供的 cors proxy 地址",
    "移除废弃代码"
    ],
    fixed: [
    "[运维] docker workflow release 日期使用东八区日期"
    ]
  },
  {
    version: "1.1.0",
    date: "2025-08-12",
    added: [
    "每日新番放送功能，展示每日新番放送的番剧"
    ],
    changed: [
      // 无变更内容
    ],
    fixed: [
    "修复远程 CHANGELOG 无法提取变更内容的问题"
    ]
  },
  {
    version: "1.0.5",
    date: "2025-08-12",
    added: [
      // 无新增内容
    ],
    changed: [
    "实现基于 Git 标签的自动 Release 工作流"
    ],
    fixed: [
      // 无修复内容
    ]
  },
  {
    version: "1.0.4",
    date: "2025-08-11",
    added: [
    "优化版本管理工作流，实现单点修改"
    ],
    changed: [
    "版本号现在从 CHANGELOG 自动提取，无需手动维护 VERSION.txt"
    ],
    fixed: [
      // 无修复内容
    ]
  },
  {
    version: "1.0.3",
    date: "2025-08-11",
    added: [
      // 无新增内容
    ],
    changed: [
    "升级播放器 Artplayer 至版本 5.2.5"
    ],
    fixed: [
      // 无修复内容
    ]
  },
  {
    version: "1.0.2",
    date: "2025-08-11",
    added: [
      // 无新增内容
    ],
    changed: [
    "版本号比较机制恢复为数字比较，仅当最新版本大于本地版本时才认为有更新",
    "[运维] 自动替换 version.ts 中的版本号为 VERSION.txt 中的版本号"
    ],
    fixed: [
      // 无修复内容
    ]
  },
  {
    version: "1.0.1",
    date: "2025-08-11",
    added: [
      // 无新增内容
    ],
    changed: [
      // 无变更内容
    ],
    fixed: [
    "修复版本检查功能，只要与最新版本号不一致即认为有更新"
    ]
  },
  {
    version: "1.0.0",
    date: "2025-08-10",
    added: [
    "基于 Semantic Versioning 的版本号机制",
    "版本信息面板，展示本地变更日志和远程更新日志"
    ],
    changed: [
      // 无变更内容
    ],
    fixed: [
      // 无修复内容
    ]
  }
];

export default changelog;
