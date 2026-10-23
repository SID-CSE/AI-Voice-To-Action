import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import { createServer as createViteServer } from 'vite';
import { createApp } from './server.js';

async function startServer(): Promise<void> {
  const app = createApp();
  const port = Number(process.env.PORT) || 3000;

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: { port: port + 1 } },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const server = app.listen(port, '0.0.0.0');
  server.once('listening', () => {
    console.log(`AI Voice-to-Action Server running at http://0.0.0.0:${port}`);
  });
  server.once('error', (error: NodeJS.ErrnoException) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`Port ${port} is already in use. Stop the existing development server or start with a different port, for example: $env:PORT=3001; npm run dev`);
    } else {
      console.error('Unable to start the server:', error);
    }
    process.exit(1);
  });
}

startServer().catch((error) => {
  console.error('Unable to initialize the application:', error);
  process.exitCode = 1;
});
