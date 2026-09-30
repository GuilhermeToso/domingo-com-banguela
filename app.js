/* =============================================================================
   onadate — "Grande Aventura" edition — app.js
   All behavior lives here. All editable CONTENT lives in config.js.
   No network calls. Nothing the recipient types ever leaves this device.
   ============================================================================= */
(function () {
  "use strict";

  const state = { date: nextSunday(), time: null, place: "", foodLabel: "", dish: "", cookMode: false };
  const STEPS = ["invite", "date", "food", "card"];
  let currentStep = "invite";

  const $ = (id) => document.getElementById(id);
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const reducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---------------------------------------------------------------------------
  // Night sky: stars
  // ---------------------------------------------------------------------------
  (function makeStars() {
    const box = $("stars");
    for (let i = 0; i < 110; i++) {
      const s = document.createElement("span");
      s.className = "star";
      const size = Math.random() < 0.15 ? 3 : Math.random() < 0.5 ? 2 : 1.4;
      s.style.width = s.style.height = size + "px";
      s.style.left = (Math.random() * 100) + "%";
      s.style.top = (Math.random() * 72) + "%";
      s.style.setProperty("--d", (2 + Math.random() * 4).toFixed(2) + "s");
      s.style.setProperty("--delay", (-Math.random() * 5).toFixed(2) + "s");
      box.appendChild(s);
    }
  })();

  // ---------------------------------------------------------------------------
  // Toothless — mood engine
  // ---------------------------------------------------------------------------
  const dragon = $("dragon");
  const backSvg = dragon.querySelector(".tl-back");
  const T = {
    head: $("tl-head"),
    earL: $("tl-ear-l"), earR: $("tl-ear-r"),
    lidL: $("tl-lid-l"), lidR: $("tl-lid-r"),
    browL: $("tl-brow-l"), browR: $("tl-brow-r"),
    pupils: dragon.querySelectorAll(".tl-pupil"),
    pupilsG: $("tl-pupils"),
    eyesOpen: $("tl-eyes-open"), eyesHappy: $("tl-eyes-happy"),
    tears: $("tl-tears"), blush: $("tl-blush"),
    mouth: $("tl-mouth"), gums: $("tl-gums"), tongue: $("tl-tongue"),
    teeth: $("tl-teeth"), glow: $("tl-glow"),
    chinPaw: $("tl-chin-paw"), pawR: $("tl-paw-r"),
  };

  const MOUTHS = {
    neutral: { d: "M90 160 Q120 170 150 160", fill: "none" },
    smile:   { d: "M84 155 Q120 178 156 155", fill: "none" },
    flat:    { d: "M94 166 Q120 161 146 165", fill: "none" },
    sad:     { d: "M96 171 Q120 155 144 171", fill: "none" },
    wobble:  { d: "M92 172 Q100 161 108 166 Q114 159 120 165 Q126 159 132 166 Q140 161 148 172", fill: "none" },
    love:    { d: "M100 161 Q120 173 140 161", fill: "none" },
    grin:    { d: "M80 152 Q120 148 160 152 Q152 186 120 186 Q88 186 80 152Z", fill: "#6e1a30", gums: true, tongue: true },
    snarl:   { d: "M84 160 Q120 150 156 160 Q150 181 120 181 Q90 181 84 160Z", fill: "#2a0a12", teeth: true },
  };

  // lid: [inner, outer] y of the lid's lower edge (eye spans y 100–144)
  // pupil: [rx, ry]; ear: + perks up, − flattens/droops; fx: body animation
  const MOODS = {
    neutral: { lid: [96, 96],   mouth: "neutral", ear: 0,   pupil: [7, 15] },
    content: { lid: [96, 96],   mouth: "smile",   ear: 6,   pupil: [10, 16] },
    happy:   { happyEyes: true, mouth: "grin",    ear: 16,  blush: true, fx: "hop" },
    angry1:  { lid: [108, 99],  mouth: "flat",    ear: -16, pupil: [4.5, 15] },
    angry2:  { lid: [116, 101], mouth: "snarl",   ear: -32, pupil: [2.6, 17] },
    angry3:  { lid: [122, 104], mouth: "snarl",   ear: -44, pupil: [2, 18], glow: true, fx: "shake" },
    sad1:    { lid: [99, 108],  mouth: "sad",     ear: -30, pupil: [11, 16] },
    sad2:    { lid: [100, 114], mouth: "sad",     ear: -50, pupil: [13, 17], tears: true },
    sad3:    { lid: [101, 119], mouth: "wobble",  ear: -66, pupil: [14.5, 18], tears: true, fx: "sob" },
    love:    { lid: [105, 105], mouth: "love",    ear: 10,  pupil: [13, 17], blush: true, chin: true, tilt: 9, fx: "sway" },
  };

  let curMood = "neutral";
  let baseMood = "neutral";   // what he goes back to after a temporary face (e.g. hovering "Sim")
  let moodTilt = 0;

  const show = (el, on) => { el.style.display = on ? "" : "none"; };

  function setLids(inner, outer) {
    T.lidL.setAttribute("d", "M60 84 L116 84 L116 " + inner + " L60 " + outer + "Z");
    T.lidR.setAttribute("d", "M124 84 L180 84 L180 " + outer + " L124 " + inner + "Z");
    T.browL.setAttribute("d", "M63 " + outer + " L113 " + inner);
    T.browR.setAttribute("d", "M127 " + inner + " L177 " + outer);
  }

  function setMood(name) {
    const m = MOODS[name];
    if (!m) return;
    curMood = name;
    show(T.eyesOpen, !m.happyEyes);
    show(T.eyesHappy, !!m.happyEyes);
    if (m.lid) setLids(m.lid[0], m.lid[1]);
    if (m.pupil) T.pupils.forEach((p) => { p.setAttribute("rx", m.pupil[0]); p.setAttribute("ry", m.pupil[1]); });
    const mo = MOUTHS[m.mouth];
    T.mouth.setAttribute("d", mo.d);
    T.mouth.setAttribute("fill", mo.fill);
    show(T.gums, !!mo.gums);
    show(T.tongue, !!mo.tongue);
    show(T.teeth, !!mo.teeth);
    show(T.glow, !!m.glow);
    show(T.tears, !!m.tears);
    show(T.blush, !!m.blush);
    show(T.chinPaw, !!m.chin);
    show(T.pawR, !m.chin);
    T.earL.style.transform = "rotate(" + m.ear + "deg)";
    T.earR.style.transform = "rotate(" + (-m.ear) + "deg)";
    moodTilt = m.tilt || 0;
    ["hop", "shake", "sob", "sway"].forEach((fx) => dragon.classList.toggle("fx-" + fx, m.fx === fx));
    dragon.classList.toggle("charging", !!m.glow);
  }

  // blink now and then (skipped when his eyes are closed-happy)
  (function blinkLoop() {
    setTimeout(() => {
      const m = MOODS[curMood];
      if (m && m.lid && !reducedMotion) {
        setLids(146, 146);
        setTimeout(() => { const n = MOODS[curMood]; if (n.lid) setLids(n.lid[0], n.lid[1]); }, 120);
      }
      blinkLoop();
    }, 2400 + Math.random() * 3200);
  })();

  // ---------------------------------------------------------------------------
  // Toothless — head + eyes follow a target (the "Não" button on the invite)
  // ---------------------------------------------------------------------------
  let pointer = null;
  let hoverSim = false;
  let trackDeg = 0, curDeg = 0, pupX = 0, pupY = 0;
  document.addEventListener("pointermove", (e) => { pointer = { x: e.clientX, y: e.clientY }; });

  function centerOf(el) {
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }

  function lookTarget() {
    if (currentStep === "invite") return hoverSim ? centerOf(simBtn) : centerOf(noBtn);
    if (currentStep === "date") return pointer;
    return null; // food: dreamy, looks at nothing in particular
  }

  function trackLoop() {
    requestAnimationFrame(trackLoop);
    if (dragon.hidden) return;
    const r = backSvg.getBoundingClientRect();
    const hx = r.left + r.width * 0.5, hy = r.top + r.height * 0.56;
    const t = lookTarget();
    let tx = 0, ty = 0;
    trackDeg = 0;
    if (t) {
      const dx = t.x - hx, dy = t.y - hy;
      const d = Math.hypot(dx, dy) || 1;
      trackDeg = clamp(dx / 9, -24, 24);
      const reach = Math.min(6, d / 18);
      tx = (dx / d) * reach;
      ty = (dy / d) * reach;
    }
    curDeg += (trackDeg + moodTilt - curDeg) * 0.12;
    pupX += (tx - pupX) * 0.2;
    pupY += (ty - pupY) * 0.2;
    T.head.style.transform = "rotate(" + curDeg.toFixed(2) + "deg)";
    T.pupilsG.setAttribute("transform", "translate(" + pupX.toFixed(2) + " " + pupY.toFixed(2) + ")");
  }

  // ---------------------------------------------------------------------------
  // Toothless — hearts from his eyes (food step)
  // ---------------------------------------------------------------------------
  const HEART_COLORS = ["#ff5c8a", "#ff85a8", "#ff3d6e", "#ffb3c8", "#ff6fae"];
  let heartTimer = null;

  function spawnHeart(eye) {
    const h = document.createElement("span");
    h.className = "heart";
    h.textContent = "♥";
    // eye centres in the 240x220 viewBox: (88,122) and (152,122); nudge for his head tilt
    h.style.left = (eye === 0 ? 38 : 64.5) + "%";
    h.style.top = (eye === 0 ? 52 : 56) + "%";
    h.style.color = pick(HEART_COLORS);
    h.style.setProperty("--s", (0.7 + Math.random() * 0.9).toFixed(2));
    h.style.setProperty("--dx", (Math.random() * 60 - 30).toFixed(0) + "px");
    h.style.setProperty("--rot", (Math.random() * 40 - 20).toFixed(0) + "deg");
    h.addEventListener("animationend", () => h.remove());
    dragon.appendChild(h);
  }
  function startHearts() {
    stopHearts();
    let i = 0;
    heartTimer = setInterval(() => spawnHeart(i++ % 2), reducedMotion ? 900 : 300);
  }
  function stopHearts() {
    clearInterval(heartTimer);
    heartTimer = null;
    dragon.querySelectorAll(".heart").forEach((h) => h.remove());
  }

  // ---------------------------------------------------------------------------
  // Step state machine
  // ---------------------------------------------------------------------------
  function placeDragon(name) {
    const stage = $("step-" + name).querySelector(".stage[data-dragon]");
    if (!stage) { dragon.hidden = true; return; }
    dragon.hidden = false;
    stage.insertBefore(dragon, stage.firstChild);
    dragon.classList.remove("rise");
    void dragon.offsetWidth;
    dragon.classList.add("rise"); // pop up from behind the card
  }

  function goToStep(name) {
    currentStep = name;
    STEPS.forEach((s) => {
      const el = $("step-" + s);
      if (s === name) {
        el.hidden = false;
        const card = el.querySelector(".card");
        if (card) {
          card.classList.remove("pop");
          void card.offsetWidth;
          card.classList.add("pop");
        }
      } else {
        el.hidden = true;
      }
    });
    const nb = $("btn-nao");
    if (nb && nb.classList.contains("loose")) nb.style.display = name === "invite" ? "" : "none";

    placeDragon(name);
    stopHearts();
    if (name === "invite") { baseMood = "neutral"; setMood("neutral"); }
    if (name === "date")   { baseMood = "content"; setMood("content"); }
    if (name === "food")   { baseMood = "love"; setMood("love"); startHearts(); }
    if (name === "card")   { startCelebration(); }
    window.scrollTo(0, 0);
  }

  function applyConfig() {
    $("invite-title").textContent = CONFIG.inviteTitle;
    $("date-title").textContent = CONFIG.dateTitle + " 📍";
    $("food-title").textContent = CONFIG.foodTitle + " ✨";
    $("dish-prompt").textContent = CONFIG.cookOption.prompt;
    $("dish-input").placeholder = CONFIG.cookOption.placeholder;
  }

  // ---------------------------------------------------------------------------
  // Invitation
  // ---------------------------------------------------------------------------
  const simBtn = $("btn-sim");
  const noBtn = $("btn-nao");
  const noMsg = $("no-msg");
  let lastMsgIndex = -1;
  let noCount = 0;
  let accepted = false;

  // hovering "Sim" → very happy; leaving → back to whatever he was feeling
  simBtn.addEventListener("pointerenter", () => { hoverSim = true; setMood("happy"); });
  simBtn.addEventListener("pointerleave", () => { if (accepted) return; hoverSim = false; setMood(baseMood); });
  simBtn.addEventListener("click", () => {
    if (accepted) return;
    accepted = true;
    hoverSim = true;
    setMood("happy");
    for (let i = 0; i < 6; i++) setTimeout(() => spawnHeart(i % 2), i * 70);
    setTimeout(() => { hoverSim = false; goToStep("date"); }, 700);
  });

  // every "Não" attempt makes him angrier… or sadder
  function upsetDragon() {
    noCount++;
    const lvl = noCount <= 2 ? 1 : noCount <= 5 ? 2 : 3;
    baseMood = (Math.random() < 0.5 ? "angry" : "sad") + lvl;
    if (!hoverSim) setMood(baseMood);
  }

  function showNoMessage() {
    const pool = CONFIG.noMessages;
    let i;
    do {
      i = Math.floor(Math.random() * pool.length);
    } while (pool.length > 1 && i === lastMsgIndex);
    lastMsgIndex = i;
    noMsg.textContent = pool[i];
    noMsg.hidden = false;
    noMsg.style.animation = "none";
    void noMsg.offsetWidth;
    noMsg.style.animation = "";
  }

  // "Não" glides to a random nearby point. It's lifted onto <body> the first
  // time it moves, because the card's transform animation would otherwise
  // become the containing block for position:fixed.
  let lastDodge = 0;
  let detached = false;
  let noX = 0, noY = 0;
  let simGrow = 0;

  function growSim() {
    simGrow = Math.min(0.34, simGrow + 0.035);
    simBtn.style.setProperty("--sim-grow", String(simGrow));
  }

  function pointerNearNo(px, py, margin) {
    const r = noBtn.getBoundingClientRect();
    return px > r.left - margin && px < r.right + margin &&
           py > r.top - margin && py < r.bottom + margin;
  }

  function dodge(px, py) {
    if (!detached) {
      const r = noBtn.getBoundingClientRect();
      noX = r.left;
      noY = r.top;
      document.body.appendChild(noBtn);
      noBtn.classList.add("loose");
      detached = true;
    }

    const w = noBtn.offsetWidth || 90;
    const h = noBtn.offsetHeight || 48;
    const vw = document.documentElement.clientWidth;
    const vh = document.documentElement.clientHeight;
    const pad = 10;
    const maxLeft = Math.max(pad, vw - w - pad);
    const maxTop = Math.max(pad, vh - h - pad);
    const rangeX = 0.15 * vw;
    const rangeY = 0.15 * vh;

    let left = noX, top = noY;
    for (let i = 0; i < 12; i++) {
      left = clamp(noX + (Math.random() * 2 - 1) * rangeX, pad, maxLeft);
      top = clamp(noY + (Math.random() * 2 - 1) * rangeY, pad, maxTop);
      if (px == null) break;
      const ccx = left + w / 2, ccy = top + h / 2;
      if (Math.hypot(ccx - px, ccy - py) > 80) break;
    }

    noX = left;
    noY = top;
    noBtn.style.left = left + "px";
    noBtn.style.top = top + "px";
    growSim();
    showNoMessage();
    upsetDragon();
  }

  document.addEventListener("mousemove", (e) => {
    if (currentStep !== "invite") return;
    const t = Date.now();
    if (t - lastDodge < 200) return;
    if (pointerNearNo(e.clientX, e.clientY, 50)) {
      lastDodge = t;
      dodge(e.clientX, e.clientY);
    }
  });

  noBtn.addEventListener("touchstart", (e) => {
    e.preventDefault();
    const tp = e.touches[0] || e.changedTouches[0];
    dodge(tp ? tp.clientX : null, tp ? tp.clientY : null);
  }, { passive: false });
  noBtn.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "touch") {
      e.preventDefault();
      dodge(e.clientX, e.clientY);
    }
  });
  noBtn.addEventListener("click", (e) => {
    e.preventDefault();
    showNoMessage();
    upsetDragon();
  });

  // ---------------------------------------------------------------------------
  // Date step — the further away, the sadder he gets
  // ---------------------------------------------------------------------------
  const timeInput = $("time-input");
  const placeInput = $("place-input");
  const dateMsg = $("date-msg");
  const dateContinue = $("date-continue");
  placeInput.placeholder = CONFIG.placePlaceholder;

  function updateDateContinue() {
    state.time = timeInput.value || null;
    state.place = placeInput.value.trim();
    const ok = !!(state.time && state.place);
    dateContinue.disabled = !ok;
    dateMsg.textContent = ok ? "Combinado! o Banguela aprovou 🐉" : "";
    setMood(baseMood = ok ? "happy" : "content");
  }
  ["change", "input"].forEach((ev) => {
    timeInput.addEventListener(ev, updateDateContinue);
    placeInput.addEventListener(ev, updateDateContinue);
  });

  dateContinue.addEventListener("click", () => {
    if (!state.time) {
      dateMsg.textContent = "que horas? 🕐";
      return;
    }
    if (!state.place) {
      dateMsg.textContent = "e onde a gente se encontra? 📍";
      return;
    }
    goToStep("food");
  });

  // ---------------------------------------------------------------------------
  // Food step
  // ---------------------------------------------------------------------------
  const foodChips = $("food-chips");
  const dishWrap = $("dish-wrap");
  const dishInput = $("dish-input");
  const foodContinue = $("food-continue");

  function buildFoodChips() {
    CONFIG.foodOptions.forEach((opt) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "chip";
      b.textContent = opt.emoji + " " + opt.label;
      b.addEventListener("click", () => selectFood(b, opt.label, false));
      foodChips.appendChild(b);
    });
    const cook = document.createElement("button");
    cook.type = "button";
    cook.className = "chip special";
    cook.textContent = CONFIG.cookOption.emoji + " " + CONFIG.cookOption.label;
    cook.addEventListener("click", () => selectFood(cook, CONFIG.cookOption.label, true));
    foodChips.appendChild(cook);
  }

  function selectFood(btn, label, isCook) {
    Array.prototype.forEach.call(foodChips.children, (c) => c.classList.remove("selected"));
    btn.classList.add("selected");
    state.cookMode = isCook;
    state.foodLabel = label;
    if (isCook) {
      dishWrap.hidden = false;
      dishInput.focus();
      foodContinue.disabled = dishInput.value.trim() === "";
    } else {
      dishWrap.hidden = true;
      state.dish = "";
      foodContinue.disabled = false;
    }
  }

  dishInput.addEventListener("input", () => {
    if (state.cookMode) foodContinue.disabled = dishInput.value.trim() === "";
  });

  foodContinue.addEventListener("click", () => {
    if (state.cookMode) {
      state.dish = dishInput.value.trim() || CONFIG.cookOption.fallbackDish;
    }
    buildCard();
    goToStep("card");
  });

  // ---------------------------------------------------------------------------
  // Result card
  // ---------------------------------------------------------------------------
  function foodText() {
    return state.cookMode ? CONFIG.cookOption.emoji + " " + state.dish : state.foodLabel;
  }
  function signName() {
    return CONFIG.MY_NAME && CONFIG.MY_NAME.trim() ? CONFIG.MY_NAME.trim() : "eu";
  }

  function buildCard() {
    $("card-kicker").textContent = CONFIG.cardKicker;
    $("card-date").textContent = "📅 " + formatDate(state.date);
    const timeChip = $("card-time");
    if (state.time) {
      timeChip.textContent = "🕐 " + formatTime(state.time);
      timeChip.hidden = false;
    } else {
      timeChip.hidden = true;
    }
    $("card-place").textContent = "📍 " + state.place;
    $("card-food").textContent = foodText();
    $("card-signoff").textContent = '"' + CONFIG.signoffLine + '" — ' + signName();
  }

  // ---------------------------------------------------------------------------
  // Celebration: Toothless flies around + fireworks
  // ---------------------------------------------------------------------------
  const flyer = $("flyer");
  const canvas = $("fireworks");
  const ctx = canvas.getContext("2d");
  const GRAVITY = 0.05;
  const FW_COLORS = [
    ["#8fd8ff", "#6b8cff", "#ffffff"],
    ["#ffd76a", "#ffb347", "#fff3c4"],
    ["#ff8fb1", "#ff5c8a", "#ffd1dc"],
    ["#b58cff", "#7f5cff", "#e6dcff"],
    ["#a8e05f", "#dfff9e", "#ffffff"],
  ];
  const PLASMA = ["#ffffff", "#8fd8ff", "#6b8cff", "#9d7bff"];
  let particles = [], rockets = [], shots = [];
  let celebrating = false;
  let mouth = { x: 0, y: 0, dir: 1 };

  function sizeCanvas() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function burst(x, y, colors, n, power) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = (0.8 + Math.random() * 3.6) * (power || 1);
      particles.push({
        x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
        life: 1, decay: 0.011 + Math.random() * 0.012,
        size: 1.8 + Math.random() * 2, color: pick(colors),
      });
    }
  }

  function launchRocket() {
    const W = window.innerWidth, H = window.innerHeight;
    const ty = H * (0.1 + Math.random() * 0.38);
    const y0 = H + 10;
    rockets.push({
      x: W * (0.08 + Math.random() * 0.84), y: y0,
      vx: (Math.random() - 0.5) * 1.4,
      vy: -Math.sqrt(2 * GRAVITY * (y0 - ty)),
      colors: pick(FW_COLORS),
    });
  }

  // Night Fury plasma blast, fired from his mouth
  function plasmaShot() {
    shots.push({ x: mouth.x, y: mouth.y, vx: mouth.dir * 9, vy: -1.5, ttl: 26 });
  }

  function fwLoop() {
    if (!celebrating) return;
    requestAnimationFrame(fwLoop);
    const W = window.innerWidth, H = window.innerHeight;
    ctx.globalCompositeOperation = "destination-out";
    ctx.fillStyle = "rgba(0,0,0,0.16)";
    ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = "lighter";

    rockets = rockets.filter((r) => {
      r.x += r.vx; r.y += r.vy; r.vy += GRAVITY;
      ctx.globalAlpha = 1;
      ctx.fillStyle = "#fff6d0";
      ctx.beginPath(); ctx.arc(r.x, r.y, 2, 0, Math.PI * 2); ctx.fill();
      if (r.vy >= -0.6) { burst(r.x, r.y, r.colors, 80, 1); return false; }
      return true;
    });

    shots = shots.filter((s) => {
      s.x += s.vx; s.y += s.vy; s.ttl--;
      ctx.globalAlpha = 0.9;
      ctx.fillStyle = "#8fd8ff";
      ctx.beginPath(); ctx.arc(s.x, s.y, 6, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.beginPath(); ctx.arc(s.x, s.y, 3, 0, Math.PI * 2); ctx.fill();
      if (s.ttl <= 0) { burst(s.x, s.y, PLASMA, 110, 1.35); return false; }
      return true;
    });

    particles = particles.filter((p) => {
      p.x += p.vx; p.y += p.vy;
      p.vx *= 0.985; p.vy = p.vy * 0.985 + GRAVITY * 0.8;
      p.life -= p.decay;
      if (p.life <= 0) return false;
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
      return true;
    });
    ctx.globalAlpha = 1;
  }

  // figure-eight flight path around the screen
  function flyLoop(ts) {
    if (!celebrating) return;
    requestAnimationFrame(flyLoop);
    const t = ts / 1000;
    const W = window.innerWidth, H = window.innerHeight;
    const fw = flyer.offsetWidth, fh = flyer.offsetHeight;
    const ax = Math.max(0, W / 2 - fw / 2 - 6), ay = H * 0.34;
    const x = W / 2 + ax * Math.sin(t * 0.5) - fw / 2;
    const y = H * 0.44 + ay * Math.sin(t * 1.0 + 0.8) - fh / 2;
    const vx = ax * 0.5 * Math.cos(t * 0.5);
    const vy = ay * 1.0 * Math.cos(t * 1.0 + 0.8);
    const dir = vx >= 0 ? 1 : -1;
    const ang = clamp(Math.atan2(vy, Math.abs(vx)) * 180 / Math.PI, -28, 28);
    flyer.style.transform =
      "translate(" + x.toFixed(1) + "px," + y.toFixed(1) + "px) scaleX(" + dir + ") rotate(" + ang.toFixed(1) + "deg)";
    // his mouth is at ~(255,100) in the 300x180 viewBox
    mouth.dir = dir;
    mouth.x = dir > 0 ? x + fw * (255 / 300) : x + fw * (45 / 300);
    mouth.y = y + fh * (100 / 180);
  }

  function startCelebration() {
    if (celebrating) return;
    celebrating = true;
    sizeCanvas();
    window.addEventListener("resize", sizeCanvas);
    flyer.hidden = false;
    if (reducedMotion) {
      flyer.style.transform = "translate(" + (window.innerWidth / 2 - flyer.offsetWidth / 2) + "px,16px)";
    } else {
      requestAnimationFrame(flyLoop);
    }
    requestAnimationFrame(fwLoop);
    // opening salvo
    for (let i = 0; i < 4; i++) setTimeout(launchRocket, i * 180);
    let n = 0;
    setInterval(() => {
      launchRocket();
      if (!reducedMotion && ++n % 4 === 0) plasmaShot();
    }, reducedMotion ? 1600 : 650);
  }

  // ---------------------------------------------------------------------------
  // Copy to clipboard, with fallback
  // ---------------------------------------------------------------------------
  const btnCopy = $("btn-copy");
  const toast = $("toast");

  btnCopy.addEventListener("click", async () => {
    const text =
      CONFIG.cardKicker + "\n" +
      "📅 " + formatDate(state.date) + (state.time ? " · 🕐 " + formatTime(state.time) : "") + "\n" +
      foodText() + "\n\n" +
      '"' + CONFIG.signoffLine + '" — ' + signName();
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        showToast("copiado! 💙");
      } else {
        throw new Error("clipboard unavailable");
      }
    } catch (err) {
      legacyCopy(text);
    }
  });

  function legacyCopy(text) {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.top = "-1000px";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    try {
      const ok = document.execCommand("copy");
      showToast(ok ? "copiado! 💙" : "copia esse texto e me manda 💙");
    } catch (e) {
      showToast("copia esse texto e me manda 💙");
    }
    document.body.removeChild(ta);
  }

  let toastTimer = null;
  function showToast(msg) {
    toast.textContent = msg;
    toast.hidden = false;
    void toast.offsetWidth;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.classList.remove("show");
      setTimeout(() => (toast.hidden = true), 220);
    }, 1800);
  }

  // ---------------------------------------------------------------------------
  // Download the card as a PNG, with screenshot fallback
  // ---------------------------------------------------------------------------
  const btnImg = $("btn-img");
  const resultCard = $("result-card");

  btnImg.addEventListener("click", async () => {
    if (typeof html2canvas !== "function") {
      showToast("tira um print 📸 e me manda");
      return;
    }
    const label = btnImg.textContent;
    btnImg.disabled = true;
    btnImg.textContent = "gerando...";
    try {
      if (document.fonts && document.fonts.ready) await document.fonts.ready;
      const canvasImg = await html2canvas(resultCard, {
        backgroundColor: "#f1dfb8",
        scale: Math.min(3, window.devicePixelRatio * 2 || 2),
        useCORS: true,
        onclone: (doc) => {
          const c = doc.getElementById("result-card");
          if (c) {
            c.style.animation = "none";
            c.style.opacity = "1";
            c.style.transform = "none";
            c.classList.remove("pop");
            c.querySelectorAll("*").forEach((el) => {
              el.style.animation = "none";
              el.style.opacity = "1";
            });
          }
        },
      });
      const link = document.createElement("a");
      link.download = "grande-aventura.png";
      link.href = canvasImg.toDataURL("image/png");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast("imagem salva! 💙");
    } catch (err) {
      showToast("deu ruim — tira um print 📸");
    } finally {
      btnImg.disabled = false;
      btnImg.textContent = label;
    }
  });

  // ---------------------------------------------------------------------------
  // Date helpers
  // ---------------------------------------------------------------------------
  function nextSunday() {
    const d = startOfDay(new Date());
    d.setDate(d.getDate() + ((7 - d.getDay()) % 7));
    return d;
  }
  function startOfDay(d) {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
  }
  function toISO(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return y + "-" + m + "-" + day;
  }
  function parseLocalISO(iso) {
    const parts = iso.split("-").map(Number);
    return new Date(parts[0], parts[1] - 1, parts[2]);
  }
  function formatDate(d) {
    if (!d) return "";
    try {
      return new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "numeric", month: "long" }).format(d);
    } catch (e) {
      return d.toLocaleDateString("pt-BR");
    }
  }
  function formatTime(t) {
    return t ? t.replace(":", "h") : "";
  }

  // ---------------------------------------------------------------------------
  // Init
  // ---------------------------------------------------------------------------
  applyConfig();
  buildFoodChips();
  goToStep("invite");
  requestAnimationFrame(trackLoop);
})();
