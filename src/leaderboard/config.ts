// ============================================================
// 《大模型的「高考」：AI 榜单怎么看？》内容配置 —— 改文案、时长、颜色只改这个文件
//
// 规则：
//   - 所有时间单位都是秒；at 是相对于所在镜头开头的时间
//   - 配乐 120 BPM（每拍 0.5 秒），时间尽量用 0.5 的整数倍，画面才能踩在拍子上
//   - 主持人台词用 \n 手动断行，每行不超过 13 个字
//   - 内容刻意不写“现在谁排第几”：榜单每周都在变，写死名次很快就会过时
//   - 改完时长或时间点后运行 npm run bgm:leaderboard 重新生成配乐和音效
// ============================================================

export type Sfx = 'pop' | 'ding' | 'boing' | 'bling' | 'whoosh' | 'buzz' | 'click';
export type HostLine = {at: number; text: string};
export type BotColor = 'pink' | 'mint' | 'sky' | 'lemon' | 'lavender' | 'coral';

type Base = {duration: number; chip: string; title: string; host: HostLine[]};

export type Scene =
  | (Base & {kind: 'hook'; bots: {color: BotColor; at: number}[]; titleAt: number})
  | (Base & {kind: 'podium'; blocks: number[]; botsAt: number[]; crownAt: number})
  | (Base & {kind: 'schools'; left: {name: string; desc: string; at: number}; right: {name: string; desc: string; at: number}; vsAt: number})
  | (Base & {kind: 'cards'; cards: {tag: string; name: string; desc: string; color: BotColor; at: number}[]})
  | (Base & {
      kind: 'arena';
      question: string;
      questionAt: number;
      answerAt: [number, number];
      voteAt: number;
      revealAt: number;
      scoreAt: number;
      scores: {from: number; delta: number};
    })
  | (Base & {kind: 'bars'; note: string; bars: {label: string; value: number; color: BotColor; at: number}[]})
  | (Base & {
      kind: 'pitfalls';
      pits: {title: string; desc: string; term: string; mood: 'sweat' | 'meh' | 'fancy'; at: number}[];
      quote: {text: string; source: string; at: number};
    })
  | (Base & {kind: 'checklist'; items: {text: string; at: number}[]})
  | (Base & {kind: 'outro'; botsAt: number; titleAt: number; subtitle: string; subtitleAt: number});

export const leaderboardConfig = {
  width: 1080,
  height: 1920,
  fps: 30,
  bpm: 120,

  theme: {
    bgTop: '#FFF1EC',
    bgBottom: '#E8F3FF',
    ink: '#3D2C3E',
    inkSoft: '#7A6878',
    card: '#FFFFFF',
    face: '#FFF8F1',
    blush: '#FF9DB5',
    gold: '#FFC93C',
    colors: {
      pink: '#FF8FB1',
      mint: '#73D9BF',
      sky: '#86BEFF',
      lemon: '#FFD866',
      lavender: '#B9A3FF',
      coral: '#FF9E7A',
    } satisfies Record<BotColor, string>,
    font: '"ZCOOL KuaiLe", "PingFang SC", "Microsoft YaHei", sans-serif',
  },

  audio: {enabled: true, src: 'audio/leaderboard-bgm.mp3', volume: 0.9},

  scenes: [
    {
      kind: 'hook',
      duration: 5,
      chip: 'AI 小课堂',
      title: '大模型「高考」\n放榜啦！',
      titleAt: 2,
      bots: [
        {color: 'pink', at: 0.5},
        {color: 'sky', at: 0.75},
        {color: 'lemon', at: 1},
        {color: 'mint', at: 1.25},
        {color: 'lavender', at: 1.5},
      ],
      host: [{at: 2.5, text: '这么多 AI 考生，\n到底谁考得最好？'}],
    },
    {
      kind: 'podium',
      duration: 8,
      chip: '第 1 课',
      title: '榜单是什么？',
      blocks: [1, 1.5, 2],
      botsAt: [2.5, 3, 3.5],
      crownAt: 4.5,
      host: [
        {at: 0.5, text: '榜单，就是大模型的\n「高考成绩单」！'},
        {at: 4, text: '按分数排座次，\n状元、榜眼、探花～'},
      ],
    },
    {
      kind: 'schools',
      duration: 6,
      chip: '第 2 课',
      title: '笔试 & 面试',
      left: {name: '考试派', desc: '像笔试：统一出卷\n按分数排名', at: 1},
      right: {name: '投票派', desc: '像面试：真人考官\n看谁答得好', at: 2},
      vsAt: 3,
      host: [{at: 0.5, text: '大模型的「高考」\n也分笔试和面试'}],
    },
    {
      kind: 'cards',
      duration: 14,
      chip: '笔试',
      title: '五张“名卷”',
      cards: [
        {tag: 'MMLU', name: '文理大综合', desc: '57 门学科，从历史到医学', color: 'sky', at: 1.5},
        {tag: 'GPQA', name: '压轴难题', desc: '博士级题目，上网也搜不到答案', color: 'lavender', at: 3.5},
        {tag: 'AIME', name: '数学竞赛卷', desc: '美国数学邀请赛的竞赛题', color: 'lemon', at: 5.5},
        {tag: 'SWE-bench', name: '上机实操', desc: '修复 GitHub 开源项目的真 bug', color: 'mint', at: 7.5},
        {tag: 'HLE', name: '史上最难卷', desc: '「人类最后的考试」，约 2500 道', color: 'pink', at: 9.5},
      ],
      host: [
        {at: 0.5, text: '笔试：统一出卷，\n看 AI 能答对多少'},
        {at: 11, text: '卷子越出越难，\n考生也越来越卷～'},
      ],
    },
    {
      kind: 'cards',
      duration: 7,
      chip: '笔试',
      title: '语文专场',
      cards: [
        {tag: 'C-Eval', name: '中文学科考', desc: '覆盖 52 个学科', color: 'coral', at: 1},
        {tag: 'SuperCLUE', name: '中文综合卷', desc: '中文通用大模型综合基准', color: 'sky', at: 2.5},
        {tag: '司南', name: 'OpenCompass', desc: '上海人工智能实验室的开源评测体系', color: 'mint', at: 4},
      ],
      host: [{at: 0.5, text: '中文好不好，\n有专门的「语文卷」'}],
    },
    {
      kind: 'arena',
      duration: 12,
      chip: '面试',
      title: '双盲面试：竞技场',
      question: '面试题：写一首\n关于猫的小诗',
      questionAt: 1,
      answerAt: [2, 2.5],
      voteAt: 5,
      revealAt: 6.5,
      scoreAt: 7.5,
      scores: {from: 1200, delta: 12},
      host: [
        {at: 0.5, text: '代表：LMArena\n（原 Chatbot Arena）'},
        {at: 3.5, text: '考官不知道考生是谁，\n只管选答得更好的'},
        {at: 8.5, text: '赢了加分、输了扣分，\n像下棋一样算积分'},
      ],
    },
    {
      kind: 'bars',
      duration: 6,
      chip: '综合评价',
      title: '综合素质评价',
      note: '如 Artificial Analysis · 数值仅为示意',
      bars: [
        {label: '考试分数', value: 0.82, color: 'lavender', at: 1},
        {label: '答题速度', value: 0.64, color: 'sky', at: 1.5},
        {label: '「学费」', value: 0.73, color: 'mint', at: 2},
      ],
      host: [{at: 0.5, text: '综合榜：分数、速度、\n价格一起看'}],
    },
    {
      kind: 'pitfalls',
      duration: 15,
      chip: '注意',
      title: '看榜的三个坑',
      pits: [
        {title: '押中原题', desc: '考题混进了训练数据，分数虚高', term: '数据污染', mood: 'sweat', at: 1.5},
        {title: '卷子太简单', desc: '人人都快满分，拉不开差距', term: '榜单饱和', mood: 'meh', at: 5},
        {title: '面试嘴甜', desc: '考官可能偏爱长篇、格式漂亮的回答', term: '风格偏好', mood: 'fancy', at: 8.5},
      ],
      quote: {text: '指标一旦变成目标，\n就不再是好指标', source: '古德哈特定律', at: 12},
      host: [
        {at: 0.5, text: '高分不一定高能，\n小心这三个坑！'},
        {at: 12, text: '应试高手，\n不一定是实战高手'},
      ],
    },
    {
      kind: 'checklist',
      duration: 12,
      chip: '报志愿',
      title: '像报志愿一样看榜',
      items: [
        {text: '多看几份榜，别只信一个总分', at: 1.5},
        {text: '看单科：写代码看 SWE-bench，\n中文看中文榜', at: 3.5},
        {text: '看「学费」：价格和速度也重要', at: 5.5},
        {text: '去「试听」：自己亲手试一试！', at: 7.5},
      ],
      host: [
        {at: 0.5, text: '选 AI 就像报志愿，\n记住这四招'},
        {at: 9.5, text: '最好的 AI，\n是最适合你的那个'},
      ],
    },
    {
      kind: 'outro',
      duration: 6,
      chip: '下课啦',
      title: '高分 ≠ 高能，\n适合你的才是好 AI',
      botsAt: 0.5,
      titleAt: 1,
      subtitle: '关注我，下期见～',
      subtitleAt: 2.5,
      host: [],
    },
  ] satisfies Scene[] as Scene[],
};

export type LeaderboardConfig = typeof leaderboardConfig;

export const sceneStarts = (config: LeaderboardConfig) => {
  let t = 0;
  return config.scenes.map((s) => {
    const start = t;
    t += s.duration;
    return start;
  });
};

export const getLeaderboardDuration = (config: LeaderboardConfig) =>
  config.scenes.reduce((sum, s) => sum + s.duration, 0);

export const getLeaderboardFrames = (config: LeaderboardConfig) =>
  config.scenes.reduce((sum, s) => sum + Math.round(s.duration * config.fps), 0);

/** 所有音效事件（绝对时间，秒）。画面和配乐用同一份时间表，保证对齐 */
export const getSfxEvents = (config: LeaderboardConfig) => {
  const events: {t: number; sfx: Sfx}[] = [];
  const starts = sceneStarts(config);
  config.scenes.forEach((s, i) => {
    const t0 = starts[i];
    const add = (at: number, sfx: Sfx) => events.push({t: t0 + at, sfx});
    if (i > 0) add(-0.15, 'whoosh');
    s.host.forEach((h) => add(h.at, 'click'));
    switch (s.kind) {
      case 'hook':
        s.bots.forEach((b) => add(b.at, 'pop'));
        add(s.titleAt, 'ding');
        break;
      case 'podium':
        s.blocks.forEach((at) => add(at, 'pop'));
        s.botsAt.forEach((at) => add(at, 'boing'));
        add(s.crownAt, 'bling');
        break;
      case 'schools':
        add(s.left.at, 'pop');
        add(s.right.at, 'pop');
        add(s.vsAt, 'ding');
        break;
      case 'cards':
        s.cards.forEach((c) => add(c.at, 'pop'));
        break;
      case 'arena':
        add(s.questionAt, 'pop');
        s.answerAt.forEach((at) => add(at, 'pop'));
        add(s.voteAt, 'ding');
        add(s.revealAt, 'whoosh');
        add(s.scoreAt, 'bling');
        break;
      case 'bars':
        s.bars.forEach((b) => add(b.at, 'pop'));
        break;
      case 'pitfalls':
        s.pits.forEach((p) => add(p.at, 'buzz'));
        add(s.quote.at, 'ding');
        break;
      case 'checklist':
        s.items.forEach((it) => add(it.at, 'ding'));
        break;
      case 'outro':
        add(s.botsAt, 'boing');
        add(s.titleAt, 'bling');
        break;
    }
  });
  return events.sort((a, b) => a.t - b.t);
};
