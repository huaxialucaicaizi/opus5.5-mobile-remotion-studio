// Remotion CLI 配置：https://www.remotion.dev/docs/config
import {Config} from '@remotion/cli/config';

Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(90);
Config.setOverwriteOutput(true);
Config.setCodec('h264');
Config.setCrf(20);
Config.setPixelFormat('yuv420p');
Config.setColorSpace('bt709');
Config.setAudioCodec('aac');

// 默认由 Remotion 自动下载 Chrome Headless Shell。
// 在无法访问下载源的环境（例如 Claude Code 云端会话）里，
// 设置 REMOTION_BROWSER_EXECUTABLE 指向本机已有的 headless shell。
if (process.env.REMOTION_BROWSER_EXECUTABLE) {
  Config.setBrowserExecutable(process.env.REMOTION_BROWSER_EXECUTABLE);
}
