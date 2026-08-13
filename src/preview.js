// uses skinview3d for a live 3d preview of the modified skin

// the names skinview3d uses
const BODY_PART_NAMES = ['head', 'body', 'rightArm', 'leftArm', 'rightLeg', 'leftLeg'];

let viewer = null;

// creates the viewer on a canvas. skinviewer3d manages its own canvas size, so do not mess with it in html
export function initPreview(canvasElement){
  viewer = new skinview3d.SkinViewer({
    canvas: canvasElement,
    width: 300,
    height: 400
  });

  viewer.zoom = 0.8;
  viewer.autoRotate = true;
  viewer.autoRotateSpeed = 0.5;

  return viewer;
}

export function setOuterLayerVisible(visible){
  if(!viewer){
    return;
  }

  const skin = viewer.playerObject.skin;
  for(const partName of BODY_PART_NAMES){
    skin[partName].outerLayer.visible = visible;
  }
}

export async function updatePreview(outputCanvas, {model, showOuterLayer}){
  if(!viewer){
    return;
  }

  await viewer.loadSkin(outputCanvas, {
    model: model === 'alex' ? 'slim' : 'default'
  });

  setOuterLayerVisible(showOuterLayer);
}

export async function setElytra(textureUrl){
  if(!viewer){
    return;
  }
  if(textureUrl){
    await viewer.loadCape(textureUrl, {backEquipment: 'elytra'});
  }
  else{
    viewer.loadCape(null);
  }
}