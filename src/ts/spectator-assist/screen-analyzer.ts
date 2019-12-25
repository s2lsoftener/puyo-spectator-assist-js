import cv from '@mjyc/opencv.js';

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
  private cellMask: cv.Mat; // Gets set during getFieldCells

  // Pre-allocate some histograms
  private hist1 = new cv.Mat();
  private hist2 = new cv.Mat();
  private hist3 = new cv.Mat();
  private hist4 = new cv.Mat();

  private SCALAR_RED = new cv.Scalar(255, 0, 0, 0);
  private SCALAR_GREEN = new cv.Scalar(0, 255, 0, 0);
  private SCALAR_BLUE = new cv.Scalar(0, 0, 255, 0);
  private EMPTY_MASK = new cv.Mat();

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
        // // apply ellipse mask
        // cv.bitwise_and(cells[x][y].mat, mask, cells[x][y].mat);
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

    console.log(cellMat);

    // Test. Compare to every other cell.
    const orig = this.calcHist(cellMat);
    for (let c = 0; c < 6; c++) {
      for (let r = 0; r < 12; r++) {
        const compare = this.calcHist(player.cells[c][r].mat);
        const norm = ScreenAnalyzer.normSP(orig, compare);
        console.log(`c${col}r${row} vs c${c}r${r}: `, norm);
      }
    }

    return this;
  }

  private calcHist(mat: cv.Mat): cv.Mat {
    const srcVec = new cv.MatVector();
    srcVec.push_back(mat);

    const accumulate = false;
    const histSize = [256];
    const CHANNEL_RED = [0];
    const CHANNEL_GREEN = [1];
    const CHANNEL_BLUE = [2];
    const ranges = [0, 255];

    // Create an ellipse mask
    const cells = this.player1.cells[0][0];
    const mask = new cv.Mat(cells.mask.height, cells.mask.width, cv.CV_8UC1, new cv.Scalar(0, 0, 0, 0));
    const rect = new cv.RotatedRect(
      new cv.Point(cells.mask.height / 2, cells.mask.width / 2),
      new cv.Size(cells.mask.width, cells.mask.height),
      0,
    );
    cv.ellipse1(mask, rect, new cv.Scalar(255, 0, 0, 0), -1, cv.LINE_8);

    // Calculate Histograms
    cv.calcHist(srcVec, CHANNEL_RED, mask, this.hist1, histSize, ranges, accumulate);
    cv.calcHist(srcVec, CHANNEL_GREEN, mask, this.hist2, histSize, ranges, accumulate);
    cv.calcHist(srcVec, CHANNEL_BLUE, mask, this.hist3, histSize, ranges, accumulate);

    // Combine to one histogram
    const histData = [...this.hist1.data32F, ...this.hist2.data32F, ...this.hist3.data32F];
    const combinedHist = cv.matFromArray(256 * 3, 1, cv.CV_32FC1, histData);
    // console.log('Combined histogram: ', combinedHist);

    // Test out normSP on the histogram
    return combinedHist;
  }

  /** Calculate normalized scalar product */
  static normSP(mat1: cv.Mat, mat2: cv.Mat): number {
    // Compute the dot product of the two 1d vectors
    const dst = new cv.Mat();
    cv.multiply(mat1, mat2, dst);

    cv.reduce(dst, dst, 0, cv.REDUCE_SUM);

    // Divide the dot product by the L2 norms.
    const mat1Norm = cv.norm(mat1, cv.NORM_L2);
    const mat2Norm = cv.norm(mat2, cv.NORM_L2);

    const result = dst.data32F[0] / (mat1Norm * mat2Norm);
    return result;
  }
}
