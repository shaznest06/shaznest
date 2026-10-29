/**
 * ShazNest Grand Giveaway Live Reveal
 * 100% Automated Ceremony at 10:00 PM IST
 * 3 Winners: 1 Effort + 2 Reel Spins -> Seamless Final Podium Transition
 * Route: #giveaway
 */

// ==========================================
// ⚙️ GIVEAWAY CONFIGURATION (UPDATE WHEN READY)
// ==========================================
export const GIVEAWAY_CONFIG = {
  // Winner 1: Best Effort / Engagement
  effortWinner: {
    handle: '@fatima_active',
    reason: 'Awarded for active engagement, thoughtful comments, and sharing our launch!'
  },

  // Winners 2 & 3: Selected via the Grand Raffle Reel
  spinWinner1: '@mariam_dxb',
  spinWinner2: '@zoya_hijabstyle',

  // Master Participant List (paste all handles here)
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
// --- TEMPORARY TEST: Sets target to exactly 2 minutes from now ---
function getTonight10PmISTTimestamp() {
  return Date.now() + 2 * 60 * 1000;
}
// Strict 10:00 PM IST (UTC+05:30) Target Timestamp
// function getTonight10PmISTTimestamp() {
//   const now = new Date();
//   const istFormatter = new Intl.DateTimeFormat('en-US', {
//     timeZone: 'Asia/Kolkata',
//     year: 'numeric',
//     month: 'numeric',
//     day: 'numeric'
//   });
//   const parts = istFormatter.formatToParts(now);
//   const year = parts.find(p => p.type === 'year').value;
//   const month = String(parts.find(p => p.type === 'month').value).padStart(2, '0');
//   const day = String(parts.find(p => p.type === 'day').value).padStart(2, '0');

//   return new Date(`${year}-${month}-${day}T22:00:00+05:30`).getTime();
// }

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
        <p class="grand-tagline">3 Luxury Hijab Gift Hampers for our Instagram family</p>
        <div class="participant-counter-pill">
          ✨ <strong>${participants.length}</strong> Verified Entrants in Tonight's Ceremony
        </div>
      </div>

      <!-- Live Broadcast / Timer Box -->
      <div id="giveaway-timer-box" class="royal-timer-box">
        <p class="timer-headline">AUTOMATED CEREMONY COMMENCES AT 10:00 PM IST</p>
        <div class="timer-digits">
          <div class="digit-col"><span id="cd-hours">00</span><label>Hours</label></div>
          <div class="digit-divider">:</div>
          <div class="digit-col"><span id="cd-mins">00</span><label>Minutes</label></div>
          <div class="digit-divider">:</div>
          <div class="digit-col"><span id="cd-secs">00</span><label>Seconds</label></div>
        </div>
      </div>

      <!-- STAGE AREA (Hides smoothly once ceremony completes) -->
      <div id="giveaway-stage" class="giveaway-stage">
        
        <!-- WINNER 1: EFFORT -->
        <div id="effort-card" class="award-card effort-card locked-state">
          <div class="lock-shield" id="effort-lock-shield">
            <span>🔒 Unlocks Automatically at 10:00 PM IST</span>
          </div>
          <div class="card-crown">👑</div>
          <span class="card-tier">WINNER #1 · BEST ENGAGEMENT & EFFORT</span>
          <h3 class="card-handle">${effortWinner.handle}</h3>
          <p class="card-reason">${effortWinner.reason}</p>
        </div>

        <!-- WINNERS 2 & 3: LUXURY RAFFLE REEL -->
        <div class="raffle-machine-wrapper">
          <div class="reel-badge" id="reel-badge">LUCKY DRAW · PREPARING REEL</div>
          <p class="reel-status" id="reel-status">Waiting for 10:00 PM IST to start automated draw...</p>

          <div class="slot-window">
            <div class="slot-pointer left">▶</div>
            <div class="slot-pointer right">◀</div>
            <div class="slot-strip" id="slot-strip"></div>
          </div>

          <div class="live-ticker" id="live-ticker">● LIVE DRAW AUTOMATION ACTIVE</div>
        </div>
      </div>

      <!-- FINAL PODIUM: Only shows all 3 winners at the end -->
      <div id="grand-podium" class="grand-podium hidden">
        <div class="podium-sparkle">💐 👑 💐</div>
        <h2 class="podium-title">Congratulations to Our 3 Winners!</h2>
        <p class="podium-sub">Thank you to everyone who participated in our community launch giveaway.</p>

        <div class="podium-grid">
          <!-- Winner 1 -->
          <div class="podium-card gold-glow">
            <span class="p-rank">🏆 Winner #1 (Effort)</span>
            <h3 class="p-name">${effortWinner.handle}</h3>
            <p class="p-note">Community Champion</p>
          </div>

          <!-- Winner 2 -->
          <div class="podium-card gold-glow highlight">
            <span class="p-rank">✨ Winner #2 (Spin 1)</span>
            <h3 class="p-name" id="final-spin-1">${spinWinner1}</h3>
            <p class="p-note">Luxury Draw Winner</p>
          </div>

          <!-- Winner 3 -->
          <div class="podium-card gold-glow">
            <span class="p-rank">✨ Winner #3 (Spin 2)</span>
            <h3 class="p-name" id="final-spin-2">${spinWinner2}</h3>
            <p class="p-note">Luxury Draw Winner</p>
          </div>
        </div>

        <div class="claim-card">
          <h4>How to Claim Your Luxury Hamper:</h4>
          <p>Please send a Direct Message to <strong>@shaz.nest</strong> from your winning Instagram account with your shipping address and contact number within 48 hours!</p>
        </div>

        <a href="#shop" class="btn-shop-luxury">Explore the ShazNest Boutique ➔</a>
      </div>
    </div>
  `;


  const slotStrip = document.getElementById('slot-strip');
  const reelBadge = document.getElementById('reel-badge');
  const reelStatus = document.getElementById('reel-status');
  const effortCard = document.getElementById('effort-card');
  const effortLockShield = document.getElementById('effort-lock-shield');
  const stage = document.getElementById('giveaway-stage');
  const grandPodium = document.getElementById('grand-podium');

  const ITEM_HEIGHT = 60;

  // Build 4x looped list to support rolling animation
  function buildReel(items) {
    slotStrip.innerHTML = '';
    const repeated = [...items, ...items, ...items, ...items];
    repeated.forEach((handle) => {
      const el = document.createElement('div');
      el.className = 'slot-item';
      el.textContent = handle;
      slotStrip.appendChild(el);
    });
  }

  buildReel(participants);

  // Smooth roll execution
  function rollToWinner(targetWinner, durationMs = 5200) {
    return new Promise((resolve) => {
      const pool = participants;
      const idx = pool.indexOf(targetWinner);
      const safeIdx = idx !== -1 ? idx : 0;

      // Target item in the 3rd repeated loop for suspense
      const targetIndex = (pool.length * 2) + safeIdx;
      const targetY = -(targetIndex * ITEM_HEIGHT);

      slotStrip.style.transition = `transform ${durationMs}ms cubic-bezier(0.12, 0.8, 0.18, 1)`;
      slotStrip.style.transform = `translateY(${targetY}px)`;

      setTimeout(() => {
        spawnGoldenConfetti();
        resolve();
      }, durationMs + 200);
    });
  }

  // Automated Sequential Ceremony Orchestrator
  let ceremonyStarted = false;
  async function startAutomatedCeremony() {
    if (ceremonyStarted) return;
    ceremonyStarted = true;

    // 1. Reveal Effort Winner
    effortLockShield.style.display = 'none';
    effortCard.classList.remove('locked-state');
    effortCard.classList.add('pulse-gold');

    reelBadge.innerText = 'LUCKY DRAW · SELECTING WINNER #2...';
    reelStatus.innerText = 'Reel spinning now for Winner #2...';

    // 2. Short dramatic pause before Spin 1
    await new Promise(r => setTimeout(r, 2000));

    // 3. Roll for Winner #2
    await rollToWinner(spinWinner1);
    reelStatus.innerHTML = `🎉 Winner #2 Selected: <strong style="color: #dfb15b;">${spinWinner1}</strong>!`;

    // 4. Pause for audience reaction
    await new Promise(r => setTimeout(r, 3500));

    // 5. Reset Reel silently for Winner #3
    slotStrip.style.transition = 'none';
    slotStrip.style.transform = 'translateY(0px)';
    reelBadge.innerText = 'LUCKY DRAW · SELECTING FINAL WINNER #3...';
    reelStatus.innerText = 'Reel spinning now for Winner #3...';

    await new Promise(r => setTimeout(r, 1000));

    // 6. Roll for Winner #3
    await rollToWinner(spinWinner2);
    reelStatus.innerHTML = `🎉 Winner #3 Selected: <strong style="color: #dfb15b;">${spinWinner2}</strong>!`;

    // 7. Pause to celebrate
    await new Promise(r => setTimeout(r, 3500));

    // 8. Transform Screen: Fade out stage and reveal the Grand 3-Winner Podium
    stage.classList.add('fade-out');
    setTimeout(() => {
      stage.style.display = 'none';
      grandPodium.classList.remove('hidden');
      grandPodium.classList.add('fade-in');
      spawnGoldenConfetti();
    }, 600);
  }

  // Timer loop
  const timerInterval = setInterval(() => {
    const diff = targetTimestamp - Date.now();

    if (diff <= 0) {
      clearInterval(timerInterval);
      document.getElementById('giveaway-timer-box').innerHTML = `
        <div class="live-broadcast-banner">🚨 10:00 PM IST · LIVE CEREMONY RUNNING 🚨</div>
      `;
      startAutomatedCeremony();
    } else {
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diff % (1000 * 60)) / 1000);

      document.getElementById('cd-hours').textContent = String(hours).padStart(2, '0');
      document.getElementById('cd-mins').textContent = String(mins).padStart(2, '0');
      document.getElementById('cd-secs').textContent = String(secs).padStart(2, '0');
    }
  }, 1000);
}

function spawnGoldenConfetti() {
  const container = document.querySelector('.grand-giveaway-container');
  if (!container) return;
  for (let i = 0; i < 45; i++) {
    const star = document.createElement('div');
    star.className = 'gold-star';
    star.textContent = ['✦', '★', '◆', '✨', '👑'][Math.floor(Math.random() * 5)];
    star.style.left = Math.random() * 100 + '%';
    star.style.animationDelay = Math.random() * 1.5 + 's';
    star.style.fontSize = Math.floor(Math.random() * 14 + 14) + 'px';
    container.appendChild(star);
  }
}
function injectGrandStyles() {
  // Styles moved to styles.css to eliminate unstyled content flash
}
