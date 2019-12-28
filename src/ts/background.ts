import cv from '../js/opencv.js';
import ScreenAnalyzer from './spectator-assist/screen-analyzer';
import testImage from '../img/ringo_seriri_2.png';
import { loadImage } from './spectator-assist/helper';

cv['onRuntimeInitialized'] = async (): Promise<void> => {
  console.log('Opencv ready');
  const img = await loadImage(testImage);
  console.log('img', img);
  console.log('cv', cv);
  Object.assign(window, { img: img, cv: cv });
  const testMat = new cv.Mat();
  console.log('made a test mat');
  const mat = cv.imread(img);
  console.log('test');
  const canvas = document.getElementById('canvas-output') as HTMLCanvasElement;
  const screenAnalyzer = new ScreenAnalyzer(canvas);

  screenAnalyzer
    .setVideoFrame(mat)
    .getGameScreenMask()
    .getGameScreenImage()
    .getField(1)
    .getFieldCellRects(1)
    .getFieldCells(1)
    .getScoreAreaFeatures(1)
    .getScoreDigitFeatures(1)
    .analyzeFieldCells(1)
    .drawROIs(1);

  Object.assign(window, { screenAnalyzer });
};
