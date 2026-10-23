import type { NextFunction, Request, RequestHandler, Response } from 'express';

let appPromise: Promise<RequestHandler> | undefined;

async function loadApp(): Promise<RequestHandler> {
  if (!appPromise) {
    process.env.VERCEL = '1';
    appPromise = import('../server.js').then(({ createApp }) => createApp());
  }
  return appPromise;
}

export default async function handler(req: Request, res: Response): Promise<void> {
  try {
    const app = await loadApp();
    const next: NextFunction = (error) => {
      if (error && !res.headersSent) res.status(500).json({ error: 'The API request failed.' });
    };
    app(req, res, next);
  } catch (error) {
    console.error('Vercel API initialization failed:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'The API failed to initialize.' });
    }
  }
}
