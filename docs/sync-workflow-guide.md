# GitHub Actions 上游同步 Workflow 详解

## 这个 Workflow 做什么

定时从上游仓库 (`samqin123/MoonTV`) 拉取 `config.json`，如果内容有变化就自动提交到你的仓库。

## 逐行解析

```yaml
name: Upstream Sync Config # Workflow 的显示名称
```

### 触发条件

```yaml
on:
  schedule:
    - cron: '0 */6 * * *' # 每 6 小时自动运行一次（0:00, 6:00, 12:00, 18:00 UTC）
  workflow_dispatch: # 允许在 GitHub 页面手动点击运行
```

**cron 语法**: `分 时 日 月 星期`

- `*/6` 表示每隔 6 小时
- 改成 `"0 */2 * * *"` 就是每 2 小时
- 改成 `"0 8 * * *"` 就是每天 UTC 8 点（北京时间 16 点）

### 权限

```yaml
permissions:
  contents: write # 需要写权限才能 push 代码
  actions: write # 需要操作 Actions 的权限（删除运行记录）
```

### 第 1 步：拉取你的仓库

```yaml
- name: Checkout target repo
  uses: actions/checkout@v4
```

把你的仓库代码检出到 runner 的工作目录，这样才能操作 `config.json`。

### 第 2 步：下载上游的 config.json

```yaml
- name: Fetch config.json from upstream
  run: |
    curl -sL "https://raw.githubusercontent.com/samqin123/MoonTV/main/config.json" -o upstream_config.json
```

- `curl -sL`: 静默模式 + 跟随重定向
- `-o upstream_config.json`: 把下载内容保存为临时文件
- **这里就是之前 404 的地方**：如果上游仓库不存在或文件不存在，下载下来的就是 `404: Not Found` 文本

### 第 3 步：比较是否有变化

```yaml
- name: Check if config.json changed
  id: check # 给这步一个 id，后面的步骤可以用 steps.check.outputs 引用
  run: |
    if ! diff -q config.json upstream_config.json > /dev/null 2>&1; then
      echo "changed=true" >> $GITHUB_OUTPUT    # 输出变量，告诉后面的步骤"有变化"
    else
      echo "changed=false" >> $GITHUB_OUTPUT
    fi
```

- `diff -q`: 只比较是否有差异，不输出具体内容
- `> /dev/null 2>&1`: 丢弃所有输出
- `! diff`: 如果**有差异**（diff 返回非零），`!` 取反为真
- `>> $GITHUB_OUTPUT`: 这是 GitHub Actions 设置步骤输出变量的标准写法

### 第 4 步：有变化才提交

```yaml
- name: Commit and push updated config.json
  if: steps.check.outputs.changed == 'true' # 只有第 3 步判断有变化才执行
  run: |
    cp upstream_config.json config.json        # 用上游文件覆盖本地文件
    git config user.name "github-actions[bot]"       # 设置 git 用户名
    git config user.email "github-actions[bot]@users.noreply.github.com"  # 设置 git 邮箱
    git add config.json                        # 暂存文件
    git commit -m "chore: sync config.json from upstream"  # 提交
    git push                                   # 推送到远程仓库
```

### 第 5 步：清理临时文件

```yaml
- name: Cleanup
  run: rm -f upstream_config.json
```

删除下载的临时文件，保持工作目录干净。

### 第 6 步：删除旧的运行记录

```yaml
- name: Delete workflow runs
  uses: Mattraks/delete-workflow-runs@main
  with:
    token: ${{ secrets.GITHUB_TOKEN }} # 自动提供的 token
    repository: ${{ github.repository }} # 当前仓库
    retain_days: 0 # 不保留任何天数的记录
    keep_minimum_runs: 2 # 但至少保留最近 2 条
```

防止 Actions 运行记录无限堆积。

## 整体流程图

```
每 6 小时 / 手动触发
       │
       ▼
  拉取你的仓库代码
       │
       ▼
  下载上游 config.json
       │
       ▼
  比较两个文件是否相同 ──── 相同 ──→ 跳过，结束
       │
     不同
       │
       ▼
  覆盖 → 提交 → 推送
       │
       ▼
  清理临时文件
       │
       ▼
  删除旧的运行记录
```

## 自己写的要点

1. **上游 URL 要验证能访问**：用浏览器或 `curl` 确认 raw 链接返回 200 和正确内容
2. **一定要先比较再提交**：避免每 6 小时产生无意义的空提交
3. **permissions 要加 `contents: write`**：否则 push 会失败
4. **`workflow_dispatch`** 加上可以随时手动触发调试，不用等定时
