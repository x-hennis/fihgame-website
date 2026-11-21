/* FIH website: the sea gets deeper with the page (the game's ten depth zones), bubbles rise,
   things come in when you reach them, the trailer plays, the pictures open big.
   No cookies, no tracking, nothing loaded from other servers. */
(function () {
  "use strict";
  var root = document.documentElement;
  var data = { zones: [] };
  try { data = JSON.parse(document.getElementById("fih-data").textContent); } catch (e) {}
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

  /* ---- the start picture moves: a loop without a jump, on a computer an animated picture (AVIF,
     or WebP where a browser has no AVIF), on a phone or tablet a video (below), laid over the
     still one once it has come in whole. Not with
     reduced motion or a data saver; without it (or without JavaScript) the still stays, which is
     the loop's first picture ---- */
  var loopPic = document.querySelector(".hero__vid");
  var saver = navigator.connection && navigator.connection.saveData;
  var touch = window.matchMedia("(pointer: coarse)").matches;
  var tall = window.matchMedia("(max-aspect-ratio: 4/5)").matches;
  var vid = document.createElement("video");
  if (loopPic && data.hero && !calm && !saver && (touch || tall) && vid.canPlayType('video/mp4; codecs="avc1.640028"')) {
    /* phones and tablets: the loop as a video, which their video chip plays (as an animated
       picture it stuttered on a phone); it rests while the start is out of sight, and where a
       phone plays nothing by itself (a power saver) the still stays */
    vid.className = "hero__vid";
    vid.muted = vid.defaultMuted = vid.loop = vid.playsInline = vid.autoplay = true;
    ["muted", "playsinline", "autoplay", "loop", "disablepictureinpicture"].forEach(function (a) { vid.setAttribute(a, ""); });
    vid.setAttribute("aria-hidden", "true");
    vid.tabIndex = -1;
    vid.preload = "auto";
    vid.addEventListener("playing", function () { vid.classList.add("on"); }, { once: true });
    vid.src = data.hero + (tall ? "tall" : "wide_s") + ".mp4?v=" + data.v;
    loopPic.parentNode.replaceChild(vid, loopPic);
    var go = function () { var p = vid.play(); if (p && p.catch) p.catch(function () {}); };
    go();
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (es) { if (es[0].isIntersecting) go(); else vid.pause(); }).observe(vid);
    }
  } else if (loopPic && data.hero && !calm && !saver) {
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
    // the stage keeps one size whatever fish stands on it (owner, 2026-11-21: the list under it
    // jumped with every fish): the card is as tall as the longest text of any fish needs
    var sizeCard = function () {
      var probe = mCard.cloneNode(true);
      probe.setAttribute("aria-hidden", "true");
      probe.style.cssText = "position:absolute;visibility:hidden;left:0;top:0;min-height:0;width:" + mCard.getBoundingClientRect().width + "px";
      stage.appendChild(probe);
      var tallest = 0;
      md.fish.forEach(function (f) {
        probe.querySelector(".meet__name").textContent = f.n;
        probe.querySelector(".meet__desc").textContent = f.d;
        probe.querySelector(".meet__fact span").textContent = f.f;
        tallest = Math.max(tallest, probe.getBoundingClientRect().height);
      });
      probe.remove();
      mCard.style.minHeight = Math.ceil(tallest) + "px";
    };
    sizeCard();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(sizeCard);
    var sizeT = 0;
    window.addEventListener("resize", function () { clearTimeout(sizeT); sizeT = setTimeout(sizeCard, 150); });
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

  /* ---- a picture that fails to come in (a host that hiccups right after an upload) is asked
     for once more a moment later ---- */
  document.addEventListener("error", function (e) {
    var im = e.target;
    if (!im || im.tagName !== "IMG" || im.dataset.retried || !im.getAttribute("src")) return;
    im.dataset.retried = "1";
    setTimeout(function () { var u = im.getAttribute("src"); im.src = u + (u.indexOf("?") < 0 ? "?" : "&") + "r=1"; }, 1500);
  }, true);

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

  /* ---- the privacy settings (the only thing they cover is YouTube; the choice itself is kept in
     this browser, nothing else is stored): shown until a choice is saved, open again from the
     footer. "Only necessary" and "Allow all" weigh the same; nothing optional is on before. ---- */
  var CKEY = "fih-consent", CVER = 1;
  var consent = null;
  try { var c0 = JSON.parse(localStorage.getItem(CKEY) || "null"); if (c0 && c0.v === CVER) consent = c0; } catch (e) {}
  var cbox = document.getElementById("consent");
  var ytOn = function () { return !!(consent && consent.yt); };
  var saveConsent = function (yt) {
    consent = { v: CVER, yt: !!yt, at: new Date().toISOString() };
    try { localStorage.setItem(CKEY, JSON.stringify(consent)); } catch (e) {}
    document.dispatchEvent(new CustomEvent("fih-consent"));
  };
  if (cbox) {
    var copts = cbox.querySelector(".consent__opts"), cyt = cbox.querySelector('input[name="yt"]');
    var cbtn = function (k) { return cbox.querySelector('[data-c="' + k + '"]'); };
    var openBox = function (details) {
      cbox.hidden = false;
      copts.hidden = !details;
      cbtn("save").hidden = !details;
      cbtn("settings").hidden = !!details;
      cyt.checked = ytOn();
      // (the box itself takes the focus, so Tab goes on to its buttons; a ring round the first
      // button before anyone used the keyboard looked like a fault)
      (details ? cyt : cbox).focus({ preventScroll: true });
    };
    var closeBox = function () { cbox.hidden = true; };
    cbtn("necessary").addEventListener("click", function () { saveConsent(false); closeBox(); });
    cbtn("all").addEventListener("click", function () { saveConsent(true); closeBox(); });
    cbtn("settings").addEventListener("click", function () { openBox(true); });
    cbtn("save").addEventListener("click", function () { saveConsent(cyt.checked); closeBox(); });
    document.querySelectorAll("[data-consent-open]").forEach(function (b) { b.addEventListener("click", function () { openBox(true); }); });
    if (!consent) openBox(false);
  }

  /* ---- the trailer: three to pick. The tour is the one on YouTube: it is embedded only with
     consent (saved, or given in the notice right in the player); without it the notice offers
     to load it once, or to watch the site's own file ---- */
  var holder = document.querySelector(".shot--video");
  if (holder) {
    var video = holder.querySelector("video");
    var play = holder.querySelector(".shot__play");
    var ytBox = holder.querySelector(".yt");
    var chosen = tabBtns[0];
    var frame = null;
    var load = function (btn) {
      var src = sharp() ? btn.dataset.hd : btn.dataset.src;
      if (video.currentSrc.indexOf(src.split("?")[0]) < 0) { video.src = src; }
    };
    var dropYT = function () {
      if (frame) { frame.remove(); frame = null; }
      holder.classList.remove("is-yt");
      if (ytBox) ytBox.hidden = true;
    };
    var embedYT = function () {
      dropYT();
      video.pause();
      frame = document.createElement("iframe");
      frame.className = "shot__img shot__yt";
      frame.src = data.yt + "?autoplay=1&rel=0&playsinline=1";
      frame.title = video.getAttribute("aria-label") || "FIH";
      frame.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
      frame.referrerPolicy = "strict-origin-when-cross-origin";
      holder.insertBefore(frame, video.nextSibling);
      holder.classList.add("is-playing", "is-yt");
      if (music.on) musicLevel(0, 0.5);
    };
    var playLocal = function (btn) {
      dropYT();
      load(btn);
      holder.classList.add("is-playing");
      video.controls = true;
      var p = video.play(); if (p && p.catch) p.catch(function () {});
    };
    var start = function (btn) {
      if (btn && btn.dataset.yt && ytBox) {
        if (ytOn()) { embedYT(); return; }
        dropYT();
        video.pause();
        holder.classList.add("is-playing");
        ytBox.hidden = false;
        ytBox.querySelector('[data-yt="load"]').focus({ preventScroll: true });
        return;
      }
      playLocal(btn);
    };
    play.addEventListener("click", function () { start(chosen); });
    if (ytBox) {
      ytBox.querySelector('[data-yt="load"]').addEventListener("click", function () {
        if (ytBox.querySelector(".yt__always input").checked) saveConsent(true);
        embedYT();
      });
      ytBox.querySelector('[data-yt="local"]').addEventListener("click", function () { playLocal(chosen); });
    }
    // consent taken back: the embedded player goes at once
    document.addEventListener("fih-consent", function () { if (frame && !ytOn()) { dropYT(); holder.classList.remove("is-playing"); } });
    tabBtns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        if (btn === chosen) return;
        chosen = btn;
        tabBtns.forEach(function (b) { b.setAttribute("aria-pressed", String(b === btn)); });
        video.pause();
        video.poster = btn.dataset.poster;
        start(btn);
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
