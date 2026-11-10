// V2 page interactions below (and beside) the walk-in hero.
// Schedule and events live in SCHEDULE / EVENTS so the church can edit them in one place.
import { nextService, formatDay, untilText, dublinParts } from './time.js';
import { icon } from './icons.js';

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const canHover = matchMedia('(hover: hover)').matches;
// address from the province flyer: [church to confirm]
// where each service streams: Sunday on YouTube, midweek on Zoom
const STREAMS = {
  youtube: { href: 'https://www.youtube.com/@kingscourtparish/live', name: 'YouTube' },
  zoom: { href: 'https://us02web.zoom.us/j/7651648605?pwd=TlZCSC9QQzJEd1dtbWNxbHFDWjc5UT09', name: 'Zoom' },
};
const MAPS = 'https://www.google.com/maps/search/?api=1&query=RCCG+King%27s+Court+Dublin+Unit+2+Damastown+Way+Damastown+Industrial+Estate';
const ADDRESS = 'RCCG King’s Court Dublin, [Street address], Dublin';

// ---------------------------------------------------------------- data
// Times are Dublin local, as decimal hours. [Church to confirm] the schedule.
const SCHEDULE = [
  { id: 'sunday', stream: 'youtube', title: 'Sunday Family Service', weekday: 0, start: 10, end: 12.5, every: 'Every Sunday', time: '10:00am – 12:30pm', img: 'assets/web/service-family.jpg', alt: 'Worship at the Sunday family service', live: true },
  { id: 'digging', stream: 'zoom', title: 'Digging Deep · Bible study', weekday: 3, start: 18.5, end: 19.5, every: 'Every Wednesday', time: '6:30 – 7:30pm', img: 'assets/web/service-digging.jpg', alt: 'Members studying the Bible', live: true },
  { id: 'youth', stream: 'zoom', title: 'Youth Service', weekday: 4, start: 18.5, end: 19.5, every: 'Every Thursday', time: '6:30 – 7:30pm', img: 'assets/web/service-youth.jpg', alt: 'Young people at the youth service', live: true },
  { id: 'faith', stream: 'zoom', title: 'Faith Clinic · Prayer', weekday: 5, start: 18.5, end: 19.5, every: 'Every Friday', time: '6:30 – 7:30pm', img: 'assets/web/service-faith-clinic.jpg', alt: 'Faith Clinic prayer meeting', live: true },
];
// Events without a confirmed date have `date: null` and show "[date to confirm]".
const EVENTS = [
  { id: 'glory', stream: 'zoom', title: 'Morning Glory', meta: 'First Friday of every month · 5:30 – 6:30am · Main auditorium', blurb: 'First Friday of every month, 5:30 – 6:30am in the main auditorium.', firstFriday: { start: 5.5, end: 6.5 }, img: 'assets/web/family-4.jpg', card: { img: 'assets/v2/morning-glory.jpg', alt: 'A member praying at Morning Glory', every: 'First Friday of every month', time: '5:30 – 6:30am' } },
  // from the province flyer (RCCG Province 2 Ireland): [church to confirm year and end time]
  { id: 'vigil', stream: 'youtube', title: 'Provincial Monthly Vigil', meta: 'Friday · 9:00pm · King’s Court Dublin Auditorium · All provinces welcome', blurb: '“The Almighty God” · 9:00pm at King’s Court Dublin Auditorium. All provinces welcome.', date: { start: '2026-11-13T21:00:00Z', end: '2026-11-14T01:00:00Z' }, img: 'assets/v2/vigil-flyer.jpg', card: { title: 'Vigil Service', img: 'assets/v2/vigil-stage.jpg', alt: 'A minister preaching from the stage during a vigil', every: 'Monthly · Provincial vigil', time: '9:00pm – 1:00am' } },
  { id: 'members', title: 'Membership class', meta: 'Sunday · after service · Fellowship hall · New here? Start here.', blurb: 'After the Sunday service in the fellowship hall. New here? Start here.', date: null, img: 'assets/web/family-3.jpg' },
];

// next first Friday of the month at a Dublin hour
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

// ---------------------------------------------------------------- calendar links (no account, no backend)
const stamp = (d) => {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Dublin', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
  }).formatToParts(d).map((x) => [x.type, x.value]));
  return { g: `${p.year}${p.month}${p.day}T${p.hour}${p.minute}${p.second}`, iso: `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:${p.second}` };
};
function calendarLinks({ title, start, end, weekly }) {
  const a = stamp(start), b = stamp(end);
  const g = new URLSearchParams({ action: 'TEMPLATE', text: title, dates: `${a.g}/${b.g}`, ctz: 'Europe/Dublin', location: ADDRESS, details: 'King’s Court Dublin · There is a seat for you.' });
  if (weekly) g.set('recur', 'RRULE:FREQ=WEEKLY');
  const o = new URLSearchParams({ subject: title, startdt: a.iso, enddt: b.iso, location: ADDRESS, path: '/calendar/action/compose', rru: 'addevent' });
  return [
    { label: 'Google Calendar', href: `https://calendar.google.com/calendar/render?${g}` },
    { label: 'Outlook', href: `https://outlook.live.com/calendar/0/action/compose?${o}` },
  ];
}
const linksHTML = (links) => links.map((l) => `<a class="pop__link" href="${l.href}" target="_blank" rel="noopener" data-cal>${icon('calendar-plus', 18)}<span>${l.label}</span></a>`).join('');

// remembered reminders (this browser only)
const store = {
  get() { try { return JSON.parse(localStorage.getItem('kc-reminders') || '[]'); } catch { return []; } },
  add(id) { try { const s = new Set(store.get()); s.add(id); localStorage.setItem('kc-reminders', JSON.stringify([...s])); } catch { /* storage blocked */ } },
};

// ---------------------------------------------------------------- icons in markup
function paintIcons(root = document) { $$('[data-icon]', root).forEach((el) => { el.innerHTML = icon(el.dataset.icon, +el.dataset.size || 18); }); }

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

// ---------------------------------------------------------------- status text for a schedule item
function when(item, now = new Date()) {
  let s = item.firstFriday ? nextFirstFriday(item.firstFriday, now) : item.weekday !== undefined ? nextService(item, now) : null;
  if (item.date) {
    const a = new Date(item.date.start), b = new Date(item.date.end);
    const days = Math.round((Date.parse(a.toDateString()) - Date.parse(now.toDateString())) / 864e5);
    s = b > now ? { start: a, end: b, live: now >= a, inDays: days } : null;
  }
  if (!s) return { s: null, chip: 'Date to confirm', soft: false };
  const at = new Intl.DateTimeFormat('en-US', { timeZone: 'Europe/Dublin', hour: 'numeric', minute: '2-digit', hour12: true }).format(s.start).replace(/\s/g, '').toLowerCase();
  if (s.live) return { s, chip: 'Live now', soft: true, live: true };
  if (s.inDays === 0) return { s, chip: `Today · ${at}`, soft: true };
  if (s.inDays === 1) return { s, chip: `Tomorrow · ${at}`, soft: true };
  return { s, chip: `Next · ${formatDay(s.start)}`, soft: false };
}

// ---------------------------------------------------------------- "Coming up" card (hero + phone band)
const slides = [
  { ...SCHEDULE[0], kind: 'service', thumb: SCHEDULE[0].img },
  ...EVENTS.map((e) => ({ ...e, kind: 'event', thumb: e.img })),
];
// one line that says when, then what to expect (Figma "Scroll" 1858:2171)
function blurb(item, w) {
  if (item.kind === 'service') {
    if (w.live) return 'Happening now. Join us in person or watch live.';
    return `${w.s ? `${formatDay(w.s.start)} · ${untilText(w.s.start - Date.now())}` : 'Sundays'} · 10am – 12:30pm. Everyone welcome.`;
  }
  const day = w.s ? (w.live ? 'Happening now' : formatDay(w.s.start)) : '[Date to confirm]';
  return `${day} · ${item.blurb}`;
}
function slideHTML(item, i) {
  const w = when(item);
  return `<div class="upnext__slide" role="group" aria-roledescription="slide" aria-label="${i + 1} of ${slides.length}: ${item.title}" data-slide="${i}">
    <img class="upnext__thumb" src="${item.thumb}" alt="" />
    <div class="upnext__body">
      <p class="upnext__title">${w.live ? '<span class="upnext__live" aria-label="Live now"></span>' : ''}${item.title}</p>
      <p class="upnext__meta">${blurb(item, w)}</p>
      <div class="upnext__links">
        <button type="button" class="link2 link2--deep" data-remind="${item.id}">${icon('bell-ringing', 16)} Remind me</button>
        <a class="link2 link2--deep" href="${MAPS}" target="_blank" rel="noopener">Get directions ${icon('arrow-right', 16)}</a>
      </div>
    </div>
  </div>`;
}
function buildUpnext(root) {
  root.innerHTML = `<div class="upnext__track" data-track>${slides.map(slideHTML).join('')}</div>
    <div class="upnext__nav">
      <div class="upnext__dots" role="tablist" aria-label="Choose a card">${slides.map((s, i) => `<button type="button" role="tab" aria-label="${s.title}" data-go="${i}"></button>`).join('')}</div>
      <div class="upnext__arrows">
        <button type="button" class="upnext__arrow" aria-label="Previous" data-step="-1">${icon('caret-left', 16)}</button>
        <button type="button" class="upnext__arrow" aria-label="Next" data-step="1">${icon('caret-right', 16)}</button>
      </div>
    </div>`;
  const track = $('[data-track]', root);
  let index = 0, timer = 0, paused = false;
  const go = (i, smooth = true) => {
    index = (i + slides.length) % slides.length;
    track.scrollTo({ left: track.children[index].offsetLeft - track.firstElementChild.offsetLeft, behavior: smooth && !reduceMotion ? 'smooth' : 'auto' });
    $$('[data-go]', root).forEach((b, k) => b.setAttribute('aria-selected', String(k === index)));
  };
  track.addEventListener('scroll', () => {
    const i = Math.round(track.scrollLeft / Math.max(1, track.firstElementChild.offsetWidth + 24));
    if (i !== index) { index = i; $$('[data-go]', root).forEach((b, k) => b.setAttribute('aria-selected', String(k === index))); }
  }, { passive: true });
  root.addEventListener('click', (e) => {
    const g = e.target.closest('[data-go]'); if (g) go(+g.dataset.go);
    const s = e.target.closest('[data-step]'); if (s) go(index + +s.dataset.step);
  });
  const tick = () => { if (!paused && !document.hidden) go(index + 1); };
  if (!reduceMotion) timer = setInterval(tick, 7000);
  ['pointerenter', 'focusin', 'touchstart'].forEach((t) => root.addEventListener(t, () => { paused = true; }, { passive: true }));
  ['pointerleave', 'focusout'].forEach((t) => root.addEventListener(t, () => { paused = false; }));
  addEventListener('resize', () => go(index, false));
  go(0, false);
  return () => clearInterval(timer);
}
$$('[data-upnext]').forEach(buildUpnext);

// ---------------------------------------------------------------- order of service cards
const servicesEl = $('[data-services]');
let servicesKey = '';
// one card, used on the page and in the full schedule (Figma 1592:415 + 281:2967)
function cardHTML(item, set) {
  const c = { ...item, ...(item.card || {}) };
  const w = when(item);
  const reminded = set.has(item.id);
  return `<article class="svc" data-id="${item.id}">
      <img class="svc__photo" src="${c.img}" alt="${c.alt || ''}" />
      <span class="chip2${w.soft ? ' chip2--soft' : ''}${w.live ? ' chip2--live' : ''}">${w.live ? '<span class="live-dot"></span>' : ''}${w.chip}</span>
      <h3 class="svc__title">${c.title}</h3>
      <p class="svc__when"><span>${c.every}</span><b>${c.time}</b></p>
      <div class="svc__actions">
        <a class="icon-act${w.live ? ' is-live' : ''}" href="${STREAMS[c.stream].href}" target="_blank" rel="noopener" aria-label="Watch ${c.title} on ${STREAMS[c.stream].name}${w.live ? ', live now' : ''}">
          <span class="icon-act__icon">${icon('play', 20)}</span><span class="icon-act__pill">${icon('play-fill', 16)}<span>${w.live ? 'Watch live' : 'Watch Now'}</span></span>
        </a>
        <button class="icon-act${reminded ? ' is-on' : ''}" type="button" data-remind="${item.id}" aria-label="Remind me about ${c.title}" aria-haspopup="dialog">
          <span class="icon-act__icon">${icon('bell-ringing', 20)}</span><span class="icon-act__pill">${icon('bell-ringing-fill', 16)}<span>${reminded ? 'Reminder on' : 'Remind Me'}</span></span>
        </button>
      </div>
    </article>`;
}
// everything on the schedule, soonest first; undated items go last
const allScheduled = () => [...SCHEDULE, ...EVENTS.filter((e) => e.card)]
  .map((item) => ({ item, t: when(item).s?.start.getTime() ?? Infinity }))
  .sort((a, b) => a.t - b.t)
  .map((x) => x.item);
const scheduleGrid = $('[data-schedule-grid]');
function renderServices() {
  const set = new Set(store.get());
  // only redraw when a status line or reminder actually changes (avoids photo flashes)
  const key = allScheduled().map((item) => `${item.id}|${when(item).chip}|${set.has(item.id)}`).join();
  if (key === servicesKey) return;
  servicesKey = key;
  servicesEl.innerHTML = SCHEDULE.map((item) => cardHTML(item, set)).join('');
  const all = allScheduled();
  scheduleGrid.innerHTML = all.length
    ? all.map((item) => cardHTML(item, set)).join('')
    : '<p class="schedule__empty">New services will appear here as soon as the church adds them.</p>';
  $('[data-schedule-count]').textContent = `${all.length} ${all.length === 1 ? 'gathering' : 'gatherings'}`;
}
renderServices();
setInterval(renderServices, 60000);

// general "Watch live" buttons follow whatever is on now: a midweek service on Zoom,
// otherwise the Sunday stream / channel on YouTube
function updateWatchLive() {
  const live = allScheduled().find((item) => when(item).live);
  const stream = STREAMS[live?.stream || 'youtube'];
  $$('[data-watch-live]').forEach((a) => {
    a.href = stream.href;
    a.setAttribute('aria-label', `${a.textContent.trim()} on ${stream.name}${live ? `: ${live.title}` : ''}`);
  });
}
updateWatchLive();
setInterval(updateWatchLive, 60000);

// drag the rail with a mouse
let drag = null;
servicesEl.addEventListener('pointerdown', (e) => {
  if (e.pointerType !== 'mouse' || servicesEl.scrollWidth <= servicesEl.clientWidth) return;
  drag = { x: e.clientX, left: servicesEl.scrollLeft, moved: false };
});
addEventListener('pointermove', (e) => {
  if (!drag) return;
  const dx = e.clientX - drag.x;
  if (Math.abs(dx) > 4) drag.moved = true;
  if (drag.moved) servicesEl.scrollLeft = drag.left - dx;
});
addEventListener('pointerup', () => { drag = null; });

// ---------------------------------------------------------------- full schedule
const schedule = $('[data-schedule]');
$$('[data-schedule-open]').forEach((b) => b.addEventListener('click', () => { schedule.showModal(); document.body.style.overflow = 'hidden'; $('[data-schedule-close]').focus(); }));
$('[data-schedule-close]').addEventListener('click', () => schedule.close());
schedule.addEventListener('close', () => { document.body.style.overflow = ''; closeRemind(); });
schedule.addEventListener('click', (e) => { if (e.target === schedule) schedule.close(); });

// ---------------------------------------------------------------- remind me popover
const pop = $('[data-remind-pop]');
let popFor = null;
function itemById(id) { return [...SCHEDULE, ...EVENTS].find((x) => x.id === id); }
function openRemind(btn) {
  const item = itemById(btn.dataset.remind);
  const w = when(item);
  popFor = btn;
  const host = btn.closest('dialog') || document.body;
  if (pop.parentNode !== host) host.append(pop);
  $('#remind-title').textContent = `Remind me about ${item.title}`;
  if (w.s) {
    const line = item.every ? `${item.every} · ${item.time}` : `${formatDay(w.s.start)} · ${item.meta.split(' · ').slice(1, 2).join('')}`;
    $('[data-remind-when]').textContent = `${line}. Add it to your calendar and your phone will remind you.`;
    $('[data-remind-links]').innerHTML = linksHTML(calendarLinks({ title: `${item.title} · King’s Court`, start: w.s.start, end: w.s.end, weekly: item.weekday !== undefined }));
  } else {
    $('[data-remind-when]').textContent = 'The date isn’t confirmed yet. Check back soon, or ask at the welcome desk on Sunday.';
    $('[data-remind-links]').innerHTML = '';
  }
  pop.hidden = false;
  // place it beside the button (on phones it sits at the bottom of the screen)
  const r = btn.getBoundingClientRect();
  if (innerWidth > 720) {
    const pw = pop.offsetWidth, ph = pop.offsetHeight;
    let x = clamp(r.left + r.width / 2 - pw / 2, 12, innerWidth - pw - 12);
    let y = r.top - ph - 10;
    if (y < 80) y = r.bottom + 10;
    pop.style.left = `${x}px`; pop.style.top = `${y}px`;
  } else { pop.style.left = ''; pop.style.top = ''; }
  ($('a', pop) || $('[data-remind-close]', pop)).focus();
}
function closeRemind() { if (pop.hidden) return; pop.hidden = true; popFor?.focus(); popFor = null; }
document.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-remind]');
  if (btn) { e.preventDefault(); if (popFor === btn) closeRemind(); else openRemind(btn); return; }
  if (e.target.closest('[data-cal]') && popFor) {
    store.add(popFor.dataset.remind);
    const id = popFor.dataset.remind;
    setTimeout(() => { closeRemind(); renderServices(); const b = $(`.svc [data-remind="${id}"]`); b?.focus(); }, 150);
    return;
  }
  if (!pop.hidden && !pop.contains(e.target)) closeRemind();
});
$('[data-remind-close]').addEventListener('click', closeRemind);
addEventListener('keydown', (e) => { if (e.key === 'Escape') closeRemind(); });
addEventListener('scroll', () => { if (innerWidth > 720) closeRemind(); }, { passive: true });

// ---------------------------------------------------------------- nav over light sections, parallax, phone dock
const nav = $('.nav');
const lightSections = $$('.s2--white, .s2--paper, .s2--dawn, .give3, [data-theme="light"]');
const parallaxEls = $$('[data-parallax]');
const dock = $('[data-dock]');
const hero = $('#walkin');
const visit = $('#visit');
const footer = $('.footer2');
let ticking = false;
function onScroll() {
  ticking = false;
  // full nav at the top of the page, the floating pill once you start scrolling (Figma 1858:2170)
  nav.classList.toggle('is-compact', scrollY > 40);
  const navY = nav.getBoundingClientRect().top + 34;
  nav.classList.toggle('is-light', lightSections.some((s) => {
    const r = s.getBoundingClientRect();
    return r.top <= navY && r.bottom >= navY;
  }));
  const past = hero.getBoundingClientRect().bottom < innerHeight * 0.5;
  const atEnd = visit.getBoundingClientRect().top < innerHeight * 0.85 && footer.getBoundingClientRect().top > -1e5;
  dock.classList.toggle('is-on', past && !atEnd);
  if (reduceMotion) return;
  const mid = innerHeight / 2;
  for (const el of parallaxEls) {
    const r = el.getBoundingClientRect();
    if (r.bottom < -200 || r.top > innerHeight + 200) continue;
    el.style.setProperty('--py', `${((r.top + r.height / 2 - mid) * +el.dataset.parallax).toFixed(1)}px`);
  }
}
addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
addEventListener('resize', onScroll);
onScroll();

// ---------------------------------------------------------------- gallery: the photo album
// Real church photos only. Captions describe what is in the photo; the media team can rename them.
// Pages, chapters and ribbons are generated from PHOTOS, so new photos add new pages by themselves.
const PHOTOS = [
  { src: 'assets/web/family-4.jpg', title: 'The choir ministering', group: 'Worship', w: 3, h: 2 },
  { src: 'assets/web/about-pastor.jpg', title: 'Arms open in worship', group: 'Worship', w: 2, h: 3 },
  { src: 'assets/web/service-family.jpg', title: 'Sunday family service', group: 'Worship', w: 2, h: 3 },
  { src: 'assets/web/family-2.jpg', title: 'Hugs after the service', group: 'Fellowship', w: 2, h: 3 },
  { src: 'assets/web/family-3.jpg', title: 'Sunday colours', group: 'Fellowship', w: 2, h: 3 },
  { src: 'assets/web/family-1.jpg', title: 'A family on stage', group: 'Fellowship', w: 2, h: 3 },
  { src: 'assets/v2/morning-glory.jpg', title: 'Morning Glory prayer', group: 'Prayer', w: 2, h: 3 },
  { src: 'assets/web/about-worship.jpg', title: 'Hands lifted in prayer', group: 'Prayer', w: 2, h: 3 },
  { src: 'assets/web/service-faith-clinic.jpg', title: 'Faith Clinic', group: 'Prayer', w: 4, h: 5 },
  { src: 'assets/v2/vigil-stage.jpg', title: 'The Word from the stage', group: 'The Word', w: 3, h: 2 },
  { src: 'assets/web/service-digging.jpg', title: 'Digging Deep, Bible study', group: 'The Word', w: 2, h: 3 },
  { src: 'assets/web/service-youth.jpg', title: 'Youth service', group: 'Youth', w: 2, h: 3 },
];
const CHAPTERS = [...new Set(PHOTOS.map((p) => p.group))];
const RIBBON = { Worship: '#c9a227', Fellowship: '#b0413e', Prayer: '#5b7f6e', 'The Word': '#6a4fb3', Youth: '#d97a2b' };

// pages: welcome, then each chapter (a landscape photo alone, portraits in pairs), then the end page
function makePages() {
  const pages = [{ type: 'welcome' }];
  for (const ch of CHAPTERS) {
    const items = PHOTOS.filter((p) => p.group === ch);
    let first = true, pair = [];
    const push = (photos) => { pages.push({ type: 'photos', chapter: ch, heading: first, photos }); first = false; };
    for (const p of items) {
      if (p.w > p.h) { if (pair.length) { push(pair); pair = []; } push([p]); }
      else { pair.push(p); if (pair.length === 2) { push(pair); pair = []; } }
    }
    if (pair.length) push(pair);
  }
  // the end page must land on a right-hand page; a verse fills the gap when needed
  if ((pages.length - 1) % 2 === 1) pages.push({ type: 'verse' });
  pages.push({ type: 'end' });
  return pages;
}
const PAGES = makePages();
const tilt = (k) => ((k * 37) % 7 - 3) * 0.5; // small, repeatable photo angles
function pageHTML(pg, n) {
  if (!pg) return '<div class="pg pg--blank"></div>';
  if (pg.type === 'cover') return `<div class="cover">
      <div class="cover__medallion"><span class="brand__mark"><img src="assets/logo-sprite.png" alt="" /></span></div>
      <p class="cover__title">Life at<br />King’s Court</p>
      <p class="cover__sub">Dublin · A family of many nations</p>
      <button type="button" class="cover__hint" data-album-open>Open the album</button>
    </div>`;
  if (pg.type === 'welcome') return `<div class="pg pg--endpaper"><div class="pg__note">
      <p class="hand">Welcome to the family.</p>
      <p>These are the moments we share every week at King’s Court Dublin: worship, prayer, the Word and a lot of hugs.</p>
      <p class="pg__small">Turn the page, or pick a ribbon.</p></div></div>`;
  if (pg.type === 'verse') return `<div class="pg pg--quote"><p class="pg__verse">“Behold, how good and how pleasant it is for brethren to dwell together in unity!”</p><p class="pg__ref">Psalm 133:1 (KJV)</p><span class="pg__num">${n}</span></div>`;
  if (pg.type === 'end') return `<div class="pg pg--end"><p class="hand">Your photo belongs here.</p>
      <p>Every Sunday at 10am there’s a seat kept for you.</p>
      <a class="btn2 btn2--m btn2--ink" href="#visit">Plan your visit</a><span class="pg__num">${n}</span></div>`;
  const single = pg.photos.length === 1;
  return `<div class="pg${single ? ` pg--one ${pg.photos[0].w > pg.photos[0].h ? 'is-land' : 'is-port'}` : ''}">
      ${pg.heading ? `<p class="pg__chapter" style="--rib:${RIBBON[pg.chapter] || '#6a4fb3'}">${pg.chapter}</p>` : ''}
      <div class="pg__photos">${pg.photos.map((p) => {
        const i = PHOTOS.indexOf(p);
        return `<button type="button" class="mount" style="--ar:${p.w}/${p.h};--rot:${tilt(i)}deg" data-photo="${i}" aria-label="Open photo: ${p.title}">
          <img src="${p.src}" alt="" /><i></i><i></i><i></i><i></i>
          <span class="mount__cap hand">${p.title}</span></button>`;
      }).join('')}</div>
      <span class="pg__num">${n}</span></div>`;
}

const albumEl = $('[data-album]');
const book = $('[data-album-book]');
const tiltEl = $('[data-album-tilt]');
const countEl = $('[data-album-count]');
let mode = '', leaves = [], spread = 0, autoTimer = 0, hovering2 = false, visibleAlbum = false;
const singleMode = () => innerWidth <= 720;
function buildAlbum() {
  mode = singleMode() ? 'single' : 'spread';
  const cover = { type: 'cover' };
  leaves = mode === 'spread'
    ? [{ front: cover, back: PAGES[0] }, ...Array.from({ length: Math.ceil((PAGES.length - 1) / 2) }, (_, k) => ({ front: PAGES[2 * k + 1], back: PAGES[2 * k + 2] }))]
    : [{ front: cover }, ...PAGES.map((p) => ({ front: p }))];
  const num = (pg) => PAGES.indexOf(pg);
  book.innerHTML = leaves.map((l, i) => `<div class="leaf" data-leaf="${i}">
      <div class="leaf__face leaf__front">${pageHTML(l.front, num(l.front))}</div>
      <div class="leaf__face leaf__back">${mode === 'spread' ? pageHTML(l.back, num(l.back)) : ''}</div>
    </div>`).join('');
  albumEl.dataset.mode = mode;
  // ribbons: one per chapter, jumping to where it starts
  $('[data-album-ribbons]').innerHTML = CHAPTERS.map((ch, k) => `<button type="button" class="ribbon" style="--rib:${RIBBON[ch] || '#6a4fb3'};--k:${k}" data-chapter="${ch}">${ch}</button>`).join('');
  paintIcons(book);
  setSpread(Math.min(spread, leaves.length - 1), true);
}
function spreadFor(ch) {
  const pi = PAGES.findIndex((p) => p.chapter === ch && p.heading);
  if (mode === 'single') return pi + 1;
  return pi % 2 ? (pi + 1) / 2 : pi / 2 + 1;
}
function setSpread(s, instant = false) {
  const max = leaves.length - 1;
  s = clamp(s, 0, max);
  const from = spread;
  spread = s;
  albumEl.classList.toggle('is-open', s > 0);
  $$('.leaf', book).forEach((leaf, i) => {
    const flipped = i < s;
    // when jumping several pages, turn them one after another
    const delay = instant || reduceMotion ? 0 : Math.abs(i - (s > from ? from : s)) * 90;
    leaf.style.transitionDelay = `${Math.min(delay, 700)}ms`;
    leaf.classList.toggle('is-flipped', flipped);
    leaf.style.zIndex = flipped ? i + 1 : leaves.length - i;
    leaf.inert = mode === 'spread' ? !(i === s || i === s - 1) : i !== s;
  });
  $$('[data-album-step]').forEach((b) => { b.disabled = s === 0 || (b.dataset.albumStep === '-1' ? s <= 1 : s >= max); });
  countEl.textContent = s === 0 ? 'Open the album to begin' : mode === 'spread' ? `Spread ${s} of ${max}` : `Page ${s} of ${max}`;
  $$('[data-chapter]').forEach((r) => r.classList.toggle('is-here', s > 0 && spreadFor(r.dataset.chapter) <= s && (CHAPTERS[CHAPTERS.indexOf(r.dataset.chapter) + 1] === undefined || spreadFor(CHAPTERS[CHAPTERS.indexOf(r.dataset.chapter) + 1]) > s)));
}
// the slideshow: turn a page every few seconds while the album is open, visible and not hovered
function schedule2() {
  clearTimeout(autoTimer);
  if (reduceMotion || !visibleAlbum || hovering2 || spread === 0) return;
  autoTimer = setTimeout(() => {
    setSpread(spread >= leaves.length - 1 ? 1 : spread + 1);
    schedule2();
  }, spread >= leaves.length - 1 ? 6000 : 4200);
}
const go2 = (s) => { setSpread(s); schedule2(); };
albumEl.addEventListener('click', (e) => {
  const r = e.target.closest('[data-chapter]');
  if (r) return go2(spreadFor(r.dataset.chapter));
  const ph = e.target.closest('[data-photo]');
  if (ph) { showPhoto(+ph.dataset.photo); viewer.showModal(); return; }
  // only a click opens it (the button, or anywhere on the closed cover: 3D tilt can shift the button's hit area)
  if (spread === 0 && e.target.closest('[data-album-open], .cover')) return go2(1);
});
$$('[data-album-step]').forEach((b) => b.addEventListener('click', () => { if (spread > 0) go2(Math.max(1, spread + +b.dataset.albumStep)); }));
$('[data-album-all]').addEventListener('click', () => { showPhoto(0); viewer.showModal(); });
albumEl.addEventListener('keydown', (e) => {
  if (spread === 0) return;
  if (e.key === 'ArrowRight') go2(spread + 1);
  if (e.key === 'ArrowLeft') go2(Math.max(1, spread - 1));
});
// the album opens only from its "Open the album" button; tilt follows the cursor
new IntersectionObserver(([en]) => {
  visibleAlbum = en.isIntersecting;
  schedule2();
}, { threshold: 0.45 }).observe(albumEl);
albumEl.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') { hovering2 = true; schedule2(); } });
albumEl.addEventListener('pointerleave', () => { hovering2 = false; tiltEl.style.setProperty('--tx', '0deg'); tiltEl.style.setProperty('--ty', '0deg'); schedule2(); });
albumEl.addEventListener('pointermove', (e) => {
  if (e.pointerType !== 'mouse' || reduceMotion) return;
  const r = albumEl.getBoundingClientRect();
  tiltEl.style.setProperty('--ty', `${(((e.clientX - r.left) / r.width) - 0.5) * 6}deg`);
  tiltEl.style.setProperty('--tx', `${(0.5 - (e.clientY - r.top) / r.height) * 5}deg`);
});
let sx = null;
albumEl.addEventListener('touchstart', (e) => { sx = e.touches[0].clientX; }, { passive: true });
albumEl.addEventListener('touchend', (e) => {
  if (sx === null) return;
  const dx = e.changedTouches[0].clientX - sx;
  if (Math.abs(dx) > 40 && spread > 0) go2(Math.max(1, spread + (dx < 0 ? 1 : -1)));
  sx = null;
});
let lastMode = singleMode();
addEventListener('resize', () => { if (singleMode() !== lastMode) { lastMode = singleMode(); buildAlbum(); } });

// viewer: swipe, arrow keys, counter (all photos)
const viewer = $('[data-viewer]');
let vi = 0;
function showPhoto(i) {
  vi = (i + PHOTOS.length) % PHOTOS.length;
  const p = PHOTOS[vi];
  const img = $('[data-viewer-img]');
  img.src = p.src;
  img.alt = p.title;
  $('[data-viewer-title]').textContent = p.title;
  $('[data-viewer-meta]').textContent = p.group;
  $('[data-viewer-count]').textContent = `${vi + 1} / ${PHOTOS.length}`;
}
viewer.addEventListener('close', () => schedule2());
buildAlbum();
$$('[data-viewer-step]').forEach((b) => b.addEventListener('click', () => showPhoto(vi + +b.dataset.viewerStep)));
$('[data-viewer-close]').addEventListener('click', () => viewer.close());
viewer.addEventListener('click', (e) => { if (e.target === viewer) viewer.close(); });
viewer.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowRight') showPhoto(vi + 1);
  if (e.key === 'ArrowLeft') showPhoto(vi - 1);
});
let touchX = null;
viewer.addEventListener('touchstart', (e) => { touchX = e.touches[0].clientX; }, { passive: true });
viewer.addEventListener('touchend', (e) => {
  if (touchX === null) return;
  const dx = e.changedTouches[0].clientX - touchX;
  if (Math.abs(dx) > 40) showPhoto(vi + (dx < 0 ? 1 : -1));
  touchX = null;
});

// ---------------------------------------------------------------- give: bank details with copy buttons
// Account name per Biola; the other details are placeholders until the church confirms them
// (the Figma frame's IBAN/BIC belong to a different organisation's account).
const BANK = [
  { label: 'Account Name', value: 'RCCG King’s Court' },
  { label: 'IBAN', value: '[IBAN to confirm]', mono: true },
  { label: 'Bank Name', value: '[Bank name]' },
  { label: 'BIC / SWIFT', value: '[BIC to confirm]', mono: true },
];
$('[data-bank]').innerHTML = BANK.map((f, i) => {
  const pending = f.value.startsWith('[');
  return `<div class="bank__field">
      <span class="bank__label">${f.label}</span>
      <span class="bank__row"><b class="${f.mono ? 'tabular bank__mono' : ''}${pending ? ' is-pending' : ''}" id="bank-${i}">${f.value}</b>
      <button type="button" class="bank__copy" data-copy="${i}" ${pending ? 'disabled aria-label="' + f.label + ' not confirmed yet"' : `aria-label="Copy ${f.label}"`}>${icon('copy', 20)}<span class="bank__copied" aria-live="polite"></span></button></span>
    </div>`;
}).join('');
$('[data-bank]').addEventListener('click', async (e) => {
  const b = e.target.closest('[data-copy]');
  if (!b || b.disabled) return;
  const text = BANK[+b.dataset.copy].value;
  const done = (msg) => { const t = $('.bank__copied', b); t.textContent = msg; b.classList.add('is-done'); setTimeout(() => { b.classList.remove('is-done'); t.textContent = ''; }, 1600); };
  try { await navigator.clipboard.writeText(text); done('Copied'); }
  catch {
    // fallback: select the text so it can be copied by hand
    const r = document.createRange(); r.selectNodeContents($(`#bank-${b.dataset.copy}`));
    const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r); done('Selected');
  }
});

// ---------------------------------------------------------------- global family: auto-scrolling photo rows
// Real King's Court photos drifting continuously: the top row to the left, the bottom row to the right.
// Each row holds its photos twice so the loop is seamless. Hover pauses; reduced motion stops it.
const FAMILY = [
  { src: 'assets/web/family-4.jpg', w: 3, h: 2 }, { src: 'assets/web/family-2.jpg', w: 2, h: 3 },
  { src: 'assets/web/about-pastor.jpg', w: 2, h: 3 }, { src: 'assets/v2/vigil-stage.jpg', w: 3, h: 2 },
  { src: 'assets/web/family-3.jpg', w: 2, h: 3 }, { src: 'assets/web/service-youth.jpg', w: 2, h: 3 },
  { src: 'assets/web/about-worship.jpg', w: 2, h: 3 }, { src: 'assets/web/family-1.jpg', w: 2, h: 3 },
  { src: 'assets/v2/morning-glory.jpg', w: 2, h: 3 }, { src: 'assets/web/service-digging.jpg', w: 2, h: 3 },
  { src: 'assets/web/service-family.jpg', w: 2, h: 3 }, { src: 'assets/web/service-faith-clinic.jpg', w: 4, h: 5 },
];
$$('[data-team-row]').forEach((row, r) => {
  const order = r === 0 ? FAMILY : [...FAMILY.slice(6), ...FAMILY.slice(0, 6)].reverse();
  row.innerHTML = `<div class="team__track team__track--${r === 0 ? 'left' : 'right'}">${[...order, ...order].map((p, i) =>
    `<img src="${p.src}" alt="" style="--ar:${p.w}/${p.h}" ${i >= order.length ? 'aria-hidden="true"' : ''} />`).join('')}</div>`;
});

// First Timer form (opens from "Join us Now")
const join = $('[data-join]');
const joinForm = $('[data-join-form]');
const joinDone = $('[data-join-done]');
$$('[data-join-open]').forEach((b) => b.addEventListener('click', () => { joinForm.hidden = false; joinDone.hidden = true; join.showModal(); $('#ft-name').focus(); }));
join.addEventListener('click', (e) => { if (e.target === join || e.target.closest('[data-join-close]')) join.close(); });
joinForm.addEventListener('submit', (e) => {
  e.preventDefault();
  if (!check(joinForm)) return;
  const first = $('#ft-name').value.trim().split(/\s+/)[0];
  $('[data-join-summary]').textContent = `Thank you, ${first}. Someone from our welcome team will be in touch soon. We’d love to meet you on Sunday at 10am.`;
  joinForm.hidden = true;
  joinDone.hidden = false;
  joinDone.focus();
  joinForm.reset();
});

// ---------------------------------------------------------------- forms
// Not connected to a backend yet: wire submit handlers to the church's form service.
function check(form) {
  const bad = $$('[required]', form).find((f) => (f.type === 'checkbox' ? !f.checked : !f.value.trim()));
  const err = $('[data-error]', form);
  $$('[aria-invalid]', form).forEach((f) => f.removeAttribute('aria-invalid'));
  if (!bad) { err.hidden = true; return true; }
  bad.setAttribute('aria-invalid', 'true');
  const name = bad.type === 'checkbox' ? 'Tick the consent box to continue.' : `Add ${$(`label[for="${bad.id}"]`, form)?.textContent.toLowerCase() || 'this field'} to continue.`;
  err.textContent = name.replace('add what would you like us to pray about?', 'Tell us what you’d like us to pray about');
  err.hidden = false;
  bad.focus();
  return false;
}

// prayer: inline on desktop, a bottom sheet on phones
const prayerForm = $('[data-prayer-form]');
const prayerCard = $('[data-prayer-card]');
const prayerSlot = $('[data-prayer-slot]');
const prayerDone = $('[data-prayer-done]');
const count = $('[data-count]');
$('#pr-text').addEventListener('input', (e) => { count.textContent = e.target.value.length; });
prayerForm.addEventListener('submit', (e) => {
  e.preventDefault();
  if (!check(prayerForm)) return;
  prayerForm.hidden = true;
  prayerDone.hidden = false;
  prayerDone.focus();
  prayerForm.reset();
  count.textContent = '0';
});
$('[data-prayer-again]').addEventListener('click', () => {
  prayerDone.hidden = true;
  prayerForm.hidden = false;
  $('#pr-text').focus();
});
const prayerSheet = document.createElement('dialog');
prayerSheet.className = 'sheet sheet--dawn';
prayerSheet.setAttribute('aria-label', 'Send a prayer request');
prayerSheet.innerHTML = '<button class="sheet__close" type="button" aria-label="Close" data-sheet-close></button>';
$('[data-sheet-close]', prayerSheet).innerHTML = icon('x', 20);
document.body.append(prayerSheet);
$('[data-prayer-open]').addEventListener('click', () => { prayerSheet.append(prayerCard); prayerSheet.showModal(); $('#pr-text').focus(); });
prayerSheet.addEventListener('close', () => prayerSlot.append(prayerCard));
$('[data-sheet-close]', prayerSheet).addEventListener('click', () => prayerSheet.close());
prayerSheet.addEventListener('click', (e) => { if (e.target === prayerSheet) prayerSheet.close(); });

// reserve a seat
const reserve = $('[data-reserve]');
const reserveForm = $('[data-reserve-form]');
const reserveDone = $('[data-reserve-done]');
function fillSundays() {
  const sel = $('[data-sundays]');
  const first = nextService(SCHEDULE[0]);
  sel.innerHTML = [0, 1, 2, 3].map((k) => {
    const d = new Date(first.start.getTime() + k * 7 * 864e5);
    return `<option value="${d.toISOString()}">${formatDay(d)} · 10:00am${k === 0 && first.live ? ' (now)' : ''}</option>`;
  }).join('');
}
$$('[data-reserve-open]').forEach((b) => b.addEventListener('click', () => {
  fillSundays();
  reserveForm.hidden = false;
  reserveDone.hidden = true;
  reserve.showModal();
  $('#rs-day').focus();
}));
$('[data-reserve-close]').addEventListener('click', () => reserve.close());
reserve.addEventListener('click', (e) => { if (e.target === reserve) reserve.close(); });
reserveForm.addEventListener('submit', (e) => {
  e.preventDefault();
  if (!check(reserveForm)) return;
  const d = new Date($('#rs-day').value);
  const seats = +$('#rs-seats').value;
  const name = $('#rs-name').value.trim();
  $('[data-reserve-summary]').textContent = `Thanks, ${name}. ${seats === 1 ? 'A seat is' : `${seats} seats are`} kept for you on ${formatDay(d)} at 10:00am. Doors open at 9:40am${$('#rs-meet').checked ? ', and a greeter will meet you at the door' : ''}.`;
  $('[data-reserve-links]').innerHTML = linksHTML(calendarLinks({ title: 'Sunday Family Service · King’s Court', start: d, end: new Date(d.getTime() + 2.5 * 3600e3), weekly: false }));
  reserveForm.hidden = true;
  reserveDone.hidden = false;
  reserveDone.focus();
  reserveForm.reset();
});

// ---------------------------------------------------------------- sermons
// Latest messages from youtube.com/@kingscourtparish (snapshot 10 Nov 2026).
// On the live site, refresh this list from the channel's RSS feed or the YouTube Data API.
const CHANNEL = 'https://www.youtube.com/@kingscourtparish';
const SERMONS = [
  { id: 'PMCBURcHvSE', title: 'Sunday Service', date: 'Sun 8 Nov', length: '1h 36m' },
  { id: 'eltJR2Sjcao', title: 'November Thanksgiving Service', date: 'Sun 1 Nov', length: '1h 55m' },
  { id: 'bsazduuln2Q', title: 'Overcomers · YAYA Week', date: 'Sat 31 Oct', length: '3h 7m' },
  { id: 'A-3Di9ttFnY', title: 'Sunday Service', date: 'Sun 25 Oct', length: '2h 0m' },
  { id: 'N_QbH4anhiE', title: 'Sunday Service', date: 'Sun 18 Oct', length: '2h 18m' },
  { id: 'JakUOcI7j6c', title: 'Sunday Service', date: 'Sun 11 Oct', length: '1h 41m' },
];
const CHANNEL_ID = 'UCjXqOKDinSRsMgLXhPw2VAQ';
const watchUrl = (v) => `https://www.youtube.com/watch?v=${v}`;
const thumb = (v) => `assets/v2/yt-${v}.jpg`;
(function renderSermons() {
  const [f, ...rest] = SERMONS;
  $('[data-sermons]').innerHTML = `
    <article class="sermon-feature">
      <a class="sermon-feature__media" href="${watchUrl(f.id)}" data-play="${f.id}" target="_blank" rel="noopener" aria-label="Play ${f.title}, ${f.date}, on YouTube">
        <img src="${thumb(f.id)}" alt="" data-feature-img />
        <span class="sermon-feature__play" aria-hidden="true">${icon('play-fill', 26)}</span>
      </a>
      <div class="sermon-feature__body">
        <p class="caps caps--dark">Latest · ${f.date}</p>
        <h3>${f.title}</h3>
        <p class="sermon-feature__meta">King’s Court Dublin · ${f.length}</p>
        <div class="sermon-feature__actions">
          <a class="btn2 btn2--m btn2--white" href="${watchUrl(f.id)}" data-play="${f.id}" target="_blank" rel="noopener">${icon('play-fill', 16)} Watch</a>
          <a class="btn2 btn2--m btn2--outline-light" href="${CHANNEL}?sub_confirmation=1" target="_blank" rel="noopener">Subscribe</a>
        </div>
      </div>
    </article>
    <ul class="sermon-list">${rest.map((s) => `
      <li><a class="sermon-row" href="${watchUrl(s.id)}" data-play="${s.id}" target="_blank" rel="noopener" aria-label="Play ${s.title}, ${s.date}, on YouTube">
        <img src="${thumb(s.id)}" alt="" />
        <span class="sermon-row__body"><b>${s.title}</b><span>${s.date} · ${s.length}</span><em>${icon('play-fill', 14)} Play</em></span>
      </a></li>`).join('')}
    </ul>`;
})();

// ---------------------------------------------------------------- on-page player
// Privacy-enhanced YouTube embeds, loaded only when someone presses play (no cookies before that).
// Where embeds are blocked (the claude.ai preview), it shows the thumbnail and a link out instead.
const player = $('[data-player]');
const frame = $('[data-player-frame]');
let embedsBlocked = false;
document.addEventListener('securitypolicyviolation', (e) => {
  if (!/frame/.test(e.violatedDirective) || !/youtube/.test(e.blockedURI)) return;
  embedsBlocked = true;
  if (player.open) showFallback();
});
let current = null;
function showFallback() {
  const bg = current.thumb ? `<img src="${current.thumb}" alt="" />` : '';
  frame.innerHTML = `<div class="player__fallback">${bg}<div><p>Videos play here on the live website. This preview can’t show them.</p>
    <a class="btn2 btn2--m btn2--white" href="${current.out}" target="_blank" rel="noopener">${icon('play-fill', 16)} Watch on YouTube</a></div></div>`;
}
function openPlayer({ embed, out, title, when, thumb }) {
  current = { embed, out, thumb };
  $('[data-player-title]').textContent = title;
  $('[data-player-when]').textContent = when;
  $('[data-player-out]').href = out;
  if (embedsBlocked) showFallback();
  else frame.innerHTML = `<iframe src="${embed}" title="${title}" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>`;
  player.showModal();
  document.body.style.overflow = 'hidden';
}
player.addEventListener('close', () => { frame.innerHTML = ''; document.body.style.overflow = ''; }); // stops playback
$('[data-player-close]').addEventListener('click', () => player.close());
player.addEventListener('click', (e) => { if (e.target === player) player.close(); });
const EMBED = 'https://www.youtube-nocookie.com/embed/';
document.addEventListener('click', (e) => {
  const a = e.target.closest('[data-play], a[href^="https://www.youtube.com/@kingscourtparish/live"]');
  if (!a || e.metaKey || e.ctrlKey || e.shiftKey) return; // let people open a new tab if they want
  e.preventDefault();
  if (a.dataset.play) {
    const s = SERMONS.find((x) => x.id === a.dataset.play);
    openPlayer({ embed: `${EMBED}${s.id}?autoplay=1&rel=0&playsinline=1`, out: watchUrl(s.id), title: s.title, when: `${s.date} · ${s.length}`, thumb: thumb(s.id) });
  } else {
    openPlayer({ embed: `${EMBED}live_stream?channel=${CHANNEL_ID}&autoplay=1&playsinline=1`, out: a.href, title: 'King’s Court Dublin · Live', when: 'Live on YouTube · if we’re not live yet, the stream starts here at service time', thumb: thumb(SERMONS[0].id) });
  }
});

// the glow follows whatever sermon is featured
const featureImg = $('[data-feature-img]');
const glowImg = $('[data-glow]');
const syncGlow = () => { if (glowImg.src !== featureImg.src) glowImg.src = featureImg.src; };
new MutationObserver(syncGlow).observe(featureImg, { attributes: true, attributeFilter: ['src'] });
syncGlow();

paintIcons();
if (!canHover) document.documentElement.classList.add('touch');

// ---------------------------------------------------------------- FAQ accordion (one open at a time)
(() => {
  const list = $('[data-faq]');
  if (!list) return;
  const setOpen = (item, open) => {
    item.classList.toggle('is-open', open);
    const q = $('.faq__q', item), a = $('.faq__a', item);
    q.setAttribute('aria-expanded', open);
    a.inert = !open;
  };
  list.addEventListener('click', (e) => {
    const q = e.target.closest('.faq__q');
    if (!q) return;
    const item = q.closest('.faq__item');
    const open = !item.classList.contains('is-open');
    $$('.faq__item.is-open', list).forEach((it) => it !== item && setOpen(it, false));
    setOpen(item, open);
  });
})();
