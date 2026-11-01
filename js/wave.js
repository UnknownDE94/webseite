// Werringloer Komponentenmanagement – Partikelwelle (seitenweiter Hintergrund)
// Ein einziges, fest stehendes WebGL-Canvas hinter allen Inhalten.
//
// 1) Zustand je Abschnitt:  <section data-wave="hero|calm|flow|grid|pulse|surge|flat">
//    Ohne Angabe: erster Abschnitt = hero, CTA = surge, Footer = flat, sonst calm.
// 2) Formen: Ein leeres Element mit data-shape="bars|modules|logo" ist ein Platzhalter.
//    Steht es mittig im Bild, löst sich ein Teil der Punkte aus der Welle und formt
//    das Motiv genau an dieser Stelle; beim Weiterscrollen fließen sie zurück.
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
    hero:  { amp: 1.00, freq: 0.85, speed: 0.55, pitch: 0.34, lift: -0.36, alpha: 1.00, spread: 1.00, glow: 1.00, shift: 0.30, ripple: 0.0 },
    calm:  { amp: 0.42, freq: 0.70, speed: 0.30, pitch: 0.26, lift: -0.62, alpha: 0.65, spread: 1.00, glow: 0.45, shift: 0.00, ripple: 0.0 },
    flow:  { amp: 0.70, freq: 1.25, speed: 0.80, pitch: 0.30, lift: -0.55, alpha: 0.70, spread: 1.00, glow: 0.70, shift: 0.00, ripple: 0.0 },
    grid:  { amp: 0.14, freq: 0.55, speed: 0.22, pitch: 0.95, lift: -0.10, alpha: 0.40, spread: 0.85, glow: 0.30, shift: 0.00, ripple: 0.0 },
    pulse: { amp: 0.18, freq: 0.60, speed: 0.70, pitch: 0.60, lift: -0.30, alpha: 0.70, spread: 1.00, glow: 0.90, shift: 0.30, ripple: 1.0 },
    surge: { amp: 1.30, freq: 1.00, speed: 0.95, pitch: 0.38, lift: -0.40, alpha: 0.95, spread: 1.05, glow: 1.15, shift: 0.35, ripple: 0.0 },
    flat:  { amp: 0.20, freq: 0.60, speed: 0.20, pitch: 0.20, lift: -0.80, alpha: 0.40, spread: 1.00, glow: 0.30, shift: 0.00, ripple: 0.0 }
  };
  var KEYS = ["amp", "freq", "speed", "pitch", "lift", "alpha", "spread", "glow", "shift", "ripple"];

  // silver: Farbe der hellen Formanteile (Logo-Silber, Linien)
  var THEMES = {
    dark:  { base: [0.11, 0.42, 0.26], crest: [0.83, 0.93, 0.37], silver: [0.88, 0.90, 0.88], strength: 1.0 },
    light: { base: [0.05, 0.23, 0.14], crest: [0.36, 0.52, 0.10], silver: [0.30, 0.34, 0.32], strength: 0.75 }
  };

  // Anteil der Punkte, die eine Form bilden (der Rest bleibt als leise Welle)
  var SHAPE_SHARE = 0.38;

  var VERT = [
    "attribute vec2 aGrid;",
    "attribute vec4 aShape;", // x, y (−0.5…0.5), Gewicht (0/1), Ton (0 Limette … 1 Silber)
    "uniform float uTime, uAmp, uFreq, uPitch, uLift, uShift, uSpread, uAspect, uSize, uScroll, uRipple, uMorph;",
    "uniform vec3 uMouse;",
    "uniform vec4 uBox;", // Mitte (NDC) und Größe (NDC) der aktuellen Form
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
    "  float h = wave(pw, t) * uAmp + uRipple * ripple(p, t);",
    // Maus: weiche Erhebung um die Zeigerposition (in Bildschirmkoordinaten)
    "  vec4 c0 = project(vec3(p.x, h, p.y));",
    "  vec2 dm = (c0.xy / c0.w - uMouse.xy) * vec2(uAspect, 1.0);",
    "  h += uMouse.z * exp(-dot(dm, dm) * 6.0) * 0.9;",
    "  vec4 clip = project(vec3(p.x, h, p.y));",
    "  float depth = clip.w;",
    "  float edge = smoothstep(1.0, 0.72, abs(aGrid.x)) * smoothstep(1.0, 0.55, abs(aGrid.y));",
    "  float waveFade = edge * smoothstep(19.0, 8.0, depth);",
    // Form: jeder Punkt startet leicht versetzt, damit sich das Motiv aufbaut
    "  float r = fract(sin(dot(aGrid, vec2(12.9898, 78.233))) * 43758.5453);",
    "  float m = clamp(uMorph * 1.7 - r * 0.7, 0.0, 1.0) * aShape.z;",
    "  m = m * m * (3.0 - 2.0 * m);",
    "  vec2 wob = vec2(sin(t * 1.3 + r * 6.283), cos(t * 1.1 + r * 6.283)) * 0.0035;",
    "  vec2 target = uBox.xy + aShape.xy * uBox.zw + wob;",
    "  vec2 ndc = mix(clip.xy / clip.w, target, m);",
    "  gl_Position = vec4(ndc, 0.0, 1.0);",
    "  gl_PointSize = mix(clamp(uSize * 9.0 / depth, 1.0, 6.0 * uSize), uSize * 1.05, m);",
    "  vH = clamp(h / max(uAmp + uRipple * 0.75, 0.2) * 0.5 + 0.5, 0.0, 1.0);",
    // Punkte ohne Formaufgabe treten zurück, solange eine Form steht
    "  vFade = mix(waveFade, 1.0, m) * mix(1.0, 0.3, uMorph * (1.0 - aShape.z));",
    "  vMorph = m;",
    "  vTone = aShape.w;",
    "}"
  ].join("\n");

  var FRAG = [
    "precision mediump float;",
    "uniform vec3 uBase, uCrest, uSilver;",
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
    "  vec3 shapeCol = mix(uCrest, uSilver, vTone);",
    "  vec3 col = mix(waveCol, shapeCol, vMorph);",
    "  float alpha = a * vFade * mix(uAlpha * (0.35 + 0.65 * vH), uShapeAlpha, vMorph);",
    "  gl_FragColor = vec4(col * alpha, alpha);",
    "}"
  ].join("\n");

  // --- Formen: auf ein verstecktes 2D-Canvas zeichnen und Pixel abtasten ------
  // Grün (#00ff00) ergibt Limette, Weiß ergibt Silber.
  var SHAPES = {
    // Balkendiagramm mit Trendlinie und Ampel – „aus Daten wird Steuerung“
    bars: function (done) {
      var w = 480, h = 300;
      var c = canvas2d(w, h);
      var g = c.getContext("2d");
      var heights = [70, 105, 90, 140, 125, 175, 160, 215];
      var tops = [];
      g.fillStyle = "#00ff00";
      heights.forEach(function (bh, i) {
        var x = 18 + i * 46;
        g.fillRect(x, 270 - bh, 30, bh);
        tops.push([x + 15, 270 - bh - 14]);
      });
      g.fillStyle = "#ffffff";
      g.fillRect(6, 278, 380, 3);
      g.strokeStyle = "#ffffff";
      g.lineWidth = 3;
      g.beginPath();
      tops.forEach(function (pt, i) {
        if (i) { g.lineTo(pt[0], pt[1]); } else { g.moveTo(pt[0], pt[1]); }
      });
      g.stroke();
      // Ampel
      g.lineWidth = 4;
      [44, 92, 140].forEach(function (y, i) {
        g.beginPath();
        g.arc(438, y, 17, 0, Math.PI * 2);
        if (i === 2) {
          g.fillStyle = "#00ff00";
          g.fill();
        } else {
          g.stroke();
        }
      });
      done(sample(g, w, h));
    },
    // Sechs Leistungsbereiche um einen Kern
    modules: function (done) {
      var w = 400, h = 400;
      var c = canvas2d(w, h);
      var g = c.getContext("2d");
      g.strokeStyle = "#ffffff";
      g.lineWidth = 2;
      var nodes = [];
      for (var i = 0; i < 6; i++) {
        var a = -Math.PI / 2 + (i * Math.PI) / 3;
        nodes.push([200 + Math.cos(a) * 145, 200 + Math.sin(a) * 145]);
      }
      nodes.forEach(function (n) {
        g.beginPath();
        g.moveTo(200, 200);
        g.lineTo(n[0], n[1]);
        g.stroke();
      });
      g.beginPath();
      g.arc(200, 200, 145, 0, Math.PI * 2);
      g.stroke();
      g.lineWidth = 7;
      g.strokeStyle = "#00ff00";
      nodes.forEach(function (n) {
        g.beginPath();
        g.arc(n[0], n[1], 26, 0, Math.PI * 2);
        g.fillStyle = "#000000";
        g.globalCompositeOperation = "destination-out";
        g.fill();
        g.globalCompositeOperation = "source-over";
        g.stroke();
      });
      g.fillStyle = "#ffffff";
      g.beginPath();
      g.arc(200, 200, 40, 0, Math.PI * 2);
      g.fill();
      done(sample(g, w, h));
    },
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
          // Silber: hell und kaum gesättigt; sonst Grün
          var mx = Math.max(data[i], data[i + 1], data[i + 2]);
          var mn = Math.min(data[i], data[i + 1], data[i + 2]);
          tone = mx > 110 && mx - mn < 40 ? 1 : 0;
        } else {
          tone = data[i] > 128 ? 1 : 0;
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
    var cols = small ? 120 : 200;
    var rows = small ? 70 : 110;
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
    ["uTime", "uAmp", "uFreq", "uPitch", "uLift", "uShift", "uSpread", "uAspect", "uSize", "uScroll", "uRipple", "uMorph",
      "uMouse", "uBox", "uBase", "uCrest", "uSilver", "uAlpha", "uGlow", "uShapeAlpha"].forEach(function (name) {
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
    var slots = Array.prototype.slice.call(document.querySelectorAll("[data-shape]")).filter(function (el) {
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
      buildShape(slot.getAttribute("data-shape"));
    });

    // Welcher Platzhalter steht am nächsten an der Bildmitte – und wie stark?
    function nearestSlot() {
      var vh = window.innerHeight;
      var best = null;
      var bestStrength = 0;
      slots.forEach(function (slot) {
        var r = slot.getBoundingClientRect();
        if (r.width < 40 || r.height < 40) {
          return;
        }
        var dist = Math.abs(r.top + r.height / 2 - vh / 2) / vh;
        var strength = 1 - Math.min(1, Math.max(0, (dist - 0.28) / 0.3));
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
      var r = slot.getBoundingClientRect();
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

      // Form: erst zurück in die Welle, dann das neue Motiv laden
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
      var mk = reduceMotion ? 1 : Math.min(1, dt * 1.6);
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
      gl.uniform1f(u.uRipple, current.ripple);
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
