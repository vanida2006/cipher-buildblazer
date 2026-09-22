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
    cursor.classList.toggle('hover', !!e.target.closest('a,button,.card,.leader,input,select,textarea,#about-collage'));
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

    let touchX = -9999, touchY = -9999, touchActive = false;
    c.addEventListener('touchstart', (e) => {
      if (!e.touches.length) return;
      const t = e.touches[0], r = c.getBoundingClientRect();
      touchX = t.clientX - r.left; touchY = t.clientY - r.top;
      touchActive = true;
    }, { passive: true });
    c.addEventListener('touchmove', (e) => {
      if (!e.touches.length) return;
      const t = e.touches[0], r = c.getBoundingClientRect();
      touchX = t.clientX - r.left; touchY = t.clientY - r.top;
      touchActive = true;
    }, { passive: true });
    c.addEventListener('touchend', () => { touchActive = false; }, { passive: true });

    function frame(now) {
      if (!running) return;
      ctx.clearRect(0, 0, W, H);
      const r = c.getBoundingClientRect();
      const mx = touchActive ? touchX : (mouse.x - r.left);
      const my = touchActive ? touchY : (mouse.y - r.top);

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
  const DEFAULT_LEADERS = [
    { name: 'Elston Herold Pereira', role: 'President', image: '/img/team/elston-pereira.jpg' },
    { name: 'Raynell Lewis', role: 'Vice President', image: '/img/team/raynell-lewis.jpg' },
    { name: 'Chaitra RM', role: 'Secretary', image: '/img/team/chaitra-rm.jpg' },
    { name: 'Nazmin Ziya', role: 'Treasurer', image: '/img/team/nazmin-ziya.jpg' },
    { name: 'Jeslin Ninora', role: 'Joint Treasurer', image: '/img/team/jeslin-ninora.jpg' },
    { name: 'Ruben Saldana', role: 'Operations Head', image: '/img/team/ruben-saldana.jpg' },
    { name: 'Himansh Ullal', role: 'Design Head', image: '/img/team/himansh-ullal.jpg' },
    { name: 'Shamitha KV', role: 'Cultural Head', image: '/img/team/shamitha-kv.jpg' },
    { name: 'Parthipan J', role: 'Content Head', image: '/img/team/parthipan-j.jpg' },
  ];

  /* ---------------- leader modal & matrix effect ---------------- */
  const leaderModal = $('#leader-modal');
  let matrixAnimId = null;

  function runLeaderMatrix(canvas) {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = (canvas.width = canvas.offsetWidth || 340);
    const h = (canvas.height = canvas.offsetHeight || 380);
    const cols = Math.floor(w / 14);
    const ypos = Array(cols).fill(0);
    if (matrixAnimId) cancelAnimationFrame(matrixAnimId);

    function step() {
      ctx.fillStyle = 'rgba(1, 8, 4, 0.15)';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#00ff66';
      ctx.font = '11px JetBrains Mono, monospace';

      for (let i = 0; i < cols; i++) {
        // Concentrate stream on the left half of the card, matching reference image!
        if (i > cols * 0.45) continue;
        const ch = GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
        const x = i * 14;
        const y = ypos[i] * 14;
        ctx.fillText(ch, x, y);
        if (y > 100 + Math.random() * 8000) ypos[i] = 0;
        else ypos[i]++;
      }
      matrixAnimId = requestAnimationFrame(step);
    }
    matrixAnimId = requestAnimationFrame(step);
  }

  function openLeaderModal(m) {
    if (!leaderModal) return;
    $('#lm-name').textContent = m.name;
    $('#lm-role').textContent = m.role;
    const photo = $('#lm-photo');
    const initials = $('#lm-initials');
    if (m.image) {
      photo.src = m.image;
      photo.style.display = 'block';
      if (initials) initials.style.display = 'none';
    } else {
      photo.style.display = 'none';
      if (initials) {
        initials.textContent = m.name.split(' ').map((p) => p[0]).slice(0, 2).join('');
        initials.style.display = 'grid';
      }
    }

    const linksBox = $('#lm-links');
    if (linksBox) {
      linksBox.replaceChildren();
      if (m.github) {
        linksBox.appendChild(h('a', { href: m.github, 'aria-label': `${m.name} on GitHub`, target: '_blank', rel: 'noopener', text: '⌥' }));
      }
      if (m.linkedin) {
        linksBox.appendChild(h('a', { href: m.linkedin, 'aria-label': `${m.name} on LinkedIn`, target: '_blank', rel: 'noopener', text: 'in' }));
      }
    }

    document.body.classList.add('modal-open');
    leaderModal.showModal();
    setTimeout(() => runLeaderMatrix($('#lm-matrix')), 60);
  }

  if (leaderModal) {
    leaderModal.addEventListener('close', () => {
      if (matrixAnimId) cancelAnimationFrame(matrixAnimId);
      document.body.classList.remove('modal-open');
    });
  }

  async function loadLeaders() {
    const box = $('#leaders');
    let list = DEFAULT_LEADERS;
    try {
      const fetched = await api('/leadership');
      if (Array.isArray(fetched) && fetched.length) list = fetched;
    } catch { /* use default */ }

    // Build original cards
    const makeCard = (m, idx) => {
      const initials = m.name.split(' ').map((p) => p[0]).slice(0, 2).join('');
      const photo = h('div', { class: 'leader__photo' },
        m.image ? h('img', { src: m.image, alt: m.name, loading: 'lazy' }) : h('span', { class: 'leader__initials', text: initials }));
      const links = h('div', { class: 'leader__links' },
        m.github && h('a', { href: m.github, 'aria-label': `${m.name} on GitHub`, rel: 'noopener', target: '_blank', text: 'GH' }),
        m.linkedin && h('a', { href: m.linkedin, 'aria-label': `${m.name} on LinkedIn`, rel: 'noopener', target: '_blank', text: 'in' }));
      const el = h('article', {
        class: 'leader', tabindex: '0', role: 'button',
        'aria-label': `View ${m.name}`, 'data-leader-idx': String(idx)
      }, photo,
        h('p', { class: 'leader__role', text: m.role }),
        h('h3', { class: 'leader__name', text: m.name }),
        links);
      return el;
    };

    box.replaceChildren(...list.map(makeCard));

    // Duplicate for seamless looping
    const origItems = Array.from(box.children);
    origItems.forEach(n => box.appendChild(n.cloneNode(true)));

    // Event delegation: works on both original AND cloned cards
    box.addEventListener('click', (e) => {
      if (e.target.closest('a')) return;
      const card = e.target.closest('[data-leader-idx]');
      if (!card) return;
      const idx = parseInt(card.dataset.leaderIdx, 10);
      if (!isNaN(idx) && list[idx]) openLeaderModal(list[idx]);
    });
    box.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      const card = e.target.closest('[data-leader-idx]');
      if (!card) return;
      e.preventDefault();
      const idx = parseInt(card.dataset.leaderIdx, 10);
      if (!isNaN(idx) && list[idx]) openLeaderModal(list[idx]);
    });

    // Pause auto-scroll on hover/touch, resume after
    let isHovering = false;
    const SPEED = 0.5;

    function scrollCarousel() {
      if (!isHovering && !document.body.classList.contains('modal-open')) {
        box.scrollLeft += SPEED;
        const halfWidth = box.scrollWidth / 2;
        if (box.scrollLeft >= halfWidth) box.scrollLeft -= halfWidth;
      }
      requestAnimationFrame(scrollCarousel);
    }

    box.addEventListener('mouseenter', () => { isHovering = true; });
    box.addEventListener('mouseleave', () => { isHovering = false; });
    box.addEventListener('touchstart', () => { isHovering = true; }, { passive: true });
    box.addEventListener('touchend', () => { setTimeout(() => { isHovering = false; }, 1500); }, { passive: true });

    requestAnimationFrame(scrollCarousel);
  }

  /* ---------------- events + modal ---------------- */
  const DEFAULT_EVENTS = [
    {
      slug: 'lumiere-the-gala',
      title: 'Lumière — The Gala',
      category: 'Branch Gala',
      event_date: '2025-10-29',
      venue: 'Kalam Auditorium',
      summary: 'The CSE branch entry programme at Kalam Auditorium, themed "Where Glam Meets Glow." Organised by the Cipher Association with coordinated red, gold and black decor, it welcomed students into the department and reinforced a shared sense of collective identity.',
      body: [
        'The Department of Computer Science and Engineering (CSE) held its branch entry programme, “Lumière – The Gala,”  29 October 2025 at the Kalam Auditorium. Organised by the Cipher Association, the event welcomed students into the department through a formal gathering centred on the theme “Where Glam Meets Glow.” The venue featured coordinated red, gold and black décor, floral arrangements, illuminated panels and a central Lumière backdrop.',
        'The programme provided students with an opportunity to interact with peers and take part in a shared departmental event beyond academics. It also highlighted the role of the Cipher Association in organising student-led activities and encouraging participation within the CSE community.',
        'The event concluded as a formal branch entry that marked the students’ transition into the department and reinforced a sense of collective identity.'
      ],
      gallery: [
       
        { src: 'img/events/lumiere-the-gala/02.jpg', caption: 'Lumière — The Gala' },
        { src: 'img/events/lumiere-the-gala/03.jpg', caption: 'Lumière — The Gala' },
        { src: 'img/events/lumiere-the-gala/04.jpg', caption: 'Lumière — The Gala' },
        { src: 'img/events/lumiere-the-gala/05.jpg', caption: 'Lumière — The Gala' },
        { src: 'img/events/lumiere-the-gala/01.jpg', caption: 'Lumière — The Gala' },
      ]
    },
    {
      slug: 'prompt-ops-2k26',
      title: 'PROMPT OPS-2K26',
      category: 'Competition',
      event_date: '2026-03-25',
      venue: 'Dept. of CSE, SJEC',
      summary: 'A technical competition on prompt engineering and AI tools by the AgentBlazer Club and Cipher. Track 1 (1st Year) covered invitation, logo and image recreation; Track 2 (2nd Year) tested JSON conversion, Python debugging and a Gemini AI security prompt challenge.',
      body: [
        'Organized by the AgentBlazer Club and Cipher under the guidance of Ms. Nisha J Roche, Ms. Jaishma K, and HOD Dr. Melwyn D’Souza, this technical competition focused on prompt engineering and AI tools (mapped to PO4, PO5, PO8, PO11).',
        'Track 1 (1st Year) featured invitation generation, logo recreation, and image recreation rounds, with Chinmayee, Chris Royston Monteiro, and Deeksha Ravi Moger taking top honors.',
        'Track 2 (2nd Year) tested students in JSON conversion, Python code debugging, and a Gemini AI security prompt extraction challenge, with Harimurali KS, Venus Suhani D’Lima, and Venisha Snehal D’Souza securing top positions.'
      ],
      gallery: [
        { src: 'img/events/prompt-ops-2k26/01.jpg', caption: 'PROMPT OPS-2K26 — Organizers & Faculty' },
        { src: 'img/events/prompt-ops-2k26/02.jpg', caption: 'PROMPT OPS-2K26 — Competition Lab' },
        { src: 'img/events/prompt-ops-2k26/03.jpg', caption: 'PROMPT OPS-2K26 — Student Teams at Work' },
        { src: 'img/events/prompt-ops-2k26/04.jpg', caption: 'PROMPT OPS-2K26 — Prompt Engineering Challenge' },
        { src: 'img/events/prompt-ops-2k26/05.jpg', caption: 'PROMPT OPS-2K26 — Participants Collaboration' }
      ]
    }
  ];

  const modal = $('#event-modal');
  let gal = [], gi = 0;

  const showSlide = (dir = 'none') => {
    const f = $('#em-frame');
    const img = $('#em-slide-img');
    const count = $('#em-count');
    const hudCount = $('#em-hud-count');
    const dots = $('#em-dots');
    if (!gal.length) {
      if (f) f.className = 'gallery__frame empty';
      if (img) img.style.display = 'none';
      if (f) f.textContent = 'Photos coming soon';
      if (count) count.textContent = '00 / 00';
      if (hudCount) hudCount.textContent = '00 / 00';
      if (dots) dots.replaceChildren();
      return;
    }
    if (f) f.className = 'gallery__frame';
    const s = gal[gi];
    if (img) {
      img.style.display = 'block';
      img.src = s.src;
      img.alt = s.caption || 'Event photo';
      img.classList.remove('slide-from-right', 'slide-from-left');
      void img.offsetWidth;
      if (dir === 'next') {
        img.classList.add('slide-from-right');
      } else if (dir === 'prev') {
        img.classList.add('slide-from-left');
      }
    }
    const countTxt = `${String(gi + 1).padStart(2, '0')} / ${String(gal.length).padStart(2, '0')}`;
    if (count) count.textContent = countTxt;
    if (hudCount) hudCount.textContent = countTxt;
    if (dots) {
      dots.querySelectorAll('.gallery__dot').forEach((d, idx) => {
        d.classList.toggle('active', idx === gi);
      });
    }
  };

  function openEvent(ev) {
    $('#em-tag').textContent = 'CIPHER // ACTIVITIES';
    $('#em-title').textContent = ev.title;
    $('#em-meta').textContent = [fmtDate(ev.event_date), ev.venue].filter(Boolean).join(' · ');
    $('#em-body').replaceChildren(...(ev.body && ev.body.length ? ev.body : [ev.summary]).map((p) => h('p', { text: p })));

    const cardDate = $('#em-card-date');
    const cardTitle = $('#em-card-title');
    const cardSub = $('#em-card-sub');
    const hudTag = $('#em-hud-tag');
    const dots = $('#em-dots');

    if (cardDate) cardDate.textContent = fmtDate(ev.event_date);
    if (cardTitle) cardTitle.textContent = ev.title;
    if (cardSub) {
      cardSub.textContent = ev.slug === 'lumiere-the-gala'
        ? 'CSE Branch Entry · Kalam Auditorium'
        : 'AgentBlazer Club × Cipher';
    }
    if (hudTag) {
      hudTag.textContent = ev.slug === 'lumiere-the-gala' ? 'LUMIERE_GALA' : 'PROMPT_OPS';
    }

    gal = (ev.gallery && ev.gallery.length) ? ev.gallery : [];
    if (ev.slug === 'prompt-ops-2k26' && gal.length > 5) {
      gal = gal.slice(0, 5);
    }
    gi = 0;

    if (dots) {
      dots.replaceChildren(...gal.map((_, idx) => {
        const dot = h('span', { class: `gallery__dot${idx === 0 ? ' active' : ''}` });
        dot.addEventListener('click', (e) => {
          e.stopPropagation();
          const oldGi = gi;
          gi = idx;
          showSlide(gi > oldGi ? 'next' : 'prev');
        });
        return dot;
      }));
    }

    showSlide('none');
    document.body.classList.add('modal-open');
    modal.showModal();
  }

  // Click on the photo card itself → advance to next slide
  const emCard = $('#em-card');
  if (emCard) {
    emCard.addEventListener('click', (e) => {
      if (e.target.closest('button, .gallery__dot, .gallery__nav-btn, .gallery__bottom-overlay')) return;
      if (gal.length) { gi = (gi + 1) % gal.length; showSlide('next'); }
    });
  }

  $('#em-prev').addEventListener('click', (e) => {
    e.stopPropagation();
    if (gal.length) { gi = (gi - 1 + gal.length) % gal.length; showSlide('prev'); }
  });
  $('#em-next').addEventListener('click', (e) => {
    e.stopPropagation();
    if (gal.length) { gi = (gi + 1) % gal.length; showSlide('next'); }
  });

  modal.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') { if (gal.length) { gi = (gi - 1 + gal.length) % gal.length; showSlide('prev'); } }
    if (e.key === 'ArrowRight') { if (gal.length) { gi = (gi + 1) % gal.length; showSlide('next'); } }
  });
  modal.addEventListener('close', () => {
    document.body.classList.remove('modal-open');
  });

  // Touch swipe on the card (covers the whole photo)
  let touchStartX = 0, touchStartY = 0;
  const swipeTarget = $('#em-card') || $('#em-frame');
  if (swipeTarget) {
    swipeTarget.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
      touchStartY = e.changedTouches[0].screenY;
    }, { passive: true });
    swipeTarget.addEventListener('touchend', (e) => {
      const dx = e.changedTouches[0].screenX - touchStartX;
      const dy = e.changedTouches[0].screenY - touchStartY;
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 35) {
        if (dx < 0) {
          if (gal.length) { gi = (gi + 1) % gal.length; showSlide('next'); }
        } else {
          if (gal.length) { gi = (gi - 1 + gal.length) % gal.length; showSlide('prev'); }
        }
      }
    }, { passive: true });
  }

  let allEvents = [];
  function renderEvents() {
    const box = $('#event-cards');
    if (!box) return;
    const eventsToRender = (allEvents && allEvents.length ? allEvents : DEFAULT_EVENTS).slice(0, 2);
    box.replaceChildren(...eventsToRender.map((ev) => {
      const card = h('button', { class: 'card', type: 'button' },
        h('div', { class: 'card__top' },
          h('span', { class: 'card__cat', text: `◫ ${ev.category}` }),
          h('span', { class: 'card__date', text: fmtDate(ev.event_date) })
        ),
        h('h3', { text: ev.title }),
        h('p', { text: ev.summary })
      );
      card.addEventListener('click', () => openEvent(ev));
      return card;
    }));
  }

  async function loadEvents() {
    try {
      const list = await api('/events');
      if (Array.isArray(list) && list.length) {
        allEvents = list;
      } else {
        allEvents = DEFAULT_EVENTS;
      }
    } catch {
      allEvents = DEFAULT_EVENTS;
    }
    renderEvents();
  }

  const DEFAULT_ACTIVITIES = [
    'Applied Machine Learning', 'Industrial Visit', 'LaTeX Tool', 'Robotic Process Automation using UiPath',
    'HackTO Future 20', 'How to Win at the Sport of Programming', 'Introduction to Google Crowdsource',
    'Educational Session on GitHub', 'Industrial Visit', 'UDAAN Mock Interview', 'Freshers Onboarding Programme',
    'Projects Funded by KSCST', 'Generative AI Tools for Research', 'Introduction to Blockchain: Solidity Workshop',
    'Star UML', 'Generative AI: Custom Solutions using OpenAI', 'React.js and Node.js Workshop',
    'Master the Future: Hands-on GSoC & LLMs Workshop', 'Demystifying Generative Models', 'Cyber Security and Career Pathways',
    'Agentforce Workshop', 'AgentBlazer Club Inauguration', 'Agentforce Technical Session'
  ].map((title) => ({ title }));

  async function loadArchive() {
    const ol = $('#archive'), empty = $('#archive-empty'), input = $('#archive-search');
    let list = DEFAULT_ACTIVITIES;
    try {
      const fetched = await api('/activities');
      if (Array.isArray(fetched) && fetched.length) list = fetched;
    } catch { /* use default */ }
    const draw = () => {
      const q = input.value.trim().toLowerCase();
      const shown = list.filter((a) => a.title.toLowerCase().includes(q));
      ol.replaceChildren(...shown.map((a) => h('li', {}, a.url ? h('a', { href: a.url, rel: 'noopener', text: a.title }) : a.title)));
      empty.hidden = shown.length > 0;
    };
    input.addEventListener('input', draw);
    draw();
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

  /* ---------------- about collage hover reveal ---------------- */
  function initAboutCollage() {
    const collage = $('#about-collage');
    const canvas  = $('#about-canvas');
    const word    = $('#about-word');
    if (!collage || !canvas) return;

    const IMAGES = [
      'img/about/about-1.jpg', 'img/about/about-2.jpg', 'img/about/about-3.jpg',
      'img/about/about-4.jpg', 'img/about/about-5.jpg', 'img/about/about-6.jpg',
      'img/about/about-7.jpg', 'img/about/about-8.jpg', 'img/about/about-9.jpg',
    ];

    // Preload so first spawn is instant
    IMAGES.forEach((src) => { const i = new Image(); i.src = src; });

    // Shuffle deck – never shows same image twice in a row
    let deck = [];
    const nextSrc = () => {
      if (!deck.length) deck = [...IMAGES].sort(() => Math.random() - 0.5);
      return deck.pop();
    };

    // Z-index stays below the CIPHER word (word is z-index:20)
    let zCounter = 1;
    let spawnId   = null;
    let hovering  = false;

    // 6 slots that cover the full collage including area behind CIPHER text
    const SLOTS = [
      { top:  2, left:  1, w: 44 },   // top-left
      { top:  2, left: 48, w: 49 },   // top-right
      { top: 28, left:  2, w: 38 },   // mid-left
      { top: 30, left: 52, w: 44 },   // mid-right
      { top: 55, left:  2, w: 42 },   // bottom-left
      { top: 55, left: 46, w: 48 },   // bottom-right
    ];
    let slotIdx = 0;

    function spawnOne() {
      if (!hovering) return;

      // Cap live (non-fading) pics at 5
      const live = canvas.querySelectorAll('.ap:not(.ap-out)');
      if (live.length >= 5) fadePic(live[0]);

      // Pick a slot, add slight randomness so it never looks rigid
      const slot = SLOTS[slotIdx % SLOTS.length];
      slotIdx++;

      const top  = slot.top  + (Math.random() * 6 - 3);
      const left = slot.left + (Math.random() * 5 - 2.5);
      const rot  = (Math.random() * 14 - 7).toFixed(1); // −7° … +7°
      const w    = slot.w + (Math.random() * 4 - 2);

      const pic = h('div', { class: 'ap' },
        h('img', { src: nextSrc(), alt: 'CIPHER event' })
      );
      pic.style.cssText =
        `top:${top}%;left:${left}%;width:${w}%;--r:${rot}deg;z-index:${++zCounter};`;
      canvas.appendChild(pic);

      // Force reflow then reveal
      pic.getBoundingClientRect();
      pic.classList.add('ap-in');

      // Auto-fade each card after 2.4–3.6 s
      const life = 2400 + Math.random() * 1200;
      setTimeout(() => fadePic(pic), life);
    }

    function fadePic(pic) {
      if (!pic || !pic.isConnected || pic.classList.contains('ap-out')) return;
      pic.classList.remove('ap-in');
      pic.classList.add('ap-out');
      setTimeout(() => pic.remove(), 950);
    }

    function clearAll() {
      canvas.querySelectorAll('.ap').forEach(fadePic);
    }

    // Pulse the CIPHER word while collage is active
    function startWordPulse() {
      if (word) word.classList.add('word-pulse');
    }
    function stopWordPulse() {
      if (word) word.classList.remove('word-pulse');
    }

    function startSpawning() {
      hovering = true;
      startWordPulse();
      // Burst 3 pictures immediately at spread positions
      spawnOne();
      setTimeout(() => hovering && spawnOne(), 140);
      setTimeout(() => hovering && spawnOne(), 320);
      // Keep spawning every 850 ms
      clearInterval(spawnId);
      spawnId = setInterval(() => { if (hovering) spawnOne(); }, 850);
    }

    function stopSpawning() {
      hovering = false;
      stopWordPulse();
      clearInterval(spawnId);
      clearAll();
    }

    // Desktop
    collage.addEventListener('mouseenter', startSpawning);
    collage.addEventListener('mouseleave', stopSpawning);

    // Mobile: tap to toggle 4-second burst
    collage.addEventListener('click', () => {
      if (hovering) stopSpawning();
      else { startSpawning(); setTimeout(stopSpawning, 4000); }
    });
  }

  /* ---------------- scroll-triggered heading effects ---------------- */
  function initHeadingScrollEffects() {
    const headings = $$('.section h2, .hero__title');
    const tags = $$('.section .tag');

    headings.forEach((h) => h.classList.add('scroll-heading'));
    tags.forEach((t) => t.classList.add('scroll-tag'));

    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
          } else if (entry.boundingClientRect.top > 0) {
            entry.target.classList.remove('in-view');
          }
        });
      }, {
        threshold: 0.08,
        rootMargin: '0px 0px -20px 0px'
      });

      headings.forEach((h) => io.observe(h));
      tags.forEach((t) => io.observe(t));
    } else {
      headings.forEach((h) => h.classList.add('in-view'));
      tags.forEach((t) => t.classList.add('in-view'));
    }
  }

  /* ---------------- boot ---------------- */
  runIntro(); startWaves(); startHeroDots();
  loadLeaders(); loadEvents(); loadArchive();
  initAboutCollage(); initHeadingScrollEffects();
})();

