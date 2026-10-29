import React from 'react';
import {AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {Bot} from './Bot';
import type {BotColor, LeaderboardConfig, Scene} from './config';

type Theme = LeaderboardConfig['theme'];
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

/** 从 at 秒开始的弹簧值（0→1，略微过冲） */
export const usePop = (at: number, damping = 10) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return spring({frame: frame - Math.round(at * fps), fps, config: {damping, mass: 0.6, stiffness: 170}});
};

const useSecond = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return frame / fps;
};

export const sticker = (theme: Theme, bg: string = theme.card): React.CSSProperties => ({
  backgroundColor: bg,
  border: `6px solid ${theme.ink}`,
  borderRadius: 36,
  boxShadow: `10px 12px 0 ${theme.ink}`,
});

/** 粉蓝渐变背景 + 慢慢漂浮的小圆点和星星 */
export const Background: React.FC<{theme: Theme}> = ({theme}) => {
  const frame = useCurrentFrame();
  const shapes = Array.from({length: 18}, (_, i) => {
    const colors = Object.values(theme.colors);
    const x = (i * 197) % 1080;
    const y = (i * 331 + frame * (0.6 + (i % 3) * 0.25)) % 2100 - 100;
    return {x, y: 1920 - y, r: 10 + (i % 4) * 7, c: colors[i % colors.length], star: i % 3 === 0, rot: frame * (i % 2 ? 1 : -1)};
  });
  return (
    <AbsoluteFill style={{background: `linear-gradient(180deg, ${theme.bgTop} 0%, ${theme.bgBottom} 100%)`}}>
      <svg width={1080} height={1920}>
        {shapes.map((s, i) =>
          s.star ? (
            <path
              key={i}
              d="M 0 -1 L 0.25 -0.25 L 1 0 L 0.25 0.25 L 0 1 L -0.25 0.25 L -1 0 L -0.25 -0.25 Z"
              transform={`translate(${s.x} ${s.y}) rotate(${s.rot}) scale(${s.r * 1.4})`}
              fill={s.c}
              opacity={0.35}
            />
          ) : (
            <circle key={i} cx={s.x} cy={s.y} r={s.r} fill={s.c} opacity={0.22} />
          ),
        )}
      </svg>
    </AbsoluteFill>
  );
};

/** 顶部：小标签 + 大标题 */
const Heading: React.FC<{theme: Theme; chip: string; title: string; top?: number; size?: number}> = ({
  theme,
  chip,
  title,
  top = 120,
  size = 92,
}) => {
  const chipPop = usePop(0.1);
  const titlePop = usePop(0.25, 12);
  return (
    <div style={{position: 'absolute', top, left: 60, right: 60, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22}}>
      <div
        style={{
          ...sticker(theme, theme.colors.lemon),
          borderRadius: 999,
          boxShadow: `6px 7px 0 ${theme.ink}`,
          padding: '10px 36px',
          fontSize: 40,
          color: theme.ink,
          transform: `scale(${chipPop}) rotate(-3deg)`,
        }}
      >
        {chip}
      </div>
      <div
        style={{
          fontSize: size,
          lineHeight: 1.2,
          color: theme.ink,
          textAlign: 'center',
          whiteSpace: 'pre-line',
          transform: `scale(${0.6 + titlePop * 0.4})`,
          opacity: titlePop,
          WebkitTextStroke: `2px ${theme.ink}`,
        }}
      >
        {title}
      </div>
    </div>
  );
};

/** 镜头进出：轻轻放大进入，向上淡出 */
const SceneFrame: React.FC<{duration: number; children: React.ReactNode}> = ({duration, children}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const total = Math.round(duration * fps);
  const enter = interpolate(frame, [0, 8], [0, 1], {...clamp, easing: Easing.out(Easing.back(1.6))});
  const exit = interpolate(frame, [total - 7, total], [0, 1], {...clamp, easing: Easing.in(Easing.quad)});
  return (
    <AbsoluteFill style={{opacity: Math.min(enter * 1.5, 1) * (1 - exit), transform: `scale(${0.94 + enter * 0.06}) translateY(${-exit * 40}px)`}}>
      {children}
    </AbsoluteFill>
  );
};

// ---------------- 各镜头 ----------------

const HookScene: React.FC<{s: Extract<Scene, {kind: 'hook'}>; theme: Theme}> = ({s, theme}) => {
  const {fps} = useVideoConfig();
  const t = useSecond();
  const titlePop = usePop(s.titleAt, 8);
  return (
    <>
      <div style={{position: 'absolute', top: 130, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
        <div style={{...sticker(theme, theme.colors.lemon), borderRadius: 999, padding: '10px 36px', fontSize: 40, boxShadow: `6px 7px 0 ${theme.ink}`}}>
          {s.chip}
        </div>
      </div>
      <div
        style={{
          position: 'absolute',
          top: 330,
          left: 0,
          right: 0,
          textAlign: 'center',
          fontSize: 128,
          lineHeight: 1.18,
          color: theme.ink,
          whiteSpace: 'pre-line',
          WebkitTextStroke: `3px ${theme.ink}`,
          transform: `scale(${titlePop}) rotate(${(1 - titlePop) * -8}deg)`,
          opacity: titlePop > 0.01 ? 1 : 0,
        }}
      >
        {s.title}
      </div>
      <div style={{position: 'absolute', top: 880, left: 20, right: 20, display: 'flex', justifyContent: 'space-around', alignItems: 'flex-end'}}>
        {s.bots.map((b, i) => (
          <div key={i} style={{position: 'relative'}}>
            <Bot theme={theme} color={theme.colors[b.color]} size={180} appearAt={Math.round(b.at * fps)} seed={i} mood={t > s.titleAt ? 'surprised' : 'smile'} />
            {t > b.at + 0.3 ? (
              <div
                style={{
                  position: 'absolute',
                  top: -70,
                  left: '50%',
                  transform: `translateX(-50%) translateY(${Math.sin(t * 6 + i) * 8}px)`,
                  fontSize: 72,
                  color: theme.colors[b.color],
                  WebkitTextStroke: `3px ${theme.ink}`,
                }}
              >
                {t > s.titleAt ? '!' : '?'}
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </>
  );
};

const PodiumScene: React.FC<{s: Extract<Scene, {kind: 'podium'}>; theme: Theme}> = ({s, theme}) => {
  const {fps} = useVideoConfig();
  const t = useSecond();
  // 出场顺序：探花 → 榜眼 → 状元；画面顺序：榜眼 | 状元 | 探花
  const places = [
    {rank: 3, name: '探花', h: 170, color: 'coral' as BotColor, order: 0},
    {rank: 2, name: '榜眼', h: 240, color: 'sky' as BotColor, order: 1},
    {rank: 1, name: '状元', h: 320, color: 'lemon' as BotColor, order: 2},
  ];
  const layout = [places[1], places[2], places[0]];
  const crown = usePop(s.crownAt, 7);
  return (
    <>
      <Heading theme={theme} chip={s.chip} title={s.title} />
      <div style={{position: 'absolute', top: 470, left: 0, right: 0, height: 900, display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: 24}}>
        {layout.map((p) => {
          const blockPop = spring({frame: Math.round((t - s.blocks[p.order]) * fps), fps, config: {damping: 11, mass: 0.6}});
          return (
            <div key={p.rank} style={{display: 'flex', flexDirection: 'column', alignItems: 'center', width: 290}}>
              <Bot
                theme={theme}
                color={theme.colors[p.color]}
                size={200}
                appearAt={Math.round(s.botsAt[p.order] * fps)}
                seed={p.rank}
                mood={p.rank === 1 && t > s.crownAt ? 'happy' : 'smile'}
                accessory={p.rank === 1 && t > s.crownAt ? 'crown' : p.rank !== 1 && t > s.crownAt ? 'medal' : 'none'}
                medalText={String(p.rank)}
              />
              <div
                style={{
                  ...sticker(theme, theme.colors[p.color]),
                  borderRadius: '28px 28px 8px 8px',
                  width: 270,
                  height: p.h,
                  marginTop: 6,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transform: `scaleY(${blockPop})`,
                  transformOrigin: 'bottom',
                  color: theme.ink,
                }}
              >
                <div style={{fontSize: 96, lineHeight: 1}}>{p.rank}</div>
                <div style={{fontSize: 44, opacity: t > s.crownAt ? crown : 0}}>{p.name}</div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
};

const PaperIcon: React.FC<{theme: Theme}> = ({theme}) => (
  <svg viewBox="0 0 120 140" width={170} height={198}>
    <rect x={10} y={8} width={100} height={124} rx={14} fill="#FFFFFF" stroke={theme.ink} strokeWidth={6} />
    {[38, 62, 86].map((y) => (
      <g key={y}>
        <path d={`M 24 ${y} l 8 8 l 14 -16`} fill="none" stroke={theme.colors.mint} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
        <line x1={56} y1={y} x2={94} y2={y} stroke={theme.inkSoft} strokeWidth={5} strokeLinecap="round" />
      </g>
    ))}
    <circle cx={88} cy={112} r={18} fill="none" stroke="#FF5D73" strokeWidth={5} />
    <text x={88} y={119} fontSize={20} textAnchor="middle" fill="#FF5D73" fontFamily={theme.font}>
      100
    </text>
  </svg>
);

const BallotIcon: React.FC<{theme: Theme}> = ({theme}) => (
  <svg viewBox="0 0 120 140" width={170} height={198}>
    <path d="M 60 26 C 50 6 22 12 30 34 C 36 48 60 60 60 60 C 60 60 84 48 90 34 C 98 12 70 6 60 26 Z" fill="#FF7FA0" stroke={theme.ink} strokeWidth={5} />
    <rect x={14} y={70} width={92} height={62} rx={12} fill={theme.colors.sky} stroke={theme.ink} strokeWidth={6} />
    <rect x={40} y={64} width={40} height={12} rx={6} fill={theme.ink} />
  </svg>
);

const SchoolsScene: React.FC<{s: Extract<Scene, {kind: 'schools'}>; theme: Theme}> = ({s, theme}) => {
  const l = usePop(s.left.at);
  const r = usePop(s.right.at);
  const vs = usePop(s.vsAt, 7);
  const card = (pop: number, side: 'l' | 'r', d: {name: string; desc: string}, bg: string) => (
    <div
      style={{
        ...sticker(theme, bg),
        width: 430,
        height: 640,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 26,
        transform: `translateX(${(1 - pop) * (side === 'l' ? -500 : 500)}px) rotate(${side === 'l' ? -3 : 3}deg)`,
        color: theme.ink,
      }}
    >
      {side === 'l' ? <PaperIcon theme={theme} /> : <BallotIcon theme={theme} />}
      <div style={{fontSize: 76}}>{d.name}</div>
      <div style={{fontSize: 40, lineHeight: 1.45, textAlign: 'center', whiteSpace: 'pre-line', color: theme.inkSoft}}>{d.desc}</div>
    </div>
  );
  return (
    <>
      <Heading theme={theme} chip={s.chip} title={s.title} />
      <div style={{position: 'absolute', top: 520, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 70}}>
        {card(l, 'l', s.left, '#EAF6FF')}
        {card(r, 'r', s.right, '#FFEFF4')}
      </div>
      <div
        style={{
          position: 'absolute',
          top: 760,
          left: 540 - 85,
          width: 170,
          height: 170,
          borderRadius: 999,
          ...sticker(theme, '#FF5D73'),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 76,
          color: '#FFFFFF',
          WebkitTextStroke: `2px ${theme.ink}`,
          transform: `scale(${vs}) rotate(${(1 - vs) * 180 - 8}deg)`,
        }}
      >
        VS
      </div>
    </>
  );
};

const CardsScene: React.FC<{s: Extract<Scene, {kind: 'cards'}>; theme: Theme}> = ({s, theme}) => {
  const {fps} = useVideoConfig();
  const frame = useCurrentFrame();
  const n = s.cards.length;
  const h = n >= 5 ? 168 : 230;
  return (
    <>
      <Heading theme={theme} chip={s.chip} title={s.title} />
      <div style={{position: 'absolute', top: 440, left: 70, right: 70, display: 'flex', flexDirection: 'column', gap: n >= 5 ? 26 : 44}}>
        {s.cards.map((c, i) => {
          const pop = spring({frame: frame - Math.round(c.at * fps), fps, config: {damping: 12, mass: 0.6, stiffness: 160}});
          return (
            <div
              key={i}
              style={{
                ...sticker(theme),
                height: h,
                display: 'flex',
                alignItems: 'center',
                gap: 28,
                padding: '0 30px',
                transform: `translateX(${(1 - pop) * 1100}px) rotate(${(i % 2 ? 1 : -1) * 0.8}deg)`,
                opacity: frame >= c.at * fps ? 1 : 0,
              }}
            >
              <div
                style={{
                  ...sticker(theme, theme.colors[c.color]),
                  borderRadius: 24,
                  boxShadow: `5px 6px 0 ${theme.ink}`,
                  minWidth: 230,
                  height: h - 56,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: c.tag.length > 6 ? 38 : 50,
                  color: theme.ink,
                  padding: '0 12px',
                }}
              >
                {c.tag}
              </div>
              <div style={{display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0}}>
                <div style={{fontSize: n >= 5 ? 52 : 58, color: theme.ink}}>{c.name}</div>
                <div style={{fontSize: n >= 5 ? 32 : 36, color: theme.inkSoft, lineHeight: 1.35}}>{c.desc}</div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
};

const Heart: React.FC<{size: number}> = ({size}) => (
  <svg viewBox="0 0 120 110" width={size} height={size * 0.92}>
    <path d="M 60 30 C 48 2 8 8 12 42 C 16 72 60 100 60 100 C 60 100 104 72 108 42 C 112 8 72 2 60 30 Z" fill="#FF5D85" stroke="#3D2C3E" strokeWidth={7} />
    <ellipse cx={36} cy={34} rx={10} ry={6} fill="#FFFFFF" opacity={0.6} transform="rotate(-30 36 34)" />
  </svg>
);

const ArenaScene: React.FC<{s: Extract<Scene, {kind: 'arena'}>; theme: Theme}> = ({s, theme}) => {
  const t = useSecond();
  const q = usePop(s.questionAt);
  const vote = usePop(s.voteAt, 7);
  const reveal = interpolate(t, [s.revealAt, s.revealAt + 0.4], [0, 1], clamp);
  const score = interpolate(t, [s.scoreAt, s.scoreAt + 0.8], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
  const booths = [
    {id: 'A', color: theme.colors.sky, win: false, at: s.answerAt[0]},
    {id: 'B', color: theme.colors.pink, win: true, at: s.answerAt[1]},
  ];
  return (
    <>
      <Heading theme={theme} chip={s.chip} title={s.title} size={84} />
      <div style={{position: 'absolute', top: 420, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
        <div
          style={{
            ...sticker(theme, theme.colors.lemon),
            padding: '18px 40px',
            fontSize: 44,
            lineHeight: 1.35,
            textAlign: 'center',
            whiteSpace: 'pre-line',
            color: theme.ink,
            transform: `scale(${q})`,
          }}
        >
          {s.question}
        </div>
      </div>
      <div style={{position: 'absolute', top: 640, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 50}}>
        {booths.map((b, i) => {
          const lines = interpolate(t, [b.at, b.at + 1.6], [0, 4], clamp);
          const highlight = b.win && t >= s.voteAt;
          return (
            <div key={b.id} style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22}}>
              <div
                style={{
                  ...sticker(theme, highlight ? '#FFF2F6' : theme.card),
                  borderColor: highlight ? '#FF5D85' : theme.ink,
                  width: 420,
                  height: 500,
                  position: 'relative',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  paddingTop: 26,
                }}
              >
                <div style={{height: 230, display: 'flex', alignItems: 'flex-end', justifyContent: 'center'}}>
                  {reveal > 0 ? (
                    <div style={{opacity: reveal}}>
                      <Bot theme={theme} color={b.color} size={190} seed={i + 4} mood={b.win ? 'happy' : 'sweat'} wave={b.win && t > s.revealAt + 0.4} />
                    </div>
                  ) : (
                    <div style={{fontSize: 200, lineHeight: 1, color: theme.ink, opacity: 0.85}}>{b.id}</div>
                  )}
                </div>
                <div style={{display: 'flex', flexDirection: 'column', gap: 18, width: 320, marginTop: 34}}>
                  {[0.95, 0.8, 0.9, 0.6].map((w, k) => (
                    <div
                      key={k}
                      style={{
                        height: 22,
                        borderRadius: 11,
                        backgroundColor: k % 2 ? theme.colors.lavender : b.color,
                        width: `${w * Math.max(0, Math.min(1, lines - k)) * 100}%`,
                        opacity: 0.8,
                      }}
                    />
                  ))}
                </div>
                {/* 匿名“幕布”：揭晓时向上收起 */}
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    top: 0,
                    height: 260,
                    background: `repeating-linear-gradient(90deg, ${theme.colors.lavender} 0 34px, #A792F5 34px 68px)`,
                    borderBottom: `6px solid ${theme.ink}`,
                    transform: `translateY(${-reveal * 270}px)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 64,
                    color: '#FFFFFF',
                    WebkitTextStroke: `2px ${theme.ink}`,
                  }}
                >
                  考生 {b.id} ?
                </div>
                {b.win && t >= s.voteAt ? (
                  <div style={{position: 'absolute', right: 14, top: 230, transform: `scale(${vote}) rotate(-12deg)`}}>
                    <Heart size={120} />
                  </div>
                ) : null}
              </div>
              <div
                style={{
                  ...sticker(theme, b.win ? '#E3FBEF' : '#FFE9EC'),
                  borderRadius: 999,
                  boxShadow: `5px 6px 0 ${theme.ink}`,
                  padding: '8px 28px',
                  fontSize: 46,
                  color: theme.ink,
                  opacity: t >= s.scoreAt ? 1 : 0,
                  transform: `scale(${t >= s.scoreAt ? 0.8 + score * 0.2 : 0})`,
                  fontVariantNumeric: 'tabular-nums',
                  whiteSpace: 'nowrap',
                }}
              >
                {Math.round(s.scores.from + (b.win ? 1 : -1) * s.scores.delta * score)}
                <span style={{color: b.win ? '#1FAA6B' : '#E5484D', marginLeft: 10}}>
                  {b.win ? `↑ +${s.scores.delta}` : `↓ −${s.scores.delta}`}
                </span>
              </div>
            </div>
          );
        })}
      </div>
      <div
        style={{
          position: 'absolute',
          top: 1280,
          left: 0,
          right: 0,
          textAlign: 'center',
          fontSize: 38,
          color: theme.inkSoft,
          opacity: t >= s.scoreAt ? score : 0,
        }}
      >
        Elo 积分（下棋同款算法）
      </div>
    </>
  );
};

const BarsScene: React.FC<{s: Extract<Scene, {kind: 'bars'}>; theme: Theme}> = ({s, theme}) => {
  const {fps} = useVideoConfig();
  const frame = useCurrentFrame();
  return (
    <>
      <Heading theme={theme} chip={s.chip} title={s.title} />
      <div style={{position: 'absolute', top: 500, left: 80, right: 80, ...sticker(theme), padding: '56px 50px', display: 'flex', flexDirection: 'column', gap: 56}}>
        {s.bars.map((b, i) => {
          const at = Math.round(b.at * fps);
          const fill = spring({frame: frame - at, fps, config: {damping: 14, mass: 0.8}});
          return (
            <div key={i} style={{display: 'flex', flexDirection: 'column', gap: 16, opacity: frame >= at ? 1 : 0.25}}>
              <div style={{fontSize: 52, color: theme.ink}}>{b.label}</div>
              <div style={{height: 64, borderRadius: 32, border: `5px solid ${theme.ink}`, backgroundColor: '#F4EEF3', overflow: 'hidden'}}>
                <div
                  style={{
                    height: '100%',
                    width: `${b.value * fill * 100}%`,
                    backgroundColor: theme.colors[b.color],
                    borderRight: fill > 0.02 ? `5px solid ${theme.ink}` : 'none',
                    backgroundImage: 'repeating-linear-gradient(-45deg, rgba(255,255,255,0.35) 0 14px, transparent 14px 28px)',
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
      <div style={{position: 'absolute', top: 1250, left: 0, right: 0, textAlign: 'center', fontSize: 34, color: theme.inkSoft}}>{s.note}</div>
    </>
  );
};

const GridScene: React.FC<{s: Extract<Scene, {kind: 'grid'}>; theme: Theme}> = ({s, theme}) => {
  const {fps} = useVideoConfig();
  const frame = useCurrentFrame();
  return (
    <>
      <Heading theme={theme} chip={s.chip} title={s.title} size={76} />
      <div style={{position: 'absolute', top: 420, left: 60, right: 60, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 34}}>
        {s.tiles.map((tile, i) => {
          const at = Math.round(tile.at * fps);
          const pop = spring({frame: frame - at, fps, config: {damping: 9, mass: 0.6, stiffness: 170}});
          return (
            <div
              key={i}
              style={{
                ...sticker(theme),
                height: 270,
                padding: '22px 24px',
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
                transform: `scale(${pop}) rotate(${(i % 2 ? 1.5 : -1.5) * (1 - pop * 0.5)}deg)`,
                opacity: frame >= at ? 1 : 0,
              }}
            >
              <div
                style={{
                  alignSelf: 'flex-start',
                  ...sticker(theme, theme.colors[tile.color]),
                  borderRadius: 18,
                  boxShadow: `4px 5px 0 ${theme.ink}`,
                  padding: '4px 16px',
                  fontSize: tile.tag.length > 10 ? 32 : 38,
                  color: theme.ink,
                  whiteSpace: 'nowrap',
                }}
              >
                {tile.tag}
              </div>
              <div style={{fontSize: 50, color: theme.ink, marginTop: 4}}>{tile.name}</div>
              <div style={{fontSize: 32, lineHeight: 1.35, color: theme.inkSoft, whiteSpace: 'pre-line'}}>{tile.desc}</div>
            </div>
          );
        })}
      </div>
      <div style={{position: 'absolute', top: 1375, left: 0, right: 0, textAlign: 'center', fontSize: 34, color: theme.inkSoft}}>{s.note}</div>
    </>
  );
};

const PitfallsScene: React.FC<{s: Extract<Scene, {kind: 'pitfalls'}>; theme: Theme}> = ({s, theme}) => {
  const {fps} = useVideoConfig();
  const frame = useCurrentFrame();
  const t = useSecond();
  const quote = usePop(s.quote.at, 9);
  const dim = interpolate(t, [s.quote.at, s.quote.at + 0.3], [1, 0.25], clamp);
  return (
    <>
      <Heading theme={theme} chip={s.chip} title={s.title} />
      <div style={{position: 'absolute', top: 440, left: 70, right: 70, display: 'flex', flexDirection: 'column', gap: 40, opacity: dim}}>
        {s.pits.map((p, i) => {
          const at = Math.round(p.at * fps);
          const pop = spring({frame: frame - at, fps, config: {damping: 9, mass: 0.6, stiffness: 170}});
          const shake = frame - at >= 0 && frame - at < 10 ? Math.sin((frame - at) * 2.4) * 8 * (1 - (frame - at) / 10) : 0;
          return (
            <div
              key={i}
              style={{
                ...sticker(theme, '#FFF7F2'),
                height: 250,
                display: 'flex',
                alignItems: 'center',
                gap: 20,
                padding: '0 26px 0 6px',
                position: 'relative',
                transform: `scale(${pop}) translateX(${shake}px)`,
                opacity: frame >= at ? 1 : 0,
              }}
            >
              <Bot
                theme={theme}
                color={[theme.colors.coral, theme.colors.lemon, theme.colors.lavender][i]}
                size={190}
                seed={i + 7}
                mood={p.mood === 'sweat' ? 'sweat' : p.mood === 'meh' ? 'meh' : 'cool'}
                accessory={p.mood === 'fancy' ? 'bowtie' : 'none'}
              />
              <div style={{display: 'flex', flexDirection: 'column', gap: 10, minWidth: 0}}>
                <div style={{display: 'flex', alignItems: 'center', gap: 16}}>
                  <div style={{fontSize: 56, color: theme.ink}}>{p.title}</div>
                  <div
                    style={{
                      fontSize: 30,
                      padding: '4px 16px',
                      borderRadius: 999,
                      border: `4px solid ${theme.ink}`,
                      backgroundColor: theme.colors.lemon,
                      color: theme.ink,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {p.term}
                  </div>
                </div>
                <div style={{fontSize: 36, lineHeight: 1.35, color: theme.inkSoft}}>{p.desc}</div>
              </div>
              <div
                style={{
                  position: 'absolute',
                  top: -26,
                  right: -18,
                  width: 74,
                  height: 74,
                  borderRadius: 999,
                  ...sticker(theme, '#FF5D73'),
                  boxShadow: `4px 5px 0 ${theme.ink}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 50,
                  color: '#FFFFFF',
                }}
              >
                !
              </div>
            </div>
          );
        })}
      </div>
      {t >= s.quote.at ? (
        <div style={{position: 'absolute', top: 640, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
          <div
            style={{
              ...sticker(theme, '#FFF1A8'),
              width: 820,
              padding: '60px 40px 44px',
              textAlign: 'center',
              transform: `scale(${quote}) rotate(-3deg)`,
              position: 'relative',
            }}
          >
            <div style={{position: 'absolute', top: -30, left: '50%', marginLeft: -80, width: 160, height: 50, backgroundColor: '#FFC2D4', opacity: 0.85, transform: 'rotate(4deg)'}} />
            <div style={{fontSize: 64, lineHeight: 1.4, color: theme.ink, whiteSpace: 'pre-line'}}>{s.quote.text}</div>
            <div style={{fontSize: 40, color: theme.inkSoft, marginTop: 24}}>—— {s.quote.source}</div>
          </div>
        </div>
      ) : null}
    </>
  );
};

const ChecklistScene: React.FC<{s: Extract<Scene, {kind: 'checklist'}>; theme: Theme}> = ({s, theme}) => {
  const {fps} = useVideoConfig();
  const frame = useCurrentFrame();
  return (
    <>
      <Heading theme={theme} chip={s.chip} title={s.title} size={80} />
      <div style={{position: 'absolute', top: 440, left: 70, right: 70, ...sticker(theme), padding: '44px 40px', display: 'flex', flexDirection: 'column', gap: 40}}>
        {s.items.map((it, i) => {
          const at = Math.round(it.at * fps);
          const tick = interpolate(frame, [at, at + 8], [0, 1], clamp);
          const pop = spring({frame: frame - at, fps, config: {damping: 8, mass: 0.5}});
          return (
            <div key={i} style={{display: 'flex', alignItems: 'center', gap: 28, opacity: frame >= at ? 1 : 0.3}}>
              <div
                style={{
                  width: 84,
                  height: 84,
                  flexShrink: 0,
                  borderRadius: 22,
                  border: `6px solid ${theme.ink}`,
                  backgroundColor: frame >= at ? theme.colors.mint : '#FFFFFF',
                  transform: `scale(${frame >= at ? 0.85 + pop * 0.15 : 1})`,
                }}
              >
                <svg viewBox="0 0 84 84" width={72} height={72}>
                  <path
                    d="M 18 42 L 34 58 L 64 24"
                    fill="none"
                    stroke={theme.ink}
                    strokeWidth={10}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    pathLength={1}
                    strokeDasharray={1}
                    strokeDashoffset={1 - tick}
                  />
                </svg>
              </div>
              <div style={{fontSize: 44, lineHeight: 1.4, color: theme.ink, whiteSpace: 'pre-line'}}>{it.text}</div>
            </div>
          );
        })}
      </div>
    </>
  );
};

const Confetti: React.FC<{theme: Theme; from: number}> = ({theme, from}) => {
  const frame = useCurrentFrame();
  const t = frame - from;
  if (t < 0) return null;
  const colors = [...Object.values(theme.colors), theme.gold];
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      {Array.from({length: 60}, (_, i) => {
        const x = (i * 173) % 1080;
        const speed = 9 + (i % 5) * 3;
        const y = -60 + t * speed - (i % 7) * 80;
        const rot = t * (i % 2 ? 9 : -7) + i * 30;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: x + Math.sin((t + i * 7) / 8) * 30,
              top: y,
              width: 22,
              height: i % 3 === 0 ? 22 : 36,
              borderRadius: i % 3 === 0 ? 999 : 5,
              backgroundColor: colors[i % colors.length],
              border: `3px solid ${theme.ink}`,
              transform: `rotate(${rot}deg)`,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

const OutroScene: React.FC<{s: Extract<Scene, {kind: 'outro'}>; theme: Theme}> = ({s, theme}) => {
  const {fps} = useVideoConfig();
  const title = usePop(s.titleAt, 8);
  const sub = usePop(s.subtitleAt, 12);
  const colors: BotColor[] = ['pink', 'sky', 'lemon', 'mint', 'lavender'];
  return (
    <>
      {/* 彩纸放在最底层，不挡文字 */}
      <Confetti theme={theme} from={Math.round(s.titleAt * fps)} />
      <div style={{position: 'absolute', top: 130, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
        <div style={{...sticker(theme, theme.colors.lemon), borderRadius: 999, padding: '10px 36px', fontSize: 40, boxShadow: `6px 7px 0 ${theme.ink}`}}>{s.chip}</div>
      </div>
      <div
        style={{
          position: 'absolute',
          top: 330,
          left: 40,
          right: 40,
          textAlign: 'center',
          fontSize: 92,
          lineHeight: 1.3,
          color: theme.ink,
          whiteSpace: 'pre-line',
          WebkitTextStroke: `2px ${theme.ink}`,
          transform: `scale(${title})`,
        }}
      >
        {s.title}
      </div>
      <div style={{position: 'absolute', top: 660, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
        <div style={{...sticker(theme, '#FFC2D4'), borderRadius: 999, padding: '14px 48px', fontSize: 56, color: theme.ink, transform: `scale(${sub})`}}>
          {s.subtitle}
        </div>
      </div>
      <div style={{position: 'absolute', top: 900, left: 20, right: 20, display: 'flex', justifyContent: 'space-around', alignItems: 'flex-end'}}>
        {colors.map((c, i) => (
          <Bot key={c} theme={theme} color={theme.colors[c]} size={180} appearAt={Math.round((s.botsAt + i * 0.1) * fps)} seed={i} mood="happy" wave />
        ))}
      </div>
    </>
  );
};

export const SceneView: React.FC<{scene: Scene; theme: Theme}> = ({scene, theme}) => {
  const body = (() => {
    switch (scene.kind) {
      case 'hook':
        return <HookScene s={scene} theme={theme} />;
      case 'podium':
        return <PodiumScene s={scene} theme={theme} />;
      case 'schools':
        return <SchoolsScene s={scene} theme={theme} />;
      case 'cards':
        return <CardsScene s={scene} theme={theme} />;
      case 'arena':
        return <ArenaScene s={scene} theme={theme} />;
      case 'bars':
        return <BarsScene s={scene} theme={theme} />;
      case 'grid':
        return <GridScene s={scene} theme={theme} />;
      case 'pitfalls':
        return <PitfallsScene s={scene} theme={theme} />;
      case 'checklist':
        return <ChecklistScene s={scene} theme={theme} />;
      case 'outro':
        return <OutroScene s={scene} theme={theme} />;
    }
  })();
  return (
    <SceneFrame duration={scene.duration}>
      <AbsoluteFill style={{fontFamily: theme.font}}>{body}</AbsoluteFill>
    </SceneFrame>
  );
};
