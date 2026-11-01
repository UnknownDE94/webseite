/* Einfache 2,5D-Bauteilskizzen für die WK-3D-Konzeptansichten.
   <svg data-part="flansch"></svg> wird beim Laden gefüllt.
   Profile liegen in der Ebene (x, z) und werden nach oben extrudiert;
   Projektion: X = x, Y = z * K − Höhe (schräge Draufsicht). */
(function () {
  var K = 0.45;
  var STROKE = "#1a5e3a";
  var TOP = "#e3f1e8";
  var SIDE_L = "#cfe5d7";
  var SIDE_D = "#b5d4c0";

  function circle(r, n, phase) {
    var pts = [];
    for (var i = 0; i < n; i++) {
      var t = (i / n) * Math.PI * 2 + (phase || 0);
      pts.push([Math.cos(t) * r, Math.sin(t) * r]);
    }
    return pts;
  }
  function gearPts(teeth, ro, ri) {
    var pts = [];
    for (var i = 0; i < teeth; i++) {
      var a = (i / teeth) * Math.PI * 2;
      var s = (Math.PI * 2) / teeth;
      [[0, ri], [0.18, ro], [0.5, ro], [0.68, ri]].forEach(function (p) {
        var t = a + p[0] * s;
        pts.push([Math.cos(t) * p[1], Math.sin(t) * p[1]]);
      });
    }
    return pts;
  }
  function rect(w, d, rot) {
    var c = Math.cos(rot || 0), s = Math.sin(rot || 0);
    return [[-w / 2, -d / 2], [w / 2, -d / 2], [w / 2, d / 2], [-w / 2, d / 2]].map(function (p) {
      return [p[0] * c - p[1] * s, p[0] * s + p[1] * c];
    });
  }
  function shift(pts, dx, dz) {
    return pts.map(function (p) { return [p[0] + dx, p[1] + dz]; });
  }
  function P(p, y) {
    return (p[0]).toFixed(1) + "," + (p[1] * K - y).toFixed(1);
  }
  function poly(pts, y, fill) {
    return '<polygon points="' + pts.map(function (p) { return P(p, y); }).join(" ") + '" fill="' + fill + '"/>';
  }
  /* Profil von y0 bis y0 + h extrudieren. Runde Profile (smooth) erhalten
     keine Kantenlinien an den Seitenflächen, nur die Silhouette. */
  function extrude(pts, y0, h, smooth) {
    var out = [];
    var faces = [];
    var n = pts.length;
    if (smooth === undefined) smooth = n >= 40;
    var area = 0;
    for (var i = 0; i < n; i++) {
      var a = pts[i], b = pts[(i + 1) % n];
      area += a[0] * b[1] - b[0] * a[1];
    }
    var sign = area > 0 ? 1 : -1;
    var front = [];
    for (var j = 0; j < n; j++) {
      var p = pts[j], q = pts[(j + 1) % n];
      var nx = (q[1] - p[1]) * sign, nz = -(q[0] - p[0]) * sign;
      if (nz <= 0) continue; // Rückseite
      front.push(j);
      var len = Math.hypot(nx, nz) || 1;
      var light = (nx / len) < 0.2 ? SIDE_L : SIDE_D;
      var attrs = smooth ? '" stroke="' + light + '" stroke-width="0.6"' : '"';
      faces.push({ z: (p[1] + q[1]) / 2, s: '<polygon points="' + [P(p, y0), P(q, y0), P(q, y0 + h), P(p, y0 + h)].join(" ") + '" fill="' + light + attrs + "/>" });
    }
    faces.sort(function (A, B) { return A.z - B.z; });
    faces.forEach(function (f) { out.push(f.s); });
    if (smooth && front.length) {
      // Silhouette: untere Vorderkante + seitliche Senkrechte
      var start = front[0];
      for (var k = 1; k < front.length; k++) {
        if (front[k] !== front[k - 1] + 1) { start = front[k]; break; }
      }
      var chain = [];
      for (var m = 0; m <= front.length; m++) chain.push(pts[(start + m) % n]);
      out.push('<polyline fill="none" points="' + chain.map(function (c) { return P(c, y0); }).join(" ") + '"/>');
      var f0 = chain[0], f1 = chain[chain.length - 1];
      out.push('<path fill="none" d="M' + P(f0, y0) + "L" + P(f0, y0 + h) + "M" + P(f1, y0) + "L" + P(f1, y0 + h) + '"/>');
    }
    out.push(poly(pts, y0 + h, TOP));
    return out.join("");
  }
  function hole(x, z, r, y) {
    return '<ellipse cx="' + x.toFixed(1) + '" cy="' + (z * K - y).toFixed(1) + '" rx="' + r + '" ry="' + (r * K).toFixed(1) + '" fill="#7fa38c"/>';
  }
  function ring(n, r, hr, y) {
    var s = "";
    for (var i = 0; i < n; i++) {
      var t = (i / n) * Math.PI * 2 + 0.3;
      s += hole(Math.cos(t) * r, Math.sin(t) * r, hr, y);
    }
    return s;
  }

  var parts = {
    flansch: function () {
      return extrude(circle(50, 72), 0, 12) + extrude(circle(24, 48), 12, 16) + ring(6, 38, 4, 12) + hole(0, 0, 12, 28);
    },
    zahnrad: function () {
      return extrude(gearPts(18, 50, 43), 0, 14, false) + extrude(circle(18, 40), 14, 6) + hole(0, 0, 9, 20);
    },
    kettenrad: function () {
      return extrude(gearPts(24, 50, 45), 0, 8, false) + extrude(circle(20, 40), 8, 12) + ring(4, 31, 4, 8) + hole(0, 0, 10, 20);
    },
    winkel: function () {
      var r = -0.5;
      return extrude(rect(84, 50, r), 0, 8) + extrude(shift(rect(84, 9, r), -10.5, -19.5), 8, 40) + hole(-14, 14, 5, 8) + hole(16, -2, 5, 8);
    },
    buchse: function () {
      return extrude(circle(40, 64), 0, 8) + extrude(circle(28, 64), 8, 44) + hole(0, 0, 18, 52);
    },
    deckel: function () {
      return extrude(circle(50, 72), 0, 8) + extrude(circle(32, 60), 8, 7) + ring(4, 42, 3.5, 8) + hole(0, 0, 14, 15);
    },
    hebel: function () {
      var L = circle(22, 32).filter(function (p) { return p[0] <= 0; }).map(function (p) { return [p[0] - 30, p[1]]; });
      var R = circle(13, 32).filter(function (p) { return p[0] >= 0; }).map(function (p) { return [p[0] + 40, p[1]]; });
      var a = -0.45, c = Math.cos(a), s = Math.sin(a);
      var at = function (x, z) { return [x * c - z * s, x * s + z * c]; };
      var h1 = at(-30, 0), h2 = at(40, 0);
      return extrude(rotate(sortAround(L.concat(R), 5, 0), a), 0, 10, true) + hole(h1[0], h1[1], 9, 10) + hole(h2[0], h2[1], 5, 10);
    },
    gehaeuse: function () {
      var r = -0.55;
      return extrude(rect(86, 56, r), 0, 30) + extrude(rect(44, 34, r), 30, 14) + hole(0, 0, 10, 44);
    },
  };
  function rotate(pts, a) {
    var c = Math.cos(a), s = Math.sin(a);
    return pts.map(function (p) { return [p[0] * c - p[1] * s, p[0] * s + p[1] * c]; });
  }
  function sortAround(pts, cx, cz) {
    return pts.slice().sort(function (a, b) { return Math.atan2(a[1] - cz, a[0] - cx) - Math.atan2(b[1] - cz, b[0] - cx); });
  }

  document.querySelectorAll("svg[data-part]").forEach(function (svg) {
    var fn = parts[svg.getAttribute("data-part")];
    if (!fn) return;
    svg.setAttribute("viewBox", svg.getAttribute("data-vb") || "-62 -78 124 112");
    svg.innerHTML = '<g stroke="' + STROKE + '" stroke-width="' + (svg.getAttribute("data-sw") || "0.9") + '" stroke-linejoin="round">' + fn() + "</g>";
  });
})();
