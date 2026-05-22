  /* ── SCROLL REVEAL ── */
  const revealEls = document.querySelectorAll('.reveal');
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); revealObserver.unobserve(e.target); } });
  }, { threshold: 0.08 });
  revealEls.forEach(el => revealObserver.observe(el));

  /* ── HAMBURGER / DRAWER ── */
  const hamburger = document.getElementById('hamburger');
  const navDrawer = document.getElementById('navDrawer');
  let drawerOpen = false;
  hamburger.addEventListener('click', () => {
    drawerOpen = !drawerOpen;
    hamburger.classList.toggle('open', drawerOpen);
    navDrawer.classList.toggle('open', drawerOpen);
    hamburger.setAttribute('aria-expanded', String(drawerOpen));
    navDrawer.setAttribute('aria-hidden', String(!drawerOpen));
    document.body.style.overflow = drawerOpen ? 'hidden' : '';
  });
  window.addEventListener('resize', () => { if (window.innerWidth > 768) { drawerOpen = false; hamburger.classList.remove('open'); navDrawer.classList.remove('open'); document.body.style.overflow = ''; } });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && drawerOpen) { drawerOpen = false; hamburger.classList.remove('open'); navDrawer.classList.remove('open'); document.body.style.overflow = ''; } });

  /* ── TOC ACTIVE STATE ── */
  const sections = document.querySelectorAll('.policy-section[id]');
  const tocLinks  = document.querySelectorAll('.toc-list a');
  const tocObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        tocLinks.forEach(a => a.classList.remove('active'));
        const active = document.querySelector(`.toc-list a[href="#${entry.target.id}"]`);
        if (active) active.classList.add('active');
      }
    });
  }, { rootMargin: `-${64 + 32}px 0px -55% 0px`, threshold: 0 });
  sections.forEach(s => tocObserver.observe(s));