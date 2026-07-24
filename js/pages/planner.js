// planner.js — Per-Subject Time & Topic Allocation AIAPGET Study Planner
import { lsGet, lsSet, daysUntil, generateStudyPlan, formatDate, toast, esc } from '../lib/utils.js';
import { SUBJECTS } from '../data/subjects.js';

let editingDate = null;
let currentEditingAllocations = [];

export function renderPlanner() {
  const examDate = lsGet('hp_exam_date', null);
  const days     = daysUntil(examDate);
  let plan       = lsGet('hp_study_plan', []);
  const today    = new Date().toISOString().split('T')[0];

  // Ensure all plan entries have per-subject allocations
  if (Array.isArray(plan)) {
    plan = plan.map(p => {
      let allocations = [];
      if (Array.isArray(p.subjectAllocations) && p.subjectAllocations.length > 0) {
        allocations = p.subjectAllocations;
      } else if (Array.isArray(p.subjects) && p.subjects.length > 0) {
        const hPerSub = (parseFloat(p.allocatedHours) || 3.0) / p.subjects.length;
        allocations = p.subjects.map(sId => ({
          subject: sId,
          time: Math.round(hPerSub * 2) / 2 || 1.0,
          notes: p.taskNotes || '',
        }));
      } else {
        allocations = [{
          subject: p.subject || 'materia-medica',
          time: parseFloat(p.allocatedHours) || 3.0,
          notes: p.taskNotes || '',
        }];
      }

      const totalH = allocations.reduce((acc, sa) => acc + (parseFloat(sa.time) || 0), 0);

      return {
        ...p,
        subjectAllocations: allocations,
        subjects: allocations.map(sa => sa.subject),
        subject: allocations[0]?.subject || 'materia-medica',
        allocatedHours: Math.round(totalH * 2) / 2,
        status: p.status || (p.done ? 'completed' : 'pending'),
        done: p.status === 'completed' || p.done === true,
      };
    });
  } else {
    plan = [];
  }

  // Calculate Productivity Stats
  const totalDays      = plan.length;
  const completedDays  = plan.filter(p => p.status === 'completed' || p.done).length;
  const inProgressDays = plan.filter(p => p.status === 'in-progress').length;
  const totalHours     = plan.reduce((acc, p) => acc + (parseFloat(p.allocatedHours) || 0), 0);
  const completedHours = plan.reduce((acc, p) => acc + (p.status === 'completed' || p.done ? (parseFloat(p.allocatedHours) || 0) : 0), 0);
  const completionPct  = totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0;

  const container = document.getElementById('page-container');
  if (!container) return;

  container.innerHTML = `
    <div class="page-header flex justify-between items-center" style="flex-wrap:wrap;gap:var(--sp-4)">
      <div>
        <h1 class="page-title animate-fade-up">🗓 Smart Study Planner & Productivity Hub</h1>
        <p class="page-subtitle animate-fade-up delay-1">Set per-subject study time & topics, track daily goals, and master core NCH subjects</p>
      </div>
      <div class="flex gap-2 animate-fade-up delay-2" style="flex-wrap:wrap">
        <button class="btn btn-outline" id="add-custom-task-btn">➕ Add Study Slot</button>
        <button class="btn btn-primary" id="gen-plan-btn">✨ Regenerate Priority Plan</button>
      </div>
    </div>

    ${!examDate ? `
      <div class="card animate-fade-up" style="text-align:center;padding:var(--sp-10);border-color:var(--primary)">
        <div style="font-size:3rem;margin-bottom:var(--sp-4)">📅</div>
        <h3>Set your exam date first</h3>
        <p style="margin-bottom:var(--sp-5);color:var(--text-3)">We'll generate a personalized, subject-weighted study plan based on your remaining days.</p>
        <button class="btn btn-primary btn-lg" onclick="window.navigate('settings')">Set Exam Date →</button>
      </div>` : `

      <!-- Productivity & Progress Banner Grid -->
      <div class="grid-4 animate-fade-up delay-1" style="margin-bottom:var(--sp-6)">
        <!-- Countdown -->
        <div class="countdown-card" style="padding:var(--sp-4)">
          <div class="countdown-label">📅 ${formatDate(examDate)}</div>
          <div class="countdown-days" style="font-size:2rem">${days > 0 ? days : '🎯'}</div>
          <div class="countdown-sub">${days > 0 ? `${days} days left` : 'Exam today!'}</div>
        </div>

        <!-- Hours Allocated & Done -->
        <div class="card" style="text-align:center">
          <div style="font-size:1.8rem;font-weight:700;color:var(--primary)">${completedHours.toFixed(1)} <small style="font-size:.9rem;color:var(--text-3)">/ ${totalHours.toFixed(1)}h</small></div>
          <div style="font-size:.8rem;color:var(--text-3);margin-top:2px">Study Hours Completed</div>
          <div class="progress-bar" style="margin-top:var(--sp-3);height:6px">
            <div class="progress-fill" style="width:${totalHours > 0 ? Math.min(100, Math.round((completedHours / totalHours) * 100)) : 0}%"></div>
          </div>
        </div>

        <!-- Days Progress -->
        <div class="card" style="text-align:center">
          <div style="font-size:1.8rem;font-weight:700;color:var(--success)">${completedDays} <small style="font-size:.9rem;color:var(--text-3)">/ ${totalDays}</small></div>
          <div style="font-size:.8rem;color:var(--text-3);margin-top:2px">Days Completed (${completionPct}%)</div>
          <div class="progress-bar" style="margin-top:var(--sp-3);height:6px">
            <div class="progress-fill green" style="width:${completionPct}%"></div>
          </div>
        </div>

        <!-- In Progress & Active -->
        <div class="card" style="text-align:center">
          <div style="font-size:1.8rem;font-weight:700;color:var(--warning)">${inProgressDays}</div>
          <div style="font-size:.8rem;color:var(--text-3);margin-top:2px">Tasks In Progress</div>
          <div style="font-size:.72rem;color:var(--text-3);margin-top:var(--sp-2)">${plan.filter(p => p.date === today).length > 0 ? '📍 Today active' : 'No task scheduled today'}</div>
        </div>
      </div>

      <!-- Weekly Schedule Strip -->
      ${plan.length > 0 ? `
        <div class="card animate-fade-up delay-2" style="margin-bottom:var(--sp-6)">
          <div class="flex justify-between items-center" style="margin-bottom:var(--sp-4)">
            <h4>📅 Active Week Schedule</h4>
            <span style="font-size:.78rem;color:var(--text-3)">Click any day to edit per-subject hours & topics</span>
          </div>
          <div class="planner-week">
            ${getThisWeek().map(dateStr => {
              const dayPlan = plan.find(p => p.date === dateStr);
              const isToday = dateStr === today;
              const isPast  = dateStr < today;
              const isDone  = dayPlan?.status === 'completed' || dayPlan?.done;
              const inProg  = dayPlan?.status === 'in-progress';
              const subObjs = dayPlan?.subjectAllocations ? dayPlan.subjectAllocations.map(sa => SUBJECTS.find(s => s.id === sa.subject)).filter(Boolean) : [];
              const d       = new Date(dateStr);

              return `
                <div class="planner-day ${isToday ? 'today' : ''} ${isDone ? 'done' : ''}"
                     style="opacity:${isPast && !isDone ? '.6' : '1'};cursor:pointer"
                     onclick="${dayPlan ? `openEditModal('${dayPlan.date}')` : `openAddModal('${dateStr}')`}">
                  <div class="planner-day-num">${d.getDate()}</div>
                  <div class="planner-day-label">${d.toLocaleDateString('en-IN', { weekday: 'short' })}</div>
                  <div style="display:flex;gap:2px;justify-content:center;margin-top:4px;flex-wrap:wrap">
                    ${subObjs.slice(0, 3).map(s => `<span style="font-size:.65rem;color:${s.color}" title="${s.name}">${s.icon}</span>`).join('')}
                    ${subObjs.length > 3 ? `<span style="font-size:.6rem;color:var(--text-3)">+${subObjs.length - 3}</span>` : ''}
                  </div>
                  ${dayPlan?.allocatedHours ? `<div style="font-size:.62rem;color:var(--text-3);margin-top:2px">${dayPlan.allocatedHours}h</div>` : ''}
                  ${isDone ? '<div style="color:var(--success);font-size:.65rem;margin-top:2px">✅</div>' : inProg ? '<div style="color:var(--warning);font-size:.65rem;margin-top:2px">⏳</div>' : ''}
                </div>`;
            }).join('')}
          </div>
        </div>

        <!-- Full Interactive Plan Table -->
        <div class="card animate-fade-up delay-3">
          <div class="flex justify-between items-center" style="margin-bottom:var(--sp-5);flex-wrap:wrap;gap:var(--sp-3)">
            <div>
              <h3 style="font-family:var(--font-serif)">📋 Daily Study Plan & Subject Breakdown</h3>
              <span style="font-size:.78rem;color:var(--text-3)">Each subject has its own allocated hours & topic notes. Click "Edit Day" to customize.</span>
            </div>
          </div>

          <div class="table-wrapper">
            <table style="width:100%;border-collapse:collapse;font-size:.85rem">
              <thead>
                <tr style="background:var(--bg-2);border-bottom:2px solid var(--border)">
                  <th style="padding:var(--sp-3);text-align:left;width:120px">Date</th>
                  <th style="padding:var(--sp-3);text-align:left">Per-Subject Study Time & Topic Notes</th>
                  <th style="padding:var(--sp-3);text-align:center;width:90px">Total Time</th>
                  <th style="padding:var(--sp-3);text-align:center;width:110px">Targets</th>
                  <th style="padding:var(--sp-3);text-align:center;width:110px">Status</th>
                  <th style="padding:var(--sp-3);text-align:right;width:140px">Actions</th>
                </tr>
              </thead>
              <tbody>
                ${plan.slice(0, 30).map(p => {
                  const isT    = p.date === today;
                  const isDone = p.status === 'completed' || p.done;
                  const inProg = p.status === 'in-progress';
                  const saList = p.subjectAllocations || [];

                  return `
                    <tr style="border-bottom:1px solid var(--border);${isT ? 'background:var(--primary-bg)' : ''}">
                      <td style="padding:var(--sp-3);font-weight:${isT ? '700' : '400'};white-space:nowrap;vertical-align:top">
                        ${formatDate(p.date)}${isT ? '<br><span class="badge badge-warning" style="font-size:.65rem;margin-top:2px">Today</span>' : ''}
                      </td>
                      <td style="padding:var(--sp-3)">
                        <div style="display:flex;flex-direction:column;gap:6px">
                          ${saList.map(sa => {
                            const s = SUBJECTS.find(sub => sub.id === sa.subject) || { icon: '📚', name: sa.subject, color: 'var(--primary)', bg: 'var(--primary-bg)' };
                            return `
                              <div style="display:flex;align-items:center;gap:var(--sp-2);background:var(--bg);padding:4px 8px;border-radius:var(--r-sm);border-left:3px solid ${s.color}">
                                <span class="badge" style="background:${s.bg};color:${s.color};font-size:.75rem;padding:2px 6px;white-space:nowrap">${s.icon} ${s.name}</span>
                                <span style="font-size:.75rem;font-weight:700;color:var(--primary);white-space:nowrap">⏱ ${sa.time || 1.0}h</span>
                                ${sa.notes ? `<span style="font-size:.8rem;color:var(--text);font-weight:500">• ${esc(sa.notes)}</span>` : ''}
                              </div>`;
                          }).join('')}
                        </div>
                      </td>
                      <td style="padding:var(--sp-3);text-align:center;font-weight:700;color:var(--primary);vertical-align:top">
                        ⏱ ${p.allocatedHours || 3.0} hrs
                      </td>
                      <td style="padding:var(--sp-3);text-align:center;vertical-align:top">
                        <span style="font-size:.8rem;color:var(--text-2)">${p.questionsTarget || 30} Qs<br>${p.flashcardsTarget || 20} Cards</span>
                      </td>
                      <td style="padding:var(--sp-3);text-align:center;vertical-align:top">
                        <span class="badge ${isDone ? 'badge-success' : inProg ? 'badge-warning' : 'badge-neutral'}"
                              style="cursor:pointer;user-select:none"
                              onclick="cycleStatus('${p.date}')"
                              title="Click to cycle status: Pending ➔ In Progress ➔ Completed">
                          ${isDone ? '✅ Completed' : inProg ? '⏳ In Progress' : 'Pending'}
                        </span>
                      </td>
                      <td style="padding:var(--sp-3);text-align:right;vertical-align:top">
                        <button class="btn btn-ghost btn-sm" onclick="openEditModal('${p.date}')" title="Edit subjects, times & topic notes">✏️ Edit</button>
                      </td>
                    </tr>`;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      ` : `
        <div class="empty-state animate-fade-up">
          <span class="empty-state-icon">🗓</span>
          <h3>No study plan generated yet</h3>
          <p style="margin:var(--sp-2) 0 var(--sp-4)">Click "Regenerate Priority Plan" to build a customized day-by-day schedule based on your exam date.</p>
          <button class="btn btn-primary btn-lg" id="empty-gen-plan-btn">✨ Generate 30-Day Plan</button>
        </div>
      `}
    `}

    <!-- Edit Day Modal with Per-Subject Allocation Builder -->
    <div id="edit-day-modal" class="modal-overlay hidden">
      <div class="modal" style="max-width:680px">
        <div class="modal-header">
          <h3 id="edm-date-title">✏️ Edit Study Day Allocations</h3>
          <button class="btn btn-ghost btn-icon" id="close-edm-modal">✕</button>
        </div>
        <div class="modal-body">
          <form id="edit-day-form" style="display:flex;flex-direction:column;gap:var(--sp-4)">
            <div>
              <div class="flex justify-between items-center" style="margin-bottom:var(--sp-2)">
                <label class="form-label" style="margin-bottom:0">Per-Subject Study Time & Topics *</label>
                <button type="button" class="btn btn-secondary btn-sm" id="edm-add-slot-btn">+ Add Subject Slot</button>
              </div>
              <div id="edm-allocations-container" style="display:flex;flex-direction:column;gap:var(--sp-2);max-height:260px;overflow-y:auto;padding-right:4px">
                <!-- Allocation Rows dynamically rendered -->
              </div>
            </div>

            <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:var(--sp-4)">
              <div class="form-group">
                <label class="form-label">Questions Target</label>
                <input class="form-input" type="number" id="edm-q-target" min="5" max="200" value="30" />
              </div>
              <div class="form-group">
                <label class="form-label">Flashcards Target</label>
                <input class="form-input" type="number" id="edm-fc-target" min="5" max="100" value="20" />
              </div>
              <div class="form-group">
                <label class="form-label">Status</label>
                <select class="form-select" id="edm-status">
                  <option value="pending">Pending</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">✅ Completed</option>
                </select>
              </div>
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost" id="cancel-edm">Cancel</button>
          <button class="btn btn-primary" id="save-edm">Save Changes</button>
        </div>
      </div>
    </div>

    <!-- Add Custom Task Modal -->
    <div id="add-task-modal" class="modal-overlay hidden">
      <div class="modal" style="max-width:580px">
        <div class="modal-header">
          <h3>➕ Add Custom Study Day</h3>
          <button class="btn btn-ghost btn-icon" id="close-atm-modal">✕</button>
        </div>
        <div class="modal-body">
          <form id="add-task-form" style="display:flex;flex-direction:column;gap:var(--sp-4)">
            <div class="form-group">
              <label class="form-label">Date *</label>
              <input class="form-input" type="date" id="atm-date" required />
            </div>

            <div class="form-group">
              <label class="form-label">Primary Subject *</label>
              <select class="form-select" id="atm-subject">
                ${SUBJECTS.map(s => `<option value="${s.id}">${s.icon} ${s.name}</option>`).join('')}
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Allocated Hours *</label>
              <input class="form-input" type="number" id="atm-hours" step="0.5" value="2.0" required />
            </div>

            <div class="form-group">
              <label class="form-label">Topic / Goal Notes</label>
              <input class="form-input" type="text" id="atm-notes" placeholder="e.g. Materia Medica & Organon Revision" />
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost" id="cancel-atm">Cancel</button>
          <button class="btn btn-primary" id="save-atm">Add to Planner</button>
        </div>
      </div>
    </div>
  `;

  wirePlannerEvents();
}

function wirePlannerEvents() {
  document.getElementById('gen-plan-btn')?.addEventListener('click', generateOrRegenPlan);
  document.getElementById('empty-gen-plan-btn')?.addEventListener('click', generateOrRegenPlan);
  document.getElementById('add-custom-task-btn')?.addEventListener('click', () => openAddModal());

  // Edit Modal Wires
  document.getElementById('close-edm-modal')?.addEventListener('click', closeEditModal);
  document.getElementById('cancel-edm')?.addEventListener('click', closeEditModal);
  document.getElementById('save-edm')?.addEventListener('click', saveEditModal);
  document.getElementById('edm-add-slot-btn')?.addEventListener('click', () => {
    currentEditingAllocations.push({ subject: 'materia-medica', time: 1.0, notes: '' });
    renderEditAllocationsUI();
  });

  // Add Modal Wires
  document.getElementById('close-atm-modal')?.addEventListener('click', closeAddModal);
  document.getElementById('cancel-atm')?.addEventListener('click', closeAddModal);
  document.getElementById('save-atm')?.addEventListener('click', saveAddModal);
}

function renderEditAllocationsUI() {
  const container = document.getElementById('edm-allocations-container');
  if (!container) return;

  if (currentEditingAllocations.length === 0) {
    currentEditingAllocations.push({ subject: 'materia-medica', time: 2.0, notes: '' });
  }

  container.innerHTML = currentEditingAllocations.map((sa, idx) => `
    <div class="edm-alloc-row" style="display:grid;grid-template-columns:1.5fr 0.8fr 2.2fr 30px;gap:var(--sp-2);align-items:center;background:var(--bg);padding:var(--sp-3);border:1px solid var(--border);border-radius:var(--r-md)">
      <div>
        <label class="form-label" style="font-size:.72rem;margin-bottom:2px">Subject</label>
        <select class="form-select edm-alloc-subject" data-idx="${idx}" style="height:32px;font-size:.8rem;padding:0 24px 0 8px">
          ${SUBJECTS.map(s => `<option value="${s.id}" ${sa.subject === s.id ? 'selected' : ''}>${s.icon} ${s.name}</option>`).join('')}
        </select>
      </div>
      <div>
        <label class="form-label" style="font-size:.72rem;margin-bottom:2px">Hours</label>
        <input class="form-input edm-alloc-time" data-idx="${idx}" type="number" step="0.5" min="0.5" max="12" value="${sa.time || 1.0}" style="height:32px;font-size:.8rem;padding:0 8px" />
      </div>
      <div>
        <label class="form-label" style="font-size:.72rem;margin-bottom:2px">Topic / Focus Note</label>
        <input class="form-input edm-alloc-notes" data-idx="${idx}" type="text" value="${esc(sa.notes || '')}" placeholder="e.g. Keynotes & Aphorisms" style="height:32px;font-size:.8rem" />
      </div>
      <div style="text-align:center;margin-top:14px">
        <button type="button" class="btn btn-ghost btn-sm edm-remove-slot" data-idx="${idx}" style="padding:2px 4px;color:var(--error);font-weight:700" title="Remove slot">✕</button>
      </div>
    </div>
  `).join('');

  // Wire input changes
  document.querySelectorAll('.edm-alloc-subject').forEach(el => {
    el.addEventListener('change', (e) => {
      const i = parseInt(e.target.dataset.idx);
      currentEditingAllocations[i].subject = e.target.value;
    });
  });

  document.querySelectorAll('.edm-alloc-time').forEach(el => {
    el.addEventListener('input', (e) => {
      const i = parseInt(e.target.dataset.idx);
      currentEditingAllocations[i].time = parseFloat(e.target.value) || 1.0;
    });
  });

  document.querySelectorAll('.edm-alloc-notes').forEach(el => {
    el.addEventListener('input', (e) => {
      const i = parseInt(e.target.dataset.idx);
      currentEditingAllocations[i].notes = e.target.value;
    });
  });

  document.querySelectorAll('.edm-remove-slot').forEach(el => {
    el.addEventListener('click', (e) => {
      const i = parseInt(e.target.dataset.idx);
      if (currentEditingAllocations.length <= 1) {
        return toast('Each day must have at least one subject slot.', 'warning');
      }
      currentEditingAllocations.splice(i, 1);
      renderEditAllocationsUI();
    });
  });
}

function generateOrRegenPlan() {
  const examDate = lsGet('hp_exam_date', null);
  if (!examDate) { toast('Set exam date in Settings first.', 'error'); return; }
  const plan = generateStudyPlan(examDate);
  if (!plan) { toast('Exam date has passed or is invalid.', 'error'); return; }

  // Default initial values with per-subject allocations
  const richPlan = plan.map(p => ({
    ...p,
    subjectAllocations: [{
      subject: p.subject || 'materia-medica',
      time: 3.0,
      notes: '',
    }],
    subjects: [p.subject || 'materia-medica'],
    allocatedHours: 3.0,
    status: 'pending',
    done: false,
  }));

  lsSet('hp_study_plan', richPlan);
  toast(`✅ Generated ${richPlan.length}-day weighted AIAPGET study plan!`, 'success');
  renderPlanner();
}

window.cycleStatus = function(dateStr) {
  let plan = lsGet('hp_study_plan', []);
  const item = plan.find(p => p.date === dateStr);
  if (item) {
    const states = ['pending', 'in-progress', 'completed'];
    const current = item.status || (item.done ? 'completed' : 'pending');
    const nextIdx = (states.indexOf(current) + 1) % states.length;
    item.status = states[nextIdx];
    item.done = item.status === 'completed';

    lsSet('hp_study_plan', plan);
    const labels = { 'pending': 'Pending', 'in-progress': 'In Progress ⏳', 'completed': 'Completed! 🎉' };
    toast(`Status: ${labels[item.status]}`, 'success', 2000);
    renderPlanner();
  }
};

window.openEditModal = function(dateStr) {
  const plan = lsGet('hp_study_plan', []);
  const item = plan.find(p => p.date === dateStr);
  if (!item) return;

  editingDate = dateStr;

  const dateTitle = document.getElementById('edm-date-title');
  if (dateTitle) dateTitle.textContent = `✏️ Edit Allocations — ${formatDate(dateStr)}`;

  if (Array.isArray(item.subjectAllocations) && item.subjectAllocations.length > 0) {
    currentEditingAllocations = JSON.parse(JSON.stringify(item.subjectAllocations));
  } else {
    currentEditingAllocations = [{
      subject: item.subject || 'materia-medica',
      time: parseFloat(item.allocatedHours) || 3.0,
      notes: item.taskNotes || '',
    }];
  }

  renderEditAllocationsUI();

  document.getElementById('edm-q-target').value = item.questionsTarget || 30;
  document.getElementById('edm-fc-target').value = item.flashcardsTarget || 20;
  document.getElementById('edm-status').value    = item.status || (item.done ? 'completed' : 'pending');

  document.getElementById('edit-day-modal')?.classList.remove('hidden');
};

function closeEditModal() {
  editingDate = null;
  currentEditingAllocations = [];
  document.getElementById('edit-day-modal')?.classList.add('hidden');
}

function saveEditModal() {
  if (!editingDate) return;
  let plan = lsGet('hp_study_plan', []);
  const item = plan.find(p => p.date === editingDate);

  if (item) {
    if (currentEditingAllocations.length === 0) {
      return toast('Please add at least one subject slot.', 'error');
    }

    const totalH = currentEditingAllocations.reduce((acc, sa) => acc + (parseFloat(sa.time) || 0), 0);

    item.subjectAllocations = currentEditingAllocations;
    item.subjects           = currentEditingAllocations.map(sa => sa.subject);
    item.subject            = item.subjects[0];
    const mainSubj          = SUBJECTS.find(s => s.id === item.subject);
    item.subjectName        = mainSubj ? mainSubj.name : item.subject;
    item.priority           = mainSubj ? mainSubj.priority : 'P1';
    item.allocatedHours     = Math.round(totalH * 2) / 2;
    item.questionsTarget    = parseInt(document.getElementById('edm-q-target').value) || 30;
    item.flashcardsTarget   = parseInt(document.getElementById('edm-fc-target').value) || 20;
    item.status             = document.getElementById('edm-status').value;
    item.done               = item.status === 'completed';

    lsSet('hp_study_plan', plan);
    toast('✅ Daily per-subject study plan updated!', 'success');
    closeEditModal();
    renderPlanner();
  }
}

window.openAddModal = function(defaultDate = '') {
  const dInput = document.getElementById('atm-date');
  if (dInput) dInput.value = defaultDate || new Date().toISOString().split('T')[0];

  document.getElementById('add-task-modal')?.classList.remove('hidden');
};

function closeAddModal() {
  document.getElementById('add-task-modal')?.classList.add('hidden');
}

function saveAddModal() {
  const dateStr = document.getElementById('atm-date').value;
  const subjId  = document.getElementById('atm-subject').value;
  const hours   = parseFloat(document.getElementById('atm-hours').value) || 2.0;
  const notes   = document.getElementById('atm-notes').value.trim();

  if (!dateStr) return toast('Please select a date.', 'error');

  const mainSubj = SUBJECTS.find(s => s.id === subjId);
  let plan = lsGet('hp_study_plan', []);

  const existing = plan.find(p => p.date === dateStr);
  if (existing) {
    if (!Array.isArray(existing.subjectAllocations)) existing.subjectAllocations = [];
    existing.subjectAllocations.push({ subject: subjId, time: hours, notes });
    existing.subjects = existing.subjectAllocations.map(sa => sa.subject);
    existing.allocatedHours = existing.subjectAllocations.reduce((acc, sa) => acc + (parseFloat(sa.time) || 0), 0);
  } else {
    plan.push({
      date: dateStr,
      subjectAllocations: [{ subject: subjId, time: hours, notes }],
      subjects: [subjId],
      subject: subjId,
      subjectName: mainSubj ? mainSubj.name : subjId,
      priority: mainSubj ? mainSubj.priority : 'P1',
      allocatedHours: hours,
      questionsTarget: 30,
      flashcardsTarget: 20,
      status: 'pending',
      done: false,
    });
    plan.sort((a, b) => a.date.localeCompare(b.date));
  }

  lsSet('hp_study_plan', plan);
  toast('✅ Custom study task added!', 'success');
  closeAddModal();
  renderPlanner();
}

function getThisWeek() {
  const week = [];
  const today = new Date();
  const monday = new Date(today);
  monday.setDate(today.getDate() - today.getDay() + 1);
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    week.push(d.toISOString().split('T')[0]);
  }
  return week;
}
