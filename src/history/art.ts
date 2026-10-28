// 线稿插画数据。坐标系为 400×400，渲染时按笔画顺序依次“画”出来。
// 每幅图 = 笔画（strokes）+ 文字标注（labels）。颜色用主题色名：ink / soft / red / gold。

export type InkColor = 'ink' | 'soft' | 'red' | 'gold';
export type Stroke = {d: string; w?: number; c?: InkColor};
export type Label = {
  text: string;
  x: number;
  y: number;
  size: number;
  c?: InkColor;
  /** 竖排 */
  vertical?: boolean;
  /** 在整幅图绘制进度达到多少（0–1）时出现 */
  at: number;
};
export type Art = {strokes: Stroke[]; labels?: Label[]};

// ---------- 画笔工具 ----------
type Pt = [number, number];
const f = (n: number) => Math.round(n * 10) / 10;

const line = (x1: number, y1: number, x2: number, y2: number) => `M ${f(x1)} ${f(y1)} L ${f(x2)} ${f(y2)}`;

const poly = (pts: Pt[], close = false) =>
  pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'} ${f(x)} ${f(y)}`).join(' ') + (close ? ' Z' : '');

const circle = (cx: number, cy: number, r: number) =>
  `M ${f(cx - r)} ${f(cy)} A ${r} ${r} 0 1 0 ${f(cx + r)} ${f(cy)} A ${r} ${r} 0 1 0 ${f(cx - r)} ${f(cy)}`;

const ellipse = (cx: number, cy: number, rx: number, ry: number) =>
  `M ${f(cx - rx)} ${f(cy)} A ${rx} ${ry} 0 1 0 ${f(cx + rx)} ${f(cy)} A ${rx} ${ry} 0 1 0 ${f(cx - rx)} ${f(cy)}`;

const rect = (x: number, y: number, w: number, h: number) => poly([[x, y], [x + w, y], [x + w, y + h], [x, y + h]], true);

/** 水平波浪线 */
const wave = (x0: number, x1: number, y: number, amp: number, periods: number) => {
  const step = (x1 - x0) / (periods * 2);
  let d = `M ${f(x0)} ${f(y)}`;
  for (let i = 0; i < periods * 2; i++) {
    const cx = x0 + step * (i + 0.5);
    const ex = x0 + step * (i + 1);
    d += ` Q ${f(cx)} ${f(y + (i % 2 === 0 ? -amp : amp))} ${f(ex)} ${f(y)}`;
  }
  return d;
};

/** 放射线（太阳光、烟花） */
const rays = (cx: number, cy: number, r0: number, r1: number, n: number, offsetDeg = 0) =>
  Array.from({length: n}, (_, i) => {
    const a = ((360 / n) * i + offsetDeg) * (Math.PI / 180);
    return line(cx + r0 * Math.cos(a), cy + r0 * Math.sin(a), cx + r1 * Math.cos(a), cy + r1 * Math.sin(a));
  });

/** 沿折线生成城墙垛口 */
const battlements = (pts: Pt[], step: number, h: number) => {
  // 先把折线按固定间距重新采样
  const samples: Pt[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const [x1, y1] = pts[i];
    const [x2, y2] = pts[i + 1];
    const len = Math.hypot(x2 - x1, y2 - y1);
    const n = Math.max(1, Math.round(len / step));
    for (let k = 0; k < n; k++) samples.push([x1 + ((x2 - x1) * k) / n, y1 + ((y2 - y1) * k) / n]);
  }
  samples.push(pts[pts.length - 1]);
  let d = `M ${f(samples[0][0])} ${f(samples[0][1])}`;
  for (let i = 0; i < samples.length - 1; i++) {
    const [ax, ay] = samples[i];
    const [bx, by] = samples[i + 1];
    d += i % 2 === 0 ? ` L ${f(ax)} ${f(ay - h)} L ${f(bx)} ${f(by - h)} L ${f(bx)} ${f(by)}` : ` L ${f(bx)} ${f(by)}`;
  }
  return d;
};

const bubble = (cx: number, cy: number, rx: number, ry: number, tx: number, ty: number) => [
  ellipse(cx, cy, rx, ry),
  `M ${f(cx - 8)} ${f(cy + ry - 2)} L ${f(tx)} ${f(ty)} L ${f(cx + 8)} ${f(cy + ry - 1)}`,
];

const bird = (x: number, y: number, s: number) => `M ${f(x - s)} ${f(y - s * 0.4)} Q ${f(x - s * 0.4)} ${f(y - s * 0.6)} ${f(x)} ${f(y)} Q ${f(x + s * 0.4)} ${f(y - s * 0.6)} ${f(x + s)} ${f(y - s * 0.4)}`;

const s = (d: string | string[], c?: InkColor, w?: number): Stroke[] =>
  (Array.isArray(d) ? d : [d]).map((dd) => ({d: dd, c, w}));

// ---------- 插画 ----------

const ridge: Pt[] = [[0, 270], [70, 205], [140, 250], [220, 165], [300, 235], [400, 185]];

export const ART = {
  // 上古：太阳、群山、洪水与治水的大禹
  legend: {
    strokes: [
      ...s(circle(85, 80, 28), 'red'),
      ...s(rays(85, 80, 38, 52, 8, 22), 'red', 3),
      ...s(poly([[140, 250], [200, 150], [250, 215], [300, 120], [360, 230], [400, 195]])),
      ...s(line(20, 272, 140, 272)),
      // 大禹
      ...s(circle(70, 203, 11)),
      ...s([line(70, 214, 70, 245), line(70, 245, 58, 270), line(70, 245, 82, 270)]),
      ...s([line(70, 224, 52, 238), line(70, 224, 93, 214)]),
      ...s(line(93, 214, 108, 176), 'soft'),
      ...s(poly([[101, 170], [113, 167], [116, 181], [104, 184]], true), 'soft'),
      // 洪水
      ...s(wave(10, 390, 300, 10, 6)),
      ...s(wave(30, 370, 330, 8, 6), 'soft'),
      ...s(wave(10, 390, 360, 10, 7)),
    ],
    labels: [{text: '治水', x: 70, y: 150, size: 30, c: 'red', at: 0.55}],
  },

  // 夏商周：青铜鼎 + 甲骨文
  bronze: {
    strokes: [
      ...s('M 110 170 L 290 170 Q 290 290 200 290 Q 110 290 110 170 Z', 'ink', 4.5),
      ...s(line(98, 170, 302, 170), 'ink', 5),
      ...s(['M 135 170 L 135 122 L 165 122 L 165 170', 'M 235 170 L 235 122 L 265 122 L 265 170']),
      ...s(['M 142 272 L 130 345 L 118 345', 'M 200 290 L 200 352 L 188 352', 'M 258 272 L 270 345 L 282 345']),
      ...s(poly([[125, 200], [140, 188], [155, 200], [170, 188], [185, 200], [200, 188], [215, 200], [230, 188], [245, 200], [260, 188], [275, 200]]), 'gold', 3),
      ...s([circle(168, 238, 12), circle(232, 238, 12)], 'gold', 3),
      // 甲骨文：日、月、人
      ...s([circle(52, 62, 20), line(44, 62, 60, 62)], 'red', 3.5),
      ...s('M 350 40 Q 315 70 345 105 Q 330 70 350 40 Z', 'red', 3.5),
      ...s('M 345 140 L 330 195 M 338 162 L 360 180', 'red', 3.5),
    ],
    labels: [
      {text: '日', x: 52, y: 120, size: 22, c: 'soft', at: 0.8},
      {text: '月', x: 332, y: 125, size: 22, c: 'soft', at: 0.85},
      {text: '人', x: 345, y: 225, size: 22, c: 'soft', at: 0.9},
    ],
  },

  // 春秋战国：孔子 + 百家争鸣的对话气泡
  debate: {
    strokes: [
      ...s([circle(200, 222, 26), circle(200, 188, 9)]),
      ...s(['M 190 222 L 194 222', 'M 206 222 L 210 222', 'M 188 240 Q 200 285 212 240']),
      ...s(['M 168 252 L 140 365 L 260 365 L 232 252', 'M 160 290 Q 200 318 240 290']),
      ...s(bubble(100, 78, 52, 38, 160, 175), 'soft', 3),
      ...s(bubble(305, 78, 70, 38, 240, 175), 'soft', 3),
      ...s(bubble(70, 215, 45, 34, 150, 230), 'soft', 3),
      ...s(bubble(335, 215, 45, 34, 250, 230), 'soft', 3),
    ],
    labels: [
      {text: '道', x: 100, y: 90, size: 36, c: 'ink', at: 0.6},
      {text: '兼爱', x: 305, y: 90, size: 34, c: 'ink', at: 0.7},
      {text: '仁', x: 70, y: 227, size: 36, c: 'red', at: 0.8},
      {text: '法', x: 335, y: 227, size: 36, c: 'ink', at: 0.9},
    ],
  },

  // 秦：万里长城
  wall: {
    strokes: [
      ...s(poly(ridge.map(([x, y]) => [x, y + 70] as Pt)), 'soft', 3),
      ...s(poly(ridge)),
      ...s(battlements(ridge.map(([x, y]) => [x, y - 28] as Pt), 14, 9)),
      ...s(rect(200, 100, 40, 40)),
      ...s('M 190 102 Q 220 75 250 102'),
      ...s(rect(212, 115, 16, 25), 'soft', 3),
      ...s(['M 40 90 Q 50 70 70 80 Q 85 62 105 78 Q 120 72 122 90 Z', 'M 300 60 Q 312 42 330 52 Q 345 38 362 54 Q 378 52 376 68 Z'], 'soft', 3),
    ],
    labels: [{text: '书同文 · 车同轨', x: 200, y: 375, size: 26, c: 'red', at: 0.75}],
  },

  // 汉：骆驼与丝路，左上角是纸卷
  silkroad: {
    strokes: [
      ...s(circle(320, 90, 30), 'red'),
      ...s(['M 0 300 Q 100 255 200 300 T 400 290', 'M 0 345 Q 120 305 250 345 T 400 335'], 'soft'),
      ...s('M 120 222 Q 140 160 175 200 Q 205 150 240 205 Q 255 215 262 236 L 125 236 Q 114 231 120 222 Z'),
      ...s('M 258 214 Q 282 190 286 165 L 306 160 Q 313 166 306 173 L 293 176 Q 291 202 262 236'),
      ...s([line(138, 236, 132, 292), line(156, 236, 158, 292), line(232, 236, 228, 292), line(250, 236, 256, 292)]),
      ...s('M 122 224 Q 108 236 112 252'),
      ...s(rect(186, 186, 26, 24), 'red', 3.5),
      ...s([rect(40, 55, 80, 50), circle(40, 80, 9), circle(120, 80, 9)], 'gold', 3),
    ],
    labels: [{text: '纸', x: 80, y: 89, size: 26, c: 'gold', at: 0.9}],
  },

  // 三国：三面旗
  kingdoms: {
    strokes: [
      ...s([line(90, 125, 90, 340), line(200, 95, 200, 340), line(310, 125, 310, 340)], 'ink', 4.5),
      ...s('M 90 125 Q 130 110 170 125 L 170 195 Q 130 180 90 195 Z'),
      ...s('M 200 95 Q 240 80 280 95 L 280 165 Q 240 150 200 165 Z'),
      ...s('M 310 125 Q 340 110 370 125 L 370 195 Q 340 180 310 195 Z'),
      ...s(wave(20, 380, 345, 6, 8), 'soft'),
      ...s(['M 40 345 L 48 328 L 56 345', 'M 345 345 L 353 330 L 361 345'], 'soft', 3),
    ],
    labels: [
      {text: '魏', x: 130, y: 170, size: 44, c: 'red', at: 0.45},
      {text: '蜀', x: 240, y: 140, size: 44, c: 'red', at: 0.6},
      {text: '吴', x: 340, y: 170, size: 40, c: 'red', at: 0.75},
    ],
  },

  // 隋唐：明月、举杯的诗人、运河上的船
  tang: {
    strokes: [
      ...s('M 330 40 A 48 48 0 1 0 342 132 A 38 38 0 1 1 330 40 Z', 'gold', 4),
      ...s([circle(115, 190, 18), 'M 95 178 L 135 178 L 128 163 L 102 163 Z']),
      ...s('M 102 208 Q 92 255 88 282 L 158 282 Q 148 250 130 208'),
      ...s([line(130, 225, 172, 198), 'M 166 188 L 180 188 L 177 200 L 169 200 Z']),
      ...s('M 205 300 Q 280 332 365 300 L 348 322 Q 280 342 222 322 Z'),
      ...s([line(285, 308, 285, 222), 'M 285 228 L 332 258 L 285 290 Z']),
      ...s([wave(10, 390, 345, 7, 7), wave(40, 360, 372, 6, 6)], 'soft'),
    ],
    labels: [{text: '举杯邀明月', x: 40, y: 40, size: 24, c: 'soft', vertical: true, at: 0.7}],
  },

  // 宋：指南针、活字印刷、火药
  song: {
    strokes: [
      ...s([circle(75, 165, 55), circle(75, 165, 42)]),
      ...s(rays(75, 165, 42, 50, 8), 'soft', 3),
      ...s(['M 50 172 Q 75 145 98 165 Q 78 186 50 172 Z', line(98, 165, 122, 155)], 'red', 3.5),
      ...s([0, 1, 2].flatMap((r) => [0, 1, 2].map((c) => rect(158 + c * 30, 120 + r * 30, 26, 26))), 'ink', 3),
      ...s(rays(325, 115, 12, 48, 12), 'red', 3),
      ...s(rays(325, 115, 54, 62, 12, 15), 'gold', 3),
      ...s([rect(310, 180, 30, 55), 'M 325 180 Q 330 168 322 160'], 'ink', 3.5),
      ...s('M 20 300 Q 200 285 380 300', 'soft', 3),
    ],
    labels: [
      {text: '活', x: 171, y: 141, size: 18, at: 0.45},
      {text: '字', x: 201, y: 141, size: 18, at: 0.47},
      {text: '印', x: 231, y: 141, size: 18, at: 0.49},
      {text: '刷', x: 171, y: 171, size: 18, at: 0.51},
      {text: '宋', x: 201, y: 171, size: 18, c: 'red', at: 0.53},
      {text: '书', x: 231, y: 171, size: 18, at: 0.55},
      {text: '文', x: 171, y: 201, size: 18, at: 0.57},
      {text: '章', x: 201, y: 201, size: 18, at: 0.59},
      {text: '版', x: 231, y: 201, size: 18, at: 0.61},
      {text: '指南针', x: 75, y: 265, size: 26, c: 'soft', at: 0.85},
      {text: '活字印刷', x: 200, y: 265, size: 26, c: 'soft', at: 0.9},
      {text: '火药', x: 325, y: 265, size: 26, c: 'soft', at: 0.95},
    ],
  },

  // 元：奔马与草原
  horse: {
    strokes: [
      ...s('M 130 190 Q 200 168 262 184 Q 288 192 290 216 Q 287 240 256 243 Q 200 249 146 241 Q 114 233 117 210 Q 119 195 130 190 Z'),
      ...s(['M 262 185 Q 280 150 300 128', 'M 287 214 Q 302 184 318 160']),
      ...s(['M 300 128 Q 316 117 336 128 L 353 150 Q 357 161 345 164 L 318 160', 'M 304 126 L 299 108 L 313 121']),
      ...s(circle(323, 136, 2.5), 'ink', 3),
      ...s('M 297 133 Q 284 140 287 151 Q 274 156 277 167 Q 265 173 267 184', 'soft', 3),
      ...s(['M 276 236 Q 300 246 318 263 L 331 259', 'M 262 241 Q 285 263 296 286 L 309 285', 'M 150 239 Q 120 251 95 263 L 86 256', 'M 166 243 Q 146 269 136 291 L 124 289']),
      ...s('M 120 200 Q 84 184 60 206 Q 79 200 88 223', 'soft'),
      ...s([line(20, 185, 58, 185), line(8, 210, 46, 210), line(22, 235, 60, 235)], 'soft', 3),
      ...s('M 20 345 Q 20 302 55 297 Q 90 302 90 345 Z', 'ink', 3),
      ...s(rect(47, 320, 16, 25), 'red', 3),
      ...s('M 0 348 Q 120 320 240 348 T 400 343', 'soft'),
    ],
  },

  // 明：郑和宝船
  ship: {
    strokes: [
      ...s('M 50 255 Q 200 300 350 245 L 325 292 Q 200 322 80 296 Z', 'ink', 4.5),
      ...s([line(130, 270, 130, 120), line(200, 282, 200, 90), line(270, 268, 270, 125)]),
      ...s([rect(105, 140, 50, 100), rect(170, 110, 60, 130), rect(245, 145, 50, 95)], 'ink', 3),
      ...s(
        [160, 180, 200, 220].map((y) => line(170, y, 230, y))
          .concat([165, 190, 215].map((y) => line(105, y, 155, y)))
          .concat([170, 195, 220].map((y) => line(245, y, 295, y))),
        'soft',
        2.5,
      ),
      ...s(['M 200 90 L 222 98 L 200 106', 'M 130 120 L 148 127 L 130 134', 'M 270 125 L 288 132 L 270 139'], 'red', 3),
      ...s([wave(0, 400, 320, 8, 7), wave(20, 380, 350, 7, 7)], 'soft'),
      ...s([bird(330, 60, 14), bird(360, 85, 10), bird(60, 70, 12)], 'ink', 3),
    ],
  },

  // 清：宫殿 + 1840 的炮烟
  palace: {
    strokes: [
      ...s(['M 100 98 Q 110 112 122 110 L 278 110 Q 290 112 300 98']),
      ...s(['M 122 110 Q 108 150 66 162', 'M 278 110 Q 292 150 334 162', 'M 66 162 Q 200 150 334 162']),
      ...s([line(100, 160, 100, 198), line(300, 160, 300, 198)], 'ink', 3),
      ...s(['M 100 198 Q 70 214 38 222', 'M 300 198 Q 330 214 362 222', 'M 38 222 Q 200 206 362 222']),
      ...s(rect(90, 220, 220, 78)),
      ...s([130, 170, 230, 270].map((x) => line(x, 222, x, 298)), 'soft', 3),
      ...s(['M 180 298 L 180 250 Q 200 236 220 250 L 220 298'], 'red', 3.5),
      ...s([rect(60, 298, 280, 22), rect(160, 320, 80, 18)], 'ink', 3),
      ...s([circle(345, 60, 16), circle(368, 74, 12), circle(330, 82, 12)], 'soft', 3),
    ],
    labels: [{text: '1840', x: 350, y: 125, size: 30, c: 'red', at: 0.85}],
  },

  // 近现代：日出 + 两个年份卡片
  sunrise: {
    strokes: [
      ...s(line(20, 250, 380, 250)),
      ...s('M 120 250 A 80 80 0 0 1 280 250', 'red', 4.5),
      // 每 20° 一条，只取地平线以上的 9 条（190°–350°）
      ...s(rays(200, 250, 95, 125, 18, 190).slice(0, 9), 'red', 3),
      ...s([bird(90, 90, 14), bird(125, 70, 10), bird(300, 95, 12)], 'ink', 3),
      ...s([rect(50, 280, 130, 75), rect(220, 280, 130, 75)], 'ink', 3.5),
    ],
    labels: [
      {text: '1912', x: 115, y: 330, size: 40, c: 'ink', at: 0.8},
      {text: '1949', x: 285, y: 330, size: 40, c: 'red', at: 0.92},
    ],
  },

  // 今天：高铁 + 火箭
  future: {
    strokes: [
      ...s('M 300 55 Q 322 78 322 120 L 322 190 L 278 190 L 278 120 Q 278 78 300 55 Z', 'ink', 4),
      ...s([circle(300, 118, 10), 'M 278 165 L 260 195 L 278 190', 'M 322 165 L 340 195 L 322 190']),
      ...s('M 284 192 Q 300 248 316 192', 'red', 4),
      ...s([circle(270, 238, 12), circle(300, 252, 14), circle(330, 238, 12)], 'soft', 3),
      ...s('M 20 300 L 230 300 Q 320 300 372 278 Q 340 252 270 250 L 20 250 Z', 'ink', 4.5),
      ...s([line(45, 266, 230, 266), 'M 255 262 Q 300 262 330 270'], 'soft', 3),
      ...s('M 20 288 L 240 288 Q 320 288 360 282', 'red', 3.5),
      ...s(line(0, 318, 400, 318), 'ink', 3.5),
      ...s(Array.from({length: 13}, (_, i) => line(10 + i * 30, 318, 22 + i * 30, 332)), 'soft', 3),
    ],
  },
} satisfies Record<string, Art>;

export type ArtKey = keyof typeof ART;

/** 片头/片尾的大圆（禅意“一笔圆”） */
export const ENSO = 'M 330 210 C 335 120 260 60 190 66 C 110 72 58 140 64 215 C 70 295 140 345 215 338 C 290 330 335 275 322 200';
