(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const app = $('#app');
  const TOKEN_KEY = 'cipher-admin-token';
  let token = null;
  try { token = sessionStorage.getItem(TOKEN_KEY); } catch {}

  function h(tag, props = {}, ...kids) {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(props)) {
      if (k === 'class') el.className = v;
      else if (k === 'text') el.textContent = v;
      else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
      else if (v != null && v !== false) el.setAttribute(k, v === true ? '' : v);
    }
    kids.flat().forEach((c) => c != null && c !== false && el.append(c));
    return el;
  }
  const field = (label, input) => h('label', {}, label, input);

  let toastTimer;
  function toast(msg, bad = false) {
    const t = $('#toast'); t.textContent = msg; t.className = 'toast show' + (bad ? ' bad' : '');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => (t.className = 'toast'), 2400);
  }

  async function api(path, { method = 'GET', body, form, raw } = {}) {
    const headers = {};
    if (token) headers.Authorization = 'Bearer ' + token;
    if (body) headers['Content-Type'] = 'application/json';
    const res = await fetch('/api' + path, { method, headers, body: form || (body ? JSON.stringify(body) : undefined) });
    if (res.status === 401 && token) { logout(); throw new Error('Session expired. Please log in again.'); }
    if (raw && res.ok) return res;
    const data = res.status === 204 ? null : await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.details?.map((d) => `${d.field}: ${d.message}`).join(', ') || data?.error || 'Request failed');
    return data;
  }
  const guard = (fn) => async (...a) => { try { await fn(...a); } catch (e) { toast(e.message, true); } };

  function logout() {
    token = null; try { sessionStorage.removeItem(TOKEN_KEY); } catch {}
    renderLogin();
  }

  /* ---------- login ---------- */
  function renderLogin() {
    const err = h('p', { class: 'err' });
    const form = h('form', { class: 'card login', onsubmit: async (e) => {
      e.preventDefault(); err.textContent = '';
      const fd = new FormData(form);
      try {
        const r = await api('/admin/login', { method: 'POST', body: { username: fd.get('u'), password: fd.get('p') } });
        token = r.token; try { sessionStorage.setItem(TOKEN_KEY, token); } catch {}
        renderShell();
      } catch (ex) { err.textContent = ex.message; }
    } },
      h('h1', { text: 'CIPHER // ADMIN' }), h('br'),
      field('Username', h('input', { name: 'u', required: true, autocomplete: 'username' })),
      field('Password', h('input', { name: 'p', type: 'password', required: true, autocomplete: 'current-password' })),
      err, h('button', { class: 'btn solid', type: 'submit', text: 'Log in' }));
    app.replaceChildren(form);
  }

  /* ---------- shell ---------- */
  const tabs = { Applications: viewApplications, Events: viewEvents, Leadership: viewLeadership, Activities: viewActivities };
  function renderShell(active = 'Applications') {
    const panel = h('section');
    const bar = h('div', { class: 'tabs', role: 'tablist' }, Object.keys(tabs).map((name) =>
      h('button', { role: 'tab', 'aria-selected': name === active ? 'true' : 'false', text: name, onclick: () => renderShell(name) })));
    app.replaceChildren(
      h('div', { class: 'top' }, h('h1', { text: 'CIPHER // ADMIN' }),
        h('div', {}, h('a', { href: '/', text: 'View site' }), ' ', h('button', { class: 'btn sm', text: 'Log out', onclick: logout }))),
      bar, panel);
    tabs[active](panel).catch((e) => toast(e.message, true));
  }

  /* ---------- upload helper ---------- */
  async function uploadFile(file) {
    const fd = new FormData(); fd.append('file', file);
    return (await api('/admin/upload', { method: 'POST', form: fd })).url;
  }

  /* ---------- applications ---------- */
  async function viewApplications(root) {
    const rows = await api('/admin/join-requests');
    const statuses = ['new', 'contacted', 'accepted', 'rejected'];
    const filter = h('select', { onchange: draw }, h('option', { value: '', text: 'All statuses' }), statuses.map((s) => h('option', { value: s, text: s })));
    const exportBtn = h('button', { class: 'btn', text: 'Export CSV', onclick: guard(async () => {
      const res = await api('/admin/join-requests.csv', { raw: true });
      const a = h('a', { href: URL.createObjectURL(await res.blob()), download: 'cipher-join-requests.csv' });
      document.body.append(a); a.click(); a.remove();
    }) });
    const body = h('div', { class: 'scroll' });
    function draw() {
      const list = rows.filter((r) => !filter.value || r.status === filter.value);
      if (!list.length) { body.replaceChildren(h('p', { class: 'empty', text: 'No applications yet.' })); return; }
      body.replaceChildren(h('table', {},
        h('thead', {}, h('tr', {}, ['Date', 'Name', 'Email', 'USN', 'Year', 'Interest', 'Message', 'Status'].map((t) => h('th', { text: t })))),
        h('tbody', {}, list.map((r) => h('tr', {},
          h('td', { text: r.created_at.slice(0, 10) }), h('td', { text: r.name }),
          h('td', {}, h('a', { href: 'mailto:' + r.email, text: r.email })),
          h('td', { text: r.usn || '' }), h('td', { text: r.year ?? '' }), h('td', { text: r.interest || '' }),
          h('td', { text: r.message || '' }),
          h('td', {}, h('select', { onchange: guard(async (e) => {
            await api('/admin/join-requests/' + r.id, { method: 'PATCH', body: { status: e.target.value } });
            r.status = e.target.value; toast('Status updated');
          }) }, statuses.map((s) => h('option', { value: s, text: s, selected: s === r.status }))))
        )))));
    }
    root.replaceChildren(h('div', { class: 'card' },
      h('div', { class: 'top' }, h('h2', { text: `Applications (${rows.length})` }), h('div', {}, filter, ' ', exportBtn)), body));
    draw();
  }

  /* ---------- generic CRUD list ---------- */
  function listItem(title, meta, onEdit, onDelete) {
    return h('li', {}, h('div', {}, h('div', { text: title }), h('div', { class: 'meta', text: meta })),
      h('div', { class: 'actions' },
        onEdit && h('button', { class: 'btn sm', text: 'Edit', onclick: onEdit }),
        h('button', { class: 'btn sm danger', text: 'Delete', onclick: () => confirm(`Delete "${title}"?`) && guard(onDelete)() })));
  }

  /* ---------- events ---------- */
  async function viewEvents(root, editing = null) {
    const events = await api('/events');
    let gallery = editing ? [...editing.gallery] : [];
    const thumbs = h('div', { class: 'thumbs' });
    function drawThumbs() {
      thumbs.replaceChildren(...gallery.map((g, i) => h('div', { class: 'thumb' },
        h('img', { src: g.src, alt: '' }),
        h('input', { value: g.caption || '', placeholder: 'Caption', 'aria-label': 'Caption', oninput: (e) => (g.caption = e.target.value) }),
        h('button', { class: 'btn sm danger', type: 'button', text: 'Remove', onclick: () => { gallery.splice(i, 1); drawThumbs(); } }))));
    }
    drawThumbs();
    const e = editing || {};
    const f = h('form', { class: 'card', onsubmit: guard(async (ev) => {
      ev.preventDefault();
      const fd = new FormData(f);
      const payload = {
        title: fd.get('title'), category: fd.get('category'), event_date: fd.get('date'), venue: fd.get('venue') || null,
        summary: fd.get('summary'), body: String(fd.get('body')).split(/\n\s*\n/).map((s) => s.trim()).filter(Boolean),
        gallery: gallery.map((g) => ({ src: g.src, caption: g.caption || undefined })), featured: true,
      };
      await api(editing ? '/admin/events/' + editing.id : '/admin/events', { method: editing ? 'PUT' : 'POST', body: payload });
      toast(editing ? 'Event updated' : 'Event created'); viewEvents(root);
    }) },
      h('h2', { text: editing ? 'Edit event' : 'New event' }),
      field('Title', h('input', { name: 'title', required: true, value: e.title || '' })),
      h('div', { class: 'grid2' },
        field('Category', h('input', { name: 'category', required: true, value: e.category || '', placeholder: 'Workshop, Competition…' })),
        field('Date', h('input', { name: 'date', type: 'date', required: true, value: e.event_date || '' }))),
      field('Venue', h('input', { name: 'venue', value: e.venue || '' })),
      field('Card summary', h('textarea', { name: 'summary', rows: 3, required: true, text: e.summary || '' })),
      field('Full description (blank line between paragraphs)', h('textarea', { name: 'body', rows: 6, text: (e.body || []).join('\n\n') })),
      h('label', {}, 'Photos (JPG / PNG / WebP, max 4 MB each)',
        h('input', { type: 'file', accept: 'image/jpeg,image/png,image/webp', multiple: true, onchange: guard(async (ev) => {
          for (const file of ev.target.files) gallery.push({ src: await uploadFile(file), caption: '' });
          ev.target.value = ''; drawThumbs(); toast('Uploaded');
        }) })),
      thumbs,
      h('button', { class: 'btn solid', type: 'submit', text: editing ? 'Save changes' : 'Create event' }), ' ',
      editing && h('button', { class: 'btn', type: 'button', text: 'Cancel', onclick: () => viewEvents(root) }));
    const list = h('div', { class: 'card' }, h('h2', { text: `Events (${events.length})` }),
      events.length ? h('ul', { class: 'list' }, events.map((x) =>
        listItem(x.title, `${x.event_date} · ${x.category} · ${x.gallery.length} photo(s)`, () => viewEvents(root, x),
          async () => { await api('/admin/events/' + x.id, { method: 'DELETE' }); toast('Event deleted'); viewEvents(root); })))
        : h('p', { class: 'empty', text: 'No events yet.' }));
    root.replaceChildren(h('div', { class: 'split' }, f, list));
  }

  /* ---------- leadership ---------- */
  async function viewLeadership(root, editing = null) {
    const members = await api('/leadership');
    let image = editing?.image || null;
    const preview = h('img', { alt: '', width: 90, height: 120, class: 'thumb-img' });
    const draw = () => { preview.style.display = image ? 'block' : 'none'; if (image) preview.src = image; };
    draw();
    const m = editing || {};
    const f = h('form', { class: 'card', onsubmit: guard(async (ev) => {
      ev.preventDefault(); const fd = new FormData(f);
      const payload = { name: fd.get('name'), role: fd.get('role'), image, github: fd.get('github') || '', linkedin: fd.get('linkedin') || '', sort_order: Number(fd.get('order') || 0) };
      await api(editing ? '/admin/leadership/' + editing.id : '/admin/leadership', { method: editing ? 'PUT' : 'POST', body: payload });
      toast('Saved'); viewLeadership(root);
    }) },
      h('h2', { text: editing ? 'Edit member' : 'Add member' }),
      h('div', { class: 'grid2' },
        field('Name', h('input', { name: 'name', required: true, value: m.name || '' })),
        field('Role', h('input', { name: 'role', required: true, value: m.role || '', placeholder: 'President' }))),
      h('div', { class: 'grid2' },
        field('GitHub URL', h('input', { name: 'github', type: 'url', value: m.github || '' })),
        field('LinkedIn URL', h('input', { name: 'linkedin', type: 'url', value: m.linkedin || '' }))),
      field('Display order (lower = first)', h('input', { name: 'order', type: 'number', value: m.sort_order ?? members.length })),
      h('label', {}, 'Photo (portrait works best)', h('input', { type: 'file', accept: 'image/jpeg,image/png,image/webp',
        onchange: guard(async (ev) => { const file = ev.target.files[0]; if (file) { image = await uploadFile(file); draw(); toast('Uploaded'); } }) })),
      preview, h('br'),
      h('button', { class: 'btn solid', type: 'submit', text: 'Save' }), ' ',
      editing && h('button', { class: 'btn', type: 'button', text: 'Cancel', onclick: () => viewLeadership(root) }));
    const list = h('div', { class: 'card' }, h('h2', { text: `Leadership (${members.length})` }),
      h('ul', { class: 'list' }, members.map((x) => listItem(x.name, `${x.role} · order ${x.sort_order}`, () => viewLeadership(root, x),
        async () => { await api('/admin/leadership/' + x.id, { method: 'DELETE' }); toast('Removed'); viewLeadership(root); }))));
    root.replaceChildren(h('div', { class: 'split' }, f, list));
  }

  /* ---------- activities ---------- */
  async function viewActivities(root, editing = null) {
    const acts = await api('/activities');
    const a = editing || {};
    const f = h('form', { class: 'card', onsubmit: guard(async (ev) => {
      ev.preventDefault(); const fd = new FormData(f);
      const payload = { title: fd.get('title'), url: fd.get('url') || '', sort_order: Number(fd.get('order') || 0) };
      await api(editing ? '/admin/activities/' + editing.id : '/admin/activities', { method: editing ? 'PUT' : 'POST', body: payload });
      toast('Saved'); viewActivities(root);
    }) },
      h('h2', { text: editing ? 'Edit activity' : 'Add activity' }),
      field('Title', h('input', { name: 'title', required: true, value: a.title || '' })),
      field('Link (optional)', h('input', { name: 'url', type: 'url', value: a.url || '' })),
      field('Display order', h('input', { name: 'order', type: 'number', value: a.sort_order ?? acts.length })),
      h('button', { class: 'btn solid', type: 'submit', text: 'Save' }), ' ',
      editing && h('button', { class: 'btn', type: 'button', text: 'Cancel', onclick: () => viewActivities(root) }));
    const list = h('div', { class: 'card' }, h('h2', { text: `Activities (${acts.length})` }),
      h('ul', { class: 'list' }, acts.map((x) => listItem(x.title, `order ${x.sort_order}`, () => viewActivities(root, x),
        async () => { await api('/admin/activities/' + x.id, { method: 'DELETE' }); toast('Removed'); viewActivities(root); }))));
    root.replaceChildren(h('div', { class: 'split' }, f, list));
  }

  token ? renderShell() : renderLogin();
})();
