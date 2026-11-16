import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildCurlSnippet,
  extractUniqueTags,
  filterNotes,
  parseTagsInput,
  validateNoteDraft,
  type NoteItem,
} from './notesHelpers';

const sampleNotes: NoteItem[] = [
  {
    id: 'n-1',
    title: 'Deploy Hapi ke Vercel',
    tags: ['vercel', 'backend'],
    body: 'Gunakan server.inject agar stateless.',
    createdAt: '2026-11-16T08:00:00.000Z',
    updatedAt: '2026-11-16T08:00:00.000Z',
  },
  {
    id: 'n-2',
    title: 'Setup CORS Origin',
    tags: ['hapi', 'backend'],
    body: 'Origin diset wildcard untuk frontend.',
    createdAt: '2026-11-16T08:05:00.000Z',
    updatedAt: '2026-11-16T08:05:00.000Z',
  },
];

test('parseTagsInput trims whitespace, removes empties and duplicates', () => {
  assert.deepEqual(parseTagsInput(' vercel, hapi , , vercel , backend '), [
    'vercel',
    'hapi',
    'backend',
  ]);
  assert.deepEqual(parseTagsInput('   '), []);
});

test('validateNoteDraft catches empty title or body', () => {
  const emptyResult = validateNoteDraft({ title: '  ', tagsInput: '', body: '' });
  assert.equal(emptyResult.valid, false);
  assert.ok(emptyResult.errors.title);
  assert.ok(emptyResult.errors.body);

  const validResult = validateNoteDraft({
    title: 'Judul Valid',
    tagsInput: 'api',
    body: 'Konten valid',
  });
  assert.equal(validResult.valid, true);
  assert.deepEqual(validResult.errors, {});
});

test('filterNotes filters by query text and selected tag', () => {
  assert.equal(filterNotes(sampleNotes, '', 'all').length, 2);
  assert.equal(filterNotes(sampleNotes, 'inject', 'all').length, 1);
  assert.equal(filterNotes(sampleNotes, '', 'vercel').length, 1);
  assert.equal(filterNotes(sampleNotes, 'cors', 'vercel').length, 0);
});

test('extractUniqueTags returns sorted unique tags', () => {
  assert.deepEqual(extractUniqueTags(sampleNotes), ['backend', 'hapi', 'vercel']);
});

test('buildCurlSnippet formats GET and POST commands accurately', () => {
  assert.equal(
    buildCurlSnippet('https://notes.vercel.app/', 'GET', '/notes'),
    'curl -X GET "https://notes.vercel.app/notes"',
  );

  const postCmd = buildCurlSnippet('https://notes.vercel.app', 'POST', '/notes', {
    title: 'Test',
  });
  assert.match(postCmd, /curl -X POST "https:\/\/notes\.vercel\.app\/notes"/);
  assert.match(postCmd, /-H "Content-Type: application\/json"/);
});
