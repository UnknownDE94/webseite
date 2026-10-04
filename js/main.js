// Werringloer Komponentenmanagement – kleine UI-Helfer (kein Framework, kein Build-Schritt)

document.documentElement.classList.add("js");

document.addEventListener("DOMContentLoaded", function () {
  var reduceMotion = window.matchMedia
    ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
    : false;

  // Hintergrundfilm im Hero: bei reduzierter Bewegung nur das Standbild zeigen.
  // Bei Datensparmodus oder langsamer Mobilverbindung wird der Film gar nicht erst geladen.
  var connection = navigator.connection || {};
  var saveData = connection.saveData === true || /(^|-)2g$/.test(connection.effectiveType || "");
  document.querySelectorAll(".hero-video, .stage-video").forEach(function (video) {
    if (reduceMotion || saveData) {
      video.removeAttribute("autoplay");
      video.pause();
      if (saveData) {
        video.querySelectorAll("source").forEach(function (source) {
          source.remove();
        });
        video.load();
      }
    }
  });

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

  // Kopfzeile: leichter Schatten, sobald gescrollt wird
  var header = document.querySelector(".site-header");
  if (header) {
    var onScroll = function () {
      header.classList.toggle("is-scrolled", window.scrollY > 8);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  // Mobiles Menü umschalten
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
    header.querySelectorAll(".nav-collapse a").forEach(function (link) {
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

  // --- Einblendungen -------------------------------------------------------
  // [data-split]  Überschrift gleitet Wort für Wort aus einer Maske
  // [data-anim]   up | left | right | scale – mit Versatz über [data-stagger]
  // [data-draw]   SVG-Linien zeichnen sich, Knoten erscheinen nacheinander

  document.querySelectorAll("[data-split]").forEach(function (el) {
    var index = 0;
    var walk = function (node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (child) {
        if (child.nodeType === 3) {
          var parts = child.textContent.split(/(\s+)/);
          var frag = document.createDocumentFragment();
          parts.forEach(function (part) {
            if (!part) {
              return;
            }
            if (/^\s+$/.test(part)) {
              frag.appendChild(document.createTextNode(part));
              return;
            }
            var outer = document.createElement("span");
            var inner = document.createElement("span");
            outer.className = "w";
            inner.textContent = part;
            inner.style.setProperty("--w", index++);
            outer.appendChild(inner);
            frag.appendChild(outer);
          });
          node.replaceChild(frag, child);
        } else if (child.nodeType === 1) {
          walk(child);
        }
      });
    };
    walk(el);
  });

  document.querySelectorAll("[data-stagger]").forEach(function (group) {
    var i = 0;
    Array.prototype.slice.call(group.children).forEach(function (child) {
      if (!child.hasAttribute("data-anim")) {
        child.setAttribute("data-anim", group.getAttribute("data-stagger") || "up");
      }
      child.style.setProperty("--i", i++);
    });
  });

  document.querySelectorAll("[data-draw]").forEach(function (group) {
    group.querySelectorAll("path, line").forEach(function (shape) {
      // Ausgeblendete Linien (z. B. mobil per display: none) haben keine Länge
      try {
        shape.style.setProperty("--len", Math.ceil(shape.getTotalLength()) + 2);
      } catch (error) {
        shape.style.setProperty("--len", 0);
      }
    });
    group.querySelectorAll(".hub-node, .hub-core, .flow-pop").forEach(function (node, i) {
      node.style.setProperty("--i", i);
    });
  });

  var targets = document.querySelectorAll("[data-anim], [data-split], [data-draw]");

  if (!("IntersectionObserver" in window) || reduceMotion) {
    targets.forEach(function (el) {
      el.classList.add("in");
    });
  } else {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" }
    );
    targets.forEach(function (el) {
      observer.observe(el);
    });
  }

  // --- Reiter (Plattform-Einblick auf der SmartParts-Seite) ---------------
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
      var strip = tab.parentNode;
      if (strip.scrollWidth > strip.clientWidth) {
        strip.scrollTo({ left: tab.offsetLeft - 8, behavior: reduceMotion ? "auto" : "smooth" });
      }
    }

    tabs.forEach(function (tab, index) {
      tab.addEventListener("click", function () {
        select(tab, false);
      });
      tab.addEventListener("keydown", function (event) {
        var next = null;
        if (event.key === "ArrowRight" || event.key === "ArrowDown") {
          next = tabs[(index + 1) % tabs.length];
        } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
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

  // --- Leistungsbereiche: Reiter mit seitlich gleitenden Bereichen ---------
  document.querySelectorAll("[data-svc]").forEach(function (root) {
    var tabs = Array.prototype.slice.call(root.querySelectorAll('[role="tab"]'));
    var panels = tabs.map(function (tab) {
      return document.getElementById(tab.getAttribute("aria-controls"));
    });
    var viewport = root.querySelector(".svc-viewport");
    var track = root.querySelector(".svc-track");
    var bars = root.querySelectorAll(".svc-progress i");
    var current = 0;
    if (!tabs.length || !viewport || !track) {
      return;
    }

    var fitHeight = function () {
      viewport.style.height = panels[current].offsetHeight + "px";
    };

    var show = function (index, moveFocus) {
      current = (index + panels.length) % panels.length;
      track.style.transform = "translateX(" + current * -100 + "%)";
      tabs.forEach(function (tab, i) {
        var active = i === current;
        tab.setAttribute("aria-selected", active ? "true" : "false");
        tab.setAttribute("tabindex", active ? "0" : "-1");
        panels[i].classList.toggle("is-active", active);
        // Nicht sichtbare Bereiche sind weder fokussierbar noch vorlesbar
        panels[i].inert = !active;
        panels[i].setAttribute("aria-hidden", active ? "false" : "true");
        if (bars[i]) {
          bars[i].classList.toggle("is-active", active);
        }
      });
      fitHeight();
      if (moveFocus) {
        tabs[current].focus();
        tabs[current].scrollIntoView({ block: "nearest", inline: "nearest" });
      }
    };

    tabs.forEach(function (tab, i) {
      tab.addEventListener("click", function () {
        show(i, false);
      });
      tab.addEventListener("keydown", function (event) {
        var step = { ArrowRight: 1, ArrowLeft: -1 }[event.key];
        if (step) {
          event.preventDefault();
          show(current + step, true);
        } else if (event.key === "Home" || event.key === "End") {
          event.preventDefault();
          show(event.key === "Home" ? 0 : panels.length - 1, true);
        }
      });
    });
    root.querySelector(".svc-prev").addEventListener("click", function () {
      show(current - 1, false);
    });
    root.querySelector(".svc-next").addEventListener("click", function () {
      show(current + 1, false);
    });

    // Wischen auf Touch-Geräten
    var startX = null;
    var startY = null;
    viewport.addEventListener("touchstart", function (event) {
      startX = event.touches[0].clientX;
      startY = event.touches[0].clientY;
    }, { passive: true });
    viewport.addEventListener("touchend", function (event) {
      if (startX === null) {
        return;
      }
      var dx = event.changedTouches[0].clientX - startX;
      var dy = event.changedTouches[0].clientY - startY;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
        show(current + (dx < 0 ? 1 : -1), false);
      }
      startX = null;
    }, { passive: true });

    window.addEventListener("resize", fitHeight);
    window.addEventListener("load", fitHeight);
    // Bilder in den Bereichen laden verzögert – danach Höhe neu anpassen
    track.querySelectorAll("img").forEach(function (img) {
      if (!img.complete) {
        img.addEventListener("load", fitHeight);
      }
    });

    // Direktlink auf einen Bereich (z. B. leistungen.html#projekt)
    var fromHash = panels.map(function (panel) {
      return "#" + panel.id;
    }).indexOf(window.location.hash);
    show(fromHash > -1 ? fromHash : 0, false);
    if (fromHash > -1) {
      root.scrollIntoView();
    }
  });

  // --- Bildwechsel auf der dunklen Bühne (SmartParts-Kopf) ----------------
  document.querySelectorAll("[data-thumbs]").forEach(function (group) {
    var target = document.getElementById(group.getAttribute("data-thumbs"));
    var caption = document.getElementById(group.getAttribute("data-thumbs") + "-titel");
    if (!target) {
      return;
    }
    group.querySelectorAll(".thumb").forEach(function (thumb) {
      thumb.addEventListener("click", function () {
        group.querySelectorAll(".thumb").forEach(function (other) {
          other.setAttribute("aria-pressed", other === thumb ? "true" : "false");
        });
        var swap = function () {
          target.src = thumb.getAttribute("data-src");
          target.alt = thumb.getAttribute("data-alt");
          if (caption) {
            caption.textContent = thumb.getAttribute("data-titel");
          }
          target.classList.remove("is-swapping");
        };
        if (reduceMotion) {
          swap();
        } else {
          target.classList.add("is-swapping");
          window.setTimeout(swap, 250);
        }
      });
    });
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

  // --- Parallax & Scroll-Effekte -----------------------------------------------
  // Leichte Parallax auf Hero-Media
  var heroMedia = document.querySelector(".hero-media");
  if (heroMedia) {
    window.addEventListener("scroll", function () {
      var offset = window.scrollY * 0.3;
      heroMedia.style.transform = "translateY(" + offset + "px)";
    }, { passive: true });
  }

  // Glow-Effekt auf .issue-card bei Scroll-In-View
  var issueCards = document.querySelectorAll(".issue-card");
  if ("IntersectionObserver" in window && issueCards.length) {
    var glowObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-glowing");
          } else {
            entry.target.classList.remove("is-glowing");
          }
        });
      },
      { threshold: 0.2 }
    );
    issueCards.forEach(function (card) {
      glowObserver.observe(card);
    });
  }
});
