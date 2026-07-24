// utils.js — Shared utility functions

// ─── LocalStorage helpers ─────────────────────────────────────────────────────
export function lsGet(key, fallback = null) {
  try {
    const v = localStorage.getItem(key);
    return v !== null ? JSON.parse(v) : fallback;
  } catch { return fallback; }
}

export function lsSet(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

export function lsRemove(key) {
  try { localStorage.removeItem(key); } catch {}
}

// ─── Date helpers ─────────────────────────────────────────────────────────────
export function daysUntil(dateStr) {
  if (!dateStr) return null;
  const target = new Date(dateStr);
  const now    = new Date();
  const diff   = Math.ceil((target - now) / (1000 * 60 * 60 * 24));
  return diff;
}

export function todayStr() {
  return new Date().toISOString().split('T')[0];
}

export function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatDateTime(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export function formatDuration(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2,'0')}`;
}

// ─── Score helpers ────────────────────────────────────────────────────────────
export function calcScore(responses) {
  let correct = 0, wrong = 0, skipped = 0;
  responses.forEach(r => {
    if (r.selected === null || r.selected === undefined) skipped++;
    else if (r.selected === r.correct)                    correct++;
    else                                                  wrong++;
  });
  const score = correct * 4 + wrong * (-1);
  const total = responses.length * 4;
  return { correct, wrong, skipped, score, total, pct: total > 0 ? Math.round((score / total) * 100) : 0 };
}

// ─── Image & Rich Content Helper ─────────────────────────────────────────────
// Adds class, lazy loading, referrer policy, and error handler to ALL images
function normalizeImgTag(src, alt = 'Image') {
  return `<img src="${src}" alt="${alt}" class="question-img-embed" loading="lazy" referrerpolicy="no-referrer" onerror="this.onerror=null;this.style.opacity='.35';this.title='Image could not load'" />`;
}

export function renderRichContent(text = '', imageUrl = null) {
  if (!text && !imageUrl) return '';

  let html = String(text || '');

  // 1. Convert Markdown images ![alt](url) → <img>
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_, alt, src) => normalizeImgTag(src, alt || 'Image'));

  // 2. Convert standalone HTTP image URLs in text (not already inside src="...")
  html = html.replace(/(^|[\s>(])((https?:\/\/)[^\s<"']+(?:\.(?:png|jpg|jpeg|gif|webp|svg)|(?:\/wp-content|\/uploads|\/images)[^\s<"']*))(?=$|[\s<)"])/gi, (match, prefix, url) => {
    // Skip if already inside an src="..." attribute
    if (match.includes('src=')) return match;
    return `${prefix}${normalizeImgTag(url)}`;
  });

  // 3. Normalize ALL existing <img> tags — add missing class, loading, referrerpolicy, onerror
  html = html.replace(/<img\b([^>]*?)(\s*\/?>)/gi, (match, attrs) => {
    let a = attrs;
    // Extract src and alt
    const srcMatch = a.match(/src=["']([^"']+)["']/i);
    const altMatch = a.match(/alt=["']([^"']*)["']/i);
    if (!srcMatch) return match; // no src, leave as-is
    const src = srcMatch[1];
    const alt = altMatch ? altMatch[1] : 'Image';
    return normalizeImgTag(src, alt);
  });

  // 4. Append explicit imageUrl from question object property
  if (imageUrl && typeof imageUrl === 'string' && imageUrl.startsWith('http') && !html.includes(imageUrl)) {
    html += `<div style="margin-top:var(--sp-3)">${normalizeImgTag(imageUrl, 'Question Figure')}</div>`;
  }

  return html;
}

export function scoreGrade(pct) {
  if (pct >= 80) return { label: 'Excellent', color: 'var(--success)' };
  if (pct >= 60) return { label: 'Good',      color: 'var(--secondary)' };
  if (pct >= 40) return { label: 'Average',   color: 'var(--amber)' };
  return              { label: 'Needs Work',  color: 'var(--error)' };
}

// ─── DOM helpers ──────────────────────────────────────────────────────────────
export function el(selector) { return document.querySelector(selector); }
export function els(selector) { return [...document.querySelectorAll(selector)]; }

export function html(strings, ...values) {
  return strings.reduce((out, str, i) => out + str + (values[i] !== undefined ? values[i] : ''), '');
}

export function esc(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ─── Toast notifications ──────────────────────────────────────────────────────
export function toast(message, type = 'default', duration = 3500) {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const icons = { default: 'ℹ️', success: '✅', error: '❌', warning: '⚠️' };
  const div = document.createElement('div');
  div.className = `toast ${type}`;
  div.innerHTML = `<span>${icons[type] || ''}</span><span>${esc(message)}</span>`;
  container.appendChild(div);
  setTimeout(() => { div.style.opacity = '0'; div.style.transform = 'translateX(20px)'; div.style.transition = 'all .3s'; setTimeout(() => div.remove(), 300); }, duration);
}

// ─── Shuffle array ────────────────────────────────────────────────────────────
export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ─── Streak helpers ───────────────────────────────────────────────────────────
export function updateStreak() {
  const data = lsGet('hp_streak', { current: 0, longest: 0, lastDate: null });
  const today = todayStr();
  if (data.lastDate === today) return data; // Already studied today
  const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
  const yStr = yesterday.toISOString().split('T')[0];
  if (data.lastDate === yStr) {
    data.current++;
  } else {
    data.current = 1;
  }
  data.longest  = Math.max(data.longest, data.current);
  data.lastDate = today;
  lsSet('hp_streak', data);
  return data;
}

export function getStreak() {
  return lsGet('hp_streak', { current: 0, longest: 0, lastDate: null });
}

// ─── Achievements ─────────────────────────────────────────────────────────────
const ACHIEVEMENTS = [
  { id: 'first_question',    name: 'First Step',       icon: '🌱', desc: 'Answered your first question',        check: (s) => s.totalAnswered >= 1 },
  { id: 'hundred_questions', name: 'Century!',         icon: '💯', desc: '100 questions answered',               check: (s) => s.totalAnswered >= 100 },
  { id: 'five_hundred',      name: 'Half Thousand',    icon: '🏅', desc: '500 questions answered',               check: (s) => s.totalAnswered >= 500 },
  { id: 'thousand',          name: 'Legend',           icon: '🏆', desc: '1000 questions answered',              check: (s) => s.totalAnswered >= 1000 },
  { id: 'week_streak',       name: '7-Day Streak',     icon: '🔥', desc: 'Studied 7 days in a row',             check: (s) => s.currentStreak >= 7 },
  { id: 'month_streak',      name: 'Month Warrior',    icon: '🌟', desc: 'Studied 30 days in a row',            check: (s) => s.currentStreak >= 30 },
  { id: 'first_mock',        name: 'Test Taker',       icon: '📝', desc: 'Completed your first mock test',      check: (s) => s.mockTests >= 1 },
  { id: 'perfect_score',     name: 'Perfect Score',    icon: '✨', desc: 'Scored 480/480 in a mock test',       check: (s) => s.perfectScore },
  { id: 'speed_demon',       name: 'Speed Demon',      icon: '⚡', desc: '>80% accuracy in under 60 minutes',   check: (s) => s.speedDemon },
  { id: 'all_subjects',      name: 'All Rounder',      icon: '📚', desc: 'Practiced all 12 subjects',           check: (s) => s.subjectsCovered >= 12 },
  { id: 'materia_master',    name: 'Materia Master',   icon: '🌿', desc: '>90% accuracy in 50+ MM questions',   check: (s) => s.subjectAccuracy?.['materia-medica'] >= 90 && s.subjectCount?.['materia-medica'] >= 50 },
  { id: 'organon_master',    name: 'Organon Scholar',  icon: '📖', desc: '>90% accuracy in 50+ Organon Qs',    check: (s) => s.subjectAccuracy?.organon >= 90 && s.subjectCount?.organon >= 50 },
];

export function checkAchievements(stats) {
  const earned   = lsGet('hp_achievements', []);
  const newOnes  = [];
  for (const a of ACHIEVEMENTS) {
    if (!earned.includes(a.id) && a.check(stats)) {
      earned.push(a.id);
      newOnes.push(a);
    }
  }
  if (newOnes.length) lsSet('hp_achievements', earned);
  return newOnes;
}

export function getEarnedAchievements() {
  const earned = lsGet('hp_achievements', []);
  return ACHIEVEMENTS.map(a => ({ ...a, earned: earned.includes(a.id) }));
}

export { ACHIEVEMENTS };

// ─── Number formatting ────────────────────────────────────────────────────────
export function pct(num, den) {
  if (!den) return 0;
  return Math.round((num / den) * 100);
}

export function ordinal(n) {
  const s = ['th','st','nd','rd'];
  const v = n % 100;
  return n + (s[(v-20)%10] || s[v] || s[0]);
}

// ─── Study plan generator ─────────────────────────────────────────────────────
import { SUBJECTS } from '../data/subjects.js';

export function generateStudyPlan(examDateStr, weakSubjects = []) {
  const days = daysUntil(examDateStr);
  if (days <= 0) return null;

  const plan = [];
  const today = new Date();

  // Priority Tier order according to official NCH 2026 distribution
  const priorityOrder = { 'Very High': 5, 'High': 4, 'Medium': 3, 'Moderate': 2, 'Lower': 1 };

  const sortedSubjects = [...SUBJECTS].sort((a, b) => {
    return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
  });

  // Expand subjects proportionally to official questions (Materia Medica 16, Organon 16, etc.)
  const expandedList = [];
  sortedSubjects.forEach(s => {
    const boost = weakSubjects.includes(s.id) ? 4 : 0;
    const slots = s.questions + boost;
    for (let k = 0; k < slots; k++) {
      expandedList.push(s);
    }
  });

  // Build day-by-day plan
  const totalDaysToPlan = Math.min(days, 90);
  for (let i = 0; i < totalDaysToPlan; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    const subject = expandedList[i % expandedList.length];
    plan.push({
      date: d.toISOString().split('T')[0],
      subject: subject.id,
      subjectName: subject.name,
      priority: subject.priority,
      questionsTarget: subject.questions >= 12 ? 40 : 25,
      flashcardsTarget: 20,
      done: false,
    });
  }

  return plan;
}
