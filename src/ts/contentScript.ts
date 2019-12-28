import cv from '../js/opencv.js';
import ScreenAnalyzer from './spectator-assist/screen-analyzer';

cv['onRuntimeInitialized'] = async (): Promise<void> => {
  console.log('Opencv!!', cv);

  console.log('Injected!');
  console.log(ScreenAnalyzer);
  const video: HTMLVideoElement = document.querySelector('video.video-stream');
  console.log(video);
  const canvas = document.createElement('canvas');
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.zIndex = '99999999';
  document.body.prepend(canvas);
  const ctx = canvas.getContext('2d');
  function updateCanvas(): void {
    console.log('Drawing image...?');
    canvas.width = video.offsetWidth;
    canvas.height = video.offsetHeight;
    ctx.drawImage(video, 0, 0, video.offsetWidth, video.offsetHeight);
    requestAnimationFrame(updateCanvas);
  }
  requestAnimationFrame(updateCanvas);
};
