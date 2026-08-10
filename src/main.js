const canvas = document.getElementById('out');
const ctx = canvas.getContext('2d', { willReadFrequently: true});
ctx.imageSmoothingEnabled = false;

document.getElementById('skin-input').addEventListener('change', async (e) => {
  const inputFile = e.target.files[0];
  if (!inputFile) return;
  const bitmap = await createImageBitmap(inputFile);
  ctx.clearRect(0, 0, 64, 64);
  ctx.drawImage(bitmap, 0, 0);
  const px = ctx.getImageData(0, 0, 64, 64);
  console.log('loaded: ', bitmap.width, ' x ', bitmap.height, 'pixels, ', px.data.length, ' bytes');
});