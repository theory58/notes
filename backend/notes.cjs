const notes = [
  {
    id: 'seed-vercel-001',
    title: 'Konfigurasi Serverless Hapi.js di Vercel',
    tags: ['vercel', 'hapi', 'backend'],
    body: 'Entry point api/index.cjs menggunakan server.initialize() dan server.inject() agar Hapi berjalan stateless tanpa membuka port TCP.',
    createdAt: '2026-11-16T08:00:00.000Z',
    updatedAt: '2026-11-16T08:00:00.000Z',
  },
  {
    id: 'seed-cors-002',
    title: 'Endpoint CRUD Notes App',
    tags: ['rest-api', 'crud'],
    body: 'Mendukung GET /notes, POST /notes, GET /notes/{id}, PUT /notes/{id}, dan DELETE /notes/{id} dengan header CORS origin *.',
    createdAt: '2026-11-16T08:15:00.000Z',
    updatedAt: '2026-11-16T08:15:00.000Z',
  },
];

module.exports = notes;
