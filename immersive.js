// A Sunday at King's Court: one scroll from the doors opening (9:40am) to the doors closing (12:30pm).
import { icon } from './icons.js';

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t); };
const root = document.documentElement;
const moving = !matchMedia('(prefers-reduced-motion: reduce)').matches;
if (moving) root.classList.add('moving');

const paintIcons = (el = document) => $$('[data-icon]', el).forEach((n) => { n.innerHTML = icon(n.dataset.icon, +n.dataset.size || 18); });

// ---------------------------------------------------------------- content (same real data as V2)
const PHOTOS = [
  { src: 'assets/web/family-4.jpg', title: 'The choir ministering', w: 3, h: 2 },
  { src: 'assets/web/about-pastor.jpg', title: 'Arms open in worship', w: 2, h: 3 },
  { src: 'assets/web/service-family.jpg', title: 'Sunday family service', w: 2, h: 3 },
  { src: 'assets/web/about-worship.jpg', title: 'Hands lifted in prayer', w: 2, h: 3 },
  { src: 'assets/web/family-2.jpg', title: 'Hugs after the service', w: 2, h: 3 },
  { src: 'assets/v2/vigil-stage.jpg', title: 'The Word from the stage', w: 3, h: 2 },
  { src: 'assets/web/family-3.jpg', title: 'Sunday colours', w: 2, h: 3 },
  { src: 'assets/web/service-youth.jpg', title: 'Youth service', w: 2, h: 3 },
  { src: 'assets/v2/morning-glory.jpg', title: 'Morning Glory prayer', w: 2, h: 3 },
  { src: 'assets/web/family-1.jpg', title: 'A family on stage', w: 2, h: 3 },
  { src: 'assets/web/service-faith-clinic.jpg', title: 'Faith Clinic', w: 4, h: 5 },
  { src: 'assets/web/service-digging.jpg', title: 'Digging Deep, Bible study', w: 2, h: 3 },
];
const SERMONS = [
  { id: 'PMCBURcHvSE', title: 'Sunday Service', date: 'Sun 8 Nov', length: '1h 36m' },
  { id: 'eltJR2Sjcao', title: 'November Thanksgiving Service', date: 'Sun 1 Nov', length: '1h 55m' },
  { id: 'bsazduuln2Q', title: 'Overcomers · YAYA Week', date: 'Sat 31 Oct', length: '3h 7m' },
  { id: 'A-3Di9ttFnY', title: 'Sunday Service', date: 'Sun 25 Oct', length: '2h 0m' },
  { id: 'N_QbH4anhiE', title: 'Sunday Service', date: 'Sun 18 Oct', length: '2h 18m' },
  { id: 'JakUOcI7j6c', title: 'Sunday Service', date: 'Sun 11 Oct', length: '1h 41m' },
];
const TIMES = [
  { what: 'Sunday Family Service', when: 'Every Sunday · 10:00am – 12:30pm (doors 9:40am)' },
  { what: 'Digging Deep · Bible study', when: 'Wednesdays · 6:30 – 7:30pm on Zoom' },
  { what: 'Youth Service', when: 'Thursdays · 6:30 – 7:30pm on Zoom' },
  { what: 'Faith Clinic · Prayer', when: 'Fridays · 6:30 – 7:30pm on Zoom' },
  { what: 'Morning Glory', when: 'First Friday of the month · 5:30 – 6:30am' },
];
const BANK = [
  { label: 'Account name', value: 'RCCG King’s Court' },
  { label: 'IBAN', value: '[IBAN to confirm]' },
  { label: 'Bank name', value: '[Bank name]' },
  { label: 'BIC / SWIFT', value: '[BIC to confirm]' },
];
const FAQ = [
  ['Is there parking available?', '[Free on-site parking at the church. Overflow parking on X Road.]'],
  ['Do you offer programs for children and youth?', 'Yes. Children’s church runs during the Sunday service for ages [3–12]. Young people have their own Youth Service every Thursday, 6:30 – 7:30pm.'],
  ['What should I wear?', 'Come as you are. You’ll see everything from suits to jeans.'],
  ['Are there volunteer opportunities?', 'Yes. Behind every Sunday is a family that serves. Tap “Join us now” and we’ll help you find a team.'],
  ['Do you offer counseling or prayer support?', 'Yes. Send a prayer request above and we’ll stand with you in prayer. Counselling, including marriage counselling, is also available [how to book].'],
];

// ---------------------------------------------------------------- render
const praise = $('[data-praise]');
praise.innerHTML = PHOTOS.map((p, i) => `<button class="praise__photo" type="button" data-open-viewer="${i}" style="--ar:${p.w}/${p.h};--w:${p.w > p.h ? 22 : 15}vw" aria-label="Open photo: ${p.title}"><img src="${p.src}" alt="" loading="lazy" decoding="async" /></button>`).join('');
const photos = $$('.praise__photo', praise);

const [latest, ...older] = SERMONS;
const thumb = (v) => `assets/v2/yt-${v}.jpg`;
$('[data-screen-img]').src = thumb(latest.id);
$('[data-screen-date]').textContent = `Latest · ${latest.date} · ${latest.length}`;
$('[data-screen-title]').textContent = latest.title;
$('[data-play]').dataset.play = latest.id;
$('[data-strip]').innerHTML = older.map((s) => `<li><button type="button" data-play="${s.id}" aria-label="Play ${s.title}, ${s.date}"><img src="${thumb(s.id)}" alt="" loading="lazy" /><span><b>${s.title}</b><span>${s.date} · ${s.length}</span></span></button></li>`).join('');

$('[data-times]').innerHTML = TIMES.map((t) => `<li><b>${t.what}</b><span>${t.when}</span></li>`).join('');
$('[data-faq]').innerHTML = FAQ.map(([q, a], i) => `<div class="faq__item"><h4><button class="faq__q" type="button" aria-expanded="false" aria-controls="fq-${i}" id="fqb-${i}"><span>${q}</span><span data-icon="caret-circle-down" data-size="20"></span></button></h4><div class="faq__a" id="fq-${i}" role="region" aria-labelledby="fqb-${i}" inert><div><p>${a}</p></div></div></div>`).join('');
$('[data-faq]').addEventListener('click', (e) => {
  const q = e.target.closest('.faq__q'); if (!q) return;
  const item = q.closest('.faq__item'); const open = !item.classList.contains('is-open');
  $$('.faq__item', item.parentElement).forEach((it) => { const on = it === item && open; it.classList.toggle('is-open', on); $('.faq__q', it).setAttribute('aria-expanded', on); $('.faq__a', it).inert = !on; });
});

$('[data-bank]').innerHTML = BANK.map((f, i) => {
  const pending = f.value.startsWith('[');
  return `<div class="bank__field"><span class="bank__label">${f.label}</span><span class="bank__row"><b id="bk-${i}" class="${pending ? 'is-pending' : ''}">${f.value}</b><button class="bank__copy" type="button" data-copy="${i}" ${pending ? `disabled aria-label="${f.label} not confirmed yet"` : `aria-label="Copy ${f.label}"`}><span data-icon="copy" data-size="20"></span><span class="bank__copied" aria-live="polite"></span></button></span></div>`;
}).join('');
$('[data-bank]').addEventListener('click', async (e) => {
  const b = e.target.closest('[data-copy]'); if (!b || b.disabled) return;
  const note = $('.bank__copied', b);
  try { await navigator.clipboard.writeText(BANK[+b.dataset.copy].value); note.textContent = 'Copied'; }
  catch { const r = document.createRange(); r.selectNodeContents($(`#bk-${b.dataset.copy}`)); getSelection().removeAllRanges(); getSelection().addRange(r); note.textContent = 'Selected'; }
  setTimeout(() => { note.textContent = ''; }, 1600);
});

$$('[data-faces]').forEach((row, r) => {
  const list = r ? [...PHOTOS].reverse() : PHOTOS;
  row.innerHTML = `<div class="faces__track">${[...list, ...list].map((p) => `<img src="${p.src}" alt="" loading="lazy" style="--ar:${p.w}/${p.h}" />`).join('')}</div>`;
});
paintIcons();

// ---------------------------------------------------------------- the walk-in film (72 frames), forwards in, backwards out
const FRAMES = 72;
const frames = Array.from({ length: FRAMES }, () => null);
const filmIn = $('[data-film="in"]');
const filmOut = $('[data-film="out"]');
const poster = $('.film__poster');
function loadFrames() {
  let next = 0;
  const pump = () => {
    if (next >= FRAMES) return;
    const i = next++;
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => { frames[i] = img; if (i === 0) { poster.classList.add('is-ready'); tick(); } pump(); };
    img.onerror = pump;
    img.src = `assets/walkin/f${String(i).padStart(3, '0')}.jpg`;
  };
  for (let k = 0; k < 4; k++) pump();
}
function nearest(i) { for (let d = 0; d < FRAMES; d++) { if (frames[i - d]) return frames[i - d]; if (frames[i + d]) return frames[i + d]; } return null; }
function sizeCanvas(c) {
  const dpr = Math.min(devicePixelRatio || 1, 2);
  const w = Math.round(c.clientWidth * dpr), h = Math.round(c.clientHeight * dpr);
  if (c.width !== w || c.height !== h) { c.width = w; c.height = h; }
}
function drawFilm(c, f, fx, fy, zoom) {
  const img = nearest(clamp(Math.round(f), 0, FRAMES - 1));
  if (!img) return;
  sizeCanvas(c);
  const W = c.width, H = c.height;
  const s = Math.max(W / img.width, H / img.height) * zoom;
  const dw = img.width * s, dh = img.height * s;
  const x = clamp(W / 2 - fx * dw, W - dw, 0), y = clamp(H / 2 - fy * dh, H - dh, 0);
  const ctx = c.getContext('2d');
  ctx.drawImage(img, x, y, dw, dh);
}
const SEAT = { x: 0.665, y: 0.8 };

// ---------------------------------------------------------------- scroll engine
const scenes = $$('[data-scene]');
const COLORS = { doors: '#0b0718', praise: '#140b3c', word: '#07051a', prayer: '#e6ddf7', offering: '#f3effa', fellowship: '#fdfcff', sent: '#0b0718' };
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const mix = (a, b, t) => a.map((v, i) => Math.round(lerp(v, b[i], t)));
const lum = ([r, g, b]) => (0.299 * r + 0.587 * g + 0.114 * b) / 255;
const railLinks = $$('[data-rail]');
const nowLabel = $('[data-now-label]');
const progressBar = $('[data-progress]');
const screen = $('[data-screen]');

// progress through a pinned block: 0 when its top meets the viewport top, 1 when its bottom meets the viewport bottom
const pinP = (el) => { const r = el.getBoundingClientRect(); const run = r.height - innerHeight; return run > 0 ? clamp(-r.top / run) : (r.top < 0 ? 1 : 0); };
function fades(scope, p) {
  $$('[data-fade]', scope).forEach((el) => {
    const [a, b] = el.dataset.fade.split(' ').map(Number);
    el.style.opacity = (a <= 0 ? 1 : smooth(a - 0.08, a, p)) * (b > 1 ? 1 : 1 - smooth(b - 0.08, b, p));
  });
}

scenes.forEach((sc, i) => {
  const own = COLORS[sc.dataset.scene];
  const prev = i ? COLORS[scenes[i - 1].dataset.scene] : own;
  sc.style.background = `linear-gradient(180deg, ${prev} 0, ${own} 200px) ${own}`;
});

let queued = false;
function tick() {
  queued = false;
  const H = innerHeight, mid = H / 2;

  // which scene is under a given screen height
  const sceneAt = (y) => scenes.find((sc) => { const r = sc.getBoundingClientRect(); return r.top <= y && r.bottom > y; }) || scenes[scenes.length - 1];
  const active = sceneAt(mid);
  // chrome (bar at the top, rail in the middle) flips to ink over the light scenes
  const ink = (sc) => (lum(hex(COLORS[sc.dataset.scene])) > 0.55 ? '#0d0d0d' : '#ffffff');
  root.style.setProperty('--chrome', ink(sceneAt(40)));
  const lightTop = ink(sceneAt(40)) !== '#ffffff';
  root.style.setProperty('--bar-bg', lightTop ? 'rgba(246, 242, 252, 0.82)' : 'linear-gradient(180deg, rgba(5, 3, 14, 0.5), rgba(5, 3, 14, 0))');
  root.style.setProperty('--bar-blur', lightTop ? 'blur(14px)' : 'none');
  root.style.setProperty('--rail', ink(active));
  const id = active.dataset.scene;
  railLinks.forEach((a) => { const on = a.dataset.rail === id; a.classList.toggle('is-active', on); if (on) a.setAttribute('aria-current', 'step'); else a.removeAttribute('aria-current'); });
  if (nowLabel.textContent !== active.dataset.label) nowLabel.textContent = active.dataset.label;
  progressBar.style.setProperty('--done', clamp(scrollY / (root.scrollHeight - H)));

  if (!moving) return;
  const narrow = innerWidth < 720;

  // 1 · doors: walk in from the foyer to the seat
  const doors = scenes[0];
  const pd = pinP(doors);
  if (doors.getBoundingClientRect().bottom > 0) {
    const t = smooth(0, 0.86, pd);
    drawFilm(filmIn, t * (FRAMES - 1), lerp(0.5, SEAT.x, smooth(0.55, 1, pd)), lerp(0.5, SEAT.y, smooth(0.55, 1, pd)), lerp(1, narrow ? 1.04 : 1.12, t));
  }
  fades(doors, pd);

  // 2 · praise: photos rise out of the dark and pass you
  const pp = pinP($('#praise'));
  const N = photos.length;
  photos.forEach((el, k) => {
    const t = pp * 1.5 - k / N + 0.25;
    const a = k * 2.399; // golden angle keeps them spread out
    const spreadX = narrow ? 30 : 34, spreadY = narrow ? 26 : 30;
    const x = Math.cos(a) * (8 + t * spreadX), y = Math.sin(a) * (6 + t * spreadY);
    const s = (narrow ? 1.9 : 1) * (0.35 + t * 1.05);
    el.style.transform = `translate(-50%, -50%) translate3d(${x}vw, ${y}vh, 0) scale(${s})`;
    el.style.opacity = smooth(0, 0.16, t) * (1 - smooth(0.92, 1.2, t));
    el.style.zIndex = Math.round(t * 100);
    el.style.pointerEvents = t > 0.05 && t < 1.05 ? 'auto' : 'none';
  });

  // 3 · the word: the screen grows to fill the room
  const pw = pinP($('#word .stage-wrap'));
  screen.style.setProperty('--g', smooth(0.2, 0.78, pw).toFixed(4));
  fades($('#word'), pw);

  // 7 · until next Sunday: the same walk, backwards, out through the doors
  const sentWrap = $('#sent .stage-wrap');
  const r7 = sentWrap.getBoundingClientRect();
  if (r7.top < H && r7.bottom > 0) {
    const ps = pinP(sentWrap);
    const t = smooth(0, 0.8, ps);
    drawFilm(filmOut, (1 - t) * (FRAMES - 1), lerp(SEAT.x, 0.5, smooth(0, 0.45, ps)), lerp(SEAT.y, 0.5, smooth(0, 0.45, ps)), lerp(narrow ? 1.04 : 1.12, 1, t));
    sentWrap.style.setProperty('--dusk', (0.15 + 0.45 * smooth(0.5, 1, ps)).toFixed(3));
    fades(sentWrap, ps);
  }
}
const queue = () => { if (!queued) { queued = true; requestAnimationFrame(tick); } };
addEventListener('scroll', queue, { passive: true });
addEventListener('resize', queue);
if (moving) loadFrames();
tick();

// ---------------------------------------------------------------- photo viewer
const viewer = $('[data-viewer]');
let at = 0;
const show = (i) => { at = (i + PHOTOS.length) % PHOTOS.length; const p = PHOTOS[at]; const img = $('[data-viewer-img]'); img.src = p.src; img.alt = p.title; $('[data-viewer-cap]').textContent = `${p.title} · ${at + 1} of ${PHOTOS.length}`; };
document.addEventListener('click', (e) => { const b = e.target.closest('[data-open-viewer]'); if (!b) return; show(+b.dataset.openViewer); viewer.showModal(); });
$$('[data-viewer-step]').forEach((b) => b.addEventListener('click', () => show(at + +b.dataset.viewerStep)));
$('[data-viewer-close]').addEventListener('click', () => viewer.close());
viewer.addEventListener('keydown', (e) => { if (e.key === 'ArrowRight') show(at + 1); if (e.key === 'ArrowLeft') show(at - 1); });
let sx = null;
viewer.addEventListener('touchstart', (e) => { sx = e.touches[0].clientX; }, { passive: true });
viewer.addEventListener('touchend', (e) => { if (sx === null) return; const dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 40) show(at + (dx < 0 ? 1 : -1)); sx = null; });

// ---------------------------------------------------------------- message player (youtube-nocookie; works on the real host)
const player = $('[data-player]');
const frame = $('[data-player-frame]');
document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-play]'); if (!b || !b.dataset.play) return;
  const id = b.dataset.play;
  frame.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&playsinline=1" title="King’s Court message" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>`;
  player.showModal();
});
const closePlayer = () => { frame.innerHTML = ''; if (player.open) player.close(); };
$('[data-player-close]').addEventListener('click', closePlayer);
player.addEventListener('close', () => { frame.innerHTML = ''; });

// ---------------------------------------------------------------- forms (front end only for now)
function check(form) {
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
const prayerForm = $('[data-prayer-form]');
const prayerDone = $('[data-prayer-done]');
prayerForm.addEventListener('submit', (e) => { e.preventDefault(); if (!check(prayerForm)) return; prayerForm.reset(); prayerForm.hidden = true; prayerDone.hidden = false; prayerDone.focus(); });
$('[data-prayer-again]').addEventListener('click', () => { prayerDone.hidden = true; prayerForm.hidden = false; $('#pr-text').focus(); });

const join = $('[data-join]');
const joinForm = $('[data-join-form]');
const joinDone = $('[data-join-done]');
$('[data-join-open]').addEventListener('click', () => { joinForm.hidden = false; joinDone.hidden = true; join.showModal(); $('#jn-name').focus(); });
$('[data-join-close]').addEventListener('click', () => join.close());
joinForm.addEventListener('submit', (e) => { e.preventDefault(); if (!check(joinForm)) return; joinForm.reset(); joinForm.hidden = true; joinDone.hidden = false; joinDone.focus(); });
$$('dialog').forEach((d) => d.addEventListener('click', (e) => { if (e.target === d && d !== viewer && d !== player) d.close(); }));
