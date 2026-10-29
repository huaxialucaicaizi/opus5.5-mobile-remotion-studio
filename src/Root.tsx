import React from 'react';
import {Composition} from 'remotion';
import {AIExplainer, type AIExplainerProps} from './AIExplainer';
import {getTotalFrames} from './config/timing';
import {videoConfig} from './config/video.config';
import {getLeaderboardFrames, leaderboardConfig} from './leaderboard/config';
import {Leaderboard, type LeaderboardProps} from './leaderboard/Leaderboard';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="AIExplainer"
        component={AIExplainer}
        width={videoConfig.width}
        height={videoConfig.height}
        fps={videoConfig.fps}
        durationInFrames={getTotalFrames(videoConfig)}
        defaultProps={{config: videoConfig} satisfies AIExplainerProps}
        // 时长、尺寸始终由（可能被 --props 覆盖的）配置计算
        calculateMetadata={({props}) => ({
          durationInFrames: getTotalFrames(props.config),
          width: props.config.width,
          height: props.config.height,
          fps: props.config.fps,
        })}
      />
      <Composition
        id="Leaderboard"
        component={Leaderboard}
        width={leaderboardConfig.width}
        height={leaderboardConfig.height}
        fps={leaderboardConfig.fps}
        durationInFrames={getLeaderboardFrames(leaderboardConfig)}
        defaultProps={{config: leaderboardConfig} satisfies LeaderboardProps}
        calculateMetadata={({props}) => ({
          durationInFrames: getLeaderboardFrames(props.config),
          width: props.config.width,
          height: props.config.height,
          fps: props.config.fps,
        })}
      />
    </>
  );
};
