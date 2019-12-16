import cv from "@mjyc/opencv.js";
import testImage from "../img/lagnus.png";

function loadTestIamge() {
  return new Promise((resolve, reject) => {
    const img = document.createElement("img");
    img.src = testImage;
    img.onload = () => {
      resolve(img);
    }
  })
}

export default async function opencvTest() {
  console.log(cv);

  // Load test iamge
  const img = await loadTestIamge();
  const mat = cv.imread(img);
  
  // Give mat to window object to allow in-browser debugging.
  window.mat = mat;
}