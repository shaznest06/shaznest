/**
 * ShazNest Grand Giveaway Final Results
 * Permanent Podium Display Mode
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

export function renderGiveawayPage(container) {
  const { effortWinner, spinWinner1, spinWinner2, participants } = GIVEAWAY_CONFIG;

  container.innerHTML = `
    <div class="grand-giveaway-container">
      <div class="ambient-gold-orb orb-1"></div>
      <div class="ambient-gold-orb orb-2"></div>

      <!-- Header Section -->
      <div class="grand-header">
        <div class="royal-tag">SHAZNEST EXCLUSIVE</div>
        <h1 class="grand-title">Grand Giveaway Results</h1>
        <p class="grand-tagline">3 Exclusive Gifts: Hijab Combo · Accessories Set · DIY Painting Kit</p>
        <div class="participant-counter-pill">
          ✨ <strong>${participants.length}</strong> Verified Entrants in Tonight's Ceremony
        </div>
      </div>

      <!-- Live Broadcast Banner -->
      <div class="royal-timer-box">
        <div class="live-broadcast-banner">🎉 CEREMONY CONCLUDED · WINNERS ANNOUNCED 🎉</div>
      </div>

      <!-- FINAL PODIUM: Permanently Visible -->
      <div id="grand-podium" class="grand-podium">
        <div class="podium-sparkle">💐 👑 💐</div>
        <h2 class="podium-title">Congratulations to Our 3 Winners!</h2>
        <p class="podium-sub">Thank you to everyone who participated in our community launch giveaway.</p>

        <div class="podium-grid">
          <!-- Winner 1 -->
          <div class="podium-card gold-glow">
            <span class="p-rank">🏆 Winner #1 (Effort)</span>
            <div style="color: #dfb15b; font-size: 0.8rem; font-weight: 700; margin: 4px 0;">🎁 THE HIJAB COMBO</div>
            <h3 class="p-name">${effortWinner.handle}</h3>
            <p class="p-note">${effortWinner.reason}</p>
          </div>

          <!-- Winner 2 -->
          <div class="podium-card gold-glow highlight">
            <span class="p-rank">✨ Winner #2 (Spin 1)</span>
            <div style="color: #dfb15b; font-size: 0.8rem; font-weight: 700; margin: 4px 0;">🎁 THE ACCESSORIES SET</div>
            <h3 class="p-name">${spinWinner1}</h3>
            <p class="p-note">Lucky Draw Winner</p>
          </div>

          <!-- Winner 3 -->
          <div class="podium-card gold-glow">
            <span class="p-rank">✨ Winner #3 (Spin 2)</span>
            <div style="color: #dfb15b; font-size: 0.8rem; font-weight: 700; margin: 4px 0;">🎁 THE DIY PAINTING KIT</div>
            <h3 class="p-name">${spinWinner2}</h3>
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
}
