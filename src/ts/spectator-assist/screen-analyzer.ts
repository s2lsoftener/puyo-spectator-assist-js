import cv from '@mjyc/opencv.js';

interface Bounds {
  tl: cv.Point;
  tr: cv.Point;
  bl: cv.Point;
  br: cv.Point;
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

export default class ScreenAnalyzer {
  private canvas: HTMLCanvasElement;
  private screen: ScreenFeature;
  private player1: PlayerFeatures;
  private player2: PlayerFeatures;
  private frame: cv.Mat;

  constructor(targetCanvas: HTMLCanvasElement) {
    this.canvas = targetCanvas;
  }

  /**
   * Pass the video frame to analyze
   * @param frame
   */
  public setVideoFrame(frame: cv.Mat): ScreenAnalyzer {
    this.frame = frame;
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
    const fieldHeight = screenHeight * 0.665;

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

  public getFieldCellMasks(p: 1 | 2): ScreenAnalyzer {
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

  public analyzeFieldCell(p: 1 | 2, col: number, row: number): ScreenAnalyzer {
    const player = p === 1 ? this.player1 : this.player2;
    const cellMat = player.cells[col][row].mat;

    const srcVec = new cv.MatVector();
    srcVec.push_back(cellMat);

    // Histogram parameters
    const accumulate = false;
    const channels = [0]; // red
    const histSize = [256];
    const ranges = [0, 255];
    const hist = new cv.Mat();
    const mask = new cv.Mat();
    const color = new cv.Scalar(255, 0, 0, 0);
    const scale = 2;

    cv.calcHist(srcVec, channels, mask, hist, histSize, ranges, accumulate);
    const result = cv.minMaxLoc(hist, mask);
    const max = result.maxVal;
    const dst = new cv.Mat.zeros(cellMat.rows, histSize[0] * scale, cv.CV_8UC3);

    // Draw histogram
    for (let i = 0; i < histSize[0]; i++) {
      const binVal = (hist.data32F[i] * cellMat.rows) / max;
      const point1 = new cv.Point(i * scale, cellMat.rows - 1);
      const point2 = new cv.Point((i + 1) * scale - 1, cellMat.rows - binVal);
      cv.rectangle(dst, point1, point2, color, cv.FILLED);
    }

    cv.imshow('hist-red', dst);

    console.log(hist);
    console.log(mask);
    console.log(dst);

    // Test out norm?
    // const norm = ScreenAnalyzer.norm(hist, hist);
    // console.log(norm);

    return this;
  }

  static normalizedScalarProduct(mat1: cv.Mat, mat2: cv.Mat): number {
    // Compute the dot product of the two 1d vectors
    const dst = new cv.Mat();
    cv.multiply(mat1, mat2, dst);
    cv.reduce(dst, dst, 0, cv.REDUCE_SUM);

    // Divide the dot product by the L2 norms.
    const mat1Norm = cv.norm(mat1, cv.NORM_L2);
    const mat2Norm = cv.norm(mat2, cv.NORM_L2);

    return dst.data32F[0] / (mat1Norm * mat2Norm);
  }
}
