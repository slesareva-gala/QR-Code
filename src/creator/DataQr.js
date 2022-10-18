/* Данные QR-кода */
"use strict";

import { constQR, infoVersion } from "../lib/iso";

class QRCODE {
  constructor(image, options, errorDescription) {

    for (const param in options) {
      Object.defineProperty(this, param, { enumerable: true, value: options[param] });
    }
    for (const param in errorDescription) {
      Object.defineProperty(this, param, { writable: true, value: errorDescription[param] });
    }

    // формат изображения QR-кода
    Object.defineProperty(this, `_image`, { writable: true, value: '' });
    // HTML элемент изображения QR-кода в заданом формате или '' в случае ошибки
    Object.defineProperty(this, `result`, { writable: true, value: '' });

    // формирование изображения QR-кода
    this.image = image;
  }

  /*
   * формирование изображения QR-кода
   */
  set image(v) {
    // формирование изображения QR-кода
    const makeImage = () => {

      ({
        // без формирования изображения
        NONE: () => {
          this.result = '';
        },
        // формирование изображения QR-кода в формате PNG
        PNG: () => {
          const matrix = this.matrix, matrixSize = this.matrix.length,
            modsize = this.modsize, margin = this.margin;
          const canvasSize = modsize * (matrixSize + 2 * margin),
            canvas = document.createElement('canvas');
          let context;

          canvas.width = canvas.height = canvasSize;
          context = canvas.getContext('2d');
          if (!context) {
            this.error = 'image';
            this.errorSubcode = '2';
            return;
          }

          context.fillStyle = '#fff';
          context.fillRect(0, 0, canvasSize, canvasSize);
          context.fillStyle = '#000';
          for (let y = 0; y < matrixSize; ++y) {
            for (let x = 0; x < matrixSize; ++x) {
              if (matrix[y][x]) {
                context.fillRect(modsize * (margin + x),
                  modsize * (margin + y),
                  modsize, modsize);
              }
            }
          }

          this.result = canvas;
        }, // END PNG()

        // формирование изображения QR-кода в формате SVG
        SVG: () => {
          const result = document.createElementNS('http://www.w3.org/2000/svg', 'svg');

          const matrix = this.matrix, matrixSize = this.matrix.length,
            modsize = this.modsize, margin = this.margin;
          const svgSize = modsize * (matrixSize + 2 * margin),
            svg = [
              '<style scoped>.bg{fill:#FFF}.fg{fill:#000}</style>',
              '<rect class="bg" x="0" y="0"',
              'width="' + svgSize + '" height="' + svgSize + '"/>',
            ],
            svgCommon = ' class= "fg"' + ' width="' + modsize + '" height="' + modsize + '"/>';

          result.setAttribute('viewBox', '0 0 ' + svgSize + ' ' + svgSize);
          result.setAttribute('style', 'shape-rendering:crispEdges');

          let yo = margin * modsize;
          for (let y = 0; y < matrixSize; ++y) {
            let xo = margin * modsize;
            for (let x = 0; x < matrixSize; ++x) {
              if (matrix[y][x])
                svg.push('<rect x="' + xo + '" y="' + yo + '"', svgCommon);
              xo += modsize;
            }
            yo += modsize;
          }
          result.innerHTML = svg.join('');

          this.result = result;
        }, // END SVG()

        // формирование изображения QR-кода в формате HTML
        HTML: () => {
          const result = document.createElement('div');
          const matrix = this.matrix, matrixSize = this.matrix.length,
            modsize = this.modsize, margin = this.margin;
          const html = ['<table border="0" cellspacing="0" cellpadding="0" style="display:block; border:' +
            modsize * margin + 'px solid #fff;background:#fff">'];

          for (let y = 0; y < matrixSize; ++y) {
            html.push('<tr>');
            for (let x = 0; x < matrixSize; ++x) {
              html.push('<td style="width:' + modsize + 'px; height:' + modsize + 'px' +
                (matrix[y][x] ? ';background:#000' : '') + '"></td>');
            }
            html.push('</tr>');
          }
          result.className = 'qrcode';
          result.innerHTML = html.join('') + '</table>';

          this.result = result;
        }, // END HTML()

      }[this.image])();

    }; // END makeImage()

    v = v.trim().toUpperCase();
    this._image = v;
    this.result = '';

    if (this.error === 'image') this.clearError();
    if (!(constQR.IMAGE.includes(v))) {
      this.error = 'image';
      this.errorSubcode = '3';
    }

    if (!this.error) makeImage();

  } // END set image()
  get image() { return this._image; }

  /*
   * скачать файл QR-кода
   */
  download(filename = '', image = this.image) {
    let content = '', mimeType = '';

    const perform = (content, mimeType, filename) => {
      const el = document.createElement('a');
      if (mimeType) mimeType += ',';

      el.setAttribute('href', `${mimeType}${content}`);
      el.setAttribute('download', filename);
      el.click();
    };

    this.image = image;

    if (this.result) {
      switch (this.image) {
        case 'PNG':
          if (!filename) filename = 'qrcode.png';
          content = this.result.toDataURL();
          break;
        case 'SVG':
          if (!filename) filename = 'qrcode.svg';
          content = `<svg xmlns="http://www.w3.org/2000/svg" ` +
            `viewBox="${this.result.getAttribute('viewBox')} ">` +
            `${this.result.innerHTML}</svg>`;
          content = encodeURIComponent(content);
          mimeType = `data:image/svg+xml;charset=utf-8`;
          break;
        case 'HTML':
          if (!filename) filename = 'qrcode.html';
          content = encodeURIComponent(this.result.innerHTML);
          mimeType = `data:text/html;charset=utf-8`;
          break;
      }
      perform(content, mimeType, filename);
    }
  } // END download()

  /*
   * очистка сообщения об ошибке
   */
  clearError() {
    this.error = '';
    this.errorSubcode = '';
  } // END clearError()

}  // END class QRCODE


export class DataQR {
  constructor(text = '', options = {}) {
    let { mode, eccl, version, mask, image, modsize, margin } = {
      ...{
        mode: -1, eccl: -1, version: -1, mask: -1,
        image: 'PNG', modsize: -1, margin: -1
      },
      ...options
    };

    // текст для кодирования в QR-коде
    this.text = text;
    // параметры формирования:
    this.mode = mode;
    this.eccl = eccl;
    this._version = version;
    this.mask = mask;
    // параметры результата:
    this.image = image.trim().toUpperCase();
    this.modsize = modsize;
    this.margin = margin;

    // результаты:
    // - имя параметра, вызвавшего ошибку или '' при отстутствии ошибок
    this.error = '';
    // - сообщение об ошибке или '' при отстутствии ошибок
    this.errorSubcode = '';

    /*
     * свойста фиксируемые устновкой версии для текущих  mode, eccl:
     */
    // количество бит данных без кодовых слов исправления ошибок,
    // но включая биты метода и поля для записи количества данных
    this.bitsData = 0;
    // количество блоков кода для version по eccl
    this.qtyBlocks = 0;
    // количество байтов коррекции на один блок кода для version по eccl
    this.bytesCorrectionPerBlock = 0;
    // генерирующий многочлен (показатели степеней порождающего полинома)
    this.genpoly = [];
    // размер в битах поля для записи количества данных в qr-кода
    this.bitsFieldDataQty = 0;
    // позиции шаблонов выравнивания
    this.positionAlignmentPatterns = [];

    /*
     * результаты этапов фиормирования кодовых слов
     */
    // массив фактически кодируемых символов (из text)
    this.data = [];
    // кодовые слова данных (без битов ЕСС)
    this.codewordsData = [];
    // кодовые слова для размещения в QR-коде (c битами ЕСС и с объединением блоков в поток)
    this.codewordsQR = [];

    // заполненная матрица QR-кода (без обязательной свободной зоны)
    this.matrix = [];

  } // END constructor()

  // установка версии и информации для построения qr-кода
  set version(version) {
    const mode = this.mode, eccl = this.eccl;

    this._version = version;
    if (constQR.isMode(mode) && constQR.isEccl(eccl) && version > 0 && version < 41) {
      // фиксирование информацию для построения qr-кода для текущего состояния
      this.fixedInfoVersion(version, mode, eccl);
    }
  }
  get version() { return this._version; }

  // для бит режима возвращает значение true, когда необходимо внедрить информацию о версии
  get needsVerInfo() { return this.version > 6; }

  /*
   * фиксирование информацию для построения qr-кода для текущего состояния
   */
  fixedInfoVersion(version, mode, eccl) {
    this.qtyBlocks = infoVersion[version][1][eccl];
    this.bytesCorrectionPerBlock = infoVersion[version][0][eccl];
    this.genpoly = constQR.GF256_GENPOLY[this.bytesCorrectionPerBlock];
    this.bitsFieldDataQty = constQR.bitsFieldDataQuantity(version, mode);
    this.positionAlignmentPatterns = infoVersion[version][2];

    // подсчет количества битов для полей данных в QR-коде
    const countDataBits = () => {
      /*
       * сокращенно: всего (21+4*(version-1))**2
       * - шаблоны поиска (8*8*3+1) и синхронизации 2*(21+4*(version-1)-8*2)
       * - информация о формате (2*15)
       */
      let nBits = 16 * version * version + 128 * version + 64;
      // количество позиции шаблонов синхронизации
      const qtyAP = this.positionAlignmentPatterns.length;

      if (qtyAP) {
        /*
         * сокращенно: всего: 5*5 бит * qtyAP**2 колвоБлоков
         * - 2*(5 * (qtyAP-2)) пересечение с шаблонами синхронизации
         * - 5*5*3 неотображающиеся (пересекающиеся с шаблонами поиска)
         */
        nBits -= 25 * qtyAP * qtyAP - 10 * qtyAP - 55;
      }
      if (this.needsVerInfo) nBits -= 36; // информация о версии 2*18
      return nBits;
    };

    /*
     * максимальное количество информации (включая информацию о методе и кол-ве данных)
     * блоковый поток д/б кратен 8 (очищаем последние 3 бита)
     * вычитаем биты ECC: 8 битБайт * колвоБайтНаБлок * колвоБлоков
     */
    this.bitsData = (countDataBits() & ~7) - 8 * this.bytesCorrectionPerBlock * this.qtyBlocks;

  } // END fixedInfoVersion()


  /*
   * перезапись строки text в массив фактически кодируемых символов data
   */
  textToData() {
    const text = this.text, data = this.data;

    if (this.mode === constQR.MODE_NUMERIC || this.mode === constQR.MODE_ALPHANUMERIC) {
      this.data = text.split('');
      return;
    }

    // разбиваем кодируемую строку utf-8(в т.ч.ASCII) на массив октетов(байтов)
    for (const codePoint of text) {   // пару суррогатов воспринимает как одну кодовую точку
      // для символов до 65535 и для пары суррогатов возвращает код UTF-8
      const utfCode = codePoint.codePointAt(0);

      if (utfCode < 128) data.push(utfCode);

      else if (utfCode > 2097151) {
        data.length = 0;
        break;

      } else {
        // количество дополнительных октетов по 6 бит для записи значения
        const nAddOctets = (utfCode < 2048) ? 1 : (utfCode < 65536) ? 2 : 3;
        // первый октет
        data.push([0xc0, 0xe0, 0xf0][nAddOctets - 1] | (utfCode >> 6 * nAddOctets));
        // последующие октеты
        for (let i = nAddOctets; i > 0;) {
          data.push(0x80 | ((utfCode >> 6 * --i) & 0x3f));
        }
      }
    }
  }  // END textToData()

  // формирование кодовых слов данных (без битов ECC)
  dataToCodewords() {
    const data = this.data, datalen = data.length, mode = this.mode,
      maxQtyCodewordsData = this.bitsData >> 3;
    const codewordsData = this.codewordsData;

    // упаковка очереди битового потока в кодовые слова размером 8 бит
    let bits = 0, remaining = 8;
    const pack = (x, n) => {
      while (n > 0) {
        x &= (1 << n) - 1;
        if (n < remaining) {
          bits |= x << (remaining -= n);
          n = 0;
        } else {  // n >= remaining
          bits |= x >>> (n -= remaining);
          codewordsData.push(bits);
          bits = 0;
          remaining = 8;
        }
      }
    };

    // метод кодирования
    pack(mode, 4);

    // количество данных
    pack(datalen, this.bitsFieldDataQty);

    // закодированные в соответствии с mode данные
    switch (mode) {
      case constQR.MODE_NUMERIC:
        for (let i = 2; i < datalen; i += 3) {
          pack(+(data[i - 2] + data[i - 1] + data[i]), 10);
        }
        const rest = [0, 4, 7][datalen % 3];
        if (rest)
          pack(+((rest === 7 ? data[datalen - 2] : '') + data[datalen - 1]), rest);
        break;

      case constQR.MODE_ALPHANUMERIC:
        const mapCode = constQR.ALPHANUMERIC_MAP;
        for (let i = 1; i < datalen; i += 2) {
          pack(mapCode[data[i - 1]] * 45 + mapCode[data[i]], 11);
        }
        if (datalen % 2) pack(mapCode[data[datalen - 1]], 6);
        break;

      case constQR.MODE_OCTET:
        data.forEach(x => pack(x, 8));
        break;
    }

    // терминатор: контроль переполнения из-за терминатора количества кодовых слов
    if ((codewordsData.length < maxQtyCodewordsData - 1) || remaining === 8)
      pack(constQR.MODE_TERMINATOR, 4);

    // последнее значащее слово
    if (remaining < 8) codewordsData.push(bits);

    // дополнение чередующимися байтами до maxQtyCodewordsData
    while (codewordsData.length + 1 < maxQtyCodewordsData) codewordsData.push(0xec, 0x11);
    if (codewordsData.length < maxQtyCodewordsData) codewordsData.push(0xec);
  } // END dataToCodewords()

  /*
   * сформировать кодовые слова для размещения в QR-коде
   */
  makeCodewordsQR() {
    const qtyBlocks = this.qtyBlocks, poly = this.codewordsData, genpoly = this.genpoly;
    const codewordsQR = this.codewordsQR;

    /*
     * создание карты навигации блоков данных с равным количеством элементов для массива заданной длины,
     * если равномерно не распределяются, количество элементов в последних блоках увеличивается на 1,
     * возвращает:
     * массив индексов первых элеменатов блоков в массиве, где последний содержит общее количество элементов
     * количество элементов в блоке, количество блоков без добавления одного элемента
     */
    const makeMapBlocks = (qtyElements, qtyBlocks) => {
      const posBlocks = [];
      const qtyElementsInBlock = (qtyElements / qtyBlocks) | 0,
        qtyBlocksWithoutAdd = qtyBlocks - qtyElements % qtyBlocks;
      for (let j = 0, pos = 0; j < qtyBlocks + 1; j++) {
        posBlocks.push(pos);
        pos += qtyElementsInBlock + (j < qtyBlocksWithoutAdd ? 0 : 1);
      }
      return { pos: posBlocks, qtyElementsInBlock, qtyBlocksWithoutAdd };
    };

    // вычисляет кодовые слова ECC для группы кодовых слов данных и генерирующего многочлена
    const calculateECC = (poly, genpoly) => {
      const codewords = [...poly].concat(Array(genpoly.length).fill(0));
      for (let i = 0; i < poly.length;) {
        const quotient = constQR.GF256_INV[codewords[i++]];
        if (quotient >= 0) {
          for (let j = 0; j < genpoly.length; ++j) {
            codewords[i + j] ^= constQR.GF256[(genpoly[j] + quotient) % 255];
          }
        }
      }
      return codewords.slice(poly.length);   // кодовые слова исправления ошибок блока данных
    };

    // карта нахождения блоков в данных
    const mapBlocks = makeMapBlocks(poly.length, qtyBlocks);

    // для каждого блока кодовых слов данных создаем коды ошибок
    const blocksECC = []; // массив блоков Error Correction Codewords
    for (let j = 0; j < qtyBlocks; ++j) {
      blocksECC.push(calculateECC(poly.slice(mapBlocks.pos[j], mapBlocks.pos[j + 1]), genpoly));
    }

    /*
     * собираем поток кодовых слов для размещения в QR-коде
     */
    // - кодовые слова данных из всех блоков
    for (let i = 0; i < mapBlocks.qtyElementsInBlock; ++i) {
      for (let j = 0; j < qtyBlocks; ++j) {
        codewordsQR.push(poly[mapBlocks.pos[j] + i]);
      }
    }
    // - кодовые слова данных из блоков, содержащих дополнительное слово
    for (let j = mapBlocks.qtyBlocksWithoutAdd; j < qtyBlocks; ++j) {
      codewordsQR.push(poly[mapBlocks.pos[j + 1] - 1]);
    }

    // - кодовые слова ECC
    for (let i = 0; i < genpoly.length; ++i) {
      for (let j = 0; j < qtyBlocks; ++j) {
        codewordsQR.push(blocksECC[j][i]);
      }
    }
  } // END makeCodewordsQR()

  /*
   * сформировать кодовое слово версии (с битами ECC),
   * для получения битов исправления ошибок используют код Голея (Golay code) (18,6).
   * генерирующий полином: x^12+x^11+x^10+x^9+x^8+x^5+x^2+1, или 0x1F25
   * Приложение D, п.D.1 стр.70 ГОСТ Р ИСО/МЭК 18004-2015
   */
  makeCodewordVersion() {
    return this.needsVerInfo ?
      constQR.encodeBCH(this.version, 6, 0x1F25, 12) :
      0;
  } // END makeCodewordVersion()

  /*
   * сформировать кодовое слово формата (код маски, код уровня коррекции ошибок, биты ECC),
   * для получения битов исправления ошибок используется
   * код Боуза-Чоудхури-Хоквингема (Bose-Chaudhuri-Hocquenghem, ВСН) (15,5)
   * генерирующий полином: x^10+x^8+x^5+x^4+x^2+x+1, или 0x537
   * закодированные дополнительно XOR с шаблоном маски 0x5412
   * Приложение С, п.С.1 стр.68 ГОСТ Р ИСО/МЭК 18004-2015
   */
  makeCodewordFormat(mask) {
    return constQR.encodeBCH((this.eccl << 3) | mask, 5, 0x537, 10) ^ 0x5412;
  } // END makeCodewordFormat()

  /*
   * заполнить матрицу QR-кода
   */
  makeMatrix() {
    const version = this.version;

    const isMaskAuto = this.mask < 0;
    let mask = isMaskAuto ? 0 : this.mask, maskFunc = constQR.MASKFUNCS[mask];

    const aligns = this.positionAlignmentPatterns; // позиции направляющих шаблонов

    const codewordVersion = this.makeCodewordVersion(); // кодовое слово версии (с битами ECC)
    // кодовое слово формата (код маски, код уровня коррекции ошибок, биты ECC),
    let codewordFormat = this.makeCodewordFormat(mask);
    const codewordsQR = this.codewordsQR;

    const matrixSize = 21 + 4 * (version - 1),  // размер матрицы QR-кода в соотвтествии с версией
      matrix = new Array(matrixSize), // матрица QR-кода
      mapData = isMaskAuto ? new Array(matrixSize) : [];  // матрица незамаскированных данных

    // поместить в matrix начиная с координаты x,y w-битные слова из массива listWords
    const placeBlock = (x, y, w, listWords) => {
      for (let j = 0; j < listWords.length; ++j) {
        for (let i = 0; i < w; ++i) {
          matrix[y + j][x + i] = (listWords[j] >> i) & 1;
        }
      }
    };

    // поместить в matrix информацию о формате
    const placeFormatInfo = (codewordFormat) => {
      const n = matrixSize;
      const y = [0, 1, 2, 3, 4, 5, 7, 8, n - 7, n - 6, n - 5, n - 4, n - 3, n - 2, n - 1];
      const x = [n - 1, n - 2, n - 3, n - 4, n - 5, n - 6, n - 7, n - 8, 7, 5, 4, 3, 2, 1, 0];
      for (let i = 0; i < 15; ++i) {
        matrix[8][x[i]] = matrix[y[i]][8] = (codewordFormat >> i) & 1;
      }
    };

    // инициализация матрицы QR-кода и, при необходимости автоподбора маски,
    // матрицу незамаскированных данных
    for (let i = 0; i < matrixSize; ++i) {
      matrix[i] = (new Array(matrixSize)).fill(null);
      if (isMaskAuto) mapData[i] = (new Array(matrixSize)).fill(null);
    }

    // шаблоны поиска с разделителем
    placeBlock(0, 0, 8, [0x7f, 0x41, 0x5d, 0x5d, 0x5d, 0x41, 0x7f, 0x0]);
    placeBlock(matrixSize - 8, 0, 8, [0xfe, 0x82, 0xba, 0xba, 0xba, 0x82, 0xfe, 0x0]);
    placeBlock(0, matrixSize - 8, 8, [0x0, 0x7f, 0x41, 0x5d, 0x5d, 0x5d, 0x41, 0x7f]);
    placeBlock(8, matrixSize - 8, 1, [0x1]);

    // шаблоны синхронизации
    for (let i = 8; i < matrixSize - 8; ++i) {
      matrix[i][6] = matrix[6][i] = ~i & 1;
    }

    // направляющие шаблоны
    const m = aligns.length;
    for (let x = 0; x < m; ++x) {
      const miny = (x === 0 || x === m - 1 ? 1 : 0), maxy = (x === 0 ? m - 1 : m);
      for (let y = miny; y < maxy; ++y) {
        placeBlock(aligns[x], aligns[y], 5, [0x1f, 0x11, 0x15, 0x11, 0x1f]);
      }
    }

    // информация о формате
    placeFormatInfo(codewordFormat);

    // информация о версии
    if (codewordVersion) {
      for (let y = 0, k = 0; y < 6; ++y) {
        for (let x = 0; x < 3; ++x) {
          matrix[y][(matrixSize - 11) + x] =
            matrix[(matrixSize - 11) + x][y] = (codewordVersion >> k++) & 1;
        }
      }
    }

    /*
     * Кодовые слова данных и исравления ошибок
     * заполняются битами кодовых слов null-элементы матрицы
     * (от старшего бита слова до младшего),
     * оставшиеся незаполненными null-элементы приравниваем 0
     * (см. JIS X 0510:2004, раздел 8.7.3).
     */
    for (let x = matrixSize - 1, k = 0, direction = -1; x > -1; x -= 2) {
      if (x === 6) --x; // пропустить весь столбец шаблона синхронизации
      for (let y = 0; y < matrixSize; y++) {
        let j = (direction < 0 ? matrixSize - y - 1 : y);
        for (let i = x; i > x - 2; i--) {
          if (matrix[j][i] === null) {
            /*
             * при наличии незаполненных null-элементах,
             * ( k >> 3 ) станет больше ( codewordsQR.length - 1 ),
             * но ( undefined >> (~k&7) ) === 0,
             * поэтому оставшиеся null-элементы заполнятся нулями
             */
            const bit = (codewordsQR[k >> 3] >> (~k & 7)) & 1;
            matrix[j][i] = bit ^ maskFunc(j, i);
            if (isMaskAuto) mapData[j][i] = bit;
            ++k;
          }
        }
      }
      direction = -direction;
    }

    // автоподбор маски
    if (isMaskAuto) {

      // изменение маски данных матрицы QR-кода
      const reMask = (mask) => {
        const maskFunc = constQR.MASKFUNCS[mask];
        // кодовое слово формата (код маски, код уровня коррекции ошибок, биты ECC),
        let codewordFormat = this.makeCodewordFormat(mask);

        // перезаписывается информация о формате
        placeFormatInfo(codewordFormat);

        // наложение на битовый поток данных выбранной маски
        mapData.forEach((aY, j) => {
          aY.forEach((el, i) => { if (el !== null) matrix[j][i] = el ^ maskFunc(j, i); });
        });

      };

      // тесты масок
      const testScore = (Array(constQR.MASKFUNCS.length).fill(0)).map((el, i) => {
        if (i) reMask(i);   // для текущей матрицы уже установлена нулевая маска
        return this.maskTest(matrix);
      });

      // выбор лучшей, с наименьшим количеством штрафных баллов
      mask = testScore.reduce((bestMask, score, mask) => {
        if (score < bestMask.score) { bestMask.mask = mask; bestMask.score = score; }
        return bestMask;
      }, { mask: 0, score: testScore[0] }).mask;

      // устанавливаем выбранную маску
      reMask(mask);
      // фиксируем  выбранную маску
      this.mask = mask;
    }

    // заполненная матрица QR-кода
    this.matrix = matrix;
  }  // END makeMatrix()

  /*
   * оценивает матрицу QR-кода и возвращает оценку
   */
  maskTest(matrix) {
    const matrixSize = matrix.length;
    let qtyBlack = 0,  // количество черных модулей ( элементов матрицы со значением 1 )
      score = 0,
      groups;

    // оценить группы последовотельностей: количества расположенные подряд белых и черных блоков,
    // предполагает порядок [Б,Ч,Б,Ч,Б,..]
    const evaluateGroups = (groups) => {
      let sum = 0;

      // тест CONSECUTIVE (последовательный)
      for (let i = 0; i < groups.length; ++i) {
        if (groups[i] >= 5) sum += constQR.PENALTY.CONSECUTIVE + (groups[i] - 5);
      }

      // тест FINDERLIKE ( похож на шаблон поиска [Б4],Ч1,Б1,Ч3,Б1,Ч1,[Б4] )
      // начинаем с третьей черной группы
      for (let i = 5; i < groups.length; i += 2) {
        if (groups[i] === 1 &&  // Ч1
          groups[i - 1] === 1 &&  // Б1
          groups[i - 2] === 3 &&  // Ч3
          groups[i - 3] === 1 &&  // Б1
          groups[i - 4] === 1 &&  // Ч1
          // справа или слева 4 или более Б
          (groups[i - 5] >= 4 || groups[i + 1] >= 4)) {
          sum += constQR.PENALTY.FINDERLIKE;
        }
      }
      return sum;
    };

    for (let xy = 0; xy < matrixSize; ++xy) {
      const rowCells = matrix[xy];
      const nextRowCells = matrix[xy + 1] || [];

      // оцениваем строки
      groups = [];
      for (let x = 0; x < matrixSize;) {
        let qty;
        // первая группа белых
        for (qty = 0; x < matrixSize && !rowCells[x]; ++qty) ++x;
        groups.push(qty);
        for (qty = 0; x < matrixSize && rowCells[x]; ++qty) ++x;
        groups.push(qty);
      }
      score += evaluateGroups(groups);

      // оцениваем столбцы
      groups = [];
      for (let y = 0; y < matrixSize;) {
        let qty;
        // первая группа белых
        for (qty = 0; y < matrixSize && !matrix[y][xy]; ++qty) ++y;
        groups.push(qty);
        for (qty = 0; y < matrixSize && matrix[y][xy]; ++qty) ++y;
        groups.push(qty);
      }
      score += evaluateGroups(groups);

      // тест TWOBYTWO (два-два) и считаем черные блоки
      qtyBlack += rowCells[0];
      for (let x = 1; x < matrixSize; ++x) {
        qtyBlack += rowCells[x];
        if (rowCells[x] === rowCells[x - 1] &&
          rowCells[x] === nextRowCells[x] &&
          rowCells[x] === nextRowCells[x - 1]) {
          score += constQR.PENALTY.TWOBYTWO;
        }
      }
    }

    // тест DENSITY (плотность)
    score += constQR.PENALTY.DENSITY *
      (((Math.abs(qtyBlack * 100 / matrixSize / matrixSize - 50) - 1) / 5) | 0);

    return score;
  }  // END maskTest()

  /*
   * отчет о состоянии
   */
  report() {
    return new QRCODE(
      this.image,
      {
        text: this.text,
        mode: this.mode,
        eccl: this.eccl,
        version: this.version,
        mask: this.mask,
        matrix: this.matrix,

        modsize: this.modsize,
        margin: this.margin
      },
      {
        error: this.error,
        errorSubcode: this.errorSubcode
      }
    );
  } // END report()

} // END class DataQR
