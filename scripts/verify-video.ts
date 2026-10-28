// 用 ffprobe / ffmpeg 校验渲染出的 MP4 是否符合 video.config.ts 的规格。
// 用法：node scripts/verify-video.ts out/ai-explainer.mp4
// 结果写入 out/verify-report.json，任一项不通过时以非零状态码退出。
import {execFileSync, spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFileSync, writeFileSync} from 'node:fs';
import {getTotalFrames} from '../src/config/timing.ts';
import {videoConfig} from '../src/config/video.config.ts';

const file = process.argv[2] ?? 'out/ai-explainer.mp4';
const expectedFrames = getTotalFrames(videoConfig);
const expectedDuration = expectedFrames / videoConfig.fps;

type Check = {name: string; expected: string; actual: string; pass: boolean};
const checks: Check[] = [];
const check = (name: string, expected: unknown, actual: unknown, pass: boolean) =>
  checks.push({name, expected: String(expected), actual: String(actual), pass});

const probe = JSON.parse(
  execFileSync('ffprobe', [
    '-v', 'error', '-count_frames', '-show_format', '-show_streams', '-of', 'json', file,
  ]).toString(),
);
const video = probe.streams.find((s: {codec_type: string}) => s.codec_type === 'video');
const audio = probe.streams.find((s: {codec_type: string}) => s.codec_type === 'audio');
const [num, den] = String(video?.avg_frame_rate ?? '0/1').split('/').map(Number);
const fps = num / den;
const formatDuration = Number(probe.format.duration);

check('容器格式', 'mp4', probe.format.format_name, String(probe.format.format_name).includes('mp4'));
check('视频编码', 'h264', video?.codec_name, video?.codec_name === 'h264');
check('分辨率', `${videoConfig.width}×${videoConfig.height}`, `${video?.width}×${video?.height}`,
  video?.width === videoConfig.width && video?.height === videoConfig.height);
check('帧率', `${videoConfig.fps} fps`, `${fps} fps (${video?.avg_frame_rate})`, fps === videoConfig.fps);
check('总帧数', expectedFrames, video?.nb_read_frames, Number(video?.nb_read_frames) === expectedFrames);
check('视频时长', `${expectedDuration.toFixed(3)} s`, `${Number(video?.duration).toFixed(3)} s`,
  Math.abs(Number(video?.duration) - expectedDuration) < 1 / videoConfig.fps);
check('文件时长', `≈${expectedDuration} s`, `${formatDuration.toFixed(3)} s`,
  Math.abs(formatDuration - expectedDuration) < 0.1);
check('像素格式', 'yuv420p（手机兼容）', video?.pix_fmt, video?.pix_fmt === 'yuv420p');

if (videoConfig.audio.enabled) {
  check('音频轨道', '存在', audio ? '存在' : '缺失', Boolean(audio));
  check('音频编码', 'aac', audio?.codec_name, audio?.codec_name === 'aac');
  check('音频参数', '≥44.1 kHz', `${audio?.sample_rate} Hz / ${audio?.channels} ch`,
    Number(audio?.sample_rate) >= 44100 && Number(audio?.channels) >= 1);
  check('音频时长', `≈${expectedDuration} s`, `${Number(audio?.duration).toFixed(3)} s`,
    Math.abs(Number(audio?.duration) - expectedDuration) < 0.1);
  const vol = spawnSync('ffmpeg', ['-hide_banner', '-i', file, '-map', '0:a', '-af', 'volumedetect', '-f', 'null', '-'])
    .stderr.toString();
  const mean = Number(/mean_volume: (-?[\d.]+) dB/.exec(vol)?.[1] ?? -Infinity);
  const max = Number(/max_volume: (-?[\d.]+) dB/.exec(vol)?.[1] ?? -Infinity);
  check('音频非静音', '平均音量 > -50 dB', `平均 ${mean} dB / 峰值 ${max} dB`, mean > -50);
}

// 完整解码一遍，任何解码错误都视为文件损坏
const decode = spawnSync('ffmpeg', ['-v', 'error', '-i', file, '-f', 'null', '-']);
const decodeErrors = decode.stderr.toString().trim();
check('完整解码', '无错误', decodeErrors === '' ? '无错误' : decodeErrors.slice(0, 200),
  decode.status === 0 && decodeErrors === '');

// moov 在 mdat 之前 → 手机浏览器可边下边播
const buf = readFileSync(file);
const boxes: string[] = [];
for (let offset = 0; offset + 8 <= buf.length; ) {
  let size = buf.readUInt32BE(offset);
  const type = buf.toString('latin1', offset + 4, offset + 8);
  if (size === 1) size = Number(buf.readBigUInt64BE(offset + 8));
  if (size === 0) size = buf.length - offset;
  if (size < 8) break;
  boxes.push(type);
  offset += size;
}
check('MP4 结构', '含 ftyp / moov / mdat', boxes.join(' → '),
  ['ftyp', 'moov', 'mdat'].every((b) => boxes.includes(b)));

const report = {
  file,
  sizeBytes: buf.length,
  sha256: createHash('sha256').update(buf).digest('hex'),
  faststart: boxes.indexOf('moov') < boxes.indexOf('mdat'),
  checks,
  passed: checks.every((c) => c.pass),
};
writeFileSync('out/verify-report.json', JSON.stringify(report, null, 2));
writeFileSync(
  'out/verify-report.md',
  [
    '| 检查项 | 期望 | 实际 | 结果 |',
    '| --- | --- | --- | --- |',
    ...checks.map((c) => `| ${c.name} | ${c.expected} | ${c.actual} | ${c.pass ? '✅' : '❌'} |`),
    '',
    `文件大小 ${(buf.length / 1024 / 1024).toFixed(2)} MB · SHA-256 \`${report.sha256}\``,
    '',
  ].join('\n'),
);

for (const c of checks) {
  console.log(`${c.pass ? '✅' : '❌'} ${c.name.padEnd(6, '　')} 期望 ${c.expected}  实际 ${c.actual}`);
}
console.log(`文件大小 ${(buf.length / 1024 / 1024).toFixed(2)} MB · SHA-256 ${report.sha256}`);
console.log(report.passed ? '全部通过' : '存在未通过项');
process.exit(report.passed ? 0 : 1);
