// achievements.js — Achievements and badges page
import { getEarnedAchievements, lsGet } from '../lib/utils.js';

export function renderAchievements() {
  const all    = getEarnedAchievements();
  const earned = all.filter(a => a.earned);
  const stats  = lsGet('hp_stats', { totalAnswered: 0, mockTests: 0 });
  const streak = lsGet('hp_streak', { current: 0, longest: 0 });

  document.getElementById('page-container').innerHTML = `
    <div class="page-header">
      <h1 class="page-title animate-fade-up">🏆 Achievements</h1>
      <p class="page-subtitle animate-fade-up delay-1">${earned.length} of ${all.length} badges earned</p>
    </div>

    <!-- Progress Overview -->
    <div class="card animate-fade-up delay-1" style="margin-bottom:var(--sp-6);background:linear-gradient(135deg,#2C1810,#5A2E1A);color:white">
      <div style="display:flex;align-items:center;gap:var(--sp-8);flex-wrap:wrap">
        <div style="text-align:center">
          <div style="font-family:var(--font-serif);font-size:3rem;font-weight:700;color:#FFD700">${earned.length}</div>
          <div style="font-size:.85rem;opacity:.7">Badges Earned</div>
        </div>
        <div style="flex:1;max-width:400px">
          <div style="display:flex;justify-content:space-between;margin-bottom:var(--sp-2);font-size:.85rem;opacity:.8">
            <span>Progress</span><span>${earned.length} / ${all.length}</span>
          </div>
          <div style="height:12px;background:rgba(255,255,255,.15);border-radius:99px;overflow:hidden">
            <div style="height:100%;width:${Math.round((earned.length/all.length)*100)}%;background:linear-gradient(90deg,#FFD700,#FFA500);border-radius:99px;transition:width 1s"></div>
          </div>
        </div>
        <div style="display:flex;gap:var(--sp-6)">
          <div style="text-align:center">
            <div style="font-size:1.5rem;font-weight:700">${stats.totalAnswered}</div>
            <div style="font-size:.75rem;opacity:.6">Questions</div>
          </div>
          <div style="text-align:center">
            <div style="font-size:1.5rem;font-weight:700">🔥${streak.current}</div>
            <div style="font-size:.75rem;opacity:.6">Streak</div>
          </div>
          <div style="text-align:center">
            <div style="font-size:1.5rem;font-weight:700">${stats.mockTests}</div>
            <div style="font-size:.75rem;opacity:.6">Mock Tests</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Badge Grid -->
    <div class="achievement-grid animate-fade-up delay-2">
      ${all.map(a => `
        <div class="achievement-card ${a.earned ? 'earned' : ''}">
          <span class="achievement-icon">${a.icon}</span>
          <div class="achievement-name">${a.name}</div>
          <div class="achievement-desc">${a.desc}</div>
          ${a.earned ? '<div style="margin-top:var(--sp-3);font-size:.7rem;color:var(--amber);font-weight:700">✅ EARNED</div>' :
                       '<div style="margin-top:var(--sp-3);font-size:.7rem;color:var(--text-3)">🔒 LOCKED</div>'}
        </div>`).join('')}
    </div>

    <!-- Milestones -->
    <div class="card animate-fade-up delay-3" style="margin-top:var(--sp-8)">
      <h3 style="margin-bottom:var(--sp-5)">📈 Question Milestones</h3>
      <div style="display:flex;flex-direction:column;gap:var(--sp-4)">
        ${[100, 500, 1000, 2500, 5000].map(target => {
          const done = Math.min(stats.totalAnswered, target);
          const p    = Math.round((done/target)*100);
          const achieved = stats.totalAnswered >= target;
          return `<div>
            <div style="display:flex;justify-content:space-between;margin-bottom:var(--sp-2)">
              <span style="font-weight:600;font-size:.9rem">${achieved ? '✅' : '🎯'} ${target.toLocaleString()} Questions</span>
              <span style="font-size:.85rem;color:var(--text-3)">${Math.min(done,target).toLocaleString()} / ${target.toLocaleString()}</span>
            </div>
            <div class="progress-bar" style="height:10px">
              <div class="progress-fill ${achieved ? 'green' : ''}" style="width:${p}%"></div>
            </div>
          </div>`;
        }).join('')}
      </div>
    </div>
  `;
}
