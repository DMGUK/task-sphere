const RAG_BASE_URL = process.env.RAG_SERVICE_URL ?? 'http://localhost:8000';

// Fire-and-forget — RAG indexing failures must never break the main notes API.
function fireAndForget(promise: Promise<unknown>) {
  promise.catch((err) => console.error('[rag] sync error:', err));
}

export function ragIndexNote(id: number, title: string, content: string | null, userId: number) {
  fireAndForget(
    fetch(`${RAG_BASE_URL}/embed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ note_id: String(id), title, content: content ?? '', user_id: String(userId) }),
    })
  );
}

export function ragDeleteNote(id: number) {
  fireAndForget(fetch(`${RAG_BASE_URL}/embed/${id}`, { method: 'DELETE' }));
}
