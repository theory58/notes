export interface NoteItem {
  id: string;
  title: string;
  tags: string[];
  body: string;
  createdAt: string;
  updatedAt: string;
}

export interface NoteDraft {
  title: string;
  tagsInput: string;
  body: string;
}

export interface NoteValidationResult {
  valid: boolean;
  errors: {
    title?: string;
    body?: string;
  };
}

export interface ApiExchangeLog {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  status: number;
  durationMs: number;
  timestamp: string;
  requestBody?: unknown;
  responseBody: unknown;
}

export function parseTagsInput(tagsInput: string): string[] {
  if (!tagsInput.trim()) {
    return [];
  }
  const unique = new Set(
    tagsInput
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean),
  );
  return Array.from(unique);
}

export function validateNoteDraft(draft: NoteDraft): NoteValidationResult {
  const errors: NoteValidationResult['errors'] = {};

  if (!draft.title.trim()) {
    errors.title = 'Judul catatan wajib diisi.';
  }
  if (!draft.body.trim()) {
    errors.body = 'Isi catatan wajib diisi.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function filterNotes(
  notes: NoteItem[],
  query: string,
  activeTag: string,
): NoteItem[] {
  const normalizedQuery = query.trim().toLowerCase();

  return notes.filter((note) => {
    const matchesTag =
      activeTag === 'all' ||
      note.tags.some((t) => t.toLowerCase() === activeTag.toLowerCase());

    if (!matchesTag) {
      return false;
    }

    if (!normalizedQuery) {
      return true;
    }

    return (
      note.title.toLowerCase().includes(normalizedQuery) ||
      note.body.toLowerCase().includes(normalizedQuery) ||
      note.tags.some((t) => t.toLowerCase().includes(normalizedQuery)) ||
      note.id.toLowerCase().includes(normalizedQuery)
    );
  });
}

export function extractUniqueTags(notes: NoteItem[]): string[] {
  const tags = new Set<string>();
  notes.forEach((note) => {
    note.tags.forEach((tag) => tags.add(tag));
  });
  return Array.from(tags).sort((a, b) => a.localeCompare(b));
}

export function formatShortTimestamp(isoString: string): string {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) {
    return isoString;
  }
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function buildCurlSnippet(
  baseUrl: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  path: string,
  body?: unknown,
): string {
  const cleanBase = baseUrl.replace(/\/$/, '');
  const fullUrl = `${cleanBase}${path}`;

  if (method === 'GET' || method === 'DELETE') {
    return `curl -X ${method} "${fullUrl}"`;
  }

  const jsonBody = JSON.stringify(body ?? {}, null, 2);
  return `curl -X ${method} "${fullUrl}" \\\n  -H "Content-Type: application/json" \\\n  -d '${jsonBody}'`;
}

export interface VercelKitFile {
  path: string;
  purpose: string;
  code: string;
}

export const VERCEL_STANDALONE_FILES: VercelKitFile[] = [
  {
    path: 'vercel.json',
    purpose: 'Mengarahkan seluruh request (/notes, /notes/{id}) ke serverless function api/index.js.',
    code: `{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/api/index"
    }
  ]
}`,
  },
  {
    path: 'api/index.js',
    purpose: 'Adapter Vercel Serverless Function menggunakan server.initialize() dan server.inject().',
    code: `const createServer = require('../src/server');

let server;

const getServer = async () => {
  if (!server) {
    server = await createServer();
    await server.initialize();
  }
  return server;
};

const readRawBody = (req) => new Promise((resolve, reject) => {
  if (req.readableEnded || typeof req.on !== 'function' || req.readable === false) {
    resolve(Buffer.alloc(0));
    return;
  }
  const chunks = [];
  req.on('data', (chunk) => chunks.push(chunk));
  req.on('end', () => resolve(Buffer.concat(chunks)));
  req.on('error', reject);
});

module.exports = async (req, res) => {
  const app = await getServer();

  const headers = { ...req.headers };
  delete headers['content-length'];

  let payload;
  const hasBodyHeader = Boolean(
    req.headers['transfer-encoding'] || Number(req.headers['content-length'] || 0) > 0,
  );

  if (['POST', 'PUT', 'PATCH'].includes(req.method) || hasBodyHeader) {
    if (req.body !== undefined) {
      payload = typeof req.body === 'string' || Buffer.isBuffer(req.body)
        ? req.body
        : JSON.stringify(req.body);
    } else {
      const raw = await readRawBody(req);
      if (raw.length > 0) {
        payload = raw;
      }
    }
  }

  const response = await app.inject({
    method: req.method,
    url: req.url,
    headers,
    payload,
  });

  Object.entries(response.headers).forEach(([key, value]) => {
    if (value !== undefined) {
      res.setHeader(key, value);
    }
  });

  res.statusCode = response.statusCode;
  res.end(response.rawPayload);
};`,
  },
  {
    path: 'src/server.js',
    purpose: 'Mengekspor createServer() agar dapat dipakai Vercel sekaligus tetap bisa dijalankan lokal.',
    code: `const Hapi = require('@hapi/hapi');
const routes = require('./routes');

const createServer = async () => {
  const server = Hapi.server({
    port: process.env.PORT || 5000,
    host: process.env.NODE_ENV !== 'production' ? 'localhost' : '0.0.0.0',
    routes: {
      cors: {
        origin: ['*'],
      },
    },
  });

  server.route(routes);

  return server;
};

if (require.main === module) {
  const init = async () => {
    const server = await createServer();
    await server.start();
    console.log(\`Server berjalan pada \${server.info.uri}\`);
  };

  init();
}

module.exports = createServer;`,
  },
  {
    path: 'supabase/schema.sql',
    purpose: 'Script SQL untuk membuat tabel notes di Supabase SQL Editor.',
    code: `CREATE TABLE IF NOT EXISTS public.notes (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  tags TEXT[] NOT NULL DEFAULT '{}',
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS notes_created_at_idx ON public.notes (created_at DESC);
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;`,
  },
  {
    path: 'src/handler.js (Supabase)',
    purpose: 'Handler Hapi.js JavaScript biasa yang membaca/menulis ke tabel notes di Supabase.',
    code: `const { nanoid } = require('nanoid');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

const mapRow = (row) => ({
  id: row.id,
  title: row.title,
  tags: Array.isArray(row.tags) ? row.tags : [],
  body: row.body,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const getAllNotesHandler = async () => {
  const { data, error } = await supabase
    .from('notes')
    .select('id, title, tags, body, created_at, updated_at')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return { status: 'success', data: { notes: (data || []).map(mapRow) } };
};

const addNoteHandler = async (request, h) => {
  const { title, tags = [], body } = request.payload || {};
  const id = nanoid(16);
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('notes')
    .insert({ id, title, tags, body, created_at: now, updated_at: now })
    .select()
    .single();

  if (error) return h.response({ status: 'fail', message: error.message }).code(500);
  return h.response({
    status: 'success',
    message: 'Catatan berhasil ditambahkan',
    data: { noteId: data.id, note: mapRow(data) },
  }).code(201);
};`,
  },
];
