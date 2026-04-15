/* ══════════════════════════════════════════════════════════════
   TISA JOURNAL — PLUGINS v3.0
   Key changes vs v2:
   ✦ Fix: Firestore sharedJournal create (createdBy + creatorId)
   ✦ Fix: 5-tab mobile nav replacing 6-tab
   ✦ Fix: Poem card .pc-cab CSS
   ✦ Fix: .section-doodle CSS parse error resolved
   ✦ New: Duotone SVG icon system throughout
   ✦ New: Hero entry cards (mood bubble + gradient)
   ✦ New: Cover Art multi-backend (Pollinations + curated fallback)
   ✦ New: Word Goal Tracker with top progress bar
   ✦ New: Mood Analytics chart + weekly view
   ✦ New: Reading Time badge on cards and detail
   ✦ New: Partner Typing Indicator in Shared Journal
   ✦ Icon tap animations (scale + color pop)
   ✦ All original plugins retained and improved
══════════════════════════════════════════════════════════════ */
/* ══════════════════════════════════════════════════════════════
   TISA JOURNAL — PLUGINS v2.0
   Fixes: seasonal theme isolation · cover art stability ·
   edit/save to Firestore · dashboard routing · polaroid
   data isolation · highlighter restore · premium SVG icons
══════════════════════════════════════════════════════════════ */

(function TISA_PLUGINS() {
  'use strict';

  /* ── Utility helpers ─────────────────────────────────────── */
  function onReady(fn) {
    if (document.readyState !== 'loading') { fn(); return; }
    document.addEventListener('DOMContentLoaded', fn);
  }
  function onAppReady(fn) {
    if (window._tisaReady_fired) { fn(); return; }
    document.addEventListener('_tisaReady', fn, { once: true });
  }
  function _t(msg) {
    if (typeof window.toast === 'function') window.toast(msg);
  }
  function _esc(s) {
    return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  /* ── SVG icon strings for premium icon set ─────────────── */
  /* ── Premium SVG Icon Set ─────────────────────────────────
     Each SVG has explicit fill="none" stroke="currentColor" attrs
     so they render correctly even without CSS cascade.
     stroke-width/linecap set via CSS .tisa-icon svg rule.
  ──────────────────────────────────────────────────────────── */
  const ICONS = {
    pen:     `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>`,
    palette: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125C12.89 18.899 12.74 18.536 12.74 18.063c0-.921.756-1.563 1.688-1.563H16c2.204 0 4-1.796 4-4 0-4.41-3.579-8-8-8z"/><circle cx="8.5" cy="7.5" r="1" fill="currentColor" stroke="none"/><circle cx="12" cy="5.5" r="1" fill="currentColor" stroke="none"/><circle cx="15.5" cy="7.5" r="1" fill="currentColor" stroke="none"/><circle cx="17.5" cy="10.5" r="1" fill="currentColor" stroke="none"/></svg>`,
    mail:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>`,
    mic:     `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>`,
    stop:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><rect x="5" y="5" width="14" height="14" rx="2"/></svg>`,
    play:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>`,
    pause:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>`,
    smile:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9" stroke-width="2.5"/><line x1="15" y1="9" x2="15.01" y2="9" stroke-width="2.5"/></svg>`,
    star:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
    eraser:  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M20.707 5.826l-3.535-3.533a1 1 0 0 0-1.414 0L2.929 15.123a1 1 0 0 0 0 1.414l3.535 3.534a1 1 0 0 0 1.414 0l12.829-12.83a1 1 0 0 0 0-1.415z"/><path d="M7.929 19.07l-4-4"/><line x1="6" y1="20" x2="16" y2="20"/></svg>`,
    undo:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.95"/></svg>`,
    trash:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>`,
    lock:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`,
    unlock:  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>`,
    download:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`,
    close:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
    image:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`,
    sparkle: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l1.912 5.813a2 2 0 0 0 1.275 1.275L21 12l-5.813 1.912a2 2 0 0 0-1.275 1.275L12 21l-1.912-5.813a2 2 0 0 0-1.275-1.275L3 12l5.813-1.912a2 2 0 0 0 1.275-1.275L12 3z"/></svg>`,
    sun:     `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/></svg>`,
    leaf:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M2 22c1.25-1.25 2.5-2.5 3.75-3.75C7.5 16.5 9.74 15 12 15c4.42 0 8-3.58 8-8V3h-4c-4.42 0-8 3.58-8 8 0 2.26-1.5 4.5-3.25 6.25L2 22z"/></svg>`,
    snowflake:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><line x1="12" y1="2" x2="12" y2="22"/><path d="M17 7l-5 5-5-5M17 17l-5-5-5 5"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M7 7l5 5 5-5M7 17l5-5 5 5"/></svg>`,
    list:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6" stroke-width="2.5"/><line x1="3" y1="12" x2="3.01" y2="12" stroke-width="2.5"/><line x1="3" y1="18" x2="3.01" y2="18" stroke-width="2.5"/></svg>`,
    book:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>`,
    polaroid:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="2" width="18" height="20" rx="2"/><rect x="5" y="4" width="14" height="11" rx="1"/><line x1="7" y1="18" x2="9" y2="18" stroke-width="2"/></svg>`,
    art:     `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`,
    tts:     `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>`,
    shield:  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
    doc:     `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>`,
    help:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17" stroke-width="2.5"/></svg>`,
    wishlist:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6" stroke-width="2.5"/><line x1="3" y1="12" x2="3.01" y2="12" stroke-width="2.5"/><line x1="3" y1="18" x2="3.01" y2="18" stroke-width="2.5"/></svg>`,
  };;

  function svgBtn(iconKey) {
    const svg = ICONS[iconKey] || '';
    return `<span class="tisa-icon" aria-hidden="true">${svg}</span>`;
  }
  // Make icon button element with proper class and warm colors
  function makeIconBtn(iconKey, title, id, extraClass) {
    const btn = document.createElement('button');
    btn.className = 'tisa-plugin-icon-btn' + (extraClass ? ' ' + extraClass : '');
    btn.title = title || '';
    if (id) btn.id = id;
    btn.innerHTML = '<span class="tisa-icon">' + (ICONS[iconKey] || '') + '</span>';
    return btn;
  }

  // ══════════════════════════════════════════════════════════
  // 1. OFFLINE BANNER
  // ══════════════════════════════════════════════════════════
  function initOfflineBanner() {
    if (document.getElementById('tisa-offline-banner')) return;
    const banner = document.createElement('div');
    banner.id = 'tisa-offline-banner';
    banner.innerHTML = `<span>No connection — changes will sync on reconnect.</span><button class="retry-btn" onclick="window.location.reload()">Retry</button>`;
    document.body.prepend(banner);
    function update() { banner.classList.toggle('show', !navigator.onLine); }
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    update();
  }

  // ══════════════════════════════════════════════════════════
  // 2. AUTO-SAVE INDICATOR
  // ══════════════════════════════════════════════════════════
  function initAutoSave() {
    if (document.getElementById('tisa-autosave-badge')) return;
    const badge = document.createElement('div');
    badge.id = 'tisa-autosave-badge';
    badge.innerHTML = '<div class="dot"></div><span id="tisa-autosave-text">Saving…</span>';
    document.body.appendChild(badge);
    let timer = null, saveTimer = null;

    function showSaving() {
      badge.classList.remove('saved'); badge.classList.add('visible');
      document.getElementById('tisa-autosave-text').textContent = 'Saving…';
      clearTimeout(timer);
    }
    function showSaved() {
      badge.classList.add('saved');
      document.getElementById('tisa-autosave-text').textContent = 'Saved';
      clearTimeout(timer);
      timer = setTimeout(() => badge.classList.remove('visible'), 2200);
    }
    onReady(() => {
      const ta = document.getElementById('ep-content');
      if (ta) ta.addEventListener('input', () => {
        showSaving(); clearTimeout(saveTimer);
        saveTimer = setTimeout(() => {
          const ep = document.getElementById('editor-panel');
          if (ep && !ep.classList.contains('hidden') && window.saveEntry) {
            window.saveEntry(); showSaved();
          }
        }, 28000);
      });
    });
    window.tisaShowSaved = showSaved;
    window.tisaShowSaving = showSaving;
  }

  // ══════════════════════════════════════════════════════════
  // 3. DRAW / CANVAS — premium SVG icons
  // ══════════════════════════════════════════════════════════
  function initDraw() {
    if (document.getElementById('tisa-draw-overlay')) return;
    const overlay = document.createElement('div');
    overlay.id = 'tisa-draw-overlay';
    overlay.innerHTML = `
      <div id="tisa-draw-toolbar">
        <button class="draw-tool-btn active" id="draw-pen-btn" title="Pen" onclick="TISA_DRAW.setTool('pen')">${ICONS.pen}</button>
        <button class="draw-tool-btn" id="draw-marker-btn" title="Marker" onclick="TISA_DRAW.setTool('marker')">${ICONS.palette}</button>
        <button class="draw-tool-btn" id="draw-eraser-btn" title="Eraser" onclick="TISA_DRAW.setTool('eraser')">${ICONS.eraser}</button>
        <div class="draw-sep"></div>
        <input type="color" id="draw-color-picker" value="#1A1714" title="Color" oninput="TISA_DRAW.setColor(this.value)"/>
        <input type="range" id="draw-size-slider" min="1" max="28" value="3" title="Size" oninput="TISA_DRAW.setSize(this.value)"/>
        <div class="draw-sep"></div>
        <button class="draw-tool-btn" title="Undo" onclick="TISA_DRAW.undo()">${ICONS.undo}</button>
        <button class="draw-tool-btn" title="Clear" onclick="TISA_DRAW.clear()">${ICONS.trash}</button>
        <div id="draw-toolbar-right">
          <button class="draw-action-btn" onclick="TISA_DRAW.close()">Discard</button>
          <button class="draw-action-btn primary" onclick="TISA_DRAW.save()">Attach to entry</button>
        </div>
      </div>
      <canvas id="tisa-draw-canvas"></canvas>`;
    document.body.appendChild(overlay);

    const canvas = document.getElementById('tisa-draw-canvas');
    const ctx = canvas.getContext('2d');
    let drawing = false, tool = 'pen', color = '#1A1714', size = 3;
    let history = [], lastX = 0, lastY = 0;

    function resize() {
      const saved = canvas.toDataURL();
      canvas.width = overlay.clientWidth;
      canvas.height = overlay.clientHeight - document.getElementById('tisa-draw-toolbar').offsetHeight;
      ctx.fillStyle = '#FEFCF8'; ctx.fillRect(0, 0, canvas.width, canvas.height);
      if (history.length) { const img = new Image(); img.onload = () => ctx.drawImage(img,0,0); img.src = saved; }
    }
    function getPos(e) {
      const rect = canvas.getBoundingClientRect();
      const src = e.touches ? e.touches[0] : e;
      return { x: src.clientX - rect.left, y: src.clientY - rect.top };
    }
    function startDraw(e) { e.preventDefault(); drawing=true; const p=getPos(e); lastX=p.x; lastY=p.y; }
    function draw(e) {
      if (!drawing) return; e.preventDefault();
      const p = getPos(e);
      ctx.beginPath();
      if (tool==='eraser') { ctx.globalCompositeOperation='destination-out'; ctx.lineWidth=size*5; }
      else if (tool==='marker') { ctx.globalCompositeOperation='source-over'; ctx.globalAlpha=0.35; ctx.lineWidth=size*3.5; }
      else { ctx.globalCompositeOperation='source-over'; ctx.globalAlpha=1; ctx.lineWidth=size; }
      ctx.strokeStyle=color; ctx.lineCap='round'; ctx.lineJoin='round';
      ctx.moveTo(lastX,lastY); ctx.lineTo(p.x,p.y); ctx.stroke();
      lastX=p.x; lastY=p.y;
    }
    function endDraw() {
      if (!drawing) return; drawing=false; ctx.globalAlpha=1; ctx.globalCompositeOperation='source-over';
      history.push(canvas.toDataURL());
    }
    canvas.addEventListener('mousedown',startDraw); canvas.addEventListener('mousemove',draw);
    canvas.addEventListener('mouseup',endDraw); canvas.addEventListener('mouseleave',endDraw);
    canvas.addEventListener('touchstart',startDraw,{passive:false}); canvas.addEventListener('touchmove',draw,{passive:false});
    canvas.addEventListener('touchend',endDraw);

    window.TISA_DRAW = {
      open() { overlay.classList.add('open'); resize(); ctx.fillStyle='#FEFCF8'; ctx.fillRect(0,0,canvas.width,canvas.height); history=[]; },
      close() { overlay.classList.remove('open'); },
      clear() { ctx.fillStyle='#FEFCF8'; ctx.fillRect(0,0,canvas.width,canvas.height); history=[]; },
      undo() {
        if (history.length<2) { this.clear(); return; }
        history.pop(); const img=new Image();
        img.onload=()=>{ctx.clearRect(0,0,canvas.width,canvas.height);ctx.drawImage(img,0,0)};
        img.src=history[history.length-1];
      },
      save() {
        const dataUrl = canvas.toDataURL('image/png');
        let prev = document.getElementById('tisa-draw-preview');
        if (!prev) {
          prev = document.createElement('div'); prev.id='tisa-draw-preview';
          prev.style.cssText='margin-top:14px;border-radius:12px;overflow:hidden;border:1.5px solid var(--border-m);position:relative';
          prev.innerHTML=`<img src="" style="width:100%;display:block" alt="Drawing"/><button onclick="document.getElementById('tisa-draw-preview').remove();window._tisaDrawingData=null" style="position:absolute;top:8px;right:8px;background:rgba(0,0,0,.5);color:white;border:none;border-radius:6px;padding:3px 8px;cursor:pointer;font-size:12px">Remove</button>`;
          const ta=document.getElementById('ep-content');
          if(ta&&ta.parentNode) ta.parentNode.appendChild(prev);
        }
        prev.querySelector('img').src=dataUrl;
        window._tisaDrawingData=dataUrl;
        this.close(); _t('Drawing attached ✓');
      },
      setTool(t) {
        tool=t; canvas.classList.toggle('eraser-mode',t==='eraser');
        ['pen','marker','eraser'].forEach(n=>{const b=document.getElementById('draw-'+n+'-btn');if(b)b.classList.toggle('active',n===t)});
      },
      setColor(c){color=c},
      setSize(s){size=parseInt(s)}
    };
    window.addEventListener('resize',()=>{ if(overlay.classList.contains('open')) resize(); });
  }

  // ══════════════════════════════════════════════════════════
  // 4. SPELL CHECKER — z-index fixed via CSS
  // ══════════════════════════════════════════════════════════
  function initSpellChecker() {
    let spellOn = localStorage.getItem('tisa_spell') !== '0';

    function injectToggle() {
      if (document.getElementById('tisa-spell-toggle')) return;
      const footer = document.querySelector('.ep-footer');
      if (!footer) return;
      const btn = document.createElement('button');
      btn.id = 'tisa-spell-toggle';
      btn.title = 'Toggle spell check';
      btn.className = spellOn ? 'on' : '';
      btn.innerHTML = `${ICONS.pen.replace('viewBox','viewBox').replace('<svg','<svg width="12" height="12"')} Spell`;
      btn.onclick = () => {
        spellOn = !spellOn;
        localStorage.setItem('tisa_spell', spellOn ? '1' : '0');
        btn.className = spellOn ? 'on' : '';
        applySpell();
      };
      footer.prepend(btn);
    }
    function applySpell() {
      ['ep-content','tw-content','focus-content'].forEach(id=>{
        const el=document.getElementById(id); if(el) el.spellcheck=spellOn;
      });
    }
    onReady(() => { injectToggle(); applySpell(); });

    // Re-inject when editor opens
    function patchOpen() {
      const orig = window.openEditor;
      if (typeof orig !== 'function') { setTimeout(patchOpen,300); return; }
      window.openEditor = function() {
        const r = orig.apply(this, arguments);
        setTimeout(()=>{ injectToggle(); applySpell(); }, 80);
        return r;
      };
    }
    patchOpen();
  }

  // ══════════════════════════════════════════════════════════
  // 5. TEXT-TO-SPEECH — SVG icons
  // ══════════════════════════════════════════════════════════
  function initTTS() {
    if (!window.speechSynthesis || document.getElementById('tisa-tts-bar')) return;
    const bar = document.createElement('div');
    bar.id = 'tisa-tts-bar';
    bar.innerHTML = `
      <button class="tts-btn" id="tts-play-btn" onclick="TISA_TTS.toggle()" title="Play/Pause">${ICONS.play}</button>
      <button class="tts-btn" id="tts-stop-btn" onclick="TISA_TTS.stop()" title="Stop">${ICONS.stop}</button>
      <div id="tts-progress"><div id="tts-progress-fill"></div></div>
      <button class="tts-speed-btn" id="tts-speed-btn" onclick="TISA_TTS.cycleSpeed()">1×</button>
      <span class="tts-label" id="tts-label">Ready</span>
      <button class="tts-btn" onclick="TISA_TTS.close()" style="background:none;border:1px solid var(--border-m)">${ICONS.close}</button>`;
    document.body.appendChild(bar);

    const synth = window.speechSynthesis;
    let utt = null, speeds = [0.8,1,1.2,1.5], speedIdx = 1;

    window.TISA_TTS = {
      read(text) {
        if (!text) return;
        synth.cancel(); bar.classList.add('show'); this._speak(text);
      },
      _speak(text) {
        utt = new SpeechSynthesisUtterance(text);
        utt.rate = speeds[speedIdx]; utt.lang = 'en-US';
        const playBtn = document.getElementById('tts-play-btn');
        utt.onstart = () => { playBtn.innerHTML=ICONS.pause; playBtn.classList.add('playing'); };
        utt.onend = () => { playBtn.innerHTML=ICONS.play; playBtn.classList.remove('playing'); document.getElementById('tts-progress-fill').style.width='100%'; };
        utt.onboundary = (e) => {
          if (e.name==='word') {
            const words = text.split(/\s+/).length;
            const idx = text.slice(0,e.charIndex).split(/\s+/).length;
            document.getElementById('tts-progress-fill').style.width = Math.min(100,Math.round(idx/words*100))+'%';
          }
        };
        synth.speak(utt);
      },
      toggle() {
        const playBtn = document.getElementById('tts-play-btn');
        if (synth.paused) { synth.resume(); playBtn.innerHTML=ICONS.pause; playBtn.classList.add('playing'); }
        else if (synth.speaking) { synth.pause(); playBtn.innerHTML=ICONS.play; playBtn.classList.remove('playing'); }
      },
      stop() { synth.cancel(); document.getElementById('tts-play-btn').innerHTML=ICONS.play; document.getElementById('tts-play-btn').classList.remove('playing'); document.getElementById('tts-progress-fill').style.width='0%'; },
      close() { this.stop(); bar.classList.remove('show'); },
      cycleSpeed() {
        speedIdx=(speedIdx+1)%speeds.length;
        document.getElementById('tts-speed-btn').textContent=speeds[speedIdx]+'×';
        if(synth.speaking){const t=utt?.text||'';synth.cancel();this._speak(t);}
      }
    };

    // Add read button to detail view
    function patchShowDetail() {
      const orig = window.showDetail;
      if (typeof orig !== 'function') { setTimeout(patchShowDetail,400); return; }
      window.showDetail = function(entry) {
        const r = orig.apply(this, arguments);
        setTimeout(()=>{
          const acts = document.getElementById('detail-actions');
          if (acts && !document.getElementById('tts-detail-btn')) {
            const btn = document.createElement('button');
            btn.id='tts-detail-btn'; btn.className='action-btn';
            btn.innerHTML=`${ICONS.play.replace('<svg','<svg width="11" height="11"')} Read`;
            btn.onclick = () => {
              const content=document.getElementById('detail-content')?.textContent||'';
              const title=document.getElementById('detail-title')?.textContent||'';
              TISA_TTS.read(title+'. '+content);
            };
            acts.prepend(btn);
          }
        },60);
        return r;
      };
    }
    patchShowDetail();
  }

  // ══════════════════════════════════════════════════════════
  // 6. STICKERS — SVG icon button
  // ══════════════════════════════════════════════════════════
  const STICKER_SETS = {
    'Love':['❤️','🥰','💕','💖','💘','💝','💗','💓','💞','🌹','🌸','🦋','💌','🫶','🤍','💛'],
    'Nature':['🌿','🌱','🍃','🌻','🌺','🌷','🍀','☘️','🌾','🌙','⭐','✨','🌈','🌊','🦋','🐝'],
    'Journal':['📖','✍️','🖊️','📝','🧠','💭','🫧','🎯','🧘','🕯️','☕','🍵','🎶','🎵','🌅','🌄'],
    'Moods':['😊','🥹','😌','😔','🥺','😤','🥳','😴','🤩','😇','🙃','😅','🤗','😏','😍','🤔'],
    'Fun':['🎉','🎊','🎈','🎁','🌟','🔮','🪄','🎀','🦄','🐣','🍕','🍰','☁️','🌻','🦋','✦']
  };

  function initStickers() {
    if (document.getElementById('tisa-sticker-panel')) return;
    const panel = document.createElement('div');
    panel.id = 'tisa-sticker-panel';
    let html = '';
    Object.entries(STICKER_SETS).forEach(([name, stickers]) => {
      html += `<div class="sticker-section-title">${name}</div><div class="sticker-grid">`;
      stickers.forEach(s => { html += `<button class="sticker-item" onclick="TISA_STICKERS.insert('${s}')">${s}</button>`; });
      html += '</div>';
    });
    panel.innerHTML = html;
    document.body.appendChild(panel);

    const fab = document.createElement('button');
    fab.id = 'tisa-sticker-btn'; fab.title = 'Stickers';
    fab.innerHTML = ICONS.smile; fab.onclick = () => panel.classList.toggle('open');
    document.body.appendChild(fab);

    function updateFab() {
      const ep = document.getElementById('editor-panel');
      fab.classList.toggle('show', !!(ep && !ep.classList.contains('hidden')));
    }
    function patchEditorOpen() {
      const orig = window.openEditor;
      if (typeof orig !== 'function') { setTimeout(patchEditorOpen,300); return; }
      window.openEditor = function() { const r=orig.apply(this,arguments); setTimeout(updateFab,100); return r; };
    }
    function patchEditorClose() {
      const orig = window.closeEditor;
      if (typeof orig !== 'function') { setTimeout(patchEditorClose,300); return; }
      window.closeEditor = function() { const r=orig.apply(this,arguments); fab.classList.remove('show'); panel.classList.remove('open'); return r; };
    }
    patchEditorOpen(); patchEditorClose();
    document.addEventListener('click', e => { if(!panel.contains(e.target)&&e.target!==fab) panel.classList.remove('open'); });

    window.TISA_STICKERS = {
      insert(emoji) {
        const twOpen = document.getElementById('tw-overlay')?.classList.contains('show');
        const ta = twOpen ? document.getElementById('tw-content') : document.getElementById('ep-content');
        if (!ta) { navigator.clipboard?.writeText(emoji); panel.classList.remove('open'); return; }
        const s=ta.selectionStart, e2=ta.selectionEnd;
        ta.value = ta.value.slice(0,s)+emoji+ta.value.slice(e2);
        ta.selectionStart=ta.selectionEnd=s+emoji.length; ta.focus();
        panel.classList.remove('open');
      }
    };
  }

  // ══════════════════════════════════════════════════════════
  // 7. SHARED WISHLIST — SVG icon FAB
  // ══════════════════════════════════════════════════════════
  function initSharedWishlist() {
    if (document.getElementById('tisa-wishlist-modal')) return;
    let wishes = [];
    const SK = 'tisa_wishlist';
    function load() { try { wishes=JSON.parse(localStorage.getItem(SK)||'[]'); } catch(e) { wishes=[]; } }
    function save() {
      localStorage.setItem(SK, JSON.stringify(wishes));
      try {
        const jid = window.profile?.sharedJournalId;
        if (jid && window._v6fs?.db) {
          window._v6fs.updateDoc(window._v6fs.doc(window._v6fs.db,'sharedJournals',jid),{wishlist:wishes}).catch(()=>{});
        }
      } catch(e) {}
    }
    function render() {
      load();
      const body = document.getElementById('tisa-wishlist-body'); if(!body) return;
      if (!wishes.length) { body.innerHTML='<div class="wishlist-empty">Add places to visit, things to try, moments to make together.</div>'; return; }
      body.innerHTML = wishes.map((w,i)=>`
        <div class="wishlist-item">
          <input type="checkbox" class="wishlist-check" ${w.done?'checked':''} onchange="TISA_WISHLIST.toggle(${i})"/>
          <span class="wishlist-text${w.done?' done':''}">${_esc(w.text)}</span>
          <span class="wishlist-who">${_esc(w.by||'')}</span>
          <button class="wishlist-del" onclick="TISA_WISHLIST.remove(${i})">${ICONS.close.replace('<svg','<svg width="12" height="12"')}</button>
        </div>`).join('');
    }

    const modal = document.createElement('div');
    modal.id='tisa-wishlist-modal'; modal.className='tisa-plugin-overlay'; modal.style.display='none';
    modal.innerHTML=`<div class="tisa-plugin-sheet" style="max-width:500px">
      <div class="tisa-plugin-sheet-hdr">
        <h3>${ICONS.star.replace('<svg','<svg width="18" height="18"')} Our Wishlist</h3>
        <button class="tisa-close-btn" onclick="document.getElementById('tisa-wishlist-modal').style.display='none'">${ICONS.close}</button>
      </div>
      <div class="tisa-plugin-sheet-body">
        <p style="font-size:13px;color:var(--ink-m);margin-bottom:16px;font-style:italic;font-family:var(--serif)">Places to visit, things to try, memories to make together.</p>
        <div id="tisa-wishlist-body"></div>
        <div class="wishlist-add-row">
          <input class="wishlist-add-input" id="tisa-wish-input" placeholder="Add a wish… e.g. Visit Rishikesh" onkeydown="if(event.key==='Enter')TISA_WISHLIST.add()"/>
          <button class="wishlist-add-btn" onclick="TISA_WISHLIST.add()">Add</button>
        </div>
      </div>
    </div>`;
    document.body.appendChild(modal);
    modal.addEventListener('click', e=>{ if(e.target===modal) modal.style.display='none'; });

    const fab = document.createElement('button');
    fab.id='tisa-wishlist-fab'; fab.title='Shared Wishlist';
    fab.innerHTML=ICONS.star; fab.onclick=()=>{ modal.style.display='flex'; render(); };
    document.body.appendChild(fab);

    function patchNav() {
      const orig=window.navigate;
      if(typeof orig!=='function'){setTimeout(patchNav,300);return;}
      window.navigate=function(view){ const r=orig.apply(this,arguments); setTimeout(()=>fab.classList.toggle('show',view==='shared'),80); return r; };
    }
    patchNav();

    window.TISA_WISHLIST = {
      add() {
        const inp=document.getElementById('tisa-wish-input'); const txt=inp?.value.trim(); if(!txt) return;
        load(); wishes.unshift({text:txt,done:false,by:window.profile?.displayName||window.currentUser?.displayName||'You',addedAt:new Date().toISOString()});
        save(); if(inp)inp.value=''; render();
      },
      toggle(i){load();wishes[i].done=!wishes[i].done;save();render();},
      remove(i){load();wishes.splice(i,1);save();render();}
    };
  }

  // ══════════════════════════════════════════════════════════
  // 8. LOVE LETTER MODE — SVG icon
  // ══════════════════════════════════════════════════════════
  function initLoveLetter() {
    if (document.getElementById('tisa-love-letter-modal')) return;
    const modal = document.createElement('div');
    modal.id='tisa-love-letter-modal'; modal.className='tisa-plugin-overlay'; modal.style.display='none';
    modal.innerHTML=`<div class="tisa-plugin-sheet" style="max-width:440px">
      <div class="tisa-plugin-sheet-hdr">
        <h3>${ICONS.mail.replace('<svg','<svg width="18" height="18"')} Love Letter Mode</h3>
        <button class="tisa-close-btn" onclick="document.getElementById('tisa-love-letter-modal').style.display='none'">${ICONS.close}</button>
      </div>
      <div class="tisa-plugin-sheet-body">
        <p style="font-size:13.5px;color:var(--ink-m);line-height:1.9;font-family:var(--serif);font-style:italic;margin-bottom:20px">This entry will be sealed until your chosen date — like a letter from the past.</p>
        <label style="display:block;font-size:10.5px;font-weight:600;color:var(--ink-m);letter-spacing:.8px;text-transform:uppercase;margin-bottom:7px">Unlock on</label>
        <input type="date" id="tisa-love-unlock-date" style="width:100%;padding:10px 14px;border:1.5px solid var(--border-m);border-radius:10px;font-size:14px;color:var(--ink);background:var(--sand);outline:none;font-family:inherit;transition:border-color .15s" onfocus="this.style.borderColor='var(--sage-d)'"/>
        <label style="display:block;font-size:10.5px;font-weight:600;color:var(--ink-m);letter-spacing:.8px;text-transform:uppercase;margin:16px 0 7px">A hint (shown while locked)</label>
        <input type="text" id="tisa-love-hint" placeholder="e.g. For our anniversary" style="width:100%;padding:10px 14px;border:1.5px solid var(--border-m);border-radius:10px;font-size:14px;color:var(--ink);background:var(--sand);outline:none;font-family:var(--serif);font-style:italic;transition:border-color .15s" onfocus="this.style.borderColor='var(--sage-d)'"/>
        <button class="love-unlock-btn" onclick="TISA_LOVELETTER.seal()">${ICONS.lock.replace('<svg','<svg width="15" height="15"')} Seal this letter</button>
      </div>
    </div>`;
    document.body.appendChild(modal);
    modal.addEventListener('click',e=>{if(e.target===modal)modal.style.display='none';});

    function injectBtn() {
      if (document.getElementById('tisa-love-letter-btn')) return;
      const actions = document.querySelector('.ep-actions');
      if (!actions) return;
      const btn=document.createElement('button'); btn.id='tisa-love-letter-btn'; btn.className='icon-btn'; btn.title='Love Letter Mode';
      btn.innerHTML=ICONS.mail; btn.style.cssText='display:flex;align-items:center;justify-content:center;width:32px;height:32px';
      btn.onclick=()=>{
        const d=new Date(); d.setMonth(d.getMonth()+1);
        document.getElementById('tisa-love-unlock-date').value=d.toISOString().slice(0,10);
        modal.style.display='flex';
      };
      actions.prepend(btn);
    }

    window.TISA_LOVELETTER = {
      seal() {
        const date=document.getElementById('tisa-love-unlock-date').value;
        const hint=document.getElementById('tisa-love-hint').value.trim();
        if(!date){_t('Pick an unlock date'); return;}
        window._tisaLoveLetter={unlockDate:date,hint:hint||'A letter from the past'};
        modal.style.display='none';
        _t('Entry sealed until '+new Date(date).toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'}));
      }
    };

    onReady(()=>{
      injectBtn();
      function patchOpen(){
        const orig=window.openEditor;
        if(typeof orig!=='function'){setTimeout(patchOpen,300);return;}
        window.openEditor=function(){const r=orig.apply(this,arguments);setTimeout(injectBtn,80);return r;};
      }
      patchOpen();
    });
  }

  // ══════════════════════════════════════════════════════════
  // 9. COVER ART — stable, multi-generate, non-self-destructing
  // ══════════════════════════════════════════════════════════
  const CURATED_ART = [
    {url:'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=70',label:'Mountains'},
    {url:'https://images.unsplash.com/photo-1523712999610-f77fbcfc3843?w=800&q=70',label:'Forest'},
    {url:'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?w=800&q=70',label:'Lake'},
    {url:'https://images.unsplash.com/photo-1490750967868-88df5691cc00?w=800&q=70',label:'Flowers'},
    {url:'https://images.unsplash.com/photo-1518098268026-4e89f1a2cd8e?w=800&q=70',label:'Stars'},
    {url:'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=70',label:'Blossom'},
    {url:'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&q=70',label:'Road'},
    {url:'https://images.unsplash.com/photo-1444464666168-49d633b86797?w=800&q=70',label:'Ocean'},
    {url:'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=800&q=70',label:'Fields'},
  ];

  function initCoverArt() {
    if (document.getElementById('tisa-cover-art-modal')) return;
    const modal = document.createElement('div');
    modal.id='tisa-cover-art-modal'; modal.className='tisa-plugin-overlay'; modal.style.display='none';
    modal.innerHTML=`<div class="tisa-plugin-sheet" style="max-width:560px">
      <div class="tisa-plugin-sheet-hdr">
        <h3>${ICONS.image.replace('<svg','<svg width="18" height="18"')} Cover Art</h3>
        <button class="tisa-close-btn" onclick="TISA_COVERART.closeModal()">${ICONS.close}</button>
      </div>
      <div class="tisa-plugin-sheet-body">
        <label style="display:block;font-size:10.5px;font-weight:600;color:var(--ink-m);letter-spacing:.8px;text-transform:uppercase;margin-bottom:8px">Generate with AI (free)</label>
        <div class="art-ai-row">
          <input type="text" id="tisa-art-prompt" class="art-ai-input" placeholder="e.g. misty forest at dawn, watercolour…" onkeydown="if(event.key==='Enter')TISA_COVERART.generate()"/>
          <button class="art-ai-btn" id="tisa-art-gen-btn" onclick="TISA_COVERART.generate()">
            <span class="spinner-sm"></span>${ICONS.sparkle.replace('<svg','<svg width="13" height="13"')} Generate
          </button>
        </div>
        <div class="art-ai-result" id="tisa-art-ai-result">
          <img id="tisa-art-ai-img" src="" alt="AI cover" onclick="TISA_COVERART.selectAI(this)"/>
          <div class="art-select-hint">Click image to use it as cover</div>
        </div>
        <label style="display:block;font-size:10.5px;font-weight:600;color:var(--ink-m);letter-spacing:.8px;text-transform:uppercase;margin:16px 0 4px">Or choose from curated art</label>
        <div class="art-grid" id="tisa-art-grid"></div>
        <div style="display:flex;gap:8px;margin-top:16px;justify-content:flex-end">
          <button onclick="TISA_COVERART.remove()" style="padding:9px 16px;border:1.5px solid var(--border-m);border-radius:10px;font-size:13px;background:var(--sand);color:var(--ink-m);cursor:pointer">Remove cover</button>
          <button onclick="TISA_COVERART.closeModal()" style="padding:9px 20px;background:linear-gradient(135deg,var(--sage-d),var(--sage-dd));color:white;border:none;border-radius:10px;font-size:13px;font-weight:500;cursor:pointer">Done</button>
        </div>
      </div>
    </div>`;
    document.body.appendChild(modal);
    modal.addEventListener('click',e=>{if(e.target===modal)TISA_COVERART.closeModal();});

    // Populate curated grid
    const grid = document.getElementById('tisa-art-grid');
    CURATED_ART.forEach((art) => {
      const div=document.createElement('div'); div.className='art-option'; div.dataset.url=art.url;
      div.innerHTML=`<img src="${art.url}" alt="${art.label}" loading="lazy"/>`;
      div.onclick=()=>TISA_COVERART.select(art.url, div);
      grid.appendChild(div);
    });

    window.TISA_COVERART = {
      _selected: null,
      closeModal() { document.getElementById('tisa-cover-art-modal').style.display='none'; },
      open() {
        // Pre-fill with entry title
        const title = document.getElementById('ep-title-input')?.value || '';
        if(title) document.getElementById('tisa-art-prompt').value=title;
        // Reset AI result so it doesn't show stale image
        const aiResult=document.getElementById('tisa-art-ai-result');
        const aiImg=document.getElementById('tisa-art-ai-img');
        // Only reset if no selection yet
        if(!this._selected){aiResult.classList.remove('visible');if(aiImg)aiImg.src='';}
        document.getElementById('tisa-cover-art-modal').style.display='flex';
      },
      select(url, el) {
        this._selected=url; window._tisaCoverArtUrl=url;
        document.querySelectorAll('.art-option').forEach(d=>d.classList.remove('selected'));
        if(el) el.classList.add('selected');
        this._updatePreview(url); _t('Cover art selected ✓');
      },
      selectAI(imgEl) {
        if(!imgEl||!imgEl.src) return;
        this._selected=imgEl.src; window._tisaCoverArtUrl=imgEl.src;
        imgEl.classList.add('selected');
        this._updatePreview(imgEl.src); _t('AI cover selected ✓');
      },
      remove() {
        this._selected=null; window._tisaCoverArtUrl=null;
        this._updatePreview(null);
        document.querySelectorAll('.art-option').forEach(d=>d.classList.remove('selected'));
        const aiImg=document.getElementById('tisa-art-ai-img');
        if(aiImg){aiImg.classList.remove('selected');}
        this.closeModal(); _t('Cover art removed');
      },
      _updatePreview(url) {
        let prev=document.getElementById('tisa-cover-preview');
        if(!url){if(prev)prev.remove();return;}
        if(!prev){
          prev=document.createElement('img'); prev.id='tisa-cover-preview'; prev.className='entry-cover-art';
          const body=document.getElementById('ep-body'); if(body) body.prepend(prev);
        }
        prev.src=url;
      },
      _generating: false,  // guard prevents concurrent/crash calls

      async generate() {
        if (this._generating) return;  // prevent double-click / crash
        const prompt=document.getElementById('tisa-art-prompt').value.trim();
        if(!prompt){_t('Enter a description first');return;}
        const btn=document.getElementById('tisa-art-gen-btn');
        const aiResult=document.getElementById('tisa-art-ai-result');
        const aiImg=document.getElementById('tisa-art-ai-img');
        if(!btn||!aiResult||!aiImg) return;
        this._generating = true;

        btn.classList.add('loading');
        aiResult.classList.remove('visible');

        // Use Pollinations.ai — free, no key, stable
        const seed = Date.now() % 99999;
        const encoded = encodeURIComponent('aesthetic journal cover art, '+prompt+', soft watercolour, warm tones, no text, painterly');
        const url = `https://image.pollinations.ai/prompt/${encoded}?width=800&height=350&seed=${seed}&nologo=true&enhance=true`;

        // Create a fresh Image object each time — don't reuse the same img element src
        const testImg = new Image();
        testImg.crossOrigin = 'anonymous';

        const loadTimeout = setTimeout(()=>{
          this._generating = false;
          btn.classList.remove('loading');
          // Fallback to curated
          const fallback=CURATED_ART[seed%CURATED_ART.length];
          aiImg.src=fallback.url;
          aiResult.classList.add('visible');
          _t('AI slow — showing a curated option instead');
        }, 15000);

        testImg.onload = () => {
          this._generating = false;
          clearTimeout(loadTimeout);
          btn.classList.remove('loading');
          aiImg.src = testImg.src;
          aiImg.classList.remove('selected');
          aiResult.classList.add('visible');
        };
        testImg.onerror = () => {
          clearTimeout(loadTimeout);
          btn.classList.remove('loading');
          const fallback=CURATED_ART[seed%CURATED_ART.length];
          aiImg.src=fallback.url;
          aiResult.classList.add('visible');
          _t('AI unavailable — showing curated instead');
        };
        testImg.src = url;
      }
    };

    function injectCoverBtn() {
      if(document.getElementById('tisa-cover-btn')) return;
      const actions=document.querySelector('.ep-actions'); if(!actions) return;
      const btn=document.createElement('button'); btn.id='tisa-cover-btn'; btn.className='icon-btn'; btn.title='Cover Art';
      btn.innerHTML=ICONS.image; btn.style.cssText='display:flex;align-items:center;justify-content:center;width:32px;height:32px';
      btn.onclick=()=>TISA_COVERART.open();
      actions.prepend(btn);
    }
    onReady(()=>{
      injectCoverBtn();
      function patchOpen(){const orig=window.openEditor;if(typeof orig!=='function'){setTimeout(patchOpen,300);return;}window.openEditor=function(){const r=orig.apply(this,arguments);setTimeout(injectCoverBtn,80);return r;};}
      patchOpen();
    });
  }

  // ══════════════════════════════════════════════════════════
  // 10. POLAROID GALLERY — STRICT personal-only isolation
  // ══════════════════════════════════════════════════════════
  function initPolaroidGallery() {
    let polaroidActive = false;

    function buildToggle() {
      // Only inject on personal view — never shared
      if (window.currentView !== 'personal') return;
      if (document.getElementById('tisa-view-toggle')) return;
      const hdrActions=document.getElementById('hdr-actions'); if(!hdrActions) return;
      const wrap=document.createElement('div'); wrap.id='tisa-view-toggle';
      wrap.innerHTML=`<button class="view-toggle-btn active" id="vtb-list" onclick="TISA_POLAROID.setView('list')">${ICONS.pen.replace('<svg','<svg width="12" height="12"')} List</button><button class="view-toggle-btn" id="vtb-polaroid" onclick="TISA_POLAROID.setView('polaroid')">${ICONS.image.replace('<svg','<svg width="12" height="12"')} Gallery</button>`;
      hdrActions.prepend(wrap);
    }

    let container = null;
    function getContainer() {
      if (!container || !document.body.contains(container)) {
        container = document.createElement('div');
        container.id = 'tisa-polaroid-view';
        const contentEl = document.getElementById('content');
        if (contentEl) contentEl.appendChild(container);
        else document.body.appendChild(container);
      }
      return container;
    }

    window.TISA_POLAROID = {
      setView(view) {
        // ISOLATION: Never show polaroid in shared view
        if (window.currentView === 'shared') {
          view = 'list'; // force list
        }
        const list=document.getElementById('entries-list');
        const polar=getContainer();
        polaroidActive = view==='polaroid';
        document.getElementById('vtb-list')?.classList.toggle('active', !polaroidActive);
        document.getElementById('vtb-polaroid')?.classList.toggle('active', polaroidActive);
        if (polaroidActive) {
          if(list) list.style.display='none';
          polar.classList.add('active'); this.render();
        } else {
          if(list) list.style.display='';
          polar.classList.remove('active');
        }
      },
      render() {
        // STRICT: only personal entries — never shared
        const entries = (window.personalEntries||[]).filter(e=>!e.trashed).slice(0,40);
        const polar = getContainer();
        if (!entries.length) { polar.innerHTML='<p style="color:var(--ink-f);font-style:italic;padding:40px;text-align:center">No entries yet.</p>'; return; }
        const rots = [-3,-1.5,0,1.5,2.5,-2,1,-1.5,2];
        polar.innerHTML = entries.map((e,i)=>{
          const rot = rots[i%rots.length];
          const caption=(e.title||e.content||'').slice(0,28);
          let dateStr='';
          try { const d=e.createdAt?.toDate?e.createdAt.toDate():new Date(e.createdAt); dateStr=d.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'2-digit'}); } catch(_){}
          const imgSrc=e.coverArtUrl||e.photos?.[0]||'';
          const imgHtml=imgSrc ? `<img class="polaroid-img" src="${imgSrc}" alt="" loading="lazy"/>` : `<div class="polaroid-img-ph">${ICONS.image}</div>`;
          return `<div class="polaroid-card" style="--rot:${rot}deg" onclick="if(window.showDetail&&window._entries)showDetail(window._entries['${e.id}'])">${imgHtml}<div class="polaroid-caption">${_esc(caption)}</div><div class="polaroid-date">${dateStr}</div></div>`;
        }).join('');
      },
      reset() { polaroidActive=false; const polar=getContainer(); polar.classList.remove('active'); document.getElementById('tisa-view-toggle')?.remove(); }
    };

    function patchNav() {
      const orig=window.navigate;
      if(typeof orig!=='function'){setTimeout(patchNav,300);return;}
      window.navigate=function(view){
        // Always reset polaroid when leaving personal
        if(view!=='personal') TISA_POLAROID.reset();
        const r=orig.apply(this,arguments);
        if(view==='personal') setTimeout(buildToggle,80);
        return r;
      };
    }
    patchNav();
  }

  // ══════════════════════════════════════════════════════════
  // 11. SEASONAL THEMES — ISOLATED, never overrides user theme
  // ══════════════════════════════════════════════════════════
  function initSeasonalThemes() {
    const seasons = {
      spring: {months:[2,3,4], icon:'🌸', name:'Spring'},
      summer: {months:[5,6,7], icon:'☀️', name:'Summer'},
      autumn: {months:[8,9,10], icon:'🍂', name:'Autumn'},
      winter: {months:[11,0,1], icon:'❄️', name:'Winter'}
    };

    function getAutoSeason() {
      const m=new Date().getMonth();
      return Object.keys(seasons).find(s=>seasons[s].months.includes(m))||'summer';
    }

    // KEY FIX: use data-season-overlay attribute on body, NOT data-theme
    // This means seasonal palette changes are in a separate CSS layer
    // and NEVER interfere with window.setTH() theme selections
    function applySeasonOverlay(season, save=true) {
      if (season && seasons[season]) {
        document.body.setAttribute('data-season-overlay', season);
        if (save) localStorage.setItem('tisa_season_overlay', season);
      } else {
        // Remove season overlay entirely
        document.body.removeAttribute('data-season-overlay');
        if (save) localStorage.removeItem('tisa_season_overlay');
      }
      updateIndicator();
    }

    function updateIndicator() {
      const indicator=document.getElementById('tisa-season-indicator');
      const current=document.body.getAttribute('data-season-overlay');
      if (indicator) {
        if (current && seasons[current]) {
          indicator.textContent = seasons[current].icon+' '+seasons[current].name;
          indicator.style.display='flex';
        } else {
          indicator.style.display='none';
        }
      }
    }

    // Season indicator pill
    if (!document.getElementById('tisa-season-indicator')) {
      const indicator=document.createElement('div');
      indicator.id='tisa-season-indicator'; indicator.style.display='none';
      document.body.appendChild(indicator);
    }

    // Restore from localStorage on load
    const saved=localStorage.getItem('tisa_season_overlay');
    if (saved) applySeasonOverlay(saved, false);
    else applySeasonOverlay(getAutoSeason(), false); // auto on first load

    // Expose API
    window.TISA_SEASONS = {
      // Apply season overlay without touching user theme
      apply(season) {
        applySeasonOverlay(season, true);
        _t(seasons[season]?.icon+' '+seasons[season]?.name+' overlay applied');
      },
      // Remove season overlay — restores pure user theme
      clear() {
        applySeasonOverlay(null, true);
        _t('Season overlay removed');
      },
      auto() {
        const s=getAutoSeason();
        applySeasonOverlay(s, true);
        _t('Auto season: '+seasons[s].name);
      },
      current() { return document.body.getAttribute('data-season-overlay'); }
    };

    // Inject season controls into Settings (without overriding theme)
    function injectSeasonSettings() {
      if (document.getElementById('tisa-season-settings')) return;
      const sp=document.getElementById('settings-page'); if(!sp||sp.style.display==='none') return;
      const wrap=document.createElement('div'); wrap.id='tisa-season-settings';
      wrap.style.cssText='margin:16px 28px;padding:18px;background:var(--paper);border-radius:14px;border:1px solid var(--border-s)';
      const current=document.body.getAttribute('data-season-overlay');
      wrap.innerHTML=`<div style="font-family:var(--serif);font-size:16px;font-weight:500;color:var(--ink);margin-bottom:6px">${ICONS.leaf.replace('<svg','<svg width="16" height="16"')} Season Overlay</div>
        <div style="font-size:13px;color:var(--ink-m);margin-bottom:12px">Adds a seasonal tint — never overrides your theme.</div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          ${Object.entries(seasons).map(([k,s])=>`<button onclick="TISA_SEASONS.apply('${k}')" style="padding:6px 14px;border-radius:10px;font-size:13px;border:1.5px solid var(--border-m);background:${k===current?'var(--sage-p)':'var(--sand)'};cursor:pointer;transition:all .14s">${s.icon} ${s.name}</button>`).join('')}
          <button onclick="TISA_SEASONS.clear()" style="padding:6px 14px;border-radius:10px;font-size:13px;border:1.5px solid var(--border-m);background:var(--sand);cursor:pointer">None</button>
          <button onclick="TISA_SEASONS.auto()" style="padding:6px 14px;border-radius:10px;font-size:13px;border:1.5px solid var(--sage-l);background:var(--sage-p);color:var(--sage-dd);cursor:pointer">Auto</button>
        </div>`;
      sp.prepend(wrap);
    }

    function patchNav(){
      const orig=window.navigate;
      if(typeof orig!=='function'){setTimeout(patchNav,300);return;}
      window.navigate=function(view){const r=orig.apply(this,arguments);if(view==='settings')setTimeout(injectSeasonSettings,200);return r;};
    }
    patchNav();
  }

  // ══════════════════════════════════════════════════════════
  // 12. CONFETTI ON MILESTONES
  // ══════════════════════════════════════════════════════════
  function initConfetti() {
    const MILESTONES=[1,5,10,25,50,100,200];
    const colors=['#4E7A50','#C4954A','#A06080','#507AA0','#C06050','#8BAF8B'];

    function burst(n) {
      for(let i=0;i<n;i++){
        const p=document.createElement('div'); p.className='confetti-piece';
        p.style.cssText=`left:${Math.random()*100}vw;top:${-10+Math.random()*20}px;background:${colors[Math.floor(Math.random()*colors.length)]};animation-delay:${Math.random()*.8}s;animation-duration:${1.8+Math.random()*1.2}s;transform:rotate(${Math.random()*360}deg);width:${6+Math.random()*6}px;height:${6+Math.random()*6}px;border-radius:${Math.random()>.5?'50%':'2px'}`;
        document.body.appendChild(p);
        p.addEventListener('animationend',()=>p.remove());
      }
    }
    function showMilestone(count) {
      const msgs={1:{icon:'🌱',title:'First entry!',sub:'The journey begins.'},5:{icon:'✨',title:'5 entries!',sub:'A habit is forming.'},10:{icon:'🔥',title:'10 entries!',sub:"You're building something real."},25:{icon:'🌿',title:'25 entries!',sub:'Quarter century of thoughts.'},50:{icon:'🌟',title:'50 entries!',sub:'Half a hundred moments.'},100:{icon:'🎯',title:'100 entries!',sub:'A hundred stories.'},200:{icon:'🏆',title:'200 entries!',sub:'An extraordinary journal.'}};
      const msg=msgs[count]; if(!msg) return;
      let t=document.getElementById('tisa-milestone-toast');
      if(!t){t=document.createElement('div');t.id='tisa-milestone-toast';document.body.appendChild(t);}
      t.innerHTML=`<span class="ms-icon">${msg.icon}</span><div class="ms-title">${msg.title}</div><div class="ms-sub">${msg.sub}</div>`;
      t.style.display='block'; burst(60);
      setTimeout(()=>{t.style.display='none';},4200);
    }
    function checkMilestones() {
      const total=((window.personalEntries||[]).filter(e=>!e.trashed)).length;
      const last=parseInt(localStorage.getItem('tisa_last_milestone')||'0');
      const hit=MILESTONES.find(m=>total>=m&&last<m);
      if(hit){localStorage.setItem('tisa_last_milestone',hit);setTimeout(()=>showMilestone(hit),600);}
    }
    function patchNav(){
      const orig=window.navigate;
      if(typeof orig!=='function'){setTimeout(patchNav,300);return;}
      window.navigate=function(view){const r=orig.apply(this,arguments);if(view==='personal'||view==='dashboard')setTimeout(checkMilestones,800);return r;};
    }
    patchNav();
    window.TISA_CONFETTI={burst,checkMilestones};
  }

  // ══════════════════════════════════════════════════════════
  // 13. ENCRYPTED ENTRIES — SVG icon
  // ══════════════════════════════════════════════════════════
  function initEncryptedEntries() {
    function xorEnc(text,key){let r='';for(let i=0;i<text.length;i++)r+=String.fromCharCode(text.charCodeAt(i)^key.charCodeAt(i%key.length));return btoa(unescape(encodeURIComponent(r)));}
    function xorDec(enc,key){try{const t=decodeURIComponent(escape(atob(enc)));let r='';for(let i=0;i<t.length;i++)r+=String.fromCharCode(t.charCodeAt(i)^key.charCodeAt(i%key.length));return r;}catch(e){return null;}}

    if (!document.getElementById('tisa-encrypt-modal')) {
      const m=document.createElement('div'); m.id='tisa-encrypt-modal'; m.className='tisa-plugin-overlay'; m.style.display='none';
      m.innerHTML=`<div class="tisa-plugin-sheet" style="max-width:400px">
        <div class="tisa-plugin-sheet-hdr"><h3>${ICONS.lock.replace('<svg','<svg width="17" height="17"')} Encrypt Entry</h3><button class="tisa-close-btn" onclick="document.getElementById('tisa-encrypt-modal').style.display='none'">${ICONS.close}</button></div>
        <div class="tisa-plugin-sheet-body">
          <p style="font-size:13px;color:var(--ink-m);margin-bottom:16px;line-height:1.9;font-family:var(--serif);font-style:italic">Entry will be encrypted with your passphrase before saving. Keep it safe — no recovery exists.</p>
          <input type="password" id="tisa-enc-pass" placeholder="Enter passphrase…" class="enc-unlock-input" style="width:100%;margin-bottom:10px"/>
          <input type="password" id="tisa-enc-pass-confirm" placeholder="Confirm passphrase…" class="enc-unlock-input" style="width:100%;margin-bottom:16px"/>
          <button class="enc-unlock-btn" style="width:100%" onclick="TISA_ENCRYPT.confirmEncrypt()">Encrypt &amp; Save</button>
        </div>
      </div>`;
      document.body.appendChild(m);
      m.addEventListener('click',e=>{if(e.target===m)m.style.display='none';});
    }

    function injectToggle() {
      if(document.getElementById('tisa-encrypt-toggle')) return;
      const footer=document.querySelector('.ep-footer'); if(!footer) return;
      const btn=document.createElement('button'); btn.id='tisa-encrypt-toggle';
      btn.innerHTML=`${ICONS.lock.replace('<svg','<svg width="13" height="13"')} Encrypt`; btn.title='Encrypt this entry';
      btn.onclick=()=>{document.getElementById('tisa-encrypt-modal').style.display='flex';document.getElementById('tisa-enc-pass').focus();};
      footer.prepend(btn);
    }

    window.TISA_ENCRYPT={
      _pass:null,
      confirmEncrypt(){
        const p=document.getElementById('tisa-enc-pass').value;
        const c=document.getElementById('tisa-enc-pass-confirm').value;
        if(!p){_t('Enter a passphrase');return;}
        if(p!==c){_t('Passphrases do not match');return;}
        this._pass=p;
        document.getElementById('tisa-encrypt-modal').style.display='none';
        const btn=document.getElementById('tisa-encrypt-toggle');
        if(btn){btn.classList.add('active');btn.innerHTML=`${ICONS.unlock.replace('<svg','<svg width="13" height="13"')} Encrypted`;}
        _t('Entry will be encrypted on save ✓');
      },
      enc(t,k){return xorEnc(t,k);},
      dec(e,k){return xorDec(e,k);},
      reset(){this._pass=null;const btn=document.getElementById('tisa-encrypt-toggle');if(btn){btn.classList.remove('active');btn.innerHTML=`${ICONS.lock.replace('<svg','<svg width="13" height="13"')} Encrypt`;}}
    };

    onReady(()=>{
      injectToggle();
      function patchOpen(){const orig=window.openEditor;if(typeof orig!=='function'){setTimeout(patchOpen,300);return;}window.openEditor=function(){TISA_ENCRYPT.reset();const r=orig.apply(this,arguments);setTimeout(injectToggle,80);return r;};}
      patchOpen();
    });
  }

  // ══════════════════════════════════════════════════════════
  // 14. BACKUP — SVG icon, local JSON download
  // ══════════════════════════════════════════════════════════
  function initBackup() {
    function inject() {
      if(document.getElementById('tisa-backup-btn')) return;
      const sp=document.getElementById('settings-page'); if(!sp||sp.style.display==='none') return;
      const wrap=document.createElement('div'); wrap.style.cssText='margin:0 28px 16px;padding:18px;background:var(--paper);border-radius:14px;border:1px solid var(--border-s)';
      wrap.innerHTML=`<div style="font-family:var(--serif);font-size:16px;font-weight:500;color:var(--ink);margin-bottom:6px">${ICONS.download.replace('<svg','<svg width="16" height="16"')} Backup Journal</div>
        <div style="font-size:13px;color:var(--ink-m);margin-bottom:12px">Download all entries as JSON. Keep it safe.</div>
        <button id="tisa-backup-btn" onclick="TISA_BACKUP.download()">${ICONS.download.replace('<svg','<svg width="14" height="14"')} <span class="spinner-sm"></span> Download backup</button>`;
      sp.prepend(wrap);
    }
    window.TISA_BACKUP={
      async download(){
        const btn=document.getElementById('tisa-backup-btn'); if(btn)btn.classList.add('loading');
        try{
          const all={exportedAt:new Date().toISOString(),version:'tisa-v7',user:window.currentUser?.email||'unknown',
            personalEntries:(window.personalEntries||[]).map(e=>({id:e.id,title:e.title,content:e.content,mood:e.mood,tags:e.tags,createdAt:e.createdAt?.toDate?e.createdAt.toDate().toISOString():e.createdAt,font:e.font,color:e.color})),
            sharedEntries:(window.sharedEntries||[]).map(e=>({id:e.id,title:e.title,content:e.content,mood:e.mood,tags:e.tags,createdAt:e.createdAt?.toDate?e.createdAt.toDate().toISOString():e.createdAt,author:e.userId}))};
          const blob=new Blob([JSON.stringify(all,null,2)],{type:'application/json'});
          const url=URL.createObjectURL(blob); const a=document.createElement('a');
          a.href=url; a.download='tisa-backup-'+new Date().toISOString().slice(0,10)+'.json'; a.click(); URL.revokeObjectURL(url);
          _t('Backup downloaded ✓');
        }catch(e){_t('Backup failed: '+e.message);}
        if(btn)btn.classList.remove('loading');
      }
    };
    function patchNav(){const orig=window.navigate;if(typeof orig!=='function'){setTimeout(patchNav,300);return;}window.navigate=function(view){const r=orig.apply(this,arguments);if(view==='settings')setTimeout(inject,200);return r;};}
    patchNav();
  }

  // ══════════════════════════════════════════════════════════
  // 15. HIGHLIGHTER — fully functional, persisted to Firestore
  // ══════════════════════════════════════════════════════════
  function initHighlighter() {
    const HL_COLORS={nude:'#F5E6D3',sage:'#C4D9C4',gold:'#F5E8CC',pink:'#F9D9E2'};
    const HL_LABELS={nude:'Beige',sage:'Sage',gold:'Gold',pink:'Pink'};
    let activeColor='nude';

    function injectToolbar() {
      if(document.getElementById('hl-toolbar-wrap')) return;
      const acts=document.getElementById('detail-actions'); if(!acts) return;
      const wrap=document.createElement('div'); wrap.id='hl-toolbar-wrap';
      wrap.innerHTML='<span class="hl-label">Highlight</span>'+
        Object.keys(HL_COLORS).map(c=>`<button class="hl-btn ${c}" title="${HL_LABELS[c]}" onclick="TISA_HL.setColor('${c}')" style="background:${HL_COLORS[c]}"></button>`).join('')+
        '<button class="hl-clear-btn" onclick="TISA_HL.clear()">Clear all</button>';
      acts.parentNode.insertBefore(wrap, acts.nextSibling);
    }

    function persistHL(entryId, highlights) {
      try { localStorage.setItem('tj_highlights_'+entryId, JSON.stringify(highlights)); } catch(e){}
      try {
        const fs=window._v6fs;
        if(fs&&fs.db&&fs.updateDoc&&fs.doc) {
          fs.updateDoc(fs.doc(fs.db,'entries',entryId),{highlights,highlightsUpdatedAt:fs.serverTimestamp?fs.serverTimestamp():new Date()}).catch(()=>{});
        }
      } catch(e){}
    }

    function getHL(entry) {
      if(entry?.highlights?.length) return entry.highlights;
      try { return JSON.parse(localStorage.getItem('tj_highlights_'+(entry?.id||''))||'null'); } catch(e){return null;}
    }

    function restoreHL(entry) {
      const content=document.getElementById('detail-content'); if(!content) return;
      const stored=getHL(entry); if(!stored||!stored.length) return;
      stored.forEach(hl=>{
        if(!hl.text||!hl.color) return;
        const escaped=hl.text.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
        const re=new RegExp('('+escaped+')','g');
        content.innerHTML=content.innerHTML.replace(re,`<span class="highlight-${hl.color}" data-hl-color="${hl.color}" style="background:${HL_COLORS[hl.color]||'#F5E6D3'}">$1</span>`);
      });
    }

    function collectHL(entryId) {
      const content=document.getElementById('detail-content'); if(!content) return;
      const spans=content.querySelectorAll('[data-hl-color]');
      const highlights=[]; spans.forEach(el=>highlights.push({text:el.textContent,color:el.dataset.hlColor}));
      persistHL(entryId, highlights);
    }

    window.TISA_HL={
      setColor(c){
        activeColor=c;
        document.querySelectorAll('.hl-btn').forEach(b=>b.classList.toggle('active',b.classList.contains(c)));
        _t(HL_LABELS[c]+' highlighter active');
      },
      clear(){
        const content=document.getElementById('detail-content'); if(!content) return;
        content.querySelectorAll('[data-hl-color]').forEach(el=>{
          const txt=document.createTextNode(el.textContent); el.parentNode.replaceChild(txt,el);
        });
        content.normalize();
        const entry=window.selectedEntry;
        if(entry){localStorage.removeItem('tj_highlights_'+entry.id);persistHL(entry.id,[]);}
      },
      apply(){
        const sel=window.getSelection(); if(!sel||sel.isCollapsed||!sel.rangeCount) return;
        const range=sel.getRangeAt(0);
        const content=document.getElementById('detail-content');
        if(!content||!content.contains(range.commonAncestorContainer)) return;
        const txt=sel.toString().trim(); if(!txt) return;
        const span=document.createElement('span');
        span.className='highlight-'+activeColor; span.dataset.hlColor=activeColor;
        span.style.background=HL_COLORS[activeColor];
        try{range.surroundContents(span);}catch(e){const f=range.extractContents();span.appendChild(f);range.insertNode(span);}
        sel.removeAllRanges();
        const entry=window.selectedEntry; if(entry) collectHL(entry.id);
      }
    };

    function patchShowDetail(){
      const orig=window.showDetail;
      if(typeof orig!=='function'){setTimeout(patchShowDetail,400);return;}
      window.showDetail=function(entry){
        orig.apply(this,arguments);
        setTimeout(()=>{
          injectToolbar();
          restoreHL(entry);
          const content=document.getElementById('detail-content');
          if(content&&!content._hlAttached){
            content._hlAttached=true;
            content.addEventListener('mouseup',()=>setTimeout(()=>TISA_HL.apply(),10));
            content.addEventListener('touchend',()=>setTimeout(()=>TISA_HL.apply(),30));
          }
        },100);
      };
    }
    patchShowDetail();
  }

  // ══════════════════════════════════════════════════════════
  // 16. EDITOR SAVE FIX — ensure edits actually write to Firestore
  // ══════════════════════════════════════════════════════════
  function fixEditorSave() {
    function patch() {
      const origSave = window.saveEntry;
      if (typeof origSave !== 'function') { setTimeout(patch, 400); return; }
      window.saveEntry = async function() {
        const epContent = document.getElementById('ep-content')?.value?.trim();
        const focusContent = document.getElementById('focus-content')?.value?.trim();
        const twContent = document.getElementById('tw-content')?.value?.trim();
        const content = epContent || focusContent || twContent;
        if (!content) { _t('Please write something first.'); return; }

        const title = (document.getElementById('ep-title-input')?.value || document.getElementById('focus-title')?.value || '').trim();
        const tagsRaw = (document.getElementById('ep-tags')?.value || document.getElementById('focus-tags')?.value || '');
        const tags = tagsRaw.split(/[\s,]+/).filter(t=>t.startsWith('#')).map(t=>t.toLowerCase());
        const mood = window.selectedMood || '';
        const font = window._currentEpFont || 'cormorant';
        const color = window._currentEpColor || '';

        const editingEntry = window.editingEntry;
        const fs = window._v6fs;

        // If we have an editing entry AND Firestore is available, do a direct update
        if (editingEntry && editingEntry.id && fs && fs.db && fs.updateDoc && fs.doc) {
          const btn = document.getElementById('save-btn'); if(btn) btn.disabled=true;
          try {
            const updatePayload = {
              title, content, mood, tags, font, color,
              updatedAt: fs.serverTimestamp ? fs.serverTimestamp() : new Date()
            };
            await fs.updateDoc(fs.doc(fs.db, 'entries', editingEntry.id), updatePayload);
            // Also update local in-memory copy immediately
            const updateLocal = (arr) => {
              if (!Array.isArray(arr)) return;
              for (let i = 0; i < arr.length; i++) {
                if (arr[i] && arr[i].id === editingEntry.id) {
                  Object.assign(arr[i], {title, content, mood, tags, font, color, updatedAt: new Date()});
                  break;
                }
              }
            };
            updateLocal(window.personalEntries);
            updateLocal(window.sharedEntries);

            if (typeof window.closeEditor === 'function') window.closeEditor();
            _t('Entry updated ✓');
            if (typeof window.renderEntries === 'function') window.renderEntries();
            if (typeof window.renderDashboard === 'function') window.renderDashboard();
            if (typeof window.tisaShowSaved === 'function') window.tisaShowSaved();
          } catch(e) {
            console.error('[TISA Save] Edit update failed:', e);
            _t('Save failed: '+e.message);
          }
          if(btn) btn.disabled=false;
          return;
        }

        // Otherwise fall through to original save (new entry)
        return origSave.apply(this, arguments);
      };
    }
    patch();
  }

  // ══════════════════════════════════════════════════════════
  // 17. DASHBOARD FIX — show most recently UPDATED entry,
  //     fix click-through routing, filter out deleted entries
  // ══════════════════════════════════════════════════════════
  function fixDashboard() {
    function patch() {
      const origRender = window.renderDashboard;
      if (typeof origRender !== 'function') { setTimeout(patch, 400); return; }
      window.renderDashboard = function() {
        origRender.apply(this, arguments);
        // Fix "From My Journal" section — show most recently UPDATED entry, never trashed
        setTimeout(() => {
          const refBox = document.getElementById('reflection-box');
          if (!refBox) return;

          // Get all non-trashed personal entries sorted by updatedAt DESC
          const entries = (window.personalEntries || [])
            .filter(e => !e.trashed && (e.content || e.title))
            .sort((a, b) => {
              const da = a.updatedAt?.toDate ? a.updatedAt.toDate() : (a.updatedAt ? new Date(a.updatedAt) : (a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt||0)));
              const db2 = b.updatedAt?.toDate ? b.updatedAt.toDate() : (b.updatedAt ? new Date(b.updatedAt) : (b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt||0)));
              return db2 - da;
            });

          if (!entries.length) { refBox.style.display='none'; return; }
          const latest = entries[0];

          // Update display
          const refTitle = document.getElementById('ref-title');
          const refContent = document.getElementById('ref-content');
          const refMood = document.getElementById('ref-mood');
          const refDate = document.getElementById('ref-date');

          if (refMood) refMood.textContent = latest.mood || '';
          if (refTitle) { refTitle.textContent = latest.title || ''; refTitle.style.display = latest.title ? 'block' : 'none'; }
          if (refContent) {
            refContent.textContent = (latest.content || '').slice(0, 120) + ((latest.content||'').length > 120 ? '…' : '');
          }
          if (refDate) {
            try {
              const d = latest.createdAt?.toDate ? latest.createdAt.toDate() : new Date(latest.createdAt||0);
              refDate.textContent = d.toLocaleDateString('en-US', {weekday:'short', month:'short', day:'numeric'});
            } catch(e) {}
          }
          refBox.style.display='block';

          // FIX: make the reflection box navigate to the entry correctly
          refBox.style.cursor='pointer';
          // Remove any old click handler
          const fresh = refBox.cloneNode(true);
          refBox.parentNode.replaceChild(fresh, refBox);
          fresh.addEventListener('click', () => {
            // Register in _entries map
            if (!window._entries) window._entries = {};
            window._entries[latest.id] = latest;
            // Navigate to personal and open entry
            if (typeof window.navigate === 'function') window.navigate('personal');
            setTimeout(() => {
              if (typeof window.showDetail === 'function') window.showDetail(latest);
            }, 150);
          });
        }, 100);
      };
    }
    patch();
  }

  // ══════════════════════════════════════════════════════════
  // 18. FOOTER — replace personal email with support handle
  // ══════════════════════════════════════════════════════════
  function fixFooterAndLegal() {
    // Update global footer content
    onReady(() => {
      const footer = document.getElementById('tisa-global-footer');
      if (footer) {
        footer.innerHTML = `© Copyright Reserved to Sachin 2026 &nbsp;·&nbsp; <a href="mailto:tisa.helpdesk@gmail.com">tisa.helpdesk@gmail.com</a> &nbsp;·&nbsp; <span onclick="openLegal('privacy')">Privacy</span> &nbsp;·&nbsp; <span onclick="openLegal('terms')">Terms</span>`;
      }

      // Fix legal modal contact section (image 5 shows personal email)
      function fixLegalContact() {
        const legalBody = document.querySelectorAll('.legal-body, #legal-content-privacy, #legal-content-terms');
        legalBody.forEach(el => {
          if (el.innerHTML && el.innerHTML.includes('tisa.helpdesk@gmail.com')) {
            el.innerHTML = el.innerHTML.replace(
              /sachinbhattacharya12@gmail\.com/g,
              'tisa.helpdesk@gmail.com'
            ).replace(
              /sachinbhattacharya@gmail\.com/g,
              'tisa.helpdesk@gmail.com'
            );
          }
        });
      }

      // Run fix after legal modal is likely rendered
      setTimeout(fixLegalContact, 500);
      document.addEventListener('click', e => {
        if (e.target.textContent === 'Privacy Policy' || e.target.textContent === 'Terms of Service') {
          setTimeout(fixLegalContact, 100);
        }
      });
    });
  }

  // ══════════════════════════════════════════════════════════
  // 19. FOOTER VISIBILITY — show only when app is visible,
  //     hide when editor is open (prevents layout conflict)
  // ══════════════════════════════════════════════════════════
  function initFooterVisibility() {
    onReady(() => {
      const footer = document.getElementById('tisa-global-footer');
      if (!footer) return;

      function updateFooter() {
        const appEl = document.getElementById('app');
        const authEl = document.getElementById('auth-screen');
        const editorEl = document.getElementById('editor-panel');
        const appVisible = appEl && appEl.style.display !== 'none';
        const editorOpen = editorEl && !editorEl.classList.contains('hidden');
        footer.style.display = (appVisible && !editorOpen) ? 'block' : 'none';
      }

      // Observe app visibility
      const appEl = document.getElementById('app');
      if (appEl) {
        new MutationObserver(updateFooter).observe(appEl, { attributes: true });
      }
      const editorEl = document.getElementById('editor-panel');
      if (editorEl) {
        new MutationObserver(updateFooter).observe(editorEl, { attributes: true, attributeFilter: ['class'] });
      }
      updateFooter();
    });
  }

  // ══════════════════════════════════════════════════════════
  // DRAW BUTTON — inject into editor with SVG icon
  // ══════════════════════════════════════════════════════════

  // ══════════════════════════════════════════════════════════
  // STATIC SECTION DOODLES — pure inline SVG, zero animation,
  // zero network requests, zero JS animation = zero lag
  // ══════════════════════════════════════════════════════════
  function injectSectionDoodles() {
    const defs = {
      // Personal Journal / Entries — open book
      'entries-page': {
        pos: 'bottom:50px;right:28px;width:130px;height:110px',
        svg: `<svg viewBox="0 0 130 110" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round">
          <path d="M8 12 L8 98 L65 93 L122 98 L122 12 L65 17 Z"/>
          <line x1="65" y1="17" x2="65" y2="93"/>
          <line x1="22" y1="30" x2="58" y2="28"/>
          <line x1="22" y1="42" x2="58" y2="40"/>
          <line x1="22" y1="54" x2="52" y2="52"/>
          <line x1="22" y1="66" x2="55" y2="64"/>
          <line x1="72" y1="28" x2="108" y2="30"/>
          <line x1="72" y1="40" x2="108" y2="42"/>
          <line x1="72" y1="52" x2="102" y2="54"/>
          <line x1="72" y1="64" x2="106" y2="66"/>
        </svg>`
      },
      // Poems — quill pen
      'poems-page': {
        pos: 'top:28px;right:36px;width:72px;height:120px',
        svg: `<svg viewBox="0 0 72 120" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round">
          <path d="M62 6 Q68 22 54 52 Q44 72 36 115"/>
          <path d="M62 6 Q70 20 58 40 Q48 56 36 64"/>
          <path d="M62 6 Q54 14 50 30 Q44 50 36 64"/>
          <path d="M62 6 Q45 14 40 34 Q37 52 36 64"/>
          <ellipse cx="35" cy="117" rx="3" ry="4"/>
          <line x1="10" y1="85" x2="32" y2="80"/>
          <line x1="8" y1="96" x2="30" y2="91"/>
        </svg>`
      },
      // Notes — notepad with lines
      'notes-page': {
        pos: 'bottom:36px;right:28px;width:95px;height:100px',
        svg: `<svg viewBox="0 0 95 100" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round">
          <rect x="8" y="14" width="79" height="82" rx="5"/>
          <rect x="8" y="14" width="11" height="82" rx="4"/>
          <line x1="27" y1="32" x2="79" y2="32"/>
          <line x1="27" y1="46" x2="79" y2="46"/>
          <line x1="27" y1="60" x2="79" y2="60"/>
          <line x1="27" y1="74" x2="65" y2="74"/>
          <rect x="30" y="4" width="9" height="16" rx="4"/>
          <rect x="56" y="4" width="9" height="16" rx="4"/>
        </svg>`
      },
      // Memories — camera
      'memories-page': {
        pos: 'top:36px;left:26px;width:108px;height:88px',
        svg: `<svg viewBox="0 0 108 88" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round">
          <rect x="4" y="20" width="100" height="64" rx="8"/>
          <path d="M28 20 L36 8 L72 8 L80 20"/>
          <circle cx="54" cy="52" r="18"/>
          <circle cx="54" cy="52" r="10"/>
          <circle cx="82" cy="34" r="4"/>
        </svg>`
      },
      // Lyrics — music note
      'lyrics-page': {
        pos: 'top:18px;right:28px;width:88px;height:108px',
        svg: `<svg viewBox="0 0 88 108" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round">
          <line x1="32" y1="22" x2="32" y2="88"/>
          <line x1="32" y1="22" x2="78" y2="12"/>
          <line x1="78" y1="12" x2="78" y2="78"/>
          <ellipse cx="22" cy="90" rx="12" ry="9"/>
          <ellipse cx="68" cy="80" rx="12" ry="9"/>
          <line x1="8" y1="46" x2="28" y2="44"/>
          <line x1="8" y1="58" x2="28" y2="56"/>
        </svg>`
      },
      // Pages — vintage scroll
      'pages-page': {
        pos: 'bottom:36px;right:36px;width:88px;height:118px',
        svg: `<svg viewBox="0 0 88 118" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round">
          <path d="M14 18 Q8 8 18 6 Q26 4 28 13 L28 103 Q30 113 20 115 Q10 117 8 108 Q6 98 14 96 L74 96 Q82 94 83 86 L83 16 Q82 8 74 6 L24 6"/>
          <line x1="36" y1="28" x2="72" y2="28"/>
          <line x1="36" y1="42" x2="72" y2="42"/>
          <line x1="36" y1="56" x2="64" y2="56"/>
          <line x1="36" y1="70" x2="70" y2="70"/>
        </svg>`
      },
      // Shared journal — two overlapping circles (connection)
      'shared-page': {
        pos: 'bottom:50px;right:28px;width:120px;height:100px',
        svg: `<svg viewBox="0 0 120 100" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round">
          <circle cx="42" cy="50" r="32"/>
          <circle cx="78" cy="50" r="32"/>
          <path d="M60 22 Q72 36 72 50 Q72 64 60 78 Q48 64 48 50 Q48 36 60 22Z" opacity=".4"/>
        </svg>`
      }
    };

    // Also inject into shared journal entries page when in shared view
    const sharedPage = document.getElementById('entries-page');
    if (sharedPage && window.currentView === 'shared') {
      defs['entries-page'].key = 'shared-page';
    }

    Object.entries(defs).forEach(([pageId, def]) => {
      const page = document.getElementById(pageId);
      if (!page) return;
      if (page.querySelector('.tisa-section-doodle')) return; // already injected
      const wrap = document.createElement('div');
      wrap.className = 'tisa-section-doodle';
      wrap.setAttribute('aria-hidden', 'true');
      wrap.style.cssText = def.pos + ';position:absolute;pointer-events:none;';
      wrap.innerHTML = def.svg;
      page.style.position = 'relative';
      page.appendChild(wrap);
    });
  }

  function initDrawButton() {
    function injectDrawBtn() {
      if(document.getElementById('tisa-draw-btn')) return;
      const actions=document.querySelector('.ep-actions'); if(!actions) return;
      const btn=document.createElement('button'); btn.id='tisa-draw-btn'; btn.className='icon-btn'; btn.title='Draw / Sketch';
      btn.innerHTML=ICONS.pen; btn.style.cssText='display:flex;align-items:center;justify-content:center;width:32px;height:32px';
      btn.onclick=()=>window.TISA_DRAW?.open();
      actions.prepend(btn);
    }
    onReady(()=>{
      injectDrawBtn();
      function patchOpen(){const orig=window.openEditor;if(typeof orig!=='function'){setTimeout(patchOpen,300);return;}window.openEditor=function(){const r=orig.apply(this,arguments);setTimeout(injectDrawBtn,80);return r;};}
      patchOpen();
    });
  }

  // ══════════════════════════════════════════════════════════
  // INIT ALL
  // ══════════════════════════════════════════════════════════
  onReady(function() {
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
    initHighlighter();
    initFooterVisibility();
    initDrawButton();
    fixFooterAndLegal();
    fixEditorSave();
    fixDashboard();
    // Inject static doodles after initial load
    setTimeout(injectSectionDoodles, 600);

    // Re-inject on each navigation (pages are hidden/shown, not recreated)
    (function patchNavForDoodles() {
      const origNav = window.navigate;
      if (typeof origNav !== 'function') { setTimeout(patchNavForDoodles, 400); return; }
      window.navigate = function(view) {
        const r = origNav.apply(this, arguments);
        setTimeout(injectSectionDoodles, 200);
        return r;
      };
    })();

    console.log('[TISA Plugins v2.0] loaded ✓');
  });

})();


// ═══════════════════════════════════════════════════════════════
// TISA PLUGINS v3.0 — ADDITIONS & FIXES
// ═══════════════════════════════════════════════════════════════

(function TISA_PLUGINS_V3() {
  'use strict';

  function _t(msg) { if (typeof window.toast === 'function') window.toast(msg); }
  function _esc(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function onReady(fn) { if (document.readyState !== 'loading') { fn(); return; } document.addEventListener('DOMContentLoaded', fn); }

  // ──────────────────────────────────────────────────────────
  // FIX A: Firestore sharedJournal create rule
  // App writes `createdBy` but rules check `creatorId`. Patch to write both.
  // ──────────────────────────────────────────────────────────
  (function fixSharedJournalCreate() {
    function patch() {
      var orig = window.createSharedJournal;
      if (typeof orig !== 'function') { setTimeout(patch, 400); return; }
      window.createSharedJournal = async function() {
        var fs = window._v6fs, cu = window.currentUser;
        if (!fs || !cu) { return orig.apply(this, arguments); }
        var origAddDoc = fs.addDoc;
        fs.addDoc = async function(collRef, data) {
          var path = String(collRef && (collRef._path || collRef.path || JSON.stringify(collRef)));
          if (path.includes('sharedJournals')) {
            data = Object.assign({}, data, { creatorId: cu.uid, createdBy: cu.uid });
          }
          return origAddDoc.call(this, collRef, data);
        };
        try { return await orig.apply(this, arguments); }
        finally { fs.addDoc = origAddDoc; }
      };
    }
    patch();
  })();

  // ──────────────────────────────────────────────────────────
  // FIX B: Poem card action buttons CSS
  // ──────────────────────────────────────────────────────────
  onReady(function() {
    var style = document.createElement('style');
    style.textContent = [
      '.pc { position: relative; overflow: visible; }',
      '.pc-cab,.lyr-cab { position:absolute;top:10px;right:10px;display:flex;gap:4px;opacity:0;transition:opacity .15s;z-index:2; }',
      '.pc:hover .pc-cab,.lyr-card:hover .lyr-cab { opacity:1; }',
      '.pc-cab .cab,.lyr-cab .cab { background:var(--sage-p);border:1.5px solid var(--sage-l);cursor:pointer;padding:5px 8px;border-radius:8px;color:var(--sage-d);display:flex;align-items:center;justify-content:center;transition:all .14s; }',
      '.pc-cab .cab:hover,.lyr-cab .cab:hover { background:var(--sage-l);color:var(--sage-dd);transform:scale(1.08); }',
    ].join('\n');
    document.head.appendChild(style);
  });

  // ──────────────────────────────────────────────────────────
  // FIX C: 5-tab mobile bottom nav
  // ──────────────────────────────────────────────────────────
  onReady(function() {
    var nav = document.getElementById('mob-bottom-nav');
    if (!nav) return;
    nav.innerHTML = [
      '<button class="mob-nav-btn active" id="mob-nav-dashboard" onclick="navigate(\'dashboard\');_tisaV3NavSync(\'dashboard\')" aria-label="Home"><div class="mob-nav-icon-wrap"><svg class="mob-nav-icon" viewBox="0 0 24 24"><path d="M3 10.5L12 3l9 7.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-9.5z"/><path d="M9 21v-7h6v7"/></svg></div><span>Home</span></button>',
      '<button class="mob-nav-btn" id="mob-nav-personal" onclick="navigate(\'personal\');_tisaV3NavSync(\'personal\')" aria-label="Journal"><div class="mob-nav-icon-wrap"><svg class="mob-nav-icon" viewBox="0 0 24 24"><path d="M4 19.5C4 18.1 5.1 17 6.5 17H20"/><path d="M6.5 2H20v20H6.5C5.1 22 4 20.9 4 19.5v-15C4 3.1 5.1 2 6.5 2z"/><line x1="8.5" y1="7" x2="16" y2="7"/><line x1="8.5" y1="11" x2="14" y2="11"/></svg></div><span>Journal</span></button>',
      '<button class="mob-nav-btn" id="mob-nav-shared" onclick="navigate(\'shared\');_tisaV3NavSync(\'shared\')" aria-label="Shared"><div class="mob-nav-icon-wrap"><svg class="mob-nav-icon" viewBox="0 0 24 24"><circle cx="8" cy="8" r="3.5"/><circle cx="17" cy="8" r="2.5"/><path d="M1 20c0-3.3 3.1-6 7-6s7 2.7 7 6"/><path d="M20 20c0-2.2-1.6-4-3.6-5"/></svg></div><span>Shared</span></button>',
      '<button class="mob-nav-btn" id="mob-nav-memories" onclick="navigate(\'memories\');_tisaV3NavSync(\'memories\')" aria-label="Memories"><div class="mob-nav-icon-wrap"><svg class="mob-nav-icon" viewBox="0 0 24 24"><rect x="2.5" y="4" width="19" height="16" rx="2.5"/><path d="M2.5 16l5-5 3.5 3.5 3-3 5.5 5.5"/><circle cx="8" cy="9" r="1.5" fill="currentColor" stroke="none"/></svg></div><span>Memories</span></button>',
      '<button class="mob-nav-btn" id="mob-nav-more" onclick="_tisaV3MoreSheet()" aria-label="More"><div class="mob-nav-icon-wrap"><svg class="mob-nav-icon" viewBox="0 0 24 24"><circle cx="12" cy="5" r="1.5" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none"/><circle cx="12" cy="19" r="1.5" fill="currentColor" stroke="none"/></svg></div><span>More</span></button>',
    ].join('');

    window._tisaV3NavSync = function(view) {
      document.querySelectorAll('.mob-nav-btn').forEach(function(b) { b.classList.remove('active'); });
      var btn = document.getElementById('mob-nav-' + view);
      if (btn) btn.classList.add('active');
    };

    window._tisaV3MoreSheet = function() {
      document.querySelectorAll('.mob-nav-btn').forEach(function(b) { b.classList.remove('active'); });
      var moreBtn = document.getElementById('mob-nav-more');
      if (moreBtn) moreBtn.classList.add('active');
      var existing = document.getElementById('tisa-v3-more-sheet');
      if (existing) { existing.remove(); return; }
      var sheet = document.createElement('div');
      sheet.id = 'tisa-v3-more-sheet';
      sheet.style.cssText = 'position:fixed;bottom:0;left:0;right:0;z-index:500;background:var(--paper);border-radius:20px 20px 0 0;padding:16px 16px calc(16px + env(safe-area-inset-bottom,0px));box-shadow:0 -8px 40px rgba(26,23,20,.15);animation:sheetUp .25s ease both';
      var items = [['poems','✍️','Poems'],['notes','📝','Notes'],['lyrics','🎵','Lyrics'],['pages','📜','Pages'],['favorites','⭐','Favorites'],['archive','📁','Archive'],['trash','🗑️','Bin'],['settings','⚙️','Settings']];
      sheet.innerHTML = '<div style="width:40px;height:4px;background:var(--border-m);border-radius:99px;margin:0 auto 16px"></div><div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px">' +
        items.map(function(item) {
          return '<button onclick="navigate(\'' + item[0] + '\');_tisaV3NavSync(\'' + item[0] + '\');var s=document.getElementById(\'tisa-v3-more-sheet\');if(s)s.remove();" style="display:flex;flex-direction:column;align-items:center;gap:5px;padding:12px 6px;background:var(--sand);border:1px solid var(--border-s);border-radius:14px;cursor:pointer;font-size:11px;color:var(--ink-m);font-weight:500;transition:all .14s"><span style="font-size:20px">' + item[1] + '</span>' + item[2] + '</button>';
        }).join('') + '</div>';
      document.body.appendChild(sheet);
      setTimeout(function() {
        function dismiss(e) { if (!sheet.contains(e.target) && e.target.id !== 'mob-nav-more') { sheet.remove(); document.removeEventListener('touchstart', dismiss); } }
        document.addEventListener('touchstart', dismiss);
      }, 150);
    };

    // Patch navigate to sync nav
    var _origNav = window.navigate;
    if (typeof _origNav === 'function') {
      window.navigate = function(view) {
        var r = _origNav.apply(this, arguments);
        _tisaV3NavSync(view);
        return r;
      };
    }
  });

  // ──────────────────────────────────────────────────────────
  // FIX D: Cover Art multi-backend (override TISA_COVERART.generate)
  // ──────────────────────────────────────────────────────────
  (function fixCoverArt() {
    var CURATED = [
      {url:'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=70',label:'Mountains'},
      {url:'https://images.unsplash.com/photo-1523712999610-f77fbcfc3843?w=800&q=70',label:'Forest'},
      {url:'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?w=800&q=70',label:'Lake'},
      {url:'https://images.unsplash.com/photo-1490750967868-88df5691cc00?w=800&q=70',label:'Flowers'},
      {url:'https://images.unsplash.com/photo-1518098268026-4e89f1a2cd8e?w=800&q=70',label:'Stars'},
      {url:'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=70',label:'Blossom'},
      {url:'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&q=70',label:'Road'},
      {url:'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=800&q=70',label:'Hills'},
      {url:'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=800&q=70',label:'Galaxy'},
    ];

    function waitAndPatch() {
      if (!window.TISA_COVERART) { setTimeout(waitAndPatch, 500); return; }
      // Add backend selector injection to modal
      var _origOpen = window.TISA_COVERART.open;
      window.TISA_COVERART._backend = 'pollinations';
      window.TISA_COVERART.open = function() {
        if (typeof _origOpen === 'function') _origOpen.apply(this, arguments);
        // Inject backend pills if not present
        setTimeout(function() {
          var modal = document.getElementById('tisa-cover-art-modal');
          if (!modal || document.getElementById('tisa-art-backend-row')) return;
          var promptRow = modal.querySelector('.art-ai-row');
          if (!promptRow) return;
          var row = document.createElement('div');
          row.id = 'tisa-art-backend-row';
          row.style.cssText = 'display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px';
          row.innerHTML = '<button class="art-backend-pill active" onclick="window.TISA_COVERART._backend=\'pollinations\';this.parentNode.querySelectorAll(\'.art-backend-pill\').forEach(function(b){b.classList.remove(\'active\')});this.classList.add(\'active\')">🎨 Pollinations AI</button>' +
            '<button class="art-backend-pill" onclick="window.TISA_COVERART._backend=\'curated\';this.parentNode.querySelectorAll(\'.art-backend-pill\').forEach(function(b){b.classList.remove(\'active\')});this.classList.add(\'active\')">📷 Curated only</button>';
          promptRow.parentNode.insertBefore(row, promptRow);
          // Add status div
          if (!document.getElementById('tisa-art-status')) {
            var status = document.createElement('div');
            status.id = 'tisa-art-status';
            status.style.cssText = 'font-size:12px;color:var(--ink-m);font-style:italic;padding:4px 0;display:none';
            promptRow.parentNode.insertBefore(status, promptRow.nextSibling);
          }
        }, 100);
      };

      // Override generate with multi-backend + reliable fallback
      window.TISA_COVERART.generate = async function() {
        if (this._generating) return;
        var prompt = (document.getElementById('tisa-art-prompt') || {}).value;
        if (prompt) prompt = prompt.trim();
        if (!prompt) { _t('Enter a description first'); return; }

        var btn = document.getElementById('tisa-art-gen-btn');
        var aiResult = document.getElementById('tisa-art-ai-result');
        var aiImg = document.getElementById('tisa-art-ai-img');
        var statusEl = document.getElementById('tisa-art-status');
        if (!aiResult || !aiImg) return;

        function setStatus(msg) { if (statusEl) { statusEl.textContent = msg; statusEl.style.display = msg ? 'block' : 'none'; } }

        if (this._backend === 'curated') {
          var rand = Math.floor(Math.random() * CURATED.length);
          aiImg.src = CURATED[rand].url;
          aiImg.classList.remove('selected');
          aiResult.classList.add('visible');
          setStatus('Showing curated: ' + CURATED[rand].label);
          return;
        }

        this._generating = true;
        if (btn) btn.classList.add('loading');
        aiResult.classList.remove('visible');
        setStatus('Generating AI image…');

        var seed = Date.now() % 99999;
        var encoded = encodeURIComponent('aesthetic journal cover art, ' + prompt + ', soft watercolour, warm tones, no text, painterly');
        var pollinationsUrl = 'https://image.pollinations.ai/prompt/' + encoded + '?width=800&height=350&seed=' + seed + '&nologo=true&enhance=true';

        var self = this;

        function tryImg(url, timeout) {
          return new Promise(function(res, rej) {
            var img = new Image(); img.crossOrigin = 'anonymous';
            var t = setTimeout(function() { rej(new Error('timeout')); }, timeout);
            img.onload = function() { clearTimeout(t); res(url); };
            img.onerror = function() { clearTimeout(t); rej(new Error('error')); };
            img.src = url;
          });
        }

        try {
          var url = await tryImg(pollinationsUrl, 14000);
          aiImg.src = url; aiImg.classList.remove('selected');
          aiResult.classList.add('visible'); setStatus('');
        } catch(e) {
          var fallback = CURATED[seed % CURATED.length];
          aiImg.src = fallback.url; aiImg.classList.remove('selected');
          aiResult.classList.add('visible');
          setStatus('AI unavailable — showing: ' + fallback.label);
        }
        if (btn) btn.classList.remove('loading');
        self._generating = false;
      };
    }
    waitAndPatch();
  })();

  // ──────────────────────────────────────────────────────────
  // NEW: Word Goal Tracker
  // ──────────────────────────────────────────────────────────
  (function initWordGoal() {
    var goal = parseInt(localStorage.getItem('tisa_word_goal') || '200', 10);

    // Top progress bar
    onReady(function() {
      if (document.getElementById('tisa-word-goal-bar')) return;
      var bar = document.createElement('div');
      bar.id = 'tisa-word-goal-bar';
      bar.innerHTML = '<div id="tisa-word-goal-fill"></div>';
      document.body.appendChild(bar);

      // Widget
      var widget = document.createElement('div');
      widget.id = 'tisa-word-goal-widget';
      widget.innerHTML = '<div class="word-goal-header"><span>Daily Goal</span><button onclick="TISA_WORDGOAL.editGoal()" style="background:none;border:none;cursor:pointer;font-size:13px;color:var(--sage-d)" title="Change">✎</button></div><div style="display:flex;align-items:baseline;gap:5px"><div class="word-goal-count" id="wg-count">0</div><div class="word-goal-target">/ <span id="wg-goal">' + goal + '</span> words</div></div><div class="word-goal-track"><div class="word-goal-progress" id="wg-progress"></div></div>';
      document.body.appendChild(widget);
    });

    function countTodayWords() {
      var today = new Date().toISOString().slice(0,10);
      var entries = (window.personalEntries||[]).filter(function(e) {
        if(e.trashed) return false;
        var d = e.createdAt && e.createdAt.toDate ? e.createdAt.toDate() : new Date(e.createdAt||0);
        return d.toISOString().slice(0,10) === today;
      });
      return entries.reduce(function(s,e){ return s + ((e.content||'').trim().split(/\s+/).filter(Boolean).length); }, 0);
    }

    function updateGoalUI(editorWords) {
      var todayBase = countTodayWords();
      var total = todayBase + (editorWords||0);
      var countEl = document.getElementById('wg-count');
      var progEl = document.getElementById('wg-progress');
      var fillEl = document.getElementById('tisa-word-goal-fill');
      var pct = Math.min(100, Math.round((total/goal)*100));
      if (countEl) countEl.textContent = total;
      if (progEl) { progEl.style.width=pct+'%'; progEl.classList.toggle('done',pct>=100); }
      if (fillEl) fillEl.style.width = pct + '%';
      if (pct >= 100 && total > 0) {
        var todayKey = 'tisa_goal_hit_' + new Date().toISOString().slice(0,10);
        if (!localStorage.getItem(todayKey)) {
          localStorage.setItem(todayKey,'1');
          _t('Goal reached! ' + total + ' words today ✓');
          if (window.TISA_CONFETTI) window.TISA_CONFETTI.burst(35);
        }
      }
    }

    window.TISA_WORDGOAL = {
      update: function(ew){ updateGoalUI(ew||0); },
      show: function(){ var w=document.getElementById('tisa-word-goal-widget'); if(w)w.classList.add('visible'); },
      hide: function(){ var w=document.getElementById('tisa-word-goal-widget'); if(w)w.classList.remove('visible'); },
      editGoal: function(){
        var ng=parseInt(prompt('Set daily word goal:',goal)||goal,10);
        if(ng>0){goal=ng;localStorage.setItem('tisa_word_goal',goal);var g=document.getElementById('wg-goal');if(g)g.textContent=goal;updateGoalUI(0);_t('Goal: '+goal+' words/day');}
      }
    };

    // Hook editor open/close
    function patchEditorOpen() {
      var orig=window.openEditor;if(typeof orig!=='function'){setTimeout(patchEditorOpen,300);return;}
      window.openEditor=function(){var r=orig.apply(this,arguments);TISA_WORDGOAL.show();TISA_WORDGOAL.update(0);return r;};
    }
    function patchEditorClose() {
      var orig=window.closeEditor;if(typeof orig!=='function'){setTimeout(patchEditorClose,300);return;}
      window.closeEditor=function(){TISA_WORDGOAL.hide();return orig.apply(this,arguments);};
    }
    patchEditorOpen(); patchEditorClose();

    // Live update as user types
    onReady(function(){
      var ta=document.getElementById('ep-content');
      if(ta)ta.addEventListener('input',function(){
        var words=ta.value.trim()?ta.value.trim().split(/\s+/).length:0;
        TISA_WORDGOAL.update(words);
      });
    });
  })();

  // ──────────────────────────────────────────────────────────
  // NEW: Mood Analytics Chart
  // ──────────────────────────────────────────────────────────
  (function initMoodAnalytics() {
    onReady(function() {
      if (document.getElementById('tisa-mood-chart-modal')) return;
      var modal = document.createElement('div');
      modal.id = 'tisa-mood-chart-modal';
      modal.className = 'tisa-plugin-overlay';
      modal.style.display = 'none';
      modal.innerHTML = '<div class="tisa-plugin-sheet" style="max-width:500px"><div class="tisa-plugin-sheet-hdr"><h3 style="font-family:var(--serif);font-size:19px;font-weight:600;color:var(--ink)">📊 Mood Analytics</h3><button onclick="document.getElementById(\'tisa-mood-chart-modal\').style.display=\'none\'" style="background:var(--sand);border:1px solid var(--border-s);cursor:pointer;width:32px;height:32px;border-radius:8px;font-size:18px;display:flex;align-items:center;justify-content:center;color:var(--ink-m)">✕</button></div><div class="tisa-plugin-sheet-body" id="tisa-mood-body"><p style="color:var(--ink-m);text-align:center">Loading…</p></div></div>';
      document.body.appendChild(modal);
      modal.addEventListener('click', function(e) { if(e.target===modal)modal.style.display='none'; });
    });

    window.TISA_MOOD_CHART = {
      open: function() {
        var modal = document.getElementById('tisa-mood-chart-modal');
        if (modal) { modal.style.display='flex'; this.render(); }
      },
      render: function() {
        var body = document.getElementById('tisa-mood-body'); if(!body)return;
        var entries = (window.personalEntries||[]).filter(function(e){return !e.trashed&&e.mood;});
        if(!entries.length){body.innerHTML='<p style="color:var(--ink-m);font-style:italic;text-align:center;padding:20px">No mood data yet. Start writing with moods selected!</p>';return;}
        var counts = {};
        entries.forEach(function(e){counts[e.mood]=(counts[e.mood]||0)+1;});
        var sorted = Object.entries(counts).sort(function(a,b){return b[1]-a[1];}).slice(0,8);
        var maxCount = sorted[0][1];
        var topMood = sorted[0][0];
        var weekDays = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
        var now = new Date();
        var last7 = [];
        for(var i=6;i>=0;i--){var d=new Date(now);d.setDate(d.getDate()-i);var ds=d.toISOString().slice(0,10);var de=entries.filter(function(e){var ed=e.createdAt&&e.createdAt.toDate?e.createdAt.toDate():new Date(e.createdAt||0);return ed.toISOString().slice(0,10)===ds;});last7.push({day:weekDays[d.getDay()],mood:de.length?de[de.length-1].mood:null});}
        var weekCount=entries.filter(function(e){var d=e.createdAt&&e.createdAt.toDate?e.createdAt.toDate():new Date(e.createdAt||0);return Date.now()-d.getTime()<7*86400000;}).length;
        body.innerHTML='<p style="font-size:11px;font-weight:700;color:var(--ink-f);letter-spacing:1.2px;text-transform:uppercase;margin-bottom:12px">Last 7 days</p><div class="mood-chart-week">' +
          last7.map(function(d){return '<div class="mood-week-dot"><div class="mood-week-emoji">'+(d.mood||'○')+'</div><div class="mood-week-day">'+d.day+'</div></div>';}).join('') +
          '</div><p style="font-size:11px;font-weight:700;color:var(--ink-f);letter-spacing:1.2px;text-transform:uppercase;margin:16px 0 12px">All-time distribution</p>' +
          sorted.map(function(item){var mood=item[0],count=item[1];return '<div class="mood-bar-row"><div class="mood-bar-label">'+mood+'</div><div class="mood-bar-track"><div class="mood-bar-fill" style="width:'+Math.round(count/maxCount*100)+'%"></div></div><div class="mood-bar-count">'+count+'</div></div>';}).join('') +
          '<div class="mood-insight" style="margin-top:16px">You\'ve written '+entries.length+' mood-tagged entries. Your most frequent mood is '+topMood+'. This week you journaled '+weekCount+' time'+(weekCount!==1?'s':'')+'.</div>';
      }
    };

    // Add button to dashboard
    function injectMoodBtn() {
      if (document.getElementById('tisa-v3-mood-btn')) return;
      var dashPage = document.getElementById('dash-page'); if(!dashPage) return;
      var btn = document.createElement('button');
      btn.id = 'tisa-v3-mood-btn';
      btn.style.cssText = 'display:inline-flex;align-items:center;gap:6px;padding:7px 14px;background:var(--sage-p);border:1.5px solid var(--sage-l);border-radius:10px;font-size:12.5px;font-weight:500;color:var(--sage-d);cursor:pointer;margin-bottom:16px;transition:all .18s';
      btn.innerHTML = '📊 Mood Analytics';
      btn.onclick = function() { TISA_MOOD_CHART.open(); };
      dashPage.prepend(btn);
    }
    (function patchNav(){var orig=window.navigate;if(typeof orig!=='function'){setTimeout(patchNav,300);return;}window.navigate=function(view){var r=orig.apply(this,arguments);if(view==='dashboard')setTimeout(injectMoodBtn,300);return r;};})();
  })();

  // ──────────────────────────────────────────────────────────
  // NEW: Reading Time in detail view
  // ──────────────────────────────────────────────────────────
  (function initReadingTime() {
    function patch(){
      var orig=window.showDetail;if(typeof orig!=='function'){setTimeout(patch,400);return;}
      window.showDetail=function(entry){
        orig.apply(this,arguments);
        setTimeout(function(){
          var meta=document.getElementById('detail-meta');if(!meta)return;
          if(meta.querySelector('.reading-time-badge'))return;
          var words=(entry.content||'').trim().split(/\s+/).filter(Boolean).length;
          if(words<30)return;
          var mins=Math.max(1,Math.ceil(words/200));
          var badge=document.createElement('span');
          badge.className='reading-time-badge';
          badge.style.cssText='display:inline-flex;align-items:center;gap:5px;font-size:11px;color:var(--ink-m);background:var(--sand);border:1px solid var(--border-s);border-radius:20px;padding:2px 9px;margin-left:6px';
          badge.innerHTML='📖 '+mins+' min read';
          meta.appendChild(badge);
        },80);
      };
    }
    patch();
  })();

  // ──────────────────────────────────────────────────────────
  // NEW: Partner Typing Indicator
  // ──────────────────────────────────────────────────────────
  (function initPartnerTyping() {
    var _typingTimer=null, _unsub=null, _myTimer=null;
    function injectIndicator(){
      if(document.getElementById('tisa-partner-typing'))return;
      var ep=document.getElementById('entries-page');if(!ep)return;
      var ind=document.createElement('div');ind.id='tisa-partner-typing';
      ind.style.cssText='display:none;align-items:center;gap:8px;padding:8px 18px;font-size:13px;color:var(--warm);font-family:var(--serif);font-style:italic;animation:fadeIn .3s ease';
      ind.innerHTML='<div class="typing-dots"><span></span><span></span><span></span></div><span id="tisa-typing-name">Partner</span> is writing…';
      ep.prepend(ind);
    }
    function showTyping(name){var ind=document.getElementById('tisa-partner-typing');var nm=document.getElementById('tisa-typing-name');if(ind){ind.style.display='flex';if(nm)nm.textContent=name||'Partner';}clearTimeout(_typingTimer);_typingTimer=setTimeout(hideTyping,4000);}
    function hideTyping(){var ind=document.getElementById('tisa-partner-typing');if(ind)ind.style.display='none';}
    function listenTyping(jid,uid){
      if(_unsub){try{_unsub();}catch(e){}}_unsub=null;
      var fs=window._v6fs;if(!fs||!fs.db||!fs.onSnapshot||!fs.doc)return;
      try{_unsub=fs.onSnapshot(fs.doc(fs.db,'sharedJournals',jid),function(snap){if(!snap.exists())return;var data=snap.data();var typing=data.typing||{};Object.entries(typing).forEach(function(entry){var uid2=entry[0],ts=entry[1];if(uid2===uid)return;var age=Date.now()-(ts&&ts.toDate?ts.toDate().getTime():(ts||0));if(age<4000){var name=(data.memberNames||{})[uid2]||'Partner';showTyping(name.split(' ')[0]);}});}); }catch(e){}
    }
    function broadcastTyping(jid,uid){clearTimeout(_myTimer);_myTimer=setTimeout(function(){var fs=window._v6fs;if(!fs||!fs.db||!fs.updateDoc||!fs.doc)return;try{fs.updateDoc(fs.doc(fs.db,'sharedJournals',jid),{['typing.'+uid]:fs.serverTimestamp?fs.serverTimestamp():new Date()}).catch(function(){});}catch(e){}},300);}
    (function patchNav(){var orig=window.navigate;if(typeof orig!=='function'){setTimeout(patchNav,300);return;}window.navigate=function(view){var r=orig.apply(this,arguments);if(view==='shared'){setTimeout(function(){injectIndicator();var jid=window.profile&&window.profile.sharedJournalId;var uid=window.currentUser&&window.currentUser.uid;if(jid&&uid)listenTyping(jid,uid);},200);}else{if(_unsub){try{_unsub();}catch(e){}}_unsub=null;hideTyping();}return r;};})();
    onReady(function(){var ta=document.getElementById('ep-content');if(ta)ta.addEventListener('input',function(){if(window.currentView!=='shared')return;var jid=window.profile&&window.profile.sharedJournalId;var uid=window.currentUser&&window.currentUser.uid;if(jid&&uid)broadcastTyping(jid,uid);});});
  })();

  console.log('[TISA Plugins v3.0 additions] loaded ✓');

})();
