/* ============================================================
   ПОСЛЕДНИЙ БУКЕТ — логика
   Ничего здесь менять не нужно. Все тексты — в js/data.js
   ============================================================ */
(function () {
  "use strict";

  const $  = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ============================================================
     ПЛАВНАЯ ПРОКРУТКА (инерция)
     Включается только для мыши/тачпада. На телефоне своя,
     родная инерция — её трогать нельзя.
     ============================================================ */
  const finePointer = matchMedia("(hover:hover) and (pointer:fine)").matches;
  const smoothOn = !reduced && finePointer;
  let sTarget = 0;
  let sRunning = false;

  const maxScroll = () =>
    Math.max(0, document.documentElement.scrollHeight - innerHeight);

  function sLoop() {
    const diff = sTarget - window.scrollY;
    if (Math.abs(diff) < 0.5) {
      window.scrollTo(0, sTarget);
      sRunning = false;
      return;
    }
    window.scrollTo(0, window.scrollY + diff * 0.11); // мягкость хода
    requestAnimationFrame(sLoop);
  }

  /* единая точка перехода: работает и с инерцией, и без неё */
  function goTo(y) {
    y = Math.max(0, Math.min(maxScroll(), y));
    if (smoothOn) {
      sTarget = y;
      if (!sRunning) { sRunning = true; requestAnimationFrame(sLoop); }
    } else {
      window.scrollTo({ top: y, behavior: reduced ? "auto" : "smooth" });
    }
  }

  if (smoothOn) {
    document.documentElement.style.scrollBehavior = "auto"; // чтобы не смягчать дважды
    sTarget = window.scrollY;

    addEventListener("wheel", (e) => {
      if (e.ctrlKey) return;                                   // это масштаб, не прокрутка
      if (document.hidden) return;                             // вкладка не на виду — кадры спят
      if (document.body.classList.contains("is-locked")) return; // открыт просмотр фото
      e.preventDefault();
      if (!sRunning) sTarget = window.scrollY;
      const k = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? innerHeight : 1;
      sTarget = Math.max(0, Math.min(maxScroll(), sTarget + e.deltaY * k));
      if (!sRunning) { sRunning = true; requestAnimationFrame(sLoop); }
    }, { passive: false });

    /* прокрутили клавишами или колёсиком мыши по полосе — не спорим */
    addEventListener("scroll", () => { if (!sRunning) sTarget = window.scrollY; }, { passive: true });
  }

  /* ссылки-якоря ведут плавно */
  $$('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const t = document.querySelector(a.getAttribute("href"));
      if (!t) return;
      e.preventDefault();
      goTo(t.getBoundingClientRect().top + window.scrollY);
    });
  });

  /* ---------- достаём значение по пути "letter.title" ---------- */
  function pick(path) {
    return path.split(".").reduce((o, k) => (o == null ? o : o[k]), LOVE);
  }

  /* ---------- подстановка текста ---------- */
  $$("[data-bind]").forEach((el) => {
    const v = pick(el.dataset.bind);
    if (typeof v === "string") el.textContent = v;
  });
  document.title = (LOVE.herDative || LOVE.her) + " — последний букет";

  /* ---------- картинка: заглушка вместо «битого» файла ---------- */
  function guard(img, file) {
    img.addEventListener("error", () => {
      const box = img.parentElement;
      if (!box) return;
      img.remove();
      const ph = document.createElement("div");
      ph.className = "ph";
      ph.innerHTML =
        '<span class="ph__icon">&#9634;</span><span class="ph__name">' +
        file +
        "</span><span class=\"ph__hint\">положи сюда фото</span>";
      box.appendChild(ph);
    });
  }

  function photo(src, alt, cls) {
    const img = document.createElement("img");
    img.className = cls || "";
    img.alt = alt || "";
    img.loading = "lazy";
    img.decoding = "async";
    guard(img, src);
    img.src = src;
    return img;
  }

  /* ============================================================
     ПЕРВЫЙ ЭКРАН
     ============================================================ */
  const heroSrc =
    (LOVE.story.chapters[0] && LOVE.story.chapters[0].photo) ||
    (LOVE.gallery.items[0] && LOVE.gallery.items[0].photo);
  const heroImg = $("#heroImg");
  if (heroSrc && heroImg) {
    guard(heroImg, heroSrc);
    heroImg.src = heroSrc;
  }

  /* ============================================================
     ВСТУПЛЕНИЕ
     ============================================================ */
  const introBox = $("#introLines");
  LOVE.intro.lines.forEach((line, i) => {
    const p = document.createElement("p");
    p.textContent = line;
    p.setAttribute("data-reveal", "");
    p.style.setProperty("--d", i * 140 + "ms");
    introBox.appendChild(p);
  });

  /* ============================================================
     ИСТОРИЯ
     ============================================================ */
  const storyBox = $("#storyList");
  LOVE.story.chapters.forEach((ch) => {
    const art = document.createElement("article");
    art.className = "chapter";

    const media = document.createElement("div");
    media.className = "chapter__media";
    media.setAttribute("data-reveal", "left");
    const shot = photo(ch.photo, ch.alt || ch.title);
    shot.setAttribute("data-parallax", "");
    media.appendChild(shot);

    const body = document.createElement("div");
    body.className = "chapter__body";
    body.setAttribute("data-reveal", "right");
    body.style.setProperty("--d", "140ms");
    body.innerHTML =
      '<p class="chapter__num"></p><h3 class="chapter__title"></h3><p class="chapter__text"></p>';
    $(".chapter__num", body).textContent = ch.date;
    $(".chapter__title", body).textContent = ch.title;
    $(".chapter__text", body).textContent = ch.text;

    art.append(media, body);
    storyBox.appendChild(art);
  });

  /* ============================================================
     ГАЛЕРЕЯ + ПРОСМОТР ФОТО
     ============================================================ */
  const grid = $("#galleryGrid");
  const shots = LOVE.gallery.items;

  shots.forEach((item, i) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "tile";
    btn.setAttribute("data-reveal", "");
    btn.style.setProperty("--d", (i % 4) * 90 + "ms");
    btn.setAttribute("aria-label", "Открыть фото: " + (item.caption || ""));
    btn.appendChild(photo(item.photo, item.caption));
    if (item.caption) {
      const cap = document.createElement("span");
      cap.className = "tile__cap";
      cap.textContent = item.caption;
      btn.appendChild(cap);
    }
    btn.addEventListener("click", () => openBox(i));
    grid.appendChild(btn);
  });

  const box = $("#lightbox");
  const lbImg = $("#lbImg");
  const lbCap = $("#lbCap");
  let idx = 0;
  let lastFocus = null;

  function show(i) {
    idx = (i + shots.length) % shots.length;
    lbImg.src = shots[idx].photo;
    lbImg.alt = shots[idx].caption || "";
    lbCap.textContent = shots[idx].caption || "";
  }
  function openBox(i) {
    lastFocus = document.activeElement;
    box.hidden = false;
    document.body.classList.add("is-locked");
    show(i);
    $("#lbClose").focus();
  }
  function closeBox() {
    box.hidden = true;
    document.body.classList.remove("is-locked");
    if (lastFocus) lastFocus.focus();
  }

  $("#lbClose").addEventListener("click", closeBox);
  $("#lbPrev").addEventListener("click", () => show(idx - 1));
  $("#lbNext").addEventListener("click", () => show(idx + 1));
  box.addEventListener("click", (e) => {
    if (e.target === box || e.target.classList.contains("lb__figure")) closeBox();
  });
  document.addEventListener("keydown", (e) => {
    if (box.hidden) return;
    if (e.key === "Escape") closeBox();
    if (e.key === "ArrowLeft") show(idx - 1);
    if (e.key === "ArrowRight") show(idx + 1);
  });

  /* свайп на телефоне */
  let touchX = null;
  box.addEventListener("touchstart", (e) => { touchX = e.changedTouches[0].clientX; }, { passive: true });
  box.addEventListener("touchend", (e) => {
    if (touchX === null) return;
    const dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 45) show(dx > 0 ? idx - 1 : idx + 1);
    touchX = null;
  }, { passive: true });

  /* ============================================================
     ПИСЬМО
     ============================================================ */
  const letterBody = $("#letterBody");
  LOVE.letter.body.forEach((t) => {
    const p = document.createElement("p");
    p.textContent = t;
    letterBody.appendChild(p);
  });

  const env = $("#envelope");
  const sheet = $("#letterSheet");
  function openLetter() {
    if (!sheet.hidden) return;
    env.classList.add("is-open");
    env.setAttribute("aria-expanded", "true");
    sheet.hidden = false;
    setTimeout(() => {
      goTo(sheet.getBoundingClientRect().top + window.scrollY - 28);
    }, 420);
  }
  env.addEventListener("click", openLetter);
  env.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openLetter(); }
  });

  /* ============================================================
     БУКЕТ
     ============================================================ */
  const bqBox = $("#bouquetLines");
  LOVE.bouquet.lines.forEach((t) => {
    const p = document.createElement("p");
    p.textContent = t;
    bqBox.appendChild(p);
  });

  /* лепестки цветов рисуем программно */
  const petalTones = ["#e0a9a4", "#d59a97", "#c98d8d", "#e6b7ad", "#cf9490"];
  $$(".bloom").forEach((g, i) => {
    g.style.setProperty("--pf", petalTones[i % petalTones.length]);
    g.style.setProperty("--d", 600 + i * 130 + "ms");
    const n = 7;
    for (let p = 0; p < n; p++) {
      const el = document.createElementNS("http://www.w3.org/2000/svg", "ellipse");
      el.setAttribute("class", "petal");
      el.setAttribute("rx", "13");
      el.setAttribute("ry", "26");
      el.setAttribute("cy", "-17");
      el.setAttribute("transform", "rotate(" + (p * 360) / n + ")");
      g.appendChild(el);
    }
    for (let p = 0; p < 5; p++) {
      const el = document.createElementNS("http://www.w3.org/2000/svg", "ellipse");
      el.setAttribute("class", "petal");
      el.setAttribute("rx", "8");
      el.setAttribute("ry", "15");
      el.setAttribute("cy", "-9");
      el.setAttribute("opacity", ".85");
      el.setAttribute("transform", "rotate(" + ((p * 360) / 5 + 36) + ")");
      g.appendChild(el);
    }
    const core = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    core.setAttribute("class", "core");
    core.setAttribute("r", "7");
    g.appendChild(core);
  });

  /* стебли «прорастают» */
  $$(".stems path").forEach((p, i) => {
    const len = Math.ceil(p.getTotalLength());
    p.style.setProperty("--len", len);
    p.style.setProperty("--d", i * 110 + "ms");
  });
  $(".bouquet__art").setAttribute("data-reveal", "");
  $(".bouquet__text").setAttribute("data-reveal", "");

  /* ============================================================
     ОБЕЩАНИЯ
     ============================================================ */
  const vowsBox = $("#vowsList");
  LOVE.vows.items.forEach((t, i) => {
    const li = document.createElement("li");
    li.textContent = t;
    li.setAttribute("data-reveal", "");
    li.style.setProperty("--d", i * 80 + "ms");
    vowsBox.appendChild(li);
  });

  /* ============================================================
     СЧЁТЧИК
     ============================================================ */
  const wedding = new Date(LOVE.weddingDate);
  const since = new Date(LOVE.togetherSince);
  const cGrid = $("#countGrid");
  const cLabel = $("#countLabel");
  const cSub = $("#countSub");

  function plural(n, forms) {
    const a = Math.abs(n) % 100, b = a % 10;
    if (a > 10 && a < 20) return forms[2];
    if (b > 1 && b < 5) return forms[1];
    if (b === 1) return forms[0];
    return forms[2];
  }

  function cell(num, unit) {
    return (
      '<div class="count__cell"><span class="count__num">' +
      num +
      '</span><span class="count__unit">' +
      unit +
      "</span></div>"
    );
  }

  function tick() {
    const now = new Date();
    const left = wedding - now;
    const days = Math.floor(Math.abs(left) / 864e5);

    if (left > 0) {
      cLabel.textContent = LOVE.count.before;
      const h = Math.floor((left / 36e5) % 24);
      const m = Math.floor((left / 6e4) % 60);
      const s = Math.floor((left / 1e3) % 60);
      cGrid.innerHTML =
        cell(days, plural(days, ["день", "дня", "дней"])) +
        cell(String(h).padStart(2, "0"), plural(h, ["час", "часа", "часов"])) +
        cell(String(m).padStart(2, "0"), plural(m, ["минута", "минуты", "минут"])) +
        cell(String(s).padStart(2, "0"), plural(s, ["секунда", "секунды", "секунд"]));
    } else {
      cLabel.textContent = LOVE.count.after;
      cGrid.innerHTML = cell(days, plural(days, ["день", "дня", "дней"]));
    }

    const together = Math.floor((now - since) / 864e5);
    if (together > 0) {
      cSub.textContent =
        "И " +
        together +
        " " +
        plural(together, ["день", "дня", "дней"]) +
        ", как я люблю тебя. Считаю каждый.";
    }
  }
  tick();
  setInterval(tick, 1000);

  /* ============================================================
     ПОЯВЛЕНИЕ ПРИ ПРОКРУТКЕ
     ============================================================ */

  /* блокам из разметки появление проставляем здесь,
     чтобы не засорять html: [селектор, оттенок, задержка] */
  [
    [".kicker", "soft", 0],
    [".section-title", "", 0],
    [".section-lead", "soft", 120],
    [".envelope", "", 0],
    [".bouquet__title", "", 0],
    [".count__label", "soft", 0],
    [".count__grid", "", 90],
    [".count__sub", "soft", 200],
    [".count__note", "", 300],
    [".finale__title", "", 0],
    [".finale__text", "soft", 140],
    [".finale__sign", "", 300]
  ].forEach(([sel, kind, delay]) => {
    $$(sel).forEach((el) => {
      if (el.closest(".hero")) return;          // у первого экрана свой выход
      if (el.closest("[data-reveal]")) return;  // родитель уже появляется — хватит
      el.setAttribute("data-reveal", kind);
      if (delay) el.style.setProperty("--d", delay + "ms");
    });
  });

  function showAll() {
    $$("[data-reveal]").forEach((el) => el.classList.add("is-in"));
  }

  if ("IntersectionObserver" in window && !reduced) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("is-in");
            io.unobserve(e.target);
          }
        });
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.12 }
    );
    $$("[data-reveal]").forEach((el) => io.observe(el));

    /* подстраховка: если наблюдатель почему-то молчит — показываем всё,
       что попало в экран, по обычной прокрутке */
    const backup = () => {
      $$("[data-reveal]:not(.is-in)").forEach((el) => {
        if (el.getBoundingClientRect().top < innerHeight * 0.92) el.classList.add("is-in");
      });
    };
    addEventListener("scroll", backup, { passive: true });
    addEventListener("resize", backup, { passive: true });
    setTimeout(backup, 1200);
    /* последний рубеж: текст подарка не может остаться невидимым */
    setTimeout(() => { if (!$("[data-reveal].is-in")) showAll(); }, 5000);
  } else {
    showAll();
  }

  /* ============================================================
     ПАРАЛЛАКС: фото в истории живёт чуть медленнее страницы
     ============================================================ */
  if (!reduced) {
    const layers = $$("[data-parallax]");
    let dirty = true;

    function paint() {
      if (dirty) {
        dirty = false;
        layers.forEach((el) => {
          const r = el.getBoundingClientRect();
          if (r.bottom < -100 || r.top > innerHeight + 100) return;
          const p = (r.top + r.height / 2 - innerHeight / 2) / innerHeight; // -1…1
          el.style.setProperty("--py", (p * -14).toFixed(2) + "px");
        });
      }
      requestAnimationFrame(paint);
    }
    if (layers.length) {
      addEventListener("scroll", () => { dirty = true; }, { passive: true });
      addEventListener("resize", () => { dirty = true; }, { passive: true });
      requestAnimationFrame(paint);
    }
  }

  /* ============================================================
     ЛЕПЕСТКИ
     ============================================================ */
  if (!reduced) {
    const cv = $(".petals");
    const ctx = cv.getContext("2d");
    let w, h, dots = [], raf = null;

    function size() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = cv.width = innerWidth * dpr;
      h = cv.height = innerHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      w = innerWidth; h = innerHeight;
    }

    function seed() {
      const count = innerWidth < 640 ? 10 : 20;
      dots = Array.from({ length: count }, () => ({
        x: Math.random() * innerWidth,
        y: Math.random() * innerHeight,
        r: 4 + Math.random() * 7,
        vy: 0.18 + Math.random() * 0.45,
        vx: -0.25 + Math.random() * 0.5,
        a: Math.random() * Math.PI * 2,
        va: -0.012 + Math.random() * 0.024,
        o: 0.12 + Math.random() * 0.22
      }));
    }

    function draw() {
      ctx.clearRect(0, 0, w, h);
      dots.forEach((d) => {
        d.y += d.vy;
        d.x += d.vx + Math.sin(d.y / 90) * 0.35;
        d.a += d.va;
        if (d.y - d.r > h) { d.y = -d.r * 2; d.x = Math.random() * w; }
        if (d.x < -30) d.x = w + 20;
        if (d.x > w + 30) d.x = -20;
        ctx.save();
        ctx.translate(d.x, d.y);
        ctx.rotate(d.a);
        ctx.globalAlpha = d.o;
        ctx.fillStyle = "#c07d75";
        ctx.beginPath();
        ctx.ellipse(0, 0, d.r * 0.62, d.r, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });
      raf = requestAnimationFrame(draw);
    }

    size(); seed(); draw();
    addEventListener("resize", () => { size(); seed(); });
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) { cancelAnimationFrame(raf); raf = null; }
      else if (!raf) draw();
    });
  }

  /* ============================================================
     МУЗЫКА
     Играет сама, сразу, без вопросов и кнопок.
     Если браузер запретил автозапуск — включится от первого
     касания страницы: пальца, мыши, клавиши или прокрутки.
     ============================================================ */
  if (LOVE.music) {
    const audio = new Audio(LOVE.music);
    audio.loop = true;
    audio.preload = "auto";
    audio.volume = 0;              // громкость поднимем плавно
    const TOP = 0.5;               // громкость музыки: от 0 до 1
    const btn = $("#sound");
    let started = false;

    function mark(on) {
      btn.setAttribute("aria-pressed", on ? "true" : "false");
      btn.setAttribute("aria-label", on ? "Выключить музыку" : "Включить музыку");
    }

    /* плавно выводим громкость, чтобы не било по ушам */
    function fadeIn() {
      const step = () => {
        audio.volume = Math.min(TOP, +(audio.volume + 0.02).toFixed(3));
        if (audio.volume < TOP && !audio.paused) setTimeout(step, 90);
      };
      step();
    }

    const wake = ["pointerdown", "touchstart", "keydown", "wheel", "scroll", "click"];
    function listen(add) {
      wake.forEach((e) =>
        (add ? addEventListener : removeEventListener)(e, start, { passive: true })
      );
    }

    function start() {
      if (started) return;
      audio.play().then(() => {
        started = true;
        btn.hidden = false;
        mark(true);
        fadeIn();
        listen(false);             // сработало — больше ждать нечего
      }).catch(() => {
        /* автозапуск пока запрещён — ждём любого касания */
      });
    }

    /* кнопка нужна только чтобы выключить, а не чтобы включить */
    audio.addEventListener("canplay", () => { btn.hidden = false; }, { once: true });
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (audio.paused) {
        started = false;
        start();
      } else {
        audio.pause();
        mark(false);
      }
    });

    start();                       // пробуем сразу
    listen(true);                  // и подстраховываемся первым касанием
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) start();
    });
  }

  /* ============================================================
     СТАРТ
     ============================================================ */
  function reveal() {
    if (!document.body.classList.contains("is-loading")) return;
    document.body.classList.remove("is-loading");
    /* выкидываем заставку из страницы совсем, чтобы она не ловила клики */
    const l = $("#loader");
    if (l) setTimeout(() => l.remove(), 900);
  }
  if (document.readyState === "complete") reveal();
  else window.addEventListener("load", reveal);
  setTimeout(reveal, 2500); // подстраховка, если фото грузятся долго
})();
