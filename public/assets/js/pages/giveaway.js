/**
 * ShazNest Grand Giveaway - 10-Second Test Countdown & Reveal Reel
 * Route: #giveaway
 */

export const GIVEAWAY_CONFIG = {
  effortWinner: {
    handle: '@Fahmi._f',
    reason: 'Awarded for active engagement, thoughtful comments, and sharing our launch!'
  },
  spinWinner1: '@sm48697',
  spinWinner2: '@littlelazyloopz.andmore',

  participants: [
    '@Syeda_kulsum1542',
    '@raifarahman12',
    '@rizwanazu_jalal',
    '@ayesha_6_66',
    '@crush_on_red_blue',
    '@fas_zafi_',
    '@medico_student_',
    '@andleeb424',
    '@rifaya_irsath',
    '@suh.xana',
    '@ugcbyzhra',
    '@littlelazyloopz.andmore',
    '@shaazna06',
    '@ugc_girl_07',
    '@lumora_invites',
    '@thasleafzii',
    '@littlehearts9999',
    '@zainabbb_09',
    '@tm_kin_17',
    '@yasmin_nasar_',
    '@farheen_1105',
    '@hb_zarru_2007',
    '@self.care356',
    '@mrsfaizan1094',
    '@haji_mohamed_02_',
    '@sm48697',
    '@shaikhsalmashahid',
    '@radha_subramaniam2',
    '@_bis_mi_02',
    '@firdose_2911',
    '@_jumanah.parveen_'
  ]
};

let giveawayTimerInterval = null;

export function renderGiveawayPage(container) {
  if (giveawayTimerInterval) {
    clearInterval(giveawayTimerInterval);
    giveawayTimerInterval = null;
  }

  const { effortWinner, spinWinner1, spinWinner2, participants } = GIVEAWAY_CONFIG;

  // Set a fresh 10-second countdown from right now for recording purposes
  const testTargetTimestamp = Date.now() + 10000;

  container.innerHTML = `
    <div class="grand-giveaway-container">
      <div class="ambient-gold-orb orb-1"></div>
      <div class="ambient-gold-orb orb-2"></div>

      <!-- Header Section -->
      <div class="grand-header">
        <div class="royal-tag">SHAZNEST EXCLUSIVE</div>
        <h1 class="grand-title">Grand Giveaway Reveal</h1>
        <p class="grand-tagline">3 Exclusive Gifts: Hijab Combo · Accessories Set · DIY Painting Kit</p>
        <div class="participant-counter-pill">
          ✨ <strong>${participants.length}</strong> Verified Entrants in Tonight's Ceremony
        </div>
      </div>

      <!-- Live Broadcast / Timer Box -->
      <div id="giveaway-timer-box" class="royal-timer-box">
        <p class="timer-headline">AUTOMATED CEREMONY COMMENCES SHORTLY</p>
        <div class="timer-digits">
          <div class="digit-col"><span id="cd-hours">00</span><label>Hours</label></div>
          <div class="digit-divider">:</div>
          <div class="digit-col"><span id="cd-mins">00</span><label>Minutes</label></div>
          <div class="digit-divider">:</div>
          <div class="digit-col"><span id="cd-secs">10</span><label>Seconds</label></div>
        </div>
      </div>

      <!-- VIP Verified Entrants Marquee -->
      <div class="participants-ticker-wrap">
        <div class="ticker-badge">VERIFIED ENTRANTS</div>
        <div class="ticker-track-container">
          <div class="ticker-track">
            ${participants.concat(participants).map(handle => `<span class="ticker-handle">${handle}</span>`).join('')}
          </div>
        </div>
      </div>

      <!-- STAGE AREA -->
      <div id="giveaway-stage" class="giveaway-stage">
        
        <!-- WINNER 1: EFFORT -->
        <div id="effort-card" class="award-card effort-card locked-state">
          <div class="lock-shield" id="effort-lock-shield">
            <span>🔒 Unlocks Automatically</span>
          </div>
          <div class="card-crown">👑</div>
          <span class="card-tier">WINNER #1 · BEST ENGAGEMENT & EFFORT</span>
          <h3 class="card-handle">${effortWinner.handle}</h3>
          <p class="card-reason">${effortWinner.reason}</p>
        </div>

        <!-- WINNERS 2 & 3: LUXURY RAFFLE REEL -->
        <div class="raffle-machine-wrapper">
          <div class="reel-badge" id="reel-badge">LUCKY DRAW · PREPARING REEL</div>
          <p class="reel-status" id="reel-status">Waiting to start automated draw...</p>

          <div class="slot-window">
            <div class="slot-pointer left">▶</div>
            <div class="slot-pointer right">◀</div>
            <div class="slot-strip" id="slot-strip"></div>
          </div>

          <div class="live-ticker" id="live-ticker">● LIVE DRAW AUTOMATION ACTIVE</div>
        </div>
      </div>

      <!-- FINAL PODIUM -->
      <div id="grand-podium" class="grand-podium hidden">
        <div class="podium-sparkle">💐 👑 💐</div>
        <h2 class="podium-title">Congratulations to Our 3 Winners!</h2>
        <p class="podium-sub">Thank you to everyone who participated in our community launch giveaway.</p>

         <div class="podium-grid">
          <!-- Winner 1 -->
          <div class="podium-card gold-glow">
            <span class="p-rank">🏆 Winner #1 (Effort)</span>
            <div style="color: #dfb15b; font-size: 0.8rem; font-weight: 700; margin: 4px 0;">🎁 THE HIJAB COMBO</div>
            <h3 class="p-name">${effortWinner.handle}</h3>
            <p class="p-note">Community Champion</p>
          </div>

          <!-- Winner 2 -->
          <div class="podium-card gold-glow highlight">
            <span class="p-rank">✨ Winner #2 (Spin 1)</span>
            <div style="color: #dfb15b; font-size: 0.8rem; font-weight: 700; margin: 4px 0;">🎁 THE ACCESSORIES SET</div>
            <h3 class="p-name" id="final-spin-1">${spinWinner1}</h3>
            <p class="p-note">Lucky Draw Winner</p>
          </div>

          <!-- Winner 3 -->
          <div class="podium-card gold-glow">
            <span class="p-rank">✨ Winner #3 (Spin 2)</span>
            <div style="color: #dfb15b; font-size: 0.8rem; font-weight: 700; margin: 4px 0;">🎁 THE DIY PAINTING KIT</div>
            <h3 class="p-name" id="final-spin-2">${spinWinner2}</h3>
            <p class="p-note">Lucky Draw Winner</p>
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

  function rollToWinner(targetWinner, durationMs = 3500) {
    return new Promise((resolve) => {
      if (!slotStrip) return resolve();
      const pool = participants;
      const idx = pool.indexOf(targetWinner);
      const safeIdx = idx !== -1 ? idx : 0;

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

    // 1. Reveal Effort Winner
    if (effortLockShield) effortLockShield.style.display = 'none';
    if (effortCard) {
      effortCard.classList.remove('locked-state');
      effortCard.classList.add('pulse-gold');
    }

    if (reelBadge) reelBadge.innerText = 'LUCKY DRAW · SELECTING WINNER #2...';
    if (reelStatus) reelStatus.innerText = 'Reel spinning now for Winner #2...';

    await new Promise(r => setTimeout(r, 1500));

    // 2. Roll for Spin Winner 1
    await rollToWinner(spinWinner1);
    if (reelStatus) {
      reelStatus.innerHTML = `🎉 Winner #2 Selected: <strong style="color: #dfb15b;">${spinWinner1}</strong>!`;
    }

    await new Promise(r => setTimeout(r, 2000));

    // 3. Reset Reel for Winner #3
    if (slotStrip) {
      slotStrip.style.transition = 'none';
      slotStrip.style.transform = 'translateY(0px)';
    }
    if (reelBadge) reelBadge.innerText = 'LUCKY DRAW · SELECTING FINAL WINNER #3...';
    if (reelStatus) reelStatus.innerText = 'Reel spinning now for Winner #3...';

    await new Promise(r => setTimeout(r, 800));

    // 4. Roll for Spin Winner 2
    await rollToWinner(spinWinner2);
    if (reelStatus) {
      reelStatus.innerHTML = `🎉 Winner #3 Selected: <strong style="color: #dfb15b;">${spinWinner2}</strong>!`;
    }

    await new Promise(r => setTimeout(r, 2000));

    // 5. Reveal Podium
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

  // 10-Second Timer Tick
  function updateTimerDisplay() {
    const diff = Math.max(0, testTargetTimestamp - Date.now());

    if (diff <= 0) {
      if (giveawayTimerInterval) {
        clearInterval(giveawayTimerInterval);
        giveawayTimerInterval = null;
      }
      
      const timerBox = document.getElementById('giveaway-timer-box');
      if (timerBox) {
        timerBox.innerHTML = `
          <div class="live-broadcast-banner">🚨 LIVE CEREMONY RUNNING 🚨</div>
        `;
      }
      startAutomatedCeremony();
    } else {
      const secs = Math.floor(diff / 1000);
      const elSecs = document.getElementById('cd-secs');
      if (elSecs) {
        elSecs.textContent = String(secs).padStart(2, '0');
      }
    }
  }

  updateTimerDisplay();
  giveawayTimerInterval = setInterval(updateTimerDisplay, 1000);
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
