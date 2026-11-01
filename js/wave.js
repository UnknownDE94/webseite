// Werringloer Komponentenmanagement – Partikelwelle (seitenweiter Hintergrund)
// Ein einziges, fest stehendes WebGL-Canvas hinter allen Inhalten.
//
// 1) Zustand je Abschnitt:  <section data-wave="hero|calm|flow|grid|pulse|surge|flat">
//    Ohne Angabe: erster Abschnitt = hero, CTA = surge, Footer = flat, sonst calm.
// 2) Formen: Ein leeres Element mit data-shape="bars|modules|logo" ist ein Platzhalter.
//    Steht es mittig im Bild, löst sich ein Teil der Punkte aus der Welle und formt
//    das Motiv genau an dieser Stelle; beim Weiterscrollen fließen sie zurück.
//    Wird data-shape geändert (z. B. von js/main.js), zerfällt das Motiv und das
//    neue bildet sich. data-shapes="a b c" lädt Motive vorab, data-scatter (0…1)
//    bestimmt, wie stark die Maus die Punkte auseinandertreibt.
// 3) Ereignis "wave:burst" auf window: einmaliger kräftiger Signalimpuls.
// 4) Raumformen: Zustände orbit (Kugel), vortex (Wirbel), ribbon (Band),
//    tunnel und dunes legen das Punktraster auf eine Fläche im Raum.
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
    grid:  { amp: 0.16, freq: 0.55, speed: 0.22, pitch: 0.95, lift: -0.10, alpha: 0.55, spread: 0.85, glow: 0.40, shift: 0.00, ripple: 0.0 },
    pulse: { amp: 0.18, freq: 0.60, speed: 0.70, pitch: 0.60, lift: -0.30, alpha: 0.85, spread: 1.00, glow: 1.00, shift: 0.30, ripple: 1.2 },
    surge: { amp: 1.30, freq: 1.00, speed: 0.95, pitch: 0.38, lift: -0.40, alpha: 0.95, spread: 1.05, glow: 1.15, shift: 0.35, ripple: 0.0 },
    flat:  { amp: 0.20, freq: 0.60, speed: 0.20, pitch: 0.20, lift: -0.80, alpha: 0.40, spread: 1.00, glow: 0.30, shift: 0.00, ripple: 0.0 },
    // Raumformen: das Punktraster legt sich auf eine Fläche im Raum (form)
    orbit:  { amp: 0.25, freq: 0.80, speed: 0.35, pitch: 0.30, lift: -0.05, alpha: 0.70, spread: 1.00, glow: 0.80, shift: 0.32, ripple: 0.0, form: "sphere" },
    vortex: { amp: 0.55, freq: 0.90, speed: 0.45, pitch: 0.70, lift: -0.12, alpha: 0.90, spread: 1.00, glow: 1.00, shift: 0.30, ripple: 0.0, form: "vortex" },
    ribbon: { amp: 0.30, freq: 0.80, speed: 0.50, pitch: 0.25, lift: -0.30, alpha: 0.80, spread: 1.00, glow: 0.95, shift: 0.00, ripple: 0.0, form: "ribbon" },
    tunnel: { amp: 0.35, freq: 0.70, speed: 0.60, pitch: 0.00, lift: 0.00, alpha: 0.95, spread: 1.00, glow: 1.00, shift: 0.18, ripple: 0.0, form: "tunnel" },
    dunes:  { amp: 1.30, freq: 0.45, speed: 0.25, pitch: 0.42, lift: -0.22, alpha: 0.90, spread: 1.15, glow: 0.85, shift: 0.00, ripple: 0.0, form: "dunes" }
  };
  // Index der Raumformen im Shader (0 = Ebene)
  var FORMS = { plane: 0, sphere: 1, vortex: 2, ribbon: 3, tunnel: 4, dunes: 5 };
  var KEYS = ["amp", "freq", "speed", "pitch", "lift", "alpha", "spread", "glow", "shift", "ripple"];

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
    "uniform float uForm, uFormMix;",
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
    // Raumform für einen Rasterpunkt (u, v in −1…1)
    "vec3 formPos(vec2 g, float t, float h) {",
    "  float PI = 3.14159265;",
    "  if (uForm < 1.5) {", // Kugel: Punkteglobus, dreht sich langsam
    "    float th = g.x * PI + t * 0.25;",
    "    float ph = (g.y * 0.5 + 0.5) * PI;",
    "    float rr = 3.3 + h * 0.18;",
    "    return vec3(rr * sin(ph) * cos(th), rr * cos(ph), rr * sin(ph) * sin(th));",
    "  } else if (uForm < 2.5) {", // Wirbel: Spirale, die nach innen zieht
    "    float rad = (g.y * 0.5 + 0.5) * 7.0 + 0.4;",
    "    float an = g.x * PI + rad * 0.55 - t * 0.35;",
    "    return vec3(rad * cos(an), sin(rad * 1.1 - t * 1.4) * 0.35 * uAmp + h * 0.1, rad * sin(an));",
    "  } else if (uForm < 3.5) {", // Band: verdrilltes Datenband
    "    float x = g.x * 10.0;",
    "    float tw = x * 0.42 + t * 0.6;",
    "    float w = g.y * 1.4;",
    "    return vec3(x, w * cos(tw) + sin(x * 0.5 + t) * 0.6, w * sin(tw) - 1.0);",
    "  } else if (uForm < 4.5) {", // Tunnel: Blick in einen Datenkanal
    "    float an = g.x * PI;",
    "    float z = mod(g.y * 8.0 + t * 1.6, 16.0) - 12.0;",
    "    float rr = 2.7 + sin(an * 6.0 + z * 0.5 + t) * 0.18 * uAmp;",
    "    return vec3(rr * cos(an), rr * sin(an), z + 9.0);",
    "  }",
    // Dünen: weite, ruhige Landschaft mit mehreren Wellenlagen
    "  vec2 q = vec2(g.x * 15.0, g.y * 9.0);",
    "  float d = sin(q.x * 0.35 + t * 0.3) * 0.9 + sin(q.y * 0.5 - t * 0.2) * 0.6 + sin((q.x - q.y) * 0.8 + t * 0.4) * 0.25;",
    "  return vec3(q.x, d * uAmp * 0.9, q.y);",
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
    "  vec3 world = vec3(p.x, h, p.y);",
    "  if (uFormMix > 0.001) { world = mix(world, formPos(aGrid, t, h), uFormMix); }",
    "  vec4 clip = project(world);",
    "  float depth = max(clip.w, 0.001);",
    "  float edge = mix(smoothstep(1.0, 0.72, abs(aGrid.x)) * smoothstep(1.0, 0.55, abs(aGrid.y)), 1.0, uFormMix * step(uForm, 4.5) * 0.85);",
    "  float waveFade = edge * smoothstep(19.0, 8.0, depth) * step(0.2, clip.w);",
    // Form: jeder Punkt startet leicht versetzt, damit sich das Motiv aufbaut
    "  float r = fract(sin(dot(aGrid, vec2(12.9898, 78.233))) * 43758.5453);",
    "  float m = clamp(uMorph * 1.7 - r * 0.7, 0.0, 1.0) * aShape.z;",
    "  m = m * m * (3.0 - 2.0 * m);",
    "  vec2 wob = vec2(sin(t * 1.3 + r * 6.283), cos(t * 1.1 + r * 6.283)) * 0.0035;",
    "  vec2 target = uBox.xy + aShape.xy * uBox.zw + wob;",
    // Maus treibt die Punkte der Form auseinander
    "  vec2 dv = (target - uMouse.xy) * vec2(uAspect, 1.0);",
    "  float dd = length(dv) + 0.0001;",
    "  target += (dv / dd) / vec2(uAspect, 1.0) * uScatter * uMouse.z * 0.09 * exp(-dd * dd * 45.0);",
    "  vec2 ndc = mix(clip.xy / depth, target, m);",
    "  gl_Position = vec4(ndc, 0.0, 1.0);",
    "  gl_PointSize = mix(clamp(uSize * 9.0 / depth, 1.0, 6.0 * uSize), uSize * 1.25, m);",
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

  // Strichsymbole (300 × 300): Grün = Limette, Weiß = Silber
  function icon(drawFn) {
    return function (done) {
      var c = canvas2d(300, 300);
      var g = c.getContext("2d");
      g.lineCap = "round";
      g.lineJoin = "round";
      g.lineWidth = 16;
      g.strokeStyle = "#00ff00";
      g.fillStyle = "#ffffff";
      drawFn(g);
      done(sample(g, 300, 300));
    };
  }
  function roundRect(g, x, y, w, h, r) {
    g.beginPath();
    g.moveTo(x + r, y);
    g.arcTo(x + w, y, x + w, y + h, r);
    g.arcTo(x + w, y + h, x, y + h, r);
    g.arcTo(x, y + h, x, y, r);
    g.arcTo(x, y, x + w, y, r);
    g.closePath();
  }
  function textShape(text, weight) {
    return function (done) {
      var draw = function () {
        var w = 600, h = 260;
        var c = canvas2d(w, h);
        var g = c.getContext("2d");
        g.fillStyle = "#00ff00";
        g.textAlign = "center";
        g.textBaseline = "middle";
        g.font = weight + " 230px Archivo, Inter, system-ui, sans-serif";
        g.fillText(text, w / 2, h / 2 + 10);
        done(sample(g, w, h));
      };
      if (document.fonts && document.fonts.load) {
        document.fonts.load(weight + " 230px Archivo").then(draw, draw);
      } else {
        draw();
      }
    };
  }

  // Ablauf: Gespräch, Analyse, Entscheidung, Umsetzung
  SHAPES.talk = icon(function (g) {
    roundRect(g, 30, 40, 240, 170, 40);
    g.stroke();
    g.beginPath();
    g.moveTo(90, 210);
    g.lineTo(70, 265);
    g.lineTo(140, 210);
    g.stroke();
    [100, 150, 200].forEach(function (x) {
      g.beginPath();
      g.arc(x, 125, 14, 0, Math.PI * 2);
      g.fill();
    });
  });
  SHAPES.scan = icon(function (g) {
    g.beginPath();
    g.arc(125, 125, 85, 0, Math.PI * 2);
    g.stroke();
    g.strokeStyle = "#ffffff";
    g.lineWidth = 26;
    g.beginPath();
    g.moveTo(190, 190);
    g.lineTo(262, 262);
    g.stroke();
    g.lineWidth = 10;
    g.beginPath();
    g.moveTo(80, 150);
    g.lineTo(108, 118);
    g.lineTo(132, 138);
    g.lineTo(170, 96);
    g.stroke();
  });
  SHAPES.fork = icon(function (g) {
    g.strokeStyle = "#ffffff";
    g.beginPath();
    g.moveTo(150, 275);
    g.lineTo(150, 165);
    g.stroke();
    g.strokeStyle = "#00ff00";
    g.beginPath();
    g.moveTo(150, 170);
    g.quadraticCurveTo(150, 120, 75, 75);
    g.moveTo(150, 170);
    g.quadraticCurveTo(150, 120, 225, 75);
    g.stroke();
    // Pfeilspitzen
    g.beginPath();
    g.moveTo(60, 125);
    g.lineTo(60, 60);
    g.lineTo(125, 60);
    g.moveTo(175, 60);
    g.lineTo(240, 60);
    g.lineTo(240, 125);
    g.stroke();
  });
  SHAPES.gear = icon(function (g) {
    var teeth = 9;
    g.beginPath();
    for (var i = 0; i < teeth * 2; i++) {
      var a = (i / (teeth * 2)) * Math.PI * 2;
      var r1 = i % 2 ? 108 : 135;
      var a2 = a + Math.PI / (teeth * 2);
      g.lineTo(150 + Math.cos(a) * r1, 150 + Math.sin(a) * r1);
      g.lineTo(150 + Math.cos(a2) * r1, 150 + Math.sin(a2) * r1);
    }
    g.closePath();
    g.lineWidth = 12;
    g.stroke();
    g.strokeStyle = "#ffffff";
    g.beginPath();
    g.arc(150, 150, 45, 0, Math.PI * 2);
    g.stroke();
  });
  // SmartParts-Säulen
  SHAPES.database = icon(function (g) {
    g.strokeStyle = "#ffffff";
    g.beginPath();
    g.ellipse(150, 65, 100, 32, 0, 0, Math.PI * 2);
    g.stroke();
    g.strokeStyle = "#00ff00";
    g.beginPath();
    g.moveTo(50, 65);
    g.lineTo(50, 235);
    g.ellipse(150, 235, 100, 32, 0, Math.PI, 0, true);
    g.lineTo(250, 65);
    g.stroke();
    [122, 179].forEach(function (y) {
      g.beginPath();
      g.ellipse(150, y, 100, 32, 0, 0, Math.PI);
      g.stroke();
    });
  });
  SHAPES.euro = icon(function (g) {
    g.beginPath();
    g.arc(170, 150, 100, Math.PI * 0.25, Math.PI * 1.75);
    g.stroke();
    g.strokeStyle = "#ffffff";
    g.beginPath();
    g.moveTo(40, 125);
    g.lineTo(185, 125);
    g.moveTo(40, 175);
    g.lineTo(170, 175);
    g.stroke();
  });
  SHAPES.truck = icon(function (g) {
    roundRect(g, 20, 70, 160, 130, 12);
    g.stroke();
    g.beginPath();
    g.moveTo(180, 110);
    g.lineTo(235, 110);
    g.lineTo(280, 160);
    g.lineTo(280, 200);
    g.lineTo(180, 200);
    g.stroke();
    g.strokeStyle = "#ffffff";
    [75, 230].forEach(function (x) {
      g.beginPath();
      g.arc(x, 222, 26, 0, Math.PI * 2);
      g.stroke();
    });
  });
  SHAPES.shield = icon(function (g) {
    g.beginPath();
    g.moveTo(150, 25);
    g.lineTo(255, 65);
    g.bezierCurveTo(255, 170, 215, 240, 150, 278);
    g.bezierCurveTo(85, 240, 45, 170, 45, 65);
    g.closePath();
    g.stroke();
    g.strokeStyle = "#ffffff";
    g.beginPath();
    g.moveTo(100, 150);
    g.lineTo(138, 188);
    g.lineTo(205, 115);
    g.stroke();
  });
  // Danke- und Fehlerseite
  SHAPES.check = icon(function (g) {
    g.beginPath();
    g.arc(150, 150, 120, 0, Math.PI * 2);
    g.stroke();
    g.strokeStyle = "#ffffff";
    g.lineWidth = 22;
    g.beginPath();
    g.moveTo(92, 155);
    g.lineTo(133, 196);
    g.lineTo(212, 112);
    g.stroke();
  });
  SHAPES["404"] = textShape("404", 800);
  // Masterplan: Mobile, Offline, Lokale KI, Migration, CAD, Lieferantennetz
  SHAPES.mobile = icon(function (g) {
    roundRect(g, 85, 20, 130, 260, 26);
    g.stroke();
    g.strokeStyle = "#ffffff";
    g.lineWidth = 10;
    [[110, 70, 190, 70], [110, 105, 170, 105], [110, 140, 185, 140]].forEach(function (l) {
      g.beginPath();
      g.moveTo(l[0], l[1]);
      g.lineTo(l[2], l[3]);
      g.stroke();
    });
    g.lineWidth = 12;
    roundRect(g, 110, 175, 80, 55, 8);
    g.stroke();
    g.fillStyle = "#00ff00";
    g.beginPath();
    g.arc(150, 258, 8, 0, Math.PI * 2);
    g.fill();
  });
  SHAPES.offline = icon(function (g) {
    roundRect(g, 30, 60, 120, 200, 22);
    g.stroke();
    g.strokeStyle = "#ffffff";
    g.lineWidth = 12;
    g.setLineDash([18, 16]);
    g.beginPath();
    g.moveTo(165, 160);
    g.lineTo(225, 160);
    g.stroke();
    g.setLineDash([]);
    g.strokeStyle = "#00ff00";
    g.lineWidth = 14;
    g.beginPath();
    g.arc(255, 160, 30, 0, Math.PI * 2);
    g.stroke();
    g.strokeStyle = "#ffffff";
    g.beginPath();
    g.moveTo(205, 95);
    g.lineTo(285, 225);
    g.stroke();
  });
  SHAPES["local-ai"] = icon(function (g) {
    roundRect(g, 80, 80, 140, 140, 18);
    g.stroke();
    g.strokeStyle = "#ffffff";
    g.lineWidth = 10;
    for (var i = 0; i < 4; i++) {
      var p = 105 + i * 30;
      [[p, 80, p, 40], [p, 220, p, 260], [80, p, 40, p], [220, p, 260, p]].forEach(function (l) {
        g.beginPath();
        g.moveTo(l[0], l[1]);
        g.lineTo(l[2], l[3]);
        g.stroke();
      });
    }
    g.fillStyle = "#00ff00";
    [[125, 125], [175, 125], [150, 170]].forEach(function (n) {
      g.beginPath();
      g.arc(n[0], n[1], 12, 0, Math.PI * 2);
      g.fill();
    });
    g.strokeStyle = "#00ff00";
    g.lineWidth = 6;
    g.beginPath();
    g.moveTo(125, 125);
    g.lineTo(175, 125);
    g.lineTo(150, 170);
    g.closePath();
    g.stroke();
  });
  SHAPES.migrate = icon(function (g) {
    g.strokeStyle = "#ffffff";
    roundRect(g, 20, 70, 95, 160, 14);
    g.stroke();
    g.strokeStyle = "#00ff00";
    roundRect(g, 185, 70, 95, 160, 14);
    g.stroke();
    g.lineWidth = 9;
    [110, 150, 190].forEach(function (y) {
      g.strokeStyle = "#ffffff";
      g.beginPath();
      g.moveTo(42, y);
      g.lineTo(93, y);
      g.stroke();
      g.strokeStyle = "#00ff00";
      g.beginPath();
      g.moveTo(207, y);
      g.lineTo(258, y);
      g.stroke();
    });
    g.lineWidth = 14;
    g.beginPath();
    g.moveTo(128, 150);
    g.lineTo(170, 150);
    g.moveTo(152, 128);
    g.lineTo(172, 150);
    g.lineTo(152, 172);
    g.stroke();
  });
  SHAPES.cad = icon(function (g) {
    // Winkelbauteil als Drahtgitter (isometrisch)
    g.lineWidth = 8;
    var P = function (x, y, z) {
      return [150 + (x - z) * 0.87, 165 + (x + z) * 0.5 - y];
    };
    var line = function (a, b) {
      var p = P.apply(null, a), q = P.apply(null, b);
      g.beginPath();
      g.moveTo(p[0], p[1]);
      g.lineTo(q[0], q[1]);
      g.stroke();
    };
    var box = function (x0, y0, z0, x1, y1, z1) {
      var c = [[x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], [x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]];
      [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]].forEach(function (e) {
        line(c[e[0]], c[e[1]]);
      });
    };
    box(-90, 0, -50, 90, 30, 50);
    g.strokeStyle = "#ffffff";
    box(-90, 30, -50, -60, 130, 50);
    g.strokeStyle = "#00ff00";
    g.lineWidth = 6;
    [-40, 0, 40].forEach(function (x) {
      line([x, 30, -50], [x, 30, 50]);
    });
    g.beginPath();
    var c = P(40, 30, 0);
    g.ellipse(c[0], c[1], 18, 10, 0, 0, Math.PI * 2);
    g.stroke();
  });
  SHAPES.network = icon(function (g) {
    var nodes = [[150, 150], [55, 70], [245, 65], [40, 210], [260, 225], [150, 40], [150, 270]];
    g.strokeStyle = "#ffffff";
    g.lineWidth = 6;
    nodes.slice(1).forEach(function (n) {
      g.beginPath();
      g.moveTo(150, 150);
      g.lineTo(n[0], n[1]);
      g.stroke();
    });
    g.beginPath();
    g.moveTo(55, 70);
    g.lineTo(150, 40);
    g.lineTo(245, 65);
    g.moveTo(40, 210);
    g.lineTo(150, 270);
    g.lineTo(260, 225);
    g.stroke();
    nodes.forEach(function (n, i) {
      g.beginPath();
      g.arc(n[0], n[1], i ? 18 : 30, 0, Math.PI * 2);
      if (i) {
        g.fillStyle = "#000";
        g.globalCompositeOperation = "destination-out";
        g.fill();
        g.globalCompositeOperation = "source-over";
        g.strokeStyle = "#00ff00";
        g.lineWidth = 9;
        g.stroke();
      } else {
        g.fillStyle = "#ffffff";
        g.fill();
      }
    });
  });

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
    ["uTime", "uAmp", "uFreq", "uPitch", "uLift", "uShift", "uSpread", "uAspect", "uSize", "uScroll", "uRipple", "uMorph", "uScatter", "uForm", "uFormMix", "uGreen",
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
    var form = 0;
    var formMix = 0;

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

      // Raumform: Wechsel läuft über die Ebene (formMix → 0), dann neue Form
      var wantedForm = FORMS[target.form || "plane"] || 0;
      var formTarget = 0;
      if (wantedForm === form) {
        formTarget = form ? 1 : 0;
      } else if (formMix < 0.02) {
        formMix = 0;
        form = wantedForm;
      }
      var fk = reduceMotion ? 1 : Math.min(1, dt * 1.3);
      if (Math.abs(formTarget - formMix) > 0.002) {
        settled = false;
      }
      formMix += (formTarget - formMix) * fk;

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
      // Beim Motivwechsel schneller zerfallen als beim Wegscrollen
      var switching = wanted && wanted !== activeShape;
      var mk = reduceMotion ? 1 : Math.min(1, dt * (switching ? 4.5 : 1.6));
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
      gl.uniform1f(u.uRipple, current.ripple + burst * 1.8);
      var scatter = activeSlot ? parseFloat(activeSlot.getAttribute("data-scatter")) : NaN;
      gl.uniform1f(u.uScatter, isNaN(scatter) ? 0.3 : scatter);
      gl.uniform1f(u.uAlpha, current.alpha * strength);
      gl.uniform1f(u.uShapeAlpha, 0.9 * strength);
      gl.uniform1f(u.uGlow, current.glow);
      gl.uniform1f(u.uMorph, morph);
      gl.uniform1f(u.uForm, form);
      gl.uniform1f(u.uFormMix, formMix * formMix * (3 - 2 * formMix));
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
