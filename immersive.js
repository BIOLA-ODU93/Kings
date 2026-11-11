// A Sunday at King's Court: one scroll from the doors opening (9:40am) to the doors closing (12:30pm).
import { icon } from './icons.js';
import { nextService, formatDay, dublinParts } from './time.js';
import { $, $$, clamp, lerp, smooth, root, moving, paintIcons, updateChrome, renderFAQ, check } from './chrome.js';
import { STREAMS, ADDRESS, SCHEDULE, PHOTOS, SERMONS, WINDOWS, BANK } from './data.js';

const narrowQ = matchMedia('(max-width: 720px)');

// ---------------------------------------------------------------- when is each gathering next
function nextFirstFriday({ start, end }, now = new Date()) {
  const { hours } = dublinParts(now);
  for (let k = 0; k < 40; k++) {
    const s = new Date(now.getTime() + (k * 24 + start - hours) * 3600e3);
    const p = dublinParts(s);
    const dom = +new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Dublin', day: 'numeric' }).format(s);
    if (p.weekday !== 5 || dom > 7) continue;
    const e = new Date(s.getTime() + (end - start) * 3600e3);
    if (e <= now) continue;
    return { start: s, end: e, live: now >= s, inDays: k };
  }
  return null;
}
function when(item, now = new Date()) {
  let s = item.firstFriday ? nextFirstFriday(item.firstFriday, now) : item.weekday !== undefined ? nextService(item, now) : null;
  if (item.date) {
    const a = new Date(item.date.start), b = new Date(item.date.end);
    const days = Math.round((Date.parse(a.toDateString()) - Date.parse(now.toDateString())) / 864e5);
    s = b > now ? { start: a, end: b, live: now >= a, inDays: days } : null;
  }
  if (!s) return { s: null, chip: 'Date to confirm' };
  const at = new Intl.DateTimeFormat('en-US', { timeZone: 'Europe/Dublin', hour: 'numeric', minute: '2-digit', hour12: true }).format(s.start).replace(/\s/g, '').toLowerCase();
  if (s.live) return { s, chip: 'Live now', live: true, soon: true };
  if (s.inDays === 0) return { s, chip: `Today · ${at}`, soon: true };
  if (s.inDays === 1) return { s, chip: `Tomorrow · ${at}`, soon: true };
  return { s, chip: `Next · ${formatDay(s.start)}` };
}

// ---------------------------------------------------------------- 2 · order of service
const reminded = {
  get() { try { return new Set(JSON.parse(localStorage.getItem('kc-reminders') || '[]')); } catch { return new Set(); } },
  add(id) { try { const s = reminded.get(); s.add(id); localStorage.setItem('kc-reminders', JSON.stringify([...s])); } catch { /* storage blocked */ } },
};
function renderServices() {
  const set = reminded.get();
  const rows = SCHEDULE.map((item) => ({ item, w: when(item) })).sort((a, b) => (a.w.s?.start ?? Infinity) - (b.w.s?.start ?? Infinity));
  $('[data-services]').innerHTML = rows.map(({ item, w }) => `<li class="svc${w.live ? ' is-live' : ''}">
      <img class="svc__img" src="${item.img}" alt="${item.alt}" loading="lazy" />
      <div class="svc__body">
        <span class="chip${w.soon ? ' chip--soon' : ''}${w.live ? ' chip--live' : ''}">${w.chip}</span>
        <h3>${item.title}</h3>
        <p>${item.every} · ${item.time}</p>
      </div>
      <div class="svc__acts">
        <a class="act act--primary" href="${STREAMS[item.stream].href}" target="_blank" rel="noopener" aria-label="Watch ${item.title} on ${STREAMS[item.stream].name}">${icon('play-fill', 16)}<span>${w.live ? 'Watch live' : 'Watch now'}</span></a>
        <button class="act${set.has(item.id) ? ' is-on' : ''}" type="button" data-remind="${item.id}" aria-haspopup="dialog" aria-label="Remind me about ${item.title}">${icon(set.has(item.id) ? 'bell-ringing-fill' : 'bell-ringing', 16)}<span>${set.has(item.id) ? 'Reminder on' : 'Remind me'}</span></button>
      </div>
    </li>`).join('');
}
renderServices();

// remind me: calendar links (no account, no backend)
const stamp = (d) => {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Dublin', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' }).formatToParts(d).map((x) => [x.type, x.value]));
  return { g: `${p.year}${p.month}${p.day}T${p.hour}${p.minute}${p.second}`, iso: `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:${p.second}` };
};
function calendarLinks({ title, start, end, weekly }) {
  const a = stamp(start), b = stamp(end);
  const g = new URLSearchParams({ action: 'TEMPLATE', text: title, dates: `${a.g}/${b.g}`, ctz: 'Europe/Dublin', location: ADDRESS, details: 'King’s Court Dublin · There is a seat for you.' });
  if (weekly) g.set('recur', 'RRULE:FREQ=WEEKLY');
  const o = new URLSearchParams({ subject: title, startdt: a.iso, enddt: b.iso, location: ADDRESS, path: '/calendar/action/compose', rru: 'addevent' });
  return [{ label: 'Google Calendar', href: `https://calendar.google.com/calendar/render?${g}` }, { label: 'Outlook', href: `https://outlook.live.com/calendar/0/action/compose?${o}` }];
}
const pop = $('[data-remind-pop]');
let popFor = null;
function openRemind(btn) {
  const item = SCHEDULE.find((x) => x.id === btn.dataset.remind);
  const w = when(item);
  popFor = btn;
  $('#remind-title').textContent = `Remind me about ${item.title}`;
  if (w.s) {
    $('[data-remind-when]').textContent = `${item.every} · ${item.time}. Add it to your calendar and your phone will remind you.`;
    $('[data-remind-links]').innerHTML = calendarLinks({ title: `${item.title} · King’s Court`, start: w.s.start, end: w.s.end, weekly: item.weekday !== undefined })
      .map((l) => `<a class="pop__link" href="${l.href}" target="_blank" rel="noopener" data-cal>${icon('calendar-plus', 18)}<span>${l.label}</span></a>`).join('');
  } else {
    $('[data-remind-when]').textContent = 'The date isn’t confirmed yet. Check back soon, or ask at the welcome desk on Sunday.';
    $('[data-remind-links]').innerHTML = '';
  }
  pop.hidden = false;
  const r = btn.getBoundingClientRect();
  if (!narrowQ.matches) {
    const pw = pop.offsetWidth, ph = pop.offsetHeight;
    pop.style.left = `${clamp(r.left + r.width / 2 - pw / 2, 12, innerWidth - pw - 12)}px`;
    pop.style.top = `${r.top - ph - 10 < 80 ? r.bottom + 10 : r.top - ph - 10}px`;
  } else { pop.style.left = ''; pop.style.top = ''; }
  ($('a', pop) || $('[data-remind-close]', pop)).focus();
}
function closeRemind() { if (pop.hidden) return; pop.hidden = true; popFor?.focus(); popFor = null; }
document.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-remind]');
  if (btn) { if (popFor === btn) closeRemind(); else openRemind(btn); return; }
  if (e.target.closest('[data-cal]') && popFor) {
    const id = popFor.dataset.remind; reminded.add(id);
    setTimeout(() => { closeRemind(); renderServices(); $(`[data-remind="${id}"]`)?.focus(); }, 150);
    return;
  }
  if (!pop.hidden && !pop.contains(e.target)) closeRemind();
});
$('[data-remind-close]').addEventListener('click', closeRemind);
addEventListener('keydown', (e) => { if (e.key === 'Escape') closeRemind(); });
addEventListener('scroll', () => { if (!narrowQ.matches) closeRemind(); }, { passive: true });

// ---------------------------------------------------------------- 3 · praise photos
$('[data-praise]').innerHTML = PHOTOS.map((p, i) => `<button class="praise__photo" type="button" data-open-viewer="${i}" style="--ar:${p.w}/${p.h};--w:${p.w > p.h ? 22 : 15}vw" aria-label="Open photo: ${p.title}"><img src="${p.src}" alt="" loading="lazy" decoding="async" /></button>`).join('');
const photos = $$('.praise__photo');

// ---------------------------------------------------------------- 4 · the word
const [latest, ...older] = SERMONS;
const thumb = (v) => `assets/v2/yt-${v}.jpg`;
$('[data-screen-img]').src = thumb(latest.id);
$('[data-screen-date]').textContent = `Latest · ${latest.date} · ${latest.length}`;
$('[data-screen-title]').textContent = latest.title;
$('[data-play]').dataset.play = latest.id;
$('[data-strip]').innerHTML = older.map((s) => `<li><button type="button" data-play="${s.id}" aria-label="Play ${s.title}, ${s.date}"><img src="${thumb(s.id)}" alt="" loading="lazy" /><span><b>${s.title}</b><span>${s.date} · ${s.length}</span></span></button></li>`).join('');

// ---------------------------------------------------------------- 5 · prayer: words reveal, the request rises
const line = $('[data-words]');
line.innerHTML = line.textContent.split(' ').map((w) => `<span class="w">${w}</span>`).join(' ');
const words = $$('.w', line);
const prayerForm = $('[data-prayer-form]');
const prayerDone = $('[data-prayer-done]');
prayerForm.addEventListener('submit', (e) => {
  e.preventDefault();
  if (!check(prayerForm)) return;
  const finish = () => { prayerForm.classList.remove('is-rising'); prayerForm.reset(); prayerForm.hidden = true; prayerDone.hidden = false; prayerDone.focus(); };
  if (!moving) { finish(); return; }
  prayerForm.classList.add('is-rising'); // folds and lifts up into the light
  setTimeout(finish, 900);
});
$('[data-prayer-again]').addEventListener('click', () => { prayerDone.hidden = true; prayerForm.hidden = false; $('#pr-text').focus(); });

// ---------------------------------------------------------------- 6 · offering: windows light up, then the bank card
$('[data-windows]').innerHTML = `<div class="windows__track" data-track>${WINDOWS.map((w) => `<article class="win">
    <div class="win__glass">${w.img ? `<img src="${w.img}" alt="" loading="lazy" />` : '<span class="win__glow" aria-hidden="true"></span>'}</div>
    <h3>${w.title}</h3><p>${w.when}</p>
  </article>`).join('')}
  <div class="card bank" data-bank></div>
</div>`;
const wins = $$('.win');
const track = $('[data-track]');
$('[data-bank]').innerHTML = `<p class="bank__intro">Give by bank transfer</p>` + BANK.map((f, i) => {
  const pending = f.value.startsWith('[');
  return `<div class="bank__field"><span class="bank__label">${f.label}</span><span class="bank__row"><b id="bk-${i}" class="${pending ? 'is-pending' : ''}">${f.value}</b><button class="bank__copy" type="button" data-copy="${i}" ${pending ? `disabled aria-label="${f.label} not confirmed yet"` : `aria-label="Copy ${f.label}"`}>${icon('copy', 20)}<span class="bank__copied" aria-live="polite"></span></button></span></div>`;
}).join('');
$('[data-bank]').addEventListener('click', async (e) => {
  const b = e.target.closest('[data-copy]'); if (!b || b.disabled) return;
  const note = $('.bank__copied', b);
  try { await navigator.clipboard.writeText(BANK[+b.dataset.copy].value); note.textContent = 'Copied'; }
  catch { const r = document.createRange(); r.selectNodeContents($(`#bk-${b.dataset.copy}`)); getSelection().removeAllRanges(); getSelection().addRange(r); note.textContent = 'Selected'; }
  setTimeout(() => { note.textContent = ''; }, 1600);
});

// ---------------------------------------------------------------- 7 · fellowship: scattered → one family mosaic
const mosaic = $('[data-mosaic]');
mosaic.innerHTML = PHOTOS.map((p) => `<span class="tile"><img src="${p.src}" alt="" loading="lazy" /></span>`).join('');
const tiles = $$('.tile', mosaic);
let layout = null;
function layoutMosaic() {
  const W = innerWidth, H = innerHeight, narrow = narrowQ.matches;
  const cols = narrow ? 3 : 4, rows = Math.ceil(tiles.length / cols), gap = narrow ? 6 : 10;
  const size = Math.min((W - (narrow ? 24 : 160) - gap * (cols - 1)) / cols, (H - (narrow ? 140 : 160) - gap * (rows - 1)) / rows);
  const gw = cols * size + gap * (cols - 1), gh = rows * size + gap * (rows - 1);
  layout = { size, items: tiles.map((_, i) => {
    const c = i % cols, r = Math.floor(i / cols);
    const a = i * 2.399, d = 0.62 + ((i * 37) % 10) / 30;
    return {
      gx: (W - gw) / 2 + c * (size + gap), gy: (H - gh) / 2 + 30 + r * (size + gap),
      sx: W / 2 + Math.cos(a) * W * 0.55 * d - size / 2, sy: H / 2 + Math.sin(a) * H * 0.55 * d - size / 2,
      rot: ((i * 53) % 30) - 15,
    };
  }) };
  tiles.forEach((t) => { t.style.width = t.style.height = `${size}px`; });
}
layoutMosaic();

// ---------------------------------------------------------------- 8 · times + faq
$('[data-times]').innerHTML = SCHEDULE.map((t) => `<li><b>${t.title}</b><span>${t.every} · ${t.time}${t.stream === 'zoom' ? ' on Zoom' : ''}</span></li>`).join('');
renderFAQ($('[data-faq]'));
paintIcons();

// ---------------------------------------------------------------- the walk-in film (72 frames): forwards in, backwards out
const FRAMES = 72;
const frames = Array.from({ length: FRAMES }, () => null);
const filmIn = $('[data-film="in"]'), filmOut = $('[data-film="out"]'), poster = $('.film__poster');
function loadFrames() {
  let next = 0;
  const pump = () => {
    if (next >= FRAMES) return;
    const i = next++;
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => { frames[i] = img; if (i === 0) { poster.classList.add('is-ready'); queue(); } pump(); };
    img.onerror = pump;
    img.src = `assets/walkin/f${String(i).padStart(3, '0')}.jpg`;
  };
  for (let k = 0; k < 4; k++) pump();
}
const nearest = (i) => { for (let d = 0; d < FRAMES; d++) { if (frames[i - d]) return frames[i - d]; if (frames[i + d]) return frames[i + d]; } return null; };
function drawFilm(c, f, fx, fy, zoom) {
  const img = nearest(clamp(Math.round(f), 0, FRAMES - 1)); if (!img) return;
  const dpr = Math.min(devicePixelRatio || 1, 2);
  const w = Math.round(c.clientWidth * dpr), h = Math.round(c.clientHeight * dpr);
  if (c.width !== w || c.height !== h) { c.width = w; c.height = h; }
  const s = Math.max(w / img.width, h / img.height) * zoom, dw = img.width * s, dh = img.height * s;
  c.getContext('2d').drawImage(img, clamp(w / 2 - fx * dw, w - dw, 0), clamp(h / 2 - fy * dh, h - dh, 0), dw, dh);
}
const SEAT = { x: 0.665, y: 0.8 };

// ---------------------------------------------------------------- scroll engine
const scenes = $$('[data-scene]');
const COLORS = { doors: '#0b0718', order: '#0e0928', praise: '#140b3c', word: '#07051a', prayer: '#ece5f8', offering: '#f3effa', fellowship: '#fdfcff', sent: '#0b0718' };
scenes.forEach((sc, i) => {
  const own = COLORS[sc.dataset.scene], prev = i ? COLORS[scenes[i - 1].dataset.scene] : own;
  sc.style.background = `linear-gradient(180deg, ${prev} 0, ${own} 200px) ${own}`;
});
const railLinks = $$('[data-rail]');
const progressBar = $('[data-progress]');
const screen = $('[data-screen]');
const programme = $('[data-programme]');
const prayerPhoto = $('[data-prayer-photo]'), prayerLight = $('[data-prayer-light]');
const fellow = $('[data-fellow]');
const pinP = (el) => { const r = el.getBoundingClientRect(); const run = r.height - innerHeight; return run > 0 ? clamp(-r.top / run) : (r.top < 0 ? 1 : 0); };
const onScreen = (el) => { const r = el.getBoundingClientRect(); return r.bottom > -100 && r.top < innerHeight + 100; };
function fades(scope, p) {
  $$('[data-fade]', scope).forEach((el) => {
    const [a, b] = el.dataset.fade.split(' ').map(Number);
    el.style.opacity = (a <= 0 ? 1 : smooth(a - 0.08, a, p)) * (b > 1 ? 1 : 1 - smooth(b - 0.08, b, p));
  });
}

let queued = false;
function tick() {
  queued = false;
  const H = innerHeight, mid = H / 2;
  const active = scenes.find((sc) => { const r = sc.getBoundingClientRect(); return r.top <= mid && r.bottom > mid; }) || scenes[scenes.length - 1];
  railLinks.forEach((a) => { const on = a.dataset.rail === active.dataset.scene; a.classList.toggle('is-active', on); if (on) a.setAttribute('aria-current', 'step'); else a.removeAttribute('aria-current'); });
  progressBar.style.setProperty('--done', clamp(scrollY / (root.scrollHeight - H)));
  updateChrome();
  if (!moving) return;
  const narrow = narrowQ.matches;

  // 1 · doors: walk in from the foyer to the seat
  const doors = $('#doors');
  if (onScreen(doors)) {
    const pd = pinP(doors), t = smooth(0, 0.86, pd), arrive = smooth(0.55, 1, pd);
    drawFilm(filmIn, t * (FRAMES - 1), lerp(0.5, SEAT.x, arrive), lerp(0.5, SEAT.y, arrive), lerp(1, narrow ? 1.04 : 1.12, t));
    fades(doors, pd);
  }

  // 2 · order of service: handed to you, then it opens like a folded leaflet
  const order = $('#order');
  if (onScreen(order) && !narrow) {
    const po = pinP(order);
    programme.style.setProperty('--rise', smooth(0.02, 0.32, po).toFixed(4));
    programme.style.setProperty('--open', smooth(0.34, 0.62, po).toFixed(4));
    fades(order, po);
  }

  // 3 · praise: photos rise out of the dark and pass you
  const praise = $('#praise');
  if (onScreen(praise)) {
    const pp = pinP(praise), N = photos.length;
    photos.forEach((el, k) => {
      const t = pp * 1.5 - k / N + 0.25, a = k * 2.399;
      const x = Math.cos(a) * (8 + t * (narrow ? 30 : 34)), y = Math.sin(a) * (6 + t * (narrow ? 26 : 30));
      el.style.transform = `translate(-50%, -50%) translate3d(${x}vw, ${y}vh, 0) scale(${(narrow ? 1.9 : 1) * (0.35 + t * 1.05)})`;
      el.style.opacity = smooth(0, 0.16, t) * (1 - smooth(0.92, 1.2, t));
      el.style.zIndex = Math.round(t * 100);
      el.style.pointerEvents = t > 0.05 && t < 1.05 ? 'auto' : 'none';
    });
  }

  // 4 · the word: the screen grows to fill the room
  const wordWrap = $('#word .stage-wrap');
  if (onScreen(wordWrap)) {
    const pw = pinP(wordWrap);
    screen.style.setProperty('--g', smooth(0.2, 0.78, pw).toFixed(4));
    fades(wordWrap, pw);
  }

  // 5 · prayer: the camera eases in, the room dims to one warm light, the words arrive one by one
  const prWrap = $('#prayer .stage-wrap');
  if (onScreen(prWrap)) {
    const pr = pinP(prWrap);
    prayerPhoto.style.transform = `scale(${lerp(1.04, 1.22, pr).toFixed(4)})`;
    prayerPhoto.style.filter = `brightness(${lerp(0.6, 0.34, smooth(0, 0.6, pr)).toFixed(3)}) saturate(${lerp(1, 0.7, pr).toFixed(3)})`;
    prayerLight.style.opacity = smooth(0.1, 0.7, pr).toFixed(3);
    const shown = smooth(0.12, 0.8, pr) * words.length;
    words.forEach((w, i) => { w.style.opacity = clamp(shown - i, 0.18, 1).toFixed(3); });
  }

  // 6 · offering: the row of gatherings slides past and each one lights up as it reaches you
  const offering = $('#offering');
  if (onScreen(offering)) {
    const po = pinP(offering);
    const travel = Math.max(0, track.scrollWidth - innerWidth + (narrow ? 32 : 160));
    track.style.transform = `translate3d(${(-travel * smooth(0.04, 0.92, po)).toFixed(1)}px, 0, 0)`;
    wins.forEach((w) => { const r = w.getBoundingClientRect(); w.style.setProperty('--lit', smooth(innerWidth * 0.82, innerWidth * 0.5, r.left + r.width / 2).toFixed(3)); });
  }

  // 7 · fellowship: everyone drifts together into one family
  const fel = $('#fellowship');
  if (onScreen(fel) && layout) {
    const pf = pinP(fel), t = smooth(0.06, 0.62, pf);
    tiles.forEach((tile, i) => {
      const L = layout.items[i];
      tile.style.transform = `translate3d(${lerp(L.sx, L.gx, t).toFixed(1)}px, ${lerp(L.sy, L.gy, t).toFixed(1)}px, 0) rotate(${lerp(L.rot, 0, t).toFixed(2)}deg) scale(${lerp(0.72, 1, t).toFixed(3)})`;
      tile.style.opacity = lerp(0.55, 1, t).toFixed(3);
    });
    const c = smooth(0.58, 0.76, pf);
    fellow.style.opacity = c.toFixed(3);
    fellow.style.transform = `translate(-50%, calc(-50% + ${((1 - c) * 24).toFixed(1)}px))`;
    fellow.style.pointerEvents = c > 0.5 ? 'auto' : 'none';
  }

  // 8 · until next Sunday: the same walk, backwards, out through the doors
  const sentWrap = $('#sent .stage-wrap');
  if (onScreen(sentWrap)) {
    const ps = pinP(sentWrap), t = smooth(0, 0.8, ps), leave = smooth(0, 0.45, ps);
    drawFilm(filmOut, (1 - t) * (FRAMES - 1), lerp(SEAT.x, 0.5, leave), lerp(SEAT.y, 0.5, leave), lerp(narrow ? 1.04 : 1.12, 1, t));
    sentWrap.style.setProperty('--dusk', (0.15 + 0.45 * smooth(0.5, 1, ps)).toFixed(3));
    fades(sentWrap, ps);
  }
}
const queue = () => { if (!queued) { queued = true; requestAnimationFrame(tick); } };
addEventListener('scroll', queue, { passive: true });
addEventListener('resize', () => { layoutMosaic(); queue(); });
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

// ---------------------------------------------------------------- join form
const join = $('[data-join]'), joinForm = $('[data-join-form]'), joinDone = $('[data-join-done]');
$('[data-join-open]').addEventListener('click', () => { joinForm.hidden = false; joinDone.hidden = true; join.showModal(); $('#jn-name').focus(); });
$('[data-join-close]').addEventListener('click', () => join.close());
join.addEventListener('click', (e) => { if (e.target === join) join.close(); });
joinForm.addEventListener('submit', (e) => { e.preventDefault(); if (!check(joinForm)) return; joinForm.reset(); joinForm.hidden = true; joinDone.hidden = false; joinDone.focus(); });
