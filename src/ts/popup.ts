// import opencvTest from './opencv-test';

// opencvTest();
import cv from '@mjyc/opencv.js';
import ScreenAnalyzer from './spectator-assist/screen-analyzer';
import testImage from '../img/lagnus.png';

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise(resolve => {
    const img = document.createElement('img');
    img.src = src;
    img.onload = (): void => {
      resolve(img);
    };
  });
}

(async function(): Promise<void> {
  const img = await loadImage(testImage);
  const mat = cv.imread(img);
  const canvas = document.getElementById('canvas-output') as HTMLCanvasElement;
  const screenAnalyzer = new ScreenAnalyzer(canvas);

  screenAnalyzer
    .setVideoFrame(mat)
    .getGameScreenMask()
    .getGameScreenImage()
    .getField(1)
    .getFieldCellMasks(1)
    .getFieldCells(1)
    .getScoreAreaFeatures(1)
    .getScoreDigitFeatures(1)
    .analyzeFieldCell(1, 0, 11)
    .drawROIs(1);

  console.log('Assigning object?');
  Object.assign(window, { screenAnalyzer });
})();
