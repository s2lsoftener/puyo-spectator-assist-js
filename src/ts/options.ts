import SkinAnalyzer from './spectator-assist/skin-analyzer';
import testImage from '../img/puyo_aqua.png';
import { loadImage } from './spectator-assist/helper';

const input: HTMLInputElement = document.querySelector('input#skin-upload');
const preview: HTMLDivElement = document.querySelector('.preview');
input.style.opacity = `0`;

const fileTypes = ['image/png'];
function validFileType(file: File): boolean {
  for (let i = 0; i < fileTypes.length; i++) {
    if (file.type === fileTypes[i]) {
      return true;
    }
  }

  return false;
}

function returnFileSize(num: number): string {
  if (num < 1024) {
    return num + 'bytes';
  } else if (num >= 1024 && num < 1048576) {
    return (num / 1024).toFixed(1) + 'KB';
  } else if (num >= 1048576) {
    return (num / 1048576).toFixed(1) + 'MB';
  }
}

function analyzePuyoSkin(images: HTMLImageElement[]): void {
  console.log(images);
  const skinAnalyzer = new SkinAnalyzer();
  console.log(SkinAnalyzer);
  const image = images[0];
  skinAnalyzer.setImage(image);
  skinAnalyzer.setROIs(false);
  skinAnalyzer.calcAllHists();
  skinAnalyzer.verifyHistograms();
  skinAnalyzer.showImage('canvas-output');
}

function updateImageDisplay(): void {
  console.log('Running updateImageDisplay()');
  while (preview.firstChild) {
    preview.removeChild(preview.firstChild);
  }

  const curFiles = input.files;
  if (curFiles.length === 0) {
    const para = document.createElement('p');
    para.textContent = 'No files selected for upload.';
    preview.appendChild(para);
  } else {
    const list = document.createElement('ol');
    preview.appendChild(list);
    const images: HTMLImageElement[] = [];
    for (let i = 0; i < curFiles.length; i++) {
      const listItem = document.createElement('li');
      const para = document.createElement('p');
      if (validFileType(curFiles[i])) {
        para.textContent = 'File name ' + curFiles[i].name + ', file size ' + returnFileSize(curFiles[i].size) + '.';
        const image = document.createElement('img');
        image.src = window.URL.createObjectURL(curFiles[i]);
        images.push(image);
        listItem.appendChild(image);
        listItem.appendChild(para);

        // Run the Skin Analyzer when the last image loads
        if (i === curFiles.length - 1) {
          image.onload = (): void => {
            analyzePuyoSkin(images);
          };
        }
      } else {
        para.textContent = `File name ${curFiles[i].name}: Not a valid file type. Update your selection.`;
        listItem.appendChild(para);
      }

      list.appendChild(listItem);
    }
  }
}

async function autoTestRun(): Promise<void> {
  const img = await loadImage(testImage);
  analyzePuyoSkin([img]);
}

input.addEventListener('change', updateImageDisplay);
autoTestRun();
