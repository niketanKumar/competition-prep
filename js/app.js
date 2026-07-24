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
import { getSession, onAuthChange, signOut, fetchProfile, isConfigured } from './lib/supabase.js';

// ─── App State ───────────────────────────────────────────────────────────────
let currentUser   = null;
let currentPage   = null;
let isAdmin       = false;
let adminBarVisible = false;

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
  window.addEventListener('hp:login', (e) => {
    if (e.detail?.demo) {
      const demoUser = lsGet('hp_demo_user');
      if (demoUser) showApp(demoUser);
    }
  });

  // If Supabase is not configured yet, auto-enable Demo Mode for fresh visitors
  if (!isConfigured()) {
    if (!lsGet('hp_demo_user')) {
      lsSet('hp_demo_mode', true);
      lsSet('hp_demo_user', {
        id: 'demo-student',
        email: 'demo@homeoprep.app',
        name: 'Student',
        role: 'student',
      });
    }
  }

  const demoMode = lsGet('hp_demo_mode', !isConfigured());
  let demoUser   = lsGet('hp_demo_user', null);

  if (!demoUser && demoMode) {
    demoUser = { id: 'demo-student', email: 'demo@homeoprep.app', name: 'Student', role: 'student' };
    lsSet('hp_demo_user', demoUser);
  }

  // 1. If Supabase is configured and user is NOT explicitly in demo mode, try Supabase session
  if (isConfigured() && !demoMode) {
    try {
      const sessionPromise = getSession();
      const timeoutPromise = new Promise(resolve => setTimeout(() => resolve(null), 1500));
      const session = await Promise.race([sessionPromise, timeoutPromise]);
      if (session?.user) {
        await loginUser(session.user);
        setupAuthListener();
        return;
      }
    } catch (e) {
      console.warn('[App] Supabase session check error:', e);
    }
  }

  // 2. If demo mode or demo user exists
  if (demoMode || demoUser) {
    showApp(demoUser || { id: 'demo-student', email: 'demo@homeoprep.app', name: 'Student', role: 'student' });
  } else {
    showLoginPage();
  }

  setupAuthListener();
}

function setupAuthListener() {
  onAuthChange(async (event, session) => {
    if (event === 'SIGNED_IN' && session?.user) {
      lsSet('hp_demo_mode', false);
      await loginUser(session.user);
    } else if (event === 'SIGNED_OUT') {
      logout();
    }
  });
}

async function loginUser(authUser) {
  let profile = null;
  try {
    const { data } = await fetchProfile(authUser.id);
    profile = data;
  } catch (e) {
    console.warn('[App] Profile fetch warning:', e);
  }

  const user = {
    id:    authUser.id,
    email: authUser.email,
    name:  profile?.name || authUser.user_metadata?.full_name || authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'Student',
    role:  profile?.role || authUser.user_metadata?.role || 'student',
  };

  showApp(user);
}

function showApp(user) {
  currentUser = user;
  isAdmin     = user.role === 'admin';

  // Hide loading + login, show app
  hideLoading();
  document.getElementById('login-page').classList.add('hidden');
  document.getElementById('sidebar').classList.remove('hidden');
  document.getElementById('main-content').classList.remove('hidden');
  document.getElementById('mobile-header').classList.remove('hidden');

  // Populate sidebar user
  document.getElementById('user-name').textContent  = user.name;
  document.getElementById('user-role').textContent  = user.role;
  document.getElementById('user-avatar').textContent = user.name[0]?.toUpperCase() || 'S';

  // Streak
  const streak = getStreak();
  document.getElementById('streak-count').textContent  = streak.current;
  document.getElementById('mobile-streak').textContent = streak.current;

  // Admin setup
  if (isAdmin) {
    document.getElementById('admin-bar').classList.remove('hidden');
    document.getElementById('sidebar-admin-toggle').style.display = 'block';
    document.body.classList.add('admin-active');
    adminBarVisible = true;
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

function logout() {
  signOut();
  currentUser = null;
  isAdmin     = false;
  lsSet('hp_demo_mode', false);
  document.getElementById('sidebar').classList.add('hidden');
  document.getElementById('main-content').classList.add('hidden');
  document.getElementById('mobile-header').classList.add('hidden');
  document.getElementById('admin-bar').classList.add('hidden');
  document.body.classList.remove('admin-active');
  showLoginPage();
}

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
