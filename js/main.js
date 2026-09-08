// Werringloer Komponentenmanagement – kleine UI-Helfer (kein Framework, kein Build-Schritt)

document.addEventListener("DOMContentLoaded", function () {
  // Mobiles Menü umschalten
  var header = document.querySelector(".site-header");
  var toggle = document.querySelector(".nav-toggle");

  if (toggle && header) {
    toggle.addEventListener("click", function () {
      var isOpen = header.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });

    // Menü schließen, wenn ein Link angeklickt wird (mobil)
    header.querySelectorAll(".nav-links a").forEach(function (link) {
      link.addEventListener("click", function () {
        header.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  // Aktuelles Jahr im Footer
  var yearEl = document.getElementById("year");
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  // Sanftes Einblenden von Inhalten beim Scrollen (kein zusätzliches HTML nötig)
  var revealSelector =
    ".card, .section-head, .steps li, .cta-band, .contact-card, .page-header > .container > *, .two-col > *";
  var revealTargets = document.querySelectorAll(revealSelector);
  var prefersReducedMotion = window.matchMedia
    ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
    : false;

  if (revealTargets.length && "IntersectionObserver" in window && !prefersReducedMotion) {
    revealTargets.forEach(function (el, i) {
      el.classList.add("reveal");
      el.style.transitionDelay = Math.min(i % 4, 3) * 70 + "ms";
    });

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );

    revealTargets.forEach(function (el) {
      observer.observe(el);
    });
  }

  // Kontaktformular: öffnet den Mail-Client mit vorausgefüllter Nachricht.
  // Es gibt bewusst kein Server-Backend – kann später z.B. über einen
  // Formular-Dienst (Formspree, Netlify Forms o.ä.) ersetzt werden.
  var form = document.getElementById("contact-form");
  if (form) {
    form.addEventListener("submit", function (event) {
      event.preventDefault();

      var name = form.name.value.trim();
      var email = form.email.value.trim();
      var company = form.company.value.trim();
      var message = form.message.value.trim();
      var status = document.getElementById("form-status");

      if (!name || !email || !message) {
        if (status) {
          status.textContent = "Bitte Name, E-Mail und Nachricht ausfüllen.";
          status.className = "form-status is-visible error";
        }
        return;
      }

      var subject = encodeURIComponent("Anfrage über die Website – " + name);
      var bodyLines = [
        "Name: " + name,
        "Unternehmen: " + (company || "-"),
        "E-Mail: " + email,
        "",
        message,
      ];
      var body = encodeURIComponent(bodyLines.join("\n"));
      var mailto = "mailto:service@werringloer.de?subject=" + subject + "&body=" + body;

      window.location.href = mailto;

      if (status) {
        status.textContent = "Ihr E-Mail-Programm sollte sich jetzt mit einer vorausgefüllten Nachricht öffnen.";
        status.className = "form-status is-visible success";
      }
    });
  }
});
