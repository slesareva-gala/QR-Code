import { constQR } from "../lib/iso";

/*
 * Формирование изображения QR-кода.
 * Ошибку функция сообщает исключением с кодом подошибки "image" (см. lang.json).
 */

/* Таблица рисующих функций по форматам изображения */
export const RENDERERS = Object.freeze({
  NONE: () => '',
  PNG: renderRaster,
  WEBP: renderRaster,
  SVG: renderSVG,
  HTML: renderHTML
});

/*
 * Растровое изображение (PNG и WEBP) на элементе canvas.
 * Формат влияет только на кодирование при выгрузке, поэтому построение
 * полотна общее.
 */
function renderRaster({ matrix, modsize, margin }) {
  if (typeof document === 'undefined') throw '2';

  const matrixSize = matrix.length;
  const canvasSize = modsize * (matrixSize + 2 * margin);

  if (canvasSize > constQR.MAX_CANVAS_SIDE ||
    canvasSize * canvasSize > constQR.MAX_CANVAS_AREA) throw '4';

  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = canvasSize;

  // alpha: false - полотно непрозрачно: браузер не смешивает слои при рисовании
  const context = canvas.getContext('2d', { alpha: false });
  if (!context) throw '3';

  context.fillStyle = '#fff';
  context.fillRect(0, 0, canvasSize, canvasSize);

  context.fillStyle = '#000';
  const offset = margin * modsize;
  for (let y = 0; y < matrixSize; ++y) {
    for (let x = 0; x < matrixSize; ++x) {
      if (matrix[y][x]) {
        context.fillRect(offset + x * modsize, offset + y * margin,
          modsize, modsize);
      }
    }
  }
  return canvas;
}

/*
 * Разбор матрицы на горизонтальные отрезки подряд идущих тёмных модулей.
 * Возвращает массив [y, x, длина].
 */
const darkRuns = (matrix) => {
  const runs = [];

  for (let y = 0; y < matrix.length; ++y) {
    const row = matrix[y], width = row.length;
    for (let x = 0; x < width;) {
      if (!row[x]) { ++x; continue; }
      const start = x;
      while (x < width && row[x]) ++x;
      runs.push([y, start, x - start]);
    }
  }
  return runs;
};

/*
 * Векторное изображение SVG.
 *
 * Система координат задана в модулях, а пиксельный размер - атрибутами
 * width/height, поэтому разметка не зависит от modsize и её можно
 * масштабировать без потери качества. Все тёмные модули собраны в один
 */
function renderSVG({ matrix, margin }) {
  if (typeof document === 'undefined') throw '2';

  const viewSize = matrix.length + 2 * margin;
  const result = document.createElementNS('http://www.w3.org/2000/svg', 'svg');

  const path = darkRuns(matrix).map(([y, x, length]) =>
    `M${x + margin} ${y + margin}h${length}v1h-${length}z`).join('');

  result.setAttribute('viewBox', `0 0 ${viewSize} ${viewSize}`);
  result.setAttribute('style', 'shape-rendering:crispEdges');
  result.innerHTML = `<rect width="${viewSize}" height="${viewSize}" fill="#fff"/>` +
    `<path fill="#000" d="${path}"/>`;

  return result;
}

/*
 * Разметка HTML
 */
function renderHTML({ matrix, margin }) {
  if (typeof document === 'undefined') throw '2';

  const matrixSize = matrix.length;
  const viewSize = matrixSize + 2 * margin;

  const result = document.createElement('div');
  result.className = 'qrcode-html';
  result.style.cssText = `display: grid; width: 100%; height: 100%; background: #fff;`
    + `grid-template-columns: repeat(${viewSize}, 1fr);`
    + `grid-template-rows: repeat(${viewSize}, 1fr);`;

  const html = [];
  const boxMargin = `<div style="grid-column: span ${viewSize}; grid-row: span ${margin};"></div>`
  const rowMargin = `<div style="grid-column: span ${margin};"></div>`

  if (margin) html.push(boxMargin);
  for (let y = 0; y < matrixSize; ++y) {
    if (margin) html.push(rowMargin);
    for (let x = 0; x < matrixSize; ++x) {
      html.push(matrix[y][x] ? `<div style="background:#000;"></div>` : `<div></div>`);
    }
    if (margin) html.push(rowMargin);
  }
  if (margin) html.push(boxMargin);
  result.innerHTML = html.join('');

  return result;
}
