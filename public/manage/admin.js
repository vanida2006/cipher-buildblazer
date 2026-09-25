(() => {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const app = $('#app');

  const TOKEN_KEY = 'cipher-admin-token';
  const USER_KEY = 'cipher-admin-user';
  const ROLE_KEY = 'cipher-admin-role';

  const ROLE_LABELS = {
    SUPER_ADMIN: 'Super Admin',
    EVENT_MANAGER: 'Event Manager',
    CONTENT_MANAGER: 'Content Manager'
  };

  let token = null;
  let currentUser = 'Admin';
  let currentRole = 'SUPER_ADMIN';
  try {
    token = sessionStorage.getItem(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY);
    currentUser = sessionStorage.getItem(USER_KEY) || localStorage.getItem(USER_KEY) || 'Admin';
    currentRole = sessionStorage.getItem(ROLE_KEY) || localStorage.getItem(ROLE_KEY) || 'SUPER_ADMIN';
  } catch {}

  function canAccess(section) {
    const map = {
      Dashboard: ['SUPER_ADMIN', 'EVENT_MANAGER', 'CONTENT_MANAGER'],
      Events: ['SUPER_ADMIN', 'EVENT_MANAGER'],
      Registrations: ['SUPER_ADMIN', 'EVENT_MANAGER'],
      Members: ['SUPER_ADMIN', 'CONTENT_MANAGER'],
      Activities: ['SUPER_ADMIN', 'CONTENT_MANAGER'],
      Content: ['SUPER_ADMIN', 'CONTENT_MANAGER'],
      Admins: ['SUPER_ADMIN'],
      Settings: ['SUPER_ADMIN', 'EVENT_MANAGER', 'CONTENT_MANAGER']
    };
    return (map[section] || []).includes(currentRole);
  }

  /* ---------------- DOM Helpers ---------------- */
  function h(tag, props = {}, ...kids) {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(props)) {
      if (k === 'class') el.className = v;
      else if (k === 'text') el.textContent = v;
      else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
      else if (k === 'html') el.innerHTML = v;
      else if (v != null && v !== false) el.setAttribute(k, v === true ? '' : v);
    }
    kids.flat().forEach((c) => c != null && c !== false && el.append(c));
    return el;
  }

  function field(label, input, sub = '') {
    return h('label', {},
      h('div', { class: 'label-text' },
        h('span', { text: label }),
        sub ? h('span', { class: 'label-sub', text: sub }) : null
      ),
      input
    );
  }

  function svgIcon(name, size = 18) {
    const icons = {
      dashboard: '<svg width="'+size+'" height="'+size+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>',
      events: '<svg width="'+size+'" height="'+size+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/><path d="m9 16 2 2 4-4"/></svg>',
      registrations: '<svg width="'+size+'" height="'+size+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
      members: '<svg width="'+size+'" height="'+size+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
      content: '<svg width="'+size+'" height="'+size+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/><line x1="10" x2="8" y1="9" y2="9"/></svg>',
      settings: '<svg width="'+size+'" height="'+size+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>',
      plus: '<svg width="'+size+'" height="'+size+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',
      external: '<svg width="'+size+'" height="'+size+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>',
      logout: '<svg width="'+size+'" height="'+size+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>',
      search: '<svg width="'+size+'" height="'+size+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
      trash: '<svg width="'+size+'" height="'+size+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>',
      eye: '<svg width="'+size+'" height="'+size+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>',
      eyeOff: '<svg width="'+size+'" height="'+size+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></svg>',
      edit: '<svg width="'+size+'" height="'+size+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>',
      download: '<svg width="'+size+'" height="'+size+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>',
      clock: '<svg width="'+size+'" height="'+size+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>'
    };
    const wrap = document.createElement('span');
    wrap.style.display = 'inline-flex';
    wrap.style.alignItems = 'center';
    wrap.innerHTML = icons[name] || '';
    return wrap;
  }

  let toastTimer;
  function toast(msg, bad = false) {
    const t = $('#toast');
    if (!t) return;
    t.textContent = msg;
    t.className = 'toast show' + (bad ? ' bad' : '');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { t.className = 'toast'; }, 2600);
  }

  async function api(path, { method = 'GET', body, form, raw } = {}) {
    const headers = {};
    if (token) headers.Authorization = 'Bearer ' + token;
    if (body) headers['Content-Type'] = 'application/json';
    const res = await fetch('/api' + path, { method, headers, body: form || (body ? JSON.stringify(body) : undefined) });
    if (res.status === 401 && token) {
      logout();
      throw new Error('Session expired. Please log in again.');
    }
    if (raw && res.ok) return res;
    const data = res.status === 204 ? null : await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.details?.map((d) => `${d.field}: ${d.message}`).join(', ') || data?.error || 'Request failed');
    return data;
  }

  const guard = (fn) => async (...a) => {
    try { await fn(...a); } catch (e) { toast(e.message, true); }
  };

  function logout() {
    token = null;
    currentUser = 'Admin';
    currentRole = 'SUPER_ADMIN';
    try {
      sessionStorage.removeItem(TOKEN_KEY);
      sessionStorage.removeItem(USER_KEY);
      sessionStorage.removeItem(ROLE_KEY);
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem(ROLE_KEY);
    } catch {}
    renderLogin();
  }

  /* ---------------- File Upload Helper ---------------- */
  async function uploadFile(file) {
    const fd = new FormData();
    fd.append('file', file);
    const res = await api('/manage/upload', { method: 'POST', form: fd });
    return res.url;
  }

  /* ---------------- Modal Overlay Component ---------------- */
  function showModal(title, bodyContent, onSave = null, saveBtnText = 'Save Changes') {
    const overlay = h('div', { class: 'admin-modal-overlay' });
    const closeBtn = h('button', { class: 'admin-modal-close', text: '✕', onclick: () => overlay.remove() });

    const header = h('div', { class: 'panel-card-header' },
      h('h3', { class: 'panel-card-title', text: title }),
      closeBtn
    );

    const footer = onSave ? h('div', { style: 'display:flex;justify-content:flex-end;gap:1rem;margin-top:1.8rem;' },
      h('button', { class: 'btn ghost', text: 'Cancel', onclick: () => overlay.remove() }),
      h('button', { class: 'btn solid', text: saveBtnText, onclick: async () => {
        try {
          await onSave();
          overlay.remove();
        } catch (e) {
          toast(e.message, true);
        }
      } })
    ) : null;

    const box = h('div', { class: 'admin-modal-box' }, header, bodyContent, footer);
    overlay.append(box);

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.remove();
    });

    document.body.append(overlay);
    return overlay;
  }

  /* =========================================================================
     BACKGROUND EFFECTS — Motionary elements for the admin panel
     ========================================================================= */

  // Floating Particles Canvas
  function initParticles() {
    const canvas = document.createElement('canvas');
    canvas.className = 'admin-particles';
    canvas.setAttribute('aria-hidden', 'true');
    document.body.insertBefore(canvas, document.body.firstChild);
    const ctx = canvas.getContext('2d');
    let particles = [];
    let w, ht;

    function resize() {
      w = canvas.width = window.innerWidth;
      ht = canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    // Create particles
    for (let i = 0; i < 60; i++) {
      particles.push({
        x: Math.random() * w,
        y: Math.random() * ht,
        vx: (Math.random() - 0.5) * 0.3,
        vy: -Math.random() * 0.4 - 0.1,
        size: Math.random() * 2 + 0.5,
        opacity: Math.random() * 0.5 + 0.1,
        pulse: Math.random() * Math.PI * 2
      });
    }

    function drawParticles() {
      ctx.clearRect(0, 0, w, ht);

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.pulse += 0.02;
        const alpha = p.opacity * (0.5 + 0.5 * Math.sin(p.pulse));

        // Wrap around
        if (p.y < -10) { p.y = ht + 10; p.x = Math.random() * w; }
        if (p.x < -10) p.x = w + 10;
        if (p.x > w + 10) p.x = -10;

        // Draw glow
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 255, 102, ${alpha})`;
        ctx.shadowColor = 'rgba(0, 255, 102, 0.6)';
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // Draw connection lines between nearby particles
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(0, 255, 102, ${0.08 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      requestAnimationFrame(drawParticles);
    }
    drawParticles();
  }

  // Create animated scan line element
  function initScanLine() {
    const line = document.createElement('div');
    line.className = 'admin-scanline';
    line.setAttribute('aria-hidden', 'true');
    document.body.appendChild(line);
  }

  // Create floating orbs
  function initOrbs() {
    const container = document.createElement('div');
    container.className = 'admin-orbs';
    container.setAttribute('aria-hidden', 'true');

    for (let i = 0; i < 3; i++) {
      const orb = document.createElement('div');
      orb.className = 'admin-orb admin-orb--' + (i + 1);
      container.appendChild(orb);
    }
    document.body.insertBefore(container, document.body.firstChild);
  }

  // Create animated hex grid overlay
  function initDataStream() {
    const el = document.createElement('div');
    el.className = 'admin-data-stream';
    el.setAttribute('aria-hidden', 'true');
    // Generate streaming data columns
    for (let i = 0; i < 8; i++) {
      const col = document.createElement('div');
      col.className = 'data-stream-col';
      col.style.left = (5 + i * 12.5) + '%';
      col.style.animationDelay = (i * 0.7) + 's';
      col.style.animationDuration = (8 + Math.random() * 6) + 's';
      el.appendChild(col);
    }
    document.body.insertBefore(el, document.body.firstChild);
  }

  // Initialize all background effects
  initParticles();
  initScanLine();
  initOrbs();
  initDataStream();

  /* ---------------- Navigation to Main Website ---------------- */
  function navigateToMainSite(e) {
    if (e && e.preventDefault) e.preventDefault();
    try {
      const loc = window.location;
      if (loc.protocol === 'file:') {
        loc.href = '../index.html';
        return;
      }
      const path = loc.pathname;
      if (path.includes('/manage')) {
        const base = path.replace(/\/manage(\/.*)?$/, '');
        loc.href = (base || '') + '/' || '../index.html';
      } else {
        loc.href = '../index.html';
      }
    } catch (_err) {
      window.location.href = '../index.html';
    }
  }

  /* =========================================================================
     1. LOGIN SCREEN
     ========================================================================= */
  function renderLogin() {
    const statusBox = h('div', { class: 'login-status-box' });
    const userInput = h('input', { name: 'username', required: true, placeholder: 'admin / username', autocomplete: 'username' });
    const passInput = h('input', { name: 'password', type: 'password', required: true, placeholder: 'Enter password', autocomplete: 'current-password', style: 'padding-right:2.6rem;' });
    
    const togglePassBtn = h('button', {
      type: 'button',
      class: 'toggle-password-btn',
      title: 'Show password',
      ariaLabel: 'Toggle password visibility',
      style: 'position:absolute;right:0.6rem;top:50%;transform:translateY(-50%);background:none;border:none;color:var(--g-dim);cursor:pointer;padding:4px;display:inline-flex;align-items:center;justify-content:center;transition:color 0.2s;',
      onclick: () => {
        const isSecret = passInput.type === 'password';
        passInput.type = isSecret ? 'text' : 'password';
        togglePassBtn.title = isSecret ? 'Hide password' : 'Show password';
        togglePassBtn.style.color = isSecret ? 'var(--g)' : 'var(--g-dim)';
        togglePassBtn.replaceChildren(svgIcon(isSecret ? 'eyeOff' : 'eye', 16));
      }
    }, svgIcon('eye', 16));

    const passWrap = h('div', { style: 'position:relative;width:100%;' }, passInput, togglePassBtn);
    const rememberBox = h('input', { type: 'checkbox', name: 'remember', style: 'width:auto;margin:0;accent-color:var(--g);cursor:pointer;' });
    const submitBtn = h('button', { class: 'btn solid', type: 'submit', style: 'width:100%;margin-top:.8rem;' }, 'Login to Dashboard →');

    const form = h('form', { class: 'login-card', onsubmit: async (e) => {
      e.preventDefault();
      statusBox.className = 'login-status-box';
      statusBox.textContent = 'Authenticating…';
      submitBtn.disabled = true;

      try {
        const r = await api('/manage/login', {
          method: 'POST',
          body: { username: userInput.value.trim(), password: passInput.value }
        });

        token = r.token;
        currentUser = r.username || userInput.value.trim() || 'Admin';
        currentRole = r.role || 'SUPER_ADMIN';
        try {
          sessionStorage.setItem(TOKEN_KEY, token);
          sessionStorage.setItem(USER_KEY, currentUser);
          sessionStorage.setItem(ROLE_KEY, currentRole);
          if (rememberBox.checked) {
            localStorage.setItem(TOKEN_KEY, token);
            localStorage.setItem(USER_KEY, currentUser);
            localStorage.setItem(ROLE_KEY, currentRole);
          }
        } catch {}

        statusBox.className = 'login-status-box ok';
        statusBox.textContent = '✓ Access granted. Loading dashboard…';
        setTimeout(() => renderShell('Dashboard'), 300);
      } catch (ex) {
        statusBox.className = 'login-status-box err';
        statusBox.textContent = `Error: ${ex.message}`;
        submitBtn.disabled = false;
      }
    } },
      h('div', { class: 'login-header' },
        h('img', { src: '../img/logo.jpg', alt: 'CIPHER logo', class: 'login-logo' }),
        h('h1', { text: 'CIPHER // ADMIN' }),
        h('p', { text: 'Centralized control system for events, registrations, content, and community moderation.' })
      ),
      field('Admin Email / Username', userInput),
      field('Password', passWrap),
      h('div', { style: 'display:flex;align-items:center;justify-content:space-between;margin:.4rem 0 1rem 0;' },
        h('label', { style: 'display:inline-flex;align-items:center;gap:.5rem;margin:0;cursor:pointer;' },
          rememberBox,
          h('span', { style: 'font-size:.76rem;color:var(--text-dim);', text: 'Remember me' })
        ),
        h('a', {
          href: '/',
          class: 'login-back-link',
          style: 'font-size:.76rem;color:var(--g-dim);cursor:pointer;text-decoration:none;',
          text: '← Back to Website'
        })
      ),
      statusBox,
      submitBtn
    );

    const wrap = h('div', { class: 'login-wrapper' }, form);
    app.replaceChildren(wrap);
  }

  /* =========================================================================
     2. ADMIN DASHBOARD SHELL & SIDEBAR
     ========================================================================= */
  const views = {
    Dashboard: viewDashboard,
    Events: viewEvents,
    Registrations: viewRegistrations,
    Members: viewMembers,
    Activities: viewActivities,
    Content: viewContent,
    Admins: viewAdmins,
    Settings: viewSettings
  };

  let activeTabName = 'Dashboard';

  function renderShell(active = 'Dashboard') {
    if (!canAccess(active)) active = 'Dashboard';
    activeTabName = active;
    const mainArea = h('main', { class: 'admin-main' });

    // --- Mobile sidebar toggle helpers ---
    const backdrop = h('div', { class: 'sidebar-backdrop' });
    let sidebarEl = null;

    function openSidebar() {
      if (sidebarEl) sidebarEl.classList.add('open');
      backdrop.classList.add('open');
      document.body.style.overflow = 'hidden';
    }
    function closeSidebar() {
      if (sidebarEl) sidebarEl.classList.remove('open');
      backdrop.classList.remove('open');
      document.body.style.overflow = '';
    }

    backdrop.addEventListener('click', closeSidebar);

    const hamburger = h('button', {
      class: 'hamburger-btn',
      'aria-label': 'Open menu',
      onclick: openSidebar,
      html: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>'
    });

    // Sidebar navigation — filtered by the logged-in admin's role
    const navItems = [
      { id: 'Dashboard', icon: 'dashboard', label: 'Dashboard' },
      { id: 'Events', icon: 'events', label: 'Events' },
      { id: 'Registrations', icon: 'registrations', label: 'Registrations' },
      { id: 'Members', icon: 'members', label: 'Members' },
      { id: 'Activities', icon: 'content', label: 'Activities' },
      { id: 'Content', icon: 'content', label: 'Content' },
      { id: 'Admins', icon: 'settings', label: 'Admins' },
      { id: 'Settings', icon: 'settings', label: 'Settings' }
    ].filter((item) => canAccess(item.id));

    const sidebar = h('aside', { class: 'admin-sidebar' },
      h('div', {},
        h('div', { class: 'sidebar-header' },
          h('div', { class: 'sidebar-brand-row' },
            h('img', { src: '../img/logo.jpg', alt: 'CIPHER logo', class: 'sidebar-logo' }),
            h('div', { class: 'brand-text-group' },
              h('div', { class: 'brand-badge' },
                h('span', { text: 'CIPHER' }),
                h('span', { class: 'brand-tag', text: 'ADMIN' })
              ),
              h('p', { class: 'brand-sub', text: 'SJEC CSE DEPARTMENT' })
            )
          )
        ),
        h('nav', { class: 'sidebar-nav' },
          navItems.map((item) => {
            const btn = h('button', {
              class: `nav-item ${item.id === active ? 'active' : ''}`,
              onclick: () => {
                closeSidebar();
                renderShell(item.id);
              },
              onmousemove: (e) => {
                const rect = btn.getBoundingClientRect();
                btn.style.setProperty('--mx', `${e.clientX - rect.left}px`);
                btn.style.setProperty('--my', `${e.clientY - rect.top}px`);
              }
            },
              svgIcon(item.icon, 18),
              h('span', { text: item.label })
            );
            return btn;
          })
        )
      ),
      h('div', { class: 'sidebar-footer' },
        h('div', { class: 'user-badge-card' },
          h('div', { class: 'user-avatar-dot' }),
          h('div', { class: 'user-badge-info' },
            h('div', { class: 'user-badge-name', text: currentUser }),
            h('div', { class: 'user-badge-role', text: ROLE_LABELS[currentRole] || currentRole })
          )
        ),
        h('a', {
          href: '/',
          class: 'sidebar-action-btn btn-site-link',
          title: 'Return to CIPHER Main Website'
        },
          svgIcon('external', 14),
          h('span', { text: 'View Public Site' })
        ),
        h('button', { class: 'sidebar-action-btn btn-logout', onclick: logout },
          svgIcon('logout', 14),
          h('span', { text: 'Logout' })
        )
      )
    );

    sidebarEl = sidebar;

    const layout = h('div', { class: 'admin-layout' }, sidebar, mainArea);
    app.replaceChildren(hamburger, backdrop, layout);

    // Render active tab view
    if (views[active]) {
      views[active](mainArea).catch((e) => toast(e.message, true));
    }
  }

  /* =========================================================================
     3. VIEW: DASHBOARD OVERVIEW
     ========================================================================= */
  async function viewDashboard(root) {
    root.replaceChildren(
      h('div', { class: 'admin-topbar' },
        h('div', { class: 'page-heading-group' },
          h('h1', {}, svgIcon('dashboard', 24), 'Dashboard Overview'),
          h('p', { text: 'Real-time telemetry, club activities, and quick actions.' })
        ),
        h('div', { class: 'topbar-actions' },
          h('div', { class: 'system-clock', id: 'admin-clock', text: new Date().toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase() }),
          h('button', { class: 'btn solid sm', onclick: () => renderShell('Events') }, svgIcon('plus', 14), 'Add Event')
        )
      ),
      h('p', { class: 'empty-state', text: 'Loading live dashboard statistics…' })
    );

    try {
      const stats = await api('/manage/stats');
      const recentLogs = currentRole === 'SUPER_ADMIN' ? await api('/manage/activity-log?limit=8') : [];

      // Metric Cards
      const statsGrid = h('div', { class: 'stats-grid' },
        h('div', { class: 'stat-card' },
          h('div', { class: 'stat-card-top' },
            h('span', { class: 'stat-label', text: 'Total Events' }),
            h('div', { class: 'stat-icon' }, svgIcon('events', 18))
          ),
          h('div', { class: 'stat-value', text: String(stats.totalEvents || 0) }),
          h('div', { class: 'stat-sub', text: `${stats.publishedEvents || 0} published on site` })
        ),
        h('div', { class: 'stat-card' },
          h('div', { class: 'stat-card-top' },
            h('span', { class: 'stat-label', text: 'Upcoming Events' }),
            h('div', { class: 'stat-icon' }, svgIcon('clock', 18))
          ),
          h('div', { class: 'stat-value', text: String(stats.upcomingEvents || 0) }),
          h('div', { class: 'stat-sub', text: 'Scheduled future sessions' })
        ),
        h('div', { class: 'stat-card' },
          h('div', { class: 'stat-card-top' },
            h('span', { class: 'stat-label', text: 'Total Registrations' }),
            h('div', { class: 'stat-icon' }, svgIcon('registrations', 18))
          ),
          h('div', { class: 'stat-value', text: String(stats.totalRegistrations || 0) }),
          h('div', { class: 'stat-sub', text: `${stats.pendingRegistrations || 0} pending review` })
        ),
        h('div', { class: 'stat-card' },
          h('div', { class: 'stat-card-top' },
            h('span', { class: 'stat-label', text: 'Active Members' }),
            h('div', { class: 'stat-icon' }, svgIcon('members', 18))
          ),
          h('div', { class: 'stat-value', text: String(stats.activeMembers || 0) }),
          h('div', { class: 'stat-sub', text: 'Council & leadership' })
        )
      );

      // Quick Actions Panel
      const quickActions = h('div', { class: 'panel-card' },
        h('div', { class: 'panel-card-header' },
          h('h3', { class: 'panel-card-title', text: 'Quick Actions' })
        ),
        h('div', { style: 'display:flex;gap:.8rem;flex-wrap:wrap;' },
          h('button', { class: 'btn solid sm', onclick: () => openEventEditorModal(null, () => renderShell('Dashboard')) }, svgIcon('plus', 14), 'Create New Event'),
          h('button', { class: 'btn sm', onclick: () => renderShell('Registrations') }, svgIcon('registrations', 14), 'Review Registrations'),
          h('button', { class: 'btn sm', onclick: () => renderShell('Content') }, svgIcon('content', 14), 'Update Website Content'),
          h('button', { class: 'btn ghost sm', onclick: guard(async () => {
            const res = await api('/manage/join-requests.csv', { raw: true });
            const blob = await res.blob();
            const a = h('a', { href: URL.createObjectURL(blob), download: 'cipher-registrations.csv' });
            document.body.append(a); a.click(); a.remove();
            toast('CSV Export downloaded');
          }) }, svgIcon('download', 14), 'Export Registrations CSV')
        )
      );

      // Recent Activity Feed (SUPER_ADMIN only — activity logs are audit data)
      const activityFeed = currentRole !== 'SUPER_ADMIN' ? null : h('div', { class: 'panel-card' },
        h('div', { class: 'panel-card-header' },
          h('h3', { class: 'panel-card-title', text: 'Recent Activity' }),
          h('button', { class: 'btn ghost xs', onclick: () => renderShell('Settings') }, 'View Full Log')
        ),
        recentLogs.length ? h('div', { class: 'activity-list' },
          recentLogs.map((log) => {
            const type = log.action_type || '';
            const iconType = type.includes('event') ? 'event' : (type.includes('reg') || type.includes('join') ? 'reg' : (type.includes('login') ? 'auth' : 'content'));
            const dateStr = new Date(log.created_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
            return h('div', { class: 'activity-item' },
              h('div', { class: `activity-icon-badge ${iconType}` },
                iconType === 'event' ? svgIcon('events', 16) : (iconType === 'reg' ? svgIcon('registrations', 16) : svgIcon('content', 16))
              ),
              h('div', { class: 'activity-content' },
                h('div', { class: 'activity-desc', text: log.details || log.action_type }),
                h('div', { class: 'activity-meta' },
                  h('span', { text: `By: ${log.username || 'System'}` }),
                  h('span', { text: '·' }),
                  h('span', { text: dateStr })
                )
              )
            );
          })
        ) : h('p', { class: 'empty-state', text: 'No recent activity recorded.' })
      );

      root.replaceChildren(
        h('div', { class: 'admin-topbar' },
          h('div', { class: 'page-heading-group' },
            h('h1', {}, svgIcon('dashboard', 24), 'Dashboard Overview'),
            h('p', { text: 'Real-time telemetry, club activities, and quick actions.' })
          ),
          h('div', { class: 'topbar-actions' },
            h('div', { class: 'system-clock', text: new Date().toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase() }),
            h('button', { class: 'btn solid sm', onclick: () => openEventEditorModal(null, () => renderShell('Dashboard')) }, svgIcon('plus', 14), 'Add Event')
          )
        ),
        statsGrid,
        quickActions,
        activityFeed
      );
    } catch (err) {
      root.replaceChildren(h('p', { class: 'empty-state', text: `Failed to load dashboard: ${err.message}` }));
    }
  }

  /* =========================================================================
     4. VIEW: EVENTS MANAGEMENT
     ========================================================================= */
  async function viewEvents(root) {
    root.replaceChildren(
      h('div', { class: 'admin-topbar' },
        h('div', { class: 'page-heading-group' },
          h('h1', {}, svgIcon('events', 24), 'Events Management'),
          h('p', { text: 'Create, edit, publish, and delete events appearing on the public website.' })
        ),
        h('div', { class: 'topbar-actions' },
          h('button', { class: 'btn solid sm', onclick: () => openEventEditorModal(null, () => viewEvents(root)) }, svgIcon('plus', 14), 'Add New Event')
        )
      ),
      h('p', { class: 'empty-state', text: 'Loading events…' })
    );

    const events = await api('/manage/events');

    let filterCategory = 'ALL';
    let searchQuery = '';

    const searchInput = h('input', {
      placeholder: 'Search events by title or venue…',
      oninput: (e) => { searchQuery = e.target.value.toLowerCase(); drawTable(); }
    });

    const categorySelect = h('select', {
      onchange: (e) => { filterCategory = e.target.value; drawTable(); }
    },
      h('option', { value: 'ALL', text: 'All Categories' }),
      h('option', { value: 'WORKSHOP', text: 'Workshop' }),
      h('option', { value: 'COMPETITION', text: 'Competition' }),
      h('option', { value: 'BRANCH GALA', text: 'Branch Gala' }),
      h('option', { value: 'CLUB LAUNCH', text: 'Club Launch' }),
      h('option', { value: 'TALK', text: 'Technical Talk' })
    );

    const tableWrap = h('div', { class: 'table-container' });

    function drawTable() {
      const filtered = events.filter((ev) => {
        const matchCat = filterCategory === 'ALL' || (ev.category || '').toUpperCase().includes(filterCategory);
        const matchSearch = !searchQuery || (ev.title || '').toLowerCase().includes(searchQuery) || (ev.venue || '').toLowerCase().includes(searchQuery);
        return matchCat && matchSearch;
      });

      if (!filtered.length) {
        tableWrap.replaceChildren(h('div', { class: 'empty-state', text: 'No events matching filter criteria.' }));
        return;
      }

      tableWrap.replaceChildren(
        h('table', {},
          h('thead', {},
            h('tr', {},
              h('th', { text: 'Event Title' }),
              h('th', { text: 'Category' }),
              h('th', { text: 'Date & Time' }),
              h('th', { text: 'Venue' }),
              h('th', { text: 'Gallery' }),
              h('th', { text: 'Status' }),
              h('th', { text: 'Actions', style: 'text-align:right;' })
            )
          ),
          h('tbody', {},
            filtered.map((ev) => {
              const galleryCount = (ev.gallery || []).length;
              const isPublished = ev.published !== false && ev.published !== 0;

              return h('tr', {},
                h('td', { style: 'font-weight:600;' },
                  h('div', { style: 'color:var(--white);', text: ev.title }),
                  ev.featured ? h('span', { class: 'badge amber', style: 'margin-top:2px;', text: 'FEATURED' }) : null
                ),
                h('td', {}, h('span', { class: 'badge green', text: ev.category || 'EVENT' })),
                h('td', {},
                  h('div', { text: ev.event_date || 'TBD' }),
                  ev.event_time ? h('div', { style: 'font-size:.72rem;color:var(--text-dim);', text: ev.event_time }) : null
                ),
                h('td', { text: ev.venue || 'SJEC Campus' }),
                h('td', {},
                  h('span', { class: 'badge dim', text: `${galleryCount} photo${galleryCount === 1 ? '' : 's'}` })
                ),
                h('td', {},
                  h('button', {
                    class: `badge ${isPublished ? 'green' : 'amber'}`,
                    style: 'cursor:pointer;background:none;',
                    title: 'Click to toggle publish status',
                    onclick: guard(async () => {
                      const newStatus = !isPublished;
                      await api(`/manage/events/${ev.id}/publish`, { method: 'PATCH', body: { published: newStatus } });
                      ev.published = newStatus;
                      toast(newStatus ? 'Event published to website' : 'Event unpublished (draft)');
                      drawTable();
                    })
                  }, isPublished ? '✓ PUBLISHED' : '○ DRAFT')
                ),
                h('td', { style: 'text-align:right;' },
                  h('div', { style: 'display:inline-flex;gap:.4rem;' },
                    h('button', {
                      class: 'btn ghost xs',
                      title: 'Preview Live Card',
                      onclick: () => previewEventModal(ev)
                    }, svgIcon('eye', 14)),
                    h('button', {
                      class: 'btn ghost xs',
                      title: 'Edit Event',
                      onclick: () => openEventEditorModal(ev, () => viewEvents(root))
                    }, svgIcon('edit', 14)),
                    h('button', {
                      class: 'btn danger xs',
                      title: 'Delete Event',
                      onclick: () => {
                        if (confirm(`Are you sure you want to delete "${ev.title}"? This will remove it from the public website.`)) {
                          guard(async () => {
                            await api('/manage/events/' + ev.id, { method: 'DELETE' });
                            toast('Event deleted successfully');
                            viewEvents(root);
                          })();
                        }
                      }
                    }, svgIcon('trash', 14))
                  )
                )
              );
            })
          )
        )
      );
    }

    const toolbar = h('div', { class: 'toolbar-bar' },
      h('div', { class: 'search-input-wrap' },
        h('span', { class: 'search-input-icon' }, svgIcon('search', 16)),
        searchInput
      ),
      h('div', { style: 'display:flex;gap:.8rem;' },
        categorySelect,
        h('button', { class: 'btn solid sm', onclick: () => openEventEditorModal(null, () => viewEvents(root)) }, svgIcon('plus', 14), 'New Event')
      )
    );

    root.replaceChildren(
      h('div', { class: 'admin-topbar' },
        h('div', { class: 'page-heading-group' },
          h('h1', {}, svgIcon('events', 24), `Events Management (${events.length})`),
          h('p', { text: 'Create, edit, publish, and delete events appearing on the public website.' })
        ),
        h('div', { class: 'topbar-actions' },
          h('button', { class: 'btn solid sm', onclick: () => openEventEditorModal(null, () => viewEvents(root)) }, svgIcon('plus', 14), 'Add New Event')
        )
      ),
      toolbar,
      tableWrap
    );

    drawTable();
  }

  /* =========================================================================
     5. EVENT EDITOR MODAL (ADD / EDIT)
     ========================================================================= */
  function openEventEditorModal(eventData = null, onComplete = null) {
    const isEdit = !!eventData;
    const initial = eventData || {
      title: '',
      category: 'WORKSHOP',
      event_date: new Date().toISOString().slice(0, 10),
      event_time: '09:30 AM - 04:30 PM',
      venue: 'SJEC Campus',
      reg_link: '',
      summary: '',
      body: [],
      poster: '',
      gallery: [],
      featured: false,
      published: true
    };

    let galleryList = Array.isArray(initial.gallery) ? [...initial.gallery] : [];
    let posterUrl = initial.poster || '';

    // Form inputs
    const titleInp = h('input', { name: 'title', required: true, value: initial.title || '', placeholder: 'e.g. PROMPT OPS-2K26' });
    const catInp = h('input', { name: 'category', required: true, value: initial.category || 'WORKSHOP', placeholder: 'WORKSHOP / COMPETITION / TALK' });
    const dateInp = h('input', { name: 'event_date', type: 'date', required: true, value: initial.event_date || '' });
    const timeInp = h('input', { name: 'event_time', value: initial.event_time || '', placeholder: 'e.g. 09:30 AM - 04:30 PM' });
    const venueInp = h('input', { name: 'venue', value: initial.venue || '', placeholder: 'e.g. CSE Seminar Hall' });
    const regLinkInp = h('input', { name: 'reg_link', type: 'url', value: initial.reg_link || '', placeholder: 'https://forms.gle/...' });
    const summaryInp = h('textarea', { name: 'summary', rows: 3, required: true, placeholder: 'Brief 1-2 sentence overview for the event card…' }, initial.summary || '');
    const bodyInp = h('textarea', { name: 'body', rows: 6, placeholder: 'Detailed description (blank line between paragraphs)…' }, (initial.body || []).join('\n\n'));

    const featuredCheck = h('input', { type: 'checkbox', class: 'switch-input', checked: !!initial.featured });
    const publishedCheck = h('input', { type: 'checkbox', class: 'switch-input', checked: initial.published !== false });

    // Poster preview
    const posterPreview = h('div', { style: 'margin-top:.6rem;' });
    function renderPosterPreview() {
      if (posterUrl) {
        posterPreview.replaceChildren(
          h('div', { style: 'position:relative;display:inline-block;border:1px solid var(--line);border-radius:4px;overflow:hidden;' },
            h('img', { src: posterUrl, alt: 'Poster', style: 'width:140px;height:140px;object-fit:cover;display:block;' }),
            h('button', {
              class: 'btn danger xs',
              type: 'button',
              style: 'position:absolute;top:4px;right:4px;padding:2px 6px;',
              onclick: () => { posterUrl = ''; renderPosterPreview(); }
            }, '✕')
          )
        );
      } else {
        posterPreview.replaceChildren(h('span', { style: 'font-size:.74rem;color:var(--text-dim);', text: 'No main poster set.' }));
      }
    }
    renderPosterPreview();

    // Gallery Manager
    const galleryContainer = h('div', { class: 'gallery-grid' });
    function renderGallery() {
      if (!galleryList.length) {
        galleryContainer.replaceChildren(h('p', { class: 'empty-state', text: 'No gallery photos added yet. Upload below.' }));
        return;
      }
      galleryContainer.replaceChildren(
        galleryList.map((g, idx) => {
          const capInput = h('input', {
            value: g.caption || '',
            placeholder: 'Caption…',
            oninput: (e) => { g.caption = e.target.value; }
          });

          return h('div', { class: 'gallery-card' },
            h('img', { src: g.src, alt: '', class: 'gallery-card-img' }),
            h('div', { class: 'gallery-card-body' },
              capInput,
              h('button', {
                class: 'btn danger xs',
                type: 'button',
                onclick: () => {
                  galleryList.splice(idx, 1);
                  renderGallery();
                }
              }, svgIcon('trash', 12), 'Remove')
            )
          );
        })
      );
    }
    renderGallery();

    const formContent = h('form', { id: 'admin-event-form' },
      field('Event Title', titleInp),
      h('div', { class: 'grid2' },
        field('Category', catInp),
        field('Event Date', dateInp)
      ),
      h('div', { class: 'grid2' },
        field('Event Time', timeInp),
        field('Venue', venueInp)
      ),
      field('Registration Link (Optional)', regLinkInp, 'External URL for sign-ups'),
      field('Card Short Summary', summaryInp, 'Visible on the main grid card'),
      field('Full Event Description', bodyInp, 'Separated by blank lines'),
      
      // Main Poster Upload
      h('div', { class: 'panel-card', style: 'padding:1rem;margin-bottom:1.2rem;' },
        h('h4', { style: 'font-size:.9rem;color:var(--white);margin-bottom:.4rem;', text: 'Main Poster / Banner' }),
        h('input', {
          type: 'file',
          accept: 'image/jpeg,image/png,image/webp',
          onchange: guard(async (e) => {
            const file = e.target.files[0];
            if (file) {
              toast('Uploading poster…');
              posterUrl = await uploadFile(file);
              renderPosterPreview();
              toast('Poster uploaded successfully');
            }
          })
        }),
        posterPreview
      ),

      // Multiple Gallery Photos Upload
      h('div', { class: 'panel-card', style: 'padding:1rem;margin-bottom:1.2rem;' },
        h('h4', { style: 'font-size:.9rem;color:var(--white);margin-bottom:.4rem;', text: 'Event Photo Gallery' }),
        h('p', { style: 'font-size:.75rem;color:var(--text-dim);margin-bottom:.8rem;', text: 'Upload multiple photos to enable the cyber cycling HUD gallery slider on the card.' }),
        h('input', {
          type: 'file',
          multiple: true,
          accept: 'image/jpeg,image/png,image/webp',
          onchange: guard(async (e) => {
            const files = Array.from(e.target.files);
            if (files.length) {
              toast(`Uploading ${files.length} photos…`);
              for (const f of files) {
                const url = await uploadFile(f);
                galleryList.push({ src: url, caption: '' });
              }
              e.target.value = '';
              renderGallery();
              toast('All gallery photos uploaded');
            }
          })
        }),
        galleryContainer
      ),

      // Toggles
      h('div', { class: 'grid2', style: 'margin-top:1.2rem;' },
        h('label', { class: 'switch-label' },
          featuredCheck,
          h('span', { class: 'switch-slider' }),
          h('span', { text: 'Featured on Homepage' })
        ),
        h('label', { class: 'switch-label' },
          publishedCheck,
          h('span', { class: 'switch-slider' }),
          h('span', { text: 'Published Live on Site' })
        )
      )
    );

    showModal(
      isEdit ? `Edit Event: ${initial.title}` : 'Add New Event',
      formContent,
      async () => {
        const title = titleInp.value.trim();
        const category = catInp.value.trim();
        const event_date = dateInp.value;
        const summary = summaryInp.value.trim();

        if (!title || !category || !event_date || !summary) {
          throw new Error('Please fill all required fields (Title, Category, Date, Summary).');
        }

        const paragraphs = bodyInp.value
          .split(/\n\s*\n/)
          .map((s) => s.trim())
          .filter(Boolean);

        const payload = {
          title,
          category,
          event_date,
          event_time: timeInp.value.trim() || null,
          venue: venueInp.value.trim() || null,
          reg_link: regLinkInp.value.trim() || null,
          summary,
          body: paragraphs,
          poster: posterUrl || null,
          gallery: galleryList.map((g) => ({ src: g.src, caption: g.caption || '' })),
          featured: featuredCheck.checked,
          published: publishedCheck.checked
        };

        if (isEdit) {
          await api(`/manage/events/${initial.id}`, { method: 'PUT', body: payload });
          toast('✓ Event updated successfully');
        } else {
          await api('/manage/events', { method: 'POST', body: payload });
          toast('✓ New event created successfully');
        }

        if (onComplete) onComplete();
      },
      isEdit ? 'Save Event Changes' : 'Create & Publish Event'
    );
  }

  /* =========================================================================
     6. EVENT PREVIEW MODAL
     ========================================================================= */
  function previewEventModal(ev) {
    const gallery = ev.gallery || [];
    const previewBox = h('div', {},
      h('div', { style: 'border:1px solid var(--g);border-radius:10px;padding:1.4rem;background:rgba(0,255,102,0.03);margin-bottom:1.2rem;' },
        h('div', { style: 'display:flex;justify-content:space-between;align-items:center;margin-bottom:.6rem;' },
          h('span', { class: 'badge green', text: ev.category || 'EVENT' }),
          h('span', { style: 'font-size:.8rem;color:var(--g);', text: ev.event_date })
        ),
        h('h2', { style: 'color:var(--white);font-size:1.4rem;margin-bottom:.6rem;', text: ev.title }),
        h('p', { style: 'color:var(--text);font-size:.9rem;line-height:1.6;margin-bottom:1rem;', text: ev.summary }),
        h('div', { style: 'font-size:.8rem;color:var(--text-dim);', text: `📍 Venue: ${ev.venue || 'SJEC Campus'} · ⏰ ${ev.event_time || 'Schedule announced'}` })
      ),
      gallery.length ? h('div', {},
        h('h4', { style: 'color:var(--white);margin-bottom:.6rem;', text: `Gallery Photos (${gallery.length})` }),
        h('div', { style: 'display:grid;grid-template-columns:repeat(auto-fill, minmax(140px, 1fr));gap:.6rem;' },
          gallery.map((g) => h('div', {},
            h('img', { src: g.src, alt: '', style: 'width:100%;aspect-ratio:4/3;object-fit:cover;border:1px solid var(--line);border-radius:4px;display:block;' }),
            g.caption ? h('p', { style: 'font-size:.7rem;color:var(--text-dim);margin-top:2px;', text: g.caption }) : null
          ))
        )
      ) : null
    );

    showModal(`Live Preview: ${ev.title}`, previewBox, null);
  }

  /* =========================================================================
     7. VIEW: REGISTRATIONS MANAGEMENT
     ========================================================================= */
  async function viewRegistrations(root) {
    root.replaceChildren(
      h('div', { class: 'admin-topbar' },
        h('div', { class: 'page-heading-group' },
          h('h1', {}, svgIcon('registrations', 24), 'Registration Management'),
          h('p', { text: 'Review join requests, filter participant interest, manage moderation statuses, and export data.' })
        ),
        h('div', { class: 'topbar-actions' },
          h('button', { class: 'btn solid sm', onclick: () => openAddRegistrationModal(() => viewRegistrations(root)) }, svgIcon('plus', 14), 'Add Registration')
        )
      ),
      h('p', { class: 'empty-state', text: 'Loading applications…' })
    );

    const rows = await api('/manage/join-requests');
    const statuses = ['new', 'contacted', 'accepted', 'rejected'];

    let statusFilter = '';
    let searchQuery = '';

    const searchInput = h('input', {
      placeholder: 'Search by name, email, USN, interest…',
      oninput: (e) => { searchQuery = e.target.value.toLowerCase(); drawTable(); }
    });

    const statusSelect = h('select', {
      onchange: (e) => { statusFilter = e.target.value; drawTable(); }
    },
      h('option', { value: '', text: 'All Statuses' }),
      statuses.map((s) => h('option', { value: s, text: s.toUpperCase() }))
    );

    const exportBtn = h('button', {
      class: 'btn sm',
      onclick: guard(async () => {
        const res = await api('/manage/join-requests.csv', { raw: true });
        const a = h('a', { href: URL.createObjectURL(await res.blob()), download: 'cipher-registrations.csv' });
        document.body.append(a); a.click(); a.remove();
        toast('CSV Export downloaded');
      })
    }, svgIcon('download', 14), 'Export CSV');

    const tableWrap = h('div', { class: 'table-container' });

    function drawTable() {
      const filtered = rows.filter((r) => {
        const matchStatus = !statusFilter || r.status === statusFilter;
        const matchSearch = !searchQuery ||
          (r.name || '').toLowerCase().includes(searchQuery) ||
          (r.email || '').toLowerCase().includes(searchQuery) ||
          (r.usn || '').toLowerCase().includes(searchQuery) ||
          (r.interest || '').toLowerCase().includes(searchQuery);
        return matchStatus && matchSearch;
      });

      if (!filtered.length) {
        tableWrap.replaceChildren(h('div', { class: 'empty-state', text: 'No registrations matching filter.' }));
        return;
      }

      tableWrap.replaceChildren(
        h('table', {},
          h('thead', {},
            h('tr', {},
              h('th', { text: 'Date' }),
              h('th', { text: 'Applicant' }),
              h('th', { text: 'USN / Year' }),
              h('th', { text: 'Focus Area' }),
              h('th', { text: 'Status' }),
              h('th', { text: 'Actions', style: 'text-align:right;' })
            )
          ),
          h('tbody', {},
            filtered.map((r) => {
              const statusColor = r.status === 'accepted' ? 'green' : (r.status === 'rejected' ? 'red' : (r.status === 'contacted' ? 'blue' : 'amber'));

              return h('tr', {},
                h('td', { style: 'font-size:.78rem;color:var(--text-dim);', text: r.created_at.slice(0, 10) }),
                h('td', {},
                  h('div', { style: 'font-weight:600;color:var(--white);', text: r.name }),
                  h('a', { href: `mailto:${r.email}`, style: 'font-size:.76rem;', text: r.email })
                ),
                h('td', {},
                  h('div', { text: r.usn || '—' }),
                  h('div', { style: 'font-size:.72rem;color:var(--text-dim);', text: r.year ? `Year ${r.year}` : '' })
                ),
                h('td', {},
                  h('span', { class: 'badge dim', text: r.interest || 'General' })
                ),
                h('td', {},
                  h('select', {
                    style: 'padding:.3rem .5rem;font-size:.76rem;margin:0;',
                    onchange: guard(async (e) => {
                      const newStatus = e.target.value;
                      await api(`/manage/join-requests/${r.id}`, { method: 'PATCH', body: { status: newStatus } });
                      r.status = newStatus;
                      toast(`Registration status updated to ${newStatus}`);
                    })
                  }, statuses.map((s) => h('option', { value: s, text: s.toUpperCase(), selected: s === r.status })))
                ),
                h('td', { style: 'text-align:right;' },
                  h('div', { style: 'display:inline-flex;gap:.4rem;' },
                    h('button', {
                      class: 'btn ghost xs',
                      title: 'View Details',
                      onclick: () => viewApplicantDetailsModal(r)
                    }, svgIcon('eye', 14)),
                    h('button', {
                      class: 'btn danger xs',
                      title: 'Delete Application',
                      onclick: () => {
                        if (confirm(`Delete registration for "${r.name}"?`)) {
                          guard(async () => {
                            await api(`/manage/join-requests/${r.id}`, { method: 'DELETE' });
                            const idx = rows.findIndex((item) => item.id === r.id);
                            if (idx >= 0) rows.splice(idx, 1);
                            toast('Registration deleted');
                            drawTable();
                          })();
                        }
                      }
                    }, svgIcon('trash', 14))
                  )
                )
              );
            })
          )
        )
      );
    }

    const toolbar = h('div', { class: 'toolbar-bar' },
      h('div', { class: 'search-input-wrap' },
        h('span', { class: 'search-input-icon' }, svgIcon('search', 16)),
        searchInput
      ),
      h('div', { style: 'display:flex;gap:.8rem;' },
        statusSelect,
        exportBtn,
        h('button', { class: 'btn solid sm', onclick: () => openAddRegistrationModal(() => viewRegistrations(root)) }, svgIcon('plus', 14), 'Manual Add')
      )
    );

    root.replaceChildren(
      h('div', { class: 'admin-topbar' },
        h('div', { class: 'page-heading-group' },
          h('h1', {}, svgIcon('registrations', 24), `Registrations (${rows.length})`),
          h('p', { text: 'Review join requests, filter participant interest, manage moderation statuses, and export data.' })
        ),
        h('div', { class: 'topbar-actions' },
          exportBtn
        )
      ),
      toolbar,
      tableWrap
    );

    drawTable();
  }

  function viewApplicantDetailsModal(r) {
    const details = h('div', {},
      h('div', { class: 'grid2', style: 'margin-bottom:1rem;' },
        field('Full Name', h('input', { readonly: true, value: r.name })),
        field('Email Address', h('input', { readonly: true, value: r.email }))
      ),
      h('div', { class: 'grid3', style: 'margin-bottom:1rem;' },
        field('USN', h('input', { readonly: true, value: r.usn || 'N/A' })),
        field('College Year', h('input', { readonly: true, value: r.year ? `Year ${r.year}` : 'N/A' })),
        field('Focus Track', h('input', { readonly: true, value: r.interest || 'General' }))
      ),
      field('Applicant Statement / Message', h('textarea', { readonly: true, rows: 4 }, r.message || 'No statement provided.'))
    );

    showModal(`Applicant Details: ${r.name}`, details, null);
  }

  function openAddRegistrationModal(onComplete) {
    const nameInp = h('input', { required: true, placeholder: 'e.g. John Doe' });
    const emailInp = h('input', { type: 'email', required: true, placeholder: 'name@sjec.ac.in' });
    const usnInp = h('input', { placeholder: '4SO22CS000' });
    const yearInp = h('select', {},
      h('option', { value: '1', text: '1st Year' }),
      h('option', { value: '2', text: '2nd Year', selected: true }),
      h('option', { value: '3', text: '3rd Year' }),
      h('option', { value: '4', text: '4th Year' })
    );
    const interestInp = h('input', { placeholder: 'AI & ML / Web / Cyber / Open Source' });
    const msgInp = h('textarea', { rows: 3, placeholder: 'Optional notes…' });

    const formBox = h('form', {},
      h('div', { class: 'grid2' },
        field('Full Name', nameInp),
        field('Email', emailInp)
      ),
      h('div', { class: 'grid3' },
        field('USN', usnInp),
        field('Year', yearInp),
        field('Interest', interestInp)
      ),
      field('Message / Notes', msgInp)
    );

    showModal('Add Manual Registration', formBox, async () => {
      const name = nameInp.value.trim();
      const email = emailInp.value.trim();
      if (!name || !email) throw new Error('Name and email are required.');

      await api('/join', {
        method: 'POST',
        body: {
          name,
          email,
          usn: usnInp.value.trim() || undefined,
          year: parseInt(yearInp.value, 10),
          interest: interestInp.value.trim() || undefined,
          message: msgInp.value.trim() || undefined
        }
      });

      toast('✓ Registration created successfully');
      if (onComplete) onComplete();
    }, 'Create Registration');
  }

  /* =========================================================================
     8. VIEW: MEMBERS / LEADERSHIP MANAGEMENT
     ========================================================================= */
  async function viewMembers(root) {
    root.replaceChildren(
      h('div', { class: 'admin-topbar' },
        h('div', { class: 'page-heading-group' },
          h('h1', {}, svgIcon('members', 24), 'Members & Leadership'),
          h('p', { text: 'Manage club officers, coordinators, faculty advisors, and executive team.' })
        ),
        h('div', { class: 'topbar-actions' },
          h('button', { class: 'btn solid sm', onclick: () => openMemberEditorModal(null, () => viewMembers(root)) }, svgIcon('plus', 14), 'Add Member')
        )
      ),
      h('p', { class: 'empty-state', text: 'Loading leadership roster…' })
    );

    const members = await api('/manage/leadership');

    const tableWrap = h('div', { class: 'table-container' });

    tableWrap.replaceChildren(
      h('table', {},
        h('thead', {},
          h('tr', {},
            h('th', { text: 'Photo' }),
            h('th', { text: 'Member Name' }),
            h('th', { text: 'Role / Designation' }),
            h('th', { text: 'Social Links' }),
            h('th', { text: 'Display Order' }),
            h('th', { text: 'Actions', style: 'text-align:right;' })
          )
        ),
        h('tbody', {},
          members.map((m) => h('tr', {},
            h('td', {},
              m.image
                ? h('img', { src: m.image, alt: m.name, style: 'width:42px;height:42px;border-radius:50%;object-fit:cover;border:1px solid var(--line);' })
                : h('div', { style: 'width:42px;height:42px;border-radius:50%;background:rgba(0,255,102,0.1);border:1px solid var(--line);display:grid;place-items:center;font-size:.75rem;color:var(--g);' }, m.name.slice(0, 2).toUpperCase())
            ),
            h('td', { style: 'font-weight:600;color:var(--white);' },
              m.name,
              (m.active === 0 || m.active === false) ? h('span', { class: 'badge', style: 'margin-left:.4rem;background:rgba(255,80,80,0.12);color:#ff8080;', text: 'Hidden' }) : null
            ),
            h('td', {}, h('span', { class: 'badge green', text: m.role })),
            h('td', {},
              h('div', { style: 'display:flex;gap:.5rem;flex-wrap:wrap;' },
                m.github ? h('a', { href: m.github, target: '_blank', text: 'GitHub ↗' }) : null,
                m.linkedin ? h('a', { href: m.linkedin, target: '_blank', text: 'LinkedIn ↗' }) : null,
                m.instagram ? h('a', { href: m.instagram, target: '_blank', text: 'Instagram ↗' }) : null
              )
            ),
            h('td', { text: String(m.sort_order ?? 0) }),
            h('td', { style: 'text-align:right;' },
              h('div', { style: 'display:inline-flex;gap:.4rem;' },
                h('button', {
                  class: 'btn ghost xs',
                  onclick: () => openMemberEditorModal(m, () => viewMembers(root))
                }, svgIcon('edit', 14)),
                h('button', {
                  class: 'btn danger xs',
                  onclick: () => {
                    if (confirm(`Remove member "${m.name}"?`)) {
                      guard(async () => {
                        await api('/manage/leadership/' + m.id, { method: 'DELETE' });
                        toast('Member removed');
                        viewMembers(root);
                      })();
                    }
                  }
                }, svgIcon('trash', 14))
              )
            )
          ))
        )
      )
    );

    root.replaceChildren(
      h('div', { class: 'admin-topbar' },
        h('div', { class: 'page-heading-group' },
          h('h1', {}, svgIcon('members', 24), `Members & Leadership (${members.length})`),
          h('p', { text: 'Manage club officers, coordinators, faculty advisors, and executive team.' })
        ),
        h('div', { class: 'topbar-actions' },
          h('button', { class: 'btn solid sm', onclick: () => openMemberEditorModal(null, () => viewMembers(root)) }, svgIcon('plus', 14), 'Add Member')
        )
      ),
      tableWrap
    );
  }

  function openMemberEditorModal(member = null, onComplete) {
    const isEdit = !!member;
    const initial = member || { name: '', role: '', image: '', github: '', linkedin: '', instagram: '', email: '', active: true, sort_order: 0 };
    let photoUrl = initial.image || '';

    const nameInp = h('input', { required: true, value: initial.name || '', placeholder: 'Full Name' });
    const roleInp = h('input', { required: true, value: initial.role || '', placeholder: 'e.g. President / Vice President' });
    const ghInp = h('input', { type: 'url', value: initial.github || '', placeholder: 'https://github.com/...' });
    const liInp = h('input', { type: 'url', value: initial.linkedin || '', placeholder: 'https://linkedin.com/in/...' });
    const igInp = h('input', { type: 'url', value: initial.instagram || '', placeholder: 'https://instagram.com/...' });
    const emailInp = h('input', { type: 'email', value: initial.email || '', placeholder: 'name@sjec.ac.in' });
    const orderInp = h('input', { type: 'number', value: String(initial.sort_order ?? 0) });
    const activeInp = h('input', { type: 'checkbox', checked: initial.active !== false && initial.active !== 0, style: 'width:auto;margin:0;accent-color:var(--g);' });

    const photoPreview = h('div', { style: 'margin-top:.6rem;' });
    function renderPhoto() {
      if (photoUrl) {
        photoPreview.replaceChildren(
          h('img', { src: photoUrl, alt: '', style: 'width:80px;height:80px;border-radius:50%;object-fit:cover;border:1px solid var(--g);' })
        );
      } else {
        photoPreview.replaceChildren(h('span', { style: 'font-size:.74rem;color:var(--text-dim);', text: 'No photo uploaded.' }));
      }
    }
    renderPhoto();

    const formBox = h('form', {},
      h('div', { class: 'grid2' },
        field('Name', nameInp),
        field('Role', roleInp)
      ),
      h('div', { class: 'grid2' },
        field('GitHub Profile', ghInp),
        field('LinkedIn Profile', liInp)
      ),
      h('div', { class: 'grid2' },
        field('Instagram Profile', igInp),
        field('Email', emailInp)
      ),
      h('div', { class: 'grid2' },
        field('Display Order (Lower = First)', orderInp),
        h('label', { style: 'display:flex;align-items:center;gap:.5rem;margin-top:1.6rem;' }, activeInp, h('span', { text: 'Visible on public site' }))
      ),
      h('div', { style: 'margin-top:1rem;' },
        h('label', {}, 'Member Photo (Portrait works best)',
          h('input', {
            type: 'file',
            accept: 'image/jpeg,image/png,image/webp',
            onchange: guard(async (e) => {
              const file = e.target.files[0];
              if (file) {
                toast('Uploading photo…');
                photoUrl = await uploadFile(file);
                renderPhoto();
                toast('Photo uploaded successfully');
              }
            })
          })
        ),
        photoPreview
      )
    );

    showModal(isEdit ? `Edit Member: ${initial.name}` : 'Add New Member', formBox, async () => {
      const name = nameInp.value.trim();
      const role = roleInp.value.trim();
      if (!name || !role) throw new Error('Name and Role are required.');

      const payload = {
        name,
        role,
        image: photoUrl || null,
        github: ghInp.value.trim() || null,
        linkedin: liInp.value.trim() || null,
        instagram: igInp.value.trim() || null,
        email: emailInp.value.trim() || null,
        active: activeInp.checked,
        sort_order: parseInt(orderInp.value, 10) || 0
      };

      if (isEdit) {
        await api(`/manage/leadership/${initial.id}`, { method: 'PUT', body: payload });
        toast('Member updated');
      } else {
        await api('/manage/leadership', { method: 'POST', body: payload });
        toast('Member added');
      }

      if (onComplete) onComplete();
    }, isEdit ? 'Save Changes' : 'Add Member');
  }

  /* =========================================================================
     9. VIEW: CONTENT MANAGEMENT
     ========================================================================= */
  async function viewContent(root) {
    root.replaceChildren(
      h('div', { class: 'admin-topbar' },
        h('div', { class: 'page-heading-group' },
          h('h1', {}, svgIcon('content', 24), 'Website Content Management'),
          h('p', { text: 'Manage copy, about section text, announcements, hero subheadings, and contact details.' })
        )
      ),
      h('p', { class: 'empty-state', text: 'Loading content settings…' })
    );

    const content = await api('/content');

    const heroSubInp = h('input', { value: content.hero_subtitle || '' });
    const aboutTitleInp = h('input', { value: content.about_title || 'What is CIPHER?' });
    const aboutTextInp = h('textarea', { rows: 5 }, content.about_text || '');
    const announceToggle = h('input', { type: 'checkbox', class: 'switch-input', checked: content.announcement_active === '1' || content.announcement_active === 1 || content.announcement_active === true });
    const announceTextInp = h('input', { value: content.announcement_text || '', placeholder: 'Important banner alert message…' });
    const contactEmailInp = h('input', { type: 'email', value: content.contact_email || 'cipher@sjec.ac.in' });
    const venueInp = h('input', { value: content.contact_location || 'St Joseph Engineering College, Vamanjoor, Mangaluru' });

    const saveBtn = h('button', {
      class: 'btn solid',
      type: 'submit'
    }, 'Save Website Content');

    const form = h('form', {
      onsubmit: guard(async (e) => {
        e.preventDefault();
        saveBtn.disabled = true;

        const payload = {
          hero_subtitle: heroSubInp.value.trim(),
          about_title: aboutTitleInp.value.trim(),
          about_text: aboutTextInp.value.trim(),
          announcement_active: announceToggle.checked ? '1' : '0',
          announcement_text: announceTextInp.value.trim(),
          contact_email: contactEmailInp.value.trim(),
          contact_location: venueInp.value.trim()
        };

        await api('/manage/content', { method: 'PUT', body: payload });
        toast('✓ Website content updated successfully');
        saveBtn.disabled = false;
      })
    },
      h('div', { class: 'panel-card' },
        h('h3', { class: 'panel-card-title', style: 'margin-bottom:1.2rem;', text: 'Homepage Hero & Tagline' }),
        field('Hero Subtitle / Tagline', heroSubInp, 'Displayed prominently beneath the CIPHER title')
      ),
      h('div', { class: 'panel-card' },
        h('h3', { class: 'panel-card-title', style: 'margin-bottom:1.2rem;', text: 'About CIPHER Section' }),
        field('Section Headline', aboutTitleInp),
        field('About Description Text', aboutTextInp, 'Describes the vision, mission, and legacy of CIPHER')
      ),
      h('div', { class: 'panel-card' },
        h('h3', { class: 'panel-card-title', style: 'margin-bottom:1.2rem;', text: 'Announcement Broadcast Banner' }),
        h('label', { class: 'switch-label' },
          announceToggle,
          h('span', { class: 'switch-slider' }),
          h('span', { text: 'Enable Top Announcement Banner' })
        ),
        field('Announcement Message', announceTextInp)
      ),
      h('div', { class: 'panel-card' },
        h('h3', { class: 'panel-card-title', style: 'margin-bottom:1.2rem;', text: 'Contact & Campus Address' }),
        h('div', { class: 'grid2' },
          field('Official Contact Email', contactEmailInp),
          field('Campus Location', venueInp)
        )
      ),
      saveBtn
    );

    root.replaceChildren(
      h('div', { class: 'admin-topbar' },
        h('div', { class: 'page-heading-group' },
          h('h1', {}, svgIcon('content', 24), 'Website Content Management'),
          h('p', { text: 'Manage copy, about section text, announcements, hero subheadings, and contact details.' })
        )
      ),
      form
    );
  }

  /* =========================================================================
     9b. VIEW: ADMIN & ROLE MANAGEMENT (SUPER_ADMIN only)
     ========================================================================= */
  const ROLE_OPTIONS = ['SUPER_ADMIN', 'EVENT_MANAGER', 'CONTENT_MANAGER'];

  async function viewAdmins(root) {
    root.replaceChildren(
      h('div', { class: 'admin-topbar' },
        h('div', { class: 'page-heading-group' },
          h('h1', {}, svgIcon('settings', 24), 'Admin & Role Management'),
          h('p', { text: 'Create administrator accounts, assign roles, and deactivate access.' })
        ),
        h('div', { class: 'topbar-actions' },
          h('button', { class: 'btn solid sm', onclick: () => openAdminEditorModal(() => viewAdmins(root)) }, svgIcon('plus', 14), 'Add Admin')
        )
      ),
      h('p', { class: 'empty-state', text: 'Loading admin accounts…' })
    );

    const admins = await api('/manage/admins');

    const table = h('div', { class: 'table-container' },
      h('table', {},
        h('thead', {},
          h('tr', {},
            h('th', { text: 'Username' }),
            h('th', { text: 'Name' }),
            h('th', { text: 'Role' }),
            h('th', { text: 'Status' }),
            h('th', { text: 'Last Login' }),
            h('th', { text: 'Actions', style: 'text-align:right;' })
          )
        ),
        h('tbody', {},
          admins.map((a) => h('tr', {},
            h('td', { style: 'font-weight:600;color:var(--white);', text: a.username }),
            h('td', { text: a.name || '—' }),
            h('td', {}, h('span', { class: 'badge green', text: ROLE_LABELS[a.role] || a.role })),
            h('td', {}, h('span', {
              class: 'badge',
              style: a.status === 'active' ? 'background:rgba(0,255,102,0.12);color:var(--g);' : 'background:rgba(255,80,80,0.12);color:#ff8080;',
              text: a.status === 'active' ? 'Active' : 'Inactive'
            })),
            h('td', { style: 'font-size:.78rem;color:var(--text-dim);', text: a.last_login ? new Date(a.last_login).toLocaleString() : 'Never' }),
            h('td', { style: 'text-align:right;' },
              h('div', { style: 'display:inline-flex;gap:.4rem;' },
                h('button', { class: 'btn ghost xs', onclick: () => openAdminEditorModal(() => viewAdmins(root), a) }, svgIcon('edit', 14)),
                h('button', {
                  class: 'btn ghost xs',
                  onclick: guard(async () => {
                    const pass = prompt(`New password for "${a.username}" (min 10 characters):`);
                    if (!pass) return;
                    await api(`/manage/admins/${a.id}/reset-password`, { method: 'POST', body: { password: pass } });
                    toast('Password reset');
                  })
                }, 'Reset PW'),
                a.username === currentUser
                  ? null
                  : h('button', {
                      class: a.status === 'active' ? 'btn danger xs' : 'btn ghost xs',
                      onclick: guard(async () => {
                        const nextStatus = a.status === 'active' ? 'inactive' : 'active';
                        if (!confirm(`${nextStatus === 'inactive' ? 'Deactivate' : 'Reactivate'} "${a.username}"?`)) return;
                        await api(`/manage/admins/${a.id}`, { method: 'PUT', body: { status: nextStatus } });
                        toast(`Admin ${nextStatus === 'inactive' ? 'deactivated' : 'reactivated'}`);
                        viewAdmins(root);
                      })
                    }, a.status === 'active' ? 'Deactivate' : 'Reactivate')
              )
            )
          ))
        )
      )
    );

    root.replaceChildren(
      h('div', { class: 'admin-topbar' },
        h('div', { class: 'page-heading-group' },
          h('h1', {}, svgIcon('settings', 24), `Admin & Role Management (${admins.length})`),
          h('p', { text: 'Create administrator accounts, assign roles, and deactivate access.' })
        ),
        h('div', { class: 'topbar-actions' },
          h('button', { class: 'btn solid sm', onclick: () => openAdminEditorModal(() => viewAdmins(root)) }, svgIcon('plus', 14), 'Add Admin')
        )
      ),
      admins.length ? table : h('p', { class: 'empty-state', text: 'No admin accounts yet.' })
    );
  }

  function openAdminEditorModal(onComplete, existing = null) {
    const isEdit = !!existing;
    const userInp = h('input', { required: !isEdit, disabled: isEdit, value: existing?.username || '', placeholder: 'username (letters, numbers, . _ -)' });
    const passInp = h('input', { type: 'password', required: !isEdit, placeholder: isEdit ? 'Leave blank to keep current password' : 'Min 10 characters' });
    const nameInp = h('input', { value: existing?.name || '', placeholder: 'Full name' });
    const emailInp = h('input', { type: 'email', value: existing?.email || '', placeholder: 'name@sjec.ac.in' });
    const roleSelect = h('select', {},
      ...ROLE_OPTIONS.map((r) => h('option', { value: r, selected: (existing?.role || 'CONTENT_MANAGER') === r }, ROLE_LABELS[r]))
    );

    const formBox = h('form', {},
      h('div', { class: 'grid2' },
        field('Username', userInp),
        field(isEdit ? 'New Password (optional)' : 'Password', passInp)
      ),
      h('div', { class: 'grid2' },
        field('Name', nameInp),
        field('Email', emailInp)
      ),
      field('Role', roleSelect)
    );

    showModal(isEdit ? `Edit Admin: ${existing.username}` : 'Add New Admin', formBox, async () => {
      const role = roleSelect.value;
      if (isEdit) {
        await api(`/manage/admins/${existing.id}`, {
          method: 'PUT',
          body: { name: nameInp.value.trim() || null, email: emailInp.value.trim() || null, role }
        });
        if (passInp.value) {
          await api(`/manage/admins/${existing.id}/reset-password`, { method: 'POST', body: { password: passInp.value } });
        }
        toast('Admin updated');
      } else {
        const username = userInp.value.trim();
        if (!username) throw new Error('Username is required.');
        if (!passInp.value || passInp.value.length < 10) throw new Error('Password must be at least 10 characters.');
        await api('/manage/admins', {
          method: 'POST',
          body: { username, password: passInp.value, name: nameInp.value.trim() || null, email: emailInp.value.trim() || null, role }
        });
        toast('Admin created');
      }
      if (onComplete) onComplete();
    }, isEdit ? 'Save Changes' : 'Create Admin');
  }

  /* =========================================================================
     10. VIEW: SETTINGS & AUDIT LOGS
     ========================================================================= */
  async function viewSettings(root) {
    root.replaceChildren(
      h('div', { class: 'admin-topbar' },
        h('div', { class: 'page-heading-group' },
          h('h1', {}, svgIcon('settings', 24), 'System Settings & Audit Log'),
          h('p', { text: 'Admin security, access controls, credentials management, and historical audit trail.' })
        )
      ),
      h('p', { class: 'empty-state', text: 'Loading system diagnostics…' })
    );

    const logs = currentRole === 'SUPER_ADMIN' ? await api('/manage/activity-log?limit=50') : [];

    // Password change card
    const oldPassInp = h('input', { type: 'password', required: true, placeholder: 'Enter current password' });
    const newPassInp = h('input', { type: 'password', required: true, placeholder: 'Enter new password (min 6 characters)' });
    const confirmPassInp = h('input', { type: 'password', required: true, placeholder: 'Confirm new password' });
    const passStatus = h('div', { class: 'login-status-box' });

    const passForm = h('form', {
      class: 'panel-card',
      onsubmit: guard(async (e) => {
        e.preventDefault();
        passStatus.className = 'login-status-box';

        if (newPassInp.value !== confirmPassInp.value) {
          passStatus.className = 'login-status-box err';
          passStatus.textContent = 'New passwords do not match.';
          return;
        }

        if (newPassInp.value.length < 6) {
          passStatus.className = 'login-status-box err';
          passStatus.textContent = 'Password must be at least 6 characters long.';
          return;
        }

        await api('/manage/change-password', {
          method: 'POST',
          body: { current_password: oldPassInp.value, new_password: newPassInp.value }
        });

        passStatus.className = 'login-status-box ok';
        passStatus.textContent = '✓ Password updated successfully.';
        oldPassInp.value = '';
        newPassInp.value = '';
        confirmPassInp.value = '';
        toast('Password changed successfully');
      })
    },
      h('h3', { class: 'panel-card-title', style: 'margin-bottom:1rem;', text: 'Change Admin Password' }),
      field('Current Password', oldPassInp),
      h('div', { class: 'grid2' },
        field('New Password', newPassInp),
        field('Confirm New Password', confirmPassInp)
      ),
      passStatus,
      h('button', { class: 'btn solid sm', type: 'submit' }, 'Update Password')
    );

    // Activity Log Table
    const logTable = h('div', { class: 'table-container' },
      h('table', {},
        h('thead', {},
          h('tr', {},
            h('th', { text: 'Timestamp' }),
            h('th', { text: 'Action Type' }),
            h('th', { text: 'Description' }),
            h('th', { text: 'Actor' })
          )
        ),
        h('tbody', {},
          logs.map((log) => h('tr', {},
            h('td', { style: 'font-size:.76rem;color:var(--text-dim);', text: new Date(log.created_at).toLocaleString() }),
            h('td', {}, h('span', { class: 'badge green', text: log.action_type })),
            h('td', { style: 'color:var(--white);', text: log.details || '—' }),
            h('td', { style: 'font-size:.78rem;color:var(--g-dim);', text: log.username || 'System' })
          ))
        )
      )
    );

    const logPanel = currentRole === 'SUPER_ADMIN' ? h('div', { class: 'panel-card' },
      h('div', { class: 'panel-card-header' },
        h('h3', { class: 'panel-card-title', text: 'Full Audit Activity Log' })
      ),
      logs.length ? logTable : h('p', { class: 'empty-state', text: 'No logs recorded yet.' })
    ) : null;

    root.replaceChildren(
      h('div', { class: 'admin-topbar' },
        h('div', { class: 'page-heading-group' },
          h('h1', {}, svgIcon('settings', 24), 'Settings'),
          h('p', { text: 'Your profile, password, and (for Super Admins) the full audit log.' })
        )
      ),
      passForm,
      logPanel
    );
  }

  /* =========================================================================
     ACTIVITIES MANAGEMENT
     ========================================================================= */
  async function viewActivities(root) {
    const data = await api('/manage/activities');

    const renderRow = (a) => {
      const editBtn = h('button', {
        class: 'btn ghost xs',
        title: 'Edit',
        onclick: () => openActivityEditorModal(a, () => renderShell('Activities'))
      }, svgIcon('edit', 14));

      const delBtn = h('button', {
        class: 'btn ghost xs error',
        title: 'Delete',
        html: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>`,
        onclick: guard(async () => {
          if (!confirm(`Delete activity "${a.title}"?`)) return;
          await api(`/manage/activities/${a.id}`, { method: 'DELETE' });
          toast('Activity deleted');
          renderShell('Activities');
        })
      });

      return h('tr', {},
        h('td', { class: 'text-mono', style: 'color:var(--g-dim);', text: String(a.id).padStart(3, '0') }),
        h('td', { style: 'font-weight:500;color:var(--white);', text: a.title }),
        h('td', {}, h('span', { class: 'badge green', text: a.category || 'EVENTS' })),
        h('td', { style: 'max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;' }, 
          a.url ? h('a', { href: a.url, target: '_blank', style: 'color:var(--g);' }, a.url) : h('span', {style: 'color:var(--g-dim)'}, '—')
        ),
        h('td', { class: 'text-mono text-center', text: String(a.sort_order) }),
        h('td', { class: 'actions-cell right' }, editBtn, delBtn)
      );
    };

    const table = h('div', { class: 'table-container' },
      h('table', {},
        h('thead', {},
          h('tr', {},
            h('th', { style: 'width:60px;' }, '#'),
            h('th', { text: 'Title' }),
            h('th', { text: 'Category' }),
            h('th', { text: 'URL' }),
            h('th', { style: 'width:80px;text-align:center;', text: 'Sort' }),
            h('th', { style: 'width:120px;text-align:right;', text: 'Actions' })
          )
        ),
        h('tbody', {}, ...data.map(renderRow))
      )
    );

    root.replaceChildren(
      h('div', { class: 'admin-topbar' },
        h('div', { class: 'page-heading-group' },
          h('h1', {}, svgIcon('content', 24), 'Activities'),
          h('p', { text: 'Manage the CSE campus activities.' })
        ),
        h('div', { class: 'topbar-actions' },
          h('button', {
            class: 'btn solid',
            html: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> Add Activity',
            onclick: () => openActivityEditorModal(null, () => renderShell('Activities'))
          })
        )
      ),
      data.length ? table : h('div', { class: 'empty-state panel-card' }, 'No activities found. Add one above.')
    );
  }

  function openActivityEditorModal(activity, onComplete) {
    const isEdit = !!activity;
    const titleInp = h('input', { type: 'text', required: true, value: activity ? activity.title : '', placeholder: 'Activity title' });
    const catSel = h('select', {},
      ...['ASSOCIATIONS', 'AI & TECH HUBS', 'EVENTS', 'OUTREACH'].map(c =>
        h('option', { value: c, selected: (activity && activity.category === c) ? true : false }, c)
      )
    );
    const urlInp = h('input', { type: 'url', value: activity && activity.url ? activity.url : '', placeholder: 'https://sjec.ac.in/...' });
    const sortOrderInp = h('input', { type: 'number', value: String(activity ? activity.sort_order : 0) });

    const formBox = h('form', {},
      h('div', { class: 'grid2' },
        field('Title', titleInp),
        field('Category', catSel)
      ),
      field('Destination URL', urlInp),
      field('Sort Order (lower = first)', sortOrderInp)
    );

    showModal(isEdit ? `Edit Activity: ${activity.title}` : 'Add New Activity', formBox, async () => {
      const title = titleInp.value.trim();
      if (!title) throw new Error('Title is required.');

      const payload = {
        title,
        category: catSel.value,
        url: urlInp.value.trim() || null,
        sort_order: parseInt(sortOrderInp.value, 10) || 0
      };

      if (isEdit) {
        await api(`/manage/activities/${activity.id}`, { method: 'PUT', body: payload });
        toast('Activity updated');
      } else {
        await api('/manage/activities', { method: 'POST', body: payload });
        toast('Activity created');
      }

      if (onComplete) onComplete();
    }, isEdit ? 'Save Changes' : 'Create Activity');
  }

  /* ---------------- Boot ---------------- */
  token ? renderShell('Dashboard') : renderLogin();
})();
