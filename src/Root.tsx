import React from 'react';
import {Composition} from 'remotion';
import {AIExplainer, type AIExplainerProps} from './AIExplainer';
import {getTotalFrames} from './config/timing';
import {videoConfig} from './config/video.config';
import {ChinaHistory, getHistoryFrames, type ChinaHistoryProps} from './history/ChinaHistory';
import {historyConfig} from './history/config';

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
        id="ChinaHistory"
        component={ChinaHistory}
        width={historyConfig.width}
        height={historyConfig.height}
        fps={historyConfig.fps}
        durationInFrames={getHistoryFrames(historyConfig)}
        defaultProps={{config: historyConfig} satisfies ChinaHistoryProps}
        calculateMetadata={({props}) => ({
          durationInFrames: getHistoryFrames(props.config),
          width: props.config.width,
          height: props.config.height,
          fps: props.config.fps,
        })}
      />
    </>
  );
};
