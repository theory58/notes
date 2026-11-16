import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { EventEmitter } from 'node:events';

const require = createRequire(import.meta.url);
const vercelHandler = require('../api/index.cjs');
const { createSupabaseNotesRepository, mapRowToNote } = require('./notesRepository.cjs');

interface MockReq extends EventEmitter {
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: unknown;
}

function invokeHandler(
  method: string,
  url: string,
  body?: unknown,
): Promise<{ statusCode: number; headers: Record<string, unknown>; json: any }> {
  return new Promise((resolve, reject) => {
    const req = new EventEmitter() as MockReq;
    req.method = method;
    req.url = url;
    req.headers = {
      'content-type': 'application/json',
    };
    if (body !== undefined) {
      req.body = body;
    }

    const resHeaders: Record<string, unknown> = {};
    const res = {
      statusCode: 200,
      setHeader(key: string, value: unknown) {
        resHeaders[key.toLowerCase()] = value;
      },
      end(chunk?: Buffer | string) {
        const text = chunk ? chunk.toString('utf8') : '';
        let parsed = null;
        try {
          parsed = text ? JSON.parse(text) : null;
        } catch {
          parsed = text;
        }
        resolve({
          statusCode: res.statusCode,
          headers: resHeaders,
          json: parsed,
        });
      },
    };

    Promise.resolve(vercelHandler(req, res)).catch(reject);
  });
}

test('Vercel Hapi adapter supports full CRUD lifecycle for /notes', async () => {
  const health = await invokeHandler('GET', '/api/health');
  assert.equal(health.statusCode, 200);
  assert.equal(health.json.status, 'success');

  const invalid = await invokeHandler('POST', '/notes', {
    title: '',
    tags: ['test'],
    body: 'Body ada',
  });
  assert.equal(invalid.statusCode, 400);
  assert.equal(invalid.json.status, 'fail');

  const created = await invokeHandler('POST', '/notes', {
    title: 'Catatan Uji Vercel',
    tags: ['vercel', 'hapi'],
    body: 'Berhasil berjalan via serverless inject',
  });
  assert.equal(created.statusCode, 201);
  assert.equal(created.json.status, 'success');
  const noteId = created.json.data.noteId;
  assert.ok(noteId);

  const listRes = await invokeHandler('GET', '/notes');
  assert.equal(listRes.statusCode, 200);
  assert.ok(listRes.json.data.notes.some((n: any) => n.id === noteId));

  const getByIdRes = await invokeHandler('GET', `/notes/${noteId}`);
  assert.equal(getByIdRes.statusCode, 200);
  assert.equal(getByIdRes.json.data.note.title, 'Catatan Uji Vercel');

  const updateRes = await invokeHandler('PUT', `/notes/${noteId}`, {
    title: 'Catatan Uji Diperbarui',
    tags: ['vercel', 'updated'],
    body: 'Konten sudah diperbarui',
  });
  assert.equal(updateRes.statusCode, 200);
  assert.equal(updateRes.json.data.note.title, 'Catatan Uji Diperbarui');

  const deleteRes = await invokeHandler('DELETE', `/notes/${noteId}`);
  assert.equal(deleteRes.statusCode, 200);

  const afterDelete = await invokeHandler('GET', `/notes/${noteId}`);
  assert.equal(afterDelete.statusCode, 404);
});

test('Supabase repository maps snake_case rows and executes CRUD queries', async () => {
  const rows: any[] = [];

  const mockSupabase = {
    from(table: string) {
      assert.equal(table, 'notes');
      return {
        select() {
          return {
            async order() {
              return { data: [...rows], error: null };
            },
            eq(_col: string, val: string) {
              return {
                async maybeSingle() {
                  const found = rows.find((r) => r.id === val) || null;
                  return { data: found, error: null };
                },
              };
            },
          };
        },
        insert(payload: any) {
          rows.unshift(payload);
          return {
            select() {
              return {
                async single() {
                  return { data: payload, error: null };
                },
              };
            },
          };
        },
        update(patch: any) {
          return {
            eq(_col: string, val: string) {
              return {
                select() {
                  return {
                    async maybeSingle() {
                      const idx = rows.findIndex((r) => r.id === val);
                      if (idx === -1) return { data: null, error: null };
                      rows[idx] = { ...rows[idx], ...patch };
                      return { data: rows[idx], error: null };
                    },
                  };
                },
              };
            },
          };
        },
        delete() {
          return {
            eq(_col: string, val: string) {
              return {
                select() {
                  return {
                    async maybeSingle() {
                      const idx = rows.findIndex((r) => r.id === val);
                      if (idx === -1) return { data: null, error: null };
                      const [removed] = rows.splice(idx, 1);
                      return { data: { id: removed.id }, error: null };
                    },
                  };
                },
              };
            },
          };
        },
      };
    },
  };

  const repo = createSupabaseNotesRepository(mockSupabase);
  assert.equal(repo.mode, 'supabase');

  const created = await repo.create({
    title: 'Supabase Test',
    tags: ['postgres', 'supabase'],
    body: 'Disimpan ke tabel public.notes',
  });
  assert.equal(created.title, 'Supabase Test');
  assert.ok(created.createdAt);

  const list = await repo.list();
  assert.equal(list.length, 1);
  assert.equal(list[0].id, created.id);

  const fetched = await repo.getById(created.id);
  assert.equal(fetched.body, 'Disimpan ke tabel public.notes');

  const updated = await repo.update(created.id, {
    title: 'Supabase Updated',
    tags: ['postgres'],
    body: 'Konten diperbarui',
  });
  assert.equal(updated.title, 'Supabase Updated');

  const deleted = await repo.remove(created.id);
  assert.equal(deleted, true);

  const missing = await repo.getById(created.id);
  assert.equal(missing, null);

  const mapped = mapRowToNote({
    id: 'abc',
    title: 'Row',
    tags: null,
    body: 'Text',
    created_at: '2026-11-16T00:00:00.000Z',
    updated_at: '2026-11-16T00:00:00.000Z',
  });
  assert.deepEqual(mapped.tags, []);
  assert.equal(mapped.createdAt, '2026-11-16T00:00:00.000Z');
});

test('Invalid SUPABASE_URL falls back cleanly without crashing getNoteByIdHandler', async () => {
  const prevUrl = process.env.SUPABASE_URL;
  const prevKey = process.env.SUPABASE_KEY;
  try {
    process.env.SUPABASE_URL = 'invalid-project-id';
    process.env.SUPABASE_KEY = 'dummy-key';
    const res = await invokeHandler('GET', '/notes/seed-vercel-001');
    assert.equal(res.statusCode, 200);
    assert.equal(res.json.status, 'success');
  } finally {
    if (prevUrl === undefined) delete process.env.SUPABASE_URL;
    else process.env.SUPABASE_URL = prevUrl;
    if (prevKey === undefined) delete process.env.SUPABASE_KEY;
    else process.env.SUPABASE_KEY = prevKey;
  }
});
