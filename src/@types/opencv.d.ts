/* eslint-disable @typescript-eslint/no-unused-vars */
declare module '@mjyc/opencv.js' {
  namespace cv {
    const FILLED = -1;
    const LINE_4 = 4;
    const LINE_8 = 8;
    const LINE_AA = 16;
    const NORM_L2 = 4;
    const REDUCE_SUM = 0;

    // Array Types
    const CV_8U = 0;
    const CV_8UC1 = 0;
    const CV_8UC2 = 8;
    const CV_8UC3 = 16;
    const CV_8UC4 = 24;
    const CV_32FC1 = 5;
    const CV_32FC2 = 13;
    const CV_32FC3 = 21;
    const CV_32FC4 = 29;

    class Rect {
      /**
       * Creates a cv.Rect with x, y, width, and height properties
       * @param x - top-left x of object
       * @param y - top-left y of object
       * @param width - width of object
       * @param height - height of object
       */
      constructor(x: number, y: number, width: number, height: number);
      x: number;
      y: number;
      width: number;
      height: number;
    }

    class Mat {
      static zeros: {
        new (rows: number, cols: number, cvType: number): cv.Mat;
      };

      constructor(rows?: number, cols?: number, cvType?: number, scalar?: Scalar);

      rows: number;
      cols: number;
      matSize: [number, number];
      step: [number, number];
      data: Uint8Array;
      data8S: Int8Array;
      data16U: Uint16Array;
      data16S: Int16Array;
      data32S: Int32Array;
      data32F: Float32Array;
      data64F: Float64Array;

      roi(rect: Rect): Mat;
      size(): { width: number; height: number };
      type(): number;
    }

    class Point {
      /** Creates a point object used by OpenCV. */
      constructor(x: number, y: number);
      x: number;
      y: number;
    }

    class RotatedRect {
      static boundingRect(rotatedRect: RotatedRect): [number, number, number, number];
      constructor(center: Point, size: Size, angleDegrees: number);
      center: Point;
      size: Size;
      angle: number;
    }

    class Scalar extends Array {
      /** Template class for a 4-element vector */
      constructor(v0: number, v1: number, v2: number, v3: number);
    }

    class Size {
      constructor(width: number, height: number);
      width: number;
      height: number;
    }

    class MatVector {
      // eslint-disable-next-line @typescript-eslint/camelcase
      push_back(mat: Mat): void;
    }

    // eslint-disable-next-line @typescript-eslint/camelcase
    function bitwise_and(src1: Mat, src2: Mat, dst: Mat): void;

    function calcHist(
      srcVec: MatVector,
      channels: number[],
      mask: Mat,
      hist: Mat,
      histSize: number[],
      ranges: number[],
      accumulate: boolean,
    ): void;

    function ellipse1(dst: Mat, rotatedRect: RotatedRect, color: Scalar, thickness: number, lineType: 4 | 8 | 16): void;

    function matFromArray(rows: number, cols: number, matrixType: number, data: number[] | Float32Array): Mat;

    function minMaxLoc(
      hist: Mat,
      mask: Mat,
    ): {
      minVal: number;
      maxVal: number;
      minLoc: { x: number; y: number };
      maxLoc: { x: number; y: number };
    };

    function multiply(mat1: Mat, mat2: Mat, dst: Mat): void;

    /** Calculates the L2 norm of a mat */
    function norm(mat: Mat, normType: 4): number;

    function rectangle(
      mat: Mat,
      topLeft: Point,
      bottomRight: Point,
      color: Scalar,
      thickness: number,
      lineType?: 4 | 8 | 16,
      shift?: number,
    ): void;

    function reduce(src: Mat, dst: Mat, rowOrCol: 0 | 1, reducer: number): void;

    function subtract(mat1: Mat, mat2: Mat, dst: Mat, mask: Mat, dtype: number): void;

    /**
     * Read image from a canvas or image element and return a cv.Mat
     * @param image reference to an image element, canvas element, or a string with the canvas ID.
     */
    function imread(image: string | HTMLCanvasElement | HTMLImageElement): cv.Mat;

    /** Show image cv.Mat on canvas element. Pass a reference to the canvas element or a string with the canvas ID. */
    function imshow(canvas: HTMLCanvasElement | string, mat: Mat): void;

    /**
     * Resize a Mat and insert the resized matrix into a different Mat
     * @param mat Source mat
     * @param dst Output mat. It can be an empty one, new cv.Mat();
     * @param dsize cv.Size object containing width and height
     */
    function resize(mat: Mat, dst: Mat, dsize: Size): void;
  }

  export default cv;
}
