import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import type {KeywordSceneConfig, ThemeConfig} from '../config/types';

/** 镜头 2：关键词动效。关键词卡片依次从侧边飞入，当前关键词高亮发光。 */
export const KeywordScene: React.FC<{scene: KeywordSceneConfig; theme: ThemeConfig}> = ({
  scene,
  theme,
}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  const count = scene.keywords.length;
  // 在镜头前 70% 的时间里把关键词依次展示出来
  const interval = (durationInFrames * 0.7) / Math.max(count, 1);
  const headingIn = spring({frame, fps, config: {damping: 16}});

  return (
    <AbsoluteFill
      style={{
        fontFamily: theme.fontFamily,
        color: theme.text,
        padding: 90,
        paddingTop: 260,
        alignItems: 'center',
      }}
    >
      <div
        style={{
          fontSize: 76,
          fontWeight: 800,
          marginBottom: 90,
          opacity: headingIn,
          transform: `translateY(${(1 - headingIn) * 40}px)`,
        }}
      >
        {scene.heading}
      </div>
      {scene.keywords.map((kw, i) => {
        const start = Math.round(fps * 0.4 + i * interval);
        const enter = spring({frame: frame - start, fps, config: {damping: 13}});
        const active = frame >= start && (i === count - 1 || frame < start + interval);
        const glow = active
          ? interpolate(Math.sin((frame - start) / 6), [-1, 1], [0.5, 1])
          : 0;
        const accent = i % 2 === 0 ? theme.primary : theme.secondary;
        return (
          <div
            key={kw.word}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: 40,
              padding: '44px 52px',
              marginBottom: 44,
              borderRadius: 36,
              backgroundColor: 'rgba(255, 255, 255, 0.06)',
              border: `3px solid ${active ? accent : 'rgba(255,255,255,0.12)'}`,
              boxShadow: active ? `0 0 ${60 * glow}px ${accent}88` : 'none',
              opacity: enter,
              transform: `translateX(${(1 - enter) * (i % 2 === 0 ? -700 : 700)}px)`,
            }}
          >
            <div
              style={{
                width: 96,
                height: 96,
                flexShrink: 0,
                borderRadius: 28,
                backgroundColor: accent,
                color: theme.background,
                fontSize: 56,
                fontWeight: 900,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {i + 1}
            </div>
            <div>
              <div style={{fontSize: 80, fontWeight: 900, color: accent}}>{kw.word}</div>
              <div style={{fontSize: 44, color: theme.muted, marginTop: 8}}>
                {kw.description}
              </div>
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
