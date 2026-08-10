// this offers palette loading and swapping on ImageData

import { getPixel, cloneImageData } from './image.js';

// packs an rgb value into a single integer for use as a map key
const rgbKey = (r, g, b) => (r << 16) | (g << 8) | b;

// builds a map from the key palette to the material palette for a palette swap. assumes equal width
export function buildPaletteMap(keyPalette, materialPalette) {
  const paletteMap = new Map();
  for(let x = 0; x < keyPalette.width; x++){
    const [kr, kg, kb, ka] = getPixel(keyPalette, x, 0);
    if(ka === 0) continue;
    const [tr, tg, tb] = getPixel(materialPalette, x, 0);
    paletteMap.set(rgbKey(kr, kg, kb), [tr, tg, tb]);
  }
  return paletteMap
}

// returns a recolored image using the palette map. the lookup is exact-match
export function paletteSwap(sourceImageData, paletteMap){
  const outImageData = cloneImageData(sourceImageData);
  let misses = 0; // for warnings / debugging
  for(let i = 0; i < outImageData.data.length; i += 4){
    if(outImageData.data[i + 3] === 0){
      continue;
    }
    const hit = paletteMap.get(rgbKey(outImageData.data[i], outImageData.data[i + 1], outImageData.data[i + 2]));
    if(!hit){
      misses++;
      continue;
    }
    [outImageData.data[i], outImageData.data[i + 1], outImageData.data[i + 2]] = hit;
  }
  if(misses){
    console.warn(`palette swap: ${misses} unmatched pixels`);
  }
  return outImageData;
}