export function AIChatbot() {
  const container = document.createElement('div');
  container.className = 'shaz-ai-chatbot';
  container.innerHTML = `
    <style>
      .shaz-ai-trigger {
        position: fixed;
        bottom: 2rem;
        right: 2rem;
        background: #1a120f;
        color: #d4af37;
        border: 1px solid #d4af37;
        padding: 0.8rem 1.2rem;
        border-radius: 30px;
        cursor: pointer;
        font-family: inherit;
        font-weight: 500;
        box-shadow: 0 4px 20px rgba(0,0,0,0.5);
        z-index: 9999;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        transition: all 0.3s ease;
      }
      .shaz-ai-trigger:hover {
        background: #d4af37;
        color: #0d0d0d;
      }
      .shaz-ai-modal {
        position: fixed;
        bottom: 5rem;
        right: 2rem;
        width: 360px;
        max-width: 90vw;
        height: 480px;
        background: #0d0d0d;
        border: 1px solid #1a120f;
        border-radius: 12px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.8);
        display: flex;
        flex-direction: column;
        z-index: 10000;
        display: none;
        overflow: hidden;
        color: #f3f3f3;
        font-family: inherit;
      }
      .shaz-ai-modal.open {
        display: flex;
      }
      .shaz-ai-header {
        background: #1a120f;
        padding: 1rem;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px solid #33221a;
      }
      .shaz-ai-header h3 {
        margin: 0;
        font-size: 1rem;
        color: #d4af37;
      }
      .shaz-ai-close {
        background: none;
        border: none;
        color: #d4af37;
        font-size: 1.2rem;
        cursor: pointer;
      }
      .shaz-ai-messages {
        flex: 1;
        padding: 1rem;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 0.8rem;
        font-size: 0.9rem;
      }
      .shaz-msg {
        padding: 0.6rem 0.9rem;
        border-radius: 8px;
        max-width: 85%;
        line-height: 1.4;
      }
      .shaz-msg.bot {
        background: #1a120f;
        align-self: flex-start;
        border-left: 2px solid #d4af37;
      }
      .shaz-msg.user {
        background: #d4af37;
        color: #0d0d0d;
        align-self: flex-end;
      }
      .shaz-ai-input-area {
        padding: 0.8rem;
        background: #1a120f;
        display: flex;
        gap: 0.5rem;
        border-top: 1px solid #33221a;
      }
      .shaz-ai-input-area input {
        flex: 1;
        background: #0d0d0d;
        border: 1px solid #33221a;
        padding: 0.6rem;
        color: #fff;
        border-radius: 6px;
        outline: none;
      }
      .shaz-ai-input-area button {
        background: #d4af37;
        color: #0d0d0d;
        border: none;
        padding: 0 1rem;
        border-radius: 6px;
        font-weight: 600;
        cursor: pointer;
      }
    </style>

    <button class="shaz-ai-trigger" id="ai-trigger">
      <span>✨ ShaZ AI Concierge</span>
    </button>

    <div class="shaz-ai-modal" id="ai-modal">
      <div class="shaz-ai-header">
        <h3>ShaZ AI Concierge & Style Advisor</h3>
        <button class="shaz-ai-close" id="ai-close">&times;</button>
      </div>
      <div class="shaz-ai-messages" id="ai-messages">
        <div class="shaz-msg bot">Welcome to ShaZ Nest! I am your personal style concierge. Ask me about our pure silk hijabs, matching recommendations, or your 5-stamp loyalty rewards.</div>
      </div>
      <div class="shaz-ai-input-area">
        <input type="text" id="ai-input" placeholder="Ask about hijabs, styling, or orders..." />
        <button id="ai-send">Send</button>
      </div>
    </div>
  `;

  const trigger = container.querySelector('#ai-trigger');
  const modal = container.querySelector('#ai-modal');
  const closeBtn = container.querySelector('#ai-close');
  const sendBtn = container.querySelector('#ai-send');
  const input = container.querySelector('#ai-input');
  const messages = container.querySelector('#ai-messages');

  trigger.addEventListener('click', () => modal.classList.toggle('open'));
  closeBtn.addEventListener('click', () => modal.classList.remove('open'));

  const appendMessage = (text, sender) => {
    const msg = document.createElement('div');
    msg.className = `shaz-msg ${sender}`;
    msg.textContent = text;
    messages.appendChild(msg);
    messages.scrollTop = messages.scrollHeight;
  };

  const handleUserQuery = (query) => {
    const q = query.toLowerCase();
    appendMessage(query, 'user');
    input.value = '';

    setTimeout(() => {
      let reply = "I'm your ShaZ AI Concierge. I can help you find pure silk hijabs, check your 5-stamp loyalty card, or recommend styling colors. What would you like to explore?";
      
      if (q.includes('silk') || q.includes('hijab')) {
        reply = "Our pure silk hijabs (like the Midnight Onyx and Champagne Silk Shimmer) are lightweight, breathable, and designed for ultimate luxury drape.";
      } else if (q.includes('loyalty') || q.includes('stamp')) {
        reply = "Our loyalty program rewards you with 1 stamp per delivered order. Collect 5 stamps to unlock exclusive VIP perks and special gifts!";
      } else if (q.includes('shipping') || q.includes('delivery')) {
        reply = "We offer fast, secure shipping across all orders. You can track your order status anytime using your order confirmation number.";
      } else if (q.includes('color') || q.includes('match') || q.includes('style')) {
        reply = "For rich espresso or midnight onyx hijabs, we recommend pairing them with neutral champagne or contrasting gold accessories for an exquisite look.";
      }

      appendMessage(reply, 'bot');
    }, 400);
  };

  sendBtn.addEventListener('click', () => {
    if (input.value.trim()) handleUserQuery(input.value.trim());
  });

  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && input.value.trim()) {
      handleUserQuery(input.value.trim());
    }
  });

  return container;
}