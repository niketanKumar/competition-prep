// admin/students.js — Student Reports & Activity Monitor Panel
import { lsGet, pct, scoreGrade, formatDate, formatDateTime, formatDuration } from '../../lib/utils.js';
import { SUBJECTS } from '../../data/subjects.js';

export function renderAdminStudents() {
  const stats      = lsGet('hp_stats', { totalAnswered: 0, totalCorrect: 0, mockTests: 0, lastScore: null });
  const streak     = lsGet('hp_streak', { current: 0, longest: 0, lastDate: null });
  const history    = lsGet('hp_test_history', []);
  const studentName= lsGet('hp_user_name', 'Student');
  const examDate   = lsGet('hp_exam_date', null);

  // Calculate subject mastery
  const subMap = {};
  history.forEach(session => {
    (session.questions || []).forEach(q => {
      if (!subMap[q.subject]) subMap[q.subject] = { correct: 0, total: 0 };
      subMap[q.subject].total++;
      if (q.selected === q.correct) subMap[q.subject].correct++;
    });
  });

  const accuracy = pct(stats.totalCorrect, stats.totalAnswered);

  document.getElementById('page-container').innerHTML = `
    <div class="page-header flex justify-between items-center" style="flex-wrap:wrap;gap:var(--sp-4)">
      <div>
        <h1 class="page-title animate-fade-up">📊 Student Performance & Reports</h1>
        <p class="page-subtitle animate-fade-up delay-1">Track student progress, mock test history, and identify weak topics</p>
      </div>
      <button class="btn btn-outline" onclick="window.print()">🖨️ Print Report</button>
    </div>

    <!-- Overview Hero -->
    <div class="card animate-fade-up delay-1" style="background:linear-gradient(135deg,#2C1810 0%,#5A2E1A 100%);color:white;margin-bottom:var(--sp-6)">
      <div style="display:grid;grid-template-columns:1.5fr 1fr 1fr 1fr;gap:var(--sp-6);align-items:center;padding:var(--sp-4)">
        <div>
          <div style="font-size:.8rem;opacity:.7;text-transform:uppercase;letter-spacing:1px">STUDENT PROFILE</div>
          <div style="font-family:var(--font-serif);font-size:2rem;font-weight:700;margin-top:4px">${studentName}</div>
          <div style="font-size:.82rem;opacity:.8;margin-top:var(--sp-2)">
            Exam Date: <strong>${examDate ? formatDate(examDate) : 'Not set'}</strong>
          </div>
        </div>
        <div style="text-align:center">
          <div style="font-size:2rem;font-weight:700;color:${scoreGrade(accuracy).color}">${accuracy}%</div>
          <div style="font-size:.8rem;opacity:.7">Overall Accuracy</div>
        </div>
        <div style="text-align:center">
          <div style="font-size:2rem;font-weight:700;color:#FFD700">🔥 ${streak.current}</div>
          <div style="font-size:.8rem;opacity:.7">Day Streak (Best: ${streak.longest})</div>
        </div>
        <div style="text-align:center">
          <div style="font-size:2rem;font-weight:700">${stats.mockTests}</div>
          <div style="font-size:.8rem;opacity:.7">Mock Tests Taken</div>
        </div>
      </div>
    </div>

    <!-- Grid 2: Subject Mastery + Weak Areas -->
    <div class="grid-2 animate-fade-up delay-2" style="margin-bottom:var(--sp-6)">
      <!-- Subject Breakdown -->
      <div class="card">
        <h4 style="margin-bottom:var(--sp-4)">📚 Subject Accuracy & Progress</h4>
        <div style="display:flex;flex-direction:column;gap:var(--sp-3)">
          ${SUBJECTS.map(s => {
            const data = subMap[s.id];
            if (!data || data.total === 0) {
              return `<div style="display:flex;justify-content:space-between;font-size:.82rem;color:var(--text-3);padding:var(--sp-1) 0">
                <span>${s.icon} ${s.name}</span>
                <span style="font-style:italic">Not attempted</span>
              </div>`;
            }
            const acc = pct(data.correct, data.total);
            const color = acc >= 70 ? 'var(--success)' : acc >= 50 ? 'var(--amber)' : 'var(--error)';
            return `<div>
              <div style="display:flex;justify-content:space-between;margin-bottom:4px;font-size:.85rem">
                <span style="font-weight:600">${s.icon} ${s.name}</span>
                <span style="font-weight:700;color:${color}">${acc}% (${data.correct}/${data.total})</span>
              </div>
              <div class="progress-bar" style="height:6px">
                <div class="progress-fill" style="width:${acc}%;background:${color}"></div>
              </div>
            </div>`;
          }).join('')}
        </div>
      </div>

      <!-- Actionable Advice for Admin -->
      <div class="card">
        <h4 style="margin-bottom:var(--sp-4)">💡 Recommended Admin Guidance</h4>
        ${(() => {
          const weakSubs = SUBJECTS.filter(s => subMap[s.id] && pct(subMap[s.id].correct, subMap[s.id].total) < 60);
          if (weakSubs.length === 0 && Object.keys(subMap).length > 0) {
            return `<div style="padding:var(--sp-4);background:var(--success-bg);border:1px solid var(--success);border-radius:var(--r-md);color:var(--success);font-size:.88rem">
              🎉 Student is performing well across all attempted subjects (above 60% accuracy)!
            </div>`;
          }
          if (Object.keys(subMap).length === 0) {
            return `<p style="font-size:.88rem;color:var(--text-3)">No test data recorded yet. Ask student to attempt a practice session or mock test.</p>`;
          }
          return `
            <p style="font-size:.88rem;color:var(--text-2);margin-bottom:var(--sp-4)">
              The student needs extra attention in these specific areas:
            </p>
            <div style="display:flex;flex-direction:column;gap:var(--sp-3)">
              ${weakSubs.map(s => `
                <div style="padding:var(--sp-3);background:var(--error-bg);border-left:3px solid var(--error);border-radius:0 var(--r-md) var(--r-md) 0">
                  <div style="font-weight:700;font-size:.85rem;color:var(--error)">${s.icon} ${s.name}</div>
                  <div style="font-size:.78rem;color:var(--text-3);margin-top:2px">
                    Current accuracy: <strong>${pct(subMap[s.id].correct, subMap[s.id].total)}%</strong>. Recommend adding more PYQs and flashcards for this subject.
                  </div>
                </div>`).join('')}
            </div>`;
        })()}
      </div>
    </div>

    <!-- Recent Mock Tests Table -->
    <div class="card animate-fade-up delay-3">
      <h4 style="margin-bottom:var(--sp-4)">📋 Complete Test History</h4>
      ${!history.length ? '<p style="color:var(--text-3);font-size:.88rem">No mock tests completed yet.</p>' : `
        <div class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Date & Time</th>
                <th>Test Type</th>
                <th>Score</th>
                <th>Accuracy</th>
                <th>Correct / Wrong / Skipped</th>
                <th>Time Taken</th>
              </tr>
            </thead>
            <tbody>
              ${history.map(h => `
                <tr>
                  <td>${formatDateTime(h.date)}</td>
                  <td><span class="badge badge-neutral">${h.type === 'full' ? '📋 Full Mock' : '🎯 Subject Test'}</span></td>
                  <td style="font-weight:700">${h.score} / ${h.total}</td>
                  <td><span style="font-weight:700;color:${scoreGrade(h.pct).color}">${h.pct}%</span></td>
                  <td style="font-size:.82rem">
                    <span style="color:var(--success)">${h.correct}C</span> •
                    <span style="color:var(--error)">${h.wrong}W</span> •
                    <span style="color:var(--text-3)">${h.skipped}S</span>
                  </td>
                  <td>${formatDuration(h.timeTaken)}</td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>`}
    </div>
  `;
}
