// flashcards.js — Spaced repetition & Adaptive Flashcard System
import { lsGet, lsSet, toast, esc } from '../lib/utils.js';
import { SUBJECTS } from '../data/subjects.js';
import { SEED_FLASHCARDS, getAdaptiveFlashcards } from '../data/flashcards.js';
import { getAllQuestions } from '../data/questions.js';
import { sm2, isDue, sortByDue } from '../lib/sm2.js';

let deck = [];
let currentIdx = 0;
let isFlipped = false;
let mode = 'adaptive'; // 'adaptive' | 'weak' | 'unread' | 'due' | 'all'
let activeSubject = 'all';

export function renderFlashcards() {
  loadDeck();

  const container = document.getElementById('page-container');
  if (!container) return;

  container.innerHTML = `
    <div class="page-header">
      <h1 class="page-title animate-fade-up">🃏 Smart Adaptive Flashcards</h1>
      <p class="page-subtitle animate-fade-up delay-1">Auto-generated from uploaded MCQs & customized to your weak areas and unread topics</p>
    </div>

    <!-- Stats Row -->
    <div class="grid-4 animate-fade-up delay-1" id="fc-stats-row" style="margin-bottom:var(--sp-6)">
      ${renderStatsRow()}
    </div>

    <!-- Mode & Filter Bar -->
    <div class="card animate-fade-up delay-2" style="margin-bottom:var(--sp-6);padding:var(--sp-4) var(--sp-6)">
      <div style="display:flex;align-items:center;gap:var(--sp-2);flex-wrap:wrap">
        <span class="filter-label" style="font-weight:700">Review Mode:</span>
        <button class="btn ${mode === 'adaptive' ? 'btn-primary' : 'btn-outline'} btn-sm" id="mode-adaptive">
          🎯 Smart Adaptive
        </button>
        <button class="btn ${mode === 'weak' ? 'btn-primary' : 'btn-outline'} btn-sm" id="mode-weak">
          🔥 Weak Qs Only
        </button>
        <button class="btn ${mode === 'unread' ? 'btn-primary' : 'btn-outline'} btn-sm" id="mode-unread">
          🌱 Unread Topics
        </button>
        <button class="btn ${mode === 'due' ? 'btn-primary' : 'btn-outline'} btn-sm" id="mode-due">
          🔴 Due Today (${getDueCount()})
        </button>
        <button class="btn ${mode === 'all' ? 'btn-primary' : 'btn-outline'} btn-sm" id="mode-all">
          📚 All Cards
        </button>

        <div style="width:1px;height:24px;background:var(--border);margin:0 var(--sp-2)"></div>
        <select class="form-select" style="width:auto;height:34px;padding:0 28px 0 10px;font-size:.82rem" id="fc-subject-filter">
          <option value="all">📚 All Subjects</option>
          ${SUBJECTS.map(s => `<option value="${s.id}" ${activeSubject === s.id ? 'selected' : ''}>${s.icon} ${s.name}</option>`).join('')}
        </select>
      </div>
    </div>

    <!-- Card Area -->
    <div id="flashcard-area">
      ${renderCardArea()}
    </div>
  `;

  wireControls();
  wireCardEvents();
}

function wireControls() {
  const modes = ['adaptive', 'weak', 'unread', 'due', 'all'];
  modes.forEach(m => {
    document.getElementById(`mode-${m}`)?.addEventListener('click', () => {
      mode = m;
      syncModeButtons();
      loadDeck();
      updateAll();
    });
  });

  document.getElementById('fc-subject-filter')?.addEventListener('change', (e) => {
    activeSubject = e.target.value;
    loadDeck();
    updateAll();
  });
}

function syncModeButtons() {
  const modes = ['adaptive', 'weak', 'unread', 'due', 'all'];
  modes.forEach(m => {
    const btn = document.getElementById(`mode-${m}`);
    if (btn) btn.className = `btn ${mode === m ? 'btn-primary' : 'btn-outline'} btn-sm`;
  });
}

function getAllCards() {
  let states = lsGet('hp_flashcard_states', {});
  if (!states || typeof states !== 'object' || Array.isArray(states)) states = {};

  const custom = lsGet('hp_flashcards', []);
  const allQs  = getAllQuestions();

  const adaptiveList = getAdaptiveFlashcards(mode, allQs, custom);

  return adaptiveList.map(c => ({
    ...c,
    sm2: states[c.id] || null,
  }));
}

function getDueCount() {
  let states = lsGet('hp_flashcard_states', {});
  const custom = lsGet('hp_flashcards', []);
  const allQs  = getAllQuestions();
  return getAdaptiveFlashcards('all', allQs, custom).map(c => ({ ...c, sm2: states[c.id] || null })).filter(isDue).length;
}

function renderStatsRow() {
  const allCards = getAllCards();
  const dueCount = getDueCount();
  const reviewedCount = allCards.filter(c => c.sm2?.repetitions > 0).length;
  const masteredCount = allCards.filter(c => c.sm2?.repetitions >= 5).length;

  return `
    <div class="card" style="text-align:center">
      <div style="font-size:1.8rem;font-weight:700;color:var(--error)">${dueCount}</div>
      <div style="font-size:.8rem;color:var(--text-3)">Due Today</div>
    </div>
    <div class="card" style="text-align:center">
      <div style="font-size:1.8rem;font-weight:700;color:var(--primary)">${allCards.length}</div>
      <div style="font-size:.8rem;color:var(--text-3)">Available Cards</div>
    </div>
    <div class="card" style="text-align:center">
      <div style="font-size:1.8rem;font-weight:700;color:var(--secondary)">${reviewedCount}</div>
      <div style="font-size:.8rem;color:var(--text-3)">Reviewed</div>
    </div>
    <div class="card" style="text-align:center">
      <div style="font-size:1.8rem;font-weight:700;color:var(--success)">${masteredCount}</div>
      <div style="font-size:.8rem;color:var(--text-3)">Mastered</div>
    </div>
  `;
}

function loadDeck() {
  let all = getAllCards();
  if (activeSubject !== 'all') all = all.filter(c => c.subject === activeSubject);
  if (mode === 'due') all = all.filter(isDue);
  deck = mode === 'due' ? sortByDue(all) : all;
  currentIdx = 0;
  isFlipped = false;
}

function updateAll() {
  const statsEl = document.getElementById('fc-stats-row');
  if (statsEl) statsEl.innerHTML = renderStatsRow();

  const dueBtn = document.getElementById('mode-due');
  if (dueBtn) dueBtn.textContent = `🔴 Due Today (${getDueCount()})`;

  const area = document.getElementById('flashcard-area');
  if (area) area.innerHTML = renderCardArea();

  wireCardEvents();
}

function renderCardArea() {
  if (deck.length === 0) {
    return `<div class="empty-state" style="padding:var(--sp-12)">
      <span class="empty-state-icon">🎉</span>
      <h3>${mode === 'due' ? 'All caught up!' : 'No cards found'}</h3>
      <p>${mode === 'due' ? 'No cards due today. Great work! Come back tomorrow.' : 'Try selecting another subject or mode.'}</p>
      ${mode === 'due' ? `<button class="btn btn-outline" style="margin-top:var(--sp-4)" id="empty-browse-all">Browse All Cards</button>` : ''}
    </div>`;
  }

  const card = deck[currentIdx];
  const subj = SUBJECTS.find(s => s.id === card.subject);
  const masteryLevel = card.sm2?.repetitions || 0;
  const masteryPct = Math.min(100, masteryLevel * 20);

  return `
    <div style="max-width:700px;margin:0 auto">
      <!-- Progress -->
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--sp-4);font-size:.85rem;color:var(--text-3)">
        <span>Card ${currentIdx + 1} of ${deck.length}</span>
        <div style="display:flex;gap:var(--sp-3)">
          <span>Mastery: ${masteryPct}%</span>
          ${card.sm2?.nextReview ? `<span>Next: ${new Date(card.sm2.nextReview).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>` : ''}
        </div>
      </div>
      <div class="progress-bar" style="margin-bottom:var(--sp-6)">
        <div class="progress-fill green" style="width:${Math.min(100, Math.round(((currentIdx) / deck.length) * 100))}%"></div>
      </div>

      <!-- Flashcard -->
      <div class="flashcard-scene ${isFlipped ? 'flipped' : ''}" id="flashcard-scene" style="cursor:pointer">
        <div class="flashcard-inner">
          <div class="flashcard-face flashcard-front">
            ${card.badge ? `<span class="badge ${card.badge.includes('Weak') ? 'badge-error' : card.badge.includes('New') ? 'badge-amber' : 'badge-neutral'}" style="position:absolute;top:var(--sp-4);right:var(--sp-4)">${card.badge}</span>` : ''}
            <span class="flashcard-face-label">QUESTION</span>
            <p class="flashcard-text" style="white-space:pre-line">${esc(card.front)}</p>
            ${subj ? `<span class="flashcard-subject badge" style="background:${subj.bg};color:${subj.color}">${subj.icon} ${subj.name}</span>` : ''}
            <div style="position:absolute;bottom:var(--sp-10);font-size:.8rem;color:var(--text-3);opacity:.6">Tap card to reveal answer 👁️</div>
          </div>
          <div class="flashcard-face flashcard-back">
            ${card.badge ? `<span class="badge ${card.badge.includes('Weak') ? 'badge-error' : card.badge.includes('New') ? 'badge-amber' : 'badge-neutral'}" style="position:absolute;top:var(--sp-4);right:var(--sp-4)">${card.badge}</span>` : ''}
            <span class="flashcard-face-label">ANSWER</span>
            <p class="flashcard-text" style="white-space:pre-line">${esc(card.back)}</p>
            ${subj ? `<span class="flashcard-subject badge" style="background:${subj.bg};color:${subj.color}">${subj.icon} ${subj.name}</span>` : ''}
          </div>
        </div>
      </div>

      <!-- Flip Hint / SR Buttons -->
      ${isFlipped ? `
        <div style="text-align:center;margin-top:var(--sp-4);margin-bottom:var(--sp-3)">
          <p style="font-size:.85rem;color:var(--text-3);margin-bottom:var(--sp-4)">How well did you recall this?</p>
          <div class="sr-buttons">
            <button class="sr-btn again" data-quality="0">Again<br><small>&lt; 1 day</small></button>
            <button class="sr-btn hard"  data-quality="2">Hard<br><small>1–2 days</small></button>
            <button class="sr-btn good"  data-quality="4">Good<br><small>~${(card.sm2?.interval || 1) * 2} days</small></button>
            <button class="sr-btn easy"  data-quality="5">Easy<br><small>&gt; ${(card.sm2?.interval || 1) * 3} days</small></button>
          </div>
        </div>
      ` : `
        <div style="text-align:center;margin-top:var(--sp-5)">
          <button class="btn btn-primary btn-lg" id="reveal-card-btn">Reveal Answer 👁️</button>
        </div>
      `}

      <!-- Skip -->
      <div style="text-align:center;margin-top:var(--sp-4)">
        <button class="btn btn-ghost btn-sm" id="skip-card-btn">Skip this card →</button>
      </div>
    </div>

    <!-- Subject Breakdown -->
    <div class="card animate-fade-up" style="margin-top:var(--sp-8);max-width:700px;margin-left:auto;margin-right:auto">
      <h4 style="margin-bottom:var(--sp-4)">📚 Browse by Subject</h4>
      <div style="display:flex;flex-wrap:wrap;gap:var(--sp-2)">
        ${SUBJECTS.map(s => {
          const count = getAllCards().filter(c => c.subject === s.id).length;
          const dueC  = getAllCards().filter(c => c.subject === s.id && isDue(c)).length;
          return `<button class="subject-chip ${activeSubject === s.id ? 'active' : ''}"
            style="background:${s.bg};color:${s.color};border-color:${activeSubject === s.id ? s.color : 'transparent'}"
            data-subject="${s.id}">
            ${s.icon} ${s.name} <span style="opacity:.7">${count}</span>${dueC > 0 ? ` <span style="background:${s.color};color:white;padding:1px 5px;border-radius:99px;font-size:.65rem">${dueC}</span>` : ''}
          </button>`;
        }).join('')}
      </div>
    </div>
  `;
}

function wireCardEvents() {
  document.getElementById('flashcard-scene')?.addEventListener('click', flipCard);
  document.getElementById('reveal-card-btn')?.addEventListener('click', flipCard);
  document.getElementById('skip-card-btn')?.addEventListener('click', skipCard);
  document.getElementById('empty-browse-all')?.addEventListener('click', () => {
    mode = 'all';
    syncModeButtons();
    loadDeck();
    updateAll();
  });

  document.querySelectorAll('.sr-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      rateCard(parseInt(btn.dataset.quality));
    });
  });

  document.querySelectorAll('.subject-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const sId = chip.dataset.subject;
      activeSubject = activeSubject === sId ? 'all' : sId;
      const select = document.getElementById('fc-subject-filter');
      if (select) select.value = activeSubject;
      loadDeck();
      updateAll();
    });
  });
}

function flipCard() {
  isFlipped = !isFlipped;
  const scene = document.getElementById('flashcard-scene');
  if (scene) scene.classList.toggle('flipped', isFlipped);
  updateAll();
}

function rateCard(quality) {
  if (!deck.length || !deck[currentIdx]) return;
  const card = deck[currentIdx];
  const prev = card.sm2 || { repetitions: 0, easeFactor: 2.5, interval: 0 };
  const next = sm2(quality, prev.repetitions, prev.easeFactor, prev.interval);

  // Save state
  let states = lsGet('hp_flashcard_states', {});
  if (!states || typeof states !== 'object' || Array.isArray(states)) states = {};
  states[card.id] = next;
  lsSet('hp_flashcard_states', states);

  // Update today's stats
  const td = lsGet('hp_today_done', { questions: 0, flashcards: 0 });
  td.flashcards++;
  lsSet('hp_today_done', td);

  const qualityLabels = { 0: 'Again', 2: 'Hard', 4: 'Good', 5: 'Easy' };
  toast(`Card rated: ${qualityLabels[quality] || 'Rated'}`, 'success', 2000);

  if (currentIdx < deck.length - 1) {
    currentIdx++;
    isFlipped = false;
  } else {
    toast('🎉 Session complete! All cards reviewed.', 'success', 4000);
    loadDeck();
  }

  updateAll();
}

function skipCard() {
  if (currentIdx < deck.length - 1) {
    currentIdx++;
    isFlipped = false;
    updateAll();
  } else {
    currentIdx = 0;
    isFlipped = false;
    updateAll();
  }
}

// Global exports if needed
window.flipCard = flipCard;
window.rateCard = rateCard;
window.skipCard = skipCard;
