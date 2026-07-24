// app.js — Main application: router, auth, state, navigation
import { renderLogin }        from './pages/login.js';
import { renderDashboard }    from './pages/dashboard.js';
import { renderPractice }     from './pages/practice.js';
import { renderMockTest }     from './pages/mockTest.js';
import { renderResults }      from './pages/results.js';
import { renderFlashcards }   from './pages/flashcards.js';
import { renderAnalytics }    from './pages/analytics.js';
import { renderAchievements } from './pages/achievements.js';
import { renderPYQ }          from './pages/pyq.js';
import { renderSettings }     from './pages/settings.js';
import { renderPlanner }      from './pages/planner.js';
import { renderDocuments }    from './pages/documents.js';
import { initAiBot }          from './components/aiBot.js';
import { renderAdminQuestions } from './pages/admin/questions.js';
import { renderAdminFlashcards } from './pages/admin/flashcards.js';
import { renderAdminUpload }    from './pages/admin/upload.js';
import { renderAdminStudents }  from './pages/admin/students.js';
import { renderAdminNotifications } from './pages/admin/notifications.js';
import { lsGet, lsSet, getStreak, toast } from './lib/utils.js';
import { getSession, onAuthChange, signOut, fetchProfile, isConfigured, getAuthUser } from './lib/supabase.js';

// ─── App State ───────────────────────────────────────────────────────────────
let currentUser   = null;
let currentPage   = null;
let isAdmin       = false;
let adminBarVisible = false;
let authListenerRegistered = false;

// ─── Router ──────────────────────────────────────────────────────────────────
const ROUTES = {
  'dashboard':           { render: renderDashboard,          title: 'Dashboard' },
  'practice':            { render: renderPractice,           title: 'Practice' },
  'mock-test':           { render: renderMockTest,           title: 'Mock Test' },
  'results':             { render: renderResults,            title: 'Results' },
  'flashcards':          { render: renderFlashcards,         title: 'Flashcards' },
  'documents':           { render: renderDocuments,          title: 'Library & Reader' },
  'analytics':           { render: renderAnalytics,          title: 'Analytics' },
  'achievements':        { render: renderAchievements,       title: 'Achievements' },
  'pyq':                 { render: renderPYQ,                title: 'Previous Year Questions' },
  'settings':            { render: renderSettings,           title: 'Settings' },
  'planner':             { render: renderPlanner,            title: 'Study Planner' },
  'admin-questions':     { render: renderAdminQuestions,     title: 'Question Manager', adminOnly: true },
  'admin-flashcards':    { render: renderAdminFlashcards,    title: 'Flashcard Manager', adminOnly: true },
  'admin-upload':        { render: renderAdminUpload,        title: 'Document AI Extractor', adminOnly: true },
  'admin-students':      { render: renderAdminStudents,      title: 'Student Reports', adminOnly: true },
  'admin-notifications': { render: renderAdminNotifications, title: 'Notifications', adminOnly: true },
};

window.navigate = function(page, params = '') {
  const route = ROUTES[page];
  if (!route) { console.warn(`Unknown page: ${page}`); return; }
  if (route.adminOnly && !isAdmin) { toast('Admin access required.', 'error'); return; }

  currentPage = page;
  document.title = `${route.title} — HomeoPrep`;

  // Update nav active state
  document.querySelectorAll('.nav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.page === page);
  });
  document.querySelectorAll('.admin-nav-btn').forEach(el => {
    el.classList.toggle('active', el.dataset.page === page);
  });

  // Scroll to top
  document.getElementById('main-content').scrollTo(0, 0);

  // Render
  try {
    route.render(params);
  } catch (e) {
    console.error(`[Router] Error rendering ${page}:`, e);
    document.getElementById('page-container').innerHTML = `
      <div class="empty-state">
        <span class="empty-state-icon">⚠️</span>
        <h3>Something went wrong</h3>
        <p>${e.message}</p>
        <button class="btn btn-primary" style="margin-top:var(--sp-4)" onclick="window.navigate('dashboard')">Go Home</button>
      </div>`;
  }
};

// ─── Auth Flow ───────────────────────────────────────────────────────────────
async function initApp() {
  // Expose loginUser globally so login.js can call it without circular imports
  window.loginUser = loginUser;
  window.addEventListener('hp:login', (e) => {
    if (e.detail?.demo) {
      const demoUser = lsGet('hp_demo_user') || { id: 'demo-student', email: 'demo@homeoprep.app', name: 'Student', role: 'student' };
      lsSet('hp_demo_mode', true);
      lsSet('hp_demo_user', demoUser);
      showApp(demoUser);
    }
  });

  const configured = isConfigured();

  // 1. If Supabase IS configured, try to restore an active session
  if (configured) {
    try {
      const session = await getSession();
      if (session?.user) {
        await loginUser(session.user);
        setupAuthListener();
        return;
      }
    } catch (e) {
      console.warn('[App] Supabase session check error:', e);
    }
  }

  // 2. If user explicitly enabled Demo Mode previously, restore it
  const demoMode = lsGet('hp_demo_mode', false);
  const demoUser = lsGet('hp_demo_user', null);

  if (demoMode && demoUser) {
    showApp(demoUser);
  } else if (!configured) {
    // 3. Supabase not set up at all → auto Demo Mode (no sign-in possible anyway)
    const fallbackUser = { id: 'demo-student', email: 'demo@homeoprep.app', name: 'Student', role: 'student' };
    lsSet('hp_demo_mode', true);
    lsSet('hp_demo_user', fallbackUser);
    showApp(fallbackUser);
  } else {
    // 4. Supabase configured but no active session → show Sign In page
    showLoginPage();
  }

  setupAuthListener();
}

function setupAuthListener() {
  if (authListenerRegistered) return;
  authListenerRegistered = true;
  onAuthChange(async (event, session) => {
    console.log('[Auth event]', event);
    if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED') && session?.user) {
      lsSet('hp_demo_mode', false);
      await loginUser(session.user);
    } else if (event === 'SIGNED_OUT') {
      currentUser = null;
      isAdmin = false;
      lsSet('hp_demo_mode', false);
      localStorage.removeItem('hp_demo_user');
      localStorage.removeItem('hp_user_role');
      document.getElementById('sidebar')?.classList.add('hidden');
      document.getElementById('main-content')?.classList.add('hidden');
      document.getElementById('mobile-header')?.classList.add('hidden');
      document.getElementById('admin-bar')?.classList.add('hidden');
      document.body.classList.remove('admin-active');
      showLoginPage();
    }
  });
}

export async function loginUser(authUser) {
  // 1. Get fresh user data from Supabase auth server (includes latest user_metadata)
  let freshUser = null;
  try {
    freshUser = await getAuthUser();
  } catch (e) {}

  // 2. Get profile from database (has role set via Supabase dashboard)
  let profile = null;
  try {
    const { data, error } = await fetchProfile(authUser.id);
    if (error) {
      console.error('[App] Profile fetch error:', error);
    } else {
      console.log('[App] Profile fetched:', data);
    }
    profile = data;
  } catch (e) {
    console.warn('[App] Profile fetch exception:', e);
  }

  // 3. Determine role: profiles table wins (admin can set it there), then user_metadata
  const role = profile?.role
    || freshUser?.user_metadata?.role
    || authUser?.user_metadata?.role
    || 'student';

  const name = profile?.name
    || freshUser?.user_metadata?.full_name
    || authUser?.user_metadata?.full_name
    || authUser?.email?.split('@')[0]
    || 'Student';

  const user = { id: authUser.id, email: authUser.email, name, role };
  console.log('[App] Resolved user — role:', role, '| profile data:', profile);
  showApp(user);
}

function showApp(user) {
  currentUser = user;
  isAdmin     = user.role === 'admin';

  lsSet('hp_user_name', user.name);
  lsSet('hp_user_role', user.role);

  // Hide loading + login, show app
  hideLoading();
  document.getElementById('login-page').classList.add('hidden');
  document.getElementById('sidebar').classList.remove('hidden');
  document.getElementById('main-content').classList.remove('hidden');
  document.getElementById('mobile-header').classList.remove('hidden');

  // Populate sidebar user
  document.getElementById('user-name').textContent  = user.name;
  document.getElementById('user-role').textContent  = user.role.charAt(0).toUpperCase() + user.role.slice(1);
  document.getElementById('user-avatar').textContent = user.name[0]?.toUpperCase() || 'S';

  // Streak
  const streak = getStreak();
  document.getElementById('streak-count').textContent  = streak.current;
  document.getElementById('mobile-streak').textContent = streak.current;

  // Admin setup
  if (isAdmin) {
    document.getElementById('admin-bar').classList.remove('hidden');
    document.getElementById('admin-bar').style.display = '';
    document.getElementById('sidebar-admin-toggle').style.display = 'block';
    document.body.classList.add('admin-active');
    adminBarVisible = true;
  } else {
    document.getElementById('admin-bar').classList.add('hidden');
    document.getElementById('admin-bar').style.display = 'none';
    document.getElementById('sidebar-admin-toggle').style.display = 'none';
    document.body.classList.remove('admin-active');
    adminBarVisible = false;
  }

  // Wire navigation & AI Bot
  wireNavigation();
  initAiBot();

  // Navigate to dashboard
  window.navigate('dashboard');
}

function showLoginPage() {
  hideLoading();
  renderLogin();
  document.getElementById('login-page').classList.remove('hidden');
}

function hideLoading() {
  const overlay = document.getElementById('loading-overlay');
  if (!overlay) return;
  overlay.classList.add('fade-out');
  overlay.classList.add('hidden');
  overlay.style.display = 'none';
}

window.logout = async function logout() {
  // Immediately hide UI so user gets instant feedback
  currentUser = null;
  isAdmin = false;
  lsSet('hp_demo_mode', false);
  localStorage.removeItem('hp_demo_user');
  localStorage.removeItem('hp_user_role');
  document.getElementById('sidebar')?.classList.add('hidden');
  document.getElementById('main-content')?.classList.add('hidden');
  document.getElementById('mobile-header')?.classList.add('hidden');
  document.getElementById('admin-bar')?.classList.add('hidden');
  document.body.classList.remove('admin-active');
  showLoginPage();
  // Sign out from Supabase AFTER showing login page (non-blocking)
  // The onAuthChange SIGNED_OUT handler will fire but state is already cleared
  try { await signOut(); } catch (e) { console.warn('signOut error', e); }
};

// ─── Navigation Wiring ────────────────────────────────────────────────────────
function wireNavigation() {
  // Sidebar nav items
  document.querySelectorAll('.nav-item[data-page]').forEach(el => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      window.navigate(el.dataset.page);
      closeMobileSidebar();
    });
  });

  // Admin nav buttons
  document.querySelectorAll('.admin-nav-btn[data-page]').forEach(el => {
    el.addEventListener('click', () => {
      window.navigate(el.dataset.page);
    });
  });

  // Admin toggle bar
  document.getElementById('toggle-admin-bar')?.addEventListener('click', () => {
    adminBarVisible = !adminBarVisible;
    document.getElementById('admin-bar').style.display = adminBarVisible ? '' : 'none';
    document.body.classList.toggle('admin-active', adminBarVisible);
    document.getElementById('toggle-admin-bar').textContent = adminBarVisible ? 'Hide Admin Bar' : 'Show Admin Bar';
  });

  document.getElementById('sidebar-admin-toggle')?.addEventListener('click', () => {
    adminBarVisible = !adminBarVisible;
    document.getElementById('admin-bar').style.display = adminBarVisible ? '' : 'none';
    document.body.classList.toggle('admin-active', adminBarVisible);
  });

  // Mobile menu
  document.getElementById('mobile-menu-btn')?.addEventListener('click', toggleMobileSidebar);
  document.getElementById('sidebar-overlay')?.addEventListener('click', closeMobileSidebar);

  // Logout button
  document.getElementById('logout-btn')?.addEventListener('click', logout);

  // Demo login event
  window.addEventListener('hp:login', (e) => {
    if (e.detail.demo) {
      const demoUser = lsGet('hp_demo_user');
      if (demoUser) showApp(demoUser);
    }
  });
}

function toggleMobileSidebar() {
  const sidebar  = document.getElementById('sidebar');
  const overlay  = document.getElementById('sidebar-overlay');
  const isOpen   = sidebar.classList.contains('open');
  sidebar.classList.toggle('open', !isOpen);
  overlay.classList.toggle('hidden', isOpen);
}

function closeMobileSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebar-overlay').classList.add('hidden');
}

// ─── Responsive handling ──────────────────────────────────────────────────────
function handleResize() {
  const isMobile = window.innerWidth < 768;
  const sidebar  = document.getElementById('sidebar');
  if (!isMobile) {
    sidebar.classList.remove('open');
    document.getElementById('sidebar-overlay').classList.add('hidden');
  }
}

window.addEventListener('resize', handleResize);

// ─── Boot ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initApp();
});
