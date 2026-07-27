// admin/upload.js — PDF & Book Question Extractor (AI + Offline Rule-Based Engine)
import { lsGet, lsSet, toast, esc, renderRichContent } from '../../lib/utils.js';
import { SUBJECTS, SUBJECT_MAP, normalizeSubjectId } from '../../data/subjects.js';
import { parseQuestionsFromText, isAiConfigured } from '../../lib/ai.js';
import { batchUpsertQuestions, isConfigured as isSupabaseConfigured } from '../../lib/supabase.js';
import { convertQuestionToFlashcard } from '../../data/flashcards.js';
import { loadCloudQuestions } from '../../data/questions.js';

let parsedQuestions = [];

export function renderAdminUpload() {
  const aiReady = isAiConfigured();

  document.getElementById('page-container').innerHTML = `
    <div class="page-header">
      <h1 class="page-title animate-fade-up">📄 Document & PDF Question Extractor</h1>
      <p class="page-subtitle animate-fade-up delay-1">Paste study materials, web PYQs, or book text — automatically converts them into structured MCQs (${aiReady ? 'AI Powered 🤖' : 'Offline Rule Engine ⚡'})</p>
    </div>

    ${!aiReady ? `
      <div class="card animate-fade-up" style="border-color:var(--secondary);margin-bottom:var(--sp-6);background:var(--secondary-bg)">
        <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:var(--sp-3)">
          <div>
            <h4 style="color:var(--secondary);margin-bottom:2px">⚡ Running in Offline Rule-Based Mode</h4>
            <p style="font-size:.85rem;color:var(--text-2)">
              You can paste questions, web text, or JS arrays directly! To also enable Gemini AI parsing for unformatted text, add a free API key in Settings.
            </p>
          </div>
          <button class="btn btn-secondary btn-sm" onclick="window.navigate('settings')">+ Add Free Gemini API Key</button>
        </div>
      </div>` : ''}

    <div class="grid-2 animate-fade-up delay-1" style="gap:var(--sp-6);margin-bottom:var(--sp-6)">
      <!-- Left: Input Settings & Source -->
      <div class="card">
        <h3 style="margin-bottom:var(--sp-4)">1. Configure Target</h3>
        <div style="display:flex;flex-direction:column;gap:var(--sp-4)">
          <div class="form-group">
            <label class="form-label">Subject *</label>
            <select class="form-select" id="pdf-subject">
              ${SUBJECTS.map(s => `<option value="${s.id}">${s.icon} ${s.name}</option>`).join('')}
            </select>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Exam Tag *</label>
              <select class="form-select" id="pdf-exam">
                <option value="Mock" selected>📝 Mock Test</option>
                <option value="AIAPGET">⚕️ AIAPGET</option>
                <option value="UPSC">🏛️ UPSC (Homoeopathy MO)</option>
                <option value="State PSC">🏛️ State PSC / Medical Officer</option>
                <option value="NIH/PG">🎓 NIH / PG Entrance</option>
                <option value="Other">📌 Other Competitive Exam</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Year (optional)</label>
              <input class="form-input" type="number" id="pdf-year" placeholder="2025" min="2010" max="2030" />
            </div>
            <div class="form-group">
              <label class="form-label">Group / Batch Tag</label>
              <input class="form-input" type="text" id="pdf-group" placeholder="PYQ-2025-Extracted" />
            </div>
          </div>

          <div class="divider-text"><span>2. Provide Content</span></div>

          <div class="form-group">
            <label class="form-label">Paste Raw Text, Web PYQs, or JS Arrays</label>
            <textarea class="form-textarea" id="raw-text-input" rows="8" placeholder="Paste questions here...&#10;&#10;Supported formats:&#10;• JS Arrays: const Q = [{ q: '...', options: [...], correct: 1 }];&#10;• Text: 1. Question text? A. opt1 B. opt2 C. opt3 D. opt4 Answer: B&#10;• Plain book text or notes"></textarea>
          </div>

          <button class="btn btn-primary btn-lg" id="extract-ai-btn">
            ⚡ Extract Questions
          </button>
        </div>
      </div>

      <!-- Right: Preview Extracted Questions -->
      <div class="card">
        <div class="flex justify-between items-center" style="margin-bottom:var(--sp-4)">
          <h3>3. Extracted Questions (<span id="extracted-count">0</span>)</h3>
          <button class="btn btn-secondary btn-sm" id="save-all-extracted" disabled>Save All to Question Bank</button>
        </div>

        <div id="extracted-preview-list" style="min-height:300px;max-height:500px;overflow-y:auto;padding-right:4px">
          <div class="empty-state" style="padding:var(--sp-12) 0">
            <span class="empty-state-icon">📄</span>
            <p>Extracted questions will appear here for your review before saving.</p>
          </div>
        </div>
      </div>
    </div>
  `;

  wireAdminUpload();
}

function wireAdminUpload() {
  document.getElementById('extract-ai-btn')?.addEventListener('click', handleAiExtraction);
  document.getElementById('save-all-extracted')?.addEventListener('click', saveAllExtracted);
}

async function handleAiExtraction() {
  const text    = document.getElementById('raw-text-input').value.trim();
  const subject = document.getElementById('pdf-subject').value;
  const exam    = document.getElementById('pdf-exam').value || 'Mock';
  const year    = parseInt(document.getElementById('pdf-year').value) || null;
  const group   = document.getElementById('pdf-group').value.trim() || null;

  if (!text) return toast('Please paste raw text or document content first.', 'error');

  const btn = document.getElementById('extract-ai-btn');
  const aiReady = isAiConfigured();
  btn.textContent = '⏳ Extracting questions...';
  btn.disabled = true;

  try {
    const questions = await parseQuestionsFromText(text, subject);
    if (!questions || !questions.length) {
      toast('No questions detected in text. Ensure format is Q1... A... B... C... D... Answer: B.', 'warning', 5000);
    } else {
      parsedQuestions = questions.map((q, i) => {
        const imgUrl = q.image || q.imageUrl || q.image_url || q.fig || q.figure || q.img || null;
        return {
          id: q.id || (Date.now() + i),
          q: q.q,
          options: q.options || [],
          correct: typeof q.correct === 'number' ? q.correct : 0,
          subject: normalizeSubjectId(q.subject || subject),
          exam: q.exam || exam || 'Mock',
          year: q.year || year || 2025,
          group_id: group || 'Imported',
          exp: q.exp || '',
          image: imgUrl,
          imageUrl: imgUrl,
          image_url: imgUrl,
          ai_generated_exp: false,
          verified: true,
          difficulty: 'medium',
        };
      });
      toast(`✅ Successfully loaded ${parsedQuestions.length} structured questions!`, 'success');
      renderExtractedPreview();
    }
  } catch (e) {
    toast('Extraction error: ' + e.message, 'error', 6000);
  }

  btn.textContent = '⚡ Extract Questions';
  btn.disabled = false;
}

function renderExtractedPreview() {
  const container = document.getElementById('extracted-preview-list');
  const countEl   = document.getElementById('extracted-count');
  const saveBtn   = document.getElementById('save-all-extracted');

  if (countEl) countEl.textContent = parsedQuestions.length;
  if (saveBtn) saveBtn.disabled = parsedQuestions.length === 0;

  if (!parsedQuestions.length) {
    container.innerHTML = `<div class="empty-state" style="padding:var(--sp-12) 0">
      <span class="empty-state-icon">📄</span>
      <p>Extracted questions will appear here for your review before saving.</p>
    </div>`;
    return;
  }

  container.innerHTML = parsedQuestions.map((q, idx) => {
    const subjInfo = SUBJECT_MAP[q.subject];
    const imgUrl   = q.image || q.imageUrl || q.image_url || null;
    return `
    <div style="padding:var(--sp-3) var(--sp-4);background:var(--bg);border:1px solid var(--border);border-radius:var(--r-md);margin-bottom:var(--sp-3)">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--sp-2);gap:var(--sp-2)">
        <div style="display:flex;align-items:center;gap:var(--sp-2)">
          <span style="font-weight:700;font-size:.8rem;color:var(--primary)">Q${idx + 1}</span>
          ${q.exam ? `<span style="font-size:.72rem;font-weight:600;color:var(--primary);background:var(--primary-bg);padding:2px 8px;border-radius:99px">🏷️ ${esc(q.exam)}</span>` : ''}
          ${subjInfo ? `<span style="font-size:.72rem;font-weight:600;padding:2px 8px;border-radius:99px;background:${subjInfo.bg};color:${subjInfo.color}">${subjInfo.icon} ${subjInfo.name}</span>` : ''}
          ${q.year ? `<span style="font-size:.72rem;color:var(--text-3);background:var(--amber-bg);padding:2px 6px;border-radius:99px">${q.year}</span>` : ''}
        </div>
        <button class="btn btn-danger btn-sm" style="padding:1px 6px;font-size:.7rem" onclick="removeExtracted(${idx})">Remove</button>
      </div>
      <div style="font-weight:600;font-size:.85rem;margin-bottom:var(--sp-2)">${renderRichContent(q.q, imgUrl)}</div>
      <div style="font-size:.8rem;color:var(--text-2);margin-bottom:var(--sp-2)">
        ${(q.options || []).map((opt, i) => `
          <div style="${i === q.correct ? 'font-weight:700;color:var(--success)' : ''}">
            ${String.fromCharCode(65 + i)}. ${esc(opt)} ${i === q.correct ? '✅' : ''}
          </div>`).join('')}
      </div>
      ${q.exp ? `<div style="font-size:.78rem;color:var(--text-3);font-style:italic">Exp: ${renderRichContent(q.exp)}</div>` : ''}
    </div>`;
  }).join('');
}

async function saveAllExtracted() {
  if (!parsedQuestions.length) return;
  const custom = lsGet('hp_questions', []);
  const updated = [...custom, ...parsedQuestions];
  lsSet('hp_questions', updated);

  // Auto-generate flashcards for all newly uploaded questions
  try {
    const customFc = lsGet('hp_flashcards', []);
    const newFcs = parsedQuestions.map(convertQuestionToFlashcard);
    lsSet('hp_flashcards', [...customFc, ...newFcs]);
  } catch (e) {}

  if (isSupabaseConfigured()) {
    toast(`⏳ Uploading ${parsedQuestions.length} questions to Cloud…`, 'default', 3000);
    const { error } = await batchUpsertQuestions(parsedQuestions);
    await loadCloudQuestions();
    if (error) {
      toast(`⚠️ Cloud upload failed: ${error.message}`, 'error', 5000);
    } else {
      toast(`🎉 Uploaded & synced ${parsedQuestions.length} new questions to Cloud!`, 'success', 5000);
    }
  } else {
    const custom = lsGet('hp_questions', []);
    parsedQuestions.forEach(q => custom.push(q));
    lsSet('hp_questions', custom);
    toast(`🎉 Saved ${parsedQuestions.length} new questions!`, 'success', 5000);
  }

  parsedQuestions = [];
  renderExtractedPreview();
}

window.removeExtracted = (idx) => {
  parsedQuestions.splice(idx, 1);
  renderExtractedPreview();
};
