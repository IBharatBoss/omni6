// src/ui/chat-copilot.js
import { bus } from '../core/bus.js';
import { askCopilot, isCopilotAvailable } from '../services/ai-copilot.js';
import { lockBackgroundScroll, unlockBackgroundScroll } from '../core/scroll-lock.js';

/**
 * Mobile-Responsive AI Copilot Modal Overlay Component
 * Ensures top header with close button is always visible, background scroll is 100% locked,
 * and closes exclusively via the cut (✕) button.
 */
export function initChatCopilot() {
  const overlay = document.getElementById('chat-overlay');
  const drawer = document.getElementById('chat-drawer');
  const closeBtn = document.getElementById('close-chat');
  const messages = document.getElementById('chat-messages');
  const statusEl = document.querySelector('.ai-status');
  const input = document.getElementById('chat-user-input');
  const sendBtn = document.getElementById('chat-send-btn');

  function open() {
    if (!overlay) return;
    overlay.classList.remove('hidden');
    lockBackgroundScroll();
    updateStatus();

    // Initial greeting if empty
    if (messages && messages.children.length === 0) {
      appendMessage('Hello! I am your OmniTools AI Copilot. How can I help you transform your files today?', 'ai');
    }

    if (input) {
      setTimeout(() => input.focus(), 80);
    }
  }

  function close() {
    if (overlay && !overlay.classList.contains('hidden')) {
      overlay.classList.add('hidden');
      unlockBackgroundScroll();
    }
  }

  function toggle() {
    if (overlay?.classList.contains('hidden')) {
      open();
    } else {
      close();
    }
  }

  // Exclusive close via cut (✕) button or escape key
  if (closeBtn) {
    closeBtn.addEventListener('click', close);
  }

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay && !overlay.classList.contains('hidden')) {
      close();
    }
  });

  // Event bus bindings
  bus.on('chat:open', open);
  bus.on('chat:toggle', toggle);
  bus.on('chat:close', close);

  // Send message handler (Always renders user input immediately)
  const handleSend = async () => {
    if (!input) return;
    const text = input.value.trim();
    if (!text) return;
    
    // Clear input
    input.value = '';
    
    // 1. Immediately render User Input in the chat list
    appendMessage(text, 'user');

    // 2. Call AI Copilot to generate output
    await askCopilot(text);
  };

  if (sendBtn) sendBtn.addEventListener('click', handleSend);
  if (input) {
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handleSend();
    });
  }

  bus.on('ai:message', (msg) => {
    appendMessage(msg.text, msg.role);
    if (msg.intent && msg.intent.type === 'INTENT_ACTION' && msg.intent.toolId) {
      console.log('[AI Copilot] Deterministic routing to:', msg.intent.toolId);
      setTimeout(() => {
        close();
        bus.emit('route:navigate', msg.intent.toolId);
      }, 700);
    }
  });

  function appendMessage(text, role) {
    if (!messages) return;
    const el = document.createElement('div');
    el.className = `chat-msg ${role} animate-fade-in`;
    el.textContent = text;
    messages.appendChild(el);
    
    // Smooth auto-scroll to bottom
    setTimeout(() => {
      messages.scrollTop = messages.scrollHeight;
    }, 20);
  }

  function updateStatus() {
    if (!statusEl) return;
    if (isCopilotAvailable()) {
      statusEl.classList.remove('offline');
      statusEl.title = 'AI Copilot Online (Gemini)';
    } else {
      statusEl.classList.add('offline');
      statusEl.title = 'AI Copilot Local Engine';
    }
  }

  bus.on('ai:status', updateStatus);

  // Visual Viewport Keyboard Handler for Mobile
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', () => {
      if (overlay && !overlay.classList.contains('hidden') && drawer) {
        if (messages) messages.scrollTop = messages.scrollHeight;
      }
    });
  }
}
