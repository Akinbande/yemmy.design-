/**
 * Top bar (hides on scroll down), the Layers panel, and the command palette.
 * Re-initialised on every astro:page-load; listeners are scoped to an AbortController.
 */
let ctl: AbortController | null = null;

const FOCUSABLE = 'a[href],button:not([disabled]),input,[tabindex]:not([tabindex="-1"])';

function init() {
  ctl?.abort();
  ctl = new AbortController();
  const { signal } = ctl;

  const nav = document.getElementById('nav');
  const panel = document.getElementById('layers');
  const backdrop = document.getElementById('layers-backdrop');
  const openBtn = document.getElementById('menu-open');
  const closeBtn = document.getElementById('menu-close');
  const palette = document.getElementById('palette');
  const input = document.getElementById('palette-input') as HTMLInputElement | null;
  const list = document.getElementById('palette-list');
  if (!nav || !panel || !backdrop || !openBtn || !closeBtn) return;

  /* ---------- top bar ---------- */
  let last = window.scrollY;
  const onScroll = () => {
    const y = window.scrollY;
    nav.classList.toggle('nav--solid', y > 24);
    last = y;
  };
  window.addEventListener('scroll', onScroll, { passive: true, signal });
  onScroll();

  /* ---------- layers panel ---------- */
  let lastFocus: HTMLElement | null = null;
  const lock = (on: boolean) => {
    document.documentElement.classList.toggle('menu-open', on);
    (window as any).__lenis?.[on ? 'stop' : 'start']?.();
  };
  const open = () => {
    lastFocus = document.activeElement as HTMLElement;
    panel.hidden = false; backdrop.hidden = false;
    requestAnimationFrame(() => { panel.classList.add('is-open'); backdrop.classList.add('is-open'); });
    openBtn.setAttribute('aria-expanded', 'true');
    lock(true);
    (panel.querySelector<HTMLElement>(FOCUSABLE))?.focus();
  };
  const close = () => {
    panel.classList.remove('is-open'); backdrop.classList.remove('is-open');
    openBtn.setAttribute('aria-expanded', 'false');
    lock(false);
    setTimeout(() => { panel.hidden = true; backdrop.hidden = true; }, 320);
    lastFocus?.focus();
  };
  openBtn.addEventListener('click', open, { signal });
  closeBtn.addEventListener('click', close, { signal });
  backdrop.addEventListener('click', close, { signal });
  panel.querySelectorAll('a').forEach((a) => a.addEventListener('click', close, { signal }));
  panel.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab') return;
    const f = [...panel.querySelectorAll<HTMLElement>(FOCUSABLE)];
    if (!f.length) return;
    const first = f[0], lastEl = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); lastEl.focus(); }
    else if (!e.shiftKey && document.activeElement === lastEl) { e.preventDefault(); first.focus(); }
  }, { signal });

  /* ---------- command palette ---------- */
  const items = () => [...(list?.querySelectorAll<HTMLElement>('[data-cmd]') ?? [])];
  let cursor = 0;
  const paint = () => {
    const vis = items().filter((el) => !el.hidden);
    vis.forEach((el, i) => el.classList.toggle('is-active', i === cursor));
  };
  const pOpen = () => {
    if (!palette || !input) return;
    palette.hidden = false; lock(true);
    requestAnimationFrame(() => palette.classList.add('is-open'));
    input.value = ''; items().forEach((el) => (el.hidden = false)); cursor = 0; paint();
    input.focus();
  };
  const pClose = () => {
    if (!palette) return;
    palette.classList.remove('is-open'); lock(false);
    setTimeout(() => (palette.hidden = true), 200);
  };
  input?.addEventListener('input', () => {
    const q = input.value.trim().toLowerCase();
    items().forEach((el) => (el.hidden = q !== '' && !(el.dataset.cmd || '').toLowerCase().includes(q)));
    cursor = 0; paint();
  }, { signal });
  input?.addEventListener('keydown', (e) => {
    const vis = items().filter((el) => !el.hidden);
    if (e.key === 'ArrowDown') { e.preventDefault(); cursor = Math.min(vis.length - 1, cursor + 1); paint(); }
    if (e.key === 'ArrowUp') { e.preventDefault(); cursor = Math.max(0, cursor - 1); paint(); }
    if (e.key === 'Enter') { e.preventDefault(); (vis[cursor]?.querySelector('a') as HTMLAnchorElement | null)?.click(); pClose(); }
  }, { signal });
  palette?.addEventListener('click', (e) => { if (e.target === palette) pClose(); }, { signal });
  list?.querySelectorAll('a').forEach((a) => a.addEventListener('click', pClose, { signal }));

  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      palette?.hidden ? pOpen() : pClose();
    }
    if (e.key === 'Escape') {
      if (palette && !palette.hidden) pClose();
      else if (!panel.hidden) close();
    }
  }, { signal });
}

document.addEventListener('astro:page-load', init);
