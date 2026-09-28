// Werringloer Komponentenmanagement – kleine UI-Helfer (kein Framework, kein Build-Schritt)

document.documentElement.classList.add("js");

document.addEventListener("DOMContentLoaded", function () {
  // Theme preference is shared across all pages (an inline script in <head>
  // already applies it before the first paint to avoid a light flash).
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
    var setMenu = function (open) {
      header.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.setAttribute("aria-label", open ? "Menü schließen" : "Menü öffnen");
    };

    toggle.addEventListener("click", function () {
      setMenu(!header.classList.contains("is-open"));
    });

    // Menü schließen, wenn ein Link angeklickt oder Escape gedrückt wird (mobil)
    header.querySelectorAll(".nav-links a").forEach(function (link) {
      link.addEventListener("click", function () {
        setMenu(false);
      });
    });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && header.classList.contains("is-open")) {
        setMenu(false);
        toggle.focus();
      }
    });
  }

  // Aktuelles Jahr im Footer
  var yearEl = document.getElementById("year");
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  // Sanftes Einblenden von Inhalten beim Scrollen (kein zusätzliches HTML nötig).
  // Elemente mit data-reveal="left|right" gleiten seitlich herein.
  var revealSelector =
    ".section-head, .card, .contact-card, .price-card, .service, .timeline li, .ways li, .use-list li, " +
    ".vsteps li, .stats, .cta-band, .shot, .illu, .pullquote, .faq-list, .page-header-copy > *, [data-reveal]";
  var revealTargets = document.querySelectorAll(revealSelector);
  var prefersReducedMotion = window.matchMedia
    ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
    : false;

  if (revealTargets.length && "IntersectionObserver" in window && !prefersReducedMotion) {
    revealTargets.forEach(function (el, i) {
      var direction = el.getAttribute("data-reveal");
      el.classList.add("reveal");
      if (direction === "left" || direction === "right") {
        el.classList.add("reveal-" + direction);
      }
      el.style.transitionDelay = Math.min(i % 4, 3) * 90 + "ms";
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

  // Reiter (z. B. Plattform-Einblick auf der SmartParts-Seite)
  document.querySelectorAll("[data-tabs]").forEach(function (group) {
    var tabs = Array.prototype.slice.call(group.querySelectorAll('[role="tab"]'));
    if (!tabs.length) {
      return;
    }

    function select(tab, moveFocus) {
      tabs.forEach(function (other) {
        var active = other === tab;
        var panel = document.getElementById(other.getAttribute("aria-controls"));
        other.setAttribute("aria-selected", active ? "true" : "false");
        other.setAttribute("tabindex", active ? "0" : "-1");
        if (panel) {
          panel.hidden = !active;
        }
      });
      if (moveFocus) {
        tab.focus();
      }
      if (tab.scrollIntoView && tab.parentNode.scrollWidth > tab.parentNode.clientWidth) {
        tab.parentNode.scrollTo({ left: tab.offsetLeft - 8, behavior: prefersReducedMotion ? "auto" : "smooth" });
      }
    }

    tabs.forEach(function (tab, index) {
      tab.addEventListener("click", function () {
        select(tab, false);
      });
      tab.addEventListener("keydown", function (event) {
        var next = null;
        if (event.key === "ArrowDown" || event.key === "ArrowRight") {
          next = tabs[(index + 1) % tabs.length];
        } else if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
          next = tabs[(index - 1 + tabs.length) % tabs.length];
        } else if (event.key === "Home") {
          next = tabs[0];
        } else if (event.key === "End") {
          next = tabs[tabs.length - 1];
        }
        if (next) {
          event.preventDefault();
          select(next, true);
        }
      });
    });

    var initial = tabs.filter(function (tab) {
      return tab.getAttribute("aria-selected") === "true";
    })[0] || tabs[0];
    select(initial, false);
  });

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
  // Website noch im Aufbau ist. Erscheint bewusst auf jeder Seite bei
  // jedem Aufruf erneut (kein Merken per sessionStorage mehr).
  (function () {
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
