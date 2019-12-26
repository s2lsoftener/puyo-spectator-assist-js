import SkinAnalyzer from './spectator-assist/skin-analyzer';
import { PuyoData } from './spectator-assist/skin-analyzer';
import { loadImage } from './spectator-assist/helper';
import ScreenAnalyzer from './spectator-assist/screen-analyzer';

interface AllColorData {
  [key: string]: PuyoData;
}

const input: HTMLInputElement = document.querySelector('input#skin-upload');
const preview: HTMLDivElement = document.querySelector('.preview');

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

function analyzePuyoSkin(images: HTMLImageElement[], fileList: FileList): void {
  const textarea: HTMLTextAreaElement = document.querySelector('textarea#color-json');

  const data: AllColorData = {};

  for (let i = 0; i < images.length; i++) {
    const image = images[i];
    const fileName = fileList[i].name.substr(0, fileList[i].name.length - 4);
    let skinAnalyzer = new SkinAnalyzer();
    const jsonData = skinAnalyzer
      .setImage(image)
      .setROIs(false)
      .calcAllHists()
      .verifyHistograms()
      .outputHistJSON();
    skinAnalyzer.showImage('canvas-output');
    data[fileName] = JSON.parse(JSON.stringify(jsonData)) as PuyoData;
    console.log(`${fileName}`, data[fileName]);
    skinAnalyzer.delete();
    skinAnalyzer = null;
  }

  // console.log(data);
  textarea.value = JSON.stringify(data);
  // images.forEach((image): void => {
  //   image.style.width = `20%`;
  //   image.style.height = `auto`;
  // });
}

async function updateImageDisplay(): Promise<void> {
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
        const image = await loadImage(window.URL.createObjectURL(curFiles[i]));
        console.log('Loaded image~', image);
        images.push(image);
        listItem.appendChild(image);
        listItem.appendChild(para);

        // Run the Skin Analyzer when the last image loads
        if (i === curFiles.length - 1) {
          console.log('Last image loaded');
          analyzePuyoSkin(images, curFiles);
        }
      } else {
        para.textContent = `File name ${curFiles[i].name}: Not a valid file type. Update your selection.`;
        listItem.appendChild(para);
      }

      list.appendChild(listItem);
    }
  }
}

input.addEventListener('change', updateImageDisplay);
