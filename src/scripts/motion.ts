import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';

gsap.registerPlugin(ScrollTrigger, SplitText);

const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
let lenis: Lenis | null = null;

function initLenis() {
  if (lenis || reduced()) return;
  lenis = new Lenis({ lerp: 0.11, smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis!.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  (window as any).__lenis = lenis;
}

function reveals() {
  const els = gsap.utils.toArray<HTMLElement>('[data-reveal]');
  if (reduced()) { gsap.set(els, { opacity: 1, y: 0 }); return; }
  els.forEach((el, i) => {
    gsap.fromTo(el, { opacity: 0, y: 18 }, {
      opacity: 1, y: 0, duration: 0.9, ease: 'power3.out',
      delay: parseFloat(el.dataset.revealDelay || '0'),
      scrollTrigger: { id: 'reveal-' + i, trigger: el, start: 'top 90%', once: true },
    });
  });
}

async function heroTitle() {
  const h = document.querySelector<HTMLElement>('.hero-title');
  if (!h) return;
  if (reduced()) { h.style.visibility = 'visible'; return; }
  await document.fonts.ready;
  const split = SplitText.create(h, { type: 'lines', mask: 'lines', linesClass: 'line' });
  h.style.visibility = 'visible';
  gsap.from(split.lines, { yPercent: 108, duration: 1.15, ease: 'power4.out', stagger: 0.09, delay: 0.1 });
}

function page() {
  initLenis();
  heroTitle();
  reveals();
  ScrollTrigger.refresh();
}

document.addEventListener('astro:page-load', page);
document.addEventListener('astro:before-swap', () => { ScrollTrigger.getAll().forEach((t) => t.kill()); });
document.addEventListener('astro:after-swap', () => { lenis?.scrollTo(0, { immediate: true }); });
