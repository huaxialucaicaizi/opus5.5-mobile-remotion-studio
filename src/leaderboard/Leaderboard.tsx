import '@fontsource/zcool-kuaile/400.css';
import React, {useEffect, useState} from 'react';
import {AbsoluteFill, continueRender, delayRender, Html5Audio, interpolate, Series, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Bot} from './Bot';
import {sceneStarts, type LeaderboardConfig} from './config';
import {Background, SceneView, sticker} from './scenes';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

/** 等站酷快乐体（按需分片加载）全部就绪后再渲染 */
const useFontReady = (config: LeaderboardConfig) => {
  const [handle] = useState(() => delayRender('加载站酷快乐体'));
  useEffect(() => {
    const text = JSON.stringify(config.scenes) + '0123456789↑↓−+VS!?考生 Elo 积分（下棋同款算法）';
    document.fonts
      .load('60px "ZCOOL KuaiLe"', text)
      .then(() => document.fonts.ready)
      .finally(() => continueRender(handle));
  }, [config, handle]);
};

/** 主持人“榜榜”和它的对话气泡：台词逐字出现，换台词时气泡弹一下 */
const Host: React.FC<{config: LeaderboardConfig}> = ({config}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const {theme} = config;
  const t = frame / fps;
  const starts = sceneStarts(config);
  const sceneIndex = Math.max(0, starts.findIndex((s, i) => t >= s && t < s + config.scenes[i].duration));
  const scene = config.scenes[sceneIndex];
  const local = t - starts[sceneIndex];
  const line = [...scene.host].reverse().find((h) => local >= h.at);
  const lineStart = line ? starts[sceneIndex] + line.at : 0;
  const since = t - lineStart;
  const chars = line ? Array.from(line.text) : [];
  const shown = Math.floor(interpolate(since, [0, 0.5], [0, chars.length], clamp));
  const bubblePop = spring({frame: Math.round(since * fps), fps, config: {damping: 10, mass: 0.5, stiffness: 200}});
  const isOutro = scene.kind === 'outro';
  // 结尾前 0.3 秒气泡收起
  const sceneEnd = starts[sceneIndex] + scene.duration;
  const closing = interpolate(t, [sceneEnd - 0.25, sceneEnd], [1, 0], clamp);
  const appear = spring({frame, fps, config: {damping: 10, mass: 0.6}});

  return (
    <>
      <div style={{position: 'absolute', left: 30, top: 1450, transform: `translateY(${(1 - appear) * 300}px)`}}>
        <Bot
          theme={theme}
          color={theme.colors.coral}
          size={230}
          seed={3}
          accessory="headset"
          mood={line && since < 0.6 ? 'happy' : isOutro ? 'happy' : 'smile'}
          wave={isOutro}
        />
        <div
          style={{
            position: 'absolute',
            bottom: -46,
            left: '50%',
            transform: 'translateX(-50%) rotate(-3deg)',
            ...sticker(theme, theme.colors.lemon),
            borderRadius: 999,
            boxShadow: `4px 5px 0 ${theme.ink}`,
            padding: '2px 20px',
            fontSize: 30,
            fontFamily: theme.font,
            color: theme.ink,
            whiteSpace: 'nowrap',
          }}
        >
          主持人 · 榜榜
        </div>
      </div>
      {line ? (
        <div
          style={{
            position: 'absolute',
            left: 300,
            right: 50,
            top: 1470,
            minHeight: 190,
            ...sticker(theme),
            padding: '26px 34px',
            display: 'flex',
            alignItems: 'center',
            fontFamily: theme.font,
            fontSize: 50,
            lineHeight: 1.4,
            color: theme.ink,
            whiteSpace: 'pre-line',
            transform: `scale(${(0.85 + bubblePop * 0.15) * closing})`,
            transformOrigin: '0% 70%',
            opacity: closing,
          }}
        >
          {/* 气泡尾巴 */}
          <svg width={50} height={44} style={{position: 'absolute', left: -44, top: 92}}>
            <path d="M 46 4 L 4 26 L 46 40" fill={theme.card} stroke={theme.ink} strokeWidth={6} strokeLinejoin="round" />
          </svg>
          <span>
            {chars.map((c, i) => (
              <span key={i} style={{opacity: i < shown ? 1 : 0}}>
                {c}
              </span>
            ))}
          </span>
        </div>
      ) : null}
    </>
  );
};

/** 顶部进度点：一共几课、现在在第几课 */
const Progress: React.FC<{config: LeaderboardConfig}> = ({config}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const starts = sceneStarts(config);
  const {theme} = config;
  return (
    <div style={{position: 'absolute', top: 60, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 14}}>
      {config.scenes.map((s, i) => {
        const p = interpolate(t, [starts[i], starts[i] + s.duration], [0, 1], clamp);
        return (
          <div key={i} style={{width: 64, height: 16, borderRadius: 8, border: `4px solid ${theme.ink}`, backgroundColor: '#FFFFFF', overflow: 'hidden'}}>
            <div style={{width: `${p * 100}%`, height: '100%', backgroundColor: theme.colors.pink}} />
          </div>
        );
      })}
    </div>
  );
};

export type LeaderboardProps = {config: LeaderboardConfig};

export const Leaderboard: React.FC<LeaderboardProps> = ({config}) => {
  useFontReady(config);
  const {fps, durationInFrames} = useVideoConfig();
  return (
    <AbsoluteFill>
      <Background theme={config.theme} />
      <Series>
        {config.scenes.map((scene, i) => (
          <Series.Sequence key={i} durationInFrames={Math.round(scene.duration * fps)} name={`${i + 1}. ${scene.chip} · ${scene.title.replace('\n', '')}`}>
            <SceneView scene={scene} theme={config.theme} />
          </Series.Sequence>
        ))}
      </Series>
      <Progress config={config} />
      <Host config={config} />
      {config.audio.enabled ? (
        <Html5Audio
          src={/^(https?:|blob:|data:|\/)/.test(config.audio.src) ? config.audio.src : staticFile(config.audio.src)}
          volume={(f) => config.audio.volume * interpolate(f, [durationInFrames - fps, durationInFrames], [1, 0], clamp)}
        />
      ) : null}
    </AbsoluteFill>
  );
};
