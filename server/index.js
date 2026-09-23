require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const path = require('path');
const api = require('./routes');
const { uploadDir } = require('./paths');

const app = express();
app.set('trust proxy', 1); // correct client IP behind Render/Railway/Vercel for rate limiting

app.use(helmet({
  frameguard: false,
  contentSecurityPolicy: false,
  crossOriginOpenerPolicy: false,
  crossOriginResourcePolicy: false,
  crossOriginEmbedderPolicy: false,
  originAgentCluster: false,
}));
app.use(cors({ origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : true }));
app.use(express.json({ limit: '100kb' }));

app.use('/api', api);
app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found' }));

app.use('/uploads', express.static(uploadDir, { maxAge: '7d', immutable: true, index: false }));
app.use(express.static(path.join(__dirname, '..', 'public'), { extensions: ['html'], maxAge: '1h' }));

// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  if (err.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ error: 'Image is larger than 4 MB' });
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Invalid JSON' });
  console.error(err);
  res.status(500).json({ error: 'Something went wrong' });
});

const port = 3000;
app.listen(port, '0.0.0.0', () => console.log(`CIPHER running on http://0.0.0.0:${port}`));
