// this holds limb face layouts, as well as how to copy a limb from the armor texture onto the skin

import { blit } from './image.js';

export const STEVE_LIMB_FACES = {
  top: {x: 4, y: 0, width: 4, height: 4},
  bottom: {x: 8, y: 0, width: 4, height: 4},
  right: {x: 0, y: 4, width: 4, height: 12},
  front: {x: 4, y: 4, width: 4, height: 12},
  left: {x: 8, y: 4, width: 4, height: 12},
  back: {x: 12, y: 4, width: 4, height: 12}
};

export const ALEX_LIMB_FACES = {
  top: {x: 4, y: 0, width: 3, height: 4},
  bottom: {x: 7, y: 0, width: 3, height: 4},
  right: {x: 0, y: 4, width: 4, height: 12},
  front: {x: 4, y: 4, width: 3, height: 12},
  left: {x: 7, y: 4, width: 4, height: 12},
  back: {x: 11, y: 4, width: 3, height: 12}
};

// when creating a mirrored limb, says which face to use for each face
const MIRRORED_SOURCE_FACE = {
  top: 'top',
  bottom: 'bottom',
  front: 'front',
  back: 'back',
  left: 'right',
  right: 'left'
};

// gives the source columns to read, in order of how they should be used by the destination.
// also drops the drop column here
function sourceColumnOrder(sourceWidth, dropColumn, mirror){
  const columns = [];
  for(let column = 0; column < sourceWidth; column++){
    if(column === dropColumn){
      continue;
    }
    columns.push(column);
  }
  if(mirror){
    columns.reverse();
  }
  return columns;
}

// copies one face, one column at a time
function blitFace(destination, source, sourceOrigin, destinationOrigin, sourceFace, destinationFace, dropColumn, mirror){
  const sourceX = sourceOrigin.x + sourceFace.x;
  const sourceY = sourceOrigin.y + sourceFace.y;
  const destinationX = destinationOrigin.x + destinationFace.x;
  const destinationY = destinationOrigin.y + destinationFace.y;

  const droppedColumn = sourceFace.width === destinationFace.width ? -1 : dropColumn;
  const columns = sourceColumnOrder(sourceFace.width, droppedColumn, mirror);

  for(let offset = 0; offset < columns.length; offset++){
    blit(destination, source, {
      sx: sourceX + columns[offset],
      sy: sourceY,
      sw: 1,
      sh: sourceFace.height,
      dx: destinationX + offset,
      dy: destinationY
    });
  }
}

// gives which column each face drops given a selected drop column setting
function dropColumnsByFace(dropColumn){
  return{
    top: dropColumn,
    bottom: dropColumn,
    front: dropColumn,
    back: 3 - dropColumn,
    right: -1,
    left: -1
  };
}

// copies a limb from the armor texture onto a skin, face by face
export function blitLimb(destination, source, {
  sourceOrigin,
  destinationOrigin,
  mirror = false,
  alex = false,
  dropColumn = 0
}){
  const destinationFaces = alex ? ALEX_LIMB_FACES : STEVE_LIMB_FACES;
  const drops = dropColumnsByFace(dropColumn);

  for(const faceName of Object.keys(STEVE_LIMB_FACES)){
    const sourceFaceName = mirror ? MIRRORED_SOURCE_FACE[faceName] : faceName;

    blitFace(
      destination,
      source,
      sourceOrigin,
      destinationOrigin,
      STEVE_LIMB_FACES[sourceFaceName],
      destinationFaces[faceName],
      drops[sourceFaceName], 
      mirror
    )
  }
}