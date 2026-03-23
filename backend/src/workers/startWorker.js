// Entry point that starts both the API server and the render worker in one process.
// Useful for Railway's single-dyno free tier.
// For production, run them separately: npm start  +  npm run worker

import './renderWorker.js'
import '../index.js'
