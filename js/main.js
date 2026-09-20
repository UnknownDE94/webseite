// Werringloer Komponentenmanagement – kleine UI-Helfer (kein Framework, kein Build-Schritt)

document.addEventListener("DOMContentLoaded", function () {
  // Theme preference is shared across all pages.
  var themeToggle = document.querySelector(".theme-toggle");
  var savedTheme = null;
  try {
    savedTheme = window.localStorage.getItem("theme");
  } catch (error) {
    savedTheme = null;
  }
  var prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  var isDark = savedTheme ? savedTheme === "dark" : prefersDark;

  function applyTheme(dark) {
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
    if (themeToggle) {
      themeToggle.setAttribute("aria-pressed", dark ? "true" : "false");
      themeToggle.setAttribute("aria-label", dark ? "Hellen Modus aktivieren" : "Dunklen Modus aktivieren");
      themeToggle.querySelector("span").textContent = dark ? "☀" : "☾";
    }
  }

  applyTheme(isDark);
  if (themeToggle) {
    themeToggle.addEventListener("click", function () {
      isDark = !isDark;
      try {
        window.localStorage.setItem("theme", isDark ? "dark" : "light");
      } catch (error) {
        // Theme still works for the current page when storage is unavailable.
      }
      applyTheme(isDark);
    });
  }

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

      var name = document.getElementById("name").value.trim();
      var email = document.getElementById("email").value.trim();
      var company = document.getElementById("company").value.trim();
      var date = document.getElementById("date").value;
      var time = document.getElementById("time").value;
      var message = document.getElementById("message").value.trim();
      var status = document.getElementById("form-status");

      if (!name || !email) {
        if (status) {
          status.textContent = "Bitte Name und E-Mail ausfüllen.";
          status.className = "form-status is-visible error";
        }
        return;
      }

      var subject = encodeURIComponent("Terminanfrage – " + name);
      var bodyLines = [
        "Name: " + name,
        "Unternehmen: " + (company || "-"),
        "E-Mail: " + email,
        "Wunschtermin: " + (date || "Keine Präferenz"),
        "Wunschzeit: " + (time || "Keine Präferenz"),
        "",
        message || "Kein zusätzlicher Hinweis.",
      ];
      var body = encodeURIComponent(bodyLines.join("\n"));
      var mailto = "mailto:service@werringloer.de?subject=" + subject + "&body=" + body;

      var mailLink = document.createElement("a");
      mailLink.href = mailto;
      mailLink.target = "_self";
      mailLink.rel = "noreferrer";
      document.body.appendChild(mailLink);
      mailLink.click();
      mailLink.remove();

      if (status) {
        status.textContent = "Ihr E-Mail-Programm sollte sich jetzt mit einer vorausgefüllten Nachricht öffnen.";
        status.className = "form-status is-visible success";
      }
    });
  }

  // Baustellen-Hinweis (Pop-up): weist Besucher darauf hin, dass die
  // Website noch im Aufbau ist. Erscheint einmal pro Sitzung (Merken per
  // sessionStorage), nicht bei jedem Seitenaufruf erneut.
  (function () {
    var storageKey = "site-notice-dismissed";
    var alreadyShown = false;
    try {
      alreadyShown = window.sessionStorage.getItem(storageKey) === "1";
    } catch (error) {
      alreadyShown = false;
    }
    if (alreadyShown) {
      return;
    }

    var overlay = document.createElement("div");
    overlay.className = "site-notice-overlay";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-labelledby", "site-notice-title");
    overlay.innerHTML =
      '<div class="site-notice">' +
      '<button type="button" class="site-notice-close" aria-label="Hinweis schließen">&times;</button>' +
      '<div class="site-notice-icon" aria-hidden="true">🚧</div>' +
      '<h2 id="site-notice-title">Diese Website befindet sich im Aufbau</h2>' +
      "<p>Einzelne Inhalte, Texte und Funktionen werden aktuell noch ergänzt und können sich in nächster Zeit ändern. Vielen Dank für Ihr Verständnis.</p>" +
      '<div class="site-notice-actions"><button type="button" class="btn btn-primary site-notice-ok">Verstanden</button></div>' +
      "</div>";
    document.body.appendChild(overlay);

    function closeNotice() {
      overlay.classList.remove("is-visible");
      try {
        window.sessionStorage.setItem(storageKey, "1");
      } catch (error) {
        // Hinweis erscheint ggf. erneut, wenn sessionStorage nicht verfügbar ist.
      }
      window.setTimeout(function () {
        if (overlay.parentNode) {
          overlay.parentNode.removeChild(overlay);
        }
      }, 260);
    }

    overlay.querySelector(".site-notice-close").addEventListener("click", closeNotice);
    overlay.querySelector(".site-notice-ok").addEventListener("click", closeNotice);
    overlay.addEventListener("click", function (event) {
      if (event.target === overlay) {
        closeNotice();
      }
    });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && overlay.classList.contains("is-visible")) {
        closeNotice();
      }
    });

    window.requestAnimationFrame(function () {
      overlay.classList.add("is-visible");
    });
  })();
});
