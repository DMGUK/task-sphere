import { Router, RequestHandler, Response } from 'express';
import { Request } from 'express';

interface AuthRequest extends Request {
  user: { id: number };
}

const RAG_BASE_URL = process.env.RAG_SERVICE_URL ?? 'http://localhost:8000';

const router = Router();

// POST /api/ai/query/stream — proxies to RAG /query/stream with user_id injected
router.post('/query/stream', (async (req: AuthRequest, res: Response) => {
  const body = { ...req.body, user_id: String(req.user.id) };

  let ragRes: globalThis.Response;
  try {
    ragRes = await fetch(`${RAG_BASE_URL}/query/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    return res.status(503).json({ message: 'AI service unavailable' });
  }

  if (!ragRes.ok) {
    const err = await ragRes.json().catch(() => ({ message: 'AI service error' }));
    return res.status(ragRes.status).json(err);
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('X-Accel-Buffering', 'no');

  const reader = ragRes.body!.getReader();
  const pump = async () => {
    while (true) {
      const { done, value } = await reader.read();
      if (done) { res.end(); break; }
      res.write(value);
    }
  };
  pump().catch(() => res.end());
}) as unknown as RequestHandler);

export default router;
