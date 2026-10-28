import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import type {FlowSceneConfig, ThemeConfig} from '../config/types';

const NODE_HEIGHT = 150;
const GAP = 64;

/** 镜头 3：流程图动画。节点逐个出现，连线生长，光点沿流程移动。 */
export const FlowScene: React.FC<{scene: FlowSceneConfig; theme: ThemeConfig}> = ({
  scene,
  theme,
}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  const count = scene.steps.length;
  // 节点在镜头前 75% 的时间里依次点亮
  const stepFrames = (durationInFrames * 0.75) / Math.max(count, 1);
  const headingIn = spring({frame, fps, config: {damping: 16}});
  const progress = interpolate(frame, [fps * 0.3, fps * 0.3 + stepFrames * count], [0, count], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        fontFamily: theme.fontFamily,
        color: theme.text,
        alignItems: 'center',
        paddingTop: 220,
      }}
    >
      <div
        style={{
          fontSize: 76,
          fontWeight: 800,
          marginBottom: 70,
          opacity: headingIn,
          transform: `translateY(${(1 - headingIn) * 40}px)`,
        }}
      >
        {scene.heading}
      </div>
      <div style={{position: 'relative', width: 840}}>
        {scene.steps.map((step, i) => {
          const start = Math.round(fps * 0.3 + i * stepFrames);
          const enter = spring({frame: frame - start, fps, config: {damping: 14}});
          const lit = progress > i;
          const current = progress > i && progress <= i + 1;
          const accent = lit ? theme.primary : 'rgba(255,255,255,0.18)';
          const connector = interpolate(progress, [i + 0.6, i + 1], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });
          return (
            <div key={step.label} style={{position: 'relative'}}>
              <div
                style={{
                  height: NODE_HEIGHT,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 36,
                  padding: '0 44px',
                  borderRadius: 32,
                  backgroundColor: current ? `${theme.primary}22` : 'rgba(255,255,255,0.05)',
                  border: `3px solid ${accent}`,
                  boxShadow: current ? `0 0 50px ${theme.primary}66` : 'none',
                  opacity: enter,
                  transform: `scale(${0.85 + enter * 0.15})`,
                }}
              >
                <div
                  style={{
                    width: 72,
                    height: 72,
                    flexShrink: 0,
                    borderRadius: 36,
                    backgroundColor: lit ? theme.primary : 'rgba(255,255,255,0.15)',
                    color: theme.background,
                    fontSize: 40,
                    fontWeight: 900,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {i + 1}
                </div>
                <div>
                  <div style={{fontSize: 54, fontWeight: 800}}>{step.label}</div>
                  <div style={{fontSize: 36, color: theme.muted, marginTop: 4}}>
                    {step.detail}
                  </div>
                </div>
              </div>
              {i < count - 1 ? (
                <div style={{height: GAP, display: 'flex', justifyContent: 'center'}}>
                  <div
                    style={{
                      width: 8,
                      height: GAP * connector,
                      borderRadius: 4,
                      background: `linear-gradient(${theme.primary}, ${theme.secondary})`,
                    }}
                  />
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
