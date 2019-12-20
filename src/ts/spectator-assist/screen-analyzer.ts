import cv from '@mjyc/opencv.js';
import '../typings/opencv'

class ScreenAnalyzer {
  /**
   * Sets up the screen analyzer
   * @param {cv.Mat} screenMat 
   */
  constructor(screenMat) {
    /** @name ScreenAnalyzer#screen @type {ScreenFeature} */
    this.screen = {};

    /** @name ScreenAnalyzer#player1 @type {ScreenFeature} */
    this.player1 = {};

    /** @name ScreenAnalyzer#player2 @type {ScreenFeature} */
    this.player2 = {};
  }

  setScreenDimensions() {
    const rect = {
      x: 0,
      y: 0,
      width: 1920,
      height: 1080
    }

    this.screen.rect = cv.Rect(rect.x, rect.y, rect.width, rect.height);
    return this
  }

  setBoardDimensions(player) {
    const boardWidth = screenWidth * 0.2;
    const boardHeight = screenHeight * 0.665;
    const screenRect = this.screen.rect;

    const offset = {
      x: player === 1 ? 0.146 : 0,
      y: player === 1 ? 0.148 : 0,
    }

    const board = cv.Rect(
      screenRect.
    )
  }
}