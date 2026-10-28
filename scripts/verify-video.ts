// 用 ffprobe / ffmpeg 校验渲染出的 MP4 是否符合 video.config.ts 的规格。
// 用法：node scripts/verify-video.ts out/ai-explainer.mp4
// 结果写入 out/verify-report.json，任一项不通过时以非零状态码退出。
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {existsSync, mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {getTotalFrames} from '../src/config/timing.ts';
import {videoConfig} from '../src/config/video.config.ts';
import {getSegments, historyConfig} from '../src/history/config.ts';

// 用法：node scripts/verify-video.ts <文件> [--comp=AIExplainer|ChinaHistory]
const args = process.argv.slice(2);
const file = args.find((a) => !a.startsWith('--')) ?? 'out/ai-explainer.mp4';
const comp = args.find((a) => a.startsWith('--comp='))?.slice('--comp='.length) ?? 'AIExplainer';

const specs = {
  AIExplainer: {
    width: videoConfig.width,
    height: videoConfig.height,
    fps: videoConfig.fps,
    frames: getTotalFrames(videoConfig),
    audio: videoConfig.audio.enabled,
  },
  ChinaHistory: {
    width: historyConfig.width,
    height: historyConfig.height,
    fps: historyConfig.fps,
    frames: getSegments(historyConfig).reduce((sum, seg) => sum + Math.round(seg.duration * historyConfig.fps), 0),
    audio: historyConfig.audio.enabled,
  },
};
if (!(comp in specs)) {
  console.error(`❌ 未知的合成 ${comp}，可选：${Object.keys(specs).join(' / ')}`);
  process.exit(1);
}
const spec = specs[comp as keyof typeof specs];
const expectedFrames = spec.frames;
const expectedDuration = expectedFrames / spec.fps;

type Check = {name: string; expected: string; actual: string; pass: boolean};
const checks: Check[] = [];
const check = (name: string, expected: unknown, actual: unknown, pass: boolean) =>
  checks.push({name, expected: String(expected), actual: String(actual), pass});

const fail = (message: string): never => {
  console.error(`❌ 校验失败：${message}`);
  mkdirSync('out', {recursive: true});
  writeFileSync('out/verify-report.md', `❌ 校验失败：${message}\n`);
  process.exit(1);
};

if (!existsSync(file)) {
  fail(`找不到视频文件 ${file}。请先运行 npm run render，或检查渲染步骤是否报错。`);
}

const probeRun = spawnSync('ffprobe', [
  '-v', 'error', '-count_frames', '-show_format', '-show_streams', '-of', 'json', file,
]);
if (probeRun.error) {
  fail(`无法运行 ffprobe（${probeRun.error.message}）。请安装 ffmpeg。`);
}
if (probeRun.status !== 0) {
  fail(`ffprobe 无法读取 ${file}，文件可能不是有效的视频：${probeRun.stderr.toString().trim().slice(0, 300)}`);
}
const probe = JSON.parse(probeRun.stdout.toString());
/** 缺失的值显示为“缺失”，而不是 undefined / NaN */
const show = (value: unknown, unit = '') =>
  value === undefined || value === null || Number.isNaN(value) ? '缺失' : `${value}${unit}`;
const seconds = (value: unknown) =>
  value === undefined || Number.isNaN(Number(value)) ? '缺失' : `${Number(value).toFixed(3)} s`;
const video = probe.streams.find((s: {codec_type: string}) => s.codec_type === 'video');
const audio = probe.streams.find((s: {codec_type: string}) => s.codec_type === 'audio');
const [num, den] = String(video?.avg_frame_rate ?? '0/1').split('/').map(Number);
const fps = num / den;
const formatDuration = Number(probe.format.duration);

check('容器格式', 'mp4', show(probe.format.format_name), String(probe.format.format_name).includes('mp4'));
check('视频编码', 'h264', show(video?.codec_name), video?.codec_name === 'h264');
check('分辨率', `${spec.width}×${spec.height}`, video ? `${video.width}×${video.height}` : '缺失',
  video?.width === spec.width && video?.height === spec.height);
check('帧率', `${spec.fps} fps`, video ? `${fps} fps (${video.avg_frame_rate})` : '缺失', fps === spec.fps);
check('总帧数', expectedFrames, show(video?.nb_read_frames), Number(video?.nb_read_frames) === expectedFrames);
check('视频时长', `${expectedDuration.toFixed(3)} s`, seconds(video?.duration),
  Math.abs(Number(video?.duration) - expectedDuration) < 1 / spec.fps);
check('文件时长', `≈${expectedDuration} s`, seconds(formatDuration),
  Math.abs(formatDuration - expectedDuration) < 0.1);
check('像素格式', 'yuv420p（手机兼容）', show(video?.pix_fmt), video?.pix_fmt === 'yuv420p');

if (spec.audio) {
  check('音频轨道', '存在', audio ? '存在' : '缺失', Boolean(audio));
  check('音频编码', 'aac', show(audio?.codec_name), audio?.codec_name === 'aac');
  check('音频参数', '≥44.1 kHz', audio ? `${audio.sample_rate} Hz / ${audio.channels} ch` : '缺失',
    Number(audio?.sample_rate) >= 44100 && Number(audio?.channels) >= 1);
  check('音频时长', `≈${expectedDuration} s`, seconds(audio?.duration),
    Math.abs(Number(audio?.duration) - expectedDuration) < 0.1);
  const vol = spawnSync('ffmpeg', ['-hide_banner', '-i', file, '-map', '0:a', '-af', 'volumedetect', '-f', 'null', '-'])
    .stderr.toString();
  const mean = Number(/mean_volume: (-?[\d.]+) dB/.exec(vol)?.[1] ?? -Infinity);
  const max = Number(/max_volume: (-?[\d.]+) dB/.exec(vol)?.[1] ?? -Infinity);
  check('音频非静音', '平均音量 > -50 dB', Number.isFinite(mean) ? `平均 ${mean} dB / 峰值 ${max} dB` : '无法检测（无音频）', mean > -50);
}

// 完整解码一遍，任何解码错误都视为文件损坏
const decode = spawnSync('ffmpeg', ['-v', 'error', '-i', file, '-f', 'null', '-']);
const decodeErrors = decode.stderr.toString().trim();
check('完整解码', '无错误', decodeErrors === '' ? '无错误' : decodeErrors.slice(0, 200),
  decode.status === 0 && decodeErrors === '');

// moov 在 mdat 之前 → 手机浏览器可边下边播
const buf = readFileSync(file);
const boxes: string[] = [];
let offset = 0;
while (offset + 8 <= buf.length) {
  let size = buf.readUInt32BE(offset);
  const type = buf.toString('latin1', offset + 4, offset + 8);
  if (size === 1) size = Number(buf.readBigUInt64BE(offset + 8));
  if (size === 0) size = buf.length - offset;
  if (size < 8) break;
  boxes.push(type);
  offset += size;
}
// 顶层 box 长度之和必须正好等于文件大小，否则说明文件被截断或尾部有垃圾数据
const sizeMatches = offset === buf.length;
check('MP4 结构', '含 ftyp / moov / mdat，长度与文件一致',
  `${boxes.join(' → ')}${sizeMatches ? '' : `（box 声明 ${offset} 字节，实际文件 ${buf.length} 字节，文件不完整）`}`,
  sizeMatches && ['ftyp', 'moov', 'mdat'].every((b) => boxes.includes(b)));

const report = {
  file,
  sizeBytes: buf.length,
  sha256: createHash('sha256').update(buf).digest('hex'),
  faststart: boxes.indexOf('moov') < boxes.indexOf('mdat'),
  checks,
  passed: checks.every((c) => c.pass),
};
writeFileSync('out/verify-report.json', JSON.stringify(report, null, 2));
/** 表格单元格内不能有换行和竖线 */
const cell = (text: string) => text.replace(/\s*\n\s*/g, ' ').replace(/\|/g, '\\|');
writeFileSync(
  'out/verify-report.md',
  [
    '| 检查项 | 期望 | 实际 | 结果 |',
    '| --- | --- | --- | --- |',
    ...checks.map((c) => `| ${c.name} | ${cell(c.expected)} | ${cell(c.actual)} | ${c.pass ? '✅' : '❌'} |`),
    '',
    `文件大小 ${(buf.length / 1024 / 1024).toFixed(2)} MB · SHA-256 \`${report.sha256}\``,
    '',
  ].join('\n'),
);

for (const c of checks) {
  console.log(`${c.pass ? '✅' : '❌'} ${c.name.padEnd(6, '　')} 期望 ${c.expected}  实际 ${c.actual}`);
}
console.log(`文件大小 ${(buf.length / 1024 / 1024).toFixed(2)} MB · SHA-256 ${report.sha256}`);
if (report.passed) {
  console.log(`全部 ${checks.length} 项通过`);
} else {
  const failed = checks.filter((c) => !c.pass).map((c) => c.name);
  console.error(`❌ ${failed.length} 项未通过：${failed.join('、')}。详见上方表格或 out/verify-report.md。`);
}
process.exit(report.passed ? 0 : 1);
