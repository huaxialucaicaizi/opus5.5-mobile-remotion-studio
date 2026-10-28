// 为《中华五千年》合成原创配乐 + 音效，写入 public/audio/history-bgm.mp3。
//
//   - 旋律：Karplus-Strong 拨弦合成（古筝式音色），D 宫五声音阶，120 BPM
//   - 伴奏：低音拨弦、大鼓、木鱼、碰铃，转场处加古筝“刮奏”
//   - 音效：每个印章落下的“咚”、镜头切换的“嗖”，位置由 src/history/config.ts 自动计算
//
// 用法：npm run bgm:history（改了镜头时长后重新运行即可对齐）
import {spawnSync} from 'node:child_process';
import {mkdirSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {getHistoryDurationInSeconds, getSegments, historyConfig} from '../src/history/config.ts';

const SR = 44100;
const duration = getHistoryDurationInSeconds(historyConfig);
const beat = 60 / historyConfig.bpm;
const N = Math.ceil(duration * SR);
const L = new Float32Array(N);
const R = new Float32Array(N);
const reverbSend = new Float32Array(N);
const out = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'audio', 'history-bgm.mp3');

// 可复现的伪随机数（每次生成结果完全一致）
let seed = 20261028;
const rand = () => {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 2 ** 32;
};

const midiToHz = (m: number) => 440 * 2 ** ((m - 69) / 12);

const mix = (buf: Float32Array, at: number, gain: number, pan = 0, send = 0.25) => {
  const start = Math.round(at * SR);
  const gl = gain * Math.cos(((pan + 1) * Math.PI) / 4);
  const gr = gain * Math.sin(((pan + 1) * Math.PI) / 4);
  for (let i = 0; i < buf.length && start + i < N; i++) {
    if (start + i < 0) continue;
    L[start + i] += buf[i] * gl;
    R[start + i] += buf[i] * gr;
    reverbSend[start + i] += buf[i] * gain * send;
  }
};

/** Karplus-Strong 拨弦：噪声激励 + 平均低通反馈，叠两根微失谐的弦更像古筝 */
const pluck = (freq: number, len: number, brightness = 0.5, decay = 0.996) => {
  const n = Math.round(len * SR);
  const outBuf = new Float32Array(n);
  for (const detune of [1, 1.0025]) {
    // 两点平均的反馈让实际周期变成 M + 0.5 个采样，所以延迟线取 round(P - 0.5)
    const size = Math.max(2, Math.round(SR / (freq * detune) - 0.5));
    const line = new Float32Array(size);
    let prev = 0;
    for (let i = 0; i < size; i++) {
      prev = prev + brightness * (rand() * 2 - 1 - prev); // 激励先低通，控制亮度
      line[i] = prev;
    }
    let last = line[size - 1];
    for (let i = 0; i < n; i++) {
      const j = i % size;
      const v = line[j];
      outBuf[i] += v * 0.5;
      line[j] = decay * 0.5 * (v + last);
      last = v;
    }
  }
  // 起音处加一点“拨片”瞬态
  for (let i = 0; i < Math.min(n, 220); i++) outBuf[i] += (rand() * 2 - 1) * 0.15 * (1 - i / 220);
  return outBuf;
};

const drum = (len = 0.45, f0 = 95, f1 = 48) => {
  const n = Math.round(len * SR);
  const buf = new Float32Array(n);
  let phase = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const f = f1 + (f0 - f1) * Math.exp(-t * 18);
    phase += (2 * Math.PI * f) / SR;
    buf[i] = Math.sin(phase) * Math.exp(-t * 7) + (rand() * 2 - 1) * 0.25 * Math.exp(-t * 60);
  }
  return buf;
};

const woodblock = (pitch = 1) => {
  const n = Math.round(0.09 * SR);
  const buf = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    buf[i] = (Math.sin(2 * Math.PI * 820 * pitch * t) * 0.7 + Math.sin(2 * Math.PI * 1310 * pitch * t) * 0.4) * Math.exp(-t * 55);
  }
  return buf;
};

const bell = () => {
  const n = Math.round(1.6 * SR);
  const buf = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    buf[i] =
      (Math.sin(2 * Math.PI * 2349 * t) * 0.6 + Math.sin(2 * Math.PI * 3520 * t) * 0.3 + Math.sin(2 * Math.PI * 5120 * t) * 0.15) *
      Math.exp(-t * 3.2);
  }
  return buf;
};

/** 镜头切换的“嗖”：带通噪声由弱到强再消失 */
const whoosh = (len = 0.35) => {
  const n = Math.round(len * SR);
  const buf = new Float32Array(n);
  let lp = 0;
  let slow = 0;
  for (let i = 0; i < n; i++) {
    const t = i / n;
    const white = rand() * 2 - 1;
    lp += (0.05 + 0.25 * t) * (white - lp); // 截止频率逐渐升高 → 音高“扫上去”
    slow += 0.02 * (lp - slow); // 减去更慢的低通 = 高通，去掉闷响
    buf[i] = (lp - slow) * 1.6 * Math.sin(Math.PI * t) ** 2;
  }
  return buf;
};

/** 印章落下：低频“咚” + 纸面拍击声 */
const stamp = () => {
  const d = drum(0.5, 120, 52);
  for (let i = 0; i < Math.min(d.length, 1500); i++) d[i] += (rand() * 2 - 1) * 0.6 * Math.exp(-i / 250);
  return d;
};

// ---------- 编曲 ----------
// D 宫五声音阶：D E F# A B，从 D4 到 D6
const SCALE = [62, 64, 66, 69, 71, 74, 76, 78, 81, 83, 86];
const note = (deg: number) => midiToHz(SCALE[Math.max(0, Math.min(SCALE.length - 1, deg))]);

// 两小节（16 个八分音符）的旋律动机，-1 为休止
const MOTIFS: Record<string, number[]> = {
  A: [5, -1, 6, 7, 8, -1, 7, 6, 5, -1, 3, 4, 5, -1, -1, -1],
  B: [7, 8, 9, 8, 7, -1, 5, 6, 7, -1, 6, 5, 3, -1, -1, -1],
  C: [5, 5, 7, -1, 8, 9, 10, -1, 9, 8, 7, -1, 8, -1, -1, -1],
  D: [8, 7, 6, 5, 4, -1, 3, 4, 5, -1, 4, 3, 2, -1, 0, -1],
  E: [3, 4, 5, 7, 5, 4, 3, -1, 4, 5, 7, 8, 7, -1, -1, -1],
};
const ORDER = ['A', 'B', 'A', 'C', 'E', 'D', 'A', 'B', 'C', 'D', 'E', 'B', 'C', 'A', 'D', 'C'];
// 每小节的低音根音（D、B、G、A 循环）
const BASS = [38, 35, 43, 45];

const intro = historyConfig.intro.durationInSeconds;
const eighth = beat / 2;
const bar = beat * 4;

/** 古筝刮奏：沿五声音阶快速上行 */
const gliss = (at: number, from = 0, to = 10, span = 0.45, gain = 0.32) => {
  const steps = to - from;
  for (let k = 0; k <= steps; k++) mix(pluck(note(from + k), 1.4, 0.6), at + (span * k) / steps, gain * (0.6 + 0.4 * (k / steps)), 0.3, 0.4);
};

// 片头：一声大鼓 + 刮奏 + 木鱼渐快
mix(drum(0.9, 80, 40), 0, 0.9, 0, 0.2);
gliss(0.05);
mix(bell(), 0, 0.25, -0.4, 0.5);
for (let i = 0; i < 6; i++) mix(woodblock(1 + (i % 2) * 0.15), 1.5 + i * eighth, 0.25 + i * 0.04, -0.5, 0.1);

// 主体：从第一个时代开始按小节排旋律
const bodyEnd = duration - historyConfig.outro.durationInSeconds;
let motifIndex = 0;
for (let t = intro; t < bodyEnd - 0.01; t += bar * 2) {
  const motif = MOTIFS[ORDER[motifIndex % ORDER.length]];
  motifIndex++;
  motif.forEach((deg, i) => {
    const at = t + i * eighth + (rand() - 0.5) * 0.008;
    if (deg < 0 || at >= bodyEnd) return;
    const accent = i % 4 === 0 ? 1 : 0.78;
    mix(pluck(note(deg), 1.3, 0.55), at, 0.42 * accent, 0.25, 0.3);
  });
}
for (let t = intro, b = 0; t < bodyEnd - 0.01; t += bar, b++) {
  // 低音：每小节根音 + 第三拍五度
  const root = BASS[b % BASS.length];
  mix(pluck(midiToHz(root), 1.8, 0.35, 0.997), t, 0.5, 0, 0.1);
  mix(pluck(midiToHz(root + 7), 1.2, 0.35, 0.997), t + beat * 2, 0.35, 0, 0.1);
  // 鼓：一、三拍；木鱼：反拍，偶数小节加花
  mix(drum(), t, 0.55, 0, 0.05);
  mix(drum(0.35, 85, 50), t + beat * 2, 0.35, 0, 0.05);
  for (let k = 0; k < 4; k++) mix(woodblock(k === 3 ? 1.2 : 1), t + k * beat + eighth, 0.16, -0.45, 0.05);
  if (b % 2 === 1) mix(woodblock(1.35), t + beat * 3 + eighth * 1.5, 0.12, -0.45, 0.05);
  if (b % 4 === 0) mix(bell(), t, 0.12, -0.3, 0.5);
}

// 音效：每个时代开头的“嗖” + 第 0.5 秒（第一拍）印章“咚”，每隔 4 个时代加一次刮奏
for (const seg of getSegments(historyConfig)) {
  if (seg.kind === 'intro') continue;
  mix(whoosh(), seg.start - 0.2, 0.55, 0, 0.15);
  if (seg.kind === 'era') {
    mix(stamp(), seg.start + 0.5, 0.75, 0, 0.12);
    if (seg.index % 4 === 0 && seg.index > 0) gliss(seg.start + 0.02, 3, 10, 0.3, 0.22);
  }
}
// 片头：红笔划掉“五千年”、“一分钟”盖章
mix(whoosh(0.18), 0.93, 0.6, 0.2, 0.1);
mix(stamp(), 1.5, 0.95, 0, 0.15);

// 片尾：上行刮奏 + 印章 + 收束和弦
const outroStart = bodyEnd;
gliss(outroStart, 0, 10, 0.6, 0.35);
mix(stamp(), outroStart + 1, 0.85, 0, 0.15);
for (const deg of [0, 2, 3, 5, 7]) mix(pluck(note(deg), 2.4, 0.45, 0.998), outroStart + 1 + deg * 0.02, 0.3, 0.1, 0.5);
mix(pluck(midiToHz(38), 2.4, 0.3, 0.998), outroStart + 1, 0.5, 0, 0.2);
mix(bell(), outroStart + 1, 0.25, -0.3, 0.6);

// ---------- 混响（Schroeder：4 个梳状滤波 + 2 个全通） ----------
const reverb = (input: Float32Array, offset: number) => {
  const outBuf = new Float32Array(N);
  const combs = [1116, 1188, 1277, 1356].map((d) => ({d: d + offset, buf: new Float32Array(d + offset), i: 0}));
  for (let n = 0; n < N; n++) {
    let acc = 0;
    for (const c of combs) {
      const y = c.buf[c.i];
      c.buf[c.i] = input[n] + y * 0.78;
      c.i = (c.i + 1) % c.d;
      acc += y;
    }
    outBuf[n] = acc / combs.length;
  }
  for (const d of [556, 441]) {
    const buf = new Float32Array(d);
    let i = 0;
    for (let n = 0; n < N; n++) {
      const b = buf[i];
      const y = -outBuf[n] + b;
      buf[i] = outBuf[n] + b * 0.5;
      outBuf[n] = y;
      i = (i + 1) % d;
    }
  }
  return outBuf;
};
const revL = reverb(reverbSend, 0);
const revR = reverb(reverbSend, 23);

// 末尾 1.2 秒淡出，写成 16-bit PCM 交给 ffmpeg
const pcm = Buffer.alloc(N * 4);
const fadeStart = N - Math.round(1.2 * SR);
for (let i = 0; i < N; i++) {
  const fade = i > fadeStart ? 1 - (i - fadeStart) / (N - fadeStart) : 1;
  const l = Math.tanh((L[i] + revL[i] * 0.6) * 0.9) * fade;
  const r = Math.tanh((R[i] + revR[i] * 0.6) * 0.9) * fade;
  pcm.writeInt16LE(Math.round(l * 32767), i * 4);
  pcm.writeInt16LE(Math.round(r * 32767), i * 4 + 2);
}

mkdirSync(dirname(out), {recursive: true});
const ff = spawnSync(
  'ffmpeg',
  [
    '-hide_banner', '-loglevel', 'error', '-y',
    '-f', 's16le', '-ar', String(SR), '-ac', '2', '-i', 'pipe:0',
    '-af', 'highpass=f=35,loudnorm=I=-16:TP=-1.5:LRA=11',
    '-ar', '48000', '-c:a', 'libmp3lame', '-b:a', '192k', out,
  ],
  {input: pcm, stdio: ['pipe', 'inherit', 'inherit']},
);
if (ff.status !== 0) process.exit(ff.status ?? 1);
console.log(`已生成 ${out}（${duration} 秒，${historyConfig.bpm} BPM）`);
