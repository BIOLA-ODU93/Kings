// About page (Figma "08 · About v2 — fixes" 1581:417): nav, menu, FAQ. The landing page's v2.js is not loaded here.
import { icon } from './icons.js';

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
$$('[data-icon]').forEach((el) => { el.innerHTML = icon(el.dataset.icon, +el.dataset.size || 18); });

// menu
const menu = $('#menu');
const menuBtn = $('[data-menu-open]');
$$('.menu__list a').forEach((a, i) => a.style.setProperty('--i', i));
function setMenu(open) {
  menu.hidden = !open;
  menuBtn.setAttribute('aria-expanded', String(open));
  document.body.style.overflow = open ? 'hidden' : '';
  (open ? $('.menu__list a', menu) : menuBtn).focus();
}
menuBtn.addEventListener('click', () => setMenu(true));
$('[data-menu-close]').addEventListener('click', () => setMenu(false));
menu.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
addEventListener('keydown', (e) => { if (e.key === 'Escape' && !menu.hidden) setMenu(false); });

// nav: full at the top, floating pill once you scroll; lighter over white sections
const nav = $('.nav');
const light = $$('.s2--white, .s2--paper');
let ticking = false;
function onScroll() {
  ticking = false;
  nav.classList.toggle('is-compact', scrollY > 40);
  const y = nav.getBoundingClientRect().top + 34;
  nav.classList.toggle('is-light', light.some((s) => { const r = s.getBoundingClientRect(); return r.top <= y && r.bottom >= y; }));
}
addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
onScroll();

// FAQ accordion, one open at a time
const list = $('[data-faq]');
list?.addEventListener('click', (e) => {
  const q = e.target.closest('.faq__q');
  if (!q) return;
  const item = q.closest('.faq__item');
  const open = !item.classList.contains('is-open');
  $$('.faq__item', list).forEach((it) => {
    const on = it === item && open;
    it.classList.toggle('is-open', on);
    $('.faq__q', it).setAttribute('aria-expanded', on);
    $('.faq__a', it).inert = !on;
  });
});

// ---------------------------------------------------------------- who we stand for: a soft fade, word by word, on arrival
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const stand = $('[data-words]');
if (stand) {
  const KEY = new Set(['heaven.', 'people', 'family', 'nations.']);
  stand.innerHTML = stand.textContent.trim().split(/\s+/).map((w) => `<span class="w${KEY.has(w) ? ' is-key' : ''}">${w}</span>`).join(' ');
  const words = $$('.w', stand);
  if (reduce) words.forEach((w) => w.classList.add('is-on'));
  else words.forEach((w, i) => setTimeout(() => w.classList.add('is-on'), 350 + i * 85));
}

// ---------------------------------------------------------------- the rest builds as you reach it
const reveals = $$('[data-reveal]');
if (reduce || !('IntersectionObserver' in window)) reveals.forEach((el) => el.classList.add('is-in'));
else {
  const io = new IntersectionObserver((entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -12% 0px' });
  reveals.forEach((el) => io.observe(el));
}

// ---------------------------------------------------------------- pastor: read more
const moreBtn = $('[data-pastor-more]');
moreBtn?.addEventListener('click', () => {
  const panel = $('#pastor-more');
  const open = panel.hidden;
  panel.hidden = !open;
  moreBtn.setAttribute('aria-expanded', String(open));
  moreBtn.textContent = open ? 'Read less' : 'Read more';
});

// ---------------------------------------------------------------- the vision: one pinned scene
// 0–.12 the mission · .12–.22 it lifts to the top · .24–.78 each line takes the room · .8–.9 all three settle into a row
const vision = $('#vision');
if (vision && !reduce) {
  document.documentElement.classList.add('vmove');
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t); };
  const head = $('[data-vhead]'), lines = $$('[data-vlines] li'), sum = $('[data-vsum]');
  const meter = $('[data-vmeter]'), bar = $('[data-vbar]'), count = $('[data-vcount]'), cue = $('[data-vcue]');
  const narrow = matchMedia('(max-width: 720px)');
  const centres = [0.34, 0.5, 0.66];
  let queued = false;
  const tick = () => {
    queued = false;
    const r = vision.getBoundingClientRect();
    if (r.bottom < 0 || r.top > innerHeight) return;
    const p = clamp(-r.top / (r.height - innerHeight));
    // the mission: centred → small, just under the nav → back down, larger, above the three pillars
    const lift = smooth(0.12, 0.22, p), settle = smooth(0.8, 0.9, p);
    const H = innerHeight, h = head.offsetHeight, n = narrow.matches;
    const centreTop = H / 2 - h / 2;
    const liftTop = n ? 96 : 104, liftScale = n ? 0.6 : 0.45;
    const endTop = n ? 92 : H * 0.16, endScale = n ? 0.62 : 0.8;
    const top = lift < 1 ? centreTop + (liftTop - centreTop) * lift : liftTop + (endTop - liftTop) * settle;
    const scale = lift < 1 ? 1 + (liftScale - 1) * lift : liftScale + (endScale - liftScale) * settle;
    head.style.transform = `translate(-50%, ${(top - H / 2).toFixed(1)}px) scale(${scale.toFixed(4)})`;
    head.style.opacity = (1 - lift * 0.5 + settle * 0.5).toFixed(3);
    let current = 0;
    lines.forEach((li, i) => {
      const c = centres[i];
      const o = smooth(c - 0.1, c - 0.03, p) * (1 - smooth(c + 0.05, c + 0.1, p));
      if (o > 0.5) current = i;
      li.style.opacity = o.toFixed(3);
      const dir = p < c ? 1 : -1;
      li.style.transform = `translate(-50%, calc(-50% + ${((1 - o) * 46 * dir).toFixed(1)}px))`;
    });
    if (p > centres[2]) current = 2;
    const s = smooth(0.8, 0.9, p);
    sum.style.opacity = s.toFixed(3);
    sum.style.transform = `translateX(-50%) translateY(${((1 - s) * 30).toFixed(1)}px)`;
    const m = smooth(0.2, 0.26, p) * (1 - smooth(0.78, 0.82, p));
    meter.style.opacity = m.toFixed(3);
    bar.style.setProperty('--v', smooth(0.24, 0.76, p).toFixed(4));
    count.textContent = `0${current + 1} / 03`;
    cue.style.opacity = (1 - smooth(0.02, 0.08, p)).toFixed(3);
  };
  const queue = () => { if (!queued) { queued = true; requestAnimationFrame(tick); } };
  addEventListener('scroll', queue, { passive: true });
  addEventListener('resize', queue);
  tick();
}
