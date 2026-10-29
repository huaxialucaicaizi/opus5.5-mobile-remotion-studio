import React from 'react';
import {spring, useCurrentFrame, useVideoConfig} from 'remotion';
import type {LeaderboardConfig} from './config';

type Theme = LeaderboardConfig['theme'];
export type Mood = 'happy' | 'smile' | 'surprised' | 'sweat' | 'meh' | 'cool';
export type Accessory = 'none' | 'crown' | 'glasses' | 'medal' | 'bowtie' | 'headset';

/**
 * 可爱小机器人。坐标系 200×230。
 * - appearAt：从这一帧开始弹出（弹簧缩放 + 从下往上跳）
 * - seed：让每个机器人眨眼、晃动的节奏错开
 */
export const Bot: React.FC<{
  theme: Theme;
  color: string;
  size: number;
  appearAt?: number;
  mood?: Mood;
  accessory?: Accessory;
  medalText?: string;
  wave?: boolean;
  seed?: number;
  label?: string;
}> = ({theme, color, size, appearAt = 0, mood = 'smile', accessory = 'none', medalText, wave = false, seed = 0, label}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame - appearAt;
  if (t < 0) return <div style={{width: size, height: size * 1.15}} />;

  const pop = spring({frame: t, fps, config: {damping: 9, mass: 0.6, stiffness: 180}});
  const bob = Math.sin((frame + seed * 17) / 9) * 4;
  const squash = 1 + Math.sin((frame + seed * 17) / 9 + 1.2) * 0.02;
  // 每 ~3 秒眨一次眼，持续 4 帧
  const blinkPhase = (frame + seed * 37) % 95;
  const eyeScale = blinkPhase < 4 ? 0.15 : 1;
  const armAngle = wave ? Math.sin(frame / 3) * 28 - 20 : Math.sin((frame + seed * 11) / 12) * 6;
  const ink = theme.ink;

  const mouth = {
    happy: <path d="M 84 128 Q 100 152 116 128 Z" fill={ink} stroke={ink} strokeWidth={4} strokeLinejoin="round" />,
    smile: <path d="M 88 130 Q 100 142 112 130" fill="none" stroke={ink} strokeWidth={5} strokeLinecap="round" />,
    surprised: <ellipse cx={100} cy={134} rx={8} ry={10} fill={ink} />,
    sweat: <path d="M 86 136 Q 93 128 100 136 Q 107 144 114 136" fill="none" stroke={ink} strokeWidth={5} strokeLinecap="round" />,
    meh: <path d="M 88 134 L 112 134" stroke={ink} strokeWidth={5} strokeLinecap="round" />,
    cool: <path d="M 86 130 Q 100 146 116 128" fill="none" stroke={ink} strokeWidth={5} strokeLinecap="round" />,
  }[mood];

  return (
    <div
      style={{
        width: size,
        height: size * 1.15,
        transform: `translateY(${(1 - pop) * 120 + bob}px) scale(${pop})`,
        transformOrigin: '50% 100%',
        position: 'relative',
      }}
    >
      <svg viewBox="0 0 200 230" width={size} height={size * 1.15} style={{overflow: 'visible'}}>
        {/* 影子 */}
        <ellipse cx={100} cy={222} rx={58 - bob} ry={8} fill={ink} opacity={0.12} />
        <g style={{transform: `scaleY(${squash})`, transformOrigin: '100px 215px'}}>
          {/* 天线 */}
          <line x1={100} y1={44} x2={100} y2={20} stroke={ink} strokeWidth={6} strokeLinecap="round" />
          <circle cx={100 + Math.sin((frame + seed * 13) / 6) * 3} cy={16} r={11} fill={theme.gold} stroke={ink} strokeWidth={5} />
          {/* 手臂 */}
          <g style={{transform: `rotate(${-armAngle}deg)`, transformOrigin: '30px 130px'}}>
            <rect x={6} y={118} width={30} height={22} rx={11} fill={color} stroke={ink} strokeWidth={5} />
          </g>
          <g style={{transform: `rotate(${wave ? -armAngle : armAngle}deg)`, transformOrigin: '170px 130px'}}>
            <rect x={164} y={118} width={30} height={22} rx={11} fill={color} stroke={ink} strokeWidth={5} />
          </g>
          {/* 脚 */}
          <ellipse cx={74} cy={208} rx={18} ry={11} fill={color} stroke={ink} strokeWidth={5} />
          <ellipse cx={126} cy={208} rx={18} ry={11} fill={color} stroke={ink} strokeWidth={5} />
          {/* 身体 */}
          <rect x={24} y={44} width={152} height={160} rx={64} fill={color} stroke={ink} strokeWidth={6} />
          <ellipse cx={70} cy={70} rx={18} ry={9} fill="#FFFFFF" opacity={0.45} transform="rotate(-25 70 70)" />
          {/* 脸 */}
          <rect x={46} y={76} width={108} height={84} rx={38} fill={theme.face} stroke={ink} strokeWidth={4} />
          <g style={{transform: `scaleY(${eyeScale})`, transformOrigin: '100px 108px'}}>
            <ellipse cx={78} cy={108} rx={9} ry={12} fill={ink} />
            <ellipse cx={122} cy={108} rx={9} ry={12} fill={ink} />
            <circle cx={81} cy={103} r={3.5} fill="#FFFFFF" />
            <circle cx={125} cy={103} r={3.5} fill="#FFFFFF" />
          </g>
          <ellipse cx={62} cy={130} rx={10} ry={6} fill={theme.blush} opacity={0.75} />
          <ellipse cx={138} cy={130} rx={10} ry={6} fill={theme.blush} opacity={0.75} />
          {mouth}
          {mood === 'sweat' ? (
            <path
              d={`M 160 ${70 + (frame % 30)} Q 152 ${84 + (frame % 30)} 160 ${90 + (frame % 30)} Q 168 ${84 + (frame % 30)} 160 ${70 + (frame % 30)} Z`}
              fill="#9FD4FF"
              stroke={ink}
              strokeWidth={3}
              opacity={1 - (frame % 30) / 30}
            />
          ) : null}
          {/* 配饰 */}
          {accessory === 'crown' ? (
            <path d="M 66 46 L 70 14 L 86 32 L 100 6 L 114 32 L 130 14 L 134 46 Z" fill={theme.gold} stroke={ink} strokeWidth={5} strokeLinejoin="round" />
          ) : null}
          {accessory === 'glasses' || mood === 'cool' ? (
            <g>
              <rect x={60} y={96} width={34} height={24} rx={10} fill={mood === 'cool' ? ink : 'none'} stroke={ink} strokeWidth={5} />
              <rect x={106} y={96} width={34} height={24} rx={10} fill={mood === 'cool' ? ink : 'none'} stroke={ink} strokeWidth={5} />
              <line x1={94} y1={106} x2={106} y2={106} stroke={ink} strokeWidth={5} />
            </g>
          ) : null}
          {accessory === 'medal' ? (
            <g>
              <path d="M 86 160 L 100 182 L 114 160" fill="none" stroke="#FF6F91" strokeWidth={8} />
              <circle cx={100} cy={188} r={16} fill={theme.gold} stroke={ink} strokeWidth={4} />
              {medalText ? (
                <text x={100} y={195} fontSize={20} textAnchor="middle" fill={ink} fontFamily={theme.font}>
                  {medalText}
                </text>
              ) : null}
            </g>
          ) : null}
          {accessory === 'bowtie' ? (
            <path d="M 100 172 L 78 160 L 78 186 Z M 100 172 L 122 160 L 122 186 Z" fill="#FF6F91" stroke={ink} strokeWidth={4} strokeLinejoin="round" />
          ) : null}
          {accessory === 'headset' ? (
            <g>
              <path d="M 40 100 Q 40 34 100 34 Q 160 34 160 100" fill="none" stroke={ink} strokeWidth={7} />
              <rect x={28} y={92} width={22} height={34} rx={10} fill={theme.gold} stroke={ink} strokeWidth={4} />
              <path d="M 40 126 Q 46 150 74 150" fill="none" stroke={ink} strokeWidth={4} />
              <circle cx={76} cy={150} r={5} fill={ink} />
            </g>
          ) : null}
        </g>
      </svg>
      {label ? (
        <div
          style={{
            position: 'absolute',
            left: '50%',
            bottom: -size * 0.18,
            transform: 'translateX(-50%)',
            fontFamily: theme.font,
            fontSize: size * 0.17,
            color: theme.ink,
            whiteSpace: 'nowrap',
          }}
        >
          {label}
        </div>
      ) : null}
    </div>
  );
};
