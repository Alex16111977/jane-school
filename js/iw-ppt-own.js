/* PowerPoint-Klassenarbeit — Übung an der EIGENEN Präsentation „Schulbeginn“ (Karte pp5).
   Datei: Schulbeginn_Projekt_Design_Folie11_korrigiert.pptx (12 Folien, Projekt „Soll die Schule später beginnen?“, von Ariana und Yevheniia).
   Alle Befunde unter „state“ / P.OWN.find sind aus dem Inhalt der Datei (XML) gelesen. Aufgaben, Punkte und Beispiel-Bilder sind MEINE (nicht vom Lehrer).
   Achtung: P.C ist in iw-ppt-mocks.js schon die Farbtabelle → dieser Satz heißt P.OWN. */
window.PPT = window.PPT || {};
(function (P) {
  var BG = '#F7F9FC', B1 = '#206493', B2 = '#183A57', B3 = '#325F7E', TX = '#2D3945', HINT = '#FB923C', RED = '#ef4444', VIO = '#a855f7';

  /* ---------------------------------------------------------------- Befunde (alles in der Datei nachgeprüft) */
  var FIND = [
    ['🧱 Полоска слева лежит <b>12 раз</b>: по отдельной копии на каждом слайде', 'Сменишь цвет — делай это 12 раз; пропустишь одну — слайды станут разными', ['C2']],
    ['🔢 Номера «1 / 12 … 12 / 12» — <b>напечатанный текст</b>, а не поле', 'Передвинешь слайд — номер на нём остаётся старым и врёт', ['C3']],
    ['🔤 Шрифт <b>Aptos</b> вписан вручную (44 раза в тексте), а шрифт темы — Calibri', 'Если Aptos в программе нет (старый Office), шрифт подменится и вёрстка поплывёт', ['C4']],
    ['🎨 Все цвета — <b>числа RGB</b> (#206493, #183A57, #325F7E, #2D3945), в палитре темы их нет', 'Одним кликом дизайн не сменить; на контрольной цвета берут из Designfarben или по заданным RGB', ['C5']],
    ['• <b>44 маркера «•»</b> напечатаны символом; на слайде 9 цифры «1.–4.» тоже', 'Перенесённая строка уезжает под точку, уровней списка нет', ['C6']],
    ['📐 Левые края: заголовок <b>2,16</b> · номер <b>2,29</b> · текст <b>2,67</b> см (на титуле подзаголовок и автор — 2,54)', 'Взгляд видит «неровно» — именно это проверяет Ausrichten', ['C7']],
    ['🧩 Все 12 слайдов на макете «Blank»; заголовки — обычные текстовые поля, не Titel-Platzhalter', 'Нет структуры (в Gliederung пусто); макеты не используются', ['C11']],
    ['📏 Мастер и макеты сделаны под <b>4:3</b>, слайд — 16:9 (33,87 см)', 'Новые поля (номер, заголовок) встают не там; справа ≈ 9,7 см пустые', ['C3', 'C11']],
    ['🖼️ <b>Ни одной</b> картинки, иконки, таблицы, SmartArt, ссылки, перехода, анимации', '12 слайдов «заголовок + маркеры» — нет Wirkung (эффекта)', ['C8', 'C9', 'C10', 'C11', 'C12', 'C13', 'C14']]
  ];

  /* ---------------------------------------------------------------- Aufgaben (Stil des Lehrers; Punkte und Aufteilung — meine Schätzung) */
  var TASKS = [
    { n: 'C1', show: 'own_c1', title: 'Datei sichern: Speichern unter', pts: 2, mins: 2, slides: 'Datei', kann: ['x7'],
      orig: 'Öffnen Sie die Datei <b>Schulbeginn_Projekt_Design_Folie11_korrigiert.pptx</b> und speichern Sie sie <b>sofort</b> als Kopie unter dem Namen <b>PK_PPT_Klasse_Nachname_Vorname.pptx</b>. Arbeiten Sie nur in dieser Kopie und speichern Sie nach jeder Aufgabe.',
      state: ['Оригинал: 12 слайдов, 33,87 × 19,05 см (16:9), ≈ 62 КБ.'],
      steps: ['{{Datei → Speichern unter}} → Ordner wählen → Name aus dem Generator oben eintragen → Typ bleibt PowerPoint-Präsentation (*.pptx) → **Speichern**.',
        'Kontrolle: oben im Fenster steht jetzt der **neue** Name, nicht Schulbeginn_… — sonst arbeitest du noch im Original.',
        'Danach nach jeder Aufgabe [[Strg]]+[[S]].'],
      eh: [['Dateiname genau nach Muster PK_PPT_Klasse_Nachname_Vorname.pptx', 1], ['Original unverändert, gearbeitet nur in der Kopie', 1]] },

    { n: 'C2', show: 'own_c2', title: 'Zwölf Streifen → ein Streifen im Folienmaster', pts: 6, mins: 8, slides: 'alle Folien', kann: ['x2', 'k13'],
      orig: 'Der blaue Streifen am linken Rand wurde auf jeder Folie einzeln eingefügt. Legen Sie ihn so an, dass er <b>nur einmal</b> im Folienmaster (Layout „Leer“) liegt und automatisch auf <b>allen zwölf Folien</b> erscheint. Entfernen Sie die zwölf Einzelkopien.',
      state: ['На каждом из 12 слайдов лежит свой прямоугольник «Rectangle 1»: 0,46 × 19,05 см, позиция 0 / 0, заливка RGB 32/100/147 (#206493), без контура.',
        'Все 12 слайдов используют один макет — в файле он называется «Blank» (в немецком PowerPoint может быть «Leer»).'],
      steps: ['Folie 2: Streifen anklicken → [[Strg]]+[[X]] (ausschneiden).',
        '{{Ansicht → Folienmaster}} → links in der Liste das Layout **Blank / Leer** anklicken (beim Darüberfahren steht, von welchen Folien es benutzt wird) → [[Strg]]+[[V]]. Der Streifen steht wieder ganz links, volle Höhe.',
        '{{Folienmaster → Masteransicht schließen}}.',
        'Auf **Folie 1 und 3–12** den alten Streifen anklicken → [[Entf]]. Den Streifen aus dem Master kannst du auf der Folie **nicht** anklicken — daran erkennst du, dass er richtig im Master liegt.',
        'Test: {{Start → Neue Folie}} → die neue Folie hat den Streifen sofort, ohne Kopieren. Danach Folie wieder löschen.'],
      traps: ['Fehlt der Streifen auf einer Folie: im Master das Layout anklicken → {{Folienmaster}} → Kästchen „Hintergrundgrafiken ausblenden“ darf **nicht** angehakt sein.',
        'Ob die Kopie beim Einfügen in den Master wirklich bei 0 / 0 landet, sieht man sofort: sitzt sie schief, {{Formformat → Größe}} prüfen (Breite 0,46 · Höhe 19,05) und Position im Fenster „Form formatieren“.'],
      eh: [['Streifen liegt im Master/Layout (auf der Folie nicht anklickbar)', 2], ['Auf allen 12 Folien sichtbar, links, volle Höhe', 1], ['Alle zwölf Einzelkopien gelöscht (Auswahlbereich zeigt kein „Rectangle 1“)', 2], ['Neue Folie bekommt den Streifen automatisch', 1]] },

    { n: 'C3', show: 'own_c3', title: 'Foliennummern: Feld statt getippter Zahl', pts: 6, mins: 8, slides: 'alle Folien', kann: ['x3', 'k2'],
      orig: 'Die Foliennummern sollen sich <b>automatisch</b> zählen (Funktion „Foliennummer“, keine getippten Zahlen), <b>unten rechts</b> stehen und auf der Titelfolie nicht erscheinen. Verschieben Sie außerdem die Folie „Unsere Schritte“ <b>hinter die Titelfolie</b>, damit der Überblick vor dem ersten Schritt steht.',
      state: ['На слайдах 1–12 стоят напечатанные текстовые поля «1 / 12» … «12 / 12» (x = 2,29 см, внизу слева): это просто текст, а не поле номера.',
        'Мастер сделан под 4:3: поле номера стоит на x = 18,2–24,1 см, а слайд шириной 33,87 см → настоящий номер сначала появится примерно посередине, а не справа.',
        'Порядок сейчас: 1 Titel · 2 «1. Das Anliegen definieren» · 3 «Unsere Schritte» · … Моё мнение: обзор («Unsere Schritte») лучше поставить перед шагом 1 — заодно тренировка Folien verschieben (k2).'],
      steps: ['**Сначала увидеть проблему:** {{Ansicht → Foliensortierung}} → слайд 3 «Unsere Schritte» перетащи на место 2. Открой его: внизу всё ещё «3 / 12», а слайд уже второй — напечатанная цифра врёт. Вот зачем нужно поле.',
        'Alte getippte Nummern löschen: auf jeder Folie das Feld „n / 12“ anklicken (am **Rand**) → [[Entf]] (12×).',
        '{{Einfügen → Foliennummer}} → Fenster „Kopf- und Fußzeile“, Reiter „Folie“: ☑ Foliennummer, ☑ Auf Titelfolie nicht anzeigen → **Für alle übernehmen**.',
        '{{Ansicht → Folienmaster}} → oberste Folie → Feld mit „‹#›“ nach unten **rechts** ziehen (das Feld ist 5,93 cm breit; sein rechter Rand soll etwa 2 cm vor dem Folienrand liegen, also x ≈ 26 cm), Text rechtsbündig → Masteransicht schließen. Wandert die Nummer auf den Folien nicht mit: dasselbe Feld im Layout Blank / Leer verschieben.',
        'Folie 1 prüfen. Das Kästchen „Auf Titelfolie nicht anzeigen“ wirkt nur bei Folien mit dem Layout „Titelfolie“. Bei dir haben **alle** Folien das Layout Blank, deshalb steht die Nummer auf Folie 1 wahrscheinlich trotzdem. Dann: Nummer auf Folie 1 anklicken → [[Entf]].'],
      traps: ['Getippte Zahl statt Feld = Punktabzug. Test: beim Verschieben ändert sie sich nicht.', 'Das Feld „‹#›“ im Master **nicht** überschreiben, sonst ist es weg.'],
      eh: [['Keine getippten Nummern mehr (Feld, ändert sich beim Verschieben)', 2], ['Nummer unten rechts auf Folien 2–12', 1], ['Auf der Titelfolie keine Nummer', 1], ['„Unsere Schritte“ steht an Position 2', 2]] },

    { n: 'C4', show: 'own_c4', title: '★ Schrift: Aptos → Calibri, Titel gleich, Folie 11 angleichen', pts: 10, mins: 8, slides: 'alle Folien · Folie 11', kann: ['x4', 'x5', 'k5'],
      orig: 'In der Präsentation soll durchgehend die Schriftart des Designs (<b>Calibri</b>) verwendet werden. Ersetzen Sie die Schriftart <b>Aptos</b> in der gesamten Präsentation. Alle Folientitel erhalten dieselbe Formatierung (<b>40 pt, fett</b>). Folie 11 muss genauso aussehen wie die anderen Folien.',
      state: ['Шрифт «Aptos» вписан в текст слайдов 2–11 (44 абзаца) и в абзацные настройки заголовков; шрифт темы — Calibri / Calibri.',
        'Размеры в файле «кривые»: заголовки 37 pt, маркеры 19 pt, надпись «n / 12» — 18 pt (по умолчанию).',
        'Оформление заголовков (37 pt, жирный, цвет) записано в «абзацных настройках по умолчанию», а не в самом тексте. У слайда 11 этих настроек нет вообще, поэтому он может выглядеть иначе, чем 2–10 (зависит от программы). **Посмотри на своём экране:** отличается ли слайд 11 от слайда 10?'],
      steps: ['{{Start → Ersetzen ▾ → Schriftarten ersetzen}} → **Ersetzen:** Aptos → **Ersetzen durch:** Calibri → **Ersetzen**. Ein Klick für alle 12 Folien.',
        'Folie 10: Titel anklicken, Text markieren ([[Strg]]+[[A]] im Textfeld) → {{Start → Schriftgrad}} **40** → Button **Fett**.',
        '{{Start → Format übertragen}} — **Doppelklick** auf den Pinsel (er bleibt aktiv) → in der Folienleiste links Folie 11 anklicken → Titel anklicken → nächste Folie → Titel … bis alle Titel gleich sind. [[Esc]] beendet.',
        'Text auf Folie 11: einen Absatz auf Folie 10 markieren → Format übertragen → alle Absätze auf Folie 11 überfahren.',
        'Kontrolle: {{Ansicht → Foliensortierung}} — Folie 10 und 11 nebeneinander: Titel gleich groß, gleiche Schrift, gleiche Farbe.'],
      traps: ['Format übertragen kopiert Schriftart, Größe, Farbe, Fett — nicht den Text. In den Text **klicken**, nicht nur den Rand.', 'Schriftarten ersetzen ändert nur die Schriftart, nicht die Größe.'],
      eh: [['Aptos nirgends mehr (Schriftarten ersetzen durchgeführt)', 3], ['Alle Titel: gleiche Schrift, 40 pt, fett', 3], ['Folie 11 sieht aus wie Folie 10 (Titel und Aufzählung)', 3], ['Format übertragen benutzt (Doppelklick → mehrere Ziele)', 1]] },

    { n: 'C5', show: 'own_c5', title: '★ Farben: Corporate-Blau als RGB, Rest aus den Designfarben', pts: 10, mins: 8, slides: 'Titel · Streifen · Text', kann: ['x6', 'k8'], html: 'own_rgb',
      orig: 'Das Corporate Design der Präsentation verwendet <b>Dunkelblau RGB 24 / 58 / 87</b> für alle Folientitel und <b>Blau RGB 32 / 100 / 147</b> für den Streifen. Setzen Sie diese Farben exakt ein. Der Fließtext soll eine Farbe aus den <b>Designfarben</b> erhalten.',
      state: ['Все цвета в файле — прописанные RGB: заголовки #183A57 (24/58/87), полоска #206493 (32/100/147), подзаголовок #325F7E, текст #2D3945, фон #F7F9FC.',
        'Тема — старая «Office» (Akzent 1 = #4F81BD, Dunkelblau = #1F497D). Верхний ряд Designfarben слева направо: Hintergrund 1 (белый) · Text 1 (чёрный) · Hintergrund 2 · Text 2 (тёмно-синий) · Akzent 1–6. Цветов твоей презентации в нём нет.'],
      steps: ['Titel auf Folie 2 markieren → {{Start → Schriftfarbe ▾ → Weitere Farben → Benutzerdefiniert}} → **Rot** 24 · **Grün** 58 · **Blau** 87 → OK.',
        'Auf alle Titel übertragen: {{Format übertragen}} (Doppelklick) wie in C4 — oder bei jedem Titel dieselben drei Zahlen.',
        'Streifen: {{Ansicht → Folienmaster}} → Streifen anklicken → {{Formformat → Formfüllung ▾ → Weitere Füllfarben → Benutzerdefiniert}} → 32 · 100 · 147 (in älteren Versionen heißt der Button „Fülleffekt“).',
        'Fließtext: Text markieren → {{Schriftfarbe ▾}} → **oberste Reihe „Designfarben“**, zweites Quadrat von links (Schwarz, Text 1).',
        'Bonus (Königsweg): {{Entwurf → Varianten → Farben → Farben anpassen}} → Text/Hintergrund – Dunkel 2 = 24/58/87, Akzent 1 = 32/100/147 → Speichern. Jetzt stehen beide Blautöne im Farbmenü, und ein Klick darauf färbt jede Stelle gleich.'],
      traps: ['Die Zahlen in die richtigen Felder: **Rot, Grün, Blau** — nicht Farbton / Sättigung (anderer Reiter).', 'Prüfen: Titel markieren → Schriftfarbe → Weitere Farben → Benutzerdefiniert zeigt dieselben drei Zahlen.'],
      eh: [['Alle Titel RGB 24/58/87 (Schriftfarbe → Weitere Farben prüfen)', 3], ['Streifen RGB 32/100/147 (im Master geändert)', 2], ['Fließtext aus der obersten Reihe der Designfarben', 2], ['Keine „zufälligen“ Farbtöne mehr — alles gleich auf allen Folien', 3]] },

    { n: 'C6', show: 'own_c6', title: 'Aufzählung: echte Zeichen statt getippter Punkte', pts: 6, mins: 6, slides: 'Folien 2–11', kann: ['k6', 'k7'],
      orig: 'Die Aufzählungen bestehen aus getippten Punkten („•“) und getippten Zahlen. Wandeln Sie sie in <b>echte Aufzählungszeichen bzw. eine Nummerierung</b> um. Auf der Folie „Unsere mögliche Aktion“ gehört der fünfte Punkt als <b>Unterpunkt</b> unter die vier Schritte.',
      state: ['44 маркера «•» напечатаны символом + два пробела прямо в тексте абзацев (слайды 2–11).',
        'Слайд «Unsere mögliche Aktion»: цифры «1.–4.» напечатаны, а пятый пункт («Schulleitung und Schulträger stimmen sich ab») стоит на одном уровне с шагами.'],
      steps: ['Einen getippten Punkt samt Leerzeichen markieren → [[Strg]]+[[C]] → {{Start → Ersetzen}} ([[Strg]]+[[H]]) → **Suchen nach:** [[Strg]]+[[V]] → **Ersetzen durch:** leer lassen → **Alle ersetzen**. Ein Klick entfernt alle 44 Punkte.',
        'Pro Folie: Textfeld anklicken (Rand!) → {{Start → Aufzählungszeichen}}. Jetzt hängt umbrochener Text unter dem **Text**, nicht unter dem Punkt.',
        '„Unsere mögliche Aktion“: getippte „1. “ bis „4. “ löschen → die vier Zeilen markieren → {{Start → Nummerierung}}.',
        'Fünften Absatz: Aufzählungszeichen einschalten, Cursor an den Anfang → [[Tab]] (eine Ebene tiefer). Zurück mit [[Umschalt]]+[[Tab]].'],
      traps: ['Erst die getippten Zeichen löschen, dann das echte Zeichen einschalten — sonst steht „• •  Text“ da.'],
      eh: [['Keine getippten „•“ mehr (44 entfernt)', 2], ['Echte Aufzählungszeichen auf den Folien 2–11', 2], ['Aktionsfolie: echte Nummerierung 1–4', 1], ['Fünfter Punkt eine Ebene tiefer', 1]] },

    { n: 'C7', show: 'own_c7', title: '★ Ausrichten: gleiche linke Kante', pts: 12, mins: 10, slides: 'Titelfolie · Folie 2', kann: ['k14', 'k4'], mock: ['sbA0', 'sbA1'],
      orig: 'Auf der Titelfolie und auf Folie 2 beginnen Titel, Text und Nummer an unterschiedlichen Stellen. Richten Sie die Objekte so aus, dass alle <b>linken Kanten genau untereinander</b> liegen. Auf der Titelfolie sollen die drei Textfelder außerdem <b>gleichmäßig verteilt</b> sein.',
      state: ['Folie 2: Titel x = 2,16 см · Nummer 2,29 см · Text 2,67 см — три разные левые кромки (разница до 0,51 см).',
        'Титульный слайд: заголовок 2,16 · подзаголовок 2,54 · «von Ariana und Yevheniia» 2,54 · номер 2,29.',
        'Ширина рамок тоже разная: заголовок 29,97 · текст 28,7 · номер 25,4 см.'],
      steps: ['Folie 2: Titel anklicken → [[Umschalt]] gedrückt halten → Textfeld anklicken → Foliennummer-Feld anklicken (alle drei markiert).',
        '{{Formformat → Ausrichten → Links ausrichten}} — alle drei springen an die linkeste Kante (2,16). Vorher im Menü prüfen: **Ausgewählte Objekte ausrichten** ist gewählt, nicht „An Folie ausrichten“.',
        'Gleich breit machen: Titel und Text markieren → {{Formformat → Größe → Breite}} 30 cm (bei beiden dieselbe Zahl).',
        'Titelfolie: drei Textfelder markieren → {{Ausrichten → Links ausrichten}} → dann {{Ausrichten → Vertikal verteilen}} (gleiche Abstände).',
        'Kontrolle: {{Ansicht → Führungslinien}} einschalten — Titel und Text beginnen an derselben Linie. Alle Textfelder haben denselben inneren Rand, deshalb stehen auch die Texte genau untereinander.'],
      traps: ['Objekte „nach Augenmaß“ ziehen reicht nicht — Ausrichten per Button, dann stimmen die Zahlen genau.', 'Verteilen geht erst ab drei markierten Objekten.', 'Hier nur Folie 1 und 2. Bei den anderen zehn Folien wäre die Arbeit dieselbe.'],
      eh: [['Folie 2: Titel, Text, Nummer — gleiche linke Kante', 4], ['Folie 2: Titel und Text gleich breit', 2], ['Titelfolie: Titel, Untertitel, Autor links bündig', 3], ['Titelfolie: vertikal gleichmäßig verteilt', 2], ['Ausrichten per Button gemacht (nicht per Augenmaß)', 1]] },

    { n: 'C8', show: 'own_c8', title: '★ Folie „Aktuelle Situation“: Zahlenkarten + gruppieren', pts: 12, mins: 12, slides: 'Folie 4 (Aktuelle Situation)', kann: ['k13', 'k14', 'k16', 'k17'], mock: ['sbCards'],
      orig: 'Auf der Folie „Aktuelle Situation“ stehen die wichtigsten Zahlen als Fließtext. Stellen Sie <b>vier Zahlen als gleich große Karten</b> dar (große Zahl, darunter eine kurze Beschriftung). Die Karten stehen <b>auf einer Höhe</b> mit <b>gleichen Abständen</b>; jede Karte ist <b>gruppiert</b>.',
      state: ['Folie 4: 5 getippte Zeilen — Beginn 8:00 Uhr (Schule) · NRW 7:30 bis 9:00 Uhr · Kalifornien ab 8:30 Uhr · Jugendliche 8–10 Stunden Schlaf · Beispiel 23:00–6:30 Uhr = 7,5 Stunden.',
        'Кроме текста и полоски на слайде нет ни одной фигуры.'],
      steps: ['{{Einfügen → Formen → Rechteck: abgerundete Ecken}} (früher „Abgerundetes Rechteck“) → aufziehen, dann {{Formformat → Größe}}: Breite 6,6 · Höhe 6,2 cm. Füllung weiß, Kontur Blau 32/100/147, 2 pt.',
        '{{Einfügen → Textfeld}} → über die Karte ziehen, zwei Absätze: „8:00 Uhr“ (32 pt, fett, Blau) · [[Enter]] · „Unsere Schule“ (18 pt).',
        'Karte und Textfeld markieren ([[Umschalt]]+Klick) → {{Ausrichten → Horizontal zentrieren}} → {{Formformat → Gruppieren → Gruppieren}}. Prüfung: ein Klick zeigt **einen** Rahmen um die ganze Karte.',
        'Gruppe 3× duplizieren: markieren → [[Strg]]+[[D]] → die Texte der drei anderen Karten ändern (in die Gruppe klicken, dann noch einmal in den Text).',
        'Alle vier Gruppen markieren → {{Ausrichten → Oben ausrichten}} → {{Ausrichten → Horizontal verteilen}}.',
        'Den alten Fließtext löschen; die Zeile „Beispiel: 23:00–6:30 Uhr = 7,5 Stunden“ als Hinweis unter die Karten setzen.'],
      traps: ['Verteilen braucht mindestens drei Objekte. Gruppen zählen als **ein** Objekt — deshalb erst gruppieren, dann ausrichten.', 'Duplizieren legt die Kopie leicht versetzt ab — danach immer Oben ausrichten.', 'Neue Farben nur Corporate-Blau und Weiß, keine fünfte Farbe.'],
      eh: [['Vier Karten, gleich groß (Höhe und Breite identisch)', 2], ['Zahl groß, Beschriftung klein — die Zahl ist der Blickfang', 2], ['Jede Karte gruppiert (ein Rahmen beim Klick)', 3], ['Oben ausgerichtet + gleichmäßig horizontal verteilt', 3], ['Farben: nur Corporate-Blau und Weiß', 1], ['Alter Fließtext entfernt, Beispielzeile bleibt als Hinweis', 1]] },

    { n: 'C9', show: 'own_c9', title: 'Folie „Vorteile“: Piktogramm im Kreis, gruppiert', pts: 6, mins: 10, slides: 'Folie 5 (Vorteile eines späteren Beginns)', kann: ['k12', 'k16', 'k14'], mock: ['sbIcons'],
      orig: 'Zeigen Sie auf der Folie „Vorteile eines späteren Beginns“ <b>die ersten vier Vorteile</b> als vier Spalten: je ein <b>weißes Piktogramm in einem blauen Kreis</b> (gleich groß), darunter der Vorteil als Text. Kreis und Piktogramm sind gruppiert; alle vier Spalten stehen auf einer Höhe.',
      state: ['Folie 5: ein Textfeld mit 5 Zeilen — Mehr Zeit zum Schlafen · Bessere Aufmerksamkeit · Weniger Stress am Morgen · Schulweg im Winter heller · Schlafmedizin: Beginn nicht vor 8:30 Uhr.', 'Piktogramme im Dokument: keine.'],
      steps: ['{{Einfügen → Formen → Oval}}: beim Aufziehen [[Umschalt]] gedrückt halten (= Kreis) → Größe 3 × 3 cm, Füllung Blau 32/100/147, Kontur **keine**.',
        '{{Einfügen → Piktogramme}} → suchen (Bett · Zielscheibe · Uhr · Sonne) → Einfügen → Größe ≈ 1,6 cm → {{Grafikformat → Grafikfüllung → Weiß}}.',
        'Piktogramm auf den Kreis schieben → beide markieren → {{Ausrichten → Horizontal zentrieren}} und {{Vertikal zentrieren}} → {{Gruppieren}}.',
        'Gruppe 3× duplizieren ([[Strg]]+[[D]]), Piktogramme austauschen. Darunter je ein Textfeld (18–20 pt) mit dem Vorteil, mittig unter dem Kreis.',
        'Alle vier Gruppen markieren → {{Oben ausrichten}} → {{Horizontal verteilen}}. Den fünften Punkt (Schlafmedizin) als kleine Zeile darunter lassen.'],
      traps: ['Die Piktogramm-Bibliothek lädt aus dem Internet. In der Prüfung ohne Internet nimmst du Piktogramme, die **schon in der Datei liegen**: kopieren ([[Strg]]+[[C]], [[Strg]]+[[V]]) und umfärben. Heute zu Hause mit Internet üben geht.',
        'Weiß auf Weiß: Zuerst den Kreis, dann das Piktogramm umfärben — sonst sieht man nichts.'],
      eh: [['Vier Kreise gleich groß, Piktogramme weiß', 2], ['Kreis und Piktogramm gruppiert', 2], ['Vier Spalten oben ausgerichtet + verteilt, Text mittig unter dem Kreis', 2]] },

    { n: 'C10', show: 'own_c10', title: '★ Titelfolie: Foto einfügen und zuschneiden', pts: 8, mins: 8, slides: 'Titelfolie', kann: ['k9', 'k10', 'k11'],
      orig: 'Fügen Sie auf der Titelfolie rechts ein <b>Foto</b> ein (z. B. Schulweg am Morgen). Das Foto soll <b>quadratisch zugeschnitten</b> sein, das Motiv in der Mitte, mit schmalem <b>Rahmen in Corporate-Blau</b>. Es darf Titel und Untertitel nicht überdecken.',
      state: ['Картинок в файле нет ни на одном слайде (в файле нет папки media).', 'Рамки заголовка и подзаголовка на титуле тянутся почти на всю ширину слайда (≈ 30 см); текст короткий, но рамки лучше сузить, чтобы фото не лежало поверх рамки.'],
      steps: ['Titel, Untertitel und Autor: Rahmen anklicken → {{Formformat → Größe → Breite}} 18 cm.',
        '{{Einfügen → Bilder → Dieses Gerät}} → Foto auswählen (Handyfoto geht) → Einfügen.',
        '{{Bildformat → Zuschneiden ▾ → Seitenverhältnis → 1:1}} → Motiv im Rahmen verschieben → zum Beenden irgendwo ins Leere klicken.',
        'Größe: nur an der **Ecke** ziehen (Proportionen bleiben) oder {{Bildformat → Größe → Höhe}} 12 cm. Position: rechts, Oberkante auf Höhe des Titels.',
        '{{Bildformat → Bildrahmen}} → unten der Eintrag für weitere Farben (Name je nach Version) → Benutzerdefiniert → 32 · 100 · 147; dann {{Bildrahmen → Stärke}} 2¼ pt.',
        'Wirkung (optional): {{Zuschneiden ▾ → Auf Form zuschneiden → Oval}} — nach 1:1 entsteht ein Kreis.'],
      traps: ['Nie an einem **seitlichen** Ziehpunkt vergrößern — das Foto wird verzerrt. Nur an den Ecken.', 'Zuschneiden ist nicht Verkleinern: der Rest des Bildes bleibt in der Datei, nur unsichtbar.'],
      eh: [['Foto eingefügt, Proportionen nicht verzerrt (an der Ecke gezogen)', 2], ['Quadratisch zugeschnitten (1:1), Motiv mittig', 2], ['Rahmen Blau 32/100/147, schmal', 2], ['Foto überdeckt weder Titel noch Untertitel (Rahmen verkleinert)', 2]] },

    { n: 'C11', show: 'own_c11', title: 'Neue Folie „Vorteile und Nachteile“: Tabelle', pts: 6, mins: 8, slides: 'neue Folie hinter Folie 6', kann: ['k2', 'k3', 'k18', 'k19'], mock: ['sbTable'],
      orig: 'Fügen Sie hinter der Folie „Nachteile und Probleme“ eine <b>neue Folie „Vorteile und Nachteile im Vergleich“</b> ein. Stellen Sie die Vorteile und die Nachteile in einer <b>Tabelle mit zwei Spalten</b> gegenüber. Die Kopfzeile ist hervorgehoben, beide Spalten gleich breit, die Schrift mindestens 18 pt.',
      state: ['Folien «Vorteile…» und «Nachteile…» — два отдельных списка по 4–5 пунктов: сравнить их глазами нельзя.',
        'Мастер сделан под 4:3: если взять новый слайд с макетом «Title Only», заголовок встанет уже и левее, чем у остальных слайдов. Поэтому быстрее дублировать готовый слайд (k2).'],
      steps: ['In der Folienleiste links **Folie „Nachteile und Probleme“** rechtsklicken → **Folie duplizieren**. Auf der Kopie den Titel ändern: „Vorteile und Nachteile im Vergleich“; das Aufzählungs-Textfeld löschen.',
        '{{Einfügen → Tabelle}} → Raster **2 Spalten × 5 Zeilen** ziehen.',
        'Kopfzeile: „Vorteile“ | „Nachteile“. Darunter vier Zeilen in Kurzform aus den Folien davor (kopieren und kürzen: [[Strg]]+[[C]], [[Strg]]+[[V]]).',
        '{{Tabellenentwurf → Tabellenformatoptionen}}: ☑ Kopfzeile, ☑ Gebänderte Zeilen (in älteren Versionen „Optionen für Tabellenformat“). In {{Tabellenformatvorlagen}} eine mit blauer Kopfzeile wählen.',
        'Beide Spalten markieren → {{Layout → Zellengröße → Breite}} gleich (je 13 cm); {{Layout → Ausrichtung}}: links, vertikal mittig; Schrift 20 pt.'],
      traps: ['Weniger als 18 pt in der Tabelle — wird abgezogen („lesbar“).', 'Duplizieren ist hier schneller als „Neue Folie“: Streifen, Titel und Position stimmen schon.'],
      eh: [['Zwei Spalten × fünf Zeilen, Inhalte richtig zugeordnet', 2], ['Kopfzeile hervorgehoben (Tabellenformatoptionen)', 2], ['Spalten gleich breit, Schrift ≥ 18 pt', 1], ['Folie steht hinter „Nachteile“, Stil wie bei den anderen', 1]] },

    { n: 'C12', show: 'own_c12', title: 'Folie „Unsere mögliche Aktion“: SmartArt-Prozess', pts: 6, mins: 6, slides: 'Folie 9 (Unsere mögliche Aktion)', kann: ['k20', 'k21', 'k22'], mock: ['sbProc'],
      orig: 'Stellen Sie die <b>Schritte der Folie „Unsere mögliche Aktion“</b> als <b>SmartArt-Prozess</b> dar. Der fünfte Schritt „Schulleitung und Schulträger stimmen sich ab“ gehört dazu. Ändern Sie die Farben auf Corporate-Blau.',
      state: ['Folie 9: vier Schritte als Text (Vorschlag für 8:30 Uhr formulieren · der Schülervertretung vorstellen · Vorteile und Probleme besprechen · Beratung in der Schulkonferenz anregen) + ein fünfter Punkt (Schulleitung und Schulträger stimmen sich ab).', 'Notizen zu dieser Folie: 574 Zeichen — die Entscheidung trifft nicht die Schülervertretung allein.'],
      steps: ['Zuerst C6 (getippte „•  1.“ weg). Dann die Zeilen markieren → {{Start → In SmartArt-Grafik konvertieren → Weitere SmartArt-Grafiken}} → Kategorie **Prozess** → erste Grafik („Einfacher / Grundlegender Prozess“, Name je nach Version) → OK.',
        'Text ändern: links im Textbereich (Pfeil am Rahmen): [[Enter]] = neuer Schritt, [[Tab]] = Unterpunkt. Prüfe, dass alle **fünf** Schritte drin sind.',
        '{{SmartArt-Entwurf → Farben ändern}} → eine Variante in Akzent 1 (Blau); Formatvorlage schlicht lassen.',
        'Rahmen unter dem Titel, linke Kante wie der Titel (siehe C7).'],
      traps: ['Zu viel Text im SmartArt-Kästchen: Schritte auf Stichworte kürzen, die Details stehen in den Notizen.'],
      eh: [['SmartArt statt Textzeilen (Klick zeigt „SmartArt-Entwurf“)', 3], ['Fünf Schritte in richtiger Reihenfolge', 1], ['Farben passend (Blau), Text lesbar', 1], ['Linke Kante wie der Titel', 1]] },

    { n: 'C13', show: 'own_c13', title: 'Übergang für alle Folien + Animation der Vorteile', pts: 4, mins: 6, slides: 'alle Folien · Folie 5', kann: ['k23', 'k24', 'k25', 'x8'],
      orig: 'Alle Folien erhalten <b>denselben dezenten Übergang</b> (Dauer 0,7 s). Auf der Folie „Vorteile eines späteren Beginns“ sollen die Vorteile <b>nacheinander</b> erscheinen: der erste per Klick, die folgenden <b>nach vorheriger</b> Animation. Prüfen Sie das Ergebnis in der Bildschirmpräsentation.',
      state: ['Übergänge: keine. Animationen: keine. Hyperlinks: keine (in allen 12 Folien).'],
      steps: ['{{Übergänge → Verblassen}} → **Dauer** 00,70 → **Für alle übernehmen**. Unter jeder Folie in der Leiste erscheint ein kleines Sternchen.',
        'Folie „Vorteile“: Textfeld anklicken → {{Animationen → Verblassen}} (oder Erscheinen) → {{Effektoptionen → Nach Absatz}}.',
        '{{Animationen → Animationsbereich}} → Einträge 2–5 markieren → Start: **Nach Vorheriger**.',
        'Testen: [[F5]] von der ersten Folie ([[Umschalt]]+[[F5]] ab der aktuellen). Reihenfolge, Zeit, Übergang prüfen. [[Esc]] beendet.'],
      traps: ['Animationen und Übergänge sieht man **nur** in der Bildschirmpräsentation — im Bearbeitungsmodus passiert nichts.'],
      eh: [['Alle 12 Folien: gleicher Übergang, 0,7 s', 1], ['Vorteile erscheinen einzeln (Nach Absatz)', 1], ['Erster per Klick, die anderen „Nach Vorheriger“', 1], ['In der Bildschirmpräsentation getestet', 1]] },

    { n: 'C14', show: 'own_c14', title: 'Agenda mit Links und Zurück-Schalter', pts: 6, mins: 10, slides: 'neue Folie 2 · vier Schritt-Folien', kann: ['k26', 'k27', 'x8', 'k13'], mock: ['sbNav', 'sbNav2'],
      orig: 'Fügen Sie hinter der Titelfolie eine Folie „Agenda“ ein. Sie enthält die <b>vier Schritte</b> des Projekts als gleich große Schaltflächen. Jede Schaltfläche ist ein <b>Link</b> auf die jeweilige Folie. Auf den vier Schritt-Folien steht unten rechts ein Schalter „↩ Agenda“, der zurück zur Agenda führt.',
      state: ['Die vier Schritte stehen als Foliennamen in der Datei: „1. Das Anliegen definieren“ · „2. Informationsquellen suchen“ · „3. Möglichkeiten der Meinungsäußerung“ · „4. Öffentlichkeit schaffen“.',
        'Inhaltsverzeichnis / Links: keine. Beim Verschieben ändern sich die Foliennummern — deshalb **nach Titel** verlinken, nicht „Folie 7“.'],
      steps: ['Titelfolie anklicken → {{Start → Neue Folie}} (oder eine Folie duplizieren, dann stimmen Streifen und Titelposition); Titel „Agenda“.',
        'Vier Schaltflächen: {{Einfügen → Formen → Rechteck: abgerundete Ecken}}, Text „1  Das Anliegen definieren“ usw. Vier gleich groß, 2 × 2 angeordnet ([[Strg]]+[[D]], dann {{Ausrichten}} wie in C8).',
        'Link: Schaltfläche markieren → {{Einfügen → Link}} ([[Strg]]+[[K]]) → links **Aktuelles Dokument** (manchmal „Dieses Dokument“) → die passende Folie → OK.',
        'Zurück-Schalter: auf der Folie „1. Das Anliegen definieren“ ein kleines Rechteck „↩ Agenda“ unten rechts → Link auf „Agenda“. Schalter kopieren und auf den drei anderen Schritt-Folien einfügen ([[Strg]]+[[V]] behält die Position).',
        'Testen: [[F5]] → klicken. Im Bearbeitungsmodus öffnet ein Link nur mit [[Strg]]+Klick.'],
      traps: ['Link auf einen **Text** färbt ihn blau und unterstreicht ihn; Link auf eine **Form** lässt das Aussehen unverändert — für Schaltflächen die Form verlinken.'],
      eh: [['Agenda-Folie mit vier Einträgen, ausgerichtet', 1], ['Jeder Eintrag führt auf die richtige Folie (getestet)', 2], ['„↩ Agenda“-Schalter auf allen vier Schritt-Folien an derselben Stelle', 2], ['In der Bildschirmpräsentation getestet', 1]] }
  ];

  P.OWN = { file: 'Schulbeginn_Projekt_Design_Folie11_korrigiert.pptx', find: FIND, tasks: TASKS, star: ['C7', 'C4', 'C5', 'C8', 'C10'] };

  /* ---------------------------------------------------------------- Beispiel-Bilder: DEINE Folien nach dem Umbau (SVG, cm wie in der Datei) */
  function base(title, tx) {
    return [
      { t: 'rect', x: 0, y: 0, w: 33.87, h: 19.05, fill: BG },
      { t: 'rect', x: 0, y: 0, w: 0.46, h: 19.05, fill: B1 },
      { t: 'txt', x: tx == null ? 2.16 : tx, y: 1.65, w: 29.97, h: 3.43, html: title, pt: 37, b: 1, color: B2, pad: 0.25 }
    ];
  }
  function box(x, y, w, h, color) { return { t: 'rect', x: x, y: y, w: w, h: h, stroke: color || '#8da0b3', sw: 0.07, dash: true }; }
  function guide(x, color) { return { t: 'line', x1: x, y1: 0.3, x2: x, y2: 18.75, color: color, sw: 0.09 }; }
  var BUL = '•&nbsp;&nbsp;Unterricht beginnt bei uns um 8:00 Uhr<br>•&nbsp;&nbsp;Viele Schüler sind morgens müde<br>•&nbsp;&nbsp;Frage: Sollte die Schule später beginnen?<br>•&nbsp;&nbsp;Ziel: Vorteile und Probleme vergleichen';

  function align(fixed) {
    var tx = 2.16, bx = fixed ? 2.16 : 2.67, nx = fixed ? 2.16 : 2.29;
    var a = base('1. Das Anliegen definieren', tx);
    a.push(box(tx, 1.65, 29.97, 3.43));
    a.push({ t: 'txt', x: bx, y: 5.33, w: fixed ? 29.97 : 28.7, h: 11.68, html: BUL, pt: 19, color: TX, pad: 0.25 });
    a.push(box(bx, 5.33, fixed ? 29.97 : 28.7, 11.68));
    a.push({ t: 'txt', x: nx, y: 17.53, w: 25.4, h: 0.89, html: fixed ? '2' : '2 / 12', pt: 18, color: TX, pad: 0.25 });
    a.push(box(nx, 17.53, 25.4, 0.89));
    if (fixed) {
      a.push(guide(2.16, '#22c55e'));
      a.push({ t: 'txt', x: 17.8, y: 7.0, w: 14.4, h: 3.2, html: '✅ alle drei Kanten bei <b>2,16 cm</b><br>Titel · Text · Nummer', pt: 20, color: '#15803d', al: 'l', va: 'm' });
    } else {
      a.push(guide(2.16, HINT)); a.push(guide(2.29, RED)); a.push(guide(2.67, VIO));
      a.push({ t: 'txt', x: 17.8, y: 6.2, w: 14.4, h: 5.6, html: '<span style="color:' + HINT + '">▍Titel <b>2,16</b></span><br><span style="color:' + RED + '">▍Nummer <b>2,29</b></span><br><span style="color:' + VIO + '">▍Text <b>2,67</b> cm</span>', pt: 20, color: TX, va: 'm' });
    }
    return P.svg(a, fixed ? 'Folie 2 nachher: Titel, Text und Nummer beginnen alle bei 2,16 cm' : 'Folie 2 vorher: drei verschiedene linke Kanten 2,16 / 2,29 / 2,67 cm');
  }

  function cards() {
    var a = base('Aktuelle Situation'), D = [['8:00 Uhr', 'Unsere Schule'], ['7:30–9:00', 'Uhr — NRW (Sek. I/II) möglich'], ['ab 8:30 Uhr', 'Kalifornien (Highschools)'], ['8–10 Std.', 'Schlaf für 13–18-Jährige']], i, x;
    for (i = 0; i < 4; i++) {
      x = 2.16 + i * (6.6 + 1.1);
      a.push({ t: 'rect', x: x, y: 5.9, w: 6.6, h: 6.2, r: 0.5, fill: '#fff', stroke: B1, sw: 0.1 });
      a.push({ t: 'txt', x: x, y: 6.9, w: 6.6, h: 2.2, html: D[i][0], pt: 32, b: 1, color: B1, al: 'c', va: 'm' });
      a.push({ t: 'txt', x: x + 0.3, y: 9.3, w: 6.0, h: 2.2, html: D[i][1], pt: 18, color: TX, al: 'c' });
      if (i < 3) { a.push({ t: 'line', x1: x + 6.6, y1: 12.6, x2: x + 7.7, y2: 12.6, color: HINT, sw: 0.1 }); }
    }
    a.push({ t: 'txt', x: 2.16, y: 12.75, w: 29.5, h: 1.0, html: 'gleiche Abstände (Horizontal verteilen) · alle oben auf einer Höhe (Oben ausrichten)', pt: 14, b: 1, color: HINT });
    a.push({ t: 'txt', x: 2.16, y: 14.6, w: 29.5, h: 1.3, html: 'Beispiel: 23:00–6:30 Uhr = 7,5 Stunden Schlaf', pt: 19, color: TX, pad: 0.25 });
    return P.svg(a, 'Folie Aktuelle Situation nachher: vier gleich große Karten mit großer Zahl, oben ausgerichtet und gleichmäßig verteilt');
  }

  function proc() {
    var a = base('Unsere mögliche Aktion'), T = ['Vorschlag für 8:30 Uhr formulieren', 'Der Schüler&shy;vertretung vorstellen', 'Vorteile und Probleme besprechen', 'Beratung in der Schulkonferenz anregen', 'Schulleitung und Schulträger stimmen sich ab'], i, x;
    for (i = 0; i < 5; i++) {
      x = 2.16 + i * 6.1;
      a.push({ t: 'rect', x: x, y: 6.4, w: 5.0, h: 5.6, r: 0.4, fill: i === 4 ? B3 : B1 });
      a.push({ t: 'txt', x: x + 0.2, y: 6.4, w: 4.6, h: 5.6, html: T[i], pt: 16, b: 1, color: '#fff', al: 'c', va: 'm' });
      if (i < 4) { a.push({ t: 'poly', fill: B2, pts: [[x + 5.15, 8.6], [x + 5.95, 9.2], [x + 5.15, 9.8]] }); }
    }
    a.push({ t: 'txt', x: 2.16, y: 13.0, w: 29.5, h: 1.0, html: 'SmartArt „Prozess“ · Farbe aus Blau · fünf Schritte', pt: 14, b: 1, color: HINT });
    return P.svg(a, 'Folie Unsere mögliche Aktion nachher: fünf Schritte als SmartArt-Prozess mit Pfeilen');
  }

  function nav() {
    var a = base('Agenda'), T = ['1&nbsp;&nbsp;Das Anliegen definieren', '2&nbsp;&nbsp;Informationsquellen suchen', '3&nbsp;&nbsp;Möglichkeiten der Meinungsäußerung', '4&nbsp;&nbsp;Öffentlichkeit schaffen'], i, x, y;
    for (i = 0; i < 4; i++) {
      x = 2.16 + (i % 2) * 15.3; y = 5.6 + Math.floor(i / 2) * 5.5;
      a.push({ t: 'rect', x: x, y: y, w: 14.2, h: 4.4, r: 0.5, fill: B1 });
      a.push({ t: 'txt', x: x + 0.4, y: y, w: 13.4, h: 4.4, html: '<u>' + T[i] + '</u>', pt: 24, b: 1, color: '#fff', va: 'm' });
    }
    a.push({ t: 'txt', x: 2.16, y: 16.8, w: 29.5, h: 1.0, html: 'jede Fläche ist ein Link (Einfügen → Link → Aktuelles Dokument)', pt: 14, b: 1, color: HINT });
    return P.svg(a, 'Agenda-Folie: vier gleich große Schaltflächen als Links auf die Schritt-Folien');
  }

  function nav2() {
    var a = base('1. Das Anliegen definieren');
    a.push({ t: 'txt', x: 2.16, y: 5.33, w: 28.7, h: 8, html: BUL, pt: 19, color: TX, pad: 0.25 });
    a.push({ t: 'rect', x: 28.3, y: 16.9, w: 4.4, h: 1.3, r: 0.65, fill: '#fff', stroke: B1, sw: 0.1 });
    a.push({ t: 'txt', x: 28.3, y: 16.9, w: 4.4, h: 1.3, html: '↩ Agenda', pt: 16, b: 1, color: B1, al: 'c', va: 'm' });
    a.push({ t: 'rect', x: 27.9, y: 16.5, w: 5.2, h: 2.1, stroke: HINT, sw: 0.1, dash: true, r: 0.2 });
    a.push({ t: 'txt', x: 16.5, y: 16.55, w: 11.2, h: 2.0, html: 'Zurück-Schalter: auf allen vier Schritt-Folien an derselben Stelle', pt: 14, b: 1, color: HINT, al: 'r', va: 'm' });
    return P.svg(a, 'Schritt-Folie mit kleinem Zurück-Schalter Agenda unten rechts');
  }

  P.mocks = P.mocks || {};
  P.mocks.sbA0 = function () { return align(false); };
  P.mocks.sbA1 = function () { return align(true); };
  P.mocks.sbCards = cards;
  P.mocks.sbProc = proc;
  P.mocks.sbNav = nav;
  P.mocks.sbNav2 = nav2;
  P.mockCap = P.mockCap || {};
  P.mockCap.sbA0 = '❌ Vorher (Folie 2 deiner Datei, Maße aus der Datei): drei verschiedene linke Kanten — Titel 2,16 · Nummer 2,29 · Text 2,67 cm. Der Abstand Titel ↔ Text (0,51 cm) ist mit bloßem Auge zu sehen.';
  P.mockCap.sbA1 = '✅ Nachher: Titel, Text und Nummer markiert → Links ausrichten. Alle drei beginnen bei 2,16 cm.';
  P.mockCap.sbCards = 'Beispiel-Ergebnis (meine Gestaltung): vier gleich große Karten — große Zahl, kleine Beschriftung, oben ausgerichtet, gleichmäßig verteilt. Jede Karte ist eine Gruppe (Hintergrund + Textfeld).';
  P.mockCap.sbProc = 'Beispiel-Ergebnis (meine Gestaltung): die Schritte der Aktionsfolie als SmartArt-Prozess; der fünfte Schritt etwas heller.';
  P.mockCap.sbNav = 'Beispiel-Ergebnis (meine Gestaltung): Agenda mit vier gleich großen Flächen, jede mit Link auf den passenden Schritt.';
  P.mockCap.sbNav2 = 'Und auf jeder Schritt-Folie unten rechts der kleine Zurück-Schalter (Form mit Link auf „Agenda“).';
  /* Vorbilder aus der Übungsdatei LUMIO (nicht deine Folie) — gleicher Stil, andere Texte */
  P.mocks.sbIcons = function () { return P.mocks.m3(); };
  P.mocks.sbTable = function () { return P.mocks.m7(); };
  P.mockCap.sbIcons = 'Vorbild aus der Übungsdatei LUMIO (nicht deine Folie): Piktogramme weiß auf farbigen Kreisen, Kreis und Piktogramm gruppiert. So soll es bei dir aussehen — mit deinen vier Vorteilen und Blau 32/100/147.';
  P.mockCap.sbTable = 'Vorbild aus der Übungsdatei LUMIO (nicht deine Folie): Kopfzeile farbig, Zeilen abwechselnd hell/weiß. Bei dir: Kopfzeile „Vorteile | Nachteile“ in Blau.';

  /* ---------------------------------------------------------------- Bausteine in den Aufgaben (t.html) */
  P.extras = P.extras || {};
  P.extras.own_rgb = function () {
    var R = [['#183A57', 'Dunkelblau — Titel', [24, 58, 87], 'мало красного и зелёного, больше синего → тёмный синий'], ['#206493', 'Blau — Streifen', [32, 100, 147], 'зелёного и синего больше → светлее и «синее»']], BN = ['Rot', 'Grün', 'Blau'], BC = ['#ef4444', '#22c55e', '#3b82f6'];
    return '<span class="pp-lab">Две краски твоей презентации в виде RGB <span class="pp-mine">моё</span></span><div class="pp-rgb">' + R.map(function (c) {
      return '<div class="pp-rgbc"><div class="hd"><i style="background:' + c[0] + '"></i><b>' + c[1] + '</b><span>' + c[2].join(' / ') + '</span></div>' +
        c[2].map(function (v, j) { return '<div class="bar"><span>' + BN[j] + '</span><span class="tr"><span class="fl" style="width:' + Math.max(1.5, v / 255 * 100).toFixed(1) + '%;background:' + BC[j] + '"></span></span><em>' + v + '</em></div>'; }).join('') + '<p>' + c[3] + '</p></div>';
    }).join('') + '</div>';
  };
})(window.PPT);
