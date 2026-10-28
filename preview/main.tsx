// 手机预览页：用 @remotion/player 在浏览器里实时播放同一个合成，
// 并展示云端渲染出的 MP4、下载入口和校验报告。
// 由 scripts/build-preview.ts 打包进 preview/dist/index.html。
import {Player, type PlayerRef} from '@remotion/player';
import React, {useEffect, useRef, useState} from 'react';
import {createRoot} from 'react-dom/client';
import {AIExplainer} from '../src/AIExplainer';
import {getTotalFrames, secondsToFrames} from '../src/config/timing';
import {videoConfig} from '../src/config/video.config';

type Check = {name: string; expected: string; actual: string; pass: boolean};
type PreviewData = {
  mp4Url: string;
  posterUrl: string;
  bgmUrl: string;
  releaseUrl: string;
  repoUrl: string;
  configUrl: string;
  commit: string;
  renderedAt: string;
  report: {sizeBytes: number; sha256: string; checks: Check[]; passed: boolean} | null;
};

type Downloads = {save: (req: {filename: string; data: Blob}) => Promise<unknown>};
declare global {
  interface Window {
    claude?: {use: (name: string) => Promise<unknown>};
  }
}

const data: PreviewData = JSON.parse(
  document.getElementById('preview-data')?.textContent ?? '{}',
);

const SCENE_NAMES: Record<string, string> = {
  title: '标题开场',
  keywords: '关键词动效',
  flow: '流程图动画',
  conclusion: '重点结论',
  outro: '片尾',
};

const config = {
  ...videoConfig,
  audio: {...videoConfig.audio, src: data.bgmUrl || videoConfig.audio.src, enabled: Boolean(data.bgmUrl)},
};
const totalFrames = getTotalFrames(config);
// 每个镜头开头有淡入，第 0 帧是空画面，所以初始帧和跳转点都稍微往后
const POSTER_FRAME = Math.min(Math.round(config.fps * 1.5), totalFrames - 1);
const SEEK_OFFSET = Math.round(config.fps * 0.5);
const scenes = config.scenes.reduce<{name: string; from: number; frames: number; seconds: number}[]>(
  (acc, scene) => {
    const from = acc.length ? acc[acc.length - 1].from + acc[acc.length - 1].frames : 0;
    const frames = secondsToFrames(scene.durationInSeconds, config.fps);
    return [...acc, {name: SCENE_NAMES[scene.type] ?? scene.type, from, frames, seconds: scene.durationInSeconds}];
  },
  [],
);

const Timeline: React.FC<{frame: number; onSeek: (frame: number) => void}> = ({frame, onSeek}) => (
  <div className="timeline" role="list">
    {scenes.map((s, i) => {
      const active = frame >= s.from && frame < s.from + s.frames;
      const progress = active ? (frame - s.from) / s.frames : frame >= s.from + s.frames ? 1 : 0;
      return (
        <button
          key={i}
          id={`scene-${i + 1}`}
          role="listitem"
          className={`scene${active ? ' is-active' : ''}`}
          style={{flexGrow: s.frames}}
          onClick={() => onSeek(s.from + Math.min(SEEK_OFFSET, s.frames - 1))}
        >
          <span className="scene-fill" style={{transform: `scaleX(${progress})`}} />
          <span className="scene-index">{i + 1}</span>
          <span className="scene-name">{s.name}</span>
          <span className="scene-dur">{s.seconds}s</span>
        </button>
      );
    })}
  </div>
);

const LivePreview: React.FC = () => {
  const ref = useRef<PlayerRef>(null);
  const [frame, setFrame] = useState(POSTER_FRAME);

  useEffect(() => {
    const player = ref.current;
    if (!player) return;
    const onFrame = (e: {detail: {frame: number}}) => setFrame(e.detail.frame);
    player.addEventListener('frameupdate', onFrame);
    return () => player.removeEventListener('frameupdate', onFrame);
  }, []);

  return (
    <>
      <div className="stage">
        <Player
          ref={ref}
          component={AIExplainer}
          inputProps={{config}}
          durationInFrames={totalFrames}
          compositionWidth={config.width}
          compositionHeight={config.height}
          fps={config.fps}
          initialFrame={POSTER_FRAME}
          controls
          clickToPlay
          allowFullscreen
          showVolumeControls
          acknowledgeRemotionLicense
          style={{width: '100%', borderRadius: 14, overflow: 'hidden'}}
        />
      </div>
      <p className="hint">点镜头跳转 · 当前 {(frame / config.fps).toFixed(1)}s / {totalFrames / config.fps}s</p>
      <Timeline
        frame={frame}
        onSeek={(f) => {
          ref.current?.seekTo(f);
          setFrame(f);
        }}
      />
    </>
  );
};

const DownloadButton: React.FC = () => {
  const [downloads, setDownloads] = useState<Downloads | null>(null);
  const [status, setStatus] = useState('');

  useEffect(() => {
    window.claude
      ?.use('downloads')
      .then((d) => setDownloads(d as Downloads | null))
      .catch(() => setDownloads(null));
  }, []);

  if (!downloads || !data.mp4Url) return null;

  const save = async () => {
    setStatus('正在准备文件…');
    try {
      const blob = await (await fetch(data.mp4Url)).blob();
      await downloads.save({filename: 'ai-explainer.mp4', data: blob});
      setStatus('已保存');
    } catch (err) {
      const code = (err as {code?: string}).code;
      setStatus(code === 'declined' ? '已取消' : '保存失败，请改用下方 GitHub 链接');
    }
  };

  return (
    <>
      <button id="save-mp4" className="btn btn-primary" onClick={save}>
        保存 MP4 到手机
      </button>
      {status ? <span className="status">{status}</span> : null}
    </>
  );
};

const FinalVideo: React.FC = () => (
  <>
    <div className="stage">
      {data.mp4Url ? (
        <video src={data.mp4Url} poster={data.posterUrl || undefined} controls playsInline preload="metadata" />
      ) : (
        <div className="empty">成片尚未上传</div>
      )}
    </div>
    <div className="actions">
      <DownloadButton />
      {data.releaseUrl ? (
        <a className="btn" href={data.releaseUrl} target="_blank" rel="noreferrer">
          GitHub Release 下载
        </a>
      ) : null}
    </div>
  </>
);

const Report: React.FC = () => {
  const r = data.report;
  if (!r) return <p className="muted">暂无校验报告。</p>;
  return (
    <>
      <p className={`verdict ${r.passed ? 'ok' : 'bad'}`}>
        {r.passed ? `全部 ${r.checks.length} 项通过` : '存在未通过项'}
        <span className="mono"> · {(r.sizeBytes / 1024 / 1024).toFixed(2)} MB</span>
      </p>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>检查项</th>
              <th>实际结果</th>
              <th aria-label="结果" />
            </tr>
          </thead>
          <tbody>
            {r.checks.map((c) => (
              <tr key={c.name}>
                <td>{c.name}</td>
                <td className="mono">{c.actual}</td>
                <td className={c.pass ? 'ok' : 'bad'}>{c.pass ? '通过' : '未通过'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="muted mono sha">SHA-256 {r.sha256}</p>
    </>
  );
};

const App: React.FC = () => {
  const [tab, setTab] = useState<'live' | 'mp4'>('live');
  return (
    <>
      <div className="segmented" role="tablist">
        <button id="tab-live" role="tab" aria-selected={tab === 'live'} onClick={() => setTab('live')}>
          实时预览
        </button>
        <button id="tab-mp4" role="tab" aria-selected={tab === 'mp4'} onClick={() => setTab('mp4')}>
          成片 MP4
        </button>
      </div>
      <section hidden={tab !== 'live'}>
        <LivePreview />
      </section>
      <section hidden={tab !== 'mp4'}>
        <FinalVideo />
      </section>
      <h2>校验报告</h2>
      <Report />
    </>
  );
};

createRoot(document.getElementById('app')!).render(<App />);
