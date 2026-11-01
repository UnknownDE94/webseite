// Werringloer Komponentenmanagement – Partikelwelle (seitenweiter Hintergrund)
// Ein einziges, fest stehendes WebGL-Canvas hinter allen Inhalten. Die Welle
// wechselt ihren Zustand je nach Abschnitt im Blick:
//   <section data-wave="hero|calm|flow|grid|surge|flat">
// Ohne Angabe: erster Abschnitt = hero, CTA = surge, Footer = flat, sonst calm.
// Kein Framework, keine Abhängigkeiten. Ohne WebGL bleibt der CSS-Hintergrund.

(function () {
  "use strict";

  var doc = document.documentElement;
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // amp: Wellenhöhe · freq: Wellendichte · speed: Tempo · pitch: Blickwinkel
  // lift: Lage auf dem Bildschirm (−1 unten … 1 oben) · alpha: Sichtbarkeit
  // spread: Abstand der Punkte · glow: Anteil Limette in den Wellenkämmen
  // shift: seitlicher Versatz (Bildschirmbreiten/2), hält die Textspalte frei
  var PRESETS = {
    hero:  { amp: 1.00, freq: 0.85, speed: 0.55, pitch: 0.34, lift: -0.36, alpha: 1.00, spread: 1.00, glow: 1.00, shift: 0.30 },
    calm:  { amp: 0.42, freq: 0.70, speed: 0.30, pitch: 0.26, lift: -0.62, alpha: 0.65, spread: 1.00, glow: 0.45, shift: 0.00 },
    flow:  { amp: 0.70, freq: 1.25, speed: 0.80, pitch: 0.30, lift: -0.55, alpha: 0.70, spread: 1.00, glow: 0.70, shift: 0.00 },
    grid:  { amp: 0.14, freq: 0.55, speed: 0.22, pitch: 0.95, lift: -0.10, alpha: 0.40, spread: 0.85, glow: 0.30, shift: 0.00 },
    surge: { amp: 1.30, freq: 1.00, speed: 0.95, pitch: 0.38, lift: -0.40, alpha: 0.95, spread: 1.05, glow: 1.15, shift: 0.35 },
    flat:  { amp: 0.20, freq: 0.60, speed: 0.20, pitch: 0.20, lift: -0.80, alpha: 0.40, spread: 1.00, glow: 0.30, shift: 0.00 }
  };
  var KEYS = ["amp", "freq", "speed", "pitch", "lift", "alpha", "spread", "glow", "shift"];

  var THEMES = {
    dark:  { base: [0.11, 0.42, 0.26], crest: [0.83, 0.93, 0.37], strength: 1.0 },
    light: { base: [0.05, 0.23, 0.14], crest: [0.36, 0.52, 0.10], strength: 0.75 }
  };

  var VERT = [
    "attribute vec2 aGrid;",
    "uniform float uTime, uAmp, uFreq, uPitch, uLift, uShift, uSpread, uAspect, uSize, uScroll;",
    "uniform vec3 uMouse;",
    "varying float vH;",
    "varying float vFade;",
    "float wave(vec2 p, float t) {",
    "  return sin(p.x * uFreq * 0.55 + t) * 0.55",
    "       + sin(p.y * uFreq * 0.90 + t * 1.30) * 0.35",
    "       + sin((p.x + p.y) * uFreq * 0.32 - t * 0.70) * 0.55",
    "       + sin(length(p - vec2(-4.0, 2.0)) * uFreq * 0.75 - t * 1.10) * 0.25;",
    "}",
    "vec4 project(vec3 p) {",
    "  float c = cos(uPitch), s = sin(uPitch);",
    "  vec3 q = vec3(p.x, p.y * c - p.z * s, p.y * s + p.z * c);",
    "  q.z -= 9.0;",
    "  float f = 1.75;",
    "  return vec4(q.x * f / uAspect + uShift * -q.z, q.y * f + uLift * -q.z, 0.0, -q.z);",
    "}",
    "void main() {",
    "  float t = uTime;",
    "  vec2 p = vec2(aGrid.x * 13.0 * uSpread, aGrid.y * 7.5 * uSpread);",
    "  vec2 pw = vec2(p.x, p.y + uScroll);",
    "  float h = wave(pw, t) * uAmp;",
    // Maus: weiche Erhebung um die Zeigerposition (in Bildschirmkoordinaten)
    "  vec4 c0 = project(vec3(p.x, h, p.y));",
    "  vec2 ndc = c0.xy / c0.w;",
    "  vec2 dm = (ndc - uMouse.xy) * vec2(uAspect, 1.0);",
    "  h += uMouse.z * exp(-dot(dm, dm) * 6.0) * 0.9;",
    "  vec4 clip = project(vec3(p.x, h, p.y));",
    "  gl_Position = clip;",
    "  float depth = clip.w;",
    "  gl_PointSize = clamp(uSize * 9.0 / depth, 1.0, 6.0 * uSize);",
    "  vH = clamp(h / max(uAmp, 0.2) * 0.5 + 0.5, 0.0, 1.0);",
    // Ränder des Feldes und große Entfernung weich ausblenden
    "  float edge = smoothstep(1.0, 0.72, abs(aGrid.x)) * smoothstep(1.0, 0.55, abs(aGrid.y));",
    "  vFade = edge * smoothstep(19.0, 8.0, depth);",
    "}"
  ].join("\n");

  var FRAG = [
    "precision mediump float;",
    "uniform vec3 uBase, uCrest;",
    "uniform float uAlpha, uGlow;",
    "varying float vH;",
    "varying float vFade;",
    "void main() {",
    "  float d = length(gl_PointCoord - 0.5);",
    "  float a = smoothstep(0.5, 0.12, d);",
    "  float k = smoothstep(0.35, 1.0, vH) * uGlow;",
    "  vec3 col = mix(uBase, uCrest, clamp(k, 0.0, 1.0));",
    "  float alpha = a * vFade * uAlpha * (0.35 + 0.65 * vH);",
    "  gl_FragColor = vec4(col * alpha, alpha);",
    "}"
  ].join("\n");

  function init() {
    var canvas = document.createElement("canvas");
    canvas.className = "wave-canvas";
    canvas.setAttribute("aria-hidden", "true");

    var gl = null;
    try {
      gl = canvas.getContext("webgl", { alpha: true, antialias: false, premultipliedAlpha: true, powerPreference: "low-power" });
    } catch (error) {
      gl = null;
    }
    if (!gl) {
      return;
    }

    function shader(type, source) {
      var s = gl.createShader(type);
      gl.shaderSource(s, source);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        return null;
      }
      return s;
    }
    var vs = shader(gl.VERTEX_SHADER, VERT);
    var fs = shader(gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) {
      return;
    }
    var program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      return;
    }
    gl.useProgram(program);

    document.body.insertBefore(canvas, document.body.firstChild);
    doc.classList.add("has-wave");

    // Punktraster: auf kleinen Bildschirmen weniger Punkte
    var small = Math.min(window.innerWidth, window.innerHeight) < 700;
    var cols = small ? 120 : 200;
    var rows = small ? 70 : 110;
    var grid = new Float32Array(cols * rows * 2);
    var n = 0;
    for (var y = 0; y < rows; y++) {
      for (var x = 0; x < cols; x++) {
        grid[n++] = (x / (cols - 1)) * 2 - 1;
        grid[n++] = (y / (rows - 1)) * 2 - 1;
      }
    }
    var buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, grid, gl.STATIC_DRAW);
    var aGrid = gl.getAttribLocation(program, "aGrid");
    gl.enableVertexAttribArray(aGrid);
    gl.vertexAttribPointer(aGrid, 2, gl.FLOAT, false, 0, 0);

    var u = {};
    ["uTime", "uAmp", "uFreq", "uPitch", "uLift", "uShift", "uSpread", "uAspect", "uSize", "uScroll", "uMouse", "uBase", "uCrest", "uAlpha", "uGlow"].forEach(function (name) {
      u[name] = gl.getUniformLocation(program, name);
    });

    gl.disable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.clearColor(0, 0, 0, 0);

    var dpr = 1;
    var shiftScale = 1;
    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, small ? 1.5 : 1.75);
      var w = Math.round(window.innerWidth * dpr);
      var h = Math.round(window.innerHeight * dpr);
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      gl.viewport(0, 0, w, h);
      gl.uniform1f(u.uAspect, window.innerWidth / window.innerHeight);
      // Schmale Bildschirme: Text steht über die volle Breite, Welle mittig lassen
      shiftScale = window.innerWidth < 960 ? 0 : 1;
      gl.uniform1f(u.uSize, (small ? 2.0 : 2.3) * dpr);
      requestDraw();
    }

    // --- Zustand je Abschnitt ------------------------------------------------
    var current = {};
    KEYS.forEach(function (key) {
      current[key] = PRESETS.hero[key];
    });
    var target = PRESETS.hero;

    var zones = [];
    function collectZones() {
      zones = [];
      var main = document.querySelector("main");
      if (main) {
        Array.prototype.forEach.call(main.children, function (el, i) {
          var name = el.getAttribute("data-wave");
          if (!name) {
            if (i === 0) {
              name = "hero";
            } else if (el.querySelector(".cta-band")) {
              name = "surge";
            } else {
              name = "calm";
            }
          }
          zones.push({ el: el, name: name });
        });
      }
      var footer = document.querySelector(".site-footer");
      if (footer) {
        zones.push({ el: footer, name: footer.getAttribute("data-wave") || "flat" });
      }
    }

    function pickZone() {
      var mid = window.innerHeight * 0.5;
      var chosen = null;
      for (var i = 0; i < zones.length; i++) {
        var r = zones[i].el.getBoundingClientRect();
        if (r.top <= mid && r.bottom > mid) {
          chosen = zones[i];
          break;
        }
      }
      // Ganz unten angekommen: Footer zählt, auch wenn er kürzer als halbe Höhe ist
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4 && zones.length) {
        chosen = zones[zones.length - 1];
      }
      var preset = chosen && PRESETS[chosen.name] ? PRESETS[chosen.name] : null;
      if (preset && preset !== target) {
        target = preset;
        doc.setAttribute("data-wave-state", chosen.name);
        requestDraw();
      }
    }

    // --- Farben passend zum Theme -------------------------------------------
    var strength = 1;
    function applyTheme() {
      var theme = doc.getAttribute("data-theme") === "light" ? THEMES.light : THEMES.dark;
      gl.uniform3fv(u.uBase, theme.base);
      gl.uniform3fv(u.uCrest, theme.crest);
      strength = theme.strength;
      requestDraw();
    }
    if ("MutationObserver" in window) {
      new MutationObserver(applyTheme).observe(doc, { attributes: true, attributeFilter: ["data-theme"] });
    }

    // --- Maus ----------------------------------------------------------------
    var mouse = { x: 0, y: -2, z: 0, tz: 0 };
    var finePointer = window.matchMedia && window.matchMedia("(pointer: fine)").matches;
    if (finePointer && !reduceMotion) {
      window.addEventListener("pointermove", function (event) {
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -((event.clientY / window.innerHeight) * 2 - 1);
        mouse.tz = 1;
        requestDraw();
      }, { passive: true });
      document.addEventListener("pointerleave", function () {
        mouse.tz = 0;
      });
    }

    // --- Zeichnen ------------------------------------------------------------
    var time = 7.0;
    var last = 0;
    var running = false;
    var visible = true;

    function draw(now) {
      var dt = last ? Math.min((now - last) / 1000, 0.05) : 0.016;
      last = now;
      var k = reduceMotion ? 1 : Math.min(1, dt * 2.2);
      var settled = true;
      KEYS.forEach(function (key) {
        var diff = target[key] - current[key];
        if (Math.abs(diff) > 0.0005) {
          settled = false;
        }
        current[key] += diff * k;
      });
      mouse.z += (mouse.tz - mouse.z) * Math.min(1, dt * 3);

      if (!reduceMotion) {
        time += dt * current.speed;
      }
      gl.uniform1f(u.uTime, time);
      gl.uniform1f(u.uAmp, current.amp);
      gl.uniform1f(u.uFreq, current.freq);
      gl.uniform1f(u.uPitch, current.pitch);
      gl.uniform1f(u.uLift, current.lift);
      gl.uniform1f(u.uShift, current.shift * shiftScale);
      gl.uniform1f(u.uSpread, current.spread);
      gl.uniform1f(u.uAlpha, current.alpha * strength);
      gl.uniform1f(u.uGlow, current.glow);
      gl.uniform1f(u.uScroll, reduceMotion ? 0 : window.scrollY * -0.0025);
      gl.uniform3f(u.uMouse, mouse.x, mouse.y, mouse.z);

      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.POINTS, 0, cols * rows);

      // Bei reduzierter Bewegung nur zeichnen, bis der Zustand erreicht ist
      if (visible && (!reduceMotion || !settled)) {
        window.requestAnimationFrame(draw);
      } else {
        running = false;
        last = 0;
      }
    }

    function requestDraw() {
      if (!running && visible) {
        running = true;
        window.requestAnimationFrame(draw);
      }
    }

    document.addEventListener("visibilitychange", function () {
      visible = document.visibilityState === "visible";
      if (visible) {
        requestDraw();
      }
    });

    var scrollQueued = false;
    window.addEventListener("scroll", function () {
      if (scrollQueued) {
        return;
      }
      scrollQueued = true;
      window.requestAnimationFrame(function () {
        scrollQueued = false;
        pickZone();
        requestDraw();
      });
    }, { passive: true });
    window.addEventListener("resize", function () {
      resize();
      pickZone();
    });

    collectZones();
    applyTheme();
    resize();
    pickZone();
    KEYS.forEach(function (key) {
      current[key] = target[key];
    });
    requestDraw();
    window.requestAnimationFrame(function () {
      doc.classList.add("wave-ready");
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
