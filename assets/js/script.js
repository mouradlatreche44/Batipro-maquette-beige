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

  // ---------- Multi-step form V2 ----------
  const form = qs('#batiproForm');
  if (!form) return;

  // ===== Configuration =====
  const NOTIFICATION_EMAIL = 'contact@batiproconnect.com';

  // ===== Données métier =====
  const TRADES = {
    plombier:    { label: 'Plombier', icon: '🔧',
      services: ['Dépannage urgence', 'Salle de bain clé en main', 'Pompe à chaleur', 'Chauffe-eau', 'Recherche de fuite', 'Débouchage canalisation', 'Chaudière gaz/fioul', 'Adoucisseur d\'eau'] },
    electricien: { label: 'Électricien', icon: '⚡',
      services: ['Mise aux normes', 'Tableau électrique', 'Domotique', 'Borne IRVE', 'Éclairage LED', 'Dépannage urgence', 'Visiophone & alarme', 'Chauffage électrique'] },
    couvreur:    { label: 'Couvreur', icon: '🏠',
      services: ['Réfection de toiture', 'Démoussage toiture', 'Hydrofuge', 'Zinguerie', 'Velux / fenêtre de toit', 'Isolation toiture', 'Charpente', 'Recherche de fuite'] },
    macon:       { label: 'Maçon', icon: '🧱',
      services: ['Extension de maison', 'Rénovation complète', 'Terrasse béton', 'Mur de clôture', 'Dalle & chape', 'Carrelage', 'Façade & ravalement', 'Démolition'] },
    menuisier:   { label: 'Menuisier', icon: '🪚',
      services: ['Fenêtres PVC/Alu/Bois', 'Portes intérieures', 'Portes blindées', 'Volets & fermetures', 'Parquet', 'Escalier sur mesure', 'Cuisine sur mesure', 'Dressing & placard'] },
    peintre:     { label: 'Peintre', icon: '🎨',
      services: ['Peinture intérieure', 'Peinture extérieure', 'Ravalement façade', 'Pose papier peint', 'Enduits décoratifs', 'Crépi', 'Pose de sol', 'Décoration'] },
    paysagiste:  { label: 'Paysagiste', icon: '🌿',
      services: ['Création de jardin', 'Élagage', 'Tonte & entretien', 'Engazonnement', 'Terrasse bois', 'Clôture', 'Arrosage automatique', 'Bassin & piscine'] },
    energie:     { label: 'Rénovation énergétique', icon: '☀️',
      services: ['Panneaux solaires', 'Pompe à chaleur', 'Poêle à granulés', 'ITE isolation extérieure', 'Isolation combles', 'VMC double flux', 'Borne IRVE', 'Aide MaPrimeRénov\''] },
    multi:       { label: 'Multiservice', icon: '🛠️',
      services: ['Petits travaux', 'Bricolage', 'Réparations diverses', 'Montage de meuble', 'Pose étagères', 'Petite plomberie', 'Petite électricité', 'Jardinage'] },
    autre:       { label: 'Autre métier', icon: '➕', services: [] }
  };

  const IMAGE_LABELS = {
    serieux: 'Sérieux & fiable', familial: 'Familial & accessible', rapide: 'Réactif, intervention rapide',
    premium: 'Haut de gamme', ancienne: 'Artisan à l\'ancienne', expert: 'Expert technique',
    local: 'Local, du coin', engage: 'Engagé / rénovation énergétique'
  };

  const DIFF_LABELS = {
    '20ans': '20+ ans d\'expérience', 'devis-gratuit': 'Devis gratuit', 'urgence-24': 'Intervention 24h/24',
    '2h': 'Sous 2h en urgence', 'devis-24h': 'Devis sous 24h', 'familial': 'Entreprise familiale',
    'pas-soustraitance': 'Pas de sous-traitance', 'maprimerenov': 'Aide MaPrimeRénov\'',
    'weekend': 'Disponible week-end', 'acompte-mini': 'Acompte minimum'
  };

  const PALETTE_LABELS = {
    'bleu-pro': 'Bleu pro (sérieux, technique)',
    'vert-nature': 'Vert nature (écolo, paysage)',
    'orange-chaleureux': 'Orange chaleureux (familial)',
    'noir-premium': 'Noir premium (haut de gamme)'
  };

  // ===== State =====
  const state = {
    selectedTrades: [],
    selectedServices: new Set(),     // values like "plombier|Dépannage urgence" or "custom|My service"
    customServices: [],
    selectedImage: new Set(),
    selectedDiff: new Set(),
    customDiff: [],
    palette: '',
    logoFile: null
  };

  // ===== DOM refs =====
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

  let current = 0;

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
    if (track) track.style.transform = 'translateX(-' + (current * (100 / totalSlides)) + '%)';
    adjustHeight();
    updateProgress();
    const slide = slides[current];
    if (slide) {
      const firstInput = slide.querySelector('input:not([type=hidden]):not([type=file]), textarea, select');
      if (firstInput && document.activeElement !== firstInput) {
        setTimeout(() => { try { firstInput.focus({ preventScroll: true }); } catch(_) {} }, 240);
      }
    }
    const wrapper = qs('.form-wrapper');
    if (wrapper) {
      const top = wrapper.getBoundingClientRect().top + window.scrollY - 80;
      if (Math.abs(window.scrollY - top) > 200) {
        window.scrollTo({ top, behavior: 'smooth' });
      }
    }
  }

  // ===== Validation =====
  function validateSlide(idx) {
    const slide = slides[idx];
    if (!slide) return true;
    let ok = true;
    let firstInvalid = null;

    // Étape 1 : au moins 1 métier
    if (idx === 0) {
      if (state.selectedTrades.length === 0) {
        ok = false;
        const errEl = slide.querySelector('[data-error-for="trades"]');
        if (errEl) errEl.textContent = 'Choisissez au moins un métier.';
      }
      // Si "autre" coché, le champ texte doit être rempli
      if (state.selectedTrades.includes('autre')) {
        const otherInput = qs('#tradeOther');
        if (otherInput && !otherInput.value.trim()) {
          ok = false;
          otherInput.classList.add('invalid');
          if (!firstInvalid) firstInvalid = otherInput;
        }
      }
    }

    // Étape 4 : au moins 1 prestation cochée OU custom
    if (idx === 3) {
      if (state.selectedServices.size === 0 && state.customServices.length === 0) {
        ok = false;
        alert('Cochez au moins une prestation ou ajoutez-en une.');
      }
    }


    // Inputs/textarea required
    qsa('input[required]:not([type=file]), textarea[required]', slide).forEach((field) => {
      const errEl = slide.querySelector('[data-error-for="' + field.name + '"]');
      const val = (field.value || '').trim();
      let valid = val.length > 0;
      if (valid && field.type === 'email') valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
      if (valid && field.type === 'tel')   valid = val.replace(/\D/g, '').length >= 8;

      if (!valid) {
        ok = false;
        field.classList.add('invalid');
        if (errEl) {
          if (!val) errEl.textContent = 'Ce champ est requis.';
          else if (field.type === 'email') errEl.textContent = 'Email invalide.';
          else if (field.type === 'tel')   errEl.textContent = 'Numéro invalide.';
          else errEl.textContent = 'Champ invalide.';
        }
        if (!firstInvalid) firstInvalid = field;
      } else {
        field.classList.remove('invalid');
        if (errEl) errEl.textContent = '';
      }
    });

    // Big-card-grid required (radio in big card)
    qsa('.big-card-grid[data-required]', slide).forEach((group) => {
      const name = group.dataset.required;
      const checked = slide.querySelector('input[name="' + name + '"]:checked');
      const errEl = slide.querySelector('[data-error-for="' + name + '"]');
      if (!checked) {
        ok = false;
        if (errEl) errEl.textContent = 'Veuillez choisir une option.';
      } else if (errEl) {
        errEl.textContent = '';
      }
    });

    if (firstInvalid) { try { firstInvalid.focus({ preventScroll: false }); } catch(_) {} }
    return ok;
  }

  // ===== Étape 1 : multi-select métier =====
  qsa('.big-card[data-trade]', form).forEach((card) => {
    card.addEventListener('change', () => {
      const value = card.dataset.trade;
      const checked = card.querySelector('input').checked;
      if (checked) {
        if (!state.selectedTrades.includes(value)) state.selectedTrades.push(value);
      } else {
        state.selectedTrades = state.selectedTrades.filter(t => t !== value);
      }

      // Multiservice banner
      const banner = qs('#multiTradeBanner');
      if (banner) banner.hidden = state.selectedTrades.filter(t => t !== 'autre').length < 2;

      // Autre metier block
      const otherBlock = qs('#otherTradeBlock');
      if (otherBlock) otherBlock.hidden = !state.selectedTrades.includes('autre');

      // Clear error
      const errEl = qs('[data-error-for="trades"]');
      if (errEl) errEl.textContent = '';

      renderServicesStep();
      adjustHeight();
    });
  });

  // ===== Étape 4 : rendu dynamique des prestations =====
  function renderServicesStep() {
    const container = qs('#servicesContainer');
    if (!container) return;
    container.innerHTML = '';

    const tradesToRender = state.selectedTrades.filter(t => t !== 'autre');
    const hasAutre = state.selectedTrades.includes('autre');

    if (tradesToRender.length === 0 && !hasAutre) {
      container.innerHTML = '<p style="color:var(--c-text-soft);font-size:14px;font-style:italic;">Choisissez d\'abord votre métier à l\'étape 1.</p>';
      return;
    }

    tradesToRender.forEach((tradeKey) => {
      const trade = TRADES[tradeKey];
      if (!trade) return;
      const block = document.createElement('div');
      block.className = 'services-trade-block';
      const showHeader = tradesToRender.length > 1;
      block.innerHTML = (showHeader ? `<h4>${trade.icon} ${trade.label}</h4>` : '') +
        `<div class="chip-grid chip-grid--soft">` +
        trade.services.map(s => {
          const id = `svc-${tradeKey}-${s.replace(/\s+/g, '-')}`;
          const val = `${tradeKey}|${s}`;
          const checked = state.selectedServices.has(val) ? 'checked' : '';
          return `<label class="chip-check"><input type="checkbox" id="${id}" data-service="${val}" ${checked}/><span>${s}</span></label>`;
        }).join('') +
        `</div>`;
      container.appendChild(block);
    });

    if (hasAutre) {
      const block = document.createElement('div');
      block.className = 'services-trade-block';
      block.innerHTML = `<h4>➕ Autre métier</h4>
        <p style="font-size:13.5px;color:var(--c-text-soft);">Saisissez vos prestations dans le champ "Ajouter une prestation" ci-dessous.</p>`;
      container.appendChild(block);
    }

    // Bind service checkboxes
    qsa('input[data-service]', container).forEach((cb) => {
      cb.addEventListener('change', () => {
        const val = cb.dataset.service;
        if (cb.checked) state.selectedServices.add(val);
        else state.selectedServices.delete(val);
        renderSpecialty();
        adjustHeight();
      });
    });

    renderSpecialty();
  }

  function renderSpecialty() {
    const wrap = qs('#specialtyField');
    const group = qs('#specialtyGroup');
    if (!wrap || !group) return;
    const all = [...state.selectedServices].map(v => v.split('|')[1]).concat(state.customServices);
    if (all.length === 0) { wrap.hidden = true; adjustHeight(); return; }
    wrap.hidden = false;
    const previous = (qs('input[name="specialty"]:checked') || {}).value;
    group.innerHTML = all.map(s => {
      const checked = previous === s ? 'checked' : '';
      return `<label><input type="radio" name="specialty" value="${s.replace(/"/g, '&quot;')}" ${checked}/><span>${s}</span></label>`;
    }).join('');
    adjustHeight();
  }

  // Custom service add
  function refreshCustomServices() {
    renderCustomChips(qs('#customServicesList'), state.customServices, (i) => {
      state.customServices.splice(i, 1);
      refreshCustomServices();
      renderSpecialty();
      adjustHeight();
    });
  }
  const customServiceBtn = qs('[data-action="add-service"]');
  if (customServiceBtn) {
    customServiceBtn.addEventListener('click', () => {
      const input = qs('#customServiceInput');
      const val = (input.value || '').trim();
      if (!val) return;
      state.customServices.push(val);
      input.value = '';
      refreshCustomServices();
      renderSpecialty();
      adjustHeight();
    });
  }

  function renderCustomChips(container, arr, onRemove) {
    container.innerHTML = arr.map((v, i) =>
      `<span class="custom-chip">${escapeHtml(v)}<button type="button" data-i="${i}" aria-label="Retirer">×</button></span>`
    ).join('');
    qsa('button', container).forEach(btn => {
      btn.addEventListener('click', () => onRemove(parseInt(btn.dataset.i, 10)));
    });
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]));
  }

  // ===== Chips multi-select (image, diff) =====
  qsa('.chip-grid[data-name="image"] .chip-card').forEach((chip) => {
    chip.addEventListener('click', () => {
      const val = chip.dataset.value;
      if (state.selectedImage.has(val)) {
        state.selectedImage.delete(val);
        chip.classList.remove('is-active');
      } else {
        if (state.selectedImage.size >= 3) return;
        state.selectedImage.add(val);
        chip.classList.add('is-active');
      }
      const hidden = qs('input[name="image"]');
      if (hidden) hidden.value = [...state.selectedImage].join(',');
      adjustHeight();
    });
  });

  qsa('.chip-grid[data-name="diff"] .chip-card').forEach((chip) => {
    chip.addEventListener('click', () => {
      const val = chip.dataset.value;
      if (state.selectedDiff.has(val)) {
        state.selectedDiff.delete(val);
        chip.classList.remove('is-active');
      } else {
        state.selectedDiff.add(val);
        chip.classList.add('is-active');
      }
      const hidden = qs('input[name="diff"]');
      if (hidden) hidden.value = [...state.selectedDiff].join(',');
    });
  });

  // Custom diff add
  function refreshCustomDiff() {
    renderCustomChips(qs('#customDiffList'), state.customDiff, (i) => {
      state.customDiff.splice(i, 1);
      refreshCustomDiff();
      adjustHeight();
    });
  }
  const customDiffBtn = qs('[data-action="add-diff"]');
  if (customDiffBtn) {
    customDiffBtn.addEventListener('click', () => {
      const input = qs('#customDiffInput');
      const val = (input.value || '').trim();
      if (!val) return;
      state.customDiff.push(val);
      input.value = '';
      refreshCustomDiff();
      adjustHeight();
    });
  }

  // ===== "Choisissez pour moi" =====
  qsa('[data-action="auto-pick"]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.target;
      if (target === 'image') {
        const presets = ['serieux', 'familial', 'local'];
        state.selectedImage = new Set(presets);
        qsa('.chip-grid[data-name="image"] .chip-card').forEach(c => {
          c.classList.toggle('is-active', presets.includes(c.dataset.value));
        });
        const hidden = qs('input[name="image"]');
        if (hidden) hidden.value = presets.join(',');
      }
      if (target === 'palette') {
        const choice = 'bleu-pro';
        state.palette = choice;
        qsa('.palette-card').forEach(c => c.classList.toggle('is-active', c.dataset.value === choice));
        const hidden = qs('input[name="palette"]');
        if (hidden) hidden.value = choice;
      }
    });
  });

  // ===== Logo upload (révélé quand "J'ai un logo") =====
  qsa('input[name="logo"]').forEach((r) => {
    r.addEventListener('change', () => {
      const zone = qs('#logoUploadZone');
      if (!zone) return;
      zone.hidden = !(r.value === 'envoi' && r.checked);
      if (zone.hidden) {
        state.logoFile = null;
        const input = qs('#logoInput');
        if (input) input.value = '';
        const p = qs('#logoPreview');
        if (p) p.innerHTML = '';
      }
      adjustHeight();
    });
  });

  const logoInput = qs('#logoInput');
  if (logoInput) {
    logoInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      // Limite 5 Mo (FormSubmit)
      if (file.size > 5 * 1024 * 1024) {
        alert('Le fichier dépasse 5 Mo. Compressez-le ou envoyez-nous-le par WhatsApp.');
        logoInput.value = '';
        return;
      }
      state.logoFile = file;
      const preview = qs('#logoPreview');
      if (!preview) return;
      preview.innerHTML = '';
      if (file.type.startsWith('image/')) {
        const url = URL.createObjectURL(file);
        preview.innerHTML = `<div class="upload-thumb" style="max-width:160px;"><img src="${url}" alt="Logo"/><button type="button" class="upload-remove" aria-label="Retirer">×</button></div>`;
      } else {
        preview.innerHTML = `<div class="upload-thumb-info"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg><span>${escapeHtml(file.name)} — prêt à envoyer</span><button type="button" class="upload-remove" style="position:static;margin-left:auto;" aria-label="Retirer">×</button></div>`;
      }
      preview.querySelector('.upload-remove').addEventListener('click', () => {
        state.logoFile = null;
        logoInput.value = '';
        preview.innerHTML = '';
        adjustHeight();
      });
      adjustHeight();
    });
  }

  // Envoi du fichier en pièce jointe via FormSubmit (multipart, fire-and-forget)
  function sendLogoAttachment(file, companyName) {
    const fd = new FormData();
    fd.append('logo', file, file.name);
    fd.append('_subject', '📎 LOGO joint — ' + (companyName || 'demande maquette'));
    fd.append('_captcha', 'false');
    fd.append('_template', 'basic');
    fd.append('message', 'Pièce jointe du logo pour la demande de maquette de ' + (companyName || '—') + '.');
    return fetch('https://formsubmit.co/' + encodeURIComponent(NOTIFICATION_EMAIL), {
      method: 'POST',
      body: fd,
      mode: 'no-cors'
    });
  }

  // ===== Palette =====
  qsa('.palette-card').forEach((card) => {
    card.addEventListener('click', () => {
      const val = card.dataset.value;
      state.palette = val;
      qsa('.palette-card').forEach(c => c.classList.toggle('is-active', c === card));
      const hidden = qs('input[name="palette"]');
      if (hidden) hidden.value = val;
    });
  });


  // ===== Boutons next/prev =====
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

  // Effacer erreur dès saisie
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
    if (t.type === 'radio') {
      const slide = t.closest('.form-slide');
      const errEl = slide && slide.querySelector('[data-error-for="' + t.name + '"]');
      if (errEl) errEl.textContent = '';
    }
  });

  // ===== UTM =====
  function getUtms() {
    const params = new URLSearchParams(window.location.search);
    const utm = {};
    ['utm_source','utm_medium','utm_campaign','utm_content','utm_term'].forEach((k) => {
      const v = params.get(k);
      if (v) utm[k] = v;
    });
    return utm;
  }

  // ===== Submission =====
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!validateSlide(current)) return;
    for (let i = 0; i < totalSlides; i++) {
      if (!validateSlide(i)) { goTo(i); return; }
    }

    const submitBtn = form.querySelector('button[type=submit]');
    const originalLabel = submitBtn ? submitBtn.innerHTML : '';
    if (submitBtn) { submitBtn.disabled = true; submitBtn.innerHTML = 'Envoi en cours…'; }

    try {
      // 1) Si logo uploadé → envoi en pièce jointe (fire-and-forget, on n'attend pas)
      if (state.logoFile) {
        try { sendLogoAttachment(state.logoFile, form.querySelector('#company').value); } catch(_) {}
      }

      const fd = new FormData(form);
      const payload = {};
      fd.forEach((value, key) => {
        if (payload[key] !== undefined) {
          if (Array.isArray(payload[key])) payload[key].push(value);
          else payload[key] = [payload[key], value];
        } else payload[key] = value;
      });
      payload.utm = getUtms();
      payload.page = window.location.href;
      payload.sentAt = new Date().toISOString();

      await submitForm(payload);

      const wrapper = qs('.form-wrapper');
      const progress = qs('.form-progress');
      form.style.display = 'none';
      if (progress) progress.style.display = 'none';
      if (successEl) successEl.hidden = false;
      if (wrapper) {
        const top = wrapper.getBoundingClientRect().top + window.scrollY - 80;
        window.scrollTo({ top, behavior: 'smooth' });
      }
      if (window.dataLayer) window.dataLayer.push({ event: 'maquette_request_sent' });
    } catch (err) {
      console.error(err);
      if (submitBtn) { submitBtn.disabled = false; submitBtn.innerHTML = originalLabel; }
      alert('Une erreur est survenue. Réessayez ou écrivez à contact@batiproconnect.com');
    }
  });

  // ===== Labels lisibles =====
  const URGENCE_LABELS    = { 'oui': 'Oui, 24h/24', 'modulable': 'Modulable selon les cas', 'non': 'Non, horaires de bureau' };
  const DEVIS_LABELS      = { 'oui': 'Oui, gratuit', 'cas-par-cas': 'Au cas par cas', 'non': 'Non, payant' };
  const LOGO_LABELS       = { 'envoi': 'Le client en a un', 'creer': 'À créer', 'texte': 'Juste le nom écrit proprement' };
  const PHOTOS_LABELS     = { 'envoi': 'Seront envoyées par WhatsApp / email', 'exemples': 'Visuels d\'exemple', 'auto': 'Choisir pour le client' };
  const CHARTE_LABELS     = { 'oui': 'Oui (sera envoyée)', 'non': 'Non, libre' };
  const EFFECTIF_LABELS   = { '1': 'Tout seul', '2-9': '2 à 9 personnes', '10+': 'Plus de 10 personnes' };
  const RADIUS_LABELS     = { '10km': '10 km', '25km': '25 km', '50km': '50 km', '100km': '100 km', 'france': 'France entière' };
  const CLIENTELE_LABELS  = { 'particuliers': 'Particuliers', 'professionnels': 'Professionnels', 'les-deux': 'Particuliers et professionnels' };
  const CERTIF_LABELS     = { 'decennale': 'Garantie décennale', 'rge': 'RGE', 'qualibat': 'Qualibat', 'qualipac': 'QualiPAC', 'qualibois': 'Qualibois', 'qualipv': 'QualiPV', 'assurance': 'Assurance pro' };

  // ===== Markdown brief generator =====
  function buildMarkdownBrief(p) {
    const tradeNames = state.selectedTrades.map(t => t === 'autre' ? (p.tradeOther || 'Autre métier') : (TRADES[t] && TRADES[t].label) || t);
    const isMulti = state.selectedTrades.filter(t => t !== 'autre').length >= 2;

    const allServices = [...state.selectedServices].map(v => v.split('|')[1]).concat(state.customServices);
    const imageList = [...state.selectedImage].map(k => IMAGE_LABELS[k] || k);
    const diffList = [...state.selectedDiff].map(k => DIFF_LABELS[k] || k).concat(state.customDiff);
    const certifsRaw = Array.isArray(p.certifs) ? p.certifs : (p.certifs ? [p.certifs] : []);
    const certifsList = certifsRaw.map(c => CERTIF_LABELS[c] || c);
    if (p.certifsOther) certifsList.push(p.certifsOther);
    const palette = state.palette ? (PALETTE_LABELS[state.palette] || state.palette) : '';

    const out = [];
    out.push(`# BRIEF MAQUETTE — ${p.company || 'Sans nom'}`);
    out.push('');
    out.push('---');
    out.push('');
    out.push(`## 🔨 Métier${isMulti ? ' (multiservice)' : ''}`);
    out.push(tradeNames.length ? tradeNames.join(' · ') : '—');
    out.push('');
    out.push('## 💼 Entreprise');
    out.push(`- **Nom :** ${p.company || '—'}`);
    out.push(`- **Effectif :** ${EFFECTIF_LABELS[p.effectif] || p.effectif || '—'}`);
    if (p.founded) out.push(`- **Année de création :** ${p.founded}`);
    out.push(`- **Ville :** ${p.city || '—'}`);
    out.push(`- **Rayon d'intervention :** ${RADIUS_LABELS[p.radius] || p.radius || '—'}`);
    out.push(`- **Clientèle :** ${CLIENTELE_LABELS[p.clientele] || p.clientele || '—'}`);
    out.push('');
    out.push('## 🎨 Image voulue (ton du site)');
    if (imageList.length) imageList.forEach(i => out.push(`- ${i}`));
    else out.push('- *(client veut qu\'on choisisse)*');
    if (p.imageNote) out.push(`- **Note libre :** ${p.imageNote}`);
    out.push('');
    out.push('## 🛠️ Prestations');
    if (allServices.length) allServices.forEach(s => out.push(`- ${s}`));
    else out.push('- —');
    if (p.specialty) out.push(`\n**Spécialité à mettre en avant :** ${p.specialty}`);
    out.push('');
    out.push(`- **Urgence 24/7 :** ${URGENCE_LABELS[p.urgence] || p.urgence || '—'}`);
    out.push(`- **Devis gratuit :** ${DEVIS_LABELS[p.devisGratuit] || p.devisGratuit || '—'}`);
    out.push('');
    out.push('## ⭐ Différenciation & atouts');
    if (diffList.length) diffList.forEach(d => out.push(`- ${d}`));
    else out.push('- —');
    out.push('');
    if (certifsList.length) out.push(`**Certifications :** ${certifsList.join(', ')}`);
    if (p.brands) out.push(`**Marques posées :** ${p.brands}`);
    if (p.googleRating || p.googleCount) out.push(`**Note Google :** ${p.googleRating || '—'} (${p.googleCount || 0} avis)`);
    out.push('');
    out.push('## 🖼️ Identité visuelle');
    let logoLine = LOGO_LABELS[p.logo] || p.logo || '—';
    if (p.logo === 'envoi') {
      logoLine += state.logoFile
        ? ` → 📎 fichier joint (« ${state.logoFile.name} ») dans un email séparé`
        : ' → à envoyer par WhatsApp / email';
    }
    out.push(`- **Logo :** ${logoLine}`);
    out.push(`- **Charte graphique imposée :** ${CHARTE_LABELS[p.charte] || p.charte || 'non précisé'}`);
    out.push(`- **Palette :** ${palette || '—'}`);
    if (p.customColors) out.push(`- **Couleurs précisées :** ${p.customColors}`);
    out.push(`- **Photos chantier :** ${PHOTOS_LABELS[p.photos] || p.photos || '—'}`);
    out.push('');
    out.push('## 📞 Contact');
    out.push(`- **Email :** ${p.email || '—'}`);
    out.push(`- **Téléphone :** ${p.phone || '—'}`);
    if (p.currentSite) out.push(`- **Site / Facebook actuel :** ${p.currentSite}`);
    if (p.notes) { out.push(''); out.push('## 📝 Notes du client'); out.push(p.notes); }

    return out.join('\n');
  }

  // ===== Submit to FormSubmit =====
  async function submitForm(payload) {
    const p = { ...payload };
    const brief = buildMarkdownBrief(p);

    // Bloc à copier-coller : on enveloppe le brief dans des séparateurs visuels
    const copyBlock =
      '═══════════════════════════════════════════════════════\n' +
      '  📋  BRIEF À COPIER DANS CLAUDE — ENTRE LES SÉPARATEURS\n' +
      '═══════════════════════════════════════════════════════\n\n' +
      brief + '\n\n' +
      '═══════════════════════════════════════════════════════\n' +
      '  ↑ FIN DU BRIEF\n' +
      '═══════════════════════════════════════════════════════';

    const body = {
      _subject: `🟠 Nouvelle demande de maquette — ${p.company || p.email || 'Sans nom'}`,
      _template: 'basic',
      _captcha: 'false',
      _autoresponse: `Bonjour,\n\nNous avons bien reçu votre demande de maquette pour ${p.company || 'votre entreprise'}. Nous revenons vers vous sous 7 jours avec une proposition personnalisée.\n\nÀ très vite,\nL'équipe Batiproconnect\ncontact@batiproconnect.com`,
      email: p.email || '',
      message: copyBlock,
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

  // Init
  renderServicesStep();
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
          _subject: '📞 RAPPEL DEMANDÉ — ' + val,
          _template: 'table',
          _captcha: 'false',
          // Pas d'email côté visiteur (formulaire abrégé), on met l'email de notification pour reply-to
          email: NOTIFICATION_EMAIL,
          '📞 Téléphone à rappeler': val,
          '🏷️ Type de demande': 'Rappel rapide (formulaire abrégé "Pas le temps")',
          '🔗 Page d\'origine': window.location.href,
          '📊 UTM': utmStr,
          '🕐 Envoyé le': new Date().toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' }),
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
