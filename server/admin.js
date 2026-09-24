const express = require('express');
const path = require('path');

const app = express();

const PORT = process.env.PORT || 3000;
const MAIN_API = process.env.MAIN_API_URL;

if (!MAIN_API) {
  throw new Error('MAIN_API_URL environment variable is required');
}

const managePath = path.join(__dirname, '..', 'public', 'manage');

app.use(
  '/manage',
  express.static(managePath, {
    extensions: ['html'],
    index: 'index.html'
  })
);

app.use('/api', async (req, res) => {
  try {
    const targetUrl =
      MAIN_API.replace(/\/$/, '') + '/api' + req.url;

    const headers = { ...req.headers };
    delete headers.host;

    let body;

    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
      body = await getRawBody(req);
    }

    const response = await fetch(targetUrl, {
      method: req.method,
      headers,
      body,
      redirect: 'manual'
    });

    res.status(response.status);

    response.headers.forEach((value, key) => {
      if (key.toLowerCase() === 'content-encoding') return;

      if (key.toLowerCase() === 'set-cookie') {
        res.setHeader('Set-Cookie', value);
      } else {
        res.setHeader(key, value);
      }
    });

    const buffer = Buffer.from(await response.arrayBuffer());
    res.send(buffer);

  } catch (error) {
    console.error('Admin proxy error:', error);
    res.status(502).json({
      error: 'Main CIPHER server unavailable'
    });
  }
});

function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];

    req.on('data', chunk => chunks.push(chunk));

    req.on('end', () => {
      resolve(Buffer.concat(chunks));
    });

    req.on('error', reject);
  });
}

app.get('/', (_req, res) => {
  res.redirect('/manage/');
});

app.get('/manage', (_req, res) => {
  res.redirect('/manage/');
});

app.get('/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'cipher-admin'
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`CIPHER Admin running on port ${PORT}`);
});