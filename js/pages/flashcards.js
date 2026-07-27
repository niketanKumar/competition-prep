// flashcards.js — Spaced repetition, Adaptive Flashcards & Full Flashcard Management (CRUD)
import { lsGet, lsSet, toast, esc } from '../lib/utils.js';
import { SUBJECTS } from '../data/subjects.js';
import { SEED_FLASHCARDS, getAdaptiveFlashcards, convertQuestionToFlashcard } from '../data/flashcards.js';
import { getAllQuestions } from '../data/questions.js';
import { sm2, isDue, sortByDue } from '../lib/sm2.js';

let deck = [];
let currentIdx = 0;
let isFlipped = false;
let mode = 'adaptive'; // 'adaptive' | 'weak' | 'unread' | 'due' | 'all'
let activeSubject = 'all';
let currentTab = 'study'; // 'study' | 'manage'
let selectedFcIds = new Set();
let fcSearch = '';
let fcPage = 1;
let fcPageSize = 25;
let editingFcId = null;

export function renderFlashcards() {
  loadDeck();

  const container = document.getElementById('page-container');
  if (!container) return;

  container.innerHTML = `
    <div class="page-header flex justify-between items-center" style="flex-wrap:wrap;gap:var(--sp-4)">
      <div>
        <h1 class="page-title animate-fade-up">🃏 Flashcards Center</h1>
        <p class="page-subtitle animate-fade-up delay-1">Study, create, edit, delete, and bulk manage your adaptive flashcards</p>
      </div>
      <div class="flex gap-2 animate-fade-up delay-2">
        <button class="btn ${currentTab === 'study' ? 'btn-primary' : 'btn-outline'}" id="tab-study-btn">🃏 Study Cards</button>
        <button class="btn ${currentTab === 'manage' ? 'btn-primary' : 'btn-outline'}" id="tab-manage-btn">⚙️ Manage Cards</button>
      </div>
    </div>

    ${currentTab === 'study' ? renderStudyView() : renderManageView()}

    <!-- Add/Edit Flashcard Modal -->
    <div id="fc-modal" class="modal-overlay hidden">
      <div class="modal" style="max-width:650px">
        <div class="modal-header">
          <h3 id="fc-modal-title">Add Custom Flashcard</h3>
          <button class="btn btn-ghost btn-icon" id="close-fc-modal">✕</button>
        </div>
        <div class="modal-body">
          <form id="fc-form" style="display:flex;flex-direction:column;gap:var(--sp-4)">
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Subject *</label>
                <select class="form-select" id="fcf-subject" required>
                  ${SUBJECTS.map(s => `<option value="${s.id}">${s.icon} ${s.name}</option>`).join('')}
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Difficulty</label>
                <select class="form-select" id="fcf-diff">
                  <option value="easy">Easy</option>
                  <option value="medium" selected>Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Front (Question / Prompt) *</label>
              <textarea class="form-textarea" id="fcf-front" rows="4" required placeholder="Enter the prompt or question..."></textarea>
            </div>
            <div class="form-group">
              <label class="form-label">Back (Answer / Key points) *</label>
              <textarea class="form-textarea" id="fcf-back" rows="4" required placeholder="Enter the answer or key explanation..."></textarea>
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost" id="cancel-fc">Cancel</button>
          <button class="btn btn-primary" id="save-fc">Save Flashcard</button>
        </div>
      </div>
    </div>
  `;

  wireMainEvents();
  if (currentTab === 'study') {
    wireControls();
    wireCardEvents();
  } else {
    wireManageEvents();
  }
}

function renderStudyView() {
  return `
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
}

function renderManageView() {
  const allCards = getAllCards();
  let filtered = allCards;
  if (activeSubject !== 'all') filtered = filtered.filter(c => c.subject === activeSubject);
  if (fcSearch) {
    const s = fcSearch.toLowerCase();
    filtered = filtered.filter(c => (c.front || '').toLowerCase().includes(s) || (c.back || '').toLowerCase().includes(s));
  }

  const total = filtered.length;
  const size  = fcPageSize === 'all' ? total : parseInt(fcPageSize);
  const totalPages = Math.ceil(total / size) || 1;
  if (fcPage > totalPages) fcPage = totalPages;
  if (fcPage < 1) fcPage = 1;

  const startIdx = (fcPage - 1) * size;
  const endIdx   = fcPageSize === 'all' ? total : Math.min(startIdx + size, total);
  const pageItems = filtered.slice(startIdx, endIdx);
  const allPageSelected = pageItems.length > 0 && pageItems.every(c => selectedFcIds.has(c.id));

  return `
    <!-- Manager Toolbar -->
    <div class="filter-bar animate-fade-up delay-1" style="margin-bottom:var(--sp-4)">
      <div style="display:flex;align-items:center;gap:var(--sp-3);flex-wrap:wrap">
        <button class="btn btn-primary btn-sm" id="fc-add-btn">+ Add Flashcard</button>
        <span class="filter-label">Subject:</span>
        <select class="form-select" style="width:auto" id="fc-mgr-subject">
          <option value="all">📚 All Subjects</option>
          ${SUBJECTS.map(s => `<option value="${s.id}" ${activeSubject === s.id ? 'selected' : ''}>${s.icon} ${s.name}</option>`).join('')}
        </select>
        <input class="form-input" type="search" id="fc-mgr-search" placeholder="Search cards…" value="${esc(fcSearch)}" style="width:200px" />
      </div>
      <div style="display:flex;align-items:center;gap:var(--sp-3);margin-left:auto">
        <span class="filter-label">Per Page:</span>
        <select class="form-select" style="width:auto;height:34px;padding:0 24px 0 8px;font-size:.82rem" id="fc-pagesize">
          <option value="25" ${fcPageSize === 25 ? 'selected' : ''}>25</option>
          <option value="50" ${fcPageSize === 50 ? 'selected' : ''}>50</option>
          <option value="100" ${fcPageSize === 100 ? 'selected' : ''}>100</option>
          <option value="all" ${fcPageSize === 'all' ? 'selected' : ''}>All</option>
        </select>
      </div>
    </div>

    <!-- Bulk Action Bar -->
    <div id="fc-bulk-bar-container">
      ${renderFcBulkBar()}
    </div>

    <!-- Cards List -->
    <div style="display:flex;flex-direction:column;gap:var(--sp-3);margin-bottom:var(--sp-6)">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--sp-2)">
        <label style="display:flex;align-items:center;gap:var(--sp-2);font-size:.85rem;font-weight:600;cursor:pointer">
          <input type="checkbox" id="master-fc-select" ${allPageSelected ? 'checked' : ''} style="width:16px;height:16px;accent-color:var(--primary)">
          Select All on Page
        </label>
        <span style="font-size:.82rem;color:var(--text-3)">Showing ${startIdx + 1}–${endIdx} of ${total} cards</span>
      </div>

      ${pageItems.length === 0 ? `
        <div class="empty-state"><span class="empty-state-icon">🔍</span><h3>No flashcards found</h3></div>
      ` : pageItems.map(card => {
        const subj = SUBJECTS.find(s => s.id === card.subject);
        const isSelected = selectedFcIds.has(card.id);
        const isCustom = String(card.id).startsWith('fc-');

        return `
          <div style="padding:var(--sp-3) var(--sp-4);background:white;border:1px solid ${isSelected ? 'var(--primary)' : 'var(--border)'};border-radius:var(--r-md);display:flex;align-items:flex-start;gap:var(--sp-3);${isSelected ? 'background:var(--primary-bg)' : ''}">
            <input type="checkbox" class="fc-item-chk" data-id="${card.id}" ${isSelected ? 'checked' : ''} style="width:18px;height:18px;margin-top:4px;accent-color:var(--primary);cursor:pointer">
            <div style="flex:1;overflow:hidden">
              <div style="display:flex;gap:var(--sp-2);flex-wrap:wrap;margin-bottom:var(--sp-2);align-items:center">
                <span style="font-weight:700;font-size:.78rem;color:var(--text-3)">#${card.id}</span>
                ${subj ? `<span class="badge" style="background:${subj.bg};color:${subj.color}">${subj.icon} ${subj.name}</span>` : ''}
                ${card.badge ? `<span class="badge badge-neutral">${card.badge}</span>` : ''}
                ${isCustom ? '<span class="badge badge-primary">Custom Card</span>' : ''}
              </div>
              <div style="font-size:.88rem;color:var(--text);font-weight:600;margin-bottom:4px">Q: ${esc(card.front.replace(/<[^>]*>?/gm, '').slice(0, 140))}</div>
              <div style="font-size:.82rem;color:var(--text-2)">A: ${esc(card.back.replace(/<[^>]*>?/gm, '').slice(0, 140))}</div>
            </div>
            <div class="flex gap-2" style="flex-shrink:0">
              <button class="btn btn-ghost btn-sm" onclick="editFlashcard('${card.id}')">✏️ Edit</button>
              <button class="btn btn-danger btn-sm" onclick="deleteFlashcard('${card.id}')">🗑️</button>
            </div>
          </div>
        `;
      }).join('')}
    </div>

    <!-- Pagination -->
    ${fcPageSize !== 'all' && totalPages > 1 ? `
      <div class="pagination-bar">
        <div style="font-size:.82rem;color:var(--text-3)">Page <strong>${fcPage}</strong> of <strong>${totalPages}</strong></div>
        <div class="pagination-controls">
          <button class="page-num-btn" id="fc-pg-prev" ${fcPage === 1 ? 'disabled style="opacity:.4"' : ''}>◀</button>
          <button class="page-num-btn" id="fc-pg-next" ${fcPage === totalPages ? 'disabled style="opacity:.4"' : ''}>▶</button>
        </div>
      </div>
    ` : ''}
  `;
}

function renderFcBulkBar() {
  if (selectedFcIds.size === 0) return '';
  return `
    <div class="bulk-actions-bar" style="margin-bottom:var(--sp-4)">
      <span style="font-weight:700;font-size:.9rem">${selectedFcIds.size} card(s) selected</span>
      <button class="btn btn-danger btn-sm" id="fc-bulk-del-btn">🗑️ Delete Selected</button>
      <button class="btn btn-ghost btn-sm" id="fc-bulk-clear-btn" style="color:white;opacity:.8">✕ Clear</button>
    </div>
  `;
}

function wireMainEvents() {
  document.getElementById('tab-study-btn')?.addEventListener('click', () => { currentTab = 'study'; renderFlashcards(); });
  document.getElementById('tab-manage-btn')?.addEventListener('click', () => { currentTab = 'manage'; renderFlashcards(); });
  document.getElementById('close-fc-modal')?.addEventListener('click', closeFcModal);
  document.getElementById('cancel-fc')?.addEventListener('click', closeFcModal);
  document.getElementById('save-fc')?.addEventListener('click', saveFcModal);
}

function wireManageEvents() {
  document.getElementById('fc-add-btn')?.addEventListener('click', () => openFcModal(null));
  document.getElementById('fc-mgr-subject')?.addEventListener('change', (e) => { activeSubject = e.target.value; renderFlashcards(); });
  document.getElementById('fc-mgr-search')?.addEventListener('input', (e) => { fcSearch = e.target.value.trim(); renderFlashcards(); });
  document.getElementById('fc-pagesize')?.addEventListener('change', (e) => { fcPageSize = e.target.value; fcPage = 1; renderFlashcards(); });

  const allCards = getAllCards();
  let filtered = allCards;
  if (activeSubject !== 'all') filtered = filtered.filter(c => c.subject === activeSubject);
  const size = fcPageSize === 'all' ? filtered.length : parseInt(fcPageSize);
  const startIdx = (fcPage - 1) * size;
  const pageItems = filtered.slice(startIdx, startIdx + size);

  document.getElementById('master-fc-select')?.addEventListener('change', (e) => {
    if (e.target.checked) pageItems.forEach(c => selectedFcIds.add(c.id));
    else pageItems.forEach(c => selectedFcIds.delete(c.id));
    renderFlashcards();
  });

  document.querySelectorAll('.fc-item-chk').forEach(chk => {
    chk.addEventListener('change', (e) => {
      const id = e.target.dataset.id;
      if (e.target.checked) selectedFcIds.add(id);
      else selectedFcIds.delete(id);
      renderFlashcards();
    });
  });

  document.getElementById('fc-bulk-del-btn')?.addEventListener('click', handleFcBulkDelete);
  document.getElementById('fc-bulk-clear-btn')?.addEventListener('click', () => { selectedFcIds.clear(); renderFlashcards(); });
  document.getElementById('fc-pg-prev')?.addEventListener('click', () => { if (fcPage > 1) { fcPage--; renderFlashcards(); } });
  document.getElementById('fc-pg-next')?.addEventListener('click', () => { fcPage++; renderFlashcards(); });
}

function handleFcBulkDelete() {
  if (selectedFcIds.size === 0) return;
  const count = selectedFcIds.size;
  if (!confirm(`Delete ${count} selected flashcard(s)?`)) return;

  const ids = Array.from(selectedFcIds);
  const custom = lsGet('hp_flashcards', []).filter(c => !ids.includes(c.id));
  lsSet('hp_flashcards', custom);

  const disabled = lsGet('hp_disabled_flashcards', []);
  ids.forEach(id => { if (!disabled.includes(id)) disabled.push(id); });
  lsSet('hp_disabled_flashcards', disabled);

  selectedFcIds.clear();
  toast(`🎉 Deleted ${count} flashcard(s)!`, 'success');
  renderFlashcards();
}

function openFcModal(card) {
  editingFcId = card?.id || null;
  document.getElementById('fc-modal-title').textContent = card ? 'Edit Flashcard' : 'Add Custom Flashcard';
  if (card) {
    document.getElementById('fcf-subject').value = card.subject || 'materia-medica';
    document.getElementById('fcf-diff').value    = card.difficulty || 'medium';
    document.getElementById('fcf-front').value   = card.front || '';
    document.getElementById('fcf-back').value    = card.back || '';
  } else {
    document.getElementById('fcf-front').value   = '';
    document.getElementById('fcf-back').value    = '';
  }
  document.getElementById('fc-modal').classList.remove('hidden');
}

function closeFcModal() {
  document.getElementById('fc-modal').classList.add('hidden');
  editingFcId = null;
}

function saveFcModal() {
  const front = document.getElementById('fcf-front').value.trim();
  const back  = document.getElementById('fcf-back').value.trim();
  const subject = document.getElementById('fcf-subject').value;
  const difficulty = document.getElementById('fcf-diff').value;

  if (!front || !back) return toast('Please enter front and back text.', 'error');

  const custom = lsGet('hp_flashcards', []);
  const newCard = {
    id: editingFcId || `fc-${Date.now()}`,
    subject,
    difficulty,
    front,
    back,
    badge: '📚 Custom Card'
  };

  const existingIdx = custom.findIndex(c => c.id === newCard.id);
  if (existingIdx !== -1) custom[existingIdx] = newCard;
  else custom.push(newCard);

  lsSet('hp_flashcards', custom);
  closeFcModal();
  toast(`✅ Flashcard ${editingFcId ? 'updated' : 'created'}!`, 'success');
  renderFlashcards();
}

window.editFlashcard = (id) => {
  const card = getAllCards().find(c => c.id === id);
  if (card) openFcModal(card);
};

window.deleteFlashcard = (id) => {
  if (!confirm('Delete this flashcard?')) return;

  const custom = lsGet('hp_flashcards', []).filter(c => c.id !== id);
  lsSet('hp_flashcards', custom);

  const disabled = lsGet('hp_disabled_flashcards', []);
  if (!disabled.includes(id)) disabled.push(id);
  lsSet('hp_disabled_flashcards', disabled);

  selectedFcIds.delete(id);
  toast('Flashcard deleted.', 'default');
  renderFlashcards();
};

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

  const custom   = lsGet('hp_flashcards', []);
  const disabled = lsGet('hp_disabled_flashcards', []);
  const allQs    = getAllQuestions();

  if (currentTab === 'manage') {
    const autoFc = allQs.map(q => convertQuestionToFlashcard(q));
    const combined = [...custom, ...SEED_FLASHCARDS, ...autoFc];

    const seenIds = new Set();
    const list = combined.filter(c => {
      if (!c || !c.id) return false;
      const sId = String(c.id);
      if (disabled.includes(c.id) || disabled.includes(sId)) return false;
      if (seenIds.has(sId)) return false;
      seenIds.add(sId);
      return true;
    });

    return list.map(c => ({ ...c, sm2: states[c.id] || null }));
  }

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

  let states = lsGet('hp_flashcard_states', {});
  if (!states || typeof states !== 'object' || Array.isArray(states)) states = {};
  states[card.id] = next;
  lsSet('hp_flashcard_states', states);

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

window.flipCard = flipCard;
window.rateCard = rateCard;
window.skipCard = skipCard;
