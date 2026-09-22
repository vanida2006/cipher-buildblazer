(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const GLYPHS = 'アイウエオカキクケコサシスセソ0123456789ABCDEFΣΩΨ{}[]<>/\\=+*#$%&';
  const rnd = (n) => Math.floor(Math.random() * n);
  const mouse = { x: -999, y: -999 };

  /* ---------------- helper: create element safely ---------------- */
  function h(tag, props = {}, ...kids) {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(props)) {
      if (k === 'class') el.className = v;
      else if (k === 'text') el.textContent = v;
      else if (v != null && v !== false) el.setAttribute(k, v);
    }
    kids.flat().forEach((c) => c != null && el.append(c));
    return el;
  }
  const fmtDate = (iso) =>
    new Date(iso + 'T00:00:00').toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();

  /* ---------------- cursor ---------------- */
  const cursor = $('#cursor');
  addEventListener('pointermove', (e) => {
    mouse.x = e.clientX; mouse.y = e.clientY;
    cursor.style.left = e.clientX + 'px';
    cursor.style.top = e.clientY + 'px';
    cursor.classList.toggle('hover', !!e.target.closest('a,button,.card,.leader,input,select,textarea'));
  }, { passive: true });

  /* ---------------- matrix rain (shared by intro) ---------------- */
  function startRain(canvas, { size = 16, fade = 0.08 } = {}) {
    const ctx = canvas.getContext('2d');
    let cols, drops, raf, w, h_;
    const resize = () => {
      w = canvas.width = innerWidth; h_ = canvas.height = innerHeight;
      cols = Math.ceil(w / size); drops = Array.from({ length: cols }, () => rnd(-40) );
    };
    resize(); addEventListener('resize', resize);
    const tick = () => {
      ctx.fillStyle = `rgba(0,0,0,${fade})`; ctx.fillRect(0, 0, w, h_);
      ctx.font = `${size}px JetBrains Mono, monospace`;
      drops.forEach((y, i) => {
        ctx.fillStyle = Math.random() > 0.96 ? '#c8ffd9' : '#00ff66';
        ctx.globalAlpha = 0.55;
        ctx.fillText(GLYPHS[rnd(GLYPHS.length)], i * size, y * size);
        ctx.globalAlpha = 1;
        drops[i] = y * size > h_ && Math.random() > 0.975 ? 0 : y + 1;
      });
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => { cancelAnimationFrame(raf); removeEventListener('resize', resize); };
  }

  /* ---------------- intro: decrypt "CIPHER" ---------------- */
  function runIntro() {
    const intro = $('#intro');
    let seen = false;
    try { seen = sessionStorage.getItem('cipher-intro') === '1'; } catch {}
    if (seen || reduceMotion) { intro.remove(); document.body.classList.remove('locked'); return; }

    const stopRain = startRain($('#intro-rain'));
    const word = 'CIPHER';
    const box = $('#intro-word');
    const spans = [...word].map(() => box.appendChild(h('span', { text: GLYPHS[rnd(GLYPHS.length)] })));
    const t0 = performance.now();
    const scramble = setInterval(() => {
      const t = performance.now() - t0;
      spans.forEach((s, i) => {
        s.textContent = t > 900 + i * 450 ? word[i] : GLYPHS[rnd(GLYPHS.length)];
      });
    }, 60);

    let closed = false;
    const close = () => {
      if (closed) return; closed = true;
      clearInterval(scramble);
      intro.classList.add('done');
      document.body.classList.remove('locked');
      try { sessionStorage.setItem('cipher-intro', '1'); } catch {}
      setTimeout(() => { stopRain(); intro.remove(); }, 900);
    };
    $('#intro-skip').addEventListener('click', close);
    setTimeout(close, 900 + word.length * 450 + 1200);
  }

  /* ---------------- background contour waves ---------------- */
  function startWaves() {
    const c = $('#waves'), ctx = c.getContext('2d');
    let w, hgt, t = 0, running = true;
    const resize = () => { w = c.width = innerWidth; hgt = c.height = innerHeight; };
    resize(); addEventListener('resize', resize);
    document.addEventListener('visibilitychange', () => { running = !document.hidden; if (running) draw(); });
    function draw() {
      if (!running) return;
      ctx.clearRect(0, 0, w, hgt);
      ctx.lineWidth = 1;
      const lines = 46, step = hgt / lines;
      for (let i = 0; i < lines; i++) {
        const base = i * step;
        ctx.beginPath();
        for (let x = 0; x <= w; x += 14) {
          const dx = x - mouse.x, dy = base - mouse.y;
          const pull = Math.exp(-(dx * dx + dy * dy) / 42000) * 22;
          const y = base
            + Math.sin(x * 0.006 + t + i * 0.22) * 14
            + Math.sin(x * 0.013 - t * 0.7 + i * 0.4) * 6
            - pull;
          x ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
        }
        ctx.strokeStyle = `rgba(0,255,102,${0.10 + 0.08 * Math.sin(i * 0.5 + t)})`;
        ctx.stroke();
      }
      t += reduceMotion ? 0 : 0.008;
      requestAnimationFrame(draw);
    }
    draw();
  }

  /* ---------------- hero: dot-matrix "CIPHER" ---------------- */
  function startHeroDots() {
    const c = $('#hero-dots'), ctx = c.getContext('2d');
    let pts = [], W, H, running = true;
    const gap = () => (innerWidth < 700 ? 6 : 9);

    function build() {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      W = c.clientWidth; H = c.clientHeight;
      c.width = W * dpr; c.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const off = document.createElement('canvas'); off.width = W; off.height = H;
      const o = off.getContext('2d');
      let fs = H * 0.9;
      o.font = `700 ${fs}px Lexend, sans-serif`;
      const mw = o.measureText('CIPHER').width;
      if (mw > W * 0.96) fs *= (W * 0.96) / mw;
      o.font = `700 ${fs}px Lexend, sans-serif`;
      o.textAlign = 'center'; o.textBaseline = 'middle'; o.fillStyle = '#fff';
      o.fillText('CIPHER', W / 2, H / 2);
      const data = o.getImageData(0, 0, W, H).data, g = gap();
      pts = [];
      for (let y = 0; y < H; y += g)
        for (let x = 0; x < W; x += g)
          if (data[(y * W + x) * 4 + 3] > 128)
            pts.push({ hx: x, hy: y, x: x + (Math.random() - .5) * 60, y: y + (Math.random() - .5) * 60,
              vx: 0, vy: 0, ch: Math.random() < 0.12 ? GLYPHS[rnd(GLYPHS.length)] : null, tw: Math.random() * 6.28 });
    }

    function frame(now) {
      if (!running) return;
      ctx.clearRect(0, 0, W, H);
      const r = c.getBoundingClientRect(), mx = mouse.x - r.left, my = mouse.y - r.top;
      ctx.font = `${gap() + 2}px JetBrains Mono, monospace`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      for (const p of pts) {
        const dx = p.x - mx, dy = p.y - my, d2 = dx * dx + dy * dy;
        if (d2 < 9000) { const f = (1 - d2 / 9000) * 6, d = Math.sqrt(d2) || 1; p.vx += dx / d * f; p.vy += dy / d * f; }
        p.vx += (p.hx - p.x) * 0.06; p.vy += (p.hy - p.y) * 0.06;
        p.vx *= 0.82; p.vy *= 0.82; p.x += p.vx; p.y += p.vy;
        const a = 0.35 + 0.65 * Math.abs(Math.sin(now / 900 + p.tw));
        if (Math.random() < 0.002) p.ch = Math.random() < 0.3 ? GLYPHS[rnd(GLYPHS.length)] : null;
        ctx.fillStyle = `rgba(0,255,102,${a})`;
        if (p.ch) ctx.fillText(p.ch, p.x, p.y); else ctx.fillRect(p.x - 1.5, p.y - 1.5, 3, 3);
      }
      requestAnimationFrame(frame);
    }
    document.fonts.ready.then(() => { build(); requestAnimationFrame(frame); });
    let rt; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(build, 200); });
    new IntersectionObserver(([e]) => { const was = running; running = e.isIntersecting; if (running && !was) requestAnimationFrame(frame); }).observe(c);
  }

  /* ---------------- API ---------------- */
  const api = async (path, opts) => {
    const res = await fetch('/api' + path, { headers: { 'Content-Type': 'application/json' }, ...opts });
    const data = res.status === 204 ? null : await res.json().catch(() => ({}));
    if (!res.ok) throw Object.assign(new Error(data?.error || 'Request failed'), { data });
    return data;
  };

  /* ---------------- leadership ---------------- */
  async function loadLeaders() {
    const box = $('#leaders');
    try {
      const list = await api('/leadership');
      box.replaceChildren(...list.map((m) => {
        const initials = m.name.split(' ').map((p) => p[0]).slice(0, 2).join('');
        const photo = h('div', { class: 'leader__photo' },
          m.image ? h('img', { src: m.image, alt: m.name, loading: 'lazy' }) : h('span', { class: 'leader__initials', text: initials }));
        const links = h('div', { class: 'leader__links' },
          m.github && h('a', { href: m.github, 'aria-label': `${m.name} on GitHub`, rel: 'noopener', text: 'GH' }),
          m.linkedin && h('a', { href: m.linkedin, 'aria-label': `${m.name} on LinkedIn`, rel: 'noopener', text: 'in' }));
        return h('article', { class: 'leader' }, photo,
          h('p', { class: 'leader__role', text: m.role }), h('h3', { class: 'leader__name', text: m.name }), links);
      }));
    } catch { box.replaceChildren(h('p', { class: 'err-msg', text: 'Could not load leadership. Refresh to try again.' })); }
  }

  /* ---------------- events + modal ---------------- */
  const modal = $('#event-modal');
  let gal = [], gi = 0;
  const showSlide = () => {
    const f = $('#em-frame');
    if (!gal.length) { f.className = 'gallery__frame empty'; f.style.backgroundImage = ''; f.textContent = 'Photos coming soon'; $('#em-count').textContent = '00 / 00'; return; }
    const s = gal[gi];
    f.className = 'gallery__frame'; f.textContent = s.caption || '';
    f.style.backgroundImage = `url("${encodeURI(s.src)}")`;
    $('#em-count').textContent = `${String(gi + 1).padStart(2, '0')} / ${String(gal.length).padStart(2, '0')}`;
  };
  function openEvent(ev) {
    $('#em-tag').textContent = `cipher // activities`;
    $('#em-title').textContent = ev.title;
    $('#em-meta').textContent = [fmtDate(ev.event_date), ev.venue].filter(Boolean).join(' · ');
    $('#em-body').replaceChildren(...(ev.body.length ? ev.body : [ev.summary]).map((p) => h('p', { text: p })));
    gal = ev.gallery; gi = 0; showSlide(); modal.showModal();
  }
  $('#em-prev').addEventListener('click', () => { if (gal.length) { gi = (gi - 1 + gal.length) % gal.length; showSlide(); } });
  $('#em-next').addEventListener('click', () => { if (gal.length) { gi = (gi + 1) % gal.length; showSlide(); } });

  modal.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') $('#em-prev').click();
    if (e.key === 'ArrowRight') $('#em-next').click();
  });
  let touchX = null;
  const frame = $('#em-frame');
  frame.addEventListener('touchstart', (e) => { touchX = e.touches[0].clientX; }, { passive: true });
  frame.addEventListener('touchend', (e) => {
    if (touchX == null) return;
    const dx = e.changedTouches[0].clientX - touchX; touchX = null;
    if (Math.abs(dx) > 40) $(dx < 0 ? '#em-next' : '#em-prev').click();
  });

  let allEvents = [], activeCat = 'All';
  function renderEvents() {
    const box = $('#event-cards');
    const list = allEvents.filter((e) => activeCat === 'All' || e.category === activeCat);
    box.replaceChildren(...list.map((ev) => {
      const cover = ev.gallery[0]?.src;
      const card = h('button', { class: 'card', type: 'button' },
        cover && Object.assign(h('span', { class: 'card__img', role: 'img', 'aria-label': ev.title }), {}),
        h('div', { class: 'card__top' }, h('span', { text: ev.category }), h('span', { class: 'card__date', text: fmtDate(ev.event_date) })),
        h('h3', { text: ev.title }), h('p', { text: ev.summary }), h('span', { class: 'card__more', text: 'VIEW DETAILS ↗' }));
      if (cover) card.querySelector('.card__img').style.backgroundImage = `url("${encodeURI(cover)}")`;
      card.addEventListener('click', () => openEvent(ev));
      return card;
    }));
    const cats = ['All', ...new Set(allEvents.map((e) => e.category))];
    $('#event-chips').replaceChildren(...(cats.length > 2 ? cats.map((c) => {
      const b = h('button', { class: 'chip', type: 'button', 'aria-pressed': String(c === activeCat), text: c });
      b.addEventListener('click', () => { activeCat = c; renderEvents(); });
      return b;
    }) : []));
  }

  async function loadEvents() {
    try {
      allEvents = await api('/events');
      renderEvents();
    } catch { $('#event-cards').replaceChildren(h('p', { class: 'err-msg', text: 'Could not load events. Refresh to try again.' })); }
  }

  async function loadArchive() {
    const ol = $('#archive'), empty = $('#archive-empty'), input = $('#archive-search');
    try {
      const list = await api('/activities');
      const draw = () => {
        const q = input.value.trim().toLowerCase();
        const shown = list.filter((a) => a.title.toLowerCase().includes(q));
        ol.replaceChildren(...shown.map((a) => h('li', {}, a.url ? h('a', { href: a.url, rel: 'noopener', text: a.title }) : a.title)));
        empty.hidden = shown.length > 0;
      };
      input.addEventListener('input', draw); draw();
    } catch { ol.replaceChildren(h('li', { text: 'Could not load activities.' })); }
  }

  /* ---------------- join form ---------------- */
  const joinModal = $('#join-modal'), form = $('#join-form'), status = $('#join-status');
  $$('[data-open-join]').forEach((b) => b.addEventListener('click', () => { status.textContent = ''; joinModal.showModal(); }));
  $$('dialog [data-close]').forEach((b) => b.addEventListener('click', () => b.closest('dialog').close()));
  $$('dialog').forEach((d) => d.addEventListener('click', (e) => { if (e.target === d) d.close(); }));

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = $('#join-submit');
    status.className = 'form-status';
    if (!form.checkValidity()) { status.classList.add('err'); status.textContent = 'Enter your name and a valid email.'; return; }
    const body = Object.fromEntries(new FormData(form));
    if (!body.year) delete body.year;
    if (!body.interest) delete body.interest;
    btn.disabled = true; status.textContent = 'Sending…';
    try {
      const r = await api('/join', { method: 'POST', body: JSON.stringify(body) });
      status.classList.add('ok'); status.textContent = r.message || 'Application received.';
      form.reset(); setTimeout(() => joinModal.close(), 1800);
    } catch (err) {
      status.classList.add('err');
      status.textContent = err.data?.details?.map((d) => `${d.field}: ${d.message}`).join(' · ') || err.message;
    } finally { btn.disabled = false; }
  });

  /* ---------------- mobile menu ---------------- */
  const toggle = $('#nav-toggle'), navLinks = $('#nav-links');
  const setMenu = (open) => { toggle.setAttribute('aria-expanded', String(open)); navLinks.classList.toggle('open', open); };
  toggle.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true'));
  navLinks.addEventListener('click', (e) => e.target.closest('a') && setMenu(false));
  addEventListener('keydown', (e) => e.key === 'Escape' && setMenu(false));

  /* ---------------- nav highlight ---------------- */
  const links = $$('.nav__links a');
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => en.isIntersecting &&
      links.forEach((a) => a.classList.toggle('active', a.getAttribute('href') === '#' + en.target.id)));
  }, { rootMargin: '-45% 0px -50% 0px' });
  ['home', 'about', 'leadership', 'events', 'join'].forEach((id) => io.observe($('#' + id)));

  /* ---------------- boot ---------------- */
  runIntro(); startWaves(); startHeroDots();
  loadLeaders(); loadEvents(); loadArchive();
})();
