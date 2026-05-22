/* Footer social interactions */
(function () {
  const existingModal = document.querySelector('.coming-soon-modal');
  let modalEl = existingModal;

  function ensureModal() {
    if (modalEl) return modalEl;

    const style = document.createElement('style');
    style.textContent =
      '.kb-coming-soon-modal{position:fixed;inset:0;display:none;align-items:center;justify-content:center;background:rgba(8,14,28,.62);backdrop-filter:blur(3px);z-index:9999;padding:20px;}' +
      '.kb-coming-soon-modal.open{display:flex;}' +
      '.kb-coming-soon-box{width:min(440px,100%);background:#ffffff;border-radius:16px;padding:22px;border:1px solid rgba(27,42,74,.12);box-shadow:0 18px 50px rgba(8,14,28,.24);text-align:center;}' +
      '.kb-coming-soon-title{margin:0 0 8px;font-size:22px;color:#1b2a4a;}' +
      '.kb-coming-soon-text{margin:0 0 18px;color:#2f466a;line-height:1.5;font-size:14px;}' +
      '.kb-coming-soon-close{border:0;border-radius:10px;padding:10px 14px;background:#5ba4cf;color:#fff;cursor:pointer;font-weight:600;}';
    document.head.appendChild(style);

    const wrap = document.createElement('div');
    wrap.className = 'kb-coming-soon-modal';
    wrap.setAttribute('aria-hidden', 'true');
    wrap.innerHTML =
      '<div class="kb-coming-soon-box" role="dialog" aria-modal="true" aria-label="Coming soon">' +
      '<h3 class="kb-coming-soon-title">Coming Soon</h3>' +
      '<p class="kb-coming-soon-text">This social channel will be available soon. Thank you for your support.</p>' +
      '<button type="button" class="kb-coming-soon-close">Got It</button>' +
      '</div>';

    wrap.addEventListener('click', function (event) {
      if (event.target === wrap) closeModal();
    });

    wrap.querySelector('.kb-coming-soon-close').addEventListener('click', closeModal);

    document.body.appendChild(wrap);
    modalEl = wrap;
    return modalEl;
  }

  function openModal() {
    const modal = ensureModal();
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    if (!modalEl) return;
    modalEl.classList.remove('open');
    modalEl.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') closeModal();
  });

  window.showComingSoon = openModal;

  document.querySelectorAll('.footer-social-btn, .footer-social a, .social-link').forEach(function (anchor) {
    const href = (anchor.getAttribute('href') || '').trim();
    if (!href || href === '#') {
      anchor.addEventListener('click', function (event) {
        event.preventDefault();
        openModal();
      });
      return;
    }

    if (href.charAt(0) === '#') {
      anchor.addEventListener('click', function (event) {
        const target = document.querySelector(href);
        if (!target) return;
        event.preventDefault();
        target.scrollIntoView({ behavior: 'smooth' });
      });
      return;
    }

    anchor.setAttribute('target', '_blank');
    anchor.setAttribute('rel', 'noopener noreferrer');
  });
})();