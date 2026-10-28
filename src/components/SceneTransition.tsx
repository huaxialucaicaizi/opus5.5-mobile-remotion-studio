import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';

/** 每个镜头首尾各做一次淡入淡出，镜头之间的切换更柔和。 */
export const SceneTransition: React.FC<{children: React.ReactNode}> = ({
  children,
}) => {
  const frame = useCurrentFrame();
  const {durationInFrames, fps} = useVideoConfig();
  const fade = Math.round(fps * 0.35);
  const opacity = interpolate(
    frame,
    [0, fade, durationInFrames - fade, durationInFrames],
    [0, 1, 1, 0],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
  );

  return <AbsoluteFill style={{opacity}}>{children}</AbsoluteFill>;
};
