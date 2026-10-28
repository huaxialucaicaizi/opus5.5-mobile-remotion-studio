// ============================================================
// 《中华五千年 · 一分钟速通》内容配置 —— 改文案、时长、颜色只需要改这个文件
//
// 规则：
//   - 视频总时长 = intro + 各时代 + outro 的 durationInSeconds 之和
//   - 背景音乐是 120 BPM（每拍 0.5 秒），时长保持 0.5 秒的整数倍，画面和节拍才能对齐
//   - year：负数表示公元前，例如 -221 = 公元前 221 年
//   - art：插画名称，可选值见 src/history/art.ts 里的 ART
//   - 改完时长后运行 npm run bgm:history 重新生成配乐（音效位置会自动对齐）
// ============================================================

import type {ArtKey} from './art';

export type Era = {
  /** 印章上的字（1–4 个字） */
  seal: string;
  /** 年份，负数为公元前 */
  year: number;
  /** 是否在年份前加“约” */
  approx?: boolean;
  /** 时代标题（毛笔字） */
  title: string;
  /** 俏皮的一句话解说。用 \\n 手动断行（每行不超过 16 个字），避免把词拆到两行 */
  caption: string;
  /** 解说里要用红笔圈出的词（需要在 caption 中出现） */
  highlight?: string;
  /** 时间轴上的短标签 */
  short: string;
  art: ArtKey;
  durationInSeconds: number;
};

export const historyConfig = {
  width: 1080,
  height: 1920,
  fps: 30,
  bpm: 120,

  theme: {
    paper: '#F3EAD7',
    paperShade: '#E4D5B7',
    ink: '#2B2522',
    inkSoft: '#6E6258',
    red: '#C8372D',
    gold: '#B8862B',
    titleFont: '"Ma Shan Zheng", "STKaiti", "KaiTi", serif',
    bodyFont: '"ZCOOL KuaiLe", "PingFang SC", "Microsoft YaHei", sans-serif',
  },

  audio: {
    enabled: true,
    src: 'audio/history-bgm.mp3',
    volume: 0.9,
  },

  intro: {
    durationInSeconds: 3.5,
    from: '五千年',
    to: '一分钟',
    subtitle: '中华历史 · 速通版',
  },

  eras: [
    {
      seal: '上古',
      year: -3000,
      approx: true,
      title: '三皇五帝',
      caption: '炎黄子孙从这里出发；\n大禹治水，三过家门而不入——\n史上最强加班人',
      highlight: '最强加班人',
      short: '上古',
      art: 'legend',
      durationInSeconds: 4.5,
    },
    {
      seal: '夏商周',
      year: -2070,
      approx: true,
      title: '青铜与甲骨',
      caption: '铸大鼎、刻甲骨，\n老祖宗开始“写日记”了',
      highlight: '写日记',
      short: '夏商周',
      art: 'bronze',
      durationInSeconds: 5,
    },
    {
      seal: '春秋',
      year: -770,
      title: '百家争鸣',
      caption: '孔子讲仁，老子说道，墨子兼爱——\n古代最热闹的辩论综艺',
      highlight: '辩论综艺',
      short: '春秋战国',
      art: 'debate',
      durationInSeconds: 5,
    },
    {
      seal: '秦',
      year: -221,
      title: '天下一统',
      caption: '秦始皇统一六国：\n文字、货币、度量衡，统统统一！',
      highlight: '统统统一',
      short: '秦',
      art: 'wall',
      durationInSeconds: 4.5,
    },
    {
      seal: '汉',
      year: -202,
      title: '丝绸之路',
      caption: '张骞出使西域，丝路开张；\n蔡伦改进造纸，读书更方便',
      highlight: '丝路开张',
      short: '汉',
      art: 'silkroad',
      durationInSeconds: 4.5,
    },
    {
      seal: '三国',
      year: 220,
      title: '魏蜀吴',
      caption: '天下大势，\n分久必合，合久必分',
      highlight: '分久必合',
      short: '三国',
      art: 'kingdoms',
      durationInSeconds: 4,
    },
    {
      seal: '隋唐',
      year: 581,
      title: '大运河 · 唐诗',
      caption: '大运河贯通南北；\n唐朝诗人多到“超标”——\n床前明月光～',
      highlight: '床前明月光',
      short: '隋唐',
      art: 'tang',
      durationInSeconds: 5,
    },
    {
      seal: '宋',
      year: 960,
      title: '科技点满',
      caption: '活字印刷、指南针、火药，\n宋朝把黑科技玩出了花',
      highlight: '黑科技',
      short: '宋',
      art: 'song',
      durationInSeconds: 4.5,
    },
    {
      seal: '元',
      year: 1271,
      title: '马背王朝',
      caption: '版图超级大，\n地图都快画不下了',
      highlight: '画不下',
      short: '元',
      art: 'horse',
      durationInSeconds: 3.5,
    },
    {
      seal: '明',
      year: 1368,
      title: '郑和下西洋',
      caption: '七下西洋，\n比哥伦布的远航早了将近 90 年',
      highlight: '将近 90 年',
      short: '明',
      art: 'ship',
      durationInSeconds: 4,
    },
    {
      seal: '清',
      year: 1644,
      title: '盛世与变局',
      caption: '康乾盛世之后闭关锁国，\n1840 年，鸦片战争的炮声\n敲开了国门',
      highlight: '1840',
      short: '清',
      art: 'palace',
      durationInSeconds: 4.5,
    },
    {
      seal: '近代',
      year: 1912,
      title: '新的篇章',
      caption: '1912 年，帝制终结；\n1949 年，中华人民共和国成立',
      highlight: '1949',
      short: '近现代',
      art: 'sunrise',
      durationInSeconds: 4,
    },
    {
      seal: '今天',
      year: 2026,
      title: '加速前进',
      caption: '高铁、航天、移动支付……\n五千年，仍在更新中',
      highlight: '仍在更新中',
      short: '今天',
      art: 'future',
      durationInSeconds: 3.5,
    },
  ] satisfies Era[] as Era[],

  outro: {
    durationInSeconds: 3.5,
    title: '未完待续',
    subtitle: '觉得有趣？点个赞，\n下期细讲一个朝代！',
  },
};

export type HistoryConfig = typeof historyConfig;

/** 每一段（片头 / 各时代 / 片尾）的起止时间，单位秒 */
export const getSegments = (config: HistoryConfig) => {
  const segments: {kind: 'intro' | 'era' | 'outro'; index: number; start: number; duration: number}[] = [];
  let t = 0;
  segments.push({kind: 'intro', index: -1, start: t, duration: config.intro.durationInSeconds});
  t += config.intro.durationInSeconds;
  config.eras.forEach((era, index) => {
    segments.push({kind: 'era', index, start: t, duration: era.durationInSeconds});
    t += era.durationInSeconds;
  });
  segments.push({kind: 'outro', index: -1, start: t, duration: config.outro.durationInSeconds});
  return segments;
};

export const getHistoryDurationInSeconds = (config: HistoryConfig) =>
  getSegments(config).reduce((sum, s) => sum + s.duration, 0);

export const formatYear = (year: number, approx = false) =>
  `${approx ? '约' : ''}${year < 0 ? `公元前 ${-year}` : `公元 ${year}`} 年`;
