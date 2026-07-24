// results.js — Detailed test results and analysis
import { lsGet, formatDuration, scoreGrade, pct, esc, renderRichContent } from '../lib/utils.js';
import { SUBJECTS } from '../data/subjects.js';

export function renderResults() {
  const resultId = lsGet('hp_last_result_id', null);
  const history  = lsGet('hp_test_history', []);
  const result   = history.find(r => r.id === resultId) || history[0];

  if (!result) {
    document.getElementById('page-container').innerHTML = `
      <div class="empty-state" style="padding-top:var(--sp-16)">
        <span class="empty-state-icon">📋</span>
        <h3>No results yet</h3>
        <p>Take a mock test first to see your results.</p>
        <button class="btn btn-primary" style="margin-top:var(--sp-5)" onclick="window.navigate('mock-test')">Start Mock Test</button>
      </div>`;
    return;
  }

  const grade     = scoreGrade(result.pct);
  const subBreak  = getSubjectBreakdown(result.questions);

  document.getElementById('page-container').innerHTML = `
    <div class="page-header flex justify-between items-center" style="flex-wrap:wrap;gap:var(--sp-4)">
      <div>
        <h1 class="page-title animate-fade-up">📊 Test Results</h1>
        <p class="page-subtitle animate-fade-up delay-1">${result.type === 'full' ? 'Full Mock Test' : 'Subject Test'} • ${new Date(result.date).toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'})}</p>
      </div>
      <div class="flex gap-2 animate-fade-up delay-1">
        <button class="btn btn-outline" onclick="window.navigate('mock-test')">Take Another Test</button>
        <button class="btn btn-primary" onclick="window.navigate('practice')">Practice Weak Areas</button>
      </div>
    </div>

    <!-- Hero Score Card -->
    <div class="card animate-fade-up delay-1" style="background:linear-gradient(135deg,#2C1810 0%,#5A2E1A 100%);color:white;margin-bottom:var(--sp-6);text-align:center">
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:var(--sp-6);align-items:center;padding:var(--sp-4)">
        <div>
          <div style="font-family:var(--font-serif);font-size:3.5rem;font-weight:700;color:${grade.color}">${result.score}</div>
          <div style="font-size:.85rem;opacity:.7">out of ${result.total}</div>
          <div style="font-size:1rem;font-weight:600;margin-top:var(--sp-2);color:${grade.color}">${grade.label}</div>
        </div>
        <div>
          <div style="font-size:2rem;font-weight:700">${result.pct}%</div>
          <div style="font-size:.8rem;opacity:.7">Accuracy</div>
        </div>
        <div>
          <div style="display:flex;justify-content:center;gap:var(--sp-5);flex-wrap:wrap">
            <div style="text-align:center">
              <div style="font-size:1.5rem;font-weight:700;color:#4ACA6B">+${result.correct * 4}</div>
              <div style="font-size:.75rem;opacity:.7">${result.correct} Correct</div>
            </div>
            <div style="text-align:center">
              <div style="font-size:1.5rem;font-weight:700;color:#E05555">${result.wrong}</div>
              <div style="font-size:.75rem;opacity:.7">${result.wrong} Wrong</div>
            </div>
            <div style="text-align:center">
              <div style="font-size:1.5rem;font-weight:700;opacity:.6">${result.skipped}</div>
              <div style="font-size:.75rem;opacity:.7">${result.skipped} Skipped</div>
            </div>
          </div>
        </div>
        <div>
          <div style="font-size:1.8rem;font-weight:700">⏱ ${formatDuration(result.timeTaken)}</div>
          <div style="font-size:.8rem;opacity:.7">Time taken</div>
          <div style="font-size:.78rem;opacity:.6;margin-top:4px">
            ${result.questions.length > 0 ? `~${Math.round(result.timeTaken / result.questions.length)}s per question` : ''}
          </div>
        </div>
      </div>
    </div>

    <!-- Subject Breakdown -->
    <div class="card animate-fade-up delay-2" style="margin-bottom:var(--sp-6)">
      <h3 style="margin-bottom:var(--sp-5)">📚 Subject-wise Breakdown</h3>
      <div style="display:flex;flex-direction:column;gap:var(--sp-3)">
        ${subBreak.map(sb => {
          const subj = SUBJECTS.find(s => s.id === sb.subject);
          const accuracy = pct(sb.correct, sb.total);
          const color = accuracy >= 70 ? 'var(--success)' : accuracy >= 50 ? 'var(--amber)' : 'var(--error)';
          return `
            <div style="padding:var(--sp-4) var(--sp-5);background:var(--bg);border-radius:var(--r-md);border:1px solid var(--border);margin-bottom:var(--sp-2)">
              <div class="flex justify-between items-center" style="margin-bottom:var(--sp-3);flex-wrap:wrap;gap:var(--sp-2)">
                <span style="font-weight:700;font-size:.92rem;color:var(--text)">${subj ? subj.icon + ' ' + subj.name : sb.subject}</span>
                <div class="flex gap-2 items-center" style="flex-wrap:wrap">
                  <span class="badge badge-success" style="font-size:.78rem;padding:3px 10px">✅ ${sb.correct} Correct</span>
                  <span class="badge badge-error" style="font-size:.78rem;padding:3px 10px">❌ ${sb.wrong} Wrong</span>
                  <span class="badge badge-neutral" style="font-size:.78rem;padding:3px 10px">⏸ ${sb.skipped} Skipped</span>
                  <span class="badge" style="font-weight:700;font-size:.8rem;padding:3px 10px;background:var(--surface);color:${color}">${accuracy}% Accuracy</span>
                </div>
              </div>
              <div class="progress-bar" style="height:8px">
                <div class="progress-fill" style="width:${accuracy}%;background:${color}"></div>
              </div>
            </div>`;
        }).join('')}
      </div>
    </div>

    <!-- Weak Topics Alert -->
    ${(() => {
      const weak = subBreak.filter(sb => pct(sb.correct, sb.total) < 60 && sb.total > 0);
      if (!weak.length) return '';
      return `<div class="card animate-fade-up delay-3" style="border-color:var(--amber);margin-bottom:var(--sp-6)">
        <h4 style="color:var(--amber);margin-bottom:var(--sp-4)">⚠️ Focus Areas — Below 60% Accuracy</h4>
        <div style="display:flex;flex-wrap:wrap;gap:var(--sp-2)">
          ${weak.map(sb => {
            const subj = SUBJECTS.find(s => s.id === sb.subject);
            return `<button class="btn btn-outline btn-sm" onclick="window.navigate('practice','subject=${sb.subject}')">
              ${subj ? subj.icon : ''} ${subj ? subj.name : sb.subject} — ${pct(sb.correct,sb.total)}%
            </button>`;
          }).join('')}
        </div>
        <p style="font-size:.82rem;color:var(--text-3);margin-top:var(--sp-3)">Click any subject to practice those questions.</p>
      </div>`;
    })()}

    <!-- Question Review -->
    <div class="card animate-fade-up delay-3">
      <div class="flex justify-between items-center" style="margin-bottom:var(--sp-5)">
        <h3>🔍 Question-by-Question Review</h3>
        <div class="flex gap-2">
          <button class="btn btn-ghost btn-sm review-filter active" data-filter="all">All (${result.questions.length})</button>
          <button class="btn btn-ghost btn-sm review-filter" data-filter="wrong">Wrong (${result.wrong})</button>
          <button class="btn btn-ghost btn-sm review-filter" data-filter="skipped">Skipped (${result.skipped})</button>
          <button class="btn btn-ghost btn-sm review-filter" data-filter="correct">Correct (${result.correct})</button>
        </div>
      </div>
      <div id="question-review-list">
        ${renderQuestionReview(result.questions, 'all')}
      </div>
    </div>
  `;

  // Filter buttons
  document.querySelectorAll('.review-filter').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.review-filter').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('question-review-list').innerHTML = renderQuestionReview(result.questions, btn.dataset.filter);
    });
  });
}

function renderQuestionReview(questions, filter) {
  const filtered = questions.filter(q => {
    if (filter === 'all')    return true;
    if (filter === 'wrong')  return q.selected !== null && q.selected !== q.correct;
    if (filter === 'skipped')return q.selected === null;
    if (filter === 'correct')return q.selected === q.correct;
    return true;
  });

  if (!filtered.length) return `<div class="empty-state" style="padding:var(--sp-8)"><span>Nothing here.</span></div>`;

  return filtered.map((q, i) => {
    const status = q.selected === null ? 'skipped' : q.selected === q.correct ? 'correct' : 'wrong';
    const statusIcon = { correct: '✅', wrong: '❌', skipped: '—' }[status];
    const statusColor = { correct: 'var(--success)', wrong: 'var(--error)', skipped: 'var(--text-3)' }[status];
    return `
      <details style="border:1px solid var(--border);border-radius:var(--r-md);margin-bottom:var(--sp-3);overflow:hidden">
        <summary style="padding:var(--sp-4) var(--sp-5);cursor:pointer;display:flex;align-items:center;gap:var(--sp-3);background:var(--bg);list-style:none">
          <span style="font-weight:700;font-size:.8rem;color:${statusColor};min-width:20px">${statusIcon}</span>
          <span style="font-weight:600;font-size:.82rem;color:var(--text-3);min-width:30px">Q${i+1}</span>
          <span style="font-size:.88rem;color:var(--text-2);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${q.q.substring(0,100)}${q.q.length>100?'…':''}</span>
        </summary>
        <div style="padding:var(--sp-5);border-top:1px solid var(--border)">
          <div style="font-family:var(--font-serif);font-size:.95rem;margin-bottom:var(--sp-4)">${renderRichContent(q.q, q.image_url || q.imageUrl || q.image)}</div>
          ${(q.options||[]).map((opt,j) => `
            <div style="padding:var(--sp-2) var(--sp-3);margin-bottom:var(--sp-2);border-radius:var(--r-sm);
                        ${j === q.correct ? 'background:var(--success-bg);border:1px solid var(--success);color:var(--success)' :
                          j === q.selected && j !== q.correct ? 'background:var(--error-bg);border:1px solid var(--error);color:var(--error)' :
                          'background:var(--bg);border:1px solid var(--border);color:var(--text-3)'}">
              <span style="font-weight:700;margin-right:var(--sp-2)">${String.fromCharCode(65+j)}.</span>${opt}
              ${j === q.correct ? ' ✅' : ''}
              ${j === q.selected && j !== q.correct ? ' ← Your answer' : ''}
            </div>`).join('')}
          ${q.exp ? `<div style="margin-top:var(--sp-4);padding:var(--sp-4);background:var(--secondary-bg);border-left:3px solid var(--secondary);border-radius:0 var(--r-sm) var(--r-sm) 0">
            <strong style="font-size:.8rem;color:var(--secondary);display:block;margin-bottom:var(--sp-2)">📖 EXPLANATION</strong>
            <div style="font-size:.88rem;color:var(--text-2)">${renderRichContent(q.exp)}</div>
          </div>` : ''}
        </div>
      </details>`;
  }).join('');
}

function getSubjectBreakdown(questions) {
  const map = {};
  questions.forEach(q => {
    if (!map[q.subject]) map[q.subject] = { subject: q.subject, correct: 0, wrong: 0, skipped: 0, total: 0 };
    map[q.subject].total++;
    if (q.selected === null)          map[q.subject].skipped++;
    else if (q.selected === q.correct) map[q.subject].correct++;
    else                               map[q.subject].wrong++;
  });
  return Object.values(map).sort((a,b) => b.total - a.total);
}
