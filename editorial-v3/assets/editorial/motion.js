/* ============================================================
   FUTURE EDITORIAL — Motion
   Sistema de reveal on-scroll + split de palavras + acordeão FAQ.
   Classes de reveal (aplique no HTML):
     .reveal-up    sobe + fade + blur (use stagger via nth-child no CSS)
     .reveal-side  entra pela lateral
     .reveal-media entra com escala + blur (imagens)
     .reveal-mark  itens de lista (marcador ✓/× revela junto)
     .reveal-write revela palavra a palavra (split automático)
   Observer: threshold 0.22, rootMargin '0px 0px -8%', anima 1× (unobserve).
   ============================================================ */
(function () {
  var reduceMotion =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var revealSelectors =
    ".reveal-media, .reveal-side, .reveal-up, .reveal-mark, .reveal-write";
  var revealItems = document.querySelectorAll(revealSelectors);
  var faqItems = document.querySelectorAll(".faq-item");

  /* --- Split de palavras para .reveal-write (cascata palavra a palavra) --- */
  function splitRevealNode(node, state) {
    if (node.nodeType === Node.TEXT_NODE) {
      var fragment = document.createDocumentFragment();
      var parts = node.textContent.split(/(\s+)/);

      parts.forEach(function (part) {
        if (!part) return;
        if (/^\s+$/.test(part)) {
          fragment.appendChild(document.createTextNode(part));
          return;
        }
        var span = document.createElement("span");
        span.className = "reveal-word";
        span.style.setProperty("--word-index", state.index);
        span.textContent = part;
        state.index += 1;
        fragment.appendChild(span);
      });

      return fragment;
    }

    if (node.nodeType === Node.ELEMENT_NODE) {
      var clone = node.cloneNode(false);
      node.childNodes.forEach(function (child) {
        var processed = splitRevealNode(child, state);
        if (processed) clone.appendChild(processed);
      });
      return clone;
    }

    return null;
  }

  document.querySelectorAll(".reveal-write").forEach(function (item) {
    var state = { index: 0 };
    var fragment = document.createDocumentFragment();
    item.childNodes.forEach(function (child) {
      var processed = splitRevealNode(child, state);
      if (processed) fragment.appendChild(processed);
    });
    item.replaceChildren(fragment);
  });

  /* --- Reveal on-scroll (anima uma única vez) --- */
  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealItems.forEach(function (item) {
      item.classList.add("is-visible");
    });
  } else {
    var revealObserver = new IntersectionObserver(
      function (entries, observer) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.22, rootMargin: "0px 0px -8% 0px" }
    );
    revealItems.forEach(function (item) {
      revealObserver.observe(item);
    });
  }

  /* --- FAQ acordeão (um aberto por vez) --- */
  faqItems.forEach(function (item) {
    var trigger = item.querySelector(".faq-item__trigger");
    var answer = item.querySelector(".faq-item__answer");
    if (!trigger || !answer) return;

    trigger.addEventListener("click", function () {
      var isOpen = item.classList.contains("is-open");

      faqItems.forEach(function (other) {
        var t = other.querySelector(".faq-item__trigger");
        var a = other.querySelector(".faq-item__answer");
        other.classList.remove("is-open");
        if (t) t.setAttribute("aria-expanded", "false");
        if (a) a.hidden = true;
      });

      if (!isOpen) {
        item.classList.add("is-open");
        trigger.setAttribute("aria-expanded", "true");
        answer.hidden = false;
      }
    });
  });
})();
