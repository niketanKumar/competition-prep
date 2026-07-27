// practice.js — Subject-wise practice mode
import { lsGet, lsSet, toast, esc, pct, checkAchievements, renderRichContent } from '../lib/utils.js';
import { SUBJECTS, MARKS_CORRECT, MARKS_WRONG } from '../data/subjects.js';
import { SEED_QUESTIONS, getAllQuestions } from '../data/questions.js';
import { generateExplanation, isAiConfigured } from '../lib/ai.js';
import { toggleBookmarkCloud, getSession, isConfigured as isSupabaseConfigured } from '../lib/supabase.js';

const NAV_PAGE_SIZE = 10;

let currentQ      = 0;
let questions     = [];
let responses     = {};     // qId → answer index | null (AI-viewed) | undefined (unanswered)
let showExp       = {};     // qId → true when user clicked "📖 Explanation"
let aiRequested   = {};     // qId → true when AI fetch is done
let navPage       = 0;      // current page in the question navigator (0-indexed)
let sessionStats  = { correct: 0, wrong: 0, skipped: 0, score: 0 };
let activeFilters = { subject: 'all', exam: 'all', difficulty: 'all', year: 'all', bookmarked: false };

export function renderPractice(params = '') {
  const p = Object.fromEntries(new URLSearchParams(params));
  activeFilters.subject    = p.subject || activeFilters.subject || 'all';
  activeFilters.exam       = p.exam || activeFilters.exam || 'all';
  activeFilters.year       = p.year || activeFilters.year || 'all';
  activeFilters.difficulty = p.diff || activeFilters.difficulty || 'all';
  if (p.bookmarked) activeFilters.bookmarked = p.bookmarked === 'true';

  const allExams = Array.from(new Set(getAllQuestions().map(q => q.exam || q.tag || 'AIAPGET').filter(Boolean))).sort();

  const container = document.getElementById('page-container');
  container.innerHTML = `
    <div class="page-header">
      <h1 class="page-title animate-fade-up">📝 Practice Mode</h1>
      <p class="page-subtitle animate-fade-up delay-1">Filter by subject, exam tag, year, or difficulty and practice at your own pace</p>
    </div>

    <div class="filter-bar animate-fade-up delay-1" id="practice-filters">
      <div style="display:flex;align-items:center;gap:var(--sp-3);flex-wrap:wrap">
        <select class="form-select" style="width:auto;min-width:180px" id="filter-subject">
          <option value="all">📚 All Subjects</option>
          ${SUBJECTS.map(s => `<option value="${s.id}" ${activeFilters.subject===s.id?'selected':''}>${s.icon} ${s.name} (${s.questions}/exam)</option>`).join('')}
        </select>
        <select class="form-select" style="width:auto" id="filter-exam">
          <option value="all">🏷️ All Tags / Exams</option>
          ${allExams.map(ex => `<option value="${esc(ex)}" ${activeFilters.exam === ex ? 'selected' : ''}>🏷️ ${esc(ex)}</option>`).join('')}
        </select>
        <select class="form-select" style="width:auto" id="filter-year">
          <option value="all">📅 All Years</option>
          ${[2025,2024,2023,2022,2021,2020,2019,2018,2017].map(y => `<option value="${y}" ${activeFilters.year == y ?'selected':''}>${y}</option>`).join('')}
        </select>
        <select class="form-select" style="width:auto" id="filter-diff">
          <option value="all">⚡ All Difficulty</option>
          <option value="easy" ${activeFilters.difficulty==='easy'?'selected':''}>Easy</option>
          <option value="medium" ${activeFilters.difficulty==='medium'?'selected':''}>Medium</option>
          <option value="hard" ${activeFilters.difficulty==='hard'?'selected':''}>Hard</option>
        </select>
        <label class="filter-checkbox-pill">
          <input type="checkbox" id="filter-bookmarked" ${activeFilters.bookmarked?'checked':''} style="accent-color:var(--primary)">
          🔖 Bookmarked
        </label>
        <button class="btn btn-primary btn-sm" id="apply-filters">Apply Filters</button>
      </div>
      <div class="badge badge-neutral" style="font-size:.8rem;padding:6px 14px;white-space:nowrap;height:38px;display:inline-flex;align-items:center" id="q-count-label"></div>
    </div>

    <div class="card" style="padding:var(--sp-4) var(--sp-6);margin-bottom:var(--sp-5);display:flex;align-items:center;gap:var(--sp-6);flex-wrap:wrap" id="session-bar">
      <div style="font-weight:700;font-size:.9rem;color:var(--text-3)">Session Score</div>
      <div style="font-size:.9rem"><span style="color:var(--success);font-weight:700" id="s-correct">+0</span> Correct</div>
      <div style="font-size:.9rem"><span style="color:var(--error);font-weight:700" id="s-wrong">-0</span> Wrong</div>
      <div style="font-size:.9rem"><span style="color:var(--text-3);font-weight:700" id="s-score">0</span> Score</div>
      <button class="btn btn-ghost btn-sm" style="margin-left:auto" id="shuffle-btn">🔀 Shuffle</button>
      <button class="btn btn-ghost btn-sm" id="reset-btn">↺ Reset</button>
    </div>

    <div id="practice-question-area">
      <div class="empty-state">
        <span class="empty-state-icon">⏳</span>
        <h3>Loading questions…</h3>
      </div>
    </div>
  `;

  document.getElementById('apply-filters').addEventListener('click', applyFilters);
  document.getElementById('filter-subject').addEventListener('change', e => { activeFilters.subject = e.target.value; });
  document.getElementById('filter-exam').addEventListener('change', e => { activeFilters.exam = e.target.value; });
  document.getElementById('filter-year').addEventListener('change', e => { activeFilters.year = e.target.value; });
  document.getElementById('filter-diff').addEventListener('change', e => { activeFilters.difficulty = e.target.value; });
  document.getElementById('filter-bookmarked').addEventListener('change', e => { activeFilters.bookmarked = e.target.checked; });
  document.getElementById('shuffle-btn').addEventListener('click', () => { questions = shuffle(questions); currentQ = 0; navPage = 0; showQuestion(); });
  document.getElementById('reset-btn').addEventListener('click', () => {
    responses = {}; showExp = {}; aiRequested = {};
    sessionStats = { correct:0,wrong:0,skipped:0,score:0 };
    currentQ = 0; navPage = 0;
    updateSessionBar(); showQuestion();
  });

  applyFilters();
}

function applyFilters() {
  let all = getAllQuestions();
  const bookmarks = lsGet('hp_bookmarks', []);
  if (activeFilters.subject    !== 'all') all = all.filter(q => q.subject === activeFilters.subject);
  if (activeFilters.exam       !== 'all') all = all.filter(q => (q.exam || q.tag || 'AIAPGET').toLowerCase() === activeFilters.exam.toLowerCase());
  if (activeFilters.year       !== 'all') all = all.filter(q => q.year == activeFilters.year);
  if (activeFilters.difficulty !== 'all') all = all.filter(q => q.difficulty === activeFilters.difficulty);
  if (activeFilters.bookmarked) all = all.filter(q => bookmarks.includes(q.id));

  questions   = all;
  currentQ    = 0;
  navPage     = 0;
  responses   = {};
  showExp     = {};
  aiRequested = {};
  sessionStats = { correct: 0, wrong: 0, skipped: 0, score: 0 };
  updateSessionBar();

  const label = document.getElementById('q-count-label');
  if (label) label.textContent = `${questions.length} question${questions.length !== 1 ? 's' : ''} found`;

  showQuestion();
}

// Original explanation = any exp that was NOT AI-generated
function getOriginalExp(q) {
  if (q._original_exp) return q._original_exp;
  if (q.exp && !q.ai_generated_exp) return q.exp;
  return null;
}

function buildNavigator() {
  const total = questions.length;
  const totalNavPages = Math.ceil(total / NAV_PAGE_SIZE);
  const pageStart = navPage * NAV_PAGE_SIZE;
  const pageEnd   = Math.min(pageStart + NAV_PAGE_SIZE, total);

  const btns = questions.slice(pageStart, pageEnd).map((q2, offset) => {
    const absIdx = pageStart + offset;
    const r = responses[q2.id];
    let cls = '';
    if (absIdx === currentQ) cls = 'current';
    else if (r === undefined) cls = '';
    else if (r === null) cls = 'skipped';
    else if (r === q2.correct) cls = 'answered';
    else cls = 'skipped';
    return `<button class="qnum-btn ${cls}" data-qidx="${absIdx}">${absIdx + 1}</button>`;
  }).join('');

  return `
    <div style="margin-top:var(--sp-5)">
      <div style="display:flex;align-items:center;gap:var(--sp-2);margin-bottom:var(--sp-3);flex-wrap:wrap">
        <button class="btn btn-ghost btn-sm" id="nav-prev-page" ${navPage === 0 ? 'disabled' : ''}>← Prev</button>
        <div class="qnum-grid" style="flex:1;min-width:0">${btns}</div>
        <button class="btn btn-ghost btn-sm" id="nav-next-page" ${navPage >= totalNavPages - 1 ? 'disabled' : ''}>Next →</button>
      </div>
      <div style="display:flex;align-items:center;gap:var(--sp-2);font-size:.82rem;color:var(--text-3);flex-wrap:wrap">
        <span>Page</span>
        <input type="number" id="nav-page-input" value="${navPage + 1}" min="1" max="${totalNavPages}"
          style="width:52px;padding:2px 6px;border:1.5px solid var(--border);border-radius:var(--r-sm);font-size:.82rem;text-align:center;outline:none" />
        <span>of ${totalNavPages}</span>
        <span style="margin-left:var(--sp-2);color:var(--text-3)">·</span>
        <span>${total} questions total</span>
        <span style="margin-left:auto;color:var(--text-3)">
          <span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:var(--secondary);margin-right:3px;vertical-align:middle"></span>Correct
          <span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:var(--amber);margin-right:3px;margin-left:6px;vertical-align:middle"></span>Skipped
          <span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:var(--primary);margin-right:3px;margin-left:6px;vertical-align:middle"></span>Current
        </span>
      </div>
    </div>`;
}

function showQuestion(scrollToCard = true) {
  const area = document.getElementById('practice-question-area');
  if (!area) return;

  if (questions.length === 0) {
    area.innerHTML = `<div class="empty-state">
      <span class="empty-state-icon">🔍</span>
      <h3>No questions found</h3>
      <p>Try changing the filters or add more questions via the admin panel.</p>
    </div>`;
    return;
  }

  // Always sync navPage to current question
  navPage = Math.floor(currentQ / NAV_PAGE_SIZE);

  const q = questions[currentQ];
  const bookmarks = lsGet('hp_bookmarks', []);
  const isBookmarked = bookmarks.includes(q.id);
  const resp = responses[q.id];
  const answered = resp !== undefined;

  const subject = SUBJECTS.find(s => s.id === q.subject);
  const originalExp = getOriginalExp(q);
  const hasOrigExp  = !!originalExp;
  const expVisible  = answered || showExp[q.id] || aiRequested[q.id];

  // ─── Bottom-right action button(s) ───────────────────────────────────────
  let actionBtn = '';
  if (!isAiConfigured()) {
    actionBtn = `<button class="btn btn-ghost btn-sm" id="ai-explain-btn">⚙️ Setup AI Key</button>`;
  } else if (hasOrigExp && !expVisible) {
    actionBtn = `
      <button class="btn btn-outline btn-sm" id="exp-btn">📖 Explanation</button>
      <button class="btn btn-ghost btn-sm" id="ai-explain-btn" style="opacity:.55">🤖 AI Explain</button>`;
  } else if (hasOrigExp && expVisible && !aiRequested[q.id]) {
    actionBtn = `<button class="btn btn-ghost btn-sm" id="ai-explain-btn">🤖 AI Explain</button>`;
  } else if (!hasOrigExp && !aiRequested[q.id]) {
    actionBtn = `<button class="btn btn-ghost btn-sm" id="ai-explain-btn">🤖 AI Explain</button>`;
  }

  area.innerHTML = `
    <div class="question-card animate-fade-up" id="question-card">
      <div class="question-meta">
        <span class="question-number">Q${currentQ + 1} of ${questions.length}</span>
        ${subject ? `<span class="badge" style="background:${subject.bg};color:${subject.color}">${subject.icon} ${subject.name}</span>` : ''}
        ${q.year ? `<span class="question-year">${q.year}</span>` : ''}
        <span class="badge ${q.difficulty === 'easy' ? 'badge-success' : q.difficulty === 'hard' ? 'badge-error' : 'badge-warning'}">${q.difficulty || 'medium'}</span>
        <span style="margin-left:auto;cursor:pointer;font-size:1.2rem" id="bookmark-btn" title="${isBookmarked?'Remove bookmark':'Bookmark'}">${isBookmarked ? '🔖' : '🏷️'}</span>
      </div>

      <div class="question-text">${renderRichContent(q.q, q.image_url || q.imageUrl || q.image)}</div>

      <div class="options-grid" id="options-grid">
        ${(q.options || []).map((opt, i) => {
          let cls = '';
          if (answered) {
            if (i === q.correct) cls = 'correct';
            else if (i === resp) cls = 'wrong';
          }
          return `<button class="option-btn ${cls}" data-idx="${i}" ${answered ? 'disabled' : ''}>
            <span class="option-letter">${String.fromCharCode(65+i)}</span>
            <span class="option-text">${opt}</span>
            ${answered && i === q.correct ? '<span style="margin-left:auto">✅</span>' : ''}
            ${answered && i === resp && i !== q.correct ? '<span style="margin-left:auto">❌</span>' : ''}
          </button>`;
        }).join('')}
      </div>

      ${expVisible ? renderExplanation(q, aiRequested[q.id]) : ''}

      <div class="question-actions">
        <div class="flex gap-2">
          <button class="btn btn-outline btn-sm" id="prev-btn" ${currentQ === 0 ? 'disabled' : ''}>← Previous</button>
          <button class="btn btn-primary btn-sm" id="next-btn">${currentQ === questions.length-1 ? 'Finish' : 'Skip →'}</button>
        </div>
        ${answered
          ? `<div class="score-indicator ${resp === null ? '' : resp === q.correct ? 'correct' : 'wrong'}">
              ${resp === null
                ? '<span style="color:var(--text-3)">👁️ Viewed</span>'
                : resp === q.correct ? `✅ +${MARKS_CORRECT} marks` : `❌ ${MARKS_WRONG} mark`}
             </div>`
          : '<div></div>'}
        <div class="flex gap-2">
          ${actionBtn}
          <button class="btn btn-ghost btn-sm" id="report-btn" title="Report issue">⚑</button>
        </div>
      </div>
    </div>

    ${buildNavigator()}
  `;

  // ─── Wire events ────────────────────────────────────────────────────────
  document.querySelectorAll('.option-btn').forEach(btn => {
    btn.addEventListener('click', () => handleAnswer(parseInt(btn.dataset.idx)));
  });

  document.getElementById('prev-btn')?.addEventListener('click', () => {
    currentQ--; showQuestion();
  });
  document.getElementById('next-btn')?.addEventListener('click', () => {
    if (currentQ < questions.length - 1) { currentQ++; showQuestion(); }
    else { toast('Session complete! Check your analytics.', 'success'); }
  });

  document.getElementById('bookmark-btn')?.addEventListener('click', () => toggleBookmark(q.id));

  // "📖 Explanation" button — shows original exp, locks question if not yet answered
  document.getElementById('exp-btn')?.addEventListener('click', () => {
    if (responses[q.id] === undefined) {
      responses[q.id] = null; // lock as viewed, no score recorded
      const td = lsGet('hp_today_done', { questions: 0, flashcards: 0 });
      td.questions++;
      lsSet('hp_today_done', td);
      updateSessionBar();
    }
    showExp[q.id] = true;
    showQuestion(false);
  });

  // "🤖 AI Explain" button
  document.getElementById('ai-explain-btn')?.addEventListener('click', () => {
    if (!isAiConfigured()) {
      toast('Please add a free Groq or Gemini API key in Settings first.', 'warning', 4000);
      window.navigate('settings');
      return;
    }
    if (responses[q.id] === undefined) {
      responses[q.id] = null; // lock as viewed
      const td = lsGet('hp_today_done', { questions: 0, flashcards: 0 });
      td.questions++;
      lsSet('hp_today_done', td);
      updateSessionBar();
    }
    fetchAiExplanation(q);
  });

  // Paginated navigator buttons
  document.querySelectorAll('.qnum-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      currentQ = parseInt(btn.dataset.qidx);
      showQuestion(true); // scroll to card
    });
  });

  document.getElementById('nav-prev-page')?.addEventListener('click', () => {
    if (navPage > 0) {
      navPage--;
      // Jump currentQ to first question of new page
      currentQ = navPage * NAV_PAGE_SIZE;
      showQuestion(true);
    }
  });

  document.getElementById('nav-next-page')?.addEventListener('click', () => {
    const totalNavPages = Math.ceil(questions.length / NAV_PAGE_SIZE);
    if (navPage < totalNavPages - 1) {
      navPage++;
      currentQ = navPage * NAV_PAGE_SIZE;
      showQuestion(true);
    }
  });

  document.getElementById('nav-page-input')?.addEventListener('change', e => {
    const totalNavPages = Math.ceil(questions.length / NAV_PAGE_SIZE);
    const pg = parseInt(e.target.value) - 1;
    if (!isNaN(pg) && pg >= 0 && pg < totalNavPages) {
      navPage = pg;
      currentQ = navPage * NAV_PAGE_SIZE;
      showQuestion(true);
    } else {
      e.target.value = navPage + 1; // reset invalid input
    }
  });

  // ─── Auto-scroll question card into view ─────────────────────────────────
  if (scrollToCard) {
    setTimeout(() => {
      document.getElementById('question-card')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 60);
  }
}

function handleAnswer(selectedIdx) {
  const q = questions[currentQ];
  if (responses[q.id] !== undefined) return; // already answered

  responses[q.id] = selectedIdx;
  const correct = selectedIdx === q.correct;

  if (correct) { sessionStats.correct++; sessionStats.score += MARKS_CORRECT; }
  else          { sessionStats.wrong++;  sessionStats.score += MARKS_WRONG; }
  updateSessionBar();

  const stats = lsGet('hp_stats', { totalAnswered: 0, totalCorrect: 0, mockTests: 0, lastScore: null });
  stats.totalAnswered++;
  if (correct) stats.totalCorrect++;
  lsSet('hp_stats', stats);

  const td = lsGet('hp_today_done', { questions: 0, flashcards: 0 });
  td.questions++;
  lsSet('hp_today_done', td);

  const newBadges = checkAchievements({ totalAnswered: stats.totalAnswered, currentStreak: 0, mockTests: stats.mockTests });
  newBadges.forEach(b => toast(`🏆 Achievement unlocked: ${b.name}!`, 'success', 5000));

  showQuestion(false); // answer click → don't re-scroll, keep user in place
}

function renderExplanation(q, showAiExp = false) {
  const correctLabel = `${String.fromCharCode(65 + q.correct)}. ${q.options[q.correct]}`;
  const originalExp  = getOriginalExp(q);
  const expContent   = showAiExp ? (q.exp || originalExp) : (originalExp || q.exp);
  const imgUrl       = q.image_url || q.imageUrl || q.image || null;

  if (!expContent && !imgUrl) {
    return `<div class="explanation-box">
      <h5>Answer</h5>
      <p>The correct answer is <strong>${correctLabel}</strong></p>
      <p class="ai-disclaimer">No explanation available. Click <strong>🤖 AI Explain</strong> to generate one.</p>
    </div>`;
  }

  return `<div class="explanation-box">
    <h5>${showAiExp ? '🤖 AI-Generated Explanation' : '📖 Explanation'}</h5>
    <p style="font-weight:700;color:var(--primary);margin-bottom:var(--sp-2)">Correct Answer: ${correctLabel}</p>
    <div style="font-size:.92rem;line-height:1.6">${renderRichContent(expContent || '', imgUrl)}</div>
    ${showAiExp && q.badge ? `<div style="margin-top:var(--sp-3);padding-top:var(--sp-2);border-top:1px dashed var(--border);font-size:.72rem;color:var(--text-3);font-family:monospace">${esc(q.badge)}</div>` : ''}
    ${showAiExp ? '<p class="ai-disclaimer">⚠️ AI-generated. Verify before noting.</p>' : ''}
  </div>`;
}

async function fetchAiExplanation(q) {
  const btn = document.getElementById('ai-explain-btn');
  if (btn) { btn.textContent = '⏳ Generating…'; btn.disabled = true; }

  if (q.exp && !q.ai_generated_exp && !q._original_exp) {
    q._original_exp = q.exp;
  }

  try {
    const res = await generateExplanation(q.q, q.options, q.correct);
    q.exp = res.explanation;
    q.badge = res.badge;
    q.ai_generated_exp = true;
    aiRequested[q.id] = true;
    showQuestion(false);
  } catch (err) {
    toast(err.message, 'error', 5000);
    if (btn) { btn.textContent = '🤖 AI Explain'; btn.disabled = false; }
  }
}

async function toggleBookmark(qId) {
  const bookmarks = lsGet('hp_bookmarks', []);
  const idx = bookmarks.indexOf(qId);
  const isAdding = idx === -1;

  if (isAdding) {
    bookmarks.push(qId);
    toast('🔖 Bookmarked!', 'success', 2000);
  } else {
    bookmarks.splice(idx, 1);
    toast('Bookmark removed', 'default', 2000);
  }
  lsSet('hp_bookmarks', bookmarks);

  if (isSupabaseConfigured()) {
    try {
      const session = await getSession();
      if (session?.user) {
        await toggleBookmarkCloud(session.user.id, qId, isAdding);
      }
    } catch (e) {
      console.warn('[Bookmark] Cloud sync warning:', e);
    }
  }

  showQuestion(false);
}

function updateSessionBar() {
  const c = document.getElementById('s-correct'); if (c) c.textContent = `+${sessionStats.correct * 4}`;
  const w = document.getElementById('s-wrong');   if (w) w.textContent = `-${sessionStats.wrong}`;
  const s = document.getElementById('s-score');   if (s) s.textContent = sessionStats.score;
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; }
  return a;
}
