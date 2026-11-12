/* FIH website: the sea gets deeper with the page (the game's ten depth zones), bubbles rise,
   things come in when you reach them, the trailer plays, the pictures open big.
   No cookies, no tracking, nothing loaded from other servers. */
(function () {
  "use strict";
  var root = document.documentElement;
  var data = window.FIH || { zones: [] };
  var calm = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  root.classList.add("js");

  /* ---- the sea: colour, light and the depth gauge ---- */
  var zones = data.zones.map(function (z) { return { name: z.name, water: rgb(z.water) }; });
  var gauge = document.querySelector(".gauge");
  var gNum = gauge && gauge.querySelector(".gauge__num");
  var gZone = gauge && gauge.querySelector(".gauge__zone");
  var isHome = document.body.classList.contains("home");
  var layers = document.querySelectorAll(".sea__zone");   // a soft picture of every zone, the deeper ones on top
  var queued = false;

  function rgb(hex) { var n = parseInt(hex.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
  function mix(a, b, t) { return "rgb(" + a.map(function (v, i) { return Math.round(v + (b[i] - v) * t); }).join(",") + ")"; }

  function sea() {
    queued = false;
    if (!zones.length) return;
    var max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    var p = isHome ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
    var n = zones.length;
    var f = Math.min(n - 1, Math.max(0, p * n - 0.5));       // every zone has its own stretch of the page
    var i = Math.min(n - 2, Math.floor(f)), t = f - i;
    t = Math.min(1, Math.max(0, (t - 0.3) / 0.4)); t = t * t * (3 - 2 * t);   // a zone keeps its colour, then turns quickly
    root.style.setProperty("--water", mix(zones[i].water, zones[i + 1].water, t));
    for (var k = 0; k < layers.length; k++) layers[k].style.opacity = k <= i ? 1 : k === i + 1 ? t.toFixed(3) : 0;
    root.style.setProperty("--light", Math.max(0, 1 - p * 1.25).toFixed(3));
    document.body.classList.toggle("scrolled", window.scrollY > 60);
    if (gauge && isHome) {
      var depth = Math.max(1, Math.round(p * 400));          // the game has 400 depths, 40 a zone
      gNum.textContent = depth;
      gZone.textContent = zones[Math.min(n - 1, Math.floor((depth - 1) / 40))].name;
      gauge.classList.toggle("on", window.scrollY > window.innerHeight * 0.55);
    }
  }
  function queue() { if (!queued) { queued = true; requestAnimationFrame(sea); } }
  window.addEventListener("scroll", queue, { passive: true });
  window.addEventListener("resize", queue);
  window.addEventListener("load", queue);
  sea();

  /* ---- the language menu closes on a click beside it and on Escape ---- */
  var menu = document.querySelector(".lang");
  if (menu) {
    document.addEventListener("click", function (e) { if (menu.open && !menu.contains(e.target)) menu.open = false; });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && menu.open) { menu.open = false; menu.querySelector("summary").focus(); } });
  }

  /* ---- the start picture moves: a silent loop over the still one. Not with reduced motion or a
     data saver, and it rests while it is out of sight; if it cannot play the still stays ---- */
  var vid = document.querySelector(".hero__vid");
  var saver = navigator.connection && navigator.connection.saveData;
  if (vid && data.hero && !calm && !saver && vid.canPlayType) {
    var tall = window.matchMedia("(max-aspect-ratio: 4/5)").matches;
    var cut = tall ? "tall" : (window.innerWidth * (window.devicePixelRatio || 1) > 1500 ? "wide" : "wide_s");
    vid.muted = true;
    vid.src = data.hero + cut + ".mp4";
    vid.addEventListener("playing", function () { vid.classList.add("on"); }, { once: true });
    var tryPlay = function () { var p = vid.play(); if (p && p.catch) p.catch(function () {}); };
    tryPlay();
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (es) { if (es[0].isIntersecting) tryPlay(); else vid.pause(); }, { threshold: 0.05 }).observe(vid);
    }
  }

  /* ---- bubbles ---- */
  var box = document.querySelector(".sea__bubbles");
  if (box && !calm && data.bubble) {
    var count = window.innerWidth < 700 ? 8 : 16;
    for (var b = 0; b < count; b++) {
      var im = new Image();
      im.src = data.bubble; im.alt = "";
      var size = 10 + Math.random() * 30;
      im.style.setProperty("--x", (Math.random() * 100).toFixed(1) + "%");
      im.style.setProperty("--s", size.toFixed(0) + "px");
      im.style.setProperty("--t", (14 + Math.random() * 16).toFixed(1) + "s");
      im.style.setProperty("--d", (-Math.random() * 30).toFixed(1) + "s");
      im.style.setProperty("--w", ((Math.random() - 0.5) * 60).toFixed(0) + "px");
      box.appendChild(im);
    }
  }

  /* ---- things come in when you reach them ---- */
  var items = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !calm) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    items.forEach(function (el) { io.observe(el); });
  } else {
    items.forEach(function (el) { el.classList.add("in"); });
  }

  /* ---- the reef's music: starts on a click, loops without a gap (Web Audio), steps back for the trailer ---- */
  var mBtn = document.querySelector(".music");
  var AC = window.AudioContext || window.webkitAudioContext;
  var music = { on: false, ctx: null, gain: null, loading: false };
  function musicLevel(v, secs) {
    if (!music.gain) return;
    var t = music.ctx.currentTime;
    music.gain.gain.cancelScheduledValues(t);
    music.gain.gain.setValueAtTime(music.gain.gain.value, t);
    music.gain.gain.linearRampToValueAtTime(v, t + secs);
  }
  function musicStart() {
    if (music.ctx) { music.ctx.resume(); musicLevel(0.7, 1.2); return; }
    if (music.loading) return;
    music.loading = true;
    music.ctx = new AC();
    music.gain = music.ctx.createGain();
    music.gain.gain.value = 0;
    music.gain.connect(music.ctx.destination);
    var probe = document.createElement("audio");
    var url = probe.canPlayType('audio/ogg; codecs="opus"') ? data.music[0] : data.music[1];
    fetch(url).then(function (r) { return r.arrayBuffer(); }).then(function (buf) {
      return new Promise(function (ok, bad) { music.ctx.decodeAudioData(buf, ok, bad); });
    }).then(function (audio) {
      var src = music.ctx.createBufferSource();
      src.buffer = audio; src.loop = true;
      src.connect(music.gain); src.start();
      if (music.on) musicLevel(0.7, 1.5);
    }).catch(function () { music.on = false; mBtn.setAttribute("aria-pressed", "false"); });
  }
  function musicStop() {
    if (!music.ctx) return;
    musicLevel(0, 0.6);
    setTimeout(function () { if (!music.on && music.ctx) music.ctx.suspend(); }, 700);
  }
  if (mBtn && AC && data.music) {
    mBtn.addEventListener("click", function () {
      music.on = !music.on;
      mBtn.setAttribute("aria-pressed", music.on ? "true" : "false");
      if (music.on) musicStart(); else musicStop();
    });
  } else if (mBtn) {
    mBtn.hidden = true;
  }

  /* ---- the trailer ---- */
  var holder = document.querySelector(".shot--video");
  if (holder) {
    var video = holder.querySelector("video");
    var play = holder.querySelector(".shot__play");
    play.addEventListener("click", function () {
      holder.classList.add("is-playing");
      video.controls = true;
      video.play();
    });
    video.addEventListener("ended", function () { holder.classList.remove("is-playing"); video.controls = false; });
    // the trailer has its own sound: the reef's music waits meanwhile
    video.addEventListener("play", function () { if (music.on) musicLevel(0, 0.5); });
    ["pause", "ended"].forEach(function (ev) { video.addEventListener(ev, function () { if (music.on) musicLevel(0.7, 1.2); }); });
  }

  /* ---- the pictures, big ---- */
  var links = Array.prototype.slice.call(document.querySelectorAll(".gallery__item"));
  if (links.length && window.HTMLDialogElement) {
    var dlg = document.createElement("dialog");
    dlg.className = "lightbox";
    dlg.innerHTML = '<img alt="">' +
      '<button class="lightbox__prev" type="button" aria-label="' + data.prev + '">&#8249;</button>' +
      '<button class="lightbox__next" type="button" aria-label="' + data.next + '">&#8250;</button>' +
      '<button class="lightbox__close" type="button" aria-label="' + data.close + '">&#215;</button>';
    document.body.appendChild(dlg);
    var big = dlg.querySelector("img"), at = 0;
    var show = function (k) {
      at = (k + links.length) % links.length;
      big.src = links[at].href;
      big.alt = links[at].querySelector("img").alt;
    };
    links.forEach(function (a, k) {
      a.addEventListener("click", function (e) { e.preventDefault(); show(k); dlg.showModal(); });
    });
    dlg.querySelector(".lightbox__prev").addEventListener("click", function () { show(at - 1); });
    dlg.querySelector(".lightbox__next").addEventListener("click", function () { show(at + 1); });
    dlg.querySelector(".lightbox__close").addEventListener("click", function () { dlg.close(); });
    dlg.addEventListener("click", function (e) { if (e.target === dlg) dlg.close(); });
    dlg.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft") show(at - 1);
      if (e.key === "ArrowRight") show(at + 1);
    });
  }
})();
