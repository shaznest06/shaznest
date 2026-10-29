/**
 * ShazNest Grand Giveaway Live Reveal
 * Handles 50+ Participants with a Luxury Golden Raffle Reel
 * Route: #giveaway
 */

// ==========================================
// ⚙️ GIVEAWAY CONFIGURATION
// ==========================================
export const GIVEAWAY_CONFIG = {
  // Winner 1: Effort / Most Active
  effortWinner: {
    handle: '@fatima_active',
    reason: 'Awarded for active engagement, heartfelt comments, and sharing every post!'
  },

  // Winners 2 & 3: Lucky Draw Winners
  spinWinner1: '@mariam_dxb',
  spinWinner2: '@zoya_hijabstyle',

  // Master list of 50+ Participants (paste all handles here)
  participants: [
    '@ayesha_k', '@mariam_dxb', '@sana_style', '@zoya_hijabstyle', '@nazia_trends',
    '@fatima_active', '@huda_collection', '@amira_dxb', '@noor_fashion', '@zahra_boutique',
    '@yasmin_hijabs', '@bushra_official', '@alina_trends', '@sumayya_art', '@safiya_daily',
    '@rehana_chic', '@farida_modest', '@kainat_lookbook', '@mehak_vlogs', '@tanzeem_glow',
    '@uzma_style', '@rizwana_jewels', '@shaheen_drapes', '@saleha_gems', '@anisa_nest',
    '@asma_modesty', '@fauzia_looks', '@habiba_couture', '@iqra_lifestyle', '@jameela_fab',
    '@kalsoom_vibe', '@lubna_couture', '@munira_hijabs', '@naheed_wear', '@parveen_silks',
    '@qirat_collection', '@rubina_creations', '@shabana_luxury', '@tahira_exclusive', '@wahida_grace',
    '@yusra_sparkle', '@zeenat_couture', '@arifa_grace', '@bilquis_elegance', '@chahat_drapes',
    '@dilshad_looks', '@erum_chic', '@feroza_modesty', '@gulshan_vogue', '@hajra_pure'
  ]
};

// Strict 10:00 PM IST (UTC + 5:30) Calculation
function getTonight10PmISTTimestamp() {
  const now = new Date();
  
  // Format current date in Asia/Kolkata timezone
  const istFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric'
  });
  const parts = istFormatter.formatToParts(now);
  const year = parts.find(p => p.type === 'year').value;
  const month = String(parts.find(p => p.type === 'month').value).padStart(2, '0');
  const day = String(parts.find(p => p.type === 'day').value).padStart(2, '0');

  // Construct target: YYYY-MM-DD 22:00:00 in +05:30
  return new Date(`${year}-${month}-${day}T22:00:00+05:30`).getTime();
}

export function renderGiveawayPage(container) {
  const { effortWinner, spinWinner1, spinWinner2, participants } = GIVEAWAY_CONFIG;
  const targetTimestamp = getTonight10PmISTTimestamp();

  container.innerHTML = `
    <div class="grand-giveaway-container">
      <div class="ambient-gold-orb orb-1"></div>
      <div class="ambient-gold-orb orb-2"></div>

      <!-- Header Section -->
      <div class="grand-header">
        <div class="royal-tag">SHAZNEST EXCLUSIVE</div>
        <h1 class="grand-title">Grand Giveaway Reveal</h1>
        <p class="grand-tagline">3 exclusive gift hampers for our beloved community</p>
        <div class="participant-counter-pill">
          ✨ <strong>${participants.length}</strong> Verified Participants in Tonight's Draw
        </div>
      </div>

      <!-- Golden Countdown Clock -->
      <div id="giveaway-timer-box" class="royal-timer-box">
        <p class="timer-headline">REVEAL COMMENCES AT 10:00 PM IST</p>
        <div class="timer-digits">
          <div class="digit-col"><span id="cd-hours">00</span><label>Hours</label></div>
          <div class="digit-divider">:</div>
          <div class="digit-col"><span id="cd-mins">00</span><label>Minutes</label></div>
          <div class="digit-divider">:</div>
          <div class="digit-col"><span id="cd-secs">00</span><label>Seconds</label></div>
        </div>
      </div>

      <!-- WINNER 1: EFFORT -->
      <div id="effort-card" class="award-card effort-card locked-state">
        <div class="lock-shield" id="effort-lock-shield">
          <span>🔒 Reveals at 10:00 PM IST</span>
        </div>
        <div class="card-crown">👑</div>
        <span class="card-tier">WINNER #1 · COMMUNITY CHAMPION</span>
        <h3 class="card-handle">${effortWinner.handle}</h3>
        <p class="card-reason">${effortWinner.reason}</p>
      </div>

      <!-- WINNERS 2 & 3: LUXURY RAFFLE REEL -->
      <div class="raffle-machine-wrapper">
        <div class="machine-frame">
          <div class="reel-badge" id="reel-badge">LUCKY DRAW · DRAW 1 OF 2</div>
          <p class="reel-sub">Selection Reel for Winner #2 & #3</p>

          <!-- The High-Speed Slot Ticker -->
          <div class="slot-window">
            <div class="slot-pointer left">▶</div>
            <div class="slot-pointer right">◀</div>
            <div class="slot-strip" id="slot-strip">
              <!-- Names populated dynamically -->
            </div>
          </div>

          <button id="draw-btn" class="royal-action-btn" disabled>
            Awaiting 10:00 PM IST
          </button>
        </div>
      </div>

      <!-- Celebration Modal -->
      <div id="royal-modal" class="royal-modal hidden">
        <div class="modal-box">
          <div class="confetti-burst">✨ 🎁 ✨</div>
          <span class="modal-tier" id="modal-tier">LUCKY WINNER</span>
          <h2 class="modal-winner" id="modal-winner-handle">@username</h2>
          <p class="modal-desc">Wins an exclusive ShazNest Premium Hijab Gift Set!</p>
          <button id="modal-next-btn" class="btn-royal-gold">Continue</button>
        </div>
      </div>

      <!-- Final Podium View -->
      <div id="grand-podium" class="grand-podium hidden">
        <div class="podium-header">
          <h3>🌹 Tonight's 3 Honored Winners 🌹</h3>
          <p>Please send a DM to <strong>@shaz.nest</strong> with your shipping details</p>
        </div>
        <div class="podium-cards">
          <div class="podium-card gold-border">
            <small>Winner #1 (Effort)</small>
            <h4>${effortWinner.handle}</h4>
          </div>
          <div class="podium-card gold-border">
            <small>Winner #2 (Draw 1)</small>
            <h4>${spinWinner1}</h4>
          </div>
          <div class="podium-card gold-border">
            <small>Winner #3 (Draw 2)</small>
            <h4>${spinWinner2}</h4>
          </div>
        </div>
        <a href="#shop" class="btn-shop-luxury">Explore The Boutique</a>
      </div>
    </div>
  `;

  injectGrandStyles();

  // Populate Reel strip with repeated participant names for infinite-feel scrolling
  const slotStrip = document.getElementById('slot-strip');
  const drawBtn = document.getElementById('draw-btn');
  const reelBadge = document.getElementById('reel-badge');
  const modal = document.getElementById('royal-modal');
  const modalWinnerHandle = document.getElementById('modal-winner-handle');
  const modalTier = document.getElementById('modal-tier');
  const modalNextBtn = document.getElementById('modal-next-btn');
  const grandPodium = document.getElementById('grand-podium');

  let currentDrawRound = 1; // 1 = spinWinner1, 2 = spinWinner2
  let isRolling = false;

  function buildReel(items) {
    slotStrip.innerHTML = '';
    // Duplicate pool 4 times to allow seamless spinning momentum
    const fullList = [...items, ...items, ...items, ...items];
    fullList.forEach((handle) => {
      const el = document.createElement('div');
      el.className = 'slot-item';
      el.textContent = handle;
      slotStrip.appendChild(el);
    });
  }

  buildReel(participants);

  function executeRaffleRoll(targetWinner, onFinished) {
    if (isRolling) return;
    isRolling = true;
    drawBtn.disabled = true;
    drawBtn.innerText = 'Rolling the Gold Reel... ✨';

    const itemHeight = 60; // slot-item height
    const pool = participants;
    const winnerIndexInPool = pool.indexOf(targetWinner);
    const safeIdx = winnerIndexInPool !== -1 ? winnerIndexInPool : 0;

    // Target position lands on the 3rd duplicated set to give 4 seconds of rapid rolling
    const targetItemIndex = (pool.length * 2) + safeIdx;
    const targetY = -(targetItemIndex * itemHeight);

    slotStrip.style.transition = 'transform 5.2s cubic-bezier(0.12, 0.8, 0.18, 1)';
    slotStrip.style.transform = `translateY(${targetY}px)`;

    setTimeout(() => {
      isRolling = false;
      spawnGoldenConfetti();
      onFinished();
    }, 5300);
  }

  // Live Countdown Loop
  const timerInterval = setInterval(() => {
    const diff = targetTimestamp - Date.now();

    if (diff <= 0) {
      clearInterval(timerInterval);
      document.getElementById('giveaway-timer-box').innerHTML = `
        <div class="unlocked-banner">👑 10:00 PM IST HAS ARRIVED · REVEAL ACTIVE 👑</div>
      `;
      // Unlock Effort Winner
      document.getElementById('effort-lock-shield').style.display = 'none';
      document.getElementById('effort-card').classList.remove('locked-state');

      // Unlock Draw Button
      drawBtn.disabled = false;
      drawBtn.classList.add('active-ready');
      drawBtn.innerText = 'ROLL FOR WINNER #2 ➔';
    } else {
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diff % (1000 * 60)) / 1000);

      document.getElementById('cd-hours').textContent = String(hours).padStart(2, '0');
      document.getElementById('cd-mins').textContent = String(mins).padStart(2, '0');
      document.getElementById('cd-secs').textContent = String(secs).padStart(2, '0');
      drawBtn.innerText = `Reel Unlocks in ${hours}h ${mins}m ${secs}s`;
    }
  }, 1000);

  // Button actions
  drawBtn.addEventListener('click', () => {
    if (currentDrawRound === 1) {
      executeRaffleRoll(spinWinner1, () => {
        modalTier.innerText = 'WINNER #2 (LUCKY DRAW 1)';
        modalWinnerHandle.innerText = spinWinner1;
        modalNextBtn.innerText = 'Draw Final Winner #3 ➔';
        modal.classList.remove('hidden');
      });
    } else if (currentDrawRound === 2) {
      executeRaffleRoll(spinWinner2, () => {
        modalTier.innerText = 'WINNER #3 (LUCKY DRAW 2)';
        modalWinnerHandle.innerText = spinWinner2;
        modalNextBtn.innerText = 'View All 3 Winners 🏆';
        modal.classList.remove('hidden');
      });
    }
  });

  modalNextBtn.addEventListener('click', () => {
    modal.classList.add('hidden');

    if (currentDrawRound === 1) {
      currentDrawRound = 2;
      reelBadge.innerText = 'LUCKY DRAW · ROUND 2 OF 2';
      
      // Reset strip position silently
      slotStrip.style.transition = 'none';
      slotStrip.style.transform = 'translateY(0px)';
      
      drawBtn.disabled = false;
      drawBtn.innerText = 'ROLL FOR FINAL WINNER #3 ➔';
    } else {
      document.querySelector('.raffle-machine-wrapper').style.display = 'none';
      grandPodium.classList.remove('hidden');
    }
  });
}

function spawnGoldenConfetti() {
  const container = document.querySelector('.grand-giveaway-container');
  for (let i = 0; i < 45; i++) {
    const star = document.createElement('div');
    star.className = 'gold-star';
    star.textContent = ['✦', '★', '◆', '✨'][Math.floor(Math.random() * 4)];
    star.style.left = Math.random() * 100 + '%';
    star.style.animationDelay = Math.random() * 1.5 + 's';
    star.style.fontSize = Math.floor(Math.random() * 14 + 14) + 'px';
    container.appendChild(star);
  }
}

function injectGrandStyles() {
  if (document.getElementById('grand-giveaway-styles')) return;
  const style = document.createElement('style');
  style.id = 'grand-giveaway-styles';
  style.textContent = `
    .grand-giveaway-container {
      max-width: 680px;
      margin: 1.5rem auto 3rem;
      padding: 2rem 1.5rem;
      background: radial-gradient(circle at 50% 0%, #172a24 0%, #0d1512 100%);
      border-radius: 24px;
      color: #f7fafc;
      box-shadow: 0 20px 50px rgba(0,0,0,0.4), 0 0 0 1px rgba(212,175,55,0.25);
      text-align: center;
      position: relative;
      overflow: hidden;
      font-family: inherit;
    }
    .ambient-gold-orb {
      position: absolute;
      width: 250px;
      height: 250px;
      background: radial-gradient(circle, rgba(212,175,55,0.15) 0%, transparent 70%);
      border-radius: 50%;
      pointer-events: none;
    }
    .orb-1 { top: -80px; left: -60px; }
    .orb-2 { bottom: -60px; right: -60px; }
    .royal-tag {
      display: inline-block;
      font-size: 0.7rem;
      font-weight: 800;
      letter-spacing: 2.5px;
      color: #dfb15b;
      padding: 4px 14px;
      border: 1px solid rgba(223,177,91,0.4);
      border-radius: 999px;
      background: rgba(223,177,91,0.08);
      margin-bottom: 0.75rem;
    }
    .grand-title {
      font-size: 2.2rem;
      font-weight: 800;
      color: #fff;
      margin: 0;
      letter-spacing: -0.5px;
    }
    .grand-tagline {
      color: #a0aec0;
      font-size: 0.95rem;
      margin: 0.5rem 0 1.25rem;
    }
    .participant-counter-pill {
      display: inline-block;
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.1);
      padding: 6px 16px;
      border-radius: 999px;
      font-size: 0.85rem;
      color: #e2e8f0;
      margin-bottom: 1.5rem;
    }
    .royal-timer-box {
      background: rgba(0,0,0,0.3);
      border: 1px solid rgba(212,175,55,0.25);
      border-radius: 16px;
      padding: 1.25rem;
      margin-bottom: 2rem;
    }
    .timer-headline {
      font-size: 0.75rem;
      font-weight: 700;
      color: #dfb15b;
      letter-spacing: 1.5px;
      margin: 0 0 0.75rem;
    }
    .timer-digits {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 1rem;
    }
    .digit-col span {
      display: block;
      font-size: 2.2rem;
      font-weight: 900;
      color: #ffffff;
      line-height: 1;
    }
    .digit-col label {
      font-size: 0.7rem;
      color: #718096;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .digit-divider {
      font-size: 1.8rem;
      color: #dfb15b;
      font-weight: 300;
      margin-top: -12px;
    }
    .unlocked-banner {
      background: linear-gradient(90deg, #b7791f, #d69e2e);
      color: #fff;
      font-weight: 800;
      padding: 0.75rem;
      border-radius: 8px;
    }
    .award-card {
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(212,175,55,0.3);
      border-radius: 16px;
      padding: 1.5rem;
      margin-bottom: 2rem;
      position: relative;
    }
    .card-crown { font-size: 1.8rem; margin-bottom: 0.25rem; }
    .card-tier {
      font-size: 0.75rem;
      font-weight: 800;
      letter-spacing: 1px;
      color: #dfb15b;
    }
    .card-handle {
      font-size: 1.7rem;
      margin: 0.5rem 0;
      color: #fff;
    }
    .card-reason {
      font-size: 0.85rem;
      color: #a0aec0;
      margin: 0;
    }
    .lock-shield {
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(13,21,18,0.94);
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      color: #dfb15b;
      font-size: 0.9rem;
    }
    .raffle-machine-wrapper {
      background: rgba(0,0,0,0.4);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 20px;
      padding: 1.75rem 1.25rem;
    }
    .reel-badge {
      font-size: 0.75rem;
      font-weight: 800;
      color: #dfb15b;
      letter-spacing: 1px;
    }
    .reel-sub {
      font-size: 0.85rem;
      color: #a0aec0;
      margin: 0.25rem 0 1.25rem;
    }
    .slot-window {
      position: relative;
      height: 60px;
      overflow: hidden;
      background: #090e0c;
      border: 2px solid #dfb15b;
      border-radius: 12px;
      box-shadow: inset 0 0 20px rgba(0,0,0,0.8), 0 0 15px rgba(223,177,91,0.25);
    }
    .slot-pointer {
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      font-size: 16px;
      color: #dfb15b;
      z-index: 10;
    }
    .slot-pointer.left { left: 12px; }
    .slot-pointer.right { right: 12px; }
    .slot-strip {
      transform: translateY(0px);
    }
    .slot-item {
      height: 60px;
      line-height: 60px;
      font-size: 1.3rem;
      font-weight: 800;
      color: #ffffff;
      letter-spacing: 0.5px;
    }
    .royal-action-btn {
      margin-top: 1.5rem;
      width: 100%;
      max-width: 320px;
      padding: 0.95rem;
      border-radius: 999px;
      border: none;
      font-size: 1rem;
      font-weight: 800;
      background: #2d3748;
      color: #718096;
      cursor: not-allowed;
      transition: all 0.3s;
    }
    .royal-action-btn.active-ready {
      background: linear-gradient(135deg, #dfb15b 0%, #b7791f 100%);
      color: #000;
      cursor: pointer;
      box-shadow: 0 6px 20px rgba(223,177,91,0.4);
    }
    .royal-modal {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0,0,0,0.85);
      backdrop-filter: blur(8px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      padding: 1.5rem;
    }
    .royal-modal.hidden { display: none; }
    .modal-box {
      background: #121e1a;
      border: 1px solid #dfb15b;
      border-radius: 20px;
      padding: 2.5rem 1.5rem;
      max-width: 420px;
      width: 100%;
      box-shadow: 0 10px 40px rgba(223,177,91,0.25);
    }
    .modal-winner {
      font-size: 2rem;
      color: #dfb15b;
      margin: 0.5rem 0 1rem;
    }
    .modal-tier {
      font-size: 0.75rem;
      letter-spacing: 1.5px;
      color: #a0aec0;
      font-weight: 700;
    }
    .modal-desc {
      color: #e2e8f0;
      font-size: 0.9rem;
      margin-bottom: 1.5rem;
    }
    .btn-royal-gold, .btn-shop-luxury {
      background: linear-gradient(135deg, #dfb15b 0%, #b7791f 100%);
      color: #0d1512;
      font-weight: 800;
      border: none;
      padding: 0.85rem 1.75rem;
      border-radius: 999px;
      cursor: pointer;
      display: inline-block;
      text-decoration: none;
    }
    .grand-podium {
      margin-top: 2rem;
      padding: 1.75rem;
      background: rgba(255,255,255,0.03);
      border-radius: 20px;
      border: 1px solid rgba(212,175,55,0.2);
    }
    .grand-podium.hidden { display: none; }
    .podium-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
      gap: 1rem;
      margin: 1.5rem 0;
    }
    .podium-card {
      background: rgba(0,0,0,0.4);
      padding: 1.25rem 0.5rem;
      border-radius: 12px;
      border: 1px solid rgba(212,175,55,0.3);
    }
    .podium-card small {
      display: block;
      color: #dfb15b;
      font-size: 0.7rem;
      font-weight: 700;
      margin-bottom: 0.25rem;
    }
    .podium-card h4 {
      margin: 0;
      font-size: 1.15rem;
      color: #fff;
    }
    .gold-star {
      position: absolute;
      top: -20px;
      color: #dfb15b;
      pointer-events: none;
      animation: goldDrop 3s linear forwards;
    }
    @keyframes goldDrop {
      to { transform: translateY(700px) rotate(360deg); opacity: 0; }
    }
    .grand-giveaway-hero-card {
      background: linear-gradient(135deg, #172a24 0%, #0d1512 100%);
      border: 1px solid rgba(212,175,55,0.3);
      border-radius: 16px;
      padding: 1.5rem;
      margin: 1.5rem 1rem;
      text-align: center;
      color: white;
    }
    .luxury-badge {
      display: inline-block;
      font-size: 0.65rem;
      letter-spacing: 2px;
      color: #dfb15b;
      font-weight: 800;
      margin-bottom: 0.5rem;
    }
    .btn-gold-glow {
      display: inline-block;
      margin-top: 1rem;
      background: #dfb15b;
      color: #0d1512;
      padding: 0.6rem 1.4rem;
      border-radius: 999px;
      font-weight: 700;
      font-size: 0.9rem;
      text-decoration: none;
      box-shadow: 0 4px 15px rgba(223,177,91,0.3);
    }
  `;
  document.head.appendChild(style);
}