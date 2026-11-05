(() => {
  const nav = document.querySelector('.home-page > .quick-nav');
  const header = document.querySelector('.hero .topbar');
  if (!nav || !header) return;
  let pending = false;
  function update() {
    const visible = header.getBoundingClientRect().bottom <= 0;
    nav.classList.toggle('is-visible', visible);
    nav.inert = !visible;
    nav.setAttribute('aria-hidden', String(!visible));
    pending = false;
  }
  function schedule() {
    if (!pending) { pending = true; requestAnimationFrame(update); }
  }
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule, { passive: true });
  window.addEventListener('pageshow', schedule);
  update();
})();
