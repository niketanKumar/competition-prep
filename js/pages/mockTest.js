// mockTest.js — Full mock test engine with timer and +4/-1 scoring
import { lsGet, lsSet, toast, esc, formatDuration, calcScore, scoreGrade, pct, renderRichContent } from '../lib/utils.js';
import { SUBJECTS, TOTAL_QUESTIONS, TEST_DURATION, MARKS_CORRECT, MARKS_WRONG } from '../data/subjects.js';
import { SEED_QUESTIONS, getAllQuestions } from '../data/questions.js';
import { saveTestSession, getSession, isConfigured as isSupabaseConfigured } from '../lib/supabase.js';

let testState = null;
let timerInterval = null;

export function renderMockTest() {
  // If test is in progress, resume
  const saved = lsGet('hp_active_test', null);
  if (saved && saved.status === 'active') {
    testState = saved;
    resumeTest();
    return;
  }

  const container = document.getElementById('page-container');
  const allQ = getAllQuestions();

  container.innerHTML = `
    <div class="page-header">
      <h1 class="page-title animate-fade-up">⏱ Mock Test</h1>
      <p class="page-subtitle animate-fade-up delay-1">Simulate the real AIAPGET exam experience</p>
    </div>

    <div class="grid-2" style="gap:var(--sp-6)">
      <!-- Full Mock -->
      <div class="card animate-fade-up delay-1" style="border-top:4px solid var(--primary)">
        <div style="font-size:2.5rem;margin-bottom:var(--sp-3)">📋</div>
        <h3>Full Mock Test</h3>
        <p style="margin:var(--sp-3) 0 var(--sp-5)">
          120 questions across all subjects in 120 minutes. Mirrors the actual AIAPGET exam pattern with proper subject distribution.
        </p>
        <div style="display:flex;gap:var(--sp-3);flex-wrap:wrap;margin-bottom:var(--sp-5)">
          <span class="badge badge-primary">120 Questions</span>
          <span class="badge badge-warning">120 Minutes</span>
          <span class="badge badge-neutral">+4 / −1</span>
          <span class="badge badge-neutral">Max: 480 marks</span>
        </div>
        <button class="btn btn-primary w-full btn-lg" id="start-full-mock"
                ${allQ.length < 10 ? 'disabled title="Need at least 10 questions"' : ''}>
          Start Full Mock Test
        </button>
        ${allQ.length < 120 ? `<p style="font-size:.78rem;color:var(--amber);margin-top:var(--sp-2)">⚠️ Only ${allQ.length} questions in bank. Full mock needs 120+.</p>` : ''}
      </div>

      <!-- Subject Mock -->
      <div class="card animate-fade-up delay-2" style="border-top:4px solid var(--secondary)">
        <div style="font-size:2.5rem;margin-bottom:var(--sp-3)">🎯</div>
        <h3>Subject-wise Test</h3>
        <p style="margin:var(--sp-3) 0 var(--sp-4)">
          Test yourself on a specific subject. Great for targeted practice on weak areas.
        </p>
        <div class="form-group" style="margin-bottom:var(--sp-4)">
          <label class="form-label">Select Subject</label>
          <select class="form-select" id="subject-mock-select">
            ${SUBJECTS.map(s => {
              const count = allQ.filter(q => q.subject === s.id).length;
              return `<option value="${s.id}">${s.icon} ${s.name} (${count} Qs)</option>`;
            }).join('')}
          </select>
        </div>
        <div class="form-group" style="margin-bottom:var(--sp-4)">
          <label class="form-label">Number of Questions</label>
          <div style="display:flex;gap:var(--sp-3);align-items:center">
            <input type="number" class="form-input" id="custom-q-count" value="20" min="5" max="100" style="width:110px;height:38px" />
            <button class="btn btn-secondary" id="start-subject-mock" style="height:38px;flex:1">Start Test</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Past Mock Tests -->
    <div class="card animate-fade-up delay-3" style="margin-top:var(--sp-6)">
      <h3 style="margin-bottom:var(--sp-5)">📈 Recent Mock Tests</h3>
      ${renderPastTests()}
    </div>

    <!-- Exam Instructions -->
    <div class="card animate-fade-up delay-4" style="margin-top:var(--sp-5);border-color:var(--amber);border-width:1.5px">
      <h4 style="color:var(--amber);margin-bottom:var(--sp-4)">⚠️ Exam Instructions</h4>
      <ul style="display:grid;grid-template-columns:1fr 1fr;gap:var(--sp-3);list-style:disc;padding-left:var(--sp-5)">
        <li style="font-size:.88rem;color:var(--text-2)">120 multiple choice questions</li>
        <li style="font-size:.88rem;color:var(--text-2)">+4 marks for each correct answer</li>
        <li style="font-size:.88rem;color:var(--text-2)">−1 mark for each wrong answer</li>
        <li style="font-size:.88rem;color:var(--text-2)">0 marks for unattempted questions</li>
        <li style="font-size:.88rem;color:var(--text-2)">Total time: 120 minutes</li>
        <li style="font-size:.88rem;color:var(--text-2)">Do not close the tab during test</li>
      </ul>
    </div>
  `;

  document.getElementById('start-full-mock')?.addEventListener('click', () => startTest('full'));
  document.getElementById('start-subject-mock')?.addEventListener('click', () => {
    const subject = document.getElementById('subject-mock-select').value;
    const count   = parseInt(document.getElementById('custom-q-count').value) || 20;
    startTest('subject', { subject, count });
  });
}

function renderPastTests() {
  const sessions = lsGet('hp_test_history', []).slice(0, 5);
  if (!sessions.length) return '<p style="color:var(--text-3);text-align:center;padding:var(--sp-4)">No tests taken yet. Start your first mock test!</p>';
  return `<div style="display:flex;flex-direction:column;gap:var(--sp-3)">
    ${sessions.map(s => `
      <div style="display:flex;align-items:center;gap:var(--sp-5);padding:var(--sp-3) var(--sp-4);background:var(--bg);border-radius:var(--r-md);cursor:pointer"
           onclick="showResults('${s.id}')">
        <div style="font-size:1.5rem">${s.type === 'full' ? '📋' : '🎯'}</div>
        <div style="flex:1">
          <div style="font-weight:600;font-size:.9rem">${s.type === 'full' ? 'Full Mock Test' : `${s.subjectName || 'Subject'} Test`}</div>
          <div style="font-size:.78rem;color:var(--text-3)">${new Date(s.date).toLocaleDateString('en-IN', {day:'numeric',month:'short',year:'numeric'})}</div>
        </div>
        <div style="text-align:right">
          <div style="font-weight:700;font-size:1rem;color:${scoreGrade(s.pct).color}">${s.score}/${s.total}</div>
          <div style="font-size:.78rem;color:var(--text-3)">${s.pct}% • ${s.correct}C ${s.wrong}W ${s.skipped}S</div>
        </div>
      </div>
    `).join('')}
  </div>`;
}

function getAllQuestions() {
  const custom = lsGet('hp_questions', []);
  return [...SEED_QUESTIONS, ...custom];
}

function startTest(type, opts = {}) {
  let pool = getAllQuestions();
  if (type === 'subject') pool = pool.filter(q => q.subject === opts.subject);

  if (pool.length === 0) { toast('No questions available for this selection.', 'error'); return; }

  // Shuffle and cap
  pool = shuffle(pool);
  const limit = type === 'full' ? Math.min(pool.length, TOTAL_QUESTIONS) : Math.min(pool.length, opts.count || 20);
  pool = pool.slice(0, limit);

  const durationSec = type === 'full' ? TEST_DURATION * 60 : Math.max(pool.length * 60, 300);

  testState = {
    id: Date.now().toString(),
    type,
    subject: opts.subject || null,
    questions: pool,
    responses: {},
    flags: {},
    startedAt: Date.now(),
    durationSec,
    remainingSec: durationSec,
    status: 'active',
    currentQ: 0,
  };
  lsSet('hp_active_test', testState);
  resumeTest();
}

function resumeTest() {
  const container = document.getElementById('page-container');
  container.innerHTML = `
    <div class="test-header" id="test-header" style="margin:-var(--sp-8) -var(--sp-8) 0;border-radius:0;box-shadow:var(--shadow-md)">
      <div>
        <div class="timer-display" id="timer">02:00:00</div>
        <div style="font-size:.72rem;color:var(--text-3)">Time remaining</div>
      </div>
      <div class="test-progress-mini">
        <div class="test-progress-label" id="test-progress-label">Q1 of ${testState.questions.length}</div>
        <div class="progress-bar progress-bar-lg">
          <div class="progress-fill" id="test-progress-fill" style="width:0%"></div>
        </div>
      </div>
      <div style="text-align:right">
        <div style="font-weight:700;font-size:1rem" id="live-score">Score: 0</div>
        <div style="font-size:.75rem;color:var(--text-3)">
          <span style="color:var(--success)" id="live-correct">0 ✅</span> |
          <span style="color:var(--error)" id="live-wrong">0 ❌</span> |
          <span style="color:var(--text-3)" id="live-skip">0 —</span>
        </div>
      </div>
      <button class="btn btn-outline btn-sm" id="submit-test-btn">Submit Test</button>
    </div>

    <div style="display:grid;grid-template-columns:1fr 280px;gap:var(--sp-6);align-items:start;margin-top:var(--sp-8)">
      <div id="test-question-area"></div>
      <div class="card" style="position:sticky;top:var(--sp-4)">
        <div style="font-size:.8rem;font-weight:700;margin-bottom:var(--sp-3);color:var(--text-3)">QUESTION NAVIGATOR</div>
        <div class="qnum-grid" id="q-navigator" style="grid-template-columns:repeat(8,1fr)">
          ${testState.questions.map((_, i) => `<button class="qnum-btn ${i === testState.currentQ ? 'current' : ''}" data-i="${i}">${i+1}</button>`).join('')}
        </div>
        <div style="margin-top:var(--sp-4);font-size:.78rem;display:grid;grid-template-columns:1fr 1fr;gap:var(--sp-2)">
          <div style="display:flex;align-items:center;gap:var(--sp-2);padding:4px 8px;background:var(--success-bg);border:1px solid var(--success);border-radius:var(--r-sm);color:var(--success);font-weight:600">
            <span>✅</span> Answered
          </div>
          <div style="display:flex;align-items:center;gap:var(--sp-2);padding:4px 8px;background:var(--surface-2);border:1px solid var(--border-2);border-radius:var(--r-sm);color:var(--text-3);font-weight:500">
            <span>⏸</span> Skipped
          </div>
          <div style="display:flex;align-items:center;gap:var(--sp-2);padding:4px 8px;background:var(--amber-bg);border:1px solid var(--amber);border-radius:var(--r-sm);color:var(--amber);font-weight:600">
            <span>🚩</span> Flagged
          </div>
          <div style="display:flex;align-items:center;gap:var(--sp-2);padding:4px 8px;background:var(--primary-bg);border:1px solid var(--primary);border-radius:var(--r-sm);color:var(--primary);font-weight:600">
            <span>📌</span> Current
          </div>
        </div>
      </div>
    </div>
  `;

  renderTestQuestion();
  startTimer();
  wireTestNav();

  document.getElementById('submit-test-btn').addEventListener('click', () => {
    if (confirm('Are you sure you want to submit the test? You cannot change answers after submitting.')) submitTest();
  });
}

function renderTestQuestion() {
  const q   = testState.questions[testState.currentQ];
  const idx  = testState.currentQ;
  const resp = testState.responses[idx];
  const flagged = testState.flags[idx];
  const area = document.getElementById('test-question-area');
  if (!area) return;

  const subject = SUBJECTS.find(s => s.id === q.subject);

  area.innerHTML = `
    <div class="question-card">
      <div class="question-meta">
        <span class="question-number">Q${idx + 1} of ${testState.questions.length}</span>
        ${subject ? `<span class="badge" style="background:${subject.bg};color:${subject.color}">${subject.icon} ${subject.name}</span>` : ''}
        ${q.year ? `<span class="question-year">${q.year}</span>` : ''}
        <button class="btn btn-ghost btn-sm" id="flag-btn" style="margin-left:auto;color:${flagged?'var(--error)':'var(--text-3)'}" title="Flag for review">
          ${flagged ? '🚩 Flagged' : '⚑ Flag'}
        </button>
      </div>

      <div class="question-text">${renderRichContent(q.q, q.image_url || q.imageUrl || q.image)}</div>

      <div class="options-grid">
        ${(q.options || []).map((opt, i) => `
          <button class="option-btn ${resp === i ? 'selected' : ''}" data-optidx="${i}">
            <span class="option-letter">${String.fromCharCode(65+i)}</span>
            <span class="option-text">${opt}</span>
          </button>`).join('')}
      </div>

      ${resp !== undefined ? `<div style="margin-top:var(--sp-4);font-size:.85rem;color:var(--text-3)">
        Answer selected: <strong>${String.fromCharCode(65 + resp)}</strong> — click another to change it.
      </div>` : ''}

      <div class="question-actions">
        <button class="btn btn-outline btn-sm" id="test-prev-btn" ${idx === 0 ? 'disabled' : ''}>← Previous</button>
        <button class="btn btn-primary btn-sm" id="test-next-btn">
          ${idx === testState.questions.length - 1 ? 'Review & Submit' : 'Next →'}
        </button>
      </div>
    </div>
  `;

  document.querySelectorAll('.option-btn').forEach(btn => {
    btn.addEventListener('click', () => selectTestAnswer(parseInt(btn.dataset.optidx)));
  });
  document.getElementById('test-prev-btn')?.addEventListener('click', () => { testState.currentQ--; saveTestState(); renderTestQuestion(); updateTestNav(); });
  document.getElementById('test-next-btn')?.addEventListener('click', () => {
    if (testState.currentQ < testState.questions.length - 1) { testState.currentQ++; saveTestState(); renderTestQuestion(); updateTestNav(); }
    else submitTest();
  });
  document.getElementById('flag-btn')?.addEventListener('click', () => {
    testState.flags[idx] = !testState.flags[idx];
    saveTestState();
    const btn = document.getElementById('flag-btn');
    if (btn) {
      btn.style.color = testState.flags[idx] ? 'var(--error)' : 'var(--text-3)';
      btn.innerHTML = testState.flags[idx] ? '🚩 Flagged' : '⚑ Flag';
    }
    updateTestNav();
  });
  updateTestProgress();
}

function selectTestAnswer(optIdx) {
  const idx = testState.currentQ;
  testState.responses[idx] = optIdx;
  saveTestState();
  updateLiveScore();
  
  // Highlight selected option button in-place
  document.querySelectorAll('.option-btn').forEach((btn, i) => {
    if (i === optIdx) btn.classList.add('selected');
    else btn.classList.remove('selected');
  });

  updateTestProgress();
  updateTestNav();
}

function updateLiveScore() {
  let correct = 0, wrong = 0, skipped = 0;
  testState.questions.forEach((q, i) => {
    const r = testState.responses[i];
    if (r === undefined) skipped++;
    else if (r === q.correct) correct++;
    else wrong++;
  });
  const score = correct * MARKS_CORRECT + wrong * MARKS_WRONG;
  const el = s => document.getElementById(s);
  if (el('live-score'))   el('live-score').textContent   = `Score: ${score}`;
  if (el('live-correct')) el('live-correct').textContent = `${correct} ✅`;
  if (el('live-wrong'))   el('live-wrong').textContent   = `${wrong} ❌`;
  if (el('live-skip'))    el('live-skip').textContent    = `${skipped} —`;
}

function updateTestProgress() {
  const done = Object.keys(testState.responses).length;
  const total = testState.questions.length;
  const el = s => document.getElementById(s);
  if (el('test-progress-label')) el('test-progress-label').textContent = `Q${testState.currentQ+1} of ${total} • ${done} answered`;
  if (el('test-progress-fill'))  el('test-progress-fill').style.width = pct(done, total) + '%';
}

function updateTestNav() {
  document.querySelectorAll('.qnum-btn').forEach(btn => {
    const i = parseInt(btn.dataset.i);
    btn.className = 'qnum-btn';
    if (i === testState.currentQ)            btn.classList.add('current');
    else if (testState.flags[i])             btn.classList.add('flagged');
    else if (testState.responses[i] !== undefined) btn.classList.add('answered');
  });
}

function wireTestNav() {
  document.getElementById('q-navigator')?.addEventListener('click', (e) => {
    const btn = e.target.closest('.qnum-btn');
    if (btn) { testState.currentQ = parseInt(btn.dataset.i); saveTestState(); renderTestQuestion(); updateTestNav(); }
  });
}

function startTimer() {
  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    testState.remainingSec--;
    if (testState.remainingSec <= 0) { clearInterval(timerInterval); submitTest(); return; }
    saveTestState();
    updateTimerDisplay();
  }, 1000);
  updateTimerDisplay();
}

function updateTimerDisplay() {
  const el = document.getElementById('timer');
  if (!el) { clearInterval(timerInterval); return; }
  const s = testState.remainingSec;
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  el.textContent = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
  el.className = 'timer-display' + (s < 300 ? ' danger' : s < 600 ? ' warning' : '');
}

function saveTestState() {
  lsSet('hp_active_test', testState);
}

async function submitTest() {
  clearInterval(timerInterval);
  testState.status = 'completed';
  testState.completedAt = Date.now();
  lsRemove('hp_active_test');

  // Build result
  let correct = 0, wrong = 0, skipped = 0;
  const responses = testState.questions.map((q, i) => {
    const r = testState.responses[i];
    if (r === undefined) { skipped++; return { ...q, selected: null, isCorrect: false }; }
    const ok = r === q.correct;
    if (ok) correct++; else wrong++;
    return { ...q, selected: r, isCorrect: ok };
  });

  const score  = correct * MARKS_CORRECT + wrong * MARKS_WRONG;
  const total  = testState.questions.length * MARKS_CORRECT;
  const p      = Math.round((score / total) * 100);
  const timeTaken = testState.durationSec - testState.remainingSec;

  const result = {
    id: testState.id,
    type: testState.type,
    date: new Date().toISOString(),
    questions: responses,
    correct, wrong, skipped, score, total,
    pct: p, timeTaken,
  };

  // Save to history
  const history = lsGet('hp_test_history', []);
  history.unshift(result);
  lsSet('hp_test_history', history);

  // Sync to Supabase Cloud if user is logged in
  if (isSupabaseConfigured()) {
    try {
      const session = await getSession();
      if (session?.user) {
        await saveTestSession({
          user_id: session.user.id,
          test_type: testState.type || 'mock',
          score: score,
          total_questions: testState.questions.length,
          correct_count: correct,
          wrong_count: wrong,
          skipped_count: skipped,
          duration_seconds: timeTaken,
        });
      }
    } catch (e) {
      console.warn('[MockTest] Cloud session save warning:', e);
    }
  }

  // Update stats
  const stats = lsGet('hp_stats', { totalAnswered: 0, totalCorrect: 0, mockTests: 0, lastScore: null });
  stats.mockTests++;
  stats.lastScore = score;
  stats.totalAnswered += responses.length;
  stats.totalCorrect  += correct;
  lsSet('hp_stats', stats);

  testState = null;
  lsSet('hp_last_result_id', result.id);
  window.navigate('results');
}

function lsRemove(k) { try { localStorage.removeItem(k); } catch {} }
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}
  return a;
}
