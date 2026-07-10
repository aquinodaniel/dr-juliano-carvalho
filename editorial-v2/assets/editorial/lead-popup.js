/* ============================================================
   lead-popup.js — Popup de captura de lead nos CTAs (LP Juliano)
   ------------------------------------------------------------
   Porta a mecânica da LP da Semana da Precificação para a LP
   estática do Dr. Juliano: TODO CTA abre um modal que captura
   nome / WhatsApp / e-mail, envia pro webhook (fire-and-forget)
   e em seguida REDIRECIONA pro checkout.

   Autocontido: injeta o próprio <style> e o próprio markup no
   fim do <body>. Basta incluir uma linha no index:
       <script src="assets/editorial/lead-popup.js" defer></script>

   Identidade visual: fundo escuro, fio + acento dourado
   (--accent-gold #dfc19a), tipografia Fraunces (título) e IBM
   Plex Mono (labels/eyebrow) — já carregadas na página.
   ============================================================ */
(function () {
  'use strict';

  // ---------- CONFIG (ajuste ao publicar) ----------
  // URL do checkout externo (Kiwify/Hotmart). Enquanto vazia, o popup
  // mostra uma confirmação inline em vez de redirecionar.
  var CHECKOUT_URL = '';
  // Endpoint opcional que recebe os leads (POST JSON). Vazio = não envia.
  var LEAD_WEBHOOK_URL = '';
  // Identifica a origem do lead no webhook.
  var SOURCE = 'lp.juliano-arrematacao';

  // Seletores dos CTAs que devem abrir o popup.
  var CTA_SELECTOR = 'a.cta, a.button--offer, [data-lead-popup]';

  // ---------- Rastreio de campanha (UTMs) ----------
  // Captura na 1ª visita, persiste na sessão e anexa ao checkout no submit,
  // pra não perder a atribuição do anúncio.
  var TRACK_KEYS = ['utm_source','utm_medium','utm_campaign','utm_term','utm_content','utm_id','gclid','gbraid','wbraid','fbclid','ttclid','msclkid','src','sck','xcod','ref'];
  var TRACK_STORE = 'lpzTracking';
  function getTracking() {
    var data = {};
    try { data = JSON.parse(sessionStorage.getItem(TRACK_STORE) || '{}'); } catch (e) {}
    try {
      var sp = new URLSearchParams(window.location.search);
      TRACK_KEYS.forEach(function (k) { var v = sp.get(k); if (v) data[k] = v; }); // URL atual tem prioridade
    } catch (e) {}
    try { sessionStorage.setItem(TRACK_STORE, JSON.stringify(data)); } catch (e) {}
    return data;
  }
  function withTracking(url) {
    var t = getTracking(), keys = Object.keys(t);
    if (!keys.length) return url;
    var hash = '', base = url, hi = url.indexOf('#');
    if (hi > -1) { hash = url.slice(hi); base = url.slice(0, hi); } // preserva o #hash do checkout
    var sep = base.indexOf('?') > -1 ? '&' : '?';
    var qs = keys.map(function (k) { return encodeURIComponent(k) + '=' + encodeURIComponent(t[k]); }).join('&');
    return base + sep + qs + hash;
  }
  getTracking(); // grava as UTMs logo no load, antes de qualquer conversão

  // ---------- Conteúdo ----------
  var COPY = {
    titulo: 'Sua vaga na Imersão está a um passo.',
    tituloDestaque: 'Garanta por R$19.',
    subtitle: 'Preencha seus dados e continue para o pagamento seguro.',
    campos: {
      nome: { label: 'Nome completo', placeholder: 'Como você se chama' },
      telefone: { label: 'WhatsApp', placeholder: '(00) 00000-0000' },
      email: { label: 'E-mail', placeholder: 'voce@exemplo.com' }
    },
    enviar: 'Continuar para o pagamento',
    enviando: 'Aguarde…',
    disclaimer: 'Seus dados estão seguros. Em seguida você vai para o pagamento.',
    sucesso: 'Recebemos seus dados. Nossa equipe entra em contato com o link de pagamento.',
    erros: {
      nome: 'Digite seu nome completo.',
      email: 'Digite um e-mail válido.',
      telefone: 'Digite um WhatsApp com DDD.'
    }
  };

  // ---------- Validação / máscara ----------
  function onlyDigits(s) { return (s || '').replace(/\D/g, ''); }
  function maskPhone(s) {
    var d = onlyDigits(s).slice(0, 11);
    if (d.length < 3) return d;
    if (d.length < 8) return '(' + d.slice(0, 2) + ') ' + d.slice(2);
    if (d.length <= 10) return '(' + d.slice(0, 2) + ') ' + d.slice(2, 6) + '-' + d.slice(6);
    return '(' + d.slice(0, 2) + ') ' + d.slice(2, 7) + '-' + d.slice(7);
  }
  function isName(s) { return (s || '').trim().length >= 3; }
  function isEmail(s) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test((s || '').trim()); }
  function isPhone(s) { var d = onlyDigits(s); return d.length === 10 || d.length === 11; }

  // ---------- CSS ----------
  var CSS = [
    '.lp-modal{position:fixed;inset:0;z-index:1000;display:flex;align-items:flex-end;justify-content:center;padding:14px 12px;opacity:0;visibility:hidden;transition:opacity .18s ease,visibility .18s ease}',
    '@media(min-width:640px){.lp-modal{align-items:center;padding:24px}}',
    '.lp-modal.is-open{opacity:1;visibility:visible}',
    '.lp-modal__backdrop{position:absolute;inset:0;background:rgba(0,0,0,.72);backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);border:0;cursor:default;padding:0}',
    '.lp-modal__dialog{position:relative;width:100%;max-width:480px;background:#0d0d0d;color:#f3f3f1;border:1px solid rgba(223,193,154,.24);border-radius:20px;overflow:hidden;box-shadow:0 30px 70px -20px rgba(0,0,0,.7);transform:translateY(30px) scale(.96);transition:transform .22s cubic-bezier(.22,1,.36,1)}',
    '.lp-modal.is-open .lp-modal__dialog{transform:translateY(0) scale(1)}',
    '.lp-modal__wire{position:absolute;inset:0 0 auto 0;height:1px;background:linear-gradient(90deg,transparent,#dfc19a 50%,transparent)}',
    '.lp-modal__glow{position:absolute;left:50%;top:0;width:280px;height:120px;transform:translate(-50%,-33%);background:rgba(223,193,154,.10);filter:blur(70px);pointer-events:none}',
    '.lp-modal__close{position:absolute;right:14px;top:14px;z-index:2;width:32px;height:32px;display:flex;align-items:center;justify-content:center;border:0;border-radius:50%;background:rgba(255,255,255,.10);color:rgba(255,255,255,.65);cursor:pointer;transition:background .18s,color .18s}',
    '.lp-modal__close:hover{background:rgba(255,255,255,.20);color:#fff}',
    '.lp-modal__body{position:relative;z-index:1;padding:36px 24px 28px}',
    '@media(min-width:640px){.lp-modal__body{padding:36px 32px 28px}}',
    '.lp-modal__title{font-family:"Fraunces",Georgia,serif;font-weight:600;font-size:1.35rem;line-height:1.18;text-align:center;margin:0 auto;max-width:24ch;text-wrap:balance}',
    '.lp-modal__title em{font-style:normal;color:#dfc19a}',
    '.lp-modal__sub{margin:10px auto 0;max-width:34ch;text-align:center;font-family:"Libre Franklin",system-ui,sans-serif;font-size:.86rem;line-height:1.5;color:rgba(243,243,241,.65)}',
    '.lp-form{margin-top:22px;display:flex;flex-direction:column;gap:14px}',
    '.lp-field>span:first-child{display:block;margin-bottom:6px;font-family:"IBM Plex Mono",monospace;font-size:10px;font-weight:500;letter-spacing:.22em;text-transform:uppercase;color:rgba(255,255,255,.55)}',
    '.lp-field input{width:100%;padding:12px 15px;font-size:15px;font-family:"Libre Franklin",system-ui,sans-serif;color:#fff;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.12);border-radius:10px;outline:none;transition:border-color .16s,background .16s}',
    '.lp-field input::placeholder{color:rgba(255,255,255,.25)}',
    '.lp-field input:focus{background:rgba(255,255,255,.07);border-color:rgba(223,193,154,.55)}',
    '.lp-field.has-error input{border-color:#e5646b}',
    '.lp-field__error{display:none;margin-top:5px;font-size:11px;color:#ff6b2c}',
    '.lp-field.has-error .lp-field__error{display:block}',
    '.lp-submit{margin-top:6px;width:100%;min-height:52px;padding:0 22px;border:0;border-radius:999px;cursor:pointer;font-family:"Libre Franklin",system-ui,sans-serif;font-size:15px;font-weight:600;color:#141414;background:linear-gradient(180deg,#e7cfa8 0%,#dfc19a 100%);box-shadow:0 12px 30px -10px rgba(223,193,154,.5);transition:transform .18s ease,filter .18s ease}',
    '.lp-submit:hover:not(:disabled){transform:translateY(-1px);filter:brightness(1.03)}',
    '.lp-submit:disabled{opacity:.6;cursor:not-allowed}',
    '.lp-disclaimer{display:flex;align-items:center;justify-content:center;gap:6px;margin-top:4px;text-align:center;font-family:"Libre Franklin",system-ui,sans-serif;font-size:11px;line-height:1.5;color:rgba(243,243,241,.42)}',
    '.lp-disclaimer svg{flex:none;color:#dfc19a}',
    '.lp-success{text-align:center;padding:8px 0 4px}',
    '.lp-success__icon{width:48px;height:48px;margin:0 auto 14px;display:flex;align-items:center;justify-content:center;border-radius:50%;background:rgba(223,193,154,.14);color:#dfc19a}',
    '.lp-success p{font-family:"Libre Franklin",system-ui,sans-serif;font-size:.95rem;line-height:1.55;color:rgba(243,243,241,.85);max-width:30ch;margin:0 auto}'
  ].join('');

  // ---------- Markup ----------
  var f = COPY.campos;
  var HTML =
    '<button type="button" class="lp-modal__backdrop" aria-label="Fechar" data-lp-close></button>' +
    '<div class="lp-modal__dialog" role="dialog" aria-modal="true" aria-labelledby="lp-modal-title">' +
      '<div class="lp-modal__wire" aria-hidden="true"></div>' +
      '<div class="lp-modal__glow" aria-hidden="true"></div>' +
      '<button type="button" class="lp-modal__close" aria-label="Fechar" data-lp-close>' +
        '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 3l10 10M13 3L3 13" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>' +
      '</button>' +
      '<div class="lp-modal__body">' +
        '<div class="lp-modal__view" data-lp-view="form">' +
          '<h3 class="lp-modal__title" id="lp-modal-title">' + COPY.titulo + ' <em>' + COPY.tituloDestaque + '</em></h3>' +
          '<p class="lp-modal__sub">' + COPY.subtitle + '</p>' +
          '<form class="lp-form" novalidate>' +
            '<label class="lp-field" data-field="nome"><span>' + f.nome.label + '</span>' +
              '<input type="text" name="nome" autocomplete="name" placeholder="' + f.nome.placeholder + '">' +
              '<span class="lp-field__error">' + COPY.erros.nome + '</span></label>' +
            '<label class="lp-field" data-field="telefone"><span>' + f.telefone.label + '</span>' +
              '<input type="tel" name="telefone" inputmode="tel" autocomplete="tel" maxlength="16" placeholder="' + f.telefone.placeholder + '">' +
              '<span class="lp-field__error">' + COPY.erros.telefone + '</span></label>' +
            '<label class="lp-field" data-field="email"><span>' + f.email.label + '</span>' +
              '<input type="email" name="email" inputmode="email" autocomplete="email" placeholder="' + f.email.placeholder + '">' +
              '<span class="lp-field__error">' + COPY.erros.email + '</span></label>' +
            '<button type="submit" class="lp-submit">' + COPY.enviar + '</button>' +
            '<p class="lp-disclaimer">' +
              '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 10V8a6 6 0 1 1 12 0v2M5 10h14v10H5z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
              COPY.disclaimer +
            '</p>' +
          '</form>' +
        '</div>' +
        '<div class="lp-modal__view lp-success" data-lp-view="success" hidden>' +
          '<div class="lp-success__icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M5 12.5l4.5 4.5L19 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></div>' +
          '<p>' + COPY.sucesso + '</p>' +
        '</div>' +
      '</div>' +
    '</div>';

  // ---------- Envio do lead (fire-and-forget) ----------
  function sendLead(payload) {
    if (!LEAD_WEBHOOK_URL) return Promise.resolve(false);
    var body = {
      nome: payload.nome,
      email: payload.email,
      telefone: onlyDigits(payload.telefone),
      source: SOURCE,
      trigger: 'cta',
      timestamp: new Date().toISOString(),
      landingUrl: location.href,
      referrer: document.referrer || null,
      userAgent: navigator.userAgent
    };
    try {
      return fetch(LEAD_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: (typeof AbortSignal !== 'undefined' && AbortSignal.timeout) ? AbortSignal.timeout(5000) : undefined
      }).then(function (r) { return r.ok; }).catch(function () { return false; });
    } catch (e) { return Promise.resolve(false); }
  }

  // ---------- Bootstrap ----------
  function init() {
    if (document.getElementById('lp-lead-modal')) return; // idempotente

    var style = document.createElement('style');
    style.id = 'lp-lead-style';
    style.textContent = CSS;
    document.head.appendChild(style);

    var modal = document.createElement('div');
    modal.className = 'lp-modal';
    modal.id = 'lp-lead-modal';
    modal.setAttribute('aria-hidden', 'true');
    modal.innerHTML = HTML;
    document.body.appendChild(modal);

    var dialog = modal.querySelector('.lp-modal__dialog');
    var form = modal.querySelector('.lp-form');
    var viewForm = modal.querySelector('[data-lp-view="form"]');
    var viewSuccess = modal.querySelector('[data-lp-view="success"]');
    var telInput = form.querySelector('input[name="telefone"]');
    var submitBtn = form.querySelector('.lp-submit');
    var lastFocused = null;

    function open() {
      lastFocused = document.activeElement;
      modal.classList.add('is-open');
      modal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      setTimeout(function () {
        var first = form.querySelector('input[name="nome"]');
        if (first) first.focus();
      }, 100);
    }
    function close() {
      modal.classList.remove('is-open');
      modal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      if (lastFocused && lastFocused.focus) lastFocused.focus();
    }
    function clearErrors() {
      form.querySelectorAll('.lp-field.has-error').forEach(function (el) { el.classList.remove('has-error'); });
    }

    // Abre a partir de qualquer CTA
    document.addEventListener('click', function (e) {
      var trigger = e.target.closest ? e.target.closest(CTA_SELECTOR) : null;
      if (!trigger) return;
      // Não sequestra links externos explícitos (ex.: WhatsApp de contato)
      var href = trigger.getAttribute('href') || '';
      if (/^https?:\/\//i.test(href) || href.indexOf('wa.me') !== -1 || href.indexOf('mailto:') === 0 || href.indexOf('tel:') === 0) return;
      e.preventDefault();
      open();
    });

    // Fechar: backdrop, X, ESC
    modal.querySelectorAll('[data-lp-close]').forEach(function (b) { b.addEventListener('click', close); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && modal.classList.contains('is-open')) close();
    });

    // Máscara de telefone
    telInput.addEventListener('input', function () { telInput.value = maskPhone(telInput.value); });

    // Submit
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      clearErrors();
      var data = {
        nome: form.nome.value,
        telefone: form.telefone.value,
        email: form.email.value
      };
      var ok = true;
      if (!isName(data.nome)) { form.querySelector('[data-field="nome"]').classList.add('has-error'); ok = false; }
      if (!isPhone(data.telefone)) { form.querySelector('[data-field="telefone"]').classList.add('has-error'); ok = false; }
      if (!isEmail(data.email)) { form.querySelector('[data-field="email"]').classList.add('has-error'); ok = false; }
      if (!ok) return;

      submitBtn.disabled = true;
      submitBtn.textContent = COPY.enviando;

      // FY Pixel — atribuição do lead (se o pixel estiver na página).
      try {
        if (window.fyads && window.fyads.lead) {
          window.fyads.lead({ nome: data.nome, email: data.email, telefone: onlyDigits(data.telefone) });
        }
      } catch (err) { /* nunca derruba o fluxo */ }

      // Espera no máx. 1,5s pelo webhook e segue pro checkout.
      var race = Promise.race([
        sendLead(data),
        new Promise(function (r) { setTimeout(r, 1500); })
      ]);
      race.then(function () {
        if (CHECKOUT_URL) {
          window.location.href = withTracking(CHECKOUT_URL);
        } else {
          // Sem checkout configurado ainda: confirma inline.
          viewForm.hidden = true;
          viewSuccess.hidden = false;
          submitBtn.disabled = false;
          submitBtn.textContent = COPY.enviar;
        }
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
