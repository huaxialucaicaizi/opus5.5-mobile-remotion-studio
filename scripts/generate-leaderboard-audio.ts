// 为《大模型的「高考」》合成原创配乐 + 音效，写入 public/audio/leaderboard-bgm.mp3。
//
//   - 轻快段：马林巴旋律 + 拨弦低音 + 拍手 + 沙锤，C 大调 I–vi–IV–V，120 BPM
//   - “三个坑”段：A 小调跳音拨弦，弹指代替拍手（偷偷摸摸的感觉）
//   - 片尾：加钟琴琶音
//   - 音效（啵、叮、弹簧、闪光、嗖、呃哦、说话提示音）的时间点全部来自 src/leaderboard/config.ts
//
// 用法：npm run bgm:leaderboard
import {spawnSync} from 'node:child_process';
import {mkdirSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {getLeaderboardDuration, getSfxEvents, leaderboardConfig, sceneStarts, type Sfx} from '../src/leaderboard/config.ts';

const SR = 44100;
const duration = getLeaderboardDuration(leaderboardConfig);
const beat = 60 / leaderboardConfig.bpm;
const eighth = beat / 2;
const bar = beat * 4;
const N = Math.ceil(duration * SR);
const L = new Float32Array(N);
const R = new Float32Array(N);
const send = new Float32Array(N);
const out = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'audio', 'leaderboard-bgm.mp3');

let seed = 20261029;
const rand = () => {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 2 ** 32;
};
const hz = (m: number) => 440 * 2 ** ((m - 69) / 12);

const mix = (buf: Float32Array, at: number, gain: number, pan = 0, rev = 0.2) => {
  const start = Math.round(at * SR);
  const gl = gain * Math.cos(((pan + 1) * Math.PI) / 4);
  const gr = gain * Math.sin(((pan + 1) * Math.PI) / 4);
  for (let i = 0; i < buf.length; i++) {
    const n = start + i;
    if (n < 0 || n >= N) continue;
    L[n] += buf[i] * gl;
    R[n] += buf[i] * gr;
    send[n] += buf[i] * gain * rev;
  }
};

const synth = (len: number, fn: (t: number, i: number) => number) => {
  const n = Math.round(len * SR);
  const b = new Float32Array(n);
  for (let i = 0; i < n; i++) b[i] = fn(i / SR, i);
  return b;
};

// ---------- 音色 ----------
/** 马林巴：基频 + 4 倍泛音（木琴特征）+ 软槌起音 */
const marimba = (m: number, len = 0.6) => {
  const f = hz(m);
  return synth(len, (t) => {
    const env = Math.exp(-t * 7) * Math.min(1, t * 400);
    return env * (Math.sin(2 * Math.PI * f * t) + 0.35 * Math.sin(2 * Math.PI * f * 4 * t) * Math.exp(-t * 20) + 0.08 * Math.sin(2 * Math.PI * f * 9.9 * t) * Math.exp(-t * 45));
  });
};

/** 拨弦（Karplus-Strong），用于低音和“偷偷摸摸”段 */
const pizz = (m: number, len = 0.5, decay = 0.985) => {
  const n = Math.round(len * SR);
  const b = new Float32Array(n);
  const size = Math.max(2, Math.round(SR / hz(m) - 0.5));
  const line = new Float32Array(size);
  let prev = 0;
  for (let i = 0; i < size; i++) {
    prev += 0.45 * (rand() * 2 - 1 - prev);
    line[i] = prev;
  }
  let last = line[size - 1];
  for (let i = 0; i < n; i++) {
    const j = i % size;
    const v = line[j];
    b[i] = v;
    line[j] = decay * 0.5 * (v + last);
    last = v;
  }
  return b;
};

/** 钟琴：高频正弦 + 非谐泛音，长余音 */
const glock = (m: number, len = 1.2) => {
  const f = hz(m);
  return synth(len, (t) => Math.exp(-t * 3.5) * (Math.sin(2 * Math.PI * f * t) + 0.3 * Math.sin(2 * Math.PI * f * 2.76 * t) * Math.exp(-t * 8) + 0.12 * Math.sin(2 * Math.PI * f * 5.4 * t) * Math.exp(-t * 14)));
};

const kick = () => {
  let phase = 0;
  return synth(0.3, (t) => {
    phase += (2 * Math.PI * (50 + 70 * Math.exp(-t * 30))) / SR;
    return Math.sin(phase) * Math.exp(-t * 12);
  });
};

/** 拍手：几次错开的带通噪声 */
const clap = () => {
  let bp = 0;
  let lp = 0;
  return synth(0.22, (t) => {
    const white = rand() * 2 - 1;
    lp += 0.35 * (white - lp);
    bp = white - lp;
    const bursts = [0, 0.011, 0.022].reduce((s, o) => s + (t >= o ? Math.exp(-(t - o) * 90) : 0), 0);
    return bp * (bursts * 0.5 + Math.exp(-t * 18) * 0.5);
  });
};

const shaker = (accent = 1) => {
  let lp = 0;
  return synth(0.08, (t) => {
    const white = rand() * 2 - 1;
    lp += 0.6 * (white - lp);
    return (white - lp) * Math.sin(Math.PI * Math.min(1, t / 0.08)) * 0.6 * accent;
  });
};

const snap = () => synth(0.06, (t) => (rand() * 2 - 1) * Math.exp(-t * 120) + Math.sin(2 * Math.PI * 2200 * t) * Math.exp(-t * 80) * 0.4);

// ---------- 音效 ----------
const SFX: Record<Sfx, () => Float32Array> = {
  // 啵：快速上滑的正弦
  pop: () => {
    let ph = 0;
    return synth(0.12, (t) => {
      ph += (2 * Math.PI * (320 + 900 * Math.min(1, t / 0.05))) / SR;
      return Math.sin(ph) * Math.exp(-t * 30) * Math.min(1, t * 2000);
    });
  },
  // 叮：两个钟琴音
  ding: () => {
    const a = glock(88, 1);
    const b = glock(95, 1);
    const off = Math.round(0.07 * SR);
    for (let i = 0; i + off < a.length; i++) a[i + off] += b[i] * 0.8;
    return a;
  },
  // 弹簧“咚嘤”
  boing: () => {
    let ph = 0;
    return synth(0.45, (t) => {
      ph += (2 * Math.PI * (180 + 160 * Math.min(1, t / 0.08) + 40 * Math.sin(t * 60) * Math.exp(-t * 6))) / SR;
      return Math.sin(ph) * Math.exp(-t * 7);
    });
  },
  // 闪光：钟琴快速上行琶音
  bling: () => {
    const out = new Float32Array(Math.round(1.4 * SR));
    [84, 88, 91, 96].forEach((m, k) => {
      const g = glock(m, 1.1);
      const off = Math.round(k * 0.06 * SR);
      for (let i = 0; i < g.length && i + off < out.length; i++) out[i + off] += g[i] * (0.7 + k * 0.1);
    });
    return out;
  },
  // 嗖：截止频率上扫的噪声
  whoosh: () => {
    let lp = 0;
    let slow = 0;
    const len = 0.3;
    return synth(len, (t) => {
      const white = rand() * 2 - 1;
      lp += (0.04 + 0.3 * (t / len)) * (white - lp);
      slow += 0.02 * (lp - slow);
      return (lp - slow) * 1.8 * Math.sin((Math.PI * t) / len) ** 2;
    });
  },
  // 呃哦：两个下行的方波小音（滤掉刺耳高频）
  buzz: () => {
    let lp = 0;
    return synth(0.45, (t) => {
      const f = t < 0.18 ? 494 : 370;
      const local = t < 0.18 ? t : t - 0.2;
      if (t > 0.18 && t < 0.2) return 0;
      const sq = Math.sign(Math.sin(2 * Math.PI * f * t));
      lp += 0.12 * (sq - lp);
      return lp * Math.exp(-local * 6) * 0.7;
    });
  },
  // 主持人开口时的轻提示音
  click: () => synth(0.05, (t) => Math.sin(2 * Math.PI * 1500 * t) * Math.exp(-t * 90)),
};
const SFX_GAIN: Record<Sfx, number> = {pop: 0.45, ding: 0.35, boing: 0.5, bling: 0.35, whoosh: 0.4, buzz: 0.35, click: 0.12};

// ---------- 编曲 ----------
const BRIGHT_CHORDS = [
  {root: 48, mel: [[72, -1, 76, 79, 76, -1, 72, 74], [79, -1, 79, 76, 72, -1, 76, 79]]},
  {root: 45, mel: [[76, -1, 72, 69, 72, -1, 76, -1], [81, -1, 79, 76, 72, -1, 69, -1]]},
  {root: 41, mel: [[77, -1, 81, 77, 76, -1, 72, -1], [72, 74, 77, -1, 81, -1, 79, 77]]},
  {root: 43, mel: [[74, 76, 79, -1, 79, 77, 76, 74], [79, -1, 74, -1, 71, 74, 79, -1]]},
];
const SNEAKY_CHORDS = [
  {root: 45, mel: [69, -1, -1, 72, -1, 71, -1, 69]},
  {root: 50, mel: [74, -1, -1, 77, -1, 76, -1, 74]},
  {root: 40, mel: [71, -1, -1, 74, -1, 72, -1, 68]},
  {root: 45, mel: [69, -1, 72, -1, 76, -1, -1, -1]},
];

const starts = sceneStarts(leaderboardConfig);
const sceneAt = (t: number) => {
  let idx = 0;
  starts.forEach((s, i) => {
    if (t >= s - 1e-6) idx = i;
  });
  return leaderboardConfig.scenes[idx];
};

const bars = Math.ceil(duration / bar);
let sneakyBar = 0;
for (let b = 0; b < bars; b++) {
  const t0 = b * bar;
  const kind = sceneAt(t0 + 0.01).kind;
  const finale = kind === 'outro';
  if (kind === 'pitfalls') {
    const c = SNEAKY_CHORDS[sneakyBar++ % 4];
    for (let k = 0; k < 8; k++) {
      if (k % 2 === 0) mix(pizz(c.root + (k % 4 === 0 ? 0 : 7), 0.3, 0.97), t0 + k * eighth, 0.75, 0, 0.05);
      mix(shaker(k % 2 ? 0.8 : 0.4), t0 + k * eighth, 0.12, -0.4, 0.02);
      const m = c.mel[k];
      if (m > 0) mix(pizz(m, 0.25, 0.975), t0 + k * eighth, 0.6, 0.3, 0.25);
    }
    mix(kick(), t0, 0.35, 0, 0);
    mix(snap(), t0 + beat, 0.25, -0.3, 0.1);
    mix(snap(), t0 + beat * 3, 0.25, -0.3, 0.1);
    continue;
  }
  const c = BRIGHT_CHORDS[b % 4];
  const mel = c.mel[Math.floor(b / 4) % 2];
  mel.forEach((m, k) => {
    if (m < 0) return;
    const at = t0 + k * eighth + (rand() - 0.5) * 0.006;
    mix(marimba(m), at, k % 2 === 0 ? 0.42 : 0.34, 0.2, 0.25);
    if (finale) mix(glock(m + 12, 0.8), at, 0.12, -0.2, 0.4);
  });
  // 拨弦低音：根音 - 五度 - 根音 - 八度
  [0, 7, 0, 12].forEach((iv, k) => mix(pizz(c.root - 12 + iv, 0.45), t0 + k * beat, 0.5, 0, 0.05));
  mix(kick(), t0, 0.45, 0, 0);
  mix(kick(), t0 + beat * 2, 0.35, 0, 0);
  mix(clap(), t0 + beat, 0.35, 0.1, 0.15);
  mix(clap(), t0 + beat * 3, 0.35, 0.1, 0.15);
  for (let k = 0; k < 8; k++) mix(shaker(k % 2 ? 1 : 0.6), t0 + k * eighth, 0.18, -0.4, 0.02);
  if (b % 4 === 0) mix(glock(96, 1.5), t0, 0.12, -0.3, 0.5);
}

// 片头：钟琴上行
[72, 76, 79, 84, 88].forEach((m, k) => mix(glock(m, 1.2), k * 0.08, 0.22, 0.2, 0.4));

// 片尾收束：C 大三和弦
const end = duration - 2;
[60, 64, 67, 72, 76].forEach((m, k) => mix(marimba(m, 1.6), end + k * 0.03, 0.35, 0, 0.4));
mix(pizz(36, 1.6, 0.995), end, 0.5, 0, 0.1);
mix(SFX.bling(), end, 0.3, 0, 0.5);

for (const e of getSfxEvents(leaderboardConfig)) mix(SFX[e.sfx](), e.t, SFX_GAIN[e.sfx], e.sfx === 'click' ? -0.5 : 0, 0.15);

// ---------- 混响 + 输出 ----------
const reverb = (input: Float32Array, offset: number) => {
  const o = new Float32Array(N);
  const combs = [1116, 1188, 1277, 1356].map((d) => ({d: d + offset, buf: new Float32Array(d + offset), i: 0}));
  for (let n = 0; n < N; n++) {
    let acc = 0;
    for (const c of combs) {
      const y = c.buf[c.i];
      c.buf[c.i] = input[n] + y * 0.74;
      c.i = (c.i + 1) % c.d;
      acc += y;
    }
    o[n] = acc / 4;
  }
  for (const d of [556, 441]) {
    const buf = new Float32Array(d);
    let i = 0;
    for (let n = 0; n < N; n++) {
      const b = buf[i];
      const y = -o[n] + b;
      buf[i] = o[n] + b * 0.5;
      o[n] = y;
      i = (i + 1) % d;
    }
  }
  return o;
};
const rl = reverb(send, 0);
const rr = reverb(send, 23);
const pcm = Buffer.alloc(N * 4);
const fadeStart = N - Math.round(1 * SR);
for (let i = 0; i < N; i++) {
  const fade = i > fadeStart ? 1 - (i - fadeStart) / (N - fadeStart) : 1;
  pcm.writeInt16LE(Math.round(Math.tanh((L[i] + rl[i] * 0.5) * 0.9) * fade * 32767), i * 4);
  pcm.writeInt16LE(Math.round(Math.tanh((R[i] + rr[i] * 0.5) * 0.9) * fade * 32767), i * 4 + 2);
}

mkdirSync(dirname(out), {recursive: true});
const ff = spawnSync(
  'ffmpeg',
  ['-hide_banner', '-loglevel', 'error', '-y', '-f', 's16le', '-ar', String(SR), '-ac', '2', '-i', 'pipe:0', '-af', 'highpass=f=35,loudnorm=I=-16:TP=-1.5:LRA=11', '-ar', '48000', '-c:a', 'libmp3lame', '-b:a', '192k', out],
  {input: pcm, stdio: ['pipe', 'inherit', 'inherit']},
);
if (ff.status !== 0) process.exit(ff.status ?? 1);
console.log(`已生成 ${out}（${duration} 秒，${leaderboardConfig.bpm} BPM，${getSfxEvents(leaderboardConfig).length} 个音效）`);
