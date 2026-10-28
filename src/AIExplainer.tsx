import React from 'react';
import {AbsoluteFill, Html5Audio, interpolate, Series, staticFile, useVideoConfig} from 'remotion';
import {Background} from './components/Background';
import {SceneTransition} from './components/SceneTransition';
import {Subtitles} from './components/Subtitles';
import {secondsToFrames} from './config/timing';
import type {SceneConfig, ThemeConfig, VideoConfig} from './config/types';
import {ConclusionScene, FlowScene, KeywordScene, OutroScene, TitleScene} from './scenes';

export type AIExplainerProps = {config: VideoConfig};

const renderScene = (scene: SceneConfig, theme: ThemeConfig) => {
  switch (scene.type) {
    case 'title':
      return <TitleScene scene={scene} theme={theme} />;
    case 'keywords':
      return <KeywordScene scene={scene} theme={theme} />;
    case 'flow':
      return <FlowScene scene={scene} theme={theme} />;
    case 'conclusion':
      return <ConclusionScene scene={scene} theme={theme} />;
    case 'outro':
      return <OutroScene scene={scene} theme={theme} />;
  }
};

/** 主合成：按配置顺序串联镜头，叠加字幕和背景音乐。 */
export const AIExplainer: React.FC<AIExplainerProps> = ({config}) => {
  const {durationInFrames, fps} = useVideoConfig();
  const {theme, audio} = config;

  return (
    <AbsoluteFill style={{backgroundColor: theme.background}}>
      <Series>
        {config.scenes.map((scene, i) => (
          <Series.Sequence
            key={i}
            name={`${i + 1}. ${scene.type}`}
            durationInFrames={secondsToFrames(scene.durationInSeconds, fps)}
          >
            <Background theme={theme} color={scene.background} />
            <SceneTransition>{renderScene(scene, theme)}</SceneTransition>
            <Subtitles subtitles={scene.subtitles} theme={theme} style={config.subtitleStyle} />
          </Series.Sequence>
        ))}
      </Series>
      {audio.enabled ? (
        <Html5Audio
          src={/^(https?:|blob:|data:|\/)/.test(audio.src) ? audio.src : staticFile(audio.src)}
          volume={(f) =>
            audio.volume *
            interpolate(f, [0, fps, durationInFrames - fps * 1.5, durationInFrames], [0, 1, 1, 0], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            })
          }
        />
      ) : null}
    </AbsoluteFill>
  );
};
