// login.js — Login & Self-Registration Page
import { signIn, signUp, isConfigured } from '../lib/supabase.js';
import { lsSet, toast } from '../lib/utils.js';

let activeTab = 'signin'; // 'signin' or 'signup'

export function renderLogin() {
  const container = document.getElementById('login-page');
  const configured = isConfigured();

  container.innerHTML = `
    <div class="login-left">
      <div class="login-brand animate-fade-up">
        <div class="login-brand-icon">⚕</div>
        <h1>HomeoPrep</h1>
        <p>Your AIAPGET study companion</p>
      </div>

      <div class="login-card animate-fade-up delay-1">
        <!-- Auth Tabs -->
        <div class="flex gap-2" style="margin-bottom:var(--sp-5);border-bottom:2px solid var(--border);padding-bottom:var(--sp-3)">
          <button class="btn ${activeTab==='signin'?'btn-primary':'btn-ghost'} btn-sm" id="tab-signin" style="flex:1">
            Sign In
          </button>
          <button class="btn ${activeTab==='signup'?'btn-primary':'btn-ghost'} btn-sm" id="tab-signup" style="flex:1">
            Create Account
          </button>
        </div>

        <div id="auth-form-container">
          ${renderAuthForm()}
        </div>
      </div>
    </div>

    <div class="login-right">
      <div class="login-right-content">
        <h2 class="login-right-title">Prepare smarter.<br>Score better.<br>Succeed.</h2>
        <div class="login-features">
          <div class="login-feature">
            <span class="login-feature-icon">📝</span>
            <div>
              <h4>2800+ AIAPGET Questions</h4>
              <p>Previous year questions across all 12 subjects with detailed explanations</p>
            </div>
          </div>
          <div class="login-feature">
            <span class="login-feature-icon">⏱</span>
            <div>
              <h4>Real Exam Simulation</h4>
              <p>Timed mock tests with +4/−1 marking, just like the actual exam</p>
            </div>
          </div>
          <div class="login-feature">
            <span class="login-feature-icon">🃏</span>
            <div>
              <h4>Smart Flashcards</h4>
              <p>Spaced repetition ensures you remember drug keynotes, aphorisms, and more</p>
            </div>
          </div>
          <div class="login-feature">
            <span class="login-feature-icon">📊</span>
            <div>
              <h4>Deep Analytics</h4>
              <p>Know your weak topics, track your progress, and predict your score</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  wireLoginEvents();
}

function renderAuthForm() {
  if (activeTab === 'signin') {
    return `
      <form id="login-form" class="login-form">
        <div class="form-group">
          <label class="form-label" for="login-email">Email address</label>
          <input class="form-input" type="email" id="login-email" placeholder="you@example.com" required autocomplete="email" />
        </div>
        <div class="form-group">
          <label class="form-label" for="login-password">Password</label>
          <input class="form-input" type="password" id="login-password" placeholder="••••••••" required autocomplete="current-password" />
        </div>
        <div id="login-error" style="display:none" class="form-error"></div>
        <button class="btn btn-primary w-full btn-lg" type="submit" id="login-btn">
          Sign In
        </button>
      </form>`;
  } else {
    return `
      <form id="signup-form" class="login-form">
        <div class="form-group">
          <label class="form-label" for="signup-name">Full Name</label>
          <input class="form-input" type="text" id="signup-name" placeholder="Dr. Rahul Sharma" required autocomplete="name" />
        </div>
        <div class="form-group">
          <label class="form-label" for="signup-email">Email address</label>
          <input class="form-input" type="email" id="signup-email" placeholder="you@example.com" required autocomplete="email" />
        </div>
        <div class="form-group">
          <label class="form-label" for="signup-password">Password (min 6 chars)</label>
          <input class="form-input" type="password" id="signup-password" placeholder="••••••••" minlength="6" required autocomplete="new-password" />
        </div>
        <div id="signup-error" style="display:none" class="form-error"></div>
        <div id="signup-success" style="display:none;padding:var(--sp-3);background:var(--success-bg);color:var(--success);border-radius:var(--r-sm);font-size:.85rem;margin-bottom:var(--sp-3)"></div>
        <button class="btn btn-primary w-full btn-lg" type="submit" id="signup-btn">
          Create Account
        </button>
      </form>`;
  }
}

function wireLoginEvents() {
  document.getElementById('tab-signin')?.addEventListener('click', () => {
    activeTab = 'signin';
    document.getElementById('tab-signin').className = 'btn btn-primary btn-sm';
    document.getElementById('tab-signup').className = 'btn btn-ghost btn-sm';
    document.getElementById('auth-form-container').innerHTML = renderAuthForm();
    wireFormSubmissions();
  });

  document.getElementById('tab-signup')?.addEventListener('click', () => {
    activeTab = 'signup';
    document.getElementById('tab-signup').className = 'btn btn-primary btn-sm';
    document.getElementById('tab-signin').className = 'btn btn-ghost btn-sm';
    document.getElementById('auth-form-container').innerHTML = renderAuthForm();
    wireFormSubmissions();
  });

  document.getElementById('demo-btn')?.addEventListener('click', () => {
    lsSet('hp_demo_mode', true);
    lsSet('hp_demo_user', {
      id: 'demo-student',
      email: 'demo@homeoprep.app',
      name: 'Student',
      role: 'student',
    });
    window.dispatchEvent(new CustomEvent('hp:login', { detail: { demo: true } }));
  });

  wireFormSubmissions();
}

function wireFormSubmissions() {
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = document.getElementById('login-btn');
      const errDiv = document.getElementById('login-error');
      const email    = document.getElementById('login-email').value.trim();
      const password = document.getElementById('login-password').value;

      btn.textContent = 'Signing in…';
      btn.disabled = true;
      errDiv.style.display = 'none';

      const { data, error } = await signIn(email, password);

      if (error) {
        errDiv.textContent = error.message;
        errDiv.style.display = 'block';
        btn.textContent = 'Sign In';
        btn.disabled = false;
      } else if (data?.user) {
        lsSet('hp_demo_mode', false);
        toast('🎉 Signed in successfully!', 'success');
      }
    });
  }

  const signupForm = document.getElementById('signup-form');
  if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = document.getElementById('signup-btn');
      const errDiv = document.getElementById('signup-error');
      const succDiv = document.getElementById('signup-success');
      const name     = document.getElementById('signup-name').value.trim();
      const email    = document.getElementById('signup-email').value.trim();
      const password = document.getElementById('signup-password').value;

      btn.textContent = 'Creating Account…';
      btn.disabled = true;
      errDiv.style.display = 'none';
      succDiv.style.display = 'none';

      const { data, error } = await signUp(email, password, name);

      if (error) {
        errDiv.textContent = error.message;
        errDiv.style.display = 'block';
        btn.textContent = 'Create Account';
        btn.disabled = false;
      } else if (data?.user) {
        succDiv.textContent = '✅ Account created! If email confirmation is enabled on your Supabase project, check your inbox. You can now sign in.';
        succDiv.style.display = 'block';
        btn.textContent = 'Account Created';
        toast('Account created! Please sign in.', 'success', 5000);
      }
    });
  }
}
