/* демо: QR-код приложения */
"use strict";

const app = (dictionaryPath) => {
  const el = (selector) => document.querySelector(selector);
  const els = (selector) => document.querySelectorAll(selector);

  const elQR = {
    text: el('#qr-text'),
    mode: el('#qr-mode'),
    eccl: el('#qr-eccl'),
    version: el('#qr-version'),
    mask: el('#qr-mask'),
    modsize: el("#qr-modsize"),
    margin: el("#qr-margin")
  };

  let qrcode = null;

  const langSelect = el(".header-lang>select");
  const langСontent = ['eng', 'rus'];
  let langDictionary = {};  // словарь перевода

  const translate = (key, lang = langSelect.value) => {
    if (key in langDictionary && lang in langDictionary[key])
      return langDictionary[key][lang];
    return '';
  };
  const use = async (url) => {  // загрузка словарей
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: { "Content-Type": "application/json" }
      });
      if (!response.ok) return null;
      return await response.json();
    } catch (error) { return null; }
  };

  // открытие / закрытие сообщения об ошибке
  const messageError = (key = '') => {
    const elem = el('.error-message');
    let message = key ? translate(key) : '';

    if (key) {
      if (!message) message = "недопустимые исходные данные для генерации QR-кода";
      elem.innerHTML = `<b>${langSelect.value === 'rus' ? 'Ошибка' : 'Error'}:</b>&nbsp;${message}`;
      elem.classList.add('open');
      setTimeout((elem) => {
        elem.style.transition = 'none';
      }, 500, elem);

    } else {
      elem.style.transition = '';
      elem.classList.remove('open');
      setTimeout((elem) => {
        elem.innerHTML = '';
      }, 500, elem);
    }
  }; // END messageError()

  // очистка и закрытие сообщения об ошибке
  const clearError = () => {
    if (qrcode && qrcode.error) {
      qrcode.clearError();
      messageError();
    }
  };

  // смена URL для смены языка по хешу
  const changeURL = (lang) => {
    const site = window.location;

    const changeLanguage = (lang) => {
      const translation = translate('title', lang);

      langSelect.value = lang;

      if (translation) document.title = translation;

      for (let key in langDictionary) {
        const elems = els('.lang-' + key);
        for (const elem of elems) {
          if (lang in langDictionary[key]) {
            elem.innerText = langDictionary[key][lang];
          }
        }
      }
      if (qrcode && qrcode.error) messageError(qrcode.error + '-' + qrcode.errorSubcode);
    };

    // перенаправить на url с хешем выбранного языка
    if (!langСontent.includes(lang)) lang = 'rus';
    site.hash = lang;
    // смена языка на странице
    changeLanguage(lang);
  };  // END changeURL()

  // выбор авто vs ввод параметров генерации QR-кода
  const vsParams = (e) => {
    const el = e.target;

    if (el.classList.contains('col-1')) {
      // изменяем кнопку
      const vs = el.classList.contains('lang-vs1') ? 'vs2' : 'vs1';
      const translation = translate(vs);

      el.classList.remove('lang-vs1', 'lang-vs2');
      el.classList.add('lang-' + vs);

      if (translation) el.textContent = translation;
      else el.textContent = vs === 'vs1' ? 'авто' : 'ввод';

      // открываем / закрываем ввод
      el.parentNode.children[2].classList.toggle('hide');
    }
  };  // END vsParams()

  // ввод параметров генерации QR-кода
  const inputParams = (e) => {
    const el = e.target, elP = el.parentNode;

    if (el.classList.contains('col-2')) {
      // валидация ввода: только цифры
      if (elP === elQR.version || elP === elQR.modsize) {
        el.value = el.value.replace(/((^0)|(\D))+/g, "").slice(0, 2);
      } else if (elP === elQR.mask) {
        el.value = el.value.replace(/[^01234567]+/g, "").slice(0, 1);
      } else if (elP === elQR.margin) {
        el.value = el.value.replace(/\D+/g, "").slice(0, 2);
      }
    }
  };  // END inputParams()

  // генерация / очистка QR-кода
  const generation = (e) => {
    const qrCodeOutput = el('#qrcode-output');

    const changeStatus = (key, qr = {}) => {
      const btn = e.target, style = document.documentElement.style;
      const cancel = key === 'cancel';
      const translation = translate('btn-' + key);

      // изменяем кнопку
      btn.classList.remove('lang-btn-create', 'lang-btn-cancel');
      btn.classList.add('lang-btn-' + key);
      if (translation) btn.textContent = translation;
      else btn.textContent = cancel ? 'отменить' : 'генерировать';

      // значения параметров, подобранных автоматически
      ['version', 'mode', 'eccl', 'mask', 'modsize', 'margin'].forEach(name => {
        const block = elQR[name].children,
          auto = block[1].classList.contains('lang-vs1'), elUser = block[2], elAuto = block[3];
        let value = cancel ? qr[name] : '';

        if (auto) {
          if (cancel) {
            elUser.value = value;
            if ('mode eccl'.includes(name)) value = elUser[elUser.selectedIndex].textContent;
          }
          elAuto.textContent = value;
          elAuto.classList.toggle('hide');
          if (name === 'mode') elAuto.classList.toggle('lang-m' + elUser.value);
        }
      });

      // шторка на параметры
      elQR.text.disabled = cancel;
      style.setProperty('--access-main-params', cancel ? '0' : 'none');
      style.setProperty('--main-params-background', cancel ? 'var(--bgcolor-api)' : 'var(--bgcolor-open)');
      // шторка на сохранение
      style.setProperty('--access-save-as', cancel ? 'none' : '0');
      style.setProperty('--save-as-background', cancel ? 'var(--bgcolor-open)' : 'var(--bgcolor-api)');
    };


    if (qrcode && (qrcode.result || qrcode.error === 'image')) {
      // очищаем ошибки при переходе к вводу параметоров
      if (qrcode.error) {
        qrcode.clearError();
        messageError('');
      }

      // очищаем блок с QR-кодом
      qrcode = null;
      qrCodeOutput.innerHTML = "";
      qrCodeOutput.classList.add('empty');
      changeStatus('create');

    } else {
      // генерация QR-кода
      const auto = el => el.children[1].classList.contains('lang-vs1');
      const value = el => +el.children[2].value;

      qrcode = window.QRCreator(elQR.text.value, {
        version: auto(elQR.version) ? -1 : Math.max(value(elQR.version), 1),
        mode: auto(elQR.mode) ? -1 : value(elQR.mode),
        eccl: auto(elQR.eccl) ? -1 : value(elQR.eccl),
        mask: auto(elQR.mask) ? -1 : value(elQR.mask),
        modsize: auto(elQR.modsize) ? -1 : Math.max(value(elQR.modsize), 1),
        margin: auto(elQR.margin) ? -1 : value(elQR.margin)
      });
      messageError(qrcode.error ? qrcode.error + '-' + qrcode.errorSubcode : '');

      if (qrcode.result) {
        qrCodeOutput.classList.remove('empty');
        qrCodeOutput.append(qrcode.result);
        changeStatus('cancel', qrcode);
      }
    }
  }; // END generation()

  // сохранить
  const saveAs = (e) => {
    const el = e.target;
    if (el.classList.contains('save-as')) {
      const image = el.dataset.image;

      qrcode.download('proba.' + image, image);
      messageError(qrcode.error ? qrcode.error + '-' + qrcode.errorSubcode : '');
    }
  };  // END saveAs()

  // выбор языка
  langSelect.addEventListener('change', () => changeURL(langSelect.value));
  // очистка и закрытие сообщения об ошибке
  el('.error-message').addEventListener('click', clearError);
  // выбор авто vs ввод параметров генерации QR-кода
  el('.main-params').addEventListener('click', vsParams);
  // ввод параметров генерации QR-кода
  el('.main-params').addEventListener('input', inputParams);
  // генерация / очистка QR-кода
  el('#generate-qrcode').addEventListener('click', generation);
  // сохранить
  el('#qrcode-save-as').addEventListener('click', saveAs);

  // считываем данные справочина перевода
  if (dictionaryPath) use(dictionaryPath).then(data => {
    if (data === null) {
      el('.header-lang').classList.add('hide');

    } else {
      langDictionary = { ...data.lang_dictionary[0], ...data.qrcreator_error_message[0] };

      // установливаем язык по хешу
      changeURL(window.location.hash.slice(1));
    }
  });

}; // END app()
app('./db/lang.json');

