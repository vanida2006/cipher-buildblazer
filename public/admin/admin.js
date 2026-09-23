(() => {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const app = $('#app');

  const TOKEN_KEY = 'cipher-admin-token';
  const USER_KEY = 'cipher-admin-user';

  let token = null;
  let currentUser = 'sneha';
  try {
    token = sessionStorage.getItem(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY);
    currentUser = sessionStorage.getItem(USER_KEY) || localStorage.getItem(USER_KEY) || 'sneha';
  } catch {}

  /* ---------------- DOM Construction Helper ---------------- */
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

  /* ---------------- Clean Cyber SVG Icons ---------------- */
  function svgIcon(name, size = 18) {
    const icons = {
      dashboard: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>`,
      events: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/><path d="m9 16 2 2 4-4"/></svg>`,
      calendar: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>`,
      registrations: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
      content: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/><line x1="10" x2="8" y1="9" y2="9"/></svg>`,
      settings: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`,
      clock: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
      fileText: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/></svg>`,
      plus: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`,
      plusCalendar: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/><line x1="12" x2="12" y1="14" y2="18"/><line x1="10" x2="14" y1="16" y2="16"/></svg>`,
      logout: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>`,
      search: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`,
      trash: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>`,
      eye: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>`,
      edit: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>`,
      download: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`,
      external: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>`
    };
    const wrap = document.createElement('span');
    wrap.style.display = 'inline-flex';
    wrap.style.alignItems = 'center';
    wrap.innerHTML = icons[name] || '';
    return wrap;
  }

  /* ---------------- Toast Notification ---------------- */
  let toastTimer;
  function toast(msg, bad = false) {
    const t = $('#toast');
    if (!t) return;
    t.textContent = msg;
    t.className = 'toast show' + (bad ? ' bad' : '');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { t.className = 'toast'; }, 2600);
  }

  /* ---------------- Safe API Fetch Helper ---------------- */
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
    currentUser = 'sneha';
    try {
      sessionStorage.removeItem(TOKEN_KEY);
      sessionStorage.removeItem(USER_KEY);
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    } catch {}
    renderLogin();
  }

  /* ---------------- Image / File Upload ---------------- */
  async function uploadFile(file) {
    const fd = new FormData();
    fd.append('file', file);
    const res = await api('/admin/upload', { method: 'POST', form: fd });
    return res.url;
  }

  /* ---------------- Relative Time Formatter ---------------- */
  function timeAgo(dateString) {
    if (!dateString) return 'recently';
    const now = new Date();
    const past = new Date(dateString);
    const elapsedSeconds = Math.floor((now - past) / 1000);

    if (isNaN(elapsedSeconds) || elapsedSeconds < 0) return 'just now';
    if (elapsedSeconds < 60) return `${elapsedSeconds}s ago`;
    const mins = Math.floor(elapsedSeconds / 60);
    if (mins < 60) return `${mins} min${mins === 1 ? '' : 's'} ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days} day${days === 1 ? '' : 's'} ago`;
    const months = Math.floor(days / 30);
    return `${months} mo ago`;
  }

  function formatMonthDay(dateString) {
    if (!dateString) return { day: '--', month: 'TBD' };
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return { day: dateString.slice(8, 10) || '--', month: 'DATE' };
    const day = String(d.getDate()).padStart(2, '0');
    const month = d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    return { day, month };
  }

  /* ---------------- Modal Overlay Component ---------------- */
  function showModal(title, bodyContent, onSave = null, saveBtnText = 'Save Changes') {
    const overlay = h('div', { class: 'admin-modal-overlay' });
    const closeBtn = h('button', { class: 'admin-modal-close', text: '✕', onclick: () => overlay.remove() });

    const header = h('div', { style: 'display:flex;justify-content:space-between;align-items:center;margin-bottom:1.4rem;padding-bottom:.8rem;border-bottom:1px solid var(--line);' },
      h('h3', { style: 'font-size:1.15rem;color:var(--white);font-weight:600;', text: title }),
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
     1. LOGIN SCREEN
     ========================================================================= */
  function renderLogin() {
    const userInput = h('input', {
      type: 'text',
      required: true,
      placeholder: 'Admin username (e.g. sneha, admin)',
      value: 'sneha'
    });

    const passInput = h('input', {
      type: 'password',
      required: true,
      placeholder: 'Password (e.g. cipher2026)'
    });

    const statusBox = h('div', { class: 'login-status-box' });
    const rememberBox = h('input', { type: 'checkbox', checked: true });

    const submitBtn = h('button', {
      class: 'btn solid',
      type: 'submit',
      style: 'width:100%;margin-top:.8rem;padding:.75rem;'
    }, 'Authenticate & Enter Dashboard');

    const form = h('form', {
      class: 'login-form-card',
      onsubmit: async (e) => {
        e.preventDefault();
        statusBox.className = 'login-status-box';
        statusBox.textContent = 'Verifying credentials…';
        submitBtn.disabled = true;

        try {
          const res = await api('/admin/login', {
            method: 'POST',
            body: { username: userInput.value.trim(), password: passInput.value }
          });

          token = res.token;
          currentUser = res.username || userInput.value.trim() || 'sneha';

          const store = rememberBox.checked ? localStorage : sessionStorage;
          store.setItem(TOKEN_KEY, token);
          store.setItem(USER_KEY, currentUser);

          toast('Access granted. Welcome back, ' + currentUser);
          renderShell('Dashboard');
        } catch (err) {
          statusBox.className = 'login-status-box err';
          statusBox.textContent = err.message || 'Authentication failed. Please verify credentials.';
          submitBtn.disabled = false;
        }
      }
    },
      h('div', { class: 'login-header' },
        h('div', { style: 'display:inline-flex;padding:.8rem;border-radius:12px;background:rgba(0,255,102,0.1);border:1px solid var(--line);margin-bottom:1rem;' },
          svgIcon('events', 28)
        ),
        h('h1', { text: 'CIPHER // ADMIN' }),
        h('p', { text: 'SJEC CSE Department Admin Dashboard' })
      ),
      field('Admin Username', userInput),
      field('Password', passInput),
      h('div', { style: 'display:flex;align-items:center;justify-content:space-between;margin:.4rem 0 1rem 0;' },
        h('label', { style: 'display:inline-flex;align-items:center;gap:.5rem;margin:0;cursor:pointer;' },
          rememberBox,
          h('span', { style: 'font-size:.76rem;color:var(--text-dim);text-transform:none;', text: 'Remember me' })
        ),
        h('a', { href: '/', style: 'font-size:.76rem;color:var(--g);', text: '← Back to Website' })
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
    Content: viewContent,
    Settings: viewSettings
  };

  let activeTabName = 'Dashboard';

  function renderShell(active = 'Dashboard', extraAction = null) {
    activeTabName = active;
    const mainArea = h('main', { class: 'admin-main' });

    // Sidebar navigation items
    const navItems = [
      { id: 'Dashboard', icon: 'dashboard', label: 'Dashboard' },
      { id: 'Events', icon: 'events', label: 'Events' },
      { id: 'Registrations', icon: 'registrations', label: 'Registrations' },
      { id: 'Content', icon: 'content', label: 'Content' },
      { id: 'Settings', icon: 'settings', label: 'Settings' }
    ];

    const sidebar = h('aside', { class: 'admin-sidebar' },
      h('div', {},
        h('div', { class: 'sidebar-header' },
          h('div', { class: 'brand-badge' },
            h('span', { class: 'brand-accent', text: '//' }),
            h('span', { text: 'CIPHER' }),
            h('span', { class: 'badge-admin-tag', text: 'ADMIN' })
          ),
          h('p', { class: 'brand-sub', text: 'SJEC CSE DEPARTMENT' })
        ),
        h('nav', { class: 'sidebar-nav' },
          navItems.map((item) => {
            const btn = h('button', {
              class: `nav-item ${item.id === active ? 'active' : ''}`,
              onclick: () => renderShell(item.id)
            },
              h('span', { class: 'nav-icon' }, svgIcon(item.icon, 18)),
              h('span', { text: item.label })
            );
            return btn;
          })
        )
      ),
      h('div', { class: 'sidebar-footer' },
        h('button', { class: 'sidebar-logout-btn', onclick: logout },
          svgIcon('logout', 16),
          h('span', { text: 'Logout' })
        )
      )
    );

    const layout = h('div', { class: 'admin-layout' }, sidebar, mainArea);
    app.replaceChildren(layout);

    // Render active tab view
    if (views[active]) {
      views[active](mainArea, extraAction).catch((e) => toast(e.message, true));
    }
  }

  /* ---------------- Top Header Strip with User Profile Pill ---------------- */
  function renderHeaderStrip() {
    const initial = (currentUser || 'S').trim().charAt(0).toUpperCase();

    const pill = h('div', {
      class: 'user-profile-pill',
      title: 'Admin Session Menu',
      onclick: () => {
        if (confirm(`Logged in as "${currentUser}". Go to Settings to update password or logout?`)) {
          renderShell('Settings');
        }
      }
    },
      h('div', { class: 'user-initial-circle', text: initial }),
      h('span', { class: 'user-pill-name', text: currentUser }),
      h('span', { class: 'user-pill-chevron', text: '⌵' })
    );

    return h('div', { class: 'admin-header-strip' }, pill);
  }

  /* =========================================================================
     3. VIEW: DASHBOARD OVERVIEW
     ========================================================================= */
  async function viewDashboard(root) {
    root.replaceChildren(
      renderHeaderStrip(),
      h('div', { class: 'dashboard-hero' },
        h('div', { class: 'dashboard-tag', text: '// DASHBOARD' }),
        h('h1', { class: 'dashboard-heading' }, 'Welcome back, ', h('span', { class: 'accent-name', text: currentUser }), '!'),
        h('p', { class: 'dashboard-sub', text: 'Manage CIPHER activities, events, registrations and content from one place.' })
      ),
      h('p', { class: 'empty-state', text: 'Loading live dashboard statistics…' })
    );

    try {
      // Fetch comprehensive dashboard bundle
      const data = await api('/admin/dashboard');
      const stats = data.stats || {};
      const recentLogs = data.recentActivity || [];
      const upcomingEvents = data.upcomingEvents || [];

      // 4 Clean Stat Cards
      const statsGrid = h('div', { class: 'stats-4grid' },
        // Total Events
        h('div', { class: 'stat-card-clean' },
          h('div', { class: 'stat-icon-box' }, svgIcon('calendar', 24)),
          h('div', { class: 'stat-info-box' },
            h('div', { class: 'stat-number', text: String(stats.totalEvents ?? 0) }),
            h('div', { class: 'stat-title', text: 'Total Events' })
          )
        ),
        // Total Registrations
        h('div', { class: 'stat-card-clean' },
          h('div', { class: 'stat-icon-box' }, svgIcon('registrations', 24)),
          h('div', { class: 'stat-info-box' },
            h('div', { class: 'stat-number', text: String(stats.totalRegistrations ?? 0) }),
            h('div', { class: 'stat-title', text: 'Total Registrations' })
          )
        ),
        // Upcoming Events
        h('div', { class: 'stat-card-clean' },
          h('div', { class: 'stat-icon-box' }, svgIcon('clock', 24)),
          h('div', { class: 'stat-info-box' },
            h('div', { class: 'stat-number', text: String(stats.upcomingEvents ?? 0) }),
            h('div', { class: 'stat-title', text: 'Upcoming Events' })
          )
        ),
        // Published Events
        h('div', { class: 'stat-card-clean' },
          h('div', { class: 'stat-icon-box' }, svgIcon('fileText', 24)),
          h('div', { class: 'stat-info-box' },
            h('div', { class: 'stat-number', text: String(stats.publishedEvents ?? 0) }),
            h('div', { class: 'stat-title', text: 'Published Events' })
          )
        )
      );

      // Quick Actions Section
      const quickActions = h('div', {},
        h('h2', { class: 'section-subhead', text: 'Quick Actions' }),
        h('div', { class: 'quick-actions-grid' },
          // 1. Add New Event
          h('div', {
            class: 'quick-action-card',
            onclick: () => renderShell('Events', 'ADD_EVENT')
          },
            h('div', { class: 'quick-action-left' },
              h('div', { class: 'quick-action-icon' }, svgIcon('plusCalendar', 20)),
              h('span', { class: 'quick-action-title', text: 'Add New Event' })
            ),
            h('span', { class: 'quick-action-arrow', text: '→' })
          ),
          // 2. View Registrations
          h('div', {
            class: 'quick-action-card',
            onclick: () => renderShell('Registrations')
          },
            h('div', { class: 'quick-action-left' },
              h('div', { class: 'quick-action-icon' }, svgIcon('registrations', 20)),
              h('span', { class: 'quick-action-title', text: 'View Registrations' })
            ),
            h('span', { class: 'quick-action-arrow', text: '→' })
          ),
          // 3. Manage Content
          h('div', {
            class: 'quick-action-card',
            onclick: () => renderShell('Content')
          },
            h('div', { class: 'quick-action-left' },
              h('div', { class: 'quick-action-icon' }, svgIcon('content', 20)),
              h('span', { class: 'quick-action-title', text: 'Manage Content' })
            ),
            h('span', { class: 'quick-action-arrow', text: '→' })
          ),
          // 4. Platform Settings
          h('div', {
            class: 'quick-action-card',
            onclick: () => renderShell('Settings')
          },
            h('div', { class: 'quick-action-left' },
              h('div', { class: 'quick-action-icon' }, svgIcon('settings', 20)),
              h('span', { class: 'quick-action-title', text: 'Platform Settings' })
            ),
            h('span', { class: 'quick-action-arrow', text: '→' })
          )
        )
      );

      // Bottom 2 Columns: Recent Activity (Left) + Upcoming Events (Right)
      const recentActivityPanel = h('div', { class: 'clean-panel' },
        h('div', { class: 'clean-panel-header' },
          h('h3', { class: 'clean-panel-title', text: 'Recent Activity' }),
          h('span', {
            class: 'clean-panel-viewall',
            onclick: () => renderShell('Settings')
          }, 'View All →')
        ),
        recentLogs.length ? h('div', { class: 'activity-feed-list' },
          recentLogs.slice(0, 5).map((log, idx) => {
            const actionStr = (log.action_type || log.action || '').toUpperCase();
            const dotColor = actionStr.includes('REG') || actionStr.includes('JOIN')
              ? 'green'
              : (actionStr.includes('EVENT') ? 'teal' : (actionStr.includes('AUTH') ? 'amber' : 'grey'));

            const text = log.details || log.description || log.action_type || 'Platform activity recorded';
            const timeStr = timeAgo(log.created_at);

            return h('div', { class: 'activity-feed-row' },
              h('div', { class: 'activity-feed-left' },
                h('div', { class: `activity-dot ${dotColor}` }),
                h('div', { class: 'activity-text', text })
              ),
              h('div', { class: 'activity-time', text: timeStr })
            );
          })
        ) : h('p', { class: 'empty-state', text: 'No recent activity recorded yet.' })
      );

      const upcomingEventsPanel = h('div', { class: 'clean-panel' },
        h('div', { class: 'clean-panel-header' },
          h('h3', { class: 'clean-panel-title', text: 'Upcoming Events' }),
          h('span', {
            class: 'clean-panel-viewall',
            onclick: () => renderShell('Events')
          }, 'View All →')
        ),
        upcomingEvents.length ? h('div', { class: 'upcoming-events-list' },
          upcomingEvents.slice(0, 4).map((ev) => {
            const { day, month } = formatMonthDay(ev.event_date);
            const isPub = ev.published !== false && ev.published !== 0;

            return h('div', { class: 'upcoming-event-item' },
              h('div', { class: 'upcoming-event-left' },
                h('div', { class: 'upcoming-date-badge' },
                  h('span', { class: 'date-day', text: day }),
                  h('span', { class: 'date-month', text: month })
                ),
                h('div', { class: 'upcoming-details' },
                  h('div', { class: 'upcoming-name', text: ev.title }),
                  h('div', { class: 'upcoming-venue', text: ev.venue || 'SJEC Campus' })
                )
              ),
              h('div', { class: `status-pill ${isPub ? 'published' : 'draft'}`, text: isPub ? 'Published' : 'Draft' })
            );
          })
        ) : h('p', { class: 'empty-state', text: 'No scheduled events found.' })
      );

      const bottomRow = h('div', { class: 'bottom-panels-grid' },
        recentActivityPanel,
        upcomingEventsPanel
      );

      root.replaceChildren(
        renderHeaderStrip(),
        h('div', { class: 'dashboard-hero' },
          h('div', { class: 'dashboard-tag', text: '// DASHBOARD' }),
          h('h1', { class: 'dashboard-heading' }, 'Welcome back, ', h('span', { class: 'accent-name', text: currentUser }), '!'),
          h('p', { class: 'dashboard-sub', text: 'Manage CIPHER activities, events, registrations and content from one place.' })
        ),
        statsGrid,
        quickActions,
        bottomRow
      );
    } catch (err) {
      root.replaceChildren(h('p', { class: 'empty-state', text: `Failed to load dashboard: ${err.message}` }));
    }
  }

  /* =========================================================================
     4. VIEW: EVENTS MANAGEMENT
     ========================================================================= */
  async function viewEvents(root, extraAction = null) {
    root.replaceChildren(
      renderHeaderStrip(),
      h('div', { class: 'admin-topbar' },
        h('div', { class: 'page-heading-group' },
          h('h1', {}, svgIcon('events', 24), 'Events Management'),
          h('p', { text: 'Create, edit, publish, and delete events appearing on the public website.' })
        ),
        h('div', { class: 'topbar-actions' },
          h('button', { class: 'btn solid sm', onclick: () => openEventEditorModal(null, () => viewEvents(root)) }, svgIcon('plus', 14), 'Add Event')
        )
      ),
      h('p', { class: 'empty-state', text: 'Loading events…' })
    );

    const events = await api('/admin/events');

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
                  ev.featured ? h('span', { class: 'badge amber', style: 'margin-top:2px;font-size:.65rem;', text: 'FEATURED' }) : null
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
                      await api(`/admin/events/${ev.id}/publish`, { method: 'PATCH', body: { published: newStatus } });
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
                            await api('/admin/events/' + ev.id, { method: 'DELETE' });
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
      renderHeaderStrip(),
      h('div', { class: 'admin-topbar' },
        h('div', { class: 'page-heading-group' },
          h('h1', {}, svgIcon('events', 24), `Events Management (${events.length})`),
          h('p', { text: 'Create, edit, publish, and delete events appearing on the public website.' })
        ),
        h('div', { class: 'topbar-actions' },
          h('button', { class: 'btn solid sm', onclick: () => openEventEditorModal(null, () => viewEvents(root)) }, svgIcon('plus', 14), 'Add Event')
        )
      ),
      toolbar,
      tableWrap
    );

    drawTable();

    // If navigated from Quick Actions with ADD_EVENT trigger
    if (extraAction === 'ADD_EVENT') {
      openEventEditorModal(null, () => viewEvents(root));
    }
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
    const titleInp = h('input', { name: 'title', required: true, value: initial.title || '', placeholder: 'e.g. TECHVERSE 2026' });
    const catInp = h('input', { name: 'category', required: true, value: initial.category || 'WORKSHOP', placeholder: 'WORKSHOP / COMPETITION / TALK' });
    const dateInp = h('input', { name: 'event_date', type: 'date', required: true, value: initial.event_date || '' });
    const timeInp = h('input', { name: 'event_time', value: initial.event_time || '', placeholder: 'e.g. 09:30 AM - 04:30 PM' });
    const venueInp = h('input', { name: 'venue', value: initial.venue || '', placeholder: 'e.g. Kalam Auditorium, SJEC' });
    const regLinkInp = h('input', { name: 'reg_link', type: 'url', value: initial.reg_link || '', placeholder: 'https://forms.gle/...' });
    const summaryInp = h('textarea', { name: 'summary', rows: 3, required: true, placeholder: 'Brief 1-2 sentence overview for the event card…' }, initial.summary || '');
    const bodyInp = h('textarea', { name: 'body', rows: 5, placeholder: 'Detailed description (paragraphs separated by blank line)…' }, (initial.body || []).join('\n\n'));

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
        posterPreview.replaceChildren(h('span', { style: 'font-size:.74rem;color:var(--text-dim);', text: 'No main poster image selected.' }));
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
      h('div', { style: 'background:rgba(0,255,102,0.03);border:1px solid var(--line);border-radius:8px;padding:1rem;margin-bottom:1.2rem;' },
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
      h('div', { style: 'background:rgba(0,255,102,0.03);border:1px solid var(--line);border-radius:8px;padding:1rem;margin-bottom:1.2rem;' },
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
          h('span', { text: 'Featured Event' })
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
          await api(`/admin/events/${initial.id}`, { method: 'PUT', body: payload });
          toast('✓ Event updated successfully');
        } else {
          await api('/admin/events', { method: 'POST', body: payload });
          toast('✓ New event created successfully');
        }

        if (onComplete) onComplete();
      },
      isEdit ? 'Save Changes' : 'Create Event'
    );
  }

  /* ---------------- Event Preview Modal ---------------- */
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

    showModal(`Preview: ${ev.title}`, previewBox, null);
  }

  /* =========================================================================
     6. VIEW: REGISTRATIONS MANAGEMENT
     ========================================================================= */
  async function viewRegistrations(root) {
    root.replaceChildren(
      renderHeaderStrip(),
      h('div', { class: 'admin-topbar' },
        h('div', { class: 'page-heading-group' },
          h('h1', {}, svgIcon('registrations', 24), 'Registration Management'),
          h('p', { text: 'Review join requests, filter participant interest, manage moderation statuses, and export data.' })
        ),
        h('div', { class: 'topbar-actions' },
          h('button', { class: 'btn solid sm', onclick: () => openAddRegistrationModal(() => viewRegistrations(root)) }, svgIcon('plus', 14), 'Add Registration')
        )
      ),
      h('p', { class: 'empty-state', text: 'Loading registrations…' })
    );

    const rows = await api('/admin/join-requests');
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
        const res = await api('/admin/join-requests.csv', { raw: true });
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
              h('th', { text: 'Interest' }),
              h('th', { text: 'Status' }),
              h('th', { text: 'Actions', style: 'text-align:right;' })
            )
          ),
          h('tbody', {},
            filtered.map((r) => {
              return h('tr', {},
                h('td', { style: 'font-size:.78rem;color:var(--text-dim);', text: (r.created_at || '').slice(0, 10) }),
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
                      await api(`/admin/join-requests/${r.id}`, { method: 'PATCH', body: { status: newStatus } });
                      r.status = newStatus;
                      toast(`Status updated to ${newStatus}`);
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
                      title: 'Delete Registration',
                      onclick: () => {
                        if (confirm(`Delete registration for "${r.name}"?`)) {
                          guard(async () => {
                            await api(`/admin/join-requests/${r.id}`, { method: 'DELETE' });
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
      renderHeaderStrip(),
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

    showModal(`Applicant: ${r.name}`, details, null);
  }

  function openAddRegistrationModal(onComplete) {
    const nameInp = h('input', { required: true, placeholder: 'Full name' });
    const emailInp = h('input', { type: 'email', required: true, placeholder: 'name@sjec.ac.in' });
    const usnInp = h('input', { placeholder: '4SO22CS000' });
    const yearInp = h('select', {},
      h('option', { value: '1', text: '1st Year' }),
      h('option', { value: '2', text: '2nd Year', selected: true }),
      h('option', { value: '3', text: '3rd Year' }),
      h('option', { value: '4', text: '4th Year' })
    );
    const interestInp = h('input', { placeholder: 'AI & ML / Web / Cyber / Open Source' });
    const msgInp = h('textarea', { rows: 3, placeholder: 'Optional statement or notes…' });

    const formBox = h('form', {},
      h('div', { class: 'grid2' },
        field('Full Name', nameInp),
        field('Email', emailInp)
      ),
      h('div', { class: 'grid3' },
        field('USN', usnInp),
        field('Year', yearInp),
        field('Interest Track', interestInp)
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
     7. VIEW: CONTENT MANAGEMENT
     ========================================================================= */
  async function viewContent(root) {
    root.replaceChildren(
      renderHeaderStrip(),
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
    const venueInp = h('input', { value: content.campus_address || 'St Joseph Engineering College, Vamanjoor, Mangaluru' });

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
          campus_address: venueInp.value.trim()
        };

        await api('/admin/content', { method: 'POST', body: payload });
        toast('✓ Website content updated successfully');
        saveBtn.disabled = false;
      })
    },
      h('div', { class: 'clean-panel', style: 'margin-bottom:1.4rem;' },
        h('h3', { class: 'clean-panel-title', style: 'margin-bottom:1.2rem;', text: 'Homepage Hero & Tagline' }),
        field('Hero Subtitle / Tagline', heroSubInp, 'Displayed beneath the CIPHER title on homepage')
      ),
      h('div', { class: 'clean-panel', style: 'margin-bottom:1.4rem;' },
        h('h3', { class: 'clean-panel-title', style: 'margin-bottom:1.2rem;', text: 'About CIPHER Section' }),
        field('Section Headline', aboutTitleInp),
        field('About Description Text', aboutTextInp, 'Describes the vision, mission, and legacy of CIPHER')
      ),
      h('div', { class: 'clean-panel', style: 'margin-bottom:1.4rem;' },
        h('h3', { class: 'clean-panel-title', style: 'margin-bottom:1.2rem;', text: 'Announcement Broadcast Banner' }),
        h('label', { class: 'switch-label', style: 'margin-bottom:1rem;' },
          announceToggle,
          h('span', { class: 'switch-slider' }),
          h('span', { text: 'Enable Top Announcement Banner' })
        ),
        field('Announcement Message', announceTextInp)
      ),
      h('div', { class: 'clean-panel', style: 'margin-bottom:1.4rem;' },
        h('h3', { class: 'clean-panel-title', style: 'margin-bottom:1.2rem;', text: 'Contact & Campus Address' }),
        h('div', { class: 'grid2' },
          field('Official Contact Email', contactEmailInp),
          field('Campus Location', venueInp)
        )
      ),
      saveBtn
    );

    root.replaceChildren(
      renderHeaderStrip(),
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
     8. VIEW: SETTINGS & AUDIT LOGS
     ========================================================================= */
  async function viewSettings(root) {
    root.replaceChildren(
      renderHeaderStrip(),
      h('div', { class: 'admin-topbar' },
        h('div', { class: 'page-heading-group' },
          h('h1', {}, svgIcon('settings', 24), 'Platform Settings & Audit Log'),
          h('p', { text: 'Admin security, credentials management, database diagnostics, and historical audit trail.' })
        )
      ),
      h('p', { class: 'empty-state', text: 'Loading system diagnostics…' })
    );

    const logs = await api('/admin/activity-log?limit=50');

    // Password change card
    const oldPassInp = h('input', { type: 'password', required: true, placeholder: 'Enter current password' });
    const newPassInp = h('input', { type: 'password', required: true, placeholder: 'Enter new password (min 6 characters)' });
    const confirmPassInp = h('input', { type: 'password', required: true, placeholder: 'Confirm new password' });
    const passStatus = h('div', { class: 'login-status-box' });

    const passForm = h('form', {
      class: 'clean-panel',
      style: 'margin-bottom:1.5rem;',
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

        await api('/admin/change-password', {
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
      h('h3', { class: 'clean-panel-title', style: 'margin-bottom:1.2rem;', text: 'Change Admin Password' }),
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
            h('td', {}, h('span', { class: 'badge green', text: log.action_type || log.action || 'ACTIVITY' })),
            h('td', { style: 'color:var(--white);', text: log.details || log.description || log.action_type || '—' }),
            h('td', { style: 'font-size:.78rem;color:var(--g-dim);', text: log.username || log.actor || 'Admin' })
          ))
        )
      )
    );

    const logPanel = h('div', { class: 'clean-panel' },
      h('div', { class: 'clean-panel-header' },
        h('h3', { class: 'clean-panel-title', text: 'Full Audit Activity Log' })
      ),
      logs.length ? logTable : h('p', { class: 'empty-state', text: 'No logs recorded yet.' })
    );

    root.replaceChildren(
      renderHeaderStrip(),
      h('div', { class: 'admin-topbar' },
        h('div', { class: 'page-heading-group' },
          h('h1', {}, svgIcon('settings', 24), 'Platform Settings & Audit Log'),
          h('p', { text: 'Admin security, credentials management, database diagnostics, and historical audit trail.' })
        )
      ),
      passForm,
      logPanel
    );
  }

  /* ---------------- Initialize ---------------- */
  token ? renderShell('Dashboard') : renderLogin();
})();
