// Vercel Serverless Function entry point
// Diagnostic version to surface the actual runtime error
const path = require('path');
const fs = require('fs');

let app;
let loadError = null;

try {
  const distPath = path.join(__dirname, '..', 'dist', 'index.js');

  if (!fs.existsSync(distPath)) {
    throw new Error(
      'dist/index.js not found. __dirname=' +
        __dirname +
        ', looked at: ' +
        distPath +
        ', parent contents: ' +
        JSON.stringify(fs.readdirSync(path.join(__dirname, '..')))
    );
  }

  const mod = require(distPath);
  app = mod.default || mod;

  if (typeof app !== 'function') {
    throw new Error(
      'Loaded module is not a function. Type: ' +
        typeof app +
        ', keys: ' +
        JSON.stringify(Object.keys(mod))
    );
  }
} catch (error) {
  loadError = error;
  console.error('FATAL: Failed to load app:', error);
}

module.exports = (req, res) => {
  if (loadError) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(
      JSON.stringify({
        error: 'App failed to initialize',
        message: loadError.message,
        stack: loadError.stack,
      })
    );
    return;
  }
  return app(req, res);
};
