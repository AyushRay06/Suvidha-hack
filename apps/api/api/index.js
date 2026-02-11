// Vercel Serverless Function entry point (CJS)
// Avoids ESM-to-CJS double compilation by Vercel
let app;
try {
  const mod = require('../dist/index');
  app = mod.default || mod;
} catch (error) {
  console.error('FATAL: Failed to load app module:', error);
  // Return a diagnostic handler so Vercel shows the real error in logs
  app = (req, res) => {
    res.status(500).json({
      error: 'Failed to initialize application',
      message: error.message,
      stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined,
    });
  };
}

module.exports = app;
