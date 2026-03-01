// Vercel Serverless Function entry point (CJS)
const path = require('path');

let app;
try {
  const mod = require('../dist/index');
  app = mod.default || mod;
} catch (error) {
  console.error('FATAL: Failed to load app:', error);
  app = (req, res) => {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      error: 'Failed to initialize application',
      message: error.message,
    }));
  };
}

module.exports = app;
