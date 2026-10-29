# 手机端 Remotion 视频工作室

用手机上的 Claude Code 云端会话完成视频开发、预览、渲染和 MP4 导出，不需要电脑。

模板：9:16 竖屏 · 1080×1920 · 30fps · 30 秒的 AI 科普动画（主题：大模型是怎样回答问题的）。

## 前置条件

| 需要什么 | 说明 |
| --- | --- |
| Claude 账号，可使用 Claude Code 云端会话 | 在手机上的 Claude App 或 claude.ai/code 打开 |
| GitHub 账号，已连接到 Claude | 本仓库已授权给 Claude Code |
| 本仓库保持**公开** | 公开仓库使用 GitHub Actions 标准 runner 不计费；改为私有会占用免费额度（见下方） |
| 不需要 | 电脑、AWS 账号、信用卡、任何 API 密钥 |

## 手机端操作流程

1. **提需求**：在 Claude Code 会话里用一句话描述修改，例如
   - “把标题改成『AI 会取代程序员吗？』”
   - “流程图镜头延长到 10 秒，片尾缩短到 3 秒”
   - “背景换成深绿色，强调色用橙色”
2. **Claude 修改并自检**：改 `src/config/video.config.ts` → 类型检查 → 在会话容器里渲染 → `npm run verify` 校验 15 项规格。
3. **你拿到三样东西**：
   - **MP4 文件卡片**：会话里直接发送，点开即可保存。
   - **预览页**（claude.ai Artifact 链接）：可交互的播放器（点镜头可跳转）、成片播放、“保存 MP4 到手机”按钮、校验报告。
   - **固定下载链接**（推送后 GitHub Actions 云端渲染，约 3–5 分钟）：
     `https://github.com/huaxialucaicaizi/opus5.5-mobile-remotion-studio/releases/download/render-main/ai-explainer.mp4`
     其他分支把 `render-main` 换成 `render-<分支名，/ 换成 ->`。Release 页面同时显示封面、提交号和校验表。
4. **满意后合并**：让 Claude 开 PR，检查通过后合并到 `main`，`render-main` 链接随之更新。
5. **手动重新渲染**（可选）：GitHub App 或网页 → Actions → Render video → Run workflow。

### 哪些内容会自动更新

| 入口 | 何时更新 | 失败时 |
| --- | --- | --- |
| GitHub Release 下载链接 | 每次推送并渲染、校验都通过后自动更新；发布后会回读 `build-info.json`（提交号、运行编号）和视频 SHA-256，确认链接已指向本次产物 | 不发布，链接保留上一次成功的版本；运行摘要写明失败原因 |
| GitHub Actions 运行摘要 | 每次运行 | 列出运行环境、校验表、失败说明 |
| claude.ai 预览页 | **不会自动更新**，需要 Claude 在会话里重新发布（说“更新预览页”即可） | — |

## 作品：《大模型的「高考」：AI 榜单怎么看？》（`Leaderboard`）

竖屏 1080×1920 · 30fps · 91 秒的可爱风科普动画。全片用"榜单 = 大模型的高考"做比喻：笔试（MMLU、GPQA、AIME、SWE-bench、HLE、中文榜）、面试（LMArena 双盲对战 + Elo 积分）、综合素质评价、三个坑（泄题、卷子太简单、面试嘴甜），最后讲"像报志愿一样看榜"。

- **刻意不写当前名次**：榜单每周都在变，写死名次很快就会过时
- **画风**：马卡龙色圆滚滚小机器人（会眨眼、蹦跳、出汗、戴皇冠），贴纸风卡片，主持人"榜榜"用对话气泡讲解
- **配乐**：`scripts/generate-leaderboard-audio.ts` 程序合成，没有版权问题。用马林巴、拨弦、拍手、钟琴，"三个坑"段换成小调跳音；啵、叮、弹簧、呃哦等音效的时间点都来自配置
- **改内容**：只改 `src/leaderboard/config.ts`（台词用 `\n` 断行，每行不超过 13 字）；改了时间点后运行 `npm run bgm:leaderboard`

| 命令 | 作用 |
| --- | --- |
| `npm run render:leaderboard` | 渲染 `out/leaderboard.mp4` |
| `npm run verify:leaderboard` | 按 `Leaderboard` 规格校验 15 项 |
| `npm run bgm:leaderboard` | 重新生成配乐 + 音效 |

## 改内容只改一个文件

`src/config/video.config.ts` 包含全部可调内容：

| 内容 | 字段 |
| --- | --- |
| 标题、副标题、栏目标签 | `scenes[0]`（type: `title`） |
| 关键词与说明 | `scenes[1].keywords` |
| 流程步骤 | `scenes[2].steps` |
| 结论与高亮词 | `scenes[3].statement` / `highlight` |
| 片尾文案、账号名 | `scenes[4]` |
| 每个镜头时长 | `scenes[i].durationInSeconds`（总时长 = 各镜头之和） |
| 单个镜头背景色 | `scenes[i].background` |
| 全局配色、字体 | `theme` |
| 字幕文字和时间 | `scenes[i].subtitles`（时间相对镜头开头，单位秒） |
| 字幕开关、字号、位置 | `subtitleStyle` |
| 背景音乐、音量 | `audio` |

## 目录结构

```
src/
  config/video.config.ts   ← 视频内容配置（改这里）
  config/types.ts          配置类型
  config/timing.ts         秒 ↔ 帧换算、总时长计算
  scenes/                  5 个可复用镜头组件
    TitleScene.tsx         标题开场
    KeywordScene.tsx       关键词动效
    FlowScene.tsx          流程图动画
    ConclusionScene.tsx    重点结论
    OutroScene.tsx         片尾
  components/              背景、镜头转场、字幕层
  AIExplainer.tsx          主合成（串联镜头 + 字幕 + 背景音乐）
  Root.tsx                 注册合成（时长由配置自动计算）
public/audio/bgm.mp3       原创合成背景音乐（scripts/generate-bgm.ts 生成）
preview/                   手机预览页（@remotion/player）
scripts/
  verify-video.ts          ffprobe/ffmpeg 校验成片
  build-preview.ts         打包预览页
  generate-bgm.ts          重新生成背景音乐
.github/
  workflows/render.yml     云端渲染 → 校验 → 发布
  actions/render/          渲染 + 校验的共用步骤
  dependabot.yml           每月检查 Action 新版本
```

## 命令

| 命令 | 作用 |
| --- | --- |
| `npm ci` | 安装依赖（Node 版本见 `.nvmrc`） |
| `npm run dev` | 启动 Remotion Studio（开发预览，localhost:3000） |
| `npm run typecheck` | TypeScript 类型检查 |
| `npm run build` | `remotion bundle` 构建 |
| `npm run render` | 渲染 `out/ai-explainer.mp4`（H.264 + AAC，yuv420p，bt709） |
| `npm run still` | 渲染封面 `out/poster.png` |
| `npm run verify` | 校验 15 项：容器、编码、分辨率、帧率、帧数、时长、像素格式、音轨、完整解码、MP4 结构等；不通过时退出码为 1 |
| `npm run preview:build` | 生成手机预览页 `preview/dist/` |
| `npm run bgm` | 重新生成背景音乐（`npm run bgm -- 45` 指定秒数） |

在 Claude Code 云端会话里渲染前，需要先设置（原因见“已知问题”）：

```bash
export REMOTION_BROWSER_EXECUTABLE=/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell
```

## 云端渲染流水线

`.github/workflows/render.yml` 有三个 job：

| Job | 环境 | 权限 | 作用 |
| --- | --- | --- | --- |
| `render` | `ubuntu-24.04` + Node 22（`.nvmrc`） | `contents: read` | 安装、类型检查、渲染、校验、上传产物；失败则不发布 |
| `compat` | `ubuntu-26.04` + Node 24 | `contents: read` | 兼容性预演，失败**不阻塞**、不发布，用来提前发现升级问题 |
| `publish` | `ubuntu-24.04` | `contents: write` | 唯一有写权限的 job，不运行项目代码；原地更新 Release，并回读下载链接，核对提交号、运行编号和 SHA-256 |

安全设置：

- 工作流默认 `permissions: {}`，每个 job 只申请自己需要的权限。
- 所有第三方 Action 都固定在提交 SHA 上（注释里写了版本号），由 Dependabot 每月提 PR 更新。
- `actions/checkout` 设置 `persist-credentials: false`，渲染阶段拿不到 token。
- 不使用依赖缓存，每次运行都从 npm registry 全新安装，`npm ci` 会按 `package-lock.json` 校验每个包的完整性哈希。
- 只使用 GitHub 自动提供的 `GITHUB_TOKEN`，并且只在发布步骤注入；日志中显示为 `***`。工作流不需要、也不读取任何自定义密钥。

## 免费额度与限制

以下是截至 2026 年 10 月的情况，以 GitHub、Anthropic 官方页面为准：

| 项目 | 限制 |
| --- | --- |
| GitHub Actions（公开仓库，标准 runner） | 不计费；单个 job 最长 6 小时（本项目设为 30 分钟超时）；免费账户 Linux 并发 20 个 job |
| GitHub Actions（若改为私有仓库，免费账户） | 每月 2,000 分钟、500 MB 产物存储；本项目每次推送约用 6–10 分钟（render + compat + publish） |
| Actions 构建产物（zip） | 保留 30 天；下载需要登录 GitHub，手机上更推荐用 Release 链接 |
| Release 资产 | 单个文件 < 2 GiB；每个分支只保留一份最新视频（覆盖更新） |
| Claude Code 云端会话 | 按你的 Claude 套餐计算用量；容器是临时的，未提交的文件会丢失；本地渲染 30 秒视频约 100 秒 |
| claude.ai 预览页 | 默认只有你本人能看；页面 ≤ 16 MB，单个上传文件 ≤ 20 MiB（约 60–80 秒的 1080p 视频） |
| Remotion 许可 | 个人和 3 人以内的营利组织免费（可商用）；更大的公司需要购买公司许可，见 `node_modules/remotion/LICENSE.md` |

## 已知问题

1. **云端会话无法下载 Remotion 自带的 Chrome**：`remotion.media` 被会话网络策略拦截（403），所以要设置 `REMOTION_BROWSER_EXECUTABLE`，改用容器预装的 Chrome Headless Shell。GitHub Actions 不受影响。
2. **云端会话访问不了 `remotion.dev` 和 `*.amazonaws.com`**：查官方文档、使用 Lambda 都需要先在会话的网络设置里放行这两个域名。
3. **会话内读不到完整的 Actions 原始日志**：日志下载会跳转到 Azure Blob 存储，被网络策略拦截。所以环境信息和校验结果都写进了运行摘要，Claude 可以通过 API 读取摘要和失败步骤。
4. **预览页需要手动更新**：见上方“哪些内容会自动更新”。
5. **预览页不支持 MP3**：Artifact 的资产类型不包括 mp3，预览页里的背景音乐转成了 AAC（.mp4 容器）再上传，不影响成片。
6. **音轨比视频长 16 毫秒**（30.016 s 对 30.000 s）：这是 AAC 编码器的正常填充，播放器会按视频时长处理。
7. **手动 Run workflow 只能在合并到 `main` 之后使用**：这是 GitHub 对 `workflow_dispatch` 的限制。在分支上推送仍会自动渲染。
8. **分支 Release 会累积**：每个渲染过的分支都会留下一个 `render-<分支>` 预发布版本，不再需要时在 Releases 页面删除即可。

## 升级方案

| 项目 | 现状 | 计划 |
| --- | --- | --- |
| Action 运行时 | 已从 Node 20 版本（checkout@v4 等）升级到 Node 24 版本（checkout v7.0.1、setup-node v7.1.0、upload-artifact v7.0.2、download-artifact v8.0.2），弃用提醒已消除 | Dependabot 每月提 PR 更新 SHA |
| Ubuntu | `render` 固定 `ubuntu-24.04`；`compat` 显式跑 `ubuntu-26.04`（`ubuntu-latest` 正在分批迁移到 26，实测仍可能分到 24.04，所以不用它做兼容性测试） | `compat` 连续通过后，把 `render` 和 `publish` 的 `runs-on` 改成 `ubuntu-26.04`；24.04 在 GitHub 宣布停用前仍可继续使用 |
| Node.js | 渲染用 Node 22（维护期到 2027-04）；`compat` 测试 Node 24 | `compat` 稳定后把 `.nvmrc` 改为 `24`，并更新 `package.json` 的 `engines` |
| Remotion | 4.0.539，所有 `@remotion/*` 包锁定同一版本 | 用 `npx remotion upgrade` 一起升级；升级到 Remotion 5 前先看许可变更 |
| 云端渲染 | GitHub Actions | 需要批量、长视频或更快并行渲染时再接入 Lambda（见下节） |

## Remotion Lambda（未配置）

对 30 秒的模板来说 GitHub Actions 已经足够。Lambda 只在大量、长视频或需要快速并行渲染时才划算。接入前需要你提供或授权：

1. **AWS 账号**：需绑定信用卡，Lambda 和 S3 按用量付费；短视频单次渲染通常只要几美分。
2. **IAM 配置**（在 AWS 控制台操作）：
   - 创建角色 `remotion-lambda-role`，附加 `npx remotion lambda policies role` 输出的策略；
   - 创建 IAM 用户，附加 `npx remotion lambda policies user` 输出的策略，生成 Access Key。
3. **凭据**：把 `REMOTION_AWS_ACCESS_KEY_ID`、`REMOTION_AWS_SECRET_ACCESS_KEY` 存为 GitHub Actions Secrets，并选择区域 `REMOTION_AWS_REGION`（如 `ap-northeast-1`）。不要把密钥写进仓库或发在聊天里。
4. **部署**（凭据就绪后 Claude 可以代为执行）：`npm i -E @remotion/lambda@<与 remotion 相同的版本>`，`npx remotion lambda policies validate`，`npx remotion lambda functions deploy`，`npx remotion lambda sites create src/index.ts --site-name=mobile-studio`，`npx remotion lambda render <serve-url> AIExplainer`。
5. **网络**：放行 `*.amazonaws.com`，或者改为在 GitHub Actions 里调用 Lambda。
6. **配额**：新 AWS 账号的 Lambda 并发上限可能很低，必要时需要申请提高。

## 许可

背景音乐由 `scripts/generate-bgm.ts` 程序合成，没有第三方版权。Remotion 的许可条款见上方“免费额度与限制”。
