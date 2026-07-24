// admin/questions.js — Admin question management panel
import { lsGet, lsSet, toast, esc } from '../../lib/utils.js';
import { SUBJECTS, normalizeSubjectId } from '../../data/subjects.js';
import { SEED_QUESTIONS, getAllQuestions } from '../../data/questions.js';
import { generateExplanation, parseQuestionsFromText, isAiConfigured } from '../../lib/ai.js';
import { upsertQuestion, batchUpsertQuestions, deleteQuestion as deleteQuestionCloud, isConfigured as isSupabaseConfigured } from '../../lib/supabase.js';

let filterState = { subject: 'all', verified: 'all', search: '' };

export function renderAdminQuestions() {
  document.getElementById('page-container').innerHTML = `
    <div class="page-header flex justify-between items-center" style="flex-wrap:wrap;gap:var(--sp-4)">
      <div>
        <h1 class="page-title animate-fade-up">⚙️ Question Manager</h1>
        <p class="page-subtitle animate-fade-up delay-1">Add, edit, delete and manage the question bank</p>
      </div>
      <div class="flex gap-2 animate-fade-up delay-2">
        <button class="btn btn-secondary" id="import-json-btn">📥 Import JSON</button>
        <button class="btn btn-primary" id="add-q-btn">+ Add Question</button>
      </div>
    </div>

    <!-- Stats -->
    <div class="grid-4 animate-fade-up delay-1" style="margin-bottom:var(--sp-6)">
      ${getQStats()}
    </div>

    <!-- Filter -->
    <div class="filter-bar animate-fade-up delay-2" style="margin-bottom:var(--sp-4)">
      <span class="filter-label">Subject:</span>
      <select class="form-select" style="width:auto" id="aq-subject">
        <option value="all">All</option>
        ${SUBJECTS.map(s => `<option value="${s.id}">${s.icon} ${s.name}</option>`).join('')}
      </select>
      <select class="form-select" style="width:auto" id="aq-verified">
        <option value="all">All Status</option>
        <option value="verified">✅ Verified</option>
        <option value="pending">🔄 AI / Unverified</option>
        <option value="noanswer">❓ No Answer</option>
      </select>
      <input class="form-input" type="search" id="aq-search" placeholder="Search questions…" style="width:240px" />
      <button class="btn btn-primary btn-sm" id="aq-filter-btn">Filter</button>
    </div>

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
          <p class="form-hint" style="margin-top:var(--sp-2)">JSON must match the question schema. See docs for field reference.</p>
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

function renderQuestionList() {
  let all = getAllQuestions();
  if (filterState.subject !== 'all') all = all.filter(q => q.subject === filterState.subject);
  if (filterState.verified === 'verified') all = all.filter(q => q.verified);
  if (filterState.verified === 'pending')  all = all.filter(q => q.ai_generated_exp && !q.verified);
  if (filterState.verified === 'noanswer') all = all.filter(q => q.correct === null || q.correct === undefined);
  if (filterState.search)                  all = all.filter(q => q.q.toLowerCase().includes(filterState.search.toLowerCase()));

  if (!all.length) return `<div class="empty-state"><span class="empty-state-icon">🔍</span><h3>No questions match</h3></div>`;

  return `
    <div style="font-size:.82rem;color:var(--text-3);margin-bottom:var(--sp-3)">Showing ${all.length} question${all.length!==1?'s':''}</div>
    <div style="display:flex;flex-direction:column;gap:var(--sp-2)">
      ${all.slice(0, 50).map((q, i) => {
        const subj = SUBJECTS.find(s => s.id === q.subject);
        const isSeed = SEED_QUESTIONS.find(sq => sq.id === q.id);
        return `
          <div style="padding:var(--sp-4) var(--sp-5);background:white;border:1px solid var(--border);border-radius:var(--r-md);display:flex;align-items:flex-start;gap:var(--sp-4)">
            <div style="flex:1;overflow:hidden">
              <div style="display:flex;gap:var(--sp-2);flex-wrap:wrap;margin-bottom:var(--sp-2)">
                ${subj ? `<span class="badge" style="background:${subj.bg};color:${subj.color}">${subj.icon} ${subj.name}</span>` : ''}
                ${q.year ? `<span class="badge badge-neutral">${q.year}</span>` : ''}
                ${q.verified ? '<span class="badge badge-success">✅ Verified</span>' : ''}
                ${q.ai_generated_exp ? '<span class="badge badge-warning">🤖 AI</span>' : ''}
                ${q.correct === null || q.correct === undefined ? '<span class="badge badge-error">❓ No Answer</span>' : ''}
                ${isSeed ? '<span class="badge badge-neutral">Built-in</span>' : ''}
              </div>
              <p style="font-size:.88rem;color:var(--text-2);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:600px">${esc(q.q)}</p>
            </div>
            <div class="flex gap-2" style="flex-shrink:0">
              ${isAiConfigured() && (q.correct === null || !q.exp) ? `<button class="btn btn-outline btn-sm" onclick="aiGenForQ(${q.id})">🤖 AI</button>` : ''}
              ${!isSeed ? `
                <button class="btn btn-ghost btn-sm" onclick="editQuestion(${q.id})">Edit</button>
                <button class="btn btn-danger btn-sm" onclick="deleteQuestion(${q.id})">Delete</button>
              ` : `<button class="btn btn-ghost btn-sm" onclick="editQuestion(${q.id})">View</button>`}
            </div>
          </div>`;
      }).join('')}
      ${all.length > 50 ? `<p style="text-align:center;color:var(--text-3);font-size:.85rem">Showing first 50 of ${all.length}. Use filters to narrow down.</p>` : ''}
    </div>`;
}

let editingId = null;

function wireAdminQuestions() {
  document.getElementById('aq-filter-btn').addEventListener('click', () => {
    filterState.subject  = document.getElementById('aq-subject').value;
    filterState.verified = document.getElementById('aq-verified').value;
    filterState.search   = document.getElementById('aq-search').value.trim();
    document.getElementById('admin-q-list').innerHTML = renderQuestionList();
  });

  // Import JSON
  document.getElementById('import-json-btn').addEventListener('click', () => {
    document.getElementById('import-modal').classList.remove('hidden');
  });
  document.getElementById('close-import-modal').addEventListener('click', () => document.getElementById('import-modal').classList.add('hidden'));
  document.getElementById('cancel-import').addEventListener('click', () => document.getElementById('import-modal').classList.add('hidden'));
  document.getElementById('json-drop-zone').addEventListener('click', () => document.getElementById('json-file-input').click());
  document.getElementById('json-file-input').addEventListener('change', handleFileImport);
  document.getElementById('do-import').addEventListener('click', doImport);

  // Add Question
  document.getElementById('add-q-btn').addEventListener('click', () => openQuestionModal(null));
  document.getElementById('close-q-modal').addEventListener('click', closeQuestionModal);
  document.getElementById('cancel-q').addEventListener('click', closeQuestionModal);
  document.getElementById('save-q').addEventListener('click', saveQuestion);
  document.getElementById('ai-fill-btn')?.addEventListener('click', aiFillExplanation);
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
  document.getElementById('admin-q-list').innerHTML = renderQuestionList();
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

    arr.forEach(q => {
      if (!q.q) return;
      const imgUrl = q.image || q.imageUrl || q.image_url || q.fig || null;
      const normalized = {
        ...q,
        id: q.id || (Date.now() + added),
        subject: normalizeSubjectId(q.subject),
        image_url: imgUrl,
        imageUrl:  imgUrl,
        image:     imgUrl,
      };
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
    document.getElementById('admin-q-list').innerHTML = renderQuestionList();
  } catch (e) {
    toast('Invalid JSON: ' + e.message, 'error', 5000);
  }
}

window.editQuestion    = (id) => { const all = getAllQuestions(); const q = all.find(q => q.id === id); if (q) openQuestionModal(q); };
window.deleteQuestion  = async (id) => {
  if (!confirm('Delete this question?')) return;
  const custom = lsGet('hp_questions', []).filter(q => q.id !== id);
  lsSet('hp_questions', custom);

  if (isSupabaseConfigured()) {
    await deleteQuestionCloud(id);
  }

  toast('Question deleted.', 'default');
  document.getElementById('admin-q-list').innerHTML = renderQuestionList();
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
    document.getElementById('admin-q-list').innerHTML = renderQuestionList();
  } catch (e) { toast(e.message, 'error', 5000); }
};
