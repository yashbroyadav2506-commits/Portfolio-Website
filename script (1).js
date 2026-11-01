'use strict';

document.documentElement.classList.add('js'); // lets CSS hide items only when scripts run
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// 1. Theme toggle (remembers choice, defaults to the system setting)
const root = document.documentElement;
const themeBtn = document.getElementById('theme');
const saved = localStorage.getItem('theme');
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
setTheme(saved || (prefersDark ? 'dark' : 'light'));

function setTheme(mode) {
  root.dataset.theme = mode;
  themeBtn.setAttribute('aria-label', `Switch to ${mode === 'dark' ? 'light' : 'dark'} theme`);
}
themeBtn.addEventListener('click', () => {
  const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
  setTheme(next);
  localStorage.setItem('theme', next);
  if (!reduceMotion) themeBtn.animate([{ transform: 'rotate(0)' }, { transform: 'rotate(180deg)' }], { duration: 400, easing: 'ease-out' });
});

// 2. Hero grid: cells light up under the pointer, then fade
const grid = document.getElementById('grid');
function buildGrid() {
  const { width, height } = grid.getBoundingClientRect();
  const count = Math.ceil(width / 42) * Math.ceil(height / 42);
  grid.replaceChildren(...Array.from({ length: count }, () => document.createElement('i')));
}
buildGrid();
window.addEventListener('resize', buildGrid);

if (!reduceMotion) {
  grid.parentElement.addEventListener('pointermove', (e) => {
    const cell = document.elementFromPoint(e.clientX, e.clientY);
    if (cell && cell.parentElement === grid) {
      cell.classList.add('on');
      setTimeout(() => cell.classList.remove('on'), 80);
    }
  });
}

// 3. Project rows expand and collapse
document.querySelectorAll('.project-head').forEach((btn) => {
  btn.addEventListener('click', () => {
    const open = btn.getAttribute('aria-expanded') === 'true';
    btn.setAttribute('aria-expanded', String(!open));
    btn.closest('.project').classList.toggle('open', !open);
  });
});

// 4. Project filters, with a live result count and a small pop on the matches
const chips = document.querySelectorAll('.chip');
const projects = document.querySelectorAll('.project');
const count = document.getElementById('count');
chips.forEach((chip) => {
  chip.addEventListener('click', () => {
    chips.forEach((c) => c.classList.toggle('active', c === chip));
    const filter = chip.dataset.filter;
    let shown = 0;
    projects.forEach((p) => {
      p.hidden = filter !== 'all' && p.dataset.cat !== filter;
      p.classList.remove('pop');
      if (!p.hidden) {
        p.style.setProperty('--i', shown++);
        void p.offsetWidth; // restart the animation
        p.classList.add('pop');
      }
    });
    count.textContent = filter === 'all'
      ? `Showing all ${shown} projects`
      : `Showing ${shown} of ${projects.length} projects`;
  });
});

// 5. Contact form: validates, then opens the visitor's email app
const form = document.getElementById('contact-form');
const note = document.getElementById('form-note');
const MY_EMAIL = 'you@example.com'; // TODO: put your real email here

form.addEventListener('submit', (e) => {
  e.preventDefault();
  let valid = true;
  form.querySelectorAll('input, textarea').forEach((field) => {
    const ok = field.checkValidity() && field.value.trim() !== '';
    field.setAttribute('aria-invalid', String(!ok));
    if (!ok) valid = false;
  });
  if (!valid) {
    note.className = 'note';
    note.textContent = 'Fill in your name, a valid email and a message.';
    form.classList.remove('shake');
    void form.offsetWidth;
    if (!reduceMotion) form.classList.add('shake');
    form.querySelector('[aria-invalid="true"]').focus();
    return;
  }
  const data = new FormData(form);
  const subject = encodeURIComponent(`Portfolio message from ${data.get('name')}`);
  const body = encodeURIComponent(`${data.get('message')}\n\n${data.get('name')} (${data.get('email')})`);
  window.location.href = `mailto:${MY_EMAIL}?subject=${subject}&body=${body}`;
  note.className = 'note ok';
  note.textContent = 'Ready to send. Your email app is opening.';
});

// 6. Scroll feedback: progress bar, active nav link, back-to-top button
const progress = document.getElementById('progress');
const toTop = document.getElementById('to-top');
let ticking = false;
window.addEventListener('scroll', () => {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.transform = `scaleX(${max > 0 ? window.scrollY / max : 0})`;
    toTop.classList.toggle('show', window.scrollY > 600);
    ticking = false;
  });
}, { passive: true });
toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' }));

const navLinks = document.querySelectorAll('.nav nav a');
const spy = new IntersectionObserver((entries) => {
  entries.forEach((en) => {
    if (en.isIntersecting) {
      navLinks.forEach((l) => l.classList.toggle('active', l.getAttribute('href') === `#${en.target.id}`));
    }
  });
}, { rootMargin: '-40% 0px -55% 0px' });
document.querySelectorAll('main .section').forEach((sec) => spy.observe(sec));

// 7. Reveal content once as it scrolls into view
const revealer = new IntersectionObserver((entries) => {
  entries.forEach((en) => {
    if (en.isIntersecting) { en.target.classList.add('in'); revealer.unobserve(en.target); }
  });
}, { threshold: 0.15 });
document.querySelectorAll('.section').forEach((sec) => {
  sec.querySelectorAll('h2, .about-copy, .project, .skills > div, .edu, .form, .links').forEach((el, i) => {
    el.classList.add('reveal');
    el.style.setProperty('--i', Math.min(i, 5));
    revealer.observe(el);
  });
});

// 8. Footer year
document.getElementById('year').textContent = new Date().getFullYear();
