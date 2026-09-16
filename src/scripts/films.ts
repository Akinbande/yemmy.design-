/* One loader for every film on the site. The files are served exactly as he exported them; this only decides when
   they load and play, and makes sure a film that stalls recovers on its own instead of waiting for a refresh.

   - Loading starts a screen ahead of the film (preload auto), so it is buffered by the time it arrives.
   - It plays while on screen and rests when off screen or when the tab is hidden.
   - Chrome pauses muted background video to save power and rejects play(); the old handlers swallowed that and never
     tried again, which left a card frozen on its poster. Here every pause, visibility change and canplay re-checks
     what the film should be doing, and a watchdog reloads a film that has not started a few seconds after asking.
   - A film can carry its file in `data-src` so nothing is fetched until it is near; `src` or <source> works too.
   - Reduced motion keeps the poster and gives the viewer controls. */

type Options = { threshold?: number };

let cleanups: Array<() => void> = [];

export function films(selector: string, { threshold = 0.25 }: Options = {}) {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  document.querySelectorAll<HTMLVideoElement>(selector).forEach((v) => {
    if (v.dataset.filmInit) return;
    v.dataset.filmInit = '1';

    const attach = () => {
      if (v.dataset.src && !v.getAttribute('src')) v.src = v.dataset.src;
      if (v.preload !== 'auto') v.preload = 'auto';
    };

    if (reduced) {
      v.removeAttribute('autoplay');
      v.pause();
      attach();
      v.controls = true;
      return;
    }
    v.removeAttribute('autoplay');   // the loader decides when it plays

    let inView = false;
    let timer = 0;
    let strikes = 0;
    const want = () => inView && document.visibilityState === 'visible';
    const moving = () => !v.paused && v.readyState >= 3;

    const sync = () => {
      clearTimeout(timer);
      if (!want()) { if (!v.paused) v.pause(); return; }
      attach();
      if (moving()) { strikes = 0; return; }
      v.play().then(() => { strikes = 0; }).catch(() => {});
      // watchdog: asked to play but still not moving, so try again; the second miss reloads the file from where it was
      timer = window.setTimeout(() => {
        if (!want() || moving()) return;
        if (++strikes >= 2) {
          strikes = 0;
          const at = v.currentTime;
          v.load();
          if (at > 0) v.addEventListener('loadedmetadata', () => { v.currentTime = at; }, { once: true });
        }
        sync();
      }, 3500);
    };

    const near = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { attach(); near.disconnect(); } }, { rootMargin: '100% 0px' });
    const seen = new IntersectionObserver((es) => { inView = es[es.length - 1].isIntersecting; sync(); }, { threshold });
    near.observe(v);
    seen.observe(v);

    const onPause = () => { if (want()) { clearTimeout(timer); timer = window.setTimeout(sync, 400); } };
    v.addEventListener('canplay', sync);
    v.addEventListener('pause', onPause);
    document.addEventListener('visibilitychange', sync);
    window.addEventListener('pageshow', sync);

    cleanups.push(() => {
      clearTimeout(timer);
      near.disconnect();
      seen.disconnect();
      v.removeEventListener('canplay', sync);
      v.removeEventListener('pause', onPause);
      document.removeEventListener('visibilitychange', sync);
      window.removeEventListener('pageshow', sync);
    });
  });
}

document.addEventListener('astro:before-swap', () => { cleanups.forEach((c) => c()); cleanups = []; });
