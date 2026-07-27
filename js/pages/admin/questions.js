// admin/questions.js — Admin question management panel
import { lsGet, lsSet, toast, esc } from '../../lib/utils.js';
import { SUBJECTS, normalizeSubjectId } from '../../data/subjects.js';
import { SEED_QUESTIONS, getAllQuestions } from '../../data/questions.js';
import { generateExplanation, parseQuestionsFromText, normalizeQuestionObject, isAiConfigured } from '../../lib/ai.js';
import { upsertQuestion, batchUpsertQuestions, deleteQuestion as deleteQuestionCloud, isConfigured as isSupabaseConfigured } from '../../lib/supabase.js';

let filterState = { subject: 'all', verified: 'all', exam: 'all', search: '' };
let currentPage = 1;
let pageSize = 25;
let selectedQIds = new Set();

export function renderAdminQuestions() {
  const allExams = Array.from(new Set(getAllQuestions().map(q => q.exam || q.tag || 'AIAPGET').filter(Boolean))).sort();

  document.getElementById('page-container').innerHTML = `
    <div class="page-header flex justify-between items-center" style="flex-wrap:wrap;gap:var(--sp-4)">
      <div>
        <h1 class="page-title animate-fade-up">⚙️ Question Manager</h1>
        <p class="page-subtitle animate-fade-up delay-1">Add, edit, delete, batch manage, and export the question bank</p>
      </div>
      <div class="flex gap-2 animate-fade-up delay-2">
        <button class="btn btn-secondary" id="import-json-btn">📥 Import JSON</button>
        <button class="btn btn-primary" id="add-q-btn">+ Add Question</button>
      </div>
    </div>

    <!-- Stats -->
    <div class="grid-4 animate-fade-up delay-1" id="q-stats-container" style="margin-bottom:var(--sp-6)">
      ${getQStats()}
    </div>

    <!-- Filter & Toolbar -->
    <div class="filter-bar animate-fade-up delay-2" style="margin-bottom:var(--sp-4)">
      <div style="display:flex;align-items:center;gap:var(--sp-3);flex-wrap:wrap">
        <span class="filter-label">Subject:</span>
        <select class="form-select" style="width:auto" id="aq-subject">
          <option value="all">📚 All Subjects</option>
          ${SUBJECTS.map(s => `<option value="${s.id}" ${filterState.subject === s.id ? 'selected' : ''}>${s.icon} ${s.name}</option>`).join('')}
        </select>
        <select class="form-select" style="width:auto" id="aq-exam">
          <option value="all">🏷️ All Tags / Exams</option>
          ${allExams.map(ex => `<option value="${esc(ex)}" ${filterState.exam === ex ? 'selected' : ''}>🏷️ ${esc(ex)}</option>`).join('')}
        </select>
        <select class="form-select" style="width:auto" id="aq-verified">
          <option value="all">All Status</option>
          <option value="verified" ${filterState.verified === 'verified' ? 'selected' : ''}>✅ Verified</option>
          <option value="pending" ${filterState.verified === 'pending' ? 'selected' : ''}>🔄 AI / Unverified</option>
          <option value="noanswer" ${filterState.verified === 'noanswer' ? 'selected' : ''}>❓ No Answer</option>
        </select>
        <input class="form-input" type="search" id="aq-search" placeholder="Search questions…" value="${esc(filterState.search)}" style="width:200px" />
        <button class="btn btn-primary btn-sm" id="aq-filter-btn">Filter</button>
      </div>

      <div style="display:flex;align-items:center;gap:var(--sp-3);margin-left:auto">
        <span class="filter-label">Per Page:</span>
        <select class="form-select" style="width:auto;height:34px;padding:0 24px 0 8px;font-size:.82rem" id="aq-pagesize">
          <option value="25" ${pageSize === 25 ? 'selected' : ''}>25</option>
          <option value="50" ${pageSize === 50 ? 'selected' : ''}>50</option>
          <option value="100" ${pageSize === 100 ? 'selected' : ''}>100</option>
          <option value="all" ${pageSize === 'all' ? 'selected' : ''}>All</option>
        </select>
      </div>
    </div>

    <!-- Floating Bulk Action Bar Container -->
    <div id="bulk-action-bar-container"></div>

    <!-- Question List -->
    <div id="admin-q-list" class="animate-fade-up delay-3">
      ${renderQuestionList()}
    </div>

    <!-- Import JSON Modal (hidden) -->
    <div id="import-modal" class="modal-overlay hidden">
      <div class="modal">
        <div class="modal-header">
          <h3>📥 Import Questions from JSON</h3>
          <button class="btn btn-ghost btn-icon" id="close-import-modal">✕</button>
        </div>
        <div class="modal-body">
          <div class="upload-zone" id="json-drop-zone">
            <span class="upload-icon">📄</span>
            <div class="upload-text">Drop your JSON file here</div>
            <div class="upload-hint">or click to browse • Accepts .json files</div>
            <input type="file" id="json-file-input" accept=".json" style="display:none" />
          </div>
          <div class="divider-text"><span>or paste JSON directly</span></div>
          <textarea class="form-textarea" id="json-paste" placeholder='[{"id":1,"q":"Question...","options":["A","B","C","D"],"correct":0,...}]' rows="8"></textarea>
          <p class="form-hint" style="margin-top:var(--sp-2)">JSON must match the question schema.</p>
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost" id="cancel-import">Cancel</button>
          <button class="btn btn-primary" id="do-import">Import Questions</button>
        </div>
      </div>
    </div>

    <!-- Add/Edit Question Modal (hidden) -->
    <div id="question-modal" class="modal-overlay hidden">
      <div class="modal" style="max-width:700px">
        <div class="modal-header">
          <h3 id="q-modal-title">Add Question</h3>
          <button class="btn btn-ghost btn-icon" id="close-q-modal">✕</button>
        </div>
        <div class="modal-body">
          <form id="q-form" style="display:flex;flex-direction:column;gap:var(--sp-4)">
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Subject *</label>
                <select class="form-select" id="qf-subject" required>
                  ${SUBJECTS.map(s => `<option value="${s.id}">${s.icon} ${s.name}</option>`).join('')}
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Year (optional)</label>
                <input class="form-input" type="number" id="qf-year" placeholder="2025" min="2010" max="2030" />
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Question Text *</label>
              <textarea class="form-textarea" id="qf-q" required placeholder="Enter the question text..." rows="4"></textarea>
            </div>
            <div id="options-fields">
              ${['A','B','C','D'].map(l => `
                <div class="form-group">
                  <label class="form-label">Option ${l}</label>
                  <input class="form-input" type="text" id="qf-opt-${l.toLowerCase()}" placeholder="Option ${l}" />
                </div>`).join('')}
            </div>
            <div class="form-group">
              <label class="form-label">Correct Answer</label>
              <select class="form-select" id="qf-correct">
                <option value="">-- No answer (AI will generate) --</option>
                <option value="0">A</option><option value="1">B</option>
                <option value="2">C</option><option value="3">D</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Explanation (optional)</label>
              <textarea class="form-textarea" id="qf-exp" rows="3" placeholder="Why is this the correct answer?"></textarea>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Exam Tag *</label>
                <select class="form-select" id="qf-exam">
                  <option value="Mock" selected>📝 Mock Test</option>
                  <option value="AIAPGET">⚕️ AIAPGET</option>
                  <option value="UPSC">🏛️ UPSC (Homoeopathy MO)</option>
                  <option value="State PSC">🏛️ State PSC / Medical Officer</option>
                  <option value="NIH/PG">🎓 NIH / PG Entrance</option>
                  <option value="Other">📌 Other Competitive Exam</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Group / Set</label>
                <input class="form-input" type="text" id="qf-group" placeholder="PYQ-2025, Custom Set 1…" />
              </div>
              <div class="form-group">
                <label class="form-label">Difficulty</label>
                <select class="form-select" id="qf-diff">
                  <option value="easy">Easy</option>
                  <option value="medium" selected>Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Image URL (optional)</label>
              <input class="form-input" type="url" id="qf-img" placeholder="https://..." />
            </div>
            <label style="display:flex;align-items:center;gap:var(--sp-2);font-size:.9rem;cursor:pointer">
              <input type="checkbox" id="qf-verified" style="accent-color:var(--primary)" />
              Mark as verified (admin-reviewed)
            </label>
          </form>
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost" id="cancel-q">Cancel</button>
          ${isAiConfigured() ? `<button class="btn btn-outline" id="ai-fill-btn">🤖 AI Fill Explanation</button>` : ''}
          <button class="btn btn-primary" id="save-q">Save Question</button>
        </div>
      </div>
    </div>
  `;

  wireAdminQuestions();
}

function getQStats() {
  const all  = getAllQuestions();
  const custom = lsGet('hp_questions', []);
  const noAns = all.filter(q => q.correct === undefined || q.correct === null).length;
  const aiQ   = all.filter(q => q.ai_generated_exp).length;
  return [
    { n: all.length,    l: 'Total Questions', icon: '📝' },
    { n: custom.length, l: 'Custom Added',    icon: '✏️' },
    { n: noAns,         l: 'Need Answer',     icon: '❓' },
    { n: aiQ,           l: 'AI Pending Review',icon: '🤖' },
  ].map(s => `<div class="card" style="text-align:center">
    <div style="font-size:1.5rem">${s.icon}</div>
    <div style="font-size:1.8rem;font-weight:700;color:var(--primary);margin:var(--sp-2) 0">${s.n}</div>
    <div style="font-size:.8rem;color:var(--text-3)">${s.l}</div>
  </div>`).join('');
}

function getFilteredQuestions() {
  let all = getAllQuestions();
  if (filterState.subject !== 'all') all = all.filter(q => q.subject === filterState.subject);
  if (filterState.exam    !== 'all') all = all.filter(q => (q.exam || q.tag || 'AIAPGET').toLowerCase() === filterState.exam.toLowerCase());
  if (filterState.verified === 'verified') all = all.filter(q => q.verified);
  if (filterState.verified === 'pending')  all = all.filter(q => q.ai_generated_exp && !q.verified);
  if (filterState.verified === 'noanswer') all = all.filter(q => q.correct === null || q.correct === undefined);
  if (filterState.search)                  all = all.filter(q => (q.q || '').toLowerCase().includes(filterState.search.toLowerCase()) || String(q.id).includes(filterState.search));
  return all;
}

function renderQuestionList() {
  const filtered = getFilteredQuestions();

  if (!filtered.length) {
    return `<div class="empty-state"><span class="empty-state-icon">🔍</span><h3>No questions match your filter</h3></div>`;
  }

  // Calculate pagination bounds
  const total = filtered.length;
  const size  = pageSize === 'all' ? total : parseInt(pageSize);
  const totalPages = Math.ceil(total / size) || 1;

  if (currentPage > totalPages) currentPage = totalPages;
  if (currentPage < 1) currentPage = 1;

  const startIdx = (currentPage - 1) * size;
  const endIdx   = pageSize === 'all' ? total : Math.min(startIdx + size, total);
  const pageItems = filtered.slice(startIdx, endIdx);

  const allPageSelected = pageItems.length > 0 && pageItems.every(q => selectedQIds.has(q.id));

  return `
    <!-- Top Table Toolbar -->
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--sp-3);gap:var(--sp-3);flex-wrap:wrap">
      <div style="display:flex;align-items:center;gap:var(--sp-3)">
        <label style="display:flex;align-items:center;gap:var(--sp-2);font-size:.85rem;font-weight:600;cursor:pointer">
          <input type="checkbox" id="master-select-all" ${allPageSelected ? 'checked' : ''} style="width:16px;height:16px;accent-color:var(--primary)">
          Select All on Page
        </label>
        <span style="font-size:.82rem;color:var(--text-3)">Showing ${startIdx + 1}–${endIdx} of ${total} questions</span>
      </div>
      ${selectedQIds.size > 0 ? `<span style="font-size:.85rem;font-weight:700;color:var(--primary)">${selectedQIds.size} selected</span>` : ''}
    </div>

    <!-- Questions Items -->
    <div style="display:flex;flex-direction:column;gap:var(--sp-2)">
      ${pageItems.map((q, i) => {
        const subj = SUBJECTS.find(s => s.id === q.subject);
        const isSeed = SEED_QUESTIONS.find(sq => sq.id === q.id);
        const isSelected = selectedQIds.has(q.id);

        return `
          <div style="padding:var(--sp-3) var(--sp-4);background:white;border:1px solid ${isSelected ? 'var(--primary)' : 'var(--border)'};border-radius:var(--r-md);display:flex;align-items:flex-start;gap:var(--sp-3);${isSelected ? 'background:var(--primary-bg)' : ''}">
            <input type="checkbox" class="q-item-chk" data-id="${q.id}" ${isSelected ? 'checked' : ''} style="width:18px;height:18px;margin-top:4px;accent-color:var(--primary);cursor:pointer">
            <div style="flex:1;overflow:hidden">
              <div style="display:flex;gap:var(--sp-2);flex-wrap:wrap;margin-bottom:var(--sp-2);align-items:center">
                <span style="font-weight:700;font-size:.78rem;color:var(--text-3)">#${q.id}</span>
                ${subj ? `<span class="badge" style="background:${subj.bg};color:${subj.color}">${subj.icon} ${subj.name}</span>` : ''}
                ${q.exam ? `<span class="badge badge-primary">🏷️ ${esc(q.exam)}</span>` : ''}
                ${q.year ? `<span class="badge badge-neutral">${q.year}</span>` : ''}
                ${q.verified ? '<span class="badge badge-success">✅ Verified</span>' : ''}
                ${q.ai_generated_exp ? '<span class="badge badge-warning">🤖 AI</span>' : ''}
                ${q.correct === null || q.correct === undefined ? '<span class="badge badge-error">❓ No Answer</span>' : ''}
                ${isSeed ? '<span class="badge badge-neutral">Built-in</span>' : ''}
              </div>
              <p style="font-size:.88rem;color:var(--text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:700px;font-weight:500">${esc(q.q)}</p>
            </div>
            <div class="flex gap-2" style="flex-shrink:0">
              ${isAiConfigured() && (q.correct === null || !q.exp) ? `<button class="btn btn-outline btn-sm" onclick="aiGenForQ(${q.id})">🤖 AI</button>` : ''}
              ${!isSeed ? `
                <button class="btn btn-ghost btn-sm" onclick="editQuestion(${q.id})">✏️ Edit</button>
                <button class="btn btn-danger btn-sm" onclick="deleteQuestion(${q.id})">🗑️</button>
              ` : `<button class="btn btn-ghost btn-sm" onclick="editQuestion(${q.id})">👁️</button>`}
            </div>
          </div>`;
      }).join('')}
    </div>

    <!-- Bottom Pagination Bar -->
    ${pageSize !== 'all' && totalPages > 1 ? `
      <div class="pagination-bar">
        <div style="font-size:.82rem;color:var(--text-3)">
          Page <strong>${currentPage}</strong> of <strong>${totalPages}</strong>
        </div>
        <div class="pagination-controls">
          <button class="page-num-btn" id="pg-first" ${currentPage === 1 ? 'disabled style="opacity:.4"' : ''}>⏮</button>
          <button class="page-num-btn" id="pg-prev" ${currentPage === 1 ? 'disabled style="opacity:.4"' : ''}>◀</button>
          ${renderPageNumbers(currentPage, totalPages)}
          <button class="page-num-btn" id="pg-next" ${currentPage === totalPages ? 'disabled style="opacity:.4"' : ''}>▶</button>
          <button class="page-num-btn" id="pg-last" ${currentPage === totalPages ? 'disabled style="opacity:.4"' : ''}>⏭</button>
        </div>
      </div>
    ` : ''}
  `;
}

function renderPageNumbers(curr, total) {
  const pages = [];
  const maxShown = 5;
  let start = Math.max(1, curr - 2);
  let end   = Math.min(total, start + maxShown - 1);
  if (end - start < maxShown - 1) start = Math.max(1, end - maxShown + 1);

  for (let p = start; p <= end; p++) {
    pages.push(`<button class="page-num-btn ${p === curr ? 'active' : ''}" data-page="${p}">${p}</button>`);
  }
  return pages.join('');
}

let editingId = null;

function wireAdminQuestions() {
  document.getElementById('aq-filter-btn')?.addEventListener('click', () => {
    filterState.subject  = document.getElementById('aq-subject').value;
    filterState.verified = document.getElementById('aq-verified').value;
    filterState.exam     = document.getElementById('aq-exam')?.value || 'all';
    filterState.search   = document.getElementById('aq-search').value.trim();
    currentPage = 1;
    updateListUI();
  });

  document.getElementById('aq-exam')?.addEventListener('change', (e) => {
    filterState.exam = e.target.value;
    currentPage = 1;
    updateListUI();
  });

  document.getElementById('aq-pagesize')?.addEventListener('change', (e) => {
    pageSize = e.target.value;
    currentPage = 1;
    updateListUI();
  });

  // Import JSON
  document.getElementById('import-json-btn')?.addEventListener('click', () => {
    document.getElementById('import-modal').classList.remove('hidden');
  });
  document.getElementById('close-import-modal')?.addEventListener('click', () => document.getElementById('import-modal').classList.add('hidden'));
  document.getElementById('cancel-import')?.addEventListener('click', () => document.getElementById('import-modal').classList.add('hidden'));
  document.getElementById('json-drop-zone')?.addEventListener('click', () => document.getElementById('json-file-input').click());
  document.getElementById('json-file-input')?.addEventListener('change', handleFileImport);
  document.getElementById('do-import')?.addEventListener('click', doImport);

  // Add Question
  document.getElementById('add-q-btn')?.addEventListener('click', () => openQuestionModal(null));
  document.getElementById('close-q-modal')?.addEventListener('click', closeQuestionModal);
  document.getElementById('cancel-q')?.addEventListener('click', closeQuestionModal);
  document.getElementById('save-q')?.addEventListener('click', saveQuestion);
  document.getElementById('ai-fill-btn')?.addEventListener('click', aiFillExplanation);

  wireListEvents();
}

function updateListUI() {
  const statsEl = document.getElementById('q-stats-container');
  if (statsEl) statsEl.innerHTML = getQStats();

  const listContainer = document.getElementById('admin-q-list');
  if (listContainer) listContainer.innerHTML = renderQuestionList();
  renderBulkActionBar();
  wireListEvents();
}

function wireListEvents() {
  const filtered = getFilteredQuestions();
  const size  = pageSize === 'all' ? filtered.length : parseInt(pageSize);
  const totalPages = Math.ceil(filtered.length / size) || 1;
  const startIdx = (currentPage - 1) * size;
  const pageItems = filtered.slice(startIdx, startIdx + size);

  // Master checkbox
  document.getElementById('master-select-all')?.addEventListener('change', (e) => {
    if (e.target.checked) {
      pageItems.forEach(q => selectedQIds.add(q.id));
    } else {
      pageItems.forEach(q => selectedQIds.delete(q.id));
    }
    updateListUI();
  });

  // Item checkboxes
  document.querySelectorAll('.q-item-chk').forEach(chk => {
    chk.addEventListener('change', (e) => {
      const qId = parseInt(e.target.dataset.id) || e.target.dataset.id;
      if (e.target.checked) selectedQIds.add(qId);
      else selectedQIds.delete(qId);
      renderBulkActionBar();
    });
  });

  // Pagination buttons
  document.getElementById('pg-first')?.addEventListener('click', () => { currentPage = 1; updateListUI(); });
  document.getElementById('pg-prev')?.addEventListener('click', () => { if (currentPage > 1) { currentPage--; updateListUI(); } });
  document.getElementById('pg-next')?.addEventListener('click', () => { if (currentPage < totalPages) { currentPage++; updateListUI(); } });
  document.getElementById('pg-last')?.addEventListener('click', () => { currentPage = totalPages; updateListUI(); });

  document.querySelectorAll('.page-num-btn[data-page]').forEach(btn => {
    btn.addEventListener('click', () => {
      currentPage = parseInt(btn.dataset.page) || 1;
      updateListUI();
    });
  });
}

function renderBulkActionBar() {
  const container = document.getElementById('bulk-action-bar-container');
  if (!container) return;

  if (selectedQIds.size === 0) {
    container.innerHTML = '';
    return;
  }

  container.innerHTML = `
    <div class="bulk-actions-bar">
      <span style="font-weight:700;font-size:.9rem">${selectedQIds.size} questions selected</span>
      <button class="btn btn-success btn-sm" id="bulk-verify-btn">✅ Verify Selected</button>
      <button class="btn btn-secondary btn-sm" id="bulk-export-btn">📥 Export JSON</button>
      <button class="btn btn-danger btn-sm" id="bulk-delete-btn">🗑️ Delete Selected</button>
      <button class="btn btn-ghost btn-sm" id="bulk-clear-btn" style="color:white;opacity:.8">✕ Clear</button>
    </div>
  `;

  document.getElementById('bulk-verify-btn')?.addEventListener('click', handleBulkVerify);
  document.getElementById('bulk-export-btn')?.addEventListener('click', handleBulkExport);
  document.getElementById('bulk-delete-btn')?.addEventListener('click', handleBulkDelete);
  document.getElementById('bulk-clear-btn')?.addEventListener('click', () => {
    selectedQIds.clear();
    updateListUI();
  });
}

async function handleBulkDelete() {
  if (selectedQIds.size === 0) return;
  const count = selectedQIds.size;
  if (!confirm(`Are you sure you want to delete ${count} selected question(s)?`)) return;

  const custom = lsGet('hp_questions', []);
  const idsToDelete = Array.from(selectedQIds);

  const updated = custom.filter(q => !idsToDelete.includes(q.id));
  lsSet('hp_questions', updated);

  if (isSupabaseConfigured()) {
    toast(`⏳ Deleting ${count} questions from Supabase…`, 'default', 2000);
    for (const id of idsToDelete) {
      await deleteQuestionCloud(id);
    }
  }

  selectedQIds.clear();
  toast(`🎉 Deleted ${count} question(s)!`, 'success');
  updateListUI();
}

async function handleBulkVerify() {
  if (selectedQIds.size === 0) return;
  const count = selectedQIds.size;
  const custom = lsGet('hp_questions', []);
  const allQs = getAllQuestions();
  const targetQs = allQs.filter(q => selectedQIds.has(q.id));

  targetQs.forEach(q => { q.verified = true; });

  const updatedCustom = custom.map(cq => {
    if (selectedQIds.has(cq.id)) return { ...cq, verified: true };
    return cq;
  });
  lsSet('hp_questions', updatedCustom);

  if (isSupabaseConfigured()) {
    toast(`⏳ Updating ${count} questions in Supabase…`, 'default', 2000);
    await batchUpsertQuestions(targetQs);
  }

  toast(`✅ Marked ${count} question(s) as verified!`, 'success');
  updateListUI();
}

function handleBulkExport() {
  if (selectedQIds.size === 0) return;
  const allQs = getAllQuestions();
  const selectedQs = allQs.filter(q => selectedQIds.has(q.id));

  const jsonStr = JSON.stringify(selectedQs, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `homeoprep-questions-${selectedQIds.size}qs.json`;
  a.click();
  URL.revokeObjectURL(url);

  toast(`📥 Exported ${selectedQIds.size} questions to JSON!`, 'success');
}

function openQuestionModal(q) {
  editingId = q?.id || null;
  document.getElementById('q-modal-title').textContent = q ? 'Edit Question' : 'Add Question';
  if (q) {
    document.getElementById('qf-subject').value = q.subject || '';
    document.getElementById('qf-year').value    = q.year || '';
    document.getElementById('qf-q').value       = q.q || '';
    document.getElementById('qf-opt-a').value   = q.options?.[0] || '';
    document.getElementById('qf-opt-b').value   = q.options?.[1] || '';
    document.getElementById('qf-opt-c').value   = q.options?.[2] || '';
    document.getElementById('qf-opt-d').value   = q.options?.[3] || '';
    document.getElementById('qf-correct').value = q.correct !== null && q.correct !== undefined ? String(q.correct) : '';
    document.getElementById('qf-exp').value     = q.exp || '';
    document.getElementById('qf-exam').value    = q.exam || 'Mock';
    document.getElementById('qf-group').value   = q.group || '';
    document.getElementById('qf-diff').value    = q.difficulty || 'medium';
    document.getElementById('qf-img').value     = q.image_url || q.imageUrl || q.image || '';
    document.getElementById('qf-verified').checked = !!q.verified;
  } else {
    document.getElementById('qf-exam').value = 'Mock';
  }
  document.getElementById('question-modal').classList.remove('hidden');
}

function closeQuestionModal() { document.getElementById('question-modal').classList.add('hidden'); editingId = null; }

async function saveQuestion() {
  const q = {
    id: editingId || Date.now(),
    subject:    document.getElementById('qf-subject').value,
    exam:       document.getElementById('qf-exam').value || 'Mock',
    year:       parseInt(document.getElementById('qf-year').value) || null,
    q:          document.getElementById('qf-q').value.trim(),
    options:   [
      document.getElementById('qf-opt-a').value.trim(),
      document.getElementById('qf-opt-b').value.trim(),
      document.getElementById('qf-opt-c').value.trim(),
      document.getElementById('qf-opt-d').value.trim(),
    ].filter(Boolean),
    correct:    document.getElementById('qf-correct').value !== '' ? parseInt(document.getElementById('qf-correct').value) : null,
    exp:        document.getElementById('qf-exp').value.trim(),
    group:      document.getElementById('qf-group').value.trim() || null,
    difficulty: document.getElementById('qf-diff').value,
    image_url:  document.getElementById('qf-img').value.trim() || null,
    imageUrl:   document.getElementById('qf-img').value.trim() || null,
    image:      document.getElementById('qf-img').value.trim() || null,
    verified:   document.getElementById('qf-verified').checked,
    ai_generated_exp: false,
  };

  if (!q.q) return toast('Question text is required.', 'error');
  if (!q.subject) return toast('Subject is required.', 'error');

  const custom = lsGet('hp_questions', []);
  const existing = custom.findIndex(c => c.id === q.id);
  if (existing !== -1) custom[existing] = q;
  else custom.push(q);
  lsSet('hp_questions', custom);

  if (isSupabaseConfigured()) {
    const { error } = await upsertQuestion(q);
    if (error) console.warn('[Questions] Supabase upsert error:', error.message);
  }

  closeQuestionModal();
  toast(`✅ Question ${editingId ? 'updated' : 'added'}!`, 'success');
  updateListUI();
}

async function aiFillExplanation() {
  const q       = document.getElementById('qf-q').value.trim();
  const opts    = ['a','b','c','d'].map(l => document.getElementById(`qf-opt-${l}`).value.trim()).filter(Boolean);
  const correct = parseInt(document.getElementById('qf-correct').value);
  if (!q || opts.length < 2 || isNaN(correct)) return toast('Fill in question, options, and correct answer first.', 'error');

  const btn = document.getElementById('ai-fill-btn');
  btn.textContent = '⏳ Generating…'; btn.disabled = true;
  try {
    const { explanation } = await generateExplanation(q, opts, correct);
    document.getElementById('qf-exp').value = explanation;
    toast('✅ AI explanation generated!', 'success');
  } catch (e) {
    toast(e.message, 'error', 5000);
  }
  btn.textContent = '🤖 AI Fill Explanation'; btn.disabled = false;
}

async function handleFileImport(e) {
  const file = e.target.files[0];
  if (!file) return;
  const text = await file.text();
  document.getElementById('json-paste').value = text;
}

async function doImport() {
  const raw = document.getElementById('json-paste').value.trim();
  if (!raw) return toast('Paste your JSON first.', 'error');
  try {
    let parsed;
    try { parsed = JSON.parse(raw); }
    catch { parsed = new Function(`return ${raw}`)(); }
    const arr = Array.isArray(parsed) ? parsed : [parsed];
    const custom = lsGet('hp_questions', []);
    const newItems = [];
    let added = 0;

    arr.forEach((q, idx) => {
      const normalized = normalizeQuestionObject(q, 'materia-medica', added);
      if (!normalized) return;
      if (!custom.find(c => c.id === normalized.id)) {
        custom.push(normalized);
        newItems.push(normalized);
        added++;
      }
    });

    lsSet('hp_questions', custom);

    if (isSupabaseConfigured() && newItems.length > 0) {
      toast(`⏳ Syncing ${newItems.length} questions to Supabase Cloud…`, 'default', 2000);
      const { error } = await batchUpsertQuestions(newItems);
      if (error) console.warn('[Questions] Supabase batch import error:', error.message);
    }

    document.getElementById('import-modal').classList.add('hidden');
    toast(`✅ Imported ${added} question${added!==1?'s':''}!`, 'success');
    updateListUI();
  } catch (e) {
    toast('Invalid JSON: ' + e.message, 'error', 5000);
  }
}

window.editQuestion    = (id) => { const all = getAllQuestions(); const q = all.find(q => q.id === id); if (q) openQuestionModal(q); };
window.deleteQuestion  = async (id) => {
  if (!confirm('Delete this question?')) return;
  const custom = lsGet('hp_questions', []).filter(q => q.id !== id);
  lsSet('hp_questions', custom);
  selectedQIds.delete(id);

  if (isSupabaseConfigured()) {
    await deleteQuestionCloud(id);
  }

  toast('Question deleted.', 'default');
  updateListUI();
};
window.aiGenForQ = async (id) => {
  const all = getAllQuestions();
  const q   = all.find(q => q.id === id);
  if (!q) return;
  try {
    toast('🤖 Generating AI explanation…', 'default', 2000);
    const { explanation } = await generateExplanation(q.q, q.options, q.correct);
    const custom = lsGet('hp_questions', []);
    const ex = custom.find(c => c.id === id);
    if (ex) { ex.exp = explanation; ex.ai_generated_exp = true; }
    else custom.push({ ...q, exp: explanation, ai_generated_exp: true });
    lsSet('hp_questions', custom);
    toast('✅ Explanation added! Please verify it.', 'success');
    updateListUI();
  } catch (e) { toast(e.message, 'error', 5000); }
};
