# merge-lessons

Merges several lesson pages into ONE page with a lesson switcher (used on 2026-10-31 for the English tenses, prepositions,
phrasal verbs, adjectives, valence, small words, doctor and math pages).

Each source page becomes `<section class="lesson-pane" id="pane-KEY">` inside the merged page; the switcher buttons and the URL
hash are handled by `js/lesson-switch.js` + `css/lesson-switch.css`:

- `page.html#key` opens a lesson, `page.html#key/tab` opens a lesson and one of its tabs, the old `#tab-name` / `#element-id` links still work.
- Lessons with audio (`LessonSwitch.openAudio(slug)`) load `audio/lesson-<slug>-cues.js` on demand.

What the merge does to every member so that several lessons can share one document:
ids that clash get a key prefix (`tab-x` -> `tab-KEY-x`), `<style>` rules are scoped with `#pane-KEY`, inline scripts are wrapped
in an IIFE (`document.querySelector(All)` becomes pane-scoped), functions used by `onclick=""` are exported as `PANE_KEY.fn`
(also for handlers that a script writes into generated markup). Nothing else is changed: all text, quizzes and trainers stay.

## Use
1. `cp specs.example.py specs.py` and edit it (see the comments there).
2. `python3 merge_pages.py NAME [outdir]` -> writes the merged page (default: repo root). The merge READS the sources from the working
   tree, so when a host page is overwritten by its own merge keep pristine copies (`git show HEAD:page.html`) and run with `MERGE_SRC=<folder>`.
3. `python3 verify_page.py page.html` -> static checks (duplicate ids, missing files, JS syntax via `node --check`, handlers, tab wiring).
4. Open the page and click through every lesson/tab/quiz; the dynamic `getElementById` warnings of the verifier name the places to look at.
5. Hubs: replace the cards of the merged lessons by one card; `python3 relink.py [--write]` points every link to a merged-away page at
   `new.html#key` (map is built from `specs.py`); delete the old pages; `python3 linkcheck.py` must report no broken html links.

## Add a lesson to a page that is already merged
Write the new lesson as an ordinary standalone page (copy a page of the same series as the template), then
`python3 merge_pages.py --append englisch-tenses.html new-lesson.html KEY "Label" ["Row label"]`
inserts it as one more pane (switcher button, pane, scoped CSS, wrapped script). Afterwards delete the standalone page, run
`relink.py` (add it to a spec first) or fix its links by hand, and update the hub card text.

Limits: pages must use the site template (`.page-content`, tabs with `data-tab`). Content that two lessons repeat is NOT removed by
the tool; do it with a `post` hook (example: the repeated -ing / -ed spelling rules of the tense pages were replaced by a link to
`englisch-spelling.html`).
