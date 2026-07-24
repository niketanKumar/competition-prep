// settings.js — Settings page with Groq, Gemini, Explanation Caching, Exam date, Profile
import { lsGet, lsSet, toast } from '../lib/utils.js';
import { isConfigured } from '../lib/supabase.js';

export function renderSettings() {
  const examDate   = lsGet('hp_exam_date', '');
  const userName   = lsGet('hp_user_name', 'Student');
  const geminiKeys = JSON.parse(localStorage.getItem('hp_ai_keys') || '[]');
  const groqKeys   = JSON.parse(localStorage.getItem('hp_groq_keys') || '[]');
  const provider   = localStorage.getItem('hp_ai_provider') || 'auto';
  const notifTime  = lsGet('hp_notif_time', '08:00');
  const sbUrl      = lsGet('hp_supabase_url', '') || localStorage.getItem('hp_supabase_url') || '';
  const sbKey      = lsGet('hp_supabase_anon_key', '') || localStorage.getItem('hp_supabase_anon_key') || '';

  const cacheObj   = JSON.parse(localStorage.getItem('hp_ai_exp_cache') || '{}');
  const cacheCount = Object.keys(cacheObj).length;

  document.getElementById('page-container').innerHTML = `
    <div class="page-header">
      <h1 class="page-title animate-fade-up">⚙️ Settings</h1>
      <p class="page-subtitle animate-fade-up delay-1">Configure study preferences, free AI providers, and cloud sync</p>
    </div>

    <div style="display:flex;flex-direction:column;gap:var(--sp-6);max-width:700px">

      <!-- Role Switcher -->
      <div class="card animate-fade-up delay-1" style="border-left:4px solid var(--amber)">
        <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:var(--sp-4)">
          <div>
            <h3>👑 Switch Role (Demo Mode)</h3>
            <p style="font-size:.85rem;color:var(--text-3);margin-top:4px">
              Currently logged in as: <strong style="color:var(--primary);text-transform:capitalize" id="current-role-badge">${lsGet('hp_user_role', 'student')}</strong>
            </p>
          </div>
          <div class="flex gap-2">
            <button class="btn ${lsGet('hp_user_role','student')==='student'?'btn-primary':'btn-outline'} btn-sm" id="role-btn-student">
              👨‍🎓 Student Role
            </button>
            <button class="btn ${lsGet('hp_user_role','student')==='admin'?'btn-primary':'btn-outline'} btn-sm" id="role-btn-admin">
              ⚡ Admin Role
            </button>
          </div>
        </div>
        <p style="font-size:.78rem;color:var(--text-3);margin-top:var(--sp-3)">
          Admin role shows the Admin Bar at the top of the app, letting you manage questions, upload PDFs, and manage flashcards.
        </p>
      </div>

      <!-- Profile -->
      <div class="card animate-fade-up delay-1">
        <h3 style="margin-bottom:var(--sp-5)">👤 Profile</h3>
        <div style="display:flex;flex-direction:column;gap:var(--sp-4)">
          <div class="form-group">
            <label class="form-label">Your Name (shown in dashboard greeting)</label>
            <input class="form-input" type="text" id="s-name" value="${userName}" placeholder="Your name" />
          </div>
          <button class="btn btn-primary btn-sm" id="save-profile">Save Profile</button>
        </div>
      </div>

      <!-- Option 3 & 4: AI Provider & Caching Configuration -->
      <div class="card animate-fade-up delay-2">
        <h3 style="margin-bottom:var(--sp-2)">🤖 Free AI Engine & Token Optimization</h3>
        <p style="font-size:.85rem;color:var(--text-3);margin-bottom:var(--sp-5)">
          Configure zero-cost AI providers and smart explanation caching to save 100% of your token quota.
        </p>

        <!-- Preferred Provider Selector -->
        <div class="form-group" style="margin-bottom:var(--sp-5)">
          <label class="form-label">Preferred AI Engine</label>
          <select class="form-select" id="s-ai-provider">
            <option value="auto" ${provider==='auto'?'selected':''}>🚀 Auto-Fallback (Try Gemini ➔ Failover to Groq)</option>
            <option value="groq" ${provider==='groq'?'selected':''}>⚡ Groq Free API (14,400 Free Requests / Day — Fast)</option>
            <option value="gemini" ${provider==='gemini'?'selected':''}>🌐 Google Gemini API (1,000 Free Requests / Day)</option>
          </select>
        </div>

        <!-- Groq API Key Section -->
        <div style="padding:var(--sp-4);background:var(--bg);border:1px solid var(--border);border-radius:var(--r-md);margin-bottom:var(--sp-5)">
          <div style="font-weight:700;font-size:.9rem;color:var(--primary);margin-bottom:4px">
            ⚡ Groq Free API Keys (14,400 Req/Day)
          </div>
          <p style="font-size:.8rem;color:var(--text-3);margin-bottom:var(--sp-3)">
            Get a free key at <a href="https://console.groq.com" target="_blank" style="color:var(--primary);text-decoration:underline">console.groq.com</a> (No credit card needed).
          </p>
          <div id="groq-keys-list" style="margin-bottom:var(--sp-3)">
            ${renderGroqKeyList(groqKeys)}
          </div>
          <div style="display:flex;gap:var(--sp-2)">
            <input class="form-input" type="text" id="new-groq-key" placeholder="gsk_..." style="font-family:monospace;font-size:.85rem" />
            <button class="btn btn-primary btn-sm" id="add-groq-key">Add Groq Key</button>
          </div>
        </div>

        <!-- Gemini API Key Section -->
        <div style="padding:var(--sp-4);background:var(--bg);border:1px solid var(--border);border-radius:var(--r-md);margin-bottom:var(--sp-5)">
          <div style="font-weight:700;font-size:.9rem;color:var(--text);margin-bottom:4px">
            🌐 Google Gemini API Keys (1,000 Req/Day)
          </div>
          <p style="font-size:.8rem;color:var(--text-3);margin-bottom:var(--sp-3)">
            Get a free key at <a href="https://aistudio.google.com" target="_blank" style="color:var(--primary);text-decoration:underline">aistudio.google.com</a>.
          </p>
          <div id="ai-keys-list" style="margin-bottom:var(--sp-3)">
            ${renderApiKeyList(geminiKeys)}
          </div>
          <div style="display:flex;gap:var(--sp-2)">
            <input class="form-input" type="text" id="new-api-key" placeholder="AIzaSy..." style="font-family:monospace;font-size:.85rem" />
            <button class="btn btn-secondary btn-sm" id="add-api-key">Add Gemini Key</button>
          </div>
        </div>

        <!-- Option 4: Smart Cache Banner -->
        <div style="padding:var(--sp-4);background:var(--success-bg);border:1px solid var(--success);border-radius:var(--r-md);display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:var(--sp-3)">
          <div>
            <div style="font-weight:700;font-size:.85rem;color:var(--success)">🎯 Option 4: Smart Explanation Cache Active</div>
            <div style="font-size:.8rem;color:var(--text-2);margin-top:2px">
              <strong>${cacheCount}</strong> question explanations cached locally. (Saved API tokens for repeat questions).
            </div>
          </div>
          <button class="btn btn-outline btn-sm" id="clear-exp-cache" style="color:var(--error);border-color:var(--error)">Clear Cache</button>
        </div>
      </div>

      <!-- Exam Date -->
      <div class="card animate-fade-up delay-2">
        <h3 style="margin-bottom:var(--sp-5)">📅 Exam Date</h3>
        <div class="form-group" style="margin-bottom:var(--sp-4)">
          <label class="form-label">AIAPGET Exam Date</label>
          <input class="form-input" type="date" id="s-exam-date" value="${examDate}" />
          <span class="form-hint">Used for the countdown timer and study plan generation.</span>
        </div>
        <button class="btn btn-primary btn-sm" id="save-exam-date">Save Exam Date</button>
      </div>

      <!-- Supabase Configuration -->
      <div class="card animate-fade-up delay-3">
        <h3 style="margin-bottom:var(--sp-2)">🗄️ Supabase Backend</h3>
        <p style="font-size:.85rem;color:var(--text-3);margin-bottom:var(--sp-5)">
          Connect to Supabase to sync your progress across devices. Create a free project at
          <a href="https://supabase.com" target="_blank" style="color:var(--primary)">supabase.com</a>
        </p>
        ${isConfigured() ? `<div style="padding:var(--sp-3);background:var(--success-bg);border:1px solid var(--success);border-radius:var(--r-md);margin-bottom:var(--sp-4);font-size:.85rem;color:var(--success)">
          ✅ Connected to Supabase
        </div>` : `<div style="padding:var(--sp-3);background:var(--amber-bg);border:1px solid var(--amber);border-radius:var(--r-md);margin-bottom:var(--sp-4);font-size:.85rem;color:var(--amber)">
          ⚠️ Running in offline/demo mode. Set up Supabase for multi-device sync.
        </div>`}
        <div style="display:flex;flex-direction:column;gap:var(--sp-4)">
          <div class="form-group">
            <label class="form-label">Supabase Project URL</label>
            <input class="form-input" type="text" id="s-sb-url" value="${sbUrl}" placeholder="https://xxxx.supabase.co" />
          </div>
          <div class="form-group">
            <label class="form-label">Supabase Anon Key</label>
            <input class="form-input" type="password" id="s-sb-key" value="${sbKey}" placeholder="eyJhbGciO..." />
          </div>
          <button class="btn btn-primary btn-sm" id="save-supabase">Save & Reconnect</button>
        </div>
      </div>

      <!-- Danger Zone -->
      <div class="card animate-fade-up delay-4" style="border-color:var(--error)">
        <h3 style="margin-bottom:var(--sp-3);color:var(--error)">⚠️ Danger Zone</h3>
        <p style="font-size:.85rem;color:var(--text-3);margin-bottom:var(--sp-4)">These actions cannot be undone.</p>
        <div style="display:flex;gap:var(--sp-3);flex-wrap:wrap">
          <button class="btn btn-danger btn-sm" id="clear-progress">🗑️ Clear All Progress</button>
          <button class="btn btn-ghost btn-sm" id="export-data">📥 Export My Data</button>
        </div>
      </div>
    </div>
  `;

  wireSettings();
}

function renderApiKeyList(keys) {
  if (!keys.length) return `<p style="font-size:.8rem;color:var(--text-3);font-style:italic">No Gemini keys added yet.</p>`;
  return keys.map((k, i) => `
    <div style="display:flex;align-items:center;gap:var(--sp-3);padding:var(--sp-2) var(--sp-3);background:white;border-radius:var(--r-sm);margin-bottom:4px;border:1px solid var(--border)">
      <span style="font-family:monospace;font-size:.8rem;flex:1">Key ${i+1}: ${k.slice(0,10)}...${k.slice(-4)}</span>
      <button class="btn btn-danger btn-sm" style="padding:1px 6px;font-size:.7rem" onclick="removeApiKey(${i})">Remove</button>
    </div>`).join('');
}

function renderGroqKeyList(keys) {
  if (!keys.length) return `<p style="font-size:.8rem;color:var(--text-3);font-style:italic">No Groq keys added yet.</p>`;
  return keys.map((k, i) => `
    <div style="display:flex;align-items:center;gap:var(--sp-3);padding:var(--sp-2) var(--sp-3);background:white;border-radius:var(--r-sm);margin-bottom:4px;border:1px solid var(--border)">
      <span style="font-family:monospace;font-size:.8rem;flex:1">Groq Key ${i+1}: ${k.slice(0,10)}...${k.slice(-4)}</span>
      <button class="btn btn-danger btn-sm" style="padding:1px 6px;font-size:.7rem" onclick="removeGroqKey(${i})">Remove</button>
    </div>`).join('');
}

function wireSettings() {
  document.getElementById('role-btn-student')?.addEventListener('click', () => {
    lsSet('hp_user_role', 'student');
    lsSet('hp_demo_mode', true);
    const demoUser = lsGet('hp_demo_user', { name: 'Student', role: 'student', email: 'student@homeoprep.com' });
    demoUser.role = 'student';
    lsSet('hp_demo_user', demoUser);
    toast('Switched to Student role! Reloading...', 'success');
    setTimeout(() => location.reload(), 400);
  });

  document.getElementById('role-btn-admin')?.addEventListener('click', () => {
    lsSet('hp_user_role', 'admin');
    lsSet('hp_demo_mode', true);
    const demoUser = lsGet('hp_demo_user', { name: 'Dr. Admin', role: 'admin', email: 'admin@homeoprep.com' });
    demoUser.role = 'admin';
    lsSet('hp_demo_user', demoUser);
    toast('⚡ Switched to Admin role! Reloading...', 'success');
    setTimeout(() => location.reload(), 400);
  });

  document.getElementById('s-ai-provider')?.addEventListener('change', (e) => {
    localStorage.setItem('hp_ai_provider', e.target.value);
    toast(`AI Provider set to: ${e.target.value.toUpperCase()}`, 'success');
  });

  document.getElementById('add-groq-key')?.addEventListener('click', () => {
    const key = document.getElementById('new-groq-key').value.trim();
    if (!key || key.length < 15) return toast('Please enter a valid Groq API key.', 'error');
    const keys = JSON.parse(localStorage.getItem('hp_groq_keys') || '[]');
    if (keys.includes(key)) return toast('Key already added.', 'warning');
    keys.push(key);
    localStorage.setItem('hp_groq_keys', JSON.stringify(keys));
    document.getElementById('new-groq-key').value = '';
    document.getElementById('groq-keys-list').innerHTML = renderGroqKeyList(keys);
    toast('⚡ Groq API key added! (14,400 free requests/day)', 'success');
  });

  document.getElementById('add-api-key')?.addEventListener('click', () => {
    const key = document.getElementById('new-api-key').value.trim();
    if (!key || key.length < 15) return toast('Please enter a valid Gemini API key.', 'error');
    const keys = JSON.parse(localStorage.getItem('hp_ai_keys') || '[]');
    if (keys.includes(key)) return toast('Key already added.', 'warning');
    keys.push(key);
    localStorage.setItem('hp_ai_keys', JSON.stringify(keys));
    document.getElementById('new-api-key').value = '';
    document.getElementById('ai-keys-list').innerHTML = renderApiKeyList(keys);
    toast('✅ Gemini API key added!', 'success');
  });

  document.getElementById('clear-exp-cache')?.addEventListener('click', () => {
    localStorage.removeItem('hp_ai_exp_cache');
    toast('Smart Explanation Cache cleared.', 'default');
    renderSettings();
  });

  document.getElementById('save-profile')?.addEventListener('click', () => {
    const name = document.getElementById('s-name').value.trim();
    if (!name) return toast('Please enter your name.', 'error');
    lsSet('hp_user_name', name);
    document.getElementById('user-name').textContent = name;
    toast('✅ Profile saved!', 'success');
  });

  document.getElementById('save-exam-date')?.addEventListener('click', () => {
    const date = document.getElementById('s-exam-date').value;
    if (!date) return toast('Please select a date.', 'error');
    lsSet('hp_exam_date', date);
    toast('✅ Exam date saved!', 'success');
  });

  document.getElementById('save-supabase')?.addEventListener('click', () => {
    const url = document.getElementById('s-sb-url').value.trim();
    const key = document.getElementById('s-sb-key').value.trim();
    if (!url || !key) return toast('Please enter both URL and key.', 'error');
    localStorage.setItem('hp_supabase_url', url);
    localStorage.setItem('hp_supabase_anon_key', key);
    toast('✅ Supabase config saved! Reload the page to reconnect.', 'success', 5000);
  });

  document.getElementById('export-data')?.addEventListener('click', exportData);

  document.getElementById('clear-progress')?.addEventListener('click', () => {
    if (!confirm('Are you sure? This will erase ALL your progress, scores, and streaks. This cannot be undone.')) return;
    ['hp_stats','hp_streak','hp_test_history','hp_flashcard_states','hp_bookmarks','hp_today_done','hp_subject_progress','hp_active_test']
      .forEach(k => localStorage.removeItem(k));
    toast('All progress cleared.', 'default');
    window.navigate('dashboard');
  });
}

function exportData() {
  const data = {
    exportDate: new Date().toISOString(),
    profile: { name: lsGet('hp_user_name', 'Student'), examDate: lsGet('hp_exam_date', null) },
    stats: lsGet('hp_stats', {}),
    streak: lsGet('hp_streak', {}),
    testHistory: lsGet('hp_test_history', []),
    flashcardStates: lsGet('hp_flashcard_states', {}),
    bookmarks: lsGet('hp_bookmarks', []),
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = `homeoprep-data-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
  toast('📥 Data exported!', 'success');
}

window.removeApiKey = function(idx) {
  const keys = JSON.parse(localStorage.getItem('hp_ai_keys') || '[]');
  keys.splice(idx, 1);
  localStorage.setItem('hp_ai_keys', JSON.stringify(keys));
  document.getElementById('ai-keys-list').innerHTML = renderApiKeyList(keys);
  toast('Gemini API key removed.', 'default');
};

window.removeGroqKey = function(idx) {
  const keys = JSON.parse(localStorage.getItem('hp_groq_keys') || '[]');
  keys.splice(idx, 1);
  localStorage.setItem('hp_groq_keys', JSON.stringify(keys));
  document.getElementById('groq-keys-list').innerHTML = renderGroqKeyList(keys);
  toast('Groq API key removed.', 'default');
};
