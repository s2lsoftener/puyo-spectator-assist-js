import cv from '../js/opencv.js';
cv.onRuntimeInitialized = (): void => {
  console.log('OpenCV Loaded!');
  console.log('cv object', cv);
  window.cvLoaded = true;
  console.log(window.cvLoaded);
};

import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';

declare global {
  interface Window {
    cvLoaded: boolean;
  }
}

function Hello(): JSX.Element {
  const [cvLoaded, setCvLoaded] = useState(false);

  useEffect(() => {
    // const checkCVLoaded = () => {
    //   if (window.cvLoaded === true) {
    //     console.log('OpenCV Loaded!');
    //     setCvLoaded(true);
    //   } else {
    //     console.log('OpenCV Not loaded');
    //     requestAnimationFrame(checkCVLoaded);
    //   }
    // };
    // checkCVLoaded();
  }, []);

  return (
    <div>
      <p>Hello!</p>
      <p>Hmm...? {cvLoaded}</p>
    </div>
  );
}

ReactDOM.render(<Hello />, document.getElementById('react-component'));
