import { loadImage, toImageData, cloneImageData, blit } from './image.js';
import { buildPaletteMap, paletteSwap } from './palette.js';

const SKIN_WIDTH = 64;
const SKIN_HEIGHT = 64;

// test torso region. is identical in armor and skin layout
const TORSO_REGION = {x: 16, y: 16, width: 24, height: 16};

// hardcoded assets for testing. will be dropdowns later
const ARMOR_TEXTURE_URL = 'assets/armor/netherite.png';
const TRIM_TEXTURE_URL = 'assets/trims/sentry.png';
const KEY_PALETTE_URL = 'assets/palettes/trim_palette.png';
const MATERIAL_PALETTE_URL = 'assets/palettes/redstone.png';

// canvas setup
const outputCanvas = document.getElementById('out');
const outputContext = outputCanvas.getContext('2d', { willReadFrequently: true});
outputContext.imageSmoothingEnabled = false;

let skinImageData = null;
let trimmedArmorImageData = null;

// loads armor and trim images, and puts the recolored trim onto the armor
async function buildTrimmedArmor(){
  const [armorImageData, trimImageData, keyPaletteImageData, materialPaletteImageData] = await Promise.all([
    loadImage(ARMOR_TEXTURE_URL),
    loadImage(TRIM_TEXTURE_URL),
    loadImage(KEY_PALETTE_URL),
    loadImage(MATERIAL_PALETTE_URL)
  ].map(p => p.then(toImageData)));

  const paletteMap = buildPaletteMap(keyPaletteImageData, materialPaletteImageData);
  const recoloredTrimImageData = paletteSwap(trimImageData, paletteMap);

  const combinedImageData = cloneImageData(armorImageData);
  blit(combinedImageData, recoloredTrimImageData);

  return combinedImageData;
}

function render(){
  if(!skinImageData || !trimmedArmorImageData){
    return;
  }

  const outputImageData = cloneImageData(skinImageData);
  
  // currently, only torso is done for testing
  blit(outputPixels, trimmedArmorImageData, {
    sx: TORSO_REGION.x,
    sy: TORSO_REGION.y,
    sw: TORSO_REGION.width,
    sh: TORSO_REGION.height,
    dx: TORSO_REGION.x,
    dy: TORSO_REGION.y
  });

  outputContext.putImageData(outputImageData, 0, 0);
}

// skin input listener
document.getElementById('skin-input').addEventListener('change', async (e) => {
  const inputFile = e.target.files[0];
  if (!inputFile) return;

  const skinBitmap = await createImageBitmap(inputFile);
  skinImageData = toImageData(skinBitmap);

  if(skinImageData.width != SKIN_WIDTH || skinImageData.height != SKIN_HEIGHT){
    console.warn(`expected a ${SKIN_WIDTH}x${SKIN_HEIGHT} skin, got a ${skinImageData.width}x${skinImageData.height}. Your skin is weird, and you are weird.`);
  }

  render();
});

// kickoff stuff, not yet a loop
trimmedArmorImageData = await buildTrimmedArmor();
render();