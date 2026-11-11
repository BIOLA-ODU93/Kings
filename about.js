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
