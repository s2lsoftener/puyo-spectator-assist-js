import cv from '@mjyc/opencv.js';

interface PuyoROIs {
  [key: string]: cv.Mat[];
  red: cv.Mat[];
  green: cv.Mat[];
  blue: cv.Mat[];
  yellow: cv.Mat[];
  purple: cv.Mat[];
  garbage: cv.Mat[];
}

interface PuyoHists {
  [key: string]: cv.Mat;
  red: cv.Mat;
  green: cv.Mat;
  blue: cv.Mat;
  yellow: cv.Mat;
  purple: cv.Mat;
  garbage: cv.Mat;
}

interface PuyoAllHists {
  [key: string]: cv.Mat[];
  red: cv.Mat[];
  green: cv.Mat[];
  blue: cv.Mat[];
  yellow: cv.Mat[];
  purple: cv.Mat[];
  garbage: cv.Mat[];
}

export default class SkinAnalyzer {
  private puyoSkin: cv.Mat;
  private rois: PuyoROIs;
  private puyoHists: PuyoHists;
  private puyoAllHists: PuyoAllHists;

  constructor() {
    this.puyoSkin = new cv.Mat();
    this.rois = { red: [], green: [], blue: [], yellow: [], purple: [], garbage: [] };
    this.puyoHists = { red: null, green: null, blue: null, yellow: null, purple: null, garbage: null };
    this.puyoAllHists = { red: [], green: [], blue: [], yellow: [], purple: [], garbage: [] };
  }

  public setImage(img: HTMLImageElement): SkinAnalyzer {
    this.puyoSkin = cv.imread(img);

    // Reduce to 3 channels RGB
    cv.cvtColor(this.puyoSkin, this.puyoSkin, cv.COLOR_RGBA2RGB);

    return this;
  }

  public setROIs(draw = false): SkinAnalyzer {
    // Set ROIs for colored Puyos
    const puyoWidth = 64;
    const puyoHeight = 60;

    const colors = ['red', 'green', 'blue', 'yellow', 'purple'];
    colors.forEach((color, c) => {
      const startY = 72 * c;
      for (let i = 0; i < 16; i++) {
        const startX = 72 * i;

        const rect = new cv.Rect(startX, startY, puyoWidth, puyoHeight);
        const rotatedRect = new cv.RotatedRect(
          new cv.Point(startX + puyoWidth / 2, startY + puyoHeight / 2),
          new cv.Size(puyoWidth, puyoHeight * 0.8),
          0,
        );
        const roi = this.puyoSkin.roi(rect);

        if (draw) {
          cv.ellipse1(this.puyoSkin, rotatedRect, new cv.Scalar(0, 0, 0, 0), 1, cv.LINE_8);
        }
        this.rois[color].push(roi);
      }
    });

    for (let i = 0; i < 1; i++) {
      const startX = 72 * 18 + 72 * i;
      const startY = 72;

      const rect = new cv.Rect(startX, startY, puyoWidth, puyoHeight);
      const rotatedRect = new cv.RotatedRect(
        new cv.Point(startX + puyoWidth / 2, startY + puyoHeight / 2),
        new cv.Size(puyoWidth, puyoHeight * 0.8),
        0,
      );
      const roi = this.puyoSkin.roi(rect);

      if (draw) {
        cv.ellipse1(this.puyoSkin, rotatedRect, new cv.Scalar(255, 0, 0, 255), 1, cv.LINE_8);
      }
      this.rois.garbage.push(roi);
    }

    return this;
  }

  static calcHist(mat: cv.Mat): cv.Mat {
    const srcVec = new cv.MatVector();
    srcVec.push_back(mat);

    const accumulate = false;
    const histSize = [256];
    const CHANNEL_RED = [0];
    const CHANNEL_GREEN = [1];
    const CHANNEL_BLUE = [2];
    const ranges = [0, 255];

    // Create an ellipse mask
    const puyoWidth = 64;
    const puyoHeight = 60;
    const mask = new cv.Mat(puyoHeight, puyoWidth, cv.CV_8UC1, new cv.Scalar(0, 0, 0, 0));
    const rotatedRect = new cv.RotatedRect(
      new cv.Point(puyoWidth / 2, puyoHeight / 2),
      new cv.Size(puyoWidth, puyoHeight * 0.8),
      0,
    );
    cv.ellipse1(mask, rotatedRect, new cv.Scalar(255, 255, 255, 0), -1, cv.LINE_8);

    const hist1 = new cv.Mat();
    const hist2 = new cv.Mat();
    const hist3 = new cv.Mat();

    // Calculate Histograms
    cv.calcHist(srcVec, CHANNEL_RED, mask, hist1, histSize, ranges, accumulate);
    cv.calcHist(srcVec, CHANNEL_GREEN, mask, hist2, histSize, ranges, accumulate);
    cv.calcHist(srcVec, CHANNEL_BLUE, mask, hist3, histSize, ranges, accumulate);

    // Combine to one histogram
    const histData = [...hist1.data32F, ...hist2.data32F, ...hist3.data32F];
    const combinedHist = cv.matFromArray(256 * 3, 1, cv.CV_32FC1, histData);

    // Test out normSP on the histogram
    return combinedHist;
  }

  public calcAllHists(): SkinAnalyzer {
    const colors = ['red', 'green', 'blue', 'yellow', 'purple', 'garbage'];

    colors.forEach((color): void => {
      const histograms: cv.Mat[] = [];
      this.rois[color].forEach((mat: cv.Mat): void => {
        const hist = SkinAnalyzer.calcHist(mat);
        histograms.push(hist);
      });
      this.puyoAllHists[color] = histograms;

      // Compute average histogram
      const means: number[] = [];
      means.length = histograms[0].rows * histograms[0].cols;
      for (let i = 0; i < means.length; i++) {
        means[i] = 0;
      }

      histograms.forEach(hist => {
        const data = hist.data32F;
        for (let i = 0; i < means.length; i++) {
          means[i] += data[i];
        }
      });

      for (let i = 0; i < means.length; i++) {
        means[i] = means[i] / histograms.length;
      }

      const avgHist = cv.matFromArray(histograms[0].rows, histograms[0].cols, histograms[0].type(), means);

      this.puyoHists[color] = avgHist;
    });

    console.log(this.puyoHists);
    console.log(this.puyoAllHists);
    return this;
  }

  public verifyHistograms(): SkinAnalyzer {
    const colors = ['red', 'green', 'blue', 'yellow', 'purple', 'garbage'];

    colors.forEach((color): void => {
      const base = this.puyoHists[color];

      for (let c = 0; c < colors.length; c++) {
        this.puyoAllHists[colors[c]].forEach((puyoHist, i): void => {
          const result = cv.compareHist(base, puyoHist, cv.HISTCMP_CORREL);

          console.log(`Base: ${color}, Compare color: ${colors[c]}, Compare Index: ${i}, Result: ${result}`);
        });
      }
    });

    return this;
  }

  public showImage(canvasId: string): SkinAnalyzer {
    cv.imshow(canvasId, this.puyoSkin);
    return this;
  }
}
