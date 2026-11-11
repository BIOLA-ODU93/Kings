// Shared chrome for the immersive pages: the V2 nav (full bar → floating pill), the menu,
// light/dark tone of whatever sits under the nav and the rail, the FAQ, forms and the message player.
import { icon } from './icons.js';
import { FAQ } from './data.js';

export const $ = (s, el = document) => el.querySelector(s);
export const $$ = (s, el = document) => [...el.querySelectorAll(s)];
export const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t); };
export const root = document.documentElement;
export const moving = !matchMedia('(prefers-reduced-motion: reduce)').matches;
if (moving) root.classList.add('moving');
export const paintIcons = (el = document) => $$('[data-icon]', el).forEach((n) => { n.innerHTML = icon(n.dataset.icon, +n.dataset.size || 18); });

// ---------------------------------------------------------------- menu
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

// ---------------------------------------------------------------- tone under the chrome
// Any element with data-tone="light|dark" counts; the deepest one under a point wins.
const zones = $$('[data-tone]');
export function toneAt(y) {
  let tone = 'dark';
  for (const z of zones) { const r = z.getBoundingClientRect(); if (r.top <= y && r.bottom > y) tone = z.dataset.tone; }
  return tone;
}
const nav = $('.nav');
const rail = $('.rail');
export function updateChrome() {
  nav.classList.toggle('is-compact', scrollY > 40);
  nav.classList.toggle('is-light', toneAt(nav.getBoundingClientRect().top + 34) === 'light');
  if (rail) rail.dataset.tone = toneAt(innerHeight / 2);
}

// ---------------------------------------------------------------- FAQ (one open at a time)
export function renderFAQ(el) {
  if (!el) return;
  el.innerHTML = FAQ.map(([q, a], i) => `<div class="faq__item"><h3><button class="faq__q" type="button" aria-expanded="false" aria-controls="fq-${i}" id="fqb-${i}"><span>${q}</span><span data-icon="caret-circle-down" data-size="20"></span></button></h3><div class="faq__a" id="fq-${i}" role="region" aria-labelledby="fqb-${i}" inert><div><p>${a}</p></div></div></div>`).join('');
  el.addEventListener('click', (e) => {
    const q = e.target.closest('.faq__q'); if (!q) return;
    const item = q.closest('.faq__item'); const open = !item.classList.contains('is-open');
    $$('.faq__item', el).forEach((it) => { const on = it === item && open; it.classList.toggle('is-open', on); $('.faq__q', it).setAttribute('aria-expanded', on); $('.faq__a', it).inert = !on; });
  });
}

// ---------------------------------------------------------------- forms (front end only for now)
export function check(form) {
  let ok = true;
  $$('input[required], textarea[required]', form).forEach((f) => {
    const bad = f.type === 'checkbox' ? !f.checked : f.type === 'email' ? !/^\S+@\S+\.\S+$/.test(f.value.trim()) : !f.value.trim();
    const err = f.type === 'checkbox' ? $('[data-consent-error]', form) : f.closest('.field').querySelector('.field__error');
    if (err) err.hidden = !bad;
    if (f.type !== 'checkbox') { f.classList.toggle('is-invalid', bad); f.setAttribute('aria-invalid', bad); }
    if (bad && ok) { f.focus(); ok = false; }
  });
  return ok;
}

// ---------------------------------------------------------------- message player (youtube-nocookie; plays on the real host)
const player = $('[data-player]');
if (player) {
  const frame = $('[data-player-frame]');
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-play]'); if (!b || !b.dataset.play) return;
    e.preventDefault();
    frame.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${b.dataset.play}?autoplay=1&rel=0&playsinline=1" title="King’s Court message" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>`;
    player.showModal();
  });
  $('[data-player-close]').addEventListener('click', () => player.close());
  player.addEventListener('close', () => { frame.innerHTML = ''; });
}
