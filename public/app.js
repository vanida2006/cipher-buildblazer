(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const GLYPHS = 'アイウエオカキクケコサシスセソ0123456789ABCDEFΣΩΨ{}[]<>/\\=+*#$%&';
  const rnd = (n) => Math.floor(Math.random() * n);
  const mouse = { x: -999, y: -999 };

  /* ---------------- safe storage ---------------- */
  const storage = {
    get(k) { try { return window.sessionStorage ? sessionStorage.getItem(k) : null; } catch { return null; } },
    set(k, v) { try { if (window.sessionStorage) sessionStorage.setItem(k, v); } catch {} },
    remove(k) { try { if (window.sessionStorage) sessionStorage.removeItem(k); } catch {} }
  };

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
  if (cursor) {
    let cursorRaf = null;
    addEventListener('pointermove', (e) => {
      mouse.x = e.clientX; mouse.y = e.clientY;
      if (!cursorRaf) {
        cursorRaf = requestAnimationFrame(() => {
          cursor.style.left = mouse.x + 'px';
          cursor.style.top = mouse.y + 'px';
          cursorRaf = null;
        });
      }
      cursor.classList.toggle('hover', !!e.target.closest('a,button,.card,.leader,input,select,textarea'));
    }, { passive: true });
  }

  /* ---------------- matrix rain (shared by intro) ---------------- */
  function startRain(canvas, { size = 16, fade = 0.08 } = {}) {
    if (!canvas) return () => {};
    const ctx = canvas.getContext('2d');
    if (!ctx) return () => {};
    let cols = 0, drops = [], raf = null, w = 0, h_ = 0, active = true;
    const resize = () => {
      w = canvas.width = Math.min(innerWidth || 800, 1920);
      h_ = canvas.height = Math.min(innerHeight || 600, 1080);
      cols = Math.min(Math.ceil(w / size), 80);
      drops = Array.from({ length: cols }, () => rnd(-40));
    };
    resize();
    let rtime;
    const onResize = () => { clearTimeout(rtime); rtime = setTimeout(resize, 100); };
    addEventListener('resize', onResize, { passive: true });

    const tick = () => {
      if (!active) return;
      ctx.fillStyle = `rgba(0,0,0,${fade})`;
      ctx.fillRect(0, 0, w, h_);
      ctx.font = `${size}px JetBrains Mono, monospace`;
      for (let i = 0; i < drops.length; i++) {
        const y = drops[i];
        ctx.fillStyle = Math.random() > 0.96 ? '#c8ffd9' : '#00ff66';
        ctx.globalAlpha = 0.55;
        ctx.fillText(GLYPHS[rnd(GLYPHS.length)], i * size, y * size);
        ctx.globalAlpha = 1;
        drops[i] = y * size > h_ && Math.random() > 0.975 ? 0 : y + 1;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      active = false;
      if (raf) cancelAnimationFrame(raf);
      removeEventListener('resize', onResize);
    };
  }

  /* ---------------- intro: decrypt "CIPHER" ---------------- */
  function runIntro() {
    const intro = $('#intro');
    if (!intro) {
      document.body.classList.remove('locked');
      return;
    }
    const seen = storage.get('cipher-intro') === '1';
    if (seen || reduceMotion) {
      intro.remove();
      document.body.classList.remove('locked');
      return;
    }

    const stopRain = startRain($('#intro-rain'));
    const word = 'CIPHER';
    const box = $('#intro-word');
    const spans = box ? [...word].map(() => box.appendChild(h('span', { text: GLYPHS[rnd(GLYPHS.length)] }))) : [];
    const t0 = performance.now();
    const scramble = setInterval(() => {
      const t = performance.now() - t0;
      spans.forEach((s, i) => {
        s.textContent = t > 900 + i * 450 ? word[i] : GLYPHS[rnd(GLYPHS.length)];
      });
    }, 60);

    let closed = false;
    const close = () => {
      if (closed) return;
      closed = true;
      clearInterval(scramble);
      intro.classList.add('done');
      document.body.classList.remove('locked');
      storage.set('cipher-intro', '1');
      setTimeout(() => {
        stopRain();
        intro.remove();
      }, 500);
    };
    const skip = $('#intro-skip');
    if (skip) skip.addEventListener('click', close);
    setTimeout(close, 3500);
  }

  /* ---------------- background contour waves ---------------- */
  function startWaves() {
    const c = $('#waves');
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    let w = 0, hgt = 0, t = 0, rafId = null, running = true;
    const resize = () => {
      w = c.width = Math.max(innerWidth || 800, 320);
      hgt = c.height = Math.max(innerHeight || 600, 320);
    };
    resize();
    let rtime;
    addEventListener('resize', () => {
      clearTimeout(rtime);
      rtime = setTimeout(resize, 100);
    }, { passive: true });

    document.addEventListener('visibilitychange', () => {
      running = !document.hidden;
      if (running) {
        if (!rafId) rafId = requestAnimationFrame(draw);
      } else {
        if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
      }
    });

    function draw() {
      if (!running) { rafId = null; return; }
      ctx.clearRect(0, 0, w, hgt);
      ctx.lineWidth = 1;
      const lines = 18, step = hgt / lines;
      for (let i = 0; i < lines; i++) {
        const base = i * step;
        ctx.beginPath();
        for (let x = 0; x <= w; x += 24) {
          const dx = x - mouse.x, dy = base - mouse.y;
          const pull = (Math.abs(dx) < 220 && Math.abs(dy) < 220)
            ? Math.exp(-(dx * dx + dy * dy) / 36000) * 20
            : 0;
          const y = base
            + Math.sin(x * 0.005 + t + i * 0.25) * 12
            + Math.sin(x * 0.012 - t * 0.6 + i * 0.4) * 5
            - pull;
          x ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
        }
        ctx.strokeStyle = `rgba(0,255,102,${0.09 + 0.07 * Math.sin(i * 0.5 + t)})`;
        ctx.stroke();
      }
      t += reduceMotion ? 0 : 0.008;
      rafId = requestAnimationFrame(draw);
    }
    rafId = requestAnimationFrame(draw);
  }

  /* ---------------- hero: dot-matrix "CIPHER" ---------------- */
  function startHeroDots() {
    const c = $('#hero-dots');
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    let pts = [], W = 0, H = 0, running = true, rafId = null;
    const gap = () => (innerWidth < 700 ? 8 : 12);

    function build() {
      W = c.clientWidth || 600;
      H = c.clientHeight || 180;
      if (W < 40 || H < 40) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      c.width = W * dpr;
      c.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      try {
        const off = document.createElement('canvas');
        off.width = W;
        off.height = H;
        const o = off.getContext('2d');
        if (!o) return;
        let fs = H * 0.85;
        o.font = `700 ${fs}px Lexend, sans-serif`;
        const mw = o.measureText('CIPHER').width || 1;
        if (mw > W * 0.94) fs *= (W * 0.94) / mw;
        o.font = `700 ${fs}px Lexend, sans-serif`;
        o.textAlign = 'center';
        o.textBaseline = 'middle';
        o.fillStyle = '#fff';
        o.fillText('CIPHER', W / 2, H / 2);

        const data = o.getImageData(0, 0, W, H).data;
        const g = gap();
        pts = [];
        for (let y = 0; y < H; y += g) {
          for (let x = 0; x < W; x += g) {
            const idx = (y * W + x) * 4 + 3;
            if (data[idx] > 128) {
              pts.push({
                hx: x, hy: y,
                x: x + (Math.random() - 0.5) * 40,
                y: y + (Math.random() - 0.5) * 40,
                vx: 0, vy: 0,
                tw: Math.random() * 6.28
              });
            }
          }
        }
        if (pts.length > 500) {
          pts = pts.filter((_, idx) => idx % Math.ceil(pts.length / 500) === 0);
        }
      } catch (err) {
        console.warn('Hero dots build skipped:', err);
      }
    }

    function frame(now) {
      if (!running) { rafId = null; return; }
      ctx.clearRect(0, 0, W, H);
      const r = c.getBoundingClientRect();
      const mx = mouse.x - r.left, my = mouse.y - r.top;
      const dDot = gap() > 8 ? 2.5 : 2;

      for (let i = 0; i < pts.length; i++) {
        const p = pts[i];
        const dx = p.x - mx, dy = p.y - my, d2 = dx * dx + dy * dy;
        if (d2 < 8100) {
          const f = (1 - d2 / 8100) * 5;
          const d = Math.sqrt(d2) || 1;
          p.vx += (dx / d) * f;
          p.vy += (dy / d) * f;
        }
        p.vx += (p.hx - p.x) * 0.07;
        p.vy += (p.hy - p.y) * 0.07;
        p.vx *= 0.82;
        p.vy *= 0.82;
        p.x += p.vx;
        p.y += p.vy;

        const a = 0.35 + 0.65 * Math.abs(Math.sin(now / 900 + p.tw));
        ctx.fillStyle = `rgba(0,255,102,${a})`;
        ctx.fillRect(p.x - dDot / 2, p.y - dDot / 2, dDot, dDot);
      }
      rafId = requestAnimationFrame(frame);
    }

    const startLoop = () => {
      if (!rafId && running) rafId = requestAnimationFrame(frame);
    };

    if (document.fonts?.ready) {
      document.fonts.ready.then(() => { build(); startLoop(); }).catch(() => { build(); startLoop(); });
    } else {
      build(); startLoop();
    }

    let rt;
    addEventListener('resize', () => {
      clearTimeout(rt);
      rt = setTimeout(() => { build(); }, 200);
    }, { passive: true });

    new IntersectionObserver(([e]) => {
      running = e.isIntersecting;
      if (running) {
        startLoop();
      } else if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    }).observe(c);
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

  /* ---------------- admin section & login console ---------------- */
  function initAdminSection() {
    const adminSec = $('#admin');
    if (!adminSec) return;

    const authPanel = $('#admin-auth-panel');
    const sessionPanel = $('#admin-session-panel');
    const form = $('#admin-login-form');
    const userInp = $('#term-user');
    const passInp = $('#term-pass');
    const togglePw = $('#term-toggle-pw');
    const status = $('#term-status');
    const submitBtn = $('#term-submit-btn');
    const sessionUser = $('#session-username');
    const sessionDept = $('#session-dept');
    const logoutBtn = $('#session-logout-btn');

    const TOKEN_KEY = 'cipher-admin-token';
    const USER_KEY = 'cipher-admin-user';

    const checkSession = () => {
      const token = storage.get(TOKEN_KEY);
      const user = storage.get(USER_KEY) || 'Administrator';
      if (token) {
        if (authPanel) authPanel.hidden = true;
        if (sessionPanel) {
          sessionPanel.hidden = false;
          if (sessionUser) sessionUser.textContent = user.toUpperCase();
          if (sessionDept) sessionDept.textContent = 'Department of CSE';
        }
      } else {
        if (authPanel) authPanel.hidden = false;
        if (sessionPanel) sessionPanel.hidden = true;
      }
    };

    // Toggle password visibility
    if (togglePw && passInp) {
      togglePw.addEventListener('click', () => {
        const isPw = passInp.type === 'password';
        passInp.type = isPw ? 'text' : 'password';
        togglePw.textContent = isPw ? '🔒' : '👁';
      });
    }

    // Quick fill handlers on admin cards and quick buttons
    const handleFill = (user, pass) => {
      if (userInp) userInp.value = user || '';
      if (passInp) passInp.value = pass || '';
      if (status) {
        status.className = 'form-status';
        status.textContent = `> Selected: ${user} (Ready to verify)`;
      }
      const terminal = $('#admin-terminal');
      if (terminal) {
        terminal.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
      if (passInp) passInp.focus();
    };

    $$('[data-user]').forEach((btn) => {
      btn.addEventListener('click', () => {
        handleFill(btn.getAttribute('data-user'), btn.getAttribute('data-pass'));
      });
    });

    // Form submit
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = userInp.value.trim();
        const password = passInp.value;

        status.className = 'form-status';
        if (!username || !password) {
          status.classList.add('err');
          status.textContent = '> Error: Both username and password are required.';
          return;
        }

        submitBtn.disabled = true;
        status.textContent = '> [ AUTHENTICATING ACCESS PRIVILEGES... ]';

        try {
          const res = await fetch('/api/admin/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
          });
          const data = await res.json();
          if (!res.ok) {
            throw new Error(data.error || 'Authentication denied.');
          }

          storage.set(TOKEN_KEY, data.token);
          storage.set(USER_KEY, data.username || username);

          status.classList.add('ok');
          status.textContent = '> [ ACCESS GRANTED // INITIALIZING SECURE SESSION ]';

          setTimeout(() => {
            checkSession();
          }, 600);
        } catch (err) {
          status.classList.add('err');
          status.textContent = `> Access Denied: ${err.message}`;
        } finally {
          submitBtn.disabled = false;
        }
      });
    }

    // Logout
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        storage.remove(TOKEN_KEY);
        storage.remove(USER_KEY);
        if (form) form.reset();
        if (status) {
          status.className = 'form-status';
          status.textContent = '> Session terminated. Please authenticate to resume.';
        }
        checkSession();
      });
    }

    checkSession();
  }

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
  ['home', 'about', 'leadership', 'events', 'admin', 'join'].forEach((id) => {
    const el = $('#' + id);
    if (el) io.observe(el);
  });

  /* ---------------- boot ---------------- */
  runIntro(); startWaves(); startHeroDots();
  loadLeaders(); loadEvents(); loadArchive();
  initAdminSection();
})();
