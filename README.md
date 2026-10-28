# 手机端 Remotion 视频工作室

用手机上的 Claude Code 云端会话完成视频开发、预览、渲染和 MP4 导出，不需要电脑。

模板：9:16 竖屏 · 1080×1920 · 30fps · 30 秒的 AI 科普动画（主题：大模型是怎样回答问题的）。

## 手机上的工作流

1. 在 Claude Code 会话里用一句话描述修改，例如：
   - “把标题改成『AI 会取代程序员吗？』”
   - “流程图镜头延长到 10 秒，片尾缩短到 3 秒”
   - “背景换成深绿色，强调色用橙色”
2. Claude 修改 `src/config/video.config.ts`，跑类型检查、渲染和校验。
3. 你会拿到：
   - **预览页**（claude.ai Artifact 链接）：可交互的 Remotion Player、点镜头跳转、成片 MP4 播放和“保存到手机”按钮、校验报告
   - **MP4 文件**：会话里直接发送的文件卡片
   - **GitHub Release 固定下载地址**（推送后由 GitHub Actions 云端渲染）：
     `https://github.com/huaxialucaicaizi/opus5.5-mobile-remotion-studio/releases/download/render-<分支名>/ai-explainer.mp4`
     （分支名中的 `/` 换成 `-`，例如 `render-main`）

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
.github/workflows/render.yml  GitHub Actions 云端渲染
```

## 命令

| 命令 | 作用 |
| --- | --- |
| `npm ci` | 安装依赖 |
| `npm run dev` | 启动 Remotion Studio（开发预览，localhost:3000） |
| `npm run typecheck` | TypeScript 类型检查 |
| `npm run build` | `remotion bundle` 构建 |
| `npm run render` | 渲染 `out/ai-explainer.mp4`（H.264 + AAC，yuv420p，bt709） |
| `npm run still` | 渲染封面 `out/poster.png` |
| `npm run verify` | 校验分辨率、帧率、帧数、时长、音频、完整解码、MP4 结构 |
| `npm run preview:build` | 生成手机预览页 `preview/dist/` |
| `npm run bgm` | 重新生成背景音乐（`npm run bgm -- 45` 指定秒数） |

在 Claude Code 云端会话里，Remotion 无法下载自带的 Chrome（下载源被网络策略拦截），渲染前设置：

```bash
export REMOTION_BROWSER_EXECUTABLE=/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell
```

## 云端渲染方案

| 方案 | 状态 | 需要什么 |
| --- | --- | --- |
| Claude Code 云端会话内渲染 | ✅ 可用 | 无。30 秒视频约 100 秒渲染完 |
| GitHub Actions（`.github/workflows/render.yml`） | ✅ 已配置 | 无。公开仓库标准 runner 免费；推送修改后自动渲染并发布到 Release |
| Remotion Lambda | ⏸ 未配置 | 见下方清单 |

### Remotion Lambda 需要你提供 / 授权的内容

本仓库没有假设以下任何一项已经就绪：

1. **AWS 账号**（需绑定信用卡，Lambda 与 S3 按量计费；短视频单次渲染通常只要几美分，但属于付费服务）。
2. **IAM 配置**（需要你在 AWS 控制台操作）：
   - 创建角色 `remotion-lambda-role`，附加 `npx remotion lambda policies role` 输出的策略；
   - 创建 IAM 用户，附加 `npx remotion lambda policies user` 输出的策略，生成 Access Key。
3. **凭据**：把 `REMOTION_AWS_ACCESS_KEY_ID`、`REMOTION_AWS_SECRET_ACCESS_KEY` 存为 GitHub Actions Secrets 或云端环境的环境变量，并选择区域 `REMOTION_AWS_REGION`（如 `ap-northeast-1`）。不要把密钥写进仓库或聊天。
4. **部署**（凭据就绪后 Claude 可代为执行）：
   `npm i -E @remotion/lambda@4.0.539`，`npx remotion lambda policies validate`，`npx remotion lambda functions deploy`，`npx remotion lambda sites create src/index.ts --site-name=mobile-studio`，然后 `npx remotion lambda render <serve-url> AIExplainer`。
5. **网络**：当前 Claude Code 云端环境的网络策略未放行 `*.amazonaws.com` 与 `remotion.dev`，需要在环境设置中放行，或者改为在 GitHub Actions 里调用 Lambda。
6. **配额**：新 AWS 账号的 Lambda 并发上限可能很低，必要时需申请提额。

对 30 秒的模板来说，GitHub Actions 已经足够（单次约 3–5 分钟），Lambda 主要在需要大量、长视频、快速并行渲染时才划算。

## 许可

Remotion 对个人和 3 人以内的营利组织免费（包括商用）；更大的公司需要购买公司许可。详见 `node_modules/remotion/LICENSE.md`。背景音乐由 `scripts/generate-bgm.ts` 程序合成，无第三方版权。
