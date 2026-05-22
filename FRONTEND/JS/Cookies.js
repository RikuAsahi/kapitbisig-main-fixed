  /* ─────────────────────────────────────────
     CONSTANTS & STATE
  ───────────────────────────────────────── */
  const STORAGE_KEY   = 'kb_cookie_consent';
  const STORAGE_PREFS = 'kb_cookie_prefs';

  let toastTimer = null;

  /* ─────────────────────────────────────────
     INIT — show banner on every load until explicit decision
  ───────────────────────────────────────── */
  (function init() {
    const consent = localStorage.getItem(STORAGE_KEY);
    // Show banner if no consent OR if user just dismissed (not made explicit decision)
    if (!consent || consent === 'dismissed') {
      showBanner();
    } else {
      loadPrefsIntoToggles();
    }
  })();

  /* ─────────────────────────────────────────
     BANNER VISIBILITY
  ───────────────────────────────────────── */
  function showBanner() {
    const banner = document.getElementById('kb-cookie-banner');
    banner.removeAttribute('hidden');
    // Tiny delay lets layout settle before animating
    requestAnimationFrame(() => {
      requestAnimationFrame(() => { banner.classList.add('visible'); });
    });
  }

  function hideBanner() {
    const banner = document.getElementById('kb-cookie-banner');
    banner.classList.add('hiding');
    banner.addEventListener('transitionend', () => {
      banner.classList.remove('visible', 'hiding');
      banner.setAttribute('hidden', '');
    }, { once: true });
  }

  function dismissBanner() {
    // Don't save consent when user just closes - banner will show again next time
    hideBanner();
  }

  /* ─────────────────────────────────────────
     ACCEPT ALL (banner)
  ───────────────────────────────────────── */
  function acceptAll() {
    saveConsent({ analytics: true, marketing: true }, 'all');
    setToggles(true, true);
    hideBanner();
    showToast('All cookies accepted. Thank you! 🙏');
  }

  /* ─────────────────────────────────────────
     PREFERENCES MODAL
  ───────────────────────────────────────── */
  function openPreferences() {
    loadPrefsIntoToggles();
    document.getElementById('kb-pref-overlay').classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closePreferences() {
    document.getElementById('kb-pref-overlay').classList.remove('open');
    document.body.style.overflow = '';
  }

  function handlePrefOverlayClick(e) {
    if (e.target === document.getElementById('kb-pref-overlay')) closePreferences();
  }

  function savePreferences() {
    const analytics = document.getElementById('toggle-analytics').checked;
    const marketing = document.getElementById('toggle-marketing').checked;
    saveConsent({ analytics, marketing }, 'custom');
    closePreferences();
    hideBanner();
    showToast('Preferences saved successfully.');
  }

  function acceptAllFromPref() {
    setToggles(true, true);
    saveConsent({ analytics: true, marketing: true }, 'all');
    closePreferences();
    hideBanner();
    showToast('All cookies accepted. Thank you! 🙏');
  }

  function rejectNonEssential() {
    setToggles(false, false);
    saveConsent({ analytics: false, marketing: false }, 'essential');
    closePreferences();
    hideBanner();
    showToast('Non-essential cookies rejected.');
  }

  /* ─────────────────────────────────────────
     PRIVACY / LEARN MORE MODAL
  ───────────────────────────────────────── */
  function openPrivacyModal() {
    document.getElementById('kb-privacy-overlay').classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closePrivacyModal() {
    document.getElementById('kb-privacy-overlay').classList.remove('open');
    document.body.style.overflow = '';
  }

  function handlePrivacyOverlayClick(e) {
    if (e.target === document.getElementById('kb-privacy-overlay')) closePrivacyModal();
  }

  /* ─────────────────────────────────────────
     STORAGE HELPERS
  ───────────────────────────────────────── */
  function saveConsent(prefs, type) {
    const payload = {
      consentType: type,       // 'all' | 'custom' | 'essential' | 'dismissed'
      essential:   true,       // always true
      analytics:   prefs.analytics,
      marketing:   prefs.marketing,
      timestamp:   new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY,   type);
    localStorage.setItem(STORAGE_PREFS, JSON.stringify(payload));
    applyConsent(payload);
  }

  function loadPrefsIntoToggles() {
    const raw = localStorage.getItem(STORAGE_PREFS);
    if (!raw) return;
    try {
      const prefs = JSON.parse(raw);
      document.getElementById('toggle-analytics').checked = !!prefs.analytics;
      document.getElementById('toggle-marketing').checked = !!prefs.marketing;
    } catch(e) {}
  }

  function setToggles(analytics, marketing) {
    document.getElementById('toggle-analytics').checked = analytics;
    document.getElementById('toggle-marketing').checked = marketing;
  }

  /**
   * applyConsent – hook this into your analytics / tag manager.
   * In production, conditionally load scripts here.
   */
  function applyConsent(prefs) {
    console.log('[KapitBisig] Cookie consent applied:', prefs);
    // Example:
    // if (prefs.analytics) { loadGoogleAnalytics(); }
    // if (prefs.marketing) { loadMetaPixel(); }
  }

  /* ─────────────────────────────────────────
     TOAST
  ───────────────────────────────────────── */
  function showToast(msg) {
    const toast = document.getElementById('kb-toast');
    document.getElementById('kb-toast-msg').textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 3200);
  }

  /* ─────────────────────────────────────────
     KEYBOARD: ESC closes open modals
  ───────────────────────────────────────── */
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    closePreferences();
    closePrivacyModal();
    const comingSoonModal = document.querySelector('.coming-soon-modal');
    if (comingSoonModal && comingSoonModal.classList.contains('open')) {
      comingSoonModal.classList.remove('open');
    }
  });