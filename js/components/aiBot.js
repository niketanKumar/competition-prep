// aiBot.js — Global Context-Aware AI Study Assistant Drawer with Key Transparency
import { askAiAssistant, isAiConfigured } from '../lib/ai.js';
import { esc, toast } from '../lib/utils.js';

let botDrawerOpen = false;

export function initAiBot() {
  if (document.getElementById('ai-bot-drawer')) return;

  const html = `
    <!-- Floating AI Bot Trigger Button -->
    <button class="ai-bot-trigger animate-bounce" id="ai-bot-btn" title="Open AI Study Assistant">
      <span class="ai-bot-icon">🤖</span>
      <span class="ai-bot-label">AI Tutor</span>
    </button>

    <!-- Slide-out AI Assistant Drawer -->
    <div class="ai-drawer-overlay hidden" id="ai-drawer-overlay"></div>
    <div class="ai-drawer hidden" id="ai-bot-drawer">
      <div class="ai-drawer-header">
        <div style="display:flex;align-items:center;gap:var(--sp-3)">
          <div class="ai-avatar">🤖</div>
          <div>
            <h3 style="font-size:1.05rem;font-family:var(--font-serif)">HomeoPrep AI Tutor</h3>
            <span style="font-size:.72rem;color:var(--text-3)">Context-Aware Homoeopathy Assistant</span>
          </div>
        </div>
        <button class="btn btn-ghost btn-icon" id="close-ai-drawer">✕</button>
      </div>

      <!-- Current Context Indicator -->
      <div class="ai-context-pill" id="ai-context-indicator">
        📍 Context: <span id="ai-context-name">General Chat</span>
      </div>

      <!-- Chat History -->
      <div class="ai-chat-messages" id="ai-chat-messages">
        <div class="ai-message bot">
          👋 Hello! I am your AI Homoeopathy Tutor. Ask me anything about Materia Medica keynotes, Organon aphorisms, Repertory rubrics, or any question on your screen!
        </div>
      </div>

      <!-- Chat Input Area -->
      <div class="ai-chat-input-area">
        ${!isAiConfigured() ? `
          <div style="font-size:.8rem;color:var(--amber);text-align:center;padding:var(--sp-2)">
            ⚠️ Gemini/Groq API Key required. <a href="#" onclick="window.navigate('settings')" style="color:var(--primary);text-decoration:underline">Add key in Settings</a>
          </div>
        ` : ''}
        <div style="display:flex;gap:var(--sp-2)">
          <textarea class="form-input" id="ai-chat-input" rows="2" placeholder="Ask AI a question about this page, drug, or aphorism..." style="resize:none"></textarea>
          <button class="btn btn-primary" id="ai-send-btn" style="align-self:flex-end;padding:var(--sp-3) var(--sp-4)" ${!isAiConfigured() ? 'disabled' : ''}>
            Send
          </button>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', html);
  wireAiBot();
}

function wireAiBot() {
  const btn     = document.getElementById('ai-bot-btn');
  const drawer  = document.getElementById('ai-bot-drawer');
  const overlay = document.getElementById('ai-drawer-overlay');
  const close   = document.getElementById('close-ai-drawer');
  const send    = document.getElementById('ai-send-btn');
  const input   = document.getElementById('ai-chat-input');

  const toggle = () => {
    botDrawerOpen = !botDrawerOpen;
    drawer.classList.toggle('hidden', !botDrawerOpen);
    overlay.classList.toggle('hidden', !botDrawerOpen);
    if (botDrawerOpen) {
      updateBotContext();
      input.focus();
    }
  };

  btn?.addEventListener('click', toggle);
  close?.addEventListener('click', toggle);
  overlay?.addEventListener('click', toggle);

  const sendMessage = async () => {
    const text = input.value.trim();
    if (!text) return;

    if (!isAiConfigured()) {
      toast('Please configure a Gemini or Groq API Key in Settings first.', 'error');
      return;
    }

    // Append user message
    appendMessage(text, 'user');
    input.value = '';
    send.disabled = true;
    send.textContent = '⏳';

    // Get live screen context
    const contextText = getLiveScreenContext();

    try {
      const res = await askAiAssistant(text, contextText);
      const textVal  = typeof res === 'string' ? res : res.text;
      const badgeVal = res?.badge || null;
      appendMessage(textVal, 'bot', badgeVal);
    } catch (e) {
      appendMessage('⚠️ Error: ' + e.message, 'bot error');
    }

    send.disabled = false;
    send.textContent = 'Send';
  };

  send?.addEventListener('click', sendMessage);
  input?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });
}

function appendMessage(text, type, badgeText = null) {
  const container = document.getElementById('ai-chat-messages');
  if (!container) return;

  const div = document.createElement('div');
  div.className = `ai-message ${type}`;

  let formatted = esc(text)
    .replace(/\n/g, '<br>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

  if (badgeText) {
    formatted += `<div style="margin-top:var(--sp-2);padding-top:var(--sp-2);border-top:1px dashed rgba(0,0,0,0.1);font-size:.7rem;color:var(--text-3);font-family:monospace">${esc(badgeText)}</div>`;
  }

  div.innerHTML = formatted;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}

function updateBotContext() {
  const label = document.getElementById('ai-context-name');
  if (!label) return;

  if (window.activeDocumentContext?.title) {
    label.textContent = `Book: ${window.activeDocumentContext.title}`;
  } else {
    const title = document.title.split('—')[0]?.trim() || 'HomeoPrep';
    label.textContent = title;
  }
}

function getLiveScreenContext() {
  const title = document.title;
  let ctx = `Current Page/Screen: ${title}`;

  if (window.activeDocumentContext) {
    const doc = window.activeDocumentContext;
    ctx += `\n\n[CRITICAL DOCUMENT CONTEXT]\nTitle: "${doc.title}"\nAuthor: ${doc.author}\nSubject: ${doc.subject}\nType: ${doc.type}`;
    if (doc.text) ctx += `\nExcerpt: ${doc.text.substring(0, 1000)}`;
  }

  const questionText = document.querySelector('.question-text')?.textContent;
  if (questionText) ctx += `\n\n[ACTIVE MCQ QUESTION ON SCREEN]: ${questionText}`;

  return ctx;
}
