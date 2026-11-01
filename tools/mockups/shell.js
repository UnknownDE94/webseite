/* Gemeinsame App-Hülle der WK-Konzeptansichten (Beispieldaten).

   Desktop: <body data-app="material" data-nav="inventur"> … <header class="appbar"> … <main class="page">
     → linke Seitennavigation (Bildmarke, App-Name, Menü, Einstellungen/Hilfe),
       obere Leiste (Breadcrumb aus .appbar .crumb, Suchfeld, Badge „Beispieldaten“),
       Inhalt (.page) rechts daneben.
   Mobil:   <body class="mobile" data-app="material">
     → App-Kopfleiste unter der Statusleiste, Linien-Icons in der unteren Tab-Leiste.
   Bewusst ohne Personen, Avatare oder Namen. */
(function () {
  var I = {
    grid: '<rect x="3.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.5"/>',
    box: '<path d="M20.5 7.5 12 3 3.5 7.5v9L12 21l8.5-4.5z"/><path d="m3.5 7.5 8.5 4.5 8.5-4.5M12 12v9"/>',
    truck: '<path d="M2.5 6h11v10h-11zM13.5 9.5h4l3 3.5v3h-7"/><circle cx="6.5" cy="17.5" r="1.8"/><circle cx="17" cy="17.5" r="1.8"/>',
    out: '<path d="M14 4h6v6M20 4l-8.5 8.5"/><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
    clipboard: '<rect x="5" y="4.5" width="14" height="16.5" rx="2"/><path d="M9 4.5V3h6v1.5M8.5 12.5l2.3 2.3 4.7-4.8"/>',
    bell: '<path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 1.5h-15z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>',
    pin: '<path d="M12 21s-6.5-6-6.5-10.8a6.5 6.5 0 0 1 13 0C18.5 15 12 21 12 21z"/><circle cx="12" cy="10" r="2.4"/>',
    chart: '<path d="M4 4v16h16"/><path d="M8.5 16v-4.5M12.5 16V8M16.5 16v-6"/>',
    sliders: '<path d="M4 7h9M17 7h3M4 12h3M11 12h9M4 17h11M19 17h1"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="17" cy="17" r="2"/>',
    help: '<circle cx="12" cy="12" r="8.5"/><path d="M9.6 9.6a2.5 2.5 0 0 1 4.8.9c0 1.7-2.4 2-2.4 3.6"/><path d="M12 17h.01"/>',
    search: '<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.3-4.3"/>',
    wrench: '<path d="M14.5 6.2a4 4 0 0 0-5.3 5.3L3.5 17.2l3.3 3.3 5.7-5.7a4 4 0 0 0 5.3-5.3l-2.5 2.5-2.6-.7-.7-2.6z"/>',
    alert: '<path d="M12 3.5 2.5 20h19z"/><path d="M12 10v4.2M12 17h.01"/>',
    factory: '<path d="M3 20.5V10l5.5 3.5V10l5.5 3.5V5h6.5v15.5z"/><path d="M7 17h2M12 17h2"/>',
    calendar: '<rect x="3.5" y="5" width="17" height="15.5" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
    clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
    file: '<path d="M6 3h8.5L19 7.5V21H6z"/><path d="M14.5 3v4.5H19M9 12h7M9 16h5"/>',
    card: '<rect x="3" y="5.5" width="18" height="13" rx="2"/><path d="M3 10h18M7 15h4"/>',
    contract: '<path d="M6 3h12v18H6z"/><path d="M9 7.5h6M9 11h6M9 17.5c1-1.5 1.8-1.5 2.4 0s1.6 1.4 2.6-.2"/>',
    folder: '<path d="M3 6.5a1 1 0 0 1 1-1h5l2 2h9a1 1 0 0 1 1 1V18a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z"/>',
    layers: '<path d="m12 3.5 8.5 4.5-8.5 4.5L3.5 8z"/><path d="m3.5 12.5 8.5 4.5 8.5-4.5"/>',
    scan: '<path d="M4 8.5V5a1 1 0 0 1 1-1h3.5M15.5 4H19a1 1 0 0 1 1 1v3.5M20 15.5V19a1 1 0 0 1-1 1h-3.5M8.5 20H5a1 1 0 0 1-1-1v-3.5M7 12h10"/>',
    shield: '<path d="M12 3 4.5 6v6c0 4.6 3.2 7.7 7.5 9 4.3-1.3 7.5-4.4 7.5-9V6z"/><path d="m9 12 2.2 2.2L15.5 10"/>',
    tag: '<path d="M3.5 12.3V4.5a1 1 0 0 1 1-1h7.8l9 9-8.8 8.8z"/><circle cx="8" cy="8" r="1.6"/>',
    building: '<path d="M4.5 21V4.5h9V21M13.5 9h6v12M2.5 21h19M7.5 8h3M7.5 12h3M7.5 16h3M16 13h1M16 16.5h1"/>',
    check: '<circle cx="12" cy="12" r="8.5"/><path d="m8.3 12.2 2.6 2.6 4.8-5.3"/>',
    pulse: '<path d="M3 12.5h4l2.5-6.5 5 13 2.5-6.5h4"/>',
    download: '<path d="M12 3.5v11M7.5 10l4.5 4.5 4.5-4.5M4 20h16"/>',
    bookmark: '<path d="M6.5 3.5h11V21L12 17.3 6.5 21z"/>',
    camera: '<path d="M3 8a1 1 0 0 1 1-1h3l1.8-2.5h6.4L17 7h3a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z"/><circle cx="12" cy="13" r="3.5"/>',
    database: '<ellipse cx="12" cy="5.5" rx="7.5" ry="2.8"/><path d="M4.5 5.5v13c0 1.5 3.4 2.8 7.5 2.8s7.5-1.3 7.5-2.8v-13M4.5 12c0 1.5 3.4 2.8 7.5 2.8s7.5-1.3 7.5-2.8"/>',
    swap: '<path d="M4 8h15l-3.5-3.5M20 16H5l3.5 3.5"/>',
    cube: '<path d="M12 2.8 20 7.3v9.4l-8 4.5-8-4.5V7.3z"/><path d="M4 7.3l8 4.5 8-4.5M12 11.8v9.4"/>',
    pen: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>',
    euro: '<path d="M17 6.5a6.5 6.5 0 1 0 0 11"/><path d="M4.5 10.5h8M4.5 13.5h8"/>',
  };

  var APPS = {
    material: {
      name: "WK Material",
      nav: [["uebersicht", "Übersicht", "grid"], ["bestand", "Bestand", "box"], ["wareneingang", "Wareneingang", "truck"], ["entnahme", "Entnahme", "out"], ["inventur", "Inventur", "clipboard"], ["meldebestand", "Meldebestand", "bell"], ["lagerplaetze", "Lagerplätze", "pin"], ["auswertungen", "Auswertungen", "chart"]],
      search: "Material, Lagerplatz, Lieferung …",
      tabs: { Inventur: "clipboard", Eingang: "truck", Entnahme: "out", Suche: "search" },
    },
    instandhaltung: {
      name: "WK Instandhaltung",
      nav: [["uebersicht", "Übersicht", "grid"], ["meldungen", "Meldungen", "alert"], ["auftraege", "Aufträge", "wrench"], ["anlagen", "Anlagen", "factory"], ["wartungsplan", "Wartungsplan", "calendar"], ["ersatzteile", "Ersatzteile", "box"], ["auswertungen", "Auswertungen", "chart"]],
      search: "Anlage, Auftrag, Ersatzteil …",
      tabs: { Meldungen: "alert", "Aufträge": "wrench", Anlagen: "factory", Scan: "scan" },
    },
    finance: {
      name: "WK Finance",
      nav: [["uebersicht", "Übersicht", "grid"], ["belege", "Belege", "file"], ["zahlungen", "Zahlungen", "card"], ["vertraege", "Verträge", "contract"], ["projekte", "Projekte", "folder"], ["kostenstellen", "Kostenstellen", "euro"], ["auswertungen", "Auswertungen", "chart"]],
      search: "Beleg, Vertrag, Projekt …",
      tabs: { Erfassen: "camera", Belege: "file", "Fällig": "clock", "Verträge": "contract" },
    },
    "3d": {
      name: "WK 3D",
      nav: [["uebersicht", "Übersicht", "grid"], ["bibliothek", "Teilebibliothek", "cube"], ["versionen", "Versionen", "layers"], ["zeichnungen", "Zeichnungen", "pen"], ["freigaben", "Freigaben", "check"], ["import", "Scan-Import", "scan"], ["auswertungen", "Auswertungen", "chart"]],
      search: "Bauteil, Materialnummer, Datei …",
      tabs: { Suche: "search", Scan: "scan", Merkliste: "bookmark", Dateien: "folder" },
    },
    smartparts: {
      name: "WK SmartParts",
      nav: [["dashboard", "Dashboard", "grid"], ["datenqualitaet", "Datenqualität", "check"], ["bestand", "Bestand & Risiko", "pulse"], ["kosten", "Kosten & Preise", "tag"], ["lieferanten", "Lieferanten", "building"], ["materialien", "Materialien", "database"], ["governance", "Governance & Reporting", "shield"], ["import", "Datenimport", "download"]],
      search: "Material, Hersteller, Lieferant …",
      tabs: { Suche: "search", Scan: "scan", Meldungen: "bell", Merkliste: "bookmark" },
    },
  };

  function icon(name, cls) {
    return '<svg class="' + (cls || "ico") + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (I[name] || "") + "</svg>";
  }
  var MARK = "../../assets/logo-mark.webp";

  var body = document.body;
  var app = APPS[body.getAttribute("data-app")];
  if (!app) return;

  if (body.classList.contains("mobile")) {
    var status = body.querySelector(".status-bar");
    var bar = document.createElement("div");
    bar.className = "m-appbar";
    bar.innerHTML = '<img src="' + MARK + '" alt="" /><b>' + app.name + '</b><span class="spacer"></span>' + icon("search") + '<span class="bell">' + icon("bell") + "</span>";
    if (status) status.insertAdjacentElement("afterend", bar);
    Array.prototype.forEach.call(body.querySelectorAll(".tabbar span"), function (tab) {
      var name = app.tabs[tab.textContent.trim()];
      var i = tab.querySelector("i");
      if (i && name) i.outerHTML = icon(name, "ico tab-ico");
    });
    return;
  }

  body.classList.add("shell");
  var appbar = body.querySelector(".appbar");
  var crumb = appbar ? appbar.querySelector(".crumb") : null;
  var crumbHtml = crumb ? crumb.innerHTML : "";
  if (appbar) appbar.remove();

  var active = body.getAttribute("data-nav");
  var side = document.createElement("aside");
  side.className = "side";
  side.innerHTML =
    '<div class="brand"><img src="' + MARK + '" alt="" /><span>' + app.name + "</span></div>" +
    '<div class="nav-label">Bereiche</div>' +
    '<nav class="nav">' +
    app.nav.map(function (n) {
      return '<span class="nav-item' + (n[0] === active ? " on" : "") + '">' + icon(n[2]) + "<span>" + n[1] + "</span></span>";
    }).join("") +
    "</nav>" +
    '<div class="side-foot"><span class="nav-item">' + icon("sliders") + "<span>Einstellungen</span></span>" +
    '<span class="nav-item">' + icon("help") + "<span>Hilfe</span></span>" +
    '<div class="version">Version 2.4 · Werk 1</div></div>';

  var top = document.createElement("header");
  top.className = "topbar";
  top.innerHTML =
    '<span class="crumb">' + crumbHtml + "</span>" +
    '<span class="spacer"></span>' +
    '<span class="search">' + icon("search") + "<span>" + app.search + "</span><kbd>Strg K</kbd></span>" +
    '<span class="tb-icon">' + icon("bell") + "</span>" +
    '<span class="demo">Beispieldaten</span>';

  body.insertBefore(top, body.firstChild);
  body.insertBefore(side, body.firstChild);
})();
