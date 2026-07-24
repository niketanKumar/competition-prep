// dashboard.js — Main dashboard page with Official AIAPGET 2026 Weightage & Syllabus Guide
import { lsGet, lsSet, daysUntil, formatDate, getStreak, updateStreak, pct, esc } from '../lib/utils.js';
import { SUBJECTS, TOTAL_MARKS, TOTAL_QUESTIONS } from '../data/subjects.js';
import { isDue } from '../lib/sm2.js';
import { SEED_FLASHCARDS } from '../data/flashcards.js';

export function renderDashboard() {
  const examDate   = lsGet('hp_exam_date', null);
  const userName   = lsGet('hp_user_name', 'Student');
  const days       = daysUntil(examDate);
  const streak     = getStreak();
  const stats      = lsGet('hp_stats', { totalAnswered: 0, totalCorrect: 0, mockTests: 0, lastScore: null });
  
  const fcStates   = lsGet('hp_flashcard_states', {});
  const customFc   = lsGet('hp_flashcards', []);
  const allFc      = [...SEED_FLASHCARDS, ...(Array.isArray(customFc) ? customFc : [])].map(c => ({
    ...c,
    sm2: (fcStates && typeof fcStates === 'object' && !Array.isArray(fcStates)) ? fcStates[c.id] || null : null,
  }));
  const dueFc      = allFc.filter(isDue).length;
  
  const todayDone  = lsGet('hp_today_done', { questions: 0, flashcards: 0 });
  const plan       = lsGet('hp_study_plan', []);
  const todayPlan  = Array.isArray(plan) ? plan.find(p => p.date === new Date().toISOString().split('T')[0]) : null;
  const qTarget    = todayPlan?.questionsTarget || 30;
  const fcTarget   = todayPlan?.flashcardsTarget || 20;

  // Update streak on dashboard visit
  updateStreak();

  const daysLabel    = days === null ? 'Set exam date in Settings' : days <= 0 ? 'Exam today / passed!' : `${days} days left`;
  const examLabel    = examDate ? `AIAPGET — ${formatDate(examDate)}` : 'Set your exam date';
  const subjectProgress = lsGet('hp_subject_progress', {});
  // Calculate Question Performance Breakdown across tests
  const testHistory = lsGet('hp_test_history', []);
  let totalCorrect = 0;
  let totalWrong   = 0;
  let totalSkipped = 0;

  if (Array.isArray(testHistory) && testHistory.length > 0) {
    testHistory.forEach(t => {
      totalCorrect += (t.correct || 0);
      totalWrong   += (t.wrong || 0);
      totalSkipped += (t.skipped || 0);
    });
  } else {
    totalCorrect = stats.totalCorrect || 0;
    totalWrong   = Math.max(0, (stats.totalAnswered || 0) - totalCorrect);
  }

  const totalAttempted = totalCorrect + totalWrong;
  const accuracyPct    = totalAttempted > 0 ? Math.round((totalCorrect / totalAttempted) * 100) : 0;
  const totalAll       = totalAttempted + totalSkipped;

  const correctPct = totalAll > 0 ? (totalCorrect / totalAll) * 100 : 0;
  const wrongPct   = totalAll > 0 ? (totalWrong / totalAll) * 100 : 0;
  const skippedPct = totalAll > 0 ? (totalSkipped / totalAll) * 100 : 0;

  document.getElementById('page-container').innerHTML = `
    <div class="page-header flex justify-between items-center" style="flex-wrap:wrap;gap:var(--sp-4)">
      <div>
        <h1 class="page-title animate-fade-up">Good ${greeting()}, ${userName}! 👋</h1>
        <p class="page-subtitle animate-fade-up delay-1">Official AIAPGET 2026 Homoeopathy Study Companion</p>
      </div>
      <div class="flex gap-2 animate-fade-up delay-2" style="flex-wrap:wrap">
        <button class="btn btn-secondary" id="open-syllabus-guide-btn">📋 2026 Syllabus & Weightage</button>
        <button class="btn btn-primary" onclick="window.navigate('mock-test')">⏱ Start Mock Test</button>
        <button class="btn btn-outline" onclick="window.navigate('practice')">📝 Practice Now</button>
      </div>
    </div>

    <!-- Row 1: Countdown + Streak + Mock Tests + Question Performance Donut Chart -->
    <div style="display:grid;grid-template-columns:1.3fr 0.7fr 0.7fr 1.7fr;gap:var(--sp-5);margin-bottom:var(--sp-6)">
      <!-- Countdown -->
      <div class="countdown-card animate-fade-up delay-1">
        <div class="countdown-label">📅 ${examLabel}</div>
        <div class="countdown-days">${days === null ? '—' : days <= 0 ? '🎯' : days}</div>
        <div class="countdown-sub">${daysLabel}</div>
        ${days !== null && days > 0 ? `
        <div class="countdown-progress">
          <div class="countdown-progress-fill" style="width:${Math.min(100, pct(365-days, 365))}%"></div>
        </div>` : ''}
      </div>

      <!-- Streak -->
      <div class="card animate-fade-up delay-1" style="text-align:center">
        <div style="font-size:2.2rem;margin-bottom:var(--sp-1)">🔥</div>
        <div class="stat-number">${streak.current}</div>
        <div class="stat-label">Day Streak</div>
        ${streak.longest > 0 ? `<div style="font-size:.72rem;color:var(--text-3);margin-top:var(--sp-1)">Best: ${streak.longest} days</div>` : ''}
      </div>

      <!-- Mock tests -->
      <div class="card animate-fade-up delay-2" style="text-align:center">
        <div style="font-size:2.2rem;margin-bottom:var(--sp-1)">⏱</div>
        <div class="stat-number">${stats.mockTests}</div>
        <div class="stat-label">Mock Tests</div>
        ${stats.lastScore !== null ? `<div style="font-size:.72rem;color:var(--text-3);margin-top:var(--sp-1)">Last: <strong>${stats.lastScore}</strong>/${TOTAL_MARKS}</div>` : ''}
      </div>

      <!-- Questions Performance Donut Chart Card -->
      <div class="card animate-fade-up delay-3">
        <div class="flex justify-between items-center" style="margin-bottom:var(--sp-3)">
          <h3 style="font-size:1.02rem">📊 Question Breakdown</h3>
          <span class="badge ${accuracyPct >= 70 ? 'badge-success' : accuracyPct >= 50 ? 'badge-warning' : 'badge-error'}">${accuracyPct}% Accuracy</span>
        </div>
        <div style="display:flex;align-items:center;gap:var(--sp-4)">
          <!-- Conic Donut Chart -->
          <div style="position:relative;width:92px;height:92px;border-radius:50%;background:conic-gradient(var(--success) 0% ${correctPct}%, var(--error) ${correctPct}% ${correctPct + wrongPct}%, var(--border) ${correctPct + wrongPct}% 100%);display:flex;align-items:center;justify-content:center;flex-shrink:0;box-shadow:var(--shadow-sm)">
            <div style="width:60px;height:60px;border-radius:50%;background:white;display:flex;flex-direction:column;align-items:center;justify-content:center">
              <span style="font-weight:700;font-size:1.05rem;color:var(--text);line-height:1">${totalAttempted}</span>
              <span style="font-size:.62rem;color:var(--text-3)">Attempted</span>
            </div>
          </div>

          <!-- Breakdown Legend -->
          <div style="flex:1;display:flex;flex-direction:column;gap:5px;font-size:.8rem">
            <div class="flex justify-between items-center" style="padding:3px 8px;background:var(--success-bg);border-radius:var(--r-sm)">
              <span style="color:var(--success);font-weight:600">✅ Correct</span>
              <span style="font-weight:700;color:var(--success)">${totalCorrect}</span>
            </div>
            <div class="flex justify-between items-center" style="padding:3px 8px;background:var(--error-bg);border-radius:var(--r-sm)">
              <span style="color:var(--error);font-weight:600">❌ Wrong</span>
              <span style="font-weight:700;color:var(--error)">${totalWrong}</span>
            </div>
            <div class="flex justify-between items-center" style="padding:3px 8px;background:var(--bg-2);border-radius:var(--r-sm)">
              <span style="color:var(--text-3);font-weight:500">⏸ Skipped</span>
              <span style="font-weight:700;color:var(--text-3)">${totalSkipped}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Row 2: Today's Target + Flashcards due -->
    <div class="grid-2" style="margin-bottom:var(--sp-6)">
      <!-- Today's Plan -->
      <div class="card animate-fade-up delay-2">
        <div class="flex justify-between items-center" style="margin-bottom:var(--sp-5)">
          <h3 style="font-size:1.1rem">📅 Today's Target</h3>
          ${todayPlan ? `<span class="badge badge-primary">${todayPlan.subjectName}</span>` : '<span class="badge badge-neutral">No plan set</span>'}
        </div>
        <div style="display:flex;flex-direction:column;gap:var(--sp-4)">
          <div>
            <div class="flex justify-between" style="margin-bottom:var(--sp-2);font-size:.85rem">
              <span style="color:var(--text-2);font-weight:500">📝 Questions</span>
              <span style="font-weight:700;color:var(--text)">${todayDone.questions} / ${qTarget}</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill" style="width:${Math.min(100,pct(todayDone.questions, qTarget))}%"></div>
            </div>
          </div>
          <div>
            <div class="flex justify-between" style="margin-bottom:var(--sp-2);font-size:.85rem">
              <span style="color:var(--text-2);font-weight:500">🃏 Flashcards</span>
              <span style="font-weight:700;color:var(--text)">${todayDone.flashcards} / ${fcTarget}</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill green" style="width:${Math.min(100,pct(todayDone.flashcards, fcTarget))}%"></div>
            </div>
          </div>
        </div>
        <button class="btn btn-primary w-full" style="margin-top:var(--sp-5)" onclick="window.navigate('practice')">
          Continue Studying
        </button>
      </div>

      <!-- Flashcards Due -->
      <div class="card animate-fade-up delay-3">
        <div class="flex justify-between items-center" style="margin-bottom:var(--sp-4)">
          <h3 style="font-size:1.1rem">🃏 Flashcards Due</h3>
          <span class="badge ${dueFc > 0 ? 'badge-warning' : 'badge-success'}">${dueFc} due today</span>
        </div>
        ${dueFc > 0 ? `
          <p style="font-size:.9rem;color:var(--text-3);margin-bottom:var(--sp-5)">
            You have <strong>${dueFc}</strong> flashcard${dueFc !== 1 ? 's' : ''} scheduled for review today based on your spaced repetition schedule.
          </p>
          <button class="btn btn-secondary w-full" onclick="window.navigate('flashcards')">
            🃏 Review Now
          </button>
        ` : `
          <div class="empty-state" style="padding:var(--sp-8) 0">
            <span class="empty-state-icon">✅</span>
            <p style="font-size:.9rem">All caught up! No cards due today.</p>
          </div>
        `}
      </div>
    </div>

    <!-- Row 3: Subject Coverage with Official AIAPGET 2026 Priority Tiers -->
    <div class="card animate-fade-up delay-3">
      <div class="flex justify-between items-center" style="margin-bottom:var(--sp-5);flex-wrap:wrap;gap:var(--sp-2)">
        <div>
          <h3 style="margin-bottom:2px">📚 Official Subject Breakdown & Progress</h3>
          <span style="font-size:.78rem;color:var(--text-3)">120 MCQs Total • 480 Marks • Categorized by Official NCH Priority</span>
        </div>
        <button class="btn btn-ghost btn-sm" onclick="window.navigate('analytics')">View Analytics →</button>
      </div>

      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:var(--sp-4)">
        ${SUBJECTS.map(s => {
          const done = subjectProgress[s.id] || 0;
          const p = Math.min(100, pct(done, s.questions * 5));
          return `
            <div class="card" style="cursor:pointer;padding:var(--sp-4);border-color:var(--border);background:white;transition:transform var(--t-fast)"
                 onclick="window.navigate('practice','subject=${s.id}')"
                 onmouseenter="this.style.transform='translateY(-2px)'"
                 onmouseleave="this.style.transform='none'">
              <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:var(--sp-2)">
                <span style="font-size:.9rem;font-weight:700;color:var(--text)">${s.icon} ${s.name}</span>
                <span style="font-size:.72rem;font-weight:700;color:${s.color};background:${s.bg};padding:2px 6px;border-radius:4px">
                  ${s.questions} Qs (${s.marks}M)
                </span>
              </div>

              <div style="font-size:.72rem;font-weight:600;color:${s.color};margin-bottom:var(--sp-3)">
                ${s.priorityBadge}
              </div>

              <div class="flex justify-between items-center" style="margin-bottom:4px;font-size:.75rem">
                <span style="color:var(--text-3)">Coverage</span>
                <span style="font-weight:700;color:${s.color}">${p}%</span>
              </div>
              <div class="progress-bar" style="height:6px">
                <div class="progress-fill" style="width:${p}%;background:${s.color}"></div>
              </div>
            </div>`;
        }).join('')}
      </div>
    </div>

    <!-- Official Syllabus & Weightage Modal -->
    <div id="syllabus-modal" class="modal-overlay hidden">
      <div class="modal" style="max-width:850px;max-height:85vh;overflow-y:auto">
        <div class="modal-header" style="position:sticky;top:0;background:white;z-index:10">
          <div>
            <h3 style="font-family:var(--font-serif);font-size:1.25rem;color:var(--primary)">📋 Official AIAPGET 2026 Syllabus & Weightage Guide</h3>
            <span style="font-size:.78rem;color:var(--text-3)">Based on official NCH distribution (120 MCQs | 480 Marks | +4/-1 Marking)</span>
          </div>
          <button class="btn btn-ghost btn-icon" id="close-syllabus-modal">✕</button>
        </div>
        <div class="modal-body" style="display:flex;flex-direction:column;gap:var(--sp-6)">

          <!-- Weightage Table -->
          <div>
            <h4 style="margin-bottom:var(--sp-3);font-family:var(--font-serif)">Official Subject-Wise Distribution Table</h4>
            <div style="overflow-x:auto">
              <table style="width:100%;border-collapse:collapse;font-size:.85rem;text-align:left">
                <thead>
                  <tr style="background:var(--bg-2);border-bottom:2px solid var(--border)">
                    <th style="padding:var(--sp-3)">Priority</th>
                    <th style="padding:var(--sp-3)">Subject</th>
                    <th style="padding:var(--sp-3);text-align:center">Questions</th>
                    <th style="padding:var(--sp-3);text-align:center">Marks</th>
                    <th style="padding:var(--sp-3)">High-Yield Focus Areas</th>
                  </tr>
                </thead>
                <tbody>
                  ${SUBJECTS.map(s => `
                    <tr style="border-bottom:1px solid var(--border)">
                      <td style="padding:var(--sp-3);font-weight:700;color:${s.color}">${s.priority}</td>
                      <td style="padding:var(--sp-3);font-weight:600">${s.icon} ${s.name}</td>
                      <td style="padding:var(--sp-3);text-align:center;font-weight:700">${s.questions}</td>
                      <td style="padding:var(--sp-3);text-align:center;font-weight:700;color:var(--primary)">${s.marks}</td>
                      <td style="padding:var(--sp-3);font-size:.78rem;color:var(--text-2);max-width:320px">${s.keyTopics.slice(0,3).join('; ')}...</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>

          <!-- Strategy Tips Banner -->
          <div style="padding:var(--sp-4);background:var(--primary-bg);border:1px solid var(--primary-border);border-radius:var(--r-md)">
            <h4 style="color:var(--primary);margin-bottom:var(--sp-2)">💡 Key Preparation Strategy:</h4>
            <ul style="font-size:.85rem;line-height:1.6;margin-left:var(--sp-5);color:var(--text)">
              <li><strong>Top 4 Core Focus:</strong> Materia Medica, Organon, Repertory & Practice of Medicine account for <strong>64 out of 120 questions (53.3%)</strong>! Mastering these 4 subjects guarantees qualifying cutoffs.</li>
              <li><strong>High-Yield Scoring Opportunities:</strong> Homoeopathic Pharmacy (12 Qs) and Community Medicine (9 Qs) carry 21 questions together. Do not ignore Community Medicine!</li>
              <li><strong>Cross-Linking Obs-Gynae:</strong> Study Obstetrics & Gynaecology alongside Materia Medica (e.g. Eclampsia ➔ Belladonna, Gelsemium, Stramonium).</li>
            </ul>
          </div>

        </div>
        <div class="modal-footer" style="position:sticky;bottom:0;background:white">
          <button class="btn btn-primary" id="close-syllabus-modal-btn">Got It! Start Practicing</button>
        </div>
      </div>
    </div>
  `;

  wireDashboard();
}

function wireDashboard() {
  document.getElementById('open-syllabus-guide-btn')?.addEventListener('click', () => {
    document.getElementById('syllabus-modal').classList.remove('hidden');
  });
  document.getElementById('close-syllabus-modal')?.addEventListener('click', () => document.getElementById('syllabus-modal').classList.add('hidden'));
  document.getElementById('close-syllabus-modal-btn')?.addEventListener('click', () => document.getElementById('syllabus-modal').classList.add('hidden'));
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}
