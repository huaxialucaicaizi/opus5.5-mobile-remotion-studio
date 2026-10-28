import {getLength} from '@remotion/paths';
import React, {useMemo} from 'react';
import {AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import type {Art, InkColor} from './art';
import {formatYear, type HistoryConfig} from './config';

type Theme = HistoryConfig['theme'];

export const inkColor = (theme: Theme, c: InkColor = 'ink') =>
  ({ink: theme.ink, soft: theme.inkSoft, red: theme.red, gold: theme.gold})[c];

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

/** 宣纸背景：底色 + 纤维噪点 + 四周暗角 */
export const Paper: React.FC<{theme: Theme}> = ({theme}) => (
  <AbsoluteFill style={{backgroundColor: theme.paper}}>
    <svg width="100%" height="100%" style={{position: 'absolute', opacity: 0.35}}>
      <filter id="paper-grain">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7" />
        <feColorMatrix values="0 0 0 0 0.45  0 0 0 0 0.36  0 0 0 0 0.25  0 0 0 0.55 0" />
      </filter>
      <rect width="100%" height="100%" filter="url(#paper-grain)" />
    </svg>
    <AbsoluteFill
      style={{background: `radial-gradient(ellipse at center, transparent 55%, ${theme.paperShade} 100%)`}}
    />
  </AbsoluteFill>
);

/**
 * 手绘“沸腾线”滤镜：每 4 帧换一次噪声种子，让线条像逐帧手绘一样轻微抖动。
 * 用法：给元素加 style={{filter: 'url(#boil)'}}。
 */
export const BoilFilter: React.FC<{scale?: number}> = ({scale = 3.5}) => {
  const frame = useCurrentFrame();
  const seed = (Math.floor(frame / 4) % 4) + 1;
  return (
    <svg width="0" height="0" style={{position: 'absolute'}}>
      <filter id="boil" x="-5%" y="-5%" width="110%" height="110%">
        <feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves="2" seed={seed} />
        <feDisplacementMap in="SourceGraphic" scale={scale} xChannelSelector="R" yChannelSelector="G" />
      </filter>
    </svg>
  );
};

/** 线稿插画：按笔画顺序以“一支笔”的节奏画出来，文字标注在指定进度弹出 */
export const LineArt: React.FC<{
  art: Art;
  theme: Theme;
  size: number;
  /** 开始画的帧（相对当前 Sequence） */
  start: number;
  /** 画完需要的帧数 */
  duration: number;
}> = ({art, theme, size, start, duration}) => {
  const frame = useCurrentFrame();
  const lengths = useMemo(() => art.strokes.map((st) => getLength(st.d)), [art]);
  const total = lengths.reduce((a, b) => a + b, 0);
  const progress = interpolate(frame, [start, start + duration], [0, 1], {
    ...clamp,
    easing: Easing.inOut(Easing.quad),
  });
  let drawn = progress * total;

  return (
    <svg viewBox="0 0 400 400" width={size} height={size} style={{overflow: 'visible', filter: 'url(#boil)'}}>
      {art.strokes.map((st, i) => {
        const len = lengths[i];
        const p = Math.max(0, Math.min(1, drawn / len));
        drawn -= len;
        if (p <= 0) return null;
        return (
          <path
            key={i}
            d={st.d}
            fill="none"
            stroke={inkColor(theme, st.c)}
            strokeWidth={st.w ?? 4}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={len}
            strokeDashoffset={len * (1 - p)}
          />
        );
      })}
      {art.labels?.map((label, i) => {
        const appear = start + label.at * duration;
        const pop = spring({frame: frame - appear, fps: 30, config: {damping: 11, mass: 0.6}});
        if (frame < appear) return null;
        return (
          <text
            key={`l${i}`}
            x={label.x}
            y={label.y}
            fontSize={label.size}
            fill={inkColor(theme, label.c)}
            fontFamily={theme.bodyFont}
            textAnchor="middle"
            dominantBaseline="middle"
            style={{
              writingMode: label.vertical ? 'vertical-rl' : undefined,
              transformBox: 'fill-box',
              transformOrigin: 'center',
              transform: `scale(${0.4 + pop * 0.6})`,
              opacity: pop,
            }}
          >
            {label.text}
          </text>
        );
      })}
    </svg>
  );
};

/** 红色印章：从高处“盖”下来，落下瞬间返回 1（用于震屏） */
export const Seal: React.FC<{text: string; theme: Theme; size: number; at: number; rotate?: number}> = ({
  text,
  theme,
  size,
  at,
  rotate = -6,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame - at;
  const drop = interpolate(t, [-6, 0], [0, 1], {...clamp, easing: Easing.in(Easing.cubic)});
  const settle = spring({frame: t, fps, config: {damping: 9, mass: 0.5, stiffness: 220}});
  const scale = t < 0 ? 2.4 - drop * 1.4 : 1 + (1 - settle) * 0.12;
  const chars = Array.from(text);
  const fontSize = chars.length <= 1 ? size * 0.62 : chars.length === 2 ? size * 0.4 : size * 0.3;

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.08,
        border: `${size * 0.05}px solid ${theme.red}`,
        backgroundColor: theme.red,
        color: theme.paper,
        fontFamily: theme.titleFont,
        fontSize,
        lineHeight: 1.05,
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'center',
        alignContent: 'center',
        textAlign: 'center',
        padding: size * 0.06,
        boxSizing: 'border-box',
        boxShadow: `inset 0 0 0 ${size * 0.03}px ${theme.paper}`,
        opacity: t < -6 ? 0 : 0.35 + drop * 0.65,
        transform: `rotate(${rotate}deg) scale(${scale})`,
        filter: 'url(#boil)',
        flexShrink: 0,
      }}
    >
      {chars.length === 4 ? (
        <span style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0}}>
          {chars.map((c, i) => (
            <span key={i}>{c}</span>
          ))}
        </span>
      ) : (
        text
      )}
    </div>
  );
};

/** 印章落下后几帧的震屏位移 */
export const useStampShake = (at: number, strength = 14) => {
  const frame = useCurrentFrame();
  const t = frame - at;
  if (t < 0 || t > 8) return {x: 0, y: 0};
  const decay = 1 - t / 8;
  return {x: Math.sin(t * 2.7) * strength * decay, y: Math.cos(t * 3.3) * strength * 0.6 * decay};
};

/** 年份计数器：从上一个时代的年份滚动到当前年份 */
export const YearCounter: React.FC<{
  from: number;
  to: number;
  approx?: boolean;
  theme: Theme;
  duration: number;
}> = ({from, to, approx, theme, duration}) => {
  const frame = useCurrentFrame();
  const value = Math.round(
    interpolate(frame, [0, duration], [from, to], {...clamp, easing: Easing.out(Easing.cubic)}),
  );
  const done = frame >= duration;
  return (
    <div
      style={{
        fontFamily: theme.bodyFont,
        fontSize: 52,
        color: done ? theme.red : theme.inkSoft,
        fontVariantNumeric: 'tabular-nums',
        letterSpacing: 1,
      }}
    >
      {formatYear(value, approx)}
    </div>
  );
};

/** 解说文字：逐字显现，重点词变红并被“荧光笔”划过（普通行内元素，保留中文断行规则） */
export const Caption: React.FC<{
  text: string;
  highlight?: string;
  theme: Theme;
  start: number;
  duration: number;
}> = ({text, highlight, theme, start, duration}) => {
  const frame = useCurrentFrame();
  const chars = Array.from(text);
  const shown = interpolate(frame, [start, start + duration], [0, chars.length], clamp);
  const hlIndex = highlight ? text.indexOf(highlight) : -1;
  const hlStart = hlIndex >= 0 ? Array.from(text.slice(0, hlIndex)).length : -1;
  const hlEnd = hlStart + (highlight ? Array.from(highlight).length : 0);
  const marker = interpolate(frame, [start + duration, start + duration + 10], [0, 100], {
    ...clamp,
    easing: Easing.out(Easing.quad),
  });

  const renderChars = (from: number, to: number) =>
    chars.slice(from, to).map((ch, i) => {
      const idx = from + i;
      return (
        <span key={idx} style={{opacity: Math.max(0, Math.min(1, shown - idx))}}>
          {ch}
        </span>
      );
    });

  return (
    <div
      style={{
        fontFamily: theme.bodyFont,
        fontSize: 56,
        lineHeight: 1.6,
        color: theme.ink,
        textAlign: 'center',
        maxWidth: 920,
        whiteSpace: 'pre-line',
        lineBreak: 'strict',
      }}
    >
      {hlStart < 0 ? (
        renderChars(0, chars.length)
      ) : (
        <>
          {renderChars(0, hlStart)}
          <span
            style={{
              color: theme.red,
              backgroundImage: `linear-gradient(transparent 58%, ${theme.red}33 58%, ${theme.red}33 92%, transparent 92%)`,
              backgroundSize: `${marker}% 100%`,
              backgroundRepeat: 'no-repeat',
              boxDecorationBreak: 'clone',
              WebkitBoxDecorationBreak: 'clone',
            }}
          >
            {renderChars(hlStart, hlEnd)}
          </span>
          {renderChars(hlEnd, chars.length)}
        </>
      )}
    </div>
  );
};

/** 底部时间轴：每个时代一个刻度，墨点标记当前位置 */
export const Timeline: React.FC<{
  labels: string[];
  /** 当前位置，可以是小数（用于在两个时代之间滑动） */
  position: number;
  theme: Theme;
  opacity: number;
}> = ({labels, position, theme, opacity}) => {
  const width = 900;
  const n = labels.length;
  const x = (i: number) => (i / (n - 1)) * width;
  const markerX = x(Math.max(0, Math.min(n - 1, position)));
  const current = Math.round(Math.max(0, Math.min(n - 1, position)));

  return (
    <div style={{position: 'absolute', left: 90, bottom: 150, width, height: 90, opacity}}>
      <svg width={width} height={90} style={{overflow: 'visible', filter: 'url(#boil)'}}>
        <line x1={0} y1={60} x2={width} y2={60} stroke={theme.inkSoft} strokeWidth={4} strokeLinecap="round" />
        <line x1={0} y1={60} x2={markerX} y2={60} stroke={theme.red} strokeWidth={7} strokeLinecap="round" />
        {labels.map((_, i) => (
          <circle
            key={i}
            cx={x(i)}
            cy={60}
            r={i <= position + 0.01 ? 8 : 6}
            fill={i <= position + 0.01 ? theme.red : theme.paper}
            stroke={i <= position + 0.01 ? theme.red : theme.inkSoft}
            strokeWidth={3}
          />
        ))}
        <circle cx={markerX} cy={60} r={15} fill={theme.ink} />
      </svg>
      <div
        style={{
          position: 'absolute',
          top: -2,
          left: markerX,
          transform: 'translateX(-50%)',
          fontFamily: theme.bodyFont,
          fontSize: 34,
          color: theme.ink,
          whiteSpace: 'nowrap',
        }}
      >
        {labels[current]}
      </div>
    </div>
  );
};
