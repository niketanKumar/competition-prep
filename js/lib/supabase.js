// supabase.js — Supabase client configuration & API helpers
// Replace SUPABASE_URL and SUPABASE_ANON_KEY with your actual Supabase project values

const SUPABASE_URL      = localStorage.getItem('hp_supabase_url')      || 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = localStorage.getItem('hp_supabase_anon_key') || 'YOUR_SUPABASE_ANON_KEY';

let _client = null;

export function getSupabase() {
  if (_client) return _client;
  try {
    if (!window.supabase || typeof window.supabase.createClient !== 'function') {
      return null;
    }
    if (!isConfigured()) return null;
    _client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    return _client;
  } catch (e) {
    console.warn('[Supabase] Failed to create client — running in offline/demo mode:', e.message);
    return null;
  }
}

export function isConfigured() {
  return SUPABASE_URL && SUPABASE_URL !== 'YOUR_SUPABASE_URL' &&
         SUPABASE_ANON_KEY && SUPABASE_ANON_KEY !== 'YOUR_SUPABASE_ANON_KEY';
}

// ─── Auth Helpers ────────────────────────────────────────────────────────────
export async function signUp(email, password, fullName) {
  const sb = getSupabase();
  if (!sb) return { data: null, error: { message: 'Supabase is not configured. Please set up credentials in Settings.' } };
  return await sb.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: window.location.origin,
      data: {
        full_name: fullName,
        role: 'student'
      }
    }
  });
}

export async function signIn(email, password) {
  const sb = getSupabase();
  if (!sb) return { data: null, error: { message: 'Supabase is not configured. Please set up credentials in Settings.' } };
  return await sb.auth.signInWithPassword({ email, password });
}

export async function signOut() {
  const sb = getSupabase();
  if (!sb) return;
  return await sb.auth.signOut();
}

export async function getSession() {
  if (!isConfigured()) return null;
  const sb = getSupabase();
  if (!sb) return null;
  try {
    const { data } = await sb.auth.getSession();
    return data?.session || null;
  } catch {
    return null;
  }
}

export function onAuthChange(callback) {
  const sb = getSupabase();
  if (!sb) return () => {};
  const { data: { subscription } } = sb.auth.onAuthStateChange(callback);
  return () => subscription.unsubscribe();
}

// ─── User Profile ────────────────────────────────────────────────────────────
export async function fetchProfile(userId) {
  const sb = getSupabase();
  if (!sb) return { data: null, error: null };
  const { data, error } = await sb.from('profiles').select('*').eq('id', userId).maybeSingle();
  return { data, error };
}

export async function updateProfile(userId, updates) {
  const sb = getSupabase();
  if (!sb) return { error: null };
  return await sb.from('profiles').update(updates).eq('id', userId);
}

// ─── Questions API ───────────────────────────────────────────────────────────
export async function fetchQuestions(filters = {}) {
  const sb = getSupabase();
  if (!sb) return { data: null, error: { message: 'Not connected' } };
  let query = sb.from('questions').select('*');
  if (filters.subject && filters.subject !== 'all') query = query.eq('subject', filters.subject);
  if (filters.year && filters.year !== 'all')       query = query.eq('year', filters.year);
  if (filters.group)                                query = query.eq('group_id', filters.group);
  if (filters.verified !== undefined)              query = query.eq('verified', filters.verified);
  return await query.order('id', { ascending: true });
}

export async function upsertQuestion(question) {
  const sb = getSupabase();
  if (!sb) return { error: { message: 'Not connected' } };
  return await sb.from('questions').upsert(question);
}

export async function batchUpsertQuestions(questionsArray) {
  const sb = getSupabase();
  if (!sb) return { error: { message: 'Not connected' } };
  return await sb.from('questions').upsert(questionsArray);
}

export async function deleteQuestion(id) {
  const sb = getSupabase();
  if (!sb) return { error: { message: 'Not connected' } };
  return await sb.from('questions').delete().eq('id', id);
}

// ─── Test Sessions ───────────────────────────────────────────────────────────
export async function saveTestSession(session) {
  const sb = getSupabase();
  if (!sb) return { error: null, data: null };
  return await sb.from('test_sessions').insert(session);
}

export async function fetchTestSessions(userId) {
  const sb = getSupabase();
  if (!sb) return { data: [], error: null };
  return await sb.from('test_sessions').select('*').eq('user_id', userId).order('completed_at', { ascending: false });
}

// ─── Flashcard Reviews ───────────────────────────────────────────────────────
export async function saveFlashcardReview(review) {
  const sb = getSupabase();
  if (!sb) return { error: null };
  return await sb.from('flashcard_reviews').upsert(review, { onConflict: 'user_id,flashcard_id' });
}

export async function fetchFlashcardReviews(userId) {
  const sb = getSupabase();
  if (!sb) return { data: [], error: null };
  return await sb.from('flashcard_reviews').select('*').eq('user_id', userId);
}

// ─── User Bookmarks ──────────────────────────────────────────────────────────
export async function toggleBookmarkCloud(userId, questionId, add) {
  const sb = getSupabase();
  if (!sb) return { error: null };
  if (add) {
    return await sb.from('user_bookmarks').upsert({ user_id: userId, question_id: questionId });
  } else {
    return await sb.from('user_bookmarks').delete().match({ user_id: userId, question_id: questionId });
  }
}

export async function fetchBookmarksCloud(userId) {
  const sb = getSupabase();
  if (!sb) return { data: [], error: null };
  const { data, error } = await sb.from('user_bookmarks').select('question_id').eq('user_id', userId);
  return { data: (data || []).map(b => b.question_id), error };
}
