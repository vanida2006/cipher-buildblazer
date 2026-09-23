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

  /* ---------------- creative dynamic motion background ---------------- */
  function startWaves() {
    const c = $("#waves");
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;

    let w = 0, hgt = 0, t = 0, rafId = null, running = true;
    let farParticles = [];
    let nearParticles = [];
    let packets = [];
    let validLinks = [];
    let smoothMouse = { x: -999, y: -999 };

    const resize = () => {
      w = c.width = Math.max(innerWidth || 800, 320);
      hgt = c.height = Math.max(innerHeight || 600, 320);
      initElements();
      if (reduceMotion) drawStatic();
    };

    function initElements() {
      // 1. Far depth particle layer (smaller, slower, lower opacity)
      const farCount = Math.min(Math.max(Math.floor((w * hgt) / 38000), 20), 45);
      farParticles = [];
      for (let i = 0; i < farCount; i++) {
        farParticles.push({
          x: Math.random() * w,
          y: Math.random() * hgt,
          vx: (Math.random() - 0.5) * 0.18,
          vy: (Math.random() - 0.5) * 0.18,
          radius: Math.random() * 0.6 + 0.7,
          alpha: Math.random() * 0.15 + 0.12
        });
      }

      // 2. Near network constellation nodes (crisp, subtle pulse, linked)
      const nearCount = Math.min(Math.max(Math.floor((w * hgt) / 28000), 24), 55);
      nearParticles = [];
      for (let i = 0; i < nearCount; i++) {
        nearParticles.push({
          x: Math.random() * w,
          y: Math.random() * hgt,
          vx: (Math.random() - 0.5) * 0.32,
          vy: (Math.random() - 0.5) * 0.32,
          radius: Math.random() * 0.8 + 1.1,
          pulse: Math.random() * Math.PI * 2,
          pulseSpeed: 0.015 + Math.random() * 0.02,
          baseAlpha: Math.random() * 0.28 + 0.28
        });
      }

      packets = [];
      validLinks = [];
    }

    resize();
    let rtime;
    addEventListener("resize", () => {
      clearTimeout(rtime);
      rtime = setTimeout(resize, 120);
    }, { passive: true });

    document.addEventListener("visibilitychange", () => {
      running = !document.hidden;
      if (running && !reduceMotion) {
        if (!rafId) rafId = requestAnimationFrame(draw);
      } else {
        if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
      }
    });

    // Draw single static background if user prefers reduced motion
    function drawStatic() {
      ctx.clearRect(0, 0, w, hgt);
      drawTopographicWaves(0);
      drawNetworkNodes(0);
    }

    // LAYER 1: Very subtle animated grid that shifts slowly
    function drawGrid(time) {
      const gridSize = 64;
      const shiftY = (time * 6) % gridSize;
      ctx.beginPath();
      ctx.strokeStyle = "rgba(0, 255, 102, 0.022)";
      ctx.lineWidth = 0.5;

      // Vertical lines
      for (let x = 0; x <= w; x += gridSize) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, hgt);
      }

      // Horizontal lines with slow continuous vertical drift
      for (let y = shiftY; y <= hgt; y += gridSize) {
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
      }
      ctx.stroke();

      // Sparse subtle corner crosshairs
      ctx.fillStyle = "rgba(0, 255, 102, 0.04)";
      for (let x = gridSize; x < w; x += gridSize * 3) {
        for (let y = shiftY + gridSize; y < hgt; y += gridSize * 3) {
          ctx.fillRect(x - 2, y, 5, 1);
          ctx.fillRect(x, y - 2, 1, 5);
        }
      }
    }

    // LAYER 2: Subtle animated flowing topographic/wave lines
    function drawTopographicWaves(time) {
      const waveCount = Math.min(Math.max(Math.floor(hgt / 140), 6), 9);
      const waveSpacing = hgt / (waveCount + 1);

      ctx.lineWidth = 0.9;
      for (let i = 0; i < waveCount; i++) {
        const base = (i + 1) * waveSpacing;
        ctx.beginPath();

        const step = Math.max(Math.floor(w / 36), 24);
        for (let x = 0; x <= w + step; x += step) {
          // Cursor magnetic deflection
          const dx = x - smoothMouse.x;
          const dy = base - smoothMouse.y;
          const distSq = dx * dx + dy * dy;
          const pull = distSq < 70000 ? Math.exp(-distSq / 42000) * 18 : 0;

          // Harmonic compound sine contours (mimicking topographic elevation)
          const y = base
            + Math.sin(x * 0.0024 + time * 0.45 + i * 0.72) * 20
            + Math.cos(x * 0.0048 - time * 0.32 + i * 0.44) * 11
            - pull;

          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }

        // Soft, elegant emerald stroke with harmonic alpha
        const lineAlpha = 0.038 + 0.02 * Math.sin(i * 0.9 + time * 0.5);
        ctx.strokeStyle = "rgba(0, 255, 102, " + lineAlpha + ")";
        ctx.stroke();
      }
    }

    // LAYER 3: Multi-depth particles and network constellation
    function drawNetworkNodes(time) {
      validLinks = [];

      // Far depth particles (slow drifting ambient stars)
      ctx.fillStyle = "rgba(0, 255, 102, 0.16)";
      for (let i = 0; i < farParticles.length; i++) {
        const fp = farParticles[i];
        if (!reduceMotion) {
          fp.x += fp.vx;
          fp.y += fp.vy;
          if (fp.x < 0) fp.x = w;
          else if (fp.x > w) fp.x = 0;
          if (fp.y < 0) fp.y = hgt;
          else if (fp.y > hgt) fp.y = 0;
        }
        ctx.beginPath();
        ctx.arc(fp.x, fp.y, fp.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      // Near constellation nodes with dynamic distance connections
      const maxDist = Math.min(w * 0.16, 150);
      const maxDistSq = maxDist * maxDist;

      for (let i = 0; i < nearParticles.length; i++) {
        const p = nearParticles[i];

        if (!reduceMotion) {
          p.x += p.vx;
          p.y += p.vy;
          p.pulse += p.pulseSpeed;

          // Wrap edges
          if (p.x < -10) p.x = w + 10;
          else if (p.x > w + 10) p.x = -10;
          if (p.y < -10) p.y = hgt + 10;
          else if (p.y > hgt + 10) p.y = -10;

          // Cursor gentle magnetic nudge
          const mdx = p.x - smoothMouse.x;
          const mdy = p.y - smoothMouse.y;
          const mDistSq = mdx * mdx + mdy * mdy;
          if (mDistSq < 16000 && mDistSq > 1) {
            const push = (1 - Math.sqrt(mDistSq) / 126) * 0.4;
            p.x += (mdx / Math.sqrt(mDistSq)) * push;
            p.y += (mdy / Math.sqrt(mDistSq)) * push;
          }
        }

        // Inter-node connections
        for (let j = i + 1; j < nearParticles.length; j++) {
          const p2 = nearParticles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const distSq = dx * dx + dy * dy;

          if (distSq < maxDistSq) {
            const dist = Math.sqrt(distSq);
            const lineAlpha = (1 - dist / maxDist) * 0.16;

            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = "rgba(0, 255, 102, " + lineAlpha + ")";
            ctx.lineWidth = 0.6;
            ctx.stroke();

            validLinks.push({ from: p, to: p2 });
          }
        }

        // Draw node
        const glow = Math.sin(p.pulse) * 0.3 + 0.7;
        const currentAlpha = p.baseAlpha * glow;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(0, 255, 102, " + currentAlpha + ")";
        ctx.fill();
      }

      // Travelling data packets on active links
      if (!reduceMotion) {
        if (packets.length < 8 && validLinks.length > 0 && Math.random() < 0.05) {
          const link = validLinks[Math.floor(Math.random() * validLinks.length)];
          packets.push({
            from: link.from,
            to: link.to,
            progress: 0,
            speed: 0.012 + Math.random() * 0.016
          });
        }

        for (let pIdx = packets.length - 1; pIdx >= 0; pIdx--) {
          const pk = packets[pIdx];
          pk.progress += pk.speed;

          if (pk.progress >= 1) {
            packets.splice(pIdx, 1);
            continue;
          }

          const pkX = pk.from.x + (pk.to.x - pk.from.x) * pk.progress;
          const pkY = pk.from.y + (pk.to.y - pk.from.y) * pk.progress;

          ctx.beginPath();
          ctx.arc(pkX, pkY, 1.4, 0, Math.PI * 2);
          ctx.fillStyle = "#ffffff";
          ctx.shadowColor = "#00ff66";
          ctx.shadowBlur = 6;
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      }
    }

    // LAYER 4: Subtle cursor ambient glow
    function drawCursorGlow() {
      if (smoothMouse.x < 0 || smoothMouse.y < 0) return;
      const rad = ctx.createRadialGradient(smoothMouse.x, smoothMouse.y, 0, smoothMouse.x, smoothMouse.y, 280);
      rad.addColorStop(0, "rgba(0, 255, 102, 0.038)");
      rad.addColorStop(0.5, "rgba(0, 255, 102, 0.012)");
      rad.addColorStop(1, "transparent");
      ctx.fillStyle = rad;
      ctx.beginPath();
      ctx.arc(smoothMouse.x, smoothMouse.y, 280, 0, Math.PI * 2);
      ctx.fill();
    }

    function draw() {
      if (!running) { rafId = null; return; }
      ctx.clearRect(0, 0, w, hgt);

      // Smooth mouse coordinate lerping
      if (mouse.x >= 0) {
        if (smoothMouse.x < 0) {
          smoothMouse.x = mouse.x;
          smoothMouse.y = mouse.y;
        } else {
          smoothMouse.x += (mouse.x - smoothMouse.x) * 0.12;
          smoothMouse.y += (mouse.y - smoothMouse.y) * 0.12;
        }
      }

      drawCursorGlow();
      drawGrid(t);
      drawTopographicWaves(t);
      drawNetworkNodes(t);

      t += 0.004;
      rafId = requestAnimationFrame(draw);
    }

    if (reduceMotion) {
      drawStatic();
    } else {
      rafId = requestAnimationFrame(draw);
    }
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
    if (!gal.length) {
      f.className = 'gallery__frame empty';
      f.style.backgroundImage = '';
      f.innerHTML = '<span style="color:var(--g-dim)">Photos coming soon</span>';
      $('#em-count').textContent = '00 / 00';
      return;
    }
    const s = gal[gi];
    f.className = 'gallery__frame';
    f.style.backgroundImage = `url("${encodeURI(s.src)}")`;
    f.innerHTML = s.caption ? `<div class="gallery__caption">${s.caption}</div>` : '';
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

  let allEvents = [];

  function openEventBySlug(slug, cardElem) {
    const ev = allEvents.find((e) => e.slug === slug);
    if (ev) {
      openEvent(ev);
      return;
    }
    let gallery = [];
    if (cardElem && cardElem.dataset.gallery) {
      try { gallery = JSON.parse(cardElem.dataset.gallery); } catch {}
    }
    const title = cardElem?.querySelector('.card__title')?.textContent || 'Event Details';
    const dateText = cardElem?.querySelector('.card__date-tag')?.textContent || '';
    const venueText = cardElem?.querySelector('.card__venue')?.textContent || '';
    const summaryText = cardElem?.querySelector('.card__summary')?.textContent || '';

    $('#em-tag').textContent = `cipher // activities`;
    $('#em-title').textContent = title;
    $('#em-meta').textContent = [dateText, venueText].filter(Boolean).join(' · ');
    $('#em-body').replaceChildren(h('p', { text: summaryText }));
    gal = gallery;
    gi = 0;
    showSlide();
    modal.showModal();
  }

  function initEventCards() {
    const cards = $$('#event-cards .card');
    cards.forEach((card) => {
      const slides = Array.from(card.querySelectorAll('.card__slide'));
      const hudIdx = card.querySelector('.hud-idx');
      const hudTotal = card.querySelector('.hud-total');
      const progressBar = card.querySelector('.card__progress-bar');
      const dots = Array.from(card.querySelectorAll('.card__dot'));
      const slug = card.dataset.slug;

      if (hudTotal && slides.length) {
        hudTotal.textContent = String(slides.length).padStart(2, '0');
      }

      let curIdx = 0;
      let cycleInterval = null;
      const CYCLE_DURATION = 1300;

      function setSlide(idx) {
        curIdx = idx;
        slides.forEach((sl, i) => sl.classList.toggle('active', i === curIdx));
        dots.forEach((dt, i) => dt.classList.toggle('active', i === curIdx));
        if (hudIdx) hudIdx.textContent = String(curIdx + 1).padStart(2, '0');
      }

      function startProgress() {
        if (!progressBar) return;
        progressBar.style.transition = 'none';
        progressBar.style.width = '0%';
        void progressBar.offsetWidth; // force reflow
        progressBar.style.transition = `width ${CYCLE_DURATION}ms linear`;
        progressBar.style.width = '100%';
      }

      function resetProgress() {
        if (!progressBar) return;
        progressBar.style.transition = 'none';
        progressBar.style.width = '0%';
      }

      function startCycling() {
        if (slides.length <= 1) return;
        clearInterval(cycleInterval);
        startProgress();
        cycleInterval = setInterval(() => {
          const next = (curIdx + 1) % slides.length;
          setSlide(next);
          startProgress();
        }, CYCLE_DURATION);
      }

      function stopCycling() {
        clearInterval(cycleInterval);
        cycleInterval = null;
        resetProgress();
        setSlide(0);
      }

      card.addEventListener('mouseenter', startCycling);
      card.addEventListener('mouseleave', stopCycling);
      card.addEventListener('focusin', startCycling);
      card.addEventListener('focusout', stopCycling);

      // Subtle magnetic tilt towards cursor
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (!prefersReducedMotion) {
        const MAX_TILT = 6.5; // degrees of subtle tilt
        const MAX_TRANS = 5;  // px of subtle magnetic pull
        let tiltRaf = null;
        let tX = 50, tY = 50, pX = 0, pY = 0;

        const updateTilt = () => {
          tiltRaf = null;
          const rotX = (pY * MAX_TILT).toFixed(2);
          const rotY = (-pX * MAX_TILT).toFixed(2);
          const trX = (pX * MAX_TRANS).toFixed(1);
          const trY = (pY * MAX_TRANS - 5).toFixed(1);

          card.style.setProperty('--tilt-x', `${rotX}deg`);
          card.style.setProperty('--tilt-y', `${rotY}deg`);
          card.style.setProperty('--trans-x', `${trX}px`);
          card.style.setProperty('--trans-y', `${trY}px`);
          card.style.setProperty('--trans-z', '12px');
          card.style.setProperty('--shine-x', `${tX.toFixed(1)}%`);
          card.style.setProperty('--shine-y', `${tY.toFixed(1)}%`);
        };

        card.addEventListener('mousemove', (e) => {
          const rect = card.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          tX = (x / rect.width) * 100;
          tY = (y / rect.height) * 100;
          pX = (x / rect.width) * 2 - 1;
          pY = (y / rect.height) * 2 - 1;

          if (!card.classList.contains('is-tilting')) {
            card.classList.add('is-tilting');
            card.classList.remove('is-resetting');
          }

          if (!tiltRaf) {
            tiltRaf = requestAnimationFrame(updateTilt);
          }
        });

        card.addEventListener('mouseleave', () => {
          if (tiltRaf) {
            cancelAnimationFrame(tiltRaf);
            tiltRaf = null;
          }
          card.classList.remove('is-tilting');
          card.classList.add('is-resetting');
          card.style.setProperty('--tilt-x', '0deg');
          card.style.setProperty('--tilt-y', '0deg');
          card.style.setProperty('--trans-x', '0px');
          card.style.setProperty('--trans-y', '0px');
          card.style.setProperty('--trans-z', '0px');
        });
      }

      const triggerModal = () => openEventBySlug(slug, card);
      card.addEventListener('click', triggerModal);
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          triggerModal();
        }
      });
    });

    // Category filter chips
    const chips = $$('#event-chips .chip');
    chips.forEach((chip) => {
      chip.addEventListener('click', () => {
        const cat = (chip.dataset.cat || chip.textContent).trim().toUpperCase();
        chips.forEach((c) => c.setAttribute('aria-pressed', String(c === chip)));
        cards.forEach((c) => {
          const cCat = (c.dataset.category || '').trim().toUpperCase();
          let match = false;
          if (cat === 'ALL') {
            match = true;
          } else if (cat === 'BRANCH GALA' || cat === 'BRANCH ENTRY') {
            match = cCat.includes('BRANCH') || cCat.includes('GALA') || cCat.includes('ENTRY');
          } else {
            match = cCat === cat;
          }
          c.hidden = !match;
        });
      });
    });
  }

  async function loadContent() {
    try {
      const content = await api('/content');
      if (content && typeof content === 'object') {
        if (content.about_title && $('#about-title')) $('#about-title').textContent = content.about_title;
        if (content.about_text && $('#about-lead')) $('#about-lead').textContent = content.about_text;
        if (content.hero_subtitle && $('#hero-sub')) $('#hero-sub').textContent = content.hero_subtitle;
      }
    } catch (e) {
      console.warn('Content loader fallback:', e.message);
    }
  }

  async function loadEvents() {
    const container = $('#event-cards');
    if (!container) return;

    try {
      allEvents = await api('/events');
      if (Array.isArray(allEvents) && allEvents.length > 0) {
        // Build cards dynamically for all published events
        const cardElements = allEvents.map((ev) => {
          const gallery = Array.isArray(ev.gallery) && ev.gallery.length > 0 ? ev.gallery : (ev.poster ? [{ src: ev.poster, caption: ev.title }] : []);
          const firstImg = gallery[0]?.src || 'img/events/gsoc-llm-workshop/02.jpg';
          const cat = (ev.category || 'EVENT').toUpperCase();
          const dept = ev.category?.toUpperCase() === 'WORKSHOP' ? 'CSE · HANDS-ON' : (ev.category?.toUpperCase() === 'COMPETITION' ? 'CIPHER · CONTEST' : 'CSE · CIPHER');
          const dateFormatted = fmtDate(ev.event_date);
          const totalCount = String(gallery.length || 1).padStart(2, '0');

          const article = h('article', {
            class: `card ${gallery.length > 1 ? 'has-gallery' : ''}`,
            'data-slug': ev.slug,
            'data-category': cat,
            'data-gallery': JSON.stringify(gallery),
            tabindex: '0',
            role: 'button',
            'aria-label': `${ev.title} details`
          });

          // Media container
          const media = h('div', { class: 'card__media' },
            h('div', { class: 'card__progress', 'aria-hidden': 'true' }, h('div', { class: 'card__progress-bar' })),
            h('div', { class: 'card__category-badge', text: cat }),
            gallery.length > 1 ? h('div', { class: 'card__hud', 'aria-hidden': 'true' },
              h('span', { class: 'card__hud-badge' },
                h('span', { class: 'hud-idx', text: '01' }), ' / ', h('span', { class: 'hud-total', text: totalCount })
              )
            ) : null,
            h('div', { class: 'card__slides' },
              ...gallery.map((g, idx) => h('img', {
                src: g.src,
                alt: `${ev.title} photo ${idx + 1}`,
                class: `card__slide ${idx === 0 ? 'active' : ''}`,
                loading: 'lazy',
                decoding: 'async'
              }))
            ),
            h('div', { class: 'card__overlay', 'aria-hidden': 'true' }),
            gallery.length > 1 ? h('div', { class: 'card__dots', 'aria-hidden': 'true' },
              ...gallery.map((_, idx) => h('span', { class: `card__dot ${idx === 0 ? 'active' : ''}` }))
            ) : null
          );

          // Content container
          const content = h('div', { class: 'card__content' },
            h('div', { class: 'card__header-meta' },
              h('span', { class: 'card__dept-tag', text: dept }),
              h('span', { class: 'card__date-tag', text: dateFormatted })
            ),
            h('h3', { class: 'card__title', text: ev.title }),
            h('p', { class: 'card__summary', text: ev.summary || '' }),
            h('div', { class: 'card__footer' },
              h('span', { class: 'card__venue', text: ev.venue || (ev.event_time ? ev.event_time : 'SJEC Campus') }),
              h('span', { class: 'card__action', text: 'VIEW DETAILS ↗' })
            )
          );

          article.append(media, content);
          return article;
        });

        container.replaceChildren(...cardElements);
      }
    } catch (err) {
      console.warn('Using pre-rendered event cards fallback:', err);
    }

    initEventCards();
  }

  async function loadArchive() {
    const ol = $('#archive'), empty = $('#archive-empty'), input = $('#archive-search');
    try {
      const list = await api('/activities');
      const draw = () => {
        const q = input.value.trim().toLowerCase();
        const shown = list.filter((a) => a.title.toLowerCase().includes(q));
        ol.replaceChildren(...shown.map((a, idx) => {
          const numStr = String(idx + 1).padStart(2, '0');
          const li = h('li', {
            class: 'archive__item',
            style: `--idx: ${idx};`
          });
          const numEl = h('span', { class: 'archive__num', text: numStr });
          const textEl = a.url
            ? h('a', { href: a.url, class: 'archive__link', rel: 'noopener', text: a.title })
            : h('span', { class: 'archive__text', text: a.title });
          const scanEl = h('span', { class: 'archive__scanline', 'aria-hidden': 'true' });
          li.append(numEl, textEl, scanEl);
          return li;
        }));
        empty.hidden = shown.length > 0;
      };
      input.addEventListener('input', draw); draw();
    } catch { ol.replaceChildren(h('li', { class: 'archive__item', text: 'Could not load activities.' })); }
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

  /* ---------------- about section & collage interaction ---------------- */
  function initAboutCollage() {
    const aboutSec = $('#about');
    const collage = $('#about-collage');
    const heading = $('.about__heading');
    const cipherWord = $('.about__word-wrap');
    if (!aboutSec) return;

    // Viewport entrance observer for "WHO WE ARE" & About Section
    const aboutObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          aboutSec.classList.add('in-view');
          if (heading) heading.classList.add('in-view');
        }
      });
    }, { rootMargin: '0px 0px -60px 0px', threshold: 0.15 });

    aboutObserver.observe(aboutSec);

    // Interactive collage motion & tile focus effects
    if (collage) {
      const tiles = Array.from(collage.querySelectorAll('.tile'));

      // Micro parallax & smooth speed control
      let collageRaf = null;
      let targetRx = 0, targetRy = 0;
      let currentRx = 0, currentRy = 0;
      let targetAnimSpeed = 1.0;
      let currentAnimSpeed = 1.0;

      const updateCollageMotion = () => {
        // Smooth tilt interpolation
        currentRx += (targetRx - currentRx) * 0.1;
        currentRy += (targetRy - currentRy) * 0.1;
        collage.style.transform = `perspective(1000px) rotateX(${currentRx.toFixed(2)}deg) rotateY(${currentRy.toFixed(2)}deg)`;

        // Smooth animation speed interpolation (1.0 -> 2.0 -> 1.0)
        currentAnimSpeed += (targetAnimSpeed - currentAnimSpeed) * 0.08;
        if (Math.abs(targetAnimSpeed - currentAnimSpeed) < 0.005) {
          currentAnimSpeed = targetAnimSpeed;
        }
        collage.style.setProperty('--anim-speed', currentAnimSpeed.toFixed(3));

        const isTiltActive = Math.abs(targetRx - currentRx) > 0.02 || Math.abs(targetRy - currentRy) > 0.02;
        const isSpeedActive = currentAnimSpeed !== targetAnimSpeed;

        if (isTiltActive || isSpeedActive) {
          collageRaf = requestAnimationFrame(updateCollageMotion);
        } else {
          collageRaf = null;
        }
      };

      const setSpeedTarget = (speed) => {
        targetAnimSpeed = speed;
        if (!collageRaf) {
          collageRaf = requestAnimationFrame(updateCollageMotion);
        }
      };

      // Hover on collage reveals images and smoothly transitions animation speed from 1 to 2
      collage.addEventListener('pointerenter', () => {
        collage.classList.add('show-images');
        setSpeedTarget(2.0);
      });

      if (!reduceMotion) {
        collage.addEventListener('pointermove', (e) => {
          const rect = collage.getBoundingClientRect();
          const normX = (e.clientX - rect.left) / rect.width - 0.5;
          const normY = (e.clientY - rect.top) / rect.height - 0.5;
          targetRy = normX * 6; // Max 3 deg Y-rotation
          targetRx = -normY * 6; // Max 3 deg X-rotation
          if (!collageRaf) {
            collageRaf = requestAnimationFrame(updateCollageMotion);
          }
        });
      }

      collage.addEventListener('pointerleave', () => {
        collage.classList.remove('show-images');
        collage.classList.remove('has-tile-hover');
        targetRx = 0;
        targetRy = 0;
        setSpeedTarget(1.0);
      });

      // Direct hover / focus on CIPHER logo
      if (cipherWord) {
        cipherWord.addEventListener('pointerenter', () => {
          collage.classList.add('show-images');
          setSpeedTarget(2.0);
        });
        cipherWord.addEventListener('pointerleave', () => {
          if (!collage.matches(':hover')) {
            setSpeedTarget(1.0);
          }
        });
        cipherWord.addEventListener('click', (e) => {
          e.stopPropagation();
          const willShow = collage.classList.toggle('show-images');
          setSpeedTarget(willShow ? 2.0 : 1.0);
        });
      }

      // Individual tile hover & focus dimming
      tiles.forEach((tile) => {
        tile.addEventListener('pointerenter', () => {
          collage.classList.add('show-images');
          collage.classList.add('has-tile-hover');
          tile.classList.add('is-hovered');
          setSpeedTarget(2.0);
        });
        tile.addEventListener('pointerleave', () => {
          tile.classList.remove('is-hovered');
          if (!tiles.some(t => t.matches(':hover'))) {
            collage.classList.remove('has-tile-hover');
          }
        });
        tile.addEventListener('focus', () => {
          collage.classList.add('show-images');
          collage.classList.add('has-tile-hover');
          tile.classList.add('is-hovered');
        });
        tile.addEventListener('blur', () => {
          tile.classList.remove('is-hovered');
          collage.classList.remove('has-tile-hover');
          collage.classList.remove('show-images');
        });
      });
    }
  }

  /* ---------------- interactive pillars ---------------- */
  function initPillars() {
    const pillars = $$('.pillar');
    const chars = '01#$*!~_><[]%&';

    pillars.forEach((pillar) => {
      const modEl = pillar.querySelector('.pillar__mod');
      const originalText = modEl ? modEl.textContent : '';

      // Dynamic mouse spotlight tracking
      pillar.addEventListener('mousemove', (e) => {
        const rect = pillar.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        pillar.style.setProperty('--mouse-x', `${x}%`);
        pillar.style.setProperty('--mouse-y', `${y}%`);
      });

      // Hover trigger: laser sweep & hacker text decipher scramble
      pillar.addEventListener('mouseenter', () => {
        pillar.classList.add('scanning');
        setTimeout(() => pillar.classList.remove('scanning'), 900);

        if (modEl && originalText) {
          let iteration = 0;
          const maxIterations = 8;
          clearInterval(pillar._scrambleInterval);
          pillar._scrambleInterval = setInterval(() => {
            modEl.textContent = originalText
              .split('')
              .map((char, index) => {
                if (char === ' ' || char === '/' || char === '·') return char;
                if (index < iteration) return originalText[index];
                return chars[Math.floor(Math.random() * chars.length)];
              })
              .join('');

            if (iteration >= originalText.length) {
              clearInterval(pillar._scrambleInterval);
              modEl.textContent = originalText;
            }
            iteration += originalText.length / maxIterations;
          }, 32);
        }
      });

      pillar.addEventListener('mouseleave', () => {
        clearInterval(pillar._scrambleInterval);
        if (modEl) modEl.textContent = originalText;
      });

      // Smooth scroll navigation with category filter auto-select
      const handleAction = () => {
        const target = pillar.dataset.target;
        if (target) {
          const el = $(target);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth' });
            const filter = pillar.dataset.filter;
            if (filter) {
              const chip = $(`#event-chips .chip[data-cat="${filter}"]`);
              if (chip) chip.click();
            }
          }
        }
      };

      pillar.addEventListener('click', handleAction);
      pillar.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleAction();
        }
      });
    });
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
  ['home', 'about', 'leadership', 'events', 'join'].forEach((id) => {
    const el = $('#' + id);
    if (el) io.observe(el);
  });

  /* ---------------- viewport scroll reveal ---------------- */
  function initScrollReveal() {
    if (reduceMotion) {
      $$('.reveal').forEach((el) => el.classList.add('in-view'));
      return;
    }
    const revealTargets = $$(
      '.section, .pillar, .card, .archive li, .about__text, .about__collage'
    );
    revealTargets.forEach((el) => {
      el.classList.add('reveal');
      const siblings = el.parentNode ? Array.from(el.parentNode.children) : [];
      const idx = siblings.indexOf(el);
      el.style.setProperty('--reveal-delay', String(idx >= 0 ? idx % 6 : 0));
    });

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          observer.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -40px 0px', threshold: 0.06 });

    revealTargets.forEach((el) => observer.observe(el));
  }

  /* ---------------- boot ---------------- */
  runIntro(); startWaves(); startHeroDots();
  initAboutCollage();
  initPillars();
  loadLeaders(); loadEvents(); loadArchive(); loadContent();
  initAdminSection();
  initScrollReveal();
})();
