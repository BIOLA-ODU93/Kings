// About King's Court (immersive): intro photo settles into place, the mission line by line,
// a sideways walk through the years, and the pastor's portrait coming forward.
import { $, $$, clamp, lerp, smooth, root, moving, paintIcons, updateChrome, renderFAQ } from './chrome.js';

renderFAQ($('[data-faq]'));
paintIcons();

const introOpen = $('[data-intro-open]');
const mainImg = $('[data-intro-main]'), smallImg = $('[data-intro-small]'), introCopy = $('[data-intro-copy]'), shade = $('[data-intro-shade]');
const standHead = $('[data-stand-head]'), standItems = $$('[data-stand-list] li');
const history = $('[data-history]'), years = $$('li', history), line = $('[data-history-line]');
const pastorImg = $('[data-pastor-img]'), pastorCopy = $('[data-pastor-copy]');
const progressBar = $('[data-progress]');
const narrowQ = matchMedia('(max-width: 720px)');

const pinP = (el) => { const r = el.getBoundingClientRect(); const run = r.height - innerHeight; return run > 0 ? clamp(-r.top / run) : (r.top < 0 ? 1 : 0); };
const onScreen = (el) => { const r = el.getBoundingClientRect(); return r.bottom > -100 && r.top < innerHeight + 100; };

// where the intro photo rests (from the CSS), so it can start full screen and settle there
let rest = null;
function measure() {
  mainImg.style.transform = 'none';
  const r = mainImg.getBoundingClientRect(), stage = mainImg.parentElement.getBoundingClientRect();
  rest = { x: r.left - stage.left, y: r.top - stage.top, w: r.width, h: r.height };
}

let queued = false;
function tick() {
  queued = false;
  const W = innerWidth, H = innerHeight;
  progressBar.style.setProperty('--done', clamp(scrollY / (root.scrollHeight - H)));
  updateChrome();
  if (!moving) return;

  // intro
  const intro = $('#story');
  if (onScreen(intro) && rest) {
    const p = pinP(intro), t = smooth(0.04, 0.55, p);
    const s = Math.max(W / rest.w, H / rest.h);
    const dx = W / 2 - (rest.x + rest.w / 2), dy = H / 2 - (rest.y + rest.h / 2);
    mainImg.style.transform = `translate3d(${(dx * (1 - t)).toFixed(1)}px, ${(dy * (1 - t)).toFixed(1)}px, 0) scale(${lerp(s, 1, t).toFixed(4)})`;
    mainImg.style.borderRadius = `${(20 * t).toFixed(1)}px`;
    const a = smooth(0.42, 0.68, p);
    smallImg.style.opacity = a.toFixed(3);
    smallImg.style.transform = `translateY(${((1 - a) * 40).toFixed(1)}px)`;
    const c = smooth(0.5, 0.78, p);
    introCopy.style.opacity = c.toFixed(3);
    introCopy.style.translate = `0 ${((1 - c) * 24).toFixed(1)}px`;
    shade.style.opacity = (1 - t * 0.6).toFixed(3);
    const o = 1 - smooth(0.08, 0.26, p);
    introOpen.style.opacity = o.toFixed(3);
    introOpen.style.translate = `0 ${((1 - o) * -30).toFixed(1)}px`;
  }

  // who we stand for: the mission, then each line takes the room in turn
  const stand = $('#stand');
  if (onScreen(stand)) {
    const p = pinP(stand);
    const h = 1 - smooth(0.18, 0.28, p);
    standHead.style.opacity = h.toFixed(3);
    standHead.style.transform = `translateY(calc(-50% - ${((1 - h) * 40).toFixed(1)}px))`;
    standItems.forEach((li, i) => {
      const c = 0.42 + i * 0.22;
      const o = smooth(c - 0.12, c - 0.04, p) * (i === standItems.length - 1 ? 1 : 1 - smooth(c + 0.06, c + 0.12, p));
      li.style.opacity = o.toFixed(3);
      li.style.transform = `translateY(calc(-50% + ${((1 - o) * (p < c ? 40 : -40)).toFixed(1)}px))`;
    });
  }

  // history: walk sideways through the years
  const hist = $('#history');
  if (onScreen(hist)) {
    const p = pinP(hist);
    const travel = Math.max(0, history.scrollWidth - W + (narrowQ.matches ? 32 : 200));
    history.style.transform = `translate3d(${(-travel * smooth(0.06, 0.9, p)).toFixed(1)}px, 0, 0)`;
    line.style.setProperty('--line', smooth(0.04, 0.94, p).toFixed(4));
    years.forEach((li) => { const r = li.getBoundingClientRect(); li.style.setProperty('--on', smooth(W * 0.9, W * 0.55, r.left + 40).toFixed(3)); });
  }

  // pastor: the portrait comes forward
  const pastor = $('#pastor');
  if (onScreen(pastor) && !narrowQ.matches) {
    const p = pinP(pastor);
    pastorImg.style.transform = `scale(${lerp(1.18, 1, smooth(0, 0.6, p)).toFixed(4)})`;
    const c = smooth(0.12, 0.45, p);
    pastorCopy.style.opacity = c.toFixed(3);
    pastorCopy.style.translate = `0 ${((1 - c) * 28).toFixed(1)}px`;
  }
}
const queue = () => { if (!queued) { queued = true; requestAnimationFrame(tick); } };
addEventListener('scroll', queue, { passive: true });
addEventListener('resize', () => { measure(); queue(); });
if (moving) measure();
tick();
