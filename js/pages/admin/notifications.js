// admin/notifications.js — Admin Notification Broadcast & Study Reminder Center
import { lsGet, lsSet, toast, formatDateTime } from '../../lib/utils.js';

export function renderAdminNotifications() {
  const notifHistory = lsGet('hp_sent_notifications', []);

  document.getElementById('page-container').innerHTML = `
    <div class="page-header">
      <h1 class="page-title animate-fade-up">🔔 Notification Broadcast Center</h1>
      <p class="page-subtitle animate-fade-up delay-1">Send push notifications, study reminders, and custom encouragement to your student</p>
    </div>

    <div class="grid-2 animate-fade-up delay-1" style="gap:var(--sp-6);margin-bottom:var(--sp-6)">
      <!-- Left: Send Notification Form -->
      <div class="card">
        <h3 style="margin-bottom:var(--sp-4)">📢 Send Quick Notification</h3>
        <form id="send-notif-form" style="display:flex;flex-direction:column;gap:var(--sp-4)">
          <div class="form-group">
            <label class="form-label">Notification Title *</label>
            <input class="form-input" type="text" id="notif-title" placeholder="e.g. 🌿 Time for Organon Revision!" required />
          </div>
          <div class="form-group">
            <label class="form-label">Message Body *</label>
            <textarea class="form-textarea" id="notif-body" rows="4" placeholder="e.g. You have 12 flashcards due today. Keep your 7-day streak going!" required></textarea>
          </div>
          <div class="form-group">
            <label class="form-label">Notification Type</label>
            <select class="form-select" id="notif-type">
              <option value="reminder">🔔 Study Reminder</option>
              <option value="motivation">🔥 Motivation / Streak</option>
              <option value="test">📝 Mock Test Alert</option>
              <option value="announcement">📢 Admin Announcement</option>
            </select>
          </div>
          <button class="btn btn-primary btn-lg" type="submit">
            🚀 Send Notification Now
          </button>
        </form>
      </div>

      <!-- Right: Presets & Push Test -->
      <div class="card">
        <h3 style="margin-bottom:var(--sp-4)">⚡ Quick Presets</h3>
        <div style="display:flex;flex-direction:column;gap:var(--sp-3);margin-bottom:var(--sp-6)">
          ${[
            { t: '🌿 Daily Materia Medica Keynote', b: 'Quick reminder: Spend 15 minutes reviewing drug keynotes today!' },
            { t: '🔥 Don\'t lose your streak!', b: 'You are on a streak! Complete 20 questions today to keep it active.' },
            { t: '⏱ Full Mock Test Scheduled', b: 'A new full mock test is ready. Practice under timed exam conditions now!' },
            { t: '📖 Organon Aphorism Check', b: 'Review Aphorism 153 (PQRS symptoms) and test your knowledge.' },
          ].map(p => `
            <div style="padding:var(--sp-3);background:var(--bg);border:1px solid var(--border);border-radius:var(--r-md);cursor:pointer"
                 onclick="fillNotifPreset('${p.t}', '${p.b}')">
              <div style="font-weight:600;font-size:.85rem">${p.t}</div>
              <div style="font-size:.78rem;color:var(--text-3);margin-top:2px">${p.b}</div>
            </div>`).join('')}
        </div>

        <div style="padding:var(--sp-4);background:var(--secondary-bg);border:1px solid var(--secondary);border-radius:var(--r-md)">
          <div style="font-weight:700;font-size:.85rem;color:var(--secondary);margin-bottom:var(--sp-2)">🔔 Web Push API Status</div>
          <p style="font-size:.8rem;color:var(--text-2);margin-bottom:var(--sp-3)">
            Status: <strong>${'Notification' in window ? Notification.permission : 'Not supported'}</strong>
          </p>
          <button class="btn btn-secondary btn-sm" id="test-browser-push">Test Local Push Notification</button>
        </div>
      </div>
    </div>

    <!-- Sent Log -->
    <div class="card animate-fade-up delay-2">
      <h3 style="margin-bottom:var(--sp-4)">📋 Sent Notifications Log</h3>
      ${!notifHistory.length ? '<p style="color:var(--text-3);font-size:.88rem">No notifications sent yet.</p>' : `
        <div class="table-wrapper">
          <table>
            <thead>
              <tr><th>Time Sent</th><th>Title</th><th>Message</th><th>Type</th></tr>
            </thead>
            <tbody>
              ${notifHistory.map(n => `
                <tr>
                  <td style="font-size:.82rem">${formatDateTime(n.timestamp)}</td>
                  <td style="font-weight:600">${n.title}</td>
                  <td style="font-size:.85rem;color:var(--text-2)">${n.body}</td>
                  <td><span class="badge badge-primary">${n.type}</span></td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>`}
    </div>
  `;

  wireAdminNotifications();
}

function wireAdminNotifications() {
  document.getElementById('send-notif-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const title = document.getElementById('notif-title').value.trim();
    const body  = document.getElementById('notif-body').value.trim();
    const type  = document.getElementById('notif-type').value;

    if (!title || !body) return toast('Please fill in both title and body.', 'error');

    // Trigger browser notification if permission granted
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body, icon: '/assets/icons/icon-192.png' });
    }

    // Save to log
    const history = lsGet('hp_sent_notifications', []);
    history.unshift({ id: Date.now(), title, body, type, timestamp: new Date().toISOString() });
    lsSet('hp_sent_notifications', history);

    toast('🔔 Notification sent successfully!', 'success');
    document.getElementById('send-notif-form').reset();
    renderAdminNotifications();
  });

  document.getElementById('test-browser-push')?.addEventListener('click', async () => {
    if (!('Notification' in window)) return toast('Notifications not supported in your browser.', 'error');
    let perm = Notification.permission;
    if (perm !== 'granted') perm = await Notification.requestPermission();
    if (perm === 'granted') {
      new Notification('⚕️ HomeoPrep Test Notification', { body: 'Web Push Notifications are working perfectly!' });
      toast('✅ Test notification fired!', 'success');
    } else {
      toast('Notification permission denied by browser.', 'error');
    }
  });
}

window.fillNotifPreset = (t, b) => {
  document.getElementById('notif-title').value = t;
  document.getElementById('notif-body').value  = b;
};
