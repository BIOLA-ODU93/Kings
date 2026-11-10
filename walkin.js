// Walk-in hero: through the doors → up the aisle → the seat kept for you.
// Scroll progress (0–1) scrubs a filmed camera move (a frame sequence drawn to a
// canvas); the live Dublin clock tints the light. The current frames are an AI
// concept of the hall; the media team's real walk-in footage replaces them 1:1
// (same folder, same frame count in frames.json).
import {
  dublinParts, atDublinHour, phaseOf, formatClock, formatDay,
  nextService, untilText, SERVICES,
} from './time.js';

const $ = (s, el = document) => el.querySelector(s);
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t); };
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

// where things sit in the film, as fractions of the frame (used for focus and hover)
const DOOR = { x: 0.5, y: 0.5, w: 0.34, h: 0.8 };
const SEAT = { x: 0.665, y: 0.86 };

// ---------------------------------------------------------------- DOM
const section = $('#walkin');
const stage = $('.walkin__stage');
const canvas = $('#scene');
const ctx = canvas.getContext('2d');
const layers = {
  intro: $('[data-layer="intro"]'),
  event: $('[data-layer="event"]'),
  cue: $('[data-layer="cue"]'),
  end: $('[data-layer="end"]'),
};
const reveal = $('.reveal');
const beats = [...document.querySelectorAll('[data-beat]')];
const doorTag = $('.door-tag');
const bar = $('.progress span');

function progress() {
  const r = section.getBoundingClientRect();
  const run = r.height - innerHeight;
  return run > 0 ? clamp(-r.top / run) : 0;
}

// ---------------------------------------------------------------- frames
const frames = [];
let count = 0;
let base = '';
const poster = new Image();

async function loadFrames() {
  const res = await fetch('assets/walkin/frames.json');
  const manifest = await res.json();
  count = manifest.count;
  base = manifest.path;
  const src = (i) => `${base}${String(i).padStart(3, '0')}.jpg`;
  // first and last frames first (the two resting states), then the rest coarse-to-fine
  const order = [0, count - 1];
  for (let step = 32; step >= 1; step >>= 1) {
    for (let i = 0; i < count; i += step) if (!order.includes(i)) order.push(i);
  }
  let next = 0;
  const worker = () => {
    if (next >= order.length) return;
    const i = order[next++];
    const img = new Image();
    img.decoding = 'async';
    img.onload = img.onerror = () => { frames[i] = img.naturalWidth ? img : null; dirty = true; worker(); };
    img.src = src(i);
  };
  for (let k = 0; k < 6; k++) worker();
}

// nearest loaded frame at or around i
function frameAt(i) {
  for (let d = 0; d < count; d++) {
    if (frames[i - d]) return frames[i - d];
    if (frames[i + d]) return frames[i + d];
  }
  return poster.complete && poster.naturalWidth ? poster : null;
}

// ---------------------------------------------------------------- canvas
let W = 0, H = 0, dpr = 1, narrow = false;
function resize() {
  dpr = Math.min(devicePixelRatio || 1, 2);
  W = stage.clientWidth; H = stage.clientHeight;
  canvas.width = Math.round(W * dpr);
  canvas.height = Math.round(H * dpr);
  narrow = W / H < 0.9;
  dirty = true;
}
addEventListener('resize', resize);

// cover-fit the film, keeping the focus point (fx, fy) in view; zoom > 1 pushes in
function cover(img, fx, fy, zoom) {
  const iw = img.naturalWidth, ih = img.naturalHeight;
  const s = Math.max(W / iw, H / ih) * zoom;
  const dw = iw * s, dh = ih * s;
  const x = clamp(W / 2 - fx * dw, W - dw, 0);
  const y = clamp(H / 2 - fy * dh, H - dh, 0);
  return { x, y, dw, dh };
}

// tint the film by Dublin's time of day (live, or the hour previewed on the clock)
const GRADES = {
  night: { tint: 'rgba(20, 30, 70, 0.32)', mode: 'multiply', lift: 0.88 },
  dawn: { tint: 'rgba(255, 170, 130, 0.14)', mode: 'soft-light', lift: 0.96 },
  morning: { tint: 'rgba(255, 236, 210, 0)', mode: 'soft-light', lift: 1 },
  afternoon: { tint: 'rgba(255, 220, 170, 0.08)', mode: 'soft-light', lift: 1 },
  evening: { tint: 'rgba(255, 140, 70, 0.22)', mode: 'soft-light', lift: 0.94 },
};
let grade = GRADES.morning;

function draw(sp, px, py, seatGlow, time) {
  // the walk takes most of the scroll; the last part holds on the seat
  const u = clamp((sp - 0.01) / 0.86);
  const f = u * (count - 1);
  const a = frameAt(Math.floor(f));
  if (!a) return;
  const b = frameAt(Math.min(count - 1, Math.floor(f) + 1));
  const mix = f - Math.floor(f);

  // on phones follow the doors, then the seat
  // (the phone copy sits at the top, so the seat can stay low in the frame)
  const arrive = narrow ? smooth(0.55, 0.9, sp) : 0;
  const fx = lerp(narrow ? DOOR.x : 0.5, SEAT.x - 0.02, arrive);
  const fy = lerp(0.5, SEAT.y, arrive);
  const zoom = lerp(1.06, 1.25, arrive) + (reduceMotion ? 0 : 0.012 * Math.sin(time * 0.4));
  const r = cover(a, fx - px * 0.012, fy - py * 0.01, zoom);

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;
  ctx.filter = grade.lift < 1 ? `brightness(${grade.lift})` : 'none';
  ctx.drawImage(a, r.x, r.y, r.dw, r.dh);
  if (b && b !== a && mix > 0.02) { ctx.globalAlpha = mix; ctx.drawImage(b, r.x, r.y, r.dw, r.dh); }
  ctx.filter = 'none';
  ctx.globalAlpha = 1;

  // time-of-day tint
  if (grade.tint.endsWith(', 0)') === false) {
    ctx.globalCompositeOperation = grade.mode;
    ctx.fillStyle = grade.tint;
    ctx.fillRect(0, 0, W, H);
  }

  // the seat lights up as you arrive
  if (seatGlow > 0.01) {
    const sx = r.x + SEAT.x * r.dw, sy = r.y + SEAT.y * r.dh;
    const rad = Math.max(W, H) * 0.22;
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = seatGlow * 0.55;
    ctx.fillStyle = 'rgba(7, 6, 10, 1)';
    ctx.fillRect(0, 0, W, H); // the room dims around you
    ctx.globalCompositeOperation = 'destination-out';
    let g = ctx.createRadialGradient(sx, sy, rad * 0.15, sx, sy, rad);
    g.addColorStop(0, 'rgba(0,0,0,1)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.globalAlpha = 1;
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    // redraw the lit circle from the film, then warm it
    ctx.globalCompositeOperation = 'destination-over';
    ctx.drawImage(a, r.x, r.y, r.dw, r.dh);
    ctx.globalCompositeOperation = 'screen';
    g = ctx.createRadialGradient(sx, sy - rad * 0.3, 0, sx, sy - rad * 0.3, rad * 0.9);
    g.addColorStop(0, `rgba(255, 214, 150, ${0.34 * seatGlow})`);
    g.addColorStop(1, 'rgba(255, 214, 150, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }
  ctx.globalCompositeOperation = 'source-over';
  lastRect = r;
}
let lastRect = null;

// ---------------------------------------------------------------- clock UI
const clockEl = $('[data-clock]');
const clockPill = $('.clock__pill', clockEl);
const clockPanel = $('.clock__panel', clockEl);
const clockRange = $('[data-clock-range]', clockEl);
let previewHour = null; // null = live Dublin time

function sceneDate() { return previewHour === null ? new Date() : atDublinHour(previewHour); }

function updateClock() {
  const date = sceneDate();
  const { hours } = dublinParts(date);
  const phase = phaseOf(hours);
  const key = phase.name.toLowerCase();
  clockEl.dataset.phase = key;
  clockEl.dataset.mode = previewHour === null ? 'live' : 'preview';
  $('[data-clock-phase]', clockEl).textContent = phase.name;
  $('[data-clock-time]', clockEl).textContent = formatClock(date);
  $('[data-clock-live]', clockEl).hidden = previewHour === null;
  if (document.activeElement !== clockRange) clockRange.value = hours.toFixed(2);
  document.querySelectorAll('[data-greeting]').forEach((el) => { el.textContent = phase.greeting; });
  grade = GRADES[key] || GRADES.morning;
  dirty = true;

  // service status is always about the real clock
  const next = nextService(SERVICES.sunday);
  const status = $('[data-service-status]');
  const cta = $('[data-service-cta]');
  if (next?.live) {
    status.innerHTML = '<span class="live-dot"></span> Live now · Sunday service';
    cta.textContent = 'Join the live service';
    cta.href = '#watch';
  } else if (next) {
    status.textContent = `Next service · ${formatDay(next.start)}, 10am · ${untilText(next.start - Date.now())}`;
    cta.textContent = 'Plan your visit';
    cta.href = '#visit';
  }
}

clockPill.addEventListener('click', () => {
  const open = clockPanel.hidden;
  clockPanel.hidden = !open;
  clockPill.setAttribute('aria-expanded', String(open));
});
document.addEventListener('click', (e) => {
  if (!clockPanel.hidden && !clockEl.contains(e.target)) {
    clockPanel.hidden = true;
    clockPill.setAttribute('aria-expanded', 'false');
  }
});
clockRange.addEventListener('input', () => { previewHour = +clockRange.value; updateClock(); });
$('[data-clock-live]', clockEl).addEventListener('click', () => { previewHour = null; updateClock(); });

// ---------------------------------------------------------------- "Step inside": walk in for you
let auto = null;
function walkIn() {
  const to = section.offsetTop + (section.offsetHeight - innerHeight);
  if (reduceMotion) { scrollTo(0, to); return; }
  auto = { from: scrollY, to, t0: performance.now(), dur: 5200 };
}
const cancelAuto = () => { auto = null; };
addEventListener('wheel', cancelAuto, { passive: true });
addEventListener('touchstart', cancelAuto, { passive: true });
addEventListener('keydown', cancelAuto);
document.querySelectorAll('[data-walk]').forEach((b) => b.addEventListener('click', walkIn));

// ---------------------------------------------------------------- pointer
const pointer = { x: 0, y: 0 }, parallax = { x: 0, y: 0 };
let hovering = false;
let sp = progress();

function overDoor(clientX, clientY) {
  if (sp > 0.04 || !lastRect) return false;
  const c = canvas.getBoundingClientRect();
  const x = (clientX - c.left - lastRect.x) / lastRect.dw;
  const y = (clientY - c.top - lastRect.y) / lastRect.dh;
  return Math.abs(x - DOOR.x) < DOOR.w / 2 && Math.abs(y - DOOR.y) < DOOR.h / 2;
}
stage.addEventListener('pointermove', (e) => {
  const r = canvas.getBoundingClientRect();
  pointer.x = ((e.clientX - r.left) / r.width) * 2 - 1;
  pointer.y = ((e.clientY - r.top) / r.height) * 2 - 1;
  doorTag.style.left = `${e.clientX - r.left}px`;
  doorTag.style.top = `${e.clientY - r.top}px`;
  hovering = e.pointerType === 'mouse' && e.target === canvas && overDoor(e.clientX, e.clientY);
});
stage.addEventListener('pointerleave', () => { hovering = false; pointer.x = pointer.y = 0; });
canvas.addEventListener('click', (e) => { if (overDoor(e.clientX, e.clientY)) walkIn(); });

// ---------------------------------------------------------------- frame loop
let onScreen = true;
new IntersectionObserver(([e]) => { onScreen = e.isIntersecting; }).observe(section);

function style(el, o, y = 0, blur = 0) {
  el.style.opacity = o.toFixed(3);
  el.style.transform = y ? `translateY(${y.toFixed(1)}px)` : '';
  el.style.filter = blur > 0.05 ? `blur(${blur.toFixed(1)}px)` : '';
  el.style.visibility = o < 0.01 ? 'hidden' : 'visible';
}

let dirty = true;
let last = performance.now();
let lastKey = '';

function frame(now) {
  requestAnimationFrame(frame);
  const dt = clamp((now - last) / 1000, 0, 0.05) || 0.016;
  last = now;
  if (auto) {
    const k = clamp((now - auto.t0) / auto.dur);
    scrollTo(0, lerp(auto.from, auto.to, 0.5 - Math.cos(Math.PI * k) / 2));
    if (k >= 1) auto = null;
  }
  if (!onScreen) return;

  const raw = progress();
  sp = reduceMotion ? raw : lerp(sp, raw, 1 - Math.exp(-dt * 7));
  if (!Number.isFinite(sp) || Math.abs(sp - raw) < 1e-4) sp = raw;
  if (sp > 0.04) hovering = false;
  const pk = reduceMotion ? 0 : 1 - Math.exp(-dt * 3);
  parallax.x = lerp(parallax.x, pointer.x, pk);
  parallax.y = lerp(parallax.y, pointer.y, pk);
  const time = now / 1000;
  const seatGlow = smooth(0.8, 0.95, sp);

  // only repaint when something moved
  const key = `${sp.toFixed(4)}|${parallax.x.toFixed(3)}|${parallax.y.toFixed(3)}`;
  if (dirty || key !== lastKey || !reduceMotion) {
    draw(sp, parallax.x, parallax.y, seatGlow, time);
    lastKey = key;
    dirty = false;
  }

  // copy
  const introOut = smooth(0.005, 0.06, sp);
  style(layers.intro, 1 - introOut, -introOut * 30);
  style(layers.event, 1 - introOut, introOut * 20);
  style(layers.cue, (1 - smooth(0, 0.02, sp)) * (hovering ? 0 : 1));
  const windows = [[0.16, 0.24], [0.4, 0.48], [0.62, 0.7]];
  beats.forEach((b, i) => {
    const k = smooth(windows[i][0], windows[i][1], sp);
    style(b, k, (1 - k) * 28, (1 - k) * 14);
  });
  const end = smooth(0.86, 0.95, sp);
  style(layers.end, end, (1 - end) * 20);
  reveal.classList.toggle('is-live', end > 0.5);
  layers.intro.style.pointerEvents = introOut > 0.5 ? 'none' : '';
  const clockOn = 1 - smooth(0.02, 0.08, sp);
  clockEl.style.opacity = clockOn.toFixed(3);
  clockEl.style.visibility = clockOn < 0.01 ? 'hidden' : 'visible';
  doorTag.classList.toggle('is-on', hovering);
  canvas.style.cursor = hovering ? 'pointer' : '';
  bar.style.transform = `scaleX(${sp.toFixed(4)})`;
  stage.style.setProperty('--top-shade', smooth(0.12, 0.2, sp).toFixed(3));
}

resize();
updateClock();
setInterval(updateClock, 30000);
poster.onload = () => { dirty = true; };
poster.src = 'assets/walkin/poster.jpg';
loadFrames();
requestAnimationFrame(frame);
