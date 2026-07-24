// admin/students.js — Student Reports & Activity Monitor Panel
import { lsGet, pct, scoreGrade, formatDate, formatDateTime, formatDuration } from '../../lib/utils.js';
import { SUBJECTS } from '../../data/subjects.js';
import { fetchAllProfiles, fetchAllTestSessions } from '../../lib/supabase.js';

export async function renderAdminStudents() {
  const container = document.getElementById('page-container');
  container.innerHTML = `
    <div style="padding:var(--sp-6);text-align:center;color:var(--text-3)">
      <p>⏳ Loading student profiles from Supabase...</p>
    </div>`;

  let profiles = [];
  let testSessions = [];

  try {
    const [pRes, sRes] = await Promise.all([
      fetchAllProfiles(),
      fetchAllTestSessions()
    ]);
    profiles = pRes.data || [];
    testSessions = sRes.data || [];
  } catch (e) {
    console.warn('[AdminStudents] Supabase fetch error, using local fallback:', e);
  }

  // Filter out non-student profiles if desired, or show all users
  const students = profiles.length ? profiles : [
    { id: 'local-user', name: lsGet('hp_user_name', 'Student'), email: 'student@homeoprep.app', created_at: new Date().toISOString() }
  ];

  let selectedStudentId = students[0]?.id;

  function renderView(studentId) {
    const student = students.find(s => s.id === studentId) || students[0];
    const studentSessions = testSessions.filter(s => s.user_id === student.id);

    // Calculate accuracy & stats for this selected student
    let totalQuestions = 0;
    let totalCorrect = 0;
    const subMap = {};

    studentSessions.forEach(session => {
      totalQuestions += (session.total_questions || 0);
      totalCorrect += Math.max(0, Math.floor(((session.accuracy || 0) / 100) * (session.total_questions || 0)));

      if (session.details && Array.isArray(session.details.questions)) {
        session.details.questions.forEach(q => {
          if (!subMap[q.subject]) subMap[q.subject] = { correct: 0, total: 0 };
          subMap[q.subject].total++;
          if (q.selected === q.correct) subMap[q.subject].correct++;
        });
      }
    });

    const overallAccuracy = totalQuestions > 0 ? pct(totalCorrect, totalQuestions) : 0;
    const mockCount = studentSessions.filter(s => s.test_type === 'mock' || s.test_type === 'full').length;

    container.innerHTML = `
      <div class="page-header flex justify-between items-center" style="flex-wrap:wrap;gap:var(--sp-4)">
        <div>
          <h1 class="page-title animate-fade-up">📊 Student Performance & Reports</h1>
          <p class="page-subtitle animate-fade-up delay-1">Track registered students, test history, and identify weak topics</p>
        </div>
        <div style="display:flex;align-items:center;gap:var(--sp-3)">
          <select id="student-selector" class="form-input" style="min-width:240px;font-weight:600">
            ${students.map(s => `
              <option value="${s.id}" ${s.id === student.id ? 'selected' : ''}>
                👨‍🎓 ${s.name || 'Student'} (${s.email})
              </option>
            `).join('')}
          </select>
          <button class="btn btn-outline" onclick="window.print()">🖨️ Print Report</button>
        </div>
      </div>

      <!-- Overview Hero -->
      <div class="card animate-fade-up delay-1" style="background:linear-gradient(135deg,#2C1810 0%,#5A2E1A 100%);color:white;margin-bottom:var(--sp-6)">
        <div style="display:grid;grid-template-columns:1.5fr 1fr 1fr 1fr;gap:var(--sp-6);align-items:center;padding:var(--sp-4)">
          <div>
            <div style="font-size:.8rem;opacity:.7;text-transform:uppercase;letter-spacing:1px">STUDENT PROFILE</div>
            <div style="font-family:var(--font-serif);font-size:2rem;font-weight:700;margin-top:4px">${student.name || 'Student'}</div>
            <div style="font-size:.82rem;opacity:.8;margin-top:var(--sp-2)">
              Email: <strong>${student.email}</strong> • Joined: <strong>${formatDate(student.created_at)}</strong>
            </div>
          </div>
          <div style="text-align:center">
            <div style="font-size:2rem;font-weight:700;color:${scoreGrade(overallAccuracy).color}">${overallAccuracy}%</div>
            <div style="font-size:.8rem;opacity:.7">Overall Accuracy</div>
          </div>
          <div style="text-align:center">
            <div style="font-size:2rem;font-weight:700;color:#FFD700">${totalQuestions}</div>
            <div style="font-size:.8rem;opacity:.7">Questions Attempted</div>
          </div>
          <div style="text-align:center">
            <div style="font-size:2rem;font-weight:700">${mockCount}</div>
            <div style="font-size:.8rem;opacity:.7">Mock Tests Completed</div>
          </div>
        </div>
      </div>

      <!-- Registered Students Quick Summary Table -->
      <div class="card animate-fade-up delay-2" style="margin-bottom:var(--sp-6)">
        <h4 style="margin-bottom:var(--sp-3)">👥 Registered Students Roster (${students.length})</h4>
        <div class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Registered Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              ${students.map(st => `
                <tr style="${st.id === student.id ? 'background:var(--accent-bg);font-weight:600' : ''}">
                  <td>${st.name || 'Student'}</td>
                  <td>${st.email}</td>
                  <td><span class="badge ${st.role === 'admin' ? 'badge-amber' : 'badge-neutral'}">${st.role || 'student'}</span></td>
                  <td>${formatDate(st.created_at)}</td>
                  <td>
                    <button class="btn btn-ghost btn-sm select-student-btn" data-id="${st.id}">
                      👁️ View Report
                    </button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
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
                  <span style="font-style:italic">Not attempted yet</span>
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
                🎉 ${student.name} is performing well across all attempted subjects (above 60% accuracy)!
              </div>`;
            }
            if (Object.keys(subMap).length === 0) {
              return `<p style="font-size:.88rem;color:var(--text-3)">No detailed subject data recorded for ${student.name} yet.</p>`;
            }
            return `
              <p style="font-size:.88rem;color:var(--text-2);margin-bottom:var(--sp-4)">
                ${student.name} needs extra attention in these specific areas:
              </p>
              <div style="display:flex;flex-direction:column;gap:var(--sp-3)">
                ${weakSubs.map(s => `
                  <div style="padding:var(--sp-3);background:var(--error-bg);border-left:3px solid var(--error);border-radius:0 var(--r-md) var(--r-md) 0">
                    <div style="font-weight:700;font-size:.85rem;color:var(--error)">${s.icon} ${s.name}</div>
                    <div style="font-size:.78rem;color:var(--text-3);margin-top:2px">
                      Current accuracy: <strong>${pct(subMap[s.id].correct, subMap[s.id].total)}%</strong>.
                    </div>
                  </div>`).join('')}
              </div>`;
          })()}
        </div>
      </div>

      <!-- Recent Mock Tests Table -->
      <div class="card animate-fade-up delay-3">
        <h4 style="margin-bottom:var(--sp-4)">📋 Test History for ${student.name}</h4>
        ${!studentSessions.length ? `<p style="color:var(--text-3);font-size:.88rem">No test sessions recorded for ${student.name} yet.</p>` : `
          <div class="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Date & Time</th>
                  <th>Test Type</th>
                  <th>Score</th>
                  <th>Accuracy</th>
                  <th>Time Taken</th>
                </tr>
              </thead>
              <tbody>
                ${studentSessions.map(h => `
                  <tr>
                    <td>${formatDateTime(h.completed_at || h.created_at)}</td>
                    <td><span class="badge badge-neutral">${(h.test_type || 'test').toUpperCase()}</span></td>
                    <td style="font-weight:700">${h.score || 0} / ${h.total_questions || 0}</td>
                    <td><span style="font-weight:700;color:${scoreGrade(h.accuracy || 0).color}">${h.accuracy || 0}%</span></td>
                    <td>${formatDuration(h.time_taken || 0)}</td>
                  </tr>`).join('')}
              </tbody>
            </table>
          </div>`}
      </div>
    `;

    // Attach dropdown event
    document.getElementById('student-selector')?.addEventListener('change', (e) => {
      renderView(e.target.value);
    });

    // Attach roster button events
    document.querySelectorAll('.select-student-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        renderView(btn.dataset.id);
      });
    });
  }

  renderView(selectedStudentId);
}
