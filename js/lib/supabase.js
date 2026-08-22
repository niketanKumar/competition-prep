// supabase.js — Supabase client configuration & API helpers

export const DEFAULT_SUPABASE_URL      = 'https://uoifrcsfkjblonvkqruq.supabase.co';
export const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVvaWZyY3Nma2pibG9udmtxcnVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ4ODc0NzksImV4cCI6MjEwMDQ2MzQ3OX0.RkhvB88GUHrjWtKLuHOvKMles4KbUKjjsBoqlTiLfa8';

const SUPABASE_URL      = localStorage.getItem('hp_supabase_url')      || DEFAULT_SUPABASE_URL;
const SUPABASE_ANON_KEY = localStorage.getItem('hp_supabase_anon_key') || DEFAULT_SUPABASE_ANON_KEY;

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
export async function getAuthUser() {
  const sb = getSupabase();
  if (!sb) return null;
  try {
    const { data } = await sb.auth.getUser();
    return data?.user || null;
  } catch { return null; }
}

export async function fetchProfile(userId) {
  const sb = getSupabase();
  if (!sb) return { data: null, error: null };
  const { data, error } = await sb.from('profiles').select('*').eq('id', userId).maybeSingle();
  return { data, error };
}

export async function fetchAllProfiles() {
  const sb = getSupabase();
  if (!sb) return { data: [], error: null };
  return await sb.from('profiles').select('*').order('created_at', { ascending: false });
}

export async function fetchAllTestSessions() {
  const sb = getSupabase();
  if (!sb) return { data: [], error: null };
  return await sb.from('test_sessions').select('*').order('completed_at', { ascending: false });
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

  let allData = [];
  let from = 0;
  const step = 1000;
  let hasMore = true;

  while (hasMore) {
    let query = sb.from('questions').select('*').range(from, from + step - 1);
    if (filters.subject && filters.subject !== 'all') query = query.eq('subject', filters.subject);
    if (filters.year && filters.year !== 'all')       query = query.eq('year', filters.year);
    if (filters.group)                                query = query.eq('group_id', filters.group);
    if (filters.verified !== undefined)              query = query.eq('verified', filters.verified);

    const { data, error } = await query.order('id', { ascending: true });
    if (error) return { data: allData.length ? allData : null, error };

    if (data && data.length) {
      allData = allData.concat(data);
      if (data.length < step) {
        hasMore = false;
      } else {
        from += step;
      }
    } else {
      hasMore = false;
    }
  }

  return { data: allData, error: null };
}

function sanitizeQuestion(q) {
  const img = q.image_url || q.imageUrl || q.image || null;
  const cleanObj = {
    subject: q.subject,
    exam: q.exam || 'Mock',
    year: typeof q.year === 'number' ? q.year : (parseInt(q.year) || 2025),
    q: q.q,
    options: Array.isArray(q.options) ? q.options : [],
    correct: typeof q.correct === 'number' ? q.correct : 0,
    exp: q.exp || '',
    image_url: img,
    verified: q.verified !== false,
    difficulty: q.difficulty || 'medium',
    group_id: q.group_id || q.group || null,
    ai_generated_exp: !!q.ai_generated_exp
  };
  if (q.id && typeof q.id === 'number' && q.id < 1000000000) {
    cleanObj.id = q.id;
  }
  return cleanObj;
}

export async function upsertQuestion(question) {
  const sb = getSupabase();
  if (!sb) return { error: { message: 'Not connected' } };
  return await sb.from('questions').upsert(sanitizeQuestion(question));
}

export async function batchUpsertQuestions(questionsArray, chunkSize = 200) {
  const sb = getSupabase();
  if (!sb) return { error: { message: 'Not connected' } };
  const cleanArray = (questionsArray || []).map(sanitizeQuestion);

  for (let i = 0; i < cleanArray.length; i += chunkSize) {
    const chunk = cleanArray.slice(i, i + chunkSize);
    const { error } = await sb.from('questions').upsert(chunk);
    if (error) return { error };
  }
  return { error: null };
}

export async function deleteQuestion(id) {
  const sb = getSupabase();
  if (!sb) return { error: { message: 'Not connected' } };
  return await sb.from('questions').delete().eq('id', id);
}

export async function deleteQuestionsCloudBulk(idArray) {
  const sb = getSupabase();
  if (!sb) return { error: { message: 'Not connected' } };
  return await sb.from('questions').delete().in('id', idArray);
}

// ─── Flashcards Cloud ────────────────────────────────────────────────────────
export async function fetchFlashcardsCloud() {
  const sb = getSupabase();
  if (!sb) return { data: null, error: null };

  let allData = [];
  let from = 0;
  const step = 1000;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await sb.from('flashcards').select('*').range(from, from + step - 1);
    if (error) return { data: allData.length ? allData : null, error };

    if (data && data.length) {
      allData = allData.concat(data);
      if (data.length < step) hasMore = false;
      else from += step;
    } else {
      hasMore = false;
    }
  }

  return { data: allData, error: null };
}

export async function upsertFlashcardCloud(flashcard) {
  const sb = getSupabase();
  if (!sb) return { error: { message: 'Not connected' } };
  return await sb.from('flashcards').upsert(flashcard);
}

export async function batchUpsertFlashcards(cardsArray, chunkSize = 200) {
  const sb = getSupabase();
  if (!sb) return { error: { message: 'Not connected' } };

  for (let i = 0; i < cardsArray.length; i += chunkSize) {
    const chunk = cardsArray.slice(i, i + chunkSize);
    const { error } = await sb.from('flashcards').upsert(chunk);
    if (error) return { error };
  }
  return { error: null };
}

export async function deleteFlashcardCloud(id) {
  const sb = getSupabase();
  if (!sb) return { error: { message: 'Not connected' } };
  return await sb.from('flashcards').delete().eq('id', id);
}

export async function deleteFlashcardsCloudBulk(idArray) {
  const sb = getSupabase();
  if (!sb) return { error: { message: 'Not connected' } };
  return await sb.from('flashcards').delete().in('id', idArray);
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

// ─── User Documents (Library & Reader) ───────────────────────────────────────

/**
 * Upload a PDF File object to Supabase Storage.
 * Path format: {userId}/{docId}.pdf
 * Returns { path, error }
 */
export async function uploadDocumentFile(userId, docId, file) {
  const sb = getSupabase();
  if (!sb) return { path: null, error: { message: 'Not connected' } };

  const path = `${userId}/${docId}.pdf`;
  const { error } = await sb.storage
    .from('user-documents')
    .upload(path, file, { upsert: true, contentType: 'application/pdf' });

  if (error) return { path: null, error };
  return { path, error: null };
}

/**
 * Get a signed URL (valid 1 hour) for a stored PDF.
 * Returns { url, error }
 */
export async function getDocumentSignedUrl(storagePath) {
  const sb = getSupabase();
  if (!sb) return { url: null, error: { message: 'Not connected' } };

  const { data, error } = await sb.storage
    .from('user-documents')
    .createSignedUrl(storagePath, 3600); // 1 hour

  return { url: data?.signedUrl || null, error };
}

/**
 * Fetch all documents visible to the current user:
 * - Their own documents
 * - All admin-uploaded documents (handled by RLS policy)
 * Returns { data: [], error }
 */
export async function fetchUserDocuments() {
  const sb = getSupabase();
  if (!sb) return { data: [], error: null };

  const { data, error } = await sb
    .from('user_documents')
    .select('*')
    .order('created_at', { ascending: false });

  return { data: data || [], error };
}

/**
 * Insert or update a document metadata row.
 * doc must include: { id, user_id, title, subject, description, type, storage_path, pages, is_admin_upload }
 * Returns { error }
 */
export async function saveUserDocument(doc) {
  const sb = getSupabase();
  if (!sb) return { error: { message: 'Not connected' } };

  const { error } = await sb.from('user_documents').upsert(doc);
  return { error };
}

/**
 * Delete a document metadata row AND its storage object (if any).
 * Returns { error }
 */
export async function deleteUserDocument(docId, storagePath) {
  const sb = getSupabase();
  if (!sb) return { error: { message: 'Not connected' } };

  // Delete storage file first (ignore error if file doesn't exist)
  if (storagePath) {
    await sb.storage.from('user-documents').remove([storagePath]);
  }

  // Delete metadata row
  const { error } = await sb.from('user_documents').delete().eq('id', docId);
  return { error };
}
