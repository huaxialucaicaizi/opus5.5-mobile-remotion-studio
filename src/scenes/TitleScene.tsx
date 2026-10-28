import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import type {ThemeConfig, TitleSceneConfig} from '../config/types';

/** 镜头 1：标题开场。标签下落、标题逐行弹入、副标题淡入、下划线展开。 */
export const TitleScene: React.FC<{scene: TitleSceneConfig; theme: ThemeConfig}> = ({
  scene,
  theme,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const lines = scene.title.split('\n');

  const tagIn = spring({frame, fps, config: {damping: 14}});
  const lineWidth = interpolate(frame, [fps * 1.2, fps * 2], [0, 360], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const subtitleOpacity = interpolate(frame, [fps * 1.4, fps * 2.1], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        justifyContent: 'center',
        alignItems: 'center',
        fontFamily: theme.fontFamily,
        color: theme.text,
        padding: 90,
        paddingBottom: 260,
      }}
    >
      <div
        style={{
          fontSize: 40,
          fontWeight: 600,
          color: theme.background,
          backgroundColor: theme.primary,
          padding: '12px 32px',
          borderRadius: 999,
          marginBottom: 64,
          transform: `translateY(${(1 - tagIn) * -60}px)`,
          opacity: tagIn,
        }}
      >
        {scene.tag}
      </div>
      {lines.map((line, i) => {
        const pop = spring({frame: frame - 8 - i * 7, fps, config: {damping: 12, mass: 0.8}});
        return (
          <div
            key={i}
            style={{
              fontSize: 120,
              fontWeight: 900,
              lineHeight: 1.2,
              textAlign: 'center',
              transform: `scale(${0.6 + pop * 0.4})`,
              opacity: pop,
            }}
          >
            {line}
          </div>
        );
      })}
      <div
        style={{
          width: lineWidth,
          height: 10,
          borderRadius: 5,
          marginTop: 48,
          background: `linear-gradient(90deg, ${theme.primary}, ${theme.secondary})`,
        }}
      />
      <div
        style={{
          fontSize: 52,
          color: theme.muted,
          marginTop: 48,
          opacity: subtitleOpacity,
          textAlign: 'center',
        }}
      >
        {scene.subtitle}
      </div>
    </AbsoluteFill>
  );
};
