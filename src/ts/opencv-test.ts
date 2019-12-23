import cv from '@mjyc/opencv.js';
import testImage from '../img/lagnus.png';

/** Load image from URL. Returns an HTMLImageElement */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise(resolve => {
    const img = document.createElement('img');
    img.src = src;
    img.onload = (): void => {
      resolve(img);
    };
  });
}

interface ScreenExtent {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

/**
 * Get points for the top-left and bottom-right corners
 * of the game screen.
 * Current ideas for finding the screen region:
 * * template matching board features (not scale or aspect ratio invariant though...)
 * * matching keypoints / feature descriptors (complicated setup?)
 * * generalized hough transform (kinda complicated, not sure if it'll work)
 * * just give a GUI option to manually set it
 */
function getScreenRect(): ScreenExtent {
  // For now, just assume that I know the screen region already.
  return { x0: 0, y0: 0, x1: 1920, y1: 1080 };
}

function getDimsFromScreenRect(screenRect: ScreenExtent): [number, number] {
  const width = screenRect.x1 - screenRect.x0;
  const height = screenRect.y1 - screenRect.y0;
  return [width, height];
}

/**
 * @param {ScreenRect} boardRect
 * @returns {{x: number, y: number, width: number, height: number}}
 */
function getCellCoordMatrix(boardRect: ScreenExtent): cv.Rect[][] {
  const width = boardRect.x1 - boardRect.x0;
  const height = boardRect.y1 - boardRect.y0;
  const cellWidth = width / 6;
  const cellHeight = height / 12;

  const matrix: cv.Rect[][] = [];
  for (let x = 0; x < 6; x++) {
    matrix[x] = [];
    for (let y = 0; y < 12; y++) {
      const rect = {
        x0: boardRect.x0 + cellWidth * x,
        x1: boardRect.x0 + cellWidth * (x + 1),
        y0: boardRect.y0 + cellHeight * y,
        y1: boardRect.y0 + cellHeight * (y + 1),
      };

      matrix[x][y] = new cv.Rect(rect.x0, rect.y0, cellWidth, cellHeight);
    }
  }

  return matrix;
}

/**
 * Get croppings of each cell
 */
function getBoardCells(cellCoordMatrix: cv.Rect[][], screenMat: cv.Mat): cv.Mat[][] {
  const boardCellMatrix: cv.Mat[][] = [];
  for (let x = 0; x < cellCoordMatrix.length; x++) {
    boardCellMatrix[x] = [];
    for (let y = 0; y < cellCoordMatrix[x].length; y++) {
      const rect = cellCoordMatrix[x][y];
      boardCellMatrix[x][y] = screenMat.roi(rect);
    }
  }

  return boardCellMatrix;
}

/**
 * For testing purposes, draw the cell rectangles from the cellCoordMatrix
 * @param {{x: number, y: number, width: number, height: number}[][]} cellCoordMatrix
 * @param {cv.Mat} screenMat
 */
function drawBoardCellOutlines(cellCoordMatrix: cv.Rect[][], screenMat: cv.Mat): void {
  for (let x = 0; x < cellCoordMatrix.length; x++) {
    for (let y = 0; y < cellCoordMatrix[x].length; y++) {
      const rect = cellCoordMatrix[x][y];
      const topLeft = new cv.Point(rect.x, rect.y);
      const bottomRight = new cv.Point(rect.x + rect.width, rect.y + rect.height);
      const color = new cv.Scalar(255, 0, 0, 255);
      cv.rectangle(screenMat, topLeft, bottomRight, color, 1, cv.LINE_AA, 0);
    }
  }
}

/**
 * Get coordinates for the score digit
 */
function getScoreDigitCoords(scoreRect: ScreenExtent): cv.Rect[] {
  const scoreWidth = scoreRect.x1 - scoreRect.x0;
  const scoreHeight = scoreRect.y1 - scoreRect.y0;
  const scoreDigitWidth = scoreWidth / 8;

  const scoreDigitArray = [];
  for (let i = 0; i < 8; i++) {
    scoreDigitArray[i] = new cv.Rect(scoreRect.x0 + scoreDigitWidth * i, scoreRect.y0, scoreDigitWidth, scoreHeight);
  }

  return scoreDigitArray;
}

/** Get croppings of the score digits */
function getScoreDigits(scoreDigitArray: cv.Rect[], screenMat: cv.Mat): cv.Mat[] {
  const scoreDigitMats: cv.Mat[] = [];
  for (let i = 0; i < scoreDigitArray.length; i++) {
    const rect = scoreDigitArray[i];
    scoreDigitMats[i] = screenMat.roi(rect);
  }

  return scoreDigitMats;
}

/**
 * For testing purposes, draw the cell rectangles from the cellCoordMatrix
 * @param {{x: number, y: number, width: number, height: number}[]} scoreDigitArray
 * @param {cv.Mat} screenMat
 */
function drawScoreDigitOutlines(scoreDigitArray: cv.Rect[], screenMat: cv.Mat): void {
  for (let i = 0; i < scoreDigitArray.length; i++) {
    const rect = scoreDigitArray[i];
    const topLeft = new cv.Point(rect.x, rect.y);
    const bottomRight = new cv.Point(rect.x + rect.width, rect.y + rect.height);
    const color = new cv.Scalar(255, 0, 0, 255);
    cv.rectangle(screenMat, topLeft, bottomRight, color, 1, cv.LINE_AA, 0);
  }
}

export default async function opencvTest(): Promise<void> {
  console.log(cv);

  // Load test iamge
  const img = await loadImage(testImage);
  const mat = cv.imread(img);

  // Outline P1 board
  const screenRect = getScreenRect();
  const [screenWidth, screenHeight] = getDimsFromScreenRect(screenRect);
  const boardWidth = screenWidth * 0.2;
  const boardHeight = screenHeight * 0.665;
  const p1BoardOffset = { x: 0.146, y: 0.148 };
  const p1Board = {
    x0: screenRect.x0 + screenWidth * p1BoardOffset.x,
    y0: screenRect.y0 + screenHeight * p1BoardOffset.y,
    x1: screenRect.x0 + screenWidth * p1BoardOffset.x + boardWidth,
    y1: screenRect.y0 + screenHeight * p1BoardOffset.y + boardHeight,
  };
  cv.rectangle(
    mat,
    new cv.Point(p1Board.x0, p1Board.y0),
    new cv.Point(p1Board.x1, p1Board.y1),
    new cv.Scalar(255, 0, 0, 255),
    1,
    cv.LINE_AA,
    0,
  );

  // Compute cell coordinates
  const p1BoardCellCoords = getCellCoordMatrix(p1Board);
  // Get croppings of P1 Board cells
  const boardCells = getBoardCells(p1BoardCellCoords, mat);
  // Draw board cell outlines
  drawBoardCellOutlines(p1BoardCellCoords, mat);

  // Outline P1 Score
  const scoreWidth = screenWidth * 0.169;
  const scoreHeight = screenHeight * 0.056;
  const p1ScoreOffset = { x: 0.183, y: 0.817 };
  const p1Score = {
    x0: screenRect.x0 + screenWidth * p1ScoreOffset.x,
    y0: screenRect.y0 + screenHeight * p1ScoreOffset.y,
    x1: screenRect.x0 + screenWidth * p1ScoreOffset.x + scoreWidth,
    y1: screenRect.y0 + screenHeight * p1ScoreOffset.y + scoreHeight,
  };
  cv.rectangle(
    mat,
    new cv.Point(p1Score.x0, p1Score.y0),
    new cv.Point(p1Score.x1, p1Score.y1),
    new cv.Scalar(0, 0, 255, 255),
    1,
    cv.LINE_AA,
    0,
  );
  // Outline P1 Score digits
  const p1ScoreDigitCoords = getScoreDigitCoords(p1Score);
  const p1ScoreDigits = getScoreDigits(p1ScoreDigitCoords, mat);
  drawScoreDigitOutlines(p1ScoreDigitCoords, mat);

  // Outline P1 Next Window
  const nextWindowWidth = screenWidth * 0.01;
  const nextWindowHeight = screenWidth * 0.01;
  const p1NextWindowOffset = { x: 0.3, y: 0.1 };
  const p1NextWindow = {
    x0: screenRect.x0 + screenWidth * p1NextWindowOffset.x,
    y0: screenRect.y0 + screenHeight * p1NextWindowOffset.y,
    x1: screenRect.x0 + screenWidth * p1NextWindowOffset.x + nextWindowWidth,
    y1: screenRect.y0 + screenHeight * p1NextWindowOffset.y + nextWindowHeight,
  };
  // cv.rectangle(mat, new cv.Point(p1));

  //

  // Show bottom row
  for (let i = 0; i < 6; i++) {
    const div = document.createElement('div');
    div.style.marginLeft = `12px`;
    const cellCanvas = document.createElement('canvas');
    div.appendChild(cellCanvas);
    document.body.appendChild(div);
    cv.imshow(cellCanvas, boardCells[i][11]);
  }

  // Resize image
  const dst = new cv.Mat();
  cv.resize(mat, dst, new cv.Size(1920 * 1, 1080 * 1));

  // Show dst on canvas
  const canvasOutput = document.getElementById('canvas-output') as HTMLCanvasElement;
  cv.imshow(canvasOutput, dst);

  // Give mat to window object to allow in-browser debugging.
  // window.mat = mat;
  // window.cv = cv;
  // Object.assign(window, { cv });
  Object.assign(window, { mat });
}
