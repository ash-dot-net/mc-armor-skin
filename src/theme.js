// this is your standard light / dark switching

const STORAGE_KEY = 'armorizer-theme';

const toggleButton = document.getElementById('theme-toggle');

function applyTheme(theme){
  document.documentElement.dataset.theme = theme;
}

function readStoredTheme(){
  try{
    return localStorage.getItem(STORAGE_KEY);
  }
  catch{
    return null;
  }
}

function storeTheme(theme){
  try{
    localStorage.setItem(STORAGE_KEY, theme);
  }
  catch{
    // just give up
  }
}

const storedTheme = readStoredTheme();
applyTheme(storedTheme ?? 'dark');

toggleButton.addEventListener('click', () => {
  const nextTheme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  applyTheme(nextTheme);
  storeTheme(nextTheme);
});