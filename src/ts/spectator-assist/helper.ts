function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise(resolve => {
    const img = document.createElement('img');
    img.src = src;
    img.onload = (): void => {
      resolve(img);
    };
  });
}

export { loadImage };
