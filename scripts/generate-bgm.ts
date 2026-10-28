// 合成一段原创氛围背景音乐（无版权问题），写入 public/audio/bgm.mp3。
// 用法：npm run bgm            （默认 30 秒）
//       npm run bgm -- 45      （指定秒数）
import {spawnSync} from 'node:child_process';
import {mkdirSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';

const duration = Number(process.argv[2] ?? 30);
const sampleRate = 48000;
const out = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'audio', 'bgm.mp3');

// Am - F - C - G 和弦进行，每个和弦 2 秒，BPM 120
const chords = [
  [220.0, 261.63, 329.63],
  [174.61, 220.0, 261.63],
  [261.63, 329.63, 392.0],
  [196.0, 246.94, 293.66],
];
const arp = [0, 1, 2, 1];

const total = Math.round(duration * sampleRate);
const pcm = Buffer.alloc(total * 4); // 16-bit stereo
for (let i = 0; i < total; i++) {
  const t = i / sampleRate;
  const chord = chords[Math.floor(t / 2) % chords.length];
  const swell = 0.75 + 0.25 * Math.sin(2 * Math.PI * 0.25 * t);
  let pad = 0;
  for (const f of chord) {
    pad += Math.sin(2 * Math.PI * f * t) + 0.25 * Math.sin(2 * Math.PI * f * 2.003 * t);
  }
  pad *= 0.06 * swell;
  // 低音：每拍一次衰减脉冲
  const beatT = t % 0.5;
  const bass = 0.22 * Math.sin(2 * Math.PI * (chord[0] / 2) * t) * Math.exp(-5 * beatT);
  // 琶音：每 1/4 拍一个音
  const noteT = t % 0.25;
  const note = chord[arp[Math.floor(t / 0.25) % arp.length]] * 2;
  const pluck = 0.07 * Math.sin(2 * Math.PI * note * t) * Math.exp(-14 * noteT);
  const pan = 0.15 * Math.sin(2 * Math.PI * 0.1 * t);
  const l = Math.max(-1, Math.min(1, pad + bass + pluck * (1 - pan)));
  const r = Math.max(-1, Math.min(1, pad + bass + pluck * (1 + pan)));
  pcm.writeInt16LE(Math.round(l * 32767), i * 4);
  pcm.writeInt16LE(Math.round(r * 32767), i * 4 + 2);
}

mkdirSync(dirname(out), {recursive: true});
const ffmpeg = spawnSync(
  'ffmpeg',
  [
    '-hide_banner', '-loglevel', 'error', '-y',
    '-f', 's16le', '-ar', String(sampleRate), '-ac', '2', '-i', 'pipe:0',
    '-af', `aecho=0.8:0.5:180:0.25,lowpass=f=4000,afade=t=in:d=1.5,afade=t=out:st=${duration - 2}:d=2,loudnorm=I=-18:TP=-2`,
    '-ar', String(sampleRate), '-c:a', 'libmp3lame', '-b:a', '128k', out,
  ],
  {input: pcm, stdio: ['pipe', 'inherit', 'inherit']},
);
if (ffmpeg.status !== 0) {
  process.exit(ffmpeg.status ?? 1);
}
console.log(`已生成 ${out}（${duration} 秒）`);
