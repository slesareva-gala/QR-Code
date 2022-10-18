<h1 align="center">QRCreator.js</h1>
QRCreator.js — это скрипт на чистом javascript для создания QR-кода.  

<p align="center">
<img src="https://github.com/slesareva-gala/forCodePen/blob/master/gif/demo_QRCreator.gif" width="80%"></p>

Протестируйте => ( [ДЕМО](https://slesareva-gala.github.io/QR-Code/#rus) }


<h2> Установка </h2>
1. Скопируйте файл QRCreator.js
2. В файле html в тег <head> вставьте тег <script> с указанием ссылки на файл QRCreator.js<br />
  `<script src="QRCreator.js" defer></script>`

### Пример подключения
```html
<html>
  <head>
    <script src="QRCreator.js"></script>
  </head>
  <body>
    <div id="qrcode"></div>
  </body>

  <script>
    document.getElementById('qrcode').append(QRCreator('Привет, Мир!').result);
  </script>
</html>
```

или

### Пример подключения с вызовом из js-файла
```html
<html>
  <head>
    <script src="QRCreator.js" defer></script>
    <script src="sample2.js" defer></script>
  </head>

  <body>
    <div id="qrcode1"></div>
    <div id="qrcode2"></div>
  </body>
</html>
```
**sample.js**
```js
const qrcode1 = QRCreator('Привет, Мир!',
{ mode: 4,
  eccl: 0,
  version: 3,
  mask: -1,
  format: 'html',
  modsize: -1,
  margin: 0
});
const qrcode2 = QRCreator('Привет, Мир!', { mode: 1});

const content = (qrcode) =>{
  return qrcode.error ?
    `недопустимые исходные данные ${qrcode.error}`:
     qrcode.result;
};

document.getElementById('qrcode1').append( 'QR-код № 1: ', content(qrcode1));
document.getElementById('qrcode2').append( 'QR-код № 2: ', content(qrcode2));
```

<h2> Синтаксис </h2>

      **window.QRCreator(text[,options])**
  
      или
  
      **QRCreator(text[,options])**

### Параметры

   **text**
     Кодируемая текстовая строка UTF-8

   **options**
     Объект, содержащий свойства со значениями параметров генерации QR-кода,
      по умолчанию:
      `{mode: -1,  eccl: 0, version: -1, mask: -1, format: 'PNG', modsize: -1, margin: -1}`

### Возвращаемое значение
    Объект qrcode, описывающий результат генерации QR-кода


## ОПИСАНИЕ
### 1. Свойство options
#### 1.1. Основные свойства options, содержащие значения параметров формирования матрицы QR-code
| свойство | значение | содержание |
|:----:|:----:|:----------|
| ***mode*** | целое число из:  -1, 1, 2, 4  |  метод кодирования:  1 -числовой, 2-буквенно-цифровой, 4-октетный,  если не указан или -1, то выбирается допустимый метод |
| ***eccl*** |  целое число:  от -1 до 3 | уровень коррекции ошибок: 1(L), 0(M), 3(Q), 2(H)         если не указан или -1, то подбор допустимого уровня начиная с 3(Q) |
| ***version*** | целое число:  -1 или от 1 до 40 | версия, если не указана или -1,  то выбирается наименьшая возможная версия |
| ***mask*** | целое число:  -1 или от 0 до 7 | шаблон маски, если не указан или -1,  то выбирается лучшая маска |

#### 1.2. Дополнительные свойства options, содержащие значения параметров формирования изображения
| свойство | значение | содержание |
|:----:|:----:|:----------|
  ***format***    регистронезависимая   >строка, одна из:  'PNG', 'SVG','HTML'  или 'NONE' | формат результата, если не то указан,    результат выводится в формате 'PNG'    при задании значения 'NONE' - результат не формируется |
| ***modsize*** |  целое число    -1 или от 1 | размер модуля modsize x modsize,   если не указан или -1, то 4 |
| ***margin*** |  целое число     от 0 | размер свободной зоны в модулях,   если не указан, то 4 модуля |

### 2. Возвращаемый объект qrcode
#### 2.1 Свойства qrcode
| свойство | значение | содержание |
|:----:|:----:|:----------|
| ***text*** | заданное | исходный текст |
| ***mode***    ***eccl***    ***version***    ***mask*** | заданные или    подобранные | параметры сформированной матрицы QR-кода |
| ***modsize***    ***margin*** | заданные или    по умолчанию | параметры сформированной матрицы QR-кода    и параметры изображения QR-кода |
| ***format*** | заданное | формат изображения QR-кода или 'NONE' |
| ***matrix*** | массив[у][х]    координаты:    у - колонка    х - строка     | матрица QR-кода, где 0-белый, 1-черный |
| ***result*** | HTML элемент    или '' | QR-код в заданом формате    или в случае ошибки, или когда был задан параметр    format === 'NONE' |
| ***error*** | имя параметра    или '' | имя параметра, вызвавшего ошибку    или при отстутствии ошибок |
| ***errorSubcode*** | строка    с целочисленным    цифроовым кодом   или '' | код, поясняющий ошибку       при отстутствии ошибок |

### 2.2. Методы qrcode

   ***qrcode.format = newFormat***

     При изменении текущего формата изображения qrcode.format на новое значение newFormat происходит переформирование изображения.
     Процесс может вызвать ошибку: qrcode.error === "format".

  ***qrcode.download(filename, format)***

     Вызывает скачивание файла с именем filename в формате format

        Если _filename === ""_,
        то
        - при `qrcode.format === 'PNG'`  уставливается `filename = 'qrcode.png'`
        - при `qrcode.format === 'SVG'`  уставливается `filename = 'qrcode.svg'`
        - при `qrcode.format === 'HTML'` уставливается `filename = 'qrcode.html'`

        Если format не задан, то приниматся текущее значение qrcode.format.
        Если format указан, то до вывода переформировывается изображение ( соответствует методу `qrcode.format = format`).

        *Примечание*
        Если при переформировании изображения произошла ошибка `qrcode.error !== ""` или задан формат 'NONE' и, соотвтественно, отсутствует результат `qrcode.result===""`, то скачиваение файла не вызывается.

  ***qrcode.clearError()***

        Очистка сообщения об ошибке qrcode.error и qrcode.errorSubcode

        *Примечание*
        При наличии ошибок формирования изображения, методы qrcode:
        `qrcode.format = newFormat` и `qrcode.download(filename, format)`
        не работают, пока сообщение не будет обработано и (или) очищено `qrcode.clearError()`.

### 2.3. Типы и подкоды ошибок

| error | errorSubcode | содержание |
|:----:|:----:|:----------|
| ***text*** | ***1*** | недопустимый формат строки для кодирования |
| ***text*** | ***2*** | не указан текст для кодирования |
| ***text*** | ***3*** | текст содержит недопустимые символы |
| ***mode*** | ***1*** | недопустимый или неподдерживаемый метод кодирования |
| ***version*** | ***1*** | слишком длинный текст для кодирования |
| ***version*** | ***2*** | недопустимая версия |
| ***version*** | ***3*** | текст слишком длинный для выбранной версии |
| ***eccl*** | ***1*** | недопустимый уровень коррекции ошибок |
| ***mask*** | ***1*** | недопустимый шаблон маски |
| ***format*** | ***1*** | недопустимый формат для генерации QR-кода |
| ***format*** | ***2*** | для вывода в формате PNG необходима поддержка canvas |
| ***format*** | ***3*** | недопустимый формат для генерации QR-кода |
| ***modsize*** | ***1*** | недопустимый размер модуля |
| ***margin*** | ***1*** | недопустимый размер свободной зоны (в модулях) |

Данная таблица с содержанием на русском и английском языках приведена в .\docs\db\lang.json свойтво "qrcreator_error_message".

## Лицензия
MIT License. Код может быть использован для любых целей.

## Проверено на совместимость с браузерами
Chrome (v.106), Firefox (v.105), Яндекс.Браузер (v.22), Brave (v.1.44), Microsoft Edge (v.106)

## Смотрите также
_Первоисточик: [Кан Сонхун](https://github.com/shesek/qruri/blob/master/index.js)_
__***Сокровище:***__ [QR Code Tutorial](https://www.thonky.com/qr-code-tutorial/introduction)
[Алгоритм генерации QR-кода](https://habr.com/ru/post/172525/)
[Спецификация символики штрихового кода QR Code ISO/IEC 18004:2015](https://meganorm.ru/Data2/1/4293763/4293763455.pdf)
