/**
 * ShazNest Giveaway Live Spin & Effort Reveal
 * Route: #giveaway
 * 3 Winners: 1 Effort-based + 2 Spin-based
 */

// ==========================================
// ⚙️ GIVEAWAY CONFIGURATION (UPDATE TOMORROW)
// ==========================================
export const GIVEAWAY_CONFIG = {
  // 1. Effort-Based Winner (Revealed right at 10:00 PM IST)
  effortWinner: {
    handle: '@participant_effort',
    reason: 'Recognized for most active engagement, thoughtful comments, and sharing our launch!'
  },

  // 2. Lucky Spin Winners (Guaranteed outcomes)
  spinWinner1: '@lucky_participant_1',
  spinWinner2: '@lucky_participant_2',

  // 3. Pool of Shortlisted Participants for the Wheel
  // You can paste your final list here tomorrow
  participants: [
    '@lucky_participant_1',
    '@lucky_participant_2',
    '@ayesha_k',
    '@fatima.vlogs',
    '@zoya_designs',
    '@mariam_hijabs',
    '@sana_style',
    '@nazia_trends',
    '@huda_collection',
    '@amira_dxb'
  ],

  // Set for Tonight 10:00 PM IST
  targetTimeISO: getTonight10PmIST()
};

function getTonight10PmIST() {
  const now = new Date();
  const istOffsetMs = 5.5 * 60 * 60 * 1000;
  const nowIST = new Date(now.getTime() + (now.getTimezoneOffset() * 60000) + istOffsetMs);
  
  const targetIST = new Date(nowIST);
  targetIST.setHours(22, 0, 0, 0);

  const targetUtcMs = targetIST.getTime() - istOffsetMs;
  return new Date(targetUtcMs).toISOString();
}

export function renderGiveawayPage(container) {
  const { effortWinner, spinWinner1, spinWinner2, participants, targetTimeISO } = GIVEAWAY_CONFIG;
  const targetTimestamp = new Date(targetTimeISO).getTime();

  container.innerHTML = `
    <div class="giveaway-wrapper">
      <div class="giveaway-header">
        <span class="giveaway-badge">LIVE RESULTS</span>
        <h1 class="giveaway-title">Grand Giveaway Reveal ✨</h1>
        <p class="giveaway-subtitle">Celebrating our <strong>@shaz.nest</strong> community! We are choosing <strong>3 lucky winners</strong> tonight.</p>
      </div>

      <!-- Live Countdown -->
      <div id="giveaway-countdown" class="giveaway-countdown-box">
        <p class="countdown-label">Results Unlock In:</p>
        <div class="countdown-grid">
          <div class="timer-card"><span id="cd-hours">00</span><small>Hours</small></div>
          <div class="timer-card"><span id="cd-mins">00</span><small>Minutes</small></div>
          <div class="timer-card"><span id="cd-secs">00</span><small>Seconds</small></div>
        </div>
      </div>

      <!-- Category 1: Effort Winner Section -->
      <div id="effort-winner-section" class="winner-reveal-card locked">
        <div class="lock-overlay"><span>🔒 Reveals at 10:00 PM IST</span></div>
        <div class="award-tag">🏆 WINNER 1 · BEST EFFORT & ENGAGEMENT</div>
        <h3 class="effort-handle">${effortWinner.handle}</h3>
        <p class="effort-note">${effortWinner.reason}</p>
      </div>

      <!-- Category 2 & 3: Wheel Spin Section -->
      <div class="wheel-section">
        <div class="spin-stage-header">
          <span id="spin-round-label" class="round-badge">LUCKY WHEEL · ROUND 1 OF 2</span>
          <p id="spin-instructions">Spinning for Winner #2 & #3 from the eligible pool</p>
        </div>

        <div class="wheel-stage">
          <div class="wheel-pointer">▼</div>
          <canvas id="wheel-canvas" width="420" height="420"></canvas>
          <div class="wheel-center-cap">🌸</div>
        </div>

        <div class="action-box">
          <button id="spin-trigger-btn" class="spin-btn" disabled>Waiting for 10:00 PM IST...</button>
        </div>
      </div>

      <!-- Celebratory Modal for Spin Results -->
      <div id="spin-result-modal" class="winner-modal hidden">
        <div class="winner-card">
          <div class="sparkles">🎉 🎁 ✨</div>
          <h2 id="modal-round-title">Winner Announced!</h2>
          <div class="winner-handle" id="modal-winner-handle">@username</div>
          <p id="modal-prize-desc">You just won a ShazNest Gift Hamper!</p>
          <button id="modal-continue-btn" class="btn-continue">Next Spin</button>
        </div>
      </div>

      <!-- Final Summary Podium (Shows all 3 at the end) -->
      <div id="final-podium" class="final-podium-card hidden">
        <h2>💐 All 3 Giveaway Winners 💐</h2>
        <div class="podium-grid">
          <div class="podium-item">
            <span class="p-rank">#1 Effort</span>
            <strong>${effortWinner.handle}</strong>
          </div>
          <div class="podium-item">
            <span class="p-rank">#2 Spin 1</span>
            <strong id="final-spin-1">${spinWinner1}</strong>
          </div>
          <div class="podium-item">
            <span class="p-rank">#3 Spin 2</span>
            <strong id="final-spin-2">${spinWinner2}</strong>
          </div>
        </div>
        <p class="claim-info">Winners, please DM <strong>@shaz.nest</strong> with your postal address & phone number to receive your parcel!</p>
        <a href="#/" class="btn-shop-back">Visit Store Catalog</a>
      </div>
    </div>
  `;

  injectStyles();

  // Canvas & Physics Initialization
  const canvas = document.getElementById('wheel-canvas');
  const ctx = canvas.getContext('2d');
  const spinBtn = document.getElementById('spin-trigger-btn');
  const roundLabel = document.getElementById('spin-round-label');
  const modal = document.getElementById('spin-result-modal');
  const modalHandle = document.getElementById('modal-winner-handle');
  const modalTitle = document.getElementById('modal-round-title');
  const modalContinueBtn = document.getElementById('modal-continue-btn');
  const finalPodium = document.getElementById('final-podium');

  let currentParticipants = [...participants];
  let currentRound = 1; // 1 = Winner 2, 2 = Winner 3
  let isSpinning = false;

  const colors = ['#9b2c2c', '#c53030', '#dd6b20', '#b7791f', '#2f855a', '#276749', '#2c5282', '#44337a'];

  function drawWheel(angleOffset = 0) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const radius = canvas.width / 2;
    const center = radius;
    const count = currentParticipants.length;
    const sliceAngle = (2 * Math.PI) / count;

    for (let i = 0; i < count; i++) {
      const start = angleOffset + i * sliceAngle;
      const end = start + sliceAngle;

      ctx.beginPath();
      ctx.moveTo(center, center);
      ctx.arc(center, center, radius - 8, start, end);
      ctx.fillStyle = colors[i % colors.length];
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();

      ctx.save();
      ctx.translate(center, center);
      ctx.rotate(start + sliceAngle / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 13px sans-serif';
      ctx.shadowColor = 'rgba(0,0,0,0.6)';
      ctx.shadowBlur = 4;
      ctx.fillText(currentParticipants[i], radius - 22, 5);
      ctx.restore();
    }
  }

  drawWheel(0);

  function spinToTarget(targetWinner, onComplete) {
    if (isSpinning) return;
    isSpinning = true;
    spinBtn.disabled = true;
    spinBtn.innerText = 'Spinning the Wheel... 💫';

    const count = currentParticipants.length;
    const sliceAngle = (2 * Math.PI) / count;
    const winnerIdx = currentParticipants.indexOf(targetWinner);
    const safeIdx = winnerIdx !== -1 ? winnerIdx : 0;

    const targetCenter = safeIdx * sliceAngle + (sliceAngle / 2);
    const stopAngleAtTop = (3 * Math.PI / 2) - targetCenter;
    const totalExtraRotations = 8 * (2 * Math.PI);
    const finalAngle = totalExtraRotations + stopAngleAtTop;

    const duration = 6500;
    const startTime = performance.now();

    function animate(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      const currentRotation = finalAngle * ease;

      drawWheel(currentRotation);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        isSpinning = false;
        triggerConfetti();
        onComplete();
      }
    }

    requestAnimationFrame(animate);
  }

  // Handle countdown
  const countdownInterval = setInterval(() => {
    const distance = targetTimestamp - Date.now();

    if (distance <= 0) {
      clearInterval(countdownInterval);
      document.getElementById('giveaway-countdown').innerHTML = `
        <div class="revealed-banner">🚨 10:00 PM IST HAS ARRIVED! 🚨</div>
      `;
      // Unlock Effort Winner
      document.getElementById('effort-winner-section').classList.remove('locked');

      // Unlock Spin Button
      spinBtn.disabled = false;
      spinBtn.classList.add('ready');
      spinBtn.innerText = 'SPIN FOR WINNER #2 🎯';
    } else {
      const hours = Math.floor(distance / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      document.getElementById('cd-hours').innerText = String(hours).padStart(2, '0');
      document.getElementById('cd-mins').innerText = String(minutes).padStart(2, '0');
      document.getElementById('cd-secs').innerText = String(seconds).padStart(2, '0');
      spinBtn.innerText = `Unlocks in ${minutes}m ${seconds}s`;
    }
  }, 1000);

  // Spin Button Handler
  spinBtn.addEventListener('click', () => {
    if (currentRound === 1) {
      spinToTarget(spinWinner1, () => {
        modalTitle.innerText = 'Winner #2 (Spin 1)';
        modalHandle.innerText = spinWinner1;
        modalContinueBtn.innerText = 'Spin for Final Winner #3 ➔';
        modal.classList.remove('hidden');
      });
    } else if (currentRound === 2) {
      spinToTarget(spinWinner2, () => {
        modalTitle.innerText = 'Winner #3 (Spin 2)';
        modalHandle.innerText = spinWinner2;
        modalContinueBtn.innerText = 'See All 3 Winners 🏆';
        modal.classList.remove('hidden');
      });
    }
  });

  // Modal Next Button Handler
  modalContinueBtn.addEventListener('click', () => {
    modal.classList.add('hidden');

    if (currentRound === 1) {
      // Remove Winner 1 from active list so they don't spin twice
      currentParticipants = currentParticipants.filter(p => p !== spinWinner1);
      currentRound = 2;
      drawWheel(0);

      roundLabel.innerText = 'LUCKY WHEEL · ROUND 2 OF 2';
      spinBtn.disabled = false;
      spinBtn.innerText = 'SPIN FOR FINAL WINNER #3 🎯';
    } else {
      // Finished all spins, show podium
      document.querySelector('.wheel-section').style.display = 'none';
      finalPodium.classList.remove('hidden');
    }
  });
}

function triggerConfetti() {
  const container = document.querySelector('.giveaway-wrapper');
  for (let i = 0; i < 35; i++) {
    const confetti = document.createElement('div');
    confetti.className = 'confetti-piece';
    confetti.style.left = Math.random() * 100 + '%';
    confetti.style.background = ['#e53e3e', '#ecc94b', '#38a169', '#3182ce', '#805ad5'][Math.floor(Math.random() * 5)];
    confetti.style.animationDelay = Math.random() * 1.5 + 's';
    container.appendChild(confetti);
  }
}

function injectStyles() {
  if (document.getElementById('giveaway-styles-v2')) return;
  const style = document.createElement('style');
  style.id = 'giveaway-styles-v2';
  style.textContent = `
    .giveaway-wrapper {
      max-width: 640px;
      margin: 1.5rem auto;
      padding: 1.5rem;
      background: #ffffff;
      border-radius: 20px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.06);
      text-align: center;
      position: relative;
      overflow: hidden;
      font-family: inherit;
    }
    .giveaway-badge {
      background: #9b2c2c;
      color: #fff;
      font-size: 0.75rem;
      font-weight: 700;
      padding: 4px 12px;
      border-radius: 999px;
      letter-spacing: 1px;
    }
    .giveaway-title {
      font-size: 1.75rem;
      color: #1a202c;
      margin: 0.75rem 0 0.25rem;
    }
    .giveaway-subtitle {
      color: #718096;
      font-size: 0.95rem;
      margin-bottom: 1.5rem;
    }
    .giveaway-countdown-box {
      background: #fffaf0;
      border: 1px solid #feebc8;
      padding: 1rem;
      border-radius: 12px;
      margin-bottom: 1.5rem;
    }
    .countdown-label {
      color: #c05621;
      font-weight: 700;
      font-size: 0.8rem;
      margin-bottom: 0.5rem;
      text-transform: uppercase;
    }
    .countdown-grid {
      display: flex;
      justify-content: center;
      gap: 1rem;
    }
    .timer-card {
      background: #fff;
      padding: 0.5rem 1rem;
      border-radius: 8px;
      min-width: 65px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.05);
    }
    .timer-card span {
      display: block;
      font-size: 1.5rem;
      font-weight: 800;
      color: #2d3748;
    }
    .timer-card small {
      font-size: 0.7rem;
      color: #a0aec0;
      text-transform: uppercase;
    }
    .revealed-banner {
      background: #38a169;
      color: white;
      padding: 0.75rem;
      border-radius: 8px;
      font-weight: bold;
    }
    .winner-reveal-card {
      background: #f7fafc;
      border: 2px dashed #cbd5e0;
      border-radius: 14px;
      padding: 1.25rem;
      margin-bottom: 2rem;
      position: relative;
    }
    .winner-reveal-card.locked .lock-overlay {
      display: flex;
    }
    .lock-overlay {
      display: none;
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(255, 255, 255, 0.92);
      border-radius: 14px;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      color: #718096;
      font-size: 0.9rem;
    }
    .award-tag {
      font-size: 0.75rem;
      font-weight: 800;
      color: #b7791f;
      letter-spacing: 0.5px;
      margin-bottom: 0.5rem;
    }
    .effort-handle {
      font-size: 1.6rem;
      color: #2d3748;
      margin: 0.25rem 0;
    }
    .effort-note {
      font-size: 0.85rem;
      color: #718096;
      margin: 0;
    }
    .spin-stage-header {
      margin-bottom: 1rem;
    }
    .round-badge {
      background: #edf2f7;
      color: #4a5568;
      font-weight: 700;
      font-size: 0.75rem;
      padding: 3px 10px;
      border-radius: 6px;
    }
    .wheel-stage {
      position: relative;
      width: 320px;
      height: 320px;
      margin: 0 auto;
    }
    @media (min-width: 480px) {
      .wheel-stage { width: 380px; height: 380px; }
    }
    #wheel-canvas {
      width: 100%;
      height: 100%;
      border-radius: 50%;
      box-shadow: 0 8px 24px rgba(0,0,0,0.12);
    }
    .wheel-pointer {
      position: absolute;
      top: -12px;
      left: 50%;
      transform: translateX(-50%);
      font-size: 28px;
      color: #d69e2e;
      z-index: 10;
    }
    .wheel-center-cap {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 45px;
      height: 45px;
      background: #ffffff;
      border-radius: 50%;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
    }
    .spin-btn {
      margin-top: 1.5rem;
      padding: 0.85rem 2rem;
      font-size: 1rem;
      font-weight: 700;
      border-radius: 999px;
      border: none;
      background: #e2e8f0;
      color: #a0aec0;
      cursor: not-allowed;
      transition: all 0.2s;
    }
    .spin-btn.ready {
      background: #805ad5;
      color: white;
      cursor: pointer;
      box-shadow: 0 4px 15px rgba(128, 90, 213, 0.4);
    }
    .winner-modal {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0,0,0,0.65);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 1rem;
    }
    .winner-modal.hidden { display: none; }
    .winner-card {
      background: #fff;
      padding: 2.25rem 1.5rem;
      border-radius: 20px;
      max-width: 400px;
      width: 100%;
      text-align: center;
    }
    .winner-handle {
      font-size: 1.8rem;
      font-weight: 900;
      color: #9b2c2c;
      margin: 1rem 0;
      padding: 0.5rem 1rem;
      background: #fff5f5;
      border-radius: 8px;
      display: inline-block;
    }
    .btn-continue, .btn-shop-back {
      background: #2d3748;
      color: white;
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      display: inline-block;
      text-decoration: none;
    }
    .final-podium-card {
      background: #faf5ff;
      border: 1px solid #e9d8fd;
      border-radius: 16px;
      padding: 1.5rem;
      margin-top: 1.5rem;
    }
    .final-podium-card.hidden { display: none; }
    .podium-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
      gap: 1rem;
      margin: 1.25rem 0;
    }
    .podium-item {
      background: white;
      padding: 1rem 0.5rem;
      border-radius: 10px;
      box-shadow: 0 2px 6px rgba(0,0,0,0.05);
    }
    .p-rank {
      display: block;
      font-size: 0.75rem;
      color: #805ad5;
      font-weight: 700;
      margin-bottom: 0.25rem;
    }
    .claim-info {
      font-size: 0.85rem;
      color: #4a5568;
      margin: 1rem 0;
    }
    .confetti-piece {
      position: absolute;
      width: 10px;
      height: 14px;
      top: -20px;
      z-index: 9999;
      opacity: 0.8;
      animation: fall 3s linear infinite;
    }
    @keyframes fall {
      to { transform: translateY(600px) rotate(720deg); }
    }
  `;
  document.head.appendChild(style);
}