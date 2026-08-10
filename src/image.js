// This does basic image loading and rectangular copy operations

// loads an Image from a url
export function loadImage(url){
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`failed to load ${url}`));
    image.src = url;

  });
}

// converts an Image, ImageBitmap, or canvas into ImageData
export function toImageData(sourceImage){
  const c = document.createElement('canvas');
  c.width = sourceImage.width;
  c.height = sourceImage.height;
  const ctx = c.getContext('2d', {willReadFrequently: true});
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(sourceImage, 0, 0);
  return ctx.getImageData(0, 0, c.width, c.height);
}

// deep copy
export function cloneImageData(sourceImageData){
  const out = new ImageData(sourceImageData.width, sourceImageData.height);
  out.data.set(sourceImageData.data);
  return out;
}

// read one pixel of data out of an image as [r, g, b, a]
export function getPixel(image, x, y){
  const i = (y * image.width + x) * 4;
  return [image.data[i], image.data[i + 1], image.data[i + 2], image.data[i + 3]];
}

// copy a part of one image into another
export function blit(destination, source, {
  sx = 0, sy = 0, sw = source.width, sh = source.height,
  dx = 0, dy = 0, flipX = false
}){
  for(let y = 0; y < sh; y++){
    for(let x = 0; x < sw; x++){
      const sourceX = flipX ? sx + sw - x : sx + x;
      const sourceIndex = ((sy + y) * source.width + sourceX) * 4;
      if(source.data[sourceIndex + 3] === 0){
        continue;
      }
      const destinationIndex = ((dy + y) * destination.width + (dx + x)) * 4;
      destination.data[destinationIndex] = source.data[sourceIndex];
      destination.data[destinationIndex + 1] = source.data[sourceIndex + 1];
      destination.data[destinationIndex + 2] = source.data[sourceIndex + 2];
      destination.data[destinationIndex + 3] = source.data[sourceIndex + 3];
    }
  }
}