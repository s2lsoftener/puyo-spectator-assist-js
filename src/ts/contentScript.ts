import cv from '../js/opencv.js';
import ScreenAnalyzer from './spectator-assist/screen-analyzer';
import { runWhenOpenCVLoaded } from './spectator-assist/helper';

const script = async (): Promise<void> => {
  const video: HTMLVideoElement = document.querySelector('video.video-stream');
  if (video.readyState === 4) {
    console.log('loaded');
  } else {
    console.log('video not loaded');
  }
  const cap = new cv.VideoCapture(video);
  const src = new cv.Mat(video.offsetHeight, video.offsetWidth, cv.CV_8UC4, new cv.Scalar(0, 0, 0, 255));
  console.log(src.type());
  const canvas = document.createElement('canvas');
  const screenAnalyzer = new ScreenAnalyzer(canvas);
  console.log(cap);
  console.log('Assigning to window object');
  Object.assign(window, { mat: src, screenAnalyzer: screenAnalyzer });
  video.height = video.offsetHeight;
  video.width = video.offsetWidth;
  cap.read(src);
  // function updateCanvas(): void {
  //   console.log('Is this getting called?');
  //   video.height = video.offsetHeight;
  //   video.width = video.offsetWidth;
  //   try {
  //     cap.read(src);
  //     console.log(src);
  //     screenAnalyzer
  //       .setVideoFrame(src)
  //       .getGameScreenMask()
  //       .getGameScreenImage()
  //       .getField(1)
  //       .getFieldCellRects(1)
  //       .getFieldCells(1)
  //       .getScoreAreaFeatures(1)
  //       .getScoreDigitFeatures(1)
  //       .analyzeFieldCells(1)
  //       .cleanUpFrameData();
  //     requestAnimationFrame(updateCanvas);
  //   } catch (e) {
  //     console.error(e);
  //     setTimeout(() => {
  //       updateCanvas();
  //     }, 100);
  //   }
  // }

  // console.log('First attempt...');
  // requestAnimationFrame(updateCanvas);
};

runWhenOpenCVLoaded(script);
