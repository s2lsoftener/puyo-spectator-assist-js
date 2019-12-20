/* eslint-disable @typescript-eslint/no-unused-vars */
declare module '@mjyc/opencv.js' {
  namespace cv {
    const LINE_AA = 16;

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
      roi(rect: Rect): Mat;
    }

    class Point {
      /** Creates a point object used by OpenCV. */
      constructor(x: number, y: number);
      x: number;
      y: number;
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

    function rectangle(
      mat: Mat,
      topLeft: Point,
      bottomRight: Point,
      color: Scalar,
      thickness: number,
      lineType: 4 | 8 | 16,
      shift: number,
    ): void;

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
