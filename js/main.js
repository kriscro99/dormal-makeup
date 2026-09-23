/* =========================================================
   DORMAL MAKEUP · Dorotea Malenić
   ========================================================= */

/* Kontakt podaci — dovoljno je upisati broj/e-mail i gumbi se sami pojave.
   whatsapp: međunarodni format bez + i razmaka, npr. '385911234567' */
const CONFIG = {
  instagram: 'dormal_makeup',
  whatsapp: '',
  phone: '',
  email: '',
};

window.DM_OK = true;

(() => {
  'use strict';

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const pad = (n) => String(n).padStart(2, '0');

  const root = document.documentElement;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const desktopMQ = window.matchMedia('(min-width: 1024px)');

  const igProfile = `https://www.instagram.com/${CONFIG.instagram}/`;
  const igDM = `https://ig.me/m/${CONFIG.instagram}`;

  /* ---------- Loader ---------- */
  const loader = $('#loader');
  const t0 = performance.now();
  let seen = false;
  try {
    seen = sessionStorage.getItem('dm-seen') === '1';
    sessionStorage.setItem('dm-seen', '1');
  } catch (e) { /* privatni način rada */ }

  if (seen && loader) loader.classList.add('is-quick');
  const minTime = reduced ? 0 : seen ? 650 : 1800;

  let launched = false;
  const launch = () => {
    if (launched) return;
    launched = true;
    const wait = Math.max(0, minTime - (performance.now() - t0));
    setTimeout(() => {
      if (loader) loader.classList.add('is-done');
      root.classList.remove('is-loading');
      setTimeout(() => root.classList.add('is-ready'), reduced ? 0 : 250);
      setTimeout(() => loader && loader.remove(), 1300);
    }, wait);
  };

  const heroImg = $('.hero__arch img');
  const imgReady = new Promise((res) => {
    if (!heroImg || heroImg.complete) return res();
    heroImg.addEventListener('load', res, { once: true });
    heroImg.addEventListener('error', res, { once: true });
  });
  const fontsReady = document.fonts ? document.fonts.ready : Promise.resolve();
  Promise.all([imgReady, fontsReady]).then(launch);
  setTimeout(launch, 3200);

  /* ---------- Header / menu ---------- */
  const header = $('#header');
  const burger = $('#burger');
  const menu = $('#menu');
  let menuOpen = false;
  let lastY = window.scrollY;

  const setMenu = (open) => {
    menuOpen = open;
    menu.classList.toggle('is-open', open);
    menu.setAttribute('aria-hidden', String(!open));
    menu.inert = !open;
    header.classList.toggle('menu-open', open);
    header.classList.remove('is-hidden');
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Zatvori izbornik' : 'Otvori izbornik');
    root.classList.toggle('lock', open);
  };
  burger.addEventListener('click', () => setMenu(!menuOpen));
  $$('a', menu).forEach((a) => a.addEventListener('click', () => setMenu(false)));
  desktopMQ.addEventListener?.('change', (e) => { if (e.matches && menuOpen) setMenu(false); });

  const updateHeader = (y) => {
    header.classList.toggle('is-scrolled', y > 20);
    if (menuOpen) return;
    const delta = y - lastY;
    if (Math.abs(delta) < 6) return;
    header.classList.toggle('is-hidden', delta > 0 && y > 480);
    lastY = y;
  };

  /* ---------- Reveal on scroll ---------- */
  const markDone = (el) => {
    const d = parseFloat(getComputedStyle(el).getPropertyValue('--d')) || 0;
    setTimeout(() => el.classList.add('done'), 1300 + d * 1000);
  };
  const reveal = (el) => { el.classList.add('is-in'); markDone(el); };

  const groups = $$('[data-reveal-group]');
  const grouped = new Set(groups.flatMap((g) => $$('[data-reveal]', g)));

  if ('IntersectionObserver' in window && !reduced) {
    // observed element → elements to reveal (mask elements are clipped to zero,
    // so their parent is observed instead)
    const targets = new Map();
    const watch = (target, el) => {
      if (!targets.has(target)) targets.set(target, []);
      targets.get(target).push(el);
    };
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        targets.get(entry.target).forEach(reveal);
        io.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    $$('[data-reveal]').forEach((el) => {
      if (grouped.has(el)) return;
      watch(el.dataset.reveal === 'mask' ? el.parentElement : el, el);
    });
    groups.forEach((g) => $$('[data-reveal]', g).forEach((el) => watch(g, el)));
    targets.forEach((_, t) => io.observe(t));
  } else {
    $$('[data-reveal]').forEach(reveal);
  }

  /* ---------- Quote: word-by-word ---------- */
  const quote = $('#quoteText');
  let words = [];
  if (quote) {
    const text = quote.textContent.trim();
    quote.textContent = '';
    text.split(/\s+/).forEach((w, i, arr) => {
      const span = document.createElement('span');
      span.className = 'w';
      span.textContent = w;
      quote.appendChild(span);
      if (i < arr.length - 1) quote.appendChild(document.createTextNode(' '));
    });
    words = $$('.w', quote);
    if (reduced) words.forEach((w) => w.classList.add('on'));
  }

  /* ---------- Scroll-driven effects ---------- */
  const progressBar = $('#progress');
  const parallaxEls = reduced ? [] : $$('[data-speed]');
  const steps = $('#steps');
  const stepItems = steps ? $$('.step', steps) : [];
  let ticking = false;

  const update = () => {
    ticking = false;
    const y = window.scrollY;
    const vh = window.innerHeight;

    updateHeader(y);

    const max = root.scrollHeight - vh;
    progressBar.style.transform = `scaleX(${max > 0 ? clamp(y / max, 0, 1) : 0})`;

    parallaxEls.forEach((el) => {
      const r = el.parentElement.getBoundingClientRect();
      if (r.bottom < -150 || r.top > vh + 150) return;
      const offset = (r.top + r.height / 2 - vh / 2) * -parseFloat(el.dataset.speed);
      el.style.transform = `translate3d(0, ${offset.toFixed(1)}px, 0) scale(${el.dataset.scale || 1})`;
    });

    if (words.length && !reduced) {
      const r = quote.getBoundingClientRect();
      const p = clamp((vh * 0.88 - r.top) / (r.height + vh * 0.38), 0, 1);
      const n = Math.round(p * words.length * 1.05);
      words.forEach((w, i) => w.classList.toggle('on', i < n));
    }

    if (steps) {
      const r = steps.getBoundingClientRect();
      const row = desktopMQ.matches;
      const p = row
        ? clamp((vh * 0.85 - r.top) / (vh * 0.5), 0, 1)
        : clamp((vh * 0.72 - r.top) / r.height, 0, 1);
      steps.style.setProperty('--p', p.toFixed(3));
      stepItems.forEach((li, i) => {
        const at = row ? i / stepItems.length : (li.getBoundingClientRect().top - r.top) / r.height;
        li.classList.toggle('is-active', p > at + 0.005 || p >= 0.999);
      });
    }
  };
  const onScroll = () => {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  update();

  /* ---------- Gallery: swipe progress + lightbox ---------- */
  const track = $('#galleryTrack');
  const thumb = $('#galleryThumb');
  if (track) {
    const syncThumb = () => {
      const sw = track.scrollWidth, cw = track.clientWidth;
      if (sw <= cw) return;
      thumb.style.width = `${(cw / sw) * 100}%`;
      thumb.style.transform = `translateX(${(track.scrollLeft / cw) * 100}%)`;
    };
    track.addEventListener('scroll', syncThumb, { passive: true });
    window.addEventListener('resize', syncThumb, { passive: true });
    syncThumb();
  }

  const shots = $$('.shot');
  const items = shots.map((s) => ({
    src: s.dataset.full,
    alt: $('img', s).alt,
    cap: s.dataset.caption,
  }));
  const lb = $('#lightbox');
  const lbImg = $('#lbImg');
  const lbCap = $('#lbCap');
  const lbCount = $('#lbCount');
  let lbIndex = 0;
  let lastFocus = null;

  const showShot = (i) => {
    lbIndex = (i + items.length) % items.length;
    const item = items[lbIndex];
    lbImg.classList.remove('is-in');
    setTimeout(() => {
      lbImg.src = item.src;
      lbImg.alt = item.alt;
      lbCap.textContent = item.cap;
      lbCount.textContent = `${pad(lbIndex + 1)} / ${pad(items.length)}`;
      const done = () => lbImg.classList.add('is-in');
      if (lbImg.decode) lbImg.decode().then(done, done); else lbImg.onload = done;
    }, lbImg.getAttribute('src') ? 200 : 0);
  };
  const openLightbox = (i) => {
    lastFocus = document.activeElement;
    lb.hidden = false;
    void lb.offsetWidth;
    lb.classList.add('is-open');
    root.classList.add('lock');
    showShot(i);
    $('[data-lb-close]', lb).focus({ preventScroll: true });
  };
  const closeLightbox = () => {
    lb.classList.remove('is-open');
    root.classList.remove('lock');
    setTimeout(() => { lb.hidden = true; lbImg.classList.remove('is-in'); }, 450);
    if (lastFocus) lastFocus.focus({ preventScroll: true });
  };
  shots.forEach((s, i) => $('.shot__btn', s).addEventListener('click', () => openLightbox(i)));
  $('[data-lb-close]', lb).addEventListener('click', closeLightbox);
  $('[data-lb-prev]', lb).addEventListener('click', () => showShot(lbIndex - 1));
  $('[data-lb-next]', lb).addEventListener('click', () => showShot(lbIndex + 1));
  lb.addEventListener('click', (e) => { if (e.target === lb) closeLightbox(); });

  let touchX = 0, touchY = 0;
  lb.addEventListener('touchstart', (e) => {
    touchX = e.changedTouches[0].clientX;
    touchY = e.changedTouches[0].clientY;
  }, { passive: true });
  lb.addEventListener('touchend', (e) => {
    const dx = e.changedTouches[0].clientX - touchX;
    const dy = e.changedTouches[0].clientY - touchY;
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) showShot(lbIndex + (dx < 0 ? 1 : -1));
    else if (dy > 90 && Math.abs(dy) > Math.abs(dx)) closeLightbox();
  }, { passive: true });

  /* ---------- Focus trap + ESC ---------- */
  const trap = (container, e) => {
    const f = $$('a[href], button:not([disabled]), input, select, textarea', container).filter((el) => el.offsetParent !== null);
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  };
  document.addEventListener('keydown', (e) => {
    const modalOpen = !modal.hidden;
    const lbOpen = !lb.hidden;
    if (e.key === 'Escape') {
      if (modalOpen) closeModal();
      else if (lbOpen) closeLightbox();
      else if (menuOpen) { setMenu(false); burger.focus(); }
    }
    if (lbOpen && !modalOpen) {
      if (e.key === 'ArrowRight') showShot(lbIndex + 1);
      if (e.key === 'ArrowLeft') showShot(lbIndex - 1);
    }
    if (e.key === 'Tab') {
      if (modalOpen) trap($('.modal__card', modal), e);
      else if (lbOpen) trap(lb, e);
    }
  });

  /* ---------- FAQ ---------- */
  $$('.faq__item').forEach((item) => {
    const btn = $('.faq__q', item);
    btn.addEventListener('click', () => {
      const open = !item.classList.contains('is-open');
      $$('.faq__item.is-open').forEach((o) => {
        if (o !== item) { o.classList.remove('is-open'); $('.faq__q', o).setAttribute('aria-expanded', 'false'); }
      });
      item.classList.toggle('is-open', open);
      btn.setAttribute('aria-expanded', String(open));
    });
  });

  /* ---------- Contact channels from CONFIG ---------- */
  const channels = $('#channels');
  const arrowSvg = '<svg class="channel__arrow" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h15M13 6l6 6-6 6"/></svg>';
  const addChannel = (href, label, value, iconPath, external) => {
    const li = document.createElement('li');
    li.innerHTML = `<a class="channel" href="${href}"${external ? ' target="_blank" rel="noopener"' : ''}>
      <span class="channel__icon"><svg viewBox="0 0 24 24" aria-hidden="true">${iconPath}</svg></span>
      <span class="channel__text"><small>${label}</small></span>${arrowSvg}</a>`;
    $('.channel__text', li).append(value);
    channels.appendChild(li);
  };
  if (CONFIG.whatsapp) {
    addChannel(`https://wa.me/${CONFIG.whatsapp}`, 'WhatsApp', `+${CONFIG.whatsapp}`,
      '<path d="M4.5 19.5l1.1-3.8A8 8 0 1 1 8.6 18.6z"/><path d="M9.2 8.6c.2 2.9 2.3 5 5.2 5.3l1-1.2-1.8-.9-.8.8c-1-.4-1.9-1.3-2.3-2.3l.8-.8-.9-1.8z"/>', true);
  }
  if (CONFIG.phone) {
    addChannel(`tel:${CONFIG.phone.replace(/\s+/g, '')}`, 'Telefon', CONFIG.phone,
      '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1z"/>', false);
  }
  if (CONFIG.email) {
    addChannel(`mailto:${CONFIG.email}`, 'E-mail', CONFIG.email,
      '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3.5 6.5L12 13l8.5-6.5"/>', false);
  }

  /* ---------- Inquiry form ---------- */
  const form = $('#inquiry');
  const modal = $('#modal');
  const modalText = $('#modalText');
  const modalMsg = $('#modalMsg');
  const modalActions = $('#modalActions');
  const toast = $('#toast');
  const dateInput = $('#f-date');

  if (dateInput) {
    const d = new Date();
    dateInput.min = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }
  if (CONFIG.whatsapp) {
    $('#formHint').textContent = 'Upit se otvara u WhatsAppu s već upisanom porukom — samo pritisneš pošalji.';
  }

  // klik na uslugu → automatski odabir u obrascu
  $$('[data-service]').forEach((link) => {
    link.addEventListener('click', () => {
      const radio = $$('input[name="usluga"]', form).find((r) => r.value === link.dataset.service);
      if (radio) radio.checked = true;
    });
  });

  let toastTimer;
  const showToast = (msg) => {
    toast.textContent = msg;
    toast.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 2600);
  };

  const copyText = (text) => {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text).then(() => true, () => legacyCopy(text));
    }
    return Promise.resolve(legacyCopy(text));
  };
  const legacyCopy = (text) => {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0;font-size:16px;';
    document.body.appendChild(ta);
    ta.select();
    ta.setSelectionRange(0, text.length);
    let ok = false;
    try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
    ta.remove();
    return ok;
  };

  const buildMessage = () => {
    const data = new FormData(form);
    const name = String(data.get('ime') || '').trim();
    const service = data.get('usluga');
    const date = data.get('datum');
    const people = data.get('osobe');
    const note = String(data.get('poruka') || '').trim();
    let dateHr = '';
    if (date) {
      const [y, m, d] = String(date).split('-').map(Number);
      dateHr = new Date(y, m - 1, d).toLocaleDateString('hr-HR', { day: 'numeric', month: 'long', year: 'numeric' });
    }
    const lines = ['Bok Dorotea! ✨', 'Zanima me termin za šminkanje:', ''];
    if (service) lines.push(`• Usluga: ${service}`);
    if (dateHr) lines.push(`• Datum: ${dateHr}`);
    if (people) lines.push(`• Broj osoba: ${people}`);
    if (note) lines.push(`• Poruka: ${note}`);
    lines.push('', `${name}`);
    return lines.join('\n');
  };

  const actionBtn = (label, cls, href) => {
    const el = document.createElement(href ? 'a' : 'button');
    el.className = `btn ${cls} btn--block`;
    if (href) { el.href = href; el.target = '_blank'; el.rel = 'noopener'; } else el.type = 'button';
    const s = document.createElement('span');
    s.textContent = label;
    el.appendChild(s);
    modalActions.appendChild(el);
    return el;
  };

  const openModal = (msg, copied) => {
    lastFocus = document.activeElement;
    modalMsg.textContent = msg;
    modalActions.innerHTML = '';
    const enc = encodeURIComponent(msg);

    if (CONFIG.whatsapp) {
      modalText.textContent = 'Pošalji upit jednim dodirom putem WhatsAppa ili ga zalijepi u Instagram poruku.';
      actionBtn('Pošalji na WhatsApp', 'btn--dark', `https://wa.me/${CONFIG.whatsapp}?text=${enc}`);
      actionBtn('Otvori Instagram', 'btn--ghost', igDM);
    } else {
      modalText.textContent = copied
        ? `Poruka je kopirana ✓ Otvori Instagram i samo je zalijepi u razgovor s @${CONFIG.instagram}.`
        : `Kopiraj poruku ispod i pošalji je u Instagram razgovoru s @${CONFIG.instagram}.`;
      actionBtn('Otvori Instagram', 'btn--dark', igDM);
    }
    if (CONFIG.email) {
      actionBtn('Pošalji e-mailom', 'btn--ghost',
        `mailto:${CONFIG.email}?subject=${encodeURIComponent('Upit za termin — Dormal Makeup')}&body=${enc}`);
    }
    const copyBtn = actionBtn('Kopiraj poruku', 'btn--ghost');
    copyBtn.addEventListener('click', () => {
      copyText(msg).then((ok) => showToast(ok ? 'Poruka je kopirana ✓' : 'Označi tekst i kopiraj ga ručno'));
    });

    modal.hidden = false;
    void modal.offsetWidth;
    modal.classList.add('is-open');
    root.classList.add('lock');
    $('.modal__close', modal).focus({ preventScroll: true });
  };
  const closeModal = () => {
    modal.classList.remove('is-open');
    root.classList.remove('lock');
    setTimeout(() => { modal.hidden = true; }, 500);
    if (lastFocus) lastFocus.focus({ preventScroll: true });
  };
  $$('[data-modal-close]', modal).forEach((el) => el.addEventListener('click', closeModal));

  const nameField = $('#f-name');
  nameField.addEventListener('input', () => {
    if (nameField.value.trim()) {
      nameField.closest('.field').classList.remove('has-error');
      nameField.removeAttribute('aria-invalid');
    }
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!nameField.value.trim()) {
      nameField.closest('.field').classList.add('has-error');
      nameField.setAttribute('aria-invalid', 'true');
      nameField.setAttribute('aria-describedby', 'f-name-error');
      nameField.focus();
      return;
    }
    const msg = buildMessage();
    copyText(msg).then((ok) => openModal(msg, ok));
  });

  /* ---------- Mobile dock ---------- */
  const dock = $('#dock');
  const hero = $('.hero');
  const contact = $('#kontakt');
  const footer = $('#footer');
  if (dock && 'IntersectionObserver' in window) {
    let heroVisible = true;
    const hiders = new Set();
    const sync = () => dock.classList.toggle('is-visible', !heroVisible && hiders.size === 0);
    new IntersectionObserver(([e]) => { heroVisible = e.isIntersecting; sync(); }, { rootMargin: '-35% 0px 0px 0px' }).observe(hero);
    const hideIO = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) hiders.add(e.target); else hiders.delete(e.target); });
      sync();
    });
    hideIO.observe(contact);
    hideIO.observe(footer);
  }

  /* ---------- To top + year ---------- */
  $('#toTop').addEventListener('click', () => window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' }));
  $('#year').textContent = new Date().getFullYear();

  /* ---------- Desktop: magnetic buttons + cursor ---------- */
  if (finePointer && !reduced) {
    $$('.magnetic').forEach((el) => {
      el.addEventListener('mousemove', (e) => {
        const r = el.getBoundingClientRect();
        const x = e.clientX - r.left - r.width / 2;
        const y = e.clientY - r.top - r.height / 2;
        el.style.transform = `translate(${x * 0.18}px, ${y * 0.3}px)`;
      });
      el.addEventListener('mouseleave', () => { el.style.transform = ''; });
    });

    const cursor = $('#cursor');
    const ring = $('.cursor__ring', cursor);
    root.classList.add('has-cursor');
    let mx = -100, my = -100, rx = -100, ry = -100;
    window.addEventListener('mousemove', (e) => {
      mx = e.clientX; my = e.clientY;
      cursor.classList.add('is-visible');
    }, { passive: true });
    document.addEventListener('mouseleave', () => cursor.classList.remove('is-visible'));
    window.addEventListener('mousedown', () => cursor.classList.add('is-down'));
    window.addEventListener('mouseup', () => cursor.classList.remove('is-down'));
    document.addEventListener('mouseover', (e) => {
      const view = e.target.closest('[data-cursor="view"]');
      const link = !view && e.target.closest('a, button, label, input, select, textarea');
      cursor.classList.toggle('is-view', !!view);
      cursor.classList.toggle('is-link', !!link);
    });
    const loop = () => {
      rx += (mx - rx) * 0.18;
      ry += (my - ry) * 0.18;
      ring.style.transform = `translate3d(${rx.toFixed(1)}px, ${ry.toFixed(1)}px, 0)`;
      requestAnimationFrame(loop);
    };
    loop();
  }

  // Instagram poveznice prema CONFIG-u
  $$('a[href^="https://www.instagram.com/"]').forEach((a) => { a.href = igProfile; });
  $$('a[href^="https://ig.me/m/"]').forEach((a) => { a.href = igDM; });
})();
