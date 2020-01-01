import cv from '../../js/opencv.js';

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise(resolve => {
    const img = document.createElement('img');
    img.src = src;
    img.onload = (): void => {
      resolve(img);
    };
  });
}

function runWhenOpenCVLoaded(callback: () => {}): void {
  try {
    const test = new cv.Mat();
    if (test) {
      console.log('OpenCV Ready!');
      test.delete();
      callback();
    }
  } catch (e) {
    console.log('OpenCV Not Ready...');
    // setTimeout(() => {
    //   runWhenOpenCVLoaded(callback);
    // }, 10);
    requestAnimationFrame(() => {
      runWhenOpenCVLoaded(callback);
    });
  }
}

export { loadImage, runWhenOpenCVLoaded };
