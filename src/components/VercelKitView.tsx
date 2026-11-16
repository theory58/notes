import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { VERCEL_STANDALONE_FILES } from '../utils/notesHelpers';

const ENDPOINTS = [
  { method: 'POST', path: '/notes', desc: 'Menambahkan catatan baru dan mengembalikan noteId (201 Created)' },
  { method: 'GET', path: '/notes', desc: 'Mengambil seluruh daftar catatan (200 OK)' },
  { method: 'GET', path: '/notes/{id}', desc: 'Mengambil detail satu catatan berdasarkan ID (200 OK / 404)' },
  { method: 'PUT', path: '/notes/{id}', desc: 'Memperbarui judul, tags, dan isi catatan (200 OK / 404)' },
  { method: 'DELETE', path: '/notes/{id}', desc: 'Menghapus catatan berdasarkan ID (200 OK / 404)' },
  { method: 'GET', path: '/api/health', desc: 'Memeriksa kesiapan runtime Vercel Serverless (200 OK)' },
];

export function VercelKitView() {
  const [copiedPath, setCopiedPath] = useState<string | null>(null);

  const handleCopy = async (path: string, code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedPath(path);
      setTimeout(() => setCopiedPath(null), 1800);
    } catch {
      setCopiedPath(null);
    }
  };

  return (
    <div className="space-y-8">
      <section className="space-y-2 pb-6 border-b border-slate-200 max-w-3xl">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 text-balance">
          Struktur File Siap Deploy di Vercel
        </h1>
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
          Project ini sudah dikonfigurasi dengan <code className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded text-slate-800 whitespace-nowrap">api/index.cjs</code> dan <code className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded text-slate-800 whitespace-nowrap">vercel.json</code> agar bisa langsung di-deploy dari repository ini, atau salin 3 file berikut jika Anda ingin memperbarui repo GitHub asli (<code className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded text-slate-800 whitespace-nowrap">theory58/notes-app-back-end</code>) saja.
        </p>
      </section>

      <section aria-label="Daftar endpoint REST API" className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200">
          <h2 className="text-base font-semibold text-slate-900">
            Endpoint REST API Aktif
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                <th className="py-2.5 px-5 w-24">Method</th>
                <th className="py-2.5 px-5 w-48">Path</th>
                <th className="py-2.5 px-5">Fungsi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {ENDPOINTS.map((ep) => (
                <tr key={`${ep.method}-${ep.path}`} className="hover:bg-slate-50">
                  <td className="py-3 px-5 font-mono text-xs font-semibold text-blue-700">
                    {ep.method}
                  </td>
                  <td className="py-3 px-5 font-mono text-xs text-slate-900">
                    {ep.path}
                  </td>
                  <td className="py-3 px-5 text-slate-600">{ep.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-label="Salin konfigurasi standalone untuk GitHub" className="space-y-5">
        <h2 className="text-lg font-semibold text-slate-900">
          Kode untuk Repo Backend Standalone (CommonJS)
        </h2>

        {VERCEL_STANDALONE_FILES.map((file) => {
          const isCopied = copiedPath === file.path;
          return (
            <article
              key={file.path}
              className="bg-white border border-slate-200 rounded-xl overflow-hidden"
            >
              <div className="px-5 py-3.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="font-mono text-sm font-semibold text-slate-900">
                    {file.path}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">{file.purpose}</p>
                </div>

                <button
                  type="button"
                  onClick={() => handleCopy(file.path, file.code)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  {isCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
                      <span>Disalin</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Salin Kode</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="p-4 sm:p-5 bg-slate-900 text-slate-100 font-mono text-xs overflow-x-auto leading-relaxed">
                {file.code}
              </pre>
            </article>
          );
        })}
      </section>
    </div>
  );
}
