import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import type {ConclusionSceneConfig, ThemeConfig} from '../config/types';

/** 镜头 4：重点结论。卡片放大入场，正文逐字出现，关键词高亮扫过。 */
export const ConclusionScene: React.FC<{scene: ConclusionSceneConfig; theme: ThemeConfig}> = ({
  scene,
  theme,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const cardIn = spring({frame, fps, config: {damping: 15}});
  const chars = Array.from(scene.statement);
  const typed = Math.floor(
    interpolate(frame, [fps * 0.5, fps * 3], [0, chars.length], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }),
  );
  const hlStart = scene.highlight ? scene.statement.indexOf(scene.highlight) : -1;
  const hlStartChar = hlStart >= 0 ? Array.from(scene.statement.slice(0, hlStart)).length : -1;
  const hlEndChar = hlStartChar + Array.from(scene.highlight).length;
  const sweep = interpolate(frame, [fps * 3.1, fps * 3.8], [0, 100], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const before = chars.slice(0, hlStartChar >= 0 ? hlStartChar : chars.length);
  const highlighted = hlStartChar >= 0 ? chars.slice(hlStartChar, hlEndChar) : [];
  const after = hlStartChar >= 0 ? chars.slice(hlEndChar) : [];
  const visible = (offset: number, list: string[]) =>
    list.map((c, i) => (
      <span key={offset + i} style={{opacity: offset + i < typed ? 1 : 0}}>
        {c}
      </span>
    ));

  return (
    <AbsoluteFill
      style={{
        justifyContent: 'center',
        alignItems: 'center',
        fontFamily: theme.fontFamily,
        color: theme.text,
        padding: 80,
        paddingBottom: 300,
      }}
    >
      <div
        style={{
          width: '100%',
          padding: '80px 70px',
          borderRadius: 48,
          backgroundColor: 'rgba(255,255,255,0.06)',
          border: `3px solid ${theme.secondary}`,
          boxShadow: `0 0 80px ${theme.secondary}44`,
          transform: `scale(${0.8 + cardIn * 0.2})`,
          opacity: cardIn,
        }}
      >
        <div style={{fontSize: 140, lineHeight: 0.8, color: theme.secondary, fontWeight: 900}}>“</div>
        <div style={{fontSize: 52, fontWeight: 700, color: theme.muted, marginBottom: 36}}>
          {scene.heading}
        </div>
        <div style={{fontSize: 76, fontWeight: 800, lineHeight: 1.45}}>
          {visible(0, before)}
          <span
            style={{
              color: theme.background,
              backgroundImage: `linear-gradient(90deg, ${theme.primary} ${sweep}%, transparent ${sweep}%)`,
              borderRadius: 12,
              padding: '0 6px',
              WebkitTextFillColor: sweep > 0 ? theme.background : theme.text,
            }}
          >
            {visible(before.length, highlighted)}
          </span>
          {visible(before.length + highlighted.length, after)}
        </div>
      </div>
    </AbsoluteFill>
  );
};
