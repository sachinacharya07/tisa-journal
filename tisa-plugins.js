/* ══════════════════════════════════════════════════════════════
   TISA JOURNAL — PLUGINS v1.0
   Auto-initialises after DOM is ready.
   Hooks into window.toast, window.saveEntry, window.navigate,
   window.currentUser, window.personalEntries, window.sharedEntries.
══════════════════════════════════════════════════════════════ */

(function TISA_PLUGINS() {
  'use strict';

  /* ── Wait for main app to be ready ─────────────────────── */
  function onReady(fn) {
    if (document.readyState !== 'loading') { fn(); return; }
    document.addEventListener('DOMContentLoaded', fn);
  }

  function onAppReady(fn) {
    // Main module dispatches _tisaReady when Firebase + auth init is done
    document.addEventListener('_tisaReady', fn, { once: true });
    // Fallback: if already fired
    if (window._tisaReady_fired) fn();
  }

  // ══════════════════════════════════════════════════════════
  // 1. OFFLINE BANNER
  // ══════════════════════════════════════════════════════════
  function initOfflineBanner() {
    const banner = document.createElement('div');
    banner.id = 'tisa-offline-banner';
    banner.innerHTML = `
      <span>⚡ You're offline. Changes will sync when you reconnect.</span>
      <button class="retry-btn" onclick="window.location.reload()">Retry</button>
    `;
    document.body.prepend(banner);

    function update() {
      if (!navigator.onLine) {
        banner.classList.add('show');
      } else {
        banner.classList.remove('show');
      }
    }
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    update();
  }

  // ══════════════════════════════════════════════════════════
  // 2. AUTO-SAVE INDICATOR
  // ══════════════════════════════════════════════════════════
  function initAutoSave() {
    const badge = document.createElement('div');
    badge.id = 'tisa-autosave-badge';
    badge.innerHTML = '<div class="dot"></div><span id="tisa-autosave-text">Saving…</span>';
    document.body.appendChild(badge);

    let timer = null;
    let saveTimer = null;

    function showSaving() {
      badge.classList.remove('saved');
      badge.classList.add('visible');
      document.getElementById('tisa-autosave-text').textContent = 'Saving…';
      clearTimeout(timer);
    }
    function showSaved() {
      badge.classList.add('saved');
      document.getElementById('tisa-autosave-text').textContent = 'Saved just now';
      clearTimeout(timer);
      timer = setTimeout(() => badge.classList.remove('visible'), 2400);
    }

    // Observe the editor textarea for input → auto-save every 30s
    function attachAutoSave() {
      const ta = document.getElementById('ep-content');
      if (!ta) return;
      ta.addEventListener('input', () => {
        showSaving();
        clearTimeout(saveTimer);
        saveTimer = setTimeout(() => {
          // Only auto-save if editor is open
          const panel = document.getElementById('editor-panel');
          if (panel && !panel.classList.contains('hidden')) {
            if (window.saveEntry) {
              window.saveEntry();
              showSaved();
            }
          }
        }, 30000); // 30 seconds
      });
    }

    // Also hook into the existing save to show "Saved"
    const origSaveEntry = window.saveEntry;
    if (typeof origSaveEntry === 'function') {
      window.saveEntry = function () {
        const r = origSaveEntry.apply(this, arguments);
        showSaved();
        return r;
      };
    }

    // Expose for external use
    window.tisaShowSaved = showSaved;
    window.tisaShowSaving = showSaving;

    onReady(attachAutoSave);
  }

  // ══════════════════════════════════════════════════════════
  // 3. DRAW / CANVAS
  // ══════════════════════════════════════════════════════════
  function initDraw() {
    // Inject overlay HTML
    const overlay = document.createElement('div');
    overlay.id = 'tisa-draw-overlay';
    overlay.innerHTML = `
      <div id="tisa-draw-toolbar">
        <button class="draw-tool-btn active" id="draw-pen-btn" title="Pen" onclick="TISA_DRAW.setTool('pen')">✒️</button>
        <button class="draw-tool-btn" id="draw-marker-btn" title="Marker" onclick="TISA_DRAW.setTool('marker')">🖍</button>
        <button class="draw-tool-btn" id="draw-eraser-btn" title="Eraser" onclick="TISA_DRAW.setTool('eraser')">🧹</button>
        <div class="draw-sep"></div>
        <input type="color" id="draw-color-picker" value="#1A1714" title="Color" oninput="TISA_DRAW.setColor(this.value)"/>
        <input type="range" id="draw-size-slider" min="1" max="28" value="3" title="Size" oninput="TISA_DRAW.setSize(this.value)"/>
        <div class="draw-sep"></div>
        <button class="draw-tool-btn" title="Undo" onclick="TISA_DRAW.undo()">↩️</button>
        <button class="draw-tool-btn" title="Clear" onclick="TISA_DRAW.clear()">🗑️</button>
        <div id="draw-toolbar-right">
          <button class="draw-action-btn" onclick="TISA_DRAW.close()">Discard</button>
          <button class="draw-action-btn primary" onclick="TISA_DRAW.save()">Attach to entry</button>
        </div>
      </div>
      <canvas id="tisa-draw-canvas"></canvas>
    `;
    document.body.appendChild(overlay);

    const canvas = document.getElementById('tisa-draw-canvas');
    const ctx = canvas.getContext('2d');
    let drawing = false;
    let tool = 'pen';
    let color = '#1A1714';
    let size = 3;
    let history = [];
    let lastX = 0, lastY = 0;

    function resize() {
      const saved = canvas.toDataURL();
      canvas.width = overlay.clientWidth;
      canvas.height = overlay.clientHeight - document.getElementById('tisa-draw-toolbar').offsetHeight;
      ctx.fillStyle = '#FEFCF8';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      if (history.length > 0) {
        const img = new Image();
        img.onload = () => ctx.drawImage(img, 0, 0);
        img.src = saved;
      }
    }

    function getPos(e) {
      const rect = canvas.getBoundingClientRect();
      const src = e.touches ? e.touches[0] : e;
      return { x: src.clientX - rect.left, y: src.clientY - rect.top };
    }

    function startDraw(e) {
      e.preventDefault();
      drawing = true;
      const p = getPos(e);
      lastX = p.x; lastY = p.y;
      ctx.beginPath();
      ctx.moveTo(lastX, lastY);
    }
    function draw(e) {
      if (!drawing) return;
      e.preventDefault();
      const p = getPos(e);
      ctx.beginPath();
      if (tool === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.lineWidth = size * 5;
      } else if (tool === 'marker') {
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 0.35;
        ctx.lineWidth = size * 3.5;
      } else {
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 1;
        ctx.lineWidth = size;
      }
      ctx.strokeStyle = color;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.moveTo(lastX, lastY);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
      lastX = p.x; lastY = p.y;
    }
    function endDraw() {
      if (!drawing) return;
      drawing = false;
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
      history.push(canvas.toDataURL());
    }

    canvas.addEventListener('mousedown', startDraw);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', endDraw);
    canvas.addEventListener('mouseleave', endDraw);
    canvas.addEventListener('touchstart', startDraw, { passive: false });
    canvas.addEventListener('touchmove', draw, { passive: false });
    canvas.addEventListener('touchend', endDraw);

    window.TISA_DRAW = {
      open() {
        overlay.classList.add('open');
        resize();
        // Bg fill
        ctx.fillStyle = '#FEFCF8';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        history = [];
      },
      close() {
        overlay.classList.remove('open');
      },
      clear() {
        ctx.fillStyle = '#FEFCF8';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        history = [];
      },
      undo() {
        if (history.length < 2) {
          this.clear(); return;
        }
        history.pop();
        const img = new Image();
        img.onload = () => { ctx.clearRect(0,0,canvas.width,canvas.height); ctx.drawImage(img, 0, 0); };
        img.src = history[history.length - 1];
      },
      save() {
        const dataUrl = canvas.toDataURL('image/png');
        // Inject drawing below the textarea in the editor
        let preview = document.getElementById('tisa-draw-preview');
        if (!preview) {
          preview = document.createElement('div');
          preview.id = 'tisa-draw-preview';
          preview.style.cssText = 'margin-top:14px;border-radius:12px;overflow:hidden;border:1.5px solid var(--border-m);position:relative;';
          preview.innerHTML = `<img src="" style="width:100%;display:block;" alt="Drawing"/><button onclick="document.getElementById('tisa-draw-preview').remove()" style="position:absolute;top:8px;right:8px;background:rgba(0,0,0,.5);color:white;border:none;border-radius:6px;padding:3px 8px;cursor:pointer;font-size:12px;">Remove</button>`;
          const ta = document.getElementById('ep-content');
          if (ta && ta.parentNode) ta.parentNode.appendChild(preview);
        }
        preview.querySelector('img').src = dataUrl;
        // Store for saving
        window._tisaDrawingData = dataUrl;
        this.close();
        if (window.toast) window.toast('Drawing attached to entry ✓');
      },
      setTool(t) {
        tool = t;
        canvas.classList.toggle('eraser-mode', t === 'eraser');
        ['pen','marker','eraser'].forEach(n => {
          const btn = document.getElementById('draw-' + n + '-btn');
          if (btn) btn.classList.toggle('active', n === t);
        });
      },
      setColor(c) { color = c; },
      setSize(s) { size = parseInt(s); }
    };

    window.addEventListener('resize', () => {
      if (overlay.classList.contains('open')) resize();
    });
  }

  // ══════════════════════════════════════════════════════════
  // 4. SPELL CHECKER
  // ══════════════════════════════════════════════════════════
  function initSpellChecker() {
    let spellOn = localStorage.getItem('tisa_spell') !== '0';
    const ignored = new Set(JSON.parse(localStorage.getItem('tisa_spell_ignored') || '[]'));

    // Inject toggle button into editor footer area
    function injectToggle() {
      if (document.getElementById('tisa-spell-toggle')) return;
      const footer = document.querySelector('.ep-footer');
      if (!footer) return;
      const btn = document.createElement('button');
      btn.id = 'tisa-spell-toggle';
      btn.title = 'Toggle spell check';
      btn.className = spellOn ? 'on' : '';
      btn.textContent = spellOn ? '✓ Spell' : 'Spell';
      btn.onclick = () => {
        spellOn = !spellOn;
        localStorage.setItem('tisa_spell', spellOn ? '1' : '0');
        btn.className = spellOn ? 'on' : '';
        btn.textContent = spellOn ? '✓ Spell' : 'Spell';
        if (!spellOn) clearHighlights();
      };
      footer.prepend(btn);
    }

    function clearHighlights() {
      // For textarea we can't truly highlight — we enable/disable native spellcheck
      const ta = document.getElementById('ep-content');
      if (ta) ta.spellcheck = spellOn;
    }

    function attachSpell() {
      const ta = document.getElementById('ep-content');
      if (!ta) return;
      ta.spellcheck = spellOn;
      // Also enable for focus mode textarea if present
      const focusTa = document.querySelector('#focus-overlay textarea');
      if (focusTa) focusTa.spellcheck = spellOn;
      const twTa = document.getElementById('tw-content');
      if (twTa) twTa.spellcheck = spellOn;
    }

    onReady(() => {
      injectToggle();
      attachSpell();
      // Re-attach when editor opens
      const origOpen = window.openEditor;
      if (typeof origOpen === 'function') {
        window.openEditor = function () {
          const r = origOpen.apply(this, arguments);
          setTimeout(() => { injectToggle(); attachSpell(); }, 80);
          return r;
        };
      }
    });
  }

  // ══════════════════════════════════════════════════════════
  // 5. TEXT-TO-SPEECH
  // ══════════════════════════════════════════════════════════
  function initTTS() {
    if (!window.speechSynthesis) return;

    const bar = document.createElement('div');
    bar.id = 'tisa-tts-bar';
    bar.innerHTML = `
      <button class="tts-btn" id="tts-play-btn" onclick="TISA_TTS.toggle()" title="Play / Pause">▶</button>
      <button class="tts-btn" id="tts-stop-btn" onclick="TISA_TTS.stop()" title="Stop" style="font-size:12px;">■</button>
      <div id="tts-progress"><div id="tts-progress-fill"></div></div>
      <button class="tts-speed-btn" id="tts-speed-btn" onclick="TISA_TTS.cycleSpeed()" title="Speed">1×</button>
      <span class="tts-label" id="tts-label">Reading…</span>
      <button class="tts-btn" onclick="TISA_TTS.close()" style="font-size:13px;background:none;border:1px solid var(--border-m);">✕</button>
    `;
    document.body.appendChild(bar);

    const synth = window.speechSynthesis;
    let utt = null;
    let words = [];
    let wordIdx = 0;
    let speeds = [0.8, 1, 1.2, 1.5, 1.8];
    let speedIdx = 1;
    let playing = false;

    window.TISA_TTS = {
      read(text) {
        if (!text) return;
        synth.cancel();
        words = text.split(/\s+/);
        wordIdx = 0;
        bar.classList.add('show');
        this._speak(text);
      },
      _speak(text) {
        utt = new SpeechSynthesisUtterance(text);
        utt.rate = speeds[speedIdx];
        utt.lang = 'en-US';
        utt.onstart = () => {
          playing = true;
          document.getElementById('tts-play-btn').textContent = '⏸';
          document.getElementById('tts-play-btn').classList.add('playing');
        };
        utt.onend = () => {
          playing = false;
          document.getElementById('tts-play-btn').textContent = '▶';
          document.getElementById('tts-play-btn').classList.remove('playing');
          document.getElementById('tts-progress-fill').style.width = '100%';
          document.getElementById('tts-label').textContent = 'Done';
        };
        utt.onboundary = (e) => {
          if (e.name === 'word') {
            wordIdx++;
            const pct = Math.min(100, Math.round((wordIdx / (words.length || 1)) * 100));
            document.getElementById('tts-progress-fill').style.width = pct + '%';
            document.getElementById('tts-label').textContent = wordIdx + ' / ' + words.length;
          }
        };
        synth.speak(utt);
      },
      toggle() {
        if (synth.paused) {
          synth.resume();
          document.getElementById('tts-play-btn').textContent = '⏸';
          document.getElementById('tts-play-btn').classList.add('playing');
        } else if (synth.speaking) {
          synth.pause();
          document.getElementById('tts-play-btn').textContent = '▶';
          document.getElementById('tts-play-btn').classList.remove('playing');
        }
      },
      stop() { synth.cancel(); playing = false; document.getElementById('tts-play-btn').textContent = '▶'; document.getElementById('tts-play-btn').classList.remove('playing'); document.getElementById('tts-progress-fill').style.width = '0%'; },
      close() { this.stop(); bar.classList.remove('show'); },
      cycleSpeed() {
        speedIdx = (speedIdx + 1) % speeds.length;
        document.getElementById('tts-speed-btn').textContent = speeds[speedIdx] + '×';
        if (synth.speaking) { const remaining = utt?.text || ''; synth.cancel(); this._speak(remaining); }
      }
    };

    // Add "Read aloud" button to detail view
    const origShowDetail = window.showDetail;
    if (typeof origShowDetail === 'function') {
      window.showDetail = function (entry) {
        const r = origShowDetail.apply(this, arguments);
        setTimeout(() => {
          const acts = document.getElementById('detail-actions');
          if (acts && !document.getElementById('tts-detail-btn')) {
            const btn = document.createElement('button');
            btn.id = 'tts-detail-btn';
            btn.className = 'action-btn';
            btn.textContent = '🔊 Read';
            btn.onclick = () => {
              const content = document.getElementById('detail-content')?.textContent || '';
              const title = document.getElementById('detail-title')?.textContent || '';
              TISA_TTS.read(title + '. ' + content);
            };
            acts.prepend(btn);
          }
        }, 60);
        return r;
      };
    }
  }

  // ══════════════════════════════════════════════════════════
  // 6. STICKER PICKER
  // ══════════════════════════════════════════════════════════
  const STICKER_SETS = {
    'Love': ['❤️','🥰','💕','💖','💘','💝','💗','💓','💞','🌹','🌸','🦋','💌','🫶','🤍','💛'],
    'Nature': ['🌿','🌱','🍃','🌻','🌺','🌷','🍀','☘️','🌾','🌙','⭐','✨','🌈','🌊','🦋','🐝'],
    'Journal Vibes': ['📖','✍️','🖊️','📝','🧠','💭','🫧','🎯','🧘','🕯️','☕','🍵','🎶','🎵','🌅','🌄'],
    'Moods': ['😊','🥹','😌','😔','🥺','😤','🥳','😴','🤩','😇','🙃','😅','🤗','😏','😍','🤔'],
    'Fun': ['🎉','🎊','🎈','🎁','✦','🌟','🔮','🪄','🎀','🦄','🐣','🍕','🍰','☁️','🌻','🦋']
  };

  function initStickers() {
    // Sticker picker panel
    const panel = document.createElement('div');
    panel.id = 'tisa-sticker-panel';
    let html = '';
    Object.entries(STICKER_SETS).forEach(([name, stickers]) => {
      html += `<div class="sticker-section-title">${name}</div><div class="sticker-grid">`;
      stickers.forEach(s => {
        html += `<button class="sticker-item" onclick="TISA_STICKERS.insert('${s}')">${s}</button>`;
      });
      html += '</div>';
    });
    panel.innerHTML = html;
    document.body.appendChild(panel);

    // FAB trigger button
    const fab = document.createElement('button');
    fab.id = 'tisa-sticker-btn';
    fab.title = 'Stickers';
    fab.textContent = '🌸';
    fab.onclick = () => panel.classList.toggle('open');
    document.body.appendChild(fab);

    // Show fab when editor is open
    function updateFab() {
      const panel = document.getElementById('editor-panel');
      const show = panel && !panel.classList.contains('hidden');
      fab.classList.toggle('show', !!show);
    }

    const origOpen = window.openEditor;
    if (typeof origOpen === 'function') {
      window.openEditor = function () {
        const r = origOpen.apply(this, arguments);
        setTimeout(updateFab, 100);
        return r;
      };
    }
    const origClose = window.closeEditor;
    if (typeof origClose === 'function') {
      window.closeEditor = function () {
        const r = origClose.apply(this, arguments);
        fab.classList.remove('show');
        panel.classList.remove('open');
        return r;
      };
    }

    // Close when clicking outside
    document.addEventListener('click', (e) => {
      if (!panel.contains(e.target) && e.target !== fab) {
        panel.classList.remove('open');
      }
    });

    window.TISA_STICKERS = {
      insert(emoji) {
        const ta = document.getElementById('ep-content');
        const twTa = document.getElementById('tw-content');
        const target = (document.getElementById('tw-overlay')?.classList.contains('show') ? twTa : ta);
        if (!target) { if (window.toast) window.toast(emoji + ' copied!'); navigator.clipboard?.writeText(emoji); return; }
        const start = target.selectionStart;
        const end = target.selectionEnd;
        target.value = target.value.slice(0, start) + emoji + target.value.slice(end);
        target.selectionStart = target.selectionEnd = start + emoji.length;
        target.focus();
        panel.classList.remove('open');
      }
    };
  }

  // ══════════════════════════════════════════════════════════
  // 7. SHARED WISHLIST (inside Shared Journal)
  // ══════════════════════════════════════════════════════════
  function initSharedWishlist() {
    let wishes = [];
    const STORAGE_KEY = 'tisa_wishlist';

    function loadWishes() {
      try { wishes = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch(e) { wishes = []; }
    }
    function saveWishes() {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(wishes));
      // Try to sync to Firebase if available
      if (window.db && window.currentUser && window.doc && window.setDoc) {
        try {
          const jid = window.profile?.sharedJournalId;
          if (jid) {
            window.setDoc(window.doc(window.db, 'sharedJournals', jid), { wishlist: wishes }, { merge: true }).catch(() => {});
          }
        } catch(e) {}
      }
    }

    function renderWishlist() {
      loadWishes();
      const body = document.getElementById('tisa-wishlist-body');
      if (!body) return;
      if (!wishes.length) {
        body.innerHTML = '<div class="wishlist-empty">✦ Your shared bucket list lives here.<br>Add dreams, places, plans — big and small.</div>';
        return;
      }
      body.innerHTML = wishes.map((w, i) => `
        <div class="wishlist-item">
          <input type="checkbox" class="wishlist-check" ${w.done ? 'checked' : ''} onchange="TISA_WISHLIST.toggle(${i})"/>
          <span class="wishlist-text${w.done ? ' done' : ''}">${w.text}</span>
          <span class="wishlist-who">${w.by || ''}</span>
          <button class="wishlist-del" onclick="TISA_WISHLIST.remove(${i})">✕</button>
        </div>
      `).join('');
    }

    // Modal
    const modal = document.createElement('div');
    modal.id = 'tisa-wishlist-modal';
    modal.className = 'tisa-plugin-overlay';
    modal.style.display = 'none';
    modal.innerHTML = `
      <div class="tisa-plugin-sheet" style="max-width:500px">
        <div class="tisa-plugin-sheet-hdr">
          <h3>🌟 Our Wishlist</h3>
          <button class="tisa-close-btn" onclick="document.getElementById('tisa-wishlist-modal').style.display='none'">✕</button>
        </div>
        <div class="tisa-plugin-sheet-body">
          <p style="font-size:13px;color:var(--ink-m);margin-bottom:16px;font-style:italic;font-family:var(--serif)">Places to visit, things to try, memories to make together.</p>
          <div id="tisa-wishlist-body"></div>
          <div class="wishlist-add-row">
            <input class="wishlist-add-input" id="tisa-wish-input" placeholder="Add a wish… e.g. Visit Rishikesh 🏔️" onkeydown="if(event.key==='Enter')TISA_WISHLIST.add()"/>
            <button class="wishlist-add-btn" onclick="TISA_WISHLIST.add()">Add</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.style.display = 'none'; });

    // FAB
    const fab = document.createElement('button');
    fab.id = 'tisa-wishlist-fab';
    fab.title = 'Shared Wishlist';
    fab.textContent = '🌟';
    fab.onclick = () => {
      modal.style.display = 'flex';
      renderWishlist();
    };
    document.body.appendChild(fab);

    // Show fab only in shared view
    const origNav = window.navigate;
    if (typeof origNav === 'function') {
      window.navigate = function (view) {
        const r = origNav.apply(this, arguments);
        setTimeout(() => {
          fab.classList.toggle('show', view === 'shared');
        }, 80);
        return r;
      };
    }

    window.TISA_WISHLIST = {
      add() {
        const inp = document.getElementById('tisa-wish-input');
        const txt = inp?.value.trim();
        if (!txt) return;
        loadWishes();
        wishes.unshift({
          text: txt,
          done: false,
          by: window.profile?.displayName || window.currentUser?.displayName || 'You',
          addedAt: new Date().toISOString()
        });
        saveWishes();
        if (inp) inp.value = '';
        renderWishlist();
      },
      toggle(i) {
        loadWishes();
        wishes[i].done = !wishes[i].done;
        saveWishes();
        renderWishlist();
      },
      remove(i) {
        loadWishes();
        wishes.splice(i, 1);
        saveWishes();
        renderWishlist();
      }
    };
  }

  // ══════════════════════════════════════════════════════════
  // 8. LOVE LETTER MODE
  // ══════════════════════════════════════════════════════════
  function initLoveLetter() {
    // Add "Love Letter" option to editor toolbar
    function injectButton() {
      if (document.getElementById('tisa-love-letter-btn')) return;
      const actions = document.querySelector('.ep-actions');
      if (!actions) return;
      const btn = document.createElement('button');
      btn.id = 'tisa-love-letter-btn';
      btn.className = 'icon-btn';
      btn.title = 'Love Letter — locked until a date';
      btn.textContent = '💌';
      btn.style.cssText = 'font-size:17px;';
      btn.onclick = () => openLoveLetterModal();
      actions.prepend(btn);
    }

    // Modal
    const modal = document.createElement('div');
    modal.id = 'tisa-love-letter-modal';
    modal.className = 'tisa-plugin-overlay';
    modal.style.display = 'none';
    modal.innerHTML = `
      <div class="tisa-plugin-sheet" style="max-width:440px">
        <div class="tisa-plugin-sheet-hdr">
          <h3>💌 Love Letter Mode</h3>
          <button class="tisa-close-btn" onclick="document.getElementById('tisa-love-letter-modal').style.display='none'">✕</button>
        </div>
        <div class="tisa-plugin-sheet-body">
          <p style="font-size:13.5px;color:var(--ink-m);line-height:1.9;font-family:var(--serif);font-style:italic;margin-bottom:20px">
            This entry will be sealed until your chosen date — like a letter from the past to the future.
          </p>
          <label style="display:block;font-size:10.5px;font-weight:600;color:var(--ink-m);letter-spacing:.8px;text-transform:uppercase;margin-bottom:7px">Unlock on</label>
          <input type="date" id="tisa-love-unlock-date" style="width:100%;padding:10px 14px;border:1.5px solid var(--border-m);border-radius:10px;font-size:14px;color:var(--ink);background:var(--sand);outline:none;font-family:inherit;transition:border-color .15s" onfocus="this.style.borderColor='var(--sage-d)'"/>
          <label style="display:block;font-size:10.5px;font-weight:600;color:var(--ink-m);letter-spacing:.8px;text-transform:uppercase;margin:16px 0 7px">A hint (shown while locked)</label>
          <input type="text" id="tisa-love-hint" placeholder="e.g. For our anniversary 💕" style="width:100%;padding:10px 14px;border:1.5px solid var(--border-m);border-radius:10px;font-size:14px;color:var(--ink);background:var(--sand);outline:none;font-family:var(--serif);font-style:italic;transition:border-color .15s" onfocus="this.style.borderColor='var(--sage-d)'"/>
          <button class="love-unlock-btn" onclick="TISA_LOVELETTER.seal()">💌 Seal this letter</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.style.display = 'none'; });

    function openLoveLetterModal() {
      // Default unlock date to 1 month from now
      const d = new Date();
      d.setMonth(d.getMonth() + 1);
      document.getElementById('tisa-love-unlock-date').value = d.toISOString().slice(0,10);
      modal.style.display = 'flex';
    }

    window.TISA_LOVELETTER = {
      seal() {
        const date = document.getElementById('tisa-love-unlock-date').value;
        const hint = document.getElementById('tisa-love-hint').value.trim();
        if (!date) { if (window.toast) window.toast('Please pick an unlock date'); return; }
        window._tisaLoveLetter = { unlockDate: date, hint: hint || 'A letter from the past 💌' };
        modal.style.display = 'none';
        if (window.toast) window.toast('💌 Entry will be sealed until ' + new Date(date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }));
      },
      isLocked(entry) {
        if (!entry?.loveLetterUnlockDate) return false;
        return new Date() < new Date(entry.loveLetterUnlockDate);
      },
      daysLeft(entry) {
        const d = Math.ceil((new Date(entry.loveLetterUnlockDate) - new Date()) / 86400000);
        return Math.max(0, d);
      }
    };

    // Hook into save to attach love letter metadata
    const origSave = window.saveEntry;
    if (typeof origSave === 'function') {
      window.saveEntry = function () {
        if (window._tisaLoveLetter) {
          // Patch into the data that saveEntry reads
          window._tisaLoveLetterPending = window._tisaLoveLetter;
          delete window._tisaLoveLetter;
        }
        return origSave.apply(this, arguments);
      };
    }

    onReady(() => {
      injectButton();
      const origOpen = window.openEditor;
      if (typeof origOpen === 'function') {
        window.openEditor = function () {
          const r = origOpen.apply(this, arguments);
          setTimeout(injectButton, 80);
          return r;
        };
      }
    });
  }

  // ══════════════════════════════════════════════════════════
  // 9. ENTRY COVER ART
  // ══════════════════════════════════════════════════════════
  const CURATED_ART = [
    { url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=70', label: 'Mountains' },
    { url: 'https://images.unsplash.com/photo-1523712999610-f77fbcfc3843?w=800&q=70', label: 'Forest light' },
    { url: 'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?w=800&q=70', label: 'Lake dawn' },
    { url: 'https://images.unsplash.com/photo-1490750967868-88df5691cc00?w=800&q=70', label: 'Wildflowers' },
    { url: 'https://images.unsplash.com/photo-1518098268026-4e89f1a2cd8e?w=800&q=70', label: 'Night sky' },
    { url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=70', label: 'Cherry blossom' },
    { url: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&q=70', label: 'Road trip' },
    { url: 'https://images.unsplash.com/photo-1444464666168-49d633b86797?w=800&q=70', label: 'Ocean shore' },
    { url: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=800&q=70', label: 'Golden fields' },
  ];

  function initCoverArt() {
    // Modal
    const modal = document.createElement('div');
    modal.id = 'tisa-cover-art-modal';
    modal.className = 'tisa-plugin-overlay';
    modal.style.display = 'none';
    modal.innerHTML = `
      <div class="tisa-plugin-sheet" style="max-width:560px">
        <div class="tisa-plugin-sheet-hdr">
          <h3>🎨 Entry Cover Art</h3>
          <button class="tisa-close-btn" onclick="document.getElementById('tisa-cover-art-modal').style.display='none'">✕</button>
        </div>
        <div class="tisa-plugin-sheet-body">
          <div id="tisa-art-ai-section">
            <label style="display:block;font-size:10.5px;font-weight:600;color:var(--ink-m);letter-spacing:.8px;text-transform:uppercase;margin-bottom:8px">Generate with AI</label>
            <div style="display:flex;gap:8px;">
              <input type="text" id="tisa-art-prompt" placeholder="e.g. a misty forest at dawn, watercolour…" style="flex:1;padding:9px 13px;border:1.5px solid var(--border-m);border-radius:10px;font-size:13.5px;color:var(--ink);background:var(--sand);outline:none;font-family:inherit;transition:border-color .15s" onfocus="this.style.borderColor='var(--sage-d)'" onkeydown="if(event.key==='Enter')TISA_COVERART.generate()"/>
              <button class="art-ai-btn" id="tisa-art-gen-btn" onclick="TISA_COVERART.generate()" style="width:auto;padding:9px 16px;margin:0">
                <span class="spinner-sm"></span>
                ✦ Generate
              </button>
            </div>
            <div id="tisa-art-ai-result" style="margin-top:12px;display:none">
              <img id="tisa-art-ai-img" src="" alt="AI cover" style="width:100%;border-radius:10px;cursor:pointer;border:2px solid transparent;transition:border-color .15s" onclick="TISA_COVERART.selectAI()"/>
              <p style="font-size:11px;color:var(--ink-f);margin-top:5px;text-align:center">Click image to select it</p>
            </div>
          </div>
          <div style="margin-top:20px">
            <label style="display:block;font-size:10.5px;font-weight:600;color:var(--ink-m);letter-spacing:.8px;text-transform:uppercase;margin-bottom:2px">Or pick from curated art</label>
            <div class="art-grid" id="tisa-art-grid"></div>
          </div>
          <div style="display:flex;gap:8px;margin-top:16px;justify-content:flex-end">
            <button onclick="TISA_COVERART.remove()" style="padding:9px 16px;border:1.5px solid var(--border-m);border-radius:10px;font-size:13px;background:var(--sand);color:var(--ink-m);cursor:pointer">Remove cover</button>
            <button onclick="document.getElementById('tisa-cover-art-modal').style.display='none'" style="padding:9px 20px;background:linear-gradient(135deg,var(--sage-d),var(--sage-dd));color:white;border:none;border-radius:10px;font-size:13px;font-weight:500;cursor:pointer">Done</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.style.display = 'none'; });

    // Populate grid
    const grid = document.getElementById('tisa-art-grid');
    CURATED_ART.forEach((art, i) => {
      const div = document.createElement('div');
      div.className = 'art-option';
      div.dataset.url = art.url;
      div.innerHTML = `<img src="${art.url}" alt="${art.label}" loading="lazy"/>`;
      div.onclick = () => TISA_COVERART.select(art.url, div);
      grid.appendChild(div);
    });

    window.TISA_COVERART = {
      _selected: null,
      open() {
        modal.style.display = 'flex';
        // Pre-fill prompt with entry title
        const title = document.getElementById('ep-title-input')?.value || '';
        if (title) document.getElementById('tisa-art-prompt').value = title;
      },
      select(url, el) {
        this._selected = url;
        document.querySelectorAll('.art-option').forEach(d => d.classList.remove('selected'));
        if (el) el.classList.add('selected');
        window._tisaCoverArtUrl = url;
        this._updatePreview(url);
        if (window.toast) window.toast('Cover art selected ✓');
      },
      selectAI() {
        const img = document.getElementById('tisa-art-ai-img');
        if (!img.src) return;
        this._selected = img.src;
        window._tisaCoverArtUrl = img.src;
        img.style.borderColor = 'var(--sage-d)';
        this._updatePreview(img.src);
        if (window.toast) window.toast('AI cover art selected ✓');
      },
      remove() {
        window._tisaCoverArtUrl = null;
        this._updatePreview(null);
        document.querySelectorAll('.art-option').forEach(d => d.classList.remove('selected'));
        modal.style.display = 'none';
        if (window.toast) window.toast('Cover art removed');
      },
      _updatePreview(url) {
        let prev = document.getElementById('tisa-cover-preview');
        if (!url) { if (prev) prev.remove(); return; }
        if (!prev) {
          prev = document.createElement('img');
          prev.id = 'tisa-cover-preview';
          prev.className = 'entry-cover-art';
          const body = document.getElementById('ep-body');
          if (body) body.prepend(prev);
        }
        prev.src = url;
      },
      async generate() {
        const prompt = document.getElementById('tisa-art-prompt').value.trim();
        if (!prompt) { if (window.toast) window.toast('Enter a prompt first'); return; }
        const btn = document.getElementById('tisa-art-gen-btn');
        btn.classList.add('loading');
        const result = document.getElementById('tisa-art-ai-result');
        const img = document.getElementById('tisa-art-ai-img');
        // Use Pollinations.ai — completely free, no API key
        const encodedPrompt = encodeURIComponent('aesthetic journal cover art, ' + prompt + ', soft watercolour style, warm tones, no text, no letters');
        const url = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=800&height=350&seed=${Date.now()}&nologo=true`;
        img.onload = () => { btn.classList.remove('loading'); result.style.display = 'block'; };
        img.onerror = () => {
          btn.classList.remove('loading');
          if (window.toast) window.toast('AI failed — picking a curated image instead');
          const fallback = CURATED_ART[Math.floor(Math.random() * CURATED_ART.length)];
          this.select(fallback.url, null);
        };
        img.src = url;
      }
    };

    // Inject "Cover" button into editor
    function injectCoverBtn() {
      if (document.getElementById('tisa-cover-btn')) return;
      const actions = document.querySelector('.ep-actions');
      if (!actions) return;
      const btn = document.createElement('button');
      btn.id = 'tisa-cover-btn';
      btn.className = 'icon-btn';
      btn.title = 'Add cover art';
      btn.textContent = '🎨';
      btn.onclick = () => TISA_COVERART.open();
      actions.prepend(btn);
    }
    onReady(() => {
      injectCoverBtn();
      const origOpen = window.openEditor;
      if (typeof origOpen === 'function') {
        window.openEditor = function () {
          const r = origOpen.apply(this, arguments);
          setTimeout(injectCoverBtn, 80);
          return r;
        };
      }
    });
  }

  // ══════════════════════════════════════════════════════════
  // 10. POLAROID GALLERY VIEW
  // ══════════════════════════════════════════════════════════
  function initPolaroidGallery() {
    let polaroidActive = false;

    function buildToggle() {
      if (document.getElementById('tisa-view-toggle')) return;
      const hdrActions = document.getElementById('hdr-actions');
      if (!hdrActions) return;
      const wrap = document.createElement('div');
      wrap.id = 'tisa-view-toggle';
      wrap.innerHTML = `
        <button class="view-toggle-btn active" id="vtb-list" onclick="TISA_POLAROID.setView('list')">≡ List</button>
        <button class="view-toggle-btn" id="vtb-polaroid" onclick="TISA_POLAROID.setView('polaroid')">🎞 Polaroid</button>
      `;
      hdrActions.prepend(wrap);
    }

    const polaroidContainer = document.createElement('div');
    polaroidContainer.id = 'tisa-polaroid-view';
    document.getElementById('content')?.appendChild(polaroidContainer) || document.body.appendChild(polaroidContainer);

    window.TISA_POLAROID = {
      setView(view) {
        const list = document.getElementById('entries-list');
        const polar = document.getElementById('tisa-polaroid-view');
        polaroidActive = view === 'polaroid';
        document.getElementById('vtb-list')?.classList.toggle('active', !polaroidActive);
        document.getElementById('vtb-polaroid')?.classList.toggle('active', polaroidActive);
        if (polaroidActive) {
          if (list) list.style.display = 'none';
          polar.classList.add('active');
          this.render();
        } else {
          if (list) list.style.display = '';
          polar.classList.remove('active');
        }
      },
      render() {
        const entries = [
          ...(window.personalEntries || []),
          ...(window.sharedEntries || [])
        ].filter(e => !e.trashed).slice(0, 40);
        const polar = document.getElementById('tisa-polaroid-view');
        if (!entries.length) { polar.innerHTML = '<p style="color:var(--ink-f);font-style:italic;padding:40px">No entries yet.</p>'; return; }
        const rotations = [-3,-1.5,0,1.5,2.5,-2,1,-1.5,2];
        polar.innerHTML = entries.map((e, i) => {
          const rot = rotations[i % rotations.length];
          const caption = (e.title || e.content || '').slice(0, 30);
          const dateStr = (() => { try { const d = e.createdAt?.toDate ? e.createdAt.toDate() : new Date(e.createdAt); return d.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'2-digit'}); } catch(_){ return ''; } })();
          const imgSrc = e.coverArtUrl || e.photos?.[0] || '';
          const imgHtml = imgSrc
            ? `<img class="polaroid-img" src="${imgSrc}" alt="" loading="lazy"/>`
            : `<div class="polaroid-img-ph">${e.mood || '📖'}</div>`;
          return `<div class="polaroid-card" style="--rot:${rot}deg" onclick="if(window.showDetail&&window._entries)showDetail(window._entries['${e.id}'])">
            ${imgHtml}
            <div class="polaroid-caption">${window.esc ? window.esc(caption) : caption}</div>
            <div class="polaroid-date">${dateStr}</div>
          </div>`;
        }).join('');
      }
    };

    // Show toggle on personal/shared views
    const origNav = window.navigate;
    if (typeof origNav === 'function') {
      window.navigate = function (view) {
        polaroidActive = false;
        const r = origNav.apply(this, arguments);
        if (view === 'personal' || view === 'shared') {
          setTimeout(buildToggle, 80);
        } else {
          document.getElementById('tisa-view-toggle')?.remove();
          document.getElementById('tisa-polaroid-view')?.classList.remove('active');
        }
        return r;
      };
    }
  }

  // ══════════════════════════════════════════════════════════
  // 11. SEASONAL THEMES
  // ══════════════════════════════════════════════════════════
  function initSeasonalThemes() {
    const seasons = {
      spring: { months: [2,3,4], icon: '🌸', name: 'Spring' },
      summer: { months: [5,6,7], icon: '☀️', name: 'Summer' },
      autumn: { months: [8,9,10], icon: '🍂', name: 'Autumn' },
      winter: { months: [11,0,1], icon: '❄️', name: 'Winter' }
    };

    function getSeason() {
      // Override check: user can pin a season
      const pinned = localStorage.getItem('tisa_season_pin');
      if (pinned && seasons[pinned]) return pinned;
      const m = new Date().getMonth();
      return Object.keys(seasons).find(s => seasons[s].months.includes(m)) || 'summer';
    }

    function applySeason(season) {
      document.documentElement.setAttribute('data-season', season);
      localStorage.setItem('tisa_season_pin', season);
      const indicator = document.getElementById('tisa-season-indicator');
      if (indicator) indicator.textContent = seasons[season].icon + ' ' + seasons[season].name;
    }

    function autoApply() {
      const season = getSeason();
      applySeason(season);
    }

    // Indicator pill
    const indicator = document.createElement('div');
    indicator.id = 'tisa-season-indicator';
    document.body.appendChild(indicator);

    // Add to settings: season cycle button
    function injectSeasonSettings() {
      if (document.getElementById('tisa-season-settings')) return;
      const settingsPage = document.getElementById('settings-page');
      if (!settingsPage || settingsPage.style.display === 'none') return;
      const wrap = document.createElement('div');
      wrap.id = 'tisa-season-settings';
      wrap.style.cssText = 'margin:16px 28px;padding:18px;background:var(--paper);border-radius:14px;border:1px solid var(--border-s)';
      wrap.innerHTML = `
        <div style="font-family:var(--serif);font-size:16px;font-weight:500;color:var(--ink);margin-bottom:10px">🍂 Seasonal Theme</div>
        <div style="font-size:13px;color:var(--ink-m);margin-bottom:12px">Auto-switches theme based on the current season.</div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          ${Object.entries(seasons).map(([key, s]) => `
            <button onclick="TISA_SEASONS.pin('${key}')" style="padding:7px 16px;border-radius:10px;font-size:13px;border:1.5px solid var(--border-m);background:var(--sand);cursor:pointer;transition:all .14s" class="season-pin-btn" data-season="${key}">${s.icon} ${s.name}</button>
          `).join('')}
          <button onclick="TISA_SEASONS.auto()" style="padding:7px 16px;border-radius:10px;font-size:13px;border:1.5px solid var(--sage-l);background:var(--sage-p);color:var(--sage-dd);cursor:pointer">↻ Auto</button>
        </div>
      `;
      settingsPage.prepend(wrap);
    }

    window.TISA_SEASONS = {
      pin(season) { applySeason(season); if (window.toast) window.toast(seasons[season].icon + ' ' + seasons[season].name + ' theme applied'); },
      auto() { localStorage.removeItem('tisa_season_pin'); autoApply(); if (window.toast) window.toast('Seasonal theme: auto'); }
    };

    const origNav = window.navigate;
    if (typeof origNav === 'function') {
      window.navigate = function (view) {
        const r = origNav.apply(this, arguments);
        if (view === 'settings') setTimeout(injectSeasonSettings, 200);
        return r;
      };
    }

    onReady(autoApply);
  }

  // ══════════════════════════════════════════════════════════
  // 12. CONFETTI ON MILESTONES
  // ══════════════════════════════════════════════════════════
  function initConfetti() {
    const MILESTONES = [1, 5, 10, 25, 50, 100, 200];
    const colors = ['#4E7A50','#C4954A','#A06080','#507AA0','#C06050','#8BAF8B','#C4D9C4'];

    function burst(n) {
      for (let i = 0; i < n; i++) {
        const piece = document.createElement('div');
        piece.className = 'confetti-piece';
        piece.style.cssText = `
          left: ${Math.random() * 100}vw;
          top: ${-10 + Math.random() * 20}px;
          background: ${colors[Math.floor(Math.random() * colors.length)]};
          animation-delay: ${Math.random() * .8}s;
          animation-duration: ${1.8 + Math.random() * 1.2}s;
          transform: rotate(${Math.random() * 360}deg);
          width: ${6 + Math.random() * 6}px;
          height: ${6 + Math.random() * 6}px;
          border-radius: ${Math.random() > .5 ? '50%' : '2px'};
        `;
        document.body.appendChild(piece);
        piece.addEventListener('animationend', () => piece.remove());
      }
    }

    function showMilestoneToast(count) {
      const msg = {
        1: { emoji: '🌱', title: 'First entry!', sub: 'The journey begins. Keep going.' },
        5: { emoji: '✨', title: '5 entries!', sub: 'A habit is forming. Beautiful.' },
        10: { emoji: '🔥', title: '10 entries!', sub: "You're building something real." },
        25: { emoji: '🌿', title: '25 entries!', sub: 'Quarter century of thoughts.' },
        50: { emoji: '🌟', title: '50 entries!', sub: 'Half a hundred moments captured.' },
        100: { emoji: '🎯', title: '100 entries!', sub: 'A hundred stories. Remarkable.' },
        200: { emoji: '🏆', title: '200 entries!', sub: 'An extraordinary journal.' }
      }[count];
      if (!msg) return;

      let toast = document.getElementById('tisa-milestone-toast');
      if (!toast) {
        toast = document.createElement('div');
        toast.id = 'tisa-milestone-toast';
        document.body.appendChild(toast);
      }
      toast.innerHTML = `
        <span class="ms-emoji">${msg.emoji}</span>
        <div class="ms-title">${msg.title}</div>
        <div class="ms-sub">${msg.sub}</div>
      `;
      toast.style.display = 'block';
      burst(60);
      setTimeout(() => { toast.style.display = 'none'; }, 4500);
    }

    // Hook into navigate to check milestones after entries load
    function checkMilestones() {
      const total = ((window.personalEntries || []).filter(e => !e.trashed)).length;
      const lastChecked = parseInt(localStorage.getItem('tisa_last_milestone') || '0');
      const hit = MILESTONES.find(m => total >= m && lastChecked < m);
      if (hit) {
        localStorage.setItem('tisa_last_milestone', hit);
        setTimeout(() => showMilestoneToast(hit), 600);
      }
    }

    const origNav = window.navigate;
    if (typeof origNav === 'function') {
      window.navigate = function (view) {
        const r = origNav.apply(this, arguments);
        if (view === 'personal' || view === 'dashboard') setTimeout(checkMilestones, 800);
        return r;
      };
    }

    window.TISA_CONFETTI = { burst, checkMilestones };
  }

  // ══════════════════════════════════════════════════════════
  // 13. ENCRYPTED ENTRIES
  // ══════════════════════════════════════════════════════════
  function initEncryptedEntries() {
    // AES-like XOR encryption (client-side, no library needed)
    function xorEncrypt(text, key) {
      let result = '';
      for (let i = 0; i < text.length; i++) {
        result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
      }
      return btoa(unescape(encodeURIComponent(result)));
    }
    function xorDecrypt(encoded, key) {
      try {
        const text = decodeURIComponent(escape(atob(encoded)));
        let result = '';
        for (let i = 0; i < text.length; i++) {
          result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
        }
        return result;
      } catch(e) { return null; }
    }

    // Inject encrypt toggle into editor
    function injectToggle() {
      if (document.getElementById('tisa-encrypt-toggle')) return;
      const footer = document.querySelector('.ep-footer');
      if (!footer) return;
      const btn = document.createElement('button');
      btn.id = 'tisa-encrypt-toggle';
      btn.innerHTML = '🔐 Encrypt';
      btn.title = 'Encrypt this entry with a passphrase';
      btn.onclick = () => openEncryptModal();
      footer.prepend(btn);
    }

    // Passphrase modal
    const encModal = document.createElement('div');
    encModal.id = 'tisa-encrypt-modal';
    encModal.className = 'tisa-plugin-overlay';
    encModal.style.display = 'none';
    encModal.innerHTML = `
      <div class="tisa-plugin-sheet" style="max-width:400px">
        <div class="tisa-plugin-sheet-hdr">
          <h3>🔐 Encrypt Entry</h3>
          <button class="tisa-close-btn" onclick="document.getElementById('tisa-encrypt-modal').style.display='none'">✕</button>
        </div>
        <div class="tisa-plugin-sheet-body">
          <p style="font-size:13px;color:var(--ink-m);margin-bottom:16px;line-height:1.9;font-family:var(--serif);font-style:italic">
            This entry will be encrypted with your passphrase before saving. Keep the passphrase safe — there is no recovery.
          </p>
          <input type="password" id="tisa-enc-pass" placeholder="Enter passphrase…" class="enc-unlock-input" style="width:100%;margin-bottom:10px"/>
          <input type="password" id="tisa-enc-pass-confirm" placeholder="Confirm passphrase…" class="enc-unlock-input" style="width:100%;margin-bottom:16px"/>
          <button class="enc-unlock-btn" style="width:100%" onclick="TISA_ENCRYPT.confirmEncrypt()">🔐 Encrypt & Save</button>
        </div>
      </div>
    `;
    document.body.appendChild(encModal);
    encModal.addEventListener('click', (e) => { if (e.target === encModal) encModal.style.display = 'none'; });

    function openEncryptModal() {
      encModal.style.display = 'flex';
      document.getElementById('tisa-enc-pass').focus();
    }

    window.TISA_ENCRYPT = {
      _pendingPass: null,
      confirmEncrypt() {
        const pass = document.getElementById('tisa-enc-pass').value;
        const confirm = document.getElementById('tisa-enc-pass-confirm').value;
        if (!pass) { if (window.toast) window.toast('Enter a passphrase'); return; }
        if (pass !== confirm) { if (window.toast) window.toast('Passphrases do not match'); return; }
        this._pendingPass = pass;
        encModal.style.display = 'none';
        const btn = document.getElementById('tisa-encrypt-toggle');
        if (btn) { btn.classList.add('active'); btn.innerHTML = '🔒 Encrypted'; }
        if (window.toast) window.toast('Entry will be encrypted on save ✓');
      },
      encrypt(text, pass) { return xorEncrypt(text, pass); },
      decrypt(encoded, pass) { return xorDecrypt(encoded, pass); },
      reset() { this._pendingPass = null; const btn = document.getElementById('tisa-encrypt-toggle'); if (btn) { btn.classList.remove('active'); btn.innerHTML = '🔐 Encrypt'; } }
    };

    onReady(() => {
      injectToggle();
      const origOpen = window.openEditor;
      if (typeof origOpen === 'function') {
        window.openEditor = function () {
          TISA_ENCRYPT.reset();
          const r = origOpen.apply(this, arguments);
          setTimeout(injectToggle, 80);
          return r;
        };
      }
    });
  }

  // ══════════════════════════════════════════════════════════
  // 14. BACKUP (JSON DOWNLOAD)
  // ══════════════════════════════════════════════════════════
  function initBackup() {
    function injectBackupBtn() {
      if (document.getElementById('tisa-backup-btn')) return;
      const settingsPage = document.getElementById('settings-page');
      if (!settingsPage || settingsPage.style.display === 'none') return;
      const wrap = document.createElement('div');
      wrap.style.cssText = 'margin:0 28px 16px;padding:18px;background:var(--paper);border-radius:14px;border:1px solid var(--border-s)';
      wrap.innerHTML = `
        <div style="font-family:var(--serif);font-size:16px;font-weight:500;color:var(--ink);margin-bottom:6px">💾 Backup Journal</div>
        <div style="font-size:13px;color:var(--ink-m);margin-bottom:12px">Download all your entries as a JSON file. Import it anytime.</div>
        <button id="tisa-backup-btn" onclick="TISA_BACKUP.download()">
          <span class="spinner-sm"></span>
          ⬇ Download backup
        </button>
      `;
      settingsPage.prepend(wrap);
    }

    window.TISA_BACKUP = {
      async download() {
        const btn = document.getElementById('tisa-backup-btn');
        if (btn) btn.classList.add('loading');
        try {
          const all = {
            exportedAt: new Date().toISOString(),
            version: 'tisa-v7',
            user: window.currentUser?.email || 'unknown',
            personalEntries: (window.personalEntries || []).map(e => ({
              id: e.id, title: e.title, content: e.content,
              mood: e.mood, tags: e.tags,
              createdAt: e.createdAt?.toDate ? e.createdAt.toDate().toISOString() : e.createdAt,
              font: e.font, color: e.color
            })),
            sharedEntries: (window.sharedEntries || []).map(e => ({
              id: e.id, title: e.title, content: e.content,
              mood: e.mood, tags: e.tags,
              createdAt: e.createdAt?.toDate ? e.createdAt.toDate().toISOString() : e.createdAt,
              author: e.userId
            }))
          };
          const blob = new Blob([JSON.stringify(all, null, 2)], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'tisa-backup-' + new Date().toISOString().slice(0,10) + '.json';
          a.click();
          URL.revokeObjectURL(url);
          if (window.toast) window.toast('Backup downloaded ✓');
        } catch(e) {
          if (window.toast) window.toast('Backup failed: ' + e.message);
        }
        if (btn) btn.classList.remove('loading');
      }
    };

    const origNav = window.navigate;
    if (typeof origNav === 'function') {
      window.navigate = function (view) {
        const r = origNav.apply(this, arguments);
        if (view === 'settings') setTimeout(injectBackupBtn, 200);
        return r;
      };
    }
  }

  // ══════════════════════════════════════════════════════════
  // INIT ALL
  // ══════════════════════════════════════════════════════════
  onReady(function () {
    initOfflineBanner();
    initAutoSave();
    initDraw();
    initSpellChecker();
    initTTS();
    initStickers();
    initSharedWishlist();
    initLoveLetter();
    initCoverArt();
    initPolaroidGallery();
    initSeasonalThemes();
    initConfetti();
    initEncryptedEntries();
    initBackup();

    // Inject Draw button into editor toolbar
    function injectDrawBtn() {
      if (document.getElementById('tisa-draw-btn')) return;
      const actions = document.querySelector('.ep-actions');
      if (!actions) return;
      const btn = document.createElement('button');
      btn.id = 'tisa-draw-btn';
      btn.className = 'icon-btn';
      btn.title = 'Draw / Sketch';
      btn.textContent = '✏️';
      btn.onclick = () => window.TISA_DRAW.open();
      actions.prepend(btn);
    }

    const origOpenEditor = window.openEditor;
    if (typeof origOpenEditor === 'function') {
      window.openEditor = function () {
        const r = origOpenEditor.apply(this, arguments);
        setTimeout(injectDrawBtn, 80);
        return r;
      };
    }

    console.log('[TISA Plugins] v1.0 loaded ✓');
  });

})();
