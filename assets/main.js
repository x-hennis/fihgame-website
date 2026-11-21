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

  /* ---- the start picture moves: an animated picture that loops without a jump (AVIF, or WebP
     where a browser has no AVIF), laid over the still one once it has come in whole. Not with
     reduced motion or a data saver; without it (or without JavaScript) the still stays, which is
     the loop's first picture ---- */
  var loopPic = document.querySelector(".hero__vid");
  var saver = navigator.connection && navigator.connection.saveData;
  if (loopPic && data.hero && !calm && !saver) {
    var tall = window.matchMedia("(max-aspect-ratio: 4/5)").matches;
    var cut = tall ? "tall" : (window.innerWidth * (window.devicePixelRatio || 1) > 1500 ? "wide" : "wide_s");
    var pic = document.createElement("picture"), avif = document.createElement("source");
    avif.type = "image/avif";
    avif.srcset = data.hero + cut + ".avif?v=" + data.v;
    loopPic.parentNode.insertBefore(pic, loopPic);
    pic.appendChild(avif);
    pic.appendChild(loopPic);
    loopPic.addEventListener("load", function () { loopPic.classList.add("on"); }, { once: true });
    loopPic.src = data.hero + (cut === "wide" ? "wide_s" : cut) + ".webp?v=" + data.v;
  }

  /* ---- the paper Reef Emperor talks: when he is reached his text runs in letter by letter (the
     game's timing: 55 letters a second, a stop after a comma or a full stop) while his mouth opens
     and shuts every syllable. The bubble keeps its size from the start (the rest of the text
     waits invisible), so nothing on the page moves ---- */
  var CPS = 55, SYLLABLE = 0.115, PAUSES = { ",": 0.14, ".": 0.30, "!": 0.30, "?": 0.30, ":": 0.18,
    "、": 0.14, "。": 0.30, "！": 0.30, "？": 0.30, "，": 0.14, "：": 0.18 };
  function talk(h) {
    var say = h.querySelector(".host__say");
    var text = say.textContent, chars = Array.from(text);
    var done = document.createElement("span"), rest = document.createElement("span");
    rest.className = "host__rest";
    say.textContent = ""; say.appendChild(done); say.appendChild(rest);
    say.setAttribute("aria-label", text);
    h.classList.add("talk");
    var i = 0, mouthT = 0, last = performance.now(), wait = 0.3;
    function step(now) {
      var dt = Math.min(0.1, (now - last) / 1000); last = now;
      wait -= dt;
      while (wait <= 0 && i < chars.length) {
        var c = chars[i++];
        wait += 1 / CPS + (PAUSES[c] && i < chars.length ? PAUSES[c] : 0);
      }
      done.textContent = chars.slice(0, i).join("");
      rest.textContent = chars.slice(i).join("");
      var prev = chars[i - 1] || " ";
      var talking = i < chars.length && !PAUSES[prev] && prev !== " ";
      mouthT += dt;
      if (talking && mouthT >= SYLLABLE) { mouthT = 0; h.classList.toggle("mouth"); }
      if (!talking) h.classList.remove("mouth");
      if (i < chars.length || wait > 0) requestAnimationFrame(step);
      else h.classList.remove("mouth");
    }
    requestAnimationFrame(step);
  }
  var hosts = document.querySelectorAll("[data-host]");
  if (hosts.length && "IntersectionObserver" in window && !calm) {
    var hostSeen = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        hostSeen.unobserve(e.target);
        setTimeout(function () { talk(e.target); }, 450);    // (after he has come up)
      });
    }, { rootMargin: "0px 0px -18% 0px", threshold: 0.6 });
    hosts.forEach(function (h) { hostSeen.observe(h); });
  } else {
    hosts.forEach(function (h) { h.classList.add("talk"); });
  }

  /* ---- meet the fish: a tile or the normal / Shiny buttons put that fish on the stage; until
     the visitor picks one the stage shows the next fish every few seconds while it is in sight ---- */
  var stage = document.querySelector(".meet__stage");
  var meetJson = document.getElementById("meet-data");
  if (stage && meetJson) {
    var md = JSON.parse(meetJson.textContent);
    var mImg = stage.querySelector(".meet__img"), mCard = stage.querySelector(".meet__card");
    var tiles = Array.prototype.slice.call(document.querySelectorAll(".meet__tile"));
    var forms = Array.prototype.slice.call(stage.querySelectorAll(".meet__form"));
    var base = mImg.getAttribute("src").replace(/[^/]+\.webp.*$/, "");
    var ver = (mImg.getAttribute("src").match(/\?v=.*$/) || [""])[0];
    var at = Math.max(0, tiles.findIndex(function (b) { return b.classList.contains("on"); })), shiny = false, picked = false, busy = 0;
    function put(k, sh) {
      var f = md.fish[k];
      sh = sh && f.s;
      var src = base + f.id + (sh ? "_shiny" : "") + ".webp" + ver;
      var token = ++busy;
      mImg.classList.add("out"); mCard.classList.add("out");
      var pre = new Image();
      pre.onload = pre.onerror = function () {
        if (token !== busy) return;
        setTimeout(function () {
          mImg.src = src; mImg.alt = f.n;
          var r = md.rar[f.r];
          var rar = mCard.querySelector(".meet__rar");
          rar.textContent = r[0]; rar.style.setProperty("--rc", r[1]);
          var el = mCard.querySelector(".meet__el");
          el.querySelector("img").src = base.replace(/fish3d\/$/, "ui/elements/") + f.e + ".svg" + ver;
          el.lastChild.textContent = md.el[f.e];
          mCard.querySelector(".meet__name").textContent = f.n;
          mCard.querySelector(".meet__desc").textContent = f.d;
          mCard.querySelector(".meet__fact span").textContent = f.f;
          forms.forEach(function (b) { b.setAttribute("aria-pressed", String((b.dataset.shiny === "1") === sh)); });
          forms[1].hidden = !f.s;
          mImg.classList.remove("out"); mCard.classList.remove("out");
        }, 180);
      };
      pre.src = src;
      tiles.forEach(function (b, j) { b.classList.toggle("on", j === k); if (j === k) b.setAttribute("aria-current", "true"); else b.removeAttribute("aria-current"); });
      at = k; shiny = sh;
    }
    tiles.forEach(function (b, j) { b.addEventListener("click", function () { picked = true; put(j, shiny); }); });
    forms.forEach(function (b) { b.addEventListener("click", function () { picked = true; put(at, b.dataset.shiny === "1"); }); });
    if (!calm && "IntersectionObserver" in window) {
      var inSight = false;
      new IntersectionObserver(function (es) { inSight = es[0].isIntersecting; }, { threshold: 0.4 }).observe(stage);
      setInterval(function () { if (inSight && !picked && !document.hidden) put((at + 1) % md.fish.length, false); }, 5200);
    }
  }

  /* ---- the trailers: three to pick, the first one plays by default; big screens get the sharp file ---- */
  var tabBtns = Array.prototype.slice.call(document.querySelectorAll(".tabs__b"));
  var sharp = function () { return window.innerWidth * (window.devicePixelRatio || 1) > 1700; };

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
    var chosen = tabBtns[0];
    var load = function (btn) {
      var src = sharp() ? btn.dataset.hd : btn.dataset.src;
      if (video.currentSrc.indexOf(src.split("?")[0]) < 0) { video.src = src; }
    };
    play.addEventListener("click", function () {
      if (chosen) load(chosen);
      holder.classList.add("is-playing");
      video.controls = true;
      video.play();
    });
    tabBtns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        if (btn === chosen) return;
        chosen = btn;
        tabBtns.forEach(function (b) { b.setAttribute("aria-pressed", String(b === btn)); });
        video.pause();
        video.poster = btn.dataset.poster;
        load(btn);
        holder.classList.add("is-playing");
        video.controls = true;
        var p = video.play(); if (p && p.catch) p.catch(function () {});
      });
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
