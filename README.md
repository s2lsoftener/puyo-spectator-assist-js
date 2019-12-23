# PuyoSpectatorAssist.js
A browser extension for analyzing Puyo Puyo gameplay footage in realtime.

## Setting up Development Environment
```bash
# Install packages
yarn install

# Run dev server
yarn dev

# Build production build
yarn build
```

To load the extension from the development environment, go to `chrome://extensions/` > "Load unpacked", then select the `build` folder.

## Notes
* OpenCV.js has to be defined as an external module in `webpack.config.js` because the modules will take forever to bundle, or node will just run out of memory during the build process. `<script src="opencv.js" type="text/javascript"></script>` needs to be manually added to each HTML file that OpenCV.js will be used in.
* Contour MatVectors are made from Mats containing x,y positions of contour points. Get a flattened array of the x and y points (I don't know which order yet) and use `cv.matFromArray(numPoints, 1, cv.CV_32SC2, array)`