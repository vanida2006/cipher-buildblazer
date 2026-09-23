(() => {
  const app = document.getElementById('manage-app');
  let me = null;

  const permissions = {
    SUPER_ADMIN: ['events', 'activities', 'registrations', 'team', 'content', 'gallery', 'logs', 'admins', 'settings'],
    EVENT_MANAGER: ['events', 'registrations:read', 'gallery', 'activities:read'],
    CONTENT_MANAGER: ['activities', 'registrations:read', 'team', 'content', 'settings']
  };

  const can = (permission) => Boolean(me && permissions[me.role] && permissions[me.role].includes(permission));

  async function api(path, options = {}) {
    const request = { ...options, credentials: 'same-origin' };
    request.headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    };

    if (options.body && typeof options.body !== 'string') {
      request.body = JSON.stringify(options.body);
    }

    const response = await fetch('/api/manage' + path, request);
    const data = response.status === 204
      ? null
      : await response.json().catch(() => ({}));

    if (response.status === 401) {
      me = null;
      if (location.pathname !== '/manage/login') {
        location.href = '/manage/login';
      }
      throw new Error('Session expired');
    }

    if (!response.ok) {
      throw new Error(data.error || 'Request failed');
    }

    return data;
  }

  function el(tag, attrs = {}, ...children) {
    const node = document.createElement(tag);

    Object.entries(attrs).forEach(([key, value]) => {
      if (key === 'text') {
        node.textContent = value;
      } else if (key === 'className') {
        node.className = value;
      } else if (key.startsWith('on') && typeof value === 'function') {
        node.addEventListener(key.slice(2), value);
      } else if (value !== undefined && value !== null) {
        node.setAttribute(key, value);
      }
    });

    children.flat().forEach((child) => {
      if (child !== null && child !== undefined) {
        node.append(child);
      }
    });

    return node;
  }

  function field(label, type = 'text', value = '') {
    const wrapper = el('label', { className: 'field' });
    wrapper.append(el('span', { text: label }));

    const input = el(type === 'textarea' ? 'textarea' : 'input', {
      type: type === 'textarea' ? undefined : type,
      value
    });

    wrapper.append(input);
    return input;
  }

  function badge(text) {
    return el('span', { className: 'badge', text });
  }

  function go(path) {
    history.pushState({}, '', path);
    render();
  }

  function shell(title, subtitle, content) {
    const navigation = el('div', { className: 'nav' });

    navigation.append(
      el('button', {
        className: location.pathname.includes('dashboard') ? 'on' : '',
        text: '▦ Dashboard',
        onclick: () => go('/manage/dashboard')
      })
    );

    const items = [
      ['events', 'Events'],
      ['activities', 'Activities'],
      ['registrations', 'Registrations'],
      ['team', 'Team'],
      ['content', 'Content'],
      ['gallery', 'Gallery'],
      ['logs', 'Activity Logs'],
      ['settings', 'Settings']
    ];

    items
      .filter(([permission]) => can(permission) || can(permission + ':read'))
      .forEach(([permission, label]) => {
        navigation.append(
          el('button', {
            className: location.pathname.includes('/' + permission) ? 'on' : '',
            text: label,
            onclick: () => go('/manage/' + permission)
          })
        );
      });

    if (can('admins')) {
      navigation.append(
        el('button', {
          className: location.pathname.includes('/admins') ? 'on' : '',
          text: 'Admin Users',
          onclick: () => go('/manage/admins')
        })
      );
    }

    const logout = el('button', {
      className: 'logout',
      text: 'Logout',
      onclick: async () => {
        try {
          await api('/auth/logout', { method: 'POST' });
        } finally {
          me = null;
          location.href = '/manage/login';
        }
      }
    });

    app.replaceChildren(
      el(
        'aside',
        { className: 'm-side' },
        el(
          'div',
          { className: 'brand' },
          el('div', { text: 'CIPHER' }),
          el('small', { text: 'Management Portal' }),
          el('div', { className: 'role', text: me.role })
        ),
        navigation,
        logout
      ),
      el(
        'main',
        { className: 'main' },
        el(
          'div',
          { className: 'head' },
          el('small', { text: title.toUpperCase() }),
          el('h1', { text: title }),
          el('p', { text: subtitle })
        ),
        content
      )
    );
  }

  function login() {
    const email = field('Administrator email', 'email');
    const password = field('Password', 'password');
    const error = el('div', { className: 'error' });

    const form = el(
      'form',
      {
        className: 'card',
        onsubmit: async (event) => {
          event.preventDefault();
          error.textContent = '';

          try {
            const result = await api('/auth/login', {
              method: 'POST',
              body: {
                email: email.value.trim(),
                password: password.value
              }
            });

            me = result.admin;
            location.href = '/manage/dashboard';
          } catch (err) {
            error.textContent = err.message || 'Login failed';
          }
        }
      },
      el('img', { src: '/img/logo.jpg', alt: 'CIPHER' }),
      el('h1', { text: 'Management Portal' }),
      email,
      password,
      error,
      el('button', { className: 'btn green', text: 'LOGIN →', type: 'submit' })
    );

    app.replaceChildren(el('div', { className: 'login' }, form));
  }

  async function dashboard() {
    const data = await api('/dashboard');
    const stats = data.stats || {};

    const cards = Object.entries(stats).map(([key, value]) =>
      el(
        'div',
        { className: 'card stat' },
        el('b', { text: String(value) }),
        el('span', { text: key.replace(/[A-Z]/g, (match) => ' ' + match).toUpperCase() })
      )
    );

    const table = el(
      'table',
      {},
      el(
        'tr',
        {},
        el('th', { text: 'Name' }),
        el('th', { text: 'Email' }),
        el('th', { text: 'Year' }),
        el('th', { text: 'Status' })
      ),
      ...(data.recentRegistrations || []).map((row) =>
        el(
          'tr',
          {},
          el('td', { text: row.name || '—' }),
          el('td', { text: row.email || '—' }),
          el('td', { text: row.year || '—' }),
          el('td', {}, badge(row.status || 'NEW'))
        )
      )
    );

    shell(
      'CIPHER Control Center',
      'Secure workspace for CIPHER website management.',
      el(
        'div',
        {},
        el('div', { className: 'stats' }, cards),
        el(
          'div',
          { className: 'panel' },
          el('h3', { text: 'Recent registrations' }),
          table
        ),
        el(
          'div',
          { className: 'panel' },
          el('h3', { text: 'Recent admin actions' }),
          ...(data.recentLogs || []).map((item) =>
            el('p', {
              text: (item.admin_name || 'System') + ' — ' + (item.details || '')
            })
          )
        )
      )
    );
  }

  async function list(type) {
    const data = await api('/' + type);
    const content = el('div');

    (Array.isArray(data) ? data : []).forEach((row) => {
      content.append(
        el(
          'div',
          { className: 'panel' },
          el('b', { text: row.title || row.name || row.email || 'Item' }),
          el('span', {
            text: '  ' + (row.role || row.category || row.status || '')
          })
        )
      );
    });

    shell(
      type.charAt(0).toUpperCase() + type.slice(1),
      'Manage ' + type + '.',
      content
    );
  }

  async function render() {
    if (!me) {
      login();
      return;
    }

    const path = location.pathname;

    if (path === '/manage' || path === '/manage/' || path === '/manage/login') {
      location.href = '/manage/dashboard';
      return;
    }

    try {
      if (path.includes('/dashboard')) {
        await dashboard();
      } else if (path.includes('/events')) {
        await list('events');
      } else if (path.includes('/activities')) {
        await list('activities');
      } else if (path.includes('/registrations')) {
        await list('registrations');
      } else if (path.includes('/team')) {
        await list('team');
      } else if (path.includes('/content')) {
        await list('content');
      } else if (path.includes('/logs')) {
        await list('logs');
      } else if (path.includes('/admins') && can('admins')) {
        await list('admins');
      } else {
        await list('settings');
      }
    } catch (error) {
      shell(
        'Error',
        error.message || 'Request failed',
        el('div', { className: 'panel', text: error.message || 'Request failed' })
      );
    }
  }

  window.addEventListener('popstate', render);

  (async () => {
    try {
      const result = await api('/auth/me');
      me = result.admin;
      await render();
    } catch (error) {
      me = null;
      login();
    }
  })();
})();