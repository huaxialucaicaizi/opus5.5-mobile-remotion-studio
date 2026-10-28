// ============================================================
// 视频内容配置 —— 改视频内容只需要改这个文件
//
// 可以直接用自然语言告诉 Claude，例如：
//   “把标题改成『AI 会取代程序员吗？』”
//   “流程图镜头延长到 10 秒，片尾缩短到 3 秒”
//   “背景换成深绿色，强调色用橙色”
//   “第二条字幕改成……”
//
// 规则：
//   - 视频总时长 = 所有镜头 durationInSeconds 之和（目前 5+6+9+6+4 = 30 秒）
//   - 字幕的 start / end 是相对于“所在镜头开头”的秒数
//   - 颜色可以用 #RRGGBB、rgb()、或 CSS 颜色名
// ============================================================

import type {VideoConfig} from './types';

export const videoConfig: VideoConfig = {
  width: 1080,
  height: 1920,
  fps: 30,

  theme: {
    background: '#0B1026',
    glow: '#3B2F9E',
    primary: '#5EEAD4',
    secondary: '#A78BFA',
    text: '#F8FAFC',
    muted: '#94A3B8',
    fontFamily:
      '"Noto Sans CJK SC", "Noto Sans SC", "PingFang SC", "Microsoft YaHei", "WenQuanYi Zen Hei", sans-serif',
  },

  audio: {
    enabled: true,
    src: 'audio/bgm.mp3',
    volume: 0.5,
  },

  subtitleStyle: {
    enabled: true,
    fontSize: 46,
    bottom: 170,
  },

  scenes: [
    // ---------- 镜头 1：标题开场 ----------
    {
      type: 'title',
      durationInSeconds: 5,
      tag: 'AI 科普 · 第 1 期',
      title: '大模型是怎样\n回答问题的？',
      subtitle: '30 秒看懂 AI 背后的原理',
      subtitles: [
        {text: '你有没有好奇过，', start: 0.4, end: 2.4},
        {text: 'AI 是怎么“想”出答案的？', start: 2.4, end: 4.8},
      ],
    },

    // ---------- 镜头 2：关键词动效 ----------
    {
      type: 'keywords',
      durationInSeconds: 6,
      heading: '先记住三个关键词',
      keywords: [
        {word: 'Token', description: '把文字切成小块'},
        {word: '向量', description: '用一串数字表示含义'},
        {word: '注意力', description: '找出最相关的信息'},
      ],
      subtitles: [
        {text: '理解大模型，先记住三个词：', start: 0.2, end: 2.2},
        {text: 'Token、向量、注意力。', start: 2.2, end: 5.8},
      ],
    },

    // ---------- 镜头 3：流程图动画 ----------
    {
      type: 'flow',
      durationInSeconds: 9,
      background: '#0A1A2F',
      heading: '从提问到回答',
      steps: [
        {label: '输入问题', detail: '你输入一句话'},
        {label: '切分 Token', detail: '文字被拆成小块'},
        {label: '理解上下文', detail: '注意力机制找关联'},
        {label: '预测下一个词', detail: '计算每个词的概率'},
        {label: '生成回答', detail: '一个词一个词输出'},
      ],
      subtitles: [
        {text: '你的问题先被切成 Token，', start: 0.3, end: 3},
        {text: '模型用注意力理解上下文，', start: 3, end: 5.8},
        {text: '再一个词一个词地预测出回答。', start: 5.8, end: 8.8},
      ],
    },

    // ---------- 镜头 4：重点结论 ----------
    {
      type: 'conclusion',
      durationInSeconds: 6,
      heading: '一句话总结',
      statement: '大模型不是在“查答案”，而是在根据上下文预测下一个词。',
      highlight: '预测下一个词',
      subtitles: [
        {text: '所以，大模型不是在查答案，', start: 0.3, end: 3},
        {text: '而是在预测最合理的下一个词。', start: 3, end: 5.8},
      ],
    },

    // ---------- 镜头 5：片尾 ----------
    {
      type: 'outro',
      durationInSeconds: 4,
      title: '关注我，下期见',
      subtitle: '下期：AI 为什么会“一本正经地胡说”？',
      handle: '@AI科普小站',
      subtitles: [{text: '点个关注，下期见！', start: 0.3, end: 3.6}],
    },
  ],
};
