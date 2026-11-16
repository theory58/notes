const { createClient } = require('@supabase/supabase-js');

let cachedClient = null;
let cachedKeySignature = null;

const isValidHttpUrl = (value) => {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

const getSupabaseConfig = () => {
  const rawUrl = process.env.SUPABASE_URL ? process.env.SUPABASE_URL.trim() : '';
  const url = rawUrl.replace(/^["']|["']$/g, '');
  const rawKey = (
    process.env.SUPABASE_SERVICE_ROLE_KEY
    || process.env.SUPABASE_KEY
    || ''
  ).trim();
  const key = rawKey.replace(/^["']|["']$/g, '');

  if (!url || !key) {
    return null;
  }

  if (!isValidHttpUrl(url)) {
    console.warn(
      'SUPABASE_URL tidak valid (harus diawali https://, contoh: https://xxxx.supabase.co). Menggunakan memory fallback.',
    );
    return null;
  }

  return { url, key };
};

const getSupabaseClient = () => {
  const config = getSupabaseConfig();
  if (!config) {
    return null;
  }

  const signature = `${config.url}::${config.key}`;
  if (!cachedClient || cachedKeySignature !== signature) {
    try {
      cachedClient = createClient(config.url, config.key, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      });
      cachedKeySignature = signature;
    } catch (err) {
      console.warn('Gagal inisialisasi Supabase client:', err.message);
      return null;
    }
  }

  return cachedClient;
};

module.exports = {
  isValidHttpUrl,
  getSupabaseConfig,
  getSupabaseClient,
};
