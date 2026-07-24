// pyq.js — Previous Year Questions organized by year and subject
import { lsGet, pct } from '../lib/utils.js';
import { SUBJECTS } from '../data/subjects.js';
import { SEED_QUESTIONS, getAllQuestions } from '../data/questions.js';

export function renderPYQ() {
  const all = getAllQuestions();
  const years = [...new Set(all.map(q => q.year).filter(Boolean))].sort((a,b) => b-a);
  const groups = [...new Set(all.map(q => q.group).filter(Boolean))].sort();

  const yearBreakdown = years.map(y => ({
    year: y,
    total: all.filter(q => q.year === y).length,
    subjects: SUBJECTS.map(s => ({
      ...s,
      count: all.filter(q => q.year === y && q.subject === s.id).length,
    })).filter(s => s.count > 0),
  }));

  document.getElementById('page-container').innerHTML = `
    <div class="page-header">
      <h1 class="page-title animate-fade-up">📅 Previous Year Questions</h1>
      <p class="page-subtitle animate-fade-up delay-1">${all.filter(q=>q.year).length} questions organized by year</p>
    </div>

    <!-- View Toggle -->
    <div class="tabs animate-fade-up delay-1" id="pyq-tabs">
      <button class="tab active" data-tab="by-year">📅 By Year</button>
      <button class="tab" data-tab="by-subject">📚 By Subject</button>
      <button class="tab" data-tab="groups">📁 My Groups</button>
    </div>

    <div id="pyq-content" class="animate-fade-up delay-2">
      ${renderByYear(yearBreakdown, all)}
    </div>
  `;

  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const content = document.getElementById('pyq-content');
      if (tab.dataset.tab === 'by-year')    content.innerHTML = renderByYear(yearBreakdown, all);
      if (tab.dataset.tab === 'by-subject') content.innerHTML = renderBySubject(all);
      if (tab.dataset.tab === 'groups')     content.innerHTML = renderGroups(groups, all);
    });
  });
}

function renderByYear(yearBreakdown, all) {
  if (!yearBreakdown.length) return `<div class="empty-state"><span class="empty-state-icon">📅</span><h3>No year-tagged questions yet</h3><p>Upload PYQ sets via the admin panel.</p></div>`;
  return yearBreakdown.map(y => `
    <div class="card" style="margin-bottom:var(--sp-5)">
      <div class="flex justify-between items-center" style="margin-bottom:var(--sp-4)">
        <div>
          <h3 style="font-family:var(--font-serif)">${y.year}</h3>
          <p style="font-size:.85rem;color:var(--text-3)">${y.total} questions</p>
        </div>
        <button class="btn btn-primary btn-sm" onclick="window.navigate('practice','year=${y.year}')">
          Practice ${y.year} →
        </button>
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:var(--sp-2)">
        ${y.subjects.map(s => `
          <button class="subject-chip" style="background:${s.bg};color:${s.color}"
                  onclick="window.navigate('practice','subject=${s.id}&year=${y.year}')">
            ${s.icon} ${s.name} <strong>${s.count}</strong>
          </button>`).join('')}
      </div>
    </div>`).join('');
}

function renderBySubject(all) {
  return `<div class="grid-2">
    ${SUBJECTS.map(s => {
      const subQ  = all.filter(q => q.subject === s.id);
      const years = [...new Set(subQ.map(q => q.year).filter(Boolean))].sort((a,b) => b-a);
      return `<div class="card" style="cursor:pointer;border-left:4px solid ${s.color}"
                   onclick="window.navigate('practice','subject=${s.id}')">
        <div class="flex justify-between items-center">
          <div>
            <h4>${s.icon} ${s.name}</h4>
            <p style="font-size:.8rem;color:var(--text-3);margin-top:4px">${subQ.length} questions • ${years.join(', ') || 'No year data'}</p>
          </div>
          <span class="badge" style="background:${s.bg};color:${s.color}">${subQ.length}</span>
        </div>
      </div>`;
    }).join('')}
  </div>`;
}

function renderGroups(groups, all) {
  if (!groups.length) return `<div class="empty-state"><span class="empty-state-icon">📁</span><h3>No groups yet</h3><p>Create groups in the admin panel to organize your questions.</p></div>`;
  return `<div style="display:flex;flex-direction:column;gap:var(--sp-4)">
    ${groups.map(g => {
      const gQ = all.filter(q => q.group === g);
      const verified = gQ.filter(q => q.verified).length;
      return `<div class="card" style="cursor:pointer" onclick="window.navigate('practice','group=${encodeURIComponent(g)}')">
        <div class="flex justify-between items-center">
          <div>
            <h4>📁 ${g}</h4>
            <p style="font-size:.8rem;color:var(--text-3);margin-top:4px">${gQ.length} questions • ${verified} verified</p>
          </div>
          <div class="flex gap-2">
            <span class="badge badge-neutral">${gQ.length} Qs</span>
            ${gQ.length - verified > 0 ? `<span class="badge badge-warning">${gQ.length - verified} pending</span>` : '<span class="badge badge-success">All verified</span>'}
          </div>
        </div>
      </div>`;
    }).join('')}
  </div>`;
}
