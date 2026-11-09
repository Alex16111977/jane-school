/* PowerPoint-Klassenarbeit — карточка pp4 «Шпаргалка»: что из Probeklausur запомнить обязательно.
   Источники: P.TASKS / P.ORDER / P.NOTEN / P.WIRKUNG (из заданий учителя и файла LUMIO); отбор и сжатие — МОИ.
   Подключается в iw-egb.html после iw-ppt-quiz.js; рисует в #pp4-root сам. */
(function () {
  'use strict';
  var P = window.PPT || {};
  function fm(s) { return String(s).replace(/\[\[([^\]]+)\]\]/g, '<span class="pp-key">$1</span>').replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>'); }
  function pts(n) { var t = (P.TASKS || []).filter(function (x) { return x.n === n; })[0]; return t ? t.pts : ''; }
  function title(n) { var t = (P.TASKS || []).filter(function (x) { return x.n === n; })[0]; return t ? t.title : ''; }

  /* --- 7 главных вещей --- */
  var TOP = [
    ['Файл: **сразу** «Speichern unter» с точным именем **PK_PPT_Klasse_Nachname_Vorname.pptx**, потом [[Strg]]+[[S]] после каждого задания.', 'Потерянный файл = ноль за всё. Имя и формат — отдельный балл (Aufgabe 14).'],
    ['**Wirkung, а не путь.** В каждом задании найди слово про эффект («auf einen Blick», «einprägsam», «ohne dass … konkurriert») — результат должен давать именно его.', 'Учитель оценивает, достигнут ли эффект. Способов решения может быть несколько.'],
    ['Последний слайд **«Material für die Fertigstellung» удаляй самым последним** (в Aufgabe 12).', 'Там логотипы, иконки и правила Corporate Design. Удалишь раньше — нечего копировать для заданий 1, 3, 10, 11.'],
    ['Порядок: **11 → 1 → 3 → 4 → 9 → 5 → 2 → 7 → 6 → 8 → 10 → 12 → 13**.', 'Ссылки (13) — только после перестановки слайдов (12). Проверка CD (10) — после заданий 3–8, чтобы заодно проверить новые объекты.'],
    ['Логотип: тёмный фон → **белый**, светлый фон → **тёмный**. Иконки в тёмных кружках — **белые**.', 'Тёмное на тёмном не видно. Именно эта ошибка заложена в файле пробной работы.'],
    ['Цвета — только **верхний ряд Designfarben**, шрифт — **Calibri**.', 'В файле спрятаны отклонения: Cambria на Folie 4, кремовый фон и зелёные столбцы на Folie 9, синие кружки на Folie 12, переходы Rad и Kreis на Folien 5 и 13.'],
    ['Последние 5 минут: [[F5]] с первого слайда (анимации, ссылки, номера, логотипы), потом [[Strg]]+[[S]].', 'Неверный порядок анимации или мёртвая ссылка в обычном виде не видны, только в показе.']
  ];

  /* --- блоки шпаргалки: [ключ, ответ] — правая колонка закрывается в режиме «проверь себя» --- */
  var Q1 = [
    ['Время · задания · баллы', '**90 минут · 14 заданий · 100 баллов**. PowerPoint можно, интернет и KI нельзя.'],
    ['Что оценивают', '**Wirkung**: достигнут ли эффект из текста задания. Способов решения может быть несколько.'],
    ['Оценка (CBF)', '**1 ab 93 · 2 ab 78 · 3 ab 63 · 4 ab 48 · 5 ab 33 · 5− ab 29**, ниже — 6. С 98 баллов — 1+.'],
    ['Если застрял', 'Не больше **1,5 × планового времени** на задание. Частичные баллы лучше нуля.'],
    ['Начало', 'Сначала прочитать **все 14** заданий, потом работать.']
  ];
  function orderLine() {
    var parts = [];
    (P.ORDER || []).forEach(function (o) { var m = /^\*\*Aufgabe (\d+)\*\*/.exec(o.t); if (m) { parts.push(m[1] + ' (' + o.m + ')'); } });
    return parts.join(' → ');
  }
  var Q2 = [
    ['0–6 минут', 'Прочитать все 14 → **Speichern unter** (имя из Aufgabe 14) → **Foliensortierung**: пройти слайды, записать, какое задание к какому.'],
    ['Дальше (минуты)', function () { return '**' + orderLine() + '**'; }],
    ['Зависимости', '**Material-Folie** удалять в конце · **13 после 12** · **10 после 3–8**.'],
    ['После каждого задания', '[[Strg]]+[[S]].'],
    ['Последние 5 минут', '[[F5]] с начала: анимации, ссылки, номера, логотипы → [[Strg]]+[[S]].']
  ];
  var Q3 = [
    [1, 'белый логотип с Folie 16 → Folie 1, ≈ 6,6 cm, слева сверху; заметно меньше заголовка.'],
    [2, 'весь текст → **Notizen** ([[Strg]]+[[A]], [[Strg]]+[[C]], Ansicht → Notizen, [[Strg]]+[[V]]); на слайде ключевые слова, цифры жирно, ≥ 18 pt.'],
    [3, 'карточку с Folie 8 ×3, иконки заменить и сделать **белыми**; Ausrichten + Verteilen.'],
    [4, 'Animationsbereich: тот же эффект (Verblassen, Beim Klicken); порядок **1 Wachstum · 2 Nachhaltigkeit · 3 Mitarbeitende**.'],
    [5, 'Zuschneiden → **1:1**, товар по центру, одинаковый размер; Oben ausrichten + Horizontal verteilen; подписи под фото.'],
    [6, 'блоки (Abgerundetes Rechteck) + стрелки: Lieferanten → LUMIO → Vertrieb → Kunden; без сплошного текста.'],
    [7, 'таблица **5 × 5**; Kopfzeile выделена; не стандартный Bernstein-стиль; числа по центру.'],
    [8, '**In SmartArt konvertieren** → Organigramm; Nachhaltigkeitsmanagement под Produktion (уровень Montage и Qualitätsprüfung).'],
    [9, 'фото **In den Hintergrund** (Auswahlbereich); шрифт крупнее.'],
    [10, 'каждый слайд: Calibri, Designfarben, фон Weiß, одинаковые Übergänge (искать Cambria, Folie 9, синие кружки, Rad и Kreis).'],
    [11, 'Ansicht → **Folienmaster** → Layout «LU Inhalt» → тёмный логотип справа сверху; на Folie 1 и 15 его быть не должно.'],
    [12, 'Foliensortierung: «LUMIO in Zahlen» → Kapitel 01, «Kontakt» → в конец; Foliennummer (не на Titelfolie); Material-Folie удалить.'],
    [13, 'карточки Agenda → ссылка на слайд: выделить **форму**, [[Strg]]+[[K]] → Aktuelles Dokument; только после 12.'],
    [14, '**PK_PPT_Klasse_Nachname_Vorname.pptx** в нужную папку.']
  ];
  var Q4 = [
    ['Material-Folie', 'удалять **последней**, когда задания 1, 3, 10, 11 готовы.'],
    ['Версия логотипа', 'тёмный фон → **белый**; светлый → тёмный.'],
    ['Логотип в Layout', '**LU Inhalt**, а не на каждый слайд; на Folie 1 и 15 не должно быть.'],
    ['Folie 6: анимация', 'одна уже есть → новые встают **в конец**; порядок проверить в Animationsbereich.'],
    ['Folie 14: фото', 'лежит выше плашки → **In den Hintergrund**, а не только шрифт крупнее.'],
    ['Иконки тёмные', 'Grafikfüllung → **Weiß**.'],
    ['Таблица', 'стандартный стиль (Bernstein + белый текст) не оставлять: Akzent 2 или своя Schattierung.'],
    ['Новая Abteilung', 'Nachhaltigkeitsmanagement **под Produktion**, на уровне Montage и Qualitätsprüfung.'],
    ['Foliennummer', 'сначала обе галочки («Auf Titelfolie nicht anzeigen»), потом **Für alle übernehmen**; последний слайд нумеруется тоже.'],
    ['Hyperlink', 'на **форму**, не на текст; после Aufgabe 12; проверить в [[F5]].'],
    ['Скрытые отступления от CD', 'Folie 4 Cambria · Folie 9 кремовый фон, зелёные столбцы, Arial на осях · Folie 12 синие кружки · Folien 5 и 13 переходы Rad и Kreis.'],
    ['Aufgabe 2 и 14', 'полный текст не удалять, а в **Notizen**; имя файла точно по образцу, формат .pptx.']
  ];
  var Q5 = [
    ['auf einen Blick', 'мало слов, **цифры** крупно и жирно, таблица.'],
    ['einprägsam', 'карточка: **пиктограмма + заголовок + короткий текст**.'],
    ['ohne … konkurriert', 'логотип **намного меньше** заголовка, в углу.'],
    ['unterstützen, nicht ablenken', 'спокойный эффект (**Verblassen**), без лишней «пляски».'],
    ['gleichwertig', 'одинаковый размер, формат, рамка.'],
    ['aus den hinteren Reihen lesbar', 'шрифт крупнее, контраст, ровные уровни.']
  ];
  var Q6 = [
    ['Ausrichten', 'Formformat → Anordnen → **Ausrichten ▾** → галочка «Ausgewählte Objekte ausrichten» → Oben ausrichten или Vertikal zentrieren → **Horizontal verteilen** (нужно ≥ 3 объекта).'],
    ['Farben', '▾ у **Formfüllung** (в старых версиях Fülleffekt) → **Designfarben**, верхний ряд. Нет цвета: Weitere Füllfarben → Benutzerdefiniert → RGB.'],
    ['Schrift', 'Start → Schriftart · Schriftgrad · **F K U** · Schriftfarbe. Чужой шрифт везде: Ersetzen ▾ → **Schriftarten ersetzen**.'],
    ['Bilder', '[[Strg]]+[[C]] → [[Strg]]+[[V]]; размер **только за угол**; Bildformat → Größe; Zuschneiden ▾ → Seitenverhältnis.'],
    ['Gruppieren', 'Formformat → Anordnen → **Gruppieren ▾** → Gruppieren / Gruppierung aufheben / Erneut gruppieren.']
  ];

  function rows(list, keyFn) {
    return list.map(function (r) {
      var k = keyFn ? keyFn(r) : r[0], a = typeof r[1] === 'function' ? r[1]() : r[1];
      return '<div class="pp-qr"><span class="k">' + k + '</span><span class="ans">' + fm(a) + '</span></div>';
    }).join('');
  }
  function block(num, name, hint, body) {
    return '<div class="pp-q"><h4><span class="pp-qn">' + num + '</span>' + name + (hint ? '<small>' + hint + '</small>' : '') + '</h4>' + body + '</div>';
  }

  function render() {
    var root = document.getElementById('pp4-root'); if (!root) { return; }
    var h = '<section class="note-section pp-cheat">' +
      '<div class="lesson-header-block"><span class="lesson-header-icon">📌</span><div><h2>Probeklausur: что запомнить — основа твоей шпаргалки</h2>' +
      '<p class="lesson-header-sub">7 главных вещей · правила · порядок · 14 заданий в одну строку · 12 ловушек · слова эффекта · 5 путей в меню</p></div></div>';

    h += '<div class="note-card"><h3>✍️ Как сделать шпаргалку</h3><ol class="pp-loop">' +
      '<li>Возьми <b>один лист A4</b>. Блоки ①–⑥ ниже — это его содержимое: сторона 1 — ①②③, сторона 2 — ④⑤⑥.</li>' +
      '<li><b>Перепиши от руки</b>, своими словами и короче. Само переписывание уже запоминает. Не копируй всё подряд: сначала возьми то, что отмечено в блоке «7 главных вещей».</li>' +
      '<li>Через час закрой страницу и <b>воспроизведи лист по памяти</b> на чистой бумаге. Что забыл, допиши другим цветом: это и есть слабые места.</li></ol>' +
      '<div class="pp-box"><p><b>Можно ли брать шпаргалку на контрольную</b>, решает учитель, спроси его. В Aufgabenblatt написано: PowerPoint разрешён, интернет и KI нет. Если нельзя, лист всё равно работает как конспект, который ты выучиваешь.</p></div>' +
      '<p class="pp-small">Это моя выжимка из заданий учителя и файла LUMIO; выбор главного и разметка заданий мои. Настоящая работа, скорее всего, будет про другую фирму и другие слайды, но с <b>теми же типами задач</b>.</p></div>';

    h += '<div class="note-card pp-top"><h3>⭐ Если запомнишь только 7 вещей</h3>' + TOP.map(function (t, i) {
      return '<div class="pp-topi"><span class="pp-qn">' + (i + 1) + '</span><div><p>' + fm(t[0]) + '</p><small>Почему: ' + fm(t[1]) + '</small></div></div>';
    }).join('') + '</div>';

    h += '<div class="note-card pp-sheet"><h3>📄 Шпаргалка по блокам</h3>' +
      '<div class="pp-tools"><label class="pp-sw"><input type="checkbox" id="pp4-cover"> <span><b>Проверь себя:</b> закрыть правую колонку и вспоминать (клик по размытому — открыть)</span></label>' +
      '<button type="button" class="pp-print" id="pp4-print">🖨 Печать</button></div>' +
      '<div class="pp-qgrid">' +
      block('①', 'Правила и оценка', '', rows(Q1)) +
      block('②', 'Порядок и время', 'в скобках — минуты по плану', rows(Q2)) + '</div>' +
      block('③', '14 заданий: главное действие', 'в скобках — баллы', rows(Q3, function (r) { return '<b>' + r[0] + '</b> · ' + title(r[0]) + ' <small>(' + pts(r[0]) + ')</small>'; })) +
      block('④', '12 ловушек из файла', 'ловушка → что делать', rows(Q4)) +
      '<div class="pp-qgrid">' + block('⑤', 'Слова эффекта', 'что значит формулировка → что делать', rows(Q5)) +
      block('⑥', '5 путей в меню', 'подробнее с кадрами: карточка «Начни здесь»', rows(Q6)) + '</div></div>';

    h += '<div class="note-card"><h3>🔗 Дальше</h3><div class="pp-sl"><a href="#pp1">Начни здесь: 5 навыков с кадрами</a> · <a href="#pp2">Probeklausur: 14 заданий с решением</a> · <a href="#pp3">Trainer: квиз «Wo klicke ich?»</a></div></div></section>';

    root.innerHTML = h;
    var box = root.querySelector('.pp-cheat'), cov = root.querySelector('#pp4-cover');
    cov.addEventListener('change', function () {
      box.classList.toggle('cover', cov.checked);
      Array.prototype.forEach.call(box.querySelectorAll('.ans.on'), function (a) { a.classList.remove('on'); });
    });
    box.addEventListener('click', function (e) {
      var a = e.target.closest('.ans'); if (a && box.classList.contains('cover')) { a.classList.toggle('on'); }
    });
    root.querySelector('#pp4-print').addEventListener('click', function () { window.print(); });
    if (location.hash === '#pp4') { var h2 = root.querySelector('h2'); if (h2) { document.title = h2.textContent.trim() + ' | NeoStudy'; } }
  }
  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', render); } else { render(); }
})();
