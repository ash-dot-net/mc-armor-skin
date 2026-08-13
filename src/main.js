import { loadImage, toImageData, cloneImageData, blit } from './image.js';
import { buildPaletteMap, paletteSwap } from './palette.js';
import { buildSettingsUI } from './ui.js';
import { KEY_PALETTE_URL, armorTextureUrl, trimTextureUrl, paletteTextureUrl, ARMOR_PIECES_IN_DRAW_ORDER } from './catalog.js';
import { blitLimb } from './uv.js';
import { initPreview, updatePreview, setElytra } from './preview.js';

const ELYTRA_TEXTURE_URL = 'assets/misc/elytra.png';

const previewOptions = {
  showOuterLayer: false,
  elytra: false
}

initPreview(document.getElementById('preview'));

const SKIN_WIDTH = 64;
const SKIN_HEIGHT = 64;

// where each body part lives
const PART_REGIONS = {
  head: {
    kind: 'box',
    source: {x: 0, y: 0},
    base: {x: 0, y: 0}, 
    overlay: {x: 32, y: 0},
    width: 32, 
    height: 16
  },
  torso: {
    kind: 'box',
    source: {x: 16, y: 16},
    base: {x: 16, y: 16},
    overlay: {x: 16, y: 32},
    width: 24, 
    height: 16
  },
  rightArm: {
    kind: 'arm',
    source: {x: 40, y: 16},
    base: {x: 40, y: 16},
    overlay: {x: 40, y: 32}
  },
  leftArm: {
    kind: 'arm',
    source: {x: 40, y: 16},
    base: {x: 32, y: 48},
    overlay: {x: 48, y: 48},
    mirror: true
  },
  rightLeg: {
    kind: 'leg',
    source: {x: 0, y: 16},
    base: {x: 0, y: 16},
    overlay: {x: 0, y: 32}
  },
  leftLeg: {
    kind: 'leg',
    source: {x: 0, y: 16},
    base: {x: 16, y: 48},
    overlay: {x: 0, y: 48},
    mirror: true
  }
};

// which body parts are used by each piece
const PIECE_PARTS = {
  helmet: ['head'],
  chestplate: ['torso', 'rightArm', 'leftArm'],
  leggings: ['torso', 'rightLeg', 'leftLeg'],
  boots: ['rightLeg', 'leftLeg']
};

// TODO: set to 'overlay' once outer-layer handling is working
const TARGET_LAYER = 'base'

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

// paints one body part of a piece's texture onto the output skin
function paintPart(destination, pieceTexture, partName, settings){
  const part = PART_REGIONS[partName];
  const destinationOrigin = part[TARGET_LAYER];

  if(part.kind === 'box'){
    blit(
      destination,
      pieceTexture, {
        sx: part.source.x,
        sy: part.source.y,
        sw: part.width,
        sh: part.height,
        dx: destinationOrigin.x,
        dy: destinationOrigin.y
      }
    );
  }
  else{
    blitLimb(
      destination,
      pieceTexture, {
        sourceOrigin: part.source,
        destinationOrigin: destinationOrigin,
        mirror: Boolean(part.mirror),
        alex: part.kind === 'arm' && settings.model === 'alex',
        dropColumn: settings.alexDropColumn
      }
    );
  }
}

// Incremented on every render. Prevents race conditions from quickly flipping two options.
let currentRenderToken = 0;

async function render(settings){
  const renderToken = ++currentRenderToken;

  if(!skinImageData){
    return;
  }

  const enabledPieces = ARMOR_PIECES_IN_DRAW_ORDER.filter(
    piece => settings.pieces[piece.id].enabled
  );

  const pieceTextures = await Promise.all(
    enabledPieces.map(piece => 
      buildPieceTexture(piece.id, settings.pieces[piece.id]).catch(error => {
        console.error(`skipping ${piece.id}: `, error.message);
        return null;
      })
    )
  );

  if(renderToken !== currentRenderToken) return;
  const outputImageData = cloneImageData(skinImageData);
  for(let i = 0; i < enabledPieces.length; i++){
    const pieceTexture = pieceTextures[i];
    if(!pieceTexture){
      continue;
    }

    for(const partName of PIECE_PARTS[enabledPieces[i].id]){
      paintPart(outputImageData, pieceTexture, partName, settings);
    }
  }
  
  if(renderToken !== currentRenderToken) return;
  outputContext.putImageData(outputImageData, 0, 0);

  updatePreview(
    outputCanvas, {
      model: settings.model,
      showOuterLayer: previewOptions.showOuterLayer
    }
  )
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

document.getElementById('outer-layer-toggle').addEventListener('change', (e) => {
  previewOptions.showOuterLayer = e.target.checked;
  render(settings);
});

document.getElementById('elytra-toggle').addEventListener('change', (e) => {
  previewOptions.elytra = e.target.checked;
  setElytra(previewOptions.elytra ? ELYTRA_TEXTURE_URL : null);
});