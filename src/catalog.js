// this holds a hardcoded catalog of everything selectable in ui, with a couple
// of rules for turning selections into asset paths

// this will need to be updated if minecraft adds or updates trims

// where asset directories are
const ARMOR_DIR = 'assets/armor';
const LEG_ARMOR_DIR = 'assets/leg_armor';
const TRIM_DIR = 'assets/trims';
const LEG_TRIM_DIR = 'assets/leg_trims';
const PALETTE_DIR = 'assets/palettes';

// the many options available

// armor slots
export const ARMOR_PIECES = [
  {id: 'helmet', label: 'Helmet', layer: 'main'},
  {id: 'chestplate', label: 'Chestplate', layer: 'main'},
  {id: 'leggings', label: 'Leggings', layer: 'legs'},
  {id: 'boots', label: 'Boots', layer: 'main'}
];

// armor materials, including restrictions to only being available in specific slots
export const ARMOR_MATERIALS = [
  {id: 'leather', label: 'Leather'},
  {id: 'chainmail', label: 'Chainmail'},
  {id: 'iron', label: 'Iron'},
  {id: 'gold', label: 'Gold'},
  {id: 'diamond', label: 'Diamond'},
  {id: 'netherite', label: 'Netherite'},
  {id: 'turtle_scute', label: 'Turtle Shell', pieces: ['helmet']}
];

// trim patterns
export const TRIM_PATTERNS = [
  {id: 'none', label: 'No trim'},
  {id: 'bolt', label: 'Bolt'},
  {id: 'coast', label: 'Coast'},
  {id: 'dune', label: 'Dune'},
  {id: 'eye', label: 'Eye'},
  {id: 'flow', label: 'Flow'},
  {id: 'host', label: 'Host'},
  {id: 'raiser', label: 'Raiser'},
  {id: 'rib', label: 'Rib'},
  {id: 'sentry', label: 'Sentry'},
  {id: 'shaper', label: 'Shaper'},
  {id: 'silence', label: 'Silence'},
  {id: 'snout', label: 'Snout'},
  {id: 'spire', label: 'Spire'},
  {id: 'tide', label: 'Tide'},
  {id: 'vex', label: 'Vex'},
  {id: 'ward', label: 'Ward'},
  {id: 'wayfinder', label: 'Wayfinder'},
  {id: 'wild', label: 'Wild'},
];

// trim materials
export const TRIM_MATERIALS = [
  {id: 'amethyst', label: 'Amythyst'},
  {id: 'copper', label: 'Copper'},
  {id: 'diamond', label: 'Diamond'},
  {id: 'emerald', label: 'Emerald'},
  {id: 'gold', label: 'Gold'},
  {id: 'iron', label: 'Iron'},
  {id: 'lapis', label: 'Lapis'},
  {id: 'netherite', label: 'Netherite'},
  {id: 'quartz', label: 'Quartz'},
  {id: 'redstone', label: 'Redstone'},
  {id: 'resin', label: 'Resin'},
];

// returns all valid materials for a given armor slot
export function materialsForPiece(pieceId){
  return ARMOR_MATERIALS.filter(
    material => !material.pieces || material.pieces.includes(pieceID)
  );
}

// asset urls

// the path for the key palette. i hope that was obvious
export const KEY_PALETTE_URL = `${PALETTE_DIR}/trim_palette.png`

// returns the armor texture path for a specified piece and material
export function armorTextureUrl(pieceId, materialId){
  const piece = ARMOR_PIECES.find(candidate => candidate.id === pieceId);
  const directory = piece.layer === 'legs' ? LEG_ARMOR_DIR : ARMOR_DIR;
  return `${directory}/${materialId}.png`;
}

// returns the trim texture path for a specified piece and trim
export function trimTextureUrl(pieceId, patternId){
  const piece = ARMOR_PIECES.find(candidate => candidate.id === pieceId);
  const directory = piece.layer === 'legs' ? LEG_ARMOR_DIR : ARMOR_DIR;
  return `${directory}/${patternId}.png`;
}

// returns the trim palette texture path for a specified base material and trim material
export function paletteTextureUrl(materialId, trimMaterialId){
  const darker = materialId === trimMaterialId;
  const suffix = darker ? '_darker' : '';
  return `palettes/${trimMaterialId}${suffix}.png`;
}
