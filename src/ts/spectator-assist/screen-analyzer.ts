import cv from '../../js/opencv.js';
import defaultProfiles from './puyo-profiles.json';
import { PuyoData, PuyoHists } from './skin-analyzer';
import ChainsimCore, { MatrixFunctions } from 's2-puyosim-core';

interface SkinData {
  [key: string]: PuyoData;
}

interface SkinProfiles {
  [key: string]: PuyoHists;
}

interface ScreenFeature {
  mask: cv.Rect;
  mat?: cv.Mat;
}

interface PlayerFeatures {
  field: ScreenFeature;
  cells?: ScreenFeature[][];
  scoreArea?: ScreenFeature;
  scoreDigits?: ScreenFeature[];
}

function indexOfMax(arr: number[]): number {
  if (arr.length === 0) {
    return -1;
  }

  let max = arr[0];
  let maxIndex = 0;

  for (let i = 1; i < arr.length; i++) {
    if (arr[i] > max) {
      maxIndex = i;
      max = arr[i];
    }
  }

  return maxIndex;
}

function indexOfMin(arr: number[]): number {
  if (arr.length === 0) {
    return -1;
  }

  let min = arr[0];
  let maxIndex = 0;

  for (let i = 1; i < arr.length; i++) {
    if (arr[i] < min) {
      maxIndex = i;
      min = arr[i];
    }
  }

  return maxIndex;
}

export default class ScreenAnalyzer {
  private canvas: HTMLCanvasElement;
  private screen: ScreenFeature;
  private player1: PlayerFeatures;
  private player2: PlayerFeatures;
  private frame: cv.Mat;

  private DEFAULT_PROFILES: SkinProfiles;
  private currentProfile = 'puyo_aqua';

  private predictionThreshold = 0.15;

  constructor(targetCanvas: HTMLCanvasElement) {
    this.frame = new cv.Mat();
    this.canvas = targetCanvas;

    const profileData = defaultProfiles as SkinData;

    // Convert profile data to cv.Mats
    const profileNames = Object.keys(profileData);
    this.DEFAULT_PROFILES = {};
    const colors = ['red', 'green', 'blue', 'yellow', 'purple', 'garbage'];
    profileNames.forEach(name => {
      this.DEFAULT_PROFILES[name] = { red: null, green: null, blue: null, yellow: null, purple: null, garbage: null };
      colors.forEach(color => {
        this.DEFAULT_PROFILES[name][color] = cv.matFromArray(1800, 1, cv.CV_32FC1, profileData[name][color]);
      });
    });
  }

  /**
   * Pass the video frame to analyze
   * @param frame
   */
  public setVideoFrame(frame: cv.Mat): ScreenAnalyzer {
    this.frame = null;
    this.frame = frame;
    cv.cvtColor(this.frame, this.frame, cv.COLOR_RGBA2RGB);
    cv.cvtColor(this.frame, this.frame, cv.COLOR_RGB2HSV);
    return this;
  }

  /**
   * Detect the game screen in the frame and set data for the mask.
   * I should probably use something more rotatable instead of cv.Rect
   */
  public getGameScreenMask(): ScreenAnalyzer {
    // Some code to find the game screen.
    // Don't expect the input to be true 16:9 because people record
    // Puyo videos in different ways.

    const bounds = {
      tl: new cv.Point(0, 0),
      tr: new cv.Point(1920, 0),
      bl: new cv.Point(0, 1080),
      br: new cv.Point(1920, 1080),
    };

    this.screen = {
      mask: new cv.Rect(bounds.tl.x, bounds.tl.y, bounds.br.x - bounds.tl.x, bounds.br.y - bounds.tl.y),
    };

    return this;
  }

  /** Get game screen from mask */
  public getGameScreenImage(): ScreenAnalyzer {
    this.screen.mat = this.frame.roi(this.screen.mask);
    return this;
  }

  /** Get player field */
  public getField(player: 1 | 2): ScreenAnalyzer {
    const { width: screenWidth, height: screenHeight } = this.screen.mat.size();
    const fieldWidth = screenWidth * 0.2;
    const fieldHeight = screenHeight * 0.667;

    const offset = { x: 0, y: 0 };
    if (player === 1) {
      offset.x = 0.146;
      offset.y = 0.148;
    }

    const rect = new cv.Rect(screenWidth * offset.x, screenHeight * offset.y, fieldWidth, fieldHeight);

    this.player1 = {
      field: {
        mask: rect,
        mat: this.screen.mat.roi(rect),
      },
    };

    return this;
  }

  public getFieldCellRects(p: 1 | 2): ScreenAnalyzer {
    const player = p === 1 ? this.player1 : this.player2;
    const { width: fieldWidth, height: fieldHeight } = player.field.mat.size();
    const cellWidth = fieldWidth / 6;
    const cellHeight = fieldHeight / 12;

    const cells: ScreenFeature[][] = [];
    for (let x = 0; x < 6; x++) {
      cells[x] = [];
      for (let y = 0; y < 12; y++) {
        cells[x][y] = {
          mask: new cv.Rect(cellWidth * x, cellHeight * y, cellWidth, cellHeight),
        };
      }
    }

    player.cells = cells;

    return this;
  }

  public getFieldCells(p: 1 | 2): ScreenAnalyzer {
    const fieldMat = p === 1 ? this.player1.field.mat : this.player2.field.mat;
    const cells = p === 1 ? this.player1.cells : this.player2.cells;

    for (let x = 0; x < 6; x++) {
      for (let y = 0; y < 12; y++) {
        cells[x][y].mat = fieldMat.roi(cells[x][y].mask);
      }
    }

    return this;
  }

  public getScoreAreaFeatures(p: 1 | 2): ScreenAnalyzer {
    const { width: screenWidth, height: screenHeight } = this.screen.mat.size();
    const scoreWidth = screenWidth * 0.169;
    const scoreHeight = screenHeight * 0.056;
    const player = p === 1 ? this.player1 : this.player2;
    const offset = p === 1 ? { x: 0.183, y: 0.817 } : { x: 0, y: 0 };

    const mask = new cv.Rect(screenWidth * offset.x, screenHeight * offset.y, scoreWidth, scoreHeight);
    const mat = this.screen.mat.roi(mask);
    player.scoreArea = { mask, mat };

    return this;
  }

  public getScoreDigitFeatures(p: 1 | 2): ScreenAnalyzer {
    const player = p === 1 ? this.player1 : this.player2;
    const { width: scoreWidth, height: scoreHeight } = player.scoreArea.mat.size();
    const digitWidth = scoreWidth / 8;

    const digitArray: ScreenFeature[] = [];
    for (let i = 0; i < 8; i++) {
      const mask = new cv.Rect(i * digitWidth, 0, digitWidth, scoreHeight);
      const mat = player.scoreArea.mat.roi(mask);
      digitArray[i] = { mask, mat };
    }

    player.scoreDigits = digitArray;

    return this;
  }

  public drawROIs(p: 1 | 2): ScreenAnalyzer {
    const screenMat = this.screen.mat;
    const player = p === 1 ? this.player1 : this.player2;
    const field = player.field;
    const scoreArea = player.scoreArea;

    const offsetField = { x: field.mask.x, y: field.mask.y };
    const offsetScore = { x: scoreArea.mask.x, y: scoreArea.mask.y };

    // Draw rectangles around each board cell
    const color = new cv.Scalar(255, 0, 0, 255);
    const cells = player.cells;
    cells.forEach((cellRow): void => {
      cellRow.forEach(cell => {
        cv.rectangle(
          screenMat,
          new cv.Point(offsetField.x + cell.mask.x, offsetField.y + cell.mask.y),
          new cv.Point(offsetField.x + cell.mask.x + cell.mask.width, offsetField.y + cell.mask.y + cell.mask.height),
          color,
          1,
          cv.LINE_AA,
          0,
        );
      });
    });

    // Draw rectangles around each score digit
    const scoreDigits = player.scoreDigits;
    scoreDigits.forEach((digit): void => {
      cv.rectangle(
        screenMat,
        new cv.Point(offsetScore.x + digit.mask.x, offsetScore.y + digit.mask.y),
        new cv.Point(offsetScore.x + digit.mask.x + digit.mask.width, offsetScore.y + digit.mask.y + digit.mask.height),
        color,
        1,
        cv.LINE_AA,
        0,
      );
    });

    // Display updated mat
    cv.imshow(this.canvas, screenMat);

    return this;
  }

  private calcHist(mat: cv.Mat, mask: cv.Mat): cv.Mat {
    const srcVec = new cv.MatVector();
    srcVec.push_back(mat);

    const hist = new cv.Mat();
    cv.calcHist(srcVec, [0, 1, 2], mask, hist, [18, 10, 10], [0, 180, 0, 256, 0, 256], false);

    const fixedHist = cv.matFromArray(hist.data32F.length, 1, hist.type(), hist.data32F);

    // Clean up
    srcVec.delete();
    hist.delete();
    return fixedHist;
  }

  public analyzeFieldCells(p: 1 | 2): ScreenAnalyzer {
    const player = p === 1 ? this.player1 : this.player2;
    const cells = player.cells;

    // Create an ellipse mask
    const puyoWidth = cells[0][0].mask.width;
    const puyoHeight = cells[0][0].mask.height;
    const mask = new cv.Mat(puyoHeight, puyoWidth, cv.CV_8UC1, new cv.Scalar(0, 0, 0, 0));
    const rotatedRect = new cv.RotatedRect(
      new cv.Point(puyoWidth / 2, puyoHeight / 2),
      new cv.Size(puyoWidth, puyoHeight * 0.8),
      0,
    );
    cv.ellipse1(mask, rotatedRect, new cv.Scalar(255, 255, 255, 0), -1, cv.LINE_8);

    // Set colors
    const colors = ['red', 'green', 'blue', 'yellow', 'purple', 'garbage'];
    const colorCodes = ['R', 'G', 'B', 'Y', 'P', 'J'];
    const puyoMatrix = MatrixFunctions.createUniformArray('0', 6, 13);
    console.log(puyoMatrix);

    const allSimilarities: number[] = [];

    for (let x = 0; x < cells.length; x++) {
      for (let y = 0; y < cells[x].length; y++) {
        const cell = cells[x][y].mat;
        const hist = this.calcHist(cell, mask);

        const similarities: number[] = [];
        let prediction = '';
        let score = 0;
        colors.forEach(color => {
          const colorHist = this.DEFAULT_PROFILES[this.currentProfile][color];
          const similarity = 1 - cv.compareHist(hist, colorHist, cv.HISTCMP_HELLINGER);
          similarities.push(similarity);
          allSimilarities.push(similarity);

          // const div = document.createElement('div');
          // div.style.display = 'flex';
          // div.style.flexDirection = 'row';
          // const canvas = document.createElement('canvas');
          // div.appendChild(canvas);
          // const para = document.createElement('p');
          // para.textContent = `Cell: ${x},${y}; TestColor: ${color}, Score: ${similarity}`;
          // div.appendChild(para);
          // document.body.appendChild(div);
          // cv.cvtColor(cell, cell, cv.COLOR_HSV2RGB);
          // cv.imshow(canvas, cell);
        });
        hist.delete();

        // If all the similarities are below the threshold, then it's not a Puyo
        const belowThreshold = similarities.every(similarity => similarity <= this.predictionThreshold);
        const index = indexOfMax(similarities);
        if (belowThreshold) {
          prediction = 'None';
          const sum = similarities.reduce((a, b) => a + b, 0);
          const avg = sum / similarities.length || 0;
          score = avg;
          puyoMatrix[x][y + 1] = '0';
        } else {
          prediction = colors[index];
          score = similarities[index];
          puyoMatrix[x][y + 1] = colorCodes[index];
        }

        const div = document.createElement('div');
        div.style.display = 'flex';
        div.style.flexDirection = 'row';
        const canvas = document.createElement('canvas');
        div.appendChild(canvas);
        const para = document.createElement('p');
        para.textContent = `Cell: ${x},${y}; Prediction: ${prediction}; Score: ${score}`;
        div.appendChild(para);
        document.body.appendChild(div);
        const cellRGB = new cv.Mat();
        cv.cvtColor(cell, cellRGB, cv.COLOR_HSV2RGB);
        cv.imshow(canvas, cellRGB);
        cellRGB.delete();
      }
    }

    // Clean up
    mask.delete();

    console.log('Min value', allSimilarities[indexOfMin(allSimilarities)]);
    console.log('Max value', allSimilarities[indexOfMax(allSimilarities)]);
    console.log(puyoMatrix);

    console.log(this);
    return this;
  }

  /** Delete old mats from Emscripten heap to prepare for next frame */
  public cleanUpFrameData(): ScreenAnalyzer {
    // Old frame
    this.frame.delete();

    // Screen
    this.screen.mat.delete();

    // Player board data
    this.player1.cells.forEach(col => {
      col.forEach(feature => {
        feature.mat.delete();
      });
    });
    this.player1.field.mat.delete();
    this.player1.scoreArea.mat.delete();
    this.player1.scoreDigits.forEach(feature => feature.mat.delete());

    console.log(this);
    return this;
  }

  // /** Calculate normalized scalar product */
  // static normSP(mat1: cv.Mat, mat2: cv.Mat): number {
  //   // Compute the dot product of the two 1d vectors
  //   const dst = new cv.Mat();
  //   cv.multiply(mat1, mat2, dst);

  //   cv.reduce(dst, dst, 0, cv.REDUCE_SUM);

  //   // Divide the dot product by the L2 norms.
  //   const mat1Norm = cv.norm(mat1, cv.NORM_L2);
  //   const mat2Norm = cv.norm(mat2, cv.NORM_L2);

  //   const result = dst.data32F[0] / (mat1Norm * mat2Norm);
  //   return result;
  // }
}
