-- Jalankan script ini di Supabase Dashboard -> SQL Editor
CREATE TABLE IF NOT EXISTS public.notes (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  tags TEXT[] NOT NULL DEFAULT '{}',
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS notes_created_at_idx ON public.notes (created_at DESC);

-- Aktifkan RLS agar akses publik langsung (anon) diblokir secara default.
-- Backend Express/Hapi menggunakan SUPABASE_SERVICE_ROLE_KEY (SUPABASE_KEY) di server
-- sehingga tetap bisa membaca/menulis tabel ini secara aman.
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
