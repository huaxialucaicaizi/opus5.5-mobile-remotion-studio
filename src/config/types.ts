// 配置的类型定义。一般不需要改这个文件，内容请改 video.config.ts。

/** 一条字幕。start / end 是相对于所在镜头开头的秒数。 */
export type Subtitle = {
  text: string;
  start: number;
  end: number;
};

type SceneBase = {
  /** 镜头时长（秒）。所有镜头时长之和就是视频总时长。 */
  durationInSeconds: number;
  /** 镜头背景色（可选，不填则使用 theme.background）。 */
  background?: string;
  /** 本镜头的字幕。 */
  subtitles: Subtitle[];
};

export type TitleSceneConfig = SceneBase & {
  type: 'title';
  /** 顶部小标签，例如栏目名。 */
  tag: string;
  title: string;
  subtitle: string;
};

export type KeywordSceneConfig = SceneBase & {
  type: 'keywords';
  heading: string;
  keywords: {word: string; description: string}[];
};

export type FlowSceneConfig = SceneBase & {
  type: 'flow';
  heading: string;
  steps: {label: string; detail: string}[];
};

export type ConclusionSceneConfig = SceneBase & {
  type: 'conclusion';
  heading: string;
  /** 结论正文。正文中与 highlight 相同的文字会被高亮。 */
  statement: string;
  highlight: string;
};

export type OutroSceneConfig = SceneBase & {
  type: 'outro';
  title: string;
  subtitle: string;
  handle: string;
};

export type SceneConfig =
  | TitleSceneConfig
  | KeywordSceneConfig
  | FlowSceneConfig
  | ConclusionSceneConfig
  | OutroSceneConfig;

export type ThemeConfig = {
  /** 默认背景色 */
  background: string;
  /** 背景光晕色 */
  glow: string;
  /** 主强调色 */
  primary: string;
  /** 次强调色 */
  secondary: string;
  /** 正文颜色 */
  text: string;
  /** 弱化文字颜色 */
  muted: string;
  /** 字体栈（需包含中文字体） */
  fontFamily: string;
};

export type VideoConfig = {
  /** 画面规格 */
  width: number;
  height: number;
  fps: number;
  theme: ThemeConfig;
  audio: {
    enabled: boolean;
    /** public/ 目录下的音频文件路径（也可以是 https:// 开头的完整地址） */
    src: string;
    /** 0 ~ 1 */
    volume: number;
  };
  subtitleStyle: {
    /** 是否显示字幕 */
    enabled: boolean;
    fontSize: number;
    /** 字幕距画面底部的像素距离 */
    bottom: number;
  };
  scenes: SceneConfig[];
};
