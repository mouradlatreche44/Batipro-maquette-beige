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
  // FormSubmit — l'activation a déjà été faite pour contact@batiproconnect.com
  const NOTIFICATION_EMAIL = 'contact@batiproconnect.com';

  // Traductions des choix radio/checkbox vers du français lisible
  const VALUE_LABELS = {
    // effectif
    '1': '1 personne (travaille seul)',
    '2-9': '2 à 9 personnes',
    '10+': 'Plus de 10 personnes',
    // clientele
    'particuliers': 'Particuliers',
    'professionnels': 'Professionnels',
    'les-deux': 'Particuliers et professionnels',
    // logo
    'oui': 'Oui',
    'creer': 'Non — à créer',
    'texte': 'Non — juste écrire le nom',
    // photos
    'exemples': 'Non — visuels d\'exemple',
    // atouts
    'decennale': 'Garantie décennale',
    'rge': 'Label RGE / Qualibat',
    'devis-gratuit': 'Devis gratuit',
    'rapide': 'Intervention rapide',
    'familiale': 'Entreprise familiale',
    'avis': 'Avis clients positifs',
  };

  function prettify(val) {
    if (val == null || val === '') return '—';
    if (Array.isArray(val)) return val.map(v => VALUE_LABELS[v] || v).join(', ');
    return VALUE_LABELS[val] || val;
  }

  async function submitForm(payload) {
    const p = { ...payload };

    // Aplatit UTM
    let utmStr = '—';
    if (p.utm && typeof p.utm === 'object') {
      const utmEntries = Object.entries(p.utm).filter(([_, v]) => v && v !== 'undefined');
      if (utmEntries.length) utmStr = utmEntries.map(([k, v]) => `${k}=${v}`).join(' · ');
      delete p.utm;
    }

    // Construit le payload français, ordonné, avec libellés lisibles
    const body = {
      _subject: `🟠 Nouvelle demande de maquette — ${p.company || p.email || 'Sans nom'}`,
      _template: 'table',
      _captcha: 'false',
      _autoresponse: `Bonjour,\n\nNous avons bien reçu votre demande de maquette pour ${p.company || 'votre entreprise'}. Nous revenons vers vous sous 7 jours avec une proposition personnalisée.\n\nÀ très vite,\nL'équipe Batiproconnect\ncontact@batiproconnect.com`,

      // Champ technique requis par FormSubmit pour l'auto-réponse / reply-to
      email: p.email || '',

      '🏢 Entreprise':            prettify(p.company),
      '👥 Effectif':               prettify(p.effectif),
      '🔧 Métier principal':       prettify(p.job),
      '📅 Années d\'activité':     prettify(p.years),

      '📧 Email':                  prettify(p.email),
      '📞 Téléphone':              prettify(p.phone),
      '📍 Zone d\'intervention':   prettify(p.zone),
      '🎯 Type de clientèle':      prettify(p.clientele),

      '⭐ 3 prestations principales': prettify(p.services),
      '🏷️ Marques partenaires':       prettify(p.brands),
      '🏆 Atouts & certifications':   prettify(p.atouts),

      '🎨 Logo':                   prettify(p.logo),
      '📷 Photos de chantiers':    prettify(p.photos),
      '🖌️ Couleurs préférées':     prettify(p.colors),
      '✨ Élément différenciant':   prettify(p.plus),

      '🔗 Page d\'origine':        p.page || '—',
      '📊 UTM':                    utmStr,
      '🕐 Envoyé le':              p.sentAt ? new Date(p.sentAt).toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' }) : '—',
    };

    const res = await fetch('https://formsubmit.co/ajax/' + encodeURIComponent(NOTIFICATION_EMAIL), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({}));
    console.log('[FormSubmit] response:', res.status, json);
    if (!res.ok || json.success === 'false' || json.success === false) {
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

  // ---------- Callback rapide (bloc "Pas le temps ?") ----------
  const callbackForm = qs('#callbackForm');
  const callbackPhone = qs('#callbackPhone');
  const callbackSuccess = qs('#callbackSuccess');
  if (callbackForm) {
    callbackForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const val = (callbackPhone.value || '').trim();
      // Validation simple : au moins 10 chiffres
      const digits = val.replace(/\D/g, '');
      if (digits.length < 10) {
        callbackPhone.classList.add('error');
        callbackPhone.focus();
        return;
      }
      callbackPhone.classList.remove('error');
      const submitBtn = callbackForm.querySelector('button[type=submit]');
      submitBtn.disabled = true;
      const originalText = submitBtn.innerHTML;
      submitBtn.innerHTML = 'Envoi...';

      try {
        const utms = getUtms();
        const utmStr = Object.entries(utms).filter(([_, v]) => v && v !== 'undefined').map(([k, v]) => `${k}=${v}`).join(' · ') || '—';
        const body = {
          _subject: '📞 Demande de rappel rapide — ' + val,
          _template: 'table',
          _captcha: 'false',
          email: '',
          '📞 Téléphone à rappeler': val,
          '🔗 Page d\'origine': window.location.href,
          '📊 UTM': utmStr,
          '🕐 Envoyé le': new Date().toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' }),
          '🏷️ Type': 'Callback rapide (formulaire abrégé)',
        };
        const res = await fetch('https://formsubmit.co/ajax/' + encodeURIComponent(NOTIFICATION_EMAIL), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify(body),
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok || json.success === 'false' || json.success === false) {
          throw new Error(json.message || ('HTTP ' + res.status));
        }
        // Succès : masque le formulaire, affiche le message
        callbackForm.style.display = 'none';
        callbackSuccess.hidden = false;
        if (window.dataLayer) window.dataLayer.push({ event: 'callback_request_sent' });
      } catch (err) {
        console.error('[Callback] error:', err);
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
        alert('Une erreur est survenue. Réessayez ou contactez-nous au 07 56 83 63 51.');
      }
    });
  }

  // ---------- Cookie banner ----------
  const cookieBanner = qs('#cookieBanner');
  const cookieAccept = qs('#cookieAccept');
  const cookieRefuse = qs('#cookieRefuse');
  if (cookieBanner) {
    let stored = null;
    try { stored = localStorage.getItem('bpc_cookie_consent'); } catch(_) {}
    if (!stored) cookieBanner.hidden = false;
    function setConsent(value) {
      try { localStorage.setItem('bpc_cookie_consent', value); } catch(_) {}
      cookieBanner.hidden = true;
      if (window.dataLayer) window.dataLayer.push({ event: 'cookie_consent', value: value });
    }
    if (cookieAccept) cookieAccept.addEventListener('click', () => setConsent('accepted'));
    if (cookieRefuse) cookieRefuse.addEventListener('click', () => setConsent('refused'));
  }
})();
