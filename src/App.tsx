import { useCallback, useEffect, useState } from 'react';
import { TopBar } from './components/TopBar';
import { NotesWorkspace } from './components/NotesWorkspace';
import {
  parseTagsInput,
  validateNoteDraft,
  type ApiExchangeLog,
  type NoteDraft,
  type NoteItem,
  type NoteValidationResult,
} from './utils/notesHelpers';

const EMPTY_DRAFT: NoteDraft = {
  title: '',
  tagsInput: '',
  body: '',
};

export default function App() {
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [storageMode, setStorageMode] = useState<string>('memory-fallback');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<NoteDraft>(EMPTY_DRAFT);
  const [validationErrors, setValidationErrors] = useState<NoteValidationResult['errors']>({});
  const [submitting, setSubmitting] = useState(false);
  const [lastExchange, setLastExchange] = useState<ApiExchangeLog | null>(null);

  const callApi = useCallback(
    async (
      method: ApiExchangeLog['method'],
      path: string,
      requestBody?: unknown,
    ) => {
      const started = performance.now();
      const response = await fetch(path, {
        method,
        headers:
          requestBody !== undefined
            ? { 'Content-Type': 'application/json' }
            : undefined,
        body: requestBody !== undefined ? JSON.stringify(requestBody) : undefined,
      });

      const responseBody = await response.json().catch(() => ({}));
      const durationMs = Math.max(1, Math.round(performance.now() - started));

      setLastExchange({
        method,
        path,
        status: response.status,
        durationMs,
        timestamp: new Date().toISOString(),
        requestBody,
        responseBody,
      });

      return { response, responseBody };
    },
    [],
  );

  const fetchNotes = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const { response, responseBody } = await callApi('GET', '/notes');
      if (!response.ok) {
        throw new Error(responseBody?.message || 'Gagal memuat catatan');
      }
      const fetched: NoteItem[] = responseBody?.data?.notes ?? [];
      if (responseBody?.data?.storage) {
        setStorageMode(responseBody.data.storage);
      }
      setNotes(fetched);
      if (fetched.length > 0 && !selectedId) {
        setSelectedId(fetched[0].id);
      }
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Terjadi kesalahan jaringan');
    } finally {
      setLoading(false);
    }
  }, [callApi, selectedId]);

  useEffect(() => {
    fetchNotes();
    // Initial load only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleInspectById = async (id: string) => {
    try {
      await callApi('GET', `/notes/${encodeURIComponent(id)}`);
    } catch {
      // Errors are captured in lastExchange
    }
  };

  const handleResetToNew = () => {
    setEditingId(null);
    setDraft(EMPTY_DRAFT);
    setValidationErrors({});
    const titleInput = document.getElementById('note-title');
    titleInput?.focus();
  };

  const handleStartEdit = (note: NoteItem) => {
    setSelectedId(note.id);
    setEditingId(note.id);
    setDraft({
      title: note.title,
      tagsInput: note.tags.join(', '),
      body: note.body,
    });
    setValidationErrors({});
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setDraft(EMPTY_DRAFT);
    setValidationErrors({});
  };

  const handleSubmitDraft = async (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateNoteDraft(draft);
    setValidationErrors(validation.errors);
    if (!validation.valid) {
      return;
    }

    const payload = {
      title: draft.title.trim(),
      tags: parseTagsInput(draft.tagsInput),
      body: draft.body.trim(),
    };

    setSubmitting(true);
    try {
      if (editingId) {
        const { response } = await callApi(
          'PUT',
          `/notes/${encodeURIComponent(editingId)}`,
          payload,
        );
        if (response.ok) {
          setEditingId(null);
          setDraft(EMPTY_DRAFT);
          const listResult = await fetch('/notes').then((r) => r.json());
          setNotes(listResult?.data?.notes ?? []);
        }
      } else {
        const { response, responseBody } = await callApi('POST', '/notes', payload);
        if (response.ok) {
          const createdId = responseBody?.data?.noteId ?? null;
          setDraft(EMPTY_DRAFT);
          if (createdId) {
            setSelectedId(createdId);
          }
          const listResult = await fetch('/notes').then((r) => r.json());
          setNotes(listResult?.data?.notes ?? []);
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteNote = async (note: NoteItem) => {
    const { response } = await callApi(
      'DELETE',
      `/notes/${encodeURIComponent(note.id)}`,
    );
    if (response.ok) {
      if (editingId === note.id) {
        setEditingId(null);
        setDraft(EMPTY_DRAFT);
      }
      if (selectedId === note.id) {
        setSelectedId(null);
      }
      const listResult = await fetch('/notes').then((r) => r.json());
      setNotes(listResult?.data?.notes ?? []);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <TopBar onNewNote={handleResetToNew} />

      <main className="flex-1 max-w-[1360px] w-full mx-auto px-4 sm:px-8 py-8">
        <NotesWorkspace
          notes={notes}
          storageMode={storageMode}
          loading={loading}
          loadError={loadError}
          selectedId={selectedId}
          editingId={editingId}
          draft={draft}
          validationErrors={validationErrors}
          submitting={submitting}
          lastExchange={lastExchange}
          onDraftChange={(next) => {
            setDraft(next);
            if (Object.keys(validationErrors).length > 0) {
              setValidationErrors(validateNoteDraft(next).errors);
            }
          }}
          onSubmitDraft={handleSubmitDraft}
          onSelectNote={(note) => setSelectedId(note.id)}
          onStartEdit={handleStartEdit}
          onCancelEdit={handleCancelEdit}
          onDeleteNote={handleDeleteNote}
          onRefreshNotes={fetchNotes}
          onInspectById={handleInspectById}
          onResetToNew={handleResetToNew}
        />
      </main>
    </div>
  );
}
