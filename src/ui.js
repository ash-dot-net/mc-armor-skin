// this builds the settings controls from the catalog and holds the settings state.

import all, { ARMOR_PIECES, materialsForPiece, TRIM_MATERIALS, TRIM_PATTERNS } from './catalog.js';

// the shape of settings:
// {
//   model: 'classic' | 'slim',
//   slimDropColumn: 0 | 1 | 2 | 3,
//   pieces: {
//     helmet: {
//       enabled, armorMaterial, trimPattern, trimMaterial
//     }
//     etc...
//   }
// }
const settings = {
  model: 'classic',
  slimDropColumn: 0, // TODO: experiment to find the best default
  pieces: {}
};

// populate the defaults for piece settings
for(const piece of ARMOR_PIECES){
  settings.pieces[piece.id] = {
    enabled: true,
    armorMaterial: 'netherite',
    trimPattern: 'none',
    trimMaterial: 'gold'
  };
}

// handler that fires on each settings change. is defined later by whoever builds the UI
let notifyChange = () => {};

// DOM helpers

// creates a dom element in a streamlined way
function createElement(tagName, className, textContent){
  const element = document.createElement(tagName);
  if(className){
    element.className = className;
  }
  if(textContent){
    element.textContent = textContent;
  }
  return element;
}

// builds a labeled select from a list of {id, label} entries wired to an event handler
function createLabeledSelect(labelText, entries, selectedId, onSelect){
  const wrapper = createElement('label', 'control', labelText);

  const select = createElement('select');
  for(const entry of entries){
    const option = createElement('option', null, entry.label);
    option.value = entry.id;
    if(entry.id === selectedId){
      option.selected = true;
    }
    select.append(option);
  }

  select.addEventListener('change', () => {
    onSelect(select.value);
    notifyChange(settings);
  });

  wrapper.append(select);
  return wrapper;
}

// Setting control groups

// builds a set of fields for the given armor piece. 
// includes enabled toggle and three dropdowns for material, trim, and trim material
function buildPieceControls(piece){
  const pieceSettings = settings.pieces[piece.id];

  const fieldset = createElement('fieldset', 'piece');
  const legend = createElement('legend');

  const enableCheckbox = createElement('input');
  enableCheckbox.type = 'checkbox';
  enableCheckbox.checked = pieceSettings.enabled;

  legend.append(enableCheckbox, document.createTextNode(` ${piece.label}`));
  fieldset.append(legend);

  const controlsContainer = createElement('div', 'piece-controls');

  controlsContainer.append(
    createLabeledSelect(
      'Armor',
      materialsForPiece(piece.id),
      pieceSettings.armorMaterial,
      value => { 
        pieceSettings.armorMaterial = value;
      }
    ),
    createLabeledSelect(
      'Trim',
      TRIM_PATTERNS,
      pieceSettings.trimPattern,
      value => {
        pieceSettings.trimPattern = value; 
      }
    ),
    createLabeledSelect(
      'Trim color',
      TRIM_MATERIALS,
      pieceSettings.trimMaterial,
      value => {
        pieceSettings.trimMaterial = value;
      }
    )
  );
  
  const applyEnabledState = () => {
    controlsContainer.querySelectorAll('select').forEach(select => {
      select.disabled = !pieceSettings.enabled;
    });
    fieldset.classList.toggle('piece-disabled', !pieceSettings.enabled);
  };

  enableCheckbox.addEventListener('change', () => {
    pieceSettings.enabled = enableCheckbox.checked;
    applyEnabledState();
    notifyChange(settings);
  });

  fieldset.append(controlsContainer);
  applyEnabledState();
  return fieldset;
}

// model type and slim column-drop selector
function buildModelControls(){
  const fieldset = createElement('fieldset', 'model');
  fieldset.append(createElement('legend', null, 'Player model'));

  const modelOptions = [
    {id: 'steve', label: 'Classic / Steve'},
    {id: 'alex', label: 'Slim / Alex'}
  ];

  const columnOptions = [0, 1, 2, 3].map(index => ({
    id: String(index),
    label: `Column ${index}`
  }));

  const columnControl = createLabeledSelect(
    'Slim / Alex: drop column',
    columnOptions,
    String(settings.slimDropColumn),
    value => {
      settings.slimDropColumn = Number(value);
    }
  );

  const modelControl = createLabeledSelect(
    'Model',
    modelOptions,
    settings.model,
    value => {
      settings.model = value;
      columnControl.querySelector('select').disabled = value !== 'alex';
    }
  );

  columnControl.querySelector('select').disabled = settings.model !== 'alex';

  fieldset.append(modelControl, columnControl);
  return fieldset;
}

// entry point

// builds all of the controls into the container and fires the handler on any settings change
export function buildSettingsUI(containerElement, onChange){
  notifyChange = onChange;

  containerElement.append(buildModelControls());
  for(const piece of ARMOR_PIECES){
    containerElement.append(buildPieceControls(piece));
  }
}

export function getSettings(){
  return settings;
}