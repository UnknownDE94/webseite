// Werringloer Komponentenmanagement – Partikelwelle (seitenweiter Hintergrund)
// Ein einziges, fest stehendes WebGL-Canvas hinter allen Inhalten.
//
// 1) Zustand je Abschnitt:  <section data-wave="hero|calm|flow|grid|pulse|surge|flat">
//    Ohne Angabe: erster Abschnitt = hero, CTA = surge, Footer = flat, sonst calm.
// 2) Formen: Ein leeres Element mit data-shape="logo" ist ein Platzhalter.
//    Steht es mittig im Bild, löst sich ein Teil der Punkte aus der Welle und formt
//    das Motiv genau an dieser Stelle; beim Weiterscrollen fließen sie zurück.
//    Wird data-shape geändert (z. B. von js/main.js), zerfällt das Motiv und das
//    neue bildet sich. data-shapes="a b c" lädt Motive vorab, data-scatter (0…1)
//    bestimmt, wie stark die Maus die Punkte auseinandertreibt.
// 3) Ereignis "wave:burst" auf window: einmaliger kräftiger Signalimpuls.
// 4) Barrierefreie Ansicht: html[data-a11y="on"] (Schalter im Header) blendet
//    Welle und Motive aus und hält die Animation an.
//
// Kein Framework, keine Abhängigkeiten. Ohne WebGL bleibt der CSS-Hintergrund.

(function () {
  "use strict";

  var doc = document.documentElement;
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // amp: Wellenhöhe · freq: Wellendichte · speed: Tempo · pitch: Blickwinkel
  // lift: Lage auf dem Bildschirm (−1 unten … 1 oben) · alpha: Sichtbarkeit
  // spread: Abstand der Punkte · glow: Anteil Limette in den Wellenkämmen
  // shift: seitlicher Versatz (Bildschirmbreiten/2), hält die Textspalte frei
  // ripple: konzentrische Ringe wie ein Signal (0 = aus)
  var PRESETS = {
    hero:  { amp: 1.00, freq: 0.85, speed: 0.55, pitch: 0.34, lift: -0.36, alpha: 1.00, spread: 1.00, glow: 1.00, shift: 0.30 },
    calm:  { amp: 0.42, freq: 0.70, speed: 0.30, pitch: 0.26, lift: -0.62, alpha: 0.65, spread: 1.00, glow: 0.45, shift: 0.00 },
    flow:  { amp: 0.70, freq: 1.05, speed: 0.60, pitch: 0.30, lift: -0.55, alpha: 0.70, spread: 1.00, glow: 0.70, shift: 0.00 },
    grid:  { amp: 0.35, freq: 0.65, speed: 0.28, pitch: 0.40, lift: -0.50, alpha: 0.55, spread: 1.00, glow: 0.45, shift: 0.00 },
    surge: { amp: 1.20, freq: 0.95, speed: 0.75, pitch: 0.36, lift: -0.40, alpha: 0.90, spread: 1.05, glow: 1.05, shift: 0.30 },
    flat:  { amp: 0.20, freq: 0.60, speed: 0.20, pitch: 0.20, lift: -0.80, alpha: 0.40, spread: 1.00, glow: 0.30, shift: 0.00 }
  };
  // Ältere Zustandsnamen zeigen auf die normale Welle (keine Sonderformen mehr)
  PRESETS.pulse = PRESETS.calm;
  PRESETS.orbit = PRESETS.calm;
  PRESETS.dunes = PRESETS.calm;
  PRESETS.ribbon = PRESETS.flow;
  PRESETS.tunnel = PRESETS.flow;
  PRESETS.vortex = PRESETS.flow;
  var KEYS = ["amp", "freq", "speed", "pitch", "lift", "alpha", "spread", "glow", "shift"];

  // silver: Farbe der hellen Formanteile (Logo-Silber, Linien)
  // green: Markengrün des Logos (nicht Limette)
  var THEMES = {
    dark:  { base: [0.11, 0.42, 0.26], crest: [0.83, 0.93, 0.37], silver: [0.90, 0.92, 0.91], green: [0.17, 0.55, 0.33], strength: 1.0 },
    light: { base: [0.05, 0.23, 0.14], crest: [0.36, 0.52, 0.10], silver: [0.22, 0.25, 0.24], green: [0.06, 0.34, 0.19], strength: 0.75 }
  };

  // Anteil der Punkte, die eine Form bilden (der Rest bleibt als leise Welle)
  var SHAPE_SHARE = 0.38;

  var VERT = [
    "attribute vec2 aGrid;",
    "attribute vec4 aShape;", // x, y (−0.5…0.5), Gewicht (0/1), Ton (0 Limette, 1.x Silber, 2.x Grün; x = Helligkeit)
    "uniform float uTime, uAmp, uFreq, uPitch, uLift, uShift, uSpread, uAspect, uSize, uScroll, uRipple, uMorph;",
    "uniform vec3 uMouse;",
    "uniform vec4 uBox;", // Mitte (NDC) und Größe (NDC) der aktuellen Form
    "uniform float uScatter;",
    "varying float vH;",
    "varying float vFade;",
    "varying float vMorph;",
    "varying float vTone;",
    "float wave(vec2 p, float t) {",
    "  float h = sin(p.x * uFreq * 0.55 + t) * 0.55",
    "          + sin(p.y * uFreq * 0.90 + t * 1.30) * 0.35",
    "          + sin((p.x + p.y) * uFreq * 0.32 - t * 0.70) * 0.55",
    "          + sin(length(p - vec2(-4.0, 2.0)) * uFreq * 0.75 - t * 1.10) * 0.25;",
    "  return h;",
    "}",
    // Signal: Ringe laufen von einem Punkt rechts der Mitte nach außen
    "float ripple(vec2 p, float t) {",
    "  float r = length(p - vec2(3.0, 0.5));",
    "  return sin(r * 1.5 - t * 2.6) * 0.75 * exp(-r * 0.09);",
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
    "  if (uRipple > 0.001) { h += uRipple * ripple(p, t); }",
    // Maus: weiche Erhebung um die Zeigerposition (in Bildschirmkoordinaten)
    "  vec4 c0 = project(vec3(p.x, h, p.y));",
    "  vec2 dm = (c0.xy / c0.w - uMouse.xy) * vec2(uAspect, 1.0);",
    "  h += uMouse.z * exp(-dot(dm, dm) * 6.0) * 0.9;",
    "  vec3 world = vec3(p.x, h, p.y);",
    "  vec4 clip = project(world);",
    "  float depth = max(clip.w, 0.001);",
    "  float edge = smoothstep(1.0, 0.72, abs(aGrid.x)) * smoothstep(1.0, 0.55, abs(aGrid.y));",
    "  float waveFade = edge * smoothstep(19.0, 8.0, depth) * step(0.2, clip.w);",
    // Form: jeder Punkt startet leicht versetzt, damit sich das Motiv aufbaut
    "  float r = fract(sin(dot(aGrid, vec2(12.9898, 78.233))) * 43758.5453);",
    "  float m = clamp(uMorph * 2.2 - r * 1.2, 0.0, 1.0) * aShape.z;",
    "  m = m * m * (3.0 - 2.0 * m);",
    "  vec2 wob = vec2(sin(t * 1.3 + r * 6.283), cos(t * 1.1 + r * 6.283)) * 0.0035;",
    "  vec2 target = uBox.xy + aShape.xy * uBox.zw + wob;",
    // Maus treibt die Punkte der Form auseinander
    "  vec2 dv = (target - uMouse.xy) * vec2(uAspect, 1.0);",
    "  float dd = length(dv) + 0.0001;",
    "  target += (dv / dd) / vec2(uAspect, 1.0) * uScatter * uMouse.z * 0.09 * exp(-dd * dd * 45.0);",
    "  vec2 ndc = mix(clip.xy / depth, target, m);",
    "  gl_Position = vec4(ndc, 0.0, 1.0);",
    "  gl_PointSize = mix(clamp(uSize * 9.0 / depth, 1.0, 3.5 * uSize), uSize * 1.25, m);",
    "  vH = clamp(h / max(uAmp + uRipple * 0.75, 0.2) * 0.5 + 0.5, 0.0, 1.0);",
    // Punkte ohne Formaufgabe treten zurück, solange eine Form steht
    "  vFade = mix(waveFade, 1.0, m) * mix(1.0, 0.3, uMorph * (1.0 - aShape.z));",
    "  vMorph = m;",
    "  vTone = aShape.w;",
    "}"
  ].join("\n");

  var FRAG = [
    "precision mediump float;",
    "uniform vec3 uBase, uCrest, uSilver, uGreen;",
    "uniform float uAlpha, uGlow, uShapeAlpha;",
    "varying float vH;",
    "varying float vFade;",
    "varying float vMorph;",
    "varying float vTone;",
    "void main() {",
    "  float d = length(gl_PointCoord - 0.5);",
    "  float a = smoothstep(0.5, 0.12, d);",
    "  float k = smoothstep(0.35, 1.0, vH) * uGlow;",
    "  vec3 waveCol = mix(uBase, uCrest, clamp(k, 0.0, 1.0));",
    "  float kind = floor(vTone + 0.001);",
    "  float lum = fract(vTone);",
    "  vec3 shapeCol = kind < 0.5 ? uCrest : (kind < 1.5 ? uSilver * (0.4 + 0.75 * lum) : uGreen * (0.75 + 1.1 * lum));",
    "  vec3 col = mix(waveCol, shapeCol, vMorph);",
    "  float alpha = a * vFade * mix(uAlpha * (0.35 + 0.65 * vH), uShapeAlpha, vMorph);",
    "  gl_FragColor = vec4(col * alpha, alpha);",
    "}"
  ].join("\n");

  // --- Formen: auf ein verstecktes 2D-Canvas zeichnen und Pixel abtasten ------
  // Grün (#00ff00) ergibt Limette, Weiß ergibt Silber.
  var SHAPES = {
    // Bildmarke aus dem Logo; Grün wird Limette, Silber bleibt Silber
    logo: function (done) {
      var img = new Image();
      img.onload = function () {
        var w = 400;
        var h = Math.round((img.naturalHeight / img.naturalWidth) * w);
        var c = canvas2d(w, h);
        var g = c.getContext("2d");
        g.drawImage(img, 0, 0, w, h);
        done(sample(g, w, h, true));
      };
      img.src = "assets/logo-mark-lg.webp";
    }
  };

  function canvas2d(w, h) {
    var c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    return c;
  }

  // Liefert gefüllte Pixel als [x, y, Ton] (x/y in −0.5…0.5) plus Seitenverhältnis
  function sample(g, w, h, fromImage) {
    var data;
    try {
      data = g.getImageData(0, 0, w, h).data;
    } catch (error) {
      return null;
    }
    var pts = [];
    var step = 2;
    for (var y = 0; y < h; y += step) {
      for (var x = 0; x < w; x += step) {
        var i = (y * w + x) * 4;
        if (data[i + 3] < 128) {
          continue;
        }
        var tone;
        if (fromImage) {
          // Logo: Grünanteile (G deutlich über R und B) bleiben Markengrün,
          // alles Graue wird Silber; die Helligkeit bleibt als Abstufung erhalten.
          var rr = data[i], gg = data[i + 1], bb = data[i + 2];
          var mx = Math.max(rr, gg, bb);
          if (mx < 22) {
            continue; // Schatten/Kontur nicht als Punkte setzen
          }
          var lum = Math.min(0.99, mx / 255);
          tone = gg - Math.max(rr, bb) > 10 ? 2 + lum : 1 + lum;
        } else {
          tone = data[i] > 128 ? 1.95 : 0;
        }
        pts.push(x / w - 0.5, 0.5 - y / h, tone);
      }
    }
    return pts.length ? { pts: pts, aspect: w / h, step: step / w } : null;
  }

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
    // Punktraster: genug für eine dichte Fläche, aber schonend für schwache Grafik
    var cols = small ? 100 : 160;
    var rows = small ? 56 : 90;
    var count = cols * rows;
    var grid = new Float32Array(count * 2);
    var n = 0;
    for (var y = 0; y < rows; y++) {
      for (var x = 0; x < cols; x++) {
        grid[n++] = (x / (cols - 1)) * 2 - 1;
        grid[n++] = (y / (rows - 1)) * 2 - 1;
      }
    }
    var gridBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, gridBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, grid, gl.STATIC_DRAW);
    var aGrid = gl.getAttribLocation(program, "aGrid");
    gl.enableVertexAttribArray(aGrid);
    gl.vertexAttribPointer(aGrid, 2, gl.FLOAT, false, 0, 0);

    var aShape = gl.getAttribLocation(program, "aShape");
    gl.enableVertexAttribArray(aShape);
    function bindShape(buffer) {
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.vertexAttribPointer(aShape, 4, gl.FLOAT, false, 0, 0);
    }
    // Ohne Form: alle Gewichte 0
    var emptyBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, emptyBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(count * 4), gl.STATIC_DRAW);
    bindShape(emptyBuffer);

    var u = {};
    ["uTime", "uAmp", "uFreq", "uPitch", "uLift", "uShift", "uSpread", "uAspect", "uSize", "uScroll", "uRipple", "uMorph", "uScatter", "uGreen",
      "uMouse", "uBox", "uBase", "uCrest", "uSilver", "uAlpha", "uGlow", "uShapeAlpha"].forEach(function (name) {
      u[name] = gl.getUniformLocation(program, name);
    });

    gl.disable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.clearColor(0, 0, 0, 0);

    var dpr = 1;
    var shiftScale = 1;
    // Renderqualität (Anteil der Pixeldichte); sinkt automatisch, wenn Bilder zu lange dauern
    var quality = (navigator.hardwareConcurrency || 8) <= 4 || (navigator.deviceMemory || 8) <= 4 ? 0.75 : 1;
    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, small ? 1.25 : 1.5) * quality;
      var w = Math.round(window.innerWidth * dpr);
      var h = Math.round(window.innerHeight * dpr);
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      gl.viewport(0, 0, w, h);
      gl.uniform1f(u.uAspect, window.innerWidth / window.innerHeight);
      gl.uniform1f(u.uSize, (small ? 2.0 : 2.3) * dpr);
      // Schmale Bildschirme: Text steht über die volle Breite, Welle mittig lassen
      shiftScale = window.innerWidth < 960 ? 0 : 1;
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

    // --- Formen --------------------------------------------------------------
    var shapeBuffers = {};
    // Nur Platzhalter, keine Bedienelemente mit data-shape (z. B. Reiter)
    var slots = Array.prototype.slice.call(document.querySelectorAll(".wave-slot[data-shape], .cta-visual[data-shape]")).filter(function (el) {
      return SHAPES[el.getAttribute("data-shape")];
    });
    var activeShape = null;
    var activeSlot = null;
    var morph = 0;

    function buildShape(name) {
      if (shapeBuffers[name] !== undefined) {
        return;
      }
      shapeBuffers[name] = null;
      SHAPES[name](function (result) {
        if (!result) {
          return;
        }
        var data = new Float32Array(count * 4);
        var pts = result.pts;
        var total = pts.length / 3;
        // Punkte gleichmäßig über die Form verteilen (gemischte Reihenfolge)
        var order = [];
        for (var i = 0; i < total; i++) {
          order.push(i);
        }
        for (var j = order.length - 1; j > 0; j--) {
          var k = Math.floor(Math.random() * (j + 1));
          var tmp = order[j];
          order[j] = order[k];
          order[k] = tmp;
        }
        var used = 0;
        var jitter = result.step * 0.5;
        for (var p = 0; p < count; p++) {
          if (Math.random() > SHAPE_SHARE) {
            continue;
          }
          var o = order[used++ % total] * 3;
          data[p * 4] = pts[o] + (Math.random() - 0.5) * jitter;
          data[p * 4 + 1] = pts[o + 1] + (Math.random() - 0.5) * jitter * result.aspect;
          data[p * 4 + 2] = 1;
          data[p * 4 + 3] = pts[o + 2];
        }
        var buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
        shapeBuffers[name] = { buffer: buffer, aspect: result.aspect };
        if (activeShape) {
          bindShape(shapeBuffers[activeShape] ? shapeBuffers[activeShape].buffer : emptyBuffer);
        }
        doc.classList.add("shape-" + name + "-ready");
        requestDraw();
      });
    }
    slots.forEach(function (slot) {
      var names = [slot.getAttribute("data-shape")]
        .concat((slot.getAttribute("data-shapes") || "").split(/\s+/))
        .concat((slot.getAttribute("data-shape-cycle") || "").split(/\s+/));
      names.forEach(function (name) {
        if (name && SHAPES[name]) {
          buildShape(name);
        }
      });
    });
    // Motivwechsel von außen: neu zeichnen (wichtig bei reduzierter Bewegung)
    if ("MutationObserver" in window && slots.length) {
      var shapeObserver = new MutationObserver(function () {
        requestDraw();
      });
      slots.forEach(function (slot) {
        shapeObserver.observe(slot, { attributes: true, attributeFilter: ["data-shape"] });
      });
    }

    // Signalimpuls, z. B. beim Absenden des Kontaktformulars
    var burst = 0;
    window.addEventListener("wave:burst", function () {
      burst = 1;
      requestDraw();
    });

    // Welcher Platzhalter steht am nächsten an der Bildmitte – und wie stark?
    // Positionen der Platzhalter zwischenspeichern: nur beim Scrollen, bei
    // Größenänderung und gelegentlich neu messen – nicht in jedem Bild
    var rects = new Map();
    var rectAge = 0;
    function measureSlots() {
      rectAge = 0;
      slots.forEach(function (slot) {
        rects.set(slot, slot.getBoundingClientRect());
      });
    }
    function rectOf(slot) {
      return rects.get(slot) || slot.getBoundingClientRect();
    }

    function nearestSlot() {
      var vh = window.innerHeight;
      var best = null;
      var bestStrength = 0;
      slots.forEach(function (slot) {
        var r = rectOf(slot);
        if (r.width < 40 || r.height < 40) {
          return;
        }
        var dist = Math.abs(r.top + r.height / 2 - vh / 2) / vh;
        var strength = 1 - Math.min(1, Math.max(0, (dist - 0.22) / 0.45));
        if (strength > bestStrength) {
          bestStrength = strength;
          best = slot;
        }
      });
      return { slot: best, strength: bestStrength };
    }

    function updateBox(slot) {
      var info = shapeBuffers[activeShape];
      if (!slot || !info) {
        return;
      }
      var r = rectOf(slot);
      var vw = window.innerWidth;
      var vh = window.innerHeight;
      // Form im Platzhalter einpassen (contain)
      var w = r.width;
      var h = w / info.aspect;
      if (h > r.height) {
        h = r.height;
        w = h * info.aspect;
      }
      gl.uniform4f(u.uBox,
        ((r.left + r.width / 2) / vw) * 2 - 1,
        1 - ((r.top + r.height / 2) / vh) * 2,
        (w / vw) * 2,
        (h / vh) * 2);
    }

    // --- Farben passend zum Theme -------------------------------------------
    var strength = 1;
    function applyTheme() {
      var theme = doc.getAttribute("data-theme") === "light" ? THEMES.light : THEMES.dark;
      gl.uniform3fv(u.uBase, theme.base);
      gl.uniform3fv(u.uCrest, theme.crest);
      gl.uniform3fv(u.uSilver, theme.silver);
      gl.uniform3fv(u.uGreen, theme.green);
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
    // Adaptive Qualität: gleitender Mittelwert der Bildzeit; bei Ruckeln erst die
    // Auflösung senken, zuletzt auf 30 Bilder/s begrenzen
    var avgFrame = 16;
    var framesSinceCheck = 0;
    var minInterval = 0;
    var QUALITY_STEPS = [1, 0.8, 0.65, 0.5];

    function adapt(interval) {
      avgFrame += (interval - avgFrame) * 0.08;
      if (++framesSinceCheck < 90) {
        return;
      }
      framesSinceCheck = 0;
      if (avgFrame > 24) {
        var next = QUALITY_STEPS.filter(function (q) { return q < quality - 0.001; })[0];
        if (next) {
          quality = next;
          resize();
        } else if (!minInterval) {
          minInterval = 1000 / 30;
        }
        avgFrame = 16;
      }
    }

    function draw(now) {
      if (minInterval && last && now - last < minInterval - 2) {
        window.requestAnimationFrame(draw);
        return;
      }
      if (last && !reduceMotion) {
        adapt(now - last);
      }
      var dt = last ? Math.min((now - last) / 1000, 0.05) : 0.016;
      last = now;
      // Zustandswechsel zwischen Abschnitten bewusst langsam und weich
      var k = reduceMotion ? 1 : Math.min(1, dt * 1.1);
      var settled = true;
      KEYS.forEach(function (key) {
        var diff = target[key] - current[key];
        if (Math.abs(diff) > 0.0005) {
          settled = false;
        }
        current[key] += diff * k;
      });
      mouse.z += (mouse.tz - mouse.z) * Math.min(1, dt * 3);


      // Form: erst zurück in die Welle, dann das neue Motiv laden
      if (++rectAge > 30 && slots.length) {
        measureSlots();
      }
      var near = nearestSlot();
      var wanted = near.slot ? near.slot.getAttribute("data-shape") : null;
      var morphTarget = 0;
      if (wanted && wanted === activeShape && shapeBuffers[wanted]) {
        activeSlot = near.slot;
        morphTarget = near.strength;
      } else if (morph < 0.02) {
        morph = 0;
        if (wanted !== activeShape) {
          activeShape = wanted;
          activeSlot = near.slot;
          bindShape(wanted && shapeBuffers[wanted] ? shapeBuffers[wanted].buffer : emptyBuffer);
        }
      }
      // Beim Motivwechsel schneller zerfallen als beim Wegscrollen
      var switching = wanted && wanted !== activeShape;
      var mk = reduceMotion ? 1 : Math.min(1, dt * (switching ? 1.8 : 0.8));
      if (Math.abs(morphTarget - morph) > 0.002) {
        settled = false;
      }
      morph += (morphTarget - morph) * mk;
      updateBox(activeSlot);

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
      burst = reduceMotion ? 0 : burst * Math.exp(-dt * 0.9);
      if (burst > 0.01) {
        settled = false;
      }
      gl.uniform1f(u.uRipple, burst * 1.8);
      var scatter = activeSlot ? parseFloat(activeSlot.getAttribute("data-scatter")) : NaN;
      gl.uniform1f(u.uScatter, isNaN(scatter) ? 0.3 : scatter);
      gl.uniform1f(u.uAlpha, current.alpha * strength);
      gl.uniform1f(u.uShapeAlpha, 0.9 * strength);
      gl.uniform1f(u.uGlow, current.glow);
      gl.uniform1f(u.uMorph, morph);
      gl.uniform1f(u.uScroll, reduceMotion ? 0 : window.scrollY * -0.0025);
      gl.uniform3f(u.uMouse, mouse.x, mouse.y, mouse.z);

      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.POINTS, 0, count);

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

    // Barrierefreie Ansicht: Welle aus, Motive aus, kein Zeichnen
    var a11y = function () {
      return doc.getAttribute("data-a11y") === "on";
    };
    var syncA11y = function () {
      var off = a11y();
      doc.classList.toggle("has-wave", !off);
      canvas.style.display = off ? "none" : "";
      visible = !off && document.visibilityState === "visible";
      if (visible) {
        requestDraw();
      }
    };
    if ("MutationObserver" in window) {
      new MutationObserver(syncA11y).observe(doc, { attributes: true, attributeFilter: ["data-a11y"] });
    }

    document.addEventListener("visibilitychange", function () {
      visible = !a11y() && document.visibilityState === "visible";
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
        measureSlots();
        pickZone();
        requestDraw();
      });
    }, { passive: true });
    window.addEventListener("resize", function () {
      measureSlots();
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
    syncA11y();
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
