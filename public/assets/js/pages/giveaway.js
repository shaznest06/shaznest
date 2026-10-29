/**
 * ShazNest Grand Giveaway Live Reveal
 * Atomic Time Synchronized + Zero-Flash Render
 * 100% Automated Ceremony at 10:00 PM IST
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

// Strict 10:00 PM IST (UTC+05:30) Target Timestamp
function getTonight10PmISTTimestamp() {
  const now = new Date();
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

  return new Date(`${year}-${month}-${day}T22:00:00+05:30`).getTime();
}

// Global server-time offset in ms (deviceTime + serverOffset = true atomic time)
let serverTimeOffsetMs = 0;
let hasSyncedServerTime = false;

async function syncWithServerClock() {
  if (hasSyncedServerTime) return;
  try {
    const t0 = Date.now();
    // Head request to any lightweight endpoint to read Cloudflare's server Date header
    const resp = await fetch('/api/v1/products', { method: 'HEAD', cache: 'no-store' });
    const serverDateStr = resp.headers.get('Date');
    if (serverDateStr) {
      const t1 = Date.now();
      const roundTripLatency = (t1 - t0) / 2;
      const serverUtc = new Date(serverDateStr).getTime() + roundTripLatency;
      serverTimeOffsetMs = serverUtc - Date.now();
      hasSyncedServerTime = true;
    }
  } catch {
    // If offline or request fails, falls back gracefully to device clock
  }
}

function getCorrectedNow() {
  return Date.now() + serverTimeOffsetMs;
}

function getInitialTimeRemaining(targetTimestamp) {
  const diff = Math.max(0, targetTimestamp - getCorrectedNow());
  return {
    hours: String(Math.floor(diff / (1000 * 60 * 60))).padStart(2, '0'),
    mins: String(Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))).padStart(2, '0'),
    secs: String(Math.floor((diff % (1000 * 60)) / 1000)).padStart(2, '0')
  };
}

let giveawayTimerInterval = null;

export function renderGiveawayPage(container) {
  if (giveawayTimerInterval) {
    clearInterval(giveawayTimerInterval);
    giveawayTimerInterval = null;
  }

  const { effortWinner, spinWinner1, spinWinner2, participants } = GIVEAWAY_CONFIG;
  const targetTimestamp = getTonight10PmISTTimestamp();

  // Pre-calculate exact digits before innerHTML to prevent the '00' flash
  const initial = getInitialTimeRemaining(targetTimestamp);

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
          <div class="digit-col"><span id="cd-hours">${initial.hours}</span><label>Hours</label></div>
          <div class="digit-divider">:</div>
          <div class="digit-col"><span id="cd-mins">${initial.mins}</span><label>Minutes</label></div>
          <div class="digit-divider">:</div>
          <div class="digit-col"><span id="cd-secs">${initial.secs}</span><label>Seconds</label></div>
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

  function buildReel(items) {
    if (!slotStrip) return;
    slotStrip.innerHTML = '';

    // Placeholder resting card shown at index 0 before the draw starts
    const initialCover = document.createElement('div');
    initialCover.className = 'slot-item placeholder-cover';
    initialCover.innerHTML = '✨ <span>LUCKY REEL</span> ✨';
    slotStrip.appendChild(initialCover);

    const repeated = [...items, ...items, ...items, ...items];
    repeated.forEach((handle) => {
      const el = document.createElement('div');
      el.className = 'slot-item';
      el.textContent = handle;
      slotStrip.appendChild(el);
    });
  }

  buildReel(participants);

  function rollToWinner(targetWinner, durationMs = 5200) {
    return new Promise((resolve) => {
      if (!slotStrip) return resolve();
      const pool = participants;
      const idx = pool.indexOf(targetWinner);
      const safeIdx = idx !== -1 ? idx : 0;

      // 1 (placeholder cover) + (pool.length * 2) + safeIdx
      const targetIndex = 1 + (pool.length * 2) + safeIdx;
      const targetY = -(targetIndex * ITEM_HEIGHT);

      slotStrip.style.transition = `transform ${durationMs}ms cubic-bezier(0.12, 0.8, 0.18, 1)`;
      slotStrip.style.transform = `translateY(${targetY}px)`;

      setTimeout(() => {
        spawnGoldenConfetti();
        resolve();
      }, durationMs + 200);
    });
  }

  let ceremonyStarted = false;
  async function startAutomatedCeremony() {
    if (ceremonyStarted) return;
    ceremonyStarted = true;

    if (effortLockShield) effortLockShield.style.display = 'none';
    if (effortCard) {
      effortCard.classList.remove('locked-state');
      effortCard.classList.add('pulse-gold');
    }

    if (reelBadge) reelBadge.innerText = 'LUCKY DRAW · SELECTING WINNER #2...';
    if (reelStatus) reelStatus.innerText = 'Reel spinning now for Winner #2...';

    await new Promise(r => setTimeout(r, 2000));

    await rollToWinner(spinWinner1);
    if (reelStatus) {
      reelStatus.innerHTML = `🎉 Winner #2 Selected: <strong style="color: #dfb15b;">${spinWinner1}</strong>!`;
    }

    await new Promise(r => setTimeout(r, 3500));

    if (slotStrip) {
      slotStrip.style.transition = 'none';
      slotStrip.style.transform = 'translateY(0px)';
    }
    if (reelBadge) reelBadge.innerText = 'LUCKY DRAW · SELECTING FINAL WINNER #3...';
    if (reelStatus) reelStatus.innerText = 'Reel spinning now for Winner #3...';

    await new Promise(r => setTimeout(r, 1000));

    await rollToWinner(spinWinner2);
    if (reelStatus) {
      reelStatus.innerHTML = `🎉 Winner #3 Selected: <strong style="color: #dfb15b;">${spinWinner2}</strong>!`;
    }

    await new Promise(r => setTimeout(r, 3500));

    if (stage) stage.classList.add('fade-out');
    setTimeout(() => {
      if (stage) stage.style.display = 'none';
      if (grandPodium) {
        grandPodium.classList.remove('hidden');
        grandPodium.classList.add('fade-in');
      }
      spawnGoldenConfetti();
    }, 600);
  }

  // Timer Tick Function
  function updateTimerDisplay() {
    const diff = targetTimestamp - getCorrectedNow();

    if (diff <= 0) {
      if (giveawayTimerInterval) {
        clearInterval(giveawayTimerInterval);
        giveawayTimerInterval = null;
      }
      
      const timerBox = document.getElementById('giveaway-timer-box');
      if (timerBox) {
        timerBox.innerHTML = `
          <div class="live-broadcast-banner">🚨 10:00 PM IST · LIVE CEREMONY RUNNING 🚨</div>
        `;
      }
      startAutomatedCeremony();
    } else {
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diff % (1000 * 60)) / 1000);

      const elHours = document.getElementById('cd-hours');
      const elMins = document.getElementById('cd-mins');
      const elSecs = document.getElementById('cd-secs');

      if (elHours && elMins && elSecs) {
        elHours.textContent = String(hours).padStart(2, '0');
        elMins.textContent = String(mins).padStart(2, '0');
        elSecs.textContent = String(secs).padStart(2, '0');
      }
    }
  }

  // Immediately render current time, sync clock in background, and start interval
  updateTimerDisplay();
  giveawayTimerInterval = setInterval(updateTimerDisplay, 1000);

  syncWithServerClock().then(() => {
    updateTimerDisplay();
  });
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