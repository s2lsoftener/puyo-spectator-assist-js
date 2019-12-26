import cv from '../../js/opencv.js';

interface PuyoROIs {
  [key: string]: cv.Mat[];
  red: cv.Mat[];
  green: cv.Mat[];
  blue: cv.Mat[];
  yellow: cv.Mat[];
  purple: cv.Mat[];
  garbage: cv.Mat[];
}

export interface PuyoHists {
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

export interface PuyoData {
  [key: string]: number[];
  red: number[];
  green: number[];
  blue: number[];
  yellow: number[];
  purple: number[];
  garbage: number[];
}

export default class SkinAnalyzer {
  private puyoSkin: cv.Mat;
  private rois: PuyoROIs;
  private puyoHists: PuyoHists;
  private puyoAllHists: PuyoAllHists;
  private colorDataJSON: PuyoData;

  constructor() {
    this.puyoSkin = null;
    this.rois = { red: [], green: [], blue: [], yellow: [], purple: [], garbage: [] };
    this.puyoHists = { red: null, green: null, blue: null, yellow: null, purple: null, garbage: null };
    this.puyoAllHists = { red: [], green: [], blue: [], yellow: [], purple: [], garbage: [] };
  }

  public setImage(img: HTMLImageElement): SkinAnalyzer {
    this.puyoSkin = cv.imread(img);

    // Reduce to 3 channels RGB
    cv.cvtColor(this.puyoSkin, this.puyoSkin, cv.COLOR_RGBA2RGB);

    cv.cvtColor(this.puyoSkin, this.puyoSkin, cv.COLOR_RGB2HSV);

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
    const histSize = [18, 10, 10];
    const ranges = [0, 180, 0, 256, 0, 256];

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

    const hist = new cv.Mat();

    cv.calcHist(srcVec, [0, 1, 2], mask, hist, histSize, ranges, accumulate);

    const fixedHist = cv.matFromArray(hist.data32F.length, 1, cv.CV_32FC1, hist.data32F);

    // Cleanup. Delete hists
    hist.delete();
    srcVec.delete();
    mask.delete();

    return fixedHist;
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
      means.length = histograms[0].data32F.length;
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

      const avgHist = cv.matFromArray(histograms[0].data32F.length, 1, histograms[0].type(), means);
      this.puyoHists[color] = avgHist;
    });
    return this;
  }

  public outputHistJSON(): PuyoData {
    const colorData: PuyoData = {
      red: [...this.puyoHists.red.data32F],
      green: [...this.puyoHists.green.data32F],
      blue: [...this.puyoHists.blue.data32F],
      yellow: [...this.puyoHists.yellow.data32F],
      purple: [...this.puyoHists.purple.data32F],
      garbage: [...this.puyoHists.garbage.data32F],
    };

    this.colorDataJSON = colorData;

    return this.colorDataJSON;
  }

  public verifyHistograms(): SkinAnalyzer {
    const colors = ['red', 'green', 'blue', 'yellow', 'purple', 'garbage'];

    colors.forEach((color): void => {
      const base = this.puyoHists[color];
      console.log(base);

      for (let c = 0; c < colors.length; c++) {
        this.puyoAllHists[colors[c]].forEach((puyoHist, i): void => {
          const correl = cv.compareHist(base, puyoHist, cv.HISTCMP_CORREL);
          const chisqr = 1 - cv.compareHist(base, puyoHist, cv.HISTCMP_CHISQR) / 100000;
          const inters = cv.compareHist(base, puyoHist, cv.HISTCMP_INTERSECT) / 7000;
          const hellin = 1 - cv.compareHist(base, puyoHist, cv.HISTCMP_HELLINGER);
          const chisqr2 = 1 - cv.compareHist(base, puyoHist, cv.HISTCMP_CHISQR_ALT) / 15000;
          const kldiv = 1 - cv.compareHist(base, puyoHist, cv.HISTCMP_KL_DIV) / 90000;

          console.log(`Base: ${color}, Compare color: ${colors[c]}, Compare Index: ${i}\n
                       corr: ${correl}, chisqr: ${chisqr}, inters: ${inters},\n
                       hell: ${hellin}, chisqr_alt: ${chisqr2}, kldiv: ${kldiv}`);
        });
      }
    });

    console.log(this);
    return this;
  }

  public delete(): void {
    // Delete the skin analyzer and any associated mats
    Object.keys(this.puyoAllHists).forEach(key => {
      this.puyoAllHists[key].forEach(mat => mat.delete());
    });

    Object.keys(this.puyoHists).forEach(key => {
      this.puyoHists[key].delete();
    });

    Object.keys(this.rois).forEach(key => {
      this.rois[key].forEach(mat => mat.delete());
    });

    this.puyoSkin.delete();
  }

  public showImage(canvasId: string): SkinAnalyzer {
    cv.imshow(canvasId, this.puyoSkin);
    return this;
  }
}
