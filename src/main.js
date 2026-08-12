import { loadImage, toImageData, cloneImageData, blit } from './image.js';
import { buildPaletteMap, paletteSwap } from './palette.js';
import { buildSettingsUI } from './ui.js';
import { ARMOR_PIECES, KEY_PALETTE_URL, armorTextureUrl, trimTextureUrl, paletteTextureUrl } from './catalog.js';

const SKIN_WIDTH = 64;
const SKIN_HEIGHT = 64;

// test torso region. is identical in armor and skin layout
const TORSO_REGION = {x: 16, y: 16, width: 24, height: 16};

// Texture regions, in skin-texture coordinates. mirror regions are not handled yet.
const REGIONS = {
  head: {
    x: 0, y: 0, width: 32, height: 16
  },
  torso: {
    x: 16, y: 16, width: 24, height: 16
  },
  rightArm: {
    x: 40, y: 16, width: 16, height: 16
  },
  rightLeg: {
    x: 0, y: 16, width: 16, height: 16
  }
  // todo: leftarm and leftleg
}

// which regions are contained by each piece
const PIECE_REGIONS = {
  helmet: ['head'],
  chestplate: ['torso', 'rightArm'],
  leggings: ['torso', 'rightLeg'],
  boots: ['rightLeg']
};

// canvas setup
const outputCanvas = document.getElementById('out');
const outputContext = outputCanvas.getContext('2d', { willReadFrequently: true});
outputContext.imageSmoothingEnabled = false;

let skinImageData = null;
// decoded textures, keyed by url. prevents all pngs from being re-fetched on a settings change
const textureCache = new Map();

// loads a texture from the cache given a url
function loadTexture(url){
  if(!textureCache.has(url)){
    textureCache.set(url, loadImage(url).then(toImageData));
  }
  return textureCache.get(url);
}

// returns imagedata for the piece of armor with the given material, trim, and trim material
async function buildPieceTexture(pieceId, pieceSettings){
  const armorImageData = await loadTexture(
    armorTextureUrl(pieceId, pieceSettings.armorMaterial)
  );

  if(pieceSettings.trimPattern === 'none'){
    // return early without applying a trim
    return armorImageData;
  }

  const [trimImageData, keyPalleteImageData, materialPaletteImageData] = await Promise.all([
    loadTexture(trimTextureUrl(pieceId, pieceSettings.trimPattern)),
    loadTexture(KEY_PALETTE_URL),
    loadTexture(paletteTextureUrl(pieceSettings.trimMaterial, pieceSettings.armorMaterial))
  ]);

  const paletteMap = buildPaletteMap(keyPalleteImageData, materialPaletteImageData);
  const recoloredTrimImageData = paletteSwap(trimImageData, paletteMap);

  const trimmedArmorImageData = cloneImageData(armorImageData);
  blit(trimmedArmorImageData, recoloredTrimImageData);
  return trimmedArmorImageData;
}

// Incremented on every render. Prevents race conditions from quickly flipping two options.
let currentRenderToken = 0;

async function render(settings){
  const renderToken = ++currentRenderToken;

  if(!skinImageData){
    return;
  }

  const outputImageData = cloneImageData(skinImageData);
  
  for(const piece of ARMOR_PIECES){
    const pieceSettings = settings.pieces[piece.id];
    if(!pieceSettings.enabled){
      continue;
    }

    let pieceTexture;
    try {
      pieceTexture = await buildPieceTexture(piece.id, pieceSettings);
    }
    catch (error) {
      // plenty of expected errors, including catalog/asset mismatch, not necessarily fatal
      // can still render the rest of the output
      console.error(`skipping ${piece.id}: `, error.message);
      continue;
    }

    if(renderToken !== currentRenderToken) return;

    for(const regionName of PIECE_REGIONS[piece.id]){
      const region = REGIONS[regionName];
      blit(outputImageData, pieceTexture, {
        sx: region.x,
        sy: region.y,
        sw: region.width,
        sh: region.height,
        dx: region.x,
        dy: region.y
      });
    }
  }

  if(renderToken !== currentRenderToken) return;
  outputContext.putImageData(outputImageData, 0, 0);
}

// wiring

// build the settings ui
const settings = buildSettingsUI(
  document.getElementById('controls'),
  updatedSettings => render(updatedSettings)
);

// skin input listener
document.getElementById('skin-input').addEventListener('change', async (e) => {
  const inputFile = e.target.files[0];
  if (!inputFile) return;

  const skinBitmap = await createImageBitmap(inputFile);
  skinImageData = toImageData(skinBitmap);

  if(skinImageData.width != SKIN_WIDTH || skinImageData.height != SKIN_HEIGHT){
    console.warn(`expected a ${SKIN_WIDTH}x${SKIN_HEIGHT} skin, got a ${skinImageData.width}x${skinImageData.height}.`);
  }
  
  render(settings);
});

// Exports the current canvas as a PNG
document.getElementById('download-button').addEventListener('click', () => {
  outputCanvas.toBlob(blob => {
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = 'armorized-skin.png'; // TODO: include the name of the skin in this
    link.click();
    URL.revokeObjectURL(objectUrl);
  }, 'image/png');
});