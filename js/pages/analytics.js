// analytics.js — Performance analytics dashboard
import { lsGet, pct, scoreGrade } from '../lib/utils.js';
import { SUBJECTS } from '../data/subjects.js';

let charts = {};

export function renderAnalytics() {
  const history   = lsGet('hp_test_history', []);
  const stats     = lsGet('hp_stats', { totalAnswered: 0, totalCorrect: 0, mockTests: 0, lastScore: null });
  const streak    = lsGet('hp_streak', { current: 0, longest: 0 });
  const bookmarks = lsGet('hp_bookmarks', []);

  // Subject accuracy from all sessions
  const subAccuracy = computeSubjectAccuracy(history);

  // Score trend (last 10 tests)
  const recent = history.slice(0, 10).reverse();

  document.getElementById('page-container').innerHTML = `
    <div class="page-header">
      <h1 class="page-title animate-fade-up">📊 Analytics & Performance</h1>
      <p class="page-subtitle animate-fade-up delay-1">Deep insights into your preparation</p>
    </div>

    <!-- Top Stats -->
    <div class="grid-4 animate-fade-up delay-1" style="margin-bottom:var(--sp-6)">
      <div class="card" style="text-align:center">
        <div style="font-size:2.2rem;font-weight:700;color:var(--primary)">${stats.totalAnswered}</div>
        <div style="font-size:.82rem;color:var(--text-3)">Total Questions</div>
      </div>
      <div class="card" style="text-align:center">
        <div style="font-size:2.2rem;font-weight:700;color:var(--success)">${pct(stats.totalCorrect,stats.totalAnswered)}%</div>
        <div style="font-size:.82rem;color:var(--text-3)">Overall Accuracy</div>
      </div>
      <div class="card" style="text-align:center">
        <div style="font-size:2.2rem;font-weight:700;color:var(--secondary)">${stats.mockTests}</div>
        <div style="font-size:.82rem;color:var(--text-3)">Mock Tests</div>
      </div>
      <div class="card" style="text-align:center">
        <div style="font-size:2.2rem;font-weight:700;color:var(--amber)">${streak.current}🔥</div>
        <div style="font-size:.82rem;color:var(--text-3)">Current Streak</div>
      </div>
    </div>

    <div class="grid-2 animate-fade-up delay-2" style="margin-bottom:var(--sp-6)">
      <!-- Score Trend -->
      <div class="card">
        <h4 style="margin-bottom:var(--sp-4)">📈 Score Trend (Last ${recent.length} Tests)</h4>
        ${recent.length === 0 ? '<p style="color:var(--text-3);text-align:center;padding:var(--sp-8)">Take some mock tests to see your score trend.</p>' :
          `<div style="position:relative;height:200px"><canvas id="score-trend-chart"></canvas></div>`}
      </div>

      <!-- Subject Accuracy Radar -->
      <div class="card">
        <h4 style="margin-bottom:var(--sp-4)">🎯 Subject Accuracy</h4>
        ${Object.keys(subAccuracy).length === 0 ?
          '<p style="color:var(--text-3);text-align:center;padding:var(--sp-8)">Practice questions to see subject accuracy.</p>' :
          `<div style="position:relative;height:200px"><canvas id="radar-chart"></canvas></div>`}
      </div>
    </div>

    <!-- Subject Breakdown Table -->
    <div class="card animate-fade-up delay-3" style="margin-bottom:var(--sp-6)">
      <h4 style="margin-bottom:var(--sp-5)">📚 Subject Performance Breakdown</h4>
      ${Object.keys(subAccuracy).length === 0 ?
        '<p style="color:var(--text-3);text-align:center;padding:var(--sp-5)">No data yet. Answer some questions!</p>' :
        `<div class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Subject</th>
                <th>Attempted</th>
                <th>Correct</th>
                <th>Wrong</th>
                <th>Accuracy</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${SUBJECTS.map(s => {
                const a = subAccuracy[s.id];
                if (!a) return `<tr>
                  <td><span style="font-weight:600">${s.icon} ${s.name}</span></td>
                  <td colspan="4" style="color:var(--text-3);font-style:italic">No data</td>
                  <td><span class="badge badge-neutral">Pending</span></td>
                </tr>`;
                const acc = pct(a.correct, a.total);
                const grade = acc >= 70 ? 'badge-success' : acc >= 50 ? 'badge-warning' : 'badge-error';
                return `<tr>
                  <td><span style="font-weight:600">${s.icon} ${s.name}</span></td>
                  <td>${a.total}</td>
                  <td style="color:var(--success);font-weight:600">${a.correct}</td>
                  <td style="color:var(--error);font-weight:600">${a.wrong}</td>
                  <td>
                    <div style="display:flex;align-items:center;gap:var(--sp-3)">
                      <div style="flex:1;max-width:80px">
                        <div class="progress-bar" style="height:6px">
                          <div class="progress-fill" style="width:${acc}%;background:${acc>=70?'var(--success)':acc>=50?'var(--amber)':'var(--error)'}"></div>
                        </div>
                      </div>
                      <span style="font-weight:700;font-size:.88rem">${acc}%</span>
                    </div>
                  </td>
                  <td><span class="badge ${grade}">${acc >= 70 ? '✅ Strong' : acc >= 50 ? '⚠️ Average' : '❌ Weak'}</span></td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>`}
    </div>

    <!-- Weak Topics -->
    <div class="card animate-fade-up delay-3" style="margin-bottom:var(--sp-6)">
      <h4 style="margin-bottom:var(--sp-4)">⚠️ Focus Areas (Below 60%)</h4>
      ${(() => {
        const weak = SUBJECTS.filter(s => subAccuracy[s.id] && pct(subAccuracy[s.id].correct, subAccuracy[s.id].total) < 60);
        if (!weak.length) return '<div style="padding:var(--sp-4);text-align:center;color:var(--success)">🎉 All subjects above 60%! Great work!</div>';
        return `<div style="display:flex;flex-direction:column;gap:var(--sp-3)">
          ${weak.map(s => {
            const acc = pct(subAccuracy[s.id].correct, subAccuracy[s.id].total);
            return `<div class="weak-topic-item">
              <span style="font-size:1.2rem">${s.icon}</span>
              <span class="weak-topic-name">${s.name}</span>
              <div style="flex:1;max-width:120px">
                <div class="progress-bar" style="height:6px">
                  <div class="progress-fill" style="width:${acc}%;background:var(--error)"></div>
                </div>
              </div>
              <span class="weak-topic-pct bad">${acc}%</span>
              <button class="btn btn-outline btn-sm" onclick="window.navigate('practice','subject=${s.id}')">Practice →</button>
            </div>`;
          }).join('')}
        </div>`;
      })()}
    </div>

    <!-- Prediction -->
    ${stats.mockTests >= 2 ? `
    <div class="card animate-fade-up delay-4" style="background:var(--primary-bg);border-color:var(--primary)">
      <h4 style="color:var(--primary);margin-bottom:var(--sp-3)">🔮 Score Prediction</h4>
      <p style="font-size:.9rem;color:var(--text-2)">
        Based on your last ${Math.min(stats.mockTests, 5)} mock tests, your estimated AIAPGET score range is:
      </p>
      <div style="font-family:var(--font-serif);font-size:2rem;font-weight:700;color:var(--primary);margin:var(--sp-3) 0">
        ${estimatePrediction(history)}
      </div>
      <p style="font-size:.78rem;color:var(--text-3)">Prediction improves with more mock tests. Keep practicing!</p>
    </div>` : ''}
  `;

  // Render charts after DOM update
  setTimeout(() => renderCharts(recent, subAccuracy), 100);
}

function computeSubjectAccuracy(history) {
  const map = {};
  history.forEach(session => {
    (session.questions || []).forEach(q => {
      if (!map[q.subject]) map[q.subject] = { correct: 0, wrong: 0, skipped: 0, total: 0 };
      map[q.subject].total++;
      if (q.selected === null) map[q.subject].skipped++;
      else if (q.selected === q.correct) map[q.subject].correct++;
      else map[q.subject].wrong++;
    });
  });
  return map;
}

function estimatePrediction(history) {
  const recent = history.slice(0, 5);
  if (recent.length < 2) return 'N/A';
  const scores = recent.map(s => s.score);
  const avg = scores.reduce((a,b) => a+b, 0) / scores.length;
  const min = Math.max(0, Math.round(avg * 0.85));
  const max = Math.min(480, Math.round(avg * 1.15));
  return `${min} – ${max} / 480`;
}

function renderCharts(recent, subAccuracy) {
  if (!window.Chart) return;

  // Score Trend
  const trendCanvas = document.getElementById('score-trend-chart');
  if (trendCanvas && recent.length > 0) {
    if (charts.trend) charts.trend.destroy();
    charts.trend = new Chart(trendCanvas, {
      type: 'line',
      data: {
        labels: recent.map((_, i) => `Test ${i+1}`),
        datasets: [{
          label: 'Score',
          data: recent.map(s => s.score),
          borderColor: '#C4714F', backgroundColor: 'rgba(196,113,79,.1)',
          tension: 0.4, fill: true, pointRadius: 5, pointBackgroundColor: '#C4714F',
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { min: 0, max: 480, grid: { color: '#EDE5D8' } },
          x: { grid: { display: false } },
        },
      },
    });
  }

  // Radar Chart
  const radarCanvas = document.getElementById('radar-chart');
  if (radarCanvas && Object.keys(subAccuracy).length > 0) {
    if (charts.radar) charts.radar.destroy();
    const labels = SUBJECTS.filter(s => subAccuracy[s.id]).map(s => s.name.split(' ').slice(0,2).join(' '));
    const data   = SUBJECTS.filter(s => subAccuracy[s.id]).map(s => pct(subAccuracy[s.id].correct, subAccuracy[s.id].total));
    charts.radar = new Chart(radarCanvas, {
      type: 'radar',
      data: {
        labels,
        datasets: [{
          label: 'Accuracy %',
          data,
          borderColor: '#6B8F71', backgroundColor: 'rgba(107,143,113,.15)',
          pointBackgroundColor: '#6B8F71',
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        scales: { r: { min: 0, max: 100, ticks: { stepSize: 25 }, grid: { color: '#EDE5D8' } } },
        plugins: { legend: { display: false } },
      },
    });
  }
}
