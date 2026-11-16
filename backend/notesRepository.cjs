const { nanoid } = require('nanoid');
const seedNotes = require('./notes.cjs');
const { getSupabaseClient } = require('./supabase.cjs');

const mapRowToNote = (row) => ({
  id: row.id,
  title: row.title,
  tags: Array.isArray(row.tags) ? row.tags : [],
  body: row.body,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const createSupabaseNotesRepository = (supabase) => ({
  mode: 'supabase',

  async list() {
    const { data, error } = await supabase
      .from('notes')
      .select('id, title, tags, body, created_at, updated_at')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Supabase list error: ${error.message}`);
    }

    return (data || []).map(mapRowToNote);
  },

  async getById(id) {
    const { data, error } = await supabase
      .from('notes')
      .select('id, title, tags, body, created_at, updated_at')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw new Error(`Supabase getById error: ${error.message}`);
    }

    return data ? mapRowToNote(data) : null;
  },

  async create({ title, tags, body }) {
    const id = nanoid(16);
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('notes')
      .insert({
        id,
        title,
        tags,
        body,
        created_at: now,
        updated_at: now,
      })
      .select('id, title, tags, body, created_at, updated_at')
      .single();

    if (error) {
      throw new Error(`Supabase create error: ${error.message}`);
    }

    return mapRowToNote(data);
  },

  async update(id, { title, tags, body }) {
    const updatedAt = new Date().toISOString();

    const { data, error } = await supabase
      .from('notes')
      .update({
        title,
        tags,
        body,
        updated_at: updatedAt,
      })
      .eq('id', id)
      .select('id, title, tags, body, created_at, updated_at')
      .maybeSingle();

    if (error) {
      throw new Error(`Supabase update error: ${error.message}`);
    }

    return data ? mapRowToNote(data) : null;
  },

  async remove(id) {
    const { data, error } = await supabase
      .from('notes')
      .delete()
      .eq('id', id)
      .select('id')
      .maybeSingle();

    if (error) {
      throw new Error(`Supabase delete error: ${error.message}`);
    }

    return Boolean(data);
  },
});

const createMemoryNotesRepository = (store = seedNotes) => ({
  mode: 'memory-fallback',

  async list() {
    return store;
  },

  async getById(id) {
    return store.find((n) => n.id === id) || null;
  },

  async create({ title, tags, body }) {
    const id = nanoid(16);
    const createdAt = new Date().toISOString();
    const newNote = {
      id,
      title,
      tags,
      body,
      createdAt,
      updatedAt: createdAt,
    };
    store.unshift(newNote);
    return newNote;
  },

  async update(id, { title, tags, body }) {
    const index = store.findIndex((n) => n.id === id);
    if (index === -1) {
      return null;
    }
    const updated = {
      ...store[index],
      title,
      tags: Array.isArray(tags) ? tags : store[index].tags,
      body,
      updatedAt: new Date().toISOString(),
    };
    store.splice(index, 1, updated);
    return updated;
  },

  async remove(id) {
    const index = store.findIndex((n) => n.id === id);
    if (index === -1) {
      return false;
    }
    store.splice(index, 1);
    return true;
  },
});

const memoryRepo = createMemoryNotesRepository(seedNotes);

const getNotesRepository = () => {
  const client = getSupabaseClient();
  if (client) {
    return createSupabaseNotesRepository(client);
  }
  return memoryRepo;
};

module.exports = {
  mapRowToNote,
  createSupabaseNotesRepository,
  createMemoryNotesRepository,
  getNotesRepository,
};
