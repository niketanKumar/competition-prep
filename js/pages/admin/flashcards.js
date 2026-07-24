// admin/flashcards.js — Admin flashcard management panel
import { lsGet, lsSet, toast, esc } from '../../lib/utils.js';
import { SUBJECTS } from '../../data/subjects.js';
import { SEED_FLASHCARDS } from '../../data/flashcards.js';

let activeSubjectFilter = 'all';

export function renderAdminFlashcards() {
  document.getElementById('page-container').innerHTML = `
    <div class="page-header flex justify-between items-center" style="flex-wrap:wrap;gap:var(--sp-4)">
      <div>
        <h1 class="page-title animate-fade-up">🃏 Flashcard Manager</h1>
        <p class="page-subtitle animate-fade-up delay-1">Create, edit, and manage spaced repetition flashcard decks</p>
      </div>
      <div class="flex gap-2 animate-fade-up delay-2">
        <button class="btn btn-secondary" id="import-fc-json">📥 Import JSON</button>
        <button class="btn btn-primary" id="add-fc-btn">+ Add Flashcard</button>
      </div>
    </div>

    <!-- Stats -->
    <div class="grid-4 animate-fade-up delay-1" style="margin-bottom:var(--sp-6)">
      ${getFlashcardStats()}
    </div>

    <!-- Subject Filter Bar -->
    <div class="filter-bar animate-fade-up delay-2" style="margin-bottom:var(--sp-5)">
      <span class="filter-label">Filter Subject:</span>
      <select class="form-select" style="width:auto" id="admin-fc-subject">
        <option value="all">All Subjects</option>
        ${SUBJECTS.map(s => `<option value="${s.id}">${s.icon} ${s.name}</option>`).join('')}
      </select>
      <input class="form-input" type="search" id="admin-fc-search" placeholder="Search cards..." style="width:240px" />
      <button class="btn btn-primary btn-sm" id="admin-fc-filter-btn">Filter</button>
    </div>

    <!-- Cards List -->
    <div id="admin-fc-list" class="animate-fade-up delay-3">
      ${renderFlashcardList()}
    </div>

    <!-- Add/Edit Flashcard Modal -->
    <div id="fc-modal" class="modal-overlay hidden">
      <div class="modal" style="max-width:600px">
        <div class="modal-header">
          <h3 id="fc-modal-title">Add Flashcard</h3>
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
              <label class="form-label">Front (Question / Prompt / Keynote) *</label>
              <textarea class="form-textarea" id="fcf-front" rows="3" required placeholder="e.g. What is the keynote modality of Arsenicum Album?"></textarea>
            </div>
            <div class="form-group">
              <label class="form-label">Back (Answer / Details) *</label>
              <textarea class="form-textarea" id="fcf-back" rows="5" required placeholder="e.g. 1-3 AM aggravation, restlessness, chilly, thirst for small sips..."></textarea>
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost" id="cancel-fc">Cancel</button>
          <button class="btn btn-primary" id="save-fc">Save Flashcard</button>
        </div>
      </div>
    </div>

    <!-- JSON Import Modal -->
    <div id="fc-import-modal" class="modal-overlay hidden">
      <div class="modal">
        <div class="modal-header">
          <h3>📥 Import Flashcards from JSON</h3>
          <button class="btn btn-ghost btn-icon" id="close-fc-import">✕</button>
        </div>
        <div class="modal-body">
          <textarea class="form-textarea" id="fc-json-paste" placeholder='[{"id":"f100","subject":"materia-medica","front":"Front text...","back":"Back text...","difficulty":"medium"}]' rows="10"></textarea>
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost" id="cancel-fc-import">Cancel</button>
          <button class="btn btn-primary" id="do-fc-import">Import Deck</button>
        </div>
      </div>
    </div>
  `;

  wireAdminFlashcards();
}

function getFlashcardStats() {
  const allCards = getAllCards();
  const custom = lsGet('hp_flashcards', []);
  return [
    { n: allCards.length, l: 'Total Flashcards', icon: '🃏' },
    { n: custom.length,    l: 'Custom Created',  icon: '✏️' },
    { n: SEED_FLASHCARDS.length, l: 'Built-in Decks', icon: '📦' },
    { n: [...new Set(allCards.map(c=>c.subject))].length, l: 'Subjects Covered', icon: '📚' },
  ].map(s => `
    <div class="card" style="text-align:center">
      <div style="font-size:1.5rem">${s.icon}</div>
      <div style="font-size:1.8rem;font-weight:700;color:var(--primary);margin:var(--sp-2) 0">${s.n}</div>
      <div style="font-size:.8rem;color:var(--text-3)">${s.l}</div>
    </div>`).join('');
}

function getAllCards() {
  const custom = lsGet('hp_flashcards', []);
  return [...SEED_FLASHCARDS, ...custom];
}

function renderFlashcardList() {
  let cards = getAllCards();
  const search = document.getElementById('admin-fc-search')?.value?.toLowerCase() || '';

  if (activeSubjectFilter !== 'all') cards = cards.filter(c => c.subject === activeSubjectFilter);
  if (search) cards = cards.filter(c => c.front.toLowerCase().includes(search) || c.back.toLowerCase().includes(search));

  if (!cards.length) return `<div class="empty-state"><span class="empty-state-icon">🔍</span><h3>No flashcards match</h3></div>`;

  return `
    <div style="display:flex;flex-direction:column;gap:var(--sp-3)">
      ${cards.map(c => {
        const subj = SUBJECTS.find(s => s.id === c.subject);
        const isSeed = SEED_FLASHCARDS.find(sc => sc.id === c.id);
        return `
          <div class="card" style="display:flex;align-items:flex-start;gap:var(--sp-4);padding:var(--sp-4) var(--sp-5)">
            <div style="flex:1">
              <div style="display:flex;gap:var(--sp-2);margin-bottom:var(--sp-2)">
                ${subj ? `<span class="badge" style="background:${subj.bg};color:${subj.color}">${subj.icon} ${subj.name}</span>` : ''}
                <span class="badge badge-neutral">${c.difficulty || 'medium'}</span>
                ${isSeed ? '<span class="badge badge-neutral">Built-in</span>' : ''}
              </div>
              <p style="font-weight:600;font-size:.9rem;color:var(--text);margin-bottom:var(--sp-2)">${esc(c.front)}</p>
              <p style="font-size:.85rem;color:var(--text-3);line-height:1.4">${esc(c.back)}</p>
            </div>
            <div class="flex gap-2" style="flex-shrink:0">
              ${!isSeed ? `
                <button class="btn btn-ghost btn-sm" onclick="editFlashcard('${c.id}')">Edit</button>
                <button class="btn btn-danger btn-sm" onclick="deleteFlashcard('${c.id}')">Delete</button>
              ` : `<button class="btn btn-ghost btn-sm" onclick="editFlashcard('${c.id}')">View</button>`}
            </div>
          </div>`;
      }).join('')}
    </div>`;
}

let editingFcId = null;

function wireAdminFlashcards() {
  document.getElementById('admin-fc-filter-btn').addEventListener('click', () => {
    activeSubjectFilter = document.getElementById('admin-fc-subject').value;
    document.getElementById('admin-fc-list').innerHTML = renderFlashcardList();
  });

  document.getElementById('add-fc-btn').addEventListener('click', () => openFcModal(null));
  document.getElementById('close-fc-modal').addEventListener('click', closeFcModal);
  document.getElementById('cancel-fc').addEventListener('click', closeFcModal);
  document.getElementById('save-fc').addEventListener('click', saveFc);

  document.getElementById('import-fc-json').addEventListener('click', () => document.getElementById('fc-import-modal').classList.remove('hidden'));
  document.getElementById('close-fc-import').addEventListener('click', () => document.getElementById('fc-import-modal').classList.add('hidden'));
  document.getElementById('cancel-fc-import').addEventListener('click', () => document.getElementById('fc-import-modal').classList.add('hidden'));
  document.getElementById('do-fc-import').addEventListener('click', doFcImport);
}

function openFcModal(c) {
  editingFcId = c?.id || null;
  document.getElementById('fc-modal-title').textContent = c ? 'Edit Flashcard' : 'Add Flashcard';
  if (c) {
    document.getElementById('fcf-subject').value = c.subject || '';
    document.getElementById('fcf-diff').value    = c.difficulty || 'medium';
    document.getElementById('fcf-front').value   = c.front || '';
    document.getElementById('fcf-back').value    = c.back || '';
  }
  document.getElementById('fc-modal').classList.remove('hidden');
}

function closeFcModal() { document.getElementById('fc-modal').classList.add('hidden'); editingFcId = null; }

function saveFc() {
  const front   = document.getElementById('fcf-front').value.trim();
  const back    = document.getElementById('fcf-back').value.trim();
  const subject = document.getElementById('fcf-subject').value;
  const diff    = document.getElementById('fcf-diff').value;

  if (!front || !back) return toast('Both front and back text are required.', 'error');

  const card = {
    id: editingFcId || `f_${Date.now()}`,
    front, back, subject, difficulty: diff,
  };

  const custom = lsGet('hp_flashcards', []);
  const idx    = custom.findIndex(c => c.id === card.id);
  if (idx !== -1) custom[idx] = card;
  else custom.push(card);
  lsSet('hp_flashcards', custom);

  closeFcModal();
  toast(`✅ Flashcard ${editingFcId ? 'updated' : 'created'}!`, 'success');
  document.getElementById('admin-fc-list').innerHTML = renderFlashcardList();
}

function doFcImport() {
  const raw = document.getElementById('fc-json-paste').value.trim();
  if (!raw) return toast('Paste JSON array of flashcards first.', 'error');
  try {
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) throw new Error('Expected a JSON array.');
    const custom = lsGet('hp_flashcards', []);
    let count = 0;
    arr.forEach(c => {
      if (!c.front || !c.back || !c.subject) return;
      const id = c.id || `f_${Date.now()}_${count}`;
      if (!custom.find(x => x.id === id)) { custom.push({ ...c, id }); count++; }
    });
    lsSet('hp_flashcards', custom);
    document.getElementById('fc-import-modal').classList.add('hidden');
    toast(`✅ Imported ${count} flashcards!`, 'success');
    document.getElementById('admin-fc-list').innerHTML = renderFlashcardList();
  } catch (e) { toast('Import failed: ' + e.message, 'error', 5000); }
}

window.editFlashcard = (id) => { const c = getAllCards().find(x => x.id === id); if (c) openFcModal(c); };
window.deleteFlashcard = (id) => {
  if (!confirm('Delete this flashcard?')) return;
  const custom = lsGet('hp_flashcards', []).filter(c => c.id !== id);
  lsSet('hp_flashcards', custom);
  toast('Flashcard deleted.', 'default');
  document.getElementById('admin-fc-list').innerHTML = renderFlashcardList();
};
