const { getNotesRepository } = require('./notesRepository.cjs');

const normalizeTags = (tags, fallback = []) => (
  Array.isArray(tags)
    ? tags.map((tag) => String(tag).trim()).filter(Boolean)
    : fallback
);

const addNoteHandler = async (request, h) => {
  const payload = request.payload || {};
  const { title, tags, body } = payload;

  if (typeof title !== 'string' || title.trim() === '') {
    return h
      .response({
        status: 'fail',
        message: 'Gagal menambahkan catatan. Mohon isi judul catatan',
      })
      .code(400);
  }

  if (typeof body !== 'string' || body.trim() === '') {
    return h
      .response({
        status: 'fail',
        message: 'Gagal menambahkan catatan. Mohon isi konten catatan',
      })
      .code(400);
  }

  try {
    const repo = getNotesRepository();
    const newNote = await repo.create({
      title: title.trim(),
      tags: normalizeTags(tags, []),
      body: body.trim(),
    });

    return h
      .response({
        status: 'success',
        message: 'Catatan berhasil ditambahkan',
        data: {
          noteId: newNote.id,
          note: newNote,
        },
      })
      .code(201);
  } catch (err) {
    console.error('addNoteHandler error:', err);
    return h
      .response({
        status: 'error',
        message: 'Catatan gagal ditambahkan ke database',
      })
      .code(500);
  }
};

const getAllNotesHandler = async (_request, h) => {
  try {
    const repo = getNotesRepository();
    const notes = await repo.list();
    return {
      status: 'success',
      data: {
        notes,
        storage: repo.mode,
      },
    };
  } catch (err) {
    console.error('getAllNotesHandler error:', err);
    return h
      .response({
        status: 'error',
        message: 'Gagal mengambil daftar catatan dari database',
      })
      .code(500);
  }
};

const getNoteByIdHandler = async (request, h) => {
  const { id } = request.params;

  try {
    const repo = getNotesRepository();
    const note = await repo.getById(id);

    if (note) {
      return {
        status: 'success',
        data: {
          note,
        },
      };
    }

    return h
      .response({
        status: 'fail',
        message: 'Catatan tidak ditemukan',
      })
      .code(404);
  } catch (err) {
    console.error('getNoteByIdHandler error:', err);
    return h
      .response({
        status: 'error',
        message: 'Gagal mengambil detail catatan dari database',
      })
      .code(500);
  }
};

const editNoteByIdHandler = async (request, h) => {
  const { id } = request.params;
  const payload = request.payload || {};
  const { title, tags, body } = payload;

  if (typeof title !== 'string' || title.trim() === '') {
    return h
      .response({
        status: 'fail',
        message: 'Gagal memperbarui catatan. Mohon isi judul catatan',
      })
      .code(400);
  }

  if (typeof body !== 'string' || body.trim() === '') {
    return h
      .response({
        status: 'fail',
        message: 'Gagal memperbarui catatan. Mohon isi konten catatan',
      })
      .code(400);
  }

  try {
    const repo = getNotesRepository();
    const updatedNote = await repo.update(id, {
      title: title.trim(),
      tags: Array.isArray(tags) ? normalizeTags(tags, []) : undefined,
      body: body.trim(),
    });

    if (updatedNote) {
      return h
        .response({
          status: 'success',
          message: 'Catatan berhasil diperbarui',
          data: {
            note: updatedNote,
          },
        })
        .code(200);
    }

    return h
      .response({
        status: 'fail',
        message: 'Gagal memperbarui catatan. Id tidak ditemukan',
      })
      .code(404);
  } catch (err) {
    console.error('editNoteByIdHandler error:', err);
    return h
      .response({
        status: 'error',
        message: 'Gagal memperbarui catatan di database',
      })
      .code(500);
  }
};

const deleteNoteByIdHandler = async (request, h) => {
  const { id } = request.params;

  try {
    const repo = getNotesRepository();
    const deleted = await repo.remove(id);

    if (deleted) {
      return h
        .response({
          status: 'success',
          message: 'Catatan berhasil dihapus',
        })
        .code(200);
    }

    return h
      .response({
        status: 'fail',
        message: 'Catatan gagal dihapus. Id tidak ditemukan',
      })
      .code(404);
  } catch (err) {
    console.error('deleteNoteByIdHandler error:', err);
    return h
      .response({
        status: 'error',
        message: 'Gagal menghapus catatan di database',
      })
      .code(500);
  }
};

const healthCheckHandler = async () => {
  const repo = getNotesRepository();
  return {
    status: 'success',
    message: 'Hapi.js Notes API siap digunakan',
    data: {
      runtime: process.env.VERCEL ? 'vercel-serverless' : 'node-server',
      storage: repo.mode,
    },
  };
};

module.exports = {
  addNoteHandler,
  getAllNotesHandler,
  getNoteByIdHandler,
  editNoteByIdHandler,
  deleteNoteByIdHandler,
  healthCheckHandler,
};
