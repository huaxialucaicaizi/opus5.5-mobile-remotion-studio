import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import type {Subtitle, ThemeConfig, VideoConfig} from '../config/types';

/** 底部字幕层。字幕时间相对于所在镜头的开头。 */
export const Subtitles: React.FC<{
  subtitles: Subtitle[];
  theme: ThemeConfig;
  style: VideoConfig['subtitleStyle'];
}> = ({subtitles, theme, style}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const current = subtitles.find((s) => t >= s.start && t < s.end);

  if (!style.enabled || !current) {
    return null;
  }

  const local = (t - current.start) * fps;
  const remaining = (current.end - t) * fps;
  const opacity = Math.min(
    interpolate(local, [0, 6], [0, 1], {extrapolateRight: 'clamp'}),
    interpolate(remaining, [0, 6], [0, 1], {extrapolateRight: 'clamp'}),
  );

  return (
    <AbsoluteFill
      style={{justifyContent: 'flex-end', alignItems: 'center', paddingBottom: style.bottom}}
    >
      <div
        style={{
          maxWidth: 920,
          padding: '18px 36px',
          borderRadius: 20,
          backgroundColor: 'rgba(0, 0, 0, 0.55)',
          color: theme.text,
          fontFamily: theme.fontFamily,
          fontSize: style.fontSize,
          fontWeight: 600,
          lineHeight: 1.4,
          textAlign: 'center',
          opacity,
          transform: `translateY(${(1 - opacity) * 12}px)`,
        }}
      >
        {current.text}
      </div>
    </AbsoluteFill>
  );
};
