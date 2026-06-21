/* ============================================================
   a1-exercises.js  —  shared interactive exercise engine
   ============================================================ */
(function () {
  'use strict';

  /* ── helpers ── */
  function norm(s) {
    return (s || '').trim().replace(/\s+/g, ' ').toLowerCase()
      .replace(/[.,!?;:]/g, '');
  }
  function shake(el) {
    el.classList.remove('ex-shake');
    void el.offsetWidth;
    el.classList.add('ex-shake');
    setTimeout(() => el.classList.remove('ex-shake'), 450);
  }
  function scoreColor(ok, total) {
    if (ok === total) return '#3fb950';
    if (ok >= total * 0.6) return '#e3b341';
    return '#f85149';
  }

  /* ════════════════════════════════════════
     1. FLIP CARDS
  ════════════════════════════════════════ */
  document.querySelectorAll('.flip-card').forEach(card => {
    card.addEventListener('click', () => {
      card.classList.toggle('flipped');
    });
  });

  /* ════════════════════════════════════════
     2. INLINE CHOICE
  ════════════════════════════════════════ */
  document.querySelectorAll('.ic-blank').forEach(blank => {
    const correct = blank.dataset.correct;
    const opts = blank.querySelectorAll('.ic-opt');
    const item = blank.closest('.ic-item');
    let fb = item ? item.querySelector('.ic-feedback') : null;

    opts.forEach(opt => {
      opt.addEventListener('click', () => {
        if (opt.classList.contains('ic-used') || opt.classList.contains('ic-correct')) return;

        const isCorrect = norm(opt.textContent) === norm(correct);

        if (isCorrect) {
          // replace blank with styled word
          const result = document.createElement('span');
          result.className = 'ic-result-word';
          result.textContent = opt.textContent;
          blank.replaceWith(result);
          if (item) {
            item.classList.add('ic-solved-ok');
            // check if all blanks in this item are solved
            const remaining = item.querySelectorAll('.ic-blank').length;
            if (remaining === 0 && fb) {
              fb.textContent = '✅ Richtig!';
              fb.className = 'ic-feedback ok';
            }
          }
        } else {
          opt.classList.add('ic-wrong');
          setTimeout(() => opt.classList.remove('ic-wrong'), 700);
          if (item) {
            shake(item);
            item.classList.add('ic-solved-err');
          }
          if (fb) {
            fb.textContent = '❌ Versuch es nochmal!';
            fb.className = 'ic-feedback err';
            setTimeout(() => {
              if (fb.classList.contains('err')) { fb.textContent = ''; fb.className = 'ic-feedback'; }
            }, 1800);
          }
        }
      });
    });
  });

  /* ════════════════════════════════════════
     3. DRAG & DROP
  ════════════════════════════════════════ */
  let draggedChip = null;

  document.querySelectorAll('.dd-chip').forEach(chip => {
    chip.addEventListener('dragstart', e => {
      if (chip.classList.contains('used')) { e.preventDefault(); return; }
      draggedChip = chip;
      chip.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', chip.dataset.word || chip.textContent.trim());
    });
    chip.addEventListener('dragend', () => {
      chip.classList.remove('dragging');
      draggedChip = null;
    });
  });

  document.querySelectorAll('.dd-slot').forEach(slot => {
    slot.addEventListener('dragover', e => {
      e.preventDefault();
      slot.classList.add('drag-over');
    });
    slot.addEventListener('dragleave', () => slot.classList.remove('drag-over'));
    slot.addEventListener('drop', e => {
      e.preventDefault();
      slot.classList.remove('drag-over');
      if (!draggedChip || slot.classList.contains('filled')) return;
      const word = draggedChip.textContent.trim();
      slot.textContent = word;
      slot.dataset.filled = word;
      slot.classList.add('filled');
      draggedChip.classList.add('used');
      draggedChip.dataset.inSlot = slot.dataset.slotId || '';
      slot.dataset.chipRef = draggedChip.dataset.word || word;
      // click slot to remove
      slot.addEventListener('click', slotClickRemove);
    });
  });

  function slotClickRemove() {
    const slot = this;
    if (!slot.classList.contains('filled')) return;
    if (slot.classList.contains('slot-ok') || slot.classList.contains('slot-err')) return;
    const word = slot.dataset.chipRef;
    // restore chip
    document.querySelectorAll('.dd-chip').forEach(c => {
      if ((c.dataset.word || c.textContent.trim()) === word && c.classList.contains('used')) {
        c.classList.remove('used');
      }
    });
    slot.textContent = '___';
    slot.dataset.filled = '';
    slot.dataset.chipRef = '';
    slot.classList.remove('filled');
    slot.removeEventListener('click', slotClickRemove);
  }

  document.querySelectorAll('.dd-btn-check').forEach(btn => {
    btn.addEventListener('click', () => {
      const block = btn.closest('.ex-block');
      const slots = block.querySelectorAll('.dd-slot');
      let ok = 0;
      slots.forEach(slot => {
        const ans = (slot.dataset.answer || '').trim();
        const filled = (slot.dataset.filled || '').trim();
        if (!filled) return;
        if (norm(filled) === norm(ans)) {
          slot.classList.add('slot-ok'); ok++;
        } else {
          slot.classList.add('slot-err');
          setTimeout(() => slot.classList.remove('slot-err'), 450);
        }
      });
      const total = slots.length;
      const scoreEl = block.querySelector('.ex-score');
      if (scoreEl) {
        scoreEl.innerHTML = `<span style="color:${scoreColor(ok,total)};font-weight:700">${ok}/${total}</span> richtig`;
        if (ok === total) scoreEl.innerHTML += ' 🎉';
      }
      btn.disabled = true;
    });
  });

  document.querySelectorAll('.dd-btn-reset').forEach(btn => {
    btn.addEventListener('click', () => {
      const block = btn.closest('.ex-block');
      block.querySelectorAll('.dd-slot').forEach(slot => {
        slot.textContent = '___';
        slot.dataset.filled = '';
        slot.dataset.chipRef = '';
        slot.classList.remove('filled','slot-ok','slot-err');
        slot.removeEventListener('click', slotClickRemove);
      });
      block.querySelectorAll('.dd-chip').forEach(c => c.classList.remove('used'));
      const scoreEl = block.querySelector('.ex-score');
      if (scoreEl) scoreEl.innerHTML = '';
      const checkBtn = block.querySelector('.dd-btn-check');
      if (checkBtn) checkBtn.disabled = false;
    });
  });

  /* ════════════════════════════════════════
     4. SENTENCE SORT
  ════════════════════════════════════════ */
  document.querySelectorAll('.ss-item').forEach(item => {
    const bank    = item.querySelector('.ss-bank');
    const ansRow  = item.querySelector('.ss-answer-row');
    const fb      = item.querySelector('.ss-feedback');
    const correct = (item.dataset.answer || '').trim();

    // bank → answer row
    bank.querySelectorAll('.ss-word').forEach(word => {
      word.addEventListener('click', () => {
        if (word.classList.contains('ss-used')) return;
        word.classList.add('ss-used');
        const clone = word.cloneNode(true);
        clone.classList.remove('ss-used');
        ansRow.appendChild(clone);
        // click clone to remove
        clone.addEventListener('click', () => {
          ansRow.removeChild(clone);
          word.classList.remove('ss-used');
        });
      });
    });
  });

  document.querySelectorAll('.ss-btn-check').forEach(btn => {
    btn.addEventListener('click', () => {
      const item    = btn.closest('.ss-item');
      const ansRow  = item.querySelector('.ss-answer-row');
      const fb      = item.querySelector('.ss-feedback');
      const correct = (item.dataset.answer || '').trim();
      const words   = [...ansRow.querySelectorAll('.ss-word')].map(w => w.textContent.trim());
      const answer  = words.join(' ');

      if (norm(answer) === norm(correct)) {
        item.classList.add('ss-ok');
        ansRow.querySelectorAll('.ss-word').forEach(w => w.classList.add('ss-ok-word'));
        fb.textContent = '✅ Perfekt! Richtige Reihenfolge!';
        fb.className = 'ss-feedback ok';
      } else {
        item.classList.add('ss-err');
        ansRow.querySelectorAll('.ss-word').forEach(w => w.classList.add('ss-err-word'));
        fb.textContent = '❌ Nicht ganz — versuch es nochmal!';
        fb.className = 'ss-feedback err';
        setTimeout(() => {
          item.classList.remove('ss-err');
          ansRow.querySelectorAll('.ss-word').forEach(w => w.classList.remove('ss-err-word'));
        }, 600);
      }
    });
  });

  document.querySelectorAll('.ss-btn-reset').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.ss-item');
      const ansRow = item.querySelector('.ss-answer-row');
      const bank   = item.querySelector('.ss-bank');
      const fb     = item.querySelector('.ss-feedback');
      [...ansRow.querySelectorAll('.ss-word')].forEach(w => ansRow.removeChild(w));
      bank.querySelectorAll('.ss-word').forEach(w => w.classList.remove('ss-used'));
      item.classList.remove('ss-ok','ss-err');
      if (fb) { fb.textContent = ''; fb.className = 'ss-feedback'; }
    });
  });

  /* ════════════════════════════════════════
     5. FILL INPUT
  ════════════════════════════════════════ */
  document.querySelectorAll('.fi-btn-check').forEach(btn => {
    btn.addEventListener('click', () => {
      const item    = btn.closest('.fi-item');
      const input   = item.querySelector('.fi-input');
      const fb      = item.querySelector('.fi-feedback');
      const answers = (item.dataset.answers || '').split('|').map(s => s.trim());
      const explain = item.dataset.explain || '';
      const val = input.value.trim();

      if (!val) {
        if (fb) { fb.textContent = '✏️ Schreib zuerst eine Antwort!'; fb.className = 'fi-feedback err'; }
        return;
      }

      const correct = answers.some(a => norm(val) === norm(a));

      if (correct) {
        item.classList.add('fi-ok'); item.classList.remove('fi-err');
        if (fb) { fb.innerHTML = '✅ Richtig! Super!'; fb.className = 'fi-feedback ok'; }
      } else {
        item.classList.add('fi-err'); item.classList.remove('fi-ok');
        if (fb) { fb.innerHTML = '❌ Nicht ganz — Antwort zeigen?'; fb.className = 'fi-feedback err'; }
      }
      input.disabled = true;
      btn.disabled = true;
      if (explain) {
        const note = item.querySelector('.fi-answer-note');
        if (note && !note.innerHTML) note.innerHTML = explain;
      }
    });
  });

  document.querySelectorAll('.fi-btn-show').forEach(btn => {
    btn.addEventListener('click', () => {
      const item  = btn.closest('.fi-item');
      const input = item.querySelector('.fi-input');
      const check = item.querySelector('.fi-btn-check');
      const explain = item.dataset.explain || '';
      input.disabled = true;
      if (check) check.disabled = true;
      btn.disabled = true;
      item.classList.add('show-ans','revealed');
      if (explain) {
        const note = item.querySelector('.fi-answer-note');
        if (note && !note.innerHTML) note.innerHTML = explain;
      }
    });
  });

  /* enter key on fi-input */
  document.querySelectorAll('.fi-input').forEach(inp => {
    inp.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        const btn = inp.closest('.fi-item')?.querySelector('.fi-btn-check');
        if (btn && !btn.disabled) btn.click();
      }
    });
  });

  /* ════════════════════════════════════════
     6. KNOWLEDGE QUIZ
  ════════════════════════════════════════ */
  document.querySelectorAll('.kq-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.kq-item');
      if (item.classList.contains('kq-done')) return;
      item.classList.add('kq-done');
      const correct = btn.dataset.correct === 'true';
      item.querySelectorAll('.kq-btn').forEach(b => {
        b.disabled = true;
        if (b.dataset.correct === 'true') b.classList.add('kq-ok');
      });
      if (!correct) btn.classList.add('kq-err');
      item.classList.add(correct ? 'kq-done-ok' : 'kq-done-err');
      const ex = item.closest('.kq-exercise');
      if (ex) {
        const done  = ex.querySelectorAll('.kq-done').length;
        const total = ex.querySelectorAll('.kq-item').length;
        const good  = ex.querySelectorAll('.kq-done-ok').length;
        let sc = ex.querySelector('.kq-score');
        if (!sc) { sc = document.createElement('p'); sc.className = 'kq-score'; ex.appendChild(sc); }
        sc.innerHTML = `${good}/${done} richtig` + (done === total && good === total ? ' 🎉' : '');
      }
    });
  });

})();
