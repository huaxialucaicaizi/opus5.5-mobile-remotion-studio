import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import type {ThemeConfig} from '../config/types';

/** 深色渐变背景 + 缓慢漂移的光晕 + 点阵网格。 */
export const Background: React.FC<{theme: ThemeConfig; color?: string}> = ({
  theme,
  color,
}) => {
  const frame = useCurrentFrame();
  const drift = Math.sin(frame / 60) * 80;
  const pulse = interpolate(Math.sin(frame / 45), [-1, 1], [0.45, 0.7]);

  return (
    <AbsoluteFill style={{backgroundColor: color ?? theme.background}}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at ${30 + drift / 20}% ${25 + drift / 30}%, ${theme.glow} 0%, transparent 55%)`,
          opacity: pulse,
        }}
      />
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at ${75 - drift / 25}% 80%, ${theme.secondary}33 0%, transparent 50%)`,
        }}
      />
      <AbsoluteFill
        style={{
          backgroundImage: `radial-gradient(${theme.muted}22 2px, transparent 2px)`,
          backgroundSize: '48px 48px',
          backgroundPosition: `0 ${-frame * 0.6}px`,
        }}
      />
    </AbsoluteFill>
  );
};
