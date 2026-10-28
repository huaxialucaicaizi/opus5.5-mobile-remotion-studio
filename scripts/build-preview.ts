// 打包手机预览页：把 @remotion/player + 视频合成打包成单个 HTML 文件。
// 用法：
//   npm run preview:build
// 可选环境变量（为空则对应区块显示占位）：
//   PREVIEW_MP4_URL / PREVIEW_POSTER_URL / PREVIEW_BGM_URL  —— 成片、封面、背景音乐地址
//   PREVIEW_RELEASE_URL                                     —— GitHub Release 下载地址
// 输出：
//   preview/dist/index.html     —— 完整独立网页（可放到任意静态托管）
//   preview/dist/artifact.html  —— 不含文档骨架的版本，用于发布为 claude.ai Artifact
import {execFileSync} from 'node:child_process';
import {existsSync, mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {build} from 'esbuild';

const repo = 'huaxialucaicaizi/opus5.5-mobile-remotion-studio';
const git = (...args: string[]) => {
  try {
    return execFileSync('git', args).toString().trim();
  } catch {
    return '';
  }
};
const branch = git('rev-parse', '--abbrev-ref', 'HEAD') || 'main';

const result = await build({
  entryPoints: ['preview/main.tsx'],
  bundle: true,
  minify: true,
  format: 'iife',
  target: 'es2020',
  jsx: 'automatic',
  write: false,
  define: {'process.env.NODE_ENV': '"production"'},
  logLevel: 'warning',
});
const js = result.outputFiles[0].text.replace(/<\/script/gi, '<\\/script');

const reportPath = 'out/verify-report.json';
const data = {
  mp4Url: process.env.PREVIEW_MP4_URL ?? '',
  posterUrl: process.env.PREVIEW_POSTER_URL ?? '',
  bgmUrl: process.env.PREVIEW_BGM_URL ?? '',
  releaseUrl:
    process.env.PREVIEW_RELEASE_URL ??
    `https://github.com/${repo}/releases/download/render-${branch.replaceAll('/', '-')}/ai-explainer.mp4`,
  repoUrl: `https://github.com/${repo}`,
  configUrl: `https://github.com/${repo}/blob/${branch}/src/config/video.config.ts`,
  commit: git('rev-parse', '--short', 'HEAD'),
  renderedAt: new Date().toISOString().slice(0, 16).replace('T', ' ') + ' UTC',
  report: existsSync(reportPath) ? JSON.parse(readFileSync(reportPath, 'utf8')) : null,
};

const html = readFileSync('preview/template.html', 'utf8')
  .replace('/*PREVIEW_DATA*/', () => JSON.stringify(data).replace(/</g, '\\u003c'))
  .replace('/*PLAYER_JS*/', () => js);

mkdirSync('preview/dist', {recursive: true});
writeFileSync('preview/dist/artifact.html', html);
writeFileSync(
  'preview/dist/index.html',
  '<!doctype html><html lang="zh-CN"><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">' +
    '<style>body{margin:0}img{max-width:100%}[hidden]{display:none!important}</style></head><body>' +
    html +
    '</body></html>',
);
console.log(`已生成 preview/dist/index.html 与 artifact.html（${(html.length / 1024).toFixed(0)} KB）`);
