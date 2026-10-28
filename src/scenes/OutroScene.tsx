import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import type {OutroSceneConfig, ThemeConfig} from '../config/types';

/** 镜头 5：片尾。头像圆环旋转、标题弹入、账号名淡入。 */
export const OutroScene: React.FC<{scene: OutroSceneConfig; theme: ThemeConfig}> = ({
  scene,
  theme,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const ringIn = spring({frame, fps, config: {damping: 12}});
  const titleIn = spring({frame: frame - 8, fps, config: {damping: 12}});
  const fadeIn = interpolate(frame, [fps * 0.8, fps * 1.4], [0, 1], {
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
        paddingBottom: 300,
      }}
    >
      <div
        style={{
          width: 260,
          height: 260,
          borderRadius: '50%',
          padding: 10,
          background: `conic-gradient(from ${frame * 4}deg, ${theme.primary}, ${theme.secondary}, ${theme.primary})`,
          transform: `scale(${ringIn})`,
          marginBottom: 70,
        }}
      >
        <div
          style={{
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            backgroundColor: theme.background,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 110,
            fontWeight: 900,
            color: theme.primary,
          }}
        >
          AI
        </div>
      </div>
      <div
        style={{
          fontSize: 110,
          fontWeight: 900,
          textAlign: 'center',
          transform: `translateY(${(1 - titleIn) * 80}px)`,
          opacity: titleIn,
        }}
      >
        {scene.title}
      </div>
      <div
        style={{
          fontSize: 48,
          color: theme.muted,
          marginTop: 40,
          textAlign: 'center',
          lineHeight: 1.4,
          opacity: fadeIn,
        }}
      >
        {scene.subtitle}
      </div>
      <div
        style={{
          fontSize: 52,
          fontWeight: 700,
          color: theme.primary,
          marginTop: 60,
          opacity: fadeIn,
        }}
      >
        {scene.handle}
      </div>
    </AbsoluteFill>
  );
};
