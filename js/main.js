// Werringloer Komponentenmanagement – UI-Helfer (kein Framework, kein Build-Schritt)
// Theme · Navigation (Dropdowns, mobil als Akkordeon) · Einblendungen · Prozessweg
// · Reiter · App-Showcase · Motivwechsel · Kennzahlen · Rechenbeispiel
// · Lesefortschritt · Kontaktformular

document.documentElement.classList.add("js");

document.addEventListener("DOMContentLoaded", function () {
  "use strict";
  var doc = document.documentElement;
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var each = function (selector, fn, root) {
    Array.prototype.forEach.call((root || document).querySelectorAll(selector), fn);
  };

  // --- Theme (hell/dunkel), seitenübergreifend gespeichert -----------------
  var themeToggle = document.querySelector(".theme-toggle");
  var applyTheme = function (theme) {
    doc.setAttribute("data-theme", theme);
    if (themeToggle) {
      var dark = theme !== "light";
      themeToggle.setAttribute("aria-pressed", dark ? "false" : "true");
      themeToggle.setAttribute("aria-label", dark ? "Hellen Modus aktivieren" : "Dunklen Modus aktivieren");
      var use = themeToggle.querySelector("use");
      if (use) {
        use.setAttribute("href", "assets/icons.svg#" + (dark ? "sun" : "moon"));
      }
    }
  };
  applyTheme(doc.getAttribute("data-theme") === "light" ? "light" : "dark");
  if (themeToggle) {
    themeToggle.addEventListener("click", function () {
      var next = doc.getAttribute("data-theme") === "light" ? "dark" : "light";
      try {
        window.localStorage.setItem("theme", next);
      } catch (error) {
        // Ohne Speicher gilt die Wahl nur für diese Seite.
      }
      applyTheme(next);
    });
  }

  // --- Navigation ----------------------------------------------------------
  var header = document.querySelector(".site-header");
  var navToggle = document.querySelector(".nav-toggle");
  var panels = Array.prototype.slice.call(document.querySelectorAll(".has-panel"));
  var closePanels = function (except) {
    panels.forEach(function (li) {
      if (li !== except) {
        li.classList.remove("is-open");
        li.querySelector("button").setAttribute("aria-expanded", "false");
      }
    });
  };
  panels.forEach(function (li) {
    var button = li.querySelector("button");
    button.addEventListener("click", function () {
      var open = !li.classList.contains("is-open");
      closePanels(li);
      li.classList.toggle("is-open", open);
      button.setAttribute("aria-expanded", open ? "true" : "false");
    });
  });
  document.addEventListener("click", function (event) {
    if (!event.target.closest(".has-panel")) {
      closePanels(null);
    }
  });
  var setMenu = function (open) {
    if (!header || !navToggle) {
      return;
    }
    header.classList.toggle("is-open", open);
    navToggle.setAttribute("aria-expanded", open ? "true" : "false");
    navToggle.setAttribute("aria-label", open ? "Menü schließen" : "Menü öffnen");
  };
  if (navToggle) {
    navToggle.addEventListener("click", function () {
      setMenu(!header.classList.contains("is-open"));
    });
  }
  document.addEventListener("keydown", function (event) {
    if (event.key !== "Escape") {
      return;
    }
    var open = panels.filter(function (li) {
      return li.classList.contains("is-open");
    })[0];
    if (open) {
      closePanels(null);
      open.querySelector("button").focus();
    } else if (header && header.classList.contains("is-open")) {
      setMenu(false);
      navToggle.focus();
    }
  });

  // Lesefortschritt unter der Kopfzeile
  if (header) {
    var progress = document.createElement("span");
    progress.className = "scroll-progress";
    progress.setAttribute("aria-hidden", "true");
    header.appendChild(progress);
    var queued = false;
    var setProgress = function () {
      queued = false;
      var max = doc.scrollHeight - window.innerHeight;
      progress.style.transform = "scaleX(" + (max > 0 ? Math.min(1, window.scrollY / max) : 0) + ")";
    };
    window.addEventListener("scroll", function () {
      if (!queued) {
        queued = true;
        window.requestAnimationFrame(setProgress);
      }
    }, { passive: true });
    window.addEventListener("resize", setProgress);
    setProgress();
  }

  var year = document.getElementById("year");
  if (year) {
    year.textContent = new Date().getFullYear();
  }

  // --- Einblendungen (dezent) ----------------------------------------------
  each("[data-stagger]", function (group) {
    Array.prototype.forEach.call(group.children, function (child, i) {
      if (!child.hasAttribute("data-anim")) {
        child.setAttribute("data-anim", "");
      }
      child.style.setProperty("--i", i);
    });
  });
  each(".process__curve path", function (path) {
    try {
      path.style.setProperty("--len", Math.ceil(path.getTotalLength()) + 2);
    } catch (error) {
      path.style.setProperty("--len", 0);
    }
  });
  var revealTargets = document.querySelectorAll("[data-anim], .process, .showcase-app");
  if (!("IntersectionObserver" in window) || reduceMotion) {
    each("[data-anim], .process, .showcase-app", function (el) {
      el.classList.add("in", "is-in");
    });
  } else {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in", "is-in");
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -6% 0px" });
    Array.prototype.forEach.call(revealTargets, function (el) {
      revealObserver.observe(el);
    });
  }

  // --- Reiter ([data-tabs]) ------------------------------------------------
  each("[data-tabs]", function (group) {
    var tabs = Array.prototype.slice.call(group.querySelectorAll('[role="tab"]'));
    if (!tabs.length) {
      return;
    }
    var motif = document.getElementById(group.getAttribute("data-shape-target") || "");
    var select = function (tab, focus) {
      tabs.forEach(function (other) {
        var active = other === tab;
        var panel = document.getElementById(other.getAttribute("aria-controls"));
        other.setAttribute("aria-selected", active ? "true" : "false");
        other.setAttribute("tabindex", active ? "0" : "-1");
        if (panel) {
          panel.hidden = !active;
        }
      });
      if (focus) {
        tab.focus();
      }
      if (motif && tab.getAttribute("data-shape")) {
        motif.setAttribute("data-shape", tab.getAttribute("data-shape"));
      }
    };
    tabs.forEach(function (tab, index) {
      tab.addEventListener("click", function () {
        select(tab, false);
      });
      tab.addEventListener("keydown", function (event) {
        var step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key];
        var next = null;
        if (step) {
          next = tabs[(index + step + tabs.length) % tabs.length];
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
    select(tabs.filter(function (t) {
      return t.getAttribute("aria-selected") === "true";
    })[0] || tabs[0], false);
  });

  // --- App-Showcase ([data-showcase]) --------------------------------------
  // Geneigtes Produktfenster; Bildschirme wechseln, passende Detailkarten
  // (.callout[data-for="n"]) schweben heraus, die Maus neigt die Bühne leicht.
  each("[data-showcase]", function (box) {
    var screens = Array.prototype.slice.call(box.querySelectorAll(".showcase-app__screen img"));
    var callouts = Array.prototype.slice.call(box.querySelectorAll(".callout"));
    var stage = box.querySelector(".showcase-app__stage");
    var dotsBox = box.querySelector(".showcase-app__dots");
    var current = 0;
    var timer = null;
    var dots = [];
    var show = function (n) {
      current = (n + screens.length) % screens.length;
      screens.forEach(function (img, i) {
        img.classList.toggle("is-active", i === current);
      });
      callouts.forEach(function (c) {
        c.classList.toggle("is-shown", Number(c.getAttribute("data-for") || 0) === current);
      });
      dots.forEach(function (d, i) {
        d.setAttribute("aria-pressed", i === current ? "true" : "false");
      });
    };
    if (dotsBox && screens.length > 1) {
      screens.forEach(function (img, i) {
        var b = document.createElement("button");
        b.type = "button";
        b.setAttribute("aria-label", "Ansicht " + (i + 1) + ": " + (img.getAttribute("alt") || ""));
        b.addEventListener("click", function () {
          stop();
          show(i);
        });
        dotsBox.appendChild(b);
        dots.push(b);
      });
    }
    var stop = function () {
      window.clearInterval(timer);
      timer = null;
    };
    var start = function () {
      if (!timer && !reduceMotion && screens.length > 1) {
        timer = window.setInterval(function () {
          show(current + 1);
        }, 5200);
      }
    };
    show(0);
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) {
          start();
        } else {
          stop();
        }
      }, { threshold: 0.3 }).observe(box);
    }
    var fine = window.matchMedia && window.matchMedia("(pointer: fine)").matches;
    if (stage && fine && !reduceMotion) {
      box.addEventListener("pointermove", function (event) {
        var r = box.getBoundingClientRect();
        var x = (event.clientX - r.left) / r.width - 0.5;
        var y = (event.clientY - r.top) / r.height - 0.5;
        stage.style.transform = "rotateY(" + (-9 + x * 8).toFixed(2) + "deg) rotateX(" + (4 - y * 6).toFixed(2) + "deg)";
      });
      box.addEventListener("pointerleave", function () {
        stage.style.transform = "";
      });
    }
  });

  // --- Motivwechsel im Takt einer Schrittliste ([data-shape-cycle]) ---------
  each("[data-shape-cycle]", function (slot) {
    var shapes = slot.getAttribute("data-shape-cycle").split(/\s+/);
    var list = document.getElementById(slot.getAttribute("data-cycle-steps") || "");
    var steps = list ? Array.prototype.slice.call(list.children) : [];
    var index = 0;
    var timer = null;
    var inView = false;
    var setStep = function (i) {
      index = (i + shapes.length) % shapes.length;
      slot.setAttribute("data-shape", shapes[index]);
      steps.forEach(function (step, n) {
        step.classList.toggle("is-active", n === index);
      });
    };
    var stop = function () {
      window.clearInterval(timer);
      timer = null;
    };
    var start = function () {
      if (!timer && !reduceMotion && inView) {
        timer = window.setInterval(function () {
          setStep(index + 1);
        }, 4200);
      }
    };
    setStep(0);
    steps.forEach(function (step, n) {
      if (n >= shapes.length) {
        return;
      }
      step.addEventListener("mouseenter", function () {
        stop();
        setStep(n);
      });
      step.addEventListener("mouseleave", start);
    });
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        inView = entries[0].isIntersecting;
        if (inView) {
          start();
        } else {
          stop();
        }
      }, { threshold: 0.3 }).observe(list || slot);
    }
  });

  // --- Kennzahlen zählen hoch ([data-count]) -------------------------------
  var counters = document.querySelectorAll("[data-count]");
  if (counters.length && !reduceMotion && "IntersectionObserver" in window) {
    var render = function (el, value) {
      var decimals = Number(el.getAttribute("data-decimals") || 0);
      el.textContent = (el.getAttribute("data-prefix") || "") +
        value.toLocaleString("de-DE", { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) +
        (el.getAttribute("data-suffix") || "");
    };
    var countObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) {
          return;
        }
        countObserver.unobserve(entry.target);
        var el = entry.target;
        var end = parseFloat(el.getAttribute("data-count")) || 0;
        var t0 = null;
        var step = function (now) {
          t0 = t0 === null ? now : t0;
          var t = Math.min(1, (now - t0) / 1600);
          render(el, t >= 1 ? end : end * (1 - Math.pow(2, -10 * t)));
          if (t < 1) {
            window.requestAnimationFrame(step);
          }
        };
        window.requestAnimationFrame(step);
      });
    }, { threshold: 0.6 });
    Array.prototype.forEach.call(counters, function (el) {
      el.style.minWidth = el.offsetWidth + "px";
      render(el, 0);
      countObserver.observe(el);
    });
  }

  // --- Rechenbeispiel: freiwerdendes Kapital (#kapitalrechner) --------------
  var calc = document.getElementById("kapitalrechner");
  if (calc) {
    var euro = function (value) {
      return Math.round(value).toLocaleString("de-DE") + " €";
    };
    var $ = function (id) {
      return document.getElementById(id);
    };
    var lager = $("calc-lager");
    var lagerValue = function () {
      var min = parseFloat(lager.getAttribute("data-log-min"));
      var max = parseFloat(lager.getAttribute("data-log-max"));
      var raw = min * Math.pow(max / min, lager.value / 100);
      var unit = raw >= 1000000 ? 100000 : raw >= 100000 ? 10000 : 1000;
      return Math.round(raw / unit) * unit;
    };
    var update = function () {
      var value = lagerValue();
      var ruhend = $("calc-ruhend").value / 100;
      var abbau = $("calc-abbau").value / 100;
      var kosten = $("calc-kosten").value / 100;
      var frei = value * ruhend * abbau;
      $("calc-lager-out").textContent = euro(value);
      lager.setAttribute("aria-valuetext", euro(value));
      [["calc-ruhend", ruhend], ["calc-abbau", abbau], ["calc-kosten", kosten]].forEach(function (pair) {
        var text = Math.round(pair[1] * 100) + " %";
        $(pair[0] + "-out").textContent = text;
        $(pair[0]).setAttribute("aria-valuetext", text);
      });
      $("calc-frei").textContent = euro(frei);
      $("calc-jahr").textContent = euro(frei * kosten);
      $("calc-bar-after").style.setProperty("--w", (1 - ruhend * abbau).toFixed(3));
    };
    calc.addEventListener("input", update);
    calc.addEventListener("submit", function (event) {
      event.preventDefault();
    });
    update();
  }

  // --- Kontaktformular (#contact-form) --------------------------------------
  // Sendet an den Formulardienst und leitet auf danke.html weiter. Der Dienst
  // liefert keine CORS-Antwort ("no-cors"): nur Netzwerkfehler sind erkennbar.
  // Ohne JavaScript greift das normale POST des Formulars.
  var form = document.getElementById("contact-form");
  if (form && window.fetch) {
    var status = document.getElementById("form-status");
    var button = form.querySelector('button[type="submit"]');
    var say = function (text, kind) {
      status.textContent = text;
      status.className = "form-status is-visible " + kind;
    };
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var missing = Array.prototype.filter.call(form.querySelectorAll("[required]"), function (field) {
        return !field.value.trim() || !field.checkValidity();
      });
      if (missing.length) {
        say("Bitte füllen Sie die markierten Pflichtfelder aus (" + missing.map(function (f) {
          var label = form.querySelector('label[for="' + f.id + '"]');
          return label ? label.textContent.replace("*", "").trim() : f.name;
        }).join(", ") + ").", "error");
        missing[0].focus();
        return;
      }
      button.disabled = true;
      say("Ihre Anfrage wird gesendet …", "pending");
      fetch(form.action, { method: "POST", body: new FormData(form), mode: "no-cors" })
        .then(function () {
          window.dispatchEvent(new CustomEvent("wave:burst"));
          window.setTimeout(function () {
            window.location.href = "danke.html";
          }, reduceMotion ? 0 : 900);
        })
        .catch(function () {
          button.disabled = false;
          say("Die Anfrage konnte gerade nicht gesendet werden. Bitte versuchen Sie es erneut oder schreiben Sie an service@werringloer.de (+49 160 277 65 12).", "error");
        });
    });
  }
});
