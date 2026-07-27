// ai.js — Multi-Provider AI Engine (Gemini + Groq + Smart Explanation Caching + Key Transparency)
import { normalizeSubjectId } from '../data/subjects.js';

const GEMINI_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-1.5-flash',
  'gemini-1.5-pro',
];

const GROQ_MODELS = [
  'llama-3.1-8b-instant',
  'llama3-70b-8192',
  'mixtral-8x7b-32768',
];

// ─── Key Management ──────────────────────────────────────────────────────────
function getGeminiKeys() {
  try { return JSON.parse(localStorage.getItem('hp_ai_keys') || '[]'); } catch { return []; }
}

function getGroqKeys() {
  try { return JSON.parse(localStorage.getItem('hp_groq_keys') || '[]'); } catch { return []; }
}

let _geminiIdx = 0;
let _groqIdx   = 0;

function getNextGeminiKey() {
  const keys = getGeminiKeys();
  if (!keys.length) return null;
  return keys[_geminiIdx++ % keys.length];
}

function getNextGroqKey() {
  const keys = getGroqKeys();
  if (!keys.length) return null;
  return keys[_groqIdx++ % keys.length];
}

export function isAiConfigured() {
  return getGeminiKeys().length > 0 || getGroqKeys().length > 0;
}

function maskKey(key) {
  if (!key) return '';
  if (key.length <= 12) return key;
  return `${key.slice(0, 8)}...${key.slice(-4)}`;
}

// ─── Option 4: Smart Explanation Cache Layer ─────────────────────────────────
function getCacheKey(question, options) {
  const str = `${question}_${(options || []).join('_')}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return `exp_cache_${Math.abs(hash)}`;
}

function getFromCache(question, options) {
  try {
    const cache = JSON.parse(localStorage.getItem('hp_ai_exp_cache') || '{}');
    const key = getCacheKey(question, options);
    return cache[key] || null; // returns object { text, provider, model, keyUsed }
  } catch { return null; }
}

function saveToCache(question, options, cacheObj) {
  try {
    const cache = JSON.parse(localStorage.getItem('hp_ai_exp_cache') || '{}');
    const key = getCacheKey(question, options);
    cache[key] = cacheObj;
    localStorage.setItem('hp_ai_exp_cache', JSON.stringify(cache));
  } catch (e) {
    console.warn('[Cache] Could not save to explanation cache:', e);
  }
}

// ─── Option 3: Groq Free API Caller ──────────────────────────────────────────
async function callGroq(prompt, systemInstruction = '', maxTokens = 1000) {
  const key = getNextGroqKey();
  if (!key) throw new Error('No Groq API keys configured.');

  let lastErr = null;
  for (const model of GROQ_MODELS) {
    try {
      const messages = [];
      if (systemInstruction) messages.push({ role: 'system', content: systemInstruction });
      messages.push({ role: 'user', content: prompt });

      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${key}`
        },
        body: JSON.stringify({
          model: model,
          messages: messages,
          temperature: 0.2,
          max_tokens: maxTokens,
        })
      });

      if (res.status === 429) throw new Error('Groq quota reached. Try again later.');
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error?.message || `Groq error (${res.status})`);
      }

      const data = await res.json();
      const text = data?.choices?.[0]?.message?.content;
      if (text) {
        return {
          text: text.trim(),
          provider: 'Groq',
          model: model,
          keyUsed: maskKey(key),
          badge: `⚡ Powered by Groq (${model}) • Key: ${maskKey(key)}`
        };
      }
    } catch (e) {
      if (e.message.includes('quota')) throw e;
      lastErr = e;
    }
  }

  throw lastErr || new Error('Failed to connect to Groq API.');
}

// ─── Gemini API Caller ───────────────────────────────────────────────────────
async function callGemini(prompt, systemInstruction = '', maxTokens = 1500) {
  const key = getNextGeminiKey();
  if (!key) throw new Error('No Gemini API keys configured.');

  let lastError = null;
  for (const model of GEMINI_MODELS) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
    const body = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.2, maxOutputTokens: maxTokens },
    };

    if (systemInstruction) {
      body.systemInstruction = { parts: [{ text: systemInstruction }] };
    }

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.status === 429) throw new Error('Gemini quota reached.');
      if (res.status === 404) continue;

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error?.message || `Gemini error (${res.status})`);
      }

      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        return {
          text: text.trim(),
          provider: 'Gemini',
          model: model,
          keyUsed: maskKey(key),
          badge: `🌐 Powered by Gemini (${model}) • Key: ${maskKey(key)}`
        };
      }
    } catch (e) {
      if (e.message.includes('quota')) throw e;
      lastError = e;
    }
  }

  throw lastError || new Error('Failed to connect to Gemini models.');
}

// ─── Unified AI Provider Selector & Fallback ─────────────────────────────────
async function callAiProvider(prompt, systemInstruction = '', maxTokens = 1500) {
  const preferred = localStorage.getItem('hp_ai_provider') || 'auto';

  if (preferred === 'groq') {
    return await callGroq(prompt, systemInstruction, maxTokens);
  }

  if (preferred === 'gemini') {
    return await callGemini(prompt, systemInstruction, maxTokens);
  }

  // Auto Mode: Try Gemini first, fallback to Groq
  if (getGeminiKeys().length > 0) {
    try {
      return await callGemini(prompt, systemInstruction, maxTokens);
    } catch (e) {
      console.warn('[AI] Gemini call failed, falling back to Groq:', e);
      if (getGroqKeys().length > 0) {
        return await callGroq(prompt, systemInstruction, maxTokens);
      }
      throw e;
    }
  }

  if (getGroqKeys().length > 0) {
    return await callGroq(prompt, systemInstruction, maxTokens);
  }

  throw new Error('No API keys configured. Please add a Gemini or Groq API key in Settings.');
}

// ─── Generate Explanation (With Smart Caching & Key Transparency) ──────────────
export async function generateExplanation(question, options, correctIndex) {
  // Option 4: Check Smart Cache first!
  const cached = getFromCache(question, options);
  if (cached) {
    console.log('[Cache Hit 🎯] Loaded explanation from cache!');
    return {
      explanation: typeof cached === 'string' ? cached : cached.text,
      badge: `🎯 Loaded from Smart Cache (0 API tokens consumed)`,
      confidence: 'high',
      fromCache: true
    };
  }

  if (!isAiConfigured()) {
    return {
      explanation: `Correct Answer: ${options[correctIndex]}. (Add a free Gemini or Groq API key in Settings to unlock AI explanations).`,
      badge: '⚡ Offline Mode',
      confidence: 'low',
    };
  }

  const correctOption = options[correctIndex];
  const prompt = `You are an expert Homoeopathy teacher preparing a student for AIAPGET exam.

Question: ${question}

Options:
${options.map((o, i) => `${String.fromCharCode(65+i)}. ${o}`).join('\n')}

Correct Answer: ${String.fromCharCode(65+correctIndex)}. ${correctOption}

Provide a clear, educational explanation of WHY this is correct, and briefly why others are incorrect. Keep it concise (3-5 sentences).`;

  const result = await callAiProvider(prompt, '', 500);

  // Save to Cache
  saveToCache(question, options, result);

  return {
    explanation: result.text,
    badge: result.badge,
    confidence: 'medium',
    fromCache: false
  };
}

// ─── Universal Question Normalizer ──────────────────────────────────────────
export function normalizeQuestionObject(item, defaultSubject = 'materia-medica', idx = 0) {
  if (!item || typeof item !== 'object') return null;

  const qText = item.q || item.question || item.prompt || item.questionText || '';
  if (!qText || typeof qText !== 'string') return null;

  // 1. Options normalization (Handles arrays or individual a, b, c, d properties)
  let options = [];
  if (Array.isArray(item.options)) {
    options = item.options.map(String);
  } else if (Array.isArray(item.opts)) {
    options = item.opts.map(String);
  } else if (Array.isArray(item.choices)) {
    options = item.choices.map(String);
  } else if (item.a !== undefined || item.b !== undefined || item.c !== undefined || item.d !== undefined) {
    const rawOpts = [item.a, item.b, item.c, item.d, item.e];
    options = rawOpts.filter(val => val !== undefined && val !== null && String(val).trim() !== '').map(String);
  }

  if (options.length === 0) {
    options = ['Option A', 'Option B', 'Option C', 'Option D'];
  }

  // 2. Correct answer index normalization (Handles numbers, keys 'a'/'b'/'c'/'d', and ans text matching)
  let correct = null;

  if (typeof item.correct === 'number') {
    correct = item.correct;
  } else if (typeof item.ans === 'number') {
    correct = item.ans;
  } else {
    const keyVal = String(item.keys || item.key || item.ansKey || item.correctKey || '').trim().toLowerCase();
    if (keyVal) {
      const charMap = { 'a': 0, '1': 0, 'b': 1, '2': 1, 'c': 2, '3': 2, 'd': 3, '4': 3, 'e': 4, '5': 4 };
      const firstKey = keyVal.split(/[,/]/)[0].trim();
      if (charMap[firstKey] !== undefined) {
        correct = charMap[firstKey];
      }
    }
  }

  // Matching text string if correct is still null (e.g. ans: 'Headache relieved by warm application')
  if (correct === null && typeof item.ans === 'string' && item.ans.trim()) {
    const ansLower = item.ans.trim().toLowerCase();
    const foundIdx = options.findIndex(opt => opt.trim().toLowerCase() === ansLower);
    if (foundIdx !== -1) {
      correct = foundIdx;
    }
  }

  const imgUrl = item.image || item.imageUrl || item.image_url || item.fig || item.figure || item.img || null;

  return {
    id: item.id || item.gid || (Date.now() + idx),
    q: qText.trim(),
    options,
    correct: correct !== null ? correct : 0,
    exp: item.exp || item.explanation || item.rationale || '',
    subject: normalizeSubjectId(item.sub || item.subject || defaultSubject),
    exam: item.exam || 'AIAPGET',
    year: parseInt(item.year) || null,
    group: item.group || (item.gid ? `Group-${item.gid}` : null),
    image_url: imgUrl,
    imageUrl: imgUrl,
    image: imgUrl,
    verified: item.verified !== undefined ? !!item.verified : true,
    ai_generated_exp: false,
    status: item.st || item.status || 'normal',
  };
}

// ─── Parse Questions From Document / Text ────────────────────────────────────
export async function parseQuestionsFromText(text, subject) {
  // 1. Direct JS / JSON Array Parser (Instant, zero AI needed, no truncation)
  const arrayMatch = text.match(/\[\s*\{[\s\S]*\}\s*\]/);
  if (arrayMatch) {
    const rawArrayStr = arrayMatch[0].trim();
    let parsed = null;

    try {
      parsed = JSON.parse(rawArrayStr);
    } catch {
      try {
        parsed = new Function(`return ${rawArrayStr}`)();
      } catch (e) {
        console.warn('[Parser] JS Function evaluation failed:', e);
      }
    }

    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed
        .map((item, idx) => normalizeQuestionObject(item, subject, idx))
        .filter(Boolean);
    }
  }

  // 2. AI Parsing (Gemini / Groq) if text is unstructured and AI is available
  if (isAiConfigured()) {
    const cleanedText = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
                           .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');

    const prompt = `Extract all multiple-choice questions from the text below and return a valid JSON array.
Each item MUST have:
- "q": question text (string)
- "options": array of exactly 4 strings
- "correct": zero-based index of correct option (number 0, 1, 2, or 3, or null if unknown)
- "exp": explanation (string)
- "subject": "${subject}"

Return ONLY the raw JSON array, no markdown code fences.

Text:
${cleanedText}`;

    try {
      const result = await callAiProvider(prompt, 'You extract structured MCQs into valid JSON arrays only.', 4000);
      const jsonString = result.text.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
      const parsedAi = JSON.parse(jsonString);
      if (Array.isArray(parsedAi)) return parsedAi;
    } catch (err) {
      console.warn('[AI] AI extraction failed, using Rule-based Offline Parser:', err);
    }
  }

  // 3. Rule-Based Offline Fallback
  return parseOfflineRuleBased(text, subject);
}

function parseOfflineRuleBased(text, subject) {
  const questions = [];
  const blocks = text.split(/(?=\b(?:\d{1,3}\.|Q\d{1,3}\.|\[\d{1,3}\])\s)/gi);

  for (const block of blocks) {
    if (!block.trim()) continue;
    const qMatch = block.match(/(?:^\d{1,3}\.|Q\d{1,3}\.|\[\d{1,3}\])?\s*([\s\S]+?)(?=\b[A-D][\.\)]\s)/i);
    const optsMatches = [...block.matchAll(/\b([A-D])[\.\)]\s*([^\n\r]+)/gi)];

    if (qMatch && optsMatches.length >= 4) {
      const qText = qMatch[1].trim().replace(/\n+/g, ' ');
      const options = optsMatches.slice(0, 4).map(m => m[2].trim());
      let correctIdx = 0;
      const ansMatch = block.match(/(?:Answer|Ans|Correct)\s*:\s*([A-D1-4])/i);
      if (ansMatch) {
        const val = ansMatch[1].toUpperCase();
        if (['A','B','C','D'].includes(val)) correctIdx = val.charCodeAt(0) - 65;
        else if (['1','2','3','4'].includes(val)) correctIdx = parseInt(val) - 1;
      }
      questions.push({ q: qText, options, correct: correctIdx, exp: 'Extracted via Offline Parser', subject });
    }
  }

  if (!questions.length) {
    throw new Error('Could not detect questions in text. Ensure format is 1. Prompt... A. B. C. D. Answer: B.');
  }

  return questions;
}

// ─── AI Assistant Chat ───────────────────────────────────────────────────────
export async function askAiAssistant(userQuery, screenContext = '') {
  if (!isAiConfigured()) {
    return {
      text: `ℹ️ **AI Offline Mode**: Add a free Gemini API key (aistudio.google.com) or a free Groq API key (console.groq.com) in **Settings → AI Configuration**.`,
      badge: '⚡ Offline Mode'
    };
  }

  const systemInstruction = `You are "HomeoPrep AI Assistant", an expert AI tutor for AIAPGET Homoeopathy exam preparation.
Answer questions on Homoeopathic Materia Medica, Organon, Repertory, Pharmacy, and Allied Sciences concisely with bullet points.`;

  const prompt = screenContext ?
    `[CURRENT SCREEN CONTEXT]\n${screenContext}\n\n[STUDENT QUESTION]\n${userQuery}` :
    userQuery;

  return await callAiProvider(prompt, systemInstruction, 1000);
}
