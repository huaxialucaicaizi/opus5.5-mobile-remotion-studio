import type {VideoConfig} from './types';

export const secondsToFrames = (seconds: number, fps: number) =>
  Math.round(seconds * fps);

/** 根据配置计算视频总帧数 = 各镜头帧数之和。 */
export const getTotalFrames = (config: VideoConfig) =>
  config.scenes.reduce(
    (sum, scene) => sum + secondsToFrames(scene.durationInSeconds, config.fps),
    0,
  );
