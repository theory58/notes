export function DeployGuideView() {
  return (
    <div className="space-y-8 max-w-4xl">
      <section className="space-y-2 pb-6 border-b border-slate-200">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 text-balance">
          Langkah Deploy ke Vercel + Supabase
        </h1>
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
          Project ini sudah terintegrasi dengan <code className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">@supabase/supabase-js</code>. Jika variabel environment Supabase belum diisi, backend otomatis menggunakan memory fallback untuk preview lokal.
        </p>
      </section>

      <ol className="space-y-4">
        <li className="bg-white border border-slate-200 rounded-xl p-5 space-y-2">
          <h2 className="text-base font-semibold text-slate-900">
            01. Buat Project & Tabel di Supabase
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Buat project gratis di Supabase, lalu buka <strong>SQL Editor</strong> dan jalankan query dari file <code className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">supabase/schema.sql</code> untuk membuat tabel <code className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">public.notes</code>.
          </p>
          <pre className="p-3.5 bg-slate-900 text-slate-100 rounded-lg font-mono text-xs overflow-x-auto">
{`CREATE TABLE IF NOT EXISTS public.notes (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  tags TEXT[] NOT NULL DEFAULT '{}',
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;`}
          </pre>
        </li>

        <li className="bg-white border border-slate-200 rounded-xl p-5 space-y-2">
          <h2 className="text-base font-semibold text-slate-900">
            02. Push Perubahan ke GitHub
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Commit seluruh file termasuk <code className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">vercel.json</code>, <code className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">api/index.cjs</code>, dan <code className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">backend/</code> lalu push ke GitHub Anda.
          </p>
          <pre className="p-3.5 bg-slate-900 text-slate-100 rounded-lg font-mono text-xs overflow-x-auto">
{`git add .
git commit -m "feat: integrate supabase and vercel serverless"
git push origin master`}
          </pre>
        </li>

        <li className="bg-white border border-slate-200 rounded-xl p-5 space-y-2">
          <h2 className="text-base font-semibold text-slate-900">
            03. Tambahkan Environment Variables di Vercel
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Di dashboard Vercel → <strong>Project Settings → Environment Variables</strong>, tambahkan dua variabel berikut dari menu <strong>Project Settings → API</strong> di Supabase (gunakan <strong>service_role secret key</strong> khusus di server):
          </p>
          <pre className="p-3.5 bg-slate-900 text-slate-100 rounded-lg font-mono text-xs overflow-x-auto">
{`SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_KEY=your-supabase-service-role-key`}
          </pre>
        </li>

        <li className="bg-white border border-slate-200 rounded-xl p-5 space-y-2">
          <h2 className="text-base font-semibold text-slate-900">
            04. Deploy & Verifikasi Endpoint
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Klik <strong>Deploy</strong> (atau Redeploy setelah mengisi Environment Variables). Buka <code className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">/api/health</code> untuk memastikan field <code className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">storage</code> sudah bernilai <code className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">&quot;supabase&quot;</code>, lalu arahkan frontend atau Postman ke endpoint <code className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">/notes</code>.
          </p>
        </li>
      </ol>
    </div>
  );
}
