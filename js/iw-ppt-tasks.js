/* PowerPoint-Klassenarbeit — Daten Teil 2: die 14 Aufgaben der Probeklausur (Wortlaut: Aufgabenblatt des Lehrers) + zweite Arbeit B (mine).
   Markup in Texten:  **fett**   [[Taste]]   {{Menü → Befehl}} (wird zu Chips)   ·   Felder: orig = Wortlaut des Lehrers, state = was in der Datei steht (nachgeprüft),
   steps = Lösungsweg, eh = „Erwartungshorizont“ (MEINE Ableitung aus dem Aufgabentext, die Punkteverteilung innerhalb einer Aufgabe ist geschätzt). */
window.PPT = window.PPT || {};
(function (P) {

P.TASKS = [
 { n: 1, title: 'Titelfolie', pts: 3, mins: 2, slides: 'Folie 1', kann: ['k9', 'k14'], mock: ['m1'],
   orig: `Auf der Titelfolie fehlt noch das Firmenlogo. Ergänzen Sie es so, dass das Unternehmen als Absender klar erkennbar ist, ohne dass das Logo mit dem Titel konkurriert.`,
   state: [
     `Folie 1 nutzt das Layout „LU Titel“: dunkler Petrol-Hintergrund, Titel (40 pt, weiß), Untertitel in hellem Bernstein, rechts zwei große Kreise. Ein Logo gibt es nicht.`,
     `Die Logos liegen auf der **letzten Folie 16** („Material für die Fertigstellung“): links „Logo für helle Hintergründe“ (dunkle Schrift), daneben „Logo für dunkle Hintergründe“ (weiße Schrift, auf einer Petrol-Fläche).`,
     `Zum Vergleich: die Abschlussfolie hat das weiße Logo schon — oben links (im Layout „LU Abschluss“), ca. 2,0 cm vom linken Rand, ca. 1,8 cm von oben, 6,6 cm breit.`],
   steps: [
     `Zur letzten Folie → das **weiße** Logo („für dunkle Hintergründe“) anklicken → [[Strg]]+[[C]].`,
     `Folie 1 öffnen → [[Strg]]+[[V]].`,
     `Verkleinern: nur an einer **Ecke** ziehen (das Seitenverhältnis bleibt). Richtwert: 6–7 cm breit — deutlich kleiner als der Titel.`,
     `Oben links platzieren, bündig mit dem Textrand des Titels (wie auf der Abschlussfolie). Nicht in die Kreise rechts und nicht direkt auf den Titel setzen. Genau: Rechtsklick → Größe und Position.`,
     `Kontrolle: lesbar (weiß auf Petrol), nicht verzerrt, kleiner als der Titel.`],
   eh: [[`Richtige Logo-Variante: das weiße Logo („für dunkle Hintergründe“) — auf Petrol lesbar`, 1], [`Logo klein und dezent: deutlich kleiner als der Titel, Seitenverhältnis unverzerrt`, 1], [`In der Ecke, am Textrand ausgerichtet (wie auf der Abschlussfolie), berührt weder Titel noch Kreise`, 1]],
   traps: [`Das dunkle Logo auf dem Petrol-Hintergrund → unleserlich.`, `Logo groß in der Mitte → „konkurriert mit dem Titel“.`, `An den seitlichen Ziehpunkten gezogen → Logo verzerrt.`] },

 { n: 2, title: 'Über uns', pts: 10, mins: 7, slides: 'Folie 3', kann: ['k5', 'k6', 'k7', 'x1'], mock: ['m2'],
   orig: `Der Steckbrief auf der Folie „Über uns“ ist zum Vorlesen geschrieben, nicht zum Präsentieren. Überarbeiten Sie die Folie so, dass das Publikum die wichtigsten Unternehmensdaten auf einen Blick erfasst und die Gliederung der Informationen erkennbar ist. Die ausführlichen Informationen sollen dem Vortragenden weiterhin zur Verfügung stehen, aber nicht auf der Folie erscheinen.`,
   state: [
     `Folie 3: ein Textblock „Steckbrief“ (16 pt, rund 110 Wörter, ganze Sätze), rechts die Illustration „Firmensitz“. Die **Notizen sind leer**.`,
     `Alle Fakten stehen im Text: gegründet 2004 in Bonn von Elena Marković und Tobias Reuter · Hauptsitz Bonn-Beuel · Showrooms Berlin und Frankfurt am Main · 126 Mitarbeitende, davon 31 Auszubildende · Umsatz 2025: 21,8 Mio. € · Kunden in 11 Ländern Europas · Geschäftsführerin Katrin Albers seit 2021 (die Gründer bleiben Gesellschafter).`],
   steps: [
     `**Erst sichern:** in den Textblock klicken → [[Strg]]+[[A]] → [[Strg]]+[[C]] → {{Ansicht → Notizen}} → in den Notizenbereich klicken → [[Strg]]+[[V]]. Jetzt steht der volle Text in den Notizen.`,
     `Den Text auf der Folie neu schreiben: pro Zeile **ein Fakt**, Schlüsselwort + Zahl, keine ganzen Sätze (Beispiel im Bild unten).`,
     `Gliederung sichtbar machen: Aufzählungszeichen ({{Start → Absatz → Aufzählungszeichen}}) oder „Label — Wert“-Zeilen oder Zwischenüberschriften; die **Zahlen fett** (z. B. in Petrol hell).`,
     `Schrift ≥ 18 pt, Calibri, Anthrazit; nichts darf in das Bild rechts hineinragen.`,
     `Kontrolle: in 5 Sekunden erfasst man 2004 · Bonn · 126 · 21,8 Mio. € · 11 Länder?`],
   eh: [[`Der ausführliche Text steht vollständig in den Notizen (nicht gelöscht!)`, 2], [`Auf der Folie nur Stichpunkte / Kurzform — keine ganzen Sätze mehr`, 3], [`Alle wichtigen Daten sind noch da: Gründung 2004, Sitz/Standorte, 126 Mitarbeitende (31 Azubis), Umsatz 21,8 Mio. €, 11 Länder, Geschäftsführung`, 2], [`Gliederung erkennbar: Aufzählungszeichen, Zwischenüberschriften oder Zeilen mit Label; Kennzahlen hervorgehoben`, 2], [`Lesbar: Schrift ≥ 18 pt, Calibri, CD-Farben, genug Weißraum`, 1]],
   traps: [`Nur die Schrift verkleinert, damit alles passt — das ist kein „Kürzen“.`, `Text gelöscht statt in die Notizen verschoben (→ Punkte für Notizen weg).`, `Wichtige Zahlen (126, 31, 21,8, 11) gehen beim Kürzen verloren.`] },

 { n: 3, title: 'Werte', pts: 8, mins: 8, slides: 'Folie 5 (Vorbild: Folie 8)', kann: ['k12', 'k14', 'k16', 'k17', 'x6'], mock: ['m3'], html: 'icons',
   orig: `Die drei Unternehmenswerte auf der Folie „Unsere Werte“ sollen ebenso einprägsam dargestellt werden wie die Leistungen auf der Folie „Unsere Services“. Wählen Sie aus dem Material zu jedem Wert ein inhaltlich passendes Piktogramm aus und gestalten Sie die Folie so, dass sie sich in das Gesamtbild der Präsentation einfügt.`,
   state: [
     `Folie 5: Leitsatz (22 pt, kursiv) und **ein** Textblock mit den drei Werten (Titel fett Petrol + ein Satz). Keine Piktogramme.`,
     `Vorbild Folie 8 „Unsere Services“: vier Karten, jede aus hellgrauer abgerundeter Karte + Petrol-Kreis + **weißem** Piktogramm + Titel (19 pt fett) + Kurztext (15 pt).`,
     `Das Material (Folie 16) hat 8 Piktogramme **ohne Beschriftung**, dunkelgrau: Lieferwagen, Glühbirne, Euro, Medaille, Handschlag, Uhr, Herz mit Puls, Blatt. Nur drei passen zu den Werten „Ideen, die leuchten“ · „Verantwortung für die Umwelt“ · „Nah am Kunden“.`],
   steps: [
     `Folie 8 öffnen → die Objekte **einer** Karte mit dem Gummiband markieren (Karte, Kreis, Piktogramm, Titel, Text) → [[Strg]]+[[C]].`,
     `Folie 5 → dreimal [[Strg]]+[[V]] und die drei Karten nebeneinander legen. Die Karten auf Folie 8 sind 7,2 cm breit — für drei Karten bietet sich ≈ 9,8 cm an (so breit sind die Zielkarten auf Folie 6), oder die Abstände mit „Horizontal verteilen“ füllen.`,
     `Texte ersetzen: Titel und Satz aus dem alten Textblock herüberkopieren, dann den **alten Textblock löschen**.`,
     `Piktogramm tauschen: das alte löschen → Material-Folie → passendes Piktogramm kopieren → in den Kreis einfügen → ≈ 1,35 cm → **mittig im Kreis** (Kreis + Piktogramm markieren → {{Formformat → Ausrichten → Horizontal zentrieren}} und {{Vertikal zentrieren}}).`,
     `**Weiß einfärben:** Piktogramm anklicken → {{Grafikformat → Grafikfüllung → Weiß}} (bei einem gewöhnlichen Bild: {{Bildformat → Korrekturen → Helligkeit}} auf +100 %).`,
     `Alle drei Karten markieren → {{Ausrichten → Oben ausrichten}} + {{Horizontal verteilen}}. Jede Karte gruppieren ist ein nettes Extra.`,
     `Kontrolle: Leitsatz nicht überdeckt; Titel 19 pt fett, Text 15 pt wie bei Services.`],
   eh: [[`Wert 1 „Ideen, die leuchten“ mit passendem Piktogramm (Glühbirne)`, 1], [`Wert 2 „Verantwortung für die Umwelt“ mit passendem Piktogramm (Blatt)`, 1], [`Wert 3 „Nah am Kunden“ mit passendem Piktogramm (Handschlag)`, 1], [`Piktogramme gut sichtbar: weiß auf dem Petrol-Kreis (nicht dunkelgrau)`, 1], [`Gestaltung wie „Unsere Services“: Karte + Kreis + Piktogramm + Titel + Text; gleiche Größen, Abstände, Schriftgrößen`, 2], [`Sauber ausgerichtet und verteilt; nichts überlappt den Leitsatz`, 1], [`Alter Textblock entfernt, alle drei Texte vollständig übernommen`, 1]],
   traps: [`Dunkelgraues Piktogramm auf dem Petrol-Kreis → fast unsichtbar.`, `Falsches Piktogramm (Uhr, Euro, Medaille, Herz, Lieferwagen sind Ablenkung).`, `Karten haben unterschiedliche Abstände / Höhen.`, `Alten Textblock vergessen → doppelte Werte auf der Folie.`] },

 { n: 4, title: 'Unternehmensziele', pts: 7, mins: 5, slides: 'Folie 6', kann: ['k16', 'k24', 'k25', 'x8'], html: 'animpane',
   orig: `Im Vortrag werden die drei Zielbereiche in der Reihenfolge Wachstum, Nachhaltigkeit, Mitarbeitende erläutert. Gestalten Sie die Folie „Unsere Ziele bis 2030“ so, dass jede Zielkarte erst dann erscheint, wenn der Vortragende über sie spricht. Die Effekte sollen das Gesagte unterstützen und nicht davon ablenken.`,
   state: [
     `Folie 6: drei Zielkarten — jede ist schon eine **Gruppe** („Zielkarte Wachstum“, „Zielkarte Nachhaltigkeit“, „Zielkarte Mitarbeitende“).`,
     `Es gibt bereits **eine** Animation: nur die **mittlere** Karte (Nachhaltigkeit) hat einen Eingangseffekt „Verblassen“, beim Klicken. Wachstum und Mitarbeitende stehen von Anfang an auf der Folie.`],
   steps: [
     `{{Animationen → Animationsbereich}} öffnen. Dort steht schon „Zielkarte Nachhaltigkeit“.`,
     `Karte „Wachstum“ anklicken (die ganze Gruppe wird markiert) → {{Animationen → Eingang → Verblassen}} (derselbe Effekt wie vorhanden) → Start: **Beim Klicken**.`,
     `Dasselbe mit „Mitarbeitende“.`,
     `**Reihenfolge prüfen:** neue Effekte stehen im Animationsbereich **hinten**. „Wachstum“ nach oben ziehen oder markieren → {{Animation neu anordnen → Früher}}, bis es heißt: 1 Wachstum · 2 Nachhaltigkeit · 3 Mitarbeitende.`,
     `Alle drei: gleicher Effekt, Start „Beim Klicken“, Dauer 0,5 s.`,
     `Test: {{Bildschirmpräsentation → Ab aktueller Folie}} ([[Umschalt]]+[[F5]]): erster Klick → nur Wachstum, zweiter → Nachhaltigkeit, dritter → Mitarbeitende.`],
   eh: [[`Alle drei Zielkarten haben einen Eingangseffekt (Wachstum und Mitarbeitende fehlten!)`, 3], [`Reihenfolge im Animationsbereich: Wachstum → Nachhaltigkeit → Mitarbeitende`, 2], [`Jede Karte startet „Beim Klicken“ — erscheint erst, wenn gesprochen wird`, 1], [`Dezenter, einheitlicher Effekt (z. B. Verblassen) — nichts Verspieltes`, 1]],
   traps: [`Reihenfolge 2-1-3 stehen gelassen (Wachstum kam als Letztes dazu).`, `Gruppe aufgelöst → die vorhandene Animation ist weg.`, `Spielerischer Effekt (Kreisel, Springen) → „lenkt ab“.`, `Start „Mit Vorheriger“ → alle Karten gleichzeitig.`] },

 { n: 5, title: 'Produkte', pts: 10, mins: 9, slides: 'Folie 7', kann: ['k9', 'k10', 'k11', 'k14', 'x5'], mock: ['m5'],
   orig: `Die vier Produktfotos auf der Folie „Unsere Leuchten“ wirken derzeit uneinheitlich. Gestalten Sie die Übersicht so, dass alle Produkte gleichwertig präsentiert werden, jeweils das Produkt selbst im Mittelpunkt steht und das Publikum jedes Foto dem richtigen Produktnamen zuordnen kann.`,
   state: [
     `Folie 7: vier Fotos in vier Formaten und Größen — Stehleuchte 4:3 (7,1 × 5,3 cm), Pendelleuchte 16:9 (9,4 × 5,3), Tischleuchte Hochformat 3:4 (4,3 × 5,8), Wandleuchte 1:1 (5,0 × 5,0). Sie liegen unregelmäßig verteilt.`,
     `Nur das Stehleuchten-Foto hat einen **dicken Bernstein-Rahmen und einen Schatten**.`,
     `Die Lampe der **Pendelleuchte sitzt nicht in der Mitte** (bei ≈ 72 % der Bildbreite, nach rechts verschoben); die anderen drei Lampen sind schon mittig.`,
     `Rechts steht eine Textliste mit den Namen: Nova Floor (Stehleuchte), Arc Pendant (Pendelleuchte), Desk One (Schreibtischleuchte), Wall Line (Wandleuchte) — nichts verbindet Namen und Fotos.`],
   steps: [
     `**Gleiches Format:** jedes Foto anklicken → {{Bildformat → Zuschneiden ▾ → Seitenverhältnis → 1:1}}. Quadrat passt bei allen vier — 4:3 würde bei der Pendelleuchte nicht reichen (die Lampe bliebe außermittig).`,
     `**Produkt mittig:** im Zuschneide-Modus das Foto im Rahmen verschieben, bis die Lampe in der Mitte sitzt (Pendelleuchte: Foto nach links ziehen, bis der rechte Bildrand erreicht ist; Tischleuchte: leicht nach oben/unten). Beenden mit [[Esc]].`,
     `**Gleiche Größe:** alle vier markieren → {{Bildformat → Größe}}: Höhe = Breite = z. B. **6,9 cm**.`,
     `**Gleiche Formatierung:** beim Stehleuchten-Foto {{Bildformat → Bildrahmen → Kein Rahmen}} und {{Bildeffekte → Schatten → Kein Schatten}} (oder allen vier denselben dünnen Rahmen geben: Format übertragen).`,
     `**Anordnen:** alle vier markieren → {{Bildformat → Ausrichten → Oben ausrichten}}, dann {{Horizontal verteilen}} (erstes Foto links am Inhaltsrand, letztes rechts: ≈ 1,5 … 32,3 cm).`,
     `**Beschriften:** unter jedes Foto ein Textfeld (gleiche Breite wie das Foto): Produktname fett + eine Zeile Beschreibung — aus der Liste rechts ausschneiden und einfügen; danach die Liste löschen. Beschriftungen ebenfalls oben ausrichten.`,
     `Kontrolle der Zuordnung: Stehleuchte = Nova Floor · Pendelleuchte = Arc Pendant · Tischleuchte = Desk One · Wandleuchte = Wall Line.`],
   eh: [[`Alle vier Fotos gleich groß und im gleichen Seitenverhältnis`, 2], [`Produkt in jedem Ausschnitt mittig (Zuschneiden, Bild im Rahmen verschoben)`, 2], [`Einheitliche Formatierung: Rahmen/Schatten bei allen vier gleich oder bei keinem (der Bernstein-Rahmen der Stehleuchte ist weg)`, 2], [`Saubere Anordnung: bündig und gleiche Abstände (Ausrichten + Verteilen)`, 2], [`Jedes Foto ist eindeutig seinem Produktnamen zugeordnet (Beschriftung direkt am Foto, richtige Zuordnung)`, 2]],
   traps: [`Fotos nur gestreckt statt zugeschnitten → Verzerrung (Seitenverhältnis).`, `Pendelleuchte bleibt außermittig.`, `Rahmen/Schatten bleibt nur beim ersten Foto.`, `Die Namen stehen weiter in einer Liste rechts → Zuordnung bleibt Raten.`, `Ausgerichtet, aber nicht verteilt → ungleiche Abstände.`] },

 { n: 6, title: 'Lieferanten und Kunden', pts: 9, mins: 8, slides: 'Folie 10', kann: ['k13', 'k14', 'k17', 'k22'], mock: ['m6'],
   orig: `Auf der Folie „Vom Bauteil zur fertigen Leuchte“ ist in Textform beschrieben, wie Waren und Leistungen von den Lieferanten über LUMIO zu den Kunden gelangen. Stellen Sie diesen Zusammenhang so dar, dass das Publikum ihn ohne langes Lesen nachvollziehen kann.`,
   state: [
     `Folie 10: ein Textblock (18 pt). Inhalt: **Lieferanten** liefern LED-Module, Aluminiumprofile, Glasschirme sowie Steuerungs- und Sensortechnik → in der **Fertigung in Bonn** montiert und prüft LUMIO daraus die Leuchten → Vertrieb über **Showrooms, Onlineshop und Außendienst** → **drei Kundengruppen**: Büro- und Verwaltungsgebäude (46 % des Umsatzes), Hotellerie und Gastronomie (32 %), Einzelhandel (22 %).`],
   steps: [
     `Planen: vier Spalten **Lieferanten → LUMIO (Fertigung Bonn) → Vertrieb → Kundengruppen** (mindestens: Lieferanten → LUMIO → Kunden).`,
     `{{Einfügen → Formen → Abgerundetes Rechteck}}: erst **eine** Box fertig formatieren (Füllung Designfarbe, Kontur keine, Text Calibri 16 pt), dann kopieren ([[Strg]]+Ziehen) und den Inhalt ersetzen. Überschriften dunkel, Inhalte hellgrau.`,
     `Inhalt **in Stichworten**: z. B. Lieferanten: LED-Module · Aluminiumprofile · Glasschirme · Steuerungs- & Sensortechnik. Keine Sätze.`,
     `Pfeile zwischen die Spalten: {{Einfügen → Formen → Blockpfeile → Pfeil: nach rechts}} (oder Linie mit Pfeilspitze: {{Formkontur → Pfeile}}), Designfarbe (z. B. Bernstein).`,
     `Alles markieren → {{Ausrichten}} / {{Verteilen}}. Die **46 / 32 / 22 %** bei den Kundengruppen sichtbar lassen. Den alten Textblock löschen.`],
   eh: [[`Die Stationen sind als Formen dargestellt: Lieferanten → LUMIO → Kunden`, 3], [`Pfeile zeigen die Richtung des Waren-/Leistungsflusses`, 2], [`Inhalte korrekt: Lieferanten-Güter, Fertigung (montieren, prüfen), Vertriebswege, drei Kundengruppen mit 46 / 32 / 22 %`, 2], [`Kurze Stichworte statt Fließtext; lesbar (≥ 14 pt)`, 1], [`CD-Farben und Calibri; Formen gleich groß und ausgerichtet`, 1]],
   traps: [`Immer noch Fließtext, nur in Kästen gesetzt.`, `Pfeile zeigen in die falsche Richtung oder fehlen.`, `Standardformen mit Bernstein/Blau und schwarzer Kontur → fällt aus dem CD.`, `Prozentzahlen vergessen.`] },

 { n: 7, title: 'Lieferanten', pts: 9, mins: 7, slides: 'Folie 11', kann: ['k18', 'k19', 'x6'], mock: ['m7'],
   orig: `Die Angaben zu den vier Lieferanten auf der Folie „Unsere wichtigsten Lieferanten“ sollen sich auf einen Blick miteinander vergleichen lassen. Bereiten Sie die Angaben entsprechend auf und passen Sie die Darstellung an das Erscheinungsbild der Präsentation an.`,
   state: [
     `Folie 11: ein Textblock mit vier Lieferanten, je zwei Zeilen: Name + Ort, darunter „liefert …; Lieferzeit … Arbeitstage; Partner seit …“.`,
     `Die Daten: LedPoint Elektronik GmbH (Nürnberg) — LED-Module und Treiber — 12 Arbeitstage — seit 2009 · Alu-Profil Berger KG (Lüdenscheid) — Aluminiumprofile und Gehäuse — 8 — 2011 · Glashütte Sommer GmbH (Passau) — Glasschirme — 18 — 2015 · SmartLight Controls AG (Hannover) — Steuerungs- und Sensortechnik — 10 — 2020.`],
   steps: [
     `{{Einfügen → Tabelle}} → **5 Spalten × 5 Zeilen** (Kopfzeile + 4 Lieferanten).`,
     `Kopfzeile: Lieferant · Standort · Liefert · Lieferzeit (Arbeitstage) · Partner seit.`,
     `Daten zeilenweise aus dem Text übernehmen. Die Einheit kommt in die Kopfzeile, in den Zellen stehen nur noch 12 · 8 · 18 · 10 und die Jahre.`,
     `{{Tabellenentwurf → Optionen für Tabellenformat}}: **Kopfzeile ☑**, Gebänderte Zeilen ☑.`,
     `**CD-Look:** {{Tabellenentwurf → Tabellenformatvorlagen}} → ein Stil mit **Akzent 2** (Petrol hell) — oder Kopfzeile markieren → {{Schattierung}} Petrol, Schrift weiß/fett; Zeilen abwechselnd Hellgrau/Weiß. **Nicht** den Standardstil lassen (Akzent 1 = Bernstein mit weißer Schrift).`,
     `{{Layout (Tabelle) → Ausrichtung}}: Text links, die Zahlen (Lieferzeit, Partner seit) **zentriert**, vertikal mittig. {{Zellengröße}}: „Liefert“ breit, Zahlenspalten schmal.`,
     `Tabelle markieren → {{Start → Schriftgrad}} 16–18 pt, Calibri. Alten Textblock löschen. Bonus: kürzeste Lieferzeit (8) fett hervorheben.`],
   eh: [[`Tabelle statt Fließtext, sinnvoll aufgebaut: eine Zeile pro Lieferant, eine Spalte pro Merkmal`, 3], [`Alle Angaben vollständig und richtig übertragen (4 Lieferanten × Ort, Lieferung, Lieferzeit, Partner seit)`, 2], [`Kopfzeile hervorgehoben`, 1], [`An das CD angepasst: Petrol / Hellgrau / Bernstein statt Standard-Blau, Calibri`, 2], [`Gut lesbar: Schrift ≥ 16 pt, passende Spaltenbreiten, Zahlen zentriert`, 1]],
   traps: [`Standardstil (Bernstein-Kopfzeile mit weißer Schrift → schwacher Kontrast).`, `Einheit „Arbeitstage“ in jeder Zelle wiederholt → schwer vergleichbar.`, `Schrift 10–12 pt, weil die Tabelle „sonst nicht passt“.`, `Daten falsch zugeordnet (Lieferzeit ↔ Partner seit vertauscht).`] },

 { n: 8, title: 'Organisation', pts: 10, mins: 8, slides: 'Folie 13', kann: ['k20', 'k21'], mock: ['m8'],
   orig: `Neue Kunden fragen häufig, wer für ihr Anliegen zuständig ist. Stellen Sie die Organisationsstruktur auf der Folie „Unsere Organisation“ so dar, dass Leitungsebenen und Zuständigkeiten sofort erkennbar sind. Berücksichtigen Sie dabei auch die neu eingerichtete Abteilung, die auf der Folie vermerkt ist.`,
   state: [
     `Folie 13: die Struktur als Aufzählung mit Einzügen (3 Ebenen): **Geschäftsführung: Katrin Albers** → Vertrieb: Ömer Kaya (Showrooms, Onlineshop) · Entwicklung: Dr. Felix Lang (Produktdesign, Elektrotechnik) · Produktion: Marta Nowak (Montage, Qualitätsprüfung) · Verwaltung: Jens Hoffmann (Personal, Rechnungswesen).`,
     `Rechts ein Hinweis-Kasten: „Zum 01.01.2027 wird **im Bereich Produktion** die neue Abteilung Nachhaltigkeitsmanagement eingerichtet.“`,
     `Außerdem hat die Folie den Übergang „Kreis“ (→ Aufgabe 10).`],
   steps: [
     `**Schnellster Weg:** die Aufzählung markieren (Textfeld anklicken) → {{Start → In SmartArt konvertieren → Weitere SmartArt-Grafiken → Hierarchie → Organigramm}}. Die Einzugsebenen werden zu Hierarchieebenen. (Alternative: {{Einfügen → SmartArt → Hierarchie → Organigramm}} und den Text im Textbereich eintippen: [[Enter]] = neue Form, [[Tab]] = eine Ebene tiefer.)`,
     `**Neue Abteilung:** im Textbereich hinter „Qualitätsprüfung“ [[Enter]] und „Nachhaltigkeitsmanagement“ eintippen — **gleiche Ebene wie Montage und Qualitätsprüfung, also unter Produktion**. Oder: Form „Qualitätsprüfung“ markieren → {{SmartArt-Entwurf → Form hinzufügen → Form danach hinzufügen}}. Optional „(neu ab 01.01.2027)“ dazuschreiben und anders füllen.`,
     `**Layout:** wenn die Kästen der 3. Ebene nebeneinander nicht passen: {{SmartArt-Entwurf → Layout → Links hängend}} (3. Ebene untereinander).`,
     `**Farben:** {{SmartArt-Entwurf → Farben ändern → Akzent 2}} (Petrol hell); die 1. Ebene gern dunkler (Petrol) über {{Format → Fülleffekt}}.`,
     `Schrift Calibri, Text ≥ 12 pt (SmartArt passt die Größe selbst an — wird sie zu klein, die Grafik größer ziehen).`,
     `Den alten Aufzählungstext **und** den Hinweis-Kasten löschen (die Abteilung steht jetzt im Organigramm) — oder den Kasten in Designfarben umfärben.`,
     `Kontrolle: jeder Kasten der 2. Ebene nennt Bereich **und** Person (z. B. „Vertrieb · Ömer Kaya“).`],
   eh: [[`Organigramm (SmartArt oder Formen) mit drei Ebenen: Geschäftsführung → 4 Bereiche → Abteilungen`, 3], [`Alle Namen und Abteilungen vollständig`, 2], [`Neue Abteilung „Nachhaltigkeitsmanagement“ steht unter Produktion`, 3], [`Ebenen und Zuständigkeiten sofort erkennbar, Farben im CD, Text lesbar (≥ 12 pt)`, 2]],
   traps: [`Nachhaltigkeitsmanagement unter Geschäftsführung oder Verwaltung gehängt.`, `Hinweis-Kasten bleibt stehen und die Abteilung steht doppelt.`, `Text im SmartArt zu klein.`, `Namen der Bereichsleiter vergessen.`] },

 { n: 9, title: 'Ausbildung', pts: 6, mins: 4, slides: 'Folie 14', kann: ['k15', 'k5'], mock: ['m9a', 'm9b'],
   orig: `Der Text auf der Folie „Ausbildung bei LUMIO“ ist im Vortrag aus den hinteren Reihen kaum lesbar. Sorgen Sie dafür, dass der Text gut lesbar ist und das Foto trotzdem als Blickfang erhalten bleibt.`,
   state: [
     `Folie 14: von hinten nach vorn liegen ① eine **weiße Textfläche** (15 × 10 cm, links), ② das **große Foto** (fast die ganze Folie), ③ der **Text** (17–20 pt, dunkles Petrol).`,
     `Weil das Foto **vor** der weißen Fläche liegt, verdeckt es sie. Der dunkle Text steht auf dem dunklen Foto → kaum lesbar. Dass die Schrift vergrößert werden muss, ist die zweite Hälfte der Aufgabe.`],
   steps: [
     `**Ebenen klären:** {{Start → Anordnen → Auswahlbereich}}: die Liste zeigt alle Objekte (oben = vorn).`,
     `Foto anklicken → Rechtsklick → **In den Hintergrund**. Jetzt liegt die weiße Fläche vor dem Foto und der Text darauf.`,
     `**Schrift größer:** Überschrift ≈ 24 pt, Aufzählung ≈ 20–22 pt. Prüfen, ob alles noch in die weiße Fläche passt — wenn nicht, die Fläche **nur so weit** vergrößern, dass das Foto rechts als Blickfang sichtbar bleibt.`,
     `Kontrast prüfen: dunkle Schrift (Petrol/Anthrazit) auf weißer Fläche ✓.`],
   eh: [[`Ebenenreihenfolge korrigiert: das Foto liegt hinter der Textfläche`, 2], [`Text hat guten Kontrast (dunkle Schrift auf heller Fläche)`, 2], [`Schrift vergrößert (Liste ≥ 20 pt) und passt noch in die Fläche`, 1], [`Foto bleibt als Blickfang sichtbar (die Fläche deckt nicht das ganze Foto)`, 1]],
   traps: [`Nur die Schrift vergrößert — das Foto liegt weiter vor der Fläche.`, `Weiße Fläche über das ganze Foto gezogen → Blickfang weg.`, `Foto gelöscht.`, `Schrift auf dem Foto weiß gefärbt statt die Ebenen zu korrigieren.`] },

 { n: 10, title: 'Einheitliches Erscheinungsbild', pts: 10, mins: 8, slides: 'alle Folien', kann: ['k5', 'k8', 'k23', 'x4', 'x6'], html: 'cdtable',
   orig: `Überprüfen Sie, ob die gesamte Präsentation wie aus einem Guss wirkt, und passen Sie Abweichungen an. Schriften, Farben und Hintergründe sollen den Vorgaben zum Corporate Design auf der Folie „Material für die Fertigstellung“ entsprechen, und die Folienwechsel sollen ruhig und einheitlich wirken.`,
   state: [
     `Das CD (Folie 16): Schriftart **Calibri** · Folientitel **30 pt, fett, Petrol** · Petrol RGB 15/61/62 · Petrol hell 30/107/108 · Anthrazit (Fließtext) 43/45/47 · Bernstein 242/169/0 · Hellgrau (Flächen) 238/242/241 · Hintergrund Inhaltsfolien **Weiß** · „Alle CD-Farben finden Sie in der Farbauswahl unter „Designfarben“.“`,
     `Die Abweichungen in der Ausgangsdatei stehen in der Tabelle unten — nachgeprüft im Dateiinhalt. Es ist **nicht „ein“ Fehler**, sondern mehrere, auf mehreren Folien.`],
   steps: [
     `Vorgaben auf Folie 16 lesen (Calibri · Titel 30 pt fett Petrol · Farben · Hintergrund Weiß).`,
     `**Jede** Folie einzeln durchgehen ({{Ansicht → Foliensortierung}} für den Überblick, dann Normalansicht): Schrift, Farben, Hintergrund, Übergang — mit der Tabelle unten abgleichen.`,
     `Schrift: {{Start → Ersetzen → Schriftarten ersetzen}}: Cambria → Calibri.`,
     `Hintergrund: Folie 9 → {{Entwurf → Hintergrund formatieren → Hintergrund zurücksetzen}} (oder Einfarbige Füllung → Weiß).`,
     `Farben: die Kontakt-Kreise markieren → {{Formformat → Fülleffekt → Designfarben → Akzent 2}}; die Diagrammbalken anklicken → {{Format → Fülleffekt → Designfarbe}}; die Zahlen der Werteachse → {{Start → Schriftart → Calibri}}.`,
     `Übergänge: {{Übergänge → Verblassen}} → Dauer ≈ 0,7 s → **Für alle übernehmen**; danach in der Foliensortierung prüfen, dass jede Folie den gleichen Effekt trägt (★ unter der Miniatur).`,
     `**Zuletzt**, nach den Aufgaben 3–8: neue Objekte prüfen. Neue Formen haben die Standardfarbe Bernstein mit dunkler Kontur.`],
   eh: [[`Schrift & Titel: überall Calibri (Folie 4 war Cambria), Titel 30 pt fett Petrol`, 2], [`Hintergründe: alle Inhaltsfolien weiß (Folie 9 war cremefarben)`, 2], [`Farben aus den Designfarben: Kontakt-Kreise (waren Standardblau), Diagrammbalken (waren grün) …`, 3], [`Folienwechsel: ein ruhiger Übergang (z. B. Verblassen) auf allen Folien; „Rad“ und „Kreis“ weg`, 3]],
   traps: [`Nur den auffälligsten Fehler gefunden und aufgehört.`, `Übergang nur auf der aktuellen Folie geändert (ohne „Für alle übernehmen“).`, `Neue Objekte aus Aufgaben 3–8 in Bernstein/Blau stehen gelassen.`, `Farben aus „Standardfarben“ statt „Designfarben“ gewählt.`] },

 { n: 11, title: 'Firmenlogo', pts: 5, mins: 4, slides: 'Folienmaster', kann: ['x2', 'k9'], html: 'layoutinfo',
   orig: `Das Firmenlogo soll auf allen Inhaltsfolien oben rechts als Absender erscheinen, auch auf Inhaltsfolien, die später noch ergänzt werden. Auf der Titel- und der Abschlussfolie soll es nicht zusätzlich auftauchen. Fügen Sie das Logo entsprechend ein.`,
   state: [
     `Die Datei hat drei Layouts: **„LU Titel“**, **„LU Inhalt“**, **„LU Abschluss“** (+ „Leer“). „LU Inhalt“ benutzen alle Inhaltsfolien: Fußzeilentext unten links, Foliennummern-Platzhalter unten rechts — **kein Logo**.`,
     `Das Layout „LU Abschluss“ enthält das weiße Logo **schon** (oben links) — deshalb darf dort kein zweites dazukommen. „LU Titel“ hat keins (das kommt in Aufgabe 1 direkt auf die Folie).`,
     `In „LU Titel“ und „LU Abschluss“ ist **„Hintergrundgrafiken ausblenden“** schon aktiv (nachgeprüft): Objekte, die ganz oben im Folienmaster liegen, erscheinen dort nicht. Im obersten Master hat die Datei nur den Platzhalter für die Foliennummer.`],
   steps: [
     `Auf der Material-Folie das **dunkle** Logo („für helle Hintergründe“) kopieren ([[Strg]]+[[C]]).`,
     `{{Ansicht → Folienmaster}}. Links in der Liste das Layout **„LU Inhalt“** anklicken (Mauszeiger darauf: der Name und die Folien, die es nutzen, werden angezeigt).`,
     `[[Strg]]+[[V]] → mit einer Ecke auf ≈ 4,5–5 cm Breite verkleinern → **oben rechts** platzieren: rechter Rand bündig mit dem Inhaltsrand (≈ 32,3 cm), oben ≈ 0,7 cm. Der Titel-Platzhalter reicht bis ≈ 26,9 cm — das Logo darf ihn nicht berühren.`,
     `{{Folienmaster → Masteransicht schließen}}.`,
     `Kontrolle: Folien 2–14 durchklicken → Logo erscheint; auf Folie 1 (Titel) und Folie 15 (Abschluss) kein zusätzliches Logo.`,
     `**Variante B:** das Logo ganz oben in den Folienmaster setzen (der große Eintrag über allen Layouts). Das geht in dieser Datei auch, weil „LU Titel“ und „LU Abschluss“ die Master-Grafiken ausblenden — aber das Logo erscheint dann auch auf „Leer“ und auf jedem später neu angelegten Layout. Wer Variante B wählt, muss Folie 1 und 15 danach unbedingt kontrollieren. Variante A (Layout „LU Inhalt“) ist die sicherere.`],
   eh: [[`Logo im Folienmaster bzw. im Layout (nicht auf jeder Folie einzeln) eingefügt → erscheint auch auf später ergänzten Inhaltsfolien`, 2], [`Position oben rechts, am Rand ausgerichtet, kollidiert nicht mit dem Titel`, 1], [`Richtige Variante (dunkle Schrift) für den weißen Hintergrund, unverzerrt, passende Größe`, 1], [`Titel- und Abschlussfolie haben kein zusätzliches Logo`, 1]],
   traps: [`Logo auf jede Folie einzeln kopiert → neue Folien bekommen keins.`, `Logo in alle Layouts kopiert → auch Titel- und Abschlussfolie zeigen es (der Auftrag nennt nur Inhaltsfolien).`, `Logo in den obersten Master gesetzt, aber nicht kontrolliert, ob Folie 1 und 15 es zeigen.`, `Das weiße Logo auf weißem Hintergrund.`, `Logo überdeckt den Titel.`] },

 { n: 12, title: 'Aufbau der Präsentation', pts: 6, mins: 5, slides: 'alle Folien', kann: ['k2', 'x3'], html: 'order',
   orig: `Bringen Sie die Folien in die Reihenfolge, die dem Publikum in der Agenda angekündigt wird. Damit sich das Publikum bei Rückfragen auf einzelne Folien beziehen kann, sollen alle Folien außer der Titelfolie nummeriert sein. Die Folie „Material für die Fertigstellung“ wird für den Vortrag nicht mehr benötigt.`,
   state: [
     `Agenda (Folie 2): **01** Über uns · **02** Werte und Ziele · **03** Produkte und Services · **04** Partner und Kunden · **05** Team und Organisation · **06** Kontakt. Jede Folie trägt oben links ihre Kapitelmarke („01 | Über uns“ …).`,
     `Zwei Folien stehen am **falschen Platz**: „LUMIO in Zahlen“ (Kapitel 01) steht als Folie 9 mitten zwischen den Kapiteln 03 und 04; „Kontakt“ (Kapitel 06) steht als Folie 12 vor dem Kapitel 05.`,
     `Es gibt keine Foliennummern. Die letzte Folie „Material für die Fertigstellung“ ist als „Intern“ markiert.`],
   steps: [
     `{{Ansicht → Foliensortierung}} (Überblick) — oder im Miniaturbereich links ziehen.`,
     `„LUMIO in Zahlen“ zum Kapitel 01 ziehen (hinter „Unser Weg“).`,
     `„Kontakt“ ans Ende schieben — vor die Abschlussfolie (nach „Ausbildung bei LUMIO“).`,
     `Die Reihenfolge anhand der **Kapitelmarken oben links** kontrollieren (siehe Tabelle).`,
     `**Foliennummern:** {{Einfügen → Foliennummer}} (Kopf- und Fußzeile, Registerkarte „Folie“): **Foliennummer ☑** und **Auf Titelfolie nicht anzeigen ☑** → **Für alle übernehmen**. Auch die Abschlussfolie bekommt eine Nummer.`,
     `**Zuletzt:** Folie 16 „Material für die Fertigstellung“ anklicken → [[Entf]]. Nur, wenn die Aufgaben 1, 3, 10 und 11 fertig sind!`,
     `Kontrolle: Nummern 2–15 stehen unten rechts, auf Folie 1 keine; 15 Folien insgesamt.`],
   eh: [[`Folie „LUMIO in Zahlen“ steht im Kapitel 01`, 1], [`Folie „Kontakt“ steht am Ende, vor der Abschlussfolie`, 1], [`Gesamtreihenfolge entspricht der Agenda (01 → 06)`, 1], [`Foliennummern auf allen Folien außer der Titelfolie (auch auf der Abschlussfolie)`, 2], [`Folie „Material für die Fertigstellung“ gelöscht`, 1]],
   traps: [`Nur eine der beiden falsch stehenden Folien gefunden.`, `„Für alle übernehmen“ vergessen oder den Haken „Auf Titelfolie nicht anzeigen“ nach dem Klick gesetzt.`, `Material-Folie zu früh gelöscht — Logo und Piktogramme weg.`, `„Kontakt“ hinter die Abschlussfolie gelegt.`] },

 { n: 13, title: 'Navigation', pts: 6, mins: 4, slides: 'Folie 2 (Agenda)', kann: ['k26', 'k27', 'x8'], html: 'linktable',
   orig: `In der Fragerunde soll der Vortragende von der Agenda aus direkt zu jedem Kapitel springen können. Richten Sie diese Möglichkeit ein. Bearbeiten Sie diese Aufgabe erst nach Aufgabe 12.`,
   state: [
     `Folie 2 (Agenda): sechs Karten (abgerundete Rechtecke) „01 Über uns“ … „06 Kontakt“ — noch ohne Links.`,
     `Der Lehrer verlangt: **erst nach Aufgabe 12**. Praktisch hilft das: erst wenn die Reihenfolge endgültig ist, siehst du sicher, welche Folie jedes Kapitel eröffnet — jede Karte muss auf die **erste Folie ihres Kapitels** zeigen (siehe Tabelle). Ein Link zeigt auf die Folie selbst, nicht auf eine Nummer.`],
   steps: [
     `Karte „01 Über uns“ als **Form** markieren (an den Rand klicken, nicht in den Text hinein) → [[Strg]]+[[K]] (oder {{Einfügen → Link}}).`,
     `Im Dialog links **Aktuelles Dokument** (in manchen Versionen „Dieses Dokument“) → die Folie „Über uns“ auswählen → OK.`,
     `Für die anderen fünf Karten wiederholen (Zielfolien: siehe Tabelle).`,
     `**Test:** {{Bildschirmpräsentation → Von Beginn an}} ([[F5]]), auf der Agenda jede Karte anklicken; mit [[Esc]] beenden.`,
     `Wenn die Schrift einer Karte jetzt unterstrichen oder umgefärbt aussieht, ist das ein Text-Link — Rechtsklick → Link entfernen und den Link an der Form setzen.`],
   eh: [[`Alle 6 Agenda-Punkte sind verlinkt`, 3], [`Jeder Link führt zur ersten Folie des richtigen Kapitels`, 2], [`Gestaltung bleibt unverändert (Link an der Form, nicht am Text) und im Vortragsmodus getestet`, 1]],
   traps: [`Gegen die Vorgabe schon vor Aufgabe 12 begonnen — und dann die Kapitel-Anfänge falsch zugeordnet.`, `Link am Text: Schrift wird umgefärbt und unterstrichen.`, `Nur im Normalmodus geklickt — dort passiert nichts; testen in [[F5]].`, `„Kontakt“ zeigt auf die Abschlussfolie.`] },

 { n: 14, title: 'Speichern', pts: 1, mins: 1, slides: 'Datei', kann: ['x7'], html: 'filename',
   orig: `Speichern Sie die Präsentation als PowerPoint-Datei unter dem Dateinamen „PK_PPT_Klasse_Nachname_Vorname“ (Beispiel: PK_PPT_11b_Meyer_Lena) im vorgegebenen Ordner.`,
   state: [`Im Hinweis ganz oben steht: **gleich zu Beginn** unter diesem Namen speichern, dann regelmäßig. Der eine Punkt ist geschenkt — wenn Name, Format und Ordner stimmen.`],
   steps: [
     `{{Datei → Speichern unter → Durchsuchen}} → den **vorgegebenen Ordner** wählen.`,
     `Dateiname: **PK_PPT_Klasse_Nachname_Vorname** — das Muster genau so übernehmen. Dateityp: **PowerPoint-Präsentation (*.pptx)**. Speichern.`,
     `Danach regelmäßig [[Strg]]+[[S]] — nach jeder fertigen Aufgabe.`],
   eh: [[`Dateiname nach dem Muster, als PowerPoint-Datei (.pptx), im vorgegebenen Ordner`, 1]],
   traps: [`Erst am Ende gespeichert → ein Absturz, und alles ist weg.`, `Falscher Ordner oder Dateityp (.ppt, .pdf).`, `Muster verändert (Leerzeichen, fehlende Unterstriche).`] }
];

/* ---------------------------------------------------------------- Zweite Arbeit B (mine) */
P.B = {
  intro: `Die **originale** Ausgangsdatei noch einmal öffnen (nicht deine gelöste Version!) und sofort als <b>PK_PPT_Klasse_Nachname_Vorname_B</b> speichern. Zeit: <b>60 Minuten</b> · Punkte: <b>50</b> · Hilfsmittel wie in der Probeklausur. Die Aufgaben stammen von mir — sie trainieren, was in der Probeklausur nicht vorkam (Folie duplizieren, Gruppieren, „Mit/Nach Vorheriger“, Hervorhebungseffekt, Bildform, Links ins Internet, wiederkehrender Schalter).`,
  tasks: [
   { n: 'B1', title: 'Neue Folie „Unsere Standorte“', pts: 8, mins: 10, kann: ['k2', 'k3', 'k12', 'k13', 'k14'],
     orig: `Nach der Folie „Über uns“ soll eine neue Folie „Unsere Standorte“ stehen. Sie gehört zu Kapitel 01 und sieht aus wie die anderen Inhaltsfolien (Layout, Kapitelmarke, Titel). Stellen Sie die drei Standorte — Hauptsitz Bonn-Beuel, Showroom Berlin, Showroom Frankfurt am Main — als drei gleichwertige Karten dar, jeweils mit dem Ortssymbol von der Folie „Kontakt“.`,
     steps: [
       `Folie 3 „Über uns“ → Rechtsklick im Miniaturbereich → **Folie duplizieren**. Kapitelmarke, Kapitel-Text, Titel und Layout sind damit schon da; die Kopie steht direkt hinter dem Original.`,
       `Titel ändern: „Unsere Standorte“. Steckbrief-Textblock und Bild löschen. (Mit {{Start → Neue Folie ▾ → LU Inhalt}} ginge es auch — dann müssten Kapitelmarke und Kapitel-Text von der Nachbarfolie kopiert werden: sie sind Formen auf der Folie, nicht Teil des Layouts.)`,
       `Von Folie 8 „Unsere Services“ eine Karte kopieren (Karte, Kreis, Piktogramm, Titel, Text) → dreimal einfügen, Texte ersetzen.`,
       `Ortssymbol von der Folie „Kontakt“ kopieren (es ist schon weiß) und statt des Service-Piktogramms in die Kreise setzen → mittig.`,
       `{{Ausrichten → Oben ausrichten}} + {{Horizontal verteilen}}.`],
     eh: [[`Neue Folie mit dem Layout „LU Inhalt“ an der richtigen Stelle (hinter „Über uns“), Titel im Titel-Platzhalter`, 2], [`Kapitelmarke und Kapitel-Text „01 | Über uns“ wie auf den Nachbarfolien`, 1], [`Drei gleich große Karten wie bei „Unsere Services“ (Karte, Kreis, Piktogramm, Text)`, 2], [`Ortssymbol weiß auf Petrol-Kreis, mittig`, 1], [`Inhalte stimmen: Bonn-Beuel (Hauptsitz), Berlin (Showroom), Frankfurt am Main (Showroom)`, 1], [`Sauber ausgerichtet und verteilt`, 1]] },
   { n: 'B2', title: 'Unser Weg: Zeitachse', pts: 8, mins: 10, kann: ['k16', 'k24', 'k25'],
     orig: `Auf der Folie „Unser Weg“ sollen die fünf Stationen nacheinander erscheinen. Der Vortragende klickt einmal; danach sollen die weiteren Stationen von selbst im Abstand von etwa einer halben Sekunde folgen. Jahr, Markierungspunkt und Ereignis einer Station erscheinen immer gemeinsam. Der Effekt soll ruhig sein.`,
     steps: [
       `Pro Station die drei Objekte („Jahr 2004“, „Marke 2004“, „Ereignis 2004“) markieren → Rechtsklick → **Gruppieren**. Dasselbe für 2009 … 2025. Die Zeitachse (Linie) bleibt ohne Animation.`,
       `Gruppe 2004 → {{Animationen → Eingang → Verblassen}} → Start **Beim Klicken**.`,
       `Gruppe 2009 → Verblassen → Start **Nach Vorheriger**, Verzögerung **00,50**. Dasselbe für 2015, 2020, 2025 (Tipp: {{Animationen → Animation übertragen}}).`,
       `Im Animationsbereich die Reihenfolge prüfen: 2004 → 2009 → 2015 → 2020 → 2025.`,
       `Test: [[Umschalt]]+[[F5]].`],
     eh: [[`Je Station Jahr + Punkt + Ereignis zu einer Gruppe zusammengefasst (5 Gruppen)`, 2], [`Eingangseffekt (dezent, einheitlich) auf allen fünf Gruppen`, 1], [`Chronologische Reihenfolge 2004 → 2025`, 1], [`Erste Station „Beim Klicken“`, 1], [`Stationen 2–5 „Nach Vorheriger“ (automatisch)`, 2], [`Verzögerung ≈ 0,5 s eingestellt`, 1]] },
   { n: 'B3', title: 'Leuchten: runde Fotos', pts: 8, mins: 10, kann: ['k10', 'k11', 'k14'],
     orig: `Auf der Folie „Unsere Leuchten“ sollen die vier Fotos als Kreise erscheinen: gleich groß, das Produkt in der Mitte, alle mit demselben schmalen Rahmen in Petrol hell, in einer Reihe sauber angeordnet. Die Produktnamen müssen den Fotos weiterhin eindeutig zugeordnet sein.`,
     steps: [
       `Pro Foto: {{Bildformat → Zuschneiden ▾ → Seitenverhältnis → 1:1}}, Lampe in die Mitte schieben.`,
       `{{Zuschneiden ▾ → Auf Form zuschneiden → Oval}} — wegen 1:1 entsteht ein Kreis.`,
       `Alle vier gleich groß (z. B. 6,5 cm).`,
       `{{Bildrahmen → Designfarben → Akzent 2}}, Stärke ≈ 2,25 pt, bei **allen** vier; beim ersten Foto zusätzlich {{Bildeffekte → Schatten → Kein Schatten}} (der alte Bernstein-Rahmen wird dabei überschrieben).`,
       `{{Ausrichten → Oben ausrichten}} + {{Horizontal verteilen}}; Beschriftung unter jedem Kreis.`],
     eh: [[`Alle vier in Kreisform (erst 1:1, dann „Auf Form zuschneiden → Oval“)`, 2], [`Produkt mittig im Kreis`, 1], [`Gleiche Größe — Kreise, keine Ellipsen (Höhe = Breite)`, 1], [`Gleicher Rahmen in Petrol hell (≈ 2–3 pt) bei allen vier, kein Schatten-Rest`, 2], [`Eine Reihe: oben ausgerichtet und gleichmäßig verteilt`, 1], [`Produktnamen bleiben eindeutig zuordenbar`, 1]] },
   { n: 'B4', title: 'Zahlen: Kennzahlen erscheinen', pts: 8, mins: 8, kann: ['k24', 'k25'],
     orig: `Auf der Folie „LUMIO in Zahlen“ sollen die drei Kennzahlen rechts nacheinander erscheinen: Zahl und Beschreibung jeweils gemeinsam nach einem Klick. Nachdem „+43 %“ erschienen ist, soll die Zahl einmal kurz hervorgehoben werden, ohne dass ein weiterer Klick nötig ist.`,
     steps: [
       `Zahl „+43 %“ → {{Animationen → Eingang → Verblassen}} → Start **Beim Klicken**; den Text „Umsatzwachstum 2021–2025“ → Verblassen → Start **Mit Vorheriger**.`,
       `Dasselbe für „126“ + „Mitarbeitende“ und „11“ + „Länder in Europa“.`,
       `„+43 %“ nochmals markieren → {{Animation hinzufügen ▾ → Hervorhebung → Impuls}} (wichtig: **Animation hinzufügen**, sonst ersetzt der neue Effekt den ersten!) → Start **Nach Vorheriger**.`,
       `Den neuen Effekt im Animationsbereich direkt hinter den Text der ersten Kennzahl schieben ({{Früher}}). Sonst kommt er erst nach allen anderen.`,
       `Test: [[Umschalt]]+[[F5]].`],
     eh: [[`Alle sechs Objekte (3 Zahlen + 3 Texte) haben einen Eingangseffekt`, 2], [`Pro Kennzahl: Zahl „Beim Klicken“, Text „Mit Vorheriger“ (erscheinen gemeinsam)`, 2], [`Reihenfolge der Kennzahlen: +43 % → 126 → 11`, 1], [`Zusätzlicher Hervorhebungseffekt an „+43 %“ (Animation hinzufügen!) mit „Nach Vorheriger“`, 2], [`Effekte dezent und einheitlich, im Animationsbereich geprüft`, 1]] },
   { n: 'B5', title: 'Kontakt: Links ins Internet', pts: 8, mins: 8, kann: ['k26', 'x8'],
     orig: `Auf der Folie „Kontakt“ sollen die Webadresse und die E-Mail-Adresse anklickbar sein: die Webadresse öffnet https://www.lumio-licht.de, die E-Mail-Adresse öffnet ein neues Nachrichtenfenster an info@lumio-licht.de. Das Erscheinungsbild der Folie soll dabei unverändert bleiben.`,
     steps: [
       `Textfeld der Webadresse als **Form** markieren (Rahmen anklicken) → [[Strg]]+[[K]] → **Datei oder Webseite** → Adresse https://www.lumio-licht.de → OK.`,
       `Textfeld der E-Mail-Adresse → [[Strg]]+[[K]] → **E-Mail-Adresse** → info@lumio-licht.de → OK.`,
       `Test in [[F5]]: der Mauszeiger wird beim Darüberfahren zur Hand.`,
       `Zum Verständnis: ein Link auf den **Text** würde Farbe und Unterstreichung ändern — das wollen wir hier nicht.`],
     eh: [[`Webadresse verlinkt auf https://www.lumio-licht.de (Datei oder Webseite)`, 2], [`E-Mail verlinkt über „E-Mail-Adresse“ (info@lumio-licht.de)`, 2], [`Links an der Form gesetzt: Schriftfarbe und Unterstreichung unverändert`, 2], [`Im Vortragsmodus getestet, Adressen tippfehlerfrei`, 1], [`Telefonnummer und Anschrift unverändert, keine unnötigen Links`, 1]] },
   { n: 'B6', title: 'Schalter „Agenda“', pts: 10, mins: 14, kann: ['k13', 'k14', 'k26', 'k27'],
     orig: `Der Vortragende soll aus den Kapiteln schnell zur Agenda zurückkommen. Fügen Sie dazu auf der ersten Folie jedes Kapitels (Über uns, Unsere Werte, Unsere Leuchten, Vom Bauteil zur fertigen Leuchte, Unsere Organisation, Kontakt) unten rechts einen kleinen Schalter „Agenda“ ein, der zur Agenda-Folie springt. Gestalten Sie den Schalter einheitlich (Form, Farbe, Schrift) und richten Sie ihn auf allen sechs Folien an derselben Stelle aus. Er darf die Foliennummer nicht überdecken.`,
     steps: [
       `Auf **einer** Folie den Schalter bauen: {{Einfügen → Formen → Abgerundetes Rechteck}}, Text „Agenda“, Füllung Petrol hell, Schrift weiß, Calibri 14 pt, klein, unten rechts **links neben** dem Platz der Foliennummer (etwa 27 cm von links, nahe dem unteren Rand).`,
       `Link setzen: [[Strg]]+[[K]] → **Aktuelles Dokument** → Folie „Agenda“ → OK.`,
       `Schalter kopieren ([[Strg]]+[[C]]) und auf den anderen fünf Kapitel-Anfangsfolien einfügen ([[Strg]]+[[V]]) — PowerPoint fügt an **derselben Position** ein, und der Link wird mitkopiert.`,
       `Test in [[F5]]: auf jeder der sechs Folien zur Agenda springen.`],
     eh: [[`Ein Schalter fertig gestaltet: Füllung Designfarbe, Text „Agenda“ in Calibri ≥ 12 pt`, 2], [`Auf allen sechs Kapitel-Anfangsfolien vorhanden`, 2], [`Jeder Schalter verlinkt auf die Agenda-Folie (Aktuelles Dokument)`, 3], [`An derselben Position, Foliennummer und Fußzeile bleiben frei`, 2], [`In der Bildschirmpräsentation getestet`, 1]] }
  ]
};

})(window.PPT);
