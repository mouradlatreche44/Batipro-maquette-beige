/* =========================================================
   Batiproconnect — Landing JS v2
   - Sticky navbar scroll state
   - Mobile menu
   - Intersection Observer reveal
   - FAQ : auto-close des autres
   - Multi-step form (slides, validation, progress)
   - UTM tracking sur CTAs et soumission
   ========================================================= */

(function () {
  'use strict';

  // ---------- Helpers ----------
  const qs  = (s, ctx) => (ctx || document).querySelector(s);
  const qsa = (s, ctx) => Array.from((ctx || document).querySelectorAll(s));

  // ---------- Navbar scroll state ----------
  const navbar = qs('#navbar');
  const onScroll = () => {
    if (!navbar) return;
    navbar.classList.toggle('scrolled', window.scrollY > 8);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // ---------- Mobile menu ----------
  const navToggle = qs('#navToggle');
  const navLinks  = qs('#navLinks');
  if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => {
      const open = navLinks.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    navLinks.addEventListener('click', (e) => {
      if (e.target.tagName === 'A') {
        navLinks.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // ---------- Smooth-scroll pour ancres avec UTM (#formulaire?utm_…) ----------
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href*="#"]');
    if (!a) return;
    const href = a.getAttribute('href') || '';
    const hashIdx = href.indexOf('#');
    if (hashIdx === -1) return;
    const rest = href.slice(hashIdx + 1);
    const id = rest.split('?')[0];
    if (!id) return;
    const target = document.getElementById(id);
    if (!target) return;
    e.preventDefault();
    const top = target.getBoundingClientRect().top + window.scrollY - 80;
    window.scrollTo({ top, behavior: 'smooth' });
    history.replaceState(null, '', '#' + id);
  });

  // ---------- Reveal au scroll ----------
  const reveals = qsa('[data-reveal]');
  if ('IntersectionObserver' in window && reveals.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const delay = parseInt(el.dataset.delay || '0', 10);
          setTimeout(() => el.classList.add('in'), delay);
          io.unobserve(el);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add('in'));
  }

  // ---------- FAQ accordion : une seule ouverte à la fois ----------
  const faqItems = qsa('.faq-item');
  faqItems.forEach((item) => {
    item.addEventListener('toggle', () => {
      if (item.open) {
        faqItems.forEach((other) => { if (other !== item) other.open = false; });
      }
    });
  });

  // ---------- Multi-step form ----------
  const form = qs('#batiproForm');
  if (!form) return;

  const track       = qs('#slidesTrack');
  const viewport    = qs('#slidesViewport');
  const slides      = qsa('.form-slide', form);
  const totalSlides = slides.length;
  const stepCurEl   = qs('#stepCurrent');
  const stepTotEl   = qs('#stepTotal');
  const pctEl       = qs('#progressPct');
  const fillEl      = qs('#progressFill');
  const successEl   = qs('#formSuccess');

  if (stepTotEl) stepTotEl.textContent = String(totalSlides);

  let current = 0; // index 0..3

  function updateProgress() {
    const pct = Math.round(((current + 1) / totalSlides) * 100);
    if (stepCurEl) stepCurEl.textContent = String(current + 1);
    if (pctEl)     pctEl.textContent     = String(pct);
    if (fillEl)    fillEl.style.width    = pct + '%';
  }

  function adjustHeight() {
    if (!viewport || !slides[current]) return;
    viewport.style.height = slides[current].offsetHeight + 'px';
  }

  function goTo(idx) {
    current = Math.max(0, Math.min(totalSlides - 1, idx));
    if (track) track.style.transform = 'translateX(-' + (current * 25) + '%)';
    adjustHeight();
    updateProgress();
    // Focus le 1er champ de la slide pour accessibilité clavier
    const slide = slides[current];
    if (slide) {
      const firstInput = slide.querySelector('input, textarea, select');
      if (firstInput && document.activeElement !== firstInput) {
        // léger délai pour laisser la transition se faire avant focus visuel
        setTimeout(() => { try { firstInput.focus({ preventScroll: true }); } catch(_) {} }, 240);
      }
    }
    // Scroll au form si on navigue entre slides
    const wrapper = qs('.form-wrapper');
    if (wrapper) {
      const top = wrapper.getBoundingClientRect().top + window.scrollY - 80;
      if (Math.abs(window.scrollY - top) > 200) {
        window.scrollTo({ top, behavior: 'smooth' });
      }
    }
  }

  // Validation slide courante
  function validateSlide(idx) {
    const slide = slides[idx];
    if (!slide) return true;
    let ok = true;
    let firstInvalid = null;

    // inputs/textarea required
    const required = qsa('input[required], textarea[required]', slide);
    required.forEach((field) => {
      const errEl = slide.querySelector('[data-error-for="' + field.name + '"]');
      const val = (field.value || '').trim();
      let valid = val.length > 0;

      if (valid && field.type === 'email') {
        valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
      }
      if (valid && field.type === 'tel') {
        const digits = val.replace(/\D/g, '');
        valid = digits.length >= 8;
      }

      if (!valid) {
        ok = false;
        field.classList.add('invalid');
        if (errEl) {
          if (!val) errEl.textContent = 'Ce champ est requis.';
          else if (field.type === 'email') errEl.textContent = 'Email invalide.';
          else if (field.type === 'tel') errEl.textContent = 'Numéro invalide.';
          else errEl.textContent = 'Champ invalide.';
        }
        if (!firstInvalid) firstInvalid = field;
      } else {
        field.classList.remove('invalid');
        if (errEl) errEl.textContent = '';
      }
    });

    // radio groups required (data-required)
    qsa('.radio-group[data-required]', slide).forEach((group) => {
      const name = group.dataset.required;
      const checked = slide.querySelector('input[name="' + name + '"]:checked');
      const errEl = slide.querySelector('[data-error-for="' + name + '"]');
      if (!checked) {
        ok = false;
        if (errEl) errEl.textContent = 'Veuillez choisir une option.';
        if (!firstInvalid) firstInvalid = group.querySelector('input');
      } else if (errEl) {
        errEl.textContent = '';
      }
    });

    if (firstInvalid) {
      try { firstInvalid.focus({ preventScroll: false }); } catch(_) {}
    }
    return ok;
  }

  // Boutons next/prev
  form.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const action = btn.dataset.action;
    if (action === 'next') {
      if (validateSlide(current)) goTo(current + 1);
    } else if (action === 'prev') {
      goTo(current - 1);
    }
  });

  // Effacer l'erreur dès saisie
  form.addEventListener('input', (e) => {
    const t = e.target;
    if (t.classList && t.classList.contains('invalid')) {
      t.classList.remove('invalid');
      const slide = t.closest('.form-slide');
      const errEl = slide && slide.querySelector('[data-error-for="' + t.name + '"]');
      if (errEl) errEl.textContent = '';
    }
  });
  form.addEventListener('change', (e) => {
    const t = e.target;
    if (t.type === 'radio' || t.type === 'checkbox') {
      const slide = t.closest('.form-slide');
      const errEl = slide && slide.querySelector('[data-error-for="' + t.name + '"]');
      if (errEl) errEl.textContent = '';
    }
  });

  // ---------- UTM extraction ----------
  function getUtms() {
    const params = new URLSearchParams(window.location.search);
    const utm = {};
    ['utm_source','utm_medium','utm_campaign','utm_content','utm_term'].forEach((k) => {
      const v = params.get(k);
      if (v) utm[k] = v;
    });
    return utm;
  }

  // ---------- Submission ----------
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!validateSlide(current)) return;

    // Toutes les slides précédentes doivent aussi passer
    for (let i = 0; i < totalSlides; i++) {
      if (!validateSlide(i)) { goTo(i); return; }
    }

    // Construire le payload
    const fd = new FormData(form);
    const payload = {};
    fd.forEach((value, key) => {
      if (payload[key] !== undefined) {
        if (Array.isArray(payload[key])) payload[key].push(value);
        else payload[key] = [payload[key], value];
      } else {
        payload[key] = value;
      }
    });
    payload.utm    = getUtms();
    payload.page   = window.location.href;
    payload.sentAt = new Date().toISOString();

    submitForm(payload).then(() => {
      // succès UI
      const wrapper = qs('.form-wrapper');
      const formEl  = qs('#batiproForm');
      const progress = qs('.form-progress');
      if (formEl)   formEl.style.display    = 'none';
      if (progress) progress.style.display  = 'none';
      if (successEl) successEl.hidden = false;

      if (wrapper) {
        const top = wrapper.getBoundingClientRect().top + window.scrollY - 80;
        window.scrollTo({ top, behavior: 'smooth' });
      }

      // Push éventuel dataLayer
      if (window.dataLayer) {
        window.dataLayer.push({ event: 'maquette_request_sent' });
      }
    }).catch((err) => {
      console.error(err);
      alert("Une erreur est survenue. Réessayez ou écrivez à contact@batiproconnect.com");
    });
  });

  // ---------- ⬇⬇⬇ submitForm : à BRANCHER avec votre webhook ⬇⬇⬇ ----------
  // Remplacez l'URL ENDPOINT_URL par votre webhook (Brevo / Make / Zapier / endpoint perso).
  // Le payload contient tous les champs + UTM + URL + timestamp.
  // Renvoie une Promise — résolue = succès, rejetée = erreur (alerte affichée).
  // Web3Forms — clé liée à contact@batiproconnect.com
  const WEB3FORMS_ACCESS_KEY = 'bc4ee9d2-50c0-4d9e-8290-4a48c725bef9';

  async function submitForm(payload) {
    const flat = { ...payload };
    if (Array.isArray(flat.atouts)) flat.atouts = flat.atouts.join(', ');
    if (flat.utm && typeof flat.utm === 'object') {
      Object.entries(flat.utm).forEach(([k, v]) => { flat['utm_' + k] = v; });
      delete flat.utm;
    }

    const body = {
      access_key: WEB3FORMS_ACCESS_KEY,
      subject: `Nouvelle demande de maquette — ${flat.company || flat.email || 'Sans nom'}`,
      from_name: 'Landing Batiproconnect',
      ...flat,
    };

    const res = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({}));
    console.log('[Web3Forms] response:', res.status, json);
    if (!res.ok || json.success === false) {
      throw new Error(json.message || ('HTTP ' + res.status));
    }
    return json;
  }
  // ---------- ⬆⬆⬆ /submitForm ⬆⬆⬆ ----------

  // Init
  updateProgress();
  adjustHeight();
  window.addEventListener('load', adjustHeight);
  window.addEventListener('resize', adjustHeight);
})();
