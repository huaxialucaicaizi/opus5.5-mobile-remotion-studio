import '@fontsource/ma-shan-zheng/400.css';
import '@fontsource/zcool-kuaile/400.css';
import React, {useEffect, useState} from 'react';
import {
  AbsoluteFill,
  continueRender,
  delayRender,
  Easing,
  Html5Audio,
  interpolate,
  Series,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {ART, ENSO} from './art';
import {BoilFilter, Caption, LineArt, Paper, Seal, Timeline, useStampShake, YearCounter} from './components';
import {getSegments, type Era, type HistoryConfig} from './config';

type Theme = HistoryConfig['theme'];
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

/** 等中文字体（按需分片加载）全部就绪后再开始渲染，避免首帧闪出系统字体 */
const useFontsReady = (config: HistoryConfig) => {
  const [handle] = useState(() => delayRender('加载毛笔字体'));
  useEffect(() => {
    const titles = [config.intro.from, config.intro.to, config.outro.title, '完', ...config.eras.flatMap((e) => [e.title, e.seal])].join('');
    const body = [
      config.intro.subtitle,
      config.outro.subtitle,
      '约公元前年0123456789',
      ...config.eras.flatMap((e) => [e.caption, e.short]),
      ...Object.values(ART).flatMap((a) => ('labels' in a ? a.labels.map((l) => l.text) : [])),
    ].join('');
    Promise.all([
      document.fonts.load('80px "Ma Shan Zheng"', titles),
      document.fonts.load('40px "ZCOOL KuaiLe"', body),
    ])
      .then(() => document.fonts.ready)
      .finally(() => continueRender(handle));
  }, [config, handle]);
};

/** 镜头进出：从右侧滑入，向左侧滑出，像展开一幅长卷 */
const useSlide = (durationInFrames: number, enter = true, exit = true) => {
  const frame = useCurrentFrame();
  const inP = enter ? interpolate(frame, [0, 10], [1, 0], {...clamp, easing: Easing.out(Easing.cubic)}) : 0;
  const outP = exit
    ? interpolate(frame, [durationInFrames - 8, durationInFrames], [0, 1], {...clamp, easing: Easing.in(Easing.cubic)})
    : 0;
  return {transform: `translateX(${inP * 220 - outP * 220}px)`, opacity: 1 - Math.max(inP, outP)};
};

const BrushTitle: React.FC<{text: string; theme: Theme; size: number; start: number; color?: string}> = ({
  text,
  theme,
  size,
  start,
  color,
}) => {
  const frame = useCurrentFrame();
  const reveal = interpolate(frame, [start, start + 14], [0, 100], {...clamp, easing: Easing.out(Easing.quad)});
  return (
    <div
      style={{
        fontFamily: theme.titleFont,
        fontSize: size,
        lineHeight: 1.1,
        color: color ?? theme.ink,
        clipPath: `inset(-20% ${100 - reveal}% -20% 0)`,
        whiteSpace: 'nowrap',
        filter: 'url(#boil)',
      }}
    >
      {text}
    </div>
  );
};

const IntroScene: React.FC<{config: HistoryConfig; durationInFrames: number}> = ({config, durationInFrames}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const {theme, intro} = config;
  const slide = useSlide(durationInFrames, false, true);
  const shake = useStampShake(45, 18);
  const popFrom = spring({frame: frame - 4, fps, config: {damping: 10, mass: 0.7}});
  const strike = interpolate(frame, [28, 38], [0, 100], clamp);
  const popTo = spring({frame: frame - 39, fps, config: {damping: 8, mass: 0.6, stiffness: 200}});
  const sub = interpolate(frame, [58, 70], [0, 1], clamp);

  return (
    <AbsoluteFill style={{...slide, translate: `${shake.x}px ${shake.y}px`, alignItems: 'center'}}>
      <div style={{position: 'absolute', top: 360}}>
        <LineArt art={{strokes: [{d: ENSO, w: 9, c: 'ink'}]}} theme={theme} size={900} start={0} duration={26} />
      </div>
      <div
        style={{
          position: 'absolute',
          top: 600,
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <div style={{position: 'relative', transform: `scale(${popFrom})`, opacity: popFrom}}>
          <div style={{fontFamily: theme.titleFont, fontSize: 210, color: theme.ink, lineHeight: 1.1, filter: 'url(#boil)'}}>
            {intro.from}
          </div>
          <div
            style={{
              position: 'absolute',
              left: -20,
              top: '52%',
              height: 22,
              width: `calc(${strike}% + 40px)`,
              maxWidth: 'calc(100% + 40px)',
              backgroundColor: theme.red,
              borderRadius: 11,
              transform: 'rotate(-6deg)',
              filter: 'url(#boil)',
            }}
          />
        </div>
        <div
          style={{
            fontFamily: theme.titleFont,
            fontSize: 230,
            lineHeight: 1.1,
            color: theme.red,
            transform: `scale(${frame < 39 ? 0 : 2.2 - popTo * 1.2}) rotate(-4deg)`,
            opacity: frame < 39 ? 0 : 1,
            filter: 'url(#boil)',
          }}
        >
          {intro.to}
        </div>
      </div>
      <div
        style={{
          position: 'absolute',
          top: 1380,
          fontFamily: theme.bodyFont,
          fontSize: 60,
          color: theme.inkSoft,
          opacity: sub,
          transform: `translateY(${(1 - sub) * 20}px)`,
          letterSpacing: 6,
        }}
      >
        {intro.subtitle}
      </div>
    </AbsoluteFill>
  );
};

const EraScene: React.FC<{era: Era; prevYear: number; theme: Theme; durationInFrames: number}> = ({
  era,
  prevYear,
  theme,
  durationInFrames,
}) => {
  const frame = useCurrentFrame();
  const slide = useSlide(durationInFrames);
  const stampAt = 15;
  const shake = useStampShake(stampAt);
  const artDuration = Math.min(Math.round(durationInFrames * 0.5), 70);
  const captionDuration = Math.min(Array.from(era.caption).length * 1.4, 36);
  const zoom = interpolate(frame, [0, durationInFrames], [1, 1.04]);

  return (
    <AbsoluteFill style={{...slide, translate: `${shake.x}px ${shake.y}px`}}>
      <div
        style={{
          position: 'absolute',
          top: 150,
          left: 80,
          right: 80,
          display: 'flex',
          alignItems: 'center',
          gap: 48,
        }}
      >
        <Seal text={era.seal} theme={theme} size={200} at={stampAt} />
        <div style={{display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0}}>
          <YearCounter from={prevYear} to={era.year} approx={era.approx} theme={theme} duration={18} />
          <BrushTitle text={era.title} theme={theme} size={Array.from(era.title).length > 5 ? 92 : 112} start={18} />
        </div>
      </div>
      <div
        style={{
          position: 'absolute',
          top: 470,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          transform: `scale(${zoom})`,
        }}
      >
        <LineArt art={ART[era.art]} theme={theme} size={860} start={12} duration={artDuration} />
      </div>
      <div style={{position: 'absolute', top: 1360, left: 80, right: 80, display: 'flex', justifyContent: 'center'}}>
        <Caption text={era.caption} highlight={era.highlight} theme={theme} start={28} duration={captionDuration} />
      </div>
    </AbsoluteFill>
  );
};

const OutroScene: React.FC<{config: HistoryConfig}> = ({config}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  const {theme, outro} = config;
  const slide = useSlide(durationInFrames, true, false);
  const shake = useStampShake(30, 16);
  const pop = spring({frame: frame - 8, fps, config: {damping: 10, mass: 0.7}});
  const sub = interpolate(frame, [42, 56], [0, 1], clamp);
  const fadeOut = interpolate(frame, [durationInFrames - 12, durationInFrames], [1, 0], clamp);

  return (
    <AbsoluteFill style={{...slide, translate: `${shake.x}px ${shake.y}px`, alignItems: 'center', opacity: fadeOut}}>
      <div style={{position: 'absolute', top: 330}}>
        <LineArt art={{strokes: [{d: ENSO, w: 9, c: 'red'}]}} theme={theme} size={900} start={0} duration={24} />
      </div>
      <div
        style={{
          position: 'absolute',
          top: 640,
          fontFamily: theme.titleFont,
          fontSize: 200,
          color: theme.ink,
          transform: `scale(${pop})`,
          opacity: pop,
          filter: 'url(#boil)',
        }}
      >
        {outro.title}
      </div>
      <div style={{position: 'absolute', top: 960, right: 170}}>
        <Seal text="完" theme={theme} size={150} at={30} rotate={8} />
      </div>
      <div
        style={{
          position: 'absolute',
          top: 1300,
          left: 100,
          right: 100,
          textAlign: 'center',
          fontFamily: theme.bodyFont,
          fontSize: 56,
          lineHeight: 1.5,
          color: theme.inkSoft,
          opacity: sub,
          transform: `translateY(${(1 - sub) * 20}px)`,
          whiteSpace: 'pre-line',
        }}
      >
        {outro.subtitle}
      </div>
    </AbsoluteFill>
  );
};

export type ChinaHistoryProps = {config: HistoryConfig};

export const ChinaHistory: React.FC<ChinaHistoryProps> = ({config}) => {
  useFontsReady(config);
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  const {theme} = config;
  const segments = getSegments(config).map((s) => ({...s, from: Math.round(s.start * fps), frames: Math.round(s.duration * fps)}));

  // 时间轴：进入新时代的前 12 帧，墨点从上一个刻度滑到当前刻度
  const seg = segments.find((s) => frame >= s.from && frame < s.from + s.frames) ?? segments[segments.length - 1];
  const local = frame - seg.from;
  const n = config.eras.length;
  const position =
    seg.kind === 'intro'
      ? 0
      : seg.kind === 'outro'
        ? n - 1
        : interpolate(local, [0, 12], [Math.max(0, seg.index - 1), seg.index], {...clamp, easing: Easing.inOut(Easing.cubic)});
  const timelineOpacity =
    seg.kind === 'intro' ? interpolate(local, [seg.frames - 10, seg.frames], [0, 1], clamp) : seg.kind === 'outro' ? interpolate(local, [0, 10], [1, 0], clamp) : 1;

  return (
    <AbsoluteFill>
      <Paper theme={theme} />
      <BoilFilter />
      <Series>
        <Series.Sequence durationInFrames={segments[0].frames} name="片头">
          <IntroScene config={config} durationInFrames={segments[0].frames} />
        </Series.Sequence>
        {config.eras.map((era, i) => (
          <Series.Sequence key={i} durationInFrames={segments[i + 1].frames} name={`${i + 1}. ${era.seal}`}>
            <EraScene
              era={era}
              prevYear={i === 0 ? era.year - 2000 : config.eras[i - 1].year}
              theme={theme}
              durationInFrames={segments[i + 1].frames}
            />
          </Series.Sequence>
        ))}
        <Series.Sequence durationInFrames={segments[segments.length - 1].frames} name="片尾">
          <OutroScene config={config} />
        </Series.Sequence>
      </Series>
      <Timeline labels={config.eras.map((e) => e.short)} position={position} theme={theme} opacity={timelineOpacity} />
      {config.audio.enabled ? (
        <Html5Audio
          src={/^(https?:|blob:|data:|\/)/.test(config.audio.src) ? config.audio.src : staticFile(config.audio.src)}
          volume={(f) => config.audio.volume * interpolate(f, [durationInFrames - fps, durationInFrames], [1, 0], clamp)}
        />
      ) : null}
    </AbsoluteFill>
  );
};

export const getHistoryFrames = (config: HistoryConfig) =>
  getSegments(config).reduce((sum, s) => sum + Math.round(s.duration * config.fps), 0);
