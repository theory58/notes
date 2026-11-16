import { useState } from 'react';
import { Check, Copy, Pencil, RefreshCw, Search, Trash2 } from 'lucide-react';
import {
  buildCurlSnippet,
  extractUniqueTags,
  filterNotes,
  formatShortTimestamp,
  type ApiExchangeLog,
  type NoteDraft,
  type NoteItem,
  type NoteValidationResult,
} from '../utils/notesHelpers';

interface NotesWorkspaceProps {
  notes: NoteItem[];
  storageMode: string;
  loading: boolean;
  loadError: string | null;
  selectedId: string | null;
  editingId: string | null;
  draft: NoteDraft;
  validationErrors: NoteValidationResult['errors'];
  submitting: boolean;
  lastExchange: ApiExchangeLog | null;
  onDraftChange: (next: NoteDraft) => void;
  onSubmitDraft: (e: React.FormEvent) => void;
  onSelectNote: (note: NoteItem) => void;
  onStartEdit: (note: NoteItem) => void;
  onCancelEdit: () => void;
  onDeleteNote: (note: NoteItem) => void;
  onRefreshNotes: () => void;
  onInspectById: (id: string) => void;
  onResetToNew: () => void;
}

function formatStatusText(status: number): string {
  if (status === 200) return '200 OK';
  if (status === 201) return '201 Created';
  if (status === 400) return '400 Bad Request';
  if (status === 404) return '404 Not Found';
  if (status >= 500) return `${status} Server Error`;
  return String(status);
}

function statusToneClass(status: number): string {
  if (status >= 200 && status < 300) return 'text-emerald-700';
  if (status >= 400 && status < 500) return 'text-amber-700';
  return 'text-red-700';
}

export function NotesWorkspace({
  notes,
  storageMode,
  loading,
  loadError,
  selectedId,
  editingId,
  draft,
  validationErrors,
  submitting,
  lastExchange,
  onDraftChange,
  onSubmitDraft,
  onSelectNote,
  onStartEdit,
  onCancelEdit,
  onDeleteNote,
  onRefreshNotes,
  onInspectById,
  onResetToNew,
}: NotesWorkspaceProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTag, setActiveTag] = useState('all');
  const [copiedCurl, setCopiedCurl] = useState(false);

  const uniqueTags = extractUniqueTags(notes);
  const visibleNotes = filterNotes(notes, searchQuery, activeTag);

  const originUrl =
    typeof window !== 'undefined' ? window.location.origin : 'https://notes-api.vercel.app';

  const curlCommand = lastExchange
    ? buildCurlSnippet(
        originUrl,
        lastExchange.method,
        lastExchange.path,
        lastExchange.requestBody,
      )
    : buildCurlSnippet(originUrl, 'GET', '/notes');

  const handleCopyCurl = async () => {
    try {
      await navigator.clipboard.writeText(curlCommand);
      setCopiedCurl(true);
      setTimeout(() => setCopiedCurl(false), 1800);
    } catch {
      setCopiedCurl(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-slate-200">
        <div className="space-y-1.5 max-w-2xl">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 text-balance">
            Hapi.js Notes API siap deploy di Vercel
          </h1>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Seluruh request CRUD ke <code className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded text-slate-800">/notes</code> dijalankan langsung oleh Hapi.js melalui adapter serverless <code className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded text-slate-800">api/index.cjs</code>.
          </p>
        </div>

        <div className="flex items-center gap-6 shrink-0 text-sm">
          <div>
            <div className="text-xs text-slate-500">Total Catatan</div>
            <div className="text-xl font-bold text-slate-900 font-mono tabular-nums">
              {notes.length}
            </div>
          </div>
          <div className="h-8 w-px bg-slate-200" aria-hidden="true" />
          <div>
            <div className="text-xs text-slate-500">Penyimpanan Aktif</div>
            <div className="text-sm font-semibold text-slate-900 font-mono">
              {storageMode === 'supabase' ? 'Supabase Postgres' : 'Memory Fallback'}
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left column: Search, filter, and live notes list */}
        <section
          aria-label="Daftar catatan dari Hapi API"
          className="lg:col-span-5 bg-white border border-slate-200 rounded-xl overflow-hidden"
        >
          <div className="p-4 border-b border-slate-200 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-base font-semibold text-slate-900">
                Daftar Catatan ({visibleNotes.length})
              </h2>
              <button
                type="button"
                onClick={onRefreshNotes}
                aria-label="Muat ulang daftar catatan"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
                <span>GET /notes</span>
              </button>
            </div>

            <div className="relative">
              <label htmlFor="search-notes" className="sr-only">
                Cari catatan berdasarkan judul, isi, tag, atau ID
              </label>
              <Search
                className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
              <input
                id="search-notes"
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari judul, isi, tag, atau ID..."
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
              />
            </div>

            {uniqueTags.length > 0 && (
              <div
                role="group"
                aria-label="Filter berdasarkan tag"
                className="flex items-center gap-1.5 overflow-x-auto pb-0.5"
              >
                <button
                  type="button"
                  onClick={() => setActiveTag('all')}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                    activeTag === 'all'
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Semua
                </button>
                {uniqueTags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setActiveTag(tag)}
                    className={`px-2.5 py-1 text-xs font-medium rounded-md whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                      activeTag === tag
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            )}
          </div>

          {loadError && (
            <div role="alert" className="p-4 bg-red-50 border-b border-red-200 text-sm text-red-700">
              {loadError}
            </div>
          )}

          {loading && notes.length === 0 ? (
            <div className="p-4 space-y-3" aria-busy="true">
              <div className="h-16 bg-slate-100 rounded-lg animate-pulse" />
              <div className="h-16 bg-slate-100 rounded-lg animate-pulse" />
            </div>
          ) : visibleNotes.length === 0 ? (
            <div className="p-8 text-center space-y-3">
              <p className="text-sm font-medium text-slate-900">
                {notes.length === 0
                  ? 'Belum ada catatan tersimpan.'
                  : 'Tidak ada catatan yang cocok dengan pencarian.'}
              </p>
              <p className="text-xs text-slate-500">
                {notes.length === 0
                  ? 'Buat catatan pertama Anda melalui form di sebelah kanan untuk menguji POST /notes.'
                  : 'Coba ubah kata kunci pencarian atau pilih filter Semua.'}
              </p>
              {notes.length === 0 ? (
                <button
                  type="button"
                  onClick={onResetToNew}
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
                >
                  Buat Catatan Pertama
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setActiveTag('all');
                  }}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  Reset Filter
                </button>
              )}
            </div>
          ) : (
            <ul className="divide-y divide-slate-200">
              {visibleNotes.map((note) => {
                const isSelected = selectedId === note.id;
                const isEditingThis = editingId === note.id;
                return (
                  <li
                    key={note.id}
                    className={`p-4 transition-colors ${
                      isSelected ? 'bg-blue-50/60' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          onSelectNote(note);
                          onInspectById(note.id);
                        }}
                        className="text-left flex-1 min-w-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-blue-600 rounded"
                      >
                        <h3 className="text-sm font-semibold text-slate-900 truncate">
                          {note.title}
                        </h3>
                        <p className="mt-1 text-xs text-slate-600 line-clamp-2 leading-relaxed">
                          {note.body}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                          <span className="font-mono text-[11px] text-slate-500">
                            {note.id}
                          </span>
                          {note.tags.length > 0 && (
                            <span className="text-slate-600">{note.tags.join(', ')}</span>
                          )}
                          <span className="tabular-nums">
                            {formatShortTimestamp(note.updatedAt)}
                          </span>
                        </div>
                      </button>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => onStartEdit(note)}
                          aria-label={`Edit catatan ${note.title}`}
                          className={`p-2 rounded-lg transition-colors cursor-pointer ${
                            isEditingThis
                              ? 'bg-blue-600 text-white'
                              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                          }`}
                        >
                          <Pencil className="w-4 h-4" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteNote(note)}
                          aria-label={`Hapus catatan ${note.title}`}
                          className="p-2 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Right column: Create/Edit Form + Live HTTP Inspector */}
        <div className="lg:col-span-7 space-y-6">
          <section
            aria-label={editingId ? 'Form edit catatan' : 'Form tambah catatan'}
            className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6"
          >
            <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-200">
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  {editingId ? 'Perbarui Catatan' : 'Tambah Catatan Baru'}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5 font-mono">
                  {editingId ? `PUT /notes/${editingId}` : 'POST /notes'}
                </p>
              </div>
              {editingId && (
                <button
                  type="button"
                  onClick={onCancelEdit}
                  className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  Batal Edit
                </button>
              )}
            </div>

            <form onSubmit={onSubmitDraft} noValidate className="mt-4 space-y-4">
              <div>
                <label
                  htmlFor="note-title"
                  className="block text-sm font-medium text-slate-800 mb-1.5"
                >
                  Judul Catatan
                </label>
                <input
                  id="note-title"
                  type="text"
                  value={draft.title}
                  onChange={(e) =>
                    onDraftChange({ ...draft, title: e.target.value })
                  }
                  placeholder="Contoh: Integrasi Vercel Serverless"
                  aria-invalid={Boolean(validationErrors.title)}
                  aria-describedby={validationErrors.title ? 'note-title-error' : undefined}
                  className={`w-full px-3.5 py-2 text-sm rounded-lg border bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 ${
                    validationErrors.title ? 'border-red-500' : 'border-slate-300'
                  }`}
                />
                {validationErrors.title && (
                  <p id="note-title-error" role="alert" className="mt-1 text-xs text-red-600">
                    {validationErrors.title}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="note-tags"
                  className="block text-sm font-medium text-slate-800 mb-1.5"
                >
                  Tags (pisahkan dengan koma)
                </label>
                <input
                  id="note-tags"
                  type="text"
                  value={draft.tagsInput}
                  onChange={(e) =>
                    onDraftChange({ ...draft, tagsInput: e.target.value })
                  }
                  placeholder="vercel, hapi, backend"
                  className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label
                  htmlFor="note-body"
                  className="block text-sm font-medium text-slate-800 mb-1.5"
                >
                  Isi Catatan
                </label>
                <textarea
                  id="note-body"
                  rows={4}
                  value={draft.body}
                  onChange={(e) =>
                    onDraftChange({ ...draft, body: e.target.value })
                  }
                  placeholder="Tulis isi catatan yang akan dikirim ke endpoint Hapi.js..."
                  aria-invalid={Boolean(validationErrors.body)}
                  aria-describedby={validationErrors.body ? 'note-body-error' : undefined}
                  className={`w-full px-3.5 py-2 text-sm rounded-lg border bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 ${
                    validationErrors.body ? 'border-red-500' : 'border-slate-300'
                  }`}
                />
                {validationErrors.body && (
                  <p id="note-body-error" role="alert" className="mt-1 text-xs text-red-600">
                    {validationErrors.body}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-1">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  {submitting
                    ? 'Mengirim...'
                    : editingId
                      ? 'Perbarui Catatan'
                      : 'Simpan Catatan'}
                </button>
              </div>
            </form>
          </section>

          {/* Live HTTP Response Inspector */}
          <section
            aria-label="Inspektur respons HTTP Hapi.js"
            className="bg-white border border-slate-200 rounded-xl overflow-hidden"
          >
            <div className="px-5 py-3.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3 text-xs sm:text-sm">
                <span className="font-semibold text-slate-900">
                  Respons API Terakhir
                </span>
                {lastExchange && (
                  <>
                    <span aria-hidden="true" className="text-slate-300">/</span>
                    <span className="font-mono font-semibold text-slate-800">
                      {lastExchange.method} {lastExchange.path}
                    </span>
                    <span aria-hidden="true" className="text-slate-300">/</span>
                    <span className={`font-mono font-semibold tabular-nums ${statusToneClass(lastExchange.status)}`}>
                      {formatStatusText(lastExchange.status)}
                    </span>
                    <span aria-hidden="true" className="text-slate-300">/</span>
                    <span className="font-mono text-slate-500 tabular-nums">
                      {lastExchange.durationMs} ms
                    </span>
                  </>
                )}
              </div>

              <button
                type="button"
                onClick={handleCopyCurl}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                {copiedCurl ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
                    <span>cURL Disalin</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Salin cURL</span>
                  </>
                )}
              </button>
            </div>

            <div className="p-4 sm:p-5 bg-slate-900 text-slate-100 font-mono text-xs overflow-x-auto">
              <pre className="leading-relaxed">
                {lastExchange
                  ? JSON.stringify(lastExchange.responseBody, null, 2)
                  : '{\n  "status": "idle",\n  "message": "Memuat GET /notes..."\n}'}
              </pre>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
