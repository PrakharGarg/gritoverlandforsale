// ---------- Nav background + van progress trail ----------
const nav = document.querySelector('.nav');
const trailLine = document.querySelector('.trail__line');
const trailVan = document.querySelector('.trail__van');

function onScroll() {
  const max = document.documentElement.scrollHeight - innerHeight;
  const pct = max > 0 ? scrollY / max : 0;
  trailLine.style.width = `${pct * 100}%`;
  trailVan.style.left = `calc(${pct * 100}% + ${(0.5 - pct) * 34}px)`;
  nav.classList.toggle('is-solid', scrollY > 60);
}
addEventListener('scroll', onScroll, { passive: true });
onScroll();

// ---------- Odometer count-up ----------
const fmt = new Intl.NumberFormat('en-US');
const counters = new IntersectionObserver((entries) => {
  entries.forEach(({ isIntersecting, target }) => {
    if (!isIntersecting) return;
    counters.unobserve(target);
    const end = Number(target.dataset.count);
    const suffix = target.dataset.suffix || '';
    const start = performance.now();
    const dur = 1600;
    const tick = (now) => {
      const t = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      target.textContent = fmt.format(Math.round(end * eased)) + suffix;
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}, { threshold: 0.4 });
document.querySelectorAll('[data-count]').forEach((el) => counters.observe(el));

// ---------- Terrain tabs ----------
const tabs = document.querySelectorAll('[data-tab]');
tabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    tabs.forEach((t) => t.setAttribute('aria-selected', t === tab));
    document.querySelectorAll('[data-panel]').forEach((p) => {
      p.hidden = p.dataset.panel !== tab.dataset.tab;
    });
  });
});

// ---------- Off-grid calculator ----------
// Rough daily draws in Wh. Ballpark figures for fun, not a spec sheet.
const BATTERY_WH = 10240;
const USABLE = 0.9;
const LOADS = { fridge: 500, basics: 200, work: 400, cook: 800, heat: 100 };
const AC_WH_PER_HOUR = 450;
const DRIVE_WH_PER_HOUR = 1500;

const acInput = document.getElementById('ac');
const driveInput = document.getElementById('drive');
const daysEl = document.getElementById('days');
const daysUnit = document.getElementById('daysUnit');
const verdict = document.getElementById('verdict');
const gaugeFill = document.getElementById('gaugeFill');
const arcLen = gaugeFill.getTotalLength();
gaugeFill.style.strokeDasharray = arcLen;

function verdictFor(days) {
  if (days === Infinity) return 'Basically forever. The alternators keep up with you. 🚐💨';
  if (days >= 10) return 'You will run out of snacks long before power. 🏕️';
  if (days >= 5) return 'A full week of "where are we again?" 🌄';
  if (days >= 3) return 'A long weekend, no hookups needed. 🔥';
  if (days >= 1.5) return 'Living large. Take a short drive to top up. ❄️☀️';
  return 'Full glamping mode. Plan on some driving or shore power. 😎';
}

function updateCalc() {
  let daily = 0;
  document.querySelectorAll('[data-load]').forEach((box) => {
    if (box.checked) daily += LOADS[box.dataset.load];
  });
  const acHours = Number(acInput.value);
  const driveMin = Number(driveInput.value);
  daily += acHours * AC_WH_PER_HOUR;
  const recharge = (driveMin / 60) * DRIVE_WH_PER_HOUR;
  const net = daily - recharge;

  document.getElementById('acOut').textContent = `${acHours} h`;
  document.getElementById('driveOut').textContent = driveMin >= 60
    ? `${(driveMin / 60).toFixed(driveMin % 60 ? 1 : 0)} h`
    : `${driveMin} min`;

  const days = net <= 0 ? Infinity : (BATTERY_WH * USABLE) / net;
  if (days === Infinity) {
    daysEl.textContent = '∞';
    daysUnit.textContent = 'days off-grid';
  } else {
    daysEl.textContent = days >= 10 ? Math.round(days) : days.toFixed(1);
    daysUnit.textContent = days < 2 && days.toFixed(1) === '1.0' ? 'day off-grid' : 'days off-grid';
  }
  verdict.textContent = verdictFor(days);

  // Gauge: 14+ days fills the arc
  const fill = days === Infinity ? 1 : Math.min(days / 14, 1);
  gaugeFill.style.strokeDashoffset = arcLen * (1 - fill);
  gaugeFill.style.stroke = fill > 0.35 ? 'var(--sun)' : 'var(--sunset)';
}
document.querySelectorAll('[data-load], #ac, #drive').forEach((el) => el.addEventListener('input', updateCalc));
updateCalc();

// ---------- Lightbox ----------
const shots = [...document.querySelectorAll('.shot')];
const lightbox = document.getElementById('lightbox');
const lbImg = document.getElementById('lightboxImg');
const lbCap = document.getElementById('lightboxCap');
let current = 0;

function show(i) {
  current = (i + shots.length) % shots.length;
  const shot = shots[current];
  lbImg.src = shot.dataset.full;
  lbImg.alt = shot.querySelector('img').alt;
  lbCap.textContent = shot.querySelector('span').textContent;
}
shots.forEach((shot, i) => shot.addEventListener('click', () => { show(i); lightbox.showModal(); }));
lightbox.querySelector('.lightbox__close').addEventListener('click', () => lightbox.close());
lightbox.querySelector('.lightbox__prev').addEventListener('click', () => show(current - 1));
lightbox.querySelector('.lightbox__next').addEventListener('click', () => show(current + 1));
lightbox.addEventListener('click', (e) => { if (e.target === lightbox) lightbox.close(); });
addEventListener('keydown', (e) => {
  if (!lightbox.open) return;
  if (e.key === 'ArrowLeft') show(current - 1);
  if (e.key === 'ArrowRight') show(current + 1);
});

// ---------- Reveal on scroll ----------
const revealTargets = document.querySelectorAll('.section__head, .terrain, .calc, .inside > *, .spec, .note__copy, .note__photo, .ticket');
const revealer = new IntersectionObserver((entries) => {
  entries.forEach(({ isIntersecting, target }) => {
    if (isIntersecting) { target.classList.add('is-in'); revealer.unobserve(target); }
  });
}, { threshold: 0.12 });
revealTargets.forEach((el) => { el.classList.add('reveal'); revealer.observe(el); });
