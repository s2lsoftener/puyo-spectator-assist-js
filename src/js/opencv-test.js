import cv from "@mjyc/opencv.js";
import testImage from "../img/lagnus.png";

/**
 * Load image from URL. Returns an HTMLImageElement
 * @param {string} src URL/path of image
 * @returns {Promise<HTMLImageElement>}
 */
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = document.createElement("img");
    img.src = src;
    img.onload = () => {
      resolve(img);
    }
  });
}

/**
 * @typedef {Object} ScreenRect
 * @property {number} x0 top-left x
 * @property {number} y0 top-left y
 * @property {number} x1 bottom-right x
 * @property {number} y1 bottom-right y
 */

/**
 * Get points for the top-left and bottom-right corners
 * of the game screen.
 * Current ideas for finding the screen region:
 * * template matching board features (not scale or aspect ratio invariant though...)
 * * matching keypoints / feature descriptors (complicated setup?)
 * * generalized hough transform (kinda complicated, not sure if it'll work)
 * * just give a GUI option to manually set it
 * @returns {ScreenRect} { x0, y0, x1, y1 }
 */
function getScreenRect() {
  // For now, just assume that I know the screen region already.
  return { x0: 0, y0: 0, x1: 1920, y1: 1080 }
}

/**
 * @param {ScreenRect} screenRect
 * @returns {[number, number]}
 */
function getDimsFromScreenRect(screenRect) {
  const width = screenRect.x1 - screenRect.x0;
  const height = screenRect.y1 - screenRect.y0;
  return [width, height];
}

/**
 * @param {ScreenRect} boardRect
 */
function getCellROIs(boardRect) {
  const width = boardRect.x1 - boardRect.x0;
  const height = boardRect.y1 - boardRect.y0;
  const cellWidth = width / 6;
  const cellHeight = height / 12;
  
}

export default async function opencvTest() {
  console.log(cv);

  // Load test iamge
  const img = await loadImage(testImage);
  const mat = cv.imread(img);

  // Outline P1 board
  const screenRect = getScreenRect();
  const [screenWidth, screenHeight] = getDimsFromScreenRect(screenRect);
  const boardWidth = screenWidth * 0.147;
  const boardHeight = screenHeight * 0.713;
  const p1Board = {
    x0: screenRect.x0 + screenWidth * 0.144,
    y0: screenRect.y0 + screenHeight * 0.150,
    x1: (screenRect.x0 + screenWidth * 0.2) + boardWidth,
    y1: (screenRect.y0 + screenHeight * 0.1) + boardHeight
  }

  cv.rectangle(mat, new cv.Point(p1Board.x0, p1Board.y0), new cv.Point(p1Board.x1, p1Board.y1), new cv.Scalar(255, 0, 0, 255), 1, cv.LINE_AA, 0);

  // Resize image
  let dst = new cv.Mat();
  cv.resize(mat, dst, new cv.Size(1920 * 1, 1080 * 1));

  // Show dst on canvas
  const canvasOutput = document.getElementById("canvas-output");
  cv.imshow(canvasOutput, dst);
  
  // Give mat to window object to allow in-browser debugging.
  window.mat = mat;
  window.cv = cv;
}