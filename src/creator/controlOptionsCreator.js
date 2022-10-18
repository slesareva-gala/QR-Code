/* контроль опций для генерации QR-кода */
"use strict";

import { constQR } from "../lib/iso";

export const controlOptionsCreator = (qrcode) => {
  const errorQR = (setting, subcode) => {
    return { name: 'QRoptionsError', setting, subcode };
  };
  const notInteger = (value) => value !== (value & ~0);

  // тест строки для кодирования text
  const testText = (text) => {
    try {
      if (typeof (text) !== 'string') throw errorQR('text', '1');
      if (text.length === 0) throw errorQR('text', '2');
    } catch (e) {
      if (e.name === 'QRoptionsError') throw e;
    }
  };

  // тест метода кодирования строки mode
  const testMode = (mode, text) => {
    try {
      // регулярные выражения проверки mode
      const NUMERIC_REGEXP = /^\d*$/, ALPHANUMERIC_REGEXP = /^[A-Z0-9 $%*+\-./:]*$/;

      if ((mode === constQR.MODE_NUMERIC || mode === -1) && !text.replace(NUMERIC_REGEXP, "")) {
        mode = constQR.MODE_NUMERIC;
      } else if ((mode === constQR.MODE_ALPHANUMERIC || mode === -1) && !text.replace(ALPHANUMERIC_REGEXP, "")) {
        mode = constQR.MODE_ALPHANUMERIC;
      } else if (mode === constQR.MODE_OCTET || mode === -1) {
        mode = constQR.MODE_OCTET;
      } else throw errorQR('mode', '1');
    } catch (e) {
      if (e.name === 'QRoptionsError') throw e;
    } finally { qrcode.mode = mode; }
  };

  // тест (подбор) версии qr-кода [с подбором уровеня корекции ошибок]
  const testVersion = (version, ecclChoice) => {
    const mode = qrcode.mode;

    // возвращает максимальную длину данных, возможную в данной конфигурации.
    const bitsDataMax = () => {
      /* количество бит для "чистых данных":
         qrcode.bitsData бит данных без кодовых слов исправления ошибок
         - 4 бит для записи кода метода mode
         - qrcode.sizeFieldDataQty бит для записи количества данных
      */
      const nBits = qrcode.bitsData - 4 - qrcode.bitsFieldDataQty;

      switch (mode) {
        case constQR.MODE_NUMERIC:  // 3 цифры в 10 бит + остаток: 1 цифра в 4 бит или 2 цифры в 7 бит
          return ((nBits / 10) | 0) * 3 + (nBits % 10 < 4 ? 0 : nBits % 10 < 7 ? 1 : 2);
        case constQR.MODE_ALPHANUMERIC: // 2 буквы в 11 бит + остаток 1 буква в 6 бит
          return ((nBits / 11) | 0) * 2 + (nBits % 11 < 6 ? 0 : 1);
        case constQR.MODE_OCTET:
          return (nBits / 8) | 0;    // целое число байт
      }
    };

    // возращает поместится текст в qr-код заданной версии
    const fitLength = (version) => {
      // установка версии и фиксирование информации для построения qr-кода
      qrcode.version = version;
      return qrcode.data.length <= bitsDataMax();
    };

    // подбор уровня коррекции ошибок для версии
    const ecclVersion = (version, ecclChoice, iStart = 0) => {
      // приоритет выбора уровня коррекции ошибок в порядке убывания: 2(H) 3(Q) 0(М) 1(L)
      const ecclPriority = [2, 3, 0, 1];

      if (!ecclChoice) return fitLength(version);

      for (let i = iStart; i < 4; ++i) {
        // установка версии и фиксирование информации для построения qr-кода
        qrcode.eccl = ecclPriority[i];
        if (fitLength(version)) return true;
      }
      return false;
    };

    try {
      if (version === -1) {
        if (ecclChoice) qrcode.eccl = 2; // начинаем с "H"
        for (version = 1; version < 41; ++version) {
          if (fitLength(version)) break;
        }
        if (version > 40 && (!ecclChoice || !ecclVersion(40, ecclChoice, 1)))
          throw errorQR('version', '1');

      } else if (version < 1 || version > 40 || notInteger(version)) {
        throw errorQR('version', '2');

      } else {
        if (!ecclVersion(version, ecclChoice)) throw errorQR('version', '3');
      }

    } catch (e) {
      if (e.name === 'QRoptionsError') throw e;
    }
  };

  try {
    // тест строки для кодирования text
    testText(qrcode.text);
    // тест метода кодирования строки mode
    testMode(qrcode.mode, qrcode.text);
    // перезапись строки text в массив фактически кодируемых символов data
    qrcode.textToData();
    if (!qrcode.data.length) throw errorQR('text', '3');
    // уровень корекции ошибок: 0(М) 1(L)  3(Q) 2(H)
    if (qrcode.eccl < -1 || qrcode.eccl > 3 || notInteger(qrcode.eccl)) throw errorQR('eccl', '1');
    // тест (подбор) версии qr-кода [с подбором уровеня корекции ошибок]
    testVersion(qrcode.version, qrcode.eccl < 0);
    // маска применяется (и выбирается) после формировиня qr-кода
    if (qrcode.mask !== -1 && (qrcode.mask < 0 || qrcode.mask > 8 || notInteger(qrcode.mask)))
      throw errorQR('mask', '1');

    // формат изображения
    if (!(constQR.IMAGE.includes(qrcode.image))) throw errorQR('image', '1');
    // размер модуля n x n, где n > 1
    if (qrcode.modsize === -1) qrcode.modsize = constQR.modsize;
    else if (qrcode.modsize < 1 || notInteger(qrcode.modsize)) throw errorQR('modsize', '1');
    // размер свободной зоны в модулях: от 0
    if (qrcode.margin === -1) qrcode.margin = constQR.margin;
    else if (qrcode.margin < 0 || notInteger(qrcode.margin)) throw errorQR('margin', '1');

  } catch (e) {
    qrcode.error = e.setting;
    qrcode.errorSubcode = e.subcode;
  }
};  // END controlOptionsCreator()
